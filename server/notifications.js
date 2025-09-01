// Sistema de notificaciones push para eventos críticos
// Casa de Cambios - Notificaciones en tiempo real

import { createClient } from '@supabase/supabase-js';
import nodemailer from 'nodemailer';
import dotenv from 'dotenv';
import { logOperations } from './logger.js';

// Cargar variables de entorno
dotenv.config();

// Configurar Supabase
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Error: SUPABASE_URL y SUPABASE_SERVICE_ROLE_KEY son requeridos en notifications.js');
}

const supabase = createClient(supabaseUrl, supabaseKey);

// Configuración de email
const emailConfig = {
  host: process.env.SMTP_HOST || 'smtp.gmail.com',
  port: process.env.SMTP_PORT || 587,
  secure: false,
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS
  }
};

// Crear transporter de email
let emailTransporter = null;
if (process.env.SMTP_USER && process.env.SMTP_PASS) {
  emailTransporter = nodemailer.createTransporter(emailConfig);
}

// Tipos de notificaciones críticas
export const NOTIFICATION_TYPES = {
  SYSTEM_ERROR: 'system_error',
  SECURITY_ALERT: 'security_alert',
  TRANSACTION_FAILED: 'transaction_failed',
  DATABASE_ERROR: 'database_error',
  RATE_LIMIT_EXCEEDED: 'rate_limit_exceeded',
  BACKUP_FAILED: 'backup_failed',
  LOGIN_FAILED_MULTIPLE: 'login_failed_multiple',
  LARGE_TRANSACTION: 'large_transaction',
  SYSTEM_OFFLINE: 'system_offline',
  SUSPICIOUS_ACTIVITY: 'suspicious_activity'
};

// Niveles de prioridad
export const PRIORITY_LEVELS = {
  LOW: 'low',
  MEDIUM: 'medium',
  HIGH: 'high',
  CRITICAL: 'critical'
};

// Configuración de notificaciones por tipo
const notificationConfig = {
  [NOTIFICATION_TYPES.SYSTEM_ERROR]: {
    priority: PRIORITY_LEVELS.HIGH,
    channels: ['email', 'database'],
    recipients: ['admin@casadecambios.com'],
    template: 'system_error'
  },
  [NOTIFICATION_TYPES.SECURITY_ALERT]: {
    priority: PRIORITY_LEVELS.CRITICAL,
    channels: ['email', 'database'],
    recipients: ['admin@casadecambios.com', 'security@casadecambios.com'],
    template: 'security_alert'
  },
  [NOTIFICATION_TYPES.TRANSACTION_FAILED]: {
    priority: PRIORITY_LEVELS.MEDIUM,
    channels: ['database'],
    recipients: ['admin@casadecambios.com'],
    template: 'transaction_failed'
  },
  [NOTIFICATION_TYPES.DATABASE_ERROR]: {
    priority: PRIORITY_LEVELS.CRITICAL,
    channels: ['email', 'database'],
    recipients: ['admin@casadecambios.com', 'tech@casadecambios.com'],
    template: 'database_error'
  },
  [NOTIFICATION_TYPES.RATE_LIMIT_EXCEEDED]: {
    priority: PRIORITY_LEVELS.MEDIUM,
    channels: ['database'],
    recipients: ['admin@casadecambios.com'],
    template: 'rate_limit_exceeded'
  },
  [NOTIFICATION_TYPES.BACKUP_FAILED]: {
    priority: PRIORITY_LEVELS.HIGH,
    channels: ['email', 'database'],
    recipients: ['admin@casadecambios.com'],
    template: 'backup_failed'
  },
  [NOTIFICATION_TYPES.LOGIN_FAILED_MULTIPLE]: {
    priority: PRIORITY_LEVELS.HIGH,
    channels: ['email', 'database'],
    recipients: ['admin@casadecambios.com', 'security@casadecambios.com'],
    template: 'login_failed_multiple'
  },
  [NOTIFICATION_TYPES.LARGE_TRANSACTION]: {
    priority: PRIORITY_LEVELS.MEDIUM,
    channels: ['email', 'database'],
    recipients: ['admin@casadecambios.com', 'gabriel@casadecambios.com'],
    template: 'large_transaction'
  },
  [NOTIFICATION_TYPES.SYSTEM_OFFLINE]: {
    priority: PRIORITY_LEVELS.CRITICAL,
    channels: ['email'],
    recipients: ['admin@casadecambios.com', 'tech@casadecambios.com'],
    template: 'system_offline'
  },
  [NOTIFICATION_TYPES.SUSPICIOUS_ACTIVITY]: {
    priority: PRIORITY_LEVELS.HIGH,
    channels: ['email', 'database'],
    recipients: ['admin@casadecambios.com', 'security@casadecambios.com'],
    template: 'suspicious_activity'
  }
};

