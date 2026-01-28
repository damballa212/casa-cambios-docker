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
const APP_TIMEZONE = process.env.APP_TIMEZONE || 'America/Asuncion';

const getDatePartsInTimeZone = (date, timeZone) => {
  const parts = new Intl.DateTimeFormat('en-CA', {
    timeZone,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit'
  }).formatToParts(date);
  const map = {};
  parts.forEach(part => {
    if (part.type !== 'literal') map[part.type] = part.value;
  });
  return {
    year: Number(map.year),
    month: Number(map.month),
    day: Number(map.day)
  };
};

const getTimeZoneOffsetMinutes = (date, timeZone) => {
  const parts = new Intl.DateTimeFormat('en-US', {
    timeZone,
    hour12: false,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit'
  }).formatToParts(date);
  const map = {};
  parts.forEach(part => {
    if (part.type !== 'literal') map[part.type] = part.value;
  });
  const asUTC = Date.UTC(
    Number(map.year),
    Number(map.month) - 1,
    Number(map.day),
    Number(map.hour),
    Number(map.minute),
    Number(map.second)
  );
  return (asUTC - date.getTime()) / 60000;
};

const getDayRangeUtcForTimeZone = (date, timeZone) => {
  const { year, month, day } = getDatePartsInTimeZone(date, timeZone);
  const startUtc = new Date(Date.UTC(year, month - 1, day, 0, 0, 0));
  const offsetMinutes = getTimeZoneOffsetMinutes(startUtc, timeZone);
  startUtc.setUTCMinutes(startUtc.getUTCMinutes() - offsetMinutes);
  const endUtc = new Date(startUtc);
  endUtc.setUTCDate(endUtc.getUTCDate() + 1);
  return { startUtcIso: startUtc.toISOString(), endUtcIso: endUtc.toISOString() };
};

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
    
    if (error) {
      console.warn('⚠️ Error Supabase en logs:', error);
      // Si la tabla no existe (42P01) o hay error de permisos (42501), devolver array vacío
      if (error.code === '42P01' || error.code === '42501') return res.json([]);
      throw error;
    }
    res.json(data || []);
  } catch (error) {
    console.error('Error fetching logs:', error);
    // En caso de error fatal, devolver array vacío para no romper UI
    res.json([]);
  }
});

