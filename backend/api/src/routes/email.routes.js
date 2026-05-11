// backend/src/routes/emailRoutes.js
import express from 'express';
import { sendPrayerRequestEmail, sendCandleLightingEmail } from '../config/emailConfig.js';

const router = express.Router();

// Rota para pedido de oração
router.post('/prayer-request', async (req, res) => {
  try {
    const { name, email, prayerRequest, cidade, enteQuerido } = req.body;
    
    // Validação básica
    if (!name || !email || !prayerRequest) {
      return res.status(400).json({ 
        error: 'Nome, email e pedido de oração são obrigatórios' 
      });
    }
    
    const result = await sendPrayerRequestEmail({
      name,
      email,
      prayerRequest,
      cidade: cidade || '',
      enteQuerido: enteQuerido || ''
    });
    
    res.json({
      success: true,
      message: 'Pedido de oração enviado com sucesso',
      data: result
    });
    
  } catch (error) {
    console.error('Erro no servidor:', error);
    res.status(500).json({ 
      error: 'Erro ao enviar pedido de oração',
      details: error.message 
    });
  }
});

// Rota para acendimento de vela
router.post('/candle-lighting', async (req, res) => {
  try {
    const { name, email, intention, city, state } = req.body;
    
    // Validação - email agora é obrigatório para enviar o email
    if (!name || !intention || !city || !state) {
      return res.status(400).json({ 
        error: 'Nome, intenção, cidade e estado são obrigatórios' 
      });
    }
    
    // Email é opcional - se não tiver, a vela será acesa mas não envia email
    const result = await sendCandleLightingEmail({
      name,
      email: email || null, // Pode ser null
      intention,
      city,
      state,
      candleType: 'virtual'
    });
    
    res.json({
      success: true,
      message: email ? 'Vela acesa e email enviado com sucesso' : 'Vela acesa com sucesso (sem envio de email)',
      data: result
    });
    
  } catch (error) {
    console.error('Erro no servidor:', error);
    res.status(500).json({ 
      error: 'Erro ao acender vela',
      details: error.message 
    });
  }
});

export default router;