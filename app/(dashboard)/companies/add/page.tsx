"use client";

import { useState, useEffect } from "react";
import { useSearchParams } from "next/navigation";
import { CompanySearch } from "@/components/forms/CompanySearch";
import { UnifiedProcessing } from "@/components/forms/UnifiedProcessing";
import { UploadProgress } from "@/components/forms/UploadProgress";
import { ProcessingQueue } from "@/components/forms/ProcessingQueue";
import { UploadHistory } from "@/components/forms/UploadHistory";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/Tabs";
import { Upload, History, ListChecks, Search, Zap } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { CompanyDetails } from "@/types/company.types";

interface UploadRequest {
	id: string;
	request_id: string;
	company_name: string;
	filename: string;
	status: 'upload_pending' | 'submitted' | 'processing' | 'completed' | 'failed';
	progress?: number;
	submitted_at: string;
	error_message?: string;
}

export default function UploadPage() {
	const searchParams = useSearchParams();
	const [activeTab, setActiveTab] = useState("search");
	const [uploadRequests, setUploadRequests] = useState<UploadRequest[]>([]);
	const [refreshTrigger, setRefreshTrigger] = useState(0);
	const [selectedCompany, setSelectedCompany] = useState<CompanyDetails | null>(null);

	// Check for pre-filled company data from URL params
	useEffect(() => {
		const companyName = searchParams.get('company_name');
		const companyId = searchParams.get('company_id');

		if (companyName && companyId) {
			// If we have URL params, we could potentially pre-populate the search
			// For now, we'll just clear any existing selection
			setSelectedCompany(null);
		}
	}, [searchParams]);

	// Handle company selection from search
	const handleCompanySelect = (company: CompanyDetails) => {
		setSelectedCompany(company);
	};

	// Handle API processing start
	const handleApiProcessingStart = (requestId: string) => {
		// Create a mock upload request for tracking
		const newRequest: UploadRequest = {
			id: requestId,
			request_id: requestId,
			company_name: selectedCompany?.company_name || 'Unknown',
			filename: 'API_PROCESSING',
			status: 'processing',
			submitted_at: new Date().toISOString(),
		};

		setUploadRequests(prev => [newRequest, ...prev]);
		setRefreshTrigger(prev => prev + 1);
		setActiveTab("queue");
	};

	// Refresh data when upload completes or status changes
	const handleUploadComplete = (newRequest: UploadRequest) => {
		setUploadRequests(prev => [newRequest, ...prev]);
		setRefreshTrigger(prev => prev + 1);
		setSelectedCompany(null);
		setActiveTab("queue")
	};

	const handleStatusUpdate = (requestId: string, status: string, progress?: number) => {
		setUploadRequests(prev =>
			prev.map(req =>
				req.request_id === requestId
					? { ...req, status: status as any, progress }
					: req
			)
		);
		setRefreshTrigger(prev => prev + 1);
	};

	return (
		<div className="p-8 max-w-6xl mx-auto">
			<div className="mb-8">
				<h1 className="text-3xl font-bold text-neutral-90 mb-2">
					Document Upload & Processing
				</h1>
				<p className="text-neutral-70">
					Upload company documents or process using API data for credit analysis and portfolio management
				</p>
			</div>

			<Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
				<TabsList className="grid w-full grid-cols-4">
					<TabsTrigger value="search" className="flex items-center gap-2">
						<Search className="w-4 h-4" />
						Company Search
					</TabsTrigger>
					<TabsTrigger value="processing" className="flex items-center gap-2">
						<Zap className="w-4 h-4" />
						Processing
					</TabsTrigger>
					<TabsTrigger value="queue" className="flex items-center gap-2">
						<ListChecks className="w-4 h-4" />
						Processing Queue
					</TabsTrigger>
					<TabsTrigger value="history" className="flex items-center gap-2">
						<History className="w-4 h-4" />
						Upload History
					</TabsTrigger>
				</TabsList>

				<TabsContent value="search" className="space-y-6">
					<CompanySearch
						onCompanySelect={handleCompanySelect}
						selectedCompany={selectedCompany}
					/>
					{selectedCompany && (
						<div className="flex justify-center">
							<Button
								onClick={() => setActiveTab("processing")}
							>
								Start Processing
							</Button>
						</div>
					)}
				</TabsContent>

				<TabsContent value="processing" className="space-y-6">
					<UnifiedProcessing
						selectedCompany={selectedCompany}
						onProcessingStart={handleApiProcessingStart}
						onUploadComplete={handleUploadComplete}
						onStatusUpdate={handleStatusUpdate}
					/>
					{uploadRequests.filter(req => req.status === 'processing' || req.status === 'submitted').length > 0 && (
						<UploadProgress
							requests={uploadRequests.filter(req => req.status === 'processing' || req.status === 'submitted')}
							onStatusUpdate={handleStatusUpdate}
						/>
					)}
				</TabsContent>

				<TabsContent value="queue">
					<ProcessingQueue
						refreshTrigger={refreshTrigger}
						onStatusUpdate={handleStatusUpdate}
					/>
				</TabsContent>

				<TabsContent value="history">
					<UploadHistory
						refreshTrigger={refreshTrigger}
					/>
				</TabsContent>
			</Tabs>
		</div>
	);
}