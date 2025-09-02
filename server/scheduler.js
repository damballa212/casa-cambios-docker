// Sistema de scheduling para backups automáticos
import cron from 'node-cron';
import { createClient } from '@supabase/supabase-js';
import { backupSystem } from './backup-system.js';
import { logger, COMPONENTS } from './logger.js';
import dotenv from 'dotenv';

dotenv.config();

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

/**
 * Clase para manejar el scheduling de backups automáticos
 */
export class BackupScheduler {
  constructor() {
    this.scheduledJobs = new Map();
    this.isInitialized = false;
  }

  /**
   * Inicializar el scheduler
   */
  async initialize() {
    try {
      console.log('🕐 Inicializando sistema de backups automáticos...');
      
      // Cargar y programar todas las configuraciones activas
      await this.loadAndScheduleConfigurations();
      
      // Programar verificación periódica de configuraciones (cada hora)
      this.scheduleConfigurationCheck();
      
      this.isInitialized = true;
      console.log('✅ Sistema de backups automáticos inicializado correctamente');
      
      await logger.info(COMPONENTS.BACKUP, 'Sistema de backups automáticos inicializado', {
        scheduledJobs: this.scheduledJobs.size
      });
      
    } catch (error) {
      console.error('❌ Error inicializando scheduler de backups:', error);
      await logger.error(COMPONENTS.BACKUP, 'Error inicializando scheduler', { error: error.message });
    }
  }

  /**
   * Cargar configuraciones de backup y programarlas
   */
  async loadAndScheduleConfigurations() {
    try {
      const { data: configurations, error } = await supabase
        .from('backup_configurations')
        .select('*')
        .eq('enabled', true);

      if (error) {
        throw new Error(`Error cargando configuraciones: ${error.message}`);
      }

      // Limpiar jobs existentes
      this.clearAllJobs();

      // Programar cada configuración
      for (const config of configurations || []) {
        await this.scheduleConfiguration(config);
      }

      console.log(`📅 ${configurations?.length || 0} configuraciones de backup programadas`);
      
    } catch (error) {
      console.error('❌ Error cargando configuraciones de backup:', error);
      throw error;
    }
  }

  /**
   * Programar una configuración específica
   */
  async scheduleConfiguration(config) {
    try {
      const cronExpression = this.buildCronExpression(config);
      
      if (!cronExpression) {
        console.warn(`⚠️ No se pudo crear expresión cron para configuración: ${config.name}`);
        return;
      }

      // Crear el job de cron
      const job = cron.schedule(cronExpression, async () => {
        await this.executeScheduledBackup(config);
      }, {
        scheduled: true,
        timezone: 'America/Asuncion' // Timezone de Paraguay
      });

      // Guardar referencia del job
      this.scheduledJobs.set(config.id, {
        job,
        config,
        cronExpression,
        nextRun: this.getNextRunTime(cronExpression)
      });

      console.log(`⏰ Backup programado: ${config.name} - ${cronExpression}`);
      
      // Actualizar next_run_at en la base de datos
      await this.updateNextRunTime(config.id, this.getNextRunTime(cronExpression));
      
    } catch (error) {
      console.error(`❌ Error programando configuración ${config.name}:`, error);
      await logger.error(COMPONENTS.BACKUP, `Error programando backup: ${config.name}`, {
        configId: config.id,
        error: error.message
      });
    }
  }

  /**
   * Ejecutar backup programado
   */
  async executeScheduledBackup(config) {
    try {
      console.log(`🔄 Ejecutando backup automático: ${config.name}`);
      
      // Actualizar last_run_at
      await this.updateLastRunTime(config.id, new Date(), 'running');
      
      // Crear el backup
      const result = await backupSystem.createBackup(
        'automatic',
        `${config.description} (Automático - ${new Date().toLocaleString()})`,
        'scheduler'
      );
      
      // Actualizar estado de éxito
      await this.updateLastRunTime(config.id, new Date(), 'success');
      
      console.log(`✅ Backup automático completado: ${config.name} - ID: ${result.backupId}`);
      
      await logger.success(COMPONENTS.BACKUP, `Backup automático completado: ${config.name}`, {
        configId: config.id,
        backupId: result.backupId,
        fileSize: result.fileSize
      });
      
    } catch (error) {
      console.error(`❌ Error en backup automático ${config.name}:`, error);
      
      // Actualizar estado de error
      await this.updateLastRunTime(config.id, new Date(), 'error');
      
      await logger.error(COMPONENTS.BACKUP, `Error en backup automático: ${config.name}`, {
        configId: config.id,
        error: error.message
      });
    }
  }