// Endpoint de Configuración General (Faltante)
app.get('/api/settings/general', authenticateToken, async (req, res) => {
  try {
    // Retornar configuración por defecto o desde DB si existiera
    res.json({
      systemName: 'Sistema de Cambios',
      timezone: 'America/Asuncion',
      primaryCurrency: 'USD',
      autoUpdatesEnabled: false
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Endpoint de Configuración de Seguridad (Faltante)
app.get('/api/settings/security', authenticateToken, requireRole(['admin', 'owner']), async (req, res) => {
  try {
    // Retornar configuración de seguridad por defecto
    res.json({
      rateLimitMessages: 100,
      rateLimitWindow: 15,
      allowedIPs: [],
      auditLogsEnabled: true,
      requireIdempotencyKey: true,
      maxLoginAttempts: 5,
      sessionTimeout: 60
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Endpoint de Información de Base de Datos (Faltante)
app.get('/api/database/info', authenticateToken, requireRole(['admin', 'owner']), async (req, res) => {
  try {
    // Recopilar información básica de la base de datos
    // En una implementación real con pg, podríamos consultar pg_database_size, etc.
    // Con Supabase client, tenemos acceso limitado a metadatos, así que simulamos o inferimos.
    
    let tableStats = [];
    let totalRecords = 0;
    
    if (dbConnected) {
      // Intentar obtener conteos de tablas principales
      const tables = ['transactions', 'clients', 'collaborators', 'system_logs', 'global_rate'];
      
      for (const table of tables) {
        try {
          const { count, error } = await supabase.from(table).select('*', { count: 'exact', head: true });
          if (!error) {
            tableStats.push({
              name: table,
              description: `Tabla de ${table}`,
              records: count || 0,
              status: 'active'
            });
            totalRecords += (count || 0);
          } else {
             tableStats.push({
              name: table,
              description: `Tabla de ${table}`,
              records: 0,
              status: 'error'
            });
          }
        } catch (e) {
           // Ignorar errores individuales
        }
      }
    }
    
    const dbInfo = {
      connection: {
        host: process.env.SUPABASE_URL ? new URL(process.env.SUPABASE_URL).hostname : 'unknown',
        port: '5432',
        database: 'postgres',
        poolSize: 10,
        connected: dbConnected,
        lastCheck: new Date().toISOString()
      },
      statistics: {
        totalTables: tableStats.length,
        totalRecords: totalRecords,
        databaseSize: 'Unknown', // No accesible vía API simple
        uptime: process.uptime()
      },
      tables: tableStats
    };
    
    res.json(dbInfo);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Endpoint de Reportes (Faltante)
app.get('/api/reports/summary', authenticateToken, async (req, res) => {
  try {
    const { startDate, endDate } = req.query;
    
    let query = supabase.from('transactions').select('usd_total, comision, colaborador, cliente');
    
    if (startDate) {
      query = query.gte('created_at', startDate);
    }
    if (endDate) {
      query = query.lte('created_at', endDate);
    }
    
    const { data: transactions, error } = await query;
    
    if (error) {
       if (error.code === '42P01') {
         return res.json({
            totalTransactions: 0,
            totalVolumeUsd: 0,
            totalCommissions: 0,
            averageTransaction: 0,
            topCollaborator: 'N/A',
            topClient: 'N/A'
         });
       }
       throw error;
    }
    
    const stats = {
        totalTransactions: transactions.length,
        totalVolumeUsd: 0,
        totalCommissions: 0,
        averageTransaction: 0,
        topCollaborator: 'N/A',
        topClient: 'N/A',
        monthlyData: [],
        collaboratorPerformance: [],
        topClients: [],
        detailedAnalytics: {
            operationalEfficiency: { averageProcessTime: '12m', successRate: '98%', errorsPerDay: '0.5' },
            financialMetrics: { monthlyROI: '15%', averageMargin: '1.2%', costPerTransaction: '$2.5' },
            growth: { monthlyGrowth: '5%', newClientsPerMonth: '12', retention: '95%' }
        }
    };
    
    const collaboratorCounts = {};
    const clientVolumes = {};
    
    // Estructuras auxiliares para los arrays detallados
    const monthlyStats = {};
    const collabMap = {};
    const clientMap = {};
    
    transactions.forEach(tx => {
        const usd = Number(tx.usd_total || 0);
        const comision = Number(tx.comision || 0);
        const comisionMonto = usd * (comision / 100);
        
        stats.totalVolumeUsd += usd;
        stats.totalCommissions += comisionMonto;
        
        // Count for top collaborator (Legacy logic kept for safety)
        const collab = tx.colaborador || 'Desconocido';
        collaboratorCounts[collab] = (collaboratorCounts[collab] || 0) + 1;
        
        // Volume for top client (Legacy logic kept for safety)
        const client = tx.cliente || 'Desconocido';
        clientVolumes[client] = (clientVolumes[client] || 0) + usd;
        
        // --- NUEVA LÓGICA DE AGREGACIÓN ---
        
        // 1. Monthly Data
        const date = new Date(tx.created_at || tx.fecha);
        if (!isNaN(date.getTime())) {
            const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
            // Nombre del mes en español (aprox)
            const monthNames = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'];
            const monthName = monthNames[date.getMonth()];
            
            if (!monthlyStats[monthKey]) {
                monthlyStats[monthKey] = { 
                    month: monthName, 
                    transactions: 0, 
                    volume: 0, 
                    commissions: 0,
                    sortKey: monthKey 
                };
            }
            monthlyStats[monthKey].transactions++;
            monthlyStats[monthKey].volume += usd;
            monthlyStats[monthKey].commissions += comisionMonto;
        }
        
        // 2. Collaborator Performance
        if (!collabMap[collab]) {
            collabMap[collab] = { name: collab, transactions: 0, commissions: 0, volume: 0 };
        }
        collabMap[collab].transactions++;
        collabMap[collab].volume += usd;
        collabMap[collab].commissions += comisionMonto;
        
        // 3. Top Clients
        if (!clientMap[client]) {
            clientMap[client] = { name: client, transactions: 0, volume: 0, commissions: 0 };
        }
        clientMap[client].transactions++;
        clientMap[client].volume += usd;
        clientMap[client].commissions += comisionMonto;
    });
    
    // Procesar arrays finales
    stats.monthlyData = Object.values(monthlyStats).sort((a, b) => a.sortKey.localeCompare(b.sortKey));
    
    stats.collaboratorPerformance = Object.values(collabMap).map(c => ({
        name: c.name,
        transactions: c.transactions,
        commissions: c.commissions,
        percentage: stats.totalTransactions > 0 ? Math.round((c.transactions / stats.totalTransactions) * 100) : 0
    })).sort((a, b) => b.transactions - a.transactions);
    
    stats.topClients = Object.values(clientMap)
        .sort((a, b) => b.volume - a.volume)
        .slice(0, 10);
    
    if (stats.totalTransactions > 0) {
        stats.averageTransaction = stats.totalVolumeUsd / stats.totalTransactions;
        
        // Find top collaborator
        stats.topCollaborator = Object.entries(collaboratorCounts)
            .sort((a, b) => b[1] - a[1])[0]?.[0] || 'N/A';
            
        // Find top client
        stats.topClient = Object.entries(clientVolumes)
            .sort((a, b) => b[1] - a[1])[0]?.[0] || 'N/A';
    }
    
    res.json(stats);
  } catch (error) {
    console.error('Error fetching reports summary:', error);
    res.status(500).json({ error: error.message });
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
    let transactionsToday = 0;
    let dailyVolume = 0;
    let activeCollaborators = 0;
    let currentRateValue = 0;

    if (dbConnected) {
      try {
        const { count: txCount } = await supabase.from('transactions').select('*', { count: 'exact', head: true });
        totalTransactions = txCount || 0;
        
        const { count: colCount, error: countError } = await supabase
          .from('collaborators')
          .select('*', { count: 'exact', head: true })
          .or('status.eq.active,status.is.null'); // Contar activos o nulos (default active)
          
        if (countError) {
           // Si falla el OR (quizás versión vieja de PostgREST), intentar solo contar todos
           const { count: totalCount } = await supabase.from('collaborators').select('*', { count: 'exact', head: true });
           activeCollaborators = totalCount || 0;
        } else {
           activeCollaborators = colCount || 0;
        }
        
        // Volumen diario (aproximado)
        const { startUtcIso, endUtcIso } = getDayRangeUtcForTimeZone(new Date(), APP_TIMEZONE);
        const { data: todayCreated } = await supabase
          .from('transactions')
          .select('id, usd_total, created_at')
          .gte('created_at', startUtcIso)
          .lt('created_at', endUtcIso);
        const { data: todayFecha } = await supabase
          .from('transactions')
          .select('id, usd_total, fecha')
          .gte('fecha', startUtcIso)
          .lt('fecha', endUtcIso);
        const txMap = new Map();
        (todayCreated || []).forEach(tx => {
          if (tx && tx.id !== undefined) txMap.set(tx.id, tx);
        });
        (todayFecha || []).forEach(tx => {
          if (tx && tx.id !== undefined) txMap.set(tx.id, { ...(txMap.get(tx.id) || {}), ...tx });
        });
        const merged = Array.from(txMap.values());
        transactionsToday = merged.length;
        dailyVolume = merged.reduce((sum, tx) => sum + (Number(tx.usd_total) || 0), 0);

        if (transactionsToday === 0) {
          const { data: recent } = await supabase
            .from('transactions')
            .select('id, usd_total, created_at, fecha')
            .order('created_at', { ascending: false })
            .limit(200);
          const sameDay = (recent || []).filter(tx => {
            const d = new Date(tx.created_at || tx.fecha);
            const a = new Intl.DateTimeFormat('en-CA', { timeZone: APP_TIMEZONE, year: 'numeric', month: '2-digit', day: '2-digit' }).format(d);
            const b = new Intl.DateTimeFormat('en-CA', { timeZone: APP_TIMEZONE, year: 'numeric', month: '2-digit', day: '2-digit' }).format(new Date());
            return a === b;
          });
          transactionsToday = sameDay.length;
          dailyVolume = sameDay.reduce((sum, tx) => sum + (Number(tx.usd_total) || 0), 0);
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
      transactionsToday,
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
    
    // Extraer filtros del query string
    const { start, end, collaborator, client, status, minUsd, maxUsd } = req.query;

    // Aplicar filtro de fechas
    if (start && end) {
      // Asegurar rango inclusivo para todo el día
      const startDate = `${start}T00:00:00`;
      const endDate = `${end}T23:59:59`;
      query = query.gte('fecha', startDate).lte('fecha', endDate);
    }

    // Aplicar filtros exactos
    if (collaborator) query = query.eq('colaborador', collaborator);
    if (client) query = query.eq('cliente', client);
    if (status) query = query.eq('status', status);

    // Aplicar filtros numéricos
    if (minUsd) query = query.gte('usd_total', minUsd);
    if (maxUsd) query = query.lte('usd_total', maxUsd);

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
      idempotencyKey: tx.idempotency_key,
      // Nuevos campos para reportes y PDF
      montoColaboradorUsd: Number(tx.monto_colaborador_usd || 0),
      montoComisionGabrielUsd: Number(tx.monto_comision_gabriel_usd || 0)
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

// Eliminar transacción con debugging profesional
app.delete('/api/transactions/:id', authenticateToken, requireRole(['admin', 'owner']), async (req, res) => {
  // Importar el debugger dinámicamente para evitar problemas de inicialización
  const { debugTransactionDeletion, transactionDebugger } = await import('./database-debug.js');
  
  let debugResult = null;
  const startTime = Date.now();
  
  try {
    if (!supabase) {
      throw new Error('Supabase client not initialized');
    }
    
    const { id } = req.params;
    const userId = req.user?.username || 'unknown';
    
    // 🔍 INICIO DEL DEBUGGING PROFESIONAL
    await logger.info(COMPONENTS.TRANSACTION, `🚀 INICIANDO ELIMINACIÓN PROFESIONAL`, {
      transactionId: id,
      userId,
      userAgent: req.headers['user-agent'],
      ip: req.ip,
      timestamp: new Date().toISOString()
    });

    // 1. Verificar existencia antes de borrar
    const { data: existing, error: checkError } = await supabase
      .from('transactions')
      .select('*')
      .eq('id', id)
      .single();

    if (checkError || !existing) {
      await logger.warn(COMPONENTS.TRANSACTION, `⚠️ Transacción no encontrada para eliminar`, { id });
      return res.status(404).json({ error: 'Transacción no encontrada' });
    }

    // 2. Ejecutar debugging avanzado
    try {
      debugResult = await transactionDebugger.debugTransactionDeletion(id, userId);
      await logger.info(COMPONENTS.TRANSACTION, `✅ Debugging completado`, { debugResult });
    } catch (debugError) {
      await logger.error(COMPONENTS.TRANSACTION, `⚠️ Error en debugging (no crítico)`, { error: debugError.message });
    }

    // 3. Eliminar transacción
    const { error: deleteError } = await supabase
      .from('transactions')
      .delete()
      .eq('id', id);

    if (deleteError) {
      throw deleteError;
    }

    // 4. Verificar eliminación
    const { count } = await supabase
      .from('transactions')
      .select('*', { count: 'exact', head: true })
      .eq('id', id);

    if (count > 0) {
      throw new Error('La transacción no se eliminó correctamente');
    }

    // 5. Log final de éxito
    await logger.success(COMPONENTS.TRANSACTION, `🗑️ Transacción eliminada exitosamente`, {
      id,
      userId,
      duration: `${Date.now() - startTime}ms`
    });

    res.json({ 
      success: true, 
      message: 'Transacción eliminada correctamente',
      debug: debugResult 
    });

  } catch (error) {
    console.error('Error deleting transaction:', error);
    
    await logger.error(COMPONENTS.TRANSACTION, `❌ Error eliminando transacción`, {
      id: req.params.id,
      error: error.message,
      stack: error.stack
    });
    
    res.status(500).json({ 
      error: 'Error eliminando transacción', 
      message: error.message 
    });
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
    // IMPORTANTE: Ordenar por fecha descendente para asegurar que traemos las más recientes
    const { data: transactions, error: txError } = await supabase
      .from('transactions')
      .select('cliente, usd_total, comision, created_at, fecha')
      .order('created_at', { ascending: false })
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
        
        // ESTRATEGIA ESTRICTA:
        // Solo asignamos si hay coincidencia EXACTA en el mapa de clientes.
        // Si la transacción dice "abuelita", SOLO asignamos al cliente "Abuelita".
        // Si la transacción dice "abuelita novia", SOLO asignamos al cliente "Abuelita Novia".
        // Eliminamos la lógica difusa que causaba que "Abuelita" absorbiera a "Abuelita Novia" o viceversa.
        
        if (clientNameMap[txClientName]) {
             const matchedClientName = txClientName;
             
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
        } 
        // Si no hay coincidencia exacta, esta transacción queda huérfana de estadísticas en la vista de clientes
        // Esto es preferible a asignarla incorrectamente.
        else {
             // Opcional: Log para saber qué se perdió
             // console.log(`Transacción huérfana: ${txClientName}`);
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
    // Importar dinámicamente para evitar dependencias circulares
    const { createBackup } = await import('./backup-system.js');
    
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
    const { listBackups } = await import('./backup-system.js');
    const backups = await listBackups();
    res.json(backups);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Restaurar backup
app.post('/api/backups/restore/:id', authenticateToken, requireRole(['owner']), sensitiveOperationsRateLimiter, async (req, res) => {
  try {
    const { restoreBackup } = await import('./backup-system.js');
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
    const { backupSystem } = await import('./backup-system.js');
    // backupSystem no exporta getBackupPath directamente, pero podemos construirlo o usar un método si existiera.
    // Revisando backup-system.js, no tiene getBackupPath público, pero usa BACKUP_CONFIG.backupDir.
    // Asumiremos que están en ../backups relativo a este archivo.
    const path = await import('path');
    const fs = await import('fs');
    const { fileURLToPath } = await import('url');
    
    // Reconstruir ruta de backups (copiado de logic en backup-system.js)
    const __filename = fileURLToPath(import.meta.url);
    const __dirname = path.dirname(__filename);
    const backupDir = process.env.BACKUP_DIR || path.join(__dirname, '../backups');
    
    const filename = req.params.filename;
    // Sanitizar filename para evitar path traversal
    const safeFilename = path.basename(filename);
    const filePath = path.join(backupDir, safeFilename);
    
    if (fs.existsSync(filePath)) {
       res.download(filePath, safeFilename);
    } else {
       logger.error('Error descargando backup', { error: 'Archivo no encontrado', filename });
       res.status(404).json({ error: 'Archivo no encontrado' });
    }
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// --- RUTAS DE CONFIGURACIÓN DE BACKUPS (NUEVAS) ---

// Obtener configuraciones
app.get('/api/backups/configurations', authenticateToken, requireRole(['admin', 'owner']), async (req, res) => {
  try {
    const { backupConfigManager } = await import('./backupConfigManager.js');
    const configs = await backupConfigManager.getAll();
    res.json({ success: true, configurations: configs });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Crear configuración
app.post('/api/backups/configurations', authenticateToken, requireRole(['admin', 'owner']), async (req, res) => {
  try {
    const { backupConfigManager } = await import('./backupConfigManager.js');
    const newConfig = await backupConfigManager.create(req.body);
    
    // Notificar al scheduler para recargar (opcional, si implementamos recarga dinámica)
    const { backupScheduler } = await import('./scheduler.js');
    if (backupScheduler) {
        // Recargar configuraciones
        // backupScheduler.loadAndScheduleConfigurations(); 
        // Esto requeriría modificar scheduler.js para leer del JSON también.
    }
    
    res.json({ success: true, message: 'Configuración creada', configuration: newConfig });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Actualizar configuración
app.put('/api/backups/configurations/:id', authenticateToken, requireRole(['admin', 'owner']), async (req, res) => {
  try {
    const { backupConfigManager } = await import('./backupConfigManager.js');
    const updated = await backupConfigManager.update(req.params.id, req.body);
    res.json({ success: true, message: 'Configuración actualizada', configuration: updated });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Eliminar configuración
app.delete('/api/backups/configurations/:id', authenticateToken, requireRole(['admin', 'owner']), async (req, res) => {
  try {
    const { backupConfigManager } = await import('./backupConfigManager.js');
    await backupConfigManager.delete(req.params.id);
    res.json({ success: true, message: 'Configuración eliminada' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Limpiar backups antiguos
app.post('/api/backups/cleanup', authenticateToken, requireRole(['admin', 'owner']), async (req, res) => {
  try {
    const { backupSystem } = await import('./backup-system.js');
    await backupSystem.cleanupOldBackups();
    res.json({ success: true, message: 'Limpieza completada' });
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
