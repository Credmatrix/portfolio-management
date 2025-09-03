import React, { useEffect } from "react";
import { cn } from "@/lib/utils";
import { X } from "lucide-react";
import { Button } from "./Button";

type ModalSize = "sm" | "md" | "lg" | "xl" | "full";

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  children: React.ReactNode;
  size?: ModalSize;
  showCloseButton?: boolean;
  closeOnOverlayClick?: boolean;
  closeOnEscape?: boolean;
  className?: string;
}

interface ModalHeaderProps {
  children: React.ReactNode;
  className?: string;
}

interface ModalBodyProps {
  children: React.ReactNode;
  className?: string;
}

interface ModalFooterProps {
  children: React.ReactNode;
  className?: string;
}

const getModalClasses = (size: ModalSize = "md"): string => {
  const baseClasses = [
    "bg-neutral-0 rounded-lg shadow-fluent-4",
    "border border-neutral-30",
    "max-h-[90vh] overflow-hidden",
    "flex flex-col",
    "transform transition-all duration-300 ease-out",
  ];

  const sizeClasses = {
    sm: ["w-full max-w-md"],
    md: ["w-full max-w-lg"],
    lg: ["w-full max-w-2xl"],
    xl: ["w-full max-w-4xl"],
    full: ["w-full h-full max-w-none max-h-none rounded-none"],
  };

  return cn(baseClasses, sizeClasses[size]);
};

export function Modal({
  isOpen,
  onClose,
  title,
  children,
  size = "md",
  showCloseButton = true,
  closeOnOverlayClick = true,
  closeOnEscape = true,
  className,
}: ModalProps) {
  // Handle escape key
  useEffect(() => {
    if (!closeOnEscape || !isOpen) return;

    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        onClose();
      }
    };

    document.addEventListener("keydown", handleEscape);
    return () => document.removeEventListener("keydown", handleEscape);
  }, [isOpen, closeOnEscape, onClose]);

  // Prevent body scroll when modal is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "unset";
    }

    return () => {
      document.body.style.overflow = "unset";
    };
  }, [isOpen]);

  if (!isOpen) return null;

  const modalClasses = getModalClasses(size);

  const handleOverlayClick = (event: React.MouseEvent<HTMLDivElement>) => {
    if (closeOnOverlayClick && event.target === event.currentTarget) {
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-neutral-90 bg-opacity-50 backdrop-blur-sm transition-opacity duration-300"
        onClick={handleOverlayClick}
      />
      
      {/* Modal */}
      <div className={cn(modalClasses, className)}>
        {/* Header */}
        {(title || showCloseButton) && (
          <div className="flex items-center justify-between p-6 border-b border-neutral-20">
            {title && (
              <h2 className="text-lg font-semibold text-neutral-90">
                {title}
              </h2>
            )}
            {showCloseButton && (
              <Button
                variant="ghost"
                size="sm"
                onClick={onClose}
                className="p-2 h-8 w-8"
                aria-label="Close modal"
              >
                <X className="h-4 w-4" />
              </Button>
            )}
          </div>
        )}
        
        {/* Content */}
        <div className="flex-1 overflow-y-auto">
          {children}
        </div>
      </div>
    </div>
  );
}

export function ModalHeader({ children, className }: ModalHeaderProps) {
  return (
    <div className={cn("px-6 py-4 border-b border-neutral-20", className)}>
      {children}
    </div>
  );
}

export function ModalBody({ children, className }: ModalBodyProps) {
  return (
    <div className={cn("px-6 py-4 flex-1 overflow-y-auto", className)}>
      {children}
    </div>
  );
}

export function ModalFooter({ children, className }: ModalFooterProps) {
  return (
    <div className={cn(
      "px-6 py-4 border-t border-neutral-20 flex items-center justify-end gap-3",
      className
    )}>
      {children}
    </div>
  );
}

export type { ModalProps, ModalSize };