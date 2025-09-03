"use client";

import { useState, useEffect } from "react";
import { Card } from "@/components/ui/Card";
import { Progress } from "@/components/ui/Progress";
import { Badge, BadgeVariant } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import {
    Clock,
    CheckCircle,
    AlertCircle,
    RefreshCw,
    FileText,
    Loader2,
    Eye
} from "lucide-react";

interface UploadRequest {
    id: string;
    request_id: string;
    company_name: string;
    filename: string;
    status: 'upload_pending' | 'submitted' | 'processing' | 'completed' | 'failed';
    progress?: number;
    submitted_at: string;
    processing_started_at?: string;
    completed_at?: string;
    error_message?: string;
    estimated_completion?: string;
}

interface UploadProgressProps {
    requests: UploadRequest[];
    onStatusUpdate: (requestId: string, status: string, progress?: number) => void;
}

const STATUS_CONFIG = {
    upload_pending: {
        label: 'Upload Pending',
        color: 'gray' as const,
        icon: Clock,
        description: 'Waiting for upload completion'
    },
    submitted: {
        label: 'Queued',
        color: 'blue' as const,
        icon: Clock,
        description: 'Waiting in processing queue'
    },
    processing: {
        label: 'Processing',
        color: 'yellow' as const,
        icon: Loader2,
        description: 'Analyzing document content'
    },
    completed: {
        label: 'Completed',
        color: 'green' as const,
        icon: CheckCircle,
        description: 'Analysis complete'
    },
    failed: {
        label: 'Failed',
        color: 'red' as const,
        icon: AlertCircle,
        description: 'Processing failed'
    }
};

