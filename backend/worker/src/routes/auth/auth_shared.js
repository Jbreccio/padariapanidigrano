// backend/worker/src/routes/auth/auth_shared.js
import { jsonResponse } from '../../utils/helpers.js';

// ============================================
// HASH E SENHA
// ============================================

export async function sha256(text) {
  const data = new TextEncoder().encode(text);
  const buf  = await crypto.subtle.digest('SHA-256', data);
  return Array.from(new Uint8Array(buf))
    .map(b => b.toString(16).padStart(2, '0'))
    .join('');
}

export async function verificarSenha(senhaDigitada, senhaArmazenada) {
  if (!senhaArmazenada) return false;

  const hash = await sha256(senhaDigitada);
  return hash === senhaArmazenada;
}

// ============================================
// TOKEN SEGURO (SESSION BASED)
// ============================================

export async function hashToken(token) {
  const data = new TextEncoder().encode(token);
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  return Array.from(new Uint8Array(hashBuffer))
    .map(b => b.toString(16).padStart(2, '0'))
    .join('');
}

export function generateRawToken() {
  const array = new Uint8Array(32);
  crypto.getRandomValues(array);
  return btoa(String.fromCharCode(...array));
}

  const expiresAt = Date.now() + (7 * 24 * 60 * 60 * 1000);

  await env.DB.prepare(`
    UPDATE users
    SET token_hash = ?, token_expires = ?, twofa_enabled = 1
    WHERE id = ?
  `).bind(tokenHash, expiresAt, user.id).run();

  return { token, expiresAt };
}

// ============================================
// PIN
// ============================================

export function generatePIN() {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

export function generateBackupCodes() {
  return Array.from({ length: 8 }, () =>
    crypto.randomUUID().replace(/-/g, '').slice(0, 8).toUpperCase()
  );
}

// ============================================
// TOTP (MANTIDO - JÁ ESTÁ PERFEITO)
// ============================================

function base32Decode(base32) {
  const alphabet = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ234567';
  const str = base32.toUpperCase().replace(/=+$/, '');
  let bits = 0, value = 0;
  const output = [];

  for (const char of str) {
    const idx = alphabet.indexOf(char);
    if (idx === -1) continue;

    value = (value << 5) | idx;
    bits += 5;

    if (bits >= 8) {
      output.push((value >>> (bits - 8)) & 0xff);
      bits -= 8;
    }
  }

  return new Uint8Array(output);
}

async function hotp(secretBytes, counter) {
  const counterBytes = new Uint8Array(8);
  let c = BigInt(counter);

  for (let i = 7; i >= 0; i--) {
    counterBytes[i] = Number(c & 0xffn);
    c >>= 8n;
  }

  const key = await crypto.subtle.importKey(
    'raw',
    secretBytes,
    { name: 'HMAC', hash: 'SHA-1' },
    false,
    ['sign']
  );

  const sig = await crypto.subtle.sign('HMAC', key, counterBytes);
  const hash = new Uint8Array(sig);

  const offset = hash[hash.length - 1] & 0x0f;

  const code =
    (((hash[offset] & 0x7f) << 24) |
      ((hash[offset + 1] & 0xff) << 16) |
      ((hash[offset + 2] & 0xff) << 8) |
      (hash[offset + 3] & 0xff)) %
    1_000_000;

  return code.toString().padStart(6, '0');
}

export async function verifyTOTP(secret, token, window = 1) {
  const secretBytes = base32Decode(secret);
  const now = Math.floor(Date.now() / 1000);
  const counter = Math.floor(now / 30);

  for (let i = -window; i <= window; i++) {
    const expected = await hotp(secretBytes, counter + i);
    if (expected === String(token).trim()) return true;
  }

  return false;
}