import {
    filterByRiskGrade,
    filterByIndustry,
    filterByRegion,
    filterByGSTCompliance,
    filterByEPFOCompliance,
    filterByAuditQualification,
    searchCompaniesAdvanced,
    filterByFinancialMetrics,
    applyAdvancedFilters,
    extractFilterOptions
} from '@/lib/utils/index'
import { PortfolioCompany, FilterCriteria } from '@/types/portfolio.types'
import { it } from 'date-fns/locale'
import { describe } from 'node:test'
import { it } from 'date-fns/locale'
import { it } from 'date-fns/locale'
import { describe } from 'node:test'
import { it } from 'date-fns/locale'
import { it } from 'date-fns/locale'
import { it } from 'date-fns/locale'
import { describe } from 'node:test'
import { it } from 'date-fns/locale'
import { it } from 'date-fns/locale'
import { it } from 'date-fns/locale'
import { it } from 'date-fns/locale'
import { describe } from 'node:test'
import { it } from 'date-fns/locale'
import { describe } from 'node:test'
import { it } from 'date-fns/locale'
import { describe } from 'node:test'
import { it } from 'date-fns/locale'
import { it } from 'date-fns/locale'
import { describe } from 'node:test'
import { it } from 'date-fns/locale'
import { it } from 'date-fns/locale'
import { describe } from 'node:test'
import { it } from 'date-fns/locale'
import { it } from 'date-fns/locale'
import { describe } from 'node:test'
import { it } from 'date-fns/locale'
import { it } from 'date-fns/locale'
import { describe } from 'node:test'
import { describe } from 'node:test'

