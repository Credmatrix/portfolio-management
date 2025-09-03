"use client";

import { useEffect, useRef, useState } from "react";
import { Card } from "@/components/ui/Card";
import { FluentColors } from "@/lib/constants/colors";
import { EligibilityMatrixData } from "@/types/analytics.types";


interface TooltipData {
    x: number;
    y: number;
    content: React.ReactNode;
    visible: boolean;
}

interface EligibilityMatrixProps {
    data: EligibilityMatrixData;
    width?: number;
    height?: number;
}

export function EligibilityMatrix({
    data,
    width = 800,
    height = 500
}: EligibilityMatrixProps) {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const [tooltip, setTooltip] = useState<TooltipData>({
        x: 0,
        y: 0,
        content: '',
        visible: false
    });

    const getRiskGradeColor = (grade: string): string => {
        switch (grade) {
            case 'CM1': return FluentColors.success;
            case 'CM2': return '#0E8A0E';
            case 'CM3': return FluentColors.warning;
            case 'CM4': return FluentColors.orange;
            case 'CM5': return FluentColors.error;
            case 'CM6': return '#8B0000';
            default: return FluentColors.neutral[50];
        }
    };

    const getEligibilityIntensity = (amount: number, maxAmount: number): string => {
        const intensity = amount / maxAmount;
        if (intensity > 0.8) return '1.0';
        if (intensity > 0.6) return '0.8';
        if (intensity > 0.4) return '0.6';
        if (intensity > 0.2) return '0.4';
        return '0.2';
    };

    useEffect(() => {
        if (!canvasRef.current || !data?.eligibility_by_grade) return;

        const canvas = canvasRef.current;
        const ctx = canvas.getContext("2d");
        if (!ctx) return;

        canvas.width = width;
        canvas.height = height;

        const margin = { top: 60, right: 40, bottom: 80, left: 100 };
        const chartWidth = width - margin.left - margin.right;
        const chartHeight = height - margin.top - margin.bottom;

        // Clear canvas
        ctx.clearRect(0, 0, width, height);

        // Get risk grades and eligibility amounts
        const riskGrades = Object.keys(data.eligibility_by_grade).sort();
        const eligibilityAmounts = Object.values(data.eligibility_by_grade);
        const maxEligibility = Math.max(...eligibilityAmounts);

        // Draw background
        ctx.fillStyle = '#FFFFFF';
        ctx.fillRect(0, 0, width, height);

        // Draw grid
        ctx.strokeStyle = FluentColors.neutral[20];
        ctx.lineWidth = 1;

        // Vertical grid lines (risk grades)
        for (let i = 0; i <= riskGrades.length; i++) {
            const x = margin.left + (i * chartWidth) / riskGrades.length;
            ctx.beginPath();
            ctx.moveTo(x, margin.top);
            ctx.lineTo(x, margin.top + chartHeight);
            ctx.stroke();
        }

        // Horizontal grid lines
        const steps = 5;
        for (let i = 0; i <= steps; i++) {
            const y = margin.top + (i * chartHeight) / steps;
            ctx.beginPath();
            ctx.moveTo(margin.left, y);
            ctx.lineTo(margin.left + chartWidth, y);
            ctx.stroke();
        }

        // Draw bars for each risk grade
        const barWidth = chartWidth / riskGrades.length * 0.7;
        riskGrades.forEach((grade, index) => {
            const amount = data.eligibility_by_grade[grade];
            const barHeight = (amount / maxEligibility) * chartHeight;

            const x = margin.left + (index * chartWidth) / riskGrades.length + (chartWidth / riskGrades.length - barWidth) / 2;
            const y = margin.top + chartHeight - barHeight;

            // Draw bar
            ctx.fillStyle = getRiskGradeColor(grade);
            ctx.fillRect(x, y, barWidth, barHeight);

            // Add border
            ctx.strokeStyle = '#FFFFFF';
            ctx.lineWidth = 2;
            ctx.strokeRect(x, y, barWidth, barHeight);

            // Add amount label on top of bar
            ctx.fillStyle = FluentColors.neutral[90];
            ctx.font = '11px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto';
            ctx.textAlign = 'center';
            const labelText = `₹${(amount).toFixed(1)}Cr`;
            ctx.fillText(labelText, x + barWidth / 2, y - 5);
        });

        // Draw axes labels
        ctx.fillStyle = FluentColors.neutral[90];
        ctx.font = '12px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto';

        // X-axis labels (Risk Grades)
        riskGrades.forEach((grade, index) => {
            const x = margin.left + ((index + 0.5) * chartWidth) / riskGrades.length;
            ctx.textAlign = 'center';
            ctx.fillText(grade, x, height - margin.bottom + 20);
        });

        // Y-axis labels (Eligibility amounts)
        for (let i = 0; i <= steps; i++) {
            const y = margin.top + (i * chartHeight) / steps;
            const value = maxEligibility - (i * maxEligibility) / steps;
            ctx.textAlign = 'right';
            ctx.fillText(`₹${(value).toFixed(0)}Cr`, margin.left - 10, y + 4);
        }

        // Draw axis titles
        ctx.font = '14px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto';
        ctx.textAlign = 'center';
        ctx.fillText('Risk Grade', width / 2, height - 20);

        // Y-axis title (rotated)
        ctx.save();
        ctx.translate(25, height / 2);
        ctx.rotate(-Math.PI / 2);
        ctx.fillText('Total Eligibility (₹ Crores)', 0, 0);
        ctx.restore();

        // Draw title
        ctx.font = 'bold 16px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto';
        ctx.textAlign = 'center';
        ctx.fillText('Credit Eligibility Distribution by Risk Grade', width / 2, 30);

    }, [data, width, height]);

    const handleMouseMove = (event: React.MouseEvent<HTMLCanvasElement>) => {
        if (!canvasRef.current || !data?.eligibility_by_grade) return;

        const canvas = canvasRef.current;
        const rect = canvas.getBoundingClientRect();
        const x = event.clientX - rect.left;
        const y = event.clientY - rect.top;

        const margin = { top: 60, right: 40, bottom: 80, left: 100 };
        const chartWidth = width - margin.left - margin.right;
        const chartHeight = height - margin.top - margin.bottom;

        const riskGrades = Object.keys(data.eligibility_by_grade).sort();
        const barWidth = chartWidth / riskGrades.length * 0.7;

        // Find which bar the mouse is over
        let hoveredGrade;
        riskGrades.forEach((grade, index) => {
            const barX = margin.left + (index * chartWidth) / riskGrades.length + (chartWidth / riskGrades.length - barWidth) / 2;

            if (x >= barX && x <= barX + barWidth && y >= margin.top && y <= margin.top + chartHeight) {
                hoveredGrade = grade;
            }
        });

        if (hoveredGrade) {
            const amount = data.eligibility_by_grade[hoveredGrade];
            const percentage = ((amount / data.total_eligible_amount) * 100).toFixed(1);

            setTooltip({
                x: event.clientX,
                y: event.clientY,
                content: (
                    <div className="text-sm">
                        <div className="font-medium">Risk Grade: {hoveredGrade}</div>
                        <div>Total Eligibility: ₹{(amount).toFixed(1)} Crores</div>
                        <div>Percentage: {percentage}%</div>
                        <div className="text-xs text-neutral-60 mt-1">
                            Click to view companies in this grade
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

    if (!data?.eligibility_by_grade || Object.keys(data.eligibility_by_grade).length === 0) {
        return (
            <Card>
                <h3 className='text-lg font-semibold text-neutral-90 mb-4'>
                    Credit Eligibility by Risk Grade
                </h3>
                <div className="flex items-center justify-center h-64 text-neutral-60">
                    No eligibility data available
                </div>
            </Card>
        );
    }

    const riskGrades = Object.keys(data.eligibility_by_grade).sort();
    const eligibilityPercentage = ((data.companies_with_eligibility / data.total_companies) * 100).toFixed(1);

    return (
        <Card>
            <div className="flex items-center justify-between mb-4">
                <h3 className='text-lg font-semibold text-neutral-90'>
                    Credit Eligibility by Risk Grade
                </h3>
                <div className="text-sm text-neutral-70">
                    {data.companies_with_eligibility} of {data.total_companies} companies eligible
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

            {/* Legend and Statistics */}
            <div className="mt-4 pt-4 border-t border-neutral-30">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    {/* Risk Grade Legend */}
                    <div>
                        <div className="text-sm font-medium text-neutral-90 mb-3">Risk Grade Distribution:</div>
                        <div className="grid grid-cols-2 gap-2">
                            {riskGrades.map((grade) => {
                                const amount = data.eligibility_by_grade[grade];
                                const percentage = ((amount / data.total_eligible_amount) * 100).toFixed(1);
                                return (
                                    <div key={grade} className="flex items-center justify-between p-2 bg-neutral-10 rounded">
                                        <div className="flex items-center gap-2">
                                            <div
                                                className="w-3 h-3 rounded"
                                                style={{ backgroundColor: getRiskGradeColor(grade) }}
                                            />
                                            <span className="text-sm font-medium">{grade}</span>
                                        </div>
                                        <div className="text-right">
                                            <div className="text-sm font-medium">₹{(amount).toFixed(1)}Cr</div>
                                            <div className="text-xs text-neutral-60">{percentage}%</div>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </div>

                    {/* Summary Statistics */}
                    <div>
                        <div className="text-sm font-medium text-neutral-90 mb-3">Portfolio Summary:</div>
                        <div className="space-y-3">
                            <div className="flex justify-between items-center p-2 bg-neutral-10 rounded">
                                <span className="text-sm text-neutral-70">Total Eligible Amount</span>
                                <span className="font-medium">₹{(data.total_eligible_amount).toFixed(1)} Crores</span>
                            </div>
                            <div className="flex justify-between items-center p-2 bg-neutral-10 rounded">
                                <span className="text-sm text-neutral-70">Average Eligibility</span>
                                <span className="font-medium">₹{(data.average_eligibility).toFixed(2)} Crores</span>
                            </div>
                            <div className="flex justify-between items-center p-2 bg-neutral-10 rounded">
                                <span className="text-sm text-neutral-70">Eligibility Coverage</span>
                                <span className="font-medium">{eligibilityPercentage}%</span>
                            </div>
                            <div className="flex justify-between items-center p-2 bg-neutral-10 rounded">
                                <span className="text-sm text-neutral-70">High Risk (CM4-CM6)</span>
                                <span className="font-medium">
                                    ₹{(
                                        (data.eligibility_by_grade['CM4'] || 0) +
                                        (data.eligibility_by_grade['CM5'] || 0) +
                                        (data.eligibility_by_grade['CM6'] || 0)
                                    )}Cr
                                </span>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Industry Breakdown Preview */}
                {data.eligibility_by_industry && Object.keys(data.eligibility_by_industry).length > 0 && (
                    <div className="mt-6 pt-4 border-t border-neutral-30">
                        <div className="text-sm font-medium text-neutral-90 mb-3">Top Industries by Eligibility:</div>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
                            {Object.entries(data.eligibility_by_industry)
                                .sort(([, a], [, b]) => b - a)
                                .slice(0, 6)
                                .map(([industry, amount]) => (
                                    <div key={industry} className="flex justify-between items-center p-2 bg-neutral-10 rounded text-sm">
                                        <span className="text-neutral-70 truncate">{industry}</span>
                                        <span className="font-medium ml-2">₹{(amount).toFixed(1)}Cr</span>
                                    </div>
                                ))
                            }
                        </div>
                    </div>
                )}
            </div>
        </Card>
    );
}