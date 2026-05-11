// backend/src/routes/prayerRoutes.js - ATUALIZADO
import express from 'express';
import { sendPrayerRequestEmail, sendCandleLightingEmail } from '../config/emailConfig.js';

const router = express.Router();

// Array temporário para armazenar velas
let mockCandles = [];

// GET /api/candle-lighting - Buscar velas
router.get('/candle-lighting', (req, res) => {
  res.json({
    success: true,
    candles: mockCandles,
    count: mockCandles.length,
    source: 'local-backend'
  });
});

// POST /api/prayer - Enviar pedido de oração COM EMAIL DUPLO
router.post('/prayer', async (req, res) => {
  try {
    const { nome, email, mensagem, cidade, ente_querido } = req.body;
    
    console.log('📝 Pedido de oração recebido:', { 
      nome, 
      email, 
      cidade: cidade || 'Não informada',
      ente_querido: ente_querido || 'Intenção geral'
    });
    
    // Validação obrigatória
    if (!nome || !email || !mensagem) {
      return res.status(400).json({
        success: false,
        error: 'Nome, email e mensagem são obrigatórios'
      });
    }
    
    // Gerar ID único
    const prayerId = `PRAY-${Date.now()}`;
    
    console.log('📧 Iniciando envio de emails duplos...');
    
    // ENVIAR EMAILS DUPLOS via NOVO emailConfig.js
    let emailResult;
    try {
      emailResult = await sendPrayerRequestEmail({
        name: nome,
        email: email,
        prayerRequest: mensagem,
        cidade: cidade,
        enteQuerido: ente_querido
      });
      
      console.log('✅ ✅ AMBOS emails enviados com sucesso!');
      console.log('   • Confirmação enviada para:', email);
      console.log('   • Solicitação enviada para secretaria');
      
    } catch (emailError) {
      console.error('❌❌❌ ERRO CRÍTICO nos emails:', emailError.message);
      
      // Retorna sucesso parcial (o pedido foi recebido, mas email falhou)
      return res.json({
        success: true,
        message: 'Pedido recebido, mas houve erro no envio dos emails.',
        prayerId: prayerId,
        email: {
          enviado: false,
          error: 'Falha no sistema de email',
          para_usuario: email,
          para_secretaria: 'santuariodefatima@santuariodefatima.com.br,santuarionsradefatima@santoamaro.org.br,pascom.santuario@outlook.com.br'
        },
        source: 'local-backend'
      });
    }
    
    // Sucesso completo
    res.json({
      success: true,
      message: '✅ Pedido de oração recebido! Confirmação enviada para seu email.',
      prayerId: prayerId,
      email: {
        enviado: true,
        tipos: ['confirmação_para_fiel', 'solicitação_para_secretaria'],
        para_usuario: email,
        para_secretaria: 'santuariodefatima@santuariodefatima.com.br,santuarionsradefatima@santoamaro.org.br,pascom.santuario@outlook.com.br',
        assunto_usuario: '✅ Confirmação de Pedido de Oração - Santuário de Fátima',
        assunto_secretaria: `📿 SOLICITAÇÃO de Pedido de Oração - ${nome}`,
        resultado: emailResult
      },
      source: 'local-backend'
    });
    
  } catch (error) {
    console.error('❌ Erro geral no pedido de oração:', error);
    res.status(500).json({
      success: false,
      error: 'Erro ao processar pedido de oração',
      detail: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// POST /api/candle-lighting - Acender vela COM EMAIL
router.post('/candle-lighting', async (req, res) => {
  try {
    const { name, intention, city, state, email } = req.body;
    
    console.log('🕯️ Vela acesa:', { name, intention, city, state });
    
    // Validação
    if (!name || !intention) {
      return res.status(400).json({
        success: false,
        error: 'Nome e intenção são obrigatórios'
      });
    }
    
    // Criar nova vela
    const newCandle = {
      id: Date.now(),
      name: name,
      intention: intention,
      city: city || "",
      state: state || "",
      createdAt: new Date().toISOString()
    };
    
    // Adicionar ao array
    mockCandles.unshift(newCandle);
    
    // Limitar a 50 velas
    if (mockCandles.length > 50) {
      mockCandles = mockCandles.slice(0, 50);
    }
    
    // ENVIAR EMAIL para secretaria (opcional)
    let emailResult = null;
    try {
      emailResult = await sendCandleLightingEmail({
        name: name,
        intention: intention,
        city: city,
        state: state
      });
      
      console.log('✅ Email de vela enviado para secretaria!');
    } catch (emailError) {
      console.warn('⚠️ Erro ao enviar email da vela:', emailError.message);
    }
    
    res.json({
      success: true,
      message: '🕯️ Vela acesa com sucesso!',
      candle: newCandle,
      email: {
        enviado: !!emailResult,
        para: 'santuariodefatima@santuariodefatima.com.br,santuarionsradefatima@santoamaro.org.br,pascom.santuario@outlook.com.br',
        assunto: `🕯️ VELA ACESA - ${name}`
      },
      source: 'local-backend'
    });
    
  } catch (error) {
    console.error('❌ Erro ao acender vela:', error);
    res.status(500).json({
      success: false,
      error: 'Erro ao acender vela'
    });
  }
});

// Rota para testar o sistema de email (opcional)
router.get('/test-email-system', async (req, res) => {
  try {
    const testEmail = req.query.email || 'oibreccio@hotmail.com';
    
    const result = await sendPrayerRequestEmail({
      name: "João Silva (Teste)",
      email: testEmail,
      prayerRequest: "Este é um pedido de oração de teste do sistema.",
      cidade: "São Paulo - SP",
      enteQuerido: "Teste do Sistema"
    });
    
    res.json({
      success: true,
      message: `✅ Sistema de email testado! Confirmação enviada para ${testEmail}`,
      result
    });
  } catch (error) {
    res.json({
      success: false,
      error: error.message,
      tip: 'Verifique as credenciais de email no .env'
    });
  }
});

export default router;