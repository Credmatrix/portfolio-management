"use client";

import { useEffect, useRef, useState } from "react";
import { Card } from "@/components/ui/Card";
import { FluentColors } from "@/lib/constants/colors";
import { ComplianceHeatmapData, TooltipData } from "@/types/analytics.types";

interface ComplianceHeatmapProps {
    data: ComplianceHeatmapData;
    width?: number;
    height?: number;
}

export function ComplianceHeatmap({
    data,
    width = 800,
    height = 500
}: ComplianceHeatmapProps) {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const [tooltip, setTooltip] = useState<TooltipData>({
        x: 0,
        y: 0,
        content: '',
        visible: false
    });
    const [viewMode, setViewMode] = useState<'overall' | 'gst' | 'epfo'>('overall');

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

            switch (viewMode) {
                case 'gst':
                    fillColor = getComplianceColor(company.gstCompliance.status);
                    borderColor = getScoreColor(company.gstCompliance.score);
                    break;
                case 'epfo':
                    fillColor = getComplianceColor(company.epfoCompliance.status);
                    borderColor = getScoreColor(company.epfoCompliance.score);
                    break;
                case 'overall':
                default:
                    fillColor = getScoreColor(company.overallComplianceScore);
                    borderColor = getRiskGradeColor(company.riskGrade);
                    break;
            }

            // Draw cell background
            ctx.fillStyle = fillColor;
            ctx.fillRect(x + 1, y + 1, cellWidth - 2, cellHeight - 2);

            // Draw border based on secondary metric
            ctx.strokeStyle = borderColor;
            ctx.lineWidth = 2;
            ctx.strokeRect(x + 1, y + 1, cellWidth - 2, cellHeight - 2);

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

    }, [data, width, height, viewMode]);

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
                        </div>
                    </div>
                ),
                visible: true
            });
        } else {
            setTooltip(prev => ({ ...prev, visible: false }));
        }
    };

    const handleMouseLeave = () => {
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
        <Card>
            <div className="flex items-center justify-between mb-4">
                <h3 className='text-lg font-semibold text-neutral-90'>
                    Compliance Heatmap
                </h3>
                <div className="flex gap-2">
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

            <div className="relative">
                <canvas
                    ref={canvasRef}
                    className="w-full h-auto border border-neutral-30 rounded cursor-pointer"
                    onMouseMove={handleMouseMove}
                    onMouseLeave={handleMouseLeave}
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

            {/* Summary Statistics */}
            <div className="mt-4 pt-4 border-t border-neutral-30">
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                    <div>
                        <div className="text-neutral-60">GST Compliant</div>
                        <div className="font-medium text-neutral-90">
                            {complianceStats.gstCompliant} ({((complianceStats.gstCompliant / data.companies.length) * 100).toFixed(1)}%)
                        </div>
                    </div>
                    <div>
                        <div className="text-neutral-60">EPFO Compliant</div>
                        <div className="font-medium text-neutral-90">
                            {complianceStats.epfoCompliant} ({((complianceStats.epfoCompliant / data.companies.length) * 100).toFixed(1)}%)
                        </div>
                    </div>
                    <div>
                        <div className="text-neutral-60">Both Compliant</div>
                        <div className="font-medium text-neutral-90">
                            {complianceStats.bothCompliant} ({((complianceStats.bothCompliant / data.companies.length) * 100).toFixed(1)}%)
                        </div>
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