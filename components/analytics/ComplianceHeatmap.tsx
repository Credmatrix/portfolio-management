"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { FluentColors } from "@/lib/constants/colors";
import { ComplianceHeatmapData, TooltipData } from "@/types/analytics.types";
import { ComplianceClickData } from "@/types/chart-interactions.types";
import { ExternalLink, List, Grid } from "lucide-react";

interface ComplianceHeatmapProps {
    data: ComplianceHeatmapData;
    width?: number;
    height?: number;
    onComplianceStatusClick?: (data: ComplianceClickData) => void;
    activeComplianceStatuses?: string[];
    isInteractive?: boolean;
    isLoading?: boolean;
}

export function ComplianceHeatmap({
    data,
    width = 800,
    height = 500,
    onComplianceStatusClick,
    activeComplianceStatuses = [],
    isInteractive = false,
    isLoading = false
}: ComplianceHeatmapProps) {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const [tooltip, setTooltip] = useState<TooltipData>({
        x: 0,
        y: 0,
        content: '',
        visible: false
    });
    const [viewMode, setViewMode] = useState<'overall' | 'gst' | 'epfo'>('overall');
    const [hoveredCell, setHoveredCell] = useState<number | null>(null);
    const [displayMode, setDisplayMode] = useState<'heatmap' | 'list'>('heatmap');

    const router = useRouter();

    const handleComplianceClick = (status: string, complianceType: 'gst' | 'epfo' | 'audit') => {
        if (!isInteractive || !onComplianceStatusClick) return;

        const count = data.companies.filter(company => {
            switch (complianceType) {
                case 'gst':
                    return company.gstCompliance.status === status;
                case 'epfo':
                    return company.epfoCompliance.status === status;
                case 'audit':
                    // For audit, we can check both GST and EPFO compliance
                    return company.gstCompliance.status === status && company.epfoCompliance.status === status;
                default:
                    return false;
            }
        }).length;

        const clickData: ComplianceClickData = {
            label: `${complianceType.toUpperCase()} ${status}`,
            value: count,
            complianceType,
            status,
            count,
            category: 'compliance'
        };

        onComplianceStatusClick(clickData);
    };

    const handleCompanyClick = (companyId: string) => {
        router.push(`/portfolio/${companyId}`);
    };

    const handleQuickFilterClick = (filterType: 'all_compliant' | 'any_non_compliant' | 'unknown_status') => {
        if (!isInteractive || !onComplianceStatusClick) return;

        let count = 0;
        let clickData: ComplianceClickData;

        switch (filterType) {
            case 'all_compliant':
                count = data.companies.filter(c =>
                    c.gstCompliance.status === 'Compliant' && c.epfoCompliance.status === 'Compliant'
                ).length;
                clickData = {
                    label: 'Fully Compliant',
                    value: count,
                    complianceType: 'audit',
                    status: 'Compliant',
                    count,
                    category: 'compliance'
                };
                break;
            case 'any_non_compliant':
                count = data.companies.filter(c =>
                    c.gstCompliance.status === 'Non-Compliant' || c.epfoCompliance.status === 'Non-Compliant'
                ).length;
                clickData = {
                    label: 'Any Non-Compliant',
                    value: count,
                    complianceType: 'audit',
                    status: 'Non-Compliant',
                    count,
                    category: 'compliance'
                };
                break;
            case 'unknown_status':
                count = data.companies.filter(c =>
                    c.gstCompliance.status === 'Unknown' || c.epfoCompliance.status === 'Unknown'
                ).length;
                clickData = {
                    label: 'Unknown Status',
                    value: count,
                    complianceType: 'audit',
                    status: 'Unknown',
                    count,
                    category: 'compliance'
                };
                break;
            default:
                return;
        }

        onComplianceStatusClick(clickData);
    };

    const handleCanvasClick = (event: React.MouseEvent<HTMLCanvasElement>) => {
        if (!isInteractive || !canvasRef.current || !data?.companies?.length) return;

        const canvas = canvasRef.current;
        const rect = canvas.getBoundingClientRect();
        const x = event.clientX - rect.left;
        const y = event.clientY - rect.top;

        const margin = { top: 60, right: 40, bottom: 80, left: 120 };
        const chartWidth = width - margin.left - margin.right;
        const chartHeight = height - margin.top - margin.bottom;

        const cols = Math.ceil(Math.sqrt(data.companies.length));
        const cellWidth = chartWidth / cols;
        const cellHeight = chartHeight / Math.ceil(data.companies.length / cols);

        const col = Math.floor((x - margin.left) / cellWidth);
        const row = Math.floor((y - margin.top) / cellHeight);
        const index = row * cols + col;

        if (index >= 0 && index < data.companies.length) {
            const company = data.companies[index];

            // Determine which compliance status to filter by based on view mode
            switch (viewMode) {
                case 'gst':
                    handleComplianceClick(company.gstCompliance.status, 'gst');
                    break;
                case 'epfo':
                    handleComplianceClick(company.epfoCompliance.status, 'epfo');
                    break;
                case 'overall':
                    // For overall view, click on the most relevant compliance status
                    if (company.gstCompliance.status !== 'Unknown') {
                        handleComplianceClick(company.gstCompliance.status, 'gst');
                    } else if (company.epfoCompliance.status !== 'Unknown') {
                        handleComplianceClick(company.epfoCompliance.status, 'epfo');
                    }
                    break;
            }
        }
    };

    const getComplianceColor = (status: string): string => {
        switch (status) {
            case 'Compliant': return FluentColors.success;
            case 'Non-Compliant': return FluentColors.error;
            case 'Unknown': return FluentColors.neutral[50];
            default: return FluentColors.neutral[50];
        }
    };

    const getScoreColor = (score: number): string => {
        if (score >= 80) return FluentColors.success;
        if (score >= 60) return '#0E8A0E';
        if (score >= 40) return FluentColors.warning;
        if (score >= 20) return FluentColors.orange;
        return FluentColors.error;
    };

    const getRiskGradeColor = (grade: string): string => {
        switch (grade) {
            case 'CM1': return FluentColors.success;
            case 'CM2': return '#0E8A0E';
            case 'CM3': return FluentColors.warning;
            case 'CM4': return FluentColors.orange;
            case 'CM5': return FluentColors.error;
            default: return FluentColors.neutral[50];
        }
    };

    useEffect(() => {
        if (!canvasRef.current || !data?.companies?.length) return;

        const canvas = canvasRef.current;
        const ctx = canvas.getContext("2d");
        if (!ctx) return;

        canvas.width = width;
        canvas.height = height;

        const margin = { top: 60, right: 40, bottom: 80, left: 120 };
        const chartWidth = width - margin.left - margin.right;
        const chartHeight = height - margin.top - margin.bottom;

        // Clear canvas
        ctx.clearRect(0, 0, width, height);

        // Calculate grid dimensions
        const cols = Math.ceil(Math.sqrt(data.companies.length));
        const rows = Math.ceil(data.companies.length / cols);
        const cellWidth = chartWidth / cols;
        const cellHeight = chartHeight / rows;

        // Draw companies as heatmap cells
        data.companies.forEach((company, index) => {
            const col = index % cols;
            const row = Math.floor(index / cols);
            const x = margin.left + col * cellWidth;
            const y = margin.top + row * cellHeight;

            let fillColor: string;
            let borderColor: string;
            let isSelected = false;

            switch (viewMode) {
                case 'gst':
                    fillColor = getComplianceColor(company.gstCompliance.status);
                    borderColor = getScoreColor(company.gstCompliance.score);
                    isSelected = isInteractive && activeComplianceStatuses.includes(`gst_${company.gstCompliance.status}`);
                    break;
                case 'epfo':
                    fillColor = getComplianceColor(company.epfoCompliance.status);
                    borderColor = getScoreColor(company.epfoCompliance.score);
                    isSelected = isInteractive && activeComplianceStatuses.includes(`epfo_${company.epfoCompliance.status}`);
                    break;
                case 'overall':
                default:
                    fillColor = getScoreColor(company.overallComplianceScore);
                    borderColor = getRiskGradeColor(company.riskGrade);
                    isSelected = isInteractive && (
                        activeComplianceStatuses.includes(`gst_${company.gstCompliance.status}`) ||
                        activeComplianceStatuses.includes(`epfo_${company.epfoCompliance.status}`)
                    );
                    break;
            }

            const isHovered = hoveredCell === index;

            // Draw cell background
            ctx.fillStyle = fillColor;
            ctx.globalAlpha = isSelected ? 1 : isHovered ? 0.9 : 0.8;
            ctx.fillRect(x + 1, y + 1, cellWidth - 2, cellHeight - 2);
            ctx.globalAlpha = 1;

            // Draw border based on secondary metric
            ctx.strokeStyle = isSelected ? '#3b82f6' : borderColor;
            ctx.lineWidth = isSelected ? 3 : isHovered ? 2.5 : 2;
            ctx.strokeRect(x + 1, y + 1, cellWidth - 2, cellHeight - 2);

            // Add selection indicator
            if (isSelected) {
                ctx.strokeStyle = '#ffffff';
                ctx.lineWidth = 1;
                ctx.strokeRect(x + 2, y + 2, cellWidth - 4, cellHeight - 4);
            }

            // Draw score text if cell is large enough
            if (cellWidth > 30 && cellHeight > 20) {
                ctx.fillStyle = '#FFFFFF';
                ctx.font = 'bold 10px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto';
                ctx.textAlign = 'center';
                ctx.shadowColor = 'rgba(0,0,0,0.5)';
                ctx.shadowBlur = 2;

                let displayText: string;
                switch (viewMode) {
                    case 'gst':
                        displayText = company.gstCompliance.score.toFixed(0);
                        break;
                    case 'epfo':
                        displayText = company.epfoCompliance.score.toFixed(0);
                        break;
                    case 'overall':
                    default:
                        displayText = company.overallComplianceScore.toFixed(0);
                        break;
                }

                ctx.fillText(displayText, x + cellWidth / 2, y + cellHeight / 2 + 3);
                ctx.shadowBlur = 0;
            }
        });

        // Draw title
        ctx.fillStyle = FluentColors.neutral[90];
        ctx.font = 'bold 16px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto';
        ctx.textAlign = 'center';
        ctx.fillText(
            `Compliance Heatmap - ${viewMode.toUpperCase()} View`,
            width / 2,
            25
        );

        // Draw legend
        drawLegend(ctx, margin, chartWidth, chartHeight);

    }, [data, width, height, viewMode, hoveredCell, activeComplianceStatuses, isInteractive]);

    const drawLegend = (
        ctx: CanvasRenderingContext2D,
        margin: any,
        chartWidth: number,
        chartHeight: number
    ) => {
        const legendY = margin.top + chartHeight + 20;

        // Score legend
        const scoreGradient = ctx.createLinearGradient(margin.left, legendY, margin.left + 200, legendY);
        scoreGradient.addColorStop(0, FluentColors.error);
        scoreGradient.addColorStop(0.25, FluentColors.orange);
        scoreGradient.addColorStop(0.5, FluentColors.warning);
        scoreGradient.addColorStop(0.75, '#0E8A0E');
        scoreGradient.addColorStop(1, FluentColors.success);

        ctx.fillStyle = scoreGradient;
        ctx.fillRect(margin.left, legendY, 200, 15);

        ctx.fillStyle = FluentColors.neutral[90];
        ctx.font = '12px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto';
        ctx.textAlign = 'left';
        ctx.fillText('Low Score', margin.left, legendY + 30);
        ctx.textAlign = 'right';
        ctx.fillText('High Score', margin.left + 200, legendY + 30);

        // Status legend (for GST/EPFO views)
        if (viewMode !== 'overall') {
            const statusLegendX = margin.left + 250;
            const statuses = [
                { label: 'Compliant', color: FluentColors.success },
                { label: 'Non-Compliant', color: FluentColors.error },
                { label: 'Unknown', color: FluentColors.neutral[50] }
            ];

            statuses.forEach((status, index) => {
                const x = statusLegendX + index * 80;
                ctx.fillStyle = status.color;
                ctx.fillRect(x, legendY, 15, 15);
                ctx.fillStyle = FluentColors.neutral[90];
                ctx.textAlign = 'left';
                ctx.fillText(status.label, x + 20, legendY + 12);
            });
        }
    };

    const handleMouseMove = (event: React.MouseEvent<HTMLCanvasElement>) => {
        if (!canvasRef.current || !data?.companies?.length) return;

        const canvas = canvasRef.current;
        const rect = canvas.getBoundingClientRect();
        const x = event.clientX - rect.left;
        const y = event.clientY - rect.top;

        const margin = { top: 60, right: 40, bottom: 80, left: 120 };
        const chartWidth = width - margin.left - margin.right;
        const chartHeight = height - margin.top - margin.bottom;

        const cols = Math.ceil(Math.sqrt(data.companies.length));
        const cellWidth = chartWidth / cols;
        const cellHeight = chartHeight / Math.ceil(data.companies.length / cols);

        const col = Math.floor((x - margin.left) / cellWidth);
        const row = Math.floor((y - margin.top) / cellHeight);
        const index = row * cols + col;

        if (index >= 0 && index < data.companies.length) {
            const company = data.companies[index];
            setHoveredCell(index);

            setTooltip({
                x: event.clientX,
                y: event.clientY,
                content: (
                    <div className="text-sm">
                        <div className="font-medium mb-2">{company.name}</div>
                        <div className="space-y-1">
                            <div>Risk Grade: <span className="font-medium">{company.riskGrade}</span></div>
                            <div>Overall Compliance: <span className="font-medium">{company.overallComplianceScore.toFixed(1)}%</span></div>
                            <div className="border-t pt-1 mt-1">
                                <div>GST Status: <span className="font-medium">{company.gstCompliance.status}</span></div>
                                <div>GST Score: <span className="font-medium">{company.gstCompliance.score.toFixed(1)}%</span></div>
                                <div>GST Filing: <span className="font-medium">{company.gstCompliance.filingRegularity.toFixed(1)}%</span></div>
                            </div>
                            <div className="border-t pt-1 mt-1">
                                <div>EPFO Status: <span className="font-medium">{company.epfoCompliance.status}</span></div>
                                <div>EPFO Score: <span className="font-medium">{company.epfoCompliance.score.toFixed(1)}%</span></div>
                                <div>EPFO Payment: <span className="font-medium">{company.epfoCompliance.paymentRegularity.toFixed(1)}%</span></div>
                            </div>
                            {isInteractive && (
                                <div className="border-t pt-1 mt-1 text-blue-600">
                                    Click to filter by compliance status
                                </div>
                            )}
                        </div>
                    </div>
                ),
                visible: true
            });
        } else {
            setHoveredCell(null);
            setTooltip(prev => ({ ...prev, visible: false }));
        }
    };

    const handleMouseLeave = () => {
        setHoveredCell(null);
        setTooltip(prev => ({ ...prev, visible: false }));
    };

    if (!data?.companies?.length) {
        return (
            <Card>
                <h3 className='text-lg font-semibold text-neutral-90 mb-4'>
                    Compliance Heatmap
                </h3>
                <div className="flex items-center justify-center h-64 text-neutral-60">
                    No compliance data available
                </div>
            </Card>
        );
    }

    const complianceStats = {
        gstCompliant: data.companies.filter(c => c.gstCompliance.status === 'Compliant').length,
        epfoCompliant: data.companies.filter(c => c.epfoCompliance.status === 'Compliant').length,
        bothCompliant: data.companies.filter(c =>
            c.gstCompliance.status === 'Compliant' && c.epfoCompliance.status === 'Compliant'
        ).length,
        avgOverallScore: data.companies.reduce((sum, c) => sum + c.overallComplianceScore, 0) / data.companies.length
    };

    return (
        <Card className="relative">
            {isLoading && (
                <div className="absolute inset-0 bg-white bg-opacity-80 flex items-center justify-center rounded-lg z-10">
                    <div className="flex items-center gap-2 text-neutral-70">
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-primary-500"></div>
                        <span className="text-sm">Updating compliance data...</span>
                    </div>
                </div>
            )}

            <div className="flex items-center justify-between mb-4">
                <h3 className='text-lg font-semibold text-neutral-90'>
                    Compliance Analysis
                </h3>
                <div className="flex gap-2">
                    <div className="flex border border-neutral-30 rounded overflow-hidden">
                        <button
                            onClick={() => setDisplayMode('heatmap')}
                            className={`px-3 py-1 text-sm flex items-center gap-1 ${displayMode === 'heatmap'
                                ? 'bg-blue-500 text-white'
                                : 'bg-white text-neutral-70 hover:bg-neutral-10'
                                }`}
                        >
                            <Grid className="w-3 h-3" />
                            Heatmap
                        </button>
                        <button
                            onClick={() => setDisplayMode('list')}
                            className={`px-3 py-1 text-sm flex items-center gap-1 ${displayMode === 'list'
                                ? 'bg-blue-500 text-white'
                                : 'bg-white text-neutral-70 hover:bg-neutral-10'
                                }`}
                        >
                            <List className="w-3 h-3" />
                            List
                        </button>
                    </div>
                    <select
                        value={viewMode}
                        onChange={(e) => setViewMode(e.target.value as any)}
                        className="text-sm border border-neutral-30 rounded px-2 py-1"
                    >
                        <option value="overall">Overall Compliance</option>
                        <option value="gst">GST Compliance</option>
                        <option value="epfo">EPFO Compliance</option>
                    </select>
                </div>
            </div>

            {displayMode === 'heatmap' ? (
                <div className="relative">
                    <canvas
                        ref={canvasRef}
                        className={`w-full h-auto border border-neutral-30 rounded ${isInteractive ? 'cursor-pointer' : 'cursor-default'
                            }`}
                        onMouseMove={handleMouseMove}
                        onMouseLeave={handleMouseLeave}
                        onClick={handleCanvasClick}
                    />

                    {/* Tooltip */}
                    {tooltip.visible && (
                        <div
                            className="fixed z-50 bg-white border border-neutral-30 rounded-lg shadow-lg p-3 pointer-events-none max-w-xs"
                            style={{
                                left: tooltip.x + 10,
                                top: tooltip.y - 10,
                                transform: 'translateY(-100%)'
                            }}
                        >
                            {tooltip.content}
                        </div>
                    )}
                </div>
            ) : (
                <ComplianceListView
                    companies={data.companies}
                    viewMode={viewMode}
                    onCompanyClick={handleCompanyClick}
                    onComplianceClick={handleComplianceClick}
                    isInteractive={isInteractive}
                />
            )}

            {/* Quick Filter Buttons */}
            {isInteractive && (
                <div className="mt-4 pt-4 border-t border-neutral-30">
                    <div className="text-sm font-medium text-neutral-70 mb-2">Quick Filters:</div>
                    <div className="flex flex-wrap gap-2">
                        <button
                            onClick={() => handleQuickFilterClick('all_compliant')}
                            className="px-3 py-1 text-xs bg-green-100 text-green-800 rounded hover:bg-green-200 transition-colors duration-200"
                        >
                            Fully Compliant ({complianceStats.bothCompliant})
                        </button>
                        <button
                            onClick={() => handleQuickFilterClick('any_non_compliant')}
                            className="px-3 py-1 text-xs bg-red-100 text-red-800 rounded hover:bg-red-200 transition-colors duration-200"
                        >
                            Any Non-Compliant ({data.companies.filter(c =>
                                c.gstCompliance.status === 'Non-Compliant' || c.epfoCompliance.status === 'Non-Compliant'
                            ).length})
                        </button>
                        <button
                            onClick={() => handleQuickFilterClick('unknown_status')}
                            className="px-3 py-1 text-xs bg-gray-100 text-gray-800 rounded hover:bg-gray-200 transition-colors duration-200"
                        >
                            Unknown Status ({data.companies.filter(c =>
                                c.gstCompliance.status === 'Unknown' || c.epfoCompliance.status === 'Unknown'
                            ).length})
                        </button>
                    </div>
                </div>
            )}

            {/* Summary Statistics */}
            <div className="mt-4 pt-4 border-t border-neutral-30">
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                    <div
                        className={`transition-all duration-200 ${isInteractive ? 'cursor-pointer hover:bg-neutral-10 rounded p-2 -m-2' : ''
                            }`}
                        onClick={() => handleComplianceClick('Compliant', 'gst')}
                    >
                        <div className="text-neutral-60">GST Compliant</div>
                        <div className="font-medium text-neutral-90">
                            {complianceStats.gstCompliant} ({((complianceStats.gstCompliant / data.companies.length) * 100).toFixed(1)}%)
                        </div>
                        {isInteractive && (
                            <div className="text-xs text-blue-500 opacity-0 hover:opacity-100 transition-opacity duration-200">
                                Click to filter
                            </div>
                        )}
                    </div>
                    <div
                        className={`transition-all duration-200 ${isInteractive ? 'cursor-pointer hover:bg-neutral-10 rounded p-2 -m-2' : ''
                            }`}
                        onClick={() => handleComplianceClick('Compliant', 'epfo')}
                    >
                        <div className="text-neutral-60">EPFO Compliant</div>
                        <div className="font-medium text-neutral-90">
                            {complianceStats.epfoCompliant} ({((complianceStats.epfoCompliant / data.companies.length) * 100).toFixed(1)}%)
                        </div>
                        {isInteractive && (
                            <div className="text-xs text-blue-500 opacity-0 hover:opacity-100 transition-opacity duration-200">
                                Click to filter
                            </div>
                        )}
                    </div>
                    <div
                        className={`transition-all duration-200 ${isInteractive ? 'cursor-pointer hover:bg-neutral-10 rounded p-2 -m-2' : ''
                            }`}
                        onClick={() => handleQuickFilterClick('all_compliant')}
                    >
                        <div className="text-neutral-60">Both Compliant</div>
                        <div className="font-medium text-neutral-90">
                            {complianceStats.bothCompliant} ({((complianceStats.bothCompliant / data.companies.length) * 100).toFixed(1)}%)
                        </div>
                        {isInteractive && (
                            <div className="text-xs text-blue-500 opacity-0 hover:opacity-100 transition-opacity duration-200">
                                Click to filter
                            </div>
                        )}
                    </div>
                    <div>
                        <div className="text-neutral-60">Avg Overall Score</div>
                        <div className="font-medium text-neutral-90">
                            {complianceStats.avgOverallScore.toFixed(1)}%
                        </div>
                    </div>
                </div>
            </div>

            {/* View Mode Description */}
            <div className="mt-4 pt-4 border-t border-neutral-30">
                <div className="text-sm text-neutral-70">
                    {viewMode === 'overall' && (
                        <>
                            <strong>Overall View:</strong> Cell color represents overall compliance score, border color represents risk grade.
                        </>
                    )}
                    {viewMode === 'gst' && (
                        <>
                            <strong>GST View:</strong> Cell color represents GST compliance status, border color represents GST score.
                        </>
                    )}
                    {viewMode === 'epfo' && (
                        <>
                            <strong>EPFO View:</strong> Cell color represents EPFO compliance status, border color represents EPFO score.
                        </>
                    )}
                </div>
            </div>
        </Card>
    );
}

