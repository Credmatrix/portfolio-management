"use client";

import { useState } from "react";
import { FileUpload } from "@/components/forms/FileUpload";
import { UploadProgress } from "@/components/forms/UploadProgress";
import { ProcessingQueue } from "@/components/forms/ProcessingQueue";
import { UploadHistory } from "@/components/forms/UploadHistory";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/Tabs";
import { Upload, History, ListChecks } from "lucide-react";

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
	const [activeTab, setActiveTab] = useState("upload");
	const [uploadRequests, setUploadRequests] = useState<UploadRequest[]>([]);
	const [refreshTrigger, setRefreshTrigger] = useState(0);

	// Refresh data when upload completes or status changes
	const handleUploadComplete = (newRequest: UploadRequest) => {
		setUploadRequests(prev => [newRequest, ...prev]);
		setRefreshTrigger(prev => prev + 1);
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
					Upload company documents for credit analysis and portfolio management
				</p>
			</div>

			<Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
				<TabsList className="grid w-full grid-cols-3">
					<TabsTrigger value="upload" className="flex items-center gap-2">
						<Upload className="w-4 h-4" />
						Upload Documents
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

				<TabsContent value="upload" className="space-y-6">
					<FileUpload
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