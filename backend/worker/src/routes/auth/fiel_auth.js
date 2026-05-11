// backend/worker/src/routes/auth/fiel_auth.js
import { jsonResponse } from '../../utils/helpers.js';
import { firewall } from '../../middleware/firewall.js';
import { sha256 } from '../../security/hash.js';
import { hashToken } from '../../utils/sanitize.js';
import { validateTOTP } from '../../utils/totp.js';
import { applyRateLimit } from '../../middleware/rate-limit.js';

// ============================================
// FUNÇÃO DE CRIAÇÃO DE SESSÃO
// ============================================

export async function createSession(env, user, request = null) {
  const rawToken = crypto.randomUUID();
  const tokenHash = await hashToken(rawToken);

  // ✅ Admins: 8 horas | Fiéis: 7 dias
  const ttlSeconds = user.role === 'admin'
    ? 60 * 60 * 8
    : 60 * 60 * 24 * 7;

  const expiresAt = Date.now() + (ttlSeconds * 1000);

  // ✅ Info do dispositivo
  let loginInfo = { criadoEm: new Date().toISOString() };
  if (request) {
    const ua = request.headers.get('User-Agent') || '';
    const ip = request.headers.get('CF-Connecting-IP') ||
                request.headers.get('X-Forwarded-For')?.split(',')[0] ||
                'desconhecido';
    const country = request.headers.get('CF-IPCountry') || '??';
    const city = request.headers.get('CF-IPCity') || 'desconhecida';

    loginInfo = {
      ip,
      city,
      country,
      userAgent: ua.substring(0, 100),
      browser: ua.includes('Edg') ? 'Edge'
        : ua.includes('Chrome') ? 'Chrome'
        : ua.includes('Firefox') ? 'Firefox'
        : ua.includes('Safari') ? 'Safari'
        : 'Outro',
      device: /Mobile|Android|iPhone|iPad/i.test(ua) ? 'Celular' : 'Desktop',
      os: ua.includes('Windows') ? 'Windows'
        : ua.includes('Mac') ? 'macOS'
        : ua.includes('Android') ? 'Android'
        : ua.includes('iPhone') || ua.includes('iPad') ? 'iOS'
        : ua.includes('Linux') ? 'Linux'
        : 'Outro',
      criadoEm: new Date().toISOString()
    };
  }

  await env.KV_SESSION.put(`sess:${tokenHash}`, JSON.stringify({
    user: {
      id: user.id,
      nome: user.nome,
      email: user.email,
      role: user.role
    },
    expires: expiresAt,
    loginInfo
  }), { expirationTtl: ttlSeconds });

  return { token: rawToken, expiresAt };
}

// ============================================
// UTILITÁRIOS
// ============================================

async function verificarSenha(senhaDigitada, senhaArmazenada) {
  if (!senhaArmazenada) return false;
  const hash = await sha256(senhaDigitada);
  return hash === senhaArmazenada;
}

function generatePIN() {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

function generateBackupCodes() {
  return Array.from({ length: 8 }, () =>
    crypto.randomUUID().replace(/-/g, '').slice(0, 8).toUpperCase()
  );
}

function generateBase32Secret(length = 16) {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ234567';
  let result = '';
  for (let i = 0; i < length; i++) {
    result += chars[Math.floor(Math.random() * chars.length)];
  }
  return result;
}

async function sendEmail(env, to, subject, html) {
  if (!env.RESEND_API_KEY) {
    console.warn('⚠️ RESEND_API_KEY não configurada');
    return;
  }
  if (!to) {
    console.error('❌ sendEmail: destinatário vazio');
    return;
  }
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(to)) {
    console.error(`❌ sendEmail: formato inválido — "${to}"`);
    return;
  }
  try {
    const response = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${env.RESEND_API_KEY}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        from: 'Santuário de Fátima <noreply@mail.santuariodefatima.com.br>',
        to: [to],
        subject,
        html
      })
    });
    const result = await response.json();
    if (response.ok) {
      console.log(`✅ Email enviado para: ${to}`);
    } else {
      console.error(`❌ Resend erro: ${JSON.stringify(result)}`);
    }
  } catch (e) {
    console.error('❌ sendEmail exception:', e.message);
  }
}

