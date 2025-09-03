import { cn } from "@/lib/utils";
import { ReactNode } from "react";

type CardVariant = "default" | "elevated" | "outlined" | "filled";
type CardPadding = "none" | "sm" | "md" | "lg" | "xl";

interface CardProps {
	children: ReactNode;
	className?: string;
	variant?: CardVariant;
	padding?: CardPadding;
	hoverable?: boolean;
	clickable?: boolean;
	onClick?: () => void;
}

interface CardHeaderProps {
	children: ReactNode;
	className?: string;
}

interface CardContentProps {
	children: ReactNode;
	className?: string;
}

interface CardFooterProps {
	children: ReactNode;
	className?: string;
}

const getCardClasses = (
	variant: CardVariant = "default",
	padding: CardPadding = "md",
	hoverable: boolean = false,
	clickable: boolean = false
): string => {
	const baseClasses = [
		"rounded-lg transition-all duration-200 ease-out",
		"relative overflow-hidden",
	];

	const variantClasses = {
		default: [
			"bg-neutral-0 border border-neutral-30",
			"shadow-fluent-1",
		],
		elevated: [
			"bg-neutral-0 border border-neutral-20",
			"shadow-fluent-2",
		],
		outlined: [
			"bg-neutral-0 border-2 border-neutral-40",
			"shadow-none",
		],
		filled: [
			"bg-neutral-10 border border-neutral-20",
			"shadow-fluent-1",
		],
	};

	const paddingClasses = {
		none: [],
		sm: ["p-3"],
		md: ["p-4"],
		lg: ["p-6"],
		xl: ["p-8"],
	};

	const interactionClasses: string[] = [];
	if (hoverable || clickable) {
		interactionClasses.push(
			"hover:shadow-fluent-2",
			"hover:border-neutral-40",
			"hover:-translate-y-0.5"
		);
	}

	if (clickable) {
		interactionClasses.push(
			"cursor-pointer",
			"active:scale-[0.99]",
			"active:shadow-fluent-1",
			"focus:outline-none",
			"focus:ring-2",
			"focus:ring-primary-300",
			"focus:ring-offset-2"
		);
	}

	return cn(
		baseClasses,
		variantClasses[variant],
		paddingClasses[padding],
		interactionClasses
	);
};

export function Card({
	children,
	className,
	variant = "default",
	padding = "md",
	hoverable = false,
	clickable = false,
	onClick,
}: CardProps) {
	const cardClasses = getCardClasses(variant, padding, hoverable, clickable);

	const Component = clickable ? "button" : "div";

	return (
		<Component
			className={cn(cardClasses, className)}
			onClick={onClick}
			type={clickable ? "button" : undefined}
		>
			{children}
		</Component>
	);
}

export function CardHeader({ children, className }: CardHeaderProps) {
	return (
		<div className={cn("pb-3 border-b border-neutral-20", className)}>
			{children}
		</div>
	);
}

export function CardContent({ children, className }: CardContentProps) {
	return (
		<div className={cn("py-3", className)}>
			{children}
		</div>
	);
}

export function CardFooter({ children, className }: CardFooterProps) {
	return (
		<div className={cn("pt-3 border-t border-neutral-20", className)}>
			{children}
		</div>
	);
}

export type { CardProps, CardVariant, CardPadding };
