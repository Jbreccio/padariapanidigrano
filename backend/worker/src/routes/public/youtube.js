// src/routes/public/youtube.js
import { jsonResponse } from '../../utils/helpers.js';
import { cleanVideoId, cleanYouTubeTitle } from '../../utils/helpers.js';
import { CONFIG } from '../../config/constants.js';

export async function getYouTubeMainVideo(env) {
  try {
    const API_KEY = env.YOUTUBE_CHANNEL_API_KEY;
    const CHANNEL_ID = "UCwTM4qaQO3fsRpKAAZUZ8Ng";
    
    // ✅ CORRIGIDO: usa KV_YOUTUBE_STORAGE (não KV_FILES)
    const liveManual = await env.KV_YOUTUBE_STORAGE?.get('live_manual', 'json');
    
    if (liveManual && liveManual.ativo === true) {
      console.log('📺 Usando live manual:', liveManual.videoId);
      
      let recordedVideos = [];
      if (API_KEY) {
        try {
          const videosUrl = `https://www.googleapis.com/youtube/v3/search?key=${API_KEY}&channelId=${CHANNEL_ID}&part=snippet&order=date&maxResults=10&type=video`;
          const videosRes = await fetch(videosUrl);
          if (videosRes.ok) {
            const videosData = await videosRes.json();
            if (videosData.items) {
              recordedVideos = videosData.items.map(item => ({ 
                id: cleanVideoId(item.id.videoId), 
                title: cleanYouTubeTitle(item.snippet.title), 
                thumbnail: item.snippet.thumbnails.high?.url || `https://img.youtube.com/vi/${item.id.videoId}/mqdefault.jpg`, 
                publishedAt: item.snippet.publishedAt, 
                channelTitle: item.snippet.channelTitle, 
                videoUrl: `https://www.youtube.com/watch?v=${item.id.videoId}`, 
                link: `https://www.youtube.com/watch?v=${item.id.videoId}`, 
                isLiveNow: false 
              }));
            }
          }
        } catch (e) {
          console.error('Erro ao buscar vídeos gravados:', e);
        }
      }
      
      const mainVideo = { 
        id: liveManual.videoId, 
        title: liveManual.title || 'Transmissão ao Vivo — Santuário de Fátima', 
        thumbnail: liveManual.thumbnail || `https://img.youtube.com/vi/${liveManual.videoId}/maxresdefault.jpg`, 
        publishedAt: liveManual.atualizadoEm || new Date().toISOString(), 
        channelTitle: 'Santuário de Fátima', 
        videoUrl: liveManual.link, 
        link: liveManual.link, 
        isLiveNow: true 
      };
      
      const cardVideos = recordedVideos.filter(v => v.id !== liveManual.videoId).slice(0, 5);
      
      return { 
        mainVideo, 
        allVideos: [mainVideo, ...recordedVideos], 
        cardVideos, 
        liveStatus: 'live' 
      };
    }
    
    // Se não tem live manual, buscar da API do YouTube
    if (!API_KEY) {
      console.log('⚠️ Sem API_KEY, usando fallback');
      const cleanFallback = CONFIG.FALLBACK_VIDEOS.map(v => ({ 
        ...v, 
        id: cleanVideoId(v.id), 
        isLiveNow: false 
      }));
      return { 
        mainVideo: cleanFallback[0], 
        allVideos: cleanFallback, 
        cardVideos: cleanFallback.slice(1), 
        liveStatus: 'none' 
      };
    }
    
    const searchUrl = `https://www.googleapis.com/youtube/v3/search?key=${API_KEY}&channelId=${CHANNEL_ID}&part=snippet&order=date&maxResults=20&type=video`;
    const searchRes = await fetch(searchUrl);
    
    if (!searchRes.ok) {
      console.error('Erro na busca do YouTube:', searchRes.status);
      const cleanFallback = CONFIG.FALLBACK_VIDEOS.map(v => ({ 
        ...v, 
        id: cleanVideoId(v.id), 
        isLiveNow: false 
      }));
      return { 
        mainVideo: cleanFallback[0], 
        allVideos: cleanFallback, 
        cardVideos: cleanFallback.slice(1), 
        liveStatus: 'none' 
      };
    }
    
    const searchData = await searchRes.json();
    
    if (!searchData.items || searchData.items.length === 0) {
      const cleanFallback = CONFIG.FALLBACK_VIDEOS.map(v => ({ 
        ...v, 
        id: cleanVideoId(v.id), 
        isLiveNow: false 
      }));
      return { 
        mainVideo: cleanFallback[0], 
        allVideos: cleanFallback, 
        cardVideos: cleanFallback.slice(1), 
        liveStatus: 'none' 
      };
    }
    
    const allVideos = [];
    const videoIds = [];
    
    for (const item of searchData.items) { 
      const videoId = cleanVideoId(item.id.videoId); 
      if (videoId) videoIds.push(videoId); 
    }
    
    let liveVideos = new Set();
    
    if (videoIds.length > 0) {
      const detailsUrl = `https://www.googleapis.com/youtube/v3/videos?key=${API_KEY}&id=${videoIds.join(',')}&part=liveStreamingDetails,snippet,status`;
      try {
        const detailsRes = await fetch(detailsUrl);
        if (detailsRes.ok) {
          const detailsData = await detailsRes.json();
          if (detailsData.items) {
            detailsData.items.forEach(item => {
              const hasLiveDetails = item.liveStreamingDetails !== undefined;
              const isActuallyLive = hasLiveDetails && !item.liveStreamingDetails?.actualEndTime;
              const isLiveStatus = item.snippet?.liveBroadcastContent === 'live';
              if (isActuallyLive || isLiveStatus) { 
                liveVideos.add(item.id); 
              }
            });
          }
        }
      } catch (e) { 
        console.error('Erro ao verificar status de live:', e);
      }
    }
    
    for (const item of searchData.items) {
      const videoId = cleanVideoId(item.id.videoId);
      const title = cleanYouTubeTitle(item.snippet.title);
      const isLiveNow = liveVideos.has(videoId);
      allVideos.push({ 
        id: videoId, 
        title, 
        thumbnail: item.snippet.thumbnails.high?.url || `https://img.youtube.com/vi/${videoId}/maxresdefault.jpg`, 
        publishedAt: item.snippet.publishedAt, 
        channelTitle: item.snippet.channelTitle, 
        videoUrl: `https://www.youtube.com/watch?v=${videoId}`, 
        link: `https://www.youtube.com/watch?v=${videoId}`, 
        isLiveNow 
      });
    }
    
    const liveVideosList = allVideos.filter(v => v.isLiveNow === true);
    const recordedVideos = allVideos.filter(v => v.isLiveNow === false);
    const liveStatus = liveVideosList.length > 0 ? 'live' : 'none';
    let mainVideo, cardVideos;
    
    if (liveVideosList.length > 0) {
      mainVideo = liveVideosList[0];
      const otherLives = liveVideosList.slice(1);
      const allCards = [...otherLives, ...recordedVideos].slice(0, 5);
      cardVideos = allCards.length > 0 ? allCards : CONFIG.FALLBACK_VIDEOS.slice(1, 6).map(v => ({ 
        ...v, 
        id: cleanVideoId(v.id), 
        isLiveNow: false 
      }));
    } else {
      mainVideo = recordedVideos[0] || { 
        ...CONFIG.FALLBACK_VIDEOS[0], 
        id: cleanVideoId(CONFIG.FALLBACK_VIDEOS[0].id), 
        isLiveNow: false 
      };
      cardVideos = recordedVideos.length > 1 
        ? recordedVideos.filter(v => v.id !== mainVideo.id).slice(0, 5) 
        : CONFIG.FALLBACK_VIDEOS.slice(1, 6).map(v => ({ 
            ...v, 
            id: cleanVideoId(v.id), 
            isLiveNow: false 
          }));
    }
    
    return { mainVideo, allVideos, cardVideos, liveStatus };
    
  } catch (error) {
    console.error('❌ Erro em getYouTubeMainVideo:', error);
    const cleanFallback = CONFIG.FALLBACK_VIDEOS.map(v => ({ 
      ...v, 
      id: cleanVideoId(v.id), 
      isLiveNow: false 
    }));
    return { 
      mainVideo: cleanFallback[0], 
      allVideos: cleanFallback, 
      cardVideos: cleanFallback.slice(1), 
      liveStatus: 'none' 
    };
  }
}

