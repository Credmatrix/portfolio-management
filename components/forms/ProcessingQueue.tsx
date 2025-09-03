"use client";

import { useState, useEffect } from "react";
import { Card } from "@/components/ui/Card";
import { Badge, BadgeVariant } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";
import {
    Clock,
    CheckCircle,
    AlertCircle,
    RefreshCw,
    FileText,
    Loader2,
    Eye,
    RotateCcw,
    Trash2,
    Search
} from "lucide-react";

interface ProcessingRequest {
    id: string;
    request_id: string;
    company_name: string;
    original_filename: string;
    file_size: number;
    industry: string;
    model_type: string;
    status: 'upload_pending' | 'submitted' | 'processing' | 'completed' | 'failed';
    submitted_at: string;
    processing_started_at?: string;
    completed_at?: string;
    error_message?: string;
    retry_count: number;
    risk_score?: number;
    risk_grade?: string;
    recommended_limit?: number;
}

interface ProcessingQueueProps {
    refreshTrigger: number;
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
        description: 'Currently being processed'
    },
    completed: {
        label: 'Completed',
        color: 'green' as const,
        icon: CheckCircle,
        description: 'Processing completed successfully'
    },
    failed: {
        label: 'Failed',
        color: 'red' as const,
        icon: AlertCircle,
        description: 'Processing failed'
    }
};

