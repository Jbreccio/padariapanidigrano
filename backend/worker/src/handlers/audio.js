import { jsonResponse } from '../utils/responses.js';
import { corsHeaders } from '../utils/cors.js';
import { CONFIG, R2_PUBLIC_URL, VOZES_XTTS, IMAGEM_NOSSA_SENHORA } from '../config/constants.js';

async function sendVoiceContributionNotification(env, data) {
  try {
    if (!env.RESEND_API_KEY) return;
    const currentDate = new Date().toLocaleDateString('pt-BR');
    const currentTime = new Date().toLocaleTimeString('pt-BR');
    const html = `<!DOCTYPE html>
<html>
<head><meta charset="UTF-8"><title>Nova Contribuição de Voz - Bíblia</title>
<style>
body{font-family:'Georgia','Times New Roman',serif;background:#f5f5f5;margin:0;padding:20px;}
.container{max-width:600px;margin:0 auto;background:white;border-radius:16px;overflow:hidden;box-shadow:0 10px 30px rgba(0,0,0,0.1);}
.header{background:#0b3b5c;color:white;padding:0;text-align:center;}
.header-image{width:100%;height:auto;max-height:250px;object-fit:cover;display:block;border-bottom:3px solid #b8860b;}
.header-title{padding:20px;background:#0b3b5c;}
.header-title h1{font-size:24px;margin:0;font-weight:400;}
.header-title p{font-size:15px;margin:8px 0 0;opacity:0.9;font-style:italic;}
.content{padding:30px 25px;}
.contribution-box{background:#f9f9f9;border-left:4px solid #0b3b5c;padding:20px;margin:20px 0;border-radius:4px;}
.footer{background:#f8f9fa;padding:20px;text-align:center;font-size:12px;color:#7f8c8d;border-top:1px solid #e0e0e0;}
.footer strong{color:#0b3b5c;}
p{font-size:15px;margin:8px 0;color:#2c3e50;}
</style></head>
<body>
<div class="container">
  <div class="header">
    <img src="${IMAGEM_NOSSA_SENHORA}" alt="Nossa Senhora de Fátima" class="header-image">
    <div class="header-title">
      <h1>🎙️ Nova Contribuição de Voz</h1>
      <p>Bíblia Sagrada - Voz do Povo</p>
    </div>
  </div>
  <div class="content">
    <p><strong>Contribuinte:</strong> ${data.contribuinte}</p>
    <p><strong>Referência:</strong> ${data.livro.toUpperCase()} ${data.capitulo}:${data.versiculo}</p>
    <p><strong>Texto:</strong> ${data.texto.substring(0, 150)}${data.texto.length > 150 ? '...' : ''}</p>
    <p><strong>Data/Hora:</strong> ${currentDate} às ${currentTime}</p>
    <p><strong>ID da gravação:</strong> ${data.id}</p>
    <div class="contribution-box">
      <h3 style="margin:0 0 10px;color:#0b3b5c;">📖 Versículo:</h3>
      <p style="margin:0;white-space:pre-wrap;font-style:italic;">"${data.texto}"</p>
    </div>
  </div>
  <div class="footer">
    <p><strong>Santuario Nossa Senhora de Fatima</strong></p>
    <p>Rua Darwin, 651 - Santo Amaro, São Paulo - SP</p>
    <p>santuariodefatima.com.br | (11) 5521-0312</p>
  </div>
</div></body></html>`;
    await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${env.RESEND_API_KEY}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ from: 'Santuario de Fatima <noreply@mail.santuariodefatima.com.br>', to: CONFIG.SECRETARIAT_EMAILS, subject: `🎙️ Nova Gravação Bíblica - ${data.livro} ${data.capitulo}:${data.versiculo}`, html })
    });
  } catch (error) {
    console.error('Erro ao enviar email de notificação de voz:', error);
  }
}

