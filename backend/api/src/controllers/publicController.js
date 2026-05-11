// backend/api/src/controllers/publicController.js
import CONFIG from '../config/constants.js';

export class PublicController {
  constructor(env) {
    this.env = env;
  }
  
  async getHorariosMissas(req, res) {
    try {
      const dados = await this.env.KV_FILES?.get("santuario_dados", "json");
      
      if (dados && dados.horariosMissas) {
        return res.json(dados.horariosMissas);
      }
      
      return res.json(CONFIG.HORARIOS_MISSAS_PADRAO);
      
    } catch (error) {
      console.error('Erro ao buscar horários:', error);
      return res.json(CONFIG.HORARIOS_MISSAS_PADRAO);
    }
  }
  
  async getMomentosLiturgicos(req, res) {
    try {
      const dados = await this.env.KV_FILES?.get("santuario_dados", "json");
      
      if (dados && dados.momentosLiturgicos) {
        const ordenados = this.ordenarMomentos(dados.momentosLiturgicos);
        return res.json(ordenados);
      }
      
      return res.json([]);
      
    } catch (error) {
      console.error('Erro ao buscar momentos litúrgicos:', error);
      return res.json([]);
    }
  }
  
  ordenarMomentos(momentos) {
    if (!Array.isArray(momentos)) return [];
    
    return [...momentos].sort((a, b) => {
      const anoA = this.extrairAno(a.periodo);
      const anoB = this.extrairAno(b.periodo);
      if (anoA !== anoB) return anoB - anoA;
      const idA = parseInt(a.id) || 0;
      const idB = parseInt(b.id) || 0;
      return idB - idA;
    });
  }
  
  extrairAno(periodo) {
    if (!periodo) return new Date().getFullYear();
    const match = periodo.match(/\b(19|20)\d{2}\b/);
    if (match) return parseInt(match[0]);
    return new Date().getFullYear();
  }
  
  async getCarrossel(req, res) {
    try {
      const dados = await this.env.KV_FILES?.get("santuario_dados", "json");
      
      if (dados && dados.carrossel) {
        return res.json(dados.carrossel);
      }
      
      return res.json([]);
      
    } catch (error) {
      console.error('Erro ao buscar carrossel:', error);
      return res.json([]);
    }
  }
  
  async getRecados(req, res) {
    try {
      const dados = await this.env.KV_FILES?.get("santuario_dados", "json");
      
      if (dados && dados.recados) {
        return res.json(dados.recados);
      }
      
      return res.json([]);
      
    } catch (error) {
      console.error('Erro ao buscar recados:', error);
      return res.json([]);
    }
  }
}