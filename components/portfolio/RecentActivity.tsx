import { Card, CardContent, CardHeader } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { PortfolioCompany } from "@/types/portfolio.types";
import { formatDistanceToNow } from "date-fns";
import { formatCurrency, formatPercentage, cn } from "@/lib/utils";

interface RecentActivityProps {
    recentCompanies: PortfolioCompany[];
    loading?: boolean;
}

const getStatusColor = (status: string): string => {
    switch (status) {
        case 'completed': return 'bg-success-100 text-success-700 border-success-200';
        case 'processing': return 'bg-info-100 text-info-700 border-info-200';
        case 'failed': return 'bg-error-100 text-error-700 border-error-200';
        case 'submitted': return 'bg-warning-100 text-warning-700 border-warning-200';
        default: return 'bg-neutral-100 text-neutral-700 border-neutral-200';
    }
};

const getRiskGradeColor = (grade: string): string => {
    switch (grade?.toLowerCase()) {
        case 'cm1': return 'text-success-600';
        case 'cm2': return 'text-info-600';
        case 'cm3': return 'text-warning-600';
        case 'cm4': return 'text-error-500';
        case 'cm5': return 'text-error-600';
        default: return 'text-neutral-500';
    }
};

const getActivityIcon = (status: string): string => {
    switch (status) {
        case 'completed': return '✓';
        case 'processing': return '⟳';
        case 'failed': return '✗';
        case 'submitted': return '↗';
        default: return '•';
    }
};

