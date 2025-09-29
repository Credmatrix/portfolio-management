'use client'

import React, { forwardRef } from 'react'
import { cva, type VariantProps } from 'class-variance-authority'
import { cn } from '@/lib/utils'

const textareaVariants = cva(
    'flex min-h-[80px] w-full rounded-md border border-neutral-200 bg-white px-3 py-2 text-sm ring-offset-white placeholder:text-neutral-500 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 resize-none',
    {
        variants: {
            variant: {
                default: 'border-neutral-200 focus-visible:ring-blue-500',
                error: 'border-red-500 focus-visible:ring-red-500',
                success: 'border-green-500 focus-visible:ring-green-500'
            },
            size: {
                sm: 'min-h-[60px] px-2 py-1 text-xs',
                default: 'min-h-[80px] px-3 py-2 text-sm',
                lg: 'min-h-[120px] px-4 py-3 text-base'
            }
        },
        defaultVariants: {
            variant: 'default',
            size: 'default'
        }
    }
)

export interface TextareaProps
    extends Omit<React.TextareaHTMLAttributes<HTMLTextAreaElement>, 'size'>,
    VariantProps<typeof textareaVariants> {
    label?: string
    error?: string
    helperText?: string
    required?: boolean
}

const Textarea = forwardRef<HTMLTextAreaElement, TextareaProps>(
    ({ className, variant, size, label, error, helperText, required, ...props }, ref) => {
        const textareaId = React.useId()
        const hasError = !!error

        return (
            <div className="space-y-1">
                {label && (
                    <label
                        htmlFor={textareaId}
                        className={cn(
                            "block font-medium text-neutral-90",
                            size === "sm" ? "text-xs" : size === "lg" ? "text-base" : "text-sm"
                        )}
                    >
                        {label}
                        {required && <span className="text-error ml-1">*</span>}
                    </label>
                )}
                <textarea
                    id={textareaId}
                    className={cn(textareaVariants({
                        variant: hasError ? 'error' : variant,
                        size,
                        className
                    }))}
                    ref={ref}
                    {...props}
                />
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
        )
    }
)
Textarea.displayName = 'Textarea'

export { Textarea }
