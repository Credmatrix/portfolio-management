// 'use client';

// import React, { useState, useEffect, useMemo } from 'react';
// import { Card } from '@/components/ui/Card';
// import { Badge } from '@/components/ui/Badge';
// import { Button } from '@/components/ui/Button';
// import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/Tabs';
// import { SmartFilterPanel } from './SmartFilterPanel';
// import { SmartComplianceFilterPanel } from './SmartComplianceFilterPanel';
// import { AdvancedRegionIndustryFilterPanel } from './AdvancedRegionIndustryFilterPanel';
// import { FinancialMetricsFilterPanel } from './FinancialMetricsFilterPanel';
// import { useFilterSystem } from '@/lib/hooks/useFilterSystem';
// import {
//     Filter,
//     Shield,
//     MapPin,
//     Building2,
//     BarChart3,
//     Settings,
//     BookmarkPlus,
//     RotateCcw,
//     Download,
//     Upload
// } from 'lucide-react';
// import type { FilterState } from '@/types/filter.types';

// interface FilterPanelData {
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
// }

// interface EnhancedFilterPanelManagerProps {
//     data?: FilterPanelData;
//     onFilterChange?: (filters: FilterState) => void;
//     onExportFilters?: () => void;
//     onImportFilters?: (filters: FilterState) => void;
//     className?: string;
// }

// export function EnhancedFilterPanelManager({
//     data = {},
//     onFilterChange,
//     onExportFilters,
//     onImportFilters,
//     className = ''
// }: EnhancedFilterPanelManagerProps) {
//     const filterSystem = useFilterSystem();
//     const [activeTab, setActiveTab] = useState('overview');
//     const [showAdvancedOptions, setShowAdvancedOptions] = useState(false);

//     // Calculate total active filters across all categories
//     const totalActiveFilters = useMemo(() => {
//         let count = 0;
//         const filters = filterSystem.currentFilters;

//         if (filters.industries?.length) count += filters.industries.length;
//         if (filters.regions?.length) count += filters.regions.length;
//         if (filters.cities?.length) count += filters.cities.length;
//         if (filters.riskGrades?.length) count += filters.riskGrades.length;
//         if (filters.complianceStatus?.length) count += filters.complianceStatus.length;
//         if (filters.financialMetrics && Object.keys(filters.financialMetrics).length) {
//             count += Object.keys(filters.financialMetrics).length;
//         }
//         if (filters.searchTerm) count += 1;

//         return count;
//     }, [filterSystem.currentFilters]);

//     // Calculate filter impact
//     const filterImpact = useMemo(() => {
//         if (!data.portfolioStats) return null;

//         const totalCompanies = data.portfolioStats.totalCompanies;
//         // This would be calculated based on actual filtered results
//         const estimatedFilteredCount = Math.floor(totalCompanies * 0.7); // Placeholder

//         return {
//             totalCompanies,
//             filteredCount: estimatedFilteredCount,
//             reductionPercentage: Math.round(((totalCompanies - estimatedFilteredCount) / totalCompanies) * 100)
//         };
//     }, [data.portfolioStats, filterSystem.currentFilters]);

//     const handleFilterChange = (newFilters: Partial<FilterState>) => {
//         filterSystem.updateFilters(newFilters);
//         onFilterChange?.(filterSystem.currentFilters);
//     };

//     const handleClearAllFilters = () => {
//         filterSystem.clearAllFilters();
//         onFilterChange?.(filterSystem.currentFilters);
//     };

//     const handleExportFilters = () => {
//         const filtersToExport = {
//             filters: filterSystem.currentFilters,
//             timestamp: new Date().toISOString(),
//             version: '1.0'
//         };

//         const blob = new Blob([JSON.stringify(filtersToExport, null, 2)], {
//             type: 'application/json'
//         });

//         const url = URL.createObjectURL(blob);
//         const a = document.createElement('a');
//         a.href = url;
//         a.download = `portfolio-filters-${new Date().toISOString().split('T')[0]}.json`;
//         document.body.appendChild(a);
//         a.click();
//         document.body.removeChild(a);
//         URL.revokeObjectURL(url);