async function sendLoginLogEmail(env, user, request) {
  try {
    const ua = request.headers.get('User-Agent') || '';
    const ip = request.headers.get('CF-Connecting-IP') || 'desconhecido';
    const isMobile = /Mobile|Android|iPhone|iPad/i.test(ua);
    const browser = ua.includes('Edg') ? 'Edge'
      : ua.includes('Chrome') ? 'Chrome'
      : ua.includes('Firefox') ? 'Firefox'
      : ua.includes('Safari') ? 'Safari'
      : 'Outro';
    const os = ua.includes('Windows') ? 'Windows'
      : ua.includes('Mac') ? 'macOS'
      : ua.includes('Android') ? 'Android'
      : ua.includes('iPhone') || ua.includes('iPad') ? 'iOS'
      : ua.includes('Linux') ? 'Linux'
      : 'Outro';
    const agora = new Date().toLocaleString('pt-BR', {
      timeZone: 'America/Sao_Paulo',
      day: '2-digit', month: '2-digit', year: 'numeric',
      hour: '2-digit', minute: '2-digit', second: '2-digit'
    });

    // ✅ Busca localização pelo IP
    let cidade = 'desconhecida';
    let estado = '';
    let pais = 'BR';
    try {
      const geoRes = await fetch(`http://ip-api.com/json/${ip}?lang=pt-BR&fields=city,regionName,country,countryCode`);
      if (geoRes.ok) {
        const geo = await geoRes.json();
        cidade = geo.city || 'desconhecida';
        estado = geo.regionName || '';
        pais = geo.country || 'Brasil';
      }
    } catch (geoErr) {
      console.warn('⚠️ Geo lookup falhou:', geoErr.message);
    }

    const localizacao = estado ? `${cidade} — ${estado}, ${pais}` : `${cidade} — ${pais}`;

    await sendEmail(env, user.email,
      `🔐 Acesso ao Painel Admin — ${agora}`,
      `<div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;">
        <div style="background:#0d2a5c;padding:20px;text-align:center;">
          <h2 style="color:white;margin:0;">🔐 Log de Acesso — Painel Admin</h2>
          <p style="color:#aac4ff;margin:8px 0 0;font-size:13px;">Santuário de Fátima</p>
        </div>
        <div style="padding:24px;background:#f9f9f9;">
          <table style="width:100%;border-collapse:collapse;background:white;border-radius:8px;overflow:hidden;box-shadow:0 2px 8px rgba(0,0,0,0.08);">
            <tr style="border-bottom:1px solid #eee;">
              <td style="padding:12px 16px;font-weight:bold;color:#0d2a5c;width:40%;">👤 Usuário</td>
              <td style="padding:12px 16px;">${user.nome}</td>
            </tr>
            <tr style="border-bottom:1px solid #eee;background:#f9f9f9;">
              <td style="padding:12px 16px;font-weight:bold;color:#0d2a5c;">📧 E-mail</td>
              <td style="padding:12px 16px;">${user.email}</td>
            </tr>
            <tr style="border-bottom:1px solid #eee;">
              <td style="padding:12px 16px;font-weight:bold;color:#0d2a5c;">📅 Data/Hora</td>
              <td style="padding:12px 16px;">${agora}</td>
            </tr>
            <tr style="border-bottom:1px solid #eee;background:#f9f9f9;">
              <td style="padding:12px 16px;font-weight:bold;color:#0d2a5c;">🌐 IP</td>
              <td style="padding:12px 16px;">${ip}</td>
            </tr>
            <tr style="border-bottom:1px solid #eee;">
              <td style="padding:12px 16px;font-weight:bold;color:#0d2a5c;">📍 Localização</td>
              <td style="padding:12px 16px;">${localizacao}</td>
            </tr>
            <tr style="border-bottom:1px solid #eee;background:#f9f9f9;">
              <td style="padding:12px 16px;font-weight:bold;color:#0d2a5c;">${isMobile ? '📱' : '🖥️'} Dispositivo</td>
              <td style="padding:12px 16px;">${isMobile ? 'Celular' : 'Desktop'} — ${os}</td>
            </tr>
            <tr>
              <td style="padding:12px 16px;font-weight:bold;color:#0d2a5c;">🌍 Navegador</td>
              <td style="padding:12px 16px;">${browser}</td>
            </tr>
          </table>
          <div style="margin-top:20px;padding:15px;background:#fff3cd;border-radius:8px;border-left:4px solid #ffc107;">
            <p style="margin:0;font-size:13px;color:#856404;">
              ⚠️ <strong>Não foi você?</strong> Troque sua senha imediatamente!
            </p>
          </div>
          <div style="margin-top:12px;padding:12px;background:#d4edda;border-radius:8px;border-left:4px solid #28a745;">
            
          </div>
        </div>
        <div style="padding:16px;text-align:center;color:#999;font-size:12px;">
          Santuário Nossa Senhora de Fátima — Santo Amaro, São Paulo
        </div>
      </div>`
    );
  } catch (err) {
    console.error('❌ Erro ao enviar log de acesso:', err.message);
  }
}

