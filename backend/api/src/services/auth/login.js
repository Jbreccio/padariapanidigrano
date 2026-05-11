import speakeasy from 'speakeasy';
import qrcode from 'qrcode';
import jwt from 'jsonwebtoken';
import { Resend } from 'resend';
import { query } from '../db/connection.js';

const resend = new Resend(process.env.RESEND_API_KEY);

// ─────────────────────────────────────────────────────────────────────────────
// Helper: envia e-mail com QR Code via Resend
// ─────────────────────────────────────────────────────────────────────────────
async function enviarEmailQRCode(email, nome, secret, otpauthUrl) {
  const qrDataUrl = await qrcode.toDataURL(otpauthUrl, { width: 200, margin: 2 });

  await resend.emails.send({
    from:    process.env.RESEND_FROM,
    to:      email,
    subject: '🔐 Configure seu Google Authenticator — Santuário de Fátima',
    html: `
      <!DOCTYPE html>
      <html lang="pt-BR">
      <head>
        <meta charset="UTF-8" />
        <meta name="viewport" content="width=device-width,initial-scale=1" />
      </head>
      <body style="margin:0;padding:0;background:#f0f4f8;font-family:Arial,sans-serif;">
        <table width="100%" cellpadding="0" cellspacing="0" style="background:#f0f4f8;padding:32px 0;">
          <tr><td align="center">
            <table width="480" cellpadding="0" cellspacing="0"
              style="background:#fff;border-radius:16px;overflow:hidden;box-shadow:0 4px 24px rgba(0,0,0,.1);">

              <!-- Cabeçalho -->
              <tr>
                <td style="background:linear-gradient(135deg,#051f2c,#1e6fa8);padding:28px 32px;text-align:center;">
                  <p style="margin:0;color:#fff;font-size:22px;font-weight:bold;">🛡️ Autenticação em 2 Etapas</p>
                  <p style="margin:6px 0 0;color:rgba(255,255,255,.7);font-size:13px;">Santuário de Fátima — Área Administrativa</p>
                </td>
              </tr>

              <!-- Corpo -->
              <tr>
                <td style="padding:28px 32px;">
                  <p style="margin:0 0 8px;font-size:15px;color:#1a2a3a;">Olá, <strong>${nome}</strong>!</p>
                  <p style="margin:0 0 20px;font-size:14px;color:#4a5568;line-height:1.6;">
                    Suas credenciais foram validadas. Siga os passos abaixo para concluir o acesso:
                  </p>

                  <!-- Passo 1 -->
                  <div style="background:#f7fafc;border:1px solid #e2e8f0;border-radius:10px;padding:16px;margin-bottom:14px;">
                    <p style="margin:0 0 4px;font-size:13px;font-weight:bold;color:#2d3748;">📱 Passo 1 — Instale o Google Authenticator</p>
                    <p style="margin:0;font-size:13px;color:#4a5568;">Disponível gratuitamente na App Store e Google Play.</p>
                  </div>

                  <!-- Passo 2 — QR Code -->
                  <div style="background:#f7fafc;border:1px solid #e2e8f0;border-radius:10px;padding:16px;margin-bottom:14px;text-align:center;">
                    <p style="margin:0 0 12px;font-size:13px;font-weight:bold;color:#2d3748;">📷 Passo 2 — Escaneie o QR Code com o app</p>
                    <img
                      src="${qrDataUrl}"
                      alt="QR Code Google Authenticator"
                      style="width:160px;height:160px;border:4px solid #fff;border-radius:8px;box-shadow:0 2px 8px rgba(0,0,0,.12);"
                    />
                    <p style="margin:10px 0 4px;font-size:11px;color:#718096;">Ou insira manualmente a chave secreta:</p>
                    <p style="margin:0;font-family:monospace;font-size:13px;font-weight:bold;color:#2d3748;
                               letter-spacing:2px;background:#e2e8f0;display:inline-block;
                               padding:4px 12px;border-radius:6px;">${secret}</p>
                  </div>

                  <!-- Passo 3 -->
                  <div style="background:#ebf8ff;border:1px solid #bee3f8;border-radius:10px;padding:16px;margin-bottom:14px;">
                    <p style="margin:0 0 4px;font-size:13px;font-weight:bold;color:#2c5282;">🔢 Passo 3 — Digite o código no painel</p>
                    <p style="margin:0;font-size:13px;color:#2c5282;">
                      O app gera um código novo a cada 30 segundos. Use o código exibido na tela de login.
                    </p>
                  </div>

                  <!-- Aviso -->
                  <div style="background:#fff5f5;border:1px solid #fed7d7;border-radius:10px;padding:12px 16px;">
                    <p style="margin:0;font-size:12px;color:#c53030;">
                      🔒 <strong>Atenção:</strong> Não compartilhe este e-mail. Se não foi você quem solicitou, ignore esta mensagem.
                    </p>
                  </div>
                </td>
              </tr>

              <!-- Rodapé -->
              <tr>
                <td style="background:#f7fafc;border-top:1px solid #e2e8f0;padding:16px 32px;text-align:center;">
                  <p style="margin:0;font-size:11px;color:#a0aec0;">
                    © ${new Date().getFullYear()} Santuário de Nossa Senhora de Fátima — Sistema Administrativo
                  </p>
                </td>
              </tr>

            </table>
          </td></tr>
        </table>
      </body>
      </html>
    `,
  });
}

