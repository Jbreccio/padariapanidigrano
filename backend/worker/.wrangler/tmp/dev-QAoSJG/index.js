var __defProp = Object.defineProperty;
var __name = (target, value) => __defProp(target, "name", { value, configurable: true });

// src/utils/cors.js
var allowedOrigins = [
  // DEV
  "http://localhost:5173",
  "http://localhost:4173",
  // DOMÍNIO REAL
  "https://www.santuariodefatima.com.br",
  "https://santuariodefatima.com.br",
  // Workers
  "https://santuariodefatima.oibreccio.workers.dev",
  "https://santuariodefatima.oibreccio.workers.dev"
];
var baseHeaders = {
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization"
};
var corsHeaders = {
  ...baseHeaders,
  "Access-Control-Allow-Origin": "*"
};
function getCorsHeaders(origin) {
  if (!origin) {
    return { ...baseHeaders, "Access-Control-Allow-Origin": "*" };
  }
  if (allowedOrigins.includes(origin)) {
    return {
      ...baseHeaders,
      "Access-Control-Allow-Origin": origin,
      "Access-Control-Allow-Credentials": "true"
    };
  }
  return {
    ...baseHeaders,
    "Access-Control-Allow-Origin": "null"
  };
}
__name(getCorsHeaders, "getCorsHeaders");
function handleCorsOptions(request) {
  if (request.method === "OPTIONS") {
    const origin = request.headers.get("Origin");
    return new Response(null, { status: 204, headers: getCorsHeaders(origin) });
  }
  return null;
}
__name(handleCorsOptions, "handleCorsOptions");
function addCorsHeaders(response, request) {
  const origin = request.headers.get("Origin");
  const headers = getCorsHeaders(origin);
  const newResponse = new Response(response.body, response);
  Object.entries(headers).forEach(([k, v]) => newResponse.headers.set(k, v));
  return newResponse;
}
__name(addCorsHeaders, "addCorsHeaders");

// src/utils/helpers.js
function jsonResponse(data, status = 200, additionalHeaders = {}) {
  return new Response(JSON.stringify(data, null, 2), {
    status,
    headers: {
      "Content-Type": "application/json; charset=utf-8",
      ...corsHeaders,
      // ← objeto, sem parênteses
      ...additionalHeaders
    }
  });
}
__name(jsonResponse, "jsonResponse");

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

