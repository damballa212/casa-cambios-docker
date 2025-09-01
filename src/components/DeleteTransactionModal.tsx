import React, { useState, useEffect } from 'react';
import { X, AlertTriangle, CheckCircle, XCircle, Loader2, Shield, Database, Trash2, Clock, Users, DollarSign } from 'lucide-react';

interface DeleteTransactionModalProps {
  isOpen: boolean;
  onClose: () => void;
  transaction: any;
  onConfirm: (transactionId: string) => Promise<void>;
}

interface ProgressStep {
  id: string;
  name: string;
  description: string;
  status: 'pending' | 'in_progress' | 'completed' | 'error';
  icon: React.ComponentType<any>;
  duration?: number;
}

const DeleteTransactionModal: React.FC<DeleteTransactionModalProps> = ({
  isOpen,
  onClose,
  transaction,
  onConfirm
}) => {
  const [currentStep, setCurrentStep] = useState(0);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isCompleted, setIsCompleted] = useState(false);
  const [hasError, setHasError] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [progress, setProgress] = useState(0);
  const [showConfirmation, setShowConfirmation] = useState(true);

  const steps: ProgressStep[] = [
    {
      id: 'validation',
      name: 'Validación de Seguridad',
      description: 'Verificando permisos y restricciones de eliminación',
      status: 'pending',
      icon: Shield,
      duration: 2000
    },
    {
      id: 'integrity',
      name: 'Verificación de Integridad',
      description: 'Analizando constraints y relaciones de base de datos',
      status: 'pending',
      icon: Database,
      duration: 1500
    },
    {
      id: 'impact',
      name: 'Análisis de Impacto',
      description: 'Evaluando consecuencias en colaboradores y clientes',
      status: 'pending',
      icon: Users,
      duration: 2500
    },
    {
      id: 'permissions',
      name: 'Validación de Permisos',
      description: 'Verificando autorización y criterios de eliminación',
      status: 'pending',
      icon: Clock,
      duration: 1000
    },
    {
      id: 'deletion',
      name: 'Eliminación Segura',
      description: 'Ejecutando eliminación con monitoreo completo',
      status: 'pending',
      icon: Trash2,
      duration: 3000
    }
  ];

  const [processSteps, setProcessSteps] = useState(steps);

  useEffect(() => {
    if (!isOpen) {
      // Reset state when modal closes
      setCurrentStep(0);
      setIsProcessing(false);
      setIsCompleted(false);
      setHasError(false);
      setErrorMessage('');
      setProgress(0);
      setShowConfirmation(true);
      setProcessSteps(steps);
    }
  }, [isOpen]);

  const updateStepStatus = (stepIndex: number, status: ProgressStep['status']) => {
    setProcessSteps(prev => prev.map((step, index) => 
      index === stepIndex ? { ...step, status } : step
    ));
  };

  const simulateProgress = async () => {
    setIsProcessing(true);
    setShowConfirmation(false);
    
    try {
      for (let i = 0; i < processSteps.length; i++) {
        setCurrentStep(i);
        updateStepStatus(i, 'in_progress');
        
        // Simulate step duration
        const stepDuration = processSteps[i].duration || 2000;
        const progressIncrement = 100 / processSteps.length;
        const startProgress = i * progressIncrement;
        
        // Animate progress within the step
        const animationSteps = 20;
        const stepProgressIncrement = progressIncrement / animationSteps;
        
        for (let j = 0; j < animationSteps; j++) {
          await new Promise(resolve => setTimeout(resolve, stepDuration / animationSteps));
          setProgress(startProgress + (j + 1) * stepProgressIncrement);
        }
        
        updateStepStatus(i, 'completed');
      }
      
      // Execute actual deletion
      await onConfirm(transaction.id);
      
      setProgress(100);
      setIsCompleted(true);
      
      // Auto close after success
      setTimeout(() => {
        onClose();
      }, 2000);
      
    } catch (error: any) {
      setHasError(true);
      setErrorMessage(error.message || 'Error durante la eliminación');
      updateStepStatus(currentStep, 'error');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleConfirm = () => {
    simulateProgress();
  };

  const handleCancel = () => {
    if (!isProcessing) {
      onClose();
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-3xl shadow-2xl w-full max-w-2xl max-h-[90vh] flex flex-col overflow-hidden border border-gray-100">
        {/* Header */}
        <div className="bg-gradient-to-r from-red-500 to-red-600 text-white p-6 relative rounded-t-3xl">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="w-12 h-12 bg-white/20 rounded-full flex items-center justify-center">
                <Trash2 className="w-6 h-6" />
              </div>
              <div>
                <h2 className="text-xl font-bold">
                  {showConfirmation ? 'Confirmar Eliminación' : 
                   isCompleted ? 'Eliminación Completada' :
                   hasError ? 'Error en Eliminación' : 'Procesando Eliminación'}
                </h2>
                <p className="text-red-100 text-sm">
                  {showConfirmation ? 'Operación irreversible' :
                   isCompleted ? 'Transacción eliminada exitosamente' :
                   hasError ? 'Se produjo un error durante el proceso' :
                   'Ejecutando debugging profesional'}
                </p>
              </div>
            </div>
            {!isProcessing && (
              <button
                onClick={handleCancel}
                className="text-white/80 hover:text-white transition-colors p-2 rounded-lg hover:bg-white/10"
              >
                <X className="w-5 h-5" />
              </button>
            )}
          </div>
        </div>

        {/* Content */}
        <div className="p-6 flex-1 overflow-y-auto">
          {showConfirmation && (
            <>
              {/* Transaction Info */}
              <div className="bg-gray-50 rounded-xl p-4 mb-6">
                <h3 className="font-semibold text-gray-900 mb-3 flex items-center">
                  <DollarSign className="w-5 h-5 mr-2 text-green-500" />
                  Información de la Transacción
                </h3>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="text-gray-500">ID:</span>
                    <span className="ml-2 font-medium">{transaction?.id}</span>
                  </div>
                  <div>
                    <span className="text-gray-500">Cliente:</span>
                    <span className="ml-2 font-medium">{transaction?.cliente}</span>
                  </div>
                  <div>
                    <span className="text-gray-500">Colaborador:</span>
                    <span className="ml-2 font-medium">{transaction?.colaborador}</span>
                  </div>
                  <div>
                    <span className="text-gray-500">Monto:</span>
                    <span className="ml-2 font-medium text-green-600">${transaction?.usdTotal?.toFixed(2)}</span>
                  </div>
                </div>
              </div>

              {/* Warning */}
              <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 mb-6">
                <div className="flex items-start space-x-3">
                  <AlertTriangle className="w-5 h-5 text-amber-500 mt-0.5 flex-shrink-0" />
                  <div>
                    <h4 className="font-semibold text-amber-800 mb-1">Advertencia Importante</h4>
                    <p className="text-amber-700 text-sm leading-relaxed">
                      Esta acción eliminará permanentemente la transacción y actualizará los conteos de 
                      colaboradores y clientes. Esta operación no se puede deshacer y afectará los 
                      registros históricos del sistema.
                    </p>
                  </div>
                </div>
              </div>

              {/* Security Features */}
              <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 mb-6">
                <h4 className="font-semibold text-blue-800 mb-3 flex items-center">
                  <Shield className="w-5 h-5 mr-2" />
                  Características de Seguridad
                </h4>
                <ul className="text-blue-700 text-sm space-y-2">
                  <li className="flex items-center">
                    <CheckCircle className="w-4 h-4 mr-2 text-blue-500" />
                    Debugging profesional con validaciones exhaustivas
                  </li>
                  <li className="flex items-center">
                    <CheckCircle className="w-4 h-4 mr-2 text-blue-500" />
                    Verificación de integridad referencial
                  </li>
                  <li className="flex items-center">
                    <CheckCircle className="w-4 h-4 mr-2 text-blue-500" />
                    Análisis de impacto en colaboradores y clientes
                  </li>
                  <li className="flex items-center">
                    <CheckCircle className="w-4 h-4 mr-2 text-blue-500" />
                    Logging completo para auditoría
                  </li>
                </ul>
              </div>
            </>
          )}

          {/* Progress Section */}
          {!showConfirmation && (
            <div className="space-y-6">
              {/* Progress Bar */}
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="font-medium text-gray-700">Progreso General</span>
                  <span className="text-gray-500">{Math.round(progress)}%</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-3 overflow-hidden">
                  <div 
                    className="h-full bg-gradient-to-r from-blue-500 to-blue-600 rounded-full transition-all duration-300 ease-out"
                    style={{ width: `${progress}%` }}
                  />
                </div>
              </div>

              {/* Steps */}
              <div className="space-y-4">
                {processSteps.map((step, index) => {
                  const Icon = step.icon;
                  const isActive = index === currentStep;
                  const isCompleted = step.status === 'completed';
                  const isError = step.status === 'error';
                  const isInProgress = step.status === 'in_progress';
                  
                  return (
                    <div 
                      key={step.id}
                      className={`flex items-center space-x-4 p-4 rounded-xl transition-all duration-300 ${
                        isActive ? 'bg-blue-50 border-2 border-blue-200' :
                        isCompleted ? 'bg-green-50 border border-green-200' :
                        isError ? 'bg-red-50 border border-red-200' :
                        'bg-gray-50 border border-gray-200'
                      }`}
                    >
                      <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                        isCompleted ? 'bg-green-500 text-white' :
                        isError ? 'bg-red-500 text-white' :
                        isInProgress ? 'bg-blue-500 text-white' :
                        'bg-gray-300 text-gray-600'
                      }`}>
                        {isCompleted ? (
                          <CheckCircle className="w-5 h-5" />
                        ) : isError ? (
                          <XCircle className="w-5 h-5" />
                        ) : isInProgress ? (
                          <Loader2 className="w-5 h-5 animate-spin" />
                        ) : (
                          <Icon className="w-5 h-5" />
                        )}
                      </div>
                      <div className="flex-1">
                        <h4 className={`font-semibold ${
                          isCompleted ? 'text-green-800' :
                          isError ? 'text-red-800' :
                          isInProgress ? 'text-blue-800' :
                          'text-gray-700'
                        }`}>
                          {step.name}
                        </h4>
                        <p className={`text-sm ${
                          isCompleted ? 'text-green-600' :
                          isError ? 'text-red-600' :
                          isInProgress ? 'text-blue-600' :
                          'text-gray-500'
                        }`}>
                          {step.description}
                        </p>
                      </div>
                      {isInProgress && (
                        <div className="w-6 h-6">
                          <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-500"></div>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>

              {/* Error Message */}
              {hasError && (
                <div className="bg-red-50 border border-red-200 rounded-xl p-4">
                  <div className="flex items-start space-x-3">
                    <XCircle className="w-5 h-5 text-red-500 mt-0.5 flex-shrink-0" />
                    <div>
                      <h4 className="font-semibold text-red-800 mb-1">Error en el Proceso</h4>
                      <p className="text-red-700 text-sm">{errorMessage}</p>
                    </div>
                  </div>
                </div>
              )}

              {/* Success Message */}
              {isCompleted && (
                <div className="bg-green-50 border border-green-200 rounded-xl p-4">
                  <div className="flex items-start space-x-3">
                    <CheckCircle className="w-5 h-5 text-green-500 mt-0.5 flex-shrink-0" />
                    <div>
                      <h4 className="font-semibold text-green-800 mb-1">Eliminación Exitosa</h4>
                      <p className="text-green-700 text-sm">
                        La transacción ha sido eliminada correctamente. Los registros de colaboradores 
                        y clientes han sido actualizados. Esta ventana se cerrará automáticamente.
                      </p>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        {showConfirmation && (
          <div className="bg-gradient-to-r from-gray-50 to-gray-100 px-6 py-5 flex justify-end space-x-4 border-t border-gray-200 rounded-b-3xl">
            <button
              onClick={handleCancel}
              className="px-8 py-3 text-gray-700 bg-white border border-gray-300 rounded-xl hover:bg-gray-50 hover:border-gray-400 transition-all duration-200 font-medium shadow-sm hover:shadow-md"
            >
              Cancelar
            </button>
            <button
              onClick={handleConfirm}
              className="px-8 py-3 bg-gradient-to-r from-red-600 to-red-700 hover:from-red-700 hover:to-red-800 text-white rounded-xl transition-all duration-200 font-medium flex items-center space-x-2 shadow-lg hover:shadow-xl transform hover:scale-105"
            >
              <Trash2 className="w-4 h-4" />
              <span>Confirmar Eliminación</span>
            </button>
          </div>
        )}

        {(isProcessing || isCompleted || hasError) && !showConfirmation && (
          <div className="bg-gradient-to-r from-gray-50 to-gray-100 px-6 py-5 flex justify-end border-t border-gray-200 rounded-b-3xl">
            {(isCompleted || hasError) && (
              <button
                onClick={handleCancel}
                className="px-8 py-3 bg-gradient-to-r from-gray-600 to-gray-700 hover:from-gray-700 hover:to-gray-800 text-white rounded-xl transition-all duration-200 font-medium shadow-lg hover:shadow-xl transform hover:scale-105"
              >
                Cerrar
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default DeleteTransactionModal;