// src/security/ip-reputation.js

const BLOCKED_IPS = new Set([
  '127.0.0.2', // exemplo
]);

const SUSPICIOUS_COUNTRIES = [
  // você pode usar futuramente com API externa
];

export async function checkIPReputation(ip, env) {
  try {
    if (!ip || ip === 'unknown') {
      return { blocked: false };
    }

    // 🔴 IP bloqueado manualmente
    if (BLOCKED_IPS.has(ip)) {
      return { blocked: true, reason: 'blacklist' };
    }

    // 🧠 KV blacklist dinâmica
    if (env.SECURITY_KV) {
      const flagged = await env.SECURITY_KV.get(`blocked_ip:${ip}`);
      if (flagged) {
        return { blocked: true, reason: 'kv_blacklist' };
      }
    }

    // 🟡 simples heurística (exemplo)
    if (ip.startsWith('0.') || ip.startsWith('255.')) {
      return { blocked: true, reason: 'invalid_range' };
    }

    return { blocked: false };

  } catch (error) {
    console.error('IP Reputation error:', error);
    return { blocked: false };
  }
}