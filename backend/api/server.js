// backend/api/server.js
import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { v4 as uuidv4 } from 'uuid';
import fetch from 'node-fetch';
import * as cheerio from 'cheerio';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3001;

// Middlewares
app.use(cors({
  origin: ['http://localhost:5173', 'http://localhost:3000', 'https://santuariodefatima.com.br'],
  credentials: true
}));
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// ==================== DADOS MOCKADOS ====================

const MOCK_INSTAGRAM_POSTS = {
  data: [
    { id: '1', caption: 'Missa de São José - Momentos especiais! 🙌✨', permalink: 'https://www.instagram.com/santuariofatima', media_url: 'https://placehold.co/600x600/9333ea/white?text=São+José', thumbnail_url: 'https://placehold.co/600x600/9333ea/white?text=São+José', timestamp: new Date().toISOString(), media_type: 'IMAGE' },
    { id: '2', caption: 'Quaresma: tempo de conversão e oração. 🙏', permalink: 'https://www.instagram.com/santuariofatima', media_url: 'https://placehold.co/600x600/9333ea/white?text=Quaresma', thumbnail_url: 'https://placehold.co/600x600/9333ea/white?text=Quaresma', timestamp: new Date().toISOString(), media_type: 'IMAGE' },
    { id: '3', caption: 'Acompanhe nossas celebrações ao vivo! 🔴', permalink: 'https://www.instagram.com/santuariofatima', media_url: 'https://placehold.co/600x600/9333ea/white?text=Ao+Vivo', thumbnail_url: 'https://placehold.co/600x600/9333ea/white?text=Ao+Vivo', timestamp: new Date().toISOString(), media_type: 'VIDEO' },
    { id: '4', caption: 'Semana Santa: programação especial! ✝️', permalink: 'https://www.instagram.com/santuariofatima', media_url: 'https://placehold.co/600x600/9333ea/white?text=Semana+Santa', thumbnail_url: 'https://placehold.co/600x600/9333ea/white?text=Semana+Santa', timestamp: new Date().toISOString(), media_type: 'IMAGE' },
    { id: '5', caption: 'Confira as fotos da Posse do novo Vigário! 📸', permalink: 'https://www.instagram.com/santuariofatima', media_url: 'https://placehold.co/600x600/9333ea/white?text=Posse', thumbnail_url: 'https://placehold.co/600x600/9333ea/white?text=Posse', timestamp: new Date().toISOString(), media_type: 'IMAGE' },
    { id: '6', caption: 'Campanha da Fraternidade 2026 - Participe! 🌱', permalink: 'https://www.instagram.com/santuariofatima', media_url: 'https://placehold.co/600x600/9333ea/white?text=Fraternidade', thumbnail_url: 'https://placehold.co/600x600/9333ea/white?text=Fraternidade', timestamp: new Date().toISOString(), media_type: 'IMAGE' }
  ]
};

const MOCK_DIOCESE_NEWS = [
  { id: '1', title: 'Programação da Semana Santa 2026 na Diocese de Santo Amaro', link: 'https://diocesedesantoamaro.org.br', description: 'Confira a programação completa das celebrações da Semana Santa.', image: 'https://placehold.co/600x400/4c1d95/white?text=Semana+Santa+2026', date: new Date().toISOString().split('T')[0], source: 'Diocese de Santo Amaro' },
  { id: '2', title: 'Campanha da Fraternidade 2026: Fraternidade e Ecologia Integral', link: 'https://diocesedesantoamaro.org.br', description: 'Participe da Campanha da Fraternidade 2026.', image: 'https://placehold.co/600x400/4c1d95/white?text=Campanha+Fraternidade', date: new Date().toISOString().split('T')[0], source: 'Diocese de Santo Amaro' },
  { id: '3', title: 'Caminhada Penitencial marca início da Quaresma', link: 'https://diocesedesantoamaro.org.br', description: 'Fiéis participaram da tradicional caminhada penitencial.', image: 'https://placehold.co/600x400/4c1d95/white?text=Caminhada+Penitencial', date: new Date().toISOString().split('T')[0], source: 'Diocese de Santo Amaro' },
  { id: '4', title: 'Retiro do Clero 2026 - Diocese de Santo Amaro', link: 'https://diocesedesantoamaro.org.br', description: 'Sacerdotes da diocese participam de retiro espiritual.', image: 'https://placehold.co/600x400/4c1d95/white?text=Retiro+Clero', date: new Date().toISOString().split('T')[0], source: 'Diocese de Santo Amaro' },
  { id: '5', title: 'Formação para Ministros da Comunhão', link: 'https://diocesedesantoamaro.org.br', description: 'Inscrições abertas para o curso de formação.', image: 'https://placehold.co/600x400/4c1d95/white?text=Ministros', date: new Date().toISOString().split('T')[0], source: 'Diocese de Santo Amaro' },
  { id: '6', title: 'Dia do Diácono: celebração especial', link: 'https://diocesedesantoamaro.org.br', description: 'A diocese celebra o Dia do Diácono.', image: 'https://placehold.co/600x400/4c1d95/white?text=Diácono', date: new Date().toISOString().split('T')[0], source: 'Diocese de Santo Amaro' }
];

