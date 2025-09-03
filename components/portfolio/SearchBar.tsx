// components/portfolio/SearchBar.tsx
'use client'

import { useState, useEffect, useRef } from 'react'
import { Search, X, Filter, TrendingUp, Building2, MapPin } from 'lucide-react'
import { Input } from '@/components/ui/Input'
import { Button } from '@/components/ui/Button'
import { Badge } from '@/components/ui/Badge'

interface SearchBarProps {
    value: string
    onChange: (value: string) => void
    onSearch: (query: string) => void
    placeholder?: string
    suggestions?: SearchSuggestion[]
    isLoading?: boolean
    className?: string
}

interface SearchSuggestion {
    type: 'company' | 'industry' | 'region' | 'risk_grade' | 'parameter'
    value: string
    label: string
    count?: number
    icon?: React.ReactNode
}

export function SearchBar({
    value,
    onChange,
    onSearch,
    placeholder = "Search companies, CIN, PAN, industry, or risk parameters...",
    suggestions = [],
    isLoading = false,
    className = ''
}: SearchBarProps) {
    const [isFocused, setIsFocused] = useState(false)
    const [showSuggestions, setShowSuggestions] = useState(false)
    const [selectedIndex, setSelectedIndex] = useState(-1)
    const inputRef = useRef<HTMLInputElement>(null)
    const suggestionsRef = useRef<HTMLDivElement>(null)

    // Filter suggestions based on current input
    const filteredSuggestions = suggestions.filter(suggestion =>
        suggestion.label.toLowerCase().includes(value.toLowerCase()) ||
        suggestion.value.toLowerCase().includes(value.toLowerCase())
    ).slice(0, 8) // Limit to 8 suggestions

    useEffect(() => {
        setSelectedIndex(-1)
    }, [value])

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault()
        if (selectedIndex >= 0 && filteredSuggestions[selectedIndex]) {
            const suggestion = filteredSuggestions[selectedIndex]
            onChange(suggestion.value)
            onSearch(suggestion.value)
        } else {
            onSearch(value)
        }
        setShowSuggestions(false)
    }

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (!showSuggestions || filteredSuggestions.length === 0) return

        switch (e.key) {
            case 'ArrowDown':
                e.preventDefault()
                setSelectedIndex(prev =>
                    prev < filteredSuggestions.length - 1 ? prev + 1 : 0
                )
                break
            case 'ArrowUp':
                e.preventDefault()
                setSelectedIndex(prev =>
                    prev > 0 ? prev - 1 : filteredSuggestions.length - 1
                )
                break
            case 'Escape':
                setShowSuggestions(false)
                setSelectedIndex(-1)
                inputRef.current?.blur()
                break
            case 'Tab':
                if (selectedIndex >= 0) {
                    e.preventDefault()
                    const suggestion = filteredSuggestions[selectedIndex]
                    onChange(suggestion.value)
                }
                setShowSuggestions(false)
                break
        }
    }

    const handleSuggestionClick = (suggestion: SearchSuggestion) => {
        onChange(suggestion.value)
        onSearch(suggestion.value)
        setShowSuggestions(false)
        inputRef.current?.focus()
    }

    const clearSearch = () => {
        onChange('')
        onSearch('')
        inputRef.current?.focus()
    }

    const getSuggestionIcon = (type: string) => {
        switch (type) {
            case 'company':
                return <Building2 className="w-4 h-4 text-blue-500" />
            case 'industry':
                return <Filter className="w-4 h-4 text-green-500" />
            case 'region':
                return <MapPin className="w-4 h-4 text-purple-500" />
            case 'risk_grade':
                return <TrendingUp className="w-4 h-4 text-orange-500" />
            case 'parameter':
                return <Filter className="w-4 h-4 text-gray-500" />
            default:
                return <Search className="w-4 h-4 text-gray-400" />
        }
    }

    const getSuggestionTypeLabel = (type: string) => {
        switch (type) {
            case 'company': return 'Company'
            case 'industry': return 'Industry'
            case 'region': return 'Region'
            case 'risk_grade': return 'Risk Grade'
            case 'parameter': return 'Parameter'
            default: return 'Search'
        }
    }

    return (
        <div className={`relative ${className}`}>
            <form onSubmit={handleSubmit} className="relative">
                <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-neutral-50" />
                    <Input
                        ref={inputRef}
                        type="text"
                        value={value}
                        onChange={(e) => onChange(e.target.value)}
                        onFocus={() => {
                            setIsFocused(true)
                            setShowSuggestions(true)
                        }}
                        onBlur={() => {
                            // Delay hiding suggestions to allow for clicks
                            setTimeout(() => {
                                setIsFocused(false)
                                setShowSuggestions(false)
                            }, 200)
                        }}
                        onKeyDown={handleKeyDown}
                        placeholder={placeholder}
                        className="pl-10 pr-20 py-3 text-base"
                        disabled={isLoading}
                    />

                    <div className="absolute right-2 top-1/2 transform -translate-y-1/2 flex items-center gap-2">
                        {value && (
                            <button
                                type="button"
                                onClick={clearSearch}
                                className="p-1 hover:bg-neutral-20 rounded-full transition-colors"
                                aria-label="Clear search"
                            >
                                <X className="w-4 h-4 text-neutral-60" />
                            </button>
                        )}

                        <Button
                            type="submit"
                            size="sm"
                            variant="primary"
                            disabled={isLoading}
                            className="px-3"
                        >
                            {isLoading ? (
                                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                            ) : (
                                'Search'
                            )}
                        </Button>
                    </div>
                </div>
            </form>

            {/* Search Suggestions */}
            {showSuggestions && filteredSuggestions.length > 0 && (
                <div
                    ref={suggestionsRef}
                    className="absolute top-full left-0 right-0 mt-1 bg-white border border-neutral-30 rounded-lg shadow-lg z-50 max-h-80 overflow-y-auto"
                >
                    <div className="p-2">
                        <div className="text-xs font-medium text-neutral-60 mb-2 px-2">
                            Search Suggestions
                        </div>
                        {filteredSuggestions.map((suggestion, index) => (
                            <button
                                key={`${suggestion.type}-${suggestion.value}`}
                                onClick={() => handleSuggestionClick(suggestion)}
                                className={`
                  w-full flex items-center gap-3 px-3 py-2 rounded-lg text-left transition-colors
                  ${index === selectedIndex
                                        ? 'bg-blue-50 border border-blue-200'
                                        : 'hover:bg-neutral-10'
                                    }
                `}
                            >
                                {getSuggestionIcon(suggestion.type)}
                                <div className="flex-1 min-w-0">
                                    <div className="flex items-center gap-2">
                                        <span className="text-sm font-medium text-neutral-90 truncate">
                                            {suggestion.label}
                                        </span>
                                        <Badge variant="secondary" className="text-xs">
                                            {getSuggestionTypeLabel(suggestion.type)}
                                        </Badge>
                                    </div>
                                    {suggestion.count !== undefined && (
                                        <div className="text-xs text-neutral-60">
                                            {suggestion.count} companies
                                        </div>
                                    )}
                                </div>
                            </button>
                        ))}
                    </div>
                </div>
            )}

            {/* Search Tips */}
            {showSuggestions && filteredSuggestions.length === 0 && value.length > 0 && (
                <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-neutral-30 rounded-lg shadow-lg z-50 p-4">
                    <div className="text-sm text-neutral-60">
                        <div className="font-medium mb-2">Search Tips:</div>
                        <ul className="space-y-1 text-xs">
                            <li>• Search by company name, CIN, or PAN</li>
                            <li>• Filter by industry (e.g., "Manufacturing", "Services")</li>
                            <li>• Search by risk grade (e.g., "CM1", "CM2")</li>
                            <li>• Look for regions (e.g., "Maharashtra", "Karnataka")</li>
                            <li>• Search risk parameters (e.g., "EBITDA", "Current Ratio")</li>
                        </ul>
                    </div>
                </div>
            )}
        </div>
    )
}

