// Enhanced Company Search API - Supports intelligent search with multiple data sources
// 
// Search Priority:
// 1. Probe42 API (PRIMARY) - Most comprehensive and reliable source for companies, LLPs, and PNPs
// 2. ClearTax API - PAN-based entities and non-corporate structures
// 3. Existing companies database - Previously processed companies
// 4. Manual entries - User-created company records
//
import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@/lib/supabase/server'
import { CompanySearchResult, EntityType, ProcessingMethod } from '@/types/manual-company.types'

// API Configuration
const AWS_API_BASE_URL = 'https://nqrkc60k1g.execute-api.ap-south-1.amazonaws.com/dev'
const CLEARTAX_API_BASE_URL = 'https://cleartax.in/f'

// Probe42 API - PRIMARY search source for comprehensive company data
const PROBE42_API_BASE_URL = 'https://moola-axl0.credmatrix.ai/api/v1'
// TODO: Move this token to environment variables for security
const PROBE42_AUTH_TOKEN = 'eyJhbGciOiJIUzI1NiIsImtpZCI6ImEwNHdlZnFidjh2Y2tTM0MiLCJ0eXAiOiJKV1QifQ.eyJpc3MiOiJodHRwczovL3Nsa29zZXp5YW1kbXZhYXJtd293LnN1cGFiYXNlLmNvL2F1dGgvdjEiLCJzdWIiOiJlMmM1ODA1Ni00M2U0LTRiY2ItOWIwMC0yMTk1YTgzZDYwZjIiLCJhdWQiOiJhdXRoZW50aWNhdGVkIiwiZXhwIjoxNzY0NjUzOTIyLCJpYXQiOjE3NjQ2NTAzMjIsImVtYWlsIjoic3VrZXNoLnBAemV0d2Vyay5jb20iLCJwaG9uZSI6IiIsImFwcF9tZXRhZGF0YSI6eyJwcm92aWRlciI6ImVtYWlsIiwicHJvdmlkZXJzIjpbImVtYWlsIl19LCJ1c2VyX21ldGFkYXRhIjp7ImVtYWlsX3ZlcmlmaWVkIjp0cnVlfSwicm9sZSI6ImF1dGhlbnRpY2F0ZWQiLCJhYWwiOiJhYWwxIiwiYW1yIjpbeyJtZXRob2QiOiJwYXNzd29yZCIsInRpbWVzdGFtcCI6MTc2NDYzOTg5OH1dLCJzZXNzaW9uX2lkIjoiMjlkNTRlZTUtYmI1YS00MWVjLWExMWMtYzc0OWE0OWE1Njg0IiwiaXNfYW5vbnltb3VzIjpmYWxzZX0.n2kP70hTVSexCz_zRSAmKS3uivYN6drp0Og7zms6IsU'

interface SearchFilters {
    entity_types?: EntityType[]
    status_filter?: string[]
    include_inactive?: boolean
}

export async function GET(request: NextRequest) {
    try {
        const supabase = await createServerSupabaseClient()

        const { data: { user }, error: authError } = await supabase.auth.getUser()
        if (authError || !user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        }

        const { searchParams } = new URL(request.url)

        // Support both old and new query parameters for backward compatibility
        const query = searchParams.get('query') || searchParams.get('q')
        const filterType = searchParams.get('filter_type') || 'company'
        const limit = searchParams.get('max_results') ?
            parseInt(searchParams.get('max_results')!) :
            parseInt(searchParams.get('limit') || '10')

        // New enhanced search parameters
        const include_suggestions = searchParams.get('include_suggestions') === 'true'
        const include_data_sources = searchParams.get('include_data_sources') === 'true'
        const enhanced_mode = searchParams.get('enhanced') === 'true'

        // Parse filters
        const filters: SearchFilters = {
            entity_types: searchParams.get('entity_types')?.split(',') as EntityType[],
            status_filter: searchParams.get('status_filter')?.split(','),
            include_inactive: searchParams.get('include_inactive') === 'true'
        }

        if (!query || query.length < 2) {
            return NextResponse.json({
                success: true,
                results: [],
                suggestions: [],
                data_sources: {},
                total_found: 0,
                message: 'Query must be at least 2 characters long'
            })
        }

        // If enhanced mode is requested, use the new intelligent search
        if (enhanced_mode) {
            return await handleEnhancedSearch(supabase, query, limit, filters, include_suggestions, include_data_sources, user.id)
        }

        // Legacy AWS API search for backward compatibility
        return await handleLegacySearch(query, filterType, limit, user.id)

    } catch (error) {
        console.error('Company search API error:', error)
        return NextResponse.json({
            success: false,
            results: [],
            total_found: 0,
            error_message: error instanceof Error ? error.message : 'Failed to search companies'
        }, { status: 500 })
    }
}

