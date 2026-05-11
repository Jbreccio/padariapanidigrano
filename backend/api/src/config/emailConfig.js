// backend/src/config/emailConfig.js
import nodemailer from 'nodemailer';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import { existsSync } from 'fs';

// Obter __dirname no ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

dotenv.config();

console.log('📧 Configurando sistema de email...');

// TRANSPORTER HOSTINGER
export const transporter = nodemailer.createTransport({
  host: process.env.EMAIL_HOST || 'smtp.hostinger.com',
  port: parseInt(process.env.EMAIL_PORT) || 465,
  secure: true,
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS
  },
  tls: {
    rejectUnauthorized: false
  },
  debug: false,
  logger: false
});

// CONFIGURAÇÕES
const EMAIL_FROM = process.env.EMAIL_FROM || `"Santuário de Fátima" <${process.env.EMAIL_USER}>`;
const SANTUARIOS_EMAIL = 'santuariodefatima@santuariodefatima.com.br,santuarionsradefatima@santoamaro.org.br,pascom.santuario@outlook.com.br';


// FUNÇÃO 5: Email para acendimento de vela
export const sendCandleLightingEmail = async (data) => {
  try {
    const { name, email, intention, candleType = 'virtual' } = data;
    const currentDate = new Date().toLocaleDateString('pt-BR', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
    const currentTime = new Date().toLocaleTimeString('pt-BR');
    
    console.log(`🕯️ Enviando email de ACENDIMENTO DE VELA para: ${name} (${email})`);
    
    // Verificar se a imagem existe
    let imageAttachment = null;
    const imagePath = join(__dirname, '..', '..', '..', 'frontend', 'public', 'nossa-senhora-fatima.png');
    
    if (existsSync(imagePath)) {
      console.log('✅ Imagem encontrada para email de vela');
      imageAttachment = {
        filename: 'nossa-senhora-fatima.png',
        path: imagePath,
        cid: 'imagem-santuario'
      };
    } else {
      console.log('⚠️ Imagem não encontrada, usando URL online como fallback');
    }
    
    const mailOptions = {
      from: EMAIL_FROM,
      to: email,
      subject: '🕯️ Confirmação de Acendimento de Vela - Santuário de Fátima',
      html: `
<!DOCTYPE html>
<html lang="pt-BR">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Confirmação de Acendimento de Vela</title>
    <style>
        * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
        }
        body {
            font-family: 'Georgia', serif;
            line-height: 1.6;
            color: #333;
            background-color: #fffaf0;
            padding: 20px;
        }
        .email-container {
            max-width: 700px;
            margin: 0 auto;
            background: white;
            border-radius: 10px;
            overflow: hidden;
            box-shadow: 0 4px 20px rgba(0,0,0,0.1);
        }
        .header {
            background: linear-gradient(135deg, #ff9800 0%, #ff5722 100%);
            color: white;
            padding: 30px 20px;
            text-align: center;
        }
        .header h1 {
            font-size: 28px;
            margin-bottom: 10px;
            font-weight: normal;
        }
        .header .symbol {
            font-size: 40px;
            margin-bottom: 10px;
        }
        .candle-animation {
            text-align: center;
            margin: 20px 0;
            font-size: 60px;
            animation: flicker 1.5s infinite alternate;
        }
        @keyframes flicker {
            0%, 100% { opacity: 1; }
            50% { opacity: 0.8; }
        }
        .content {
            padding: 30px;
        }
        .intention-box {
            background: #fff9e6;
            border: 2px dashed #ff9800;
            border-radius: 10px;
            padding: 25px;
            margin: 25px 0;
            position: relative;
        }
        .intention-box:before {
            content: "🕯️";
            position: absolute;
            top: -15px;
            left: 20px;
            background: white;
            padding: 0 10px;
            font-size: 20px;
        }
        .intention-title {
            color: #e65100;
            margin-bottom: 15px;
            font-size: 18px;
        }
        .intention-content {
            font-style: italic;
            line-height: 1.8;
            color: #5d4037;
            background: white;
            padding: 15px;
            border-radius: 5px;
        }
        .info-grid {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
            gap: 15px;
            margin: 25px 0;
        }
        .info-item {
            background: #f5f5f5;
            padding: 15px;
            border-radius: 5px;
            text-align: center;
        }
        .info-label {
            font-weight: bold;
            color: #ff9800;
            margin-bottom: 5px;
            font-size: 14px;
        }
        .info-value {
            color: #333;
            font-size: 16px;
        }
        .message {
            text-align: center;
            padding: 20px;
            background: #fff3e0;
            border-radius: 8px;
            margin: 25px 0;
            font-size: 16px;
            line-height: 1.8;
        }
        .blessing {
            font-style: italic;
            color: #d84315;
            text-align: center;
            margin: 25px 0;
            padding: 15px;
            background: #ffecb3;
            border-radius: 8px;
            font-size: 18px;
        }
        .footer {
            background: #5d4037;
            color: white;
            padding: 25px;
            text-align: center;
            border-radius: 0 0 10px 10px;
        }
        .image-container {
            text-align: center;
            margin: 20px 0;
        }
        .image-container img {
            max-width: 200px;
            height: auto;
            border-radius: 5px;
            border: 2px solid #ffcc80;
        }
        .quote {
            font-style: italic;
            color: #666;
            text-align: center;
            margin: 20px 0;
            padding: 15px;
            border-left: 4px solid #ff9800;
            background: #fff8e1;
        }
    </style>
</head>
<body>
    <div class="email-container">
        <!-- Cabeçalho -->
        <div class="header">
            <div class="symbol">🕯️</div>
            <h1>Acendimento de Vela Virtual</h1>
            <p>Santuário de Fátima - Candelário Virtual</p>
        </div>
        
        <!-- Conteúdo Principal -->
        <div class="content">
            <!-- Animação da Vela -->
            <div class="candle-animation">
                🕯️
            </div>
            
            <!-- Saudação -->
            <div class="message">
                <p>Prezado(a) <strong>${name}</strong>,</p>
                <p>Sua vela foi acesa virtualmente no Santuário de Fátima!</p>
                <p>A luz desta vela simboliza sua fé, esperança e intenções elevadas a Deus.</p>
            </div>
            
            <!-- Informações -->
            <div class="info-grid">
                <div class="info-item">
                    <div class="info-label">Nome</div>
                    <div class="info-value">${name}</div>
                </div>
                <div class="info-item">
                    <div class="info-label">Data</div>
                    <div class="info-value">${currentDate}</div>
                </div>
                <div class="info-item">
                    <div class="info-label">Horário</div>
                    <div class="info-value">${currentTime}</div>
                </div>
                <div class="info-item">
                    <div class="info-label">Tipo de Vela</div>
                    <div class="info-value">${candleType === 'virtual' ? 'Virtual' : 'Física'}</div>
                </div>
            </div>
            
            <!-- Intenção -->
            <div class="intention-box">
                <div class="intention-title">Sua Intenção:</div>
                <div class="intention-content">
                    "${intention}"
                </div>
            </div>
            
            <!-- Imagem -->
            <div class="image-container">
                <img src="${imageAttachment ? 'cid:imagem-santuario' : 'https://via.placeholder.com/200x150/ff9800/ffffff?text=Vela+Acesa'}" alt="Nossa Senhora de Fátima">
            </div>
            
            <!-- Bênção -->
            <div class="blessing">
                "Que a luz de Cristo ilumine seu caminho<br>
                e Nossa Senhora de Fátima interceda por você!"
            </div>
            
            <!-- Citação -->
            <div class="quote">
                <p><strong>"Eu sou a luz do mundo; quem me segue não andará nas trevas, mas terá a luz da vida."</strong></p>
                <p><small>João 8:12</small></p>
            </div>
            
            <!-- Mensagem Final -->
            <div class="message">
                <p>Esta vela permanecerá acesa virtualmente por 24 horas, simbolizando sua intenção contínua em oração.</p>
                <p>Agradecemos sua devoção e confiança em nosso Santuário.</p>
            </div>
        </div>
        
        <!-- Rodapé -->
        <div class="footer">
            <h3>Santuário Nossa Senhora de Fátima</h3>
            <p>Candelário Virtual<br>
               📍 Santo Amaro - São Paulo<br>
               ✉️ santuariodefatima@santuariodefatima.com.br</p>
            <div style="margin-top: 15px; font-size: 12px; color: #ffcc80;">
                Este email confirma o acendimento de sua vela virtual.<br>
                Sua intenção será lembrada em nossas orações.
            </div>
        </div>
    </div>
</body>
</html>
      `
    };
    
    // Adicionar attachment se a imagem existir
    if (imageAttachment) {
      mailOptions.attachments = [imageAttachment];
    }
    
    const info = await transporter.sendMail(mailOptions);
    console.log(`✅ Email de vela enviado para ${email} - ID: ${info.messageId}`);
    
    return {
      success: true,
      type: 'candle_lighting_confirmation',
      messageId: info.messageId,
      message: 'Confirmação de acendimento de vela enviada com sucesso'
    };
    
  } catch (error) {
    console.error('❌ ERRO ao enviar email de acendimento de vela:', error.message);
    throw error;
  }
};



// FUNÇÃO 1: Email de CONFIRMAÇÃO para o FIEL (Enviado para o email do fiel)
export const sendConfirmationToUser = async (data) => {
  try {
    const { name, email, prayerRequest, cidade, enteQuerido } = data;
    const currentDate = new Date().toLocaleDateString('pt-BR', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
    const currentTime = new Date().toLocaleTimeString('pt-BR');
    
    console.log(`📧 Enviando CONFIRMAÇÃO para fiel: ${name} (${email})`);
    
    // Verificar se a imagem existe
    let imageAttachment = null;
    const imagePath = join(__dirname, '..', '..', '..', 'frontend', 'public', 'nossa-senhora-fatima.png');
    if (!email) {
      console.log(`🕯️ Vela acesa para ${name}, mas sem envio de email (email não fornecido)`);
      return {
        success: true,
        type: 'candle_lighting_no_email',
        message: 'Vela acesa virtualmente (sem envio de email)'
      };
    }
    if (existsSync(imagePath)) {
      console.log('✅ Imagem encontrada para email de confirmação');
      imageAttachment = {
        filename: 'nossa-senhora-fatima.png',
        path: imagePath,
        cid: 'imagem-santuario'
      };
    } else {
      console.log('⚠️ Imagem não encontrada, usando URL online como fallback');
    }
    
    const mailOptions = {
      from: EMAIL_FROM,
      to: email, // ENVIADO PARA O EMAIL DO FIEL
      subject: '✅ Confirmação de Pedido de Oração - Santuário de Fátima',
      html: `
<!DOCTYPE html>
<html lang="pt-BR">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Confirmação de Pedido de Oração</title>
    <style>
        * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
        }
        body {
            font-family: 'Georgia', serif;
            line-height: 1.6;
            color: #333;
            background-color: #f8f9fa;
            padding: 20px;
        }
        .email-container {
            max-width: 700px;
            margin: 0 auto;
            background: white;
            border-radius: 10px;
            overflow: hidden;
            box-shadow: 0 4px 20px rgba(0,0,0,0.1);
        }
        .header {
            background: linear-gradient(135deg, #1e5799 0%, #207cca 100%);
            color: white;
            padding: 30px 20px;
            text-align: center;
        }
        .header h1 {
            font-size: 28px;
            margin-bottom: 10px;
            font-weight: normal;
        }
        .header .peace {
            font-size: 18px;
            margin-bottom: 20px;
            color: #e6f7ff;
        }
        .content {
            padding: 30px;
        }
        .user-info {
            display: flex;
            align-items: center;
            margin-bottom: 25px;
            padding: 15px;
            background: #f0f8ff;
            border-radius: 8px;
            border-left: 4px solid #1e5799;
        }
        .user-text {
            flex: 1;
        }
        .user-name {
            font-size: 22px;
            color: #1e5799;
            font-weight: bold;
            margin-bottom: 5px;
        }
        .user-email {
            color: #666;
            font-size: 14px;
        }
        .message-box {
            background: #fff9e6;
            border: 1px solid #ffeb99;
            border-radius: 8px;
            padding: 25px;
            margin: 20px 0;
            position: relative;
        }
        .message-box:before {
            content: "🙏";
            position: absolute;
            top: -15px;
            left: 20px;
            background: white;
            padding: 0 10px;
            font-size: 20px;
        }
        .message-title {
            color: #996600;
            margin-bottom: 15px;
            font-size: 18px;
        }
        .message-content {
            font-style: italic;
            line-height: 1.8;
            color: #333;
        }
        .divider {
            height: 1px;
            background: linear-gradient(to right, transparent, #ccc, transparent);
            margin: 30px 0;
        }
        .confirmation-text {
            text-align: center;
            font-size: 16px;
            line-height: 1.8;
            color: #444;
            margin-bottom: 25px;
        }
        .highlight {
            color: #1e5799;
            font-weight: bold;
        }
        .footer {
            background: #2c3e50;
            color: white;
            padding: 25px;
            text-align: center;
            border-radius: 0 0 10px 10px;
        }
        .footer h3 {
            font-size: 20px;
            margin-bottom: 15px;
            color: #f8f9fa;
        }
        .contact-info {
            font-size: 14px;
            color: #bdc3c7;
            margin-top: 15px;
        }
        .logo {
            font-size: 24px;
            font-weight: bold;
            color: #f8f9fa;
            margin-bottom: 10px;
            letter-spacing: 1px;
        }
        .image-container {
            text-align: center;
            margin: 20px 0;
        }
        .image-container img {
            max-width: 250px;
            height: auto;
            border-radius: 5px;
            border: 2px solid #e6f7ff;
        }
        .signature {
            margin-top: 25px;
            padding-top: 20px;
            border-top: 1px solid #eee;
            font-style: italic;
            color: #666;
            text-align: center;
        }
        .quote {
            background: #f8f9fa;
            border-left: 4px solid #3498db;
            padding: 15px;
            margin: 20px 0;
            font-style: italic;
            color: #555;
        }
    </style>
</head>
<body>
    <div class="email-container">
        <!-- Cabeçalho -->
        <div class="header">
            <div class="logo">Santuário de Fátima</div>
            <h1>Confirmação de Pedido de Oração</h1>
            <div class="peace">Paz e bem!</div>
        </div>
        
        <!-- Conteúdo Principal -->
        <div class="content">
            <!-- Informações do Fiel com Imagem -->
            <div class="user-info">
                <div class="user-text">
                    <div class="user-name">Sr(a) ${name}</div>
                    <div class="user-email">${email}</div>
                </div>
                <div class="image-container">
                    <img src="${imageAttachment ? 'cid:imagem-santuario' : 'https://via.placeholder.com/250x150/1e5799/ffffff?text=Nossa+Senhora+de+Fátima'}" alt="Nossa Senhora de Fátima">
                </div>
            </div>
            
            <!-- Mensagem de Confirmação -->
            <div class="confirmation-text">
                <p>Recebemos com carinho o seu pedido de oração e agradecemos a confiança em partilhar conosco essa intenção.</p>
                
                <p class="quote">
                    <strong>"Tudo posso naquele que me fortalece."</strong><br>
                    <small>Filipenses 4:13</small>
                </p>
                
                <p>Saiba que sua súplica será apresentada a Deus em nossas orações, confiando tudo à Sua infinita misericórdia, em Cristo e sob a intercessão de Nossa Senhora de Fátima, que nos convida à oração, à conversão e à esperança.</p>
                
                <p>Cremos que o Senhor escuta o clamor do coração e age sempre para o nosso bem. Que o Espírito Santo lhe conceda paz, conforto e fortaleza.</p>
                
                <p><strong>Conte com nossas orações.</strong></p>
            </div>
            
            <!-- Detalhes do Pedido -->
            <div class="message-box">
                <div class="message-title">Seu Pedido de Oração:</div>
                <div class="message-content">
                    ${enteQuerido ? `<p><strong>Intenção por:</strong> ${enteQuerido}</p>` : ''}
                    ${cidade ? `<p><strong>Local:</strong> ${cidade}</p>` : ''}
                    <p><strong>Data do pedido:</strong> ${currentDate} às ${currentTime}</p>
                    <p><strong>Mensagem:</strong><br>${prayerRequest.replace(/\n/g, '<br>')}</p>
                </div>
            </div>
            
            <!-- Assinatura -->
            <div class="signature">
                <p>Em Cristo e Nossa Senhora de Fátima,</p>
                <p><strong>Santuário Nossa Senhora de Fátima - Santo Amaro</strong></p>
            </div>
        </div>
        
        <!-- Rodapé -->
        <div class="footer">
            <h3>Nossa Senhora de Fátima</h3>
            <p>📍 Santo Amaro - São Paulo<br>
               📞 (11) 1234-5678<br>
               ✉️ santuariodefatima@santuariodefatima.com.br</p>
            <div class="contact-info">
                Este email foi enviado automaticamente em resposta ao seu pedido de oração.<br>
                Sua intenção será incluída em nossas próximas celebrações.
            </div>
        </div>
    </div>
</body>
</html>
      `
    };
    
    // Adicionar attachment se a imagem existir
    if (imageAttachment) {
      mailOptions.attachments = [imageAttachment];
    }
    
    const info = await transporter.sendMail(mailOptions);
    console.log(`✅ CONFIRMAÇÃO enviada para ${email} - ID: ${info.messageId}`);
    
    return {
      success: true,
      type: 'confirmation_to_user',
      messageId: info.messageId
    };
    
  } catch (error) {
    console.error('❌ ERRO ao enviar confirmação para o fiel:', error.message);
    throw error;
  }
};

// FUNÇÃO 2: Email de SOLICITAÇÃO para a SECRETARIA (Email fixo)
export const sendRequestToSecretary = async (data) => {
  try {
    const { name, email, prayerRequest, cidade, enteQuerido } = data;
    const currentDate = new Date().toLocaleDateString('pt-BR');
    
    console.log(`📧 Enviando SOLICITAÇÃO para secretaria em nome de: ${name}`);
    
    // Verificar se a imagem existe
    let imageAttachment = null;
    const imagePath = join(__dirname, '..', '..', '..', 'frontend', 'public', 'nossa-senhora-fatima.png');
    
    if (existsSync(imagePath)) {
      console.log('✅ Imagem encontrada para email da secretaria');
      imageAttachment = {
        filename: 'nossa-senhora-fatima.png',
        path: imagePath,
        cid: 'imagem-santuario'
      };
    }
    
    const mailOptions = {
      from: EMAIL_FROM,
      to: SANTUARIOS_EMAIL, // EMAIL FIXO DA SECRETARIA
      subject: `📿 SOLICITAÇÃO de Pedido de Oração - ${name}`,
      html: `
<!DOCTYPE html>
<html lang="pt-BR">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Solicitação de Pedido de Oração</title>
    <style>
        * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
        }
        body {
            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
            line-height: 1.6;
            color: #333;
            background-color: #f5f7fa;
        }
        .email-container {
            max-width: 800px;
            margin: 0 auto;
            background: white;
        }
        .header {
            background: #2c3e50;
            color: white;
            padding: 25px;
            text-align: center;
        }
        .header h1 {
            font-size: 24px;
            margin-bottom: 10px;
        }
        .content {
            padding: 30px;
        }
        .alert-box {
            background: #fff3cd;
            border: 2px solid #ffeaa7;
            border-radius: 8px;
            padding: 20px;
            margin-bottom: 25px;
            text-align: center;
            font-weight: bold;
            color: #856404;
            font-size: 18px;
        }
        .request-info {
            background: #e8f4fc;
            border-radius: 8px;
            padding: 25px;
            margin: 20px 0;
            border-left: 5px solid #1e5799;
        }
        .info-grid {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
            gap: 15px;
            margin-top: 20px;
        }
        .info-item {
            background: white;
            padding: 15px;
            border-radius: 5px;
            border: 1px solid #e0e0e0;
        }
        .info-label {
            font-weight: bold;
            color: #1e5799;
            margin-bottom: 5px;
            font-size: 14px;
        }
        .info-value {
            color: #333;
            font-size: 16px;
        }
        .prayer-content {
            background: #f8f9fa;
            border: 1px solid #dee2e6;
            border-radius: 8px;
            padding: 25px;
            margin: 25px 0;
            font-style: italic;
            line-height: 1.8;
            white-space: pre-wrap;
        }
        .action-required {
            background: #d4edda;
            border: 2px solid #c3e6cb;
            border-radius: 8px;
            padding: 20px;
            margin: 25px 0;
            text-align: center;
        }
        .footer {
            background: #34495e;
            color: white;
            padding: 25px;
            text-align: center;
            margin-top: 30px;
        }
        .image-section {
            display: flex;
            align-items: center;
            gap: 30px;
            margin: 25px 0;
            padding: 20px;
            background: #f0f8ff;
            border-radius: 8px;
        }
        .image-container img {
            max-width: 200px;
            height: auto;
            border-radius: 5px;
            border: 2px solid #1e5799;
        }
        .user-highlight {
            font-size: 20px;
            color: #1e5799;
            font-weight: bold;
        }
    </style>
</head>
<body>
    <div class="email-container">
        <!-- Cabeçalho -->
        <div class="header">
            <h1>📿 SOLICITAÇÃO DE PEDIDO DE ORAÇÃO</h1>
            <p>Novo pedido recebido através do site</p>
        </div>
        
        <!-- Conteúdo Principal -->
        <div class="content">
            <!-- Alerta de Ação Requerida -->
            <div class="alert-box">
                ⚠️ ATENÇÃO: Favor incluir o nome abaixo na lista de intenções
            </div>
            
            <!-- Seção com Imagem e Nome -->
            <div class="image-section">
                <div class="image-container">
                    <img src="${imageAttachment ? 'cid:imagem-santuario' : 'https://via.placeholder.com/200x150/1e5799/ffffff?text=Nossa+Senhora'}" alt="Nossa Senhora de Fátima">
                </div>
                <div style="flex: 1;">
                    <div class="user-highlight">Pedido de Oração</div>
                    <div style="font-size: 24px; color: #2c3e50; margin-top: 10px; font-weight: bold;">
                        ${name}
                    </div>
                    <div style="margin-top: 10px; color: #666;">
                        Solicitado por: ${enteQuerido || 'Intenção pessoal'}
                    </div>
                </div>
            </div>
            
            <!-- Informações Detalhadas -->
            <div class="request-info">
                <h2 style="color: #1e5799; margin-bottom: 20px;">📋 DETALHES DO PEDIDO</h2>
                
                <div class="info-grid">
                    <div class="info-item">
                        <div class="info-label">Nome Completo</div>
                        <div class="info-value">${name}</div>
                    </div>
                    
                    <div class="info-item">
                        <div class="info-label">Email de Contato</div>
                        <div class="info-value">${email}</div>
                    </div>
                    
                    <div class="info-item">
                        <div class="info-label">Localização</div>
                        <div class="info-value">${cidade || 'Não informado'}</div>
                    </div>
                    
                    <div class="info-item">
                        <div class="info-label">Data do Pedido</div>
                        <div class="info-value">${currentDate}</div>
                    </div>
                </div>
            </div>
            
            <!-- Conteúdo da Oração -->
            <div>
                <h3 style="color: #2c3e50; margin-bottom: 15px;">📖 PEDIDO DE ORAÇÃO</h3>
                <div class="prayer-content">
                    ${prayerRequest.replace(/\n/g, '<br>')}
                </div>
            </div>
            
            <!-- Ação Requerida -->
            <div class="action-required">
                <h3 style="color: #155724; margin-bottom: 15px;">✅ AÇÃO NECESSÁRIA</h3>
                <p style="font-size: 16px;">
                    <strong>Favor incluir o nome do Sr(a) <span style="color: #1e5799;">${name}</span> na lista de intenções das próximas celebrações.</strong>
                </p>
                <p style="margin-top: 10px;">
                    Uma confirmação automática já foi enviada para o email do fiel.
                </p>
            </div>
            
            <!-- Rodapé Técnico -->
            <div style="margin-top: 30px; padding: 15px; background: #f8f9fa; border-radius: 5px; font-size: 12px; color: #666;">
                <strong>Informações Técnicas:</strong><br>
                • ID do Pedido: ${Date.now()}<br>
                • Recebido em: ${new Date().toISOString()}<br>
                • Sistema: Site Santuário de Fátima - Módulo de Oração
            </div>
        </div>
        
        <!-- Rodapé -->
        <div class="footer">
            <h3>Santuário Nossa Senhora de Fátima</h3>
            <p>Secretaria Pastoral<br>
               Email: santuariodefatima@santuariodefatima.com.br<br>
               Tel: (11) 1234-5678</p>
            <p style="margin-top: 15px; font-size: 12px; color: #bdc3c7;">
                Este email foi gerado automaticamente pelo sistema de pedidos de oração.
            </p>
        </div>
    </div>
</body>
</html>
      `
    };
    
    // Adicionar attachment se a imagem existir
    if (imageAttachment) {
      mailOptions.attachments = [imageAttachment];
    }
    
    const info = await transporter.sendMail(mailOptions);
    console.log(`✅ SOLICITAÇÃO enviada para secretaria - ID: ${info.messageId}`);
    
    return {
      success: true,
      type: 'request_to_secretary',
      messageId: info.messageId
    };
    
  } catch (error) {
    console.error('❌ ERRO ao enviar solicitação para secretaria:', error.message);
    throw error;
  }
};

// FUNÇÃO 3: Enviar AMBOS os emails (chamada principal)
export const sendPrayerRequestEmail = async (data) => {
  try {
    console.log('📧 Iniciando envio DUPLO de emails...');
    
    // Enviar email de confirmação para o fiel
    const confirmationResult = await sendConfirmationToUser(data);
    
    // Enviar email de solicitação para a secretaria
    const secretaryResult = await sendRequestToSecretary(data);
    
    console.log('✅ ✅ AMBOS os emails enviados com sucesso!');
    
    return {
      success: true,
      confirmation: confirmationResult,
      secretary: secretaryResult,
      message: 'Pedido de oração registrado e emails enviados'
    };
    
  } catch (error) {
    console.error('❌ ERRO no envio duplo de emails:', error.message);
    throw error;
  }
};

// FUNÇÃO 4: Testar sistema de email
export const testEmailSystem = async (testEmail = 'oibreccio@hotmail.com') => {
  try {
    console.log('🧪 TESTANDO SISTEMA DE EMAIL DUPLO...');
    
    // Testar conexão
    await new Promise((resolve, reject) => {
      transporter.verify((error, success) => {
        if (error) {
          console.error('❌ Falha na conexão SMTP:', error.message);
          reject(error);
        } else {
          console.log('✅ Conexão SMTP verificada');
          resolve(success);
        }
      });
    });
    
    // Testar com dados de exemplo
    const testData = {
      name: "João da Silva",
      email: testEmail,
      prayerRequest: "Peço orações pela saúde da minha mãe Maria que está enfrentando tratamento médico difícil. Que Deus dê força e cura para ela.",
      cidade: "São Paulo - SP",
      enteQuerido: "Minha mãe Maria"
    };
    
    console.log(`📤 Testando envio para: ${testEmail}`);
    const result = await sendPrayerRequestEmail(testData);
    
    console.log('✅ Sistema de email funcionando perfeitamente!');
    return result;
    
  } catch (error) {
    console.error('❌ FALHA NO SISTEMA DE EMAIL:', error.message);
    throw error;
  }
};

// Exportar configuração
export const emailConfig = {
  from: EMAIL_FROM,
  santuariosEmail: SANTUARIOS_EMAIL,
  transporter: transporter
};