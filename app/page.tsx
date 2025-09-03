import Link from "next/link";
import {
	ArrowRight,
	Shield,
	BarChart3,
	Users,
	FileText,
	Upload,
	Settings,
	Building2,
} from "lucide-react";

export default function HomePage() {
	const authRoutes = [
		{
			name: "Login",
			path: "/auth/login",
			description: "User authentication and login",
			icon: Shield,
			color: "bg-blue-500",
		},
	];

	const dashboardRoutes = [
		{
			name: "Portfolio",
			path: "/portfolio",
			description: "Credit portfolio overview and management",
			icon: BarChart3,
			color: "bg-green-500",
		},
		{
			name: "Companies",
			path: "/companies",
			description: "Company profiles and credit analysis",
			icon: Building2,
			color: "bg-purple-500",
		},
		{
			name: "Reports",
			path: "/reports",
			description: "Credit risk reports and analytics",
			icon: FileText,
			color: "bg-orange-500",
		},
		{
			name: "Upload",
			path: "/upload",
			description: "Document upload and processing",
			icon: Upload,
			color: "bg-indigo-500",
		},
		{
			name: "Team",
			path: "/team",
			description: "Team management and collaboration",
			icon: Users,
			color: "bg-pink-500",
		},
		{
			name: "Settings",
			path: "/settings",
			description: "Application settings and preferences",
			icon: Settings,
			color: "bg-gray-500",
		},
		{
			name: "Security",
			path: "/security",
			description: "Security settings and access control",
			icon: Shield,
			color: "bg-red-500",
		},
	];

	return (
		<div className='min-h-screen bg-gradient-to-br from-slate-50 to-slate-100'>
			{/* Header */}
			<header className='bg-white shadow-sm border-b'>
				<div className='max-w-7xl mx-auto px-4 sm:px-6 lg:px-8'>
					<div className='flex justify-between items-center py-6'>
						<div>
							<h1 className='text-3xl font-bold text-gray-900'>
								Credit Portfolio Manager
							</h1>
							<p className='text-gray-600 mt-1'>
								Enterprise Credit Risk Management Dashboard
							</p>
						</div>
						<div className='flex space-x-4'>
							<Link
								href='/auth/login'
								className='inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500'
							>
								Login
								<ArrowRight className='ml-2 h-4 w-4' />
							</Link>
						</div>
					</div>
				</div>
			</header>

			{/* Main Content */}
			<main className='max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12'>
				{/* Welcome Section */}
				<div className='text-center mb-16'>
					<h2 className='text-4xl font-bold text-gray-900 mb-4'>
						Welcome to the Credit Portfolio Manager
					</h2>
					<p className='text-xl text-gray-600 max-w-3xl mx-auto'>
						A comprehensive platform for managing credit portfolios, analyzing
						risk, and making informed investment decisions. Explore the
						authentication system and dashboard features below.
					</p>
				</div>

				{/* Route Overview */}
				<div className='grid grid-cols-1 lg:grid-cols-2 gap-12 mb-16'>
					{/* Auth Routes */}
					<div className='bg-white rounded-lg shadow-lg p-8'>
						<div className='flex items-center mb-6'>
							<div className='p-3 bg-blue-100 rounded-lg'>
								<Shield className='h-8 w-8 text-blue-600' />
							</div>
							<div className='ml-4'>
								<h3 className='text-2xl font-bold text-gray-900'>
									Authentication Routes
								</h3>
								<p className='text-gray-600'>
									User authentication and access control
								</p>
							</div>
						</div>

						<div className='space-y-4'>
							{authRoutes.map((route) => (
								<Link
									key={route.path}
									href={route.path}
									className='block p-4 border border-gray-200 rounded-lg hover:border-blue-300 hover:bg-blue-50 transition-colors'
								>
									<div className='flex items-center justify-between'>
										<div className='flex items-center'>
											<div className={`p-2 rounded-lg ${route.color}`}>
												<route.icon className='h-5 w-5 text-white' />
											</div>
											<div className='ml-4'>
												<h4 className='font-semibold text-gray-900'>
													{route.name}
												</h4>
												<p className='text-sm text-gray-600'>
													{route.description}
												</p>
											</div>
										</div>
										<ArrowRight className='h-5 w-5 text-gray-400' />
									</div>
								</Link>
							))}
						</div>
					</div>

					{/* Dashboard Routes */}
					<div className='bg-white rounded-lg shadow-lg p-8'>
						<div className='flex items-center mb-6'>
							<div className='p-3 bg-green-100 rounded-lg'>
								<BarChart3 className='h-8 w-8 text-green-600' />
							</div>
							<div className='ml-4'>
								<h3 className='text-2xl font-bold text-gray-900'>
									Dashboard Routes
								</h3>
								<p className='text-gray-600'>
									Main application features and tools
								</p>
							</div>
						</div>

						<div className='space-y-4'>
							{dashboardRoutes.map((route) => (
								<Link
									key={route.path}
									href={route.path}
									className='block p-4 border border-gray-200 rounded-lg hover:border-green-300 hover:bg-green-50 transition-colors'
								>
									<div className='flex items-center justify-between'>
										<div className='flex items-center'>
											<div className={`p-2 rounded-lg ${route.color}`}>
												<route.icon className='h-5 w-5 text-white' />
											</div>
											<div className='ml-4'>
												<h4 className='font-semibold text-gray-900'>
													{route.name}
												</h4>
												<p className='text-sm text-gray-600'>
													{route.description}
												</p>
											</div>
										</div>
										<ArrowRight className='h-5 w-5 text-gray-400' />
									</div>
								</Link>
							))}
						</div>
					</div>
				</div>

				{/* Route Structure Information */}
				<div className='bg-white rounded-lg shadow-lg p-8'>
					<h3 className='text-2xl font-bold text-gray-900 mb-6'>
						Route Structure
					</h3>

					<div className='grid grid-cols-1 md:grid-cols-2 gap-8'>
						<div>
							<h4 className='text-lg font-semibold text-gray-900 mb-4'>
								Authentication Routes
							</h4>
							<div className='bg-gray-50 rounded-lg p-4 font-mono text-sm'>
								<div className='text-blue-600'>app/(auth)/</div>
								<div className='ml-4 text-gray-700'>
									├── layout.tsx
									<br />
									└── login/
									<br />
									&nbsp;&nbsp;&nbsp;&nbsp;└── page.tsx
								</div>
							</div>
						</div>

						<div>
							<h4 className='text-lg font-semibold text-gray-900 mb-4'>
								Dashboard Routes
							</h4>
							<div className='bg-gray-50 rounded-lg p-4 font-mono text-sm'>
								<div className='text-green-600'>app/(dashboard)/</div>
								<div className='ml-4 text-gray-700'>
									├── layout.tsx
									<br />
									├── portfolio/
									<br />
									├── companies/
									<br />
									├── reports/
									<br />
									├── upload/
									<br />
									├── team/
									<br />
									├── settings/
									<br />
									└── security/
								</div>
							</div>
						</div>
					</div>
				</div>

				{/* Features Overview */}
				<div className='mt-16 grid grid-cols-1 md:grid-cols-3 gap-8'>
					<div className='text-center'>
						<div className='p-4 bg-blue-100 rounded-full w-16 h-16 mx-auto mb-4 flex items-center justify-center'>
							<Shield className='h-8 w-8 text-blue-600' />
						</div>
						<h4 className='text-lg font-semibold text-gray-900 mb-2'>
							Secure Authentication
						</h4>
						<p className='text-gray-600'>
							Robust user authentication with role-based access control and
							security features.
						</p>
					</div>

					<div className='text-center'>
						<div className='p-4 bg-green-100 rounded-full w-16 h-16 mx-auto mb-4 flex items-center justify-center'>
							<BarChart3 className='h-8 w-8 text-green-600' />
						</div>
						<h4 className='text-lg font-semibold text-gray-900 mb-2'>
							Portfolio Management
						</h4>
						<p className='text-gray-600'>
							Comprehensive credit portfolio analysis, risk assessment, and
							reporting tools.
						</p>
					</div>

					<div className='text-center'>
						<div className='p-4 bg-purple-100 rounded-full w-16 h-16 mx-auto mb-4 flex items-center justify-center'>
							<Users className='h-8 w-8 text-purple-600' />
						</div>
						<h4 className='text-lg font-semibold text-gray-900 mb-2'>
							Team Collaboration
						</h4>
						<p className='text-gray-600'>
							Multi-user support with team management and collaborative
							features.
						</p>
					</div>
				</div>
			</main>

			{/* Footer */}
			<footer className='bg-white border-t mt-16'>
				<div className='max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8'>
					<div className='text-center text-gray-600'>
						<p>&copy; 2024 Credit Portfolio Manager. All rights reserved.</p>
					</div>
				</div>
			</footer>
		</div>
	);
}
