var __defProp = Object.defineProperty;
var __name = (target, value) => __defProp(target, "name", { value, configurable: true });

// src/utils/cors.js
var allowedOrigins = [
  "http://localhost:5173",
  "https://santuariodefatima.oibreccio.workers.dev"
];
var corsHeaders2 = {
  "Access-Control-Allow-Origin": "*",
  // fallback (não será usado se tiver origin válido)
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization"
};
function getCorsHeaders(origin) {
  if (allowedOrigins.includes(origin)) {
    return {
      "Access-Control-Allow-Origin": origin,
      "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type, Authorization",
      "Access-Control-Allow-Credentials": "true"
    };
  }
  return {
    "Access-Control-Allow-Origin": "null"
  };
}
__name(getCorsHeaders, "getCorsHeaders");
function handleCorsOptions(request) {
  if (request.method === "OPTIONS") {
    const origin = request.headers.get("Origin");
    const headers = getCorsHeaders(origin);
    return new Response(null, {
      status: 204,
      headers
    });
  }
  return null;
}
__name(handleCorsOptions, "handleCorsOptions");
function addCorsHeaders(response, request) {
  const origin = request.headers.get("Origin");
  const headers = getCorsHeaders(origin);
  const newResponse = new Response(response.body, response);
  Object.entries(headers).forEach(([key, value]) => {
    newResponse.headers.set(key, value);
  });
  return newResponse;
}
__name(addCorsHeaders, "addCorsHeaders");

// src/utils/helpers.js
function cleanText(text) {
  if (!text) return text;
  return text.replace(/<!\[CDATA\[/g, "").replace(/\]\]>/g, "").replace(/<[^>]+>/g, "").replace(/&[a-z]+;/g, " ").replace(/\s+/g, " ").trim();
}
__name(cleanText, "cleanText");
function cleanYouTubeTitle(title) {
  if (!title) return title;
  return title.replace(/&quot;/g, '"').replace(/&#39;/g, "'").replace(/&amp;/g, "&").replace(/&lt;/g, "<").replace(/&gt;/g, ">").replace(/&nbsp;/g, " ").replace(/&aacute;/g, "a").replace(/&eacute;/g, "e").replace(/&iacute;/g, "i").replace(/&oacute;/g, "o").replace(/&uacute;/g, "u").replace(/&atilde;/g, "a").replace(/&otilde;/g, "o").replace(/&ccedil;/g, "c").replace(/&acirc;/g, "a").replace(/&ecirc;/g, "e").replace(/&ocirc;/g, "o").trim();
}
__name(cleanYouTubeTitle, "cleanYouTubeTitle");
function cleanVideoId(id) {
  if (!id) return id;
  return id.split("&")[0].trim();
}
__name(cleanVideoId, "cleanVideoId");
function jsonResponse(data, status = 200, additionalHeaders = {}) {
  return new Response(JSON.stringify(data, null, 2), {
    status,
    headers: {
      "Content-Type": "application/json; charset=utf-8",
      ...corsHeaders2,
      // ← objeto, sem parênteses
      ...additionalHeaders
    }
  });
}
__name(jsonResponse, "jsonResponse");
function errorResponse(message, status = 400) {
  return jsonResponse({ success: false, error: message }, status);
}
__name(errorResponse, "errorResponse");

// src/security/hash.js
var encoder = new TextEncoder();
async function sha256(input) {
  const data = encoder.encode(input);
  const hash = await crypto.subtle.digest("SHA-256", data);
  return [...new Uint8Array(hash)].map((b) => b.toString(16).padStart(2, "0")).join("");
}
__name(sha256, "sha256");

// src/middleware/auth.js
async function getSession(request, env) {
  try {
    if (!request || !request.headers) return null;
    const authHeader = request.headers.get("Authorization");
    const token = authHeader?.replace("Bearer ", "");
    if (!token) return null;
    const hash = await sha256(token);
    const session = await env.KV_SESSION.get(`sess:${hash}`, "json");
    if (!session) return null;
    if (Date.now() > session.expires) return null;
    return session;
  } catch (err) {
    console.error("Erro getSession:", err);
    return null;
  }
}
__name(getSession, "getSession");
async function requireAuth({ request, env }) {
  const session = await getSession(request, env);
  if (!session) {
    return {
      error: true,
      response: new Response("N\xE3o autorizado", { status: 401 })
    };
  }
  return {
    error: false,
    user: session.user,
    session
  };
}
__name(requireAuth, "requireAuth");
function requireRole(user, roles = []) {
  if (!user) return { allowed: false };
  if (!roles.includes(user.role)) {
    return { allowed: false };
  }
  return { allowed: true };
}
__name(requireRole, "requireRole");
async function requireFiel({ request, env }) {
  const session = await getSession(request, env);
  if (!session) {
    return {
      error: true,
      response: new Response("N\xE3o autorizado", { status: 401 })
    };
  }
  if (session.user.role !== "fiel") {
    return {
      error: true,
      response: new Response("Acesso negado", { status: 403 })
    };
  }
  return {
    error: false,
    user: session.user,
    session
  };
}
__name(requireFiel, "requireFiel");

// src/middleware/firewall.js
async function firewall(contextOrRequest) {
  try {
    const request = contextOrRequest?.request ?? contextOrRequest ?? null;
    if (!request || typeof request.headers?.get !== "function") {
      console.error("\u{1F525} Firewall: request inv\xE1lido ou undefined");
      return null;
    }
    const ua = request.headers.get("User-Agent") || "";
    const ip = request.headers.get("CF-Connecting-IP") || request.headers.get("X-Forwarded-For") || "unknown";
    if (!ua || ua.length < 10) {
      return new Response(
        JSON.stringify({ success: false, error: "User-Agent inv\xE1lido" }),
        { status: 403, headers: { "Content-Type": "application/json" } }
      );
    }
    const blockedAgents = [
      "curl",
      "wget",
      "python",
      "bot",
      "spider",
      "crawler",
      "scrapy"
    ];
    const uaLower = ua.toLowerCase();
    if (blockedAgents.some((b) => uaLower.includes(b))) {
      return new Response(
        JSON.stringify({ success: false, error: "Bot detectado" }),
        { status: 403, headers: { "Content-Type": "application/json" } }
      );
    }
    if (ip === "0.0.0.0" || ip === "127.0.0.1") {
      return new Response(
        JSON.stringify({ success: false, error: "IP inv\xE1lido" }),
        { status: 403, headers: { "Content-Type": "application/json" } }
      );
    }
    return null;
  } catch (err) {
    console.error("\u{1F525} firewall error:", err);
    return null;
  }
}
__name(firewall, "firewall");

// src/middleware/bot-detector.js
function detectBot(request) {
  try {
    if (!request || !request.headers) return false;
    const ua = request.headers.get("User-Agent") || "";
    if (!ua) return true;
    const patterns = [
      "bot",
      "crawler",
      "spider",
      "scraper"
    ];
    return patterns.some((p) => ua.toLowerCase().includes(p));
  } catch (err) {
    console.error("bot detector error:", err);
    return false;
  }
}
__name(detectBot, "detectBot");

// src/middleware/rate-limit.js
async function rateLimit(identifier, env, limit = 60, windowSeconds = 60) {
  if (!identifier) return true;
  const now = Math.floor(Date.now() / 1e3);
  const windowStart = now - windowSeconds;
  const key = `rate_limit:${identifier}:${Math.floor(now / windowSeconds)}`;
  try {
    if (env.RATE_LIMIT_KV) {
      const current2 = await env.RATE_LIMIT_KV.get(key);
      const count = current2 ? parseInt(current2) : 0;
      if (count >= limit) {
        return false;
      }
      await env.RATE_LIMIT_KV.put(key, String(count + 1), { expirationTtl: windowSeconds });
      return true;
    }
    if (!global.rateLimitCache) {
      global.rateLimitCache = /* @__PURE__ */ new Map();
    }
    const current = global.rateLimitCache.get(key) || 0;
    if (current >= limit) {
      return false;
    }
    global.rateLimitCache.set(key, current + 1);
    setTimeout(() => {
      global.rateLimitCache.delete(key);
    }, windowSeconds * 1e3);
    return true;
  } catch (error) {
    console.error("Rate limit error:", error);
    return true;
  }
}
__name(rateLimit, "rateLimit");
var RATE_LIMITS = {
  login: { limit: 5, window: 60 },
  verifyPin: { limit: 10, window: 120 },
  verify2fa: { limit: 5, window: 60 },
  forgotPassword: { limit: 3, window: 300 },
  resetPassword: { limit: 3, window: 300 },
  prayer: { limit: 10, window: 60 },
  contact: { limit: 5, window: 60 },
  candle: { limit: 10, window: 60 },
  default: { limit: 100, window: 60 }
};
function getRateLimitConfig(pathname) {
  if (pathname.includes("/login")) return RATE_LIMITS.login;
  if (pathname.includes("/verify-pin")) return RATE_LIMITS.verifyPin;
  if (pathname.includes("/verify-2fa")) return RATE_LIMITS.verify2fa;
  if (pathname.includes("/esqueci-senha")) return RATE_LIMITS.forgotPassword;
  if (pathname.includes("/confirmar-reset-senha")) return RATE_LIMITS.resetPassword;
  if (pathname.includes("/prayer")) return RATE_LIMITS.prayer;
  if (pathname.includes("/contato")) return RATE_LIMITS.contact;
  if (pathname.includes("/candle")) return RATE_LIMITS.candle;
  return RATE_LIMITS.default;
}
__name(getRateLimitConfig, "getRateLimitConfig");

// src/middleware/waf.js
async function waf(context) {
  const { request, pathname } = context;
  const maliciousPatterns = [
    /<script/i,
    /javascript:/i,
    /onload=/i,
    /onerror=/i,
    /eval\(/i,
    /document\.cookie/i,
    /localStorage\./i,
    /sessionStorage\./i,
    /\.\.\/\.\.\//,
    /\/etc\/passwd/,
    /\%00/,
    /\bUNION\b.*\bSELECT\b/i,
    /\bSELECT\b.*\bFROM\b/i,
    /\bINSERT\b.*\bINTO\b/i,
    /\bDELETE\b.*\bFROM\b/i,
    /\bDROP\b.*\bTABLE\b/i,
    /\bEXEC\b.*\bXP_/i
  ];
  for (const pattern of maliciousPatterns) {
    if (pattern.test(pathname)) {
      return new Response("Forbidden", { status: 403 });
    }
  }
  const userAgent = request.headers.get("User-Agent") || "";
  const suspiciousUA = /(sqlmap|nikto|nmap|masscan|zgrab|httpx)/i;
  if (suspiciousUA.test(userAgent)) {
    return new Response("Forbidden", { status: 403 });
  }
  const allowedMethods = ["GET", "POST", "PUT", "DELETE", "OPTIONS"];
  if (!allowedMethods.includes(request.method)) {
    return new Response("Method Not Allowed", { status: 405 });
  }
  const url = request.url;
  if (url.length > 2e3) {
    return new Response("URI Too Long", { status: 414 });
  }
  return null;
}
__name(waf, "waf");

// src/security/ip-reputation.js
var BLOCKED_IPS = /* @__PURE__ */ new Set([
  "127.0.0.2"
  // exemplo
]);
async function checkIPReputation(ip, env) {
  try {
    if (!ip || ip === "unknown") {
      return { blocked: false };
    }
    if (BLOCKED_IPS.has(ip)) {
      return { blocked: true, reason: "blacklist" };
    }
    if (env.SECURITY_KV) {
      const flagged = await env.SECURITY_KV.get(`blocked_ip:${ip}`);
      if (flagged) {
        return { blocked: true, reason: "kv_blacklist" };
      }
    }
    if (ip.startsWith("0.") || ip.startsWith("255.")) {
      return { blocked: true, reason: "invalid_range" };
    }
    return { blocked: false };
  } catch (error) {
    console.error("IP Reputation error:", error);
    return { blocked: false };
  }
}
__name(checkIPReputation, "checkIPReputation");

// src/middleware/attack-logger.js
async function logAttack(env, data) {
  try {
    const logEntry = {
      ...data,
      timestamp: (/* @__PURE__ */ new Date()).toISOString()
    };
    console.warn("\u{1F6A8} ATTACK DETECTED:", JSON.stringify(logEntry));
    if (env.SECURITY_KV) {
      const key = `attack:${Date.now()}_${Math.random().toString(36).slice(2)}`;
      await env.SECURITY_KV.put(key, JSON.stringify(logEntry), {
        expirationTtl: 60 * 60 * 24 * 7
        // 7 dias
      });
    }
  } catch (error) {
    console.error("Error logging attack:", error);
  }
}
__name(logAttack, "logAttack");

// src/middleware/fingerprint.js
async function fingerprint(context) {
  const { request, ip } = context;
  const userAgent = request.headers.get("User-Agent") || "";
  const acceptLanguage = request.headers.get("Accept-Language") || "";
  const acceptEncoding = request.headers.get("Accept-Encoding") || "";
  const fingerprintData = `${ip}|${userAgent}|${acceptLanguage}|${acceptEncoding}`;
  const encoder2 = new TextEncoder();
  const data = encoder2.encode(fingerprintData);
  const hash = await crypto.subtle.digest("SHA-256", data);
  const fingerprint2 = Array.from(new Uint8Array(hash)).map((b) => b.toString(16).padStart(2, "0")).join("").substring(0, 32);
  return fingerprint2;
}
__name(fingerprint, "fingerprint");

// src/middleware/risk-engine.js
async function riskEngine(context) {
  const { request, env, ip, fingerprint: fingerprint2 } = context;
  let score = 0;
  const reasons = [];
  const isTor = await checkTorIP(ip, env);
  if (isTor) {
    score += 30;
    reasons.push("tor_ip");
  }
  if (fingerprint2) {
    const failCount = await getFailCountByFingerprint(fingerprint2, env);
    if (failCount > 5) {
      score += Math.min(failCount * 5, 40);
      reasons.push(`multiple_failures:${failCount}`);
    }
  }
  const requestRate = await getRequestRate(ip, env);
  if (requestRate > 20) {
    score += Math.min(requestRate, 50);
    reasons.push(`high_request_rate:${requestRate}`);
  }
  const userAgent = request.headers.get("User-Agent") || "";
  if (isSuspiciousUserAgent(userAgent)) {
    score += 20;
    reasons.push("suspicious_ua");
  }
  if (!request.headers.get("Accept-Language") || !request.headers.get("Accept")) {
    score += 15;
    reasons.push("missing_headers");
  }
  const requiresCaptcha = score > 50;
  return {
    score: Math.min(score, 100),
    reasons,
    requiresCaptcha,
    level: score > 70 ? "high" : score > 40 ? "medium" : "low"
  };
}
__name(riskEngine, "riskEngine");
async function checkTorIP(ip, env) {
  return false;
}
__name(checkTorIP, "checkTorIP");
async function getFailCountByFingerprint(fingerprint2, env) {
  if (!env.FAILURE_TRACKING) return 0;
  const key = `fail:${fingerprint2}`;
  const count = await env.FAILURE_TRACKING.get(key);
  return count ? parseInt(count) : 0;
}
__name(getFailCountByFingerprint, "getFailCountByFingerprint");
async function getRequestRate(ip, env) {
  return 0;
}
__name(getRequestRate, "getRequestRate");
function isSuspiciousUserAgent(ua) {
  const suspicious = [
    "curl",
    "wget",
    "python",
    "java",
    "go-http",
    "nikto",
    "sqlmap",
    "nmap",
    "masscan",
    "zgrab",
    "httpx",
    "hydra"
  ];
  const uaLower = ua.toLowerCase();
  return suspicious.some((s) => uaLower.includes(s));
}
__name(isSuspiciousUserAgent, "isSuspiciousUserAgent");

// src/middleware/captcha.js
async function verifyCaptcha(context) {
  const { request, env } = context;
  let token = null;
  try {
    const body = await request.clone().json().catch(() => ({}));
    token = body.captchaToken || body["g-recaptcha-response"] || null;
  } catch (e) {
  }
  if (!token) {
    if (env.ENVIRONMENT === "development") {
      return true;
    }
    return false;
  }
  const secretKey = env.RECAPTCHA_SECRET_KEY || env.HCAPTCHA_SECRET_KEY;
  const verifyUrl = env.RECAPTCHA_SECRET_KEY ? `https://www.google.com/recaptcha/api/siteverify?secret=${secretKey}&response=${token}` : `https://hcaptcha.com/siteverify?secret=${secretKey}&response=${token}`;
  try {
    const response = await fetch(verifyUrl, { method: "POST" });
    const data = await response.json();
    if (data.success && data.score >= 0.5) {
      return true;
    }
    return false;
  } catch (error) {
    console.error("Erro ao verificar CAPTCHA:", error);
    return env.ENVIRONMENT === "development";
  }
}
__name(verifyCaptcha, "verifyCaptcha");

// src/utils/sanitize.js
function sanitizeInput(input) {
  if (input === null || input === void 0) {
    return null;
  }
  if (typeof input === "string") {
    return input.trim().replace(/[<>]/g, "").replace(/&/g, "&amp;").replace(/"/g, "&quot;").replace(/'/g, "&#x27;").replace(/\//g, "&#x2F;").slice(0, 5e3);
  }
  if (typeof input === "object" && !Array.isArray(input)) {
    const sanitized = {};
    for (const [key, value] of Object.entries(input)) {
      const safeKey = typeof key === "string" ? key.slice(0, 100) : key;
      sanitized[safeKey] = sanitizeInput(value);
    }
    return sanitized;
  }
  if (Array.isArray(input)) {
    return input.slice(0, 100).map((item) => sanitizeInput(item));
  }
  if (typeof input === "number") {
    return Math.min(Math.max(input, -999999999), 999999999);
  }
  return input;
}
__name(sanitizeInput, "sanitizeInput");
async function hashToken(token) {
  const encoder2 = new TextEncoder();
  const data = encoder2.encode(token);
  const hash = await crypto.subtle.digest("SHA-256", data);
  return Array.from(new Uint8Array(hash)).map((b) => b.toString(16).padStart(2, "0")).join("");
}
__name(hashToken, "hashToken");
function validatePayloadSize(request, maxSize = 1048576) {
  const contentLength = request.headers.get("content-length");
  if (contentLength && parseInt(contentLength) > maxSize) {
    return new Response(
      JSON.stringify({ success: false, error: "Payload muito grande" }),
      { status: 413, headers: { "Content-Type": "application/json" } }
    );
  }
  return null;
}
__name(validatePayloadSize, "validatePayloadSize");
async function fetchWithTimeout(url, options = {}, timeout = 5e3) {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeout);
  try {
    const response = await fetch(url, { ...options, signal: controller.signal });
    clearTimeout(timeoutId);
    return response;
  } catch (error) {
    clearTimeout(timeoutId);
    if (error.name === "AbortError") {
      throw new Error("Request timeout");
    }
    throw error;
  }
}
__name(fetchWithTimeout, "fetchWithTimeout");
function createRequestId() {
  return crypto.randomUUID();
}
__name(createRequestId, "createRequestId");

// src/utils/headers.js
function addSecurityHeaders(response) {
  if (!response) {
    return new Response("Erro interno", { status: 500 });
  }
  const headers = new Headers(response.headers);
  headers.set("X-Content-Type-Options", "nosniff");
  headers.set("X-Frame-Options", "DENY");
  headers.set("X-XSS-Protection", "1; mode=block");
  headers.set("Referrer-Policy", "strict-origin-when-cross-origin");
  headers.set("Permissions-Policy", "geolocation=(), microphone=(), camera=()");
  headers.set("Strict-Transport-Security", "max-age=31536000; includeSubDomains");
  headers.set(
    "Content-Security-Policy",
    "default-src 'self'; img-src 'self' https:; media-src 'self' https:; style-src 'self' 'unsafe-inline'; script-src 'self'"
  );
  return new Response(response.body, {
    status: response.status,
    headers
  });
}
__name(addSecurityHeaders, "addSecurityHeaders");

// src/utils/emails.js
var CONFIG = {
  // 📧 SECRETARIA (2 emails)
  SECRETARIAT_EMAILS: [
    "pascom.santuario@outlook.com.br",
    "santuarionsradefatima@santoamaro.org.br"
  ],
  // 📧 CONTATO GERAL (2 emails)
  CONTACT_EMAILS: [
    "pascom.santuario@outlook.com.br",
    "santuarionsradefatima@santoamaro.org.br"
  ],
  // 📧 PEDIDOS DE ORAÇÃO (apenas 1 email)
  PRAYER_EMAILS: [
    "pascom.santuario@outlook.com.br"
  ]
};
var IMAGEM_NOSSA_SENHORA = "https://santuariodefatima.com.br/images/nossa-senhora-fatima.jpg";
function getHorarioSecretariaAviso() {
  const now = /* @__PURE__ */ new Date();
  const hora = now.getHours();
  const diaSemana = now.getDay();
  const isDiaUtil = diaSemana >= 2 && diaSemana <= 6;
  const isHorarioComercial = hora >= 9 && hora < 17;
  if (!isDiaUtil || !isHorarioComercial) {
    return {
      ativo: true,
      mensagem: "\u26A0\uFE0F Nossa secretaria funciona de ter\xE7a a s\xE1bado, das 9h \xE0s 17h. Responderemos em breve."
    };
  }
  return { ativo: false, mensagem: "" };
}
__name(getHorarioSecretariaAviso, "getHorarioSecretariaAviso");
function getEmailHeader(titulo) {
  return `
<div class="header">
  <img src="${IMAGEM_NOSSA_SENHORA}" alt="Nossa Senhora de Fatima" class="header-image">
  <div class="header-title">
    <h1>${titulo}</h1>
    <p>Santuario Nossa Senhora de Fatima - Santo Amaro</p>
  </div>
</div>`;
}
__name(getEmailHeader, "getEmailHeader");
function getEmailFooter() {
  return `
<div class="footer">
  <p><strong>Santuario Nossa Senhora de Fatima</strong></p>
  <p>Rua Darwin, 651 - Santo Amaro, Sao Paulo - SP</p>
  <p>santuariodefatima.com.br | (11) 5521-0312</p>
  <p style="margin-top: 10px;">\u{1F64F} Nossa Senhora de Fatima, rogai por n\xF3s!</p>
</div>`;
}
__name(getEmailFooter, "getEmailFooter");
async function sendPrayerConfirmationEmail(env, data) {
  try {
    if (!env.RESEND_API_KEY) {
      return;
    }
    const currentDate = (/* @__PURE__ */ new Date()).toLocaleDateString("pt-BR", { weekday: "long", year: "numeric", month: "long", day: "numeric" });
    const aviso = getHorarioSecretariaAviso();
    const html = `<!DOCTYPE html>
<html>
<head><meta charset="UTF-8"><title>\u{1F64F} Pedido de Oracao - Santuario de Fatima</title>
<style>
body{font-family:'Georgia','Times New Roman',serif;background:#f5f5f5;margin:0;padding:20px;}
.container{max-width:600px;margin:0 auto;background:white;border-radius:16px;overflow:hidden;box-shadow:0 10px 30px rgba(0,0,0,0.1);}
.header{background:#0b3b5c;color:white;padding:0;text-align:center;}
.header-image{width:100%;height:auto;max-height:250px;object-fit:cover;display:block;border-bottom:3px solid #b8860b;}
.header-title{padding:20px;background:#0b3b5c;}
.header-title h1{font-size:28px;margin:0;font-weight:400;}
.header-title p{font-size:16px;margin:10px 0 0;opacity:0.9;font-style:italic;}
.content{padding:40px 35px;color:#2c3e50;}
.greeting{font-size:22px;color:#0b3b5c;margin-bottom:25px;font-weight:500;border-left:4px solid #b8860b;padding-left:20px;}
.message{font-size:16px;line-height:1.8;margin-bottom:25px;color:#34495e;}
.prayer-box{background:#f9f9f9;border:1px solid #e0e0e0;border-radius:12px;padding:25px;margin:30px 0;}
.prayer-box h3{color:#0b3b5c;font-size:18px;margin:0 0 15px;font-weight:500;border-bottom:2px solid #b8860b;padding-bottom:10px;}
.prayer-text{font-size:18px;font-style:italic;color:#2c3e50;line-height:1.8;margin:0;}
.aviso-discreto{background:#fff5f5;border-left:4px solid #c53030;padding:15px;margin:25px 0;font-size:14px;color:#742a2a;border-radius:4px;}
.fatima-quote{background:#f0f7ff;padding:25px;border-radius:12px;margin:30px 0;text-align:center;font-style:italic;color:#0b3b5c;border:1px solid #b8860b;}
.signature{margin-top:30px;padding-top:20px;border-top:2px solid #e0e0e0;text-align:center;font-size:16px;color:#0b3b5c;font-style:italic;}
.footer{background:#f8f9fa;padding:25px;text-align:center;color:#7f8c8d;font-size:13px;border-top:1px solid #e0e0e0;}
.footer p{margin:4px 0;}
.footer strong{color:#0b3b5c;}
.date-info{text-align:center;color:#95a5a6;font-size:13px;margin-top:20px;}
</style>
</head>
<body>
<div class="container">
  ${getEmailHeader("\u{1F64F} Pedido de Oracao")}
  <div class="content">
    <div class="greeting">Paz e Bem, <strong>${data.name}</strong>!</div>
    <p class="message">Recebemos com carinho o seu pedido de oracao e agradecemos a confianca em partilhar conosco essa intencao.</p>
    <p class="message">Saiba que sua suplica sera apresentada a Deus em nossas oracoes, confiando tudo a Sua infinita misericordia, em Cristo e sob a intercessao de Nossa Senhora de Fatima.</p>
    ${aviso.ativo ? `<div class="aviso-discreto">${aviso.mensagem}</div>` : ""}
    <div class="prayer-box">
      <h3>Sua intencao</h3>
      <p class="prayer-text">"${data.prayerRequest}"</p>
      ${data.cidade ? `<div style="margin-top:10px;font-size:14px;"><strong>Local:</strong> ${data.cidade}</div>` : ""}
    </div>
    <div class="fatima-quote">"Rezai o terco todos os dias para alcancar a paz para o mundo e o fim da guerra"<div style="margin-top:10px;font-size:14px;">- Nossa Senhora de Fatima</div></div>
    <div class="signature">Em Cristo e Nossa Senhora de Fatima,<br><strong>Santuario Nossa Senhora de Fatima - Santo Amaro</strong></div>
    <div class="date-info">${currentDate}</div>
  </div>
  ${getEmailFooter()}
</div>
</body>
</html>`;
    await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: { "Authorization": `Bearer ${env.RESEND_API_KEY}`, "Content-Type": "application/json" },
      body: JSON.stringify({ from: "Santuario de Fatima <noreply@mail.santuariodefatima.com.br>", to: [data.email], subject: "\u{1F64F} Pedido de Oracao Recebido - Santuario de Fatima", html })
    });
  } catch (error) {
    console.error("Erro ao enviar email de oracao:", error);
  }
}
__name(sendPrayerConfirmationEmail, "sendPrayerConfirmationEmail");
async function sendPrayerNotificationToSecretariat(env, data) {
  try {
    if (!env.RESEND_API_KEY) {
      return;
    }
    const currentDate = (/* @__PURE__ */ new Date()).toLocaleDateString("pt-BR");
    const currentTime = (/* @__PURE__ */ new Date()).toLocaleTimeString("pt-BR");
    const aviso = getHorarioSecretariaAviso();
    const html = `<!DOCTYPE html>
<html>
<head><meta charset="UTF-8"><title>Novo Pedido de Oracao</title>
<style>
body{font-family:'Georgia','Times New Roman',serif;background:#f5f5f5;margin:0;padding:20px;}
.container{max-width:600px;margin:0 auto;background:white;border-radius:16px;overflow:hidden;box-shadow:0 10px 30px rgba(0,0,0,0.1);}
.header{background:#0b3b5c;color:white;padding:0;text-align:center;}
.header-image{width:100%;height:auto;max-height:250px;object-fit:cover;display:block;border-bottom:3px solid #b8860b;}
.header-title{padding:20px;background:#0b3b5c;}
.header-title h1{font-size:24px;margin:0;font-weight:400;}
.header-title p{font-size:15px;margin:8px 0 0;opacity:0.9;font-style:italic;}
.content{padding:30px 25px;}
.prayer-box{background:#f9f9f9;border-left:4px solid #0b3b5c;padding:20px;margin:20px 0;border-radius:4px;}
.info-table{width:100%;border-collapse:collapse;margin:15px 0;}
.info-table td{padding:10px;border-bottom:1px solid #e0e0e0;font-size:15px;}
.info-table td:first-child{font-weight:bold;width:30%;color:#0b3b5c;}
.aviso{background:#fff5f5;border-left:4px solid #c53030;padding:15px;margin:20px 0;font-size:14px;color:#742a2a;border-radius:4px;}
.footer{background:#f8f9fa;padding:20px;text-align:center;font-size:12px;color:#7f8c8d;border-top:1px solid #e0e0e0;}
.footer strong{color:#0b3b5c;}
</style>
</head>
<body>
<div class="container">
  ${getEmailHeader("\u{1F64F} Novo Pedido de Oracao")}
  <div class="content">
    <table class="info-table">
      <tr><td>Nome:</td><td><strong>${data.name}</strong></td></tr>
      <tr><td>Email:</td><td>${data.email}</td></tr>
      ${data.cidade ? `<tr><td>Cidade:</td><td>${data.cidade}</td></tr>` : ""}
      <tr><td>Data/Hora:</td><td>${currentDate} \xE0s ${currentTime}</td></tr>
    </table>
    <div class="prayer-box"><h3>\u271D\uFE0F Intencao:</h3><p style="margin:0;font-style:italic;color:#2c3e50;">"${data.prayerRequest}"</p></div>
    ${aviso.ativo ? `<div class="aviso">\u26A0\uFE0F ${aviso.mensagem}</div>` : ""}
    <p style="color:#c53030;font-weight:500;text-align:center;font-size:15px;">Favor incluir nas intencoes das proximas missas.</p>
  </div>
  ${getEmailFooter()}
</div>
</body>
</html>`;
    for (const adminEmail of CONFIG.PRAYER_EMAILS) {
      await fetch("https://api.resend.com/emails", {
        method: "POST",
        headers: { "Authorization": `Bearer ${env.RESEND_API_KEY}`, "Content-Type": "application/json" },
        body: JSON.stringify({ from: "Santuario de Fatima <noreply@mail.santuariodefatima.com.br>", to: [adminEmail], subject: `\u{1F64F} Novo Pedido de Oracao - ${data.name}`, html, reply_to: data.email })
      });
      console.log(`\u{1F4E7} Notifica\xE7\xE3o de ora\xE7\xE3o enviada para: ${adminEmail}`);
    }
  } catch (error) {
    console.error("Erro ao enviar notificacao:", error);
  }
}
__name(sendPrayerNotificationToSecretariat, "sendPrayerNotificationToSecretariat");
async function sendCandleEmail(env, data) {
  try {
    if (!env.RESEND_API_KEY) return;
    const currentDate = (/* @__PURE__ */ new Date()).toLocaleDateString("pt-BR", { weekday: "long", year: "numeric", month: "long", day: "numeric" });
    const html = `<!DOCTYPE html>
<html>
<head><meta charset="UTF-8"><title>Vela Acesa - Santuario de Fatima</title>
<style>
body{font-family:'Georgia','Times New Roman',serif;background:#f5f5f5;margin:0;padding:20px;}
.container{max-width:600px;margin:0 auto;background:white;border-radius:16px;overflow:hidden;box-shadow:0 10px 30px rgba(0,0,0,0.1);}
.header{background:#ff8a5c;color:white;padding:0;text-align:center;}
.header-image{width:100%;height:auto;max-height:250px;object-fit:cover;display:block;border-bottom:3px solid #b8860b;}
.header-title{padding:20px;background:#ff8a5c;}
.header-title h1{font-size:28px;margin:0;font-weight:400;}
.header-title p{font-size:16px;margin:10px 0 0;opacity:0.9;font-style:italic;}
.content{padding:40px 35px;color:#2c3e50;}
.greeting{font-size:22px;color:#ff8a5c;margin-bottom:25px;font-weight:500;border-left:4px solid #b8860b;padding-left:20px;}
.message{font-size:16px;line-height:1.8;margin-bottom:25px;color:#34495e;}
.candle-box{background:#f9f9f9;border:1px solid #e0e0e0;border-radius:12px;padding:25px;margin:30px 0;text-align:center;}
.candle-box h3{color:#ff8a5c;font-size:18px;margin:0 0 15px;font-weight:500;border-bottom:2px solid #b8860b;padding-bottom:10px;}
.fatima-quote{background:#f0f7ff;padding:25px;border-radius:12px;margin:30px 0;text-align:center;font-style:italic;color:#0b3b5c;border:1px solid #b8860b;}
.signature{margin-top:30px;padding-top:20px;border-top:2px solid #e0e0e0;text-align:center;font-size:16px;color:#ff8a5c;font-style:italic;}
.footer{background:#f8f9fa;padding:25px;text-align:center;color:#7f8c8d;font-size:13px;border-top:1px solid #e0e0e0;}
.footer p{margin:4px 0;}
.footer strong{color:#ff8a5c;}
.date-info{text-align:center;color:#95a5a6;font-size:13px;margin-top:20px;}
</style>
</head>
<body>
<div class="container">
  ${getEmailHeader("Vela Acesa")}
  <div class="content">
    <div class="greeting">\u{1F56F}\uFE0F <strong>Paz e Bem, ${data.name}!</strong></div>
    <p class="message">Sua vela foi acesa no Santuario de Fatima e permanecera por 7 dias.</p>
    <div class="candle-box">
      <h3>\u{1F56F}\uFE0F SUA INTENCAO</h3>
      <p class="message" style="font-style:italic;margin:10px 0;">"${data.intention}"</p>
      ${data.cidade ? `<p style="color:#666;margin-top:10px;"><strong>Local:</strong> ${data.cidade}</p>` : ""}
    </div>
    <div class="fatima-quote">"Rezai o terco todos os dias para alcancar a paz para o mundo e o fim da guerra"<div style="margin-top:10px;font-size:14px;">\u2014 Nossa Senhora de Fatima</div></div>
    <div class="signature">Que sua intencao seja atendida,<br><strong>Santuario Nossa Senhora de Fatima - Santo Amaro</strong></div>
    <div class="date-info">\u{1F4C5} ${currentDate}</div>
  </div>
  ${getEmailFooter()}
</div>
</body>
</html>`;
    await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: { "Authorization": `Bearer ${env.RESEND_API_KEY}`, "Content-Type": "application/json" },
      body: JSON.stringify({ from: "Santuario de Fatima <noreply@mail.santuariodefatima.com.br>", to: [data.email], subject: "\u{1F56F}\uFE0F Sua Vela foi Acesa - Santuario de Fatima", html })
    });
  } catch (error) {
    console.error("Erro ao enviar email de vela:", error);
  }
}
__name(sendCandleEmail, "sendCandleEmail");
async function sendContactConfirmationEmail(env, data) {
  try {
    if (!env.RESEND_API_KEY) return;
    const currentDate = (/* @__PURE__ */ new Date()).toLocaleDateString("pt-BR", { weekday: "long", year: "numeric", month: "long", day: "numeric" });
    const assuntoMap = { informacoes: "Informacoes Gerais", sacramentos: "Sacramentos", pastorais: "Pastorais", eventos: "Eventos", doacoes: "Doacoes", certidoes: "Certidoes", outro: "Outro" };
    const assuntoLabel = assuntoMap[data.assunto] || data.assunto || "Nao informado";
    const aviso = getHorarioSecretariaAviso();
    const html = `<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <title>Mensagem Recebida - Santuario de Fatima</title>
  <style>
    body { font-family: 'Georgia', 'Times New Roman', serif; background: #f5f5f5; margin: 0; padding: 20px; }
    .container { max-width: 600px; margin: 0 auto; background: white; border-radius: 16px; overflow: hidden; box-shadow: 0 10px 30px rgba(0,0,0,0.1); }
    .header { background: #0b3b5c; color: white; padding: 0; text-align: center; }
    .header-image { width: 100%; height: auto; max-height: 260px; object-fit: cover; display: block; border-bottom: 3px solid #b8860b; }
    .header-title { padding: 20px; background: #0b3b5c; }
    .header-title h1 { font-size: 26px; margin: 0; font-weight: 400; }
    .header-title p { font-size: 15px; margin: 8px 0 0; opacity: 0.9; font-style: italic; }
    .content { padding: 40px 35px; color: #2c3e50; }
    .greeting { font-size: 21px; color: #0b3b5c; margin-bottom: 22px; font-weight: 500; border-left: 4px solid #b8860b; padding-left: 20px; }
    .message { font-size: 16px; line-height: 1.8; margin-bottom: 20px; color: #34495e; }
    .info-box { background: #f9f9f9; border: 1px solid #e0e0e0; border-radius: 12px; padding: 22px; margin: 28px 0; }
    .info-box h3 { color: #0b3b5c; font-size: 17px; margin: 0 0 14px; font-weight: 500; border-bottom: 2px solid #b8860b; padding-bottom: 8px; }
    .info-row { margin-bottom: 10px; font-size: 15px; color: #2c3e50; }
    .info-row strong { color: #0b3b5c; }
    .mensagem-box { background: #f0f7ff; border-left: 4px solid #0b3b5c; padding: 16px 20px; border-radius: 6px; margin-top: 14px; font-size: 15px; color: #2c3e50; font-style: italic; line-height: 1.7; }
    .aviso-discreto { background: #fff5f5; border-left: 4px solid #c53030; padding: 14px; margin: 22px 0; font-size: 13px; color: #742a2a; border-radius: 4px; }
    .fatima-quote { background: #f0f7ff; padding: 22px; border-radius: 12px; margin: 28px 0; text-align: center; font-style: italic; color: #0b3b5c; border: 1px solid #b8860b; font-size: 16px; line-height: 1.7; }
    .signature { margin-top: 28px; padding-top: 18px; border-top: 2px solid #e0e0e0; text-align: center; font-size: 15px; color: #0b3b5c; font-style: italic; }
    .footer { background: #f8f9fa; padding: 22px; text-align: center; color: #7f8c8d; font-size: 13px; border-top: 1px solid #e0e0e0; }
    .footer p { margin: 4px 0; }
    .footer strong { color: #0b3b5c; }
    .date-info { text-align: center; color: #95a5a6; font-size: 13px; margin-top: 18px; }
  </style>
</head>
<body>
  <div class="container">
    ${getEmailHeader("Mensagem Recebida")}
    <div class="content">
      <div class="greeting">Paz e Bem, <strong>${data.nome}</strong>!</div>
      <p class="message">Recebemos sua mensagem com carinho e agradecemos por entrar em contato conosco. Em breve um de nossos agentes pastorais retornara o contato.</p>
      <div class="info-box">
        <h3>\u{1F4E8} Sua Mensagem</h3>
        <div class="info-row"><strong>Assunto:</strong> ${assuntoLabel}</div>
        ${data.telefone ? `<div class="info-row"><strong>Telefone:</strong> ${data.telefone}</div>` : ""}
        <div class="mensagem-box">"${data.mensagem}"</div>
      </div>
      ${aviso.ativo ? `<div class="aviso-discreto">\u26A0\uFE0F ${aviso.mensagem}</div>` : ""}
      <div class="fatima-quote">"Rezai o terco todos os dias para alcancar a paz para o mundo e o fim da guerra"<div style="margin-top: 10px; font-size: 13px; color: #5a7fa0;">\u2014 Nossa Senhora de Fatima</div></div>
      <div class="signature">Em Cristo e Nossa Senhora de Fatima,<br><strong>Secretaria Pastoral \u2013 Santuario Nossa Senhora de Fatima</strong></div>
      <div class="date-info">\u{1F4C5} ${currentDate}</div>
    </div>
    ${getEmailFooter()}
  </div>
</body>
</html>`;
    await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: { "Authorization": `Bearer ${env.RESEND_API_KEY}`, "Content-Type": "application/json" },
      body: JSON.stringify({ from: "Santuario de Fatima <noreply@mail.santuariodefatima.com.br>", to: [data.email], subject: "\u2709\uFE0F Mensagem Recebida \u2013 Santuario de Fatima", html })
    });
  } catch (error) {
    console.error("Erro ao enviar email de contato:", error);
  }
}
__name(sendContactConfirmationEmail, "sendContactConfirmationEmail");
async function sendContactNotificationToSecretariat(env, data) {
  try {
    if (!env.RESEND_API_KEY) {
      return;
    }
    const currentDate = (/* @__PURE__ */ new Date()).toLocaleDateString("pt-BR");
    const currentTime = (/* @__PURE__ */ new Date()).toLocaleTimeString("pt-BR");
    const aviso = getHorarioSecretariaAviso();
    const html = `<!DOCTYPE html>
<html>
<head><meta charset="UTF-8"><title>Novo Contato - Secretaria</title>
<style>
body{font-family:'Georgia','Times New Roman',serif;background:#f5f5f5;margin:0;padding:20px;}
.container{max-width:600px;margin:0 auto;background:white;border-radius:16px;overflow:hidden;box-shadow:0 10px 30px rgba(0,0,0,0.1);}
.header{background:#0b3b5c;color:white;padding:0;text-align:center;}
.header-image{width:100%;height:auto;max-height:250px;object-fit:cover;display:block;border-bottom:3px solid #b8860b;}
.header-title{padding:20px;background:#0b3b5c;}
.header-title h1{font-size:24px;margin:0;font-weight:400;}
.header-title p{font-size:15px;margin:8px 0 0;opacity:0.9;font-style:italic;}
.content{padding:30px 25px;}
.message-box{background:#f9f9f9;border-left:4px solid #0b3b5c;padding:20px;margin:20px 0;border-radius:4px;}
.aviso{background:#fff5f5;border-left:4px solid #c53030;padding:15px;margin:20px 0;font-size:14px;color:#742a2a;border-radius:4px;}
.footer{background:#f8f9fa;padding:20px;text-align:center;font-size:12px;color:#7f8c8d;border-top:1px solid #e0e0e0;}
.footer strong{color:#0b3b5c;}
p{font-size:15px;margin:8px 0;color:#2c3e50;}
</style>
</head>
<body>
<div class="container">
  ${getEmailHeader("\u2709\uFE0F Novo Contato")}
  <div class="content">
    <p><strong>Nome:</strong> ${data.nome}</p>
    <p><strong>Email:</strong> ${data.email}</p>
    <p><strong>Telefone:</strong> ${data.telefone || "Nao informado"}</p>
    <p><strong>Assunto:</strong> ${data.assunto}</p>
    <p><strong>Data/Hora:</strong> ${currentDate} as ${currentTime}</p>
    <div class="message-box"><h3 style="margin:0 0 10px;color:#0b3b5c;">Mensagem:</h3><p style="margin:0;white-space:pre-wrap;font-style:italic;">${data.mensagem}</p></div>
    ${aviso.ativo ? `<div class="aviso">\u26A0\uFE0F ${aviso.mensagem}</div>` : ""}
  </div>
  ${getEmailFooter()}
</div>
</body>
</html>`;
    for (const adminEmail of CONFIG.CONTACT_EMAILS) {
      await fetch("https://api.resend.com/emails", {
        method: "POST",
        headers: { "Authorization": `Bearer ${env.RESEND_API_KEY}`, "Content-Type": "application/json" },
        body: JSON.stringify({ from: "Santuario de Fatima <noreply@mail.santuariodefatima.com.br>", to: [adminEmail], subject: `\u{1F4EC} Novo Contato: ${data.assunto} - ${data.nome}`, html, reply_to: data.email })
      });
      console.log(`\u{1F4E7} Notifica\xE7\xE3o de contato enviada para: ${adminEmail}`);
    }
  } catch (error) {
    console.error("Erro ao enviar notificacao de contato:", error);
  }
}
__name(sendContactNotificationToSecretariat, "sendContactNotificationToSecretariat");

