// backend/src/auth/AuthService.ts

import { Env } from '../index';
import { EmailService } from '../services/email';
import { SmsService } from '../services/sms';
import { AlertService } from '../services/alert';
import * as bcrypt from 'bcryptjs';
import * as speakeasy from 'speakeasy';
import * as QRCode from 'qrcode';

export type UserType = 'user' | 'fiel';

export class AuthService {
  private env: Env;
  private emailService: EmailService;
  private smsService: SmsService;
  private alertService: AlertService;
  
  constructor(env: Env) {
    this.env = env;
    this.emailService = new EmailService(env.RESEND_API_KEY, env.FROM_EMAIL);
    this.smsService = new SmsService(env.TWILIO_ACCOUNT_SID, env.TWILIO_AUTH_TOKEN);
    this.alertService = new AlertService(env);
  }
  
  // ==================== LOGIN UNIFICADO ====================
  async login(email: string, senha: string, userType: UserType, ip: string, userAgent: string) {
    // 1. Verificar bloqueio no KV
    const blockKey = `block:${userType}:${email}`;
    const blocked = await this.env.KV.get(blockKey);
    if (blocked) {
      const blockData = JSON.parse(blocked);
      if (blockData.expires > Date.now()) {
        const remainingMinutes = Math.ceil((blockData.expires - Date.now()) / 60000);
        
        // Registrar tentativa bloqueada
        await this.logAccess(email, userType, ip, userAgent, false, 'bloqueado');
        
        return { 
          success: false, 
          error: `🔒 Muitas tentativas. Aguarde ${remainingMinutes} minutos.` 
        };
      }
    }
    
    // 2. Buscar usuário na tabela correta
    const table = userType === 'user' ? 'users' : 'fieis';
    const user = await this.env.DB.prepare(`
      SELECT * FROM ${table} 
      WHERE email = ? AND status = 'active'
    `).bind(email).first();
    
    if (!user) {
      await this.registerAttempt(email, userType, ip, false, 'usuario_nao_encontrado');
      await this.logAccess(email, userType, ip, userAgent, false, 'usuario_nao_encontrado');
      return { success: false, error: '❌ Email ou senha incorretos' };
    }
    
    // 3. Verificar senha
    const senhaValida = await bcrypt.compare(senha, user.senha_hash);
    if (!senhaValida) {
      await this.registerAttempt(email, userType, ip, false, 'senha_errada');
      await this.logAccess(email, userType, ip, userAgent, false, 'senha_errada');
      
      // 🚨 ENVIAR ALERTA DE TENTATIVA FALHA
      await this.alertService.sendAccessAlert({
        email: user.email,
        nome: user.nome,
        userType,
        ip,
        userAgent,
        timestamp: new Date(),
        success: false,
        failureReason: 'senha_errada'
      });
      
      return { success: false, error: '❌ Email ou senha incorretos' };
    }
    
    // 4. Login bem-sucedido, resetar tentativas
    await this.registerAttempt(email, userType, ip, true, null);
    
    // 5. Verificar se precisa de 2FA
    if (user.twofa_enabled === 1 && user.twofa_secret) {
      // Gerar código 2FA
      const twoFACode = this.generate2FACode();
      const twoFAKey = `${userType}:2fa:${user.id}`;
      await this.env.KV.put(twoFAKey, twoFACode, { expirationTtl: 300 });
      
      // Enviar código 2FA por email
      await this.emailService.sendEmail(
        email,
        '🔐 Código de verificação - Santuário de Fátima',
        this.generate2FAEmail(user.nome, twoFACode, ip, new Date())
      );
      
      // Registrar envio do código
      await this.recordVerificationCodeSent(email, userType, '2fa', 'email', ip);
      
      return {
        success: true,
        step: '2fa',
        userId: user.id,
        nome: user.nome,
        email: user.email,
        requires2FA: true
      };
    }
    
    // 6. Gerar PIN de 4 dígitos
    const pin = this.generatePIN();
    const pinKey = `${userType}:pin:${user.id}`;
    await this.env.KV.put(pinKey, pin, { expirationTtl: 300 });
    
    // Enviar PIN por email
    await this.emailService.sendEmail(
      email,
      '🔐 Seu código de acesso',
      this.generatePinEmail(user.nome, pin, ip, new Date())
    );
    
    // Registrar envio do PIN
    await this.recordVerificationCodeSent(email, userType, 'pin', 'email', ip);
    
    // 7. Registrar log de acesso bem-sucedido (parcial)
    await this.logAccess(email, userType, ip, userAgent, true, null);
    
    return {
      success: true,
      step: 'pin',
      userId: user.id,
      nome: user.nome,
      email: user.email
    };
  }
  
