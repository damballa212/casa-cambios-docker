import React, { useState, useEffect } from 'react';
import { Users, Plus, Edit, TrendingUp, DollarSign, Phone, Calendar, Search, Filter, X, Save } from 'lucide-react';
import { apiService } from '../services/api';

interface Client {
  id: number;
  name: string;
  phone: string;
  email?: string;
  totalTransactions: number;
  totalVolumeUsd: number;
  totalCommissions: number;
  averageTransaction: number;
  lastTransactionDate: string;
  status: 'active' | 'inactive';
  preferredRate?: number;
  notes?: string;
}

const ClientManagement: React.FC = () => {
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingClient, setEditingClient] = useState<Client | null>(null);
  const [editForm, setEditForm] = useState({ name: '', phone: '', status: 'active', notes: '' });
  const [addForm, setAddForm] = useState({ name: '', phone: '', email: '', notes: '' });
  const [clients, setClients] = useState<Client[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Cargar clientes desde el API
  useEffect(() => {
    const fetchClients = async () => {
      try {
        console.log('🔍 Frontend: Iniciando carga de clientes...');
        setLoading(true);
        const data = await apiService.getClients();
        console.log('✅ Frontend: Datos recibidos:', data);
        console.log('📊 Frontend: Número de clientes:', data?.length || 0);
        setClients(data);
        setError(null);
      } catch (err) {
        console.error('❌ Frontend: Error fetching clients:', err);
        setError('Error al cargar los clientes');
        setClients([]);
      } finally {
        setLoading(false);
      }
    };

    fetchClients();
  }, []);

  // Manejar la apertura del modal de edición
  const handleEditClient = (client: Client) => {
    setEditingClient(client);
    setEditForm({
      name: client.name,
      phone: client.phone,
      status: client.status,
      notes: client.notes || ''
    });
  };

  // Manejar el guardado de cambios
  const handleSaveEdit = async () => {
    if (!editingClient) return;
    
    try {
      setIsSubmitting(true);
      
      const updatedClient = {
        ...editingClient,
        name: editForm.name,
        phone: editForm.phone,
        status: editForm.status as 'active' | 'inactive',
        notes: editForm.notes
      };
      
      await apiService.updateClient(editingClient.id, updatedClient);
      
      // Actualizar el estado local
      setClients(prev => prev.map(client => 
        client.id === editingClient.id ? updatedClient : client
      ));
      
      // Cerrar el modal
      setEditingClient(null);
      setEditForm({ name: '', phone: '', status: 'active', notes: '' });
    } catch (error) {
      console.error('Error al guardar cambios:', error);
      alert('Error al guardar los cambios del cliente');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Cerrar modal sin guardar
  const handleCancelEdit = () => {
    setEditingClient(null);
    setEditForm({ name: '', phone: '', status: 'active', notes: '' });
  };

  // Manejar agregar nuevo cliente
  const handleAddClient = async () => {
    if (!addForm.name.trim() || !addForm.phone.trim()) {
      alert('Por favor completa el nombre y teléfono del cliente');
      return;
    }

    try {
      setIsSubmitting(true);
      
      // Crear nuevo cliente
      const newClientData = {
        name: addForm.name.trim(),
        phone: addForm.phone.trim(),
        email: addForm.email.trim() || undefined,
        notes: addForm.notes.trim() || undefined
      };

      const response = await apiService.createClient(newClientData);
       
       if (response.success) {
         // Agregar al estado local
         setClients(prev => [response.client, ...prev]);
       } else {
         throw new Error(response.message || 'Error al crear cliente');
       }
      
      // Limpiar formulario y cerrar modal
      setAddForm({ name: '', phone: '', email: '', notes: '' });
      setShowAddForm(false);
      
      console.log('Cliente agregado:', response.client);
    } catch (error) {
      console.error('Error al agregar cliente:', error);
      alert('Error al agregar el cliente');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Cancelar agregar cliente
  const handleCancelAdd = () => {
    setAddForm({ name: '', phone: '', email: '', notes: '' });
    setShowAddForm(false);
  };

  // Filtrar clientes
  const filteredClients = clients.filter(client => {
    const matchesSearch = client.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         client.phone.includes(searchTerm);
    const matchesStatus = statusFilter === 'all' || client.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold text-gray-900">Gestión de Clientes</h1>
        <button 
          onClick={() => setShowAddForm(true)}
          className="flex items-center space-x-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors duration-200"
        >
          <Plus className="w-4 h-4" />
          <span>Nuevo Cliente</span>
        </button>
      </div>

      {/* Filters */}
      <div className="bg-white/70 backdrop-blur-md rounded-2xl p-6 border border-gray-200/50 shadow-lg">
        <div className="flex flex-col sm:flex-row space-y-4 sm:space-y-0 sm:space-x-4">
          <div className="flex-1 relative">
            <Search className="w-5 h-5 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="Buscar por nombre o teléfono..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white/50"
            />
          </div>
          <div className="relative">
            <Filter className="w-5 h-5 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="pl-10 pr-8 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white/50 min-w-[150px]"
            >
              <option value="all">Todos los estados</option>
              <option value="active">Activos</option>
              <option value="inactive">Inactivos</option>
            </select>
          </div>
        </div>
      </div>

      {/* Loading State */}
      {loading && (
        <div className="bg-white/70 backdrop-blur-md rounded-2xl border border-gray-200/50 shadow-lg p-8">
          <div className="flex items-center justify-center space-x-3">
            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
            <span className="text-gray-600">Cargando clientes...</span>
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

      {/* Clients Grid */}
      {!loading && !error && (
        <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
          {filteredClients.map((client) => (
            <div key={client.id} className="bg-white/70 backdrop-blur-md rounded-2xl p-6 border border-gray-200/50 shadow-lg hover:shadow-xl transition-shadow duration-300">
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center space-x-3">
                  <div className="w-12 h-12 bg-gradient-to-r from-green-500 to-green-600 rounded-xl flex items-center justify-center">
                    <Users className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900">{client.name}</h3>
                    <span className={`text-xs px-2 py-1 rounded-full ${
                      client.status === 'active' 
                        ? 'bg-green-100 text-green-700' 
                        : 'bg-red-100 text-red-700'
                    }`}>
                      {client.status === 'active' ? 'Activo' : 'Inactivo'}
                    </span>
                  </div>
                </div>
                <button
                  onClick={() => handleEditClient(client)}
                  className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100/50 rounded-lg transition-colors duration-200"
                >
                  <Edit className="w-4 h-4" />
                </button>
              </div>

              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">Teléfono</span>
                  <div className="flex items-center space-x-1">
                    <Phone className="w-4 h-4 text-gray-400" />
                    <span className="font-medium text-gray-900 text-sm">{client.phone}</span>
                  </div>
                </div>
                

                
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">Transacciones</span>
                  <span className="font-medium text-gray-900">{client.totalTransactions}</span>
                </div>
                
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">Volumen Total USD</span>
                  <div className="flex items-center space-x-1">
                    <DollarSign className="w-4 h-4 text-green-500" />
                    <span className="font-medium text-gray-900">${(client.totalVolumeUsd || 0).toFixed(2)}</span>
                  </div>
                </div>
                
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">Promedio/Transacción</span>
                  <span className="font-medium text-gray-900">${(client.averageTransaction || 0).toFixed(2)}</span>
                </div>
                
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">Última Transacción</span>
                  <div className="flex items-center space-x-1">
                    <Calendar className="w-4 h-4 text-gray-400" />
                    <span className="font-medium text-gray-900 text-sm">
                      {new Date(client.lastTransactionDate).toLocaleDateString()}
                    </span>
                  </div>
                </div>
              </div>

              {client.notes && (
                <div className="mt-4 p-3 bg-gray-50/70 rounded-xl">
                  <p className="text-xs text-gray-600">
                    <strong>Notas:</strong> {client.notes}
                  </p>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Statistics */}
      {!loading && !error && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <div className="bg-white/70 backdrop-blur-md rounded-2xl p-6 border border-gray-200/50 shadow-lg">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Total Clientes</p>
                <p className="text-2xl font-bold text-gray-900">{filteredClients.length}</p>
              </div>
              <Users className="w-8 h-8 text-green-500" />
            </div>
          </div>
          
          <div className="bg-white/70 backdrop-blur-md rounded-2xl p-6 border border-gray-200/50 shadow-lg">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Volumen Total USD</p>
                <p className="text-2xl font-bold text-gray-900">
                  ${filteredClients.reduce((sum, c) => sum + (c.totalVolumeUsd || 0), 0).toFixed(2)}
                </p>
              </div>
              <DollarSign className="w-8 h-8 text-blue-500" />
            </div>
          </div>
          
          <div className="bg-white/70 backdrop-blur-md rounded-2xl p-6 border border-gray-200/50 shadow-lg">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Promedio por Cliente</p>
                <p className="text-2xl font-bold text-gray-900">
                  ${filteredClients.length > 0 ? (filteredClients.reduce((sum, c) => sum + (c.totalVolumeUsd || 0), 0) / filteredClients.length).toFixed(2) : '0.00'}
                </p>
              </div>
              <TrendingUp className="w-8 h-8 text-purple-500" />
            </div>
          </div>
          
          <div className="bg-white/70 backdrop-blur-md rounded-2xl p-6 border border-gray-200/50 shadow-lg">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Cliente Top</p>
                <p className="text-lg font-bold text-gray-900">
                  {filteredClients.length > 0 ? 
                    filteredClients.reduce((prev, current) => 
                      prev.totalVolumeUsd > current.totalVolumeUsd ? prev : current
                    ).name : 'N/A'
                  }
                </p>
              </div>
              <TrendingUp className="w-8 h-8 text-orange-500" />
            </div>
          </div>
        </div>
      )}

      {/* Modal de Agregar Cliente */}
      {showAddForm && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50">
          <div className="bg-white/90 backdrop-blur-md rounded-2xl p-6 w-full max-w-md mx-4 border border-gray-200/50 shadow-2xl">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-bold text-gray-900 flex items-center">
                <Plus className="w-5 h-5 mr-2" />
                Nuevo Cliente
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
                  Nombre del Cliente *
                </label>
                <input
                  type="text"
                  value={addForm.name}
                  onChange={(e) => setAddForm(prev => ({ ...prev, name: e.target.value }))}
                  className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white/70"
                  placeholder="Nombre completo del cliente"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Teléfono *
                </label>
                <input
                  type="text"
                  value={addForm.phone}
                  onChange={(e) => setAddForm(prev => ({ ...prev, phone: e.target.value }))}
                  className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white/70"
                  placeholder="Número de teléfono"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Email (opcional)
                </label>
                <input
                  type="email"
                  value={addForm.email}
                  onChange={(e) => setAddForm(prev => ({ ...prev, email: e.target.value }))}
                  className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white/70"
                  placeholder="correo@ejemplo.com"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Notas (opcional)
                </label>
                <textarea
                  value={addForm.notes}
                  onChange={(e) => setAddForm(prev => ({ ...prev, notes: e.target.value }))}
                  className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white/70"
                  placeholder="Notas adicionales sobre el cliente..."
                  rows={3}
                />
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
                onClick={handleAddClient}
                disabled={isSubmitting || !addForm.name.trim() || !addForm.phone.trim()}
                className="flex-1 px-4 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-xl transition-colors duration-200 flex items-center justify-center space-x-2 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <Plus className="w-4 h-4" />
                <span>{isSubmitting ? 'Agregando...' : 'Agregar Cliente'}</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal de Edición */}
      {editingClient && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50">
          <div className="bg-white/90 backdrop-blur-md rounded-2xl p-6 w-full max-w-md mx-4 border border-gray-200/50 shadow-2xl">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-bold text-gray-900 flex items-center">
                <Edit className="w-5 h-5 mr-2" />
                Editar Cliente
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
                  Nombre del Cliente
                </label>
                <input
                  type="text"
                  value={editForm.name}
                  onChange={(e) => setEditForm(prev => ({ ...prev, name: e.target.value }))}
                  className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white/70"
                  placeholder="Nombre del cliente"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Teléfono
                </label>
                <input
                  type="text"
                  value={editForm.phone}
                  onChange={(e) => setEditForm(prev => ({ ...prev, phone: e.target.value }))}
                  className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white/70"
                  placeholder="Número de teléfono"
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

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Notas
                </label>
                <textarea
                  value={editForm.notes}
                  onChange={(e) => setEditForm(prev => ({ ...prev, notes: e.target.value }))}
                  className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white/70"
                  placeholder="Notas adicionales sobre el cliente..."
                  rows={3}
                />
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

export default ClientManagement;