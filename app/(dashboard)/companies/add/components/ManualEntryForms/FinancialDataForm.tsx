'use client'

import React, { useState, useEffect, JSX } from 'react'
import { Card, CardContent, CardHeader } from '@/components/ui/Card'
import { Alert } from '@/components/ui/Alert'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/Tabs'
import { Badge } from '@/components/ui/Badge'
import { EntityType, NonCorporateFinancialData, YearlyData, CalculatedRatios } from '@/types/manual-company.types'
import { Info, Calculator, FileText, Plus, Minus, AlertCircle, CheckCircle } from 'lucide-react'

interface FinancialDataFormProps {
    entityType: EntityType
    data: Partial<NonCorporateFinancialData>
    onChange: (data: Partial<NonCorporateFinancialData>) => void
}

export function FinancialDataForm({
    entityType,
    data = {},
    onChange
}: FinancialDataFormProps) {
    const [activeTab, setActiveTab] = useState('balance-sheet')
    const [financialYears, setFinancialYears] = useState<string[]>(data.financial_years || ['2023-24', '2022-23'])
    const [validationErrors, setValidationErrors] = useState<string[]>([])

    const isNonCorporate = !['private_limited', 'public_limited', 'llp'].includes(entityType)

    // Initialize default financial data structure
    const initializeFinancialData = (): Partial<NonCorporateFinancialData> => {
        const defaultYearlyData: YearlyData = {}
        financialYears.forEach(year => {
            defaultYearlyData[year] = null
        })

        return {
            format_version: 'non_corporate_2024',
            currency: 'INR',
            financial_years: financialYears,
            balance_sheet: {
                owners_funds_and_liabilities: {
                    owners_fund: {
                        owners_capital_account: { ...defaultYearlyData },
                        owners_current_account: { ...defaultYearlyData },
                        reserves_and_surplus: { ...defaultYearlyData }
                    },
                    non_current_liabilities: {
                        long_term_borrowings: { ...defaultYearlyData },
                        deferred_tax_liabilities: { ...defaultYearlyData },
                        other_long_term_liabilities: { ...defaultYearlyData },
                        long_term_provisions: { ...defaultYearlyData }
                    },
                    current_liabilities: {
                        short_term_borrowings: { ...defaultYearlyData },
                        trade_payables: { ...defaultYearlyData },
                        other_current_liabilities: { ...defaultYearlyData },
                        short_term_provisions: { ...defaultYearlyData }
                    }
                },
                assets: {
                    non_current_assets: {
                        property_plant_equipment: { ...defaultYearlyData },
                        intangible_assets: { ...defaultYearlyData },
                        capital_work_in_progress: { ...defaultYearlyData },
                        intangible_assets_under_development: { ...defaultYearlyData },
                        non_current_investments: { ...defaultYearlyData },
                        deferred_tax_assets: { ...defaultYearlyData },
                        long_term_loans_and_advances: { ...defaultYearlyData },
                        other_non_current_assets: { ...defaultYearlyData }
                    },
                    current_assets: {
                        current_investments: { ...defaultYearlyData },
                        inventories: { ...defaultYearlyData },
                        trade_receivables: { ...defaultYearlyData },
                        cash_and_bank_balances: { ...defaultYearlyData },
                        short_term_loans_and_advances: { ...defaultYearlyData },
                        other_current_assets: { ...defaultYearlyData }
                    }
                }
            },
            profit_loss: {
                revenue_from_operations: { ...defaultYearlyData },
                other_income: { ...defaultYearlyData },
                total_income: { ...defaultYearlyData },
                expenses: {
                    cost_of_materials_consumed: { ...defaultYearlyData },
                    purchases_of_stock_in_trade: { ...defaultYearlyData },
                    changes_in_inventories: { ...defaultYearlyData },
                    employee_benefits_expense: { ...defaultYearlyData },
                    depreciation_and_amortization: { ...defaultYearlyData },
                    finance_cost: { ...defaultYearlyData },
                    other_expenses: { ...defaultYearlyData },
                    total_expenses: { ...defaultYearlyData }
                },
                profit_before_exceptional_extraordinary_partners_remuneration_tax: { ...defaultYearlyData },
                exceptional_items: { ...defaultYearlyData },
                profit_before_extraordinary_partners_remuneration_tax: { ...defaultYearlyData },
                extraordinary_items: { ...defaultYearlyData },
                profit_before_partners_remuneration_tax: { ...defaultYearlyData },
                partners_remuneration: entityType.includes('partnership') ? { ...defaultYearlyData } : undefined,
                profit_before_tax: { ...defaultYearlyData },
                tax_expense: {
                    current_tax: { ...defaultYearlyData },
                    deferred_tax: { ...defaultYearlyData }
                },
                profit_from_continuing_operations: { ...defaultYearlyData },
                profit_for_period: { ...defaultYearlyData }
            },
            ratios: {
                liquidity_ratios: {
                    current_ratio: { ...defaultYearlyData },
                    quick_ratio: { ...defaultYearlyData },
                    cash_ratio: { ...defaultYearlyData }
                },
                leverage_ratios: {
                    debt_equity_ratio: { ...defaultYearlyData },
                    debt_ratio: { ...defaultYearlyData },
                    interest_coverage_ratio: { ...defaultYearlyData }
                },
                efficiency_ratios: {
                    inventory_turnover: { ...defaultYearlyData },
                    receivables_turnover: { ...defaultYearlyData },
                    payables_turnover: { ...defaultYearlyData },
                    asset_turnover: { ...defaultYearlyData }
                },
                profitability_ratios: {
                    gross_profit_margin: { ...defaultYearlyData },
                    net_profit_margin: { ...defaultYearlyData },
                    return_on_assets: { ...defaultYearlyData },
                    return_on_equity: { ...defaultYearlyData }
                }
            },
            validation_status: 'pending',
            validation_errors: []
        }
    }

    // Initialize data if empty
    useEffect(() => {
        if (!data.balance_sheet || !data.profit_loss) {
            const initialData = initializeFinancialData()
            onChange({ ...data, ...initialData })
        }
    }, [])

    const addFinancialYear = () => {
        const currentYear = new Date().getFullYear()
        const newYear = `${currentYear}-${(currentYear + 1).toString().slice(-2)}`
        if (!financialYears.includes(newYear)) {
            const updatedYears = [...financialYears, newYear].sort().reverse()
            setFinancialYears(updatedYears)

            // Update all yearly data with new year
            const updatedData = { ...data }
            updatedData.financial_years = updatedYears

            // Add new year to all yearly data fields
            const addYearToData = (obj: any) => {
                if (obj && typeof obj === 'object') {
                    Object.keys(obj).forEach(key => {
                        if (obj[key] && typeof obj[key] === 'object' && financialYears.every(year => year in obj[key])) {
                            obj[key][newYear] = null
                        } else if (obj[key] && typeof obj[key] === 'object') {
                            addYearToData(obj[key])
                        }
                    })
                }
            }

            addYearToData(updatedData)
            onChange(updatedData)
        }
    }

    const removeFinancialYear = (yearToRemove: string) => {
        if (financialYears.length > 1) {
            const updatedYears = financialYears.filter(year => year !== yearToRemove)
            setFinancialYears(updatedYears)

            const updatedData = { ...data }
            updatedData.financial_years = updatedYears

            // Remove year from all yearly data fields
            const removeYearFromData = (obj: any) => {
                if (obj && typeof obj === 'object') {
                    Object.keys(obj).forEach(key => {
                        if (obj[key] && typeof obj[key] === 'object' && yearToRemove in obj[key]) {
                            delete obj[key][yearToRemove]
                        } else if (obj[key] && typeof obj[key] === 'object') {
                            removeYearFromData(obj[key])
                        }
                    })
                }
            }

            removeYearFromData(updatedData)
            onChange(updatedData)
        }
    }

    const updateFieldValue = (path: string[], year: string, value: number | null) => {
        const updatedData = { ...data }
        let current = updatedData as any

        // Navigate to the field
        for (let i = 0; i < path.length - 1; i++) {
            if (!current[path[i]]) current[path[i]] = {}
            current = current[path[i]]
        }

        const fieldName = path[path.length - 1]
        if (!current[fieldName]) current[fieldName] = {}
        current[fieldName][year] = value

        onChange(updatedData)
        calculateRatios(updatedData)
    }

    const calculateRatios = (financialData: Partial<NonCorporateFinancialData>) => {
        if (!financialData.balance_sheet || !financialData.profit_loss) return

        const updatedData = { ...financialData }
        if (!updatedData.ratios) {
            updatedData.ratios = {
                liquidity_ratios: { current_ratio: {}, quick_ratio: {}, cash_ratio: {} },
                leverage_ratios: { debt_equity_ratio: {}, debt_ratio: {}, interest_coverage_ratio: {} },
                efficiency_ratios: { inventory_turnover: {}, receivables_turnover: {}, payables_turnover: {}, asset_turnover: {} },
                profitability_ratios: { gross_profit_margin: {}, net_profit_margin: {}, return_on_assets: {}, return_on_equity: {} }
            }
        }

        financialYears.forEach(year => {
            const bs = financialData.balance_sheet!
            const pl = financialData.profit_loss!

            // Current Assets and Liabilities
            const currentAssets = (bs.assets.current_assets.current_investments[year] || 0) +
                (bs.assets.current_assets.inventories[year] || 0) +
                (bs.assets.current_assets.trade_receivables[year] || 0) +
                (bs.assets.current_assets.cash_and_bank_balances[year] || 0) +
                (bs.assets.current_assets.short_term_loans_and_advances[year] || 0) +
                (bs.assets.current_assets.other_current_assets[year] || 0)

            const currentLiabilities = (bs.owners_funds_and_liabilities.current_liabilities.short_term_borrowings[year] || 0) +
                (bs.owners_funds_and_liabilities.current_liabilities.trade_payables[year] || 0) +
                (bs.owners_funds_and_liabilities.current_liabilities.other_current_liabilities[year] || 0) +
                (bs.owners_funds_and_liabilities.current_liabilities.short_term_provisions[year] || 0)

            // Liquidity Ratios
            if (currentLiabilities !== 0) {
                updatedData.ratios!.liquidity_ratios.current_ratio[year] = currentAssets / currentLiabilities

                const quickAssets = currentAssets - (bs.assets.current_assets.inventories[year] || 0)
                updatedData.ratios!.liquidity_ratios.quick_ratio[year] = quickAssets / currentLiabilities

                updatedData.ratios!.liquidity_ratios.cash_ratio[year] = (bs.assets.current_assets.cash_and_bank_balances[year] || 0) / currentLiabilities
            }

            // Profitability Ratios
            const revenue = pl.revenue_from_operations[year] || 0
            const netProfit = pl.profit_for_period[year] || 0

            if (revenue !== 0) {
                updatedData.ratios!.profitability_ratios.net_profit_margin[year] = (netProfit / revenue) * 100

                const grossProfit = revenue - (pl.expenses.cost_of_materials_consumed[year] || 0)
                updatedData.ratios!.profitability_ratios.gross_profit_margin[year] = (grossProfit / revenue) * 100
            }

            // Total Assets for other ratios
            const totalAssets = currentAssets +
                (bs.assets.non_current_assets.property_plant_equipment[year] || 0) +
                (bs.assets.non_current_assets.intangible_assets[year] || 0) +
                (bs.assets.non_current_assets.non_current_investments[year] || 0) +
                (bs.assets.non_current_assets.long_term_loans_and_advances[year] || 0) +
                (bs.assets.non_current_assets.other_non_current_assets[year] || 0)

            if (totalAssets !== 0) {
                updatedData.ratios!.profitability_ratios.return_on_assets[year] = (netProfit / totalAssets) * 100
                updatedData.ratios!.efficiency_ratios.asset_turnover[year] = revenue / totalAssets
            }
        })

        onChange(updatedData)
    }

    const validateFinancialData = () => {
        const errors: string[] = []

        if (!data.balance_sheet || !data.profit_loss) {
            errors.push('Balance Sheet and Profit & Loss data are required')
            setValidationErrors(errors)
            return false
        }

        // Check if at least one year has data
        const hasData = financialYears.some(year => {
            const revenue = data.profit_loss?.revenue_from_operations[year]
            return revenue !== null && revenue !== undefined && revenue > 0
        })

        if (!hasData) {
            errors.push('At least one financial year must have revenue data')
        }

        setValidationErrors(errors)
        return errors.length === 0
    }

    const renderYearlyInput = (
        label: string,
        path: string[],
        required: boolean = false,
        helpText?: string
    ) => (
        <div className="space-y-2">
            <div className="flex items-center gap-2">
                <label className="text-sm font-medium text-neutral-700">
                    {label}
                    {required && <span className="text-red-500 ml-1">*</span>}
                </label>
                {helpText && (
                    <div className="group relative">
                        <Info className="w-4 h-4 text-neutral-400 cursor-help" />
                        <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-2 py-1 bg-neutral-800 text-white text-xs rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap z-10">
                            {helpText}
                        </div>
                    </div>
                )}
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                {financialYears.map(year => (
                    <div key={year} className="space-y-1">
                        <label className="text-xs text-neutral-500">{year}</label>
                        <Input
                            type="number"
                            placeholder="0"
                            value={getNestedValue(data, [...path, year]) || ''}
                            onChange={(e) => {
                                const value = e.target.value === '' ? null : parseFloat(e.target.value)
                                updateFieldValue(path, year, value)
                            }}
                            className="text-sm"
                        />
                    </div>
                ))}
            </div>
        </div>
    )

    const getNestedValue = (obj: any, path: string[]): any => {
        return path.reduce((current, key) => current?.[key], obj)
    }

    const getFinancialTitle = () => {
        if (isNonCorporate) {
            return 'Non-Corporate Financial Information'
        }
        return 'Corporate Financial Statements'
    }

    const getFinancialDescription = () => {
        if (isNonCorporate) {
            return 'Enter financial information following the new non-corporate format (FY 2024-25) as per ICAI guidelines.'
        }
        return 'Enter balance sheet, profit & loss, cash flow statements following corporate accounting standards.'
    }

    return (
        <div className="space-y-6">
            <Alert variant="info">
                <Info className="w-4 h-4" />
                <div>
                    <p className="font-medium">{getFinancialTitle()}</p>
                    <p className="text-sm mt-1">{getFinancialDescription()}</p>
                </div>
            </Alert>

            {validationErrors.length > 0 && (
                <Alert variant="error">
                    <AlertCircle className="w-4 h-4" />
                    <div>
                        <p className="font-medium">Validation Errors</p>
                        <ul className="text-sm mt-1 space-y-1">
                            {validationErrors.map((error, index) => (
                                <li key={index}>• {error}</li>
                            ))}
                        </ul>
                    </div>
                </Alert>
            )}

            {/* Financial Years Management */}
            <Card>
                <CardHeader>
                    <div className="flex items-center justify-between">
                        <h3 className="text-lg font-semibold text-neutral-900">Financial Years</h3>
                        <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={addFinancialYear}
                        >
                            <Plus className="w-4 h-4 mr-2" />
                            Add Year
                        </Button>
                    </div>
                </CardHeader>
                <CardContent>
                    <div className="flex flex-wrap gap-2">
                        {financialYears.map(year => (
                            <Badge key={year} variant="secondary" className="flex items-center gap-2">
                                {year}
                                {financialYears.length > 1 && (
                                    <button
                                        type="button"
                                        onClick={() => removeFinancialYear(year)}
                                        className="ml-1 hover:text-red-600"
                                    >
                                        <Minus className="w-3 h-3" />
                                    </button>
                                )}
                            </Badge>
                        ))}
                    </div>
                </CardContent>
            </Card>

            {/* Financial Data Tabs */}
            <Tabs value={activeTab} onValueChange={setActiveTab}>
                <TabsList className="grid w-full grid-cols-4">
                    <TabsTrigger value="balance-sheet">Balance Sheet</TabsTrigger>
                    <TabsTrigger value="profit-loss">Profit & Loss</TabsTrigger>
                    <TabsTrigger value="ratios">Ratios</TabsTrigger>
                    <TabsTrigger value="validation">Validation</TabsTrigger>
                </TabsList>

                <TabsContent value="balance-sheet" className="space-y-6">
                    <VerticalBalanceSheetForm
                        data={data.balance_sheet}
                        financialYears={financialYears}
                        onUpdate={updateFieldValue}
                        renderYearlyInput={renderYearlyInput}
                    />
                </TabsContent>

                <TabsContent value="profit-loss" className="space-y-6">
                    <ProfitLossForm
                        data={data.profit_loss}
                        entityType={entityType}
                        financialYears={financialYears}
                        onUpdate={updateFieldValue}
                        renderYearlyInput={renderYearlyInput}
                    />
                </TabsContent>

                <TabsContent value="ratios" className="space-y-6">
                    <RatiosDisplay
                        ratios={data.ratios}
                        financialYears={financialYears}
                        onRecalculate={() => calculateRatios(data)}
                    />
                </TabsContent>

                <TabsContent value="validation" className="space-y-6">
                    <ValidationSummary
                        data={data}
                        onValidate={validateFinancialData}
                        validationErrors={validationErrors}
                    />
                </TabsContent>
            </Tabs>
        </div>
    )
}

