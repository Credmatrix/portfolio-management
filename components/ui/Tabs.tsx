'use client'

import { createContext, useContext, useState, ReactNode } from 'react'
import { cn } from '@/lib/utils'

interface TabsContextType {
    value: string
    onValueChange: (value: string) => void
}

const TabsContext = createContext<TabsContextType | undefined>(undefined)

interface TabsProps {
    defaultValue?: string
    value?: string
    onValueChange?: (value: string) => void
    children: ReactNode
    className?: string
}

interface TabsListProps {
    children: ReactNode
    className?: string
}

interface TabsTriggerProps {
    value: string
    children: ReactNode
    className?: string
    disabled?: boolean
}

interface TabsContentProps {
    value: string
    children: ReactNode
    className?: string
}

export function Tabs({
    defaultValue,
    value: controlledValue,
    onValueChange,
    children,
    className
}: TabsProps) {
    const [internalValue, setInternalValue] = useState(defaultValue || '')

    const value = controlledValue !== undefined ? controlledValue : internalValue
    const handleValueChange = (newValue: string) => {
        if (controlledValue === undefined) {
            setInternalValue(newValue)
        }
        onValueChange?.(newValue)
    }

    return (
        <TabsContext.Provider value={{ value, onValueChange: handleValueChange }}>
            <div className={cn('w-full', className)}>
                {children}
            </div>
        </TabsContext.Provider>
    )
}

export function TabsList({ children, className }: TabsListProps) {
    return (
        <div className={cn(
            'inline-flex h-10 items-center justify-center rounded-md bg-neutral-10 p-1 text-neutral-60',
            'border border-neutral-20',
            className
        )}>
            {children}
        </div>
    )
}

export function TabsTrigger({ value, children, className, disabled }: TabsTriggerProps) {
    const context = useContext(TabsContext)
    if (!context) {
        throw new Error('TabsTrigger must be used within Tabs')
    }

    const { value: currentValue, onValueChange } = context
    const isActive = currentValue === value

    return (
        <button
            type="button"
            disabled={disabled}
            onClick={() => !disabled && onValueChange(value)}
            className={cn(
                'inline-flex items-center justify-center whitespace-nowrap rounded-sm px-3 py-1.5 text-sm font-medium',
                'ring-offset-white transition-all focus-visible:outline-none focus-visible:ring-2',
                'focus-visible:ring-blue-500 focus-visible:ring-offset-2',
                'disabled:pointer-events-none disabled:opacity-50',
                isActive
                    ? 'bg-white text-neutral-90 shadow-sm border border-neutral-30'
                    : 'text-neutral-60 hover:text-neutral-90 hover:bg-neutral-5',
                className
            )}
        >
            {children}
        </button>
    )
}

export function TabsContent({ value, children, className }: TabsContentProps) {
    const context = useContext(TabsContext)
    if (!context) {
        throw new Error('TabsContent must be used within Tabs')
    }

    const { value: currentValue } = context

    if (currentValue !== value) {
        return null
    }

    return (
        <div className={cn(
            'mt-2 ring-offset-white focus-visible:outline-none focus-visible:ring-2',
            'focus-visible:ring-blue-500 focus-visible:ring-offset-2',
            className
        )}>
            {children}
        </div>
    )
}