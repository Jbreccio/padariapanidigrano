// backend/worker/src/services/userService.js

export async function getUserByEmail(env, email) {
  return await env.DB.prepare(
    "SELECT * FROM users WHERE email = ?"
  ).bind(email).first();
}

export async function getUserByToken(env, token) {
  return await env.DB.prepare(
    "SELECT * FROM users WHERE token = ? AND token_expires > ?"
  ).bind(token, Date.now()).first();
}

export async function createUser(env, user) {
  return await env.DB.prepare(`
    INSERT INTO users (id, nome, email, senha, role, created_at)
    VALUES (?, ?, ?, ?, ?, ?)
  `).bind(
    user.id,
    user.nome,
    user.email,
    user.senha,
    user.role || 'fiel',
    new Date().toISOString()
  ).run();
}

export async function updateUserToken(env, userId, token, expires) {
  return await env.DB.prepare(`
    UPDATE users SET token = ?, token_expires = ?
    WHERE id = ?
  `).bind(token, expires, userId).run();
}