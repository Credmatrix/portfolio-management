import { PortfolioRepository } from '@/lib/repositories/portfolio.repository'
import { FilterCriteria, SortCriteria, PaginationParams } from '@/types/portfolio.types'

// Mock Supabase client
const mockSupabaseClient = {
    from: jest.fn(() => mockSupabaseClient),
    select: jest.fn(() => mockSupabaseClient),
    eq: jest.fn(() => mockSupabaseClient),
    neq: jest.fn(() => mockSupabaseClient),
    in: jest.fn(() => mockSupabaseClient),
    gte: jest.fn(() => mockSupabaseClient),
    lte: jest.fn(() => mockSupabaseClient),
    or: jest.fn(() => mockSupabaseClient),
    order: jest.fn(() => mockSupabaseClient),
    range: jest.fn(() => mockSupabaseClient),
    limit: jest.fn(() => mockSupabaseClient),
    single: jest.fn(() => mockSupabaseClient),
    update: jest.fn(() => mockSupabaseClient)
}

// Mock the Supabase server client
jest.mock('@/lib/supabase/server', () => ({
    createServerSupabaseClient: jest.fn(() => Promise.resolve(mockSupabaseClient))
}))

describe('PortfolioRepository', () => {
    let repository: PortfolioRepository

    beforeEach(() => {
        repository = new PortfolioRepository()
        jest.clearAllMocks()
    })

    describe('getPortfolioOverview', () => {
        const mockCompanyData = [
            {
                id: '1',
                request_id: 'req-001',
                user_id: 'user-1',
                organization_id: 'org-1',
                original_filename: 'company1.pdf',
                company_name: 'Test Company 1',
                industry: 'Manufacturing',
                risk_score: 75,
                risk_grade: 'CM3',
                recommended_limit: 1000000,
                currency: 'INR',
                status: 'completed',
                submitted_at: '2024-01-01T00:00:00Z',
                processing_started_at: '2024-01-01T01:00:00Z',
                completed_at: '2024-01-01T02:00:00Z',
                file_size: 1024,
                file_extension: 'pdf',
                s3_upload_key: 'uploads/company1.pdf',
                s3_folder_path: 'uploads/',
                pdf_filename: 'report1.pdf',
                pdf_s3_key: 'reports/report1.pdf',
                pdf_file_size: 2048,
                model_type: 'without_banking',
                total_parameters: 100,
                available_parameters: 85,
                financial_parameters: 30,
                business_parameters: 25,
                hygiene_parameters: 20,
                banking_parameters: 10,
                error_message: null,
                retry_count: 0,
                extracted_data: {
                    about_company: {
                        legal_name: 'Test Company 1 Ltd',
                        cin: 'U12345AB2020PTC123456',
                        pan: 'ABCDE1234F'
                    }
                },
                risk_analysis: {
                    totalWeightedScore: 75,
                    overallGrade: {
                        grade: 'CM3',
                        category: 3,
                        multiplier: 0.8
                    }
                },
                processing_summary: null,
                created_at: '2024-01-01T00:00:00Z',
                updated_at: '2024-01-01T02:00:00Z'
            }
        ]

        it('should fetch portfolio overview with default parameters', async () => {
            mockSupabaseClient.single = jest.fn().mockResolvedValue({
                data: mockCompanyData,
                error: null,
                count: 1
            })

            const result = await repository.getPortfolioOverview()

            expect(mockSupabaseClient.from).toHaveBeenCalledWith('document_processing_requests')
            expect(mockSupabaseClient.select).toHaveBeenCalledWith('*', { count: 'exact' })
            expect(result.companies).toHaveLength(1)
            expect(result.total_count).toBe(1)
            expect(result.page).toBe(1)
            expect(result.limit).toBe(20)
        })

        it('should apply risk grade filters', async () => {
            const filters: FilterCriteria = {
                risk_grades: ['CM1', 'CM2']
            }

            mockSupabaseClient.single = jest.fn().mockResolvedValue({
                data: [],
                error: null,
                count: 0
            })

            await repository.getPortfolioOverview(filters)

            expect(mockSupabaseClient.in).toHaveBeenCalledWith('risk_grade', ['CM1', 'CM2'])
        })

        it('should apply risk score range filters', async () => {
            const filters: FilterCriteria = {
                risk_score_range: [70, 90]
            }

            mockSupabaseClient.single = jest.fn().mockResolvedValue({
                data: [],
                error: null,
                count: 0
            })

            await repository.getPortfolioOverview(filters)

            expect(mockSupabaseClient.gte).toHaveBeenCalledWith('risk_score', 70)
            expect(mockSupabaseClient.lte).toHaveBeenCalledWith('risk_score', 90)
        })

        it('should apply sorting', async () => {
            const sort: SortCriteria = {
                field: 'risk_score',
                direction: 'desc'
            }

            mockSupabaseClient.single = jest.fn().mockResolvedValue({
                data: [],
                error: null,
                count: 0
            })

            await repository.getPortfolioOverview(undefined, sort)

            expect(mockSupabaseClient.order).toHaveBeenCalledWith('risk_score', { ascending: false })
        })

        it('should apply pagination', async () => {
            const pagination: PaginationParams = {
                page: 2,
                limit: 10
            }

            mockSupabaseClient.single = jest.fn().mockResolvedValue({
                data: [],
                error: null,
                count: 0
            })

            await repository.getPortfolioOverview(undefined, undefined, pagination)

            expect(mockSupabaseClient.range).toHaveBeenCalledWith(10, 19)
        })

        it('should handle database errors', async () => {
            mockSupabaseClient.single = jest.fn().mockResolvedValue({
                data: null,
                error: { message: 'Database connection failed' },
                count: null
            })

            await expect(repository.getPortfolioOverview()).rejects.toThrow(
                'Failed to fetch portfolio overview: Database connection failed'
            )
        })
    })

    describe('getCompanyByRequestId', () => {
        const mockCompany = {
            id: '1',
            request_id: 'req-001',
            company_name: 'Test Company',
            industry: 'Manufacturing',
            risk_score: 75,
            risk_grade: 'CM3'
        }

        it('should fetch company by request ID', async () => {
            mockSupabaseClient.single = jest.fn().mockResolvedValue({
                data: mockCompany,
                error: null
            })

            const result = await repository.getCompanyByRequestId('req-001')

            expect(mockSupabaseClient.from).toHaveBeenCalledWith('document_processing_requests')
            expect(mockSupabaseClient.eq).toHaveBeenCalledWith('request_id', 'req-001')
            expect(result.company.request_id).toBe('req-001')
        })

        it('should handle company not found', async () => {
            mockSupabaseClient.single = jest.fn().mockResolvedValue({
                data: null,
                error: { code: 'PGRST116', message: 'No rows found' }
            })

            await expect(repository.getCompanyByRequestId('non-existent')).rejects.toThrow(
                'Company with request ID non-existent not found'
            )
        })

        it('should handle database errors', async () => {
            mockSupabaseClient.single = jest.fn().mockResolvedValue({
                data: null,
                error: { message: 'Database error' }
            })

            await expect(repository.getCompanyByRequestId('req-001')).rejects.toThrow(
                'Failed to fetch company details: Database error'
            )
        })
    })

    describe('searchCompanies', () => {
        it('should search companies by query', async () => {
            mockSupabaseClient.single = jest.fn().mockResolvedValue({
                data: [],
                error: null,
                count: 0
            })

            const result = await repository.searchCompanies('Test Company')

            expect(mockSupabaseClient.from).toHaveBeenCalledWith('document_processing_requests')
            expect(mockSupabaseClient.or).toHaveBeenCalled()
            expect(result.companies).toBeDefined()
            expect(result.total_matches).toBe(0)
            expect(result.search_time_ms).toBeGreaterThanOrEqual(0)
        })

        it('should handle empty search query', async () => {
            mockSupabaseClient.single = jest.fn().mockResolvedValue({
                data: [],
                error: null,
                count: 0
            })

            const result = await repository.searchCompanies('')

            expect(result.companies).toBeDefined()
        })

        it('should handle search errors', async () => {
            mockSupabaseClient.single = jest.fn().mockResolvedValue({
                data: null,
                error: { message: 'Search failed' }
            })

            await expect(repository.searchCompanies('test')).rejects.toThrow(
                'Search failed: Search failed'
            )
        })
    })

    describe('updateCompanyData', () => {
        it('should update company data', async () => {
            const mockUpdatedCompany = {
                id: '1',
                request_id: 'req-001',
                company_name: 'Updated Company Name',
                risk_score: 80
            }

            mockSupabaseClient.single = jest.fn().mockResolvedValue({
                data: mockUpdatedCompany,
                error: null
            })

            const updates = {
                company_name: 'Updated Company Name',
                risk_score: 80
            }

            const result = await repository.updateCompanyData('req-001', updates)

            expect(mockSupabaseClient.update).toHaveBeenCalled()
            expect(mockSupabaseClient.eq).toHaveBeenCalledWith('request_id', 'req-001')
            expect(result.company_name).toBe('Updated Company Name')
        })

        it('should handle update errors', async () => {
            mockSupabaseClient.single = jest.fn().mockResolvedValue({
                data: null,
                error: { message: 'Update failed' }
            })

            await expect(repository.updateCompanyData('req-001', {})).rejects.toThrow(
                'Failed to update company data: Update failed'
            )
        })
    })
})