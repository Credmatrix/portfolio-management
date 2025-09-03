// /**
//  * Test suite for Analytics Services
//  * 
//  * Tests the portfolio analytics and financial analytics services
//  * to ensure proper calculation of metrics, risk distribution, and financial trends.
//  */

// import { PortfolioAnalyticsService } from '@/lib/services/portfolio-analytics.service';
// import { FinancialAnalyticsService } from '@/lib/services/financial-analytics.service';
// import { PortfolioCompany } from '@/types/portfolio.types';

// // Mock data for testing
// const mockCompanies: PortfolioCompany[] = [
//     {
//         id: '1',
//         request_id: 'req-1',
//         user_id: 'user-1',
//         organization_id: 'org-1',
//         original_filename: 'company1.pdf',
//         company_name: 'Tech Corp Ltd',
//         industry: 'Technology',
//         risk_score: 85,
//         risk_grade: 'CM2',
//         recommended_limit: 1000000,
//         currency: 'INR',
//         status: 'completed',
//         submitted_at: '2024-01-15T10:00:00Z',
//         completed_at: '2024-01-15T12:00:00Z',
//         file_size: 1024000,
//         file_extension: 'pdf',
//         s3_upload_key: 'uploads/company1.pdf',
//         s3_folder_path: 'uploads/',
//         pdf_filename: 'company1_report.pdf',
//         pdf_s3_key: 'reports/company1_report.pdf',
//         pdf_file_size: 2048000,
//         model_type: 'without_banking',
//         total_parameters: 50,
//         available_parameters: 45,
//         financial_parameters: 20,
//         business_parameters: 15,
//         hygiene_parameters: 8,
//         banking_parameters: 2,
//         error_message: null,
//         retry_count: 0,
//         created_at: '2024-01-15T10:00:00Z',
//         updated_at: '2024-01-15T12:00:00Z',
//         processing_summary: null,
//         extracted_data: {
//             about_company: {
//                 legal_name: 'Tech Corp Limited',
//                 cin: 'U72900DL2020PTC123456',
//                 pan: 'ABCDE1234F',
//                 company_status: 'Active',
//                 date_of_incorporation: '2020-01-15',
//                 registered_address: {
//                     address_line_1: '123 Tech Street',
//                     city: 'Delhi',
//                     state: 'Delhi',
//                     pincode: '110001',
//                     country: 'India'
//                 },
//                 business_address: {
//                     address_line_1: '123 Tech Street',
//                     city: 'Delhi',
//                     state: 'Delhi',
//                     pincode: '110001',
//                     country: 'India'
//                 },
//                 industry: 'Technology',
//                 segment: 'IT Services',
//                 website: 'https://techcorp.com',
//                 email: 'info@techcorp.com',
//                 phone: '+91-11-12345678'
//             },
//             directors: [],
//             director_shareholding: [],
//             financial_data: {
//                 years: ['2021', '2022', '2023'],
//                 balance_sheet: {
//                     equity: {
//                         share_capital: { values: [1000000, 1200000, 1500000] },
//                         reserves_and_surplus: { values: [500000, 800000, 1200000] }
//                     },
//                     liabilities: {
//                         long_term_borrowings: { values: [200000, 300000, 400000] },
//                         short_term_borrowings: { values: [100000, 150000, 200000] },
//                         trade_payables: { values: [300000, 400000, 500000] }
//                     },
//                     assets: {
//                         tangible_assets: { values: [800000, 1000000, 1300000] },
//                         current_assets: { values: [600000, 800000, 1000000] },
//                         trade_receivables: { values: [400000, 500000, 600000] },
//                         cash_and_bank: { values: [200000, 300000, 400000] }
//                     }
//                 },
//                 profit_loss: {
//                     revenue: { values: [2000000, 2500000, 3000000] },
//                     ebitda: { values: [400000, 500000, 600000] },
//                     net_profit: { values: [200000, 250000, 300000] }
//                 },
//                 ratios: {
//                     profitability: {
//                         ebitda_margin: { values: [20, 20, 20] },
//                         net_margin: { values: [10, 10, 10] },
//                         return_on_equity: { values: [15, 16, 17] },
//                         return_on_assets: { values: [12, 13, 14] }
//                     },
//                     liquidity: {
//                         current_ratio: { values: [2.0, 2.2, 2.5] },
//                         quick_ratio: { values: [1.5, 1.7, 2.0] }
//                     },
//                     leverage: {
//                         debt_equity: { values: [0.3, 0.35, 0.4] },
//                         interest_coverage: { values: [8, 9, 10] }
//                     },
//                     efficiency: {
//                         inventory_days: { values: [30, 28, 25] },
//                         debtor_days: { values: [45, 42, 40] },
//                         cash_conversion_cycle: { values: [60, 55, 50] }
//                     }
//                 }
//             },
//             shareholding: {
//                 promoter_percentage: 75,
//                 public_percentage: 25,
//                 total_shareholders: 100,
//                 shareholding_more_than_5: []
//             },
//             charges: {
//                 open_charges: [],
//                 satisfied_charges: [],
//                 total_charge_amount: 0
//             },
//             gst_records: {
//                 active_gstins: [{
//                     gstin: '07ABCDE1234F1Z5',
//                     status: 'Active',
//                     state: 'Delhi',
//                     registration_date: '2020-02-01',
//                     latest_filing: '2024-01-01',
//                     compliance_status: 'Regular',
//                     business_nature: '',
//                     taxpayer_type: ''
//                 }],
//                 cancelled_gstins: [],
//                 filing_compliance: []
//             },
//             epfo_records: {
//                 establishments: [{
//                     establishment_id: 'DL/12345/2020',
//                     status: 'Active',
//                     employee_count: 50,
//                     latest_wage_month: '2024-01',
//                     compliance_status: 'Regular',
//                     establishment_name: '',
//                     address: undefined
//                 }],
//                 total_employees: 50,
//                 latest_compliance: []
//             },
//             legal_cases: [],
//             auditor_comments: [],
//             audit_qualifications: [],
//             peer_analysis: {
//                 industry_metrics: {
//                     median_revenue: 2500000,
//                     median_ebitda_margin: 18,
//                     median_debt_equity: 0.4,
//                     industry: '',
//                     total_companies: 0,
//                     median_current_ratio: 0,
//                     median_roe: 0
//                 },
//                 peer_companies: [],
//                 performance_vs_median: {
//                     revenue_percentile: 0,
//                     ebitda_margin_percentile: 0,
//                     debt_equity_percentile: 0,
//                     current_ratio_percentile: 0,
//                     roe_percentile: 0,
//                     overall_percentile: 0
//                 }
//             },
//             msme_payments: {
//                 total_amount_due: 0,
//                 supplier_delays: [],
//                 payment_analysis: {
//                     average_payment_days: 0,
//                     total_overdue_amount: 0,
//                     overdue_percentage: 0,
//                     compliance_score: 0
//                 }
//             }
//         },
//         risk_analysis: {
//             totalWeightedScore: 425,
//             totalMaxScore: 500,
//             overallPercentage: 85,
//             overallGrade: {
//                 grade: 'CM2',
//                 category: 2,
//                 multiplier: 0.9,
//                 color: '#28a745',
//                 description: 'Good Risk'
//             },
//             industryModel: 'Technology',
//             modelVersion: '2.1',
//             modelId: 'tech-model-v2',
//             modelType: 'without_banking',
//             categories: [],
//             financialResult: {
//                 score: 180,
//                 maxScore: 200,
//                 weightage: 40,
//                 percentage: 90,
//                 availableCount: 18,
//                 totalCount: 20
//             },
//             businessResult: {
//                 score: 135,
//                 maxScore: 150,
//                 weightage: 30,
//                 percentage: 90,
//                 availableCount: 13,
//                 totalCount: 15
//             },
//             hygieneResult: {
//                 score: 72,
//                 maxScore: 80,
//                 weightage: 16,
//                 percentage: 90,
//                 availableCount: 7,
//                 totalCount: 8
//             },
//             bankingResult: {
//                 score: 38,
//                 maxScore: 70,
//                 weightage: 14,
//                 percentage: 54,
//                 availableCount: 2,
//                 totalCount: 7
//             },
//             allScores: [
//                 {
//                     parameter: 'Revenue Growth',
//                     value: '25%',
//                     score: 18,
//                     maxScore: 20,
//                     weightage: 4,
//                     available: true,
//                     benchmark: 'Good',
//                     details: {}
//                 },
//                 {
//                     parameter: 'EBITDA Margin',
//                     value: '20%',
//                     score: 16,
//                     maxScore: 20,
//                     weightage: 4,
//                     available: true,
//                     benchmark: 'Good',
//                     details: {}
//                 }
//             ],
//             financialScores: [
//                 {
//                     parameter: 'Revenue Growth',
//                     value: '25%',
//                     score: 18,
//                     maxScore: 20,
//                     weightage: 4,
//                     available: true,
//                     benchmark: 'Good',
//                     details: {}
//                 }
//             ],
//             businessScores: [
//                 {
//                     parameter: 'Market Position',
//                     value: 'Strong',
//                     score: 16,
//                     maxScore: 20,
//                     weightage: 3,
//                     available: true,
//                     benchmark: 'Good',
//                     details: {}
//                 }
//             ],
//             hygieneScores: [
//                 {
//                     parameter: 'GST Compliance',
//                     value: 'Regular',
//                     score: 18,
//                     maxScore: 20,
//                     weightage: 2,
//                     available: true,
//                     benchmark: 'Excellent',
//                     details: {}
//                 }
//             ],
//             bankingScores: [
//                 {
//                     parameter: 'Banking Relationship',
//                     value: 'Good',
//                     score: 15,
//                     maxScore: 20,
//                     weightage: 2,
//                     available: true,
//                     benchmark: 'Good',
//                     details: {}
//                 }
//             ],
//             eligibility: {
//                 turnoverCr: 30,
//                 netWorthCr: 27,
//                 baseEligibility: 1200000,
//                 riskScore: 85,
//                 riskGrade: 'CM2',
//                 riskMultiplier: 0.9,
//                 finalEligibility: 1080000,
//                 existingExposure: 0,
//                 incrementalEligibility: 1080000
//             }
//         }
//     },
//     {
//         id: '2',
//         request_id: 'req-2',
//         user_id: 'user-1',
//         organization_id: 'org-1',
//         original_filename: 'company2.pdf',
//         company_name: 'Manufacturing Inc',
//         industry: 'Manufacturing',
//         risk_score: 65,
//         risk_grade: 'CM4',
//         recommended_limit: 500000,
//         currency: 'INR',
//         status: 'completed',
//         submitted_at: '2024-01-16T10:00:00Z',
//         completed_at: '2024-01-16T14:00:00Z',
//         file_size: 1536000,
//         file_extension: 'pdf',
//         s3_upload_key: 'uploads/company2.pdf',
//         s3_folder_path: 'uploads/',
//         pdf_filename: 'company2_report.pdf',
//         pdf_s3_key: 'reports/company2_report.pdf',
//         pdf_file_size: 3072000,
//         model_type: 'with_banking',
//         total_parameters: 60,
//         available_parameters: 48,
//         financial_parameters: 25,
//         business_parameters: 18,
//         hygiene_parameters: 10,
//         banking_parameters: 7,
//         error_message: null,
//         retry_count: 0,
//         created_at: '2024-01-16T10:00:00Z',
//         updated_at: '2024-01-16T14:00:00Z',
//         processing_summary: null,
//         extracted_data: {
//             about_company: {
//                 legal_name: 'Manufacturing Inc Limited',
//                 cin: 'U25200MH2018PTC234567',
//                 pan: 'FGHIJ5678K',
//                 company_status: 'Active',
//                 date_of_incorporation: '2018-03-20',
//                 registered_address: {
//                     address_line_1: '456 Industrial Area',
//                     city: 'Mumbai',
//                     state: 'Maharashtra',
//                     pincode: '400001',
//                     country: 'India'
//                 },
//                 business_address: {
//                     address_line_1: '456 Industrial Area',
//                     city: 'Mumbai',
//                     state: 'Maharashtra',
//                     pincode: '400001',
//                     country: 'India'
//                 },
//                 industry: 'Manufacturing',
//                 segment: 'Auto Components',
//                 website: 'https://manufacturing.com',
//                 email: 'info@manufacturing.com',
//                 phone: '+91-22-87654321'
//             },
//             directors: [],
//             director_shareholding: [],
//             financial_data: {
//                 years: ['2021', '2022', '2023'],
//                 balance_sheet: {
//                     equity: {
//                         share_capital: { values: [2000000, 2200000, 2500000] },
//                         reserves_and_surplus: { values: [800000, 1000000, 1300000] }
//                     },
//                     liabilities: {
//                         long_term_borrowings: { values: [1000000, 1200000, 1500000] },
//                         short_term_borrowings: { values: [500000, 600000, 700000] },
//                         trade_payables: { values: [600000, 700000, 800000] }
//                     },
//                     assets: {
//                         tangible_assets: { values: [2500000, 2800000, 3200000] },
//                         current_assets: { values: [1200000, 1400000, 1600000] },
//                         trade_receivables: { values: [800000, 900000, 1000000] },
//                         cash_and_bank: { values: [400000, 500000, 600000] }
//                     }
//                 },
//                 profit_loss: {
//                     revenue: { values: [5000000, 5500000, 6000000] },
//                     ebitda: { values: [750000, 825000, 900000] },
//                     net_profit: { values: [300000, 330000, 360000] }
//                 },
//                 ratios: {
//                     profitability: {
//                         ebitda_margin: { values: [15, 15, 15] },
//                         net_margin: { values: [6, 6, 6] },
//                         return_on_equity: { values: [12, 13, 14] },
//                         return_on_assets: { values: [8, 9, 10] }
//                     },
//                     liquidity: {
//                         current_ratio: { values: [1.5, 1.6, 1.7] },
//                         quick_ratio: { values: [1.0, 1.1, 1.2] }
//                     },
//                     leverage: {
//                         debt_equity: { values: [0.8, 0.75, 0.7] },
//                         interest_coverage: { values: [4, 5, 6] }
//                     },
//                     efficiency: {
//                         inventory_days: { values: [60, 55, 50] },
//                         debtor_days: { values: [65, 60, 55] },
//                         cash_conversion_cycle: { values: [90, 85, 80] }
//                     }
//                 }
//             },
//             shareholding: {
//                 promoter_percentage: 60,
//                 public_percentage: 40,
//                 total_shareholders: 200,
//                 shareholding_more_than_5: []
//             },
//             charges: {
//                 open_charges: [],
//                 satisfied_charges: [],
//                 total_charge_amount: 500000
//             },
//             gst_records: {
//                 active_gstins: [{
//                     gstin: '27FGHIJ5678K1Z9',
//                     status: 'Active',
//                     state: 'Maharashtra',
//                     registration_date: '2018-04-01',
//                     latest_filing: '2023-12-01',
//                     compliance_status: 'Irregular',
//                     business_nature: '',
//                     taxpayer_type: ''
//                 }],
//                 cancelled_gstins: [],
//                 filing_compliance: []
//             },
//             epfo_records: {
//                 establishments: [{
//                     establishment_id: 'MH/67890/2018',
//                     status: 'Active',
//                     employee_count: 150,
//                     latest_wage_month: '2023-12',
//                     compliance_status: 'Irregular',
//                     establishment_name: '',
//                     address: undefined
//                 }],
//                 total_employees: 150,
//                 latest_compliance: []
//             },
//             legal_cases: [],
//             auditor_comments: [],
//             audit_qualifications: [{
//                 qualification_type: 'Qualified',
//                 description: 'Going concern qualification',
//                 year: '2023'
//             }],
//             peer_analysis: {
//                 industry_metrics: {
//                     median_revenue: 5500000,
//                     median_ebitda_margin: 16,
//                     median_debt_equity: 0.6,
//                     industry: '',
//                     total_companies: 0,
//                     median_current_ratio: 0,
//                     median_roe: 0
//                 },
//                 peer_companies: [],
//                 performance_vs_median: {
//                     revenue_percentile: 0,
//                     ebitda_margin_percentile: 0,
//                     debt_equity_percentile: 0,
//                     current_ratio_percentile: 0,
//                     roe_percentile: 0,
//                     overall_percentile: 0
//                 }
//             },
//             msme_payments: {
//                 total_amount_due: 100000,
//                 supplier_delays: [],
//                 payment_analysis: {
//                     average_payment_days: 0,
//                     total_overdue_amount: 0,
//                     overdue_percentage: 0,
//                     compliance_score: 0
//                 }
//             }
//         },
//         risk_analysis: {
//             totalWeightedScore: 325,
//             totalMaxScore: 500,
//             overallPercentage: 65,
//             overallGrade: {
//                 grade: 'CM4',
//                 category: 4,
//                 multiplier: 0.7,
//                 color: '#ffc107',
//                 description: 'Moderate Risk'
//             },
//             industryModel: 'Manufacturing',
//             modelVersion: '2.1',
//             modelId: 'mfg-model-v2',
//             modelType: 'with_banking',
//             categories: [],
//             financialResult: {
//                 score: 140,
//                 maxScore: 200,
//                 weightage: 40,
//                 percentage: 70,
//                 availableCount: 22,
//                 totalCount: 25
//             },
//             businessResult: {
//                 score: 105,
//                 maxScore: 150,
//                 weightage: 30,
//                 percentage: 70,
//                 availableCount: 16,
//                 totalCount: 18
//             },
//             hygieneResult: {
//                 score: 48,
//                 maxScore: 80,
//                 weightage: 16,
//                 percentage: 60,
//                 availableCount: 8,
//                 totalCount: 10
//             },
//             bankingResult: {
//                 score: 32,
//                 maxScore: 70,
//                 weightage: 14,
//                 percentage: 46,
//                 availableCount: 5,
//                 totalCount: 7
//             },
//             allScores: [
//                 {
//                     parameter: 'Revenue Growth',
//                     value: '10%',
//                     score: 12,
//                     maxScore: 20,
//                     weightage: 4,
//                     available: true,
//                     benchmark: 'Average',
//                     details: {}
//                 }
//             ],
//             financialScores: [
//                 {
//                     parameter: 'Revenue Growth',
//                     value: '10%',
//                     score: 12,
//                     maxScore: 20,
//                     weightage: 4,
//                     available: true,
//                     benchmark: 'Average',
//                     details: {}
//                 }
//             ],
//             businessScores: [],
//             hygieneScores: [],
//             bankingScores: [],
//             eligibility: {
//                 turnoverCr: 60,
//                 netWorthCr: 38,
//                 baseEligibility: 800000,
//                 riskScore: 65,
//                 riskGrade: 'CM4',
//                 riskMultiplier: 0.7,
//                 finalEligibility: 560000,
//                 existingExposure: 0,
//                 incrementalEligibility: 560000
//             }
//         }
//     }
// ];

