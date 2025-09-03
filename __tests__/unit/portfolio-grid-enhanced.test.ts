import { describe, it, expect, jest, beforeEach } from '@jest/globals';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useRouter } from 'next/navigation';
import { PortfolioGrid } from '@/components/portfolio/PortfolioGrid';

// Mock Next.js router
jest.mock('next/navigation', () => ({
    useRouter: jest.fn(),
}));

// Mock fetch
global.fetch = jest.fn();

const mockRouter = {
    push: jest.fn(),
    replace: jest.fn(),
    prefetch: jest.fn(),
};

const mockPortfolioData = {
    companies: [
        {
            id: '1',
            request_id: 'req-1',
            company_name: 'Test Company A',
            industry: 'Manufacturing',
            risk_score: 85,
            risk_grade: 'CM2',
            recommended_limit: 1000000,
            status: 'completed',
            completed_at: '2024-01-15T10:00:00Z',
            total_parameters: 45,
            available_parameters: 42,
        },
        {
            id: '2',
            request_id: 'req-2',
            company_name: 'Test Company B',
            industry: 'Technology',
            risk_score: 92,
            risk_grade: 'CM1',
            recommended_limit: 2000000,
            status: 'completed',
            completed_at: '2024-01-16T10:00:00Z',
            total_parameters: 50,
            available_parameters: 48,
        },
    ],
    total_count: 2,
    page: 1,
    limit: 20,
    has_next: false,
    has_previous: false,
};

