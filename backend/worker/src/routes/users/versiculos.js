export async function salvarVersiculo(request, env) {
  try {
    const body = await request.json();
    const { email, versiculo } = body;

    if (!email)     return errorResponse('E-mail é obrigatório', 400);
    if (!versiculo) return errorResponse('Versículo é obrigatório', 400);

    const db  = env.DB;
    const now = new Date().toISOString();

    // ── 1. Salva no DB (igual ao que você já tinha) ──────────
    const row = await db
      .prepare('SELECT versiculos FROM fiel_dados WHERE email = ?')
      .bind(email).first();

    let lista = [];
    if (row?.versiculos) {
      try { lista = JSON.parse(row.versiculos); } catch { lista = []; }
    }

    const jaExiste = lista.some(
      v => v.id === versiculo.id || v.referencia === versiculo.referencia
    );
    if (!jaExiste) lista.push({ ...versiculo, salvoEm: now });

    if (row) {
      await db.prepare('UPDATE fiel_dados SET versiculos = ?, updated_at = ? WHERE email = ?')
        .bind(JSON.stringify(lista), now, email).run();
    } else {
      await db.prepare(`
        INSERT INTO fiel_dados
          (email, musicas, versiculos, oracoes, fotos, termo_aceito, created_at, updated_at)
        VALUES (?, '[]', ?, '[]', '[]', 0, ?, ?)
      `).bind(email, JSON.stringify(lista), now, now).run();
    }

    // ── 2. Espelha no KV (mesma chave que getDados lê) ───────
    if (env.KV_FIEL) {
      const key         = `fiel:dados:${email}`;
      const dadosAtuais = (await env.KV_FIEL.get(key, 'json')) || {};
      await env.KV_FIEL.put(key, JSON.stringify({
        ...dadosAtuais,
        versiculos: lista,
        ultimaAtualizacao: now,
      }));
    }

    return jsonResponse({ success: true, versiculos: lista });
  } catch (error) {
    console.error('Erro ao salvar versículo:', error);
    return errorResponse('Erro ao salvar versículo', 500);
  }
}
export async function buscarVersiculos(request, env) {
  try {
    const url   = new URL(request.url);
    const email = url.searchParams.get('email');

    if (!email) return errorResponse('E-mail é obrigatório', 400);

    // Lê do KV primeiro (mesma fonte que getDados usa)
    if (env.KV_FIEL) {
      const key   = `fiel:dados:${email}`;
      const dados = await env.KV_FIEL.get(key, 'json');
      if (dados?.versiculos) {
        return jsonResponse({ success: true, versiculos: dados.versiculos });
      }
    }

    // Fallback no DB
    const row = await env.DB
      .prepare('SELECT versiculos FROM fiel_dados WHERE email = ?')
      .bind(email).first();

    let lista = [];
    if (row?.versiculos) {
      try { lista = JSON.parse(row.versiculos); } catch { lista = []; }
    }

    return jsonResponse({ success: true, versiculos: lista });
  } catch (error) {
    console.error('Erro ao buscar versículos:', error);
    return errorResponse('Erro ao buscar versículos', 500);
  }
}