// backend/api/app.js
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import compression from 'compression';
import apiRoutes from './src/routes/api.js';
import { errorHandler } from './src/middleware/errorHandler.js';

const app = express();

// Middlewares globais
app.use(helmet());
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:5173',
  credentials: true
}));
app.use(compression());
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Logging
app.use((req, res, next) => {
  console.log(`${req.method} ${req.path} - ${req.ip}`);
  next();
});

// Rotas da API - TUDO passa por aqui!
app.use('/api', apiRoutes);

// Tratamento de erros
app.use(errorHandler);

export default app;