// Sistema de logging centralizado para Casa de Cambios
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

let supabase = null;
if (supabaseUrl && supabaseKey) {
  supabase = createClient(supabaseUrl, supabaseKey);
}

// Cache de logs en memoria para cuando la BD no esté disponible
let logsCache = [];
const MAX_CACHE_SIZE = 100;

/**
 * Niveles de log disponibles
 */
export const LOG_LEVELS = {
  ERROR: 'error',
  WARN: 'warning', 
  INFO: 'info',
  SUCCESS: 'success',
  DEBUG: 'debug'
};

/**
 * Componentes del sistema
 */
export const COMPONENTS = {
  SYSTEM: 'Sistema',
  AUTH: 'Autenticación',
  BACKUP: 'Backup',
  TRANSACTION: 'Transacción',
  RATE: 'Tasa',
  USER: 'Usuario',
  API: 'API',
  DATABASE: 'Base de Datos',
  EXPORT: 'Exportación',
  IMPORT: 'Importación'
};

/**
 * Función principal de logging
 * @param {string} level - Nivel del log (error, warning, info, success, debug)
 * @param {string} component - Componente que genera el log
 * @param {string} message - Mensaje del log
 * @param {Object} details - Detalles adicionales del log
 * @param {string} userId - ID del usuario (opcional)
 */
export async function logEvent(level, component, message, details = {}, userId = null) {
  try {
    const logEntry = {
      level,
      component,
      message,
      details: {
        ...details,
        timestamp: new Date().toISOString(),
        userId
      },
      timestamp: new Date().toISOString(),
      user_id: userId
    };

    // Log en consola para desarrollo
    const emoji = getLogEmoji(level);
    console.log(`${emoji} [${component}] ${message}`, details);

    // Guardar en cache de memoria
    logsCache.unshift(logEntry);
    if (logsCache.length > MAX_CACHE_SIZE) {
      logsCache = logsCache.slice(0, MAX_CACHE_SIZE);
    }

    // Intentar guardar en base de datos si está disponible
    if (supabase) {
      try {
        const { error } = await supabase
          .from('system_logs')
          .insert(logEntry);
        
        if (error) {
          // Solo mostrar error la primera vez para evitar spam
          if (!logEvent._dbErrorShown) {
            console.error('⚠️ BD no disponible, usando cache en memoria:', error.message);
            logEvent._dbErrorShown = true;
          }
        } else {
          // Reset flag si la BD vuelve a funcionar
          logEvent._dbErrorShown = false;
        }
      } catch (err) {
        if (!logEvent._dbErrorShown) {
          console.error('⚠️ Error conectando a BD, usando cache en memoria:', err.message);
          logEvent._dbErrorShown = true;
        }
      }
    }

    return logEntry;
  } catch (error) {
    console.error('❌ Error en sistema de logging:', error);
  }
}

/**
 * Funciones de conveniencia para diferentes niveles
 */
export const logger = {
  error: (component, message, details, userId) => 
    logEvent(LOG_LEVELS.ERROR, component, message, details, userId),
  
  warn: (component, message, details, userId) => 
    logEvent(LOG_LEVELS.WARN, component, message, details, userId),
  
  info: (component, message, details, userId) => 
    logEvent(LOG_LEVELS.INFO, component, message, details, userId),
  
  success: (component, message, details, userId) => 
    logEvent(LOG_LEVELS.SUCCESS, component, message, details, userId),
  
  debug: (component, message, details, userId) => 
    logEvent(LOG_LEVELS.DEBUG, component, message, details, userId)
};

/**
 * Obtener emoji para el nivel de log
 */
function getLogEmoji(level) {
  switch (level) {
    case LOG_LEVELS.ERROR: return '❌';
    case LOG_LEVELS.WARN: return '⚠️';
    case LOG_LEVELS.INFO: return 'ℹ️';
    case LOG_LEVELS.SUCCESS: return '✅';
    case LOG_LEVELS.DEBUG: return '🔍';
    default: return '📝';
  }
}

/**
 * Funciones específicas para operaciones comunes
 */
export const logOperations = {
  // Backup operations
  backupCreated: (backupId, userId, details) => 
    logger.success(COMPONENTS.BACKUP, `Backup creado: ${backupId}`, { backupId, ...details }, userId),
  
  backupDeleted: (backupId, userId, details) => 
    logger.info(COMPONENTS.BACKUP, `Backup eliminado: ${backupId}`, { backupId, ...details }, userId),
  
  backupDownloaded: (backupId, userId, details) => 
    logger.info(COMPONENTS.BACKUP, `Backup descargado: ${backupId}`, { backupId, ...details }, userId),
  
  backupImported: (backupId, userId, details) => 
    logger.success(COMPONENTS.BACKUP, `Backup importado: ${backupId}`, { backupId, ...details }, userId),
  
  backupRestored: (backupId, userId, details) => 
    logger.success(COMPONENTS.BACKUP, `Backup restaurado: ${backupId}`, { backupId, ...details }, userId),
  
  // Transaction operations
  transactionCreated: (transactionId, userId, details) => 
    logger.success(COMPONENTS.TRANSACTION, `Transacción creada: ${transactionId}`, { transactionId, ...details }, userId),
  
  transactionDeleted: (transactionId, userId, details) => 
    logger.info(COMPONENTS.TRANSACTION, `Transacción eliminada: ${transactionId}`, { transactionId, ...details }, userId),
  
  // Rate operations
  rateUpdated: (oldRate, newRate, userId, details) => 
    logger.info(COMPONENTS.RATE, `Tasa actualizada: ${oldRate} → ${newRate}`, { oldRate, newRate, ...details }, userId),
  
  // Auth operations
  userLogin: (username, details) => 
    logger.info(COMPONENTS.AUTH, `Usuario autenticado: ${username}`, { username, ...details }, username),
  
  userLogout: (username, details) => 
    logger.info(COMPONENTS.AUTH, `Usuario desconectado: ${username}`, { username, ...details }, username),
  
  // Export/Import operations
  dataExported: (type, userId, details) => 
    logger.info(COMPONENTS.EXPORT, `Datos exportados: ${type}`, { type, ...details }, userId),
  
  dataImported: (type, userId, details) => 
    logger.success(COMPONENTS.IMPORT, `Datos importados: ${type}`, { type, ...details }, userId),
  
  // System operations
  systemStarted: (details) => 
    logger.success(COMPONENTS.SYSTEM, 'Sistema iniciado correctamente', details),
  
  systemError: (error, details) => 
    logger.error(COMPONENTS.SYSTEM, `Error del sistema: ${error.message}`, { error: error.stack, ...details }),
  
  // Database operations
  databaseConnected: (details) => 
    logger.success(COMPONENTS.DATABASE, 'Conexión a base de datos establecida', details),
  
  databaseError: (error, details) => 
    logger.error(COMPONENTS.DATABASE, `Error de base de datos: ${error.message}`, { error: error.stack, ...details })
};

/**
 * Obtener logs del cache en memoria
 */
export function getLogsFromCache() {
  return logsCache.map((log, index) => ({
    ...log,
    id: `cache-${index}`,
    source: 'memory'
  }));
}

/**
 * Limpiar cache de logs
 */
export function clearLogsCache() {
  logsCache = [];
}

/**
 * Obtener estadísticas del cache
 */
export function getCacheStats() {
  return {
    totalLogs: logsCache.length,
    maxSize: MAX_CACHE_SIZE,
    oldestLog: logsCache[logsCache.length - 1]?.timestamp,
    newestLog: logsCache[0]?.timestamp
  };
}

export default logger;