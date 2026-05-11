// backend/worker/src/routes/public/liturgia.js
// Fonte primária: Railway API | Fonte secundária: Paulus HTML

// ─── Cache por data (Map com TTL) ────────────────────────────────────────────
const _cache = new Map();
const CACHE_DURATION = 60 * 60 * 1000; // 1 hora

function getCache(key) {
  const entry = _cache.get(key);
  if (!entry) return null;
  if (Date.now() - entry.time > CACHE_DURATION) { _cache.delete(key); return null; }
  return entry.data;
}
function setCache(key, data) {
  _cache.set(key, { data, time: Date.now() });
}

// ─── Helpers de data ──────────────────────────────────────────────────────────
function normalizarData(dataParam) {
  if (!dataParam) return new Date().toISOString().split('T')[0];
  if (/^\d{4}-\d{2}-\d{2}$/.test(dataParam)) return dataParam;
  if (/^\d{2}\/\d{2}\/\d{4}$/.test(dataParam)) {
    const [d, m, y] = dataParam.split('/');
    return `${y}-${m}-${d}`;
  }
  return new Date().toISOString().split('T')[0];
}
function formatarParaRailway(dataISO) {
  const [y, m, d] = dataISO.split('-');
  return `${d}/${m}/${y}`;
}
function isHoje(dataISO) {
  return dataISO === new Date().toISOString().split('T')[0];
}

