import React from "react";
import { cn } from "@/lib/utils";
import { ChevronDown } from "lucide-react";

type SelectSize = "sm" | "md" | "lg";
type SelectVariant = "default" | "filled" | "underlined";

interface SelectProps extends Omit<React.SelectHTMLAttributes<HTMLSelectElement>, 'size'> {
  label?: string;
  error?: string;
  helperText?: string;
  placeholder?: string;
  fullWidth?: boolean;
  size?: SelectSize;
  variant?: SelectVariant;
  required?: boolean;
  children: React.ReactNode;
}

const getSelectClasses = (
  size: SelectSize = "md",
  variant: SelectVariant = "default",
  hasError: boolean = false
): string => {
  const baseClasses = [
    "w-full border transition-all duration-200 ease-out appearance-none",
    "focus:outline-none cursor-pointer",
    "disabled:cursor-not-allowed disabled:opacity-50 disabled:bg-neutral-10",
    "font-sans bg-neutral-0",
  ];

  const sizeClasses = {
    sm: ["h-8 text-xs px-2 pr-8"],
    md: ["h-10 text-sm px-3 pr-10"],
    lg: ["h-12 text-base px-4 pr-12"],
  };

  const variantClasses = {
    default: [
      "rounded border-neutral-30",
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

const Select = React.forwardRef<HTMLSelectElement, SelectProps>(
  (
    {
      className,
      label,
      error,
      helperText,
      placeholder,
      fullWidth = false,
      size = "md",
      variant = "default",
      required = false,
      disabled,
      children,
      ...props
    },
    ref
  ) => {
    const selectId = React.useId();
    const hasError = !!error;

    const selectClasses = getSelectClasses(size, variant, hasError);

    const iconSizeClasses = {
      sm: "h-3 w-3",
      md: "h-4 w-4",
      lg: "h-5 w-5",
    };

    const iconPositionClasses = {
      sm: "right-2",
      md: "right-3",
      lg: "right-4",
    };

    return (
      <div className={cn("space-y-1", fullWidth ? "w-full" : "w-auto")}>
        {label && (
          <label
            htmlFor={selectId}
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
          <select
            id={selectId}
            className={cn(selectClasses, className)}
            ref={ref}
            disabled={disabled}
            {...props}
          >
            {placeholder && (
              <option value="" disabled>
                {placeholder}
              </option>
            )}
            {children}
          </select>
          <div className={cn(
            "absolute top-1/2 -translate-y-1/2 text-neutral-60 pointer-events-none",
            iconPositionClasses[size]
          )}>
            <ChevronDown className={iconSizeClasses[size]} />
          </div>
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

Select.displayName = "Select";

export { Select };
export type { SelectProps, SelectSize, SelectVariant };