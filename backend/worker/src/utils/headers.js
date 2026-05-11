export function addSecurityHeaders(response) {
  if (!response) {
    return new Response('Erro interno', { status: 500 });
  }

  const headers = new Headers(response.headers);

  headers.set('X-Content-Type-Options', 'nosniff');
  headers.set('X-Frame-Options', 'DENY');
  headers.set('X-XSS-Protection', '1; mode=block');
  headers.set('Referrer-Policy', 'strict-origin-when-cross-origin');
  headers.set('Permissions-Policy', 'geolocation=(), microphone=(), camera=()');
  headers.set('Strict-Transport-Security', 'max-age=31536000; includeSubDomains');

  // CSP (seguro mas funcional)
  headers.set(
    'Content-Security-Policy',
    "default-src 'self'; img-src 'self' https:; media-src 'self' https:; style-src 'self' 'unsafe-inline'; script-src 'self'"
  );

  return new Response(response.body, {
    status: response.status,
    headers
  });
}