// src/middleware/firewall.js
async function firewall(contextOrRequest) {
  try {
    const request = contextOrRequest?.request ?? contextOrRequest ?? null;
    if (!request || typeof request.headers?.get !== "function") {
      console.error("\u{1F525} Firewall: request inv\xE1lido");
      return null;
    }
    const ua = request.headers.get("User-Agent") || "";
    const ip = request.headers.get("CF-Connecting-IP") || request.headers.get("x-forwarded-for")?.split(",")[0] || "unknown";
    const uaLower = ua.toLowerCase();
    if (!ua || ua.length < 8) {
      return new Response(JSON.stringify({
        success: false,
        error: "User-Agent inv\xE1lido"
      }), { status: 403 });
    }
    const blockedAgents = [
      "curl",
      "wget",
      "python",
      "scrapy",
      "httpclient",
      "insomnia",
      "postman-runtime"
    ];
    if (blockedAgents.some((b) => uaLower.includes(b))) {
      return new Response(JSON.stringify({
        success: false,
        error: "Bot bloqueado"
      }), { status: 403 });
    }
    if (uaLower.includes("bot") && !uaLower.includes("google") && !uaLower.includes("bing")) {
      return new Response(JSON.stringify({
        success: false,
        error: "Bot suspeito"
      }), { status: 403 });
    }
    if (!ip || ip === "0.0.0.0") {
      return new Response(JSON.stringify({
        success: false,
        error: "IP inv\xE1lido"
      }), { status: 403 });
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
var RATE_LIMITS = {
  login: { limit: 5, window: 60 },
  verifyPin: { limit: 5, window: 120 },
  verify2fa: { limit: 3, window: 60 },
  forgotPassword: { limit: 3, window: 300 },
  resetPassword: { limit: 3, window: 300 },
  reset2fa: { limit: 2, window: 600 },
  default: { limit: 100, window: 60 }
};
function buildIdentifier(request, extraKey = "") {
  const ip = request.headers.get("CF-Connecting-IP") || request.headers.get("x-real-ip") || request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "unknown";
  const ua = request.headers.get("user-agent") || "unknown";
  const url = new URL(request.url);
  const fingerprint2 = `${ip}:${ua.slice(0, 50)}:${url.pathname}:${extraKey || "anon"}`;
  return {
    ip,
    ua,
    path: url.pathname,
    user: extraKey || "anon",
    key: fingerprint2
  };
}
__name(buildIdentifier, "buildIdentifier");
async function rateLimitCore(identifier, env, limit, windowSeconds) {
  const now = Math.floor(Date.now() / 1e3);
  const windowKey = Math.floor(now / windowSeconds);
  const key = `rate:${identifier.key}:${windowKey}`;
  const blockKey = `block:${identifier.key}`;
  try {
    const blocked = await env.KV_RATE.get(blockKey);
    if (blocked) {
      return { allowed: false, reset: 60 };
    }
    let count = 0;
    const current = await env.KV_RATE.get(key);
    count = current ? Number(current) : 0;
    if (isNaN(count)) count = 0;
    if (count >= limit) {
      const penalty = Math.min(3600, Math.pow(2, count));
      await env.KV_RATE.put(blockKey, "1", {
        expirationTtl: penalty
      });
      return {
        allowed: false,
        remaining: 0,
        reset: penalty
      };
    }
    if (count === 0) {
      await env.KV_RATE.put(key, "1", {
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
    console.error("Rate limit error:", error);
    return { allowed: true };
  }
}
__name(rateLimitCore, "rateLimitCore");
async function detectDistributedAttack(env, userKey, ip) {
  const key = `attack:${userKey}`;
  const current = await env.KV_RATE.get(key);
  let data = current ? JSON.parse(current) : { ips: [] };
  if (!data.ips.includes(ip)) {
    data.ips.push(ip);
  }
  if (data.ips.length >= 10) {
    return true;
  }
  await env.KV_RATE.put(key, JSON.stringify(data), {
    expirationTtl: 300
    // 5 minutos
  });
  return false;
}
__name(detectDistributedAttack, "detectDistributedAttack");
function getRateLimitConfig(pathname) {
  if (pathname.includes("/login")) return RATE_LIMITS.login;
  if (pathname.includes("/verify-pin")) return RATE_LIMITS.verifyPin;
  if (pathname.includes("/verify-2fa")) return RATE_LIMITS.verify2fa;
  if (pathname.includes("/esqueci-senha")) return RATE_LIMITS.forgotPassword;
  if (pathname.includes("/confirmar-reset-senha")) return RATE_LIMITS.resetPassword;
  if (pathname.includes("/reset-2fa")) return RATE_LIMITS.reset2fa;
  return RATE_LIMITS.default;
}
__name(getRateLimitConfig, "getRateLimitConfig");
async function applyRateLimit(request, env, extraKey = "") {
  const identifier = buildIdentifier(request, extraKey);
  const config = getRateLimitConfig(identifier.path);
  if (extraKey) {
    const attack = await detectDistributedAttack(env, extraKey, identifier.ip);
    if (attack) {
      return new Response(
        JSON.stringify({
          success: false,
          error: "Atividade suspeita detectada. Tente novamente mais tarde."
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
        error: "Muitas tentativas. Aguarde antes de tentar novamente."
      }),
      {
        status: 429,
        headers: {
          "Content-Type": "application/json",
          "X-RateLimit-Limit": String(config.limit),
          "X-RateLimit-Remaining": "0",
          "X-RateLimit-Reset": String(result.reset)
        }
      }
    );
  }
  return null;
}
__name(applyRateLimit, "applyRateLimit");

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

// src/utils/sanitize.js
function isSafeUrl(value) {
  if (typeof value !== "string") return false;
  const safePatterns = [
    /^https?:\/\//,
    // URLs HTTP/HTTPS
    /^\/r2\//,
    // R2 paths
    /^\/images\//,
    // Imagens locais
    /^\/docs\//,
    // Documentos locais
    /^\/assets\//,
    // Assets locais
    /^data:image\/[a-z]+;base64,/,
    // Base64 images
    /^https:\/\/pub-[a-f0-9]+\.r2\.dev\//,
    // R2 Cloudflare
    /^https:\/\/santuariodefatima\.oibreccio\.workers\.dev\//,
    // Worker
    /^https:\/\/img\.youtube\.com\//
    // YouTube thumbnails
  ];
  return safePatterns.some((pattern) => pattern.test(value));
}
__name(isSafeUrl, "isSafeUrl");
function decodeHtmlEntities(str) {
  if (typeof str !== "string") return str;
  let result = str;
  let previous = "";
  let maxLoops = 10;
  while (result !== previous && maxLoops-- > 0) {
    previous = result;
    result = result.replace(/&amp;#x2F;/gi, "/").replace(/&#x2F;/gi, "/").replace(/&amp;#x2f;/gi, "/").replace(/&#x2f;/gi, "/").replace(/&amp;#47;/gi, "/").replace(/&#47;/gi, "/").replace(/&amp;#58;/gi, ":").replace(/&#58;/gi, ":").replace(/&amp;#x3A;/gi, ":").replace(/&#x3A;/gi, ":").replace(/&amp;#x2F;/gi, "/").replace(/&amp;quot;/gi, '"').replace(/&quot;/gi, '"').replace(/&amp;amp;/gi, "&").replace(/&amp;/gi, "&").replace(/&lt;/gi, "<").replace(/&gt;/gi, ">");
  }
  return result;
}
__name(decodeHtmlEntities, "decodeHtmlEntities");
function sanitizeInput(input, depth = 0) {
  if (depth > 10) return input;
  if (input === null || input === void 0) {
    return null;
  }
  if (typeof input === "string") {
    let decoded = decodeHtmlEntities(input);
    if (isSafeUrl(decoded)) {
      if (/[<>]/g.test(decoded)) {
        return decoded.replace(/[<>]/g, "");
      }
      return decoded;
    }
    let cleaned = decoded.replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, "").replace(/<iframe\b[^<]*(?:(?!<\/iframe>)<[^<]*)*<\/iframe>/gi, "").replace(/<object\b[^<]*(?:(?!<\/object>)<[^<]*)*<\/object>/gi, "").replace(/<embed\b[^<]*(?:(?!<\/embed>)<[^<]*)*<\/embed>/gi, "").replace(/javascript:/gi, "").replace(/onload=/gi, "").replace(/onerror=/gi, "").replace(/onclick=/gi, "");
    cleaned = cleaned.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;").replace(/'/g, "&#x27;");
    return cleaned.slice(0, 5e3);
  }
  if (typeof input === "object" && !Array.isArray(input)) {
    const sanitized = {};
    for (const [key, value] of Object.entries(input)) {
      const safeKey = typeof key === "string" ? key.slice(0, 100) : String(key);
      const isUrlField = /^(imagem|url|imagens|avatar|thumbnail|googleDriveLink|youtubeLink|link|photo|image|src|href|poster|cover)$/i.test(safeKey);
      const isArrayOfUrls = isUrlField && Array.isArray(value);
      if (isUrlField) {
        if (Array.isArray(value)) {
          sanitized[safeKey] = value.map((v) => {
            if (typeof v === "string") {
              let decoded = decodeHtmlEntities(v);
              return isSafeUrl(decoded) ? decoded : sanitizeInput(decoded, depth + 1);
            }
            return v;
          });
        } else if (typeof value === "string") {
          let decoded = decodeHtmlEntities(value);
          sanitized[safeKey] = isSafeUrl(decoded) ? decoded : sanitizeInput(decoded, depth + 1);
        } else {
          sanitized[safeKey] = sanitizeInput(value, depth + 1);
        }
      } else {
        sanitized[safeKey] = sanitizeInput(value, depth + 1);
      }
    }
    return sanitized;
  }
  if (Array.isArray(input)) {
    return input.slice(0, 100).map((item) => sanitizeInput(item, depth + 1));
  }
  if (typeof input === "number") {
    return Math.min(Math.max(input, -999999999), 999999999);
  }
  if (typeof input === "boolean") {
    return input;
  }
  return sanitizeInput(String(input), depth + 1);
}
__name(sanitizeInput, "sanitizeInput");
async function hashToken(token) {
  if (!token || typeof token !== "string") return "";
  const encoder2 = new TextEncoder();
  const data = encoder2.encode(token);
  const hash = await crypto.subtle.digest("SHA-256", data);
  return Array.from(new Uint8Array(hash)).map((b) => b.toString(16).padStart(2, "0")).join("");
}
__name(hashToken, "hashToken");
function validatePayloadSize(request, maxSize = 10485760) {
  const contentLength = request.headers.get("content-length");
  if (contentLength && parseInt(contentLength) > maxSize) {
    return new Response(
      JSON.stringify({
        success: false,
        error: `Payload muito grande. M\xE1ximo: ${Math.round(maxSize / 1024 / 1024)}MB`
      }),
      { status: 413, headers: { "Content-Type": "application/json" } }
    );
  }
  return null;
}
__name(validatePayloadSize, "validatePayloadSize");
function createRequestId() {
  try {
    return crypto.randomUUID();
  } catch (e) {
    return `${Date.now()}-${Math.random().toString(36).substring(2, 15)}`;
  }
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
    console.log(`\u2705 Email de confirma\xE7\xE3o de contato enviado para ${data.email}`);
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
async function createSession(env, user, request = null) {
  const rawToken = crypto.randomUUID();
  const tokenHash = await hashToken(rawToken);
  const ttlSeconds = user.role === "admin" ? 60 * 60 * 8 : 60 * 60 * 24 * 7;
  const expiresAt = Date.now() + ttlSeconds * 1e3;
  let loginInfo = { criadoEm: (/* @__PURE__ */ new Date()).toISOString() };
  if (request) {
    const ua = request.headers.get("User-Agent") || "";
    const ip = request.headers.get("CF-Connecting-IP") || request.headers.get("X-Forwarded-For")?.split(",")[0] || "desconhecido";
    const country = request.headers.get("CF-IPCountry") || "??";
    const city = request.headers.get("CF-IPCity") || "desconhecida";
    loginInfo = {
      ip,
      city,
      country,
      userAgent: ua.substring(0, 100),
      browser: ua.includes("Edg") ? "Edge" : ua.includes("Chrome") ? "Chrome" : ua.includes("Firefox") ? "Firefox" : ua.includes("Safari") ? "Safari" : "Outro",
      device: /Mobile|Android|iPhone|iPad/i.test(ua) ? "Celular" : "Desktop",
      os: ua.includes("Windows") ? "Windows" : ua.includes("Mac") ? "macOS" : ua.includes("Android") ? "Android" : ua.includes("iPhone") || ua.includes("iPad") ? "iOS" : ua.includes("Linux") ? "Linux" : "Outro",
      criadoEm: (/* @__PURE__ */ new Date()).toISOString()
    };
  }
  await env.KV_SESSION.put(`sess:${tokenHash}`, JSON.stringify({
    user: {
      id: user.id,
      nome: user.nome,
      email: user.email,
      role: user.role
    },
    expires: expiresAt,
    loginInfo
  }), { expirationTtl: ttlSeconds });
  return { token: rawToken, expiresAt };
}
__name(createSession, "createSession");
async function verificarSenha(senhaDigitada, senhaArmazenada) {
  if (!senhaArmazenada) return false;
  const hash = await sha256(senhaDigitada);
  return hash === senhaArmazenada;
}
__name(verificarSenha, "verificarSenha");
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
  if (!to) {
    console.error("\u274C sendEmail: destinat\xE1rio vazio");
    return;
  }
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(to)) {
    console.error(`\u274C sendEmail: formato inv\xE1lido \u2014 "${to}"`);
    return;
  }
  try {
    const response = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${env.RESEND_API_KEY}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        from: "Santu\xE1rio de F\xE1tima <noreply@mail.santuariodefatima.com.br>",
        to: [to],
        subject,
        html
      })
    });
    const result = await response.json();
    if (response.ok) {
      console.log(`\u2705 Email enviado para: ${to}`);
    } else {
      console.error(`\u274C Resend erro: ${JSON.stringify(result)}`);
    }
  } catch (e) {
    console.error("\u274C sendEmail exception:", e.message);
  }
}
__name(sendEmail, "sendEmail");
async function sendLoginLogEmail(env, user, request) {
  try {
    const ua = request.headers.get("User-Agent") || "";
    const ip = request.headers.get("CF-Connecting-IP") || "desconhecido";
    const isMobile = /Mobile|Android|iPhone|iPad/i.test(ua);
    const browser = ua.includes("Edg") ? "Edge" : ua.includes("Chrome") ? "Chrome" : ua.includes("Firefox") ? "Firefox" : ua.includes("Safari") ? "Safari" : "Outro";
    const os = ua.includes("Windows") ? "Windows" : ua.includes("Mac") ? "macOS" : ua.includes("Android") ? "Android" : ua.includes("iPhone") || ua.includes("iPad") ? "iOS" : ua.includes("Linux") ? "Linux" : "Outro";
    const agora = (/* @__PURE__ */ new Date()).toLocaleString("pt-BR", {
      timeZone: "America/Sao_Paulo",
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit"
    });
    let cidade = "desconhecida";
    let estado = "";
    let pais = "BR";
    try {
      const geoRes = await fetch(`http://ip-api.com/json/${ip}?lang=pt-BR&fields=city,regionName,country,countryCode`);
      if (geoRes.ok) {
        const geo = await geoRes.json();
        cidade = geo.city || "desconhecida";
        estado = geo.regionName || "";
        pais = geo.country || "Brasil";
      }
    } catch (geoErr) {
      console.warn("\u26A0\uFE0F Geo lookup falhou:", geoErr.message);
    }
    const localizacao = estado ? `${cidade} \u2014 ${estado}, ${pais}` : `${cidade} \u2014 ${pais}`;
    await sendEmail(
      env,
      user.email,
      `\u{1F510} Acesso ao Painel Admin \u2014 ${agora}`,
      `<div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;">
        <div style="background:#0d2a5c;padding:20px;text-align:center;">
          <h2 style="color:white;margin:0;">\u{1F510} Log de Acesso \u2014 Painel Admin</h2>
          <p style="color:#aac4ff;margin:8px 0 0;font-size:13px;">Santu\xE1rio de F\xE1tima</p>
        </div>
        <div style="padding:24px;background:#f9f9f9;">
          <table style="width:100%;border-collapse:collapse;background:white;border-radius:8px;overflow:hidden;box-shadow:0 2px 8px rgba(0,0,0,0.08);">
            <tr style="border-bottom:1px solid #eee;">
              <td style="padding:12px 16px;font-weight:bold;color:#0d2a5c;width:40%;">\u{1F464} Usu\xE1rio</td>
              <td style="padding:12px 16px;">${user.nome}</td>
            </tr>
            <tr style="border-bottom:1px solid #eee;background:#f9f9f9;">
              <td style="padding:12px 16px;font-weight:bold;color:#0d2a5c;">\u{1F4E7} E-mail</td>
              <td style="padding:12px 16px;">${user.email}</td>
            </tr>
            <tr style="border-bottom:1px solid #eee;">
              <td style="padding:12px 16px;font-weight:bold;color:#0d2a5c;">\u{1F4C5} Data/Hora</td>
              <td style="padding:12px 16px;">${agora}</td>
            </tr>
            <tr style="border-bottom:1px solid #eee;background:#f9f9f9;">
              <td style="padding:12px 16px;font-weight:bold;color:#0d2a5c;">\u{1F310} IP</td>
              <td style="padding:12px 16px;">${ip}</td>
            </tr>
            <tr style="border-bottom:1px solid #eee;">
              <td style="padding:12px 16px;font-weight:bold;color:#0d2a5c;">\u{1F4CD} Localiza\xE7\xE3o</td>
              <td style="padding:12px 16px;">${localizacao}</td>
            </tr>
            <tr style="border-bottom:1px solid #eee;background:#f9f9f9;">
              <td style="padding:12px 16px;font-weight:bold;color:#0d2a5c;">${isMobile ? "\u{1F4F1}" : "\u{1F5A5}\uFE0F"} Dispositivo</td>
              <td style="padding:12px 16px;">${isMobile ? "Celular" : "Desktop"} \u2014 ${os}</td>
            </tr>
            <tr>
              <td style="padding:12px 16px;font-weight:bold;color:#0d2a5c;">\u{1F30D} Navegador</td>
              <td style="padding:12px 16px;">${browser}</td>
            </tr>
          </table>
          <div style="margin-top:20px;padding:15px;background:#fff3cd;border-radius:8px;border-left:4px solid #ffc107;">
            <p style="margin:0;font-size:13px;color:#856404;">
              \u26A0\uFE0F <strong>N\xE3o foi voc\xEA?</strong> Troque sua senha imediatamente!
            </p>
          </div>
          <div style="margin-top:12px;padding:12px;background:#d4edda;border-radius:8px;border-left:4px solid #28a745;">
            
          </div>
        </div>
        <div style="padding:16px;text-align:center;color:#999;font-size:12px;">
          Santu\xE1rio Nossa Senhora de F\xE1tima \u2014 Santo Amaro, S\xE3o Paulo
        </div>
      </div>`
    );
  } catch (err) {
    console.error("\u274C Erro ao enviar log de acesso:", err.message);
  }
}
__name(sendLoginLogEmail, "sendLoginLogEmail");
async function sendLoginLogEmailFiel(env, user, request) {
  try {
    const ua = request.headers.get("User-Agent") || "";
    const ip = request.headers.get("CF-Connecting-IP") || "desconhecido";
    const isMobile = /Mobile|Android|iPhone|iPad/i.test(ua);
    const browser = ua.includes("Edg") ? "Edge" : ua.includes("Chrome") ? "Chrome" : ua.includes("Firefox") ? "Firefox" : ua.includes("Safari") ? "Safari" : "Outro";
    const os = ua.includes("Windows") ? "Windows" : ua.includes("Mac") ? "macOS" : ua.includes("Android") ? "Android" : ua.includes("iPhone") || ua.includes("iPad") ? "iOS" : ua.includes("Linux") ? "Linux" : "Outro";
    const agora = (/* @__PURE__ */ new Date()).toLocaleString("pt-BR", {
      timeZone: "America/Sao_Paulo",
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit"
    });
    let cidade = "desconhecida";
    let estado = "";
    let pais = "Brasil";
    try {
      const geoRes = await fetch(`http://ip-api.com/json/${ip}?lang=pt-BR&fields=city,regionName,country`);
      if (geoRes.ok) {
        const geo = await geoRes.json();
        cidade = geo.city || "desconhecida";
        estado = geo.regionName || "";
        pais = geo.country || "Brasil";
      }
    } catch (e) {
      console.warn("\u26A0\uFE0F Geo lookup falhou:", e.message);
    }
    const localizacao = estado ? `${cidade} \u2014 ${estado}, ${pais}` : `${cidade} \u2014 ${pais}`;
    await sendEmail(
      env,
      user.email,
      `\u2705 Novo acesso \xE0 sua conta \u2014 ${agora}`,
      `<div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;">
        <div style="background:#0d2a5c;padding:20px;text-align:center;">
          <h2 style="color:white;margin:0;">\u2705 Acesso Realizado</h2>
          <p style="color:#aac4ff;margin:8px 0 0;font-size:13px;">Santu\xE1rio de F\xE1tima \u2014 Minha Conta</p>
        </div>
        <div style="padding:24px;background:#f9f9f9;">
          <p style="color:#333;margin:0 0 20px;">Ol\xE1 <strong>${user.nome}</strong>, registramos um novo acesso \xE0 sua conta.</p>
          <table style="width:100%;border-collapse:collapse;background:white;border-radius:8px;overflow:hidden;box-shadow:0 2px 8px rgba(0,0,0,0.08);">
            <tr style="border-bottom:1px solid #eee;">
              <td style="padding:12px 16px;font-weight:bold;color:#0d2a5c;width:40%;">\u{1F4C5} Data/Hora</td>
              <td style="padding:12px 16px;">${agora}</td>
            </tr>
            <tr style="border-bottom:1px solid #eee;background:#f9f9f9;">
              <td style="padding:12px 16px;font-weight:bold;color:#0d2a5c;">\u{1F310} IP</td>
              <td style="padding:12px 16px;">${ip}</td>
            </tr>
            <tr style="border-bottom:1px solid #eee;">
              <td style="padding:12px 16px;font-weight:bold;color:#0d2a5c;">\u{1F4CD} Localiza\xE7\xE3o</td>
              <td style="padding:12px 16px;">${localizacao}</td>
            </tr>
            <tr style="border-bottom:1px solid #eee;background:#f9f9f9;">
              <td style="padding:12px 16px;font-weight:bold;color:#0d2a5c;">${isMobile ? "\u{1F4F1}" : "\u{1F5A5}\uFE0F"} Dispositivo</td>
              <td style="padding:12px 16px;">${isMobile ? "Celular" : "Desktop"} \u2014 ${os}</td>
            </tr>
            <tr>
              <td style="padding:12px 16px;font-weight:bold;color:#0d2a5c;">\u{1F30D} Navegador</td>
              <td style="padding:12px 16px;">${browser}</td>
            </tr>
          </table>
          <div style="margin-top:20px;padding:15px;background:#fff3cd;border-radius:8px;border-left:4px solid #ffc107;">
            <p style="margin:0;font-size:13px;color:#856404;">
              \u26A0\uFE0F <strong>N\xE3o foi voc\xEA?</strong> Troque sua senha imediatamente em <a href="${env.FRONTEND_URL || "https://santuariodefatima.com.br"}/minha-conta" style="color:#856404;">Minha Conta</a>.
            </p>
          </div>
        </div>
        <div style="padding:16px;text-align:center;color:#999;font-size:12px;">
          Santu\xE1rio Nossa Senhora de F\xE1tima \u2014 Santo Amaro, S\xE3o Paulo
        </div>
      </div>`
    );
  } catch (err) {
    console.error("\u274C Erro ao enviar log fiel:", err.message);
  }
}
__name(sendLoginLogEmailFiel, "sendLoginLogEmailFiel");
function getFrontendUrl(env) {
  return (env.FRONTEND_URL || "https://santuariodefatima.com.br").replace(/\/$/, "");
}
__name(getFrontendUrl, "getFrontendUrl");
function validarEmail(email) {
  return email && email.includes("@") && email.length <= 255;
}
__name(validarEmail, "validarEmail");
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
  if (!firewall(request)) return new Response("Blocked", { status: 403 });
  try {
    const body = await request.json();
    const { email, senha } = body;
    if (!email || !senha) {
      return jsonResponse({ success: false, error: "Preencha todos os campos" });
    }
    const emailNorm = email.toLowerCase().trim();
    const rateLimitResponse = await applyRateLimit(request, env, emailNorm);
    if (rateLimitResponse) return rateLimitResponse;
    const user = await env.DB.prepare(
      `SELECT id, nome, email, senha_hash, role, twofa_enabled, twofa_secret,
              backup_codes, celular, failed_attempts, locked_until
       FROM users WHERE LOWER(email) = ?`
    ).bind(emailNorm).first();
    if (!user) return jsonResponse({ success: false, error: "E-mail ou senha inv\xE1lidos" });
    if (user.locked_until && user.locked_until > Date.now()) {
      const waitMinutes = Math.ceil((user.locked_until - Date.now()) / 6e4);
      return jsonResponse({ success: false, error: `Conta bloqueada. Tente novamente em ${waitMinutes} minutos.` });
    }
    const senhaOk = await verificarSenha(senha, user.senha_hash);
    if (!senhaOk) {
      const newAttempts = (user.failed_attempts || 0) + 1;
      const lockUntil = newAttempts >= 5 ? Date.now() + 15 * 60 * 1e3 : 0;
      await env.DB.prepare(
        `UPDATE users SET failed_attempts = ?, locked_until = ? WHERE id = ?`
      ).bind(newAttempts, lockUntil, user.id).run();
      return jsonResponse({ success: false, error: "E-mail ou senha inv\xE1lidos" });
    }
    await env.DB.prepare(
      `UPDATE users SET failed_attempts = 0, locked_until = 0 WHERE id = ?`
    ).bind(user.id).run();
    const pin = generatePIN();
    const pinHash = await sha256(pin);
    const pinExpiry = Date.now() + 10 * 60 * 1e3;
    await env.DB.prepare(
      `UPDATE users SET login_pin = ?, login_pin_expires = ?, last_login_at = ? WHERE id = ?`
    ).bind(pinHash, pinExpiry, Date.now(), user.id).run();
    const nome = user.nome || "Usu\xE1rio";
    await sendEmail(
      env,
      user.email,
      "Seu c\xF3digo de acesso - Santu\xE1rio de F\xE1tima",
      `<div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;">
        <div style="background:#0d2a5c;padding:20px;text-align:center;">
          <h2 style="color:white;margin:0;">\u{1F510} C\xF3digo de Acesso</h2>
        </div>
        <div style="padding:24px;">
          <p>Ol\xE1 <strong>${nome}</strong>,</p>
          <p>Seu c\xF3digo de verifica\xE7\xE3o \xE9:</p>
          <p style="font-size:32px;font-weight:bold;text-align:center;letter-spacing:8px;background:#f5f5f5;padding:20px;border-radius:8px;">${pin}</p>
          <p>V\xE1lido por <strong>10 minutos</strong>.</p>
          <p style="color:#999;font-size:12px;">Se n\xE3o foi voc\xEA, ignore este e-mail.</p>
        </div>
      </div>`
    );
    return jsonResponse({
      success: true,
      nextStep: "pin",
      userId: user.id,
      email: user.email,
      nome,
      role: user.role,
      isAdmin: user.role === "admin",
      has2FA: user.twofa_enabled === 1
    });
  } catch (err) {
    console.error("\u274C fielLoginRoute:", err);
    return jsonResponse({ success: false, error: "Erro interno: " + err.message }, 500);
  }
}
__name(fielLoginRoute, "fielLoginRoute");
async function fielRegisterRoute(request, env) {
  try {
    const body = await request.json();
    const { nome, email, senha, celular } = body;
    if (!nome || !email || !senha) {
      return jsonResponse({ success: false, error: "Preencha todos os campos obrigat\xF3rios" });
    }
    if (!validarEmail(email)) return jsonResponse({ success: false, error: "E-mail inv\xE1lido" });
    if (!validarCelular(celular)) return jsonResponse({ success: false, error: "Celular inv\xE1lido (com DDD, m\xEDnimo 10 d\xEDgitos)" });
    const senhaValidation = validarSenha(senha);
    if (!senhaValidation.isValid) {
      return jsonResponse({ success: false, error: "Senha fraca. Use mai\xFAsculas, min\xFAsculas, n\xFAmeros e caracteres especiais." });
    }
    const emailNorm = email.toLowerCase().trim();
    const existe = await env.DB.prepare(
      "SELECT id FROM users WHERE LOWER(email) = ?"
    ).bind(emailNorm).first();
    if (existe) return jsonResponse({ success: false, error: "E-mail j\xE1 cadastrado" });
    const senha_hash = await sha256(senha);
    const id = crypto.randomUUID();
    await env.DB.prepare(
      `INSERT INTO users (id, nome, email, senha_hash, celular, role, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, 'fiel', ?, ?)`
    ).bind(
      id,
      nome.trim(),
      emailNorm,
      senha_hash,
      celular.replace(/\D/g, ""),
      Date.now(),
      Date.now()
    ).run();
    return jsonResponse({ success: true, message: "Cadastro realizado com sucesso!" });
  } catch (err) {
    console.error("\u274C fielRegisterRoute:", err);
    return jsonResponse({ success: false, error: "Erro interno: " + err.message }, 500);
  }
}
__name(fielRegisterRoute, "fielRegisterRoute");
async function fielVerificarRoute(request, env) {
  try {
    const authHeader = request.headers.get("Authorization");
    const token = authHeader?.replace("Bearer ", "");
    if (!token) return jsonResponse({ success: false, error: "Token n\xE3o fornecido" }, 401);
    const hash = await hashToken(token);
    const sessionData = await env.KV_SESSION.get(`sess:${hash}`, "json");
    if (!sessionData || sessionData.expires < Date.now()) {
      return jsonResponse({ success: false, error: "Token inv\xE1lido ou expirado" }, 401);
    }
    return jsonResponse({ success: true, user: sessionData.user });
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
    if (!userId || !pin) return jsonResponse({ success: false, error: "Dados incompletos" });
    const rateLimitResponse = await applyRateLimit(request, env, String(userId));
    if (rateLimitResponse) return rateLimitResponse;
    const user = await env.DB.prepare(
      `SELECT id, nome, email, login_pin, login_pin_expires, twofa_enabled, twofa_secret, role,
              failed_2fa_attempts, twofa_locked_until
       FROM users WHERE id = ?`
    ).bind(userId).first();
    if (!user) return jsonResponse({ success: false, error: "Usu\xE1rio n\xE3o encontrado" });
    if (user.twofa_locked_until && user.twofa_locked_until > Date.now()) {
      const wait = Math.ceil((user.twofa_locked_until - Date.now()) / 6e4);
      return jsonResponse({ success: false, error: `Muitas tentativas. Tente novamente em ${wait} minutos.` });
    }
    if (!user.login_pin) return jsonResponse({ success: false, error: "Nenhum PIN ativo. Solicite um novo." });
    if (Date.now() > user.login_pin_expires) return jsonResponse({ success: false, error: "PIN expirado. Solicite um novo." });
    const pinHash = await sha256(pin);
    if (user.login_pin !== pinHash) {
      const attempts = (user.failed_2fa_attempts || 0) + 1;
      const lockTime = attempts >= 8 ? Date.now() + 15 * 60 * 1e3 : attempts >= 5 ? Date.now() + 5 * 60 * 1e3 : 0;
      await env.DB.prepare(
        `UPDATE users SET failed_2fa_attempts = ?, twofa_locked_until = ? WHERE id = ?`
      ).bind(attempts, lockTime, user.id).run();
      return jsonResponse({ success: false, error: "PIN inv\xE1lido" });
    }
    await env.DB.prepare(
      `UPDATE users SET failed_2fa_attempts = 0, twofa_locked_until = 0,
                        login_pin = NULL, login_pin_expires = NULL WHERE id = ?`
    ).bind(user.id).run();
    if (celular && validarCelular(celular)) {
      await env.DB.prepare(
        `UPDATE users SET celular = ? WHERE id = ? AND (celular IS NULL OR celular = '')`
      ).bind(celular.replace(/\D/g, ""), user.id).run();
    }
    if (user.twofa_secret && user.twofa_enabled === 1) {
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
    const qrCodeUrl = `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(otpauth)}`;
    const backupCodes = generateBackupCodes();
    const hashedBackupCodes = await Promise.all(backupCodes.map((c) => sha256(c)));
    await env.DB.prepare(
      `UPDATE users SET twofa_secret = ?, twofa_enabled = 0, backup_codes = ? WHERE id = ?`
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
    if (!user) return jsonResponse({ success: false, error: "Usu\xE1rio n\xE3o encontrado" });
    const pin = generatePIN();
    const pinHash = await sha256(pin);
    const expiry = Date.now() + 10 * 60 * 1e3;
    await env.DB.prepare(
      `UPDATE users SET login_pin = ?, login_pin_expires = ? WHERE id = ?`
    ).bind(pinHash, expiry, userId).run();
    await sendEmail(
      env,
      user.email,
      "Novo c\xF3digo de acesso - Santu\xE1rio de F\xE1tima",
      `<div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;">
        <div style="background:#0d2a5c;padding:20px;text-align:center;">
          <h2 style="color:white;margin:0;">\u{1F504} Novo C\xF3digo de Acesso</h2>
        </div>
        <div style="padding:24px;">
          <p>Ol\xE1 <strong>${user.nome}</strong>,</p>
          <p>Seu novo c\xF3digo \xE9:</p>
          <p style="font-size:32px;font-weight:bold;text-align:center;letter-spacing:8px;background:#f5f5f5;padding:20px;border-radius:8px;">${pin}</p>
          <p>V\xE1lido por <strong>10 minutos</strong>.</p>
        </div>
      </div>`
    );
    return jsonResponse({ success: true, message: "Novo PIN enviado!" });
  } catch (err) {
    console.error("\u274C fielReenviarPinRoute:", err);
    return jsonResponse({ success: false, error: "Erro interno: " + err.message }, 500);
  }
}
__name(fielReenviarPinRoute, "fielReenviarPinRoute");
async function fielSetup2faRoute(request, env) {
  return jsonResponse({ success: true });
}
__name(fielSetup2faRoute, "fielSetup2faRoute");
async function fielVerify2faRoute(request, env) {
  try {
    const body = await request.json();
    const { userId, codigo2FA } = body;
    if (!codigo2FA || !/^\d{6}$/.test(codigo2FA)) {
      return jsonResponse({ success: false, error: "C\xF3digo de 6 d\xEDgitos obrigat\xF3rio" });
    }
    const rateLimitResponse = await applyRateLimit(request, env, String(userId));
    if (rateLimitResponse) return rateLimitResponse;
    const user = await env.DB.prepare(
      `SELECT id, nome, email, twofa_secret, twofa_enabled, role,
              failed_2fa_attempts, twofa_locked_until
       FROM users WHERE id = ?`
    ).bind(userId).first();
    if (!user) return jsonResponse({ success: false, error: "Usu\xE1rio n\xE3o encontrado" });
    if (!user.twofa_secret) return jsonResponse({ success: false, error: "2FA n\xE3o configurado" });
    if (user.twofa_locked_until && user.twofa_locked_until > Date.now()) {
      const wait = Math.ceil((user.twofa_locked_until - Date.now()) / 6e4);
      return jsonResponse({ success: false, error: `Muitas tentativas. Tente novamente em ${wait} minutos.` });
    }
    const valid = await validateTOTP(user.twofa_secret, codigo2FA);
    if (!valid) {
      const attempts = (user.failed_2fa_attempts || 0) + 1;
      const lockTime = attempts >= 8 ? Date.now() + 15 * 60 * 1e3 : attempts >= 5 ? Date.now() + 5 * 60 * 1e3 : 0;
      await env.DB.prepare(
        `UPDATE users SET failed_2fa_attempts = ?, twofa_locked_until = ? WHERE id = ?`
      ).bind(attempts, lockTime, user.id).run();
      return jsonResponse({ success: false, error: "C\xF3digo 2FA inv\xE1lido" });
    }
    await env.DB.prepare(
      `UPDATE users SET failed_2fa_attempts = 0, twofa_locked_until = 0,
                        twofa_enabled = 1 WHERE id = ?`
    ).bind(user.id).run();
    if (user.role === "admin") {
      await sendLoginLogEmail(env, user, request);
    } else {
      await sendLoginLogEmailFiel(env, user, request);
    }
    const { token, expiresAt } = await createSession(env, user, request);
    const role = user.role || "fiel";
    return jsonResponse({
      success: true,
      token,
      expiresAt,
      user: { id: user.id, nome: user.nome, email: user.email, role },
      redirectTo: role === "admin" ? "/paineladmin" : "/paineldofiel",
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
    const rateLimitResponse = await applyRateLimit(request, env, emailNorm);
    if (rateLimitResponse) return rateLimitResponse;
    const user = await env.DB.prepare(
      "SELECT id, nome, email FROM users WHERE LOWER(email) = ?"
    ).bind(emailNorm).first();
    if (!user) {
      return jsonResponse({ success: true, message: "Se o e-mail estiver cadastrado, voc\xEA receber\xE1 o link." });
    }
    const rawToken = crypto.randomUUID();
    const tokenHash = await sha256(rawToken);
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
    ).bind(user.id, tokenHash, expiresAt).run();
    const frontendUrl = getFrontendUrl(env);
    const link = `${frontendUrl}/sanctum?reset_token=${rawToken}&userId=${user.id}`;
    await sendEmail(
      env,
      user.email,
      "\u{1F511} Recupera\xE7\xE3o de Senha - Santu\xE1rio de F\xE1tima",
      `<div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;">
        <div style="background:#0d2a5c;padding:20px;text-align:center;">
          <h2 style="color:white;margin:0;">\u{1F511} Redefini\xE7\xE3o de Senha</h2>
        </div>
        <div style="padding:24px;">
          <p>Ol\xE1 <strong>${user.nome}</strong>,</p>
          <p>Clique no bot\xE3o abaixo para criar uma nova senha:</p>
          <div style="text-align:center;margin:32px 0;">
            <a href="${link}" style="background:#0d2a5c;color:white;padding:14px 28px;text-decoration:none;border-radius:8px;font-size:16px;">
              \u{1F511} Redefinir minha senha
            </a>
          </div>
          <p>\u23F1\uFE0F V\xE1lido por <strong>1 hora</strong>.</p>
          <p style="color:#999;font-size:12px;word-break:break-all;">Link direto: ${link}</p>
        </div>
      </div>`
    );
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
    const rateLimitResponse = await applyRateLimit(request, env, String(userId));
    if (rateLimitResponse) return rateLimitResponse;
    const tokenHash = await sha256(token);
    const record = await env.DB.prepare(
      "SELECT * FROM reset_tokens WHERE token = ? AND used = 0"
    ).bind(tokenHash).first();
    if (!record) return jsonResponse({ success: false, error: "Token inv\xE1lido ou j\xE1 utilizado" });
    if (String(record.user_id) !== String(userId)) return jsonResponse({ success: false, error: "Token inv\xE1lido" });
    if (Date.now() > record.expires_at) {
      await env.DB.prepare("DELETE FROM reset_tokens WHERE token = ?").bind(tokenHash).run();
      return jsonResponse({ success: false, error: "Token expirado" });
    }
    const senhaValidation = validarSenha(novaSenha);
    if (!senhaValidation.isValid) {
      return jsonResponse({ success: false, error: "Senha fraca. Use mai\xFAsculas, min\xFAsculas, n\xFAmeros e caracteres especiais." });
    }
    const senha_hash = await sha256(novaSenha);
    await env.DB.prepare(
      `UPDATE users SET senha_hash = ?, updated_at = ? WHERE id = ?`
    ).bind(senha_hash, Date.now(), userId).run();
    await env.DB.prepare("UPDATE reset_tokens SET used = 1 WHERE token = ?").bind(tokenHash).run();
    await env.DB.prepare("DELETE FROM reset_tokens WHERE token = ?").bind(tokenHash).run();
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
    if (!email) return jsonResponse({ success: false, error: "E-mail obrigat\xF3rio" });
    const emailNorm = email.toLowerCase().trim();
    const rateLimitResponse = await applyRateLimit(request, env, emailNorm);
    if (rateLimitResponse) return rateLimitResponse;
    const user = await env.DB.prepare(
      "SELECT id, nome, email FROM users WHERE LOWER(email) = ?"
    ).bind(emailNorm).first();
    if (!user) return jsonResponse({ success: false, error: "Usu\xE1rio n\xE3o encontrado" });
    const rawToken = crypto.randomUUID();
    const tokenHash = await sha256(rawToken);
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
    ).bind(user.id, tokenHash, expiresAt).run();
    const frontendUrl = getFrontendUrl(env);
    const link = `${frontendUrl}/sanctum?reset2fa=${rawToken}`;
    await sendEmail(
      env,
      user.email,
      "\u{1F510} Recupera\xE7\xE3o de 2FA - Santu\xE1rio de F\xE1tima",
      `<div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;">
        <div style="background:#0d2a5c;padding:20px;text-align:center;">
          <h2 style="color:white;margin:0;">\u{1F510} Recupera\xE7\xE3o de 2FA</h2>
        </div>
        <div style="padding:24px;">
          <p>Ol\xE1 <strong>${user.nome}</strong>,</p>
          <p>Clique abaixo para remover o 2FA da sua conta:</p>
          <div style="text-align:center;margin:24px 0;">
            <a href="${link}" style="background:#7c3aed;color:white;padding:14px 28px;text-decoration:none;border-radius:8px;font-size:16px;">
              \u{1F513} Remover 2FA
            </a>
          </div>
          <p>\u23F1\uFE0F V\xE1lido por <strong>10 minutos</strong>.</p>
          <p style="color:#ef4444;font-size:13px;">\u26A0\uFE0F Se n\xE3o foi voc\xEA, troque sua senha imediatamente!</p>
          <p style="color:#999;font-size:12px;word-break:break-all;">Link direto: ${link}</p>
        </div>
      </div>`
    );
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
    if (!token) return jsonResponse({ success: false, error: "Token obrigat\xF3rio" });
    const rateLimitResponse = await applyRateLimit(request, env, token.slice(0, 16));
    if (rateLimitResponse) return rateLimitResponse;
    const tokenHash = await sha256(token);
    const record = await env.DB.prepare(
      "SELECT * FROM two_factor_reset_tokens WHERE token = ?"
    ).bind(tokenHash).first();
    if (!record) return jsonResponse({ success: false, error: "Token inv\xE1lido" });
    if (Date.now() > record.expires_at) {
      await env.DB.prepare("DELETE FROM two_factor_reset_tokens WHERE token = ?").bind(tokenHash).run();
      return jsonResponse({ success: false, error: "Token expirado" });
    }
    await env.DB.prepare(
      `UPDATE users SET twofa_enabled = 0, twofa_secret = NULL, backup_codes = NULL WHERE id = ?`
    ).bind(record.user_id).run();
    await env.DB.prepare("DELETE FROM two_factor_reset_tokens WHERE token = ?").bind(tokenHash).run();
    return jsonResponse({ success: true, message: "2FA removido! Configure novamente no pr\xF3ximo login." });
  } catch (err) {
    console.error("\u274C fielConfirmarReset2faRoute:", err);
    return jsonResponse({ success: false, error: "Erro interno: " + err.message }, 500);
  }
}
__name(fielConfirmarReset2faRoute, "fielConfirmarReset2faRoute");
async function fielLogoutRoute(request, env) {
  try {
    const authHeader = request.headers.get("Authorization");
    const token = authHeader?.replace("Bearer ", "");
    if (token) {
      const hash = await hashToken(token);
      await env.KV_SESSION.delete(`sess:${hash}`);
    }
    return jsonResponse({ success: true, message: "Logout realizado com sucesso" });
  } catch (err) {
    console.error("\u274C fielLogoutRoute:", err);
    return jsonResponse({ success: false, error: "Erro interno: " + err.message }, 500);
  }
}
__name(fielLogoutRoute, "fielLogoutRoute");

// src/controllers/auth_shared.js
async function sha2562(text) {
  const encoder2 = new TextEncoder();
  const data = encoder2.encode(text);
  const hashBuffer = await crypto.subtle.digest("SHA-256", data);
  return [...new Uint8Array(hashBuffer)].map((b) => b.toString(16).padStart(2, "0")).join("");
}
__name(sha2562, "sha256");
async function verificarSenha2(senha, hash) {
  const hashed = await sha2562(senha);
  return hashed === hash;
}
__name(verificarSenha2, "verificarSenha");

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
async function handleAdminDados(request, env, user) {
  console.log("\u{1F535} handleAdminDados chamado - user:", user?.email);
  if (!user) {
    return jsonResponse({ success: false, error: "N\xE3o autorizado" }, 401);
  }
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
async function handleAdminSalvarDados(request, env, user, body) {
  console.log("\u{1F7E2} handleAdminSalvarDados chamado - user:", user?.email);
  if (!user) {
    return jsonResponse({ success: false, error: "N\xE3o autorizado" }, 401);
  }
  if (!body) {
    return jsonResponse({ success: false, error: "Dados n\xE3o recebidos" }, 400);
  }
  try {
    if (body.carrossel !== void 0) {
      await env.KV_FILES.put("santuario_carrossel", JSON.stringify(body.carrossel));
    }
    if (body.popups !== void 0) {
      await env.KV_FILES.put("santuario_popups", JSON.stringify(body.popups));
    }
    if (body.recados !== void 0) {
      await env.KV_FILES.put("santuario_recados", JSON.stringify(body.recados));
    }
    if (Array.isArray(body.horariosMissas)) {
      await env.KV_MISSAS.put("horariosMissas", JSON.stringify(body.horariosMissas));
    }
    if (body.momentosLiturgicos !== void 0) {
      await env.KV_LITURGIA.put("momentos", JSON.stringify(body.momentosLiturgicos));
    }
    if (body.arquivosDownload !== void 0) {
      await env.KV_FILES.put("santuario_arquivos", JSON.stringify(body.arquivosDownload));
    }
    console.log("\u2705 Dados salvos com sucesso por:", user.email);
    return jsonResponse({ success: true, message: "Dados salvos com sucesso!" });
  } catch (error) {
    console.error("\u274C Erro ao salvar:", error);
    return jsonResponse({ success: false, error: "Erro ao salvar dados" }, 500);
  }
}
__name(handleAdminSalvarDados, "handleAdminSalvarDados");
async function handleAdminPerfil(request, env, user) {
  if (!user) {
    return jsonResponse({ success: false, error: "N\xE3o autorizado" }, 401);
  }
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
async function handleAdminAtualizarPerfil(request, env, user, body) {
  if (!user) {
    return jsonResponse({ success: false, error: "N\xE3o autorizado" }, 401);
  }
  if (!body) {
    return jsonResponse({ success: false, error: "Dados n\xE3o recebidos" }, 400);
  }
  try {
    const { nome, email } = body;
    await env.DB.prepare(`
      UPDATE users SET nome = ?, email = ? WHERE id = ?
    `).bind(
      nome || user.nome,
      email || user.email,
      user.id
    ).run();
    return jsonResponse({ success: true, message: "Perfil atualizado!" });
  } catch (error) {
    console.error("\u274C Erro ao atualizar perfil:", error);
    return jsonResponse({ success: false, error: "Erro ao atualizar perfil" }, 500);
  }
}
__name(handleAdminAtualizarPerfil, "handleAdminAtualizarPerfil");
async function handleAdminAlterarSenha(request, env, user, body) {
  if (!user) {
    return jsonResponse({ success: false, error: "N\xE3o autorizado" }, 401);
  }
  if (!body) {
    return jsonResponse({ success: false, error: "Dados n\xE3o recebidos" }, 400);
  }
  try {
    const { senha_atual, nova_senha } = body;
    const dbUser = await env.DB.prepare(`
      SELECT senha_hash FROM users WHERE id = ?
    `).bind(user.id).first();
    if (!dbUser) {
      return jsonResponse({ success: false, error: "Usu\xE1rio n\xE3o encontrado" }, 404);
    }
    const senhaOk = await verificarSenha2(senha_atual, dbUser.senha_hash);
    if (!senhaOk) {
      return jsonResponse({ success: false, error: "Senha atual incorreta" }, 400);
    }
    if (!nova_senha || nova_senha.length < 6) {
      return jsonResponse({ success: false, error: "Nova senha fraca" }, 400);
    }
    const novaHash = await sha2562(nova_senha);
    await env.DB.prepare(`
      UPDATE users SET senha_hash = ? WHERE id = ?
    `).bind(novaHash, user.id).run();
    return jsonResponse({ success: true, message: "Senha alterada com sucesso!" });
  } catch (error) {
    console.error("\u274C Erro ao alterar senha:", error);
    return jsonResponse({ success: false, error: "Erro ao alterar senha" }, 500);
  }
}
__name(handleAdminAlterarSenha, "handleAdminAlterarSenha");

// index.js
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
function secureResponse(response, request) {
  return addCorsHeaders(addSecurityHeaders(response), request);
}
__name(secureResponse, "secureResponse");
var PUBLIC_ROUTES = [
  "/api/auth/login",
  "/api/auth/register",
  "/api/auth/esqueci-senha",
  "/api/auth/confirmar-reset-senha",
  "/api/auth/solicitar-reset-2fa",
  "/api/auth/confirmar-reset-2fa",
  "/api/contato/enviar",
  "/api/health",
  "/",
  "/api"
];
var ADMIN_ROUTES_SET = /* @__PURE__ */ new Set([
  "/api/admin/verificar",
  "/api/admin/dados",
  "/api/admin/perfil",
  "/api/admin/alterar-senha"
]);
var index_default = {
  async fetch(request, env, ctx) {
    const requestId = createRequestId();
    const url = new URL(request.url);
    const pathname = url.pathname.trim();
    const clientIP = getClientIP(request);
    const userAgent = request.headers.get("User-Agent") || "unknown";
    logStructured("info", "Request recebida", { requestId, method: request.method, pathname, ip: clientIP });
    if (!["GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"].includes(request.method)) {
      return secureResponse(new Response("Method Not Allowed", { status: 405 }), request);
    }
    const corsResponse = handleCorsOptions(request);
    if (corsResponse) return corsResponse;
    const payloadError = validatePayloadSize(request);
    if (payloadError) return secureResponse(payloadError, request);
    const isAuthPath = pathname.includes("/auth/login") || pathname.includes("/auth/verify") || pathname.includes("/auth/reset") || pathname.includes("/auth/esqueci") || pathname.includes("/auth/confirmar") || pathname.includes("/auth/reenviar") || pathname.includes("/auth/solicitar") || pathname.includes("/auth/register");
    if (isAuthPath) {
      const rateLimitResponse = await applyRateLimit(request, env, clientIP);
      if (rateLimitResponse) {
        await logAttack(env, { type: "rate_limit_auth", ip: clientIP, path: pathname, requestId });
        return secureResponse(rateLimitResponse, request);
      }
    }
    let context = { request, env, ip: clientIP, url, pathname, body: null, requestId };
    try {
      const wafBlock = await waf(context);
      if (wafBlock) {
        await logAttack(env, { type: "waf", ip: clientIP, path: pathname, userAgent, requestId });
        return secureResponse(wafBlock, request);
      }
      const ipRep = await checkIPReputation(clientIP, env);
      if (ipRep?.blocked) {
        await logAttack(env, { type: "ip_reputation", ip: clientIP, path: pathname, userAgent, requestId });
        return secureResponse(jsonResponse({ success: false, error: "IP bloqueado" }, 403), request);
      }
      const firewallAllowed = firewall(request);
      if (!firewallAllowed) {
        await logAttack(env, { type: "firewall", ip: clientIP, path: pathname, userAgent, requestId });
        return secureResponse(new Response("Blocked by firewall", { status: 403 }), request);
      }
      const isBot = detectBot(request, context);
      if (isBot) {
        await logAttack(env, { type: "bot", ip: clientIP, path: pathname, userAgent, requestId });
        return secureResponse(new Response("Bot detectado", { status: 403 }), request);
      }
      const needsBody = ["POST", "PUT", "PATCH"].includes(request.method);
      if (needsBody) {
        try {
          const clonedRequest = request.clone();
          const rawBody = await clonedRequest.json().catch(() => ({}));
          context.body = sanitizeInput(rawBody);
        } catch (e) {
        }
      }
      if (pathname === "/api/auth/login" && request.method === "POST") {
        return secureResponse(await fielLoginRoute(request, env, context.body), request);
      }
      if (pathname === "/api/auth/register" && request.method === "POST") {
        return secureResponse(await fielRegisterRoute(request, env, context.body), request);
      }
      if (pathname === "/api/auth/verificar" && request.method === "GET") {
        return secureResponse(await fielVerificarRoute(request, env), request);
      }
      if (pathname === "/api/auth/verify-pin" && request.method === "POST") {
        return secureResponse(await fielVerifyPinRoute(request, env, context.body), request);
      }
      if (pathname === "/api/auth/reenviar-pin" && request.method === "POST") {
        return secureResponse(await fielReenviarPinRoute(request, env, context.body), request);
      }
      if (pathname === "/api/auth/verify-2fa" && request.method === "POST") {
        return secureResponse(await fielVerify2faRoute(request, env, context.body), request);
      }
      if (pathname === "/api/auth/setup-2fa" && request.method === "POST") {
        return secureResponse(await fielSetup2faRoute(request, env, context.body), request);
      }
      if (pathname === "/api/auth/logout" && request.method === "POST") {
        return secureResponse(await fielLogoutRoute(request, env), request);
      }
      if (pathname === "/api/auth/esqueci-senha" && request.method === "POST") {
        return secureResponse(await fielEsqueciSenhaRoute(request, env, context.body), request);
      }
      if (pathname === "/api/auth/confirmar-reset-senha" && request.method === "POST") {
        return secureResponse(await fielConfirmarResetSenhaRoute(request, env, context.body), request);
      }
      if (pathname === "/api/auth/reset-2fa-backup" && request.method === "POST") {
        return secureResponse(await fielReset2faBackupRoute(request, env, context.body), request);
      }
      if (pathname === "/api/auth/solicitar-reset-2fa" && request.method === "POST") {
        return secureResponse(await fielSolicitarReset2faRoute(request, env, context.body), request);
      }
      if (pathname === "/api/auth/confirmar-reset-2fa" && request.method === "POST") {
        return secureResponse(await fielConfirmarReset2faRoute(request, env, context.body), request);
      }
      if (pathname === "/api/contato/enviar" && request.method === "POST") {
        try {
          const body = context.body;
          if (!env.RESEND_API_KEY) {
            return secureResponse(jsonResponse({ success: false, error: "RESEND_API_KEY n\xE3o configurada" }, 500), request);
          }
          ctx.waitUntil(sendContactConfirmationEmail(env, body));
          ctx.waitUntil(sendContactNotificationToSecretariat(env, body));
          return secureResponse(jsonResponse({ success: true, message: "Mensagem enviada com sucesso!" }), request);
        } catch (error) {
          logStructured("error", "Erro ao enviar contato", { error: error.message, requestId });
          return secureResponse(jsonResponse({ success: false, message: "Erro ao enviar mensagem" }, 500), request);
        }
      }
      const isAdminRoute = ADMIN_ROUTES_SET.has(pathname);
      let user = null;
      if (!PUBLIC_ROUTES.some((route) => pathname === route || pathname.startsWith(route + "?"))) {
        const authResult = await requireAuth({ request, env });
        if (authResult?.error) {
          await logAttack(env, { type: "auth_fail", ip: clientIP, path: pathname, userAgent, requestId });
          return secureResponse(authResult.response, request);
        }
        user = authResult.user;
      }
      if (isAdminRoute) {
        const roleCheck = await requireRole(user, ["admin"]);
        if (!roleCheck.allowed) {
          await logAttack(env, { type: "forbidden", ip: clientIP, path: pathname, user: user?.email, requestId });
          return secureResponse(jsonResponse({ success: false, error: "Acesso negado. Permiss\xE3o de administrador necess\xE1ria." }, 403), request);
        }
      }
      if (pathname === "/api/admin/verificar" && request.method === "GET") {
        if (!user) return secureResponse(jsonResponse({ success: false }, 401), request);
        return secureResponse(jsonResponse({
          success: true,
          user: { id: user.id, nome: user.nome, email: user.email, role: user.role, twofa_enabled: user.twofa_enabled }
        }), request);
      }
      if (pathname === "/api/admin/dados" && request.method === "GET") {
        return secureResponse(await handleAdminDados(request, env, user), request);
      }
      if (pathname === "/api/admin/dados" && request.method === "POST") {
        return secureResponse(await handleAdminSalvarDados(request, env, user, context.body), request);
      }
      if (pathname === "/api/admin/perfil" && request.method === "GET") {
        return secureResponse(await handleAdminPerfil(request, env, user), request);
      }
      if (pathname === "/api/admin/perfil" && request.method === "PUT") {
        return secureResponse(await handleAdminAtualizarPerfil(request, env, user, context.body), request);
      }
      if (pathname === "/api/admin/alterar-senha" && request.method === "PUT") {
        return secureResponse(await handleAdminAlterarSenha(request, env, user, context.body), request);
      }
      if (pathname === "/api/health") {
        return secureResponse(jsonResponse({ success: true, status: "healthy", timestamp: (/* @__PURE__ */ new Date()).toISOString() }), request);
      }
      if (pathname === "/" || pathname === "/api") {
        return secureResponse(jsonResponse({
          success: true,
          service: "Pani Di Grano API",
          version: "1.0.0",
          status: "online",
          timestamp: (/* @__PURE__ */ new Date()).toISOString()
        }), request);
      }
      return secureResponse(jsonResponse({ success: false, error: "Endpoint n\xE3o encontrado", path: pathname }, 404), request);
    } catch (err) {
      logStructured("error", "Erro interno no servidor", { error: err.message, stack: err.stack, requestId });
      return secureResponse(jsonResponse({ success: false, error: "Erro interno do servidor" }, 500), request);
    }
  },
  // Tarefa agendada (opcional)
  async scheduled(event, env, ctx) {
    console.log("\u{1F4C5} Tarefa agendada executada em:", (/* @__PURE__ */ new Date()).toISOString());
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

// .wrangler/tmp/bundle-5yCLoF/middleware-insertion-facade.js
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

// .wrangler/tmp/bundle-5yCLoF/middleware-loader.entry.ts
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
  middleware_loader_entry_default as default
};
//# sourceMappingURL=index.js.map
