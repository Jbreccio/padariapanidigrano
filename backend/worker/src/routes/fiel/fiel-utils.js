// backend/worker/src/routes/fiel/fiel-utils.js
import { jsonResponse } from '../../utils/helpers.js';

// ============================================
// POST /api/fiel/upload-imagem - Upload de imagem para R2
// ============================================
export async function uploadImagemFiel(request, env) {
  try {
    const formData = await request.formData();
    const file = formData.get('file');
    const email = formData.get('email');
    const tipo = formData.get('tipo'); // 'avatar' | 'galeria' | 'fundo'
    
    if (!file || !email || !tipo) {
      return jsonResponse({ success: false, error: 'Parâmetros incompletos: file, email, tipo são obrigatórios' }, 400);
    }
    
    // Limitar tamanho do arquivo (5MB)
    if (file.size > 5 * 1024 * 1024) {
      return jsonResponse({ success: false, error: 'Arquivo muito grande (máx 5MB)' }, 400);
    }
    
    // Email em minúsculo para evitar problemas
    const emailLower = email.toLowerCase();
    const timestamp = Date.now();
    const extension = file.name.split('.').pop()?.toLowerCase() || 'jpg';
    // Chave: fiel/email/tipo/timestamp.ext (tudo minúsculo)
    const key = `${emailLower}/${tipo}/${timestamp}.${extension}`;
    
    // Usando env.FIEL (bucket se chama "fiel")
    await env.FIEL.put(key, file.stream(), {
      httpMetadata: { contentType: file.type }
    });
    
    // URL pública do R2 (ajuste conforme sua configuração)
    const url = `https://fiel.santuariodefatima.com/${key}`;
    // Ou se for via Cloudflare: 
    // const url = `https://pub-a7cc8a4d3af3406aac2a13dacc039fb5.r2.dev/${key}`;
    
    return jsonResponse({ success: true, url });
  } catch (error) {
    console.error('Erro em uploadImagemFiel:', error);
    return jsonResponse({ success: false, error: error.message }, 500);
  }
}

// ============================================
// PUT /api/fiel/alterar-senha - Alterar senha do fiel
// ============================================
export async function alterarSenhaFiel(request, env) {
  try {
    const { email, currentPassword, newPassword } = await request.json();
    
    if (!email || !currentPassword || !newPassword) {
      return jsonResponse({ success: false, error: 'Parâmetros incompletos' }, 400);
    }
    
    if (newPassword.length < 6) {
      return jsonResponse({ success: false, error: 'Nova senha deve ter pelo menos 6 caracteres' }, 400);
    }
    
    // Buscar usuário no banco
    const user = await env.DB.prepare(
      'SELECT id, senha_hash FROM users WHERE email = ? AND role = ? LIMIT 1'
    ).bind(email, 'fiel').first();
    
    if (!user) {
      return jsonResponse({ success: false, error: 'Usuário não encontrado' }, 404);
    }
    
    // Verificar senha atual
    const bcrypt = await import('bcryptjs');
    const senhaValida = await bcrypt.compare(currentPassword, user.senha_hash);
    
    if (!senhaValida) {
      return jsonResponse({ success: false, error: 'Senha atual incorreta' }, 401);
    }
    
    // Gerar novo hash da senha
    const novaSenhaHash = await bcrypt.hash(newPassword, 10);
    
    // Atualizar no banco
    await env.DB.prepare(
      'UPDATE users SET senha_hash = ?, updated_at = ? WHERE id = ?'
    ).bind(novaSenhaHash, new Date().toISOString(), user.id).run();
    
    return jsonResponse({ success: true });
  } catch (error) {
    console.error('Erro em alterarSenhaFiel:', error);
    return jsonResponse({ success: false, error: error.message }, 500);
  }
}

// ============================================
// GET /api/fiel/buscar-musicas - Buscar músicas no YouTube
// ============================================
export async function buscarMusicasFiel(request, env) {
  try {
    const url = new URL(request.url);
    const query = url.searchParams.get('q');
    
    if (!query) {
      return jsonResponse({ success: false, error: 'Parâmetro q é obrigatório' }, 400);
    }
    
    const YOUTUBE_API_KEY = env.YOUTUBE_API_KEY;
    
    if (!YOUTUBE_API_KEY) {
      console.error('YOUTUBE_API_KEY não configurada');
      return jsonResponse({ success: false, error: 'YouTube API não configurada' }, 500);
    }
    
    const youtubeUrl = `https://www.googleapis.com/youtube/v3/search?` +
      `part=snippet&q=${encodeURIComponent(query)}&type=video&` +
      `videoCategoryId=10&maxResults=10&key=${YOUTUBE_API_KEY}`;
    
    const response = await fetch(youtubeUrl);
    const data = await response.json();
    
    if (!data.items) {
      console.error('Erro na resposta do YouTube:', data);
      return jsonResponse({ success: false, error: data.error?.message || 'Erro ao buscar músicas' }, 500);
    }
    
    const tracks = data.items.map((item) => ({
      id: item.id.videoId,
      nome: item.snippet.title,
      artista: item.snippet.channelTitle,
      imagemUrl: item.snippet.thumbnails?.medium?.url || item.snippet.thumbnails?.default?.url,
      youtubeUrl: `https://www.youtube.com/watch?v=${item.id.videoId}`,
      previewUrl: null
    }));
    
    return jsonResponse({ success: true, tracks });
  } catch (error) {
    console.error('Erro em buscarMusicasFiel:', error);
    return jsonResponse({ success: false, error: error.message }, 500);
  }
}