// ─── Helpers de texto ─────────────────────────────────────────────────────────
function stripHtml(s = '') {
  return s
    .replace(/<br\s*\/?>/gi, '\n')
    .replace(/<\/p>/gi, '\n')
    .replace(/<[^>]+>/g, '')
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#8220;|&#8221;/g, '"')
    .replace(/&#8216;|&#8217;/g, "'")
    .replace(/&#8211;/g, '–')
    .replace(/&#8212;/g, '—')
    .replace(/\r\n/g, '\n')
    .replace(/\n{3,}/g, '\n\n')
    .trim();
}

function extrairCorDoTexto(texto = '') {
  if (!texto) return null;
  const t = texto.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
  if (t.includes('branco') || t.includes('dourado') || t.includes('bco')) return 'Branco';
  if (t.includes('roxo') || t.includes('violeta') || t.includes('lilas'))  return 'Roxo';
  if (t.includes('vermelho') || t.includes('rubro'))                        return 'Vermelho';
  if (t.includes('rosa'))                                                    return 'Rosa';
  if (t.includes('verde'))                                                   return 'Verde';
  return null;
}

function inferirCorPorPeriodo(texto = '') {
  const t = texto.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
  if (/pasc|oitava|natal|epifania|ressurreic|corpus|ascensao|batismo|transfig|todos os santos/.test(t)) return 'Branco';
  if (/quaresma|advento/.test(t))   return 'Roxo';
  if (/pentecostes|martir|apostol|sao pedro|sao paulo|sao joao/.test(t)) return 'Vermelho';
  if (/rosa/.test(t))               return 'Rosa';
  return null;
}

// ─── Normaliza campo que pode ser string OU objeto (novo formato Railway) ─────
function normalizarCampoLeitura(campo) {
  if (!campo) return '';

  // Já é string — formato antigo
  if (typeof campo === 'string') {
    if (campo === 'Não há segunda leitura hoje!' || campo === 'null') return '';
    return campo.trim();
  }

  // É objeto — novo formato Railway: { referencia, titulo, texto }
  if (typeof campo === 'object') {
    const partes = [];
    if (campo.referencia) partes.push(campo.referencia.trim());
    if (campo.titulo)     partes.push(campo.titulo.trim());
    if (campo.texto)      partes.push(campo.texto.trim());
    return partes.join('\n\n');
  }

  return '';
}

// ─── Normaliza salmo — refrão SEM prefixo "R.:" para o frontend extrair corretamente
function normalizarSalmo(campo) {
  if (!campo) return '';

  if (typeof campo === 'string') return campo.trim();

  if (typeof campo === 'object') {
    const partes = [];
    if (campo.referencia) partes.push(campo.referencia.trim());
    // ✅ SEM "R.: " — o frontend (extrairRefrao) encontra a linha diretamente
    if (campo.refrao)     partes.push(campo.refrao.trim());
    if (campo.texto)      partes.push(campo.texto.trim());
    return partes.join('\n\n');
  }

  return '';
}

// ─── PARSER DO HTML DA PAULUS ─────────────────────────────────────────────────
function parsearHtmlPaulus(html) {
  const blocoMatch = html.match(/(<strong>.*?OITAVA|<strong>[A-ZÁÉÍÓÚ\s]+<\/strong>[\s\S]*?)(?:Liturgia Diária\s*<\/h|<div[^>]+class="[^"]*sidebar)/i);
  const bloco = blocoMatch ? blocoMatch[0] : html;

  const tituloMatch = bloco.match(/<strong>([A-ZÁÉÍÓÚÀÃÕÂÊÎÔÛÇ\s\d°ºª–\-]+)<\/strong>/i);
  const tituloLiturgico = tituloMatch ? stripHtml(tituloMatch[1]).trim() : '';

  const corMatch = html.match(/\((branco|roxo|vermelho|rosa|verde|dourado|violeta|lilas)/i);
  let cor = corMatch ? extrairCorDoTexto(corMatch[1]) : null;
  if (!cor) cor = inferirCorPorPeriodo(tituloLiturgico + ' ' + html.substring(0, 2000));
  cor = cor || 'Verde';

  const notaMatch = html.match(/\(([^)]{10,200})\)/);
  const nota = notaMatch ? notaMatch[1].trim() : '';

  let antifona = '';
  const antifonaMatch = html.match(/\([^)]+\)\s*<\/p>\s*<p[^>]*>([\s\S]*?)<\/p>/i);
  if (antifonaMatch) antifona = stripHtml(antifonaMatch[1]).trim();

  let introducao = '';
  const introMatch = html.match(/<(?:em|i)[^>]*>([\s\S]{20,600}?)<\/(?:em|i)>/i);
  if (introMatch) introducao = stripHtml(introMatch[1]).trim();

  const primeiraRef   = extrairRef(html, 'Primeira Leitura');
  const primeiraTexto = extrairBlocoLeitura(html, 'Primeira Leitura', ['Salmo Responsorial', 'Segunda Leitura', 'Evangelho']);

  const segundaRef   = extrairRef(html, 'Segunda Leitura');
  const segundaTexto = extrairBlocoLeitura(html, 'Segunda Leitura', ['Salmo Responsorial', 'Evangelho']);

  const salmoRef   = extrairRef(html, 'Salmo Responsorial');
  const salmoTexto = extrairBlocoLeitura(html, 'Salmo Responsorial', ['Segunda Leitura', 'Evangelho']);

  const evangelhoRef   = extrairRef(html, 'Evangelho');
  const evangelhoTexto = extrairBlocoLeitura(html, 'Evangelho', ['Reflexão', 'Reflexao']);

  const reflexaoTexto = extrairBlocoLeitura(html, 'Reflex', ['Dia a dia', 'navigation', 'post-navigation', '[9 –', '[10 –', '[11 –']);

  return {
    cor,
    tituloLiturgico,
    nota,
    antifona,
    introducao,
    primeiraLeitura: montarLeitura(primeiraRef, primeiraTexto),
    segundaLeitura:  montarLeitura(segundaRef,  segundaTexto),
    salmo:           montarLeitura(salmoRef,    salmoTexto),
    evangelho:       montarLeitura(evangelhoRef, evangelhoTexto),
    reflexao:        reflexaoTexto,
  };
}

function extrairRef(html, secao) {
  const re = new RegExp(secao + '[:\\s]*<strong>([^<]+)<\\/strong>', 'i');
  const m = html.match(re);
  return m ? stripHtml(m[1]).trim() : '';
}

function extrairBlocoLeitura(html, inicio, fins) {
  const reInicio = new RegExp(inicio + '[^<]*(?:<[^>]+>)*[^<]*<\\/(?:strong|p|h[1-6])>', 'i');
  const mInicio = html.match(reInicio);
  if (!mInicio || mInicio.index === undefined) return '';

  let sub = html.substring(mInicio.index + mInicio[0].length);

  let fimIdx = sub.length;
  for (const fim of fins) {
    const reFim = new RegExp(fim, 'i');
    const mFim = sub.match(reFim);
    if (mFim && mFim.index !== undefined && mFim.index < fimIdx) {
      fimIdx = mFim.index;
    }
  }

  const bloco = sub.substring(0, fimIdx);
  return stripHtml(bloco).replace(/^\s*\n/, '').trim();
}

function montarLeitura(ref, texto) {
  if (!texto && !ref) return '';
  if (!texto) return ref;
  if (ref && !texto.includes(ref)) return `${ref}\n\n${texto}`;
  return texto;
}

// ─── BUSCA NA PAULUS (HTML) ───────────────────────────────────────────────────
async function buscarNaPaulus(dataISO) {
  try {
    console.log('🌿 Buscando na Paulus para data:', dataISO);

    const paulusUrl = 'https://www.paulus.com.br/portal/liturgia-diaria/';

    const res = await fetch(paulusUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
        'Accept': 'text/html,application/xhtml+xml',
        'Accept-Language': 'pt-BR,pt;q=0.9',
      },
      signal: AbortSignal.timeout(8000),
    });

    if (!res.ok) {
      console.warn('🌿 Paulus retornou status:', res.status);
      return null;
    }

    const html = await res.text();
    console.log('🌿 HTML da Paulus recebido, tamanho:', html.length);

    const dados = parsearHtmlPaulus(html);
    console.log('🌿 Dados extraídos da Paulus:', {
      cor: dados.cor,
      tituloLiturgico: dados.tituloLiturgico,
      temPrimeira: !!dados.primeiraLeitura,
      temSalmo: !!dados.salmo,
      temEvangelho: !!dados.evangelho,
    });

    return dados;
  } catch (err) {
    console.error('🌿 Erro ao buscar na Paulus:', err.message);
    return null;
  }
}

