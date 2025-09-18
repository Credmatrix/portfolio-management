'use client'

import { PortfolioCompany } from '@/types/portfolio.types'
import { Card, CardContent, CardHeader } from '@/components/ui/Card'
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/Tabs'
import { BarChart3, AlertTriangle, TrendingUp, PieChart, Calculator, DollarSign, Activity, Clock } from 'lucide-react'

// Import financial analysis components
import { FinancialHighlights } from './financial/FinancialHighlights'
import { BalanceSheetChart } from './financial/BalanceSheetChart'
import { ProfitLossChart } from './financial/ProfitLossChart'
import { RatiosAnalysis } from './financial/RatiosAnalysis'
import { CashFlowAnalysis } from './financial/CashFlowAnalysis'
import { MSMESupplierPaymentDelays } from './financial/MSMESupplierPaymentDelays'



interface FinancialDataSectionProps {
    company: PortfolioCompany
    industryBenchmarks?: any
}

export function FinancialDataSection({ company, industryBenchmarks }: FinancialDataSectionProps) {
    const financialData = company.extracted_data["Standalone Financial Data"]

    if (!financialData) {
        return (
            <Card>
                <CardHeader>
                    <h2 className="text-xl font-semibold text-neutral-90 flex items-center gap-2">
                        <BarChart3 className="w-5 h-5" />
                        Financial Analysis
                    </h2>
                </CardHeader>
                <CardContent>
                    <div className="text-center py-8 text-neutral-60">
                        <AlertTriangle className="w-12 h-12 mx-auto mb-4 text-neutral-40" />
                        <p>Financial data not available</p>
                    </div>
                </CardContent>
            </Card>
        )
    }

    const years = financialData.years || []



    return (
        <Card>
            <CardHeader>
                <h2 className="text-xl font-semibold text-neutral-90 flex items-center gap-2">
                    <BarChart3 className="w-5 h-5" />
                    Financial Analysis
                </h2>
            </CardHeader>
            <CardContent>
                <Tabs defaultValue="highlights" className="w-full">
                    <TabsList className="grid w-full grid-cols-6">
                        <TabsTrigger value="highlights" className="flex items-center gap-2">
                            <TrendingUp className="w-4 h-4" />
                            Highlights
                        </TabsTrigger>
                        <TabsTrigger value="balance-sheet" className="flex items-center gap-2">
                            <PieChart className="w-4 h-4" />
                            Balance Sheet
                        </TabsTrigger>
                        <TabsTrigger value="profit-loss" className="flex items-center gap-2">
                            <DollarSign className="w-4 h-4" />
                            Profit & Loss
                        </TabsTrigger>
                        <TabsTrigger value="cash-flow" className="flex items-center gap-2">
                            <Activity className="w-4 h-4" />
                            Cash Flow
                        </TabsTrigger>
                        <TabsTrigger value="ratios" className="flex items-center gap-2">
                            <Calculator className="w-4 h-4" />
                            Financial Ratios
                        </TabsTrigger>
                        <TabsTrigger value="msme" className="flex items-center gap-2">
                            <Clock className='w-4 h-4' />
                            MSME Delays
                        </TabsTrigger>
                    </TabsList>

                    <TabsContent value="highlights" className="mt-6">
                        <FinancialHighlights company={company} />
                    </TabsContent>

                    <TabsContent value="balance-sheet" className="mt-6">
                        <BalanceSheetChart
                            company={company}
                            industryBenchmarks={industryBenchmarks}
                        />
                    </TabsContent>

                    <TabsContent value="profit-loss" className="mt-6">
                        <ProfitLossChart
                            company={company}
                            industryBenchmarks={industryBenchmarks}
                        />
                    </TabsContent>

                    <TabsContent value="ratios" className="mt-6">
                        <RatiosAnalysis
                            company={company}
                            industryBenchmarks={industryBenchmarks}
                        />
                    </TabsContent>

                    <TabsContent value="cash-flow" className="mt-6">
                        <CashFlowAnalysis
                            company={company}
                            industryBenchmarks={industryBenchmarks}
                        />
                    </TabsContent>
                    <TabsContent value="msme" className="mt-6">
                        <MSMESupplierPaymentDelays company={company} />
                    </TabsContent>
                </Tabs>
            </CardContent>
        </Card>
    )
}
