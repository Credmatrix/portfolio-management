import { createServerSupabaseClient } from '@/lib/supabase/server'
import {
    PortfolioCompany,
    FilterCriteria,
    SortCriteria,
    PaginationParams,
    PortfolioResponse,
    CompanyDetailResponse,
    SearchResult,
    PortfolioMetrics,
    RiskAnalysis,
    IndustryType
} from '@/types/portfolio.types'
import { Database, Json } from '@/types/database.types'
import {
    PortfolioAnalytics,
    AnalyticsTableStatus,
    SyncResult,
    ValidationResult,
    RetryResult,
    RebuildResult,
    ParameterScore,
    CategoryScore,
    StructuredAnalyticsData
} from '@/types/analytics-table.types'

type DocumentProcessingRequest = Database['public']['Tables']['document_processing_requests']['Row']

export class PortfolioRepository {
    private async getSupabaseClient() {
        return await createServerSupabaseClient()
    }

    private useAnalyticsTable: boolean = true // Always use analytics table for better performance

    /**
     * Get portfolio overview with pagination and filtering
     * Uses analytics table for optimal performance
     */
    async getPortfolioOverview(
        filters?: FilterCriteria,
        sort?: SortCriteria,
        pagination?: PaginationParams,
        userId?: string
    ): Promise<PortfolioResponse> {
        return await this.getPortfolioOverviewFromMainTable(filters, sort, pagination, userId)
    }

    /**
     * Get portfolio overview from analytics table for optimal performance
     */
    private async getPortfolioOverviewFromAnalytics(
        filters?: FilterCriteria,
        sort?: SortCriteria,
        pagination?: PaginationParams,
        userId?: string
    ): Promise<PortfolioResponse> {
        const supabase = await this.getSupabaseClient()

        // Start building the query on analytics table with user filtering
        let query = supabase
            .from('portfolio_analytics')
            .select(`
                *,
                document_processing_requests!inner(user_id)
            `, { count: 'exact' })
            .eq('processing_status', 'completed')

        // Filter by user_id for security through the join
        if (userId) {
            query = query.eq('document_processing_requests.user_id', userId)
        }

        // Apply analytics-optimized filters
        if (filters) {
            query = this.applyAnalyticsFilters(query, filters)
        }

        // Apply sorting
        if (sort) {
            // Map portfolio field names to analytics table field names
            const analyticsField = this.mapPortfolioFieldToAnalytics(sort.field)
            query = query.order(analyticsField, { ascending: sort.direction === 'asc' })
        } else {
            // Default sort by completion date (most recent first)
            query = query.order('completed_at', { ascending: false })
        }

        // Apply pagination
        const page = pagination?.page || 1
        const limit = pagination?.limit || 20
        const offset = ((page - 1) * limit)

        query = query.range(offset, offset + limit - 1)

        const { data, error, count } = await query

        if (error) {
            throw new Error(`Failed to fetch portfolio overview from analytics: ${error.message}`)
        }

        // Transform analytics records to PortfolioCompany interface
        const companies = (data || []).map((row) => this.transformAnalyticsToPortfolioCompany(row))

        // Calculate metrics using analytics table
        const metrics = await this.calculatePortfolioMetricsFromAnalytics(filters, userId)

        return {
            companies,
            total_count: count || 0,
            page,
            limit,
            has_next: (count || 0) > offset + limit,
            has_previous: page > 1,
            metrics
        }
    }

    /**
     * Get portfolio overview from main table (fallback method)
     */
    private async getPortfolioOverviewFromMainTable(
        filters?: FilterCriteria,
        sort?: SortCriteria,
        pagination?: PaginationParams,
        userId?: string
    ): Promise<PortfolioResponse> {
        const supabase = await this.getSupabaseClient()

        // Start building the query
        let query = supabase
            .from('document_processing_requests')
            .select(`id, request_id, user_id, organization_id, original_filename,
            company_name, industry, risk_score, risk_grade, recommended_limit,
            currency, status, submitted_at, processing_started_at, completed_at,
            file_size, file_extension, s3_upload_key, s3_folder_path,
            pdf_filename, pdf_s3_key, pdf_file_size, model_type,
            total_parameters, available_parameters, financial_parameters,
            business_parameters, hygiene_parameters, banking_parameters,
            error_message, retry_count, created_at, updated_at, risk_analysis`, { count: 'exact' })

        // Filter by user_id for security
        if (userId) {
            query = query.eq('user_id', userId)
        }

        // Apply filters
        if (filters) {
            query = this.applyFilters(query, filters)
        }

        // Apply sorting with performance optimizations
        if (sort) {
            // For JSONB fields, add a secondary sort to ensure consistent ordering
            const isJsonbField = sort.field.includes('->')
            query = query.order(sort.field, { ascending: sort.direction === 'asc' })

            // Add secondary sort for consistent pagination with JSONB fields
            if (isJsonbField) {
                query = query.order('id', { ascending: true })
            }
        } else {
            // Default sort by completion date (most recent first) with ID as tiebreaker
            query = query.order('completed_at', { ascending: false })
                .order('id', { ascending: true })
        }

        // Apply pagination
        const page = pagination?.page || 1
        const limit = pagination?.limit || 20
        const offset = ((page - 1) * limit)

        query = query.range(offset, offset + limit - 1)

        const { data, error, count } = await query

        if (error) {
            throw new Error(`Failed to fetch portfolio overview: ${error.message}`)
        }

        // Transform database rows to PortfolioCompany interface
        let companies = (data || []).map((row) => this.transformToPortfolioCompany(row))

        // Apply client-side filters for complex criteria that can't be handled at DB level
        companies = this.applyClientSideFilters(companies, filters)

        // Calculate metrics if requested
        const metrics = await this.calculatePortfolioMetrics(filters, userId)

        return {
            companies,
            total_count: count || 0,
            page,
            limit,
            has_next: (count || 0) > offset + limit,
            has_previous: page > 1,
            metrics
        }
    }

    /**
     * Map portfolio field names to analytics table field names
     */
    private mapPortfolioFieldToAnalytics(field: string): string {
        const fieldMapping: Record<string, string> = {
            'company_name': 'company_name',
            'risk_score': 'risk_score',
            'risk_grade': 'risk_grade',
            'industry': 'industry',
            'recommended_limit': 'recommended_limit',
            'completed_at': 'completed_at',
            'created_at': 'created_at',
            'status': 'processing_status'
        }

        return fieldMapping[field] || field
    }

    /**
     * Get detailed company data by request ID
     * Returns comprehensive company information from analytics table
     */
    async getCompanyByRequestId(requestId: string, userId?: string): Promise<PortfolioCompany | null> {
        const supabase = await this.getSupabaseClient()

        // First try to get from analytics table
        const { data: analyticsData, error: analyticsError } = await supabase
            .from('portfolio_analytics')
            .select('*')
            .eq('request_id', requestId)
            .single()

        // Always get from main table for complete data
        let mainQuery = supabase
            .from('document_processing_requests')
            .select(`id, request_id, user_id, organization_id, original_filename,
            company_name, industry, risk_score, risk_grade, recommended_limit,
            currency, status, submitted_at, processing_started_at, completed_at,
            file_size, file_extension, s3_upload_key, s3_folder_path,
            pdf_filename, pdf_s3_key, pdf_file_size, model_type,
            total_parameters, available_parameters, financial_parameters,
            business_parameters, hygiene_parameters, banking_parameters,
            error_message, retry_count, created_at, updated_at, extracted_data, risk_analysis, processing_summary`)
            .eq('request_id', requestId)

        // Filter by user_id for security
        if (userId) {
            mainQuery = mainQuery.eq('user_id', userId)
        }

        const { data, error } = await mainQuery.single()

        if (error) {
            if (error.code === 'PGRST116') {
                return null // Company not found
            }
            throw new Error(`Failed to fetch company details: ${error.message}`)
        }

        // If analytics data is available, combine it with main table data
        // if (analyticsData && !analyticsError) {
        //     return this.combineAnalyticsAndMainTableData(analyticsData, data)
        // }

        // Fallback to main table data only
        return this.transformToPortfolioCompany(data)
    }

    /**
     * Combine analytics table data with main table data to create a complete PortfolioCompany object
     */
    private combineAnalyticsAndMainTableData(analyticsData: PortfolioAnalytics, mainData: DocumentProcessingRequest): PortfolioCompany {
        // Start with main table data as base (has all the required fields)
        const baseCompany = this.transformToPortfolioCompany(mainData)

        // Override with analytics data where available and more accurate
        const analyticsCompany = this.transformAnalyticsToPortfolioCompany(analyticsData)

        // Combine the data, prioritizing main table for metadata and analytics for computed values
        return {
            // Use main table for core metadata
            id: baseCompany.id,
            request_id: baseCompany.request_id,
            user_id: baseCompany.user_id,
            organization_id: baseCompany.organization_id,
            original_filename: baseCompany.original_filename,
            submitted_at: baseCompany.submitted_at,
            processing_started_at: baseCompany.processing_started_at,
            file_size: baseCompany.file_size,
            file_extension: baseCompany.file_extension,
            s3_upload_key: baseCompany.s3_upload_key,
            s3_folder_path: baseCompany.s3_folder_path,
            pdf_filename: baseCompany.pdf_filename,
            pdf_s3_key: baseCompany.pdf_s3_key,
            pdf_file_size: baseCompany.pdf_file_size,
            error_message: baseCompany.error_message,
            retry_count: baseCompany.retry_count,
            created_at: baseCompany.created_at,
            updated_at: baseCompany.updated_at,

            // Use analytics data for computed/processed values (more accurate)
            company_name: analyticsCompany.company_name || baseCompany.company_name,
            industry: analyticsCompany.industry || baseCompany.industry,
            risk_score: analyticsCompany.risk_score || baseCompany.risk_score,
            risk_grade: analyticsCompany.risk_grade || baseCompany.risk_grade,
            recommended_limit: analyticsCompany.recommended_limit || baseCompany.recommended_limit,
            currency: analyticsCompany.currency || baseCompany.currency,
            status: analyticsCompany.status || baseCompany.status,
            completed_at: analyticsCompany.completed_at || baseCompany.completed_at,
            model_type: analyticsCompany.model_type || baseCompany.model_type,
            total_parameters: analyticsCompany.total_parameters || baseCompany.total_parameters,
            available_parameters: analyticsCompany.available_parameters || baseCompany.available_parameters,
            financial_parameters: analyticsCompany.financial_parameters || baseCompany.financial_parameters,
            business_parameters: analyticsCompany.business_parameters || baseCompany.business_parameters,
            hygiene_parameters: analyticsCompany.hygiene_parameters || baseCompany.hygiene_parameters,
            banking_parameters: analyticsCompany.banking_parameters || baseCompany.banking_parameters,

            // Use main table for detailed extracted data (more complete), but enhance with analytics if needed
            extracted_data: analyticsCompany.extracted_data,
            risk_analysis: analyticsCompany.risk_analysis,
            processing_summary: baseCompany.processing_summary || analyticsCompany.processing_summary
        }
    }

