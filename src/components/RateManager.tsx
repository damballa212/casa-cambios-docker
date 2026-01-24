import React, { useState, useEffect } from 'react';
import { TrendingUp, Save, History, AlertTriangle, Plus } from 'lucide-react';
import { apiService, type RateHistory } from '../services/api';

interface RateManagerProps {
  currentRate: number;
  onRateUpdate?: () => void;
}

const RateManager: React.FC<RateManagerProps> = ({ currentRate, onRateUpdate }) => {
  const [newRate, setNewRate] = useState(currentRate.toString());
  const [isUpdating, setIsUpdating] = useState(false);
  const [rateHistory, setRateHistory] = useState<RateHistory[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Cargar historial de tasas
  const loadRateHistory = async () => {
    try {
      setLoading(true);
      const history = await apiService.getRateHistory();
      setRateHistory(history);
    } catch (err) {
      console.error('Error loading rate history:', err);
      setError('Error cargando historial de tasas');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadRateHistory();
  }, []);

  useEffect(() => {
    setNewRate(currentRate.toString());
  }, [currentRate]);

  const handleUpdateRate = async () => {
    try {
      setIsUpdating(true);
      setError(null);
      
      const rate = parseFloat(newRate);
      if (isNaN(rate) || rate <= 0) {
        throw new Error('La tasa debe ser un número mayor a 0');
      }
      
      const result = await apiService.updateRate(rate);
      
      if (result.success) {
        alert(`✅ ${result.message}`);
        // Recargar historial y notificar al componente padre
        await loadRateHistory();
        if (onRateUpdate) {
          onRateUpdate();
        }
      } else {
        throw new Error('Error actualizando la tasa');
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Error desconocido';
      setError(errorMessage);
      alert(`❌ Error: ${errorMessage}`);
    } finally {
      setIsUpdating(false);
    }
  };

  const rateVariation = currentRate > 0 && !isNaN(parseFloat(newRate))
    ? ((parseFloat(newRate) - currentRate) / currentRate * 100).toFixed(2)
    : '0.00';

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold text-gray-900">Gestión de Tasas de Cambio</h1>
        <div className="flex items-center space-x-2 px-4 py-2 bg-blue-100 rounded-lg">
          <TrendingUp className="w-5 h-5 text-blue-600" />
          <span className="font-medium text-blue-700">Tasa Actual: {currentRate.toLocaleString()} Gs/USD</span>
        </div>
      </div>

      {/* Rate Update Panel */}
      <div className="bg-white/70 backdrop-blur-md rounded-2xl p-6 border border-gray-200/50 shadow-lg">
        <h2 className="text-xl font-bold text-gray-900 mb-6 flex items-center">
          <Plus className="w-5 h-5 mr-2" />
          Actualizar Tasa Global
        </h2>
        
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Nueva Tasa (Gs/USD)</label>
            <input
              type="number"
              value={newRate}
              onChange={(e) => setNewRate(e.target.value)}
              className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white/50"
              placeholder="Ej: 7350"
            />
            
            <div className="mt-4 p-4 bg-gray-50/70 rounded-xl">
              <div className="flex justify-between items-center mb-2">
                <span className="text-sm text-gray-600">Variación:</span>
                <span className={`text-sm font-semibold ${
                  parseFloat(rateVariation) > 0 ? 'text-green-600' : 'text-red-600'
                }`}>
                  {parseFloat(rateVariation) > 0 ? '+' : ''}{rateVariation}%
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600">Diferencia:</span>
                <span className="text-sm font-semibold text-gray-900">
                  {(parseFloat(newRate) - currentRate).toLocaleString()} Gs
                </span>
              </div>
            </div>
          </div>
          
          <div>
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Impacto Estimado</h3>
            <div className="space-y-3">
              <div className="p-3 bg-blue-50/70 rounded-lg">
                <p className="text-sm text-blue-700">
                  <strong>Transacción de $100:</strong><br />
                  Antes: {(100 * currentRate).toLocaleString()} Gs<br />
                  Después: {(100 * parseFloat(newRate)).toLocaleString()} Gs
                </p>
              </div>
              <div className="p-3 bg-green-50/70 rounded-lg">
                <p className="text-sm text-green-700">
                  <strong>Transacción de $500:</strong><br />
                  Antes: {(500 * currentRate).toLocaleString()} Gs<br />
                  Después: {(500 * parseFloat(newRate)).toLocaleString()} Gs
                </p>
              </div>
            </div>
          </div>
        </div>
        
        <div className="mt-6 flex items-center justify-between">
          <div className="flex items-center space-x-2 text-sm text-amber-600">
            <AlertTriangle className="w-4 h-4" />
            <span>La nueva tasa se aplicará a todas las transacciones futuras</span>
          </div>
          
          <button
            onClick={handleUpdateRate}
            disabled={isUpdating || newRate === currentRate.toString()}
            className="flex items-center space-x-2 px-6 py-3 bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 disabled:opacity-50 disabled:cursor-not-allowed text-white rounded-xl transition-all duration-200 shadow-lg hover:shadow-xl"
          >
            <Save className={`w-4 h-4 ${isUpdating ? 'animate-spin' : ''}`} />
            <span>{isUpdating ? 'Actualizando...' : 'Actualizar Tasa'}</span>
          </button>
        </div>
      </div>

      {/* Rate History */}
      <div className="bg-white/70 backdrop-blur-md rounded-2xl p-6 border border-gray-200/50 shadow-lg">
        <h2 className="text-xl font-bold text-gray-900 mb-6 flex items-center">
          <History className="w-5 h-5 mr-2" />
          Historial de Tasas
          {loading && <span className="ml-2 text-sm text-gray-500">(Cargando...)</span>}
        </h2>
        
        {error && (
          <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-xl">
            <p className="text-red-700 text-sm">{error}</p>
          </div>
        )}
        
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50/70">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Fecha/Hora</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Tasa (Gs/USD)</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Cambio</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Usuario</th>
              </tr>
            </thead>
            <tbody className="bg-white/30 divide-y divide-gray-200/50">
              {rateHistory.length > 0 ? (
                rateHistory.map((entry, index) => (
                  <tr key={index} className="hover:bg-gray-50/30 transition-colors duration-200">
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {new Date(entry.date).toLocaleDateString()}
                      <br />
                      <span className="text-xs text-gray-500">
                        {new Date(entry.date).toLocaleTimeString()}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      {(entry.rate || 0).toLocaleString()} Gs
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                        (entry.change || '').startsWith('+') 
                          ? 'bg-green-100 text-green-800' 
                          : 'bg-red-100 text-red-800'
                      }`}>
                        {entry.change} Gs
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {entry.user}
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={4} className="px-6 py-8 text-center text-gray-500">
                    {loading ? 'Cargando historial...' : 'No hay historial disponible'}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Rate Analytics */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white/70 backdrop-blur-md rounded-2xl p-6 border border-gray-200/50 shadow-lg">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900">Promedio Semanal</h3>
            <TrendingUp className="w-6 h-6 text-blue-500" />
          </div>
          <p className="text-3xl font-bold text-gray-900">7,238 Gs</p>
          <p className="text-sm text-green-600 mt-2">+2.1% vs semana anterior</p>
        </div>
        
        <div className="bg-white/70 backdrop-blur-md rounded-2xl p-6 border border-gray-200/50 shadow-lg">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900">Volatilidad</h3>
            <TrendingUp className="w-6 h-6 text-orange-500" />
          </div>
          <p className="text-3xl font-bold text-gray-900">±1.5%</p>
          <p className="text-sm text-gray-600 mt-2">Variación promedio diaria</p>
        </div>
        
        <div className="bg-white/70 backdrop-blur-md rounded-2xl p-6 border border-gray-200/50 shadow-lg">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900">Próxima Actualización</h3>
            <TrendingUp className="w-6 h-6 text-purple-500" />
          </div>
          <p className="text-3xl font-bold text-gray-900">2h 15m</p>
          <p className="text-sm text-gray-600 mt-2">Actualización automática</p>
        </div>
      </div>
    </div>
  );
};

export default RateManager;