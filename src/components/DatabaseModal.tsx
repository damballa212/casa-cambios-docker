import React, { useState, useEffect } from 'react';
import {
  X,
  Database,
  AlertTriangle,
  Shield,
  RefreshCw,
  Info,
  FileText,
  Clock
} from 'lucide-react';
import { apiService } from '../services/api';

interface DatabaseModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (message: string) => void;
  onError: (message: string) => void;
}

interface DatabaseStats {
  totalTables: number;
  totalRecords: number;
  databaseSize: string;
  lastBackup: string | null;
}

const DatabaseModal: React.FC<DatabaseModalProps> = ({ isOpen, onClose, onSuccess, onError }) => {
  const [activeTab, setActiveTab] = useState<'info' | 'format'>('info');
  const [databaseStats, setDatabaseStats] = useState<DatabaseStats | null>(null);
  const [isLoadingStats, setIsLoadingStats] = useState(false);
  
  // Estados para formateo
  const [formatStep, setFormatStep] = useState(1);
  const [confirmationCode, setConfirmationCode] = useState('');
  const [userConfirmation, setUserConfirmation] = useState('');
  const [securityChecks, setSecurityChecks] = useState({
    backupConfirmed: false,
    dataLossUnderstood: false,
    operationCritical: false,
    responsibilityAccepted: false
  });
  const [isFormatting, setIsFormatting] = useState(false);
  const [formatProgress, setFormatProgress] = useState(0);

  useEffect(() => {
    if (isOpen && activeTab === 'info') {
      loadDatabaseStats();
    }
  }, [isOpen, activeTab]);

  const loadDatabaseStats = async () => {
    try {
      setIsLoadingStats(true);
      // Simular carga de estadísticas (en un caso real, esto vendría del backend)
      await new Promise(resolve => setTimeout(resolve, 1000));
      setDatabaseStats({
        totalTables: 4,
        totalRecords: 1250,
        databaseSize: '15.2 MB',
        lastBackup: new Date().toISOString()
      });
    } catch (error) {
      onError('Error cargando estadísticas de la base de datos');
    } finally {
      setIsLoadingStats(false);
    }
  };

  const handleFormatDatabase = async () => {
    // Validar checkboxes de seguridad
    const allChecksCompleted = Object.values(securityChecks).every(check => check);
    if (!allChecksCompleted) {
      onError('Debe completar todas las confirmaciones de seguridad');
      return;
    }

    // Validar códigos simplificados
    if (confirmationCode !== 'FORMAT2024' || userConfirmation !== 'CONFIRMO') {
      onError('Códigos de confirmación incorrectos');
      return;
    }

    try {
      setIsFormatting(true);
      setFormatProgress(0);
      
      // Simular progreso
      const progressSteps = [
        { step: 1, message: 'Creando backup de seguridad...', progress: 20 },
        { step: 2, message: 'Eliminando transacciones...', progress: 40 },
        { step: 3, message: 'Eliminando clientes...', progress: 60 },
        { step: 4, message: 'Protegiendo colaboradores...', progress: 80 },
        { step: 5, message: 'Reseteando configuraciones...', progress: 90 },
        { step: 6, message: 'Finalizando formateo...', progress: 100 }
      ];

      for (const step of progressSteps) {
        await new Promise(resolve => setTimeout(resolve, 1000));
        setFormatProgress(step.progress);
      }

      const result = await apiService.formatDatabase(confirmationCode, userConfirmation);
      
      if (result.success) {
        onSuccess(`Base de datos formateada exitosamente. Backup creado: ${result.details.backupCreated?.backupId || 'N/A'}`);
        setConfirmationCode('');
        setUserConfirmation('');
        setFormatStep(1);
        setActiveTab('info');
        await loadDatabaseStats();
      } else {
        onError('Error al formatear la base de datos');
      }
    } catch (error: any) {
      onError(`Error al formatear la base de datos: ${error.message}`);
    } finally {
      setIsFormatting(false);
      setFormatProgress(0);
    }
  };

  const resetFormatForm = () => {
    setFormatStep(1);
    setConfirmationCode('');
    setUserConfirmation('');
    setSecurityChecks({
      backupConfirmed: false,
      dataLossUnderstood: false,
      operationCritical: false,
      responsibilityAccepted: false
    });
    setFormatProgress(0);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white p-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <Database className="w-8 h-8" />
              <div>
                <h2 className="text-2xl font-bold">Gestión de Base de Datos</h2>
                <p className="text-blue-100">Información y herramientas avanzadas</p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-2 hover:bg-white/20 rounded-lg transition-colors"
            >
              <X className="w-6 h-6" />
            </button>
          </div>
        </div>

        {/* Tabs */}
        <div className="border-b border-gray-200">
          <nav className="flex space-x-8 px-6">
            {[
              { id: 'info', label: 'Información', icon: Info },
              { id: 'format', label: 'Formateo', icon: AlertTriangle }
            ].map((tab) => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => {
                    setActiveTab(tab.id as any);
                    if (tab.id === 'format') resetFormatForm();
                  }}
                  className={`flex items-center space-x-2 py-4 px-2 border-b-2 font-medium text-sm transition-colors ${
                    activeTab === tab.id
                      ? 'border-blue-500 text-blue-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  <span>{tab.label}</span>
                </button>
              );
            })}
          </nav>
        </div>

        {/* Content */}
        <div className="p-6 max-h-[60vh] overflow-y-auto">
          {/* Información de la Base de Datos */}
          {activeTab === 'info' && (
            <div className="space-y-6">
              <h3 className="text-lg font-semibold text-gray-900">Estado de la Base de Datos</h3>
              
              {isLoadingStats ? (
                <div className="text-center py-8">
                  <RefreshCw className="w-8 h-8 text-blue-500 animate-spin mx-auto mb-2" />
                  <p className="text-gray-600">Cargando estadísticas...</p>
                </div>
              ) : databaseStats ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
                    <div className="flex items-center space-x-3 mb-3">
                      <Database className="w-6 h-6 text-blue-600" />
                      <h4 className="font-semibold text-blue-800">Estructura</h4>
                    </div>
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span className="text-blue-700">Total de Tablas:</span>
                        <span className="font-medium text-blue-800">{databaseStats.totalTables}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-blue-700">Total de Registros:</span>
                        <span className="font-medium text-blue-800">{databaseStats.totalRecords.toLocaleString()}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-blue-700">Tamaño:</span>
                        <span className="font-medium text-blue-800">{databaseStats.databaseSize}</span>
                      </div>
                    </div>
                  </div>

                  <div className="bg-green-50 border border-green-200 rounded-xl p-4">
                    <div className="flex items-center space-x-3 mb-3">
                      <Shield className="w-6 h-6 text-green-600" />
                      <h4 className="font-semibold text-green-800">Respaldos</h4>
                    </div>
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span className="text-green-700">Último Backup:</span>
                        <span className="font-medium text-green-800">
                          {databaseStats.lastBackup 
                            ? new Date(databaseStats.lastBackup).toLocaleString('es-ES')
                            : 'Nunca'
                          }
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-green-700">Estado:</span>
                        <span className="font-medium text-green-800">Protegida</span>
                      </div>
                    </div>
                  </div>

                  <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-4">
                    <div className="flex items-center space-x-3 mb-3">
                      <FileText className="w-6 h-6 text-yellow-600" />
                      <h4 className="font-semibold text-yellow-800">Tablas Principales</h4>
                    </div>
                    <div className="space-y-1 text-sm text-yellow-700">
                      <div>• global_rate (Tasas de cambio)</div>
                      <div>• collaborators (Colaboradores)</div>
                      <div>• clients (Clientes)</div>
                      <div>• transactions (Transacciones)</div>
                    </div>
                  </div>

                  <div className="bg-purple-50 border border-purple-200 rounded-xl p-4">
                    <div className="flex items-center space-x-3 mb-3">
                      <Clock className="w-6 h-6 text-purple-600" />
                      <h4 className="font-semibold text-purple-800">Rendimiento</h4>
                    </div>
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span className="text-purple-700">Conexiones Activas:</span>
                        <span className="font-medium text-purple-800">3/20</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-purple-700">Tiempo de Respuesta:</span>
                        <span className="font-medium text-purple-800">&lt; 50ms</span>
                      </div>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="text-center py-8 text-gray-500">
                  <Database className="w-12 h-12 mx-auto mb-4 text-gray-300" />
                  <p>Error cargando información de la base de datos</p>
                  <button
                    onClick={loadDatabaseStats}
                    className="mt-4 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
                  >
                    Reintentar
                  </button>
                </div>
              )}
            </div>
          )}

          {/* Formateo de Base de Datos */}
          {activeTab === 'format' && (
            <div className="space-y-6">
              <div className="bg-red-50 border border-red-200 rounded-xl p-4">
                <div className="flex items-center space-x-2 mb-3">
                  <AlertTriangle className="w-6 h-6 text-red-600" />
                  <h3 className="text-lg font-semibold text-red-800">⚠️ OPERACIÓN CRÍTICA</h3>
                </div>
                <p className="text-red-700 text-sm mb-2">
                  El formateo eliminará TODAS las transacciones y clientes. Los colaboradores Gabriel Zambrano, Anael y Patty serán protegidos.
                </p>
                <p className="text-red-700 text-sm font-medium">
                  Se creará un backup automático antes del formateo.
                </p>
              </div>

              {!isFormatting ? (
                <div className="space-y-6">
                  {/* Paso 1: Advertencias */}
                  {formatStep >= 1 && (
                    <div className="bg-gradient-to-br from-red-50 to-orange-50 border border-red-200 rounded-xl p-6">
                      <h4 className="font-semibold text-red-800 mb-4 flex items-center">
                        <AlertTriangle className="w-5 h-5 mr-2" />
                        Confirmaciones de Seguridad
                      </h4>
                      
                      {/* Checkboxes de seguridad */}
                      <div className="space-y-4 mb-6">
                        <label className="flex items-start space-x-3 cursor-pointer group">
                          <input
                            type="checkbox"
                            checked={securityChecks.backupConfirmed}
                            onChange={(e) => setSecurityChecks(prev => ({...prev, backupConfirmed: e.target.checked}))}
                            className="mt-1 w-4 h-4 text-red-600 border-red-300 rounded focus:ring-red-500"
                          />
                          <span className="text-sm text-red-700 group-hover:text-red-800 transition-colors">
                            ✅ Confirmo que se creará un <strong>backup automático</strong> antes del formateo
                          </span>
                        </label>
                        
                        <label className="flex items-start space-x-3 cursor-pointer group">
                          <input
                            type="checkbox"
                            checked={securityChecks.dataLossUnderstood}
                            onChange={(e) => setSecurityChecks(prev => ({...prev, dataLossUnderstood: e.target.checked}))}
                            className="mt-1 w-4 h-4 text-red-600 border-red-300 rounded focus:ring-red-500"
                          />
                          <span className="text-sm text-red-700 group-hover:text-red-800 transition-colors">
                            ⚠️ Entiendo que <strong>TODAS las transacciones y clientes</strong> serán eliminados
                          </span>
                        </label>
                        
                        <label className="flex items-start space-x-3 cursor-pointer group">
                          <input
                            type="checkbox"
                            checked={securityChecks.operationCritical}
                            onChange={(e) => setSecurityChecks(prev => ({...prev, operationCritical: e.target.checked}))}
                            className="mt-1 w-4 h-4 text-red-600 border-red-300 rounded focus:ring-red-500"
                          />
                          <span className="text-sm text-red-700 group-hover:text-red-800 transition-colors">
                            🔥 Reconozco que esta es una <strong>operación crítica e irreversible</strong>
                          </span>
                        </label>
                        
                        <label className="flex items-start space-x-3 cursor-pointer group">
                          <input
                            type="checkbox"
                            checked={securityChecks.responsibilityAccepted}
                            onChange={(e) => setSecurityChecks(prev => ({...prev, responsibilityAccepted: e.target.checked}))}
                            className="mt-1 w-4 h-4 text-red-600 border-red-300 rounded focus:ring-red-500"
                          />
                          <span className="text-sm text-red-700 group-hover:text-red-800 transition-colors">
                            👤 Acepto la <strong>responsabilidad completa</strong> de esta acción
                          </span>
                        </label>
                      </div>
                      
                      {/* Códigos simplificados */}
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <label className="block text-sm font-medium text-red-700 mb-2">
                            Código Técnico:
                          </label>
                          <input
                            type="text"
                            value={confirmationCode}
                            onChange={(e) => setConfirmationCode(e.target.value.toUpperCase())}
                            placeholder="FORMAT2024"
                            className="w-full px-4 py-3 border border-red-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-red-500 bg-white font-mono text-center"
                            maxLength={10}
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-red-700 mb-2">
                            Confirmación Final:
                          </label>
                          <input
                            type="text"
                            value={userConfirmation}
                            onChange={(e) => setUserConfirmation(e.target.value.toUpperCase())}
                            placeholder="CONFIRMO"
                            className="w-full px-4 py-3 border border-red-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-red-500 bg-white font-mono text-center"
                            maxLength={8}
                          />
                        </div>
                      </div>
                      
                      <div className="mt-4 p-3 bg-red-100 border border-red-200 rounded-lg">
                        <p className="text-xs text-red-600 text-center">
                          💡 <strong>Tip:</strong> Los códigos son más cortos y simples. Solo escriba exactamente lo que aparece en el placeholder.
                        </p>
                      </div>
                    </div>
                  )}

                  {/* Botones de acción */}
                  <div className="flex justify-between">
                    <button
                      onClick={() => {
                        resetFormatForm();
                        setActiveTab('info');
                      }}
                      className="px-6 py-3 bg-gray-500 hover:bg-gray-600 text-white rounded-lg transition-colors"
                    >
                      Cancelar
                    </button>
                    <button
                      onClick={handleFormatDatabase}
                      disabled={
                        !Object.values(securityChecks).every(check => check) ||
                        confirmationCode !== 'FORMAT2024' ||
                        userConfirmation !== 'CONFIRMO'
                      }
                      className="px-6 py-3 bg-red-600 hover:bg-red-700 disabled:bg-red-400 text-white rounded-lg transition-colors font-medium flex items-center space-x-2"
                    >
                      <AlertTriangle className="w-4 h-4" />
                      <span>Formatear Base de Datos</span>
                    </button>
                  </div>
                </div>
              ) : (
                <div className="bg-blue-50 border border-blue-200 rounded-xl p-6">
                  <div className="text-center">
                    <RefreshCw className="w-12 h-12 text-blue-600 animate-spin mx-auto mb-4" />
                    <h4 className="text-lg font-semibold text-blue-800 mb-2">Formateando Base de Datos...</h4>
                    <p className="text-blue-700 mb-4">Por favor espere, esta operación puede tomar varios minutos.</p>
                    
                    {/* Barra de progreso */}
                    <div className="w-full bg-blue-200 rounded-full h-3 mb-4">
                      <div 
                        className="bg-blue-600 h-3 rounded-full transition-all duration-500 ease-out"
                        style={{ width: `${formatProgress}%` }}
                      ></div>
                    </div>
                    <p className="text-sm text-blue-600 font-medium">{formatProgress}% completado</p>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default DatabaseModal;