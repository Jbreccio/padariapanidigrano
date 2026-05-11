// Validação de dados completa
import { isValidEmail, isStrongPassword, isValidPin } from '../security/sanitize.js';

export class Validator {
  // Validação de cadastro de administradores
  static validateRegister(data) {
    const errors = [];
    const warnings = [];
    const sanitized = {};
    
    // Nome
    if (!data.nome || typeof data.nome !== 'string') {
      errors.push('Nome é obrigatório');
    } else if (data.nome.length < 3) {
      errors.push('Nome deve ter pelo menos 3 caracteres');
    } else if (data.nome.length > 100) {
      errors.push('Nome não pode exceder 100 caracteres');
    } else {
      sanitized.nome = data.nome.trim();
    }
    
    // Email
    if (!data.email) {
      errors.push('Email é obrigatório');
    } else if (!isValidEmail(data.email)) {
      errors.push('Email inválido');
    } else {
      sanitized.email = data.email.toLowerCase().trim();
    }
    
    // Senha
    if (!data.senha) {
      errors.push('Senha é obrigatória');
    } else if (!isStrongPassword(data.senha)) {
      errors.push('Senha fraca. Use pelo menos 8 caracteres, incluindo maiúsculas, minúsculas, números e símbolos');
    } else {
      sanitized.senha = data.senha;
    }
    
    // PIN Code
    if (!data.pinCode) {
      errors.push('PIN Code é obrigatório');
    } else if (!isValidPin(data.pinCode)) {
      errors.push('PIN Code deve ter exatamente 6 dígitos numéricos');
    } else {
      sanitized.pinCode = data.pinCode;
      
      // Verificar PINs fracos
      const weakPins = ['000000', '111111', '123456', '654321', '999999'];
      if (weakPins.includes(data.pinCode)) {
        warnings.push('PIN Code muito comum. Considere usar um mais seguro');
      }
    }
    
    // Telefone (opcional)
    if (data.telefone) {
      const phoneRegex = /^\+?[1-9]\d{1,14}$/;
      if (!phoneRegex.test(data.telefone.replace(/\s/g, ''))) {
        warnings.push('Telefone pode estar em formato inválido');
      } else {
        sanitized.telefone = data.telefone.trim();
      }
    }
    
    return {
      isValid: errors.length === 0,
      errors,
      warnings,
      sanitized: errors.length === 0 ? sanitized : null,
      timestamp: new Date().toISOString()
    };
  }
  
  // Validação de login
  static validateLogin(data) {
    const errors = [];
    const sanitized = {};
    
    // Email
    if (!data.email) {
      errors.push('Email é obrigatório');
    } else if (!isValidEmail(data.email)) {
      errors.push('Email inválido');
    } else {
      sanitized.email = data.email.toLowerCase().trim();
    }
    
    // PIN Code
    if (!data.pinCode) {
      errors.push('PIN Code é obrigatório');
    } else if (!isValidPin(data.pinCode)) {
      errors.push('PIN Code inválido');
    } else {
      sanitized.pinCode = data.pinCode;
    }
    
    // TOTP Token (Google Authenticator)
    if (!data.totpToken) {
      errors.push('Código do autenticador é obrigatório');
    } else if (!/^\d{6}$/.test(data.totpToken)) {
      errors.push('Código do autenticador deve ter 6 dígitos');
    } else {
      sanitized.totpToken = data.totpToken;
    }
    
    return {
      isValid: errors.length === 0,
      errors,
      sanitized: errors.length === 0 ? sanitized : null,
      timestamp: new Date().toISOString()
    };
  }
  
  // Validação de dados de API
  static validateApiParams(params, schema) {
    const errors = [];
    const sanitized = {};
    
    for (const [key, rules] of Object.entries(schema)) {
      const value = params[key];
      const isRequired = rules.required !== false;
      
      // Verificar se é obrigatório
      if (isRequired && (value === undefined || value === null || value === '')) {
        errors.push(`${key} é obrigatório`);
        continue;
      }
      
      // Se não é obrigatório e não tem valor, pular
      if (!isRequired && (value === undefined || value === null || value === '')) {
        continue;
      }
      
      // Tipo
      if (rules.type && typeof value !== rules.type) {
        errors.push(`${key} deve ser do tipo ${rules.type}`);
        continue;
      }
      
      // Validações específicas por tipo
      switch (rules.type) {
        case 'string':
          if (rules.minLength && value.length < rules.minLength) {
            errors.push(`${key} deve ter pelo menos ${rules.minLength} caracteres`);
          }
          if (rules.maxLength && value.length > rules.maxLength) {
            errors.push(`${key} não pode exceder ${rules.maxLength} caracteres`);
          }
          if (rules.pattern && !rules.pattern.test(value)) {
            errors.push(`${key} está em formato inválido`);
          }
          sanitized[key] = String(value).trim();
          break;
          
        case 'number':
          const num = Number(value);
          if (isNaN(num)) {
            errors.push(`${key} deve ser um número válido`);
            continue;
          }
          if (rules.min !== undefined && num < rules.min) {
            errors.push(`${key} deve ser no mínimo ${rules.min}`);
          }
          if (rules.max !== undefined && num > rules.max) {
            errors.push(`${key} deve ser no máximo ${rules.max}`);
          }
          sanitized[key] = num;
          break;
          
        case 'boolean':
          sanitized[key] = Boolean(value);
          break;
          
        case 'array':
          if (!Array.isArray(value)) {
            errors.push(`${key} deve ser um array`);
            continue;
          }
          if (rules.minItems && value.length < rules.minItems) {
            errors.push(`${key} deve ter pelo menos ${rules.minItems} itens`);
          }
          if (rules.maxItems && value.length > rules.maxItems) {
            errors.push(`${key} não pode exceder ${rules.maxItems} itens`);
          }
          sanitized[key] = value;
          break;
          
        default:
          sanitized[key] = value;
      }
    }
    
    // Validar parâmetros extras não definidos no schema
    const extraParams = Object.keys(params).filter(key => !schema[key]);
    if (extraParams.length > 0 && schema.strict !== false) {
      warnings.push(`Parâmetros não reconhecidos: ${extraParams.join(', ')}`);
    }
    
    return {
      isValid: errors.length === 0,
      errors,
      warnings: extraParams.length > 0 ? [`Parâmetros extras: ${extraParams.join(', ')}`] : [],
      sanitized: errors.length === 0 ? sanitized : null,
      timestamp: new Date().toISOString()
    };
  }
  
