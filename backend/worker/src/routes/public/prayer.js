// backend/worker/src/routes/public/prayer.js
import { jsonResponse, errorResponse } from '../../utils/helpers.js';
import { 
  sendPrayerConfirmationEmail, 
  sendPrayerNotificationToSecretariat 
} from '../../utils/emails.js';

export async function createPrayer(request, env, ctx) {
  try {
    const body = await request.json();
    
    if (env.DB) {
      await env.DB.prepare(`
        CREATE TABLE IF NOT EXISTS prayer (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          nome TEXT NOT NULL,
          email TEXT,
          pedido TEXT NOT NULL,
          cidade TEXT,
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP
        )
      `).run();
      
      await env.DB.prepare(`
        INSERT INTO prayer (nome, email, pedido, cidade, created_at)
        VALUES (?, ?, ?, ?, ?)
      `).bind(
        body.name || body.nome || "Anonimo",
        body.email || "",
        body.prayerRequest || body.pedido || "",
        body.cidade || body.city || "",
        new Date().toISOString()
      ).run();
    }
    
    if (body.email && env.RESEND_API_KEY) {
      ctx.waitUntil(sendPrayerConfirmationEmail(env, {
        name: body.name || body.nome || "Anonimo",
        email: body.email,
        prayerRequest: body.prayerRequest || body.pedido || "",
        cidade: body.cidade || body.city || ""
      }));
      
      ctx.waitUntil(sendPrayerNotificationToSecretariat(env, {
        name: body.name || body.nome || "Anonimo",
        email: body.email,
        prayerRequest: body.prayerRequest || body.pedido || "",
        cidade: body.cidade || body.city || ""
      }));
    }
    
    return jsonResponse({ 
      success: true, 
      message: "Pedido de oração recebido com sucesso! Em breve você receberá uma confirmação por email." 
    });
  } catch (error) {
    return errorResponse('Erro ao processar seu pedido', 500);
  }
}

export async function getPrayers(request, env) {
  try {
    if (!env.DB) return jsonResponse({ success: true, count: 0, prayers: [] });
    
    const result = await env.DB.prepare(`
      SELECT id, nome, email, pedido, cidade, created_at
      FROM prayer ORDER BY created_at DESC LIMIT 50
    `).all();
    
    return jsonResponse({
      success: true,
      count: result.results?.length || 0,
      prayers: result.results || []
    });
  } catch (error) {
    return errorResponse('Erro ao buscar pedidos', 500);
  }
}