// backend/src/utils/htmlParser.js - VERSÃO MELHORADA
export function extractSaintInfo(html, dia, mes) {
  try {
    console.log(`🔍 Parsing HTML para ${dia}/${mes}...`);
    
    // Extrair título (nome do santo) - método mais robusto
    let titulo = '';
    
    // Tentar encontrar o título da página
    const titleMatch = html.match(/<title>([^<]+)<\/title>/i);
    if (titleMatch) {
      titulo = titleMatch[1]
        .replace(' - Vatican News', '')
        .replace(' | Vatican News', '')
        .replace('Santo do Dia - ', '')
        .trim();
    }
    
    // Se o título for genérico, tentar encontrar no conteúdo
    if (titulo.includes('Santo do Dia') || titulo.length < 5) {
      // Procurar por h1 ou h2 com nome do santo
      const h1Match = html.match(/<h1[^>]*>([^<]+)<\/h1>/i) || 
                     html.match(/<h2[^>]*>([^<]+)<\/h2>/i);
      
      if (h1Match) {
        titulo = h1Match[1].trim();
      }
    }
    
    // Fallback: usar data
    if (!titulo || titulo.length < 3) {
      const meses = [
        'janeiro', 'fevereiro', 'março', 'abril', 'maio', 'junho',
        'julho', 'agosto', 'setembro', 'outubro', 'novembro', 'dezembro'
      ];
      titulo = `Santo do dia ${parseInt(dia)} de ${meses[parseInt(mes) - 1]}`;
    }
    
    // Extrair conteúdo
    let conteudo = '';
    
    // Procurar por div de conteúdo
    const contentRegex = /<div[^>]*class="[^"]*(article-content|article-body|content)[^"]*"[^>]*>([\s\S]*?)<\/div>/i;
    const contentMatch = html.match(contentRegex);
    
    if (contentMatch) {
      conteudo = cleanHtml(contentMatch[2]);
    } else {
      // Fallback: pegar o primeiro artigo
      const articleMatch = html.match(/<article[^>]*>([\s\S]*?)<\/article>/i);
      if (articleMatch) {
        conteudo = cleanHtml(articleMatch[1]);
      } else {
        // Último recurso: pegar tudo entre body tags
        const bodyMatch = html.match(/<body[^>]*>([\s\S]*?)<\/body>/i);
        if (bodyMatch) {
          conteudo = cleanHtml(bodyMatch[1]);
        }
      }
    }
    
    // Limitar e garantir conteúdo
    if (conteudo.length > 2000) {
      conteudo = conteudo.substring(0, 2000) + '...';
    }
    
    if (!conteudo || conteudo.length < 100) {
      conteudo = `O santo celebrado em ${parseInt(dia)} de ${getMonthName(parseInt(mes))} é venerado pela Igreja Católica. Para informações mais detalhadas, visite o Vatican News.`;
    }
    
    // Extrair imagem
    let imagem = '';
    
    // Procurar por imagem principal
    const imgRegex = /<img[^>]*src="([^"]*)"[^>]*(class="[^"]*article-image[^"]*"|itemprop="image")[^>]*>/i;
    const imgMatch = html.match(imgRegex);
    
    if (imgMatch && imgMatch[1]) {
      let src = imgMatch[1];
      if (!src.startsWith('http')) {
        src = src.startsWith('//') ? `https:${src}` : `https://www.vaticannews.va${src}`;
      }
      imagem = src;
    } else {
      // Procurar por qualquer imagem relevante
      const allImgs = html.match(/<img[^>]*src="([^"]*)"[^>]*>/gi) || [];
      for (const imgTag of allImgs) {
        const srcMatch = imgTag.match(/src="([^"]*)"/);
        if (srcMatch && srcMatch[1]) {
          const src = srcMatch[1];
          if (!src.includes('logo') && !src.includes('icon') && !src.includes('svg')) {
            imagem = src.startsWith('http') ? src : `https://www.vaticannews.va${src}`;
            break;
          }
        }
      }
    }
    
    // Fallback para imagem
    if (!imagem) {
      imagem = getDefaultImage(titulo);
    }
    
    // Formatar data
    const dataFormatada = `${parseInt(dia)} de ${getMonthName(parseInt(mes))}`;
    
    console.log(`✅ Parse concluído: ${titulo.substring(0, 50)}...`);
    
    return {
      nome: titulo,
      descricao: conteudo.substring(0, 150) + '...',
      historia: conteudo,
      imagem: imagem,
      data: dataFormatada,
      fonte: 'Vatican News',
      dia: parseInt(dia),
      mes: parseInt(mes),
      fetchedAt: new Date().toISOString()
    };
    
  } catch (error) {
    console.error('❌ Erro no parsing HTML:', error.message);
    throw error;
  }
}

function cleanHtml(html) {
  if (!html) return '';
  
  return html
    .replace(/<script[\s\S]*?>[\s\S]*?<\/script>/gi, ' ')  // Remove scripts
    .replace(/<style[\s\S]*?>[\s\S]*?<\/style>/gi, ' ')    // Remove styles
    .replace(/<!--[\s\S]*?-->/g, ' ')                      // Remove comentários
    .replace(/<[^>]*>/g, ' ')                              // Remove tags HTML
    .replace(/\s+/g, ' ')                                  // Normaliza espaços
    .replace(/&nbsp;/g, ' ')                               // Remove &nbsp;
    .replace(/&amp;/g, '&')                                // Decodifica &
    .replace(/&lt;/g, '<')                                 // Decodifica <
    .replace(/&gt;/g, '>')                                 // Decodifica >
    .replace(/&quot;/g, '"')                               // Decodifica "
    .replace(/&#39;/g, "'")                                // Decodifica '
    .replace(/[\r\n]+/g, '\n')                             // Normaliza quebras
    .trim();
}

function getMonthName(mes) {
  const meses = [
    'janeiro', 'fevereiro', 'março', 'abril', 'maio', 'junho',
    'julho', 'agosto', 'setembro', 'outubro', 'novembro', 'dezembro'
  ];
  return meses[mes - 1] || '';
}

function getDefaultImage(saintName) {
  const encodedName = encodeURIComponent(saintName.substring(0, 30));
  return `https://via.placeholder.com/600x400/4f46e5/ffffff?text=${encodedName}`;
}