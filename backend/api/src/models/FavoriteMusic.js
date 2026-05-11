const db = require('../config/database');

class FavoriteMusic {
  // Buscar todos os favoritos de um usuário
  static async findByUserId(userId) {
    const sql = `
      SELECT id, user_id, music_name, artist_name, spotify_id, 
             spotify_url, cover_image, created_at
      FROM user_favorite_musics 
      WHERE user_id = ? 
      ORDER BY created_at DESC
    `;
    return await db.query(sql, [userId]);
  }

  // Buscar favorito específico
  static async findOne(userId, spotifyId) {
    const sql = `
      SELECT id FROM user_favorite_musics 
      WHERE user_id = ? AND spotify_id = ?
    `;
    const results = await db.query(sql, [userId, spotifyId]);
    return results[0] || null;
  }

  // Adicionar música aos favoritos
  static async create(userId, musicData) {
    const { musicName, artistName, spotifyId, spotifyUrl, coverImage } = musicData;
    
    const sql = `
      INSERT INTO user_favorite_musics 
      (user_id, music_name, artist_name, spotify_id, spotify_url, cover_image) 
      VALUES (?, ?, ?, ?, ?, ?)
    `;
    
    const result = await db.query(sql, [
      userId, musicName, artistName, spotifyId, spotifyUrl, coverImage
    ]);
    
    return { id: result.insertId };
  }

  // Remover música dos favoritos
  static async delete(userId, spotifyId) {
    const sql = `
      DELETE FROM user_favorite_musics 
      WHERE user_id = ? AND spotify_id = ?
    `;
    return await db.query(sql, [userId, spotifyId]);
  }

  // Contar favoritos do usuário
  static async count(userId) {
    const sql = `
      SELECT COUNT(*) as total FROM user_favorite_musics WHERE user_id = ?
    `;
    const result = await db.query(sql, [userId]);
    return result[0]?.total || 0;
  }
}

module.exports = FavoriteMusic;