"use client";

import { useState, useEffect, useRef } from "react";
import { Search, Building2, MapPin, Calendar, IndianRupee, Loader2 } from "lucide-react";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { CompanyDetails, CompanySuggestion } from "@/types/company.types";

interface CompanySearchProps {
    onCompanySelect: (company: CompanyDetails) => void;
    selectedCompany?: CompanyDetails | null;
}

export function CompanySearch({ onCompanySelect, selectedCompany }: CompanySearchProps) {
    const [query, setQuery] = useState("");
    const [suggestions, setSuggestions] = useState<CompanySuggestion[]>([]);
    const [isSearching, setIsSearching] = useState(false);
    const [isLoadingDetails, setIsLoadingDetails] = useState(false);
    const [showSuggestions, setShowSuggestions] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [isCompanySelected, setIsCompanySelected] = useState(false); // New flag to prevent search after selection

    const searchRef = useRef<HTMLDivElement>(null);
    const debounceRef = useRef<NodeJS.Timeout>(null);

    // Handle search with debouncing
    useEffect(() => {
        if (debounceRef.current) {
            clearTimeout(debounceRef.current);
        }

        // Don't search if company was just selected or query is too short
        if (query.trim().length < 2 || isCompanySelected) {
            setSuggestions([]);
            setShowSuggestions(false);
            return;
        }

        debounceRef.current = setTimeout(async () => {
            setIsSearching(true);
            setError(null);

            try {
                const response = await fetch(`/api/company/suggestions?query=${encodeURIComponent(query)}`);
                const result = await response.json();

                if (result.success) {
                    setSuggestions(result.data);
                    setShowSuggestions(true);
                } else {
                    setError(result.error || 'Failed to search companies');
                    setSuggestions([]);
                }
            } catch (err) {
                setError('Network error while searching');
                setSuggestions([]);
            } finally {
                setIsSearching(false);
            }
        }, 300);

        return () => {
            if (debounceRef.current) {
                clearTimeout(debounceRef.current);
            }
        };
    }, [query, isCompanySelected]);

    // Handle company selection
    const handleCompanySelect = async (suggestion: CompanySuggestion) => {
        setIsLoadingDetails(true);
        setError(null);
        setShowSuggestions(false);
        setIsCompanySelected(true); // Set flag to prevent search

        try {
            const response = await fetch(`/api/company/details?cin=${encodeURIComponent(suggestion.cin)}`);
            const result = await response.json();

            if (result.success) {
                onCompanySelect(result.data);
                setQuery(result.data.company_name);
                // Keep the flag set so it doesn't trigger search
            } else {
                setError(result.error || 'Failed to fetch company details');
                setIsCompanySelected(false); // Reset flag on error
            }
        } catch (err) {
            setError('Network error while fetching company details');
            setIsCompanySelected(false); // Reset flag on error
        } finally {
            setIsLoadingDetails(false);
        }
    };

    // Handle input change
    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const newQuery = e.target.value;
        setQuery(newQuery);

        // If user starts typing again, reset the company selected flag
        if (isCompanySelected && newQuery !== selectedCompany?.company_name) {
            setIsCompanySelected(false);
        }
    };

    // Handle click outside to close suggestions
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (searchRef.current && !searchRef.current.contains(event.target as Node)) {
                setShowSuggestions(false);
            }
        };

        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const clearSelection = () => {
        setQuery("");
        setIsCompanySelected(false);
        onCompanySelect(null as any);
        setSuggestions([]);
        setShowSuggestions(false);
        setError(null);
    };

    return (
        <div className="space-y-4">
            {/* Search Input */}
            <div ref={searchRef} className="relative">
                <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-neutral-60 w-4 h-4 z-10" />
                    <input
                        type="text"
                        value={query}
                        onChange={handleInputChange}
                        placeholder="Search for a company by name..."
                        className="w-full pl-10 pr-12 py-3 border border-neutral-30 rounded-lg focus:ring-2 focus:ring-primary-50 focus:border-primary-50 outline-none disabled:bg-neutral-10 disabled:cursor-not-allowed"
                        disabled={isLoadingDetails}
                    />
                    {(isSearching || isLoadingDetails) && (
                        <div className="absolute right-3 top-1/2 transform -translate-y-1/2 z-10">
                            <Loader2 className="text-neutral-60 w-4 h-4 animate-spin" />
                        </div>
                    )}
                </div>

                {/* Suggestions Dropdown */}
                {showSuggestions && suggestions.length > 0 && !isLoadingDetails && (
                    <Card className="absolute top-full left-0 right-0 mt-1 max-h-60 overflow-y-auto z-50 border border-neutral-30 shadow-lg bg-white">
                        {suggestions.map((suggestion, index) => (
                            <button
                                key={`${suggestion.cin}-${index}`}
                                onClick={() => handleCompanySelect(suggestion)}
                                className="w-full text-left px-4 py-3 hover:bg-neutral-10 border-b border-neutral-20 last:border-b-0 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                                disabled={isLoadingDetails}
                            >
                                <div className="flex items-center gap-3">
                                    <Building2 className="w-4 h-4 text-neutral-60 flex-shrink-0" />
                                    <div className="flex-1 min-w-0">
                                        <p className="font-medium text-neutral-90 truncate">
                                            {suggestion.suggestion}
                                        </p>
                                        <p className="text-sm text-neutral-60">
                                            CIN: {suggestion.cin}
                                        </p>
                                    </div>
                                </div>
                            </button>
                        ))}
                    </Card>
                )}
            </div>

            {/* Error Message */}
            {error && (
                <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
                    <p className="text-sm text-red-700">{error}</p>
                </div>
            )}

            {/* Loading State */}
            {isLoadingDetails && (
                <div className="flex items-center gap-2 text-neutral-60">
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span className="text-sm">Loading company details...</span>
                </div>
            )}

            {/* Selected Company Details */}
            {selectedCompany && (
                <Card className="p-6 bg-gradient-to-r from-primary-5 to-primary-10 border border-primary-20">
                    <div className="flex items-start justify-between mb-4">
                        <div className="flex items-center gap-3">
                            <div className="w-12 h-12 bg-primary-50 rounded-lg flex items-center justify-center">
                                <Building2 className="w-6 h-6 text-white" />
                            </div>
                            <div>
                                <h3 className="text-lg font-semibold text-neutral-90">
                                    {selectedCompany.company_name}
                                </h3>
                                <p className="text-sm text-neutral-60">
                                    CIN: {selectedCompany.cin}
                                </p>
                            </div>
                        </div>
                        <Button
                            variant="ghost"
                            size="sm"
                            onClick={clearSelection}
                            className="text-neutral-60 hover:text-neutral-90"
                        >
                            Clear
                        </Button>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        <div className="flex items-center gap-2">
                            <MapPin className="w-4 h-4 text-neutral-60" />
                            <div>
                                <p className="text-xs text-neutral-60">State</p>
                                <p className="text-sm font-medium text-neutral-90">
                                    {selectedCompany.state_info.name}
                                </p>
                            </div>
                        </div>

                        <div className="flex items-center gap-2">
                            <Calendar className="w-4 h-4 text-neutral-60" />
                            <div>
                                <p className="text-xs text-neutral-60">Registration Date</p>
                                <p className="text-sm font-medium text-neutral-90">
                                    {new Date(selectedCompany.registration_date).toLocaleDateString()}
                                </p>
                            </div>
                        </div>

                        <div className="flex items-center gap-2">
                            <IndianRupee className="w-4 h-4 text-neutral-60" />
                            <div>
                                <p className="text-xs text-neutral-60">Paid-up Capital</p>
                                <p className="text-sm font-medium text-neutral-90">
                                    {selectedCompany.formatted_capital.paidup}
                                </p>
                            </div>
                        </div>

                        <div>
                            <p className="text-xs text-neutral-60">Company Class</p>
                            <p className="text-sm font-medium text-neutral-90">
                                {selectedCompany.company_class}
                            </p>
                        </div>

                        <div>
                            <p className="text-xs text-neutral-60">Company Size</p>
                            <p className="text-sm font-medium text-neutral-90">
                                {selectedCompany.company_size}
                            </p>
                        </div>

                        <div>
                            <p className="text-xs text-neutral-60">Status</p>
                            <p className="text-sm font-medium text-neutral-90">
                                {selectedCompany.company_status}
                            </p>
                        </div>
                    </div>

                    <div className="mt-4">
                        <p className="text-xs text-neutral-60 mb-1">Industry Classification</p>
                        <p className="text-sm font-medium text-neutral-90">
                            {selectedCompany.industrial_classification}
                        </p>
                    </div>
                </Card>
            )}
        </div>
    );
}