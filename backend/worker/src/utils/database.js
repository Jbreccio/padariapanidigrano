// backend/worker/src/utils/database.js

export async function getFielDados(db, email) {
  try {
    const stmt = db.prepare(`
      SELECT musicas, versiculos, oracoes, fotos, termo_aceito, termo_data
      FROM fiel_dados WHERE email = ?
    `);
    const result = await stmt.bind(email).first();
    
    if (!result) return null;
    
    return {
      musicas: JSON.parse(result.musicas || '[]'),
      versiculos: JSON.parse(result.versiculos || '[]'),
      oracoes: JSON.parse(result.oracoes || '[]'),
      fotos: JSON.parse(result.fotos || '[]'),
      termoAceito: result.termo_aceito === 1,
      termoData: result.termo_data ? JSON.parse(result.termo_data) : null
    };
  } catch (error) {
    console.error('Erro ao buscar dados do fiel:', error);
    return null;
  }
}

export async function saveFielDados(db, email, musicas, versiculos, oracoes, fotos) {
  try {
    await db.prepare(`
      INSERT INTO fiel_dados (email, musicas, versiculos, oracoes, fotos, updated_at)
      VALUES (?, ?, ?, ?, ?, ?)
      ON CONFLICT(email) DO UPDATE SET
        musicas = excluded.musicas,
        versiculos = excluded.versiculos,
        oracoes = excluded.oracoes,
        fotos = excluded.fotos,
        updated_at = excluded.updated_at
    `).bind(
      email,
      JSON.stringify(musicas || []),
      JSON.stringify(versiculos || []),
      JSON.stringify(oracoes || []),
      JSON.stringify(fotos || []),
      new Date().toISOString()
    ).run();
    
    return true;
  } catch (error) {
    console.error('Erro ao salvar dados do fiel:', error);
    return false;
  }
}

export async function getUserByEmail(db, email) {
  try {
    return await db.prepare(
      'SELECT id, nome, email, celular, senha_hash, role, twofa_enabled FROM users WHERE email = ?'
    ).bind(email).first();
  } catch (error) {
    console.error('Erro ao buscar usuário:', error);
    return null;
  }
}

export async function getUserById(db, id) {
  try {
    return await db.prepare(
      'SELECT id, nome, email, celular, role, twofa_enabled FROM users WHERE id = ?'
    ).bind(id).first();
  } catch (error) {
    console.error('Erro ao buscar usuário:', error);
    return null;
  }
}