// Vertical Balance Sheet Component
function VerticalBalanceSheetForm({
    data,
    financialYears,
    onUpdate,
    renderYearlyInput
}: {
    data: any
    financialYears: string[]
    onUpdate: (path: string[], year: string, value: number | null) => void
    renderYearlyInput: (label: string, path: string[], required?: boolean, helpText?: string) => JSX.Element
}) {
    return (
        <div className="space-y-8">
            {/* Owner's Funds and Liabilities */}
            <Card>
                <CardHeader>
                    <h3 className="text-lg font-semibold text-neutral-900">Owner's Funds and Liabilities</h3>
                </CardHeader>
                <CardContent className="space-y-6">
                    {/* Owner's Fund */}
                    <div>
                        <h4 className="font-medium text-neutral-800 mb-4">Owner's Fund</h4>
                        <div className="space-y-4 pl-4">
                            {renderYearlyInput(
                                "Owner's Capital Account",
                                ['balance_sheet', 'owners_funds_and_liabilities', 'owners_fund', 'owners_capital_account'],
                                true,
                                "Capital contributed by owners/partners"
                            )}
                            {renderYearlyInput(
                                "Owner's Current Account",
                                ['balance_sheet', 'owners_funds_and_liabilities', 'owners_fund', 'owners_current_account'],
                                false,
                                "Current account balance of owners/partners"
                            )}
                            {renderYearlyInput(
                                "Reserves and Surplus",
                                ['balance_sheet', 'owners_funds_and_liabilities', 'owners_fund', 'reserves_and_surplus'],
                                false,
                                "Accumulated profits and reserves"
                            )}
                        </div>
                    </div>

                    {/* Non-Current Liabilities */}
                    <div>
                        <h4 className="font-medium text-neutral-800 mb-4">Non-Current Liabilities</h4>
                        <div className="space-y-4 pl-4">
                            {renderYearlyInput(
                                "Long-term Borrowings",
                                ['balance_sheet', 'owners_funds_and_liabilities', 'non_current_liabilities', 'long_term_borrowings'],
                                false,
                                "Loans and borrowings with maturity > 1 year"
                            )}
                            {renderYearlyInput(
                                "Deferred Tax Liabilities",
                                ['balance_sheet', 'owners_funds_and_liabilities', 'non_current_liabilities', 'deferred_tax_liabilities']
                            )}
                            {renderYearlyInput(
                                "Other Long-term Liabilities",
                                ['balance_sheet', 'owners_funds_and_liabilities', 'non_current_liabilities', 'other_long_term_liabilities']
                            )}
                            {renderYearlyInput(
                                "Long-term Provisions",
                                ['balance_sheet', 'owners_funds_and_liabilities', 'non_current_liabilities', 'long_term_provisions']
                            )}
                        </div>
                    </div>

                    {/* Current Liabilities */}
                    <div>
                        <h4 className="font-medium text-neutral-800 mb-4">Current Liabilities</h4>
                        <div className="space-y-4 pl-4">
                            {renderYearlyInput(
                                "Short-term Borrowings",
                                ['balance_sheet', 'owners_funds_and_liabilities', 'current_liabilities', 'short_term_borrowings'],
                                false,
                                "Loans and borrowings with maturity ≤ 1 year"
                            )}
                            {renderYearlyInput(
                                "Trade Payables",
                                ['balance_sheet', 'owners_funds_and_liabilities', 'current_liabilities', 'trade_payables'],
                                false,
                                "Amount owed to suppliers and creditors"
                            )}
                            {renderYearlyInput(
                                "Other Current Liabilities",
                                ['balance_sheet', 'owners_funds_and_liabilities', 'current_liabilities', 'other_current_liabilities']
                            )}
                            {renderYearlyInput(
                                "Short-term Provisions",
                                ['balance_sheet', 'owners_funds_and_liabilities', 'current_liabilities', 'short_term_provisions']
                            )}
                        </div>
                    </div>
                </CardContent>
            </Card>

            {/* Assets */}
            <Card>
                <CardHeader>
                    <div>Assets</div>
                </CardHeader>
                <CardContent className="space-y-6">
                    {/* Non-Current Assets */}
                    <div>
                        <h4 className="font-medium text-neutral-800 mb-4">Non-Current Assets</h4>
                        <div className="space-y-4 pl-4">
                            {renderYearlyInput(
                                "Property, Plant & Equipment",
                                ['balance_sheet', 'assets', 'non_current_assets', 'property_plant_equipment'],
                                false,
                                "Fixed assets net of depreciation"
                            )}
                            {renderYearlyInput(
                                "Intangible Assets",
                                ['balance_sheet', 'assets', 'non_current_assets', 'intangible_assets']
                            )}
                            {renderYearlyInput(
                                "Capital Work in Progress",
                                ['balance_sheet', 'assets', 'non_current_assets', 'capital_work_in_progress']
                            )}
                            {renderYearlyInput(
                                "Non-current Investments",
                                ['balance_sheet', 'assets', 'non_current_assets', 'non_current_investments']
                            )}
                            {renderYearlyInput(
                                "Deferred Tax Assets",
                                ['balance_sheet', 'assets', 'non_current_assets', 'deferred_tax_assets']
                            )}
                            {renderYearlyInput(
                                "Long-term Loans and Advances",
                                ['balance_sheet', 'assets', 'non_current_assets', 'long_term_loans_and_advances']
                            )}
                            {renderYearlyInput(
                                "Other Non-current Assets",
                                ['balance_sheet', 'assets', 'non_current_assets', 'other_non_current_assets']
                            )}
                        </div>
                    </div>

                    {/* Current Assets */}
                    <div>
                        <h4 className="font-medium text-neutral-800 mb-4">Current Assets</h4>
                        <div className="space-y-4 pl-4">
                            {renderYearlyInput(
                                "Current Investments",
                                ['balance_sheet', 'assets', 'current_assets', 'current_investments']
                            )}
                            {renderYearlyInput(
                                "Inventories",
                                ['balance_sheet', 'assets', 'current_assets', 'inventories'],
                                false,
                                "Stock of raw materials, WIP, and finished goods"
                            )}
                            {renderYearlyInput(
                                "Trade Receivables",
                                ['balance_sheet', 'assets', 'current_assets', 'trade_receivables'],
                                false,
                                "Amount receivable from customers"
                            )}
                            {renderYearlyInput(
                                "Cash and Bank Balances",
                                ['balance_sheet', 'assets', 'current_assets', 'cash_and_bank_balances'],
                                true,
                                "Cash in hand and bank balances"
                            )}
                            {renderYearlyInput(
                                "Short-term Loans and Advances",
                                ['balance_sheet', 'assets', 'current_assets', 'short_term_loans_and_advances']
                            )}
                            {renderYearlyInput(
                                "Other Current Assets",
                                ['balance_sheet', 'assets', 'current_assets', 'other_current_assets']
                            )}
                        </div>
                    </div>
                </CardContent>
            </Card>
        </div>
    )
}

