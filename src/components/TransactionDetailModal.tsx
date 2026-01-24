import React, { useState } from 'react';
import {
  X,
  User,
  DollarSign,
  Hash,
  Download,
  CheckCircle,
  Clock,
  AlertTriangle,
  Copy,
  Receipt
} from 'lucide-react';
import ExportModal from './ExportModal';

interface Transaction {
  id: string;
  fecha: string;
  cliente: string;
  colaborador: string;
  usdTotal: number;
  comision: number;
  usdNeto: number;
  montoGs: number;
  tasaUsada: number;
  status: string;
  chatId: string;
  idempotencyKey: string;
  gananciaGabriel?: number;
  gananciaColaborador?: number;
}

interface TransactionDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  transaction: Transaction | null;
}

const TransactionDetailModal: React.FC<TransactionDetailModalProps> = ({
  isOpen,
  onClose,
  transaction
}) => {
  const [showExportModal, setShowExportModal] = useState(false);
  const [copiedField, setCopiedField] = useState<string | null>(null);

  if (!isOpen || !transaction) return null;

  const copyToClipboard = async (text: string, fieldName: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedField(fieldName);
      setTimeout(() => setCopiedField(null), 2000);
    } catch (err) {
      console.error('Error copying to clipboard:', err);
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed':
        return <CheckCircle className="w-5 h-5 text-green-500" />;
      case 'processing':
        return <Clock className="w-5 h-5 text-yellow-500" />;
      case 'error':
        return <AlertTriangle className="w-5 h-5 text-red-500" />;
      default:
        return <Clock className="w-5 h-5 text-gray-500" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed':
        return 'bg-green-100 text-green-800';
      case 'processing':
        return 'bg-yellow-100 text-yellow-800';
      case 'error':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'completed':
        return 'Completada';
      case 'processing':
        return 'Procesando';
      case 'error':
        return 'Error';
      default:
        return 'Desconocido';
    }
  };

  const handleExportSingle = async (config: any) => {
    // Crear un array con solo esta transacción para el export
    // Aquí puedes implementar la lógica de exportación específica
    // Por ahora, simularemos el proceso
    console.log('Exportando transacción individual:', transaction.id, 'con configuración:', config);
    
    // Simular delay de exportación
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    // Generar nombre de archivo específico para la transacción
    const timestamp = new Date().toISOString().split('T')[0];
    const filename = config.customFilename || `factura_${transaction.id}_${timestamp}`;
    
    // Aquí implementarías la generación del archivo específico
    console.log('Archivo generado:', filename);
  };

  return (
    <>
      <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
        <div className="bg-white/95 backdrop-blur-md rounded-2xl w-full max-w-4xl max-h-[90vh] overflow-hidden border border-gray-200/50 shadow-2xl">
          {/* Header */}
          <div className="flex items-center justify-between p-6 border-b border-gray-200/50 bg-gradient-to-r from-blue-50 to-purple-50">
            <div className="flex items-center space-x-4">
              <div className="w-12 h-12 bg-gradient-to-r from-blue-600 to-purple-600 rounded-xl flex items-center justify-center">
                <Receipt className="w-6 h-6 text-white" />
              </div>
              <div>
                <h2 className="text-2xl font-bold text-gray-900">
                  Detalle de Transacción #{transaction.id}
                </h2>
                <p className="text-sm text-gray-600">
                  Información completa de la transacción
                </p>
              </div>
            </div>
            <div className="flex items-center space-x-2">
              <button
                onClick={() => setShowExportModal(true)}
                className="p-2 text-green-600 hover:text-green-700 hover:bg-green-50 rounded-lg transition-colors duration-200"
                title="Exportar transacción"
              >
                <Download className="w-5 h-5" />
              </button>
              <button
                onClick={onClose}
                className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100/50 rounded-lg transition-colors duration-200"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* Content */}
          <div className="p-6 overflow-y-auto max-h-[calc(90vh-120px)]">
            {/* Status Badge */}
            <div className="flex items-center justify-center mb-6">
              <div className={`inline-flex items-center space-x-2 px-4 py-2 rounded-full ${getStatusColor(transaction.status)}`}>
                {getStatusIcon(transaction.status)}
                <span className="font-semibold">{getStatusText(transaction.status)}</span>
              </div>
            </div>

            {/* Main Info Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
              {/* Cliente Info */}
              <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-2xl p-6">
                <h3 className="text-lg font-semibold text-blue-900 mb-4 flex items-center">
                  <User className="w-5 h-5 mr-2" />
                  Información del Cliente
                </h3>
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-blue-700 font-medium">Nombre:</span>
                    <div className="flex items-center space-x-2">
                      <span className="text-blue-900 font-semibold">{transaction.cliente}</span>
                      <button
                        onClick={() => copyToClipboard(transaction.cliente, 'cliente')}
                        className="p-1 text-blue-600 hover:text-blue-800 transition-colors"
                      >
                        {copiedField === 'cliente' ? (
                          <CheckCircle className="w-4 h-4 text-green-600" />
                        ) : (
                          <Copy className="w-4 h-4" />
                        )}
                      </button>
                    </div>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-blue-700 font-medium">Chat ID:</span>
                    <div className="flex items-center space-x-2">
                      <span className="text-blue-900 font-mono text-sm">{transaction.chatId}</span>
                      <button
                        onClick={() => copyToClipboard(transaction.chatId, 'chatId')}
                        className="p-1 text-blue-600 hover:text-blue-800 transition-colors"
                      >
                        {copiedField === 'chatId' ? (
                          <CheckCircle className="w-4 h-4 text-green-600" />
                        ) : (
                          <Copy className="w-4 h-4" />
                        )}
                      </button>
                    </div>
                  </div>
                </div>
              </div>

              {/* Colaborador Info */}
              <div className="bg-gradient-to-br from-purple-50 to-purple-100 rounded-2xl p-6">
                <h3 className="text-lg font-semibold text-purple-900 mb-4 flex items-center">
                  <User className="w-5 h-5 mr-2" />
                  Colaborador
                </h3>
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-purple-700 font-medium">Nombre:</span>
                    <span className="text-purple-900 font-semibold">{transaction.colaborador}</span>
                  </div>
                  {transaction.gananciaColaborador !== undefined && transaction.gananciaColaborador !== null && (
                    <div className="flex items-center justify-between">
                      <span className="text-purple-700 font-medium">Ganancia:</span>
                      <span className="text-purple-900 font-semibold">
                        ${(transaction.gananciaColaborador || 0).toFixed(2)}
                      </span>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Transaction Details */}
            <div className="bg-gradient-to-br from-green-50 to-green-100 rounded-2xl p-6 mb-6">
              <h3 className="text-lg font-semibold text-green-900 mb-4 flex items-center">
                <DollarSign className="w-5 h-5 mr-2" />
                Detalles Financieros
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                <div className="bg-white/70 rounded-lg p-4">
                  <div className="text-green-700 text-sm font-medium mb-1">USD Total</div>
                  <div className="text-2xl font-bold text-green-900">${(transaction.usdTotal || 0).toFixed(2)}</div>
                </div>
                <div className="bg-white/70 rounded-lg p-4">
                  <div className="text-green-700 text-sm font-medium mb-1">USD Neto</div>
                  <div className="text-2xl font-bold text-green-900">${(transaction.usdNeto || 0).toFixed(2)}</div>
                </div>
                <div className="bg-white/70 rounded-lg p-4">
                  <div className="text-green-700 text-sm font-medium mb-1">Comisión</div>
                  <div className="text-2xl font-bold text-green-900">{transaction.comision}%</div>
                </div>
                <div className="bg-white/70 rounded-lg p-4">
                  <div className="text-green-700 text-sm font-medium mb-1">Tasa Usada</div>
                  <div className="text-xl font-bold text-green-900">{(transaction.tasaUsada || 0).toLocaleString()} Gs/$</div>
                </div>
                <div className="bg-white/70 rounded-lg p-4">
                  <div className="text-green-700 text-sm font-medium mb-1">Monto en Guaraníes</div>
                  <div className="text-xl font-bold text-green-900">{(transaction.montoGs || 0).toLocaleString()} Gs</div>
                </div>
                {transaction.gananciaGabriel && (
                  <div className="bg-white/70 rounded-lg p-4">
                    <div className="text-green-700 text-sm font-medium mb-1">Ganancia Gabriel</div>
                    <div className="text-xl font-bold text-green-900">${(transaction.gananciaGabriel || 0).toFixed(2)}</div>
                  </div>
                )}
              </div>
            </div>

            {/* Technical Details */}
            <div className="bg-gradient-to-br from-gray-50 to-gray-100 rounded-2xl p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                <Hash className="w-5 h-5 mr-2" />
                Información Técnica
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-gray-700 font-medium">ID Transacción:</span>
                    <div className="flex items-center space-x-2">
                      <span className="text-gray-900 font-mono">{transaction.id}</span>
                      <button
                        onClick={() => copyToClipboard(transaction.id, 'id')}
                        className="p-1 text-gray-600 hover:text-gray-800 transition-colors"
                      >
                        {copiedField === 'id' ? (
                          <CheckCircle className="w-4 h-4 text-green-600" />
                        ) : (
                          <Copy className="w-4 h-4" />
                        )}
                      </button>
                    </div>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-gray-700 font-medium">Fecha:</span>
                    <span className="text-gray-900 font-semibold">
                      {new Date(transaction.fecha).toLocaleDateString('es-ES', {
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit'
                      })}
                    </span>
                  </div>
                </div>
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-gray-700 font-medium">Clave Idempotencia:</span>
                    <div className="flex items-center space-x-2">
                      <span className="text-gray-900 font-mono text-sm">{transaction.idempotencyKey}</span>
                      <button
                        onClick={() => copyToClipboard(transaction.idempotencyKey, 'idempotencyKey')}
                        className="p-1 text-gray-600 hover:text-gray-800 transition-colors"
                      >
                        {copiedField === 'idempotencyKey' ? (
                          <CheckCircle className="w-4 h-4 text-green-600" />
                        ) : (
                          <Copy className="w-4 h-4" />
                        )}
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Footer */}
          <div className="flex items-center justify-between p-6 border-t border-gray-200/50 bg-gray-50/50">
            <div className="text-sm text-gray-600">
              Transacción procesada el {new Date(transaction.fecha).toLocaleDateString('es-ES')}
            </div>
            <div className="flex space-x-3">
              <button
                onClick={() => setShowExportModal(true)}
                className="flex items-center space-x-2 px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg transition-colors duration-200"
              >
                <Download className="w-4 h-4" />
                <span>Exportar Factura</span>
              </button>
              <button
                onClick={onClose}
                className="px-4 py-2 border border-gray-200 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors duration-200"
              >
                Cerrar
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Export Modal */}
      {showExportModal && (
        <ExportModal
          isOpen={showExportModal}
          onClose={() => setShowExportModal(false)}
          dataType="transactions"
          title="Exportar Factura Individual"
          availableFields={[
            { key: 'id', label: 'ID Transacción', type: 'string' },
            { key: 'fecha', label: 'Fecha', type: 'date' },
            { key: 'cliente', label: 'Cliente', type: 'string' },
            { key: 'colaborador', label: 'Colaborador', type: 'string' },
            { key: 'usdTotal', label: 'USD Total', type: 'number' },
            { key: 'comision', label: 'Comisión %', type: 'number' },
            { key: 'usdNeto', label: 'USD Neto', type: 'number' },
            { key: 'montoGs', label: 'Monto Gs', type: 'number' },
            { key: 'tasaUsada', label: 'Tasa Usada', type: 'number' },
            { key: 'status', label: 'Estado', type: 'string' },
            { key: 'chatId', label: 'Chat ID', type: 'string' },
            { key: 'gananciaGabriel', label: 'Ganancia Gabriel', type: 'number' },
            { key: 'gananciaColaborador', label: 'Ganancia Colaborador', type: 'number' }
          ]}
          availableFilters={{}}
          onExport={handleExportSingle}
        />
      )}
    </>
  );
};

export default TransactionDetailModal;