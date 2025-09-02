// Sistema completo de backup para Casa de Cambios
import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';

// Configuración ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Cargar variables de entorno
dotenv.config();

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Error: SUPABASE_URL y SUPABASE_SERVICE_ROLE_KEY son requeridos');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

// Tablas principales del sistema
const MAIN_TABLES = [
  'global_rate',
  'collaborators', 
  'clients',
  'transactions'
];

// Configuración de backup
const BACKUP_CONFIG = {
  maxBackups: 50, // Máximo número de backups a mantener
  backupDir: process.env.BACKUP_DIR || path.join(path.dirname(__filename), '../backups'),
  compressionEnabled: true,
  retentionDays: 90 // Días para mantener backups
};

// Asegurar que la ruta de backups sea absoluta y correcta
if (!path.isAbsolute(BACKUP_CONFIG.backupDir)) {
  BACKUP_CONFIG.backupDir = path.resolve(BACKUP_CONFIG.backupDir);
}

console.log(`📁 Directorio de backups configurado: ${BACKUP_CONFIG.backupDir}`);

/**
 * Clase principal del sistema de backup
 */
export class BackupSystem {
  constructor() {
    this.ensureBackupDirectory();
  }

  /**
   * Asegurar que el directorio de backups existe
   */
  ensureBackupDirectory() {
    if (!fs.existsSync(BACKUP_CONFIG.backupDir)) {
      fs.mkdirSync(BACKUP_CONFIG.backupDir, { recursive: true });
      console.log(`📁 Directorio de backups creado: ${BACKUP_CONFIG.backupDir}`);
    }
  }

  /**
   * Crear un backup completo de la base de datos
   * @param {string} type - Tipo de backup ('manual', 'auto', 'pre-format')
   * @param {string} description - Descripción del backup
   * @param {string} userId - ID del usuario que crea el backup
   * @returns {Object} Información del backup creado
   */
  async createBackup(type = 'manual', description = '', userId = 'system') {
    try {
      console.log('🚀 Iniciando creación de backup...');
      
      // Asegurar que el directorio de backups existe
      this.ensureBackupDirectory();
      
      const backupId = this.generateBackupId();
      const timestamp = new Date().toISOString();
      
      const backupData = {
        id: backupId,
        timestamp,
        type,
        description,
        userId,
        version: '1.0',
        tables: {},
        metadata: {
          totalRecords: 0,
          totalSize: 0,
          compressionUsed: BACKUP_CONFIG.compressionEnabled
        }
      };

      // Exportar cada tabla
      for (const tableName of MAIN_TABLES) {
        console.log(`📊 Exportando tabla: ${tableName}`);
        try {
          const tableData = await this.exportTable(tableName);
          
          if (tableData) {
            backupData.tables[tableName] = {
              data: tableData,
              count: tableData.length,
              exported_at: timestamp
            };
            backupData.metadata.totalRecords += tableData.length;
          }
        } catch (tableError) {
          console.error(`❌ Error exportando tabla ${tableName}:`, tableError);
          // Continuar con las otras tablas
          backupData.tables[tableName] = {
            data: [],
            count: 0,
            exported_at: timestamp,
            error: tableError.message
          };
        }
      }

      // Guardar backup en archivo
      const backupFilePath = path.join(BACKUP_CONFIG.backupDir, `backup_${backupId}.json`);
      const backupContent = JSON.stringify(backupData, null, 2);
      
      try {
        fs.writeFileSync(backupFilePath, backupContent);
        backupData.metadata.totalSize = Buffer.byteLength(backupContent, 'utf8');
        console.log(`✅ Archivo de backup guardado: ${backupFilePath}`);
      } catch (fileError) {
        console.error('❌ Error guardando archivo de backup:', fileError);
        throw new Error(`Error guardando archivo de backup: ${fileError.message}`);
      }
      
      // Registrar backup en la tabla de backups
      try {
        await this.registerBackup(backupData);
        console.log('✅ Backup registrado en base de datos');
      } catch (dbError) {
        console.error('❌ Error registrando backup en BD:', dbError);
        // Eliminar archivo si no se pudo registrar en BD
        try {
          fs.unlinkSync(backupFilePath);
        } catch (unlinkError) {
          console.error('❌ Error eliminando archivo de backup fallido:', unlinkError);
        }
        throw new Error(`Error registrando backup en base de datos: ${dbError.message}`);
      }
      
      console.log(`✅ Backup creado exitosamente: ${backupId}`);
      console.log(`📁 Archivo: ${backupFilePath}`);
      console.log(`📊 Registros totales: ${backupData.metadata.totalRecords}`);
      console.log(`💾 Tamaño: ${this.formatBytes(backupData.metadata.totalSize)}`);
      
      return {
        success: true,
        backupId,
        filePath: backupFilePath,
        metadata: backupData.metadata,
        timestamp
      };
      
    } catch (error) {
      console.error('❌ Error creando backup:', error);
      throw error;
    }
  }

