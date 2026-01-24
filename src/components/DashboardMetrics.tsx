import React from 'react';
import { 
  DollarSign, 
  Users, 
  TrendingUp, 
  AlertTriangle,
  CheckCircle,
  XCircle,
  BarChart3
} from 'lucide-react';

interface DashboardMetricsProps {
  data: {
    totalTransactions: number;
    dailyVolume: number;
    currentRate: number;
    activeCollaborators: number;
    systemStatus: string;
    pendingMessages: number;
  };
  backendConnected?: boolean;
  onNavigate?: (tab: string) => void;
}

const DashboardMetrics: React.FC<DashboardMetricsProps> = ({ data, backendConnected = false, onNavigate }) => {
  // Estados de actividades eliminados

  const metrics = [
    {
      title: 'Transacciones Hoy',
      value: data.totalTransactions.toString(),
      change: '0%',
      positive: true,
      icon: DollarSign,
      color: 'from-blue-500 to-blue-600'
    },
    {
      title: 'Volumen Diario USD',
      value: `$${(data.dailyVolume || 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`,
      change: '0%',
      positive: true,
      icon: TrendingUp,
      color: 'from-green-500 to-green-600'
    },
    {
      title: 'Tasa Actual',
      value: `${(data.currentRate || 0).toLocaleString()} Gs`,
      change: '0%',
      positive: true,
      icon: BarChart3,
      color: 'from-purple-500 to-purple-600'
    },
    {
      title: 'Colaboradores Activos',
      value: data.activeCollaborators.toString(),
      change: '0%',
      positive: true,
      icon: Users,
      color: 'from-orange-500 to-orange-600'
    }
  ];

  // Función de actividades eliminada

  // useEffect de actividades eliminado



  return (
    <div className="space-y-4 sm:space-y-6">
      {/* Quick Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
        {metrics.map((metric, index) => {
          const Icon = metric.icon;
          return (
            <div key={index} className="bg-white/70 backdrop-blur-md rounded-2xl p-4 sm:p-6 border border-gray-200/50 shadow-lg hover:shadow-xl transition-shadow duration-300">
              <div className="flex items-center justify-between mb-3 sm:mb-4">
                <div className={`w-10 h-10 sm:w-12 sm:h-12 bg-gradient-to-r ${metric.color} rounded-xl flex items-center justify-center flex-shrink-0`}>
                  <Icon className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
                </div>
                <span className={`text-xs sm:text-sm font-semibold px-2 py-1 rounded-full flex-shrink-0 ${
                  metric.positive ? 'text-green-700 bg-green-100' : 'text-red-700 bg-red-100'
                }`}>
                  {metric.change}
                </span>
              </div>
              <h3 className="text-gray-600 text-xs sm:text-sm font-medium mb-1 truncate">{metric.title}</h3>
              <p className="text-xl sm:text-2xl lg:text-3xl font-bold text-gray-900 truncate">{metric.value}</p>
            </div>
          );
        })}
      </div>

      {/* System Status & Quick Actions */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-4 sm:gap-6">
        <div className="bg-white/70 backdrop-blur-md rounded-2xl p-4 sm:p-6 border border-gray-200/50 shadow-lg">
          <h2 className="text-lg sm:text-xl font-bold text-gray-900 mb-3 sm:mb-4 flex items-center">
            <AlertTriangle className="w-4 h-4 sm:w-5 sm:h-5 mr-2 flex-shrink-0" />
            <span className="truncate">Estado del Sistema</span>
          </h2>
          <div className="space-y-3 sm:space-y-4">
            <div className="flex items-center justify-between gap-2">
              <span className="text-gray-600 text-sm sm:text-base truncate flex-1">WhatsApp Webhook</span>
              <div className="flex items-center space-x-1 sm:space-x-2 flex-shrink-0">
                <CheckCircle className="w-4 h-4 sm:w-5 sm:h-5 text-green-500" />
                <span className="text-green-700 font-medium text-sm sm:text-base">Activo</span>
              </div>
            </div>
            <div className="flex items-center justify-between gap-2">
              <span className="text-gray-600 text-sm sm:text-base truncate flex-1">Base de Datos Supabase</span>
              <div className="flex items-center space-x-1 sm:space-x-2 flex-shrink-0">
                {backendConnected ? (
                  <>
                    <CheckCircle className="w-4 h-4 sm:w-5 sm:h-5 text-green-500" />
                    <span className="text-green-700 font-medium text-sm sm:text-base">Conectado</span>
                  </>
                ) : (
                  <>
                    <XCircle className="w-4 h-4 sm:w-5 sm:h-5 text-red-500" />
                    <span className="text-red-700 font-medium text-sm sm:text-base">Desconectado</span>
                  </>
                )}
              </div>
            </div>
            <div className="flex items-center justify-between gap-2">
              <span className="text-gray-600 text-sm sm:text-base truncate flex-1">API Backend</span>
              <div className="flex items-center space-x-1 sm:space-x-2 flex-shrink-0">
                {backendConnected ? (
                  <>
                    <CheckCircle className="w-4 h-4 sm:w-5 sm:h-5 text-green-500" />
                    <span className="text-green-700 font-medium text-sm sm:text-base">Operativo</span>
                  </>
                ) : (
                  <>
                    <XCircle className="w-4 h-4 sm:w-5 sm:h-5 text-red-500" />
                    <span className="text-red-700 font-medium text-sm sm:text-base">Inactivo</span>
                  </>
                )}
              </div>
            </div>
            <div className="flex items-center justify-between gap-2">
              <span className="text-gray-600 text-sm sm:text-base truncate flex-1">AI Information Extractor</span>
              <div className="flex items-center space-x-1 sm:space-x-2 flex-shrink-0">
                <CheckCircle className="w-4 h-4 sm:w-5 sm:h-5 text-green-500" />
                <span className="text-green-700 font-medium text-sm sm:text-base">Operativo</span>
              </div>
            </div>
          </div>
        </div>

        {/* SECCIÓN DE ACTIVIDADES ELIMINADA COMPLETAMENTE */}
      </div>

      {/* Quick Actions */}
      <div className="bg-white/70 backdrop-blur-md rounded-2xl p-4 sm:p-6 border border-gray-200/50 shadow-lg">
        <h2 className="text-lg sm:text-xl font-bold text-gray-900 mb-3 sm:mb-4">Acciones Rápidas</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
          <button 
            onClick={() => onNavigate?.('rates')}
            className="flex items-center justify-center sm:justify-start space-x-2 sm:space-x-3 p-3 sm:p-4 bg-gradient-to-r from-blue-500 to-blue-600 text-white rounded-xl hover:from-blue-600 hover:to-blue-700 transition-all duration-200 shadow-lg hover:shadow-xl"
          >
            <TrendingUp className="w-4 h-4 sm:w-5 sm:h-5 flex-shrink-0" />
            <span className="font-medium text-sm sm:text-base">Actualizar Tasa</span>
          </button>
          <button 
            onClick={() => onNavigate?.('transactions')}
            className="flex items-center justify-center sm:justify-start space-x-2 sm:space-x-3 p-3 sm:p-4 bg-gradient-to-r from-green-500 to-green-600 text-white rounded-xl hover:from-green-600 hover:to-green-700 transition-all duration-200 shadow-lg hover:shadow-xl"
          >
            <DollarSign className="w-4 h-4 sm:w-5 sm:h-5 flex-shrink-0" />
            <span className="font-medium text-sm sm:text-base">Nueva Transacción</span>
          </button>
          <button 
            onClick={() => onNavigate?.('collaborators')}
            className="flex items-center justify-center sm:justify-start space-x-2 sm:space-x-3 p-3 sm:p-4 bg-gradient-to-r from-purple-500 to-purple-600 text-white rounded-xl hover:from-purple-600 hover:to-purple-700 transition-all duration-200 shadow-lg hover:shadow-xl sm:col-span-2 lg:col-span-1"
          >
            <Users className="w-4 h-4 sm:w-5 sm:h-5 flex-shrink-0" />
            <span className="font-medium text-sm sm:text-base">Gestionar Colaboradores</span>
          </button>
        </div>
      </div>
    </div>
  );
};

export default DashboardMetrics;