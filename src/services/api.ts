// API Service para conectar con el backend de Casa de Cambios

// En producción (Docker), usar URLs relativas. En desarrollo, usar localhost
const API_BASE_URL = window.location.hostname === 'localhost' 
  ? 'http://localhost:3001/api'
  : '/api';

// Tipos de datos
export interface Transaction {
  id: string;
  fecha: string;
  cliente: string;
  colaborador: string;
  usdTotal: number;
  comision: number;
  usdNeto: number;
  montoGs: number;
  tasaUsada: number;
  status: 'completed' | 'processing' | 'error';
  chatId: string;
  idempotencyKey: string;
  montoColaboradorUsd?: number;
  montoComisionGabrielUsd?: number;
}

export interface CreateTransactionRequest {
  cliente: string;
  colaborador: string;
  usdTotal: number;
  comision: number;
  tasaUsada: number;
  chatId?: string;
  observaciones?: string;
  colaboradorPct?: number;
}

export interface Collaborator {
  id: number;
  name: string;
  basePct: number | null;
  txCount: number;
  totalCommissionUsd: number;
  totalCommissionGs: number;
  status: 'active' | 'inactive';
  isOwner: boolean;
  rules: string;
}

export interface DashboardMetrics {
  totalTransactions: number;
  dailyVolume: number;
  currentRate: number;
  activeCollaborators: number;
  systemStatus: string;
  pendingMessages: number;
}

export interface RateData {
  rate: number;
  updated_at: string;
}

export interface RateHistory {
  date: string;
  rate: number;
  change: string;
  user: string;
}

export interface ReportsSummary {
  totalTransactions: number;
  totalVolumeUsd: number;
  totalCommissions: number;
  averageTransaction: number;
  topCollaborator: string;
  topClient: string;
}

export interface AuthUser {
  id: number;
  username: string;
  role: string;
}

export interface LoginResponse {
  success: boolean;
  accessToken: string;
  refreshToken: string;
  user: AuthUser;
  expiresIn: string;
}

export interface AuthError {
  error: string;
  code: string;
}

export interface User {
  id: number;
  username: string;
  role: string;
  email?: string;
  status?: 'active' | 'inactive';
  lastLogin?: string | null;
  createdAt?: string;
  permissions?: string[];
}

export interface CreateUserRequest {
  username: string;
  email?: string;
  password: string;
  role: string;
}

export interface UpdateUserRequest {
  username?: string;
  email?: string;
  password?: string;
  role?: string;
}

export interface DatabaseInfo {
  connection: {
    host: string;
    port: string;
    database: string;
    poolSize: number;
    connected: boolean;
    lastCheck: string;
  };
  statistics: {
    totalTables: number;
    totalRecords: number;
    databaseSize: string;
    uptime: number;
  };
  tables: Array<{
    name: string;
    description: string;
    records: number;
    status: 'active' | 'error';
  }>;
}

export interface BackupConfiguration {
  id: number;
  name: string;
  enabled: boolean;
  schedule_type: 'daily' | 'weekly' | 'monthly' | 'custom';
  schedule_time: string;
  schedule_days?: number[];
  schedule_date?: number;
  retention_days: number;
  max_backups: number;
  description?: string;
  notification_enabled: boolean;
  notification_emails: string[];
  created_by: string;
  created_at: string;
  updated_at: string;
  last_run_at?: string;
  next_run_at?: string;
}

export interface CreateBackupConfigRequest {
  name: string;
  enabled?: boolean;
  schedule_type: 'daily' | 'weekly' | 'monthly' | 'custom';
  schedule_time: string;
  schedule_days?: number[];
  schedule_date?: number;
  retention_days?: number;
  max_backups?: number;
  description?: string;
  notification_enabled?: boolean;
  notification_emails?: string[];
}

