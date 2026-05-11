// src/middleware/risk-engine.js

/**
 * Engine de risco para detectar comportamentos suspeitos
 */
export async function riskEngine(context) {
  const { request, env, ip, fingerprint } = context;
  
  let score = 0;
  const reasons = [];
  
  // 1. Verificar IP em bases conhecidas
  const isTor = await checkTorIP(ip, env);
  if (isTor) {
    score += 30;
    reasons.push('tor_ip');
  }
  
  // 2. Verificar fingerprint repetido com falhas
  if (fingerprint) {
    const failCount = await getFailCountByFingerprint(fingerprint, env);
    if (failCount > 5) {
      score += Math.min(failCount * 5, 40);
      reasons.push(`multiple_failures:${failCount}`);
    }
  }
  
  // 3. Verificar velocidade de requisições
  const requestRate = await getRequestRate(ip, env);
  if (requestRate > 20) {
    score += Math.min(requestRate, 50);
    reasons.push(`high_request_rate:${requestRate}`);
  }
  
  // 4. Verificar user-agent suspeito
  const userAgent = request.headers.get('User-Agent') || '';
  if (isSuspiciousUserAgent(userAgent)) {
    score += 20;
    reasons.push('suspicious_ua');
  }
  
  // 5. Verificar headers incompletos
  if (!request.headers.get('Accept-Language') || !request.headers.get('Accept')) {
    score += 15;
    reasons.push('missing_headers');
  }
  
  // Determina se precisa de CAPTCHA
  const requiresCaptcha = score > 50;
  
  return {
    score: Math.min(score, 100),
    reasons,
    requiresCaptcha,
    level: score > 70 ? 'high' : score > 40 ? 'medium' : 'low'
  };
}

async function checkTorIP(ip, env) {
  // Implementar verificação de TOR (opcional)
  return false;
}

async function getFailCountByFingerprint(fingerprint, env) {
  if (!env.FAILURE_TRACKING) return 0;
  
  const key = `fail:${fingerprint}`;
  const count = await env.FAILURE_TRACKING.get(key);
  return count ? parseInt(count) : 0;
}

async function getRequestRate(ip, env) {
  // Simple rate calculation (implementar se necessário)
  return 0;
}

function isSuspiciousUserAgent(ua) {
  const suspicious = [
    'curl', 'wget', 'python', 'java', 'go-http', 'nikto', 'sqlmap',
    'nmap', 'masscan', 'zgrab', 'httpx', 'hydra'
  ];
  const uaLower = ua.toLowerCase();
  return suspicious.some(s => uaLower.includes(s));
}