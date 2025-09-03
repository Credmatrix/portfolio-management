import {
	Building2,
	Search,
	Filter,
	Plus,
	Eye,
	Edit,
	Trash2,
} from "lucide-react";

export default function CompaniesPage() {
	const companies = [
		{
			id: 1,
			name: "TechCorp Solutions",
			industry: "Technology",
			creditRating: "A+",
			riskScore: 85,
			status: "Active",
			lastUpdated: "2024-01-15",
		},
		{
			id: 2,
			name: "Global Manufacturing Inc",
			industry: "Manufacturing",
			creditRating: "BBB",
			riskScore: 72,
			status: "Active",
			lastUpdated: "2024-01-14",
		},
		{
			id: 3,
			name: "Green Energy Co",
			industry: "Energy",
			creditRating: "A",
			riskScore: 78,
			status: "Review",
			lastUpdated: "2024-01-13",
		},
		{
			id: 4,
			name: "Financial Services Ltd",
			industry: "Finance",
			creditRating: "AA",
			riskScore: 92,
			status: "Active",
			lastUpdated: "2024-01-12",
		},
		{
			id: 5,
			name: "Healthcare Partners",
			industry: "Healthcare",
			creditRating: "BBB+",
			riskScore: 68,
			status: "Active",
			lastUpdated: "2024-01-11",
		},
	];

	const getStatusColor = (status: string) => {
		switch (status) {
			case "Active":
				return "bg-green-100 text-green-800";
			case "Review":
				return "bg-yellow-100 text-yellow-800";
			case "Suspended":
				return "bg-red-100 text-red-800";
			default:
				return "bg-gray-100 text-gray-800";
		}
	};

	const getRatingColor = (rating: string) => {
		if (rating.startsWith("AA") || rating.startsWith("A+"))
			return "text-green-600";
		if (rating.startsWith("A") || rating.startsWith("BBB+"))
			return "text-blue-600";
		if (rating.startsWith("BBB")) return "text-yellow-600";
		return "text-red-600";
	};

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
				<button className='inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500'>
					<Plus className='h-4 w-4 mr-2' />
					Add Company
				</button>
			</div>

			{/* Search and Filters */}
			<div className='bg-white rounded-lg shadow-sm border p-4 mb-6'>
				<div className='flex flex-col sm:flex-row gap-4'>
					<div className='flex-1'>
						<div className='relative'>
							<Search className='absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4' />
							<input
								type='text'
								placeholder='Search companies...'
								className='w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent'
							/>
						</div>
					</div>
					<div className='flex gap-2'>
						<select className='px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent'>
							<option>All Industries</option>
							<option>Technology</option>
							<option>Manufacturing</option>
							<option>Energy</option>
							<option>Finance</option>
							<option>Healthcare</option>
						</select>
						<select className='px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent'>
							<option>All Status</option>
							<option>Active</option>
							<option>Review</option>
							<option>Suspended</option>
						</select>
						<button className='inline-flex items-center px-3 py-2 border border-gray-300 rounded-lg hover:bg-gray-50'>
							<Filter className='h-4 w-4' />
						</button>
					</div>
				</div>
			</div>

			{/* Companies Table */}
			<div className='bg-white rounded-lg shadow-sm border overflow-hidden'>
				<div className='overflow-x-auto'>
					<table className='min-w-full divide-y divide-gray-200'>
						<thead className='bg-gray-50'>
							<tr>
								<th className='px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider'>
									Company
								</th>
								<th className='px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider'>
									Industry
								</th>
								<th className='px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider'>
									Credit Rating
								</th>
								<th className='px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider'>
									Risk Score
								</th>
								<th className='px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider'>
									Status
								</th>
								<th className='px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider'>
									Last Updated
								</th>
								<th className='px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider'>
									Actions
								</th>
							</tr>
						</thead>
						<tbody className='bg-white divide-y divide-gray-200'>
							{companies.map((company) => (
								<tr key={company.id} className='hover:bg-gray-50'>
									<td className='px-6 py-4 whitespace-nowrap'>
										<div className='flex items-center'>
											<div className='flex-shrink-0 h-10 w-10'>
												<div className='h-10 w-10 rounded-lg bg-blue-100 flex items-center justify-center'>
													<Building2 className='h-5 w-5 text-blue-600' />
												</div>
											</div>
											<div className='ml-4'>
												<div className='text-sm font-medium text-gray-900'>
													{company.name}
												</div>
												<div className='text-sm text-gray-500'>
													ID: {company.id}
												</div>
											</div>
										</div>
									</td>
									<td className='px-6 py-4 whitespace-nowrap text-sm text-gray-900'>
										{company.industry}
									</td>
									<td className='px-6 py-4 whitespace-nowrap'>
										<span
											className={`text-sm font-semibold ${getRatingColor(
												company.creditRating
											)}`}
										>
											{company.creditRating}
										</span>
									</td>
									<td className='px-6 py-4 whitespace-nowrap'>
										<div className='flex items-center'>
											<div className='w-16 bg-gray-200 rounded-full h-2 mr-2'>
												<div
													className='bg-blue-600 h-2 rounded-full'
													style={{ width: `${company.riskScore}%` }}
												></div>
											</div>
											<span className='text-sm text-gray-900'>
												{company.riskScore}
											</span>
										</div>
									</td>
									<td className='px-6 py-4 whitespace-nowrap'>
										<span
											className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(
												company.status
											)}`}
										>
											{company.status}
										</span>
									</td>
									<td className='px-6 py-4 whitespace-nowrap text-sm text-gray-500'>
										{company.lastUpdated}
									</td>
									<td className='px-6 py-4 whitespace-nowrap text-right text-sm font-medium'>
										<div className='flex justify-end space-x-2'>
											<button className='text-blue-600 hover:text-blue-900'>
												<Eye className='h-4 w-4' />
											</button>
											<button className='text-green-600 hover:text-green-900'>
												<Edit className='h-4 w-4' />
											</button>
											<button className='text-red-600 hover:text-red-900'>
												<Trash2 className='h-4 w-4' />
											</button>
										</div>
									</td>
								</tr>
							))}
						</tbody>
					</table>
				</div>
			</div>

			{/* Pagination */}
			<div className='bg-white px-4 py-3 flex items-center justify-between border-t border-gray-200 sm:px-6 mt-4 rounded-lg shadow-sm'>
				<div className='flex-1 flex justify-between sm:hidden'>
					<button className='relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50'>
						Previous
					</button>
					<button className='ml-3 relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50'>
						Next
					</button>
				</div>
				<div className='hidden sm:flex-1 sm:flex sm:items-center sm:justify-between'>
					<div>
						<p className='text-sm text-gray-700'>
							Showing <span className='font-medium'>1</span> to{" "}
							<span className='font-medium'>5</span> of{" "}
							<span className='font-medium'>5</span> results
						</p>
					</div>
					<div>
						<nav className='relative z-0 inline-flex rounded-md shadow-sm -space-x-px'>
							<button className='relative inline-flex items-center px-2 py-2 rounded-l-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50'>
								Previous
							</button>
							<button className='relative inline-flex items-center px-4 py-2 border border-gray-300 bg-white text-sm font-medium text-gray-700 hover:bg-gray-50'>
								1
							</button>
							<button className='relative inline-flex items-center px-2 py-2 rounded-r-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50'>
								Next
							</button>
						</nav>
					</div>
				</div>
			</div>
		</div>
	);
}
