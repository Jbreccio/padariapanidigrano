// backend/api/src/routes/liturgia.routes.js
const express = require('express');
const router = express.Router();

// Cache para evitar muitas requisições
let cachedLiturgia = null;
let cacheTime = 0;
const CACHE_DURATION = 60 * 60 * 1000; // 1 hora

router.get('/', async (req, res) => {
  try {
    const dataParam = req.query.data || new Date().toISOString().split('T')[0];
    
    // Verifica cache
    if (cachedLiturgia && cachedLiturgia.data === dataParam && (Date.now() - cacheTime) < CACHE_DURATION) {
      return res.json(cachedLiturgia);
    }
    
    // Tenta buscar da API da Liturgia Diária
    const url = `https://liturgia.dioceseblumenau.org.br/api/liturgia/${dataParam}`;
    const response = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
      }
    });
    
    if (response.ok) {
      const liturgia = await response.json();
      const result = {
        success: true,
        data: dataParam,
        liturgia: {
          titulo: liturgia.titulo || `Liturgia do Dia - ${new Date(dataParam).toLocaleDateString('pt-BR')}`,
          cor: liturgia.cor || 'Verde',
          primeiraLeitura: liturgia.primeiraLeitura || 'Leitura do Livro do Profeta...',
          salmo: liturgia.salmo || 'O Senhor é meu pastor, nada me faltará...',
          evangelho: liturgia.evangelho || 'Proclamação do Evangelho de Jesus Cristo segundo...',
          reflexao: liturgia.reflexao || 'Que a palavra de Deus ilumine nossos corações neste dia.',
          leituras: liturgia.leituras || []
        },
        fonte: 'Diocese de Blumenau'
      };
      
      cachedLiturgia = result;
      cacheTime = Date.now();
      
      return res.json(result);
    }
    
    // Fallback com dados mockados
    const mockResult = getMockLiturgia(dataParam);
    cachedLiturgia = mockResult;
    cacheTime = Date.now();
    
    res.json(mockResult);
    
  } catch (error) {
    console.error('Erro ao buscar liturgia:', error);
    res.json(getMockLiturgia(req.query.data));
  }
});

function getMockLiturgia(dataParam) {
  const data = dataParam || new Date().toISOString().split('T')[0];
  const hoje = new Date(data);
  const diaSemana = hoje.toLocaleDateString('pt-BR', { weekday: 'long' });
  
  return {
    success: true,
    data: data,
    liturgia: {
      titulo: `Liturgia do ${diaSemana.charAt(0).toUpperCase() + diaSemana.slice(1)} - ${hoje.toLocaleDateString('pt-BR')}`,
      cor: 'Verde',
      primeiraLeitura: 'Leitura do Livro do Profeta Isaías',
      textoPrimeiraLeitura: 'Naqueles dias, o Senhor disse: "Eis que faço novas todas as coisas"...',
      salmo: 'Sl 84(85), 9ab-10. 11-12. 13-14 (R. 8)',
      refraoSalmo: 'Mostrai-nos, ó Senhor, vossa bondade, e dai-nos vossa salvação!',
      evangelho: 'Proclamação do Evangelho de Jesus Cristo segundo São Mateus',
      textoEvangelho: 'Naquele tempo, disse Jesus: "Vinde a mim, todos vós que estais cansados..."',
      reflexao: 'A liturgia de hoje nos convida a confiar na misericórdia de Deus e a buscar a conversão. Que possamos abrir nossos corações para acolher a Palavra que transforma vidas.',
      leituras: [
        { titulo: 'Primeira Leitura', referencia: 'Is 55, 1-11' },
        { titulo: 'Salmo Responsorial', referencia: 'Sl 84(85)' },
        { titulo: 'Evangelho', referencia: 'Mt 14, 13-21' }
      ]
    },
    fonte: 'Dados locais'
  };
}

module.exports = router;