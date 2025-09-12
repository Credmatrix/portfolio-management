// 'use client';

// import React, { useState, useEffect, useMemo } from 'react';
// import { Card } from '@/components/ui/Card';
// import { Badge } from '@/components/ui/Badge';
// import { Button } from '@/components/ui/Button';
// import { Input } from '@/components/ui/Input';
// import { Select } from '@/components/ui/Select';
// import { Checkbox } from '@/components/ui/Checkbox';
// import { useFilterSystem } from '@/lib/hooks/useFilterSystem';
// import { SmartComplianceFilterPanel } from './SmartComplianceFilterPanel';
// import { AdvancedRegionIndustryFilterPanel } from './AdvancedRegionIndustryFilterPanel';
// import { FinancialMetricsFilterPanel } from './FinancialMetricsFilterPanel';
// import { ChevronDown, ChevronUp, Search, Bookmark, AlertTriangle, Settings } from 'lucide-react';
// import type { FilterState, FilterOption, SavedFilterSet } from '@/types/filter.types';

// interface SmartFilterPanelProps {
//     portfolioStats?: {
//         totalCompanies: number;
//         industryBreakdown: Record<string, number>;
//         regionBreakdown: Record<string, number>;
//         complianceBreakdown: Record<string, number>;
//         riskGradeBreakdown: Record<string, number>;
//     };
//     complianceStats?: any;
//     regionData?: any[];
//     industryData?: any[];
//     financialMetrics?: any[];
//     benchmarkData?: any;
//     onFilterChange?: (filters: FilterState) => void;
//     className?: string;
// }

// export function SmartFilterPanel({
//     portfolioStats,
//     complianceStats,
//     regionData,
//     industryData,
//     financialMetrics,
//     benchmarkData,
//     onFilterChange,
//     className = ''
// }: SmartFilterPanelProps) {
//     const {
//         filters,
//         updateFilters,
//         clearFilters,
//         savedFilterSets,
//         saveFilterSet,
//         loadFilterSet,
//         deleteFilterSet
//     } = useFilterSystem();

//     const [expandedSections, setExpandedSections] = useState<Record<string, boolean>>({
//         risk: true,
//         industry: false,
//         region: false,
//         compliance: false,
//         financial: false,
//         saved: false
//     });

//     const [searchTerm, setSearchTerm] = useState('');
//     const [showSaveDialog, setShowSaveDialog] = useState(false);
//     const [newFilterSetName, setNewFilterSetName] = useState('');

//     // Calculate filter option counts based on current portfolio stats
//     const filterOptions = useMemo(() => {
//         if (!portfolioStats) return null;

//         return {
//             industries: Object.entries(portfolioStats.industryBreakdown).map(([industry, count]) => ({
//                 value: industry,
//                 label: industry,
//                 count,
//                 available: count > 0
//             })),
//             regions: Object.entries(portfolioStats.regionBreakdown).map(([region, count]) => ({
//                 value: region,
//                 label: region,
//                 count,
//                 available: count > 0
//             })),
//             complianceStatuses: Object.entries(portfolioStats.complianceBreakdown).map(([status, count]) => ({
//                 value: status,
//                 label: status.replace('_', ' ').toUpperCase(),
//                 count,
//                 available: count > 0
//             })),
//             riskGrades: Object.entries(portfolioStats.riskGradeBreakdown).map(([grade, count]) => ({
//                 value: grade,
//                 label: `Grade ${grade}`,
//                 count,
//                 available: count > 0
//             }))
//         };
//     }, [portfolioStats]);

//     // Filter suggestions based on current portfolio composition
//     const filterSuggestions = useMemo(() => {
//         if (!portfolioStats || !filterOptions) return [];

//         const suggestions = [];

//         // Suggest high-risk companies if they exist
//         const highRiskCount = (portfolioStats.riskGradeBreakdown['D'] || 0) + (portfolioStats.riskGradeBreakdown['E'] || 0);
//         if (highRiskCount > 0) {
//             suggestions.push({
//                 label: `High Risk Companies (${highRiskCount})`,
//                 filters: { riskGrades: ['D', 'E'] },
//                 type: 'risk' as const
//             });
//         }

