// backend/src/api/social.js - NOVO ARQUIVO

export async function fetchInstagramPosts(env) {
  try {
    const token = env.INSTAGRAM_ACCESS_TOKEN;
    
    const response = await fetch(
      `https://graph.instagram.com/me/media?fields=id,caption,media_url,permalink,timestamp,username&access_token=${token}&limit=10`
    );
    
    const data = await response.json();
    return data;
  } catch (error) {
    console.error('❌ Erro Instagram:', error);
    return { error: error.message, data: [] };
  }
}

export async function fetchYouTubeVideos(env) {
  try {
    const apiKey = env.YOUTUBE_API_KEY;
    const channelId = env.YOUTUBE_CHANNEL_ID || 'UC_x5XG1OV2P6uZZ5FSM9Ttw'; // Vatican News default
    
    const response = await fetch(
      `https://www.googleapis.com/youtube/v3/search?key=${apiKey}&channelId=${channelId}&part=snippet,id&order=date&maxResults=10&type=video`
    );
    
    const data = await response.json();
    return data;
  } catch (error) {
    console.error('❌ Erro YouTube:', error);
    return { error: error.message, items: [] };
  }
}

// Rota principal para social media
export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    
    if (url.pathname === '/api/social/instagram') {
      const posts = await fetchInstagramPosts(env);
      return new Response(JSON.stringify(posts), {
        headers: { 
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*'
        }
      });
    }
    
    if (url.pathname === '/api/social/youtube') {
      const videos = await fetchYouTubeVideos(env);
      return new Response(JSON.stringify(videos), {
        headers: { 
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*'
        }
      });
    }
    
    if (url.pathname === '/api/social/all') {
      const [instagram, youtube] = await Promise.all([
        fetchInstagramPosts(env),
        fetchYouTubeVideos(env)
      ]);
      
      return new Response(JSON.stringify({ instagram, youtube }), {
        headers: { 
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*'
        }
      });
    }
    
    // Rota padrão
    return new Response(JSON.stringify({ message: 'Social Media API' }), {
      headers: { 'Content-Type': 'application/json' }
    });
  }
}