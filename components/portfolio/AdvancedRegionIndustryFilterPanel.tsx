// 'use client';

// import React, { useState, useMemo } from 'react';
// import { Card } from '@/components/ui/Card';
// import { Badge } from '@/components/ui/Badge';
// import { Button } from '@/components/ui/Button';
// import { Input } from '@/components/ui/Input';
// import { Checkbox } from '@/components/ui/Checkbox';
// import { Select } from '@/components/ui/Select';
// import { useFilterSystem } from '@/lib/hooks/useFilterSystem';
// import {
//     MapPin,
//     Building2,
//     Search,
//     ChevronDown,
//     ChevronRight,
//     AlertTriangle,
//     TrendingUp,
//     Users
// } from 'lucide-react';

// interface RegionData {
//     state: string;
//     cities: Array<{
//         name: string;
//         count: number;
//         riskDistribution: Record<string, number>;
//     }>;
//     totalCompanies: number;
//     averageRiskScore: number;
//     concentrationRisk: 'low' | 'medium' | 'high';
// }

// interface IndustryData {
//     category: string;
//     subcategories: Array<{
//         name: string;
//         count: number;
//         averageRiskScore: number;
//         trend: 'up' | 'down' | 'stable';
//     }>;
//     totalCompanies: number;
//     marketShare: number;
//     concentrationRisk: 'low' | 'medium' | 'high';
// }

// interface AdvancedRegionIndustryFilterPanelProps {
//     regionData?: RegionData[];
//     industryData?: IndustryData[];
//     concentrationLimits?: {
//         regionWarningThreshold: number;
//         industryWarningThreshold: number;
//     };
//     onFilterChange?: (filters: any) => void;
//     className?: string;
// }

// export function AdvancedRegionIndustryFilterPanel({
//     regionData = [],
//     industryData = [],
//     concentrationLimits = { regionWarningThreshold: 0.3, industryWarningThreshold: 0.4 },
//     onFilterChange,
//     className = ''
// }: AdvancedRegionIndustryFilterPanelProps) {
//     const { state, updateFilter: updateFilters } = useFilterSystem();
//     const filters = state.filters

//     const [selectedRegions, setSelectedRegions] = useState<string[]>(filters.regions || []);
//     const [selectedCities, setSelectedCities] = useState<string[]>(filters.cities || []);
//     const [selectedIndustries, setSelectedIndustries] = useState<string[]>(filters.industries || []);
//     const [selectedSubcategories, setSelectedSubcategories] = useState<string[]>([]);

//     const [expandedStates, setExpandedStates] = useState<Set<string>>(new Set());
//     const [expandedIndustries, setExpandedIndustries] = useState<Set<string>>(new Set());

//     const [regionSearchTerm, setRegionSearchTerm] = useState('');
//     const [industrySearchTerm, setIndustrySearchTerm] = useState('');

//     // Calculate concentration warnings
//     const concentrationWarnings = useMemo(() => {
//         const warnings = [];

//         // Check region concentration
//         const totalCompanies = regionData.reduce((sum, region) => sum + region.totalCompanies, 0);
//         const highConcentrationRegions = regionData.filter(
//             region => region.totalCompanies / totalCompanies > concentrationLimits.regionWarningThreshold
//         );

//         if (highConcentrationRegions.length > 0) {
//             warnings.push({
//                 type: 'region' as const,
//                 message: `High concentration in ${highConcentrationRegions.map(r => r.state).join(', ')}`,
//                 severity: 'medium' as const,
//                 details: highConcentrationRegions.map(r => ({
//                     name: r.state,
//                     percentage: Math.round((r.totalCompanies / totalCompanies) * 100)
//                 }))
//             });
//         }

//         // Check industry concentration
//         const highConcentrationIndustries = industryData.filter(
//             industry => industry.marketShare > concentrationLimits.industryWarningThreshold
//         );

//         if (highConcentrationIndustries.length > 0) {
//             warnings.push({
//                 type: 'industry' as const,
//                 message: `High concentration in ${highConcentrationIndustries.map(i => i.category).join(', ')}`,
//                 severity: 'medium' as const,
//                 details: highConcentrationIndustries.map(i => ({
//                     name: i.category,
//                     percentage: Math.round(i.marketShare * 100)
//                 }))
//             });
//         }

//         return warnings;
//     }, [regionData, industryData, concentrationLimits]);

