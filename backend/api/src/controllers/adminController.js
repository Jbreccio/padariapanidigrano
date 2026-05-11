// backend/api/src/controllers/adminController.js
export class AdminController {
  constructor(env) {
    this.env = env;
  }
  
  async getStats(req, res) {
    try {
      const totalUsers = await this.env.DB.prepare(
        'SELECT COUNT(*) as count FROM users'
      ).first();
      
      const todayPrayers = await this.env.DB.prepare(`
        SELECT COUNT(*) as count FROM prayer 
        WHERE DATE(created_at) = DATE('now')
      `).first();
      
      const todayCandles = await this.env.DB.prepare(`
        SELECT COUNT(*) as count FROM velas 
        WHERE DATE(data) = DATE('now')
      `).first();
      
      const activeSessions = await this.env.DB.prepare(`
        SELECT COUNT(*) as count FROM sessions 
        WHERE expires_at > datetime('now')
      `).first();
      
      return res.json({
        success: true,
        stats: {
          totalUsers: totalUsers?.count || 0,
          todayPrayers: todayPrayers?.count || 0,
          todayCandles: todayCandles?.count || 0,
          activeSessions: activeSessions?.count || 0
        }
      });
      
    } catch (error) {
      console.error('Erro ao buscar stats:', error);
      return res.status(500).json({ error: 'Erro interno do servidor' });
    }
  }
  
  async getUsers(req, res) {
    try {
      const users = await this.env.DB.prepare(`
        SELECT id, nome, email, celular, role, email_verified, twofa_enabled, created_at
        FROM users ORDER BY created_at DESC LIMIT 100
      `).all();
      
      return res.json({ success: true, users: users.results });
      
    } catch (error) {
      console.error('Erro ao listar usuários:', error);
      return res.status(500).json({ error: 'Erro interno do servidor' });
    }
  }
  
  async updateUserRole(req, res) {
    try {
      const { userId, role } = req.body;
      
      if (!['user', 'admin', 'moderator'].includes(role)) {
        return res.status(400).json({ error: 'Role inválida' });
      }
      
      await this.env.DB.prepare(
        'UPDATE users SET role = ?, updated_at = datetime("now") WHERE id = ?'
      ).bind(role, userId).run();
      
      return res.json({ success: true, message: 'Role atualizada' });
      
    } catch (error) {
      console.error('Erro ao atualizar role:', error);
      return res.status(500).json({ error: 'Erro interno do servidor' });
    }
  }
  
  async getSystemData(req, res) {
    try {
      // Buscar dados do KV
      let dados = await this.env.KV_FILES?.get("santuario_dados", "json");
      
      if (!dados) {
        const dadosPadrao = {
          carrossel: [],
          momentosLiturgicos: [],
          popups: [],
          recados: [],
          horariosMissas: CONFIG.HORARIOS_MISSAS_PADRAO
        };
        return res.json({ success: true, dados: dadosPadrao });
      }
      
      return res.json({ success: true, dados });
      
    } catch (error) {
      console.error('Erro ao buscar dados do sistema:', error);
      return res.status(500).json({ error: 'Erro interno do servidor' });
    }
  }
  
  async saveSystemData(req, res) {
    try {
      const dados = req.body;
      
      // Validar dados
      if (!dados || typeof dados !== 'object') {
        return res.status(400).json({ error: 'Dados inválidos' });
      }
      
      // Salvar no KV
      await this.env.KV_FILES?.put("santuario_dados", JSON.stringify(dados), {
        expirationTtl: 60 * 60 * 24 * 30
      });
      
      // Salvar no D1 como backup
      await this.env.DB.prepare(`
        INSERT INTO dados_sistema (dados, usuario_id, created_at)
        VALUES (?, ?, datetime('now'))
      `).bind(JSON.stringify(dados), req.user?.id || null).run();
      
      return res.json({ success: true, message: 'Dados salvos com sucesso' });
      
    } catch (error) {
      console.error('Erro ao salvar dados do sistema:', error);
      return res.status(500).json({ error: 'Erro interno do servidor' });
    }
  }
}