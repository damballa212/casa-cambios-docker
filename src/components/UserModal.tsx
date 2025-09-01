import React, { useState, useEffect } from 'react';
import { 
  X, 
  User, 
  Lock, 
  Shield, 
  Eye, 
  EyeOff,
  CheckCircle,
  AlertTriangle,
  Save,
  UserPlus,
  Edit3
} from 'lucide-react';

// Tipos de usuario
export interface UserData {
  id?: number;
  username: string;
  email: string;
  password?: string;
  role: 'user' | 'admin' | 'moderator' | 'owner';
  status: 'active' | 'inactive';
  permissions: string[];
  lastLogin?: string | null;
  createdAt?: string;
}

// Props del modal
interface UserModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (userData: UserData) => Promise<void>;
  user?: UserData | null; // Si se pasa un usuario, es modo edición
  mode: 'create' | 'edit';
}

// Roles disponibles
const USER_ROLES = [
  {
    value: 'user',
    label: 'Usuario',
    description: 'Acceso básico al sistema',
    color: 'bg-gray-100 text-gray-800',
    permissions: ['read']
  },
  {
    value: 'moderator',
    label: 'Moderador',
    description: 'Permisos de moderación',
    color: 'bg-blue-100 text-blue-800',
    permissions: ['read', 'write']
  },
  {
    value: 'admin',
    label: 'Administrador',
    description: 'Acceso administrativo completo',
    color: 'bg-purple-100 text-purple-800',
    permissions: ['read', 'write', 'delete', 'admin']
  },
  {
    value: 'owner',
    label: 'Propietario',
    description: 'Acceso total al sistema',
    color: 'bg-red-100 text-red-800',
    permissions: ['read', 'write', 'delete', 'admin', 'owner']
  }
];

// Permisos disponibles
const AVAILABLE_PERMISSIONS = [
  {
    key: 'read',
    label: 'Lectura',
    description: 'Ver información del sistema',
    icon: Eye
  },
  {
    key: 'write',
    label: 'Escritura',
    description: 'Crear y modificar datos',
    icon: Edit3
  },
  {
    key: 'delete',
    label: 'Eliminación',
    description: 'Eliminar registros',
    icon: X
  },
  {
    key: 'admin',
    label: 'Administración',
    description: 'Funciones administrativas',
    icon: Shield
  },
  {
    key: 'owner',
    label: 'Propietario',
    description: 'Acceso total del propietario',
    icon: User
  }
];