  // ==================== VERIFICAR 2FA ====================
  async verify2FA(userId: number, code: string, userType: UserType, ip: string) {
    const twoFAKey = `${userType}:2fa:${userId}`;
    const storedCode = await this.env.KV.get(twoFAKey);
    
    if (!storedCode || storedCode !== code) {
      // Tentativa de 2FA inválida
      const table = userType === 'user' ? 'users' : 'fieis';
      const user = await this.env.DB.prepare(
        `SELECT email FROM ${table} WHERE id = ?`
      ).bind(userId).first();
      
      if (user) {
        await this.logAccess(user.email, userType, ip, '', false, '2fa_invalido');
      }
      
      return { success: false, error: '❌ Código 2FA inválido ou expirado' };
    }
    
    // Remover código usado
    await this.env.KV.delete(twoFAKey);
    
    // Gerar PIN após 2FA
    const pin = this.generatePIN();
    const pinKey = `${userType}:pin:${userId}`;
    await this.env.KV.put(pinKey, pin, { expirationTtl: 300 });
    
    // Buscar email do usuário
    const table = userType === 'user' ? 'users' : 'fieis';
    const user = await this.env.DB.prepare(
      `SELECT email, nome FROM ${table} WHERE id = ?`
    ).bind(userId).first();
    
    // Enviar PIN
    await this.emailService.sendEmail(
      user.email,
      '🔐 Seu código de acesso',
      this.generatePinEmail(user.nome, pin, ip, new Date())
    );
    
    return {
      success: true,
      step: 'pin'
    };
  }
  
  // ==================== VERIFICAR PIN ====================
  async verifyPIN(userId: number, pin: string, userType: UserType, ip: string, userAgent: string) {
    const pinKey = `${userType}:pin:${userId}`;
    const storedPin = await this.env.KV.get(pinKey);
    
    if (!storedPin || storedPin !== pin) {
      // Tentativa de PIN inválida
      const table = userType === 'user' ? 'users' : 'fieis';
      const user = await this.env.DB.prepare(
        `SELECT email FROM ${table} WHERE id = ?`
      ).bind(userId).first();
      
      if (user) {
        await this.logAccess(user.email, userType, ip, userAgent, false, 'pin_invalido');
      }
      
      return { success: false, error: '❌ PIN inválido ou expirado' };
    }
    
    // Remover PIN usado
    await this.env.KV.delete(pinKey);
    
    // Buscar usuário completo
    const table = userType === 'user' ? 'users' : 'fieis';
    const user = await this.env.DB.prepare(
      `SELECT * FROM ${table} WHERE id = ?`
    ).bind(userId).first();
    
  
    
    // Salvar sessão no KV
    const sessionKey = `session:${userType}:${token}`;
    await this.env.KV.put(sessionKey, JSON.stringify({
      userId: user.id,
      email: user.email,
      expires: Date.now() + 86400000 // 24 horas
    }), { expirationTtl: 86400 });
    
    // Salvar sessão no D1
    await this.env.DB.prepare(`
      INSERT INTO active_sessions (session_token, user_type, user_id, ip_address, user_agent, expires_at)
      VALUES (?, ?, ?, ?, ?, datetime('now', '+1 day'))
    `).bind(token, userType, user.id, ip, userAgent).run();
    
    // Atualizar último login
    await this.env.DB.prepare(`
      UPDATE ${table} 
      SET last_login_at = CURRENT_TIMESTAMP,
          last_login_ip = ?
      WHERE id = ?
    `).bind(ip, userId).run();
    
    // Registrar log de acesso bem-sucedido final
    await this.logAccess(user.email, userType, ip, userAgent, true, null);
    
    // Verificar se é novo dispositivo e enviar alerta
    const lastSession = await this.env.DB.prepare(`
      SELECT ip_address FROM active_sessions 
      WHERE user_type = ? AND user_id = ? AND session_token != ?
      ORDER BY created_at DESC LIMIT 1
    `).bind(userType, user.id, token).first();
    
    const isNewDevice = !lastSession || lastSession.ip_address !== ip;
    
    if (isNewDevice && userType === 'fiel') {
      // Enviar alerta de novo dispositivo apenas para fiéis
      await this.alertService.sendNewDeviceAlert(
        user.email,
        user.nome,
        this.parseUserAgent(userAgent),
        ip,
        await this.getLocationFromIP(ip)
      );
    }
    
    return {
      success: true,
      token,
      user: {
        id: user.id,
        nome: user.nome,
        email: user.email,
        type: userType
      }
    };
  }
  
