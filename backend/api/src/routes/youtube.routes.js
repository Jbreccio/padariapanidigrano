// backend/api/src/routes/youtube.routes.js
const express = require('express');
const router = express.Router();

// Cache para evitar muitas requisições
let cachedVideos = null;
let cacheTime = 0;
const CACHE_DURATION = 5 * 60 * 1000; // 5 minutos

// IDs de vídeos do canal Santuário de Fátima
const CHANNEL_VIDEOS = [
  { id: 'k6sbFio_qDI', title: 'Santa Missa - Santuário de Fátima' },
  { id: 'W3kFS0PQEc8', title: 'Santa Missa - 1º Domingo da Quaresma' },
  { id: 'MkxD4-pTviM', title: 'Santa Missa - Quarta-feira de Cinzas' },
  { id: 'uxpvBXYXm6s', title: 'Santa Missa - Santuário de Fátima' },
  { id: 'LoRx8F-wRf0', title: 'Santa Missa - Santuário de Fátima' }
];

router.get('/', async (req, res) => {
  try {
    // Verifica cache
    if (cachedVideos && (Date.now() - cacheTime) < CACHE_DURATION) {
      return res.json(cachedVideos);
    }
    
    // Busca informações dos vídeos
    const videos = [];
    
    for (const video of CHANNEL_VIDEOS) {
      try {
        const videoId = video.id;
        const response = await fetch(`https://www.googleapis.com/youtube/v3/videos?part=snippet,contentDetails,liveStreamingDetails&id=${videoId}&key=${process.env.YOUTUBE_API_KEY || 'AIzaSyA-EXAMPLE-KEY'}`);
        
        if (response.ok) {
          const data = await response.json();
          if (data.items && data.items[0]) {
            const item = data.items[0];
            videos.push({
              id: { videoId: videoId },
              snippet: {
                title: item.snippet.title,
                thumbnails: { high: { url: item.snippet.thumbnails.high.url } }
              },
              isLive: item.snippet.liveBroadcastContent === 'live'
            });
          } else {
            // Fallback
            videos.push({
              id: { videoId: videoId },
              snippet: {
                title: video.title,
                thumbnails: { high: { url: `https://i.ytimg.com/vi/${videoId}/mqdefault.jpg` } }
              },
              isLive: false
            });
          }
        } else {
          // Fallback
          videos.push({
            id: { videoId: videoId },
            snippet: {
              title: video.title,
              thumbnails: { high: { url: `https://i.ytimg.com/vi/${videoId}/mqdefault.jpg` } }
            },
            isLive: false
          });
        }
      } catch (error) {
        console.error(`Erro ao buscar vídeo ${video.id}:`, error);
        videos.push({
          id: { videoId: video.id },
          snippet: {
            title: video.title,
            thumbnails: { high: { url: `https://i.ytimg.com/vi/${video.id}/mqdefault.jpg` } }
          },
          isLive: false
        });
      }
    }
    
    const result = {
      allVideos: videos,
      mainVideo: videos[0],
      cardVideos: videos.slice(1, 6),
      liveStatus: videos.some(v => v.isLive) ? 'live' : 'none'
    };
    
    cachedVideos = result;
    cacheTime = Date.now();
    
    res.json(result);
    
  } catch (error) {
    console.error('Erro ao buscar YouTube:', error);
    
    // Fallback
    const fallbackVideos = CHANNEL_VIDEOS.map(v => ({
      id: { videoId: v.id },
      snippet: {
        title: v.title,
        thumbnails: { high: { url: `https://i.ytimg.com/vi/${v.id}/mqdefault.jpg` } }
      },
      isLive: false
    }));
    
    res.json({
      allVideos: fallbackVideos,
      mainVideo: fallbackVideos[0],
      cardVideos: fallbackVideos.slice(1, 6),
      liveStatus: 'none'
    });
  }
});

module.exports = router;