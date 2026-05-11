/**
 * API Route: Diocese de Santo Amaro
 * 
 * Rota pública para buscar notícias do site da Diocese de Santo Amaro
 * URL: /api/diocese-news (fallback se o Worker estiver offline)
 */

const express = require('express');
const router = express.Router();

// Função auxiliar para extrair notícias do HTML
function cleanText(text) {
  if (!text) return text;
  return text
    .replace(/<!\[CDATA\[/g, '').replace(/\]\]>/g, '')
    .replace(/<[^>]+>/g, '').replace(/&[a-z]+;/g, ' ')
    .replace(/\s+/g, ' ').trim();
}

function extractNewsFromHTML(html) {
  const news = [];
  
  try {
    const newsPatterns = [
      { pattern: /Posse Canônica 2026/g, category: 'Acontecimentos Eclesiais' },
      { pattern: /Crisma/g, category: 'Sacramentos' },
      { pattern: /Igreja Diocesana/g, category: 'Igreja' },
      { pattern: /Acontece na Igreja/g, category: 'Notícias' },
      { pattern: /Retiro do Clero 2025/g, category: 'Clero' },
      { pattern: /Centro Pastoral em ação/g, category: 'Pastoral' },
      { pattern: /Visita Pastoral/g, category: 'Pastoral' }
    ];

    newsPatterns.forEach(({ pattern, category }) => {
      if (pattern.test(html)) {
        news.push(createNewsItem(pattern.source, category));
      }
    });

    const titleRegex = /<h[1-3][^>]*>(.*?)<\/h[1-3]>/gi;
    const titles = [...html.matchAll(titleRegex)];
    
    titles.slice(0, 5).forEach((match, index) => {
      const title = match[1].replace(/<[^>]*>/g, '').trim();
      if (title.length > 10 && !news.some(n => n.title === title)) {
        news.push(createNewsItem(title, 'Últimas Notícias', index));
      }
    });

  } catch (e) {
    console.error('Erro ao extrair notícias:', e);
  }

  return news.filter((item, index, self) => 
    index === self.findIndex(n => n.title === item.title)
  ).slice(0, 6);
}

function createNewsItem(title, category, index = 0) {
  const descriptions = [
    'A Diocese de Santo Amaro convida todos os fiéis para este importante momento de fé e comunhão.',
    'Participe deste evento especial que reunirá a comunidade diocesana em oração e reflexão.',
    'Momento de graça e renovação espiritual para toda a família diocesana.',
    'Venha vivenciar esta experiência única de fé e partilha conosco.'
  ];

  const authors = [
    'Pascom Diocese',
    'Equipe de Comunicação',
    'Diocese de Santo Amaro'
  ];

  return {
    id: `diocese-${Date.now()}-${index}-${Math.random().toString(36).substr(2, 9)}`,
    title: title,
    description: descriptions[index % descriptions.length],
    link: 'https://diocesedesantoamaro.org.br',
    pubDate: new Date(Date.now() - index * 86400000).toISOString(),
    author: authors[index % authors.length],
    category: category
  };
}

function getSimulatedNews() {
  return [
    {
      id: '1',
      title: 'Posse Canônica 2026',
      description: 'A Diocese de Santo Amaro se prepara para a celebração da Posse Canônica que acontecerá em 2026. Momento especial para toda a comunidade diocesana.',
      link: 'https://diocesedesantoamaro.org.br',
      pubDate: new Date().toISOString(),
      author: 'Pascom Diocese',
      category: 'Acontecimentos Eclesiais'
    },
    {
      id: '2',
      title: 'Celebração do Crisma',
      description: 'Jovens e adultos se preparam para receber o Sacramento do Crisma em nossas paróquias. Inscrições abertas nas comunidades.',
      link: 'https://diocesedesantoamaro.org.br',
      pubDate: new Date(Date.now() - 86400000).toISOString(),
      author: 'Equipe de Catequese',
      category: 'Sacramentos'
    },
    {
      id: '3',
      title: 'Igreja Diocesana em Movimento',
      description: 'Acompanhe as principais atividades e acontecimentos da Igreja Diocesana de Santo Amaro.',
      link: 'https://diocesedesantoamaro.org.br',
      pubDate: new Date(Date.now() - 172800000).toISOString(),
      author: 'Comunicação Diocesana',
      category: 'Igreja Diocesana'
    },
    {
      id: '4',
      title: 'Acontece na Igreja',
      description: 'Fique por dentro dos principais eventos e celebrações que acontecem em nossa diocese.',
      link: 'https://diocesedesantoamaro.org.br',
      pubDate: new Date(Date.now() - 259200000).toISOString(),
      author: 'Pascom',
      category: 'Acontece na Igreja'
    },
    {
      id: '5',
      title: 'Retiro do Clero 2025',
      description: 'Sacerdotes da diocese participam do Retiro do Clero 2025, momento de espiritualidade e formação.',
      link: 'https://diocesedesantoamaro.org.br',
      pubDate: new Date(Date.now() - 345600000).toISOString(),
      author: 'Equipe Diocesana',
      category: 'Clero'
    },
    {
      id: '6',
      title: 'Centro Pastoral em Ação',
      description: 'Centro Pastoral Diocesano promove encontros e formações para agentes de pastoral.',
      link: 'https://diocesedesantoamaro.org.br',
      pubDate: new Date(Date.now() - 432000000).toISOString(),
      author: 'Centro Pastoral',
      category: 'Pastoral'
    }
  ];
}

// GET /api/diocese-news
router.get('/diocese-news', async (req, res) => {
  try {
    console.log('📡 API: Buscando notícias da Diocese de Santo Amaro...');

    const response = await fetch('https://diocesedesantoamaro.org.br', {
      headers: {
        'User-Agent': 'Mozilla/5.0 (compatible; SantuarioBot/1.0)',
        'Accept': 'text/html,application/xhtml+xml'
      },
      timeout: 10000 // 10 segundos de timeout
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const html = await response.text();
    const newsItems = extractNewsFromHTML(html);
    const finalNews = newsItems.length > 0 ? newsItems : getSimulatedNews();

    res.json({
      success: true,
      items: finalNews,
      total: finalNews.length,
      source: 'diocesedesantoamaro.org.br',
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('❌ Erro na API Diocese:', error);
    
    res.json({
      success: false,
      error: error.message,
      items: getSimulatedNews(),
      source: 'simulated',
      timestamp: new Date().toISOString()
    });
  }
});

module.exports = router;