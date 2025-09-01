import React, { useState, useEffect } from 'react';
import { Users, Plus, Edit, TrendingUp, DollarSign, Percent, X, Save } from 'lucide-react';
import { apiService } from '../services/api';

interface Collaborator {
  id: number;
  name: string;
  basePct: number | null;
  txCount: number;
  totalCommissionUsd: number;
  totalCommissionGs: number;
  status: string;
  isOwner: boolean;
  rules: string;
}

const CollaboratorManagement: React.FC = () => {
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingCollaborator, setEditingCollaborator] = useState<Collaborator | null>(null);
  const [editForm, setEditForm] = useState({ name: '', basePct: '', status: 'active' });
  const [addForm, setAddForm] = useState({ name: '', basePct: '', status: 'active' });
  const [collaborators, setCollaborators] = useState<Collaborator[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Cargar colaboradores desde el API
  useEffect(() => {
    const fetchCollaborators = async () => {
      try {
        setLoading(true);
        const data = await apiService.getCollaborators();
        setCollaborators(data);
        setError(null);
      } catch (err) {
        console.error('Error fetching collaborators:', err);
        setError('Error al cargar los colaboradores');
        setCollaborators([]);
      } finally {
        setLoading(false);
      }
    };

    fetchCollaborators();
  }, []);

  const recentTransactions: any[] = [];

  // Manejar agregar colaborador
  const handleAddCollaborator = async () => {
    if (!addForm.name.trim()) {
      alert('Por favor ingresa el nombre del colaborador');
      return;
    }

    try {
      setIsSubmitting(true);
      const newCollaborator = await apiService.createCollaborator({
        name: addForm.name.trim(),
        basePct: addForm.basePct ? parseFloat(addForm.basePct) : null,
        status: addForm.status
      });

      setCollaborators(prev => [...prev, newCollaborator]);
      setShowAddForm(false);
      setAddForm({ name: '', basePct: '', status: 'active' });
      setError(null);
    } catch (err) {
      console.error('Error adding collaborator:', err);
      setError('Error al agregar el colaborador');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCancelAdd = () => {
    setShowAddForm(false);
    setAddForm({ name: '', basePct: '', status: 'active' });
  };

  // Manejar la apertura del modal de edición
  const handleEditCollaborator = (collaborator: Collaborator) => {
    setEditingCollaborator(collaborator);
    setEditForm({
      name: collaborator.name,
      basePct: collaborator.basePct?.toString() || '',
      status: collaborator.status
    });
  };

  // Manejar el guardado de cambios
  const handleSaveEdit = async () => {
    if (!editingCollaborator) return;
    
    try {
      // Aquí iría la lógica para actualizar el colaborador en el backend
      console.log('Guardando cambios:', {
        id: editingCollaborator.id,
        ...editForm,
        basePct: editForm.basePct ? parseFloat(editForm.basePct) : null
      });
      
      // Actualizar el estado local
      setCollaborators(prev => prev.map(collab => 
        collab.id === editingCollaborator.id 
          ? { 
              ...collab, 
              name: editForm.name,
              basePct: editForm.basePct ? parseFloat(editForm.basePct) : null,
              status: editForm.status
            }
          : collab
      ));
      
      // Cerrar el modal
      setEditingCollaborator(null);
      setEditForm({ name: '', basePct: '', status: 'active' });
    } catch (error) {
      console.error('Error al guardar cambios:', error);
    }
  };

  // Cerrar modal sin guardar
  const handleCancelEdit = () => {
    setEditingCollaborator(null);
    setEditForm({ name: '', basePct: '', status: 'active' });
  };


  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold text-gray-900">Gestión de Colaboradores</h1>
        <button 
          onClick={() => setShowAddForm(true)}
          className="flex items-center space-x-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors duration-200"
        >
          <Plus className="w-4 h-4" />
          <span>Nuevo Colaborador</span>
        </button>
      </div>

      {/* Loading State */}
      {loading && (
        <div className="bg-white/70 backdrop-blur-md rounded-2xl border border-gray-200/50 shadow-lg p-8">
          <div className="flex items-center justify-center space-x-3">
            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
            <span className="text-gray-600">Cargando colaboradores...</span>
          </div>
        </div>
      )}

      {/* Error State */}
      {error && (
        <div className="bg-red-50/70 backdrop-blur-md rounded-2xl border border-red-200/50 shadow-lg p-6">
          <div className="flex items-center space-x-3 text-red-700">
            <Users className="w-5 h-5" />
            <span>{error}</span>
          </div>
        </div>
      )}

      {/* Collaborators Grid */}
      {!loading && !error && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {collaborators.map((collaborator) => (
          <div key={collaborator.id} className="bg-white/70 backdrop-blur-md rounded-2xl p-6 border border-gray-200/50 shadow-lg hover:shadow-xl transition-shadow duration-300">
            <div className="flex items-start justify-between mb-4">
              <div className="flex items-center space-x-3">
                <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${
                  collaborator.isOwner 
                    ? 'bg-gradient-to-r from-purple-500 to-purple-600' 
                    : 'bg-gradient-to-r from-blue-500 to-blue-600'
                }`}>
                  <Users className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-gray-900">{collaborator.name}</h3>
                  <span className={`text-xs px-2 py-1 rounded-full ${
                    collaborator.isOwner 
                      ? 'bg-purple-100 text-purple-700' 
                      : 'bg-blue-100 text-blue-700'
                  }`}>
                    {collaborator.isOwner ? 'Propietario' : 'Colaborador'}
                  </span>
                </div>
              </div>
              <button
                onClick={() => handleEditCollaborator(collaborator)}
                className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100/50 rounded-lg transition-colors duration-200"
              >
                <Edit className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">Comisión Base</span>
                <div className="flex items-center space-x-1">
                  <Percent className="w-4 h-4 text-gray-400" />
                  <span className="font-medium text-gray-900">
                  {collaborator.basePct === null ? 'Variable' : 
                   collaborator.basePct === 0 ? 'Resto' : `${collaborator.basePct.toFixed(2)}%`}
                </span>
                </div>
              </div>
              
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">Transacciones</span>
                <span className="font-medium text-gray-900">{collaborator.txCount}</span>
              </div>
              
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">Total Comisión USD</span>
                <div className="flex items-center space-x-1">
                  <DollarSign className="w-4 h-4 text-green-500" />
                  <span className="font-medium text-gray-900">${collaborator.totalCommissionUsd.toFixed(2)}</span>
                </div>
              </div>
              
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">Total Comisión Gs</span>
                <span className="font-medium text-gray-900">{collaborator.totalCommissionGs.toLocaleString()} Gs</span>
              </div>
            </div>

            <div className="mt-4 p-3 bg-gray-50/70 rounded-xl">
              <p className="text-xs text-gray-600">
                <strong>Reglas:</strong> {collaborator.rules}
              </p>
            </div>

            <div className="mt-4 flex space-x-2">
              <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                collaborator.status === 'active' 
                  ? 'bg-green-100 text-green-800' 
                  : 'bg-red-100 text-red-800'
              }`}>
                {collaborator.status === 'active' ? 'Activo' : 'Inactivo'}
              </span>
            </div>
          </div>
        ))}
      </div>
      )}

      {/* Commission Rules */}
      {!loading && !error && (
        <>
          <div className="bg-white/70 backdrop-blur-md rounded-2xl p-6 border border-gray-200/50 shadow-lg">
            <h2 className="text-xl font-bold text-gray-900 mb-6 flex items-center">
              <TrendingUp className="w-5 h-5 mr-2" />
              Reglas de Comisiones
            </h2>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="p-4 bg-gradient-to-r from-purple-50 to-purple-100 rounded-xl border border-purple-200">
                <h3 className="font-semibold text-purple-900 mb-2">Gabriel Zambrano (Propietario)</h3>
                <ul className="text-sm text-purple-700 space-y-1">
                  <li>• Recibe el resto de la comisión</li>
                  <li>• Es el colaborador por defecto</li>
                  <li>• Siempre aparece en transacciones</li>
                </ul>
              </div>
              
              <div className="p-4 bg-gradient-to-r from-blue-50 to-blue-100 rounded-xl border border-blue-200">
                <h3 className="font-semibold text-blue-900 mb-2">Patty</h3>
                <ul className="text-sm text-blue-700 space-y-1">
                  <li>• Comisión fija: 5% del total USD</li>
                  <li>• No varía según el porcentaje</li>
                  <li>• Automático si se menciona</li>
                </ul>
              </div>
              
              <div className="p-4 bg-gradient-to-r from-green-50 to-green-100 rounded-xl border border-green-200">
                <h3 className="font-semibold text-green-900 mb-2">Anael</h3>
                <ul className="text-sm text-green-700 space-y-1">
                  <li>• 10% comisión → 2% para Anael</li>
                  <li>• 13% y 15% → 5% para Anael</li>
                  <li>• Otros casos → 5% para Anael</li>
                </ul>
              </div>
            </div>
          </div>

          {/* Recent Transactions by Collaborator */}
          <div className="bg-white/70 backdrop-blur-md rounded-2xl p-6 border border-gray-200/50 shadow-lg">
            <h2 className="text-xl font-bold text-gray-900 mb-6">Transacciones Recientes por Colaborador</h2>
            
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50/70">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Colaborador</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Cliente</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Monto USD</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Comisión USD</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Fecha</th>
                  </tr>
                </thead>
                <tbody className="bg-white/30 divide-y divide-gray-200/50">
                  {recentTransactions.map((tx, index) => (
                    <tr key={index} className="hover:bg-gray-50/30 transition-colors duration-200">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <div className={`w-8 h-8 rounded-full flex items-center justify-center mr-3 ${
                            tx.collaborator === 'Gabriel Zambrano' 
                              ? 'bg-purple-100 text-purple-600' 
                              : 'bg-blue-100 text-blue-600'
                          }`}>
                            <Users className="w-4 h-4" />
                          </div>
                          <span className="text-sm font-medium text-gray-900">{tx.collaborator}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{tx.client}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">${tx.amount}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-green-600">${tx.commission}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{tx.date}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Performance Summary */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <div className="bg-white/70 backdrop-blur-md rounded-2xl p-6 border border-gray-200/50 shadow-lg">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Total Colaboradores</p>
                  <p className="text-2xl font-bold text-gray-900">{collaborators.length}</p>
                </div>
                <Users className="w-8 h-8 text-blue-500" />
              </div>
            </div>
            
            <div className="bg-white/70 backdrop-blur-md rounded-2xl p-6 border border-gray-200/50 shadow-lg">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Comisiones Mes USD</p>
                  <p className="text-2xl font-bold text-gray-900">$3,751</p>
                </div>
                <DollarSign className="w-8 h-8 text-green-500" />
              </div>
            </div>
            
            <div className="bg-white/70 backdrop-blur-md rounded-2xl p-6 border border-gray-200/50 shadow-lg">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Promedio por Transacción</p>
                  <p className="text-2xl font-bold text-gray-900">$42.6</p>
                </div>
                <TrendingUp className="w-8 h-8 text-purple-500" />
              </div>
            </div>
            
            <div className="bg-white/70 backdrop-blur-md rounded-2xl p-6 border border-gray-200/50 shadow-lg">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Más Productivo</p>
                  <p className="text-lg font-bold text-gray-900">Gabriel</p>
                  <p className="text-sm text-gray-500">45 transacciones</p>
                </div>
                <TrendingUp className="w-8 h-8 text-orange-500" />
              </div>
            </div>
          </div>
        </>
      )}

      {/* Modal de Agregar Colaborador */}
      {showAddForm && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50">
          <div className="bg-white/90 backdrop-blur-md rounded-2xl p-6 w-full max-w-md mx-4 border border-gray-200/50 shadow-2xl">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-bold text-gray-900 flex items-center">
                <Plus className="w-5 h-5 mr-2" />
                Nuevo Colaborador
              </h3>
              <button
                onClick={handleCancelAdd}
                className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100/50 rounded-lg transition-colors duration-200"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Nombre del Colaborador *
                </label>
                <input
                  type="text"
                  value={addForm.name}
                  onChange={(e) => setAddForm(prev => ({ ...prev, name: e.target.value }))}
                  className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white/70"
                  placeholder="Nombre del colaborador"
                  disabled={isSubmitting}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Comisión Base (%)
                </label>
                <input
                  type="number"
                  value={addForm.basePct}
                  onChange={(e) => setAddForm(prev => ({ ...prev, basePct: e.target.value }))}
                  className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white/70"
                  placeholder="Ej: 5 (dejar vacío para variable)"
                  min="0"
                  max="100"
                  step="0.1"
                  disabled={isSubmitting}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Estado
                </label>
                <select
                  value={addForm.status}
                  onChange={(e) => setAddForm(prev => ({ ...prev, status: e.target.value }))}
                  className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white/70"
                  disabled={isSubmitting}
                >
                  <option value="active">Activo</option>
                  <option value="inactive">Inactivo</option>
                </select>
              </div>
            </div>

            <div className="flex space-x-3 mt-6">
              <button
                onClick={handleCancelAdd}
                disabled={isSubmitting}
                className="flex-1 px-4 py-3 border border-gray-200 text-gray-700 rounded-xl hover:bg-gray-50 transition-colors duration-200 disabled:opacity-50"
              >
                Cancelar
              </button>
              <button
                onClick={handleAddCollaborator}
                disabled={isSubmitting || !addForm.name.trim()}
                className="flex-1 px-4 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-xl transition-colors duration-200 flex items-center justify-center space-x-2 disabled:opacity-50"
              >
                {isSubmitting ? (
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                ) : (
                  <Plus className="w-4 h-4" />
                )}
                <span>{isSubmitting ? 'Creando...' : 'Crear Colaborador'}</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal de Edición */}
      {editingCollaborator && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50">
          <div className="bg-white/90 backdrop-blur-md rounded-2xl p-6 w-full max-w-md mx-4 border border-gray-200/50 shadow-2xl">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-bold text-gray-900 flex items-center">
                <Edit className="w-5 h-5 mr-2" />
                Editar Colaborador
              </h3>
              <button
                onClick={handleCancelEdit}
                className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100/50 rounded-lg transition-colors duration-200"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Nombre del Colaborador
                </label>
                <input
                  type="text"
                  value={editForm.name}
                  onChange={(e) => setEditForm(prev => ({ ...prev, name: e.target.value }))}
                  className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white/70"
                  placeholder="Nombre del colaborador"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Comisión Base (%)
                </label>
                <input
                  type="number"
                  value={editForm.basePct}
                  onChange={(e) => setEditForm(prev => ({ ...prev, basePct: e.target.value }))}
                  className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white/70"
                  placeholder="Ej: 5 (dejar vacío para variable)"
                  min="0"
                  max="100"
                  step="0.1"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Estado
                </label>
                <select
                  value={editForm.status}
                  onChange={(e) => setEditForm(prev => ({ ...prev, status: e.target.value }))}
                  className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white/70"
                >
                  <option value="active">Activo</option>
                  <option value="inactive">Inactivo</option>
                </select>
              </div>
            </div>

            <div className="flex space-x-3 mt-6">
              <button
                onClick={handleCancelEdit}
                className="flex-1 px-4 py-3 border border-gray-200 text-gray-700 rounded-xl hover:bg-gray-50 transition-colors duration-200"
              >
                Cancelar
              </button>
              <button
                onClick={handleSaveEdit}
                className="flex-1 px-4 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-xl transition-colors duration-200 flex items-center justify-center space-x-2"
              >
                <Save className="w-4 h-4" />
                <span>Guardar</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default CollaboratorManagement;