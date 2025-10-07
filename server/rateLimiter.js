import rateLimit from 'express-rate-limit';
import RedisStore from 'rate-limit-redis';
import Redis from 'ioredis';

// Configurar Redis
let redisClient = null;

try {
  // Usar REDIS_URL si está disponible, sino usar host/port individuales
  const redisConfig = process.env.REDIS_URL ? 
    process.env.REDIS_URL : 
    {
      host: process.env.REDIS_HOST || 'localhost',
      port: process.env.REDIS_PORT || 6379,
      password: process.env.REDIS_PASSWORD || undefined,
      retryDelayOnFailover: 100,
      enableReadyCheck: false,
      maxRetriesPerRequest: null,
      lazyConnect: true
    };
  
  redisClient = new Redis(redisConfig);

  redisClient.on('connect', () => {
    console.log('✅ Conectado a Redis para rate limiting');
  });

  redisClient.on('error', (err) => {
    console.warn('⚠️ Error de Redis, usando rate limiting en memoria:', err.message);
    redisClient = null;
  });
} catch (error) {
  console.warn('⚠️ No se pudo conectar a Redis, usando rate limiting en memoria:', error.message);
  redisClient = null;
}

// Rate limiter general para API
export const apiRateLimiter = rateLimit({
  windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS) || 60000, // 1 minuto
  max: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS) || 5000, // 5000 requests por minuto (más permisivo para reportes)
  message: {
    error: 'Demasiadas solicitudes desde esta IP',
    code: 'RATE_LIMIT_EXCEEDED',
    retryAfter: '1 minuto'
  },
  standardHeaders: true,
  legacyHeaders: false,
  store: redisClient ? new RedisStore({
    sendCommand: (...args) => redisClient.call(...args),
    prefix: 'rl:api:'
  }) : undefined,
  skip: (req) => {
    // Saltar rate limiting para health checks y reportes
    return req.path === '/health' || 
           req.path === '/api/health' || 
           req.path === '/api/reports/summary' ||
           req.path.startsWith('/api/reports/');
  },
  keyGenerator: (req) => {
    // Usar IP real del cliente
    return req.ip || req.connection.remoteAddress || 'unknown';
  }
});

// Rate limiter estricto para login
export const loginRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutos
  max: 5, // 5 intentos de login por IP cada 15 minutos
  message: {
    error: 'Demasiados intentos de login fallidos',
    code: 'LOGIN_RATE_LIMIT_EXCEEDED',
    retryAfter: '15 minutos'
  },
  standardHeaders: true,
  legacyHeaders: false,
  store: redisClient ? new RedisStore({
    sendCommand: (...args) => redisClient.call(...args),
    prefix: 'rl:login:'
  }) : undefined,
  skipSuccessfulRequests: true, // No contar requests exitosos
  skipFailedRequests: false, // Contar requests fallidos
  keyGenerator: (req) => {
    return `login-${req.ip}`;
  }
});

// Rate limiter para webhooks de n8n
export const webhookRateLimiter = rateLimit({
  windowMs: 60000, // 1 minuto
  max: 30, // 30 webhooks por minuto
  message: {
    error: 'Demasiados webhooks desde esta fuente',
    code: 'WEBHOOK_RATE_LIMIT_EXCEEDED',
    retryAfter: '1 minuto'
  },
  standardHeaders: true,
  legacyHeaders: false,
  store: redisClient ? new RedisStore({
    sendCommand: (...args) => redisClient.call(...args),
    prefix: 'rl:webhook:'
  }) : undefined,
  keyGenerator: (req) => {
    // Para webhooks, usar chat_id si está disponible
    const chatId = req.body?.chatId || req.body?.data?.key?.remoteJid || req.ip;
    return `webhook-${chatId}`;
  }
});

// Rate limiter para operaciones sensibles (actualizar tasas, etc.)
export const sensitiveOperationsRateLimiter = rateLimit({
  windowMs: 2 * 60 * 1000, // 2 minutos (reducido de 5)
  max: 50, // 50 operaciones cada 2 minutos (aumentado de 10)
  message: {
    error: 'Demasiadas operaciones sensibles',
    code: 'SENSITIVE_RATE_LIMIT_EXCEEDED',
    retryAfter: '2 minutos'
  },
  standardHeaders: true,
  legacyHeaders: false,
  store: redisClient ? new RedisStore({
    sendCommand: (...args) => redisClient.call(...args),
    prefix: 'rl:sensitive:'
  }) : undefined,
  keyGenerator: (req) => {
    // Usar usuario autenticado si está disponible
    const userId = req.user?.id || req.ip;
    return `sensitive-${userId}`;
  }
});

// Middleware personalizado para WhatsApp con lógica específica
export const whatsappRateLimiter = (req, res, next) => {
  const chatId = req.body?.data?.key?.remoteJid || req.body?.chatId || 'unknown';
  const messageType = req.body?.data?.message ? Object.keys(req.body.data.message)[0] : 'unknown';
  
  // Logging para debugging
  console.log(`[RATE_LIMIT] WhatsApp message from ${chatId}, type: ${messageType}`);
  
  // Aplicar rate limiting específico por chat
  const chatRateLimiter = rateLimit({
    windowMs: 60000, // 1 minuto
    max: 10, // 10 mensajes por chat por minuto
    message: {
      error: 'Demasiados mensajes desde este chat',
      code: 'WHATSAPP_RATE_LIMIT_EXCEEDED',
      chatId: chatId,
      retryAfter: '1 minuto'
    },
    standardHeaders: false,
    legacyHeaders: false,
    store: redisClient ? new RedisStore({
      sendCommand: (...args) => redisClient.call(...args),
      prefix: 'rl:whatsapp:'
    }) : undefined,
    keyGenerator: () => `whatsapp-${chatId}`
  });
  
  chatRateLimiter(req, res, next);
};

// Función para limpiar rate limits (útil para testing)
export const clearRateLimit = async (key) => {
  if (redisClient) {
    try {
      const keys = await redisClient.keys(`*${key}*`);
      if (keys.length > 0) {
        await redisClient.del(...keys);
        console.log(`🧹 Limpiados ${keys.length} rate limits para: ${key}`);
      }
    } catch (error) {
      console.error('Error limpiando rate limits:', error);
    }
  }
};

// Función para obtener estadísticas de rate limiting
export const getRateLimitStats = async () => {
  if (!redisClient) {
    return { error: 'Redis no disponible' };
  }
  
  try {
    const apiKeys = await redisClient.keys('rl:api:*');
    const loginKeys = await redisClient.keys('rl:login:*');
    const webhookKeys = await redisClient.keys('rl:webhook:*');
    const whatsappKeys = await redisClient.keys('rl:whatsapp:*');
    
    return {
      api: apiKeys.length,
      login: loginKeys.length,
      webhook: webhookKeys.length,
      whatsapp: whatsappKeys.length,
      total: apiKeys.length + loginKeys.length + webhookKeys.length + whatsappKeys.length
    };
  } catch (error) {
    return { error: error.message };
  }
};

// Exportar cliente Redis para uso en otros módulos
export { redisClient };