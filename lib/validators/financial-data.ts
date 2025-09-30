import { z } from 'zod'

// Yearly data schema for financial fields
const yearlyDataSchema = z.record(z.string(), z.number().nullable())

// Vertical Balance Sheet Schema (Non-Corporate Format)
const verticalBalanceSheetSchema = z.object({
    owners_funds_and_liabilities: z.object({
        owners_fund: z.object({
            owners_capital_account: yearlyDataSchema,
            owners_current_account: yearlyDataSchema,
            reserves_and_surplus: yearlyDataSchema
        }),
        non_current_liabilities: z.object({
            long_term_borrowings: yearlyDataSchema,
            deferred_tax_liabilities: yearlyDataSchema,
            other_long_term_liabilities: yearlyDataSchema,
            long_term_provisions: yearlyDataSchema
        }),
        current_liabilities: z.object({
            short_term_borrowings: yearlyDataSchema,
            trade_payables: yearlyDataSchema,
            other_current_liabilities: yearlyDataSchema,
            short_term_provisions: yearlyDataSchema
        })
    }),
    assets: z.object({
        non_current_assets: z.object({
            property_plant_equipment: yearlyDataSchema,
            intangible_assets: yearlyDataSchema,
            capital_work_in_progress: yearlyDataSchema,
            intangible_assets_under_development: yearlyDataSchema,
            non_current_investments: yearlyDataSchema,
            deferred_tax_assets: yearlyDataSchema,
            long_term_loans_and_advances: yearlyDataSchema,
            other_non_current_assets: yearlyDataSchema
        }),
        current_assets: z.object({
            current_investments: yearlyDataSchema,
            inventories: yearlyDataSchema,
            trade_receivables: yearlyDataSchema,
            cash_and_bank_balances: yearlyDataSchema,
            short_term_loans_and_advances: yearlyDataSchema,
            other_current_assets: yearlyDataSchema
        })
    })
})

// Non-Corporate Profit & Loss Schema
const nonCorporateProfitLossSchema = z.object({
    revenue_from_operations: yearlyDataSchema,
    other_income: yearlyDataSchema,
    total_income: yearlyDataSchema,
    expenses: z.object({
        cost_of_materials_consumed: yearlyDataSchema,
        purchases_of_stock_in_trade: yearlyDataSchema,
        changes_in_inventories: yearlyDataSchema,
        employee_benefits_expense: yearlyDataSchema,
        depreciation_and_amortization: yearlyDataSchema,
        finance_cost: yearlyDataSchema,
        other_expenses: yearlyDataSchema,
        total_expenses: yearlyDataSchema
    }),
    profit_before_exceptional_extraordinary_partners_remuneration_tax: yearlyDataSchema,
    exceptional_items: yearlyDataSchema,
    profit_before_extraordinary_partners_remuneration_tax: yearlyDataSchema,
    extraordinary_items: yearlyDataSchema,
    profit_before_partners_remuneration_tax: yearlyDataSchema,
    partners_remuneration: yearlyDataSchema.optional(),
    profit_before_tax: yearlyDataSchema,
    tax_expense: z.object({
        current_tax: yearlyDataSchema,
        deferred_tax: yearlyDataSchema
    }),
    profit_from_continuing_operations: yearlyDataSchema,
    profit_from_discontinuing_operations: yearlyDataSchema.optional(),
    tax_expense_discontinuing_operations: yearlyDataSchema.optional(),
    profit_from_discontinuing_operations_after_tax: yearlyDataSchema.optional(),
    profit_for_period: yearlyDataSchema
})