  /**
   * Construir expresión cron basada en la configuración
   */
  buildCronExpression(config) {
    const [hours, minutes] = config.schedule_time.split(':').map(Number);
    
    switch (config.schedule_type) {
      case 'daily':
        return `${minutes} ${hours} * * *`;
        
      case 'weekly':
        if (!config.schedule_days || config.schedule_days.length === 0) {
          return `${minutes} ${hours} * * 0`; // Domingo por defecto
        }
        const days = config.schedule_days.join(',');
        return `${minutes} ${hours} * * ${days}`;
        
      case 'monthly':
        const day = config.schedule_date || 1;
        return `${minutes} ${hours} ${day} * *`;
        
      default:
        console.warn(`Tipo de schedule no soportado: ${config.schedule_type}`);
        return null;
    }
  }

  /**
   * Obtener próximo tiempo de ejecución
   */
  getNextRunTime(cronExpression) {
    try {
      // Calcular próxima ejecución (implementación básica)
      const now = new Date();
      const nextRun = new Date(now.getTime() + 24 * 60 * 60 * 1000); // +24 horas por defecto
      return nextRun.toISOString();
    } catch (error) {
      console.error('Error calculando próxima ejecución:', error);
      return null;
    }
  }

  /**
   * Actualizar tiempo de próxima ejecución
   */
  async updateNextRunTime(configId, nextRunTime) {
    try {
      await supabase
        .from('backup_configurations')
        .update({ next_run_at: nextRunTime })
        .eq('id', configId);
    } catch (error) {
      console.error('Error actualizando next_run_at:', error);
    }
  }

  /**
   * Actualizar tiempo de última ejecución
   */
  async updateLastRunTime(configId, lastRunTime, status) {
    try {
      await supabase
        .from('backup_configurations')
        .update({ 
          last_run_at: lastRunTime.toISOString(),
          last_run_status: status
        })
        .eq('id', configId);
    } catch (error) {
      console.error('Error actualizando last_run_at:', error);
    }
  }

  /**
   * Programar verificación periódica de configuraciones
   */
  scheduleConfigurationCheck() {
    // Verificar configuraciones cada hora
    cron.schedule('0 * * * *', async () => {
      console.log('🔍 Verificando configuraciones de backup...');
      try {
        await this.loadAndScheduleConfigurations();
      } catch (error) {
        console.error('Error en verificación periódica:', error);
      }
    });
  }

  /**
   * Limpiar todos los jobs programados
   */
  clearAllJobs() {
    for (const [id, jobInfo] of this.scheduledJobs) {
      jobInfo.job.stop();
      jobInfo.job.destroy();
    }
    this.scheduledJobs.clear();
  }

  /**
   * Obtener estado del scheduler
   */
  getStatus() {
    return {
      initialized: this.isInitialized,
      scheduledJobs: this.scheduledJobs.size,
      jobs: Array.from(this.scheduledJobs.entries()).map(([id, info]) => ({
        configId: id,
        name: info.config.name,
        cronExpression: info.cronExpression,
        nextRun: info.nextRun,
        enabled: info.config.enabled
      }))
    };
  }

  /**
   * Detener el scheduler
   */
  stop() {
    console.log('🛑 Deteniendo scheduler de backups...');
    this.clearAllJobs();
    this.isInitialized = false;
  }
}

// Instancia singleton
export const backupScheduler = new BackupScheduler();

// Función para inicializar el scheduler
export async function initializeBackupScheduler() {
  await backupScheduler.initialize();
}

// Función para obtener estado
export function getSchedulerStatus() {
  return backupScheduler.getStatus();
}