    /**
     * Search companies with full-text search using analytics table
     * Supports searching across company names, industry, CIN, PAN, and other flattened fields
     */
    async searchCompanies(
        searchQuery: string,
        filters?: FilterCriteria,
        pagination?: PaginationParams,
        userId?: string
    ): Promise<SearchResult> {
        const supabase = await this.getSupabaseClient()
        const startTime = Date.now()

        // Build search query with text search and filters using analytics table
        let query = supabase
            .from('document_processing_requests')
            .select(`id, request_id, user_id, organization_id, original_filename,
            company_name, industry, risk_score, risk_grade, recommended_limit,
            currency, status, submitted_at, processing_started_at, completed_at,
            file_size, file_extension, s3_upload_key, s3_folder_path,
            pdf_filename, pdf_s3_key, pdf_file_size, model_type,
            total_parameters, available_parameters, financial_parameters,
            business_parameters, hygiene_parameters, banking_parameters,
            error_message, retry_count, created_at, updated_at, risk_analysis`, { count: 'exact' })
            .eq('processing_status', 'completed')

        // Filter by user_id for security
        if (userId) {
            query = query.eq('user_id', userId)
        }

        // Apply text search across multiple indexed fields
        if (searchQuery.trim()) {
            // Search in company name, legal name, CIN, PAN, industry
            query = query.or(`
                company_name.ilike.%${searchQuery}%,
                legal_name.ilike.%${searchQuery}%,
                cin.ilike.%${searchQuery}%,
                pan.ilike.%${searchQuery}%,
                industry.ilike.%${searchQuery}%,
                business_city.ilike.%${searchQuery}%,
                business_state.ilike.%${searchQuery}%,
                registered_city.ilike.%${searchQuery}%,
                registered_state.ilike.%${searchQuery}%
            `)
        }

        // Apply additional filters
        if (filters) {
            query = this.applyAnalyticsFilters(query, filters)
        }

        // Apply pagination
        const page = pagination?.page || 1
        const limit = pagination?.limit || 20
        const offset = ((page - 1) * limit)

        query = query.range(offset, offset + limit - 1)
            .order('completed_at', { ascending: false })

        const { data, error, count } = await query

        if (error) {
            throw new Error(`Search failed: ${error.message}`)
        }

        const companies = (data || []).map((row) => this.transformAnalyticsToPortfolioCompany(row))
        const searchTime = Date.now() - startTime

        return {
            companies,
            total_matches: count || 0,
            search_time_ms: searchTime
        }
    }

    /**
     * Update company data and trigger reprocessing if needed
     * Allows modification of company information and extracted data
     */
    async updateCompanyData(
        requestId: string,
        updates: Partial<PortfolioCompany>
    ): Promise<PortfolioCompany> {
        const supabase = await this.getSupabaseClient()

        // Prepare update data by transforming PortfolioCompany back to database format
        const updateData: Partial<DocumentProcessingRequest> = {
            updated_at: new Date().toISOString()
        }

        // Map PortfolioCompany fields to database fields
        if (updates.company_name !== undefined) updateData.company_name = updates.company_name
        if (updates.industry !== undefined) updateData.industry = updates.industry
        if (updates.risk_score !== undefined) updateData.risk_score = updates.risk_score
        if (updates.risk_grade !== undefined) updateData.risk_grade = updates.risk_grade
        if (updates.recommended_limit !== undefined) updateData.recommended_limit = updates.recommended_limit
        if (updates.currency !== undefined) updateData.currency = updates.currency
        if (updates.extracted_data !== undefined) updateData.extracted_data = updates.extracted_data
        if (updates.risk_analysis !== undefined) updateData.risk_analysis = updates.risk_analysis as Json

        const { data, error } = await supabase
            .from('document_processing_requests')
            .update(updateData)
            .eq('request_id', requestId)
            .select()
            .single()

        if (error) {
            throw new Error(`Failed to update company data: ${error.message}`)
        }

        return this.transformToPortfolioCompany(data)
    }

    /**
     * Apply filters using analytics table columns for efficient filtering
     */
    private applyAnalyticsFilters(query: any, filters: FilterCriteria) {
        // Risk-based filters using direct columns
        if (filters.risk_grades && filters.risk_grades.length > 0) {
            query = query.in('risk_grade', filters.risk_grades)
        }

        if (filters.risk_score_range) {
            const [min, max] = filters.risk_score_range
            query = query.gte('risk_score', min).lte('risk_score', max)
        }

        // Business filters using indexed columns
        if (filters.industries && filters.industries.length > 0) {
            query = query.in('industry', filters.industries)
        }

        if (filters.regions && filters.regions.length > 0) {
            // Use both region and state columns for comprehensive filtering
            query = query.or(`region.in.(${filters.regions.join(',')}),state.in.(${filters.regions.join(',')}),business_state.in.(${filters.regions.join(',')}),registered_state.in.(${filters.regions.join(',')})`)
        }

        if (filters.recommended_limit_range) {
            const [min, max] = filters.recommended_limit_range
            query = query.gte('recommended_limit', min).lte('recommended_limit', max)
        }

        // Processing filters
        if (filters.processing_status && filters.processing_status.length > 0) {
            query = query.in('processing_status', filters.processing_status)
        }

        if (filters.date_range) {
            const [startDate, endDate] = filters.date_range
            query = query.gte('completed_at', startDate.toISOString())
                .lte('completed_at', endDate.toISOString())
        }

        // Financial metrics filters using direct column access
        if (filters.ebitda_margin_range) {
            const [min, max] = filters.ebitda_margin_range
            query = query.gte('ebitda_margin_value', min).lte('ebitda_margin_value', max)
        }

        if (filters.debt_equity_range) {
            const [min, max] = filters.debt_equity_range
            query = query.gte('debt_equity_value', min).lte('debt_equity_value', max)
        }

        if (filters.current_ratio_range) {
            const [min, max] = filters.current_ratio_range
            query = query.gte('current_ratio_value', min).lte('current_ratio_value', max)
        }

        // Additional financial filters
        if (filters.revenue_range) {
            const [min, max] = filters.revenue_range
            query = query.gte('revenue', min).lte('revenue', max)
        }

        if (filters.net_worth_range) {
            const [min, max] = filters.net_worth_range
            query = query.gte('total_equity', min).lte('total_equity', max)
        }

        // Compliance filters using flattened columns
        if (filters.gst_compliance_status && filters.gst_compliance_status.length > 0) {
            query = query.in('gst_compliance_status', filters.gst_compliance_status)
        }

        if (filters.epfo_compliance_status && filters.epfo_compliance_status.length > 0) {
            query = query.in('epfo_compliance_status', filters.epfo_compliance_status)
        }

        if (filters.audit_qualification_status && filters.audit_qualification_status.length > 0) {
            query = query.in('audit_qualification_status', filters.audit_qualification_status)
        }

        // Company type filters
        if (filters.listing_status && filters.listing_status.length > 0) {
            query = query.in('listing_status', filters.listing_status)
        }

        if (filters.company_status && filters.company_status.length > 0) {
            query = query.in('company_status', filters.company_status)
        }

        return query
    }

    /**
     * Apply filters to the Supabase query
     * Handles all filter types including risk, business, financial, and compliance filters
     */
    private applyFilters(query: any, filters: FilterCriteria) {
        // Risk-based filters
        if (filters.risk_grades && filters.risk_grades.length > 0) {
            query = query.in('risk_grade', filters.risk_grades)
        }

        if (filters.risk_score_range) {
            const [min, max] = filters.risk_score_range
            query = query.gte('risk_score', min).lte('risk_score', max)
        }

        // Business filters
        if (filters.industries && filters.industries.length > 0) {
            query = query.in('industry', filters.industries)
        }

        if (filters.recommended_limit_range) {
            const [min, max] = filters.recommended_limit_range
            query = query.gte('recommended_limit', min).lte('recommended_limit', max)
        }

        // Processing filters
        if (filters.processing_status && filters.processing_status.length > 0) {
            query = query.in('status', filters.processing_status)
        }

        if (filters.date_range) {
            const [startDate, endDate] = filters.date_range
            query = query.gte('completed_at', startDate.toISOString())
                .lte('completed_at', endDate.toISOString())
        }

        // Region filters using extracted data
        if (filters.regions && filters.regions.length > 0) {
            const regionFilters = filters.regions.map(region =>
                `extracted_data->about_company->registered_address->>state.eq.${region},` +
                `extracted_data->about_company->business_address->>state.eq.${region}`
            ).join(',')
            query = query.or(regionFilters)
        }

        // Compliance filters using extracted data
        if (filters.gst_compliance_status && filters.gst_compliance_status.length > 0) {
            // This is complex to filter at DB level, will be handled in post-processing
            // For now, we'll fetch all and filter in memory for compliance status
        }

        if (filters.epfo_compliance_status && filters.epfo_compliance_status.length > 0) {
            // This is complex to filter at DB level, will be handled in post-processing
        }

        if (filters.audit_qualification_status && filters.audit_qualification_status.length > 0) {
            // This is complex to filter at DB level, will be handled in post-processing
        }

        // Financial metrics filters - these require post-processing due to JSONB complexity
        if (filters.ebitda_margin_range || filters.debt_equity_range || filters.current_ratio_range) {
            // Will be handled in post-processing
        }

        return query
    }