// describe('PortfolioAnalyticsService', () => {
//     describe('calculateRiskDistribution', () => {
//         it('should calculate risk distribution correctly', () => {
//             const result = PortfolioAnalyticsService.calculateRiskDistribution(mockCompanies);

//             expect(result.total_count).toBe(2);
//             expect(result.cm2_count).toBe(1);
//             expect(result.cm4_count).toBe(1);
//             expect(result.distribution_percentages.CM2).toBe(50);
//             expect(result.distribution_percentages.CM4).toBe(50);
//         });

//         it('should handle companies without risk grades', () => {
//             const companiesWithoutGrades = [
//                 { ...mockCompanies[0], risk_analysis: null },
//                 mockCompanies[1]
//             ];

//             const result = PortfolioAnalyticsService.calculateRiskDistribution(companiesWithoutGrades);

//             expect(result.ungraded_count).toBe(1);
//             expect(result.cm4_count).toBe(1);
//         });
//     });

//     describe('calculateParameterAnalysis', () => {
//         it('should analyze parameters across categories', () => {
//             const result = PortfolioAnalyticsService.calculateParameterAnalysis(mockCompanies);

//             expect(result.financial).toBeDefined();
//             expect(result.business).toBeDefined();
//             expect(result.hygiene).toBeDefined();
//             expect(result.banking).toBeDefined();
//             expect(result.overall).toBeDefined();

