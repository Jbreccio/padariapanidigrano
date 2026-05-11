import { hashToken } from './auth_shared.js';

export async function getUserFromToken(request, env) {
  const auth = request.headers.get('Authorization') || '';

  if (!auth.startsWith('Bearer ')) {
    throw new Error('Token não fornecido');
  }

  const token = auth.replace('Bearer ', '').trim();
  const tokenHash = await hashToken(token);

  const user = await env.DB.prepare(`
    SELECT id, nome, email, role, twofa_enabled
    FROM users
    WHERE token_hash = ? AND token_expires > ?
    LIMIT 1
  `).bind(tokenHash, Date.now()).first();

  if (!user) {
    throw new Error('Token inválido ou expirado');
  }

  return user;
}