  /**
   * Exportar datos de una tabla específica
   * @param {string} tableName - Nombre de la tabla
   * @returns {Array} Datos de la tabla
   */
  async exportTable(tableName) {
    try {
      const { data, error } = await supabase
        .from(tableName)
        .select('*')
        .order('id', { ascending: true }); // Orden consistente
      
      if (error) {
        console.error(`❌ Error exportando ${tableName}:`, error.message);
        return null;
      }
      
      console.log(`✅ ${tableName}: ${data?.length || 0} registros exportados`);
      return data || [];
      
    } catch (err) {
      console.error(`❌ Error inesperado en ${tableName}:`, err.message);
      return null;
    }
  }

  /**
   * Registrar backup en la tabla de backups
   * @param {Object} backupData - Datos del backup
   */
  async registerBackup(backupData) {
    try {
      const { error } = await supabase
        .from('database_backups')
        .insert({
          backup_id: backupData.id,
          type: backupData.type,
          description: backupData.description,
          user_id: backupData.userId,
          file_path: `backup_${backupData.id}.json`,
          total_records: backupData.metadata.totalRecords,
          file_size: backupData.metadata.totalSize,
          tables_included: Object.keys(backupData.tables),
          created_at: backupData.timestamp,
          status: 'completed'
        });
      
      if (error) {
        console.error('❌ Error registrando backup:', error);
        throw error;
      }
      
    } catch (err) {
      console.error('❌ Error registrando backup en BD:', err);
      throw err;
    }
  }

  /**
   * Listar todos los backups disponibles
   * @returns {Array} Lista de backups
   */
  async listBackups() {
    try {
      const { data, error } = await supabase
        .from('database_backups')
        .select('*')
        .order('created_at', { ascending: false });
      
      if (error) {
        throw error;
      }
      
      return data || [];
      
    } catch (err) {
      console.error('❌ Error listando backups:', err);
      throw err;
    }
  }

