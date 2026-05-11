// backend/worker/src/routes/admin/senha.js
import { jsonResponse, errorResponse } from '../../utils/helpers.js';
import { requireAdmin } from '../../middleware/auth.js';

export async function alterarSenha(request, env) {
  const auth = await requireAdmin(request, env);
  if (auth instanceof Response) return auth;
  
  try {
    const { senha_atual, nova_senha } = await request.json();
    
    const user = await env.DB.prepare(`
      SELECT id, senha_hash FROM users WHERE id = ?
    `).bind(auth.id).first();
    
    if (!user) return errorResponse('Usuário não encontrado', 404);
    
    // Verificar senha atual (simplificado - use bcrypt em produção)
    if (senha_atual !== user.senha_hash) {
      return errorResponse('Senha atual incorreta', 401);
    }
    
    await env.DB.prepare(`
      UPDATE users SET senha_hash = ?, updated_at = datetime('now')
      WHERE id = ?
    `).bind(nova_senha, auth.id).run();
    
    return jsonResponse({ success: true, message: 'Senha alterada com sucesso' });
  } catch (error) {
    return errorResponse('Erro ao alterar senha', 500);
  }
}