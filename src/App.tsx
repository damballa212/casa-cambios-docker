import React, { useState, useEffect } from 'react';
import { 
  BarChart3, 
  DollarSign, 
  Users, 
  AlertTriangle, 
  TrendingUp, 
  MessageSquare, 
  Database, 
  Settings,
  RefreshCw,
  Clock,
  CheckCircle,
  XCircle,
  Eye,
  Filter,
  UserCheck,
  LogOut,
  Shield
} from 'lucide-react';
import DashboardMetrics from './components/DashboardMetrics';
import TransactionsList from './components/TransactionsList';
import RateManager from './components/RateManager';
import CollaboratorManagement from './components/CollaboratorManagement';
import ClientManagement from './components/ClientManagement';
import ReportsAnalytics from './components/ReportsAnalytics';
import SystemLogs from './components/SystemLogs';
import SettingsPanel from './components/SettingsPanel';
import LoginPage from './components/LoginPage';
import { apiService, checkBackendHealth, type DashboardMetrics as DashboardMetricsType, type AuthUser } from './services/api';

function App() {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [isLoading, setIsLoading] = useState(false);
  const [lastUpdate, setLastUpdate] = useState(new Date());

  // Estado de autenticación
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [currentUser, setCurrentUser] = useState<AuthUser | null>(null);
  const [authLoading, setAuthLoading] = useState(true);

  // Datos en tiempo real desde la API
  const [realTimeData, setRealTimeData] = useState<DashboardMetricsType>({
    totalTransactions: 0,
    dailyVolume: 0,
    currentRate: 7300,
    activeCollaborators: 3,
    systemStatus: 'connecting',
    pendingMessages: 0
  });
  const [backendConnected, setBackendConnected] = useState(false);

  // Función para cargar datos desde la API
  const loadDashboardData = async () => {
    try {
      setIsLoading(true);
      
      // Verificar salud del backend
      const isHealthy = await checkBackendHealth();
      console.log('🏥 Backend health check result:', isHealthy);
      setBackendConnected(isHealthy);
      
      if (isHealthy) {
        // Cargar métricas del dashboard
        const metrics = await apiService.getDashboardMetrics();
        setRealTimeData({
          ...metrics,
          systemStatus: 'online'
        });
      } else {
        setRealTimeData(prev => ({
          ...prev,
          systemStatus: 'offline'
        }));
      }
    } catch (error) {
      console.error('Error loading dashboard data:', error);
      setRealTimeData(prev => ({
        ...prev,
        systemStatus: 'error'
      }));
      setBackendConnected(false);
    } finally {
      setIsLoading(false);
      setLastUpdate(new Date());
    }
  };

  // Funciones de autenticación
  const checkAuthStatus = async () => {
    try {
      setAuthLoading(true);
      
      // Verificar si hay token válido
      if (!apiService.hasValidToken()) {
        setIsAuthenticated(false);
        setCurrentUser(null);
        return;
      }

      // Verificar token con el servidor
      const result = await apiService.verifyToken();
      if (result.valid) {
        setIsAuthenticated(true);
        setCurrentUser(result.user);
      } else {
        setIsAuthenticated(false);
        setCurrentUser(null);
        apiService.clearStoredToken();
      }
    } catch (error) {
      console.error('Error verificando autenticación:', error);
      setIsAuthenticated(false);
      setCurrentUser(null);
      apiService.clearStoredToken();
    } finally {
      setAuthLoading(false);
    }
  };

  const handleLogin = (token: string, user: AuthUser) => {
    apiService.setStoredToken(token);
    setIsAuthenticated(true);
    setCurrentUser(user);
    console.log('✅ Usuario autenticado:', user.username, '- Rol:', user.role);
  };

  const handleLogout = async () => {
    try {
      await apiService.logout();
    } catch (error) {
      console.error('Error en logout:', error);
    } finally {
      setIsAuthenticated(false);
      setCurrentUser(null);
      setActiveTab('dashboard'); // Resetear a dashboard
      console.log('👋 Usuario desconectado');
    }
  };

  useEffect(() => {
    // Verificar autenticación al cargar
    checkAuthStatus();
  }, []);

  useEffect(() => {
    // Solo cargar datos si está autenticado
    if (isAuthenticated) {
      loadDashboardData();
      
      // Actualizar datos cada 30 segundos
      const interval = setInterval(() => {
        loadDashboardData();
      }, 30000);

      return () => clearInterval(interval);
    }
  }, [isAuthenticated]);

  const refreshData = async () => {
    await loadDashboardData();
  };

  const tabs = [
    { id: 'dashboard', label: 'Dashboard', icon: BarChart3 },
    { id: 'transactions', label: 'Transacciones', icon: DollarSign },
    { id: 'rates', label: 'Tasas', icon: TrendingUp },
    { id: 'collaborators', label: 'Colaboradores', icon: Users },
    { id: 'clients', label: 'Clientes', icon: UserCheck },
    { id: 'reports', label: 'Reportes', icon: BarChart3 },
    { id: 'logs', label: 'Logs', icon: Database },
    { id: 'settings', label: 'Configuración', icon: Settings }
  ];

  const renderActiveComponent = () => {
    switch (activeTab) {
      case 'dashboard':
        return <DashboardMetrics data={realTimeData} backendConnected={backendConnected} onNavigate={setActiveTab} />;
      case 'transactions':
        return <TransactionsList />;
      case 'rates':
        return <RateManager currentRate={realTimeData.currentRate} onRateUpdate={loadDashboardData} />;
      case 'collaborators':
        return <CollaboratorManagement />;
      case 'clients':
        return <ClientManagement />;
      case 'reports':
        return <ReportsAnalytics />;
      case 'logs':
        return <SystemLogs />;
      case 'settings':
        return <SettingsPanel />;
      default:
        return <DashboardMetrics data={realTimeData} backendConnected={backendConnected} onNavigate={setActiveTab} />;
    }
  };

  // Mostrar loading mientras verifica autenticación
  if (authLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 bg-gradient-to-r from-blue-600 to-purple-600 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <Shield className="w-8 h-8 text-white animate-pulse" />
          </div>
          <h2 className="text-xl font-semibold text-gray-900 mb-2">Verificando autenticación...</h2>
          <p className="text-gray-600">Por favor espere</p>
        </div>
      </div>
    );
  }

  // Mostrar LoginPage si no está autenticado
  if (!isAuthenticated) {
    return <LoginPage onLogin={handleLogin} />;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100">
      {/* Header */}
      <header className="bg-white/80 backdrop-blur-md border-b border-gray-200/50 sticky top-0 z-50">
        <div className="px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 bg-gradient-to-r from-blue-600 to-purple-600 rounded-xl flex items-center justify-center">
                  <DollarSign className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h1 className="text-2xl font-bold text-gray-900">Casa de Cambios</h1>
                  <p className="text-sm text-gray-600">
                    Panel de Control TikTok Producción {backendConnected ? '(Conectado a Supabase)' : '(Modo Offline)'}
                  </p>
                </div>
              </div>
            </div>
            
            <div className="flex items-center space-x-4">
              {/* Información del usuario */}
              {currentUser && (
                <div className="flex items-center space-x-3 px-3 py-2 bg-white/50 rounded-lg border border-gray-200/50">
                  <div className="w-8 h-8 bg-gradient-to-r from-green-500 to-green-600 rounded-full flex items-center justify-center">
                    <Shield className="w-4 h-4 text-white" />
                  </div>
                  <div className="text-sm">
                    <p className="font-medium text-gray-900">{currentUser.username}</p>
                    <p className="text-xs text-gray-600 capitalize">{currentUser.role}</p>
                  </div>
                </div>
              )}
              
              <div className="flex items-center space-x-2 text-sm text-gray-600">
                <Clock className="w-4 h-4" />
                <span>Último update: {lastUpdate.toLocaleTimeString()}</span>
              </div>
              
              <button
                onClick={refreshData}
                disabled={isLoading}
                className="flex items-center space-x-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white rounded-lg transition-colors duration-200"
              >
                <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
                <span>Actualizar</span>
              </button>
              
              <button
                onClick={handleLogout}
                className="flex items-center space-x-2 px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors duration-200"
                title="Cerrar sesión"
              >
                <LogOut className="w-4 h-4" />
                <span>Salir</span>
              </button>
              
              <div className="flex items-center space-x-2">
                <div className={`w-3 h-3 rounded-full ${
                  realTimeData.systemStatus === 'online' ? 'bg-green-500' : 
                  realTimeData.systemStatus === 'connecting' ? 'bg-yellow-500' :
                  'bg-red-500'
                } animate-pulse`}></div>
                <span className="text-sm font-medium text-gray-700">
                  {realTimeData.systemStatus === 'online' ? 'Sistema Online' : 
                   realTimeData.systemStatus === 'connecting' ? 'Conectando...' :
                   'Sistema Offline'}
                </span>
              </div>
              
              <div className="flex items-center space-x-2">
                <Database className={`w-4 h-4 ${backendConnected ? 'text-green-500' : 'text-red-500'}`} />
                <span className="text-xs text-gray-600">
                  {backendConnected ? 'BD Conectada' : 'BD Desconectada'}
                </span>
              </div>
            </div>
          </div>
        </div>
      </header>

      <div className="flex">
        {/* Sidebar */}
        <aside className="w-64 bg-white/80 backdrop-blur-md border-r border-gray-200/50 min-h-[calc(100vh-80px)] p-4">
          <nav className="space-y-2">
            {tabs.map((tab) => {
              const Icon = tab.icon;
              const isActive = activeTab === tab.id;
              
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`w-full flex items-center space-x-3 px-4 py-3 rounded-xl text-left transition-all duration-200 ${
                    isActive
                      ? 'bg-gradient-to-r from-blue-600 to-purple-600 text-white shadow-lg shadow-blue-500/25'
                      : 'text-gray-600 hover:bg-gray-100/70 hover:text-gray-900'
                  }`}
                >
                  <Icon className="w-5 h-5" />
                  <span className="font-medium">{tab.label}</span>
                  {tab.id === 'logs' && realTimeData.pendingMessages > 0 && (
                    <span className="ml-auto bg-red-500 text-white text-xs px-2 py-1 rounded-full">
                      {realTimeData.pendingMessages}
                    </span>
                  )}
                </button>
              );
            })}
          </nav>
        </aside>

        {/* Main Content */}
        <main className="flex-1 p-6">
          <div className="max-w-7xl mx-auto">
            {renderActiveComponent()}
          </div>
        </main>
      </div>
    </div>
  );
}

export default App;