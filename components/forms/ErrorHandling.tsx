"use client";

import { useState, useEffect } from "react";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Badge, BadgeVariant } from "@/components/ui/Badge";
import { Alert } from "@/components/ui/Alert";
import {
    AlertTriangle,
    RefreshCw,
    FileX,
    Clock,
    Info,
    ChevronDown,
    ChevronRight,
    Copy,
    ExternalLink,
    Bug
} from "lucide-react";

interface ProcessingError {
    id: string;
    request_id: string;
    company_name: string;
    error_type: 'validation' | 'extraction' | 'analysis' | 'system' | 'timeout';
    error_code: string;
    error_message: string;
    error_details?: any;
    stage: string;
    timestamp: string;
    retry_count: number;
    max_retries: number;
    is_retryable: boolean;
    suggested_actions: string[];
    technical_details?: {
        stack_trace?: string;
        file_info?: any;
        system_info?: any;
    };
}

interface ErrorHandlingProps {
    requestId: string;
    onRetry?: () => void;
    onErrorResolved?: () => void;
}

const ERROR_TYPE_CONFIG = {
    validation: {
        label: 'Validation Error',
        color: 'red' as const,
        icon: FileX,
        description: 'Document format or content validation failed'
    },
    extraction: {
        label: 'Extraction Error',
        color: 'orange' as const,
        icon: AlertTriangle,
        description: 'Failed to extract data from document'
    },
    analysis: {
        label: 'Analysis Error',
        color: 'yellow' as const,
        icon: Bug,
        description: 'Error during risk analysis calculation'
    },
    system: {
        label: 'System Error',
        color: 'red' as const,
        icon: AlertTriangle,
        description: 'Internal system error occurred'
    },
    timeout: {
        label: 'Timeout Error',
        color: 'blue' as const,
        icon: Clock,
        description: 'Processing exceeded time limit'
    }
};

const COMMON_SOLUTIONS = {
    'INVALID_FILE_FORMAT': [
        'Ensure the file is in PDF, Excel (.xlsx, .xls), or CSV format',
        'Check that the file is not corrupted or password-protected',
        'Try converting the file to a different supported format'
    ],
    'FILE_TOO_LARGE': [
        'Reduce file size to under 50MB',
        'Compress images or remove unnecessary pages',
        'Split large files into smaller documents'
    ],
    'INSUFFICIENT_DATA': [
        'Ensure the document contains complete financial statements',
        'Include balance sheet, P&L, and cash flow statements',
        'Verify all required company information is present'
    ],
    'EXTRACTION_FAILED': [
        'Check document quality and readability',
        'Ensure text is not in image format (use OCR if needed)',
        'Verify the document structure matches expected format'
    ],
    'ANALYSIS_TIMEOUT': [
        'The document may be too complex - try simplifying',
        'Retry processing during off-peak hours',
        'Contact support if the issue persists'
    ]
};

