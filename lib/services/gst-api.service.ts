import { Database } from "@/types/database.types"
import { SupabaseClient } from "@supabase/supabase-js"

const WHITEBOOKS_API_BASE = 'https://api.whitebooks.in/public'
const WHITEBOOKS_CLIENT_ID = process.env.WHITEBOOKS_CLIENT_ID
const WHITEBOOKS_CLIENT_SECRET = process.env.WHITEBOOKS_CLIENT_SECRET
const WHITEBOOKS_EMAIL = process.env.WHITEBOOKS_EMAIL

export interface GstFilingRecord {
    valid: string
    mof: string // Mode of filing
    dof: string // Date of filing
    rtntype: string // Return type
    ret_prd: string // Return period
    arn: string // ARN
    status: string
}

export interface WhitebooksApiResponse {
    data: {
        EFiledlist: GstFilingRecord[]
    }
    status_cd: string
    status_desc: string
    header: Record<string, any>
}

export interface GstRefreshStatus {
    can_refresh: boolean
    refresh_count: number
    max_refreshes: number
    last_refresh_at: string | null
    days_until_reset: number
}

export interface GstFilingData {
    gstin: string
    financial_year: string
    return_type: string
    return_period: string
    date_of_filing: Date | null
    filing_mode: string | null
    arn: string | null
    status: string | null
    is_valid: boolean
    fetched_at: string
}

export class GstApiService {
    private supabase;

    constructor(supabase: SupabaseClient<Database>) {
        this.supabase = supabase
    }

    /**
     * Check if user can refresh GST data for a request
     */
    async canUserRefresh(userId: string, requestId: string): Promise<GstRefreshStatus> {
        try {
            const { data, error } = await this.supabase
                .rpc('get_user_gst_refresh_status', {
                    p_user_id: userId,
                    p_request_id: requestId
                })

            if (error) {
                console.error('Error checking refresh status:', error)
                return this.getDefaultRefreshStatus()
            }

            // The function now returns JSON directly
            if (data && typeof data === 'object') {
                return {
                    can_refresh: data.can_refresh || false,
                    refresh_count: data.refresh_count || 0,
                    max_refreshes: data.max_refreshes || 2,
                    last_refresh_at: data.last_refresh_at || null,
                    days_until_reset: data.days_until_reset || 30
                }
            }

            return this.getDefaultRefreshStatus()
        } catch (error) {
            console.error('Exception in canUserRefresh:', error)
            return this.getDefaultRefreshStatus()
        }
    }

    private getDefaultRefreshStatus(): GstRefreshStatus {
        return {
            can_refresh: true,
            refresh_count: 0,
            max_refreshes: 2,
            last_refresh_at: null,
            days_until_reset: 30
        }
    }

    /**
     * Check if GST data is fresh in database
     */
    async isGstDataFresh(gstin: string, financialYear: string, maxAgeDays: number = 30): Promise<boolean> {
        const { data, error } = await this.supabase
            .rpc('is_gst_data_fresh', {
                p_gstin: gstin,
                p_financial_year: financialYear,
                p_max_age_days: maxAgeDays
            })

        if (error) {
            console.error('Error checking data freshness:', error)
            return false
        }

        return data || false
    }

    /**
     * Get GST filing data from database
     */
    async getGstFilingData(gstin: string, financialYear?: string): Promise<GstFilingData[]> {
        const { data, error } = await this.supabase
            .rpc('get_gst_filing_data', {
                p_gstin: gstin,
                p_financial_year: financialYear
            })

        if (error) {
            console.error('Error fetching GST data:', error)
            throw new Error('Failed to fetch GST filing data')
        }

        return data || []
    }

    /**
     * Fetch GST data from Whitebooks API
     */
    async fetchFromWhitebooksApi(gstin: string, financialYear: string): Promise<WhitebooksApiResponse> {
        const url = new URL(`${WHITEBOOKS_API_BASE}/rettrack`)
        if (!WHITEBOOKS_EMAIL || !WHITEBOOKS_CLIENT_ID || !WHITEBOOKS_CLIENT_SECRET) {
            throw new Error("Incorrect Whitebook Credentials")
        }
        url.searchParams.set('gstin', gstin)
        url.searchParams.set('fy', financialYear)
        url.searchParams.set('email', WHITEBOOKS_EMAIL)

        const response = await fetch(url.toString(), {
            method: 'GET',
            headers: {
                'accept': '*/*',
                'client_id': WHITEBOOKS_CLIENT_ID,
                'client_secret': WHITEBOOKS_CLIENT_SECRET
            }
        })

        if (!response.ok) {
            throw new Error(`Whitebooks API error: ${response.status} ${response.statusText}`)
        }

        const data: WhitebooksApiResponse = await response.json()

        if (data.status_cd !== '1') {
            throw new Error(`Whitebooks API error: ${data.status_desc}`)
        }

        return data
    }

