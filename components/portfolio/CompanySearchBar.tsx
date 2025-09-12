"use client";

import React, { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { Search, Building2, Loader, X } from 'lucide-react';
import { CompanySearchResult, SearchFilter } from '@/lib/zaubacorp/types';

interface SearchResponse {
    success: boolean;
    results: CompanySearchResult[];
    total_found: number;
    error_message?: string;
}

interface CompanySearchBarProps {
    onSearch?: (query: string) => void;
    value?: string;
    placeholder?: string;
    className?: string;
}

export function CompanySearchBar({
    onSearch,
    value: controlledValue,
    placeholder = "Search companies...",
    className = ""
}: CompanySearchBarProps) {
    const router = useRouter();
    const [internalQuery, setInternalQuery] = useState(controlledValue || '');
    const [searchResults, setSearchResults] = useState<CompanySearchResult[]>([]);
    const [loading, setLoading] = useState(false);
    const [showDropdown, setShowDropdown] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const searchTimeout = useRef<NodeJS.Timeout | null>(null);
    const dropdownRef = useRef<HTMLDivElement>(null);
    const inputRef = useRef<HTMLInputElement>(null);

    // Use controlled value if provided, otherwise use internal state
    const searchQuery = controlledValue !== undefined ? controlledValue : internalQuery;

    // Sync controlled value with internal state
    useEffect(() => {
        if (controlledValue !== undefined) {
            setInternalQuery(controlledValue);
        }
    }, [controlledValue]);

    // Debounced search function
    useEffect(() => {
        if (searchTimeout.current) {
            clearTimeout(searchTimeout.current);
        }

        if (searchQuery.length >= 2) {
            searchTimeout.current = setTimeout(() => {
                performSearch(searchQuery);
                // Call onSearch callback for portfolio filtering
                if (onSearch) {
                    onSearch(searchQuery);
                }
            }, 300);
        } else {
            setSearchResults([]);
            setShowDropdown(false);
            setError(null);
            // Call onSearch with empty string to clear filters
            if (onSearch) {
                onSearch('');
            }
        }

        return () => {
            if (searchTimeout.current) {
                clearTimeout(searchTimeout.current);
            }
        };
    }, [searchQuery, onSearch]);

    // Close dropdown when clicking outside
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
                setShowDropdown(false);
            }
        };

        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const performSearch = async (query: string) => {
        setLoading(true);
        setError(null);

        try {
            const response = await fetch(
                `/api/company/search?query=${encodeURIComponent(query)}&filter_type=${SearchFilter.COMPANY}&max_results=8`
            );

            if (!response.ok) {
                throw new Error(`Search failed: ${response.status}`);
            }

            const data: SearchResponse = await response.json();

            if (data.success) {
                setSearchResults(data.results || []);
                setShowDropdown(true);
            } else {
                setError(data.error_message || 'Search failed');
                setSearchResults([]);
                setShowDropdown(false);
            }
        } catch (err) {
            const errorMessage = err instanceof Error ? err.message : 'Search error occurred';
            setError(`Search error: ${errorMessage}`);
            setSearchResults([]);
            setShowDropdown(false);
            console.error('Search error:', err);
        } finally {
            setLoading(false);
        }
    };

    const handleCompanySelect = (company: CompanySearchResult) => {
        const newQuery = '';
        if (controlledValue !== undefined) {
            // For controlled component, call onSearch to update parent
            if (onSearch) {
                onSearch(newQuery);
            }
        } else {
            // For uncontrolled component, update internal state
            setInternalQuery(newQuery);
        }
        setShowDropdown(false);
        setSearchResults([]);
        router.push(`/portfolio/company/${encodeURIComponent(company.id)}`);
    };

    const clearSearch = () => {
        const newQuery = '';
        if (controlledValue !== undefined) {
            // For controlled component, call onSearch to update parent
            if (onSearch) {
                onSearch(newQuery);
            }
        } else {
            // For uncontrolled component, update internal state
            setInternalQuery(newQuery);
        }
        setSearchResults([]);
        setShowDropdown(false);
        setError(null);
        inputRef.current?.focus();
    };

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const newQuery = e.target.value;
        if (controlledValue !== undefined) {
            // For controlled component, call onSearch to update parent
            if (onSearch) {
                onSearch(newQuery);
            }
        } else {
            // For uncontrolled component, update internal state
            setInternalQuery(newQuery);
        }
    };

    return (
        <div className={`relative w-full max-w-md ${className}`} ref={dropdownRef}>
            <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Search className="h-4 w-4 text-neutral-60" />
                </div>
                <input
                    ref={inputRef}
                    type="text"
                    value={searchQuery}
                    onChange={handleInputChange}
                    className="block w-full pl-10 pr-10 py-2 text-sm border border-neutral-30 rounded-lg focus:ring-2 focus:ring-primary-300 focus:border-primary-500 bg-neutral-0 placeholder-neutral-60"
                    placeholder={placeholder}
                />
                <div className="absolute inset-y-0 right-0 pr-3 flex items-center">
                    {loading && (
                        <Loader className="h-4 w-4 text-primary-500 animate-spin" />
                    )}
                    {searchQuery && !loading && (
                        <button
                            onClick={clearSearch}
                            className="text-neutral-60 hover:text-neutral-80 transition-colors"
                        >
                            <X className="h-4 w-4" />
                        </button>
                    )}
                </div>
            </div>

            {/* Dropdown */}
            {showDropdown && (searchResults.length > 0 || error) && (
                <div className="absolute z-50 w-full mt-1 bg-neutral-0 border border-neutral-30 rounded-lg shadow-fluent-2 max-h-80 overflow-y-auto">
                    {error && (
                        <div className="p-3 text-sm text-error border-b border-neutral-20">
                            {error}
                        </div>
                    )}

                    {searchResults.length > 0 && (
                        <>
                            <div className="p-2 text-xs text-neutral-60 border-b border-neutral-20 bg-neutral-5">
                                {searchResults.length} companies found
                            </div>
                            {searchResults.map((company, index) => (
                                <button
                                    key={index}
                                    onClick={() => handleCompanySelect(company)}
                                    className="w-full text-left p-3 hover:bg-neutral-10 transition-colors border-b border-neutral-10 last:border-b-0 focus:outline-none focus:bg-neutral-10"
                                >
                                    <div className="flex items-center">
                                        <Building2 className="h-4 w-4 text-primary-500 mr-3 flex-shrink-0" />
                                        <div className="flex-1 min-w-0">
                                            <div className="text-sm font-medium text-neutral-90 truncate">
                                                {company.name}
                                            </div>
                                            <div className="text-xs text-neutral-60 truncate">
                                                ID: {company.id}
                                            </div>
                                        </div>
                                    </div>
                                </button>
                            ))}
                        </>
                    )}

                    {searchResults.length === 0 && !error && searchQuery.length >= 2 && (
                        <div className="p-4 text-sm text-neutral-60 text-center">
                            No companies found matching "{searchQuery}"
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}