// Sistema de cache em memória (com fallback para banco)
import { cacheQueries } from '../db/queries.js';

class MemoryCache {
  constructor() {
    this.cache = new Map();
    this.stats = {
      hits: 0,
      misses: 0,
      sets: 0,
      deletes: 0
    };
    
    // Limpar cache expirado a cada minuto
    setInterval(() => this.cleanup(), 60 * 1000);
  }
  
  async get(key) {
    const item = this.cache.get(key);
    
    if (item) {
      if (item.expiresAt > Date.now()) {
        this.stats.hits++;
        return item.value;
      } else {
        // Item expirado
        this.cache.delete(key);
      }
    }
    
    this.stats.misses++;
    
    // Fallback para cache do banco
    try {
      const dbValue = await cacheQueries.getCache(key);
      if (dbValue) {
        // Trazer para cache em memória
        this.set(key, dbValue, 300); // 5 minutos
        return dbValue;
      }
    } catch (error) {
      console.warn('Cache DB fallback falhou:', error.message);
    }
    
    return null;
  }
  
  async set(key, value, ttlSeconds = 300) {
    const expiresAt = Date.now() + (ttlSeconds * 1000);
    this.cache.set(key, { value, expiresAt });
    this.stats.sets++;
    
    // Também salvar no banco (async)
    try {
      await cacheQueries.setCache(key, value, ttlSeconds);
    } catch (error) {
      console.warn('Não foi possível salvar cache no banco:', error.message);
    }
    
    return true;
  }
  
  delete(key) {
    const deleted = this.cache.delete(key);
    if (deleted) {
      this.stats.deletes++;
      
      // Também deletar do banco (async)
      cacheQueries.clearExpiredCache().catch(() => {});
    }
    return deleted;
  }
  
  has(key) {
    const item = this.cache.get(key);
    return item && item.expiresAt > Date.now();
  }
  
  cleanup() {
    const now = Date.now();
    let cleaned = 0;
    
    for (const [key, item] of this.cache.entries()) {
      if (item.expiresAt <= now) {
        this.cache.delete(key);
        cleaned++;
      }
    }
    
    if (cleaned > 0) {
      console.log(`🧹 Cache limpo: ${cleaned} itens expirados removidos`);
    }
  }
  
  clear() {
    const size = this.cache.size;
    this.cache.clear();
    console.log(`🗑️  Cache limpo completamente: ${size} itens removidos`);
    return size;
  }
  
  getStats() {
    return {
      ...this.stats,
      size: this.cache.size,
      memoryUsage: process.memoryUsage().heapUsed,
      timestamp: new Date().toISOString()
    };
  }
  
  // Cache para APIs específicas
  async cachedApiCall(key, apiCall, ttlSeconds = 300) {
    // Verificar cache primeiro
    const cached = await this.get(key);
    if (cached) {
      return { ...cached, _cached: true };
    }
    
    // Chamar API
    const result = await apiCall();
    
    // Salvar no cache
    await this.set(key, result, ttlSeconds);
    
    return { ...result, _cached: false };
  }
}

// Cache global
export const cache = new MemoryCache();

// Funções helpers específicas
export const apiCache = {
  // Cache para Vatican News
  vaticanNews: async () => {
    const key = 'vatican_news';
    return cache.cachedApiCall(key, async () => {
      // Esta função será implementada no vatican.js
      return { news: [] };
    }, 3600); // 1 hora
  },
  
  // Cache para YouTube
  youtubeVideos: async () => {
    const key = 'youtube_videos';
    return cache.cachedApiCall(key, async () => {
      return { videos: [] };
    }, 1800); // 30 minutos
  },
  
  // Cache para Instagram
  instagramPosts: async () => {
    const key = 'instagram_posts';
    return cache.cachedApiCall(key, async () => {
      return { posts: [] };
    }, 1800); // 30 minutos
  },
  
  // Cache para santo do dia
  santoDoDia: async (date = null) => {
    const targetDate = date || new Date();
    const key = `santo_${targetDate.getDate()}_${targetDate.getMonth() + 1}`;
    
    return cache.cachedApiCall(key, async () => {
      return { santo: 'Santo do dia' };
    }, 86400); // 24 horas
  }
};

// Middleware de cache para Express
export const cacheMiddleware = (ttlSeconds = 300) => {
  return async (req, res, next) => {
    // Apenas cache GET requests
    if (req.method !== 'GET') {
      return next();
    }
    
    const key = `express:${req.originalUrl}`;
    
    try {
      const cached = await cache.get(key);
      if (cached) {
        // Enviar cabeçalho indicando cache
        res.set('X-Cache', 'HIT');
        return res.json(cached);
      }
      
      // Sobrescrever res.json para capturar a resposta
      const originalJson = res.json;
      res.json = function(data) {
        // Salvar no cache
        cache.set(key, data, ttlSeconds).catch(() => {});
        
        // Adicionar cabeçalho
        this.set('X-Cache', 'MISS');
        
        // Chamar original
        originalJson.call(this, data);
      };
      
      next();
    } catch (error) {
      console.error('Cache middleware error:', error);
      next();
    }
  };
};

// Limpar cache por padrão (ex: /api/*)
export const clearCacheByPattern = (pattern) => {
  const regex = new RegExp(pattern.replace(/\*/g, '.*'));
  let cleared = 0;
  
  for (const key of cache.cache.keys()) {
    if (regex.test(key)) {
      cache.delete(key);
      cleared++;
    }
  }
  
  return cleared;
};

export default {
  cache,
  apiCache,
  cacheMiddleware,
  clearCacheByPattern
};