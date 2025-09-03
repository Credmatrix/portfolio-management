"use client";

import { useState, useEffect } from "react";
import { Card } from "@/components/ui/Card";
import { Badge, BadgeVariant } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";
import {
    Clock,
    CheckCircle,
    AlertCircle,
    FileText,
    Eye,
    Download,
    Search,
    ChevronLeft,
    ChevronRight,
    Loader2
} from "lucide-react";

interface HistoryRequest {
    id: string;
    request_id: string;
    company_name: string;
    original_filename: string;
    file_size: number;
    industry: string;
    model_type: string;
    status: 'upload_pending' | 'submitted' | 'processing' | 'completed' | 'failed';
    submitted_at: string;
    processing_started_at?: string;
    completed_at?: string;
    error_message?: string;
    retry_count: number;
    risk_score?: number;
    risk_grade?: string;
    recommended_limit?: number;
    pdf_filename?: string;
}

interface UploadHistoryProps {
    refreshTrigger: number;
}

const STATUS_CONFIG = {
    upload_pending: {
        label: 'Upload Pending',
        color: 'gray' as const,
        icon: Clock
    },
    submitted: {
        label: 'Queued',
        color: 'blue' as const,
        icon: Clock
    },
    processing: {
        label: 'Processing',
        color: 'yellow' as const,
        icon: Loader2
    },
    completed: {
        label: 'Completed',
        color: 'green' as const,
        icon: CheckCircle
    },
    failed: {
        label: 'Failed',
        color: 'red' as const,
        icon: AlertCircle
    }
};

const ITEMS_PER_PAGE = 10;

