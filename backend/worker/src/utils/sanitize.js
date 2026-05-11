// src/utils/sanitize.js

/**
 * Verifica se é uma URL segura (não precisa sanitizar)
 */
function isSafeUrl(value) {
  if (typeof value !== 'string') return false;
  
  // Padrões de URLs seguras
  const safePatterns = [
    /^https?:\/\//,                           // URLs HTTP/HTTPS
    /^\/r2\//,                                // R2 paths
    /^\/images\//,                            // Imagens locais
    /^\/docs\//,                              // Documentos locais
    /^\/assets\//,                            // Assets locais
    /^data:image\/[a-z]+;base64,/,           // Base64 images
    /^https:\/\/pub-[a-f0-9]+\.r2\.dev\//,   // R2 Cloudflare
    /^https:\/\/santuariodefatima\.oibreccio\.workers\.dev\//, // Worker
    /^https:\/\/img\.youtube\.com\//,        // YouTube thumbnails
  ];
  
  return safePatterns.some(pattern => pattern.test(value));
}

/**
 * Decodifica entidades HTML recursivamente (resolve múltiplas codificações)
 */
function decodeHtmlEntities(str) {
  if (typeof str !== 'string') return str;
  
  let result = str;
  let previous = '';
  let maxLoops = 10; // Evita loop infinito
  
  // Continua decodificando enquanto houver mudanças
  while (result !== previous && maxLoops-- > 0) {
    previous = result;
    result = result
      .replace(/&amp;#x2F;/gi, '/')
      .replace(/&#x2F;/gi, '/')
      .replace(/&amp;#x2f;/gi, '/')
      .replace(/&#x2f;/gi, '/')
      .replace(/&amp;#47;/gi, '/')
      .replace(/&#47;/gi, '/')
      .replace(/&amp;#58;/gi, ':')
      .replace(/&#58;/gi, ':')
      .replace(/&amp;#x3A;/gi, ':')
      .replace(/&#x3A;/gi, ':')
      .replace(/&amp;#x2F;/gi, '/')
      .replace(/&amp;quot;/gi, '"')
      .replace(/&quot;/gi, '"')
      .replace(/&amp;amp;/gi, '&')
      .replace(/&amp;/gi, '&')
      .replace(/&lt;/gi, '<')
      .replace(/&gt;/gi, '>');
  }
  
  return result;
}

/**
 * Sanitiza entrada de dados para prevenir XSS e injeção
 * 🔥 CORRIGIDO: Decodifica entidades e preserva URLs
 */
export function sanitizeInput(input, depth = 0) {
  // Evita recursão infinita
  if (depth > 10) return input;
  
  if (input === null || input === undefined) {
    return null;
  }
  
  if (typeof input === 'string') {
    // Primeiro, decodifica entidades HTML (resolve múltiplas codificações)
    let decoded = decodeHtmlEntities(input);
    
    // Verifica se é URL segura
    if (isSafeUrl(decoded)) {
      // Verifica se não tem caracteres maliciosos
      if (/[<>]/g.test(decoded)) {
        return decoded.replace(/[<>]/g, '');
      }
      return decoded; // URL limpa
    }
    
    // Para texto normal, sanitiza
    // Remove tags HTML perigosas
    let cleaned = decoded
      .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
      .replace(/<iframe\b[^<]*(?:(?!<\/iframe>)<[^<]*)*<\/iframe>/gi, '')
      .replace(/<object\b[^<]*(?:(?!<\/object>)<[^<]*)*<\/object>/gi, '')
      .replace(/<embed\b[^<]*(?:(?!<\/embed>)<[^<]*)*<\/embed>/gi, '')
      .replace(/javascript:/gi, '')
      .replace(/onload=/gi, '')
      .replace(/onerror=/gi, '')
      .replace(/onclick=/gi, '');
    
    // Escapa HTML restante
    cleaned = cleaned
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#x27;');
    
    // Limita tamanho
    return cleaned.slice(0, 5000);
  }
  
  if (typeof input === 'object' && !Array.isArray(input)) {
    const sanitized = {};
    for (const [key, value] of Object.entries(input)) {
      const safeKey = typeof key === 'string' ? key.slice(0, 100) : String(key);
      
      // Campos que contêm URLs - NÃO sanitiza
      const isUrlField = /^(imagem|url|imagens|avatar|thumbnail|googleDriveLink|youtubeLink|link|photo|image|src|href|poster|cover)$/i.test(safeKey);
      const isArrayOfUrls = isUrlField && Array.isArray(value);
      
      if (isUrlField) {
        if (Array.isArray(value)) {
          // Array de URLs: limpa cada item
          sanitized[safeKey] = value.map(v => {
            if (typeof v === 'string') {
              let decoded = decodeHtmlEntities(v);
              return isSafeUrl(decoded) ? decoded : sanitizeInput(decoded, depth + 1);
            }
            return v;
          });
        } else if (typeof value === 'string') {
          // URL única
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
    return input.slice(0, 100).map(item => sanitizeInput(item, depth + 1));
  }
  
  if (typeof input === 'number') {
    return Math.min(Math.max(input, -999999999), 999999999);
  }
  
  if (typeof input === 'boolean') {
    return input;
  }
  
  return sanitizeInput(String(input), depth + 1);
}

/**
 * Gera hash SHA-256 de um token
 */
export async function hashToken(token) {
  if (!token || typeof token !== 'string') return '';
  
  const encoder = new TextEncoder();
  const data = encoder.encode(token);
  const hash = await crypto.subtle.digest('SHA-256', data);
  
  return Array.from(new Uint8Array(hash))
    .map(b => b.toString(16).padStart(2, '0'))
    .join('');
}

/**
 * Valida tamanho do payload (10MB para imagens)
 */
export function validatePayloadSize(request, maxSize = 10485760) {
  const contentLength = request.headers.get('content-length');
  
  if (contentLength && parseInt(contentLength) > maxSize) {
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: `Payload muito grande. Máximo: ${Math.round(maxSize / 1024 / 1024)}MB` 
      }),
      { status: 413, headers: { 'Content-Type': 'application/json' } }
    );
  }

  return null;
}

/**
 * Fetch com timeout
 */
export async function fetchWithTimeout(url, options = {}, timeout = 15000) {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeout);
  
  try {
    const response = await fetch(url, { ...options, signal: controller.signal });
    clearTimeout(timeoutId);
    return response;
  } catch (error) {
    clearTimeout(timeoutId);
    if (error.name === 'AbortError') {
      throw new Error('Request timeout');
    }
    throw error;
  }
}

/**
 * Gera ID único da requisição
 */
export function createRequestId() {
  try {
    return crypto.randomUUID();
  } catch (e) {
    return `${Date.now()}-${Math.random().toString(36).substring(2, 15)}`;
  }
}