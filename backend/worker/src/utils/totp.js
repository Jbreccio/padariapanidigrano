// backend/worker/src/utils/totp.js
// 🔐 TOTP — RFC 6238 (Google Authenticator)
// Implementado com Web Crypto (sem libs externas)

// ============================================
// 🔢 BASE32 → BYTES
// ============================================

function base32Decode(base32) {
  const alphabet = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ234567';
  const clean = base32
    .toUpperCase()
    .replace(/=+$/, '')
    .replace(/\s/g, '');

  let bits = 0;
  let value = 0;
  const output = [];

  for (const char of clean) {
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

// ============================================
// 🔑 GERAR TOTP (6 dígitos)
// ============================================

export async function generateTOTP(secret, timestamp = Date.now()) {
  try {
    const timeStep = Math.floor(timestamp / 1000 / 30);

    const buffer = new ArrayBuffer(8);
    const view = new DataView(buffer);

    // Big-endian (padrão RFC)
    view.setUint32(4, timeStep >>> 0);

    const keyBytes = base32Decode(secret);

    const cryptoKey = await crypto.subtle.importKey(
      'raw',
      keyBytes,
      { name: 'HMAC', hash: 'SHA-1' },
      false,
      ['sign']
    );

    const signature = await crypto.subtle.sign('HMAC', cryptoKey, buffer);
    const hmac = new Uint8Array(signature);

    const offset = hmac[hmac.length - 1] & 0x0f;

    const binary =
      ((hmac[offset] & 0x7f) << 24) |
      ((hmac[offset + 1] & 0xff) << 16) |
      ((hmac[offset + 2] & 0xff) << 8) |
      (hmac[offset + 3] & 0xff);

    const otp = binary % 1_000_000;

    return otp.toString().padStart(6, '0');
  } catch (err) {
    console.error('Erro ao gerar TOTP:', err);
    return null;
  }
}

// ============================================
// ✅ VALIDAR TOTP
// ============================================

export async function validateTOTP(secret, codigo) {
  try {
    if (!secret || !codigo) return false;

    // 🔒 Garante formato correto
    if (!/^\d{6}$/.test(codigo)) return false;

    const now = Date.now();

    // ⏱️ janela de tolerância: -30s, atual, +30s
    const windows = [-1, 0, 1];

    for (const delta of windows) {
      const expected = await generateTOTP(secret, now + delta * 30000);

      if (expected === codigo) {
        return true;
      }
    }

    return false;
  } catch (err) {
    console.error('Erro ao validar TOTP:', err);
    return false;
  }
}