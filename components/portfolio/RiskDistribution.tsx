// components/portfolio/RiskDistribution.tsx
import { Card } from "@/components/ui/Card";
import { FluentColors } from "@/lib/constants/colors";
import { RiskDistributionData } from "@/types/analytics.types";
import { RiskDistributionClickData } from "@/types/chart-interactions.types";
import { useState } from "react";
import {
	getChartElementStyles,
	getColorIndicatorStyles,
	getProgressBarStyles,
	getHoverHintClasses,
	LoadingOverlay
} from "@/lib/utils/chart-visual-feedback";
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, BarChart, Bar, XAxis, YAxis, CartesianGrid } from "recharts";

interface RiskDistributionProps {
	data: RiskDistributionData;
	onRiskGradeClick?: (data: RiskDistributionClickData) => void;
	onRiskScoreRangeClick?: (range: [number, number]) => void;
	activeRiskGrades?: string[];
	activeRiskScoreRange?: [number, number];
	isInteractive?: boolean;
	isLoading?: boolean;
	displayMode?: 'compact' | 'chart' | 'detailed';
}

const RISK_GRADE_CONFIG = {
	cm1: {
		label: 'CM1',
		color: FluentColors.success,
		description: 'Excellent Risk'
	},
	cm2: {
		label: 'CM2',
		color: '#0E8A0E',
		description: 'Good Risk'
	},
	cm3: {
		label: 'CM3',
		color: FluentColors.warning,
		description: 'Average Risk'
	},
	cm4: {
		label: 'CM4',
		color: FluentColors.orange,
		description: 'Poor Risk'
	},
	cm5: {
		label: 'CM5',
		color: FluentColors.error,
		description: 'Critical Risk'
	},
	ungraded: {
		label: 'Ungraded',
		color: FluentColors.neutral[50],
		description: 'Not Assessed'
	}
};

