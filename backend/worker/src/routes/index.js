// backend/worker/src/routes/index.js
import { jsonResponse, errorResponse } from '../utils/helpers.js';

// Importar handlers de autenticação (seus arquivos existentes)
import { login } from './auth/login.js';
import { register } from './auth/register.js';
import { 
  solicitarRecuperacaoSenha, 
  redefinirSenha 
} from './auth/password.js';
import { 
  createSession, 
  validateSession, 
  checkAuth 
} from './auth/session.js';
import {
  webblackSolicitarAcesso,
  webblackVerificarLink,
  webblackVerificar2FA
} from './auth/webblack.js';

// Importar handlers de verificação 2FA e PIN
import { verify2FAUser, verifyPINUser } from './auth/verify.js';

// Importar handlers do Painel do Fiel
import * as fiel from './fiel/index.js';

export async function handleRequest(request, env, ctx) {
  const url = new URL(request.url);
  const pathname = url.pathname;
  const method = request.method;

  // ==================== AUTENTICAÇÃO ====================
  
  // Login (administradores e fiéis)
  if (pathname === '/api/auth/login' && method === 'POST') {
    return login(request, env, ctx);
  }
  
  // Registro de fiéis
  if (pathname === '/api/auth/register' && method === 'POST') {
    return register(request, env, ctx);
  }
  
  // Verificação 2FA
  if (pathname === '/api/auth/verify-2fa' && method === 'POST') {
    return verify2FAUser(request, env, ctx);
  }
  
  // Verificação PIN
  if (pathname === '/api/auth/verify-pin' && method === 'POST') {
    return verifyPINUser(request, env);
  }
  
  // Recuperação de senha
  if (pathname === '/api/auth/esqueci-senha' && method === 'POST') {
    return solicitarRecuperacaoSenha(request, env, ctx);
  }
  
  if (pathname === '/api/auth/reset-senha' && method === 'POST') {
    return redefinirSenha(request, env);
  }
  
   
  if (pathname === '/api/auth/validar-sessao' && method === 'POST') {
    return validateSession(request, env);
  }
  
  if (pathname === '/api/auth/verificar-autenticacao' && method === 'GET') {
    return checkAuth(request, env);
  }
  
  // WebBlack Auth
  if (pathname === '/api/auth/webblack/solicitar-acesso' && method === 'POST') {
    return webblackSolicitarAcesso(request, env);
  }
  
  if (pathname === '/api/auth/webblack/verificar-link' && method === 'POST') {
    return webblackVerificarLink(request, env);
  }
  
  if (pathname === '/api/auth/webblack/verificar-2fa' && method === 'POST') {
    return webblackVerificar2FA(request, env);
  }

  // ==================== PAINEL DO FIEL ====================
  
  // Verificar autenticação para rotas protegidas
  const authHeader = request.headers.get('Authorization');
  let user = null;
  
  if (authHeader) {
    const token = authHeader.replace('Bearer ', '');
    try {
      user = JSON.parse(atob(token));
      if (user.exp && user.exp < Date.now()) user = null;
    } catch (e) {}
  }
  
  // Rotas protegidas do fiel
  const rotasProtegidas = [
    '/api/fiel/dados', '/api/fiel/salvar', '/api/fiel/perfil',
    '/api/fiel/termo-voz', '/api/fiel/contribuir-voz', '/api/fiel/versiculos'
  ];
  
  if (rotasProtegidas.includes(pathname) && !user) {
    return errorResponse('Não autorizado. Faça login primeiro.', 401);
  }
  
  // Dados do fiel
  if (pathname === '/api/fiel/dados' && method === 'GET') {
    return fiel.getDados(request, env, user);
  }
  
  if (pathname === '/api/fiel/salvar' && method === 'POST') {
    return fiel.salvarDados(request, env, user);
  }
  
  if (pathname === '/api/fiel/perfil' && method === 'PUT') {
    return fiel.atualizarPerfil(request, env, user);
  }
  
  if (pathname === '/api/fiel/termo-voz' && method === 'POST') {
    return fiel.registrarTermo(request, env, user);
  }
  
  if (pathname === '/api/fiel/contribuir-voz' && method === 'POST') {
    return fiel.contribuirVoz(request, env, user);
  }
  
  if (pathname === '/api/fiel/versiculos' && method === 'POST') {
    return fiel.salvarVersiculo(request, env, user);
  }
  
  if (pathname === '/api/fiel/pastorais' && method === 'GET') {
    return fiel.listarPastorais(request, env);
  }
  
  if (pathname === '/api/fiel/buscar-musicas' && method === 'GET') {
    return fiel.buscarMusicas(request, env);
  }
  
  if (pathname === '/api/fiel/health' && method === 'GET') {
    return jsonResponse({ status: 'ok', timestamp: new Date().toISOString() });
  }

  // ==================== 404 ====================
  return errorResponse(`Endpoint não encontrado: ${pathname}`, 404);
}