async function handleEnhancedSearch(
    supabase: any,
    query: string,
    limit: number,
    filters: SearchFilters,
    include_suggestions: boolean,
    include_data_sources: boolean,
    userId: string
) {
    const results: CompanySearchResult[] = []
    const suggestions: string[] = []
    const dataSourceAvailability: Record<string, any> = {}

    try {
        // 1. PRIMARY: Search using Probe42 API (most comprehensive)
        let probe42Results: any[] = []
        try {
            const probe42Response = await fetch(
                `${PROBE42_API_BASE_URL}/companies/search?name_starts_with=${encodeURIComponent(query)}&limit=${limit}`,
                {
                    method: 'GET',
                    headers: {
                        'Authorization': `Bearer ${PROBE42_AUTH_TOKEN}`,
                        'Content-Type': 'application/json',
                    },
                }
            )

            if (probe42Response.ok) {
                const probe42Data = await probe42Response.json()
                if (probe42Data.success && probe42Data.data?.results?.entities) {
                    const entities = probe42Data.data.results.entities

                    // Process companies
                    if (entities.companies && Array.isArray(entities.companies)) {
                        probe42Results.push(...entities.companies.map((c: any) => ({
                            ...c,
                            entity_category: 'company'
                        })))
                    }

                    // Process LLPs
                    if (entities.llps && Array.isArray(entities.llps)) {
                        probe42Results.push(...entities.llps.map((l: any) => ({
                            ...l,
                            entity_category: 'llp'
                        })))
                    }

                    // Process PNPs (if any)
                    if (entities.pnps && Array.isArray(entities.pnps)) {
                        probe42Results.push(...entities.pnps.map((p: any) => ({
                            ...p,
                            entity_category: 'pnp'
                        })))
                    }
                }
            } else {
                console.warn('Probe42 API failed:', probe42Response.status)
            }
        } catch (probe42Error) {
            console.warn('Probe42 API error:', probe42Error)
        }

        // 2. Search in MCA master data (Corporate entities)
        // const { data: mcaResults, error: mcaError } = await supabase
        //     .from('mca_master_data')
        //     .select(`
        //         cin, 
        //         company_name, 
        //         company_status, 
        //         company_class, 
        //         company_type,
        //         paidup_capital, 
        //         authorized_capital,
        //         registration_date,
        //         company_state_code
        //     `)
        //     .or(`company_name.ilike.%${query}%,cin.ilike.%${query}%`)
        //     .eq('company_status', filters.include_inactive ? undefined : 'Active')
        //     .limit(limit * 2)

        // if (mcaError) {
        //     console.error('MCA search error:', mcaError)
        // }

        // Process Probe42 results (PRIMARY SOURCE)
        if (probe42Results.length > 0) {
            probe42Results.forEach((entity: any) => {
                const entityType = determineEntityTypeFromProbe42(entity.entity_category, entity.legal_name)
                const registrationNumber = entity.cin || entity.llpin || entity.pnp_number
                const processingMethods = determineProcessingMethods(entityType, true, registrationNumber)

                results.push({
                    id: entity.bid || registrationNumber || `probe42_${entity.legal_name}`,
                    name: entity.legal_name,
                    entity_type: entityType,
                    registration_number: registrationNumber,
                    status: entity.status || 'Unknown',
                    data_sources: ['api', 'excel'],
                    processing_eligibility: processingMethods,
                    match_score: calculateMatchScore(query, entity.legal_name, 'probe42'),
                    match_reason: `Probe42 verified ${entity.entity_category.toUpperCase()} entity`,
                    additional_info: {
                        bid: entity.bid,
                        source: 'probe42',
                        entity_category: entity.entity_category
                    }
                })
            })
        }

        // 3. Search using ClearTax name-to-PAN API for non-corporate entities
        let clearTaxResults: any[] = []
        try {
            const clearTaxResponse = await fetch(
                `${CLEARTAX_API_BASE_URL}/name-to-pan?company_name=${encodeURIComponent(query)}`,
                {
                    method: 'GET',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                }
            )

            if (clearTaxResponse.ok) {
                clearTaxResults = await clearTaxResponse.json()
            } else {
                console.warn('ClearTax API failed:', clearTaxResponse.status)
            }
        } catch (clearTaxError) {
            console.warn('ClearTax API error:', clearTaxError)
        }

        // 4. Search in existing companies table (both CIN and PAN)
        // const { data: existingCompanies, error: companiesError } = await supabase
        //     .from('companies')
        //     .select(`
        //         id,
        //         cin,
        //         pan,
        //         legal_name,
        //         comprehensive_data,
        //         comprehensive_data_cached_at,
        //         created_at
        //     `)
        //     .or(`legal_name.ilike.%${query}%,cin.ilike.%${query}%,pan.ilike.%${query}%`)
        //     .limit(limit)

        // if (companiesError) {
        //     console.error('Companies search error:', companiesError)
        // }

        // // 5. Search in manual company entries
        // const { data: manualResults, error: manualError } = await supabase
        //     .from('manual_company_entries')
        //     .select(`
        //         request_id,
        //         entity_type,
        //         basic_details,
        //         data_source,
        //         processing_status,
        //         data_completeness_score,
        //         created_at
        //     `)
        //     .or(`basic_details->>'legal_name'.ilike.%${query}%,basic_details->>'trade_name'.ilike.%${query}%`)
        //     .eq('created_by', userId)
        //     .limit(limit)

        // if (manualError) {
        //     console.error('Manual entries search error:', manualError)
        // }

        // Process MCA results
        // if (mcaResults) {
        //     mcaResults.forEach((company: any) => {
        //         const entityType = determineEntityTypeFromMCA(company.company_class, company.company_type)
        //         const processingMethods = determineProcessingMethods(entityType, true, company.cin)

        //         results.push({
        //             id: company.cin || `mca_${company.company_name}`,
        //             name: company.company_name,
        //             entity_type: entityType,
        //             registration_number: company.cin,
        //             status: company.company_status || 'Unknown',
        //             data_sources: ['api', 'excel'],
        //             processing_eligibility: processingMethods,
        //             match_score: calculateMatchScore(query, company.company_name, 'mca'),
        //             match_reason: `MCA registered ${entityType.replace('_', ' ')} company`
        //         })
        //     })
        // }

        // Process ClearTax results (PAN-based entities)
        if (clearTaxResults && Array.isArray(clearTaxResults)) {
            clearTaxResults.forEach((entity: any) => {
                const entityType = determinePanEntityType(entity.pan, entity.legalName, entity.tradeName)
                const processingMethods = determineProcessingMethods(entityType, false, undefined, entity.pan)
                if (entity.score > 0.85)
                    results.push({
                        id: entity.pan || `pan_${entity.legalName}`,
                        name: entity.tradeName || entity.legalName,
                        entity_type: entityType,
                        registration_number: entity.pan,
                        status: 'Active', // Assume active for PAN entities
                        data_sources: ['api', 'manual'],
                        processing_eligibility: processingMethods,
                        match_score: parseFloat(entity.score) * 100 || calculateMatchScore(query, entity.legalName, 'pan'),
                        match_reason: `PAN-based ${entityType.replace('_', ' ')} entity`,
                        additional_info: {
                            legal_name: entity.legalName,
                            trade_name: entity.tradeName,
                            pan: entity.pan,
                            source: 'cleartax'
                        }
                    })
            })
        }

        // Process existing companies
        // if (existingCompanies) {
        //     existingCompanies.forEach((company: any) => {
        //         const entityType = company.cin ? 'private_limited' : 'proprietorship'
        //         const processingMethods = determineProcessingMethods(
        //             entityType,
        //             !!company.comprehensive_data,
        //             company.cin,
        //             company.pan
        //         )

        //         results.push({
        //             id: company.id,
        //             name: company.legal_name || 'Unknown Company',
        //             entity_type: entityType,
        //             registration_number: company.cin || company.pan,
        //             status: 'Existing in Database',
        //             data_sources: ['api'],
        //             processing_eligibility: processingMethods,
        //             match_score: calculateMatchScore(query, company.legal_name, 'existing'),
        //             match_reason: `Existing company in database`,
        //             additional_info: {
        //                 company_id: company.id,
        //                 has_comprehensive_data: !!company.comprehensive_data,
        //                 last_updated: company.comprehensive_data_cached_at
        //             }
        //         })
        //     })
        // }

        // // Process manual entry results
        // if (manualResults) {
        //     manualResults.forEach((entry: any) => {
        //         const basicDetails = entry.basic_details as any
        //         const processingMethods = determineProcessingMethods(entry.entity_type, false)

        //         results.push({
        //             id: entry.request_id,
        //             name: basicDetails?.legal_name || basicDetails?.trade_name || 'Unknown Company',
        //             entity_type: entry.entity_type,
        //             registration_number: basicDetails?.registration_number,
        //             status: `Manual: ${entry.processing_status}`,
        //             data_sources: [entry.data_source],
        //             processing_eligibility: processingMethods,
        //             match_score: calculateMatchScore(query, basicDetails?.legal_name, 'manual'),
        //             match_reason: `Manually entered ${entry.entity_type.replace('_', ' ')} entity`
        //         })
        //     })
        // }

        // Sort results by match score and relevance
        results.sort((a, b) => {
            if (a.match_score !== b.match_score) {
                return b.match_score - a.match_score
            }

            const sourceOrder = { 'existing': 3, 'api': 2, 'manual': 1 }
            const aSource = a.data_sources[0] as keyof typeof sourceOrder
            const bSource = b.data_sources[0] as keyof typeof sourceOrder

            return (sourceOrder[bSource] || 0) - (sourceOrder[aSource] || 0)
        })

        // Generate intelligent suggestions
        if (include_suggestions && results.length > 0) {
            const uniqueNames = [...new Set(results.map(r => r.name))]
            suggestions.push(...uniqueNames.slice(0, 5))

            const partialMatches = results
                .filter(r => r.name.toLowerCase().includes(query.toLowerCase()))
                .map(r => r.name)
                .slice(0, 3)

            suggestions.push(...partialMatches)
        }

        // Build data source availability info
        if (include_data_sources) {
            dataSourceAvailability.probe42_entities = probe42Results?.length || 0
            dataSourceAvailability.mca_companies = 0
            dataSourceAvailability.cleartax_entities = clearTaxResults?.length || 0
            dataSourceAvailability.existing_companies = 0
            dataSourceAvailability.manual_entries = 0
            dataSourceAvailability.api_eligible = results.filter(r =>
                r.processing_eligibility.some(p => p.type === 'api')
            ).length
            dataSourceAvailability.excel_eligible = results.filter(r =>
                r.processing_eligibility.some(p => p.type === 'excel')
            ).length
            dataSourceAvailability.manual_only = results.filter(r =>
                r.processing_eligibility.every(p => p.type === 'manual')
            ).length
        }

        return NextResponse.json({
            success: true,
            results: results.slice(0, limit),
            suggestions: [...new Set(suggestions)].slice(0, 8),
            data_sources: dataSourceAvailability,
            total_found: results.length,
            search_metadata: {
                query,
                filters_applied: filters,
                search_time: Date.now(),
                sources_searched: ['probe42', 'mca', 'cleartax', 'existing_companies', 'manual'],
                primary_source: 'probe42',
                enhanced_mode: true
            },
            user_id: userId
        })

    } catch (error) {
        console.error('Enhanced search error:', error)
        throw error
    }
}

