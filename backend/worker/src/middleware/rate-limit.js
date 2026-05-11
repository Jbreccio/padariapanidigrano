// backend/worker/src/middleware/rate-limit.js

// ==============================
// CONFIGURAÇÃO
// ==============================
export const RATE_LIMITS = {
  login: { limit: 5, window: 60 },
  verifyPin: { limit: 5, window: 120 },
  verify2fa: { limit: 3, window: 60 },
  forgotPassword: { limit: 3, window: 300 },
  resetPassword: { limit: 3, window: 300 },
  reset2fa: { limit: 2, window: 600 },
  default: { limit: 100, window: 60 }
};

// ==============================
// IDENTIFICADOR FORTE
// ==============================
function buildIdentifier(request, extraKey = '') {
  const ip =
    request.headers.get('CF-Connecting-IP') ||
    request.headers.get('x-real-ip') ||
    request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ||
    'unknown';

  const ua = request.headers.get('user-agent') || 'unknown';
  const url = new URL(request.url);

  // 🔥 fingerprint mais equilibrado (evita chave gigante e spoof simples)
  const fingerprint = `${ip}:${ua.slice(0, 50)}:${url.pathname}:${extraKey || 'anon'}`;

  return {
    ip,
    ua,
    path: url.pathname,
    user: extraKey || 'anon',
    key: fingerprint
  };
}

// ==============================
// RATE LIMIT CORE
// ==============================
async function rateLimitCore(identifier, env, limit, windowSeconds) {
  const now = Math.floor(Date.now() / 1000);
  const windowKey = Math.floor(now / windowSeconds);

  const key = `rate:${identifier.key}:${windowKey}`;
  const blockKey = `block:${identifier.key}`;

  try {
    // 🚨 Verifica bloqueio ativo
    const blocked = await env.KV_RATE.get(blockKey);
    if (blocked) {
      return { allowed: false, reset: 60 };
    }

    let count = 0;

    const current = await env.KV_RATE.get(key);
    count = current ? Number(current) : 0;
    if (isNaN(count)) count = 0;

    // 🚨 Excedeu limite
    if (count >= limit) {
      // 🔥 penalidade exponencial (máx 1h)
      const penalty = Math.min(3600, Math.pow(2, count));

      await env.KV_RATE.put(blockKey, '1', {
        expirationTtl: penalty
      });

      return {
        allowed: false,
        remaining: 0,
        reset: penalty
      };
    }

    // 🔥 controle de janela mais correto (não reinicia TTL toda hora)
    if (count === 0) {
      await env.KV_RATE.put(key, '1', {
        expirationTtl: windowSeconds
      });
    } else {
      await env.KV_RATE.put(key, String(count + 1));
    }

    return {
      allowed: true,
      remaining: Math.max(0, limit - (count + 1)),
      reset: windowSeconds
    };

  } catch (error) {
    console.error('Rate limit error:', error);
    return { allowed: true };
  }
}

// ==============================
// DETECTAR ATAQUE DISTRIBUÍDO
// ==============================
async function detectDistributedAttack(env, userKey, ip) {
  const key = `attack:${userKey}`;
  const current = await env.KV_RATE.get(key);

  let data = current ? JSON.parse(current) : { ips: [] };

  if (!data.ips.includes(ip)) {
    data.ips.push(ip);
  }

  // 🔥 mais realista (evita falso positivo)
  if (data.ips.length >= 10) {
    return true;
  }

  await env.KV_RATE.put(key, JSON.stringify(data), {
    expirationTtl: 300 // 5 minutos
  });

  return false;
}

// ==============================
// CONFIG POR ROTA
// ==============================
export function getRateLimitConfig(pathname) {
  if (pathname.includes('/login')) return RATE_LIMITS.login;
  if (pathname.includes('/verify-pin')) return RATE_LIMITS.verifyPin;
  if (pathname.includes('/verify-2fa')) return RATE_LIMITS.verify2fa;
  if (pathname.includes('/esqueci-senha')) return RATE_LIMITS.forgotPassword;
  if (pathname.includes('/confirmar-reset-senha')) return RATE_LIMITS.resetPassword;
  if (pathname.includes('/reset-2fa')) return RATE_LIMITS.reset2fa;
  return RATE_LIMITS.default;
}

// ==============================
// FUNÇÃO PRINCIPAL
// ==============================
export async function applyRateLimit(request, env, extraKey = '') {
  const identifier = buildIdentifier(request, extraKey);
  const config = getRateLimitConfig(identifier.path);

  // 🚨 DETECTA ATAQUE DISTRIBUÍDO
  if (extraKey) {
    const attack = await detectDistributedAttack(env, extraKey, identifier.ip);
    if (attack) {
      return new Response(
        JSON.stringify({
          success: false,
          error: 'Atividade suspeita detectada. Tente novamente mais tarde.'
        }),
        { status: 429 }
      );
    }
  }

  const result = await rateLimitCore(
    identifier,
    env,
    config.limit,
    config.window
  );

  if (!result.allowed) {
    return new Response(
      JSON.stringify({
        success: false,
        error: 'Muitas tentativas. Aguarde antes de tentar novamente.'
      }),
      {
        status: 429,
        headers: {
          'Content-Type': 'application/json',
          'X-RateLimit-Limit': String(config.limit),
          'X-RateLimit-Remaining': '0',
          'X-RateLimit-Reset': String(result.reset)
        }
      }
    );
  }

  return null;
}