// Firewall básico para Node.js
import { query } from '../db/connection.js';

export class Firewall {
  constructor() {
    this.blockedIPs = new Set();
    this.suspiciousPatterns = [
      /\.\.\//, // Directory traversal
      /<script>/i, // XSS attempts
      /union.*select/i, // SQL injection
      /\/etc\/passwd/, // File inclusion
      /\.env/, // Environment file access
      /\.git/, // Git directory access
      /\.\.;/ // Command injection
    ];
    
    // Carregar IPs bloqueados do banco
    this.loadBlockedIPs();
    
    // Atualizar a cada 5 minutos
    setInterval(() => this.loadBlockedIPs(), 5 * 60 * 1000);
  }
  
  async loadBlockedIPs() {
    try {
      const rows = await query(
        'SELECT ip_address FROM blocked_ips WHERE expires_at > NOW()'
      );
      
      this.blockedIPs.clear();
      rows.forEach(row => this.blockedIPs.add(row.ip_address));
      
      console.log(`🛡️ Firewall carregou ${this.blockedIPs.size} IPs bloqueados`);
    } catch (error) {
      console.error('Erro ao carregar IPs bloqueados:', error.message);
    }
  }
  
  async middleware(req, res, next) {
    const ip = req.ip || req.connection.remoteAddress;
    const userAgent = req.get('user-agent') || '';
    const path = req.path;
    
    // 1. Verificar se IP está bloqueado
    if (this.blockedIPs.has(ip)) {
      console.log(`🚫 Acesso bloqueado: ${ip} - ${path}`);
      return res.status(403).json({
        error: 'Acesso bloqueado',
        message: 'Seu IP foi temporariamente bloqueado por atividades suspeitas.'
      });
    }
    
    // 2. Verificar padrões suspeitos na URL
    const fullUrl = req.originalUrl;
    const isSuspicious = this.suspiciousPatterns.some(pattern => 
      pattern.test(fullUrl) || pattern.test(userAgent)
    );
    
    if (isSuspicious) {
      console.warn(`⚠️ Atividade suspeita detectada: ${ip} - ${fullUrl}`);
      
      // Bloquear IP por 1 hora
      await this.blockIP(ip, 'Padrão suspeito na requisição');
      
      return res.status(403).json({
        error: 'Requisição bloqueada',
        message: 'Atividade suspeita detectada.'
      });
    }
    
    // 3. Verificar user-agent suspeito ou vazio
    if (!userAgent || userAgent.length < 10 || userAgent.includes('bot') || userAgent.includes('crawl')) {
      console.log(`🤖 Bot/Scanner detectado: ${ip} - ${userAgent}`);
      
      // Logar mas não bloquear (alguns bots são legítimos)
      await this.logSuspiciousActivity(ip, userAgent, path, 'Bot/Scanner');
    }
    
    // 4. Verificar rate limiting adicional
    const recentRequests = await this.getRecentRequests(ip);
    if (recentRequests > 100) { // Mais de 100 requisições nos últimos 5 minutos
      console.warn(`⚡ Rate limit excedido: ${ip} - ${recentRequests} requisições`);
      
      await this.blockIP(ip, 'Rate limit excedido', 15); // 15 minutos
      
      return res.status(429).json({
        error: 'Muitas requisições',
        message: 'Por favor, espere alguns minutos antes de tentar novamente.'
      });
    }
    
    // 5. Log da requisição
    await this.logRequest(ip, userAgent, path);
    
    next();
  }
  
  async blockIP(ip, reason, minutes = 60) {
    try {
      await query(
        `INSERT INTO blocked_ips (ip_address, reason, expires_at) 
         VALUES (?, ?, DATE_ADD(NOW(), INTERVAL ? MINUTE))
         ON DUPLICATE KEY UPDATE 
           reason = ?, 
           expires_at = DATE_ADD(NOW(), INTERVAL ? MINUTE)`,
        [ip, reason, minutes, reason, minutes]
      );
      
      this.blockedIPs.add(ip);
      console.log(`🔒 IP bloqueado: ${ip} - Motivo: ${reason}`);
      
      // Notificação por email (opcional)
      if (process.env.ADMIN_EMAIL) {
        await this.sendBlockNotification(ip, reason);
      }
    } catch (error) {
      console.error('Erro ao bloquear IP:', error.message);
    }
  }
  
  async logRequest(ip, userAgent, path) {
    try {
      await query(
        'INSERT INTO firewall_logs (ip_address, user_agent, path) VALUES (?, ?, ?)',
        [ip, userAgent.substring(0, 500), path]
      );
    } catch (error) {
      // Ignorar erro de log
    }
  }
  
  async logSuspiciousActivity(ip, userAgent, path, type) {
    try {
      await query(
        `INSERT INTO suspicious_activity 
         (ip_address, user_agent, path, activity_type) 
         VALUES (?, ?, ?, ?)`,
        [ip, userAgent.substring(0, 500), path, type]
      );
    } catch (error) {
      // Ignorar erro de log
    }
  }
  
  async getRecentRequests(ip, minutes = 5) {
    try {
      const [rows] = await query(
        `SELECT COUNT(*) as count FROM firewall_logs 
         WHERE ip_address = ? AND created_at > DATE_SUB(NOW(), INTERVAL ? MINUTE)`,
        [ip, minutes]
      );
      
      return rows[0]?.count || 0;
    } catch (error) {
      return 0;
    }
  }
  
  async sendBlockNotification(ip, reason) {
    // Implementação básica - você pode usar o email.js
    console.log(`📧 Notificação: IP ${ip} bloqueado - ${reason}`);
  }
  
  // Estatísticas do firewall
  async getStats() {
    try {
      const [totalBlocks] = await query(
        'SELECT COUNT(*) as total FROM blocked_ips WHERE expires_at > NOW()'
      );
      
      const [todayRequests] = await query(
        'SELECT COUNT(*) as today FROM firewall_logs WHERE DATE(created_at) = CURDATE()'
      );
      
      const [suspiciousToday] = await query(
        `SELECT COUNT(*) as suspicious FROM suspicious_activity 
         WHERE DATE(created_at) = CURDATE()`
      );
      
      return {
        blocked_ips: totalBlocks[0].total,
        requests_today: todayRequests[0].today,
        suspicious_today: suspiciousToday[0].suspicious,
        timestamp: new Date().toISOString()
      };
    } catch (error) {
      return {
        error: error.message,
        timestamp: new Date().toISOString()
      };
    }
  }
}

// SQL para criar tabelas do firewall
export const createFirewallTablesSQL = `
CREATE TABLE IF NOT EXISTS blocked_ips (
  id INT PRIMARY KEY AUTO_INCREMENT,
  ip_address VARCHAR(45) NOT NULL,
  reason VARCHAR(255),
  expires_at TIMESTAMP NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_ip (ip_address),
  INDEX idx_expires (expires_at)
);

CREATE TABLE IF NOT EXISTS firewall_logs (
  id INT PRIMARY KEY AUTO_INCREMENT,
  ip_address VARCHAR(45),
  user_agent TEXT,
  path VARCHAR(500),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_ip (ip_address),
  INDEX idx_created (created_at)
);

CREATE TABLE IF NOT EXISTS suspicious_activity (
  id INT PRIMARY KEY AUTO_INCREMENT,
  ip_address VARCHAR(45),
  user_agent TEXT,
  path VARCHAR(500),
  activity_type VARCHAR(100),
  details TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_ip (ip_address),
  INDEX idx_type (activity_type)
);
`;

export default Firewall;