  // ==================== SETUP 2FA ====================
  async setup2FA(userId: number, userType: UserType) {
    // Gerar secret 2FA
    const secret = speakeasy.generateSecret({
      name: `Santuário de Fátima (${userType === 'user' ? 'Coordenação' : 'Fiel'})`,
      issuer: 'Santuário de Fátima'
    });
    
    // Salvar secret temporariamente
    const tempKey = `2fa_temp:${userType}:${userId}`;
    await this.env.KV.put(tempKey, secret.base32, { expirationTtl: 600 });
    
    // Gerar QR Code
    const qrCode = await QRCode.toDataURL(secret.otpauth_url);
    
    return {
      success: true,
      qrCode,
      secret: secret.base32
    };
  }
  
  // ==================== ATIVAR 2FA ====================
  async enable2FA(userId: number, code: string, userType: UserType) {
    const tempKey = `2fa_temp:${userType}:${userId}`;
    const secret = await this.env.KV.get(tempKey);
    
    if (!secret) {
      return { success: false, error: 'Sessão expirada. Refaça o processo.' };
    }
    
    const verified = speakeasy.totp.verify({
      secret: secret,
      encoding: 'base32',
      token: code
    });
    
    if (!verified) {
      return { success: false, error: 'Código inválido' };
    }
    
    // Salvar 2FA permanentemente
    const table = userType === 'user' ? 'users' : 'fieis';
    await this.env.DB.prepare(`
      UPDATE ${table} 
      SET twofa_enabled = 1,
          twofa_secret = ?
      WHERE id = ?
    `).bind(secret, userId).run();
    
    // Remover temporário
    await this.env.KV.delete(tempKey);
    
    return { success: true };
  }
  
