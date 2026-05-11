import { jsonResponse } from '../utils/responses.js';

export async function handleDados(request, env) {
  try {
    const dados = await env.KV_FILES.get('santuario_dados', 'json');
    const dadosPadrao = { carrossel: [], momentosLiturgicos: [], popups: [], recados: [], horariosMissas: [] };
    return jsonResponse({ success: true, dados: dados || dadosPadrao });
  } catch (e) { return jsonResponse({ success: true, dados: { carrossel: [], momentosLiturgicos: [], popups: [], recados: [], horariosMissas: [] } }); }
}

export async function handleDadosPublicos(request, env) {
  try {
    const dados = await env.KV_FILES.get('santuario_dados', 'json');
    if (dados && dados.horariosMissas) return jsonResponse(dados.horariosMissas);
    return jsonResponse([]);
  } catch (error) { return jsonResponse([]); }
}