// src/routes/public/liturgia.js
var _cache = /* @__PURE__ */ new Map();
var CACHE_DURATION = 60 * 60 * 1e3;
function getCache(key) {
  const entry = _cache.get(key);
  if (!entry) return null;
  if (Date.now() - entry.time > CACHE_DURATION) {
    _cache.delete(key);
    return null;
  }
  return entry.data;
}
__name(getCache, "getCache");
function setCache(key, data) {
  _cache.set(key, { data, time: Date.now() });
}
__name(setCache, "setCache");
function normalizarData(dataParam) {
  if (!dataParam) return (/* @__PURE__ */ new Date()).toISOString().split("T")[0];
  if (/^\d{4}-\d{2}-\d{2}$/.test(dataParam)) return dataParam;
  if (/^\d{2}\/\d{2}\/\d{4}$/.test(dataParam)) {
    const [d, m, y] = dataParam.split("/");
    return `${y}-${m}-${d}`;
  }
  return (/* @__PURE__ */ new Date()).toISOString().split("T")[0];
}
__name(normalizarData, "normalizarData");
function formatarParaRailway(dataISO) {
  const [y, m, d] = dataISO.split("-");
  return `${d}/${m}/${y}`;
}
__name(formatarParaRailway, "formatarParaRailway");
function stripHtml(s = "") {
  return s.replace(/<br\s*\/?>/gi, "\n").replace(/<\/p>/gi, "\n").replace(/<[^>]+>/g, "").replace(/&nbsp;/g, " ").replace(/&amp;/g, "&").replace(/&lt;/g, "<").replace(/&gt;/g, ">").replace(/&quot;/g, '"').replace(/&#8220;|&#8221;/g, '"').replace(/&#8216;|&#8217;/g, "'").replace(/&#8211;/g, "\u2013").replace(/&#8212;/g, "\u2014").replace(/\r\n/g, "\n").replace(/\n{3,}/g, "\n\n").trim();
}
__name(stripHtml, "stripHtml");
function extrairCorDoTexto(texto = "") {
  if (!texto) return null;
  const t = texto.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
  if (t.includes("branco") || t.includes("dourado") || t.includes("bco")) return "Branco";
  if (t.includes("roxo") || t.includes("violeta") || t.includes("lilas")) return "Roxo";
  if (t.includes("vermelho") || t.includes("rubro")) return "Vermelho";
  if (t.includes("rosa")) return "Rosa";
  if (t.includes("verde")) return "Verde";
  return null;
}
__name(extrairCorDoTexto, "extrairCorDoTexto");
function inferirCorPorPeriodo(texto = "") {
  const t = texto.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
  if (/pasc|oitava|natal|epifania|ressurreic|corpus|ascensao|batismo|transfig|todos os santos/.test(t)) return "Branco";
  if (/quaresma|advento/.test(t)) return "Roxo";
  if (/pentecostes|martir|apostol|sao pedro|sao paulo|sao joao/.test(t)) return "Vermelho";
  if (/rosa/.test(t)) return "Rosa";
  return null;
}
__name(inferirCorPorPeriodo, "inferirCorPorPeriodo");
function normalizarCampoLeitura(campo) {
  if (!campo) return "";
  if (typeof campo === "string") {
    if (campo === "N\xE3o h\xE1 segunda leitura hoje!" || campo === "null") return "";
    return campo.trim();
  }
  if (typeof campo === "object") {
    const partes = [];
    if (campo.referencia) partes.push(campo.referencia.trim());
    if (campo.titulo) partes.push(campo.titulo.trim());
    if (campo.texto) partes.push(campo.texto.trim());
    return partes.join("\n\n");
  }
  return "";
}
__name(normalizarCampoLeitura, "normalizarCampoLeitura");
function normalizarSalmo(campo) {
  if (!campo) return "";
  if (typeof campo === "string") return campo.trim();
  if (typeof campo === "object") {
    const partes = [];
    if (campo.referencia) partes.push(campo.referencia.trim());
    if (campo.refrao) partes.push(campo.refrao.trim());
    if (campo.texto) partes.push(campo.texto.trim());
    return partes.join("\n\n");
  }
  return "";
}
__name(normalizarSalmo, "normalizarSalmo");
function parsearHtmlPaulus(html) {
  const blocoMatch = html.match(/(<strong>.*?OITAVA|<strong>[A-ZÁÉÍÓÚ\s]+<\/strong>[\s\S]*?)(?:Liturgia Diária\s*<\/h|<div[^>]+class="[^"]*sidebar)/i);
  const bloco = blocoMatch ? blocoMatch[0] : html;
  const tituloMatch = bloco.match(/<strong>([A-ZÁÉÍÓÚÀÃÕÂÊÎÔÛÇ\s\d°ºª–\-]+)<\/strong>/i);
  const tituloLiturgico = tituloMatch ? stripHtml(tituloMatch[1]).trim() : "";
  const corMatch = html.match(/\((branco|roxo|vermelho|rosa|verde|dourado|violeta|lilas)/i);
  let cor = corMatch ? extrairCorDoTexto(corMatch[1]) : null;
  if (!cor) cor = inferirCorPorPeriodo(tituloLiturgico + " " + html.substring(0, 2e3));
  cor = cor || "Verde";
  const notaMatch = html.match(/\(([^)]{10,200})\)/);
  const nota = notaMatch ? notaMatch[1].trim() : "";
  let antifona = "";
  const antifonaMatch = html.match(/\([^)]+\)\s*<\/p>\s*<p[^>]*>([\s\S]*?)<\/p>/i);
  if (antifonaMatch) antifona = stripHtml(antifonaMatch[1]).trim();
  let introducao = "";
  const introMatch = html.match(/<(?:em|i)[^>]*>([\s\S]{20,600}?)<\/(?:em|i)>/i);
  if (introMatch) introducao = stripHtml(introMatch[1]).trim();
  const primeiraRef = extrairRef(html, "Primeira Leitura");
  const primeiraTexto = extrairBlocoLeitura(html, "Primeira Leitura", ["Salmo Responsorial", "Segunda Leitura", "Evangelho"]);
  const segundaRef = extrairRef(html, "Segunda Leitura");
  const segundaTexto = extrairBlocoLeitura(html, "Segunda Leitura", ["Salmo Responsorial", "Evangelho"]);
  const salmoRef = extrairRef(html, "Salmo Responsorial");
  const salmoTexto = extrairBlocoLeitura(html, "Salmo Responsorial", ["Segunda Leitura", "Evangelho"]);
  const evangelhoRef = extrairRef(html, "Evangelho");
  const evangelhoTexto = extrairBlocoLeitura(html, "Evangelho", ["Reflex\xE3o", "Reflexao"]);
  const reflexaoTexto = extrairBlocoLeitura(html, "Reflex", ["Dia a dia", "navigation", "post-navigation", "[9 \u2013", "[10 \u2013", "[11 \u2013"]);
  return {
    cor,
    tituloLiturgico,
    nota,
    antifona,
    introducao,
    primeiraLeitura: montarLeitura(primeiraRef, primeiraTexto),
    segundaLeitura: montarLeitura(segundaRef, segundaTexto),
    salmo: montarLeitura(salmoRef, salmoTexto),
    evangelho: montarLeitura(evangelhoRef, evangelhoTexto),
    reflexao: reflexaoTexto
  };
}
__name(parsearHtmlPaulus, "parsearHtmlPaulus");
function extrairRef(html, secao) {
  const re = new RegExp(secao + "[:\\s]*<strong>([^<]+)<\\/strong>", "i");
  const m = html.match(re);
  return m ? stripHtml(m[1]).trim() : "";
}
__name(extrairRef, "extrairRef");
function extrairBlocoLeitura(html, inicio, fins) {
  const reInicio = new RegExp(inicio + "[^<]*(?:<[^>]+>)*[^<]*<\\/(?:strong|p|h[1-6])>", "i");
  const mInicio = html.match(reInicio);
  if (!mInicio || mInicio.index === void 0) return "";
  let sub = html.substring(mInicio.index + mInicio[0].length);
  let fimIdx = sub.length;
  for (const fim of fins) {
    const reFim = new RegExp(fim, "i");
    const mFim = sub.match(reFim);
    if (mFim && mFim.index !== void 0 && mFim.index < fimIdx) {
      fimIdx = mFim.index;
    }
  }
  const bloco = sub.substring(0, fimIdx);
  return stripHtml(bloco).replace(/^\s*\n/, "").trim();
}
__name(extrairBlocoLeitura, "extrairBlocoLeitura");
function montarLeitura(ref, texto) {
  if (!texto && !ref) return "";
  if (!texto) return ref;
  if (ref && !texto.includes(ref)) return `${ref}

${texto}`;
  return texto;
}
__name(montarLeitura, "montarLeitura");
async function buscarNaPaulus(dataISO) {
  try {
    console.log("\u{1F33F} Buscando na Paulus para data:", dataISO);
    const paulusUrl = "https://www.paulus.com.br/portal/liturgia-diaria/";
    const res = await fetch(paulusUrl, {
      headers: {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
        "Accept": "text/html,application/xhtml+xml",
        "Accept-Language": "pt-BR,pt;q=0.9"
      },
      signal: AbortSignal.timeout(8e3)
    });
    if (!res.ok) {
      console.warn("\u{1F33F} Paulus retornou status:", res.status);
      return null;
    }
    const html = await res.text();
    console.log("\u{1F33F} HTML da Paulus recebido, tamanho:", html.length);
    const dados = parsearHtmlPaulus(html);
    console.log("\u{1F33F} Dados extra\xEDdos da Paulus:", {
      cor: dados.cor,
      tituloLiturgico: dados.tituloLiturgico,
      temPrimeira: !!dados.primeiraLeitura,
      temSalmo: !!dados.salmo,
      temEvangelho: !!dados.evangelho
    });
    return dados;
  } catch (err) {
    console.error("\u{1F33F} Erro ao buscar na Paulus:", err.message);
    return null;
  }
}
__name(buscarNaPaulus, "buscarNaPaulus");
async function buscarNoRailway(dataISO) {
  try {
    const dataRailway = formatarParaRailway(dataISO);
    const url = `https://liturgia.up.railway.app/?data=${dataRailway}`;
    console.log("\u{1F682} Buscando no Railway:", url);
    const response = await fetch(url, {
      headers: { "User-Agent": "Mozilla/5.0", "Accept": "application/json" },
      signal: AbortSignal.timeout(8e3)
    });
    if (!response.ok) {
      console.warn("\u{1F682} Railway status:", response.status);
      return null;
    }
    const json = await response.json();
    console.log("\u{1F682} Railway respondeu:", JSON.stringify(json).substring(0, 300));
    return json;
  } catch (err) {
    console.error("\u{1F682} Erro Railway:", err.message);
    return null;
  }
}
__name(buscarNoRailway, "buscarNoRailway");
function montarResultadoRailway(dataISO, json) {
  let cor = json.cor && typeof json.cor === "string" && json.cor.trim() || extrairCorDoTexto(json.liturgia) || inferirCorPorPeriodo([json.liturgia, json.semana, json.dia].filter(Boolean).join(" ")) || "Verde";
  const antifona = json.antifonas?.entrada || json.antifona || "";
  const segundaLeituraRaw = normalizarCampoLeitura(json.segundaLeitura);
  const temSegunda = segundaLeituraRaw.length > 10;
  return {
    success: true,
    data: dataISO,
    liturgia: {
      titulo: json.liturgia || `Liturgia do Dia - ${dataISO}`,
      cor,
      semana: json.semana || json.liturgia || "",
      tituloLiturgico: json.liturgia || "",
      antifona,
      introducao: json.introducao || "",
      primeiraLeitura: normalizarCampoLeitura(json.primeiraLeitura),
      segundaLeitura: temSegunda ? segundaLeituraRaw : "",
      salmo: normalizarSalmo(json.salmo),
      evangelho: normalizarCampoLeitura(json.evangelho),
      reflexao: json.reflexao || json.meditacao || ""
    },
    fonte: "railway"
  };
}
__name(montarResultadoRailway, "montarResultadoRailway");
function montarResultadoPaulus(dataISO, dados) {
  return {
    success: true,
    data: dataISO,
    liturgia: {
      titulo: dados.tituloLiturgico || `Liturgia do Dia - ${dataISO}`,
      cor: dados.cor,
      semana: dados.tituloLiturgico || "",
      tituloLiturgico: dados.tituloLiturgico || "",
      antifona: dados.antifona || "",
      introducao: dados.introducao || "",
      primeiraLeitura: dados.primeiraLeitura || "",
      segundaLeitura: dados.segundaLeitura || "",
      salmo: dados.salmo || "",
      evangelho: dados.evangelho || "",
      reflexao: dados.reflexao || ""
    },
    fonte: "paulus"
  };
}
__name(montarResultadoPaulus, "montarResultadoPaulus");
async function buscarLiturgia(dataParam = null) {
  const dataISO = normalizarData(dataParam);
  console.log("\u{1F4C5} buscarLiturgia:", dataISO);
  const cached = getCache(dataISO);
  if (cached) {
    console.log("\u2705 Cache hit:", dataISO);
    return cached;
  }
  let result = null;
  console.log("\u{1F682} Tentando Railway primeiro...");
  const jsonRailway = await buscarNoRailway(dataISO);
  if (jsonRailway && (jsonRailway.evangelho || jsonRailway.primeiraLeitura)) {
    result = montarResultadoRailway(dataISO, jsonRailway);
    console.log("\u2705 Resultado montado do Railway, cor:", result.liturgia.cor);
    if (result.liturgia.cor === "Verde") {
      console.log("\u{1F3A8} Cor incerta \u2014 tentando complementar com Paulus...");
      const dadosPaulus = await buscarNaPaulus(dataISO);
      if (dadosPaulus?.cor && dadosPaulus.cor !== "Verde") {
        result.liturgia.cor = dadosPaulus.cor;
        console.log("\u{1F3A8} Cor complementada pela Paulus:", dadosPaulus.cor);
      }
    }
  }
  if (!result) {
    console.log("\u{1F33F} Railway falhou \u2014 tentando Paulus como fallback...");
    const dadosPaulus = await buscarNaPaulus(dataISO);
    if (dadosPaulus?.evangelho) {
      result = montarResultadoPaulus(dataISO, dadosPaulus);
      console.log("\u2705 Resultado montado da Paulus");
    }
  }
  if (!result) {
    console.warn("\u26A0\uFE0F Todas as fontes falharam \u2014 usando mock");
    result = getMockLiturgia(dataISO);
  }
  setCache(dataISO, result);
  return result;
}
__name(buscarLiturgia, "buscarLiturgia");
function getMockLiturgia(dataISO) {
  const hoje = /* @__PURE__ */ new Date(dataISO + "T12:00:00");
  const diaSemana = hoje.toLocaleDateString("pt-BR", { weekday: "long" });
  const dataFormatada = hoje.toLocaleDateString("pt-BR");
  return {
    success: true,
    data: dataISO,
    liturgia: {
      titulo: `Liturgia do ${diaSemana} - ${dataFormatada}`,
      cor: "Verde",
      semana: "Tempo Comum",
      tituloLiturgico: "",
      antifona: "",
      introducao: "",
      primeiraLeitura: "Leitura n\xE3o dispon\xEDvel no momento.",
      segundaLeitura: "",
      salmo: "Salmo n\xE3o dispon\xEDvel.",
      evangelho: "Evangelho n\xE3o dispon\xEDvel.",
      reflexao: ""
    },
    fonte: "mock"
  };
}
__name(getMockLiturgia, "getMockLiturgia");

