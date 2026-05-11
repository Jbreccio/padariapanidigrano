import { jsonResponse } from '../utils/responses.js';

export async function handleFavoritos(request, env) {
  const url = new URL(request.url);
  const userId = request.headers.get('X-User-Id');
  if (!userId) return jsonResponse({ success: false, error: 'Usuário não autenticado' }, 401);
  if (request.method === 'GET') {
    try {
      if (!env.DB) return jsonResponse({ success: true, favoritos: [] });
      const result = await env.DB.prepare(`SELECT * FROM favoritos WHERE user_id = ? ORDER BY data DESC LIMIT 100`).bind(userId).all();
      return jsonResponse({ success: true, favoritos: result.results || [] });
    } catch (error) { return jsonResponse({ success: false, error: 'Erro ao carregar favoritos' }, 500); }
  }
  if (request.method === 'POST') {
    try {
      const body = await request.json();
      const { livro, livroAbbrev, capitulo, versiculo, texto } = body;
      if (!livro || !livroAbbrev || !capitulo || !versiculo || !texto) return jsonResponse({ success: false, error: 'Dados incompletos' }, 400);
      if (!env.DB) return jsonResponse({ success: false, error: 'Banco de dados não disponível' }, 500);
      await env.DB.prepare(`CREATE TABLE IF NOT EXISTS favoritos (id TEXT PRIMARY KEY, user_id TEXT NOT NULL, livro TEXT NOT NULL, livro_abbrev TEXT NOT NULL, capitulo INTEGER NOT NULL, versiculo INTEGER NOT NULL, texto TEXT NOT NULL, data TEXT NOT NULL, UNIQUE(user_id, livro_abbrev, capitulo, versiculo))`).run();
      const id = `${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      const dataAtual = new Date().toISOString();
      await env.DB.prepare(`INSERT OR REPLACE INTO favoritos (id, user_id, livro, livro_abbrev, capitulo, versiculo, texto, data) VALUES (?, ?, ?, ?, ?, ?, ?, ?)`).bind(id, userId, livro, livroAbbrev, capitulo, versiculo, texto, dataAtual).run();
      return jsonResponse({ success: true, message: 'Favorito adicionado com sucesso', favorito: { id, livro, livroAbbrev, capitulo, versiculo, texto, data: dataAtual } });
    } catch (error) { return jsonResponse({ success: false, error: 'Erro ao salvar favorito' }, 500); }
  }
  if (request.method === 'DELETE') {
    try {
      const body = await request.json();
      const { livroAbbrev, capitulo, versiculo } = body;
      if (!livroAbbrev || !capitulo || !versiculo) return jsonResponse({ success: false, error: 'Dados incompletos' }, 400);
      if (!env.DB) return jsonResponse({ success: false, error: 'Banco de dados não disponível' }, 500);
      await env.DB.prepare(`DELETE FROM favoritos WHERE user_id = ? AND livro_abbrev = ? AND capitulo = ? AND versiculo = ?`).bind(userId, livroAbbrev, capitulo, versiculo).run();
      return jsonResponse({ success: true, message: 'Favorito removido com sucesso' });
    } catch (error) { return jsonResponse({ success: false, error: 'Erro ao remover favorito' }, 500); }
  }
  return jsonResponse({ success: false, error: 'Método não permitido' }, 405);
}