    /**
     * Apply client-side filters for complex criteria that can't be handled efficiently at DB level
     */
    private applyClientSideFilters(companies: PortfolioCompany[], filters?: FilterCriteria): PortfolioCompany[] {
        if (!filters) return companies

        let filteredCompanies = [...companies]

        // GST Compliance filter
        if (filters.gst_compliance_status && filters.gst_compliance_status.length > 0) {
            filteredCompanies = filteredCompanies.filter(company => {
                const gstRecords = company.extracted_data?.gst_records
                if (!gstRecords) {
                    return filters.gst_compliance_status!.includes('Unknown')
                }

                const activeGSTINs = gstRecords.active_gstins || []
                const hasRegularCompliance = activeGSTINs.some(gstin =>
                    gstin.compliance_status === 'Regular'
                )
                const hasIrregularCompliance = activeGSTINs.some(gstin =>
                    gstin.compliance_status === 'Irregular'
                )

                if (hasRegularCompliance && filters.gst_compliance_status!.includes('Regular')) return true
                if (hasIrregularCompliance && filters.gst_compliance_status!.includes('Irregular')) return true
                if (!hasRegularCompliance && !hasIrregularCompliance && filters.gst_compliance_status!.includes('Unknown')) return true

                return false
            })
        }

        // EPFO Compliance filter
        if (filters.epfo_compliance_status && filters.epfo_compliance_status.length > 0) {
            filteredCompanies = filteredCompanies.filter(company => {
                const epfoRecords = company.extracted_data?.epfo_records
                if (!epfoRecords) {
                    return filters.epfo_compliance_status!.includes('Unknown')
                }

                const establishments = epfoRecords.establishments || []
                const hasRegularCompliance = establishments.some(est =>
                    est.compliance_status === 'Regular'
                )
                const hasIrregularCompliance = establishments.some(est =>
                    est.compliance_status === 'Irregular'
                )

                if (hasRegularCompliance && filters.epfo_compliance_status!.includes('Regular')) return true
                if (hasIrregularCompliance && filters.epfo_compliance_status!.includes('Irregular')) return true
                if (!hasRegularCompliance && !hasIrregularCompliance && filters.epfo_compliance_status!.includes('Unknown')) return true

                return false
            })
        }

        // Audit Qualification filter
        if (filters.audit_qualification_status && filters.audit_qualification_status.length > 0) {
            filteredCompanies = filteredCompanies.filter(company => {
                const auditQualifications = company.extracted_data?.audit_qualifications
                if (!auditQualifications || auditQualifications.length === 0) {
                    return filters.audit_qualification_status!.includes('Unknown')
                }

                const hasQualified = auditQualifications.some(audit =>
                    audit.qualification_type === 'Unqualified'
                )
                const hasUnqualified = auditQualifications.some(audit =>
                    audit.qualification_type === 'Qualified'
                )

                if (hasQualified && filters.audit_qualification_status!.includes('Qualified')) return true
                if (hasUnqualified && filters.audit_qualification_status!.includes('Unqualified')) return true
                if (!hasQualified && !hasUnqualified && filters.audit_qualification_status!.includes('Unknown')) return true

                return false
            })
        }

        // Financial metrics filters
        if (filters.ebitda_margin_range || filters.debt_equity_range || filters.current_ratio_range) {
            filteredCompanies = filteredCompanies.filter(company => {
                const financialData = company.extracted_data["Standalone Financial Data"]
                if (!financialData || !financialData.years || financialData.years.length === 0) {
                    return false
                }

                const latestYear = financialData.years[financialData.years.length - 1]

                // EBITDA Margin filter
                if (filters.ebitda_margin_range) {
                    const ebitdaMargin = financialData.ratios?.profitability?.ebitda_margin?.[latestYear]
                    if (ebitdaMargin !== undefined) {
                        const [min, max] = filters.ebitda_margin_range
                        if (ebitdaMargin < min || ebitdaMargin > max) return false
                    }
                }

                // Debt-to-Equity filter
                if (filters.debt_equity_range) {
                    const debtEquity = financialData.ratios?.leverage?.debt_equity?.[latestYear]
                    if (debtEquity !== undefined) {
                        const [min, max] = filters.debt_equity_range
                        if (debtEquity < min || debtEquity > max) return false
                    }
                }

                // Current Ratio filter
                if (filters.current_ratio_range) {
                    const currentRatio = financialData.ratios?.liquidity?.current_ratio?.[latestYear]
                    if (currentRatio !== undefined) {
                        const [min, max] = filters.current_ratio_range
                        if (currentRatio < min || currentRatio > max) return false
                    }
                }

                return true
            })
        }

        // Region filter (if not handled at DB level)
        if (filters.regions && filters.regions.length > 0) {
            filteredCompanies = filteredCompanies.filter(company => {
                const registeredAddress = company.extracted_data?.about_company?.registered_address
                const businessAddress = company.extracted_data?.about_company?.business_address

                const registeredState = registeredAddress?.state
                const businessState = businessAddress?.state

                return filters.regions!.some(region =>
                    registeredState === region || businessState === region
                )
            })
        }

        return filteredCompanies
    }

    /**
 * Build parameter scores array from flattened analytics data
 */
    private buildParameterScoresArray(analyticsRow: PortfolioAnalytics): ParameterScore[] {
        const parameters: ParameterScore[] = []

        // Financial parameters
        if (analyticsRow.sales_trend_score !== null) {
            parameters.push({
                parameter: 'Sales Trend',
                category: 'financial',
                score: analyticsRow.sales_trend_score,
                value: analyticsRow.sales_trend_value || 'N/A',
                benchmark: analyticsRow.sales_trend_benchmark || 'N/A',
                weight: 1.0,
                description: 'Year-over-year revenue growth trend analysis'
            })
        }

        if (analyticsRow.ebitda_margin_score !== null) {
            parameters.push({
                parameter: 'EBITDA Margin',
                category: 'financial',
                score: analyticsRow.ebitda_margin_score,
                value: analyticsRow.ebitda_margin_value ? `${analyticsRow.ebitda_margin_value}%` : 'N/A',
                benchmark: analyticsRow.ebitda_margin_benchmark || 'N/A',
                weight: 1.5,
                description: 'Earnings before interest, taxes, depreciation, and amortization as percentage of revenue'
            })
        }

        if (analyticsRow.finance_cost_score !== null) {
            parameters.push({
                parameter: 'Finance Cost as % of Revenue',
                category: 'financial',
                score: analyticsRow.finance_cost_score,
                value: `${analyticsRow.finance_cost_value}%`,
                benchmark: analyticsRow.finance_cost_benchmark || ''
            })
        }

        if (analyticsRow.tol_tnw_score !== null) {
            parameters.push({
                parameter: 'TOL/TNW (Total Outside Liabilities / Tangible Net Worth)',
                category: 'financial',
                score: analyticsRow.tol_tnw_score,
                value: analyticsRow.tol_tnw_value || 0,
                benchmark: analyticsRow.tol_tnw_benchmark || ''
            })
        }

        if (analyticsRow.debt_equity_score !== null) {
            parameters.push({
                parameter: 'D/E Ratio',
                category: 'financial',
                score: analyticsRow.debt_equity_score,
                value: analyticsRow.debt_equity_value ? analyticsRow.debt_equity_value.toString() : 'N/A',
                benchmark: analyticsRow.debt_equity_benchmark || 'N/A',
                weight: 1.3,
                description: 'Total debt divided by total equity - measures financial leverage'
            })
        }

        if (analyticsRow.interest_coverage_score !== null) {
            parameters.push({
                parameter: 'Interest Coverage Ratio',
                category: 'financial',
                score: analyticsRow.interest_coverage_score,
                value: `${analyticsRow.interest_coverage_value}x`,
                benchmark: analyticsRow.interest_coverage_benchmark || ''
            })
        }

        if (analyticsRow.roce_score !== null) {
            parameters.push({
                parameter: 'ROCE (Return on Capital Employed)',
                category: 'financial',
                score: analyticsRow.roce_score,
                value: `${analyticsRow.roce_value}%`,
                benchmark: analyticsRow.roce_benchmark || ''
            })
        }

        if (analyticsRow.inventory_days_score !== null) {
            parameters.push({
                parameter: 'Inventory Holding Days',
                category: 'financial',
                score: analyticsRow.inventory_days_score,
                value: `${analyticsRow.inventory_days_value} days`,
                benchmark: analyticsRow.inventory_days_benchmark || ''
            })
        }

        if (analyticsRow.debtors_days_score !== null) {
            parameters.push({
                parameter: 'Debtors Holding Days',
                category: 'financial',
                score: analyticsRow.debtors_days_score,
                value: `${analyticsRow.debtors_days_value} days`,
                benchmark: analyticsRow.debtors_days_benchmark || ''
            })
        }

        if (analyticsRow.creditors_days_score !== null) {
            parameters.push({
                parameter: 'Creditors Holding Days',
                category: 'financial',
                score: analyticsRow.creditors_days_score,
                value: `${analyticsRow.creditors_days_value} days`,
                benchmark: analyticsRow.creditors_days_benchmark || ''
            })
        }

        if (analyticsRow.current_ratio_score !== null) {
            parameters.push({
                parameter: 'Current Ratio',
                category: 'financial',
                score: analyticsRow.current_ratio_score,
                value: analyticsRow.current_ratio_value ? analyticsRow.current_ratio_value.toString() : 'N/A',
                benchmark: analyticsRow.current_ratio_benchmark || 'N/A',
                weight: 1.2,
                description: 'Current assets divided by current liabilities - measures short-term liquidity'
            })
        }

        if (analyticsRow.quick_ratio_score !== null) {
            parameters.push({
                parameter: 'Quick Ratio',
                category: 'financial',
                score: analyticsRow.quick_ratio_score,
                value: analyticsRow.quick_ratio_value || 0,
                benchmark: analyticsRow.quick_ratio_benchmark || ''
            })
        }

        if (analyticsRow.pat_score !== null) {
            parameters.push({
                parameter: 'PAT',
                category: 'financial',
                score: analyticsRow.pat_score,
                value: `${analyticsRow.pat_value}%`,
                benchmark: analyticsRow.pat_benchmark || ''
            })
        }

        if (analyticsRow.ncatd_score !== null) {
            parameters.push({
                parameter: 'NCATD',
                category: 'financial',
                score: analyticsRow.ncatd_score,
                value: analyticsRow.ncatd_value || 0,
                benchmark: analyticsRow.ncatd_benchmark || ''
            })
        }

        if (analyticsRow.diversion_funds_score !== null) {
            parameters.push({
                parameter: 'Diversion of Funds',
                category: 'financial',
                score: analyticsRow.diversion_funds_score,
                value: `${analyticsRow.diversion_funds_value}%`,
                benchmark: analyticsRow.diversion_funds_benchmark || ''
            })
        }

        // Business parameters
        if (analyticsRow.constitution_entity_score !== null) {
            parameters.push({
                parameter: 'Constitution of Entity',
                category: 'business',
                score: analyticsRow.constitution_entity_score,
                value: analyticsRow.constitution_entity_value || '',
                benchmark: analyticsRow.constitution_entity_benchmark || ''
            })
        }

        if (analyticsRow.rating_type_score !== null) {
            parameters.push({
                parameter: 'Rating Type',
                category: 'business',
                score: analyticsRow.rating_type_score,
                value: analyticsRow.rating_type_value || '',
                benchmark: analyticsRow.rating_type_benchmark || ''
            })
        }

        if (analyticsRow.vintage_score !== null) {
            parameters.push({
                parameter: 'Managerial / Promoter Vintage',
                category: 'business',
                score: analyticsRow.vintage_score,
                value: analyticsRow.vintage_value || '',
                benchmark: analyticsRow.vintage_benchmark || ''
            })
        }

        // Hygiene parameters
        if (analyticsRow.gst_compliance_score !== null) {
            parameters.push({
                parameter: 'Statutory Payments (GST)',
                category: 'hygiene',
                score: analyticsRow.gst_compliance_score,
                value: analyticsRow.gst_compliance_value || '',
                benchmark: analyticsRow.gst_compliance_benchmark || ''
            })
        }

        if (analyticsRow.pf_compliance_score !== null) {
            parameters.push({
                parameter: 'Statutory Payments (PF)',
                category: 'hygiene',
                score: analyticsRow.pf_compliance_score,
                value: analyticsRow.pf_compliance_value || '',
                benchmark: analyticsRow.pf_compliance_benchmark || ''
            })
        }

        if (analyticsRow.recent_charges_score !== null) {
            parameters.push({
                parameter: 'Recent Charges by Bankers',
                category: 'hygiene',
                score: analyticsRow.recent_charges_score,
                value: analyticsRow.recent_charges_value || '',
                benchmark: analyticsRow.recent_charges_benchmark || ''
            })
        }

        // Banking parameters
        if (analyticsRow.primary_banker_score !== null) {
            parameters.push({
                parameter: 'Primary Banker - Limit Funded',
                category: 'banking',
                score: analyticsRow.primary_banker_score,
                value: analyticsRow.primary_banker_value || '',
                benchmark: analyticsRow.primary_banker_benchmark || ''
            })
        }

        return parameters
    }