export async function handleContribuirVoz(request, env) {
  if (request.method === 'OPTIONS') return new Response(null, { status: 204, headers: corsHeaders() });
  if (request.method !== 'POST') return jsonResponse({ success: false, error: 'Método não permitido' }, 405);
  try {
    const body = await request.json();
    const { audio, mimeType, livro, capitulo, versiculo, texto, apelido } = body;
    if (!audio || !livro || !capitulo || !versiculo || !texto) return jsonResponse({ success: false, error: 'Campos obrigatórios: audio, livro, capitulo, versiculo, texto' }, 400);
    const binaryString = atob(audio);
    const audioBytes = new Uint8Array(binaryString.length);
    for (let i = 0; i < binaryString.length; i++) audioBytes[i] = binaryString.charCodeAt(i);
    const audioBuffer = audioBytes.buffer;
    const id = `${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const dataAtual = new Date().toISOString();
    const nomeContribuinte = apelido?.trim() || 'Anônimo';
    const r2Key = `contribuicoes/${livro}/${capitulo}/${versiculo}/${id}.${mimeType?.split('/')[1] || 'mp4'}`;
    if (env.R2_AUDIO) {
      try {
        await env.R2_AUDIO.put(r2Key, audioBuffer, { httpMetadata: { contentType: mimeType || 'audio/mp4' }, customMetadata: { livro, capitulo: capitulo.toString(), versiculo: versiculo.toString(), texto, contribuinte: nomeContribuinte, data: dataAtual, id } });
      } catch (r2Error) { return jsonResponse({ success: false, error: 'Erro ao salvar gravação no servidor' }, 500); }
    } else { return jsonResponse({ success: false, error: 'Servidor de áudio não configurado' }, 500); }
    if (env.DB) {
      try {
        await env.DB.prepare(`CREATE TABLE IF NOT EXISTS contribuicoes_voz (id TEXT PRIMARY KEY, livro TEXT NOT NULL, capitulo INTEGER NOT NULL, versiculo INTEGER NOT NULL, texto TEXT NOT NULL, contribuinte TEXT, data TEXT NOT NULL, arquivo_path TEXT NOT NULL)`).run();
        await env.DB.prepare(`INSERT INTO contribuicoes_voz (id, livro, capitulo, versiculo, texto, contribuinte, data, arquivo_path) VALUES (?, ?, ?, ?, ?, ?, ?, ?)`).bind(id, livro, capitulo, versiculo, texto, nomeContribuinte, dataAtual, r2Key).run();
      } catch (dbError) { console.error('Erro ao salvar no D1:', dbError); }
    }
    if (env.RESEND_API_KEY) {
      try { await sendVoiceContributionNotification(env, { id, livro, capitulo, versiculo, texto, contribuinte: nomeContribuinte, data: dataAtual }); } catch (emailError) { console.error('Erro ao enviar email de notificação:', emailError); }
    }
    return jsonResponse({ success: true, message: 'Gravação enviada com sucesso! Obrigado por contribuir.', id, data: dataAtual });
  } catch (error) {
    console.error('Erro em handleContribuirVoz:', error);
    return jsonResponse({ success: false, error: 'Erro interno no servidor: ' + error.message }, 500);
  }
}

export async function handleBuscarOuGerarAudio(request, env) {
  if (request.method === 'OPTIONS') return new Response(null, { status: 204, headers: corsHeaders() });
  if (request.method !== 'POST') return jsonResponse({ success: false, error: 'Método não permitido' }, 405);
  try {
    const body = await request.json();
    const { texto, livro, capitulo, versiculo, vozId } = body;
    if (!texto || !livro || !capitulo || !versiculo || !vozId) return jsonResponse({ success: false, error: 'Campos obrigatorios: texto, livro, capitulo, versiculo, vozId' }, 400);
    const amosturaPath = VOZES_XTTS[vozId.toLowerCase()];
    if (!amosturaPath) return jsonResponse({ success: false, error: `Voz desconhecida: ${vozId}. Vozes disponíveis: ${Object.keys(VOZES_XTTS).join(', ')}` }, 400);
    const r2Key = `audio/${vozId}/${livro}/${capitulo}/${versiculo}.wav`;
    const pubUrl = `${R2_PUBLIC_URL}/${r2Key}`;
    if (env.R2_AUDIO) {
      try {
        const existing = await env.R2_AUDIO.head(r2Key);
        if (existing) return jsonResponse({ success: true, url: pubUrl, cached: true });
      } catch (_) { console.log(`📢 Não encontrado no R2: ${r2Key}`); }
    }
    const amosturaUrl = `${R2_PUBLIC_URL}/${amosturaPath}`;
    const hfSpaceUrl = env.HF_SPACE_URL;
    if (!hfSpaceUrl) return jsonResponse({ success: false, error: 'HF_SPACE_URL não configurada no servidor.' }, 500);
    console.log(`🎙️ Chamando XTTS: voz=${vozId} | ${livro} ${capitulo}:${versiculo}`);
    let xttsResponse;
    try {
      xttsResponse = await fetch(`${hfSpaceUrl}/gerar`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ texto, amostra_url: amosturaUrl }), signal: AbortSignal.timeout(120000) });
    } catch (fetchErr) { return jsonResponse({ success: false, error: `Não foi possível conectar ao HuggingFace Space: ${fetchErr.message}` }, 502); }
    if (!xttsResponse.ok) { const errText = await xttsResponse.text(); return jsonResponse({ success: false, error: `HuggingFace Space retornou ${xttsResponse.status}: ${errText.substring(0, 200)}` }, 502); }
    const xttsData = await xttsResponse.json();
    if (!xttsData.audio_base64) return jsonResponse({ success: false, error: xttsData.error || 'HuggingFace Space não retornou áudio' }, 502);
    const binaryStr = atob(xttsData.audio_base64);
    const audioBytes = new Uint8Array(binaryStr.length);
    for (let i = 0; i < binaryStr.length; i++) audioBytes[i] = binaryStr.charCodeAt(i);
    const audioBuffer = audioBytes.buffer;
    if (env.R2_AUDIO) {
      try {
        await env.R2_AUDIO.put(r2Key, audioBuffer, { httpMetadata: { contentType: 'audio/wav' }, customMetadata: { generatedAt: new Date().toISOString(), vozId, livro, capitulo: capitulo.toString(), versiculo: versiculo.toString(), geradoPor: 'xtts-hf' } });
        return jsonResponse({ success: true, url: pubUrl, cached: false });
      } catch (r2Error) { return new Response(audioBuffer, { status: 200, headers: { 'Content-Type': 'audio/wav', ...corsHeaders() } }); }
    }
    return new Response(audioBuffer, { status: 200, headers: { 'Content-Type': 'audio/wav', ...corsHeaders() } });
  } catch (error) {
    console.error('Erro handleBuscarOuGerarAudio:', error);
    return jsonResponse({ success: false, error: 'Erro interno no servidor: ' + error.message }, 500);
  }
}