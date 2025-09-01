import React, { useState } from 'react';
import { 
  Search, 
  Filter, 
  X, 
  Calendar, 
  User, 
  CheckCircle, 
  RotateCcw,
  Settings,
  ChevronDown,
  ChevronUp
} from 'lucide-react';

// Tipos para los filtros
export interface FilterConfig {
  search: string;
  dateRange: {
    start: string;
    end: string;
    preset?: string;
  };
  collaborator: string;
  client: string;
  status: string;
  amountRange: {
    min: number | null;
    max: number | null;
  };
  commissionRange: {
    min: number | null;
    max: number | null;
  };
  rateRange: {
    min: number | null;
    max: number | null;
  };
}

// Props del componente
interface AdvancedFiltersProps {
  filters: FilterConfig;
  onFiltersChange: (filters: FilterConfig) => void;
  availableCollaborators: string[];
  availableClients: string[];
  availableStatuses: { value: string; label: string; color: string }[];
  isLoading?: boolean;
  className?: string;
}

// Presets de rangos de fecha
const DATE_PRESETS = [
  { value: '', label: 'Todas las fechas' },
  { value: 'today', label: 'Hoy' },
  { value: 'yesterday', label: 'Ayer' },
  { value: 'last7days', label: 'Últimos 7 días' },
  { value: 'last30days', label: 'Últimos 30 días' },
  { value: 'last90days', label: 'Últimos 90 días' },
  { value: 'thismonth', label: 'Este mes' },
  { value: 'lastmonth', label: 'Mes pasado' },
  { value: 'thisyear', label: 'Este año' },
  { value: 'custom', label: 'Rango personalizado' }
];

// Filtros iniciales
const INITIAL_FILTERS: FilterConfig = {
  search: '',
  dateRange: {
    start: '',
    end: '',
    preset: ''
  },
  collaborator: '',
  client: '',
  status: '',
  amountRange: {
    min: null,
    max: null
  },
  commissionRange: {
    min: null,
    max: null
  },
  rateRange: {
    min: null,
    max: null
  }
};