// Profit & Loss Form Component
function ProfitLossForm({
    data,
    entityType,
    financialYears,
    onUpdate,
    renderYearlyInput
}: {
    data: any
    entityType: EntityType
    financialYears: string[]
    onUpdate: (path: string[], year: string, value: number | null) => void
    renderYearlyInput: (label: string, path: string[], required?: boolean, helpText?: string) => JSX.Element
}) {
    const isPartnership = entityType.includes('partnership')

    return (
        <div className="space-y-8">
            {/* Income */}
            <Card>
                <CardHeader>
                    <div>Income</div>
                </CardHeader>
                <CardContent className="space-y-4">
                    {renderYearlyInput(
                        "Revenue from Operations",
                        ['profit_loss', 'revenue_from_operations'],
                        true,
                        "Primary business revenue"
                    )}
                    {renderYearlyInput(
                        "Other Income",
                        ['profit_loss', 'other_income'],
                        false,
                        "Interest, dividends, and other non-operating income"
                    )}
                    {renderYearlyInput(
                        "Total Income",
                        ['profit_loss', 'total_income'],
                        false,
                        "Sum of revenue from operations and other income"
                    )}
                </CardContent>
            </Card>

            {/* Expenses */}
            <Card>
                <CardHeader>
                    <div>Expenses</div>
                </CardHeader>
                <CardContent className="space-y-4">
                    {renderYearlyInput(
                        "Cost of Materials Consumed",
                        ['profit_loss', 'expenses', 'cost_of_materials_consumed'],
                        false,
                        "Direct material costs"
                    )}
                    {renderYearlyInput(
                        "Purchases of Stock-in-Trade",
                        ['profit_loss', 'expenses', 'purchases_of_stock_in_trade']
                    )}
                    {renderYearlyInput(
                        "Changes in Inventories",
                        ['profit_loss', 'expenses', 'changes_in_inventories'],
                        false,
                        "Increase/decrease in stock levels"
                    )}
                    {renderYearlyInput(
                        "Employee Benefits Expense",
                        ['profit_loss', 'expenses', 'employee_benefits_expense'],
                        false,
                        "Salaries, wages, and benefits"
                    )}
                    {renderYearlyInput(
                        "Depreciation and Amortization",
                        ['profit_loss', 'expenses', 'depreciation_and_amortization']
                    )}
                    {renderYearlyInput(
                        "Finance Cost",
                        ['profit_loss', 'expenses', 'finance_cost'],
                        false,
                        "Interest and other borrowing costs"
                    )}
                    {renderYearlyInput(
                        "Other Expenses",
                        ['profit_loss', 'expenses', 'other_expenses'],
                        false,
                        "Administrative and other operating expenses"
                    )}
                    {renderYearlyInput(
                        "Total Expenses",
                        ['profit_loss', 'expenses', 'total_expenses']
                    )}
                </CardContent>
            </Card>

            {/* Profit Calculations */}
            <Card>
                <CardHeader>
                    <div className="text-lg font-semibold text-neutral-900">Profit Calculations</div>
                </CardHeader>
                <CardContent className="space-y-4">
                    {renderYearlyInput(
                        "Profit Before Exceptional & Extraordinary Items",
                        ['profit_loss', 'profit_before_exceptional_extraordinary_partners_remuneration_tax']
                    )}
                    {renderYearlyInput(
                        "Exceptional Items",
                        ['profit_loss', 'exceptional_items'],
                        false,
                        "Unusual but related to business operations"
                    )}
                    {renderYearlyInput(
                        "Extraordinary Items",
                        ['profit_loss', 'extraordinary_items'],
                        false,
                        "Unusual and unrelated to normal business"
                    )}
                    {renderYearlyInput(
                        "Profit Before Partners' Remuneration & Tax",
                        ['profit_loss', 'profit_before_partners_remuneration_tax']
                    )}

                    {isPartnership && renderYearlyInput(
                        "Partners' Remuneration",
                        ['profit_loss', 'partners_remuneration'],
                        false,
                        "Salary and commission paid to partners"
                    )}

                    {renderYearlyInput(
                        "Profit Before Tax",
                        ['profit_loss', 'profit_before_tax']
                    )}
                </CardContent>
            </Card>

            {/* Tax and Final Profit */}
            <Card>
                <CardHeader>
                    <h3 className="text-lg font-semibold text-neutral-900">Tax and Final Profit</h3>
                </CardHeader>
                <CardContent className="space-y-4">
                    {renderYearlyInput(
                        "Current Tax",
                        ['profit_loss', 'tax_expense', 'current_tax']
                    )}
                    {renderYearlyInput(
                        "Deferred Tax",
                        ['profit_loss', 'tax_expense', 'deferred_tax']
                    )}
                    {renderYearlyInput(
                        "Profit for the Period",
                        ['profit_loss', 'profit_for_period'],
                        false,
                        "Final profit after all expenses and taxes"
                    )}
                </CardContent>
            </Card>
        </div>
    )
}

