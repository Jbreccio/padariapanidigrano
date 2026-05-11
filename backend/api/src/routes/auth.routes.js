// backend/api/src/routes/auth.routes.js
import express from 'express';
import { AuthController } from '../controllers/authController.js';
import { authenticate } from '../middleware/auth.js';
import { 
  loginValidation, 
  registerValidation,
  forgotPasswordValidation,
  resetPasswordValidation,
  validate 
} from '../middleware/validation.js';
import { authLimiter, registerLimiter } from '../middleware/rateLimit.js';

const router = express.Router();

export function createAuthRoutes(env) {
  const controller = new AuthController(env);
  
  // Rotas públicas
  router.post('/register', registerLimiter, registerValidation, validate, (req, res) => 
    controller.register(req, res)
  );
  
  router.post('/verify-email', (req, res) => 
    controller.verifyEmail(req, res)
  );
  
  router.post('/login', authLimiter, loginValidation, validate, (req, res) => 
    controller.login(req, res)
  );
  
  router.post('/verify-2fa', (req, res) => 
    controller.verifyTwoFactor(req, res)
  );
  
  router.post('/forgot-password', forgotPasswordValidation, validate, (req, res) => 
    controller.forgotPassword(req, res)
  );
  
  router.post('/reset-password', resetPasswordValidation, validate, (req, res) => 
    controller.resetPassword(req, res)
  );
  
  // Rotas protegidas
  router.post('/logout', authenticate, (req, res) => 
    controller.logout(req, res)
  );
  
  router.get('/me', authenticate, (req, res) => 
    res.json({ success: true, user: req.user })
  );
  
  return router;
}

export default createAuthRoutes;