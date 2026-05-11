import { jsonResponse, errorResponse } from '../../utils/helpers.js';

export async function atualizarPerfil(request, env) {
  try {
    const body = await request.json();
    const { email, nome, telefone, avatar } = body;

    if (!email) return errorResponse('E-mail é obrigatório', 400);

    const db = env.DB;
    const now = new Date().toISOString();

    const existing = await db.prepare(
      'SELECT email FROM fiel_dados WHERE email = ?'
    ).bind(email).first();

    if (existing) {
      await db.prepare(`
        UPDATE fiel_dados
        SET nome = ?, telefone = ?, avatar = ?, updated_at = ?
        WHERE email = ?
      `).bind(nome ?? null, telefone ?? null, avatar ?? null, now, email).run();
    } else {
      await db.prepare(`
        INSERT INTO fiel_dados (email, nome, telefone, avatar, musicas, versiculos, oracoes, fotos, termo_aceito, created_at, updated_at)
        VALUES (?, ?, ?, ?, '[]', '[]', '[]', '[]', 0, ?, ?)
      `).bind(email, nome ?? null, telefone ?? null, avatar ?? null, now, now).run();
    }

    return jsonResponse({ success: true, message: 'Perfil atualizado com sucesso' });
  } catch (error) {
    console.error('Erro ao atualizar perfil:', error);
    return errorResponse('Erro ao atualizar perfil', 500);
  }
}