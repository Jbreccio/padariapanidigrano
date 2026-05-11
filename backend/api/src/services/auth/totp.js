// backend/api/src/auth/totp.js
// TOTP (Time-based One-Time Password) para 2FA
import { authenticator } from 'otplib';

export class TOTPService {
  constructor(env) {
    this.env = env;
  }

  generateSecret(email) {
    const secret = authenticator.generateSecret();
    return {
      secret,
      qrCode: authenticator.keyuri(email, 'Santuário de Fátima', secret)
    };
  }

  verifyToken(secret, token) {
    try {
      return authenticator.check(token, secret);
    } catch (error) {
      console.error('Erro ao verificar TOTP:', error);
      return false;
    }
  }

  generateBackupCodes(count = 10) {
    const codes = [];
    for (let i = 0; i < count; i++) {
      const code = Math.random().toString(36).substring(2, 10).toUpperCase();
      codes.push(code);
    }
    return codes;
  }

  async save2FASecret(userId, secret, backupCodes) {
    try {
      await this.env.DB.prepare(`
        INSERT INTO twofa_secrets (user_id, secret, backup_codes, created_at)
        VALUES (?, ?, ?, datetime('now'))
        ON CONFLICT(user_id) DO UPDATE SET
          secret = excluded.secret,
          backup_codes = excluded.backup_codes,
          updated_at = datetime('now')
      `).bind(
        userId,
        secret,
        JSON.stringify(backupCodes)
      ).run();
      
      return true;
    } catch (error) {
      console.error('Erro ao salvar secret 2FA:', error);
      return false;
    }
  }

  async get2FASecret(userId) {
    try {
      const result = await this.env.DB.prepare(`
        SELECT secret, backup_codes FROM twofa_secrets WHERE user_id = ?
      `).bind(userId).first();
      
      if (result) {
        return {
          secret: result.secret,
          backupCodes: JSON.parse(result.backup_codes || '[]')
        };
      }
      return null;
    } catch (error) {
      console.error('Erro ao buscar secret 2FA:', error);
      return null;
    }
  }

  async enable2FA(userId, secret, token) {
    // Verificar se o token é válido
    if (!this.verifyToken(secret, token)) {
      return { success: false, error: 'Código 2FA inválido' };
    }
    
    const backupCodes = this.generateBackupCodes();
    await this.save2FASecret(userId, secret, backupCodes);
    
    // Atualizar usuário
    await this.env.DB.prepare(`
      UPDATE users SET twofa_enabled = 1, updated_at = datetime('now')
      WHERE id = ?
    `).bind(userId).run();
    
    return {
      success: true,
      backupCodes
    };
  }

  async disable2FA(userId, password) {
    // Verificar senha (será feita no controller)
    await this.env.DB.prepare(`
      DELETE FROM twofa_secrets WHERE user_id = ?
    `).bind(userId).run();
    
    await this.env.DB.prepare(`
      UPDATE users SET twofa_enabled = 0, updated_at = datetime('now')
      WHERE id = ?
    `).bind(userId).run();
    
    return { success: true };
  }

  async verifyBackupCode(userId, code) {
    const secret = await this.get2FASecret(userId);
    if (!secret) return false;
    
    const index = secret.backupCodes.indexOf(code);
    if (index === -1) return false;
    
    // Remover código usado
    secret.backupCodes.splice(index, 1);
    await this.save2FASecret(userId, secret.secret, secret.backupCodes);
    
    return true;
  }
}

export default TOTPService;