async function handleLegacySearch(query: string, filterType: string, maxResults: number, userId: string) {
    try {
        // Build AWS API URL with query parameters
        const awsUrl = new URL(`${AWS_API_BASE_URL}/search`)
        awsUrl.searchParams.set('query', query)
        awsUrl.searchParams.set('filter_type', filterType)
        awsUrl.searchParams.set('max_results', maxResults.toString())

        // Call AWS Lambda function
        const response = await fetch(awsUrl.toString(), {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
            },
        })

        if (!response.ok) {
            throw new Error(`AWS API responded with status: ${response.status}`)
        }

        const data = await response.json()

        // Return the response with user_id added
        return NextResponse.json({
            ...data,
            user_id: userId
        })

    } catch (error) {
        console.error('Legacy search error:', error)
        throw error
    }
}

// Helper functions
function determineEntityTypeFromMCA(companyClass?: string, companyType?: string): EntityType {
    if (!companyClass && !companyType) return 'private_limited'

    const classLower = (companyClass || '').toLowerCase()
    const typeLower = (companyType || '').toLowerCase()

    if (classLower.includes('public') || typeLower.includes('public')) {
        return 'public_limited'
    }

    if (classLower.includes('llp') || typeLower.includes('llp')) {
        return 'llp'
    }

    return 'private_limited'
}



