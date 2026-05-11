// backend/worker/src/utils/emails.js

// ============= EXPORTS =============
export {
  sendPrayerConfirmationEmail,
  sendPrayerNotificationToSecretariat,
  sendPINEmail,
  send2FAEmail,
  sendWelcomeEmail,
  sendResetSenhaEmail,
  send2FAResetEmail,
  sendCandleEmail,
  sendContactConfirmationEmail,
  sendContactNotificationToSecretariat,
  sendPascomConfirmationEmail,
  sendPascomNotificationToTeam,
  sendTermoConfirmationEmail,
  sendTermoNotificationToSecretariat,
  sendWebBlackLinkEmail
};

// ================= CONFIGURAÇÃO DOS DESTINATÁRIOS =================
const CONFIG = {
  // 📧 SECRETARIA (2 emails)
  SECRETARIAT_EMAILS: [
    "pascom.santuario@outlook.com.br",
    "santuarionsradefatima@santoamaro.org.br"
  ],
  
  // 📧 CONTATO GERAL (2 emails)
  CONTACT_EMAILS: [
    "pascom.santuario@outlook.com.br",
    "santuarionsradefatima@santoamaro.org.br"
  ],
  
  // 📧 PEDIDOS DE ORAÇÃO (apenas 1 email)
  PRAYER_EMAILS: [
    "pascom.santuario@outlook.com.br"
  ]
};

// ================= CONFIGURAÇÃO DA IMAGEM =================
const IMAGEM_NOSSA_SENHORA = "https://santuariodefatima.com.br/images/nossa-senhora-fatima.jpg";

// ================= FUNÇÃO DE HORÁRIO SECRETARIA =================
function getHorarioSecretariaAviso() {
  const now = new Date();
  const hora = now.getHours();
  const diaSemana = now.getDay();
  const isDiaUtil = diaSemana >= 2 && diaSemana <= 6;
  const isHorarioComercial = hora >= 9 && hora < 17;
  if (!isDiaUtil || !isHorarioComercial) {
    return {
      ativo: true,
      mensagem: "⚠️ Nossa secretaria funciona de terça a sábado, das 9h às 17h. Responderemos em breve."
    };
  }
  return { ativo: false, mensagem: "" };
}

function getEmailHeader(titulo) {
  return `
<div class="header">
  <img src="${IMAGEM_NOSSA_SENHORA}" alt="Nossa Senhora de Fatima" class="header-image">
  <div class="header-title">
    <h1>${titulo}</h1>
    <p>Santuario Nossa Senhora de Fatima - Santo Amaro</p>
  </div>
</div>`;
}

function getEmailFooter() {
  return `
<div class="footer">
  <p><strong>Santuario Nossa Senhora de Fatima</strong></p>
  <p>Rua Darwin, 651 - Santo Amaro, Sao Paulo - SP</p>
  <p>santuariodefatima.com.br | (11) 5521-0312</p>
  <p style="margin-top: 10px;">🙏 Nossa Senhora de Fatima, rogai por nós!</p>
</div>`;
}

// ================= FUNÇÕES DE EMAIL =================

async function sendPrayerConfirmationEmail(env, data) {
  try {
    if (!env.RESEND_API_KEY) { return; }
    const currentDate = new Date().toLocaleDateString('pt-BR', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });
    const aviso = getHorarioSecretariaAviso();
    const html = `<!DOCTYPE html>
<html>
<head><meta charset="UTF-8"><title>🙏 Pedido de Oracao - Santuario de Fatima</title>
<style>
body{font-family:'Georgia','Times New Roman',serif;background:#f5f5f5;margin:0;padding:20px;}
.container{max-width:600px;margin:0 auto;background:white;border-radius:16px;overflow:hidden;box-shadow:0 10px 30px rgba(0,0,0,0.1);}
.header{background:#0b3b5c;color:white;padding:0;text-align:center;}
.header-image{width:100%;height:auto;max-height:250px;object-fit:cover;display:block;border-bottom:3px solid #b8860b;}
.header-title{padding:20px;background:#0b3b5c;}
.header-title h1{font-size:28px;margin:0;font-weight:400;}
.header-title p{font-size:16px;margin:10px 0 0;opacity:0.9;font-style:italic;}
.content{padding:40px 35px;color:#2c3e50;}
.greeting{font-size:22px;color:#0b3b5c;margin-bottom:25px;font-weight:500;border-left:4px solid #b8860b;padding-left:20px;}
.message{font-size:16px;line-height:1.8;margin-bottom:25px;color:#34495e;}
.prayer-box{background:#f9f9f9;border:1px solid #e0e0e0;border-radius:12px;padding:25px;margin:30px 0;}
.prayer-box h3{color:#0b3b5c;font-size:18px;margin:0 0 15px;font-weight:500;border-bottom:2px solid #b8860b;padding-bottom:10px;}
.prayer-text{font-size:18px;font-style:italic;color:#2c3e50;line-height:1.8;margin:0;}
.aviso-discreto{background:#fff5f5;border-left:4px solid #c53030;padding:15px;margin:25px 0;font-size:14px;color:#742a2a;border-radius:4px;}
.fatima-quote{background:#f0f7ff;padding:25px;border-radius:12px;margin:30px 0;text-align:center;font-style:italic;color:#0b3b5c;border:1px solid #b8860b;}
.signature{margin-top:30px;padding-top:20px;border-top:2px solid #e0e0e0;text-align:center;font-size:16px;color:#0b3b5c;font-style:italic;}
.footer{background:#f8f9fa;padding:25px;text-align:center;color:#7f8c8d;font-size:13px;border-top:1px solid #e0e0e0;}
.footer p{margin:4px 0;}
.footer strong{color:#0b3b5c;}
.date-info{text-align:center;color:#95a5a6;font-size:13px;margin-top:20px;}
</style>
</head>
<body>
<div class="container">
  ${getEmailHeader('🙏 Pedido de Oracao')}
  <div class="content">
    <div class="greeting">Paz e Bem, <strong>${data.name}</strong>!</div>
    <p class="message">Recebemos com carinho o seu pedido de oracao e agradecemos a confianca em partilhar conosco essa intencao.</p>
    <p class="message">Saiba que sua suplica sera apresentada a Deus em nossas oracoes, confiando tudo a Sua infinita misericordia, em Cristo e sob a intercessao de Nossa Senhora de Fatima.</p>
    ${aviso.ativo ? `<div class="aviso-discreto">${aviso.mensagem}</div>` : ''}
    <div class="prayer-box">
      <h3>Sua intencao</h3>
      <p class="prayer-text">"${data.prayerRequest}"</p>
      ${data.cidade ? `<div style="margin-top:10px;font-size:14px;"><strong>Local:</strong> ${data.cidade}</div>` : ''}
    </div>
    <div class="fatima-quote">"Rezai o terco todos os dias para alcancar a paz para o mundo e o fim da guerra"<div style="margin-top:10px;font-size:14px;">- Nossa Senhora de Fatima</div></div>
    <div class="signature">Em Cristo e Nossa Senhora de Fatima,<br><strong>Santuario Nossa Senhora de Fatima - Santo Amaro</strong></div>
    <div class="date-info">${currentDate}</div>
  </div>
  ${getEmailFooter()}
</div>
</body>
</html>`;
    await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: { "Authorization": `Bearer ${env.RESEND_API_KEY}`, "Content-Type": "application/json" },
      body: JSON.stringify({ from: "Santuario de Fatima <noreply@mail.santuariodefatima.com.br>", to: [data.email], subject: "🙏 Pedido de Oracao Recebido - Santuario de Fatima", html })
    });
  } catch (error) { console.error("Erro ao enviar email de oracao:", error); }
}