  // ==================== REGISTRAR NOVO FIEL ====================
  async registerFiel(data: any, ip: string) {
    // Validar dados
    if (!data.nome || !data.email || !data.senha || !data.celular) {
      return { success: false, error: 'Nome, email, celular e senha são obrigatórios' };
    }
    
    if (data.senha.length < 6) {
      return { success: false, error: 'Senha deve ter no mínimo 6 caracteres' };
    }
    
    // Verificar se email já existe
    const existingEmail = await this.env.DB.prepare(
      'SELECT id FROM fieis WHERE email = ?'
    ).bind(data.email).first();
    
    if (existingEmail) {
      return { success: false, error: 'Email já cadastrado' };
    }
    
    // Verificar se celular já existe
    const existingCelular = await this.env.DB.prepare(
      'SELECT id FROM fieis WHERE celular = ?'
    ).bind(data.celular).first();
    
    if (existingCelular) {
      return { success: false, error: 'Celular já cadastrado' };
    }
    
    // Hash da senha
    const senhaHash = await bcrypt.hash(data.senha, 10);
    
    // Inserir fiel
    const result = await this.env.DB.prepare(`
      INSERT INTO fieis (nome, apelido, email, senha_hash, celular)
      VALUES (?, ?, ?, ?, ?)
    `).bind(data.nome, data.apelido || null, data.email, senhaHash, data.celular).run();
    
    // Enviar email de boas-vindas
    await this.emailService.sendEmail(
      data.email,
      '🙏 Bem-vindo ao Santuário de Fátima',
      `
      <h2>Olá ${data.nome}!</h2>
      <p>Seu cadastro foi realizado com sucesso!</p>
      <p>Agora você pode acessar o sistema com seu email e senha.</p>
      <p><strong>Email:</strong> ${data.email}</p>
      <p><strong>Celular:</strong> ${data.celular}</p>
      <p><strong>IP de cadastro:</strong> ${ip}</p>
      <p><strong>Data:</strong> ${new Date().toLocaleString('pt-BR')}</p>
      <br>
      <p>Recomendamos ativar a autenticação em dois fatores para maior segurança.</p>
      <p>Atenciosamente,<br>Equipe Santuário de Fátima</p>
      `
    );
    
    return { success: true, userId: result.meta.last_row_id };
  }
  
  // ==================== REGISTRAR NOVO ADMINISTRADOR (LIMITADO) ====================
  async registerUser(data: any, ip: string, requestingUserEmail: string) {
    // Verificar se quem está cadastrando é um administrador
    const requestingUser = await this.env.DB.prepare(
      'SELECT id FROM users WHERE email = ? AND status = "active"'
    ).bind(requestingUserEmail).first();
    
    if (!requestingUser) {
      return { success: false, error: 'Apenas administradores podem cadastrar novos administradores' };
    }
    
    // Verificar limite de administradores
    const count = await this.env.DB.prepare(`
      SELECT COUNT(*) as total FROM users WHERE status = 'active'
    `).first();
    
    if (count.total >= 5) {
      return { success: false, error: 'Limite máximo de 5 administradores atingido' };
    }
    
    // Validar dados
    if (!data.nome || !data.email || !data.senha) {
      return { success: false, error: 'Nome, email e senha são obrigatórios' };
    }
    
    // Verificar se email já existe
    const existing = await this.env.DB.prepare(
      'SELECT id FROM users WHERE email = ?'
    ).bind(data.email).first();
    
    if (existing) {
      return { success: false, error: 'Email já cadastrado' };
    }
    
    // Hash da senha
    const senhaHash = await bcrypt.hash(data.senha, 10);
    
    // Inserir administrador
    const result = await this.env.DB.prepare(`
      INSERT INTO users (nome, email, senha_hash, celular)
      VALUES (?, ?, ?, ?)
    `).bind(data.nome, data.email, senhaHash, data.celular || null).run();
    
    // Enviar email
    await this.emailService.sendEmail(
      data.email,
      '🔐 Bem-vindo ao Sanctum',
      `
      <h2>Olá ${data.nome}!</h2>
      <p>Você foi cadastrado como administrador do Santuário de Fátima.</p>
      <p><strong>Email:</strong> ${data.email}</p>
      <p><strong>Cadastrado por:</strong> ${requestingUserEmail}</p>
      <p><strong>IP de cadastro:</strong> ${ip}</p>
      <p><strong>Data:</strong> ${new Date().toLocaleString('pt-BR')}</p>
      <br>
      <p>Acesse o sistema com seu email e senha cadastrados.</p>
      <p>Atenciosamente,<br>Equipe Santuário de Fátima</p>
      `
    );
    
    return { success: true, userId: result.meta.last_row_id };
  }
  
