// components/portfolio/CompanyCard.tsx
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Building2, TrendingUp, MapPin, Calendar, AlertTriangle, CheckCircle, XCircle, Eye, Download, RefreshCw, MoreHorizontal } from "lucide-react";
import { formatCurrency, formatDate, getRiskColor } from "@/lib/utils";
import { PortfolioCompany } from "@/types/portfolio.types";

interface CompanyCardProps {
	company: PortfolioCompany;
	onClick?: () => void;
	onRetry?: (requestId: string) => void;
	onDelete?: (requestId: string) => void;
	showActions?: boolean;
}

export function CompanyCard({ company, onClick, onRetry, onDelete, showActions = true }: CompanyCardProps) {
	const getRiskGradeBadge = (grade: string | null) => {
		if (!grade) return { color: 'bg-gray-100 text-gray-800', label: 'N/A' }

		switch (grade) {
			case 'CM1':
				return { color: 'bg-green-100 text-green-800', label: 'CM1 - Excellent' }
			case 'CM2':
				return { color: 'bg-blue-100 text-blue-800', label: 'CM2 - Good' }
			case 'CM3':
				return { color: 'bg-yellow-100 text-yellow-800', label: 'CM3 - Average' }
			case 'CM4':
				return { color: 'bg-orange-100 text-orange-800', label: 'CM4 - Poor' }
			case 'CM5':
				return { color: 'bg-red-100 text-red-800', label: 'CM5 - Critical' }
			default:
				return { color: 'bg-gray-100 text-gray-800', label: grade }
		}
	}

	const getStatusIcon = (status: string | null) => {
		switch (status) {
			case 'completed':
				return <CheckCircle className="w-4 h-4 text-green-500" />
			case 'processing':
				return <div className="w-4 h-4 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
			case 'failed':
				return <XCircle className="w-4 h-4 text-red-500" />
			case 'submitted':
				return <AlertTriangle className="w-4 h-4 text-yellow-500" />
			default:
				return <AlertTriangle className="w-4 h-4 text-gray-400" />
		}
	}

	const riskGradeBadge = getRiskGradeBadge(company.risk_grade)
	const companyLocation = company?.risk_analysis?.companyData?.addresses?.registered_address?.state || 'Unknown'
	const parameterCoverage = company.total_parameters && company.available_parameters
		? `${company.available_parameters}/${company.total_parameters}`
		: 'N/A'

	const handleDownloadReport = async (e: React.MouseEvent) => {
		e.stopPropagation()
		try {
			window.open(`/api/portfolio/${company.request_id}/pdf?download=true`, '_blank')
		} catch (error) {
			console.error('Error downloading report:', error)
		}
	}

	const handleRetry = (e: React.MouseEvent) => {
		e.stopPropagation()
		onRetry?.(company.request_id)
	}

	const handleDelete = (e: React.MouseEvent) => {
		e.stopPropagation()
		onDelete?.(company.request_id)
	}

	const handleViewDetails = (e: React.MouseEvent) => {
		e.stopPropagation()
		onClick?.()
	}

	return (
		<Card
			className='hover:shadow-lg transition-all duration-200 cursor-pointer hover:border-blue-300 group relative'
			onClick={onClick}
		>
			{/* Header with Company Icon and Risk Grade */}
			<div className='flex items-start justify-between mb-4'>
				<div className="flex items-center gap-3">
					<div className="p-2 bg-blue-50 rounded-lg group-hover:bg-blue-100 transition-colors">
						<Building2 className='w-6 h-6 text-blue-600' />
					</div>
					<div className="flex flex-col">
						<span className="text-xs text-neutral-60">Request ID</span>
						<span className="text-xs font-mono text-neutral-80">
							{company.request_id.slice(-8)}
						</span>
					</div>
				</div>
				<Badge className={`text-xs font-semibold ${riskGradeBadge.color}`}>
					{riskGradeBadge.label}
				</Badge>
			</div>

			{/* Company Name */}
			<h3 className='font-semibold text-neutral-90 mb-3 line-clamp-2 group-hover:text-blue-700 transition-colors'>
				{company.company_name || 'Unknown Company'}
			</h3>

			{/* Key Metrics Grid */}
			<div className='grid grid-cols-2 gap-3 mb-4'>
				<div className="space-y-2">
					<div className='flex justify-between items-center'>
						<span className='text-xs text-neutral-60'>Risk Score</span>
						<span className='text-sm font-semibold text-neutral-90'>
							{company.risk_score?.toFixed(1) || "N/A"}%
						</span>
					</div>
					<div className='flex justify-between items-center'>
						<span className='text-xs text-neutral-60'>Limit</span>
						<span className='text-sm font-semibold text-green-700'>
							₹{company.recommended_limit?.toFixed(1) || 0} Cr
						</span>
					</div>
				</div>
				<div className="space-y-2">
					<div className='flex justify-between items-center'>
						<span className='text-xs text-neutral-60'>Industry</span>
						<span className='text-xs text-neutral-80 truncate ml-2'>
							{company.industry || 'N/A'}
						</span>
					</div>
					<div className='flex justify-between items-center'>
						<span className='text-xs text-neutral-60'>Parameters</span>
						<span className='text-xs text-neutral-80'>
							{parameterCoverage}
						</span>
					</div>
				</div>
			</div>

			{/* Additional Info Row */}
			<div className='flex items-center justify-between text-xs text-neutral-60 pt-3 border-t border-neutral-20'>
				<div className="flex items-center gap-1">
					<MapPin className="w-3 h-3" />
					<span className="truncate">{companyLocation ?? '' }</span>
				</div>
				<div className="flex items-center gap-1">
					{getStatusIcon(company.status)}
					<span className="capitalize">{company.status || 'unknown'}</span>
				</div>
			</div>

			{/* Processing Date */}
			{company.completed_at && (
				<div className="flex items-center gap-1 text-xs text-neutral-50 mt-1">
					<Calendar className="w-3 h-3" />
					<span>Processed {formatDate(company.completed_at)}</span>
				</div>
			)}

			{/* Category Scores Bar (if available) */}
			{company.risk_analysis && (
				<div className="mt-3 pt-3 border-t border-neutral-20">
					<div className="text-xs text-neutral-60 mb-2">Category Scores</div>
					<div className="grid grid-cols-4 gap-1">
						{[
							{ label: 'F', score: company.risk_analysis.financialResult?.percentage, color: 'bg-blue-500' },
							{ label: 'B', score: company.risk_analysis.businessResult?.percentage, color: 'bg-green-500' },
							{ label: 'H', score: company.risk_analysis.hygieneResult?.percentage, color: 'bg-yellow-500' },
							{ label: 'Bk', score: company.risk_analysis.bankingResult?.percentage, color: 'bg-purple-500' }
						].map((category, index) => (
							<div key={index} className="text-center">
								<div className="text-xs font-medium text-neutral-70 mb-1">{category.label}</div>
								<div className="h-2 bg-neutral-20 rounded-full overflow-hidden">
									<div
										className={`h-full ${category.color} transition-all duration-300`}
										style={{ width: `${category.score || 0}%` }}
									/>
								</div>
								<div className="text-xs text-neutral-60 mt-1">
									{category.score?.toFixed(0) || 0}%
								</div>
							</div>
						))}
					</div>
				</div>
			)}

			{/* Action Buttons */}
			{showActions && (
				<div className="mt-3 pt-3 border-t border-neutral-20">
					<div className="flex items-center justify-between gap-2">
						<Button
							variant="outline"
							size="sm"
							onClick={handleViewDetails}
							className="flex items-center gap-1 text-xs flex-1"
						>
							<Eye className="w-3 h-3" />
							View
						</Button>

						{company.status === 'completed' && (
							<Button
								variant="outline"
								size="sm"
								onClick={handleDownloadReport}
								className="flex items-center gap-1 text-xs"
							>
								<Download className="w-3 h-3" />
								PDF
							</Button>
						)}

						{company.status === 'failed' && onRetry && (
							<Button
								variant="outline"
								size="sm"
								onClick={handleRetry}
								className="flex items-center gap-1 text-xs text-orange-600 hover:text-orange-700"
							>
								<RefreshCw className="w-3 h-3" />
								Retry
							</Button>
						)}

						{onDelete && (
							<Button
								variant="outline"
								size="sm"
								onClick={handleDelete}
								className="flex items-center gap-1 text-xs text-red-600 hover:text-red-700"
							>
								<MoreHorizontal className="w-3 h-3" />
							</Button>
						)}
					</div>
				</div>
			)}
		</Card>
	);
}