async function sendPrayerNotificationToSecretariat(env, data) {
  try {
    if (!env.RESEND_API_KEY) { return; }
    const currentDate = new Date().toLocaleDateString('pt-BR');
    const currentTime = new Date().toLocaleTimeString('pt-BR');
    const aviso = getHorarioSecretariaAviso();
    const html = `<!DOCTYPE html>
<html>
<head><meta charset="UTF-8"><title>Novo Pedido de Oracao</title>
<style>
body{font-family:'Georgia','Times New Roman',serif;background:#f5f5f5;margin:0;padding:20px;}
.container{max-width:600px;margin:0 auto;background:white;border-radius:16px;overflow:hidden;box-shadow:0 10px 30px rgba(0,0,0,0.1);}
.header{background:#0b3b5c;color:white;padding:0;text-align:center;}
.header-image{width:100%;height:auto;max-height:250px;object-fit:cover;display:block;border-bottom:3px solid #b8860b;}
.header-title{padding:20px;background:#0b3b5c;}
.header-title h1{font-size:24px;margin:0;font-weight:400;}
.header-title p{font-size:15px;margin:8px 0 0;opacity:0.9;font-style:italic;}
.content{padding:30px 25px;}
.prayer-box{background:#f9f9f9;border-left:4px solid #0b3b5c;padding:20px;margin:20px 0;border-radius:4px;}
.info-table{width:100%;border-collapse:collapse;margin:15px 0;}
.info-table td{padding:10px;border-bottom:1px solid #e0e0e0;font-size:15px;}
.info-table td:first-child{font-weight:bold;width:30%;color:#0b3b5c;}
.aviso{background:#fff5f5;border-left:4px solid #c53030;padding:15px;margin:20px 0;font-size:14px;color:#742a2a;border-radius:4px;}
.footer{background:#f8f9fa;padding:20px;text-align:center;font-size:12px;color:#7f8c8d;border-top:1px solid #e0e0e0;}
.footer strong{color:#0b3b5c;}
</style>
</head>
<body>
<div class="container">
  ${getEmailHeader('🙏 Novo Pedido de Oracao')}
  <div class="content">
    <table class="info-table">
      <tr><td>Nome:</td><td><strong>${data.name}</strong></td></tr>
      <tr><td>Email:</td><td>${data.email}</td></tr>
      ${data.cidade ? `<tr><td>Cidade:</td><td>${data.cidade}${data.cidade}</span></td></td>` : ''}
      <tr><td>Data/Hora:</td><td>${currentDate} às ${currentTime}NonNullable</td>
    </table>
    <div class="prayer-box"><h3>✝️ Intencao:</h3><p style="margin:0;font-style:italic;color:#2c3e50;">"${data.prayerRequest}"</p></div>
    ${aviso.ativo ? `<div class="aviso">⚠️ ${aviso.mensagem}</div>` : ''}
    <p style="color:#c53030;font-weight:500;text-align:center;font-size:15px;">Favor incluir nas intencoes das proximas missas.</p>
  </div>
  ${getEmailFooter()}
</div>
</body>
</html>`;
    for (const adminEmail of CONFIG.PRAYER_EMAILS) {
      await fetch("https://api.resend.com/emails", {
        method: "POST",
        headers: { "Authorization": `Bearer ${env.RESEND_API_KEY}`, "Content-Type": "application/json" },
        body: JSON.stringify({ from: "Santuario de Fatima <noreply@mail.santuariodefatima.com.br>", to: [adminEmail], subject: `🙏 Novo Pedido de Oracao - ${data.name}`, html, reply_to: data.email })
      });
      console.log(`📧 Notificação de oração enviada para: ${adminEmail}`);
    }
  } catch (error) { console.error("Erro ao enviar notificacao:", error); }
}

async function sendPINEmail(env, email, pin, nome) {
  try {
    if (!env.RESEND_API_KEY) { return; }
    const currentDate = new Date().toLocaleDateString('pt-BR', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });
    const html = `<!DOCTYPE html>
<html>
<head><meta charset="UTF-8"><title>PIN de Acesso - Santuario de Fatima</title>
<style>
body{font-family:'Georgia','Times New Roman',serif;background:#f5f5f5;margin:0;padding:20px;}
.container{max-width:600px;margin:0 auto;background:white;border-radius:16px;overflow:hidden;box-shadow:0 10px 30px rgba(0,0,0,0.1);}
.header{background:#0b3b5c;color:white;padding:0;text-align:center;}
.header-image{width:100%;height:auto;max-height:250px;object-fit:cover;display:block;border-bottom:3px solid #b8860b;}
.header-title{padding:20px;background:#0b3b5c;}
.header-title h1{font-size:28px;margin:0;font-weight:400;}
.header-title p{font-size:16px;margin:10px 0 0;opacity:0.9;font-style:italic;}
.content{padding:40px 35px;color:#2c3e50;}
.greeting{font-size:22px;color:#0b3b5c;margin-bottom:25px;font-weight:500;border-left:4px solid #b8860b;padding-left:20px;}
.message{font-size:16px;line-height:1.8;margin-bottom:25px;color:#34495e;}
.pin-container{background:#f9f9f9;border:1px solid #e0e0e0;border-radius:12px;padding:25px;margin:30px 0;}
.pin-container h3{color:#0b3b5c;font-size:18px;margin:0 0 15px;font-weight:500;border-bottom:2px solid #b8860b;padding-bottom:10px;}
.pin-code{font-size:48px;font-weight:bold;letter-spacing:8px;color:#0b3b5c;background:#f5f5f5;padding:20px;border-radius:8px;margin:10px 0;font-family:monospace;text-align:center;}
.pin-expiry{color:#666;font-size:14px;margin-top:10px;text-align:center;}
.fatima-quote{background:#f0f7ff;padding:25px;border-radius:12px;margin:30px 0;text-align:center;font-style:italic;color:#0b3b5c;border:1px solid #b8860b;}
.signature{margin-top:30px;padding-top:20px;border-top:2px solid #e0e0e0;text-align:center;font-size:16px;color:#0b3b5c;font-style:italic;}
.footer{background:#f8f9fa;padding:25px;text-align:center;color:#7f8c8d;font-size:13px;border-top:1px solid #e0e0e0;}
.footer p{margin:4px 0;}
.footer strong{color:#0b3b5c;}
.date-info{text-align:center;color:#95a5a6;font-size:13px;margin-top:20px;}
</style>
</head>
<body>
<div class="container">
  ${getEmailHeader('PIN de Acesso')}
  <div class="content">
    <div class="greeting">🕯️ <strong>Paz e Bem, ${nome}!</strong></div>
    <p class="message">Recebemos sua solicitacao de acesso ao sistema administrativo do Santuario de Fatima. Utilize o PIN abaixo para concluir sua autenticacao:</p>
    <div class="pin-container">
      <h3>🔐 CODIGO DE ACESSO</h3>
      <div class="pin-code">${pin}</div>
      <div class="pin-expiry">⏰ Este PIN expira em 5 minutos</div>
    </div>
    <div class="fatima-quote">"Rezai o terco todos os dias para alcancar a paz para o mundo e o fim da guerra"<div style="margin-top:10px;font-size:14px;">— Nossa Senhora de Fatima</div></div>
    <div class="signature">Em Cristo e Nossa Senhora de Fatima,<br><strong>Santuario Nossa Senhora de Fatima - Santo Amaro</strong></div>
    <div class="date-info">📅 ${currentDate}</div>
  </div>
  ${getEmailFooter()}
</div>
</body>
</html>`;
    await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: { "Authorization": `Bearer ${env.RESEND_API_KEY}`, "Content-Type": "application/json" },
      body: JSON.stringify({ from: "Santuario de Fatima <noreply@mail.santuariodefatima.com.br>", to: [email], subject: "🔐 Seu PIN de Acesso - Santuario de Fatima", html })
    });
    console.log(`✅ Email PIN enviado para ${email}`);
  } catch (error) { console.error("Erro ao enviar email de PIN:", error); }
}

