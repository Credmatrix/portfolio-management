'use client'

import { cn } from '@/lib/utils'

interface ProgressProps {
    value?: number
    max?: number
    className?: string
    indicatorClassName?: string
    variant?: 'default' | 'error' | 'success'
}

export function Progress({
    value = 0,
    max = 100,
    className,
    indicatorClassName,
    variant = 'default'
}: ProgressProps) {
    const percentage = Math.min(Math.max((value / max) * 100, 0), 100)

    const variantClasses = {
        default: 'bg-blue-500',
        error: 'bg-red-500',
        success: 'bg-green-500'
    }

    return (
        <div className={cn(
            'relative h-4 w-full overflow-hidden rounded-full bg-neutral-20',
            className
        )}>
            <div
                className={cn(
                    'h-full w-full flex-1 transition-all duration-300 ease-out',
                    variantClasses[variant],
                    indicatorClassName
                )}
                style={{ transform: `translateX(-${100 - percentage}%)` }}
            />
        </div>
    )
}