//             expect(result.overall.total_companies_analyzed).toBe(2);
//             expect(result.overall.average_overall_percentage).toBe(75); // (85 + 65) / 2
//         });
//     });

//     describe('calculateIndustryBreakdown', () => {
//         it('should group companies by industry with risk overlay', () => {
//             const result = PortfolioAnalyticsService.calculateIndustryBreakdown(mockCompanies);

//             expect(result.industries).toHaveLength(2);

//             const techIndustry = result.industries.find(i => i.name === 'Technology');
//             const mfgIndustry = result.industries.find(i => i.name === 'Manufacturing');

//             expect(techIndustry?.count).toBe(1);
//             expect(techIndustry?.average_risk_score).toBe(85);
//             expect(mfgIndustry?.count).toBe(1);
//             expect(mfgIndustry?.average_risk_score).toBe(65);
//         });
//     });

//     describe('calculateRegionalDistribution', () => {
//         it('should group companies by state and city', () => {
//             const result = PortfolioAnalyticsService.calculateRegionalDistribution(mockCompanies);

//             expect(result.regions).toHaveLength(2);

//             const delhiRegion = result.regions.find(r => r.state === 'Delhi');
//             const maharashtraRegion = result.regions.find(r => r.state === 'Maharashtra');

//             expect(delhiRegion?.count).toBe(1);
//             expect(delhiRegion?.cities).toHaveLength(1);
//             expect(maharashtraRegion?.count).toBe(1);
//             expect(maharashtraRegion?.cities).toHaveLength(1);
//         });
//     });

