import { Card, CardContent, CardHeader } from "@/components/ui/Card";
import { RiskParameterAnalysis } from "@/lib/services/portfolio-analytics.service";
import { formatIndianNumberSystem, formatPercentage, cn } from "@/lib/utils";

interface ParameterPerformanceCardsProps {
    parameterAnalysis: RiskParameterAnalysis;
    loading?: boolean;
}

const getCategoryColor = (category: string): string => {
    switch (category.toLowerCase()) {
        case 'financial': return 'bg-success-500';
        case 'business': return 'bg-info-500';
        case 'hygiene': return 'bg-warning-500';
        case 'banking': return 'bg-primary-500';
        default: return 'bg-neutral-400';
    }
};

const getCategoryBgColor = (category: string): string => {
    switch (category.toLowerCase()) {
        case 'financial': return 'bg-success-50 border-success-200';
        case 'business': return 'bg-info-50 border-info-200';
        case 'hygiene': return 'bg-warning-50 border-warning-200';
        case 'banking': return 'bg-primary-50 border-primary-200';
        default: return 'bg-neutral-50 border-neutral-200';
    }
};

const getPerformanceColor = (percentage: number): string => {
    if (percentage >= 80) return 'text-success-600';
    if (percentage >= 60) return 'text-info-600';
    if (percentage >= 40) return 'text-warning-600';
    return 'text-error-600';
};

const getPerformanceLabel = (percentage: number): string => {
    if (percentage >= 80) return 'Excellent';
    if (percentage >= 60) return 'Good';
    if (percentage >= 40) return 'Average';
    if (percentage >= 20) return 'Poor';
    return 'Critical';
};

