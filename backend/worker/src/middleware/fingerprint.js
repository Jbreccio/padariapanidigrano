export async function fingerprint(context) {
  const { request, ip } = context;

  const userAgent = request.headers.get('User-Agent') || '';
  const acceptLanguage = request.headers.get('Accept-Language') || '';
  const acceptEncoding = request.headers.get('Accept-Encoding') || '';

  // 🔥 HEADERS MAIS DIFÍCEIS DE FALSIFICAR (Cloudflare)
  const cfRay = request.headers.get('CF-Ray') || '';
  const cfCountry = request.headers.get('CF-IPCountry') || '';
  const cfVisitor = request.headers.get('CF-Visitor') || '';

  // 🔥 PATH também ajuda a diferenciar comportamento
  const url = new URL(request.url);
  const path = url.pathname;

  const fingerprintData = [
    ip,
    userAgent,
    acceptLanguage,
    acceptEncoding,
    cfCountry,
    cfVisitor,
    
  ].join('|');

  const encoder = new TextEncoder();
  const data = encoder.encode(fingerprintData);
  const hash = await crypto.subtle.digest('SHA-256', data);

  return Array.from(new Uint8Array(hash))
    .map(b => b.toString(16).padStart(2, '0'))
    .join('')
    .substring(0, 32);
}