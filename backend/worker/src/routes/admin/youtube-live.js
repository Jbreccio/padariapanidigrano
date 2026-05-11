// backend/worker/src/routes/admin/youtube-live.js
import { jsonResponse, errorResponse } from '../../utils/helpers.js';
import { requireAdmin } from '../../middleware/auth.js';

export async function youtubeLivePost(request, env) {
  const auth = await requireAdmin(request, env);
  if (auth instanceof Response) return auth;
  
  try {
    const { liveUrl } = await request.json();
    if (!liveUrl) return errorResponse('URL da live é obrigatória', 400);
    
    let videoId = null;
    const url = liveUrl.trim();
    if (url.includes('youtube.com/watch?v=')) videoId = url.split('v=')[1]?.split('&')[0];
    else if (url.includes('youtu.be/')) videoId = url.split('youtu.be/')[1]?.split('?')[0];
    else if (url.includes('youtube.com/live/')) videoId = url.split('youtube.com/live/')[1]?.split('?')[0];
    
    if (!videoId) return errorResponse('Não foi possível extrair o ID do vídeo', 400);
    
    const liveData = {
      id: videoId,
      videoId,
      title: `Transmissão ao Vivo — Santuário de Fátima`,
      thumbnail: `https://img.youtube.com/vi/${videoId}/maxresdefault.jpg`,
      link: `https://www.youtube.com/watch?v=${videoId}`,
      isLiveNow: true,
      ativo: true,
      atualizadoEm: new Date().toISOString()
    };
    
    await env.KV_FILES?.put("live_manual", JSON.stringify(liveData));
    return jsonResponse({ success: true, live: liveData });
  } catch (error) {
    return errorResponse(`Erro: ${error.message}`, 500);
  }
}

export async function youtubeLiveDelete(request, env) {
  const auth = await requireAdmin(request, env);
  if (auth instanceof Response) return auth;
  
  try {
    await env.KV_FILES?.delete("live_manual");
    return jsonResponse({ success: true, message: "Live removida" });
  } catch (error) {
    return errorResponse(error.message, 500);
  }
}

export async function youtubeLiveGet(request, env) {
  const auth = await requireAdmin(request, env);
  if (auth instanceof Response) return auth;
  
  try {
    const liveManual = await env.KV_FILES?.get("live_manual", "json");
    return jsonResponse({ success: true, live: liveManual || null });
  } catch (error) {
    return errorResponse(error.message, 500);
  }
}