    /**
     * Transform analytics record to PortfolioCompany interface
     */
    private transformAnalyticsToPortfolioCompany(analyticsRow: any): PortfolioCompany {
        // Determine the financial year - use 2023 as default but could be enhanced
        const currentYear = '2023'
        const years = [currentYear]

        // Create a comprehensive extracted_data structure from flattened analytics data
        const extractedData = {
            about_company: {
                legal_name: analyticsRow.legal_name || analyticsRow.company_name,
                cin: analyticsRow.cin,
                pan: analyticsRow.pan,
                company_status: analyticsRow.company_status,
                active_compliance: analyticsRow.active_compliance,
                paid_up_capital_cr: analyticsRow.paid_up_capital_cr,
                authorised_capital_cr: analyticsRow.authorised_capital_cr,
                sum_of_charges_cr: analyticsRow.sum_of_charges_cr,
                date_of_incorporation: analyticsRow.date_of_incorporation,
                date_of_last_agm: analyticsRow.date_of_last_agm,
                type_of_entity: analyticsRow.type_of_entity,
                listing_status: analyticsRow.listing_status,
                lei: analyticsRow.lei,
                website: analyticsRow.website,
                email: analyticsRow.email,
                phone: analyticsRow.phone,
                registered_address: {
                    city: analyticsRow.registered_city,
                    state: analyticsRow.registered_state,
                    pin_code: analyticsRow.registered_pin_code,
                    address_line_1: analyticsRow.registered_address_line_1,
                    address_line_2: analyticsRow.registered_address_line_2
                },
                business_address: {
                    city: analyticsRow.business_city,
                    state: analyticsRow.business_state,
                    pin_code: analyticsRow.business_pin_code,
                    address_line_1: analyticsRow.business_address_line_1,
                    address_line_2: analyticsRow.business_address_line_2
                },
                segment: analyticsRow.segment,
                broad_industry_category: analyticsRow.broad_industry_category,
                about_the_company: analyticsRow.about_the_company
            },
            financial_data: {
                years: years,
                profit_loss: {
                    revenue: analyticsRow.revenue ? [analyticsRow.revenue] : [0],
                    ebitda: analyticsRow.ebitda ? [analyticsRow.ebitda] : [0],
                    net_profit: analyticsRow.net_profit ? [analyticsRow.net_profit] : [0],
                    gross_profit: analyticsRow.ebitda ? [analyticsRow.ebitda] : [0], // Use EBITDA as proxy
                    operating_profit: analyticsRow.ebitda ? [analyticsRow.ebitda] : [0],
                    pbt: analyticsRow.net_profit ? [analyticsRow.net_profit] : [0], // Use net profit as proxy
                    finance_cost: analyticsRow.revenue && analyticsRow.finance_cost_value ?
                        [(analyticsRow.revenue * analyticsRow.finance_cost_value) / 100] : [0]
                },
                balance_sheet: {
                    assets: {
                        total_assets: analyticsRow.total_assets ? [analyticsRow.total_assets] : [0],
                        current_assets: analyticsRow.current_assets ? [analyticsRow.current_assets] : [0],
                        non_current_assets: analyticsRow.total_assets && analyticsRow.current_assets ?
                            [analyticsRow.total_assets - analyticsRow.current_assets] : [0],
                        fixed_assets: analyticsRow.total_assets && analyticsRow.current_assets ?
                            [analyticsRow.total_assets - analyticsRow.current_assets] : [0],
                        investments: [0], // Not available in analytics table
                        inventory: analyticsRow.current_assets ? [analyticsRow.current_assets * 0.3] : [0], // Estimate
                        trade_receivables: analyticsRow.revenue && analyticsRow.debtors_days_value ?
                            [(analyticsRow.revenue * analyticsRow.debtors_days_value) / 365] : [0],
                        cash_and_equivalents: analyticsRow.current_assets ? [analyticsRow.current_assets * 0.2] : [0] // Estimate
                    },
                    liabilities: {
                        total_liabilities: analyticsRow.total_assets && analyticsRow.total_equity ?
                            [analyticsRow.total_assets - analyticsRow.total_equity] : [0],
                        current_liabilities: analyticsRow.current_liabilities ? [analyticsRow.current_liabilities] : [0],
                        non_current_liabilities: analyticsRow.long_term_borrowings ? [analyticsRow.long_term_borrowings] : [0],
                        long_term_borrowings: analyticsRow.long_term_borrowings ? [analyticsRow.long_term_borrowings] : [0],
                        short_term_borrowings: analyticsRow.short_term_borrowings ? [analyticsRow.short_term_borrowings] : [0],
                        trade_payables: analyticsRow.revenue && analyticsRow.creditors_days_value ?
                            [(analyticsRow.revenue * analyticsRow.creditors_days_value) / 365] : [0],
                        total_debt: (analyticsRow.long_term_borrowings || 0) + (analyticsRow.short_term_borrowings || 0) ?
                            [(analyticsRow.long_term_borrowings || 0) + (analyticsRow.short_term_borrowings || 0)] : [0]
                    },
                    equity: {
                        total_equity: analyticsRow.total_equity ? [analyticsRow.total_equity] : [0],
                        paid_up_capital: analyticsRow.paid_up_capital_cr ? [analyticsRow.paid_up_capital_cr] : [0],
                        reserves_surplus: analyticsRow.total_equity && analyticsRow.paid_up_capital_cr ?
                            [analyticsRow.total_equity - analyticsRow.paid_up_capital_cr] : [0]
                    }
                },
                ratios: {
                    liquidity: {
                        current_ratio: analyticsRow.current_ratio_value ? { [currentYear]: analyticsRow.current_ratio_value } : {},
                        quick_ratio: analyticsRow.quick_ratio_value ? { [currentYear]: analyticsRow.quick_ratio_value } : {},
                        cash_ratio: {} // Not available
                    },
                    leverage: {
                        debt_equity: analyticsRow.debt_equity_value ? { [currentYear]: analyticsRow.debt_equity_value } : {},
                        debt_to_assets: {}, // Could be calculated
                        tol_tnw: analyticsRow.tol_tnw_value ? { [currentYear]: analyticsRow.tol_tnw_value } : {},
                        equity_multiplier: {} // Not available
                    },
                    profitability: {
                        gross_margin: {}, // Not directly available
                        operating_margin: {}, // Not directly available
                        ebitda_margin: analyticsRow.ebitda_margin_value ? { [currentYear]: analyticsRow.ebitda_margin_value } : {},
                        net_margin: analyticsRow.pat_value ? { [currentYear]: analyticsRow.pat_value } : {},
                        roa: {}, // Not directly available
                        roe: {}, // Not directly available
                        roce: analyticsRow.roce_value ? { [currentYear]: analyticsRow.roce_value } : {},
                        pat: analyticsRow.pat_value ? { [currentYear]: analyticsRow.pat_value } : {}
                    },
                    efficiency: {
                        asset_turnover: {}, // Not directly available
                        inventory_turnover: {}, // Could be calculated
                        receivables_turnover: {}, // Could be calculated
                        payables_turnover: {}, // Could be calculated
                        inventory_days: analyticsRow.inventory_days_value ? { [currentYear]: analyticsRow.inventory_days_value } : {},
                        debtors_days: analyticsRow.debtors_days_value ? { [currentYear]: analyticsRow.debtors_days_value } : {},
                        creditors_days: analyticsRow.creditors_days_value ? { [currentYear]: analyticsRow.creditors_days_value } : {},
                        working_capital_days: {} // Could be calculated
                    },
                    coverage: {
                        interest_coverage: analyticsRow.interest_coverage_value ? { [currentYear]: analyticsRow.interest_coverage_value } : {},
                        debt_service_coverage: {}, // Not available
                        fixed_charge_coverage: {} // Not available
                    }
                },
                cash_flow: {
                    operating_cash_flow: [0], // Not available in analytics table
                    investing_cash_flow: [0],
                    financing_cash_flow: [0],
                    net_cash_flow: [0],
                    free_cash_flow: [0]
                }
            },
            gst_records: {
                active_gstins: analyticsRow.gst_active_count ?
                    Array(analyticsRow.gst_active_count).fill({
                        gstin: 'N/A',
                        compliance_status: this.mapGSTComplianceStatus(analyticsRow.gst_compliance_status),
                        registration_date: null,
                        last_return_filed: null,
                        status: 'Active'
                    }) : [],
                compliance_summary: {
                    total_gstins: analyticsRow.gst_active_count || 0,
                    active_gstins: analyticsRow.gst_active_count || 0,
                    compliance_rate: analyticsRow.gst_compliance_status?.toLowerCase().includes('regular') ? 100 :
                        analyticsRow.gst_compliance_status?.toLowerCase().includes('irregular') ? 50 : 0
                }
            },
            epfo_records: {
                establishments: analyticsRow.epfo_establishment_count ?
                    Array(analyticsRow.epfo_establishment_count).fill({
                        establishment_id: 'N/A',
                        compliance_status: this.mapEPFOComplianceStatus(analyticsRow.epfo_compliance_status),
                        registration_date: null,
                        last_challan_paid: null,
                        employee_count: null
                    }) : [],
                compliance_summary: {
                    total_establishments: analyticsRow.epfo_establishment_count || 0,
                    active_establishments: analyticsRow.epfo_establishment_count || 0,
                    compliance_rate: analyticsRow.epfo_compliance_status?.toLowerCase().includes('regular') ? 100 :
                        analyticsRow.epfo_compliance_status?.toLowerCase().includes('irregular') ? 50 : 0
                }
            },
            audit_qualifications: analyticsRow.audit_qualification_status ?
                [{
                    year: currentYear,
                    qualification_type: analyticsRow.audit_qualification_status,
                    auditor_name: 'N/A',
                    qualification_details: null
                }] : [],
            directors: [], // Not available in analytics table
            charges: analyticsRow.sum_of_charges_cr ? [{
                charge_amount: analyticsRow.sum_of_charges_cr,
                charge_holder: 'N/A',
                creation_date: null,
                satisfaction_date: null,
                status: 'Active'
            }] : []
        }

        // Build parameter scores from flattened data
        const allScores = this.buildParameterScoresArray(analyticsRow)

        const riskAnalysis: any = {
            overall_score: analyticsRow.risk_score,
            overall_grade: analyticsRow.risk_grade,
            overall_percentage: analyticsRow.overall_percentage,
            risk_category: analyticsRow.risk_category,
            risk_multiplier: analyticsRow.risk_multiplier,
            category_scores: {
                financial: {
                    score: analyticsRow.financial_score,
                    max_score: analyticsRow.financial_max_score,
                    percentage: analyticsRow.financial_percentage,
                    count: analyticsRow.financial_count,
                    total: analyticsRow.financial_total
                },
                business: {
                    score: analyticsRow.business_score,
                    max_score: analyticsRow.business_max_score,
                    percentage: analyticsRow.business_percentage,
                    count: analyticsRow.business_count,
                    total: analyticsRow.business_total
                },
                hygiene: {
                    score: analyticsRow.hygiene_score,
                    max_score: analyticsRow.hygiene_max_score,
                    percentage: analyticsRow.hygiene_percentage,
                    count: analyticsRow.hygiene_count,
                    total: analyticsRow.hygiene_total
                },
                banking: {
                    score: analyticsRow.banking_score,
                    max_score: analyticsRow.banking_max_score,
                    percentage: analyticsRow.banking_percentage,
                    count: analyticsRow.banking_count,
                    total: analyticsRow.banking_total
                }
            },
            allScores,
            model_id: analyticsRow.model_id,
            risk_factors: {
                positive_factors: allScores.filter(score => score.score > 3).map(score => score.parameter),
                negative_factors: allScores.filter(score => score.score < 0).map(score => score.parameter),
                neutral_factors: allScores.filter(score => score.score >= 0 && score.score <= 3).map(score => score.parameter)
            },
            recommendations: this.generateRiskRecommendations(analyticsRow.risk_grade, allScores)
        }

        return {
            id: analyticsRow.id,
            request_id: analyticsRow.request_id,
            user_id: '', // Not available in analytics table
            organization_id: '', // Not available in analytics table
            original_filename: '', // Not available in analytics table
            company_name: analyticsRow.company_name,
            industry: analyticsRow.industry,
            risk_score: analyticsRow.risk_score,
            risk_grade: analyticsRow.risk_grade,
            recommended_limit: analyticsRow.recommended_limit,
            currency: 'INR', // Default currency
            status: analyticsRow.processing_status as any,
            submitted_at: '', // Not available in analytics table
            processing_started_at: '', // Not available in analytics table
            completed_at: analyticsRow.completed_at,
            file_size: null,
            file_extension: '',
            s3_upload_key: '',
            s3_folder_path: '',
            pdf_filename: null,
            pdf_s3_key: null,
            pdf_file_size: null,
            model_type: analyticsRow.model_type as any,
            total_parameters: (analyticsRow.financial_total || 0) + (analyticsRow.business_total || 0) +
                (analyticsRow.hygiene_total || 0) + (analyticsRow.banking_total || 0),
            available_parameters: (analyticsRow.financial_count || 0) + (analyticsRow.business_count || 0) +
                (analyticsRow.hygiene_count || 0) + (analyticsRow.banking_count || 0),
            financial_parameters: analyticsRow.financial_count,
            business_parameters: analyticsRow.business_count,
            hygiene_parameters: analyticsRow.hygiene_count,
            banking_parameters: analyticsRow.banking_count,
            error_message: null,
            retry_count: null,
            extracted_data: extractedData,
            risk_analysis: riskAnalysis,
            processing_summary: {
                base_eligibility: analyticsRow.base_eligibility,
                final_eligibility: analyticsRow.final_eligibility,
                turnover_cr: analyticsRow.turnover_cr || analyticsRow.revenue,
                net_worth_cr: analyticsRow.net_worth_cr || analyticsRow.total_equity,
                processing_time_ms: null, // Not available
                model_version: analyticsRow.model_id,
                data_completeness: {
                    financial: (analyticsRow.financial_count || 0) / (analyticsRow.financial_total || 1) * 100,
                    business: (analyticsRow.business_count || 0) / (analyticsRow.business_total || 1) * 100,
                    hygiene: (analyticsRow.hygiene_count || 0) / (analyticsRow.hygiene_total || 1) * 100,
                    banking: (analyticsRow.banking_count || 0) / (analyticsRow.banking_total || 1) * 100
                }
            },
            created_at: analyticsRow.created_at,
            updated_at: analyticsRow.updated_at
        }
    }

