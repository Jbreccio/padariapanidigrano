import { jsonResponse } from '../utils/responses.js';
import { sendContactConfirmationEmail, sendContactNotificationToSecretariat, sendPascomConfirmationEmail, sendPascomNotificationToTeam } from '../utils/emails.js';

export async function handleContato(request, env, ctx) {
  try {
    const body = await request.json();
    if (!env.RESEND_API_KEY) return jsonResponse({ success: false, error: 'RESEND_API_KEY não configurada' }, 500);
    ctx.waitUntil(sendContactConfirmationEmail(env, body));
    ctx.waitUntil(sendContactNotificationToSecretariat(env, body));
    return jsonResponse({ success: true, message: 'Mensagem enviada com sucesso!' });
  } catch (error) { return jsonResponse({ success: false, message: 'Erro ao enviar mensagem', error: error.message }, 500); }
}

export async function handlePascom(request, env, ctx) {
  try {
    const body = await request.json();
    if (!env.RESEND_API_KEY) return jsonResponse({ success: false, error: 'RESEND_API_KEY não configurada' }, 500);
    ctx.waitUntil(sendPascomConfirmationEmail(env, body));
    ctx.waitUntil(sendPascomNotificationToTeam(env, body));
    return jsonResponse({ success: true, message: 'Mensagem enviada com sucesso para a Pascom!' });
  } catch (error) { return jsonResponse({ success: false, message: 'Erro ao enviar mensagem', error: error.message }, 500); }
}