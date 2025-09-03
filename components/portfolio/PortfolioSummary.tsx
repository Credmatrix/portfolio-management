import { Card, CardContent, CardHeader } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { PortfolioOverviewMetrics } from "@/lib/services/portfolio-analytics.service";
import { formatCurrency, formatIndianNumberSystem, formatPercentage, cn } from "@/lib/utils";

interface PortfolioSummaryProps {
    metrics: PortfolioOverviewMetrics;
    loading?: boolean;
}

const getRiskLevelColor = (avgRiskScore: number): string => {
    if (avgRiskScore >= 80) return "text-success-600";
    if (avgRiskScore >= 60) return "text-info-600";
    if (avgRiskScore >= 40) return "text-warning-600";
    return "text-error-600";
};

const getRiskLevelBadge = (avgRiskScore: number): { color: string; label: string } => {
    if (avgRiskScore >= 80) return { color: "bg-success-100 text-success-700 border-success-200", label: "Low Risk" };
    if (avgRiskScore >= 60) return { color: "bg-info-100 text-info-700 border-info-200", label: "Medium Risk" };
    if (avgRiskScore >= 40) return { color: "bg-warning-100 text-warning-700 border-warning-200", label: "High Risk" };
    return { color: "bg-error-100 text-error-700 border-error-200", label: "Critical Risk" };
};

