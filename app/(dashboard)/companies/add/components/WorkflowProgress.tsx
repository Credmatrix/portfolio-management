'use client'

import React from 'react'
import { Card, CardContent } from '@/components/ui/Card'
import { Badge } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'
import { WorkflowStep } from '@/types/manual-company.types'
import {
    Search,
    Building2,
    Settings,
    FileText,
    CheckCircle,
    Circle,
    AlertTriangle
} from 'lucide-react'

interface WorkflowProgressProps {
    steps: WorkflowStep[]
    currentStep: number
    onStepClick?: (stepNumber: number) => void
}

const STEP_ICONS = {
    search: Search,
    selection: Building2,
    form: FileText,
    upload: FileText,
    review: CheckCircle,
    processing: Settings
}

export function WorkflowProgress({ steps, currentStep, onStepClick }: WorkflowProgressProps) {
    const getStepIcon = (step: WorkflowStep) => {
        const IconComponent = STEP_ICONS[step.step_type] || Circle
        return IconComponent
    }

    const getStepStatus = (step: WorkflowStep) => {
        if (step.validation_errors.length > 0) {
            return 'error'
        }
        if (step.is_completed) {
            return 'completed'
        }
        if (step.is_current) {
            return 'current'
        }
        return 'pending'
    }

    const getStepColor = (status: string) => {
        switch (status) {
            case 'completed':
                return 'text-green-600 bg-green-100 border-green-200'
            case 'current':
                return 'text-blue-600 bg-blue-100 border-blue-200'
            case 'error':
                return 'text-red-600 bg-red-100 border-red-200'
            default:
                return 'text-neutral-400 bg-neutral-50 border-neutral-200'
        }
    }

    const canClickStep = (step: WorkflowStep) => {
        // Can click on completed steps or current step
        return step.is_completed || step.is_current
    }

    return (
        <Card>
            <CardContent className="p-4">
                <div className="space-y-1">
                    <h3 className="font-semibold text-neutral-90 mb-4">Progress</h3>

                    <div className="space-y-3">
                        {steps.map((step, index) => {
                            const Icon = getStepIcon(step)
                            const status = getStepStatus(step)
                            const colorClasses = getStepColor(status)
                            const isClickable = canClickStep(step) && onStepClick

                            const StepContent = (
                                <div className="flex items-start gap-3">
                                    {/* Step Icon */}
                                    <div className={`
                    flex items-center justify-center w-8 h-8 rounded-full border-2 transition-colors
                    ${colorClasses}
                  `}>
                                        {status === 'completed' ? (
                                            <CheckCircle className="w-4 h-4" />
                                        ) : status === 'error' ? (
                                            <AlertTriangle className="w-4 h-4" />
                                        ) : (
                                            <Icon className="w-4 h-4" />
                                        )}
                                    </div>

                                    {/* Step Content */}
                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-center gap-2">
                                            <p className={`
                        text-sm font-medium
                        ${status === 'current' ? 'text-blue-900' :
                                                    status === 'completed' ? 'text-green-900' :
                                                        status === 'error' ? 'text-red-900' : 'text-neutral-500'}
                      `}>
                                                {step.step_name}
                                            </p>

                                            {status === 'current' && (
                                                <Badge variant="info" size="sm">Current</Badge>
                                            )}

                                            {step.validation_errors.length > 0 && (
                                                <Badge variant="error" size="sm">
                                                    {step.validation_errors.length}
                                                </Badge>
                                            )}
                                        </div>

                                        <p className="text-xs text-neutral-500 mt-1">
                                            Step {step.step_number}
                                            {step.is_optional && ' (Optional)'}
                                        </p>

                                        {/* Validation Errors */}
                                        {step.validation_errors.length > 0 && (
                                            <div className="mt-2 space-y-1">
                                                {step.validation_errors.slice(0, 2).map((error, errorIndex) => (
                                                    <p key={errorIndex} className="text-xs text-red-600">
                                                        • {error.message}
                                                    </p>
                                                ))}
                                                {step.validation_errors.length > 2 && (
                                                    <p className="text-xs text-red-500">
                                                        +{step.validation_errors.length - 2} more errors
                                                    </p>
                                                )}
                                            </div>
                                        )}
                                    </div>
                                </div>
                            )

                            return (
                                <div key={step.step_number} className="relative">
                                    {isClickable ? (
                                        <Button
                                            variant="ghost"
                                            className="w-full p-3 h-auto justify-start hover:bg-neutral-50"
                                            onClick={() => onStepClick(step.step_number)}
                                        >
                                            {StepContent}
                                        </Button>
                                    ) : (
                                        <div className="p-3">
                                            {StepContent}
                                        </div>
                                    )}

                                    {/* Connector Line */}
                                    {index < steps.length - 1 && (
                                        <div className="absolute left-7 top-11 w-0.5 h-6 bg-neutral-200" />
                                    )}
                                </div>
                            )
                        })}
                    </div>

                    {/* Progress Summary */}
                    <div className="mt-6 pt-4 border-t border-neutral-200">
                        <div className="space-y-2">
                            <div className="flex justify-between text-xs text-neutral-600">
                                <span>Progress</span>
                                <span>{Math.round((currentStep - 1) / steps.length * 100)}%</span>
                            </div>

                            <div className="w-full bg-neutral-200 rounded-full h-2">
                                <div
                                    className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                                    style={{ width: `${(currentStep - 1) / steps.length * 100}%` }}
                                />
                            </div>

                            <div className="flex justify-between text-xs text-neutral-500">
                                <span>Step {currentStep}</span>
                                <span>of {steps.length}</span>
                            </div>
                        </div>
                    </div>
                </div>
            </CardContent>
        </Card>
    )
}