// src/utils/responses.js
function jsonResponse2(data, status = 200, additionalHeaders = {}) {
  return new Response(JSON.stringify(data, null, 2), {
    status,
    headers: {
      "Content-Type": "application/json; charset=utf-8",
      ...corsHeaders2,
      ...additionalHeaders
    }
  });
}
__name(jsonResponse2, "jsonResponse");
function errorResponse2(message, status = 400) {
  return jsonResponse2({ success: false, error: message }, status);
}
__name(errorResponse2, "errorResponse");

// src/routes/public/terco.js
function getMisterioTerco() {
  try {
    const day = (/* @__PURE__ */ new Date()).getDay();
    const mapa = {
      0: { tipo: "gloriosos", titulo: "Mist\xE9rios Gloriosos", descricao: "A Ressurrei\xE7\xE3o de Jesus", cor: "branco" },
      1: { tipo: "gozosos", titulo: "Mist\xE9rios Gozosos", descricao: "A Anuncia\xE7\xE3o do Anjo", cor: "azul" },
      2: { tipo: "dolorosos", titulo: "Mist\xE9rios Dolorosos", descricao: "A Agonia de Jesus", cor: "roxo" },
      3: { tipo: "gloriosos", titulo: "Mist\xE9rios Gloriosos", descricao: "A Ascens\xE3o de Jesus", cor: "branco" },
      4: { tipo: "luminosos", titulo: "Mist\xE9rios Luminosos", descricao: "O Batismo de Jesus", cor: "branco" },
      5: { tipo: "dolorosos", titulo: "Mist\xE9rios Dolorosos", descricao: "A Crucifica\xE7\xE3o", cor: "roxo" },
      6: { tipo: "gozosos", titulo: "Mist\xE9rios Gozosos", descricao: "A Visita\xE7\xE3o", cor: "azul" }
    };
    const misterio = mapa[day] || mapa[2];
    const audioUrls = {
      gloriosos: "https://pub-89ce38aa8fb446c3b6b8d93e2d6fa452.r2.dev/terco-gloriosos.mp3",
      gozosos: "https://pub-89ce38aa8fb446c3b6b8d93e2d6fa452.r2.dev/terco-gozosos.mp3",
      dolorosos: "https://pub-89ce38aa8fb446c3b6b8d93e2d6fa452.r2.dev/terco-dolorosos.mp3",
      luminosos: "https://pub-89ce38aa8fb446c3b6b8d93e2d6fa452.r2.dev/terco-luminosos.mp3"
    };
    const diasSemana = ["Domingo", "Segunda-feira", "Ter\xE7a-feira", "Quarta-feira", "Quinta-feira", "Sexta-feira", "S\xE1bado"];
    const horarios = [
      { hora: 7, nome: "Manh\xE3", descricao: "Ter\xE7o da Aurora" },
      { hora: 15, nome: "Miseric\xF3rdia", descricao: "Hora da Miseric\xF3rdia" },
      { hora: 21, nome: "Noite", descricao: "Ter\xE7o do Descanso" },
      { hora: 3, nome: "Madrugada", descricao: "Ter\xE7o da Vig\xEDlia" }
    ];
    const horaAtual = (/* @__PURE__ */ new Date()).getHours();
    const proximoHorario = horarios.find((h) => h.hora > horaAtual) || horarios[0];
    return {
      success: true,
      dia: day,
      diaSemana: diasSemana[day],
      misterio: misterio.tipo,
      titulo: misterio.titulo,
      descricao: misterio.descricao,
      corLiturgica: misterio.cor,
      audioUrl: audioUrls[misterio.tipo],
      estrutura: { paiNosso: 6, aveMaria: 50, gloria: 5, totalContas: 56, tempoMedio: "25 minutos" },
      horarios,
      proximoHorario,
      dataReferencia: (/* @__PURE__ */ new Date()).toISOString().split("T")[0],
      timestamp: (/* @__PURE__ */ new Date()).toISOString()
    };
  } catch {
    return {
      success: true,
      dia: 2,
      diaSemana: "Ter\xE7a-feira",
      misterio: "dolorosos",
      titulo: "Mist\xE9rios Dolorosos",
      descricao: "A Agonia de Jesus",
      corLiturgica: "roxo",
      audioUrl: "https://pub-89ce38aa8fb446c3b6b8d93e2d6fa452.r2.dev/terco-dolorosos.mp3",
      estrutura: { paiNosso: 6, aveMaria: 50, gloria: 5, totalContas: 56, tempoMedio: "25 minutos" },
      horarios: [],
      proximoHorario: { hora: 15, nome: "Miseric\xF3rdia", descricao: "Hora da Miseric\xF3rdia" },
      dataReferencia: (/* @__PURE__ */ new Date()).toISOString().split("T")[0],
      timestamp: (/* @__PURE__ */ new Date()).toISOString()
    };
  }
}
__name(getMisterioTerco, "getMisterioTerco");
async function handleTerco(request, env) {
  return jsonResponse2(getMisterioTerco());
}
__name(handleTerco, "handleTerco");

// src/config/constants.js
var CONFIG2 = {
  YOUTUBE_CHANNEL_ID: "UCwTM4qaQO3fsRpKAAZUZ8Ng",
  VIDEO_PRIORITARIO: "k6sbFio_qDI",
  SECRETARIAT_EMAILS: ["santuariodefatima@santuariodefatima.com.br", "pascom.santuario@outlook.com.br"],
  MAX_USERS: 5,
  FALLBACK_VIDEOS: [
    { id: "k6sbFio_qDI", title: "Santa Missa - Santuario de Fatima", thumbnail: "https://img.youtube.com/vi/k6sbFio_qDI/maxresdefault.jpg", videoUrl: "https://www.youtube.com/watch?v=k6sbFio_qDI", isLiveNow: false },
    { id: "W3kFS0PQEc8", title: "Santa Missa - 1 Domingo da Quaresma - 22 de Fevereiro de 2026", thumbnail: "https://img.youtube.com/vi/W3kFS0PQEc8/maxresdefault.jpg", videoUrl: "https://www.youtube.com/watch?v=W3kFS0PQEc8", isLiveNow: false },
    { id: "MkxD4-pTviM", title: "Santa Missa - Quarta-feira de Cinzas - 18 de Fevereiro de 2026", thumbnail: "https://img.youtube.com/vi/MkxD4-pTviM/maxresdefault.jpg", videoUrl: "https://www.youtube.com/watch?v=MkxD4-pTviM", isLiveNow: false },
    { id: "uxpvBXYXm6s", title: "Santa Missa - Santuario de Fatima", thumbnail: "https://img.youtube.com/vi/uxpvBXYXm6s/maxresdefault.jpg", videoUrl: "https://www.youtube.com/watch?v=uxpvBXYXm6s", isLiveNow: false },
    { id: "LoRx8F-wRf0", title: "Santa Missa - Santuario de Fatima", thumbnail: "https://img.youtube.com/vi/LoRx8F-wRf0/maxresdefault.jpg", videoUrl: "https://www.youtube.com/watch?v=LoRx8F-wRf0", isLiveNow: false },
    { id: "DQLtlDp9r5c", title: "Santa Missa - Domingo da Quaresma", thumbnail: "https://img.youtube.com/vi/DQLtlDp9r5c/maxresdefault.jpg", videoUrl: "https://www.youtube.com/watch?v=DQLtlDp9r5c", isLiveNow: false },
    { id: "L6fHBk0YC5Q", title: "Santa Missa - Santuario de Fatima", thumbnail: "https://img.youtube.com/vi/L6fHBk0YC5Q/maxresdefault.jpg", videoUrl: "https://www.youtube.com/watch?v=L6fHBk0YC5Q", isLiveNow: false }
  ]
};

// src/routes/public/youtube.js
async function getYouTubeMainVideo(env) {
  try {
    const API_KEY = env.YOUTUBE_CHANNEL_API_KEY;
    const CHANNEL_ID = "UCwTM4qaQO3fsRpKAAZUZ8Ng";
    const liveManual = await env.KV_YOUTUBE_STORAGE?.get("live_manual", "json");
    if (liveManual && liveManual.ativo === true) {
      console.log("\u{1F4FA} Usando live manual:", liveManual.videoId);
      let recordedVideos2 = [];
      if (API_KEY) {
        try {
          const videosUrl = `https://www.googleapis.com/youtube/v3/search?key=${API_KEY}&channelId=${CHANNEL_ID}&part=snippet&order=date&maxResults=10&type=video`;
          const videosRes = await fetch(videosUrl);
          if (videosRes.ok) {
            const videosData = await videosRes.json();
            if (videosData.items) {
              recordedVideos2 = videosData.items.map((item) => ({
                id: cleanVideoId(item.id.videoId),
                title: cleanYouTubeTitle(item.snippet.title),
                thumbnail: item.snippet.thumbnails.high?.url || `https://img.youtube.com/vi/${item.id.videoId}/mqdefault.jpg`,
                publishedAt: item.snippet.publishedAt,
                channelTitle: item.snippet.channelTitle,
                videoUrl: `https://www.youtube.com/watch?v=${item.id.videoId}`,
                link: `https://www.youtube.com/watch?v=${item.id.videoId}`,
                isLiveNow: false
              }));
            }
          }
        } catch (e) {
          console.error("Erro ao buscar v\xEDdeos gravados:", e);
        }
      }
      const mainVideo2 = {
        id: liveManual.videoId,
        title: liveManual.title || "Transmiss\xE3o ao Vivo \u2014 Santu\xE1rio de F\xE1tima",
        thumbnail: liveManual.thumbnail || `https://img.youtube.com/vi/${liveManual.videoId}/maxresdefault.jpg`,
        publishedAt: liveManual.atualizadoEm || (/* @__PURE__ */ new Date()).toISOString(),
        channelTitle: "Santu\xE1rio de F\xE1tima",
        videoUrl: liveManual.link,
        link: liveManual.link,
        isLiveNow: true
      };
      const cardVideos2 = recordedVideos2.filter((v) => v.id !== liveManual.videoId).slice(0, 5);
      return {
        mainVideo: mainVideo2,
        allVideos: [mainVideo2, ...recordedVideos2],
        cardVideos: cardVideos2,
        liveStatus: "live"
      };
    }
    if (!API_KEY) {
      console.log("\u26A0\uFE0F Sem API_KEY, usando fallback");
      const cleanFallback = CONFIG2.FALLBACK_VIDEOS.map((v) => ({
        ...v,
        id: cleanVideoId(v.id),
        isLiveNow: false
      }));
      return {
        mainVideo: cleanFallback[0],
        allVideos: cleanFallback,
        cardVideos: cleanFallback.slice(1),
        liveStatus: "none"
      };
    }
    const searchUrl = `https://www.googleapis.com/youtube/v3/search?key=${API_KEY}&channelId=${CHANNEL_ID}&part=snippet&order=date&maxResults=20&type=video`;
    const searchRes = await fetch(searchUrl);
    if (!searchRes.ok) {
      console.error("Erro na busca do YouTube:", searchRes.status);
      const cleanFallback = CONFIG2.FALLBACK_VIDEOS.map((v) => ({
        ...v,
        id: cleanVideoId(v.id),
        isLiveNow: false
      }));
      return {
        mainVideo: cleanFallback[0],
        allVideos: cleanFallback,
        cardVideos: cleanFallback.slice(1),
        liveStatus: "none"
      };
    }
    const searchData = await searchRes.json();
    if (!searchData.items || searchData.items.length === 0) {
      const cleanFallback = CONFIG2.FALLBACK_VIDEOS.map((v) => ({
        ...v,
        id: cleanVideoId(v.id),
        isLiveNow: false
      }));
      return {
        mainVideo: cleanFallback[0],
        allVideos: cleanFallback,
        cardVideos: cleanFallback.slice(1),
        liveStatus: "none"
      };
    }
    const allVideos = [];
    const videoIds = [];
    for (const item of searchData.items) {
      const videoId = cleanVideoId(item.id.videoId);
      if (videoId) videoIds.push(videoId);
    }
    let liveVideos = /* @__PURE__ */ new Set();
    if (videoIds.length > 0) {
      const detailsUrl = `https://www.googleapis.com/youtube/v3/videos?key=${API_KEY}&id=${videoIds.join(",")}&part=liveStreamingDetails,snippet,status`;
      try {
        const detailsRes = await fetch(detailsUrl);
        if (detailsRes.ok) {
          const detailsData = await detailsRes.json();
          if (detailsData.items) {
            detailsData.items.forEach((item) => {
              const hasLiveDetails = item.liveStreamingDetails !== void 0;
              const isActuallyLive = hasLiveDetails && !item.liveStreamingDetails?.actualEndTime;
              const isLiveStatus = item.snippet?.liveBroadcastContent === "live";
              if (isActuallyLive || isLiveStatus) {
                liveVideos.add(item.id);
              }
            });
          }
        }
      } catch (e) {
        console.error("Erro ao verificar status de live:", e);
      }
    }
    for (const item of searchData.items) {
      const videoId = cleanVideoId(item.id.videoId);
      const title = cleanYouTubeTitle(item.snippet.title);
      const isLiveNow = liveVideos.has(videoId);
      allVideos.push({
        id: videoId,
        title,
        thumbnail: item.snippet.thumbnails.high?.url || `https://img.youtube.com/vi/${videoId}/maxresdefault.jpg`,
        publishedAt: item.snippet.publishedAt,
        channelTitle: item.snippet.channelTitle,
        videoUrl: `https://www.youtube.com/watch?v=${videoId}`,
        link: `https://www.youtube.com/watch?v=${videoId}`,
        isLiveNow
      });
    }
    const liveVideosList = allVideos.filter((v) => v.isLiveNow === true);
    const recordedVideos = allVideos.filter((v) => v.isLiveNow === false);
    const liveStatus = liveVideosList.length > 0 ? "live" : "none";
    let mainVideo, cardVideos;
    if (liveVideosList.length > 0) {
      mainVideo = liveVideosList[0];
      const otherLives = liveVideosList.slice(1);
      const allCards = [...otherLives, ...recordedVideos].slice(0, 5);
      cardVideos = allCards.length > 0 ? allCards : CONFIG2.FALLBACK_VIDEOS.slice(1, 6).map((v) => ({
        ...v,
        id: cleanVideoId(v.id),
        isLiveNow: false
      }));
    } else {
      mainVideo = recordedVideos[0] || {
        ...CONFIG2.FALLBACK_VIDEOS[0],
        id: cleanVideoId(CONFIG2.FALLBACK_VIDEOS[0].id),
        isLiveNow: false
      };
      cardVideos = recordedVideos.length > 1 ? recordedVideos.filter((v) => v.id !== mainVideo.id).slice(0, 5) : CONFIG2.FALLBACK_VIDEOS.slice(1, 6).map((v) => ({
        ...v,
        id: cleanVideoId(v.id),
        isLiveNow: false
      }));
    }
    return { mainVideo, allVideos, cardVideos, liveStatus };
  } catch (error) {
    console.error("\u274C Erro em getYouTubeMainVideo:", error);
    const cleanFallback = CONFIG2.FALLBACK_VIDEOS.map((v) => ({
      ...v,
      id: cleanVideoId(v.id),
      isLiveNow: false
    }));
    return {
      mainVideo: cleanFallback[0],
      allVideos: cleanFallback,
      cardVideos: cleanFallback.slice(1),
      liveStatus: "none"
    };
  }
}
__name(getYouTubeMainVideo, "getYouTubeMainVideo");
async function handleYouTube(request, env) {
  const result = await getYouTubeMainVideo(env);
  return jsonResponse2({
    videos: result.allVideos,
    mainVideo: result.mainVideo,
    cardVideos: result.cardVideos,
    liveStatus: result.liveStatus,
    timestamp: (/* @__PURE__ */ new Date()).toISOString()
  });
}
__name(handleYouTube, "handleYouTube");
async function handleAdminYoutubeLivePost(request, env) {
  console.log("\u{1F4FA} handleAdminYoutubeLivePost chamado");
  const authHeader = request.headers.get("Authorization");
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return jsonResponse2({ success: false, error: "N\xE3o autorizado" }, 401);
  }
  const body = await request.json();
  const { liveUrl } = body;
  if (!liveUrl) {
    return jsonResponse2({ success: false, error: "URL da live \xE9 obrigat\xF3ria" }, 400);
  }
  console.log("\u{1F4FA} URL recebida:", liveUrl);
  let videoId = null;
  const url = liveUrl.trim();
  if (url.includes("youtube.com/watch?v=")) {
    videoId = url.split("v=")[1]?.split("&")[0]?.trim();
  } else if (url.includes("youtu.be/")) {
    videoId = url.split("youtu.be/")[1]?.split("?")[0]?.trim();
  } else if (url.includes("youtube.com/live/")) {
    videoId = url.split("youtube.com/live/")[1]?.split("?")[0]?.trim();
  }
  if (videoId) {
    videoId = videoId.split("&")[0].split("?")[0].trim();
  }
  if (!videoId) {
    return jsonResponse2({ success: false, error: "N\xE3o foi poss\xEDvel extrair o ID do v\xEDdeo." }, 400);
  }
  console.log("\u{1F4FA} Video ID extra\xEDdo:", videoId);
  const liveData = {
    id: videoId,
    videoId,
    title: "Transmiss\xE3o ao Vivo \u2014 Santu\xE1rio de F\xE1tima",
    thumbnail: `https://img.youtube.com/vi/${videoId}/maxresdefault.jpg`,
    link: `https://www.youtube.com/watch?v=${videoId}`,
    isLiveNow: true,
    ativo: true,
    atualizadoEm: (/* @__PURE__ */ new Date()).toISOString()
  };
  await env.KV_YOUTUBE_STORAGE.put("live_manual", JSON.stringify(liveData));
  console.log("\u2705 Live salva com sucesso:", liveData);
  return jsonResponse2({ success: true, live: liveData });
}
__name(handleAdminYoutubeLivePost, "handleAdminYoutubeLivePost");
async function handleAdminYoutubeLiveDelete(request, env) {
  console.log("\u{1F4FA} handleAdminYoutubeLiveDelete chamado");
  const authHeader = request.headers.get("Authorization");
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return jsonResponse2({ success: false, error: "N\xE3o autorizado" }, 401);
  }
  await env.KV_YOUTUBE_STORAGE.delete("live_manual");
  console.log("\u2705 Live removida do KV_YOUTUBE_STORAGE");
  return jsonResponse2({ success: true, message: "Live removida com sucesso!" });
}
__name(handleAdminYoutubeLiveDelete, "handleAdminYoutubeLiveDelete");
async function handleAdminYoutubeLiveGet(request, env) {
  console.log("\u{1F4FA} handleAdminYoutubeLiveGet chamado");
  const authHeader = request.headers.get("Authorization");
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return jsonResponse2({ success: false, error: "N\xE3o autorizado" }, 401);
  }
  const liveManual = await env.KV_YOUTUBE_STORAGE?.get("live_manual", "json");
  console.log("\u{1F4FA} Live encontrada:", liveManual ? "Sim" : "N\xE3o");
  return jsonResponse2({ success: true, live: liveManual || null });
}
__name(handleAdminYoutubeLiveGet, "handleAdminYoutubeLiveGet");

