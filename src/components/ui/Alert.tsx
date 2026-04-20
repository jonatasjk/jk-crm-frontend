import { AlertCircle, CheckCircle, Info, XCircle, X } from 'lucide-react';
import { cn } from '@/utils';

interface AlertProps {
  variant?: 'info' | 'success' | 'warning' | 'error';
  title?: string;
  children: React.ReactNode;
  onDismiss?: () => void;
  className?: string;
}

const config = {
  info: { icon: Info, bg: 'bg-blue-50', border: 'border-blue-200', text: 'text-blue-800', icon_color: 'text-blue-500' },
  success: { icon: CheckCircle, bg: 'bg-green-50', border: 'border-green-200', text: 'text-green-800', icon_color: 'text-green-500' },
  warning: { icon: AlertCircle, bg: 'bg-yellow-50', border: 'border-yellow-200', text: 'text-yellow-800', icon_color: 'text-yellow-500' },
  error: { icon: XCircle, bg: 'bg-red-50', border: 'border-red-200', text: 'text-red-800', icon_color: 'text-red-500' },
};

export function Alert({ variant = 'info', title, children, onDismiss, className }: AlertProps) {
  const { icon: Icon, bg, border, text, icon_color } = config[variant];
  return (
    <div className={cn('rounded-lg border p-4 flex gap-3', bg, border, className)}>
      <Icon size={18} className={cn('flex-shrink-0 mt-0.5', icon_color)} />
      <div className="flex-1 min-w-0">
        {title && <p className={cn('font-medium text-sm', text)}>{title}</p>}
        <div className={cn('text-sm', text)}>{children}</div>
      </div>
      {onDismiss && (
        <button onClick={onDismiss} className={cn('flex-shrink-0 hover:opacity-70', text)}>
          <X size={16} />
        </button>
      )}
    </div>
  );
}