// ✅ NOVA FUNÇÃO: Envia email de log para fiéis (conteúdo adaptado)
async function sendLoginLogEmailFiel(env, user, request) {
  try {
    const ua = request.headers.get('User-Agent') || '';
    const ip = request.headers.get('CF-Connecting-IP') || 'desconhecido';
    const isMobile = /Mobile|Android|iPhone|iPad/i.test(ua);
    const browser = ua.includes('Edg') ? 'Edge'
      : ua.includes('Chrome') ? 'Chrome'
      : ua.includes('Firefox') ? 'Firefox'
      : ua.includes('Safari') ? 'Safari'
      : 'Outro';
    const os = ua.includes('Windows') ? 'Windows'
      : ua.includes('Mac') ? 'macOS'
      : ua.includes('Android') ? 'Android'
      : ua.includes('iPhone') || ua.includes('iPad') ? 'iOS'
      : ua.includes('Linux') ? 'Linux'
      : 'Outro';
    const agora = new Date().toLocaleString('pt-BR', {
      timeZone: 'America/Sao_Paulo',
      day: '2-digit', month: '2-digit', year: 'numeric',
      hour: '2-digit', minute: '2-digit', second: '2-digit'
    });

    // Busca localização pelo IP
    let cidade = 'desconhecida';
    let estado = '';
    let pais = 'Brasil';
    try {
      const geoRes = await fetch(`http://ip-api.com/json/${ip}?lang=pt-BR&fields=city,regionName,country`);
      if (geoRes.ok) {
        const geo = await geoRes.json();
        cidade = geo.city || 'desconhecida';
        estado = geo.regionName || '';
        pais = geo.country || 'Brasil';
      }
    } catch (e) {
      console.warn('⚠️ Geo lookup falhou:', e.message);
    }

    const localizacao = estado ? `${cidade} — ${estado}, ${pais}` : `${cidade} — ${pais}`;

    await sendEmail(env, user.email,
      `✅ Novo acesso à sua conta — ${agora}`,
      `<div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;">
        <div style="background:#0d2a5c;padding:20px;text-align:center;">
          <h2 style="color:white;margin:0;">✅ Acesso Realizado</h2>
          <p style="color:#aac4ff;margin:8px 0 0;font-size:13px;">Santuário de Fátima — Minha Conta</p>
        </div>
        <div style="padding:24px;background:#f9f9f9;">
          <p style="color:#333;margin:0 0 20px;">Olá <strong>${user.nome}</strong>, registramos um novo acesso à sua conta.</p>
          <table style="width:100%;border-collapse:collapse;background:white;border-radius:8px;overflow:hidden;box-shadow:0 2px 8px rgba(0,0,0,0.08);">
            <tr style="border-bottom:1px solid #eee;">
              <td style="padding:12px 16px;font-weight:bold;color:#0d2a5c;width:40%;">📅 Data/Hora</td>
              <td style="padding:12px 16px;">${agora}</td>
            </tr>
            <tr style="border-bottom:1px solid #eee;background:#f9f9f9;">
              <td style="padding:12px 16px;font-weight:bold;color:#0d2a5c;">🌐 IP</td>
              <td style="padding:12px 16px;">${ip}</td>
            </tr>
            <tr style="border-bottom:1px solid #eee;">
              <td style="padding:12px 16px;font-weight:bold;color:#0d2a5c;">📍 Localização</td>
              <td style="padding:12px 16px;">${localizacao}</td>
            </tr>
            <tr style="border-bottom:1px solid #eee;background:#f9f9f9;">
              <td style="padding:12px 16px;font-weight:bold;color:#0d2a5c;">${isMobile ? '📱' : '🖥️'} Dispositivo</td>
              <td style="padding:12px 16px;">${isMobile ? 'Celular' : 'Desktop'} — ${os}</td>
            </tr>
            <tr>
              <td style="padding:12px 16px;font-weight:bold;color:#0d2a5c;">🌍 Navegador</td>
              <td style="padding:12px 16px;">${browser}</td>
            </tr>
          </table>
          <div style="margin-top:20px;padding:15px;background:#fff3cd;border-radius:8px;border-left:4px solid #ffc107;">
            <p style="margin:0;font-size:13px;color:#856404;">
              ⚠️ <strong>Não foi você?</strong> Troque sua senha imediatamente em <a href="${(env.FRONTEND_URL || 'https://santuariodefatima.com.br')}/minha-conta" style="color:#856404;">Minha Conta</a>.
            </p>
          </div>
        </div>
        <div style="padding:16px;text-align:center;color:#999;font-size:12px;">
          Santuário Nossa Senhora de Fátima — Santo Amaro, São Paulo
        </div>
      </div>`
    );
  } catch (err) {
    console.error('❌ Erro ao enviar log fiel:', err.message);
  }
}

function getFrontendUrl(env) {
  return (env.FRONTEND_URL || 'https://santuariodefatima.com.br').replace(/\/$/, '');
}

function validarEmail(email) {
  return email && email.includes('@') && email.length <= 255;
}

function validarCelular(celular) {
  const digits = celular?.replace(/\D/g, '') || '';
  return digits.length >= 10 && digits.length <= 11;
}

