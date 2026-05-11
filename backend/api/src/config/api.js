// src/config/api.js

// Detecta se está em desenvolvimento
const isDevelopment = import.meta.env.DEV;

// URL do Worker remoto (produção)
const PROD_URL = Substitui: import.meta.env.VITE_WORKER_URL || 'https://santuariodefatima-prod.oibreccio.workers.dev/api';

// URL do Worker local (desenvolvimento com wrangler)
const DEV_URL = 'http://localhost:8787/api';

// URL do backend Node.js local (alternativa)
const BACKEND_URL = 'http://localhost:3000/api';

// URL cache
let cachedApiUrl = null;

/**
 * Tenta detectar qual backend está disponível
 */
export const getApiUrl = async () => {
  if (!isDevelopment) {
    return PROD_URL;
  }

  // Em desenvolvimento, tenta o wrangler primeiro
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 2000);
    
    const response = await fetch(`${DEV_URL}/health`, {
      method: 'GET',
      signal: controller.signal,
    });
    
    clearTimeout(timeoutId);
    
    if (response.ok) {
      console.log('✅ Usando Worker local (wrangler)');
      return DEV_URL;
    }
  } catch (e) {
    console.log('❌ Worker local não disponível');
  }

  // Se wrangler não estiver disponível, tenta o backend Node
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 2000);
    
    const response = await fetch(`${BACKEND_URL}/health`, {
      method: 'GET',
      signal: controller.signal,
    });
    
    clearTimeout(timeoutId);
    
    if (response.ok) {
      console.log('✅ Usando backend Node.js local');
      return BACKEND_URL;
    }
  } catch (e) {
    console.log('❌ Backend Node.js não disponível');
  }

  // Fallback para o Worker remoto
  console.log('⚠️ Usando Worker remoto');
  return PROD_URL;
};

/**
 * Inicializa a URL da API (deve ser chamada uma vez no início)
 */
export const initApiUrl = async () => {
  if (!cachedApiUrl) {
    cachedApiUrl = await getApiUrl();
    console.log('🌐 API URL configurada:', cachedApiUrl);
  }
  return cachedApiUrl;
};

/**
 * Retorna a URL em cache (já detectada)
 */
export const getCachedApiUrl = () => {
  return cachedApiUrl;
};

/**
 * Função para fazer requisições com a URL correta
 */
export const apiFetch = async (endpoint, options = {}) => {
  if (!cachedApiUrl) {
    await initApiUrl();
  }
  
  const url = `${cachedApiUrl}${endpoint}`;
  console.log(`🌐 API Request: ${url}`);
  
  const response = await fetch(url, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...options.headers,
    },
  });
  
  return response;
};