export function RecentActivity({ recentCompanies, loading = false }: RecentActivityProps) {
    if (loading) {
        return (
            <Card className="w-full animate-pulse">
                <CardHeader>
                    <div className="h-6 bg-neutral-20 rounded" />
                    <div className="h-4 bg-neutral-20 rounded w-2/3" />
                </CardHeader>
                <CardContent>
                    <div className="space-y-4">
                        {Array.from({ length: 5 }).map((_, i) => (
                            <div key={i} className="flex items-center gap-3 p-3 bg-neutral-10 rounded-lg">
                                <div className="w-8 h-8 bg-neutral-20 rounded-full" />
                                <div className="flex-1 space-y-2">
                                    <div className="h-4 bg-neutral-20 rounded w-3/4" />
                                    <div className="h-3 bg-neutral-20 rounded w-1/2" />
                                </div>
                                <div className="w-16 h-6 bg-neutral-20 rounded" />
                            </div>
                        ))}
                    </div>
                </CardContent>
            </Card>
        );
    }

    if (recentCompanies.length === 0) {
        return (
            <Card className="w-full" variant="outlined">
                <CardHeader>
                    <h3 className="text-lg font-semibold text-neutral-90">
                        Recent Activity
                    </h3>
                    <p className="text-sm text-neutral-60">
                        Latest document processing and risk assessments
                    </p>
                </CardHeader>
                <CardContent>
                    <div className="text-center py-8">
                        <div className="text-neutral-400 text-4xl mb-2">📄</div>
                        <div className="text-sm text-neutral-60">
                            No recent activity found
                        </div>
                    </div>
                </CardContent>
            </Card>
        );
    }

    return (
        <Card className="w-full" variant="elevated">
            <CardHeader>
                <div className="flex items-center justify-between">
                    <div>
                        <h3 className="text-lg font-semibold text-neutral-90">
                            Recent Activity
                        </h3>
                        <p className="text-sm text-neutral-60">
                            Latest document processing and risk assessments
                        </p>
                    </div>
                    <Badge variant="outline" className="text-xs">
                        Last {recentCompanies.length} activities
                    </Badge>
                </div>
            </CardHeader>
            <CardContent>
                <div className="space-y-3">
                    {recentCompanies.map((company) => {
                        const activityDate = company.completed_at || company.processing_started_at || company.submitted_at;
                        const timeAgo = activityDate ? formatDistanceToNow(new Date(activityDate), { addSuffix: true }) : 'Unknown';

                        return (
                            <div
                                key={company.id}
                                className="flex items-center gap-3 p-3 bg-neutral-10 rounded-lg hover:bg-neutral-20 transition-colors duration-200"
                            >
                                {/* Activity Icon */}
                                <div className={cn(
                                    "flex items-center justify-center w-8 h-8 rounded-full text-sm font-semibold",
                                    getStatusColor(company.status || 'submitted')
                                )}>
                                    {getActivityIcon(company.status || 'submitted')}
                                </div>

                                {/* Company Info */}
                                <div className="flex-1 min-w-0">
                                    <div className="flex items-center gap-2 mb-1">
                                        <span className="text-sm font-medium text-neutral-80 truncate">
                                            {company.company_name || 'Unknown Company'}
                                        </span>
                                        {company.risk_grade && (
                                            <Badge
                                                variant="outline"
                                                className={cn("text-xs", getRiskGradeColor(company.risk_grade))}
                                            >
                                                {company.risk_grade.toUpperCase()}
                                            </Badge>
                                        )}
                                    </div>

                                    <div className="flex items-center gap-4 text-xs text-neutral-60">
                                        <span>{company.industry || 'Unknown Industry'}</span>
                                        <span>•</span>
                                        <span>{timeAgo}</span>
                                        {company.risk_score && (
                                            <>
                                                <span>•</span>
                                                <span className={getRiskGradeColor(company.risk_grade || '')}>
                                                    Risk: {formatPercentage(company.risk_score)}
                                                </span>
                                            </>
                                        )}
                                        {company.total_parameters && company.available_parameters && (
                                            <>
                                                <span>•</span>
                                                <span className="text-info-600">
                                                    {company.available_parameters}/{company.total_parameters} params
                                                </span>
                                            </>
                                        )}
                                    </div>
                                </div>

                                {/* Status and Metrics */}
                                <div className="text-right space-y-1">
                                    <div className={cn(
                                        "text-xs px-2 py-1 rounded-full border font-medium",
                                        getStatusColor(company.status || 'submitted')
                                    )}>
                                        {(company.status || 'submitted').charAt(0).toUpperCase() + (company.status || 'submitted').slice(1)}
                                    </div>

                                    {company.recommended_limit && (
                                        <div className="text-xs text-neutral-60">
                                            Limit: {formatCurrency(company.recommended_limit)}
                                        </div>
                                    )}

                                    {/* Risk Assessment Summary */}
                                    {company.status === 'completed' && company.risk_score && (
                                        <div className="text-xs">
                                            <div className="text-neutral-50">Assessment Complete</div>
                                            <div className="flex items-center gap-1 mt-1">
                                                <span className="text-neutral-60">Score:</span>
                                                <span className={cn("font-medium", getRiskGradeColor(company.risk_grade || ''))}>
                                                    {formatPercentage(company.risk_score)}
                                                </span>
                                            </div>
                                        </div>
                                    )}

                                    {company.status === 'processing' && (
                                        <div className="text-xs text-info-600">
                                            Analyzing parameters...
                                        </div>
                                    )}
                                </div>
                            </div>
                        );
                    })}
                </div>

                {/* Activity Summary */}
                <div className="mt-4 pt-4 border-t border-neutral-20">
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
                        <div>
                            <div className="text-sm font-semibold text-success-600">
                                {recentCompanies.filter(c => c.status === 'completed').length}
                            </div>
                            <div className="text-xs text-neutral-60">Completed</div>
                        </div>
                        <div>
                            <div className="text-sm font-semibold text-info-600">
                                {recentCompanies.filter(c => c.status === 'processing').length}
                            </div>
                            <div className="text-xs text-neutral-60">Processing</div>
                        </div>
                        <div>
                            <div className="text-sm font-semibold text-warning-600">
                                {recentCompanies.filter(c => c.status === 'submitted').length}
                            </div>
                            <div className="text-xs text-neutral-60">Submitted</div>
                        </div>
                        <div>
                            <div className="text-sm font-semibold text-error-600">
                                {recentCompanies.filter(c => c.status === 'failed').length}
                            </div>
                            <div className="text-xs text-neutral-60">Failed</div>
                        </div>
                    </div>
                </div>
            </CardContent>
        </Card>
    );
}