    /**
     * Map GST compliance status from analytics table to standard format
     */
    private mapGSTComplianceStatus(status: string | null): string {
        if (!status) return 'Unknown'
        if (status.toLowerCase().includes('regular')) return 'Regular'
        if (status.toLowerCase().includes('irregular')) return 'Irregular'
        return status
    }

    /**
     * Map EPFO compliance status from analytics table to standard format
     */
    private mapEPFOComplianceStatus(status: string | null): string {
        if (!status) return 'Unknown'
        if (status.toLowerCase().includes('regular')) return 'Regular'
        if (status.toLowerCase().includes('irregular')) return 'Irregular'
        return status
    }

    /**
     * Generate risk recommendations based on risk grade and parameter scores
     */
    private generateRiskRecommendations(riskGrade: string | null, allScores: ParameterScore[]): string[] {
        const recommendations: string[] = []

        if (!riskGrade) return recommendations

        // Grade-based recommendations
        switch (riskGrade.toLowerCase()) {
            case 'cm1':
                recommendations.push('Excellent credit profile - Consider premium pricing')
                recommendations.push('Suitable for higher credit limits')
                break
            case 'cm2':
                recommendations.push('Good credit profile - Standard terms applicable')
                recommendations.push('Monitor key financial ratios quarterly')
                break
            case 'cm3':
                recommendations.push('Average credit profile - Enhanced monitoring required')
                recommendations.push('Consider collateral or guarantees')
                break
            case 'cm4':
                recommendations.push('Below average credit profile - Strict monitoring required')
                recommendations.push('Limit exposure and require additional security')
                break
            case 'cm5':
            case 'cm6':
            case 'cm7':
                recommendations.push('High risk profile - Avoid or require significant mitigation')
                recommendations.push('Consider rejection or very limited exposure with strong collateral')
                break
        }

        // Parameter-specific recommendations
        const criticalRiskScores = allScores.filter(score => score.score < -3)
        const poorScores = allScores.filter(score => score.score >= -3 && score.score <= 0)

        if (criticalRiskScores.length > 0) {
            recommendations.push(`Critical risk factors identified: ${criticalRiskScores.map(s => s.parameter).join(', ')}`)
        }

        if (poorScores.length > 2) {
            recommendations.push('Multiple weak parameters - Comprehensive risk mitigation required')
        }

        return recommendations
    }

    /**
     * Transform database row to PortfolioCompany interface
     */
    private transformToPortfolioCompany(row: any): PortfolioCompany {
        return {
            id: row.id,
            request_id: row.request_id,
            user_id: row.user_id,
            organization_id: row.organization_id,
            original_filename: row.original_filename,
            company_name: row.company_name,
            industry: row.industry,
            risk_score: row.risk_score,
            risk_grade: row.risk_grade,
            recommended_limit: row.recommended_limit,
            currency: row.currency,
            status: row.status as any,
            submitted_at: row.submitted_at,
            processing_started_at: row.processing_started_at,
            completed_at: row.completed_at,
            file_size: row.file_size,
            file_extension: row.file_extension,
            s3_upload_key: row.s3_upload_key,
            s3_folder_path: row.s3_folder_path,
            pdf_filename: row.pdf_filename,
            pdf_s3_key: row.pdf_s3_key,
            pdf_file_size: row.pdf_file_size,
            model_type: row.model_type as any,
            total_parameters: row.total_parameters,
            available_parameters: row.available_parameters,
            financial_parameters: row.financial_parameters,
            business_parameters: row.business_parameters,
            hygiene_parameters: row.hygiene_parameters,
            banking_parameters: row.banking_parameters,
            error_message: row.error_message,
            retry_count: row.retry_count,
            extracted_data: row.extracted_data,
            risk_analysis: row.risk_analysis,
            processing_summary: row.processing_summary,
            created_at: row.created_at,
            updated_at: row.updated_at
        }
    }

