import { Card, CardContent, CardHeader } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { PortfolioOverviewMetrics } from "@/lib/services/portfolio-analytics.service";
import { formatIndianNumberSystem, formatPercentage, cn } from "@/lib/utils";

interface QuickStatsProps {
    metrics: PortfolioOverviewMetrics;
    loading?: boolean;
}

const getRiskBadgeColor = (avgRiskScore: number): string => {
    if (avgRiskScore >= 80) return "bg-success-100 text-success-700 border-success-200";
    if (avgRiskScore >= 60) return "bg-info-100 text-info-700 border-info-200";
    if (avgRiskScore >= 40) return "bg-warning-100 text-warning-700 border-warning-200";
    if (avgRiskScore >= 20) return "bg-error-100 text-error-700 border-error-200";
    return "bg-error-100 text-error-800 border-error-300";
};

const getRiskLevel = (avgRiskScore: number): string => {
    if (avgRiskScore >= 80) return "Low";
    if (avgRiskScore >= 60) return "Medium";
    if (avgRiskScore >= 40) return "High";
    return "Critical";
};

export function QuickStats({ metrics, loading = false }: QuickStatsProps) {
    if (loading) {
        return (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {Array.from({ length: 2 }).map((_, i) => (
                    <Card key={i} className="animate-pulse">
                        <CardHeader>
                            <div className="h-5 bg-neutral-20 rounded" />
                        </CardHeader>
                        <CardContent>
                            <div className="space-y-3">
                                {Array.from({ length: 5 }).map((_, j) => (
                                    <div key={j} className="flex justify-between">
                                        <div className="h-4 bg-neutral-20 rounded w-1/2" />
                                        <div className="h-4 bg-neutral-20 rounded w-1/4" />
                                    </div>
                                ))}
                            </div>
                        </CardContent>
                    </Card>
                ))}
            </div>
        );
    }

    return (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Industry Distribution with Risk Overlay */}
            <Card variant="outlined">
                <CardHeader>
                    <div className="flex items-center justify-between">
                        <div>
                            <h3 className="text-lg font-semibold text-neutral-90">
                                Industry Distribution
                            </h3>
                            <p className="text-sm text-neutral-60">
                                Top industries with risk analysis
                            </p>
                        </div>
                        <Badge variant="outline" className="text-xs">
                            {metrics.industry_summary.total_industries} Total
                        </Badge>
                    </div>
                </CardHeader>
                <CardContent>
                    <div className="space-y-3">
                        {metrics.industry_summary.top_industries.slice(0, 5).map((industry, index) => (
                            <div key={industry.name} className="flex items-center justify-between p-3 bg-neutral-10 rounded-lg hover:bg-neutral-20 transition-colors">
                                <div className="flex items-center gap-3">
                                    <div className="flex items-center justify-center w-6 h-6 bg-primary-100 text-primary-700 rounded-full text-xs font-semibold">
                                        {index + 1}
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <div className="text-sm font-medium text-neutral-80 truncate">
                                            {industry.name}
                                        </div>
                                        <div className="text-xs text-neutral-60">
                                            {formatIndianNumberSystem(industry.count)} companies • {formatPercentage(industry.percentage)}
                                        </div>
                                    </div>
                                </div>
                                <div className="text-right">
                                    <div className="text-xs text-neutral-60 mb-1">Risk Level</div>
                                    <div className={cn(
                                        "text-xs px-2 py-1 rounded-full border text-center font-medium",
                                        getRiskBadgeColor(industry.avg_risk_score)
                                    )}>
                                        {getRiskLevel(industry.avg_risk_score)}
                                    </div>
                                    <div className="text-xs text-neutral-50 mt-1">
                                        {formatPercentage(industry.avg_risk_score)}
                                    </div>
                                </div>
                            </div>
                        ))}

                        {metrics.industry_summary.top_industries.length > 5 && (
                            <div className="text-center pt-2">
                                <span className="text-xs text-neutral-60">
                                    +{metrics.industry_summary.total_industries - 5} more industries
                                </span>
                            </div>
                        )}

                        {/* Industry Risk Summary */}
                        <div className="mt-4 pt-4 border-t border-neutral-20">
                            <div className="grid grid-cols-2 gap-4 text-center">
                                <div>
                                    <div className="text-sm font-semibold text-success-600">
                                        {metrics.industry_summary.top_industries.filter(i => i.avg_risk_score >= 70).length}
                                    </div>
                                    <div className="text-xs text-neutral-60">Low Risk Industries</div>
                                </div>
                                <div>
                                    <div className="text-sm font-semibold text-error-600">
                                        {metrics.industry_summary.top_industries.filter(i => i.avg_risk_score < 50).length}
                                    </div>
                                    <div className="text-xs text-neutral-60">High Risk Industries</div>
                                </div>
                            </div>
                        </div>
                    </div>
                </CardContent>
            </Card>

            {/* Regional Distribution with Risk Overlay */}
            <Card variant="outlined">
                <CardHeader>
                    <div className="flex items-center justify-between">
                        <div>
                            <h3 className="text-lg font-semibold text-neutral-90">
                                Regional Distribution
                            </h3>
                            <p className="text-sm text-neutral-60">
                                Top states with risk analysis
                            </p>
                        </div>
                        <Badge variant="outline" className="text-xs">
                            {metrics.regional_summary.total_regions} States
                        </Badge>
                    </div>
                </CardHeader>
                <CardContent>
                    <div className="space-y-3">
                        {metrics.regional_summary.top_regions.slice(0, 5).map((region, index) => (
                            <div key={region.name} className="flex items-center justify-between p-3 bg-neutral-10 rounded-lg hover:bg-neutral-20 transition-colors">
                                <div className="flex items-center gap-3">
                                    <div className="flex items-center justify-center w-6 h-6 bg-info-100 text-info-700 rounded-full text-xs font-semibold">
                                        {index + 1}
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <div className="text-sm font-medium text-neutral-80 truncate">
                                            {region.name}
                                        </div>
                                        <div className="text-xs text-neutral-60">
                                            {formatIndianNumberSystem(region.count)} companies • {formatPercentage(region.percentage)}
                                        </div>
                                    </div>
                                </div>
                                <div className="text-right">
                                    <div className="text-xs text-neutral-60 mb-1">Risk Level</div>
                                    <div className={cn(
                                        "text-xs px-2 py-1 rounded-full border text-center font-medium",
                                        getRiskBadgeColor(region.avg_risk_score)
                                    )}>
                                        {getRiskLevel(region.avg_risk_score)}
                                    </div>
                                    <div className="text-xs text-neutral-50 mt-1">
                                        {formatPercentage(region.avg_risk_score)}
                                    </div>
                                </div>
                            </div>
                        ))}

                        {metrics.regional_summary.top_regions.length > 5 && (
                            <div className="text-center pt-2">
                                <span className="text-xs text-neutral-60">
                                    +{metrics.regional_summary.total_regions - 5} more states
                                </span>
                            </div>
                        )}

                        {/* Regional Risk Summary */}
                        <div className="mt-4 pt-4 border-t border-neutral-20">
                            <div className="grid grid-cols-2 gap-4 text-center">
                                <div>
                                    <div className="text-sm font-semibold text-success-600">
                                        {metrics.regional_summary.top_regions.filter(r => r.avg_risk_score >= 70).length}
                                    </div>
                                    <div className="text-xs text-neutral-60">Low Risk States</div>
                                </div>
                                <div>
                                    <div className="text-sm font-semibold text-error-600">
                                        {metrics.regional_summary.top_regions.filter(r => r.avg_risk_score < 50).length}
                                    </div>
                                    <div className="text-xs text-neutral-60">High Risk States</div>
                                </div>
                            </div>
                        </div>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}