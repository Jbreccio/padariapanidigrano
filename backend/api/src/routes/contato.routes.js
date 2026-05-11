// backend/src/routes/contato.routes.js
import express from 'express';
import nodemailer from 'nodemailer';

const router = express.Router();

// Configuração do transporter de email
const createTransporter = () => {
  console.log('📧 Configurando transporter SMTP...');
  console.log('📧 Host:', process.env.EMAIL_HOST);
  console.log('📧 Port:', process.env.EMAIL_PORT);
  console.log('📧 User:', process.env.EMAIL_USER);
  console.log('📧 Pass exists:', !!process.env.EMAIL_PASS);
  console.log('📧 Email enabled:', process.env.EMAIL_ENABLED !== 'false');
  
  return nodemailer.createTransport({
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
    debug: true, // Habilita debug do nodemailer
    logger: true  // Log no console
  });
};

// Rota para enviar contato
router.post('/enviar', async (req, res) => {
  try {
    console.log('\n🎯 ============================================');
    console.log('📨 NOVA MENSAGEM DE CONTATO RECEBIDA!');
    console.log('============================================\n');
    
    const { nome, email, telefone, assunto, mensagem } = req.body;

    // Validação básica
    if (!nome || !email || !mensagem) {
      console.log('❌ Validação falhou: campos obrigatórios ausentes');
      return res.status(400).json({
        success: false,
        message: 'Nome, email e mensagem são obrigatórios',
        camposFaltando: {
          nome: !nome,
          email: !email,
          mensagem: !mensagem
        }
      });
    }

    console.log('✅ Dados recebidos:');
    console.log('👤 Nome:', nome);
    console.log('📧 Email:', email);
    console.log('📞 Telefone:', telefone || '(Não informado)');
    console.log('📝 Assunto:', assunto || '(Sem assunto)');
    console.log('💬 Mensagem:', mensagem.substring(0, 100) + '...');
    console.log('\n');

    // Verificar se o email está configurado
    const isEmailDisabled = process.env.EMAIL_ENABLED === 'false';
    const hasEmailConfig = process.env.EMAIL_USER && process.env.EMAIL_PASS;
    
    if (isEmailDisabled || !hasEmailConfig) {
      console.log('⚠️  Modo simulação:');
      console.log('- EMAIL_ENABLED:', process.env.EMAIL_ENABLED);
      console.log('- EMAIL_USER configurado?:', !!process.env.EMAIL_USER);
      console.log('- EMAIL_PASS configurado?:', !!process.env.EMAIL_PASS);
      console.log('📝 Email NÃO será enviado, apenas simulado');

      // Simular delay de envio
      await new Promise(resolve => setTimeout(resolve, 1000));

      return res.json({
        success: true,
        message: 'Mensagem recebida (modo desenvolvimento)',
        data: {
          nome,
          email,
          assunto: assunto || '(Sem assunto)',
          recebidoEm: new Date().toISOString(),
          modo: 'simulação',
          timestamp: new Date().toLocaleString('pt-BR')
        },
        aviso: 'Email não enviado - Modo desenvolvimento ativo',
        timestamp: new Date().toISOString()
      });
    }

    console.log('🚀 Iniciando envio de email REAL...');
    
    // Configurar email
    const transporter = createTransporter();

    // Testar conexão SMTP
    console.log('🔌 Testando conexão SMTP...');
    await transporter.verify();
    console.log('✅ Conexão SMTP OK!');

    // Email para o santuário
    const mailOptions = {
      from: `"Site Santuário de Fátima" <${process.env.EMAIL_USER}>`,
      to: process.env.EMAIL_USER,
      replyTo: email,
      subject: `📧 CONTATO DO SITE: ${assunto || 'Nova Mensagem'} - ${nome}`,
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; }
            .header { background: linear-gradient(135deg, #1e3c72 0%, #2a5298 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
            .content { background: #f9f9f9; padding: 25px; border: 1px solid #ddd; border-top: none; border-radius: 0 0 10px 10px; }
            .field { margin-bottom: 20px; padding: 15px; background: white; border-radius: 5px; box-shadow: 0 2px 5px rgba(0,0,0,0.1); }
            .label { font-weight: bold; color: #2c3e50; font-size: 14px; margin-bottom: 5px; }
            .value { font-size: 16px; color: #34495e; }
            .footer { margin-top: 30px; text-align: center; color: #7f8c8d; font-size: 12px; border-top: 1px solid #ecf0f1; padding-top: 15px; }
            .badge { display: inline-block; padding: 3px 10px; background: #3498db; color: white; border-radius: 20px; font-size: 12px; margin-left: 10px; }
          </style>
        </head>
        <body>
          <div class="header">
            <h1>📬 Nova Mensagem do Site</h1>
            <p>Santuário de Fátima - Santo Amaro</p>
          </div>
          
          <div class="content">
            <div class="field">
              <div class="label">👤 Nome:</div>
              <div class="value">${nome}</div>
            </div>
            
            <div class="field">
              <div class="label">📧 Email:</div>
              <div class="value">${email} <span class="badge">Responder para este email</span></div>
            </div>
            
            ${telefone ? `
            <div class="field">
              <div class="label">📞 Telefone:</div>
              <div class="value">${telefone}</div>
            </div>
            ` : ''}
            
            ${assunto ? `
            <div class="field">
              <div class="label">📝 Assunto:</div>
              <div class="value">${assunto}</div>
            </div>
            ` : ''}
            
            <div class="field">
              <div class="label">💬 Mensagem:</div>
              <div class="value" style="white-space: pre-line;">${mensagem.replace(/\n/g, '<br>')}</div>
            </div>
            
            <div class="field">
              <div class="label">⏰ Data/Hora:</div>
              <div class="value">${new Date().toLocaleString('pt-BR')}</div>
            </div>
            
            <div class="field">
              <div class="label">🌐 Origem:</div>
              <div class="value">Formulário de Contato do Site</div>
            </div>
          </div>
          
          <div class="footer">
            <p>Este email foi enviado automaticamente através do formulário de contato do site do Santuário de Fátima.</p>
            <p>Santuário de Fátima &copy; ${new Date().getFullYear()} | Santo Amaro - São Paulo</p>
          </div>
        </body>
        </html>
      `,
      text: `
        NOVA MENSAGEM DO SITE - SANTUÁRIO DE FÁTIMA
        ===========================================
        
        👤 Nome: ${nome}
        📧 Email: ${email} (Responder para este email)
        ${telefone ? `📞 Telefone: ${telefone}` : ''}
        ${assunto ? `📝 Assunto: ${assunto}` : ''}
        
        💬 Mensagem:
        ${mensagem}
        
        ⏰ Data/Hora: ${new Date().toLocaleString('pt-BR')}
        🌐 Origem: Formulário de Contato do Site
        
        ===========================================
        Santuário de Fátima &copy; ${new Date().getFullYear()}
        Santo Amaro - São Paulo
      `
    };

    console.log('📤 Enviando email principal para:', process.env.EMAIL_USER);
    const info = await transporter.sendMail(mailOptions);
    console.log('✅ Email principal enviado! Message ID:', info.messageId);

    // Email de confirmação para o remetente
    console.log('📤 Enviando email de confirmação para:', email);
    const confirmacaoOptions = {
      from: `"Santuário de Fátima - Santo Amaro" <${process.env.EMAIL_USER}>`,
      to: email,
      subject: '✅ Confirmação de Recebimento - Santuário de Fátima',
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <style>
            body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; }
            .header { background: linear-gradient(135deg, #2c3e50 0%, #3498db 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
            .content { background: #ffffff; padding: 30px; border: 1px solid #e0e0e0; border-top: none; border-radius: 0 0 10px 10px; }
            .message-box { background: #f8f9fa; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #3498db; }
            .footer { margin-top: 30px; text-align: center; color: #7f8c8d; font-size: 12px; border-top: 1px solid #ecf0f1; padding-top: 15px; }
            .icon { font-size: 48px; margin-bottom: 20px; }
            .button { display: inline-block; background: #3498db; color: white; padding: 12px 25px; text-decoration: none; border-radius: 5px; margin-top: 15px; }
          </style>
        </head>
        <body>
          <div class="header">
            <div class="icon">🙏</div>
            <h1>Mensagem Recebida com Sucesso!</h1>
          </div>
          
          <div class="content">
            <p>Prezado(a) <strong>${nome}</strong>,</p>
            
            <div class="message-box">
              <p>📬 <strong>Sua mensagem foi recebida com sucesso!</strong></p>
              <p>Nossa equipe do Santuário de Fátima agradece seu contato e responderá o mais breve possível.</p>
            </div>
            
            <p><strong>📋 Resumo do seu contato:</strong></p>
            <ul style="background: #f8f9fa; padding: 15px; border-radius: 5px;">
              <li><strong>Assunto:</strong> ${assunto || 'Contato Geral'}</li>
              <li><strong>Data:</strong> ${new Date().toLocaleDateString('pt-BR')}</li>
              <li><strong>Hora:</strong> ${new Date().toLocaleTimeString('pt-BR')}</li>
              <li><strong>Protocolo:</strong> ${info.messageId || 'SF-' + Date.now()}</li>
            </ul>
            
            <p style="margin-top: 25px;">
              <em>"Que Nossa Senhora de Fátima abençoe você e sua família, concedendo-lhes paz, saúde e proteção divina."</em>
            </p>
            
            <p style="text-align: center; margin-top: 30px;">
              <a href="https://www.santuariodefatima.net" class="button">Visitar Nosso Site</a>
            </p>
            
            <p style="margin-top: 30px;">
              Atenciosamente,<br>
              <strong>Equipe do Santuário de Fátima</strong><br>
              Santo Amaro - São Paulo
            </p>
          </div>
          
          <div class="footer">
            <p>Este é um email automático. Por favor, não responda esta mensagem.</p>
            <p>Se você não enviou esta mensagem, por favor ignore este email.</p>
            <p>Santuário de Fátima &copy; ${new Date().getFullYear()} | Todos os direitos reservados</p>
          </div>
        </body>
        </html>
      `,
      text: `
        CONFIRMAÇÃO DE RECEBIMENTO - SANTUÁRIO DE FÁTIMA
        ================================================
        
        Prezado(a) ${nome},
        
        Sua mensagem foi recebida com sucesso!
        
        📋 Resumo do seu contato:
        • Assunto: ${assunto || 'Contato Geral'}
        • Data: ${new Date().toLocaleDateString('pt-BR')}
        • Hora: ${new Date().toLocaleTimeString('pt-BR')}
        • Protocolo: ${info.messageId || 'SF-' + Date.now()}
        
        Nossa equipe agradece seu contato e responderá o mais breve possível.
        
        "Que Nossa Senhora de Fátima abençoe você e sua família."
        
        Atenciosamente,
        Equipe do Santuário de Fátima
        Santo Amaro - São Paulo
        
        ================================================
        Este é um email automático. Não responda esta mensagem.
        Santuário de Fátima &copy; ${new Date().getFullYear()}
      `
    };

    await transporter.sendMail(confirmacaoOptions);
    console.log('✅ Email de confirmação enviado com sucesso!');

    // Resposta de sucesso
    console.log('\n🎉 ============================================');
    console.log('✅ PROCESSO COMPLETADO COM SUCESSO!');
    console.log('✅ 1. Mensagem recebida do frontend');
    console.log('✅ 2. Email enviado para o santuário');
    console.log('✅ 3. Confirmação enviada para o remetente');
    console.log('============================================\n');

    res.json({
      success: true,
      message: 'Mensagem enviada com sucesso',
      data: {
        nome,
        email,
        assunto: assunto || '(Sem assunto)',
        messageId: info.messageId,
        enviadoEm: new Date().toISOString(),
        timestamp: new Date().toLocaleString('pt-BR'),
        emailsEnviados: 2
      },
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('\n❌ ============================================');
    console.error('💥 ERRO CRÍTICO NO ENVIO DE EMAIL:');
    console.error('============================================\n');
    console.error('Mensagem:', error.message);
    console.error('Stack:', error.stack);
    
    if (error.code) {
      console.error('Código do erro:', error.code);
    }
    
    console.error('\nDados da requisição que causaram o erro:');
    console.error(JSON.stringify(req.body, null, 2));
    console.error('\n============================================\n');
    
    let mensagemUsuario = 'Erro ao enviar mensagem. Tente novamente mais tarde.';
    
    if (error.code === 'EAUTH') {
      mensagemUsuario = 'Erro de autenticação no servidor de email. Verifique as credenciais.';
    } else if (error.code === 'ECONNECTION') {
      mensagemUsuario = 'Não foi possível conectar ao servidor de email.';
    } else if (error.code === 'EENVELOPE') {
      mensagemUsuario = 'Erro nos destinatários do email.';
    }
    
    res.status(500).json({
      success: false,
      message: mensagemUsuario,
      error: process.env.NODE_ENV === 'development' ? error.message : undefined,
      code: process.env.NODE_ENV === 'development' ? error.code : undefined,
      timestamp: new Date().toISOString()
    });
  }
});

// Rota de teste de email
router.get('/test-email', async (req, res) => {
  try {
    console.log('🔧 Testando configuração de email...');
    
    if (!process.env.EMAIL_USER || !process.env.EMAIL_PASS) {
      console.log('❌ Email não configurado corretamente');
      return res.json({
        success: false,
        message: 'Email não configurado',
        config: {
          EMAIL_USER: process.env.EMAIL_USER ? '✅ Configurado' : '❌ Não configurado',
          EMAIL_PASS: process.env.EMAIL_PASS ? '✅ Configurado' : '❌ Não configurado',
          EMAIL_HOST: process.env.EMAIL_HOST || 'smtp.hostinger.com',
          EMAIL_PORT: process.env.EMAIL_PORT || 465,
          EMAIL_ENABLED: process.env.EMAIL_ENABLED || 'true'
        },
        timestamp: new Date().toISOString()
      });
    }

    const transporter = createTransporter();
    
    console.log('🔌 Testando conexão SMTP...');
    await transporter.verify();
    console.log('✅ Conexão SMTP OK!');
    
    res.json({
      success: true,
      message: '✅ Servidor de email configurado corretamente',
      config: {
        host: process.env.EMAIL_HOST,
        port: process.env.EMAIL_PORT,
        user: process.env.EMAIL_USER,
        secure: true,
        enabled: process.env.EMAIL_ENABLED !== 'false'
      },
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('❌ Erro no teste de email:', error);
    
    res.status(500).json({
      success: false,
      message: '❌ Falha na configuração do email',
      error: error.message,
      config: {
        host: process.env.EMAIL_HOST,
        port: process.env.EMAIL_PORT,
        user: process.env.EMAIL_USER,
        hasPassword: !!process.env.EMAIL_PASS
      },
      timestamp: new Date().toISOString()
    });
  }
});

export default router;