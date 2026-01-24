import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';

// Cargar variables de entorno
dotenv.config();

// Importar módulos de autenticación y rate limiting
import { 
  authenticateToken, 
  requireRole, 
  authenticateUser, 
  logAuthEvent,
  updateUser,
  createUser,
  getAllUsers,
  deleteUser,
  getUserById,
  validatePassword,
  generateAccessToken,
  createUserSession,
  refreshAccessToken,
  invalidateUserSession,
  cleanupExpiredSessions
} from './auth.js';
import { 
  apiRateLimiter, 
  loginRateLimiter, 
  webhookRateLimiter, 
  sensitiveOperationsRateLimiter,
  whatsappRateLimiter,
  getRateLimitStats 
} from './rateLimiter.js';
import { setupActivityEndpoint } from './activity.js';
import { logger, logOperations, COMPONENTS, getLogsFromCache, getCacheStats } from './logger.js';
import { 
  notificationSystem, 
  notifySystemError, 
  notifySecurityAlert, 
  notifyTransactionFailed, 
  notifyDatabaseError, 
  notifyLargeTransaction,
  notifyBackupFailed,
  notifyMultipleLoginFailures,
  NOTIFICATION_TYPES,
  PRIORITY_LEVELS
} from './notifications.js';
import { initializeBackupScheduler, getSchedulerStatus } from './scheduler.js';
import multer from 'multer';

const app = express();
const PORT = process.env.PORT || 3001;

