'use client'

import React, { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Select } from '@/components/ui/Select'
import { Alert } from '@/components/ui/Alert'
import { Progress } from '@/components/ui/Progress'
import { CompanySearchResult } from '@/types/manual-company.types'
import { Database } from '@/types/database.types'
import { validateCinLlpin, determineProcessingEligibility } from '@/lib/utils/validators'
import {
    Zap,
    Building2,
    Settings,
    CheckCircle,
    AlertTriangle,
    Loader2,
    Database as DatabaseIcon,
    FileText,
    Users,
    Shield,
    AlertCircle,
    Clock,
    Info,
    Database as DatabaseIncon
} from 'lucide-react'

type Industry = Database['public']['Enums']['industry_type'];
type ModelType = Database['public']['Enums']['model_type'];

interface ProcessingStep {
    name: string
    status: 'pending' | 'in_progress' | 'completed' | 'failed'
    duration?: number
    error?: string
}

interface ProcessingResult {
    request_id: string;
    status: string;
    message: string;
    has_existing_data: boolean;
}

interface DataStatus {
    exists: boolean;
    has_comprehensive_data: boolean;
    data_cached_at: string | null;
    data_age_days: number | null;
    processing_method: 'existing_data' | 'api_fetch_required';
}

interface ApiProcessingFormProps {
    selectedCompany: CompanySearchResult
    onProcessingStart: (requestId: string) => void
    onProcessingComplete: (requestId: string) => void
    onProcessingError: (error: string) => void
}

const industryOptions = [
    { value: 'manufacturing-oem', label: 'Manufacturing - OEM' },
    { value: 'epc', label: 'EPC (Engineering, Procurement & Construction)' },
];

const modelTypeOptions = [
    { value: 'without_banking', label: 'Without Banking Data' },
    { value: 'with_banking', label: 'With Banking Data' },
];