// Mock data for testing
const mockCompanies: PortfolioCompany[] = [
    {
        id: '1',
        request_id: 'req-1',
        user_id: 'user-1',
        organization_id: 'org-1',
        original_filename: 'company1.pdf',
        company_name: 'Tech Solutions Pvt Ltd',
        industry: 'Technology',
        risk_score: 85,
        risk_grade: 'CM2',
        recommended_limit: 50,
        currency: 'INR',
        status: 'completed',
        submitted_at: '2024-01-15T10:00:00Z',
        processing_started_at: '2024-01-15T10:05:00Z',
        completed_at: '2024-01-15T10:30:00Z',
        file_size: 1024000,
        file_extension: 'pdf',
        s3_upload_key: 'uploads/company1.pdf',
        s3_folder_path: 'uploads/',
        pdf_filename: 'company1_report.pdf',
        pdf_s3_key: 'reports/company1_report.pdf',
        pdf_file_size: 2048000,
        model_type: 'without_banking',
        total_parameters: 100,
        available_parameters: 85,
        financial_parameters: 25,
        business_parameters: 30,
        hygiene_parameters: 20,
        banking_parameters: 10,
        error_message: null,
        retry_count: 0,
        extracted_data: {
            about_company: {
                legal_name: 'Tech Solutions Private Limited',
                cin: 'U72900MH2020PTC123456',
                pan: 'ABCDE1234F',
                company_status: 'Active',
                date_of_incorporation: '2020-01-15',
                registered_address: {
                    address_line_1: '123 Tech Park',
                    city: 'Mumbai',
                    state: 'Maharashtra',
                    pincode: '400001',
                    country: 'India'
                },
                business_address: {
                    address_line_1: '123 Tech Park',
                    city: 'Mumbai',
                    state: 'Maharashtra',
                    pincode: '400001',
                    country: 'India'
                },
                industry: 'Information Technology',
                segment: 'Software Development'
            },
            directors: [
                {
                    name: 'John Doe',
                    din: 'DIN12345678',
                    designation: 'Managing Director',
                    appointment_date: '2020-01-15'
                }
            ],
            director_shareholding: [],
            financial_data: {
                years: ['2021', '2022', '2023'],
                balance_sheet: {
                    equity: {
                        share_capital: { '2023': 1000000 },
                        reserves_and_surplus: { '2023': 5000000 },
                        total_equity: { '2023': 6000000 }
                    },
                    liabilities: {
                        long_term_borrowings: { '2023': 2000000 },
                        short_term_borrowings: { '2023': 1000000 },
                        trade_payables: { '2023': 500000 },
                        other_current_liabilities: { '2023': 200000 },
                        total_liabilities: { '2023': 3700000 }
                    },
                    assets: {
                        tangible_assets: { '2023': 8000000 },
                        intangible_assets: { '2023': 200000 },
                        current_assets: { '2023': 3000000 },
                        trade_receivables: { '2023': 1500000 },
                        cash_and_bank: { '2023': 500000 },
                        inventory: { '2023': 1000000 },
                        total_assets: { '2023': 11200000 }
                    }
                },
                profit_loss: {
                    revenue: { '2023': 10000000 },
                    ebitda: { '2023': 2000000 },
                    pat: { '2023': 1200000 }
                },
                cash_flow: {},
                ratios: {
                    profitability: {
                        ebitda_margin: { '2023': 20 },
                        net_margin: { '2023': 12 },
                        return_on_equity: { '2023': 15 }
                    },
                    liquidity: {
                        current_ratio: { '2023': 2.5 },
                        quick_ratio: { '2023': 2.0 }
                    },
                    efficiency: {
                        inventory_days: { '2023': 30 },
                        debtor_days: { '2023': 45 },
                        cash_conversion_cycle: { '2023': 60 }
                    },
                    leverage: {
                        debt_equity: { '2023': 0.5 },
                        interest_coverage: { '2023': 8 }
                    }
                }
            },
            shareholding: {
                promoter_percentage: 75,
                public_percentage: 25,
                total_shareholders: 100,
                shareholding_more_than_5: []
            },
            charges: {
                open_charges: [],
                satisfied_charges: [],
                total_charge_amount: 0
            },
            gst_records: {
                active_gstins: [
                    {
                        gstin: '27ABCDE1234F1Z5',
                        status: 'Active',
                        state: 'Maharashtra',
                        registration_date: '2020-02-01',
                        latest_filing: '2024-01-01',
                        compliance_status: 'Regular'
                    }
                ],
                cancelled_gstins: [],
                filing_compliance: []
            },
            epfo_records: {
                establishments: [
                    {
                        establishment_id: 'MH/MUM/12345',
                        status: 'Active',
                        employee_count: 50,
                        latest_wage_month: '2024-01',
                        compliance_status: 'Regular'
                    }
                ],
                total_employees: 50,
                latest_compliance: []
            },
            legal_cases: [],
            auditor_comments: [],
            audit_qualifications: [
                {
                    year: '2023',
                    qualification_type: 'Unqualified',
                    auditor_name: 'ABC & Associates'
                }
            ],
            peer_analysis: {
                industry_metrics: {},
                peer_companies: [],
                performance_vs_median: {}
            },
            msme_payments: {
                total_amount_due: 0,
                supplier_delays: [],
                payment_analysis: {}
            }
        },
        risk_analysis: {
            totalWeightedScore: 85,
            totalMaxScore: 100,
            overallPercentage: 85,
            overallGrade: {
                grade: 'CM2',
                category: 2,
                multiplier: 0.9,
                color: '#3B82F6',
                description: 'Good Credit Quality'
            },
            industryModel: 'Technology',
            modelVersion: '1.0',
            modelId: 'tech-model-1',
            modelType: 'without_banking',
            categories: [],
            financialResult: {
                score: 85,
                maxScore: 100,
                weightage: 30,
                percentage: 85,
                availableCount: 25,
                totalCount: 30
            },
            businessResult: {
                score: 80,
                maxScore: 100,
                weightage: 25,
                percentage: 80,
                availableCount: 28,
                totalCount: 30
            },
            hygieneResult: {
                score: 90,
                maxScore: 100,
                weightage: 25,
                percentage: 90,
                availableCount: 18,
                totalCount: 20
            },
            bankingResult: {
                score: 0,
                maxScore: 0,
                weightage: 0,
                percentage: 0,
                availableCount: 0,
                totalCount: 0
            },
            allScores: [],
            financialScores: [],
            businessScores: [],
            hygieneScores: [],
            bankingScores: [],
            eligibility: {
                turnoverCr: 10,
                netWorthCr: 6,
                baseEligibility: 1.2,
                riskScore: 85,
                riskGrade: 'CM2',
                riskMultiplier: 0.9,
                finalEligibility: 1.08,
                existingExposure: 0,
                incrementalEligibility: 1.08
            }
        },
        processing_summary: null,
        created_at: '2024-01-15T09:00:00Z',
        updated_at: '2024-01-15T10:30:00Z'
    },
    {
        id: '2',
        request_id: 'req-2',
        user_id: 'user-1',
        organization_id: 'org-1',
        original_filename: 'company2.pdf',
        company_name: 'Manufacturing Corp Ltd',
        industry: 'Manufacturing',
        risk_score: 65,
        risk_grade: 'CM4',
        recommended_limit: 25,
        currency: 'INR',
        status: 'completed',
        submitted_at: '2024-01-16T10:00:00Z',
        processing_started_at: '2024-01-16T10:05:00Z',
        completed_at: '2024-01-16T10:45:00Z',
        file_size: 2048000,
        file_extension: 'pdf',
        s3_upload_key: 'uploads/company2.pdf',
        s3_folder_path: 'uploads/',
        pdf_filename: 'company2_report.pdf',
        pdf_s3_key: 'reports/company2_report.pdf',
        pdf_file_size: 3072000,
        model_type: 'without_banking',
        total_parameters: 100,
        available_parameters: 75,
        financial_parameters: 20,
        business_parameters: 25,
        hygiene_parameters: 15,
        banking_parameters: 15,
        error_message: null,
        retry_count: 0,
        extracted_data: {
            about_company: {
                legal_name: 'Manufacturing Corporation Limited',
                cin: 'U25200GJ2018PTC234567',
                pan: 'FGHIJ5678K',
                company_status: 'Active',
                date_of_incorporation: '2018-03-20',
                registered_address: {
                    address_line_1: '456 Industrial Area',
                    city: 'Ahmedabad',
                    state: 'Gujarat',
                    pincode: '380001',
                    country: 'India'
                },
                business_address: {
                    address_line_1: '456 Industrial Area',
                    city: 'Ahmedabad',
                    state: 'Gujarat',
                    pincode: '380001',
                    country: 'India'
                },
                industry: 'Manufacturing',
                segment: 'Textile Manufacturing'
            },
            directors: [
                {
                    name: 'Jane Smith',
                    din: 'DIN87654321',
                    designation: 'Managing Director',
                    appointment_date: '2018-03-20'
                }
            ],
            director_shareholding: [],
            financial_data: {
                years: ['2021', '2022', '2023'],
                balance_sheet: {
                    equity: {
                        share_capital: { '2023': 2000000 },
                        reserves_and_surplus: { '2023': 3000000 },
                        total_equity: { '2023': 5000000 }
                    },
                    liabilities: {
                        long_term_borrowings: { '2023': 4000000 },
                        short_term_borrowings: { '2023': 2000000 },
                        trade_payables: { '2023': 1000000 },
                        other_current_liabilities: { '2023': 500000 },
                        total_liabilities: { '2023': 7500000 }
                    },
                    assets: {
                        tangible_assets: { '2023': 10000000 },
                        intangible_assets: { '2023': 500000 },
                        current_assets: { '2023': 2000000 },
                        trade_receivables: { '2023': 1000000 },
                        cash_and_bank: { '2023': 200000 },
                        inventory: { '2023': 800000 },
                        total_assets: { '2023': 12500000 }
                    }
                },
                profit_loss: {
                    revenue: { '2023': 8000000 },
                    ebitda: { '2023': 800000 },
                    pat: { '2023': 400000 }
                },
                cash_flow: {},
                ratios: {
                    profitability: {
                        ebitda_margin: { '2023': 10 },
                        net_margin: { '2023': 5 },
                        return_on_equity: { '2023': 8 }
                    },
                    liquidity: {
                        current_ratio: { '2023': 1.2 },
                        quick_ratio: { '2023': 1.0 }
                    },
                    efficiency: {
                        inventory_days: { '2023': 60 },
                        debtor_days: { '2023': 90 },
                        cash_conversion_cycle: { '2023': 120 }
                    },
                    leverage: {
                        debt_equity: { '2023': 1.2 },
                        interest_coverage: { '2023': 3 }
                    }
                }
            },
            shareholding: {
                promoter_percentage: 60,
                public_percentage: 40,
                total_shareholders: 200,
                shareholding_more_than_5: []
            },
            charges: {
                open_charges: [],
                satisfied_charges: [],
                total_charge_amount: 0
            },
            gst_records: {
                active_gstins: [
                    {
                        gstin: '24FGHIJ5678K1Z5',
                        status: 'Active',
                        state: 'Gujarat',
                        registration_date: '2018-04-01',
                        latest_filing: '2023-12-01',
                        compliance_status: 'Irregular'
                    }
                ],
                cancelled_gstins: [],
                filing_compliance: []
            },
            epfo_records: {
                establishments: [
                    {
                        establishment_id: 'GJ/AMD/67890',
                        status: 'Active',
                        employee_count: 100,
                        latest_wage_month: '2023-12',
                        compliance_status: 'Irregular'
                    }
                ],
                total_employees: 100,
                latest_compliance: []
            },
            legal_cases: [],
            auditor_comments: [],
            audit_qualifications: [
                {
                    year: '2023',
                    qualification_type: 'Qualified',
                    auditor_name: 'XYZ & Co'
                }
            ],
            peer_analysis: {
                industry_metrics: {},
                peer_companies: [],
                performance_vs_median: {}
            },
            msme_payments: {
                total_amount_due: 0,
                supplier_delays: [],
                payment_analysis: {}
            }
        },
        risk_analysis: {
            totalWeightedScore: 65,
            totalMaxScore: 100,
            overallPercentage: 65,
            overallGrade: {
                grade: 'CM4',
                category: 4,
                multiplier: 0.6,
                color: '#F97316',
                description: 'Poor Credit Quality'
            },
            industryModel: 'Manufacturing',
            modelVersion: '1.0',
            modelId: 'mfg-model-1',
            modelType: 'without_banking',
            categories: [],
            financialResult: {
                score: 60,
                maxScore: 100,
                weightage: 30,
                percentage: 60,
                availableCount: 20,
                totalCount: 30
            },
            businessResult: {
                score: 65,
                maxScore: 100,
                weightage: 25,
                percentage: 65,
                availableCount: 23,
                totalCount: 30
            },
            hygieneResult: {
                score: 70,
                maxScore: 100,
                weightage: 25,
                percentage: 70,
                availableCount: 14,
                totalCount: 20
            },
            bankingResult: {
                score: 0,
                maxScore: 0,
                weightage: 0,
                percentage: 0,
                availableCount: 0,
                totalCount: 0
            },
            allScores: [],
            financialScores: [],
            businessScores: [],
            hygieneScores: [],
            bankingScores: [],
            eligibility: {
                turnoverCr: 8,
                netWorthCr: 5,
                baseEligibility: 0.96,
                riskScore: 65,
                riskGrade: 'CM4',
                riskMultiplier: 0.6,
                finalEligibility: 0.576,
                existingExposure: 0,
                incrementalEligibility: 0.576
            }
        },
        processing_summary: null,
        created_at: '2024-01-16T09:00:00Z',
        updated_at: '2024-01-16T10:45:00Z'
    }
]