// Configurar middlewares básicos ANTES de las rutas
app.use(cors({
  // Permitir origen desde variable de entorno o todos (*) para evitar problemas en deploy
  origin: process.env.CORS_ORIGIN ? process.env.CORS_ORIGIN.split(',') : '*',
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));
app.use(express.json());

// Configurar Supabase API
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY;

let supabase = null;
let dbConnected = false;

try {
  supabase = createClient(supabaseUrl, supabaseKey);
  console.log('🔧 Configurando conexión con Supabase API...');
  
  // Probar conexión simple
  supabase.from('global_rate').select('count').limit(1).then(({ data, error }) => {
    if (error) {
      console.error('❌ Error conectando con Supabase API:', error.message);
      dbConnected = false;
    } else {
      console.log('✅ Conectado a Supabase API exitosamente');
      dbConnected = true;
    }
  }).catch(err => {
    console.error('❌ Error de conexión Supabase:', err.message);
    dbConnected = false;
  });

} catch (error) {
  console.error('❌ Error inicializando cliente Supabase:', error.message);
}

// Inicializar el sistema de notificaciones
notificationSystem.initialize().catch(err => {
  console.error('❌ Error inicializando sistema de notificaciones:', err);
});

// Inicializar el scheduler de backups
initializeBackupScheduler().catch(err => {
  console.error('❌ Error inicializando scheduler de backups:', err);
});

// Middleware de logging para todas las peticiones
app.use((req, res, next) => {
  const start = Date.now();
  
  // Interceptar res.end para calcular duración y loguear respuesta
  const originalEnd = res.end;
  res.end = function(...args) {
    const duration = Date.now() - start;
    
    // No loguear health checks o assets estáticos para no saturar
    if (!req.url.includes('/health') && !req.url.match(/\.(js|css|png|jpg|ico)$/)) {
      logger.info('HTTP Request', {
        component: COMPONENTS.API,
        method: req.method,
        url: req.url,
        status: res.statusCode,
        duration: `${duration}ms`,
        ip: req.ip,
        userAgent: req.get('user-agent')
      });
    }
    
    originalEnd.apply(res, args);
  };
  
  next();
});

// Rutas de autenticación
app.post('/api/auth/login', loginRateLimiter, async (req, res) => {
  try {
    const { username, password } = req.body;
    
    if (!username || !password) {
      return res.status(400).json({ error: 'Usuario y contraseña requeridos' });
    }
    
    // Autenticar usuario
    const { user, error } = await authenticateUser(username, password);
    
    if (error || !user) {
      // El log de fallo ya se maneja dentro de authenticateUser
      return res.status(401).json({ error: 'Credenciales inválidas' });
    }
    
    // Generar tokens
    const accessToken = generateAccessToken(user);
    const refreshToken = await createUserSession(user.id, req.ip, req.get('user-agent'));
    
    // El log de éxito ya se maneja dentro de authenticateUser
    
    res.json({
      success: true,
      user: {
        id: user.id,
        username: user.username,
        email: user.email,
        role: user.role,
        full_name: user.full_name
      },
      accessToken,
      refreshToken
    });
    
  } catch (error) {
    console.error('Error en login:', error);
    logger.error('Login error', { component: COMPONENTS.AUTH, error: error.message });
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

app.post('/api/auth/refresh', async (req, res) => {
  try {
    const { refreshToken } = req.body;
    
    if (!refreshToken) {
      return res.status(400).json({ error: 'Refresh token requerido' });
    }
    
    const result = await refreshAccessToken(refreshToken);
    
    if (result.error) {
      return res.status(401).json({ error: result.error });
    }
    
    res.json({
      accessToken: result.accessToken,
      refreshToken: result.newRefreshToken
    });
    
  } catch (error) {
    console.error('Error en refresh token:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

app.post('/api/auth/logout', async (req, res) => {
  try {
    const { refreshToken } = req.body;
    
    if (refreshToken) {
      await invalidateUserSession(refreshToken);
    }
    
    res.json({ message: 'Sesión cerrada exitosamente' });
    
  } catch (error) {
    console.error('Error en logout:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

app.get('/api/auth/me', authenticateToken, (req, res) => {
  res.json({ user: req.user });
});

// Rutas de administración de usuarios (solo admin/owner)
app.get('/api/users', authenticateToken, requireRole(['admin', 'owner']), async (req, res) => {
  try {
    const users = await getAllUsers();
    res.json(users);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/users', authenticateToken, requireRole(['admin', 'owner']), sensitiveOperationsRateLimiter, async (req, res) => {
  try {
    const newUser = await createUser(req.body);
    
    logOperations.userAction('create_user', req.user.id, { 
      targetUserId: newUser.id,
      role: newUser.role 
    });
    
    res.status(201).json(newUser);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

app.put('/api/users/:id', authenticateToken, requireRole(['admin', 'owner']), async (req, res) => {
  try {
    // Evitar que un admin modifique a un owner o a sí mismo si no es para actualizar perfil básico
    // Esta lógica podría refinarse
    
    const updatedUser = await updateUser(req.params.id, req.body);
    
    logOperations.userAction('update_user', req.user.id, { 
      targetUserId: req.params.id,
      changes: Object.keys(req.body)
    });
    
    res.json(updatedUser);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

app.delete('/api/users/:id', authenticateToken, requireRole(['owner']), sensitiveOperationsRateLimiter, async (req, res) => {
  try {
    await deleteUser(req.params.id);
    
    logOperations.userAction('delete_user', req.user.id, { 
      targetUserId: req.params.id 
    });
    
    res.json({ message: 'Usuario eliminado correctamente' });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// Rutas protegidas de la aplicación
app.get('/api/tasas', authenticateToken, apiRateLimiter, async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('global_rate')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(1);

    if (error) throw error;
    res.json(data[0] || { cop_rate: 0, bob_rate: 0 });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/tasas', authenticateToken, requireRole(['admin', 'owner']), async (req, res) => {
  try {
    const { cop_rate, bob_rate } = req.body;
    
    // Validación básica
    if (cop_rate <= 0 || bob_rate <= 0) {
      return res.status(400).json({ error: 'Las tasas deben ser mayores a 0' });
    }

    const { data, error } = await supabase
      .from('global_rate')
      .insert([{ 
        cop_rate, 
        bob_rate,
        updated_by: req.user.id 
      }])
      .select();

    if (error) throw error;
    
    logOperations.rateUpdate(req.user.id, { cop: cop_rate, bob: bob_rate });
    
    // Notificar cambio importante si la variación es grande (pendiente implementar lógica de comparación)
    
    res.json(data[0]);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Endpoint para Logs del Sistema
app.get('/api/logs', authenticateToken, requireRole(['admin', 'owner']), async (req, res) => {
  try {
    const limit = parseInt(req.query.limit) || 100;
    const level = req.query.level;
    const component = req.query.component;
    
    let query = supabase
      .from('system_logs')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(limit);
      
    if (level) query = query.eq('level', level);
    if (component) query = query.eq('component', component);
    
    const { data, error } = await query;
    
    if (error) throw error;
    res.json(data);
  } catch (error) {
    console.error('Error fetching logs:', error);
    res.status(500).json({ error: 'Error obteniendo logs' });
  }
});

// Endpoint de Actividad Reciente
setupActivityEndpoint(app, supabase);

// Health Check
app.get('/health', (req, res) => {
  const status = {
    status: 'ok',
    timestamp: new Date().toISOString(),
    database: dbConnected ? 'connected' : 'disconnected',
    version: process.env.npm_package_version || '1.0.0'
  };
  
  // Si la BD está desconectada, devolver 503 pero con info
  if (!dbConnected) {
    return res.status(503).json(status);
  }
  
  res.json(status);
});

// Endpoint de métricas para admin
app.get('/api/metrics', authenticateToken, requireRole(['admin', 'owner']), async (req, res) => {
  try {
    // Obtener estadísticas de Rate Limiting
    const rateLimitStats = await getRateLimitStats();
    
    // Obtener estadísticas de caché (si existiera)
    const cacheStats = getCacheStats();
    
    // Obtener estado del sistema
    const systemStatus = {
      uptime: process.uptime(),
      memory: process.memoryUsage(),
      cpu: process.cpuUsage()
    };
    
    res.json({
      rateLimits: rateLimitStats,
      cache: cacheStats,
      system: systemStatus,
      scheduler: getSchedulerStatus()
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Rutas para Webhooks (WhatsApp/Stripe/etc)
app.post('/api/webhooks/whatsapp', whatsappRateLimiter, async (req, res) => {
  // Implementación futura
  res.status(200).send('OK');
});

// 8. Gestión de Backups
// Log para debugging de rutas
app.use('/api/backups/*', (req, res, next) => {
  console.log(`🔍 RUTA BACKUP INTERCEPTADA: ${req.method} ${req.originalUrl}`);
  next();
});

// Crear backup manual
app.post('/api/backups/create', authenticateToken, requireRole(['admin', 'owner']), sensitiveOperationsRateLimiter, async (req, res) => {
  try {
    console.log('📥 req.body:', req.body);
    // Importar dinámicamente para evitar dependencias circulares si las hubiera
    const { createBackup } = await import('./backupService.js');
    
    const type = req.body.type || 'full'; // 'full', 'db_only', 'logs_only'
    
    logger.info('Iniciando backup manual', { 
      component: COMPONENTS.BACKUP, 
      userId: req.user.id,
      type 
    });
    
    const result = await createBackup(type, req.user.id);
    
    if (!result.success) {
      return res.status(500).json({ error: result.error });
    }
    
    res.json({ 
      message: 'Backup creado exitosamente', 
      backupId: result.backupId,
      path: result.path,
      size: result.size
    });
    
  } catch (error) {
    console.error('❌ Error creando backup manual:', error);
    res.status(500).json({ error: error.message });
  }
});

// Listar backups
app.get('/api/backups', authenticateToken, requireRole(['admin', 'owner']), async (req, res) => {
  try {
    const { listBackups } = await import('./backupService.js');
    const backups = await listBackups();
    res.json(backups);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Restaurar backup
app.post('/api/backups/restore/:id', authenticateToken, requireRole(['owner']), sensitiveOperationsRateLimiter, async (req, res) => {
  try {
    const { restoreBackup } = await import('./backupService.js');
    const backupId = req.params.id;
    
    logger.warn('Iniciando restauración de backup', { 
      component: COMPONENTS.BACKUP, 
      userId: req.user.id,
      backupId 
    });
    
    const result = await restoreBackup(backupId);
    
    if (!result.success) {
      return res.status(500).json({ error: result.error });
    }
    
    res.json({ message: 'Sistema restaurado exitosamente' });
    
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Descargar backup
app.get('/api/backups/download/:filename', authenticateToken, requireRole(['admin', 'owner']), async (req, res) => {
  try {
    const { getBackupPath } = await import('./backupService.js');
    const filename = req.params.filename;
    const filePath = getBackupPath(filename);
    
    res.download(filePath, filename, (err) => {
      if (err) {
        logger.error('Error descargando backup', { error: err.message, filename });
        if (!res.headersSent) {
          res.status(404).json({ error: 'Archivo no encontrado' });
        }
      }
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Manejo de errores global
app.use((err, req, res, next) => {
  console.error('🔥 Error no manejado:', err);
  logger.error('Unhandled Error', { 
    component: COMPONENTS.SYSTEM, 
    error: err.message, 
    stack: err.stack 
  });
  
  notifySystemError(err, 'Global Error Handler');
  
  res.status(500).json({ 
    error: 'Error interno del sistema',
    requestId: req.headers['x-request-id']
  });
});

app.listen(PORT, '0.0.0.0', () => {
  console.log(`
🚀 Servidor corriendo en puerto ${PORT}
⭐️ Ambiente: ${process.env.NODE_ENV}
📝 Database: ${process.env.DATABASE_URL ? 'Configurada' : 'No configurada'}
  `);
  
  logger.info('Server started', { 
    component: COMPONENTS.SYSTEM, 
    port: PORT, 
    env: process.env.NODE_ENV 
  });
});
