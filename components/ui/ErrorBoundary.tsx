"use client";

import React from "react";
import { AlertTriangle, RefreshCw } from "lucide-react";
import { Button } from "./Button";
import { Card } from "./Card";

interface ErrorBoundaryState {
    hasError: boolean;
    error?: Error;
    errorInfo?: React.ErrorInfo;
}

interface ErrorBoundaryProps {
    children: React.ReactNode;
    fallback?: React.ComponentType<{ error: Error; retry: () => void }>;
    onError?: (error: Error, errorInfo: React.ErrorInfo) => void;
}

export class ErrorBoundary extends React.Component<ErrorBoundaryProps, ErrorBoundaryState> {
    constructor(props: ErrorBoundaryProps) {
        super(props);
        this.state = { hasError: false };
    }

    static getDerivedStateFromError(error: Error): ErrorBoundaryState {
        return {
            hasError: true,
            error
        };
    }

    componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
        this.setState({
            error,
            errorInfo
        });

        // Log error to monitoring service
        if (this.props.onError) {
            this.props.onError(error, errorInfo);
        }

        // Log to console in development
        if (process.env.NODE_ENV === 'development') {
            console.error('ErrorBoundary caught an error:', error, errorInfo);
        }
    }

    handleRetry = () => {
        this.setState({ hasError: false, error: undefined, errorInfo: undefined });
    };

    render() {
        if (this.state.hasError) {
            if (this.props.fallback && this.state.error) {
                return <this.props.fallback error={this.state.error} retry={this.handleRetry} />;
            }

            return (
                <Card className="p-8 text-center max-w-md mx-auto mt-8">
                    <div className="flex flex-col items-center space-y-4">
                        <AlertTriangle className="w-12 h-12 text-error" />
                        <div>
                            <h2 className="text-lg font-semibold text-neutral-90 mb-2">
                                Something went wrong
                            </h2>
                            <p className="text-neutral-60 mb-4">
                                An unexpected error occurred. Please try refreshing the page.
                            </p>
                            {process.env.NODE_ENV === 'development' && this.state.error && (
                                <details className="text-left text-sm text-neutral-70 bg-neutral-10 p-3 rounded border">
                                    <summary className="cursor-pointer font-medium mb-2">
                                        Error Details
                                    </summary>
                                    <pre className="whitespace-pre-wrap text-xs">
                                        {this.state.error.message}
                                        {this.state.errorInfo?.componentStack}
                                    </pre>
                                </details>
                            )}
                        </div>
                        <div className="flex gap-3">
                            <Button
                                variant="primary"
                                onClick={this.handleRetry}
                                leftIcon={<RefreshCw className="w-4 h-4" />}
                            >
                                Try Again
                            </Button>
                            <Button
                                variant="outline"
                                onClick={() => window.location.reload()}
                            >
                                Refresh Page
                            </Button>
                        </div>
                    </div>
                </Card>
            );
        }

        return this.props.children;
    }
}

// Hook version for functional components
export function useErrorHandler() {
    const [error, setError] = React.useState<Error | null>(null);

    const resetError = React.useCallback(() => {
        setError(null);
    }, []);

    const captureError = React.useCallback((error: Error) => {
        setError(error);
    }, []);

    React.useEffect(() => {
        if (error) {
            throw error;
        }
    }, [error]);

    return { captureError, resetError };
}