export interface RecentActivity {
  id: string;
  message: string;
  time: string;
  status: 'success' | 'warning' | 'info' | 'error';
  timestamp: string;
  component?: string;
  details?: any;
}

export interface GeneralSettings {
  systemName: string;
  timezone: string;
  primaryCurrency: string;
  autoUpdatesEnabled: boolean;
}

export interface SecuritySettings {
  rateLimitMessages: number;
  rateLimitWindow: number;
  allowedIPs: string[];
  auditLogsEnabled: boolean;
  requireIdempotencyKey: boolean;
}

export interface SystemUser {
  id: number;
  username: string;
  role: 'admin' | 'owner' | 'user';
}



// Clase para manejar las llamadas a la API
class ApiService {
  private async fetchApi<T>(endpoint: string, options?: RequestInit): Promise<T> {
    const accessToken = this.getStoredToken();
    
    const config: RequestInit = {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        ...(accessToken && { Authorization: `Bearer ${accessToken}` }),
        ...options?.headers,
      },
    };

    try {
      const response = await fetch(`${API_BASE_URL}${endpoint}`, config);
      
      if (!response.ok) {
        if (response.status === 401) {
          // Token expirado o inválido - intentar refresh
          const refreshed = await this.tryRefreshToken();
          if (refreshed) {
            // Reintentar la petición con el nuevo token
            const newAccessToken = this.getStoredToken();
            const retryConfig: RequestInit = {
              ...options,
              headers: {
                'Content-Type': 'application/json',
                ...(newAccessToken && { Authorization: `Bearer ${newAccessToken}` }),
                ...options?.headers,
              },
            };
            const retryResponse = await fetch(`${API_BASE_URL}${endpoint}`, retryConfig);
            if (retryResponse.ok) {
              return await retryResponse.json();
            }
          }
          
          // Si el refresh falló, limpiar tokens y emitir evento de logout
          this.clearStoredToken();
          localStorage.removeItem('user');
          localStorage.removeItem('refreshToken');
          
          // Emitir evento personalizado para notificar al App.tsx
          window.dispatchEvent(new CustomEvent('auth:session-expired'));
          
          throw new Error('Sesión expirada');
        }
        
        const errorData = await response.json().catch(() => ({
          error: `HTTP ${response.status}: ${response.statusText}`
        }));
        
        throw new Error(errorData.error || `HTTP ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error(`API Error (${endpoint}):`, error);
      throw error;
    }
  }

  // Dashboard Metrics
  async getDashboardMetrics(): Promise<DashboardMetrics> {
    return this.fetchApi<DashboardMetrics>('/dashboard/metrics');
  }

  // Transacciones
  async getTransactions(params?: {
    start?: string;
    end?: string;
    preset?: 'today' | 'last_7d' | 'last_30d' | 'last_90d' | 'this_month' | 'last_month';
    collaborator?: string;
    client?: string;
    status?: string;
    search?: string;
    minUsd?: number;
    maxUsd?: number;
    minGs?: number;
    maxGs?: number;
    minCommission?: number;
    maxCommission?: number;
    minRate?: number;
    maxRate?: number;
  }): Promise<Transaction[]> {
    const qs = (() => {
      if (!params) return '';
      const s = new URLSearchParams();
      Object.entries(params).forEach(([key, value]) => {
        if (value === undefined || value === null || value === '') return;
        s.append(key, String(value));
      });
      const str = s.toString();
      return str ? `?${str}` : '';
    })();

    return this.fetchApi<Transaction[]>(`/transactions${qs}`);
  }

  async createTransaction(transactionData: CreateTransactionRequest): Promise<{
    success: boolean;
    message: string;
    transaction: Transaction;
  }> {
    return this.fetchApi<{
      success: boolean;
      message: string;
      transaction: Transaction;
    }>('/transactions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${this.getStoredToken()}`
      },
      body: JSON.stringify(transactionData)
    });
  }

  // Eliminar transacción
  async deleteTransaction(id: string): Promise<{
    success: boolean;
    message: string;
    transaction: any;
  }> {
    return this.fetchApi<{
      success: boolean;
      message: string;
      transaction: any;
    }>(`/transactions/${id}`, {
      method: 'DELETE',
    });
  }

  // Colaboradores
  async getCollaborators(): Promise<Collaborator[]> {
    return this.fetchApi<Collaborator[]>('/collaborators');
  }

  // Crear colaborador
  async createCollaborator(collaborator: {
    name: string;
    basePct?: number | null;
    status: string;
  }): Promise<Collaborator> {
    return this.fetchApi<Collaborator>('/collaborators', {
      method: 'POST',
      body: JSON.stringify(collaborator),
    });
  }

  // Actualizar colaborador
  async updateCollaborator(id: number, collaborator: {
    name?: string;
    basePct?: number | null;
    status?: string;
  }): Promise<Collaborator> {
    return this.fetchApi<Collaborator>(`/collaborators/${id}`, {
      method: 'PUT',
      body: JSON.stringify(collaborator),
    });
  }

  // Eliminar colaborador
  async deleteCollaborator(id: number): Promise<{ success: boolean; message: string }> {
    return this.fetchApi<{ success: boolean; message: string }>(`/collaborators/${id}`, {
      method: 'DELETE',
    });
  }

  // ==========================================
  // MÉTODOS DE CLIENTES
  // ==========================================

  // Obtener todos los clientes
  async getClients(): Promise<any[]> {
    return this.fetchApi<any[]>('/clients');
  }

  // Crear cliente
  async createClient(client: {
    name: string;
    phone: string;
    email?: string;
    notes?: string;
  }): Promise<{ success: boolean; message: string; client: any }> {
    return this.fetchApi<{ success: boolean; message: string; client: any }>('/clients', {
      method: 'POST',
      body: JSON.stringify(client),
    });
  }

  // Actualizar cliente
  async updateClient(id: number, client: {
    name?: string;
    phone?: string;
    email?: string;
    notes?: string;
    status?: string;
  }): Promise<{ success: boolean; message: string; client: any }> {
    return this.fetchApi<{ success: boolean; message: string; client: any }>(`/clients/${id}`, {
      method: 'PUT',
      body: JSON.stringify(client),
    });
  }

  // Eliminar cliente
  async deleteClient(id: number): Promise<{ success: boolean; message: string }> {
    return this.fetchApi<{ success: boolean; message: string }>(`/clients/${id}`, {
      method: 'DELETE',
    });
  }

  // Tasa actual
  async getCurrentRate(): Promise<RateData> {
    return this.fetchApi<RateData>('/rate/current');
  }

  // Historial de tasas
  async getRateHistory(): Promise<RateHistory[]> {
    return this.fetchApi<RateHistory[]>('/rate/history');
  }

  // Actualizar tasa
  async updateRate(rate: number): Promise<{ success: boolean; message: string }> {
    return this.fetchApi('/rate/update', {
      method: 'POST',
      body: JSON.stringify({ rate }),
    });
  }

  // Reportes y analíticas
  async getReportsSummary(startDate?: string, endDate?: string): Promise<ReportsSummary> {
    let url = '/reports/summary';
    const params = new URLSearchParams();
    
    if (startDate) {
      params.append('startDate', startDate);
    }
    if (endDate) {
      params.append('endDate', endDate);
    }
    
    if (params.toString()) {
      url += `?${params.toString()}`;
    }
    
    return this.fetchApi<ReportsSummary>(url);
  }

  // Actividad reciente
  async getRecentActivity(): Promise<RecentActivity[]> {
    return this.fetchApi<RecentActivity[]>('/activity/recent');
  }

  // Logs del sistema
  async getSystemLogs(): Promise<any[]> {
    return this.fetchApi<any[]>('/logs');
  }

  // Health check
  async healthCheck(): Promise<{ status: string; timestamp: string; database: string }> {
    try {
      console.log('🏥 Making health check request...');
      const healthUrl = window.location.hostname === 'localhost' 
        ? 'http://localhost:3001/health'
        : '/health';
      const response = await fetch(healthUrl, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });
      
      console.log('🏥 Health check response status:', response.status);
      
      if (!response.ok) {
        throw new Error(`Health check failed with status: ${response.status}`);
      }
      
      const data = await response.json();
      console.log('🏥 Health check data:', data);
      return data;
    } catch (error) {
      console.error('🏥 Health check failed:', error);
      return { status: 'ERROR', timestamp: new Date().toISOString(), database: 'Disconnected' };
    }
  }

  // Database Format (CRITICAL OPERATION)
  async formatDatabase(confirmationCode: string, userConfirmation: string): Promise<{
    success: boolean;
    message: string;
    details: {
      transactionsDeleted: boolean;
      clientsDeleted: boolean;
      collaboratorsProtected: string[];
      rateReset: boolean;
      backupCreated: {
        backupId: string;
        timestamp: string;
        totalRecords: number;
        fileSize: number;
      } | null;
      timestamp: string;
    };
  }> {
    try {
      const response = await this.fetchApi<{
        success: boolean;
        message: string;
        details: {
          transactionsDeleted: boolean;
          clientsDeleted: boolean;
          collaboratorsProtected: string[];
          rateReset: boolean;
          backupCreated: {
            backupId: string;
            timestamp: string;
            totalRecords: number;
            fileSize: number;
          } | null;
          timestamp: string;
        };
      }>('/database/format', {
        method: 'POST',
        body: JSON.stringify({ 
          confirmationCode, 
          userConfirmation 
        })
      });
      
      return response;
    } catch (error) {
      console.error('Database format failed:', error);
      throw error;
    }
  }

  // Backup Management
  async createBackup(description?: string): Promise<{
    success: boolean;
    message: string;
    backup: {
      id: string;
      timestamp: string;
      totalRecords: number;
      fileSize: number;
      filePath: string;
    };
  }> {
    try {
      const response = await this.fetchApi<{
        success: boolean;
        message: string;
        backup: {
          id: string;
          timestamp: string;
          totalRecords: number;
          fileSize: number;
          filePath: string;
        };
      }>('/backups/create', {
        method: 'POST',
        body: JSON.stringify({ description })
      });
      
      return response;
    } catch (error) {
      console.error('Create backup failed:', error);
      throw error;
    }
  }

  async listBackups(): Promise<{
    success: boolean;
    backups: Array<{
      id: string;
      type: string;
      description: string;
      createdAt: string;
      createdBy: string;
      totalRecords: number;
      fileSize: number;
      status: string;
      tablesIncluded: string[];
    }>;
  }> {
    try {
      const response = await this.fetchApi<{
        success: boolean;
        backups: Array<{
          id: string;
          type: string;
          description: string;
          createdAt: string;
          createdBy: string;
          totalRecords: number;
          fileSize: number;
          status: string;
          tablesIncluded: string[];
        }>;
      }>('/backups');
      
      return response;
    } catch (error) {
      console.error('List backups failed:', error);
      throw error;
    }
  }

  async restoreBackup(backupId: string, confirmationCode: string): Promise<{
    success: boolean;
    message: string;
    restoration: {
      backupId: string;
      timestamp: string;
      results: Record<string, any>;
    };
  }> {
    try {
      console.log('🔄 Restaurando backup:', backupId, 'con código:', confirmationCode);
      const response = await this.fetchApi<{
        success: boolean;
        message: string;
        restoration: {
          backupId: string;
          timestamp: string;
          results: Record<string, any>;
        };
      }>(`/backups/${backupId}/restore`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.getStoredToken()}`
        },
        body: JSON.stringify({ confirmationCode })
      });
      
      return response;
    } catch (error) {
      console.error('Restore backup failed:', error);
      throw error;
    }
  }

  async verifyBackup(backupId: string): Promise<{
    success: boolean;
    verification: {
      valid: boolean;
      error?: string;
      metadata?: any;
      tables?: string[];
    };
  }> {
    try {
      const response = await this.fetchApi<{
        success: boolean;
        verification: {
          valid: boolean;
          error?: string;
          metadata?: any;
          tables?: string[];
        };
      }>(`/backups/${backupId}/verify`);
      
      return response;
    } catch (error) {
      console.error('Verify backup failed:', error);
      throw error;
    }
  }

  async deleteBackup(backupId: string): Promise<{
    success: boolean;
    message: string;
    backupId: string;
  }> {
    try {
      const response = await this.fetchApi<{
        success: boolean;
        message: string;
        backupId: string;
      }>(`/backups/${backupId}`, {
        method: 'DELETE'
      });
      
      return response;
    } catch (error) {
      console.error('Delete backup failed:', error);
      throw error;
    }
  }

  async downloadBackup(backupId: string): Promise<any> {
    try {
      const response = await fetch(`${API_BASE_URL}/backups/${backupId}/download`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${this.getStoredToken()}`
        }
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Error descargando backup');
      }

      const backupData = await response.json();
      
      // Crear y descargar el archivo
      const blob = new Blob([JSON.stringify(backupData, null, 2)], {
        type: 'application/json'
      });
      
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `backup_${backupId}_${new Date().toISOString().split('T')[0]}.json`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);

      return {
        success: true,
        message: 'Backup descargado exitosamente',
        filename: link.download
      };
    } catch (error) {
      console.error('Download backup failed:', error);
      throw error;
    }
  }

  async importBackup(file: File, description?: string): Promise<{
    success: boolean;
    message: string;
    backup: {
      id: string;
      type: string;
      description: string;
      totalRecords: number;
      fileSize: number;
      tablesIncluded: string[];
      createdAt: string;
      createdBy: string;
    };
  }> {
    try {
      const formData = new FormData();
      formData.append('backupFile', file);
      if (description) {
        formData.append('description', description);
      }

      const response = await fetch(`${API_BASE_URL}/backups/import`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.getStoredToken()}`
        },
        body: formData
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Error importando backup');
      }

      return await response.json();
    } catch (error) {
      console.error('Import backup failed:', error);
      throw error;
    }
  }

  async getBackupConfigurations(): Promise<{
    success: boolean;
    configurations: Array<{
      id: number;
      name: string;
      enabled: boolean;
      schedule_type: string;
      schedule_time: string;
      schedule_days?: number[];
      schedule_date?: number;
      retention_days: number;
      max_backups: number;
      description: string;
      notification_enabled: boolean;
      notification_emails: string[];
      last_run_at?: string;
      next_run_at?: string;
    }>;
  }> {
    try {
      const response = await this.fetchApi<{
        success: boolean;
        configurations: Array<{
          id: number;
          name: string;
          enabled: boolean;
          schedule_type: string;
          schedule_time: string;
          schedule_days?: number[];
          schedule_date?: number;
          retention_days: number;
          max_backups: number;
          description: string;
          notification_enabled: boolean;
          notification_emails: string[];
          last_run_at?: string;
          next_run_at?: string;
        }>;
      }>('/backups/configurations');
      
      return response;
    } catch (error) {
      console.error('Get backup configurations failed:', error);
      throw error;
    }
  }

  async updateBackupConfiguration(configId: number, config: {
    enabled?: boolean;
    schedule_type?: string;
    schedule_time?: string;
    schedule_days?: number[];
    schedule_date?: number;
    retention_days?: number;
    max_backups?: number;
    description?: string;
    notification_enabled?: boolean;
    notification_emails?: string[];
  }): Promise<{
    success: boolean;
    message: string;
    configuration: any;
  }> {
    try {
      const response = await this.fetchApi<{
        success: boolean;
        message: string;
        configuration: any;
      }>(`/backups/configurations/${configId}`, {
        method: 'PUT',
        body: JSON.stringify(config)
      });
      
      return response;
    } catch (error) {
      console.error('Update backup configuration failed:', error);
      throw error;
    }
  }

  async cleanupOldBackups(): Promise<{
    success: boolean;
    message: string;
  }> {
    try {
      const response = await this.fetchApi<{
        success: boolean;
        message: string;
      }>('/backups/cleanup', {
        method: 'POST'
      });
      
      return response;
    } catch (error) {
      console.error('Cleanup backups failed:', error);
      throw error;
    }
  }

  async createBackupConfiguration(config: CreateBackupConfigRequest): Promise<{
    success: boolean;
    message: string;
    configuration: BackupConfiguration;
  }> {
    try {
      const response = await this.fetchApi<{
        success: boolean;
        message: string;
        configuration: BackupConfiguration;
      }>('/backups/configurations', {
        method: 'POST',
        body: JSON.stringify(config)
      });
      
      return response;
    } catch (error) {
      console.error('Create backup configuration failed:', error);
      throw error;
    }
  }

  async deleteBackupConfiguration(configId: number): Promise<{
    success: boolean;
    message: string;
  }> {
    try {
      const response = await this.fetchApi<{
        success: boolean;
        message: string;
      }>(`/backups/configurations/${configId}`, {
        method: 'DELETE'
      });
      
      return response;
    } catch (error) {
      console.error('Delete backup configuration failed:', error);
      throw error;
    }
  }

  async getDatabaseInfo(): Promise<{
    success: boolean;
    database: DatabaseInfo;
  }> {
    try {
      const response = await this.fetchApi<{
        success: boolean;
        database: DatabaseInfo;
      }>('/database/info', {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${this.getStoredToken()}`
        }
      });
      
      return response;
    } catch (error) {
      console.error('Get database info failed:', error);
      throw error;
    }
  }

  async testDatabaseConnection(): Promise<{
    success: boolean;
    message: string;
    connection: {
      status: string;
      responseTime: number;
      timestamp: string;
    };
  }> {
    try {
      const response = await this.fetchApi<{
        success: boolean;
        message: string;
        connection: {
          status: string;
          responseTime: number;
          timestamp: string;
        };
      }>('/database/test-connection', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.getStoredToken()}`
        }
      });
      
      return response;
    } catch (error) {
      console.error('Test database connection failed:', error);
      throw error;
    }
  }

  // ==========================================
  // MÉTODOS DE AUTENTICACIÓN
  // ==========================================

  // Login
  async login(username: string, password: string): Promise<LoginResponse> {
    const response = await this.fetchApi<LoginResponse>('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ username, password }),
    });
    
    // Guardar tokens
    if (response.success && response.accessToken) {
      this.setStoredToken(response.accessToken);
      localStorage.setItem('refreshToken', response.refreshToken);
      localStorage.setItem('user', JSON.stringify(response.user));
    }
    
    return response;
  }
  
  private async tryRefreshToken(): Promise<boolean> {
    try {
      const refreshToken = localStorage.getItem('refreshToken');
      if (!refreshToken) {
        return false;
      }
      
      const response = await fetch(`${API_BASE_URL}/auth/refresh`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ refreshToken }),
      });
      
      if (response.ok) {
        const data = await response.json();
        if (data.success && data.accessToken) {
          this.setStoredToken(data.accessToken);
          if (data.refreshToken) {
            localStorage.setItem('refreshToken', data.refreshToken);
          }
          return true;
        }
      }
      
      return false;
    } catch (error) {
      console.error('Error refreshing token:', error);
      return false;
    }
  }

  // Verificar token
  async verifyToken(): Promise<{ valid: boolean; user: AuthUser }> {
    const token = this.getStoredToken();
    if (!token) {
      throw new Error('No token found');
    }
    
    return this.fetchApi<{ valid: boolean; user: AuthUser }>('/auth/verify', {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });
  }

  // Logout
  async logout(): Promise<{ success: boolean; message: string }> {
    const token = this.getStoredToken();
    if (!token) {
      return { success: true, message: 'No hay sesión activa' };
    }

    try {
      const refreshToken = localStorage.getItem('refreshToken');
      const result = await this.fetchApi<{ success: boolean; message: string }>('/auth/logout', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ refreshToken })
      });
      
      // Limpiar tokens del localStorage
      this.clearStoredToken();
      localStorage.removeItem('user');
      localStorage.removeItem('refreshToken');
      
      return result;
    } catch (error) {
      // Limpiar tokens incluso si hay error
      this.clearStoredToken();
      localStorage.removeItem('user');
      localStorage.removeItem('refreshToken');
      throw error;
    }
  }

  // Obtener información del usuario actual
  async getCurrentUser(): Promise<{ user: AuthUser }> {
    const token = this.getStoredToken();
    if (!token) {
      throw new Error('No token found');
    }
    
    return this.fetchApi<{ user: AuthUser }>('/auth/me', {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });
  }

  // ==========================================
  // User Management Methods
  // ==========================================

  async getUsers(): Promise<{ success: boolean; users: SystemUser[] }> {
    const response = await this.fetchApi<{ success: boolean; users: SystemUser[] }>('/users', {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${this.getStoredToken()}`
      }
    });
    
    return response;
  }

  async createUser(userData: CreateUserRequest): Promise<{ success: boolean; user: SystemUser; message: string }> {
    const response = await this.fetchApi<{ success: boolean; user: SystemUser; message: string }>('/users', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${this.getStoredToken()}`
      },
      body: JSON.stringify(userData)
    });
    
    return response;
  }

  async updateUser(userId: number, userData: UpdateUserRequest): Promise<{ success: boolean; user: SystemUser; message: string }> {
    try {
      const response = await this.fetchApi<{ success: boolean; user: SystemUser; message: string }>(`/users/${userId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.getStoredToken()}`
        },
        body: JSON.stringify(userData)
      });
      
      return response;
    } catch (error) {
      console.error('Error actualizando usuario:', error);
      throw error;
    }
  }

  // ==========================================
  // CONFIGURACIÓN DEL SISTEMA
  // ==========================================

  async getGeneralSettings(): Promise<{ success: boolean; settings: GeneralSettings }> {
    try {
      const response = await this.fetchApi<{ success: boolean; settings: GeneralSettings }>('/settings/general', {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${this.getStoredToken()}`
        }
      });
      
      return response;
    } catch (error) {
      console.error('Error obteniendo configuración general:', error);
      throw error;
    }
  }

  async updateGeneralSettings(settings: GeneralSettings): Promise<{ success: boolean; message: string; settings: GeneralSettings }> {
    try {
      const response = await this.fetchApi<{ success: boolean; message: string; settings: GeneralSettings }>('/settings/general', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.getStoredToken()}`
        },
        body: JSON.stringify(settings)
      });
      
      return response;
    } catch (error) {
      console.error('Error actualizando configuración general:', error);
      throw error;
    }
  }

  async getSecuritySettings(): Promise<{ success: boolean; settings: SecuritySettings }> {
    try {
      const response = await this.fetchApi<{ success: boolean; settings: SecuritySettings }>('/settings/security', {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${this.getStoredToken()}`
        }
      });
      
      return response;
    } catch (error) {
      console.error('Error obteniendo configuración de seguridad:', error);
      throw error;
    }
  }

  async updateSecuritySettings(settings: SecuritySettings): Promise<{ success: boolean; message: string; settings: SecuritySettings }> {
    try {
      const response = await this.fetchApi<{ success: boolean; message: string; settings: SecuritySettings }>('/settings/security', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.getStoredToken()}`
        },
        body: JSON.stringify(settings)
      });
      
      return response;
    } catch (error) {
      console.error('Error actualizando configuración de seguridad:', error);
      throw error;
    }
  }

  async getUserById(userId: number): Promise<{ success: boolean; user: SystemUser }> {
    try {
      const response = await this.fetchApi<{ success: boolean; user: SystemUser }>(`/users/${userId}`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${this.getStoredToken()}`
        }
      });
      
      return response;
    } catch (error) {
      console.error('Error obteniendo usuario:', error);
      throw error;
    }
  }

  async deleteUser(userId: number): Promise<{ success: boolean; user: SystemUser; message: string }> {
    try {
      const response = await this.fetchApi<{ success: boolean; user: SystemUser; message: string }>(`/users/${userId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${this.getStoredToken()}`
        }
      });
      
      return response;
    } catch (error) {
      console.error('Error eliminando usuario:', error);
      throw error;
    }
  }

  // ==========================================
  // UTILIDADES DE TOKEN
  // ==========================================

  // Obtener token del localStorage
  getStoredToken(): string | null {
    return localStorage.getItem('authToken');
  }

  // Guardar token en localStorage
  setStoredToken(token: string): void {
    localStorage.setItem('authToken', token);
  }

  // Limpiar token del localStorage
  clearStoredToken(): void {
    localStorage.removeItem('authToken');
    localStorage.removeItem('refreshToken');
    localStorage.removeItem('user');
  }

  // Verificar si hay token válido
  hasValidToken(): boolean {
    const token = this.getStoredToken();
    if (!token) return false;
    
    try {
      // Verificar si el token no está expirado (básico)
      const payload = JSON.parse(atob(token.split('.')[1]));
      const now = Date.now() / 1000;
      return payload.exp > now;
    } catch {
      return false;
    }
  }

  // Obtener datos del usuario del localStorage
  getStoredUser(): AuthUser | null {
    const userData = localStorage.getItem('user');
    if (!userData) return null;
    
    try {
      return JSON.parse(userData);
    } catch {
      return null;
    }
  }

  // ==========================================
  // OVERRIDE DEL MÉTODO FETCHAPI PARA INCLUIR TOKEN
  // ==========================================

  // Función fetchApiWithAuth eliminada por no estar en uso
}