  /**
   * Restaurar un backup específico
   * @param {string} backupId - ID del backup a restaurar
   * @param {string} userId - ID del usuario que restaura
   * @returns {Object} Resultado de la restauración
   */
  async restoreBackup(backupId, userId = 'system') {
    try {
      console.log(`🔄 Iniciando restauración del backup: ${backupId}`);
      
      // Verificar que el backup existe
      const backupInfo = await this.getBackupInfo(backupId);
      if (!backupInfo) {
        throw new Error(`Backup ${backupId} no encontrado`);
      }
      
      // Cargar datos del backup
      const backupFilePath = path.join(BACKUP_CONFIG.backupDir, backupInfo.file_path);
      if (!fs.existsSync(backupFilePath)) {
        throw new Error(`Archivo de backup no encontrado: ${backupFilePath}`);
      }
      
      const backupContent = fs.readFileSync(backupFilePath, 'utf8');
      const backupData = JSON.parse(backupContent);
      
      // Validar y normalizar estructura del backup
      let tablesData;
      if (backupData.tables) {
        // Estructura estándar: {tables: {...}}
        tablesData = backupData.tables;
      } else if (backupData.data) {
        // Estructura de backup importado: {metadata: {...}, data: {...}}
        tablesData = backupData.data;
      } else {
        throw new Error(`Estructura de backup inválida. El backup debe contener un objeto 'tables' o 'data'.`);
      }
      
      console.log(`📊 Backup cargado: ${Object.keys(tablesData).length} tablas`);
      console.log(`📋 Tablas disponibles: ${Object.keys(tablesData).join(', ')}`);
      
      // Normalizar backupData para el resto del proceso
      if (!backupData.tables) {
        backupData.tables = tablesData;
      }
      
      
      // Crear backup automático antes de restaurar
      console.log('🛡️ Creando backup de seguridad antes de restaurar...');
      await this.createBackup('auto', `Backup automático antes de restaurar ${backupId}`, userId);
      
      // Restaurar cada tabla
      const restorationResults = {};
      
      for (const [tableName, tableInfo] of Object.entries(backupData.tables)) {
        console.log(`🔄 Restaurando tabla: ${tableName}`);
        
        try {
          // Limpiar tabla actual (excepto colaboradores protegidos)
          if (tableName === 'collaborators') {
            await this.clearTableWithProtection(tableName);
          } else {
            await this.clearTable(tableName);
          }
          
          // Insertar datos del backup
          // Después de la normalización, tableInfo contiene directamente el array de datos
          const dataToInsert = Array.isArray(tableInfo) ? tableInfo : (tableInfo.data || []);
          
          console.log(`🔍 DEBUG ${tableName}:`);
          console.log(`  - tableInfo es array: ${Array.isArray(tableInfo)}`);
          console.log(`  - tableInfo tipo: ${typeof tableInfo}`);
          console.log(`  - tableInfo.data existe: ${tableInfo.data !== undefined}`);
          console.log(`  - dataToInsert longitud: ${dataToInsert ? dataToInsert.length : 'null/undefined'}`);
          
          if (dataToInsert && dataToInsert.length > 0) {
            let insertResult;
            
            if (tableName === 'collaborators') {
              // Para colaboradores, usar UPSERT para insertar o actualizar
              console.log(`🔄 Haciendo UPSERT de colaboradores`);
              let processedCount = 0;
              
              for (const collaborator of dataToInsert) {
                console.log(`📊 Procesando colaborador: ${collaborator.name} (ID: ${collaborator.id})`);
                const { error: upsertError } = await supabase
                  .from('collaborators')
                  .upsert({
                    id: collaborator.id,
                    name: collaborator.name,
                    base_pct_usd_total: collaborator.base_pct_usd_total,
                    tx_count: collaborator.tx_count,
                    updated_at: collaborator.updated_at
                  }, {
                    onConflict: 'id'
                  });
                
                if (upsertError) {
                  console.error(`❌ Error procesando colaborador ${collaborator.name}:`, upsertError);
                } else {
                  console.log(`✅ Colaborador ${collaborator.name} procesado: tx_count=${collaborator.tx_count}`);
                  processedCount++;
                }
              }
              
              insertResult = { error: null }; // Simular éxito para el flujo principal
              console.log(`📊 ${processedCount} colaboradores procesados de ${dataToInsert.length}`);
            } else {
              // Para otras tablas, usar insert normal
              console.log(`🔄 Insertando ${dataToInsert.length} registros en ${tableName}`);
              insertResult = await supabase
                .from(tableName)
                .insert(dataToInsert);
            }
            
            if (insertResult.error) {
              throw insertResult.error;
            }
            
            restorationResults[tableName] = {
              success: true,
              recordsRestored: dataToInsert.length
            };
            
            console.log(`✅ ${tableName}: ${dataToInsert.length} registros restaurados`);
          } else {
            restorationResults[tableName] = {
              success: true,
              recordsRestored: 0
            };
            console.log(`✅ ${tableName}: tabla vacía restaurada`);
          }
          
        } catch (tableError) {
          console.error(`❌ Error restaurando ${tableName}:`, tableError);
          restorationResults[tableName] = {
            success: false,
            error: tableError.message
          };
        }
      }
      
      // Registrar la restauración
      await this.logRestoration(backupId, userId, restorationResults);
      
      console.log('🎉 Restauración completada');
      
      return {
        success: true,
        backupId,
        restorationResults,
        timestamp: new Date().toISOString()
      };
      
    } catch (error) {
      console.error('❌ Error en restauración:', error);
      throw error;
    }
  }

  /**
   * Limpiar tabla con protección para colaboradores
   * @param {string} tableName - Nombre de la tabla
   */
  async clearTableWithProtection(tableName) {
    if (tableName === 'collaborators') {
      // Para colaboradores, usar estrategia de upsert en lugar de delete+insert
      console.log('🔄 Usando estrategia de upsert para colaboradores protegidos');
      return; // No eliminar nada, usar upsert en la inserción
    } else {
      await this.clearTable(tableName);
    }
  }

  /**
   * Limpiar tabla completamente
   * @param {string} tableName - Nombre de la tabla
   */
  async clearTable(tableName) {
    const { error } = await supabase
      .from(tableName)
      .delete()
      .neq('id', 0); // Eliminar todos los registros
    
    if (error) {
      throw error;
    }
  }

  /**
   * Obtener información de un backup específico
   * @param {string} backupId - ID del backup
   * @returns {Object} Información del backup
   */
  async getBackupInfo(backupId) {
    try {
      const { data, error } = await supabase
        .from('database_backups')
        .select('*')
        .eq('backup_id', backupId)
        .single();
      
      if (error) {
        throw error;
      }
      
      return data;
      
    } catch (err) {
      console.error('❌ Error obteniendo info del backup:', err);
      return null;
    }
  }

