import { sha256 } from '../security/hash.js';

// 🔐 Busca sessão no KV
async function getSession(request, env) {
  try {
    // 🛡️ proteção contra undefined (SEU BUG PRINCIPAL)
    if (!request || !request.headers) return null;

    const authHeader = request.headers.get('Authorization');
    const token = authHeader?.replace('Bearer ', '');

    if (!token) return null;

    const hash = await sha256(token);

    const session = await env.KV_SESSION.get(`sess:${hash}`, 'json');

    if (!session) return null;

    if (Date.now() > session.expires) return null;

    return session;

  } catch (err) {
    console.error('Erro getSession:', err);
    return null;
  }
}

// ============================================
// 🔐 REQUIRE AUTH (PADRÃO DO SEU WORKER)
// ============================================
async function requireAuth({ request, env }) {
  const session = await getSession(request, env);

  if (!session) {
    return {
      error: true,
      response: new Response('Não autorizado', { status: 401 })
    };
  }

  return {
    error: false,
    user: session.user,
    session
  };
}

// ============================================
// 🔐 REQUIRE ROLE (COMPATÍVEL COM SEU WORKER)
// ============================================
function requireRole(user, roles = []) {
  if (!user) return { allowed: false };

  if (!roles.includes(user.role)) {
    return { allowed: false };
  }

  return { allowed: true };
}

// ============================================
// 🔐 REQUIRE FIEL (OPCIONAL)
// ============================================
async function requireFiel({ request, env }) {
  const session = await getSession(request, env);

  if (!session) {
    return {
      error: true,
      response: new Response('Não autorizado', { status: 401 })
    };
  }

  if (session.user.role !== 'fiel') {
    return {
      error: true,
      response: new Response('Acesso negado', { status: 403 })
    };
  }

  return {
    error: false,
    user: session.user,
    session
  };
}

export { requireAuth, requireRole, requireFiel };