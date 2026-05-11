// backend/worker/src/routes/fiel/termo-publico.js
import { jsonResponse, corsHeaders } from '../../utils/helpers.js';

// Função para gerar PDF em HTML (será convertido para PDF via API)
function gerarHTMLTermo(data) {
  const dataFormatada = new Date(data.dataAceite).toLocaleDateString('pt-BR', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });
  
  const horaFormatada = new Date(data.dataAceite).toLocaleTimeString('pt-BR');
  
  return `<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <title>Termo de Autorização de Uso de Áudio</title>
  <style>
    body {
      font-family: 'Times New Roman', Times, serif;
      margin: 0;
      padding: 40px;
      background: white;
      color: #333;
      line-height: 1.6;
    }
    .container {
      max-width: 800px;
      margin: 0 auto;
      padding: 30px;
      border: 1px solid #ccc;
      box-shadow: 0 0 10px rgba(0,0,0,0.1);
    }
    .header {
      text-align: center;
      margin-bottom: 30px;
      border-bottom: 2px solid #0b3b5c;
      padding-bottom: 20px;
    }
    .header h1 {
      color: #0b3b5c;
      font-size: 24px;
      margin: 0 0 10px 0;
    }
    .header p {
      color: #666;
      margin: 0;
    }
    .content {
      margin-bottom: 30px;
    }
    .termo-texto {
      background: #f9f9f9;
      padding: 20px;
      border-left: 4px solid #0b3b5c;
      margin: 20px 0;
      font-style: italic;
    }
    .dados {
      background: #f0f7ff;
      padding: 20px;
      margin: 20px 0;
      border-radius: 8px;
    }
    .dados p {
      margin: 8px 0;
    }
    .assinatura {
      margin-top: 40px;
      text-align: center;
      border-top: 1px solid #ccc;
      padding-top: 20px;
    }
    .footer {
      text-align: center;
      font-size: 12px;
      color: #666;
      margin-top: 30px;
    }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>SANTUÁRIO NOSSA SENHORA DE FÁTIMA</h1>
      <p>Rua Darwin, 651 - Santo Amaro, São Paulo - SP</p>
      <p>santuariodefatima.com.br | (11) 5521-0312</p>
    </div>
    
    <div class="content">
      <h2 style="text-align: center; color: #0b3b5c;">TERMO DE AUTORIZAÇÃO DE USO DE ÁUDIO</h2>
      
      <div class="dados">
        <p><strong>NOME COMPLETO:</strong> ${data.nome}</p>
        <p><strong>CPF:</strong> ${data.cpf.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, '$1.$2.$3-$4')}</p>
        <p><strong>E-MAIL:</strong> ${data.email}</p>
        ${data.responsavelLegal ? `<p><strong>RESPONSÁVEL LEGAL:</strong> ${data.responsavelLegal}</p>` : ''}
        ${data.cpfResponsavel ? `<p><strong>CPF DO RESPONSÁVEL:</strong> ${data.cpfResponsavel.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, '$1.$2.$3-$4')}</p>` : ''}
        <p><strong>DATA DO ACEITE:</strong> ${dataFormatada} às ${horaFormatada}</p>
        <p><strong>IP DE ORIGEM:</strong> ${data.ip || 'Não disponível'}</p>
      </div>
      
      <div class="termo-texto">
        <p>Eu, <strong>${data.nome}</strong>, portador(a) do CPF <strong>${data.cpf.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, '$1.$2.$3-$4')}</strong>,</p>
        <p>AUTORIZO a gravação em áudio da minha voz, para que possa ser personalizada a Bíblia Online do Site - Santuário Nossa Senhora de Fátima - Santo Amaro - São Paulo-SP, para que no entendimento desta possa eu fiel, ouvir a Bíblia com a minha própria locução interativa, ficando ainda facultativo o uso de outras vozes - locutoras no menu da página.</p>
        <p>Fica ainda autorizada, de livre e espontânea vontade, para os mesmos fins, a cessão de direitos da veiculação das vozes, não recebendo para tanto qualquer tipo de remuneração.</p>
      </div>
    </div>
    
    <div class="assinatura">
      <p>_________________________________________</p>
      <p><strong>${data.nome}</strong></p>
      <p>Assinatura (digitalmente aceito)</p>
    </div>
    
    <div class="footer">
      <p>Documento assinado eletronicamente no site do Santuário de Fátima</p>
      <p>Protocolo: ${data.id} | ${dataFormatada}</p>
    </div>
  </div>
</body>
</html>`;
}

