import bcrypt from 'bcryptjs';
import speakeasy from 'speakeasy';
import jwt from 'jsonwebtoken';
import crypto from 'crypto';
import pool from '../db/connection.js';

export class SecurityManager {
  // Prevenção de brute force
  static async checkBruteForce(userId, ip) {
    const [attempts] = await pool.query(
      `SELECT COUNT(*) as count FROM login_attempts 
       WHERE (user_id = ? OR ip_address = ?) 
       AND created_at > DATE_SUB(NOW(), INTERVAL 15 MINUTE)
       AND success = 0`,
      [userId, ip]
    );
    
    return attempts[0].count >= 5;
  }

  // Rate limiting por IP
  static async logAttempt(userId, ip, success, reason = '') {
    await pool.query(
      `INSERT INTO login_attempts 
       (user_id, ip_address, success, reason, user_agent) 
       VALUES (?, ?, ?, ?, ?)`,
      [userId, ip, success ? 1 : 0, reason, this.getUserAgent()]
    );
    
    // Bloquear IP se muitas falhas
    if (!success) {
      const [failures] = await pool.query(
        `SELECT COUNT(*) as count FROM login_attempts 
         WHERE ip_address = ? AND success = 0 
         AND created_at > DATE_SUB(NOW(), INTERVAL 1 HOUR)`,
        [ip]
      );
      
      if (failures[0].count >= 10) {
        await pool.query(
          `INSERT INTO blocked_ips (ip_address, reason, expires_at) 
           VALUES (?, 'Too many failed attempts', DATE_ADD(NOW(), INTERVAL 1 HOUR))`,
          [ip]
        );
      }
    }
  }

  // Verificar IP bloqueado
  static async isIpBlocked(ip) {
    const [blocked] = await pool.query(
      `SELECT * FROM blocked_ips 
       WHERE ip_address = ? AND expires_at > NOW()`,
      [ip]
    );
    
    return blocked.length > 0;
  }

  // Sanitizar entrada
  static sanitizeInput(input) {
    if (typeof input !== 'string') return input;
    
    // Remover tags HTML
    input = input.replace(/<[^>]*>/g, '');
    
    // Remover caracteres perigosos
    input = input.replace(/[;'"\\]/g, '');
    
    // Limitar tamanho
    if (input.length > 1000) input = input.substring(0, 1000);
    
    return input.trim();
  }

  // Validar email
  static validateEmail(email) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) return false;
    
    // Prevenir email injection
    if (email.includes('\n') || email.includes('\r') || email.includes('|')) {
      return false;
    }
    
    return true;
  }

   // Verificar força da senha
  static isPasswordStrong(password) {
    const minLength = 12;
    const hasUpper = /[A-Z]/.test(password);
    const hasLower = /[a-z]/.test(password);
    const hasNumbers = /\d/.test(password);
    const hasSpecial = /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password);
    
    if (password.length < minLength) return false;
    if (!hasUpper || !hasLower) return false;
    if (!hasNumbers) return false;
    if (!hasSpecial) return false;
    
    // Verificar senhas comuns
    const commonPasswords = [
      'password', '123456', 'qwerty', 'admin', 'senha123',
      'fatima2024', 'jesussaves', 'godisgood'
    ];
    
    if (commonPasswords.includes(password.toLowerCase())) {
      return false;
    }
    
    return true;
  }

  static getUserAgent() {
    return typeof window !== 'undefined' ? 
      window.navigator.userAgent : 
      'server-side';
  }
}

// Tabelas SQL de segurança (execute no phpMyAdmin):
/*
CREATE TABLE login_attempts (
  id INT PRIMARY KEY AUTO_INCREMENT,
  user_id INT NULL,
  ip_address VARCHAR(45) NOT NULL,
  success BOOLEAN DEFAULT FALSE,
  reason VARCHAR(255),
  user_agent TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_ip (ip_address),
  INDEX idx_user (user_id),
  INDEX idx_created (created_at)
);

CREATE TABLE blocked_ips (
  id INT PRIMARY KEY AUTO_INCREMENT,
  ip_address VARCHAR(45) NOT NULL,
  reason VARCHAR(255),
  expires_at TIMESTAMP NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_ip (ip_address),
  INDEX idx_expires (expires_at)
);

CREATE TABLE security_logs (
  id INT PRIMARY KEY AUTO_INCREMENT,
  user_id INT NULL,
  action VARCHAR(100) NOT NULL,
  details JSON,
  ip_address VARCHAR(45),
  user_agent TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_action (action),
  INDEX idx_created (created_at)
);
*/