//     describe('calculateComplianceMetrics', () => {
//         it('should analyze GST and EPFO compliance', () => {
//             const result = PortfolioAnalyticsService.calculateComplianceMetrics(mockCompanies);

//             expect(result.gst_compliance.compliant).toBe(1); // Tech Corp has Regular GST
//             expect(result.gst_compliance.non_compliant).toBe(1); // Manufacturing has Irregular GST
//             expect(result.epfo_compliance.compliant).toBe(1); // Tech Corp has Regular EPFO
//             expect(result.epfo_compliance.non_compliant).toBe(1); // Manufacturing has Irregular EPFO
//             expect(result.audit_status.qualified).toBe(1); // Manufacturing has qualified audit
//             expect(result.audit_status.unqualified).toBe(1); // Tech Corp has no qualifications
//         });
//     });

//     describe('calculateEligibilityAnalysis', () => {
//         it('should analyze credit eligibility across portfolio', () => {
//             const result = PortfolioAnalyticsService.calculateEligibilityAnalysis(mockCompanies);

//             expect(result.total_eligible_amount).toBe(1640000); // 1080000 + 560000
//             expect(result.average_eligibility).toBe(820000);
//             expect(result.eligibility_distribution.CM2).toBe(1080000);
//             expect(result.eligibility_distribution.CM4).toBe(560000);
//         });
//     });
// });