export function ErrorHandling({ requestId, onRetry, onErrorResolved }: ErrorHandlingProps) {
    const [error, setError] = useState<ProcessingError | null>(null);
    const [loading, setLoading] = useState(true);
    const [retrying, setRetrying] = useState(false);
    const [showTechnicalDetails, setShowTechnicalDetails] = useState(false);
    const [showErrorDetails, setShowErrorDetails] = useState(false);

    useEffect(() => {
        fetchErrorDetails();
    }, [requestId]);

    const fetchErrorDetails = async () => {
        try {
            setLoading(true);
            const response = await fetch(`/api/portfolio/${requestId}/error`);

            if (response.ok) {
                const errorData = await response.json();
                setError(errorData);
            } else if (response.status === 404) {
                // No error found - processing might have succeeded
                setError(null);
                onErrorResolved?.();
            }
        } catch (err) {
            console.error('Failed to fetch error details:', err);
        } finally {
            setLoading(false);
        }
    };

    const handleRetry = async () => {
        if (!error || !error.is_retryable) return;

        try {
            setRetrying(true);
            const response = await fetch(`/api/portfolio/${requestId}/retry`, {
                method: 'POST'
            });

            if (response.ok) {
                onRetry?.();
                // Clear error state as we're retrying
                setError(null);
            } else {
                const result = await response.json();
                console.error('Retry failed:', result.error);
            }
        } catch (err) {
            console.error('Failed to retry processing:', err);
        } finally {
            setRetrying(false);
        }
    };

    const copyErrorDetails = () => {
        if (!error) return;

        const errorInfo = {
            request_id: error.request_id,
            error_type: error.error_type,
            error_code: error.error_code,
            error_message: error.error_message,
            stage: error.stage,
            timestamp: error.timestamp,
            technical_details: error.technical_details
        };

        navigator.clipboard.writeText(JSON.stringify(errorInfo, null, 2));
    };

    const getSuggestedActions = (errorCode: string): string[] => {
        return COMMON_SOLUTIONS[errorCode as keyof typeof COMMON_SOLUTIONS] || [
            'Try uploading the document again',
            'Check that the document format is supported',
            'Contact support if the issue persists'
        ];
    };

    if (loading) {
        return (
            <Card className="p-4">
                <div className="flex items-center gap-2">
                    <RefreshCw className="w-4 h-4 animate-spin" />
                    <span className="text-sm">Loading error details...</span>
                </div>
            </Card>
        );
    }

    if (!error) {
        return null;
    }

    const config = ERROR_TYPE_CONFIG[error.error_type];
    const IconComponent = config.icon;
    const suggestedActions = error.suggested_actions.length > 0
        ? error.suggested_actions
        : getSuggestedActions(error.error_code);

    return (
        <div className="space-y-4">
            {/* Main Error Card */}
            <Card className="border-fluent-error/20 bg-fluent-error/5">
                <div className="p-4">
                    <div className="flex items-start gap-3">
                        <IconComponent className="w-5 h-5 text-fluent-error mt-0.5 flex-shrink-0" />

                        <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-2">
                                <h3 className="font-medium text-fluent-error">
                                    Processing Failed
                                </h3>
                                <Badge variant={config.color as BadgeVariant}>
                                    {config.label}
                                </Badge>
                            </div>

                            <p className="text-sm text-neutral-90 mb-2">
                                {error.error_message}
                            </p>

                            <div className="flex items-center gap-4 text-xs text-neutral-60 mb-3">
                                <span>Company: {error.company_name}</span>
                                <span>Stage: {error.stage}</span>
                                <span>Time: {new Date(error.timestamp).toLocaleString()}</span>
                                <span>Code: {error.error_code}</span>
                            </div>

                            {/* Retry Information */}
                            <div className="flex items-center justify-between">
                                <div className="text-xs text-neutral-60">
                                    Retry {error.retry_count} of {error.max_retries}
                                    {error.is_retryable ? ' • Retry available' : ' • Max retries reached'}
                                </div>

                                <div className="flex items-center gap-2">
                                    <Button
                                        variant="ghost"
                                        size="sm"
                                        onClick={() => setShowErrorDetails(!showErrorDetails)}
                                    >
                                        {showErrorDetails ? (
                                            <ChevronDown className="w-3 h-3 mr-1" />
                                        ) : (
                                            <ChevronRight className="w-3 h-3 mr-1" />
                                        )}
                                        Details
                                    </Button>

                                    {error.is_retryable && (
                                        <Button
                                            variant="secondary"
                                            size="sm"
                                            onClick={handleRetry}
                                            disabled={retrying}
                                        >
                                            {retrying ? (
                                                <RefreshCw className="w-3 h-3 mr-1 animate-spin" />
                                            ) : (
                                                <RefreshCw className="w-3 h-3 mr-1" />
                                            )}
                                            Retry Processing
                                        </Button>
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Expanded Error Details */}
                {showErrorDetails && (
                    <div className="border-t border-fluent-error/20 p-4 bg-white">
                        <div className="space-y-4">
                            {/* Error Details */}
                            {error.error_details && (
                                <div>
                                    <h4 className="text-sm font-medium text-neutral-90 mb-2">
                                        Error Details
                                    </h4>
                                    <div className="bg-neutral-10 rounded p-3 text-xs font-mono">
                                        <pre className="whitespace-pre-wrap text-neutral-70">
                                            {JSON.stringify(error.error_details, null, 2)}
                                        </pre>
                                    </div>
                                </div>
                            )}

                            {/* Technical Details */}
                            {error.technical_details && (
                                <div>
                                    <div className="flex items-center justify-between mb-2">
                                        <h4 className="text-sm font-medium text-neutral-90">
                                            Technical Details
                                        </h4>
                                        <Button
                                            variant="ghost"
                                            size="sm"
                                            onClick={() => setShowTechnicalDetails(!showTechnicalDetails)}
                                        >
                                            {showTechnicalDetails ? (
                                                <ChevronDown className="w-3 h-3 mr-1" />
                                            ) : (
                                                <ChevronRight className="w-3 h-3 mr-1" />
                                            )}
                                            {showTechnicalDetails ? 'Hide' : 'Show'}
                                        </Button>
                                    </div>

                                    {showTechnicalDetails && (
                                        <div className="bg-neutral-10 rounded p-3 text-xs font-mono max-h-48 overflow-y-auto">
                                            <pre className="whitespace-pre-wrap text-neutral-70">
                                                {JSON.stringify(error.technical_details, null, 2)}
                                            </pre>
                                        </div>
                                    )}
                                </div>
                            )}

                            {/* Actions */}
                            <div className="flex items-center gap-2 pt-2 border-t border-neutral-20">
                                <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={copyErrorDetails}
                                >
                                    <Copy className="w-3 h-3 mr-1" />
                                    Copy Error Info
                                </Button>

                                <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => window.open('/support', '_blank')}
                                >
                                    <ExternalLink className="w-3 h-3 mr-1" />
                                    Contact Support
                                </Button>
                            </div>
                        </div>
                    </div>
                )}
            </Card>

            {/* Suggested Actions */}
            <Card className="p-4">
                <div className="flex items-start gap-3">
                    <Info className="w-5 h-5 text-fluent-blue mt-0.5 flex-shrink-0" />

                    <div className="flex-1">
                        <h3 className="font-medium text-neutral-90 mb-2">
                            Suggested Actions
                        </h3>

                        <ul className="space-y-2">
                            {suggestedActions.map((action, index) => (
                                <li key={index} className="flex items-start gap-2 text-sm text-neutral-70">
                                    <span className="w-1 h-1 bg-fluent-blue rounded-full mt-2 flex-shrink-0"></span>
                                    <span>{action}</span>
                                </li>
                            ))}
                        </ul>

                        {!error.is_retryable && (
                            <Alert variant="warning" className="mt-3">
                                <AlertTriangle className="w-4 h-4" />
                                <div>
                                    <p className="font-medium">Maximum retries reached</p>
                                    <p className="text-sm">
                                        This error cannot be automatically retried. Please review the suggested actions above or contact support.
                                    </p>
                                </div>
                            </Alert>
                        )}
                    </div>
                </div>
            </Card>

            {/* Common Error Patterns */}
            <Card className="p-4">
                <h3 className="font-medium text-neutral-90 mb-3">
                    Common Solutions for {config.label}
                </h3>

                <div className="text-sm text-neutral-70 space-y-2">
                    <p>{config.description}</p>

                    <div className="bg-neutral-10 rounded p-3 mt-3">
                        <h4 className="font-medium text-neutral-90 mb-2">Prevention Tips:</h4>
                        <ul className="space-y-1 text-xs">
                            <li>• Ensure documents are high quality and clearly readable</li>
                            <li>• Use standard financial statement formats when possible</li>
                            <li>• Verify all required company information is included</li>
                            <li>• Check file size limits and format requirements</li>
                        </ul>
                    </div>
                </div>
            </Card>
        </div>
    );
}