export function UploadProgress({ requests, onStatusUpdate }: UploadProgressProps) {
    const [refreshing, setRefreshing] = useState(false);
    const [lastRefresh, setLastRefresh] = useState(Date.now());

    // Auto-refresh every 15 seconds for active requests
    useEffect(() => {
        const hasActiveRequests = requests.some(req =>
            req.status === 'submitted' || req.status === 'processing'
        );

        if (!hasActiveRequests) return;

        const interval = setInterval(() => {
            refreshStatus();
        }, 15000);

        return () => clearInterval(interval);
    }, [requests]);

    const refreshStatus = async () => {
        setRefreshing(true);

        try {
            // Check status for each active request
            for (const request of requests) {
                if (request.status === 'submitted' || request.status === 'processing') {
                    const response = await fetch(`/api/upload/status/${request.request_id}`);
                    if (response.ok) {
                        const statusData = await response.json();
                        onStatusUpdate(
                            request.request_id,
                            statusData.status,
                            getProgressForStatus(statusData.status)
                        );
                    }
                }
            }
            setLastRefresh(Date.now());
        } catch (error) {
            console.error('Failed to refresh status:', error);
        } finally {
            setRefreshing(false);
        }
    };

    const getProgressForStatus = (status: string): number => {
        switch (status) {
            case 'upload_pending': return 5;
            case 'submitted': return 15;
            case 'processing': return 60;
            case 'completed': return 100;
            case 'failed': return 0;
            default: return 0;
        }
    };

    const getEstimatedTime = (request: UploadRequest): string => {
        if (request.status === 'completed') return 'Completed';
        if (request.status === 'failed') return 'Failed';

        const submittedTime = new Date(request.submitted_at).getTime();
        const now = Date.now();
        const elapsed = now - submittedTime;

        // Estimate 10-15 minutes total processing time
        const estimatedTotal = 12 * 60 * 1000; // 12 minutes in ms
        const remaining = Math.max(0, estimatedTotal - elapsed);

        if (remaining === 0) return 'Completing soon...';

        const minutes = Math.ceil(remaining / (60 * 1000));
        return `~${minutes} min remaining`;
    };

    const formatTime = (dateString: string): string => {
        return new Date(dateString).toLocaleTimeString();
    };

    const viewDocument = (requestId: string) => {
        window.open(`/portfolio/${requestId}`, '_blank');
    };

    if (requests.length === 0) {
        return null;
    }

    return (
        <Card className="p-6">
            <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-semibold text-neutral-90">
                    Processing Status
                </h2>
                <div className="flex items-center gap-2">
                    <span className="text-xs text-neutral-50">
                        Last updated: {new Date(lastRefresh).toLocaleTimeString()}
                    </span>
                    <Button
                        variant="ghost"
                        size="sm"
                        onClick={refreshStatus}
                        disabled={refreshing}
                    >
                        <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} />
                    </Button>
                </div>
            </div>

            <div className="space-y-4">
                {requests.map((request) => {
                    const config = STATUS_CONFIG[request.status];
                    const IconComponent = config.icon;
                    const progress = request.progress || getProgressForStatus(request.status);

                    return (
                        <div
                            key={request.request_id}
                            className="border border-neutral-20 rounded-lg p-4 bg-neutral-5"
                        >
                            <div className="flex items-start justify-between mb-3">
                                <div className="flex-1 min-w-0">
                                    <div className="flex items-center gap-2 mb-1">
                                        <h3 className="font-medium text-neutral-90 truncate">
                                            {request.company_name}
                                        </h3>
                                        <Badge variant={config.color as BadgeVariant}>
                                            <IconComponent className={`w-3 h-3 mr-1 ${request.status === 'processing' ? 'animate-spin' : ''
                                                }`} />
                                            {config.label}
                                        </Badge>
                                    </div>

                                    <div className="flex items-center gap-2 text-sm text-neutral-60">
                                        <FileText className="w-3 h-3" />
                                        <span className="truncate">{request.filename}</span>
                                    </div>

                                    <p className="text-xs text-neutral-50 mt-1">
                                        {config.description}
                                    </p>
                                </div>

                                <div className="flex items-center gap-2 ml-4">
                                    {request.status === 'completed' && (
                                        <Button
                                            variant="secondary"
                                            size="sm"
                                            onClick={() => viewDocument(request.request_id)}
                                        >
                                            <Eye className="w-3 h-3 mr-1" />
                                            View
                                        </Button>
                                    )}
                                </div>
                            </div>

                            {/* Progress Bar */}
                            <div className="mb-3">
                                <Progress
                                    value={progress}
                                    className="h-2"
                                    variant={request.status === 'failed' ? 'error' : 'default'}
                                />
                            </div>

                            {/* Status Details */}
                            <div className="flex items-center justify-between text-xs text-neutral-50">
                                <div className="flex items-center gap-4">
                                    <span>
                                        Submitted: {formatTime(request.submitted_at)}
                                    </span>
                                    {request.processing_started_at && (
                                        <span>
                                            Started: {formatTime(request.processing_started_at)}
                                        </span>
                                    )}
                                    {request.completed_at && (
                                        <span>
                                            Completed: {formatTime(request.completed_at)}
                                        </span>
                                    )}
                                </div>

                                <span className="font-medium">
                                    {getEstimatedTime(request)}
                                </span>
                            </div>

                            {/* Error Message */}
                            {request.status === 'failed' && request.error_message && (
                                <div className="mt-3 p-3 bg-fluent-error/10 border border-fluent-error/20 rounded-lg">
                                    <div className="flex items-start gap-2">
                                        <AlertCircle className="w-4 h-4 text-fluent-error mt-0.5 flex-shrink-0" />
                                        <div>
                                            <p className="text-sm font-medium text-fluent-error">
                                                Processing Failed
                                            </p>
                                            <p className="text-xs text-neutral-70 mt-1">
                                                {request.error_message}
                                            </p>
                                        </div>
                                    </div>
                                </div>
                            )}

                            {/* Processing Stages (for processing status) */}
                            {request.status === 'processing' && (
                                <div className="mt-3 p-3 bg-fluent-blue/5 border border-fluent-blue/20 rounded-lg">
                                    <div className="flex items-center gap-2 mb-2">
                                        <Loader2 className="w-4 h-4 text-fluent-blue animate-spin" />
                                        <span className="text-sm font-medium text-fluent-blue">
                                            Processing Document
                                        </span>
                                    </div>
                                    <div className="space-y-1 text-xs text-neutral-60">
                                        <div className="flex items-center gap-2">
                                            <div className="w-1 h-1 bg-fluent-success rounded-full"></div>
                                            <span>Document uploaded and validated</span>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <div className="w-1 h-1 bg-fluent-blue rounded-full animate-pulse"></div>
                                            <span>Extracting financial data and company information</span>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <div className="w-1 h-1 bg-neutral-30 rounded-full"></div>
                                            <span>Calculating risk scores and parameters</span>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <div className="w-1 h-1 bg-neutral-30 rounded-full"></div>
                                            <span>Generating analysis report</span>
                                        </div>
                                    </div>
                                </div>
                            )}
                        </div>
                    );
                })}
            </div>

            {/* Summary */}
            <div className="mt-4 pt-4 border-t border-neutral-20">
                <div className="flex items-center justify-between text-sm">
                    <span className="text-neutral-60">
                        {requests.length} document{requests.length !== 1 ? 's' : ''} in progress
                    </span>
                    <div className="flex items-center gap-4">
                        {requests.filter(r => r.status === 'submitted').length > 0 && (
                            <span className="text-neutral-60">
                                {requests.filter(r => r.status === 'submitted').length} queued
                            </span>
                        )}
                        {requests.filter(r => r.status === 'processing').length > 0 && (
                            <span className="text-fluent-blue">
                                {requests.filter(r => r.status === 'processing').length} processing
                            </span>
                        )}
                    </div>
                </div>
            </div>
        </Card>
    );
}