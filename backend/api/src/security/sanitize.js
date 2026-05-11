// Sanitização de entrada de dados
import xss from 'xss';

export const sanitizeMiddleware = (req, res, next) => {
  // Sanitizar body
  if (req.body && typeof req.body === 'object') {
    req.body = sanitizeObject(req.body);
  }
  
  // Sanitizar query params
  if (req.query && typeof req.query === 'object') {
    req.query = sanitizeObject(req.query);
  }
  
  // Sanitizar params
  if (req.params && typeof req.params === 'object') {
    req.params = sanitizeObject(req.params);
  }
  
  next();
};

export const sanitizeObject = (obj) => {
  if (!obj || typeof obj !== 'object') return obj;
  
  const sanitized = Array.isArray(obj) ? [] : {};
  
  for (const key in obj) {
    if (Object.prototype.hasOwnProperty.call(obj, key)) {
      const value = obj[key];
      
      if (typeof value === 'string') {
        sanitized[key] = sanitizeString(value);
      } else if (typeof value === 'object' && value !== null) {
        sanitized[key] = sanitizeObject(value);
      } else {
        sanitized[key] = value;
      }
    }
  }
  
  return sanitized;
};

export const sanitizeString = (str) => {
  if (typeof str !== 'string') return str;
  
  // Remover caracteres perigosos
  let sanitized = str
    .replace(/[<>]/g, '') // Remove < e >
    .replace(/\b(SELECT|INSERT|UPDATE|DELETE|DROP|UNION|OR|AND)\b/gi, '') // SQL keywords
    .replace(/[;'"\\]/g, ''); // Remove caracteres especiais perigosos
  
  // Limitar tamanho
  if (sanitized.length > 1000) {
    sanitized = sanitized.substring(0, 1000);
  }
  
  // XSS protection
  sanitized = xss(sanitized, {
    whiteList: {}, // Não permitir nenhuma tag
    stripIgnoreTag: true, // Remover tags não permitidas
    stripIgnoreTagBody: ['script', 'style', 'iframe', 'object', 'embed'] // Remover estas tags completamente
  });
  
  return sanitized.trim();
};

// Validação de email
export const isValidEmail = (email) => {
  if (!email || typeof email !== 'string') return false;
  
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) return false;
  
  // Prevenir email injection
  if (email.includes('\n') || email.includes('\r') || email.includes('|')) {
    return false;
  }
  
  // Limitar tamanho
  if (email.length > 254) return false;
  
  return true;
};

// Validação de senha forte
export const isStrongPassword = (password) => {
  if (!password || typeof password !== 'string') return false;
  
  const minLength = 8;
  const hasUpper = /[A-Z]/.test(password);
  const hasLower = /[a-z]/.test(password);
  const hasNumbers = /\d/.test(password);
  const hasSpecial = /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password);
  
  // Lista de senhas comuns (em português)
  const commonPasswords = [
    'password', '123456', 'qwerty', 'admin', 'senha123',
    'fatima2024', 'jesussaves', 'godisgood', 'jesus123',
    'abc123', 'password123', 'admin123', 'teste123'
  ];
  
  if (password.length < minLength) return false;
  if (!hasUpper || !hasLower) return false;
  if (!hasNumbers) return false;
  if (commonPasswords.includes(password.toLowerCase())) return false;
  
  return true;
};

// Validação de PIN code
export const isValidPin = (pin) => {
  if (!pin || typeof pin !== 'string') return false;
  
  // Deve ter exatamente 6 dígitos
  const pinRegex = /^\d{6}$/;
  return pinRegex.test(pin);
};

// Sanitizar para SQL (prevenir injection)
export const sanitizeForSQL = (value) => {
  if (typeof value !== 'string') return value;
  
  return value
    .replace(/['"\\]/g, '') // Remove aspas e barras
    .replace(/;/g, '') // Remove ponto e vírgula
    .replace(/\-\-/g, '') // Remove comentários SQL
    .replace(/#/g, '') // Remove comentários MySQL
    .substring(0, 255); // Limitar tamanho
};

export default {
  sanitizeMiddleware,
  sanitizeObject,
  sanitizeString,
  isValidEmail,
  isStrongPassword,
  isValidPin,
  sanitizeForSQL
};