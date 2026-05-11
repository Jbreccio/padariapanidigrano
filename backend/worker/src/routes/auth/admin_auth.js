// backend/worker/src/routes/auth/admin_auth.js

import { jsonResponse } from '../../utils/helpers.js';
import { sha256 } from '../../security/hash.js';  // ✅ import estático no topo

export async function adminVerificarRoute(request, env) {
  try {
    const auth = request.headers.get('Authorization') || '';
    if (!auth.startsWith('Bearer ')) {
      return jsonResponse({ success: false, error: 'Token não fornecido' }, 401);
    }

    const token = auth.replace('Bearer ', '');

    // ✅ Busca no KV_SESSION
    const hash = await sha256(token);
    const sessionData = await env.KV_SESSION.get(`sess:${hash}`, 'json');

    if (!sessionData || sessionData.expires < Date.now()) {
      return jsonResponse({ success: false, error: 'Token inválido ou expirado' }, 401);
    }

    if (sessionData.user.role !== 'admin') {
      return jsonResponse({ success: false, error: 'Acesso negado.' }, 403);
    }

    return jsonResponse({
      success: true,
      user: sessionData.user,
      isAdmin: true
    });

  } catch (err) {
    console.error('❌ adminVerificarRoute:', err);
    return jsonResponse({ success: false, error: 'Erro interno' }, 500);
  }
}