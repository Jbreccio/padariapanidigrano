// backend/api/src/controllers/candleController.js

import { sendAllEmails } from '../services/emailService.js';
import { saveToDatabase, getCandlesForFrontend } from '../services/databaseService.js';
import logger from '../utils/logger.js';

export const submitCandleLighting = async (req, res) => {
  try {
    const { name, intention, city, state, email } = req.body;

    // 🔐 Validação mais segura
    if (!name || !intention || !city || !state) {
      return res.status(400).json({
        success: false,
        error: 'Nome, intenção, cidade e estado são obrigatórios'
      });
    }

    if (name.length < 2 || intention.length < 5) {
      return res.status(400).json({
        success: false,
        error: 'Dados inválidos'
      });
    }

    // 🗄️ Salvar no banco
    const savedData = await saveToDatabase({
      type: 'candle_lighting',
      name,
      intention,
      city,
      state,
      email: email || null,
      timestamp: new Date()
    });

    // 📩 Envio de email (não trava resposta)
    sendAllEmails(
      { name, intention, city, state, email },
      'candle_lighting'
    ).catch(err => {
      logger.error('Erro ao enviar email', err);
    });

    // 🚀 Resposta rápida
    return res.status(200).json({
      success: true,
      message: 'Vela acesa com sucesso',
      data: savedData
    });

  } catch (error) {
    logger.error('Erro no controller de vela', error);

    return res.status(500).json({
      success: false,
      error: 'Erro ao acender vela'
    });
  }
};


// 🕯️ GET candles (para frontend)
export const getCandles = async (req, res) => {
  try {
    const candles = await getCandlesForFrontend();

    return res.status(200).json({
      success: true,
      data: candles,
      count: candles.length
    });

  } catch (error) {
    logger.error('Erro ao buscar velas', error);

    return res.status(500).json({
      success: false,
      error: 'Erro ao buscar velas'
    });
  }
};