    /**
     * Store GST filing data in database
     */
    async storeGstFilingData(gstin: string, financialYear: string, filings: GstFilingRecord[]): Promise<void> {
        const records = filings.map(filing => ({
            gstin,
            financial_year: financialYear,
            return_type: filing.rtntype,
            return_period: filing.ret_prd,
            date_of_filing: this.parseFilingDate(filing.dof),
            filing_mode: filing.mof,
            arn: filing.arn,
            status: filing.status,
            is_valid: filing.valid === 'Y',
            data_source: 'whitebooks_api',
            fetched_at: new Date().toISOString()
        }))

        // Delete existing records for this GSTIN and FY to avoid duplicates
        await this.supabase
            .from('gst_filing_data')
            .delete()
            .eq('gstin', gstin)
            .eq('financial_year', financialYear)

        // Insert new records
        const { error } = await this.supabase
            .from('gst_filing_data')
            .insert(records)

        if (error) {
            console.error('Error storing GST data:', error)
            throw new Error('Failed to store GST filing data')
        }
    }

    /**
     * Log API request for tracking and billing
     */
    async logApiRequest(
        requestId: string,
        userId: string,
        gstin: string,
        financialYear: string,
        status: 'success' | 'failed' | 'cached',
        responseData?: any,
        errorMessage?: string
    ): Promise<void> {
        const { error } = await this.supabase
            .from('gst_api_requests')
            .insert({
                request_id: requestId,
                user_id: userId,
                gstin,
                financial_year: financialYear,
                api_provider: 'whitebooks',
                api_endpoint: '/rettrack',
                response_data: responseData,
                response_status: status === 'success' ? 200 : (status === 'cached' ? 304 : 400),
                cost_inr: status === 'success' ? 0.10 : 0, // Only charge for successful API calls
                status,
                error_message: errorMessage,
                completed_at: new Date().toISOString()
            })

        if (error) {
            console.error('Error logging API request:', error)
        }
    }

    /**
     * Increment user's refresh count
     */
    async incrementRefreshCount(userId: string, requestId: string, gstins: string[]): Promise<void> {
        const { error } = await this.supabase
            .rpc('increment_gst_refresh_count', {
                p_user_id: userId,
                p_request_id: requestId,
                p_gstins: gstins
            })

        if (error) {
            console.error('Error incrementing refresh count:', error)
            throw new Error('Failed to update refresh count')
        }
    }

    /**
     * Create a GST refresh job
     */
    async createRefreshJob(
        requestId: string,
        userId: string,
        gstins: string[],
        financialYear: string
    ): Promise<string> {
        const { data, error } = await this.supabase
            .from('gst_refresh_jobs')
            .insert({
                request_id: requestId,
                user_id: userId,
                gstins,
                financial_year: financialYear,
                total_gstins: gstins.length,
                status: 'queued'
            })
            .select('id')
            .single()

        if (error) {
            console.error('Error creating refresh job:', error)
            throw new Error('Failed to create refresh job')
        }

        return data.id
    }

    /**
     * Update refresh job progress
     */
    async updateRefreshJobProgress(
        jobId: string,
        progress: number,
        processedGstins: number,
        failedGstins: number,
        status?: string,
        results?: any,
        errorDetails?: any
    ): Promise<void> {
        const updateData: any = {
            progress,
            processed_gstins: processedGstins,
            failed_gstins: failedGstins,
            updated_at: new Date().toISOString()
        }

        if (status) {
            updateData.status = status
            if (status === 'processing' && !updateData.started_at) {
                updateData.started_at = new Date().toISOString()
            }
            if (status === 'completed' || status === 'failed') {
                updateData.completed_at = new Date().toISOString()
            }
        }

        if (results) {
            updateData.results = results
        }

        if (errorDetails) {
            updateData.error_details = errorDetails
        }

        const { error } = await this.supabase
            .from('gst_refresh_jobs')
            .update(updateData)
            .eq('id', jobId)

        if (error) {
            console.error('Error updating refresh job:', error)
            throw new Error('Failed to update refresh job')
        }
    }

    /**
     * Get refresh job status
     */
    async getRefreshJobStatus(jobId: string): Promise<any> {
        const { data, error } = await this.supabase
            .from('gst_refresh_jobs')
            .select('*')
            .eq('id', jobId)
            .single()

        if (error) {
            console.error('Error fetching job status:', error)
            throw new Error('Failed to fetch job status')
        }

        return data
    }