// Ratios Display Component
function RatiosDisplay({
    ratios,
    financialYears,
    onRecalculate
}: {
    ratios: CalculatedRatios | undefined
    financialYears: string[]
    onRecalculate: () => void
}) {
    if (!ratios) {
        return (
            <Card>
                <CardContent className="p-8 text-center">
                    <Calculator className="w-12 h-12 text-neutral-400 mx-auto mb-4" />
                    <p className="text-neutral-600 mb-4">No ratios calculated yet</p>
                    <Button onClick={onRecalculate}>
                        <Calculator className="w-4 h-4 mr-2" />
                        Calculate Ratios
                    </Button>
                </CardContent>
            </Card>
        )
    }

    const formatRatio = (value: number | null | undefined): string => {
        if (value === null || value === undefined) return '-'
        return value.toFixed(2)
    }

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <h3 className="text-lg font-medium">Financial Ratios</h3>
                <Button variant="outline" onClick={onRecalculate}>
                    <Calculator className="w-4 h-4 mr-2" />
                    Recalculate
                </Button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Liquidity Ratios */}
                <Card>
                    <CardHeader>
                        <h4 className="text-base font-semibold text-neutral-900">Liquidity Ratios</h4>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-3">
                            {['Current Ratio', 'Quick Ratio', 'Cash Ratio'].map((label, index) => {
                                const key = ['current_ratio', 'quick_ratio', 'cash_ratio'][index] as keyof typeof ratios.liquidity_ratios
                                return (
                                    <div key={label} className="flex justify-between items-center">
                                        <span className="text-sm text-neutral-600">{label}</span>
                                        <div className="flex gap-2">
                                            {financialYears.map(year => (
                                                <Badge key={year} variant="outline" className="text-xs">
                                                    {year}: {formatRatio(ratios.liquidity_ratios[key][year])}
                                                </Badge>
                                            ))}
                                        </div>
                                    </div>
                                )
                            })}
                        </div>
                    </CardContent>
                </Card>

                {/* Profitability Ratios */}
                <Card>
                    <CardHeader>
                        <div className="text-base">Profitability Ratios</div>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-3">
                            {['Gross Profit Margin (%)', 'Net Profit Margin (%)', 'Return on Assets (%)', 'Return on Equity (%)'].map((label, index) => {
                                const key = ['gross_profit_margin', 'net_profit_margin', 'return_on_assets', 'return_on_equity'][index] as keyof typeof ratios.profitability_ratios
                                return (
                                    <div key={label} className="flex justify-between items-center">
                                        <span className="text-sm text-neutral-600">{label}</span>
                                        <div className="flex gap-2">
                                            {financialYears.map(year => (
                                                <Badge key={year} variant="outline" className="text-xs">
                                                    {year}: {formatRatio(ratios.profitability_ratios[key][year])}
                                                </Badge>
                                            ))}
                                        </div>
                                    </div>
                                )
                            })}
                        </div>
                    </CardContent>
                </Card>

                {/* Leverage Ratios */}
                <Card>
                    <CardHeader>
                        <div className="text-base">Leverage Ratios</div>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-3">
                            {['Debt-Equity Ratio', 'Debt Ratio', 'Interest Coverage Ratio'].map((label, index) => {
                                const key = ['debt_equity_ratio', 'debt_ratio', 'interest_coverage_ratio'][index] as keyof typeof ratios.leverage_ratios
                                return (
                                    <div key={label} className="flex justify-between items-center">
                                        <span className="text-sm text-neutral-600">{label}</span>
                                        <div className="flex gap-2">
                                            {financialYears.map(year => (
                                                <Badge key={year} variant="outline" className="text-xs">
                                                    {year}: {formatRatio(ratios.leverage_ratios[key][year])}
                                                </Badge>
                                            ))}
                                        </div>
                                    </div>
                                )
                            })}
                        </div>
                    </CardContent>
                </Card>

                {/* Efficiency Ratios */}
                <Card>
                    <CardHeader>
                        <div className="text-base">Efficiency Ratios</div>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-3">
                            {['Inventory Turnover', 'Receivables Turnover', 'Payables Turnover', 'Asset Turnover'].map((label, index) => {
                                const key = ['inventory_turnover', 'receivables_turnover', 'payables_turnover', 'asset_turnover'][index] as keyof typeof ratios.efficiency_ratios
                                return (
                                    <div key={label} className="flex justify-between items-center">
                                        <span className="text-sm text-neutral-600">{label}</span>
                                        <div className="flex gap-2">
                                            {financialYears.map(year => (
                                                <Badge key={year} variant="outline" className="text-xs">
                                                    {year}: {formatRatio(ratios.efficiency_ratios[key][year])}
                                                </Badge>
                                            ))}
                                        </div>
                                    </div>
                                )
                            })}
                        </div>
                    </CardContent>
                </Card>
            </div>
        </div>
    )
}

