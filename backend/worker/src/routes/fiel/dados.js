export async function getDados(request, env) {
  try {
    const url   = new URL(request.url);
    const email = url.searchParams.get('email');

    if (!email) return jsonResponse({ success: false, error: 'Email é obrigatório' }, 400);

    const key = `fiel:dados:${email}`;
    let dados = (await env.KV_FIEL?.get(key, 'json')) || null;

    // ── Fallback: se KV vazio, busca do DB e repopula o KV ───
    if (!dados && env.DB) {
      const row = await env.DB
        .prepare('SELECT * FROM fiel_dados WHERE email = ?')
        .bind(email).first();

      if (row) {
        const parse = v => { try { return JSON.parse(v || '[]'); } catch { return []; } };
        dados = {
          musicas:    parse(row.musicas),
          versiculos: parse(row.versiculos),
          oracoes:    parse(row.oracoes),
          fotos:      parse(row.fotos),
          perfil: {
            nome:   row.nome   || '',
            email:  email,
            avatar: row.avatar || '',
          },
        };
        // Repopula o KV para as próximas leituras
        await env.KV_FIEL?.put(key, JSON.stringify({
          ...dados,
          ultimaAtualizacao: new Date().toISOString(),
        }));
      }
    }

    dados = dados || {};

    return jsonResponse({
      success:    true,
      musicas:    dados.musicas    || [],
      versiculos: dados.versiculos || [],
      oracoes:    dados.oracoes    || [],
      fotos:      dados.fotos      || [],
      perfil: {
        nome:        dados.perfil?.nome        || '',
        email:       dados.perfil?.email       || email,
        tema:        dados.perfil?.tema        || 'escuro',
        corFundo:    dados.perfil?.corFundo    || '#1a237e',
        imagemFundo: dados.perfil?.imagemFundo || '',
        avatar:      dados.perfil?.avatar      || '',
      },
    });
  } catch (error) {
    console.error('Erro em getDados:', error);
    return jsonResponse({ success: false, error: error.message }, 500);
  }
}