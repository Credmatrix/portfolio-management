"use client";

import { useEffect, useRef, useState } from "react";
import { Card } from "@/components/ui/Card";
import { FluentColors } from "@/lib/constants/colors";
import { RiskScoreHeatmapData, TooltipData } from "@/types/analytics.types";

interface RiskScoreHeatmapProps {
    data: RiskScoreHeatmapData;
    width?: number;
    height?: number;
}

export function RiskScoreHeatmap({
    data,
    width = 800,
    height = 400
}: RiskScoreHeatmapProps) {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const containerRef = useRef<HTMLDivElement>(null);
    const [tooltip, setTooltip] = useState<TooltipData>({
        x: 0,
        y: 0,
        content: '',
        visible: false
    });

    const getRiskColor = (riskScore: number): string => {
        if (riskScore >= 80) return FluentColors.success;
        if (riskScore >= 60) return '#0E8A0E';
        if (riskScore >= 40) return FluentColors.warning;
        if (riskScore >= 20) return FluentColors.orange;
        return FluentColors.error;
    };

    const getGradeColor = (grade: string): string => {
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

        // Set canvas size
        canvas.width = width;
        canvas.height = height;

        // Clear canvas
        ctx.clearRect(0, 0, width, height);

        // Calculate grid dimensions
        const cols = Math.ceil(Math.sqrt(data.companies.length));
        const rows = Math.ceil(data.companies.length / cols);
        const cellWidth = (width - 40) / cols;
        const cellHeight = (height - 40) / rows;

        // Draw companies as heatmap cells
        data.companies.forEach((company, index) => {
            const col = index % cols;
            const row = Math.floor(index / cols);
            const x = 20 + col * cellWidth;
            const y = 20 + row * cellHeight;

            // Draw cell background
            ctx.fillStyle = getRiskColor(company.riskScore);
            ctx.fillRect(x, y, cellWidth - 2, cellHeight - 2);

            // Draw border based on risk grade
            ctx.strokeStyle = getGradeColor(company.riskGrade);
            ctx.lineWidth = 2;
            ctx.strokeRect(x, y, cellWidth - 2, cellHeight - 2);

            // Draw risk score text if cell is large enough
            if (cellWidth > 40 && cellHeight > 30) {
                ctx.fillStyle = '#FFFFFF';
                ctx.font = '10px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto';
                ctx.textAlign = 'center';
                ctx.fillText(
                    company.riskScore.toFixed(0),
                    x + cellWidth / 2,
                    y + cellHeight / 2 + 3
                );
            }
        });

        // Draw legend
        drawLegend(ctx, width, height);

    }, [data, width, height]);

    const drawLegend = (ctx: CanvasRenderingContext2D, canvasWidth: number, canvasHeight: number) => {
        const legendY = canvasHeight - 30;
        const legendWidth = 200;
        const legendHeight = 15;
        const legendX = (canvasWidth - legendWidth) / 2;

        // Draw gradient legend
        const gradient = ctx.createLinearGradient(legendX, legendY, legendX + legendWidth, legendY);
        gradient.addColorStop(0, FluentColors.error);
        gradient.addColorStop(0.25, FluentColors.orange);
        gradient.addColorStop(0.5, FluentColors.warning);
        gradient.addColorStop(0.75, '#0E8A0E');
        gradient.addColorStop(1, FluentColors.success);

        ctx.fillStyle = gradient;
        ctx.fillRect(legendX, legendY, legendWidth, legendHeight);

        // Draw legend labels
        ctx.fillStyle = FluentColors.neutral[90];
        ctx.font = '12px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto';
        ctx.textAlign = 'left';
        ctx.fillText('Low Risk', legendX - 50, legendY + 12);
        ctx.textAlign = 'right';
        ctx.fillText('High Risk', legendX + legendWidth + 50, legendY + 12);
    };

    const handleMouseMove = (event: React.MouseEvent<HTMLCanvasElement>) => {
        if (!canvasRef.current || !data?.companies?.length) return;

        const canvas = canvasRef.current;
        const rect = canvas.getBoundingClientRect();
        const x = event.clientX - rect.left;
        const y = event.clientY - rect.top;

        // Calculate which cell the mouse is over
        const cols = Math.ceil(Math.sqrt(data.companies.length));
        const cellWidth = (width - 40) / cols;
        const cellHeight = (height - 40) / Math.ceil(data.companies.length / cols);

        const col = Math.floor((x - 20) / cellWidth);
        const row = Math.floor((y - 20) / cellHeight);
        const index = row * cols + col;

        if (index >= 0 && index < data.companies.length) {
            const company = data.companies[index];
            setTooltip({
                x: event.clientX,
                y: event.clientY,
                content: (
                    <div className="text-sm">
                        <div className="font-medium">{company.name}</div>
                        <div>Risk Score: {company.riskScore.toFixed(1)}</div>
                        <div>Risk Grade: {company.riskGrade}</div>
                        <div>Industry: {company.industry}</div>
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

    return (
        <Card>
            <div className="flex items-center justify-between mb-4">
                <h3 className='text-lg font-semibold text-neutral-90'>
                    Risk Score Heatmap
                </h3>
                <div className="text-sm text-neutral-70">
                    {data?.companies?.length} companies
                </div>
            </div>

            <div ref={containerRef} className="relative">
                <canvas
                    ref={canvasRef}
                    className="w-full h-auto border border-neutral-30 rounded cursor-pointer"
                    onMouseMove={handleMouseMove}
                    onMouseLeave={handleMouseLeave}
                />

                {/* Tooltip */}
                {tooltip.visible && (
                    <div
                        className="fixed z-50 bg-white border border-neutral-30 rounded-lg shadow-lg p-3 pointer-events-none"
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

            {/* Risk Grade Legend */}
            <div className="mt-4 pt-4 border-t border-neutral-30">
                <div className="text-sm font-medium text-neutral-90 mb-2">Risk Grades:</div>
                <div className="flex flex-wrap gap-4">
                    {[
                        { grade: 'CM1', label: 'Excellent', color: FluentColors.success },
                        { grade: 'CM2', label: 'Good', color: '#0E8A0E' },
                        { grade: 'CM3', label: 'Average', color: FluentColors.warning },
                        { grade: 'CM4', label: 'Poor', color: FluentColors.orange },
                        { grade: 'CM5', label: 'Critical', color: FluentColors.error }
                    ].map(({ grade, label, color }) => (
                        <div key={grade} className="flex items-center gap-2">
                            <div
                                className="w-3 h-3 rounded border-2"
                                style={{ borderColor: color }}
                            />
                            <span className="text-xs text-neutral-70">
                                {grade} - {label}
                            </span>
                        </div>
                    ))}
                </div>
            </div>
        </Card>
    );
}