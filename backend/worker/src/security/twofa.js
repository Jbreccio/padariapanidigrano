function base32tohex(base32) {
  const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ234567";
  let bits = "";
  let hex = "";

  for (let i = 0; i < base32.length; i++) {
    const val = chars.indexOf(base32.charAt(i).toUpperCase());
    bits += val.toString(2).padStart(5, '0');
  }

  for (let i = 0; i + 4 <= bits.length; i += 4) {
    hex += parseInt(bits.substr(i, 4), 2).toString(16);
  }

  return hex;
}

export async function verifyTOTP(secret, token) {
  if (!secret || !token) return false;
  if (!/^\d{6}$/.test(token)) return false;

  const time = Math.floor(Date.now() / 30000);
  const hexKey = base32tohex(secret);

  for (let i = -1; i <= 1; i++) {
    const step = time + i;
    const msg = step.toString(16).padStart(16, '0');

    const key = new Uint8Array(hexKey.match(/.{1,2}/g).map(b => parseInt(b, 16)));
    const data = new Uint8Array(msg.match(/.{1,2}/g).map(b => parseInt(b, 16)));

    const cryptoKey = await crypto.subtle.importKey(
      "raw",
      key,
      { name: "HMAC", hash: "SHA-1" },
      false,
      ["sign"]
    );

    const hmac = await crypto.subtle.sign("HMAC", cryptoKey, data);
    const h = new Uint8Array(hmac);

    const offset = h[19] & 0xf;

    const code =
      ((h[offset] & 0x7f) << 24) |
      ((h[offset + 1] & 0xff) << 16) |
      ((h[offset + 2] & 0xff) << 8) |
      (h[offset + 3] & 0xff);

    const otp = (code % 1000000).toString().padStart(6, '0');

    if (otp === token) return true;
  }

  return false;
}