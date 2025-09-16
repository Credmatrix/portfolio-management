// 'use client';

// import React, { useState, useMemo } from 'react';
// import { Card } from '@/components/ui/Card';
// import { Badge } from '@/components/ui/Badge';
// import { Button } from '@/components/ui/Button';
// import { Progress } from '@/components/ui/Progress';
// import { useFilterSystem } from '@/lib/hooks/useFilterSystem';
// import {
//     TrendingUp,
//     TrendingDown,
//     IndianRupee,
//     BarChart3,
//     AlertTriangle,
//     Target,
//     Award,
//     AlertCircle
// } from 'lucide-react';

// interface FinancialMetric {
//     name: string;
//     key: string;
//     value: number;
//     min: number;
//     max: number;
//     unit: string;
//     benchmark: {
//         industry: number;
//         peer: number;
//         excellent: number;
//         good: number;
//         fair: number;
//         poor: number;
//     };
//     trend: 'up' | 'down' | 'stable';
//     description: string;
// }

// interface FinancialPreset {
//     id: string;
//     name: string;
//     description: string;
//     icon: React.ReactNode;
//     filters: Record<string, [number, number]>;
//     riskLevel: 'low' | 'medium' | 'high';
// }

// interface FinancialMetricsFilterPanelProps {
//     metrics?: FinancialMetric[];
//     portfolioStats?: {
//         averageMetrics: Record<string, number>;
//         distributionData: Record<string, Record<string, number>>;
//     };
//     onFilterChange?: (filters: any) => void;
//     className?: string;
// }

// export function FinancialMetricsFilterPanel({
//     metrics = [],
//     portfolioStats,
//     onFilterChange,
//     className = ''
// }: FinancialMetricsFilterPanelProps) {
//     const { filters, updateFilters } = useFilterSystem();

//     const [selectedRanges, setSelectedRanges] = useState<Record<string, [number, number]>>(
//         filters.financialMetrics || {}
//     );

//     // Define financial health presets
//     const financialPresets: FinancialPreset[] = [
//         {
//             id: 'high-performance',
//             name: 'High Performance',
//             description: 'Companies with excellent financial metrics across all categories',
//             icon: <Award className="h-4 w-4 text-green-600" />,
//             filters: {
//                 ebitdaMargin: [15, 100],
//                 debtEquityRatio: [0, 0.5],
//                 currentRatio: [1.5, 10],
//                 returnOnAssets: [8, 100],
//                 returnOnEquity: [15, 100]
//             },
//             riskLevel: 'low'
//         },
//         {
//             id: 'stable-performers',
//             name: 'Stable Performers',
//             description: 'Companies with good financial health and stable performance',
//             icon: <Target className="h-4 w-4 text-blue-600" />,
//             filters: {
//                 ebitdaMargin: [8, 100],
//                 debtEquityRatio: [0, 1.0],
//                 currentRatio: [1.2, 10],
//                 returnOnAssets: [4, 100],
//                 returnOnEquity: [10, 100]
//             },
//             riskLevel: 'low'
//         },
//         {
//             id: 'growth-potential',
//             name: 'Growth Potential',
//             description: 'Companies with strong growth metrics but higher leverage',
//             icon: <TrendingUp className="h-4 w-4 text-purple-600" />,
//             filters: {
//                 revenueGrowth: [15, 100],
//                 ebitdaMargin: [5, 100],
//                 debtEquityRatio: [0, 2.0],
//                 currentRatio: [1.0, 10]
//             },
//             riskLevel: 'medium'
//         },
//         {
//             id: 'at-risk',
//             name: 'At Risk',
//             description: 'Companies showing signs of financial stress requiring attention',
//             icon: <AlertTriangle className="h-4 w-4 text-red-600" />,
//             filters: {
//                 ebitdaMargin: [-100, 5],
//                 debtEquityRatio: [2.0, 100],
//                 currentRatio: [0, 1.0],
//                 returnOnAssets: [-100, 2]
//             },
//             riskLevel: 'high'
//         },
//         {
//             id: 'turnaround-candidates',
//             name: 'Turnaround Candidates',
//             description: 'Companies with poor current metrics but potential for improvement',
//             icon: <TrendingDown className="h-4 w-4 text-orange-600" />,
//             filters: {
//                 ebitdaMargin: [-100, 8],
//                 debtEquityRatio: [1.5, 100],
//                 currentRatio: [0.8, 1.5],
//                 returnOnAssets: [-100, 4]
//             },
//             riskLevel: 'high'
//         }
//     ];

//     // Calculate metric correlations and warnings
//     const metricWarnings = useMemo(() => {
//         const warnings = [];

//         // Check for conflicting metric combinations
//         if (selectedRanges.debtEquityRatio && selectedRanges.currentRatio) {
//             const [debtMin, debtMax] = selectedRanges.debtEquityRatio;
//             const [currentMin, currentMax] = selectedRanges.currentRatio;

//             if (debtMax > 2.0 && currentMin > 2.0) {
//                 warnings.push({
//                     type: 'correlation' as const,
//                     message: 'High debt with high current ratio may indicate cash flow issues',
//                     severity: 'medium' as const
//                 });
//             }
//         }

