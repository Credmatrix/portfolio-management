import { Card, CardContent, CardHeader } from "@/components/ui/Card";
import { EligibilitySummary } from "@/types/portfolio.types";
import { formatCurrency, formatPercentage } from "@/lib/utils";
import { cn } from "@/lib/utils";

interface CreditEligibilityOverviewProps {
    eligibilitySummary: EligibilitySummary;
    totalCompanies: number;
    loading?: boolean;
}

export function CreditEligibilityOverview({
    eligibilitySummary,
    totalCompanies,
    loading = false
}: CreditEligibilityOverviewProps) {
    if (loading) {
        return (
            <Card className="w-full animate-pulse">
                <CardHeader>
                    <div className="h-6 bg-neutral-20 rounded" />
                    <div className="h-4 bg-neutral-20 rounded w-2/3" />
                </CardHeader>
                <CardContent>
                    <div className="space-y-6">
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            {Array.from({ length: 3 }).map((_, i) => (
                                <div key={i} className="space-y-2">
                                    <div className="h-4 bg-neutral-20 rounded" />
                                    <div className="h-8 bg-neutral-20 rounded" />
                                    <div className="h-3 bg-neutral-20 rounded w-3/4" />
                                </div>
                            ))}
                        </div>
                        <div className="h-32 bg-neutral-20 rounded" />
                    </div>
                </CardContent>
            </Card>
        );
    }

    // Calculate utilization percentage
    const utilizationPercentage = eligibilitySummary.total_eligible_amount > 0
        ? (eligibilitySummary.risk_adjusted_exposure / eligibilitySummary.total_eligible_amount) * 100
        : 0;

    // Prepare eligibility distribution data
    const eligibilityDistribution = Object.entries(eligibilitySummary.eligibility_distribution)
        .map(([grade, amount]) => ({
            grade: grade.toUpperCase(),
            amount,
            percentage: eligibilitySummary.total_eligible_amount > 0
                ? (amount / eligibilitySummary.total_eligible_amount) * 100
                : 0
        }))
        .sort((a, b) => b.amount - a.amount);

    const getRiskGradeColor = (grade: string): string => {
        switch (grade.toLowerCase()) {
            case 'cm1': return 'bg-success-500';
            case 'cm2': return 'bg-info-500';
            case 'cm3': return 'bg-warning-500';
            case 'cm4': return 'bg-error-400';
            case 'cm5': return 'bg-error-600';
            default: return 'bg-neutral-400';
        }
    };

    return (
        <Card className="w-full" variant="elevated">
            <CardHeader>
                <h3 className="text-lg font-semibold text-neutral-90">
                    Credit Eligibility Overview
                </h3>
                <p className="text-sm text-neutral-60">
                    Total eligible limits and risk-adjusted exposure analysis
                </p>
            </CardHeader>
            <CardContent>
                <div className="space-y-6">
                    {/* Key Metrics */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div className="space-y-2">
                            <div className="flex items-center gap-2">
                                <div className="w-3 h-3 bg-success-500 rounded-full" />
                                <span className="text-sm font-medium text-neutral-70">
                                    Total Eligible Amount
                                </span>
                            </div>
                            <div className="text-2xl font-semibold text-neutral-90">
                                {formatCurrency(eligibilitySummary.total_eligible_amount)}
                            </div>
                            <div className="text-xs text-neutral-60">
                                Across {totalCompanies} companies
                            </div>
                        </div>

                        <div className="space-y-2">
                            <div className="flex items-center gap-2">
                                <div className="w-3 h-3 bg-warning-500 rounded-full" />
                                <span className="text-sm font-medium text-neutral-70">
                                    Risk-Adjusted Exposure
                                </span>
                            </div>
                            <div className="text-2xl font-semibold text-neutral-90">
                                {formatCurrency(eligibilitySummary.risk_adjusted_exposure)}
                            </div>
                            <div className="text-xs text-neutral-60">
                                After risk multipliers
                            </div>
                        </div>

                        <div className="space-y-2">
                            <div className="flex items-center gap-2">
                                <div className="w-3 h-3 bg-info-500 rounded-full" />
                                <span className="text-sm font-medium text-neutral-70">
                                    Average Eligibility
                                </span>
                            </div>
                            <div className="text-2xl font-semibold text-neutral-90">
                                {formatCurrency(eligibilitySummary.average_eligibility)}
                            </div>
                            <div className="text-xs text-neutral-60">
                                Per company average
                            </div>
                        </div>
                    </div>

                    {/* Utilization Indicator */}
                    <div className="space-y-3">
                        <div className="flex items-center justify-between">
                            <span className="text-sm font-medium text-neutral-70">
                                Risk Utilization
                            </span>
                            <span className="text-sm text-neutral-60">
                                {formatPercentage(utilizationPercentage)}
                            </span>
                        </div>
                        <div className="w-full bg-neutral-20 rounded-full h-3">
                            <div
                                className={cn(
                                    "h-3 rounded-full transition-all duration-500",
                                    utilizationPercentage > 80 ? "bg-error-500" :
                                        utilizationPercentage > 60 ? "bg-warning-500" :
                                            "bg-success-500"
                                )}
                                style={{ width: `${Math.min(utilizationPercentage, 100)}%` }}
                            />
                        </div>
                        <div className="text-xs text-neutral-60">
                            Risk-adjusted exposure vs total eligible amount
                        </div>
                    </div>

                    {/* Eligibility Distribution by Risk Grade */}
                    {eligibilityDistribution.length > 0 && (
                        <div className="space-y-3">
                            <h4 className="text-sm font-medium text-neutral-70">
                                Eligibility Distribution by Risk Grade
                            </h4>
                            <div className="space-y-2">
                                {eligibilityDistribution.map(({ grade, amount, percentage }) => (
                                    <div key={grade} className="flex items-center justify-between p-3 bg-neutral-10 rounded-lg hover:bg-neutral-20 transition-colors">
                                        <div className="flex items-center gap-3">
                                            <div className={cn("w-3 h-3 rounded-full", getRiskGradeColor(grade))} />
                                            <div>
                                                <span className="text-sm font-medium text-neutral-80">
                                                    {grade}
                                                </span>
                                                <div className="text-xs text-neutral-60">
                                                    {grade === 'CM1' && 'Excellent Credit'}
                                                    {grade === 'CM2' && 'Good Credit'}
                                                    {grade === 'CM3' && 'Average Credit'}
                                                    {grade === 'CM4' && 'Poor Credit'}
                                                    {grade === 'CM5' && 'High Risk'}
                                                </div>
                                            </div>
                                        </div>
                                        <div className="text-right">
                                            <div className="text-sm font-semibold text-neutral-90">
                                                {formatCurrency(amount)}
                                            </div>
                                            <div className="text-xs text-neutral-60">
                                                {formatPercentage(percentage)} of total
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Risk Adjustment Impact */}
                    <Card variant="filled" className="bg-info-10 border-info-200">
                        <CardContent className="p-4">
                            <div className="flex items-center justify-between">
                                <div>
                                    <div className="text-sm font-medium text-info-800">
                                        Risk Adjustment Impact
                                    </div>
                                    <div className="text-xs text-info-600 mt-1">
                                        Difference between base and risk-adjusted exposure
                                    </div>
                                </div>
                                <div className="text-right">
                                    <div className="text-lg font-semibold text-info-800">
                                        {formatCurrency(
                                            Math.abs(eligibilitySummary.total_eligible_amount - eligibilitySummary.risk_adjusted_exposure)
                                        )}
                                    </div>
                                    <div className="text-xs text-info-600">
                                        {eligibilitySummary.risk_adjusted_exposure < eligibilitySummary.total_eligible_amount
                                            ? 'Reduced' : 'Increased'}
                                    </div>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                </div>
            </CardContent>
        </Card>
    );
}