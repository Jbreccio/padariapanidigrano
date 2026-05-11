// backend/api/src/routes/api.js
import express from 'express';
import createAuthRoutes from './auth.routes.js';
import createFielRoutes from './fiel.routes.js';
import createAdminRoutes from './admin.routes.js';
import createPublicRoutes from './public.routes.js';
import createContatoRoutes from './contato.routes.js';
import createInstagramRoutes from './instagram.routes.js';
import createYoutubeRoutes from './youtube.routes.js';
import createVaticanRoutes from './vatican.routes.js';
import createLiturgiaRoutes from './liturgia.routes.js';
import createTercoRoutes from './terco.routes.js';

import { authenticate } from '../middleware/auth.js';
import { standardLimiter } from '../middleware/rateLimit.js';

const router = express.Router();

/**
 * API Principal do Santuário de Fátima
 * Todas as rotas são prefixadas com /api
 */

// Middleware global para todas as rotas
router.use(standardLimiter);

// Rotas públicas (não requerem autenticação)
router.use('/auth', createAuthRoutes);
router.use('/public', createPublicRoutes);
router.use('/contato', createContatoRoutes);
router.use('/instagram', createInstagramRoutes);
router.use('/youtube', createYoutubeRoutes);
router.use('/vatican', createVaticanRoutes);
router.use('/liturgia', createLiturgiaRoutes);
router.use('/terco', createTercoRoutes);

// Rotas protegidas (requerem autenticação)
router.use('/fiel', authenticate, createFielRoutes);
router.use('/admin', authenticate, createAdminRoutes);

// Health check
router.get('/health', (req, res) => {
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    version: '2.0.0',
    service: 'Santuário de Fátima API'
  });
});

// Rota 404 para API
router.use('*', (req, res) => {
  res.status(404).json({
    error: 'Rota não encontrada',
    path: req.originalUrl,
    method: req.method
  });
});

export default router;