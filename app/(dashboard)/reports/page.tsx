'use client';

import React, { useState } from 'react';
import {
	FileText,
	Download,
	Eye,
	Calendar,
	TrendingUp,
	AlertTriangle,
	CheckCircle,
	Clock,
	Settings,
	Plus,
	Upload,
	BarChart3,
} from "lucide-react";
import { ReportGenerator } from '@/components/reports/ReportGenerator';
import { ExportFunctionality } from '@/components/reports/ExportFunctionality';
// import { ScheduledReports } from '@/components/reports/ScheduledReports';
import { ReportTemplates } from '@/components/reports/ReportTemplates';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Tabs } from '@/components/ui/Tabs';

export default function ReportsPage() {
	const [activeTab, setActiveTab] = useState('overview');

	const reports = [
		{
			id: 1,
			title: "Monthly Credit Risk Assessment",
			type: "Risk Analysis",
			status: "Completed",
			date: "2024-01-15",
			size: "2.4 MB",
			description:
				"Comprehensive monthly analysis of portfolio credit risk metrics",
		},
		{
			id: 2,
			title: "Company Credit Ratings Report",
			type: "Rating Report",
			status: "In Progress",
			date: "2024-01-14",
			size: "1.8 MB",
			description: "Updated credit ratings for all portfolio companies",
		},
		{
			id: 3,
			title: "Industry Sector Analysis",
			type: "Sector Report",
			status: "Completed",
			date: "2024-01-13",
			size: "3.1 MB",
			description: "Deep dive analysis of industry-specific credit trends",
		},
		{
			id: 4,
			title: "Portfolio Performance Summary",
			type: "Performance",
			status: "Pending",
			date: "2024-01-12",
			size: "1.2 MB",
			description: "Quarterly portfolio performance and return metrics",
		},
		{
			id: 5,
			title: "Credit Limit Review",
			type: "Limit Review",
			status: "Completed",
			date: "2024-01-11",
			size: "0.9 MB",
			description: "Annual review of credit limits and exposure levels",
		},
	];

	const reportTypes = [
		{ name: "All Reports", count: 15, icon: FileText, color: "bg-blue-500" },
		{
			name: "Risk Analysis",
			count: 5,
			icon: AlertTriangle,
			color: "bg-red-500",
		},
		{
			name: "Rating Reports",
			count: 4,
			icon: TrendingUp,
			color: "bg-green-500",
		},
		{
			name: "Sector Reports",
			count: 3,
			icon: FileText,
			color: "bg-purple-500",
		},
		{
			name: "Performance",
			count: 2,
			icon: CheckCircle,
			color: "bg-yellow-500",
		},
		{ name: "Limit Reviews", count: 1, icon: Clock, color: "bg-indigo-500" },
	];

	const tabOptions = [
		{ id: 'overview', label: 'Overview', icon: BarChart3 },
		{ id: 'generate', label: 'Generate Report', icon: Plus },
		{ id: 'export', label: 'Export Data', icon: Upload },
		{ id: 'scheduled', label: 'Scheduled Reports', icon: Calendar },
		{ id: 'templates', label: 'Templates', icon: Settings }
	];

	const getStatusColor = (status: string) => {
		switch (status) {
			case "Completed":
				return "bg-green-100 text-green-800";
			case "In Progress":
				return "bg-yellow-100 text-yellow-800";
			case "Pending":
				return "bg-gray-100 text-gray-800";
			default:
				return "bg-gray-100 text-gray-800";
		}
	};

	const getStatusIcon = (status: string) => {
		switch (status) {
			case "Completed":
				return <CheckCircle className='h-4 w-4' />;
			case "In Progress":
				return <Clock className='h-4 w-4' />;
			case "Pending":
				return <Clock className='h-4 w-4' />;
			default:
				return <Clock className='h-4 w-4' />;
		}
	};

	const handleReportGenerated = (reportId: string) => {
		console.log('Report generated:', reportId);
		// Refresh reports list or show success message
	};

	const handleExportComplete = (downloadUrl: string) => {
		console.log('Export completed:', downloadUrl);
		// Show success message or trigger download
	};

	const handleTemplateSelect = (templateId: string) => {
		setActiveTab('generate');
		// Pre-select the template in the generator
	};

	const renderTabContent = () => {
		switch (activeTab) {
			case 'overview':
				return (
					<div className="space-y-8">
						{/* Report Type Cards */}
						<div className='grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4'>
							{reportTypes.map((type) => (
								<Card
									key={type.name}
									className='p-4 hover:shadow-md transition-shadow cursor-pointer'
								>
									<div className='flex items-center justify-between'>
										<div className={`p-2 rounded-lg ${type.color}`}>
											<type.icon className='h-5 w-5 text-white' />
										</div>
										<span className='text-xs bg-gray-100 text-gray-600 px-2 py-1 rounded-full'>
											{type.count}
										</span>
									</div>
									<h3 className='text-sm font-medium text-gray-900 mt-3'>
										{type.name}
									</h3>
								</Card>
							))}
						</div>

						{/* Recent Reports */}
						<Card>
							<div className='px-6 py-4 border-b border-gray-200'>
								<h2 className='text-lg font-semibold text-gray-900'>
									Recent Reports
								</h2>
							</div>
							<div className='divide-y divide-gray-200'>
								{reports.map((report) => (
									<div key={report.id} className='px-6 py-4 hover:bg-gray-50'>
										<div className='flex items-center justify-between'>
											<div className='flex items-center space-x-4'>
												<div className='flex-shrink-0'>
													<div className='h-10 w-10 rounded-lg bg-blue-100 flex items-center justify-center'>
														<FileText className='h-5 w-5 text-blue-600' />
													</div>
												</div>
												<div className='flex-1 min-w-0'>
													<div className='flex items-center space-x-2'>
														<h3 className='text-sm font-medium text-gray-900 truncate'>
															{report.title}
														</h3>
														<span className='inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800'>
															{report.type}
														</span>
													</div>
													<p className='text-sm text-gray-500 mt-1'>
														{report.description}
													</p>
													<div className='flex items-center space-x-4 mt-2 text-xs text-gray-500'>
														<span className='flex items-center'>
															<Calendar className='h-3 w-3 mr-1' />
															{report.date}
														</span>
														<span>{report.size}</span>
													</div>
												</div>
											</div>
											<div className='flex items-center space-x-3'>
												<span
													className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(
														report.status
													)}`}
												>
													{getStatusIcon(report.status)}
													<span className='ml-1'>{report.status}</span>
												</span>
												<div className='flex space-x-2'>
													<Button variant="ghost" size="sm">
														<Eye className='h-4 w-4' />
													</Button>
													<Button variant="ghost" size="sm">
														<Download className='h-4 w-4' />
													</Button>
												</div>
											</div>
										</div>
									</div>
								))}
							</div>
						</Card>

						{/* Quick Actions */}
						<div className='grid grid-cols-1 md:grid-cols-3 gap-6'>
							<Card className='p-6'>
								<div className='flex items-center mb-4'>
									<div className='p-2 bg-red-100 rounded-lg'>
										<AlertTriangle className='h-6 w-6 text-red-600' />
									</div>
									<h3 className='ml-3 text-lg font-semibold text-gray-900'>
										Risk Alerts
									</h3>
								</div>
								<p className='text-gray-600 mb-4'>
									Monitor high-risk companies and credit limit breaches
								</p>
								<Button variant="outline" className='w-full'>
									View Alerts
								</Button>
							</Card>

							<Card className='p-6'>
								<div className='flex items-center mb-4'>
									<div className='p-2 bg-green-100 rounded-lg'>
										<TrendingUp className='h-6 w-6 text-green-600' />
									</div>
									<h3 className='ml-3 text-lg font-semibold text-gray-900'>
										Performance Metrics
									</h3>
								</div>
								<p className='text-gray-600 mb-4'>
									Track portfolio performance and key metrics
								</p>
								<Button variant="outline" className='w-full'>
									View Metrics
								</Button>
							</Card>

							<Card className='p-6'>
								<div className='flex items-center mb-4'>
									<div className='p-2 bg-blue-100 rounded-lg'>
										<FileText className='h-6 w-6 text-blue-600' />
									</div>
									<h3 className='ml-3 text-lg font-semibold text-gray-900'>
										Report Templates
									</h3>
								</div>
								<p className='text-gray-600 mb-4'>
									Create and manage custom report templates
								</p>
								<Button
									variant="outline"
									className='w-full'
									onClick={() => setActiveTab('templates')}
								>
									Manage Templates
								</Button>
							</Card>
						</div>
					</div>
				);

			case 'generate':
				return (
					<ReportGenerator
						onReportGenerated={handleReportGenerated}
					/>
				);

			case 'export':
				return (
					<ExportFunctionality
						onExportComplete={handleExportComplete}
					/>
				);

			// case 'scheduled':
			// return <ScheduledReports />;

			case 'templates':
				return (
					<ReportTemplates
						onTemplateSelect={handleTemplateSelect}
					/>
				);

			default:
				return null;
		}
	};

	return (
		<div className='p-6'>
			{/* Header */}
			<div className='flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6'>
				<div>
					<h1 className='text-2xl font-bold text-gray-900'>Reports & Analytics</h1>
					<p className='text-gray-600'>
						Generate comprehensive portfolio reports and export data
					</p>
				</div>
				<div className="flex items-center space-x-3">
					<Button
						variant="outline"
						onClick={() => setActiveTab('export')}
					>
						<Upload className='h-4 w-4 mr-2' />
						Export Data
					</Button>
					<Button onClick={() => setActiveTab('generate')}>
						<Plus className='h-4 w-4 mr-2' />
						Generate Report
					</Button>
				</div>
			</div>

			{/* Navigation Tabs */}
			{/* <Tabs
				tabs={tabOptions}
				activeTab={activeTab}
				onTabChange={setActiveTab}
				className="mb-6"
			/> */}

			{/* Tab Content */}
			{renderTabContent()}
		</div>
	);
}
