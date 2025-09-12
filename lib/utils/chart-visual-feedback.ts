// lib/utils/chart-visual-feedback.ts
import { FluentColors } from "@/lib/constants/colors";

export interface VisualFeedbackConfig {
    isInteractive: boolean;
    isSelected: boolean;
    isHovered: boolean;
    isClickable?: boolean;
    isLoading?: boolean;
}

export interface ChartElementStyles {
    containerClasses: string;
    indicatorClasses: string;
    textClasses: string;
    barStyles: {
        opacity: number;
        transform?: string;
        boxShadow?: string;
    };
    cursorStyle: string;
}

/**
 * Generate consistent visual feedback styles for chart elements
 */
export function getChartElementStyles(config: VisualFeedbackConfig): ChartElementStyles {
    const { isInteractive, isSelected, isHovered, isClickable, isLoading = false } = config;

    // Base classes
    let containerClasses = 'transition-all duration-200 ease-out';
    let indicatorClasses = 'transition-all duration-200 ease-out';
    let textClasses = 'transition-colors duration-200 ease-out';
    let cursorStyle = 'cursor-default';

    // Opacity and transform for bars/elements
    let opacity = 0.8;
    let transform = '';
    let boxShadow = '';

    // Interactive states
    if (isInteractive && isClickable) {
        cursorStyle = 'cursor-pointer';
        containerClasses += ' hover:bg-neutral-10';

        if (isHovered) {
            opacity = 0.9;
            transform = 'scale(1.02)';
            boxShadow = '0 2px 8px rgba(0, 0, 0, 0.1)';
            containerClasses += ' bg-neutral-10';
        }
    }

    // Selected state
    if (isSelected) {
        opacity = 1;
        containerClasses += ' bg-blue-50 ring-2 ring-blue-500 ring-opacity-50 rounded-lg p-2 -m-2';
        indicatorClasses += ' ring-2 ring-white ring-opacity-80 scale-110';
        textClasses += ' text-blue-700';
        boxShadow = '0 4px 12px rgba(59, 130, 246, 0.15)';
    } else if (isHovered) {
        textClasses += ' text-blue-600';
        indicatorClasses += ' scale-110 shadow-md';
    } else {
        textClasses += ' text-neutral-90';
    }

    // Loading state
    if (isLoading) {
        opacity = 0.6;
        containerClasses += ' animate-pulse';
        cursorStyle = 'cursor-wait';
    }

    // Disabled state
    if (!isClickable && !isSelected) {
        opacity = 0.5;
        textClasses += ' text-neutral-60';
        cursorStyle = 'cursor-not-allowed';
    }

    return {
        containerClasses,
        indicatorClasses,
        textClasses,
        barStyles: {
            opacity,
            transform,
            boxShadow
        },
        cursorStyle
    };
}

/**
 * Generate loading indicator component
 */
export function LoadingIndicator({
    size = 'sm',
    className = ''
}: {
    size?: 'xs' | 'sm' | 'md' | 'lg';
    className?: string;
}) {
    const sizeClasses = {
        xs: 'h-3 w-3',
        sm: 'h-4 w-4',
        md: 'h-6 w-6',
        lg: 'h-8 w-8'
    };

    return (
        `<div className= {"animate-spin rounded-full border-b-2 border-primary-500 ${sizeClasses[size]} ${className}"} />`
    );
}

/**
 * Generate click hint text for interactive elements
 */
export function getClickHintText(isInteractive: boolean, isClickable: boolean): string | null {
    if (!isInteractive || !isClickable) return null;
    return 'Click to filter';
}

/**
 * Generate hover hint classes for interactive elements
 */
export function getHoverHintClasses(isInteractive: boolean, isClickable: boolean): string {
    if (!isInteractive || !isClickable) return '';
    return 'text-xs text-blue-500 opacity-0 group-hover:opacity-100 transition-opacity duration-200';
}

/**
 * Generate selection highlight styles for chart bars/segments
 */
export function getSelectionHighlightStyles(isSelected: boolean, baseColor: string) {
    return {
        fill: baseColor,
        stroke: isSelected ? '#3b82f6' : 'transparent',
        strokeWidth: isSelected ? 3 : 0,
        fillOpacity: isSelected ? 1 : 0.8,
        filter: isSelected ? 'drop-shadow(0 4px 8px rgba(59, 130, 246, 0.2))' : 'none'
    };
}

/**
 * Generate consistent color indicator styles
 */
export function getColorIndicatorStyles(
    color: string,
    isSelected: boolean,
    isHovered: boolean
): React.CSSProperties {
    return {
        backgroundColor: color,
        transform: isHovered ? 'scale(1.1)' : isSelected ? 'scale(1.1)' : 'scale(1)',
        boxShadow: isHovered ? '0 2px 4px rgba(0, 0, 0, 0.2)' :
            isSelected ? '0 0 0 2px white, 0 0 0 4px rgba(59, 130, 246, 0.5)' : 'none',
        transition: 'all 0.2s ease-out'
    };
}

/**
 * Generate progress bar styles with visual feedback
 */
export function getProgressBarStyles(
    percentage: number,
    color: string,
    isSelected: boolean,
    isHovered: boolean
): React.CSSProperties {
    return {
        width: `${percentage}%`,
        backgroundColor: color,
        opacity: isSelected ? 1 : isHovered ? 0.9 : 0.8,
        boxShadow: isSelected ? '0 0 0 1px rgba(59, 130, 246, 0.5)' :
            isHovered ? '0 2px 4px rgba(0, 0, 0, 0.1)' : 'none',
        transition: 'all 0.3s ease-out'
    };
}

/**
 * Chart interaction states for consistent behavior
 */
export interface ChartInteractionState {
    hoveredElement: string | number | null;
    selectedElements: (string | number)[];
    isLoading: boolean;
}

/**
 * Generate tooltip positioning styles
 */
export function getTooltipStyles(x: number, y: number, offset = 10) {
    return {
        position: 'fixed' as const,
        left: x + offset,
        top: y - offset,
        transform: 'translateY(-100%)',
        zIndex: 50,
        pointerEvents: 'none' as const
    };
}

/**
 * Common animation classes for chart elements
 */
export const CHART_ANIMATIONS = {
    fadeIn: 'animate-in fade-in duration-200',
    fadeOut: 'animate-out fade-out duration-200',
    slideIn: 'animate-in slide-in-from-bottom-2 duration-300',
    slideOut: 'animate-out slide-out-to-bottom-2 duration-300',
    scaleIn: 'animate-in zoom-in-95 duration-200',
    scaleOut: 'animate-out zoom-out-95 duration-200'
} as const;

/**
 * Generate consistent loading overlay
 */
export function LoadingOverlay({
    isVisible,
    message = 'Loading...',
    className = ''
}: {
    isVisible: boolean;
    message?: string;
    className?: string;
}) {
    if (!isVisible) return null;

    return (
        `<div className= {"absolute inset-0 bg-white bg-opacity-80 flex items-center justify-center rounded-lg ${className}}>
    <div className="flex items-center gap-2 text-neutral-70" >
        <LoadingIndicator size="sm" />
        <span className="text-sm" > { message } </span>
    </div>
                </div>`);
}