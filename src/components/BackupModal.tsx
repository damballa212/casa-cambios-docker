import React, { useState, useEffect } from 'react';
import {
  X,
  Database,
  Download,
  Upload,
  RefreshCw,
  Calendar,
  HardDrive,
  Users,
  FileText
} from 'lucide-react';
import { apiService } from '../services/api';

interface BackupModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (message: string) => void;
  onError: (message: string) => void;
}

interface Backup {
  id: string;
  type: string;
  description: string;
  createdAt: string;
  createdBy: string;
  totalRecords: number;
  fileSize: number;
  status: string;
  tablesIncluded: string[];
}

const BackupModal: React.FC<BackupModalProps> = ({ isOpen, onClose, onSuccess, onError }) => {
  const [activeTab, setActiveTab] = useState<'list' | 'create' | 'restore' | 'import'>('list');
  const [backups, setBackups] = useState<Backup[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [selectedBackup, setSelectedBackup] = useState<string | null>(null);
  const [restoreConfirmation, setRestoreConfirmation] = useState('');
  const [newBackupDescription, setNewBackupDescription] = useState('');
  const [isCreating, setIsCreating] = useState(false);
  const [isRestoring, setIsRestoring] = useState(false);
  const [isDownloading, setIsDownloading] = useState<string | null>(null);
  const [isImporting, setIsImporting] = useState(false);
  const [importFile, setImportFile] = useState<File | null>(null);
  const [importDescription, setImportDescription] = useState('');

  useEffect(() => {
    if (isOpen) {
      loadBackups();
    }
  }, [isOpen]);

  const loadBackups = async () => {
    try {
      setIsLoading(true);
      const response = await apiService.listBackups();
      if (response.success) {
        setBackups(response.backups);
      } else {
        onError('Error cargando lista de backups');
      }
    } catch (error: any) {
      onError(`Error cargando backups: ${error.message}`);
    } finally {
      setIsLoading(false);
    }
  };

  const handleCreateBackup = async () => {
    if (!newBackupDescription.trim()) {
      onError('Por favor ingrese una descripción para el backup');
      return;
    }

    try {
      setIsCreating(true);
      const response = await apiService.createBackup(newBackupDescription);
      if (response.success) {
        onSuccess(`Backup creado exitosamente: ${response.backup.id}`);
        setNewBackupDescription('');
        await loadBackups();
        setActiveTab('list');
      } else {
        onError('Error creando backup');
      }
    } catch (error: any) {
      onError(`Error creando backup: ${error.message}`);
    } finally {
      setIsCreating(false);
    }
  };

  const handleRestoreBackup = async () => {
    if (!selectedBackup) return;
    if (restoreConfirmation !== 'RESTORE2024') {
      onError('Código de confirmación incorrecto. Escriba: RESTORE2024');
      return;
    }

    try {
      setIsRestoring(true);
      const response = await apiService.restoreBackup(selectedBackup, restoreConfirmation);
      if (response.success) {
        onSuccess(`Backup restaurado exitosamente: ${response.restoration.backupId}`);
        setSelectedBackup(null);
        setRestoreConfirmation('');
        setActiveTab('list');
      } else {
        onError('Error restaurando backup');
      }
    } catch (error: any) {
      onError(`Error restaurando backup: ${error.message}`);
    } finally {
      setIsRestoring(false);
    }
  };

  const handleDeleteBackup = async (backupId: string) => {
    if (!window.confirm('¿Está seguro de eliminar este backup?')) return;

    try {
      const response = await apiService.deleteBackup(backupId);
      if (response.success) {
        onSuccess('Backup eliminado exitosamente');
        await loadBackups();
      } else {
        onError('Error eliminando backup');
      }
    } catch (error: any) {
      onError(`Error eliminando backup: ${error.message}`);
    }
  };

  const handleDownloadBackup = async (backupId: string) => {
    try {
      setIsDownloading(backupId);
      const response = await apiService.downloadBackup(backupId);
      if (response.success) {
        onSuccess(`Backup descargado: ${response.filename}`);
      } else {
        onError('Error descargando backup');
      }
    } catch (error: any) {
      onError(`Error descargando backup: ${error.message}`);
    } finally {
      setIsDownloading(null);
    }
  };

  const handleImportBackup = async () => {
    if (!importFile) {
      onError('Por favor seleccione un archivo de backup');
      return;
    }

    try {
      setIsImporting(true);
      const response = await apiService.importBackup(importFile, importDescription);
      if (response.success) {
        onSuccess(`Backup importado exitosamente: ${response.backup.id}`);
        setImportFile(null);
        setImportDescription('');
        await loadBackups();
        setActiveTab('list');
      } else {
        onError('Error importando backup');
      }
    } catch (error: any) {
      onError(`Error importando backup: ${error.message}`);
    } finally {
      setIsImporting(false);
    }
  };

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      if (file.type === 'application/json' || file.name.endsWith('.json')) {
        setImportFile(file);
      } else {
        onError('Por favor seleccione un archivo JSON válido');
        event.target.value = '';
      }
    }
  };

  const formatBytes = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString('es-ES', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed': return 'bg-green-100 text-green-800';
      case 'failed': return 'bg-red-100 text-red-800';
      case 'in_progress': return 'bg-yellow-100 text-yellow-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'manual': return 'bg-blue-100 text-blue-800';
      case 'auto': return 'bg-green-100 text-green-800';
      case 'pre-format': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-6xl max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="bg-gradient-to-r from-blue-600 to-purple-600 text-white p-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <Database className="w-8 h-8" />
              <div>
                <h2 className="text-2xl font-bold">Sistema de Backups</h2>
                <p className="text-blue-100">Gestión completa de respaldos de base de datos</p>
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
              { id: 'list', label: 'Lista de Backups', icon: FileText },
              { id: 'create', label: 'Crear Backup', icon: Download },
              { id: 'restore', label: 'Restaurar', icon: Upload },
              { id: 'import', label: 'Importar', icon: Upload }
            ].map((tab) => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id as any)}
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
          {/* Lista de Backups */}
          {activeTab === 'list' && (
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <h3 className="text-lg font-semibold text-gray-900">Backups Disponibles</h3>
                <button
                  onClick={loadBackups}
                  disabled={isLoading}
                  className="flex items-center space-x-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white rounded-lg transition-colors"
                >
                  <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
                  <span>Actualizar</span>
                </button>
              </div>

              {isLoading ? (
                <div className="text-center py-8">
                  <RefreshCw className="w-8 h-8 text-blue-500 animate-spin mx-auto mb-2" />
                  <p className="text-gray-600">Cargando backups...</p>
                </div>
              ) : backups.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  <Database className="w-12 h-12 mx-auto mb-4 text-gray-300" />
                  <p>No hay backups disponibles</p>
                </div>
              ) : (
                <div className="grid gap-4">
                  {backups.map((backup) => (
                    <div key={backup.id} className="bg-gray-50 border border-gray-200 rounded-xl p-4">
                      <div className="flex justify-between items-start">
                        <div className="flex-1">
                          <div className="flex items-center space-x-2 mb-2">
                            <span className={`px-2 py-1 rounded text-xs font-medium ${getTypeColor(backup.type)}`}>
                              {backup.type.toUpperCase()}
                            </span>
                            <span className={`px-2 py-1 rounded text-xs font-medium ${getStatusColor(backup.status)}`}>
                              {backup.status}
                            </span>
                          </div>
                          <h4 className="font-medium text-gray-900 mb-1">{backup.id}</h4>
                          <p className="text-sm text-gray-600 mb-2">{backup.description || 'Sin descripción'}</p>
                          <div className="grid grid-cols-2 gap-4 text-sm text-gray-500">
                            <div className="flex items-center space-x-1">
                              <Calendar className="w-4 h-4" />
                              <span>{formatDate(backup.createdAt)}</span>
                            </div>
                            <div className="flex items-center space-x-1">
                              <Users className="w-4 h-4" />
                              <span>{backup.createdBy}</span>
                            </div>
                            <div className="flex items-center space-x-1">
                              <Database className="w-4 h-4" />
                              <span>{backup.totalRecords.toLocaleString()} registros</span>
                            </div>
                            <div className="flex items-center space-x-1">
                              <HardDrive className="w-4 h-4" />
                              <span>{formatBytes(backup.fileSize)}</span>
                            </div>
                          </div>
                          <div className="mt-2">
                            <span className="text-xs text-gray-500">
                              Tablas: {backup.tablesIncluded.join(', ')}
                            </span>
                          </div>
                        </div>
                        <div className="flex flex-col space-y-2 ml-4">
                          <button
                            onClick={() => handleDownloadBackup(backup.id)}
                            disabled={isDownloading === backup.id}
                            className="px-3 py-1 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white rounded text-sm transition-colors flex items-center space-x-1"
                          >
                            {isDownloading === backup.id ? (
                              <RefreshCw className="w-3 h-3 animate-spin" />
                            ) : (
                              <Download className="w-3 h-3" />
                            )}
                            <span>{isDownloading === backup.id ? 'Descargando...' : 'Descargar'}</span>
                          </button>
                          <button
                            onClick={() => {
                              setSelectedBackup(backup.id);
                              setActiveTab('restore');
                            }}
                            className="px-3 py-1 bg-green-600 hover:bg-green-700 text-white rounded text-sm transition-colors"
                          >
                            Restaurar
                          </button>
                          <button
                            onClick={() => handleDeleteBackup(backup.id)}
                            className="px-3 py-1 bg-red-600 hover:bg-red-700 text-white rounded text-sm transition-colors"
                          >
                            Eliminar
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Crear Backup */}
          {activeTab === 'create' && (
            <div className="space-y-6">
              <h3 className="text-lg font-semibold text-gray-900">Crear Nuevo Backup</h3>
              
              <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
                <div className="flex items-center space-x-2 mb-3">
                  <Database className="w-5 h-5 text-blue-600" />
                  <h4 className="font-medium text-blue-800">Información del Backup</h4>
                </div>
                
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-blue-700 mb-2">
                      Descripción del Backup:
                    </label>
                    <input
                      type="text"
                      value={newBackupDescription}
                      onChange={(e) => setNewBackupDescription(e.target.value)}
                      placeholder="Ej: Backup antes de actualización importante"
                      className="w-full px-4 py-3 border border-blue-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 bg-blue-50"
                    />
                  </div>
                  
                  <div className="bg-blue-100 border border-blue-300 rounded-lg p-3">
                    <p className="text-blue-800 text-sm font-medium mb-1">📊 Tablas incluidas:</p>
                    <p className="text-blue-700 text-sm">
                      global_rate, collaborators, clients, transactions
                    </p>
                  </div>
                  
                  <button
                    onClick={handleCreateBackup}
                    disabled={!newBackupDescription.trim() || isCreating}
                    className="flex items-center space-x-2 px-6 py-3 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white rounded-lg transition-colors font-medium"
                  >
                    {isCreating ? (
                      <RefreshCw className="w-5 h-5 animate-spin" />
                    ) : (
                      <Download className="w-5 h-5" />
                    )}
                    <span>{isCreating ? 'Creando Backup...' : 'Crear Backup'}</span>
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Restaurar Backup */}
          {activeTab === 'restore' && (
            <div className="space-y-6">
              <h3 className="text-lg font-semibold text-gray-900">Restaurar Backup</h3>
              
              {selectedBackup ? (
                <div className="bg-gradient-to-br from-green-50 to-emerald-50 border border-green-200 rounded-xl p-6">
                  <div className="flex items-center space-x-2 mb-4">
                    <Upload className="w-5 h-5 text-green-600" />
                    <h4 className="font-semibold text-green-800">Confirmar Restauración</h4>
                  </div>
                  
                  <div className="space-y-4">
                    <div className="p-4 bg-green-100 border border-green-200 rounded-lg">
                      <p className="text-green-700 text-sm font-medium mb-2">
                        ⚠️ Esta acción reemplazará todos los datos actuales con los del backup: <strong>{selectedBackup}</strong>
                      </p>
                      <p className="text-green-600 text-xs">
                        Los datos actuales serán reemplazados. Se creará un backup automático antes de proceder.
                      </p>
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-green-700 mb-2">
                        Código de Confirmación:
                      </label>
                      <input
                        type="text"
                        value={restoreConfirmation}
                        onChange={(e) => setRestoreConfirmation(e.target.value.toUpperCase())}
                        placeholder="RESTORE2024"
                        className="w-full px-4 py-3 border border-green-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-green-500 bg-white font-mono text-center"
                        maxLength={11}
                      />
                    </div>
                    
                    <div className="p-3 bg-green-100 border border-green-200 rounded-lg">
                      <p className="text-xs text-green-600 text-center">
                        💡 <strong>Tip:</strong> Escriba exactamente "RESTORE2024" para confirmar la restauración.
                      </p>
                    </div>
                    
                    <div className="flex space-x-3">
                      <button
                        onClick={() => {
                          setSelectedBackup(null);
                          setRestoreConfirmation('');
                        }}
                        className="px-4 py-2 bg-gray-500 hover:bg-gray-600 text-white rounded-lg transition-colors"
                      >
                        Cancelar
                      </button>
                      <button
                        onClick={handleRestoreBackup}
                        disabled={restoreConfirmation !== 'RESTORE2024' || isRestoring}
                        className="flex items-center space-x-2 px-4 py-2 bg-green-600 hover:bg-green-700 disabled:bg-green-400 text-white rounded-lg transition-colors"
                      >
                        {isRestoring ? (
                          <RefreshCw className="w-4 h-4 animate-spin" />
                        ) : (
                          <Upload className="w-4 h-4" />
                        )}
                        <span>{isRestoring ? 'Restaurando...' : 'Confirmar Restauración'}</span>
                      </button>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="text-center py-8 text-gray-500">
                  <Upload className="w-12 h-12 mx-auto mb-4 text-gray-300" />
                  <p>Seleccione un backup de la lista para restaurar</p>
                  <button
                    onClick={() => setActiveTab('list')}
                    className="mt-4 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
                  >
                    Ver Lista de Backups
                  </button>
                </div>
              )}
            </div>
          )}

          {/* Importar Backup */}
          {activeTab === 'import' && (
            <div className="space-y-6">
              <h3 className="text-lg font-semibold text-gray-900">Importar Backup</h3>
              
              <div className="bg-purple-50 border border-purple-200 rounded-xl p-4">
                <div className="flex items-center space-x-2 mb-3">
                  <Upload className="w-5 h-5 text-purple-600" />
                  <h4 className="font-medium text-purple-800">Seleccionar Archivo de Backup</h4>
                </div>
                
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-purple-700 mb-2">
                      Archivo JSON de Backup:
                    </label>
                    <input
                      type="file"
                      accept=".json,application/json"
                      onChange={handleFileChange}
                      className="w-full px-4 py-3 border border-purple-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500 bg-purple-50 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-medium file:bg-purple-600 file:text-white hover:file:bg-purple-700"
                    />
                    {importFile && (
                      <p className="mt-2 text-sm text-purple-700">
                        Archivo seleccionado: <strong>{importFile.name}</strong> ({(importFile.size / 1024).toFixed(2)} KB)
                      </p>
                    )}
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-purple-700 mb-2">
                      Descripción (opcional):
                    </label>
                    <input
                      type="text"
                      value={importDescription}
                      onChange={(e) => setImportDescription(e.target.value)}
                      placeholder="Ej: Backup de producción del 01/09/2025"
                      className="w-full px-4 py-3 border border-purple-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500 bg-purple-50"
                    />
                  </div>
                  
                  <div className="bg-purple-100 border border-purple-300 rounded-lg p-3">
                    <p className="text-purple-800 text-sm font-medium mb-1">📋 Requisitos del archivo:</p>
                    <ul className="text-purple-700 text-sm space-y-1">
                      <li>• Formato JSON válido</li>
                      <li>• Debe contener metadatos y datos de tablas</li>
                      <li>• Tamaño máximo: 10MB</li>
                      <li>• Versión compatible: 1.0.0</li>
                    </ul>
                  </div>
                  
                  <div className="flex space-x-3">
                    <button
                      onClick={() => {
                        setImportFile(null);
                        setImportDescription('');
                        setActiveTab('list');
                      }}
                      className="px-4 py-2 bg-gray-500 hover:bg-gray-600 text-white rounded-lg transition-colors"
                    >
                      Cancelar
                    </button>
                    <button
                      onClick={handleImportBackup}
                      disabled={!importFile || isImporting}
                      className="flex items-center space-x-2 px-6 py-3 bg-purple-600 hover:bg-purple-700 disabled:bg-purple-400 text-white rounded-lg transition-colors font-medium"
                    >
                      {isImporting ? (
                        <RefreshCw className="w-5 h-5 animate-spin" />
                      ) : (
                        <Upload className="w-5 h-5" />
                      )}
                      <span>{isImporting ? 'Importando...' : 'Importar Backup'}</span>
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default BackupModal;