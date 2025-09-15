'use client'

import React, { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader } from '@/components/ui/Card'
import { Badge } from '@/components/ui/Badge'
import { Skeleton } from '@/components/ui/Skeleton'
import { Alert } from '@/components/ui/Alert'
import { Button } from '@/components/ui/Button'
import { PortfolioCompany } from '@/types/portfolio.types'
import {
    FileText,
    AlertTriangle,
    CheckCircle,
    Clock,
    TrendingUp,
    Calendar,
    RefreshCw,
    Database,
    Wifi,
    WifiOff,
    Info
} from 'lucide-react'

interface GstFilingData {
    gstin: string
    state: string
    gstr3b_latest_filing: string
    gstr1_latest_filing: string
    gstr3b_aging: {
        on_time: number
        '1-5': number
        '6-15': number
        '16-30': number
        '30+': number
    }
    gstr1_aging: {
        on_time: number
        '1-5': number
        '6-15': number
        '16-30': number
        '30+': number
    }
}

interface GstFilingDetailsSectionProps {
    company: PortfolioCompany
}

interface GstRefreshStatus {
    can_refresh: boolean
    refresh_count: number
    max_refreshes: number
    last_refresh_at: string | null
    days_until_reset: number
}

interface ApiGstFilingData {
    gstin: string
    financial_year: string
    return_type: string
    return_period: string
    date_of_filing: string | null
    filing_mode: string | null
    arn: string | null
    status: string | null
    is_valid: boolean
    fetched_at: string
}

// State code to state name mapping
const STATE_MAPPING: Record<string, string> = {
    '01': 'Jammu and Kashmir', '02': 'Himachal Pradesh', '03': 'Punjab',
    '04': 'Chandigarh', '05': 'Uttarakhand', '06': 'Haryana', '07': 'Delhi',
    '08': 'Rajasthan', '09': 'Uttar Pradesh', '10': 'Bihar', '11': 'Sikkim',
    '12': 'Arunachal Pradesh', '13': 'Nagaland', '14': 'Manipur', '15': 'Mizoram',
    '16': 'Tripura', '17': 'Meghalaya', '18': 'Assam', '19': 'West Bengal',
    '20': 'Jharkhand', '21': 'Odisha', '22': 'Chattisgarh', '23': 'Madhya Pradesh',
    '24': 'Gujarat', '26': 'Dadra and Nagar Haveli and Daman and Diu',
    '27': 'Maharashtra', '28': 'Andhra Pradesh (Before Division)',
    '29': 'Karnataka', '30': 'Goa', '31': 'Lakshadweep', '32': 'Kerala',
    '33': 'Tamil Nadu', '34': 'Puducherry', '35': 'Andaman and Nicobar Islands',
    '36': 'Telangana', '37': 'Andhra Pradesh', '38': 'Ladakh',
    '97': 'Other Territory', '99': 'Centre Jurisdiction'
}

