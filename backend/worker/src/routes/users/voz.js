// backend/worker/src/routes/fiel/voz.js
import { jsonResponse, errorResponse } from '../../utils/helpers.js';

export async function contribuirVoz(request, env) {
  try {
    if (request.method === "OPTIONS") {
      return new Response(null, { status: 204, headers: corsHeaders() });
    }

    if (request.method !== "POST") {
      return jsonResponse({ success: false, error: "Método não permitido" }, 405);
    }

    const body = await request.json();
    const { audio, mimeType, livro, capitulo, versiculo, texto, apelido } = body;

    if (!audio || !livro || !capitulo || !versiculo || !texto) {
      return jsonResponse({
        success: false,
        error: 'Campos obrigatórios: audio, livro, capitulo, versiculo, texto'
      }, 400);
    }

    // Decodificar base64
    let audioBuffer;
    try {
      const binaryString = atob(audio);
      const audioBytes = new Uint8Array(binaryString.length);
      for (let i = 0; i < binaryString.length; i++) {
        audioBytes[i] = binaryString.charCodeAt(i);
      }
      audioBuffer = audioBytes.buffer;
    } catch (e) {
      console.error('Erro ao decodificar base64:', e);
      return jsonResponse({
        success: false,
        error: 'Erro ao processar arquivo de áudio'
      }, 400);
    }

    const id = `${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const dataAtual = new Date().toISOString();
    const nomeContribuinte = apelido?.trim() || 'Anônimo';
    
    const extension = mimeType?.split('/')[1] || 'webm';
    const r2Key = `contribuicoes/${livro}/${capitulo}/${versiculo}/${id}.${extension}`;

    if (!env.R2_AUDIO) {
      console.error('❌ R2_AUDIO não configurado');
      return jsonResponse({
        success: false,
        error: 'Servidor de áudio não configurado'
      }, 500);
    }

    try {
      await env.R2_AUDIO.put(r2Key, audioBuffer, {
        httpMetadata: { 
          contentType: mimeType || 'audio/webm',
          contentDisposition: `inline; filename="contribuicao_${livro}_${capitulo}_${versiculo}_${id}.${extension}"`
        },
        customMetadata: {
          livro: livro,
          capitulo: capitulo.toString(),
          versiculo: versiculo.toString(),
          texto: texto.substring(0, 500),
          contribuinte: nomeContribuinte,
          data: dataAtual,
          id: id
        }
      });
      console.log(`💾 Gravação salva no R2: ${r2Key} (${Math.round(audioBuffer.byteLength / 1024)} KB)`);
    } catch (r2Error) {
      console.error('Erro ao salvar no R2:', r2Error);
      return jsonResponse({
        success: false,
        error: 'Erro ao salvar gravação no servidor'
      }, 500);
    }

    return jsonResponse({
      success: true,
      message: 'Gravação enviada com sucesso! Obrigado por contribuir.',
      id: id,
      data: dataAtual
    });

  } catch (error) {
    console.error('Erro em contribuirVoz:', error);
    return jsonResponse({
      success: false,
      error: 'Erro interno no servidor: ' + error.message
    }, 500);
  }
}