async function send2FAEmail(env, email, codigo, nome) {
  try {
    if (!env.RESEND_API_KEY) { return; }
    const currentDate = new Date().toLocaleDateString('pt-BR', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });
    const html = `<!DOCTYPE html>
<html>
<head><meta charset="UTF-8"><title>Codigo 2FA - Santuario de Fatima</title>
<style>
body{font-family:'Georgia','Times New Roman',serif;background:#f5f5f5;margin:0;padding:20px;}
.container{max-width:600px;margin:0 auto;background:white;border-radius:16px;overflow:hidden;box-shadow:0 10px 30px rgba(0,0,0,0.1);}
.header{background:#0b3b5c;color:white;padding:0;text-align:center;}
.header-image{width:100%;height:auto;max-height:250px;object-fit:cover;display:block;border-bottom:3px solid #b8860b;}
.header-title{padding:20px;background:#0b3b5c;}
.header-title h1{font-size:28px;margin:0;font-weight:400;}
.header-title p{font-size:16px;margin:10px 0 0;opacity:0.9;font-style:italic;}
.content{padding:40px 35px;color:#2c3e50;}
.greeting{font-size:22px;color:#0b3b5c;margin-bottom:25px;font-weight:500;border-left:4px solid #b8860b;padding-left:20px;}
.message{font-size:16px;line-height:1.8;margin-bottom:25px;color:#34495e;}
.code-container{background:#f9f9f9;border:1px solid #e0e0e0;border-radius:12px;padding:25px;margin:30px 0;}
.code-container h3{color:#0b3b5c;font-size:18px;margin:0 0 15px;font-weight:500;border-bottom:2px solid #b8860b;padding-bottom:10px;}
.code-number{font-size:48px;font-weight:bold;letter-spacing:8px;color:#0b3b5c;background:#f5f5f5;padding:20px;border-radius:8px;margin:10px 0;font-family:monospace;text-align:center;}
.code-expiry{color:#666;font-size:14px;margin-top:10px;text-align:center;}
.fatima-quote{background:#f0f7ff;padding:25px;border-radius:12px;margin:30px 0;text-align:center;font-style:italic;color:#0b3b5c;border:1px solid #b8860b;}
.signature{margin-top:30px;padding-top:20px;border-top:2px solid #e0e0e0;text-align:center;font-size:16px;color:#0b3b5c;font-style:italic;}
.footer{background:#f8f9fa;padding:25px;text-align:center;color:#7f8c8d;font-size:13px;border-top:1px solid #e0e0e0;}
.footer p{margin:4px 0;}
.footer strong{color:#0b3b5c;}
.date-info{text-align:center;color:#95a5a6;font-size:13px;margin-top:20px;}
</style>
</head>
<body>
<div class="container">
  ${getEmailHeader('Codigo 2FA')}
  <div class="content">
    <div class="greeting">🕯️ <strong>Paz e Bem, ${nome}!</strong></div>
    <p class="message">Para sua seguranca, foi ativada a autenticacao em duas etapas. Utilize o codigo abaixo para prosseguir com o login:</p>
    <div class="code-container">
      <h3>🔒 CODIGO 2FA</h3>
      <div class="code-number">${codigo}</div>
      <div class="code-expiry">⏰ Expira em 5 minutos</div>
    </div>
    <div class="fatima-quote">"Rezai o terco todos os dias para alcancar a paz para o mundo e o fim da guerra"<div style="margin-top:10px;font-size:14px;">— Nossa Senhora de Fatima</div></div>
    <div class="signature">Em Cristo e Nossa Senhora de Fatima,<br><strong>Santuario Nossa Senhora de Fatima - Santo Amaro</strong></div>
    <div class="date-info">📅 ${currentDate}</div>
  </div>
  ${getEmailFooter()}
</div>
</body>
</html>`;
    await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: { "Authorization": `Bearer ${env.RESEND_API_KEY}`, "Content-Type": "application/json" },
      body: JSON.stringify({ from: "Santuario de Fatima <noreply@mail.santuariodefatima.com.br>", to: [email], subject: "🔒 Codigo 2FA - Santuario de Fatima", html })
    });
    console.log(`✅ Email 2FA enviado para ${email}`);
  } catch (error) { console.error("Erro ao enviar email 2FA:", error); }
}

async function sendWelcomeEmail(env, email, nome) {
  try {
    if (!env.RESEND_API_KEY) { return; }
    const currentDate = new Date().toLocaleDateString('pt-BR', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });
    const html = `<!DOCTYPE html>
<html>
<head><meta charset="UTF-8"><title>Bem-vindo ao Santuario de Fatima</title>
<style>
body{font-family:'Georgia','Times New Roman',serif;background:#f5f5f5;margin:0;padding:20px;}
.container{max-width:600px;margin:0 auto;background:white;border-radius:16px;overflow:hidden;box-shadow:0 10px 30px rgba(0,0,0,0.1);}
.header{background:#0b3b5c;color:white;padding:0;text-align:center;}
.header-image{width:100%;height:auto;max-height:250px;object-fit:cover;display:block;border-bottom:3px solid #b8860b;}
.header-title{padding:20px;background:#0b3b5c;}
.header-title h1{font-size:28px;margin:0;font-weight:400;}
.header-title p{font-size:16px;margin:10px 0 0;opacity:0.9;font-style:italic;}
.content{padding:40px 35px;color:#2c3e50;}
.greeting{font-size:22px;color:#0b3b5c;margin-bottom:25px;font-weight:500;border-left:4px solid #b8860b;padding-left:20px;}
.message{font-size:16px;line-height:1.8;margin-bottom:25px;color:#34495e;}
.fatima-quote{background:#f0f7ff;padding:25px;border-radius:12px;margin:30px 0;text-align:center;font-style:italic;color:#0b3b5c;border:1px solid #b8860b;}
.signature{margin-top:30px;padding-top:20px;border-top:2px solid #e0e0e0;text-align:center;font-size:16px;color:#0b3b5c;font-style:italic;}
.footer{background:#f8f9fa;padding:25px;text-align:center;color:#7f8c8d;font-size:13px;border-top:1px solid #e0e0e0;}
.footer p{margin:4px 0;}
.footer strong{color:#0b3b5c;}
.date-info{text-align:center;color:#95a5a6;font-size:13px;margin-top:20px;}
</style>
</head>
<body>
<div class="container">
  ${getEmailHeader('Bem-vindo(a)!')}
  <div class="content">
    <div class="greeting">🕯️ <strong>Paz e Bem, ${nome}!</strong></div>
    <p class="message">Seu cadastro foi realizado com sucesso no Sanctum do Santuario de Fatima.</p>
    <p class="message">Em breve voce recebera instrucoes para ativar a autenticacao em duas etapas.</p>
    <div class="fatima-quote">"Rezai o terco todos os dias para alcancar a paz para o mundo e o fim da guerra"<div style="margin-top:10px;font-size:14px;">— Nossa Senhora de Fatima</div></div>
    <div class="signature">Que Nossa Senhora de Fatima te abencoe,<br><strong>Santuario Nossa Senhora de Fatima - Santo Amaro</strong></div>
    <div class="date-info">📅 ${currentDate}</div>
  </div>
  ${getEmailFooter()}
</div>
</body>
</html>`;
    await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: { "Authorization": `Bearer ${env.RESEND_API_KEY}`, "Content-Type": "application/json" },
      body: JSON.stringify({ from: "Santuario de Fatima <noreply@mail.santuariodefatima.com.br>", to: [email], subject: "✨ Cadastro realizado - Santuario de Fatima", html })
    });
    console.log(`✅ Email de boas-vindas enviado para ${email}`);
  } catch (error) { console.error("Erro ao enviar email de boas-vindas:", error); }
}