// Compliance List View Component
interface ComplianceListViewProps {
    companies: ComplianceHeatmapData['companies'];
    viewMode: 'overall' | 'gst' | 'epfo';
    onCompanyClick: (companyId: string) => void;
    onComplianceClick: (status: string, complianceType: 'gst' | 'epfo' | 'audit') => void;
    isInteractive: boolean;
}

function ComplianceListView({
    companies,
    viewMode,
    onCompanyClick,
    onComplianceClick,
    isInteractive
}: ComplianceListViewProps) {
    const [sortBy, setSortBy] = useState<'name' | 'gst' | 'epfo' | 'overall'>('name');
    const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');

    const sortedCompanies = [...companies].sort((a, b) => {
        let aValue: string | number;
        let bValue: string | number;

        switch (sortBy) {
            case 'name':
                aValue = a.name.toLowerCase();
                bValue = b.name.toLowerCase();
                break;
            case 'gst':
                aValue = a.gstCompliance.score;
                bValue = b.gstCompliance.score;
                break;
            case 'epfo':
                aValue = a.epfoCompliance.score;
                bValue = b.epfoCompliance.score;
                break;
            case 'overall':
                aValue = a.overallComplianceScore;
                bValue = b.overallComplianceScore;
                break;
            default:
                aValue = a.name.toLowerCase();
                bValue = b.name.toLowerCase();
        }

        if (typeof aValue === 'string' && typeof bValue === 'string') {
            return sortDirection === 'asc'
                ? aValue.localeCompare(bValue)
                : bValue.localeCompare(aValue);
        } else {
            return sortDirection === 'asc'
                ? (aValue as number) - (bValue as number)
                : (bValue as number) - (aValue as number);
        }
    });

    const handleSort = (field: 'name' | 'gst' | 'epfo' | 'overall') => {
        if (sortBy === field) {
            setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
        } else {
            setSortBy(field);
            setSortDirection('asc');
        }
    };

    const getComplianceStatusColor = (status: string) => {
        switch (status) {
            case 'Compliant': return 'text-green-700 bg-green-100';
            case 'Non-Compliant': return 'text-red-700 bg-red-100';
            case 'Unknown': return 'text-gray-700 bg-gray-100';
            default: return 'text-gray-700 bg-gray-100';
        }
    };

    const getScoreColor = (score: number) => {
        if (score >= 80) return 'text-green-700';
        if (score >= 60) return 'text-yellow-700';
        return 'text-red-700';
    };

    return (
        <div className="border border-neutral-30 rounded-lg overflow-hidden">
            {/* Table Header */}
            <div className="bg-neutral-10 border-b border-neutral-30 px-4 py-2">
                <div className="grid grid-cols-12 gap-4 text-sm font-medium text-neutral-70">
                    <div
                        className="col-span-4 cursor-pointer hover:text-neutral-90 flex items-center gap-1"
                        onClick={() => handleSort('name')}
                    >
                        Company Name
                        {sortBy === 'name' && (
                            <span className="text-xs">{sortDirection === 'asc' ? '↑' : '↓'}</span>
                        )}
                    </div>
                    <div
                        className="col-span-2 cursor-pointer hover:text-neutral-90 flex items-center gap-1"
                        onClick={() => handleSort('gst')}
                    >
                        GST Status
                        {sortBy === 'gst' && (
                            <span className="text-xs">{sortDirection === 'asc' ? '↑' : '↓'}</span>
                        )}
                    </div>
                    <div
                        className="col-span-2 cursor-pointer hover:text-neutral-90 flex items-center gap-1"
                        onClick={() => handleSort('epfo')}
                    >
                        EPFO Status
                        {sortBy === 'epfo' && (
                            <span className="text-xs">{sortDirection === 'asc' ? '↑' : '↓'}</span>
                        )}
                    </div>
                    <div
                        className="col-span-2 cursor-pointer hover:text-neutral-90 flex items-center gap-1"
                        onClick={() => handleSort('overall')}
                    >
                        Overall Score
                        {sortBy === 'overall' && (
                            <span className="text-xs">{sortDirection === 'asc' ? '↑' : '↓'}</span>
                        )}
                    </div>
                    <div className="col-span-2 text-center">Actions</div>
                </div>
            </div>

            {/* Table Body */}
            <div className="max-h-96 overflow-y-auto">
                {sortedCompanies.map((company, index) => (
                    <div
                        key={company.id}
                        className={`grid grid-cols-12 gap-4 px-4 py-3 text-sm border-b border-neutral-20 hover:bg-neutral-5 ${index % 2 === 0 ? 'bg-white' : 'bg-neutral-5'
                            }`}
                    >
                        {/* Company Name */}
                        <div className="col-span-4">
                            <button
                                onClick={() => onCompanyClick(company.id)}
                                className="text-left hover:text-blue-600 hover:underline font-medium text-neutral-90 flex items-center gap-1"
                            >
                                {company.name}
                                <ExternalLink className="w-3 h-3 opacity-50" />
                            </button>
                            <div className="text-xs text-neutral-60 mt-1">
                                Risk Grade: {company.riskGrade}
                            </div>
                        </div>

                        {/* GST Status */}
                        <div className="col-span-2">
                            <button
                                onClick={() => isInteractive && onComplianceClick(company.gstCompliance.status, 'gst')}
                                className={`px-2 py-1 rounded text-xs font-medium ${getComplianceStatusColor(company.gstCompliance.status)} ${isInteractive ? 'cursor-pointer hover:opacity-80' : 'cursor-default'
                                    }`}
                            >
                                {company.gstCompliance.status}
                            </button>
                            <div className={`text-xs mt-1 ${getScoreColor(company.gstCompliance.score)}`}>
                                Score: {company.gstCompliance.score.toFixed(1)}%
                            </div>
                        </div>

                        {/* EPFO Status */}
                        <div className="col-span-2">
                            <button
                                onClick={() => isInteractive && onComplianceClick(company.epfoCompliance.status, 'epfo')}
                                className={`px-2 py-1 rounded text-xs font-medium ${getComplianceStatusColor(company.epfoCompliance.status)} ${isInteractive ? 'cursor-pointer hover:opacity-80' : 'cursor-default'
                                    }`}
                            >
                                {company.epfoCompliance.status}
                            </button>
                            <div className={`text-xs mt-1 ${getScoreColor(company.epfoCompliance.score)}`}>
                                Score: {company.epfoCompliance.score.toFixed(1)}%
                            </div>
                        </div>

                        {/* Overall Score */}
                        <div className="col-span-2">
                            <div className={`font-medium ${getScoreColor(company.overallComplianceScore)}`}>
                                {company.overallComplianceScore.toFixed(1)}%
                            </div>
                            <div className="text-xs text-neutral-60 mt-1">
                                Filing: {company.gstCompliance.filingRegularity.toFixed(0)}%
                            </div>
                        </div>

                        {/* Actions */}
                        <div className="col-span-2 text-center">
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={() => onCompanyClick(company.id)}
                                className="text-xs px-2 py-1"
                            >
                                View Details
                            </Button>
                        </div>
                    </div>
                ))}
            </div>

            {/* List Footer */}
            <div className="bg-neutral-10 border-t border-neutral-30 px-4 py-2 text-xs text-neutral-60">
                Showing {sortedCompanies.length} companies • Click company names or compliance statuses to navigate or filter
            </div>
        </div>
    );
}