// ...existing imports...
import { AlertCircle, Check, Info, X } from 'lucide-react';

import * as React from 'react';

type Toast = {
  id: string;
  title: string;
  description?: string;
  variant?: 'default' | 'destructive' | 'success' | 'warning' | 'info';
};

interface ToastContextType {
  toast: (props: Omit<Toast, 'id'>) => void;
}

const ToastContext = React.createContext<ToastContextType | undefined>(undefined);

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = React.useState<Toast[]>([]);
  const [isClient, setIsClient] = React.useState(false);

  React.useEffect(() => {
    setIsClient(true);
  }, []);

  const toast = React.useCallback(
    (props: Omit<Toast, 'id'>) => {
      if (!isClient) return;
      const id = Math.random().toString(36).substring(2, 9);
      setToasts(currentToasts => [...currentToasts, { id, ...props }]);

      // Auto-dismiss after 5 seconds
      setTimeout(() => {
        setToasts(currentToasts => currentToasts.filter(toast => toast.id !== id));
      }, 5000);
    },
    [isClient]
  );

  const dismissToast = React.useCallback((id: string) => {
    setToasts(currentToasts => currentToasts.filter(toast => toast.id !== id));
  }, []);

  return (
    <ToastContext.Provider value={{ toast }}>
      {children}
      <div className="fixed bottom-4 right-4 z-50 space-y-2">
        {toasts.map(toast => (
          <ToastComponent key={toast.id} onDismiss={() => dismissToast(toast.id)} {...toast} />
        ))}
      </div>
    </ToastContext.Provider>
  );
}

export function useToast() {
  const context = React.useContext(ToastContext);
  if (!context) {
    throw new Error('useToast must be used within a ToastProvider');
  }
  return context;
}

function ToastComponent({
  title,
  description,
  variant = 'default',
  onDismiss,
}: Toast & { onDismiss: () => void }): JSX.Element {
  const variantStyles = {
    default: 'bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700',
    destructive: 'bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800',
    success: 'bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800',
    warning: 'bg-yellow-50 dark:bg-yellow-900/20 border-yellow-200 dark:border-yellow-800',
    info: 'bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800',
  };

  const iconMap = {
    default: null,
    destructive: <X className="h-4 w-4 text-red-500 dark:text-red-400" />,
    success: <Check className="h-4 w-4 text-green-500 dark:text-green-400" />,
    warning: <AlertCircle className="h-4 w-4 text-yellow-500 dark:text-yellow-400" />,
    info: <Info className="h-4 w-4 text-blue-500 dark:text-blue-400" />,
  };

  const icon = iconMap[variant] || null;

  return (
    <div
      className={`flex w-80 items-start gap-3 rounded-lg border p-4 shadow-lg ${variantStyles[variant]}`}
      role="alert"
    >
      {icon && <div className="mt-0.5 flex-shrink-0">{icon}</div>}
      <div className="flex-1">
        <h3 className="text-sm font-medium">{title}</h3>
        {description && (
          <p className="mt-1 text-sm text-gray-600 dark:text-gray-300">{description}</p>
        )}
      </div>
      <button
        onClick={onDismiss}
        className="text-gray-400 hover:text-gray-500 dark:text-gray-500 dark:hover:text-gray-400"
        aria-label="Dismiss"
      >
        <X className="h-4 w-4" />
      </button>
    </div>
  );
}
