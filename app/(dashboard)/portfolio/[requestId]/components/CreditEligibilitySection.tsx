'use client'

import { PortfolioCompany } from '@/types/portfolio.types'
import { Card, CardContent, CardHeader } from '@/components/ui/Card'
import { Badge } from '@/components/ui/Badge'
import { Progress } from '@/components/ui/Progress'
import {
    CreditCard,
    TrendingUp,
    Calculator,
    AlertTriangle,
    CheckCircle,
    IndianRupee,
    Percent
} from 'lucide-react'
import { formatCurrency } from '@/lib/utils'

interface CreditEligibilitySectionProps {
    company: PortfolioCompany
}

export function CreditEligibilitySection({ company }: CreditEligibilitySectionProps) {
    const eligibility = company.risk_analysis?.eligibility

    if (!eligibility) {
        return (
            <Card>
                <CardHeader>
                    <h3 className="text-lg font-semibold text-neutral-90 flex items-center gap-2">
                        <CreditCard className="w-5 h-5" />
                        Credit Eligibility
                    </h3>
                </CardHeader>
                <CardContent>
                    <div className="text-center py-6 text-neutral-60">
                        <AlertTriangle className="w-8 h-8 mx-auto mb-3 text-neutral-40" />
                        <p className="text-sm">Eligibility data not available</p>
                    </div>
                </CardContent>
            </Card>
        )
    }

    const eligibilityPercentage = eligibility.baseEligibility > 0
        ? eligibility.finalEligibility / (eligibility.riskMultiplier * eligibility.baseEligibility) * 100
        : 0

    const getRiskMultiplierBadge = (multiplier: number) => {
        if (multiplier >= 1.0) return { variant: 'success' as const, label: 'Favorable' }
        if (multiplier >= 0.8) return { variant: 'warning' as const, label: 'Moderate' }
        return { variant: 'error' as const, label: 'High Risk' }
    }

    const multiplierBadge = getRiskMultiplierBadge(eligibility.riskMultiplier)

    return (
        <Card>
            <CardHeader>
                <h3 className="text-lg font-semibold text-neutral-90 flex items-center gap-2">
                    <CreditCard className="w-5 h-5" />
                    Credit Eligibility
                </h3>
            </CardHeader>

            <CardContent className="space-y-4">
                {/* Final Eligibility Amount */}
                <div className="text-center p-4 bg-gradient-to-r from-green-50 to-emerald-50 rounded-lg">
                    <div className="text-2xl font-bold text-green-700 mb-1">
                        ₹{eligibility.finalEligibility.toFixed(2)} Cr
                    </div>
                    <div className="text-sm text-neutral-60">Final Credit Limit</div>
                    <div className="text-xs text-neutral-50 mt-1">
                        Risk Adjusted Amount
                    </div>
                </div>

                {/* Eligibility Calculation Breakdown */}
                <div className="space-y-3">
                    <h4 className="font-medium text-neutral-90 flex items-center gap-2">
                        <Calculator className="w-4 h-4" />
                        Calculation Breakdown
                    </h4>

                    {/* Base Eligibility */}
                    <div className="flex items-center justify-between p-3 bg-neutral-5 rounded-lg">
                        <div>
                            <div className="text-sm font-medium text-neutral-90">Base Eligibility</div>
                            <div className="text-xs text-neutral-60">Based on financials</div>
                        </div>
                        <div className="text-right">
                            <div className="font-semibold text-neutral-90">
                                ₹{eligibility.baseEligibility.toFixed(2)} Cr
                            </div>
                        </div>
                    </div>

                    {/* Risk Multiplier */}
                    <div className="flex items-center justify-between p-3 bg-neutral-5 rounded-lg">
                        <div>
                            <div className="text-sm font-medium text-neutral-90 flex items-center gap-2">
                                Risk Multiplier
                                <Badge variant={multiplierBadge.variant} size="sm">
                                    {multiplierBadge.label}
                                </Badge>
                            </div>
                            <div className="text-xs text-neutral-60">Grade: {eligibility.riskGrade}</div>
                        </div>
                        <div className="text-right">
                            <div className="font-semibold text-neutral-90">
                                {eligibility.riskMultiplier.toFixed(3)}x
                            </div>
                        </div>
                    </div>

                    {/* Risk Score Impact */}
                    <div className="flex items-center justify-between p-3 bg-neutral-5 rounded-lg">
                        <div>
                            <div className="text-sm font-medium text-neutral-90">Risk Score</div>
                            <div className="text-xs text-neutral-60">Current assessment</div>
                        </div>
                        <div className="text-right">
                            <div className="font-semibold text-neutral-90">
                                {eligibility.riskScore.toFixed(1)}%
                            </div>
                        </div>
                    </div>
                </div>

                {/* Financial Basis */}
                <div className="space-y-3">
                    <h4 className="font-medium text-neutral-90 flex items-center gap-2">
                        <IndianRupee className="w-4 h-4" />
                        Financial Basis
                    </h4>

                    <div className="grid grid-cols-1 gap-2 text-sm">
                        <div className="flex justify-between items-center">
                            <span className="text-neutral-60">Turnover</span>
                            <span className="font-medium text-neutral-90">
                                ₹{eligibility.turnoverCr.toFixed(2)} Cr
                            </span>
                        </div>

                        <div className="flex justify-between items-center">
                            <span className="text-neutral-60">Net Worth</span>
                            <span className="font-medium text-neutral-90">
                                ₹{eligibility.netWorthCr.toFixed(2)} Cr
                            </span>
                        </div>
                    </div>
                </div>

                {/* Exposure Analysis */}
                {(eligibility.existingExposure > 0 || eligibility.incrementalEligibility !== eligibility.finalEligibility) && (
                    <div className="space-y-3">
                        <h4 className="font-medium text-neutral-90 flex items-center gap-2">
                            <Percent className="w-4 h-4" />
                            Exposure Analysis
                        </h4>

                        {eligibility.existingExposure > 0 && (
                            <div className="flex justify-between items-center text-sm">
                                <span className="text-neutral-60">Existing Exposure</span>
                                <span className="font-medium text-red-700">
                                    ₹{eligibility.existingExposure.toFixed(2)} Cr
                                </span>
                            </div>
                        )}

                        <div className="flex justify-between items-center text-sm">
                            <span className="text-neutral-60">Incremental Eligibility</span>
                            <span className="font-medium text-green-700">
                                ₹{eligibility.incrementalEligibility.toFixed(2)} Cr
                            </span>
                        </div>
                    </div>
                )}

                {/* Eligibility Progress Bar */}
                <div className="space-y-2">
                    <div className="flex justify-between items-center text-sm">
                        <span className="text-neutral-60">Eligibility Utilization</span>
                        <span className="font-medium text-neutral-90">
                            {eligibilityPercentage.toFixed(1)}%
                        </span>
                    </div>
                    <Progress
                        value={Math.min(eligibilityPercentage, 100)}
                        className="h-2"
                    />
                    <div className="text-xs text-neutral-50 text-center">
                        Final vs Base Eligibility
                    </div>
                </div>

                {/* Risk Assessment Summary */}
                <div className="p-3 bg-blue-50 rounded-lg">
                    <div className="flex items-start gap-2">
                        {eligibility.riskMultiplier >= 1.0 ? (
                            <CheckCircle className="w-4 h-4 text-green-600 mt-0.5" />
                        ) : (
                            <AlertTriangle className="w-4 h-4 text-yellow-600 mt-0.5" />
                        )}
                        <div className="text-sm">
                            <div className="font-medium text-neutral-90 mb-1">
                                {eligibility.riskMultiplier >= 1.0 ? 'Low Risk Profile' : 'Elevated Risk Profile'}
                            </div>
                            <div className="text-neutral-60">
                                {eligibility.riskMultiplier >= 1.0
                                    ? 'Company shows strong creditworthiness with favorable risk indicators.'
                                    : 'Risk factors have reduced the final credit eligibility amount.'
                                }
                            </div>
                        </div>
                    </div>
                </div>

                {/* Recommended Action */}
                <div className="p-3 border border-blue-200 bg-blue-50 rounded-lg">
                    <div className="text-sm">
                        <div className="font-medium text-blue-900 mb-1">Recommendation</div>
                        <div className="text-blue-700">
                            {eligibility.finalEligibility >= 10
                                ? 'Suitable for credit facility with standard monitoring.'
                                : eligibility.finalEligibility >= 5
                                    ? 'Consider smaller facility with enhanced monitoring.'
                                    : 'Requires detailed review before credit approval.'
                            }
                        </div>
                    </div>
                </div>
            </CardContent>
        </Card>
    )
}