// src/routes/public/vatican.js
function parseRSS(xml) {
  const items = [];
  const itemMatches = xml.matchAll(/<item>([\s\S]*?)<\/item>/g);
  for (const match of itemMatches) {
    if (items.length >= 12) break;
    const itemXml = match[1];
    const getTag = /* @__PURE__ */ __name((tagName) => {
      const regex = new RegExp(`<${tagName}>([\\s\\S]*?)</${tagName}>`);
      const m = itemXml.match(regex);
      return m ? cleanText(m[1]) : "";
    }, "getTag");
    const title = getTag("title");
    const link = getTag("link");
    const description = getTag("description");
    const pubDate = getTag("pubDate") || (/* @__PURE__ */ new Date()).toISOString();
    if (title && link) {
      items.push({
        id: `vatican_${Date.now()}_${items.length}`,
        title,
        link: link.trim(),
        description: description.substring(0, 180) + "...",
        pubDate,
        author: "Vatican News",
        category: "Noticias"
      });
    }
  }
  return items;
}
__name(parseRSS, "parseRSS");
function categorizeNews(items) {
  return items.map((item) => {
    let category = "Noticias";
    const lowerTitle = item.title.toLowerCase();
    const lowerLink = item.link.toLowerCase();
    if (lowerLink.includes("/papa/") || lowerTitle.includes("papa")) category = "Papa Francisco";
    else if (lowerLink.includes("/cultura/") || lowerTitle.includes("cultura")) category = "Cultura";
    else if (lowerLink.includes("/formacao/") || lowerTitle.includes("formacao")) category = "Forma\xE7\xE3o";
    else if (lowerLink.includes("/igreja/")) category = "Igreja";
    else if (lowerTitle.includes("jovens")) category = "Juventude";
    else if (lowerTitle.includes("familia")) category = "Fam\xEDlia";
    return { ...item, category };
  });
}
__name(categorizeNews, "categorizeNews");
function getFallbackNewsArray() {
  return [{
    id: "fallback_1",
    title: "Vatican News - \xDAltimas Not\xEDcias",
    link: "https://www.vaticannews.va/pt.html",
    description: "Acesse o site oficial do Vatican News.",
    pubDate: (/* @__PURE__ */ new Date()).toISOString(),
    author: "Vatican News",
    category: "Noticias"
  }];
}
__name(getFallbackNewsArray, "getFallbackNewsArray");
async function getVaticanNews(env) {
  const cacheKey = "vatican_news:latest";
  try {
    const cached = await env.VATICANNEWS_CACHE?.get(cacheKey, "json");
    if (cached) {
      if (Array.isArray(cached)) return cached;
      if (cached.items && Array.isArray(cached.items)) return cached.items;
    }
    const res = await fetch("https://www.vaticannews.va/pt.rss.xml");
    const xml = await res.text();
    const items = parseRSS(xml);
    const finalItems = categorizeNews(items).slice(0, 6);
    if (env.VATICANNEWS_CACHE) {
      await env.VATICANNEWS_CACHE.put(cacheKey, JSON.stringify(finalItems), { expirationTtl: 3600 });
    }
    return finalItems;
  } catch (error) {
    console.error("Erro no Vatican News:", error);
    return getFallbackNewsArray();
  }
}
__name(getVaticanNews, "getVaticanNews");

// src/routes/public/diocese.js
function extractNewsFromHTML(html) {
  const news = [];
  try {
    const newsPatterns = [
      { pattern: /Posse Canônica 2026/g, category: "Acontecimentos Eclesiais" },
      { pattern: /Crisma/g, category: "Sacramentos" },
      { pattern: /Igreja Diocesana/g, category: "Igreja" },
      { pattern: /Acontece na Igreja/g, category: "Not\xEDcias" },
      { pattern: /Retiro do Clero 2025/g, category: "Clero" },
      { pattern: /Centro Pastoral em ação/g, category: "Pastoral" },
      { pattern: /Visita Pastoral/g, category: "Pastoral" }
    ];
    newsPatterns.forEach(({ pattern, category }) => {
      if (pattern.test(html)) {
        news.push(createNewsItem(pattern.source, category));
      }
    });
    const titleRegex = /<h[1-3][^>]*>(.*?)<\/h[1-3]>/gi;
    const titles = [...html.matchAll(titleRegex)];
    titles.slice(0, 5).forEach((match, index) => {
      const title = match[1].replace(/<[^>]*>/g, "").trim();
      if (title.length > 10 && !news.some((n) => n.title === title)) {
        news.push(createNewsItem(title, "\xDAltimas Not\xEDcias", index));
      }
    });
  } catch (e) {
    console.error("Erro ao extrair not\xEDcias:", e);
  }
  return news.filter(
    (item, index, self) => index === self.findIndex((n) => n.title === item.title)
  ).slice(0, 6);
}
__name(extractNewsFromHTML, "extractNewsFromHTML");
function createNewsItem(title, category, index = 0) {
  const descriptions = [
    "A Diocese de Santo Amaro convida todos os fi\xE9is para este importante momento de f\xE9 e comunh\xE3o.",
    "Participe deste evento especial que reunir\xE1 a comunidade diocesana em ora\xE7\xE3o e reflex\xE3o.",
    "Momento de gra\xE7a e renova\xE7\xE3o espiritual para toda a fam\xEDlia diocesana.",
    "Venha vivenciar esta experi\xEAncia \xFAnica de f\xE9 e partilha conosco."
  ];
  const authors = [
    "Pascom Diocese",
    "Equipe de Comunica\xE7\xE3o",
    "Diocese de Santo Amaro"
  ];
  return {
    id: `diocese-${Date.now()}-${index}-${Math.random().toString(36).substr(2, 9)}`,
    title,
    description: descriptions[index % descriptions.length],
    link: "https://diocesedesantoamaro.org.br",
    pubDate: new Date(Date.now() - index * 864e5).toISOString(),
    author: authors[index % authors.length],
    category
  };
}
__name(createNewsItem, "createNewsItem");
function getSimulatedNews() {
  return [
    {
      id: "1",
      title: "Posse Can\xF4nica 2026",
      description: "A Diocese de Santo Amaro se prepara para a celebra\xE7\xE3o da Posse Can\xF4nica que acontecer\xE1 em 2026.",
      link: "https://diocesedesantoamaro.org.br",
      pubDate: (/* @__PURE__ */ new Date()).toISOString(),
      author: "Pascom Diocese",
      category: "Acontecimentos Eclesiais"
    },
    {
      id: "2",
      title: "Celebra\xE7\xE3o do Crisma",
      description: "Jovens e adultos se preparam para receber o Sacramento do Crisma em nossas par\xF3quias.",
      link: "https://diocesedesantoamaro.org.br",
      pubDate: new Date(Date.now() - 864e5).toISOString(),
      author: "Equipe de Catequese",
      category: "Sacramentos"
    },
    {
      id: "3",
      title: "Igreja Diocesana em Movimento",
      description: "Acompanhe as principais atividades e acontecimentos da Igreja Diocesana de Santo Amaro.",
      link: "https://diocesedesantoamaro.org.br",
      pubDate: new Date(Date.now() - 1728e5).toISOString(),
      author: "Comunica\xE7\xE3o Diocesana",
      category: "Igreja Diocesana"
    },
    {
      id: "4",
      title: "Acontece na Igreja",
      description: "Fique por dentro dos principais eventos e celebra\xE7\xF5es que acontecem em nossa diocese.",
      link: "https://diocesedesantoamaro.org.br",
      pubDate: new Date(Date.now() - 2592e5).toISOString(),
      author: "Pascom",
      category: "Acontece na Igreja"
    },
    {
      id: "5",
      title: "Retiro do Clero 2025",
      description: "Sacerdotes da diocese participam do Retiro do Clero 2025, momento de espiritualidade.",
      link: "https://diocesedesantoamaro.org.br",
      pubDate: new Date(Date.now() - 3456e5).toISOString(),
      author: "Equipe Diocesana",
      category: "Clero"
    },
    {
      id: "6",
      title: "Centro Pastoral em A\xE7\xE3o",
      description: "Centro Pastoral Diocesano promove encontros e forma\xE7\xF5es para agentes de pastoral.",
      link: "https://diocesedesantoamaro.org.br",
      pubDate: new Date(Date.now() - 432e6).toISOString(),
      author: "Centro Pastoral",
      category: "Pastoral"
    }
  ];
}
__name(getSimulatedNews, "getSimulatedNews");
async function handleDioceseNews(request, env) {
  if (request.method !== "GET") {
    return jsonResponse2({ success: false, error: "M\xE9todo n\xE3o permitido" }, 405);
  }
  try {
    console.log("\u{1F310} Buscando not\xEDcias da Diocese de Santo Amaro...");
    const response = await fetch("https://diocesedesantoamaro.org.br", {
      headers: {
        "User-Agent": "Mozilla/5.0 (compatible; SantuarioBot/1.0)",
        "Accept": "text/html,application/xhtml+xml"
      }
    });
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    const html = await response.text();
    const newsItems = extractNewsFromHTML(html);
    const finalNews = newsItems.length > 0 ? newsItems : getSimulatedNews();
    return jsonResponse2({
      success: true,
      items: finalNews,
      total: finalNews.length,
      source: "diocesedesantoamaro.org.br",
      timestamp: (/* @__PURE__ */ new Date()).toISOString()
    });
  } catch (error) {
    console.error("\u274C Erro no worker da Diocese:", error);
    return jsonResponse2({
      success: false,
      error: error.message,
      items: getSimulatedNews(),
      source: "simulated",
      timestamp: (/* @__PURE__ */ new Date()).toISOString()
    });
  }
}
__name(handleDioceseNews, "handleDioceseNews");

// src/utils/limpeza.js
async function cleanupOldCandles(env) {
  try {
    if (!env.DB) return;
    const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1e3).toISOString();
    await env.DB.prepare(`UPDATE velas SET status = 0 WHERE data < ? AND status = 1`).bind(sevenDaysAgo).run();
  } catch (error) {
    console.error("Erro na limpeza de velas:", error);
  }
}
__name(cleanupOldCandles, "cleanupOldCandles");
async function backupOldPrayers(env) {
  try {
    if (!env.DB) return;
    const sixtyDaysAgo = new Date(Date.now() - 60 * 24 * 60 * 60 * 1e3).toISOString();
    await env.DB.prepare(`DELETE FROM prayer WHERE created_at < ?`).bind(sixtyDaysAgo).run();
  } catch (error) {
    console.error("Erro ao limpar pedidos:", error);
  }
}
__name(backupOldPrayers, "backupOldPrayers");

// src/utils/auth.js
async function getUserFromToken(request, env) {
  const authHeader = request.headers.get("Authorization");
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return null;
  }
  const token = authHeader.replace("Bearer ", "").trim();
  const user = await env.DB.prepare(`
    SELECT id, nome, email, role
    FROM users
    WHERE token = ? AND token_expires > ?
  `).bind(token, Date.now()).first();
  return user || null;
}
__name(getUserFromToken, "getUserFromToken");
async function requireAdmin(request, env) {
  const user = await getUserFromToken(request, env);
  if (!user) {
    return new Response(
      JSON.stringify({ success: false, error: "N\xE3o autenticado" }),
      { status: 401 }
    );
  }
  if (user.role !== "admin") {
    return new Response(
      JSON.stringify({ success: false, error: "Acesso negado" }),
      { status: 403 }
    );
  }
  return user;
}
__name(requireAdmin, "requireAdmin");

// src/controllers/auth_shared.js
async function sha2562(text) {
  const encoder2 = new TextEncoder();
  const data = encoder2.encode(text);
  const hashBuffer = await crypto.subtle.digest("SHA-256", data);
  return [...new Uint8Array(hashBuffer)].map((b) => b.toString(16).padStart(2, "0")).join("");
}
__name(sha2562, "sha256");
async function verificarSenha(senha, hash) {
  const hashed = await sha2562(senha);
  return hashed === hash;
}
__name(verificarSenha, "verificarSenha");

// src/routes/admin/index.js
function inicializarHorariosPadrao() {
  return [
    { id: "segunda", dia: "Segunda-Feira", missas: [], ativo: true },
    {
      id: "terca",
      dia: "Ter\xE7a-Feira",
      missas: [
        { id: "terca-1", hora: "07h30" },
        { id: "terca-2", hora: "19h30", tipo: "Confiss\xE3o - Chegue com 1h de anteced\xEAncia" }
      ],
      ativo: true
    },
    {
      id: "quarta",
      dia: "Quarta-Feira",
      missas: [
        { id: "quarta-1", hora: "19h30", tipo: "Confiss\xE3o - Chegue com 1h de anteced\xEAncia" }
      ],
      ativo: true
    },
    {
      id: "quinta",
      dia: "Quinta-Feira",
      missas: [
        { id: "quinta-1", hora: "07h30" },
        { id: "quinta-2", hora: "19h30", tipo: "Confiss\xE3o - Chegue com 1h de anteced\xEAncia" }
      ],
      ativo: true
    },
    {
      id: "sexta",
      dia: "Sexta-Feira",
      missas: [
        { id: "sexta-1", hora: "19h30", tipo: "Confiss\xE3o - Chegue com 1h de anteced\xEAncia" }
      ],
      ativo: true
    },
    {
      id: "sabado",
      dia: "S\xE1bado",
      missas: [
        { id: "sabado-1", hora: "16h30", tipo: "Confiss\xE3o - Chegue com 1h de anteced\xEAncia" }
      ],
      ativo: true
    },
    {
      id: "domingo",
      dia: "Domingo",
      missas: [
        { id: "domingo-1", hora: "08h00" },
        {
          id: "domingo-2",
          hora: "10h00",
          tipo: "Transmitida AO VIVO",
          youtube: true,
          youtubeLink: "https://youtube.com/@santuariodefatimanews"
        },
        { id: "domingo-3", hora: "18h30" }
      ],
      ativo: true
    }
  ];
}
__name(inicializarHorariosPadrao, "inicializarHorariosPadrao");
async function handleAdminDados(request, env) {
  console.log("\u{1F535} handleAdminDados chamado");
  const user = await requireAdmin(request, env);
  if (user instanceof Response) return user;
  try {
    let carrossel = await env.KV_FILES?.get("santuario_carrossel", "json") || [];
    let popups = await env.KV_FILES?.get("santuario_popups", "json") || [];
    let recados = await env.KV_FILES?.get("santuario_recados", "json") || [];
    let horariosMissas = await env.KV_MISSAS?.get("horariosMissas", "json");
    let momentosLiturgicos = await env.KV_LITURGIA?.get("momentos", "json") || [];
    if (!Array.isArray(horariosMissas)) {
      horariosMissas = inicializarHorariosPadrao();
    }
    return jsonResponse({
      success: true,
      dados: { carrossel, momentosLiturgicos, popups, recados, horariosMissas }
    });
  } catch (error) {
    console.error("\u274C Erro ao carregar dados:", error);
    return jsonResponse({ success: false, error: "Erro ao carregar dados" }, 500);
  }
}
__name(handleAdminDados, "handleAdminDados");
async function handleAdminSalvarDados(request, env) {
  console.log("\u{1F7E2} handleAdminSalvarDados chamado");
  const user = await requireAdmin(request, env);
  if (user instanceof Response) return user;
  try {
    const dados = await request.json();
    if (dados.carrossel !== void 0) {
      await env.KV_FILES.put("santuario_carrossel", JSON.stringify(dados.carrossel));
    }
    if (dados.popups !== void 0) {
      await env.KV_FILES.put("santuario_popups", JSON.stringify(dados.popups));
    }
    if (dados.recados !== void 0) {
      await env.KV_FILES.put("santuario_recados", JSON.stringify(dados.recados));
    }
    if (Array.isArray(dados.horariosMissas)) {
      await env.KV_MISSAS.put("horariosMissas", JSON.stringify(dados.horariosMissas));
    }
    if (dados.momentosLiturgicos !== void 0) {
      await env.KV_LITURGIA.put("momentos", JSON.stringify(dados.momentosLiturgicos));
    }
    return jsonResponse({ success: true, message: "Dados salvos com sucesso!" });
  } catch (error) {
    console.error("\u274C Erro ao salvar:", error);
    return jsonResponse({ success: false, error: "Erro ao salvar dados" }, 500);
  }
}
__name(handleAdminSalvarDados, "handleAdminSalvarDados");
async function handleAdminPerfil(request, env) {
  const user = await requireAdmin(request, env);
  if (user instanceof Response) return user;
  return jsonResponse({
    success: true,
    perfil: {
      nome: user.nome,
      email: user.email,
      role: user.role
    }
  });
}
__name(handleAdminPerfil, "handleAdminPerfil");
async function handleAdminAtualizarPerfil(request, env) {
  const user = await requireAdmin(request, env);
  if (user instanceof Response) return user;
  try {
    const { nome, email } = await request.json();
    await env.DB.prepare(`
      UPDATE users SET nome = ?, email = ?
      WHERE id = ?
    `).bind(
      nome || user.nome,
      email || user.email,
      user.id
    ).run();
    return jsonResponse({ success: true, message: "Perfil atualizado!" });
  } catch (error) {
    return jsonResponse({ success: false, error: "Erro ao atualizar perfil" }, 500);
  }
}
__name(handleAdminAtualizarPerfil, "handleAdminAtualizarPerfil");
async function handleAdminAlterarSenha(request, env) {
  const user = await requireAdmin(request, env);
  if (user instanceof Response) return user;
  try {
    const { senha_atual, nova_senha } = await request.json();
    const dbUser = await env.DB.prepare(`
      SELECT senha_hash FROM users WHERE id = ?
    `).bind(user.id).first();
    if (!dbUser) {
      return jsonResponse({ success: false, error: "Usu\xE1rio n\xE3o encontrado" }, 404);
    }
    const senhaOk = await verificarSenha(senha_atual, dbUser.senha_hash);
    if (!senhaOk) {
      return jsonResponse({ success: false, error: "Senha atual incorreta" }, 400);
    }
    if (!nova_senha || nova_senha.length < 6) {
      return jsonResponse({ success: false, error: "Nova senha fraca" }, 400);
    }
    const novaHash = await sha2562(nova_senha);
    await env.DB.prepare(`
      UPDATE users SET senha_hash = ?
      WHERE id = ?
    `).bind(novaHash, user.id).run();
    return jsonResponse({ success: true, message: "Senha alterada com sucesso!" });
  } catch (error) {
    return jsonResponse({ success: false, error: "Erro ao alterar senha" }, 500);
  }
}
__name(handleAdminAlterarSenha, "handleAdminAlterarSenha");

// src/routes/fiel/dados.js
async function getDados(request, env) {
  const auth = await requireFiel(request, env);
  if (auth instanceof Response) return auth;
  const url = new URL(request.url);
  const email = url.searchParams.get("email") || auth.email;
  if (!email) return errorResponse2("E-mail \xE9 obrigat\xF3rio", 400);
  try {
    const db = env.DB;
    const stmt = db.prepare(`SELECT musicas, versiculos, oracoes, fotos, termo_aceito, termo_data FROM fiel_dados WHERE email = ?`);
    const result = await stmt.bind(email).first();
    if (!result) {
      await db.prepare(`INSERT INTO fiel_dados (email, musicas, versiculos, oracoes, fotos, termo_aceito, created_at, updated_at) VALUES (?, '[]', '[]', '[]', '[]', 0, ?, ?)`).bind(email, (/* @__PURE__ */ new Date()).toISOString(), (/* @__PURE__ */ new Date()).toISOString()).run();
      return jsonResponse2({ success: true, musicas: [], versiculos: [], oracoes: [], fotos: [], termoAceito: false, termoData: null });
    }
    return jsonResponse2({
      success: true,
      musicas: JSON.parse(result.musicas || "[]"),
      versiculos: JSON.parse(result.versiculos || "[]"),
      oracoes: JSON.parse(result.oracoes || "[]"),
      fotos: JSON.parse(result.fotos || "[]"),
      termoAceito: result.termo_aceito === 1,
      termoData: result.termo_data ? JSON.parse(result.termo_data) : null
    });
  } catch (error) {
    console.error("Erro ao carregar dados:", error);
    return errorResponse2("Erro ao carregar dados", 500);
  }
}
__name(getDados, "getDados");

// src/routes/fiel/salvar.js
async function salvarDados(request, env) {
  try {
    const body = await request.json();
    const { email, musicas, versiculos, oracoes, fotos } = body;
    if (!email) return errorResponse("E-mail \xE9 obrigat\xF3rio", 400);
    const db = env.DB;
    const now = (/* @__PURE__ */ new Date()).toISOString();
    const existing = await db.prepare(
      "SELECT email FROM fiel_dados WHERE email = ?"
    ).bind(email).first();
    if (existing) {
      await db.prepare(`
        UPDATE fiel_dados
        SET musicas = ?, versiculos = ?, oracoes = ?, fotos = ?, updated_at = ?
        WHERE email = ?
      `).bind(
        JSON.stringify(musicas ?? []),
        JSON.stringify(versiculos ?? []),
        JSON.stringify(oracoes ?? []),
        JSON.stringify(fotos ?? []),
        now,
        email
      ).run();
    } else {
      await db.prepare(`
        INSERT INTO fiel_dados (email, musicas, versiculos, oracoes, fotos, termo_aceito, created_at, updated_at)
        VALUES (?, ?, ?, ?, ?, 0, ?, ?)
      `).bind(
        email,
        JSON.stringify(musicas ?? []),
        JSON.stringify(versiculos ?? []),
        JSON.stringify(oracoes ?? []),
        JSON.stringify(fotos ?? []),
        now,
        now
      ).run();
    }
    return jsonResponse({ success: true, message: "Dados salvos com sucesso" });
  } catch (error) {
    console.error("Erro ao salvar dados:", error);
    return errorResponse("Erro ao salvar dados", 500);
  }
}
__name(salvarDados, "salvarDados");

// src/routes/fiel/perfil.js
async function atualizarPerfil(request, env) {
  try {
    const body = await request.json();
    const { email, nome, telefone, avatar } = body;
    if (!email) return errorResponse("E-mail \xE9 obrigat\xF3rio", 400);
    const db = env.DB;
    const now = (/* @__PURE__ */ new Date()).toISOString();
    const existing = await db.prepare(
      "SELECT email FROM fiel_dados WHERE email = ?"
    ).bind(email).first();
    if (existing) {
      await db.prepare(`
        UPDATE fiel_dados
        SET nome = ?, telefone = ?, avatar = ?, updated_at = ?
        WHERE email = ?
      `).bind(nome ?? null, telefone ?? null, avatar ?? null, now, email).run();
    } else {
      await db.prepare(`
        INSERT INTO fiel_dados (email, nome, telefone, avatar, musicas, versiculos, oracoes, fotos, termo_aceito, created_at, updated_at)
        VALUES (?, ?, ?, ?, '[]', '[]', '[]', '[]', 0, ?, ?)
      `).bind(email, nome ?? null, telefone ?? null, avatar ?? null, now, now).run();
    }
    return jsonResponse({ success: true, message: "Perfil atualizado com sucesso" });
  } catch (error) {
    console.error("Erro ao atualizar perfil:", error);
    return errorResponse("Erro ao atualizar perfil", 500);
  }
}
__name(atualizarPerfil, "atualizarPerfil");

// src/routes/fiel/pastorais.js
async function listarPastorais(request, env) {
  try {
    const db = env.DB;
    const { results } = await db.prepare(`
      SELECT id, nome, descricao, responsavel, contato, ativo
      FROM pastorais
      WHERE ativo = 1
      ORDER BY nome ASC
    `).all();
    return jsonResponse({ success: true, pastorais: results ?? [] });
  } catch (error) {
    console.error("Erro ao listar pastorais:", error);
    return jsonResponse({ success: true, pastorais: [] });
  }
}
__name(listarPastorais, "listarPastorais");

