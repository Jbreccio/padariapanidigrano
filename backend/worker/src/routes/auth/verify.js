// backend/worker/src/routes/auth/verify.js
import { jsonResponse, errorResponse } from '../../utils/helpers.js';

export async function verify2FAUser(request, env, ctx) {
  try {
    const { userId, codigo2FA } = await request.json();
    
    const stored = await env.AUTH_KV.get(`2fa:${userId}`, "json");
    if (!stored) return errorResponse("Código 2FA não encontrado ou expirado", 400);
    if (stored.codigo !== codigo2FA) return errorResponse("Código 2FA inválido", 400);
    if (stored.expira < Date.now()) return errorResponse("Código 2FA expirado", 400);
    
    const pinEmail = Math.floor(1000 + Math.random() * 9000).toString();
    const expiraEm = Date.now() + 5 * 60 * 1000;
    await env.AUTH_KV.put(`pin:${userId}`, JSON.stringify({ pin: pinEmail, expira: expiraEm }), { expirationTtl: 300 });
    
    const user = await env.DB.prepare("SELECT id, nome, email FROM users WHERE id = ?").bind(userId).first();
    
    if (env.RESEND_API_KEY) {
      ctx.waitUntil(sendPINEmail(env, user.email, pinEmail, user.nome));
    }
    
    await env.AUTH_KV.delete(`2fa:${userId}`);
    
    return jsonResponse({ success: true, step: "pin", userId, message: "PIN enviado para seu email" });
  } catch (error) {
    console.error('Erro verify2FA:', error);
    return errorResponse('Erro na verificação 2FA', 500);
  }
}

export async function verifyPINUser(request, env) {
  try {
    const { userId, pin } = await request.json();
    
    const stored = await env.AUTH_KV.get(`pin:${userId}`, "json");
    if (!stored) return errorResponse("PIN não encontrado ou expirado", 400);
    if (stored.pin !== pin) return errorResponse("PIN inválido", 400);
    if (stored.expira < Date.now()) return errorResponse("PIN expirado", 400);
    
    const user = await env.DB.prepare("SELECT id, nome, email, role FROM users WHERE id = ?").bind(userId).first();
    const token = btoa(JSON.stringify({
      id: user.id,
      nome: user.nome,
      email: user.email,
      role: user.role,
      exp: Date.now() + 24 * 60 * 60 * 1000
    }));
    
    await env.AUTH_KV.delete(`pin:${userId}`);
    
    const sessionId = crypto.randomUUID();
    await env.AUTH_KV.put(`session:${sessionId}`, JSON.stringify({
      userId: user.id,
      email: user.email,
      nome: user.nome,
      role: user.role,
      authenticated: true,
      createdAt: Date.now(),
      expiresAt: Date.now() + 24 * 60 * 60 * 1000
    }), { expirationTtl: 24 * 60 * 60 });
    
    return jsonResponse({
      success: true,
      token,
      sessionId,
      user: { id: user.id, nome: user.nome, email: user.email, role: user.role },
      message: "Autenticado com sucesso!"
    });
  } catch (error) {
    console.error('Erro verifyPIN:', error);
    return errorResponse('Erro na verificação PIN', 500);
  }
}

async function sendPINEmail(env, email, pin, nome) {
  try {
    await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${env.RESEND_API_KEY}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        from: 'Santuario de Fatima <noreply@mail.santuariodefatima.com.br>',
        to: [email],
        subject: 'PIN de Acesso - Santuário de Fátima',
        html: `<h2>Seu PIN de acesso</h2><p>Olá ${nome}, use o PIN: <strong>${pin}</strong></p><p>Este PIN expira em 5 minutos.</p>`
      })
    });
  } catch (error) { console.error('Erro ao enviar PIN:', error); }
}