import {
  sha256,
  verificarSenha,
  generatePIN,
  setup2FA,
  verifyTOTP,
  sendEmail,
  validarEmail,
  validarSenha,
  validarCelular,
  ensureColumns
} from '../controllers/auth_shared.js';
import { createSession } from './auth_shared.js';

// ============================================
// 🔐 LOGIN
// ============================================
export async function loginService({ email, senha }, env) {
  if (!email || !senha) {
    return { success: false, error: 'Preencha todos os campos' };
  }

  const emailNorm = email.toLowerCase().trim();
  await ensureColumns(env);

  const user = await env.DB.prepare(`
    SELECT id, nome, email, senha_hash, role,
           twofa_enabled, twofa_secret,
           failed_attempts, locked_until
    FROM users WHERE LOWER(email) = ?
  `).bind(emailNorm).first();

  if (!user) {
    return { success: false, error: 'E-mail ou senha inválidos' };
  }

  // 🔒 bloqueio por tentativa
  if (user.locked_until && user.locked_until > Date.now()) {
    const wait = Math.ceil((user.locked_until - Date.now()) / 60000);
    return { success: false, error: `Conta bloqueada. Tente em ${wait} min.` };
  }

  const senhaOk = await verificarSenha(senha, user.senha_hash);

  if (!senhaOk) {
    const attempts = (user.failed_attempts || 0) + 1;
    const lock = attempts >= 5 ? Date.now() + 15 * 60 * 1000 : 0;

    await env.DB.prepare(`
      UPDATE users SET failed_attempts = ?, locked_until = ?
      WHERE id = ?
    `).bind(attempts, lock, user.id).run();

    return { success: false, error: 'E-mail ou senha inválidos' };
  }

  // reset tentativa
  await env.DB.prepare(`
    UPDATE users SET failed_attempts = 0, locked_until = 0
    WHERE id = ?
  `).bind(user.id).run();

  // 🔢 gerar PIN
  const pin = generatePIN();
  const expiry = Date.now() + 10 * 60 * 1000;

  await env.DB.prepare(`
    UPDATE users SET login_pin = ?, login_pin_expires = ?
    WHERE id = ?
  `).bind(pin, expiry, user.id).run();

  // 📧 enviar email
  await sendEmail(env, user.email, 'Seu código de acesso', `
    <h2>Seu PIN</h2>
    <h1>${pin}</h1>
    <p>Válido por 10 minutos</p>
  `);

  return {
    success: true,
    step: 'pin',
    userId: user.id,
    role: user.role,
    isAdmin: user.role === 'admin',
    has2FA: !!user.twofa_secret
  };
}

// ============================================
// 🔢 VERIFICAR PIN
// ============================================
export async function verifyPinService({ userId, pin, celular }, env) {
  if (!userId || !pin) {
    return { success: false, error: 'Dados incompletos' };
  }

  await ensureColumns(env);

  const user = await env.DB.prepare(`
    SELECT * FROM users WHERE id = ?
  `).bind(userId).first();

  if (!user) return { success: false, error: 'Usuário não encontrado' };

  if (!user.login_pin || Date.now() > user.login_pin_expires) {
    return { success: false, error: 'PIN expirado' };
  }

  if (user.login_pin !== pin) {
    return { success: false, error: 'PIN inválido' };
  }

  // limpar PIN
  await env.DB.prepare(`
    UPDATE users SET login_pin = NULL, login_pin_expires = NULL
    WHERE id = ?
  `).bind(user.id).run();

  // salvar celular
  if (celular && validarCelular(celular)) {
    await env.DB.prepare(`
      UPDATE users SET celular = ?
      WHERE id = ? AND (celular IS NULL OR celular = '')
    `).bind(celular.replace(/\D/g, ''), user.id).run();
  }

  // 🔐 já tem 2FA?
  if (user.twofa_secret) {
    return {
      success: true,
      step: '2fa-verify',
      userId: user.id,
      role: user.role,
      isAdmin: user.role === 'admin'
    };
  }

  // 🔧 setup 2FA
  const { secretKey, qrCodeUrl, backupCodes, hashedBackupCodes } =
    await setup2FA(user.email);

  await env.DB.prepare(`
    UPDATE users SET twofa_secret = ?, backup_codes = ?
    WHERE id = ?
  `).bind(secretKey, JSON.stringify(hashedBackupCodes), user.id).run();

  return {
    success: true,
    step: '2fa-setup',
    userId: user.id,
    qrCodeUrl,
    secretKey,
    backupCodes
  };
}

// ============================================
// 🔐 VERIFICAR 2FA
// ============================================
export async function verify2FAService({ userId, codigo }, env, JWT_SECRET) {
  if (!userId || !codigo) {
    return { success: false, error: 'Código inválido' };
  }

  const user = await env.DB.prepare(`
    SELECT * FROM users WHERE id = ?
  `).bind(userId).first();

  if (!user || !user.twofa_secret) {
    return { success: false, error: '2FA não configurado' };
  }

  const ok = await verifyTOTP(user.twofa_secret, String(codigo), 4);

  if (!ok) {
    return { success: false, error: 'Código 2FA inválido' };
  }

 // 🎫 gerar sessão segura (SEM JWT)
import { createSession } from './auth_shared.js';


// garante que 2FA está ativo
await env.DB.prepare(`
  UPDATE users 
  SET twofa_enabled = 1
  WHERE id = ?
`).bind(user.id).run();

return {
  success: true,
  token,
  expiresAt,
  role: user.role,
  isAdmin: user.role === 'admin',
  user: {
    id: user.id,
    nome: user.nome,
    email: user.email
  }
};

// ============================================
// 👤 REGISTRO
// ============================================
export async function registerService({ nome, email, senha, celular }, env) {
  if (!nome || !email || !senha) {
    return { success: false, error: 'Campos obrigatórios' };
  }

  if (!validarEmail(email)) {
    return { success: false, error: 'E-mail inválido' };
  }

  const senhaOk = validarSenha(senha);
  if (!senhaOk.isValid) {
    return { success: false, error: 'Senha fraca' };
  }

  const emailNorm = email.toLowerCase().trim();

  const exists = await env.DB.prepare(`
    SELECT id FROM users WHERE LOWER(email) = ?
  `).bind(emailNorm).first();

  if (exists) {
    return { success: false, error: 'E-mail já cadastrado' };
  }

  const id = crypto.randomUUID();
  const senha_hash = await sha256(senha);

  await env.DB.prepare(`
    INSERT INTO users (id, nome, email, senha_hash, celular, role)
    VALUES (?, ?, ?, ?, ?, 'fiel')
  `).bind(
    id,
    nome.trim(),
    emailNorm,
    senha_hash,
    celular ? celular.replace(/\D/g, '') : null
  ).run();

  return { success: true, message: 'Conta criada com sucesso' };
}

// ============================================
// 🔎 VERIFICAR TOKEN
// ============================================
export async function verifyTokenService(token, env) {
  if (!token) {
    return { success: false, error: 'Token ausente' };
  }

  const user = await env.DB.prepare(`
    SELECT id, nome, email, role
    FROM users WHERE token = ? AND token_expires > ?
  `).bind(token, Date.now()).first();

  if (!user) {
    return { success: false, error: 'Token inválido' };
  }

  return {
    success: true,
    user,
    isAdmin: user.role === 'admin'
  };
}