// src/routes/fiel/termo-publico.js
function gerarHTMLTermo(data) {
  const dataFormatada = new Date(data.dataAceite).toLocaleDateString("pt-BR", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric"
  });
  const horaFormatada = new Date(data.dataAceite).toLocaleTimeString("pt-BR");
  return `<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <title>Termo de Autoriza\xE7\xE3o de Uso de \xC1udio</title>
  <style>
    body {
      font-family: 'Times New Roman', Times, serif;
      margin: 0;
      padding: 40px;
      background: white;
      color: #333;
      line-height: 1.6;
    }
    .container {
      max-width: 800px;
      margin: 0 auto;
      padding: 30px;
      border: 1px solid #ccc;
      box-shadow: 0 0 10px rgba(0,0,0,0.1);
    }
    .header {
      text-align: center;
      margin-bottom: 30px;
      border-bottom: 2px solid #0b3b5c;
      padding-bottom: 20px;
    }
    .header h1 {
      color: #0b3b5c;
      font-size: 24px;
      margin: 0 0 10px 0;
    }
    .header p {
      color: #666;
      margin: 0;
    }
    .content {
      margin-bottom: 30px;
    }
    .termo-texto {
      background: #f9f9f9;
      padding: 20px;
      border-left: 4px solid #0b3b5c;
      margin: 20px 0;
      font-style: italic;
    }
    .dados {
      background: #f0f7ff;
      padding: 20px;
      margin: 20px 0;
      border-radius: 8px;
    }
    .dados p {
      margin: 8px 0;
    }
    .assinatura {
      margin-top: 40px;
      text-align: center;
      border-top: 1px solid #ccc;
      padding-top: 20px;
    }
    .footer {
      text-align: center;
      font-size: 12px;
      color: #666;
      margin-top: 30px;
    }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>SANTU\xC1RIO NOSSA SENHORA DE F\xC1TIMA</h1>
      <p>Rua Darwin, 651 - Santo Amaro, S\xE3o Paulo - SP</p>
      <p>santuariodefatima.com.br | (11) 5521-0312</p>
    </div>
    
    <div class="content">
      <h2 style="text-align: center; color: #0b3b5c;">TERMO DE AUTORIZA\xC7\xC3O DE USO DE \xC1UDIO</h2>
      
      <div class="dados">
        <p><strong>NOME COMPLETO:</strong> ${data.nome}</p>
        <p><strong>CPF:</strong> ${data.cpf.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, "$1.$2.$3-$4")}</p>
        <p><strong>E-MAIL:</strong> ${data.email}</p>
        ${data.responsavelLegal ? `<p><strong>RESPONS\xC1VEL LEGAL:</strong> ${data.responsavelLegal}</p>` : ""}
        ${data.cpfResponsavel ? `<p><strong>CPF DO RESPONS\xC1VEL:</strong> ${data.cpfResponsavel.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, "$1.$2.$3-$4")}</p>` : ""}
        <p><strong>DATA DO ACEITE:</strong> ${dataFormatada} \xE0s ${horaFormatada}</p>
        <p><strong>IP DE ORIGEM:</strong> ${data.ip || "N\xE3o dispon\xEDvel"}</p>
      </div>
      
      <div class="termo-texto">
        <p>Eu, <strong>${data.nome}</strong>, portador(a) do CPF <strong>${data.cpf.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, "$1.$2.$3-$4")}</strong>,</p>
        <p>AUTORIZO a grava\xE7\xE3o em \xE1udio da minha voz, para que possa ser personalizada a B\xEDblia Online do Site - Santu\xE1rio Nossa Senhora de F\xE1tima - Santo Amaro - S\xE3o Paulo-SP, para que no entendimento desta possa eu fiel, ouvir a B\xEDblia com a minha pr\xF3pria locu\xE7\xE3o interativa, ficando ainda facultativo o uso de outras vozes - locutoras no menu da p\xE1gina.</p>
        <p>Fica ainda autorizada, de livre e espont\xE2nea vontade, para os mesmos fins, a cess\xE3o de direitos da veicula\xE7\xE3o das vozes, n\xE3o recebendo para tanto qualquer tipo de remunera\xE7\xE3o.</p>
      </div>
    </div>
    
    <div class="assinatura">
      <p>_________________________________________</p>
      <p><strong>${data.nome}</strong></p>
      <p>Assinatura (digitalmente aceito)</p>
    </div>
    
    <div class="footer">
      <p>Documento assinado eletronicamente no site do Santu\xE1rio de F\xE1tima</p>
      <p>Protocolo: ${data.id} | ${dataFormatada}</p>
    </div>
  </div>
</body>
</html>`;
}
__name(gerarHTMLTermo, "gerarHTMLTermo");
async function registrarTermoPublico(request, env, ctx) {
  try {
    if (request.method === "OPTIONS") {
      return new Response(null, { status: 204, headers: corsHeaders2() });
    }
    if (request.method !== "POST") {
      return jsonResponse({ success: false, error: "M\xE9todo n\xE3o permitido" }, 405);
    }
    const body = await request.json();
    const { nome, cpf, email, responsavelLegal, cpfResponsavel, dataAceite } = body;
    if (!nome || !cpf || !email) {
      return jsonResponse({
        success: false,
        error: "Campos obrigat\xF3rios: nome, cpf, email"
      }, 400);
    }
    const validarCPF = /* @__PURE__ */ __name((cpfNum) => {
      const numeros = cpfNum.replace(/\D/g, "");
      if (numeros.length !== 11) return false;
      let soma = 0;
      let resto;
      for (let i = 1; i <= 9; i++) {
        soma += parseInt(numeros.substring(i - 1, i)) * (11 - i);
      }
      resto = soma * 10 % 11;
      if (resto === 10 || resto === 11) resto = 0;
      if (resto !== parseInt(numeros.substring(9, 10))) return false;
      soma = 0;
      for (let i = 1; i <= 10; i++) {
        soma += parseInt(numeros.substring(i - 1, i)) * (12 - i);
      }
      resto = soma * 10 % 11;
      if (resto === 10 || resto === 11) resto = 0;
      if (resto !== parseInt(numeros.substring(10, 11))) return false;
      return true;
    }, "validarCPF");
    if (!validarCPF(cpf)) {
      return jsonResponse({ success: false, error: "CPF inv\xE1lido" }, 400);
    }
    const validarEmail = /* @__PURE__ */ __name((emailStr) => {
      const regex = /^[^\s@]+@([^\s@]+\.)+[^\s@]+$/;
      return regex.test(emailStr);
    }, "validarEmail");
    if (!validarEmail(email)) {
      return jsonResponse({ success: false, error: "E-mail inv\xE1lido" }, 400);
    }
    const now = (/* @__PURE__ */ new Date()).toISOString();
    const id = `${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const ip = request.headers.get("CF-Connecting-IP") || request.headers.get("X-Forwarded-For") || request.headers.get("x-real-ip") || "desconhecido";
    const userAgent = request.headers.get("User-Agent") || "";
    const termoData = {
      id,
      nome,
      cpf,
      email,
      responsavelLegal,
      cpfResponsavel,
      ip,
      userAgent,
      dataAceite: now
    };
    if (env.DB) {
      try {
        await env.DB.prepare(`
          CREATE TABLE IF NOT EXISTS termos_voz (
            id TEXT PRIMARY KEY,
            nome TEXT NOT NULL,
            cpf TEXT NOT NULL,
            email TEXT NOT NULL,
            responsavel_legal TEXT,
            cpf_responsavel TEXT,
            ip TEXT,
            user_agent TEXT,
            data_aceite TEXT NOT NULL,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP
          )
        `).run();
        await env.DB.prepare(`
          INSERT INTO termos_voz (id, nome, cpf, email, responsavel_legal, cpf_responsavel, ip, user_agent, data_aceite)
          VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
        `).bind(id, nome, cpf, email, responsavelLegal || null, cpfResponsavel || null, ip, userAgent, now).run();
        console.log(`\u2705 Termo de voz REGISTRADO: ${id} - ${nome} (${email})`);
      } catch (dbError) {
        console.error("Erro ao salvar no D1:", dbError);
      }
    }
    const htmlTermo = gerarHTMLTermo(termoData);
    if (env.RESEND_API_KEY) {
      try {
        await sendTermoEmailToFiel(env, termoData, htmlTermo);
        await sendTermoEmailToSecretariat(env, termoData, htmlTermo);
        console.log(`\u2705 Emails enviados para: ${email} e secretaria`);
      } catch (emailError) {
        console.error("Erro ao enviar emails:", emailError);
      }
    }
    return jsonResponse({
      success: true,
      message: "Termo de autoriza\xE7\xE3o registrado com sucesso! Voc\xEA receber\xE1 um email com o PDF do termo assinado.",
      data: { id, nome, email, dataAceite: now }
    });
  } catch (error) {
    console.error("Erro em registrarTermoPublico:", error);
    return jsonResponse({
      success: false,
      error: "Erro interno no servidor: " + error.message
    }, 500);
  }
}
__name(registrarTermoPublico, "registrarTermoPublico");
async function sendTermoEmailToFiel(env, data, htmlTermo) {
  try {
    const dataFormatada = new Date(data.dataAceite).toLocaleDateString("pt-BR");
    const emailHtml = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="UTF-8">
        <title>Termo de Autoriza\xE7\xE3o de Voz - Santu\xE1rio de F\xE1tima</title>
        <style>
          body { font-family: 'Georgia', 'Times New Roman', serif; background: #f5f5f5; margin: 0; padding: 20px; }
          .container { max-width: 600px; margin: 0 auto; background: white; border-radius: 16px; overflow: hidden; box-shadow: 0 10px 30px rgba(0,0,0,0.1); }
          .header { background: #0b3b5c; color: white; padding: 20px; text-align: center; }
          .header h1 { margin: 0; font-size: 24px; }
          .content { padding: 30px; }
          .aviso { background: #e8f5e9; border-left: 4px solid #4caf50; padding: 15px; margin: 20px 0; border-radius: 4px; }
          .btn-pdf { background: #0b3b5c; color: white; padding: 12px 24px; text-decoration: none; border-radius: 8px; display: inline-block; margin: 20px 0; }
          .footer { background: #f8f9fa; padding: 20px; text-align: center; font-size: 12px; color: #7f8c8d; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>\u2705 Termo de Autoriza\xE7\xE3o de Voz</h1>
            <p>Santu\xE1rio Nossa Senhora de F\xE1tima</p>
          </div>
          <div class="content">
            <p>Ol\xE1 <strong>${data.nome}</strong>,</p>
            <p>Recebemos e registramos seu Termo de Autoriza\xE7\xE3o de Uso de \xC1udio.</p>
            
            <div class="aviso">
              <strong>\u{1F3A4} Seu termo foi registrado com sucesso!</strong><br>
              Data do registro: ${dataFormatada}<br>
              Protocolo: ${data.id}
            </div>
            
            <p>Em anexo a este email, voc\xEA encontrar\xE1 o PDF do termo assinado digitalmente para seus registros.</p>
            <p>Agora voc\xEA j\xE1 pode gravar sua voz na B\xEDblia Online! Clique no bot\xE3o "Contribuir" ao lado de qualquer vers\xEDculo e comece a gravar.</p>
            
            <p style="margin-top: 30px; text-align: center;">
              <strong>Que Nossa Senhora de F\xE1tima aben\xE7oe sua contribui\xE7\xE3o!</strong>
            </p>
          </div>
          <div class="footer">
            <p><strong>Santuario Nossa Senhora de Fatima</strong></p>
            <p>Rua Darwin, 651 - Santo Amaro, S\xE3o Paulo - SP</p>
            <p>santuariodefatima.com.br | (11) 5521-0312</p>
          </div>
        </div>
      </body>
      </html>
    `;
    const emailCompleto = `
      <div style="max-width: 600px; margin: 0 auto;">
        ${emailHtml}
        <hr style="margin: 30px 0;">
        <div style="background: #f9f9f9; padding: 20px; border-radius: 8px;">
          <h3 style="color: #0b3b5c;">\u{1F4C4} Termo de Autoriza\xE7\xE3o</h3>
          ${htmlTermo}
        </div>
      </div>
    `;
    await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: { "Authorization": `Bearer ${env.RESEND_API_KEY}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        from: "Santuario de Fatima <noreply@mail.santuariodefatima.com.br>",
        to: [data.email],
        subject: "\u2705 Termo de Autoriza\xE7\xE3o de Voz - Santu\xE1rio de F\xE1tima",
        html: emailCompleto
      })
    });
    console.log(`\u2705 Email do termo enviado para ${data.email}`);
  } catch (error) {
    console.error("Erro ao enviar email para o fiel:", error);
    throw error;
  }
}
__name(sendTermoEmailToFiel, "sendTermoEmailToFiel");
async function sendTermoEmailToSecretariat(env, data, htmlTermo) {
  try {
    const dataFormatada = new Date(data.dataAceite).toLocaleDateString("pt-BR");
    const horaFormatada = new Date(data.dataAceite).toLocaleTimeString("pt-BR");
    const emailHtml = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="UTF-8">
        <title>Novo Termo de Voz - Santu\xE1rio de F\xE1tima</title>
        <style>
          body { font-family: 'Georgia', 'Times New Roman', serif; background: #f5f5f5; margin: 0; padding: 20px; }
          .container { max-width: 600px; margin: 0 auto; background: white; border-radius: 16px; overflow: hidden; box-shadow: 0 10px 30px rgba(0,0,0,0.1); }
          .header { background: #0b3b5c; color: white; padding: 20px; text-align: center; }
          .header h1 { margin: 0; font-size: 24px; }
          .content { padding: 30px; }
          .info-table { width: 100%; border-collapse: collapse; margin: 20px 0; }
          .info-table td { padding: 12px; border-bottom: 1px solid #e0e0e0; }
          .info-table td:first-child { font-weight: bold; width: 40%; background: #f5f5f5; }
          .aviso { background: #fff3e0; border-left: 4px solid #ff9800; padding: 15px; margin: 20px 0; border-radius: 4px; }
          .footer { background: #f8f9fa; padding: 20px; text-align: center; font-size: 12px; color: #7f8c8d; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>\u{1F3A4} NOVO TERMO DE VOZ</h1>
            <p>Autoriza\xE7\xE3o de Uso de \xC1udio - B\xEDblia Online</p>
          </div>
          <div class="content">
            <h3>\u{1F4CB} Dados do Fiel</h3>
            <table class="info-table">
              <tr><td>Nome Completo:</td><td><strong>${data.nome}</strong></td></tr>
              <tr><td>CPF:</td><td>${data.cpf.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, "$1.$2.$3-$4")}</td></tr>
              <tr><td>E-mail:</td><td>${data.email}</td></tr>
              ${data.responsavelLegal ? `<tr><td>Respons\xE1vel Legal:</td><td>${data.responsavelLegal}</td></tr>` : ""}
              ${data.cpfResponsavel ? `<tr><td>CPF do Respons\xE1vel:</td><td>${data.cpfResponsavel.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, "$1.$2.$3-$4")}</td></tr>` : ""}
              <tr><td>Data do Aceite:</td><td>${dataFormatada} \xE0s ${horaFormatada}</td></tr>
              <tr><td>IP de Origem:</td><td>${data.ip || "N\xE3o dispon\xEDvel"}</td></tr>
              <tr><td>Protocolo:</td><td>${data.id}</td></tr>
            </table>
            
            <div class="aviso">
              <strong>\u26A0\uFE0F ATEN\xC7\xC3O SECRETARIA</strong><br>
              Este fiel autorizou o uso da sua voz para personaliza\xE7\xE3o da B\xEDblia Online.
              O termo assinado est\xE1 anexado abaixo para arquivamento.
            </div>
            
            <hr style="margin: 30px 0;">
            
            <h3>\u{1F4C4} Termo de Autoriza\xE7\xE3o</h3>
            ${htmlTermo}
          </div>
          <div class="footer">
            <p><strong>Santuario Nossa Senhora de Fatima</strong></p>
            <p>Rua Darwin, 651 - Santo Amaro, S\xE3o Paulo - SP</p>
          </div>
        </div>
      </body>
      </html>
    `;
    const emailsSecretaria = [
      "santuariodefatima@santuariodefatima.com.br",
      "pascom.santuario@outlook.com.br",
      "pascon@santuariodefatima.com.br"
    ];
    for (const email of emailsSecretaria) {
      await fetch("https://api.resend.com/emails", {
        method: "POST",
        headers: { "Authorization": `Bearer ${env.RESEND_API_KEY}`, "Content-Type": "application/json" },
        body: JSON.stringify({
          from: "Santuario de Fatima <noreply@mail.santuariodefatima.com.br>",
          to: [email],
          subject: `\u{1F3A4} Novo Termo de Voz - ${data.nome}`,
          html: emailHtml,
          reply_to: data.email
        })
      });
      console.log(`\u2705 Email do termo enviado para ${email}`);
    }
  } catch (error) {
    console.error("Erro ao enviar email para a secretaria:", error);
    throw error;
  }
}
__name(sendTermoEmailToSecretariat, "sendTermoEmailToSecretariat");

// src/routes/fiel/voz.js
async function contribuirVoz(request, env) {
  try {
    if (request.method === "OPTIONS") {
      return new Response(null, { status: 204, headers: corsHeaders() });
    }
    if (request.method !== "POST") {
      return jsonResponse({ success: false, error: "M\xE9todo n\xE3o permitido" }, 405);
    }
    const body = await request.json();
    const { audio, mimeType, livro, capitulo, versiculo, texto, apelido } = body;
    if (!audio || !livro || !capitulo || !versiculo || !texto) {
      return jsonResponse({
        success: false,
        error: "Campos obrigat\xF3rios: audio, livro, capitulo, versiculo, texto"
      }, 400);
    }
    let audioBuffer;
    try {
      const binaryString = atob(audio);
      const audioBytes = new Uint8Array(binaryString.length);
      for (let i = 0; i < binaryString.length; i++) {
        audioBytes[i] = binaryString.charCodeAt(i);
      }
      audioBuffer = audioBytes.buffer;
    } catch (e) {
      console.error("Erro ao decodificar base64:", e);
      return jsonResponse({
        success: false,
        error: "Erro ao processar arquivo de \xE1udio"
      }, 400);
    }
    const id = `${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const dataAtual = (/* @__PURE__ */ new Date()).toISOString();
    const nomeContribuinte = apelido?.trim() || "An\xF4nimo";
    const extension = mimeType?.split("/")[1] || "webm";
    const r2Key = `contribuicoes/${livro}/${capitulo}/${versiculo}/${id}.${extension}`;
    if (!env.R2_AUDIO) {
      console.error("\u274C R2_AUDIO n\xE3o configurado");
      return jsonResponse({
        success: false,
        error: "Servidor de \xE1udio n\xE3o configurado"
      }, 500);
    }
    try {
      await env.R2_AUDIO.put(r2Key, audioBuffer, {
        httpMetadata: {
          contentType: mimeType || "audio/webm",
          contentDisposition: `inline; filename="contribuicao_${livro}_${capitulo}_${versiculo}_${id}.${extension}"`
        },
        customMetadata: {
          livro,
          capitulo: capitulo.toString(),
          versiculo: versiculo.toString(),
          texto: texto.substring(0, 500),
          contribuinte: nomeContribuinte,
          data: dataAtual,
          id
        }
      });
      console.log(`\u{1F4BE} Grava\xE7\xE3o salva no R2: ${r2Key} (${Math.round(audioBuffer.byteLength / 1024)} KB)`);
    } catch (r2Error) {
      console.error("Erro ao salvar no R2:", r2Error);
      return jsonResponse({
        success: false,
        error: "Erro ao salvar grava\xE7\xE3o no servidor"
      }, 500);
    }
    return jsonResponse({
      success: true,
      message: "Grava\xE7\xE3o enviada com sucesso! Obrigado por contribuir.",
      id,
      data: dataAtual
    });
  } catch (error) {
    console.error("Erro em contribuirVoz:", error);
    return jsonResponse({
      success: false,
      error: "Erro interno no servidor: " + error.message
    }, 500);
  }
}
__name(contribuirVoz, "contribuirVoz");

// src/routes/fiel/versiculos.js
async function salvarVersiculo(request, env) {
  try {
    const body = await request.json();
    const { email, versiculo } = body;
    if (!email) return errorResponse("E-mail \xE9 obrigat\xF3rio", 400);
    if (!versiculo) return errorResponse("Vers\xEDculo \xE9 obrigat\xF3rio", 400);
    const db = env.DB;
    const now = (/* @__PURE__ */ new Date()).toISOString();
    const row = await db.prepare("SELECT versiculos FROM fiel_dados WHERE email = ?").bind(email).first();
    let lista = [];
    if (row?.versiculos) {
      try {
        lista = JSON.parse(row.versiculos);
      } catch {
        lista = [];
      }
    }
    const jaExiste = lista.some(
      (v) => v.id === versiculo.id || v.referencia === versiculo.referencia
    );
    if (!jaExiste) {
      lista.push({ ...versiculo, salvoEm: now });
    }
    if (row) {
      await db.prepare("UPDATE fiel_dados SET versiculos = ?, updated_at = ? WHERE email = ?").bind(JSON.stringify(lista), now, email).run();
    } else {
      await db.prepare(`
          INSERT INTO fiel_dados
            (email, musicas, versiculos, oracoes, fotos, termo_aceito, created_at, updated_at)
          VALUES (?, '[]', ?, '[]', '[]', 0, ?, ?)
        `).bind(email, JSON.stringify(lista), now, now).run();
    }
    return jsonResponse({ success: true, versiculos: lista });
  } catch (error) {
    console.error("Erro ao salvar vers\xEDculo:", error);
    return errorResponse("Erro ao salvar vers\xEDculo", 500);
  }
}
__name(salvarVersiculo, "salvarVersiculo");
async function buscarVersiculos(request, env) {
  try {
    const url = new URL(request.url);
    const email = url.searchParams.get("email");
    if (!email) return errorResponse("E-mail \xE9 obrigat\xF3rio", 400);
    const row = await env.DB.prepare("SELECT versiculos FROM fiel_dados WHERE email = ?").bind(email).first();
    let lista = [];
    if (row?.versiculos) {
      try {
        lista = JSON.parse(row.versiculos);
      } catch {
        lista = [];
      }
    }
    return jsonResponse({ success: true, versiculos: lista });
  } catch (error) {
    console.error("Erro ao buscar vers\xEDculos:", error);
    return errorResponse("Erro ao buscar vers\xEDculos", 500);
  }
}
__name(buscarVersiculos, "buscarVersiculos");

// src/routes/fiel/musicas.js
var YOUTUBE_API_KEY = "AIzaSyDAjMrZU6p-LUW_DxV9-LiY5-PQXtM5euY";
async function buscarMusicas(request, env) {
  const url = new URL(request.url);
  const query = url.searchParams.get("q");
  if (!query || query.trim() === "") {
    return jsonResponse({ success: false, error: "Digite o nome da m\xFAsica ou artista" }, 400);
  }
  try {
    const apiKey = env.YOUTUBE_API_KEY || YOUTUBE_API_KEY;
    const searchResponse = await fetch(
      `https://www.googleapis.com/youtube/v3/search?part=snippet&maxResults=12&q=${encodeURIComponent(query)}&type=video&videoCategoryId=10&key=${apiKey}`
    );
    const searchData = await searchResponse.json();
    if (searchData.error) {
      console.error("Erro na API do YouTube:", searchData.error);
      return jsonResponse({ success: false, error: searchData.error.message || "Erro na API do YouTube" }, 500);
    }
    if (!searchData.items || searchData.items.length === 0) {
      return jsonResponse({ success: false, error: "Nenhuma m\xFAsica encontrada" }, 404);
    }
    const videoIds = searchData.items.map((item) => item.id.videoId).join(",");
    const detailsResponse = await fetch(
      `https://www.googleapis.com/youtube/v3/videos?part=contentDetails,snippet&id=${videoIds}&key=${apiKey}`
    );
    const detailsData = await detailsResponse.json();
    const tracks = searchData.items.map((item) => {
      const detail = detailsData.items?.find((v) => v.id === item.id.videoId);
      const duration = detail?.contentDetails?.duration || "";
      let durationFormatted = "";
      if (duration) {
        const match = duration.match(/PT(\d+H)?(\d+M)?(\d+S)?/);
        const hours = (match?.[1] || "").replace("H", "");
        const minutes = (match?.[2] || "").replace("M", "");
        const seconds = (match?.[3] || "").replace("S", "");
        if (hours) {
          durationFormatted = `${hours}:${minutes.padStart(2, "0")}:${seconds.padStart(2, "0")}`;
        } else {
          durationFormatted = `${minutes.padStart(2, "0")}:${seconds.padStart(2, "0")}`;
        }
      }
      return {
        id: item.id.videoId,
        nome: item.snippet.title,
        artista: item.snippet.channelTitle,
        imagemUrl: item.snippet.thumbnails.high?.url || item.snippet.thumbnails.medium?.url,
        youtubeUrl: `https://www.youtube.com/watch?v=${item.id.videoId}`,
        previewUrl: `https://www.youtube.com/watch?v=${item.id.videoId}`,
        duracao: durationFormatted
      };
    });
    return jsonResponse({ success: true, tracks });
  } catch (error) {
    console.error("Erro ao buscar m\xFAsicas no YouTube:", error);
    return jsonResponse({ success: false, error: "Erro ao buscar m\xFAsicas" }, 500);
  }
}
__name(buscarMusicas, "buscarMusicas");

// src/routes/public/biblia.js
var BIBLIA_BASE_URL = "https://raw.githubusercontent.com/thiagobodruk/biblia/master/json/";
var BIBLIA_ARQUIVOS = {
  "gn": "01_genesis.json",
  "ex": "02_exodo.json",
  "lv": "03_levitico.json",
  "nm": "04_numeros.json",
  "dt": "05_deuteronomio.json",
  "js": "06_josue.json",
  "jz": "07_juizes.json",
  "rt": "08_rute.json",
  "1sm": "09_1_samuel.json",
  "2sm": "10_2_samuel.json",
  "1rs": "11_1_reis.json",
  "2rs": "12_2_reis.json",
  "1cr": "13_1_cronicas.json",
  "2cr": "14_2_cronicas.json",
  "ed": "15_esdras.json",
  "ne": "16_neemias.json",
  "et": "17_ester.json",
  "j\xF3": "18_jo.json",
  "sl": "19_salmos.json",
  "pv": "20_proverbios.json",
  "ec": "21_eclesiastes.json",
  "ct": "22_canticos.json",
  "is": "23_isaias.json",
  "jr": "24_jeremias.json",
  "lm": "25_lamentacoes.json",
  "ez": "26_ezequiel.json",
  "dn": "27_daniel.json",
  "os": "28_oseias.json",
  "jl": "29_joel.json",
  "am": "30_amos.json",
  "ob": "31_abdias.json",
  "jn": "32_jonas.json",
  "mq": "33_miqueias.json",
  "na": "34_naum.json",
  "hc": "35_habacuque.json",
  "sf": "36_sofonias.json",
  "ag": "37_ageu.json",
  "zc": "38_zacarias.json",
  "ml": "39_malaquias.json",
  "mt": "40_mateus.json",
  "mc": "41_marcos.json",
  "lc": "42_lucas.json",
  "jo": "43_joao.json",
  "at": "44_atos.json",
  "rm": "45_romanos.json",
  "1co": "46_1_corintios.json",
  "2co": "47_2_corintios.json",
  "gl": "48_galatas.json",
  "ef": "49_efesios.json",
  "fp": "50_filipenses.json",
  "cl": "51_colossenses.json",
  "1ts": "52_1_tessalonicenses.json",
  "2ts": "53_2_tessalonicenses.json",
  "1tm": "54_1_timoteo.json",
  "2tm": "55_2_timoteo.json",
  "tt": "56_tito.json",
  "fm": "57_filemon.json",
  "hb": "58_hebreus.json",
  "tg": "59_tiago.json",
  "1pe": "60_1_pedro.json",
  "2pe": "61_2_pedro.json",
  "1jo": "62_1_joao.json",
  "2jo": "63_2_joao.json",
  "3jo": "64_3_joao.json",
  "jd": "65_judas.json",
  "ap": "66_apocalipse.json"
};
async function handleBiblia(request, env) {
  const url = new URL(request.url);
  const abbrev = url.searchParams.get("livro")?.toLowerCase();
  const cap = parseInt(url.searchParams.get("capitulo") || "1");
  if (!abbrev) return jsonResponse2({ success: false, error: "Parametro livro obrigatorio" }, 400);
  const arquivo = BIBLIA_ARQUIVOS[abbrev];
  if (!arquivo) return jsonResponse2({ success: false, error: `Livro nao encontrado: ${abbrev}` }, 404);
  try {
    const cacheKey = `biblia:${abbrev}:${cap}`;
    if (env.KV_FILES) {
      const cached = await env.KV_FILES.get(cacheKey, "json");
      if (cached) return jsonResponse2({ ...cached, cached: true });
    }
    const res = await fetch(`${BIBLIA_BASE_URL}${arquivo}`, { headers: { "User-Agent": "SantuarioFatima/1.0" } });
    if (!res.ok) throw new Error(`GitHub ${res.status}`);
    const livro = await res.json();
    const chapters = livro.chapters || [];
    const capIdx = cap - 1;
    if (capIdx < 0 || capIdx >= chapters.length) return jsonResponse2({ success: false, error: `Capitulo ${cap} inexistente. Total: ${chapters.length}` }, 404);
    const verses = chapters[capIdx].map((t, i) => ({ number: i + 1, text: t }));
    const result = { success: true, livro: livro.name || abbrev, abbrev, capitulo: cap, totalCapitulos: chapters.length, verses };
    if (env.KV_FILES) await env.KV_FILES.put(cacheKey, JSON.stringify(result), { expirationTtl: 604800 });
    return jsonResponse2(result);
  } catch (e) {
    console.error("Erro biblia:", e);
    return jsonResponse2({ success: false, error: "Erro ao carregar capitulo. Tente novamente." }, 500);
  }
}
__name(handleBiblia, "handleBiblia");

