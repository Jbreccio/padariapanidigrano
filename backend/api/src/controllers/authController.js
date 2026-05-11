// backend/api/src/controllers/authController.js
import bcrypt from 'bcryptjs';
import { v4 as uuidv4 } from 'uuid';
import EmailService from '../services/auth/email.js';
import TOTPService from '../services/auth/totp.js';

export class AuthController {
  constructor(env) {
    this.env = env;
    this.emailService = new EmailService(env);
    this.totpService = new TOTPService(env);
  }

  async register(req, res) {
    try {
      const { nome, email, senha, celular } = req.body;
      
      // Validações
      if (!nome || !email || !senha) {
        return res.status(400).json({ error: 'Nome, email e senha são obrigatórios' });
      }
      
      // Verificar se usuário já existe
      const existing = await this.env.DB.prepare(
        'SELECT id FROM users WHERE email = ?'
      ).bind(email).first();
      
      if (existing) {
        return res.status(409).json({ error: 'Email já cadastrado' });
      }
      
      // Hash da senha
      const salt = await bcrypt.genSalt(10);
      const senhaHash = await bcrypt.hash(senha, salt);
      
      // Criar usuário
      const userId = uuidv4();
      const verificationCode = Math.floor(100000 + Math.random() * 900000).toString();
      
      await this.env.DB.prepare(`
        INSERT INTO users (id, nome, email, senha_hash, celular, verification_code, verification_expires, created_at)
        VALUES (?, ?, ?, ?, ?, ?, datetime('now', '+15 minutes'), datetime('now'))
      `).bind(userId, nome, email, senhaHash, celular || null, verificationCode).run();
      
      // Enviar email de verificação
      await this.emailService.sendVerificationEmail(email, nome, verificationCode);
      
      return res.status(201).json({
        success: true,
        message: 'Cadastro realizado! Verifique seu email para ativar a conta.',
        userId
      });
      
    } catch (error) {
      console.error('Erro no registro:', error);
      return res.status(500).json({ error: 'Erro interno do servidor' });
    }
  }
  
  async verifyEmail(req, res) {
    try {
      const { email, code } = req.body;
      
      const user = await this.env.DB.prepare(`
        SELECT id FROM users 
        WHERE email = ? AND verification_code = ? AND verification_expires > datetime('now')
      `).bind(email, code).first();
      
      if (!user) {
        return res.status(400).json({ error: 'Código inválido ou expirado' });
      }
      
      await this.env.DB.prepare(`
        UPDATE users SET email_verified = 1, verification_code = NULL, verification_expires = NULL
        WHERE id = ?
      `).bind(user.id).run();
      
      return res.json({ success: true, message: 'Email verificado com sucesso!' });
      
    } catch (error) {
      console.error('Erro na verificação:', error);
      return res.status(500).json({ error: 'Erro interno do servidor' });
    }
  }
  
  async login(req, res) {
    try {
      const { email, senha } = req.body;
      
      // Buscar usuário
      const user = await this.env.DB.prepare(`
        SELECT id, nome, email, senha_hash, twofa_enabled, email_verified
        FROM users WHERE email = ?
      `).bind(email).first();
      
      if (!user) {
        return res.status(401).json({ error: 'Email ou senha inválidos' });
      }
      
      // Verificar email
      if (!user.email_verified) {
        return res.status(401).json({ error: 'Email não verificado. Verifique sua caixa de entrada.' });
      }
      
      // Verificar senha
      const senhaValida = await bcrypt.compare(senha, user.senha_hash);
      if (!senhaValida) {
        return res.status(401).json({ error: 'Email ou senha inválidos' });
      }
      
      // Se 2FA estiver ativado
      if (user.twofa_enabled) {
        const twoFACode = Math.floor(100000 + Math.random() * 900000).toString();
        
        await this.env.DB.prepare(`
          UPDATE users SET twofa_code = ?, twofa_expires = datetime('now', '+5 minutes')
          WHERE id = ?
        `).bind(twoFACode, user.id).run();
        
        await this.emailService.sendTwoFactorEmail(user.email, user.nome, twoFACode);
        
        return res.json({
          success: true,
          requiresTwoFactor: true,
          userId: user.id,
          message: 'Código 2FA enviado para seu email'
        });
      }
      
      // Login bem sucedido
      const token = jwt.sign(
        { id: user.id, nome: user.nome, email: user.email, role: user.role || 'user' },
        process.env.JWT_SECRET,
        { expiresIn: '7d' }
      );
      
      // Criar sessão
      const sessionId = uuidv4();
      await this.env.DB.prepare(`
        INSERT INTO sessions (id, user_id, token, expires_at, created_at)
        VALUES (?, ?, ?, datetime('now', '+7 days'), datetime('now'))
      `).bind(sessionId, user.id, token).run();
      
      return res.json({
        success: true,
        token,
        sessionId,
        user: {
          id: user.id,
          nome: user.nome,
          email: user.email
        }
      });
      
    } catch (error) {
      console.error('Erro no login:', error);
      return res.status(500).json({ error: 'Erro interno do servidor' });
    }
  }
  