    /**
     * Get related companies in the same industry
     */
    async getRelatedCompanies(industry: IndustryType, excludeRequestId: string, limit: number = 5, userId?: string): Promise<PortfolioCompany[]> {
        const supabase = await this.getSupabaseClient()

        let query = supabase
            .from('portfolio_analytics')
            .select(`
                *,
                document_processing_requests!inner(user_id)
            `)
            .eq('industry', industry)
            .neq('request_id', excludeRequestId)
            .order('risk_score', { ascending: true })
            .limit(limit)

        // Filter by user_id for security through the join
        if (userId) {
            query = query.eq('document_processing_requests.user_id', userId)
        }

        const { data, error } = await query

        if (error) {
            console.error('Failed to fetch related companies:', error)
            return []
        }

        return (data || []).map((row) => this.transformAnalyticsToPortfolioCompany(row))
    }

    /**
     * Get industry benchmarks for comparison
     */
    async getIndustryBenchmarks(industry: IndustryType, userId?: string) {
        const supabase = await this.getSupabaseClient()

        let query = supabase
            .from('portfolio_analytics')
            .select(`
                risk_score, 
                recommended_limit,
                document_processing_requests!inner(user_id)
            `)
            .eq('industry', industry)

        // Filter by user_id for security through the join
        if (userId) {
            query = query.eq('document_processing_requests.user_id', userId)
        }

        const { data, error } = await query

        if (error) {
            console.error('Failed to fetch industry benchmarks:', error)
            return null
        }

        if (!data || data.length === 0) {
            return null
        }

        const riskScores = data.map(d => d.risk_score).filter(Boolean) as number[]
        const limits = data.map(d => d.recommended_limit).filter(Boolean) as number[]

        return {
            industry,
            median_risk_score: this.calculateMedian(riskScores),
            median_revenue: this.calculateMedian(limits),
            median_ratios: {}, // Would extract from financial data if needed
            peer_count: data.length
        }
    }

    /**
     * Delete a company from the portfolio
     */
    async deleteCompany(requestId: string, userId?: string): Promise<void> {
        const supabase = await this.getSupabaseClient()

        let deleteQuery = supabase
            .from('document_processing_requests')
            .delete()
            .eq('request_id', requestId)

        // Filter by user_id for security
        if (userId) {
            deleteQuery = deleteQuery.eq('user_id', userId)
        }

        const { error } = await deleteQuery

        if (error) {
            throw new Error(`Failed to delete company: ${error.message}`)
        }
    }

    /**
     * Calculate median value from array of numbers
     */
    private calculateMedian(values: number[]): number {
        if (values.length === 0) return 0

        const sorted = [...values].sort((a, b) => a - b)
        const mid = Math.floor(sorted.length / 2)

        return sorted.length % 2 !== 0
            ? sorted[mid]
            : (sorted[mid - 1] + sorted[mid]) / 2
    }

    /**
     * Calculate risk distribution using direct column access from analytics table
     */
    private calculateRiskDistributionFromAnalytics(companies: any[]) {
        const distribution = {
            cm1_count: 0,
            cm2_count: 0,
            cm3_count: 0,
            cm4_count: 0,
            cm5_count: 0,
            ungraded_count: 0,
            total_count: companies.length,
            distribution_percentages: {} as Record<string, number>
        }

        companies.forEach(company => {
            const grade = company.risk_grade?.toLowerCase()
            switch (grade) {
                case 'cm1': distribution.cm1_count++; break
                case 'cm2': distribution.cm2_count++; break
                case 'cm3': distribution.cm3_count++; break
                case 'cm4': distribution.cm4_count++; break
                case 'cm5': distribution.cm5_count++; break
                default: distribution.ungraded_count++; break
            }
        })

        // Calculate percentages
        const total = distribution.total_count
        if (total > 0) {
            distribution.distribution_percentages = {
                cm1: (distribution.cm1_count / total) * 100,
                cm2: (distribution.cm2_count / total) * 100,
                cm3: (distribution.cm3_count / total) * 100,
                cm4: (distribution.cm4_count / total) * 100,
                cm5: (distribution.cm5_count / total) * 100,
                ungraded: (distribution.ungraded_count / total) * 100
            }
        }

        return distribution
    }

    /**
     * Calculate industry breakdown using indexed industry column
     */
    private calculateIndustryBreakdownFromAnalytics(companies: any[]) {
        const industryMap = new Map<string, {
            count: number
            total_exposure: number
            risk_scores: number[]
        }>()

        companies.forEach(company => {
            const industry = company.industry || 'Unknown'
            const existing = industryMap.get(industry) || {
                count: 0,
                total_exposure: 0,
                risk_scores: []
            }

            existing.count++
            existing.total_exposure += company.final_eligibility || company.recommended_limit || 0
            if (company.risk_score) {
                existing.risk_scores.push(company.risk_score)
            }

            industryMap.set(industry, existing)
        })

        const industries = Array.from(industryMap.entries()).map(([name, data]) => ({
            name,
            count: data.count,
            total_exposure: data.total_exposure,
            average_risk_score: data.risk_scores.length > 0
                ? data.risk_scores.reduce((sum, score) => sum + score, 0) / data.risk_scores.length
                : 0,
            risk_distribution: {} // Will be calculated if needed
        }))

        return { industries }
    }

    /**
     * Calculate regional distribution using flattened region/state columns
     */
    private calculateRegionalDistributionFromAnalytics(companies: any[]) {
        const regionMap = new Map<string, {
            count: number
            total_exposure: number
            risk_scores: number[]
        }>()

        companies.forEach(company => {
            const region = company.region || company.state || 'Unknown'
            const existing = regionMap.get(region) || {
                count: 0,
                total_exposure: 0,
                risk_scores: []
            }

            existing.count++
            existing.total_exposure += company.final_eligibility || company.recommended_limit || 0
            if (company.risk_score) {
                existing.risk_scores.push(company.risk_score)
            }

            regionMap.set(region, existing)
        })

        const regions = Array.from(regionMap.entries()).map(([name, data]) => ({
            name,
            count: data.count,
            total_exposure: data.total_exposure,
            average_risk_score: data.risk_scores.length > 0
                ? data.risk_scores.reduce((sum, score) => sum + score, 0) / data.risk_scores.length
                : 0
        }))

        return { regions }
    }

    /**
     * Calculate compliance metrics using flattened compliance columns
     */
    private calculateComplianceSummaryFromAnalytics(companies: any[]) {
        const gstCompliance = { compliant: 0, non_compliant: 0, unknown: 0 }
        const epfoCompliance = { compliant: 0, non_compliant: 0, unknown: 0 }
        const auditStatus = { qualified: 0, unqualified: 0, unknown: 0 }

        companies.forEach(company => {
            // GST Compliance
            switch (company.gst_compliance_status?.toLowerCase()) {
                case 'regular':
                case 'active':
                    gstCompliance.compliant++
                    break
                case 'irregular':
                case 'inactive':
                    gstCompliance.non_compliant++
                    break
                default:
                    gstCompliance.unknown++
                    break
            }

            // EPFO Compliance
            switch (company.epfo_compliance_status?.toLowerCase()) {
                case 'regular':
                case 'active':
                    epfoCompliance.compliant++
                    break
                case 'irregular':
                case 'inactive':
                    epfoCompliance.non_compliant++
                    break
                default:
                    epfoCompliance.unknown++
                    break
            }

            // Audit Status
            switch (company.audit_qualification_status?.toLowerCase()) {
                case 'unqualified':
                case 'clean':
                    auditStatus.qualified++
                    break
                case 'qualified':
                case 'adverse':
                    auditStatus.unqualified++
                    break
                default:
                    auditStatus.unknown++
                    break
            }
        })

        return {
            gst_compliance: gstCompliance,
            epfo_compliance: epfoCompliance,
            audit_status: auditStatus
        }
    }

    /**
     * Add parameter correlation analysis using individual parameter score columns
     */
    async getParameterCorrelationAnalysis(filters?: FilterCriteria): Promise<any> {
        const supabase = await this.getSupabaseClient()

        let query = supabase
            .from('portfolio_analytics')
            .select(`
                risk_score,
                financial_score, business_score, hygiene_score, banking_score,
                current_ratio_score, debt_equity_score, ebitda_margin_score,
                sales_trend_score, finance_cost_score, tol_tnw_score,
                interest_coverage_score, roce_score, inventory_days_score,
                debtors_days_score, creditors_days_score, quick_ratio_score,
                pat_score, ncatd_score, diversion_funds_score,
                constitution_entity_score, rating_type_score, vintage_score,
                gst_compliance_score, pf_compliance_score, recent_charges_score,
                primary_banker_score
            `)
            .eq('processing_status', 'completed')

        if (filters) {
            query = this.applyAnalyticsFilters(query, filters)
        }

        const { data, error } = await query

        if (error) {
            throw new Error(`Failed to fetch parameter correlation data: ${error.message}`)
        }

        // Calculate correlations between parameters and overall risk score
        return this.calculateParameterCorrelations(data || [])
    }

