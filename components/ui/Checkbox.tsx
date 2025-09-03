import React from "react";
import { cn } from "@/lib/utils";
import { Check, Minus } from "lucide-react";

type CheckboxSize = "sm" | "md" | "lg";

interface CheckboxProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'size' | 'onChange'> {
  label?: string;
  description?: string;
  error?: string;
  size?: CheckboxSize;
  indeterminate?: boolean;
  onChange?: (checked: boolean) => void;
}

const getCheckboxClasses = (
  size: CheckboxSize = "md",
  hasError: boolean = false
): string => {
  const baseClasses = [
    "relative inline-flex items-center justify-center",
    "border-2 rounded transition-all duration-200 ease-out",
    "focus:outline-none focus:ring-2 focus:ring-offset-2",
    "disabled:opacity-50 disabled:cursor-not-allowed",
    "cursor-pointer",
  ];

  const sizeClasses = {
    sm: ["h-4 w-4"],
    md: ["h-5 w-5"],
    lg: ["h-6 w-6"],
  };

  const stateClasses = [
    "border-neutral-40 bg-neutral-0",
    "hover:border-primary-500",
    "checked:bg-primary-500 checked:border-primary-500",
    "focus:ring-primary-300",
    hasError ? "border-error focus:ring-red-300" : "",
  ];

  return cn(baseClasses, sizeClasses[size], stateClasses);
};

const Checkbox = React.forwardRef<HTMLInputElement, CheckboxProps>(
  (
    {
      className,
      label,
      description,
      error,
      size = "md",
      indeterminate = false,
      onChange,
      checked,
      disabled,
      id,
      ...props
    },
    ref
  ) => {
    const checkboxId = id;
    const hasError = !!error;

    const checkboxClasses = getCheckboxClasses(size, hasError);

    const iconSizeClasses = {
      sm: "h-3 w-3",
      md: "h-3.5 w-3.5",
      lg: "h-4 w-4",
    };

    const handleChange = (event: React.ChangeEvent<HTMLInputElement>) => {
      onChange?.(event.target.checked);
    };

    return (
      <div className="flex items-start gap-3">
        <div className="relative flex items-center">
          <input
            id={checkboxId}
            type="checkbox"
            className={cn(checkboxClasses, className)}
            ref={ref}
            checked={checked}
            disabled={disabled}
            onChange={handleChange}
            {...props}
          />
          
          {/* Check/Indeterminate Icon */}
          {(checked || indeterminate) && (
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
              {indeterminate ? (
                <Minus className={cn(iconSizeClasses[size], "text-white")} />
              ) : (
                <Check className={cn(iconSizeClasses[size], "text-white")} />
              )}
            </div>
          )}
        </div>

        {(label || description) && (
          <div className="flex-1 min-w-0">
            {label && (
              <label
                htmlFor={checkboxId}
                className={cn(
                  "block font-medium text-neutral-90 cursor-pointer",
                  size === "sm" ? "text-sm" : size === "lg" ? "text-base" : "text-sm",
                  disabled && "opacity-50 cursor-not-allowed"
                )}
              >
                {label}
              </label>
            )}
            {description && (
              <p className={cn(
                "text-neutral-60 mt-1",
                size === "sm" ? "text-xs" : "text-sm"
              )}>
                {description}
              </p>
            )}
          </div>
        )}

        {error && (
          <p className={cn(
            "text-error mt-1",
            size === "sm" ? "text-xs" : "text-sm"
          )}>
            {error}
          </p>
        )}
      </div>
    );
  }
);

Checkbox.displayName = "Checkbox";

export { Checkbox };
export type { CheckboxProps, CheckboxSize };