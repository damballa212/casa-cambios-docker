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
    template: 'login_failed'
  },
  [NOTIFICATION_TYPES.LARGE_TRANSACTION]: {
    priority: PRIORITY_LEVELS.HIGH,
    channels: ['email', 'database'],
    recipients: ['admin@casadecambios.com', 'finance@casadecambios.com'],
    template: 'large_transaction'
  },
  [NOTIFICATION_TYPES.SYSTEM_OFFLINE]: {
    priority: PRIORITY_LEVELS.CRITICAL,
    channels: ['email'],
    recipients: ['admin@casadecambios.com', 'devops@casadecambios.com'],
    template: 'system_offline'
  },
  [NOTIFICATION_TYPES.SUSPICIOUS_ACTIVITY]: {
    priority: PRIORITY_LEVELS.CRITICAL,
    channels: ['email', 'database'],
    recipients: ['security@casadecambios.com', 'admin@casadecambios.com'],
    template: 'suspicious_activity'
  }
};

class NotificationSystem {
  constructor() {
    this.rateLimitCache = new Map();
  }

  generateNotificationId() {
    return `notif_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  priorityToLogLevel(priority) {
    switch (priority) {
      case PRIORITY_LEVELS.CRITICAL: return 'error';
      case PRIORITY_LEVELS.HIGH: return 'error';
      case PRIORITY_LEVELS.MEDIUM: return 'warn';
      case PRIORITY_LEVELS.LOW: return 'info';
      default: return 'info';
    }
  }

  // Enviar notificación
  async send(type, data, options = {}) {
    try {
      // Verificar rate limit
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

  // Método initialize requerido por server.js
  async initialize() {
    console.log('📢 Notification system initialized');
    return true;
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
      console.error('Exception saving notification to database:', error);
    }
  }

  // Enviar email (stub)
  async sendEmail(notification, template) {
    // Implementar envío de email real aquí
    console.log(`Sending email for notification ${notification.id} using template ${template}`);
  }
}

// Singleton instance
export const notificationSystem = new NotificationSystem();

// Helpers para notificaciones comunes
export const notifySystemError = (error, component) => {
  notificationSystem.send(NOTIFICATION_TYPES.SYSTEM_ERROR, {
    message: `System Error in ${component}: ${error.message}`,
    error: error.stack,
    component
  });
};

export const notifySecurityAlert = (message, details) => {
  notificationSystem.send(NOTIFICATION_TYPES.SECURITY_ALERT, {
    message,
    ...details
  });
};

export const notifyTransactionFailed = (transactionId, reason) => {
  notificationSystem.send(NOTIFICATION_TYPES.TRANSACTION_FAILED, {
    message: `Transaction ${transactionId} failed: ${reason}`,
    transactionId,
    reason
  });
};

export const notifyDatabaseError = (error, query) => {
  notificationSystem.send(NOTIFICATION_TYPES.DATABASE_ERROR, {
    message: `Database Error: ${error.message}`,
    error: error.code,
    query
  });
};

export const notifyLargeTransaction = (transaction) => {
  notificationSystem.send(NOTIFICATION_TYPES.LARGE_TRANSACTION, {
    message: `Large transaction detected: ${transaction.amount} ${transaction.currency}`,
    transactionId: transaction.id,
    amount: transaction.amount,
    currency: transaction.currency
  });
};

export const notifyBackupFailed = (error) => {
  notificationSystem.send(NOTIFICATION_TYPES.BACKUP_FAILED, {
    message: `Backup failed: ${error.message}`,
    error: error.message
  });
};

export const notifyMultipleLoginFailures = (email, ip) => {
  notificationSystem.send(NOTIFICATION_TYPES.LOGIN_FAILED_MULTIPLE, {
    message: `Multiple failed login attempts for ${email} from ${ip}`,
    email,
    ip
  });
};