    /**
     * Calculate correlations between individual parameters and overall risk
     */
    private calculateParameterCorrelations(data: any[]): any {
        if (data.length === 0) return {}

        const correlations: Record<string, number> = {}
        const parameterFields = [
            'financial_score', 'business_score', 'hygiene_score', 'banking_score',
            'current_ratio_score', 'debt_equity_score', 'ebitda_margin_score',
            'sales_trend_score', 'finance_cost_score', 'tol_tnw_score',
            'interest_coverage_score', 'roce_score', 'inventory_days_score',
            'debtors_days_score', 'creditors_days_score', 'quick_ratio_score',
            'pat_score', 'ncatd_score', 'diversion_funds_score',
            'constitution_entity_score', 'rating_type_score', 'vintage_score',
            'gst_compliance_score', 'pf_compliance_score', 'recent_charges_score',
            'primary_banker_score'
        ]

        parameterFields.forEach(field => {
            const correlation = this.calculatePearsonCorrelation(
                data.map(d => d.risk_score).filter(v => v !== null),
                data.map(d => d[field]).filter(v => v !== null)
            )
            correlations[field] = correlation
        })

        return {
            correlations,
            sample_size: data.length,
            strongest_positive: Object.entries(correlations)
                .filter(([_, corr]) => corr > 0)
                .sort(([_, a], [__, b]) => b - a)
                .slice(0, 5),
            strongest_negative: Object.entries(correlations)
                .filter(([_, corr]) => corr < 0)
                .sort(([_, a], [__, b]) => a - b)
                .slice(0, 5)
        }
    }

    /**
     * Calculate Pearson correlation coefficient
     */
    private calculatePearsonCorrelation(x: number[], y: number[]): number {
        if (x.length !== y.length || x.length === 0) return 0

        const n = x.length
        const sumX = x.reduce((a, b) => a + b, 0)
        const sumY = y.reduce((a, b) => a + b, 0)
        const sumXY = x.reduce((sum, xi, i) => sum + xi * y[i], 0)
        const sumX2 = x.reduce((sum, xi) => sum + xi * xi, 0)
        const sumY2 = y.reduce((sum, yi) => sum + yi * yi, 0)

        const numerator = n * sumXY - sumX * sumY
        const denominator = Math.sqrt((n * sumX2 - sumX * sumX) * (n * sumY2 - sumY * sumY))

        return denominator === 0 ? 0 : numerator / denominator
    }

    /**
     * Calculate portfolio metrics for analytics
     */
    private async calculatePortfolioMetrics(filters?: FilterCriteria, userId?: string): Promise<PortfolioMetrics> {
        const supabase = await this.getSupabaseClient()

        try {
            // First, get count and basic aggregations using database functions
            let countQuery = supabase
                .from('document_processing_requests')
                .select(`id, request_id, user_id, organization_id, original_filename,
            company_name, industry, risk_score, risk_grade, recommended_limit,
            currency, status, submitted_at, processing_started_at, completed_at,
            file_size, file_extension, s3_upload_key, s3_folder_path,
            pdf_filename, pdf_s3_key, pdf_file_size, model_type,
            total_parameters, available_parameters, financial_parameters,
            business_parameters, hygiene_parameters, banking_parameters,
            error_message, retry_count, created_at, updated_at`, { count: 'exact', head: true })
                .eq('status', 'completed')

            // Filter by user_id for security
            if (userId) {
                countQuery = countQuery.eq('user_id', userId)
            }

            if (filters) {
                countQuery = this.applyFilters(countQuery, filters)
            }

            const { count, error: countError } = await countQuery

            if (countError) {
                throw new Error(`Failed to get portfolio count: ${countError.message}`)
            }

            // Get sample data for detailed calculations - limit to reasonable size
            let dataQuery = supabase
                .from('document_processing_requests')
                .select(`id, request_id, user_id, organization_id, original_filename,
            company_name, industry, risk_score, risk_grade, recommended_limit,
            currency, status, submitted_at, processing_started_at, completed_at,
            file_size, file_extension, s3_upload_key, s3_folder_path,
            pdf_filename, pdf_s3_key, pdf_file_size, model_type,
            total_parameters, available_parameters, financial_parameters,
            business_parameters, hygiene_parameters, banking_parameters,
            error_message, retry_count, created_at, updated_at`)
                .eq('status', 'completed')

            if (filters) {
                dataQuery = this.applyFilters(dataQuery, filters)
            }

            // Use a reasonable sample size for calculations
            const sampleSize = Math.min(count || 0, 1000)
            const { data, error } = await dataQuery.limit(sampleSize)

            if (error) {
                throw new Error(`Failed to calculate portfolio metrics: ${error.message}`)
            }

            const companies = data || []

            // Calculate basic metrics
            const totalCompanies = count || 0
            const totalExposure = companies.reduce((sum, company) =>
                sum + (company.recommended_limit || 0), 0)
            const averageRiskScore = companies.length > 0
                ? companies.reduce((sum, company) => sum + (company.risk_score || 0), 0) / companies.length
                : 0

            // Calculate distributions from sample
            const riskDistribution = this.calculateRiskDistribution(companies)
            const industryBreakdown = this.calculateIndustryBreakdown(companies)
            const regionalDistribution = this.calculateRegionalDistribution(companies)

            return {
                total_companies: totalCompanies,
                total_exposure: totalExposure,
                average_risk_score: averageRiskScore,
                risk_distribution: riskDistribution,
                industry_breakdown: industryBreakdown,
                regional_distribution: regionalDistribution,
                performance_trends: [], // Will be implemented in analytics service
                compliance_summary: {
                    gst_compliance: { compliant: 0, non_compliant: 0, unknown: 0 },
                    epfo_compliance: { compliant: 0, non_compliant: 0, unknown: 0 },
                    audit_status: { qualified: 0, unqualified: 0, unknown: 0 }
                },
                eligibility_summary: {
                    total_eligible_amount: totalExposure,
                    average_eligibility: totalExposure / Math.max(totalCompanies, 1),
                    eligibility_distribution: {},
                    risk_adjusted_exposure: totalExposure
                }
            }
        } catch (error) {
            console.error('Error calculating portfolio metrics:', error)
            // Return default metrics on error to prevent complete failure
            return {
                total_companies: 0,
                total_exposure: 0,
                average_risk_score: 0,
                risk_distribution: {
                    cm1_count: 0,
                    cm2_count: 0,
                    cm3_count: 0,
                    cm4_count: 0,
                    cm5_count: 0,
                    ungraded_count: 0,
                    total_count: 0,
                    distribution_percentages: {}
                },
                industry_breakdown: { industries: [] },
                regional_distribution: { regions: [] },
                performance_trends: [],
                compliance_summary: {
                    gst_compliance: { compliant: 0, non_compliant: 0, unknown: 0 },
                    epfo_compliance: { compliant: 0, non_compliant: 0, unknown: 0 },
                    audit_status: { qualified: 0, unqualified: 0, unknown: 0 }
                },
                eligibility_summary: {
                    total_eligible_amount: 0,
                    average_eligibility: 0,
                    eligibility_distribution: {},
                    risk_adjusted_exposure: 0
                }
            }
        }
    }

    private calculateRiskDistribution(companies: any[]) {
        const distribution = {
            cm1_count: 0,
            cm2_count: 0,
            cm3_count: 0,
            cm4_count: 0,
            cm5_count: 0,
            ungraded_count: 0,
            total_count: companies.length,
            distribution_percentages: {} as Record<string, number>
        }

        companies.forEach(company => {
            const grade = company.risk_grade?.toLowerCase()
            switch (grade) {
                case 'cm1': distribution.cm1_count++; break
                case 'cm2': distribution.cm2_count++; break
                case 'cm3': distribution.cm3_count++; break
                case 'cm4': distribution.cm4_count++; break
                case 'cm5': distribution.cm5_count++; break
                default: distribution.ungraded_count++; break
            }
        })

        // Calculate percentages
        const total = distribution.total_count
        if (total > 0) {
            distribution.distribution_percentages = {
                cm1: (distribution.cm1_count / total) * 100,
                cm2: (distribution.cm2_count / total) * 100,
                cm3: (distribution.cm3_count / total) * 100,
                cm4: (distribution.cm4_count / total) * 100,
                cm5: (distribution.cm5_count / total) * 100,
                ungraded: (distribution.ungraded_count / total) * 100
            }
        }

        return distribution
    }

    private calculateIndustryBreakdown(companies: any[]) {
        const industryMap = new Map<string, {
            count: number
            total_exposure: number
            risk_scores: number[]
        }>()

        companies.forEach(company => {
            const industry = company.industry || 'Unknown'
            const existing = industryMap.get(industry) || {
                count: 0,
                total_exposure: 0,
                risk_scores: []
            }

            existing.count++
            existing.total_exposure += company.recommended_limit || 0
            if (company.risk_score) {
                existing.risk_scores.push(company.risk_score)
            }

            industryMap.set(industry, existing)
        })

        const industries = Array.from(industryMap.entries()).map(([name, data]) => ({
            name,
            count: data.count,
            total_exposure: data.total_exposure,
            average_risk_score: data.risk_scores.length > 0
                ? data.risk_scores.reduce((sum, score) => sum + score, 0) / data.risk_scores.length
                : 0,
            risk_distribution: {} // Will be calculated if needed
        }))

        return { industries }
    }

