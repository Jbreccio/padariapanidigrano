import rateLimit from 'express-rate-limit';

// Limiter geral da API
export const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutos
  max: 300,
  standardHeaders: true,
  legacyHeaders: false,
});

// Limiter de login
export const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 5,
  message: {
    error: 'Muitas tentativas de login. Tente novamente mais tarde.'
  },
  standardHeaders: true,
  legacyHeaders: false,
});