// describe('FinancialAnalyticsService', () => {
//     describe('calculateFinancialTrends', () => {
//         it('should calculate financial trends with risk correlation', () => {
//             const result = FinancialAnalyticsService.calculateFinancialTrends(mockCompanies);

//             expect(result.length).toBeGreaterThan(0);

//             const revenueTrends = result.filter(t => t.metric === 'revenue');
//             expect(revenueTrends).toHaveLength(3); // 3 years of data

//             // Check that trends have required properties
//             revenueTrends.forEach(trend => {
//                 expect(trend.year).toBeDefined();
//                 expect(trend.value).toBeDefined();
//                 expect(trend.risk_correlation).toBeDefined();
//             });
//         });
//     });

//     describe('calculatePeerComparison', () => {
//         it('should compare companies against peers with risk benchmarking', () => {
//             const result = FinancialAnalyticsService.calculatePeerComparison(mockCompanies, 'revenue');

//             expect(result).toHaveLength(2);

//             result.forEach(comparison => {
//                 expect(comparison.company_id).toBeDefined();
//                 expect(comparison.company_name).toBeDefined();
//                 expect(comparison.metric_value).toBeDefined();
//                 expect(comparison.peer_percentile).toBeDefined();
//                 expect(comparison.risk_adjusted_performance).toBeDefined();
//                 expect(comparison.benchmark_category).toBeDefined();
//             });
//         });
//     });

