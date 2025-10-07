import React, { useState, useEffect } from 'react';
import { 
  X, 
  Download, 
  FileText, 
  FileSpreadsheet, 
  Database, 
  CheckCircle,
  Info,
  Save,
  FolderOpen,
  Trash2
} from 'lucide-react';

// Tipos de datos que se pueden exportar
export type ExportDataType = 'transactions' | 'reports' | 'collaborators' | 'clients' | 'logs';

// Formatos de exportación disponibles
export type ExportFormat = 'csv' | 'excel' | 'json' | 'pdf';

// Configuración de exportación
export interface ExportConfig {
  dataType: ExportDataType;
  format: ExportFormat;
  dateRange: {
    start: string;
    end: string;
    preset?: string;
  };
  filters: {
    collaborator?: string;
    client?: string;
    status?: string;
    minAmount?: number;
    maxAmount?: number;
  };
  fields: string[];
  includeHeaders: boolean;
  includeMetadata: boolean;
  customFilename?: string;
}

// Configuración guardada con nombre
export interface SavedExportConfig {
  id: string;
  name: string;
  description?: string;
  config: ExportConfig;
  createdAt: string;
  lastUsed?: string;
}

// Props del modal
interface ExportModalProps {
  isOpen: boolean;
  onClose: () => void;
  dataType: ExportDataType;
  availableFields: { key: string; label: string; type: 'string' | 'number' | 'date' | 'boolean' }[];
  availableFilters?: {
    collaborators?: string[];
    clients?: string[];
    statuses?: string[];
  };
  onExport: (config: ExportConfig) => Promise<void>;
  title?: string;
}

// Configuraciones predefinidas por tipo de datos
const DATA_TYPE_CONFIGS = {
  transactions: {
    title: 'Exportar Transacciones',
    description: 'Exporta datos de transacciones con filtros avanzados',
    icon: Database,
    defaultFields: ['fecha', 'cliente', 'colaborador', 'usdTotal', 'comision', 'status']
  },
  reports: {
    title: 'Exportar Reportes',
    description: 'Exporta análisis y métricas del sistema',
    icon: FileText,
    defaultFields: ['periodo', 'totalTransactions', 'totalVolume', 'totalCommissions']
  },
  collaborators: {
    title: 'Exportar Colaboradores',
    description: 'Exporta información de colaboradores y su rendimiento',
    icon: Database,
    defaultFields: ['name', 'totalTransactions', 'totalCommissions', 'status']
  },
  clients: {
    title: 'Exportar Clientes',
    description: 'Exporta base de datos de clientes',
    icon: Database,
    defaultFields: ['name', 'phone', 'totalTransactions', 'totalVolume']
  },
  logs: {
    title: 'Exportar Logs',
    description: 'Exporta registros del sistema',
    icon: FileText,
    defaultFields: ['timestamp', 'level', 'message', 'source']
  }
};