//         onExportFilters?.();
//     };

//     const handleImportFilters = (event: React.ChangeEvent<HTMLInputElement>) => {
//         const file = event.target.files?.[0];
//         if (!file) return;

//         const reader = new FileReader();
//         reader.onload = (e) => {
//             try {
//                 const importedData = JSON.parse(e.target?.result as string);
//                 if (importedData.filters) {
//                     filterSystem.updateFilters(importedData.filters);
//                     onImportFilters?.(importedData.filters);
//                     onFilterChange?.(importedData.filters);
//                 }
//             } catch (error) {
//                 console.error('Failed to import filters:', error);
//             }
//         };
//         reader.readAsText(file);
//     };

//     return (
//         <div className={`space-y-4 ${className}`}>
//             {/* Filter Summary Header */}
//             <Card className="p-4">
//                 <div className="flex items-center justify-between mb-4">
//                     <div className="flex items-center gap-3">
//                         <Filter className="h-5 w-5 text-blue-600" />
//                         <h2 className="text-xl font-semibold">Portfolio Filters</h2>
//                         {totalActiveFilters > 0 && (
//                             <Badge variant="secondary" className="ml-2">
//                                 {totalActiveFilters} active
//                             </Badge>
//                         )}
//                     </div>

//                     <div className="flex items-center gap-2">
//                         <Button
//                             variant="outline"
//                             size="sm"
//                             onClick={() => setShowAdvancedOptions(!showAdvancedOptions)}
//                         >
//                             <Settings className="h-4 w-4 mr-1" />
//                             Advanced
//                         </Button>
//                         <Button
//                             variant="outline"
//                             size="sm"
//                             onClick={handleClearAllFilters}
//                             disabled={totalActiveFilters === 0}
//                         >
//                             <RotateCcw className="h-4 w-4 mr-1" />
//                             Clear All
//                         </Button>
//                     </div>
//                 </div>

//                 {/* Filter Impact Summary */}
//                 {filterImpact && (
//                     <div className="grid grid-cols-3 gap-4 text-center">
//                         <div>
//                             <div className="text-2xl font-bold text-blue-600">
//                                 {filterImpact.totalCompanies}
//                             </div>
//                             <div className="text-sm text-gray-600">Total Companies</div>
//                         </div>
//                         <div>
//                             <div className="text-2xl font-bold text-green-600">
//                                 {filterImpact.filteredCount}
//                             </div>
//                             <div className="text-sm text-gray-600">Matching Filters</div>
//                         </div>
//                         <div>
//                             <div className="text-2xl font-bold text-orange-600">
//                                 {filterImpact.reductionPercentage}%
//                             </div>
//                             <div className="text-sm text-gray-600">Filtered Out</div>
//                         </div>
//                     </div>
//                 )}

//                 {/* Advanced Options */}
//                 {showAdvancedOptions && (
//                     <div className="mt-4 pt-4 border-t border-gray-200">
//                         <div className="flex items-center gap-2">
//                             <Button
//                                 variant="outline"
//                                 size="sm"
//                                 onClick={handleExportFilters}
//                                 disabled={totalActiveFilters === 0}
//                             >
//                                 <Download className="h-4 w-4 mr-1" />
//                                 Export Filters
//                             </Button>

//                             <div className="relative">
//                                 <input
//                                     type="file"
//                                     accept=".json"
//                                     onChange={handleImportFilters}
//                                     className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
//                                 />
//                                 <Button variant="outline" size="sm">
//                                     <Upload className="h-4 w-4 mr-1" />
//                                     Import Filters
//                                 </Button>
//                             </div>

//                             {filterSystem.hasConflicts && (
//                                 <Badge variant="destructive" className="ml-2">
//                                     Filter Conflicts Detected
//                                 </Badge>
//                             )}
//                         </div>
//                     </div>
//                 )}
//             </Card>

