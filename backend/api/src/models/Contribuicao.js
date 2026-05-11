// backend/api/src/models/Contribuicao.js

export class Contribuicao {
  constructor(data) {
    this.id = data.id;
    this.livro = data.livro;
    this.capitulo = data.capitulo;
    this.versiculo = data.versiculo;
    this.texto = data.texto;
    this.apelido = data.apelido;
    this.audio_url = data.audio_url;
    this.aprovado = data.aprovado || 0;
    this.aprovado_por = data.aprovado_por;
    this.data_aprovacao = data.data_aprovacao;
    this.created_at = data.created_at;
  }

  static async findAll(db, filters = {}) {
    try {
      let query = 'SELECT * FROM fiel_contribuicoes WHERE 1=1';
      const params = [];
      
      if (filters.livro) {
        query += ' AND livro = ?';
        params.push(filters.livro);
      }
      if (filters.aprovado !== undefined) {
        query += ' AND aprovado = ?';
        params.push(filters.aprovado);
      }
      if (filters.apelido) {
        query += ' AND apelido LIKE ?';
        params.push(`%${filters.apelido}%`);
      }
      
      query += ' ORDER BY created_at DESC LIMIT 100';
      
      const result = await db.prepare(query).bind(...params).all();
      return (result.results || []).map(c => new Contribuicao(c));
    } catch (error) {
      console.error('Erro ao listar contribuições:', error);
      return [];
    }
  }

  static async findByVersiculo(db, livro, capitulo, versiculo) {
    try {
      const result = await db.prepare(`
        SELECT * FROM fiel_contribuicoes 
        WHERE livro = ? AND capitulo = ? AND versiculo = ?
        ORDER BY created_at DESC
      `).bind(livro, capitulo, versiculo).all();
      
      return (result.results || []).map(c => new Contribuicao(c));
    } catch (error) {
      console.error('Erro ao buscar contribuições por versículo:', error);
      return [];
    }
  }

  static async findById(db, id) {
    try {
      const result = await db.prepare(
        'SELECT * FROM fiel_contribuicoes WHERE id = ?'
      ).bind(id).first();
      
      return result ? new Contribuicao(result) : null;
    } catch (error) {
      console.error('Erro ao buscar contribuição:', error);
      return null;
    }
  }

  static async create(db, data, audioUrl) {
    try {
      const id = Date.now().toString();
      await db.prepare(`
        INSERT INTO fiel_contribuicoes (id, livro, capitulo, versiculo, texto, apelido, audio_url, created_at)
        VALUES (?, ?, ?, ?, ?, ?, ?, datetime('now'))
      `).bind(id, data.livro, data.capitulo, data.versiculo, data.texto, data.apelido, audioUrl).run();
      
      return new Contribuicao({ id, ...data, audio_url: audioUrl });
    } catch (error) {
      console.error('Erro ao criar contribuição:', error);
      throw error;
    }
  }

  async approve(db, userId) {
    try {
      await db.prepare(`
        UPDATE fiel_contribuicoes 
        SET aprovado = 1, aprovado_por = ?, data_aprovacao = datetime('now')
        WHERE id = ?
      `).bind(userId, this.id).run();
      
      this.aprovado = 1;
      this.aprovado_por = userId;
      this.data_aprovacao = new Date().toISOString();
      return true;
    } catch (error) {
      console.error('Erro ao aprovar contribuição:', error);
      return false;
    }
  }

  async reject(db) {
    try {
      await db.prepare(
        'DELETE FROM fiel_contribuicoes WHERE id = ?'
      ).bind(this.id).run();
      return true;
    } catch (error) {
      console.error('Erro ao rejeitar contribuição:', error);
      return false;
    }
  }

  getAudioUrl() {
    if (!this.audio_url) return null;
    return `https://pub-a7cc8a4d3af3406aac2a13dacc039fb5.r2.dev/${this.audio_url}`;
  }

  toJSON() {
    return {
      id: this.id,
      livro: this.livro,
      capitulo: this.capitulo,
      versiculo: this.versiculo,
      texto: this.texto,
      apelido: this.apelido,
      audio_url: this.getAudioUrl(),
      aprovado: this.aprovado === 1,
      created_at: this.created_at
    };
  }
}

export default Contribuicao;