// Presets de rangos de fecha
const DATE_PRESETS = [
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

// Formatos de exportación con sus características
const EXPORT_FORMATS = {
  csv: {
    label: 'CSV',
    description: 'Archivo de valores separados por comas',
    icon: FileText,
    extension: '.csv',
    supportsImages: false,
    supportsFormatting: false
  },
  excel: {
    label: 'Excel',
    description: 'Hoja de cálculo de Microsoft Excel',
    icon: FileSpreadsheet,
    extension: '.xlsx',
    supportsImages: false,
    supportsFormatting: true
  },
  json: {
    label: 'JSON',
    description: 'Formato de intercambio de datos JavaScript',
    icon: Database,
    extension: '.json',
    supportsImages: false,
    supportsFormatting: false
  },
  pdf: {
    label: 'PDF',
    description: 'Documento PDF con formato profesional',
    icon: FileText,
    extension: '.pdf',
    supportsImages: true,
    supportsFormatting: true
  }
};

// Funciones para manejar configuraciones guardadas
const STORAGE_KEY = 'export_configurations';

const getSavedConfigurations = (dataType: ExportDataType): SavedExportConfig[] => {
  try {
    const saved = localStorage.getItem(`${STORAGE_KEY}_${dataType}`);
    return saved ? JSON.parse(saved) : [];
  } catch (error) {
    console.error('Error loading saved configurations:', error);
    return [];
  }
};

const saveConfiguration = (dataType: ExportDataType, config: SavedExportConfig): void => {
  try {
    const existing = getSavedConfigurations(dataType);
    const updated = existing.filter(c => c.id !== config.id);
    updated.push(config);
    localStorage.setItem(`${STORAGE_KEY}_${dataType}`, JSON.stringify(updated));
  } catch (error) {
    console.error('Error saving configuration:', error);
  }
};

const deleteConfiguration = (dataType: ExportDataType, configId: string): void => {
  try {
    const existing = getSavedConfigurations(dataType);
    const updated = existing.filter(c => c.id !== configId);
    localStorage.setItem(`${STORAGE_KEY}_${dataType}`, JSON.stringify(updated));
  } catch (error) {
    console.error('Error deleting configuration:', error);
  }
};

const updateLastUsed = (dataType: ExportDataType, configId: string): void => {
  try {
    const existing = getSavedConfigurations(dataType);
    const updated = existing.map(c => 
      c.id === configId ? { ...c, lastUsed: new Date().toISOString() } : c
    );
    localStorage.setItem(`${STORAGE_KEY}_${dataType}`, JSON.stringify(updated));
  } catch (error) {
    console.error('Error updating last used:', error);
  }
};

const ExportModal: React.FC<ExportModalProps> = ({
  isOpen,
  onClose,
  dataType,
  availableFields,
  availableFilters,
  onExport,
  title
}) => {
  const [currentStep, setCurrentStep] = useState(1);
  const [isExporting, setIsExporting] = useState(false);
  const [exportProgress, setExportProgress] = useState(0);
  
  // Estados para configuraciones guardadas
  const [savedConfigurations, setSavedConfigurations] = useState<SavedExportConfig[]>([]);
  const [showSaveDialog, setShowSaveDialog] = useState(false);
  const [showLoadDialog, setShowLoadDialog] = useState(false);
  const [saveConfigName, setSaveConfigName] = useState('');
  const [saveConfigDescription, setSaveConfigDescription] = useState('');
  
  const config = DATA_TYPE_CONFIGS[dataType];
  const IconComponent = config.icon;
  
  // Estado del formulario de exportación
  const [exportConfig, setExportConfig] = useState<ExportConfig>({
    dataType,
    format: 'excel',
    dateRange: {
      start: new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().split('T')[0],
      end: new Date().toISOString().split('T')[0],
      preset: 'thismonth'
    },
    filters: {},
    fields: config.defaultFields,
    includeHeaders: true,
    includeMetadata: true
  });

  // Cargar configuraciones guardadas al abrir el modal
  useEffect(() => {
    if (isOpen) {
      setSavedConfigurations(getSavedConfigurations(dataType));
    }
  }, [isOpen, dataType]);

  // Manejar cambio de preset de fecha
  const handleDatePresetChange = (preset: string) => {
    const today = new Date();
    let start = new Date();
    let end = new Date();

    switch (preset) {
      case 'today':
        start = today;
        end = today;
        break;
      case 'yesterday':
        start = new Date(today.getTime() - 24 * 60 * 60 * 1000);
        end = new Date(today.getTime() - 24 * 60 * 60 * 1000);
        break;
      case 'last7days':
        start = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000);
        end = today;
        break;
      case 'last30days':
        start = new Date(today.getTime() - 30 * 24 * 60 * 60 * 1000);
        end = today;
        break;
      case 'last90days':
        start = new Date(today.getTime() - 90 * 24 * 60 * 60 * 1000);
        end = today;
        break;
      case 'thismonth':
        start = new Date(today.getFullYear(), today.getMonth(), 1);
        end = today;
        break;
      case 'lastmonth':
        start = new Date(today.getFullYear(), today.getMonth() - 1, 1);
        end = new Date(today.getFullYear(), today.getMonth(), 0);
        break;
      case 'thisyear':
        start = new Date(today.getFullYear(), 0, 1);
        end = today;
        break;
      case 'custom':
        return; // No cambiar las fechas para rango personalizado
    }

    setExportConfig(prev => ({
      ...prev,
      dateRange: {
        start: start.toISOString().split('T')[0],
        end: end.toISOString().split('T')[0],
        preset
      }
    }));
  };

  // Manejar selección de campos
  const handleFieldToggle = (fieldKey: string) => {
    setExportConfig(prev => ({
      ...prev,
      fields: prev.fields.includes(fieldKey)
        ? prev.fields.filter(f => f !== fieldKey)
        : [...prev.fields, fieldKey]
    }));
  };

  // Funciones para manejar configuraciones
  const handleSaveConfiguration = () => {
    if (!saveConfigName.trim()) return;
    
    const newConfig: SavedExportConfig = {
      id: Date.now().toString(),
      name: saveConfigName.trim(),
      description: saveConfigDescription.trim() || undefined,
      config: { ...exportConfig },
      createdAt: new Date().toISOString()
    };
    
    saveConfiguration(dataType, newConfig);
    setSavedConfigurations(getSavedConfigurations(dataType));
    setShowSaveDialog(false);
    setSaveConfigName('');
    setSaveConfigDescription('');
  };
  
  const handleLoadConfiguration = (savedConfig: SavedExportConfig) => {
    setExportConfig({ ...savedConfig.config, dataType });
    updateLastUsed(dataType, savedConfig.id);
    setSavedConfigurations(getSavedConfigurations(dataType));
    setShowLoadDialog(false);
  };
  
  const handleDeleteConfiguration = (configId: string) => {
    deleteConfiguration(dataType, configId);
    setSavedConfigurations(getSavedConfigurations(dataType));
  };

  // Ejecutar exportación
  const handleExport = async () => {
    setIsExporting(true);
    setExportProgress(0);
    
    try {
      // Simular progreso
      const progressInterval = setInterval(() => {
        setExportProgress(prev => {
          if (prev >= 90) {
            clearInterval(progressInterval);
            return prev;
          }
          return prev + 10;
        });
      }, 200);
      
      await onExport(exportConfig);
      
      clearInterval(progressInterval);
      setExportProgress(100);
      
      // Cerrar modal después de un breve delay
      setTimeout(() => {
        setIsExporting(false);
        setExportProgress(0);
        onClose();
      }, 1000);
    } catch (error) {
      console.error('Error en exportación:', error);
      setIsExporting(false);
      setExportProgress(0);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-2 sm:p-4">
      <div className="bg-white/95 backdrop-blur-md rounded-2xl w-full max-w-4xl h-[95vh] sm:h-[90vh] flex flex-col border border-gray-200/50 shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between p-4 sm:p-6 border-b border-gray-200/50 flex-shrink-0">
          <div className="flex items-center space-x-2 sm:space-x-3 flex-1 min-w-0">
            <div className="w-8 h-8 sm:w-10 sm:h-10 bg-gradient-to-r from-green-500 to-green-600 rounded-xl flex items-center justify-center flex-shrink-0">
              <IconComponent className="w-4 h-4 sm:w-5 sm:h-5 text-white" />
            </div>
            <div className="min-w-0 flex-1">
              <h2 className="text-lg sm:text-xl font-bold text-gray-900 truncate">
                {title || config.title}
              </h2>
              <p className="text-xs sm:text-sm text-gray-600 truncate">{config.description}</p>
            </div>
          </div>
          <div className="flex items-center space-x-1 sm:space-x-2 flex-shrink-0">
            {/* Botón Cargar Configuración */}
            <button
              onClick={() => setShowLoadDialog(true)}
              className="hidden sm:block p-2 text-blue-600 hover:text-blue-700 hover:bg-blue-50 rounded-lg transition-colors duration-200"
              title="Cargar configuración guardada"
            >
              <FolderOpen className="w-4 h-4 sm:w-5 sm:h-5" />
            </button>
            
            {/* Botón Guardar Configuración */}
            <button
              onClick={() => setShowSaveDialog(true)}
              className="hidden sm:block p-2 text-green-600 hover:text-green-700 hover:bg-green-50 rounded-lg transition-colors duration-200"
              title="Guardar configuración actual"
            >
              <Save className="w-4 h-4 sm:w-5 sm:h-5" />
            </button>
            
            {/* Botón Cerrar */}
            <button
              onClick={onClose}
              className="p-1.5 sm:p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100/50 rounded-lg transition-colors duration-200"
            >
              <X className="w-4 h-4 sm:w-5 sm:h-5" />
            </button>
          </div>
        </div>

        {/* Progress Steps */}
        <div className="px-4 sm:px-6 py-3 sm:py-4 border-b border-gray-200/50 flex-shrink-0">
          <div className="flex items-center justify-center space-x-2 sm:space-x-4">
            {[1, 2, 3].map((step) => (
              <div key={step} className="flex items-center">
                <div className={`w-6 h-6 sm:w-8 sm:h-8 rounded-full flex items-center justify-center text-xs sm:text-sm font-medium ${
                  currentStep >= step
                    ? 'bg-green-500 text-white'
                    : 'bg-gray-200 text-gray-600'
                }`}>
                  {currentStep > step ? <CheckCircle className="w-3 h-3 sm:w-4 sm:h-4" /> : step}
                </div>
                {step < 3 && (
                  <div className={`w-8 sm:w-16 h-1 mx-1 sm:mx-2 ${
                    currentStep > step ? 'bg-green-500' : 'bg-gray-200'
                  }`} />
                )}
              </div>
            ))}
          </div>
          <div className="flex justify-between mt-2 text-xs text-gray-600">
            <span className="text-center flex-1">Formato</span>
            <span className="text-center flex-1">Filtros</span>
            <span className="text-center flex-1">Exportar</span>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 p-4 sm:p-6 overflow-y-auto min-h-0">
          {/* Paso 1: Selección de formato */}
          {currentStep === 1 && (
            <div className="space-y-4 sm:space-y-6">
              <div>
                <h3 className="text-base sm:text-lg font-semibold text-gray-900 mb-3 sm:mb-4">Seleccionar Formato de Exportación</h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                  {Object.entries(EXPORT_FORMATS).map(([key, format]) => {
                    const FormatIcon = format.icon;
                    return (
                      <button
                        key={key}
                        onClick={() => setExportConfig(prev => ({ ...prev, format: key as ExportFormat }))}
                        className={`p-3 sm:p-4 border-2 rounded-xl transition-all duration-200 text-left ${
                          exportConfig.format === key
                            ? 'border-green-500 bg-green-50/50'
                            : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50/50'
                        }`}
                      >
                        <div className="flex items-center space-x-2 sm:space-x-3">
                          <FormatIcon className={`w-5 h-5 sm:w-6 sm:h-6 flex-shrink-0 ${
                            exportConfig.format === key ? 'text-green-600' : 'text-gray-600'
                          }`} />
                          <div className="min-w-0 flex-1">
                            <div className="font-medium text-gray-900 text-sm sm:text-base">{format.label}</div>
                            <div className="text-xs sm:text-sm text-gray-600 truncate">{format.description}</div>
                          </div>
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>

              <div>
                <h3 className="text-base sm:text-lg font-semibold text-gray-900 mb-3 sm:mb-4">Seleccionar Campos a Exportar</h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 sm:gap-3">
                  {availableFields.map((field) => (
                    <label key={field.key} className="flex items-center space-x-2 sm:space-x-3 p-2 sm:p-3 rounded-lg hover:bg-gray-50/50 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={exportConfig.fields.includes(field.key)}
                        onChange={() => handleFieldToggle(field.key)}
                        className="w-4 h-4 text-green-600 border-gray-300 rounded focus:ring-green-500 flex-shrink-0"
                      />
                      <span className="text-sm font-medium text-gray-900 flex-1 min-w-0">{field.label}</span>
                      <span className="text-xs text-gray-500 capitalize flex-shrink-0">({field.type})</span>
                    </label>
                  ))}
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                <label className="flex items-center space-x-2 sm:space-x-3">
                  <input
                    type="checkbox"
                    checked={exportConfig.includeHeaders}
                    onChange={(e) => setExportConfig(prev => ({ ...prev, includeHeaders: e.target.checked }))}
                    className="w-4 h-4 text-green-600 border-gray-300 rounded focus:ring-green-500"
                  />
                  <span className="text-sm font-medium text-gray-900">Incluir encabezados</span>
                </label>
                <label className="flex items-center space-x-2 sm:space-x-3">
                  <input
                    type="checkbox"
                    checked={exportConfig.includeMetadata}
                    onChange={(e) => setExportConfig(prev => ({ ...prev, includeMetadata: e.target.checked }))}
                    className="w-4 h-4 text-green-600 border-gray-300 rounded focus:ring-green-500"
                  />
                  <span className="text-sm font-medium text-gray-900">Incluir metadatos</span>
                </label>
              </div>
            </div>
          )}

          {/* Paso 2: Filtros y rango de fechas */}
          {currentStep === 2 && (
            <div className="space-y-4 sm:space-y-6">
              <div>
                <h3 className="text-base sm:text-lg font-semibold text-gray-900 mb-3 sm:mb-4">Rango de Fechas</h3>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 sm:gap-4 mb-3 sm:mb-4">
                  {DATE_PRESETS.map((preset) => (
                    <button
                      key={preset.value}
                      onClick={() => handleDatePresetChange(preset.value)}
                      className={`p-2 sm:p-3 text-xs sm:text-sm rounded-lg border transition-colors duration-200 ${
                        exportConfig.dateRange.preset === preset.value
                          ? 'border-green-500 bg-green-50 text-green-700'
                          : 'border-gray-200 hover:border-gray-300 text-gray-700'
                      }`}
                    >
                      {preset.label}
                    </button>
                  ))}
                </div>
                
                {exportConfig.dateRange.preset === 'custom' && (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Fecha inicio</label>
                      <input
                        type="date"
                        value={exportConfig.dateRange.start}
                        onChange={(e) => setExportConfig(prev => ({
                          ...prev,
                          dateRange: { ...prev.dateRange, start: e.target.value }
                        }))}
                        className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Fecha fin</label>
                      <input
                        type="date"
                        value={exportConfig.dateRange.end}
                        onChange={(e) => setExportConfig(prev => ({
                          ...prev,
                          dateRange: { ...prev.dateRange, end: e.target.value }
                        }))}
                        className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                      />
                    </div>
                  </div>
                )}
              </div>

              {/* Filtros específicos por tipo de datos */}
              {dataType === 'transactions' && (
                <div className="space-y-3 sm:space-y-4">
                  <h3 className="text-base sm:text-lg font-semibold text-gray-900">Filtros Avanzados</h3>
                  
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                    {availableFilters?.collaborators && (
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Colaborador</label>
                        <select
                          value={exportConfig.filters.collaborator || ''}
                          onChange={(e) => setExportConfig(prev => ({
                            ...prev,
                            filters: { ...prev.filters, collaborator: e.target.value || undefined }
                          }))}
                          className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                        >
                          <option value="">Todos los colaboradores</option>
                          {availableFilters.collaborators.map(collab => (
                            <option key={collab} value={collab}>{collab}</option>
                          ))}
                        </select>
                      </div>
                    )}
                    
                    {availableFilters?.clients && (
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Cliente</label>
                        <select
                          value={exportConfig.filters.client || ''}
                          onChange={(e) => setExportConfig(prev => ({
                            ...prev,
                            filters: { ...prev.filters, client: e.target.value || undefined }
                          }))}
                          className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                        >
                          <option value="">Todos los clientes</option>
                          {availableFilters.clients.map(client => (
                            <option key={client} value={client}>{client}</option>
                          ))}
                        </select>
                      </div>
                    )}
                  </div>
                  
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Monto mínimo (USD)</label>
                      <input
                        type="number"
                        min="0"
                        step="0.01"
                        value={exportConfig.filters.minAmount || ''}
                        onChange={(e) => setExportConfig(prev => ({
                          ...prev,
                          filters: { ...prev.filters, minAmount: e.target.value ? parseFloat(e.target.value) : undefined }
                        }))}
                        className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                        placeholder="0.00"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Monto máximo (USD)</label>
                      <input
                        type="number"
                        min="0"
                        step="0.01"
                        value={exportConfig.filters.maxAmount || ''}
                        onChange={(e) => setExportConfig(prev => ({
                          ...prev,
                          filters: { ...prev.filters, maxAmount: e.target.value ? parseFloat(e.target.value) : undefined }
                        }))}
                        className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                        placeholder="Sin límite"
                      />
                    </div>
                  </div>
                </div>
              )}

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Nombre del archivo (opcional)</label>
                <input
                  type="text"
                  value={exportConfig.customFilename || ''}
                  onChange={(e) => setExportConfig(prev => ({ ...prev, customFilename: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                  placeholder={`${dataType}_${new Date().toISOString().split('T')[0]}`}
                />
              </div>
            </div>
          )}

          {/* Paso 3: Confirmación y exportación */}
          {currentStep === 3 && (
            <div className="space-y-4 sm:space-y-6">
              <h3 className="text-base sm:text-lg font-semibold text-gray-900">Resumen de Exportación</h3>
              
              <div className="bg-gray-50/50 rounded-xl p-3 sm:p-4 space-y-2 sm:space-y-3">
                <div className="flex flex-col sm:flex-row sm:justify-between gap-1 sm:gap-0">
                  <span className="text-sm text-gray-600">Formato:</span>
                  <span className="text-sm font-medium text-gray-900">
                    {EXPORT_FORMATS[exportConfig.format].label}
                  </span>
                </div>
                <div className="flex flex-col sm:flex-row sm:justify-between gap-1 sm:gap-0">
                  <span className="text-sm text-gray-600">Período:</span>
                  <span className="text-sm font-medium text-gray-900 break-all sm:break-normal">
                    {exportConfig.dateRange.start} a {exportConfig.dateRange.end}
                  </span>
                </div>
                <div className="flex flex-col sm:flex-row sm:justify-between gap-1 sm:gap-0">
                  <span className="text-sm text-gray-600">Campos seleccionados:</span>
                  <span className="text-sm font-medium text-gray-900">
                    {exportConfig.fields.length} campos
                  </span>
                </div>
                {Object.keys(exportConfig.filters).length > 0 && (
                  <div className="flex flex-col sm:flex-row sm:justify-between gap-1 sm:gap-0">
                    <span className="text-sm text-gray-600">Filtros aplicados:</span>
                    <span className="text-sm font-medium text-gray-900">
                      {Object.keys(exportConfig.filters).length} filtros
                    </span>
                  </div>
                )}
              </div>

              {isExporting && (
                <div className="space-y-4">
                  <div className="flex items-center space-x-3">
                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-green-600"></div>
                    <span className="text-sm text-gray-600">Generando exportación...</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div 
                      className="bg-green-600 h-2 rounded-full transition-all duration-300"
                      style={{ width: `${exportProgress}%` }}
                    ></div>
                  </div>
                  <div className="text-center text-sm text-gray-600">
                    {exportProgress}% completado
                  </div>
                </div>
              )}

              {!isExporting && (
                <div className="bg-blue-50/50 border border-blue-200 rounded-xl p-4">
                  <div className="flex items-start space-x-3">
                    <Info className="w-5 h-5 text-blue-600 mt-0.5" />
                    <div className="text-sm text-blue-800">
                      <p className="font-medium mb-1">Información importante:</p>
                      <ul className="list-disc list-inside space-y-1 text-blue-700">
                        <li>La exportación puede tardar unos minutos dependiendo del volumen de datos</li>
                        <li>El archivo se descargará automáticamente cuando esté listo</li>
                        <li>Los datos exportados reflejan el estado actual de la base de datos</li>
                      </ul>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer con botones */}
        <div className="flex items-center justify-between p-4 sm:p-6 border-t border-gray-200/50 bg-white flex-shrink-0">
          <div className="flex space-x-3">
            {currentStep > 1 && (
              <button
                onClick={() => setCurrentStep(prev => prev - 1)}
                disabled={isExporting}
                className="px-4 py-2 border border-gray-200 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors duration-200 disabled:opacity-50"
              >
                Anterior
              </button>
            )}
          </div>
          
          <div className="flex items-center space-x-3">
            <button
              onClick={onClose}
              disabled={isExporting}
              className="px-4 py-2 border border-gray-200 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors duration-200 disabled:opacity-50"
            >
              Cancelar
            </button>
            
            {currentStep < 3 ? (
              <button
                onClick={() => setCurrentStep(prev => prev + 1)}
                disabled={exportConfig.fields.length === 0}
                className="px-6 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed font-medium shadow-sm"
              >
                Siguiente
              </button>
            ) : (
              <button
                onClick={handleExport}
                disabled={isExporting || exportConfig.fields.length === 0}
                className="flex items-center space-x-2 px-6 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed font-medium shadow-sm"
              >
                <Download className="w-4 h-4" />
                <span>{isExporting ? 'Exportando...' : 'Exportar'}</span>
              </button>
            )}
          </div>
        </div>
      </div>
      
      {/* Modal para Guardar Configuración */}
      {showSaveDialog && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-60">
          <div className="bg-white rounded-2xl p-6 w-full max-w-md mx-4 shadow-2xl">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Guardar Configuración</h3>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Nombre de la configuración</label>
                <input
                  type="text"
                  value={saveConfigName}
                  onChange={(e) => setSaveConfigName(e.target.value)}
                  placeholder="Ej: Reporte mensual colaboradores"
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                  maxLength={50}
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Descripción (opcional)</label>
                <textarea
                  value={saveConfigDescription}
                  onChange={(e) => setSaveConfigDescription(e.target.value)}
                  placeholder="Descripción de la configuración..."
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 resize-none"
                  rows={3}
                  maxLength={200}
                />
              </div>
            </div>
            
            <div className="flex justify-end space-x-3 mt-6">
              <button
                onClick={() => {
                  setShowSaveDialog(false);
                  setSaveConfigName('');
                  setSaveConfigDescription('');
                }}
                className="px-4 py-2 text-gray-600 hover:text-gray-800 transition-colors"
              >
                Cancelar
              </button>
              <button
                onClick={handleSaveConfiguration}
                disabled={!saveConfigName.trim()}
                className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Guardar
              </button>
            </div>
          </div>
        </div>
      )}
      
      {/* Modal para Cargar Configuración */}
      {showLoadDialog && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-60">
          <div className="bg-white rounded-2xl p-6 w-full max-w-2xl mx-4 shadow-2xl max-h-[80vh] overflow-hidden">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Cargar Configuración</h3>
            
            {savedConfigurations.length === 0 ? (
              <div className="text-center py-8">
                <FolderOpen className="w-12 h-12 text-gray-400 mx-auto mb-3" />
                <p className="text-gray-600">No hay configuraciones guardadas</p>
                <p className="text-sm text-gray-500 mt-1">Guarda tu primera configuración para verla aquí</p>
              </div>
            ) : (
              <div className="space-y-3 max-h-96 overflow-y-auto">
                {savedConfigurations
                  .sort((a, b) => new Date(b.lastUsed || b.createdAt).getTime() - new Date(a.lastUsed || a.createdAt).getTime())
                  .map((savedConfig) => (
                  <div key={savedConfig.id} className="border border-gray-200 rounded-lg p-4 hover:bg-gray-50 transition-colors">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <h4 className="font-medium text-gray-900">{savedConfig.name}</h4>
                        {savedConfig.description && (
                          <p className="text-sm text-gray-600 mt-1">{savedConfig.description}</p>
                        )}
                        <div className="flex items-center space-x-4 mt-2 text-xs text-gray-500">
                          <span>Campos: {savedConfig.config.fields.length}</span>
                          <span>Formato: {EXPORT_FORMATS[savedConfig.config.format].label}</span>
                          <span>Creado: {new Date(savedConfig.createdAt).toLocaleDateString()}</span>
                          {savedConfig.lastUsed && (
                            <span>Usado: {new Date(savedConfig.lastUsed).toLocaleDateString()}</span>
                          )}
                        </div>
                      </div>
                      <div className="flex items-center space-x-2 ml-4">
                        <button
                          onClick={() => handleLoadConfiguration(savedConfig)}
                          className="px-3 py-1 bg-blue-600 hover:bg-blue-700 text-white text-sm rounded transition-colors"
                        >
                          Cargar
                        </button>
                        <button
                          onClick={() => handleDeleteConfiguration(savedConfig.id)}
                          className="p-1 text-red-600 hover:text-red-700 hover:bg-red-50 rounded transition-colors"
                          title="Eliminar configuración"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
            
            <div className="flex justify-end mt-6">
              <button
                onClick={() => setShowLoadDialog(false)}
                className="px-4 py-2 text-gray-600 hover:text-gray-800 transition-colors"
              >
                Cerrar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ExportModal;