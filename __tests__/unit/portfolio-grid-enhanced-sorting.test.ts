// __tests__/unit/portfolio-grid-enhanced-sorting.test.ts
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { useRouter } from 'next/navigation'
import { PortfolioGrid } from '@/components/portfolio/PortfolioGrid'

// Mock next/navigation
vi.mock('next/navigation', () => ({
    useRouter: vi.fn()
}))

// Mock fetch
global.fetch = vi.fn()

const mockRouter = {
    push: vi.fn(),
    replace: vi.fn(),
    back: vi.fn(),
    forward: vi.fn(),
    refresh: vi.fn(),
    prefetch: vi.fn()
}

describe('PortfolioGrid Enhanced Sorting and Pagination', () => {
    let queryClient: QueryClient

    beforeEach(() => {
        queryClient = new QueryClient({
            defaultOptions: {
                queries: {
                    retry: false,
                },
            },
        })
        vi.mocked(useRouter).mockReturnValue(mockRouter)
        vi.clearAllMocks()
    })

    const renderPortfolioGrid = (props = {}) => {
        return render(
            <QueryClientProvider client={queryClient}>
                <PortfolioGrid {...props} />
            </QueryClientProvider>
        )
    }

    const mockPortfolioResponse = {
        companies: [
            {
                id: '1',
                request_id: 'req-1',
                company_name: 'Test Company 1',
                industry: 'Manufacturing',
                risk_score: 85,
                risk_grade: 'CM2',
                recommended_limit: 1000000,
                status: 'completed'
            },
            {
                id: '2',
                request_id: 'req-2',
                company_name: 'Test Company 2',
                industry: 'Services',
                risk_score: 72,
                risk_grade: 'CM3',
                recommended_limit: 500000,
                status: 'completed'
            }
        ],
        total_count: 350, // Large dataset
        page: 1,
        limit: 20,
        has_next: true,
        has_previous: false
    }

    it('should display large dataset warning for 300+ companies', async () => {
        vi.mocked(fetch).mockResolvedValueOnce({
            ok: true,
            json: async () => mockPortfolioResponse
        } as Response)

        renderPortfolioGrid()

        await waitFor(() => {
            expect(screen.getByText(/Large Dataset Detected/i)).toBeInTheDocument()
            expect(screen.getByText(/350 companies/i)).toBeInTheDocument()
        })
    })

    it('should provide quick sort buttons for risk score, limit, and industry', async () => {
        vi.mocked(fetch).mockResolvedValueOnce({
            ok: true,
            json: async () => mockPortfolioResponse
        } as Response)

        renderPortfolioGrid()

        await waitFor(() => {
            expect(screen.getByRole('button', { name: /Risk Score/i })).toBeInTheDocument()
            expect(screen.getByRole('button', { name: /Limit/i })).toBeInTheDocument()
            expect(screen.getByRole('button', { name: /Industry/i })).toBeInTheDocument()
        })
    })

    it('should handle sorting by risk score with direction toggle', async () => {
        vi.mocked(fetch).mockResolvedValueOnce({
            ok: true,
            json: async () => mockPortfolioResponse
        } as Response)

        renderPortfolioGrid()

        await waitFor(() => {
            const riskScoreButton = screen.getByRole('button', { name: /Risk Score/i })
            expect(riskScoreButton).toBeInTheDocument()
        })

        // Click risk score button to sort
        const riskScoreButton = screen.getByRole('button', { name: /Risk Score/i })
        fireEvent.click(riskScoreButton)

        // Should make API call with sort parameters
        await waitFor(() => {
            expect(fetch).toHaveBeenCalledWith(
                expect.stringContaining('sort_field=risk_score&sort_direction=desc')
            )
        })
    })

    it('should show performance optimization suggestions for large datasets', async () => {
        vi.mocked(fetch).mockResolvedValueOnce({
            ok: true,
            json: async () => ({ ...mockPortfolioResponse, total_count: 500 })
        } as Response)

        renderPortfolioGrid()

        await waitFor(() => {
            expect(screen.getByText(/consider using filters to improve performance/i)).toBeInTheDocument()
            expect(screen.getByRole('button', { name: /Show 50 per page/i })).toBeInTheDocument()
        })
    })

    it('should handle enhanced empty states with suggestions', async () => {
        vi.mocked(fetch).mockResolvedValueOnce({
            ok: true,
            json: async () => ({
                ...mockPortfolioResponse,
                companies: [],
                total_count: 0
            })
        } as Response)

        renderPortfolioGrid({
            initialFilters: {
                risk_grades: ['CM1'],
                search_query: 'nonexistent'
            }
        })

        await waitFor(() => {
            expect(screen.getByText(/No companies match your criteria/i)).toBeInTheDocument()
            expect(screen.getByText(/Suggestions:/i)).toBeInTheDocument()
            expect(screen.getByText(/Try different search terms/i)).toBeInTheDocument()
        })
    })

    it('should provide jump-to-page functionality for large datasets', async () => {
        const largeDatasetResponse = {
            ...mockPortfolioResponse,
            total_count: 1000,
            page: 5
        }

        vi.mocked(fetch).mockResolvedValueOnce({
            ok: true,
            json: async () => largeDatasetResponse
        } as Response)

        renderPortfolioGrid()

        await waitFor(() => {
            // Should show jump-to-page input for datasets with >10 pages
            const jumpInput = screen.getByPlaceholderText('5')
            expect(jumpInput).toBeInTheDocument()
        })
    })

    it('should handle efficient pagination with performance optimizations', async () => {
        vi.mocked(fetch).mockResolvedValueOnce({
            ok: true,
            json: async () => mockPortfolioResponse
        } as Response)

        renderPortfolioGrid({ enableAdvancedPagination: true })

        await waitFor(() => {
            // Should show page size options including larger sizes for big datasets
            expect(screen.getByDisplayValue('20')).toBeInTheDocument()
        })

        // Change page size
        const pageSizeSelect = screen.getByDisplayValue('20')
        fireEvent.change(pageSizeSelect, { target: { value: '50' } })

        await waitFor(() => {
            expect(fetch).toHaveBeenCalledWith(
                expect.stringContaining('limit=50')
            )
        })
    })

    it('should show loading states with progress indicators', async () => {
        // Mock a slow response
        vi.mocked(fetch).mockImplementationOnce(() =>
            new Promise(resolve =>
                setTimeout(() => resolve({
                    ok: true,
                    json: async () => mockPortfolioResponse
                } as Response), 100)
            )
        )

        renderPortfolioGrid()

        // Should show loading state
        expect(screen.getByText(/Loading your portfolio/i)).toBeInTheDocument()

        await waitFor(() => {
            expect(screen.getByText(/Test Company 1/i)).toBeInTheDocument()
        }, { timeout: 200 })
    })

    it('should handle sorting by multiple criteria with consistent ordering', async () => {
        vi.mocked(fetch).mockResolvedValueOnce({
            ok: true,
            json: async () => mockPortfolioResponse
        } as Response)

        renderPortfolioGrid()

        await waitFor(() => {
            const industryButton = screen.getByRole('button', { name: /Industry/i })
            fireEvent.click(industryButton)
        })

        // Should include secondary sort for consistent pagination
        await waitFor(() => {
            expect(fetch).toHaveBeenCalledWith(
                expect.stringContaining('sort_field=industry')
            )
        })
    })

    it('should cap pagination limit at 200 for performance', async () => {
        vi.mocked(fetch).mockResolvedValueOnce({
            ok: true,
            json: async () => mockPortfolioResponse
        } as Response)

        renderPortfolioGrid()

        await waitFor(() => {
            // Even if user tries to set higher limit, should be capped
            const pageSizeSelect = screen.getByDisplayValue('20')
            fireEvent.change(pageSizeSelect, { target: { value: '500' } })
        })

        // API should receive capped limit
        await waitFor(() => {
            expect(fetch).toHaveBeenCalledWith(
                expect.stringContaining('limit=200')
            )
        })
    })
})