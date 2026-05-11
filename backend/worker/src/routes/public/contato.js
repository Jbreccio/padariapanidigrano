// backend/worker/src/routes/public/contato.js
import { jsonResponse, errorResponse } from '../../utils/helpers.js';
import { 
  sendContactConfirmationEmail, 
  sendContactNotificationToSecretariat,
  sendPascomConfirmationEmail,
  sendPascomNotificationToTeam
} from '../../utils/emails.js';

export async function contatoEnviar(request, env, ctx) {
  try {
    const body = await request.json();
    if (!env.RESEND_API_KEY) {
      return errorResponse('RESEND_API_KEY nao configurada', 500);
    }
    
    ctx.waitUntil(sendContactConfirmationEmail(env, {
      nome: body.nome,
      email: body.email,
      assunto: body.assunto,
      mensagem: body.mensagem,
      telefone: body.telefone
    }));
    
    ctx.waitUntil(sendContactNotificationToSecretariat(env, {
      nome: body.nome,
      email: body.email,
      assunto: body.assunto,
      mensagem: body.mensagem,
      telefone: body.telefone
    }));
    
    return jsonResponse({ success: true, message: "Mensagem enviada com sucesso!" });
  } catch(error) {
    return errorResponse('Erro ao enviar mensagem', 500);
  }
}

export async function contatoPascom(request, env, ctx) {
  try {
    const body = await request.json();
    if (!env.RESEND_API_KEY) {
      return errorResponse('RESEND_API_KEY não configurada', 500);
    }
    
    ctx.waitUntil(sendPascomConfirmationEmail(env, body));
    ctx.waitUntil(sendPascomNotificationToTeam(env, body));
    
    return jsonResponse({ success: true, message: "Mensagem enviada com sucesso para a Pascom!" });
  } catch(error) {
    return errorResponse('Erro ao enviar mensagem', 500);
  }
}