// ─── BUSCA NO RAILWAY ─────────────────────────────────────────────────────────
async function buscarNoRailway(dataISO) {
  try {
    const dataRailway = formatarParaRailway(dataISO);
    const url = `https://liturgia.up.railway.app/?data=${dataRailway}`;
    console.log('🚂 Buscando no Railway:', url);

    const response = await fetch(url, {
      headers: { 'User-Agent': 'Mozilla/5.0', 'Accept': 'application/json' },
      signal: AbortSignal.timeout(8000),
    });

    if (!response.ok) {
      console.warn('🚂 Railway status:', response.status);
      return null;
    }

    const json = await response.json();
    console.log('🚂 Railway respondeu:', JSON.stringify(json).substring(0, 300));
    return json;
  } catch (err) {
    console.error('🚂 Erro Railway:', err.message);
    return null;
  }
}

// ─── MONTA RESULTADO DO RAILWAY ───────────────────────────────────────────────
function montarResultadoRailway(dataISO, json) {
  // ✅ Cor vinda diretamente do Railway (já correta no novo formato)
  let cor =
    (json.cor && typeof json.cor === 'string' && json.cor.trim()) ||
    extrairCorDoTexto(json.liturgia) ||
    inferirCorPorPeriodo([json.liturgia, json.semana, json.dia].filter(Boolean).join(' ')) ||
    'Verde';

  // ✅ Antífona de entrada — novo campo antifonas.entrada tem prioridade
  const antifona =
    (json.antifonas?.entrada)  ||
    (json.antifona)            ||
    '';

  // ✅ Segunda leitura — ignora string de "não há"
  const segundaLeituraRaw = normalizarCampoLeitura(json.segundaLeitura);
  const temSegunda = segundaLeituraRaw.length > 10;

  return {
    success: true,
    data: dataISO,
    liturgia: {
      titulo:          json.liturgia || `Liturgia do Dia - ${dataISO}`,
      cor,
      semana:          json.semana   || json.liturgia || '',
      tituloLiturgico: json.liturgia || '',
      antifona,
      introducao:      json.introducao || '',
      primeiraLeitura: normalizarCampoLeitura(json.primeiraLeitura),
      segundaLeitura:  temSegunda ? segundaLeituraRaw : '',
      salmo:           normalizarSalmo(json.salmo),
      evangelho:       normalizarCampoLeitura(json.evangelho),
      reflexao:        json.reflexao || json.meditacao || '',
    },
    fonte: 'railway',
  };
}

