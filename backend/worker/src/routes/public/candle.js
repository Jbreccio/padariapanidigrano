// backend/worker/src/routes/public/candle.js
import { jsonResponse, errorResponse, formatTimeAgo } from '../../utils/helpers.js';
import { sendCandleEmail } from '../../utils/emails.js';

export async function createCandle(request, env, ctx) {
  try {
    const body = await request.json();
    const candleData = {
      id: Date.now().toString(),
      nome: body.name || body.nome || "Anonimo",
      familia: body.intention || "Familia",
      cidade: body.city || body.cidade || "",
      estado: body.state || body.estado || "",
      data: new Date().toISOString(),
      duracao: 86400,
      status: 1
    };
    
    if (env.DB) {
      await env.DB.prepare(`CREATE TABLE IF NOT EXISTS velas (
        id TEXT PRIMARY KEY,
        nome TEXT NOT NULL,
        familia TEXT,
        cidade TEXT,
        estado TEXT,
        data TEXT,
        duracao INTEGER,
        status INTEGER DEFAULT 1
      )`).run();
      
      await env.DB.prepare(`
        INSERT INTO velas (id, nome, familia, cidade, estado, data, duracao, status)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?)
      `).bind(
        candleData.id, candleData.nome, candleData.familia,
        candleData.cidade, candleData.estado, candleData.data,
        candleData.duracao, candleData.status
      ).run();
    }
    
    if (body.email) {
      ctx.waitUntil(sendCandleEmail(env, {
        name: candleData.nome,
        email: body.email,
        intention: candleData.familia,
        cidade: candleData.cidade,
        estado: candleData.estado
      }));
    }
    
    ctx.waitUntil(cleanupOldCandles(env));
    
    return jsonResponse({
      success: true,
      message: "Vela acesa com sucesso!",
      candle: candleData
    });
  } catch(error) {
    console.error('Erro ao criar vela:', error);
    return errorResponse('Erro interno ao processar vela', 500);
  }
}

export async function getCandles(request, env) {
  try {
    if (!env.DB) return jsonResponse([]);
    
    const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();
    const result = await env.DB.prepare(`
      SELECT id, nome, familia, cidade, estado, data
      FROM velas WHERE data > ? AND status = 1
      ORDER BY data DESC LIMIT 100
    `).bind(sevenDaysAgo).all();
    
    const candles = (result.results || []).map(c => ({
      id: c.id,
      name: c.nome,
      intention: c.familia,
      city: c.cidade || "",
      state: c.estado || "",
      createdAt: c.data,
      timestamp: formatTimeAgo(c.data)
    }));
    
    return jsonResponse(candles);
  } catch(error) {
    console.error('Erro ao buscar velas:', error);
    return jsonResponse([]);
  }
}

async function cleanupOldCandles(env) {
  try {
    if (!env.DB) return;
    const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();
    await env.DB.prepare(`UPDATE velas SET status = 0 WHERE data < ? AND status = 1`)
      .bind(sevenDaysAgo).run();
  } catch (error) {
    console.error("Erro na limpeza de velas:", error);
  }
}