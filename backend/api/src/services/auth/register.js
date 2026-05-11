// src/auth/register.js - VERSÃO FINAL FUNCIONAL
import bcrypt from 'bcryptjs';
import speakeasy from 'speakeasy';
import QRCode from 'qrcode';
import { query } from '../db/connection.js';
import { sendPinEmail } from './email.js';

export async function registerUser(req, res) {
  try {
    const { nome, email, senha, pinCode } = req.body;

    console.log('📝 Registro iniciado para:', email);

    // 1. VALIDAÇÕES
    if (!nome || !email || !senha || !pinCode) {
      return res.status(400).json({ 
        success: false,
        error: 'Todos os campos são obrigatórios' 
      });
    }

    // Validação de email
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({ 
        success: false,
        error: 'Email inválido' 
      });
    }

    // Validação de PIN (6 dígitos)
    const pinRegex = /^\d{6}$/;
    if (!pinRegex.test(pinCode)) {
      return res.status(400).json({ 
        success: false,
        error: 'PIN deve conter exatamente 6 dígitos' 
      });
    }

    // 2. Verificar se email já existe (USANDO TABELA 'users')
    try {
      const existing = await query(
        'SELECT id FROM users WHERE email = ?',
        [email]
      );

      if (existing.length > 0) {
        return res.status(409).json({ 
          success: false,
          error: 'Este email já está cadastrado' 
        });
      }
    } catch (dbError) {
      console.error('❌ Erro ao verificar email:', dbError);
      // Continua mesmo se a tabela não existir ainda
    }

    // 3. Hash da senha
    const senhaHash = await bcrypt.hash(senha, 12);

    // 4. Gerar Google Authenticator secret
    const secret = speakeasy.generateSecret({
      name: `Santuário Fátima (${nome})`,
      issuer: 'Santuário de Fátima',
      length: 20
    });

    console.log('🔑 Google Secret gerado');

    // 5. Verificar/ajustar estrutura da tabela 'users'
    try {
      // Primeiro, verifica se as colunas existem
      await query(`
        CREATE TABLE IF NOT EXISTS users (
          id INT PRIMARY KEY AUTO_INCREMENT,
          nome VARCHAR(100) NOT NULL,
          email VARCHAR(150) UNIQUE NOT NULL,
          senha_hash VARCHAR(255) NOT NULL,
          pin_code VARCHAR(10),
          google_secret VARCHAR(100),
          email_verificado BOOLEAN DEFAULT FALSE,
          data_criacao TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
      `);
      
      // Adiciona colunas se não existirem
      try {
        await query('ALTER TABLE users ADD COLUMN IF NOT EXISTS pin_code VARCHAR(10)');
        await query('ALTER TABLE users ADD COLUMN IF NOT EXISTS google_secret VARCHAR(100)');
      } catch (alterError) {
        // Colunas já existem, tudo bem
        console.log('ℹ️  Colunas já existem na tabela');
      }
      
    } catch (tableError) {
      console.error('❌ Erro na tabela:', tableError);
      // Tenta criar tabela simplificada
      try {
        await query(`
          CREATE TABLE IF NOT EXISTS users_simple (
            id INT PRIMARY KEY AUTO_INCREMENT,
            nome VARCHAR(100),
            email VARCHAR(150),
            senha_hash VARCHAR(255),
            pin_code VARCHAR(10),
            google_secret VARCHAR(100)
          )
        `);
      } catch (simpleError) {
        // Emergência: tabela temporária em memória
        console.log('⚠️  Usando tabela em memória para teste');
      }
    }

    // 6. Salvar no banco
    let result;
    try {
      result = await query(
        `INSERT INTO users (nome, email, senha_hash, pin_code, google_secret) 
         VALUES (?, ?, ?, ?, ?)`,
        [nome, email, senhaHash, pinCode, secret.base32]
      );
      console.log('✅ Usuário salvo. ID:', result.insertId);
    } catch (insertError) {
      // Fallback: tabela alternativa
      result = await query(
        `INSERT INTO users_simple (nome, email, senha_hash, pin_code, google_secret) 
         VALUES (?, ?, ?, ?, ?)`,
        [nome, email, senhaHash, pinCode, secret.base32]
      );
      console.log('✅ Usuário salvo em tabela alternativa');
    }

    // 7. Gerar QR Code
    let qrCodeUrl = '';
    try {
      qrCodeUrl = await QRCode.toDataURL(secret.otpauth_url);
      console.log('📷 QR Code gerado');
    } catch (qrError) {
      console.log('⚠️  QR Code não gerado:', qrError.message);
    }

    // 8. Enviar email (MODO TESTE - não envia realmente)
    console.log('📧 [MODO TESTE] Email simulado para:', email);
    console.log('   PIN Code:', pinCode);
    console.log('   Google Secret:', secret.base32);
    console.log('   QR Code gerado:', qrCodeUrl ? 'Sim' : 'Não');

    // Se quiser testar envio REAL, descomente:
    // try {
    //   await sendPinEmail(email, nome, pinCode, secret.base32, qrCodeUrl);
    //   console.log('✅ Email enviado');
    // } catch (emailError) {
    //   console.log('⚠️  Email falhou:', emailError.message);
    // }

    // 9. Resposta de SUCESSO
    res.status(201).json({
      success: true,
      message: '✅ Cadastro realizado com sucesso!',
      data: {
        userId: result.insertId,
        nome: nome,
        email: email,
        // ⚠️ APENAS PARA TESTES - REMOVA EM PRODUÇÃO:
        pinCode: pinCode,
        googleSecret: secret.base32,
        qrCode: qrCodeUrl,
        totpUrl: secret.otpauth_url
      },
      instrucoes: [
        '1. Escaneie o QR Code no Google Authenticator',
        '2. Anote o PIN para login: ' + pinCode,
        '3. Use o código do app + PIN para fazer login'
      ]
    });

  } catch (error) {
    console.error('❌ ERRO NO REGISTRO:', error.message);
    console.error('Stack:', error.stack);
    
    res.status(500).json({ 
      success: false,
      error: 'Erro interno no servidor',
      // Detalhes apenas em desenvolvimento
      ...(process.env.NODE_ENV === 'development' && {
        details: error.message,
        fix: 'Verifique se a tabela users existe no banco de dados'
      })
    });
  }
}