//         // Suggest non-compliant companies
//         const nonCompliantCount = portfolioStats.complianceBreakdown['non_compliant'] || 0;
//         if (nonCompliantCount > 0) {
//             suggestions.push({
//                 label: `Non-Compliant Companies (${nonCompliantCount})`,
//                 filters: { complianceStatus: ['non_compliant'] },
//                 type: 'compliance' as const
//             });
//         }

//         // Suggest largest industry if it represents >30% of portfolio
//         const largestIndustry = Object.entries(portfolioStats.industryBreakdown)
//             .sort(([, a], [, b]) => b - a)[0];
//         if (largestIndustry && largestIndustry[1] / portfolioStats.totalCompanies > 0.3) {
//             suggestions.push({
//                 label: `${largestIndustry[0]} Focus (${largestIndustry[1]})`,
//                 filters: { industries: [largestIndustry[0]] },
//                 type: 'industry' as const
//             });
//         }

//         return suggestions;
//     }, [portfolioStats, filterOptions]);

//     const toggleSection = (section: string) => {
//         setExpandedSections(prev => ({
//             ...prev,
//             [section]: !prev[section]
//         }));
//     };

//     const handleSaveFilterSet = () => {
//         if (newFilterSetName.trim()) {
//             saveFilterSet(newFilterSetName.trim(), filters);
//             setNewFilterSetName('');
//             setShowSaveDialog(false);
//         }
//     };

//     const applySuggestion = (suggestion: typeof filterSuggestions[0]) => {
//         updateFilters(suggestion.filters);
//     };

//     const activeFilterCount = useMemo(() => {
//         let count = 0;
//         if (filters.industries?.length) count += filters.industries.length;
//         if (filters.regions?.length) count += filters.regions.length;
//         if (filters.riskGrades?.length) count += filters.riskGrades.length;
//         if (filters.complianceStatus?.length) count += filters.complianceStatus.length;
//         if (filters.searchTerm) count += 1;
//         return count;
//     }, [filters]);

//     return (
//         <Card className={`p-4 ${className}`}>
//             <div className="space-y-4">
//                 {/* Header */}
//                 <div className="flex items-center justify-between">
//                     <h3 className="text-lg font-semibold">Smart Filters</h3>
//                     <div className="flex items-center gap-2">
//                         {activeFilterCount > 0 && (
//                             <Badge variant="secondary">{activeFilterCount} active</Badge>
//                         )}
//                         <Button
//                             variant="outline"
//                             size="sm"
//                             onClick={clearFilters}
//                             disabled={activeFilterCount === 0}
//                         >
//                             Clear All
//                         </Button>
//                     </div>
//                 </div>

//                 {/* Search */}
//                 <div className="relative">
//                     <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
//                     <Input
//                         placeholder="Search companies..."
//                         value={searchTerm}
//                         onChange={(e) => {
//                             setSearchTerm(e.target.value);
//                             updateFilters({ searchTerm: e.target.value });
//                         }}
//                         className="pl-10"
//                     />
//                 </div>

//                 {/* Filter Suggestions */}
//                 {filterSuggestions.length > 0 && (
//                     <div className="space-y-2">
//                         <h4 className="text-sm font-medium text-gray-700">Quick Filters</h4>
//                         <div className="flex flex-wrap gap-2">
//                             {filterSuggestions.map((suggestion, index) => (
//                                 <Button
//                                     key={index}
//                                     variant="outline"
//                                     size="sm"
//                                     onClick={() => applySuggestion(suggestion)}
//                                     className="text-xs"
//                                 >
//                                     {suggestion.label}
//                                 </Button>
//                             ))}
//                         </div>
//                     </div>
//                 )}

//                 {/* Saved Filter Sets */}
//                 <div className="space-y-2">
//                     <div
//                         className="flex items-center justify-between cursor-pointer"
//                         onClick={() => toggleSection('saved')}
//                     >
//                         <h4 className="text-sm font-medium text-gray-700 flex items-center gap-2">
//                             <Bookmark className="h-4 w-4" />
//                             Saved Filters
//                         </h4>
//                         {expandedSections.saved ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
//                     </div>

