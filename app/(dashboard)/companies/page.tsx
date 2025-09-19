'use client';

import { useState } from 'react';
import { Search, Filter, Plus } from 'lucide-react';
import { useCompanies } from '@/lib/hooks/useCompanies';
import { CompanyFilters } from '@/types/company.types';
import { CompanyMetricsCards } from '@/components/companies/CompanyMetricsCards';
import { CompanyTable } from '@/components/companies/CompanyTable';
import { CompanyPaginationComponent } from '@/components/companies/CompanyPagination';
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui';

export default function CompaniesPage() {
	const [filters, setFilters] = useState<CompanyFilters>({
		search: '',
		industry: 'all',
		status: 'all',
		creditRating: 'all'
	});
	const [page, setPage] = useState(1);
	const limit = 10;
	const router = useRouter();

	const { companies, metrics, pagination, loading, error } = useCompanies({
		filters,
		page,
		limit
	});

	const handleFilterChange = (key: keyof CompanyFilters, value: string) => {
		setFilters(prev => ({ ...prev, [key]: value }));
		setPage(1); // Reset to first page when filters change
	};

	const handlePageChange = (newPage: number) => {
		setPage(newPage);
	};

	if (error) {
		return (
			<div className="p-6">
				<div className="bg-red-50 border border-red-200 rounded-lg p-4">
					<h3 className="text-red-800 font-medium">Error loading companies</h3>
					<p className="text-red-600 text-sm mt-1">{error}</p>
				</div>
			</div>
		);
	}

	return (
		<div className='p-6'>
			{/* Header */}
			<div className='flex justify-between items-center mb-6'>
				<div>
					<h1 className='text-2xl font-bold text-gray-900'>Companies</h1>
					<p className='text-gray-600'>
						Manage and analyze company credit profiles
					</p>
				</div>
				{/* <button className='inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500'>
					<Plus className='h-4 w-4 mr-2' />
					Add Company
				</button> */}
				<Button
					variant="primary"
					onClick={() => router.push('/companies/add')}
				>
					<Plus className="w-4 h-4 mr-2" />
					Add Company
				</Button>
			</div>

			{/* Metrics Cards */}
			<CompanyMetricsCards metrics={metrics} loading={loading} />

			{/* Search and Filters */}
			<div className='bg-white rounded-lg shadow-sm border p-4 mb-6'>
				<div className='flex flex-col sm:flex-row gap-4'>
					<div className='flex-1'>
						<div className='relative'>
							<Search className='absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4' />
							<input
								type='text'
								placeholder='Search companies by name, CIN, or PAN...'
								value={filters.search}
								onChange={(e) => handleFilterChange('search', e.target.value)}
								className='w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent'
							/>
						</div>
					</div>
					<div className='flex gap-2'>
						<select
							value={filters.industry}
							onChange={(e) => handleFilterChange('industry', e.target.value)}
							className='px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent'
						>
							<option value="all">All Industries</option>
							<option value="manufacturing">Manufacturing</option>
							<option value="technology">Technology</option>
							<option value="services">Services</option>
							<option value="trading">Trading</option>
							<option value="construction">Construction</option>
							<option value="textiles">Textiles</option>
							<option value="pharmaceuticals">Pharmaceuticals</option>
							<option value="food_processing">Food Processing</option>
							<option value="automotive">Automotive</option>
							<option value="chemicals">Chemicals</option>
						</select>
						<select
							value={filters.creditRating}
							onChange={(e) => handleFilterChange('creditRating', e.target.value)}
							className='px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent'
						>
							<option value="all">All Ratings</option>
							<option value="AAA">AAA</option>
							<option value="AA+">AA+</option>
							<option value="AA">AA</option>
							<option value="AA-">AA-</option>
							<option value="A+">A+</option>
							<option value="A">A</option>
							<option value="A-">A-</option>
							<option value="BBB+">BBB+</option>
							<option value="BBB">BBB</option>
							<option value="BBB-">BBB-</option>
							<option value="BB+">BB+</option>
							<option value="BB">BB</option>
							<option value="BB-">BB-</option>
							<option value="B+">B+</option>
							<option value="B">B</option>
							<option value="B-">B-</option>
						</select>
						<button className='inline-flex items-center px-3 py-2 border border-gray-300 rounded-lg hover:bg-gray-50'>
							<Filter className='h-4 w-4' />
						</button>
					</div>
				</div>
			</div>

			{/* Companies Table */}
			<CompanyTable companies={companies} loading={loading} />

			{/* Pagination */}
			<CompanyPaginationComponent
				pagination={pagination}
				onPageChange={handlePageChange}
			/>
		</div>
	);
}
