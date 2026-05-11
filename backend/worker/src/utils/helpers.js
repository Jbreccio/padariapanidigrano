import { corsHeaders } from './cors.js';

export function formatTimeAgo(isoDate) {
  const diff = Date.now() - new Date(isoDate).getTime();
  const m = Math.floor(diff / 60000);
  if (m < 1) return 'agora';
  if (m < 60) return `há ${m} min`;
  const h = Math.floor(m / 60);
  if (h < 24) return `há ${h}h`;
  return `há ${Math.floor(h / 24)}d`;
}

export function cleanText(text) {
  if (!text) return text;
  return text
    .replace(/<!\[CDATA\[/g, '').replace(/\]\]>/g, '')
    .replace(/<[^>]+>/g, '').replace(/&[a-z]+;/g, ' ')
    .replace(/\s+/g, ' ').trim();
}

export function cleanYouTubeTitle(title) {
  if (!title) return title;
  return title
    .replace(/&quot;/g,'"').replace(/&#39;/g,"'").replace(/&amp;/g,'&')
    .replace(/&lt;/g,'<').replace(/&gt;/g,'>').replace(/&nbsp;/g,' ')
    .replace(/&aacute;/g,'a').replace(/&eacute;/g,'e').replace(/&iacute;/g,'i')
    .replace(/&oacute;/g,'o').replace(/&uacute;/g,'u').replace(/&atilde;/g,'a')
    .replace(/&otilde;/g,'o').replace(/&ccedil;/g,'c').replace(/&acirc;/g,'a')
    .replace(/&ecirc;/g,'e').replace(/&ocirc;/g,'o').trim();
}

export function cleanVideoId(id) {
  if (!id) return id;
  return id.split('&')[0].trim();
}

export function getHorarioSecretariaAviso() {
  const hoje = new Date();
  const diaSemana = hoje.getDay();
  const horaAtual = hoje.getHours();
  const feriados = ["01-01","25-01","21-04","01-05","09-07","07-09","12-10","02-11","15-11","20-11","25-12"];
  const hojeStr = `${String(hoje.getDate()).padStart(2,'0')}-${String(hoje.getMonth()+1).padStart(2,'0')}`;
  if (diaSemana === 1 || diaSemana === 0 || feriados.includes(hojeStr)) {
    return { ativo: true, mensagem: "A Secretaria Paroquial nao funciona as segundas-feiras, domingos e feriados." };
  }
  if (horaAtual < 9 || horaAtual >= 17) {
    return { ativo: true, mensagem: "Fora do horario de funcionamento (9h as 17h)." };
  }
  return { ativo: false };
}

export function extrairAnoWorker(periodo) {
  if (!periodo) return new Date().getFullYear();
  const match = periodo.match(/\b(19|20)\d{2}\b/);
  return match ? parseInt(match[0]) : new Date().getFullYear();
}

export function ordenarMomentosWorker(momentos) {
  if (!Array.isArray(momentos)) return momentos || [];
  return [...momentos].sort((a, b) => {
    const anoA = extrairAnoWorker(a.periodo);
    const anoB = extrairAnoWorker(b.periodo);
    if (anoA !== anoB) return anoB - anoA;
    return (parseInt(b.id) || 0) - (parseInt(a.id) || 0);
  });
}

export { corsHeaders };

export function jsonResponse(data, status = 200, additionalHeaders = {}) {
  return new Response(JSON.stringify(data, null, 2), {
    status,
    headers: {
      "Content-Type": "application/json; charset=utf-8",
      ...corsHeaders,        // ← objeto, sem parênteses
      ...additionalHeaders
    },
  });
}

export function errorResponse(message, status = 400) {
  return jsonResponse({ success: false, error: message }, status);
}