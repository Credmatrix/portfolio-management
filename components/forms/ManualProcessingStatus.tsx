'use client'

import React from 'react';
import { Card, CardContent, CardHeader } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Progress } from '@/components/ui/Progress';
import { Alert } from '@/components/ui/Alert';
import {
    CheckCircle,
    AlertTriangle,
    Loader2,
    BarChart3,
    Shield,
    FileCheck,
    RefreshCw,
    AlertCircle
} from 'lucide-react';

export interface ProcessingStatusProps {
    status: 'idle' | 'processing' | 'completed' | 'failed';
    progress: number;
    currentStep: string;
    requestId?: string;
    dataCompletenessScore?: number;
    riskAnalysis?: {
        overall_risk_score: number;
        risk_category: 'low' | 'medium' | 'high' | 'very_high';
        recommendations: string[];
    };
    error?: string;
    onRetry?: () => void;
    onViewDetails?: (requestId: string) => void;
}

export function ManualProcessingStatus({
    status,
    progress,
    currentStep,
    requestId,
    dataCompletenessScore,
    riskAnalysis,
    error,
    onRetry,
    onViewDetails
}: ProcessingStatusProps) {
    if (status === 'idle') {
        return null;
    }

    const getRiskCategoryColor = (category: string) => {
        switch (category) {
            case 'low': return 'text-green-600 bg-green-50 border-green-200';
            case 'medium': return 'text-yellow-600 bg-yellow-50 border-yellow-200';
            case 'high': return 'text-orange-600 bg-orange-50 border-orange-200';
            case 'very_high': return 'text-red-600 bg-red-50 border-red-200';
            default: return 'text-neutral-600 bg-neutral-50 border-neutral-200';
        }
    };

    return (
        <Card className="w-full">
            <CardHeader>
                <div className="flex items-center justify-between">
                    <h4 className="font-semibold text-neutral-90">
                        Manual Processing Status
                    </h4>
                    {status === 'completed' && requestId && (
                        <div className="flex items-center gap-2 text-sm text-green-600">
                            <CheckCircle className="w-4 h-4" />
                            <span>Completed</span>
                        </div>
                    )}
                    {status === 'failed' && (
                        <div className="flex items-center gap-2 text-sm text-red-600">
                            <AlertTriangle className="w-4 h-4" />
                            <span>Failed</span>
                        </div>
                    )}
                </div>
            </CardHeader>

            <CardContent className="space-y-4">
                {/* Processing Progress */}
                {status === 'processing' && (
                    <div className="space-y-3">
                        <div className="flex items-center gap-3">
                            <Loader2 className="w-5 h-5 animate-spin text-blue-600" />
                            <span className="font-medium text-neutral-90">Processing...</span>
                        </div>

                        <Progress value={progress} className="w-full" />

                        <div className="flex justify-between items-center text-sm">
                            <span className="text-neutral-600">{currentStep}</span>
                            <span className="text-neutral-500">{Math.round(progress)}%</span>
                        </div>
                    </div>
                )}

                {/* Completion Results */}
                {status === 'completed' && (
                    <div className="space-y-4">
                        <Alert variant="success">
                            <CheckCircle className="w-4 h-4" />
                            <div>
                                <p className="font-medium">Processing Completed Successfully</p>
                                <p className="text-sm mt-1">
                                    Manual entry has been processed and added to your portfolio.
                                </p>
                            </div>
                        </Alert>

                        {/* Data Quality Metrics */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {/* Data Completeness Score */}
                            {dataCompletenessScore !== undefined && (
                                <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
                                    <div className="flex items-center gap-3 mb-2">
                                        <FileCheck className="w-5 h-5 text-blue-600" />
                                        <h5 className="font-medium text-blue-900">Data Completeness</h5>
                                    </div>
                                    <div className="text-2xl font-bold text-blue-900 mb-1">
                                        {dataCompletenessScore}%
                                    </div>
                                    <p className="text-sm text-blue-700">
                                        {dataCompletenessScore >= 80 ? 'Excellent' :
                                            dataCompletenessScore >= 60 ? 'Good' :
                                                dataCompletenessScore >= 40 ? 'Fair' : 'Needs Improvement'}
                                    </p>
                                </div>
                            )}

                            {/* Risk Analysis */}
                            {riskAnalysis && (
                                <div className={`p-4 rounded-lg border ${getRiskCategoryColor(riskAnalysis.risk_category)}`}>
                                    <div className="flex items-center gap-3 mb-2">
                                        <Shield className="w-5 h-5" />
                                        <h5 className="font-medium">Risk Assessment</h5>
                                    </div>
                                    <div className="text-2xl font-bold mb-1">
                                        {riskAnalysis.overall_risk_score}/100
                                    </div>
                                    <p className="text-sm capitalize">
                                        {riskAnalysis.risk_category.replace('_', ' ')} Risk
                                    </p>
                                </div>
                            )}
                        </div>

                        {/* Risk Recommendations */}
                        {riskAnalysis?.recommendations && riskAnalysis.recommendations.length > 0 && (
                            <div className="bg-yellow-50 p-4 rounded-lg border border-yellow-200">
                                <div className="flex items-center gap-2 mb-3">
                                    <BarChart3 className="w-5 h-5 text-yellow-600" />
                                    <h5 className="font-medium text-yellow-900">Risk Management Recommendations</h5>
                                </div>
                                <ul className="space-y-2">
                                    {riskAnalysis.recommendations.map((recommendation, index) => (
                                        <li key={index} className="text-sm text-yellow-800 flex items-start gap-2">
                                            <span className="w-1.5 h-1.5 bg-yellow-600 rounded-full mt-2 flex-shrink-0"></span>
                                            <span>{recommendation}</span>
                                        </li>
                                    ))}
                                </ul>
                            </div>
                        )}

                        {/* Action Buttons */}
                        <div className="flex gap-3 pt-2">
                            {requestId && onViewDetails && (
                                <Button
                                    onClick={() => onViewDetails(requestId)}
                                    className="flex-1"
                                >
                                    <FileCheck className="w-4 h-4 mr-2" />
                                    View Company Details
                                </Button>
                            )}
                        </div>
                    </div>
                )}

                {/* Error State */}
                {status === 'failed' && (
                    <div className="space-y-4">
                        <Alert variant="error">
                            <AlertCircle className="w-4 h-4" />
                            <div>
                                <p className="font-medium">Processing Failed</p>
                                <p className="text-sm mt-1">
                                    {error || 'An error occurred during processing. Please try again.'}
                                </p>
                            </div>
                        </Alert>

                        {onRetry && (
                            <div className="flex justify-center">
                                <Button
                                    onClick={onRetry}
                                    variant="outline"
                                    className="text-blue-600 border-blue-300 hover:bg-blue-50"
                                >
                                    <RefreshCw className="w-4 h-4 mr-2" />
                                    Retry Processing
                                </Button>
                            </div>
                        )}
                    </div>
                )}

                {/* Processing Steps Info */}
                {status === 'processing' && (
                    <div className="bg-neutral-50 p-4 rounded-lg">
                        <h5 className="font-medium text-neutral-90 mb-3">Processing Steps</h5>
                        <div className="space-y-2 text-sm">
                            <div className={`flex items-center gap-2 ${progress >= 20 ? 'text-green-600' : 'text-neutral-500'}`}>
                                {progress >= 20 ? <CheckCircle className="w-4 h-4" /> : <div className="w-4 h-4 border-2 border-neutral-300 rounded-full"></div>}
                                <span>Validate form data</span>
                            </div>
                            <div className={`flex items-center gap-2 ${progress >= 40 ? 'text-green-600' : 'text-neutral-500'}`}>
                                {progress >= 40 ? <CheckCircle className="w-4 h-4" /> : <div className="w-4 h-4 border-2 border-neutral-300 rounded-full"></div>}
                                <span>Calculate data completeness score</span>
                            </div>
                            <div className={`flex items-center gap-2 ${progress >= 60 ? 'text-green-600' : 'text-neutral-500'}`}>
                                {progress >= 60 ? <CheckCircle className="w-4 h-4" /> : <div className="w-4 h-4 border-2 border-neutral-300 rounded-full"></div>}
                                <span>Perform risk analysis</span>
                            </div>
                            <div className={`flex items-center gap-2 ${progress >= 80 ? 'text-green-600' : 'text-neutral-500'}`}>
                                {progress >= 80 ? <CheckCircle className="w-4 h-4" /> : <div className="w-4 h-4 border-2 border-neutral-300 rounded-full"></div>}
                                <span>Generate processing request</span>
                            </div>
                            <div className={`flex items-center gap-2 ${progress >= 100 ? 'text-green-600' : 'text-neutral-500'}`}>
                                {progress >= 100 ? <CheckCircle className="w-4 h-4" /> : <div className="w-4 h-4 border-2 border-neutral-300 rounded-full"></div>}
                                <span>Complete processing</span>
                            </div>
                        </div>
                    </div>
                )}
            </CardContent>
        </Card>
    );
}