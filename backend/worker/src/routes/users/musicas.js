// backend/worker/src/routes/fiel/musicas.js
import { jsonResponse } from '../../utils/helpers.js';

export async function buscarMusicas(request, env) {
  try {
    const url = new URL(request.url);
    const query = url.searchParams.get('q');
    
    if (!query) {
      return jsonResponse({ success: false, error: 'Parâmetro q é obrigatório' }, 400);
    }
    
    const YOUTUBE_API_KEY = env.YOUTUBE_API_KEY;
    
    if (!YOUTUBE_API_KEY) {
      return jsonResponse({ success: false, error: 'YouTube API não configurada' }, 500);
    }
    
    const youtubeUrl = `https://www.googleapis.com/youtube/v3/search?` +
      `part=snippet&q=${encodeURIComponent(query)}&type=video&` +
      `videoCategoryId=10&maxResults=15&key=${YOUTUBE_API_KEY}`;
    
    const response = await fetch(youtubeUrl);
    const data = await response.json();
    
    if (data.error) {
      console.error('YouTube API Error:', data.error);
      return jsonResponse({ success: false, error: data.error.message }, 500);
    }
    
    const tracks = (data.items || []).map((item) => ({
      id: item.id.videoId,
      nome: item.snippet.title,
      artista: item.snippet.channelTitle,
      imagemUrl: item.snippet.thumbnails?.medium?.url || item.snippet.thumbnails?.default?.url,
      youtubeUrl: `https://www.youtube.com/watch?v=${item.id.videoId}`,
      previewUrl: null
    }));
    
    return jsonResponse({ success: true, tracks });
  } catch (error) {
    console.error('Erro em buscarMusicas:', error);
    return jsonResponse({ success: false, error: error.message }, 500);
  }
}

export async function getMusicaById(request, env) {
  try {
    const url = new URL(request.url);
    const videoId = url.searchParams.get('id');
    
    if (!videoId) {
      return jsonResponse({ success: false, error: 'ID do vídeo é obrigatório' }, 400);
    }
    
    const YOUTUBE_API_KEY = env.YOUTUBE_API_KEY;
    
    const youtubeUrl = `https://www.googleapis.com/youtube/v3/videos?` +
      `part=snippet&id=${videoId}&key=${YOUTUBE_API_KEY}`;
    
    const response = await fetch(youtubeUrl);
    const data = await response.json();
    
    if (!data.items || data.items.length === 0) {
      return jsonResponse({ success: false, error: 'Música não encontrada' }, 404);
    }
    
    const item = data.items[0];
    const track = {
      id: item.id,
      nome: item.snippet.title,
      artista: item.snippet.channelTitle,
      imagemUrl: item.snippet.thumbnails?.medium?.url || item.snippet.thumbnails?.default?.url,
      youtubeUrl: `https://www.youtube.com/watch?v=${item.id}`,
      previewUrl: null
    };
    
    return jsonResponse({ success: true, track });
  } catch (error) {
    console.error('Erro em getMusicaById:', error);
    return jsonResponse({ success: false, error: error.message }, 500);
  }
}

export async function getMusicaPlayer(request, env) {
  // Para preview, retorna o embed URL
  try {
    const url = new URL(request.url);
    const videoId = url.searchParams.get('id');
    
    if (!videoId) {
      return jsonResponse({ success: false, error: 'ID do vídeo é obrigatório' }, 400);
    }
    
    // YouTube não oferece preview de áudio direto
    // Retorna o embed URL para usar no iframe
    return jsonResponse({ 
      success: true, 
      embedUrl: `https://www.youtube.com/embed/${videoId}`,
      thumbnailUrl: `https://i.ytimg.com/vi/${videoId}/mqdefault.jpg`
    });
  } catch (error) {
    console.error('Erro em getMusicaPlayer:', error);
    return jsonResponse({ success: false, error: error.message }, 500);
  }
}