const UserModal: React.FC<UserModalProps> = ({
  isOpen,
  onClose,
  onSave,
  user,
  mode
}) => {
  const [formData, setFormData] = useState<UserData>({
    username: '',
    email: '',
    password: '',
    role: 'user',
    status: 'active',
    permissions: ['read']
  });
  
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [notification, setNotification] = useState<{type: 'success' | 'error' | 'warning', message: string} | null>(null);

  // Inicializar formulario cuando se abre el modal
  useEffect(() => {
    if (isOpen) {
      if (mode === 'edit' && user) {
        setFormData({
          ...user,
          password: '' // No mostrar contraseña en modo edición
        });
        setConfirmPassword('');
      } else {
        setFormData({
          username: '',
          email: '',
          password: '',
          role: 'user',
          status: 'active',
          permissions: ['read']
        });
        setConfirmPassword('');
      }
      setErrors({});
      setNotification(null);
    }
  }, [isOpen, mode, user]);

  // Actualizar permisos cuando cambia el rol
  useEffect(() => {
    const selectedRole = USER_ROLES.find(role => role.value === formData.role);
    if (selectedRole) {
      setFormData(prev => ({
        ...prev,
        permissions: [...selectedRole.permissions]
      }));
    }
  }, [formData.role]);

  // Validar formulario
  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!formData.username.trim()) {
      newErrors.username = 'El nombre de usuario es requerido';
    } else if (formData.username.length < 3) {
      newErrors.username = 'El nombre de usuario debe tener al menos 3 caracteres';
    }

    if (!formData.email.trim()) {
      newErrors.email = 'El email es requerido';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = 'El formato del email no es válido';
    }

    if (mode === 'create' || formData.password) {
      if (!formData.password) {
        newErrors.password = 'La contraseña es requerida';
      } else if (formData.password.length < 6) {
        newErrors.password = 'La contraseña debe tener al menos 6 caracteres';
      }

      if (formData.password !== confirmPassword) {
        newErrors.confirmPassword = 'Las contraseñas no coinciden';
      }
    }

    if (formData.permissions.length === 0) {
      newErrors.permissions = 'Debe seleccionar al menos un permiso';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Manejar envío del formulario
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      setNotification({
        type: 'error',
        message: 'Por favor corrige los errores en el formulario'
      });
      return;
    }

    setIsLoading(true);
    
    try {
      const userData = { ...formData };
      
      // Si es modo edición y no se cambió la contraseña, no la incluir
      if (mode === 'edit' && !formData.password) {
        delete userData.password;
      }
      
      await onSave(userData);
      
      setNotification({
        type: 'success',
        message: mode === 'create' ? 'Usuario creado exitosamente' : 'Usuario actualizado exitosamente'
      });
      
      // Cerrar modal después de un breve delay
      setTimeout(() => {
        onClose();
      }, 1500);
      
    } catch (error: any) {
      setNotification({
        type: 'error',
        message: error.message || 'Error al guardar el usuario'
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Manejar cambio de permisos
  const handlePermissionChange = (permission: string, checked: boolean) => {
    setFormData(prev => ({
      ...prev,
      permissions: checked 
        ? [...prev.permissions, permission]
        : prev.permissions.filter(p => p !== permission)
    }));
  };

  // Cerrar notificación
  const closeNotification = () => {
    setNotification(null);
  };

  if (!isOpen) return null;

  const selectedRole = USER_ROLES.find(role => role.value === formData.role);

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="bg-gradient-to-r from-blue-600 to-purple-600 px-6 py-4 text-white">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              {mode === 'create' ? (
                <UserPlus className="w-6 h-6" />
              ) : (
                <Edit3 className="w-6 h-6" />
              )}
              <div>
                <h2 className="text-xl font-bold">
                  {mode === 'create' ? 'Crear Nuevo Usuario' : 'Editar Usuario'}
                </h2>
                <p className="text-blue-100 text-sm">
                  {mode === 'create' 
                    ? 'Configura los datos del nuevo usuario del sistema'
                    : `Modificar información de ${user?.username}`
                  }
                </p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-2 hover:bg-white/20 rounded-lg transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto max-h-[calc(90vh-140px)]">
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Información básica */}
            <div className="bg-gray-50 rounded-xl p-4">
              <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                <User className="w-5 h-5 mr-2 text-blue-600" />
                Información Básica
              </h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Nombre de Usuario *
                  </label>
                  <input
                    type="text"
                    value={formData.username}
                    onChange={(e) => setFormData(prev => ({ ...prev, username: e.target.value }))}
                    className={`w-full px-4 py-3 border rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors ${
                      errors.username ? 'border-red-300 bg-red-50' : 'border-gray-300 bg-white'
                    }`}
                    placeholder="usuario123"
                  />
                  {errors.username && (
                    <p className="text-red-600 text-sm mt-1 flex items-center">
                      <AlertTriangle className="w-4 h-4 mr-1" />
                      {errors.username}
                    </p>
                  )}
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Email *
                  </label>
                  <input
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
                    className={`w-full px-4 py-3 border rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors ${
                      errors.email ? 'border-red-300 bg-red-50' : 'border-gray-300 bg-white'
                    }`}
                    placeholder="usuario@ejemplo.com"
                  />
                  {errors.email && (
                    <p className="text-red-600 text-sm mt-1 flex items-center">
                      <AlertTriangle className="w-4 h-4 mr-1" />
                      {errors.email}
                    </p>
                  )}
                </div>
              </div>
            </div>

            {/* Contraseña */}
            <div className="bg-gray-50 rounded-xl p-4">
              <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                <Lock className="w-5 h-5 mr-2 text-blue-600" />
                {mode === 'create' ? 'Contraseña' : 'Cambiar Contraseña (Opcional)'}
              </h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    {mode === 'create' ? 'Contraseña *' : 'Nueva Contraseña'}
                  </label>
                  <div className="relative">
                    <input
                      type={showPassword ? 'text' : 'password'}
                      value={formData.password}
                      onChange={(e) => setFormData(prev => ({ ...prev, password: e.target.value }))}
                      className={`w-full px-4 py-3 pr-12 border rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors ${
                        errors.password ? 'border-red-300 bg-red-50' : 'border-gray-300 bg-white'
                      }`}
                      placeholder="••••••••"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                    >
                      {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                    </button>
                  </div>
                  {errors.password && (
                    <p className="text-red-600 text-sm mt-1 flex items-center">
                      <AlertTriangle className="w-4 h-4 mr-1" />
                      {errors.password}
                    </p>
                  )}
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    {mode === 'create' ? 'Confirmar Contraseña *' : 'Confirmar Nueva Contraseña'}
                  </label>
                  <div className="relative">
                    <input
                      type={showConfirmPassword ? 'text' : 'password'}
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      className={`w-full px-4 py-3 pr-12 border rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors ${
                        errors.confirmPassword ? 'border-red-300 bg-red-50' : 'border-gray-300 bg-white'
                      }`}
                      placeholder="••••••••"
                    />
                    <button
                      type="button"
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                      className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                    >
                      {showConfirmPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                    </button>
                  </div>
                  {errors.confirmPassword && (
                    <p className="text-red-600 text-sm mt-1 flex items-center">
                      <AlertTriangle className="w-4 h-4 mr-1" />
                      {errors.confirmPassword}
                    </p>
                  )}
                </div>
              </div>
            </div>

            {/* Rol y Estado */}
            <div className="bg-gray-50 rounded-xl p-4">
              <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                <Shield className="w-5 h-5 mr-2 text-blue-600" />
                Rol y Estado
              </h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Rol del Usuario *
                  </label>
                  <select
                    value={formData.role}
                    onChange={(e) => setFormData(prev => ({ ...prev, role: e.target.value as any }))}
                    className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
                  >
                    {USER_ROLES.map((role) => (
                      <option key={role.value} value={role.value}>
                        {role.label} - {role.description}
                      </option>
                    ))}
                  </select>
                  {selectedRole && (
                    <div className="mt-2">
                      <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${selectedRole.color}`}>
                        {selectedRole.label}
                      </span>
                    </div>
                  )}
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Estado del Usuario
                  </label>
                  <select
                    value={formData.status}
                    onChange={(e) => setFormData(prev => ({ ...prev, status: e.target.value as any }))}
                    className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
                  >
                    <option value="active">Activo</option>
                    <option value="inactive">Inactivo</option>
                  </select>
                  <div className="mt-2">
                    <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${
                      formData.status === 'active' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                    }`}>
                      {formData.status === 'active' ? 'Activo' : 'Inactivo'}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Permisos */}
            <div className="bg-gray-50 rounded-xl p-4">
              <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                <CheckCircle className="w-5 h-5 mr-2 text-blue-600" />
                Permisos del Usuario
              </h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {AVAILABLE_PERMISSIONS.map((permission) => {
                  const Icon = permission.icon;
                  const isChecked = formData.permissions.includes(permission.key);
                  
                  return (
                    <label key={permission.key} className="flex items-start space-x-3 p-3 border border-gray-200 rounded-lg hover:bg-white transition-colors cursor-pointer">
                      <input
                        type="checkbox"
                        checked={isChecked}
                        onChange={(e) => handlePermissionChange(permission.key, e.target.checked)}
                        className="mt-1 rounded focus:ring-blue-500 text-blue-600"
                      />
                      <div className="flex-1">
                        <div className="flex items-center space-x-2">
                          <Icon className="w-4 h-4 text-blue-600" />
                          <span className="font-medium text-gray-900">{permission.label}</span>
                        </div>
                        <p className="text-sm text-gray-600 mt-1">{permission.description}</p>
                      </div>
                    </label>
                  );
                })}
              </div>
              
              {errors.permissions && (
                <p className="text-red-600 text-sm mt-2 flex items-center">
                  <AlertTriangle className="w-4 h-4 mr-1" />
                  {errors.permissions}
                </p>
              )}
            </div>
          </form>
        </div>

        {/* Footer */}
        <div className="bg-gray-50 px-6 py-4 border-t border-gray-200">
          <div className="flex justify-between items-center">
            <button
              type="button"
              onClick={onClose}
              className="px-6 py-2 text-gray-600 hover:text-gray-800 font-medium transition-colors"
            >
              Cancelar
            </button>
            
            <button
              onClick={handleSubmit}
              disabled={isLoading}
              className="flex items-center space-x-2 px-6 py-3 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 disabled:from-gray-400 disabled:to-gray-500 text-white font-medium rounded-xl transition-all duration-200 shadow-lg hover:shadow-xl"
            >
              {isLoading ? (
                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
              ) : (
                <Save className="w-5 h-5" />
              )}
              <span>
                {isLoading 
                  ? 'Guardando...' 
                  : mode === 'create' 
                    ? 'Crear Usuario' 
                    : 'Actualizar Usuario'
                }
              </span>
            </button>
          </div>
        </div>
      </div>

      {/* Notification */}
      {notification && (
        <div className="fixed top-4 right-4 z-60 max-w-md">
          <div className={`p-4 rounded-xl shadow-2xl border-l-4 ${
            notification.type === 'success' 
              ? 'bg-green-50 border-green-500 text-green-800'
              : notification.type === 'error'
              ? 'bg-red-50 border-red-500 text-red-800'
              : 'bg-yellow-50 border-yellow-500 text-yellow-800'
          }`}>
            <div className="flex items-start">
              <div className="flex-shrink-0">
                {notification.type === 'success' && <CheckCircle className="w-5 h-5 text-green-600" />}
                {notification.type === 'error' && <AlertTriangle className="w-5 h-5 text-red-600" />}
                {notification.type === 'warning' && <AlertTriangle className="w-5 h-5 text-yellow-600" />}
              </div>
              <div className="ml-3 flex-1">
                <p className="text-sm font-medium">
                  {notification.type === 'success' && '¡Éxito!'}
                  {notification.type === 'error' && 'Error'}
                  {notification.type === 'warning' && 'Advertencia'}
                </p>
                <p className="text-sm mt-1">{notification.message}</p>
              </div>
              <button
                onClick={closeNotification}
                className="ml-4 text-gray-400 hover:text-gray-600"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default UserModal;