import React, { useState, useEffect } from 'react';
import { BarChart3, Download, Calendar, TrendingUp, DollarSign, Users } from 'lucide-react';
import ExportModal, { ExportConfig } from './ExportModal';

interface SummaryData {
  totalTransactions: number;
  totalVolumeUsd: number;
  totalCommissions: number;
  averageTransaction: number;
  topCollaborator: string;
  topClient: string;
  monthlyData: Array<{
    month: string;
    transactions: number;
    volume: number;
    commissions: number;
  }>;
  collaboratorPerformance: Array<{
    name: string;
    transactions: number;
    commissions: number;
    percentage: number;
  }>;
  topClients: Array<{
    name: string;
    transactions: number;
    volume: number;
    commissions: number;
  }>;
  detailedAnalytics: {
    operationalEfficiency: {
      averageProcessTime: string;
      successRate: string;
      errorsPerDay: string;
    };
    financialMetrics: {
      monthlyROI: string;
      averageMargin: string;
      costPerTransaction: string;
    };
    growth: {
      monthlyGrowth: string;
      newClientsPerMonth: string;
      retention: string;
    };
  };
}

const ReportsAnalytics: React.FC = () => {
  const [dateRange, setDateRange] = useState('last30days');
  const [reportType, setReportType] = useState('summary');
  const [summaryData, setSummaryData] = useState<SummaryData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isExportModalOpen, setIsExportModalOpen] = useState(false);

  // Cargar datos de reportes desde el API
  useEffect(() => {
    const fetchReportsData = async () => {
      try {
        setLoading(true);
        const response = await fetch('/api/reports/summary');
        if (!response.ok) {
          throw new Error('Error al cargar datos de reportes');
        }
        const data = await response.json();
        setSummaryData(data);
        setError(null);
      } catch (err) {
        console.error('Error fetching reports data:', err);
        setError('Error al cargar los datos de reportes');
        setSummaryData(null);
      } finally {
        setLoading(false);
      }
    };

    fetchReportsData();
  }, [dateRange]); // Recargar cuando cambie el rango de fechas

  const monthlyData = summaryData?.monthlyData || [];
  const collaboratorPerformance = summaryData?.collaboratorPerformance || [];
  const topClients = summaryData?.topClients || [];

  // Función para manejar la exportación de reportes
  const handleExport = async (config: ExportConfig) => {
    try {
      console.log('Exportando reportes con configuración:', config);
      
      // Simular delay
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      // Aquí iría la lógica real de exportación de reportes
      // Por ejemplo, generar PDF con gráficos, Excel con múltiples hojas, etc.
      
      console.log('Exportación de reportes completada');
    } catch (error) {
      console.error('Error en exportación de reportes:', error);
      throw error;
    }
  };


  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold text-gray-900">Reportes y Analíticas</h1>
        <div className="flex items-center space-x-4">
          <select
            value={dateRange}
            onChange={(e) => setDateRange(e.target.value)}
            className="px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white/50"
          >
            <option value="last7days">Últimos 7 días</option>
            <option value="last30days">Últimos 30 días</option>
            <option value="last90days">Últimos 90 días</option>
            <option value="thisyear">Este año</option>
          </select>
          <button 
            onClick={() => setIsExportModalOpen(true)}
            className="flex items-center space-x-2 px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg transition-colors duration-200"
          >
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
            <span className="text-gray-600">Cargando datos de reportes...</span>
          </div>
        </div>
      )}

      {/* Error State */}
      {error && (
        <div className="bg-red-50/70 backdrop-blur-md rounded-2xl border border-red-200/50 shadow-lg p-6">
          <div className="flex items-center space-x-3 text-red-700">
            <BarChart3 className="w-5 h-5" />
            <span>{error}</span>
          </div>
        </div>
      )}

      {/* Summary Cards */}
      {!loading && !error && summaryData && (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="bg-white/70 backdrop-blur-md rounded-2xl p-6 border border-gray-200/50 shadow-lg">
              <div className="flex items-center justify-between mb-4">
                <div className="w-12 h-12 bg-gradient-to-r from-blue-500 to-blue-600 rounded-xl flex items-center justify-center">
                  <BarChart3 className="w-6 h-6 text-white" />
                </div>
                <span className="text-sm font-semibold px-2 py-1 rounded-full text-green-700 bg-green-100">
                  +12.5%
                </span>
              </div>
              <h3 className="text-gray-600 text-sm font-medium mb-1">Total Transacciones</h3>
              <p className="text-3xl font-bold text-gray-900">{summaryData.totalTransactions}</p>
            </div>

            <div className="bg-white/70 backdrop-blur-md rounded-2xl p-6 border border-gray-200/50 shadow-lg">
              <div className="flex items-center justify-between mb-4">
                <div className="w-12 h-12 bg-gradient-to-r from-green-500 to-green-600 rounded-xl flex items-center justify-center">
                  <DollarSign className="w-6 h-6 text-white" />
                </div>
                <span className="text-sm font-semibold px-2 py-1 rounded-full text-green-700 bg-green-100">
                  +8.3%
                </span>
              </div>
              <h3 className="text-gray-600 text-sm font-medium mb-1">Volumen Total USD</h3>
              <p className="text-3xl font-bold text-gray-900">${summaryData.totalVolumeUsd.toFixed(2)}</p>
            </div>

            <div className="bg-white/70 backdrop-blur-md rounded-2xl p-6 border border-gray-200/50 shadow-lg">
              <div className="flex items-center justify-between mb-4">
                <div className="w-12 h-12 bg-gradient-to-r from-purple-500 to-purple-600 rounded-xl flex items-center justify-center">
                  <TrendingUp className="w-6 h-6 text-white" />
                </div>
                <span className="text-sm font-semibold px-2 py-1 rounded-full text-green-700 bg-green-100">
                  +15.2%
                </span>
              </div>
              <h3 className="text-gray-600 text-sm font-medium mb-1">Total Comisiones</h3>
              <p className="text-3xl font-bold text-gray-900">${summaryData.totalCommissions.toFixed(2)}</p>
            </div>

            <div className="bg-white/70 backdrop-blur-md rounded-2xl p-6 border border-gray-200/50 shadow-lg">
              <div className="flex items-center justify-between mb-4">
                <div className="w-12 h-12 bg-gradient-to-r from-orange-500 to-orange-600 rounded-xl flex items-center justify-center">
                  <Users className="w-6 h-6 text-white" />
                </div>
                <span className="text-sm font-semibold px-2 py-1 rounded-full text-green-700 bg-green-100">
                  +5.7%
                </span>
              </div>
              <h3 className="text-gray-600 text-sm font-medium mb-1">Promedio/Transacción</h3>
              <p className="text-3xl font-bold text-gray-900">${summaryData.averageTransaction.toFixed(0)}</p>
            </div>
          </div>

      {/* Monthly Trends Chart */}
      <div className="bg-white/70 backdrop-blur-md rounded-2xl p-6 border border-gray-200/50 shadow-lg">
        <h2 className="text-xl font-bold text-gray-900 mb-6 flex items-center">
          <TrendingUp className="w-5 h-5 mr-2" />
          Tendencias Mensuales
        </h2>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div>
            <h3 className="text-lg font-semibold text-gray-800 mb-4">Volumen de Transacciones</h3>
            <div className="space-y-3">
              {monthlyData.map((month, index) => (
                <div key={index} className="flex items-center justify-between">
                  <span className="text-sm text-gray-600 w-12">{month.month}</span>
                  <div className="flex-1 mx-4">
                    <div className="bg-gray-200 rounded-full h-2">
                      <div 
                        className="bg-gradient-to-r from-blue-500 to-purple-500 h-2 rounded-full transition-all duration-500"
                        style={{ width: `${(month.transactions / 220) * 100}%` }}
                      ></div>
                    </div>
                  </div>
                  <span className="text-sm font-medium text-gray-900 w-12 text-right">{month.transactions}</span>
                </div>
              ))}
            </div>
          </div>
          <div>
            <h3 className="text-lg font-semibold text-gray-800 mb-4">Volumen USD</h3>
            <div className="space-y-3">
              {monthlyData.map((month, index) => (
                <div key={index} className="flex items-center justify-between">
                  <span className="text-sm text-gray-600 w-12">{month.month}</span>
                  <div className="flex-1 mx-4">
                    <div className="bg-gray-200 rounded-full h-2">
                      <div 
                        className="bg-gradient-to-r from-green-500 to-blue-500 h-2 rounded-full transition-all duration-500"
                        style={{ width: `${(month.volume / 60000) * 100}%` }}
                      ></div>
                    </div>
                  </div>
                  <span className="text-sm font-medium text-gray-900 w-16 text-right">${month.volume.toFixed(2)}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Collaborator Performance */}
        <div className="bg-white/70 backdrop-blur-md rounded-2xl p-6 border border-gray-200/50 shadow-lg">
          <h2 className="text-xl font-bold text-gray-900 mb-6 flex items-center">
            <Users className="w-5 h-5 mr-2" />
            Performance por Colaborador
          </h2>
          <div className="space-y-4">
            {collaboratorPerformance.map((collab, index) => (
              <div key={index} className="p-4 bg-gray-50/70 rounded-xl">
                <div className="flex items-center justify-between mb-3">
                  <span className="font-medium text-gray-900">{collab.name}</span>
                  <span className="text-sm text-gray-600">{collab.percentage.toFixed(2)}%</span>
                </div>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="text-gray-600">Transacciones: </span>
                    <span className="font-medium text-gray-900">{collab.transactions}</span>
                  </div>
                  <div>
                    <span className="text-gray-600">Comisiones: </span>
                    <span className="font-medium text-green-600">${collab.commissions.toFixed(2)}</span>
                  </div>
                </div>
                <div className="mt-2">
                  <div className="bg-gray-200 rounded-full h-2">
                    <div 
                      className={`h-2 rounded-full transition-all duration-500 ${
                        index === 0 ? 'bg-gradient-to-r from-purple-500 to-purple-600' :
                        index === 1 ? 'bg-gradient-to-r from-blue-500 to-blue-600' :
                        'bg-gradient-to-r from-green-500 to-green-600'
                      }`}
                      style={{ width: `${Math.min(collab.percentage, 100)}%` }}
                    ></div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Top Clients */}
        <div className="bg-white/70 backdrop-blur-md rounded-2xl p-6 border border-gray-200/50 shadow-lg">
          <h2 className="text-xl font-bold text-gray-900 mb-6 flex items-center">
            <DollarSign className="w-5 h-5 mr-2" />
            Top Clientes
          </h2>
          <div className="space-y-3">
            {topClients.length > 0 ? topClients.map((client, index) => (
              <div key={index} className="flex items-center justify-between p-3 rounded-xl hover:bg-gray-50/50 transition-colors duration-200">
                <div className="flex items-center space-x-3">
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center text-white text-sm font-semibold ${
                    index === 0 ? 'bg-yellow-500' :
                    index === 1 ? 'bg-gray-400' :
                    index === 2 ? 'bg-orange-500' :
                    'bg-blue-500'
                  }`}>
                    {index + 1}
                  </div>
                  <div>
                    <p className="font-medium text-gray-900">{client.name}</p>
                    <p className="text-xs text-gray-500">{client.transactions} transacciones</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="font-medium text-gray-900">${client.volume.toLocaleString()}</p>
                  <p className="text-xs text-green-600">${client.commissions.toFixed(2)} com.</p>
                </div>
              </div>
            )) : (
              <div className="text-center py-8 text-gray-500">
                <DollarSign className="w-12 h-12 mx-auto mb-2 opacity-50" />
                <p>No hay datos de clientes disponibles</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Detailed Analytics */}
      <div className="bg-white/70 backdrop-blur-md rounded-2xl p-6 border border-gray-200/50 shadow-lg">
        <h2 className="text-xl font-bold text-gray-900 mb-6">Análisis Detallado</h2>
        {summaryData?.detailedAnalytics ? (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="p-4 bg-blue-50/70 rounded-xl">
              <h3 className="font-semibold text-blue-900 mb-3">Eficiencia Operacional</h3>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-blue-700">Tiempo prom. proceso:</span>
                  <span className="font-medium text-blue-900">{summaryData.detailedAnalytics.operationalEfficiency.averageProcessTime}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-blue-700">Tasa de éxito:</span>
                  <span className="font-medium text-blue-900">{summaryData.detailedAnalytics.operationalEfficiency.successRate}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-blue-700">Errores/día:</span>
                  <span className="font-medium text-blue-900">{summaryData.detailedAnalytics.operationalEfficiency.errorsPerDay}</span>
                </div>
              </div>
            </div>
            
            <div className="p-4 bg-green-50/70 rounded-xl">
              <h3 className="font-semibold text-green-900 mb-3">Métricas Financieras</h3>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-green-700">ROI mensual:</span>
                  <span className="font-medium text-green-900">{summaryData.detailedAnalytics.financialMetrics.monthlyROI}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-green-700">Margen promedio:</span>
                  <span className="font-medium text-green-900">{summaryData.detailedAnalytics.financialMetrics.averageMargin}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-green-700">Costo por tx:</span>
                  <span className="font-medium text-green-900">{summaryData.detailedAnalytics.financialMetrics.costPerTransaction}</span>
                </div>
              </div>
            </div>
            
            <div className="p-4 bg-purple-50/70 rounded-xl">
              <h3 className="font-semibold text-purple-900 mb-3">Crecimiento</h3>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-purple-700">Crecimiento mensual:</span>
                  <span className="font-medium text-purple-900">{summaryData.detailedAnalytics.growth.monthlyGrowth}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-purple-700">Nuevos clientes:</span>
                  <span className="font-medium text-purple-900">{summaryData.detailedAnalytics.growth.newClientsPerMonth}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-purple-700">Retención:</span>
                  <span className="font-medium text-purple-900">{summaryData.detailedAnalytics.growth.retention}</span>
                </div>
              </div>
            </div>
          </div>
        ) : (
          <div className="text-center py-8 text-gray-500">
            <BarChart3 className="w-12 h-12 mx-auto mb-2 opacity-50" />
            <p>Cargando análisis detallado...</p>
          </div>
        )}
      </div>
        </>
      )}

      {/* Modal de Exportación */}
      <ExportModal
        isOpen={isExportModalOpen}
        onClose={() => setIsExportModalOpen(false)}
        dataType="reports"
        availableFields={[
          { key: 'periodo', label: 'Período', type: 'string' },
          { key: 'totalTransactions', label: 'Total Transacciones', type: 'number' },
          { key: 'totalVolumeUsd', label: 'Volumen Total USD', type: 'number' },
          { key: 'totalCommissions', label: 'Total Comisiones', type: 'number' },
          { key: 'averageTransaction', label: 'Promedio por Transacción', type: 'number' },
          { key: 'topCollaborator', label: 'Top Colaborador', type: 'string' },
          { key: 'topClient', label: 'Top Cliente', type: 'string' },
          { key: 'monthlyGrowth', label: 'Crecimiento Mensual', type: 'string' },
          { key: 'successRate', label: 'Tasa de Éxito', type: 'string' },
          { key: 'averageProcessTime', label: 'Tiempo Promedio Proceso', type: 'string' }
        ]}
        availableFilters={{
          collaborators: summaryData?.collaboratorPerformance.map(c => c.name) || [],
          clients: summaryData?.topClients.map(c => c.name) || []
        }}
        onExport={handleExport}
      />
    </div>
  );
};

export default ReportsAnalytics;