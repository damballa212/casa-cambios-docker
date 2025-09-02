import { useState, useEffect } from 'react';
import { 
  BarChart3, 
  DollarSign, 
  Users, 
  TrendingUp, 
  Database, 
  Settings,
  RefreshCw,
  Clock,
  UserCheck,
  LogOut,
  Shield,
  Menu,
  X,
  Trash2
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
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

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

  // Función para limpiar caché y forzar recarga
  const clearCacheAndReload = () => {
    console.log('🧹 Limpiando caché del navegador...');
    
    // Limpiar localStorage completamente
    localStorage.clear();
    
    // Limpiar sessionStorage
    sessionStorage.clear();
    
    // Limpiar caché del navegador si está disponible
    if ('caches' in window) {
      caches.keys().then(names => {
        names.forEach(name => {
          caches.delete(name);
        });
      });
    }
    
    // Forzar recarga completa de la página
    window.location.reload();
  };

  useEffect(() => {
    // Verificar autenticación al cargar
    checkAuthStatus();
    
    // Escuchar eventos de expiración de sesión
    const handleSessionExpired = () => {
      console.log('🔒 Sesión expirada - redirigiendo al login');
      setIsAuthenticated(false);
      setCurrentUser(null);
      apiService.clearStoredToken();
    };
    
    window.addEventListener('auth:session-expired', handleSessionExpired);
    
    // Verificar conexión del backend independientemente de la autenticación
    const checkBackendConnection = async () => {
      try {
        const isHealthy = await checkBackendHealth();
        console.log('🏥 Initial backend health check result:', isHealthy);
        setBackendConnected(isHealthy);
      } catch (error) {
        console.error('Error checking backend connection:', error);
        setBackendConnected(false);
      }
    };
    
    checkBackendConnection();
    
    return () => {
      window.removeEventListener('auth:session-expired', handleSessionExpired);
    };
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
        <div className="px-4 sm:px-6 py-4">
          <div className="flex items-center justify-between">
            {/* Mobile menu button */}
            <div className="flex items-center space-x-4">
              <button
                onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                className="lg:hidden p-2 rounded-lg text-gray-600 hover:bg-gray-100 transition-colors"
              >
                {isMobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
              </button>
              
              <div className="flex items-center space-x-3">
                <div className="w-8 h-8 sm:w-10 sm:h-10 bg-gradient-to-r from-blue-600 to-purple-600 rounded-xl flex items-center justify-center">
                  <DollarSign className="w-4 h-4 sm:w-6 sm:h-6 text-white" />
                </div>
                <div>
                  <h1 className="text-lg sm:text-2xl font-bold text-gray-900">Casa de Cambios</h1>
                  <p className="hidden sm:block text-sm text-gray-600">
                    Panel de Control TikTok Producción {backendConnected ? '(Conectado a Supabase)' : '(Modo Offline)'}
                  </p>
                </div>
              </div>
            </div>
            
            <div className="flex items-center space-x-2 sm:space-x-4">
              {/* Información del usuario - Responsive */}
              {currentUser && (
                <div className="hidden sm:flex items-center space-x-3 px-3 py-2 bg-white/50 rounded-lg border border-gray-200/50">
                  <div className="w-8 h-8 bg-gradient-to-r from-green-500 to-green-600 rounded-full flex items-center justify-center">
                    <Shield className="w-4 h-4 text-white" />
                  </div>
                  <div className="text-sm">
                    <p className="font-medium text-gray-900">{currentUser.username}</p>
                    <p className="text-xs text-gray-600 capitalize">{currentUser.role}</p>
                  </div>
                </div>
              )}
              
              {/* Último update - Solo desktop */}
              <div className="hidden xl:flex items-center space-x-2 text-sm text-gray-600">
                <Clock className="w-4 h-4" />
                <span>Último update: {lastUpdate.toLocaleTimeString()}</span>
              </div>
              
              {/* Status indicators - Responsive */}
              <div className="flex items-center space-x-2">
                <div className={`w-3 h-3 rounded-full ${
                  realTimeData.systemStatus === 'online' ? 'bg-green-500' : 
                  realTimeData.systemStatus === 'connecting' ? 'bg-yellow-500' :
                  'bg-red-500'
                } animate-pulse`}></div>
                <span className="hidden md:block text-sm font-medium text-gray-700">
                  {realTimeData.systemStatus === 'online' ? 'Sistema Online' : 
                   realTimeData.systemStatus === 'connecting' ? 'Conectando...' :
                   'Sistema Offline'}
                </span>
              </div>
              
              <div className="hidden lg:flex items-center space-x-2">
                <Database className={`w-4 h-4 ${backendConnected ? 'text-green-500' : 'text-red-500'}`} />
                <span className="text-xs text-gray-600">
                  {backendConnected ? 'BD Conectada' : 'BD Desconectada'}
                </span>
              </div>
              
              {/* Action buttons - Responsive */}
              <button
                onClick={refreshData}
                disabled={isLoading}
                className="flex items-center space-x-1 sm:space-x-2 px-2 sm:px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white rounded-lg transition-colors duration-200"
              >
                <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
                <span className="hidden sm:block">Actualizar</span>
              </button>
              
              <button
                onClick={clearCacheAndReload}
                className="flex items-center px-2 py-2 bg-gray-500 hover:bg-gray-600 text-white rounded-md transition-colors duration-200 text-xs"
                title="Limpiar caché y recargar - Útil si no ves los cambios más recientes"
              >
                <Trash2 className="w-3 h-3" />
              </button>
              
              <button
                onClick={handleLogout}
                className="flex items-center space-x-1 sm:space-x-2 px-2 sm:px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors duration-200"
                title="Cerrar sesión"
              >
                <LogOut className="w-4 h-4" />
                <span className="hidden sm:block">Salir</span>
              </button>
            </div>
          </div>
        </div>
      </header>

      <div className="flex relative">
        {/* Mobile Menu Overlay */}
        {isMobileMenuOpen && (
          <div 
            className="fixed inset-0 bg-black/50 backdrop-blur-sm z-40 lg:hidden"
            onClick={() => setIsMobileMenuOpen(false)}
          />
        )}

        {/* Sidebar - Desktop */}
        <aside className="hidden lg:block w-64 bg-white/80 backdrop-blur-md border-r border-gray-200/50 min-h-[calc(100vh-80px)] p-4">
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

        {/* Mobile Sidebar */}
        <aside className={`fixed top-[80px] left-0 w-64 h-[calc(100vh-80px)] bg-white/95 backdrop-blur-md border-r border-gray-200/50 p-4 transform transition-transform duration-300 ease-in-out z-50 lg:hidden ${
          isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full'
        }`}>
          <nav className="space-y-2">
            {tabs.map((tab) => {
              const Icon = tab.icon;
              const isActive = activeTab === tab.id;
              
              return (
                <button
                  key={tab.id}
                  onClick={() => {
                    setActiveTab(tab.id);
                    setIsMobileMenuOpen(false);
                  }}
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
          
          {/* Mobile User Info */}
          {currentUser && (
            <div className="mt-6 p-4 bg-white/50 rounded-lg border border-gray-200/50">
              <div className="flex items-center space-x-3">
                <div className="w-8 h-8 bg-gradient-to-r from-green-500 to-green-600 rounded-full flex items-center justify-center">
                  <Shield className="w-4 h-4 text-white" />
                </div>
                <div className="text-sm">
                  <p className="font-medium text-gray-900">{currentUser.username}</p>
                  <p className="text-xs text-gray-600 capitalize">{currentUser.role}</p>
                </div>
              </div>
            </div>
          )}
        </aside>

        {/* Main Content */}
        <main className="flex-1 p-4 sm:p-6 lg:ml-0">
          <div className="max-w-7xl mx-auto">
            {renderActiveComponent()}
          </div>
        </main>
      </div>
    </div>
  );
}

export default App;