// Default search suggestions for common searches
export const defaultSearchSuggestions: SearchSuggestion[] = [
    { type: 'risk_grade', value: 'CM1', label: 'CM1 - Excellent Risk Grade', count: 45 },
    { type: 'risk_grade', value: 'CM2', label: 'CM2 - Good Risk Grade', count: 78 },
    { type: 'risk_grade', value: 'CM3', label: 'CM3 - Average Risk Grade', count: 92 },
    { type: 'risk_grade', value: 'CM4', label: 'CM4 - Poor Risk Grade', count: 65 },
    { type: 'risk_grade', value: 'CM5', label: 'CM5 - Critical Risk Grade', count: 20 },
    { type: 'industry', value: 'Manufacturing', label: 'Manufacturing', count: 120 },
    { type: 'industry', value: 'Services', label: 'Services', count: 85 },
    { type: 'industry', value: 'Technology', label: 'Technology', count: 42 },
    { type: 'region', value: 'Maharashtra', label: 'Maharashtra', count: 95 },
    { type: 'region', value: 'Karnataka', label: 'Karnataka', count: 67 },
    { type: 'region', value: 'Tamil Nadu', label: 'Tamil Nadu', count: 54 },
    { type: 'parameter', value: 'EBITDA Margin', label: 'EBITDA Margin Analysis' },
    { type: 'parameter', value: 'Current Ratio', label: 'Current Ratio Analysis' },
    { type: 'parameter', value: 'Debt Equity', label: 'Debt-to-Equity Analysis' }
]