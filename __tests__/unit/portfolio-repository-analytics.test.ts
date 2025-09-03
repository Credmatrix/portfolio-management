import { PortfolioRepository } from '@/lib/repositories/portfolio.repository'
import { FilterCriteria } from '@/types/portfolio.types'

// Mock Supabase client
const mockSupabaseClient = {
    from: jest.fn(),
    rpc: jest.fn()
}

jest.mock('@/lib/supabase/server', () => ({
    createServerSupabaseClient: jest.fn(() => Promise.resolve(mockSupabaseClient))
}))

describe('PortfolioRepository Analytics Table Support', () => {
    let repository: PortfolioRepository
    let mockQuery: any

    beforeEach(() => {
        repository = new PortfolioRepository()
        mockQuery = {
            select: jest.fn().mockReturnThis(),
            eq: jest.fn().mockReturnThis(),
            in: jest.fn().mockReturnThis(),
            gte: jest.fn().mockReturnThis(),
            lte: jest.fn().mockReturnThis(),
            or: jest.fn().mockReturnThis(),
            order: jest.fn().mockReturnThis(),
            range: jest.fn().mockReturnThis(),
            single: jest.fn().mockReturnThis(),
            limit: jest.fn().mockReturnThis()
        }
        mockSupabaseClient.from.mockReturnValue(mockQuery)
        jest.clearAllMocks()
    })

    describe('getPortfolioOverview with Analytics Table', () => {
        it('should use analytics table when available', async () => {
            const mockAnalyticsData = [
                {
                    id: '1',
                    request_id: 'req-1',
                    company_name: 'Test Company',
                    industry: 'Manufacturing',
                    risk_score: 75,
                    risk_grade: 'CM2',
                    recommended_limit: 1000000,
                    completed_at: '2024-01-01T00:00:00Z'
                }
            ]

            mockQuery.select.mockReturnValue({
                ...mockQuery,
                then: jest.fn().mockResolvedValue({
                    data: mockAnalyticsData,
                    error: null,
                    count: 1
                })
            })

            const filters: FilterCriteria = {
                risk_grades: ['CM2'],
                industries: ['Manufacturing']
            }

            const result = await repository.getPortfolioOverview(filters)

            expect(mockSupabaseClient.from).toHaveBeenCalledWith('portfolio_analytics')
            expect(result.companies).toHaveLength(1)
            expect(result.companies[0].company_name).toBe('Test Company')
            expect(result.total_count).toBe(1)
        })

        it('should fall back to main table when analytics table fails', async () => {
            // First call to analytics table fails
            mockQuery.select.mockReturnValueOnce({
                ...mockQuery,
                then: jest.fn().mockRejectedValue(new Error('Analytics table error'))
            })

            // Second call to main table succeeds
            const mockMainTableData = [
                {
                    id: '1',
                    request_id: 'req-1',
                    company_name: 'Test Company',
                    industry: 'Manufacturing',
                    risk_score: 75,
                    risk_grade: 'CM2',
                    recommended_limit: 1000000,
                    status: 'completed',
                    completed_at: '2024-01-01T00:00:00Z',
                    extracted_data: {},
                    risk_analysis: {}
                }
            ]

            mockQuery.select.mockReturnValueOnce({
                ...mockQuery,
                then: jest.fn().mockResolvedValue({
                    data: mockMainTableData,
                    error: null,
                    count: 1
                })
            })

            const result = await repository.getPortfolioOverview()

            expect(mockSupabaseClient.from).toHaveBeenCalledWith('portfolio_analytics')
            expect(mockSupabaseClient.from).toHaveBeenCalledWith('document_processing_requests')
            expect(result.companies).toHaveLength(1)
        })
    })

    describe('Analytics Table Management', () => {
        it('should sync analytics table for specific request', async () => {
            const mockSyncResult = {
                synced_count: 1,
                error_count: 0,
                message: 'Sync completed successfully'
            }

            mockSupabaseClient.rpc.mockResolvedValue({
                data: mockSyncResult,
                error: null
            })

            const result = await repository.syncAnalyticsTable('req-1')

            expect(mockSupabaseClient.rpc).toHaveBeenCalledWith('sync_portfolio_analytics', {
                p_request_id: 'req-1'
            })
            expect(result).toEqual(mockSyncResult)
        })

        it('should validate analytics data', async () => {
            const mockValidationResult = [
                {
                    request_id: 'req-1',
                    validation_status: 'Valid' as const,
                    issues: []
                }
            ]

            mockSupabaseClient.rpc.mockResolvedValue({
                data: mockValidationResult,
                error: null
            })

            const result = await repository.validateAnalyticsData('req-1')

            expect(mockSupabaseClient.rpc).toHaveBeenCalledWith('validate_analytics_data', {
                p_request_id: 'req-1'
            })
            expect(result).toEqual(mockValidationResult)
        })

        it('should get analytics table status', async () => {
            // Mock the count queries
            mockQuery.select.mockReturnValue({
                ...mockQuery,
                then: jest.fn().mockResolvedValue({ count: 100, error: null })
            })

            // Mock the last sync query
            mockQuery.single.mockReturnValue({
                then: jest.fn().mockResolvedValue({
                    data: { updated_at: '2024-01-01T00:00:00Z' },
                    error: null
                })
            })

            const status = await repository.getAnalyticsTableStatus()

            expect(status.total_records).toBe(100)
            expect(status.synced_records).toBe(100)
            expect(status.sync_coverage_percentage).toBe(100)
        })

        it('should rebuild analytics table', async () => {
            const mockRebuildResult = {
                total_processed: 100,
                successful_syncs: 95,
                failed_syncs: 5,
                execution_time_seconds: 30
            }

            mockSupabaseClient.rpc.mockResolvedValue({
                data: mockRebuildResult,
                error: null
            })

            const result = await repository.rebuildAnalyticsTable()

            expect(mockSupabaseClient.rpc).toHaveBeenCalledWith('rebuild_analytics_table')
            expect(result).toEqual(mockRebuildResult)
        })
    })

    describe('Analytics Filters', () => {
        it('should apply risk grade filters efficiently', async () => {
            const filters: FilterCriteria = {
                risk_grades: ['CM1', 'CM2']
            }

            mockQuery.select.mockReturnValue({
                ...mockQuery,
                then: jest.fn().mockResolvedValue({
                    data: [],
                    error: null,
                    count: 0
                })
            })

            await repository.getPortfolioOverview(filters)

            expect(mockQuery.in).toHaveBeenCalledWith('risk_grade', ['CM1', 'CM2'])
        })

        it('should apply financial metric filters using direct columns', async () => {
            const filters: FilterCriteria = {
                ebitda_margin_range: [10, 30],
                debt_equity_range: [0, 2]
            }

            mockQuery.select.mockReturnValue({
                ...mockQuery,
                then: jest.fn().mockResolvedValue({
                    data: [],
                    error: null,
                    count: 0
                })
            })

            await repository.getPortfolioOverview(filters)

            expect(mockQuery.gte).toHaveBeenCalledWith('ebitda_margin_value', 10)
            expect(mockQuery.lte).toHaveBeenCalledWith('ebitda_margin_value', 30)
            expect(mockQuery.gte).toHaveBeenCalledWith('debt_equity_value', 0)
            expect(mockQuery.lte).toHaveBeenCalledWith('debt_equity_value', 2)
        })

        it('should apply compliance filters using flattened columns', async () => {
            const filters: FilterCriteria = {
                gst_compliance_status: ['Regular'],
                epfo_compliance_status: ['Regular']
            }

            mockQuery.select.mockReturnValue({
                ...mockQuery,
                then: jest.fn().mockResolvedValue({
                    data: [],
                    error: null,
                    count: 0
                })
            })

            await repository.getPortfolioOverview(filters)

            expect(mockQuery.in).toHaveBeenCalledWith('gst_compliance_status', ['Regular'])
            expect(mockQuery.in).toHaveBeenCalledWith('epfo_compliance_status', ['Regular'])
        })
    })

    describe('Metrics Calculation from Analytics', () => {
        it('should calculate portfolio metrics efficiently from analytics table', async () => {
            const mockAnalyticsData = [
                {
                    risk_score: 75,
                    risk_grade: 'CM2',
                    recommended_limit: 1000000,
                    industry: 'Manufacturing',
                    state: 'Maharashtra',
                    gst_compliance_status: 'Regular',
                    epfo_compliance_status: 'Regular',
                    audit_qualification_status: 'Unqualified'
                },
                {
                    risk_score: 85,
                    risk_grade: 'CM1',
                    recommended_limit: 2000000,
                    industry: 'Services',
                    state: 'Karnataka',
                    gst_compliance_status: 'Irregular',
                    epfo_compliance_status: 'Regular',
                    audit_qualification_status: 'Qualified'
                }
            ]

            mockQuery.select.mockReturnValue({
                then: jest.fn().mockResolvedValue({
                    data: mockAnalyticsData,
                    error: null
                })
            })

            // Access private method for testing
            const metrics = await (repository as any).calculatePortfolioMetricsFromAnalytics()

            expect(metrics.total_companies).toBe(2)
            expect(metrics.total_exposure).toBe(3000000)
            expect(metrics.average_risk_score).toBe(80)
            expect(metrics.industry_breakdown.industries).toHaveLength(2)
            expect(metrics.compliance_summary.gst_compliance.compliant).toBe(1)
            expect(metrics.compliance_summary.gst_compliance.non_compliant).toBe(1)
        })
    })
})