export function ProcessingQueue({ refreshTrigger, onStatusUpdate }: ProcessingQueueProps) {
    const [requests, setRequests] = useState<ProcessingRequest[]>([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [searchQuery, setSearchQuery] = useState("");
    const [statusFilter, setStatusFilter] = useState("all");
    const [retryingIds, setRetryingIds] = useState<Set<string>>(new Set());
    const [deletingIds, setDeletingIds] = useState<Set<string>>(new Set());

    useEffect(() => {
        fetchRequests();
    }, [refreshTrigger]);

    // Auto-refresh every 20 seconds
    // useEffect(() => {
    //     const interval = setInterval(() => {
    //         if (!refreshing) {
    //             refreshRequests();
    //         }
    //     }, 20000);

    //     return () => clearInterval(interval);
    // }, [refreshing]);

    const fetchRequests = async () => {
        try {
            setLoading(true);
            const response = await fetch('/api/upload/requests?limit=50');
            if (response.ok) {
                const data = await response.json();
                setRequests(data.data || []);
            }
        } catch (error) {
            console.error('Failed to fetch processing queue:', error);
        } finally {
            setLoading(false);
        }
    };

    const refreshRequests = async () => {
        try {
            setRefreshing(true);
            const response = await fetch('/api/upload/requests?limit=50');
            if (response.ok) {
                const data = await response.json();
                setRequests(data.data || []);
            }
        } catch (error) {
            console.error('Failed to refresh processing queue:', error);
        } finally {
            setRefreshing(false);
        }
    };

    const retryProcessing = async (requestId: string) => {
        try {
            setRetryingIds(prev => new Set(prev).add(requestId));

            const response = await fetch(`/api/upload/retry/${requestId}`, {
                method: 'POST'
            });

            if (response.ok) {
                onStatusUpdate(requestId, 'submitted');
                // Update the local state immediately
                setRequests(prev => prev.map(req =>
                    req.request_id === requestId
                        ? { ...req, status: 'submitted', error_message: undefined }
                        : req
                ));

                // Refresh the full list after a short delay
                setTimeout(() => refreshRequests(), 2000);
            } else {
                const error = await response.json();
                console.error('Retry failed:', error);
            }
        } catch (error) {
            console.error('Failed to retry processing:', error);
        } finally {
            setRetryingIds(prev => {
                const newSet = new Set(prev);
                newSet.delete(requestId);
                return newSet;
            });
        }
    };

    const deleteRequest = async (requestId: string) => {
        if (!confirm('Are you sure you want to delete this processing request?')) {
            return;
        }

        try {
            setDeletingIds(prev => new Set(prev).add(requestId));

            const response = await fetch(`/api/upload/delete/${requestId}`, {
                method: 'DELETE'
            });

            if (response.ok) {
                setRequests(prev => prev.filter(req => req.request_id !== requestId));
            } else {
                const error = await response.json();
                console.error('Delete failed:', error);
            }
        } catch (error) {
            console.error('Failed to delete request:', error);
        } finally {
            setDeletingIds(prev => {
                const newSet = new Set(prev);
                newSet.delete(requestId);
                return newSet;
            });
        }
    };

    const viewDocument = (requestId: string) => {
        window.open(`/portfolio/${requestId}`, '_blank');
    };

    const formatFileSize = (bytes: number): string => {
        const mb = bytes / (1024 * 1024);
        return `${mb.toFixed(1)} MB`;
    };

    const formatDuration = (startTime: string, endTime?: string): string => {
        const start = new Date(startTime).getTime();
        const end = endTime ? new Date(endTime).getTime() : Date.now();
        const duration = end - start;

        const minutes = Math.floor(duration / (60 * 1000));
        const seconds = Math.floor((duration % (60 * 1000)) / 1000);

        if (minutes > 0) {
            return `${minutes}m ${seconds}s`;
        }
        return `${seconds}s`;
    };

    const getQueuePosition = (request: ProcessingRequest): number | null => {
        if (request.status !== 'submitted') return null;

        const queuedRequests = requests
            .filter(r => r.status === 'submitted')
            .sort((a, b) => new Date(a.submitted_at).getTime() - new Date(b.submitted_at).getTime());

        return queuedRequests.findIndex(r => r.request_id === request.request_id) + 1;
    };

    // Filter requests based on search and status
    const filteredRequests = requests.filter(request => {
        const matchesSearch = searchQuery === "" ||
            request.company_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
            request.original_filename.toLowerCase().includes(searchQuery.toLowerCase()) ||
            request.request_id.toLowerCase().includes(searchQuery.toLowerCase());

        const matchesStatus = statusFilter === "all" || request.status === statusFilter;

        return matchesSearch && matchesStatus;
    });

    // Group requests by status
    const groupedRequests = {
        processing: filteredRequests.filter(r => r.status === 'processing'),
        submitted: filteredRequests.filter(r => r.status === 'submitted'),
        upload_pending: filteredRequests.filter(r => r.status === 'upload_pending'),
        completed: filteredRequests.filter(r => r.status === 'completed'),
        failed: filteredRequests.filter(r => r.status === 'failed')
    };

    if (loading) {
        return (
            <Card className="p-6">
                <div className="flex items-center justify-center py-8">
                    <Loader2 className="w-6 h-6 animate-spin text-neutral-50" />
                    <span className="ml-2 text-neutral-60">Loading processing queue...</span>
                </div>
            </Card>
        );
    }

    return (
        <div className="space-y-6">
            {/* Header and Controls */}
            <Card className="p-6">
                <div className="flex items-center justify-between mb-4">
                    <h2 className="text-lg font-semibold text-neutral-90">
                        Processing Queue
                    </h2>
                    <Button
                        variant="secondary"
                        onClick={refreshRequests}
                        disabled={refreshing}
                    >
                        <RefreshCw className={`w-4 h-4 mr-2 ${refreshing ? 'animate-spin' : ''}`} />
                        Refresh
                    </Button>
                </div>

                {/* Filters */}
                <div className="flex items-center gap-4 mb-4">
                    <div className="flex-1">
                        <Input
                            placeholder="Search by company name, filename, or request ID..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="w-full"
                            leftIcon={<Search className="w-4 h-4" />}
                        />
                    </div>
                    <Select
                        value={statusFilter}
                        onChange={(e) => setStatusFilter(e.target.value)}
                        className="w-48"
                    >
                        <option value="all">All Status</option>
                        <option value="upload_pending">Upload Pending</option>
                        <option value="submitted">Queued</option>
                        <option value="processing">Processing</option>
                        <option value="completed">Completed</option>
                        <option value="failed">Failed</option>
                    </Select>
                </div>

                {/* Summary Stats */}
                <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                    <div className="text-center p-3 bg-gray-100 rounded-lg">
                        <div className="text-lg font-semibold text-gray-600">
                            {groupedRequests.upload_pending.length}
                        </div>
                        <div className="text-xs text-neutral-60">Upload Pending</div>
                    </div>
                    <div className="text-center p-3 bg-fluent-blue/10 rounded-lg">
                        <div className="text-lg font-semibold text-fluent-blue">
                            {groupedRequests.submitted.length}
                        </div>
                        <div className="text-xs text-neutral-60">Queued</div>
                    </div>
                    <div className="text-center p-3 bg-fluent-warning/10 rounded-lg">
                        <div className="text-lg font-semibold text-fluent-warning">
                            {groupedRequests.processing.length}
                        </div>
                        <div className="text-xs text-neutral-60">Processing</div>
                    </div>
                    <div className="text-center p-3 bg-fluent-success/10 rounded-lg">
                        <div className="text-lg font-semibold text-fluent-success">
                            {groupedRequests.completed.length}
                        </div>
                        <div className="text-xs text-neutral-60">Completed</div>
                    </div>
                    <div className="text-center p-3 bg-fluent-error/10 rounded-lg">
                        <div className="text-lg font-semibold text-fluent-error">
                            {groupedRequests.failed.length}
                        </div>
                        <div className="text-xs text-neutral-60">Failed</div>
                    </div>
                </div>
            </Card>

            {/* Request List */}
            <Card className="p-6">
                {filteredRequests.length === 0 ? (
                    <div className="text-center py-8">
                        <FileText className="w-12 h-12 text-neutral-30 mx-auto mb-4" />
                        <p className="text-neutral-60">
                            {requests.length === 0 ? 'No processing requests found' : 'No requests match your filters'}
                        </p>
                    </div>
                ) : (
                    <div className="space-y-4">
                        {filteredRequests.map((request) => {
                            const config = STATUS_CONFIG[request.status];
                            const IconComponent = config.icon;
                            const queuePosition = getQueuePosition(request);
                            const isRetrying = retryingIds.has(request.request_id);
                            const isDeleting = deletingIds.has(request.request_id);

                            return (
                                <div
                                    key={request.request_id}
                                    className="border border-neutral-20 rounded-lg p-4 hover:bg-neutral-5 transition-colors"
                                >
                                    <div className="flex items-start justify-between">
                                        <div className="flex-1 min-w-0">
                                            <div className="flex items-center gap-2 mb-2">
                                                <h3 className="font-medium text-neutral-90 truncate">
                                                    {request.company_name || 'Unnamed Company'}
                                                </h3>
                                                <Badge variant={config.color as BadgeVariant}>
                                                    <IconComponent className={`w-3 h-3 mr-1 ${request.status === 'processing' ? 'animate-spin' : ''
                                                        }`} />
                                                    {config.label}
                                                </Badge>
                                                {queuePosition && (
                                                    <Badge variant="outline">
                                                        #{queuePosition} in queue
                                                    </Badge>
                                                )}
                                                {request.retry_count > 0 && (
                                                    <Badge variant="warning">
                                                        Retry #{request.retry_count}
                                                    </Badge>
                                                )}
                                            </div>

                                            <div className="grid grid-cols-1 md:grid-cols-3 gap-2 text-sm text-neutral-60 mb-2">
                                                <div className="flex items-center gap-1">
                                                    <FileText className="w-3 h-3" />
                                                    <span className="truncate">{request.original_filename}</span>
                                                </div>
                                                <div>
                                                    Size: {formatFileSize(request.file_size)}
                                                </div>
                                                <div className="capitalize">
                                                    Industry: {request.industry.replace('_', ' ').toUpperCase()}
                                                </div>
                                            </div>

                                            <div className="flex items-center gap-4 text-xs text-neutral-50">
                                                <span>
                                                    Submitted: {new Date(request.submitted_at).toLocaleString()}
                                                </span>
                                                {request.processing_started_at && (
                                                    <span>
                                                        Duration: {formatDuration(request.processing_started_at, request.completed_at)}
                                                    </span>
                                                )}
                                                <span>ID: {request.request_id}</span>
                                            </div>

                                            {request.status === 'completed' && request.risk_score !== undefined && (
                                                <div className="mt-2 p-2 bg-fluent-success/10 border border-fluent-success/20 rounded text-xs">
                                                    <span className="text-fluent-success font-medium">Analysis Complete: </span>
                                                    <span className="text-neutral-70">
                                                        Risk Score: {request.risk_score}% |
                                                        Grade: {request.risk_grade} |
                                                        Limit: ₹{request.recommended_limit ? (request.recommended_limit).toFixed(2) : '0'}Cr
                                                    </span>
                                                </div>
                                            )}

                                            {request.error_message && (
                                                <div className="mt-2 p-2 bg-fluent-error/10 border border-fluent-error/20 rounded text-xs">
                                                    <span className="text-fluent-error font-medium">Error: </span>
                                                    <span className="text-neutral-70">{request.error_message}</span>
                                                </div>
                                            )}
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

                                            {request.status === 'failed' && (
                                                <Button
                                                    variant="secondary"
                                                    size="sm"
                                                    onClick={() => retryProcessing(request.request_id)}
                                                    disabled={isRetrying}
                                                >
                                                    {isRetrying ? (
                                                        <Loader2 className="w-3 h-3 mr-1 animate-spin" />
                                                    ) : (
                                                        <RotateCcw className="w-3 h-3 mr-1" />
                                                    )}
                                                    Retry
                                                </Button>
                                            )}

                                            {(request.status === 'failed' || request.status === 'completed') && (
                                                <Button
                                                    variant="ghost"
                                                    size="sm"
                                                    onClick={() => deleteRequest(request.request_id)}
                                                    disabled={isDeleting}
                                                    className="text-fluent-error hover:text-fluent-error"
                                                >
                                                    {isDeleting ? (
                                                        <Loader2 className="w-3 h-3 animate-spin" />
                                                    ) : (
                                                        <Trash2 className="w-3 h-3" />
                                                    )}
                                                </Button>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                )}
            </Card>
        </div>
    );
}