//     // Generate combination suggestions
//     const combinationSuggestions = useMemo(() => {
//         const suggestions = [];

//         // High-risk region + industry combinations
//         const highRiskRegions = regionData.filter(r => r.averageRiskScore > 70);
//         const highRiskIndustries = industryData.filter(i =>
//             i.subcategories.some(sub => sub.averageRiskScore > 70)
//         );

//         if (highRiskRegions.length > 0 && highRiskIndustries.length > 0) {
//             suggestions.push({
//                 label: 'High Risk Combinations',
//                 description: 'Focus on high-risk regions and industries',
//                 filters: {
//                     regions: highRiskRegions.slice(0, 2).map(r => r.state),
//                     industries: highRiskIndustries.slice(0, 2).map(i => i.category)
//                 }
//             });
//         }

//         // Diversification suggestions
//         const lowConcentrationRegions = regionData
//             .filter(r => r.concentrationRisk === 'low')
//             .slice(0, 3);
//         const lowConcentrationIndustries = industryData
//             .filter(i => i.concentrationRisk === 'low')
//             .slice(0, 3);

//         if (lowConcentrationRegions.length > 0 && lowConcentrationIndustries.length > 0) {
//             suggestions.push({
//                 label: 'Diversified Portfolio',
//                 description: 'Focus on well-diversified regions and industries',
//                 filters: {
//                     regions: lowConcentrationRegions.map(r => r.state),
//                     industries: lowConcentrationIndustries.map(i => i.category)
//                 }
//             });
//         }

//         return suggestions;
//     }, [regionData, industryData]);

//     // Filter data based on search terms
//     const filteredRegionData = useMemo(() => {
//         if (!regionSearchTerm) return regionData;
//         return regionData.filter(region =>
//             region.state.toLowerCase().includes(regionSearchTerm.toLowerCase()) ||
//             region.cities.some(city =>
//                 city.name.toLowerCase().includes(regionSearchTerm.toLowerCase())
//             )
//         );
//     }, [regionData, regionSearchTerm]);

//     const filteredIndustryData = useMemo(() => {
//         if (!industrySearchTerm) return industryData;
//         return industryData.filter(industry =>
//             industry.category.toLowerCase().includes(industrySearchTerm.toLowerCase()) ||
//             industry.subcategories.some(sub =>
//                 sub.name.toLowerCase().includes(industrySearchTerm.toLowerCase())
//             )
//         );
//     }, [industryData, industrySearchTerm]);

//     const toggleStateExpansion = (state: string) => {
//         const newExpanded = new Set(expandedStates);
//         if (newExpanded.has(state)) {
//             newExpanded.delete(state);
//         } else {
//             newExpanded.add(state);
//         }
//         setExpandedStates(newExpanded);
//     };

//     const toggleIndustryExpansion = (industry: string) => {
//         const newExpanded = new Set(expandedIndustries);
//         if (newExpanded.has(industry)) {
//             newExpanded.delete(industry);
//         } else {
//             newExpanded.add(industry);
//         }
//         setExpandedIndustries(newExpanded);
//     };

//     const handleRegionChange = (region: string, checked: boolean) => {
//         const newSelection = checked
//             ? [...selectedRegions, region]
//             : selectedRegions.filter(r => r !== region);

//         setSelectedRegions(newSelection);
//         updateFilters({ regions: newSelection });
//         onFilterChange?.({ regions: newSelection });
//     };

//     const handleCityChange = (city: string, checked: boolean) => {
//         const newSelection = checked
//             ? [...selectedCities, city]
//             : selectedCities.filter(c => c !== city);

//         setSelectedCities(newSelection);
//         updateFilters({ cities: newSelection });
//         onFilterChange?.({ cities: newSelection });
//     };

//     const handleIndustryChange = (industry: string, checked: boolean) => {
//         const newSelection = checked
//             ? [...selectedIndustries, industry]
//             : selectedIndustries.filter(i => i !== industry);

//         setSelectedIndustries(newSelection);
//         updateFilters({ industries: newSelection });
//         onFilterChange?.({ industries: newSelection });
//     };

//     const handleSubcategoryChange = (subcategory: string, checked: boolean) => {
//         const newSelection = checked
//             ? [...selectedSubcategories, subcategory]
//             : selectedSubcategories.filter(s => s !== subcategory);

//         setSelectedSubcategories(newSelection);
//         updateFilters({ subcategories: newSelection });
//         onFilterChange?.({ subcategories: newSelection });
//     };

