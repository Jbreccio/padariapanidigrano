// backend/src/api/saints.js
import express from 'express';
const router = express.Router();

// ===== BASE DE DADOS DE SANTOS =====
const SANTOS_DATABASE = {
  // JANEIRO
  '20-1': {
    nome: 'São Sebastião',
    data: '20 de janeiro',
    descricao: 'Mártir romano, padroeiro dos atletas',
    historia: 'São Sebastião foi soldado da guarda pretoriana romana. Nasceu em Narbona, França, no século III. Convertido ao cristianismo, tornou-se capitão da guarda pretoriana. Descoberto como cristão, foi condenado à morte por flechadas. Milagrosamente sobreviveu, mas foi posteriormente espancado até a morte. É invocado contra pestes e epidemias.',
    imagem: 'https://upload.wikimedia.org/wikipedia/commons/b/bb/Saint_Sebastian_by_Andrea_Mantegna%2C_ca.1480.jpg'
  },
  '21-1': {
    nome: 'Santa Inês',
    data: '21 de janeiro',
    descricao: 'Virgem e mártir romana',
    historia: 'O nome Inês, em grego, significa "pura e casta". Santa Inês foi uma jovem mártir cristã do século IV. Com apenas 13 anos, recusou-se a renunciar sua fé e foi martirizada em Roma durante a perseguição de Diocleciano.',
    imagem: 'https://upload.wikimedia.org/wikipedia/commons/3/3d/Santa_In%C3%AAs_de_Roma.jpg'
  },
  '22-1': {
    nome: 'São Vicente',
    data: '22 de janeiro',
    descricao: 'Diácono e mártir espanhol',
    historia: 'Vicente de Saragoça foi diácono do bispo Valério. Durante a perseguição de Diocleciano, foi preso em Valência, Espanha, no ano 304. Submetido a terríveis torturas, permaneceu firme na fé. É considerado o primeiro mártir da Espanha.',
    imagem: 'https://upload.wikimedia.org/wikipedia/commons/2/2e/Saint_Vincent_Saragossa.jpg'
  },
  '23-1': {
    nome: 'São Ildefonso',
    data: '23 de janeiro',
    descricao: 'Bispo de Toledo, Doutor da Virgindade de Maria',
    historia: 'Ildefonso (c. 607-667) foi arcebispo de Toledo e um dos grandes santos visigodos. Escreveu importantes obras teológicas, especialmente sobre a Virgem Maria.',
    imagem: 'https://upload.wikimedia.org/wikipedia/commons/6/6c/San_Ildefonso_-_El_Greco.jpg'
  },
  '24-1': {
    nome: 'São Francisco de Sales',
    data: '24 de janeiro',
    descricao: 'Bispo e Doutor da Igreja, padroeiro dos jornalistas',
    historia: 'Francisco de Sales (1567-1622) foi bispo de Genebra e doutor da Igreja. Conhecido por sua doçura e paciência, é autor de obras espirituais clássicas como "Introdução à Vida Devota".',
    imagem: 'https://upload.wikimedia.org/wikipedia/commons/9/90/Francisco_de_Sales.jpg'
  },
  
  // SANTOS POPULARES
  'nossa-senhora-de-fatima': {
    nome: 'Nossa Senhora de Fátima',
    data: '13 de maio',
    descricao: 'Aparições marianas em Fátima, Portugal',
    historia: 'Entre 13 de maio e 13 de outubro de 1917, a Virgem Maria apareceu seis vezes a três pastorinhos na Cova da Iria, Fátima: Lúcia dos Santos, Francisco Marto e Jacinta Marto. A Virgem pediu oração do rosário, penitência pela conversão dos pecadores e a consagração da Rússia ao seu Imaculado Coração.',
    imagem: 'https://upload.wikimedia.org/wikipedia/commons/6/6f/Our_Lady_of_Fatima.jpg'
  },
  'sao-jose': {
    nome: 'São José',
    data: '19 de março',
    descricao: 'Esposo da Virgem Maria, pai adotivo de Jesus',
    historia: 'José, o carpinteiro de Nazaré, descendente da casa de Davi. Homem justo escolhido por Deus para ser esposo de Maria e pai adotivo de Jesus. Protegeu a Sagrada Família na fuga para o Egito. Patrono da Igreja Universal.',
    imagem: 'https://upload.wikimedia.org/wikipedia/commons/8/8b/Saint_Joseph_and_the_Christ_Child.jpg'
  },
  'sao-francisco-de-assis': {
    nome: 'São Francisco de Assis',
    data: '4 de outubro',
    descricao: 'Fundador da Ordem Franciscana',
    historia: 'Giovanni di Pietro di Bernardone (1181-1226) nasceu em Assis, Itália. Filho de comerciante rico, renunciou à riqueza para viver na pobreza evangélica. Fundou a Ordem dos Frades Menores (Franciscanos). Recebeu os estigmas em 1224. Conhecido pelo amor à natureza.',
    imagem: 'https://upload.wikimedia.org/wikipedia/commons/1/1e/Francesco_d%27Assisi_-_Cimabue.jpg'
  },
  'santo-antonio-de-padua': {
    nome: 'Santo Antônio de Pádua',
    data: '13 de junho',
    descricao: 'Doutor da Igreja, franciscano português',
    historia: 'Fernando de Bulhões (1195-1231) nasceu em Lisboa. Ingressou nos agostinianos, depois tornou-se franciscano, adotando o nome Antônio. Grande pregador e teólogo, chamado "Martelo dos Hereges". Declarado Doutor da Igreja em 1946.',
    imagem: 'https://upload.wikimedia.org/wikipedia/commons/9/9c/Saint_Anthony_of_Padua.jpg'
  },
  'carlo-acutis': {
    nome: 'Carlo Acutis',
    data: '12 de outubro',
    descricao: 'Adolescente italiano, padroeiro da internet',
    historia: 'Carlo Acutis (1991-2006) nasceu em Londres e cresceu em Milão. Desde criança demonstrou profunda fé e devoção eucarística. Criou um catálogo online de milagres eucarísticos. Morreu de leucemia aos 15 anos. Foi beatificado em 2020.',
    imagem: 'https://upload.wikimedia.org/wikipedia/commons/5/5d/Carlo_Acutis.jpg'
  }
};

