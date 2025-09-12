// 'use client';

// import React, { useState, useMemo } from 'react';
// import { Card } from '@/components/ui/Card';
// import { Badge } from '@/components/ui/Badge';
// import { Button } from '@/components/ui/Button';
// import { Checkbox } from '@/components/ui/Checkbox';
// import { Progress } from '@/components/ui/Progress';
// import { useFilterSystem } from '@/lib/hooks/useFilterSystem';
// import {
//     Shield,
//     AlertTriangle,
//     CheckCircle,
//     XCircle,
//     TrendingUp,
//     TrendingDown,
//     Info
// } from 'lucide-react';
// import type { ComplianceStatus } from '@/types/portfolio.types';

// interface ComplianceStats {
//     gst: {
//         compliant: number;
//         nonCompliant: number;
//         unknown: number;
//         averageScore: number;
//         trend: 'up' | 'down' | 'stable';
//     };
//     epfo: {
//         compliant: number;
//         nonCompliant: number;
//         unknown: number;
//         averageScore: number;
//         trend: 'up' | 'down' | 'stable';
//     };
//     audit: {
//         qualified: number;
//         unqualified: number;
//         unknown: number;
//         trend: 'up' | 'down' | 'stable';
//     };
//     overall: {
//         fullyCompliant: number;
//         partiallyCompliant: number;
//         nonCompliant: number;
//         riskScore: number;
//     };
// }

// interface SmartComplianceFilterPanelProps {
//     complianceStats?: ComplianceStats;
//     benchmarkData?: {
//         industryAverage: number;
//         peerComparison: 'above' | 'below' | 'equal';
//     };
//     onFilterChange?: (filters: any) => void;
//     className?: string;
// }

// export function SmartComplianceFilterPanel({
//     complianceStats,
//     benchmarkData,
//     onFilterChange,
//     className = ''
// }: SmartComplianceFilterPanelProps) {
//     const { filters, updateFilter } = useFilterSystem();
//     const [selectedCompliance, setSelectedCompliance] = useState<ComplianceStatus[]>(
//         filters.complianceStatus || []
//     );

//     // Calculate compliance risk warnings
//     const riskWarnings = useMemo(() => {
//         if (!complianceStats) return [];

//         const warnings = [];

//         // High non-compliance rate warning
//         const totalCompanies = complianceStats.overall.fullyCompliant +
//             complianceStats.overall.partiallyCompliant +
//             complianceStats.overall.nonCompliant;

//         const nonComplianceRate = complianceStats.overall.nonCompliant / totalCompanies;
//         if (nonComplianceRate > 0.2) {
//             warnings.push({
//                 type: 'high-risk' as const,
//                 message: `${Math.round(nonComplianceRate * 100)}% of portfolio is non-compliant`,
//                 severity: 'high' as const
//             });
//         }

//         // GST compliance trend warning
//         if (complianceStats.gst.trend === 'down') {
//             warnings.push({
//                 type: 'trend' as const,
//                 message: 'GST compliance trending downward',
//                 severity: 'medium' as const
//             });
//         }

//         // EPFO compliance trend warning
//         if (complianceStats.epfo.trend === 'down') {
//             warnings.push({
//                 type: 'trend' as const,
//                 message: 'EPFO compliance trending downward',
//                 severity: 'medium' as const
//             });
//         }

//         // Benchmark comparison warning
//         if (benchmarkData?.peerComparison === 'below') {
//             warnings.push({
//                 type: 'benchmark' as const,
//                 message: 'Portfolio compliance below industry average',
//                 severity: 'medium' as const
//             });
//         }

//         return warnings;
//     }, [complianceStats, benchmarkData]);

//     // Generate filter suggestions based on compliance data
//     const complianceSuggestions = useMemo(() => {
//         if (!complianceStats) return [];

//         const suggestions = [];

