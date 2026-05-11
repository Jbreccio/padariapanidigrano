import cors from 'cors';

// CORS restrito
export const corsOptions = {
  origin: (origin, callback) => {
    const allowedOrigins = [
      'https://www.santuariodefatima.net',
      'https://santuariodefatima.net',
      'http://localhost:5173',
      'http://localhost:3000',
      // Apenas para desenvolvimento
      ...(process.env.NODE_ENV === 'development' ? 
        ['http://localhost:*', 'https://localhost:*'] : [])
    ];

    // Permitir requisições sem origin (mobile apps, curl)
    if (!origin) {
      return callback(null, true);
    }

    if (allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      console.warn(`🚨 CORS bloqueado: ${origin}`);
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: [
    'Content-Type',
    'Authorization',
    'X-Requested-With',
    'X-API-Key'
  ],
  exposedHeaders: ['X-RateLimit-Limit', 'X-RateLimit-Remaining'],
  maxAge: 86400 // 24 horas
};