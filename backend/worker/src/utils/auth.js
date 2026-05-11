// backend/worker/src/utils/auth.js

// ============================================
// 🔍 PEGAR USUÁRIO PELO TOKEN
// ============================================
export async function getUserFromToken(request, env) {
  const authHeader = request.headers.get('Authorization');

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return null;
  }

  const token = authHeader.replace('Bearer ', '').trim();

  const user = await env.DB.prepare(`
    SELECT id, nome, email, role
    FROM users
    WHERE token = ? AND token_expires > ?
  `).bind(token, Date.now()).first();

  return user || null;
}

// ============================================
// 🔐 REQUIRE AUTH
// ============================================
export async function requireAuth(request, env) {
  const user = await getUserFromToken(request, env);

  if (!user) {
    return new Response(
      JSON.stringify({ success: false, error: 'Não autenticado' }),
      { status: 401 }
    );
  }

  return user;
}

// ============================================
// 🔐 REQUIRE ADMIN
// ============================================
export async function requireAdmin(request, env) {
  const user = await getUserFromToken(request, env);

  if (!user) {
    return new Response(
      JSON.stringify({ success: false, error: 'Não autenticado' }),
      { status: 401 }
    );
  }

  if (user.role !== 'admin') {
    return new Response(
      JSON.stringify({ success: false, error: 'Acesso negado' }),
      { status: 403 }
    );
  }

  return user;
}

// ============================================
// 🔐 REQUIRE FIEL
// ============================================
export async function requireFiel(request, env) {
  const user = await getUserFromToken(request, env);

  if (!user) {
    return new Response(
      JSON.stringify({ success: false, error: 'Não autenticado' }),
      { status: 401 }
    );
  }

  if (user.role !== 'fiel') {
    return new Response(
      JSON.stringify({ success: false, error: 'Acesso negado' }),
      { status: 403 }
    );
  }

  return user;
}