// ================= 🔥 FUNÇÃO DE RECUPERAÇÃO DE SENHA CORRIGIDA =================
async function sendResetSenhaEmail(env, email, nome, token) {
  try {
    if (!env.RESEND_API_KEY) {
      console.error('❌ RESEND_API_KEY não configurada');
      return;
    }
    
    const currentDate = new Date().toLocaleDateString('pt-BR');
    const frontendUrl = env.FRONTEND_URL || 'https://santuariodefatima.com.br';
    const resetLink = `${frontendUrl}/minha-conta?reset_token=${token}&userId=${email}`;
    
    console.log(`📧 Enviando email de recuperação para: ${email}`);
    console.log(`🔗 Link: ${resetLink}`);
    
    const html = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <div style="background: #0b3b5c; padding: 20px; text-align: center;">
          <h2 style="color: white; margin: 0;">🔑 Recuperação de Senha</h2>
        </div>
        <div style="padding: 20px;">
          <p>Olá <strong>${nome}</strong>,</p>
          <p>Clique no botão abaixo para redefinir sua senha:</p>
          <div style="text-align: center; margin: 30px 0;">
            <a href="${resetLink}" style="background: #0b3b5c; color: white; padding: 12px 24px; text-decoration: none; border-radius: 8px;">Redefinir minha senha</a>
          </div>
          <p>⏱️ Este link é válido por <strong>1 hora</strong>.</p>
          <p>Se você não solicitou esta redefinição, ignore este e-mail.</p>
          <hr style="margin: 20px 0;">
          <p style="color: #666; font-size: 12px;">Santuario Nossa Senhora de Fatima - Santo Amaro<br>Rua Darwin, 651 - Santo Amaro, Sao Paulo - SP</p>
        </div>
      </div>
    `;
    
    const response = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: { 
        "Authorization": `Bearer ${env.RESEND_API_KEY}`, 
        "Content-Type": "application/json" 
      },
      body: JSON.stringify({ 
        from: "Santuario de Fatima <noreply@mail.santuariodefatima.com.br>",
        to: [email], 
        subject: "🔑 Recuperação de Senha - Santuario de Fatima", 
        html 
      })
    });
    
    const result = await response.json();
    console.log(`📧 Resposta Resend (Reset Senha):`, result);
    
    if (response.ok) {
      console.log(`✅ Email de recuperação enviado com sucesso para ${email}`);
    } else {
      console.error(`❌ Erro Resend: ${JSON.stringify(result)}`);
    }
    
  } catch (error) { 
    console.error("❌ Erro ao enviar email de recuperação:", error); 
  }
}

// ================= 🔥 FUNÇÃO DE RESET 2FA (NOVA) =================
async function send2FAResetEmail(env, email, nome, token) {
  try {
    if (!env.RESEND_API_KEY) {
      console.error('❌ RESEND_API_KEY não configurada');
      return;
    }
    
    const currentDate = new Date().toLocaleDateString('pt-BR');
    const frontendUrl = env.FRONTEND_URL || 'https://santuariodefatima.com.br';
    const resetLink = `${frontendUrl}/minha-conta?reset_2fa=${token}&userId=${email}`;
    
    console.log(`📧 Enviando email de reset 2FA para: ${email}`);
    console.log(`🔗 Link: ${resetLink}`);
    
    const html = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <div style="background: #0b3b5c; padding: 20px; text-align: center;">
          <h2 style="color: white; margin: 0;">🔐 Remover Autenticação 2FA</h2>
        </div>
        <div style="padding: 20px;">
          <p>Olá <strong>${nome}</strong>,</p>
          <p>Recebemos uma solicitação para remover a autenticação de dois fatores (2FA) da sua conta.</p>
          <p>Clique no botão abaixo para remover o 2FA:</p>
          <div style="text-align: center; margin: 30px 0;">
            <a href="${resetLink}" style="background: #0b3b5c; color: white; padding: 12px 24px; text-decoration: none; border-radius: 8px;">Remover 2FA</a>
          </div>
          <p>⏱️ Este link é válido por <strong>10 minutos</strong>.</p>
          <p>Se você não solicitou esta remoção, ignore este e-mail.</p>
          <hr style="margin: 20px 0;">
          <p style="color: #666; font-size: 12px;">Santuario Nossa Senhora de Fatima - Santo Amaro<br>Rua Darwin, 651 - Santo Amaro, Sao Paulo - SP</p>
        </div>
      </div>
    `;
    
    const response = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: { 
        "Authorization": `Bearer ${env.RESEND_API_KEY}`, 
        "Content-Type": "application/json" 
      },
      body: JSON.stringify({ 
        from: "Santuario de Fatima <noreply@mail.santuariodefatima.com.br>",
        to: [email], 
        subject: "🔐 Remover 2FA - Santuario de Fatima", 
        html 
      })
    });
    
    const result = await response.json();
    console.log(`📧 Resposta Resend (Reset 2FA):`, result);
    
    if (response.ok) {
      console.log(`✅ Email de reset 2FA enviado com sucesso para ${email}`);
    } else {
      console.error(`❌ Erro Resend: ${JSON.stringify(result)}`);
    }
    
  } catch (error) { 
    console.error("❌ Erro ao enviar email de reset 2FA:", error); 
  }
}

async function sendCandleEmail(env, data) {
  try {
    if (!env.RESEND_API_KEY) return;
    const currentDate = new Date().toLocaleDateString('pt-BR', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });
    const html = `<!DOCTYPE html>
<html>
<head><meta charset="UTF-8"><title>Vela Acesa - Santuario de Fatima</title>
<style>
body{font-family:'Georgia','Times New Roman',serif;background:#f5f5f5;margin:0;padding:20px;}
.container{max-width:600px;margin:0 auto;background:white;border-radius:16px;overflow:hidden;box-shadow:0 10px 30px rgba(0,0,0,0.1);}
.header{background:#ff8a5c;color:white;padding:0;text-align:center;}
.header-image{width:100%;height:auto;max-height:250px;object-fit:cover;display:block;border-bottom:3px solid #b8860b;}
.header-title{padding:20px;background:#ff8a5c;}
.header-title h1{font-size:28px;margin:0;font-weight:400;}
.header-title p{font-size:16px;margin:10px 0 0;opacity:0.9;font-style:italic;}
.content{padding:40px 35px;color:#2c3e50;}
.greeting{font-size:22px;color:#ff8a5c;margin-bottom:25px;font-weight:500;border-left:4px solid #b8860b;padding-left:20px;}
.message{font-size:16px;line-height:1.8;margin-bottom:25px;color:#34495e;}
.candle-box{background:#f9f9f9;border:1px solid #e0e0e0;border-radius:12px;padding:25px;margin:30px 0;text-align:center;}
.candle-box h3{color:#ff8a5c;font-size:18px;margin:0 0 15px;font-weight:500;border-bottom:2px solid #b8860b;padding-bottom:10px;}
.fatima-quote{background:#f0f7ff;padding:25px;border-radius:12px;margin:30px 0;text-align:center;font-style:italic;color:#0b3b5c;border:1px solid #b8860b;}
.signature{margin-top:30px;padding-top:20px;border-top:2px solid #e0e0e0;text-align:center;font-size:16px;color:#ff8a5c;font-style:italic;}
.footer{background:#f8f9fa;padding:25px;text-align:center;color:#7f8c8d;font-size:13px;border-top:1px solid #e0e0e0;}
.footer p{margin:4px 0;}
.footer strong{color:#ff8a5c;}
.date-info{text-align:center;color:#95a5a6;font-size:13px;margin-top:20px;}
</style>
</head>
<body>
<div class="container">
  ${getEmailHeader('Vela Acesa')}
  <div class="content">
    <div class="greeting">🕯️ <strong>Paz e Bem, ${data.name}!</strong></div>
    <p class="message">Sua vela foi acesa no Santuario de Fatima e permanecera por 7 dias.</p>
    <div class="candle-box">
      <h3>🕯️ SUA INTENCAO</h3>
      <p class="message" style="font-style:italic;margin:10px 0;">"${data.intention}"</p>
      ${data.cidade ? `<p style="color:#666;margin-top:10px;"><strong>Local:</strong> ${data.cidade}</p>` : ''}
    </div>
    <div class="fatima-quote">"Rezai o terco todos os dias para alcancar a paz para o mundo e o fim da guerra"<div style="margin-top:10px;font-size:14px;">— Nossa Senhora de Fatima</div></div>
    <div class="signature">Que sua intencao seja atendida,<br><strong>Santuario Nossa Senhora de Fatima - Santo Amaro</strong></div>
    <div class="date-info">📅 ${currentDate}</div>
  </div>
  ${getEmailFooter()}
</div>
</body>
</html>`;
    await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: { "Authorization": `Bearer ${env.RESEND_API_KEY}`, "Content-Type": "application/json" },
      body: JSON.stringify({ from: "Santuario de Fatima <noreply@mail.santuariodefatima.com.br>", to: [data.email], subject: "🕯️ Sua Vela foi Acesa - Santuario de Fatima", html })
    });
    console.log(`✅ Email de vela enviado para ${data.email}`);
  } catch (error) { console.error("Erro ao enviar email de vela:", error); }
}