// src/utils/totp.js
function base32Decode(base32) {
  const alphabet = "ABCDEFGHIJKLMNOPQRSTUVWXYZ234567";
  const clean = base32.toUpperCase().replace(/=+$/, "").replace(/\s/g, "");
  let bits = 0;
  let value = 0;
  const output = [];
  for (const char of clean) {
    const idx = alphabet.indexOf(char);
    if (idx === -1) continue;
    value = value << 5 | idx;
    bits += 5;
    if (bits >= 8) {
      output.push(value >>> bits - 8 & 255);
      bits -= 8;
    }
  }
  return new Uint8Array(output);
}
__name(base32Decode, "base32Decode");
async function generateTOTP(secret, timestamp = Date.now()) {
  try {
    const timeStep = Math.floor(timestamp / 1e3 / 30);
    const buffer = new ArrayBuffer(8);
    const view = new DataView(buffer);
    view.setUint32(4, timeStep >>> 0);
    const keyBytes = base32Decode(secret);
    const cryptoKey = await crypto.subtle.importKey(
      "raw",
      keyBytes,
      { name: "HMAC", hash: "SHA-1" },
      false,
      ["sign"]
    );
    const signature = await crypto.subtle.sign("HMAC", cryptoKey, buffer);
    const hmac = new Uint8Array(signature);
    const offset = hmac[hmac.length - 1] & 15;
    const binary = (hmac[offset] & 127) << 24 | (hmac[offset + 1] & 255) << 16 | (hmac[offset + 2] & 255) << 8 | hmac[offset + 3] & 255;
    const otp = binary % 1e6;
    return otp.toString().padStart(6, "0");
  } catch (err) {
    console.error("Erro ao gerar TOTP:", err);
    return null;
  }
}
__name(generateTOTP, "generateTOTP");
async function validateTOTP(secret, codigo) {
  try {
    if (!secret || !codigo) return false;
    if (!/^\d{6}$/.test(codigo)) return false;
    const now = Date.now();
    const windows = [-1, 0, 1];
    for (const delta of windows) {
      const expected = await generateTOTP(secret, now + delta * 3e4);
      if (expected === codigo) {
        return true;
      }
    }
    return false;
  } catch (err) {
    console.error("Erro ao validar TOTP:", err);
    return false;
  }
}
__name(validateTOTP, "validateTOTP");

// src/routes/auth/fiel_auth.js
async function createSession(env, user) {
  const rawToken = crypto.randomUUID();
  const tokenHash = await hashToken(rawToken);
  const expiresAt = Date.now() + 1e3 * 60 * 60 * 24 * 7;
  await env.DB.prepare(`
    UPDATE users 
    SET token_hash = ?, token_expires = ?
    WHERE id = ?
  `).bind(tokenHash, expiresAt, user.id).run();
  await env.KV_SESSION.put(`sess:${tokenHash}`, JSON.stringify({
    user: {
      id: user.id,
      nome: user.nome,
      email: user.email,
      role: user.role
    },
    expires: expiresAt
  }), {
    expirationTtl: 60 * 60 * 24 * 7
    // 7 dias
  });
  return { token: rawToken, expiresAt };
}
__name(createSession, "createSession");
async function verificarSenha2(senhaDigitada, senhaArmazenada) {
  if (!senhaArmazenada) return false;
  if (senhaDigitada === senhaArmazenada) return true;
  const hash = await sha256(senhaDigitada);
  return hash === senhaArmazenada;
}
__name(verificarSenha2, "verificarSenha");
function generatePIN() {
  return Math.floor(1e5 + Math.random() * 9e5).toString();
}
__name(generatePIN, "generatePIN");
function generateBackupCodes() {
  return Array.from(
    { length: 8 },
    () => crypto.randomUUID().replace(/-/g, "").slice(0, 8).toUpperCase()
  );
}
__name(generateBackupCodes, "generateBackupCodes");
function generateBase32Secret(length = 16) {
  const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ234567";
  let result = "";
  for (let i = 0; i < length; i++) {
    result += chars[Math.floor(Math.random() * chars.length)];
  }
  return result;
}
__name(generateBase32Secret, "generateBase32Secret");
async function sendEmail(env, to, subject, html) {
  if (!env.RESEND_API_KEY) {
    console.warn("\u26A0\uFE0F RESEND_API_KEY n\xE3o configurada");
    return;
  }
  try {
    await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: { "Authorization": `Bearer ${env.RESEND_API_KEY}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        from: "Santu\xE1rio de F\xE1tima <noreply@mail.santuariodefatima.com.br>",
        to: [to],
        subject,
        html
      })
    });
  } catch (e) {
    console.error("Erro ao enviar e-mail:", e);
  }
}
__name(sendEmail, "sendEmail");
async function ensureColumns(env) {
  const extras = [
    "login_pin TEXT",
    "login_pin_expires INTEGER",
    "token TEXT",
    "token_hash TEXT",
    "token_expires INTEGER",
    "backup_codes TEXT",
    "twofa_secret TEXT",
    "twofa_enabled INTEGER DEFAULT 0",
    "celular TEXT",
    "last_login_at TEXT",
    "failed_attempts INTEGER DEFAULT 0",
    "locked_until INTEGER DEFAULT 0"
  ];
  for (const col of extras) {
    try {
      await env.DB.prepare(`ALTER TABLE users ADD COLUMN ${col}`).run();
    } catch (_) {
    }
  }
}
__name(ensureColumns, "ensureColumns");
function validarCelular(celular) {
  const digits = celular?.replace(/\D/g, "") || "";
  return digits.length >= 10 && digits.length <= 11;
}
__name(validarCelular, "validarCelular");
function validarSenha(senha) {
  const checks = {
    length: senha.length >= 8,
    uppercase: /[A-Z]/.test(senha),
    lowercase: /[a-z]/.test(senha),
    number: /[0-9]/.test(senha),
    special: /[!@#$%^&*(),.?":{}|<>]/.test(senha)
  };
  const score = Object.values(checks).filter(Boolean).length;
  return { isValid: score >= 4, checks, score };
}
__name(validarSenha, "validarSenha");
async function fielLoginRoute(request, env) {
  await ensureColumns(env);
  if (!firewall(request)) {
    return new Response("Blocked", { status: 403 });
  }
  const allowed = await rateLimit(request, env);
  if (!allowed) {
    return new Response("Too many requests", { status: 429 });
  }
  try {
    const body = await request.json();
    const { email, senha } = body;
    console.log("\u{1F510} Login unificado - email:", email);
    if (!email || !senha) {
      return jsonResponse({ success: false, error: "Preencha todos os campos" });
    }
    const emailNorm = email.toLowerCase().trim();
    const user = await env.DB.prepare(
      `SELECT id, nome, email, senha_hash, role, twofa_enabled, twofa_secret,
              backup_codes, celular, failed_attempts, locked_until
       FROM users WHERE LOWER(email) = ?`
    ).bind(emailNorm).first();
    if (!user) {
      return jsonResponse({ success: false, error: "E-mail ou senha inv\xE1lidos" });
    }
    if (user.locked_until && user.locked_until > Date.now()) {
      const waitMinutes = Math.ceil((user.locked_until - Date.now()) / 6e4);
      return jsonResponse({ success: false, error: `Conta bloqueada. Tente novamente em ${waitMinutes} minutos.` });
    }
    const senhaOk = await verificarSenha2(senha, user.senha_hash);
    if (!senhaOk) {
      const newAttempts = (user.failed_attempts || 0) + 1;
      let lockUntil = 0;
      if (newAttempts >= 5) {
        lockUntil = Date.now() + 15 * 60 * 1e3;
      }
      await env.DB.prepare(
        `UPDATE users SET failed_attempts = ?, locked_until = ? WHERE id = ?`
      ).bind(newAttempts, lockUntil, user.id).run();
      return jsonResponse({ success: false, error: "E-mail ou senha inv\xE1lidos" });
    }
    await env.DB.prepare(
      `UPDATE users SET failed_attempts = 0, locked_until = 0 WHERE id = ?`
    ).bind(user.id).run();
    const pin = generatePIN();
    const pinExpiry = Date.now() + 10 * 60 * 1e3;
    await env.DB.prepare(
      `UPDATE users SET login_pin = ?, login_pin_expires = ?, last_login_at = ? WHERE id = ?`
    ).bind(pin, pinExpiry, (/* @__PURE__ */ new Date()).toISOString(), user.id).run();
    const nome = user.nome || "Usu\xE1rio";
    await sendEmail(env, user.email, "Seu c\xF3digo de acesso - Santu\xE1rio de F\xE1tima", `
      <div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;">
        <div style="background:#0d2a5c;padding:20px;text-align:center;">
          <h2 style="color:white;margin:0;">\u{1F510} C\xF3digo de Acesso</h2>
        </div>
        <div style="padding:24px;">
          <p>Ol\xE1 <strong>${nome}</strong>,</p>
          <p>Seu c\xF3digo de verifica\xE7\xE3o \xE9: <strong style="font-size:24px">${pin}</strong></p>
          <p>V\xE1lido por <strong>10 minutos</strong>.</p>
        </div>
      </div>
    `);
    return jsonResponse({
      success: true,
      nextStep: "pin",
      userId: user.id,
      email: user.email,
      nome,
      role: user.role,
      isAdmin: user.role === "admin",
      has2FA: user.twofa_enabled === 1 || !!user.twofa_secret
    });
  } catch (err) {
    console.error("\u274C fielLoginRoute:", err);
    return jsonResponse({ success: false, error: "Erro interno: " + err.message }, 500);
  }
}
__name(fielLoginRoute, "fielLoginRoute");
async function fielVerificarRoute(request, env) {
  try {
    const authHeader = request.headers.get("Authorization");
    const token = authHeader?.replace("Bearer ", "");
    console.log("\u{1F50D} Verificando token:", token ? "Token presente" : "Token ausente");
    if (!token) {
      return jsonResponse({ success: false, error: "Token n\xE3o fornecido" }, 401);
    }
    const hash = await sha256(token);
    const sessionData = await env.KV_SESSION.get(`sess:${hash}`, "json");
    if (!sessionData || sessionData.expires < Date.now()) {
      console.log("\u274C Token inv\xE1lido ou expirado");
      return jsonResponse({ success: false, error: "Token inv\xE1lido ou expirado" }, 401);
    }
    console.log("\u2705 Token v\xE1lido para:", sessionData.user.email, "Role:", sessionData.user.role);
    return jsonResponse({
      success: true,
      user: sessionData.user
    });
  } catch (err) {
    console.error("\u274C fielVerificarRoute:", err);
    return jsonResponse({ success: false, error: "Erro interno: " + err.message }, 500);
  }
}
__name(fielVerificarRoute, "fielVerificarRoute");
async function fielVerifyPinRoute(request, env) {
  try {
    const body = await request.json();
    const { userId, pin, celular } = body;
    console.log("\u{1F510} Verificando PIN - userId:", userId);
    if (!userId || !pin) {
      return jsonResponse({ success: false, error: "Dados incompletos" });
    }
    const user = await env.DB.prepare(
      `SELECT id, nome, email, login_pin, login_pin_expires, twofa_enabled, twofa_secret, role
       FROM users WHERE id = ?`
    ).bind(userId).first();
    if (!user) {
      return jsonResponse({ success: false, error: "Usu\xE1rio n\xE3o encontrado" });
    }
    if (!user.login_pin) {
      return jsonResponse({ success: false, error: "Nenhum PIN ativo. Solicite um novo." });
    }
    if (Date.now() > user.login_pin_expires) {
      return jsonResponse({ success: false, error: "PIN expirado. Solicite um novo." });
    }
    if (user.login_pin !== pin) {
      return jsonResponse({ success: false, error: "PIN inv\xE1lido" });
    }
    await env.DB.prepare(
      `UPDATE users SET login_pin = NULL, login_pin_expires = NULL WHERE id = ?`
    ).bind(user.id).run();
    if (celular && validarCelular(celular)) {
      await env.DB.prepare(
        `UPDATE users SET celular = ? WHERE id = ? AND (celular IS NULL OR celular = '')`
      ).bind(celular.replace(/\D/g, ""), user.id).run();
    }
    console.log("\u2705 PIN verificado para:", user.email);
    if (user.twofa_secret) {
      return jsonResponse({
        success: true,
        nextStep: "2fa-verify",
        userId: user.id,
        role: user.role,
        isAdmin: user.role === "admin"
      });
    }
    const secretKey = generateBase32Secret();
    const issuer = "SantuarioFatima";
    const label = `${issuer}:${user.email}`;
    const otpauth = `otpauth://totp/${encodeURIComponent(label)}?secret=${secretKey}&issuer=${issuer}`;
    const qrCodeUrl = "https://chart.googleapis.com/chart?chs=200x200&cht=qr&chl=" + encodeURIComponent(otpauth);
    const backupCodes = generateBackupCodes();
    const hashedBackupCodes = await Promise.all(backupCodes.map((c) => sha256(c)));
    await env.DB.prepare(
      `UPDATE users SET twofa_secret = ?, backup_codes = ? WHERE id = ?`
    ).bind(secretKey, JSON.stringify(hashedBackupCodes), user.id).run();
    return jsonResponse({
      success: true,
      nextStep: "2fa-setup",
      userId: user.id,
      nome: user.nome,
      email: user.email,
      role: user.role,
      isAdmin: user.role === "admin",
      qrCodeUrl,
      secretKey,
      backupCodes
    });
  } catch (err) {
    console.error("\u274C fielVerifyPinRoute:", err);
    return jsonResponse({ success: false, error: "Erro interno: " + err.message }, 500);
  }
}
__name(fielVerifyPinRoute, "fielVerifyPinRoute");
async function fielReenviarPinRoute(request, env) {
  try {
    const body = await request.json();
    const { userId } = body;
    const user = await env.DB.prepare(
      `SELECT id, nome, email FROM users WHERE id = ?`
    ).bind(userId).first();
    if (!user) {
      return jsonResponse({ success: false, error: "Usu\xE1rio n\xE3o encontrado" });
    }
    const pin = generatePIN();
    const expiry = Date.now() + 10 * 60 * 1e3;
    await env.DB.prepare(
      `UPDATE users SET login_pin = ?, login_pin_expires = ? WHERE id = ?`
    ).bind(pin, expiry, userId).run();
    await sendEmail(env, user.email, "Novo c\xF3digo de acesso - Santu\xE1rio de F\xE1tima", `
      <div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;">
        <div style="background:#0d2a5c;padding:20px;text-align:center;">
          <h2 style="color:white;margin:0;">\u{1F504} Novo C\xF3digo de Acesso</h2>
        </div>
        <div style="padding:24px;">
          <p>Ol\xE1 <strong>${user.nome}</strong>,</p>
          <p>Seu novo c\xF3digo \xE9: <strong style="font-size:24px">${pin}</strong></p>
          <p>V\xE1lido por <strong>10 minutos</strong>.</p>
        </div>
      </div>
    `);
    return jsonResponse({ success: true, message: "Novo PIN enviado!" });
  } catch (err) {
    console.error("\u274C fielReenviarPinRoute:", err);
    return jsonResponse({ success: false, error: "Erro interno: " + err.message }, 500);
  }
}
__name(fielReenviarPinRoute, "fielReenviarPinRoute");
async function fielVerify2faRoute(request, env) {
  try {
    const body = await request.json();
    const { userId, codigo2FA } = body;
    console.log("\u{1F510} Verificando 2FA - userId:", userId, "codigo:", codigo2FA);
    if (!codigo2FA || !/^\d{6}$/.test(codigo2FA)) {
      return jsonResponse({ success: false, error: "C\xF3digo de 6 d\xEDgitos obrigat\xF3rio" });
    }
    const user = await env.DB.prepare(
      `SELECT id, nome, email, twofa_secret, twofa_enabled, role FROM users WHERE id = ?`
    ).bind(userId).first();
    if (!user) {
      return jsonResponse({ success: false, error: "Usu\xE1rio n\xE3o encontrado" });
    }
    if (!user.twofa_secret) {
      return jsonResponse({ success: false, error: "2FA n\xE3o configurado" });
    }
    const valid = await validateTOTP(user.twofa_secret, codigo2FA);
    if (!valid) {
      console.log("\u274C C\xF3digo 2FA inv\xE1lido para:", user.email);
      return jsonResponse({ success: false, error: "C\xF3digo 2FA inv\xE1lido" });
    }
    console.log("\u2705 2FA verificado com sucesso para:", user.email);
    const role = user.role || "fiel";
    const { token, expiresAt } = await createSession(env, user);
    await env.DB.prepare(
      `UPDATE users SET twofa_enabled = 1 WHERE id = ?`
    ).bind(user.id).run();
    const redirectTo = role === "admin" ? "/paineladmin" : "/paineldofiel";
    return jsonResponse({
      success: true,
      token,
      expiresAt,
      user: {
        id: user.id,
        nome: user.nome,
        email: user.email,
        role
      },
      redirectTo,
      isAdmin: role === "admin"
    });
  } catch (err) {
    console.error("\u274C fielVerify2faRoute:", err);
    return jsonResponse({ success: false, error: "Erro interno: " + err.message }, 500);
  }
}
__name(fielVerify2faRoute, "fielVerify2faRoute");
async function fielEsqueciSenhaRoute(request, env) {
  try {
    const body = await request.json();
    const { email } = body;
    if (!email) return jsonResponse({ success: false, error: "E-mail obrigat\xF3rio" });
    const emailNorm = email.toLowerCase().trim();
    await ensureColumns(env);
    const user = await env.DB.prepare(
      "SELECT id, nome FROM users WHERE LOWER(email) = ?"
    ).bind(emailNorm).first();
    if (!user) {
      return jsonResponse({ success: true, message: "Se o e-mail estiver cadastrado, voc\xEA receber\xE1 o link." });
    }
    const token = crypto.randomUUID();
    const expiresAt = Date.now() + 60 * 60 * 1e3;
    await env.DB.prepare(`
      CREATE TABLE IF NOT EXISTS reset_tokens (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id TEXT NOT NULL,
        token TEXT NOT NULL,
        expires_at INTEGER NOT NULL,
        used INTEGER DEFAULT 0,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `).run();
    await env.DB.prepare("DELETE FROM reset_tokens WHERE user_id = ?").bind(user.id).run();
    await env.DB.prepare(
      "INSERT INTO reset_tokens (user_id, token, expires_at) VALUES (?, ?, ?)"
    ).bind(user.id, token, expiresAt).run();
    const host = new URL(request.url).hostname;
    const baseUrl = host === "localhost" || host === "127.0.0.1" ? "http://localhost:5173" : "https://santuariodefatima.com.br";
    const link = `${baseUrl}/minha-conta?reset_token=${token}&userId=${user.id}`;
    await sendEmail(env, user.email, "\u{1F511} Recupera\xE7\xE3o de Senha - Santu\xE1rio de F\xE1tima", `
      <div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;">
        <div style="background:#0d2a5c;padding:20px;text-align:center;">
          <h2 style="color:white;margin:0;">\u{1F511} Redefini\xE7\xE3o de Senha</h2>
        </div>
        <div style="padding:24px;">
          <p>Ol\xE1 <strong>${user.nome}</strong>,</p>
          <p>Clique no bot\xE3o abaixo para criar uma nova senha:</p>
          <div style="text-align:center;margin:32px 0;">
            <a href="${link}" style="background:#0d2a5c;color:white;padding:12px 24px;text-decoration:none;border-radius:8px;">Redefinir minha senha</a>
          </div>
          <p>\u23F1\uFE0F V\xE1lido por <strong>1 hora</strong>.</p>
        </div>
      </div>
    `);
    return jsonResponse({ success: true, message: "Link enviado para seu e-mail!" });
  } catch (err) {
    console.error("\u274C fielEsqueciSenhaRoute:", err);
    return jsonResponse({ success: false, error: "Erro interno: " + err.message }, 500);
  }
}
__name(fielEsqueciSenhaRoute, "fielEsqueciSenhaRoute");
async function fielConfirmarResetSenhaRoute(request, env) {
  try {
    const body = await request.json();
    const { token, novaSenha, userId } = body;
    if (!token || !novaSenha || !userId) {
      return jsonResponse({ success: false, error: "Dados incompletos" });
    }
    const record = await env.DB.prepare(
      "SELECT * FROM reset_tokens WHERE token = ? AND used = 0"
    ).bind(token).first();
    if (!record) return jsonResponse({ success: false, error: "Token inv\xE1lido ou j\xE1 utilizado" });
    if (record.user_id !== userId) return jsonResponse({ success: false, error: "Token inv\xE1lido" });
    if (Date.now() > record.expires_at) {
      await env.DB.prepare("DELETE FROM reset_tokens WHERE token = ?").bind(token).run();
      return jsonResponse({ success: false, error: "Token expirado" });
    }
    const senhaValidation = validarSenha(novaSenha);
    if (!senhaValidation.isValid) {
      return jsonResponse({ success: false, error: "Senha fraca. Use mai\xFAsculas, min\xFAsculas, n\xFAmeros e caracteres especiais." });
    }
    const senha_hash = await sha256(novaSenha);
    await env.DB.prepare(
      `UPDATE users SET senha_hash = ?, updated_at = ? WHERE id = ?`
    ).bind(senha_hash, (/* @__PURE__ */ new Date()).toISOString(), userId).run();
    await env.DB.prepare("DELETE FROM reset_tokens WHERE token = ?").bind(token).run();
    return jsonResponse({ success: true, message: "Senha redefinida com sucesso!" });
  } catch (err) {
    console.error("\u274C fielConfirmarResetSenhaRoute:", err);
    return jsonResponse({ success: false, error: "Erro interno: " + err.message }, 500);
  }
}
__name(fielConfirmarResetSenhaRoute, "fielConfirmarResetSenhaRoute");
async function fielReset2faBackupRoute(request, env) {
  try {
    const body = await request.json();
    const { email, backupCode } = body;
    const emailNorm = email.toLowerCase().trim();
    await ensureColumns(env);
    const user = await env.DB.prepare(
      "SELECT id, backup_codes FROM users WHERE LOWER(email) = ?"
    ).bind(emailNorm).first();
    if (!user) return jsonResponse({ success: false, error: "Usu\xE1rio n\xE3o encontrado" });
    const hashed = await sha256(backupCode.toUpperCase());
    const stored = JSON.parse(user.backup_codes || "[]");
    if (!stored.includes(hashed)) {
      return jsonResponse({ success: false, error: "C\xF3digo de backup inv\xE1lido" });
    }
    const updated = stored.filter((c) => c !== hashed);
    await env.DB.prepare(
      `UPDATE users SET twofa_enabled = 0, twofa_secret = NULL, backup_codes = ? WHERE id = ?`
    ).bind(JSON.stringify(updated), user.id).run();
    return jsonResponse({ success: true, message: "2FA removido! Configure novamente no pr\xF3ximo login." });
  } catch (err) {
    console.error("\u274C fielReset2faBackupRoute:", err);
    return jsonResponse({ success: false, error: "Erro interno: " + err.message }, 500);
  }
}
__name(fielReset2faBackupRoute, "fielReset2faBackupRoute");
async function fielSolicitarReset2faRoute(request, env) {
  try {
    const body = await request.json();
    const { email } = body;
    const emailNorm = email.toLowerCase().trim();
    await ensureColumns(env);
    const user = await env.DB.prepare(
      "SELECT id, nome FROM users WHERE LOWER(email) = ?"
    ).bind(emailNorm).first();
    if (!user) return jsonResponse({ success: false, error: "Usu\xE1rio n\xE3o encontrado" });
    const token = crypto.randomUUID();
    const expiresAt = Date.now() + 10 * 60 * 1e3;
    await env.DB.prepare(`
      CREATE TABLE IF NOT EXISTS two_factor_reset_tokens (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id TEXT NOT NULL,
        token TEXT NOT NULL,
        expires_at INTEGER NOT NULL,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `).run();
    await env.DB.prepare("DELETE FROM two_factor_reset_tokens WHERE user_id = ?").bind(user.id).run();
    await env.DB.prepare(
      "INSERT INTO two_factor_reset_tokens (user_id, token, expires_at) VALUES (?, ?, ?)"
    ).bind(user.id, token, expiresAt).run();
    const host = new URL(request.url).hostname;
    const baseUrl = host === "localhost" || host === "127.0.0.1" ? "http://localhost:5173" : "https://santuariodefatima.com.br";
    const link = `${baseUrl}/minha-conta?reset2fa=${token}`;
    await sendEmail(env, email, "\u{1F510} Recupera\xE7\xE3o de 2FA - Santu\xE1rio de F\xE1tima", `
      <div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;">
        <div style="background:#0d2a5c;padding:20px;text-align:center;">
          <h2 style="color:white;margin:0;">\u{1F510} Recupera\xE7\xE3o de 2FA</h2>
        </div>
        <div style="padding:24px;">
          <p>Ol\xE1 <strong>${user.nome}</strong>,</p>
          <p>Clique abaixo para remover o 2FA da sua conta:</p>
          <div style="text-align:center;margin:24px 0;">
            <a href="${link}" style="background:#0d2a5c;color:white;padding:12px 24px;text-decoration:none;border-radius:8px;">Remover 2FA</a>
          </div>
          <p>\u23F1\uFE0F V\xE1lido por <strong>10 minutos</strong>.</p>
        </div>
      </div>
    `);
    return jsonResponse({ success: true, message: "Link enviado para seu e-mail!" });
  } catch (err) {
    console.error("\u274C fielSolicitarReset2faRoute:", err);
    return jsonResponse({ success: false, error: "Erro interno: " + err.message }, 500);
  }
}
__name(fielSolicitarReset2faRoute, "fielSolicitarReset2faRoute");
async function fielConfirmarReset2faRoute(request, env) {
  try {
    const body = await request.json();
    const { token } = body;
    const record = await env.DB.prepare(
      "SELECT * FROM two_factor_reset_tokens WHERE token = ?"
    ).bind(token).first();
    if (!record) return jsonResponse({ success: false, error: "Token inv\xE1lido" });
    if (Date.now() > record.expires_at) {
      await env.DB.prepare("DELETE FROM two_factor_reset_tokens WHERE token = ?").bind(token).run();
      return jsonResponse({ success: false, error: "Token expirado" });
    }
    await env.DB.prepare(
      `UPDATE users SET twofa_enabled = 0, twofa_secret = NULL WHERE id = ?`
    ).bind(record.user_id).run();
    await env.DB.prepare("DELETE FROM two_factor_reset_tokens WHERE token = ?").bind(token).run();
    return jsonResponse({ success: true, message: "2FA removido! Configure novamente no pr\xF3ximo login." });
  } catch (err) {
    console.error("\u274C fielConfirmarReset2faRoute:", err);
    return jsonResponse({ success: false, error: "Erro interno: " + err.message }, 500);
  }
}
__name(fielConfirmarReset2faRoute, "fielConfirmarReset2faRoute");

// src/routes/r2.js
async function handleUploadImagem(request, env) {
  try {
    const formData = await request.formData();
    const file = formData.get("imagem");
    const tipo = formData.get("tipo") || "geral";
    const subpasta = formData.get("subpasta") || "";
    if (!file) {
      return new Response(JSON.stringify({ error: "Nenhuma imagem enviada" }), { status: 400 });
    }
    if (file.size > 10 * 1024 * 1024) {
      return new Response(JSON.stringify({ error: "Arquivo muito grande. M\xE1ximo 10MB" }), { status: 400 });
    }
    const extensao = file.name.split(".").pop()?.toLowerCase() || "png";
    const contentType = file.type || `image/${extensao === "jpg" ? "jpeg" : extensao}`;
    const timestamp = Date.now();
    const randomId = Math.random().toString(36).substring(7);
    const nomeArquivo = `${timestamp}-${randomId}.${extensao}`;
    let path = tipo;
    if (subpasta) path += `/${subpasta}`;
    if (tipo === "momentos") path += `/${(/* @__PURE__ */ new Date()).getFullYear()}`;
    path += `/${nomeArquivo}`;
    console.log(`\u{1F4E4} Uploading to R2: ${path}`);
    const buffer = await file.arrayBuffer();
    await env.R2_IMAGENS.put(path, buffer, {
      httpMetadata: {
        contentType,
        cacheControl: "public, max-age=31536000",
        contentDisposition: "inline"
      },
      customMetadata: {
        originalName: file.name,
        uploadedAt: (/* @__PURE__ */ new Date()).toISOString(),
        type: tipo
      }
    });
    const origin = env.ENVIRONMENT === "production" ? "https://santuariodefatima.oibreccio.workers.dev" : "https://santuariodefatima.oibreccio.workers.dev";
    const url = `${origin}/r2/${path}`;
    return new Response(JSON.stringify({
      success: true,
      url,
      path,
      size: file.size,
      type: contentType,
      originalName: file.name
    }), {
      status: 200,
      headers: { "Content-Type": "application/json" }
    });
  } catch (error) {
    console.error("\u274C Erro no upload:", error);
    return new Response(JSON.stringify({ error: error.message }), { status: 500 });
  }
}
__name(handleUploadImagem, "handleUploadImagem");
async function handleGetImagem(request, env, pathname) {
  try {
    const imagePath = pathname.replace("/r2/", "");
    const object = await env.R2_IMAGENS.get(imagePath);
    if (!object) {
      return new Response("Imagem n\xE3o encontrada", { status: 404 });
    }
    const headers = new Headers();
    headers.set("Content-Type", object.httpMetadata?.contentType || "image/jpeg");
    headers.set("Cache-Control", "public, max-age=86400");
    if (object.etag) headers.set("ETag", object.etag);
    return new Response(object.body, { headers });
  } catch (error) {
    console.error("\u274C Erro ao servir imagem:", error);
    return new Response("Erro ao carregar imagem", { status: 500 });
  }
}
__name(handleGetImagem, "handleGetImagem");
async function handleListImagens(request, env) {
  try {
    const url = new URL(request.url);
    const prefix = url.searchParams.get("prefix") || "";
    const objects = await env.R2_IMAGENS.list({ prefix });
    const imagens = objects.objects.map((obj) => ({
      key: obj.key,
      size: obj.size,
      uploaded: obj.uploaded,
      url: `${new URL(request.url).origin}/r2/${obj.key}`
    }));
    return new Response(JSON.stringify({ success: true, images: imagens }), { status: 200 });
  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), { status: 500 });
  }
}
__name(handleListImagens, "handleListImagens");
async function handleDeleteImagem(request, env) {
  try {
    const { path } = await request.json();
    await env.R2_IMAGENS.delete(path);
    return new Response(JSON.stringify({ success: true, message: "Imagem deletada com sucesso" }), { status: 200 });
  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), { status: 500 });
  }
}
__name(handleDeleteImagem, "handleDeleteImagem");