// ─── MONTA RESULTADO DA PAULUS ────────────────────────────────────────────────
function montarResultadoPaulus(dataISO, dados) {
  return {
    success: true,
    data: dataISO,
    liturgia: {
      titulo:          dados.tituloLiturgico || `Liturgia do Dia - ${dataISO}`,
      cor:             dados.cor,
      semana:          dados.tituloLiturgico || '',
      tituloLiturgico: dados.tituloLiturgico || '',
      antifona:        dados.antifona || '',
      introducao:      dados.introducao || '',
      primeiraLeitura: dados.primeiraLeitura || '',
      segundaLeitura:  dados.segundaLeitura  || '',
      salmo:           dados.salmo           || '',
      evangelho:       dados.evangelho       || '',
      reflexao:        dados.reflexao        || '',
    },
    fonte: 'paulus',
  };
}

// ─── FUNÇÃO PRINCIPAL ─────────────────────────────────────────────────────────
export async function buscarLiturgia(dataParam = null) {
  const dataISO = normalizarData(dataParam);
  console.log('📅 buscarLiturgia:', dataISO);

  const cached = getCache(dataISO);
  if (cached) {
    console.log('✅ Cache hit:', dataISO);
    return cached;
  }

  let result = null;

  // ── 1º) Railway SEMPRE primeiro
  console.log('🚂 Tentando Railway primeiro...');
  const jsonRailway = await buscarNoRailway(dataISO);

  if (jsonRailway && (jsonRailway.evangelho || jsonRailway.primeiraLeitura)) {
    result = montarResultadoRailway(dataISO, jsonRailway);
    console.log('✅ Resultado montado do Railway, cor:', result.liturgia.cor);

    // Complementa cor com Paulus APENAS se Railway retornou 'Verde'
    if (result.liturgia.cor === 'Verde') {
      console.log('🎨 Cor incerta — tentando complementar com Paulus...');
      const dadosPaulus = await buscarNaPaulus(dataISO);
      if (dadosPaulus?.cor && dadosPaulus.cor !== 'Verde') {
        result.liturgia.cor = dadosPaulus.cor;
        console.log('🎨 Cor complementada pela Paulus:', dadosPaulus.cor);
      }
    }
  }

  // ── 2º) Paulus como fallback completo se Railway falhou
  if (!result) {
    console.log('🌿 Railway falhou — tentando Paulus como fallback...');
    const dadosPaulus = await buscarNaPaulus(dataISO);
    if (dadosPaulus?.evangelho) {
      result = montarResultadoPaulus(dataISO, dadosPaulus);
      console.log('✅ Resultado montado da Paulus');
    }
  }

  // ── 3º) Mock final
  if (!result) {
    console.warn('⚠️ Todas as fontes falharam — usando mock');
    result = getMockLiturgia(dataISO);
  }

  setCache(dataISO, result);
  return result;
}

// ─── MOCK ─────────────────────────────────────────────────────────────────────
function getMockLiturgia(dataISO) {
  const hoje = new Date(dataISO + 'T12:00:00');
  const diaSemana = hoje.toLocaleDateString('pt-BR', { weekday: 'long' });
  const dataFormatada = hoje.toLocaleDateString('pt-BR');

  return {
    success: true,
    data: dataISO,
    liturgia: {
      titulo:          `Liturgia do ${diaSemana} - ${dataFormatada}`,
      cor:             'Verde',
      semana:          'Tempo Comum',
      tituloLiturgico: '',
      antifona:        '',
      introducao:      '',
      primeiraLeitura: 'Leitura não disponível no momento.',
      segundaLeitura:  '',
      salmo:           'Salmo não disponível.',
      evangelho:       'Evangelho não disponível.',
      reflexao:        '',
    },
    fonte: 'mock',
  };
}