function validarSenha(senha) {
  const checks = {
    length: senha.length >= 8,
    uppercase: /[A-Z]/.test(senha),
    lowercase: /[a-z]/.test(senha),
    number: /[0-9]/.test(senha),
    special: /[!@#$%^&*(),.?":{}|<>]/.test(senha)
  };
  const score = Object.values(checks).filter(Boolean).length;
  return { isValid: score >= 4, checks, score };
}

// ============================================
// 1. LOGIN
// ============================================
export async function fielLoginRoute(request, env) {
  if (!firewall(request)) return new Response("Blocked", { status: 403 });

  try {
    const body = await request.json();
    const { email, senha } = body;

    if (!email || !senha) {
      return jsonResponse({ success: false, error: 'Preencha todos os campos' });
    }

    const emailNorm = email.toLowerCase().trim();
    const rateLimitResponse = await applyRateLimit(request, env, emailNorm);
    if (rateLimitResponse) return rateLimitResponse;

    const user = await env.DB.prepare(
      `SELECT id, nome, email, senha_hash, role, twofa_enabled, twofa_secret,
              backup_codes, celular, failed_attempts, locked_until
       FROM users WHERE LOWER(email) = ?`
    ).bind(emailNorm).first();

    if (!user) return jsonResponse({ success: false, error: 'E-mail ou senha inválidos' });

    if (user.locked_until && user.locked_until > Date.now()) {
      const waitMinutes = Math.ceil((user.locked_until - Date.now()) / 60000);
      return jsonResponse({ success: false, error: `Conta bloqueada. Tente novamente em ${waitMinutes} minutos.` });
    }

    const senhaOk = await verificarSenha(senha, user.senha_hash);
    if (!senhaOk) {
      const newAttempts = (user.failed_attempts || 0) + 1;
      const lockUntil = newAttempts >= 5 ? Date.now() + 15 * 60 * 1000 : 0;
      await env.DB.prepare(
        `UPDATE users SET failed_attempts = ?, locked_until = ? WHERE id = ?`
      ).bind(newAttempts, lockUntil, user.id).run();
      return jsonResponse({ success: false, error: 'E-mail ou senha inválidos' });
    }

    await env.DB.prepare(
      `UPDATE users SET failed_attempts = 0, locked_until = 0 WHERE id = ?`
    ).bind(user.id).run();

    const pin = generatePIN();
    const pinHash = await sha256(pin);
    const pinExpiry = Date.now() + 10 * 60 * 1000;

    await env.DB.prepare(
      `UPDATE users SET login_pin = ?, login_pin_expires = ?, last_login_at = ? WHERE id = ?`
    ).bind(pinHash, pinExpiry, Date.now(), user.id).run();

    const nome = user.nome || 'Usuário';
    await sendEmail(env, user.email, 'Seu código de acesso - Santuário de Fátima',
      `<div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;">
        <div style="background:#0d2a5c;padding:20px;text-align:center;">
          <h2 style="color:white;margin:0;">🔐 Código de Acesso</h2>
        </div>
        <div style="padding:24px;">
          <p>Olá <strong>${nome}</strong>,</p>
          <p>Seu código de verificação é:</p>
          <p style="font-size:32px;font-weight:bold;text-align:center;letter-spacing:8px;background:#f5f5f5;padding:20px;border-radius:8px;">${pin}</p>
          <p>Válido por <strong>10 minutos</strong>.</p>
          <p style="color:#999;font-size:12px;">Se não foi você, ignore este e-mail.</p>
        </div>
      </div>`
    );

    return jsonResponse({
      success: true,
      nextStep: 'pin',
      userId: user.id,
      email: user.email,
      nome,
      role: user.role,
      isAdmin: user.role === 'admin',
      has2FA: user.twofa_enabled === 1
    });

  } catch (err) {
    console.error('❌ fielLoginRoute:', err);
    return jsonResponse({ success: false, error: 'Erro interno: ' + err.message }, 500);
  }
}

// ============================================
// 2. REGISTRO
// ============================================
export async function fielRegisterRoute(request, env) {
  try {
    const body = await request.json();
    const { nome, email, senha, celular } = body;

    if (!nome || !email || !senha) {
      return jsonResponse({ success: false, error: 'Preencha todos os campos obrigatórios' });
    }
    if (!validarEmail(email)) return jsonResponse({ success: false, error: 'E-mail inválido' });
    if (!validarCelular(celular)) return jsonResponse({ success: false, error: 'Celular inválido (com DDD, mínimo 10 dígitos)' });

    const senhaValidation = validarSenha(senha);
    if (!senhaValidation.isValid) {
      return jsonResponse({ success: false, error: 'Senha fraca. Use maiúsculas, minúsculas, números e caracteres especiais.' });
    }

    const emailNorm = email.toLowerCase().trim();

    const existe = await env.DB.prepare(
      "SELECT id FROM users WHERE LOWER(email) = ?"
    ).bind(emailNorm).first();
    if (existe) return jsonResponse({ success: false, error: 'E-mail já cadastrado' });

    const senha_hash = await sha256(senha);
    const id = crypto.randomUUID();

    await env.DB.prepare(
      `INSERT INTO users (id, nome, email, senha_hash, celular, role, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, 'fiel', ?, ?)`
    ).bind(id, nome.trim(), emailNorm, senha_hash, celular.replace(/\D/g, ''),
            Date.now(), Date.now()).run();

    return jsonResponse({ success: true, message: 'Cadastro realizado com sucesso!' });

  } catch (err) {
    console.error('❌ fielRegisterRoute:', err);
    return jsonResponse({ success: false, error: 'Erro interno: ' + err.message }, 500);
  }
}

// ============================================
// 3. VERIFICAR TOKEN (KV)
// ============================================
export async function fielVerificarRoute(request, env) {
  try {
    const authHeader = request.headers.get('Authorization');
    const token = authHeader?.replace('Bearer ', '');

    if (!token) return jsonResponse({ success: false, error: 'Token não fornecido' }, 401);

    const hash = await hashToken(token);
    const sessionData = await env.KV_SESSION.get(`sess:${hash}`, 'json');

    if (!sessionData || sessionData.expires < Date.now()) {
      return jsonResponse({ success: false, error: 'Token inválido ou expirado' }, 401);
    }

    return jsonResponse({ success: true, user: sessionData.user });

  } catch (err) {
    console.error('❌ fielVerificarRoute:', err);
    return jsonResponse({ success: false, error: 'Erro interno: ' + err.message }, 500);
  }
}

// ============================================
// 4. VERIFICAR PIN
// ============================================
export async function fielVerifyPinRoute(request, env) {
  try {
    const body = await request.json();
    const { userId, pin, celular } = body;

    if (!userId || !pin) return jsonResponse({ success: false, error: 'Dados incompletos' });

    const rateLimitResponse = await applyRateLimit(request, env, String(userId));
    if (rateLimitResponse) return rateLimitResponse;

    const user = await env.DB.prepare(
      `SELECT id, nome, email, login_pin, login_pin_expires, twofa_enabled, twofa_secret, role,
              failed_2fa_attempts, twofa_locked_until
       FROM users WHERE id = ?`
    ).bind(userId).first();

    if (!user) return jsonResponse({ success: false, error: 'Usuário não encontrado' });

    if (user.twofa_locked_until && user.twofa_locked_until > Date.now()) {
      const wait = Math.ceil((user.twofa_locked_until - Date.now()) / 60000);
      return jsonResponse({ success: false, error: `Muitas tentativas. Tente novamente em ${wait} minutos.` });
    }

    if (!user.login_pin) return jsonResponse({ success: false, error: 'Nenhum PIN ativo. Solicite um novo.' });
    if (Date.now() > user.login_pin_expires) return jsonResponse({ success: false, error: 'PIN expirado. Solicite um novo.' });

    const pinHash = await sha256(pin);
    if (user.login_pin !== pinHash) {
      const attempts = (user.failed_2fa_attempts || 0) + 1;
      const lockTime = attempts >= 8
        ? Date.now() + 15 * 60 * 1000
        : attempts >= 5
          ? Date.now() + 5 * 60 * 1000
          : 0;
      await env.DB.prepare(
        `UPDATE users SET failed_2fa_attempts = ?, twofa_locked_until = ? WHERE id = ?`
      ).bind(attempts, lockTime, user.id).run();
      return jsonResponse({ success: false, error: 'PIN inválido' });
    }

    await env.DB.prepare(
      `UPDATE users SET failed_2fa_attempts = 0, twofa_locked_until = 0,
                        login_pin = NULL, login_pin_expires = NULL WHERE id = ?`
    ).bind(user.id).run();

    if (celular && validarCelular(celular)) {
      await env.DB.prepare(
        `UPDATE users SET celular = ? WHERE id = ? AND (celular IS NULL OR celular = '')`
      ).bind(celular.replace(/\D/g, ''), user.id).run();
    }

    if (user.twofa_secret && user.twofa_enabled === 1) {
      return jsonResponse({
        success: true,
        nextStep: '2fa-verify',
        userId: user.id,
        role: user.role,
        isAdmin: user.role === 'admin'
      });
    }

    const secretKey = generateBase32Secret();
    const issuer = 'SantuarioFatima';
    const label = `${issuer}:${user.email}`;
    const otpauth = `otpauth://totp/${encodeURIComponent(label)}?secret=${secretKey}&issuer=${issuer}`;
    const qrCodeUrl = `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(otpauth)}`;

    const backupCodes = generateBackupCodes();
    const hashedBackupCodes = await Promise.all(backupCodes.map(c => sha256(c)));

    await env.DB.prepare(
      `UPDATE users SET twofa_secret = ?, twofa_enabled = 0, backup_codes = ? WHERE id = ?`
    ).bind(secretKey, JSON.stringify(hashedBackupCodes), user.id).run();

    return jsonResponse({
      success: true,
      nextStep: '2fa-setup',
      userId: user.id,
      nome: user.nome,
      email: user.email,
      role: user.role,
      isAdmin: user.role === 'admin',
      qrCodeUrl,
      secretKey,
      backupCodes
    });

  } catch (err) {
    console.error('❌ fielVerifyPinRoute:', err);
    return jsonResponse({ success: false, error: 'Erro interno: ' + err.message }, 500);
  }
}

// ============================================
// 5. REENVIAR PIN
// ============================================
export async function fielReenviarPinRoute(request, env) {
  try {
    const body = await request.json();
    const { userId } = body;

    const user = await env.DB.prepare(
      `SELECT id, nome, email FROM users WHERE id = ?`
    ).bind(userId).first();

    if (!user) return jsonResponse({ success: false, error: 'Usuário não encontrado' });

    const pin = generatePIN();
    const pinHash = await sha256(pin);
    const expiry = Date.now() + 10 * 60 * 1000;

    await env.DB.prepare(
      `UPDATE users SET login_pin = ?, login_pin_expires = ? WHERE id = ?`
    ).bind(pinHash, expiry, userId).run();

    await sendEmail(env, user.email, 'Novo código de acesso - Santuário de Fátima',
      `<div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;">
        <div style="background:#0d2a5c;padding:20px;text-align:center;">
          <h2 style="color:white;margin:0;">🔄 Novo Código de Acesso</h2>
        </div>
        <div style="padding:24px;">
          <p>Olá <strong>${user.nome}</strong>,</p>
          <p>Seu novo código é:</p>
          <p style="font-size:32px;font-weight:bold;text-align:center;letter-spacing:8px;background:#f5f5f5;padding:20px;border-radius:8px;">${pin}</p>
          <p>Válido por <strong>10 minutos</strong>.</p>
        </div>
      </div>`
    );

    return jsonResponse({ success: true, message: 'Novo PIN enviado!' });

  } catch (err) {
    console.error('❌ fielReenviarPinRoute:', err);
    return jsonResponse({ success: false, error: 'Erro interno: ' + err.message }, 500);
  }
}

// ============================================
// 6. SETUP 2FA (stub)
// ============================================
export async function fielSetup2faRoute(request, env) {
  return jsonResponse({ success: true });
}

// ============================================
// 7. VERIFICAR 2FA ← COM LOG DE ACESSO ATUALIZADO
// ============================================
export async function fielVerify2faRoute(request, env) {
  try {
    const body = await request.json();
    const { userId, codigo2FA } = body;

    if (!codigo2FA || !/^\d{6}$/.test(codigo2FA)) {
      return jsonResponse({ success: false, error: 'Código de 6 dígitos obrigatório' });
    }

    const rateLimitResponse = await applyRateLimit(request, env, String(userId));
    if (rateLimitResponse) return rateLimitResponse;

    const user = await env.DB.prepare(
      `SELECT id, nome, email, twofa_secret, twofa_enabled, role,
              failed_2fa_attempts, twofa_locked_until
       FROM users WHERE id = ?`
    ).bind(userId).first();

    if (!user) return jsonResponse({ success: false, error: 'Usuário não encontrado' });
    if (!user.twofa_secret) return jsonResponse({ success: false, error: '2FA não configurado' });

    if (user.twofa_locked_until && user.twofa_locked_until > Date.now()) {
      const wait = Math.ceil((user.twofa_locked_until - Date.now()) / 60000);
      return jsonResponse({ success: false, error: `Muitas tentativas. Tente novamente em ${wait} minutos.` });
    }

    const valid = await validateTOTP(user.twofa_secret, codigo2FA);
    if (!valid) {
      const attempts = (user.failed_2fa_attempts || 0) + 1;
      const lockTime = attempts >= 8
        ? Date.now() + 15 * 60 * 1000
        : attempts >= 5
          ? Date.now() + 5 * 60 * 1000
          : 0;
      await env.DB.prepare(
        `UPDATE users SET failed_2fa_attempts = ?, twofa_locked_until = ? WHERE id = ?`
      ).bind(attempts, lockTime, user.id).run();
      return jsonResponse({ success: false, error: 'Código 2FA inválido' });
    }

    await env.DB.prepare(
      `UPDATE users SET failed_2fa_attempts = 0, twofa_locked_until = 0,
                        twofa_enabled = 1 WHERE id = ?`
    ).bind(user.id).run();

    // ✅ Envia email de log para TODOS (admin e fiel)
    if (user.role === 'admin') {
      await sendLoginLogEmail(env, user, request);
    } else {
      await sendLoginLogEmailFiel(env, user, request);
    }

    // ✅ Cria sessão com info do dispositivo
    const { token, expiresAt } = await createSession(env, user, request);
    const role = user.role || 'fiel';

    return jsonResponse({
      success: true,
      token,
      expiresAt,
      user: { id: user.id, nome: user.nome, email: user.email, role },
      redirectTo: role === 'admin' ? '/paineladmin' : '/paineldofiel',
      isAdmin: role === 'admin'
    });

  } catch (err) {
    console.error('❌ fielVerify2faRoute:', err);
    return jsonResponse({ success: false, error: 'Erro interno: ' + err.message }, 500);
  }
}

// ============================================
// 8. ESQUECI SENHA
// ============================================
export async function fielEsqueciSenhaRoute(request, env) {
  try {
    const body = await request.json();
    const { email } = body;

    if (!email) return jsonResponse({ success: false, error: 'E-mail obrigatório' });

    const emailNorm = email.toLowerCase().trim();

    const rateLimitResponse = await applyRateLimit(request, env, emailNorm);
    if (rateLimitResponse) return rateLimitResponse;

    const user = await env.DB.prepare(
      "SELECT id, nome, email FROM users WHERE LOWER(email) = ?"
    ).bind(emailNorm).first();

    if (!user) {
      return jsonResponse({ success: true, message: 'Se o e-mail estiver cadastrado, você receberá o link.' });
    }

    const rawToken = crypto.randomUUID();
    const tokenHash = await sha256(rawToken);
    const expiresAt = Date.now() + 60 * 60 * 1000;

    await env.DB.prepare(`
      CREATE TABLE IF NOT EXISTS reset_tokens (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id TEXT NOT NULL,
        token TEXT NOT NULL,
        expires_at INTEGER NOT NULL,
        used INTEGER DEFAULT 0,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `).run();

    await env.DB.prepare("DELETE FROM reset_tokens WHERE user_id = ?").bind(user.id).run();
    await env.DB.prepare(
      "INSERT INTO reset_tokens (user_id, token, expires_at) VALUES (?, ?, ?)"
    ).bind(user.id, tokenHash, expiresAt).run();

    const frontendUrl = getFrontendUrl(env);
    const link = `${frontendUrl}/sanctum?reset_token=${rawToken}&userId=${user.id}`;

    await sendEmail(env, user.email, '🔑 Recuperação de Senha - Santuário de Fátima',
      `<div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;">
        <div style="background:#0d2a5c;padding:20px;text-align:center;">
          <h2 style="color:white;margin:0;">🔑 Redefinição de Senha</h2>
        </div>
        <div style="padding:24px;">
          <p>Olá <strong>${user.nome}</strong>,</p>
          <p>Clique no botão abaixo para criar uma nova senha:</p>
          <div style="text-align:center;margin:32px 0;">
            <a href="${link}" style="background:#0d2a5c;color:white;padding:14px 28px;text-decoration:none;border-radius:8px;font-size:16px;">
              🔑 Redefinir minha senha
            </a>
          </div>
          <p>⏱️ Válido por <strong>1 hora</strong>.</p>
          <p style="color:#999;font-size:12px;word-break:break-all;">Link direto: ${link}</p>
        </div>
      </div>`
    );

    return jsonResponse({ success: true, message: 'Link enviado para seu e-mail!' });

  } catch (err) {
    console.error('❌ fielEsqueciSenhaRoute:', err);
    return jsonResponse({ success: false, error: 'Erro interno: ' + err.message }, 500);
  }
}

// ============================================
// 9. CONFIRMAR RESET SENHA
// ============================================
export async function fielConfirmarResetSenhaRoute(request, env) {
  try {
    const body = await request.json();
    const { token, novaSenha, userId } = body;

    if (!token || !novaSenha || !userId) {
      return jsonResponse({ success: false, error: 'Dados incompletos' });
    }

    const rateLimitResponse = await applyRateLimit(request, env, String(userId));
    if (rateLimitResponse) return rateLimitResponse;

    const tokenHash = await sha256(token);

    const record = await env.DB.prepare(
      "SELECT * FROM reset_tokens WHERE token = ? AND used = 0"
    ).bind(tokenHash).first();

    if (!record) return jsonResponse({ success: false, error: 'Token inválido ou já utilizado' });
    if (String(record.user_id) !== String(userId)) return jsonResponse({ success: false, error: 'Token inválido' });
    if (Date.now() > record.expires_at) {
      await env.DB.prepare("DELETE FROM reset_tokens WHERE token = ?").bind(tokenHash).run();
      return jsonResponse({ success: false, error: 'Token expirado' });
    }

    const senhaValidation = validarSenha(novaSenha);
    if (!senhaValidation.isValid) {
      return jsonResponse({ success: false, error: 'Senha fraca. Use maiúsculas, minúsculas, números e caracteres especiais.' });
    }

    const senha_hash = await sha256(novaSenha);

    await env.DB.prepare(
      `UPDATE users SET senha_hash = ?, updated_at = ? WHERE id = ?`
    ).bind(senha_hash, Date.now(), userId).run();

    await env.DB.prepare("UPDATE reset_tokens SET used = 1 WHERE token = ?").bind(tokenHash).run();
    await env.DB.prepare("DELETE FROM reset_tokens WHERE token = ?").bind(tokenHash).run();

    return jsonResponse({ success: true, message: 'Senha redefinida com sucesso!' });

  } catch (err) {
    console.error('❌ fielConfirmarResetSenhaRoute:', err);
    return jsonResponse({ success: false, error: 'Erro interno: ' + err.message }, 500);
  }
}

// ============================================
// 10. RESET 2FA BACKUP
// ============================================
export async function fielReset2faBackupRoute(request, env) {
  try {
    const body = await request.json();
    const { email, backupCode } = body;

    const emailNorm = email.toLowerCase().trim();

    const user = await env.DB.prepare(
      "SELECT id, backup_codes FROM users WHERE LOWER(email) = ?"
    ).bind(emailNorm).first();

    if (!user) return jsonResponse({ success: false, error: 'Usuário não encontrado' });

    const hashed = await sha256(backupCode.toUpperCase());
    const stored = JSON.parse(user.backup_codes || '[]');

    if (!stored.includes(hashed)) {
      return jsonResponse({ success: false, error: 'Código de backup inválido' });
    }

    const updated = stored.filter(c => c !== hashed);
    await env.DB.prepare(
      `UPDATE users SET twofa_enabled = 0, twofa_secret = NULL, backup_codes = ? WHERE id = ?`
    ).bind(JSON.stringify(updated), user.id).run();

    return jsonResponse({ success: true, message: '2FA removido! Configure novamente no próximo login.' });

  } catch (err) {
    console.error('❌ fielReset2faBackupRoute:', err);
    return jsonResponse({ success: false, error: 'Erro interno: ' + err.message }, 500);
  }
}

// ============================================
// 11. SOLICITAR RESET 2FA POR E-MAIL
// ============================================
export async function fielSolicitarReset2faRoute(request, env) {
  try {
    const body = await request.json();
    const { email } = body;

    if (!email) return jsonResponse({ success: false, error: 'E-mail obrigatório' });

    const emailNorm = email.toLowerCase().trim();

    const rateLimitResponse = await applyRateLimit(request, env, emailNorm);
    if (rateLimitResponse) return rateLimitResponse;

    const user = await env.DB.prepare(
      "SELECT id, nome, email FROM users WHERE LOWER(email) = ?"
    ).bind(emailNorm).first();

    if (!user) return jsonResponse({ success: false, error: 'Usuário não encontrado' });

    const rawToken = crypto.randomUUID();
    const tokenHash = await sha256(rawToken);
    const expiresAt = Date.now() + 10 * 60 * 1000;

    await env.DB.prepare(`
      CREATE TABLE IF NOT EXISTS two_factor_reset_tokens (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id TEXT NOT NULL,
        token TEXT NOT NULL,
        expires_at INTEGER NOT NULL,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `).run();

    await env.DB.prepare("DELETE FROM two_factor_reset_tokens WHERE user_id = ?").bind(user.id).run();
    await env.DB.prepare(
      "INSERT INTO two_factor_reset_tokens (user_id, token, expires_at) VALUES (?, ?, ?)"
    ).bind(user.id, tokenHash, expiresAt).run();

    const frontendUrl = getFrontendUrl(env);
    const link = `${frontendUrl}/sanctum?reset2fa=${rawToken}`;

    await sendEmail(env, user.email, '🔐 Recuperação de 2FA - Santuário de Fátima',
      `<div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;">
        <div style="background:#0d2a5c;padding:20px;text-align:center;">
          <h2 style="color:white;margin:0;">🔐 Recuperação de 2FA</h2>
        </div>
        <div style="padding:24px;">
          <p>Olá <strong>${user.nome}</strong>,</p>
          <p>Clique abaixo para remover o 2FA da sua conta:</p>
          <div style="text-align:center;margin:24px 0;">
            <a href="${link}" style="background:#7c3aed;color:white;padding:14px 28px;text-decoration:none;border-radius:8px;font-size:16px;">
              🔓 Remover 2FA
            </a>
          </div>
          <p>⏱️ Válido por <strong>10 minutos</strong>.</p>
          <p style="color:#ef4444;font-size:13px;">⚠️ Se não foi você, troque sua senha imediatamente!</p>
          <p style="color:#999;font-size:12px;word-break:break-all;">Link direto: ${link}</p>
        </div>
      </div>`
    );

    return jsonResponse({ success: true, message: 'Link enviado para seu e-mail!' });

  } catch (err) {
    console.error('❌ fielSolicitarReset2faRoute:', err);
    return jsonResponse({ success: false, error: 'Erro interno: ' + err.message }, 500);
  }
}

// ============================================
// 12. CONFIRMAR RESET 2FA POR TOKEN
// ============================================
export async function fielConfirmarReset2faRoute(request, env) {
  try {
    const body = await request.json();
    const { token } = body;

    if (!token) return jsonResponse({ success: false, error: 'Token obrigatório' });

    const rateLimitResponse = await applyRateLimit(request, env, token.slice(0, 16));
    if (rateLimitResponse) return rateLimitResponse;

    const tokenHash = await sha256(token);

    const record = await env.DB.prepare(
      "SELECT * FROM two_factor_reset_tokens WHERE token = ?"
    ).bind(tokenHash).first();

    if (!record) return jsonResponse({ success: false, error: 'Token inválido' });
    if (Date.now() > record.expires_at) {
      await env.DB.prepare("DELETE FROM two_factor_reset_tokens WHERE token = ?").bind(tokenHash).run();
      return jsonResponse({ success: false, error: 'Token expirado' });
    }

    await env.DB.prepare(
      `UPDATE users SET twofa_enabled = 0, twofa_secret = NULL, backup_codes = NULL WHERE id = ?`
    ).bind(record.user_id).run();

    await env.DB.prepare("DELETE FROM two_factor_reset_tokens WHERE token = ?").bind(tokenHash).run();

    return jsonResponse({ success: true, message: '2FA removido! Configure novamente no próximo login.' });

  } catch (err) {
    console.error('❌ fielConfirmarReset2faRoute:', err);
    return jsonResponse({ success: false, error: 'Erro interno: ' + err.message }, 500);
  }
}

// ============================================
// 13. LOGOUT
// ============================================
export async function fielLogoutRoute(request, env) {
  try {
    const authHeader = request.headers.get('Authorization');
    const token = authHeader?.replace('Bearer ', '');

    if (token) {
      const hash = await hashToken(token);
      await env.KV_SESSION.delete(`sess:${hash}`);
    }

    return jsonResponse({ success: true, message: 'Logout realizado com sucesso' });
  } catch (err) {
    console.error('❌ fielLogoutRoute:', err);
    return jsonResponse({ success: false, error: 'Erro interno: ' + err.message }, 500);
  }
}