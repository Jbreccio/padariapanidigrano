// backend/api/src/services/authService.js
import jwt from 'jsonwebtoken';
import { v4 as uuidv4 } from 'uuid';
import User from '../models/User.js';
import EmailService from './auth/email.js';

export class AuthService {
  constructor(env) {
    this.env = env;
    this.emailService = new EmailService(env);
  }

  async register(userData) {
    const { nome, email, senha, celular } = userData;
    
    // Verificar se usuário já existe
    const existing = await User.findByEmail(this.env.DB, email);
    if (existing) {
      return { success: false, error: 'Email já cadastrado' };
    }
    
    // Criar usuário
    const user = await User.create(this.env.DB, { nome, email, senha, celular });
    
    // Gerar código de verificação
    const verificationCode = Math.floor(100000 + Math.random() * 900000).toString();
    await this.env.DB.prepare(`
      UPDATE users SET verification_code = ?, verification_expires = datetime('now', '+15 minutes')
      WHERE id = ?
    `).bind(verificationCode, user.id).run();
    
    // Enviar email de verificação
    await this.emailService.sendVerificationEmail(email, nome, verificationCode);
    
    return {
      success: true,
      message: 'Cadastro realizado! Verifique seu email.',
      userId: user.id
    };
  }

  async verifyEmail(email, code) {
    const user = await this.env.DB.prepare(`
      SELECT id FROM users 
      WHERE email = ? AND verification_code = ? AND verification_expires > datetime('now')
    `).bind(email, code).first();
    
    if (!user) {
      return { success: false, error: 'Código inválido ou expirado' };
    }
    
    await this.env.DB.prepare(`
      UPDATE users SET email_verified = 1, verification_code = NULL, verification_expires = NULL
      WHERE id = ?
    `).bind(user.id).run();
    
    return { success: true, message: 'Email verificado com sucesso!' };
  }

  async login(email, senha, ip, userAgent) {
    const user = await User.findByEmail(this.env.DB, email);
    
    if (!user) {
      await this.logFailedAttempt(email, ip, userAgent, 'user_not_found');
      return { success: false, error: 'Email ou senha inválidos' };
    }
    
    if (!user.email_verified) {
      return { success: false, error: 'Email não verificado. Verifique sua caixa de entrada.' };
    }
    
    const senhaValida = await user.verifyPassword(senha);
    if (!senhaValida) {
      await this.logFailedAttempt(email, ip, userAgent, 'wrong_password');
      return { success: false, error: 'Email ou senha inválidos' };
    }
    
    // Log de sucesso
    await this.logSuccessAttempt(user.id, ip, userAgent);
    
    // Se 2FA estiver ativado
    if (user.twofa_enabled) {
      return await this.initiate2FA(user);
    }
    
    // Gerar token
    return await this.generateSession(user);
  }

  async initiate2FA(user) {
    const twoFACode = Math.floor(100000 + Math.random() * 900000).toString();
    
    await this.env.DB.prepare(`
      UPDATE users SET twofa_code = ?, twofa_expires = datetime('now', '+5 minutes')
      WHERE id = ?
    `).bind(twoFACode, user.id).run();
    
    await this.emailService.sendTwoFactorEmail(user.email, user.nome, twoFACode);
    
    return {
      success: true,
      requiresTwoFactor: true,
      userId: user.id,
      message: 'Código 2FA enviado para seu email'
    };
  }

  async verifyTwoFactor(userId, code) {
    const user = await this.env.DB.prepare(`
      SELECT id, nome, email FROM users 
      WHERE id = ? AND twofa_code = ? AND twofa_expires > datetime('now')
    `).bind(userId, code).first();
    
    if (!user) {
      return { success: false, error: 'Código 2FA inválido ou expirado' };
    }
    
    // Limpar código 2FA
    await this.env.DB.prepare(`
      UPDATE users SET twofa_code = NULL, twofa_expires = NULL WHERE id = ?
    `).bind(userId).run();
    
    const fullUser = await User.findById(this.env.DB, userId);
    return await this.generateSession(fullUser);
  }

  async generateSession(user) {
    const token = jwt.sign(
      { id: user.id, nome: user.nome, email: user.email, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: '7d' }
    );
    
    const sessionId = uuidv4();
    await this.env.DB.prepare(`
      INSERT INTO sessions (id, user_id, token, expires_at, created_at)
      VALUES (?, ?, ?, datetime('now', '+7 days'), datetime('now'))
    `).bind(sessionId, user.id, token).run();
    
    return {
      success: true,
      token,
      sessionId,
      user: user.toJSON()
    };
  }

  async logout(token) {
    if (token) {
      await this.env.DB.prepare(
        'DELETE FROM sessions WHERE token = ?'
      ).bind(token).run();
    }
    return { success: true };
  }

  async forgotPassword(email) {
    const user = await User.findByEmail(this.env.DB, email);
    if (!user) {
      return { success: false, error: 'Email não encontrado' };
    }
    
    const resetToken = Math.floor(100000 + Math.random() * 900000).toString();
    
    await this.env.DB.prepare(`
      UPDATE users SET reset_token = ?, reset_expires = datetime('now', '+1 hour')
      WHERE id = ?
    `).bind(resetToken, user.id).run();
    
    await this.emailService.sendPasswordResetEmail(email, user.nome, resetToken);
    
    return { success: true, message: 'Email de recuperação enviado' };
  }

  async resetPassword(email, token, novaSenha) {
    const user = await this.env.DB.prepare(`
      SELECT id FROM users 
      WHERE email = ? AND reset_token = ? AND reset_expires > datetime('now')
    `).bind(email, token).first();
    
    if (!user) {
      return { success: false, error: 'Token inválido ou expirado' };
    }
    
    const fullUser = await User.findById(this.env.DB, user.id);
    await fullUser.updatePassword(this.env.DB, novaSenha);
    
    await this.env.DB.prepare(`
      UPDATE users SET reset_token = NULL, reset_expires = NULL WHERE id = ?
    `).bind(user.id).run();
    
    return { success: true, message: 'Senha redefinida com sucesso!' };
  }

  async logFailedAttempt(email, ip, userAgent, reason) {
    try {
      await this.env.DB.prepare(`
        INSERT INTO audit_logs (user_id, action, ip, user_agent, details, status, created_at)
        VALUES (?, 'login_failed', ?, ?, ?, 'failed', datetime('now'))
      `).bind(email, ip, userAgent, JSON.stringify({ reason })).run();
    } catch (error) {
      console.error('Erro ao logar tentativa falha:', error);
    }
  }

  async logSuccessAttempt(userId, ip, userAgent) {
    try {
      await this.env.DB.prepare(`
        INSERT INTO audit_logs (user_id, action, ip, user_agent, status, created_at)
        VALUES (?, 'login_success', ?, ?, 'success', datetime('now'))
      `).bind(userId, ip, userAgent).run();
    } catch (error) {
      console.error('Erro ao logar tentativa de sucesso:', error);
    }
  }

  async validateToken(token) {
    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      const session = await this.env.DB.prepare(
        'SELECT * FROM sessions WHERE token = ? AND expires_at > datetime("now")'
      ).bind(token).first();
      
      if (!session) return null;
      return decoded;
    } catch {
      return null;
    }
  }
}

export default AuthService;