//     describe('calculatePortfolioExposure', () => {
//         it('should calculate portfolio exposure with concentration risk', () => {
//             const result = FinancialAnalyticsService.calculatePortfolioExposure(mockCompanies);

//             expect(result.total_recommended_limit).toBe(1500000); // 1000000 + 500000
//             expect(result.total_final_eligibility).toBe(1640000); // 1080000 + 560000
//             expect(result.exposure_by_risk_grade.CM2).toBe(1080000);
//             expect(result.exposure_by_risk_grade.CM4).toBe(560000);

//             expect(result.concentration_risk.max_single_exposure_percentage).toBeGreaterThan(0);
//             expect(result.concentration_risk.herfindahl_index).toBeGreaterThan(0);
//         });
//     });

//     describe('calculateRiskModelPerformance', () => {
//         it('should calculate risk model performance metrics', () => {
//             const result = FinancialAnalyticsService.calculateRiskModelPerformance(mockCompanies);

//             expect(result.model_accuracy).toBeGreaterThan(0);
//             expect(result.prediction_variance).toBeGreaterThan(0);
//             expect(result.grade_stability).toBeDefined();
//             expect(result.parameter_importance).toBeDefined();
//             expect(result.validation_metrics.precision).toBeDefined();
//             expect(result.validation_metrics.recall).toBeDefined();
//             expect(result.validation_metrics.f1_score).toBeDefined();
//         });
//     });