const AdvancedFilters: React.FC<AdvancedFiltersProps> = ({
  filters,
  onFiltersChange,
  availableCollaborators,
  availableClients,
  availableStatuses,
  isLoading = false,
  className = ''
}) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const [showDatePicker, setShowDatePicker] = useState(false);
  
  // Contar filtros activos
  const activeFiltersCount = Object.entries(filters).reduce((count, [key, value]) => {
    if (key === 'search' && value) return count + 1;
    if (key === 'dateRange' && (value.start || value.end)) return count + 1;
    if (key === 'collaborator' && value) return count + 1;
    if (key === 'client' && value) return count + 1;
    if (key === 'status' && value) return count + 1;
    if (key === 'amountRange' && (value.min !== null || value.max !== null)) return count + 1;
    if (key === 'commissionRange' && (value.min !== null || value.max !== null)) return count + 1;
    if (key === 'rateRange' && (value.min !== null || value.max !== null)) return count + 1;
    return count;
  }, 0);

  // Manejar cambio de preset de fecha
  const handleDatePresetChange = (preset: string) => {
    const today = new Date();
    let start = '';
    let end = '';

    if (preset && preset !== 'custom') {
      switch (preset) {
        case 'today':
          start = today.toISOString().split('T')[0];
          end = today.toISOString().split('T')[0];
          break;
        case 'yesterday':
          const yesterday = new Date(today.getTime() - 24 * 60 * 60 * 1000);
          start = yesterday.toISOString().split('T')[0];
          end = yesterday.toISOString().split('T')[0];
          break;
        case 'last7days':
          start = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
          end = today.toISOString().split('T')[0];
          break;
        case 'last30days':
          start = new Date(today.getTime() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
          end = today.toISOString().split('T')[0];
          break;
        case 'last90days':
          start = new Date(today.getTime() - 90 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
          end = today.toISOString().split('T')[0];
          break;
        case 'thismonth':
          start = new Date(today.getFullYear(), today.getMonth(), 1).toISOString().split('T')[0];
          end = today.toISOString().split('T')[0];
          break;
        case 'lastmonth':
          const lastMonth = new Date(today.getFullYear(), today.getMonth() - 1, 1);
          const lastMonthEnd = new Date(today.getFullYear(), today.getMonth(), 0);
          start = lastMonth.toISOString().split('T')[0];
          end = lastMonthEnd.toISOString().split('T')[0];
          break;
        case 'thisyear':
          start = new Date(today.getFullYear(), 0, 1).toISOString().split('T')[0];
          end = today.toISOString().split('T')[0];
          break;
      }
    }

    onFiltersChange({
      ...filters,
      dateRange: {
        start,
        end,
        preset
      }
    });

    if (preset === 'custom') {
      setShowDatePicker(true);
    } else {
      setShowDatePicker(false);
    }
  };

  // Limpiar todos los filtros
  const clearAllFilters = () => {
    onFiltersChange(INITIAL_FILTERS);
    setShowDatePicker(false);
  };

  // Limpiar filtro específico
  const clearFilter = (filterKey: string) => {
    const newFilters = { ...filters };
    
    switch (filterKey) {
      case 'search':
        newFilters.search = '';
        break;
      case 'dateRange':
        newFilters.dateRange = { start: '', end: '', preset: '' };
        setShowDatePicker(false);
        break;
      case 'collaborator':
        newFilters.collaborator = '';
        break;
      case 'client':
        newFilters.client = '';
        break;
      case 'status':
        newFilters.status = '';
        break;
      case 'amountRange':
        newFilters.amountRange = { min: null, max: null };
        break;
      case 'commissionRange':
        newFilters.commissionRange = { min: null, max: null };
        break;
      case 'rateRange':
        newFilters.rateRange = { min: null, max: null };
        break;
    }
    
    onFiltersChange(newFilters);
  };

  return (
    <div className={`bg-white/70 backdrop-blur-md rounded-2xl border border-gray-200/50 shadow-lg ${className}`}>
      {/* Header con búsqueda principal */}
      <div className="p-6">
        <div className="flex flex-col lg:flex-row space-y-4 lg:space-y-0 lg:space-x-4">
          {/* Búsqueda principal */}
          <div className="flex-1 relative">
            <Search className="w-5 h-5 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="Buscar por cliente, colaborador, ID o monto..."
              value={filters.search}
              onChange={(e) => onFiltersChange({ ...filters, search: e.target.value })}
              className="w-full pl-10 pr-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white/50 placeholder-gray-500"
            />
            {filters.search && (
              <button
                onClick={() => clearFilter('search')}
                className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>

          {/* Botón de filtros avanzados */}
          <div className="flex space-x-3">
            <button
              onClick={() => setIsExpanded(!isExpanded)}
              className={`flex items-center space-x-2 px-4 py-3 rounded-xl border transition-all duration-200 ${
                isExpanded || activeFiltersCount > 0
                  ? 'border-blue-500 bg-blue-50 text-blue-700'
                  : 'border-gray-200 hover:border-gray-300 text-gray-700 hover:bg-gray-50'
              }`}
            >
              <Filter className="w-4 h-4" />
              <span className="font-medium">Filtros</span>
              {activeFiltersCount > 0 && (
                <span className="bg-blue-500 text-white text-xs px-2 py-1 rounded-full">
                  {activeFiltersCount}
                </span>
              )}
              {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
            </button>

            {activeFiltersCount > 0 && (
              <button
                onClick={clearAllFilters}
                className="flex items-center space-x-2 px-4 py-3 border border-gray-200 text-gray-700 rounded-xl hover:bg-gray-50 transition-colors duration-200"
              >
                <RotateCcw className="w-4 h-4" />
                <span>Limpiar</span>
              </button>
            )}
          </div>
        </div>

        {/* Filtros activos (chips) */}
        {activeFiltersCount > 0 && (
          <div className="flex flex-wrap gap-2 mt-4">
            {filters.search && (
              <div className="flex items-center space-x-2 bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-sm">
                <Search className="w-3 h-3" />
                <span>Búsqueda: "{filters.search}"</span>
                <button onClick={() => clearFilter('search')} className="hover:text-blue-600">
                  <X className="w-3 h-3" />
                </button>
              </div>
            )}
            
            {(filters.dateRange.start || filters.dateRange.end) && (
              <div className="flex items-center space-x-2 bg-green-100 text-green-800 px-3 py-1 rounded-full text-sm">
                <Calendar className="w-3 h-3" />
                <span>
                  Fecha: {filters.dateRange.start || 'Inicio'} - {filters.dateRange.end || 'Fin'}
                </span>
                <button onClick={() => clearFilter('dateRange')} className="hover:text-green-600">
                  <X className="w-3 h-3" />
                </button>
              </div>
            )}
            
            {filters.collaborator && (
              <div className="flex items-center space-x-2 bg-purple-100 text-purple-800 px-3 py-1 rounded-full text-sm">
                <User className="w-3 h-3" />
                <span>Colaborador: {filters.collaborator}</span>
                <button onClick={() => clearFilter('collaborator')} className="hover:text-purple-600">
                  <X className="w-3 h-3" />
                </button>
              </div>
            )}
            
            {filters.client && (
              <div className="flex items-center space-x-2 bg-orange-100 text-orange-800 px-3 py-1 rounded-full text-sm">
                <User className="w-3 h-3" />
                <span>Cliente: {filters.client}</span>
                <button onClick={() => clearFilter('client')} className="hover:text-orange-600">
                  <X className="w-3 h-3" />
                </button>
              </div>
            )}
            
            {filters.status && (
              <div className="flex items-center space-x-2 bg-gray-100 text-gray-800 px-3 py-1 rounded-full text-sm">
                <CheckCircle className="w-3 h-3" />
                <span>Estado: {availableStatuses.find(s => s.value === filters.status)?.label}</span>
                <button onClick={() => clearFilter('status')} className="hover:text-gray-600">
                  <X className="w-3 h-3" />
                </button>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Panel de filtros avanzados expandible */}
      {isExpanded && (
        <div className="border-t border-gray-200/50 p-6 space-y-6">
          {/* Rango de fechas */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-3">Rango de Fechas</label>
            <div className="grid grid-cols-2 lg:grid-cols-5 gap-3 mb-4">
              {DATE_PRESETS.map((preset) => (
                <button
                  key={preset.value}
                  onClick={() => handleDatePresetChange(preset.value)}
                  className={`p-2 text-sm rounded-lg border transition-colors duration-200 ${
                    filters.dateRange.preset === preset.value
                      ? 'border-green-500 bg-green-50 text-green-700'
                      : 'border-gray-200 hover:border-gray-300 text-gray-700'
                  }`}
                >
                  {preset.label}
                </button>
              ))}
            </div>
            
            {(showDatePicker || filters.dateRange.preset === 'custom') && (
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs text-gray-600 mb-1">Fecha inicio</label>
                  <input
                    type="date"
                    value={filters.dateRange.start}
                    onChange={(e) => onFiltersChange({
                      ...filters,
                      dateRange: { ...filters.dateRange, start: e.target.value }
                    })}
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                  />
                </div>
                <div>
                  <label className="block text-xs text-gray-600 mb-1">Fecha fin</label>
                  <input
                    type="date"
                    value={filters.dateRange.end}
                    onChange={(e) => onFiltersChange({
                      ...filters,
                      dateRange: { ...filters.dateRange, end: e.target.value }
                    })}
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                  />
                </div>
              </div>
            )}
          </div>

          {/* Filtros por categoría */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Colaborador */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Colaborador</label>
              <select
                value={filters.collaborator}
                onChange={(e) => onFiltersChange({ ...filters, collaborator: e.target.value })}
                className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
              >
                <option value="">Todos los colaboradores</option>
                {availableCollaborators.map(collab => (
                  <option key={collab} value={collab}>{collab}</option>
                ))}
              </select>
            </div>

            {/* Cliente */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Cliente</label>
              <select
                value={filters.client}
                onChange={(e) => onFiltersChange({ ...filters, client: e.target.value })}
                className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
              >
                <option value="">Todos los clientes</option>
                {availableClients.map(client => (
                  <option key={client} value={client}>{client}</option>
                ))}
              </select>
            </div>

            {/* Estado */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Estado</label>
              <select
                value={filters.status}
                onChange={(e) => onFiltersChange({ ...filters, status: e.target.value })}
                className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
              >
                <option value="">Todos los estados</option>
                {availableStatuses.map(status => (
                  <option key={status.value} value={status.value}>{status.label}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Rangos numéricos */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Rango de monto */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Monto USD</label>
              <div className="grid grid-cols-2 gap-2">
                <input
                  type="number"
                  placeholder="Mín"
                  value={filters.amountRange.min || ''}
                  onChange={(e) => onFiltersChange({
                    ...filters,
                    amountRange: {
                      ...filters.amountRange,
                      min: e.target.value ? parseFloat(e.target.value) : null
                    }
                  })}
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                />
                <input
                  type="number"
                  placeholder="Máx"
                  value={filters.amountRange.max || ''}
                  onChange={(e) => onFiltersChange({
                    ...filters,
                    amountRange: {
                      ...filters.amountRange,
                      max: e.target.value ? parseFloat(e.target.value) : null
                    }
                  })}
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                />
              </div>
            </div>

            {/* Rango de comisión */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Comisión %</label>
              <div className="grid grid-cols-2 gap-2">
                <input
                  type="number"
                  placeholder="Mín"
                  value={filters.commissionRange.min || ''}
                  onChange={(e) => onFiltersChange({
                    ...filters,
                    commissionRange: {
                      ...filters.commissionRange,
                      min: e.target.value ? parseFloat(e.target.value) : null
                    }
                  })}
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                />
                <input
                  type="number"
                  placeholder="Máx"
                  value={filters.commissionRange.max || ''}
                  onChange={(e) => onFiltersChange({
                    ...filters,
                    commissionRange: {
                      ...filters.commissionRange,
                      max: e.target.value ? parseFloat(e.target.value) : null
                    }
                  })}
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                />
              </div>
            </div>

            {/* Rango de tasa */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Tasa Gs/$</label>
              <div className="grid grid-cols-2 gap-2">
                <input
                  type="number"
                  placeholder="Mín"
                  value={filters.rateRange.min || ''}
                  onChange={(e) => onFiltersChange({
                    ...filters,
                    rateRange: {
                      ...filters.rateRange,
                      min: e.target.value ? parseFloat(e.target.value) : null
                    }
                  })}
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                />
                <input
                  type="number"
                  placeholder="Máx"
                  value={filters.rateRange.max || ''}
                  onChange={(e) => onFiltersChange({
                    ...filters,
                    rateRange: {
                      ...filters.rateRange,
                      max: e.target.value ? parseFloat(e.target.value) : null
                    }
                  })}
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                />
              </div>
            </div>
          </div>

          {/* Información de resultados */}
          <div className="bg-blue-50/50 border border-blue-200 rounded-xl p-4">
            <div className="flex items-center space-x-2 text-blue-800">
              <Settings className="w-4 h-4" />
              <span className="text-sm font-medium">
                {activeFiltersCount === 0 
                  ? 'Mostrando todas las transacciones'
                  : `${activeFiltersCount} filtro${activeFiltersCount > 1 ? 's' : ''} aplicado${activeFiltersCount > 1 ? 's' : ''}`
                }
              </span>
            </div>
            {isLoading && (
              <div className="flex items-center space-x-2 mt-2 text-blue-600">
                <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-blue-600"></div>
                <span className="text-xs">Aplicando filtros...</span>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default AdvancedFilters;