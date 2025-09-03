"use client";

import { useState, useEffect } from "react";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { Progress } from "@/components/ui/Progress";
import {
    RefreshCw,
    Clock,
    AlertTriangle,
    CheckCircle,
    Settings,
    Play,
    Pause,
    Square,
    Info
} from "lucide-react";

interface RetryConfig {
    max_retries: number;
    retry_delay: number; // seconds
    backoff_multiplier: number;
    retry_conditions: string[];
}

interface RetryAttempt {
    attempt_number: number;
    started_at: string;
    completed_at?: string;
    status: 'running' | 'completed' | 'failed';
    error_message?: string;
    next_retry_at?: string;
}

interface RetryMechanismProps {
    requestId: string;
    onRetryComplete?: (success: boolean) => void;
    onRetryStarted?: () => void;
}

interface RetryState {
    is_retryable: boolean;
    current_attempt: number;
    max_attempts: number;
    retry_config: RetryConfig;
    retry_history: RetryAttempt[];
    next_retry_at?: string;
    is_retrying: boolean;
    can_manual_retry: boolean;
    estimated_success_rate: number;
}

const DEFAULT_RETRY_CONFIG: RetryConfig = {
    max_retries: 3,
    retry_delay: 30,
    backoff_multiplier: 2,
    retry_conditions: [
        'TEMPORARY_ERROR',
        'TIMEOUT_ERROR',
        'RATE_LIMIT_ERROR',
        'NETWORK_ERROR'
    ]
};