// ===== MAPEAMENTO DE NOMES PARA BUSCA =====
const NAME_MAP = {
  'nossa senhora de fatima': 'nossa-senhora-de-fatima',
  'são josé': 'sao-jose',
  'sao jose': 'sao-jose',
  'são francisco de assis': 'sao-francisco-de-assis',
  'sao francisco de assis': 'sao-francisco-de-assis',
  'santo antônio de pádua': 'santo-antonio-de-padua',
  'santo antonio de padua': 'santo-antonio-de-padua',
  'santo antônio': 'santo-antonio-de-padua',
  'santo antonio': 'santo-antonio-de-padua',
  'carlo acutis': 'carlo-acutis'
};

// ===== ROTAS =====

// Rota: Santo do dia
router.get('/today', (req, res) => {
  try {
    const hoje = new Date();
    const dia = hoje.getDate();
    const mes = hoje.getMonth() + 1;
    const key = `${dia}-${mes}`;
    
    const santo = SANTOS_DATABASE[key];
    
    if (santo) {
      console.log(`✅ Santo do dia encontrado: ${santo.nome}`);
      res.json({
        success: true,
        ...santo
      });
    } else {
      console.log(`⚠️ Nenhum santo cadastrado para ${dia}/${mes}`);
      res.json({
        success: true,
        nome: 'Santos do Dia',
        data: hoje.toLocaleDateString('pt-BR'),
        descricao: 'Celebração dos santos da Igreja Católica',
        historia: 'A Igreja celebra hoje a memória dos santos que nos inspiram na fé.',
        imagem: ''
      });
    }
  } catch (error) {
    console.error('❌ Erro ao buscar santo do dia:', error);
    res.status(500).json({
      success: false,
      message: 'Erro ao buscar santo do dia',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// Rota: Buscar santo por nome
router.get('/search', (req, res) => {
  try {
    const nome = req.query.nome;
    
    if (!nome) {
      return res.status(400).json({
        success: false,
        message: 'Parâmetro "nome" é obrigatório'
      });
    }
    
    const normalized = nome.toLowerCase().trim();
    console.log(`🔍 Buscando santo: "${normalized}"`);
    
    // Busca direta
    let santo = SANTOS_DATABASE[normalized] || SANTOS_DATABASE[NAME_MAP[normalized]];
    
    // Busca parcial
    if (!santo) {
      const entries = Object.entries(SANTOS_DATABASE);
      const found = entries.find(([key, data]) => 
        data.nome.toLowerCase().includes(normalized) || 
        normalized.includes(data.nome.toLowerCase())
      );
      
      if (found) {
        santo = found[1];
      }
    }
    
    if (santo) {
      console.log(`✅ Santo encontrado: ${santo.nome}`);
      res.json({
        success: true,
        ...santo
      });
    } else {
      console.log(`⚠️ Santo não encontrado: "${nome}"`);
      res.status(404).json({
        success: false,
        message: `Santo "${nome}" não encontrado`
      });
    }
  } catch (error) {
    console.error('❌ Erro na busca de santo:', error);
    res.status(500).json({
      success: false,
      message: 'Erro ao buscar santo',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// Rota: Buscar santo por data
router.get('/date', (req, res) => {
  try {
    const { dia, mes } = req.query;
    
    if (!dia || !mes) {
      return res.status(400).json({
        success: false,
        message: 'Parâmetros "dia" e "mes" são obrigatórios'
      });
    }
    
    const key = `${dia}-${mes}`;
    const santo = SANTOS_DATABASE[key];
    
    if (santo) {
      console.log(`✅ Santo encontrado para ${dia}/${mes}: ${santo.nome}`);
      res.json({
        success: true,
        ...santo
      });
    } else {
      console.log(`⚠️ Nenhum santo cadastrado para ${dia}/${mes}`);
      res.status(404).json({
        success: false,
        message: `Nenhum santo encontrado para ${dia}/${mes}`
      });
    }
  } catch (error) {
    console.error('❌ Erro ao buscar santo por data:', error);
    res.status(500).json({
      success: false,
      message: 'Erro ao buscar santo',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// Rota: Listar todos os santos
router.get('/', (req, res) => {
  try {
    const santos = Object.values(SANTOS_DATABASE);
    res.json({
      success: true,
      count: santos.length,
      santos: santos
    });
  } catch (error) {
    console.error('❌ Erro ao listar santos:', error);
    res.status(500).json({
      success: false,
      message: 'Erro ao listar santos',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// Rota: Status
router.get('/status', (req, res) => {
  res.json({
    success: true,
    service: 'Saints API',
    status: 'active',
    santos_cadastrados: Object.keys(SANTOS_DATABASE).length,
    timestamp: new Date().toISOString()
  });
});

export default router;