"use client";

import { useState, useEffect, useRef } from "react";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Progress } from "@/components/ui/Progress";
import {
    Clock,
    CheckCircle,
    AlertCircle,
    Loader2,
    RefreshCw,
    Bell,
    BellOff,
    Maximize2,
    Minimize2,
    Activity
} from "lucide-react";

interface ProcessingStatusProps {
    requestId: string;
    onStatusChange?: (status: string, progress?: number) => void;
    compact?: boolean;
}

interface ProcessingStage {
    id: string;
    name: string;
    description: string;
    status: 'pending' | 'active' | 'completed' | 'error';
    progress?: number;
    startTime?: string;
    endTime?: string;
    error?: string;
}

interface ProcessingData {
    request_id: string;
    company_name: string;
    status: 'submitted' | 'processing' | 'completed' | 'failed';
    current_stage?: string;
    progress: number;
    stages: ProcessingStage[];
    estimated_completion?: string;
    error_message?: string;
    processing_logs?: string[];
}

const DEFAULT_STAGES: ProcessingStage[] = [
    {
        id: 'validation',
        name: 'Document Validation',
        description: 'Validating uploaded document format and content',
        status: 'pending'
    },
    {
        id: 'extraction',
        name: 'Data Extraction',
        description: 'Extracting financial data and company information',
        status: 'pending'
    },
    {
        id: 'analysis',
        name: 'Risk Analysis',
        description: 'Calculating risk scores and parameter analysis',
        status: 'pending'
    },
    {
        id: 'benchmarking',
        name: 'Peer Benchmarking',
        description: 'Comparing against industry peers and standards',
        status: 'pending'
    },
    {
        id: 'reporting',
        name: 'Report Generation',
        description: 'Generating comprehensive analysis report',
        status: 'pending'
    }
];

