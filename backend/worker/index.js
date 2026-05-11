// backend/worker/index.js
import { jsonResponse } from './src/utils/helpers.js';
import { handleCorsOptions, addCorsHeaders } from './src/utils/cors.js';
import { requireAuth, requireRole } from './src/middleware/auth.js';
import { firewall } from './src/middleware/firewall.js';
import { detectBot } from './src/middleware/bot-detector.js';
import { applyRateLimit } from './src/middleware/rate-limit.js';
import { waf } from './src/middleware/waf.js';
import { checkIPReputation } from './src/security/ip-reputation.js';
import { logAttack } from './src/middleware/attack-logger.js';
import { fingerprint } from './src/middleware/fingerprint.js';
import { riskEngine } from './src/middleware/risk-engine.js';
import { verifyCaptcha } from './src/middleware/captcha.js';
import { sanitizeInput, validatePayloadSize, fetchWithTimeout, createRequestId } from './src/utils/sanitize.js';
import { addSecurityHeaders } from './src/utils/headers.js';

// ============================================
// IMPORTS DE SERVIÇOS
// ============================================

import { sendContactConfirmationEmail, sendContactNotificationToSecretariat } from './src/utils/emails.js';

// ============================================
// AUTENTICAÇÃO
// ============================================

import {
  fielLoginRoute,
  fielRegisterRoute,
  fielVerificarRoute,
  fielVerifyPinRoute,
  fielReenviarPinRoute,
  fielVerify2faRoute,
  fielSetup2faRoute,
  fielEsqueciSenhaRoute,
  fielConfirmarResetSenhaRoute,
  fielReset2faBackupRoute,
  fielSolicitarReset2faRoute,
  fielConfirmarReset2faRoute,
  fielLogoutRoute
} from './src/routes/auth/fiel_auth.js';

// ============================================
// PAINEL ADMIN
// ============================================

import {
  handleAdminDados,
  handleAdminSalvarDados,
  handleAdminPerfil,
  handleAdminAtualizarPerfil,
  handleAdminAlterarSenha
} from './src/routes/admin/index.js';

// ============================================
// FUNÇÕES AUXILIARES
// ============================================

function formatTimeAgo(isoDate) {
  const diff = Date.now() - new Date(isoDate).getTime();
  const m = Math.floor(diff / 60000);
  if (m < 1) return 'agora';
  if (m < 60) return `há ${m} min`;
  const h = Math.floor(m / 60);
  if (h < 24) return `há ${h}h`;
  return `há ${Math.floor(h / 24)}d`;
}

function getClientIP(request) {
  return request.headers.get('CF-Connecting-IP') ||
    request.headers.get('X-Forwarded-For')?.split(',')[0] ||
    request.headers.get('X-Real-IP') ||
    'unknown';
}

function logStructured(level, message, data = {}) {
  const logEntry = {
    level,
    message,
    timestamp: new Date().toISOString(),
    requestId: data.requestId || 'unknown',
    ...data
  };
  if (level === 'error') {
    console.error(JSON.stringify(logEntry));
  } else if (level === 'warn') {
    console.warn(JSON.stringify(logEntry));
  } else {
    console.log(JSON.stringify(logEntry));
  }
}

function secureResponse(response, request) {
  return addCorsHeaders(addSecurityHeaders(response), request);
}

// ============================================
// ROTAS PÚBLICAS
// ============================================

const PUBLIC_ROUTES = [
  '/api/auth/login', '/api/auth/register', '/api/auth/esqueci-senha',
  '/api/auth/confirmar-reset-senha', '/api/auth/solicitar-reset-2fa',
  '/api/auth/confirmar-reset-2fa', '/api/auth/health',  // <-- ADICIONADO HEALTH
  '/api/contato/enviar',
  '/api/health', '/', '/api'
];

const AUTH_ROUTES_SET = new Set([
  '/api/auth/verificar', '/api/auth/verify-pin', '/api/auth/reenviar-pin',
  '/api/auth/setup-2fa', '/api/auth/verify-2fa', '/api/auth/reset-2fa-backup',
  '/api/auth/logout'
]);

const ADMIN_ROUTES_SET = new Set([
  '/api/admin/verificar', '/api/admin/dados', '/api/admin/perfil',
  '/api/admin/alterar-senha'
]);

// ============================================
// HANDLER PRINCIPAL
// ============================================

