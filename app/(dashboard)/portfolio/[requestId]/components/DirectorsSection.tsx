'use client'

import { PortfolioCompany } from '@/types/portfolio.types'
import { Card, CardContent, CardHeader } from '@/components/ui/Card'
import { Badge } from '@/components/ui/Badge'
import {
    Users,
    User,
    Calendar,
    Percent,
    AlertTriangle,
    Crown,
    Building,
    PieChart,
    ChevronDown,
    ChevronRight
} from 'lucide-react'
import { useState } from 'react'
import { formatDate } from '@/lib/utils'

interface DirectorsSectionProps {
    company: PortfolioCompany
}

export function DirectorsSection({ company }: DirectorsSectionProps) {
    const directors = company.extracted_data['Directors']
    const directorShareholding = company.extracted_data['Director Shareholding']
    const shareholding = company.extracted_data['Shareholding More Than 5%']

    // Collapsible section states
    const [shareholdingPatternOpen, setShareholdingPatternOpen] = useState(true)
    const [activeDirectorsOpen, setActiveDirectorsOpen] = useState(false)
    const [directorSummaryOpen, setDirectorSummaryOpen] = useState(false)
    const [formerDirectorsOpen, setFormerDirectorsOpen] = useState(false)

    if (!directors?.length && !shareholding) {
        return (
            <Card>
                <CardHeader>
                    <h2 className="text-xl font-semibold text-neutral-90 flex items-center gap-2">
                        <Users className="w-5 h-5" />
                        Directors & Shareholding
                    </h2>
                </CardHeader>
                <CardContent>
                    <div className="text-center py-8 text-neutral-60">
                        <AlertTriangle className="w-12 h-12 mx-auto mb-4 text-neutral-40" />
                        <p>Directors and shareholding data not available</p>
                    </div>
                </CardContent>
            </Card>
        )
    }

    // Name matching utility functions (replicated from Python)
    const normalizeNameForMatching = (name: string): string[] => {
        if (!name) return []
        
        const cleaned = name.toUpperCase().replace(/\./g, ' ').replace(/,/g, ' ').trim()
        return cleaned.split(/\s+/).filter(word => word && word.length > 0)
    }

    const namesMatch = (name1: string, name2: string): boolean => {
        const words1 = normalizeNameForMatching(name1)
        const words2 = normalizeNameForMatching(name2)

        if (!words1.length || !words2.length) return false

        // Exact match
        if (JSON.stringify(words1) === JSON.stringify(words2)) return true

        // Check if one name is subset of another
        const [shorter, longer] = words1.length <= words2.length ? [words1, words2] : [words2, words1]

        if (shorter.length >= 2) {
            let matches = 0
            for (const word of shorter) {
                if (word.length === 1) {
                    // Single letter initial
                    if (longer.some(longWord => longWord.startsWith(word))) {
                        matches++
                    }
                } else if (word.length === 2 && /^[A-Z]{2}$/.test(word)) {
                    // Two letter initials
                    if (longer.some(longWord => longWord.startsWith(word))) {
                        matches++
                    }
                } else {
                    // Full word
                    if (longer.includes(word)) {
                        matches++
                    }
                }
            }

            const requiredMatches = Math.max(1, Math.floor(shorter.length / 2) + 1)
            return matches >= requiredMatches
        }

        return false
    }

    // Create directors list from director data
    const directorsList: Array<{name: string, designation: string, isDirector: boolean}> = []
    
    if (directors?.data) {
        for (const director of directors.data) {
            const name = director.name?.trim() || ''
            const designation = director.present_designation?.trim() || ''
            if (name && designation && !director.date_of_cessation) {
                directorsList.push({
                    name,
                    designation,
                    isDirector: designation.toLowerCase().includes('director') || designation.toLowerCase().includes('secretary')
                })
            }
        }
    }

    // If no director data, try to infer from shareholding remarks
    if (directorsList.length === 0 && shareholding?.data) {
        const directorNamesFromDin = new Set<string>()
        for (const item of shareholding.data) {
            const remarks = item.remarks || ''
            if (remarks.toLowerCase().includes('person holding din')) {
                const name = item.entity_name?.trim() || ''
                if (name && !directorNamesFromDin.has(name)) {
                    directorsList.push({
                        name,
                        designation: 'Director',
                        isDirector: true
                    })
                    directorNamesFromDin.add(name)
                }
            }
        }
    }

    const findDirectorInfo = (shareholderName: string) => {
        return directorsList.find(director => namesMatch(shareholderName, director.name))
    }

    // Process shareholding data to create pattern table
    const shareholdingPattern: Array<{
        name: string
        relationship: string
        shareholding: number
        shareholdingStr: string
    }> = []

    let totalShareholding = 0

    if (shareholding?.data) {
        // Get latest year data
        let latestYear = ''
        for (const item of shareholding.data) {
            const year = item.financial_year_ending_on || ''
            if (!latestYear || year > latestYear) {
                latestYear = year
            }
        }

        if (latestYear) {
            for (const item of shareholding.data) {
                if (item.financial_year_ending_on === latestYear) {
                    const name = item.entity_name?.trim() || ''
                    const entityType = item.entity_type || ''
                    const shareholdingStr = item.shareholding || '0'

                    let shareholdingVal = 0
                    try {
                        shareholdingVal = parseFloat(shareholdingStr.replace('%', ''))
                    } catch {
                        shareholdingVal = 0
                    }

                    if (name && shareholdingVal > 0) {
                        const directorInfo = findDirectorInfo(name)
                        let relationship = 'Non-Director'

                        if (directorInfo) {
                            const designation = directorInfo.designation.toLowerCase()
                            if (designation.includes('managing')) {
                                relationship = 'Managing Director'
                            } else if (designation.includes('whole-time')) {
                                relationship = 'Whole-time Director'
                            } else if (designation.includes('company secretary')) {
                                relationship = 'Company Secretary'
                            } else if (designation.includes('director')) {
                                relationship = 'Director'
                            } else {
                                relationship = directorInfo.designation
                            }
                        } else {
                            // Determine relationship based on entity type and name
                            const nameLower = name.toLowerCase()
                            if (nameLower.includes('private limited') || nameLower.includes('limited')) {
                                relationship = 'Company'
                            } else if (nameLower.includes('trust')) {
                                relationship = 'Trust'
                            } else if (nameLower.includes('llp')) {
                                relationship = 'LLP'
                            } else if (entityType) {
                                const entityTypeLower = entityType.toLowerCase()
                                if (entityTypeLower.includes('company')) {
                                    relationship = 'Company'
                                } else if (entityTypeLower.includes('trust')) {
                                    relationship = 'Trust'
                                } else if (entityTypeLower.includes('individual')) {
                                    relationship = 'Non-Director'
                                }
                            }
                        }

                        shareholdingPattern.push({
                            name,
                            relationship,
                            shareholding: shareholdingVal,
                            shareholdingStr
                        })
                        totalShareholding += shareholdingVal
                    }
                }
            }
        }
    }

    // Sort by shareholding percentage (descending)
    shareholdingPattern.sort((a, b) => b.shareholding - a.shareholding)

    const formatShareholding = (shareholding: number): string => {
        if (shareholding < 0.001 && shareholding > 0) {
            return `${shareholding.toFixed(6)}%`
        } else if (shareholding < 0.01) {
            return `${shareholding.toFixed(5)}%`
        } else {
            return `${shareholding.toFixed(2)}%`
        }
    }

    const getDesignationBadge = (designation: string) => {
        const lower = designation?.toLowerCase() || ''
        if (lower.includes('managing director') || lower.includes('md')) {
            return { variant: 'primary' as const, icon: Crown }
        }
        if (lower.includes('director')) {
            return { variant: 'info' as const, icon: User }
        }
        if (lower.includes('ceo') || lower.includes('chief')) {
            return { variant: 'success' as const, icon: Crown }
        }
        return { variant: 'info' as const, icon: User }
    }

    const isActiveDirector = (director: any) => {
        return !director.date_of_cessation || director.date_of_cessation === '' || director.date_of_cessation === '-'
    }

    const activeDirectors = directors?.data?.filter(isActiveDirector) || []
    const inactiveDirectors = directors?.data?.filter(d => !isActiveDirector(d)) || []

    // Get latest reporting date
    const latestDate = '31-March-2024' // Based on Director Shareholding data

    return (
        <Card>
            <CardHeader>
                <h2 className="text-xl font-semibold text-neutral-90 flex items-center gap-2">
                    <Users className="w-5 h-5" />
                    Directors & Shareholding
                </h2>
            </CardHeader>

            <CardContent className="space-y-6">
                {/* Shareholding Pattern Table - Matching Python Output */}
                {shareholdingPattern.length > 0 && (
                    <div className="space-y-4">
                        <div 
                            className="flex items-center gap-2 cursor-pointer hover:bg-neutral-5 p-2 rounded-lg transition-colors"
                            onClick={() => setShareholdingPatternOpen(!shareholdingPatternOpen)}
                        >
                            {shareholdingPatternOpen ? (
                                <ChevronDown className="w-5 h-5 text-neutral-60" />
                            ) : (
                                <ChevronRight className="w-5 h-5 text-neutral-60" />
                            )}
                            <h3 className="text-lg font-semibold text-neutral-90 flex items-center gap-2">
                                <PieChart className="w-5 h-5" />
                                Share holding pattern above 5% as on {latestDate}
                            </h3>
                        </div>

                        {shareholdingPatternOpen && (
                            <div className="overflow-x-auto">
                                <table className="w-full border-collapse border border-neutral-300">
                                    <thead>
                                        <tr className="bg-neutral-20">
                                            <th className="border border-neutral-300 px-4 py-2 text-left font-semibold">S No</th>
                                            <th className="border border-neutral-300 px-4 py-2 text-left font-semibold">Name</th>
                                            <th className="border border-neutral-300 px-4 py-2 text-left font-semibold">
                                                Relationship if any<br />
                                                <span className="text-sm font-normal">(Director/Holding etc.)</span>
                                            </th>
                                            <th className="border border-neutral-300 px-4 py-2 text-left font-semibold">Shareholding (%)</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {shareholdingPattern.map((shareholder, index) => (
                                            <tr key={index} className="hover:bg-neutral-50">
                                                <td className="border border-neutral-300 px-4 py-2">{index + 1}</td>
                                                <td className="border border-neutral-300 px-4 py-2 font-medium">{shareholder.name}</td>
                                                <td className="border border-neutral-300 px-4 py-2">{shareholder.relationship}</td>
                                                <td className="border border-neutral-300 px-4 py-2">{formatShareholding(shareholder.shareholding)}</td>
                                            </tr>
                                        ))}
                                        <tr className="bg-neutral-20 font-bold">
                                            <td className="border border-neutral-300 px-4 py-2"></td>
                                            <td className="border border-neutral-300 px-4 py-2">Total</td>
                                            <td className="border border-neutral-300 px-4 py-2"></td>
                                            <td className="border border-neutral-300 px-4 py-2">{totalShareholding.toFixed(2)}%</td>
                                        </tr>
                                    </tbody>
                                </table>
                            </div>
                        )}
                    </div>
                )}

                {/* Active Directors */}
                {activeDirectors.length > 0 && (
                    <div className="space-y-4">
                        <div 
                            className="flex items-center gap-2 cursor-pointer hover:bg-neutral-5 p-2 rounded-lg transition-colors"
                            onClick={() => setActiveDirectorsOpen(!activeDirectorsOpen)}
                        >
                            {activeDirectorsOpen ? (
                                <ChevronDown className="w-5 h-5 text-neutral-60" />
                            ) : (
                                <ChevronRight className="w-5 h-5 text-neutral-60" />
                            )}
                            <h3 className="text-lg font-semibold text-neutral-90 flex items-center gap-2">
                                <User className="w-5 h-5" />
                                Active Directors ({activeDirectors.length})
                            </h3>
                        </div>

                        {activeDirectorsOpen && (
                            <div className="space-y-3">
                                {activeDirectors.map((director, index) => {
                                    const badge = getDesignationBadge(director.present_designation)
                                    const BadgeIcon = badge.icon
                                    const directorShares = directorShareholding?.data?.find(ds => 
                                        ds.name && director.name && namesMatch(ds.name, director.name)
                                    )

                                    return (
                                        <div key={index} className="p-4 border border-neutral-20 rounded-lg hover:bg-neutral-5 transition-colors">
                                            <div className="flex items-start justify-between mb-3">
                                                <div className="flex items-center gap-3">
                                                    <div className="p-2 bg-blue-50 rounded-lg">
                                                        <BadgeIcon className="w-5 h-5 text-blue-600" />
                                                    </div>
                                                    <div>
                                                        <div className="font-semibold text-neutral-90">{director.name}</div>
                                                        <div className="text-sm text-neutral-60">DIN: {director.din}</div>
                                                    </div>
                                                </div>
                                                <Badge variant={badge.variant} size="sm">
                                                    {director.present_designation}
                                                </Badge>
                                            </div>

                                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                                                <div>
                                                    <div className="text-neutral-60 mb-1">Appointment Date</div>
                                                    <div className="flex items-center gap-1 text-neutral-90">
                                                        <Calendar className="w-3 h-3" />
                                                        {director.original_appointment_date === '-'? '-' :formatDate(director.original_appointment_date)}
                                                    </div>
                                                </div>

                                                {directorShares && (
                                                    <>
                                                        <div>
                                                            <div className="text-neutral-60 mb-1">Shareholding</div>
                                                            <div className="flex items-center gap-1 text-neutral-90">
                                                                <Percent className="w-3 h-3" />
                                                                {directorShares.shareholding}%
                                                            </div>
                                                        </div>

                                                        <div>
                                                            <div className="text-neutral-60 mb-1">Shares Held</div>
                                                            <div className="text-neutral-90">
                                                                {parseInt(directorShares.number_of_shares || '0').toLocaleString()}
                                                            </div>
                                                        </div>
                                                    </>
                                                )}
                                            </div>
                                        </div>
                                    )
                                })}
                            </div>
                        )}
                    </div>
                )}

                {/* Director Shareholding Summary */}
                {directorShareholding?.data?.length > 0 && (
                    <div className="space-y-3">
                        <div 
                            className="flex items-center gap-2 cursor-pointer hover:bg-neutral-5 p-2 rounded-lg transition-colors"
                            onClick={() => setDirectorSummaryOpen(!directorSummaryOpen)}
                        >
                            {directorSummaryOpen ? (
                                <ChevronDown className="w-5 h-5 text-neutral-60" />
                            ) : (
                                <ChevronRight className="w-5 h-5 text-neutral-60" />
                            )}
                            <h4 className="font-medium text-neutral-90">Director Shareholding Summary</h4>
                        </div>
                        
                        {directorSummaryOpen && (
                            <div className="p-4 bg-neutral-5 rounded-lg">
                                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                                    <div className="text-center">
                                        <div className="text-lg font-semibold text-neutral-90 mb-1">
                                            {directorShareholding.data.filter(d => parseFloat(d.shareholding || '0') > 0).length}
                                        </div>
                                        <div className="text-neutral-60">Directors with Shares</div>
                                    </div>

                                    <div className="text-center">
                                        <div className="text-lg font-semibold text-neutral-90 mb-1">
                                            {directorShareholding.data.reduce((sum, ds) => sum + parseFloat(ds.shareholding || '0'), 0).toFixed(1)}%
                                        </div>
                                        <div className="text-neutral-60">Total Director Holding</div>
                                    </div>

                                    <div className="text-center">
                                        <div className="text-lg font-semibold text-neutral-90 mb-1">
                                            {Math.max(...directorShareholding.data.map(ds => parseFloat(ds.shareholding || '0'))).toFixed(1)}%
                                        </div>
                                        <div className="text-neutral-60">Highest Individual</div>
                                    </div>

                                    <div className="text-center">
                                        <div className="text-lg font-semibold text-neutral-90 mb-1">
                                            {directorShareholding.data.reduce((sum, ds) => sum + parseInt(ds.number_of_shares || '0'), 0).toLocaleString()}
                                        </div>
                                        <div className="text-neutral-60">Total Shares</div>
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>
                )}

                {/* Inactive Directors */}
                {inactiveDirectors.length > 0 && (
                    <div className="space-y-4">
                        <div 
                            className="flex items-center gap-2 cursor-pointer hover:bg-neutral-5 p-2 rounded-lg transition-colors"
                            onClick={() => setFormerDirectorsOpen(!formerDirectorsOpen)}
                        >
                            {formerDirectorsOpen ? (
                                <ChevronDown className="w-5 h-5 text-neutral-60" />
                            ) : (
                                <ChevronRight className="w-5 h-5 text-neutral-60" />
                            )}
                            <h3 className="text-lg font-semibold text-neutral-90 flex items-center gap-2">
                                <AlertTriangle className="w-5 h-5" />
                                Former Directors ({inactiveDirectors.length})
                            </h3>
                        </div>

                        {formerDirectorsOpen && (
                            <div className="space-y-2">
                                {inactiveDirectors.map((director, index) => (
                                    <div key={index} className="p-3 bg-gray-50 rounded-lg">
                                        <div className="flex items-center justify-between">
                                            <div>
                                                <div className="font-medium text-neutral-90">{director.name}</div>
                                                <div className="text-sm text-neutral-60">
                                                    {director.present_designation} • DIN: {director.din}
                                                </div>
                                            </div>
                                            <div className="text-right text-sm">
                                                <div className="text-neutral-60">Ceased</div>
                                                <div className="text-neutral-90">
                                                    {formatDate(director.date_of_cessation)}
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                )}

                {/* Governance Summary */}
                <div className="p-4 bg-blue-50 rounded-lg">
                    <div className="flex items-center gap-2 mb-2">
                        <Building className="w-4 h-4 text-blue-600" />
                        <span className="font-medium text-blue-900">Governance Summary</span>
                    </div>
                    <div className="text-sm text-blue-700">
                        {activeDirectors.length >= 3
                            ? "Adequate board composition with sufficient director oversight."
                            : activeDirectors.length >= 2
                                ? "Minimal board composition - consider adding independent directors."
                                : "Limited board oversight - governance structure may need strengthening."
                        }
                    </div>

                    <div className="mt-3 grid grid-cols-2 gap-4 text-xs">
                        <div>
                            <div className="text-blue-600">Board Size</div>
                            <div className="font-medium text-blue-900">
                                {activeDirectors.length} Active Directors
                            </div>
                        </div>
                        <div>
                            <div className="text-blue-600">Total Director Holding</div>
                            <div className="font-medium text-blue-900">
                                {directorShareholding?.data ? 
                                    directorShareholding.data.reduce((sum, ds) => sum + parseFloat(ds.shareholding || '0'), 0).toFixed(1) + '%'
                                    : '0%'
                                }
                            </div>
                        </div>
                    </div>
                </div>
            </CardContent>
        </Card>
    )
}