async function sendContactConfirmationEmail(env, data) {
  try {
    if (!env.RESEND_API_KEY) return;
    const currentDate = new Date().toLocaleDateString('pt-BR', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });
    const assuntoMap = { informacoes: "Informacoes Gerais", sacramentos: "Sacramentos", pastorais: "Pastorais", eventos: "Eventos", doacoes: "Doacoes", certidoes: "Certidoes", outro: "Outro" };
    const assuntoLabel = assuntoMap[data.assunto] || data.assunto || "Nao informado";
    const aviso = getHorarioSecretariaAviso();
    const html = `<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <title>Mensagem Recebida - Santuario de Fatima</title>
  <style>
    body { font-family: 'Georgia', 'Times New Roman', serif; background: #f5f5f5; margin: 0; padding: 20px; }
    .container { max-width: 600px; margin: 0 auto; background: white; border-radius: 16px; overflow: hidden; box-shadow: 0 10px 30px rgba(0,0,0,0.1); }
    .header { background: #0b3b5c; color: white; padding: 0; text-align: center; }
    .header-image { width: 100%; height: auto; max-height: 260px; object-fit: cover; display: block; border-bottom: 3px solid #b8860b; }
    .header-title { padding: 20px; background: #0b3b5c; }
    .header-title h1 { font-size: 26px; margin: 0; font-weight: 400; }
    .header-title p { font-size: 15px; margin: 8px 0 0; opacity: 0.9; font-style: italic; }
    .content { padding: 40px 35px; color: #2c3e50; }
    .greeting { font-size: 21px; color: #0b3b5c; margin-bottom: 22px; font-weight: 500; border-left: 4px solid #b8860b; padding-left: 20px; }
    .message { font-size: 16px; line-height: 1.8; margin-bottom: 20px; color: #34495e; }
    .info-box { background: #f9f9f9; border: 1px solid #e0e0e0; border-radius: 12px; padding: 22px; margin: 28px 0; }
    .info-box h3 { color: #0b3b5c; font-size: 17px; margin: 0 0 14px; font-weight: 500; border-bottom: 2px solid #b8860b; padding-bottom: 8px; }
    .info-row { margin-bottom: 10px; font-size: 15px; color: #2c3e50; }
    .info-row strong { color: #0b3b5c; }
    .mensagem-box { background: #f0f7ff; border-left: 4px solid #0b3b5c; padding: 16px 20px; border-radius: 6px; margin-top: 14px; font-size: 15px; color: #2c3e50; font-style: italic; line-height: 1.7; }
    .aviso-discreto { background: #fff5f5; border-left: 4px solid #c53030; padding: 14px; margin: 22px 0; font-size: 13px; color: #742a2a; border-radius: 4px; }
    .fatima-quote { background: #f0f7ff; padding: 22px; border-radius: 12px; margin: 28px 0; text-align: center; font-style: italic; color: #0b3b5c; border: 1px solid #b8860b; font-size: 16px; line-height: 1.7; }
    .signature { margin-top: 28px; padding-top: 18px; border-top: 2px solid #e0e0e0; text-align: center; font-size: 15px; color: #0b3b5c; font-style: italic; }
    .footer { background: #f8f9fa; padding: 22px; text-align: center; color: #7f8c8d; font-size: 13px; border-top: 1px solid #e0e0e0; }
    .footer p { margin: 4px 0; }
    .footer strong { color: #0b3b5c; }
    .date-info { text-align: center; color: #95a5a6; font-size: 13px; margin-top: 18px; }
  </style>
</head>
<body>
  <div class="container">
    ${getEmailHeader('Mensagem Recebida')}
    <div class="content">
      <div class="greeting">Paz e Bem, <strong>${data.nome}</strong>!</div>
      <p class="message">Recebemos sua mensagem com carinho e agradecemos por entrar em contato conosco. Em breve um de nossos agentes pastorais retornara o contato.</p>
      <div class="info-box">
        <h3>📨 Sua Mensagem</h3>
        <div class="info-row"><strong>Assunto:</strong> ${assuntoLabel}</div>
        ${data.telefone ? `<div class="info-row"><strong>Telefone:</strong> ${data.telefone}</div>` : ''}
        <div class="mensagem-box">"${data.mensagem}"</div>
      </div>
      ${aviso.ativo ? `<div class="aviso-discreto">⚠️ ${aviso.mensagem}</div>` : ''}
      <div class="fatima-quote">"Rezai o terco todos os dias para alcancar a paz para o mundo e o fim da guerra"<div style="margin-top: 10px; font-size: 13px; color: #5a7fa0;">— Nossa Senhora de Fatima</div></div>
      <div class="signature">Em Cristo e Nossa Senhora de Fatima,<br><strong>Secretaria Pastoral – Santuario Nossa Senhora de Fatima</strong></div>
      <div class="date-info">📅 ${currentDate}</div>
    </div>
    ${getEmailFooter()}
  </div>
</body>
</html>`;
    await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: { "Authorization": `Bearer ${env.RESEND_API_KEY}`, "Content-Type": "application/json" },
      body: JSON.stringify({ from: "Santuario de Fatima <noreply@mail.santuariodefatima.com.br>", to: [data.email], subject: "✉️ Mensagem Recebida – Santuario de Fatima", html })
    });
    console.log(`✅ Email de confirmação de contato enviado para ${data.email}`);
  } catch (error) { console.error("Erro ao enviar email de contato:", error); }
}

async function sendContactNotificationToSecretariat(env, data) {
  try {
    if (!env.RESEND_API_KEY) { return; }
    const currentDate = new Date().toLocaleDateString('pt-BR');
    const currentTime = new Date().toLocaleTimeString('pt-BR');
    const aviso = getHorarioSecretariaAviso();
    const html = `<!DOCTYPE html>
<html>
<head><meta charset="UTF-8"><title>Novo Contato - Secretaria</title>
<style>
body{font-family:'Georgia','Times New Roman',serif;background:#f5f5f5;margin:0;padding:20px;}
.container{max-width:600px;margin:0 auto;background:white;border-radius:16px;overflow:hidden;box-shadow:0 10px 30px rgba(0,0,0,0.1);}
.header{background:#0b3b5c;color:white;padding:0;text-align:center;}
.header-image{width:100%;height:auto;max-height:250px;object-fit:cover;display:block;border-bottom:3px solid #b8860b;}
.header-title{padding:20px;background:#0b3b5c;}
.header-title h1{font-size:24px;margin:0;font-weight:400;}
.header-title p{font-size:15px;margin:8px 0 0;opacity:0.9;font-style:italic;}
.content{padding:30px 25px;}
.message-box{background:#f9f9f9;border-left:4px solid #0b3b5c;padding:20px;margin:20px 0;border-radius:4px;}
.aviso{background:#fff5f5;border-left:4px solid #c53030;padding:15px;margin:20px 0;font-size:14px;color:#742a2a;border-radius:4px;}
.footer{background:#f8f9fa;padding:20px;text-align:center;font-size:12px;color:#7f8c8d;border-top:1px solid #e0e0e0;}
.footer strong{color:#0b3b5c;}
p{font-size:15px;margin:8px 0;color:#2c3e50;}
</style>
</head>
<body>
<div class="container">
  ${getEmailHeader('✉️ Novo Contato')}
  <div class="content">
    <p><strong>Nome:</strong> ${data.nome}</p>
    <p><strong>Email:</strong> ${data.email}</p>
    <p><strong>Telefone:</strong> ${data.telefone || "Nao informado"}</p>
    <p><strong>Assunto:</strong> ${data.assunto}</p>
    <p><strong>Data/Hora:</strong> ${currentDate} as ${currentTime}</p>
    <div class="message-box"><h3 style="margin:0 0 10px;color:#0b3b5c;">Mensagem:</h3><p style="margin:0;white-space:pre-wrap;font-style:italic;">${data.mensagem}</p></div>
    ${aviso.ativo ? `<div class="aviso">⚠️ ${aviso.mensagem}</div>` : ''}
  </div>
  ${getEmailFooter()}
</div>
</body>
</html>`;
    for (const adminEmail of CONFIG.CONTACT_EMAILS) {
      await fetch("https://api.resend.com/emails", {
        method: "POST",
        headers: { "Authorization": `Bearer ${env.RESEND_API_KEY}`, "Content-Type": "application/json" },
        body: JSON.stringify({ from: "Santuario de Fatima <noreply@mail.santuariodefatima.com.br>", to: [adminEmail], subject: `📬 Novo Contato: ${data.assunto} - ${data.nome}`, html, reply_to: data.email })
      });
      console.log(`📧 Notificação de contato enviada para: ${adminEmail}`);
    }
  } catch (error) { console.error("Erro ao enviar notificacao de contato:", error); }
}