describe('Portfolio Filtering Functions', () => {
    describe('filterByRiskGrade', () => {
        it('should filter companies by risk grade', () => {
            const result = filterByRiskGrade(mockCompanies, ['CM2'])
            expect(result).toHaveLength(1)
            expect(result[0].risk_grade).toBe('CM2')
        })

        it('should return all companies when no risk grades specified', () => {
            const result = filterByRiskGrade(mockCompanies, [])
            expect(result).toHaveLength(2)
        })
    })

    describe('filterByIndustry', () => {
        it('should filter companies by industry', () => {
            const result = filterByIndustry(mockCompanies, ['Technology'])
            expect(result).toHaveLength(1)
            expect(result[0].industry).toBe('Technology')
        })

        it('should return empty array when no matching industry', () => {
            const result = filterByIndustry(mockCompanies, ['Healthcare'])
            expect(result).toHaveLength(0)
        })
    })

    describe('filterByRegion', () => {
        it('should filter companies by registered address state', () => {
            const result = filterByRegion(mockCompanies, ['Maharashtra'])
            expect(result).toHaveLength(1)
            expect(result[0].extracted_data?.about_company?.registered_address?.state).toBe('Maharashtra')
        })

        it('should filter companies by business address state', () => {
            const result = filterByRegion(mockCompanies, ['Gujarat'])
            expect(result).toHaveLength(1)
            expect(result[0].extracted_data?.about_company?.business_address?.state).toBe('Gujarat')
        })
    })

    describe('filterByGSTCompliance', () => {
        it('should filter companies by GST compliance status', () => {
            const result = filterByGSTCompliance(mockCompanies, ['Regular'])
            expect(result).toHaveLength(1)
            expect(result[0].company_name).toBe('Tech Solutions Pvt Ltd')
        })

        it('should filter companies by irregular GST compliance', () => {
            const result = filterByGSTCompliance(mockCompanies, ['Irregular'])
            expect(result).toHaveLength(1)
            expect(result[0].company_name).toBe('Manufacturing Corp Ltd')
        })
    })

    describe('filterByEPFOCompliance', () => {
        it('should filter companies by EPFO compliance status', () => {
            const result = filterByEPFOCompliance(mockCompanies, ['Regular'])
            expect(result).toHaveLength(1)
            expect(result[0].company_name).toBe('Tech Solutions Pvt Ltd')
        })
    })

    describe('filterByAuditQualification', () => {
        it('should filter companies by audit qualification status', () => {
            const result = filterByAuditQualification(mockCompanies, ['Qualified'])
            expect(result).toHaveLength(1)
            expect(result[0].company_name).toBe('Tech Solutions Pvt Ltd')
        })
    })

    describe('searchCompaniesAdvanced', () => {
        it('should search by company name', () => {
            const result = searchCompaniesAdvanced(mockCompanies, 'Tech Solutions')
            expect(result).toHaveLength(1)
            expect(result[0].company_name).toBe('Tech Solutions Pvt Ltd')
        })

        it('should search by CIN', () => {
            const result = searchCompaniesAdvanced(mockCompanies, 'U72900MH2020PTC123456')
            expect(result).toHaveLength(1)
            expect(result[0].company_name).toBe('Tech Solutions Pvt Ltd')
        })

        it('should search by PAN', () => {
            const result = searchCompaniesAdvanced(mockCompanies, 'FGHIJ5678K')
            expect(result).toHaveLength(1)
            expect(result[0].company_name).toBe('Manufacturing Corp Ltd')
        })

        it('should search by director name', () => {
            const result = searchCompaniesAdvanced(mockCompanies, 'John Doe')
            expect(result).toHaveLength(1)
            expect(result[0].company_name).toBe('Tech Solutions Pvt Ltd')
        })
    })

    describe('filterByFinancialMetrics', () => {
        it('should filter by EBITDA margin range', () => {
            const result = filterByFinancialMetrics(mockCompanies, {
                ebitda_margin_range: [15, 25]
            })
            expect(result).toHaveLength(1)
            expect(result[0].company_name).toBe('Tech Solutions Pvt Ltd')
        })

        it('should filter by debt-to-equity range', () => {
            const result = filterByFinancialMetrics(mockCompanies, {
                debt_equity_range: [1.0, 2.0]
            })
            expect(result).toHaveLength(1)
            expect(result[0].company_name).toBe('Manufacturing Corp Ltd')
        })

        it('should filter by current ratio range', () => {
            const result = filterByFinancialMetrics(mockCompanies, {
                current_ratio_range: [2.0, 3.0]
            })
            expect(result).toHaveLength(1)
            expect(result[0].company_name).toBe('Tech Solutions Pvt Ltd')
        })
    })

    describe('applyAdvancedFilters', () => {
        it('should apply multiple filters correctly', () => {
            const filters: FilterCriteria = {
                risk_grades: ['CM2'],
                industries: ['Technology'],
                gst_compliance_status: ['Regular']
            }

            const result = applyAdvancedFilters(mockCompanies, filters)
            expect(result).toHaveLength(1)
            expect(result[0].company_name).toBe('Tech Solutions Pvt Ltd')
        })

        it('should return empty array when no companies match all filters', () => {
            const filters: FilterCriteria = {
                risk_grades: ['CM1'],
                industries: ['Healthcare']
            }

            const result = applyAdvancedFilters(mockCompanies, filters)
            expect(result).toHaveLength(0)
        })
    })

    describe('extractFilterOptions', () => {
        it('should extract unique filter options from companies', () => {
            const options = extractFilterOptions(mockCompanies)

            expect(options.industries).toContain('Technology')
            expect(options.industries).toContain('Manufacturing')
            expect(options.regions).toContain('Maharashtra')
            expect(options.regions).toContain('Gujarat')
            expect(options.riskGrades).toContain('CM2')
            expect(options.riskGrades).toContain('CM4')
            expect(options.gstComplianceStatuses).toContain('Regular')
            expect(options.gstComplianceStatuses).toContain('Irregular')
        })
    })
})