// Plantillas de email
const emailTemplates = {
  system_error: {
    subject: '🚨 Error del Sistema - Casa de Cambios',
    html: (data) => `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <div style="background: #dc2626; color: white; padding: 20px; text-align: center;">
          <h1>🚨 Error del Sistema</h1>
        </div>
        <div style="padding: 20px; background: #f9fafb;">
          <h2>Detalles del Error:</h2>
          <p><strong>Mensaje:</strong> ${data.message}</p>
          <p><strong>Componente:</strong> ${data.component || 'Desconocido'}</p>
          <p><strong>Timestamp:</strong> ${new Date(data.timestamp).toLocaleString('es-ES')}</p>
          ${data.details ? `<p><strong>Detalles:</strong> ${JSON.stringify(data.details, null, 2)}</p>` : ''}
          <p><strong>Servidor:</strong> ${process.env.NODE_ENV || 'development'}</p>
        </div>
        <div style="padding: 20px; background: #fee2e2; border-left: 4px solid #dc2626;">
          <p><strong>⚠️ Acción Requerida:</strong> Revisar inmediatamente el sistema y corregir el error.</p>
        </div>
      </div>
    `
  },
  security_alert: {
    subject: '🔒 Alerta de Seguridad - Casa de Cambios',
    html: (data) => `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <div style="background: #dc2626; color: white; padding: 20px; text-align: center;">
          <h1>🔒 Alerta de Seguridad</h1>
        </div>
        <div style="padding: 20px; background: #f9fafb;">
          <h2>Evento de Seguridad Detectado:</h2>
          <p><strong>Tipo:</strong> ${data.message}</p>
          <p><strong>Usuario:</strong> ${data.username || 'Desconocido'}</p>
          <p><strong>IP:</strong> ${data.ipAddress || 'Desconocida'}</p>
          <p><strong>Timestamp:</strong> ${new Date(data.timestamp).toLocaleString('es-ES')}</p>
          ${data.userAgent ? `<p><strong>User Agent:</strong> ${data.userAgent}</p>` : ''}
        </div>
        <div style="padding: 20px; background: #fef2f2; border-left: 4px solid #dc2626;">
          <p><strong>🚨 Acción Inmediata:</strong> Revisar logs de seguridad y tomar medidas preventivas.</p>
        </div>
      </div>
    `
  },
  transaction_failed: {
    subject: '💰 Transacción Fallida - Casa de Cambios',
    html: (data) => `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <div style="background: #f59e0b; color: white; padding: 20px; text-align: center;">
          <h1>💰 Transacción Fallida</h1>
        </div>
        <div style="padding: 20px; background: #f9fafb;">
          <h2>Detalles de la Transacción:</h2>
          <p><strong>Cliente:</strong> ${data.cliente || 'Desconocido'}</p>
          <p><strong>Monto USD:</strong> $${data.usdTotal || 'N/A'}</p>
          <p><strong>Error:</strong> ${data.message}</p>
          <p><strong>Timestamp:</strong> ${new Date(data.timestamp).toLocaleString('es-ES')}</p>
        </div>
        <div style="padding: 20px; background: #fef3c7; border-left: 4px solid #f59e0b;">
          <p><strong>⚠️ Revisar:</strong> Verificar el estado de la transacción y contactar al cliente si es necesario.</p>
        </div>
      </div>
    `
  },
  database_error: {
    subject: '🗄️ Error de Base de Datos - Casa de Cambios',
    html: (data) => `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <div style="background: #dc2626; color: white; padding: 20px; text-align: center;">
          <h1>🗄️ Error de Base de Datos</h1>
        </div>
        <div style="padding: 20px; background: #f9fafb;">
          <h2>Error en la Base de Datos:</h2>
          <p><strong>Mensaje:</strong> ${data.message}</p>
          <p><strong>Operación:</strong> ${data.operation || 'Desconocida'}</p>
          <p><strong>Tabla:</strong> ${data.table || 'Desconocida'}</p>
          <p><strong>Timestamp:</strong> ${new Date(data.timestamp).toLocaleString('es-ES')}</p>
        </div>
        <div style="padding: 20px; background: #fee2e2; border-left: 4px solid #dc2626;">
          <p><strong>🚨 Crítico:</strong> Verificar inmediatamente la conectividad y integridad de la base de datos.</p>
        </div>
      </div>
    `
  },
  large_transaction: {
    subject: '💎 Transacción de Alto Valor - Casa de Cambios',
    html: (data) => `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <div style="background: #059669; color: white; padding: 20px; text-align: center;">
          <h1>💎 Transacción de Alto Valor</h1>
        </div>
        <div style="padding: 20px; background: #f9fafb;">
          <h2>Transacción Procesada:</h2>
          <p><strong>Cliente:</strong> ${data.cliente}</p>
          <p><strong>Colaborador:</strong> ${data.colaborador}</p>
          <p><strong>Monto USD:</strong> $${data.usdTotal?.toLocaleString()}</p>
          <p><strong>Monto Gs:</strong> ₲${data.montoGs?.toLocaleString()}</p>
          <p><strong>Comisión:</strong> ${data.comision}%</p>
          <p><strong>Timestamp:</strong> ${new Date(data.timestamp).toLocaleString('es-ES')}</p>
        </div>
        <div style="padding: 20px; background: #d1fae5; border-left: 4px solid #059669;">
          <p><strong>ℹ️ Información:</strong> Transacción de alto valor procesada exitosamente.</p>
        </div>
      </div>
    `
  }
};

