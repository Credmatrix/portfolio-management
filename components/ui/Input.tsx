import React from "react";
import { cn } from "@/lib/utils";

type InputSize = "sm" | "md" | "lg";
type InputVariant = "default" | "filled" | "underlined";

interface InputProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'size'> {
  label?: string;
  error?: string;
  helperText?: string;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
  fullWidth?: boolean;
  size?: InputSize;
  variant?: InputVariant;
  required?: boolean;
}

const getInputClasses = (
  size: InputSize = "md",
  variant: InputVariant = "default",
  hasError: boolean = false,
  hasLeftIcon: boolean = false,
  hasRightIcon: boolean = false
): string => {
  const baseClasses = [
    "w-full border transition-all duration-200 ease-out",
    "placeholder:text-neutral-50 focus:outline-none",
    "disabled:cursor-not-allowed disabled:opacity-50 disabled:bg-neutral-10",
    "font-sans",
  ];

  const sizeClasses = {
    sm: ["h-8 text-xs", hasLeftIcon ? "pl-8" : "px-2", hasRightIcon ? "pr-8" : ""],
    md: ["h-10 text-sm", hasLeftIcon ? "pl-10" : "px-3", hasRightIcon ? "pr-10" : ""],
    lg: ["h-12 text-base", hasLeftIcon ? "pl-12" : "px-4", hasRightIcon ? "pr-12" : ""],
  };

  const variantClasses = {
    default: [
      "bg-neutral-0 rounded border-neutral-30",
      "hover:border-neutral-40",
      "focus:border-primary-500 focus:ring-2 focus:ring-primary-200",
      hasError ? "border-error focus:border-error focus:ring-red-200" : "",
    ],
    filled: [
      "bg-neutral-10 rounded border-transparent",
      "hover:bg-neutral-20",
      "focus:bg-neutral-0 focus:border-primary-500 focus:ring-2 focus:ring-primary-200",
      hasError ? "bg-red-50 focus:border-error focus:ring-red-200" : "",
    ],
    underlined: [
      "bg-transparent rounded-none border-0 border-b-2 border-neutral-30",
      "hover:border-neutral-40",
      "focus:border-primary-500",
      hasError ? "border-error focus:border-error" : "",
    ],
  };

  return cn(
    baseClasses,
    sizeClasses[size],
    variantClasses[variant]
  );
};

const Input = React.forwardRef<HTMLInputElement, InputProps>(
  (
    {
      className,
      type = "text",
      label,
      error,
      helperText,
      leftIcon,
      rightIcon,
      fullWidth = false,
      size = "md",
      variant = "default",
      required = false,
      disabled,
      ...props
    },
    ref
  ) => {
    const inputId = React.useId();
    const hasError = !!error;
    const hasLeftIcon = !!leftIcon;
    const hasRightIcon = !!rightIcon;

    const inputClasses = getInputClasses(size, variant, hasError, hasLeftIcon, hasRightIcon);

    const iconSizeClasses = {
      sm: "h-3 w-3",
      md: "h-4 w-4",
      lg: "h-5 w-5",
    };

    const iconPositionClasses = {
      sm: { left: "left-2", right: "right-2" },
      md: { left: "left-3", right: "right-3" },
      lg: { left: "left-4", right: "right-4" },
    };

    return (
      <div className={cn("space-y-1", fullWidth ? "w-full" : "w-auto")}>
        {label && (
          <label
            htmlFor={inputId}
            className={cn(
              "block font-medium text-neutral-90",
              size === "sm" ? "text-xs" : size === "lg" ? "text-base" : "text-sm"
            )}
          >
            {label}
            {required && <span className="text-error ml-1">*</span>}
          </label>
        )}
        <div className="relative">
          {leftIcon && (
            <div className={cn(
              "absolute top-1/2 -translate-y-1/2 text-neutral-60 pointer-events-none",
              iconPositionClasses[size].left
            )}>
              <div className={iconSizeClasses[size]}>
                {leftIcon}
              </div>
            </div>
          )}
          <input
            id={inputId}
            type={type}
            className={cn(inputClasses, className)}
            ref={ref}
            disabled={disabled}
            {...props}
          />
          {rightIcon && (
            <div className={cn(
              "absolute top-1/2 -translate-y-1/2 text-neutral-60 pointer-events-none",
              iconPositionClasses[size].right
            )}>
              <div className={iconSizeClasses[size]}>
                {rightIcon}
              </div>
            </div>
          )}
        </div>
        {error && (
          <p className={cn(
            "text-error flex items-center gap-1",
            size === "sm" ? "text-xs" : "text-sm"
          )}>
            {error}
          </p>
        )}
        {helperText && !error && (
          <p className={cn(
            "text-neutral-60",
            size === "sm" ? "text-xs" : "text-sm"
          )}>
            {helperText}
          </p>
        )}
      </div>
    );
  }
);

Input.displayName = "Input";

export { Input };
export type { InputProps, InputSize, InputVariant };