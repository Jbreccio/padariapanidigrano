// backend/api/src/middleware/rateLimit.js
import rateLimit from 'express-rate-limit';

// Rate limit padrão
export const standardLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutos
  max: 100, // 100 requisições
  message: {
    error: 'Muitas requisições',
    message: 'Você excedeu o limite de requisições. Tente novamente em alguns minutos.'
  },
  standardHeaders: true,
  legacyHeaders: false,
  skipSuccessfulRequests: false
});

// Rate limit para autenticação (mais restrito)
export const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutos
  max: 5, // 5 tentativas
  message: {
    error: 'Muitas tentativas',
    message: 'Muitas tentativas de login. Aguarde 15 minutos antes de tentar novamente.'
  },
  skipSuccessfulRequests: true,
  standardHeaders: true,
  legacyHeaders: false
});

// Rate limit para registro
export const registerLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hora
  max: 3, // 3 cadastros por hora
  message: {
    error: 'Limite de cadastros',
    message: 'Muitas tentativas de cadastro. Tente novamente em 1 hora.'
  },
  standardHeaders: true,
  legacyHeaders: false
});

// Rate limit para API pública
export const publicLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minuto
  max: 30, // 30 requisições por minuto
  message: {
    error: 'Limite excedido',
    message: 'Muitas requisições. Aguarde um momento.'
  },
  standardHeaders: true,
  legacyHeaders: false
});

// Rate limit para endpoints de escrita
export const writeLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minuto
  max: 10, // 10 operações de escrita
  message: {
    error: 'Limite de operações',
    message: 'Muitas operações de escrita. Aguarde um momento.'
  },
  standardHeaders: true,
  legacyHeaders: false
});

// Rate limit para contribuições de voz
export const voiceLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hora
  max: 5, // 5 contribuições por hora
  message: {
    error: 'Limite de contribuições',
    message: 'Você excedeu o limite de contribuições por hora.'
  },
  standardHeaders: true,
  legacyHeaders: false
});

export default {
  standardLimiter,
  authLimiter,
  registerLimiter,
  publicLimiter,
  writeLimiter,
  voiceLimiter
};