// backend/worker/src/middleware/auth.js
// ─────────────────────────────────────────────────────────────────────────────
// REGRAS:
//   • /admin/*  → só role === 'admin' 
//   • /fiel/*   → qualquer role válido (admin, fiel)
//   • Token aceito: admin_token OU fiel_token (mesmo formato base64 JSON)
// ─────────────────────────────────────────────────────────────────────────────

const ADMIN_EMAILS = [
  'marcelotscarlos@gmail.com',
  'andersonmarinho011@gmail.com',
  'oibreccio@gmail.com',          // ← seu email
  // adicione mais se precisar
];

// ── Decodifica o token (base64 JSON) ─────────────────────────────────────────
function decodificarToken(token) {
  try {
    const payload = JSON.parse(atob(token));
    // Verifica expiração
    if (payload.exp && payload.exp < Date.now()) {
      return { erro: 'Token expirado' };
    }
    return payload;
  } catch {
    return { erro: 'Token inválido' };
  }
}

// ── Extrai o Bearer token do header Authorization ─────────────────────────────
function extrairToken(request) {
  const auth = request.headers.get('Authorization') || '';
  if (auth.startsWith('Bearer ')) return auth.slice(7).trim();
  return null;
}

// ── Middleware para rotas ADMIN (só admin) ────────────────────────
export async function requireAdmin(request, env) {
  const token = extrairToken(request);
  if (!token) {
    return new Response(JSON.stringify({ success: false, error: 'Token não fornecido' }), {
      status: 401,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  const payload = decodificarToken(token);
  if (payload.erro) {
    return new Response(JSON.stringify({ success: false, error: payload.erro }), {
      status: 401,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  // Aceita pelo role OU pelo email da lista de admins
  const isAdmin =
    payload.role === 'admin' ||
    payload.role === 'fiel' ||
    ADMIN_EMAILS.includes(payload.email);

  if (!isAdmin) {
    return new Response(JSON.stringify({ success: false, error: 'Acesso negado' }), {
      status: 403,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  return payload; // { id, nome, email, role, exp }
}

// ── Middleware para rotas FIEL (qualquer usuário autenticado) ─────────────────
export async function requireFiel(request, env) {
  const token = extrairToken(request);
  if (!token) {
    return new Response(JSON.stringify({ success: false, error: 'Token não fornecido' }), {
      status: 401,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  const payload = decodificarToken(token);
  if (payload.erro) {
    return new Response(JSON.stringify({ success: false, error: payload.erro }), {
      status: 401,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  // Qualquer role válido pode acessar área do fiel
  if (!payload.id && !payload.email) {
    return new Response(JSON.stringify({ success: false, error: 'Token malformado' }), {
      status: 401,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  return payload;
}

// ── Helper: verifica se o usuário é admin sem retornar Response ───────────────
export function isAdmin(payload) {
  return (
    payload?.role === 'admin' ||
    payload?.role === 'fiel' ||
    ADMIN_EMAILS.includes(payload?.email)
  );
}