export function RetryMechanism({
    requestId,
    onRetryComplete,
    onRetryStarted
}: RetryMechanismProps) {
    const [retryState, setRetryState] = useState<RetryState | null>(null);
    const [loading, setLoading] = useState(true);
    const [manualRetrying, setManualRetrying] = useState(false);
    const [showConfig, setShowConfig] = useState(false);
    const [customConfig, setCustomConfig] = useState<RetryConfig>(DEFAULT_RETRY_CONFIG);
    const [countdown, setCountdown] = useState<number | null>(null);

    useEffect(() => {
        fetchRetryState();
    }, [requestId]);

    useEffect(() => {
        // Countdown timer for next automatic retry
        if (retryState?.next_retry_at && !retryState.is_retrying) {
            const interval = setInterval(() => {
                const now = Date.now();
                const nextRetry = new Date(retryState.next_retry_at!).getTime();
                const remaining = Math.max(0, Math.ceil((nextRetry - now) / 1000));

                setCountdown(remaining);

                if (remaining === 0) {
                    clearInterval(interval);
                    fetchRetryState(); // Refresh state when retry should start
                }
            }, 1000);

            return () => clearInterval(interval);
        }
    }, [retryState?.next_retry_at, retryState?.is_retrying]);

    const fetchRetryState = async () => {
        try {
            setLoading(true);
            const response = await fetch(`/api/portfolio/${requestId}/retry-status`);

            if (response.ok) {
                const data = await response.json();
                setRetryState(data);
            }
        } catch (error) {
            console.error('Failed to fetch retry state:', error);
        } finally {
            setLoading(false);
        }
    };

    const startManualRetry = async () => {
        if (!retryState?.can_manual_retry) return;

        try {
            setManualRetrying(true);
            onRetryStarted?.();

            const response = await fetch(`/api/portfolio/${requestId}/retry`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    manual: true,
                    config: showConfig ? customConfig : undefined
                })
            });

            const result = await response.json();

            if (response.ok) {
                await fetchRetryState();
                onRetryComplete?.(true);
            } else {
                console.error('Manual retry failed:', result.error);
                onRetryComplete?.(false);
            }
        } catch (error) {
            console.error('Failed to start manual retry:', error);
            onRetryComplete?.(false);
        } finally {
            setManualRetrying(false);
        }
    };

    const cancelRetry = async () => {
        try {
            const response = await fetch(`/api/portfolio/${requestId}/retry`, {
                method: 'DELETE'
            });

            if (response.ok) {
                await fetchRetryState();
            }
        } catch (error) {
            console.error('Failed to cancel retry:', error);
        }
    };

    const updateRetryConfig = async () => {
        try {
            const response = await fetch(`/api/portfolio/${requestId}/retry-config`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(customConfig)
            });

            if (response.ok) {
                await fetchRetryState();
                setShowConfig(false);
            }
        } catch (error) {
            console.error('Failed to update retry config:', error);
        }
    };

    const formatCountdown = (seconds: number): string => {
        const minutes = Math.floor(seconds / 60);
        const remainingSeconds = seconds % 60;
        return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
    };

    const getRetryProgress = (): number => {
        if (!retryState) return 0;
        return (retryState.current_attempt / retryState.max_attempts) * 100;
    };

    const getSuccessRateColor = (rate: number): string => {
        if (rate >= 70) return 'text-fluent-success';
        if (rate >= 40) return 'text-fluent-warning';
        return 'text-fluent-error';
    };

    if (loading) {
        return (
            <Card className="p-4">
                <div className="flex items-center gap-2">
                    <RefreshCw className="w-4 h-4 animate-spin" />
                    <span className="text-sm">Loading retry information...</span>
                </div>
            </Card>
        );
    }

    if (!retryState) {
        return null;
    }

    return (
        <div className="space-y-4">
            {/* Main Retry Status */}
            <Card className="p-4">
                <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-2">
                        <RefreshCw className={`w-5 h-5 ${retryState.is_retrying ? 'animate-spin text-fluent-blue' : 'text-neutral-60'}`} />
                        <h3 className="font-medium text-neutral-90">
                            Retry Mechanism
                        </h3>
                    </div>

                    <div className="flex items-center gap-2">
                        <Badge variant={retryState.is_retryable ? "success" : "destructive"}>
                            {retryState.is_retryable ? 'Retryable' : 'Not Retryable'}
                        </Badge>

                        <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => setShowConfig(!showConfig)}
                        >
                            <Settings className="w-3 h-3" />
                        </Button>
                    </div>
                </div>

                {/* Retry Progress */}
                <div className="mb-4">
                    <div className="flex items-center justify-between text-sm mb-2">
                        <span className="text-neutral-70">
                            Attempt {retryState.current_attempt} of {retryState.max_attempts}
                        </span>
                        <span className={`font-medium ${getSuccessRateColor(retryState.estimated_success_rate)}`}>
                            {retryState.estimated_success_rate}% success rate
                        </span>
                    </div>
                    <Progress value={getRetryProgress()} className="h-2" />
                </div>

                {/* Current Status */}
                <div className="space-y-3">
                    {retryState.is_retrying && (
                        <div className="flex items-center gap-2 p-3 bg-fluent-blue/10 border border-fluent-blue/20 rounded-lg">
                            <RefreshCw className="w-4 h-4 text-fluent-blue animate-spin" />
                            <div className="flex-1">
                                <p className="text-sm font-medium text-fluent-blue">
                                    Retry in Progress
                                </p>
                                <p className="text-xs text-neutral-60">
                                    Attempt #{retryState.current_attempt} is currently running
                                </p>
                            </div>
                            <Button
                                variant="secondary"
                                size="sm"
                                onClick={cancelRetry}
                            >
                                <Square className="w-3 h-3 mr-1" />
                                Cancel
                            </Button>
                        </div>
                    )}

                    {!retryState.is_retrying && retryState.next_retry_at && countdown !== null && countdown > 0 && (
                        <div className="flex items-center gap-2 p-3 bg-fluent-warning/10 border border-fluent-warning/20 rounded-lg">
                            <Clock className="w-4 h-4 text-fluent-warning" />
                            <div className="flex-1">
                                <p className="text-sm font-medium text-fluent-warning">
                                    Next Retry Scheduled
                                </p>
                                <p className="text-xs text-neutral-60">
                                    Automatic retry in {formatCountdown(countdown)}
                                </p>
                            </div>
                            <Button
                                variant="secondary"
                                size="sm"
                                onClick={cancelRetry}
                            >
                                <Pause className="w-3 h-3 mr-1" />
                                Cancel
                            </Button>
                        </div>
                    )}

                    {retryState.can_manual_retry && !retryState.is_retrying && (
                        <div className="flex items-center gap-2 p-3 bg-neutral-10 border border-neutral-20 rounded-lg">
                            <Info className="w-4 h-4 text-neutral-60" />
                            <div className="flex-1">
                                <p className="text-sm font-medium text-neutral-90">
                                    Manual Retry Available
                                </p>
                                <p className="text-xs text-neutral-60">
                                    You can manually trigger a retry attempt
                                </p>
                            </div>
                            <Button
                                variant="primary"
                                size="sm"
                                onClick={startManualRetry}
                                disabled={manualRetrying}
                            >
                                {manualRetrying ? (
                                    <RefreshCw className="w-3 h-3 mr-1 animate-spin" />
                                ) : (
                                    <Play className="w-3 h-3 mr-1" />
                                )}
                                Retry Now
                            </Button>
                        </div>
                    )}

                    {!retryState.is_retryable && (
                        <div className="flex items-center gap-2 p-3 bg-fluent-error/10 border border-fluent-error/20 rounded-lg">
                            <AlertTriangle className="w-4 h-4 text-fluent-error" />
                            <div>
                                <p className="text-sm font-medium text-fluent-error">
                                    Retry Not Available
                                </p>
                                <p className="text-xs text-neutral-60">
                                    Maximum retry attempts reached or error is not retryable
                                </p>
                            </div>
                        </div>
                    )}
                </div>
            </Card>

            {/* Retry Configuration */}
            {showConfig && (
                <Card className="p-4">
                    <h4 className="font-medium text-neutral-90 mb-4">
                        Retry Configuration
                    </h4>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                        <div>
                            <label className="block text-sm font-medium text-neutral-70 mb-1">
                                Max Retries
                            </label>
                            <input
                                type="number"
                                min="1"
                                max="10"
                                value={customConfig.max_retries}
                                onChange={(e) => setCustomConfig(prev => ({
                                    ...prev,
                                    max_retries: parseInt(e.target.value) || 1
                                }))}
                                className="w-full px-3 py-2 border border-neutral-30 rounded-lg text-sm"
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-neutral-70 mb-1">
                                Retry Delay (seconds)
                            </label>
                            <input
                                type="number"
                                min="10"
                                max="3600"
                                value={customConfig.retry_delay}
                                onChange={(e) => setCustomConfig(prev => ({
                                    ...prev,
                                    retry_delay: parseInt(e.target.value) || 30
                                }))}
                                className="w-full px-3 py-2 border border-neutral-30 rounded-lg text-sm"
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-neutral-70 mb-1">
                                Backoff Multiplier
                            </label>
                            <input
                                type="number"
                                min="1"
                                max="5"
                                step="0.1"
                                value={customConfig.backoff_multiplier}
                                onChange={(e) => setCustomConfig(prev => ({
                                    ...prev,
                                    backoff_multiplier: parseFloat(e.target.value) || 2
                                }))}
                                className="w-full px-3 py-2 border border-neutral-30 rounded-lg text-sm"
                            />
                        </div>
                    </div>

                    <div className="flex items-center gap-2">
                        <Button
                            variant="primary"
                            size="sm"
                            onClick={updateRetryConfig}
                        >
                            Update Configuration
                        </Button>
                        <Button
                            variant="secondary"
                            size="sm"
                            onClick={() => {
                                setCustomConfig(retryState.retry_config);
                                setShowConfig(false);
                            }}
                        >
                            Cancel
                        </Button>
                    </div>
                </Card>
            )}

            {/* Retry History */}
            {retryState.retry_history.length > 0 && (
                <Card className="p-4">
                    <h4 className="font-medium text-neutral-90 mb-4">
                        Retry History
                    </h4>

                    <div className="space-y-3">
                        {retryState.retry_history.map((attempt) => (
                            <div
                                key={attempt.attempt_number}
                                className="flex items-center gap-3 p-3 border border-neutral-20 rounded-lg"
                            >
                                <div className="flex-shrink-0">
                                    {attempt.status === 'completed' && (
                                        <CheckCircle className="w-4 h-4 text-fluent-success" />
                                    )}
                                    {attempt.status === 'failed' && (
                                        <AlertTriangle className="w-4 h-4 text-fluent-error" />
                                    )}
                                    {attempt.status === 'running' && (
                                        <RefreshCw className="w-4 h-4 text-fluent-blue animate-spin" />
                                    )}
                                </div>

                                <div className="flex-1 min-w-0">
                                    <div className="flex items-center gap-2 mb-1">
                                        <span className="text-sm font-medium text-neutral-90">
                                            Attempt #{attempt.attempt_number}
                                        </span>
                                        <Badge
                                            variant={
                                                attempt.status === 'completed' ? "success" :
                                                    attempt.status === 'failed' ? "destructive" : "warning"
                                            }
                                        >
                                            {attempt.status}
                                        </Badge>
                                    </div>

                                    <div className="text-xs text-neutral-60">
                                        Started: {new Date(attempt.started_at).toLocaleString()}
                                        {attempt.completed_at && (
                                            <span className="ml-2">
                                                • Completed: {new Date(attempt.completed_at).toLocaleString()}
                                            </span>
                                        )}
                                    </div>

                                    {attempt.error_message && (
                                        <p className="text-xs text-fluent-error mt-1">
                                            {attempt.error_message}
                                        </p>
                                    )}
                                </div>
                            </div>
                        ))}
                    </div>
                </Card>
            )}
        </div>
    );
}