// index.js
function formatTimeAgo(isoDate) {
  const diff = Date.now() - new Date(isoDate).getTime();
  const m = Math.floor(diff / 6e4);
  if (m < 1) return "agora";
  if (m < 60) return `h\xE1 ${m} min`;
  const h = Math.floor(m / 60);
  if (h < 24) return `h\xE1 ${h}h`;
  return `h\xE1 ${Math.floor(h / 24)}d`;
}
__name(formatTimeAgo, "formatTimeAgo");
function getClientIP(request) {
  return request.headers.get("CF-Connecting-IP") || request.headers.get("X-Forwarded-For")?.split(",")[0] || request.headers.get("X-Real-IP") || "unknown";
}
__name(getClientIP, "getClientIP");
function logStructured(level, message, data = {}) {
  const logEntry = {
    level,
    message,
    timestamp: (/* @__PURE__ */ new Date()).toISOString(),
    requestId: data.requestId || "unknown",
    ...data
  };
  if (level === "error") {
    console.error(JSON.stringify(logEntry));
  } else if (level === "warn") {
    console.warn(JSON.stringify(logEntry));
  } else {
    console.log(JSON.stringify(logEntry));
  }
}
__name(logStructured, "logStructured");
async function getInstagramToken(env) {
  let token = await env.KV_INSTAGRAM?.get("current_token");
  if (!token) {
    token = env.INSTAGRAM_ACCESS_TOKEN;
    if (token && env.KV_INSTAGRAM) {
      await env.KV_INSTAGRAM.put("current_token", token);
      logStructured("info", "Token salvo no KV_INSTAGRAM", { motivo: "manual_initial" });
      await registrarHistoricoToken(env, token, "manual_initial");
    }
  }
  return token;
}
__name(getInstagramToken, "getInstagramToken");
async function registrarHistoricoToken(env, token, motivo) {
  if (!env.KV_INSTAGRAM_TOKEN) return;
  const tokenPreview = token ? token.substring(0, 8) + "..." : "NO_TOKEN";
  const historico = {
    token: tokenPreview,
    motivo,
    data: (/* @__PURE__ */ new Date()).toISOString()
  };
  const id = `token_${Date.now()}`;
  await env.KV_INSTAGRAM_TOKEN.put(id, JSON.stringify(historico));
  const listaTokens = await env.KV_INSTAGRAM_TOKEN.get("token_history_list", "json") || [];
  listaTokens.unshift({ id, data: historico.data, motivo, tokenPreview });
  const limitedList = listaTokens.slice(0, 20);
  await env.KV_INSTAGRAM_TOKEN.put("token_history_list", JSON.stringify(limitedList));
  logStructured("info", "Hist\xF3rico registrado", { motivo, data: historico.data });
}
__name(registrarHistoricoToken, "registrarHistoricoToken");
async function refreshInstagramToken(env, motivo = "auto_refresh") {
  const tokenAtual = await getInstagramToken(env);
  if (!tokenAtual) {
    logStructured("error", "Nenhum token encontrado para renovar");
    return null;
  }
  const refreshUrl = `https://graph.facebook.com/v22.0/refresh_access_token?grant_type=ig_refresh_token&access_token=${tokenAtual}`;
  try {
    logStructured("info", "Renovando token do Instagram");
    const response = await fetchWithTimeout(refreshUrl, {}, 1e4);
    const data = await response.json();
    if (data.access_token) {
      await env.KV_INSTAGRAM.put("current_token", data.access_token);
      const expiresInDays = Math.round(data.expires_in / 86400);
      await env.KV_INSTAGRAM.put("token_expires_at", String(Date.now() + data.expires_in * 1e3));
      await env.KV_INSTAGRAM.put("last_refresh", (/* @__PURE__ */ new Date()).toISOString());
      await registrarHistoricoToken(env, data.access_token, motivo);
      logStructured("info", "Token renovado com sucesso", { expiresInDays });
      return data.access_token;
    } else {
      logStructured("error", "Falha na renova\xE7\xE3o", { error: data });
      await registrarHistoricoToken(env, "FAILED", `${motivo}_failed`);
      return null;
    }
  } catch (error) {
    logStructured("error", "Erro na renova\xE7\xE3o", { error: error.message });
    return null;
  }
}
__name(refreshInstagramToken, "refreshInstagramToken");
async function getInstagramFeed(env, retry = false) {
  const IG_ID = env.INSTAGRAM_BUSINESS_ACCOUNT_ID;
  const TOKEN = await getInstagramToken(env);
  if (!IG_ID || !TOKEN) {
    logStructured("error", "Instagram: ID ou Token n\xE3o configurado");
    return [];
  }
  const url = `https://graph.facebook.com/v22.0/${IG_ID}/media?fields=id,caption,media_url,permalink,timestamp&access_token=${TOKEN}`;
  try {
    logStructured("info", "Buscando feed do Instagram");
    const res = await fetchWithTimeout(url, {}, 8e3);
    const json = await res.json();
    if (json.error) {
      logStructured("error", "Erro na API do Instagram", { error: json.error });
      if (!retry && json.error.code === 190 && json.error.error_subcode === 463) {
        logStructured("warn", "Token expirado, tentando renovar");
        const novoToken = await refreshInstagramToken(env, "expired_renew");
        if (novoToken) {
          return getInstagramFeed(env, true);
        }
      }
      return [];
    }
    let data = json.data || [];
    data.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
    const unique = [];
    const seen = /* @__PURE__ */ new Set();
    for (const post of data) {
      if (!seen.has(post.id)) {
        seen.add(post.id);
        unique.push(post);
      }
    }
    const finalPosts = unique.slice(0, 6);
    logStructured("info", "Instagram feed obtido", { count: finalPosts.length });
    return finalPosts;
  } catch (err) {
    logStructured("error", "Erro Instagram", { error: err.message });
    return [];
  }
}
__name(getInstagramFeed, "getInstagramFeed");
var PUBLIC_ROUTES = /* @__PURE__ */ new Set([
  "/api/auth/login",
  "/api/auth/register",
  "/api/auth/esqueci-senha",
  "/api/auth/confirmar-reset-senha",
  "/api/auth/solicitar-reset-2fa",
  "/api/auth/confirmar-reset-2fa",
  "/api/liturgia",
  "/api/terco/hoje",
  "/api/vatican-news",
  "/api/youtube",
  "/api/instagram",
  "/api/diocese-news",
  "/api/horarios",
  "/api/candle-lighting",
  "/api/prayer",
  "/api/contato/enviar",
  "/api/contato/pascom/enviar",
  "/api/dados",
  "/api/biblia",
  "/api/health",
  "/",
  "/api"
]);
var AUTH_ROUTES_SET = /* @__PURE__ */ new Set([
  "/api/auth/verificar",
  "/api/auth/verify-pin",
  "/api/auth/reenviar-pin",
  "/api/auth/setup-2fa",
  "/api/auth/verify-2fa",
  "/api/auth/reset-2fa-backup",
  "/api/fiel/dados",
  "/api/fiel/salvar",
  "/api/fiel/perfil",
  "/api/fiel/pastorais",
  "/api/fiel/termo-voz",
  "/api/fiel/contribuir-voz",
  "/api/fiel/versiculos",
  "/api/fiel/buscar-musicas",
  "/api/fiel/health"
]);
var ADMIN_ROUTES_SET = /* @__PURE__ */ new Set([
  "/api/admin/verificar",
  "/api/admin/dados",
  "/api/admin/perfil",
  "/api/admin/alterar-senha",
  "/api/admin/youtube-live",
  "/api/admin/backup",
  "/api/admin/refresh-instagram-token",
  "/api/admin/instagram-token-status",
  "/api/admin/instagram-token-history"
]);
var index_default = {
  async fetch(request, env, ctx) {
    const requestId = createRequestId();
    const url = new URL(request.url);
    const pathname = url.pathname.trim();
    const clientIP = getClientIP(request);
    const userAgent = request.headers.get("User-Agent") || "unknown";
    logStructured("info", "Request recebida", { requestId, method: request.method, pathname, ip: clientIP });
    const corsResponse = handleCorsOptions(request);
    if (corsResponse) return corsResponse;
    const payloadError = validatePayloadSize(request);
    if (payloadError) return addCorsHeaders(payloadError, request);
    const rateConfig = getRateLimitConfig(pathname);
    const identifier = clientIP;
    const rateAllowed = await rateLimit(identifier, env, rateConfig.limit, rateConfig.window);
    if (!rateAllowed) {
      await logAttack(env, {
        type: "rate_limit_early",
        ip: clientIP,
        path: pathname,
        requestId
      });
      const response = jsonResponse({ success: false, error: "Muitas requisi\xE7\xF5es. Aguarde um momento." }, 429);
      return addCorsHeaders(addSecurityHeaders(response), request);
    }
    let context = {
      request,
      env,
      ip: clientIP,
      url,
      pathname,
      body: null,
      requestId
    };
    try {
      const wafBlock = await waf(context);
      if (wafBlock) {
        await logAttack(env, {
          type: "waf",
          ip: clientIP,
          path: pathname,
          userAgent,
          requestId
        });
        return addCorsHeaders(addSecurityHeaders(wafBlock), request);
      }
      const ipRep = await checkIPReputation(clientIP, env);
      if (ipRep?.blocked) {
        await logAttack(env, {
          type: "ip_reputation",
          ip: clientIP,
          path: pathname,
          userAgent,
          requestId
        });
        const response2 = jsonResponse({ success: false, error: "IP bloqueado" }, 403);
        return addCorsHeaders(addSecurityHeaders(response2), request);
      }
      const firewallAllowed = firewall(request || {});
      if (!firewallAllowed) {
        await logAttack(env, {
          type: "firewall",
          ip: clientIP,
          path: pathname,
          userAgent,
          requestId
        });
        return addCorsHeaders(
          addSecurityHeaders(new Response("Blocked by firewall", { status: 403 })),
          request
        );
      }
      const isBot = detectBot(request);
      if (isBot) {
        await logAttack(env, {
          type: "bot",
          ip: clientIP,
          path: pathname,
          userAgent,
          requestId
        });
        return addCorsHeaders(
          addSecurityHeaders(new Response("Bot detectado", { status: 403 })),
          request
        );
      }
      const fp = await fingerprint(context);
      context.fingerprint = fp;
      const risk = await riskEngine(context);
      context.risk = risk;
      if (risk?.score > 50 || risk?.requiresCaptcha) {
        const captchaOk = await verifyCaptcha(context);
        if (!captchaOk) {
          await logAttack(env, {
            type: "captcha_failed",
            ip: clientIP,
            path: pathname,
            fingerprint: fp,
            risk: risk?.score,
            requestId
          });
          const response2 = jsonResponse({ success: false, error: "Captcha obrigat\xF3rio" }, 403);
          return addCorsHeaders(addSecurityHeaders(response2), request);
        }
      }
      let user = null;
      const isPublicRoute = PUBLIC_ROUTES.has(pathname);
      const isAuthRoute = AUTH_ROUTES_SET.has(pathname);
      const isAdminRoute = ADMIN_ROUTES_SET.has(pathname);
      const needsBody = ["POST", "PUT", "PATCH"].includes(request.method) && !pathname.startsWith("/api/r2/") && !pathname.includes("upload");
      if (needsBody) {
        try {
          const clonedRequest = request.clone();
          const rawBody = await clonedRequest.json().catch(() => ({}));
          context.body = sanitizeInput(rawBody);
        } catch (e) {
        }
      }
      if (!isPublicRoute && !isAuthRoute) {
        const authResult = await requireAuth({ request, env });
        if (authResult?.error) {
          await logAttack(env, {
            type: "auth_fail",
            ip: clientIP,
            path: pathname,
            userAgent,
            requestId
          });
          return addCorsHeaders(addSecurityHeaders(authResult.response), request);
        }
        user = authResult.user;
      }
      if (isAdminRoute && !isPublicRoute) {
        const roleCheck = await requireRole(user, ["admin", "coordenador"]);
        if (!roleCheck.allowed) {
          await logAttack(env, {
            type: "forbidden",
            ip: clientIP,
            path: pathname,
            user: user?.email,
            requestId
          });
          const response2 = jsonResponse({ success: false, error: "Acesso negado. Permiss\xE3o de administrador necess\xE1ria." }, 403);
          return addCorsHeaders(addSecurityHeaders(response2), request);
        }
      }
      const finalIdentifier = user?.id || context.fingerprint || clientIP;
      if (finalIdentifier !== identifier) {
        const refinedAllowed = await rateLimit(finalIdentifier, env, rateConfig.limit, rateConfig.window);
        if (!refinedAllowed) {
          await logAttack(env, {
            type: "rate_limit_refined",
            ip: clientIP,
            path: pathname,
            identifier: finalIdentifier,
            requestId
          });
          const response2 = jsonResponse({ success: false, error: "Muitas requisi\xE7\xF5es. Aguarde um momento." }, 429);
          return addCorsHeaders(addSecurityHeaders(response2), request);
        }
      }
      if (pathname === "/api/admin/refresh-instagram-token" && request.method === "POST") {
        try {
          const novoToken = await refreshInstagramToken(env, "manual_admin");
          if (novoToken) {
            const expiresAt = await env.KV_INSTAGRAM?.get("token_expires_at");
            let expiraEm = "60 dias";
            if (expiresAt) {
              const diasRestantes = Math.ceil((parseInt(expiresAt) - Date.now()) / 864e5);
              expiraEm = `${diasRestantes} dias`;
            }
            const response2 = jsonResponse({
              success: true,
              message: "Token renovado com sucesso!",
              expiraEm,
              tokenPreview: novoToken.substring(0, 6) + "..."
            });
            return addCorsHeaders(addSecurityHeaders(response2), request);
          } else {
            const response2 = jsonResponse({
              success: false,
              error: "N\xE3o foi poss\xEDvel renovar o token. Gere um novo manualmente no Business Manager."
            }, 400);
            return addCorsHeaders(addSecurityHeaders(response2), request);
          }
        } catch (error) {
          const response2 = jsonResponse({ success: false, error: error.message }, 500);
          return addCorsHeaders(addSecurityHeaders(response2), request);
        }
      }
      if (pathname === "/api/admin/instagram-token-status" && request.method === "GET") {
        try {
          const token = await getInstagramToken(env);
          const expiresAt = await env.KV_INSTAGRAM?.get("token_expires_at");
          const lastRefresh = await env.KV_INSTAGRAM?.get("last_refresh");
          let status = {
            hasToken: !!token,
            expiresAt: expiresAt ? new Date(parseInt(expiresAt)).toISOString() : null,
            lastRefresh: lastRefresh || null,
            diasRestantes: null,
            tokenPreview: token ? token.substring(0, 6) + "..." : null
          };
          if (expiresAt) {
            const diasRestantes = Math.ceil((parseInt(expiresAt) - Date.now()) / 864e5);
            status.diasRestantes = diasRestantes;
            status.isValid = diasRestantes > 0;
          }
          const response2 = jsonResponse({ success: true, status });
          return addCorsHeaders(addSecurityHeaders(response2), request);
        } catch (error) {
          const response2 = jsonResponse({ success: false, error: error.message }, 500);
          return addCorsHeaders(addSecurityHeaders(response2), request);
        }
      }
      if (pathname === "/api/admin/instagram-token-history" && request.method === "GET") {
        try {
          const historico = await env.KV_INSTAGRAM_TOKEN?.get("token_history_list", "json") || [];
          const response2 = jsonResponse({ success: true, historico });
          return addCorsHeaders(addSecurityHeaders(response2), request);
        } catch (error) {
          const response2 = jsonResponse({ success: false, error: error.message }, 500);
          return addCorsHeaders(addSecurityHeaders(response2), request);
        }
      }
      if (pathname === "/api/r2/upload" && request.method === "POST") {
        const response2 = await handleUploadImagem(request, env);
        return addCorsHeaders(addSecurityHeaders(response2), request);
      }
      if (pathname === "/api/r2/audio-upload" && request.method === "POST") {
        try {
          const formData = await request.formData();
          const file = formData.get("imagem");
          if (!file || file.size > 5 * 1024 * 1024) {
            const response3 = jsonResponse({ success: false, error: "Arquivo inv\xE1lido ou muito grande (m\xE1x 5MB)" }, 400);
            return addCorsHeaders(addSecurityHeaders(response3), request);
          }
          const tipo = formData.get("tipo") || "geral";
          const nomeArquivo = `${tipo}/${Date.now()}-${file.name}`;
          await env.R2_AUDIO.put(nomeArquivo, file.stream(), {
            httpMetadata: { contentType: file.type }
          });
          const url2 = `https://pub-a7cc8a4d3af3406aac2a13dacc039fb5.r2.dev/${nomeArquivo}`;
          const response2 = jsonResponse({ success: true, url: url2 });
          return addCorsHeaders(addSecurityHeaders(response2), request);
        } catch (error) {
          const response2 = jsonResponse({ success: false, error: error.message }, 500);
          return addCorsHeaders(addSecurityHeaders(response2), request);
        }
      }
      if (pathname.startsWith("/r2/")) {
        const response2 = await handleGetImagem(request, env, pathname);
        return addCorsHeaders(addSecurityHeaders(response2), request);
      }
      if (pathname === "/api/r2/list" && request.method === "GET") {
        const response2 = await handleListImagens(request, env);
        return addCorsHeaders(addSecurityHeaders(response2), request);
      }
      if (pathname === "/api/r2/delete" && request.method === "DELETE") {
        const response2 = await handleDeleteImagem(request, env);
        return addCorsHeaders(addSecurityHeaders(response2), request);
      }
      if (pathname === "/api/admin/backup" && request.method === "POST") {
        if (!user || !["admin", "coordenador"].includes(user.role)) {
          const response3 = jsonResponse({ error: "Acesso negado" }, 403);
          return addCorsHeaders(addSecurityHeaders(response3), request);
        }
        const dados = context.body;
        const chave = `backup_admin_${(/* @__PURE__ */ new Date()).toISOString().split("T")[0]}_${Date.now()}`;
        await env.SANTUARIO_KV.put(chave, JSON.stringify({
          dados,
          timestamp: (/* @__PURE__ */ new Date()).toISOString(),
          usuario: user.email
        }));
        const backups = await env.SANTUARIO_KV.list({ prefix: "backup_admin_" });
        if (backups.keys.length > 30) {
          const toDelete = backups.keys.slice(30);
          for (const key of toDelete) {
            await env.SANTUARIO_KV.delete(key.name);
          }
        }
        await env.SANTUARIO_KV.put("admin_dados_atual", JSON.stringify(dados));
        const response2 = jsonResponse({ success: true, chave });
        return addCorsHeaders(addSecurityHeaders(response2), request);
      }
      if (pathname === "/api/admin/verificar" && request.method === "GET") {
        if (!user) {
          const response3 = jsonResponse({ success: false }, 401);
          return addCorsHeaders(addSecurityHeaders(response3), request);
        }
        const response2 = jsonResponse({
          success: true,
          user: {
            id: user.id,
            nome: user.nome,
            email: user.email,
            role: user.role,
            twofa_enabled: user.twofa_enabled
          }
        });
        return addCorsHeaders(addSecurityHeaders(response2), request);
      }
      if (pathname === "/api/auth/login" && request.method === "POST") {
        const response2 = await fielLoginRoute(request, env);
        return addCorsHeaders(addSecurityHeaders(response2), request);
      }
      if (pathname === "/api/auth/verificar" && request.method === "GET") {
        const response2 = await fielVerificarRoute(request, env);
        return addCorsHeaders(addSecurityHeaders(response2), request);
      }
      if (pathname === "/api/auth/verify-pin" && request.method === "POST") {
        const response2 = await fielVerifyPinRoute(request, env);
        return addCorsHeaders(addSecurityHeaders(response2), request);
      }
      if (pathname === "/api/auth/reenviar-pin" && request.method === "POST") {
        const response2 = await fielReenviarPinRoute(request, env);
        return addCorsHeaders(addSecurityHeaders(response2), request);
      }
      if (pathname === "/api/auth/verify-2fa" && request.method === "POST") {
        const response2 = await fielVerify2faRoute(request, env);
        return addCorsHeaders(addSecurityHeaders(response2), request);
      }
      if (pathname === "/api/auth/reset-2fa-backup" && request.method === "POST") {
        const response2 = await fielReset2faBackupRoute(request, env);
        return addCorsHeaders(addSecurityHeaders(response2), request);
      }
      if (pathname === "/api/auth/solicitar-reset-2fa" && request.method === "POST") {
        const response2 = await fielSolicitarReset2faRoute(request, env);
        return addCorsHeaders(addSecurityHeaders(response2), request);
      }
      if (pathname === "/api/auth/confirmar-reset-2fa" && request.method === "POST") {
        const response2 = await fielConfirmarReset2faRoute(request, env);
        return addCorsHeaders(addSecurityHeaders(response2), request);
      }
      if (pathname === "/api/auth/esqueci-senha" && request.method === "POST") {
        const response2 = await fielEsqueciSenhaRoute(request, env);
        return addCorsHeaders(addSecurityHeaders(response2), request);
      }
      if (pathname === "/api/auth/confirmar-reset-senha" && request.method === "POST") {
        const response2 = await fielConfirmarResetSenhaRoute(request, env);
        return addCorsHeaders(addSecurityHeaders(response2), request);
      }
      if (pathname === "/api/biblia" && request.method === "GET") {
        const response2 = await handleBiblia(request, env);
        return addCorsHeaders(addSecurityHeaders(response2), request);
      }
      if (pathname === "/api/fiel/dados" && request.method === "GET") {
        const response2 = await getDados(request, env);
        return addCorsHeaders(addSecurityHeaders(response2), request);
      }
      if (pathname === "/api/fiel/salvar" && request.method === "POST") {
        const response2 = await salvarDados(request, env);
        return addCorsHeaders(addSecurityHeaders(response2), request);
      }
      if (pathname === "/api/fiel/perfil" && request.method === "PUT") {
        const response2 = await atualizarPerfil(request, env);
        return addCorsHeaders(addSecurityHeaders(response2), request);
      }
      if (pathname === "/api/fiel/pastorais" && request.method === "GET") {
        const response2 = await listarPastorais(request, env);
        return addCorsHeaders(addSecurityHeaders(response2), request);
      }
      if (pathname === "/api/fiel/termo-voz" && request.method === "POST") {
        const response2 = await registrarTermoPublico(request, env, ctx);
        return addCorsHeaders(addSecurityHeaders(response2), request);
      }
      if (pathname === "/api/fiel/contribuir-voz" && request.method === "POST") {
        const response2 = await contribuirVoz(request, env);
        return addCorsHeaders(addSecurityHeaders(response2), request);
      }
      if (pathname === "/api/fiel/versiculos" && request.method === "POST") {
        const response2 = await salvarVersiculo(request, env);
        return addCorsHeaders(addSecurityHeaders(response2), request);
      }
      if (pathname === "/api/fiel/versiculos" && request.method === "GET") {
        const response2 = await buscarVersiculos(request, env);
        return addCorsHeaders(addSecurityHeaders(response2), request);
      }
      if (pathname === "/api/fiel/buscar-musicas" && request.method === "GET") {
        const response2 = await buscarMusicas(request, env);
        return addCorsHeaders(addSecurityHeaders(response2), request);
      }
      if (pathname === "/api/fiel/health" && request.method === "GET") {
        const response2 = jsonResponse({ status: "ok", timestamp: (/* @__PURE__ */ new Date()).toISOString() });
        return addCorsHeaders(addSecurityHeaders(response2), request);
      }
      if (pathname === "/api/admin/dados" && request.method === "GET") {
        const response2 = await handleAdminDados(request, env);
        return addCorsHeaders(addSecurityHeaders(response2), request);
      }
      if (pathname === "/api/admin/dados" && request.method === "POST") {
        const response2 = await handleAdminSalvarDados(request, env);
        return addCorsHeaders(addSecurityHeaders(response2), request);
      }
      if (pathname === "/api/admin/perfil" && request.method === "GET") {
        const response2 = await handleAdminPerfil(request, env);
        return addCorsHeaders(addSecurityHeaders(response2), request);
      }
      if (pathname === "/api/admin/perfil" && request.method === "PUT") {
        const response2 = await handleAdminAtualizarPerfil(request, env);
        return addCorsHeaders(addSecurityHeaders(response2), request);
      }
      if (pathname === "/api/admin/alterar-senha" && request.method === "PUT") {
        const response2 = await handleAdminAlterarSenha(request, env);
        return addCorsHeaders(addSecurityHeaders(response2), request);
      }
      if (pathname === "/api/admin/youtube-live" && request.method === "POST") {
        const response2 = await handleAdminYoutubeLivePost(request, env);
        return addCorsHeaders(addSecurityHeaders(response2), request);
      }
      if (pathname === "/api/admin/youtube-live" && request.method === "DELETE") {
        const response2 = await handleAdminYoutubeLiveDelete(request, env);
        return addCorsHeaders(addSecurityHeaders(response2), request);
      }
      if (pathname === "/api/admin/youtube-live" && request.method === "GET") {
        const response2 = await handleAdminYoutubeLiveGet(request, env);
        return addCorsHeaders(addSecurityHeaders(response2), request);
      }
      if (pathname === "/api/terco/hoje") {
        const response2 = await handleTerco(request, env);
        return addCorsHeaders(addSecurityHeaders(response2), request);
      }
      if (pathname === "/api/liturgia") {
        try {
          const data = await buscarLiturgia(url.searchParams.get("data"));
          const responseData = {
            success: true,
            leituras: {
              cor: data.liturgia?.cor || "",
              tempoLiturgico: data.liturgia?.titulo || "",
              semana: data.liturgia?.semana || "",
              tituloLiturgico: data.liturgia?.tituloLiturgico || "",
              antifona: data.liturgia?.antifona || "",
              introducao: data.liturgia?.introducao || "",
              primeiraLeitura: data.liturgia?.primeiraLeitura || "",
              segundaLeitura: data.liturgia?.segundaLeitura || "",
              salmo: data.liturgia?.salmo || "",
              evangelho: data.liturgia?.evangelho || "",
              reflexao: data.liturgia?.reflexao || ""
            }
          };
          const response2 = jsonResponse(responseData);
          response2.headers.set("Cache-Control", "no-store");
          return addCorsHeaders(addSecurityHeaders(response2), request);
        } catch (error) {
          logStructured("error", "Erro ao buscar liturgia", { error: error.message, requestId });
          const fallbackData = {
            success: true,
            leituras: {
              cor: "",
              tempoLiturgico: "",
              semana: "Tempo Comum",
              primeiraLeitura: "Leitura n\xE3o dispon\xEDvel no momento.",
              salmo: "Salmo n\xE3o dispon\xEDvel.",
              evangelho: "Evangelho n\xE3o dispon\xEDvel."
            }
          };
          const response2 = jsonResponse(fallbackData);
          return addCorsHeaders(addSecurityHeaders(response2), request);
        }
      }
      if (pathname === "/api/horarios" && request.method === "GET") {
        try {
          const horariosPadrao = [
            { id: "segunda", dia: "Segunda-Feira", missas: [], ativo: true },
            { id: "terca", dia: "Ter\xE7a-Feira", missas: [{ id: "terca-1", hora: "07h30" }, { id: "terca-2", hora: "19h30", tipo: "Confiss\xE3o - Chegue com 1h de anteced\xEAncia" }], ativo: true },
            { id: "quarta", dia: "Quarta-Feira", missas: [{ id: "quarta-1", hora: "19h30", tipo: "Confiss\xE3o - Chegue com 1h de anteced\xEAncia" }], ativo: true },
            { id: "quinta", dia: "Quinta-Feira", missas: [{ id: "quinta-1", hora: "07h30" }, { id: "quinta-2", hora: "19h30", tipo: "Confiss\xE3o - Chegue com 1h de anteced\xEAncia" }], ativo: true },
            { id: "sexta", dia: "Sexta-Feira", missas: [{ id: "sexta-1", hora: "19h30", tipo: "Confiss\xE3o - Chegue com 1h de anteced\xEAncia" }], ativo: true },
            { id: "sabado", dia: "S\xE1bado", missas: [{ id: "sabado-1", hora: "16h30", tipo: "Confiss\xE3o - Chegue com 1h de anteced\xEAncia" }], ativo: true },
            { id: "domingo", dia: "Domingo", missas: [{ id: "domingo-1", hora: "08h00" }, { id: "domingo-2", hora: "10h00", tipo: "Transmitida AO VIVO", youtube: true, youtubeLink: "https://youtube.com/@santuariodefatimanews" }, { id: "domingo-3", hora: "18h30" }], ativo: true }
          ];
          let horarios = await env.KV_MISSAS?.get("horariosMissas", "json");
          const response2 = jsonResponse({ success: true, horarios: horarios || horariosPadrao });
          return addCorsHeaders(addSecurityHeaders(response2), request);
        } catch (error) {
          logStructured("error", "Erro ao buscar hor\xE1rios", { error: error.message, requestId });
          const response2 = jsonResponse({ success: false, error: "Erro ao carregar hor\xE1rios" }, 500);
          return addCorsHeaders(addSecurityHeaders(response2), request);
        }
      }
      if (pathname === "/api/vatican-news") {
        try {
          const data = await getVaticanNews(env);
          const response2 = jsonResponse(data);
          return addCorsHeaders(addSecurityHeaders(response2), request);
        } catch (error) {
          const response2 = jsonResponse([], 200);
          return addCorsHeaders(addSecurityHeaders(response2), request);
        }
      }
      if (pathname === "/api/youtube") {
        const response2 = await handleYouTube(request, env);
        return addCorsHeaders(addSecurityHeaders(response2), request);
      }
      if (pathname === "/api/instagram") {
        try {
          const posts = await getInstagramFeed(env);
          const response2 = jsonResponse({ success: true, posts });
          return addCorsHeaders(addSecurityHeaders(response2), request);
        } catch (error) {
          logStructured("error", "Erro na rota /api/instagram", { error: error.message, requestId });
          const response2 = jsonResponse({ success: false, posts: [], error: error.message }, 500);
          return addCorsHeaders(addSecurityHeaders(response2), request);
        }
      }
      if (pathname === "/api/diocese-news") {
        const response2 = await handleDioceseNews(request, env);
        return addCorsHeaders(addSecurityHeaders(response2), request);
      }
      if (pathname === "/api/candle-lighting" && request.method === "POST") {
        try {
          const body = context.body;
          const candleData = {
            id: Date.now().toString(),
            nome: body.name || body.nome || "Anonimo",
            familia: body.intention || "Familia",
            cidade: body.city || body.cidade || "",
            estado: body.state || body.estado || "",
            data: (/* @__PURE__ */ new Date()).toISOString(),
            duracao: 86400,
            status: 1
          };
          if (env.DB) {
            await env.DB.prepare(`
              CREATE TABLE IF NOT EXISTS velas (
                id TEXT PRIMARY KEY, nome TEXT NOT NULL, familia TEXT,
                cidade TEXT, estado TEXT, data TEXT, duracao INTEGER, status INTEGER DEFAULT 1
              )
            `).run();
            await env.DB.prepare(`
              INSERT INTO velas (id, nome, familia, cidade, estado, data, duracao, status)
              VALUES (?, ?, ?, ?, ?, ?, ?, ?)
            `).bind(
              candleData.id,
              candleData.nome,
              candleData.familia,
              candleData.cidade,
              candleData.estado,
              candleData.data,
              candleData.duracao,
              candleData.status
            ).run();
          }
          if (body.email) {
            ctx.waitUntil(sendCandleEmail(env, {
              name: candleData.nome,
              email: body.email,
              intention: candleData.familia,
              cidade: candleData.cidade,
              estado: candleData.estado
            }));
          }
          ctx.waitUntil(cleanupOldCandles(env));
          const response2 = jsonResponse({ success: true, message: "Vela acesa com sucesso!", candle: candleData });
          return addCorsHeaders(addSecurityHeaders(response2), request);
        } catch (error) {
          logStructured("error", "Erro ao processar vela", { error: error.message, requestId });
          const response2 = jsonResponse({ success: false, error: "Erro interno ao processar vela" }, 500);
          return addCorsHeaders(addSecurityHeaders(response2), request);
        }
      }
      if (pathname === "/api/candle-lighting" && request.method === "GET") {
        try {
          if (!env.DB) {
            const response3 = jsonResponse([]);
            return addCorsHeaders(addSecurityHeaders(response3), request);
          }
          const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1e3).toISOString();
          const result = await env.DB.prepare(`
            SELECT id, nome, familia, cidade, estado, data FROM velas
            WHERE data > ? AND status = 1 ORDER BY data DESC LIMIT 100
          `).bind(sevenDaysAgo).all();
          const candles = (result.results || []).map((c) => ({
            id: c.id,
            name: c.nome,
            intention: c.familia,
            city: c.cidade || "",
            state: c.estado || "",
            createdAt: c.data,
            timestamp: formatTimeAgo(c.data)
          }));
          const response2 = jsonResponse(candles);
          return addCorsHeaders(addSecurityHeaders(response2), request);
        } catch (error) {
          const response2 = jsonResponse([]);
          return addCorsHeaders(addSecurityHeaders(response2), request);
        }
      }
      if (pathname === "/api/prayer" && request.method === "POST") {
        try {
          const body = context.body;
          if (env.DB) {
            await env.DB.prepare(`
              CREATE TABLE IF NOT EXISTS prayer (
                id INTEGER PRIMARY KEY AUTOINCREMENT, nome TEXT NOT NULL,
                email TEXT, pedido TEXT NOT NULL, cidade TEXT,
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP
              )
            `).run();
            await env.DB.prepare(`
              INSERT INTO prayer (nome, email, pedido, cidade, created_at)
              VALUES (?, ?, ?, ?, ?)
            `).bind(
              body.name || body.nome || "Anonimo",
              body.email || "",
              body.prayerRequest || body.pedido || "",
              body.cidade || body.city || "",
              (/* @__PURE__ */ new Date()).toISOString()
            ).run();
          }
          if (body.email && env.RESEND_API_KEY) {
            const prayerData = {
              name: body.name || body.nome || "Anonimo",
              email: body.email,
              prayerRequest: body.prayerRequest || body.pedido || "",
              cidade: body.cidade || body.city || ""
            };
            ctx.waitUntil(sendPrayerConfirmationEmail(env, prayerData));
            ctx.waitUntil(sendPrayerNotificationToSecretariat(env, prayerData));
          }
          const response2 = jsonResponse({ success: true, message: "Pedido de ora\xE7\xE3o recebido com sucesso!" });
          return addCorsHeaders(addSecurityHeaders(response2), request);
        } catch (error) {
          logStructured("error", "Erro ao processar pedido de ora\xE7\xE3o", { error: error.message, requestId });
          const response2 = jsonResponse({ success: false, message: "Erro ao processar seu pedido" }, 500);
          return addCorsHeaders(addSecurityHeaders(response2), request);
        }
      }
      if (pathname === "/api/prayer" && request.method === "GET") {
        try {
          if (!env.DB) {
            const response3 = jsonResponse({ success: true, count: 0, prayers: [] });
            return addCorsHeaders(addSecurityHeaders(response3), request);
          }
          const result = await env.DB.prepare(`
            SELECT id, nome, email, pedido, cidade, created_at
            FROM prayer ORDER BY created_at DESC LIMIT 50
          `).all();
          const response2 = jsonResponse({ success: true, count: result.results?.length || 0, prayers: result.results || [] });
          return addCorsHeaders(addSecurityHeaders(response2), request);
        } catch (error) {
          const response2 = jsonResponse({ success: false, error: "Erro ao buscar pedidos" }, 500);
          return addCorsHeaders(addSecurityHeaders(response2), request);
        }
      }
      if (pathname === "/api/contato/enviar" && request.method === "POST") {
        try {
          const body = context.body;
          if (!env.RESEND_API_KEY) {
            const response3 = jsonResponse({ success: false, error: "RESEND_API_KEY n\xE3o configurada" }, 500);
            return addCorsHeaders(addSecurityHeaders(response3), request);
          }
          ctx.waitUntil(sendContactConfirmationEmail(env, body));
          ctx.waitUntil(sendContactNotificationToSecretariat(env, body));
          const response2 = jsonResponse({ success: true, message: "Mensagem enviada com sucesso!" });
          return addCorsHeaders(addSecurityHeaders(response2), request);
        } catch (error) {
          logStructured("error", "Erro ao enviar contato", { error: error.message, requestId });
          const response2 = jsonResponse({ success: false, message: "Erro ao enviar mensagem" }, 500);
          return addCorsHeaders(addSecurityHeaders(response2), request);
        }
      }
      if (pathname === "/api/contato/pascom/enviar" && request.method === "POST") {
        try {
          const body = context.body;
          if (!env.RESEND_API_KEY) {
            const response3 = jsonResponse({ success: false, error: "RESEND_API_KEY n\xE3o configurada" }, 500);
            return addCorsHeaders(addSecurityHeaders(response3), request);
          }
          logStructured("info", "Enviando mensagem da Pascom", { requestId });
          ctx.waitUntil(sendContactConfirmationEmail(env, body));
          ctx.waitUntil(sendContactNotificationToSecretariat(env, body));
          const response2 = jsonResponse({ success: true, message: "Mensagem enviada com sucesso para a Pascom!" });
          return addCorsHeaders(addSecurityHeaders(response2), request);
        } catch (error) {
          logStructured("error", "Erro ao enviar mensagem para Pascom", { error: error.message, requestId });
          const response2 = jsonResponse({ success: false, message: "Erro ao enviar mensagem" }, 500);
          return addCorsHeaders(addSecurityHeaders(response2), request);
        }
      }
      if (pathname === "/api/dados" && request.method === "GET") {
        try {
          const carrossel = await env.KV_FILES?.get("santuario_carrossel", "json") || [];
          const popups = await env.KV_FILES?.get("santuario_popups", "json") || [];
          const recados = await env.KV_FILES?.get("santuario_recados", "json") || [];
          const horariosMissas = await env.KV_MISSAS?.get("horariosMissas", "json") || [];
          const momentosLiturgicos = await env.KV_LITURGIA?.get("momentos", "json") || [];
          const response2 = jsonResponse({
            success: true,
            dados: { carrossel, momentosLiturgicos, popups, recados, horariosMissas }
          });
          return addCorsHeaders(addSecurityHeaders(response2), request);
        } catch (error) {
          logStructured("error", "Erro ao buscar dados p\xFAblicos", { error: error.message, requestId });
          const response2 = jsonResponse({
            success: true,
            dados: { carrossel: [], momentosLiturgicos: [], popups: [], recados: [], horariosMissas: [] }
          });
          return addCorsHeaders(addSecurityHeaders(response2), request);
        }
      }
      if (pathname === "/api/health") {
        const response2 = jsonResponse({ success: true, status: "healthy", timestamp: (/* @__PURE__ */ new Date()).toISOString() });
        return addCorsHeaders(addSecurityHeaders(response2), request);
      }
      if (pathname === "/" || pathname === "/api") {
        const response2 = jsonResponse({
          success: true,
          service: "Santu\xE1rio de F\xE1tima API",
          version: "5.0.0",
          status: "online",
          timestamp: (/* @__PURE__ */ new Date()).toISOString()
        });
        return addCorsHeaders(addSecurityHeaders(response2), request);
      }
      const response = jsonResponse({ success: false, error: "Endpoint n\xE3o encontrado", path: pathname }, 404);
      return addCorsHeaders(addSecurityHeaders(response), request);
    } catch (err) {
      logStructured("error", "Erro interno no servidor", { error: err.message, stack: err.stack, requestId });
      const response = jsonResponse({ success: false, error: "Erro interno do servidor" }, 500);
      return addCorsHeaders(addSecurityHeaders(response), request);
    }
  },
  // ============================================
  // ⏰ TAREFA AGENDADA
  // ============================================
  async scheduled(event, env, ctx) {
    logStructured("info", "Executando tarefas agendadas");
    await cleanupOldCandles(env);
    await backupOldPrayers(env);
    logStructured("info", "Verificando token do Instagram para renova\xE7\xE3o");
    const tokenAtual = await getInstagramToken(env);
    const expiresAt = await env.KV_INSTAGRAM?.get("token_expires_at");
    let precisaRenovar = true;
    if (expiresAt) {
      const diasRestantes = Math.ceil((parseInt(expiresAt) - Date.now()) / 864e5);
      logStructured("info", "Status do token", { diasRestantes });
      precisaRenovar = diasRestantes < 40;
      if (precisaRenovar) {
        logStructured("warn", "Token expira em breve, renovando", { diasRestantes });
      } else {
        logStructured("info", "Token ainda tem dias suficientes", { diasRestantes });
      }
    }
    if (precisaRenovar && tokenAtual) {
      const novoToken = await refreshInstagramToken(env, "auto_refresh");
      if (novoToken) {
        logStructured("info", "Token renovado automaticamente com sucesso");
      } else {
        logStructured("error", "Falha na renova\xE7\xE3o autom\xE1tica do token");
      }
    } else if (!tokenAtual) {
      logStructured("error", "Nenhum token encontrado no KV. Configure manualmente primeiro.");
    }
  }
};