//     const applySuggestion = (suggestion: typeof combinationSuggestions[0]) => {
//         updateFilters(suggestion.filters);
//         onFilterChange?.(suggestion.filters);
//     };

//     const getConcentrationBadge = (risk: 'low' | 'medium' | 'high') => {
//         const variants = {
//             low: 'success',
//             medium: 'warning',
//             high: 'destructive'
//         } as const;

//         return <Badge variant={variants[risk]} className="text-xs">{risk}</Badge>;
//     };

//     return (
//         <Card className={`p-4 ${className}`}>
//             <div className="space-y-6">
//                 {/* Header */}
//                 <div className="flex items-center gap-2">
//                     <MapPin className="h-5 w-5 text-blue-600" />
//                     <Building2 className="h-5 w-5 text-green-600" />
//                     <h3 className="text-lg font-semibold">Region & Industry Filters</h3>
//                 </div>

//                 {/* Concentration Warnings */}
//                 {concentrationWarnings.length > 0 && (
//                     <div className="space-y-2">
//                         {concentrationWarnings.map((warning, index) => (
//                             <div
//                                 key={index}
//                                 className="p-3 bg-yellow-50 border-l-4 border-yellow-400 text-yellow-800 rounded-lg"
//                             >
//                                 <div className="flex items-center gap-2 mb-2">
//                                     <AlertTriangle className="h-4 w-4" />
//                                     <span className="text-sm font-medium">{warning.message}</span>
//                                 </div>
//                                 <div className="text-xs space-y-1">
//                                     {warning.details.map((detail, idx) => (
//                                         <div key={idx} className="flex justify-between">
//                                             <span>{detail.name}</span>
//                                             <span className="font-medium">{detail.percentage}%</span>
//                                         </div>
//                                     ))}
//                                 </div>
//                             </div>
//                         ))}
//                     </div>
//                 )}

//                 {/* Combination Suggestions */}
//                 {combinationSuggestions.length > 0 && (
//                     <div className="space-y-2">
//                         <h4 className="text-sm font-medium text-gray-700">Smart Combinations</h4>
//                         <div className="space-y-2">
//                             {combinationSuggestions.map((suggestion, index) => (
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

//                 {/* Region Filters */}
//                 <div className="space-y-3">
//                     <div className="flex items-center gap-2">
//                         <MapPin className="h-4 w-4 text-blue-600" />
//                         <h4 className="text-sm font-medium text-gray-700">Regions</h4>
//                     </div>

//                     <div className="relative">
//                         <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
//                         <Input
//                             placeholder="Search regions or cities..."
//                             value={regionSearchTerm}
//                             onChange={(e) => setRegionSearchTerm(e.target.value)}
//                             className="pl-10 text-sm"
//                         />
//                     </div>

//                     <div className="max-h-64 overflow-y-auto space-y-2">
//                         {filteredRegionData.map((region) => (
//                             <div key={region.state} className="space-y-2">
//                                 <div className="flex items-center justify-between">
//                                     <div className="flex items-center gap-2">
//                                         <Checkbox
//                                             id={`region-${region.state}`}
//                                             checked={selectedRegions.includes(region.state)}
//                                             onCheckedChange={(checked) => handleRegionChange(region.state, checked as boolean)}
//                                         />
//                                         <Button
//                                             variant="ghost"
//                                             size="sm"
//                                             onClick={() => toggleStateExpansion(region.state)}
//                                             className="p-0 h-auto"
//                                         >
//                                             {expandedStates.has(region.state) ?
//                                                 <ChevronDown className="h-4 w-4" /> :
//                                                 <ChevronRight className="h-4 w-4" />
//                                             }
//                                         </Button>
//                                         <label
//                                             htmlFor={`region-${region.state}`}
//                                             className="text-sm font-medium cursor-pointer"
//                                         >
//                                             {region.state}
//                                         </label>
//                                     </div>
//                                     <div className="flex items-center gap-2">
//                                         <Badge variant="secondary" className="text-xs">
//                                             {region.totalCompanies}
//                                         </Badge>
//                                         {getConcentrationBadge(region.concentrationRisk)}
//                                     </div>
//                                 </div>

