// backend/worker/src/routes/admin/index.js

import { jsonResponse } from '../../utils/helpers.js';
import { verificarSenha, sha256 } from '../../controllers/auth_shared.js';

// ============================================
// 📌 HORÁRIOS PADRÃO
// ============================================

function inicializarHorariosPadrao() {
  return [
    { id: 'segunda', dia: "Segunda-Feira", missas: [], ativo: true },
    {
      id: 'terca', dia: "Terça-Feira",
      missas: [
        { id: 'terca-1', hora: "07h30" },
        { id: 'terca-2', hora: "19h30", tipo: "Confissão - Chegue com 1h de antecedência" }
      ],
      ativo: true
    },
    {
      id: 'quarta', dia: "Quarta-Feira",
      missas: [
        { id: 'quarta-1', hora: "19h30", tipo: "Confissão - Chegue com 1h de antecedência" }
      ],
      ativo: true
    },
    {
      id: 'quinta', dia: "Quinta-Feira",
      missas: [
        { id: 'quinta-1', hora: "07h30" },
        { id: 'quinta-2', hora: "19h30", tipo: "Confissão - Chegue com 1h de antecedência" }
      ],
      ativo: true
    },
    {
      id: 'sexta', dia: "Sexta-Feira",
      missas: [
        { id: 'sexta-1', hora: "19h30", tipo: "Confissão - Chegue com 1h de antecedência" }
      ],
      ativo: true
    },
    {
      id: 'sabado', dia: "Sábado",
      missas: [
        { id: 'sabado-1', hora: "16h30", tipo: "Confissão - Chegue com 1h de antecedência" }
      ],
      ativo: true
    },
    {
      id: 'domingo', dia: "Domingo",
      missas: [
        { id: 'domingo-1', hora: "08h00" },
        {
          id: 'domingo-2',
          hora: "10h00",
          tipo: "Transmitida AO VIVO",
          youtube: true,
          youtubeLink: "https://youtube.com/@santuariodefatimanews"
        },
        { id: 'domingo-3', hora: "18h30" }
      ],
      ativo: true
    }
  ];
}

// ============================================
// 📊 GET DADOS ADMIN
// ============================================

export async function handleAdminDados(request, env, user) {
  console.log('🔵 handleAdminDados chamado - user:', user?.email);

  if (!user) {
    return jsonResponse({ success: false, error: 'Não autorizado' }, 401);
  }

  try {
    let carrossel = await env.KV_FILES?.get('santuario_carrossel', 'json') || [];
    let popups = await env.KV_FILES?.get('santuario_popups', 'json') || [];
    let recados = await env.KV_FILES?.get('santuario_recados', 'json') || [];
    let horariosMissas = await env.KV_MISSAS?.get('horariosMissas', 'json');
    let momentosLiturgicos = await env.KV_LITURGIA?.get('momentos', 'json') || [];

    if (!Array.isArray(horariosMissas)) {
      horariosMissas = inicializarHorariosPadrao();
    }

    return jsonResponse({
      success: true,
      dados: { carrossel, momentosLiturgicos, popups, recados, horariosMissas }
    });

  } catch (error) {
    console.error('❌ Erro ao carregar dados:', error);
    return jsonResponse({ success: false, error: 'Erro ao carregar dados' }, 500);
  }
}

// ============================================
// 💾 SALVAR DADOS ADMIN
// ============================================

export async function handleAdminSalvarDados(request, env, user, body) {
  console.log('🟢 handleAdminSalvarDados chamado - user:', user?.email);

  if (!user) {
    return jsonResponse({ success: false, error: 'Não autorizado' }, 401);
  }

  if (!body) {
    return jsonResponse({ success: false, error: 'Dados não recebidos' }, 400);
  }

  try {
    if (body.carrossel !== undefined) {
      await env.KV_FILES.put('santuario_carrossel', JSON.stringify(body.carrossel));
    }
    if (body.popups !== undefined) {
      await env.KV_FILES.put('santuario_popups', JSON.stringify(body.popups));
    }
    if (body.recados !== undefined) {
      await env.KV_FILES.put('santuario_recados', JSON.stringify(body.recados));
    }
    if (Array.isArray(body.horariosMissas)) {
      await env.KV_MISSAS.put('horariosMissas', JSON.stringify(body.horariosMissas));
    }
    if (body.momentosLiturgicos !== undefined) {
      await env.KV_LITURGIA.put('momentos', JSON.stringify(body.momentosLiturgicos));
    }
    if (body.arquivosDownload !== undefined) {
      await env.KV_FILES.put('santuario_arquivos', JSON.stringify(body.arquivosDownload));
    }

    console.log('✅ Dados salvos com sucesso por:', user.email);
    return jsonResponse({ success: true, message: 'Dados salvos com sucesso!' });

  } catch (error) {
    console.error('❌ Erro ao salvar:', error);
    return jsonResponse({ success: false, error: 'Erro ao salvar dados' }, 500);
  }
}

// ============================================
// 👤 PERFIL
// ============================================

export async function handleAdminPerfil(request, env, user) {
  if (!user) {
    return jsonResponse({ success: false, error: 'Não autorizado' }, 401);
  }

  return jsonResponse({
    success: true,
    perfil: {
      nome: user.nome,
      email: user.email,
      role: user.role
    }
  });
}

// ============================================
// ✏️ ATUALIZAR PERFIL
// ============================================

export async function handleAdminAtualizarPerfil(request, env, user, body) {
  if (!user) {
    return jsonResponse({ success: false, error: 'Não autorizado' }, 401);
  }

  if (!body) {
    return jsonResponse({ success: false, error: 'Dados não recebidos' }, 400);
  }

  try {
    const { nome, email } = body;

    await env.DB.prepare(`
      UPDATE users SET nome = ?, email = ? WHERE id = ?
    `).bind(
      nome || user.nome,
      email || user.email,
      user.id
    ).run();

    return jsonResponse({ success: true, message: 'Perfil atualizado!' });

  } catch (error) {
    console.error('❌ Erro ao atualizar perfil:', error);
    return jsonResponse({ success: false, error: 'Erro ao atualizar perfil' }, 500);
  }
}

// ============================================
// 🔑 ALTERAR SENHA
// ============================================

export async function handleAdminAlterarSenha(request, env, user, body) {
  if (!user) {
    return jsonResponse({ success: false, error: 'Não autorizado' }, 401);
  }

  if (!body) {
    return jsonResponse({ success: false, error: 'Dados não recebidos' }, 400);
  }

  try {
    const { senha_atual, nova_senha } = body;

    const dbUser = await env.DB.prepare(`
      SELECT senha_hash FROM users WHERE id = ?
    `).bind(user.id).first();

    if (!dbUser) {
      return jsonResponse({ success: false, error: 'Usuário não encontrado' }, 404);
    }

    const senhaOk = await verificarSenha(senha_atual, dbUser.senha_hash);
    if (!senhaOk) {
      return jsonResponse({ success: false, error: 'Senha atual incorreta' }, 400);
    }

    if (!nova_senha || nova_senha.length < 6) {
      return jsonResponse({ success: false, error: 'Nova senha fraca' }, 400);
    }

    const novaHash = await sha256(nova_senha);

    await env.DB.prepare(`
      UPDATE users SET senha_hash = ? WHERE id = ?
    `).bind(novaHash, user.id).run();

    return jsonResponse({ success: true, message: 'Senha alterada com sucesso!' });

  } catch (error) {
    console.error('❌ Erro ao alterar senha:', error);
    return jsonResponse({ success: false, error: 'Erro ao alterar senha' }, 500);
  }
}