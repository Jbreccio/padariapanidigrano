import nodemailer from 'nodemailer';

// Configuração SIMPLES
const transporter = nodemailer.createTransport({
  host: process.env.EMAIL_HOST,
  port: parseInt(process.env.EMAIL_PORT) || 465,
  secure: true,
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASSWORD
  },
  tls: {
    rejectUnauthorized: false
  }
});

// Testar conexão email
transporter.verify((error, success) => {
  if (error) {
    console.error('❌ Email não configurado:', error.message);
    console.log('💡 Configure o .env com credenciais do Hostinger');
  } else {
    console.log('✅ Email configurado!');
  }
});

export const sendPinEmail = async (to, nome, pinCode, secret, qrCodeUrl) => {
  try {
    const mailOptions = {
      from: `"Santuário de Fátima" <${process.env.EMAIL_USER}>`,
      to: to,
      subject: 'Cadastro - PIN Code e Google Authenticator',
      html: `
        <div style="font-family: Arial, sans-serif; padding: 20px;">
          <h2 style="color: #1a237e;">Olá ${nome}!</h2>
          <p>Seu cadastro como adminiistrador foi realizado com sucesso.</p>
          
          <div style="background: #f5f5f5; padding: 15px; border-radius: 5px; margin: 15px 0;">
            <h3 style="color: #d32f2f;">🔐 Configuração de Segurança</h3>
            
            <p><strong>Seu PIN Code:</strong></p>
            <div style="background: white; padding: 10px; border: 2px solid #1a237e; font-size: 24px; text-align: center; margin: 10px 0;">
              ${pinCode}
            </div>
            <p><em>Guarde este PIN! Você precisará dele para fazer login.</em></p>
            
            <hr style="margin: 20px 0;">
            
            <h4>📱 Google Authenticator</h4>
            <p>Para configurar:</p>
            <ol>
              <li>Instale o app <strong>Google Authenticator</strong> no seu celular</li>
              <li>Escaneie o QR Code abaixo:</li>
              <img src="${qrCodeUrl}" alt="QR Code" style="display: block; margin: 10px auto; border: 1px solid #ccc; padding: 5px;">
              <li><strong>OU</strong> digite manualmente:</li>
              <div style="background: white; padding: 10px; border: 1px dashed #666; font-family: monospace; word-break: break-all;">
                ${secret}
              </div>
            </ol>
          </div>
          
          <p style="color: #666; font-size: 12px; margin-top: 20px; border-top: 1px solid #eee; padding-top: 10px;">
            Este é um email automático. Não responda.<br>
            Santuário de Fátima © ${new Date().getFullYear()}
          </p>
        </div>
      `
    };

    const info = await transporter.sendMail(mailOptions);
    console.log('✅ Email enviado para:', to);
    return info;
  } catch (error) {
    console.error('❌ Erro ao enviar email:', error.message);
    throw error;
  }
};

export default transporter;