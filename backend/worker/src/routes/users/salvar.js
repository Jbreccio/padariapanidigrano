export async function salvarDados(request, env) {
  try {
    const body = await request.json();
    const { email, musicas, versiculos, oracoes, fotos, perfil } = body;

    if (!email) return jsonResponse({ success: false, error: 'Email é obrigatório' }, 400);

    const now         = new Date().toISOString();
    const key         = `fiel:dados:${email}`;
    const dadosAtuais = (await env.KV_FIEL?.get(key, 'json')) || {};

    const payload = {
      musicas:    musicas    ?? dadosAtuais.musicas    ?? [],
      versiculos: versiculos ?? dadosAtuais.versiculos ?? [],
      oracoes:    oracoes    ?? dadosAtuais.oracoes    ?? [],
      fotos:      fotos      ?? dadosAtuais.fotos      ?? [],
      perfil: {
        ...dadosAtuais.perfil,
        ...(perfil || {}),
      },
      ultimaAtualizacao: now,
    };

    // ── 1. Salva no KV ────────────────────────────────────────
    await env.KV_FIEL?.put(key, JSON.stringify(payload));

    // ── 2. Espelha no DB ──────────────────────────────────────
    if (env.DB) {
      const row = await env.DB
        .prepare('SELECT email FROM fiel_dados WHERE email = ?')
        .bind(email).first();

      if (row) {
        await env.DB.prepare(`
          UPDATE fiel_dados
          SET musicas=?, versiculos=?, oracoes=?, fotos=?, updated_at=?
          WHERE email=?
        `).bind(
          JSON.stringify(payload.musicas),
          JSON.stringify(payload.versiculos),
          JSON.stringify(payload.oracoes),
          JSON.stringify(payload.fotos),
          now, email
        ).run();
      } else {
        await env.DB.prepare(`
          INSERT INTO fiel_dados
            (email, musicas, versiculos, oracoes, fotos, termo_aceito, created_at, updated_at)
          VALUES (?, ?, ?, ?, ?, 0, ?, ?)
        `).bind(
          email,
          JSON.stringify(payload.musicas),
          JSON.stringify(payload.versiculos),
          JSON.stringify(payload.oracoes),
          JSON.stringify(payload.fotos),
          now, now
        ).run();
      }
    }

    return jsonResponse({ success: true });
  } catch (error) {
    console.error('Erro em salvarDados:', error);
    return jsonResponse({ success: false, error: error.message }, 500);
  }
}