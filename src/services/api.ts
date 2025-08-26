// API Service para conectar con el backend de Casa de Cambios

const API_BASE_URL = 'http://localhost:3001/api';

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
  token: string;
  user: AuthUser;
  expiresIn: string;
}

export interface AuthError {
  error: string;
  code: string;
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

// Clase para manejar las llamadas a la API
class ApiService {
  private async fetchApi<T>(endpoint: string, options?: RequestInit): Promise<T> {
    try {
      const url = `${API_BASE_URL}${endpoint}`;
      console.log('🌐 Fetching URL:', url);
      
      const response = await fetch(url, {
        headers: {
          'Content-Type': 'application/json',
          ...options?.headers,
        },
        ...options,
      });

      console.log('📡 Response status:', response.status, response.statusText);
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      console.log('📦 Response data:', data);
      return data;
    } catch (error) {
      console.error('❌ API Error:', error);
      throw error;
    }
  }

  // Dashboard Metrics
  async getDashboardMetrics(): Promise<DashboardMetrics> {
    return this.fetchApi<DashboardMetrics>('/dashboard/metrics');
  }

  // Transacciones
  async getTransactions(): Promise<Transaction[]> {
    return this.fetchApi<Transaction[]>('/transactions');
  }

  // Colaboradores
  async getCollaborators(): Promise<Collaborator[]> {
    return this.fetchApi<Collaborator[]>('/collaborators');
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
  async getReportsSummary(): Promise<ReportsSummary> {
    return this.fetchApi<ReportsSummary>('/reports/summary');
  }

  // Actividad reciente
  async getRecentActivity(): Promise<RecentActivity[]> {
    return this.fetchApi<RecentActivity[]>('/activity/recent');
  }

  // Health check
  async healthCheck(): Promise<{ status: string; timestamp: string; database: string }> {
    return fetch('http://localhost:3001/health')
      .then(res => res.json())
      .catch(error => {
        console.error('Health check failed:', error);
        return { status: 'ERROR', timestamp: new Date().toISOString(), database: 'Disconnected' };
      });
  }

  // ==========================================
  // MÉTODOS DE AUTENTICACIÓN
  // ==========================================

  // Login
  async login(username: string, password: string): Promise<LoginResponse> {
    return this.fetchApi<LoginResponse>('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ username, password }),
    });
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
      const result = await this.fetchApi<{ success: boolean; message: string }>('/auth/logout', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      // Limpiar token del localStorage
      this.clearStoredToken();
      
      return result;
    } catch (error) {
      // Limpiar token incluso si hay error
      this.clearStoredToken();
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
  // UTILIDADES DE TOKEN
  // ==========================================

  // Obtener token del localStorage
  getStoredToken(): string | null {
    return localStorage.getItem('auth_token');
  }

  // Guardar token en localStorage
  setStoredToken(token: string): void {
    localStorage.setItem('auth_token', token);
  }

  // Limpiar token del localStorage
  clearStoredToken(): void {
    localStorage.removeItem('auth_token');
    localStorage.removeItem('user_data');
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
    const userData = localStorage.getItem('user_data');
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

  private async fetchApiWithAuth<T>(endpoint: string, options?: RequestInit): Promise<T> {
    const token = this.getStoredToken();
    
    const authOptions = {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        ...(token && { 'Authorization': `Bearer ${token}` }),
        ...options?.headers,
      },
    };

    try {
      const response = await fetch(`${API_BASE_URL}${endpoint}`, authOptions);

      if (response.status === 401) {
        // Token expirado o inválido
        this.clearStoredToken();
        throw new Error('Sesión expirada. Por favor inicie sesión nuevamente.');
      }

      if (!response.ok) {
        throw new Error(`API Error: ${response.status} ${response.statusText}`);
      }

      return await response.json();
    } catch (error) {
      console.error(`Error fetching ${endpoint}:`, error);
      throw error;
    }
  }
}

// Instancia singleton del servicio API
export const apiService = new ApiService();

// Hook personalizado para usar con React
export const useApi = () => {
  return {
    getDashboardMetrics: () => apiService.getDashboardMetrics(),
    getTransactions: () => apiService.getTransactions(),
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
    const health = await apiService.healthCheck();
    return health.status === 'OK';
  } catch {
    return false;
  }
};