    /**
     * Process GST refresh for multiple GSTINs
     */
    async processGstRefresh(
        requestId: string,
        userId: string,
        gstins: string[],
        financialYear: string
    ): Promise<{ jobId: string; results: any[] }> {
        // Check if user can refresh
        const refreshStatus = await this.canUserRefresh(userId, requestId)
        if (!refreshStatus.can_refresh) {
            throw new Error(`Refresh limit exceeded. You can refresh ${refreshStatus.max_refreshes} times per month. Next reset in ${refreshStatus.days_until_reset} days.`)
        }

        // Create refresh job
        const jobId = await this.createRefreshJob(requestId, userId, gstins, financialYear)

        const results: any[] = []
        let processedCount = 0
        let failedCount = 0

        try {
            // Update job status to processing
            await this.updateRefreshJobProgress(jobId, 0, 0, 0, 'processing')

            for (const gstin of gstins) {
                try {
                    // Check if data is already fresh
                    const isFresh = await this.isGstDataFresh(gstin, financialYear, 7) // 7 days for fresh data

                    if (isFresh) {
                        // Use cached data
                        const cachedData = await this.getGstFilingData(gstin, financialYear)
                        await this.logApiRequest(requestId, userId, gstin, financialYear, 'cached', cachedData)

                        results.push({
                            gstin,
                            status: 'cached',
                            data: cachedData,
                            message: 'Using cached data (less than 7 days old)'
                        })
                    } else {
                        // Fetch fresh data from API
                        const apiResponse = await this.fetchFromWhitebooksApi(gstin, financialYear)
                        await this.storeGstFilingData(gstin, financialYear, apiResponse.data.EFiledlist)
                        await this.logApiRequest(requestId, userId, gstin, financialYear, 'success', apiResponse)

                        results.push({
                            gstin,
                            status: 'success',
                            data: apiResponse.data.EFiledlist,
                            message: 'Fresh data fetched from API'
                        })
                    }

                    processedCount++
                } catch (error) {
                    console.error(`Error processing GSTIN ${gstin}:`, error)
                    await this.logApiRequest(requestId, userId, gstin, financialYear, 'failed', null, error instanceof Error ? error.message : 'Unknown error')

                    results.push({
                        gstin,
                        status: 'failed',
                        error: error instanceof Error ? error.message : 'Unknown error'
                    })

                    failedCount++
                }

                // Update progress
                const progress = Math.round(((processedCount + failedCount) / gstins.length) * 100)
                await this.updateRefreshJobProgress(jobId, progress, processedCount, failedCount)
            }

            // Mark job as completed
            await this.updateRefreshJobProgress(
                jobId,
                100,
                processedCount,
                failedCount,
                'completed',
                results
            )

            // Increment user's refresh count
            await this.incrementRefreshCount(userId, requestId, gstins)

            return { jobId, results }

        } catch (error) {
            // Mark job as failed
            await this.updateRefreshJobProgress(
                jobId,
                0,
                processedCount,
                failedCount,
                'failed',
                results,
                { error: error instanceof Error ? error.message : 'Unknown error' }
            )

            throw error
        }
    }

    /**
     * Parse filing date from DD-MM-YYYY format
     */
    private parseFilingDate(dateStr: string): Date | null {
        if (!dateStr || dateStr === '-') return null

        try {
            // Parse DD-MM-YYYY format
            const [day, month, year] = dateStr.split('-').map(Number)
            return new Date(year, month - 1, day) // month is 0-indexed
        } catch (error) {
            console.error('Error parsing date:', dateStr, error)
            return null
        }
    }

    /**
     * Get GST API usage statistics for a user
     */
    async getApiUsageStats(userId: string, startDate?: string, endDate?: string): Promise<any> {
        let query = this.supabase
            .from('gst_api_requests')
            .select('*')
            .eq('user_id', userId)

        if (startDate) {
            query = query.gte('requested_at', startDate)
        }

        if (endDate) {
            query = query.lte('requested_at', endDate)
        }

        const { data, error } = await query.order('requested_at', { ascending: false })

        if (error) {
            console.error('Error fetching usage stats:', error)
            throw new Error('Failed to fetch usage statistics')
        }

        // Calculate statistics
        const totalRequests = data.length
        const successfulRequests = data.filter(r => r.status === 'success').length
        const cachedRequests = data.filter(r => r.status === 'cached').length
        const failedRequests = data.filter(r => r.status === 'failed').length
        const totalCost = data.reduce((sum, r) => sum + (r.cost_inr || 0), 0)

        return {
            totalRequests,
            successfulRequests,
            cachedRequests,
            failedRequests,
            totalCost,
            requests: data
        }
    }
}