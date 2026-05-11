// 🔐 Middleware de Segurança Avançado

export async function securityMiddleware(request, env) {
  const ip =
    request.headers.get('CF-Connecting-IP') ||
    request.headers.get('x-forwarded-for') ||
    '0.0.0.0';

  const userAgent = request.headers.get('User-Agent') || 'unknown';
  const url = new URL(request.url);

  // ===============================
  // 🚫 BLOQUEIO DE USER-AGENTS SUSPEITOS
  // ===============================
  const blockedAgents = [
    'sqlmap',
    'nikto',
    'nmap',
    'curl',
    'wget',
    'python-requests',
    'httpclient',
    'go-http-client',
    'libwww-perl'
  ];

  if (blockedAgents.some(agent => userAgent.toLowerCase().includes(agent))) {
    return new Response(JSON.stringify({
      success: false,
      error: 'Acesso negado'
    }), { status: 403 });
  }

  // ===============================
  // 🚫 BLOQUEIO DE PATH SUSPEITO
  // ===============================
  const suspiciousPatterns = [
    '../',
    '<script',
    'union select',
    'drop table',
    '--',
    ';--',
    '/*',
    '*/'
  ];

  const fullUrl = request.url.toLowerCase();

  if (suspiciousPatterns.some(p => fullUrl.includes(p))) {
    return new Response(JSON.stringify({
      success: false,
      error: 'Requisição inválida'
    }), { status: 400 });
  }

  // ===============================
  // ⚡ RATE LIMIT (ANTI BRUTE FORCE)
  // ===============================
  const key = `rate:${ip}`;
  const limit = 100; // requests
  const window = 60; // segundos

  const current = await env.AUTH_KV.get(key);

  if (current && parseInt(current) > limit) {
    return new Response(JSON.stringify({
      success: false,
      error: 'Muitas requisições. Aguarde.'
    }), { status: 429 });
  }

  await env.AUTH_KV.put(
    key,
    current ? String(parseInt(current) + 1) : '1',
    { expirationTtl: window }
  );

  // ===============================
  // 🔐 BLOQUEIO DE MÉTODOS INDEVIDOS
  // ===============================
  const allowedMethods = ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'];

  if (!allowedMethods.includes(request.method)) {
    return new Response(JSON.stringify({
      success: false,
      error: 'Método não permitido'
    }), { status: 405 });
  }

  // ===============================
  // 🔐 VALIDAÇÃO DE JSON (anti crash)
  // ===============================
  if (['POST', 'PUT'].includes(request.method)) {
    const contentType = request.headers.get('content-type') || '';

    if (!contentType.includes('application/json') &&
        !contentType.includes('multipart/form-data')) {
      return new Response(JSON.stringify({
        success: false,
        error: 'Content-Type inválido'
      }), { status: 415 });
    }
  }

  // ===============================
  // 🧠 DETECÇÃO DE BOT SIMPLES
  // ===============================
  if (!userAgent || userAgent.length < 10) {
    return new Response(JSON.stringify({
      success: false,
      error: 'Requisição suspeita'
    }), { status: 403 });
  }

  // ===============================
  // 🔐 CABEÇALHOS DE SEGURANÇA
  // ===============================
  const headers = new Headers();

  headers.set('X-Content-Type-Options', 'nosniff');
  headers.set('X-Frame-Options', 'DENY');
  headers.set('X-XSS-Protection', '1; mode=block');
  headers.set('Referrer-Policy', 'no-referrer');
  headers.set('Permissions-Policy', 'geolocation=(), microphone=()');

  headers.set(
    'Content-Security-Policy',
    "default-src 'self'; img-src * data:; script-src 'self'; style-src 'self' 'unsafe-inline'"
  );

  return { ok: true, headers };
}