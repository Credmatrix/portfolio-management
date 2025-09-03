import { cn } from "@/lib/utils";
import { ReactNode } from "react";

type BadgeVariant = "default" | "outline" | "filled" | "success" | "warning" | "error" | "info" | "primary" | "secondary" | "destructive";
type BadgeSize = "sm" | "md" | "lg";

interface BadgeProps {
    children: ReactNode;
    className?: string;
    variant?: BadgeVariant;
    size?: BadgeSize;
}

const getBadgeClasses = (
    variant: BadgeVariant = "default",
    size: BadgeSize = "md"
): string => {
    const baseClasses = [
        "inline-flex items-center justify-center font-medium rounded-full",
        "transition-colors duration-200 ease-out",
        "whitespace-nowrap"
    ];

    const variantClasses = {
        default: [
            "bg-neutral-100 text-neutral-700 border border-neutral-200"
        ],
        outline: [
            "bg-transparent border border-neutral-300 text-neutral-700",
            "hover:bg-neutral-50"
        ],
        filled: [
            "bg-primary-500 text-white border border-primary-500",
            "hover:bg-primary-600"
        ],
        success: [
            "bg-success-100 text-success-700 border border-success-200"
        ],
        warning: [
            "bg-warning-100 text-warning-700 border border-warning-200"
        ],
        error: [
            "bg-error-100 text-error-700 border border-error-200"
        ],
        info: [
            "bg-info-100 text-info-700 border border-info-200"
        ],
        primary: [
            "bg-blue-100 text-blue-700 border border-blue-200"
        ],
        secondary: [
            "bg-gray-100 text-gray-700 border border-gray-200"
        ],
        destructive: [
            "bg-red-100 text-red-700 border border-red-200"
        ]
    };

    const sizeClasses = {
        sm: ["text-xs px-2 py-0.5 h-5"],
        md: ["text-sm px-2.5 py-1 h-6"],
        lg: ["text-sm px-3 py-1.5 h-7"]
    };

    return cn(
        baseClasses,
        variantClasses[variant],
        sizeClasses[size]
    );
};

export function Badge({
    children,
    className,
    variant = "default",
    size = "md"
}: BadgeProps) {
    const badgeClasses = getBadgeClasses(variant, size);

    return (
        <span className={cn(badgeClasses, className)}>
            {children}
        </span>
    );
}

export type { BadgeProps, BadgeVariant, BadgeSize };