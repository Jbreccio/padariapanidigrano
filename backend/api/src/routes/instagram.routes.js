// backend/api/src/routes/instagram.routes.js
const express = require('express');
const router = express.Router();

// Rota para buscar posts do Instagram
router.get('/', async (req, res) => {
  try {
    // Tenta buscar do RSS feed do Instagram
    const rssUrl = 'https://www.instagram.com/santuariofatima/rss';
    const response = await fetch(rssUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
        'Accept': 'application/rss+xml, application/xml, text/xml'
      }
    });
    
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`);
    }
    
    const text = await response.text();
    
    // Parse do RSS
    const posts = [];
    const itemRegex = /<item>([\s\S]*?)<\/item>/g;
    let match;
    
    while ((match = itemRegex.exec(text)) !== null && posts.length < 10) {
      const item = match[1];
      
      // Extrai título
      let title = item.match(/<title>([\s\S]*?)<\/title>/)?.[1] || '';
      title = title.replace(/<!\[CDATA\[|\]\]>/g, '').trim();
      
      // Extrai link
      const link = item.match(/<link>([\s\S]*?)<\/link>/)?.[1] || '';
      
      // Extrai descrição
      let description = item.match(/<description>([\s\S]*?)<\/description>/)?.[1] || '';
      description = description.replace(/<!\[CDATA\[|\]\]>/g, '');
      
      // Extrai data
      const pubDate = item.match(/<pubDate>([\s\S]*?)<\/pubDate>/)?.[1] || '';
      
      // Extrai imagem
      let imageUrl = '';
      const imgMatch = description.match(/<img[^>]+src="([^">]+)"/);
      if (imgMatch) {
        imageUrl = imgMatch[1];
      }
      
      // Determina tipo
      const isVideo = link.includes('/reel/') || description.includes('video');
      const isCarousel = description.includes('carousel');
      
      posts.push({
        id: posts.length.toString(),
        caption: title,
        permalink: link,
        media_url: imageUrl,
        thumbnail_url: imageUrl,
        timestamp: pubDate,
        media_type: isVideo ? 'VIDEO' : (isCarousel ? 'CAROUSEL_ALBUM' : 'IMAGE')
      });
    }
    
    if (posts.length === 0) {
      return res.json(getMockInstagramPosts());
    }
    
    res.json({ data: posts });
    
  } catch (error) {
    console.error('Erro ao buscar Instagram:', error);
    res.json(getMockInstagramPosts());
  }
});

function getMockInstagramPosts() {
  return {
    data: [
      {
        id: '1',
        caption: 'Missa de São José - Confira os momentos especiais! 🙌✨',
        permalink: 'https://www.instagram.com/santuariofatima',
        media_url: 'https://placehold.co/600x600/9333ea/white?text=São+José',
        thumbnail_url: 'https://placehold.co/600x600/9333ea/white?text=São+José',
        timestamp: new Date().toISOString(),
        media_type: 'IMAGE'
      },
      {
        id: '2',
        caption: 'Quaresma: tempo de conversão e oração. Participe! 🙏',
        permalink: 'https://www.instagram.com/santuariofatima',
        media_url: 'https://placehold.co/600x600/9333ea/white?text=Quaresma',
        thumbnail_url: 'https://placehold.co/600x600/9333ea/white?text=Quaresma',
        timestamp: new Date().toISOString(),
        media_type: 'IMAGE'
      },
      {
        id: '3',
        caption: 'Acompanhe nossas celebrações ao vivo! 🔴',
        permalink: 'https://www.instagram.com/santuariofatima',
        media_url: 'https://placehold.co/600x600/9333ea/white?text=Ao+Vivo',
        thumbnail_url: 'https://placehold.co/600x600/9333ea/white?text=Ao+Vivo',
        timestamp: new Date().toISOString(),
        media_type: 'VIDEO'
      }
    ]
  };
}

module.exports = router;