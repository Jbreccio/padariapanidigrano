// ============================================
// 🔐 CRYPTO UTIL (Cloudflare Worker Compatible)
// ============================================

// =======================
// HASH SHA-256
// =======================
export async function sha256(text) {
  const encoder = new TextEncoder();
  const data = encoder.encode(text);

  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));

  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
}

// =======================
// TOKEN SEGURO (RAW)
// =======================
export function generateRawToken() {
  const array = new Uint8Array(32);
  crypto.getRandomValues(array);
  return btoa(String.fromCharCode(...array));
}

// =======================
// HASH DE TOKEN
// =======================
export async function hashToken(token) {
  return await sha256(token);
}

// =======================
// GERAR PIN NUMÉRICO
// =======================
export function generatePIN(size = 6) {
  let pin = '';
  for (let i = 0; i < size; i++) {
    pin += Math.floor(Math.random() * 10);
  }
  return pin;
}

// =======================
// COMPARAÇÃO SEGURA
// =======================
export function safeCompare(a, b) {
  if (!a || !b || a.length !== b.length) return false;

  let result = 0;
  for (let i = 0; i < a.length; i++) {
    result |= a.charCodeAt(i) ^ b.charCodeAt(i);
  }

  return result === 0;
}