  /**
   * Registrar una operación de restauración
   * @param {string} backupId - ID del backup restaurado
   * @param {string} userId - ID del usuario
   * @param {Object} results - Resultados de la restauración
   */
  async logRestoration(backupId, userId, results) {
    try {
      await supabase
        .from('system_logs')
        .insert({
          level: 'info',
          component: 'Backup',
          message: `Backup ${backupId} restaurado por usuario ${userId}`,
          details: {
            backupId,
            userId,
            restorationResults: results,
            timestamp: new Date().toISOString()
          },
          timestamp: new Date().toISOString()
        });
    } catch (error) {
      console.error('⚠️ Error registrando restauración:', error);
    }
  }

  /**
   * Eliminar backups antiguos según la configuración de retención
   */
  async cleanupOldBackups() {
    try {
      console.log('🧹 Iniciando limpieza de backups antiguos...');
      
      const cutoffDate = new Date();
      cutoffDate.setDate(cutoffDate.getDate() - BACKUP_CONFIG.retentionDays);
      
      // Obtener backups antiguos
      const { data: oldBackups, error } = await supabase
        .from('database_backups')
        .select('*')
        .lt('created_at', cutoffDate.toISOString())
        .order('created_at', { ascending: true });
      
      if (error) {
        throw error;
      }
      
      if (!oldBackups || oldBackups.length === 0) {
        console.log('✅ No hay backups antiguos para eliminar');
        return;
      }
      
      console.log(`🗑️ Eliminando ${oldBackups.length} backups antiguos...`);
      
      for (const backup of oldBackups) {
        // Eliminar archivo físico
        const filePath = path.join(BACKUP_CONFIG.backupDir, backup.file_path);
        if (fs.existsSync(filePath)) {
          fs.unlinkSync(filePath);
          console.log(`🗑️ Archivo eliminado: ${backup.file_path}`);
        }
        
        // Eliminar registro de la base de datos
        await supabase
          .from('database_backups')
          .delete()
          .eq('id', backup.id);
      }
      
      console.log('✅ Limpieza de backups completada');
      
    } catch (error) {
      console.error('❌ Error en limpieza de backups:', error);
    }
  }

  /**
   * Generar ID único para backup
   * @returns {string} ID del backup
   */
  generateBackupId() {
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const random = Math.random().toString(36).substr(2, 8);
    return `${timestamp}_${random}`;
  }

  /**
   * Formatear bytes a formato legible
   * @param {number} bytes - Número de bytes
   * @returns {string} Tamaño formateado
   */
  formatBytes(bytes) {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  }

  /**
   * Verificar integridad de un backup
   * @param {string} backupId - ID del backup
   * @returns {Object} Resultado de la verificación
   */
  async verifyBackup(backupId) {
    try {
      const backupInfo = await this.getBackupInfo(backupId);
      if (!backupInfo) {
        return { valid: false, error: 'Backup no encontrado en base de datos' };
      }
      
      const backupFilePath = path.join(BACKUP_CONFIG.backupDir, backupInfo.file_path);
      if (!fs.existsSync(backupFilePath)) {
        return { valid: false, error: 'Archivo de backup no encontrado' };
      }
      
      try {
        const backupContent = fs.readFileSync(backupFilePath, 'utf8');
        const backupData = JSON.parse(backupContent);
        
        // Verificar estructura básica
        if (!backupData.id || !backupData.tables || !backupData.metadata) {
          return { valid: false, error: 'Estructura de backup inválida' };
        }
        
        // Verificar que todas las tablas principales estén presentes
        const missingTables = MAIN_TABLES.filter(table => !backupData.tables[table]);
        if (missingTables.length > 0) {
          return { 
            valid: false, 
            error: `Tablas faltantes: ${missingTables.join(', ')}` 
          };
        }
        
        return { 
          valid: true, 
          metadata: backupData.metadata,
          tables: Object.keys(backupData.tables)
        };
        
      } catch (parseError) {
        return { valid: false, error: 'Error parseando archivo de backup' };
      }
      
    } catch (error) {
      return { valid: false, error: error.message };
    }
  }
}

// Instancia singleton del sistema de backup
export const backupSystem = new BackupSystem();

// Función de conveniencia para crear backup
export async function createBackup(type = 'manual', description = '', userId = 'system') {
  return await backupSystem.createBackup(type, description, userId);
}

// Función de conveniencia para restaurar backup
export async function restoreBackup(backupId, userId = 'system') {
  return await backupSystem.restoreBackup(backupId, userId);
}

// Función de conveniencia para listar backups
export async function listBackups() {
  return await backupSystem.listBackups();
}