// Cash Flow Statement Schema
const cashFlowStatementSchema = z.object({
    operating_activities: z.object({
        profit_before_tax: yearlyDataSchema,
        adjustments_for: z.object({
            depreciation_amortization: yearlyDataSchema,
            finance_costs: yearlyDataSchema,
            investment_income: yearlyDataSchema,
            other_adjustments: yearlyDataSchema
        }),
        working_capital_changes: z.object({
            trade_receivables: yearlyDataSchema,
            inventories: yearlyDataSchema,
            trade_payables: yearlyDataSchema,
            other_working_capital: yearlyDataSchema
        }),
        cash_generated_from_operations: yearlyDataSchema,
        income_tax_paid: yearlyDataSchema,
        net_cash_from_operating_activities: yearlyDataSchema
    }),
    investing_activities: z.object({
        purchase_of_fixed_assets: yearlyDataSchema,
        sale_of_fixed_assets: yearlyDataSchema,
        purchase_of_investments: yearlyDataSchema,
        sale_of_investments: yearlyDataSchema,
        interest_received: yearlyDataSchema,
        dividend_received: yearlyDataSchema,
        net_cash_from_investing_activities: yearlyDataSchema
    }),
    financing_activities: z.object({
        proceeds_from_borrowings: yearlyDataSchema,
        repayment_of_borrowings: yearlyDataSchema,
        interest_paid: yearlyDataSchema,
        partners_capital_introduced: yearlyDataSchema.optional(),
        partners_drawings: yearlyDataSchema.optional(),
        net_cash_from_financing_activities: yearlyDataSchema
    }),
    net_increase_in_cash: yearlyDataSchema,
    cash_at_beginning: yearlyDataSchema,
    cash_at_end: yearlyDataSchema
})

// Calculated Ratios Schema
const calculatedRatiosSchema = z.object({
    liquidity_ratios: z.object({
        current_ratio: yearlyDataSchema,
        quick_ratio: yearlyDataSchema,
        cash_ratio: yearlyDataSchema
    }),
    leverage_ratios: z.object({
        debt_equity_ratio: yearlyDataSchema,
        debt_ratio: yearlyDataSchema,
        interest_coverage_ratio: yearlyDataSchema
    }),
    efficiency_ratios: z.object({
        inventory_turnover: yearlyDataSchema,
        receivables_turnover: yearlyDataSchema,
        payables_turnover: yearlyDataSchema,
        asset_turnover: yearlyDataSchema
    }),
    profitability_ratios: z.object({
        gross_profit_margin: yearlyDataSchema,
        net_profit_margin: yearlyDataSchema,
        return_on_assets: yearlyDataSchema,
        return_on_equity: yearlyDataSchema
    })
})

// Financial Notes Schema
const financialNotesSchema = z.object({
    note_number: z.string(),
    title: z.string(),
    description: z.string(),
    amount: yearlyDataSchema.optional(),
    category: z.enum(['accounting_policy', 'disclosure', 'contingency', 'commitment', 'other'])
})

// Validation Error Schema
const validationErrorSchema = z.object({
    field: z.string(),
    error_type: z.enum(['required', 'format', 'range', 'business_rule', 'consistency']),
    message: z.string(),
    severity: z.enum(['error', 'warning', 'info']),
    code: z.string()
})

// Main Non-Corporate Financial Data Schema
export const nonCorporateFinancialDataSchema = z.object({
    format_version: z.literal('non_corporate_2024'),
    currency: z.string().default('INR'),
    financial_years: z.array(z.string()).min(1, 'At least one financial year is required'),
    balance_sheet: verticalBalanceSheetSchema,
    profit_loss: nonCorporateProfitLossSchema,
    cash_flow: cashFlowStatementSchema.optional(),
    ratios: calculatedRatiosSchema,
    notes: z.array(financialNotesSchema).optional(),
    validation_status: z.enum(['pending', 'validated', 'errors']).default('pending'),
    validation_errors: z.array(validationErrorSchema).default([])
})

// Partial schema for form validation
export const partialFinancialDataSchema = nonCorporateFinancialDataSchema.partial()

