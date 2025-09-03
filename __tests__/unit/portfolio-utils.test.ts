import {
    formatIndianCurrency,
    calculateOverallRiskGrade,
    calculateCreditEligibility,
    calculateParameterBenchmark,
    calculateRiskTrend,
    calculateFinancialHealthScore,
    calculateComplianceScore,
    formatIndianDate,
    formatFinancialYear,
    formatBusinessAge,
    validatePortfolioCompany,
    validateGSTIN,
    validatePAN,
    validateCIN,
    validateFinancialRatio,
    calculateRegionalDistribution,
    filterPortfolioCompanies,
    sortPortfolioCompanies,
    calculateRiskDistribution,
    calculateIndustryBreakdown,
    calculatePortfolioMetrics
} from '@/lib/utils/index';

import type { PortfolioCompany, FilterCriteria } from '@/types/portfolio.types';

describe('Portfolio Utility Functions', () => {
    describe('formatIndianCurrency', () => {
        it('should format currency in compact mode', () => {
            expect(formatIndianCurrency(1500000, { compact: true })).toBe('₹15.00 L');
            expect(formatIndianCurrency(25000000, { compact: true })).toBe('₹2.50 Cr');
            expect(formatIndianCurrency(5000, { compact: true })).toBe('₹5.00K');
        });

        it('should format currency in full mode', () => {
            expect(formatIndianCurrency(1500000, { compact: false })).toContain('₹15,00,000');
        });

        it('should handle zero and negative values', () => {
            expect(formatIndianCurrency(0, { compact: true })).toBe('₹0.00');
            expect(formatIndianCurrency(-1000, { compact: true })).toBe('-₹1.00K');
        });
    });

    describe('calculateOverallRiskGrade', () => {
        it('should calculate CM1 grade for excellent scores', () => {
            const grade = calculateOverallRiskGrade(90, 100);
            expect(grade.grade).toBe('CM1');
            expect(grade.category).toBe(1);
            expect(grade.multiplier).toBe(1.0);
            expect(grade.description).toBe('Excellent Credit Quality');
        });

        it('should calculate CM5 grade for poor scores', () => {
            const grade = calculateOverallRiskGrade(30, 100);
            expect(grade.grade).toBe('CM5');
            expect(grade.category).toBe(5);
            expect(grade.multiplier).toBe(0.4);
            expect(grade.description).toBe('Critical Risk');
        });

        it('should handle zero max score', () => {
            const grade = calculateOverallRiskGrade(50, 0);
            expect(grade.grade).toBe('CM5');
        });
    });

    describe('calculateCreditEligibility', () => {
        it('should calculate eligibility based on turnover and net worth', () => {
            const eligibility = calculateCreditEligibility(100, 50, 'CM2', 10);
            expect(eligibility.baseEligibility).toBe(12); // 12% of 100 Cr turnover
            expect(eligibility.riskMultiplier).toBe(0.9); // CM2 multiplier
            expect(eligibility.finalEligibility).toBe(10.8); // 12 * 0.9
            expect(eligibility.incrementalEligibility).toBe(0.8); // 10.8 - 10
        });

        it('should use net worth based calculation when lower', () => {
            const eligibility = calculateCreditEligibility(10, 100, 'CM1', 0);
            expect(eligibility.baseEligibility).toBe(1.2); // Min of 1.2 (12% of 10) and 25 (25% of 100)
        });
    });

    describe('calculateParameterBenchmark', () => {
        it('should return correct benchmark categories', () => {
            expect(calculateParameterBenchmark(95, 100, 'test')).toBe('Excellent');
            expect(calculateParameterBenchmark(80, 100, 'test')).toBe('Good');
            expect(calculateParameterBenchmark(65, 100, 'test')).toBe('Average');
            expect(calculateParameterBenchmark(45, 100, 'test')).toBe('Poor');
            expect(calculateParameterBenchmark(30, 100, 'test')).toBe('Critical Risk');
        });

        it('should handle zero max score', () => {
            expect(calculateParameterBenchmark(50, 0, 'test')).toBe('Critical Risk');
        });
    });

    describe('calculateRiskTrend', () => {
        it('should identify improving trend', () => {
            const trend = calculateRiskTrend(80, 70);
            expect(trend.trend).toBe('improving');
            expect(trend.change).toBe(10);
        });

        it('should identify deteriorating trend', () => {
            const trend = calculateRiskTrend(60, 80);
            expect(trend.trend).toBe('deteriorating');
            expect(trend.change).toBe(-20);
        });

        it('should identify stable trend for small changes', () => {
            const trend = calculateRiskTrend(75, 73);
            expect(trend.trend).toBe('stable');
        });
    });

    describe('formatIndianDate', () => {
        it('should format date in Indian format', () => {
            const formatted = formatIndianDate('2023-12-25');
            expect(formatted).toBe('25/12/2023');
        });
    });

    describe('formatFinancialYear', () => {
        it('should format financial year correctly', () => {
            expect(formatFinancialYear(new Date('2023-06-15'))).toBe('FY 2023-24');
            expect(formatFinancialYear(new Date('2023-02-15'))).toBe('FY 2022-23');
        });
    });

    describe('formatBusinessAge', () => {
        it('should calculate business age correctly', () => {
            const twoYearsAgo = new Date();
            twoYearsAgo.setFullYear(twoYearsAgo.getFullYear() - 2);
            const age = formatBusinessAge(twoYearsAgo.toISOString());
            expect(age).toContain('2 years');
        });
    });

    describe('Validation Functions', () => {
        describe('validateGSTIN', () => {
            it('should validate correct GSTIN format', () => {
                expect(validateGSTIN('22AAAAA0000A1Z5').isValid).toBe(true);
                expect(validateGSTIN('invalid').isValid).toBe(false);
                expect(validateGSTIN('').isValid).toBe(false);
            });
        });

        describe('validatePAN', () => {
            it('should validate correct PAN format', () => {
                expect(validatePAN('ABCDE1234F').isValid).toBe(true);
                expect(validatePAN('invalid').isValid).toBe(false);
                expect(validatePAN('').isValid).toBe(false);
            });
        });

        describe('validateCIN', () => {
            it('should validate correct CIN format', () => {
                expect(validateCIN('L12345MH2020PLC123456').isValid).toBe(true);
                expect(validateCIN('invalid').isValid).toBe(false);
                expect(validateCIN('').isValid).toBe(false);
            });
        });

        describe('validateFinancialRatio', () => {
            it('should validate current ratio', () => {
                expect(validateFinancialRatio(1.5, 'current_ratio').isValid).toBe(true);
                expect(validateFinancialRatio(0.3, 'current_ratio').isValid).toBe(false);
            });

            it('should validate debt equity ratio', () => {
                expect(validateFinancialRatio(0.5, 'debt_equity').isValid).toBe(true);
                expect(validateFinancialRatio(-0.1, 'debt_equity').isValid).toBe(false);
            });
        });

        describe('validatePortfolioCompany', () => {
            it('should validate complete company data', () => {
                const validCompany = {
                    company_name: 'Test Company',
                    request_id: 'REQ123',
                    industry: 'Technology',
                    risk_score: 75,
                    recommended_limit: 1000000
                };

                const result = validatePortfolioCompany(validCompany);
                expect(result.isValid).toBe(true);
                expect(result.errors).toHaveLength(0);
            });

            it('should identify missing required fields', () => {
                const invalidCompany = {
                    company_name: '',
                    request_id: '',
                    risk_score: 150 // Invalid range
                };

                const result = validatePortfolioCompany(invalidCompany);
                expect(result.isValid).toBe(false);
                expect(result.errors.length).toBeGreaterThan(0);
            });
        });
    });

    describe('Portfolio Analytics', () => {
        const mockCompanies: PortfolioCompany[] = [
            {
                id: '1',
                request_id: 'REQ1',
                company_name: 'Company A',
                industry: 'Technology',
                risk_grade: 'CM1',
                risk_score: 85,
                recommended_limit: 1000000,
                status: 'completed'
            } as PortfolioCompany,
            {
                id: '2',
                request_id: 'REQ2',
                company_name: 'Company B',
                industry: 'Manufacturing',
                risk_grade: 'CM3',
                risk_score: 65,
                recommended_limit: 500000,
                status: 'completed'
            } as PortfolioCompany
        ];

        describe('calculateRiskDistribution', () => {
            it('should calculate risk distribution correctly', () => {
                const distribution = calculateRiskDistribution(mockCompanies);
                expect(distribution.total_count).toBe(2);
                expect(distribution.cm1_count).toBe(1);
                expect(distribution.cm3_count).toBe(1);
                expect(distribution.distribution_percentages.CM1).toBe(50);
                expect(distribution.distribution_percentages.CM3).toBe(50);
            });
        });

        describe('calculateIndustryBreakdown', () => {
            it('should calculate industry breakdown correctly', () => {
                const breakdown = calculateIndustryBreakdown(mockCompanies);
                expect(breakdown.industries).toHaveLength(2);

                const techIndustry = breakdown.industries.find(i => i.name === 'Technology');
                expect(techIndustry?.count).toBe(1);
                expect(techIndustry?.total_exposure).toBe(1000000);
            });
        });

        describe('filterPortfolioCompanies', () => {
            it('should filter by risk grade', () => {
                const filters: FilterCriteria = {
                    risk_grades: ['CM1']
                };

                const filtered = filterPortfolioCompanies(mockCompanies, filters);
                expect(filtered).toHaveLength(1);
                expect(filtered[0].risk_grade).toBe('CM1');
            });

            it('should filter by industry', () => {
                const filters: FilterCriteria = {
                    industries: ['Technology']
                };

                const filtered = filterPortfolioCompanies(mockCompanies, filters);
                expect(filtered).toHaveLength(1);
                expect(filtered[0].industry).toBe('Technology');
            });

            it('should filter by search query', () => {
                const filters: FilterCriteria = {
                    search_query: 'Company A'
                };

                const filtered = filterPortfolioCompanies(mockCompanies, filters);
                expect(filtered).toHaveLength(1);
                expect(filtered[0].company_name).toBe('Company A');
            });
        });

        describe('sortPortfolioCompanies', () => {
            it('should sort by company name', () => {
                const sorted = sortPortfolioCompanies(mockCompanies, 'company_name', 'asc');
                expect(sorted[0].company_name).toBe('Company A');
                expect(sorted[1].company_name).toBe('Company B');
            });

            it('should sort by risk score descending', () => {
                const sorted = sortPortfolioCompanies(mockCompanies, 'risk_score', 'desc');
                expect(sorted[0].risk_score).toBe(85);
                expect(sorted[1].risk_score).toBe(65);
            });
        });

        describe('calculatePortfolioMetrics', () => {
            it('should calculate comprehensive portfolio metrics', () => {
                const metrics = calculatePortfolioMetrics(mockCompanies);
                expect(metrics.total_companies).toBe(2);
                expect(metrics.total_exposure).toBe(1500000);
                expect(metrics.average_risk_score).toBe(75);
                expect(metrics.risk_distribution.total_count).toBe(2);
                expect(metrics.industry_breakdown.industries).toHaveLength(2);
            });
        });
    });
});