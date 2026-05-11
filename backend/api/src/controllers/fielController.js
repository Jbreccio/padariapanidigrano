import { createFiel } from '../services/fielService.js';
import logger from '../utils/logger.js';

export const registerFiel = async (req, res) => {
  try {
    const { name, email } = req.body;

    if (!name || !email) {
      return res.status(400).json({
        success: false,
        error: 'Dados obrigatórios'
      });
    }

    const user = await createFiel(req.body, req.file);

    logger.info('Fiel criado', { email });

    return res.status(201).json({
      success: true,
      data: user
    });

  } catch (error) {
    logger.error('Erro ao criar fiel', error);

    return res.status(500).json({
      success: false,
      error: 'Erro interno'
    });
  }
};