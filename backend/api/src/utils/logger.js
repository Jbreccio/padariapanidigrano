// backend/api/src/utils/logger.js

import winston from 'winston';
import 'winston-daily-rotate-file';
import fs from 'fs';
import path from 'path';

// 📁 Criar diretório de logs
const logDir = 'logs';
if (!fs.existsSync(logDir)) {
  fs.mkdirSync(logDir);
}

// 🧠 Formato
const logFormat = winston.format.combine(
  winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
  winston.format.errors({ stack: true }),
  winston.format.json()
);

// 🚚 Transportes
const transports = [
  new winston.transports.DailyRotateFile({
    filename: path.join(logDir, 'application-%DATE%.log'),
    datePattern: 'YYYY-MM-DD',
    maxSize: '20m',
    maxFiles: '30d',
    level: 'info'
  }),

  new winston.transports.DailyRotateFile({
    filename: path.join(logDir, 'error-%DATE%.log'),
    datePattern: 'YYYY-MM-DD',
    maxSize: '20m',
    maxFiles: '30d',
    level: 'error'
  }),

  new winston.transports.DailyRotateFile({
    filename: path.join(logDir, 'security-%DATE%.log'),
    datePattern: 'YYYY-MM-DD',
    maxSize: '20m',
    maxFiles: '90d',
    level: 'warn'
  })
];

// 🖥️ Console (dev)
if (process.env.NODE_ENV !== 'production') {
  transports.push(
    new winston.transports.Console({
      format: winston.format.combine(
        winston.format.colorize(),
        winston.format.simple()
      )
    })
  );
}

// 🚀 Logger principal
const logger = winston.createLogger({
  level: process.env.LOG_LEVEL || 'info',
  format: logFormat,
  transports
});

export default logger;

// 📡 Middleware de request
export const requestLogger = (req, res, next) => {
  const start = Date.now();

  const ip =
    req.headers['x-forwarded-for'] ||
    req.connection?.remoteAddress ||
    req.ip;

  res.on('finish', () => {
    const duration = Date.now() - start;

    // 📊 Log padrão
    logger.info('HTTP Request', {
      method: req.method,
      url: req.originalUrl,
      status: res.statusCode,
      duration: `${duration}ms`,
      ip,
      userAgent: req.get('user-agent'),
      userId: req.user?.id || 'anonymous'
    });

    // ❌ Erros
    if (res.statusCode >= 500) {
      logger.error('Server Error', {
        method: req.method,
        url: req.originalUrl,
        status: res.statusCode,
        ip
      });
    }

    // ⚠️ Suspeito
    if (res.statusCode >= 400 && res.statusCode < 500) {
      logger.warn('Client Error', {
        method: req.method,
        url: req.originalUrl,
        status: res.statusCode,
        ip
      });
    }

    // 🔐 Tentativa de login falha
    if (req.path.includes('login') && res.statusCode === 401) {
      logger.warn('Failed Login Attempt', {
        ip,
        userAgent: req.get('user-agent'),
        path: req.path
      });
    }
  });

  next();
};

// 🔐 Log de segurança
export const securityLog = (event, details) => {
  logger.warn('Security Event', {
    event,
    details,
    timestamp: new Date().toISOString()
  });
};