export function RiskDistribution({
	data,
	onRiskGradeClick,
	onRiskScoreRangeClick,
	activeRiskGrades = [],
	activeRiskScoreRange,
	isInteractive = false,
	isLoading = false,
	displayMode = 'compact'
}: RiskDistributionProps) {
	const [hoveredGrade, setHoveredGrade] = useState<string | null>(null);
	const [viewMode, setViewMode] = useState<'count' | 'percentage'>('count');

	if (!data) return null;

	const grades = Object.keys(RISK_GRADE_CONFIG) as Array<keyof typeof RISK_GRADE_CONFIG>;
	const maxCount = Math.max(...grades.map(grade => data[grade] || 0));
	const totalCount = data.total || grades.reduce((sum, grade) => sum + (data[grade] || 0), 0);

	const handleRiskGradeClick = (grade: string) => {
		if (!isInteractive || !onRiskGradeClick) return;

		const count = data[grade as keyof RiskDistributionData] || 0;
		const percentage = totalCount > 0 ? (count / totalCount) * 100 : 0;

		const clickData: RiskDistributionClickData = {
			label: RISK_GRADE_CONFIG[grade as keyof typeof RISK_GRADE_CONFIG].label,
			value: count,
			riskGrade: grade,
			count,
			percentage,
			category: 'risk_grade'
		};

		onRiskGradeClick(clickData);
	};

	const handleSummaryClick = (type: 'high' | 'low') => {
		if (!isInteractive || !onRiskScoreRangeClick) return;

		// Define score ranges based on risk grades
		const scoreRanges = {
			high: [0, 40] as [number, number], // CM4-CM5 typically have lower scores
			low: [80, 100] as [number, number] // CM1-CM2 typically have higher scores
		};

		onRiskScoreRangeClick(scoreRanges[type]);
	};

	const getChartData = () => {
		return grades.map((grade) => {
			const count = data[grade] || 0;
			const percentage = totalCount > 0 ? ((count / totalCount) * 100) : 0;
			const config = RISK_GRADE_CONFIG[grade];

			return {
				name: config.label,
				value: viewMode === 'count' ? count : percentage,
				count: count,
				percentage: percentage,
				color: config.color,
				description: config.description,
				grade: grade
			};
		}).filter(item => item.count > 0); // Only show grades with data
	};

	const CustomTooltip = ({ active, payload }: any) => {
		if (active && payload && payload.length) {
			const data = payload[0].payload;
			return (
				<div className="bg-white p-3 border border-neutral-30 rounded shadow-lg">
					<p className="font-medium text-neutral-90 mb-2">{data.name}</p>
					<div className="space-y-1 text-sm">
						<p className="text-neutral-70">
							Companies: <span className="font-medium">{data.count}</span>
						</p>
						<p className="text-neutral-70">
							Percentage: <span className="font-medium">{data.percentage.toFixed(1)}%</span>
						</p>
						<p className="text-neutral-70">
							{data.description}
						</p>
						{isInteractive && (
							<p className="text-blue-600 text-xs mt-2">
								Click to filter by this risk grade
							</p>
						)}
					</div>
				</div>
			);
		}
		return null;
	};

	const handleChartClick = (data: any) => {
		if (!isInteractive || !onRiskGradeClick) return;
		handleRiskGradeClick(data.grade);
	};

	return (
		<Card className="relative">
			{/* <LoadingOverlay isVisible={isLoading} message="Updating risk data..." /> */}

			<div className="flex items-center justify-between mb-4">
				<h3 className='text-lg font-semibold text-neutral-90'>
					Risk Distribution
				</h3>
				<div className="flex items-center gap-2">
					{displayMode === 'chart' && (
						<select
							value={viewMode}
							onChange={(e) => setViewMode(e.target.value as any)}
							className="text-xs border border-neutral-30 rounded px-2 py-1"
						>
							<option value="count">Company Count</option>
							<option value="percentage">Percentage</option>
						</select>
					)}
					<span className="text-sm text-neutral-70">
						Total: {totalCount} companies
					</span>
				</div>
			</div>

			{displayMode === 'chart' ? (
				<div className="mb-6">
					<div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
						{/* Pie Chart */}
						<div className="h-64">
							<h4 className="text-sm font-medium text-neutral-70 mb-2">Distribution Overview</h4>
							<ResponsiveContainer width="100%" height="100%">
								<PieChart>
									<Pie
										data={getChartData()}
										cx="50%"
										cy="50%"
										innerRadius={40}
										outerRadius={80}
										paddingAngle={2}
										dataKey="value"
										onClick={handleChartClick}
										cursor={isInteractive ? "pointer" : "default"}
									>
										{getChartData().map((entry, index) => {
											const isSelected = activeRiskGrades.includes(entry.grade);
											return (
												<Cell
													key={`cell-${index}`}
													fill={entry.color}
													stroke={isSelected ? "#3b82f6" : "none"}
													strokeWidth={isSelected ? 3 : 0}
													fillOpacity={isSelected ? 1 : 0.8}
												/>
											);
										})}
									</Pie>
									<Tooltip content={<CustomTooltip />} />
								</PieChart>
							</ResponsiveContainer>
						</div>

						{/* Bar Chart */}
						<div className="h-64">
							<h4 className="text-sm font-medium text-neutral-70 mb-2">
								{viewMode === 'count' ? 'Company Count' : 'Percentage Distribution'}
							</h4>
							<ResponsiveContainer width="100%" height="100%">
								<BarChart data={getChartData()} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
									<CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
									<XAxis
										dataKey="name"
										fontSize={12}
										stroke="#6b7280"
									/>
									<YAxis
										fontSize={12}
										stroke="#6b7280"
										tickFormatter={(value) => viewMode === 'percentage' ? `${value}%` : value.toString()}
									/>
									<Tooltip content={<CustomTooltip />} />
									<Bar
										dataKey="value"
										radius={[4, 4, 0, 0]}
										cursor={isInteractive ? "pointer" : "default"}
										onClick={handleChartClick}
									>
										{getChartData().map((entry, index) => {
											const isSelected = activeRiskGrades.includes(entry.grade);
											return (
												<Cell
													key={`cell-${index}`}
													fill={entry.color}
													stroke={isSelected ? "#3b82f6" : "none"}
													strokeWidth={isSelected ? 2 : 0}
													fillOpacity={isSelected ? 1 : 0.8}
												/>
											);
										})}
									</Bar>
								</BarChart>
							</ResponsiveContainer>
						</div>
					</div>
				</div>
			) : (
				<div className='space-y-3'>
					{grades.map((grade) => {
						const count = data[grade] || 0;
						const percentage = maxCount > 0 ? (count / maxCount) * 100 : 0;
						const totalPercentage = totalCount > 0 ? ((count / totalCount) * 100).toFixed(1) : '0.0';
						const config = RISK_GRADE_CONFIG[grade];

						const isSelected = activeRiskGrades.includes(grade);
						const isHovered = hoveredGrade === grade;
						const isClickable = isInteractive && count > 0;

						const visualStyles = getChartElementStyles({
							isInteractive,
							isSelected,
							isHovered,
							isClickable,
							isLoading
						});

						return (
							<div
								key={grade}
								className={`group ${visualStyles.containerClasses} ${visualStyles.cursorStyle}`}
								onClick={() => handleRiskGradeClick(grade)}
								onMouseEnter={() => isClickable && setHoveredGrade(grade)}
								onMouseLeave={() => setHoveredGrade(null)}
								style={visualStyles.barStyles}
							>
								<div className='flex items-center justify-between mb-1'>
									<div className='flex items-center gap-2'>
										<div
											className={`w-3 h-3 rounded-full ${visualStyles.indicatorClasses}`}
											style={getColorIndicatorStyles(config.color, isSelected, isHovered)}
										/>
										<span className={`text-sm font-medium ${visualStyles.textClasses}`}>
											{config.label}
										</span>
										<span className='text-xs text-neutral-60'>
											{config.description}
										</span>
										{isClickable && (
											<span className={getHoverHintClasses(isInteractive, isClickable)}>
												Click to filter
											</span>
										)}
									</div>
									<div className='flex items-center gap-2'>
										<span className={`text-sm font-medium ${visualStyles.textClasses}`}>
											{count}
										</span>
										<span className='text-xs text-neutral-60'>
											({totalPercentage}%)
										</span>
									</div>
								</div>

								<div className='flex-1 bg-neutral-20 rounded-full h-2 relative overflow-hidden'>
									<div
										className='absolute inset-y-0 left-0 rounded-full'
										style={getProgressBarStyles(percentage, config.color, isSelected, isHovered)}
									/>
								</div>
							</div>
						);
					})}
				</div>
			)}

			{/* Summary Statistics */}
			<div className="mt-4 pt-4 border-t border-neutral-30">
				<div className="grid grid-cols-2 gap-4 text-sm">
					<div
						className={`group transition-all duration-200 ${isInteractive ? 'cursor-pointer hover:bg-neutral-10 rounded p-2 -m-2' : ''
							}`}
						onClick={() => handleSummaryClick('high')}
					>
						<span className="text-neutral-60">High Risk (CM4-CM5):</span>
						<span className="ml-2 font-medium text-neutral-90">
							{((data.cm4 || 0) + (data.cm5 || 0))} companies
						</span>
						{isInteractive && (
							<span className={getHoverHintClasses(isInteractive, true)}>
								Click to filter
							</span>
						)}
					</div>
					<div
						className={`group transition-all duration-200 ${isInteractive ? 'cursor-pointer hover:bg-neutral-10 rounded p-2 -m-2' : ''
							}`}
						onClick={() => handleSummaryClick('low')}
					>
						<span className="text-neutral-60">Low Risk (CM1-CM2):</span>
						<span className="ml-2 font-medium text-neutral-90">
							{((data.cm1 || 0) + (data.cm2 || 0))} companies
						</span>
						{isInteractive && (
							<span className={getHoverHintClasses(isInteractive, true)}>
								Click to filter
							</span>
						)}
					</div>
				</div>
			</div>
		</Card>
	);
}
