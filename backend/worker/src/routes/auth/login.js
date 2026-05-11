// backend/worker/src/routes/auth/login.js
// ── TOTP puro (sem biblioteca externa — compatível com Cloudflare Workers) ────

function base32Decode(base32) {
  const alphabet = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ234567';
  let bits = 0, value = 0;
  const output = [];
  for (const char of base32.toUpperCase().replace(/=+$/, '')) {
    value = (value << 5) | alphabet.indexOf(char);
    bits += 5;
    if (bits >= 8) { output.push((value >>> (bits - 8)) & 255); bits -= 8; }
  }
  return new Uint8Array(output);
}

async function generateTOTP(secret, window = 0) {
  const counter = Math.floor(Date.now() / 1000 / 30) + window;
  const key = await crypto.subtle.importKey(
    'raw', base32Decode(secret),
    { name: 'HMAC', hash: 'SHA-1' }, false, ['sign']
  );
  const buf = new ArrayBuffer(8);
  new DataView(buf).setUint32(4, counter, false);
  const sig = new Uint8Array(await crypto.subtle.sign('HMAC', key, buf));
  const offset = sig[19] & 0xf;
  const otp = (
    ((sig[offset]     & 0x7f) << 24) |
    ((sig[offset + 1] & 0xff) << 16) |
    ((sig[offset + 2] & 0xff) <<  8) |
     (sig[offset + 3] & 0xff)
  ) % 1_000_000;
  return otp.toString().padStart(6, '0');
}

async function verifyTOTP(secret, token) {
  for (const w of [-1, 0, 1]) {
    if (await generateTOTP(secret, w) === token) return true;
  }
  return false;
}

function generateTOTPSecret() {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ234567';
  const bytes = crypto.getRandomValues(new Uint8Array(20));
  return Array.from(bytes).map(b => chars[b % 32]).join('');
}

function buildQRCodeURL(secret, email) {
  const issuer  = encodeURIComponent('Santuário de Fátima');
  const account = encodeURIComponent(email);
  const otpauth = `otpauth://totp/${issuer}:${account}?secret=${secret}&issuer=${issuer}&algorithm=SHA1&digits=6&period=30`;
  return {
    qrCodeUrl: `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(otpauth)}`,
    secretKey: secret,
  };
}

function makeToken(user) {
  return btoa(JSON.stringify({
    id:    user.id,
    nome:  user.nome,
    email: user.email,
    role:  user.role,
    exp:   Date.now() + 24 * 60 * 60 * 1000,
  }));
}

// ── LOGIN ADMIN ───────────────────────────────────────────────────────────────
// Retorna:
//   { success, step: '2fa',       userId }          → tem TOTP, pede código
//   { success, step: 'setup_2fa', userId, qrCodeUrl, secretKey } → sem TOTP, força setup
export async function loginUser(usuario, senha, env, ctx) {
  try {
    const user = await env.DB.prepare(
      'SELECT id, nome, email, senha_hash, twofa_enabled, twofa_secret, role FROM users WHERE email = ?'
    ).bind(usuario).first();

    if (!user)                     return { success: false, error: 'Usuário não encontrado' };
    if (senha !== user.senha_hash) return { success: false, error: 'Senha incorreta' };

    // Fiéis não passam por aqui (têm rota própria)
    if (user.role === 'fiel') {
      return { success: false, error: 'Acesso não permitido por esta rota' };
    }

    // Admin JÁ tem 2FA → pede código do app
    if (user.twofa_enabled === 1 && user.twofa_secret) {
      return { success: true, step: '2fa', userId: user.id };
    }

    // Admin SEM 2FA → gera secret e retorna QR Code para setup
    const secret = generateTOTPSecret();
    const { qrCodeUrl, secretKey } = buildQRCodeURL(secret, user.email);

    // Guarda secret temporário no KV (10 min)
    await env.AUTH_KV.put(
      `totp_setup:${user.id}`,
      JSON.stringify({ secret, expira: Date.now() + 10 * 60 * 1000 }),
      { expirationTtl: 600 }
    );

    return { success: true, step: 'setup_2fa', userId: user.id, qrCodeUrl, secretKey };

  } catch (error) {
    console.error('Erro em loginUser:', error);
    return { success: false, error: 'Erro interno' };
  }
}

