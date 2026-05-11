// backend/api/src/routes/public.routes.js
import express from 'express';
import { PublicController } from '../controllers/publicController.js';
import { publicLimiter } from '../middleware/rateLimit.js';

const router = express.Router();

export function createPublicRoutes(env) {
  const controller = new PublicController(env);
  
  router.get('/horarios-missas', publicLimiter, (req, res) => 
    controller.getHorariosMissas(req, res)
  );
  
  router.get('/momentos-liturgicos', publicLimiter, (req, res) => 
    controller.getMomentosLiturgicos(req, res)
  );
  
  router.get('/carrossel', publicLimiter, (req, res) => 
    controller.getCarrossel(req, res)
  );
  
  router.get('/recados', publicLimiter, (req, res) => 
    controller.getRecados(req, res)
  );
  
  router.get('/health', (req, res) => {
    res.json({
      status: 'ok',
      timestamp: new Date().toISOString(),
      service: 'Santuário de Fátima API'
    });
  });
  
  return router;
}

export default createPublicRoutes;