//         // Suggest focusing on non-compliant companies
//         if (complianceStats.overall.nonCompliant > 0) {
//             suggestions.push({
//                 label: `Non-Compliant Companies (${complianceStats.overall.nonCompliant})`,
//                 filters: { complianceStatus: ['non_compliant'] },
//                 description: 'Companies requiring immediate attention'
//             });
//         }

//         // Suggest GST non-compliant if significant
//         if (complianceStats.gst.nonCompliant > 0) {
//             suggestions.push({
//                 label: `GST Non-Compliant (${complianceStats.gst.nonCompliant})`,
//                 filters: { gstCompliance: ['non_compliant'] },
//                 description: 'Companies with GST compliance issues'
//             });
//         }

//         // Suggest EPFO non-compliant if significant
//         if (complianceStats.epfo.nonCompliant > 0) {
//             suggestions.push({
//                 label: `EPFO Non-Compliant (${complianceStats.epfo.nonCompliant})`,
//                 filters: { epfoCompliance: ['non_compliant'] },
//                 description: 'Companies with EPFO compliance issues'
//             });
//         }

//         // Suggest audit unqualified if significant
//         if (complianceStats.audit.unqualified > 0) {
//             suggestions.push({
//                 label: `Unqualified Audits (${complianceStats.audit.unqualified})`,
//                 filters: { auditStatus: ['unqualified'] },
//                 description: 'Companies with audit qualification issues'
//             });
//         }

//         return suggestions;
//     }, [complianceStats]);

//     const handleComplianceChange = (status: ComplianceStatus, checked: boolean) => {
//         const newSelection = checked
//             ? [...selectedCompliance, status]
//             : selectedCompliance.filter(s => s !== status);

//         setSelectedCompliance(newSelection);
//         updateFilters({ complianceStatus: newSelection });
//         onFilterChange?.({ complianceStatus: newSelection });
//     };

//     const applySuggestion = (suggestion: typeof complianceSuggestions[0]) => {
//         updateFilters(suggestion.filters);
//         onFilterChange?.(suggestion.filters);
//     };

//     const getComplianceIcon = (status: ComplianceStatus) => {
//         switch (status) {
//             case 'compliant':
//                 return <CheckCircle className="h-4 w-4 text-green-600" />;
//             case 'non_compliant':
//                 return <XCircle className="h-4 w-4 text-red-600" />;
//             case 'partially_compliant':
//                 return <AlertTriangle className="h-4 w-4 text-yellow-600" />;
//             default:
//                 return <Info className="h-4 w-4 text-gray-600" />;
//         }
//     };

//     const getTrendIcon = (trend: 'up' | 'down' | 'stable') => {
//         switch (trend) {
//             case 'up':
//                 return <TrendingUp className="h-4 w-4 text-green-600" />;
//             case 'down':
//                 return <TrendingDown className="h-4 w-4 text-red-600" />;
//             default:
//                 return <div className="h-4 w-4" />;
//         }
//     };

//     if (!complianceStats) {
//         return (
//             <Card className={`p-4 ${className}`}>
//                 <div className="flex items-center gap-2 text-gray-500">
//                     <Shield className="h-5 w-5" />
//                     <span>Loading compliance data...</span>
//                 </div>
//             </Card>
//         );
//     }

//     return (
//         <Card className={`p-4 ${className}`}>
//             <div className="space-y-4">
//                 {/* Header */}
//                 <div className="flex items-center gap-2">
//                     <Shield className="h-5 w-5 text-blue-600" />
//                     <h3 className="text-lg font-semibold">Compliance Filters</h3>
//                 </div>

//                 {/* Risk Warnings */}
//                 {riskWarnings.length > 0 && (
//                     <div className="space-y-2">
//                         {riskWarnings.map((warning, index) => (
//                             <div
//                                 key={index}
//                                 className={`p-3 rounded-lg border-l-4 ${warning.severity === 'high'
//                                         ? 'bg-red-50 border-red-400 text-red-800'
//                                         : 'bg-yellow-50 border-yellow-400 text-yellow-800'
//                                     }`}
//                             >
//                                 <div className="flex items-center gap-2">
//                                     <AlertTriangle className="h-4 w-4" />
//                                     <span className="text-sm font-medium">{warning.message}</span>
//                                 </div>
//                             </div>
//                         ))}
//                     </div>
//                 )}