//         // Check for unrealistic combinations
//         if (selectedRanges.ebitdaMargin && selectedRanges.returnOnAssets) {
//             const [ebitdaMin] = selectedRanges.ebitdaMargin;
//             const [roaMin] = selectedRanges.returnOnAssets;

//             if (ebitdaMin < 0 && roaMin > 10) {
//                 warnings.push({
//                     type: 'unrealistic' as const,
//                     message: 'Negative EBITDA with high ROA is uncommon',
//                     severity: 'low' as const
//                 });
//             }
//         }

//         return warnings;
//     }, [selectedRanges]);

//     // Generate benchmark comparisons
//     const benchmarkComparisons = useMemo(() => {
//         if (!portfolioStats) return [];

//         return metrics.map(metric => {
//             const portfolioAvg = portfolioStats.averageMetrics[metric.key] || 0;
//             const industryBenchmark = metric.benchmark.industry;
//             const peerBenchmark = metric.benchmark.peer;

//             return {
//                 metric: metric.name,
//                 portfolioValue: portfolioAvg,
//                 industryBenchmark,
//                 peerBenchmark,
//                 vsIndustry: portfolioAvg > industryBenchmark ? 'above' : 'below',
//                 vsPeer: portfolioAvg > peerBenchmark ? 'above' : 'below',
//                 performance: getPerformanceLevel(portfolioAvg, metric.benchmark)
//             };
//         });
//     }, [metrics, portfolioStats]);

//     const getPerformanceLevel = (value: number, benchmark: FinancialMetric['benchmark']) => {
//         if (value >= benchmark.excellent) return 'excellent';
//         if (value >= benchmark.good) return 'good';
//         if (value >= benchmark.fair) return 'fair';
//         return 'poor';
//     };

//     const getPerformanceBadge = (performance: string) => {
//         const variants = {
//             excellent: 'success',
//             good: 'success',
//             fair: 'warning',
//             poor: 'destructive'
//         } as const;

//         return <Badge variant={variants[performance as keyof typeof variants]} className="text-xs">{performance}</Badge>;
//     };

//     const handleRangeChange = (metricKey: string, range: [number, number]) => {
//         const newRanges = { ...selectedRanges, [metricKey]: range };
//         setSelectedRanges(newRanges);
//         updateFilters({ financialMetrics: newRanges });
//         onFilterChange?.({ financialMetrics: newRanges });
//     };

//     const applyPreset = (preset: FinancialPreset) => {
//         setSelectedRanges(preset.filters);
//         updateFilters({ financialMetrics: preset.filters });
//         onFilterChange?.({ financialMetrics: preset.filters });
//     };

//     const clearMetricFilter = (metricKey: string) => {
//         const newRanges = { ...selectedRanges };
//         delete newRanges[metricKey];
//         setSelectedRanges(newRanges);
//         updateFilters({ financialMetrics: newRanges });
//         onFilterChange?.({ financialMetrics: newRanges });
//     };

//     const RangeSlider = ({ metric }: { metric: FinancialMetric }) => {
//         const currentRange = selectedRanges[metric.key] || [metric.min, metric.max];

//         return (
//             <div className="space-y-2">
//                 <div className="flex items-center justify-between">
//                     <label className="text-sm font-medium">{metric.name}</label>
//                     <Button
//                         variant="ghost"
//                         size="sm"
//                         onClick={() => clearMetricFilter(metric.key)}
//                         className="text-xs text-gray-500 hover:text-gray-700"
//                     >
//                         Clear
//                     </Button>
//                 </div>

//                 <div className="px-2">
//                     <div className="relative">
//                         {/* This would be replaced with an actual range slider component */}
//                         <div className="h-2 bg-gray-200 rounded-full">
//                             <div
//                                 className="h-2 bg-blue-600 rounded-full"
//                                 style={{
//                                     marginLeft: `${((currentRange[0] - metric.min) / (metric.max - metric.min)) * 100}%`,
//                                     width: `${((currentRange[1] - currentRange[0]) / (metric.max - metric.min)) * 100}%`
//                                 }}
//                             />
//                         </div>
//                     </div>

//                     <div className="flex justify-between text-xs text-gray-600 mt-1">
//                         <span>{currentRange[0]}{metric.unit}</span>
//                         <span>{currentRange[1]}{metric.unit}</span>
//                     </div>
//                 </div>

//                 <div className="text-xs text-gray-600">
//                     <div className="flex justify-between">
//                         <span>Industry: {metric.benchmark.industry}{metric.unit}</span>
//                         <span>Peer: {metric.benchmark.peer}{metric.unit}</span>
//                     </div>
//                 </div>
//             </div>
//         );
//     };

//     return (
//         <Card className={`p-4 ${className}`}>
//             <div className="space-y-6">
//                 {/* Header */}
//                 <div className="flex items-center gap-2">
//                     <BarChart3 className="h-5 w-5 text-blue-600" />
//                     <h3 className="text-lg font-semibold">Financial Metrics</h3>
//                 </div>

