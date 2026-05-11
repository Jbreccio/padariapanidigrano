import { jsonResponse } from '../../utils/responses.js';
import { cleanText } from '../../utils/helpers.js';

function parseRSS(xml) {
  const items = [];
  const itemMatches = xml.matchAll(/<item>([\s\S]*?)<\/item>/g);
  
  for (const match of itemMatches) {
    if (items.length >= 12) break;
    const itemXml = match[1];

    const getTag = (tagName) => {
      const regex = new RegExp(
        `<${tagName}[^>]*>(?:<!\\[CDATA\\[([\\s\\S]*?)\\]\\]>|([\\s\\S]*?))</${tagName}>`,
        'i'
      );
      const m = itemXml.match(regex);
      if (!m) return '';
      const value = (m[1] || m[2] || '').trim();
      return cleanText(value);
    };

    const title = getTag('title');
    const link = getTag('link') || getTag('guid');
    const description = getTag('description');
    const pubDate = getTag('pubDate') || new Date().toISOString();

    if (title && link) {
      items.push({
        id: `vatican_${Date.now()}_${items.length}`,
        title,
        link: link.trim(),
        description: description
          ? description.replace(/<[^>]*>/g, '').substring(0, 180) + '...'
          : '',
        pubDate,
        author: 'Vatican News',
        category: 'Noticias'
      });
    }
  }
  return items;
}

function categorizeNews(items) {
  return items.map(item => {
    let category = 'Noticias';
    const lowerTitle = item.title.toLowerCase();
    const lowerLink = item.link.toLowerCase();
    if (lowerLink.includes('/papa/') || lowerTitle.includes('papa') || lowerTitle.includes('leão')) category = 'Papa';
    else if (lowerLink.includes('/cultura/')) category = 'Cultura';
    else if (lowerLink.includes('/formacao/')) category = 'Formação';
    else if (lowerLink.includes('/igreja/')) category = 'Igreja';
    else if (lowerLink.includes('/africa/')) category = 'África';
    else if (lowerLink.includes('/mundo/')) category = 'Mundo';
    else if (lowerLink.includes('/vaticano/')) category = 'Vaticano';
    else if (lowerTitle.includes('jovens')) category = 'Juventude';
    else if (lowerTitle.includes('familia')) category = 'Família';
    return { ...item, category };
  });
}

function getFallbackNews() {
  return [{
    id: 'fallback_1',
    title: 'Vatican News - Últimas Notícias',
    link: 'https://www.vaticannews.va/pt.html',
    description: 'Acesse o site oficial do Vatican News para as últimas notícias.',
    pubDate: new Date().toISOString(),
    author: 'Vatican News',
    category: 'Noticias'
  }];
}

export async function getVaticanNews(env) {
  const cacheKey = 'vatican_news:latest';
  try {
    // Verifica cache — ignora se tiver só 1 item (pode ser fallback antigo)
    const cached = await env.VATICANNEWS_CACHE?.get(cacheKey, 'json');
    if (cached && Array.isArray(cached) && cached.length > 1) {
      return cached;
    }

    const res = await fetch('https://www.vaticannews.va/pt.rss.xml', {
      headers: { 'User-Agent': 'Mozilla/5.0 (compatible; SantuarioBot/1.0)' }
    });

    if (!res.ok) throw new Error(`RSS status: ${res.status}`);

    const xml = await res.text();
    console.log('📡 Vatican RSS tamanho:', xml.length);

    const items = parseRSS(xml);
    console.log('📡 Vatican items parseados:', items.length);

    const finalItems = categorizeNews(items);

    if (env.VATICANNEWS_CACHE && finalItems.length > 0) {
      await env.VATICANNEWS_CACHE.put(
        cacheKey,
        JSON.stringify(finalItems),
        { expirationTtl: 3600 }
      );
    }

    return finalItems.length > 0 ? finalItems : getFallbackNews();

  } catch (error) {
    console.error('❌ Erro Vatican News:', error.message);
    return getFallbackNews();
  }
}

export async function handleVaticanNews(request, env) {
  try {
    const news = await getVaticanNews(env);
    return jsonResponse(news);
  } catch {
    return jsonResponse(getFallbackNews(), 200);
  }
}