// Business rule validation functions
export const validateFinancialBusinessRules = (data: any): string[] => {
    const errors: string[] = []

    if (!data.balance_sheet || !data.profit_loss || !data.financial_years) {
        return ['Balance Sheet, Profit & Loss, and Financial Years are required']
    }

    const { balance_sheet, profit_loss, financial_years } = data

    // Validate each financial year
    financial_years.forEach((year: string) => {
        // Balance Sheet validation
        const totalAssets = calculateTotalAssets(balance_sheet, year)
        const totalLiabilities = calculateTotalLiabilities(balance_sheet, year)

        if (totalAssets !== null && totalLiabilities !== null && Math.abs(totalAssets - totalLiabilities) > 1) {
            errors.push(`Balance Sheet does not balance for ${year}: Assets (${totalAssets}) ≠ Liabilities (${totalLiabilities})`)
        }

        // P&L validation
        const revenue = profit_loss.revenue_from_operations[year]
        const otherIncome = profit_loss.other_income[year] || 0
        const totalIncome = profit_loss.total_income[year]

        if (revenue !== null && totalIncome !== null && Math.abs((revenue + otherIncome) - totalIncome) > 1) {
            errors.push(`Total Income calculation error for ${year}`)
        }

        // Expense validation
        const expenses = profit_loss.expenses
        const totalExpenses = expenses.total_expenses[year]
        const calculatedTotal = Object.keys(expenses)
            .filter(key => key !== 'total_expenses')
            .reduce((sum, key) => sum + (expenses[key][year] || 0), 0)

        if (totalExpenses !== null && Math.abs(calculatedTotal - totalExpenses) > 1) {
            errors.push(`Total Expenses calculation error for ${year}`)
        }

        // Profit calculation validation
        const profitBeforeTax = profit_loss.profit_before_tax[year]
        const currentTax = profit_loss.tax_expense.current_tax[year] || 0
        const deferredTax = profit_loss.tax_expense.deferred_tax[year] || 0
        const profitForPeriod = profit_loss.profit_for_period[year]

        if (profitBeforeTax !== null && profitForPeriod !== null) {
            const expectedProfit = profitBeforeTax - currentTax - deferredTax
            if (Math.abs(expectedProfit - profitForPeriod) > 1) {
                errors.push(`Profit calculation error for ${year}`)
            }
        }

        // Minimum data validation
        if (revenue === null || revenue === undefined) {
            errors.push(`Revenue from Operations is required for ${year}`)
        }

        if (balance_sheet.assets.current_assets.cash_and_bank_balances[year] === null) {
            errors.push(`Cash and Bank Balances is required for ${year}`)
        }
    })

    // Cross-year validation
    if (financial_years.length > 1) {
        const sortedYears = financial_years.sort()
        for (let i = 1; i < sortedYears.length; i++) {
            const currentYear = sortedYears[i]
            const previousYear = sortedYears[i - 1]

            const currentRevenue = profit_loss.revenue_from_operations[currentYear]
            const previousRevenue = profit_loss.revenue_from_operations[previousYear]

            if (currentRevenue !== null && previousRevenue !== null) {
                const growthRate = ((currentRevenue - previousRevenue) / previousRevenue) * 100
                if (Math.abs(growthRate) > 500) {
                    errors.push(`Unusual revenue growth rate (${growthRate.toFixed(1)}%) between ${previousYear} and ${currentYear}`)
                }
            }
        }
    }

    return errors
}

// Helper functions for calculations
const calculateTotalAssets = (balanceSheet: any, year: string): number | null => {
    if (!balanceSheet?.assets) return null

    const nonCurrentAssets = Object.values(balanceSheet.assets.non_current_assets)
        .reduce((sum: number, item: any) => sum + (item[year] || 0), 0)

    const currentAssets = Object.values(balanceSheet.assets.current_assets)
        .reduce((sum: number, item: any) => sum + (item[year] || 0), 0)

    return nonCurrentAssets + currentAssets
}

const calculateTotalLiabilities = (balanceSheet: any, year: string): number | null => {
    if (!balanceSheet?.owners_funds_and_liabilities) return null

    const ownersFund = Object.values(balanceSheet.owners_funds_and_liabilities.owners_fund)
        .reduce((sum: number, item: any) => sum + (item[year] || 0), 0)

    const nonCurrentLiabilities = Object.values(balanceSheet.owners_funds_and_liabilities.non_current_liabilities)
        .reduce((sum: number, item: any) => sum + (item[year] || 0), 0)

    const currentLiabilities = Object.values(balanceSheet.owners_funds_and_liabilities.current_liabilities)
        .reduce((sum: number, item: any) => sum + (item[year] || 0), 0)

    return ownersFund + nonCurrentLiabilities + currentLiabilities
}