// Instancia singleton del servicio API
export const apiService = new ApiService();

// Hook personalizado para usar con React
export const useApi = () => {
  return {
    getDashboardMetrics: () => apiService.getDashboardMetrics(),
    getTransactions: (params?: Parameters<typeof apiService.getTransactions>[0]) => apiService.getTransactions(params),
    getCollaborators: () => apiService.getCollaborators(),
    getCurrentRate: () => apiService.getCurrentRate(),
    getRateHistory: () => apiService.getRateHistory(),
    updateRate: (rate: number) => apiService.updateRate(rate),
    getReportsSummary: () => apiService.getReportsSummary(),
    getRecentActivity: () => apiService.getRecentActivity(),
    healthCheck: () => apiService.healthCheck(),
  };
};

// Utilidades para manejo de errores
export const handleApiError = (error: any) => {
  if (error instanceof Error) {
    console.error('API Error:', error.message);
    return error.message;
  }
  console.error('Unknown API Error:', error);
  return 'Error desconocido en la API';
};

// Función para verificar si el backend está disponible
export const checkBackendHealth = async (): Promise<boolean> => {
  try {
    console.log('🏥 Checking backend health...');
    const health = await apiService.healthCheck();
    console.log('🏥 Health response:', health);
    const isHealthy = health.status === 'OK';
    console.log('🏥 Is healthy:', isHealthy);
    return isHealthy;
  } catch (error) {
    console.error('🏥 Health check failed:', error);
    return false;
  }
};