//                     {expandedSections.saved && (
//                         <div className="space-y-2 pl-6">
//                             {savedFilterSets.map((filterSet) => (
//                                 <div key={filterSet.id} className="flex items-center justify-between">
//                                     <Button
//                                         variant="ghost"
//                                         size="sm"
//                                         onClick={() => loadFilterSet(filterSet.id)}
//                                         className="text-xs justify-start"
//                                     >
//                                         {filterSet.name}
//                                     </Button>
//                                     <Button
//                                         variant="ghost"
//                                         size="sm"
//                                         onClick={() => deleteFilterSet(filterSet.id)}
//                                         className="text-xs text-red-600 hover:text-red-700"
//                                     >
//                                         ×
//                                     </Button>
//                                 </div>
//                             ))}

//                             {showSaveDialog ? (
//                                 <div className="flex gap-2">
//                                     <Input
//                                         placeholder="Filter set name"
//                                         value={newFilterSetName}
//                                         onChange={(e) => setNewFilterSetName(e.target.value)}
//                                         className="text-xs"
//                                     />
//                                     <Button size="sm" onClick={handleSaveFilterSet}>Save</Button>
//                                     <Button size="sm" variant="outline" onClick={() => setShowSaveDialog(false)}>Cancel</Button>
//                                 </div>
//                             ) : (
//                                 <Button
//                                     variant="outline"
//                                     size="sm"
//                                     onClick={() => setShowSaveDialog(true)}
//                                     disabled={activeFilterCount === 0}
//                                     className="text-xs"
//                                 >
//                                     Save Current Filters
//                                 </Button>
//                             )}
//                         </div>
//                     )}
//                 </div>

//                 {/* Specialized Filter Panels */}
//                 <div className="space-y-4">
//                     {/* Compliance Filter Panel */}
//                     <div className="space-y-2">
//                         <div
//                             className="flex items-center justify-between cursor-pointer"
//                             onClick={() => toggleSection('compliance')}
//                         >
//                             <h4 className="text-sm font-medium text-gray-700">Compliance Filters</h4>
//                             {expandedSections.compliance ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
//                         </div>

//                         {expandedSections.compliance && (
//                             <SmartComplianceFilterPanel
//                                 complianceStats={complianceStats}
//                                 benchmarkData={benchmarkData}
//                                 onFilterChange={onFilterChange}
//                                 className="border-0 shadow-none p-0"
//                             />
//                         )}
//                     </div>

//                     {/* Region & Industry Filter Panel */}
//                     <div className="space-y-2">
//                         <div
//                             className="flex items-center justify-between cursor-pointer"
//                             onClick={() => toggleSection('region')}
//                         >
//                             <h4 className="text-sm font-medium text-gray-700">Region & Industry</h4>
//                             {expandedSections.region ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
//                         </div>

//                         {expandedSections.region && (
//                             <AdvancedRegionIndustryFilterPanel
//                                 regionData={regionData}
//                                 industryData={industryData}
//                                 onFilterChange={onFilterChange}
//                                 className="border-0 shadow-none p-0"
//                             />
//                         )}
//                     </div>

//                     {/* Financial Metrics Filter Panel */}
//                     <div className="space-y-2">
//                         <div
//                             className="flex items-center justify-between cursor-pointer"
//                             onClick={() => toggleSection('financial')}
//                         >
//                             <h4 className="text-sm font-medium text-gray-700">Financial Metrics</h4>
//                             {expandedSections.financial ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
//                         </div>

//                         {expandedSections.financial && (
//                             <FinancialMetricsFilterPanel
//                                 metrics={financialMetrics}
//                                 portfolioStats={portfolioStats}
//                                 onFilterChange={onFilterChange}
//                                 className="border-0 shadow-none p-0"
//                             />
//                         )}
//                     </div>
//                 </div>
//             </div>
//         </Card>
//     );
// }