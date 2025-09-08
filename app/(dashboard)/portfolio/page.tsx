// app/(dashboard)/portfolio/page.tsx
"use client";

import { useQuery } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { Building2, TrendingUp, AlertCircle, DollarSign } from "lucide-react";
import { Card } from "@/components/ui/Card";
import { PortfolioGrid } from "@/components/portfolio/PortfolioGrid";
import { RiskDistribution } from "@/components/portfolio/RiskDistribution";
import { RatingDistribution } from "@/components/portfolio/RatingDistribution";
import { CompanySearchBar } from "@/components/portfolio/CompanySearchBar";

export default function PortfolioPage() {
	const router = useRouter();

	const { data: analytics, isLoading } = useQuery({
		queryKey: ["analytics"],
		queryFn: async () => {
			const response = await fetch("/api/portfolio/analytics");
			if (!response.ok) throw new Error("Failed to fetch analytics");
			return response.json();
		},
	});

	if (isLoading) {
		return (
			<div className='flex items-center justify-center h-full'>
				<div className='text-center'>
					<div className='animate-spin rounded-full h-12 w-12 border-b-2 border-primary-500 mx-auto'></div>
					<p className='mt-4 text-neutral-60'>Loading portfolio...</p>
				</div>
			</div>
		);
	}

	// Calculate high risk companies (CM5, CM6, CM7 + D rating)
	const highRiskCount = (analytics?.risk_distribution?.cm5 || 0) +
		(analytics?.risk_distribution?.cm6 || 0) +
		(analytics?.risk_distribution?.cm7 || 0) +
		(analytics?.rating_distribution?.D || 0);

	return (
		<div className='p-8'>
			<div className='mb-8'>
				<div className='flex items-center justify-between'>
					<div>
						<h1 className='text-3xl font-bold text-neutral-90'>
							Credit Portfolio Management
						</h1>
						<p className='text-neutral-60 mt-2'>
							Monitor and analyze your complete credit portfolio
						</p>
					</div>
					<CompanySearchBar />
				</div>
			</div>

			<div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8'>
				<Card>
					<div className='flex items-start justify-between'>
						<div>
							<p className='text-sm text-neutral-60'>Total Companies</p>
							<p className='text-2xl font-bold text-neutral-90'>
								{analytics?.total_companies || 0}
							</p>
						</div>
						<div className='p-3 bg-primary-50 rounded-lg'>
							<Building2 className='w-6 h-6 text-primary-500' />
						</div>
					</div>
				</Card>

				<Card>
					<div className='flex items-start justify-between'>
						<div>
							<p className='text-sm text-neutral-60'>Total Exposure</p>
							<p className='text-2xl font-bold text-neutral-90'>
								₹{(analytics?.total_exposure || 0).toFixed(0)} Cr
							</p>
						</div>
						<div className='p-3 bg-success bg-opacity-10 rounded-lg'>
							<DollarSign className='w-6 h-6 text-success' />
						</div>
					</div>
				</Card>

				<Card>
					<div className='flex items-start justify-between'>
						<div>
							<p className='text-sm text-neutral-60'>Avg Risk Score</p>
							<p className='text-2xl font-bold text-neutral-90'>
								{analytics?.average_risk_score?.toFixed(1) || "0"}
							</p>
						</div>
						<div className='p-3 bg-warning bg-opacity-10 rounded-lg'>
							<TrendingUp className='w-6 h-6 text-warning' />
						</div>
					</div>
				</Card>

				<Card>
					<div className='flex items-start justify-between'>
						<div>
							<p className='text-sm text-neutral-60'>High Risk</p>
							<p className='text-2xl font-bold text-neutral-90'>
								{highRiskCount}
							</p>
							<p className='text-xs text-neutral-60 mt-1'>CM5-CM7 + D rating</p>
						</div>
						<div className='p-3 bg-error bg-opacity-10 rounded-lg'>
							<AlertCircle className='w-6 h-6 text-error' />
						</div>
					</div>
				</Card>
			</div>

			{/* Distribution Charts */}
			<div className='grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8'>
				<RiskDistribution data={analytics?.risk_distribution} />
				<RatingDistribution data={analytics?.rating_distribution} />
			</div>

			{/* Recent Assessments */}
			<div className='grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8'>
				<div className='lg:col-span-2'>
					{/* This space can be used for additional charts or insights */}
					<Card>
						<h3 className='text-lg font-semibold text-neutral-90 mb-4'>
							Portfolio Insights
						</h3>
						<div className='grid grid-cols-1 md:grid-cols-2 gap-6'>
							<div>
								<h4 className='text-md font-medium text-neutral-80 mb-3'>Risk Grade Summary</h4>
								<div className='space-y-2'>
									<div className='flex justify-between items-center'>
										<span className='text-sm text-neutral-60'>Low Risk (CM1-CM2):</span>
										<span className='text-sm font-medium text-success'>
											{((analytics?.risk_distribution?.cm1 || 0) + (analytics?.risk_distribution?.cm2 || 0))} companies
										</span>
									</div>
									<div className='flex justify-between items-center'>
										<span className='text-sm text-neutral-60'>Medium Risk (CM3-CM4):</span>
										<span className='text-sm font-medium text-warning'>
											{((analytics?.risk_distribution?.cm3 || 0) + (analytics?.risk_distribution?.cm4 || 0))} companies
										</span>
									</div>
									<div className='flex justify-between items-center'>
										<span className='text-sm text-neutral-60'>High Risk (CM5-CM7):</span>
										<span className='text-sm font-medium text-error'>
											{((analytics?.risk_distribution?.cm5 || 0) + (analytics?.risk_distribution?.cm6 || 0) + (analytics?.risk_distribution?.cm7 || 0))} companies
										</span>
									</div>
								</div>
							</div>
							<div>
								<h4 className='text-md font-medium text-neutral-80 mb-3'>Credit Rating Summary</h4>
								<div className='space-y-2'>
									<div className='flex justify-between items-center'>
										<span className='text-sm text-neutral-60'>Investment Grade:</span>
										<span className='text-sm font-medium text-success'>
											{((analytics?.rating_distribution?.AAA || 0) + (analytics?.rating_distribution?.AA || 0) + (analytics?.rating_distribution?.A || 0) + (analytics?.rating_distribution?.BBB || 0))} companies
										</span>
									</div>
									<div className='flex justify-between items-center'>
										<span className='text-sm text-neutral-60'>Speculative Grade:</span>
										<span className='text-sm font-medium text-warning'>
											{((analytics?.rating_distribution?.BB || 0) + (analytics?.rating_distribution?.B || 0) + (analytics?.rating_distribution?.C || 0) + (analytics?.rating_distribution?.D || 0))} companies
										</span>
									</div>
									<div className='flex justify-between items-center'>
										<span className='text-sm text-neutral-60'>Not Rated:</span>
										<span className='text-sm font-medium text-neutral-60'>
											{analytics?.rating_distribution?.['Not Rated'] || 0} companies
										</span>
									</div>
								</div>
							</div>
						</div>
					</Card>
				</div>

				<Card>
					<h3 className='text-lg font-semibold text-neutral-90 mb-4'>
						Recent Assessments
					</h3>
					<div className='space-y-3'>
						{analytics?.recent_assessments?.map((item: any, idx: number) => (
							<div
								key={idx}
								className='flex cursor-pointer justify-between items-center py-2 border-b border-neutral-20 hover:bg-neutral-10 transition-colors'
								onClick={() => router.push(`/portfolio/${item.request_id}`)}
							>
								<div className='flex-1'>
									<p className='font-medium text-neutral-80 text-sm'>
										{item.company_name}
									</p>
									<p className='text-xs text-neutral-60'>
										{new Date(item.submitted_at).toLocaleDateString()}
									</p>
									<div className='flex items-center gap-4 mt-1'>
										<div className='flex items-center gap-1'>
											<span className='text-xs text-neutral-60'>Risk:</span>
											<span className='text-xs font-medium text-neutral-80'>{item.risk_score} %</span>
										</div>
										<div className='flex items-center gap-1'>
											<span className='text-xs text-neutral-60'>Limit:</span>
											<span className='text-xs font-medium text-neutral-80'>
												{item.recommended_limit ? `₹${parseFloat(item.recommended_limit).toFixed(2)} Cr` : '-'}
											</span>
										</div>
									</div>
								</div>
								<div className='flex flex-col items-end gap-1'>
									<span
										className={`px-2 py-1 rounded-full text-xs font-medium ${item.risk_grade?.startsWith("CM1") || item.risk_grade?.startsWith("CM2")
											? "bg-green-100 text-green-700"
											: item.risk_grade?.startsWith("CM3") || item.risk_grade?.startsWith("CM4")
												? "bg-yellow-100 text-yellow-700"
												: item.risk_grade?.startsWith("CM5") || item.risk_grade?.startsWith("CM6") || item.risk_grade?.startsWith("CM7")
													? "bg-red-100 text-red-700"
													: "bg-gray-100 text-gray-700"
											}`}
									>
										{item.risk_grade || "N/A"}
									</span>
									{item.credit_rating && item.credit_rating !== 'Not Rated' && (
										<span className='text-xs text-neutral-60 bg-neutral-20 px-2 py-0.5 rounded'>
											{item.credit_rating}
										</span>
									)}
								</div>
							</div>
						))}
					</div>
				</Card>
			</div>

			<PortfolioGrid />
		</div>
	);
}