async function sendPascomConfirmationEmail(env, data) {
  try {
    if (!env.RESEND_API_KEY) return;
    const assuntoMap = { elogio: "Elogio", sugestao: "Sugestão", duvida: "Dúvida" };
    const assuntoLabel = assuntoMap[data.assunto] || data.assunto;
    const currentDate = new Date().toLocaleDateString('pt-BR', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });
    const html = `<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <title>Mensagem Recebida - Pascom Santuário de Fátima</title>
  <style>
    body { font-family: 'Georgia', 'Times New Roman', serif; background: #f5f5f5; margin: 0; padding: 20px; }
    .container { max-width: 600px; margin: 0 auto; background: white; border-radius: 16px; overflow: hidden; box-shadow: 0 10px 30px rgba(0,0,0,0.1); }
    .header { background: #0b3b5c; color: white; padding: 0; text-align: center; }
    .header-image { width: 100%; height: auto; max-height: 260px; object-fit: cover; display: block; border-bottom: 3px solid #b8860b; }
    .header-title { padding: 20px; background: #0b3b5c; }
    .header-title h1 { font-size: 28px; margin: 0; font-weight: 400; }
    .header-title p { font-size: 16px; margin: 10px 0 0; opacity: 0.9; font-style: italic; }
    .pascom-badge { background: linear-gradient(135deg, #2563eb, #7e22ce); color: white; padding: 8px 16px; border-radius: 30px; display: inline-block; margin-top: 10px; font-size: 14px; }
    .content { padding: 40px 35px; color: #2c3e50; }
    .greeting { font-size: 22px; color: #0b3b5c; margin-bottom: 25px; font-weight: 500; border-left: 4px solid #b8860b; padding-left: 20px; }
    .message { font-size: 16px; line-height: 1.8; margin-bottom: 20px; color: #34495e; }
    .info-box { background: #f9f9f9; border: 1px solid #e0e0e0; border-radius: 12px; padding: 25px; margin: 30px 0; }
    .info-box h3 { color: #0b3b5c; font-size: 18px; margin: 0 0 15px; font-weight: 500; border-bottom: 2px solid #b8860b; padding-bottom: 10px; }
    .info-row { margin-bottom: 12px; font-size: 15px; color: #2c3e50; }
    .info-row strong { color: #0b3b5c; width: 100px; display: inline-block; }
    .mensagem-destaque { background: #f0f7ff; border-left: 4px solid #2563eb; padding: 20px; border-radius: 8px; margin: 20px 0; font-style: italic; color: #2c3e50; line-height: 1.7; }
    .fatima-quote { background: #f0f7ff; padding: 25px; border-radius: 12px; margin: 30px 0; text-align: center; font-style: italic; color: #0b3b5c; border: 1px solid #b8860b; font-size: 16px; }
    .signature { margin-top: 30px; padding-top: 20px; border-top: 2px solid #e0e0e0; text-align: center; font-size: 16px; color: #0b3b5c; font-style: italic; }
    .footer { background: #f8f9fa; padding: 25px; text-align: center; color: #7f8c8d; font-size: 13px; border-top: 1px solid #e0e0e0; }
    .footer p { margin: 4px 0; }
    .footer strong { color: #0b3b5c; }
    .date-info { text-align: center; color: #95a5a6; font-size: 13px; margin-top: 20px; }
  </style>
</head>
<body>
  <div class="container">
    ${getEmailHeader('📬 Mensagem Recebida')}
    <div class="content">
      <div class="greeting">🕯️ <strong>Paz e Bem, ${data.nome}!</strong></div>
      <p class="message">Agradecemos por entrar em contato com a <strong>Pastoral da Comunicação (Pascom)</strong> do Santuário Nossa Senhora de Fátima. Sua mensagem foi recebida com carinho e em breve responderemos.</p>
      <div class="info-box">
        <h3>📋 Resumo da sua mensagem</h3>
        <div class="info-row"><strong>Assunto:</strong> <span style="color: #2563eb; font-weight: 600;">${assuntoLabel}</span></div>
        <div class="info-row"><strong>E-mail:</strong> ${data.email}</div>
        ${data.telefone ? `<div class="info-row"><strong>Telefone:</strong> ${data.telefone}</div>` : ''}
      </div>
      <div class="mensagem-destaque">"${data.mensagem}"</div>
      <div class="fatima-quote">"Rezai o terço todos os dias para alcançar a paz para o mundo e o fim da guerra"<div style="margin-top: 10px; font-size: 14px; color: #5a7fa0;">— Nossa Senhora de Fátima</div></div>
      <p style="color: #666; font-size: 14px; margin-top: 25px; text-align: center;">⏰ Responderemos o mais breve possível, em horário comercial (terça a sábado, 9h às 17h).</p>
      <div class="signature">Em Cristo e Nossa Senhora de Fátima,<br><strong>Pascom - Santuário Nossa Senhora de Fátima</strong></div>
      <div class="date-info">📅 ${currentDate}</div>
    </div>
    ${getEmailFooter()}
  </div>
</body>
</html>`;
    await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: { "Authorization": `Bearer ${env.RESEND_API_KEY}`, "Content-Type": "application/json" },
      body: JSON.stringify({ from: "Pascom Santuário de Fátima <noreply@mail.santuariodefatima.com.br>", to: [data.email], subject: "📬 Mensagem Recebida - Pascom Santuário de Fátima", html })
    });
    console.log(`✅ Email de confirmação Pascom enviado para ${data.email}`);
  } catch (error) { console.error("Erro ao enviar email Pascom:", error); }
}

