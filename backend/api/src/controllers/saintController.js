const axios = require('axios');

const getSaintData = async (query) => {
  try {
    // 1. Pesquisa na Wikipedia pelo termo
    const wikiUrl = `https://pt.wikipedia.org/api/rest_v1/page/summary/${encodeURIComponent(query)}`;
    const response = await axios.get(wikiUrl);
    
    return {
      nome: response.data.title,
      descricao: response.data.description || "Santo da Igreja Católica",
      historia: response.data.extract,
      imagem: response.data.originalimage ? response.data.originalimage.source : null,
      fonte: "Wikipedia"
    };
  } catch (error) {
    console.error("Erro ao buscar santo:", error);
    return null;
  }
};

// Exemplo de rota para o Santo do Dia
// No backend, podes ter um mapeamento de Datas -> Nomes de Santos