// ─────────────────────────────────────────────────────────────────────────────
// ENDPOINT 1 — POST /api/auth/solicitar-2fa
// Valida email + PIN → gera/reutiliza secret TOTP → envia QR Code por e-mail
// ─────────────────────────────────────────────────────────────────────────────
export const solicitarDoisFA = async (req, res) => {
  const { email, pinCode } = req.body;

  if (!email || !pinCode) {
    return res.status(400).json({ success: false, error: 'E-mail e PIN são obrigatórios' });
  }

  try {
    const users = await query(
      'SELECT * FROM ADMINISTRADORES WHERE email = ? AND ativo = TRUE',
      [email.trim().toLowerCase()]
    );

    if (users.length === 0) {
      console.log('⚠️ Usuário não encontrado:', email);
      await query(
        'INSERT INTO login_attempts (email, ip_address, success) VALUES (?, ?, ?)',
        [email, req.ip || 'unknown', false]
      );
      return res.status(401).json({ success: false, error: 'Credenciais inválidas' });
    }

    const user = users[0];

    // Verificar PIN
    if (pinCode !== user.pin_code) {
      console.log('❌ PIN incorreto para:', email);
      await query(
        'INSERT INTO login_attempts (email, ip_address, success) VALUES (?, ?, ?)',
        [email, req.ip || 'unknown', false]
      );
      return res.status(401).json({ success: false, error: 'Credenciais inválidas' });
    }

    // Gerar secret TOTP se o usuário ainda não tiver
    let secret = user.google_secret;
    if (!secret) {
      const generated = speakeasy.generateSecret({
        name:   `Santuário Fátima (${user.email})`,
        issuer: 'Santuário de Fátima',
        length: 20,
      });
      secret = generated.base32;
      await query(
        'UPDATE ADMINISTRADORES SET google_secret = ? WHERE id = ?',
        [secret, user.id]
      );
      console.log('🔑 Novo secret TOTP gerado para:', email);
    }

    // Montar URL otpauth para o QR Code
    const otpauthUrl = speakeasy.otpauthURL({
      secret,
      label:    encodeURIComponent(`Santuário Fátima (${user.email})`),
      issuer:   'Santuário de Fátima',
      encoding: 'base32',
    });

    // Enviar e-mail com QR Code
    await enviarEmailQRCode(user.email, user.nome, secret, otpauthUrl);
    console.log('✅ QR Code enviado para:', user.email);

    return res.json({
      success: true,
      message: 'QR Code enviado para seu e-mail. Configure o autenticador e insira o código.',
    });

  } catch (error) {
    console.error('❌ Erro em solicitar-2fa:', error);
    return res.status(500).json({ success: false, error: 'Erro interno no servidor' });
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// ENDPOINT 2 — POST /api/auth/login
// Valida email + PIN + TOTP → retorna JWT
// ─────────────────────────────────────────────────────────────────────────────
export const loginAdministrador = async (req, res) => {
  console.log('🔐 Tentativa de login:', req.body.email);

  try {
    const { email, pinCode, totpToken } = req.body;

    if (!email || !pinCode || !totpToken) {
      return res.status(400).json({ error: 'Email, PIN e código do autenticador são obrigatórios' });
    }

    if (totpToken.length !== 6 || !/^\d+$/.test(totpToken)) {
      return res.status(400).json({ error: 'Código do autenticador deve ter 6 dígitos' });
    }

    const users = await query(
      'SELECT * FROM ADMINISTRADORES WHERE email = ? AND ativo = TRUE',
      [email]
    );

    if (users.length === 0) {
      console.log('⚠️ Usuário não encontrado ou inativo:', email);
      await query(
        'INSERT INTO login_attempts (email, ip_address, success) VALUES (?, ?, ?)',
        [email, req.ip || 'unknown', false]
      );
      return res.status(401).json({ error: 'Credenciais inválidas' });
    }

    const user = users[0];

    // Verificar PIN
    if (pinCode !== user.pin_code) {
      console.log('❌ PIN incorreto para:', email);
      await query(
        'INSERT INTO login_attempts (email, ip_address, success) VALUES (?, ?, ?)',
        [email, req.ip || 'unknown', false]
      );
      return res.status(401).json({ error: 'PIN incorreto' });
    }

    // Verificar TOTP (Google Authenticator)
    const verified = speakeasy.totp.verify({
      secret:   user.google_secret,
      encoding: 'base32',
      token:    totpToken,
      window:   1, // ±30 segundos de tolerância
    });

    if (!verified) {
      console.log('❌ Código Google Auth inválido para:', email);
      await query(
        'INSERT INTO login_attempts (email, ip_address, success) VALUES (?, ?, ?)',
        [email, req.ip || 'unknown', false]
      );
      return res.status(401).json({ error: 'Código do autenticador inválido' });
    }

    // Gerar JWT
    const token = jwt.sign(
      { userId: user.id, email: user.email, nome: user.nome },
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRY || '15m' }
    );

    // Logs de sucesso
    await query(
      'INSERT INTO logs_acesso (usuario_id, endpoint, sucesso) VALUES (?, ?, ?)',
      [user.id, '/login', true]
    );
    await query(
      'INSERT INTO login_attempts (email, ip_address, success) VALUES (?, ?, ?)',
      [email, req.ip || 'unknown', true]
    );

    console.log('✅ Login bem-sucedido:', email);

    return res.json({
      success: true,
      token,
      user: {
        id:        user.id,
        nome:      user.nome,
        email:     user.email,
        createdAt: user.criado_em,
      },
    });

  } catch (error) {
    console.error('❌ Erro no login:', error);
    await query(
      'INSERT INTO logs_acesso (endpoint, sucesso) VALUES (?, ?)',
      ['/login', false]
    );
    return res.status(500).json({
      error:   'Erro interno no servidor',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined,
    });
  }
};