  // ==================== LOGS DE ACESSO (PARA O USUÁRIO VER) ====================
  async getUserAccessLogs(email: string, userType: UserType) {
    const logs = await this.env.DB.prepare(`
      SELECT 
        id,
        ip_address,
        login_time,
        attempt_success,
        failure_reason,
        user_agent,
        CASE 
          WHEN login_time > datetime('now', '-5 minutes') AND attempt_success = 1 THEN 1
          ELSE 0
        END as is_recent
      FROM access_logs 
      WHERE user_email = ? AND user_type = ?
      ORDER BY login_time DESC
      LIMIT 50
    `).bind(email, userType).all();
    
    return logs.results;
  }
  
  // ==================== MÉTODOS AUXILIARES ====================
  
  private generatePIN(): string {
    return Math.floor(1000 + Math.random() * 9000).toString();
  }
  
  private generate2FACode(): string {
    return Math.floor(100000 + Math.random() * 900000).toString();
  }
  
  
  
  private async registerAttempt(email: string, userType: UserType, ip: string, success: boolean, reason: string | null) {
    if (success) {
      // Limpar tentativas anteriores
      await this.env.DB.prepare(`
        DELETE FROM login_attempts 
        WHERE email = ? AND user_type = ?
      `).bind(email, userType).run();
      
      // Limpar bloqueio no KV
      await this.env.KV.delete(`block:${userType}:${email}`);
    } else {
      // Registrar tentativa falha
      const attempt = await this.env.DB.prepare(`
        SELECT * FROM login_attempts 
        WHERE email = ? AND user_type = ?
      `).bind(email, userType).first();
      
      const attempts = (attempt?.attempts || 0) + 1;
      
      if (attempts >= 3) {
        // Bloquear por 30 minutos
        const blockUntil = new Date(Date.now() + 30 * 60 * 1000);
        
        await this.env.DB.prepare(`
          INSERT INTO login_attempts (email, user_type, ip_address, attempts, block_until, failure_reason)
          VALUES (?, ?, ?, ?, ?, ?)
          ON CONFLICT(email, user_type) DO UPDATE SET
            attempts = excluded.attempts,
            block_until = excluded.block_until,
            last_attempt = CURRENT_TIMESTAMP,
            failure_reason = excluded.failure_reason
        `).bind(email, userType, ip, attempts, blockUntil.toISOString(), reason).run();
        
        // Bloquear no KV
        await this.env.KV.put(`block:${userType}:${email}`, JSON.stringify({
          expires: blockUntil.getTime()
        }), { expirationTtl: 1800 });
        
        // Buscar nome do usuário para alerta
        const table = userType === 'user' ? 'users' : 'fieis';
        const user = await this.env.DB.prepare(
          `SELECT nome FROM ${table} WHERE email = ?`
        ).bind(email).first();
        
        if (user) {
          await this.alertService.sendMultipleAttemptsAlert(
            email,
            user.nome,
            userType,
            [{ ip_address: ip, last_attempt: new Date(), failure_reason: reason }]
          );
        }
      } else {
        await this.env.DB.prepare(`
          INSERT INTO login_attempts (email, user_type, ip_address, attempts, failure_reason)
          VALUES (?, ?, ?, ?, ?)
          ON CONFLICT(email, user_type) DO UPDATE SET
            attempts = excluded.attempts,
            last_attempt = CURRENT_TIMESTAMP,
            failure_reason = excluded.failure_reason
        `).bind(email, userType, ip, attempts, reason).run();
      }
    }
  }
  
  private async logAccess(email: string, userType: UserType, ip: string, userAgent: string, success: boolean, reason: string | null) {
    // Buscar user_id
    const table = userType === 'user' ? 'users' : 'fieis';
    const user = await this.env.DB.prepare(
      `SELECT id FROM ${table} WHERE email = ?`
    ).bind(email).first();
    
    if (!user) return;
    
    await this.env.DB.prepare(`
      INSERT INTO access_logs (user_type, user_id, user_email, ip_address, user_agent, attempt_success, failure_reason)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `).bind(userType, user.id, email, ip, userAgent || null, success ? 1 : 0, reason).run();
  }
  