// ── SETUP 2FA (primeiro acesso — confirma QR Code com primeiro código) ─────────
export async function adminSetup2FA(userId, secretKey, codigo, env) {
  try {
    const stored = await env.AUTH_KV.get(`totp_setup:${userId}`, 'json');
    if (!stored)                    return { success: false, error: 'Sessão expirada. Faça login novamente.' };
    if (stored.expira < Date.now()) return { success: false, error: 'Sessão expirada. Faça login novamente.' };

    // Valida que o secretKey enviado pelo front bate com o que está no KV
    if (stored.secret !== secretKey) return { success: false, error: 'Chave inválida.' };

    const valido = await verifyTOTP(stored.secret, codigo.trim());
    if (!valido) return { success: false, error: 'Código inválido. Verifique o app e tente novamente.' };

    // Salva o secret definitivamente e ativa 2FA
    await env.DB.prepare(
      "UPDATE users SET twofa_secret = ?, twofa_enabled = 1, updated_at = datetime('now') WHERE id = ?"
    ).bind(stored.secret, userId).run();

    await env.AUTH_KV.delete(`totp_setup:${userId}`);

    const user = await env.DB.prepare(
      'SELECT id, nome, email, role FROM users WHERE id = ?'
    ).bind(userId).first();

    return { success: true, token: makeToken(user), user: { id: user.id, nome: user.nome, email: user.email, role: user.role } };

  } catch (error) {
    console.error('Erro em adminSetup2FA:', error);
    return { success: false, error: 'Erro ao configurar 2FA' };
  }
}

// ── VERIFY 2FA (logins subsequentes) ─────────────────────────────────────────
export async function verify2FAUser(userId, codigo2FA, env, ctx) {
  try {
    const user = await env.DB.prepare(
      'SELECT id, nome, email, role, twofa_secret FROM users WHERE id = ?'
    ).bind(userId).first();

    if (!user)              return { success: false, error: 'Usuário não encontrado' };
    if (!user.twofa_secret) return { success: false, error: '2FA não configurado' };

    const valido = await verifyTOTP(user.twofa_secret, codigo2FA.trim());
    if (!valido) return { success: false, error: 'Código inválido ou expirado' };

    return { success: true, token: makeToken(user), user: { id: user.id, nome: user.nome, email: user.email, role: user.role } };

  } catch (error) {
    console.error('Erro em verify2FAUser:', error);
    return { success: false, error: 'Erro na verificação 2FA' };
  }
}

// ── VERIFY PIN (usado pelo fiel — mantido para compatibilidade) ───────────────
export async function verifyPINUser(userId, pin, env) {
  try {
    const stored = await env.AUTH_KV.get(`pin:${userId}`, 'json');
    if (!stored)               return { success: false, error: 'PIN não encontrado' };
    if (stored.pin !== pin)    return { success: false, error: 'PIN inválido' };
    if (stored.expira < Date.now()) return { success: false, error: 'PIN expirado' };

    const user = await env.DB.prepare(
      'SELECT id, nome, email, role FROM users WHERE id = ?'
    ).bind(userId).first();

    await env.AUTH_KV.delete(`pin:${userId}`);
    return { success: true, token: makeToken(user), user: { id: user.id, nome: user.nome, email: user.email, role: user.role } };

  } catch (error) {
    console.error('Erro em verifyPINUser:', error);
    return { success: false, error: 'Erro na verificação PIN' };
  }
}

// ── REGISTER ──────────────────────────────────────────────────────────────────
export async function registerUser(userData, env) {
  try {
    const { nome, email, senha, celular } = userData;

    const existing = await env.DB.prepare(
      'SELECT id FROM users WHERE email = ?'
    ).bind(email).first();
    if (existing) return { success: false, error: 'Email já cadastrado' };

    await env.DB.prepare(`
      INSERT INTO users (nome, email, senha_hash, celular, role, twofa_enabled, created_at)
      VALUES (?, ?, ?, ?, 'user', 0, datetime('now'))
    `).bind(nome, email, senha, celular || '').run();

    return { success: true, message: 'Cadastro realizado com sucesso!' };

  } catch (error) {
    console.error('Erro em registerUser:', error);
    return { success: false, error: 'Erro no registro' };
  }
}

// ── RECUPERAÇÃO DE SENHA ──────────────────────────────────────────────────────
export async function solicitarRecuperacaoSenha(email, env) {
  return { success: false, error: 'Funcionalidade em desenvolvimento' };
}

export async function redefinirSenha(token, novaSenha, env, reset2FA = false) {
  try {
    // Busca token no KV
    const stored = await env.AUTH_KV.get(`reset:${token}`, 'json');
    if (!stored)                    return { success: false, error: 'Link inválido ou expirado' };
    if (stored.expira < Date.now()) return { success: false, error: 'Link expirado' };

    const updateQuery = reset2FA
      ? "UPDATE users SET senha_hash = ?, twofa_enabled = 0, twofa_secret = NULL, updated_at = datetime('now') WHERE id = ?"
      : "UPDATE users SET senha_hash = ?, updated_at = datetime('now') WHERE id = ?";

    await env.DB.prepare(updateQuery).bind(novaSenha, stored.userId).run();
    await env.AUTH_KV.delete(`reset:${token}`);

    return { success: true, message: 'Senha redefinida com sucesso!' };

  } catch (error) {
    console.error('Erro em redefinirSenha:', error);
    return { success: false, error: 'Erro ao redefinir senha' };
  }
}