// backend/api/src/utils/helpers.js

export class Helpers {
  // ==================== FORMATAÇÃO DE TEXTO ====================
  
  static cleanText(text) {
    if (!text) return text;
    return text
      .replace(/<!\[CDATA\[/g, '')
      .replace(/\]\]>/g, '')
      .replace(/<[^>]+>/g, '')
      .replace(/&[a-z]+;/g, ' ')
      .replace(/\s+/g, ' ')
      .trim();
  }

  static truncate(text, length = 100, suffix = '...') {
    if (!text) return '';
    if (text.length <= length) return text;
    return text.substring(0, length).trim() + suffix;
  }

  static capitalize(str) {
    if (!str) return '';
    return str.charAt(0).toUpperCase() + str.slice(1).toLowerCase();
  }

  static capitalizeWords(str) {
    if (!str) return '';
    return str.split(' ').map(word => this.capitalize(word)).join(' ');
  }

  static slugify(text) {
    if (!text) return '';
    return text
      .toString()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .toLowerCase()
      .trim()
      .replace(/\s+/g, '-')
      .replace(/[^\w-]+/g, '')
      .replace(/--+/g, '-')
      .replace(/^-+/, '')
      .replace(/-+$/, '');
  }

  static removeAccents(str) {
    if (!str) return '';
    return str.normalize('NFD').replace(/[\u0300-\u036f]/g, '');
  }

  // ==================== VALIDAÇÕES ====================
  
  static isEmail(email) {
    const regex = /^[^\s@]+@([^\s@]+\.)+[^\s@]+$/;
    return regex.test(email);
  }

  static isPhone(phone) {
    const cleaned = phone?.replace(/\D/g, '');
    return cleaned?.length >= 10 && cleaned?.length <= 11;
  }

  static isURL(url) {
    try {
      new URL(url);
      return true;
    } catch {
      return false;
    }
  }

  static isCPF(cpf) {
    cpf = cpf?.replace(/[^\d]/g, '');
    if (!cpf || cpf.length !== 11) return false;
    
    // Verificar dígitos repetidos
    if (/^(\d)\1+$/.test(cpf)) return false;
    
    // Validar primeiro dígito
    let sum = 0;
    for (let i = 0; i < 9; i++) {
      sum += parseInt(cpf.charAt(i)) * (10 - i);
    }
    let remainder = 11 - (sum % 11);
    let digit = remainder >= 10 ? 0 : remainder;
    if (digit !== parseInt(cpf.charAt(9))) return false;
    
    // Validar segundo dígito
    sum = 0;
    for (let i = 0; i < 10; i++) {
      sum += parseInt(cpf.charAt(i)) * (11 - i);
    }
    remainder = 11 - (sum % 11);
    digit = remainder >= 10 ? 0 : remainder;
    return digit === parseInt(cpf.charAt(10));
  }

  static isCNPJ(cnpj) {
    cnpj = cnpj?.replace(/[^\d]/g, '');
    if (!cnpj || cnpj.length !== 14) return false;
    
    // Verificar dígitos repetidos
    if (/^(\d)\1+$/.test(cnpj)) return false;
    
    // Validar primeiro dígito
    let sum = 0;
    let weight = 5;
    for (let i = 0; i < 12; i++) {
      sum += parseInt(cnpj.charAt(i)) * weight;
      weight = weight === 2 ? 9 : weight - 1;
    }
    let remainder = sum % 11;
    let digit = remainder < 2 ? 0 : 11 - remainder;
    if (digit !== parseInt(cnpj.charAt(12))) return false;
    
    // Validar segundo dígito
    sum = 0;
    weight = 6;
    for (let i = 0; i < 13; i++) {
      sum += parseInt(cnpj.charAt(i)) * weight;
      weight = weight === 2 ? 9 : weight - 1;
    }
    remainder = sum % 11;
    digit = remainder < 2 ? 0 : 11 - remainder;
    return digit === parseInt(cnpj.charAt(13));
  }

  // ==================== FORMATAÇÃO ====================
  
  static formatPhone(phone) {
    if (!phone) return '';
    const cleaned = phone.replace(/\D/g, '');
    if (cleaned.length === 11) {
      return `(${cleaned.substring(0, 2)}) ${cleaned.substring(2, 7)}-${cleaned.substring(7)}`;
    }
    if (cleaned.length === 10) {
      return `(${cleaned.substring(0, 2)}) ${cleaned.substring(2, 6)}-${cleaned.substring(6)}`;
    }
    return phone;
  }