// Clase principal del sistema de notificaciones
export class NotificationSystem {
  constructor() {
    this.isEnabled = true;
    this.rateLimitCache = new Map(); // Cache para rate limiting
  }

  // Enviar notificación
  async sendNotification(type, data, options = {}) {
    try {
      if (!this.isEnabled) {
        console.log('Notifications disabled, skipping:', type);
        return;
      }

      // Verificar rate limiting
      if (this.isRateLimited(type, data)) {
        console.log('Notification rate limited:', type);
        return;
      }

      const config = notificationConfig[type];
      if (!config) {
        console.error('Unknown notification type:', type);
        return;
      }

      const notification = {
        id: this.generateNotificationId(),
        type,
        priority: config.priority,
        message: data.message,
        data: data,
        timestamp: new Date().toISOString(),
        status: 'pending',
        channels: options.channels || config.channels,
        recipients: options.recipients || config.recipients
      };

      // Guardar en base de datos
      if (notification.channels.includes('database')) {
        await this.saveToDatabase(notification);
      }

      // Enviar por email
      if (notification.channels.includes('email') && emailTransporter) {
        await this.sendEmail(notification, config.template);
      }

      // Log de la notificación
      await logOperations.notificationSent(notification.id, {
        type: notification.type,
        priority: notification.priority,
        channels: notification.channels,
        recipients: notification.recipients.length,
        timestamp: notification.timestamp
      });

      console.log(`📢 Notification sent: ${type} - Priority: ${config.priority}`);
      
    } catch (error) {
      console.error('Error sending notification:', error);
      // No enviar notificación de error para evitar loops infinitos
    }
  }

  // Verificar rate limiting
  isRateLimited(type, data) {
    const key = `${type}_${data.component || 'general'}`;
    const now = Date.now();
    const windowMs = 5 * 60 * 1000; // 5 minutos
    const maxNotifications = 3; // Máximo 3 notificaciones del mismo tipo en 5 minutos

    if (!this.rateLimitCache.has(key)) {
      this.rateLimitCache.set(key, []);
    }

    const timestamps = this.rateLimitCache.get(key);
    
    // Limpiar timestamps antiguos
    const validTimestamps = timestamps.filter(ts => now - ts < windowMs);
    
    if (validTimestamps.length >= maxNotifications) {
      return true; // Rate limited
    }

    // Agregar timestamp actual
    validTimestamps.push(now);
    this.rateLimitCache.set(key, validTimestamps);
    
    return false;
  }

  // Guardar notificación en base de datos
  async saveToDatabase(notification) {
    try {
      const { error } = await supabase
        .from('system_logs')
        .insert({
          level: this.priorityToLogLevel(notification.priority),
          component: 'Notifications',
          message: `${notification.type}: ${notification.message}`,
          details: {
            notificationId: notification.id,
            type: notification.type,
            priority: notification.priority,
            data: notification.data,
            channels: notification.channels,
            recipients: notification.recipients
          },
          timestamp: notification.timestamp
        });

      if (error) {
        console.error('Error saving notification to database:', error);
      }
    } catch (error) {
      console.error('Error in saveToDatabase:', error);
    }
  }

  // Enviar email
  async sendEmail(notification, templateName) {
    try {
      if (!emailTransporter) {
        console.log('Email transporter not configured, skipping email notification');
        return;
      }

      const template = emailTemplates[templateName];
      if (!template) {
        console.error('Email template not found:', templateName);
        return;
      }

      const mailOptions = {
        from: process.env.SMTP_FROM || process.env.SMTP_USER,
        to: notification.recipients.join(', '),
        subject: template.subject,
        html: template.html(notification.data)
      };

      await emailTransporter.sendMail(mailOptions);
      console.log(`📧 Email notification sent to: ${notification.recipients.join(', ')}`);
      
    } catch (error) {
      console.error('Error sending email notification:', error);
    }
  }

