import React, { useState } from 'react';
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
  AlertTriangle
} from 'lucide-react';

const SettingsPanel: React.FC = () => {
  const [activeSection, setActiveSection] = useState('general');
  const [isLoading, setIsLoading] = useState(false);

  const sections = [
    { id: 'general', label: 'General', icon: Settings },
    { id: 'security', label: 'Seguridad', icon: Shield },
    { id: 'database', label: 'Base de Datos', icon: Database },
    { id: 'whatsapp', label: 'WhatsApp', icon: MessageSquare },
    { id: 'notifications', label: 'Notificaciones', icon: Bell },
    { id: 'users', label: 'Usuarios', icon: User }
  ];

  const handleSave = async () => {
    setIsLoading(true);
    await new Promise(resolve => setTimeout(resolve, 2000));
    setIsLoading(false);
    alert('Configuración guardada exitosamente');
  };

  const renderGeneralSettings = () => (
    <div className="space-y-6">
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">Nombre del Sistema</label>
        <input
          type="text"
          defaultValue="Casa de Cambios TikTok Producción"
          className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white/50"
        />
      </div>
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">Zona Horaria</label>
        <select className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white/50">
          <option value="America/Asuncion">America/Asuncion</option>
          <option value="America/Sao_Paulo">America/Sao_Paulo</option>
          <option value="America/Buenos_Aires">America/Buenos_Aires</option>
        </select>
      </div>
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">Moneda Principal</label>
        <select className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white/50">
          <option value="PYG">Guaraní Paraguayo (PYG)</option>
          <option value="USD">Dólar Estadounidense (USD)</option>
        </select>
      </div>
      <div>
        <label className="flex items-center space-x-2">
          <input type="checkbox" defaultChecked className="rounded focus:ring-blue-500" />
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
          defaultValue="10"
          min="1"
          max="100"
          className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white/50"
        />
      </div>
      
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">Ventana de Rate Limiting (segundos)</label>
        <input
          type="number"
          defaultValue="60"
          min="10"
          max="600"
          className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white/50"
        />
      </div>
      
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">IPs Permitidas (una por línea)</label>
        <textarea
          rows={4}
          defaultValue="127.0.0.1&#10;192.168.1.0/24&#10;10.0.0.0/8"
          className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white/50"
        />
      </div>
      
      <div>
        <label className="flex items-center space-x-2">
          <input type="checkbox" defaultChecked className="rounded focus:ring-blue-500" />
          <span className="text-sm text-gray-700">Habilitar logs de auditoría</span>
        </label>
      </div>
      
      <div>
        <label className="flex items-center space-x-2">
          <input type="checkbox" defaultChecked className="rounded focus:ring-blue-500" />
          <span className="text-sm text-gray-700">Requerir idempotency key</span>
        </label>
      </div>
    </div>
  );

  const renderDatabaseSettings = () => (
    <div className="space-y-6">
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">Host PostgreSQL</label>
        <input
          type="text"
          defaultValue="localhost"
          className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white/50"
        />
      </div>
      
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">Puerto</label>
        <input
          type="number"
          defaultValue="5432"
          className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white/50"
        />
      </div>
      
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">Base de Datos</label>
        <input
          type="text"
          defaultValue="casa_cambios"
          className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white/50"
        />
      </div>
      
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">Pool de Conexiones (máximo)</label>
        <input
          type="number"
          defaultValue="20"
          min="5"
          max="100"
          className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white/50"
        />
      </div>
      
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">Timeout de Conexión (segundos)</label>
        <input
          type="number"
          defaultValue="30"
          min="5"
          max="300"
          className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white/50"
        />
      </div>
      
      <div>
        <label className="flex items-center space-x-2">
          <input type="checkbox" defaultChecked className="rounded focus:ring-blue-500" />
          <span className="text-sm text-gray-700">Habilitar backup automático</span>
        </label>
      </div>
      
      <button className="flex items-center space-x-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors duration-200">
        <Database className="w-4 h-4" />
        <span>Probar Conexión</span>
      </button>
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
      
      <div>
        <label className="flex items-center space-x-2">
          <input type="checkbox" defaultChecked className="rounded focus:ring-blue-500" />
          <span className="text-sm text-gray-700">Enviar confirmaciones automáticas</span>
        </label>
      </div>
      
      <button className="flex items-center space-x-2 px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg transition-colors duration-200">
        <MessageSquare className="w-4 h-4" />
        <span>Probar Conexión WhatsApp</span>
      </button>
    </div>
  );

  const renderNotificationSettings = () => (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Notificaciones por Email</h3>
        <div className="space-y-3">
          <label className="flex items-center space-x-2">
            <input type="checkbox" defaultChecked className="rounded focus:ring-blue-500" />
            <span className="text-sm text-gray-700">Errores críticos</span>
          </label>
          <label className="flex items-center space-x-2">
            <input type="checkbox" defaultChecked className="rounded focus:ring-blue-500" />
            <span className="text-sm text-gray-700">Transacciones exitosas</span>
          </label>
          <label className="flex items-center space-x-2">
            <input type="checkbox" className="rounded focus:ring-blue-500" />
            <span className="text-sm text-gray-700">Cambios de tasa</span>
          </label>
          <label className="flex items-center space-x-2">
            <input type="checkbox" className="rounded focus:ring-blue-500" />
            <span className="text-sm text-gray-700">Reportes diarios</span>
          </label>
        </div>
      </div>
      
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">Email para notificaciones</label>
        <input
          type="email"
          defaultValue="admin@casadecambios.com"
          className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white/50"
        />
      </div>
      
      <div>
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Alertas del Sistema</h3>
        <div className="space-y-3">
          <div className="flex items-center justify-between p-3 bg-gray-50/70 rounded-xl">
            <span className="text-sm text-gray-700">Falla de conexión a BD</span>
            <select className="px-3 py-1 border border-gray-200 rounded-lg text-sm bg-white/50">
              <option value="immediate">Inmediato</option>
              <option value="5min">5 minutos</option>
              <option value="15min">15 minutos</option>
            </select>
          </div>
          <div className="flex items-center justify-between p-3 bg-gray-50/70 rounded-xl">
            <span className="text-sm text-gray-700">Rate limit alcanzado</span>
            <select className="px-3 py-1 border border-gray-200 rounded-lg text-sm bg-white/50">
              <option value="immediate">Inmediato</option>
              <option value="5min">5 minutos</option>
              <option value="disabled">Deshabilitado</option>
            </select>
          </div>
        </div>
      </div>
    </div>
  );

  const renderUserSettings = () => (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Administradores del Sistema</h3>
        <div className="space-y-3">
          <div className="flex items-center justify-between p-3 bg-gray-50/70 rounded-xl">
            <div className="flex items-center space-x-3">
              <div className="w-8 h-8 bg-gradient-to-r from-purple-500 to-purple-600 rounded-full flex items-center justify-center">
                <User className="w-4 h-4 text-white" />
              </div>
              <div>
                <p className="font-medium text-gray-900">Gabriel Zambrano</p>
                <p className="text-xs text-gray-500">Propietario</p>
              </div>
            </div>
            <span className="text-xs px-2 py-1 bg-green-100 text-green-700 rounded-full">Activo</span>
          </div>
        </div>
      </div>
      
      <div>
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Colaboradores</h3>
        <div className="space-y-3">
          <div className="flex items-center justify-between p-3 bg-gray-50/70 rounded-xl">
            <div className="flex items-center space-x-3">
              <div className="w-8 h-8 bg-gradient-to-r from-blue-500 to-blue-600 rounded-full flex items-center justify-center">
                <User className="w-4 h-4 text-white" />
              </div>
              <div>
                <p className="font-medium text-gray-900">Patty</p>
                <p className="text-xs text-gray-500">Colaborador - 5% fijo</p>
              </div>
            </div>
            <span className="text-xs px-2 py-1 bg-green-100 text-green-700 rounded-full">Activo</span>
          </div>
          <div className="flex items-center justify-between p-3 bg-gray-50/70 rounded-xl">
            <div className="flex items-center space-x-3">
              <div className="w-8 h-8 bg-gradient-to-r from-green-500 to-green-600 rounded-full flex items-center justify-center">
                <User className="w-4 h-4 text-white" />
              </div>
              <div>
                <p className="font-medium text-gray-900">Anael</p>
                <p className="text-xs text-gray-500">Colaborador - Variable</p>
              </div>
            </div>
            <span className="text-xs px-2 py-1 bg-green-100 text-green-700 rounded-full">Activo</span>
          </div>
        </div>
      </div>
      
      <div>
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Permisos de Acceso</h3>
        <div className="space-y-3">
          <label className="flex items-center space-x-2">
            <input type="checkbox" defaultChecked className="rounded focus:ring-blue-500" />
            <span className="text-sm text-gray-700">Permitir acceso desde múltiples dispositivos</span>
          </label>
          <label className="flex items-center space-x-2">
            <input type="checkbox" className="rounded focus:ring-blue-500" />
            <span className="text-sm text-gray-700">Requerir autenticación 2FA</span>
          </label>
          <label className="flex items-center space-x-2">
            <input type="checkbox" defaultChecked className="rounded focus:ring-blue-500" />
            <span className="text-sm text-gray-700">Registrar actividad de usuarios</span>
          </label>
        </div>
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
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold text-gray-900">Configuración del Sistema</h1>
        <button
          onClick={handleSave}
          disabled={isLoading}
          className="flex items-center space-x-2 px-6 py-3 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white rounded-lg transition-colors duration-200"
        >
          {isLoading ? (
            <RefreshCw className="w-4 h-4 animate-spin" />
          ) : (
            <Save className="w-4 h-4" />
          )}
          <span>{isLoading ? 'Guardando...' : 'Guardar Cambios'}</span>
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Sidebar */}
        <div className="bg-white/70 backdrop-blur-md rounded-2xl p-6 border border-gray-200/50 shadow-lg">
          <nav className="space-y-2">
            {sections.map((section) => {
              const Icon = section.icon;
              const isActive = activeSection === section.id;
              
              return (
                <button
                  key={section.id}
                  onClick={() => setActiveSection(section.id)}
                  className={`w-full flex items-center space-x-3 px-4 py-3 rounded-xl text-left transition-all duration-200 ${
                    isActive
                      ? 'bg-gradient-to-r from-blue-600 to-purple-600 text-white shadow-lg shadow-blue-500/25'
                      : 'text-gray-600 hover:bg-gray-100/70 hover:text-gray-900'
                  }`}
                >
                  <Icon className="w-5 h-5" />
                  <span className="font-medium">{section.label}</span>
                </button>
              );
            })}
          </nav>
        </div>

        {/* Content */}
        <div className="lg:col-span-3 bg-white/70 backdrop-blur-md rounded-2xl p-6 border border-gray-200/50 shadow-lg">
          <h2 className="text-xl font-bold text-gray-900 mb-6">
            {sections.find(s => s.id === activeSection)?.label || 'General'}
          </h2>
          {renderActiveSection()}
        </div>
      </div>
    </div>
  );
};

export default SettingsPanel;