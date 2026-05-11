const encoder = new TextEncoder();

async function getKey(secret) {
  return crypto.subtle.importKey(
    'raw',
    encoder.encode(secret),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign', 'verify']
  );
}

function base64url(input) {
  return btoa(String.fromCharCode(...new Uint8Array(input)))
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/, '');
}

export async function signJWT(payload, secret) {
  const header = { alg: 'HS256', typ: 'JWT' };

  const encHeader = base64url(encoder.encode(JSON.stringify(header)));
  const encPayload = base64url(encoder.encode(JSON.stringify(payload)));

  const data = `${encHeader}.${encPayload}`;

  const key = await getKey(secret);
  const signature = await crypto.subtle.sign('HMAC', key, encoder.encode(data));

  return `${data}.${base64url(signature)}`;
}

export async function verifyJWT(token, secret) {
  const [header, payload, signature] = token.split('.');

  const data = `${header}.${payload}`;
  const key = await getKey(secret);

  const valid = await crypto.subtle.verify(
    'HMAC',
    key,
    Uint8Array.from(atob(signature.replace(/-/g, '+').replace(/_/g, '/')), c => c.charCodeAt(0)),
    encoder.encode(data)
  );

  if (!valid) return null;

  return JSON.parse(atob(payload));
}