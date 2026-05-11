// backend/worker/src/routes/admin/perfil.js
import { jsonResponse, errorResponse } from '../../utils/helpers.js';
import { requireAdmin } from '../../middleware/auth.js';

export async function getPerfil(request, env) {
  const auth = await requireAdmin(request, env);
  if (auth instanceof Response) return auth;
  
  try {
    const user = await env.DB.prepare(`
      SELECT id, nome, email, celular, role, twofa_enabled 
      FROM users WHERE id = ?
    `).bind(auth.id).first();
    
    if (!user) return errorResponse('Usuário não encontrado', 404);
    return jsonResponse({ success: true, user });
  } catch (error) {
    return errorResponse('Erro ao carregar perfil', 500);
  }
}

export async function atualizarPerfil(request, env) {
  const auth = await requireAdmin(request, env);
  if (auth instanceof Response) return auth;
  
  try {
    const { nome, celular } = await request.json();
    await env.DB.prepare(`
      UPDATE users SET nome = ?, celular = ?, updated_at = datetime('now')
      WHERE id = ?
    `).bind(nome, celular, auth.id).run();
    
    return jsonResponse({ success: true, message: 'Perfil atualizado' });
  } catch (error) {
    return errorResponse('Erro ao atualizar perfil', 500);
  }
}