export function ProcessingStatus({
    requestId,
    onStatusChange,
    compact = false
}: ProcessingStatusProps) {
    const [data, setData] = useState<ProcessingData | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [isExpanded, setIsExpanded] = useState(!compact);
    const [notificationsEnabled, setNotificationsEnabled] = useState(false);
    const [lastUpdate, setLastUpdate] = useState<Date>(new Date());
    const intervalRef = useRef<NodeJS.Timeout | null>(null);
    const wsRef = useRef<WebSocket | null>(null);

    useEffect(() => {
        fetchStatus();

        // Set up real-time updates
        if (data?.status === 'processing' || data?.status === 'submitted') {
            setupRealTimeUpdates();
        }

        return () => {
            cleanup();
        };
    }, [requestId]);

    useEffect(() => {
        // Request notification permission
        if ('Notification' in window && Notification.permission === 'default') {
            Notification.requestPermission().then(permission => {
                setNotificationsEnabled(permission === 'granted');
            });
        } else {
            setNotificationsEnabled(Notification.permission === 'granted');
        }
    }, []);

    const cleanup = () => {
        if (intervalRef.current) {
            clearInterval(intervalRef.current);
        }
        if (wsRef.current) {
            wsRef.current.close();
        }
    };

    const fetchStatus = async () => {
        try {
            setLoading(true);
            const response = await fetch(`/api/portfolio/${requestId}/status`);

            if (!response.ok) {
                throw new Error('Failed to fetch processing status');
            }

            const result = await response.json();
            updateData(result);
            setError(null);
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Unknown error');
        } finally {
            setLoading(false);
        }
    };

    const setupRealTimeUpdates = () => {
        // WebSocket connection for real-time updates
        try {
            const wsUrl = `${window.location.protocol === 'https:' ? 'wss:' : 'ws:'}//${window.location.host}/api/ws/processing/${requestId}`;
            wsRef.current = new WebSocket(wsUrl);

            wsRef.current.onmessage = (event) => {
                const update = JSON.parse(event.data);
                updateData(update);
            };

            wsRef.current.onerror = () => {
                // Fallback to polling if WebSocket fails
                setupPolling();
            };
        } catch {
            // Fallback to polling if WebSocket is not available
            setupPolling();
        }
    };

    const setupPolling = () => {
        intervalRef.current = setInterval(() => {
            if (data?.status === 'processing' || data?.status === 'submitted') {
                fetchStatus();
            }
        }, 5000); // Poll every 5 seconds
    };

    const updateData = (newData: any) => {
        const processedData: ProcessingData = {
            request_id: newData.request_id || requestId,
            company_name: newData.company_name || 'Unknown Company',
            status: newData.status || 'submitted',
            current_stage: newData.current_stage,
            progress: newData.progress || 0,
            stages: newData.stages || DEFAULT_STAGES,
            estimated_completion: newData.estimated_completion,
            error_message: newData.error_message,
            processing_logs: newData.processing_logs || []
        };

        // Check for status changes
        if (data && data.status !== processedData.status) {
            onStatusChange?.(processedData.status, processedData.progress);

            // Send notification for completion or failure
            if (notificationsEnabled && (processedData.status === 'completed' || processedData.status === 'failed')) {
                showNotification(processedData);
            }
        }

        setData(processedData);
        setLastUpdate(new Date());

        // Stop real-time updates if processing is complete
        if (processedData.status === 'completed' || processedData.status === 'failed') {
            cleanup();
        }
    };

    const showNotification = (data: ProcessingData) => {
        if (!notificationsEnabled) return;

        const title = data.status === 'completed'
            ? 'Document Processing Complete'
            : 'Document Processing Failed';

        const body = data.status === 'completed'
            ? `${data.company_name} analysis is ready for review`
            : `Processing failed for ${data.company_name}: ${data.error_message}`;

        new Notification(title, {
            body,
            icon: '/favicon.ico',
            tag: `processing-${data.request_id}`
        });
    };

    const getStageIcon = (stage: ProcessingStage) => {
        switch (stage.status) {
            case 'completed':
                return <CheckCircle className="w-4 h-4 text-fluent-success" />;
            case 'active':
                return <Loader2 className="w-4 h-4 text-fluent-blue animate-spin" />;
            case 'error':
                return <AlertCircle className="w-4 h-4 text-fluent-error" />;
            default:
                return <Clock className="w-4 h-4 text-neutral-40" />;
        }
    };

    const getStatusColor = (status: string) => {
        switch (status) {
            case 'completed': return 'green';
            case 'failed': return 'red';
            case 'processing': return 'yellow';
            default: return 'blue';
        }
    };

    const formatTime = (dateString?: string) => {
        if (!dateString) return '';
        return new Date(dateString).toLocaleTimeString();
    };

    const calculateStageDuration = (stage: ProcessingStage) => {
        if (!stage.startTime) return '';
        const end = stage.endTime ? new Date(stage.endTime) : new Date();
        const start = new Date(stage.startTime);
        const duration = end.getTime() - start.getTime();
        const seconds = Math.floor(duration / 1000);
        return `${seconds}s`;
    };

    if (loading && !data) {
        return (
            <Card className="p-4">
                <div className="flex items-center gap-2">
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span className="text-sm">Loading processing status...</span>
                </div>
            </Card>
        );
    }

    if (error) {
        return (
            <Card className="p-4 border-fluent-error/20 bg-fluent-error/5">
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                        <AlertCircle className="w-4 h-4 text-fluent-error" />
                        <span className="text-sm text-fluent-error">Failed to load status: {error}</span>
                    </div>
                    <Button variant="ghost" size="sm" onClick={fetchStatus}>
                        <RefreshCw className="w-3 h-3" />
                    </Button>
                </div>
            </Card>
        );
    }

    if (!data) return null;

    return (
        <Card className="overflow-hidden">
            {/* Header */}
            <div className="p-4 border-b border-neutral-20">
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <Activity className="w-5 h-5 text-fluent-blue" />
                        <div>
                            <h3 className="font-medium text-neutral-90">
                                {data.company_name}
                            </h3>
                            <p className="text-xs text-neutral-60">
                                Processing Status • Last updated: {lastUpdate.toLocaleTimeString()}
                            </p>
                        </div>
                    </div>

                    <div className="flex items-center gap-2">
                        <Badge variant={getStatusColor(data.status) as any}>
                            {data.status.charAt(0).toUpperCase() + data.status.slice(1)}
                        </Badge>

                        <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => setNotificationsEnabled(!notificationsEnabled)}
                            title={notificationsEnabled ? 'Disable notifications' : 'Enable notifications'}
                        >
                            {notificationsEnabled ? (
                                <Bell className="w-3 h-3" />
                            ) : (
                                <BellOff className="w-3 h-3" />
                            )}
                        </Button>

                        <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => setIsExpanded(!isExpanded)}
                        >
                            {isExpanded ? (
                                <Minimize2 className="w-3 h-3" />
                            ) : (
                                <Maximize2 className="w-3 h-3" />
                            )}
                        </Button>

                        <Button variant="ghost" size="sm" onClick={fetchStatus}>
                            <RefreshCw className="w-3 h-3" />
                        </Button>
                    </div>
                </div>

                {/* Overall Progress */}
                <div className="mt-3">
                    <div className="flex items-center justify-between text-sm mb-1">
                        <span className="text-neutral-70">Overall Progress</span>
                        <span className="font-medium">{data.progress}%</span>
                    </div>
                    <Progress
                        value={data.progress}
                        className="h-2"
                        variant={data.status === 'failed' ? 'error' : 'default'}
                    />
                    {data.estimated_completion && data.status === 'processing' && (
                        <p className="text-xs text-neutral-50 mt-1">
                            Estimated completion: {new Date(data.estimated_completion).toLocaleTimeString()}
                        </p>
                    )}
                </div>
            </div>

            {/* Detailed Stages */}
            {isExpanded && (
                <div className="p-4">
                    <h4 className="text-sm font-medium text-neutral-70 mb-3">
                        Processing Stages
                    </h4>

                    <div className="space-y-3">
                        {data.stages.map((stage, index) => (
                            <div key={stage.id} className="flex items-start gap-3">
                                <div className="flex-shrink-0 mt-0.5">
                                    {getStageIcon(stage)}
                                </div>

                                <div className="flex-1 min-w-0">
                                    <div className="flex items-center justify-between">
                                        <h5 className="text-sm font-medium text-neutral-90">
                                            {stage.name}
                                        </h5>
                                        <div className="flex items-center gap-2 text-xs text-neutral-50">
                                            {stage.startTime && (
                                                <span>Started: {formatTime(stage.startTime)}</span>
                                            )}
                                            {stage.endTime && (
                                                <span>Duration: {calculateStageDuration(stage)}</span>
                                            )}
                                        </div>
                                    </div>

                                    <p className="text-xs text-neutral-60 mt-1">
                                        {stage.description}
                                    </p>

                                    {stage.status === 'active' && stage.progress !== undefined && (
                                        <Progress value={stage.progress} className="h-1 mt-2" />
                                    )}

                                    {stage.status === 'error' && stage.error && (
                                        <div className="mt-2 p-2 bg-fluent-error/10 border border-fluent-error/20 rounded text-xs">
                                            <span className="text-fluent-error">{stage.error}</span>
                                        </div>
                                    )}
                                </div>
                            </div>
                        ))}
                    </div>

                    {/* Processing Logs */}
                    {data.processing_logs && data.processing_logs.length > 0 && (
                        <div className="mt-4 pt-4 border-t border-neutral-20">
                            <h4 className="text-sm font-medium text-neutral-70 mb-2">
                                Processing Log
                            </h4>
                            <div className="bg-neutral-10 rounded p-3 max-h-32 overflow-y-auto">
                                <div className="space-y-1 text-xs font-mono">
                                    {data.processing_logs.map((log, index) => (
                                        <div key={index} className="text-neutral-70">
                                            {log}
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Error Details */}
                    {data.status === 'failed' && data.error_message && (
                        <div className="mt-4 p-3 bg-fluent-error/10 border border-fluent-error/20 rounded">
                            <div className="flex items-start gap-2">
                                <AlertCircle className="w-4 h-4 text-fluent-error mt-0.5 flex-shrink-0" />
                                <div>
                                    <h4 className="text-sm font-medium text-fluent-error">
                                        Processing Failed
                                    </h4>
                                    <p className="text-xs text-neutral-70 mt-1">
                                        {data.error_message}
                                    </p>
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            )}
        </Card>
    );
}