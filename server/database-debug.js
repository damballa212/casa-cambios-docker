// Sistema de debugging profesional para operaciones de base de datos
import { Pool } from 'pg';
import { logger, COMPONENTS } from './logger.js';

// Configuración del pool de conexiones PostgreSQL
const dbPool = new Pool({
  host: 'aws-1-us-east-2.pooler.supabase.com',
  port: 6543,
  database: 'postgres',
  user: 'postgres.ixvefxnycehbvipxcngv',
  password: 'marlon212',
  ssl: {
    rejectUnauthorized: false
  },
  max: 15,
  idleTimeoutMillis: 60000,
  connectionTimeoutMillis: 10000,
  acquireTimeoutMillis: 10000,
  createTimeoutMillis: 10000,
  destroyTimeoutMillis: 5000,
  reapIntervalMillis: 1000,
  createRetryIntervalMillis: 200
});

/**
 * Sistema de debugging profesional para eliminación de transacciones
 */
export class TransactionDebugger {
  constructor() {
    this.sessionId = this.generateSessionId();
  }

  generateSessionId() {
    return `DEBUG_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Debugging completo para eliminación de transacción
   */
  async debugTransactionDeletion(transactionId, userId) {
    const debugSession = {
      sessionId: this.sessionId,
      transactionId,
      userId,
      startTime: new Date().toISOString(),
      steps: []
    };

    try {
      await logger.info(COMPONENTS.TRANSACTION, `🔍 INICIO DEBUG SESSION: ${this.sessionId}`, {
        transactionId,
        userId,
        timestamp: debugSession.startTime
      });

      // PASO 1: Verificar estado inicial de la base de datos
      const initialState = await this.captureInitialState(transactionId);
      debugSession.steps.push({
        step: 1,
        name: 'INITIAL_STATE_CAPTURE',
        timestamp: new Date().toISOString(),
        data: initialState,
        status: 'SUCCESS'
      });

      // PASO 2: Verificar integridad referencial
      const integrityCheck = await this.checkReferentialIntegrity(transactionId);
      debugSession.steps.push({
        step: 2,
        name: 'REFERENTIAL_INTEGRITY_CHECK',
        timestamp: new Date().toISOString(),
        data: integrityCheck,
        status: integrityCheck.isValid ? 'SUCCESS' : 'WARNING'
      });

      // PASO 3: Analizar impacto de la eliminación
      const impactAnalysis = await this.analyzeImpact(transactionId);
      debugSession.steps.push({
        step: 3,
        name: 'IMPACT_ANALYSIS',
        timestamp: new Date().toISOString(),
        data: impactAnalysis,
        status: 'SUCCESS'
      });

      // PASO 4: Verificar permisos y validaciones
      const permissionCheck = await this.checkPermissions(transactionId, userId);
      debugSession.steps.push({
        step: 4,
        name: 'PERMISSION_VALIDATION',
        timestamp: new Date().toISOString(),
        data: permissionCheck,
        status: permissionCheck.hasPermission ? 'SUCCESS' : 'ERROR'
      });

      // Log del estado completo antes de la eliminación
      await logger.info(COMPONENTS.TRANSACTION, `📊 DEBUG PRE-DELETION STATE`, {
        sessionId: this.sessionId,
        transactionId,
        initialState,
        integrityCheck,
        impactAnalysis,
        permissionCheck
      });

      return {
        success: true,
        debugSession,
        canProceed: permissionCheck.hasPermission && integrityCheck.isValid
      };

    } catch (error) {
      await logger.error(COMPONENTS.TRANSACTION, `❌ DEBUG SESSION ERROR: ${this.sessionId}`, {
        transactionId,
        error: error.message,
        stack: error.stack
      });

      return {
        success: false,
        error: error.message,
        debugSession
      };
    }
  }

  /**
   * Captura el estado inicial completo de la transacción y entidades relacionadas
   */
  async captureInitialState(transactionId) {
    const client = await dbPool.connect();
    try {
      // Obtener transacción completa
      const transactionQuery = `
        SELECT 
          t.*,
          EXTRACT(EPOCH FROM (NOW() - t.created_at)) as age_seconds
        FROM transactions t 
        WHERE t.id = $1
      `;
      const transactionResult = await client.query(transactionQuery, [transactionId]);
      
      if (transactionResult.rows.length === 0) {
        throw new Error(`Transacción ${transactionId} no encontrada`);
      }

      const transaction = transactionResult.rows[0];

      // Obtener estado del colaborador
      const collaboratorQuery = `
        SELECT 
          c.*,
          (SELECT COUNT(*) FROM transactions WHERE colaborador = c.name) as actual_tx_count
        FROM collaborators c 
        WHERE c.name = $1
      `;
      const collaboratorResult = await client.query(collaboratorQuery, [transaction.colaborador]);

      // Obtener estado del cliente
      const clientQuery = `
        SELECT 
          cl.*,
          (SELECT COUNT(*) FROM transactions WHERE cliente = cl.name) as actual_tx_count
        FROM clients cl 
        WHERE cl.name = $1
      `;
      const clientResult = await client.query(clientQuery, [transaction.cliente]);

      // Obtener estadísticas de la base de datos
      const dbStatsQuery = `
        SELECT 
          schemaname,
          relname as tablename,
          n_tup_ins as inserts,
          n_tup_upd as updates,
          n_tup_del as deletes,
          n_live_tup as live_tuples,
          n_dead_tup as dead_tuples,
          last_vacuum,
          last_autovacuum,
          last_analyze,
          last_autoanalyze
        FROM pg_stat_user_tables 
        WHERE relname IN ('transactions', 'collaborators', 'clients')
      `;
      const dbStatsResult = await client.query(dbStatsQuery);

      return {
        transaction,
        collaborator: collaboratorResult.rows[0] || null,
        client: clientResult.rows[0] || null,
        databaseStats: dbStatsResult.rows,
        captureTime: new Date().toISOString()
      };

    } finally {
      client.release();
    }
  }

  /**
   * Verifica la integridad referencial antes de la eliminación
   */
  async checkReferentialIntegrity(transactionId) {
    const client = await dbPool.connect();
    try {
      // Verificar constraints y relaciones
      const constraintsQuery = `
        SELECT 
          tc.constraint_name,
          tc.table_name,
          kcu.column_name,
          ccu.table_name AS foreign_table_name,
          ccu.column_name AS foreign_column_name
        FROM information_schema.table_constraints AS tc
        JOIN information_schema.key_column_usage AS kcu
          ON tc.constraint_name = kcu.constraint_name
        JOIN information_schema.constraint_column_usage AS ccu
          ON ccu.constraint_name = tc.constraint_name
        WHERE tc.constraint_type = 'FOREIGN KEY'
          AND (tc.table_name = 'transactions' OR ccu.table_name = 'transactions')
      `;
      const constraintsResult = await client.query(constraintsQuery);

      // Verificar índices
      const indexesQuery = `
        SELECT 
          schemaname,
          tablename,
          indexname,
          indexdef
        FROM pg_indexes 
        WHERE tablename IN ('transactions', 'collaborators', 'clients')
        ORDER BY tablename, indexname
      `;
      const indexesResult = await client.query(indexesQuery);

      // Verificar locks activos
      const locksQuery = `
        SELECT 
          l.locktype,
          l.database,
          l.relation::regclass,
          l.page,
          l.tuple,
          l.virtualxid,
          l.transactionid,
          l.mode,
          l.granted,
          a.query,
          a.query_start,
          a.state
        FROM pg_locks l
        LEFT JOIN pg_stat_activity a ON l.pid = a.pid
        WHERE l.relation::regclass::text IN ('transactions', 'collaborators', 'clients')
      `;
      const locksResult = await client.query(locksQuery);

      return {
        isValid: true,
        constraints: constraintsResult.rows,
        indexes: indexesResult.rows,
        activeLocks: locksResult.rows,
        checkTime: new Date().toISOString()
      };

    } catch (error) {
      return {
        isValid: false,
        error: error.message,
        checkTime: new Date().toISOString()
      };
    } finally {
      client.release();
    }
  }

  /**
   * Analiza el impacto de eliminar la transacción
   */
  async analyzeImpact(transactionId) {
    const client = await dbPool.connect();
    try {
      // Obtener transacción
      const transactionResult = await client.query(
        'SELECT * FROM transactions WHERE id = $1',
        [transactionId]
      );
      
      if (transactionResult.rows.length === 0) {
        throw new Error('Transacción no encontrada');
      }

      const transaction = transactionResult.rows[0];

      // Analizar impacto en colaborador
      const collaboratorImpactQuery = `
        SELECT 
          name,
          tx_count,
          (tx_count - 1) as new_tx_count,
          CASE 
            WHEN tx_count <= 1 THEN 'CRITICAL - Colaborador quedaría sin transacciones'
            WHEN tx_count <= 5 THEN 'WARNING - Pocas transacciones restantes'
            ELSE 'OK'
          END as impact_level
        FROM collaborators 
        WHERE name = $1
      `;
      const collaboratorImpact = await client.query(collaboratorImpactQuery, [transaction.colaborador]);

      // Analizar impacto en cliente
      const clientImpactQuery = `
        SELECT 
          cl.name,
          COUNT(t.id) as current_transactions,
          COUNT(t.id) - 1 as new_transaction_count,
          SUM(t.usd_total) as total_volume,
          SUM(t.usd_total) - $2 as new_total_volume,
          CASE 
            WHEN COUNT(t.id) <= 1 THEN 'CRITICAL - Cliente quedaría sin transacciones'
            WHEN COUNT(t.id) <= 3 THEN 'WARNING - Pocas transacciones restantes'
            ELSE 'OK'
          END as impact_level
        FROM clients cl
        LEFT JOIN transactions t ON t.cliente = cl.name
        WHERE cl.name = $1
        GROUP BY cl.name
      `;
      const clientImpact = await client.query(clientImpactQuery, [transaction.cliente, transaction.usd_total]);

      // Analizar impacto financiero
      const financialImpactQuery = `
        SELECT 
          COUNT(*) as total_transactions,
          SUM(usd_total) as total_volume,
          AVG(usd_total) as avg_transaction,
          SUM(CASE WHEN colaborador = $1 THEN usd_total ELSE 0 END) as collaborator_volume,
          SUM(CASE WHEN cliente = $2 THEN usd_total ELSE 0 END) as client_volume
        FROM transactions
        WHERE created_at >= CURRENT_DATE - INTERVAL '30 days'
      `;
      const financialImpact = await client.query(financialImpactQuery, [transaction.colaborador, transaction.cliente]);

      return {
        transaction: {
          id: transaction.id,
          usdTotal: transaction.usd_total,
          comision: transaction.comision,
          cliente: transaction.cliente,
          colaborador: transaction.colaborador
        },
        collaboratorImpact: collaboratorImpact.rows[0] || null,
        clientImpact: clientImpact.rows[0] || null,
        financialImpact: financialImpact.rows[0] || null,
        riskLevel: this.calculateRiskLevel(collaboratorImpact.rows[0], clientImpact.rows[0]),
        analysisTime: new Date().toISOString()
      };

    } finally {
      client.release();
    }
  }

  /**
   * Verifica permisos y validaciones de negocio
   */
  async checkPermissions(transactionId, userId) {
    const client = await dbPool.connect();
    try {
      // Verificar edad de la transacción
      const ageQuery = `
        SELECT 
          id,
          created_at,
          EXTRACT(EPOCH FROM (NOW() - created_at))/3600 as age_hours,
          CASE 
            WHEN EXTRACT(EPOCH FROM (NOW() - created_at))/3600 < 24 THEN 'RECENT'
            WHEN EXTRACT(EPOCH FROM (NOW() - created_at))/3600 < 168 THEN 'WEEK_OLD'
            ELSE 'OLD'
          END as age_category
        FROM transactions 
        WHERE id = $1
      `;
      const ageResult = await client.query(ageQuery, [transactionId]);

      // Verificar si hay transacciones dependientes (simulado)
      const dependenciesQuery = `
        SELECT COUNT(*) as dependent_count
        FROM transactions 
        WHERE chat_id = (SELECT chat_id FROM transactions WHERE id = $1)
          AND id != $1
          AND created_at > (SELECT created_at FROM transactions WHERE id = $1)
      `;
      const dependenciesResult = await client.query(dependenciesQuery, [transactionId]);

      const transaction = ageResult.rows[0];
      const dependencies = dependenciesResult.rows[0];

      const hasPermission = 
        transaction && 
        transaction.age_hours < 8760 && // Menos de un año (más flexible)
        parseInt(dependencies.dependent_count) === 0; // Sin dependencias

      return {
        hasPermission,
        userId,
        transactionAge: transaction ? {
          hours: transaction.age_hours,
          category: transaction.age_category,
          createdAt: transaction.created_at
        } : null,
        dependencies: {
          count: dependencies.dependent_count,
          hasBlocking: parseInt(dependencies.dependent_count) > 0
        },
        validationRules: {
          maxAgeHours: 8760, // Un año
          allowDependencies: false,
          requiresApproval: transaction ? transaction.age_hours > 168 : true // Requiere aprobación después de una semana
        },
        checkTime: new Date().toISOString()
      };

    } finally {
      client.release();
    }
  }

  /**
   * Calcula el nivel de riesgo de la eliminación
   */
  calculateRiskLevel(collaboratorImpact, clientImpact) {
    let riskScore = 0;
    let riskFactors = [];

    if (collaboratorImpact) {
      if (collaboratorImpact.impact_level === 'CRITICAL') {
        riskScore += 10;
        riskFactors.push('Colaborador quedaría sin transacciones');
      } else if (collaboratorImpact.impact_level === 'WARNING') {
        riskScore += 5;
        riskFactors.push('Colaborador con pocas transacciones restantes');
      }
    }

    if (clientImpact) {
      if (clientImpact.impact_level === 'CRITICAL') {
        riskScore += 10;
        riskFactors.push('Cliente quedaría sin transacciones');
      } else if (clientImpact.impact_level === 'WARNING') {
        riskScore += 5;
        riskFactors.push('Cliente con pocas transacciones restantes');
      }
    }

    let level = 'LOW';
    if (riskScore >= 15) level = 'CRITICAL';
    else if (riskScore >= 8) level = 'HIGH';
    else if (riskScore >= 3) level = 'MEDIUM';

    return {
      level,
      score: riskScore,
      factors: riskFactors
    };
  }

  /**
   * Registra el resultado final de la eliminación
   */
  async logDeletionResult(transactionId, success, error = null, affectedRows = null) {
    try {
      const result = {
        sessionId: this.sessionId,
        transactionId,
        success,
        error,
        affectedRows,
        completedAt: new Date().toISOString()
      };

      if (success) {
        await logger.success(COMPONENTS.TRANSACTION, `✅ DELETION COMPLETED: ${this.sessionId}`, result);
      } else {
        await logger.error(COMPONENTS.TRANSACTION, `❌ DELETION FAILED: ${this.sessionId}`, result);
      }

      // Capturar estado final para comparación
      if (success) {
        const finalState = await this.captureFinalState(transactionId);
        await logger.info(COMPONENTS.TRANSACTION, `📊 FINAL STATE CAPTURED: ${this.sessionId}`, finalState);
      }

    } catch (logError) {
      console.error('Error logging deletion result:', logError);
    }
  }

  /**
   * Captura el estado final después de la eliminación
   */
  async captureFinalState(transactionId) {
    const client = await dbPool.connect();
    try {
      // Verificar que la transacción fue eliminada
      const transactionCheck = await client.query(
        'SELECT COUNT(*) as count FROM transactions WHERE id = $1',
        [transactionId]
      );

      // Obtener estadísticas actualizadas
      const statsQuery = `
        SELECT 
          'transactions' as table_name,
          COUNT(*) as total_records,
          MAX(created_at) as last_created,
          MAX(updated_at) as last_updated
        FROM transactions
        UNION ALL
        SELECT 
          'collaborators' as table_name,
          COUNT(*) as total_records,
          MAX(created_at) as last_created,
          MAX(updated_at) as last_updated
        FROM collaborators
        UNION ALL
        SELECT 
          'clients' as table_name,
          COUNT(*) as total_records,
          MAX(created_at) as last_created,
          MAX(updated_at) as last_updated
        FROM clients
      `;
      const statsResult = await client.query(statsQuery);

      return {
        transactionExists: transactionCheck.rows[0].count > 0,
        tableStats: statsResult.rows,
        captureTime: new Date().toISOString()
      };

    } finally {
      client.release();
    }
  }

  /**
   * Cierra la conexión del pool
   */
  async close() {
    await dbPool.end();
  }
}

// Instancia singleton del debugger
export const transactionDebugger = new TransactionDebugger();

// Función de utilidad para debugging rápido
export async function debugTransactionDeletion(transactionId, userId) {
  return await transactionDebugger.debugTransactionDeletion(transactionId, userId);
}

export default TransactionDebugger;