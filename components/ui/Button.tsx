import React from "react";
import { cn } from "@/lib/utils";
import { Loader2 } from "lucide-react";

type ButtonVariant =
	| "primary"
	| "secondary"
	| "outline"
	| "ghost"
	| "success"
	| "warning"
	| "error"
	| "info";

type ButtonSize = "sm" | "md" | "lg" | "xl";

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
	variant?: ButtonVariant;
	size?: ButtonSize;
	fullWidth?: boolean;
	loading?: boolean;
	leftIcon?: React.ReactNode;
	rightIcon?: React.ReactNode;
	children: React.ReactNode;
}

const getButtonClasses = (
	variant: ButtonVariant = "primary",
	size: ButtonSize = "md",
	fullWidth: boolean = false
): string => {
	const baseClasses = [
		"inline-flex items-center justify-center gap-2",
		"font-medium transition-all duration-200 ease-out",
		"focus:outline-none focus:ring-2 focus:ring-offset-2",
		"disabled:opacity-50 disabled:cursor-not-allowed",
		"active:scale-[0.98] active:transition-transform active:duration-75",
		"font-sans relative overflow-hidden",
		"before:absolute before:inset-0 before:bg-white before:opacity-0 before:transition-opacity before:duration-200",
		"hover:before:opacity-10",
	];

	const variantClasses = {
		primary: [
			"bg-primary-500 text-white border border-primary-500",
			"hover:bg-primary-600 hover:border-primary-600",
			"active:bg-primary-700 active:border-primary-700",
			"focus:ring-primary-300",
			"shadow-fluent-1 hover:shadow-fluent-2 active:shadow-fluent-1",
		],
		secondary: [
			"bg-neutral-0 text-neutral-90 border border-neutral-30",
			"hover:bg-neutral-10 hover:border-neutral-40",
			"active:bg-neutral-20 active:border-neutral-50",
			"focus:ring-primary-300",
			"shadow-fluent-1 hover:shadow-fluent-2 active:shadow-fluent-1",
		],
		outline: [
			"bg-transparent text-primary-500 border border-primary-500",
			"hover:bg-primary-50 hover:text-primary-600",
			"active:bg-primary-100 active:text-primary-700",
			"focus:ring-primary-300",
		],
		ghost: [
			"bg-transparent text-neutral-90 border border-transparent",
			"hover:bg-neutral-10",
			"active:bg-neutral-20",
			"focus:ring-neutral-300",
		],
		success: [
			"bg-success text-white border border-success",
			"hover:bg-green-600 hover:border-green-600",
			"active:bg-green-700 active:border-green-700",
			"focus:ring-green-300",
			"shadow-fluent-1 hover:shadow-fluent-2 active:shadow-fluent-1",
		],
		warning: [
			"bg-warning text-neutral-90 border border-warning",
			"hover:bg-yellow-500 hover:border-yellow-500",
			"active:bg-yellow-600 active:border-yellow-600",
			"focus:ring-yellow-300",
			"shadow-fluent-1 hover:shadow-fluent-2 active:shadow-fluent-1",
		],
		error: [
			"bg-error text-white border border-error",
			"hover:bg-red-600 hover:border-red-600",
			"active:bg-red-700 active:border-red-700",
			"focus:ring-red-300",
			"shadow-fluent-1 hover:shadow-fluent-2 active:shadow-fluent-1",
		],
		info: [
			"bg-info text-white border border-info",
			"hover:bg-cyan-500 hover:border-cyan-500",
			"active:bg-cyan-600 active:border-cyan-600",
			"focus:ring-cyan-300",
			"shadow-fluent-1 hover:shadow-fluent-2 active:shadow-fluent-1",
		],
	};

	const sizeClasses = {
		sm: ["h-8 px-3 text-xs", "rounded"],
		md: ["h-10 px-4 text-sm", "rounded"],
		lg: ["h-12 px-6 text-base", "rounded-md"],
		xl: ["h-14 px-8 text-lg", "rounded-md"],
	};

	const widthClasses = fullWidth ? ["w-full"] : ["w-auto"];

	return cn(
		baseClasses,
		variantClasses[variant],
		sizeClasses[size],
		widthClasses
	);
};

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
	(
		{
			className,
			variant = "primary",
			size = "md",
			fullWidth = false,
			loading = false,
			leftIcon,
			rightIcon,
			children,
			disabled,
			...props
		},
		ref
	) => {
		const isDisabled = disabled || loading;
		const buttonClasses = getButtonClasses(variant, size, fullWidth);

		return (
			<button
				className={cn(buttonClasses, className)}
				ref={ref}
				disabled={isDisabled}
				{...props}
			>
				{loading && <Loader2 className="h-4 w-4 animate-spin" />}
				{!loading && leftIcon && (
					<span className="flex items-center">{leftIcon}</span>
				)}
				<span className="flex items-center relative z-10">{children}</span>
				{!loading && rightIcon && (
					<span className="flex items-center">{rightIcon}</span>
				)}
			</button>
		);
	}
);

Button.displayName = "Button";

export { Button };
export type { ButtonProps, ButtonVariant, ButtonSize };
