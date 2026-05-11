import express from 'express';
import { registerUser } from './register.js';
import { loginUser } from './login.js';
import { verifyToken } from './middleware.js';

const router = express.Router();

// Rotas públicas
router.post('/register', registerUser);
router.post('/login', loginUser);

// Rotas protegidas
router.get('/profile', verifyToken, (req, res) => {
  res.json({ user: req.user });
});

export default router;