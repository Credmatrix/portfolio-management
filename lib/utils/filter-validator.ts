import {
    FilterState,
    FilterValidationResult,
    FilterError,
    FilterConflict,
    FilterCombinationValidation
} from '@/types/filter.types';

export class FilterValidator {
    private validationRules: Map<string, ValidationRule> = new Map();

    constructor() {
        this.initializeValidationRules();
    }

    validateFilter(filterType: string, value: any): FilterValidationResult {
        const rule = this.validationRules.get(filterType);
        if (!rule) {
            return {
                isValid: true,
                errors: [],
                warnings: []
            };
        }

        const errors: FilterError[] = [];
        const warnings: FilterError[] = [];

        // Type validation
        if (!this.validateType(value, rule.type)) {
            errors.push({
                filterType,
                message: `Expected ${rule.type}, got ${typeof value}`,
                code: 'INVALID_TYPE',
                severity: 'error'
            });
        }

        // Range validation for numeric values
        if (rule.range && typeof value === 'number') {
            if (rule.range.min !== undefined && value < rule.range.min) {
                errors.push({
                    filterType,
                    message: `Value ${value} is below minimum ${rule.range.min}`,
                    code: 'BELOW_MIN',
                    severity: 'error'
                });
            }
            if (rule.range.max !== undefined && value > rule.range.max) {
                errors.push({
                    filterType,
                    message: `Value ${value} is above maximum ${rule.range.max}`,
                    code: 'ABOVE_MAX',
                    severity: 'error'
                });
            }
        }

        // Array length validation
        if (Array.isArray(value) && rule.arrayConstraints) {
            if (rule.arrayConstraints.minLength && value.length < rule.arrayConstraints.minLength) {
                warnings.push({
                    filterType,
                    message: `Array has ${value.length} items, minimum recommended is ${rule.arrayConstraints.minLength}`,
                    code: 'ARRAY_TOO_SHORT',
                    severity: 'warning'
                });
            }
            if (rule.arrayConstraints.maxLength && value.length > rule.arrayConstraints.maxLength) {
                warnings.push({
                    filterType,
                    message: `Array has ${value.length} items, maximum recommended is ${rule.arrayConstraints.maxLength}`,
                    code: 'ARRAY_TOO_LONG',
                    severity: 'warning'
                });
            }
        }

        // Pattern validation for strings
        if (typeof value === 'string' && rule.pattern) {
            if (!rule.pattern.test(value)) {
                errors.push({
                    filterType,
                    message: `Value does not match required pattern`,
                    code: 'PATTERN_MISMATCH',
                    severity: 'error'
                });
            }
        }

        // Custom validation
        if (rule.customValidator) {
            const customResult = rule.customValidator(value);
            if (!customResult.isValid) {
                errors.push(...customResult.errors);
                warnings.push(...customResult.warnings);
            }
        }

        return {
            isValid: errors.length === 0,
            errors,
            warnings
        };
    }

    validateFilterCombination(state: FilterState): FilterConflict[] {
        const conflicts: FilterConflict[] = [];
        const { filters } = state;

        // Check for mutually exclusive filters
        this.checkMutualExclusions(filters, conflicts);

        // Check for performance-impacting combinations
        this.checkPerformanceImpact(filters, conflicts);

        // Check for data availability conflicts
        this.checkDataAvailability(filters, conflicts);

        // Check for logical contradictions
        this.checkLogicalContradictions(filters, conflicts);

        return conflicts;
    }

