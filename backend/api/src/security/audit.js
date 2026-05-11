// Sistema de auditoria de segurança
import { query } from '../db/connection.js';

export class SecurityAudit {
  constructor() {
    this.checks = [
      this.checkDatabaseSecurity,
      this.checkEnvSecurity,
      this.checkDependencies,
      this.checkServerConfig,
      this.checkEmailConfig,
      this.checkJWTSecurity,
      this.checkCORSConfig,
      this.checkRateLimiting
    ];
    
    this.auditInterval = 24 * 60 * 60 * 1000; // 24 horas
    this.lastAudit = null;
  }
  
  async start() {
    console.log('🔍 Iniciando auditoria de segurança...');
    
    // Executar auditoria imediata
    await this.runAudit();
    
    // Agendar auditorias periódicas
    setInterval(() => this.runAudit(), this.auditInterval);
    
    console.log('✅ Auditoria de segurança configurada (24h)');
  }
  
  async runAudit() {
    console.log('📊 Executando auditoria de segurança...');
    
    const results = {
      timestamp: new Date().toISOString(),
      checks: [],
      score: 0,
      totalChecks: this.checks.length,
      criticalIssues: 0,
      warnings: 0,
      passed: 0
    };
    
    for (const check of this.checks) {
      try {
        const result = await check.call(this);
        results.checks.push(result);
        
        if (result.status === 'critical') {
          results.criticalIssues++;
        } else if (result.status === 'warning') {
          results.warnings++;
        } else {
          results.passed++;
        }
        
        // Calcular score (0-100)
        if (result.status === 'passed') {
          results.score += 100 / this.checks.length;
        } else if (result.status === 'warning') {
          results.score += 50 / this.checks.length;
        }
        // critical não adiciona pontos
        
      } catch (error) {
        results.checks.push({
          name: check.name,
          status: 'error',
          message: `Erro na verificação: ${error.message}`,
          timestamp: new Date().toISOString()
        });
      }
    }
    
    // Salvar resultado da auditoria
    await this.saveAuditResult(results);
    
    // Notificar se houver issues críticas
    if (results.criticalIssues > 0) {
      await this.notifyCriticalIssues(results);
    }
    
    this.lastAudit = results;
    
    console.log(`✅ Auditoria concluída: ${results.score.toFixed(1)}/100`);
    console.log(`   ✅ ${results.passed} aprovadas`);
    console.log(`   ⚠️  ${results.warnings} alertas`);
    console.log(`   ❌ ${results.criticalIssues} críticas`);
    
    return results;
  }
  
  async checkDatabaseSecurity() {
    const issues = [];
    
    // Verificar se está usando SSL
    try {
      const [rows] = await query('SHOW SESSION STATUS LIKE "Ssl_cipher"');
      const usesSSL = rows[0]?.Value && rows[0].Value !== '';
      
      if (!usesSSL) {
        issues.push('Conexão MySQL não está usando SSL');
      }
    } catch (error) {
      issues.push(`Não foi possível verificar SSL: ${error.message}`);
    }
    
    // Verificar senha padrão
    if (process.env.DB_PASSWORD === 'password' || 
        process.env.DB_PASSWORD === 'root' || 
        process.env.DB_PASSWORD?.length < 8) {
      issues.push('Senha do banco pode ser fraca');
    }
    
    return {
      name: 'Database Security',
      status: issues.length > 0 ? 'warning' : 'passed',
      issues,
      timestamp: new Date().toISOString()
    };
  }
  
  async checkEnvSecurity() {
    const issues = [];
    const criticalIssues = [];
    
    // Verificar .env em produção
    if (process.env.NODE_ENV === 'production') {
      const sensitiveVars = ['JWT_SECRET', 'DB_PASSWORD', 'ENCRYPTION_KEY'];
      
      for (const varName of sensitiveVars) {
        const value = process.env[varName];
        
        if (!value) {
          criticalIssues.push(`${varName} não está definida`);
        } else if (value.includes('default') || value.includes('test') || value.length < 16) {
          issues.push(`${varName} pode ser fraca ou padrão`);
        }
      }
    }
    
    // Verificar se .env está no gitignore
    // (verificação conceitual - em produção não temos acesso a .git)
    
    return {
      name: 'Environment Security',
      status: criticalIssues.length > 0 ? 'critical' : (issues.length > 0 ? 'warning' : 'passed'),
      criticalIssues,
      issues,
      timestamp: new Date().toISOString()
    };
  }
  
  async checkDependencies() {
    const issues = [];
    
    // Lista de dependências vulneráveis conhecidas (exemplo)
    const vulnerableDeps = [
      // 'express': '4.18.2' é seguro
    ];
    
    // Verificar se temos package.json
    try {
      const pkg = JSON.parse(await import('fs').then(fs => 
        fs.readFileSync('package.json', 'utf8')
      ));
      
      // Verificar versões antigas
      const oldVersions = [];
      const deps = { ...pkg.dependencies, ...pkg.devDependencies };
      
      for (const [dep, version] of Object.entries(deps)) {
        if (version.includes('^0.') || version.includes('~0.')) {
          oldVersions.push(`${dep}: ${version}`);
        }
      }
      
      if (oldVersions.length > 0) {
        issues.push(`Possíveis versões antigas: ${oldVersions.join(', ')}`);
      }
    } catch (error) {
      issues.push(`Não foi possível verificar dependências: ${error.message}`);
    }
    
    return {
      name: 'Dependencies',
      status: issues.length > 0 ? 'warning' : 'passed',
      issues,
      timestamp: new Date().toISOString()
    };
  }
  