export async function handleYouTube(request, env) {
  const result = await getYouTubeMainVideo(env);
  return jsonResponse({ 
    videos: result.allVideos, 
    mainVideo: result.mainVideo, 
    cardVideos: result.cardVideos, 
    liveStatus: result.liveStatus, 
    timestamp: new Date().toISOString() 
  });
}

export async function handleAdminYoutubeLivePost(request, env) {
  console.log('📺 handleAdminYoutubeLivePost chamado');
  
  const authHeader = request.headers.get('Authorization');
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return jsonResponse({ success: false, error: 'Não autorizado' }, 401);
  }
  
  const body = await request.json();
  const { liveUrl } = body;
  
  if (!liveUrl) {
    return jsonResponse({ success: false, error: 'URL da live é obrigatória' }, 400);
  }
  
  console.log('📺 URL recebida:', liveUrl);
  
  let videoId = null;
  const url = liveUrl.trim();
  
  if (url.includes('youtube.com/watch?v=')) {
    videoId = url.split('v=')[1]?.split('&')[0]?.trim();
  } else if (url.includes('youtu.be/')) {
    videoId = url.split('youtu.be/')[1]?.split('?')[0]?.trim();
  } else if (url.includes('youtube.com/live/')) {
    videoId = url.split('youtube.com/live/')[1]?.split('?')[0]?.trim();
  }
  
  if (videoId) {
    videoId = videoId.split('&')[0].split('?')[0].trim();
  }
  
  if (!videoId) {
    return jsonResponse({ success: false, error: 'Não foi possível extrair o ID do vídeo.' }, 400);
  }
  
  console.log('📺 Video ID extraído:', videoId);
  
  const liveData = {
    id: videoId,
    videoId: videoId,
    title: 'Transmissão ao Vivo — Santuário de Fátima',
    thumbnail: `https://img.youtube.com/vi/${videoId}/maxresdefault.jpg`,
    link: `https://www.youtube.com/watch?v=${videoId}`,
    isLiveNow: true,
    ativo: true,
    atualizadoEm: new Date().toISOString()
  };
  
  // ✅ CORRIGIDO: salva em KV_YOUTUBE_STORAGE (não KV_FILES)
  await env.KV_YOUTUBE_STORAGE.put('live_manual', JSON.stringify(liveData));
  
  console.log('✅ Live salva com sucesso:', liveData);
  
  return jsonResponse({ success: true, live: liveData });
}

export async function handleAdminYoutubeLiveDelete(request, env) {
  console.log('📺 handleAdminYoutubeLiveDelete chamado');
  
  const authHeader = request.headers.get('Authorization');
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return jsonResponse({ success: false, error: 'Não autorizado' }, 401);
  }
  
  // ✅ CORRIGIDO: remove de KV_YOUTUBE_STORAGE (não KV_FILES)
  await env.KV_YOUTUBE_STORAGE.delete('live_manual');
  console.log('✅ Live removida do KV_YOUTUBE_STORAGE');
  
  return jsonResponse({ success: true, message: 'Live removida com sucesso!' });
}

export async function handleAdminYoutubeLiveGet(request, env) {
  console.log('📺 handleAdminYoutubeLiveGet chamado');
  
  const authHeader = request.headers.get('Authorization');
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return jsonResponse({ success: false, error: 'Não autorizado' }, 401);
  }
  
  // ✅ CORRIGIDO: lê de KV_YOUTUBE_STORAGE (não KV_FILES)
  const liveManual = await env.KV_YOUTUBE_STORAGE?.get('live_manual', 'json');
  console.log('📺 Live encontrada:', liveManual ? 'Sim' : 'Não');
  
  return jsonResponse({ success: true, live: liveManual || null });
}