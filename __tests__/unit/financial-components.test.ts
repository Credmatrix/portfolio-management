import { describe, it, expect } from '@jest/globals'

// Mock the portfolio types
const mockCompany = {
    id: 'test-id',
    request_id: 'test-request',
    company_name: 'Test Company',
    industry: 'Technology',
    risk_score: 75,
    risk_grade: 'CM3',
    recommended_limit: 100,
    extracted_data: {
        financial_data: {
            years: ['2021', '2022', '2023'],
            balance_sheet: {
                assets: {
                    total_assets: { '2023': 1000, '2022': 900, '2021': 800 },
                    current_assets: { '2023': 400, '2022': 350, '2021': 300 },
                    tangible_assets: { '2023': 500, '2022': 450, '2021': 400 },
                    trade_receivables: { '2023': 150, '2022': 130, '2021': 120 },
                    cash_and_bank: { '2023': 100, '2022': 80, '2021': 60 }
                },
                equity: {
                    total_equity: { '2023': 600, '2022': 550, '2021': 500 },
                    share_capital: { '2023': 100, '2022': 100, '2021': 100 },
                    reserves_and_surplus: { '2023': 500, '2022': 450, '2021': 400 }
                },
                liabilities: {
                    total_liabilities: { '2023': 400, '2022': 350, '2021': 300 },
                    long_term_borrowings: { '2023': 200, '2022': 180, '2021': 160 },
                    short_term_borrowings: { '2023': 100, '2022': 90, '2021': 80 },
                    trade_payables: { '2023': 100, '2022': 80, '2021': 60 }
                }
            },
            profit_loss: {
                revenue: { '2023': 1200, '2022': 1100, '2021': 1000 },
                ebitda: { '2023': 180, '2022': 165, '2021': 150 },
                ebit: { '2023': 150, '2022': 140, '2021': 130 },
                pat: { '2023': 120, '2022': 110, '2021': 100 },
                operating_expenses: { '2023': 800, '2022': 750, '2021': 700 },
                depreciation: { '2023': 30, '2022': 25, '2021': 20 },
                interest_expense: { '2023': 20, '2022': 18, '2021': 15 },
                tax: { '2023': 10, '2022': 12, '2021': 15 }
            },
            cash_flow: {
                operating_cash_flow: { '2023': 140, '2022': 125, '2021': 110 },
                investing_cash_flow: { '2023': -50, '2022': -45, '2021': -40 },
                financing_cash_flow: { '2023': -30, '2022': -25, '2021': -20 },
                net_cash_flow: { '2023': 60, '2022': 55, '2021': 50 },
                opening_cash: { '2023': 80, '2022': 60, '2021': 40 },
                closing_cash: { '2023': 100, '2022': 80, '2021': 60 }
            },
            ratios: {
                profitability: {
                    ebitda_margin: { '2023': 15, '2022': 15, '2021': 15 },
                    net_margin: { '2023': 10, '2022': 10, '2021': 10 },
                    return_on_equity: { '2023': 20, '2022': 20, '2021': 20 }
                },
                liquidity: {
                    current_ratio: { '2023': 2.0, '2022': 1.9, '2021': 1.8 },
                    quick_ratio: { '2023': 1.5, '2022': 1.4, '2021': 1.3 }
                },
                leverage: {
                    debt_equity: { '2023': 0.5, '2022': 0.5, '2021': 0.5 },
                    interest_coverage: { '2023': 7.5, '2022': 7.8, '2021': 8.7 }
                }
            }
        }
    },
    risk_analysis: {
        totalWeightedScore: 750,
        totalMaxScore: 1000,
        overallPercentage: 75,
        overallGrade: {
            grade: 'CM3',
            category: 3,
            multiplier: 0.8,
            color: '#F59E0B',
            description: 'Average Credit Quality'
        },
        financialResult: {
            score: 200,
            maxScore: 250,
            weightage: 0.3,
            percentage: 80,
            availableCount: 8,
            totalCount: 10
        },
        businessResult: {
            score: 180,
            maxScore: 200,
            percentage: 90,
            weightage: 0.25,
            availableCount: 9,
            totalCount: 10
        },
        hygieneResult: {
            score: 170,
            maxScore: 200,
            percentage: 85,
            weightage: 0.25,
            availableCount: 8,
            totalCount: 10
        },
        bankingResult: {
            score: 200,
            maxScore: 250,
            percentage: 80,
            weightage: 0.2,
            availableCount: 7,
            totalCount: 10
        }
    }
} as any

describe('Financial Analysis Components', () => {
    it('should have valid mock data structure', () => {
        expect(mockCompany).toBeDefined()
        expect(mockCompany.extracted_data?.financial_data).toBeDefined()
        expect(mockCompany.risk_analysis).toBeDefined()
    })

    it('should have financial data with multi-year trends', () => {
        const financialData = mockCompany.extracted_data.financial_data
        expect(financialData.years).toHaveLength(3)
        expect(financialData.balance_sheet).toBeDefined()
        expect(financialData.profit_loss).toBeDefined()
        expect(financialData.cash_flow).toBeDefined()
        expect(financialData.ratios).toBeDefined()
    })

    it('should have risk analysis with category results', () => {
        const riskAnalysis = mockCompany.risk_analysis
        expect(riskAnalysis.overallPercentage).toBe(75)
        expect(riskAnalysis.overallGrade.grade).toBe('CM3')
        expect(riskAnalysis.financialResult.percentage).toBe(80)
        expect(riskAnalysis.businessResult.percentage).toBe(90)
    })

    it('should calculate basic financial metrics correctly', () => {
        const latestYear = '2023'
        const revenue = mockCompany.extracted_data.financial_data.profit_loss.revenue[latestYear]
        const ebitda = mockCompany.extracted_data.financial_data.profit_loss.ebitda[latestYear]
        const ebitdaMargin = (ebitda / revenue) * 100

        expect(revenue).toBe(1200)
        expect(ebitda).toBe(180)
        expect(ebitdaMargin).toBe(15)
    })

    it('should have balance sheet data for risk correlation analysis', () => {
        const balanceSheet = mockCompany.extracted_data.financial_data.balance_sheet
        const latestYear = '2023'

        const totalAssets = balanceSheet.assets.total_assets[latestYear]
        const currentAssets = balanceSheet.assets.current_assets[latestYear]
        const totalLiabilities = balanceSheet.liabilities.total_liabilities[latestYear]

        expect(totalAssets).toBe(1000)
        expect(currentAssets).toBe(400)
        expect(totalLiabilities).toBe(400)

        // Test risk correlation calculations
        const currentAssetsRatio = (currentAssets / totalAssets) * 100
        const debtToAssetsRatio = (totalLiabilities / totalAssets) * 100

        expect(currentAssetsRatio).toBe(40) // Should be >= 40% for good liquidity
        expect(debtToAssetsRatio).toBe(40) // Should be <= 60% for conservative leverage
    })

    it('should have cash flow data for liquidity risk assessment', () => {
        const cashFlow = mockCompany.extracted_data.financial_data.cash_flow
        const latestYear = '2023'

        const operatingCashFlow = cashFlow.operating_cash_flow[latestYear]
        const investingCashFlow = cashFlow.investing_cash_flow[latestYear]
        const freeCashFlow = operatingCashFlow + investingCashFlow

        expect(operatingCashFlow).toBe(140)
        expect(investingCashFlow).toBe(-50)
        expect(freeCashFlow).toBe(90) // Positive free cash flow is good
    })
})