// ../../../../AppData/Roaming/npm/node_modules/wrangler/templates/middleware/middleware-ensure-req-body-drained.ts
var drainBody = /* @__PURE__ */ __name(async (request, env, _ctx, middlewareCtx) => {
  try {
    return await middlewareCtx.next(request, env);
  } finally {
    try {
      if (request.body !== null && !request.bodyUsed) {
        const reader = request.body.getReader();
        while (!(await reader.read()).done) {
        }
      }
    } catch (e) {
      console.error("Failed to drain the unused request body.", e);
    }
  }
}, "drainBody");
var middleware_ensure_req_body_drained_default = drainBody;

// .wrangler/tmp/bundle-zSWSfc/middleware-insertion-facade.js
var __INTERNAL_WRANGLER_MIDDLEWARE__ = [
  middleware_ensure_req_body_drained_default
];
var middleware_insertion_facade_default = index_default;

// ../../../../AppData/Roaming/npm/node_modules/wrangler/templates/middleware/common.ts
var __facade_middleware__ = [];
function __facade_register__(...args) {
  __facade_middleware__.push(...args.flat());
}
__name(__facade_register__, "__facade_register__");
function __facade_invokeChain__(request, env, ctx, dispatch, middlewareChain) {
  const [head, ...tail] = middlewareChain;
  const middlewareCtx = {
    dispatch,
    next(newRequest, newEnv) {
      return __facade_invokeChain__(newRequest, newEnv, ctx, dispatch, tail);
    }
  };
  return head(request, env, ctx, middlewareCtx);
}
__name(__facade_invokeChain__, "__facade_invokeChain__");
function __facade_invoke__(request, env, ctx, dispatch, finalMiddleware) {
  return __facade_invokeChain__(request, env, ctx, dispatch, [
    ...__facade_middleware__,
    finalMiddleware
  ]);
}
__name(__facade_invoke__, "__facade_invoke__");

// .wrangler/tmp/bundle-zSWSfc/middleware-loader.entry.ts
var __Facade_ScheduledController__ = class ___Facade_ScheduledController__ {
  constructor(scheduledTime, cron, noRetry) {
    this.scheduledTime = scheduledTime;
    this.cron = cron;
    this.#noRetry = noRetry;
  }
  static {
    __name(this, "__Facade_ScheduledController__");
  }
  #noRetry;
  noRetry() {
    if (!(this instanceof ___Facade_ScheduledController__)) {
      throw new TypeError("Illegal invocation");
    }
    this.#noRetry();
  }
};
function wrapExportedHandler(worker) {
  if (__INTERNAL_WRANGLER_MIDDLEWARE__ === void 0 || __INTERNAL_WRANGLER_MIDDLEWARE__.length === 0) {
    return worker;
  }
  for (const middleware of __INTERNAL_WRANGLER_MIDDLEWARE__) {
    __facade_register__(middleware);
  }
  const fetchDispatcher = /* @__PURE__ */ __name(function(request, env, ctx) {
    if (worker.fetch === void 0) {
      throw new Error("Handler does not export a fetch() function.");
    }
    return worker.fetch(request, env, ctx);
  }, "fetchDispatcher");
  return {
    ...worker,
    fetch(request, env, ctx) {
      const dispatcher = /* @__PURE__ */ __name(function(type, init) {
        if (type === "scheduled" && worker.scheduled !== void 0) {
          const controller = new __Facade_ScheduledController__(
            Date.now(),
            init.cron ?? "",
            () => {
            }
          );
          return worker.scheduled(controller, env, ctx);
        }
      }, "dispatcher");
      return __facade_invoke__(request, env, ctx, dispatcher, fetchDispatcher);
    }
  };
}
__name(wrapExportedHandler, "wrapExportedHandler");
function wrapWorkerEntrypoint(klass) {
  if (__INTERNAL_WRANGLER_MIDDLEWARE__ === void 0 || __INTERNAL_WRANGLER_MIDDLEWARE__.length === 0) {
    return klass;
  }
  for (const middleware of __INTERNAL_WRANGLER_MIDDLEWARE__) {
    __facade_register__(middleware);
  }
  return class extends klass {
    #fetchDispatcher = /* @__PURE__ */ __name((request, env, ctx) => {
      this.env = env;
      this.ctx = ctx;
      if (super.fetch === void 0) {
        throw new Error("Entrypoint class does not define a fetch() function.");
      }
      return super.fetch(request);
    }, "#fetchDispatcher");
    #dispatcher = /* @__PURE__ */ __name((type, init) => {
      if (type === "scheduled" && super.scheduled !== void 0) {
        const controller = new __Facade_ScheduledController__(
          Date.now(),
          init.cron ?? "",
          () => {
          }
        );
        return super.scheduled(controller);
      }
    }, "#dispatcher");
    fetch(request) {
      return __facade_invoke__(
        request,
        this.env,
        this.ctx,
        this.#dispatcher,
        this.#fetchDispatcher
      );
    }
  };
}
__name(wrapWorkerEntrypoint, "wrapWorkerEntrypoint");
var WRAPPED_ENTRY;
if (typeof middleware_insertion_facade_default === "object") {
  WRAPPED_ENTRY = wrapExportedHandler(middleware_insertion_facade_default);
} else if (typeof middleware_insertion_facade_default === "function") {
  WRAPPED_ENTRY = wrapWorkerEntrypoint(middleware_insertion_facade_default);
}
var middleware_loader_entry_default = WRAPPED_ENTRY;
export {
  __INTERNAL_WRANGLER_MIDDLEWARE__,
  middleware_loader_entry_default as default,
  getInstagramFeed,
  getInstagramToken,
  refreshInstagramToken,
  registrarHistoricoToken
};
//# sourceMappingURL=index.js.map