    private calculateRegionalDistribution(companies: any[]) {
        // This would extract region data from extracted_data.about_company.registered_address
        // For now, return empty structure
        return {
            regions: []
        }
    }
    private async calculatePortfolioMetricsFromAnalytics(filters?: FilterCriteria, userId?: string): Promise<PortfolioMetrics> {
        const supabase = await this.getSupabaseClient()

        try {
            // Build base query with filters and user filtering
            let query = supabase
                .from('portfolio_analytics')
                .select(`
                    *,
                    document_processing_requests!inner(user_id)
                `)
                .eq('processing_status', 'completed')

            // Filter by user_id for security through the join
            if (userId) {
                query = query.eq('document_processing_requests.user_id', userId)
            }

            if (filters) {
                query = this.applyAnalyticsFilters(query, filters)
            }

            const { data, error } = await query

            if (error) {
                throw new Error(`Failed to fetch analytics data: ${error.message}`)
            }

            const companies: any = data || []
            const totalCompanies = companies.length
            const totalExposure = companies.reduce((sum, company) => sum + (company.final_eligibility || company.recommended_limit || 0), 0)
            const averageRiskScore = totalCompanies > 0
                ? companies.reduce((sum, company) => sum + (company.risk_score || 0), 0) / totalCompanies
                : 0

            // Risk distribution using direct column access
            const riskDistribution = {
                cm1_count: 0,
                cm2_count: 0,
                cm3_count: 0,
                cm4_count: 0,
                cm5_count: 0,
                ungraded_count: 0,
                total_count: totalCompanies,
                distribution_percentages: {} as Record<string, number>
            }

            companies.forEach(company => {
                const grade = company.risk_grade?.toLowerCase()
                switch (grade) {
                    case 'cm1': riskDistribution.cm1_count++; break
                    case 'cm2': riskDistribution.cm2_count++; break
                    case 'cm3': riskDistribution.cm3_count++; break
                    case 'cm4': riskDistribution.cm4_count++; break
                    case 'cm5': riskDistribution.cm5_count++; break
                    default: riskDistribution.ungraded_count++; break
                }
            })

            // Calculate percentages
            if (totalCompanies > 0) {
                riskDistribution.distribution_percentages = {
                    cm1: (riskDistribution.cm1_count / totalCompanies) * 100,
                    cm2: (riskDistribution.cm2_count / totalCompanies) * 100,
                    cm3: (riskDistribution.cm3_count / totalCompanies) * 100,
                    cm4: (riskDistribution.cm4_count / totalCompanies) * 100,
                    cm5: (riskDistribution.cm5_count / totalCompanies) * 100,
                    ungraded: (riskDistribution.ungraded_count / totalCompanies) * 100
                }
            }

            // Industry breakdown using indexed industry column
            const industryMap = new Map<string, any>()
            companies.forEach(company => {
                const industry = company.industry || 'Unknown'
                if (!industryMap.has(industry)) {
                    industryMap.set(industry, {
                        name: industry,
                        count: 0,
                        total_exposure: 0,
                        risk_scores: []
                    })
                }
                const industryData = industryMap.get(industry)!
                industryData.count++
                industryData.total_exposure += company.final_eligibility || company.recommended_limit || 0
                if (company.risk_score) {
                    industryData.risk_scores.push(company.risk_score)
                }
            })

            const industryBreakdown = {
                industries: Array.from(industryMap.values()).map(industry => ({
                    name: industry.name,
                    count: industry.count,
                    total_exposure: industry.total_exposure,
                    average_risk_score: industry.risk_scores.length > 0
                        ? industry.risk_scores.reduce((sum: number, score: number) => sum + score, 0) / industry.risk_scores.length
                        : 0,
                    risk_distribution: {} // Could be calculated if needed
                }))
            }

            // Regional distribution using indexed state columns
            const regionMap = new Map<string, any>()
            companies.forEach(company => {
                const region = company.business_state || company.registered_state || company.state || company.region || 'Unknown'
                if (!regionMap.has(region)) {
                    regionMap.set(region, {
                        state: region,
                        count: 0,
                        total_exposure: 0,
                        risk_scores: [],
                        cities: new Set()
                    })
                }
                const regionData = regionMap.get(region)!
                regionData.count++
                regionData.total_exposure += company.final_eligibility || company.recommended_limit || 0
                if (company.risk_score) {
                    regionData.risk_scores.push(company.risk_score)
                }
                // Add cities
                if (company.business_city) {
                    regionData.cities.add(company.business_city)
                }
                if (company.registered_city) {
                    regionData.cities.add(company.registered_city)
                }
            })

            const regionalDistribution: any = {
                regions: Array.from(regionMap.values()).map(region => ({
                    state: region.state,
                    count: region.count,
                    total_exposure: region.total_exposure,
                    average_risk_score: region.risk_scores.length > 0
                        ? region.risk_scores.reduce((sum: number, score: number) => sum + score, 0) / region.risk_scores.length
                        : 0,
                    cities: Array.from(region.cities)
                }))
            }

            // Compliance summary using flattened compliance columns
            const complianceSummary = companies.reduce((acc, company) => {
                // GST compliance
                const gstStatus = company.gst_compliance_status?.toLowerCase()
                if (gstStatus?.includes('regular') || gstStatus?.includes('active')) {
                    acc.gst_compliance.compliant++
                } else if (gstStatus?.includes('irregular') || gstStatus?.includes('inactive')) {
                    acc.gst_compliance.non_compliant++
                } else {
                    acc.gst_compliance.unknown++
                }

                // EPFO compliance
                const epfoStatus = company.epfo_compliance_status?.toLowerCase()
                if (epfoStatus?.includes('regular') || epfoStatus?.includes('active')) {
                    acc.epfo_compliance.compliant++
                } else if (epfoStatus?.includes('irregular') || epfoStatus?.includes('inactive')) {
                    acc.epfo_compliance.non_compliant++
                } else {
                    acc.epfo_compliance.unknown++
                }

                // Audit status
                const auditStatus = company.audit_qualification_status?.toLowerCase()
                if (auditStatus?.includes('unqualified') || auditStatus?.includes('clean')) {
                    acc.audit_status.qualified++
                } else if (auditStatus?.includes('qualified') || auditStatus?.includes('adverse')) {
                    acc.audit_status.unqualified++
                } else {
                    acc.audit_status.unknown++
                }

                return acc
            }, {
                gst_compliance: { compliant: 0, non_compliant: 0, unknown: 0 },
                epfo_compliance: { compliant: 0, non_compliant: 0, unknown: 0 },
                audit_status: { qualified: 0, unqualified: 0, unknown: 0 }
            })

            // Calculate eligibility metrics
            const baseEligibilityTotal = companies.reduce((sum, company) => sum + (company.base_eligibility || 0), 0)
            const finalEligibilityTotal = companies.reduce((sum, company) => sum + (company.final_eligibility || 0), 0)

            return {
                total_companies: totalCompanies,
                total_exposure: totalExposure,
                average_risk_score: averageRiskScore,
                risk_distribution: riskDistribution,
                industry_breakdown: industryBreakdown,
                regional_distribution: regionalDistribution,
                performance_trends: [], // Will be implemented in analytics service
                compliance_summary: complianceSummary,
                eligibility_summary: {
                    total_eligible_amount: finalEligibilityTotal,
                    average_eligibility: finalEligibilityTotal / Math.max(totalCompanies, 1),
                    eligibility_distribution: {
                        base_eligibility: baseEligibilityTotal,
                        final_eligibility: finalEligibilityTotal,
                        utilization_rate: baseEligibilityTotal > 0 ? (finalEligibilityTotal / baseEligibilityTotal) * 100 : 0
                    },
                    risk_adjusted_exposure: finalEligibilityTotal
                }
            }
        } catch (error) {
            console.error('Error calculating portfolio metrics from analytics:', error)
            throw error
        }
    }

    // ============================================================================
    // ANALYTICS TABLE MANAGEMENT METHODS
    // ============================================================================

    /**
     * Manually synchronize analytics table for specific request or all records
     */
    async syncAnalyticsTable(requestId?: string): Promise<SyncResult> {
        const supabase = await this.getSupabaseClient()

        try {
            const { data, error } = await supabase.rpc('sync_portfolio_analytics', {
                p_request_id: requestId
            })

            if (error) {
                throw new Error(`Sync failed: ${error.message}`)
            }

            return data as unknown as SyncResult
        } catch (error) {
            console.error('Analytics table sync error:', error)
            throw error
        }
    }

    /**
     * Validate analytics table data consistency
     */
    async validateAnalyticsData(requestId?: string): Promise<ValidationResult[]> {
        const supabase = await this.getSupabaseClient()

        try {
            const { data, error } = await supabase.rpc('validate_analytics_data', {
                p_request_id: requestId
            })

            if (error) {
                throw new Error(`Validation failed: ${error.message}`)
            }

            return data as ValidationResult[]
        } catch (error) {
            console.error('Analytics data validation error:', error)
            throw error
        }
    }

    /**
     * Rebuild entire analytics table from scratch
     */
    async rebuildAnalyticsTable(): Promise<RebuildResult> {
        const supabase = await this.getSupabaseClient()

        try {
            const { data, error } = await supabase.rpc('rebuild_analytics_table')

            if (error) {
                throw new Error(`Rebuild failed: ${error.message}`)
            }

            return data as unknown as RebuildResult
        } catch (error) {
            console.error('Analytics table rebuild error:', error)
            throw error
        }
    }

    /**
     * Get analytics table status and health metrics
     */
    async getAnalyticsTableStatus(): Promise<AnalyticsTableStatus> {
        const supabase = await this.getSupabaseClient()

        try {
            // Get total records from main table
            const { count: totalRecords } = await supabase
                .from('document_processing_requests')
                .select(`id, request_id, user_id, organization_id, original_filename,
            company_name, industry, risk_score, risk_grade, recommended_limit,
            currency, status, submitted_at, processing_started_at, completed_at,
            file_size, file_extension, s3_upload_key, s3_folder_path,
            pdf_filename, pdf_s3_key, pdf_file_size, model_type,
            total_parameters, available_parameters, financial_parameters,
            business_parameters, hygiene_parameters, banking_parameters,
            error_message, retry_count, created_at, updated_at`, { count: 'exact', head: true })
                .eq('status', 'completed')

            // Get synced records from analytics table
            const { count: syncedRecords } = await supabase
                .from('portfolio_analytics')
                .select('*', { count: 'exact', head: true })

            // Get error records
            const { count: errorRecords } = await supabase
                .from('portfolio_analytics_sync_errors')
                .select('*', { count: 'exact', head: true })
                .eq('resolved', false)

            // Get last sync time
            const { data: lastSyncData } = await supabase
                .from('portfolio_analytics')
                .select('updated_at')
                .order('updated_at', { ascending: false })
                .limit(1)
                .single()

            const total = totalRecords || 0
            const synced = syncedRecords || 0
            const errors = errorRecords || 0
            const pending = Math.max(0, total - synced)

            return {
                total_records: total,
                synced_records: synced,
                pending_sync: pending,
                error_records: errors,
                last_sync_time: lastSyncData?.updated_at || null,
                sync_coverage_percentage: total > 0 ? (synced / total) * 100 : 0
            }
        } catch (error) {
            console.error('Error getting analytics table status:', error)
            throw error
        }
    }

    /**
     * Retry failed sync operations
     */
    async retryFailedSyncs(maxRetries: number = 3): Promise<RetryResult[]> {
        const supabase = await this.getSupabaseClient()

        try {
            const { data, error } = await supabase.rpc('retry_failed_syncs', {
                max_retries: maxRetries
            })

            if (error) {
                throw new Error(`Retry failed: ${error.message}`)
            }

            return data as RetryResult[]
        } catch (error) {
            console.error('Failed sync retry error:', error)
            throw error
        }
    }
}