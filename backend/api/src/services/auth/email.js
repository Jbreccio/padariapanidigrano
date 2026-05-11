// backend/api/src/auth/email.js
// Serviço de email para autenticação

export class EmailService {
  constructor(env) {
    this.env = env;
  }

  async sendEmail(to, subject, html) {
    try {
      if (!this.env.RESEND_API_KEY) {
        console.warn('⚠️ RESEND_API_KEY não configurado');
        return false;
      }

      const response = await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.env.RESEND_API_KEY}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          from: 'Santuario de Fatima <noreply@mail.santuariodefatima.com.br>',
          to: [to],
          subject,
          html
        })
      });

      if (response.ok) {
        console.log(`✅ Email enviado para ${to}`);
        return true;
      } else {
        console.error('❌ Erro ao enviar email:', await response.text());
        return false;
      }
    } catch (error) {
      console.error('Erro no serviço de email:', error);
      return false;
    }
  }

  async sendVerificationEmail(email, nome, codigo) {
    const html = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="UTF-8">
        <title>Verificação de Email - Santuário de Fátima</title>
        <style>
          body { font-family: 'Georgia', serif; background: #f5f5f5; margin: 0; padding: 20px; }
          .container { max-width: 600px; margin: 0 auto; background: white; border-radius: 16px; overflow: hidden; box-shadow: 0 10px 30px rgba(0,0,0,0.1); }
          .header { background: #0b3b5c; color: white; padding: 30px; text-align: center; }
          .header h1 { margin: 0; font-size: 24px; }
          .content { padding: 40px; }
          .code { font-size: 32px; font-weight: bold; text-align: center; padding: 20px; background: #f0f7ff; border-radius: 8px; margin: 20px 0; letter-spacing: 5px; }
          .footer { background: #f8f9fa; padding: 20px; text-align: center; color: #666; font-size: 12px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>✝️ Santuário de Fátima</h1>
            <p>Verificação de Email</p>
          </div>
          <div class="content">
            <p>Olá <strong>${nome}</strong>,</p>
            <p>Obrigado por se cadastrar no Santuário de Fátima! Use o código abaixo para verificar seu email:</p>
            <div class="code">${codigo}</div>
            <p>Este código expira em 15 minutos.</p>
            <p>Se você não solicitou este cadastro, ignore este email.</p>
          </div>
          <div class="footer">
            <p>Santuário Nossa Senhora de Fátima - Santo Amaro</p>
            <p>Rua Darwin, 651 - São Paulo - SP</p>
          </div>
        </div>
      </body>
      </html>
    `;
    
    return this.sendEmail(email, 'Verifique seu email - Santuário de Fátima', html);
  }

  async sendPasswordResetEmail(email, nome, token) {
    const resetLink = `${process.env.FRONTEND_URL}/reset-senha?token=${token}`;
    const html = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="UTF-8">
        <title>Recuperação de Senha - Santuário de Fátima</title>
        <style>
          body { font-family: 'Georgia', serif; background: #f5f5f5; margin: 0; padding: 20px; }
          .container { max-width: 600px; margin: 0 auto; background: white; border-radius: 16px; overflow: hidden; }
          .header { background: #0b3b5c; color: white; padding: 30px; text-align: center; }
          .content { padding: 40px; }
          .button { display: inline-block; padding: 12px 24px; background: #0b3b5c; color: white; text-decoration: none; border-radius: 8px; margin: 20px 0; }
          .footer { background: #f8f9fa; padding: 20px; text-align: center; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>🔐 Recuperação de Senha</h1>
          </div>
          <div class="content">
            <p>Olá <strong>${nome}</strong>,</p>
            <p>Recebemos uma solicitação para redefinir sua senha. Clique no botão abaixo para criar uma nova senha:</p>
            <div style="text-align: center;">
              <a href="${resetLink}" class="button">Redefinir Senha</a>
            </div>
            <p>Se o botão não funcionar, copie e cole o link abaixo no seu navegador:</p>
            <p style="word-break: break-all;">${resetLink}</p>
            <p>Este link expira em 1 hora.</p>
            <p>Se você não solicitou esta alteração, ignore este email.</p>
          </div>
          <div class="footer">
            <p>Santuário Nossa Senhora de Fátima</p>
          </div>
        </div>
      </body>
      </html>
    `;
    
    return this.sendEmail(email, 'Recuperação de Senha - Santuário de Fátima', html);
  }

  async sendTwoFactorEmail(email, nome, codigo) {
    const html = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="UTF-8">
        <title>Código 2FA - Santuário de Fátima</title>
        <style>
          body { font-family: 'Georgia', serif; background: #f5f5f5; margin: 0; padding: 20px; }
          .container { max-width: 600px; margin: 0 auto; background: white; border-radius: 16px; overflow: hidden; }
          .header { background: #0b3b5c; color: white; padding: 30px; text-align: center; }
          .code { font-size: 36px; font-weight: bold; text-align: center; padding: 20px; background: #f0f7ff; margin: 20px 0; letter-spacing: 5px; }
          .footer { background: #f8f9fa; padding: 20px; text-align: center; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>🔐 Código de Verificação</h1>
          </div>
          <div class="content">
            <p>Olá <strong>${nome}</strong>,</p>
            <p>Use o código abaixo para completar seu login:</p>
            <div class="code">${codigo}</div>
            <p>Este código expira em 5 minutos.</p>
            <p>Se você não tentou fazer login, ignore este email e verifique a segurança da sua conta.</p>
          </div>
          <div class="footer">
            <p>Santuário Nossa Senhora de Fátima</p>
          </div>
        </div>
      </body>
      </html>
    `;
    
    return this.sendEmail(email, 'Código de Verificação - Santuário de Fátima', html);
  }
}

export default EmailService;