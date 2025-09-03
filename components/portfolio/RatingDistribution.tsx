// components/portfolio/RatingDistribution.tsx
import { Card } from "@/components/ui/Card";
import { FluentColors } from "@/lib/constants/colors";
import { RatingDistributionData } from "@/types/analytics.types";


interface RatingDistributionProps {
    data: RatingDistributionData;
}

const RATING_GRADE_CONFIG = {
    AAA: {
        label: 'AAA',
        color: FluentColors.success,
        description: 'Highest Safety',
        category: 'Investment Grade'
    },
    AA: {
        label: 'AA',
        color: '#0E8A0E',
        description: 'High Grade',
        category: 'Investment Grade'
    },
    A: {
        label: 'A',
        color: '#73AA24',
        description: 'Upper Medium',
        category: 'Investment Grade'
    },
    BBB: {
        label: 'BBB',
        color: FluentColors.warning,
        description: 'Lower Medium',
        category: 'Investment Grade'
    },
    BB: {
        label: 'BB',
        color: FluentColors.orange,
        description: 'Non-Investment',
        category: 'Speculative Grade'
    },
    B: {
        label: 'B',
        color: '#D13438',
        description: 'Highly Speculative',
        category: 'Speculative Grade'
    },
    C: {
        label: 'C',
        color: FluentColors.error,
        description: 'Extremely Speculative',
        category: 'Speculative Grade'
    },
    D: {
        label: 'D',
        color: '#8B0000',
        description: 'Default',
        category: 'Speculative Grade'
    },
    'Not Rated': {
        label: 'Not Rated',
        color: FluentColors.neutral[50],
        description: 'No Rating Available',
        category: 'Unrated'
    }
} as const;

export function RatingDistribution({ data }: RatingDistributionProps) {
    if (!data) return null;

    const ratings = Object.keys(RATING_GRADE_CONFIG) as Array<keyof typeof RATING_GRADE_CONFIG>;
    const maxCount = Math.max(...ratings.map(rating => data[rating] || 0));
    const totalCount = data.total || ratings.reduce((sum, rating) => sum + (data[rating] || 0), 0);

    // Calculate investment vs speculative grade totals
    const investmentGrade = (data.AAA || 0) + (data.AA || 0) + (data.A || 0) + (data.BBB || 0);
    const speculativeGrade = (data.BB || 0) + (data.B || 0) + (data.C || 0) + (data.D || 0);
    const notRated = data['Not Rated'] || 0;

    return (
        <Card>
            <div className="flex items-center justify-between mb-4">
                <h3 className='text-lg font-semibold text-neutral-90'>
                    Credit Rating Distribution
                </h3>
                <span className="text-sm text-neutral-70">
                    Total: {totalCount} companies
                </span>
            </div>

            <div className='space-y-3'>
                {ratings.map((rating) => {
                    const count = data[rating] || 0;
                    const percentage = maxCount > 0 ? (count / maxCount) * 100 : 0;
                    const totalPercentage = totalCount > 0 ? ((count / totalCount) * 100).toFixed(1) : '0.0';
                    const config = RATING_GRADE_CONFIG[rating];

                    return (
                        <div key={rating} className='group'>
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
                        <span className="text-neutral-60">Investment Grade:</span>
                        <span className="ml-2 font-medium text-neutral-90">
                            {investmentGrade} companies
                        </span>
                        <div className="text-xs text-neutral-60 mt-1">
                            ({totalCount > 0 ? ((investmentGrade / totalCount) * 100).toFixed(1) : '0.0'}%)
                        </div>
                    </div>
                    <div>
                        <span className="text-neutral-60">Speculative Grade:</span>
                        <span className="ml-2 font-medium text-neutral-90">
                            {speculativeGrade} companies
                        </span>
                        <div className="text-xs text-neutral-60 mt-1">
                            ({totalCount > 0 ? ((speculativeGrade / totalCount) * 100).toFixed(1) : '0.0'}%)
                        </div>
                    </div>
                </div>
                {notRated > 0 && (
                    <div className="mt-2 text-sm">
                        <span className="text-neutral-60">Not Rated:</span>
                        <span className="ml-2 font-medium text-neutral-90">
                            {notRated} companies
                        </span>
                        <span className="text-xs text-neutral-60 ml-1">
                            ({totalCount > 0 ? ((notRated / totalCount) * 100).toFixed(1) : '0.0'}%)
                        </span>
                    </div>
                )}
            </div>
        </Card>
    );
}