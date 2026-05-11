// src/middleware/firewall.js

export async function firewall(contextOrRequest) {
  try {
    const request = contextOrRequest?.request ?? contextOrRequest ?? null;

    if (!request || typeof request.headers?.get !== 'function') {
      console.error('🔥 Firewall: request inválido');
      return null;
    }

    const ua = request.headers.get('User-Agent') || '';
    const ip =
      request.headers.get('CF-Connecting-IP') ||
      request.headers.get('x-forwarded-for')?.split(',')[0] ||
      'unknown';

    const uaLower = ua.toLowerCase();

    // 🚫 User-Agent inválido (mais tolerante)
    if (!ua || ua.length < 8) {
      return new Response(JSON.stringify({
        success: false,
        error: 'User-Agent inválido'
      }), { status: 403 });
    }

    // 🚫 Bots básicos
    const blockedAgents = [
      'curl',
      'wget',
      'python',
      'scrapy',
      'httpclient',
      'insomnia',
      'postman-runtime'
    ];

    if (blockedAgents.some(b => uaLower.includes(b))) {
      return new Response(JSON.stringify({
        success: false,
        error: 'Bot bloqueado'
      }), { status: 403 });
    }

    // 🚫 Bots genéricos (mas sem quebrar Google etc.)
    if (
      uaLower.includes('bot') &&
      !uaLower.includes('google') &&
      !uaLower.includes('bing')
    ) {
      return new Response(JSON.stringify({
        success: false,
        error: 'Bot suspeito'
      }), { status: 403 });
    }

    // 🚫 IP inválido real
    if (!ip || ip === '0.0.0.0') {
      return new Response(JSON.stringify({
        success: false,
        error: 'IP inválido'
      }), { status: 403 });
    }

    // ⚠️ NÃO bloquear 127.0.0.1 (dev!)
    // isso quebrava seu ambiente local antes

    return null;

  } catch (err) {
    console.error('🔥 firewall error:', err);
    return null; // fail open
  }
}