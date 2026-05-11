import jwt from 'jsonwebtoken';
import { query } from '../db/connection.js';

// Middleware para verificar token JWT
export const authenticateToken = async (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];
  
  if (!token) {
    return res.status(401).json({ 
      error: 'Token de acesso não fornecido' 
    });
  }
  
  try {
    // Verificar token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    
    // Verificar se usuário ainda existe e está ativo
    const users = await query(
      'SELECT id, email, nome, ativo FROM ADMINISTRADORES WHERE id = ?',
      [decoded.userId]
    );
    
    if (users.length === 0 || !users[0].ativo) {
      return res.status(403).json({ 
        error: 'Usuário não autorizado ou inativo' 
      });
    }
    
    // Adicionar usuário à requisição
    req.user = {
      id: decoded.userId,
      email: decoded.email,
      nome: decoded.nome
    };
    
    next();
  } catch (error) {
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({ 
        error: 'Token expirado. Faça login novamente.' 
      });
    }
    
    return res.status(403).json({ 
      error: 'Token inválido' 
    });
  }
};

// Middleware para log de requisições
export const requestLogger = (req, res, next) => {
  const start = Date.now();
  
  // Capturar quando a resposta terminar
  res.on('finish', () => {
    const duration = Date.now() - start;
    console.log(`${req.method} ${req.originalUrl} - ${res.statusCode} - ${duration}ms`);
  });
  
  next();
};