  async checkServerConfig() {
    const issues = [];
    
    // Verificar headers de segurança
    if (process.env.NODE_ENV === 'production' && 
        !process.env.DISABLE_HELMET && 
        process.env.DISABLE_HELMET !== 'true') {
      // Helmet está habilitado - bom
    } else if (process.env.NODE_ENV === 'production') {
      issues.push('Helmet está desabilitado em produção');
    }
    
    // Verificar CORS
    if (process.env.CORS_ORIGIN === '*') {
      issues.push('CORS configurado para permitir qualquer origem (*)');
    }
    
    // Verificar porta padrão
    if (process.env.PORT === '3000' && process.env.NODE_ENV === 'production') {
      issues.push('Usando porta padrão 3000 em produção');
    }
    
    return {
      name: 'Server Configuration',
      status: issues.length > 0 ? 'warning' : 'passed',
      issues,
      timestamp: new Date().toISOString()
    };
  }
  
  async checkEmailConfig() {
    const issues = [];
    
    if (!process.env.EMAIL_HOST || !process.env.EMAIL_USER || !process.env.EMAIL_PASSWORD) {
      issues.push('Configuração de email incompleta');
    } else {
      // Verificar se é senha padrão
      const weakPasswords = ['password', '123456', 'admin', 'test'];
      if (weakPasswords.some(pw => process.env.EMAIL_PASSWORD.includes(pw))) {
        issues.push('Senha de email pode ser fraca');
      }
    }
    
    return {
      name: 'Email Configuration',
      status: issues.length > 0 ? 'warning' : 'passed',
      issues,
      timestamp: new Date().toISOString()
    };
  }
  
  async checkJWTSecurity() {
    const issues = [];
    const criticalIssues = [];
    
    if (!process.env.JWT_SECRET) {
      criticalIssues.push('JWT_SECRET não está definida');
    } else if (process.env.JWT_SECRET.length < 32) {
      issues.push('JWT_SECRET pode ser muito curta (< 32 caracteres)');
    } else if (process.env.JWT_SECRET.includes('secret') || 
               process.env.JWT_SECRET.includes('jwt') ||
               process.env.JWT_SECRET === 'your_jwt_secret_here') {
      criticalIssues.push('JWT_SECRET está usando valor padrão/inseguro');
    }
    
    if (!process.env.JWT_EXPIRY || process.env.JWT_EXPIRY === '7d') {
      issues.push('JWT_EXPIRY está muito longo (recomendado: 15m-1h)');
    }
    
    return {
      name: 'JWT Security',
      status: criticalIssues.length > 0 ? 'critical' : (issues.length > 0 ? 'warning' : 'passed'),
      criticalIssues,
      issues,
      timestamp: new Date().toISOString()
    };
  }
  
  async checkCORSConfig() {
    const issues = [];
    
    if (process.env.CORS_ORIGIN && process.env.CORS_ORIGIN.includes('*')) {
      issues.push('CORS permite qualquer origem (*) - risco de CSRF');
    } else if (!process.env.CORS_ORIGIN) {
      issues.push('CORS não configurado - pode bloquear requisições legítimas');
    }
    
    return {
      name: 'CORS Configuration',
      status: issues.length > 0 ? 'warning' : 'passed',
      issues,
      timestamp: new Date().toISOString()
    };
  }
  
  async checkRateLimiting() {
    const issues = [];
    
    if (!process.env.RATE_LIMIT_WINDOW || !process.env.RATE_LIMIT_MAX) {
      issues.push('Rate limiting não configurado');
    } else {
      const windowMs = parseInt(process.env.RATE_LIMIT_WINDOW);
      const max = parseInt(process.env.RATE_LIMIT_MAX);
      
      if (max > 1000) {
        issues.push('Rate limit muito alto (> 1000 req) - risco de DDoS');
      }
      
      if (windowMs < 60000) {
        issues.push('Janela de rate limit muito curta (< 1 minuto)');
      }
    }
    
    return {
      name: 'Rate Limiting',
      status: issues.length > 0 ? 'warning' : 'passed',
      issues,
      timestamp: new Date().toISOString()
    };
  }
  
  async saveAuditResult(results) {
    try {
      await query(
        `INSERT INTO security_audit 
         (score, total_checks, critical_issues, warnings, passed, details) 
         VALUES (?, ?, ?, ?, ?, ?)`,
        [
          results.score,
          results.totalChecks,
          results.criticalIssues,
          results.warnings,
          results.passed,
          JSON.stringify(results.checks)
        ]
      );
    } catch (error) {
      console.error('Erro ao salvar auditoria:', error.message);
    }
  }
  
  async notifyCriticalIssues(results) {
    // Enviar email de alerta se houver issues críticas
    console.warn(`🚨 ${results.criticalIssues} issues críticas encontradas!`);
    
    // Aqui você pode implementar notificação por email
    // usando o módulo de email já existente
  }
  
  async getAuditHistory(limit = 10) {
    try {
      const rows = await query(
        `SELECT 
          id,
          score,
          total_checks,
          critical_issues,
          warnings,
          passed,
          created_at
         FROM security_audit 
         ORDER BY created_at DESC 
         LIMIT ?`,
        [limit]
      );
      
      return rows;
    } catch (error) {
      console.error('Erro ao buscar histórico:', error.message);
      return [];
    }
  }
  
  stop() {
    console.log('🛑 Auditoria de segurança parada');
  }
}

// SQL para criar tabela de auditoria
export const createAuditTableSQL = `
CREATE TABLE IF NOT EXISTS security_audit (
  id INT PRIMARY KEY AUTO_INCREMENT,
  score DECIMAL(5,2) NOT NULL,
  total_checks INT NOT NULL,
  critical_issues INT NOT NULL,
  warnings INT NOT NULL,
  passed INT NOT NULL,
  details JSON,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_score (score),
  INDEX idx_created (created_at)
);
`;

export default SecurityAudit;