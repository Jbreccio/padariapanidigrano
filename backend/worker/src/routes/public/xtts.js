// backend/worker/src/routes/public/xtts.js
import { jsonResponse, errorResponse } from '../../utils/helpers.js';

const VOZES_XTTS = {
  amandoca: "vozes-base/amandoca_base.mp3",
  antonio: "vozes-base/antonio_base.mp3",
  arnold: "vozes-base/arnold_base.mp3",
  maria: "vozes-base/woman_base.mp3"
};

const R2_PUBLIC_URL = "https://pub-a7cc8a4d3af3406aac2a13dacc039fb5.r2.dev";

export async function buscarOuGerarAudio(request, env) {
  try {
    const body = await request.json();
    const { texto, livro, capitulo, versiculo, vozId } = body;
    
    if (!texto || !livro || !capitulo || !versiculo || !vozId) {
      return errorResponse('Campos obrigatorios: texto, livro, capitulo, versiculo, vozId', 400);
    }
    
    const amosturaPath = VOZES_XTTS[vozId.toLowerCase()];
    if (!amosturaPath) {
      return errorResponse(`Voz desconhecida: ${vozId}. Vozes disponíveis: ${Object.keys(VOZES_XTTS).join(', ')}`, 400);
    }
    
    const r2Key = `audio/${vozId}/${livro}/${capitulo}/${versiculo}.wav`;
    const pubUrl = `${R2_PUBLIC_URL}/${r2Key}`;
    
    if (env.R2_AUDIO) {
      try {
        const existing = await env.R2_AUDIO.head(r2Key);
        if (existing) {
          return jsonResponse({ success: true, url: pubUrl, cached: true });
        }
      } catch (_) {}
    }
    
    const amosturaUrl = `${R2_PUBLIC_URL}/${amosturaPath}`;
    const hfSpaceUrl = env.HF_SPACE_URL;
    
    if (!hfSpaceUrl) {
      return errorResponse('HF_SPACE_URL não configurada no servidor.', 500);
    }
    
    const xttsResponse = await fetch(`${hfSpaceUrl}/gerar`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ texto, amostra_url: amosturaUrl }),
      signal: AbortSignal.timeout(120000),
    });
    
    if (!xttsResponse.ok) {
      const errText = await xttsResponse.text();
      return errorResponse(`HuggingFace Space retornou ${xttsResponse.status}: ${errText.substring(0, 200)}`, 502);
    }
    
    const xttsData = await xttsResponse.json();
    if (!xttsData.audio_base64) {
      return errorResponse(xttsData.error || 'HuggingFace Space não retornou áudio', 502);
    }
    
    const binaryStr = atob(xttsData.audio_base64);
    const audioBytes = new Uint8Array(binaryStr.length);
    for (let i = 0; i < binaryStr.length; i++) {
      audioBytes[i] = binaryStr.charCodeAt(i);
    }
    const audioBuffer = audioBytes.buffer;
    
    if (env.R2_AUDIO) {
      try {
        await env.R2_AUDIO.put(r2Key, audioBuffer, {
          httpMetadata: { contentType: 'audio/wav' },
          customMetadata: {
            generatedAt: new Date().toISOString(),
            vozId, livro, capitulo: capitulo.toString(), versiculo: versiculo.toString(),
            geradoPor: 'xtts-hf'
          }
        });
        return jsonResponse({ success: true, url: pubUrl, cached: false });
      } catch (r2Error) {
        console.error('Erro ao salvar no R2:', r2Error);
        return new Response(audioBuffer, {
          status: 200,
          headers: { 'Content-Type': 'audio/wav' }
        });
      }
    }
    
    return new Response(audioBuffer, {
      status: 200,
      headers: { 'Content-Type': 'audio/wav' }
    });
  } catch (error) {
    console.error('Erro handleBuscarOuGerarAudio:', error);
    return errorResponse('Erro interno no servidor: ' + error.message, 500);
  }
}