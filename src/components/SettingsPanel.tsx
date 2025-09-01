import React, { useState, useEffect } from 'react';
import { 
  Settings, 
  Shield, 
  Database, 
  MessageSquare, 
  Bell, 
  User, 
  Key,
  Save,
  RefreshCw,
  AlertTriangle,
  Download,
  Upload,
  Plus,
  Edit,
  Trash2,
  UserPlus,
  Crown,
  Shield as ShieldIcon
} from 'lucide-react';
import BackupModal from './BackupModal';
import DatabaseModal from './DatabaseModal';
import NotificationSystem, { useNotifications } from './NotificationSystem';
import { apiService, GeneralSettings, SecuritySettings, SystemUser, CreateUserRequest, UpdateUserRequest, DatabaseInfo, BackupConfiguration, CreateBackupConfigRequest } from '../services/api';

const SettingsPanel: React.FC = () => {
  const [activeSection, setActiveSection] = useState('general');
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  
  // Sistema de notificaciones
  const { notifications, addNotification, removeNotification } = useNotifications();
  
  // Estados para modales
  const [showDatabaseModal, setShowDatabaseModal] = useState(false);
  const [showBackupModal, setShowBackupModal] = useState(false);
  
  // Estados para configuración general
  const [generalSettings, setGeneralSettings] = useState<GeneralSettings>({
    systemName: '',
    timezone: '',
    primaryCurrency: '',
    autoUpdatesEnabled: false
  });
  
  // Estados para configuración de seguridad
  const [securitySettings, setSecuritySettings] = useState<SecuritySettings>({
    rateLimitMessages: 10,
    rateLimitWindow: 60,
    allowedIPs: [],
    auditLogsEnabled: true,
    requireIdempotencyKey: true
  });
  
  // Estados para gestión de usuarios
  const [users, setUsers] = useState<SystemUser[]>([]);
  const [showUserModal, setShowUserModal] = useState(false);
  const [editingUser, setEditingUser] = useState<SystemUser | null>(null);
  const [userFormData, setUserFormData] = useState<CreateUserRequest>({
    username: '',
    password: '',
    role: 'user'
  });
  const [showDeleteConfirm, setShowDeleteConfirm] = useState<number | null>(null);
  
  // Estados para información de base de datos
  const [databaseInfo, setDatabaseInfo] = useState<DatabaseInfo | null>(null);
  const [isTestingConnection, setIsTestingConnection] = useState(false);
  
  // Estados para configuraciones de backup automático
  const [backupConfigurations, setBackupConfigurations] = useState<BackupConfiguration[]>([]);
  const [showBackupConfigModal, setShowBackupConfigModal] = useState(false);
  const [editingBackupConfig, setEditingBackupConfig] = useState<BackupConfiguration | null>(null);
  const [backupConfigFormData, setBackupConfigFormData] = useState<CreateBackupConfigRequest>({
    name: '',
    schedule_type: 'daily',
    schedule_time: '02:00',
    retention_days: 30,
    max_backups: 10,
    enabled: true,
    notification_enabled: false,
    notification_emails: []
  });
  const [showDeleteBackupConfirm, setShowDeleteBackupConfirm] = useState<number | null>(null);
  
  // Cargar configuración al montar el componente
  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    setIsLoading(true);
    try {
      // Cargar configuración general
      const generalResponse = await apiService.getGeneralSettings();
      if (generalResponse.success) {
        setGeneralSettings(generalResponse.settings);
      }
      
      // Cargar configuración de seguridad
      const securityResponse = await apiService.getSecuritySettings();
      if (securityResponse.success) {
        setSecuritySettings(securityResponse.settings);
      }
      
      // Cargar usuarios
      const usersResponse = await apiService.getUsers();
      if (usersResponse.success) {
        setUsers(usersResponse.users);
      }
      
      // Cargar información de base de datos
      const databaseResponse = await apiService.getDatabaseInfo();
      if (databaseResponse.success) {
        setDatabaseInfo(databaseResponse.database);
      }
      
      // Cargar configuraciones de backup automático
      const backupConfigsResponse = await apiService.getBackupConfigurations();
      if (backupConfigsResponse.success) {
        setBackupConfigurations(backupConfigsResponse.configurations as BackupConfiguration[]);
      }
    } catch (error) {
      console.error('Error cargando configuración:', error);
      addNotification({
        title: 'Error de Carga',
        message: 'Error cargando la configuración del sistema',
        type: 'error'
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Funciones para gestión de usuarios
  const handleCreateUser = async () => {
    setIsSaving(true);
    try {
      const response = await apiService.createUser(userFormData);
      if (response.success) {
        setUsers(prev => [...prev, response.user]);
        setShowUserModal(false);
        setUserFormData({ username: '', password: '', role: 'user' });
        addNotification({
          title: 'Usuario Creado',
          message: `Usuario "${response.user.username}" creado exitosamente`,
          type: 'success'
        });
      }
    } catch (error: any) {
      console.error('Error creando usuario:', error);
      addNotification({
        title: 'Error al Crear Usuario',
        message: error.message || 'Error creando usuario',
        type: 'error'
      });
    } finally {
      setIsSaving(false);
    }
  };

  const handleUpdateUser = async () => {
    if (!editingUser) return;
    
    setIsSaving(true);
    try {
      const updateData: UpdateUserRequest = {
        username: userFormData.username,
        role: userFormData.role
      };
      
      if (userFormData.password && userFormData.password.trim() !== '') {
        updateData.password = userFormData.password;
      }
      
      const response = await apiService.updateUser(editingUser.id, updateData);
      if (response.success) {
        setUsers(prev => prev.map(u => u.id === editingUser.id ? response.user : u));
        setShowUserModal(false);
        setEditingUser(null);
        setUserFormData({ username: '', password: '', role: 'user' });
        addNotification({
          title: 'Usuario Actualizado',
          message: `Usuario "${response.user.username}" actualizado exitosamente`,
          type: 'success'
        });
      }
    } catch (error: any) {
      console.error('Error actualizando usuario:', error);
      addNotification({
        title: 'Error al Actualizar Usuario',
        message: error.message || 'Error actualizando usuario',
        type: 'error'
      });
    } finally {
      setIsSaving(false);
    }
  };

  const handleDeleteUser = async (userId: number) => {
    setIsSaving(true);
    try {
      const response = await apiService.deleteUser(userId);
      if (response.success) {
        setUsers(prev => prev.filter(u => u.id !== userId));
        setShowDeleteConfirm(null);
        addNotification({
          title: 'Usuario Eliminado',
          message: response.message,
          type: 'success'
        });
      }
    } catch (error: any) {
      console.error('Error eliminando usuario:', error);
      addNotification({
        title: 'Error al Eliminar Usuario',
        message: error.message || 'Error eliminando usuario',
        type: 'error'
      });
    } finally {
      setIsSaving(false);
    }
  };

  const openCreateModal = () => {
    setEditingUser(null);
    setUserFormData({ username: '', password: '', role: 'user' });
    setShowUserModal(true);
  };

  const openEditModal = (user: SystemUser) => {
    setEditingUser(user);
    setUserFormData({ username: user.username, password: '', role: user.role });
    setShowUserModal(true);
  };

  const getRoleIcon = (role: string) => {
    switch (role) {
      case 'owner': return <Crown className="w-5 h-5 text-yellow-600" />;
      case 'admin': return <ShieldIcon className="w-5 h-5 text-blue-600" />;
      default: return <User className="w-5 h-5 text-gray-600" />;
    }
  };

  const getRoleColor = (role: string) => {
    switch (role) {
      case 'owner': return 'from-yellow-400 to-yellow-600';
      case 'admin': return 'from-blue-400 to-blue-600';
      default: return 'from-gray-400 to-gray-600';
    }
  };

  const getRoleLabel = (role: string) => {
    switch (role) {
      case 'owner': return 'Propietario';
      case 'admin': return 'Administrador';
      default: return 'Usuario';
    }
  };

  // Funciones para gestión de base de datos
  const handleTestConnection = async () => {
    setIsTestingConnection(true);
    try {
      const response = await apiService.testDatabaseConnection();
      if (response.success) {
        addNotification({
          title: 'Conexión Exitosa',
          message: response.message,
          type: 'success'
        });
        // Recargar información de base de datos
        const databaseResponse = await apiService.getDatabaseInfo();
        if (databaseResponse.success) {
          setDatabaseInfo(databaseResponse.database);
        }
      }
    } catch (error: any) {
      console.error('Error probando conexión:', error);
      addNotification({
        title: 'Error de Conexión',
        message: error.message || 'Error probando conexión a la base de datos',
        type: 'error'
      });
    } finally {
      setIsTestingConnection(false);
    }
  };

  // Funciones para gestión de configuraciones de backup automático
  const handleCreateBackupConfig = async () => {
    setIsSaving(true);
    try {
      const response = await apiService.createBackupConfiguration(backupConfigFormData);
      if (response.success) {
        setBackupConfigurations(prev => [...prev, response.configuration]);
        setShowBackupConfigModal(false);
        setBackupConfigFormData({
          name: '',
          schedule_type: 'daily',
          schedule_time: '02:00',
          retention_days: 30,
          max_backups: 10,
          enabled: true,
          notification_enabled: false,
          notification_emails: []
        });
        addNotification({
          title: 'Configuración Creada',
          message: `Configuración de backup "${response.configuration.name}" creada exitosamente`,
          type: 'success'
        });
      }
    } catch (error: any) {
      console.error('Error creando configuración de backup:', error);
      addNotification({
        title: 'Error al Crear Configuración',
        message: error.message || 'Error creando configuración de backup',
        type: 'error'
      });
    } finally {
      setIsSaving(false);
    }
  };

  const handleUpdateBackupConfig = async () => {
    if (!editingBackupConfig) return;
    
    setIsSaving(true);
    try {
      const response = await apiService.updateBackupConfiguration(editingBackupConfig.id, backupConfigFormData);
      if (response.success) {
        setBackupConfigurations(prev => 
          prev.map(config => config.id === editingBackupConfig.id ? response.configuration : config)
        );
        setShowBackupConfigModal(false);
        setEditingBackupConfig(null);
        setBackupConfigFormData({
          name: '',
          schedule_type: 'daily',
          schedule_time: '02:00',
          retention_days: 30,
          max_backups: 10,
          enabled: true,
          notification_enabled: false,
          notification_emails: []
        });
        addNotification({
          title: 'Configuración Actualizada',
          message: `Configuración "${response.configuration.name}" actualizada exitosamente`,
          type: 'success'
        });
      }
    } catch (error: any) {
      console.error('Error actualizando configuración de backup:', error);
      addNotification({
        title: 'Error al Actualizar Configuración',
        message: error.message || 'Error actualizando configuración de backup',
        type: 'error'
      });
    } finally {
      setIsSaving(false);
    }
  };

  const handleDeleteBackupConfig = async (configId: number) => {
    setIsSaving(true);
    try {
      const response = await apiService.deleteBackupConfiguration(configId);
      if (response.success) {
        setBackupConfigurations(prev => prev.filter(config => config.id !== configId));
        setShowDeleteBackupConfirm(null);
        addNotification({
          title: 'Configuración Eliminada',
          message: response.message,
          type: 'success'
        });
      }
    } catch (error: any) {
      console.error('Error eliminando configuración de backup:', error);
      addNotification({
        title: 'Error al Eliminar Configuración',
        message: error.message || 'Error eliminando configuración de backup',
        type: 'error'
      });
    } finally {
      setIsSaving(false);
    }
  };

  const openCreateBackupConfigModal = () => {
    setEditingBackupConfig(null);
    setBackupConfigFormData({
      name: '',
      schedule_type: 'daily',
      schedule_time: '02:00',
      retention_days: 30,
      max_backups: 10,
      enabled: true,
      notification_enabled: false,
      notification_emails: []
    });
    setShowBackupConfigModal(true);
  };

  const openEditBackupConfigModal = (config: BackupConfiguration) => {
    setEditingBackupConfig(config);
    setBackupConfigFormData({
      name: config.name,
      schedule_type: config.schedule_type,
      schedule_time: config.schedule_time,
      schedule_days: config.schedule_days,
      schedule_date: config.schedule_date,
      retention_days: config.retention_days,
      max_backups: config.max_backups,
      description: config.description,
      enabled: config.enabled,
      notification_enabled: config.notification_enabled,
      notification_emails: config.notification_emails
    });
    setShowBackupConfigModal(true);
  };

  const getScheduleTypeLabel = (type: string) => {
    switch (type) {
      case 'daily': return 'Diario';
      case 'weekly': return 'Semanal';
      case 'monthly': return 'Mensual';
      case 'custom': return 'Personalizado';
      default: return type;
    }
  };

  const formatScheduleDescription = (config: BackupConfiguration) => {
    switch (config.schedule_type) {
      case 'daily':
        return `Todos los días a las ${config.schedule_time}`;
      case 'weekly':
        const days = config.schedule_days?.map(d => {
          const dayNames = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'];
          return dayNames[d];
        }).join(', ');
        return `${days} a las ${config.schedule_time}`;
      case 'monthly':
        return `Día ${config.schedule_date} de cada mes a las ${config.schedule_time}`;
      default:
        return 'Programación personalizada';
    }
  };

  const handleToggleBackupConfig = async (configId: number, currentEnabled: boolean) => {
    try {
      const response = await apiService.updateBackupConfiguration(configId, {
        enabled: !currentEnabled
      });
      
      if (response.success) {
        setBackupConfigurations(prev => 
          prev.map(config => 
            config.id === configId 
              ? { ...config, enabled: !currentEnabled }
              : config
          )
        );
        
        addNotification({
          title: !currentEnabled ? 'Configuración Activada' : 'Configuración Desactivada',
          message: `La configuración ha sido ${!currentEnabled ? 'activada' : 'desactivada'} exitosamente`,
          type: 'success'
        });
      }
    } catch (error: any) {
      console.error('Error cambiando estado de configuración:', error);
      addNotification({
        title: 'Error al Cambiar Estado',
        message: error.message || 'Error cambiando el estado de la configuración',
        type: 'error'
      });
    }
  };

  const sections = [
    { id: 'general', label: 'General', icon: Settings },
    { id: 'security', label: 'Seguridad', icon: Shield },
    { id: 'database', label: 'Base de Datos', icon: Database },
    { id: 'whatsapp', label: 'WhatsApp', icon: MessageSquare },
    { id: 'notifications', label: 'Notificaciones', icon: Bell },
    { id: 'users', label: 'Usuarios', icon: User }
  ];

  const handleSave = async () => {
    setIsSaving(true);
    try {
      if (activeSection === 'general') {
        await apiService.updateGeneralSettings(generalSettings);
        addNotification({
          title: 'Configuración Guardada',
          message: 'Configuración general actualizada exitosamente',
          type: 'success'
        });
      } else if (activeSection === 'security') {
        await apiService.updateSecuritySettings(securitySettings);
        addNotification({
          title: 'Configuración Guardada',
          message: 'Configuración de seguridad actualizada exitosamente',
          type: 'success'
        });
      } else if (activeSection === 'users') {
        addNotification({
          title: 'Información',
          message: 'Los cambios de usuario se guardan individualmente',
          type: 'info'
        });
      }
    } catch (error: any) {
      console.error('Error guardando configuración:', error);
      addNotification({
        title: 'Error al Guardar',
        message: error.message || 'Error guardando la configuración',
        type: 'error'
      });
    } finally {
      setIsSaving(false);
    }
  };

  const renderGeneralSettings = () => (
    <div className="space-y-6">
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">Nombre del Sistema</label>
        <input
          type="text"
          value={generalSettings.systemName}
          onChange={(e) => setGeneralSettings(prev => ({ ...prev, systemName: e.target.value }))}
          className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white/50"
          disabled={isLoading}
        />
      </div>
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">Zona Horaria</label>
        <select 
          value={generalSettings.timezone}
          onChange={(e) => setGeneralSettings(prev => ({ ...prev, timezone: e.target.value }))}
          className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white/50"
          disabled={isLoading}
        >
          <option value="America/Asuncion">America/Asuncion</option>
          <option value="America/Sao_Paulo">America/Sao_Paulo</option>
          <option value="America/Buenos_Aires">America/Buenos_Aires</option>
        </select>
      </div>
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">Moneda Principal</label>
        <select 
          value={generalSettings.primaryCurrency}
          onChange={(e) => setGeneralSettings(prev => ({ ...prev, primaryCurrency: e.target.value }))}
          className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white/50"
          disabled={isLoading}
        >
          <option value="PYG">Guaraní Paraguayo (PYG)</option>
          <option value="USD">Dólar Estadounidense (USD)</option>
        </select>
      </div>
      <div>
        <label className="flex items-center space-x-2">
          <input 
            type="checkbox" 
            checked={generalSettings.autoUpdatesEnabled}
            onChange={(e) => setGeneralSettings(prev => ({ ...prev, autoUpdatesEnabled: e.target.checked }))}
            className="rounded focus:ring-blue-500" 
            disabled={isLoading}
          />
          <span className="text-sm text-gray-700">Habilitar actualizaciones automáticas</span>
        </label>
      </div>
    </div>
  );

  const renderSecuritySettings = () => (
    <div className="space-y-6">
      <div className="p-4 bg-yellow-50/70 border border-yellow-200 rounded-xl">
        <div className="flex items-center space-x-2">
          <AlertTriangle className="w-5 h-5 text-yellow-600" />
          <h3 className="text-sm font-medium text-yellow-800">Configuración de Seguridad Crítica</h3>
        </div>
        <p className="text-xs text-yellow-700 mt-1">Estos ajustes afectan directamente la seguridad del sistema</p>
      </div>
      
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">Rate Limiting (mensajes por minuto)</label>
        <input
          type="number"
          value={securitySettings.rateLimitMessages}
          onChange={(e) => setSecuritySettings(prev => ({ ...prev, rateLimitMessages: parseInt(e.target.value) || 1 }))}
          min="1"
          max="100"
          className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white/50"
          disabled={isLoading}
        />
      </div>
      
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">Ventana de Rate Limiting (segundos)</label>
        <input
          type="number"
          value={securitySettings.rateLimitWindow}
          onChange={(e) => setSecuritySettings(prev => ({ ...prev, rateLimitWindow: parseInt(e.target.value) || 10 }))}
          min="10"
          max="600"
          className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white/50"
          disabled={isLoading}
        />
      </div>
      
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">IPs Permitidas (una por línea)</label>
        <textarea
          rows={4}
          value={securitySettings.allowedIPs.join('\n')}
          onChange={(e) => setSecuritySettings(prev => ({ ...prev, allowedIPs: e.target.value.split('\n').filter(ip => ip.trim()) }))}
          className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white/50"
          disabled={isLoading}
        />
      </div>
      
      <div>
        <label className="flex items-center space-x-2">
          <input 
            type="checkbox" 
            checked={securitySettings.auditLogsEnabled}
            onChange={(e) => setSecuritySettings(prev => ({ ...prev, auditLogsEnabled: e.target.checked }))}
            className="rounded focus:ring-blue-500" 
            disabled={isLoading}
          />
          <span className="text-sm text-gray-700">Habilitar logs de auditoría</span>
        </label>
      </div>
      
      <div>
        <label className="flex items-center space-x-2">
          <input 
            type="checkbox" 
            checked={securitySettings.requireIdempotencyKey}
            onChange={(e) => setSecuritySettings(prev => ({ ...prev, requireIdempotencyKey: e.target.checked }))}
            className="rounded focus:ring-blue-500" 
            disabled={isLoading}
          />
          <span className="text-sm text-gray-700">Requerir idempotency key</span>
        </label>
      </div>
    </div>
  );

  const renderDatabaseSettings = () => (
    <div className="space-y-8">
      {/* Información Real de la Base de Datos */}
      <div className="bg-white/70 backdrop-blur-md rounded-2xl p-6 border border-gray-200/50 shadow-lg">
        <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center space-x-2">
          <Database className="w-5 h-5 text-blue-600" />
          <span>Información de la Base de Datos</span>
        </h3>
        
        {isLoading ? (
          <div className="flex items-center justify-center py-8">
            <RefreshCw className="w-6 h-6 animate-spin text-blue-600" />
            <span className="ml-2 text-gray-600">Cargando información...</span>
          </div>
        ) : databaseInfo ? (
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
              <div className="bg-gray-50/70 rounded-xl p-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">Host PostgreSQL</label>
                <div className="text-lg font-semibold text-gray-900">{databaseInfo.connection.host}</div>
              </div>
              
              <div className="bg-gray-50/70 rounded-xl p-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">Puerto</label>
                <div className="text-lg font-semibold text-gray-900">{databaseInfo.connection.port}</div>
              </div>
              
              <div className="bg-gray-50/70 rounded-xl p-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">Base de Datos</label>
                <div className="text-lg font-semibold text-gray-900">{databaseInfo.connection.database}</div>
              </div>
              
              <div className="bg-gray-50/70 rounded-xl p-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">Pool de Conexiones</label>
                <div className="text-lg font-semibold text-gray-900">{databaseInfo.connection.poolSize}</div>
              </div>
            </div>
            
            {/* Estadísticas de la Base de Datos */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
              <div className="bg-blue-50/70 rounded-xl p-4 text-center">
                <div className="text-2xl font-bold text-blue-600">{databaseInfo.statistics.totalTables}</div>
                <div className="text-sm text-blue-700">Tablas</div>
              </div>
              <div className="bg-green-50/70 rounded-xl p-4 text-center">
                <div className="text-2xl font-bold text-green-600">{databaseInfo.statistics.totalRecords.toLocaleString()}</div>
                <div className="text-sm text-green-700">Registros</div>
              </div>
              <div className="bg-purple-50/70 rounded-xl p-4 text-center">
                <div className="text-2xl font-bold text-purple-600">{databaseInfo.statistics.databaseSize}</div>
                <div className="text-sm text-purple-700">Tamaño</div>
              </div>
              <div className="bg-orange-50/70 rounded-xl p-4 text-center">
                <div className="text-2xl font-bold text-orange-600">{Math.floor(databaseInfo.statistics.uptime / 3600)}h</div>
                <div className="text-sm text-orange-700">Uptime</div>
              </div>
            </div>
            
            {/* Estado de las Tablas */}
            <div className="mb-6">
              <h4 className="text-md font-semibold text-gray-900 mb-3">Estado de las Tablas</h4>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                {databaseInfo.tables.map((table) => (
                  <div key={table.name} className="bg-gray-50/70 rounded-lg p-3">
                    <div className="flex items-center justify-between mb-1">
                      <span className="font-medium text-gray-900">{table.name}</span>
                      <span className={`text-xs px-2 py-1 rounded-full ${
                        table.status === 'active' 
                          ? 'bg-green-100 text-green-700' 
                          : 'bg-red-100 text-red-700'
                      }`}>
                        {table.status === 'active' ? 'Activa' : 'Error'}
                      </span>
                    </div>
                    <div className="text-xs text-gray-600 mb-1">{table.description}</div>
                    <div className="text-sm font-semibold text-blue-600">{table.records.toLocaleString()} registros</div>
                  </div>
                ))}
              </div>
            </div>
          </>
        ) : (
          <div className="text-center py-8">
            <Database className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-600">No se pudo cargar la información de la base de datos</p>
          </div>
        )}
        
        <div className="flex items-center justify-between pt-4 border-t border-gray-200">
          <div className="flex items-center space-x-2">
            <div className={`w-3 h-3 rounded-full ${
              databaseInfo?.connection.connected ? 'bg-green-500' : 'bg-red-500'
            }`}></div>
            <span className="text-sm text-gray-700">
              {databaseInfo?.connection.connected ? 'Conectado' : 'Desconectado'}
            </span>
            {databaseInfo?.connection.lastCheck && (
              <span className="text-xs text-gray-500">
                • Última verificación: {new Date(databaseInfo.connection.lastCheck).toLocaleTimeString()}
              </span>
            )}
          </div>
          
          <button 
            onClick={handleTestConnection}
            disabled={isTestingConnection}
            className="flex items-center space-x-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white rounded-lg transition-colors duration-200"
          >
            {isTestingConnection ? (
              <RefreshCw className="w-4 h-4 animate-spin" />
            ) : (
              <Database className="w-4 h-4" />
            )}
            <span>{isTestingConnection ? 'Probando...' : 'Probar Conexión'}</span>
          </button>
        </div>
      </div>
      
      {/* Configuraciones de Backup Automático */}
      <div className="bg-white/70 backdrop-blur-md rounded-2xl p-6 border border-gray-200/50 shadow-lg">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-gray-900 flex items-center space-x-2">
            <RefreshCw className="w-5 h-5 text-green-600" />
            <span>Configuraciones de Backup Automático</span>
          </h3>
          <button
            onClick={openCreateBackupConfigModal}
            disabled={isLoading}
            className="flex items-center space-x-2 px-4 py-2 bg-green-600 hover:bg-green-700 disabled:bg-green-400 text-white rounded-lg transition-colors"
          >
            <Plus className="w-4 h-4" />
            <span>Nueva Configuración</span>
          </button>
        </div>
        
        {isLoading ? (
          <div className="flex items-center justify-center py-8">
            <RefreshCw className="w-6 h-6 animate-spin text-green-600" />
            <span className="ml-2 text-gray-600">Cargando configuraciones...</span>
          </div>
        ) : backupConfigurations.length === 0 ? (
          <div className="text-center py-8">
            <RefreshCw className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-600">No hay configuraciones de backup automático</p>
            <p className="text-sm text-gray-500 mt-1">Crea una nueva configuración para automatizar tus backups</p>
          </div>
        ) : (
          <div className="space-y-3">
            {backupConfigurations.map((config) => (
              <div key={config.id} className="bg-gray-50/70 rounded-xl p-4">
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <div className="flex items-center space-x-3 mb-2">
                      <h4 className="font-semibold text-gray-900">{config.name}</h4>
                      <span className={`text-xs px-2 py-1 rounded-full ${
                        config.enabled 
                          ? 'bg-green-100 text-green-700' 
                          : 'bg-gray-100 text-gray-700'
                      }`}>
                        {config.enabled ? 'Activo' : 'Inactivo'}
                      </span>
                      <span className="text-xs px-2 py-1 bg-blue-100 text-blue-700 rounded-full">
                        {getScheduleTypeLabel(config.schedule_type)}
                      </span>
                    </div>
                    <div className="text-sm text-gray-600 mb-1">
                      📅 {formatScheduleDescription(config)}
                    </div>
                    <div className="text-xs text-gray-500">
                      🗂️ Retención: {config.retention_days} días • Máximo: {config.max_backups} backups
                      {config.notification_enabled && ' • 📧 Notificaciones activas'}
                    </div>
                    {config.description && (
                      <div className="text-xs text-gray-500 mt-1 italic">{config.description}</div>
                    )}
                  </div>
                  
                  <div className="flex items-center space-x-3">
                    {/* Toggle para activar/desactivar */}
                    <div className="flex items-center space-x-2">
                      <span className="text-xs text-gray-600">Estado:</span>
                      <button
                        onClick={() => handleToggleBackupConfig(config.id, config.enabled)}
                        disabled={isSaving}
                        className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2 ${
                          config.enabled ? 'bg-green-600' : 'bg-gray-200'
                        }`}
                        title={config.enabled ? 'Desactivar configuración' : 'Activar configuración'}
                      >
                        <span
                          className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                            config.enabled ? 'translate-x-6' : 'translate-x-1'
                          }`}
                        />
                      </button>
                    </div>
                    
                    <div className="flex items-center space-x-2">
                      <button
                        onClick={() => openEditBackupConfigModal(config)}
                        disabled={isSaving}
                        className="p-2 text-blue-600 hover:bg-blue-100 rounded-lg transition-colors"
                        title="Editar configuración"
                      >
                        <Edit className="w-4 h-4" />
                      </button>
                      
                      <button
                        onClick={() => setShowDeleteBackupConfirm(config.id)}
                        disabled={isSaving}
                        className="p-2 text-red-600 hover:bg-red-100 rounded-lg transition-colors"
                        title="Eliminar configuración"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
      
      {/* Herramientas Avanzadas */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Gestión de Base de Datos */}
        <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-xl p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center space-x-3">
              <Database className="w-6 h-6 text-blue-600" />
              <h3 className="text-lg font-semibold text-blue-800">Gestión Avanzada</h3>
            </div>
          </div>
          
          <p className="text-blue-700 text-sm mb-4">
            Acceda a herramientas profesionales para la gestión completa de su base de datos, incluyendo información detallada y formateo seguro.
          </p>
          
          <div className="grid grid-cols-1 gap-3 mb-4">
            <div className="bg-white border border-blue-200 rounded-lg p-3">
              <div className="flex items-center space-x-2 mb-1">
                <Database className="w-4 h-4 text-blue-600" />
                <h4 className="font-semibold text-blue-800 text-sm">Información del Sistema</h4>
              </div>
              <p className="text-xs text-blue-700">Estadísticas, tablas y rendimiento</p>
            </div>
            
            <div className="bg-white border border-red-200 rounded-lg p-3">
              <div className="flex items-center space-x-2 mb-1">
                <AlertTriangle className="w-4 h-4 text-red-600" />
                <h4 className="font-semibold text-red-800 text-sm">Formateo Seguro</h4>
              </div>
              <p className="text-xs text-red-700">Limpieza completa con backup automático</p>
            </div>
          </div>
          
          <button
            onClick={() => setShowDatabaseModal(true)}
            className="w-full flex items-center justify-center space-x-2 px-4 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white rounded-lg transition-all duration-200 font-medium shadow-lg hover:shadow-xl transform hover:-translate-y-0.5"
          >
            <Database className="w-5 h-5" />
            <span>Abrir Gestión de Base de Datos</span>
          </button>
        </div>
        
        {/* Sistema de Backups */}
        <div className="bg-gradient-to-r from-green-50 to-emerald-50 border border-green-200 rounded-xl p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center space-x-3">
              <Download className="w-6 h-6 text-green-600" />
              <h3 className="text-lg font-semibold text-green-800">Sistema de Backups</h3>
            </div>
          </div>
          
          <p className="text-green-700 text-sm mb-4">
            Gestione sus backups con herramientas avanzadas: creación automática, restauración con progreso y verificación de integridad.
          </p>
          
          <div className="grid grid-cols-1 gap-3 mb-4">
            <div className="bg-white border border-green-200 rounded-lg p-3">
              <div className="flex items-center space-x-2 mb-1">
                <Download className="w-4 h-4 text-green-600" />
                <h4 className="font-semibold text-green-800 text-sm">Crear Backup</h4>
              </div>
              <p className="text-xs text-green-700">Backup completo con progreso en tiempo real</p>
            </div>
            
            <div className="bg-white border border-blue-200 rounded-lg p-3">
              <div className="flex items-center space-x-2 mb-1">
                <Upload className="w-4 h-4 text-blue-600" />
                <h4 className="font-semibold text-blue-800 text-sm">Restaurar</h4>
              </div>
              <p className="text-xs text-blue-700">Restauración segura con verificación</p>
            </div>
          </div>
          
          <button
            onClick={() => setShowBackupModal(true)}
            className="w-full flex items-center justify-center space-x-2 px-4 py-3 bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white rounded-lg transition-all duration-200 font-medium shadow-lg hover:shadow-xl transform hover:-translate-y-0.5"
          >
            <Download className="w-5 h-5" />
            <span>Abrir Gestión de Backups</span>
          </button>
        </div>
      </div>
    </div>
  );

  const renderWhatsAppSettings = () => (
    <div className="space-y-6">
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">Servidor URL</label>
        <input
          type="url"
          defaultValue="https://api.whatsapp-evolution.com"
          className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white/50"
        />
      </div>
      
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">Instancia</label>
        <input
          type="text"
          defaultValue="casa_cambios_prod"
          className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white/50"
        />
      </div>
      
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">API Key</label>
        <div className="relative">
          <input
            type="password"
            defaultValue="your-api-key-here"
            className="w-full px-4 py-3 pr-12 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white/50"
          />
          <Key className="w-5 h-5 text-gray-400 absolute right-3 top-1/2 transform -translate-y-1/2" />
        </div>
      </div>
      
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">Delay entre mensajes (ms)</label>
        <input
          type="number"
          defaultValue="2000"
          min="500"
          max="10000"
          className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white/50"
        />
      </div>
      
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">Reintentos máximos</label>
        <input
          type="number"
          defaultValue="3"
          min="1"
          max="10"
          className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white/50"
        />
      </div>
    </div>
  );

  const renderNotificationSettings = () => (
    <div className="space-y-6">
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">Email de Notificaciones</label>
        <input
          type="email"
          defaultValue="admin@casacambios.com"
          className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white/50"
        />
      </div>
      
      <div>
        <label className="flex items-center space-x-2">
          <input type="checkbox" defaultChecked className="rounded focus:ring-blue-500" />
          <span className="text-sm text-gray-700">Notificar transacciones completadas</span>
        </label>
      </div>
      
      <div>
        <label className="flex items-center space-x-2">
          <input type="checkbox" defaultChecked className="rounded focus:ring-blue-500" />
          <span className="text-sm text-gray-700">Notificar errores del sistema</span>
        </label>
      </div>
      
      <div>
        <label className="flex items-center space-x-2">
          <input type="checkbox" className="rounded focus:ring-blue-500" />
          <span className="text-sm text-gray-700">Notificar cambios de tasa</span>
        </label>
      </div>
    </div>
  );

  const renderUserSettings = () => (
    <div className="space-y-6">
      {/* Header con botón de crear usuario */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold text-gray-900">Gestión de Usuarios</h3>
          <p className="text-sm text-gray-600">Administra los usuarios del sistema con acceso completo</p>
        </div>
        <button
          onClick={openCreateModal}
          disabled={isLoading}
          className="flex items-center space-x-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white rounded-lg transition-colors"
        >
          <UserPlus className="w-4 h-4" />
          <span>Nuevo Usuario</span>
        </button>
      </div>

      {/* Lista de usuarios */}
      <div className="bg-white/70 backdrop-blur-md rounded-2xl p-6 border border-gray-200/50 shadow-lg">
        {isLoading ? (
          <div className="flex items-center justify-center py-8">
            <RefreshCw className="w-6 h-6 animate-spin text-blue-600" />
            <span className="ml-2 text-gray-600">Cargando usuarios...</span>
          </div>
        ) : users.length === 0 ? (
          <div className="text-center py-8">
            <User className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-600">No hay usuarios registrados</p>
          </div>
        ) : (
          <div className="space-y-3">
            {users.map((user) => (
              <div key={user.id} className="flex items-center justify-between p-4 bg-gray-50/70 rounded-xl hover:bg-gray-100/70 transition-colors">
                <div className="flex items-center space-x-3">
                  <div className={`w-10 h-10 bg-gradient-to-r ${getRoleColor(user.role)} rounded-full flex items-center justify-center`}>
                    {getRoleIcon(user.role)}
                  </div>
                  <div>
                    <h4 className="font-semibold text-gray-900">{user.username}</h4>
                    <p className="text-sm text-gray-600">{getRoleLabel(user.role)}</p>
                  </div>
                </div>
                
                <div className="flex items-center space-x-2">
                  <button
                    onClick={() => openEditModal(user)}
                    disabled={isSaving}
                    className="p-2 text-blue-600 hover:bg-blue-100 rounded-lg transition-colors"
                    title="Editar usuario"
                  >
                    <Edit className="w-4 h-4" />
                  </button>
                  
                  <button
                    onClick={() => setShowDeleteConfirm(user.id)}
                    disabled={isSaving}
                    className="p-2 text-red-600 hover:bg-red-100 rounded-lg transition-colors"
                    title="Eliminar usuario"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );

  const renderActiveSection = () => {
    switch (activeSection) {
      case 'general': return renderGeneralSettings();
      case 'security': return renderSecuritySettings();
      case 'database': return renderDatabaseSettings();
      case 'whatsapp': return renderWhatsAppSettings();
      case 'notifications': return renderNotificationSettings();
      case 'users': return renderUserSettings();
      default: return renderGeneralSettings();
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="bg-white/80 backdrop-blur-md rounded-3xl shadow-2xl border border-white/20 overflow-hidden">
          {/* Header */}
          <div className="bg-gradient-to-r from-blue-600 to-purple-600 px-8 py-6">
            <div className="flex items-center space-x-3">
              <Settings className="w-8 h-8 text-white" />
              <div>
                <h1 className="text-2xl font-bold text-white">Configuración del Sistema</h1>
                <p className="text-blue-100">Administra la configuración y ajustes del sistema</p>
              </div>
            </div>
          </div>

          <div className="flex">
            {/* Sidebar */}
            <div className="w-64 bg-gray-50/70 border-r border-gray-200/50 p-6">
              <nav className="space-y-2">
                {sections.map((section) => {
                  const Icon = section.icon;
                  return (
                    <button
                      key={section.id}
                      onClick={() => setActiveSection(section.id)}
                      className={`w-full flex items-center space-x-3 px-4 py-3 rounded-xl transition-all duration-200 ${
                        activeSection === section.id
                          ? 'bg-blue-600 text-white shadow-lg'
                          : 'text-gray-700 hover:bg-white/70 hover:shadow-md'
                      }`}
                    >
                      <Icon className="w-5 h-5" />
                      <span className="font-medium">{section.label}</span>
                    </button>
                  );
                })}
              </nav>
            </div>

            {/* Main Content */}
            <div className="flex-1 p-8">
              <div className="mb-6">
                <h2 className="text-xl font-semibold text-gray-900 mb-2">
                  {sections.find(s => s.id === activeSection)?.label}
                </h2>
                <p className="text-gray-600">Configura los ajustes de esta sección</p>
              </div>

              {renderActiveSection()}

              {/* Save Button */}
              <div className="mt-8 flex justify-end">
                <button
                  onClick={handleSave}
                  disabled={isSaving || !['general', 'security', 'users'].includes(activeSection)}
                  className="flex items-center space-x-2 px-6 py-3 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white rounded-xl transition-colors font-medium shadow-lg"
                >
                  {isSaving ? (
                    <RefreshCw className="w-5 h-5 animate-spin" />
                  ) : (
                    <Save className="w-5 h-5" />
                  )}
                  <span>
                    {isSaving ? 'Guardando...' : 
                     ['general', 'security', 'users'].includes(activeSection) ? 'Guardar Cambios' : 'No disponible'}
                  </span>
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Modales Profesionales */}
      <DatabaseModal
        isOpen={showDatabaseModal}
        onClose={() => setShowDatabaseModal(false)}
        onSuccess={(message: string) => addNotification({ type: 'success', title: 'Base de Datos', message })}
        onError={(message: string) => addNotification({ type: 'error', title: 'Error', message })}
      />
      
      <BackupModal
        isOpen={showBackupModal}
        onClose={() => setShowBackupModal(false)}
        onSuccess={(message: string) => addNotification({ type: 'success', title: 'Backup', message })}
        onError={(message: string) => addNotification({ type: 'error', title: 'Error', message })}
      />

      {/* Modales de Usuario - Globales */}
      {showUserModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-[9999]">
          <div className="bg-white rounded-2xl p-6 w-full max-w-md mx-4 shadow-2xl">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              {editingUser ? 'Editar Usuario' : 'Nuevo Usuario'}
            </h3>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Nombre de Usuario</label>
                <input
                  type="text"
                  value={userFormData.username}
                  onChange={(e) => setUserFormData(prev => ({ ...prev, username: e.target.value }))}
                  className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Ingrese el nombre de usuario"
                  disabled={isSaving}
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  {editingUser ? 'Nueva Contraseña (opcional)' : 'Contraseña'}
                </label>
                <input
                  type="password"
                  value={userFormData.password}
                  onChange={(e) => setUserFormData(prev => ({ ...prev, password: e.target.value }))}
                  className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder={editingUser ? "Dejar vacío para mantener actual" : "Ingrese la contraseña"}
                  disabled={isSaving}
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Rol</label>
                <select
                  value={userFormData.role}
                  onChange={(e) => setUserFormData(prev => ({ ...prev, role: e.target.value as 'admin' | 'owner' | 'user' }))}
                  className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  disabled={isSaving}
                >
                  <option value="user">Usuario</option>
                  <option value="admin">Administrador</option>
                  <option value="owner">Propietario</option>
                </select>
              </div>
            </div>
            
            <div className="flex space-x-3 mt-6">
              <button
                onClick={() => {
                  setShowUserModal(false);
                  setEditingUser(null);
                  setUserFormData({ username: '', password: '', role: 'user' });
                }}
                disabled={isSaving}
                className="flex-1 px-4 py-2 border border-gray-200 text-gray-700 rounded-xl hover:bg-gray-50 transition-colors"
              >
                Cancelar
              </button>
              <button
                onClick={editingUser ? handleUpdateUser : handleCreateUser}
                disabled={isSaving || !userFormData.username || (!editingUser && !userFormData.password)}
                className="flex-1 px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white rounded-xl transition-colors flex items-center justify-center space-x-2"
              >
                {isSaving && <RefreshCw className="w-4 h-4 animate-spin" />}
                <span>{editingUser ? 'Actualizar' : 'Crear'}</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {showDeleteConfirm && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-[9999]">
          <div className="bg-white rounded-2xl p-6 w-full max-w-md mx-4 shadow-2xl">
            <div className="text-center">
              <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <AlertTriangle className="w-6 h-6 text-red-600" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Confirmar Eliminación</h3>
              <p className="text-gray-600 mb-6">
                ¿Estás seguro de que deseas eliminar este usuario? Esta acción no se puede deshacer.
              </p>
              
              <div className="flex space-x-3">
                <button
                  onClick={() => setShowDeleteConfirm(null)}
                  disabled={isSaving}
                  className="flex-1 px-4 py-2 border border-gray-200 text-gray-700 rounded-xl hover:bg-gray-50 transition-colors"
                >
                  Cancelar
                </button>
                <button
                  onClick={() => handleDeleteUser(showDeleteConfirm)}
                  disabled={isSaving}
                  className="flex-1 px-4 py-2 bg-red-600 hover:bg-red-700 disabled:bg-red-400 text-white rounded-xl transition-colors flex items-center justify-center space-x-2"
                >
                  {isSaving && <RefreshCw className="w-4 h-4 animate-spin" />}
                  <span>Eliminar</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
      
      {/* Modales de Configuración de Backup Automático - Globales */}
      {showBackupConfigModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-[9999] p-4">
          <div className="bg-white rounded-2xl p-6 w-full max-w-2xl shadow-2xl max-h-[90vh] overflow-y-auto">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              {editingBackupConfig ? 'Editar Configuración de Backup' : 'Nueva Configuración de Backup'}
            </h3>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Nombre de la Configuración</label>
                <input
                  type="text"
                  value={backupConfigFormData.name}
                  onChange={(e) => setBackupConfigFormData(prev => ({ ...prev, name: e.target.value }))}
                  className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
                  placeholder="Ej: Backup Diario Producción"
                  disabled={isSaving}
                />
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Tipo de Programación</label>
                  <select
                    value={backupConfigFormData.schedule_type}
                    onChange={(e) => setBackupConfigFormData(prev => ({ ...prev, schedule_type: e.target.value as any }))}
                    className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
                    disabled={isSaving}
                  >
                    <option value="daily">Diario</option>
                    <option value="weekly">Semanal</option>
                    <option value="monthly">Mensual</option>
                    <option value="custom">Personalizado</option>
                  </select>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Hora de Ejecución</label>
                  <input
                    type="time"
                    value={backupConfigFormData.schedule_time}
                    onChange={(e) => setBackupConfigFormData(prev => ({ ...prev, schedule_time: e.target.value }))}
                    className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
                    disabled={isSaving}
                  />
                </div>
              </div>
              
              {backupConfigFormData.schedule_type === 'weekly' && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Días de la Semana</label>
                  <div className="grid grid-cols-7 gap-2">
                    {['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'].map((day, index) => (
                      <label key={index} className="flex items-center justify-center p-2 border border-gray-200 rounded-lg cursor-pointer hover:bg-gray-50">
                        <input
                          type="checkbox"
                          checked={backupConfigFormData.schedule_days?.includes(index) || false}
                          onChange={(e) => {
                            const days = backupConfigFormData.schedule_days || [];
                            if (e.target.checked) {
                              setBackupConfigFormData(prev => ({ ...prev, schedule_days: [...days, index] }));
                            } else {
                              setBackupConfigFormData(prev => ({ ...prev, schedule_days: days.filter(d => d !== index) }));
                            }
                          }}
                          className="sr-only"
                          disabled={isSaving}
                        />
                        <span className={`text-sm font-medium ${
                          backupConfigFormData.schedule_days?.includes(index) 
                            ? 'text-green-600' 
                            : 'text-gray-600'
                        }`}>
                          {day}
                        </span>
                      </label>
                    ))}
                  </div>
                </div>
              )}
              
              {backupConfigFormData.schedule_type === 'monthly' && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Día del Mes</label>
                  <input
                    type="number"
                    min="1"
                    max="31"
                    value={backupConfigFormData.schedule_date || 1}
                    onChange={(e) => setBackupConfigFormData(prev => ({ ...prev, schedule_date: parseInt(e.target.value) }))}
                    className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
                    disabled={isSaving}
                  />
                </div>
              )}
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Días de Retención</label>
                  <input
                    type="number"
                    min="1"
                    max="365"
                    value={backupConfigFormData.retention_days}
                    onChange={(e) => setBackupConfigFormData(prev => ({ ...prev, retention_days: parseInt(e.target.value) || 30 }))}
                    className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
                    disabled={isSaving}
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Máximo de Backups</label>
                  <input
                    type="number"
                    min="1"
                    max="100"
                    value={backupConfigFormData.max_backups}
                    onChange={(e) => setBackupConfigFormData(prev => ({ ...prev, max_backups: parseInt(e.target.value) || 10 }))}
                    className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
                    disabled={isSaving}
                  />
                </div>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Descripción (Opcional)</label>
                <textarea
                  rows={3}
                  value={backupConfigFormData.description || ''}
                  onChange={(e) => setBackupConfigFormData(prev => ({ ...prev, description: e.target.value }))}
                  className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
                  placeholder="Descripción de la configuración de backup..."
                  disabled={isSaving}
                />
              </div>
              
              <div className="space-y-3">
                <label className="flex items-center space-x-2">
                  <input 
                    type="checkbox" 
                    checked={backupConfigFormData.enabled}
                    onChange={(e) => setBackupConfigFormData(prev => ({ ...prev, enabled: e.target.checked }))}
                    className="rounded focus:ring-green-500" 
                    disabled={isSaving}
                  />
                  <span className="text-sm text-gray-700">Habilitar configuración</span>
                </label>
                
                <label className="flex items-center space-x-2">
                  <input 
                    type="checkbox" 
                    checked={backupConfigFormData.notification_enabled}
                    onChange={(e) => setBackupConfigFormData(prev => ({ ...prev, notification_enabled: e.target.checked }))}
                    className="rounded focus:ring-green-500" 
                    disabled={isSaving}
                  />
                  <span className="text-sm text-gray-700">Habilitar notificaciones por email</span>
                </label>
              </div>
              
              {backupConfigFormData.notification_enabled && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Emails de Notificación</label>
                  <textarea
                    rows={2}
                    value={backupConfigFormData.notification_emails?.join(', ') || ''}
                    onChange={(e) => setBackupConfigFormData(prev => ({ 
                      ...prev, 
                      notification_emails: e.target.value.split(',').map(email => email.trim()).filter(email => email)
                    }))}
                    className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
                    placeholder="email1@ejemplo.com, email2@ejemplo.com"
                    disabled={isSaving}
                  />
                </div>
              )}
            </div>
            
            <div className="flex flex-col sm:flex-row space-y-3 sm:space-y-0 sm:space-x-3 mt-6">
              <button
                onClick={() => {
                  setShowBackupConfigModal(false);
                  setEditingBackupConfig(null);
                  setBackupConfigFormData({
                    name: '',
                    schedule_type: 'daily',
                    schedule_time: '02:00',
                    retention_days: 30,
                    max_backups: 10,
                    enabled: true,
                    notification_enabled: false,
                    notification_emails: []
                  });
                }}
                disabled={isSaving}
                className="flex-1 px-4 py-2 border border-gray-200 text-gray-700 rounded-xl hover:bg-gray-50 transition-colors"
              >
                Cancelar
              </button>
              <button
                onClick={editingBackupConfig ? handleUpdateBackupConfig : handleCreateBackupConfig}
                disabled={isSaving || !backupConfigFormData.name || !backupConfigFormData.schedule_type}
                className="flex-1 px-4 py-2 bg-green-600 hover:bg-green-700 disabled:bg-green-400 text-white rounded-xl transition-colors flex items-center justify-center space-x-2"
              >
                {isSaving && <RefreshCw className="w-4 h-4 animate-spin" />}
                <span>{editingBackupConfig ? 'Actualizar' : 'Crear'}</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal de confirmación de eliminación de configuración de backup */}
      {showDeleteBackupConfirm && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-[9999] p-4">
          <div className="bg-white rounded-2xl p-6 w-full max-w-md shadow-2xl">
            <div className="text-center">
              <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <AlertTriangle className="w-6 h-6 text-red-600" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Confirmar Eliminación</h3>
              <p className="text-gray-600 mb-6">
                ¿Estás seguro de que deseas eliminar esta configuración de backup automático? Esta acción no se puede deshacer.
              </p>
              
              <div className="flex flex-col sm:flex-row space-y-3 sm:space-y-0 sm:space-x-3">
                <button
                  onClick={() => setShowDeleteBackupConfirm(null)}
                  disabled={isSaving}
                  className="flex-1 px-4 py-2 border border-gray-200 text-gray-700 rounded-xl hover:bg-gray-50 transition-colors"
                >
                  Cancelar
                </button>
                <button
                  onClick={() => handleDeleteBackupConfig(showDeleteBackupConfirm)}
                  disabled={isSaving}
                  className="flex-1 px-4 py-2 bg-red-600 hover:bg-red-700 disabled:bg-red-400 text-white rounded-xl transition-colors flex items-center justify-center space-x-2"
                >
                  {isSaving && <RefreshCw className="w-4 h-4 animate-spin" />}
                  <span>Eliminar</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
      
      {/* Sistema de Notificaciones */}
      <NotificationSystem
        notifications={notifications}
        onRemove={removeNotification}
      />
    </div>
  );
};

export default SettingsPanel;