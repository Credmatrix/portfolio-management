'use client'

import React, { useState, useEffect, useCallback } from 'react'
import { Card, CardContent, CardHeader } from '@/components/ui/Card'
import { Input } from '@/components/ui/Input'
import { Button } from '@/components/ui/Button'
import { Badge } from '@/components/ui/Badge'
import { Skeleton } from '@/components/ui/Skeleton'
import { Alert } from '@/components/ui/Alert'
import { CompanySearchResult } from '@/types/manual-company.types'
import { useDebounce } from '@/lib/hooks/useDebounce'
import {
    Search,
    Building2,
    CheckCircle,
    AlertTriangle,
    Database,
    Wifi,
    FileText,
    Plus,
    ExternalLink,
    Sparkles,
    Info,
    Clock,
    Users,
    MapPin,
    Calendar,
    Shield,
    TrendingUp,
    X,
    RefreshCw
} from 'lucide-react'

interface CompanySearchStepProps {
    searchResults: CompanySearchResult[]
    selectedCompany: CompanySearchResult | null
    onSearchResults: (results: CompanySearchResult[]) => void
    onCompanySelect: (company: CompanySearchResult) => void
    onNoResultsAction: () => void
    onRetrySearch?: () => void
    isLoading?: boolean
}

export function CompanySearchStep({
    searchResults,
    selectedCompany,
    onSearchResults,
    onCompanySelect,
    onNoResultsAction,
    onRetrySearch,
    isLoading = false
}: CompanySearchStepProps) {
    const [searchQuery, setSearchQuery] = useState('')
    const [isSearching, setIsSearching] = useState(false)
    const [searchError, setSearchError] = useState<string | null>(null)
    const [suggestions, setSuggestions] = useState<string[]>([])
    const [dataSourceInfo, setDataSourceInfo] = useState<any>({})
    const [showDisambiguation, setShowDisambiguation] = useState(false)
    const [searchHistory, setSearchHistory] = useState<string[]>([])
    const [searchMetadata, setSearchMetadata] = useState<any>({})

    const debouncedSearchQuery = useDebounce(searchQuery, 1500)

    // Perform search when debounced query changes
    useEffect(() => {
        if (debouncedSearchQuery.length >= 2) {
            performSearch(debouncedSearchQuery)
        } else {
            onSearchResults([])
            setSuggestions([])
            setDataSourceInfo({})
        }
    }, [debouncedSearchQuery])

    const performSearch = useCallback(async (query: string) => {
        setIsSearching(true)
        setSearchError(null)
        setShowDisambiguation(false)

        try {
            const searchParams = new URLSearchParams({
                query: query,
                enhanced: 'true',
                include_suggestions: 'true',
                include_data_sources: 'true',
                limit: '15'
            })

            const response = await fetch(`/api/company/search?${searchParams}`)
            const data = await response.json()

            if (!response.ok) {
                throw new Error(data.error_message || 'Search failed')
            }

            if (data.success) {
                const results = data.results || []
                onSearchResults(results)
                setSuggestions(data.suggestions || [])
                setDataSourceInfo(data.data_sources || {})
                setSearchMetadata(data.search_metadata || {})

                // Add to search history if not already present
                if (query.length >= 2 && !searchHistory.includes(query)) {
                    setSearchHistory(prev => [query, ...prev.slice(0, 4)])
                }

                // Show disambiguation if multiple similar results
                if (results.length > 1) {
                    const similarResults = results.filter((r: CompanySearchResult) =>
                        r.match_score >= 70 && r.name.toLowerCase().includes(query.toLowerCase())
                    )
                    if (similarResults.length > 1) {
                        setShowDisambiguation(true)
                    }
                }
            } else {
                throw new Error(data.error_message || 'Search failed')
            }
        } catch (error) {
            console.error('Search error:', error)
            setSearchError(error instanceof Error ? error.message : 'Search failed')
            onSearchResults([])
            setSuggestions([])
            setSearchMetadata({})
        } finally {
            setIsSearching(false)
        }
    }, [onSearchResults, searchHistory])

    const handleSuggestionClick = (suggestion: string) => {
        setSearchQuery(suggestion)
    }

    const handleRetrySearch = () => {
        if (searchQuery) {
            performSearch(searchQuery)
        }
        if (onRetrySearch) {
            onRetrySearch()
        }
    }

    const clearSearch = () => {
        setSearchQuery('')
        onSearchResults([])
        setSuggestions([])
        setDataSourceInfo({})
        setSearchError(null)
        setShowDisambiguation(false)
    }

    const getDataAvailabilityIndicator = (company: CompanySearchResult) => {
        const hasApiData = company.processing_eligibility.some(p => p.type === 'api')
        const hasExcelSupport = company.processing_eligibility.some(p => p.type === 'excel')
        const isManualOnly = company.processing_eligibility.every(p => p.type === 'manual')

        if (hasApiData) {
            return { level: 'high', color: 'success', text: 'Rich Data Available' }
        } else if (hasExcelSupport) {
            return { level: 'medium', color: 'info', text: 'Partial Data Available' }
        } else if (isManualOnly) {
            return { level: 'low', color: 'secondary', text: 'Manual Entry Required' }
        }
        return { level: 'unknown', color: 'secondary', text: 'Data Availability Unknown' }
    }

    const getEstimatedProcessingTime = (company: CompanySearchResult) => {
        const primaryMethod = company.processing_eligibility[0]
        return primaryMethod?.estimated_time || 'Unknown'
    }

    const getProcessingMethodIcon = (method: string) => {
        switch (method) {
            case 'api':
                return <Wifi className="w-3 h-3" />
            case 'excel':
                return <FileText className="w-3 h-3" />
            case 'manual':
                return <Database className="w-3 h-3" />
            default:
                return <Database className="w-3 h-3" />
        }
    }

    const getProcessingMethodColor = (method: string) => {
        switch (method) {
            case 'api':
                return 'success'
            case 'excel':
                return 'info'
            case 'manual':
                return 'secondary'
            default:
                return 'secondary'
        }
    }

    const getEntityTypeDisplay = (entityType: string) => {
        return entityType.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())
    }

    return (
        <div className="space-y-6">
            {/* Search Header */}
            <div className="text-center space-y-2">
                <div className="flex items-center justify-center gap-2 text-blue-600 mb-4">
                    <Search className="w-6 h-6" />
                    <Sparkles className="w-4 h-4" />
                </div>
                <h3 className="text-lg font-semibold text-neutral-90">
                    Search for Your Company
                </h3>
                <p className="text-sm text-neutral-60 max-w-md mx-auto">
                    Start by searching for your company. We'll check multiple data sources and suggest the best processing method.
                </p>
            </div>

            {/* Search Input */}
            <Card>
                <CardContent className="p-6">
                    <div className="space-y-4">
                        <div className="relative">
                            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-neutral-400" />
                            <Input
                                type="text"
                                placeholder="Enter company name"
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className="pl-10 pr-12 py-3 text-base"
                                autoFocus
                                disabled={isLoading}
                            />
                            <div className="absolute right-3 top-1/2 transform -translate-y-1/2 flex items-center gap-2">
                                {(isSearching || isLoading) && (
                                    <div className="animate-spin rounded-full h-4 w-4 border-2 border-blue-600 border-t-transparent" />
                                )}
                                {searchQuery && !isSearching && (
                                    <Button
                                        variant="ghost"
                                        size="sm"
                                        onClick={clearSearch}
                                        className="h-6 w-6 p-0 hover:bg-neutral-10"
                                    >
                                        <X className="w-3 h-3" />
                                    </Button>
                                )}
                            </div>
                        </div>

                        {/* Search Suggestions and History */}
                        {(suggestions.length > 0 || searchHistory.length > 0) && !selectedCompany && searchQuery.length < 2 && (
                            <div className="space-y-3">
                                {suggestions.length > 0 && (
                                    <div className="space-y-2">
                                        <p className="text-xs font-medium text-neutral-600 flex items-center gap-1">
                                            <Sparkles className="w-3 h-3" />
                                            Smart Suggestions:
                                        </p>
                                        <div className="flex flex-wrap gap-2">
                                            {suggestions.slice(0, 6).map((suggestion, index) => (
                                                <Button
                                                    key={index}
                                                    variant="outline"
                                                    size="sm"
                                                    onClick={() => handleSuggestionClick(suggestion)}
                                                    className="text-xs hover:bg-blue-50 hover:border-blue-200"
                                                >
                                                    {suggestion}
                                                </Button>
                                            ))}
                                        </div>
                                    </div>
                                )}

                                {searchHistory.length > 0 && (
                                    <div className="space-y-2">
                                        <p className="text-xs font-medium text-neutral-600 flex items-center gap-1">
                                            <Clock className="w-3 h-3" />
                                            Recent Searches:
                                        </p>
                                        <div className="flex flex-wrap gap-2">
                                            {searchHistory.map((historyItem, index) => (
                                                <Button
                                                    key={index}
                                                    variant="ghost"
                                                    size="sm"
                                                    onClick={() => handleSuggestionClick(historyItem)}
                                                    className="text-xs text-neutral-600 hover:bg-neutral-10"
                                                >
                                                    {historyItem}
                                                </Button>
                                            ))}
                                        </div>
                                    </div>
                                )}
                            </div>
                        )}

                        {/* Active Search Suggestions */}
                        {suggestions.length > 0 && !selectedCompany && searchQuery.length >= 2 && (
                            <div className="space-y-2">
                                <p className="text-xs font-medium text-neutral-600 flex items-center gap-1">
                                    <Sparkles className="w-3 h-3" />
                                    Did you mean:
                                </p>
                                <div className="flex flex-wrap gap-2">
                                    {suggestions.slice(0, 4).map((suggestion, index) => (
                                        <Button
                                            key={index}
                                            variant="outline"
                                            size="sm"
                                            onClick={() => handleSuggestionClick(suggestion)}
                                            className="text-xs hover:bg-blue-50 hover:border-blue-200"
                                        >
                                            {suggestion}
                                        </Button>
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* Enhanced Data Source Summary */}
                        {/* {Object.keys(dataSourceInfo).length > 0 && (
                            <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg p-4 border border-blue-100">
                                <div className="flex items-center gap-2 mb-3">
                                    <Database className="w-4 h-4 text-blue-600" />
                                    <span className="text-sm font-medium text-blue-900">Data Source Analysis</span>
                                </div>

                                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                                    <div className="text-center">
                                        <div className="text-lg font-semibold text-blue-600">
                                            {dataSourceInfo.mca_companies || 0}
                                        </div>
                                        <div className="text-xs text-neutral-600">MCA Records</div>
                                        <div className="text-xs text-blue-600 font-medium">API Ready</div>
                                    </div>

                                    <div className="text-center">
                                        <div className="text-lg font-semibold text-green-600">
                                            {dataSourceInfo.api_eligible || 0}
                                        </div>
                                        <div className="text-xs text-neutral-600">API Eligible</div>
                                        <div className="text-xs text-green-600 font-medium">Fast Processing</div>
                                    </div>

                                    <div className="text-center">
                                        <div className="text-lg font-semibold text-yellow-600">
                                            {dataSourceInfo.excel_eligible || 0}
                                        </div>
                                        <div className="text-xs text-neutral-600">Excel Supported</div>
                                        <div className="text-xs text-yellow-600 font-medium">Medium Setup</div>
                                    </div>

                                    <div className="text-center">
                                        <div className="text-lg font-semibold text-orange-600">
                                            {dataSourceInfo.manual_only || 0}
                                        </div>
                                        <div className="text-xs text-neutral-600">Manual Only</div>
                                        <div className="text-xs text-orange-600 font-medium">Custom Entry</div>
                                    </div>
                                </div>

                                {searchMetadata?.search_time && (
                                    <div className="flex items-center justify-between mt-3 pt-3 border-t border-blue-200">
                                        <div className="flex items-center gap-1 text-xs text-blue-700">
                                            <Clock className="w-3 h-3" />
                                            Search completed in {Date.now() - searchMetadata.search_time}ms
                                        </div>
                                        <div className="text-xs text-blue-700">
                                            Sources: {searchMetadata.sources_searched?.join(', ') || 'Multiple'}
                                        </div>
                                    </div>
                                )}
                            </div>
                        )} */}
                    </div>
                </CardContent>
            </Card>

            {/* Search Error with Retry */}
            {searchError && (
                <Alert variant="error">
                    <AlertTriangle className="w-4 h-4" />
                    <div className="flex-1">
                        <p className="font-medium">Search Error</p>
                        <p className="text-sm mt-1">{searchError}</p>
                        <div className="flex items-center gap-2 mt-3">
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={handleRetrySearch}
                                className="flex items-center gap-1"
                            >
                                <RefreshCw className="w-3 h-3" />
                                Retry Search
                            </Button>
                            <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => setSearchError(null)}
                                className="text-xs"
                            >
                                Dismiss
                            </Button>
                        </div>
                    </div>
                </Alert>
            )}

            {/* Disambiguation Alert */}
            {showDisambiguation && searchResults.length > 1 && (
                <Alert variant="info">
                    <Info className="w-4 h-4" />
                    <div>
                        <p className="font-medium">Multiple matches found</p>
                        <p className="text-sm mt-1">
                            We found {searchResults.length} companies that match your search.
                            Please review the results below and select the correct company.
                        </p>
                    </div>
                </Alert>
            )}

            {/* Enhanced Search Results Loading */}
            {(isSearching || isLoading) ? (
                <div className="space-y-3">
                    <div className="flex items-center gap-2 text-sm text-neutral-600">
                        <div className="animate-spin rounded-full h-4 w-4 border-2 border-blue-600 border-t-transparent" />
                        <span>Searching across multiple data sources...</span>
                    </div>

                    {[1, 2, 3, 4].map((i) => (
                        <Card key={i} className="animate-pulse">
                            <CardContent className="p-4">
                                <div className="flex items-start gap-4">
                                    <div className="relative">
                                        <Skeleton className="w-12 h-12 rounded-lg" />
                                        <Skeleton className="absolute -bottom-1 -right-1 w-4 h-4 rounded-full" />
                                    </div>
                                    <div className="flex-1 space-y-3">
                                        <div className="space-y-2">
                                            <Skeleton className="w-3/4 h-5" />
                                            <div className="flex gap-2">
                                                <Skeleton className="w-20 h-4" />
                                                <Skeleton className="w-24 h-4" />
                                                <Skeleton className="w-16 h-4" />
                                            </div>
                                        </div>
                                        <Skeleton className="w-full h-3" />
                                        <div className="flex gap-2">
                                            <Skeleton className="w-16 h-6" />
                                            <Skeleton className="w-20 h-6" />
                                            <Skeleton className="w-18 h-6" />
                                        </div>
                                    </div>
                                    <div className="space-y-2">
                                        <Skeleton className="w-16 h-6" />
                                        <Skeleton className="w-12 h-4" />
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    ))}

                    <div className="text-center">
                        <p className="text-xs text-neutral-500">
                            Checking MCA database, portfolio entries, and manual records...
                        </p>
                    </div>
                </div>
            ) : searchResults.length > 0 ? (
                <div className="space-y-3">
                    <div className="flex items-center justify-between">
                        <h4 className="font-medium text-neutral-90">
                            Found {searchResults.length} result{searchResults.length !== 1 ? 's' : ''}
                        </h4>
                        <Badge variant="info" size="sm">
                            Click to select
                        </Badge>
                    </div>

                    {searchResults.map((company) => {
                        const dataAvailability = getDataAvailabilityIndicator(company)
                        const processingTime = getEstimatedProcessingTime(company)

                        return (
                            <Card
                                key={company.id}
                                className={`cursor-pointer transition-all hover:shadow-md border-l-4 ${selectedCompany?.id === company.id
                                    ? 'ring-2 ring-blue-500 bg-blue-50 border-l-blue-500'
                                    : 'hover:bg-neutral-20 border-l-transparent hover:border-l-blue-200'
                                    }`}
                                onClick={() => onCompanySelect(company)}
                            >
                                <CardContent className="p-4">
                                    <div className="flex items-start gap-4">
                                        {/* Company Icon with Status */}
                                        <div className="relative">
                                            <div className={`
                        flex items-center justify-center w-12 h-12 rounded-lg
                        ${selectedCompany?.id === company.id
                                                    ? 'bg-blue-100 text-blue-600'
                                                    : 'bg-neutral-100 text-neutral-600'}
                      `}>
                                                <Building2 className="w-6 h-6" />
                                            </div>

                                            {/* Data Availability Indicator */}
                                            <div className={`
                        absolute -bottom-1 -right-1 w-4 h-4 rounded-full border-2 border-white
                        ${dataAvailability.level === 'high' ? 'bg-green-500' :
                                                    dataAvailability.level === 'medium' ? 'bg-yellow-500' : 'bg-gray-400'}
                      `} />
                                        </div>

                                        {/* Company Details */}
                                        <div className="flex-1 min-w-0">
                                            <div className="flex items-start justify-between gap-4">
                                                <div className="min-w-0 flex-1">
                                                    <div className="flex items-center gap-2 mb-1">
                                                        <h5 className="font-semibold text-neutral-90 truncate">
                                                            {company.name}
                                                        </h5>
                                                        {company.match_score >= 95 && (
                                                            <Badge variant="success" size="sm" className="flex items-center gap-1">
                                                                <Shield className="w-3 h-3" />
                                                                Exact Match
                                                            </Badge>
                                                        )}
                                                    </div>

                                                    <div className="flex items-center gap-2 mb-2">
                                                        <Badge variant="secondary" size="sm">
                                                            {getEntityTypeDisplay(company.entity_type)}
                                                        </Badge>

                                                        {company.registration_number && (
                                                            <span className="text-xs text-neutral-500 font-mono">
                                                                {company.registration_number}
                                                            </span>
                                                        )}

                                                        <Badge
                                                            variant={dataAvailability.color as any}
                                                            size="sm"
                                                            className="flex items-center gap-1"
                                                        >
                                                            <Database className="w-3 h-3" />
                                                            {dataAvailability.text}
                                                        </Badge>
                                                    </div>

                                                    <p className="text-xs text-neutral-600 mb-2">
                                                        {company.match_reason}
                                                    </p>

                                                    {/* Enhanced Processing Methods */}
                                                    <div className="space-y-2">
                                                        <div className="flex items-center gap-2">
                                                            <span className="text-xs text-neutral-500">Processing options:</span>
                                                            <Badge variant="success" size="sm" className="flex items-center gap-1">
                                                                <Clock className="w-3 h-3" />
                                                                {processingTime}
                                                            </Badge>
                                                        </div>

                                                        <div className="flex flex-wrap gap-1">
                                                            {company.processing_eligibility.map((method, index) => (
                                                                <Badge
                                                                    key={index}
                                                                    variant={getProcessingMethodColor(method.type) as any}
                                                                    size="sm"
                                                                    className="flex items-center gap-1"
                                                                // title={method.eligibility_reason}
                                                                >
                                                                    {getProcessingMethodIcon(method.type)}
                                                                    {method.type.toUpperCase()}
                                                                    <span className="text-xs opacity-75">
                                                                        ({method.data_completeness_expected}%)
                                                                    </span>
                                                                </Badge>
                                                            ))}
                                                        </div>
                                                    </div>

                                                    {/* Additional Company Info */}
                                                    {(company.status !== 'Unknown' || company.data_sources.length > 1) && (
                                                        <div className="flex items-center gap-3 mt-2 pt-2 border-t border-neutral-100">
                                                            {company.status !== 'Unknown' && (
                                                                <div className="flex items-center gap-1 text-xs text-neutral-600">
                                                                    <TrendingUp className="w-3 h-3" />
                                                                    Status: {company.status}
                                                                </div>
                                                            )}

                                                            {company.data_sources.length > 1 && (
                                                                <div className="flex items-center gap-1 text-xs text-neutral-600">
                                                                    <Database className="w-3 h-3" />
                                                                    {company.data_sources.length} sources
                                                                </div>
                                                            )}
                                                        </div>
                                                    )}
                                                </div>

                                                {/* Selection Indicator and Match Score */}
                                                <div className="flex flex-col items-end gap-2">
                                                    <Badge
                                                        variant={company.match_score >= 90 ? "success" : company.match_score >= 70 ? "info" : "secondary"}
                                                        size="sm"
                                                    >
                                                        {Math.round(company.match_score)}% match
                                                    </Badge>

                                                    {selectedCompany?.id === company.id && (
                                                        <div className="flex items-center gap-1">
                                                            <CheckCircle className="w-5 h-5 text-green-600" />
                                                            <span className="text-xs text-green-600 font-medium">Selected</span>
                                                        </div>
                                                    )}
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>
                        )
                    })}
                </div>
            ) : searchQuery.length >= 2 && !isSearching ? (
                <Card className="border-dashed border-2 border-neutral-200">
                    <CardContent className="p-8 text-center">
                        <div className="space-y-6">
                            <div className="w-20 h-20 bg-gradient-to-br from-blue-100 to-indigo-100 rounded-full flex items-center justify-center mx-auto">
                                <Search className="w-10 h-10 text-blue-600" />
                            </div>

                            <div className="space-y-3">
                                <h4 className="text-lg font-semibold text-neutral-90">
                                    No companies found for "{searchQuery}"
                                </h4>
                                <p className="text-sm text-neutral-600 max-w-md mx-auto">
                                    We searched across MCA records, existing portfolio entries, and manual entries.
                                    Your company might not be in our database yet.
                                </p>
                            </div>

                            <div className="space-y-3">
                                <div className="flex items-center justify-center gap-4 text-xs text-neutral-500">
                                    <div className="flex items-center gap-1">
                                        <Database className="w-3 h-3" />
                                        MCA Database
                                    </div>
                                    <div className="flex items-center gap-1">
                                        <Users className="w-3 h-3" />
                                        Portfolio Entries
                                    </div>
                                    <div className="flex items-center gap-1">
                                        <FileText className="w-3 h-3" />
                                        Manual Entries
                                    </div>
                                </div>

                                <div className="bg-blue-50 rounded-lg p-4 text-left max-w-md mx-auto">
                                    <h5 className="font-medium text-blue-900 mb-2 flex items-center gap-2">
                                        <Info className="w-4 h-4" />
                                        What you can do next:
                                    </h5>
                                    <ul className="text-sm text-blue-800 space-y-1">
                                        <li>• Try searching with different keywords</li>
                                        <li>• Use CIN, PAN, or GSTIN if available</li>
                                        <li>• Add your company manually with custom details</li>
                                    </ul>
                                </div>
                            </div>

                            <div className="flex flex-col sm:flex-row gap-3 justify-center">
                                <Button
                                    variant="outline"
                                    onClick={handleRetrySearch}
                                    className="flex items-center gap-2"
                                >
                                    <RefreshCw className="w-4 h-4" />
                                    Try Different Search
                                </Button>

                                <Button
                                    onClick={onNoResultsAction}
                                    className="flex items-center gap-2"
                                >
                                    <Plus className="w-4 h-4" />
                                    Add Company Manually
                                </Button>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            ) : null}

            {/* Enhanced Selected Company Summary */}
            {selectedCompany && (
                <Card className="border-green-200 bg-green-50">
                    <CardContent className="p-4">
                        <div className="flex items-start gap-4">
                            <div className="flex items-center justify-center w-12 h-12 rounded-lg bg-green-100 text-green-600">
                                <CheckCircle className="w-6 h-6" />
                            </div>

                            <div className="flex-1">
                                <div className="flex items-center gap-2 mb-2">
                                    <h4 className="font-semibold text-green-900">Company Selected</h4>
                                    <Badge variant="success" size="sm">
                                        {selectedCompany.match_score}% match
                                    </Badge>
                                </div>

                                <div className="space-y-2">
                                    <div>
                                        <p className="font-medium text-green-800">{selectedCompany.name}</p>
                                        <p className="text-sm text-green-700">
                                            {getEntityTypeDisplay(selectedCompany.entity_type)}
                                            {selectedCompany.registration_number && (
                                                <span className="ml-2 font-mono">({selectedCompany.registration_number})</span>
                                            )}
                                        </p>
                                    </div>

                                    <div className="flex items-center gap-4 text-sm text-green-700">
                                        <div className="flex items-center gap-1">
                                            {getProcessingMethodIcon(selectedCompany.processing_eligibility[0]?.type)}
                                            <span>
                                                {selectedCompany.processing_eligibility[0]?.type.toUpperCase()} Processing
                                            </span>
                                        </div>

                                        <div className="flex items-center gap-1">
                                            <Clock className="w-3 h-3" />
                                            <span>{getEstimatedProcessingTime(selectedCompany)}</span>
                                        </div>

                                        <div className="flex items-center gap-1">
                                            <TrendingUp className="w-3 h-3" />
                                            <span>
                                                {selectedCompany.processing_eligibility[0]?.data_completeness_expected}% data expected
                                            </span>
                                        </div>
                                    </div>

                                    <p className="text-xs text-green-600 bg-green-100 rounded px-2 py-1 inline-block">
                                        ✓ Ready to proceed to next step
                                    </p>
                                </div>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            )}

            {/* Help Text */}
            <div className="text-center">
                <p className="text-xs text-neutral-500">
                    Search across MCA records, existing portfolio, and manual entries.
                    <br />
                    Can't find your company? You can add it manually in the next step.
                </p>
            </div>
        </div>
    )
}