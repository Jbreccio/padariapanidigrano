// Exportar todas as APIs
import vaticanRouter from './vatican.js';
import youtubeRouter from './youtube.js';
import instagramRouter from './instagram.js';
import wikipediaRouter from './wikipedia.js';

export {
  vaticanRouter,
  youtubeRouter,
  instagramRouter,
  wikipediaRouter
};

// Função para registrar todas as rotas
export const registerApiRoutes = (app) => {
  app.use('/api/vatican-news', vaticanRouter);
  app.use('/api/youtube', youtubeRouter);
  app.use('/api/instagram', instagramRouter);
  app.use('/api/wikipedia', wikipediaRouter);
  
  console.log('✅ APIs externas registradas:');
  console.log('   /api/vatican-news - Notícias do Vaticano');
  console.log('   /api/youtube - Vídeos do YouTube');
  console.log('   /api/instagram - Posts do Instagram');
  console.log('   /api/wikipedia - Santos do dia e busca');
};

// Status das APIs
export const getApiStatus = async () => {
  const status = {
    vatican: { enabled: true, note: 'RSS Feed' },
    youtube: { 
      enabled: !!process.env.YOUTUBE_API_KEY, 
      note: process.env.YOUTUBE_API_KEY ? 'Configurado' : 'API Key não configurada' 
    },
    instagram: { 
      enabled: !!process.env.INSTAGRAM_ACCESS_TOKEN,
      note: process.env.INSTAGRAM_ACCESS_TOKEN ? 'Configurado' : 'Token não configurado'
    },
    wikipedia: { enabled: true, note: 'Dados de santos' }
  };
  
  return status;
};