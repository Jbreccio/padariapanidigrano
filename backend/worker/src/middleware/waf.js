// src/middleware/waf.js

/**
 * Web Application Firewall - regras básicas
 */
export async function waf(context) {
  const { request, pathname } = context;
  
  // Lista de padrões maliciosos
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
  
  // Verificar pathname
  for (const pattern of maliciousPatterns) {
    if (pattern.test(pathname)) {
      return new Response('Forbidden', { status: 403 });
    }
  }
  
  // Verificar headers
  const userAgent = request.headers.get('User-Agent') || '';
  const suspiciousUA = /(sqlmap|nikto|nmap|masscan|zgrab|httpx)/i;
  if (suspiciousUA.test(userAgent)) {
    return new Response('Forbidden', { status: 403 });
  }
  
  // Verificar método HTTP não permitido
  const allowedMethods = ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'];
  if (!allowedMethods.includes(request.method)) {
    return new Response('Method Not Allowed', { status: 405 });
  }
  
  // Verificar tamanho da URL
  const url = request.url;
  if (url.length > 2000) {
    return new Response('URI Too Long', { status: 414 });
  }
  
  return null; // Passou no WAF
}