"use client";

import { useEffect, useRef } from "react";
import { Card } from "@/components/ui/Card";
import { FluentColors } from "@/lib/constants/colors";
import { ParameterScoreRadarData } from "@/types/analytics.types";

interface ParameterScoreRadarProps {
    data: ParameterScoreRadarData;
    size?: number;
    height?: number;
    width?: number;
}

export function ParameterScoreRadar({
    data,
    size = 300
}: ParameterScoreRadarProps) {
    const canvasRef = useRef<HTMLCanvasElement>(null);

    const getBenchmarkColor = (benchmark: string): string => {
        switch (benchmark) {
            case 'Excellent': return FluentColors.success;
            case 'Good': return '#0E8A0E';
            case 'Average': return FluentColors.warning;
            case 'Poor': return FluentColors.orange;
            case 'Critical Risk': return FluentColors.error;
            default: return FluentColors.neutral[50];
        }
    };

    const getCategoryColor = (category: string): string => {
        switch (category) {
            case 'Financial': return FluentColors.primary[500];
            case 'Business': return FluentColors.teal;
            case 'Hygiene': return FluentColors.purple;
            case 'Banking': return FluentColors.orange;
            default: return FluentColors.neutral[60];
        }
    };

    useEffect(() => {
        if (!canvasRef.current || !data?.parameters?.length) return;

        const canvas = canvasRef.current;
        const ctx = canvas.getContext("2d");
        if (!ctx) return;

        canvas.width = size;
        canvas.height = size;

        const centerX = size / 2;
        const centerY = size / 2;
        const radius = Math.min(size, size) / 2 - 40;

        // Clear canvas
        ctx.clearRect(0, 0, size, size);

        // Draw background circles (grid)
        const levels = 5;
        for (let i = 1; i <= levels; i++) {
            const levelRadius = (radius * i) / levels;
            ctx.beginPath();
            ctx.arc(centerX, centerY, levelRadius, 0, 2 * Math.PI);
            ctx.strokeStyle = FluentColors.neutral[30];
            ctx.lineWidth = 1;
            ctx.stroke();
        }

        // Draw axes and labels
        const angleStep = (2 * Math.PI) / data.parameters.length;

        data.parameters.forEach((param, index) => {
            const angle = index * angleStep - Math.PI / 2;
            const x = centerX + Math.cos(angle) * radius;
            const y = centerY + Math.sin(angle) * radius;

            // Draw axis line
            ctx.beginPath();
            ctx.moveTo(centerX, centerY);
            ctx.lineTo(x, y);
            ctx.strokeStyle = FluentColors.neutral[40];
            ctx.lineWidth = 1;
            ctx.stroke();

            // Draw parameter label
            const labelX = centerX + Math.cos(angle) * (radius + 25);
            const labelY = centerY + Math.sin(angle) * (radius + 25);

            ctx.fillStyle = FluentColors.neutral[90];
            ctx.font = '11px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto';
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';

            // Wrap long parameter names
            const words = param.category.split(' ');
            if (words.length > 1) {
                ctx.fillText(words[0], labelX, labelY - 6);
                ctx.fillText(words.slice(1).join(' '), labelX, labelY + 6);
            } else {
                ctx.fillText(param.category, labelX, labelY);
            }
        });

        // Draw score polygon
        ctx.beginPath();
        data.parameters.forEach((param, index) => {
            const angle = index * angleStep - Math.PI / 2;
            const scoreRadius = (param.percentage / 100) * radius;
            const x = centerX + Math.cos(angle) * scoreRadius;
            const y = centerY + Math.sin(angle) * scoreRadius;

            if (index === 0) {
                ctx.moveTo(x, y);
            } else {
                ctx.lineTo(x, y);
            }
        });
        ctx.closePath();

        // Fill the polygon with gradient
        const gradient = ctx.createRadialGradient(centerX, centerY, 0, centerX, centerY, radius);
        gradient.addColorStop(0, `${FluentColors.primary[500]}40`);
        gradient.addColorStop(1, `${FluentColors.primary[500]}10`);
        ctx.fillStyle = gradient;
        ctx.fill();

        // Stroke the polygon
        ctx.strokeStyle = FluentColors.primary[500];
        ctx.lineWidth = 2;
        ctx.stroke();

        // Draw score points
        data.parameters.forEach((param, index) => {
            const angle = index * angleStep - Math.PI / 2;
            const scoreRadius = (param.percentage / 100) * radius;
            const x = centerX + Math.cos(angle) * scoreRadius;
            const y = centerY + Math.sin(angle) * scoreRadius;

            // Draw point
            ctx.beginPath();
            ctx.arc(x, y, 4, 0, 2 * Math.PI);
            ctx.fillStyle = getBenchmarkColor(param.benchmark);
            ctx.fill();
            ctx.strokeStyle = '#FFFFFF';
            ctx.lineWidth = 2;
            ctx.stroke();
        });

        // Draw center point
        ctx.beginPath();
        ctx.arc(centerX, centerY, 3, 0, 2 * Math.PI);
        ctx.fillStyle = FluentColors.neutral[60];
        ctx.fill();

        // Draw percentage labels on grid circles
        for (let i = 1; i <= levels; i++) {
            const percentage = (i * 20).toString() + '%';
            ctx.fillStyle = FluentColors.neutral[60];
            ctx.font = '10px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto';
            ctx.textAlign = 'center';
            ctx.fillText(percentage, centerX + 5, centerY - (radius * i) / levels + 3);
        }

    }, [data, size]);

    if (!data?.parameters?.length) {
        return (
            <Card>
                <h3 className='text-lg font-semibold text-neutral-90 mb-4'>
                    Parameter Score Radar
                </h3>
                <div className="flex items-center justify-center h-64 text-neutral-60">
                    No parameter data available
                </div>
            </Card>
        );
    }

    return (
        <Card>
            <div className="flex items-center justify-between mb-4">
                <h3 className='text-lg font-semibold text-neutral-90'>
                    Parameter Score Radar
                </h3>
                <div className="text-sm text-neutral-70">
                    Overall: {data.overallScore.toFixed(1)}%
                </div>
            </div>

            <div className="flex flex-col items-center">
                <canvas
                    ref={canvasRef}
                    className="border border-neutral-30 rounded"
                />

                {/* Parameter Details */}
                <div className="mt-4 w-full">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        {data.parameters.map((param, index) => (
                            <div key={index} className="flex items-center justify-between p-2 bg-neutral-10 rounded">
                                <div className="flex items-center gap-2">
                                    <div
                                        className="w-3 h-3 rounded-full"
                                        style={{ backgroundColor: getCategoryColor(param.category) }}
                                    />
                                    <span className="text-sm font-medium text-neutral-90">
                                        {param.category}
                                    </span>
                                </div>
                                <div className="flex items-center gap-2">
                                    <span className="text-sm text-neutral-70">
                                        {param.score}/{param.maxScore}
                                    </span>
                                    <span
                                        className="text-xs px-2 py-1 rounded text-white"
                                        style={{ backgroundColor: getBenchmarkColor(param.benchmark) }}
                                    >
                                        {param.benchmark}
                                    </span>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Benchmark Legend */}
                <div className="mt-4 pt-4 border-t border-neutral-30 w-full">
                    <div className="text-sm font-medium text-neutral-90 mb-2">Benchmark Legend:</div>
                    <div className="flex flex-wrap gap-3">
                        {[
                            { label: 'Excellent', color: FluentColors.success },
                            { label: 'Good', color: '#0E8A0E' },
                            { label: 'Average', color: FluentColors.warning },
                            { label: 'Poor', color: FluentColors.orange },
                            { label: 'Critical Risk', color: FluentColors.error }
                        ].map(({ label, color }) => (
                            <div key={label} className="flex items-center gap-2">
                                <div
                                    className="w-3 h-3 rounded-full"
                                    style={{ backgroundColor: color }}
                                />
                                <span className="text-xs text-neutral-70">{label}</span>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </Card>
    );
}