//     describe('calculateBenchmarkAnalysis', () => {
//         it('should analyze parameter benchmarks against industry standards', () => {
//             const result = FinancialAnalyticsService.calculateBenchmarkAnalysis(mockCompanies);

//             expect(result.parameter_benchmarks).toBeDefined();
//             expect(result.category_performance).toBeDefined();

//             // Check that we have category performance for main categories
//             expect(result.category_performance.Financial).toBeDefined();
//             expect(result.category_performance.Business).toBeDefined();
//             expect(result.category_performance.Hygiene).toBeDefined();
//             expect(result.category_performance.Banking).toBeDefined();
//         });
//     });

//     describe('calculateCreditEligibilityTrends', () => {
//         it('should calculate eligibility trends over time', () => {
//             const result = FinancialAnalyticsService.calculateCreditEligibilityTrends(mockCompanies);

//             expect(result.eligibility_trends).toBeDefined();
//             expect(result.eligibility_changes).toBeDefined();
//             expect(result.eligibility_changes.length).toBeGreaterThan(0);

//             result.eligibility_changes.forEach(change => {
//                 expect(change.company_id).toBeDefined();
//                 expect(change.company_name).toBeDefined();
//                 expect(change.current_eligibility).toBeDefined();
//                 expect(change.change_percentage).toBeDefined();
//             });
//         });
//     });
// });

// describe('Integration Tests', () => {
//     it('should generate comprehensive analytics without errors', () => {
//         const portfolioAnalytics = PortfolioAnalyticsService.getComprehensiveAnalytics(mockCompanies);
//         const financialAnalytics = FinancialAnalyticsService.getComprehensiveFinancialAnalytics(mockCompanies);

//         expect(portfolioAnalytics.summary.total_companies).toBe(2);
//         expect(portfolioAnalytics.summary.companies_with_analysis).toBe(2);
//         expect(portfolioAnalytics.summary.total_exposure).toBe(1500000);

//         expect(financialAnalytics.financial_trends).toBeDefined();
//         expect(financialAnalytics.peer_comparison).toBeDefined();
//         expect(financialAnalytics.portfolio_exposure).toBeDefined();
//         expect(financialAnalytics.risk_model_performance).toBeDefined();
//         expect(financialAnalytics.benchmark_analysis).toBeDefined();
//         expect(financialAnalytics.eligibility_trends).toBeDefined();
//     });

//     it('should handle empty portfolio gracefully', () => {
//         const emptyPortfolio: PortfolioCompany[] = [];

//         const portfolioAnalytics = PortfolioAnalyticsService.getComprehensiveAnalytics(emptyPortfolio);
//         const financialAnalytics = FinancialAnalyticsService.getComprehensiveFinancialAnalytics(emptyPortfolio);

//         expect(portfolioAnalytics.summary.total_companies).toBe(0);
//         expect(portfolioAnalytics.risk_distribution.total_count).toBe(0);

//         expect(financialAnalytics.financial_trends).toHaveLength(0);
//         expect(financialAnalytics.peer_comparison).toHaveLength(0);
//     });
// });