function determinePanEntityType(pan: string, legalName?: string, tradeName?: string): EntityType {
    // Extract the 4th character from PAN to determine entity type
    if (!pan || pan.length < 4) {
        // Fallback to name-based detection if PAN is invalid
        return determinePanEntityTypeFromName(legalName, tradeName)
    }

    const entityTypeChar = pan.charAt(3).toUpperCase()

    switch (entityTypeChar) {
        case 'P': // Individual
            return 'proprietorship'
        case 'C': // Company
            // For companies, check name to determine if private or public limited
            const name = (legalName || tradeName || '').toLowerCase()
            if (name.includes('private limited') || name.includes('pvt ltd')) {
                return 'private_limited'
            }
            if (name.includes('public limited')) {
                return 'public_limited'
            }
            // Default to private limited for companies
            return 'private_limited'
        case 'F': // Firm/Partnership
            // Check if it's registered or unregistered partnership
            const partnershipName = (legalName || tradeName || '').toLowerCase()
            if (partnershipName.includes('llp') || partnershipName.includes('limited liability partnership')) {
                return 'llp'
            }
            // Default to registered partnership
            return 'partnership_registered'
        case 'T': // Trust
            // Default to private trust (most common)
            return 'trust_private'
        case 'H': // HUF (Hindu Undivided Family)
            return 'huf'
        case 'G': // Government - map to society (closest available type)
        case 'A': // Association of Persons - map to society
        case 'B': // Body of Individuals - map to society
        case 'L': // Local Authority - map to society
            return 'society'
        default:
            // Fallback to name-based detection for unknown PAN types
            return determinePanEntityTypeFromName(legalName, tradeName)
    }
}

