import { FilterState, FilterUrlParams } from '@/types/filter.types';

export class FilterPersistence {
    private storageKey: string;
    private enableUrlSync: boolean;
    private urlParamPrefix: string = 'f_';

    constructor(storageKey: string, enableUrlSync: boolean = true) {
        this.storageKey = storageKey;
        this.enableUrlSync = enableUrlSync;
    }

    saveState(state: FilterState): void {
        try {
            // Save to session storage
            if (typeof window !== 'undefined') {
                sessionStorage.setItem(this.storageKey, JSON.stringify(state));

                // Update URL if enabled
                if (this.enableUrlSync) {
                    this.updateUrl(state);
                }
            }
        } catch (error) {
            console.warn('Failed to save filter state:', error);
        }
    }

    loadState(): FilterState | null {
        try {
            if (typeof window === 'undefined') return null;

            // Try to load from URL first (higher priority)
            if (this.enableUrlSync) {
                const urlState = this.loadFromUrl();
                if (urlState) {
                    return urlState;
                }
            }

            // Fallback to session storage
            const stored = sessionStorage.getItem(this.storageKey);
            if (stored) {
                return JSON.parse(stored);
            }
        } catch (error) {
            console.warn('Failed to load filter state:', error);
        }

        return null;
    }

    clearState(): void {
        try {
            if (typeof window !== 'undefined') {
                sessionStorage.removeItem(this.storageKey);

                if (this.enableUrlSync) {
                    this.clearUrl();
                }
            }
        } catch (error) {
            console.warn('Failed to clear filter state:', error);
        }
    }

    encodeStateToUrl(state: FilterState): string {
        const params = this.stateToUrlParams(state);
        const searchParams = new URLSearchParams();

        Object.entries(params).forEach(([key, value]) => {
            if (Array.isArray(value)) {
                value.forEach(v => searchParams.append(key, v));
            } else {
                searchParams.set(key, value);
            }
        });

        return searchParams.toString();
    }

    decodeStateFromUrl(urlString: string): FilterState | null {
        try {
            const searchParams = new URLSearchParams(urlString);
            return this.urlParamsToState(searchParams);
        } catch (error) {
            console.warn('Failed to decode state from URL:', error);
            return null;
        }
    }

    private updateUrl(state: FilterState): void {
        try {
            const url = new URL(window.location.href);
            const params = this.stateToUrlParams(state);

            // Clear existing filter parameters
            Array.from(url.searchParams.keys()).forEach(key => {
                if (key.startsWith(this.urlParamPrefix)) {
                    url.searchParams.delete(key);
                }
            });

            // Add new filter parameters
            Object.entries(params).forEach(([key, value]) => {
                if (Array.isArray(value)) {
                    value.forEach(v => url.searchParams.append(key, v));
                } else {
                    url.searchParams.set(key, value);
                }
            });

            // Update URL without triggering navigation
            window.history.replaceState({}, '', url.toString());
        } catch (error) {
            console.warn('Failed to update URL:', error);
        }
    }

    private loadFromUrl(): FilterState | null {
        try {
            const url = new URL(window.location.href);
            return this.urlParamsToState(url.searchParams);
        } catch (error) {
            console.warn('Failed to load from URL:', error);
            return null;
        }
    }

    private clearUrl(): void {
        try {
            const url = new URL(window.location.href);

            // Remove all filter parameters
            Array.from(url.searchParams.keys()).forEach(key => {
                if (key.startsWith(this.urlParamPrefix)) {
                    url.searchParams.delete(key);
                }
            });

            window.history.replaceState({}, '', url.toString());
        } catch (error) {
            console.warn('Failed to clear URL:', error);
        }
    }

    private stateToUrlParams(state: FilterState): FilterUrlParams {
        const params: FilterUrlParams = {};
        const { filters } = state;

        // Risk grades
        if (filters.riskGrades.length > 0) {
            params[`${this.urlParamPrefix}rg`] = filters.riskGrades;
        }

        // Industries
        if (filters.industries.length > 0) {
            params[`${this.urlParamPrefix}ind`] = filters.industries;
        }

        // Regions
        if (filters.regions.length > 0) {
            params[`${this.urlParamPrefix}reg`] = filters.regions;
        }

        // States
        if (filters.states.length > 0) {
            params[`${this.urlParamPrefix}st`] = filters.states;
        }

        // Cities
        if (filters.cities.length > 0) {
            params[`${this.urlParamPrefix}ct`] = filters.cities;
        }

        // Compliance status
        if (filters.complianceStatus.gst.length > 0) {
            params[`${this.urlParamPrefix}gst`] = filters.complianceStatus.gst;
        }
        if (filters.complianceStatus.epfo.length > 0) {
            params[`${this.urlParamPrefix}epfo`] = filters.complianceStatus.epfo;
        }
        if (filters.complianceStatus.audit.length > 0) {
            params[`${this.urlParamPrefix}aud`] = filters.complianceStatus.audit;
        }

        // Financial metrics
        const { financialMetrics } = filters;
        if (Object.keys(financialMetrics.ebitdaMargin).length > 0) {
            params[`${this.urlParamPrefix}ebitda`] = this.encodeRange(financialMetrics.ebitdaMargin);
        }
        if (Object.keys(financialMetrics.debtEquityRatio).length > 0) {
            params[`${this.urlParamPrefix}der`] = this.encodeRange(financialMetrics.debtEquityRatio);
        }
        if (Object.keys(financialMetrics.currentRatio).length > 0) {
            params[`${this.urlParamPrefix}cr`] = this.encodeRange(financialMetrics.currentRatio);
        }
        if (Object.keys(financialMetrics.revenue).length > 0) {
            params[`${this.urlParamPrefix}rev`] = this.encodeRange(financialMetrics.revenue);
        }

        // Date range
        if (Object.keys(filters.dateRange).length > 0) {
            params[`${this.urlParamPrefix}date`] = this.encodeDateRange(filters.dateRange);
        }

        // Search query
        if (filters.searchQuery) {
            params[`${this.urlParamPrefix}q`] = filters.searchQuery;
        }

        // Credit limits
        if (Object.keys(filters.creditLimits).length > 0) {
            params[`${this.urlParamPrefix}cl`] = this.encodeRange(filters.creditLimits);
        }

        // Processing status
        if (filters.processingStatus.length > 0) {
            params[`${this.urlParamPrefix}ps`] = filters.processingStatus;
        }

        return params;
    }