export function ParameterPerformanceCards({ parameterAnalysis, loading = false }: ParameterPerformanceCardsProps) {
    if (loading) {
        return (
            <div className="space-y-4">
                <div className="h-6 bg-neutral-20 rounded animate-pulse" />
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                    {Array.from({ length: 4 }).map((_, i) => (
                        <Card key={i} className="animate-pulse">
                            <CardContent className="p-4">
                                <div className="space-y-3">
                                    <div className="h-4 bg-neutral-20 rounded" />
                                    <div className="h-8 bg-neutral-20 rounded" />
                                    <div className="h-3 bg-neutral-20 rounded w-2/3" />
                                    <div className="h-16 bg-neutral-20 rounded" />
                                </div>
                            </CardContent>
                        </Card>
                    ))}
                </div>
            </div>
        );
    }

    const categories = ['Financial', 'Business', 'Hygiene', 'Banking'];
    const categoryData = categories.map(category => ({
        name: category,
        data: parameterAnalysis.category_performance[category] || {
            average_score: 0,
            max_possible_score: 0,
            percentage: 0,
            parameter_count: 0,
            available_parameters: 0,
            top_parameters: [],
            bottom_parameters: []
        }
    }));

    return (
        <div className="space-y-4">
            <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold text-neutral-90">
                    Parameter Performance by Category
                </h3>
                <span className="text-sm text-neutral-60">
                    Category-wise scoring analysis
                </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                {categoryData.map(({ name, data }) => (
                    <Card
                        key={name}
                        className={cn(
                            "hover:shadow-fluent-2 transition-all duration-200 border",
                            getCategoryBgColor(name)
                        )}
                    >
                        <CardHeader className="pb-3">
                            <div className="flex items-center gap-2">
                                <div className={cn("w-3 h-3 rounded-full", getCategoryColor(name))} />
                                <span className="text-sm font-semibold text-neutral-80">
                                    {name}
                                </span>
                            </div>
                        </CardHeader>
                        <CardContent className="pt-0">
                            <div className="space-y-4">
                                {/* Performance Score */}
                                <div className="text-center">
                                    <div className={cn(
                                        "text-2xl font-bold",
                                        getPerformanceColor(data.percentage)
                                    )}>
                                        {formatPercentage(data.percentage)}
                                    </div>
                                    <div className="text-xs text-neutral-60">
                                        {getPerformanceLabel(data.percentage)}
                                    </div>
                                </div>

                                {/* Progress Ring or Bar */}
                                <div className="space-y-2">
                                    <div className="flex justify-between text-xs text-neutral-60">
                                        <span>Score</span>
                                        <span>{formatIndianNumberSystem(data.average_score)}/{formatIndianNumberSystem(data.max_possible_score)}</span>
                                    </div>
                                    <div className="w-full bg-neutral-200 rounded-full h-2">
                                        <div
                                            className={cn("h-2 rounded-full transition-all duration-500", getCategoryColor(name))}
                                            style={{ width: `${Math.min(data.percentage, 100)}%` }}
                                        />
                                    </div>
                                </div>

                                {/* Parameter Availability */}
                                <div className="space-y-2">
                                    <div className="flex justify-between text-xs">
                                        <span className="text-neutral-60">Parameters</span>
                                        <span className="font-medium text-neutral-80">
                                            {data.available_parameters}/{data.parameter_count}
                                        </span>
                                    </div>
                                    <div className="text-xs text-neutral-60">
                                        {data.parameter_count > 0
                                            ? formatPercentage((data.available_parameters / data.parameter_count) * 100)
                                            : '0%'} available
                                    </div>
                                </div>

                                {/* Top and Bottom Parameters */}
                                {data.top_parameters.length > 0 && (
                                    <div className="space-y-2">
                                        <div className="space-y-1">
                                            <div className="text-xs font-medium text-success-700">
                                                Best Parameter:
                                            </div>
                                            <div className="text-xs text-neutral-60 truncate">
                                                {data.top_parameters[0].parameter}
                                            </div>
                                            <div className="flex items-center gap-1">
                                                <span className="text-xs font-medium text-neutral-80">
                                                    {formatIndianNumberSystem(data.top_parameters[0].average_score)}
                                                </span>
                                                <span className={cn(
                                                    "text-xs px-1 py-0.5 rounded text-center",
                                                    data.top_parameters[0].benchmark_category === 'Excellent' ? 'bg-success-100 text-success-700' :
                                                        data.top_parameters[0].benchmark_category === 'Good' ? 'bg-info-100 text-info-700' :
                                                            data.top_parameters[0].benchmark_category === 'Average' ? 'bg-warning-100 text-warning-700' :
                                                                'bg-error-100 text-error-700'
                                                )}>
                                                    {data.top_parameters[0].benchmark_category}
                                                </span>
                                            </div>
                                        </div>

                                        {data.bottom_parameters.length > 0 && (
                                            <div className="space-y-1">
                                                <div className="text-xs font-medium text-error-700">
                                                    Needs Attention:
                                                </div>
                                                <div className="text-xs text-neutral-60 truncate">
                                                    {data.bottom_parameters[0].parameter}
                                                </div>
                                                <div className="flex items-center gap-1">
                                                    <span className="text-xs font-medium text-neutral-80">
                                                        {formatIndianNumberSystem(data.bottom_parameters[0].average_score)}
                                                    </span>
                                                    <span className={cn(
                                                        "text-xs px-1 py-0.5 rounded text-center",
                                                        data.bottom_parameters[0].benchmark_category === 'Excellent' ? 'bg-success-100 text-success-700' :
                                                            data.bottom_parameters[0].benchmark_category === 'Good' ? 'bg-info-100 text-info-700' :
                                                                data.bottom_parameters[0].benchmark_category === 'Average' ? 'bg-warning-100 text-warning-700' :
                                                                    'bg-error-100 text-error-700'
                                                    )}>
                                                        {data.bottom_parameters[0].benchmark_category}
                                                    </span>
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                )}
                            </div>
                        </CardContent>
                    </Card>
                ))}
            </div>

            {/* Overall Performance Summary */}
            <Card variant="filled" className="bg-neutral-10">
                <CardContent className="p-4">
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
                        {categoryData.map(({ name, data }) => (
                            <div key={name}>
                                <div className="text-sm font-medium text-neutral-70 mb-1">
                                    {name}
                                </div>
                                <div className={cn(
                                    "text-lg font-semibold",
                                    getPerformanceColor(data.percentage)
                                )}>
                                    {formatPercentage(data.percentage)}
                                </div>
                                <div className="text-xs text-neutral-60">
                                    {data.available_parameters} params
                                </div>
                            </div>
                        ))}
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}