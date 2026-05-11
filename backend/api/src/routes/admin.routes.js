// backend/src/api/admin.routes.js
import express from 'express';
const router = express.Router();

// Middleware de autenticação básica
const requireAuth = (req, res, next) => {
  const token = req.headers.authorization;
  
  if (process.env.NODE_ENV === 'development') {
    // Em desenvolvimento, permite sem autenticação
    return next();
  }
  
  if (!token || token !== `Bearer ${process.env.ADMIN_TOKEN}`) {
    return res.status(401).json({
      success: false,
      message: 'Acesso não autorizado'
    });
  }
  
  next();
};

// Rota de status do admin
router.get('/', requireAuth, (req, res) => {
  res.json({
    success: true,
    message: 'Painel Administrativo - Santuário de Fátima',
    version: '1.0.0',
    endpoints: {
      status: 'GET /api/admin',
      stats: 'GET /api/admin/stats',
      users: 'GET /api/admin/users',
      content: 'GET /api/admin/content'
    },
    timestamp: new Date().toISOString()
  });
});

// Estatísticas do sistema
router.get('/stats', requireAuth, (req, res) => {
  res.json({
    success: true,
    stats: {
      system: {
        uptime: process.uptime(),
        memory: process.memoryUsage(),
        nodeVersion: process.version
      },
      services: {
        liturgia: 'active',
        saints: 'active',
        email: process.env.EMAIL_USER ? 'configured' : 'not_configured',
        database: 'not_connected'
      }
    }
  });
});

// Rota pública de status (sem autenticação)
router.get('/status', (req, res) => {
  res.json({
    success: true,
    service: 'Admin API',
    status: 'active',
    timestamp: new Date().toISOString()
  });
});

export default router;