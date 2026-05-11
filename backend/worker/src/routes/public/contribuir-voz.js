// backend/worker/src/routes/public/contribuir-voz.js
import { jsonResponse, errorResponse } from '../../utils/helpers.js';
import { sendVoiceContributionNotification } from '../../utils/emails.js';

export async function contribuirVoz(request, env, ctx) {
  try {
    const body = await request.json();
    const { audio, mimeType, livro, capitulo, versiculo, texto, apelido } = body;
    
    if (!audio || !livro || !capitulo || !versiculo || !texto) {
      return errorResponse('Campos obrigatórios: audio, livro, capitulo, versiculo, texto', 400);
    }
    
    // Decodificar base64
    const binaryString = atob(audio);
    const audioBytes = new Uint8Array(binaryString.length);
    for (let i = 0; i < binaryString.length; i++) {
      audioBytes[i] = binaryString.charCodeAt(i);
    }
    const audioBuffer = audioBytes.buffer;
    
    const id = `${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const dataAtual = new Date().toISOString();
    const nomeContribuinte = apelido?.trim() || 'Anônimo';
    
    const r2Key = `contribuicoes/${livro}/${capitulo}/${versiculo}/${id}.${mimeType?.split('/')[1] || 'mp4'}`;
    
    if (env.R2_AUDIO) {
      try {
        await env.R2_AUDIO.put(r2Key, audioBuffer, {
          httpMetadata: { contentType: mimeType || 'audio/mp4' },
          customMetadata: {
            livro, capitulo: capitulo.toString(), versiculo: versiculo.toString(),
            texto, contribuinte: nomeContribuinte, data: dataAtual, id
          }
        });
      } catch (r2Error) {
        console.error('Erro ao salvar no R2:', r2Error);
        return errorResponse('Erro ao salvar gravação no servidor', 500);
      }
    } else {
      return errorResponse('Servidor de áudio não configurado', 500);
    }
    
    if (env.DB) {
      try {
        await env.DB.prepare(`
          CREATE TABLE IF NOT EXISTS contribuicoes_voz (
            id TEXT PRIMARY KEY,
            livro TEXT NOT NULL,
            capitulo INTEGER NOT NULL,
            versiculo INTEGER NOT NULL,
            texto TEXT NOT NULL,
            contribuinte TEXT,
            data TEXT NOT NULL,
            arquivo_path TEXT NOT NULL
          )
        `).run();
        
        await env.DB.prepare(`
          INSERT INTO contribuicoes_voz (id, livro, capitulo, versiculo, texto, contribuinte, data, arquivo_path)
          VALUES (?, ?, ?, ?, ?, ?, ?, ?)
        `).bind(id, livro, capitulo, versiculo, texto, nomeContribuinte, dataAtual, r2Key).run();
      } catch (dbError) {
        console.error('Erro ao salvar no D1:', dbError);
      }
    }
    
    if (env.RESEND_API_KEY) {
      ctx.waitUntil(sendVoiceContributionNotification(env, {
        id, livro, capitulo, versiculo, texto,
        contribuinte: nomeContribuinte, data: dataAtual
      }));
    }
    
    return jsonResponse({
      success: true,
      message: 'Gravação enviada com sucesso! Obrigado por contribuir.',
      id, data: dataAtual
    });
  } catch (error) {
    console.error('Erro em contribuirVoz:', error);
    return errorResponse('Erro interno no servidor: ' + error.message, 500);
  }
}