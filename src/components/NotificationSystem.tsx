import React, { useState, useCallback, useEffect } from 'react';
import {
  CheckCircle,
  XCircle,
  AlertTriangle,
  Info,
  X
} from 'lucide-react';

export interface Notification {
  id: string;
  type: 'success' | 'error' | 'warning' | 'info';
  title: string;
  message: string;
  duration?: number;
  action?: {
    label: string;
    onClick: () => void;
  };
}

interface NotificationSystemProps {
  notifications: Notification[];
  onRemove: (id: string) => void;
}

const NotificationItem: React.FC<{
  notification: Notification;
  onRemove: (id: string) => void;
}> = ({ notification, onRemove }) => {
  const [isVisible, setIsVisible] = useState(false);
  const [isLeaving, setIsLeaving] = useState(false);

  useEffect(() => {
    // Animación de entrada
    const timer = setTimeout(() => setIsVisible(true), 50);
    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    // Auto-dismiss
    if (notification.duration && notification.duration > 0) {
      const timer = setTimeout(() => {
        handleRemove();
      }, notification.duration);
      return () => clearTimeout(timer);
    }
  }, [notification.duration]);

  const handleRemove = () => {
    setIsLeaving(true);
    setTimeout(() => {
      onRemove(notification.id);
    }, 300);
  };

  const getIcon = () => {
    switch (notification.type) {
      case 'success':
        return <CheckCircle className="w-5 h-5 text-green-600" />;
      case 'error':
        return <XCircle className="w-5 h-5 text-red-600" />;
      case 'warning':
        return <AlertTriangle className="w-5 h-5 text-yellow-600" />;
      case 'info':
        return <Info className="w-5 h-5 text-blue-600" />;
    }
  };

  const getBackgroundColor = () => {
    switch (notification.type) {
      case 'success':
        return 'bg-white border-green-200';
      case 'error':
        return 'bg-white border-red-200';
      case 'warning':
        return 'bg-white border-yellow-200';
      case 'info':
        return 'bg-white border-blue-200';
    }
  };

  const getTextColor = () => {
    switch (notification.type) {
      case 'success':
        return 'text-green-800';
      case 'error':
        return 'text-red-800';
      case 'warning':
        return 'text-yellow-800';
      case 'info':
        return 'text-blue-800';
    }
  };

  return (
    <div
      className={`transform transition-all duration-300 ease-out ${
        isVisible && !isLeaving
          ? 'translate-x-0 opacity-100'
          : isLeaving
          ? 'translate-x-full opacity-0'
          : 'translate-x-full opacity-0'
      }`}
    >
      <div className={`min-w-96 max-w-lg w-full ${getBackgroundColor()} border-l-4 ${
        notification.type === 'success' ? 'border-l-green-500' :
        notification.type === 'error' ? 'border-l-red-500' :
        notification.type === 'warning' ? 'border-l-yellow-500' :
        'border-l-blue-500'
      } rounded-r-xl shadow-xl backdrop-blur-sm pointer-events-auto`}>
        <div className="p-6">
          <div className="flex items-start">
            <div className="flex-shrink-0">
              <div className={`p-1 rounded-full ${
                notification.type === 'success' ? 'bg-green-100' :
                notification.type === 'error' ? 'bg-red-100' :
                notification.type === 'warning' ? 'bg-yellow-100' :
                'bg-blue-100'
              }`}>
                {getIcon()}
              </div>
            </div>
            <div className="ml-5 flex-1">
              <p className={`text-base font-semibold ${getTextColor()} leading-tight`}>
                {notification.title}
              </p>
              <p className={`mt-2 text-sm ${getTextColor()} opacity-95 leading-relaxed`}>
                {notification.message}
              </p>
              {notification.action && (
                <div className="mt-3">
                  <button
                    onClick={notification.action.onClick}
                    className={`text-sm font-medium ${
                      notification.type === 'success'
                        ? 'text-green-700 hover:text-green-800'
                        : notification.type === 'error'
                        ? 'text-red-700 hover:text-red-800'
                        : notification.type === 'warning'
                        ? 'text-yellow-700 hover:text-yellow-800'
                        : 'text-blue-700 hover:text-blue-800'
                    } transition-colors`}
                  >
                    {notification.action.label}
                  </button>
                </div>
              )}
            </div>
            <div className="ml-6 flex-shrink-0 flex">
              <button
                onClick={handleRemove}
                className={`inline-flex items-center justify-center w-8 h-8 rounded-full ${
                  notification.type === 'success' ? 'hover:bg-green-200 text-green-600' :
                  notification.type === 'error' ? 'hover:bg-red-200 text-red-600' :
                  notification.type === 'warning' ? 'hover:bg-yellow-200 text-yellow-600' :
                  'hover:bg-blue-200 text-blue-600'
                } transition-all duration-200 hover:scale-110`}
                title="Cerrar notificación"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

const NotificationSystem: React.FC<NotificationSystemProps> = ({ notifications, onRemove }) => {
  return (
    <div className="fixed top-6 right-6 z-50 space-y-4 pointer-events-none max-w-xl">
      {notifications.map((notification) => (
        <NotificationItem
          key={notification.id}
          notification={notification}
          onRemove={onRemove}
        />
      ))}
    </div>
  );
};

// Hook para manejar notificaciones
export const useNotifications = () => {
  const [notifications, setNotifications] = useState<Notification[]>([]);

  const addNotification = useCallback((notification: Omit<Notification, 'id'>) => {
    const id = Math.random().toString(36).substr(2, 9);
    const newNotification: Notification = {
      ...notification,
      id,
      duration: notification.duration ?? 5000 // 5 segundos por defecto
    };
    
    setNotifications(prev => [...prev, newNotification]);
  }, []);

  const removeNotification = useCallback((id: string) => {
    setNotifications(prev => prev.filter(notification => notification.id !== id));
  }, []);

  const clearAllNotifications = useCallback(() => {
    setNotifications([]);
  }, []);

  return {
    notifications,
    addNotification,
    removeNotification,
    clearAllNotifications
  };
};

export default NotificationSystem;