const MOCK_LITURGIA = {
  success: true,
  data: new Date().toISOString().split('T')[0],
  liturgia: {
    titulo: `Liturgia do Dia - ${new Date().toLocaleDateString('pt-BR')}`,
    cor: 'Verde',
    primeiraLeitura: 'Leitura do Livro do Profeta Isaías',
    textoPrimeiraLeitura: 'Naqueles dias, o Senhor disse: "Eis que faço novas todas as coisas"...',
    salmo: 'Sl 84(85), 9ab-10. 11-12. 13-14 (R. 8)',
    refraoSalmo: 'Mostrai-nos, ó Senhor, vossa bondade, e dai-nos vossa salvação!',
    evangelho: 'Proclamação do Evangelho de Jesus Cristo segundo São Mateus',
    textoEvangelho: 'Naquele tempo, disse Jesus: "Vinde a mim, todos vós que estais cansados..."',
    reflexao: 'A liturgia de hoje nos convida a confiar na misericórdia de Deus.',
    leituras: [
      { titulo: 'Primeira Leitura', referencia: 'Is 55, 1-11' },
      { titulo: 'Salmo Responsorial', referencia: 'Sl 84(85)' },
      { titulo: 'Evangelho', referencia: 'Mt 14, 13-21' }
    ]
  },
  fonte: 'Dados locais'
};

// ==================== ROTAS ====================

app.get('/api/health', (req, res) => {
  res.json({
    status: 'online',
    timestamp: new Date().toISOString(),
    version: '2.0.0',
    mode: 'development (mock data)',
    services: {
      instagram: true,
      diocese: true,
      liturgia: true,
      youtube: true,
      terco: true
    }
  });
});

// Rota do Instagram (6 posts)
app.get('/api/instagram', async (req, res) => {
  try {
    const rssUrl = 'https://www.instagram.com/santuariofatima/rss';
    const response = await fetch(rssUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
        'Accept': 'application/rss+xml, application/xml, text/xml'
      }
    });
    
    if (response.ok) {
      const text = await response.text();
      const $ = cheerio.load(text, { xmlMode: true });
      
      const posts = [];
      $('item').each((i, elem) => {
        if (i < 10) {
          const title = $(elem).find('title').text();
          const link = $(elem).find('link').text();
          const description = $(elem).find('description').text();
          const pubDate = $(elem).find('pubDate').text();
          
          let imageUrl = '';
          const imgMatch = description.match(/<img[^>]+src="([^">]+)"/);
          if (imgMatch) imageUrl = imgMatch[1];
          
          const isVideo = link.includes('/reel/') || description.includes('video');
          
          posts.push({
            id: i.toString(),
            caption: title,
            permalink: link,
            media_url: imageUrl || 'https://placehold.co/600x600/9333ea/white?text=Santuario',
            thumbnail_url: imageUrl,
            timestamp: pubDate,
            media_type: isVideo ? 'VIDEO' : 'IMAGE'
          });
        }
      });
      
      if (posts.length > 0) {
        return res.json({ data: posts });
      }
    }
    
    res.json(MOCK_INSTAGRAM_POSTS);
  } catch (error) {
    console.error('Erro ao buscar Instagram:', error);
    res.json(MOCK_INSTAGRAM_POSTS);
  }
});