export default {
  async fetch(request, env, ctx) {
    const requestId = createRequestId();
    const url = new URL(request.url);
    const pathname = url.pathname.trim();
    const clientIP = getClientIP(request);
    const userAgent = request.headers.get('User-Agent') || 'unknown';

    logStructured('info', 'Request recebida', { requestId, method: request.method, pathname, ip: clientIP });

    // Métodos HTTP permitidos
    if (!['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'].includes(request.method)) {
      return secureResponse(new Response('Method Not Allowed', { status: 405 }), request);
    }

    // CORS
    const corsResponse = handleCorsOptions(request);
    if (corsResponse) return corsResponse;

    // Valida tamanho do payload
    const payloadError = validatePayloadSize(request);
    if (payloadError) return secureResponse(payloadError, request);

    // 🔥 HEALTH CHECK - ADICIONADO NO INÍCIO
    if (pathname === '/api/auth/health' || pathname === '/api/health') {
      return secureResponse(jsonResponse({ 
        success: true, 
        status: 'healthy', 
        timestamp: new Date().toISOString(),
        environment: process.env.NODE_ENV || 'development'
      }), request);
    }

    // Rate limit para rotas de autenticação
    const isAuthPath = pathname.includes('/auth/login') ||
                       pathname.includes('/auth/verify') ||
                       pathname.includes('/auth/reset') ||
                       pathname.includes('/auth/esqueci') ||
                       pathname.includes('/auth/confirmar') ||
                       pathname.includes('/auth/reenviar') ||
                       pathname.includes('/auth/solicitar') ||
                       pathname.includes('/auth/register');

    if (isAuthPath) {
      const rateLimitResponse = await applyRateLimit(request, env, clientIP);
      if (rateLimitResponse) {
        await logAttack(env, { type: 'rate_limit_auth', ip: clientIP, path: pathname, requestId });
        return secureResponse(rateLimitResponse, request);
      }
    }

    let context = { request, env, ip: clientIP, url, pathname, body: null, requestId };

    try {
      // WAF
      const wafBlock = await waf(context);
      if (wafBlock) {
        await logAttack(env, { type: 'waf', ip: clientIP, path: pathname, userAgent, requestId });
        return secureResponse(wafBlock, request);
      }

      // Reputação de IP
      const ipRep = await checkIPReputation(clientIP, env);
      if (ipRep?.blocked) {
        await logAttack(env, { type: 'ip_reputation', ip: clientIP, path: pathname, userAgent, requestId });
        return secureResponse(jsonResponse({ success: false, error: 'IP bloqueado' }, 403), request);
      }

      // Firewall
      const firewallAllowed = firewall(request);
      if (!firewallAllowed) {
        await logAttack(env, { type: 'firewall', ip: clientIP, path: pathname, userAgent, requestId });
        return secureResponse(new Response('Blocked by firewall', { status: 403 }), request);
      }

      // Bot detector
      const isBot = detectBot(request, context);
      if (isBot) {
        await logAttack(env, { type: 'bot', ip: clientIP, path: pathname, userAgent, requestId });
        return secureResponse(new Response('Bot detectado', { status: 403 }), request);
      }

      // Parse body para POST/PUT/PATCH
      const needsBody = ['POST', 'PUT', 'PATCH'].includes(request.method);
      if (needsBody) {
        try {
          const clonedRequest = request.clone();
          const rawBody = await clonedRequest.json().catch(() => ({}));
          context.body = sanitizeInput(rawBody);
        } catch (e) {
          // Não é JSON, ignora
        }
      }

      // ============================================
      // 🔐 ROTAS DE AUTENTICAÇÃO (PÚBLICAS)
      // ============================================

      if (pathname === '/api/auth/login' && request.method === 'POST') {
        return secureResponse(await fielLoginRoute(request, env, context.body), request);
      }

      if (pathname === '/api/auth/register' && request.method === 'POST') {
        return secureResponse(await fielRegisterRoute(request, env, context.body), request);
      }

      if (pathname === '/api/auth/verificar' && request.method === 'GET') {
        return secureResponse(await fielVerificarRoute(request, env), request);
      }

      if (pathname === '/api/auth/verify-pin' && request.method === 'POST') {
        return secureResponse(await fielVerifyPinRoute(request, env, context.body), request);
      }

      if (pathname === '/api/auth/reenviar-pin' && request.method === 'POST') {
        return secureResponse(await fielReenviarPinRoute(request, env, context.body), request);
      }

      if (pathname === '/api/auth/verify-2fa' && request.method === 'POST') {
        return secureResponse(await fielVerify2faRoute(request, env, context.body), request);
      }

      if (pathname === '/api/auth/setup-2fa' && request.method === 'POST') {
        return secureResponse(await fielSetup2faRoute(request, env, context.body), request);
      }

      if (pathname === '/api/auth/logout' && request.method === 'POST') {
        return secureResponse(await fielLogoutRoute(request, env), request);
      }

      if (pathname === '/api/auth/esqueci-senha' && request.method === 'POST') {
        return secureResponse(await fielEsqueciSenhaRoute(request, env, context.body), request);
      }

      if (pathname === '/api/auth/confirmar-reset-senha' && request.method === 'POST') {
        return secureResponse(await fielConfirmarResetSenhaRoute(request, env, context.body), request);
      }

      if (pathname === '/api/auth/reset-2fa-backup' && request.method === 'POST') {
        return secureResponse(await fielReset2faBackupRoute(request, env, context.body), request);
      }

      if (pathname === '/api/auth/solicitar-reset-2fa' && request.method === 'POST') {
        return secureResponse(await fielSolicitarReset2faRoute(request, env, context.body), request);
      }

      if (pathname === '/api/auth/confirmar-reset-2fa' && request.method === 'POST') {
        return secureResponse(await fielConfirmarReset2faRoute(request, env, context.body), request);
      }

      // ============================================
      // 📧 ROTA DE CONTATO
      // ============================================

      if (pathname === '/api/contato/enviar' && request.method === 'POST') {
        try {
          const body = context.body;
          if (!env.RESEND_API_KEY) {
            return secureResponse(jsonResponse({ success: false, error: 'RESEND_API_KEY não configurada' }, 500), request);
          }
          
          // Envia email de confirmação para o cliente
          ctx.waitUntil(sendContactConfirmationEmail(env, body));
          // Envia notificação para a secretaria
          ctx.waitUntil(sendContactNotificationToSecretariat(env, body));
          
          return secureResponse(jsonResponse({ success: true, message: 'Mensagem enviada com sucesso!' }), request);
        } catch (error) {
          logStructured('error', 'Erro ao enviar contato', { error: error.message, requestId });
          return secureResponse(jsonResponse({ success: false, message: 'Erro ao enviar mensagem' }, 500), request);
        }
      }

      // ============================================
      // 👑 ROTAS ADMIN (REQUEREM AUTENTICAÇÃO)
      // ============================================

      // Verificar se é rota admin
      const isAdminRoute = ADMIN_ROUTES_SET.has(pathname);
      
      // Autenticação para rotas protegidas
      let user = null;
      if (!PUBLIC_ROUTES.some(route => pathname === route || pathname.startsWith(route + '?'))) {
        const authResult = await requireAuth({ request, env });
        if (authResult?.error) {
          await logAttack(env, { type: 'auth_fail', ip: clientIP, path: pathname, userAgent, requestId });
          return secureResponse(authResult.response, request);
        }
        user = authResult.user;
      }

      // Verificar role admin para rotas admin
      if (isAdminRoute) {
        const roleCheck = await requireRole(user, ['admin']);
        if (!roleCheck.allowed) {
          await logAttack(env, { type: 'forbidden', ip: clientIP, path: pathname, user: user?.email, requestId });
          return secureResponse(jsonResponse({ success: false, error: 'Acesso negado. Permissão de administrador necessária.' }, 403), request);
        }
      }

      // Rotas Admin
      if (pathname === '/api/admin/verificar' && request.method === 'GET') {
        if (!user) return secureResponse(jsonResponse({ success: false }, 401), request);
        return secureResponse(jsonResponse({
          success: true,
          user: { id: user.id, nome: user.nome, email: user.email, role: user.role, twofa_enabled: user.twofa_enabled }
        }), request);
      }

      if (pathname === '/api/admin/dados' && request.method === 'GET') {
        return secureResponse(await handleAdminDados(request, env, user), request);
      }

      if (pathname === '/api/admin/dados' && request.method === 'POST') {
        return secureResponse(await handleAdminSalvarDados(request, env, user, context.body), request);
      }

      if (pathname === '/api/admin/perfil' && request.method === 'GET') {
        return secureResponse(await handleAdminPerfil(request, env, user), request);
      }

      if (pathname === '/api/admin/perfil' && request.method === 'PUT') {
        return secureResponse(await handleAdminAtualizarPerfil(request, env, user, context.body), request);
      }

      if (pathname === '/api/admin/alterar-senha' && request.method === 'PUT') {
        return secureResponse(await handleAdminAlterarSenha(request, env, user, context.body), request);
      }

      // ============================================
      // 🏥 HEALTH CHECK JÁ FOI TRATADO NO INÍCIO
      // ============================================

      if (pathname === '/' || pathname === '/api') {
        return secureResponse(jsonResponse({ 
          success: true, 
          service: 'Pani Di Grano API', 
          version: '1.0.0', 
          status: 'online', 
          timestamp: new Date().toISOString() 
        }), request);
      }

      return secureResponse(jsonResponse({ success: false, error: 'Endpoint não encontrado', path: pathname }, 404), request);

    } catch (err) {
      logStructured('error', 'Erro interno no servidor', { error: err.message, stack: err.stack, requestId });
      return secureResponse(jsonResponse({ success: false, error: 'Erro interno do servidor' }, 500), request);
    }
  },

  // Tarefa agendada (opcional)
  async scheduled(event, env, ctx) {
    console.log('📅 Tarefa agendada executada em:', new Date().toISOString());
  }
};