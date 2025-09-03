import React, { useEffect, useState } from "react";
import { cn } from "@/lib/utils";
import { X, CheckCircle, AlertCircle, AlertTriangle, Info } from "lucide-react";
import { Button } from "./Button";

type ToastVariant = "success" | "error" | "warning" | "info";
type ToastPosition = "top-right" | "top-left" | "bottom-right" | "bottom-left" | "top-center" | "bottom-center";

interface ToastProps {
  id?: string;
  title?: string;
  description?: string;
  variant?: ToastVariant;
  duration?: number;
  onClose?: () => void;
  action?: {
    label: string;
    onClick: () => void;
  };
  className?: string;
}

interface ToastContainerProps {
  position?: ToastPosition;
  className?: string;
  children: React.ReactNode;
}

const getToastClasses = (variant: ToastVariant = "info"): string => {
  const baseClasses = [
    "relative flex items-start gap-3 p-4 rounded-lg border",
    "shadow-fluent-2 backdrop-blur-sm",
    "transform transition-all duration-300 ease-out",
    "animate-in slide-in-from-right-full",
  ];

  const variantClasses = {
    success: [
      "bg-green-50 border-green-200 text-green-900",
    ],
    error: [
      "bg-red-50 border-red-200 text-red-900",
    ],
    warning: [
      "bg-yellow-50 border-yellow-200 text-yellow-900",
    ],
    info: [
      "bg-blue-50 border-blue-200 text-blue-900",
    ],
  };

  return cn(baseClasses, variantClasses[variant]);
};

const getIconForVariant = (variant: ToastVariant, className: string) => {
  const icons = {
    success: <CheckCircle className={cn(className, "text-green-600")} />,
    error: <AlertCircle className={cn(className, "text-red-600")} />,
    warning: <AlertTriangle className={cn(className, "text-yellow-600")} />,
    info: <Info className={cn(className, "text-blue-600")} />,
  };

  return icons[variant];
};

export function Toast({
  id,
  title,
  description,
  variant = "info",
  duration = 5000,
  onClose,
  action,
  className,
}: ToastProps) {
  const [isVisible, setIsVisible] = useState(true);

  useEffect(() => {
    if (duration > 0) {
      const timer = setTimeout(() => {
        setIsVisible(false);
        setTimeout(() => onClose?.(), 300); // Wait for animation
      }, duration);

      return () => clearTimeout(timer);
    }
  }, [duration, onClose]);

  const handleClose = () => {
    setIsVisible(false);
    setTimeout(() => onClose?.(), 300);
  };

  const toastClasses = getToastClasses(variant);

  if (!isVisible) {
    return null;
  }

  return (
    <div className={cn(toastClasses, className)} role="alert">
      {/* Icon */}
      <div className="flex-shrink-0">
        {getIconForVariant(variant, "h-5 w-5")}
      </div>

      {/* Content */}
      <div className="flex-1 min-w-0">
        {title && (
          <div className="font-medium text-sm">
            {title}
          </div>
        )}
        {description && (
          <div className={cn(
            "text-sm opacity-90",
            title ? "mt-1" : ""
          )}>
            {description}
          </div>
        )}
        {action && (
          <div className="mt-3">
            <Button
              variant="outline"
              size="sm"
              onClick={action.onClick}
              className="text-xs"
            >
              {action.label}
            </Button>
          </div>
        )}
      </div>

      {/* Close Button */}
      <div className="flex-shrink-0">
        <Button
          variant="ghost"
          size="sm"
          onClick={handleClose}
          className="p-1 h-6 w-6 opacity-70 hover:opacity-100"
          aria-label="Close notification"
        >
          <X className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}

export function ToastContainer({
  position = "top-right",
  className,
  children,
}: ToastContainerProps) {
  const getPositionClasses = (pos: ToastPosition): string => {
    const positions = {
      "top-right": "top-4 right-4",
      "top-left": "top-4 left-4",
      "bottom-right": "bottom-4 right-4",
      "bottom-left": "bottom-4 left-4",
      "top-center": "top-4 left-1/2 -translate-x-1/2",
      "bottom-center": "bottom-4 left-1/2 -translate-x-1/2",
    };

    return positions[pos];
  };

  return (
    <div
      className={cn(
        "fixed z-50 flex flex-col gap-2 w-full max-w-sm",
        getPositionClasses(position),
        className
      )}
    >
      {children}
    </div>
  );
}

// Toast Hook for programmatic usage
export function useToast() {
  const [toasts, setToasts] = useState<ToastProps[]>([]);

  const addToast = (toast: Omit<ToastProps, 'id' | 'onClose'>) => {
    const id = Math.random().toString(36).substr(2, 9);
    const newToast: ToastProps = {
      ...toast,
      id,
      onClose: () => removeToast(id),
    };

    setToasts(prev => [...prev, newToast]);
    return id;
  };

  const removeToast = (id: string) => {
    setToasts(prev => prev.filter(toast => toast.id !== id));
  };

  const removeAllToasts = () => {
    setToasts([]);
  };

  return {
    toasts,
    addToast,
    removeToast,
    removeAllToasts,
    success: (props: Omit<ToastProps, 'variant'>) => addToast({ ...props, variant: 'success' }),
    error: (props: Omit<ToastProps, 'variant'>) => addToast({ ...props, variant: 'error' }),
    warning: (props: Omit<ToastProps, 'variant'>) => addToast({ ...props, variant: 'warning' }),
    info: (props: Omit<ToastProps, 'variant'>) => addToast({ ...props, variant: 'info' }),
  };
}

export type { ToastProps, ToastVariant, ToastPosition };