    sanitizeFilter(filterType: string, value: any): any {
        const rule = this.validationRules.get(filterType);
        if (!rule) return value;

        // Sanitize arrays
        if (Array.isArray(value)) {
            return value
                .filter(item => item !== null && item !== undefined && item !== '')
                .map(item => typeof item === 'string' ? item.trim() : item)
                .filter((item, index, arr) => arr.indexOf(item) === index); // Remove duplicates
        }

        // Sanitize strings
        if (typeof value === 'string') {
            let sanitized = value.trim();

            // Apply pattern-based sanitization
            if (rule.sanitizer) {
                sanitized = rule.sanitizer(sanitized);
            }

            return sanitized;
        }

        // Sanitize numeric ranges
        if (typeof value === 'object' && value !== null && ('min' in value || 'max' in value)) {
            const sanitized: any = {};
            if (value.min !== undefined && value.min !== null && value.min !== '') {
                sanitized.min = Number(value.min);
            }
            if (value.max !== undefined && value.max !== null && value.max !== '') {
                sanitized.max = Number(value.max);
            }

            // Ensure min <= max
            if (sanitized.min !== undefined && sanitized.max !== undefined && sanitized.min > sanitized.max) {
                [sanitized.min, sanitized.max] = [sanitized.max, sanitized.min];
            }

            return sanitized;
        }

        return value;
    }

    private initializeValidationRules(): void {
        // Risk grades validation
        this.validationRules.set('riskGrades', {
            type: 'array',
            arrayConstraints: { maxLength: 10 },
            customValidator: (value) => this.validateRiskGrades(value)
        });

        // Industries validation
        this.validationRules.set('industries', {
            type: 'array',
            arrayConstraints: { maxLength: 20 }
        });

        // Regions validation
        this.validationRules.set('regions', {
            type: 'array',
            arrayConstraints: { maxLength: 15 }
        });

        // Financial metrics validation
        this.validationRules.set('financialMetrics.ebitdaMargin', {
            type: 'object',
            range: { min: -100, max: 100 }
        });

        this.validationRules.set('financialMetrics.debtEquityRatio', {
            type: 'object',
            range: { min: 0, max: 50 }
        });

        this.validationRules.set('financialMetrics.currentRatio', {
            type: 'object',
            range: { min: 0, max: 20 }
        });

        // Search query validation
        this.validationRules.set('searchQuery', {
            type: 'string',
            pattern: /^[a-zA-Z0-9\s\-_.&()]*$/,
            sanitizer: (value: string) => value.replace(/[^\w\s\-_.&()]/g, '')
        });

        // Date range validation
        this.validationRules.set('dateRange', {
            type: 'object',
            customValidator: (value) => this.validateDateRange(value)
        });
    }

    private validateType(value: any, expectedType: string): boolean {
        switch (expectedType) {
            case 'array':
                return Array.isArray(value);
            case 'object':
                return typeof value === 'object' && value !== null && !Array.isArray(value);
            case 'string':
                return typeof value === 'string';
            case 'number':
                return typeof value === 'number' && !isNaN(value);
            case 'boolean':
                return typeof value === 'boolean';
            default:
                return true;
        }
    }

    private validateRiskGrades(value: any): FilterValidationResult {
        const validGrades = ['A+', 'A', 'A-', 'B+', 'B', 'B-', 'C+', 'C', 'C-', 'D', 'E'];
        const errors: FilterError[] = [];
        const warnings: FilterError[] = [];

        if (Array.isArray(value)) {
            const invalidGrades = value.filter(grade => !validGrades.includes(grade));
            if (invalidGrades.length > 0) {
                errors.push({
                    filterType: 'riskGrades',
                    message: `Invalid risk grades: ${invalidGrades.join(', ')}`,
                    code: 'INVALID_RISK_GRADE',
                    severity: 'error'
                });
            }
        }

        return { isValid: errors.length === 0, errors, warnings };
    }

    private validateDateRange(value: any): FilterValidationResult {
        const errors: FilterError[] = [];
        const warnings: FilterError[] = [];

        if (typeof value === 'object' && value !== null) {
            const { startDate, endDate } = value;

            if (startDate && !this.isValidDate(startDate)) {
                errors.push({
                    filterType: 'dateRange',
                    message: 'Invalid start date format',
                    code: 'INVALID_START_DATE',
                    severity: 'error'
                });
            }

            if (endDate && !this.isValidDate(endDate)) {
                errors.push({
                    filterType: 'dateRange',
                    message: 'Invalid end date format',
                    code: 'INVALID_END_DATE',
                    severity: 'error'
                });
            }

            if (startDate && endDate && new Date(startDate) > new Date(endDate)) {
                errors.push({
                    filterType: 'dateRange',
                    message: 'Start date must be before end date',
                    code: 'INVALID_DATE_RANGE',
                    severity: 'error'
                });
            }
        }

        return { isValid: errors.length === 0, errors, warnings };
    }