//                 {/* Compliance Overview */}
//                 <div className="space-y-3">
//                     <h4 className="text-sm font-medium text-gray-700">Portfolio Overview</h4>

//                     <div className="grid grid-cols-2 gap-4">
//                         <div className="space-y-2">
//                             <div className="flex justify-between text-sm">
//                                 <span>Fully Compliant</span>
//                                 <span className="font-medium text-green-600">
//                                     {complianceStats.overall.fullyCompliant}
//                                 </span>
//                             </div>
//                             <div className="flex justify-between text-sm">
//                                 <span>Partially Compliant</span>
//                                 <span className="font-medium text-yellow-600">
//                                     {complianceStats.overall.partiallyCompliant}
//                                 </span>
//                             </div>
//                             <div className="flex justify-between text-sm">
//                                 <span>Non-Compliant</span>
//                                 <span className="font-medium text-red-600">
//                                     {complianceStats.overall.nonCompliant}
//                                 </span>
//                             </div>
//                         </div>

//                         <div className="space-y-2">
//                             <div className="text-sm">
//                                 <span>Risk Score</span>
//                                 <div className="flex items-center gap-2 mt-1">
//                                     <Progress
//                                         value={complianceStats.overall.riskScore}
//                                         className="flex-1"
//                                     />
//                                     <span className="text-xs font-medium">
//                                         {complianceStats.overall.riskScore}%
//                                     </span>
//                                 </div>
//                             </div>

//                             {benchmarkData && (
//                                 <div className="text-xs text-gray-600">
//                                     Industry Avg: {benchmarkData.industryAverage}%
//                                     <Badge
//                                         variant={benchmarkData.peerComparison === 'above' ? 'success' : 'destructive'}
//                                         className="ml-2"
//                                     >
//                                         {benchmarkData.peerComparison}
//                                     </Badge>
//                                 </div>
//                             )}
//                         </div>
//                     </div>
//                 </div>

//                 {/* Detailed Compliance Metrics */}
//                 <div className="space-y-3">
//                     <h4 className="text-sm font-medium text-gray-700">Compliance Details</h4>

//                     {/* GST Compliance */}
//                     <div className="p-3 bg-gray-50 rounded-lg">
//                         <div className="flex items-center justify-between mb-2">
//                             <span className="text-sm font-medium">GST Compliance</span>
//                             <div className="flex items-center gap-1">
//                                 {getTrendIcon(complianceStats.gst.trend)}
//                                 <span className="text-xs text-gray-600">
//                                     {complianceStats.gst.averageScore}% avg
//                                 </span>
//                             </div>
//                         </div>
//                         <div className="grid grid-cols-3 gap-2 text-xs">
//                             <div className="text-center">
//                                 <div className="font-medium text-green-600">
//                                     {complianceStats.gst.compliant}
//                                 </div>
//                                 <div className="text-gray-600">Compliant</div>
//                             </div>
//                             <div className="text-center">
//                                 <div className="font-medium text-red-600">
//                                     {complianceStats.gst.nonCompliant}
//                                 </div>
//                                 <div className="text-gray-600">Non-Compliant</div>
//                             </div>
//                             <div className="text-center">
//                                 <div className="font-medium text-gray-600">
//                                     {complianceStats.gst.unknown}
//                                 </div>
//                                 <div className="text-gray-600">Unknown</div>
//                             </div>
//                         </div>
//                     </div>