export function UploadHistory({ refreshTrigger }: UploadHistoryProps) {
    const [requests, setRequests] = useState<HistoryRequest[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState("");
    const [statusFilter, setStatusFilter] = useState("all");
    const [currentPage, setCurrentPage] = useState(1);
    const [totalCount, setTotalCount] = useState(0);
    const [totalPages, setTotalPages] = useState(0);

    useEffect(() => {
        fetchHistory();
    }, [refreshTrigger, currentPage, statusFilter]);

    useEffect(() => {
        // Reset to first page when search changes
        setCurrentPage(1);
    }, [searchQuery, statusFilter]);

    const fetchHistory = async () => {
        try {
            setLoading(true);

            const params = new URLSearchParams({
                page: currentPage.toString(),
                limit: ITEMS_PER_PAGE.toString()
            });

            if (statusFilter !== 'all') {
                params.append('status', statusFilter);
            }

            if (searchQuery.trim()) {
                params.append('search', searchQuery.trim());
            }

            const response = await fetch(`/api/upload/requests?${params}`);
            if (response.ok) {
                const data = await response.json();
                setRequests(data.data || []);
                setTotalCount(data.pagination?.total || 0);
                setTotalPages(data.pagination?.pages || 0);
            }
        } catch (error) {
            console.error('Failed to fetch upload history:', error);
        } finally {
            setLoading(false);
        }
    };

    const downloadReport = async (requestId: string) => {
        try {
            // Get status first to get the download URL
            const response = await fetch(`/api/upload/status/${requestId}`);
            if (response.ok) {
                const data = await response.json();
                if (data.download_url) {
                    // Create temporary link to trigger download
                    const link = document.createElement('a');
                    link.href = data.download_url;
                    link.download = data.pdf_filename || `${requestId}_report.pdf`;
                    document.body.appendChild(link);
                    link.click();
                    document.body.removeChild(link);
                }
            }
        } catch (error) {
            console.error('Failed to download report:', error);
        }
    };

    const downloadOriginal = async (requestId: string) => {
        try {
            const response = await fetch(`/api/upload/download-original/${requestId}`);
            if (response.ok) {
                const data = await response.json();
                if (data.download_url) {
                    const link = document.createElement('a');
                    link.href = data.download_url;
                    link.download = data.filename || 'original_file';
                    document.body.appendChild(link);
                    link.click();
                    document.body.removeChild(link);
                }
            }
        } catch (error) {
            console.error('Failed to download original file:', error);
        }
    };

    const viewDocument = (requestId: string) => {
        window.open(`/portfolio/${requestId}`, '_blank');
    };

    const formatFileSize = (bytes: number): string => {
        const mb = bytes / (1024 * 1024);
        return `${mb.toFixed(1)} MB`;
    };

    const formatDate = (dateString: string): string => {
        const date = new Date(dateString);
        return date.toLocaleDateString() + ' ' + date.toLocaleTimeString([], {
            hour: '2-digit',
            minute: '2-digit'
        });
    };

    const getProcessingDuration = (request: HistoryRequest): string => {
        if (!request.processing_started_at || !request.completed_at) {
            return 'N/A';
        }

        const start = new Date(request.processing_started_at).getTime();
        const end = new Date(request.completed_at).getTime();
        const duration = end - start;

        const minutes = Math.floor(duration / (60 * 1000));
        const seconds = Math.floor((duration % (60 * 1000)) / 1000);

        if (minutes > 0) {
            return `${minutes}m ${seconds}s`;
        }
        return `${seconds}s`;
    };

    // Filter requests based on search query (client-side filtering)
    const filteredRequests = requests.filter(request => {
        if (searchQuery === "") return true;

        const query = searchQuery.toLowerCase();
        return (
            request.company_name?.toLowerCase().includes(query) ||
            request.original_filename.toLowerCase().includes(query) ||
            request.request_id.toLowerCase().includes(query) ||
            request.industry.toLowerCase().includes(query)
        );
    });

    return (
        <div className="space-y-6">
            {/* Filters */}
            <Card className="p-6">
                <div className="flex items-center justify-between mb-4">
                    <h2 className="text-lg font-semibold text-neutral-90">
                        Upload History
                    </h2>
                    <div className="text-sm text-neutral-60">
                        {totalCount} total uploads
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <Input
                        placeholder="Search uploads..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        leftIcon={<Search className="w-4 h-4" />}
                    />

                    <Select
                        value={statusFilter}
                        onChange={(e) => setStatusFilter(e.target.value)}
                    >
                        <option value="all">All Status</option>
                        <option value="completed">Completed</option>
                        <option value="failed">Failed</option>
                        <option value="processing">Processing</option>
                        <option value="submitted">Queued</option>
                        <option value="upload_pending">Upload Pending</option>
                    </Select>

                    <Button
                        variant="secondary"
                        onClick={fetchHistory}
                        disabled={loading}
                    >
                        {loading ? (
                            <Loader2 className="w-4 h-4 animate-spin mr-2" />
                        ) : (
                            <Search className="w-4 h-4 mr-2" />
                        )}
                        Refresh
                    </Button>
                </div>
            </Card>

            {/* History List */}
            <Card className="p-6">
                {loading ? (
                    <div className="text-center py-8">
                        <div className="animate-spin w-6 h-6 border-2 border-fluent-blue border-t-transparent rounded-full mx-auto mb-4"></div>
                        <p className="text-neutral-60">Loading upload history...</p>
                    </div>
                ) : filteredRequests.length === 0 ? (
                    <div className="text-center py-8">
                        <FileText className="w-12 h-12 text-neutral-30 mx-auto mb-4" />
                        <p className="text-neutral-60">
                            {requests.length === 0 ? 'No uploads found' : 'No uploads match your search'}
                        </p>
                    </div>
                ) : (
                    <>
                        {/* Table Header */}
                        <div className="hidden md:grid md:grid-cols-12 gap-4 pb-3 border-b border-neutral-20 text-sm font-medium text-neutral-70">
                            <div className="col-span-3">Company & File</div>
                            <div className="col-span-2">Industry</div>
                            <div className="col-span-2">Status</div>
                            <div className="col-span-2">Submitted</div>
                            <div className="col-span-2">Duration</div>
                            <div className="col-span-1">Actions</div>
                        </div>

                        {/* Table Rows */}
                        <div className="space-y-3 mt-4">
                            {filteredRequests.map((request) => {
                                const config = STATUS_CONFIG[request.status];
                                const IconComponent = config.icon;

                                return (
                                    <div
                                        key={request.request_id}
                                        className="grid grid-cols-1 md:grid-cols-12 gap-4 p-4 border border-neutral-20 rounded-lg hover:bg-neutral-5 transition-colors"
                                    >
                                        {/* Company & File */}
                                        <div className="col-span-1 md:col-span-3">
                                            <div className="font-medium text-neutral-90 truncate">
                                                {request.company_name || 'Unnamed Company'}
                                            </div>
                                            <div className="flex items-center gap-1 text-sm text-neutral-60 mt-1">
                                                <FileText className="w-3 h-3" />
                                                <span className="truncate">{request.original_filename}</span>
                                            </div>
                                            <div className="text-xs text-neutral-50 mt-1">
                                                {formatFileSize(request.file_size)} • {request.model_type.replace('_', ' ')}
                                            </div>
                                            {request.status === 'completed' && request.risk_score !== undefined && (
                                                <div className="text-xs text-neutral-60 mt-1">
                                                    Risk Score: {request.risk_score}% • Grade: {request.risk_grade}
                                                </div>
                                            )}
                                        </div>

                                        {/* Industry */}
                                        <div className="col-span-1 md:col-span-2">
                                            <div className="text-sm text-neutral-70 capitalize">
                                                {request.industry.replace('_', ' ')}
                                            </div>
                                            <div className="text-xs text-neutral-50 mt-1">
                                                ID: {request.request_id}
                                            </div>
                                        </div>

                                        {/* Status */}
                                        <div className="col-span-1 md:col-span-2">
                                            <Badge variant={config.color as BadgeVariant}>
                                                <IconComponent className={`w-3 h-3 mr-1 ${request.status === 'processing' ? 'animate-spin' : ''
                                                    }`} />
                                                {config.label}
                                            </Badge>
                                            {request.retry_count > 0 && (
                                                <div className="text-xs text-neutral-50 mt-1">
                                                    Retry #{request.retry_count}
                                                </div>
                                            )}
                                            {request.error_message && (
                                                <div className="text-xs text-fluent-error mt-1 truncate">
                                                    {request.error_message}
                                                </div>
                                            )}
                                        </div>

                                        {/* Submitted */}
                                        <div className="col-span-1 md:col-span-2">
                                            <div className="text-sm text-neutral-70">
                                                {formatDate(request.submitted_at)}
                                            </div>
                                            {request.completed_at && (
                                                <div className="text-xs text-neutral-50 mt-1">
                                                    Completed: {formatDate(request.completed_at)}
                                                </div>
                                            )}
                                        </div>

                                        {/* Duration */}
                                        <div className="col-span-1 md:col-span-2">
                                            <div className="text-sm text-neutral-70">
                                                {getProcessingDuration(request)}
                                            </div>
                                            {request.status === 'completed' && request.recommended_limit && (
                                                <div className="text-xs text-neutral-50 mt-1">
                                                    Limit: ₹{(request.recommended_limit / 10000000).toFixed(1)}Cr
                                                </div>
                                            )}
                                        </div>

                                        {/* Actions */}
                                        <div className="col-span-1 md:col-span-1">
                                            <div className="flex items-center gap-1">
                                                {request.status === 'completed' && (
                                                    <>
                                                        <Button
                                                            variant="ghost"
                                                            size="sm"
                                                            onClick={() => viewDocument(request.request_id)}
                                                            title="View Details"
                                                        >
                                                            <Eye className="w-3 h-3" />
                                                        </Button>
                                                        <Button
                                                            variant="ghost"
                                                            size="sm"
                                                            onClick={() => downloadReport(request.request_id)}
                                                            title="Download Report"
                                                        >
                                                            <Download className="w-3 h-3" />
                                                        </Button>
                                                    </>
                                                )}
                                                {(request.status === 'completed' || request.status === 'failed') && (
                                                    <Button
                                                        variant="ghost"
                                                        size="sm"
                                                        onClick={() => downloadOriginal(request.request_id)}
                                                        title="Download Original File"
                                                    >
                                                        <FileText className="w-3 h-3" />
                                                    </Button>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>

                        {/* Pagination */}
                        {totalPages > 1 && (
                            <div className="flex items-center justify-between mt-6 pt-4 border-t border-neutral-20">
                                <div className="text-sm text-neutral-60">
                                    Showing {((currentPage - 1) * ITEMS_PER_PAGE) + 1} to {Math.min(currentPage * ITEMS_PER_PAGE, totalCount)} of {totalCount} uploads
                                </div>

                                <div className="flex items-center gap-2">
                                    <Button
                                        variant="secondary"
                                        size="sm"
                                        onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                                        disabled={currentPage === 1}
                                    >
                                        <ChevronLeft className="w-4 h-4" />
                                    </Button>

                                    <div className="flex items-center gap-1">
                                        {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                                            let pageNum;
                                            if (totalPages <= 5) {
                                                pageNum = i + 1;
                                            } else if (currentPage <= 3) {
                                                pageNum = i + 1;
                                            } else if (currentPage >= totalPages - 2) {
                                                pageNum = totalPages - 4 + i;
                                            } else {
                                                pageNum = currentPage - 2 + i;
                                            }

                                            return (
                                                <Button
                                                    key={pageNum}
                                                    variant={currentPage === pageNum ? "primary" : "ghost"}
                                                    size="sm"
                                                    onClick={() => setCurrentPage(pageNum)}
                                                    className="w-8 h-8 p-0"
                                                >
                                                    {pageNum}
                                                </Button>
                                            );
                                        })}
                                    </div>

                                    <Button
                                        variant="secondary"
                                        size="sm"
                                        onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                                        disabled={currentPage === totalPages}
                                    >
                                        <ChevronRight className="w-4 h-4" />
                                    </Button>
                                </div>
                            </div>
                        )}
                    </>
                )}
            </Card>
        </div>
    );
}