import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { ProcessingStatus } from '@/components/forms/ProcessingStatus';
import { ErrorHandling } from '@/components/forms/ErrorHandling';
import { RetryMechanism } from '@/components/forms/RetryMechanism';
import { NotificationSystem } from '@/components/forms/NotificationSystem';

// Mock fetch globally
global.fetch = jest.fn();

// Mock WebSocket
global.WebSocket = jest.fn().mockImplementation(() => ({
    close: jest.fn(),
    send: jest.fn(),
    addEventListener: jest.fn(),
    removeEventListener: jest.fn(),
    onopen: null,
    onmessage: null,
    onclose: null,
    onerror: null,
}));

// Mock Notification API
Object.defineProperty(window, 'Notification', {
    writable: true,
    value: jest.fn().mockImplementation(() => ({
        close: jest.fn(),
        onclick: null,
    })),
});

Object.defineProperty(Notification, 'permission', {
    writable: true,
    value: 'granted',
});

Object.defineProperty(Notification, 'requestPermission', {
    writable: true,
    value: jest.fn().mockResolvedValue('granted'),
});

describe('Processing Status Monitoring Components', () => {
    beforeEach(() => {
        jest.clearAllMocks();
        (fetch as jest.Mock).mockClear();
    });

    describe('ProcessingStatus', () => {
        const mockStatusResponse = {
            request_id: 'test-request-id',
            company_name: 'Test Company',
            status: 'processing',
            current_stage: 'analysis',
            progress: 60,
            stages: [
                {
                    id: 'validation',
                    name: 'Document Validation',
                    description: 'Validating uploaded document format and content',
                    status: 'completed'
                },
                {
                    id: 'extraction',
                    name: 'Data Extraction',
                    description: 'Extracting financial data and company information',
                    status: 'completed'
                },
                {
                    id: 'analysis',
                    name: 'Risk Analysis',
                    description: 'Calculating risk scores and parameter analysis',
                    status: 'active',
                    progress: 75
                }
            ],
            estimated_completion: new Date(Date.now() + 300000).toISOString(),
            processing_logs: ['Starting analysis...', 'Processing financial data...']
        };

        it('renders processing status correctly', async () => {
            (fetch as jest.Mock).mockResolvedValueOnce({
                ok: true,
                json: async () => mockStatusResponse
            });

            render(<ProcessingStatus requestId="test-request-id" />);

            await waitFor(() => {
                expect(screen.getByText('Test Company')).toBeInTheDocument();
                expect(screen.getByText('Processing Status')).toBeInTheDocument();
                expect(screen.getByText('60%')).toBeInTheDocument();
            });
        });

        it('handles status change callbacks', async () => {
            const onStatusChange = jest.fn();

            (fetch as jest.Mock).mockResolvedValueOnce({
                ok: true,
                json: async () => mockStatusResponse
            });

            render(
                <ProcessingStatus 
                    requestId="test-request-id" 
                    onStatusChange = { onStatusChange }
                />
            );

            await waitFor(() => {
                expect(screen.getByText('Test Company')).toBeInTheDocument();
            });

            // Simulate status update
            const completedResponse = { ...mockStatusResponse, status: 'completed', progress: 100 };
            (fetch as jest.Mock).mockResolvedValueOnce({
                ok: true,
                json: async () => completedResponse
            });

            // Trigger refresh
            const refreshButton = screen.getByRole('button', { name: /refresh/i });
            fireEvent.click(refreshButton);

            await waitFor(() => {
                expect(onStatusChange).toHaveBeenCalledWith('completed', 100);
            });
        });

        it('displays error state correctly', async () => {
            (fetch as jest.Mock).mockRejectedValueOnce(new Error('Network error'));

            render(<ProcessingStatus requestId="test-request-id" />);

            await waitFor(() => {
                expect(screen.getByText(/Failed to load status/)).toBeInTheDocument();
            });
        });

        it('shows processing stages when expanded', async () => {
            (fetch as jest.Mock).mockResolvedValueOnce({
                ok: true,
                json: async () => mockStatusResponse
            });

            render(<ProcessingStatus requestId="test-request-id" />);

            await waitFor(() => {
                expect(screen.getByText('Test Company')).toBeInTheDocument();
            });

            // Should show stages by default (not compact)
            expect(screen.getByText('Processing Stages')).toBeInTheDocument();
            expect(screen.getByText('Document Validation')).toBeInTheDocument();
            expect(screen.getByText('Risk Analysis')).toBeInTheDocument();
        });
    });

    describe('ErrorHandling', () => {
        const mockErrorResponse = {
            id: 'error_123',
            request_id: 'test-request-id',
            company_name: 'Test Company',
            error_type: 'extraction',
            error_code: 'EXTRACTION_FAILED',
            error_message: 'Failed to extract data from document',
            stage: 'extraction',
            timestamp: new Date().toISOString(),
            retry_count: 1,
            max_retries: 3,
            is_retryable: true,
            suggested_actions: [
                'Check document quality and readability',
                'Ensure text is not in image format'
            ]
        };

        it('renders error details correctly', async () => {
            (fetch as jest.Mock).mockResolvedValueOnce({
                ok: true,
                json: async () => mockErrorResponse
            });

            render(<ErrorHandling requestId="test-request-id" />);

            await waitFor(() => {
                expect(screen.getByText('Processing Failed')).toBeInTheDocument();
                expect(screen.getByText('Failed to extract data from document')).toBeInTheDocument();
                expect(screen.getByText('Test Company')).toBeInTheDocument();
            });
        });

        it('shows retry button for retryable errors', async () => {
            (fetch as jest.Mock).mockResolvedValueOnce({
                ok: true,
                json: async () => mockErrorResponse
            });

            render(<ErrorHandling requestId="test-request-id" />);

            await waitFor(() => {
                expect(screen.getByText('Retry Processing')).toBeInTheDocument();
            });
        });

        it('handles retry action', async () => {
            const onRetry = jest.fn();

            (fetch as jest.Mock)
                .mockResolvedValueOnce({
                    ok: true,
                    json: async () => mockErrorResponse
                })
                .mockResolvedValueOnce({
                    ok: true,
                    json: async () => ({ success: true })
                });

            render(<ErrorHandling requestId="test-request-id" onRetry = { onRetry } />);

            await waitFor(() => {
                expect(screen.getByText('Retry Processing')).toBeInTheDocument();
            });

            const retryButton = screen.getByText('Retry Processing');
            fireEvent.click(retryButton);

            await waitFor(() => {
                expect(onRetry).toHaveBeenCalled();
            });
        });

        it('shows suggested actions', async () => {
            (fetch as jest.Mock).mockResolvedValueOnce({
                ok: true,
                json: async () => mockErrorResponse
            });

            render(<ErrorHandling requestId="test-request-id" />);

            await waitFor(() => {
                expect(screen.getByText('Suggested Actions')).toBeInTheDocument();
                expect(screen.getByText('Check document quality and readability')).toBeInTheDocument();
            });
        });
    });

    describe('RetryMechanism', () => {
        const mockRetryState = {
            is_retryable: true,
            current_attempt: 2,
            max_attempts: 4,
            retry_config: {
                max_retries: 3,
                retry_delay: 30,
                backoff_multiplier: 2,
                retry_conditions: ['TEMPORARY_ERROR', 'TIMEOUT_ERROR']
            },
            retry_history: [
                {
                    attempt_number: 1,
                    started_at: new Date().toISOString(),
                    status: 'failed',
                    error_message: 'Network timeout'
                }
            ],
            is_retrying: false,
            can_manual_retry: true,
            estimated_success_rate: 70
        };

        it('renders retry mechanism correctly', async () => {
            (fetch as jest.Mock).mockResolvedValueOnce({
                ok: true,
                json: async () => mockRetryState
            });

            render(<RetryMechanism requestId="test-request-id" />);

            await waitFor(() => {
                expect(screen.getByText('Retry Mechanism')).toBeInTheDocument();
                expect(screen.getByText('Attempt 2 of 4')).toBeInTheDocument();
                expect(screen.getByText('70% success rate')).toBeInTheDocument();
            });
        });

        it('shows manual retry option when available', async () => {
            (fetch as jest.Mock).mockResolvedValueOnce({
                ok: true,
                json: async () => mockRetryState
            });

            render(<RetryMechanism requestId="test-request-id" />);

            await waitFor(() => {
                expect(screen.getByText('Manual Retry Available')).toBeInTheDocument();
                expect(screen.getByText('Retry Now')).toBeInTheDocument();
            });
        });

        it('handles manual retry', async () => {
            const onRetryComplete = jest.fn();

            (fetch as jest.Mock)
                .mockResolvedValueOnce({
                    ok: true,
                    json: async () => mockRetryState
                })
                .mockResolvedValueOnce({
                    ok: true,
                    json: async () => ({ success: true })
                });

            render(<RetryMechanism requestId="test-request-id" onRetryComplete = { onRetryComplete } />);

            await waitFor(() => {
                expect(screen.getByText('Retry Now')).toBeInTheDocument();
            });

            const retryButton = screen.getByText('Retry Now');
            fireEvent.click(retryButton);

            await waitFor(() => {
                expect(onRetryComplete).toHaveBeenCalledWith(true);
            });
        });
    });

    describe('NotificationSystem', () => {
        const mockNotifications = {
            notifications: [
                {
                    id: 'notif-1',
                    type: 'success',
                    title: 'Processing Complete',
                    message: 'Document analysis completed successfully',
                    request_id: 'test-request-id',
                    company_name: 'Test Company',
                    timestamp: new Date().toISOString(),
                    read: false,
                    actions: [
                        { label: 'View Report', action: 'view_report', variant: 'primary' }
                    ]
                }
            ],
            unread_count: 1
        };

        it('renders notifications correctly', async () => {
            (fetch as jest.Mock).mockResolvedValueOnce({
                ok: true,
                json: async () => mockNotifications
            });

            render(<NotificationSystem />);

            await waitFor(() => {
                expect(screen.getByText('Notifications')).toBeInTheDocument();
                expect(screen.getByText('Processing Complete')).toBeInTheDocument();
                expect(screen.getByText('Document analysis completed successfully')).toBeInTheDocument();
            });
        });

        it('shows unread count badge', async () => {
            (fetch as jest.Mock).mockResolvedValueOnce({
                ok: true,
                json: async () => mockNotifications
            });

            render(<NotificationSystem />);

            await waitFor(() => {
                expect(screen.getByText('1')).toBeInTheDocument(); // Unread count badge
            });
        });

        it('handles notification actions', async () => {
            const onNotificationAction = jest.fn();

            (fetch as jest.Mock).mockResolvedValueOnce({
                ok: true,
                json: async () => mockNotifications
            });

            render(<NotificationSystem onNotificationAction={ onNotificationAction } />);

            await waitFor(() => {
                expect(screen.getByText('View Report')).toBeInTheDocument();
            });

            const actionButton = screen.getByText('View Report');
            fireEvent.click(actionButton);

            expect(onNotificationAction).toHaveBeenCalledWith('view_report', 'notif-1');
        });

        it('handles mark all as read', async () => {
            (fetch as jest.Mock)
                .mockResolvedValueOnce({
                    ok: true,
                    json: async () => mockNotifications
                })
                .mockResolvedValueOnce({
                    ok: true,
                    json: async () => ({ success: true })
                });

            render(<NotificationSystem />);

            await waitFor(() => {
                expect(screen.getByText('Mark All Read')).toBeInTheDocument();
            });

            const markAllButton = screen.getByText('Mark All Read');
            fireEvent.click(markAllButton);

            await waitFor(() => {
                expect(fetch).toHaveBeenCalledWith('/api/notifications/read-all', {
                    method: 'PUT'
                });
            });
        });
    });
});