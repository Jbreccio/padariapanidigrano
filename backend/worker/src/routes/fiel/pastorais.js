import { jsonResponse, errorResponse } from '../../utils/helpers.js';

export async function listarPastorais(request, env) {
  try {
    const db = env.DB;

    const { results } = await db.prepare(`
      SELECT id, nome, descricao, responsavel, contato, ativo
      FROM pastorais
      WHERE ativo = 1
      ORDER BY nome ASC
    `).all();

    return jsonResponse({ success: true, pastorais: results ?? [] });
  } catch (error) {
    console.error('Erro ao listar pastorais:', error);
    // Tabela pode ainda não existir — retorna lista vazia sem quebrar
    return jsonResponse({ success: true, pastorais: [] });
  }
}