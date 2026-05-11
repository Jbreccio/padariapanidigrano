// src/middleware/attack-logger.js

export async function logAttack(env, data) {
  try {
    const logEntry = {
      ...data,
      timestamp: new Date().toISOString(),
    };

    // 🪵 console (sempre útil)
    console.warn('🚨 ATTACK DETECTED:', JSON.stringify(logEntry));

    // 💾 salva no KV se existir
    if (env.SECURITY_KV) {
      const key = `attack:${Date.now()}_${Math.random().toString(36).slice(2)}`;
      await env.SECURITY_KV.put(key, JSON.stringify(logEntry), {
        expirationTtl: 60 * 60 * 24 * 7 // 7 dias
      });
    }

  } catch (error) {
    console.error('Error logging attack:', error);
  }
}