import { jsonResponse } from '../utils/responses.js';
import { sendPrayerConfirmationEmail, sendPrayerNotificationToSecretariat } from '../utils/emails.js';

export async function handlePrayer(request, env, ctx) {
  if (request.method === 'POST') {
    try {
      const body = await request.json();
      if (env.DB) {
        try {
          await env.DB.prepare(`CREATE TABLE IF NOT EXISTS prayer (id INTEGER PRIMARY KEY AUTOINCREMENT, nome TEXT NOT NULL, email TEXT, pedido TEXT NOT NULL, cidade TEXT, created_at DATETIME DEFAULT CURRENT_TIMESTAMP)`).run();
          await env.DB.prepare(`INSERT INTO prayer (nome, email, pedido, cidade, created_at) VALUES (?, ?, ?, ?, ?)`).bind(body.name || body.nome || 'Anonimo', body.email || '', body.prayerRequest || body.pedido || '', body.cidade || body.city || '', new Date().toISOString()).run();
        } catch (dbError) { try { await env.DB.prepare(`INSERT INTO prayer (nome, email, pedido, created_at) VALUES (?, ?, ?, ?)`).bind(body.name || body.nome || 'Anonimo', body.email || '', body.prayerRequest || body.pedido || '', new Date().toISOString()).run(); } catch (fallbackError) { console.error('Erro no fallback:', fallbackError); } }
      }
      if (body.email && env.RESEND_API_KEY) {
        ctx.waitUntil(sendPrayerConfirmationEmail(env, { name: body.name || body.nome || 'Anonimo', email: body.email, prayerRequest: body.prayerRequest || body.pedido || '', cidade: body.cidade || body.city || '' }));
        ctx.waitUntil(sendPrayerNotificationToSecretariat(env, { name: body.name || body.nome || 'Anonimo', email: body.email, prayerRequest: body.prayerRequest || body.pedido || '', cidade: body.cidade || body.city || '' }));
      }
      return jsonResponse({ success: true, message: 'Pedido de oracao recebido com sucesso! Em breve voce recebera uma confirmacao por email.' });
    } catch (error) { return jsonResponse({ success: false, message: 'Erro ao processar seu pedido', error: error.message }, 500); }
  } else if (request.method === 'GET') {
    try {
      if (!env.DB) return jsonResponse({ success: true, count: 0, prayers: [] });
      try {
        const result = await env.DB.prepare(`SELECT id, nome, email, pedido, cidade, created_at FROM prayer ORDER BY created_at DESC LIMIT 50`).all();
        return jsonResponse({ success: true, count: result.results?.length || 0, prayers: result.results || [] });
      } catch (selectError) {
        const result = await env.DB.prepare(`SELECT id, nome, email, pedido, created_at FROM prayer ORDER BY created_at DESC LIMIT 50`).all();
        return jsonResponse({ success: true, count: result.results?.length || 0, prayers: result.results || [] });
      }
    } catch (error) { return jsonResponse({ success: false, error: 'Erro ao buscar pedidos' }, 500); }
  }
  return jsonResponse({ success: false, error: 'Método não permitido' }, 405);
}