  async verifyTwoFactor(req, res) {
    try {
      const { userId, code } = req.body;
      
      const user = await this.env.DB.prepare(`
        SELECT id, nome, email FROM users 
        WHERE id = ? AND twofa_code = ? AND twofa_expires > datetime('now')
      `).bind(userId, code).first();
      
      if (!user) {
        return res.status(400).json({ error: 'Código 2FA inválido ou expirado' });
      }
      
      // Limpar código 2FA
      await this.env.DB.prepare(`
        UPDATE users SET twofa_code = NULL, twofa_expires = NULL WHERE id = ?
      `).bind(userId).run();
      
      // Gerar token
      const token = jwt.sign(
        { id: user.id, nome: user.nome, email: user.email },
        process.env.JWT_SECRET,
        { expiresIn: '7d' }
      );
      
      const sessionId = uuidv4();
      await this.env.DB.prepare(`
        INSERT INTO sessions (id, user_id, token, expires_at, created_at)
        VALUES (?, ?, ?, datetime('now', '+7 days'), datetime('now'))
      `).bind(sessionId, user.id, token).run();
      
      return res.json({
        success: true,
        token,
        sessionId,
        user: {
          id: user.id,
          nome: user.nome,
          email: user.email
        }
      });
      
    } catch (error) {
      console.error('Erro na verificação 2FA:', error);
      return res.status(500).json({ error: 'Erro interno do servidor' });
    }
  }
  
  async logout(req, res) {
    try {
      const token = req.headers.authorization?.replace('Bearer ', '');
      
      if (token) {
        await this.env.DB.prepare(
          'DELETE FROM sessions WHERE token = ?'
        ).bind(token).run();
      }
      
      return res.json({ success: true, message: 'Logout realizado' });
      
    } catch (error) {
      console.error('Erro no logout:', error);
      return res.status(500).json({ error: 'Erro interno do servidor' });
    }
  }
  
  async forgotPassword(req, res) {
    try {
      const { email } = req.body;
      
      const user = await this.env.DB.prepare(
        'SELECT id, nome FROM users WHERE email = ?'
      ).bind(email).first();
      
      if (!user) {
        return res.status(404).json({ error: 'Email não encontrado' });
      }
      
      const resetToken = Math.floor(100000 + Math.random() * 900000).toString();
      
      await this.env.DB.prepare(`
        UPDATE users SET reset_token = ?, reset_expires = datetime('now', '+1 hour')
        WHERE id = ?
      `).bind(resetToken, user.id).run();
      
      await this.emailService.sendPasswordResetEmail(email, user.nome, resetToken);
      
      return res.json({
        success: true,
        message: 'Email de recuperação enviado'
      });
      
    } catch (error) {
      console.error('Erro no forgot password:', error);
      return res.status(500).json({ error: 'Erro interno do servidor' });
    }
  }
  
  async resetPassword(req, res) {
    try {
      const { email, token, novaSenha } = req.body;
      
      const user = await this.env.DB.prepare(`
        SELECT id FROM users 
        WHERE email = ? AND reset_token = ? AND reset_expires > datetime('now')
      `).bind(email, token).first();
      
      if (!user) {
        return res.status(400).json({ error: 'Token inválido ou expirado' });
      }
      
      const salt = await bcrypt.genSalt(10);
      const senhaHash = await bcrypt.hash(novaSenha, salt);
      
      await this.env.DB.prepare(`
        UPDATE users SET senha_hash = ?, reset_token = NULL, reset_expires = NULL, updated_at = datetime('now')
        WHERE id = ?
      `).bind(senhaHash, user.id).run();
      
      return res.json({
        success: true,
        message: 'Senha redefinida com sucesso!'
      });
      
    } catch (error) {
      console.error('Erro no reset password:', error);
      return res.status(500).json({ error: 'Erro interno do servidor' });
    }
  }
}