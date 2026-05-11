// backend/api/src/models/User.js
import bcrypt from 'bcryptjs';
import { v4 as uuidv4 } from 'uuid';

export class User {
  constructor(data) {
    this.id = data.id;
    this.nome = data.nome;
    this.email = data.email;
    this.senha_hash = data.senha_hash;
    this.celular = data.celular;
    this.role = data.role || 'user';
    this.email_verified = data.email_verified || 0;
    this.twofa_enabled = data.twofa_enabled || 0;
    this.created_at = data.created_at;
    this.updated_at = data.updated_at;
  }

  static async findByEmail(db, email) {
    try {
      const result = await db.prepare(
        'SELECT * FROM users WHERE email = ?'
      ).bind(email).first();
      
      return result ? new User(result) : null;
    } catch (error) {
      console.error('Erro ao buscar usuário por email:', error);
      return null;
    }
  }

  static async findById(db, id) {
    try {
      const result = await db.prepare(
        'SELECT * FROM users WHERE id = ?'
      ).bind(id).first();
      
      return result ? new User(result) : null;
    } catch (error) {
      console.error('Erro ao buscar usuário por ID:', error);
      return null;
    }
  }

  static async create(db, userData) {
    try {
      const id = uuidv4();
      const salt = await bcrypt.genSalt(10);
      const senha_hash = await bcrypt.hash(userData.senha, salt);
      
      await db.prepare(`
        INSERT INTO users (id, nome, email, senha_hash, celular, role, created_at, updated_at)
        VALUES (?, ?, ?, ?, ?, ?, datetime('now'), datetime('now'))
      `).bind(
        id,
        userData.nome,
        userData.email,
        senha_hash,
        userData.celular || null,
        userData.role || 'user'
      ).run();
      
      return new User({ id, ...userData, senha_hash });
    } catch (error) {
      console.error('Erro ao criar usuário:', error);
      throw error;
    }
  }

  async update(db, data) {
    try {
      const updates = [];
      const values = [];
      
      if (data.nome !== undefined) {
        updates.push('nome = ?');
        values.push(data.nome);
      }
      if (data.celular !== undefined) {
        updates.push('celular = ?');
        values.push(data.celular);
      }
      if (data.role !== undefined) {
        updates.push('role = ?');
        values.push(data.role);
      }
      if (data.email_verified !== undefined) {
        updates.push('email_verified = ?');
        values.push(data.email_verified);
      }
      if (data.twofa_enabled !== undefined) {
        updates.push('twofa_enabled = ?');
        values.push(data.twofa_enabled);
      }
      
      if (updates.length === 0) return false;
      
      updates.push('updated_at = datetime("now")');
      values.push(this.id);
      
      await db.prepare(`
        UPDATE users SET ${updates.join(', ')} WHERE id = ?
      `).bind(...values).run();
      
      // Atualizar propriedades
      Object.assign(this, data);
      return true;
    } catch (error) {
      console.error('Erro ao atualizar usuário:', error);
      return false;
    }
  }

  async updatePassword(db, novaSenha) {
    try {
      const salt = await bcrypt.genSalt(10);
      const senha_hash = await bcrypt.hash(novaSenha, salt);
      
      await db.prepare(`
        UPDATE users SET senha_hash = ?, updated_at = datetime('now') WHERE id = ?
      `).bind(senha_hash, this.id).run();
      
      this.senha_hash = senha_hash;
      return true;
    } catch (error) {
      console.error('Erro ao atualizar senha:', error);
      return false;
    }
  }

  async verifyPassword(senha) {
    try {
      return await bcrypt.compare(senha, this.senha_hash);
    } catch (error) {
      console.error('Erro ao verificar senha:', error);
      return false;
    }
  }

  toJSON() {
    return {
      id: this.id,
      nome: this.nome,
      email: this.email,
      celular: this.celular,
      role: this.role,
      email_verified: this.email_verified,
      twofa_enabled: this.twofa_enabled,
      created_at: this.created_at,
      updated_at: this.updated_at
    };
  }
}

export default User;