// Validation Summary Component
function ValidationSummary({
    data,
    onValidate,
    validationErrors
}: {
    data: Partial<NonCorporateFinancialData>
    onValidate: () => boolean
    validationErrors: string[]
}) {
    const [isValidating, setIsValidating] = useState(false)
    const [lastValidation, setLastValidation] = useState<Date | null>(null)

    const handleValidate = async () => {
        setIsValidating(true)
        await new Promise(resolve => setTimeout(resolve, 1000)) // Simulate validation
        const isValid = onValidate()
        setLastValidation(new Date())
        setIsValidating(false)
        return isValid
    }

    const getCompletionPercentage = () => {
        if (!data.balance_sheet || !data.profit_loss) return 0

        let totalFields = 0
        let filledFields = 0

        const countFields = (obj: any) => {
            if (obj && typeof obj === 'object') {
                Object.values(obj).forEach(value => {
                    if (value && typeof value === 'object' && data.financial_years?.every(year => year in (value as any))) {
                        totalFields++
                        const hasData = data.financial_years?.some(year => (value as any)[year] !== null && (value as any)[year] !== undefined)
                        if (hasData) filledFields++
                    } else if (value && typeof value === 'object') {
                        countFields(value)
                    }
                })
            }
        }

        countFields(data.balance_sheet)
        countFields(data.profit_loss)

        return totalFields > 0 ? Math.round((filledFields / totalFields) * 100) : 0
    }

    const completionPercentage = getCompletionPercentage()

    return (
        <div className="space-y-6">
            <Card>
                <CardHeader>
                    <div className="flex items-center justify-between">
                        <span>Data Validation</span>
                        <Button
                            onClick={handleValidate}
                            disabled={isValidating}
                            variant={validationErrors.length === 0 ? "info" : "error"}
                        >
                            {isValidating ? (
                                <>Validating...</>
                            ) : (
                                <>
                                    {validationErrors.length === 0 ? <CheckCircle className="w-4 h-4 mr-2" /> : <AlertCircle className="w-4 h-4 mr-2" />}
                                    Validate Data
                                </>
                            )}
                        </Button>
                    </div>
                </CardHeader>
                <CardContent className="space-y-4">
                    {/* Completion Status */}
                    <div>
                        <div className="flex justify-between items-center mb-2">
                            <span className="text-sm font-medium">Data Completion</span>
                            <span className="text-sm text-neutral-600">{completionPercentage}%</span>
                        </div>
                        <div className="w-full bg-neutral-200 rounded-full h-2">
                            <div
                                className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                                style={{ width: `${completionPercentage}%` }}
                            />
                        </div>
                    </div>

                    {/* Last Validation */}
                    {lastValidation && (
                        <div className="text-sm text-neutral-600">
                            Last validated: {lastValidation.toLocaleString()}
                        </div>
                    )}

                    {/* Validation Results */}
                    {validationErrors.length === 0 ? (
                        <Alert variant="success">
                            <CheckCircle className="w-4 h-4" />
                            <div>
                                <p className="font-medium">Validation Passed</p>
                                <p className="text-sm">All required financial data is present and valid.</p>
                            </div>
                        </Alert>
                    ) : (
                        <Alert variant="error">
                            <AlertCircle className="w-4 h-4" />
                            <div>
                                <p className="font-medium">Validation Issues Found</p>
                                <ul className="text-sm mt-2 space-y-1">
                                    {validationErrors.map((error, index) => (
                                        <li key={index}>• {error}</li>
                                    ))}
                                </ul>
                            </div>
                        </Alert>
                    )}

                    {/* Data Quality Indicators */}
                    <div className="grid grid-cols-2 gap-4 pt-4 border-t">
                        <div className="text-center">
                            <div className="text-2xl font-bold text-blue-600">{data.financial_years?.length || 0}</div>
                            <div className="text-sm text-neutral-600">Financial Years</div>
                        </div>
                        <div className="text-center">
                            <div className="text-2xl font-bold text-green-600">
                                {data.ratios ? Object.keys(data.ratios).length : 0}
                            </div>
                            <div className="text-sm text-neutral-600">Ratio Categories</div>
                        </div>
                    </div>
                </CardContent>
            </Card>

            {/* Format Information */}
            <Card>
                <CardHeader>
                    <div className="text-base">Format Information</div>
                </CardHeader>
                <CardContent>
                    <div className="space-y-2 text-sm">
                        <div className="flex justify-between">
                            <span>Format Version:</span>
                            <Badge variant="outline">{data.format_version || 'non_corporate_2024'}</Badge>
                        </div>
                        <div className="flex justify-between">
                            <span>Currency:</span>
                            <Badge variant="outline">{data.currency || 'INR'}</Badge>
                        </div>
                        <div className="flex justify-between">
                            <span>Validation Status:</span>
                            <Badge variant={data.validation_status === 'validated' ? 'default' : 'secondary'}>
                                {data.validation_status || 'pending'}
                            </Badge>
                        </div>
                    </div>
                </CardContent>
            </Card>
        </div>
    )
}