// Ratio calculation utilities
export const calculateFinancialRatios = (balanceSheet: any, profitLoss: any, financialYears: string[]) => {
    const ratios = {
        liquidity_ratios: {
            current_ratio: {} as Record<string, number>,
            quick_ratio: {} as Record<string, number>,
            cash_ratio: {} as Record<string, number>
        },
        leverage_ratios: {
            debt_equity_ratio: {} as Record<string, number>,
            debt_ratio: {} as Record<string, number>,
            interest_coverage_ratio: {} as Record<string, number>
        },
        efficiency_ratios: {
            inventory_turnover: {} as Record<string, number>,
            receivables_turnover: {} as Record<string, number>,
            payables_turnover: {} as Record<string, number>,
            asset_turnover: {} as Record<string, number>
        },
        profitability_ratios: {
            gross_profit_margin: {} as Record<string, number>,
            net_profit_margin: {} as Record<string, number>,
            return_on_assets: {} as Record<string, number>,
            return_on_equity: {} as Record<string, number>
        }
    }

    financialYears.forEach(year => {
        // Current Assets and Liabilities
        const currentAssets = Object.values(balanceSheet.assets.current_assets)
            .reduce((sum: number, item: any) => sum + (item[year] || 0), 0)

        const currentLiabilities = Object.values(balanceSheet.owners_funds_and_liabilities.current_liabilities)
            .reduce((sum: number, item: any) => sum + (item[year] || 0), 0)

        // Liquidity Ratios
        if (currentLiabilities > 0) {
            ratios.liquidity_ratios.current_ratio[year] = currentAssets / currentLiabilities

            const quickAssets = currentAssets - (balanceSheet.assets.current_assets.inventories[year] || 0)
            ratios.liquidity_ratios.quick_ratio[year] = quickAssets / currentLiabilities

            ratios.liquidity_ratios.cash_ratio[year] = (balanceSheet.assets.current_assets.cash_and_bank_balances[year] || 0) / currentLiabilities
        }

        // Profitability Ratios
        const revenue = profitLoss.revenue_from_operations[year] || 0
        const netProfit = profitLoss.profit_for_period[year] || 0
        const costOfMaterials = profitLoss.expenses.cost_of_materials_consumed[year] || 0

        if (revenue > 0) {
            const grossProfit = revenue - costOfMaterials
            ratios.profitability_ratios.gross_profit_margin[year] = (grossProfit / revenue) * 100
            ratios.profitability_ratios.net_profit_margin[year] = (netProfit / revenue) * 100
        }

        // Total Assets for other ratios
        const totalAssets = calculateTotalAssets(balanceSheet, year) || 0

        if (totalAssets > 0) {
            ratios.profitability_ratios.return_on_assets[year] = (netProfit / totalAssets) * 100
            ratios.efficiency_ratios.asset_turnover[year] = revenue / totalAssets
        }

        // Efficiency Ratios
        const inventory = balanceSheet.assets.current_assets.inventories[year] || 0
        const receivables = balanceSheet.assets.current_assets.trade_receivables[year] || 0
        const payables = balanceSheet.owners_funds_and_liabilities.current_liabilities.trade_payables[year] || 0

        if (inventory > 0) {
            ratios.efficiency_ratios.inventory_turnover[year] = costOfMaterials / inventory
        }

        if (receivables > 0) {
            ratios.efficiency_ratios.receivables_turnover[year] = revenue / receivables
        }

        if (payables > 0) {
            ratios.efficiency_ratios.payables_turnover[year] = costOfMaterials / payables
        }

        // Leverage Ratios
        const totalDebt = (balanceSheet.owners_funds_and_liabilities.non_current_liabilities.long_term_borrowings[year] || 0) +
            (balanceSheet.owners_funds_and_liabilities.current_liabilities.short_term_borrowings[year] || 0)

        const totalEquity = Object.values(balanceSheet.owners_funds_and_liabilities.owners_fund)
            .reduce((sum: number, item: any) => sum + (item[year] || 0), 0)

        if (totalEquity > 0) {
            ratios.leverage_ratios.debt_equity_ratio[year] = totalDebt / totalEquity
        }

        if (totalAssets > 0) {
            ratios.leverage_ratios.debt_ratio[year] = totalDebt / totalAssets
        }

        const interestExpense = profitLoss.expenses.finance_cost[year] || 0
        const ebit = (profitLoss.profit_before_tax[year] || 0) + interestExpense

        if (interestExpense > 0) {
            ratios.leverage_ratios.interest_coverage_ratio[year] = ebit / interestExpense
        }
    })

    return ratios
}

export type NonCorporateFinancialData = z.infer<typeof nonCorporateFinancialDataSchema>
export type PartialFinancialData = z.infer<typeof partialFinancialDataSchema>
export type ValidationError = z.infer<typeof validationErrorSchema>