export function ApiProcessingForm({
    selectedCompany,
    onProcessingStart,
    onProcessingComplete,
    onProcessingError
}: ApiProcessingFormProps) {
    // Configuration state
    const [industry, setIndustry] = useState<Industry>('manufacturing-oem');
    const [modelType, setModelType] = useState<ModelType>('without_banking');

    // Processing state
    const [cinLlpin, setCinLlpin] = useState(selectedCompany?.registration_number || '')
    const [isProcessing, setIsProcessing] = useState(false)
    const [progress, setProgress] = useState(0)
    const [currentStep, setCurrentStep] = useState('')
    const [validationError, setValidationError] = useState<string | null>(null)
    const [validationWarnings, setValidationWarnings] = useState<string[]>([])
    const [processingSteps, setProcessingSteps] = useState<ProcessingStep[]>([])
    const [eligibilityCheck, setEligibilityCheck] = useState<{
        apiEligible: boolean
        reasons: string[]
        identifierType: 'CIN' | 'PAN' | 'LLPIN'
    } | null>(null)
    const [retryCount, setRetryCount] = useState(0)
    const [maxRetries] = useState(3)

    // Data status state
    const [dataStatus, setDataStatus] = useState<DataStatus | null>(null);
    const [isCheckingData, setIsCheckingData] = useState(false);
    const [apiResult, setApiResult] = useState<ProcessingResult | null>(null);

    // Enhanced validation and eligibility checking
    useEffect(() => {
        if (cinLlpin) {
            const validation = validateCinLlpin(cinLlpin, selectedCompany.entity_type)
            if (validation.isValid) {
                setValidationError(null)
                setValidationWarnings(validation.warnings || [])

                // Determine identifier type
                let identifierType: 'CIN' | 'PAN' | 'LLPIN' = 'CIN'
                if (selectedCompany.entity_type === 'llp') {
                    identifierType = 'LLPIN'
                } else if (cinLlpin.length === 10 && /^[A-Z]{5}[0-9]{4}[A-Z]$/.test(cinLlpin)) {
                    identifierType = 'PAN'
                }

                // Check processing eligibility
                const eligibility = determineProcessingEligibility(
                    selectedCompany.entity_type,
                    identifierType === 'CIN' ? cinLlpin : undefined,
                    identifierType === 'LLPIN' ? cinLlpin : undefined,
                    identifierType === 'PAN' ? cinLlpin : undefined
                )
                setEligibilityCheck({
                    ...eligibility,
                    identifierType
                })
            } else {
                setValidationError(validation.error || 'Invalid format')
                setValidationWarnings([])
                setEligibilityCheck(null)
            }
        } else {
            setValidationError(null)
            setValidationWarnings([])
            setEligibilityCheck(null)
        }
    }, [cinLlpin, selectedCompany])

    // Check data status when company is selected
    useEffect(() => {
        if (cinLlpin && eligibilityCheck?.apiEligible) {
            setIsCheckingData(true);
            setDataStatus(null);

            const queryParam = eligibilityCheck.identifierType === 'PAN' ? 'pan' : 'cin';
            fetch(`/api/company/data-status?${queryParam}=${encodeURIComponent(cinLlpin)}`)
                .then(response => response.json())
                .then(data => {
                    if (data.success) {
                        setDataStatus(data.data);
                    } else {
                        console.error('Data status check failed:', data.error);
                    }
                })
                .catch(err => {
                    console.error('Data status check error:', err);
                })
                .finally(() => {
                    setIsCheckingData(false);
                });
        } else {
            setDataStatus(null);
        }
    }, [cinLlpin, eligibilityCheck?.apiEligible, eligibilityCheck?.identifierType])

    const initializeProcessingSteps = (): ProcessingStep[] => [
        { name: 'Validating CIN/LLPIN format and eligibility', status: 'pending' },
        { name: 'Checking data availability in MCA database', status: 'pending' },
        { name: 'Fetching comprehensive company details', status: 'pending' },
        { name: 'Retrieving financial statements and filings', status: 'pending' },
        { name: 'Collecting director and shareholding information', status: 'pending' },
        { name: 'Gathering compliance data (GST, EPFO)', status: 'pending' },
        { name: 'Generating risk analysis and scoring', status: 'pending' },
        { name: 'Creating company profile and portfolio entry', status: 'pending' }
    ]

    const updateProcessingStep = (stepIndex: number, status: ProcessingStep['status'], error?: string) => {
        setProcessingSteps(prev => prev.map((step, index) =>
            index === stepIndex ? { ...step, status, error } : step
        ))
    }

    const getPlaceholderText = () => {
        if (selectedCompany?.entity_type === 'llp') {
            return 'Enter LLPIN (XXX-XXXX)'
        }
        if (['proprietorship', 'partnership'].includes(selectedCompany?.entity_type)) {
            return 'Enter PAN (10 characters) or CIN (21 characters)'
        }
        return 'Enter CIN (21 characters)'
    }

    const handleRetry = async () => {
        if (retryCount < maxRetries) {
            setRetryCount(prev => prev + 1)
            await handleStartProcessing()
        } else {
            onProcessingError('Maximum retry attempts exceeded. Please try again later or contact support.')
        }
    }

    const handleStartProcessing = async () => {
        // Enhanced validation before processing
        const validation = validateCinLlpin(cinLlpin, selectedCompany.entity_type)
        if (!validation.isValid) {
            setValidationError(validation.error || 'Invalid format')
            return
        }

        // Check eligibility
        if (!eligibilityCheck?.apiEligible) {
            setValidationError('Company is not eligible for API processing')
            return
        }

        setValidationError(null)
        setIsProcessing(true)
        setProgress(0)
        setCurrentStep('')
        setApiResult(null)

        // Initialize processing steps
        const steps = initializeProcessingSteps()
        setProcessingSteps(steps)

        try {
            const stepIncrement = 100 / steps.length
            let currentProgress = 0

            // Step 1: Validation
            updateProcessingStep(0, 'in_progress')
            setCurrentStep(steps[0].name)
            await new Promise(resolve => setTimeout(resolve, 1000))
            updateProcessingStep(0, 'completed')
            currentProgress += stepIncrement
            setProgress(currentProgress)

            // Step 2: Data availability check
            updateProcessingStep(1, 'in_progress')
            setCurrentStep(steps[1].name)
            await new Promise(resolve => setTimeout(resolve, 1000))
            updateProcessingStep(1, 'completed')
            currentProgress += stepIncrement
            setProgress(currentProgress)

            // Step 3: Start API processing
            updateProcessingStep(2, 'in_progress')
            setCurrentStep(steps[2].name)

            const requestBody: any = {
                industry,
                model_type: modelType,
                company_name: selectedCompany?.name
            }

            // Add the appropriate identifier based on type
            if (eligibilityCheck?.identifierType === 'PAN') {
                requestBody.pan = cinLlpin
            } else {
                requestBody.cin = cinLlpin
            }

            const processResponse = await fetch('/api/company/process', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(requestBody)
            })

            if (!processResponse.ok) {
                const errorData = await processResponse.json()
                throw new Error(errorData.error || 'Processing request failed')
            }

            const processResult = await processResponse.json()

            if (processResult.success) {
                setApiResult(processResult.data);
                updateProcessingStep(2, 'completed')
                currentProgress += stepIncrement
                setProgress(currentProgress)

                // Steps 4-7: Simulate remaining processing steps
                for (let i = 3; i < steps.length - 1; i++) {
                    updateProcessingStep(i, 'in_progress')
                    setCurrentStep(steps[i].name)
                    await new Promise(resolve => setTimeout(resolve, 1500))
                    updateProcessingStep(i, 'completed')
                    currentProgress += stepIncrement
                    setProgress(currentProgress)
                }

                // Final step: Complete
                updateProcessingStep(steps.length - 1, 'in_progress')
                setCurrentStep(steps[steps.length - 1].name)
                await new Promise(resolve => setTimeout(resolve, 1000))
                updateProcessingStep(steps.length - 1, 'completed')
                setProgress(100)

                // Success
                onProcessingStart(processResult.data.request_id);
                onProcessingComplete(processResult.data.request_id)
            } else {
                throw new Error(processResult.error || 'Processing failed');
            }

        } catch (error) {
            console.error('API processing error:', error)

            // Mark current step as failed
            const currentStepIndex = processingSteps.findIndex(step => step.status === 'in_progress')
            if (currentStepIndex >= 0) {
                updateProcessingStep(currentStepIndex, 'failed', error instanceof Error ? error.message : 'Unknown error')
            }

            onProcessingError(error instanceof Error ? error.message : 'Processing failed')
        } finally {
            setIsProcessing(false)
        }
    }

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="text-center space-y-2">
                <div className="flex items-center justify-center gap-2 text-green-600 mb-4">
                    <Zap className="w-6 h-6" />
                </div>
                <h3 className="text-lg font-semibold text-neutral-90">
                    API Processing
                </h3>
                <p className="text-sm text-neutral-60 max-w-md mx-auto">
                    We'll fetch comprehensive company data directly from government databases using your CIN/LLPIN.
                </p>
            </div>

            {/* Configuration Section */}
            <Card>
                <CardHeader>
                    <div className="flex items-center gap-2">
                        <Settings className="w-5 h-5 text-neutral-60" />
                        <h4 className="font-semibold text-neutral-90">Processing Configuration</h4>
                    </div>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-neutral-70 mb-2">
                                Industry Type
                            </label>
                            <Select
                                value={industry}
                                onChange={(e) => setIndustry(e.target.value as Industry)}
                                disabled={isProcessing}
                            >
                                {industryOptions.map((option) => (
                                    <option key={option.value} value={option.value}>
                                        {option.label}
                                    </option>
                                ))}
                            </Select>
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-neutral-70 mb-2">
                                Model Type
                            </label>
                            <Select
                                value={modelType}
                                onChange={(e) => setModelType(e.target.value as ModelType)}
                                disabled={true}
                            >
                                {modelTypeOptions.map((option) => (
                                    <option key={option.value} value={option.value}>
                                        {option.label}
                                    </option>
                                ))}
                            </Select>
                        </div>
                    </div>
                </CardContent>
            </Card>

            {/* Company Info */}
            <Card>
                <CardHeader>
                    <h4 className="font-semibold text-neutral-90">Company Information</h4>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="text-sm font-medium text-neutral-70">Company Name</label>
                            <p className="text-neutral-90">{selectedCompany?.name}</p>
                        </div>
                        <div>
                            <label className="text-sm font-medium text-neutral-70">Entity Type</label>
                            <p className="text-neutral-90">
                                {selectedCompany?.entity_type.replace('_', ' ').toUpperCase()}
                            </p>
                        </div>
                    </div>

                    <div>
                        <label className="text-sm font-medium text-neutral-70 block mb-2">
                            CIN/LLPIN *
                        </label>
                        <Input
                            type="text"
                            placeholder={getPlaceholderText()}
                            value={cinLlpin}
                            onChange={(e) => {
                                setCinLlpin(e.target.value.toUpperCase())
                            }}
                            disabled={isProcessing}
                            className={validationError ? 'border-red-300' : validationWarnings.length > 0 ? 'border-yellow-300' : ''}
                        />

                        {validationError && (
                            <div className="flex items-center gap-2 mt-2 text-sm text-red-600">
                                <AlertCircle className="w-4 h-4" />
                                <span>{validationError}</span>
                            </div>
                        )}

                        {validationWarnings.length > 0 && !validationError && (
                            <div className="mt-2 space-y-1">
                                {validationWarnings.map((warning, index) => (
                                    <div key={index} className="flex items-center gap-2 text-sm text-yellow-600">
                                        <AlertTriangle className="w-4 h-4" />
                                        <span>{warning}</span>
                                    </div>
                                ))}
                            </div>
                        )}

                        {eligibilityCheck && (
                            <div className="mt-2">
                                {eligibilityCheck.apiEligible ? (
                                    <div className="flex items-center gap-2 text-sm text-green-600">
                                        <CheckCircle className="w-4 h-4" />
                                        <span>Eligible for API processing</span>
                                    </div>
                                ) : (
                                    <div className="space-y-1">
                                        <div className="flex items-center gap-2 text-sm text-red-600">
                                            <AlertCircle className="w-4 h-4" />
                                            <span>Not eligible for API processing</span>
                                        </div>
                                        <ul className="text-xs text-neutral-600 ml-6 list-disc">
                                            {eligibilityCheck.reasons.map((reason, index) => (
                                                <li key={index}>{reason}</li>
                                            ))}
                                        </ul>
                                    </div>
                                )}
                            </div>
                        )}

                        <p className="text-xs text-neutral-500 mt-1">
                            {eligibilityCheck?.identifierType === 'PAN'
                                ? 'This PAN will be used to fetch available data from government databases'
                                : 'This will be used to fetch data from MCA and other government databases'
                            }
                        </p>
                    </div>

                    {/* Data Status Display */}
                    {isCheckingData && (
                        <div className="bg-blue-5 rounded-lg p-4">
                            <div className="flex items-center gap-2">
                                <Loader2 className="w-4 h-4 animate-spin text-blue-60" />
                                <span className="text-sm text-neutral-70">Checking data availability...</span>
                            </div>
                        </div>
                    )}

                    {dataStatus && (
                        <div className="bg-blue-5 rounded-lg p-4">
                            <h5 className="font-medium text-neutral-90 mb-3">Data Availability Status</h5>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div className="flex items-center gap-2">
                                    <DatabaseIcon className="w-4 h-4 text-neutral-60" />
                                    <div>
                                        <p className="text-xs text-neutral-60">Data Source</p>
                                        <p className="text-sm font-medium text-neutral-90">
                                            {dataStatus.has_comprehensive_data ? 'Database Cache' : 'API Fetch Required'}
                                        </p>
                                    </div>
                                </div>

                                {dataStatus.data_age_days !== null && (
                                    <div className="flex items-center gap-2">
                                        <Clock className="w-4 h-4 text-neutral-60" />
                                        <div>
                                            <p className="text-xs text-neutral-60">Data Age</p>
                                            <p className="text-sm font-medium text-neutral-90">
                                                {dataStatus.data_age_days === 0 ? 'Today' : `${dataStatus.data_age_days} days old`}
                                            </p>
                                        </div>
                                    </div>
                                )}
                            </div>

                            <div className="mt-3 p-2 bg-blue-10 rounded text-xs text-blue-80">
                                {dataStatus.processing_method === 'existing_data'
                                    ? '✓ Processing will use cached data for faster results'
                                    : '⚡ Fresh data will be fetched from external APIs'
                                }
                            </div>
                        </div>
                    )}
                </CardContent>
            </Card>

            {/* API Processing Result */}
            {apiResult && (
                <Card>
                    <CardContent className="p-6">
                        <div className="bg-gradient-to-r from-green-5 to-green-10 border border-green-20 rounded-lg p-6">
                            <div className="flex items-center gap-3 mb-4">
                                <CheckCircle className="w-6 h-6 text-green-60" />
                                <div>
                                    <h3 className="text-lg font-semibold text-neutral-90">
                                        Processing Started Successfully
                                    </h3>
                                    <p className="text-sm text-neutral-60">
                                        Request ID: {apiResult.request_id}
                                    </p>
                                </div>
                            </div>

                            <div className="space-y-2">
                                <div className="flex items-center justify-between">
                                    <span className="text-sm text-neutral-60">Status:</span>
                                    <span className="text-sm font-medium text-neutral-90 capitalize">
                                        {apiResult.status}
                                    </span>
                                </div>
                                <div className="flex items-center justify-between">
                                    <span className="text-sm text-neutral-60">Data Source:</span>
                                    <span className="text-sm font-medium text-neutral-90">
                                        {apiResult.has_existing_data ? 'Existing Database' : 'Fresh API Fetch'}
                                    </span>
                                </div>
                            </div>

                            <div className="mt-4 p-3 bg-green-10 rounded-lg">
                                <p className="text-sm text-green-80">{apiResult.message}</p>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            )}

            {/* Enhanced Processing Status */}
            {isProcessing && (
                <Card>
                    <CardHeader>
                        <div className="flex items-center justify-between">
                            <h4 className="font-semibold text-neutral-90">Processing Status</h4>
                            <div className="text-sm text-neutral-600">
                                {Math.round(progress)}% complete
                            </div>
                        </div>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <Progress value={progress} className="w-full" />

                        {currentStep && (
                            <div className="flex items-center gap-3">
                                <Loader2 className="w-4 h-4 animate-spin text-blue-600" />
                                <span className="text-sm text-neutral-700">{currentStep}</span>
                            </div>
                        )}

                        {/* Detailed step progress */}
                        <div className="space-y-2">
                            {processingSteps.map((step, index) => (
                                <div key={index} className="flex items-center gap-3 text-sm">
                                    {step.status === 'completed' && (
                                        <CheckCircle className="w-4 h-4 text-green-600" />
                                    )}
                                    {step.status === 'in_progress' && (
                                        <Loader2 className="w-4 h-4 animate-spin text-blue-600" />
                                    )}
                                    {step.status === 'failed' && (
                                        <AlertCircle className="w-4 h-4 text-red-600" />
                                    )}
                                    {step.status === 'pending' && (
                                        <Clock className="w-4 h-4 text-neutral-400" />
                                    )}

                                    <span className={`
                                        ${step.status === 'completed' ? 'text-green-700' : ''}
                                        ${step.status === 'in_progress' ? 'text-blue-700 font-medium' : ''}
                                        ${step.status === 'failed' ? 'text-red-700' : ''}
                                        ${step.status === 'pending' ? 'text-neutral-500' : ''}
                                    `}>
                                        {step.name}
                                    </span>

                                    {step.error && (
                                        <span className="text-xs text-red-600 ml-2">
                                            - {step.error}
                                        </span>
                                    )}
                                </div>
                            ))}
                        </div>

                        {/* Retry option for failed steps */}
                        {processingSteps.some(step => step.status === 'failed') && retryCount < maxRetries && (
                            <div className="pt-4 border-t">
                                <Button
                                    onClick={handleRetry}
                                    variant="outline"
                                    size="sm"
                                    className="text-blue-600 border-blue-300 hover:bg-blue-50"
                                >
                                    <AlertTriangle className="w-4 h-4 mr-2" />
                                    Retry Processing ({retryCount}/{maxRetries})
                                </Button>
                            </div>
                        )}
                    </CardContent>
                </Card>
            )}

            {/* Data Sources Info */}
            <Card>
                <CardHeader>
                    <h4 className="font-semibold text-neutral-90">Data Sources</h4>
                </CardHeader>
                <CardContent>
                    <div className="grid grid-cols-2 gap-4">
                        <div className="flex items-center gap-3 p-3 bg-green-50 rounded-lg">
                            <DatabaseIcon className="w-5 h-5 text-green-600" />
                            <div>
                                <p className="font-medium text-green-900 text-sm">MCA Database</p>
                                <p className="text-xs text-green-700">Company registration & filings</p>
                            </div>
                        </div>

                        <div className="flex items-center gap-3 p-3 bg-blue-50 rounded-lg">
                            <FileText className="w-5 h-5 text-blue-600" />
                            <div>
                                <p className="font-medium text-blue-900 text-sm">Financial Data</p>
                                <p className="text-xs text-blue-700">Annual returns & statements</p>
                            </div>
                        </div>

                        <div className="flex items-center gap-3 p-3 bg-purple-50 rounded-lg">
                            <Users className="w-5 h-5 text-purple-600" />
                            <div>
                                <p className="font-medium text-purple-900 text-sm">Director Info</p>
                                <p className="text-xs text-purple-700">Current & past directors</p>
                            </div>
                        </div>

                        <div className="flex items-center gap-3 p-3 bg-orange-50 rounded-lg">
                            <Shield className="w-5 h-5 text-orange-600" />
                            <div>
                                <p className="font-medium text-orange-900 text-sm">Compliance</p>
                                <p className="text-xs text-orange-700">GST, EPFO & other records</p>
                            </div>
                        </div>
                    </div>
                </CardContent>
            </Card>

            {/* Action Button */}
            <div className="flex justify-center">
                <Button
                    onClick={handleStartProcessing}
                    disabled={isProcessing || !cinLlpin || !!validationError || !eligibilityCheck?.apiEligible}
                    className="px-8"
                    size="lg"
                >
                    {isProcessing ? (
                        <>
                            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                            Processing...
                        </>
                    ) : (
                        <>
                            <Zap className="w-4 h-4 mr-2" />
                            Start API Processing
                        </>
                    )}
                </Button>
            </div>

            {/* Benefits */}
            <Alert variant="info">
                <Info className="w-4 h-4" />
                <div>
                    <p className="font-medium">Benefits of API Processing</p>
                    <ul className="text-sm mt-1 list-disc list-inside space-y-0.5">
                        <li>Fastest processing time (5-10 minutes)</li>
                        <li>Most comprehensive data (85% completeness)</li>
                        <li>Real-time data from government sources</li>
                        <li>Automatic risk analysis and scoring</li>
                    </ul>
                </div>
            </Alert>
        </div>
    )
}