'use client'

import { useState, useMemo, useEffect } from 'react'
import { Card, CardContent, CardHeader } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import {
    Building2,
    Network,
    Search,
    Filter,
    Grid3X3,
    List,
    Download,
    ZoomIn,
    ZoomOut,
    RotateCcw,
    ChevronDown,
    ChevronRight,
    Table,
    GitBranch,
    Users,
    Percent,
    ArrowRight,
    Eye,
    MapPin,
    TrendingUp,
    ChevronUp
} from 'lucide-react'

interface RelatedCorporate {
    corporate_name: string
    relationship: string
    financial_year_ending_on: string
    percentage?: string
}

type ViewMode = 'hierarchy' | 'table' | 'cards'

export function CorporateHierarchyVisualization({ company }) {
    // const company = mockCompany
    const [viewMode, setViewMode] = useState<ViewMode>('hierarchy')
    const [selectedCategory, setSelectedCategory] = useState<string | null>(null)
    const [searchTerm, setSearchTerm] = useState('')
    const [showFilters, setShowFilters] = useState(false)

    // Extract and categorize data with improved logic
    const categorizedData = useMemo(() => {
        const data = company.extracted_data?.["Related Corporates"]?.data || []
        const latestYear = data.reduce((latest, item) => {
            const year = item.financial_year_ending_on || ""
            return year > latest ? year : latest
        }, "")

        const filtered = data.filter(item => item.financial_year_ending_on === latestYear)

        const categories = {
            holdings: filtered.filter(item =>
                item.relationship?.toUpperCase().includes("HOLDING") ||
                item.relationship?.toUpperCase().includes("PARENT")
            ),
            subsidiaries: filtered.filter(item =>
                item.relationship?.toUpperCase().includes("SUBSIDIARY") ||
                (item.percentage === "100%" && !item.relationship?.toUpperCase().includes("JOINT"))
            ),
            associates: filtered.filter(item =>
                item.relationship?.toUpperCase().includes("ASSOCIATE") ||
                (item.percentage && parseInt(item.percentage) < 50 && parseInt(item.percentage) > 20)
            ),
            jointVentures: filtered.filter(item =>
                item.relationship?.toUpperCase().includes("JOINT VENTURE") ||
                item.relationship?.toUpperCase().includes("JOINT") ||
                (item.percentage && parseInt(item.percentage) === 50)
            ),
            partnerships: filtered.filter(item =>
                item.relationship?.toUpperCase().includes("PARTNERSHIP")
            )
        }

        return categories
    }, [company.extracted_data])

    const stats = useMemo(() => {
        return {
            holdings: categorizedData.holdings.length,
            subsidiaries: categorizedData.subsidiaries.length,
            associates: categorizedData.associates.length,
            jointVentures: categorizedData.jointVentures.length,
            partnerships: categorizedData.partnerships.length,
            total: Object.values(categorizedData).reduce((sum, arr) => sum + arr.length, 0)
        }
    }, [categorizedData])

    // Improved Hierarchy View with Microsoft Fluent Design
    const HierarchyView = () => {
        const CategoryCard = ({
            title,
            count,
            icon: Icon,
            companies,
            colorScheme,
            type
        }: {
            title: string
            count: number
            icon: any
            companies: RelatedCorporate[]
            colorScheme: string
            type: string
        }) => {
            const isExpanded = selectedCategory === type

            return (
                <div className={`relative bg-white border border-gray-200 rounded-lg transition-all duration-300 hover:border-gray-300 hover:shadow-md ${isExpanded ? 'col-span-full lg:col-span-2 shadow-lg z-10' : ''
                    }`}>

                    {/* Header */}
                    <div
                        className="p-6 cursor-pointer"
                        onClick={() => setSelectedCategory(isExpanded ? null : type)}
                    >
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-4">
                                <div className={`p-3 rounded-lg ${colorScheme}-bg`}>
                                    <Icon className={`w-5 h-5 ${colorScheme}-icon`} />
                                </div>
                                <div>
                                    <h3 className="text-base font-semibold text-gray-900">{title}</h3>
                                    <p className="text-sm text-gray-600">{count} {count === 1 ? 'entity' : 'entities'}</p>
                                </div>
                            </div>
                            <div className="flex items-center gap-3">
                                <div className={`px-3 py-1 rounded-full text-lg font-semibold ${colorScheme}-badge`}>
                                    {count}
                                </div>
                                {isExpanded ? (
                                    <ChevronUp className="w-5 h-5 text-gray-400" />
                                ) : (
                                    <ChevronDown className="w-5 h-5 text-gray-400" />
                                )}
                            </div>
                        </div>

                        {!isExpanded && count > 0 && (
                            <div className="mt-4 pt-4 border-t border-gray-100">
                                <div className="text-xs font-medium text-gray-500 mb-2 uppercase tracking-wide">Recent Entities</div>
                                <div className="space-y-2">
                                    {companies.slice(0, 2).map((company, idx) => (
                                        <div key={idx} className="flex items-center justify-between text-sm">
                                            <span className="text-gray-700 truncate flex-1 mr-3">{company.corporate_name}</span>
                                            {company.percentage && (
                                                <span className="text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded">
                                                    {company.percentage}
                                                </span>
                                            )}
                                        </div>
                                    ))}
                                    {companies.length > 2 && (
                                        <div className="text-xs text-gray-500 pt-1">
                                            +{companies.length - 2} more entities
                                        </div>
                                    )}
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Expanded content */}
                    {isExpanded && (
                        <div className="px-6 pb-6 border-t border-gray-100">
                            <div className="mt-4 max-h-80 overflow-y-auto">
                                <div className="space-y-2">
                                    {companies.map((company, idx) => (
                                        <div key={idx} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
                                            <div className="flex items-center gap-3 flex-1 min-w-0">
                                                <Building2 className="w-4 h-4 text-gray-500 flex-shrink-0" />
                                                <div className="min-w-0 flex-1">
                                                    <div className="font-medium text-gray-900 truncate">{company.corporate_name}</div>
                                                    <div className="text-xs text-gray-500">{company.relationship}</div>
                                                </div>
                                            </div>
                                            {company.percentage && (
                                                <div className={`px-3 py-1 rounded-full text-sm font-medium ${colorScheme}-badge ml-3 flex-shrink-0`}>
                                                    {company.percentage}
                                                </div>
                                            )}
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            )
        }

        return (
            <div className="space-y-8">
                {/* Main Company - Center piece with Fluent design */}
                <div className="text-center">
                    <div className="inline-block relative">
                        <div className="bg-white border-2 border-blue-200 p-8 rounded-xl shadow-sm">
                            <div className="flex items-center gap-4">
                                <div className="p-4 bg-blue-50 rounded-xl">
                                    <Building2 className="w-8 h-8 text-blue-600" />
                                </div>
                                <div className="text-left">
                                    <h2 className="text-xl font-semibold text-gray-900">{company.company_name}</h2>
                                    <p className="text-gray-600 text-sm">Main Company</p>
                                </div>
                            </div>
                        </div>

                        {/* Connection line */}
                        <div className="absolute top-full left-1/2 transform -translate-x-1/2">
                            <div className="w-px h-8 bg-gray-300"></div>
                        </div>
                    </div>
                </div>

                {/* Categories Grid with professional styling */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                    <CategoryCard
                        title="Holdings"
                        count={stats.holdings}
                        icon={TrendingUp}
                        companies={categorizedData.holdings}
                        colorScheme="blue"
                        type="holdings"
                    />

                    <CategoryCard
                        title="Subsidiaries"
                        count={stats.subsidiaries}
                        icon={Building2}
                        companies={categorizedData.subsidiaries}
                        colorScheme="purple"
                        type="subsidiaries"
                    />

                    <CategoryCard
                        title="Associates"
                        count={stats.associates}
                        icon={Users}
                        companies={categorizedData.associates}
                        colorScheme="orange"
                        type="associates"
                    />

                    <CategoryCard
                        title="Joint Ventures"
                        count={stats.jointVentures}
                        icon={GitBranch}
                        companies={categorizedData.jointVentures}
                        colorScheme="green"
                        type="jointVentures"
                    />
                </div>

                {/* Summary Stats with Fluent design */}
                <div className="bg-gray-50 border border-gray-200 rounded-xl p-6">
                    <div className="flex items-center justify-between">
                        <div>
                            <h3 className="text-lg font-semibold text-gray-900">Network Summary</h3>
                            <p className="text-gray-600">Total of {stats.total} related entities across all categories</p>
                        </div>
                        <div className="flex items-center gap-8">
                            <div className="text-center">
                                <div className="text-3xl font-bold text-gray-900">{stats.total}</div>
                                <div className="text-xs text-gray-600 uppercase tracking-wide">Total Entities</div>
                            </div>
                            <div className="text-center">
                                <div className="text-3xl font-bold text-green-600">
                                    {categorizedData.subsidiaries.filter(s => s.percentage === "100%").length}
                                </div>
                                <div className="text-xs text-gray-600 uppercase tracking-wide">Fully Owned</div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        )
    }

    // Completely redesigned Network View with proper positioning
    const NetworkView = () => {
        const allCompanies = [
            ...categorizedData.subsidiaries.map(c => ({ ...c, type: 'subsidiary', color: '#8B5CF6' })),
            ...categorizedData.jointVentures.map(c => ({ ...c, type: 'jointVenture', color: '#10B981' })),
            ...categorizedData.associates.map(c => ({ ...c, type: 'associate', color: '#F59E0B' })),
            ...categorizedData.holdings.map(c => ({ ...c, type: 'holding', color: '#3B82F6' }))
        ]

        // Better positioning algorithm
        const getNodePosition = (index: number, total: number, radius: number, centerX: number, centerY: number) => {
            const angle = (index / total) * 2 * Math.PI - Math.PI / 2
            return {
                x: centerX + Math.cos(angle) * radius,
                y: centerY + Math.sin(angle) * radius
            }
        }

        const centerX = 500
        const centerY = 300
        const mainRadius = 80
        const nodeRadius = 45
        const connectionRadius = 200

        return (
            <div className="bg-white border border-gray-200 rounded-xl p-8">
                <svg width="100%" height="600" viewBox="0 0 1000 600" className="overflow-visible">
                    <defs>
                        <filter id="shadow" x="-50%" y="-50%" width="200%" height="200%">
                            <feDropShadow dx="0" dy="2" stdDeviation="3" floodColor="#00000010" />
                        </filter>
                        <marker id="arrowhead" markerWidth="8" markerHeight="6" refX="7" refY="3" orient="auto" fill="#6B7280">
                            <polygon points="0 0, 8 3, 0 6" />
                        </marker>
                    </defs>

                    {/* Connection lines */}
                    {allCompanies.slice(0, 10).map((company, idx) => {
                        const pos = getNodePosition(idx, allCompanies.length, connectionRadius, centerX, centerY)
                        const dx = pos.x - centerX
                        const dy = pos.y - centerY
                        const length = Math.sqrt(dx * dx + dy * dy)
                        const startX = centerX + (dx / length) * (mainRadius + 10)
                        const startY = centerY + (dy / length) * (mainRadius + 10)
                        const endX = pos.x - (dx / length) * (nodeRadius + 10)
                        const endY = pos.y - (dy / length) * (nodeRadius + 10)

                        return (
                            <line
                                key={`line-${idx}`}
                                x1={startX}
                                y1={startY}
                                x2={endX}
                                y2={endY}
                                stroke="#E5E7EB"
                                strokeWidth="2"
                                markerEnd="url(#arrowhead)"
                            />
                        )
                    })}

                    {/* Central company */}
                    <g transform={`translate(${centerX}, ${centerY})`}>
                        <circle
                            r={mainRadius}
                            fill="white"
                            stroke="#3B82F6"
                            strokeWidth="3"
                            filter="url(#shadow)"
                        />
                        <text
                            textAnchor="middle"
                            dy="-10"
                            className="text-sm font-semibold fill-gray-900"
                            style={{ fontSize: '14px' }}
                        >
                            ZETWERK
                        </text>
                        <text
                            textAnchor="middle"
                            dy="5"
                            className="text-xs fill-gray-600"
                            style={{ fontSize: '12px' }}
                        >
                            MANUFACTURING
                        </text>
                        <text
                            textAnchor="middle"
                            dy="20"
                            className="text-xs fill-gray-600"
                            style={{ fontSize: '12px' }}
                        >
                            BUSINESSES PVT LTD
                        </text>
                    </g>

                    {/* Related companies */}
                    {allCompanies.slice(0, 10).map((company, idx) => {
                        const pos = getNodePosition(idx, allCompanies.length, connectionRadius, centerX, centerY)
                        const words = company.corporate_name.split(' ')
                        const line1 = words.slice(0, 2).join(' ')
                        const line2 = words.slice(2, 4).join(' ')
                        const line3 = words.length > 4 ? '...' : ''

                        return (
                            <g key={idx}>
                                <circle
                                    cx={pos.x}
                                    cy={pos.y}
                                    r={nodeRadius}
                                    fill="white"
                                    stroke={company.color}
                                    strokeWidth="2"
                                    filter="url(#shadow)"
                                />

                                {/* Company name - multi-line with better spacing */}
                                <text
                                    x={pos.x}
                                    y={pos.y - 15}
                                    textAnchor="middle"
                                    className="text-xs font-medium fill-gray-900"
                                    style={{ fontSize: '11px' }}
                                >
                                    {line1}
                                </text>
                                {line2 && (
                                    <text
                                        x={pos.x}
                                        y={pos.y - 3}
                                        textAnchor="middle"
                                        className="text-xs font-medium fill-gray-900"
                                        style={{ fontSize: '11px' }}
                                    >
                                        {line2}
                                    </text>
                                )}
                                {line3 && (
                                    <text
                                        x={pos.x}
                                        y={pos.y + 9}
                                        textAnchor="middle"
                                        className="text-xs fill-gray-600"
                                        style={{ fontSize: '10px' }}
                                    >
                                        {line3}
                                    </text>
                                )}

                                {/* Percentage label outside the circle */}
                                {company.percentage && (
                                    <text
                                        x={pos.x}
                                        y={pos.y + nodeRadius + 20}
                                        textAnchor="middle"
                                        className="text-xs font-semibold"
                                        fill={company.color}
                                        style={{ fontSize: '12px' }}
                                    >
                                        {company.percentage}
                                    </text>
                                )}

                                {/* Type indicator */}
                                <circle
                                    cx={pos.x + nodeRadius - 10}
                                    cy={pos.y - nodeRadius + 10}
                                    r="8"
                                    fill={company.color}
                                />
                                <text
                                    x={pos.x + nodeRadius - 10}
                                    y={pos.y - nodeRadius + 14}
                                    textAnchor="middle"
                                    className="text-xs font-bold fill-white"
                                    style={{ fontSize: '10px' }}
                                >
                                    {company.type === 'subsidiary' ? 'S' :
                                        company.type === 'jointVenture' ? 'JV' :
                                            company.type === 'associate' ? 'A' : 'H'}
                                </text>
                            </g>
                        )
                    })}
                </svg>

                {/* Improved Legend */}
                <div className="mt-6 flex justify-center">
                    <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 grid grid-cols-2 lg:grid-cols-4 gap-4 text-sm">
                        <div className="flex items-center gap-2">
                            <div className="w-3 h-3 rounded-full bg-blue-500"></div>
                            <span className="text-gray-700">Holdings (H)</span>
                        </div>
                        <div className="flex items-center gap-2">
                            <div className="w-3 h-3 rounded-full bg-purple-500"></div>
                            <span className="text-gray-700">Subsidiaries (S)</span>
                        </div>
                        <div className="flex items-center gap-2">
                            <div className="w-3 h-3 rounded-full bg-orange-500"></div>
                            <span className="text-gray-700">Associates (A)</span>
                        </div>
                        <div className="flex items-center gap-2">
                            <div className="w-3 h-3 rounded-full bg-green-500"></div>
                            <span className="text-gray-700">Joint Ventures (JV)</span>
                        </div>
                    </div>
                </div>
            </div>
        )
    }

    // Improved Table View
    const TableView = () => {
        const allCompanies = [
            ...categorizedData.holdings.map(c => ({ ...c, type: 'Holding' })),
            ...categorizedData.subsidiaries.map(c => ({ ...c, type: 'Subsidiary' })),
            ...categorizedData.associates.map(c => ({ ...c, type: 'Associate' })),
            ...categorizedData.jointVentures.map(c => ({ ...c, type: 'Joint Venture' }))
        ]

        return (
            <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full">
                        <thead className="bg-gray-50 border-b border-gray-200">
                            <tr>
                                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-900 uppercase tracking-wider">Company Name</th>
                                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-900 uppercase tracking-wider">Type</th>
                                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-900 uppercase tracking-wider">Relationship</th>
                                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-900 uppercase tracking-wider">Ownership %</th>
                                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-900 uppercase tracking-wider">Financial Year</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-200">
                            {allCompanies.map((company, index) => (
                                <tr key={index} className="hover:bg-gray-50 transition-colors">
                                    <td className="px-6 py-4">
                                        <div className="flex items-center gap-3">
                                            <Building2 className="w-4 h-4 text-gray-400" />
                                            <span className="font-medium text-gray-900">{company.corporate_name}</span>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4">
                                        <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${company.type === 'Holding' ? 'bg-blue-100 text-blue-800' :
                                            company.type === 'Subsidiary' ? 'bg-purple-100 text-purple-800' :
                                                company.type === 'Associate' ? 'bg-orange-100 text-orange-800' :
                                                    'bg-green-100 text-green-800'
                                            }`}>
                                            {company.type}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4 text-sm text-gray-600">
                                        {company.relationship}
                                    </td>
                                    <td className="px-6 py-4">
                                        <span className="font-medium text-gray-900">{company.percentage || 'N/A'}</span>
                                    </td>
                                    <td className="px-6 py-4 text-sm text-gray-600">
                                        {company.financial_year_ending_on}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        )
    }

    // Improved Cards View
    const CardsView = () => {
        const allCompanies = [
            ...categorizedData.holdings.map(c => ({ ...c, type: 'Holding', colorClass: 'blue' })),
            ...categorizedData.subsidiaries.map(c => ({ ...c, type: 'Subsidiary', colorClass: 'purple' })),
            ...categorizedData.associates.map(c => ({ ...c, type: 'Associate', colorClass: 'orange' })),
            ...categorizedData.jointVentures.map(c => ({ ...c, type: 'Joint Venture', colorClass: 'green' }))
        ]

        return (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                {allCompanies.map((company, index) => (
                    <Card key={index} className="hover:shadow-md transition-shadow border-gray-200">
                        <CardContent className="p-0">
                            <div className={`h-1 bg-${company.colorClass}-500`}></div>
                            <div className="p-4">
                                <div className="flex items-start justify-between mb-3">
                                    <div className="flex items-center gap-3 min-w-0 flex-1">
                                        <div className={`p-2 bg-${company.colorClass}-50 rounded-lg flex-shrink-0`}>
                                            <Building2 className={`w-4 h-4 text-${company.colorClass}-600`} />
                                        </div>
                                        <div className="min-w-0 flex-1">
                                            <h4 className="font-semibold text-gray-900 text-sm leading-tight truncate">
                                                {company.corporate_name}
                                            </h4>
                                            <p className="text-xs text-gray-500 mt-1">{company.type}</p>
                                        </div>
                                    </div>
                                    {company.percentage && (
                                        <div className={`px-2 py-1 bg-${company.colorClass}-100 text-${company.colorClass}-800 rounded text-xs font-medium flex-shrink-0 ml-2`}>
                                            {company.percentage}
                                        </div>
                                    )}
                                </div>
                                <div className="text-xs text-gray-500 space-y-1">
                                    <div className="truncate">{company.relationship}</div>
                                    <div>FY: {company.financial_year_ending_on}</div>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                ))}
            </div>
        )
    }

    const renderCurrentView = () => {
        switch (viewMode) {
            case 'hierarchy': return <HierarchyView />
            // case 'network': return <NetworkView />
            case 'table': return <TableView />
            case 'cards': return <CardsView />
            default: return <HierarchyView />
        }
    }

    return (
        <Card className="w-full max-w-7xl mx-auto border-gray-200">
            <CardHeader className="border-b border-gray-200">
                <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-blue-50 rounded-lg">
                            <Network className="w-6 h-6 text-blue-600" />
                        </div>
                        <div>
                            <h3 className="text-xl font-semibold text-gray-900">Corporate Hierarchy</h3>
                            <p className="text-sm text-gray-600">{stats.total} related entities</p>
                        </div>
                    </div>

                    {/* Controls with Fluent design */}
                    <div className="flex flex-wrap items-center gap-3">
                        {/* View Mode Toggle */}
                        <div className="flex bg-gray-100 rounded-lg p-1">
                            <Button
                                variant={viewMode === 'hierarchy' ? 'info' : 'ghost'}
                                size="sm"
                                onClick={() => setViewMode('hierarchy')}
                                className="rounded-md px-3 text-sm h-8"
                            >
                                <Eye className="w-4 h-4 mr-2" />
                                Overview
                            </Button>
                            {/* <Button
                                variant={viewMode === 'network' ? 'info' : 'ghost'}
                                size="sm"
                                onClick={() => setViewMode('network')}
                                className="rounded-md px-3 text-sm h-8"
                            >
                                <GitBranch className="w-4 h-4 mr-2" />
                                Network
                            </Button> */}
                            <Button
                                variant={viewMode === 'table' ? 'info' : 'ghost'}
                                size="sm"
                                onClick={() => setViewMode('table')}
                                className="rounded-md px-3 text-sm h-8"
                            >
                                <Table className="w-4 h-4 mr-2" />
                                Table
                            </Button>
                            <Button
                                variant={viewMode === 'cards' ? 'info' : 'ghost'}
                                size="sm"
                                onClick={() => setViewMode('cards')}
                                className="rounded-md px-3 text-sm h-8"
                            >
                                <Grid3X3 className="w-4 h-4 mr-2" />
                                Cards
                            </Button>
                        </div>

                        {/* Search */}
                        {/* <div className="relative">
                            <Search className="w-4 h-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                            <input
                                type="text"
                                placeholder="Search companies..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg text-sm w-48 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            />
                        </div> */}

                        {/* Export */}
                        {/* <Button variant="outline" size="sm" className="rounded-lg border-gray-300">
                            <Download className="w-4 h-4 mr-2" />
                            Export
                        </Button> */}
                    </div>
                </div>
            </CardHeader>

            <CardContent className="p-6">
                {renderCurrentView()}
            </CardContent>
        </Card>
    )
}

// Custom CSS classes for color schemes (these would typically be in your CSS file)
const styles = `
.blue-bg { background-color: #EBF8FF; }
.blue-icon { color: #3182CE; }
.blue-badge { background-color: #BEE3F8; color: #2B6CB0; }

.purple-bg { background-color: #F7FAFC; }
.purple-icon { color: #805AD5; }
.purple-badge { background-color: #E9D8FD; color: #6B46C1; }

.orange-bg { background-color: #FFFAF0; }
.orange-icon { color: #DD6B20; }
.orange-badge { background-color: #FED7AA; color: #C05621; }

.green-bg { background-color: #F0FDF4; }
.green-icon { color: #059669; }
.green-badge { background-color: #BBF7D0; color: #047857; }
`