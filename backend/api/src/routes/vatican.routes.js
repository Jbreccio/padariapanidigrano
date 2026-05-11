import express from 'express';
import fetch from 'node-fetch';

const router = express.Router();

// Proxy para Vatican News
router.get('/vatican-news', async (req, res) => {
  try {
    const response = await fetch('https://www.vaticannews.va/pt.html', {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
      }
    });
    
    const html = await response.text();
    
    // Extrair notícias do HTML (simplificado)
    const news = extractNewsFromHTML(html);
    
    res.json({
      success: true,
      news
    });
    
  } catch (error) {
    console.error('❌ Erro Vatican News:', error);
    res.status(500).json({
      success: false,
      error: 'Erro ao buscar notícias'
    });
  }
});

function extractNewsFromHTML(html) {
  // Implemente a extração das notícias do HTML
  // Como fallback, retorne notícias fixas
  return [
    {
      title: "Papa Francisco celebra missa no Vaticano",
      link: "#",
      date: new Date().toLocaleDateString('pt-BR')
    },
    {
      title: "Sínodo: caminho de comunhão e participação",
      link: "#",
      date: new Date().toLocaleDateString('pt-BR')
    }
  ];
}

export default router;