//                     {/* EPFO Compliance */}
//                     <div className="p-3 bg-gray-50 rounded-lg">
//                         <div className="flex items-center justify-between mb-2">
//                             <span className="text-sm font-medium">EPFO Compliance</span>
//                             <div className="flex items-center gap-1">
//                                 {getTrendIcon(complianceStats.epfo.trend)}
//                                 <span className="text-xs text-gray-600">
//                                     {complianceStats.epfo.averageScore}% avg
//                                 </span>
//                             </div>
//                         </div>
//                         <div className="grid grid-cols-3 gap-2 text-xs">
//                             <div className="text-center">
//                                 <div className="font-medium text-green-600">
//                                     {complianceStats.epfo.compliant}
//                                 </div>
//                                 <div className="text-gray-600">Compliant</div>
//                             </div>
//                             <div className="text-center">
//                                 <div className="font-medium text-red-600">
//                                     {complianceStats.epfo.nonCompliant}
//                                 </div>
//                                 <div className="text-gray-600">Non-Compliant</div>
//                             </div>
//                             <div className="text-center">
//                                 <div className="font-medium text-gray-600">
//                                     {complianceStats.epfo.unknown}
//                                 </div>
//                                 <div className="text-gray-600">Unknown</div>
//                             </div>
//                         </div>
//                     </div>

//                     {/* Audit Status */}
//                     <div className="p-3 bg-gray-50 rounded-lg">
//                         <div className="flex items-center justify-between mb-2">
//                             <span className="text-sm font-medium">Audit Status</span>
//                             {getTrendIcon(complianceStats.audit.trend)}
//                         </div>
//                         <div className="grid grid-cols-3 gap-2 text-xs">
//                             <div className="text-center">
//                                 <div className="font-medium text-green-600">
//                                     {complianceStats.audit.qualified}
//                                 </div>
//                                 <div className="text-gray-600">Qualified</div>
//                             </div>
//                             <div className="text-center">
//                                 <div className="font-medium text-red-600">
//                                     {complianceStats.audit.unqualified}
//                                 </div>
//                                 <div className="text-gray-600">Unqualified</div>
//                             </div>
//                             <div className="text-center">
//                                 <div className="font-medium text-gray-600">
//                                     {complianceStats.audit.unknown}
//                                 </div>
//                                 <div className="text-gray-600">Unknown</div>
//                             </div>
//                         </div>
//                     </div>
//                 </div>

//                 {/* Filter Suggestions */}
//                 {complianceSuggestions.length > 0 && (
//                     <div className="space-y-2">
//                         <h4 className="text-sm font-medium text-gray-700">Quick Actions</h4>
//                         <div className="space-y-2">
//                             {complianceSuggestions.map((suggestion, index) => (
//                                 <Button
//                                     key={index}
//                                     variant="outline"
//                                     size="sm"
//                                     onClick={() => applySuggestion(suggestion)}
//                                     className="w-full justify-start text-left"
//                                 >
//                                     <div>
//                                         <div className="font-medium">{suggestion.label}</div>
//                                         <div className="text-xs text-gray-600">{suggestion.description}</div>
//                                     </div>
//                                 </Button>
//                             ))}
//                         </div>
//                     </div>
//                 )}

//                 {/* Compliance Status Filters */}
//                 <div className="space-y-2">
//                     <h4 className="text-sm font-medium text-gray-700">Filter by Status</h4>
//                     <div className="space-y-2">
//                         {(['compliant', 'partially_compliant', 'non_compliant', 'unknown'] as ComplianceStatus[]).map((status) => (
//                             <div key={status} className="flex items-center gap-2">
//                                 <Checkbox
//                                     id={`compliance-${status}`}
//                                     checked={selectedCompliance.includes(status)}
//                                     onCheckedChange={(checked) => handleComplianceChange(status, checked as boolean)}
//                                 />
//                                 <label
//                                     htmlFor={`compliance-${status}`}
//                                     className="flex items-center gap-2 text-sm cursor-pointer"
//                                 >
//                                     {getComplianceIcon(status)}
//                                     <span className="capitalize">
//                                         {status.replace('_', ' ')}
//                                     </span>
//                                 </label>
//                             </div>
//                         ))}
//                     </div>
//                 </div>
//             </div>
//         </Card>
//     );
// }