  // Schemas pré-definidos
  static schemas = {
    searchSaints: {
      q: {
        type: 'string',
        required: true,
        minLength: 2,
        maxLength: 100,
        pattern: /^[a-zA-ZÀ-ÿ\s]+$/
      },
      limit: {
        type: 'number',
        required: false,
        min: 1,
        max: 50,
        default: 10
      },
      page: {
        type: 'number',
        required: false,
        min: 1,
        default: 1
      }
    },
    
    youtubeParams: {
      maxResults: {
        type: 'number',
        required: false,
        min: 1,
        max: 50,
        default: 10
      },
      order: {
        type: 'string',
        required: false,
        pattern: /^(date|rating|relevance|title|videoCount|viewCount)$/,
        default: 'date'
      }
    },
    
    dateRange: {
      startDate: {
        type: 'string',
        required: false,
        pattern: /^\d{4}-\d{2}-\d{2}$/
      },
      endDate: {
        type: 'string',
        required: false,
        pattern: /^\d{4}-\d{2}-\d{2}$/
      }
    }
  };
  
  // Validação de data
  static isValidDate(dateString) {
    const regex = /^\d{4}-\d{2}-\d{2}$/;
    if (!regex.test(dateString)) return false;
    
    const date = new Date(dateString);
    return date instanceof Date && !isNaN(date) && date.toISOString().slice(0, 10) === dateString;
  }
  
  // Validação de URL
  static isValidURL(url) {
    try {
      new URL(url);
      return true;
    } catch {
      return false;
    }
  }
  
  // Validação de telefone brasileiro
  static isValidBrazilianPhone(phone) {
    const cleanPhone = phone.replace(/\D/g, '');
    
    // Celular: (11) 9 1234-5678 -> 11 dígitos
    // Fixo: (11) 1234-5678 -> 10 dígitos
    // Com DDI: +55 11 9 1234-5678 -> 13 dígitos
    
    return cleanPhone.length >= 10 && cleanPhone.length <= 13;
  }
  
  // Validação de CPF (opcional para futuras funcionalidades)
  static isValidCPF(cpf) {
    cpf = cpf.replace(/\D/g, '');
    
    if (cpf.length !== 11) return false;
    if (/^(\d)\1{10}$/.test(cpf)) return false; // Todos dígitos iguais
    
    let sum = 0;
    let remainder;
    
    // Primeiro dígito verificador
    for (let i = 1; i <= 9; i++) {
      sum += parseInt(cpf.substring(i - 1, i)) * (11 - i);
    }
    
    remainder = (sum * 10) % 11;
    if (remainder === 10 || remainder === 11) remainder = 0;
    if (remainder !== parseInt(cpf.substring(9, 10))) return false;
    
    // Segundo dígito verificador
    sum = 0;
    for (let i = 1; i <= 10; i++) {
      sum += parseInt(cpf.substring(i - 1, i)) * (12 - i);
    }
    
    remainder = (sum * 10) % 11;
    if (remainder === 10 || remainder === 11) remainder = 0;
    if (remainder !== parseInt(cpf.substring(10, 11))) return false;
    
    return true;
  }
  
  // Middleware para validação
  static validate(schemaName) {
    return (req, res, next) => {
      const schema = this.schemas[schemaName];
      
      if (!schema) {
        return res.status(500).json({
          error: 'Schema de validação não encontrado',
          timestamp: new Date().toISOString()
        });
      }
      
      // Combinar query, params e body
      const data = { ...req.query, ...req.params, ...req.body };
      const validation = this.validateApiParams(data, schema);
      
      if (!validation.isValid) {
        return res.status(400).json({
          error: 'Validação falhou',
          details: validation.errors,
          timestamp: new Date().toISOString()
        });
      }
      
      // Adicionar dados sanitizados à requisição
      req.validatedData = validation.sanitized;
      
      // Adicionar warnings se houver
      if (validation.warnings.length > 0) {
        req.validationWarnings = validation.warnings;
      }
      
      next();
    };
  }
}

// Funções de validação rápidas (standalone)
export const validate = {
  email: isValidEmail,
  password: isStrongPassword,
  pin: isValidPin,
  date: Validator.isValidDate,
  url: Validator.isValidURL,
  brazilianPhone: Validator.isValidBrazilianPhone,
  cpf: Validator.isValidCPF
};

export default Validator;