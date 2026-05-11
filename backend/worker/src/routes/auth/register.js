// backend/worker/src/routes/auth/register.js
import { jsonResponse, errorResponse } from '../../utils/helpers.js';

export async function register(request, env, ctx) {
  try {
    const { nome, email, senha, celular } = await request.json();
    if (!nome || !email || !senha) {
      return errorResponse('Nome, email e senha são obrigatórios', 400);
    }
    
    const existing = await env.DB.prepare(
      'SELECT id FROM users WHERE email = ?'
    ).bind(email).first();
    
    if (existing) return errorResponse('Email já cadastrado', 409);
    
    const id = crypto.randomUUID();
    await env.DB.prepare(`
      INSERT INTO users (id, usuario, nome, email, senha_hash, celular, role, twofa_enabled, created_at)
      VALUES (?, ?, ?, ?, ?, ?, 'user', 0, datetime('now'))
    `).bind(id, email, nome, email, senha, celular || null).run();
    
    ctx.waitUntil(sendWelcomeEmail(env, email, nome));
    
    return jsonResponse({ 
      success: true, 
      message: 'Usuário cadastrado com sucesso!',
      userId: id 
    });
  } catch (error) {
    console.error('Erro no registro:', error);
    return errorResponse('Erro interno', 500);
  }
}

async function sendWelcomeEmail(env, email, nome) {
  try {
    if (!env.RESEND_API_KEY) return;
    await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${env.RESEND_API_KEY}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        from: 'Santuario de Fatima <noreply@mail.santuariodefatima.com.br>',
        to: [email],
        subject: 'Bem-vindo ao Santuário de Fátima',
        html: `<h2>Bem-vindo, ${nome}!</h2><p>Seu cadastro foi realizado com sucesso.</p>`
      })
    });
  } catch (error) { console.error('Erro ao enviar email de boas-vindas:', error); }
}