    private urlParamsToState(searchParams: URLSearchParams): FilterState | null {
        try {
            const hasFilterParams = Array.from(searchParams.keys()).some(key =>
                key.startsWith(this.urlParamPrefix)
            );

            if (!hasFilterParams) {
                return null;
            }

            const state: FilterState = {
                filters: {
                    riskGrades: searchParams.getAll(`${this.urlParamPrefix}rg`),
                    industries: searchParams.getAll(`${this.urlParamPrefix}ind`),
                    regions: searchParams.getAll(`${this.urlParamPrefix}reg`),
                    states: searchParams.getAll(`${this.urlParamPrefix}st`),
                    cities: searchParams.getAll(`${this.urlParamPrefix}ct`),
                    epfo_compliance_status: searchParams.getAll(`${this.urlParamPrefix}epfo`),
                    gst_compliance_status: searchParams.getAll(`${this.urlParamPrefix}gst`),
                    complianceStatus: {
                        gst: searchParams.getAll(`${this.urlParamPrefix}gst`),
                        epfo: searchParams.getAll(`${this.urlParamPrefix}epfo`),
                        audit: searchParams.getAll(`${this.urlParamPrefix}aud`)
                    },
                    financialMetrics: {
                        ebitdaMargin: this.decodeRange(searchParams.get(`${this.urlParamPrefix}ebitda`)),
                        debtEquityRatio: this.decodeRange(searchParams.get(`${this.urlParamPrefix}der`)),
                        currentRatio: this.decodeRange(searchParams.get(`${this.urlParamPrefix}cr`)),
                        revenue: this.decodeRange(searchParams.get(`${this.urlParamPrefix}rev`))
                    },
                    dateRange: this.decodeDateRange(searchParams.get(`${this.urlParamPrefix}date`)),
                    searchQuery: searchParams.get(`${this.urlParamPrefix}q`) || '',
                    creditLimits: this.decodeRange(searchParams.get(`${this.urlParamPrefix}cl`)),
                    processingStatus: searchParams.getAll(`${this.urlParamPrefix}ps`)
                },
                metadata: {
                    lastUpdated: new Date().toISOString(),
                    source: 'url',
                    appliedAt: new Date().toISOString(),
                    version: 1
                },
                ui: {
                    isLoading: false,
                    errors: [],
                    conflicts: []
                }
            };

            return state;
        } catch (error) {
            console.warn('Failed to parse URL parameters:', error);
            return null;
        }
    }

    private encodeRange(range: { min?: number; max?: number }): string {
        const parts: string[] = [];
        if (range.min !== undefined) parts.push(`min:${range.min}`);
        if (range.max !== undefined) parts.push(`max:${range.max}`);
        return parts.join(',');
    }

    private decodeRange(encoded: string | null): { min?: number; max?: number } {
        if (!encoded) return {};

        const range: { min?: number; max?: number } = {};
        const parts = encoded.split(',');

        parts.forEach(part => {
            const [key, value] = part.split(':');
            if (key === 'min' && value) range.min = parseFloat(value);
            if (key === 'max' && value) range.max = parseFloat(value);
        });

        return range;
    }

    private encodeDateRange(dateRange: { startDate?: string; endDate?: string }): string {
        const parts: string[] = [];
        if (dateRange.startDate) parts.push(`start:${dateRange.startDate}`);
        if (dateRange.endDate) parts.push(`end:${dateRange.endDate}`);
        return parts.join(',');
    }

    private decodeDateRange(encoded: string | null): { startDate?: string; endDate?: string } {
        if (!encoded) return {};

        const dateRange: { startDate?: string; endDate?: string } = {};
        const parts = encoded.split(',');

        parts.forEach(part => {
            const [key, value] = part.split(':');
            if (key === 'start' && value) dateRange.startDate = value;
            if (key === 'end' && value) dateRange.endDate = value;
        });

        return dateRange;
    }

    // Utility methods for external use
    createBookmarkUrl(state: FilterState): string {
        const baseUrl = typeof window !== 'undefined' ?
            window.location.origin + window.location.pathname : '';
        const params = this.encodeStateToUrl(state);
        return params ? `${baseUrl}?${params}` : baseUrl;
    }

    isUrlBookmarked(): boolean {
        if (typeof window === 'undefined') return false;

        const url = new URL(window.location.href);
        return Array.from(url.searchParams.keys()).some(key =>
            key.startsWith(this.urlParamPrefix)
        );
    }

    exportState(state: FilterState): string {
        return JSON.stringify(state, null, 2);
    }

    importState(jsonString: string): FilterState | null {
        try {
            const parsed = JSON.parse(jsonString);
            // Basic validation
            if (parsed && typeof parsed === 'object' && parsed.filters && parsed.metadata) {
                return parsed as FilterState;
            }
        } catch (error) {
            console.warn('Failed to import filter state:', error);
        }
        return null;
    }
}