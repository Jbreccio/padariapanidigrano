// backend/worker/src/routes/auth/password.js
import { jsonResponse, errorResponse } from '../../utils/helpers.js';

export async function forgotPassword(request, env, ctx) {
  try {
    const { email } = await request.json();
    if (!email) return errorResponse('E-mail é obrigatório', 400);
    
    const user = await env.DB.prepare(
      'SELECT id, nome FROM users WHERE email = ?'
    ).bind(email).first();
    
    if (!user) return errorResponse('E-mail não encontrado', 404);
    
    const resetToken = Math.floor(100000 + Math.random() * 900000).toString();
    const expiraEm = Date.now() + 15 * 60 * 1000;
    
    await env.AUTH_KV?.put(`reset:${user.id}`, JSON.stringify({ token: resetToken, expira: expiraEm }), { expirationTtl: 900 });
    ctx.waitUntil(sendResetEmail(env, email, user.nome, resetToken));
    
    return jsonResponse({ success: true, message: 'E-mail de recuperação enviado' });
  } catch (error) {
    return errorResponse('Erro interno', 500);
  }
}

export async function resetPassword(request, env) {
  try {
    const { token, novaSenha } = await request.json();
    if (!token || !novaSenha) return errorResponse('Token e nova senha são obrigatórios', 400);
    
    const decoded = JSON.parse(atob(token));
    const { userId } = decoded;
    const stored = await env.AUTH_KV?.get(`reset:${userId}`, 'json');
    
    if (!stored) return errorResponse('Token expirado ou inválido', 400);
    if (stored.expira < Date.now()) return errorResponse('Token expirado', 400);
    
    await env.DB.prepare(`
      UPDATE users SET senha_hash = ?, updated_at = datetime('now')
      WHERE id = ?
    `).bind(novaSenha, userId).run();
    
    await env.AUTH_KV?.delete(`reset:${userId}`);
    
    return jsonResponse({ success: true, message: 'Senha redefinida com sucesso' });
  } catch (error) {
    return errorResponse('Erro ao redefinir senha', 500);
  }
}

async function sendResetEmail(env, email, nome, token) {
  try {
    if (!env.RESEND_API_KEY) return;
    await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${env.RESEND_API_KEY}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        from: 'Santuario de Fatima <noreply@mail.santuariodefatima.com.br>',
        to: [email],
        subject: 'Recuperação de Senha',
        html: `<h2>Recuperação de Senha</h2><p>Olá ${nome}, use o código: <strong>${token}</strong></p>`
      })
    });
  } catch (error) { console.error('Erro ao enviar email de recuperação:', error); }
}