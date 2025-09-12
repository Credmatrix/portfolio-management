import { FilterState, FilterConflict } from '@/types/filter.types';

export class FilterConflictResolver {
    resolveConflicts(state: FilterState, conflicts: FilterConflict[]): FilterState {
        let resolvedState = { ...state };

        // Sort conflicts by severity and auto-resolvability
        const sortedConflicts = conflicts.sort((a, b) => {
            const severityOrder = { high: 3, medium: 2, low: 1 };
            const severityDiff = severityOrder[b.severity] - severityOrder[a.severity];
            if (severityDiff !== 0) return severityDiff;

            // Prioritize auto-resolvable conflicts
            return b.autoResolvable ? 1 : -1;
        });

        for (const conflict of sortedConflicts) {
            if (conflict.autoResolvable && conflict.suggestedResolution) {
                resolvedState = this.applyResolution(resolvedState, conflict);
            }
        }

        return resolvedState;
    }

    generateResolutionSuggestions(state: FilterState, conflicts: FilterConflict[]): ConflictResolutionSuggestion[] {
        const suggestions: ConflictResolutionSuggestion[] = [];

        for (const conflict of conflicts) {
            switch (conflict.type) {
                case 'exclusion':
                    suggestions.push(...this.generateExclusionResolutions(state, conflict));
                    break;
                case 'contradiction':
                    suggestions.push(...this.generateContradictionResolutions(state, conflict));
                    break;
                case 'performance':
                    suggestions.push(...this.generatePerformanceResolutions(state, conflict));
                    break;
                case 'data_availability':
                    suggestions.push(...this.generateDataAvailabilityResolutions(state, conflict));
                    break;
            }
        }

        return suggestions;
    }

    private applyResolution(state: FilterState, conflict: FilterConflict): FilterState {
        if (!conflict.suggestedResolution) return state;

        const { action, filterType, newValue } = conflict.suggestedResolution;
        const newState = { ...state };

        switch (action) {
            case 'remove':
                if (filterType.includes('.')) {
                    const [parentKey, childKey] = filterType.split('.');
                    newState.filters = {
                        ...newState.filters,
                        [parentKey]: {
                            ...newState.filters,
                            [childKey]: this.getDefaultValue(childKey)
                        }
                    };
                } else {
                    newState.filters = {
                        ...newState.filters,
                        [filterType]: this.getDefaultValue(filterType)
                    };
                }
                break;

            case 'modify':
            case 'replace':
                if (filterType.includes('.')) {
                    const [parentKey, childKey] = filterType.split('.');
                    newState.filters = {
                        ...newState.filters,
                        [parentKey]: {
                            ...newState.filters,
                            [childKey]: newValue
                        }
                    };
                } else {
                    newState.filters = {
                        ...newState.filters,
                        [filterType]: newValue
                    };
                }
                break;
        }

        // Update metadata
        newState.metadata = {
            ...newState.metadata,
            lastUpdated: new Date().toISOString(),
            source: 'preset',
            version: newState.metadata.version + 1
        };

        return newState;
    }

    private generateExclusionResolutions(state: FilterState, conflict: FilterConflict): ConflictResolutionSuggestion[] {
        const suggestions: ConflictResolutionSuggestion[] = [];

        if (conflict.id === 'risk-grade-exclusion') {
            suggestions.push({
                id: `${conflict.id}-focus-high`,
                title: 'Focus on High-Risk Analysis',
                description: 'Remove low-risk grades to focus on high-risk portfolio analysis',
                impact: 'Will show only companies with risk grades D and E',
                action: {
                    type: 'modify',
                    filterType: 'riskGrades',
                    newValue: state.filters.riskGrades.filter(grade => ['D', 'E'].includes(grade))
                },
                priority: 'medium'
            });

            suggestions.push({
                id: `${conflict.id}-focus-low`,
                title: 'Focus on Low-Risk Analysis',
                description: 'Remove high-risk grades to focus on low-risk portfolio analysis',
                impact: 'Will show only companies with risk grades A+, A, and A-',
                action: {
                    type: 'modify',
                    filterType: 'riskGrades',
                    newValue: state.filters.riskGrades.filter(grade => ['A+', 'A', 'A-'].includes(grade))
                },
                priority: 'medium'
            });

            suggestions.push({
                id: `${conflict.id}-separate-analysis`,
                title: 'Create Separate Analysis Views',
                description: 'Consider running separate analyses for high-risk and low-risk segments',
                impact: 'Requires manual workflow adjustment',
                action: {
                    type: 'workflow',
                    description: 'Save current filters as preset and create separate filter sets'
                },
                priority: 'low'
            });
        }

        return suggestions;
    }

    private generateContradictionResolutions(state: FilterState, conflict: FilterConflict): ConflictResolutionSuggestion[] {
        const suggestions: ConflictResolutionSuggestion[] = [];

        if (conflict.id === 'financial-contradiction') {
            suggestions.push({
                id: `${conflict.id}-relax-debt`,
                title: 'Relax Debt-Equity Constraints',
                description: 'Reduce minimum debt-equity ratio to allow for profitable companies with moderate leverage',
                impact: 'Will include companies with debt-equity ratios between 2-5',
                action: {
                    type: 'modify',
                    filterType: 'financialMetrics.debtEquityRatio',
                    newValue: {
                        ...state.filters.financialMetrics.debtEquityRatio,
                        min: 2,
                        max: state.filters.financialMetrics.debtEquityRatio.max
                    }
                },
                priority: 'high'
            });

            suggestions.push({
                id: `${conflict.id}-focus-profitability`,
                title: 'Prioritize Profitability',
                description: 'Remove debt-equity constraints to focus purely on profitability metrics',
                impact: 'Will show all companies meeting EBITDA margin criteria regardless of leverage',
                action: {
                    type: 'remove',
                    filterType: 'financialMetrics.debtEquityRatio'
                },
                priority: 'medium'
            });
        }

        return suggestions;
    }