  private async recordVerificationCodeSent(email: string, userType: UserType, codeType: string, sentTo: string, ip: string) {
    await this.env.DB.prepare(`
      INSERT INTO verification_codes_sent (user_type, user_email, code_type, sent_to, ip_address)
      VALUES (?, ?, ?, ?, ?)
    `).bind(userType, email, codeType, sentTo, ip).run();
  }
  
  private generatePinEmail(nome: string, pin: string, ip: string, timestamp: Date): string {
    return `
      <!DOCTYPE html>
      <html>
      <head>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; }
          .container { max-width: 500px; margin: 0 auto; padding: 20px; }
          .header { background: linear-gradient(135deg, #051f2c 0%, #2e8cb8 100%); padding: 20px; text-align: center; color: white; border-radius: 10px 10px 0 0; }
          .pin-code { font-size: 32px; font-weight: bold; letter-spacing: 8px; background: #f0f0f0; padding: 20px; text-align: center; margin: 20px 0; border-radius: 10px; font-family: monospace; }
          .info { background: #e3f2fd; padding: 15px; border-radius: 5px; margin: 20px 0; font-size: 12px; }
          .warning { background: #fff3cd; padding: 10px; border-radius: 5px; font-size: 12px; color: #856404; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h2>Santuário de Fátima</h2>
          </div>
          <h3>Olá ${nome}!</h3>
          <p>Seu código de acesso é:</p>
          <div class="pin-code">${pin}</div>
          <p>Este código expira em <strong>5 minutos</strong>.</p>
          
          <div class="info">
            <strong>🔍 Detalhes da tentativa de acesso:</strong><br>
            IP: ${ip}<br>
            Horário: ${timestamp.toLocaleString('pt-BR')}
          </div>
          
          <div class="warning">
            ⚠️ Se você não solicitou este código, alguém pode estar tentando acessar sua conta.<br>
            Recomendamos alterar sua senha imediatamente.
          </div>
          
          <p style="color: #666; font-size: 11px; margin-top: 20px;">
            Este é um email automático. Por favor, não responda.
          </p>
        </div>
      </body>
      </html>
    `;
  }
  
  private generate2FAEmail(nome: string, code: string, ip: string, timestamp: Date): string {
    return `
      <!DOCTYPE html>
      <html>
      <head>
        <style>
          body { font-family: Arial, sans-serif; }
          .container { max-width: 500px; margin: 0 auto; padding: 20px; }
          .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 20px; text-align: center; color: white; }
          .code { font-size: 28px; font-weight: bold; letter-spacing: 5px; background: #f0f0f0; padding: 20px; text-align: center; margin: 20px 0; font-family: monospace; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h2>🔐 Verificação em 2 Fatores</h2>
          </div>
          <h3>Olá ${nome}!</h3>
          <p>Seu código de verificação é:</p>
          <div class="code">${code}</div>
          <p>Este código expira em <strong>5 minutos</strong>.</p>
          <p>IP de acesso: ${ip}<br>Horário: ${timestamp.toLocaleString('pt-BR')}</p>
        </div>
      </body>
      </html>
    `;
  }
  
  private parseUserAgent(userAgent: string): string {
    if (!userAgent) return 'Desconhecido';
    if (userAgent.includes('iPhone')) return 'iPhone';
    if (userAgent.includes('Android')) return 'Android';
    if (userAgent.includes('Windows')) return 'Windows PC';
    if (userAgent.includes('Mac')) return 'Mac';
    return 'Dispositivo desconhecido';
  }
  
  private async getLocationFromIP(ip: string): Promise<string> {
    try {
      const response = await fetch(`https://ipapi.co/${ip}/json/`);
      const data = await response.json();
      if (data.error) return 'Localização não disponível';
      return `${data.city || ''}${data.city && data.region ? ', ' : ''}${data.region || ''} - ${data.country_name || ''}`;
    } catch {
      return 'Localização não disponível';
    }
  }
}