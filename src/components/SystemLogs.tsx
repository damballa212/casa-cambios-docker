import React, { useState, useEffect } from 'react';
import { Database, RefreshCw, AlertTriangle, CheckCircle, Info, XCircle, Clock, Filter, Search, Download } from 'lucide-react';
import { apiService } from '../services/api';

interface LogEntry {
  id: number;
  timestamp: string;
  level: string;
  component: string;
  message: string;
  details?: any;
}

const SystemLogs: React.FC = () => {
  const [logLevel, setLogLevel] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [autoRefresh, setAutoRefresh] = useState(true);
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Cargar logs desde el API
  useEffect(() => {
    const fetchLogs = async () => {
      try {
        setLoading(true);
        const data = await apiService.getSystemLogs();
        setLogs(data);
        setError(null);
      } catch (err) {
        console.error('Error fetching logs:', err);
        setError('Error al cargar los logs del sistema');
        setLogs([]);
      } finally {
        setLoading(false);
      }
    };

    fetchLogs();
    
    // Auto-refresh cada 30 segundos si está habilitado
    let interval: number;
    if (autoRefresh) {
      interval = setInterval(fetchLogs, 30000);
    }
    
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [autoRefresh]);

  // Función para refrescar manualmente
  const handleRefresh = () => {
    const fetchLogs = async () => {
      try {
        const data = await apiService.getSystemLogs();
        setLogs(data);
        setError(null);
      } catch (err) {
        console.error('Error fetching logs:', err);
        setError('Error al cargar los logs del sistema');
      }
    };
    fetchLogs();
  };


  const getLogIcon = (level: string) => {
    switch (level) {
      case 'success':
        return <CheckCircle className="w-4 h-4 text-green-500" />;
      case 'error':
        return <XCircle className="w-4 h-4 text-red-500" />;
      case 'warning':
        return <AlertTriangle className="w-4 h-4 text-yellow-500" />;
      case 'info':
      default:
        return <Clock className="w-4 h-4 text-blue-500" />;
    }
  };

  const getLogColor = (level: string) => {
    switch (level) {
      case 'success':
        return 'border-l-green-500 bg-green-50/70';
      case 'error':
        return 'border-l-red-500 bg-red-50/70';
      case 'warning':
        return 'border-l-yellow-500 bg-yellow-50/70';
      case 'info':
      default:
        return 'border-l-blue-500 bg-blue-50/70';
    }
  };

  const filteredLogs = logs.filter(log => {
    const matchesLevel = logLevel === 'all' || log.level === logLevel;
    const matchesSearch = log.message.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         log.component.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesLevel && matchesSearch;
  });

  const logStats = {
    total: logs.length,
    success: logs.filter(l => l.level === 'success').length,
    error: logs.filter(l => l.level === 'error').length,
    warning: logs.filter(l => l.level === 'warning').length,
    info: logs.filter(l => l.level === 'info').length
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold text-gray-900">Logs del Sistema</h1>
        <div className="flex items-center space-x-4">
          <label className="flex items-center space-x-2">
            <input
              type="checkbox"
              checked={autoRefresh}
              onChange={(e) => setAutoRefresh(e.target.checked)}
              className="rounded focus:ring-blue-500"
            />
            <span className="text-sm text-gray-600">Auto-refresh</span>
          </label>
          <button 
            onClick={handleRefresh}
            className="flex items-center space-x-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors duration-200"
          >
            <RefreshCw className="w-4 h-4" />
            <span>Actualizar</span>
          </button>
          <button className="flex items-center space-x-2 px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg transition-colors duration-200">
            <Download className="w-4 h-4" />
            <span>Exportar</span>
          </button>
        </div>
      </div>

      {/* Loading State */}
      {loading && (
        <div className="bg-white/70 backdrop-blur-md rounded-2xl border border-gray-200/50 shadow-lg p-8">
          <div className="flex items-center justify-center space-x-3">
            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
            <span className="text-gray-600">Cargando logs del sistema...</span>
          </div>
        </div>
      )}

      {/* Error State */}
      {error && (
        <div className="bg-red-50/70 backdrop-blur-md rounded-2xl border border-red-200/50 shadow-lg p-6">
          <div className="flex items-center space-x-3 text-red-700">
            <XCircle className="w-5 h-5" />
            <span>{error}</span>
          </div>
        </div>
      )}

      {/* Log Statistics */}
      {!loading && !error && (
        <>
          <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
            <div className="bg-white/70 backdrop-blur-md rounded-xl p-4 border border-gray-200/50 shadow-lg">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Total Logs</p>
                  <p className="text-xl font-bold text-gray-900">{logStats.total}</p>
                </div>
                <Database className="w-6 h-6 text-gray-500" />
              </div>
            </div>
            
            <div className="bg-white/70 backdrop-blur-md rounded-xl p-4 border border-gray-200/50 shadow-lg">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Éxito</p>
                  <p className="text-xl font-bold text-green-600">{logStats.success}</p>
                </div>
                <CheckCircle className="w-6 h-6 text-green-500" />
              </div>
            </div>
            
            <div className="bg-white/70 backdrop-blur-md rounded-xl p-4 border border-gray-200/50 shadow-lg">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Errores</p>
                  <p className="text-xl font-bold text-red-600">{logStats.error}</p>
                </div>
                <XCircle className="w-6 h-6 text-red-500" />
              </div>
            </div>
            
            <div className="bg-white/70 backdrop-blur-md rounded-xl p-4 border border-gray-200/50 shadow-lg">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Advertencias</p>
                  <p className="text-xl font-bold text-yellow-600">{logStats.warning}</p>
                </div>
                <AlertTriangle className="w-6 h-6 text-yellow-500" />
              </div>
            </div>
            
            <div className="bg-white/70 backdrop-blur-md rounded-xl p-4 border border-gray-200/50 shadow-lg">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Info</p>
                  <p className="text-xl font-bold text-blue-600">{logStats.info}</p>
                </div>
                <Clock className="w-6 h-6 text-blue-500" />
              </div>
            </div>
          </div>

          {/* Filters */}
          <div className="bg-white/70 backdrop-blur-md rounded-2xl p-6 border border-gray-200/50 shadow-lg">
            <div className="flex flex-col sm:flex-row space-y-4 sm:space-y-0 sm:space-x-4">
              <div className="flex-1 relative">
                <Search className="w-5 h-5 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                <input
                  type="text"
                  placeholder="Buscar en logs..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white/50"
                />
              </div>
              <div className="relative">
                <Filter className="w-5 h-5 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                <select
                  value={logLevel}
                  onChange={(e) => setLogLevel(e.target.value)}
                  className="pl-10 pr-8 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white/50 min-w-[150px]"
                >
                  <option value="all">Todos los niveles</option>
                  <option value="success">Éxito</option>
                  <option value="error">Errores</option>
                  <option value="warning">Advertencias</option>
                  <option value="info">Información</option>
                </select>
              </div>
            </div>
          </div>

          {/* Logs List */}
          <div className="space-y-3">
            {filteredLogs.map((log) => (
              <div key={log.id} className={`border-l-4 rounded-xl p-4 ${getLogColor(log.level)} shadow-lg hover:shadow-xl transition-shadow duration-300`}>
                <div className="flex items-start justify-between">
                  <div className="flex items-start space-x-3 flex-1">
                    {getLogIcon(log.level)}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center space-x-3 mb-2">
                        <span className="text-sm font-medium text-gray-900">{log.component}</span>
                        <span className="text-xs text-gray-500">{log.timestamp}</span>
                        <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                          log.level === 'success' ? 'bg-green-100 text-green-800' :
                          log.level === 'error' ? 'bg-red-100 text-red-800' :
                          log.level === 'warning' ? 'bg-yellow-100 text-yellow-800' :
                          'bg-blue-100 text-blue-800'
                        }`}>
                          {log.level.toUpperCase()}
                        </span>
                      </div>
                      <p className="text-sm text-gray-800 mb-2">{log.message}</p>
                      {log.details && (
                        <div className="text-xs text-gray-600 bg-white/50 p-2 rounded-lg font-mono">
                          <pre>{JSON.stringify(log.details, null, 2)}</pre>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {filteredLogs.length === 0 && (
            <div className="bg-white/70 backdrop-blur-md rounded-2xl p-12 border border-gray-200/50 shadow-lg text-center">
              <Database className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No se encontraron logs</h3>
              <p className="text-gray-600">No hay logs que coincidan con los filtros seleccionados</p>
            </div>
          )}

          {/* System Health Status */}
          <div className="bg-white/70 backdrop-blur-md rounded-2xl p-6 border border-gray-200/50 shadow-lg">
            <h2 className="text-xl font-bold text-gray-900 mb-6 flex items-center">
              <Database className="w-5 h-5 mr-2" />
              Estado de Salud del Sistema
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <h3 className="text-lg font-semibold text-gray-800 mb-4">Componentes Críticos</h3>
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-gray-600">WhatsApp Webhook</span>
                    <div className="flex items-center space-x-2">
                      <CheckCircle className="w-4 h-4 text-green-500" />
                      <span className="text-green-700 text-sm font-medium">Operativo</span>
                    </div>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-gray-600">Base de Datos PostgreSQL</span>
                    <div className="flex items-center space-x-2">
                      <CheckCircle className="w-4 h-4 text-green-500" />
                      <span className="text-green-700 text-sm font-medium">Conectado</span>
                    </div>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-gray-600">AI Information Extractor</span>
                    <div className="flex items-center space-x-2">
                      <CheckCircle className="w-4 h-4 text-green-500" />
                      <span className="text-green-700 text-sm font-medium">Disponible</span>
                    </div>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-gray-600">Google Sheets Sync</span>
                    <div className="flex items-center space-x-2">
                      <AlertTriangle className="w-4 h-4 text-yellow-500" />
                      <span className="text-yellow-700 text-sm font-medium">Intermitente</span>
                    </div>
                  </div>
                </div>
              </div>
              <div>
                <h3 className="text-lg font-semibold text-gray-800 mb-4">Métricas de Performance</h3>
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-gray-600">Tiempo respuesta promedio</span>
                    <span className="text-gray-900 font-medium">2.3s</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-gray-600">Tasa de éxito</span>
                    <span className="text-green-600 font-medium">98.5%</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-gray-600">Memoria utilizada</span>
                    <span className="text-blue-600 font-medium">45%</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-gray-600">CPU promedio</span>
                    <span className="text-orange-600 font-medium">23%</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default SystemLogs;