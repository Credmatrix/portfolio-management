// components/portfolio/FilterPanel.tsx
'use client'

import { useState } from 'react'
import { FilterCriteria } from '@/types/portfolio.types'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Select } from '@/components/ui/Select'
import { Checkbox } from '@/components/ui/Checkbox'

interface FilterPanelProps {
	filters: FilterCriteria;
	onFilterChange: (filters: FilterCriteria) => void;
	onSearch: (query: string) => void;
}

export function FilterPanel({ filters, onFilterChange, onSearch }: FilterPanelProps) {
	const [isExpanded, setIsExpanded] = useState(false)
	const [searchQuery, setSearchQuery] = useState(filters.search_query || '')

	const handleSearchSubmit = (e: React.FormEvent) => {
		e.preventDefault()
		onSearch(searchQuery)
	}

	const handleFilterUpdate = (key: keyof FilterCriteria, value: any) => {
		onFilterChange({ ...filters, [key]: value })
	}

	const handleMultiSelectUpdate = (key: keyof FilterCriteria, value: string, checked: boolean) => {
		const currentValues = (filters[key] as string[]) || []
		const newValues = checked 
			? [...currentValues, value]
			: currentValues.filter(v => v !== value)
		
		handleFilterUpdate(key, newValues.length > 0 ? newValues : undefined)
	}

	const clearAllFilters = () => {
		onFilterChange({})
		setSearchQuery('')
		onSearch('')
	}

	const activeFilterCount = Object.keys(filters).filter(key => {
		const value = filters[key as keyof FilterCriteria]
		return value !== undefined && value !== null && 
			(Array.isArray(value) ? value.length > 0 : true)
	}).length

	return (
		<div className='bg-white p-4 rounded-lg border border-neutral-30 shadow-sm'>
			{/* Search Bar */}
			<form onSubmit={handleSearchSubmit} className='mb-4'>
				<div className='flex gap-2'>
					<Input
						type='text'
						placeholder='Search companies, CIN, PAN, or industry...'
						value={searchQuery}
						onChange={(e) => setSearchQuery(e.target.value)}
						className='flex-1'
					/>
					<Button type='submit' variant='primary'>
						Search
					</Button>
				</div>
			</form>

			{/* Quick Filters */}
			<div className='flex flex-wrap gap-3 mb-4'>
				<Select
					value={filters.risk_grades?.[0] || ''}
					onChange={(value) => handleFilterUpdate('risk_grades', value ? [value] : undefined)}
					placeholder='Risk Grade'
					className='min-w-32'
				>
					<option value=''>All Grades</option>
					<option value='CM1'>CM1 - Excellent</option>
					<option value='CM2'>CM2 - Good</option>
					<option value='CM3'>CM3 - Average</option>
					<option value='CM4'>CM4 - Poor</option>
					<option value='CM5'>CM5 - Critical</option>
				</Select>

				<Select
					value={filters.industries?.[0] || ''}
					onChange={(value) => handleFilterUpdate('industries', value ? [value] : undefined)}
					placeholder='Industry'
					className='min-w-40'
				>
					<option value=''>All Industries</option>
					<option value='Manufacturing'>Manufacturing</option>
					<option value='Services'>Services</option>
					<option value='Technology'>Technology</option>
					<option value='Construction'>Construction</option>
					<option value='Trading'>Trading</option>
					<option value='Healthcare'>Healthcare</option>
					<option value='Education'>Education</option>
					<option value='Real Estate'>Real Estate</option>
					<option value='Agriculture'>Agriculture</option>
					<option value='Financial Services'>Financial Services</option>
				</Select>

				<Select
					value={filters.processing_status?.[0] || ''}
					onChange={(value) => handleFilterUpdate('processing_status', value ? [value] : undefined)}
					placeholder='Status'
					className='min-w-32'
				>
					<option value=''>All Status</option>
					<option value='completed'>Completed</option>
					<option value='processing'>Processing</option>
					<option value='submitted'>Submitted</option>
					<option value='failed'>Failed</option>
				</Select>

				<Button
					variant='outline'
					onClick={() => setIsExpanded(!isExpanded)}
					className='flex items-center gap-2'
				>
					Advanced Filters
					{activeFilterCount > 0 && (
						<span className='bg-blue-500 text-white text-xs rounded-full px-2 py-1'>
							{activeFilterCount}
						</span>
					)}
				</Button>

				{activeFilterCount > 0 && (
					<Button variant='outline' onClick={clearAllFilters}>
						Clear All
					</Button>
				)}
			</div>

			{/* Advanced Filters */}
			{isExpanded && (
				<div className='border-t border-neutral-30 pt-4 space-y-4'>
					{/* Risk Score Range */}
					<div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
						<div>
							<label className='block text-sm font-medium text-gray-700 mb-2'>
								Risk Score Range (%)
							</label>
							<div className='flex gap-2 items-center'>
								<Input
									type='number'
									placeholder='Min'
									min='0'
									max='100'
									value={filters.risk_score_range?.[0] || ''}
									onChange={(e) => {
										const min = e.target.value ? parseInt(e.target.value) : undefined
										const max = filters.risk_score_range?.[1]
										handleFilterUpdate('risk_score_range', 
											min !== undefined || max !== undefined ? [min || 0, max || 100] : undefined
										)
									}}
								/>
								<span>to</span>
								<Input
									type='number'
									placeholder='Max'
									min='0'
									max='100'
									value={filters.risk_score_range?.[1] || ''}
									onChange={(e) => {
										const max = e.target.value ? parseInt(e.target.value) : undefined
										const min = filters.risk_score_range?.[0]
										handleFilterUpdate('risk_score_range', 
											min !== undefined || max !== undefined ? [min || 0, max || 100] : undefined
										)
									}}
								/>
							</div>
						</div>

						<div>
							<label className='block text-sm font-medium text-gray-700 mb-2'>
								Recommended Limit Range (₹ Cr)
							</label>
							<div className='flex gap-2 items-center'>
								<Input
									type='number'
									placeholder='Min'
									min='0'
									value={filters.recommended_limit_range?.[0] || ''}
									onChange={(e) => {
										const min = e.target.value ? parseFloat(e.target.value) : undefined
										const max = filters.recommended_limit_range?.[1]
										handleFilterUpdate('recommended_limit_range', 
											min !== undefined || max !== undefined ? [min || 0, max || 1000] : undefined
										)
									}}
								/>
								<span>to</span>
								<Input
									type='number'
									placeholder='Max'
									min='0'
									value={filters.recommended_limit_range?.[1] || ''}
									onChange={(e) => {
										const max = e.target.value ? parseFloat(e.target.value) : undefined
										const min = filters.recommended_limit_range?.[0]
										handleFilterUpdate('recommended_limit_range', 
											min !== undefined || max !== undefined ? [min || 0, max || 1000] : undefined
										)
									}}
								/>
							</div>
						</div>
					</div>

					{/* Region Filter */}
					<div>
						<label className='block text-sm font-medium text-gray-700 mb-2'>
							Regions
						</label>
						<div className='grid grid-cols-2 md:grid-cols-4 gap-2'>
							{[
								'Maharashtra', 'Karnataka', 'Tamil Nadu', 'Gujarat', 
								'Delhi', 'Uttar Pradesh', 'West Bengal', 'Rajasthan',
								'Andhra Pradesh', 'Telangana', 'Kerala', 'Punjab'
							].map(region => (
								<Checkbox
									key={region}
									id={`region-${region}`}
									checked={filters.regions?.includes(region) || false}
									onChange={(checked) => handleMultiSelectUpdate('regions', region, checked)}
									label={region}
								/>
							))}
						</div>
					</div>

					{/* Compliance Status */}
					<div className='grid grid-cols-1 md:grid-cols-3 gap-4'>
						<div>
							<label className='block text-sm font-medium text-gray-700 mb-2'>
								GST Compliance
							</label>
							<div className='space-y-2'>
								{['Regular', 'Irregular', 'Unknown'].map(status => (
									<Checkbox
										key={status}
										id={`gst-${status}`}
										checked={filters.gst_compliance_status?.includes(status) || false}
										onChange={(checked) => handleMultiSelectUpdate('gst_compliance_status', status, checked)}
										label={status}
									/>
								))}
							</div>
						</div>

						<div>
							<label className='block text-sm font-medium text-gray-700 mb-2'>
								EPFO Compliance
							</label>
							<div className='space-y-2'>
								{['Regular', 'Irregular', 'Unknown'].map(status => (
									<Checkbox
										key={status}
										id={`epfo-${status}`}
										checked={filters.epfo_compliance_status?.includes(status) || false}
										onChange={(checked) => handleMultiSelectUpdate('epfo_compliance_status', status, checked)}
										label={status}
									/>
								))}
							</div>
						</div>

						<div>
							<label className='block text-sm font-medium text-gray-700 mb-2'>
								Audit Status
							</label>
							<div className='space-y-2'>
								{['Qualified', 'Unqualified', 'Unknown'].map(status => (
									<Checkbox
										key={status}
										id={`audit-${status}`}
										checked={filters.audit_qualification_status?.includes(status) || false}
										onChange={(checked) => handleMultiSelectUpdate('audit_qualification_status', status, checked)}
										label={status}
									/>
								))}
							</div>
						</div>
					</div>

					{/* Financial Metrics */}
					<div className='grid grid-cols-1 md:grid-cols-3 gap-4'>
						<div>
							<label className='block text-sm font-medium text-gray-700 mb-2'>
								EBITDA Margin Range (%)
							</label>
							<div className='flex gap-2 items-center'>
								<Input
									type='number'
									placeholder='Min'
									value={filters.ebitda_margin_range?.[0] || ''}
									onChange={(e) => {
										const min = e.target.value ? parseFloat(e.target.value) : undefined
										const max = filters.ebitda_margin_range?.[1]
										handleFilterUpdate('ebitda_margin_range', 
											min !== undefined || max !== undefined ? [min || -50, max || 100] : undefined
										)
									}}
								/>
								<span>to</span>
								<Input
									type='number'
									placeholder='Max'
									value={filters.ebitda_margin_range?.[1] || ''}
									onChange={(e) => {
										const max = e.target.value ? parseFloat(e.target.value) : undefined
										const min = filters.ebitda_margin_range?.[0]
										handleFilterUpdate('ebitda_margin_range', 
											min !== undefined || max !== undefined ? [min || -50, max || 100] : undefined
										)
									}}
								/>
							</div>
						</div>

						<div>
							<label className='block text-sm font-medium text-gray-700 mb-2'>
								Debt-to-Equity Range
							</label>
							<div className='flex gap-2 items-center'>
								<Input
									type='number'
									placeholder='Min'
									step='0.1'
									value={filters.debt_equity_range?.[0] || ''}
									onChange={(e) => {
										const min = e.target.value ? parseFloat(e.target.value) : undefined
										const max = filters.debt_equity_range?.[1]
										handleFilterUpdate('debt_equity_range', 
											min !== undefined || max !== undefined ? [min || 0, max || 10] : undefined
										)
									}}
								/>
								<span>to</span>
								<Input
									type='number'
									placeholder='Max'
									step='0.1'
									value={filters.debt_equity_range?.[1] || ''}
									onChange={(e) => {
										const max = e.target.value ? parseFloat(e.target.value) : undefined
										const min = filters.debt_equity_range?.[0]
										handleFilterUpdate('debt_equity_range', 
											min !== undefined || max !== undefined ? [min || 0, max || 10] : undefined
										)
									}}
								/>
							</div>
						</div>

						<div>
							<label className='block text-sm font-medium text-gray-700 mb-2'>
								Current Ratio Range
							</label>
							<div className='flex gap-2 items-center'>
								<Input
									type='number'
									placeholder='Min'
									step='0.1'
									value={filters.current_ratio_range?.[0] || ''}
									onChange={(e) => {
										const min = e.target.value ? parseFloat(e.target.value) : undefined
										const max = filters.current_ratio_range?.[1]
										handleFilterUpdate('current_ratio_range', 
											min !== undefined || max !== undefined ? [min || 0, max || 10] : undefined
										)
									}}
								/>
								<span>to</span>
								<Input
									type='number'
									placeholder='Max'
									step='0.1'
									value={filters.current_ratio_range?.[1] || ''}
									onChange={(e) => {
										const max = e.target.value ? parseFloat(e.target.value) : undefined
										const min = filters.current_ratio_range?.[0]
										handleFilterUpdate('current_ratio_range', 
											min !== undefined || max !== undefined ? [min || 0, max || 10] : undefined
										)
									}}
								/>
							</div>
						</div>
					</div>

					{/* Date Range */}
					<div>
						<label className='block text-sm font-medium text-gray-700 mb-2'>
							Processing Date Range
						</label>
						<div className='flex gap-2 items-center'>
							<Input
								type='date'
								value={filters.date_range?.[0]?.toISOString().split('T')[0] || ''}
								onChange={(e) => {
									const startDate = e.target.value ? new Date(e.target.value) : undefined
									const endDate = filters.date_range?.[1]
									handleFilterUpdate('date_range', 
										startDate || endDate ? [startDate || new Date(), endDate || new Date()] : undefined
									)
								}}
							/>
							<span>to</span>
							<Input
								type='date'
								value={filters.date_range?.[1]?.toISOString().split('T')[0] || ''}
								onChange={(e) => {
									const endDate = e.target.value ? new Date(e.target.value) : undefined
									const startDate = filters.date_range?.[0]
									handleFilterUpdate('date_range', 
										startDate || endDate ? [startDate || new Date(), endDate || new Date()] : undefined
									)
								}}
							/>
						</div>
					</div>
				</div>
			)}
		</div>
	);
}
