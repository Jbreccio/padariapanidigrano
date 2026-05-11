// backend/worker/src/routes/admin/dados.js
import { jsonResponse } from '../../utils/responses.js';
import { ordenarMomentosWorker } from '../../utils/helpers.js';

function inicializarHorariosPadrao() {
  return [
    { id: 'segunda', dia: "Segunda-Feira", missas: [], ativo: true },
    { id: 'terca', dia: "Terça-Feira", missas: [{ id: 'terca-1', hora: "07h30" }, { id: 'terca-2', hora: "19h30", tipo: "Confissão - Chegue com 1h de antecedência" }], ativo: true },
    { id: 'quarta', dia: "Quarta-Feira", missas: [{ id: 'quarta-1', hora: "19h30", tipo: "Confissão - Chegue com 1h de antecedência" }], ativo: true },
    { id: 'quinta', dia: "Quinta-Feira", missas: [{ id: 'quinta-1', hora: "07h30" }, { id: 'quinta-2', hora: "19h30", tipo: "Confissão - Chegue com 1h de antecedência" }], ativo: true },
    { id: 'sexta', dia: "Sexta-Feira", missas: [{ id: 'sexta-1', hora: "19h30", tipo: "Confissão - Chegue com 1h de antecedência" }], ativo: true },
    { id: 'sabado', dia: "Sábado", missas: [{ id: 'sabado-1', hora: "16h30", tipo: "Confissão - Chegue com 1h de antecedência" }], ativo: true },
    { id: 'domingo', dia: "Domingo", missas: [{ id: 'domingo-1', hora: "08h00" }, { id: 'domingo-2', hora: "10h00", tipo: "Transmitida AO VIVO", youtube: true, youtubeLink: "https://youtube.com/@santuariodefatimanews" }, { id: 'domingo-3', hora: "18h30" }], ativo: true }
  ];
}

// ─── GET ─────────────────────────────────────────────────────────────────────
export async function handleAdminDados(request, env) {
  try {
    // Lê de cada KV separado (mesmas chaves que o /api/dados público usa)
    let carrossel          = await env.KV_FILES?.get('santuario_carrossel', 'json') || [];
    let popups             = await env.KV_FILES?.get('santuario_popups', 'json')    || [];
    let recados            = await env.KV_FILES?.get('santuario_recados', 'json')   || [];
    let momentosLiturgicos = await env.KV_LITURGIA?.get('momentos', 'json')         || [];
    let horariosMissas     = await env.KV_MISSAS?.get('horariosMissas', 'json');

    if (!Array.isArray(horariosMissas) || !horariosMissas.length) {
      horariosMissas = inicializarHorariosPadrao();
    }

    console.log(`✅ Admin GET — recados: ${recados.length}, momentos: ${momentosLiturgicos.length}, carrossel: ${carrossel.length}`);

    return jsonResponse({
      success: true,
      dados: { carrossel, momentosLiturgicos, popups, recados, horariosMissas }
    });

  } catch (error) {
    console.error('❌ handleAdminDados:', error);
    return jsonResponse({ success: false, error: error.message }, 500);
  }
}

// ─── POST ────────────────────────────────────────────────────────────────────
export async function handleAdminSalvarDados(request, env) {
  try {
    const token = request.headers.get('Authorization')?.replace('Bearer ', '');
    if (!token) return jsonResponse({ success: false, error: 'Não autorizado' }, 401);

    let userData;
    try {
      userData = JSON.parse(atob(token));
    } catch {
      return jsonResponse({ success: false, error: 'Token inválido' }, 401);
    }

    if (userData.exp && userData.exp < Date.now()) {
      return jsonResponse({ success: false, error: 'Token expirado' }, 401);
    }

    const dados = await request.json();

    // ✅ Salva cada seção na chave certa — mesmas que /api/dados lê
    if (dados.carrossel !== undefined) {
      await env.KV_FILES?.put('santuario_carrossel', JSON.stringify(dados.carrossel));
      console.log(`✅ Carrossel salvo: ${dados.carrossel.length} itens`);
    }

    if (dados.popups !== undefined) {
      await env.KV_FILES?.put('santuario_popups', JSON.stringify(dados.popups));
      console.log(`✅ Popups salvo: ${dados.popups.length} itens`);
    }

    if (dados.recados !== undefined) {
      await env.KV_FILES?.put('santuario_recados', JSON.stringify(dados.recados));
      console.log(`✅ Recados salvo: ${dados.recados.length} itens`);
    }

    if (dados.momentosLiturgicos !== undefined) {
      const momentosOrdenados = ordenarMomentosWorker(dados.momentosLiturgicos);
      await env.KV_LITURGIA?.put('momentos', JSON.stringify(momentosOrdenados));
      console.log(`✅ Momentos salvo: ${momentosOrdenados.length} eventos`);
    }

    if (dados.horariosMissas !== undefined && Array.isArray(dados.horariosMissas)) {
      await env.KV_MISSAS?.put('horariosMissas', JSON.stringify(dados.horariosMissas));
      console.log(`✅ Horários salvos: ${dados.horariosMissas.length} dias`);
    }

    // Backup no D1 (mantém histórico)
    if (env.DB) {
      try {
        await env.DB.prepare(`
          CREATE TABLE IF NOT EXISTS dados_sistema (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            dados TEXT NOT NULL,
            usuario_id INTEGER,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP
          )
        `).run();
        await env.DB.prepare(`
          INSERT INTO dados_sistema (dados, usuario_id, created_at) VALUES (?, ?, ?)
        `).bind(JSON.stringify(dados), userData.id || null, new Date().toISOString()).run();
      } catch (e) {
        console.warn('⚠️ Backup D1 falhou (não crítico):', e.message);
      }
    }

    return jsonResponse({ success: true, message: 'Dados salvos com sucesso!' });

  } catch (error) {
    console.error('❌ handleAdminSalvarDados:', error);
    return jsonResponse({ success: false, error: error.message }, 500);
  }
}