//             {/* Filter Panels */}
//             <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
//                 <TabsList className="grid w-full grid-cols-5">
//                     <TabsTrigger value="overview" className="flex items-center gap-1">
//                         <Filter className="h-4 w-4" />
//                         Overview
//                     </TabsTrigger>
//                     <TabsTrigger value="compliance" className="flex items-center gap-1">
//                         <Shield className="h-4 w-4" />
//                         Compliance
//                     </TabsTrigger>
//                     <TabsTrigger value="location" className="flex items-center gap-1">
//                         <MapPin className="h-4 w-4" />
//                         <Building2 className="h-4 w-4" />
//                         Location
//                     </TabsTrigger>
//                     <TabsTrigger value="financial" className="flex items-center gap-1">
//                         <BarChart3 className="h-4 w-4" />
//                         Financial
//                     </TabsTrigger>
//                     <TabsTrigger value="saved" className="flex items-center gap-1">
//                         <BookmarkPlus className="h-4 w-4" />
//                         Saved
//                     </TabsTrigger>
//                 </TabsList>

//                 <TabsContent value="overview" className="mt-4">
//                     <SmartFilterPanel
//                         portfolioStats={data.portfolioStats}
//                         complianceStats={data.complianceStats}
//                         regionData={data.regionData}
//                         industryData={data.industryData}
//                         financialMetrics={data.financialMetrics}
//                         benchmarkData={data.benchmarkData}
//                         onFilterChange={handleFilterChange}
//                     />
//                 </TabsContent>

//                 <TabsContent value="compliance" className="mt-4">
//                     <SmartComplianceFilterPanel
//                         complianceStats={data.complianceStats}
//                         benchmarkData={data.benchmarkData}
//                         onFilterChange={handleFilterChange}
//                     />
//                 </TabsContent>

//                 <TabsContent value="location" className="mt-4">
//                     <AdvancedRegionIndustryFilterPanel
//                         regionData={data.regionData}
//                         industryData={data.industryData}
//                         onFilterChange={handleFilterChange}
//                     />
//                 </TabsContent>

//                 <TabsContent value="financial" className="mt-4">
//                     <FinancialMetricsFilterPanel
//                         metrics={data.financialMetrics}
//                         portfolioStats={data.portfolioStats}
//                         onFilterChange={handleFilterChange}
//                     />
//                 </TabsContent>

//                 <TabsContent value="saved" className="mt-4">
//                     <Card className="p-4">
//                         <div className="space-y-4">
//                             <h3 className="text-lg font-semibold">Saved Filter Sets</h3>

//                             {filterSystem.savedFilterSets.length === 0 ? (
//                                 <div className="text-center py-8 text-gray-500">
//                                     <BookmarkPlus className="h-12 w-12 mx-auto mb-4 text-gray-300" />
//                                     <p>No saved filter sets yet</p>
//                                     <p className="text-sm">Create filters and save them for quick access</p>
//                                 </div>
//                             ) : (
//                                 <div className="space-y-2">
//                                     {filterSystem.savedFilterSets.map((filterSet) => (
//                                         <div key={filterSet.id} className="flex items-center justify-between p-3 border rounded-lg">
//                                             <div>
//                                                 <div className="font-medium">{filterSet.name}</div>
//                                                 <div className="text-sm text-gray-600">
//                                                     Created: {new Date(filterSet.createdAt).toLocaleDateString()}
//                                                 </div>
//                                             </div>
//                                             <div className="flex items-center gap-2">
//                                                 <Button
//                                                     variant="outline"
//                                                     size="sm"
//                                                     onClick={() => filterSystem.loadFilterSet(filterSet.id)}
//                                                 >
//                                                     Load
//                                                 </Button>
//                                                 <Button
//                                                     variant="outline"
//                                                     size="sm"
//                                                     onClick={() => filterSystem.deleteFilterSet(filterSet.id)}
//                                                     className="text-red-600 hover:text-red-700"
//                                                 >
//                                                     Delete
//                                                 </Button>
//                                             </div>
//                                         </div>
//                                     ))}
//                                 </div>
//                             )}
//                         </div>
//                     </Card>
//                 </TabsContent>
//             </Tabs>
//         </div>
//     );
// }