describe('PortfolioGrid Enhanced Sorting and Pagination', () => {
    let queryClient: QueryClient;

    beforeEach(() => {
        queryClient = new QueryClient({
            defaultOptions: {
                queries: {
                    retry: false,
                },
            },
        });
        (useRouter as jest.Mock).mockReturnValue(mockRouter);
        (fetch as jest.Mock).mockResolvedValue({
            ok: true,
            json: async () => mockPortfolioData,
        });
    });

    const renderWithQueryClient = (component: React.ReactElement) => {
        return render(
            <QueryClientProvider client={queryClient}>
                {component}
            </QueryClientProvider>
        );
    };

    describe('Enhanced Sorting', () => {
        it('should render quick sort buttons', async () => {
            renderWithQueryClient(<PortfolioGrid />);

            await waitFor(() => {
                expect(screen.getByText('Risk Score')).toBeInTheDocument();
                expect(screen.getByText('Grade')).toBeInTheDocument();
                expect(screen.getByText('Limit')).toBeInTheDocument();
            });
        });

        it('should handle risk score sorting', async () => {
            renderWithQueryClient(<PortfolioGrid />);

            await waitFor(() => {
                const riskScoreButton = screen.getByText('Risk Score');
                fireEvent.click(riskScoreButton);
            });

            expect(fetch).toHaveBeenCalledWith(
                expect.stringContaining('sort_field=risk_score')
            );
        });

        it('should handle advanced sorting options', async () => {
            renderWithQueryClient(<PortfolioGrid />);

            await waitFor(() => {
                const moreOptionsButton = screen.getByText('More Options');
                fireEvent.click(moreOptionsButton);
            });

            await waitFor(() => {
                expect(screen.getByText('Advanced Sorting')).toBeInTheDocument();
            });
        });

        it('should toggle sort direction', async () => {
            renderWithQueryClient(<PortfolioGrid />);

            await waitFor(() => {
                const riskScoreButton = screen.getByText('Risk Score');
                fireEvent.click(riskScoreButton);
            });

            // Click again to toggle direction
            await waitFor(() => {
                const riskScoreButton = screen.getByText('Risk Score');
                fireEvent.click(riskScoreButton);
            });

            expect(fetch).toHaveBeenCalledWith(
                expect.stringContaining('sort_direction=asc')
            );
        });
    });

    describe('Enhanced Pagination', () => {
        const mockLargeDataset = {
            ...mockPortfolioData,
            total_count: 150,
            has_next: true,
            has_previous: false,
        };

        beforeEach(() => {
            (fetch as jest.Mock).mockResolvedValue({
                ok: true,
                json: async () => mockLargeDataset,
            });
        });

        it('should render pagination controls for large datasets', async () => {
            renderWithQueryClient(<PortfolioGrid enableAdvancedPagination={true} />);

            await waitFor(() => {
                expect(screen.getByText('Showing 2 of 150 companies')).toBeInTheDocument();
                expect(screen.getByText('Page 1 of 8')).toBeInTheDocument();
            });
        });

        it('should handle page size changes', async () => {
            renderWithQueryClient(<PortfolioGrid enableAdvancedPagination={true} />);

            await waitFor(() => {
                const pageSizeSelect = screen.getByDisplayValue('20');
                fireEvent.change(pageSizeSelect, { target: { value: '50' } });
            });

            expect(fetch).toHaveBeenCalledWith(
                expect.stringContaining('limit=50')
            );
        });

        it('should handle page navigation', async () => {
            renderWithQueryClient(<PortfolioGrid enableAdvancedPagination={true} />);

            await waitFor(() => {
                const nextButton = screen.getByText('Next');
                fireEvent.click(nextButton);
            });

            expect(fetch).toHaveBeenCalledWith(
                expect.stringContaining('page=2')
            );
        });

        it('should disable navigation buttons appropriately', async () => {
            renderWithQueryClient(<PortfolioGrid enableAdvancedPagination={true} />);

            await waitFor(() => {
                const previousButton = screen.getByText('Previous');
                expect(previousButton).toBeDisabled();
            });
        });
    });

    describe('Loading States', () => {
        it('should show loading skeleton on initial load', () => {
            (fetch as jest.Mock).mockImplementation(
                () => new Promise(() => { }) // Never resolves
            );

            renderWithQueryClient(<PortfolioGrid />);

            expect(screen.getByText('Loading your portfolio...')).toBeInTheDocument();
        });

        it('should show inline loading during updates', async () => {
            renderWithQueryClient(<PortfolioGrid />);

            // Wait for initial load
            await waitFor(() => {
                expect(screen.getByText('Test Company A')).toBeInTheDocument();
            });

            // Trigger a new request
            const riskScoreButton = screen.getByText('Risk Score');
            fireEvent.click(riskScoreButton);

            await waitFor(() => {
                expect(screen.getByText('Updating...')).toBeInTheDocument();
            });
        });
    });

    describe('Empty States', () => {
        it('should show no companies found for empty results', async () => {
            (fetch as jest.Mock).mockResolvedValue({
                ok: true,
                json: async () => ({
                    companies: [],
                    total_count: 0,
                    page: 1,
                    limit: 20,
                    has_next: false,
                    has_previous: false,
                }),
            });

            renderWithQueryClient(<PortfolioGrid />);

            await waitFor(() => {
                expect(screen.getByText('No companies in your portfolio')).toBeInTheDocument();
            });
        });

        it('should show filtered empty state with clear filters option', async () => {
            (fetch as jest.Mock).mockResolvedValue({
                ok: true,
                json: async () => ({
                    companies: [],
                    total_count: 0,
                    page: 1,
                    limit: 20,
                    has_next: false,
                    has_previous: false,
                }),
            });

            renderWithQueryClient(
                <PortfolioGrid initialFilters={{ risk_grades: ['CM1'] }} />
        );

        await waitFor(() => {
            expect(screen.getByText('No companies match your criteria')).toBeInTheDocument();
            expect(screen.getByText(/Clear.*filter/)).toBeInTheDocument();
        });
    });
});

describe('Error Handling', () => {
    it('should show error state on fetch failure', async () => {
        (fetch as jest.Mock).mockRejectedValue(new Error('Network error'));

        renderWithQueryClient(<PortfolioGrid />);

        await waitFor(() => {
            expect(screen.getByText('Connection Error')).toBeInTheDocument();
            expect(screen.getByText('Try Again')).toBeInTheDocument();
        });
    });

    it('should handle retry functionality', async () => {
        (fetch as jest.Mock).mockRejectedValueOnce(new Error('Network error'))
            .mockResolvedValueOnce({
                ok: true,
                json: async () => mockPortfolioData,
            });

        renderWithQueryClient(<PortfolioGrid />);

        await waitFor(() => {
            const retryButton = screen.getByText('Try Again');
            fireEvent.click(retryButton);
        });

        await waitFor(() => {
            expect(screen.getByText('Test Company A')).toBeInTheDocument();
        });
    });
});

describe('Performance Optimizations', () => {
    it('should use memoized callbacks to prevent unnecessary re-renders', () => {
        const { rerender } = renderWithQueryClient(<PortfolioGrid />);

        // Re-render with same props
        rerender(
            <QueryClientProvider client={ queryClient } >
            <PortfolioGrid />
        </QueryClientProvider>
        );

        // Should not trigger additional API calls
        expect(fetch).toHaveBeenCalledTimes(1);
    });

    it('should reset to first page when filters change', async () => {
        renderWithQueryClient(<PortfolioGrid />);

        await waitFor(() => {
            // Navigate to page 2 first
            const nextButton = screen.getByText('Next');
            fireEvent.click(nextButton);
        });

        // Apply a filter
        await waitFor(() => {
            const riskFilterButton = screen.getByText('Risk Filters');
            fireEvent.click(riskFilterButton);
        });

        // Should reset to page 1
        expect(fetch).toHaveBeenLastCalledWith(
            expect.stringContaining('page=1')
        );
    });
});

describe('Accessibility', () => {
    it('should have proper ARIA labels for pagination controls', async () => {
        renderWithQueryClient(<PortfolioGrid enableAdvancedPagination={true} />);

        await waitFor(() => {
            const nextButton = screen.getByText('Next');
            expect(nextButton).toHaveAttribute('type', 'button');
        });
    });

    it('should show loading indicators with proper text', async () => {
        (fetch as jest.Mock).mockImplementation(
            () => new Promise(() => { }) // Never resolves
        );

        renderWithQueryClient(<PortfolioGrid />);

        expect(screen.getByText('This may take a few moments')).toBeInTheDocument();
    });
});
});