  // Convertir prioridad a nivel de log
  priorityToLogLevel(priority) {
    switch (priority) {
      case PRIORITY_LEVELS.CRITICAL:
        return 'error';
      case PRIORITY_LEVELS.HIGH:
        return 'warning';
      case PRIORITY_LEVELS.MEDIUM:
        return 'info';
      case PRIORITY_LEVELS.LOW:
        return 'info';
      default:
        return 'info';
    }
  }

  // Generar ID único para notificación
  generateNotificationId() {
    return `notif_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  // Obtener notificaciones recientes
  async getRecentNotifications(limit = 50) {
    try {
      const { data, error } = await supabase
        .from('system_logs')
        .select('*')
        .eq('component', 'Notifications')
        .order('timestamp', { ascending: false })
        .limit(limit);

      if (error) {
        console.error('Error getting recent notifications:', error);
        return [];
      }

      return data;
    } catch (error) {
      console.error('Error in getRecentNotifications:', error);
      return [];
    }
  }

  // Habilitar/deshabilitar notificaciones
  setEnabled(enabled) {
    this.isEnabled = enabled;
    console.log(`Notifications ${enabled ? 'enabled' : 'disabled'}`);
  }
}

// Instancia global del sistema de notificaciones
export const notificationSystem = new NotificationSystem();

// Funciones de conveniencia para tipos específicos
export const notifySystemError = (message, component, details = {}) => {
  return notificationSystem.sendNotification(NOTIFICATION_TYPES.SYSTEM_ERROR, {
    message,
    component,
    details,
    timestamp: new Date().toISOString()
  });
};

export const notifySecurityAlert = (message, username, ipAddress, userAgent, details = {}) => {
  return notificationSystem.sendNotification(NOTIFICATION_TYPES.SECURITY_ALERT, {
    message,
    username,
    ipAddress,
    userAgent,
    details,
    timestamp: new Date().toISOString()
  });
};

export const notifyTransactionFailed = (cliente, usdTotal, message, details = {}) => {
  return notificationSystem.sendNotification(NOTIFICATION_TYPES.TRANSACTION_FAILED, {
    message,
    cliente,
    usdTotal,
    details,
    timestamp: new Date().toISOString()
  });
};

export const notifyDatabaseError = (message, operation, table, details = {}) => {
  return notificationSystem.sendNotification(NOTIFICATION_TYPES.DATABASE_ERROR, {
    message,
    operation,
    table,
    details,
    timestamp: new Date().toISOString()
  });
};

export const notifyLargeTransaction = (transactionData) => {
  return notificationSystem.sendNotification(NOTIFICATION_TYPES.LARGE_TRANSACTION, {
    message: `Transacción de alto valor: $${transactionData.usdTotal?.toLocaleString()}`,
    ...transactionData,
    timestamp: new Date().toISOString()
  });
};

export const notifyBackupFailed = (backupId, error, details = {}) => {
  return notificationSystem.sendNotification(NOTIFICATION_TYPES.BACKUP_FAILED, {
    message: `Backup fallido: ${backupId}`,
    backupId,
    error: error.message,
    details,
    timestamp: new Date().toISOString()
  });
};

export const notifyMultipleLoginFailures = (username, ipAddress, attempts, details = {}) => {
  return notificationSystem.sendNotification(NOTIFICATION_TYPES.LOGIN_FAILED_MULTIPLE, {
    message: `Múltiples intentos de login fallidos: ${username} (${attempts} intentos)`,
    username,
    ipAddress,
    attempts,
    details,
    timestamp: new Date().toISOString()
  });
};

export const notifySuspiciousActivity = (message, details = {}) => {
  return notificationSystem.sendNotification(NOTIFICATION_TYPES.SUSPICIOUS_ACTIVITY, {
    message,
    details,
    timestamp: new Date().toISOString()
  });
};

// Limpiar cache de rate limiting periódicamente
setInterval(() => {
  const now = Date.now();
  const windowMs = 5 * 60 * 1000;
  
  for (const [key, timestamps] of notificationSystem.rateLimitCache.entries()) {
    const validTimestamps = timestamps.filter(ts => now - ts < windowMs);
    if (validTimestamps.length === 0) {
      notificationSystem.rateLimitCache.delete(key);
    } else {
      notificationSystem.rateLimitCache.set(key, validTimestamps);
    }
  }
}, 5 * 60 * 1000); // Cada 5 minutos

console.log('📢 Notification system initialized');