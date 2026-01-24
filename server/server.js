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
  supabase.from('global_rate').select('id').limit(1).then(({ data, error }) => {
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
    const { token, jti } = generateAccessToken(user);
    const refreshToken = await createUserSession(user.id, jti, req.ip, req.get('user-agent'));
    
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
      accessToken: token,
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

// Verificar token válido (usado por frontend para checkear sesión)
app.get('/api/auth/verify', authenticateToken, (req, res) => {
  res.json({ 
    valid: true, 
    user: req.user 
  });
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

// Rutas de Tasas
app.get('/api/rate/current', authenticateToken, async (req, res) => {
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

app.get('/api/rate/history', authenticateToken, async (req, res) => {
  try {
    const limit = parseInt(req.query.limit) || 50;
    const { data, error } = await supabase
      .from('global_rate')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(limit);

    if (error) throw error;

    // Mapear datos para coincidir con la interfaz RateHistory del frontend
    const mappedData = (data || []).map((item, index, arr) => {
      // Calcular cambio respecto al registro anterior (que es el siguiente en el array por el sort desc)
      const nextItem = arr[index + 1];
      const currentRate = item.rate || item.cop_rate || 0;
      const prevRate = nextItem ? (nextItem.rate || nextItem.cop_rate || 0) : currentRate;
      const diff = currentRate - prevRate;
      const sign = diff > 0 ? '+' : '';
      
      return {
        date: item.created_at || item.updated_at || new Date().toISOString(),
        rate: currentRate,
        change: `${sign}${diff}`,
        user: 'Admin' // Placeholder hasta implementar join con users
      };
    });

    res.json(mappedData);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/rate/update', authenticateToken, requireRole(['admin', 'owner']), async (req, res) => {
  try {
    const { rate } = req.body; // El frontend envía { rate: 123 }
    // Asumimos que "rate" se refiere a cop_rate o bob_rate dependiendo del contexto,
    // pero el frontend actual parece manejar una sola tasa principal o necesita enviar ambas.
    // Ajustaremos para aceptar { cop_rate, bob_rate } o mapear "rate" a uno de ellos.
    
    // Si el frontend envía solo "rate", asumimos que es una actualización simplificada.
    // Pero para robustez, vamos a ver qué envía exactamente el frontend en api.ts.
    // api.ts: updateRate(rate: number) -> body: { rate }
    // Esto es ambiguo si hay dos tasas. Asumiremos que es la tasa principal (ej. COP).
    // O mejor, actualizamos el endpoint para ser flexible.
    
    const cop_rate = req.body.cop_rate || req.body.rate;
    const bob_rate = req.body.bob_rate || 0; // O mantener la anterior...

    // Para evitar romper la lógica de dos tasas, consultamos la última para mantener la otra si falta
    const { data: lastRate } = await supabase.from('global_rate').select('*').order('created_at', { ascending: false }).limit(1).single();
    
    const finalCopRate = cop_rate || lastRate?.cop_rate || 0;
    const finalBobRate = bob_rate || lastRate?.bob_rate || 0;

    // Detectar qué columnas tiene la tabla para saber qué insertar
    // Por seguridad, intentamos insertar 'rate' si existe, o 'cop_rate' si es el nuevo esquema
    // Como no podemos consultar el esquema fácilmente, probaremos insertar 'rate' que es el legacy seguro
    // O mejor, verificamos si la tabla tiene cop_rate en el GET anterior, pero aquí es POST.
    
    // ESTRATEGIA SEGURA: Intentar insertar con el esquema que sabemos que funciona (migration.sql dice 'rate')
    // Si queremos soportar ambos, necesitaríamos saber el esquema.
    // Asumiremos 'rate' como principal por el migration.sql
    
    const insertData = {
      rate: finalCopRate, // Usamos la tasa principal como 'rate'
      updated_at: new Date()
      // updated_by no existe en migration.sql para global_rate, verificar si agregarlo
    };
    
    // Verificar si migration.sql tiene updated_by. NO LO TIENE.
    // Tabla: id, rate, updated_at, created_at.
    
    const { data, error } = await supabase
      .from('global_rate')
      .insert([insertData])
      .select();

    if (error) {
      // Si falla porque no existe 'rate' (quizás es el esquema nuevo), intentamos con cop_rate
      if (error.message.includes('column "rate" does not exist')) {
         console.log('⚠️ Tabla global_rate parece usar nuevo esquema, reintentando con cop_rate...');
         const { data: data2, error: error2 } = await supabase
          .from('global_rate')
          .insert([{ 
            cop_rate: finalCopRate, 
            bob_rate: finalBobRate,
            updated_by: req.user.id 
          }])
          .select();
          
         if (error2) throw error2;
         
         logOperations.rateUpdate(req.user.id, { cop: finalCopRate, bob: finalBobRate });
         return res.json({ success: true, message: 'Tasa actualizada correctamente', data: data2[0] });
      }
      throw error;
    }
    
    logOperations.rateUpdate(req.user.id, { rate: finalCopRate });
    
    res.json({ success: true, message: 'Tasa actualizada correctamente', data: data[0] });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Rutas protegidas de la aplicación (Legacy /api/tasas si es necesario, o redirigir)
app.get('/api/tasas', authenticateToken, apiRateLimiter, async (req, res) => {
  // ... lógica existente ...
  res.redirect('/api/rate/current');
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
  
  // Si la BD está desconectada, intentar reconectar una vez antes de fallar
  if (!dbConnected) {
    supabase.from('global_rate').select('id').limit(1).then(({ error }) => {
      if (!error) {
        dbConnected = true;
        status.database = 'connected';
      }
    });
    
    // Si sigue desconectada tras el intento (asíncrono, así que esto es optimista para la próxima)
    // Para esta petición, retornamos 503 pero con el estado actualizado si tuvimos suerte en milisegundos anteriores
    if (!dbConnected) return res.status(503).json(status);
  }
  
  res.json(status);
});

// Endpoint de métricas para admin (Corregido URL para coincidir con frontend)
app.get('/api/dashboard/metrics', authenticateToken, requireRole(['admin', 'owner']), async (req, res) => {
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

    // Obtener métricas de negocio reales (si existen tablas)
    let totalTransactions = 0;
    let dailyVolume = 0;
    let activeCollaborators = 0;
    let currentRateValue = 0;

    if (dbConnected) {
      try {
        const { count: txCount } = await supabase.from('transactions').select('*', { count: 'exact', head: true });
        totalTransactions = txCount || 0;
        
        const { count: colCount } = await supabase.from('collaborators').select('*', { count: 'exact', head: true }).eq('status', 'active');
        activeCollaborators = colCount || 0;
        
        // Volumen diario (aproximado)
        const today = new Date().toISOString().split('T')[0];
        const { data: todayTxs } = await supabase
          .from('transactions')
          .select('usd_total')
          .gte('created_at', today);
          
        if (todayTxs) {
          dailyVolume = todayTxs.reduce((sum, tx) => sum + (tx.usd_total || 0), 0);
        }

        // Obtener tasa actual
        const { data: rateData } = await supabase
          .from('global_rate')
          .select('*')
          .order('created_at', { ascending: false })
          .limit(1);

        if (rateData && rateData.length > 0) {
          // Soporte agnóstico de esquema (rate o cop_rate)
          currentRateValue = rateData[0].rate || rateData[0].cop_rate || 0;
        }

      } catch (err) {
        console.warn('Error obteniendo métricas de DB, usando defaults', err.message);
      }
    }
    
    // Estructura esperada por DashboardMetrics en frontend
    res.json({
      totalTransactions,
      dailyVolume,
      currentRate: currentRateValue,
      activeCollaborators,
      systemStatus: 'active',
      pendingMessages: 0,
      // Extras para admin panel
      rateLimits: rateLimitStats,
      cache: cacheStats,
      serverStats: systemStatus,
      scheduler: getSchedulerStatus()
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ==========================================
// RUTAS DE TRANSACCIONES (Faltantes)
// ==========================================

app.get('/api/transactions', authenticateToken, async (req, res) => {
  try {
    // Implementación básica con Supabase
    let query = supabase.from('transactions').select('*').order('created_at', { ascending: false });
    
    // Aplicar filtros si existen (limit, etc)
    if (req.query.limit) {
      query = query.limit(parseInt(req.query.limit));
    }

    const { data, error } = await query;

    if (error) {
       // Si la tabla no existe, devolver array vacío para no romper el frontend
       if (error.code === '42P01') { // undefined_table
         console.warn('Tabla transactions no existe, devolviendo array vacío');
         return res.json([]);
       }
       throw error;
    }

    // Mapear campos si es necesario (snake_case a camelCase)
    // El frontend espera: id, fecha, cliente, colaborador, usdTotal, etc.
    // Asumimos que la DB tiene campos similares o mapeamos aquí
    const mappedData = data.map(tx => ({
      id: tx.id,
      fecha: tx.created_at || tx.fecha || new Date().toISOString(), // Fallback a fecha actual si no hay fecha
      cliente: tx.client_name || tx.cliente || 'Sin Cliente',
      colaborador: tx.collaborator_name || tx.colaborador || 'Sin Colaborador',
      usdTotal: Number(tx.usd_total || tx.usdTotal || 0),
      comision: Number(tx.commission || tx.comision || 0),
      usdNeto: Number(tx.net_amount_usd || tx.usdNeto || tx.usd_neto || 0), // Added usd_neto
      montoGs: Number(tx.amount_gs || tx.montoGs || tx.monto_gs || 0),      // Added monto_gs
      tasaUsada: Number(tx.exchange_rate || tx.tasaUsada || tx.tasa_usada || 0), // Added tasa_usada
      status: tx.status || 'completed',
      chatId: tx.chat_id || tx.chatId,
      idempotencyKey: tx.idempotency_key
    }));

    res.json(mappedData);
  } catch (error) {
    console.error('Error fetching transactions:', error);
    res.status(500).json({ error: 'Error al obtener transacciones' });
  }
});

app.post('/api/transactions', authenticateToken, sensitiveOperationsRateLimiter, async (req, res) => {
  try {
    const txData = req.body;
    // Mapear camelCase (frontend) a las columnas EXISTENTES de la BD (snake_case en español)
    // Basado en inspección: id, idempotency_key, fecha, chat_id, colaborador, cliente, usd_total, comision, usd_neto, monto_gs, tasa_usada...
    
    // Calcular campos calculados si no vienen
    const usdTotal = Number(txData.usdTotal || 0);
    const tasaUsada = Number(txData.tasaUsada || 0);
    const comision = Number(txData.comision || 0);
    const montoGs = usdTotal * tasaUsada; // Cálculo básico
    const usdNeto = usdTotal - comision;

    const dbData = {
      cliente: txData.cliente,           // Columna DB: cliente
      colaborador: txData.colaborador,   // Columna DB: colaborador
      usd_total: usdTotal,               // Columna DB: usd_total
      comision: comision,                // Columna DB: comision
      tasa_usada: tasaUsada,             // Columna DB: tasa_usada
      chat_id: txData.chatId,            // Columna DB: chat_id
      fecha: new Date(),                 // Columna DB: fecha
      created_at: new Date(),            // Columna DB: created_at
      
      // Campos calculados para consistencia
      usd_neto: usdNeto,                 // Columna DB: usd_neto
      monto_gs: montoGs,                 // Columna DB: monto_gs
      
      // Campos opcionales que podrían no existir en tablas antiguas, pero intentamos enviar si la migración corrió
      // Si fallan, Supabase podría ignorarlos o dar error. 
      // Idealmente correr migration_safe_additions.sql para agregar 'status' y 'created_by'
      status: 'completed'
    };
    
    // Eliminar created_by si no estamos seguros que la columna existe, para evitar error 42703
    // Pero si es vital, deberíamos asegurarnos con la migración.
    // Por ahora, lo enviamos. Si falla, el usuario debe correr el script safe.
    if (req.user && req.user.id) {
       dbData['created_by'] = req.user.id; 
    }

    const { data, error } = await supabase.from('transactions').insert([dbData]).select();
    
    if (error) {
       // Si el error es por columna faltante (ej: status), reintentar sin esa columna
       if (error.code === '42703') { // Undefined column
          console.warn('⚠️ Error de columna faltante en insert, reintentando con esquema básico...', error.message);
          delete dbData.status;
          delete dbData.created_by;
          const { data: retryData, error: retryError } = await supabase.from('transactions').insert([dbData]).select();
          if (retryError) throw retryError;
          return res.json({ success: true, message: 'Transacción creada (compatibilidad legacy)', transaction: retryData[0] });
       }
       throw error;
    }
    
    // Respuesta formato frontend
    res.json({
      success: true,
      message: 'Transacción creada',
      transaction: data[0]
    });
  } catch (error) {
    console.error('Error creating transaction:', error);
    res.status(500).json({ error: error.message });
  }
});

// ==========================================
// RUTAS DE COLABORADORES (Faltantes)
// ==========================================

app.get('/api/collaborators', authenticateToken, async (req, res) => {
  try {
    // 1. Obtener colaboradores
    const { data: collaborators, error: collabError } = await supabase.from('collaborators').select('*');
    
    if (collabError) {
      if (collabError.code === '42P01') return res.json([]);
      throw collabError;
    }

    // 2. Obtener transacciones para calcular totales en tiempo real
    const { data: transactions, error: txError } = await supabase
      .from('transactions')
      .select('colaborador, usd_total, comision, monto_gs');

    if (txError && txError.code !== '42P01') {
      console.warn('Error fetching transactions for stats:', txError);
    }

    // 3. Calcular métricas por colaborador
    const statsByCollaborator = {};
    
    if (transactions) {
      transactions.forEach(tx => {
        const name = tx.colaborador; 
        if (!name) return;

        if (!statsByCollaborator[name]) {
          statsByCollaborator[name] = { count: 0, commissionUsd: 0, commissionGs: 0 };
        }

        const usdTotal = Number(tx.usd_total || 0);
        const comisionPct = Number(tx.comision || 0);
        
        // Comisión generada = USD Total * (Porcentaje / 100)
        const commissionAmountUsd = usdTotal * (comisionPct / 100);
        
        // Comisión en Gs
        const montoGs = Number(tx.monto_gs || 0);
        const commissionAmountGs = montoGs * (comisionPct / 100);

        statsByCollaborator[name].count++;
        statsByCollaborator[name].commissionUsd += commissionAmountUsd;
        statsByCollaborator[name].commissionGs += commissionAmountGs;
      });
    }
    
    // 4. Mapear resultados
    const mapped = collaborators.map(c => {
      const stats = statsByCollaborator[c.name] || { count: 0, commissionUsd: 0, commissionGs: 0 };
      
      return {
        id: c.id,
        name: c.name,
        basePct: c.base_pct,
        // Usar cálculo en tiempo real
        txCount: stats.count,
        totalCommissionUsd: stats.commissionUsd,
        totalCommissionGs: stats.commissionGs,
        status: c.status || 'active',
        isOwner: c.is_owner || false,
        rules: c.rules || ''
      };
    });
    
    res.json(mapped);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ==========================================
// RUTAS DE CLIENTES (Faltantes)
// ==========================================

app.get('/api/clients', authenticateToken, async (req, res) => {
  try {
    // 1. Obtener clientes
    const { data: clients, error: clientsError } = await supabase.from('clients').select('*');
    
    if (clientsError) {
      if (clientsError.code === '42P01') return res.json([]);
      throw clientsError;
    }

    // 2. Obtener todas las transacciones para calcular estadísticas
    // Seleccionamos solo lo necesario para optimizar
    // Aumentamos el límite para asegurar que traemos todas las transacciones (Supabase default es 1000)
    const { data: transactions, error: txError } = await supabase
      .from('transactions')
      .select('cliente, usd_total, comision, created_at, fecha')
      .limit(10000); // Límite seguro para el volumen actual

    if (txError && txError.code !== '42P01') {
      console.warn('Error fetching transactions for client stats:', txError);
    }

    // 3. Calcular métricas por cliente
    const statsByClient = {};
    
    // Crear un mapa de nombres de clientes normalizados para búsqueda rápida
    const clientNameMap = {};
    clients.forEach(c => {
      if (c.name) clientNameMap[c.name.trim().toLowerCase()] = c.name;
    });

    console.log(`🔍 Stats Debug: Procesando ${transactions ? transactions.length : 0} transacciones para ${clients.length} clientes.`);

    if (transactions) {
      transactions.forEach(tx => {
        const clientNameRaw = tx.cliente;
        if (!clientNameRaw) return;

        // Normalizar nombre de la transacción
        const txClientName = clientNameRaw.trim().toLowerCase();
        
        // Intentar encontrar el nombre del cliente correspondiente
        let matchedClientName = txClientName;

        // Si existe un cliente exacto, usarlo.
        // Si no, intentar buscar si el nombre de la transacción es parte del nombre de un cliente (o viceversa)
        // Esto ayuda con casos como "Abuelita" (tx) -> "Abuelita Novia" (cliente)
        
        if (!statsByClient[matchedClientName]) {
             // Buscar coincidencia parcial si no existe entrada directa
             const possibleMatch = Object.keys(clientNameMap).find(cName => 
                 cName.includes(txClientName) || txClientName.includes(cName)
             );
             if (possibleMatch) {
                 matchedClientName = possibleMatch;
             }
        }

        if (!statsByClient[matchedClientName]) {
          statsByClient[matchedClientName] = {
            count: 0,
            volumeUsd: 0,
            commissions: 0,
            lastDate: null
          };
        }

        const usd = Number(tx.usd_total || 0);
        const comision = Number(tx.comision || 0);
        const comisionMonto = usd * (comision / 100);

        statsByClient[matchedClientName].count++;
        statsByClient[matchedClientName].volumeUsd += usd;
        statsByClient[matchedClientName].commissions += comisionMonto;
        
        const txDate = new Date(tx.created_at || tx.fecha);
        if (!isNaN(txDate.getTime())) {
            if (!statsByClient[matchedClientName].lastDate || txDate > statsByClient[matchedClientName].lastDate) {
              statsByClient[matchedClientName].lastDate = txDate;
            }
        }
      });
    }

    // 4. Mapear resultados
    const mappedClients = clients.map(client => {
      // Normalizar nombre del cliente para buscar en el mapa
      const clientNameNorm = (client.name || '').trim().toLowerCase();
      
      const stats = statsByClient[clientNameNorm] || { count: 0, volumeUsd: 0, commissions: 0, lastDate: null };
      
      // Calcular promedio
      const avg = stats.count > 0 ? stats.volumeUsd / stats.count : 0;
      
      // Determinar estado basado en actividad reciente (ej. 30 días)
      // O usar el estado de la base de datos si existe
      let status = client.status || 'inactive';
      
      // Si tiene transacciones recientes (ej. últimos 30 días), marcar como activo
      if (stats.lastDate) {
        const daysSinceLastTx = (new Date() - stats.lastDate) / (1000 * 60 * 60 * 24);
        // Forzar activo si tiene actividad reciente, independientemente del estado DB anterior
        if (daysSinceLastTx <= 30) {
            status = 'active';
        }
      } else if (!client.status && stats.count > 0) {
          status = 'inactive';
      } else if (!client.status) {
          status = 'inactive';
      }

      return {
        id: client.id,
        name: client.name,
        phone: client.phone || '',
        email: client.email || '',
        totalTransactions: stats.count,
        totalVolumeUsd: stats.volumeUsd,
        totalCommissions: stats.commissions,
        averageTransaction: avg,
        lastTransactionDate: stats.lastDate ? stats.lastDate.toISOString() : null, 
        status: status,
        notes: client.notes || ''
      };
    });

    res.json(mappedClients);
  } catch (error) {
    console.error('Error fetching clients:', error);
    res.status(500).json({ error: error.message });
  }
});

// Endpoint de métricas para admin (OLD - Deprecated but kept for compatibility if needed)
app.get('/api/metrics/legacy', authenticateToken, requireRole(['admin', 'owner']), async (req, res) => {
  try {
    const systemStatus = {
      uptime: process.uptime(),
      memory: process.memoryUsage(),
      cpu: process.cpuUsage()
    };
    res.json({ system: systemStatus });
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
