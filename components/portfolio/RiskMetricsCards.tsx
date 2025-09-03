import { Card, CardContent, CardHeader } from "@/components/ui/Card";
import { RiskDistribution } from "@/types/portfolio.types";
import { formatIndianNumberSystem, formatPercentage } from "@/lib/utils";
import { cn } from "@/lib/utils";

interface RiskMetricsCardsProps {
    riskDistribution: RiskDistribution;
    averageRiskScore: number;
    loading?: boolean;
}

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

const getRiskGradeLabel = (grade: string): string => {
    switch (grade.toLowerCase()) {
        case 'cm1': return 'Excellent';
        case 'cm2': return 'Good';
        case 'cm3': return 'Average';
        case 'cm4': return 'Poor';
        case 'cm5': return 'Critical';
        default: return 'Ungraded';
    }
};

export function RiskMetricsCards({ riskDistribution, averageRiskScore, loading = false }: RiskMetricsCardsProps) {
    if (loading) {
        return (
            <div className="space-y-4">
                <div className="h-6 bg-neutral-20 rounded animate-pulse" />
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {Array.from({ length: 6 }).map((_, i) => (
                        <Card key={i} className="animate-pulse">
                            <CardContent className="p-4">
                                <div className="space-y-3">
                                    <div className="h-4 bg-neutral-20 rounded" />
                                    <div className="h-8 bg-neutral-20 rounded" />
                                    <div className="h-3 bg-neutral-20 rounded w-2/3" />
                                    <div className="h-2 bg-neutral-20 rounded" />
                                </div>
                            </CardContent>
                        </Card>
                    ))}
                </div>
                <div className="h-20 bg-neutral-20 rounded animate-pulse" />
            </div>
        );
    }

    const riskGrades = [
        { key: 'cm1', count: riskDistribution.cm1_count, percentage: riskDistribution.distribution_percentages.cm1 },
        { key: 'cm2', count: riskDistribution.cm2_count, percentage: riskDistribution.distribution_percentages.cm2 },
        { key: 'cm3', count: riskDistribution.cm3_count, percentage: riskDistribution.distribution_percentages.cm3 },
        { key: 'cm4', count: riskDistribution.cm4_count, percentage: riskDistribution.distribution_percentages.cm4 },
        { key: 'cm5', count: riskDistribution.cm5_count, percentage: riskDistribution.distribution_percentages.cm5 },
        { key: 'ungraded', count: riskDistribution.ungraded_count, percentage: riskDistribution.distribution_percentages.ungraded }
    ];

    // Calculate risk concentration metrics
    const lowRiskCount = riskDistribution.cm1_count + riskDistribution.cm2_count;
    const highRiskCount = riskDistribution.cm4_count + riskDistribution.cm5_count;
    const totalCount = riskDistribution.total_count;

    const riskConcentration = {
        low: (lowRiskCount / totalCount) * 100,
        medium: (riskDistribution.cm3_count / totalCount) * 100,
        high: (highRiskCount / totalCount) * 100
    };

    // Determine portfolio risk level
    const getPortfolioRiskLevel = () => {
        if (riskConcentration.high > 30) return { level: 'High', color: 'text-error-600', bgColor: 'bg-error-50' };
        if (riskConcentration.high > 15) return { level: 'Medium-High', color: 'text-warning-600', bgColor: 'bg-warning-50' };
        if (riskConcentration.low > 60) return { level: 'Low', color: 'text-success-600', bgColor: 'bg-success-50' };
        return { level: 'Medium', color: 'text-info-600', bgColor: 'bg-info-50' };
    };

    const portfolioRisk = getPortfolioRiskLevel();

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h3 className="text-lg font-semibold text-neutral-90">CM Grade Distribution</h3>
                    <p className="text-sm text-neutral-60">Risk concentration and average scores across portfolio</p>
                </div>
                <div className="text-right">
                    <div className="text-sm text-neutral-60">Portfolio Average</div>
                    <div className="text-lg font-semibold text-neutral-90">
                        {formatPercentage(averageRiskScore)}
                    </div>
                    <div className={cn("text-xs px-2 py-1 rounded-full", portfolioRisk.bgColor, portfolioRisk.color)}>
                        {portfolioRisk.level} Risk
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {riskGrades.map(({ key, count, percentage }) => (
                    <Card
                        key={key}
                        className="hover:shadow-fluent-2 transition-shadow duration-200"
                        variant="outlined"
                    >
                        <CardContent className="p-4">
                            <div className="flex items-center justify-between mb-3">
                                <div className="flex items-center gap-2">
                                    <div className={cn("w-3 h-3 rounded-full", getRiskGradeColor(key))} />
                                    <span className="text-sm font-medium text-neutral-70 uppercase">
                                        {key === 'ungraded' ? 'Ungraded' : key}
                                    </span>
                                </div>
                                <span className="text-xs text-neutral-60">
                                    {getRiskGradeLabel(key)}
                                </span>
                            </div>

                            <div className="space-y-2">
                                <div className="text-2xl font-semibold text-neutral-90">
                                    {formatIndianNumberSystem(count)}
                                </div>
                                <div className="text-sm text-neutral-60">
                                    {formatPercentage(percentage || 0)} of portfolio
                                </div>

                                {/* Risk Score Range Indicator */}
                                <div className="text-xs text-neutral-50">
                                    {key === 'cm1' && 'Score: 90-100%'}
                                    {key === 'cm2' && 'Score: 75-89%'}
                                    {key === 'cm3' && 'Score: 60-74%'}
                                    {key === 'cm4' && 'Score: 40-59%'}
                                    {key === 'cm5' && 'Score: <40%'}
                                    {key === 'ungraded' && 'Pending analysis'}
                                </div>
                            </div>

                            {/* Progress bar */}
                            <div className="mt-3">
                                <div className="w-full bg-neutral-20 rounded-full h-2">
                                    <div
                                        className={cn("h-2 rounded-full transition-all duration-300", getRiskGradeColor(key))}
                                        style={{ width: `${Math.min(percentage || 0, 100)}%` }}
                                    />
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                ))}
            </div>

            {/* Enhanced Risk Concentration Analysis */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Risk Concentration Summary */}
                <Card variant="filled" className={cn("border", portfolioRisk.bgColor)}>
                    <CardHeader className="pb-3">
                        <h4 className="text-sm font-semibold text-neutral-80">Risk Concentration</h4>
                    </CardHeader>
                    <CardContent className="pt-0">
                        <div className="space-y-3">
                            <div className="flex justify-between items-center">
                                <span className="text-sm text-success-600">Low Risk (CM1-CM2)</span>
                                <div className="text-right">
                                    <div className="text-lg font-semibold text-success-600">
                                        {formatIndianNumberSystem(lowRiskCount)}
                                    </div>
                                    <div className="text-xs text-neutral-60">
                                        {formatPercentage(riskConcentration.low)}
                                    </div>
                                </div>
                            </div>
                            <div className="flex justify-between items-center">
                                <span className="text-sm text-warning-600">Medium Risk (CM3)</span>
                                <div className="text-right">
                                    <div className="text-lg font-semibold text-warning-600">
                                        {formatIndianNumberSystem(riskDistribution.cm3_count)}
                                    </div>
                                    <div className="text-xs text-neutral-60">
                                        {formatPercentage(riskConcentration.medium)}
                                    </div>
                                </div>
                            </div>
                            <div className="flex justify-between items-center">
                                <span className="text-sm text-error-600">High Risk (CM4-CM5)</span>
                                <div className="text-right">
                                    <div className="text-lg font-semibold text-error-600">
                                        {formatIndianNumberSystem(highRiskCount)}
                                    </div>
                                    <div className="text-xs text-neutral-60">
                                        {formatPercentage(riskConcentration.high)}
                                    </div>
                                </div>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                {/* Risk Quality Metrics */}
                <Card variant="outlined">
                    <CardHeader className="pb-3">
                        <h4 className="text-sm font-semibold text-neutral-80">Portfolio Quality</h4>
                    </CardHeader>
                    <CardContent className="pt-0">
                        <div className="space-y-3">
                            <div className="flex justify-between items-center">
                                <span className="text-sm text-neutral-70">Excellent (CM1)</span>
                                <div className="text-right">
                                    <div className="text-sm font-semibold text-neutral-90">
                                        {formatPercentage((riskDistribution.cm1_count / totalCount) * 100)}
                                    </div>
                                </div>
                            </div>
                            <div className="flex justify-between items-center">
                                <span className="text-sm text-neutral-70">Investment Grade (CM1-CM2)</span>
                                <div className="text-right">
                                    <div className="text-sm font-semibold text-neutral-90">
                                        {formatPercentage(riskConcentration.low)}
                                    </div>
                                </div>
                            </div>
                            <div className="flex justify-between items-center">
                                <span className="text-sm text-neutral-70">Watch List (CM4-CM5)</span>
                                <div className="text-right">
                                    <div className="text-sm font-semibold text-neutral-90">
                                        {formatPercentage(riskConcentration.high)}
                                    </div>
                                </div>
                            </div>
                            <div className="pt-2 border-t border-neutral-20">
                                <div className="flex justify-between items-center">
                                    <span className="text-sm font-medium text-neutral-80">Portfolio Grade</span>
                                    <div className={cn("text-sm font-semibold", portfolioRisk.color)}>
                                        {portfolioRisk.level}
                                    </div>
                                </div>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}