// src/routes/public/biblia.js
import { jsonResponse } from '../../utils/responses.js';

const BIBLIA_BASE_URL = 'https://raw.githubusercontent.com/thiagobodruk/biblia/master/json/';
const BIBLIA_ARQUIVOS = {
  'gn':'01_genesis.json','ex':'02_exodo.json','lv':'03_levitico.json','nm':'04_numeros.json','dt':'05_deuteronomio.json','js':'06_josue.json','jz':'07_juizes.json','rt':'08_rute.json','1sm':'09_1_samuel.json','2sm':'10_2_samuel.json','1rs':'11_1_reis.json','2rs':'12_2_reis.json','1cr':'13_1_cronicas.json','2cr':'14_2_cronicas.json','ed':'15_esdras.json','ne':'16_neemias.json','et':'17_ester.json','jó':'18_jo.json','sl':'19_salmos.json','pv':'20_proverbios.json','ec':'21_eclesiastes.json','ct':'22_canticos.json','is':'23_isaias.json','jr':'24_jeremias.json','lm':'25_lamentacoes.json','ez':'26_ezequiel.json','dn':'27_daniel.json','os':'28_oseias.json','jl':'29_joel.json','am':'30_amos.json','ob':'31_abdias.json','jn':'32_jonas.json','mq':'33_miqueias.json','na':'34_naum.json','hc':'35_habacuque.json','sf':'36_sofonias.json','ag':'37_ageu.json','zc':'38_zacarias.json','ml':'39_malaquias.json','mt':'40_mateus.json','mc':'41_marcos.json','lc':'42_lucas.json','jo':'43_joao.json','at':'44_atos.json','rm':'45_romanos.json','1co':'46_1_corintios.json','2co':'47_2_corintios.json','gl':'48_galatas.json','ef':'49_efesios.json','fp':'50_filipenses.json','cl':'51_colossenses.json','1ts':'52_1_tessalonicenses.json','2ts':'53_2_tessalonicenses.json','1tm':'54_1_timoteo.json','2tm':'55_2_timoteo.json','tt':'56_tito.json','fm':'57_filemon.json','hb':'58_hebreus.json','tg':'59_tiago.json','1pe':'60_1_pedro.json','2pe':'61_2_pedro.json','1jo':'62_1_joao.json','2jo':'63_2_joao.json','3jo':'64_3_joao.json','jd':'65_judas.json','ap':'66_apocalipse.json'
};

export async function handleBiblia(request, env) {
  const url = new URL(request.url);
  const abbrev = url.searchParams.get('livro')?.toLowerCase();
  const cap = parseInt(url.searchParams.get('capitulo') || '1');
  if (!abbrev) return jsonResponse({ success: false, error: 'Parametro livro obrigatorio' }, 400);
  const arquivo = BIBLIA_ARQUIVOS[abbrev];
  if (!arquivo) return jsonResponse({ success: false, error: `Livro nao encontrado: ${abbrev}` }, 404);
  try {
    const cacheKey = `biblia:${abbrev}:${cap}`;
    if (env.KV_FILES) {
      const cached = await env.KV_FILES.get(cacheKey, 'json');
      if (cached) return jsonResponse({ ...cached, cached: true });
    }
    const res = await fetch(`${BIBLIA_BASE_URL}${arquivo}`, { headers: { 'User-Agent': 'SantuarioFatima/1.0' } });
    if (!res.ok) throw new Error(`GitHub ${res.status}`);
    const livro = await res.json();
    const chapters = livro.chapters || [];
    const capIdx = cap - 1;
    if (capIdx < 0 || capIdx >= chapters.length) return jsonResponse({ success: false, error: `Capitulo ${cap} inexistente. Total: ${chapters.length}` }, 404);
    const verses = chapters[capIdx].map((t, i) => ({ number: i + 1, text: t }));
    const result = { success: true, livro: livro.name || abbrev, abbrev, capitulo: cap, totalCapitulos: chapters.length, verses };
    if (env.KV_FILES) await env.KV_FILES.put(cacheKey, JSON.stringify(result), { expirationTtl: 604800 });
    return jsonResponse(result);
  } catch(e) { 
    console.error('Erro biblia:', e);
    return jsonResponse({ success: false, error: 'Erro ao carregar capitulo. Tente novamente.' }, 500); 
  }
}