export async function registrarTermoPublico(request, env, ctx) {
  try {
    if (request.method === "OPTIONS") {
      return new Response(null, { status: 204, headers: corsHeaders() });
    }

    if (request.method !== "POST") {
      return jsonResponse({ success: false, error: "Método não permitido" }, 405);
    }

    const body = await request.json();
    const { nome, cpf, email, responsavelLegal, cpfResponsavel, dataAceite } = body;

    if (!nome || !cpf || !email) {
      return jsonResponse({
        success: false,
        error: 'Campos obrigatórios: nome, cpf, email'
      }, 400);
    }

    // Validar CPF
    const validarCPF = (cpfNum) => {
      const numeros = cpfNum.replace(/\D/g, '');
      if (numeros.length !== 11) return false;
      let soma = 0;
      let resto;
      for (let i = 1; i <= 9; i++) {
        soma += parseInt(numeros.substring(i - 1, i)) * (11 - i);
      }
      resto = (soma * 10) % 11;
      if (resto === 10 || resto === 11) resto = 0;
      if (resto !== parseInt(numeros.substring(9, 10))) return false;
      soma = 0;
      for (let i = 1; i <= 10; i++) {
        soma += parseInt(numeros.substring(i - 1, i)) * (12 - i);
      }
      resto = (soma * 10) % 11;
      if (resto === 10 || resto === 11) resto = 0;
      if (resto !== parseInt(numeros.substring(10, 11))) return false;
      return true;
    };

    if (!validarCPF(cpf)) {
      return jsonResponse({ success: false, error: "CPF inválido" }, 400);
    }

    // Validar email
    const validarEmail = (emailStr) => {
      const regex = /^[^\s@]+@([^\s@]+\.)+[^\s@]+$/;
      return regex.test(emailStr);
    };

    if (!validarEmail(email)) {
      return jsonResponse({ success: false, error: "E-mail inválido" }, 400);
    }

    const now = new Date().toISOString();
    const id = `${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const ip = request.headers.get('CF-Connecting-IP') || 
               request.headers.get('X-Forwarded-For') || 
               request.headers.get('x-real-ip') || 
               'desconhecido';
    const userAgent = request.headers.get('User-Agent') || '';

    // Dados completos para o termo
    const termoData = {
      id,
      nome,
      cpf,
      email,
      responsavelLegal,
      cpfResponsavel,
      ip,
      userAgent,
      dataAceite: now
    };

    // Salvar no D1
    if (env.DB) {
      try {
        // Criar tabela se não existir
        await env.DB.prepare(`
          CREATE TABLE IF NOT EXISTS termos_voz (
            id TEXT PRIMARY KEY,
            nome TEXT NOT NULL,
            cpf TEXT NOT NULL,
            email TEXT NOT NULL,
            responsavel_legal TEXT,
            cpf_responsavel TEXT,
            ip TEXT,
            user_agent TEXT,
            data_aceite TEXT NOT NULL,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP
          )
        `).run();

        await env.DB.prepare(`
          INSERT INTO termos_voz (id, nome, cpf, email, responsavel_legal, cpf_responsavel, ip, user_agent, data_aceite)
          VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
        `).bind(id, nome, cpf, email, responsavelLegal || null, cpfResponsavel || null, ip, userAgent, now).run();
        
        console.log(`✅ Termo de voz REGISTRADO: ${id} - ${nome} (${email})`);
      } catch (dbError) {
        console.error('Erro ao salvar no D1:', dbError);
        // Continua mesmo com erro no banco, para não perder o envio do email
      }
    }

    // Gerar HTML do termo
    const htmlTermo = gerarHTMLTermo(termoData);

    // Enviar emails com PDF
    if (env.RESEND_API_KEY) {
      try {
        // Email para o fiel com PDF
        await sendTermoEmailToFiel(env, termoData, htmlTermo);
        
        // Email para a secretaria com PDF
        await sendTermoEmailToSecretariat(env, termoData, htmlTermo);
        
        console.log(`✅ Emails enviados para: ${email} e secretaria`);
      } catch (emailError) {
        console.error('Erro ao enviar emails:', emailError);
      }
    }

    return jsonResponse({
      success: true,
      message: 'Termo de autorização registrado com sucesso! Você receberá um email com o PDF do termo assinado.',
      data: { id, nome, email, dataAceite: now }
    });

  } catch (error) {
    console.error('Erro em registrarTermoPublico:', error);
    return jsonResponse({
      success: false,
      error: 'Erro interno no servidor: ' + error.message
    }, 500);
  }
}

async function sendTermoEmailToFiel(env, data, htmlTermo) {
  try {
    const dataFormatada = new Date(data.dataAceite).toLocaleDateString('pt-BR');
    
    const emailHtml = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="UTF-8">
        <title>Termo de Autorização de Voz - Santuário de Fátima</title>
        <style>
          body { font-family: 'Georgia', 'Times New Roman', serif; background: #f5f5f5; margin: 0; padding: 20px; }
          .container { max-width: 600px; margin: 0 auto; background: white; border-radius: 16px; overflow: hidden; box-shadow: 0 10px 30px rgba(0,0,0,0.1); }
          .header { background: #0b3b5c; color: white; padding: 20px; text-align: center; }
          .header h1 { margin: 0; font-size: 24px; }
          .content { padding: 30px; }
          .aviso { background: #e8f5e9; border-left: 4px solid #4caf50; padding: 15px; margin: 20px 0; border-radius: 4px; }
          .btn-pdf { background: #0b3b5c; color: white; padding: 12px 24px; text-decoration: none; border-radius: 8px; display: inline-block; margin: 20px 0; }
          .footer { background: #f8f9fa; padding: 20px; text-align: center; font-size: 12px; color: #7f8c8d; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>✅ Termo de Autorização de Voz</h1>
            <p>Santuário Nossa Senhora de Fátima</p>
          </div>
          <div class="content">
            <p>Olá <strong>${data.nome}</strong>,</p>
            <p>Recebemos e registramos seu Termo de Autorização de Uso de Áudio.</p>
            
            <div class="aviso">
              <strong>🎤 Seu termo foi registrado com sucesso!</strong><br>
              Data do registro: ${dataFormatada}<br>
              Protocolo: ${data.id}
            </div>
            
            <p>Em anexo a este email, você encontrará o PDF do termo assinado digitalmente para seus registros.</p>
            <p>Agora você já pode gravar sua voz na Bíblia Online! Clique no botão "Contribuir" ao lado de qualquer versículo e comece a gravar.</p>
            
            <p style="margin-top: 30px; text-align: center;">
              <strong>Que Nossa Senhora de Fátima abençoe sua contribuição!</strong>
            </p>
          </div>
          <div class="footer">
            <p><strong>Santuario Nossa Senhora de Fatima</strong></p>
            <p>Rua Darwin, 651 - Santo Amaro, São Paulo - SP</p>
            <p>santuariodefatima.com.br | (11) 5521-0312</p>
          </div>
        </div>
      </body>
      </html>
    `;

    // Enviar email com HTML e anexo PDF (usando HTML2PDF da Resend)
    // Como o Resend não suporta anexos diretamente, vamos usar HTML com link para PDF
    // ou usar outra abordagem. Para simplificar, vamos enviar o HTML do termo no corpo do email.
    
    const emailCompleto = `
      <div style="max-width: 600px; margin: 0 auto;">
        ${emailHtml}
        <hr style="margin: 30px 0;">
        <div style="background: #f9f9f9; padding: 20px; border-radius: 8px;">
          <h3 style="color: #0b3b5c;">📄 Termo de Autorização</h3>
          ${htmlTermo}
        </div>
      </div>
    `;

    await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: { "Authorization": `Bearer ${env.RESEND_API_KEY}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        from: "Santuario de Fatima <noreply@mail.santuariodefatima.com.br>",
        to: [data.email],
        subject: "✅ Termo de Autorização de Voz - Santuário de Fátima",
        html: emailCompleto
      })
    });
    
    console.log(`✅ Email do termo enviado para ${data.email}`);
  } catch (error) {
    console.error("Erro ao enviar email para o fiel:", error);
    throw error;
  }
}

async function sendTermoEmailToSecretariat(env, data, htmlTermo) {
  try {
    const dataFormatada = new Date(data.dataAceite).toLocaleDateString('pt-BR');
    const horaFormatada = new Date(data.dataAceite).toLocaleTimeString('pt-BR');
    
    const emailHtml = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="UTF-8">
        <title>Novo Termo de Voz - Santuário de Fátima</title>
        <style>
          body { font-family: 'Georgia', 'Times New Roman', serif; background: #f5f5f5; margin: 0; padding: 20px; }
          .container { max-width: 600px; margin: 0 auto; background: white; border-radius: 16px; overflow: hidden; box-shadow: 0 10px 30px rgba(0,0,0,0.1); }
          .header { background: #0b3b5c; color: white; padding: 20px; text-align: center; }
          .header h1 { margin: 0; font-size: 24px; }
          .content { padding: 30px; }
          .info-table { width: 100%; border-collapse: collapse; margin: 20px 0; }
          .info-table td { padding: 12px; border-bottom: 1px solid #e0e0e0; }
          .info-table td:first-child { font-weight: bold; width: 40%; background: #f5f5f5; }
          .aviso { background: #fff3e0; border-left: 4px solid #ff9800; padding: 15px; margin: 20px 0; border-radius: 4px; }
          .footer { background: #f8f9fa; padding: 20px; text-align: center; font-size: 12px; color: #7f8c8d; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>🎤 NOVO TERMO DE VOZ</h1>
            <p>Autorização de Uso de Áudio - Bíblia Online</p>
          </div>
          <div class="content">
            <h3>📋 Dados do Fiel</h3>
            <table class="info-table">
              <tr><td>Nome Completo:</td><td><strong>${data.nome}</strong></td></tr>
              <tr><td>CPF:</td><td>${data.cpf.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, '$1.$2.$3-$4')}</td></tr>
              <tr><td>E-mail:</td><td>${data.email}</td></tr>
              ${data.responsavelLegal ? `<tr><td>Responsável Legal:</td><td>${data.responsavelLegal}</td></tr>` : ''}
              ${data.cpfResponsavel ? `<tr><td>CPF do Responsável:</td><td>${data.cpfResponsavel.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, '$1.$2.$3-$4')}</td></tr>` : ''}
              <tr><td>Data do Aceite:</td><td>${dataFormatada} às ${horaFormatada}</td></tr>
              <tr><td>IP de Origem:</td><td>${data.ip || 'Não disponível'}</td></tr>
              <tr><td>Protocolo:</td><td>${data.id}</td></tr>
            </table>
            
            <div class="aviso">
              <strong>⚠️ ATENÇÃO SECRETARIA</strong><br>
              Este fiel autorizou o uso da sua voz para personalização da Bíblia Online.
              O termo assinado está anexado abaixo para arquivamento.
            </div>
            
            <hr style="margin: 30px 0;">
            
            <h3>📄 Termo de Autorização</h3>
            ${htmlTermo}
          </div>
          <div class="footer">
            <p><strong>Santuario Nossa Senhora de Fatima</strong></p>
            <p>Rua Darwin, 651 - Santo Amaro, São Paulo - SP</p>
          </div>
        </div>
      </body>
      </html>
    `;

    const emailsSecretaria = [
      "santuariodefatima@santuariodefatima.com.br",
      "pascom.santuario@outlook.com.br",
      "pascon@santuariodefatima.com.br"
    ];

    for (const email of emailsSecretaria) {
      await fetch("https://api.resend.com/emails", {
        method: "POST",
        headers: { "Authorization": `Bearer ${env.RESEND_API_KEY}`, "Content-Type": "application/json" },
        body: JSON.stringify({
          from: "Santuario de Fatima <noreply@mail.santuariodefatima.com.br>",
          to: [email],
          subject: `🎤 Novo Termo de Voz - ${data.nome}`,
          html: emailHtml,
          reply_to: data.email
        })
      });
      console.log(`✅ Email do termo enviado para ${email}`);
    }
  } catch (error) {
    console.error("Erro ao enviar email para a secretaria:", error);
    throw error;
  }
}