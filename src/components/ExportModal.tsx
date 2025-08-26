import React, { useState } from 'react';
import { 
  X, 
  Download, 
  FileText, 
  FileSpreadsheet, 
  Database, 
  Calendar, 
  Filter, 
  Settings, 
  CheckCircle,
  AlertCircle,
  Info
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
  
  const config = DATA_TYPE_CONFIGS[dataType];
  const IconComponent = config.icon;
  
  // Estado del formulario de exportación
  const [exportConfig, setExportConfig] = useState<ExportConfig>({
    dataType,
    format: 'excel',
    dateRange: {
      start: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      end: new Date().toISOString().split('T')[0],
      preset: 'last30days'
    },
    filters: {},
    fields: config.defaultFields,
    includeHeaders: true,
    includeMetadata: true
  });

  // Manejar cambio de preset de fecha
  const handleDatePresetChange = (preset: string) => {
    const today = new Date();
    let start = new Date();
    let end = new Date();

    switch (preset) {
      case 'today':
        start = today;
        break;
      case 'yesterday':
        start = new Date(today.getTime() - 24 * 60 * 60 * 1000);
        end = new Date(today.getTime() - 24 * 60 * 60 * 1000);
        break;
      case 'last7days':
        start = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000);
        break;
      case 'last30days':
        start = new Date(today.getTime() - 30 * 24 * 60 * 60 * 1000);
        break;
      case 'last90days':
        start = new Date(today.getTime() - 90 * 24 * 60 * 60 * 1000);
        break;
      case 'thismonth':
        start = new Date(today.getFullYear(), today.getMonth(), 1);
        break;
      case 'lastmonth':
        start = new Date(today.getFullYear(), today.getMonth() - 1, 1);
        end = new Date(today.getFullYear(), today.getMonth(), 0);
        break;
      case 'thisyear':
        start = new Date(today.getFullYear(), 0, 1);
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
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white/95 backdrop-blur-md rounded-2xl w-full max-w-4xl max-h-[90vh] overflow-hidden border border-gray-200/50 shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200/50">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-gradient-to-r from-green-500 to-green-600 rounded-xl flex items-center justify-center">
              <IconComponent className="w-5 h-5 text-white" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-gray-900">
                {title || config.title}
              </h2>
              <p className="text-sm text-gray-600">{config.description}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100/50 rounded-lg transition-colors duration-200"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Progress Steps */}
        <div className="px-6 py-4 border-b border-gray-200/50">
          <div className="flex items-center space-x-4">
            {[1, 2, 3].map((step) => (
              <div key={step} className="flex items-center">
                <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
                  currentStep >= step
                    ? 'bg-green-500 text-white'
                    : 'bg-gray-200 text-gray-600'
                }`}>
                  {currentStep > step ? <CheckCircle className="w-4 h-4" /> : step}
                </div>
                {step < 3 && (
                  <div className={`w-16 h-1 mx-2 ${
                    currentStep > step ? 'bg-green-500' : 'bg-gray-200'
                  }`} />
                )}
              </div>
            ))}
          </div>
          <div className="flex justify-between mt-2 text-xs text-gray-600">
            <span>Formato</span>
            <span>Filtros</span>
            <span>Exportar</span>
          </div>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto max-h-[60vh]">
          {/* Paso 1: Selección de formato */}
          {currentStep === 1 && (
            <div className="space-y-6">
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Seleccionar Formato de Exportación</h3>
                <div className="grid grid-cols-2 gap-4">
                  {Object.entries(EXPORT_FORMATS).map(([key, format]) => {
                    const FormatIcon = format.icon;
                    return (
                      <button
                        key={key}
                        onClick={() => setExportConfig(prev => ({ ...prev, format: key as ExportFormat }))}
                        className={`p-4 border-2 rounded-xl transition-all duration-200 text-left ${
                          exportConfig.format === key
                            ? 'border-green-500 bg-green-50/50'
                            : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50/50'
                        }`}
                      >
                        <div className="flex items-center space-x-3">
                          <FormatIcon className={`w-6 h-6 ${
                            exportConfig.format === key ? 'text-green-600' : 'text-gray-600'
                          }`} />
                          <div>
                            <div className="font-medium text-gray-900">{format.label}</div>
                            <div className="text-sm text-gray-600">{format.description}</div>
                          </div>
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>

              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Seleccionar Campos a Exportar</h3>
                <div className="grid grid-cols-2 gap-3">
                  {availableFields.map((field) => (
                    <label key={field.key} className="flex items-center space-x-3 p-3 rounded-lg hover:bg-gray-50/50 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={exportConfig.fields.includes(field.key)}
                        onChange={() => handleFieldToggle(field.key)}
                        className="w-4 h-4 text-green-600 border-gray-300 rounded focus:ring-green-500"
                      />
                      <span className="text-sm font-medium text-gray-900">{field.label}</span>
                      <span className="text-xs text-gray-500 capitalize">({field.type})</span>
                    </label>
                  ))}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <label className="flex items-center space-x-3">
                  <input
                    type="checkbox"
                    checked={exportConfig.includeHeaders}
                    onChange={(e) => setExportConfig(prev => ({ ...prev, includeHeaders: e.target.checked }))}
                    className="w-4 h-4 text-green-600 border-gray-300 rounded focus:ring-green-500"
                  />
                  <span className="text-sm font-medium text-gray-900">Incluir encabezados</span>
                </label>
                <label className="flex items-center space-x-3">
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
            <div className="space-y-6">
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Rango de Fechas</h3>
                <div className="grid grid-cols-3 gap-4 mb-4">
                  {DATE_PRESETS.map((preset) => (
                    <button
                      key={preset.value}
                      onClick={() => handleDatePresetChange(preset.value)}
                      className={`p-3 text-sm rounded-lg border transition-colors duration-200 ${
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
                  <div className="grid grid-cols-2 gap-4">
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
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold text-gray-900">Filtros Avanzados</h3>
                  
                  <div className="grid grid-cols-2 gap-4">
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
                  
                  <div className="grid grid-cols-2 gap-4">
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
            <div className="space-y-6">
              <h3 className="text-lg font-semibold text-gray-900">Resumen de Exportación</h3>
              
              <div className="bg-gray-50/50 rounded-xl p-4 space-y-3">
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600">Formato:</span>
                  <span className="text-sm font-medium text-gray-900">
                    {EXPORT_FORMATS[exportConfig.format].label}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600">Período:</span>
                  <span className="text-sm font-medium text-gray-900">
                    {exportConfig.dateRange.start} a {exportConfig.dateRange.end}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600">Campos seleccionados:</span>
                  <span className="text-sm font-medium text-gray-900">
                    {exportConfig.fields.length} campos
                  </span>
                </div>
                {Object.keys(exportConfig.filters).length > 0 && (
                  <div className="flex justify-between">
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
        <div className="flex items-center justify-between p-6 border-t border-gray-200/50">
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
          
          <div className="flex space-x-3">
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
                className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Siguiente
              </button>
            ) : (
              <button
                onClick={handleExport}
                disabled={isExporting || exportConfig.fields.length === 0}
                className="flex items-center space-x-2 px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <Download className="w-4 h-4" />
                <span>{isExporting ? 'Exportando...' : 'Exportar'}</span>
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ExportModal;