    private isValidDate(dateString: string): boolean {
        const date = new Date(dateString);
        return date instanceof Date && !isNaN(date.getTime());
    }

    private checkMutualExclusions(filters: FilterState['filters'], conflicts: FilterConflict[]): void {
        // Example: High-risk and low-risk grades are mutually exclusive in some contexts
        const highRiskGrades = ['D', 'E'];
        const lowRiskGrades = ['A+', 'A', 'A-'];

        const selectedRiskGrades = filters.riskGrades || [];
        const hasHighRisk = selectedRiskGrades.some(grade => highRiskGrades.includes(grade));
        const hasLowRisk = selectedRiskGrades.some(grade => lowRiskGrades.includes(grade));

        if (hasHighRisk && hasLowRisk) {
            conflicts.push({
                id: 'risk-grade-exclusion',
                type: 'exclusion',
                filters: ['riskGrades'],
                message: 'High-risk and low-risk grades selected simultaneously may indicate conflicting analysis goals',
                severity: 'medium',
                autoResolvable: false
            });
        }
    }

    private checkPerformanceImpact(filters: FilterState['filters'], conflicts: FilterConflict[]): void {
        const activeFilterCount = Object.values(filters).filter(filter =>
            filter !== null &&
            filter !== undefined &&
            filter !== '' &&
            !(Array.isArray(filter) && filter.length === 0) &&
            !(typeof filter === 'object' && Object.keys(filter).length === 0)
        ).length;

        if (activeFilterCount > 8) {
            conflicts.push({
                id: 'performance-impact',
                type: 'performance',
                filters: Object.keys(filters),
                message: 'Too many active filters may impact performance',
                severity: 'low',
                autoResolvable: false
            });
        }
    }

    private checkDataAvailability(filters: FilterState['filters'], conflicts: FilterConflict[]): void {
        // Check if compliance filters are applied but compliance data might be sparse
        const complianceFilters = filters.complianceStatus;
        if (complianceFilters && (
            complianceFilters.gst.length > 0 ||
            complianceFilters.epfo.length > 0 ||
            complianceFilters.audit.length > 0
        )) {
            conflicts.push({
                id: 'compliance-data-availability',
                type: 'data_availability',
                filters: ['complianceStatus'],
                message: 'Compliance data may not be available for all companies',
                severity: 'low',
                autoResolvable: false
            });
        }
    }

    private checkLogicalContradictions(filters: FilterState['filters'], conflicts: FilterConflict[]): void {
        // Check for contradictory financial metrics
        const financialMetrics = filters.financialMetrics;
        if (financialMetrics) {
            const { ebitdaMargin, debtEquityRatio } = financialMetrics;

            // High EBITDA margin with very high debt-equity ratio might be contradictory
            if (ebitdaMargin?.min && ebitdaMargin.min > 20 &&
                debtEquityRatio?.min && debtEquityRatio.min > 5) {
                conflicts.push({
                    id: 'financial-contradiction',
                    type: 'contradiction',
                    filters: ['financialMetrics.ebitdaMargin', 'financialMetrics.debtEquityRatio'],
                    message: 'High profitability with very high leverage may indicate conflicting criteria',
                    severity: 'medium',
                    autoResolvable: false
                });
            }
        }
    }
}

interface ValidationRule {
    type: 'array' | 'object' | 'string' | 'number' | 'boolean';
    range?: { min?: number; max?: number };
    arrayConstraints?: { minLength?: number; maxLength?: number };
    pattern?: RegExp;
    customValidator?: (value: any) => FilterValidationResult;
    sanitizer?: (value: string) => string;
}