//                                 {expandedStates.has(region.state) && (
//                                     <div className="ml-8 space-y-1">
//                                         {region.cities.map((city) => (
//                                             <div key={city.name} className="flex items-center justify-between">
//                                                 <div className="flex items-center gap-2">
//                                                     <Checkbox
//                                                         id={`city-${city.name}`}
//                                                         checked={selectedCities.includes(city.name)}
//                                                         onCheckedChange={(checked) => handleCityChange(city.name, checked as boolean)}
//                                                     />
//                                                     <label
//                                                         htmlFor={`city-${city.name}`}
//                                                         className="text-sm cursor-pointer"
//                                                     >
//                                                         {city.name}
//                                                     </label>
//                                                 </div>
//                                                 <Badge variant="outline" className="text-xs">
//                                                     {city.count}
//                                                 </Badge>
//                                             </div>
//                                         ))}
//                                     </div>
//                                 )}
//                             </div>
//                         ))}
//                     </div>
//                 </div>

//                 {/* Industry Filters */}
//                 <div className="space-y-3">
//                     <div className="flex items-center gap-2">
//                         <Building2 className="h-4 w-4 text-green-600" />
//                         <h4 className="text-sm font-medium text-gray-700">Industries</h4>
//                     </div>

//                     <div className="relative">
//                         <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
//                         <Input
//                             placeholder="Search industries..."
//                             value={industrySearchTerm}
//                             onChange={(e) => setIndustrySearchTerm(e.target.value)}
//                             className="pl-10 text-sm"
//                         />
//                     </div>

//                     <div className="max-h-64 overflow-y-auto space-y-2">
//                         {filteredIndustryData.map((industry) => (
//                             <div key={industry.category} className="space-y-2">
//                                 <div className="flex items-center justify-between">
//                                     <div className="flex items-center gap-2">
//                                         <Checkbox
//                                             id={`industry-${industry.category}`}
//                                             checked={selectedIndustries.includes(industry.category)}
//                                             onCheckedChange={(checked) => handleIndustryChange(industry.category, checked as boolean)}
//                                         />
//                                         <Button
//                                             variant="ghost"
//                                             size="sm"
//                                             onClick={() => toggleIndustryExpansion(industry.category)}
//                                             className="p-0 h-auto"
//                                         >
//                                             {expandedIndustries.has(industry.category) ?
//                                                 <ChevronDown className="h-4 w-4" /> :
//                                                 <ChevronRight className="h-4 w-4" />
//                                             }
//                                         </Button>
//                                         <label
//                                             htmlFor={`industry-${industry.category}`}
//                                             className="text-sm font-medium cursor-pointer"
//                                         >
//                                             {industry.category}
//                                         </label>
//                                     </div>
//                                     <div className="flex items-center gap-2">
//                                         <Badge variant="secondary" className="text-xs">
//                                             {industry.totalCompanies}
//                                         </Badge>
//                                         <Badge variant="outline" className="text-xs">
//                                             {Math.round(industry.marketShare * 100)}%
//                                         </Badge>
//                                         {getConcentrationBadge(industry.concentrationRisk)}
//                                     </div>
//                                 </div>

//                                 {expandedIndustries.has(industry.category) && (
//                                     <div className="ml-8 space-y-1">
//                                         {industry.subcategories.map((subcategory) => (
//                                             <div key={subcategory.name} className="flex items-center justify-between">
//                                                 <div className="flex items-center gap-2">
//                                                     <Checkbox
//                                                         id={`subcategory-${subcategory.name}`}
//                                                         checked={selectedSubcategories.includes(subcategory.name)}
//                                                         onCheckedChange={(checked) => handleSubcategoryChange(subcategory.name, checked as boolean)}
//                                                     />
//                                                     <label
//                                                         htmlFor={`subcategory-${subcategory.name}`}
//                                                         className="text-sm cursor-pointer"
//                                                     >
//                                                         {subcategory.name}
//                                                     </label>
//                                                 </div>
//                                                 <div className="flex items-center gap-1">
//                                                     <Badge variant="outline" className="text-xs">
//                                                         {subcategory.count}
//                                                     </Badge>
//                                                     {subcategory.trend === 'up' && <TrendingUp className="h-3 w-3 text-green-600" />}
//                                                     {subcategory.trend === 'down' && <TrendingUp className="h-3 w-3 text-red-600 rotate-180" />}
//                                                 </div>
//                                             </div>
//                                         ))}
//                                     </div>
//                                 )}
//                             </div>
//                         ))}
//                     </div>
//                 </div>
//             </div>
//         </Card>
//     );
// }