//                 {/* Metric Warnings */}
//                 {metricWarnings.length > 0 && (
//                     <div className="space-y-2">
//                         {metricWarnings.map((warning, index) => (
//                             <div
//                                 key={index}
//                                 className={`p-3 rounded-lg border-l-4 ${warning.severity === 'high'
//                                         ? 'bg-red-50 border-red-400 text-red-800'
//                                         : warning.severity === 'medium'
//                                             ? 'bg-yellow-50 border-yellow-400 text-yellow-800'
//                                             : 'bg-blue-50 border-blue-400 text-blue-800'
//                                     }`}
//                             >
//                                 <div className="flex items-center gap-2">
//                                     <AlertCircle className="h-4 w-4" />
//                                     <span className="text-sm font-medium">{warning.message}</span>
//                                 </div>
//                             </div>
//                         ))}
//                     </div>
//                 )}

//                 {/* Financial Health Presets */}
//                 <div className="space-y-3">
//                     <h4 className="text-sm font-medium text-gray-700">Financial Health Presets</h4>
//                     <div className="grid grid-cols-1 gap-2">
//                         {financialPresets.map((preset) => (
//                             <Button
//                                 key={preset.id}
//                                 variant="outline"
//                                 onClick={() => applyPreset(preset)}
//                                 className="w-full justify-start text-left p-3 h-auto"
//                             >
//                                 <div className="flex items-start gap-3">
//                                     {preset.icon}
//                                     <div className="flex-1">
//                                         <div className="flex items-center gap-2">
//                                             <span className="font-medium">{preset.name}</span>
//                                             <Badge
//                                                 variant={preset.riskLevel === 'low' ? 'success' : preset.riskLevel === 'medium' ? 'warning' : 'destructive'}
//                                                 className="text-xs"
//                                             >
//                                                 {preset.riskLevel} risk
//                                             </Badge>
//                                         </div>
//                                         <div className="text-xs text-gray-600 mt-1">{preset.description}</div>
//                                     </div>
//                                 </div>
//                             </Button>
//                         ))}
//                     </div>
//                 </div>

//                 {/* Portfolio Benchmark Comparison */}
//                 {benchmarkComparisons.length > 0 && (
//                     <div className="space-y-3">
//                         <h4 className="text-sm font-medium text-gray-700">Portfolio Performance</h4>
//                         <div className="space-y-2">
//                             {benchmarkComparisons.map((comparison, index) => (
//                                 <div key={index} className="p-3 bg-gray-50 rounded-lg">
//                                     <div className="flex items-center justify-between mb-2">
//                                         <span className="text-sm font-medium">{comparison.metric}</span>
//                                         {getPerformanceBadge(comparison.performance)}
//                                     </div>
//                                     <div className="grid grid-cols-3 gap-2 text-xs">
//                                         <div className="text-center">
//                                             <div className="font-medium">{comparison.portfolioValue.toFixed(1)}</div>
//                                             <div className="text-gray-600">Portfolio</div>
//                                         </div>
//                                         <div className="text-center">
//                                             <div className={`font-medium ${comparison.vsIndustry === 'above' ? 'text-green-600' : 'text-red-600'}`}>
//                                                 {comparison.industryBenchmark.toFixed(1)}
//                                             </div>
//                                             <div className="text-gray-600">Industry</div>
//                                         </div>
//                                         <div className="text-center">
//                                             <div className={`font-medium ${comparison.vsPeer === 'above' ? 'text-green-600' : 'text-red-600'}`}>
//                                                 {comparison.peerBenchmark.toFixed(1)}
//                                             </div>
//                                             <div className="text-gray-600">Peer</div>
//                                         </div>
//                                     </div>
//                                 </div>
//                             ))}
//                         </div>
//                     </div>
//                 )}

//                 {/* Individual Metric Filters */}
//                 <div className="space-y-4">
//                     <h4 className="text-sm font-medium text-gray-700">Custom Ranges</h4>
//                     <div className="space-y-4">
//                         {metrics.map((metric) => (
//                             <RangeSlider key={metric.key} metric={metric} />
//                         ))}
//                     </div>
//                 </div>

//                 {/* Active Filters Summary */}
//                 {Object.keys(selectedRanges).length > 0 && (
//                     <div className="space-y-2">
//                         <h4 className="text-sm font-medium text-gray-700">Active Filters</h4>
//                         <div className="space-y-1">
//                             {Object.entries(selectedRanges).map(([key, range]) => {
//                                 const metric = metrics.find(m => m.key === key);
//                                 if (!metric) return null;

//                                 return (
//                                     <div key={key} className="flex items-center justify-between text-sm">
//                                         <span>{metric.name}</span>
//                                         <Badge variant="secondary" className="text-xs">
//                                             {range[0]}{metric.unit} - {range[1]}{metric.unit}
//                                         </Badge>
//                                     </div>
//                                 );
//                             })}
//                         </div>
//                     </div>
//                 )}
//             </div>
//         </Card>
//     );
// }