function determinePanEntityTypeFromName(legalName?: string, tradeName?: string): EntityType {
    const name = (legalName || tradeName || '').toLowerCase()

    // Check for common business structure indicators
    if (name.includes('private limited') || name.includes('pvt ltd')) {
        return 'private_limited'
    }

    if (name.includes('public limited') || name.includes('ltd')) {
        return 'public_limited'
    }

    if (name.includes('llp') || name.includes('limited liability partnership')) {
        return 'llp'
    }

    if (name.includes('partnership') || name.includes('& co') || name.includes('and co')) {
        return 'partnership_registered'
    }

    if (name.includes('trust')) {
        return 'trust_private'
    }

    if (name.includes('society') || name.includes('association')) {
        return 'society'
    }

    if (name.includes('huf') || name.includes('hindu undivided family')) {
        return 'huf'
    }

    // Default to proprietorship for individual/sole proprietor entities
    return 'proprietorship'
}

function determineProcessingMethods(entityType: EntityType, hasApiData: boolean = false, cin?: string, pan?: string): ProcessingMethod[] {
    const methods: ProcessingMethod[] = []

    // Corporate entities (API eligible)
    if (['private_limited', 'public_limited', 'llp'].includes(entityType)) {
        if ((cin || pan)) {
            methods.push({
                type: 'api',
                eligibility_reason: 'Valid CIN/LLPIN/PAN found - API data available',
                requirements: ['Valid CIN/LLPIN/PAN', 'Active registration status'],
                estimated_time: '1-2 minutes',
                data_completeness_expected: 95
            })
        }

        methods.push({
            type: 'excel',
            eligibility_reason: 'Corporate entity - Excel upload supported',
            requirements: ['Financial statements in Excel format', 'Company basic details'],
            estimated_time: '2-3 minutes',
            data_completeness_expected: 90
        })
    }

    // Non-corporate entities (PAN-based)
    // if (['proprietorship', 'partnership_registered', 'partnership_unregistered', 'huf', 'trust_private', 'trust_public', 'society'].includes(entityType)) {
    //     if (pan) {
    //         methods.push({
    //             type: 'api',
    //             eligibility_reason: 'PAN found - Limited API data available',
    //             requirements: ['Valid PAN', 'Basic business information'],
    //             estimated_time: '10-15 minutes',
    //             data_completeness_expected: 60
    //         })
    //     }

    //     methods.push({
    //         type: 'excel',
    //         eligibility_reason: 'Non-corporate entity - Excel upload supported with limitations',
    //         requirements: ['Financial statements', 'Business registration documents'],
    //         estimated_time: '20-40 minutes',
    //         data_completeness_expected: 65
    //     })
    // }

    // All entities support manual entry
    methods.push({
        type: 'manual',
        eligibility_reason: `Manual entry available for ${entityType.replace('_', ' ')} entities`,
        requirements: ['Basic company information', 'Optional: Financial and compliance data'],
        estimated_time: '15-20 minutes',
        data_completeness_expected: 80
    })

    return methods
}

