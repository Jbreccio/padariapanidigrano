// backend/src/routes/r2.js

// ============================================
// 📦 R2 HANDLER PROFISSIONAL (CORRIGIDO)
// ============================================

// Tipos MIME suportados
const MIME_TYPES = {
  jpg: 'image/jpeg',
  jpeg: 'image/jpeg',
  png: 'image/png',
  webp: 'image/webp',
  gif: 'image/gif',
  svg: 'image/svg+xml'
};

// Sanitizar nome de arquivo
function sanitizeFileName(name = 'file') {
  return name
    .toLowerCase()
    .replace(/\s+/g, '_')
    .replace(/[^\w.-]/g, '');
}

// ============================================
// 📤 UPLOAD DE IMAGEM
// ============================================

export async function handleUploadImagem(request, env) {
  try {
    const formData = await request.formData();

    const file = formData.get('imagem');
    const tipo = formData.get('tipo') || 'geral';
    const subpasta = formData.get('subpasta') || '';

    if (!file) {
      return new Response(JSON.stringify({
        success: false,
        error: 'Nenhuma imagem enviada'
      }), { status: 400 });
    }

    // Limite 10MB
    if (file.size > 10 * 1024 * 1024) {
      return new Response(JSON.stringify({
        success: false,
        error: 'Arquivo muito grande (máx 10MB)'
      }), { status: 400 });
    }

    // Extrair extensão
    const extensao = file.name?.split('.').pop()?.toLowerCase() || 'jpg';

    // Definir content-type seguro
    const contentType = file.type || MIME_TYPES[extensao] || 'image/jpeg';

    // Nome seguro
    const safeName = sanitizeFileName(file.name);
    const timestamp = Date.now();
    const randomId = Math.random().toString(36).substring(2, 8);

    const nomeArquivo = `${timestamp}-${randomId}-${safeName}`;

    // Montar path
    let path = tipo;

    if (subpasta) path += `/${sanitizeFileName(subpasta)}`;

    // Exemplo: momentos/2026/
    if (tipo === 'momentos') {
      path += `/${new Date().getFullYear()}`;
    }

    path += `/${nomeArquivo}`;

    console.log('📤 Upload R2:', path);

    // ✅ CORRIGIDO: Usar o bucket correto R2_IMAGENS
    await env.R2_IMAGENS.put(path, file.stream(), {
      httpMetadata: {
        contentType,
        cacheControl: 'public, max-age=31536000',
        contentDisposition: 'inline'
      },
      customMetadata: {
        originalName: file.name,
        uploadedAt: new Date().toISOString(),
        tipo
      }
    });

    // ✅ CORRIGIDO: URL pública CORRETA do seu bucket R2
    // Use a URL pública do seu bucket R2_IMAGENS
    const R2_PUBLIC_URL = 'https://pub-e635cafdb9524e428a62de6c21c04781.r2.dev';
    const url = `${R2_PUBLIC_URL}/${path}`;

    console.log('✅ Upload concluído:', url);

    return new Response(JSON.stringify({
      success: true,
      url,
      path,
      size: file.size,
      contentType
    }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });

  } catch (error) {
    console.error('❌ Erro upload R2:', error);

    return new Response(JSON.stringify({
      success: false,
      error: error.message
    }), { status: 500 });
  }
}

// ============================================
// 📥 GET IMAGEM (fallback / proxy)
// ============================================

export async function handleGetImagem(request, env, pathname) {
  try {
    const imagePath = pathname.replace('/r2/', '');

    const object = await env.R2_IMAGENS.get(imagePath);

    if (!object) {
      return new Response('Imagem não encontrada', { status: 404 });
    }

    const headers = new Headers();

    headers.set(
      'Content-Type',
      object.httpMetadata?.contentType || 'image/jpeg'
    );

    headers.set('Cache-Control', 'public, max-age=86400');

    if (object.etag) {
      headers.set('ETag', object.etag);
    }

    return new Response(object.body, { headers });

  } catch (error) {
    console.error('❌ Erro GET imagem:', error);

    return new Response('Erro ao carregar imagem', { status: 500 });
  }
}

// ============================================
// 📋 LISTAR IMAGENS
// ============================================

export async function handleListImagens(request, env) {
  try {
    const url = new URL(request.url);
    const prefix = url.searchParams.get('prefix') || '';

    const objects = await env.R2_IMAGENS.list({ prefix });
    
    // ✅ CORRIGIDO: URL pública CORRETA
    const R2_PUBLIC_URL = 'https://pub-e635cafdb9524e428a62de6c21c04781.r2.dev';
    
    const imagens = objects.objects.map(obj => ({
      key: obj.key,
      size: obj.size,
      uploaded: obj.uploaded,
      url: `${R2_PUBLIC_URL}/${obj.key}`
    }));

    return new Response(JSON.stringify({
      success: true,
      images: imagens
    }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });

  } catch (error) {
    console.error('❌ Erro listagem:', error);

    return new Response(JSON.stringify({
      success: false,
      error: error.message
    }), { status: 500 });
  }
}

// ============================================
// 🗑 DELETAR IMAGEM
// ============================================

export async function handleDeleteImagem(request, env) {
  try {
    const { path } = await request.json();

    if (!path) {
      return new Response(JSON.stringify({
        success: false,
        error: 'Path é obrigatório'
      }), { status: 400 });
    }

    await env.R2_IMAGENS.delete(path);

    return new Response(JSON.stringify({
      success: true,
      message: 'Imagem deletada com sucesso'
    }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });

  } catch (error) {
    console.error('❌ Erro delete:', error);

    return new Response(JSON.stringify({
      success: false,
      error: error.message
    }), { status: 500 });
  }
}