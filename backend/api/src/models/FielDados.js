// backend/api/src/models/FielDados.js

export class FielDados {
  constructor(data) {
    this.email = data.email;
    this.musicas = this.parseJSON(data.musicas);
    this.versiculos = this.parseJSON(data.versiculos);
    this.oracoes = this.parseJSON(data.oracoes);
    this.fotos = this.parseJSON(data.fotos);
    this.perfil_data = this.parseJSON(data.perfil_data);
    this.termo_aceito = data.termo_aceito || 0;
    this.termo_data = this.parseJSON(data.termo_data);
    this.created_at = data.created_at;
    this.updated_at = data.updated_at;
  }

  parseJSON(data) {
    if (!data) return null;
    if (typeof data === 'object') return data;
    try {
      return JSON.parse(data);
    } catch {
      return null;
    }
  }

  static async findByEmail(db, email) {
    try {
      const result = await db.prepare(
        'SELECT * FROM fiel_dados WHERE email = ?'
      ).bind(email).first();
      
      return result ? new FielDados(result) : null;
    } catch (error) {
      console.error('Erro ao buscar dados do fiel:', error);
      return null;
    }
  }

  static async create(db, email) {
    try {
      const now = new Date().toISOString();
      await db.prepare(`
        INSERT INTO fiel_dados (email, musicas, versiculos, oracoes, fotos, termo_aceito, created_at, updated_at)
        VALUES (?, '[]', '[]', '[]', '[]', 0, datetime('now'), datetime('now'))
      `).bind(email).run();
      
      return new FielDados({ email });
    } catch (error) {
      console.error('Erro ao criar dados do fiel:', error);
      throw error;
    }
  }

  async save(db) {
    try {
      await db.prepare(`
        INSERT INTO fiel_dados (email, musicas, versiculos, oracoes, fotos, perfil_data, termo_aceito, termo_data, updated_at)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, datetime('now'))
        ON CONFLICT(email) DO UPDATE SET
          musicas = excluded.musicas,
          versiculos = excluded.versiculos,
          oracoes = excluded.oracoes,
          fotos = excluded.fotos,
          perfil_data = excluded.perfil_data,
          termo_aceito = excluded.termo_aceito,
          termo_data = excluded.termo_data,
          updated_at = excluded.updated_at
      `).bind(
        this.email,
        JSON.stringify(this.musicas || []),
        JSON.stringify(this.versiculos || []),
        JSON.stringify(this.oracoes || []),
        JSON.stringify(this.fotos || []),
        JSON.stringify(this.perfil_data || {}),
        this.termo_aceito,
        JSON.stringify(this.termo_data || null)
      ).run();
      
      return true;
    } catch (error) {
      console.error('Erro ao salvar dados do fiel:', error);
      return false;
    }
  }

  // Métodos específicos para cada tipo de dado
  addMusica(musica) {
    const novaMusica = {
      id: Date.now().toString(),
      ...musica,
      dataAdicionada: new Date().toISOString()
    };
    this.musicas = [novaMusica, ...(this.musicas || [])];
    return novaMusica;
  }

  removeMusica(id) {
    this.musicas = (this.musicas || []).filter(m => m.id !== id);
  }

  addVersiculo(versiculo) {
    const novoVersiculo = {
      id: Date.now().toString(),
      ...versiculo,
      referencia: `${versiculo.livro} ${versiculo.capitulo}:${versiculo.versiculo}`,
      dataAdicionada: new Date().toISOString()
    };
    this.versiculos = [novoVersiculo, ...(this.versiculos || [])];
    return novoVersiculo;
  }

  removeVersiculo(id) {
    this.versiculos = (this.versiculos || []).filter(v => v.id !== id);
  }

  addOracao(oracao) {
    const novaOracao = {
      id: Date.now().toString(),
      ...oracao,
      dataCriacao: new Date().toISOString(),
      dataAtualizacao: new Date().toISOString()
    };
    this.oracoes = [novaOracao, ...(this.oracoes || [])];
    return novaOracao;
  }

  updateOracao(id, data) {
    const index = (this.oracoes || []).findIndex(o => o.id === id);
    if (index !== -1) {
      this.oracoes[index] = {
        ...this.oracoes[index],
        ...data,
        dataAtualizacao: new Date().toISOString()
      };
      return this.oracoes[index];
    }
    return null;
  }

  removeOracao(id) {
    this.oracoes = (this.oracoes || []).filter(o => o.id !== id);
  }

  addFoto(foto) {
    const novaFoto = {
      id: Date.now().toString(),
      ...foto,
      dataAdicionada: new Date().toISOString()
    };
    this.fotos = [novaFoto, ...(this.fotos || [])];
    return novaFoto;
  }

  removeFoto(id) {
    this.fotos = (this.fotos || []).filter(f => f.id !== id);
  }

  updatePerfil(perfil) {
    this.perfil_data = { ...this.perfil_data, ...perfil };
  }

  aceitarTermo(termoData) {
    this.termo_aceito = 1;
    this.termo_data = {
      ...termoData,
      dataAceite: new Date().toISOString()
    };
  }

  toJSON() {
    return {
      email: this.email,
      musicas: this.musicas,
      versiculos: this.versiculos,
      oracoes: this.oracoes,
      fotos: this.fotos,
      perfil: this.perfil_data,
      termoAceito: this.termo_aceito === 1,
      termoData: this.termo_data,
      createdAt: this.created_at,
      updatedAt: this.updated_at
    };
  }
}

export default FielDados;