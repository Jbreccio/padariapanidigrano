import { jsonResponse } from '../../utils/responses.js';
import { ordenarMomentosWorker } from '../../utils/helpers.js';

export async function handleAdminDados(request, env) {
  try {
    let dados = await env.KV_FILES.get('santuario_dados', 'json');

    // 🔥 fallback D1
    if (!dados && env.DB) {
      const ultimoRegistro = await env.DB.prepare(
        'SELECT dados FROM dados_sistema ORDER BY created_at DESC LIMIT 1'
      ).first();

      if (ultimoRegistro) {
        try {
          dados = JSON.parse(ultimoRegistro.dados);
          await env.KV_FILES.put('santuario_dados', JSON.stringify(dados));
        } catch (e) {
          console.error('Erro ao parsear dados do banco:', e);
        }
      }
    }

    // 🔥 fallback KV_MISSAS (ULTRA IMPORTANTE)
    if (dados && (!dados.horariosMissas || dados.horariosMissas.length === 0)) {
      if (env.KV_MISSAS) {
        const missas = await env.KV_MISSAS.get('horarios_missas', 'json');
        if (missas) {
          dados.horariosMissas = missas;
        }
      }
    }

    const dadosPadrao = {
      carrossel: [],
      momentosLiturgicos: [],
      popups: [],
      recados: [],
      horariosMissas: []
    };

    return jsonResponse({
      success: true,
      dados: dados || dadosPadrao
    });

  } catch (error) {
    return jsonResponse({ success: false, error: 'Erro interno' }, 500);
  }
}

export async function handleAdminSalvarDados(request, env) {
  try {
    const token = request.headers.get('Authorization')?.replace('Bearer ', '');
    if (!token) return jsonResponse({ success: false }, 401);

    let userData;
    try {
      userData = JSON.parse(atob(token));
    } catch {
      return jsonResponse({ success: false }, 401);
    }

    const dados = await request.json();

    const dadosCompletos = {
      carrossel: dados.carrossel || [],
      momentosLiturgicos: ordenarMomentosWorker(dados.momentosLiturgicos || []),
      popups: dados.popups || [],
      recados: dados.recados || [],
      horariosMissas: dados.horariosMissas || []
    };

    // 🔥 KV principal (SEM TTL)
    await env.KV_FILES.put(
      'santuario_dados',
      JSON.stringify(dadosCompletos)
    );

    // 🔥 KV separado para missas (NUNCA PERDE)
    if (env.KV_MISSAS) {
      await env.KV_MISSAS.put(
        'horarios_missas',
        JSON.stringify(dadosCompletos.horariosMissas)
      );
    }

    // 🔥 backup no banco
    if (env.DB) {
      await env.DB.prepare(`
        CREATE TABLE IF NOT EXISTS dados_sistema (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          dados TEXT,
          usuario_id INTEGER,
          created_at DATETIME
        )
      `).run();

      await env.DB.prepare(`
        INSERT INTO dados_sistema (dados, usuario_id, created_at)
        VALUES (?, ?, ?)
      `).bind(
        JSON.stringify(dadosCompletos),
        userData.id || null,
        new Date().toISOString()
      ).run();
    }

    return jsonResponse({ success: true });

  } catch (error) {
    return jsonResponse({ success: false }, 500);
  }
}