export function PortfolioSummary({ metrics, loading = false }: PortfolioSummaryProps) {
    if (loading) {
        return (
            <Card className="w-full">
                <CardHeader>
                    <div className="h-6 bg-neutral-20 rounded animate-pulse" />
                    <div className="h-4 bg-neutral-20 rounded w-2/3 animate-pulse" />
                </CardHeader>
                <CardContent>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                        {Array.from({ length: 4 }).map((_, i) => (
                            <div key={i} className="space-y-2">
                                <div className="h-4 bg-neutral-20 rounded animate-pulse" />
                                <div className="h-8 bg-neutral-20 rounded animate-pulse" />
                                <div className="h-3 bg-neutral-20 rounded w-3/4 animate-pulse" />
                            </div>
                        ))}
                    </div>
                    <div className="mt-6 pt-6 border-t border-neutral-20">
                        <div className="h-20 bg-neutral-20 rounded animate-pulse" />
                    </div>
                </CardContent>
            </Card>
        );
    }

    const riskBadge = getRiskLevelBadge(metrics.average_risk_score);
    const lowRiskCount = metrics.risk_distribution.cm1_count + metrics.risk_distribution.cm2_count;
    const highRiskCount = metrics.risk_distribution.cm4_count + metrics.risk_distribution.cm5_count;
    const utilizationRate = metrics.total_exposure > 0
        ? (metrics.eligibility_overview.risk_adjusted_exposure / metrics.total_exposure) * 100
        : 0;

    return (
        <Card className="w-full" variant="elevated">
            <CardHeader>
                <div className="flex items-center justify-between">
                    <div>
                        <h2 className="text-xl font-semibold text-neutral-90">
                            Portfolio Overview
                        </h2>
                        <p className="text-sm text-neutral-60">
                            Comprehensive metrics from {formatIndianNumberSystem(metrics.total_companies)} companies with risk distribution
                        </p>
                    </div>
                    <Badge className={cn("text-xs font-medium border", riskBadge.color)}>
                        {riskBadge.label}
                    </Badge>
                </div>
            </CardHeader>
            <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                    {/* Total Companies with Risk Breakdown */}
                    <div className="space-y-3">
                        <div className="flex items-center gap-2">
                            <div className="w-3 h-3 bg-primary-500 rounded-full" />
                            <span className="text-sm font-medium text-neutral-70">
                                Total Companies
                            </span>
                        </div>
                        <div className="text-2xl font-semibold text-neutral-90">
                            {formatIndianNumberSystem(metrics.total_companies)}
                        </div>
                        <div className="space-y-1">
                            <div className="flex justify-between text-xs">
                                <span className="text-success-600">Low Risk (CM1-CM2)</span>
                                <span className="font-medium">{formatIndianNumberSystem(lowRiskCount)}</span>
                            </div>
                            <div className="flex justify-between text-xs">
                                <span className="text-error-600">High Risk (CM4-CM5)</span>
                                <span className="font-medium">{formatIndianNumberSystem(highRiskCount)}</span>
                            </div>
                        </div>
                    </div>

                    {/* Total Exposure with Risk Adjustment */}
                    <div className="space-y-3">
                        <div className="flex items-center gap-2">
                            <div className="w-3 h-3 bg-success-500 rounded-full" />
                            <span className="text-sm font-medium text-neutral-70">
                                Total Exposure
                            </span>
                        </div>
                        <div className="text-2xl font-semibold text-neutral-90">
                            {formatCurrency(metrics.total_exposure)}
                        </div>
                        <div className="space-y-1">
                            <div className="text-xs text-neutral-60">
                                Risk-adjusted: {formatCurrency(metrics.eligibility_overview.risk_adjusted_exposure)}
                            </div>
                            <div className="text-xs text-neutral-60">
                                Utilization: {formatPercentage(utilizationRate)}
                            </div>
                        </div>
                    </div>

                    {/* Average Risk Score with Grade Distribution */}
                    <div className="space-y-3">
                        <div className="flex items-center gap-2">
                            <div className="w-3 h-3 bg-warning-500 rounded-full" />
                            <span className="text-sm font-medium text-neutral-70">
                                Portfolio Risk
                            </span>
                        </div>
                        <div className={cn("text-2xl font-semibold", getRiskLevelColor(metrics.average_risk_score))}>
                            {formatPercentage(metrics.average_risk_score)}
                        </div>
                        <div className="space-y-1">
                            <div className="text-xs text-neutral-60">
                                CM3 (Medium): {formatIndianNumberSystem(metrics.risk_distribution.cm3_count)}
                            </div>
                            <div className="text-xs text-neutral-60">
                                Ungraded: {formatIndianNumberSystem(metrics.risk_distribution.ungraded_count)}
                            </div>
                        </div>
                    </div>

                    {/* Eligibility Overview */}
                    <div className="space-y-3">
                        <div className="flex items-center gap-2">
                            <div className="w-3 h-3 bg-info-500 rounded-full" />
                            <span className="text-sm font-medium text-neutral-70">
                                Credit Eligibility
                            </span>
                        </div>
                        <div className="text-2xl font-semibold text-neutral-90">
                            {formatCurrency(metrics.eligibility_overview.total_eligible_amount)}
                        </div>
                        <div className="space-y-1">
                            <div className="text-xs text-neutral-60">
                                Avg per company: {formatCurrency(metrics.eligibility_overview.average_eligibility)}
                            </div>
                            <div className="text-xs text-neutral-60">
                                Coverage: {formatPercentage((metrics.eligibility_overview.total_eligible_amount / metrics.total_exposure) * 100)}
                            </div>
                        </div>
                    </div>
                </div>

                {/* Enhanced Portfolio Health Indicators */}
                <div className="mt-6 pt-6 border-t border-neutral-20">
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                        <div className="text-center p-3 bg-neutral-10 rounded-lg">
                            <div className="text-lg font-semibold text-neutral-90">
                                {metrics.industry_summary.total_industries}
                            </div>
                            <div className="text-sm text-neutral-60">Industries</div>
                            <div className="text-xs text-neutral-50 mt-1">
                                Diversified portfolio
                            </div>
                        </div>
                        <div className="text-center p-3 bg-neutral-10 rounded-lg">
                            <div className="text-lg font-semibold text-neutral-90">
                                {metrics.regional_summary.total_regions}
                            </div>
                            <div className="text-sm text-neutral-60">Regions</div>
                            <div className="text-xs text-neutral-50 mt-1">
                                Geographic spread
                            </div>
                        </div>
                        <div className="text-center p-3 bg-neutral-10 rounded-lg">
                            <div className="text-lg font-semibold text-success-600">
                                {formatPercentage((metrics.compliance_overview.gst_compliance.compliant / metrics.total_companies) * 100)}
                            </div>
                            <div className="text-sm text-neutral-60">GST Compliant</div>
                            <div className="text-xs text-neutral-50 mt-1">
                                {formatIndianNumberSystem(metrics.compliance_overview.gst_compliance.compliant)} companies
                            </div>
                        </div>
                        <div className="text-center p-3 bg-neutral-10 rounded-lg">
                            <div className="text-lg font-semibold text-info-600">
                                {formatPercentage((metrics.compliance_overview.epfo_compliance.compliant / metrics.total_companies) * 100)}
                            </div>
                            <div className="text-sm text-neutral-60">EPFO Compliant</div>
                            <div className="text-xs text-neutral-50 mt-1">
                                {formatIndianNumberSystem(metrics.compliance_overview.epfo_compliance.compliant)} companies
                            </div>
                        </div>
                    </div>
                </div>

                {/* Risk Distribution Summary Bar */}
                <div className="mt-4 space-y-2">
                    <div className="flex justify-between text-sm text-neutral-70">
                        <span>Risk Distribution</span>
                        <span>{formatPercentage((lowRiskCount / metrics.total_companies) * 100)} Low Risk</span>
                    </div>
                    <div className="w-full bg-neutral-20 rounded-full h-2 overflow-hidden">
                        <div className="h-full flex">
                            <div
                                className="bg-success-500"
                                style={{ width: `${(metrics.risk_distribution.cm1_count / metrics.total_companies) * 100}%` }}
                            />
                            <div
                                className="bg-info-500"
                                style={{ width: `${(metrics.risk_distribution.cm2_count / metrics.total_companies) * 100}%` }}
                            />
                            <div
                                className="bg-warning-500"
                                style={{ width: `${(metrics.risk_distribution.cm3_count / metrics.total_companies) * 100}%` }}
                            />
                            <div
                                className="bg-error-400"
                                style={{ width: `${(metrics.risk_distribution.cm4_count / metrics.total_companies) * 100}%` }}
                            />
                            <div
                                className="bg-error-600"
                                style={{ width: `${(metrics.risk_distribution.cm5_count / metrics.total_companies) * 100}%` }}
                            />
                        </div>
                    </div>
                    <div className="flex justify-between text-xs text-neutral-60">
                        <span>CM1</span>
                        <span>CM2</span>
                        <span>CM3</span>
                        <span>CM4</span>
                        <span>CM5</span>
                    </div>
                </div>
            </CardContent>
        </Card>
    );
}