function determineEntityTypeFromProbe42(category: string, legalName?: string): EntityType {
    const categoryLower = category.toLowerCase()
    const nameLower = (legalName || '').toLowerCase()

    if (categoryLower === 'llp') {
        return 'llp'
    }

    if (categoryLower === 'company') {
        // Determine if private or public limited based on name
        if (nameLower.includes('private limited') || nameLower.includes('pvt ltd')) {
            return 'private_limited'
        }
        if (nameLower.includes('public limited')) {
            return 'public_limited'
        }
        // Default to private limited for companies
        return 'private_limited'
    }

    if (categoryLower === 'pnp') {
        return 'partnership_registered'
    }

    // Default fallback
    return 'private_limited'
}

function calculateMatchScore(query: string, companyName: string, source: 'probe42' | 'mca' | 'pan' | 'existing' | 'manual'): number {
    if (!companyName) return 0

    const queryLower = query.toLowerCase()
    const nameLower = companyName.toLowerCase()

    let score = 0

    // Exact match
    if (nameLower === queryLower) {
        score = 100
    }
    // Starts with query
    else if (nameLower.startsWith(queryLower)) {
        score = 90
    }
    // Contains query
    else if (nameLower.includes(queryLower)) {
        score = 70
    }
    // Word boundary match
    else if (nameLower.split(' ').some(word => word.startsWith(queryLower))) {
        score = 60
    }
    // Fuzzy match (simple)
    else {
        const similarity = calculateStringSimilarity(queryLower, nameLower)
        score = similarity * 50
    }

    // Boost based on source reliability (Probe42 is primary and most reliable)
    const sourceBoost = { probe42: 15, mca: 10, existing: 8, pan: 6, manual: 0 }
    score += sourceBoost[source]

    return Math.min(100, Math.max(0, score))
}

function calculateStringSimilarity(str1: string, str2: string): number {
    const longer = str1.length > str2.length ? str1 : str2
    const shorter = str1.length > str2.length ? str2 : str1

    if (longer.length === 0) return 1.0

    const editDistance = levenshteinDistance(longer, shorter)
    return (longer.length - editDistance) / longer.length
}

function levenshteinDistance(str1: string, str2: string): number {
    const matrix: number[][] = []

    for (let i = 0; i <= str2.length; i++) {
        matrix[i] = [i]
    }

    for (let j = 0; j <= str1.length; j++) {
        matrix[0][j] = j
    }

    for (let i = 1; i <= str2.length; i++) {
        for (let j = 1; j <= str1.length; j++) {
            if (str2.charAt(i - 1) === str1.charAt(j - 1)) {
                matrix[i][j] = matrix[i - 1][j - 1]
            } else {
                matrix[i][j] = Math.min(
                    matrix[i - 1][j - 1] + 1,
                    matrix[i][j - 1] + 1,
                    matrix[i - 1][j] + 1
                )
            }
        }
    }

    return matrix[str2.length][str1.length]
}