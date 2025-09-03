// components/portfolio/RiskDistribution.tsx
import { Card } from "@/components/ui/Card";
import { FluentColors } from "@/lib/constants/colors";
import { RiskDistributionData } from "@/types/analytics.types";

interface RiskDistributionProps {
	data: RiskDistributionData;
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

export function RiskDistribution({ data }: RiskDistributionProps) {
	if (!data) return null;

	const grades = Object.keys(RISK_GRADE_CONFIG) as Array<keyof typeof RISK_GRADE_CONFIG>;
	const maxCount = Math.max(...grades.map(grade => data[grade] || 0));
	const totalCount = data.total || grades.reduce((sum, grade) => sum + (data[grade] || 0), 0);

	return (
		<Card>
			<div className="flex items-center justify-between mb-4">
				<h3 className='text-lg font-semibold text-neutral-90'>
					Risk Distribution
				</h3>
				<span className="text-sm text-neutral-70">
					Total: {totalCount} companies
				</span>
			</div>

			<div className='space-y-3'>
				{grades.map((grade) => {
					const count = data[grade] || 0;
					const percentage = maxCount > 0 ? (count / maxCount) * 100 : 0;
					const totalPercentage = totalCount > 0 ? ((count / totalCount) * 100).toFixed(1) : '0.0';
					const config = RISK_GRADE_CONFIG[grade];

					return (
						<div key={grade} className='group'>
							<div className='flex items-center justify-between mb-1'>
								<div className='flex items-center gap-2'>
									<div
										className='w-3 h-3 rounded-full'
										style={{ backgroundColor: config.color }}
									/>
									<span className='text-sm font-medium text-neutral-90'>
										{config.label}
									</span>
									<span className='text-xs text-neutral-60'>
										{config.description}
									</span>
								</div>
								<div className='flex items-center gap-2'>
									<span className='text-sm font-medium text-neutral-90'>
										{count}
									</span>
									<span className='text-xs text-neutral-60'>
										({totalPercentage}%)
									</span>
								</div>
							</div>

							<div className='flex-1 bg-neutral-20 rounded-full h-2 relative overflow-hidden'>
								<div
									className='absolute inset-y-0 left-0 rounded-full transition-all duration-300 ease-out'
									style={{
										width: `${percentage}%`,
										backgroundColor: config.color
									}}
								/>
							</div>
						</div>
					);
				})}
			</div>

			{/* Summary Statistics */}
			<div className="mt-4 pt-4 border-t border-neutral-30">
				<div className="grid grid-cols-2 gap-4 text-sm">
					<div>
						<span className="text-neutral-60">High Risk (CM4-CM5):</span>
						<span className="ml-2 font-medium text-neutral-90">
							{((data.cm4 || 0) + (data.cm5 || 0))} companies
						</span>
					</div>
					<div>
						<span className="text-neutral-60">Low Risk (CM1-CM2):</span>
						<span className="ml-2 font-medium text-neutral-90">
							{((data.cm1 || 0) + (data.cm2 || 0))} companies
						</span>
					</div>
				</div>
			</div>
		</Card>
	);
}
