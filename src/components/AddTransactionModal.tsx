import React, { useState, useEffect } from 'react';
import {
  X,
  DollarSign,
  User,
  Phone,
  Percent,
  TrendingUp,
  Save,
  RefreshCw,
  AlertCircle,
  Calculator
} from 'lucide-react';
import { apiService, CreateTransactionRequest, Collaborator } from '../services/api';

interface AddTransactionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (message: string) => void;
  onError: (message: string) => void;
  onTransactionCreated: () => void;
}

const AddTransactionModal: React.FC<AddTransactionModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
  onError,
  onTransactionCreated
}) => {
  const [formData, setFormData] = useState<CreateTransactionRequest>({
    cliente: '',
    colaborador: '',
    usdTotal: 0,
    comision: 10,
    tasaUsada: 7300,
    chatId: '',
    observaciones: '',
    colaboradorPct: undefined
  });
  
  const [collaborators, setCollaborators] = useState<Collaborator[]>([]);
  const [currentRate, setCurrentRate] = useState<number>(7300);
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  
  // Valores calculados
  const usdNeto = formData.usdTotal * (1 - formData.comision / 100);
  const montoGs = Math.round(formData.usdTotal * formData.tasaUsada);
  const comisionUsd = formData.usdTotal * (formData.comision / 100);
  const comisionGs = Math.round(comisionUsd * formData.tasaUsada);
  
  // Calcular distribución de ganancias
  const selectedCollaborator = collaborators.find(c => c.name === formData.colaborador);
  const isGabriel = formData.colaborador.toLowerCase().includes('gabriel');
  
  let gananciaColaborador = 0;
  let gananciaGabriel = 0;
  
  if (isGabriel) {
    // Si es Gabriel, toda la comisión va para él
    gananciaGabriel = comisionUsd;
  } else if (selectedCollaborator) {
    // El porcentaje del colaborador es sobre el monto total USD, no sobre la comisión
    const collaboratorPct = formData.colaboradorPct ?? selectedCollaborator.basePct ?? 50;
    
    // Ganancia del colaborador: su % del monto total USD
    gananciaColaborador = (formData.usdTotal * collaboratorPct) / 100;
    
    // Ganancia de Gabriel: comisión total menos la ganancia del colaborador
    gananciaGabriel = comisionUsd - gananciaColaborador;
  }

  useEffect(() => {
    if (isOpen) {
      loadInitialData();
    }
  }, [isOpen]);

  const loadInitialData = async () => {
    setIsLoading(true);
    try {
      // Cargar colaboradores
      const collaboratorsResponse = await apiService.getCollaborators();
      setCollaborators(collaboratorsResponse);
      
      // Cargar tasa actual
      const rateResponse = await apiService.getCurrentRate();
      setCurrentRate(rateResponse.rate);
      setFormData(prev => ({ ...prev, tasaUsada: rateResponse.rate }));
    } catch (error: any) {
      console.error('Error loading initial data:', error);
      onError('Error cargando datos iniciales');
    } finally {
      setIsLoading(false);
    }
  };

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};
    
    if (!formData.cliente.trim()) {
      newErrors.cliente = 'El nombre del cliente es requerido';
    }
    
    if (!formData.colaborador.trim()) {
      newErrors.colaborador = 'El colaborador es requerido';
    }
    
    if (formData.usdTotal <= 0) {
      newErrors.usdTotal = 'El monto USD debe ser mayor a 0';
    }
    
    if (formData.comision < 0 || formData.comision > 100) {
      newErrors.comision = 'La comisión debe estar entre 0% y 100%';
    }
    
    if (formData.tasaUsada <= 0) {
      newErrors.tasaUsada = 'La tasa debe ser mayor a 0';
    }
    
    if (formData.chatId && !formData.chatId.includes('@')) {
      newErrors.chatId = 'El formato del teléfono debe incluir @s.whatsapp.net';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    console.log('🚀 Iniciando creación de transacción...');
    console.log('📋 Datos del formulario:', formData);
    
    if (!validateForm()) {
      console.log('❌ Validación del formulario falló');
      return;
    }
    
    console.log('✅ Validación del formulario exitosa');
    
    // Verificar token de autenticación
    const token = apiService.getStoredToken();
    console.log('🔑 Token presente:', !!token);
    console.log('🔑 Token completo:', token);
    
    if (!token) {
      onError('No hay token de autenticación. Por favor, inicia sesión nuevamente.');
      return;
    }
    
    // Verificar si el token es válido
    try {
      const tokenPayload = JSON.parse(atob(token.split('.')[1]));
      const now = Date.now() / 1000;
      console.log('🔑 Token payload:', tokenPayload);
      console.log('🔑 Token expira en:', new Date(tokenPayload.exp * 1000));
      console.log('🔑 Tiempo actual:', new Date());
      
      if (tokenPayload.exp < now) {
        console.log('❌ Token expirado');
        onError('Tu sesión ha expirado. Por favor, inicia sesión nuevamente.');
        return;
      }
    } catch (error) {
      console.log('❌ Error decodificando token:', error);
      onError('Token inválido. Por favor, inicia sesión nuevamente.');
      return;
    }
    
    setIsSaving(true);
    try {
      console.log('📤 Enviando petición al servidor...');
      const response = await apiService.createTransaction(formData);
      console.log('📥 Respuesta del servidor:', response);
      
      if (response.success) {
        console.log('✅ Transacción creada exitosamente');
        onSuccess(response.message);
        onTransactionCreated();
        handleClose();
      } else {
        console.log('❌ Error en la respuesta del servidor:', response);
        onError('Error creando la transacción');
      }
    } catch (error: any) {
      console.error('💥 Error creating transaction:', error);
      console.error('💥 Error details:', {
        message: error.message,
        status: error.status,
        response: error.response
      });
      onError(error.message || 'Error creando la transacción');
    } finally {
      setIsSaving(false);
    }
  };

  const handleClose = () => {
    setFormData({
      cliente: '',
      colaborador: '',
      usdTotal: 0,
      comision: 10,
      tasaUsada: currentRate,
      chatId: '',
      observaciones: '',
      colaboradorPct: undefined
    });
    setErrors({});
    onClose();
  };

  const formatPhoneNumber = (phone: string) => {
    // Remover caracteres no numéricos
    const cleaned = phone.replace(/\D/g, '');
    
    // Si empieza con 595, mantenerlo, si no, agregarlo
    let formatted = cleaned;
    if (!cleaned.startsWith('595') && cleaned.length > 0) {
      formatted = '595' + cleaned;
    }
    
    // Agregar el sufijo de WhatsApp
    if (formatted.length > 0) {
      return formatted + '@s.whatsapp.net';
    }
    
    return '';
  };

  const handlePhoneChange = (value: string) => {
    if (value === '') {
      setFormData(prev => ({ ...prev, chatId: '' }));
      return;
    }
    
    const formatted = formatPhoneNumber(value);
    setFormData(prev => ({ ...prev, chatId: formatted }));
  };

  const displayPhoneNumber = (chatId: string) => {
    if (!chatId) return '';
    return chatId.replace('@s.whatsapp.net', '').replace(/^595/, '');
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-[9999] p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-hidden border border-gray-200">
        {/* Header */}
        <div className="bg-gradient-to-r from-green-600 to-emerald-600 px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center">
                <DollarSign className="w-5 h-5 text-white" />
              </div>
              <div>
                <h2 className="text-xl font-bold text-white">Nueva Transacción Manual</h2>
                <p className="text-green-100 text-sm">Registrar una transacción de forma manual</p>
              </div>
            </div>
            <button
              onClick={handleClose}
              disabled={isSaving}
              className="p-2 hover:bg-white/20 rounded-lg transition-colors"
            >
              <X className="w-5 h-5 text-white" />
            </button>
          </div>
        </div>

        {/* Loading State */}
        {isLoading && (
          <div className="p-8">
            <div className="flex items-center justify-center space-x-3">
              <RefreshCw className="w-6 h-6 animate-spin text-green-600" />
              <span className="text-gray-600">Cargando datos...</span>
            </div>
          </div>
        )}

        {/* Form Content */}
        {!isLoading && (
          <div className="max-h-[calc(90vh-120px)] overflow-y-auto">
            <form onSubmit={handleSubmit} className="p-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Columna Izquierda - Datos Principales */}
              <div className="space-y-6">
                <div className="bg-gray-50 rounded-xl p-4">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center space-x-2">
                    <User className="w-5 h-5 text-blue-600" />
                    <span>Información Principal</span>
                  </h3>
                  
                  <div className="space-y-4">
                    {/* Cliente */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Cliente *
                      </label>
                      <input
                        type="text"
                        value={formData.cliente}
                        onChange={(e) => setFormData(prev => ({ ...prev, cliente: e.target.value }))}
                        className={`w-full px-4 py-3 border rounded-xl focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent ${
                          errors.cliente ? 'border-red-300 bg-red-50' : 'border-gray-200'
                        }`}
                        placeholder="Nombre del cliente"
                        disabled={isSaving}
                      />
                      {errors.cliente && (
                        <p className="mt-1 text-sm text-red-600 flex items-center space-x-1">
                          <AlertCircle className="w-4 h-4" />
                          <span>{errors.cliente}</span>
                        </p>
                      )}
                    </div>

                    {/* Colaborador */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Colaborador *
                      </label>
                      <select
                        value={formData.colaborador}
                        onChange={(e) => setFormData(prev => ({ ...prev, colaborador: e.target.value }))}
                        className={`w-full px-4 py-3 border rounded-xl focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent ${
                          errors.colaborador ? 'border-red-300 bg-red-50' : 'border-gray-200'
                        }`}
                        disabled={isSaving}
                      >
                        <option value="">Seleccionar colaborador</option>
                        {collaborators.map((collab) => (
                          <option key={collab.id} value={collab.name}>
                            {collab.name} {collab.isOwner ? '(Propietario)' : ''}
                          </option>
                        ))}
                      </select>
                      {errors.colaborador && (
                        <p className="mt-1 text-sm text-red-600 flex items-center space-x-1">
                          <AlertCircle className="w-4 h-4" />
                          <span>{errors.colaborador}</span>
                        </p>
                      )}
                    </div>

                    {/* Teléfono (Opcional) */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        <div className="flex items-center space-x-2">
                          <Phone className="w-4 h-4" />
                          <span>Teléfono del Cliente (Opcional)</span>
                        </div>
                      </label>
                      <input
                        type="text"
                        value={displayPhoneNumber(formData.chatId || '')}
                        onChange={(e) => handlePhoneChange(e.target.value)}
                        className={`w-full px-4 py-3 border rounded-xl focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent ${
                          errors.chatId ? 'border-red-300 bg-red-50' : 'border-gray-200'
                        }`}
                        placeholder="Ej: 981123456"
                        disabled={isSaving}
                      />
                      <p className="mt-1 text-xs text-gray-500">
                        Se agregará automáticamente el prefijo 595 y @s.whatsapp.net
                      </p>
                      {formData.chatId && (
                        <p className="mt-1 text-xs text-blue-600">
                          Formato final: {formData.chatId}
                        </p>
                      )}
                      {errors.chatId && (
                        <p className="mt-1 text-sm text-red-600 flex items-center space-x-1">
                          <AlertCircle className="w-4 h-4" />
                          <span>{errors.chatId}</span>
                        </p>
                      )}
                    </div>
                  </div>
                </div>

                {/* Observaciones */}
                <div className="bg-gray-50 rounded-xl p-4">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">Observaciones</h3>
                  <textarea
                    rows={3}
                    value={formData.observaciones}
                    onChange={(e) => setFormData(prev => ({ ...prev, observaciones: e.target.value }))}
                    className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
                    placeholder="Notas adicionales sobre la transacción (opcional)"
                    disabled={isSaving}
                  />
                </div>
              </div>

              {/* Columna Derecha - Datos Financieros */}
              <div className="space-y-6">
                <div className="bg-blue-50 rounded-xl p-4">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center space-x-2">
                    <Calculator className="w-5 h-5 text-blue-600" />
                    <span>Datos Financieros</span>
                  </h3>
                  
                  <div className="space-y-4">
                    {/* USD Total */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Monto USD Total *
                      </label>
                      <div className="relative">
                        <DollarSign className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                        <input
                          type="number"
                          step="0.01"
                          min="0"
                          value={formData.usdTotal || ''}
                          onChange={(e) => setFormData(prev => ({ ...prev, usdTotal: parseFloat(e.target.value) || 0 }))}
                          className={`w-full pl-10 pr-4 py-3 border rounded-xl focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent ${
                            errors.usdTotal ? 'border-red-300 bg-red-50' : 'border-gray-200'
                          }`}
                          placeholder="0.00"
                          disabled={isSaving}
                        />
                      </div>
                      {errors.usdTotal && (
                        <p className="mt-1 text-sm text-red-600 flex items-center space-x-1">
                          <AlertCircle className="w-4 h-4" />
                          <span>{errors.usdTotal}</span>
                        </p>
                      )}
                    </div>

                    {/* Comisión */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Comisión % *
                      </label>
                      <div className="relative">
                        <Percent className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                        <input
                          type="number"
                          step="0.1"
                          min="0"
                          max="100"
                          value={formData.comision || ''}
                          onChange={(e) => setFormData(prev => ({ ...prev, comision: parseFloat(e.target.value) || 0 }))}
                          className={`w-full pl-10 pr-4 py-3 border rounded-xl focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent ${
                            errors.comision ? 'border-red-300 bg-red-50' : 'border-gray-200'
                          }`}
                          placeholder="10.0"
                          disabled={isSaving}
                        />
                      </div>
                      {errors.comision && (
                        <p className="mt-1 text-sm text-red-600 flex items-center space-x-1">
                          <AlertCircle className="w-4 h-4" />
                          <span>{errors.comision}</span>
                        </p>
                      )}
                    </div>

                    {/* Porcentaje del Colaborador */}
                    {formData.colaborador && !isGabriel && (
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          <div className="flex items-center justify-between">
                            <span>% para {formData.colaborador} *</span>
                            <button
                              type="button"
                              onClick={() => {
                                const defaultPct = selectedCollaborator?.basePct || 50;
                                setFormData(prev => ({ ...prev, colaboradorPct: defaultPct }));
                              }}
                              className="text-xs text-blue-600 hover:text-blue-700 flex items-center space-x-1"
                              disabled={isSaving}
                            >
                              <span>Usar % por defecto ({selectedCollaborator?.basePct || 50}%)</span>
                            </button>
                          </div>
                        </label>
                        <div className="relative">
                          <Percent className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                          <input
                            type="number"
                            step="1"
                            min="0"
                            max="100"
                            value={formData.colaboradorPct || selectedCollaborator?.basePct || 50}
                            onChange={(e) => setFormData(prev => ({ ...prev, colaboradorPct: parseFloat(e.target.value) || 0 }))}
                            className={`w-full pl-10 pr-4 py-3 border rounded-xl focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent ${
                              errors.colaboradorPct ? 'border-red-300 bg-red-50' : 'border-gray-200'
                            }`}
                            placeholder="50"
                            disabled={isSaving}
                          />
                        </div>
                        <p className="mt-1 text-xs text-gray-500">
                           Gabriel recibirá la comisión restante después de descontar el {formData.colaboradorPct || selectedCollaborator?.basePct || 50}% del monto total para {formData.colaborador}
                         </p>
                        {errors.colaboradorPct && (
                          <p className="mt-1 text-sm text-red-600 flex items-center space-x-1">
                            <AlertCircle className="w-4 h-4" />
                            <span>{errors.colaboradorPct}</span>
                          </p>
                        )}
                      </div>
                    )}

                    {/* Tasa */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        <div className="flex items-center justify-between">
                          <span>Tasa Gs/USD *</span>
                          <button
                            type="button"
                            onClick={() => setFormData(prev => ({ ...prev, tasaUsada: currentRate }))}
                            className="text-xs text-blue-600 hover:text-blue-700 flex items-center space-x-1"
                            disabled={isSaving}
                          >
                            <TrendingUp className="w-3 h-3" />
                            <span>Usar tasa actual ({currentRate.toLocaleString()})</span>
                          </button>
                        </div>
                      </label>
                      <input
                        type="number"
                        step="1"
                        min="0"
                        value={formData.tasaUsada || ''}
                        onChange={(e) => setFormData(prev => ({ ...prev, tasaUsada: parseFloat(e.target.value) || 0 }))}
                        className={`w-full px-4 py-3 border rounded-xl focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent ${
                          errors.tasaUsada ? 'border-red-300 bg-red-50' : 'border-gray-200'
                        }`}
                        placeholder="7300"
                        disabled={isSaving}
                      />
                      {errors.tasaUsada && (
                        <p className="mt-1 text-sm text-red-600 flex items-center space-x-1">
                          <AlertCircle className="w-4 h-4" />
                          <span>{errors.tasaUsada}</span>
                        </p>
                      )}
                    </div>
                  </div>
                </div>

                {/* Resumen de Cálculos */}
                <div className="bg-green-50 rounded-xl p-4">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">Resumen de Cálculos</h3>
                  
                  <div className="space-y-3">
                    <div className="flex justify-between items-center py-2 border-b border-green-200">
                      <span className="text-sm text-gray-600">USD Neto (después de comisión):</span>
                      <span className="font-semibold text-green-700">${usdNeto.toFixed(2)}</span>
                    </div>
                    
                    <div className="flex justify-between items-center py-2 border-b border-green-200">
                      <span className="text-sm text-gray-600">Monto en Guaraníes:</span>
                      <span className="font-semibold text-green-700">{montoGs.toLocaleString()} Gs</span>
                    </div>
                    
                    <div className="flex justify-between items-center py-2 border-b border-green-200">
                      <span className="text-sm text-gray-600">Comisión Total USD:</span>
                      <span className="font-semibold text-blue-700">${comisionUsd.toFixed(2)}</span>
                    </div>
                    
                    <div className="flex justify-between items-center py-2 border-b border-green-200">
                      <span className="text-sm text-gray-600">Comisión Total Gs:</span>
                      <span className="font-semibold text-blue-700">{comisionGs.toLocaleString()} Gs</span>
                    </div>
                    
                    {/* Distribución de Ganancias */}
                    {formData.colaborador && (
                      <>
                        <div className="pt-2 border-t border-green-300">
                          <h4 className="text-sm font-semibold text-gray-800 mb-2">Distribución de Ganancias:</h4>
                        </div>
                        
                        <div className="flex justify-between items-center py-1">
                          <span className="text-sm text-gray-600">Para {formData.colaborador}:</span>
                          <span className="font-semibold text-purple-700">${gananciaColaborador.toFixed(2)}</span>
                        </div>
                        
                        <div className="flex justify-between items-center py-1">
                          <span className="text-sm text-gray-600">Para Gabriel Zambrano:</span>
                          <span className="font-semibold text-orange-700">${gananciaGabriel.toFixed(2)}</span>
                        </div>
                        
                        {selectedCollaborator && !isGabriel && (
                            <div className="text-xs text-gray-500 mt-2 p-2 bg-blue-50 rounded">
                              💡 {formData.colaborador} recibe {formData.colaboradorPct ?? selectedCollaborator.basePct ?? 50}% del monto total USD. Gabriel recibe la comisión restante.
                            </div>
                          )}
                        
                        {isGabriel && (
                          <div className="text-xs text-gray-500 mt-2 p-2 bg-yellow-50 rounded">
                            👑 Gabriel recibe el 100% de la comisión como propietario
                          </div>
                        )}
                      </>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* Footer Buttons */}
            <div className="flex flex-col sm:flex-row space-y-3 sm:space-y-0 sm:space-x-3 mt-8 pt-6 border-t border-gray-200">
              <button
                type="button"
                onClick={handleClose}
                disabled={isSaving}
                className="flex-1 px-6 py-3 border border-gray-200 text-gray-700 rounded-xl hover:bg-gray-50 transition-colors font-medium"
              >
                Cancelar
              </button>
              
              <button
                type="submit"
                disabled={isSaving || formData.usdTotal <= 0 || !formData.cliente || !formData.colaborador}
                onClick={(e) => {
                  console.log('🔘 Botón clickeado');
                  console.log('📊 Estado del botón:', {
                    isSaving,
                    usdTotal: formData.usdTotal,
                    cliente: formData.cliente,
                    colaborador: formData.colaborador,
                    disabled: isSaving || formData.usdTotal <= 0 || !formData.cliente || !formData.colaborador
                  });
                  console.log('📋 Datos completos del formulario:', formData);
                  
                  // Si el botón está deshabilitado, prevenir el envío
                  if (isSaving || formData.usdTotal <= 0 || !formData.cliente || !formData.colaborador) {
                    console.log('❌ Botón deshabilitado, no se enviará el formulario');
                    e.preventDefault();
                    e.stopPropagation();
                    return false;
                  }
                }}
                className="flex-1 px-6 py-3 bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 disabled:from-gray-400 disabled:to-gray-500 text-white rounded-xl transition-all duration-200 font-medium shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 disabled:transform-none flex items-center justify-center space-x-2"
              >
                {isSaving ? (
                  <>
                    <RefreshCw className="w-5 h-5 animate-spin" />
                    <span>Creando...</span>
                  </>
                ) : (
                  <>
                    <Save className="w-5 h-5" />
                    <span>Crear Transacción</span>
                  </>
                )}
              </button>
            </div>
          </form>
          </div>
        )}
      </div>
    </div>
  );
};

export default AddTransactionModal;