  static formatCPF(cpf) {
    if (!cpf) return '';
    const cleaned = cpf.replace(/\D/g, '');
    if (cleaned.length === 11) {
      return cleaned.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, '$1.$2.$3-$4');
    }
    return cpf;
  }

  static formatCNPJ(cnpj) {
    if (!cnpj) return '';
    const cleaned = cnpj.replace(/\D/g, '');
    if (cleaned.length === 14) {
      return cleaned.replace(/(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})/, '$1.$2.$3/$4-$5');
    }
    return cnpj;
  }

  static formatCurrency(value) {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value);
  }

  static formatNumber(value, decimals = 2) {
    return new Intl.NumberFormat('pt-BR', {
      minimumFractionDigits: decimals,
      maximumFractionDigits: decimals
    }).format(value);
  }

  static formatDate(date, format = 'short') {
    const d = new Date(date);
    if (isNaN(d.getTime())) return '';
    
    const formats = {
      short: () => d.toLocaleDateString('pt-BR'),
      medium: () => d.toLocaleDateString('pt-BR', { day: '2-digit', month: 'short', year: 'numeric' }),
      long: () => d.toLocaleDateString('pt-BR', { weekday: 'long', day: '2-digit', month: 'long', year: 'numeric' }),
      full: () => d.toLocaleString('pt-BR'),
      iso: () => d.toISOString()
    };
    
    return formats[format] ? formats[format]() : formats.short();
  }

  static formatDateTime(date) {
    const d = new Date(date);
    return d.toLocaleString('pt-BR');
  }

  static timeAgo(date) {
    const now = new Date();
    const diff = Math.floor((now - new Date(date)) / 1000);
    
    const intervals = [
      { seconds: 60, name: 'minuto', plural: 'minutos' },
      { seconds: 3600, name: 'hora', plural: 'horas' },
      { seconds: 86400, name: 'dia', plural: 'dias' },
      { seconds: 604800, name: 'semana', plural: 'semanas' },
      { seconds: 2592000, name: 'mês', plural: 'meses' },
      { seconds: 31536000, name: 'ano', plural: 'anos' }
    ];
    
    if (diff < 60) return 'agora mesmo';
    
    for (const interval of intervals) {
      const count = Math.floor(diff / interval.seconds);
      if (count >= 1 && count < (interval.seconds === 60 ? 60 : interval.seconds / 60)) {
        const name = count === 1 ? interval.name : interval.plural;
        return `${count} ${name} atrás`;
      }
    }
    
    return this.formatDate(date);
  }

  // ==================== GERAÇÃO DE CÓDIGOS ====================
  
  static generateCode(length = 6) {
    return Math.floor(Math.random() * Math.pow(10, length))
      .toString()
      .padStart(length, '0');
  }

 

  static generateUUID() {
    return crypto.randomUUID ? crypto.randomUUID() : 
      'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
        const r = Math.random() * 16 | 0;
        const v = c === 'x' ? r : (r & 0x3 | 0x8);
        return v.toString(16);
      });
  }

  static generateShortId(length = 8) {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    let id = '';
    for (let i = 0; i < length; i++) {
      id += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return id;
  }

  // ==================== MANIPULAÇÃO DE OBJETOS ====================
  
  static pick(obj, keys) {
    if (!obj) return {};
    return keys.reduce((acc, key) => {
      if (obj.hasOwnProperty(key)) {
        acc[key] = obj[key];
      }
      return acc;
    }, {});
  }

  static omit(obj, keys) {
    if (!obj) return {};
    const result = { ...obj };
    keys.forEach(key => delete result[key]);
    return result;
  }

  static deepMerge(target, source) {
    const result = { ...target };
    for (const key in source) {
      if (source[key] && typeof source[key] === 'object' && !Array.isArray(source[key])) {
        result[key] = this.deepMerge(target[key] || {}, source[key]);
      } else {
        result[key] = source[key];
      }
    }
    return result;
  }

  static isEmpty(obj) {
    if (!obj) return true;
    if (Array.isArray(obj)) return obj.length === 0;
    if (typeof obj === 'object') return Object.keys(obj).length === 0;
    return false;
  }

  static groupBy(array, key) {
    if (!array || !Array.isArray(array)) return {};
    return array.reduce((result, item) => {
      const groupKey = item[key];
      if (!result[groupKey]) result[groupKey] = [];
      result[groupKey].push(item);
      return result;
    }, {});
  }

  // ==================== MANIPULAÇÃO DE ARRAYS ====================
  
  static unique(array, key = null) {
    if (!array || !Array.isArray(array)) return [];
    if (!key) return [...new Set(array)];
    
    const seen = new Set();
    return array.filter(item => {
      const value = item[key];
      if (seen.has(value)) return false;
      seen.add(value);
      return true;
    });
  }

  static chunk(array, size) {
    if (!array || !Array.isArray(array)) return [];
    const chunks = [];
    for (let i = 0; i < array.length; i += size) {
      chunks.push(array.slice(i, i + size));
    }
    return chunks;
  }

  static shuffle(array) {
    if (!array || !Array.isArray(array)) return [];
    const shuffled = [...array];
    for (let i = shuffled.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }
    return shuffled;
  }

  // ==================== MANIPULAÇÃO DE DATAS ====================
  
  static getWeekNumber(date) {
    const d = new Date(date);
    d.setHours(0, 0, 0, 0);
    d.setDate(d.getDate() + 3 - (d.getDay() + 6) % 7);
    const week1 = new Date(d.getFullYear(), 0, 4);
    return 1 + Math.round(((d - week1) / 86400000 - 3 + (week1.getDay() + 6) % 7) / 7);
  }

  static getLiturgicalSeason(date) {
    const d = new Date(date);
    const month = d.getMonth();
    const day = d.getDate();
    
    if (month === 0) return 'Natal';
    if (month === 1 && day < 15) return 'Natal';
    if (month === 1 && day >= 15) return 'Tempo Comum';
    if (month === 2 && day < 20) return 'Quaresma';
    if (month === 2 && day >= 20) return 'Quaresma';
    if (month === 3 && day < 20) return 'Quaresma';
    if (month === 3 && day >= 20) return 'Páscoa';
    if (month === 4) return 'Páscoa';
    if (month === 5 && day < 10) return 'Páscoa';
    if (month === 5 && day >= 10) return 'Tempo Comum';
    if (month === 10 && day < 20) return 'Tempo Comum';
    if (month === 10 && day >= 20) return 'Advento';
    if (month === 11) return 'Advento';
    return 'Tempo Comum';
  }

  // ==================== CACHE HELPERS ====================
  
  static memoize(fn, ttl = 60000) {
    const cache = new Map();
    return async (...args) => {
      const key = JSON.stringify(args);
      const cached = cache.get(key);
      
      if (cached && Date.now() - cached.timestamp < ttl) {
        return cached.value;
      }
      
      const value = await fn(...args);
      cache.set(key, { value, timestamp: Date.now() });
      return value;
    };
  }

  // ==================== TRATAMENTO DE ERROS ====================
  
  static createError(message, status = 400, code = null) {
    const error = new Error(message);
    error.status = status;
    error.code = code;
    return error;
  }

  static async sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  static async retry(fn, retries = 3, delay = 1000, backoff = 2) {
    let lastError;
    for (let i = 0; i < retries; i++) {
      try {
        return await fn();
      } catch (error) {
        lastError = error;
        if (i < retries - 1) {
          const waitTime = delay * Math.pow(backoff, i);
          await this.sleep(waitTime);
        }
      }
    }
    throw lastError;
  }

  static async tryCatch(promise, errorMessage = 'Erro na operação') {
    try {
      const result = await promise;
      return { data: result, error: null };
    } catch (error) {
      return { data: null, error: error.message || errorMessage };
    }
  }

  // ==================== CRIPTOGRAFIA BÁSICA ====================
  
  static base64Encode(str) {
    if (typeof btoa !== 'undefined') return btoa(str);
    return Buffer.from(str).toString('base64');
  }

  static base64Decode(str) {
    if (typeof atob !== 'undefined') return atob(str);
    return Buffer.from(str, 'base64').toString();
  }

  // ==================== LOGGING ====================
  
  static logError(error, context = {}) {
    console.error('[ERROR]', {
      message: error.message,
      stack: error.stack,
      context,
      timestamp: new Date().toISOString()
    });
  }

  static logInfo(message, data = {}) {
    console.log('[INFO]', message, data);
  }

  static logWarning(message, data = {}) {
    console.warn('[WARNING]', message, data);
  }
}

export default Helpers;