export function GstFilingDetailsSection({ company }: GstFilingDetailsSectionProps) {
    const [gstFilingData, setGstFilingData] = useState<GstFilingData[]>([])
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState<string | null>(null)

    // New state for refresh functionality
    const [refreshStatus, setRefreshStatus] = useState<GstRefreshStatus | null>(null)
    const [isRefreshing, setIsRefreshing] = useState(false)
    const [refreshError, setRefreshError] = useState<string | null>(null)
    const [apiGstData, setApiGstData] = useState<Record<string, ApiGstFilingData[]>>({})
    const [dataSource, setDataSource] = useState<'extracted' | 'api'>('extracted')
    const [activeGstins, setActiveGstins] = useState<string[]>([])
    const [showRefreshInfo, setShowRefreshInfo] = useState(false)
    const [loadingAPIData, setLoadingAPIData] = useState(true)

    useEffect(() => {
        processGstData()
        fetchRefreshStatus()
    }, [company])

    useEffect(() => {
        checkForExistingApiData();
    }, [activeGstins])

    // Check if there's existing API data in the database
    const checkForExistingApiData = async () => {
        if (!activeGstins.length) {
            return
        }

        try {
            const currentFY = getCurrentFinancialYear()
            const apiData: Record<string, ApiGstFilingData[]> = {}
            let hasApiData = false

            // Check each active GSTIN for existing API data
            setLoadingAPIData(true);
            for (const gstin of activeGstins) {
                try {
                    const response = await fetch(`/api/portfolio/${company.request_id}/gst-data?gstin=${gstin}&financial_year=${currentFY}`)
                    if (response.ok) {
                        const data = await response.json()
                        if (data.data.filing_data && data.data.filing_data.length > 0) {
                            apiData[gstin] = data.data.filing_data
                            hasApiData = true
                        }
                    }
                } catch (error) {
                    console.error(`Error checking existing data for GSTIN ${gstin}:`, error)
                }
            }

            // If we found API data, set it up
            if (hasApiData) {
                setApiGstData(apiData)
                console.log('Found existing API data for', Object.keys(apiData).length, 'GSTINs')

                // Show a notification that live data is available
                setRefreshError(null) // Clear any existing errors
            }
        } catch (error) {
            console.error('Error checking for existing API data:', error)
        } finally {
            setLoadingAPIData(false)
        }
    }

    // Fetch refresh status from API
    const fetchRefreshStatus = async () => {
        try {
            const response = await fetch(`/api/portfolio/${company.request_id}/gst-refresh`)
            if (response.ok) {
                const result = await response.json()
                setRefreshStatus(result.data)
            }
        } catch (error) {
            console.error('Error fetching refresh status:', error)
        }
    }

    // Function to get current financial year (April 1 - March 31)
    const getCurrentFinancialYear = (): string => {
        const currentDate = new Date()
        const currentYear = currentDate.getFullYear()
        const currentMonth = currentDate.getMonth() + 1 // getMonth() returns 0-11, so add 1

        // If current month is April (4) or later, FY starts from current year
        // If current month is January (1) to March (3), FY started from previous year
        if (currentMonth >= 4) {
            // April to December: FY is current year to next year
            return `${currentYear}-${(currentYear + 1).toString().slice(-2)}`
        } else {
            // January to March: FY is previous year to current year
            return `${currentYear - 1}-${currentYear.toString().slice(-2)}`
        }
    }

    // Format tax period from MMYYYY to readable format
    const formatTaxPeriod = (period: string): string => {
        if (!period || period.length !== 6) return period

        const month = period.substring(0, 2)
        const year = period.substring(2, 6)

        const monthNames = [
            '', 'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
            'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'
        ]

        const monthIndex = parseInt(month, 10)
        const monthName = monthNames[monthIndex] || month

        return `${monthName} ${year}`
    }

    // Format date from API response
    const formatFilingDate = (dateStr: string | null): string => {
        if (!dateStr) return 'Not Filed'

        try {
            const date = new Date(dateStr)
            return date.toLocaleDateString('en-IN', {
                day: '2-digit',
                month: 'short',
                year: 'numeric'
            })
        } catch {
            return dateStr
        }
    }

    // Handle GST data refresh
    const handleRefreshGstData = async () => {
        if (!activeGstins.length || isRefreshing) return

        setIsRefreshing(true)
        setRefreshError(null)

        try {
            const response = await fetch(`/api/portfolio/${company.request_id}/gst-refresh`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    gstins: activeGstins,
                    financial_year: getCurrentFinancialYear()
                })
            })

            const result = await response.json()

            if (!response.ok) {
                throw new Error(result.error || 'Failed to refresh GST data')
            }

            // Process the refreshed data
            await processApiGstData(result.data.results)

            // Update refresh status
            await fetchRefreshStatus()

            // Show success message with detailed results
            const summary = result.data.summary
            const message = `GST data refreshed successfully!\n\n` +
                `✅ Successful: ${summary.successful}\n` +
                `📋 Cached: ${summary.cached}\n` +
                `❌ Failed: ${summary.failed}\n\n` +
                `The page now shows the latest data from GST portal.`

            alert(message)

        } catch (error) {
            console.error('Error refreshing GST data:', error)
            setRefreshError(error instanceof Error ? error.message : 'Failed to refresh GST data')
        } finally {
            setIsRefreshing(false)
        }
    }

    // Process API GST data and convert to component format
    const processApiGstData = async (results: any[]) => {
        const apiData: Record<string, ApiGstFilingData[]> = {}

        // Fetch detailed data for each GSTIN
        for (const result of results) {
            if (result.status === 'success' || result.status === 'cached') {
                try {
                    const currentFY = getCurrentFinancialYear()
                    const response = await fetch(`/api/portfolio/${company.request_id}/gst-data?gstin=${result.gstin}&financial_year=${currentFY}`)
                    if (response.ok) {
                        const data = await response.json()
                        apiData[result.gstin] = data.data.filing_data || []
                    }
                } catch (error) {
                    console.error(`Error fetching data for GSTIN ${result.gstin}:`, error)
                }
            }
        }

        setApiGstData(apiData)

        // Convert API data to component format
        const convertedData = convertApiDataToComponentFormat(apiData)
        setGstFilingData(convertedData)
        setDataSource('api')
    }

    // Convert API data format to component format
    const convertApiDataToComponentFormat = (apiData: Record<string, ApiGstFilingData[]>): GstFilingData[] => {
        const result: GstFilingData[] = []

        Object.entries(apiData).forEach(([gstin, filings]) => {
            const stateCode = gstin.substring(0, 2)
            const stateName = STATE_MAPPING[stateCode] || `State-${stateCode}`

            const gstFilingEntry: GstFilingData = {
                gstin,
                state: stateName,
                gstr3b_latest_filing: 'Not Filed',
                gstr1_latest_filing: 'Not Filed',
                gstr3b_aging: { 'on_time': 0, '1-5': 0, '6-15': 0, '16-30': 0, '30+': 0 },
                gstr1_aging: { 'on_time': 0, '1-5': 0, '6-15': 0, '16-30': 0, '30+': 0 }
            }

            // Process GSTR3B and GSTR1 filings
            const gstr3bFilings = filings.filter(f => f.return_type === 'GSTR3B').sort((a, b) =>
                new Date(b.date_of_filing || '').getTime() - new Date(a.date_of_filing || '').getTime()
            )
            const gstr1Filings = filings.filter(f => f.return_type === 'GSTR1').sort((a, b) =>
                new Date(b.date_of_filing || '').getTime() - new Date(a.date_of_filing || '').getTime()
            )

            // Set latest filings with proper formatting
            if (gstr3bFilings.length > 0) {
                const latest = gstr3bFilings[0]
                const formattedDate = formatFilingDate(latest.date_of_filing)
                const formattedPeriod = formatTaxPeriod(latest.return_period)
                gstFilingEntry.gstr3b_latest_filing = `${formattedDate} (${formattedPeriod})`
            }

            if (gstr1Filings.length > 0) {
                const latest = gstr1Filings[0]
                const formattedDate = formatFilingDate(latest.date_of_filing)
                const formattedPeriod = formatTaxPeriod(latest.return_period)
                gstFilingEntry.gstr1_latest_filing = `${formattedDate} (${formattedPeriod})`
            }

            // Calculate aging (simplified - you can enhance this based on due dates)
            gstr3bFilings.slice(0, 12).forEach(() => {
                gstFilingEntry.gstr3b_aging.on_time += 1 // Simplified - assume all are on time for API data
            })

            gstr1Filings.slice(0, 12).forEach(() => {
                gstFilingEntry.gstr1_aging.on_time += 1 // Simplified - assume all are on time for API data
            })

            result.push(gstFilingEntry)
        })

        return result
    }

    const processGstData = () => {
        try {
            setLoading(true)
            setError(null)

            const extractedData = company.extracted_data
            if (!extractedData?.GST || !extractedData?.['Annexure - GST']) {
                setError('GST data not available')
                return
            }

            const gstData = extractedData.GST
            const gstAnnexureData = extractedData['Annexure - GST']

            if (!gstData.raw_data || !gstAnnexureData.raw_data) {
                setError('GST raw data not available')
                return
            }

            // Get active GSTINs
            const activeGstinsSet = new Set<string>()
            gstData.raw_data.forEach((item: any) => {
                if (item['GSTIN STATUS'] === 'Active') {
                    activeGstinsSet.add(item.GSTIN)
                }
            })

            const activeGstinsArray = Array.from(activeGstinsSet)
            setActiveGstins(activeGstinsArray)

            if (activeGstinsArray.length === 0) {
                setError('No active GSTINs found')
                return
            }

            // Process GST filings
            const gstFilings: Record<string, any> = {}
            const currentDate = new Date()

            // Collect all filings for active GSTINs
            gstAnnexureData.raw_data.forEach((item: any) => {
                const gstin = item.GSTIN || ''
                const returnType = item['RETURN TYPE'] || ''
                const financialYear = item['FINANCIAL YEAR'] || ''
                const taxPeriod = item['TAX PERIOD'] || ''
                const dateOfFiling = item['DATE OF FILING'] || ''
                const dueDateStr = item['FILING DUE DATE'] || ''

                // Skip if GSTIN is not active or not GSTR3B/GSTR1
                if (!activeGstinsSet.has(gstin) || !['GSTR3B', 'GSTR1'].includes(returnType)) {
                    return
                }

                // Skip if no valid dates
                if (!dueDateStr || !dateOfFiling || dateOfFiling === '-' || dueDateStr === '-') {
                    return
                }

                try {
                    const filingDate = parseDate(dateOfFiling)
                    const dueDate = parseDate(dueDateStr)

                    if (!filingDate || !dueDate) return

                    // Calculate delay in days
                    const delayDays = Math.max(0, Math.floor((filingDate.getTime() - dueDate.getTime()) / (1000 * 60 * 60 * 24)))

                    // Extract state from GSTIN
                    const stateCode = gstin.substring(0, 2)
                    const stateName = STATE_MAPPING[stateCode] || `State-${stateCode}`

                    // Initialize GSTIN entry if not exists
                    if (!gstFilings[gstin]) {
                        gstFilings[gstin] = {
                            gstin,
                            state: stateName,
                            gstr3b_filings: [],
                            gstr1_filings: [],
                            gstr3b_aging: { 'on_time': 0, '1-5': 0, '6-15': 0, '16-30': 0, '30+': 0 },
                            gstr1_aging: { 'on_time': 0, '1-5': 0, '6-15': 0, '16-30': 0, '30+': 0 }
                        }
                    }

                    // Create filing record
                    const filingRecord = {
                        financial_year: financialYear,
                        tax_period: taxPeriod,
                        date_of_filing: dateOfFiling,
                        filing_date: filingDate,
                        due_date: dueDate,
                        delay_days: delayDays,
                        period_sort_key: getPeriodSortKey(financialYear, taxPeriod)
                    }

                    // Add to appropriate list
                    if (returnType === 'GSTR3B') {
                        gstFilings[gstin].gstr3b_filings.push(filingRecord)
                    } else if (returnType === 'GSTR1') {
                        gstFilings[gstin].gstr1_filings.push(filingRecord)
                    }
                } catch (err) {
                    console.warn('Error processing filing record:', err)
                }
            })

            // Calculate aging for each GSTIN
            Object.values(gstFilings).forEach((filing: any) => {
                // Sort filings by period (latest first)
                filing.gstr3b_filings.sort((a: any, b: any) => b.period_sort_key.localeCompare(a.period_sort_key))
                filing.gstr1_filings.sort((a: any, b: any) => b.period_sort_key.localeCompare(a.period_sort_key))

                    // Process GSTR3B and GSTR1 filings
                    ;[
                        { type: 'GSTR3B', filings: 'gstr3b_filings', aging: 'gstr3b_aging' },
                        { type: 'GSTR1', filings: 'gstr1_filings', aging: 'gstr1_aging' }
                    ].forEach(({ type, filings, aging }) => {
                        const filingsList = filing[filings]

                        if (filingsList.length > 0) {
                            // Set latest filing info
                            const latest = filingsList[0]
                            filing[`${type.toLowerCase()}_latest_filing`] =
                                `${latest.date_of_filing} (${latest.tax_period} ${latest.financial_year.split('-')[0]})`

                            // Calculate aging for last 12 months
                            const lastTwelveMonths = filingsList.slice(0, 12)
                            lastTwelveMonths.forEach((filingRecord: any) => {
                                const delay = filingRecord.delay_days
                                if (delay === 0) {
                                    filing[aging].on_time += 1
                                } else if (delay >= 1 && delay <= 5) {
                                    filing[aging]['1-5'] += 1
                                } else if (delay >= 6 && delay <= 15) {
                                    filing[aging]['6-15'] += 1
                                } else if (delay >= 16 && delay <= 30) {
                                    filing[aging]['16-30'] += 1
                                } else {
                                    filing[aging]['30+'] += 1
                                }
                            })
                        } else {
                            filing[`${type.toLowerCase()}_latest_filing`] = 'Not Filed'
                        }
                    })
            })

            setGstFilingData(Object.values(gstFilings))

            // After processing extracted data, check for existing API data
            // setTimeout(() => checkForExistingApiData(), 500)
        } catch (err) {
            console.error('Error processing GST data:', err)
            setError('Failed to process GST filing data')
        } finally {
            setLoading(false)
        }
    }

    const parseDate = (dateStr: string): Date | null => {
        try {
            // Parse "10 Apr, 2025" format
            const parts = dateStr.replace(',', '').split(' ')
            if (parts.length === 3) {
                const day = parseInt(parts[0])
                const month = parts[1]
                const year = parseInt(parts[2])

                const monthMap: Record<string, number> = {
                    'Jan': 0, 'Feb': 1, 'Mar': 2, 'Apr': 3, 'May': 4, 'Jun': 5,
                    'Jul': 6, 'Aug': 7, 'Sep': 8, 'Oct': 9, 'Nov': 10, 'Dec': 11
                }

                const monthIndex = monthMap[month]
                if (monthIndex !== undefined) {
                    return new Date(year, monthIndex, day)
                }
            }
            return null
        } catch {
            return null
        }
    }

    const getPeriodSortKey = (financialYear: string, taxPeriod: string): string => {
        try {
            const startYear = parseInt(financialYear.split('-')[0])
            const monthMap: Record<string, number> = {
                'January': 1, 'February': 2, 'March': 3, 'April': 4, 'May': 5, 'June': 6,
                'July': 7, 'August': 8, 'September': 9, 'October': 10, 'November': 11, 'December': 12
            }

            const calendarMonth = monthMap[taxPeriod] || 0
            const calendarYear = calendarMonth >= 4 ? startYear : startYear + 1

            return `${calendarYear}${calendarMonth.toString().padStart(2, '0')}`
        } catch {
            return '000000'
        }
    }

    const calculateTotals = () => {
        const totals = {
            on_time: 0,
            '1-5': 0,
            '6-15': 0,
            '16-30': 0,
            '30+': 0
        }

        gstFilingData.forEach(filing => {
            Object.keys(totals).forEach(key => {
                totals[key as keyof typeof totals] +=
                    filing.gstr3b_aging[key as keyof typeof filing.gstr3b_aging] +
                    filing.gstr1_aging[key as keyof typeof filing.gstr1_aging]
            })
        })

        return totals
    }

    const getDelayBadgeVariant = (count: number, total: number) => {
        if (count === 0) return 'secondary'
        const percentage = (count / total) * 100
        if (percentage <= 10) return 'success'
        if (percentage <= 25) return 'warning'
        return 'error'
    }

    if (loading) {
        return (
            <Card>
                <CardHeader>
                    <div className="flex items-center gap-2">
                        <FileText className="w-5 h-5" />
                        <h3 className="text-lg font-semibold">GST Filing Details</h3>
                    </div>
                </CardHeader>
                <CardContent>
                    <div className="space-y-4">
                        <Skeleton className="w-full h-8" />
                        <Skeleton className="w-full h-32" />
                        <Skeleton className="w-full h-32" />
                    </div>
                </CardContent>
            </Card>
        )
    }

    if (error) {
        return (
            <Card>
                <CardHeader>
                    <div className="flex items-center gap-2">
                        <FileText className="w-5 h-5" />
                        <h3 className="text-lg font-semibold">GST Filing Details</h3>
                    </div>
                </CardHeader>
                <CardContent>
                    <Alert variant="warning">
                        <AlertTriangle className="w-4 h-4" />
                        <div>
                            <p className="font-medium">GST Filing Data Unavailable</p>
                            <p className="text-sm mt-1">{error}</p>
                        </div>
                    </Alert>
                </CardContent>
            </Card>
        )
    }

    if (gstFilingData.length === 0) {
        return (
            <Card>
                <CardHeader>
                    <div className="flex items-center gap-2">
                        <FileText className="w-5 h-5" />
                        <h3 className="text-lg font-semibold">GST Filing Details</h3>
                    </div>
                </CardHeader>
                <CardContent>
                    <div className="text-center py-8">
                        <FileText className="w-12 h-12 text-neutral-40 mx-auto mb-4" />
                        <p className="text-neutral-60">No active GST registrations found</p>
                    </div>
                </CardContent>
            </Card>
        )
    }

    const totals = calculateTotals()

    return (
        <Card>
            <CardHeader>
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                        <FileText className="w-5 h-5 text-blue-600" />
                        <h3 className="text-lg font-semibold text-neutral-90">
                            GST Filing Details for Active States
                        </h3>
                        {dataSource === 'api' && (
                            <Badge variant="success" className="flex items-center gap-1">
                                <Wifi className="w-3 h-3" />
                                Live Data
                            </Badge>
                        )}
                        {dataSource === 'extracted' && (
                            <Badge variant="secondary" className="flex items-center gap-1">
                                <Database className="w-3 h-3" />
                                Extracted Data
                            </Badge>
                        )}
                    </div>
                    <div className="flex items-center gap-2">
                        {/* Data Source Toggle */}
                        {(Object.keys(apiGstData).length > 0 || loadingAPIData) && (
                            <div className="flex items-center gap-1 px-2 py-1 bg-neutral-20 rounded-md">
                                <span className="text-xs text-neutral-600">View:</span>
                                {loadingAPIData ? (
                                    <div className="flex items-center gap-1 px-2 py-1">
                                        <RefreshCw className="w-3 h-3 animate-spin text-blue-600" />
                                        <span className="text-xs text-blue-600">Checking for live data...</span>
                                    </div>
                                ) : (
                                    <>
                                        <Button
                                            variant={dataSource === 'extracted' ? 'info' : 'ghost'}
                                            size="sm"
                                            onClick={() => {
                                                setDataSource('extracted')
                                                processGstData() // Reload extracted data
                                            }}
                                            className="h-6 px-2 text-xs"
                                        >
                                            <Database className="w-3 h-3 mr-1" />
                                            Original
                                        </Button>
                                        <Button
                                            variant={dataSource === 'api' ? 'info' : 'ghost'}
                                            size="sm"
                                            onClick={() => {
                                                setDataSource('api')
                                                const convertedData = convertApiDataToComponentFormat(apiGstData)
                                                setGstFilingData(convertedData)
                                            }}
                                            className="h-6 px-2 text-xs"
                                        >
                                            <Wifi className="w-3 h-3 mr-1" />
                                            Live
                                        </Button>
                                    </>
                                )}
                            </div>
                        )}

                        <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setShowRefreshInfo(!showRefreshInfo)}
                            className="flex items-center gap-1"
                        >
                            <Info className="w-3 h-3" />
                            Refresh Info
                        </Button>
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={handleRefreshGstData}
                            disabled={isRefreshing || !refreshStatus?.can_refresh}
                            className="flex items-center gap-2"
                        >
                            <RefreshCw className={`w-4 h-4 ${isRefreshing ? 'animate-spin' : ''}`} />
                            {isRefreshing ? 'Refreshing...' : 'Refresh GST Data'}
                        </Button>
                        <Badge variant="info" className="flex items-center gap-1">
                            <Calendar className="w-3 h-3" />
                            Last 12 Months
                        </Badge>
                    </div>
                </div>

                <div className="space-y-3">
                    <p className="text-sm text-neutral-60">
                        Aging analysis of GST filings for active registrations
                    </p>

                    {/* Refresh Status Info */}
                    {showRefreshInfo && refreshStatus && (
                        <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
                            <div className="flex items-center gap-2 mb-3">
                                <Info className="w-4 h-4 text-blue-600" />
                                <span className="font-medium text-blue-900">GST Data Refresh Management</span>
                            </div>

                            {/* Quota Status */}
                            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                                <div className="bg-white p-3 rounded-lg border">
                                    <div className="text-xs text-blue-600 mb-1">Monthly Quota</div>
                                    <div className="text-lg font-bold text-blue-900">
                                        {refreshStatus.refresh_count}/{refreshStatus.max_refreshes}
                                    </div>
                                    <div className="text-xs text-blue-600">
                                        {refreshStatus.max_refreshes - refreshStatus.refresh_count} remaining
                                    </div>
                                </div>

                                <div className="bg-white p-3 rounded-lg border">
                                    <div className="text-xs text-blue-600 mb-1">Status</div>
                                    <div className={`text-lg font-bold ${refreshStatus.can_refresh ? 'text-green-600' : 'text-red-600'}`}>
                                        {refreshStatus.can_refresh ? 'Available' : 'Exhausted'}
                                    </div>
                                    <div className="text-xs text-blue-600">
                                        {refreshStatus.can_refresh ? 'Can refresh now' : 'Limit reached'}
                                    </div>
                                </div>

                                <div className="bg-white p-3 rounded-lg border">
                                    <div className="text-xs text-blue-600 mb-1">Reset In</div>
                                    <div className="text-lg font-bold text-blue-900">
                                        {refreshStatus.days_until_reset} days
                                    </div>
                                    <div className="text-xs text-blue-600">
                                        Next month quota
                                    </div>
                                </div>

                                <div className="bg-white p-3 rounded-lg border">
                                    <div className="text-xs text-blue-600 mb-1">Active GSTINs</div>
                                    <div className="text-lg font-bold text-blue-900">
                                        {activeGstins.length}
                                    </div>
                                    <div className="text-xs text-blue-600">
                                        Will be refreshed
                                    </div>
                                </div>
                            </div>

                            {/* Last Refresh Info */}
                            {refreshStatus.last_refresh_at && (
                                <div className="bg-white p-3 rounded-lg border">
                                    <div className="text-xs text-blue-600 mb-1">Last Refresh</div>
                                    <div className="text-sm font-medium text-blue-900">
                                        {new Date(refreshStatus.last_refresh_at).toLocaleString('en-IN', {
                                            day: '2-digit',
                                            month: 'short',
                                            year: 'numeric',
                                            hour: '2-digit',
                                            minute: '2-digit'
                                        })}
                                    </div>
                                </div>
                            )}

                            {/* Cost Information */}
                            {/* <div className="mt-3 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                                <div className="text-xs font-medium text-yellow-800 mb-1">Cost Information</div>
                                <div className="text-xs text-yellow-700">
                                    Each refresh costs ₹{(activeGstins.length * 0.10).toFixed(2)}
                                    ({activeGstins.length} GSTINs × ₹0.10 per API call)
                                </div>
                            </div> */}
                        </div>
                    )}

                    {/* Refresh Error */}
                    {refreshError && (
                        <Alert variant="error">
                            <AlertTriangle className="w-4 h-4" />
                            <div>
                                <p className="font-medium">Refresh Failed</p>
                                <p className="text-sm mt-1">{refreshError}</p>
                            </div>
                        </Alert>
                    )}

                    {/* Data Source Info */}
                    <div className="flex items-center gap-4 text-xs text-neutral-60">
                        <div className="flex items-center gap-1">
                            {dataSource === 'api' ? (
                                <>
                                    <Wifi className="w-3 h-3 text-green-600" />
                                    <span>Showing live data from GST portal</span>
                                </>
                            ) : (
                                <>
                                    <WifiOff className="w-3 h-3 text-neutral-500" />
                                    <span>Showing extracted data from uploaded documents</span>
                                </>
                            )}
                        </div>
                        {!refreshStatus?.can_refresh && (
                            <div className="text-orange-600">
                                Monthly refresh limit reached
                            </div>
                        )}
                    </div>

                    {/* Data Comparison Alert */}
                    {dataSource === 'api' && refreshStatus && Object.keys(apiGstData).length > 0 && (
                        <div className="p-3 bg-green-50 border border-green-200 rounded-lg">
                            <div className="flex items-center gap-2 mb-2">
                                <CheckCircle className="w-4 h-4 text-green-600" />
                                <span className="font-medium text-green-900">Live Data Active</span>
                            </div>
                            <div className="text-sm text-green-700">
                                You are now viewing the latest GST filing data directly from the GST portal.
                                This data is more current than the extracted data from your uploaded documents.
                            </div>
                            {refreshStatus.last_refresh_at && <div className="mt-2 text-xs text-green-600">
                                Last updated: {new Date(refreshStatus.last_refresh_at).toLocaleString('en-IN', {
                                    day: '2-digit',
                                    month: 'short',
                                    year: 'numeric',
                                    hour: '2-digit',
                                    minute: '2-digit'
                                })}
                            </div>
                            }
                        </div>
                    )}

                    {/* Live Data Available Alert */}
                    {dataSource === 'extracted' && Object.keys(apiGstData).length > 0 && (
                        <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
                            <div className="flex items-center gap-2 mb-2">
                                <Info className="w-4 h-4 text-blue-600" />
                                <span className="font-medium text-blue-900">Live Data Available</span>
                            </div>
                            <div className="text-sm text-blue-700">
                                Fresh GST filing data from the portal is available for this company.
                                Use the "Live" toggle above to view the most current filing information.
                            </div>
                            <div className="mt-2 flex items-center gap-2">
                                <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => {
                                        setDataSource('api')
                                        const convertedData = convertApiDataToComponentFormat(apiGstData)
                                        setGstFilingData(convertedData)
                                    }}
                                    className="text-xs"
                                >
                                    <Wifi className="w-3 h-3 mr-1" />
                                    Switch to Live Data
                                </Button>
                                <span className="text-xs text-blue-600">
                                    {Object.keys(apiGstData).length} GSTIN(s) with fresh data
                                </span>
                            </div>
                        </div>
                    )}
                </div>
            </CardHeader>
            <CardContent>
                <div className="overflow-x-auto">
                    <table className="w-full border-collapse">
                        <thead>
                            <tr className="bg-blue-50 border-b-2 border-blue-200">
                                <th rowSpan={2} className="border border-neutral-200 p-3 text-left font-semibold text-neutral-90 min-w-[200px]">
                                    GSTIN & STATE
                                </th>
                                <th rowSpan={2} className="border border-neutral-200 p-3 text-left font-semibold text-neutral-90 min-w-[100px]">
                                    RETURN TYPE
                                </th>
                                <th rowSpan={2} className="border border-neutral-200 p-3 text-left font-semibold text-neutral-90 min-w-[180px]">
                                    LATEST FILING & TAX PERIOD
                                </th>
                                <th colSpan={5} className="border border-neutral-200 p-3 text-center font-semibold text-neutral-90">
                                    <div className="flex items-center justify-center gap-2">
                                        <span>Aging of Filings (Last 12 Months)</span>
                                        {dataSource === 'api' && (
                                            <Badge variant="success" size="sm" className="text-xs">
                                                Live Data
                                            </Badge>
                                        )}
                                        {dataSource === 'extracted' && (
                                            <Badge variant="secondary" size="sm" className="text-xs">
                                                Extracted Data
                                            </Badge>
                                        )}
                                    </div>
                                </th>
                            </tr>
                            <tr className="bg-blue-50 border-b border-blue-200">
                                <th className="border border-neutral-200 p-2 text-center font-medium text-neutral-80 min-w-[80px]">
                                    By Due Date
                                </th>
                                <th className="border border-neutral-200 p-2 text-center font-medium text-neutral-80 min-w-[80px]">
                                    1-5 DPD
                                </th>
                                <th className="border border-neutral-200 p-2 text-center font-medium text-neutral-80 min-w-[80px]">
                                    6-15 DPD
                                </th>
                                <th className="border border-neutral-200 p-2 text-center font-medium text-neutral-80 min-w-[80px]">
                                    16-30 DPD
                                </th>
                                <th className="border border-neutral-200 p-2 text-center font-medium text-neutral-80 min-w-[80px]">
                                    30+ DPD
                                </th>
                            </tr>
                        </thead>
                        <tbody>
                            {gstFilingData.map((filing, index) => (
                                <React.Fragment key={filing.gstin}>
                                    {/* GSTR3B Row */}
                                    <tr className={index % 2 === 0 ? 'bg-white' : 'bg-neutral-5'}>
                                        <td rowSpan={2} className="border border-neutral-200 p-3 align-middle border-r-2 border-r-neutral-300">
                                            <div className="font-medium text-neutral-90 mb-1">
                                                {filing.gstin}
                                            </div>
                                            <div className="text-xs text-neutral-60">
                                                ({filing.state})
                                            </div>
                                        </td>
                                        <td className="border border-neutral-200 p-3">
                                            <Badge variant="info" size="sm">GSTR3B</Badge>
                                        </td>
                                        <td className="border border-neutral-200 p-3 text-sm">
                                            {filing.gstr3b_latest_filing}
                                        </td>
                                        <td className="border border-neutral-200 p-3 text-center">
                                            <Badge variant="success" size="sm">
                                                {filing.gstr3b_aging.on_time}
                                            </Badge>
                                        </td>
                                        <td className="border border-neutral-200 p-3 text-center">
                                            <Badge
                                                variant={getDelayBadgeVariant(filing.gstr3b_aging['1-5'],
                                                    Object.values(filing.gstr3b_aging).reduce((a, b) => a + b, 0))}
                                                size="sm"
                                            >
                                                {filing.gstr3b_aging['1-5']}
                                            </Badge>
                                        </td>
                                        <td className="border border-neutral-200 p-3 text-center">
                                            <Badge
                                                variant={getDelayBadgeVariant(filing.gstr3b_aging['6-15'],
                                                    Object.values(filing.gstr3b_aging).reduce((a, b) => a + b, 0))}
                                                size="sm"
                                            >
                                                {filing.gstr3b_aging['6-15']}
                                            </Badge>
                                        </td>
                                        <td className="border border-neutral-200 p-3 text-center">
                                            <Badge
                                                variant={getDelayBadgeVariant(filing.gstr3b_aging['16-30'],
                                                    Object.values(filing.gstr3b_aging).reduce((a, b) => a + b, 0))}
                                                size="sm"
                                            >
                                                {filing.gstr3b_aging['16-30']}
                                            </Badge>
                                        </td>
                                        <td className="border border-neutral-200 p-3 text-center">
                                            <Badge
                                                variant={getDelayBadgeVariant(filing.gstr3b_aging['30+'],
                                                    Object.values(filing.gstr3b_aging).reduce((a, b) => a + b, 0))}
                                                size="sm"
                                            >
                                                {filing.gstr3b_aging['30+']}
                                            </Badge>
                                        </td>
                                    </tr>
                                    {/* GSTR1 Row */}
                                    <tr className={index % 2 === 0 ? 'bg-white' : 'bg-neutral-5'}>
                                        <td className="border border-neutral-200 p-3">
                                            <Badge variant="warning" size="sm">GSTR1</Badge>
                                        </td>
                                        <td className="border border-neutral-200 p-3 text-sm">
                                            {filing.gstr1_latest_filing}
                                        </td>
                                        <td className="border border-neutral-200 p-3 text-center">
                                            <Badge variant="success" size="sm">
                                                {filing.gstr1_aging.on_time}
                                            </Badge>
                                        </td>
                                        <td className="border border-neutral-200 p-3 text-center">
                                            <Badge
                                                variant={getDelayBadgeVariant(filing.gstr1_aging['1-5'],
                                                    Object.values(filing.gstr1_aging).reduce((a, b) => a + b, 0))}
                                                size="sm"
                                            >
                                                {filing.gstr1_aging['1-5']}
                                            </Badge>
                                        </td>
                                        <td className="border border-neutral-200 p-3 text-center">
                                            <Badge
                                                variant={getDelayBadgeVariant(filing.gstr1_aging['6-15'],
                                                    Object.values(filing.gstr1_aging).reduce((a, b) => a + b, 0))}
                                                size="sm"
                                            >
                                                {filing.gstr1_aging['6-15']}
                                            </Badge>
                                        </td>
                                        <td className="border border-neutral-200 p-3 text-center">
                                            <Badge
                                                variant={getDelayBadgeVariant(filing.gstr1_aging['16-30'],
                                                    Object.values(filing.gstr1_aging).reduce((a, b) => a + b, 0))}
                                                size="sm"
                                            >
                                                {filing.gstr1_aging['16-30']}
                                            </Badge>
                                        </td>
                                        <td className="border border-neutral-200 p-3 text-center">
                                            <Badge
                                                variant={getDelayBadgeVariant(filing.gstr1_aging['30+'],
                                                    Object.values(filing.gstr1_aging).reduce((a, b) => a + b, 0))}
                                                size="sm"
                                            >
                                                {filing.gstr1_aging['30+']}
                                            </Badge>
                                        </td>
                                    </tr>
                                </React.Fragment>
                            ))}
                            {/* Totals Row */}
                            <tr className="bg-blue-100 border-t-2 border-blue-300 font-semibold">
                                <td colSpan={2} className="border border-neutral-200 p-3 text-center text-neutral-90">
                                    TOTAL
                                </td>
                                <td className="border border-neutral-200 p-3 text-center text-neutral-60">
                                    -
                                </td>
                                <td className="border border-neutral-200 p-3 text-center">
                                    <Badge variant="success" size="sm">
                                        {totals.on_time}
                                    </Badge>
                                </td>
                                <td className="border border-neutral-200 p-3 text-center">
                                    <Badge variant="warning" size="sm">
                                        {totals['1-5']}
                                    </Badge>
                                </td>
                                <td className="border border-neutral-200 p-3 text-center">
                                    <Badge variant="warning" size="sm">
                                        {totals['6-15']}
                                    </Badge>
                                </td>
                                <td className="border border-neutral-200 p-3 text-center">
                                    <Badge variant="error" size="sm">
                                        {totals['16-30']}
                                    </Badge>
                                </td>
                                <td className="border border-neutral-200 p-3 text-center">
                                    <Badge variant="error" size="sm">
                                        {totals['30+']}
                                    </Badge>
                                </td>
                            </tr>
                        </tbody>
                    </table>
                </div>

                {/* Summary Cards */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-6">
                    <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                        <div className="flex items-center gap-2 mb-2">
                            <CheckCircle className="w-4 h-4 text-green-600" />
                            <span className="text-sm font-medium text-green-800">On Time</span>
                        </div>
                        <div className="text-2xl font-bold text-green-900">{totals.on_time}</div>
                        <div className="text-xs text-green-600">Filed by due date</div>
                    </div>

                    <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                        <div className="flex items-center gap-2 mb-2">
                            <Clock className="w-4 h-4 text-yellow-600" />
                            <span className="text-sm font-medium text-yellow-800">1-15 Days Late</span>
                        </div>
                        <div className="text-2xl font-bold text-yellow-900">{totals['1-5'] + totals['6-15']}</div>
                        <div className="text-xs text-yellow-600">Minor delays</div>
                    </div>

                    <div className="bg-orange-50 border border-orange-200 rounded-lg p-4">
                        <div className="flex items-center gap-2 mb-2">
                            <AlertTriangle className="w-4 h-4 text-orange-600" />
                            <span className="text-sm font-medium text-orange-800">16-30 Days Late</span>
                        </div>
                        <div className="text-2xl font-bold text-orange-900">{totals['16-30']}</div>
                        <div className="text-xs text-orange-600">Moderate delays</div>
                    </div>

                    <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                        <div className="flex items-center gap-2 mb-2">
                            <TrendingUp className="w-4 h-4 text-red-600" />
                            <span className="text-sm font-medium text-red-800">30+ Days Late</span>
                        </div>
                        <div className="text-2xl font-bold text-red-900">{totals['30+']}</div>
                        <div className="text-xs text-red-600">Significant delays</div>
                    </div>
                </div>

                <div className="mt-4 space-y-3">
                    <div className="p-3 bg-neutral-5 rounded-lg">
                        <p className="text-xs text-neutral-60">
                            <strong>Note:</strong> DPD = Days Past Due. Analysis based on last 12 months of filing data for active GSTINs only.
                            Filing compliance is critical for maintaining good standing with tax authorities.
                        </p>
                    </div>

                    {/* Refresh Information */}
                    <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
                        <div className="flex items-center gap-2 mb-2">
                            <RefreshCw className="w-4 h-4 text-blue-600" />
                            <span className="text-sm font-medium text-blue-900">GST Data Refresh System</span>
                        </div>
                        <div className="text-xs text-blue-700 space-y-1">
                            <p>• <strong>Live Data:</strong> Get the latest filing information directly from the GST portal</p>
                            <p>• <strong>Monthly Quota:</strong> 2 refreshes per company per month to control costs</p>
                            <p>• <strong>Smart Caching:</strong> Fresh data (less than 7 days old) served from cache</p>
                            <p>• <strong>Current FY:</strong> Refresh includes all active GSTINs for {getCurrentFinancialYear()}</p>
                            <p>• <strong>Data Comparison:</strong> Toggle between original (extracted) and live (API) data</p>
                            {dataSource === 'api' && (
                                <p className="text-green-700 font-medium">• Currently viewing live data from GST portal</p>
                            )}
                            {dataSource === 'extracted' && (
                                <p className="text-orange-700 font-medium">• Currently viewing extracted data from uploaded documents</p>
                            )}
                        </div>
                    </div>
                </div>
            </CardContent>
        </Card>
    )
}