    private generatePerformanceResolutions(state: FilterState, conflict: FilterConflict): ConflictResolutionSuggestion[] {
        const suggestions: ConflictResolutionSuggestion[] = [];

        if (conflict.id === 'performance-impact') {
            // Identify least impactful filters to remove
            const filterImpactScores = this.calculateFilterImpactScores(state);
            const leastImpactfulFilters = Object.entries(filterImpactScores)
                .sort(([, a], [, b]) => a - b)
                .slice(0, 3)
                .map(([filterType]) => filterType);

            suggestions.push({
                id: `${conflict.id}-remove-low-impact`,
                title: 'Remove Low-Impact Filters',
                description: `Remove filters with minimal impact: ${leastImpactfulFilters.join(', ')}`,
                impact: 'Will improve performance while maintaining most filtering criteria',
                action: {
                    type: 'batch-remove',
                    filterTypes: leastImpactfulFilters
                },
                priority: 'high'
            });

            suggestions.push({
                id: `${conflict.id}-create-preset`,
                title: 'Save as Preset',
                description: 'Save current filter combination as a preset for future use',
                impact: 'Allows quick reapplication without performance impact during setup',
                action: {
                    type: 'workflow',
                    description: 'Create filter preset with current configuration'
                },
                priority: 'low'
            });
        }

        return suggestions;
    }

    private generateDataAvailabilityResolutions(state: FilterState, conflict: FilterConflict): ConflictResolutionSuggestion[] {
        const suggestions: ConflictResolutionSuggestion[] = [];

        if (conflict.id === 'compliance-data-availability') {
            suggestions.push({
                id: `${conflict.id}-include-unknown`,
                title: 'Include Unknown Status',
                description: 'Add "Unknown" to compliance status filters to include companies with missing data',
                impact: 'Will show companies where compliance status is not available',
                action: {
                    type: 'modify',
                    filterType: 'complianceStatus',
                    newValue: {
                        ...state.filters.complianceStatus,
                        gst: [...state.filters.complianceStatus.gst, 'unknown'],
                        epfo: [...state.filters.complianceStatus.epfo, 'unknown'],
                        audit: [...state.filters.complianceStatus.audit, 'unknown']
                    }
                },
                priority: 'medium'
            });

            suggestions.push({
                id: `${conflict.id}-focus-available`,
                title: 'Focus on Data-Rich Companies',
                description: 'Add filter to show only companies with complete compliance data',
                impact: 'Will reduce result set but ensure data quality',
                action: {
                    type: 'add',
                    filterType: 'dataCompleteness',
                    newValue: ['compliance-complete']
                },
                priority: 'low'
            });
        }

        return suggestions;
    }

    private calculateFilterImpactScores(state: FilterState): Record<string, number> {
        // Simple heuristic for filter impact scoring
        // In a real implementation, this would be based on actual usage analytics
        const scores: Record<string, number> = {};

        // Array filters - score based on selectivity
        if (state.filters.riskGrades.length > 0) {
            scores.riskGrades = Math.max(1, 11 - state.filters.riskGrades.length); // More selective = higher impact
        }

        if (state.filters.industries.length > 0) {
            scores.industries = Math.max(1, 21 - state.filters.industries.length);
        }

        if (state.filters.regions.length > 0) {
            scores.regions = Math.max(1, 16 - state.filters.regions.length);
        }

        // Financial metrics - always high impact
        const financialMetrics = state.filters.financialMetrics;
        if (Object.keys(financialMetrics.ebitdaMargin).length > 0) {
            scores['financialMetrics.ebitdaMargin'] = 8;
        }
        if (Object.keys(financialMetrics.debtEquityRatio).length > 0) {
            scores['financialMetrics.debtEquityRatio'] = 8;
        }
        if (Object.keys(financialMetrics.currentRatio).length > 0) {
            scores['financialMetrics.currentRatio'] = 7;
        }

        // Search query - medium impact
        if (state.filters.searchQuery.length > 0) {
            scores.searchQuery = 5;
        }

        // Date range - low impact typically
        if (Object.keys(state.filters.dateRange).length > 0) {
            scores.dateRange = 3;
        }

        return scores;
    }

    private getDefaultValue(filterType: string): any {
        const arrayFilters = ['riskGrades', 'industries', 'regions', 'states', 'cities', 'processingStatus'];
        const objectFilters = ['ebitdaMargin', 'debtEquityRatio', 'currentRatio', 'revenue', 'creditLimits', 'dateRange'];

        if (arrayFilters.includes(filterType)) {
            return [];
        }

        if (objectFilters.includes(filterType)) {
            return {};
        }

        if (filterType === 'complianceStatus') {
            return { gst: [], epfo: [], audit: [] };
        }

        if (filterType === 'searchQuery') {
            return '';
        }

        return null;
    }
}

interface ConflictResolutionSuggestion {
    id: string;
    title: string;
    description: string;
    impact: string;
    action: {
        type: 'modify' | 'remove' | 'add' | 'batch-remove' | 'workflow';
        filterType?: string;
        filterTypes?: string[];
        newValue?: any;
        description?: string;
    };
    priority: 'high' | 'medium' | 'low';
}