async function sendPascomNotificationToTeam(env, data) {
  try {
    if (!env.RESEND_API_KEY) return;
    const assuntoMap = { elogio: "Elogio", sugestao: "Sugestão", duvida: "Dúvida" };
    const assuntoLabel = assuntoMap[data.assunto] || data.assunto;
    const currentDate = new Date().toLocaleDateString('pt-BR');
    const currentTime = new Date().toLocaleTimeString('pt-BR');
    const html = `<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <title>Nova Mensagem - Pascom</title>
  <style>
    body { font-family: 'Georgia', 'Times New Roman', serif; background: #f5f5f5; margin: 0; padding: 20px; }
    .container { max-width: 600px; margin: 0 auto; background: white; border-radius: 16px; overflow: hidden; box-shadow: 0 10px 30px rgba(0,0,0,0.1); }
    .header { background: #0b3b5c; color: white; padding: 0; text-align: center; }
    .header-image { width: 100%; height: auto; max-height: 260px; object-fit: cover; display: block; border-bottom: 3px solid #b8860b; }
    .header-title { padding: 20px; background: #0b3b5c; }
    .header-title h1 { font-size: 28px; margin: 0; font-weight: 400; }
    .header-title p { font-size: 16px; margin: 10px 0 0; opacity: 0.9; font-style: italic; }
    .content { padding: 30px 25px; }
    .info-table { width: 100%; border-collapse: collapse; margin: 20px 0; background: #f8fafc; border-radius: 12px; overflow: hidden; }
    .info-table td { padding: 15px; border-bottom: 1px solid #e0e0e0; font-size: 15px; }
    .info-table tr:last-child td { border-bottom: none; }
    .info-table td:first-child { font-weight: bold; color: #0b3b5c; width: 30%; background: #f1f5f9; }
    .mensagem-box { background: #f0f7ff; border-left: 4px solid #2563eb; padding: 20px; border-radius: 8px; margin: 20px 0; }
    .mensagem-box h3 { margin: 0 0 10px; color: #0b3b5c; font-size: 16px; }
    .mensagem-box p { margin: 0; white-space: pre-wrap; color: #2c3e50; line-height: 1.7; }
    .reply-info { background: #f0fdf4; border-left: 4px solid #22c55e; padding: 15px; margin: 20px 0; font-size: 14px; color: #166534; border-radius: 4px; }
    .footer { background: #f8f9fa; padding: 20px; text-align: center; font-size: 12px; color: #7f8c8d; border-top: 1px solid #e0e0e0; }
    .footer strong { color: #0b3b5c; }
    .footer a { color: #2563eb; text-decoration: none; }
  </style>
</head>
<body>
  <div class="container">
    ${getEmailHeader('📬 NOVA MENSAGEM - PASCOM')}
    <div class="content">
      <table class="info-table">
        <tr><td>Nome:</td><td><strong style="font-size: 16px;">${data.nome}</strong></td></tr>
        <tr><td>E-mail:</td><td><a href="mailto:${data.email}" style="color: #2563eb;">${data.email}</a></td></tr>
        ${data.telefone ? `<tr><td>Telefone:</td><td>${data.telefone}NonNullable</td>` : ''}
        <tr><td>Assunto:</td><td><span style="background: ${data.assunto === 'elogio' ? '#22c55e' : data.assunto === 'sugestao' ? '#3b82f6' : '#a855f7'}; color: white; padding: 4px 12px; border-radius: 20px; font-size: 12px; font-weight: bold;">${assuntoLabel}</span></td></tr>
        <tr><td>Data/Hora:</td><td>${currentDate} às ${currentTime}NonNullable</td>
      </table>
      <div class="mensagem-box">
        <h3>✉️ Mensagem:</h3>
        <p>${data.mensagem}</p>
      </div>
      <div class="reply-info">
        <strong>📧 Responder para:</strong> <a href="mailto:${data.email}">${data.email}</a>
      </div>
      <p style="text-align: center; margin-top: 20px; color: #666;">⚠️ Esta é uma mensagem automática do sistema do Santuário.</p>
    </div>
    ${getEmailFooter()}
  </div>
</body>
</html>`;
    for (const adminEmail of CONFIG.SECRETARIAT_EMAILS) {
      await fetch("https://api.resend.com/emails", {
        method: "POST",
        headers: { "Authorization": `Bearer ${env.RESEND_API_KEY}`, "Content-Type": "application/json" },
        body: JSON.stringify({ from: "Pascom Santuário de Fátima <noreply@mail.santuariodefatima.com.br>", to: [adminEmail], subject: `📬 NOVA MENSAGEM: ${assuntoLabel} - ${data.nome}`, html, reply_to: data.email })
      });
      console.log(`📧 Notificação Pascom enviada para: ${adminEmail}`);
    }
  } catch (error) { console.error("Erro ao notificar Pascom:", error); }
}

async function sendTermoConfirmationEmail(env, data) {
  try {
    if (!env.RESEND_API_KEY) return;
    const currentDate = new Date().toLocaleDateString('pt-BR', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });
    const html = `<!DOCTYPE html>
<html>
<head><meta charset="UTF-8"><title>Termo de Consentimento - Santuario de Fatima</title>
<style>
body{font-family:'Georgia','Times New Roman',serif;background:#f5f5f5;margin:0;padding:20px;}
.container{max-width:600px;margin:0 auto;background:white;border-radius:16px;overflow:hidden;box-shadow:0 10px 30px rgba(0,0,0,0.1);}
.header{background:#0b3b5c;color:white;padding:0;text-align:center;}
.header-image{width:100%;height:auto;max-height:250px;object-fit:cover;display:block;border-bottom:3px solid #b8860b;}
.header-title{padding:20px;background:#0b3b5c;}
.header-title h1{font-size:28px;margin:0;font-weight:400;}
.header-title p{font-size:16px;margin:10px 0 0;opacity:0.9;font-style:italic;}
.content{padding:40px 35px;color:#2c3e50;}
.greeting{font-size:22px;color:#0b3b5c;margin-bottom:25px;font-weight:500;border-left:4px solid #b8860b;padding-left:20px;}
.message{font-size:16px;line-height:1.8;margin-bottom:25px;color:#34495e;}
.success-box{background:#f0fdf4;border-left:4px solid #22c55e;padding:20px;margin:25px 0;border-radius:8px;}
.fatima-quote{background:#f0f7ff;padding:25px;border-radius:12px;margin:30px 0;text-align:center;font-style:italic;color:#0b3b5c;border:1px solid #b8860b;}
.signature{margin-top:30px;padding-top:20px;border-top:2px solid #e0e0e0;text-align:center;font-size:16px;color:#0b3b5c;font-style:italic;}
.footer{background:#f8f9fa;padding:25px;text-align:center;color:#7f8c8d;font-size:13px;border-top:1px solid #e0e0e0;}
.footer p{margin:4px 0;}
.footer strong{color:#0b3b5c;}
.date-info{text-align:center;color:#95a5a6;font-size:13px;margin-top:20px;}
</style>
</head>
<body>
<div class="container">
  ${getEmailHeader('Termo de Consentimento')}
  <div class="content">
    <div class="greeting">📋 <strong>${data.name || "Prezado(a)"}</strong></div>
    <p class="message">Recebemos com sucesso o seu Termo de Consentimento para participação no <strong>Programa de Voluntariado</strong> do Santuário Nossa Senhora de Fátima.</p>
    <div class="success-box">
      <p style="margin:0;color:#166534;"><strong>✅ Documento registrado em:</strong> ${currentDate}</p>
      ${data.cpf ? `<p style="margin:5px 0 0;color:#166534;"><strong>CPF:</strong> ${data.cpf}</p>` : ''}
    </div>
    <p class="message">Agradecemos seu interesse em contribuir conosco. Em breve nossa equipe entrará em contato para as próximas etapas.</p>
    <div class="fatima-quote">"A alegria está no serviço ao próximo e na doação de si mesmo"<div style="margin-top:10px;font-size:14px;">— Papa Francisco</div></div>
    <div class="signature">Que Deus abençoe sua iniciativa,<br><strong>Santuario Nossa Senhora de Fatima - Santo Amaro</strong></div>
    <div class="date-info">📅 ${currentDate}</div>
  </div>
  ${getEmailFooter()}
</div>
</body>
</html>`;
    await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: { "Authorization": `Bearer ${env.RESEND_API_KEY}`, "Content-Type": "application/json" },
      body: JSON.stringify({ from: "Santuario de Fatima <noreply@mail.santuariodefatima.com.br>", to: [data.email], subject: "📋 Termo de Consentimento Recebido - Santuario de Fatima", html })
    });
    console.log(`✅ Email de confirmação de termo enviado para ${data.email}`);
  } catch (error) { console.error("Erro ao enviar email de termo:", error); }
}