// Rota da Diocese
app.get('/api/diocese-news', async (req, res) => {
  try {
    const url = 'https://diocesedesantoamaro.org.br/noticias';
    const response = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9'
      }
    });
    
    if (response.ok) {
      const html = await response.text();
      const $ = cheerio.load(html);
      const news = [];
      
      $('article').each((i, elem) => {
        if (i < 6) {
          const title = $(elem).find('h2, h3, h4').first().text().trim();
          if (!title) return;
          
          let link = $(elem).find('a').first().attr('href') || '';
          if (link && link.startsWith('/')) link = `https://diocesedesantoamaro.org.br${link}`;
          
          let image = $(elem).find('img').first().attr('src') || '';
          if (image && image.startsWith('/')) image = `https://diocesedesantoamaro.org.br${image}`;
          
          let description = $(elem).find('p').first().text().trim().substring(0, 150);
          
          news.push({
            id: i.toString(),
            title: title,
            link: link || 'https://diocesedesantoamaro.org.br',
            description: description || 'Clique para ler a notícia completa',
            image: image || 'https://placehold.co/600x400/4c1d95/white?text=Diocese+Santo+Amaro',
            date: new Date().toISOString().split('T')[0],
            source: 'Diocese de Santo Amaro'
          });
        }
      });
      
      if (news.length > 0) {
        return res.json(news);
      }
    }
    
    res.json(MOCK_DIOCESE_NEWS);
  } catch (error) {
    console.error('Erro ao buscar Diocese:', error);
    res.json(MOCK_DIOCESE_NEWS);
  }
});

// Rota da Liturgia
app.get('/api/liturgia', async (req, res) => {
  try {
    const dataParam = req.query.data || new Date().toISOString().split('T')[0];
    const url = `https://liturgia.dioceseblumenau.org.br/api/liturgia/${dataParam}`;
    const response = await fetch(url, {
      headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36' }
    });
    
    if (response.ok) {
      const liturgia = await response.json();
      return res.json({
        success: true,
        data: dataParam,
        liturgia: {
          titulo: liturgia.titulo || `Liturgia do Dia - ${new Date(dataParam).toLocaleDateString('pt-BR')}`,
          cor: liturgia.cor || 'Verde',
          primeiraLeitura: liturgia.primeiraLeitura || 'Leitura do Livro do Profeta...',
          textoPrimeiraLeitura: liturgia.textoPrimeiraLeitura || '',
          salmo: liturgia.salmo || 'O Senhor é meu pastor, nada me faltará...',
          refraoSalmo: liturgia.refraoSalmo || '',
          evangelho: liturgia.evangelho || 'Proclamação do Evangelho de Jesus Cristo segundo...',
          textoEvangelho: liturgia.textoEvangelho || '',
          reflexao: liturgia.reflexao || 'Que a palavra de Deus ilumine nossos corações.',
          leituras: liturgia.leituras || []
        },
        fonte: 'Diocese de Blumenau'
      });
    }
    
    res.json(MOCK_LITURGIA);
  } catch (error) {
    console.error('Erro ao buscar liturgia:', error);
    res.json(MOCK_LITURGIA);
  }
});

// Rota do Terço
app.get('/api/terco/hoje', async (req, res) => {
  const day = new Date().getDay();
  const misterios = ['gloriosos', 'gozosos', 'dolorosos', 'gloriosos', 'luminosos', 'dolorosos', 'gozosos'];
  const titulos = ['Mistérios Gloriosos', 'Mistérios Gozosos', 'Mistérios Dolorosos', 'Mistérios Gloriosos', 'Mistérios Luminosos', 'Mistérios Dolorosos', 'Mistérios Gozosos'];
  
  res.json({
    success: true,
    misterio: misterios[day],
    titulo: titulos[day],
    audioUrl: `https://pub-89ce38aa8fb446c3b6b8d93e2d6fa452.r2.dev/terco-${misterios[day]}.mp3`,
    estrutura: { paiNosso: 6, aveMaria: 50, gloria: 5 }
  });
});

// Rota do YouTube
app.get('/api/youtube', async (req, res) => {
  const FALLBACK_VIDEOS = [
    { id: 'k6sbFio_qDI', title: 'Santa Missa - Santuário de Fátima' },
    { id: 'W3kFS0PQEc8', title: 'Santa Missa - 1º Domingo da Quaresma' },
    { id: 'MkxD4-pTviM', title: 'Santa Missa - Quarta-feira de Cinzas' },
    { id: 'uxpvBXYXm6s', title: 'Santa Missa - Santuário de Fátima' },
    { id: 'LoRx8F-wRf0', title: 'Santa Missa - Santuário de Fátima' }
  ];
  
  const fallbackVideos = FALLBACK_VIDEOS.map(v => ({
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
});

// Rota do Vatican News
app.get('/api/vatican-news', async (req, res) => {
  try {
    const rssUrl = 'https://www.vaticannews.va/pt/noticias.rss';
    const response = await fetch(rssUrl, {
      headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36' }
    });
    
    if (response.ok) {
      const text = await response.text();
      const $ = cheerio.load(text, { xmlMode: true });
      
      const news = [];
      $('item').each((i, elem) => {
        if (i < 6) {
          const title = $(elem).find('title').text();
          const link = $(elem).find('link').text();
          let description = $(elem).find('description').text();
          description = description.replace(/<[^>]*>/g, '').substring(0, 200);
          const pubDate = $(elem).find('pubDate').text();
          
          news.push({
            id: i.toString(),
            title: title,
            link: link,
            description: description,
            image: '',
            pubDate: pubDate,
            source: 'Vatican News'
          });
        }
      });
      
      if (news.length > 0) {
        return res.json(news);
      }
    }
    
    res.json([
      { id: '1', title: 'Papa Francisco: "A fé transforma vidas"', link: 'https://www.vaticannews.va/pt.html', description: 'O Papa Francisco destacou a importância da fé.', pubDate: new Date().toISOString(), source: 'Vatican News' }
    ]);
  } catch (error) {
    res.json([{ id: '1', title: 'Vatican News', link: 'https://www.vaticannews.va/pt.html', description: 'Acesse o site oficial.', pubDate: new Date().toISOString(), source: 'Vatican News' }]);
  }
});

// Rota de contato
app.post('/api/contato/enviar', async (req, res) => {
  const { nome, email, assunto, mensagem, telefone } = req.body;
  console.log(`📧 Contato recebido: ${nome} - ${assunto}`);
  console.log(`   Email: ${email}`);
  console.log(`   Telefone: ${telefone || 'Não informado'}`);
  console.log(`   Mensagem: ${mensagem}`);
  res.json({ success: true, message: 'Mensagem enviada com sucesso!' });
});

// Rota root
app.get('/', (req, res) => {
  res.json({
    name: 'Santuário de Fátima API',
    version: '2.0.0',
    status: 'online',
    mode: 'development (mock data)',
    endpoints: [
      '/api/health',
      '/api/liturgia',
      '/api/terco/hoje',
      '/api/youtube',
      '/api/instagram',
      '/api/diocese-news',
      '/api/vatican-news',
      '/api/contato/enviar'
    ]
  });
});

// ==================== INICIAR SERVIDOR ====================

app.listen(PORT, () => {
  console.log(`
  ╔══════════════════════════════════════════════════════════╗
  ║     🚀 SANTUÁRIO DE FÁTIMA - API DE DESENVOLVIMENTO     ║
  ╠══════════════════════════════════════════════════════════╣
  ║  📡 Porta: ${PORT}                                          ║
  ║  🌐 Frontend: http://localhost:5173                        ║
  ║  📦 Modo: MOCK DATA (desenvolvimento)                      ║
  ╠══════════════════════════════════════════════════════════╣
  ║  📌 ENDPOINTS PRINCIPAIS:                                  ║
  ║  • GET  /api/health                                        ║
  ║  • GET  /api/instagram (6 posts mockados)                  ║
  ║  • GET  /api/diocese-news (6 notícias mockadas)            ║
  ║  • GET  /api/liturgia (dados mockados)                     ║
  ║  • GET  /api/youtube (5 vídeos mockados)                   ║
  ║  • GET  /api/terco/hoje                                    ║
  ║  • POST /api/contato/enviar                                ║
  ╚══════════════════════════════════════════════════════════╝
  `);
});