async function sendTermoNotificationToSecretariat(env, data) {
  try {
    if (!env.RESEND_API_KEY) return;
    const currentDate = new Date().toLocaleDateString('pt-BR');
    const currentTime = new Date().toLocaleTimeString('pt-BR');
    const html = `<!DOCTYPE html>
<html>
<head><meta charset="UTF-8"><title>Novo Termo de Consentimento - Secretaria</title>
<style>
body{font-family:'Georgia','Times New Roman',serif;background:#f5f5f5;margin:0;padding:20px;}
.container{max-width:600px;margin:0 auto;background:white;border-radius:16px;overflow:hidden;box-shadow:0 10px 30px rgba(0,0,0,0.1);}
.header{background:#0b3b5c;color:white;padding:0;text-align:center;}
.header-image{width:100%;height:auto;max-height:250px;object-fit:cover;display:block;border-bottom:3px solid #b8860b;}
.header-title{padding:20px;background:#0b3b5c;}
.header-title h1{font-size:24px;margin:0;font-weight:400;}
.header-title p{font-size:15px;margin:8px 0 0;opacity:0.9;font-style:italic;}
.content{padding:30px 25px;}
.info-table{width:100%;border-collapse:collapse;margin:20px 0;background:#f8fafc;border-radius:12px;overflow:hidden;}
.info-table td{padding:15px;border-bottom:1px solid #e0e0e0;font-size:15px;}
.info-table tr:last-child td{border-bottom:none;}
.info-table td:first-child{font-weight:bold;color:#0b3b5c;width:35%;background:#f1f5f9;}
.notice-box{background:#fef3c7;border-left:4px solid #f59e0b;padding:15px;margin:20px 0;border-radius:4px;}
.footer{background:#f8f9fa;padding:20px;text-align:center;font-size:12px;color:#7f8c8d;border-top:1px solid #e0e0e0;}
.footer strong{color:#0b3b5c;}
</style>
</head>
<body>
<div class="container">
  ${getEmailHeader('📋 NOVO TERMO DE CONSENTIMENTO')}
  <div class="content">
    <table class="info-table">
      <tr><td>Nome Completo:</td><td><strong>${data.name}</strong></td></tr>
      <tr><td>Email:</td><td>${data.email}NonNullable</td>
      ${data.cpf ? `<tr><td>CPF:</td><td>${data.cpf}NonNullable</td>` : ''}
      ${data.telefone ? `<tr><td>Telefone:</td><td>${data.telefone}NonNullable</td>` : ''}
      <tr><td>Data/Hora:</td><td>${currentDate} às ${currentTime}NonNullable</td>
    </table>
    <div class="notice-box">
      <strong>⚠️ Atenção Secretaria:</strong>
      <p style="margin:5px 0 0;font-size:14px;">Novo voluntário registrado. Favor incluir no cadastro e entrar em contato para agendamento da entrevista.</p>
    </div>
    <p style="color:#c53030;font-weight:500;text-align:center;">📌 Documento armazenado no sistema.</p>
  </div>
  ${getEmailFooter()}
</div>
</body>
</html>`;
    for (const adminEmail of CONFIG.SECRETARIAT_EMAILS) {
      await fetch("https://api.resend.com/emails", {
        method: "POST",
        headers: { "Authorization": `Bearer ${env.RESEND_API_KEY}`, "Content-Type": "application/json" },
        body: JSON.stringify({ from: "Santuario de Fatima <noreply@mail.santuariodefatima.com.br>", to: [adminEmail], subject: `📋 NOVO TERMO: ${data.name}`, html, reply_to: data.email })
      });
    }
    console.log(`✅ Notificação de termo enviada para secretaria`);
  } catch (error) { console.error("Erro ao enviar notificação de termo:", error); }
}

async function sendWebBlackLinkEmail(env, email, token, nome) {
  try {
    if (!env.RESEND_API_KEY) return;
    const currentDate = new Date().toLocaleDateString('pt-BR', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });
    const html = `<!DOCTYPE html>
<html>
<head><meta charset="UTF-8"><title>Link de Acesso - WebBlack</title>
<style>
body{font-family:'Georgia','Times New Roman',serif;background:#f5f5f5;margin:0;padding:20px;}
.container{max-width:600px;margin:0 auto;background:white;border-radius:16px;overflow:hidden;box-shadow:0 10px 30px rgba(0,0,0,0.1);}
.header{background:#0b3b5c;color:white;padding:0;text-align:center;}
.header-image{width:100%;height:auto;max-height:250px;object-fit:cover;display:block;border-bottom:3px solid #b8860b;}
.header-title{padding:20px;background:#0b3b5c;}
.header-title h1{font-size:28px;margin:0;font-weight:400;}
.header-title p{font-size:16px;margin:10px 0 0;opacity:0.9;font-style:italic;}
.content{padding:40px 35px;color:#2c3e50;}
.greeting{font-size:22px;color:#0b3b5c;margin-bottom:25px;font-weight:500;border-left:4px solid #b8860b;padding-left:20px;}
.message{font-size:16px;line-height:1.8;margin-bottom:25px;color:#34495e;}
.token-container{background:#f9f9f9;border:1px solid #e0e0e0;border-radius:12px;padding:25px;margin:30px 0;text-align:center;}
.token-container h3{color:#0b3b5c;font-size:18px;margin:0 0 15px;font-weight:500;border-bottom:2px solid #b8860b;padding-bottom:10px;}
.token-code{font-size:32px;font-weight:bold;letter-spacing:4px;color:#0b3b5c;background:#f5f5f5;padding:20px;border-radius:8px;margin:10px 0;font-family:monospace;word-break:break-all;}
.token-expiry{color:#666;font-size:14px;margin-top:10px;}
.fatima-quote{background:#f0f7ff;padding:25px;border-radius:12px;margin:30px 0;text-align:center;font-style:italic;color:#0b3b5c;border:1px solid #b8860b;}
.signature{margin-top:30px;padding-top:20px;border-top:2px solid #e0e0e0;text-align:center;font-size:16px;color:#0b3b5c;font-style:italic;}
.footer{background:#f8f9fa;padding:25px;text-align:center;color:#7f8c8d;font-size:13px;border-top:1px solid #e0e0e0;}
.footer p{margin:4px 0;}
.footer strong{color:#0b3b5c;}
.date-info{text-align:center;color:#95a5a6;font-size:13px;margin-top:20px;}
</style>
</head>
<body>
<div class="container">
  ${getEmailHeader('Link de Acesso - WebBlack')}
  <div class="content">
    <div class="greeting">🕯️ <strong>Paz e Bem, ${nome || "Prezado(a)"}!</strong></div>
    <p class="message">Você solicitou acesso à plataforma <strong>WebBlack</strong> do Santuário de Fátima. Utilize o link abaixo para acessar:</p>
    <div class="token-container">
      <h3>🔗 LINK DE ACESSO</h3>
      <div class="token-code">${token}</div>
      <div class="token-expiry">⏰ Este link expira em 30 minutos</div>
    </div>
    <p class="message">Caso não tenha solicitado este acesso, ignore este e-mail.</p>
    <div class="fatima-quote">"Rezai o terço todos os dias para alcançar a paz para o mundo e o fim da guerra"<div style="margin-top:10px;font-size:14px;">— Nossa Senhora de Fátima</div></div>
    <div class="signature">Em Cristo e Nossa Senhora de Fátima,<br><strong>Santuario Nossa Senhora de Fatima - Santo Amaro</strong></div>
    <div class="date-info">📅 ${currentDate}</div>
  </div>
  ${getEmailFooter()}
</div>
</body>
</html>`;
    await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: { "Authorization": `Bearer ${env.RESEND_API_KEY}`, "Content-Type": "application/json" },
      body: JSON.stringify({ from: "Santuario de Fatima <noreply@mail.santuariodefatima.com.br>", to: [email], subject: "🔗 Link de Acesso - WebBlack Santuário de Fátima", html })
    });
    console.log(`✅ Email WebBlack enviado para ${email}`);
  } catch (error) { console.error("Erro ao enviar email WebBlack:", error); }
}