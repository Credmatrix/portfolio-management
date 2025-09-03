// "use client";

// import { useEffect, useState } from "react";
// import { Card } from "@/components/ui/Card";
// import { Badge } from "@/components/ui/Badge";
// import { Progress } from "@/components/ui/Progress";
// // import { useRealtimeStatus } from "@/lib/services/realtime-status.service";
// import { CheckCircle, XCircle, RefreshCw, Clock, AlertTriangle } from "lucide-react";

// interface RealTimeStatusMonitorProps {
//     requestId: string;
//     onStatusChange?: (status: string) => void;
// }

// export function RealTimeStatusMonitor({ requestId, onStatusChange }: RealTimeStatusMonitorProps) {
//     const { status, isConnected } = useRealtimeStatus(requestId);
//     const [lastUpdate, setLastUpdate] = useState<Date>(new Date());

//     useEffect(() => {
//         if (status) {
//             setLastUpdate(new Date());
//             onStatusChange?.(status.status);
//         }
//     }, [status, onStatusChange]);

//     const getStatusIcon = (statusValue: string) => {
//         switch (statusValue) {
//             case 'completed':
//                 return <CheckCircle className="w-5 h-5 text-green-500" />;
//             case 'processing':
//                 return <RefreshCw className="w-5 h-5 text-blue-500 animate-spin" />;
//             case 'failed':
//                 return <XCircle className="w-5 h-5 text-red-500" />;
//             case 'submitted':
//                 return <Clock className="w-5 h-5 text-yellow-500" />;
//             default:
//                 return <AlertTriangle className="w-5 h-5 text-gray-400" />;
//         }
//     };

//     const getStatusColor = (statusValue: string) => {
//         switch (statusValue) {
//             case 'completed':
//                 return 'success';
//             case 'processing':
//                 return 'info';
//             case 'failed':
//                 return 'error';
//             case 'submitted':
//                 return 'warning';
//             default:
//                 return 'secondary';
//         }
//     };

//     if (!status) {
//         return (
//             <Card className="p-4">
//                 <div className="flex items-center gap-3">
//                     <div className="animate-pulse w-5 h-5 bg-gray-300 rounded-full" />
//                     <div className="flex-1">
//                         <div className="animate-pulse h-4 bg-gray-300 rounded w-32 mb-2" />
//                         <div className="animate-pulse h-3 bg-gray-200 rounded w-24" />
//                     </div>
//                 </div>
//             </Card>
//         );
//     }

//     return (
//         <Card className="p-4">
//             <div className="space-y-4">
//                 {/* Header */}
//                 <div className="flex items-center justify-between">
//                     <div className="flex items-center gap-3">
//                         {getStatusIcon(status.status)}
//                         <div>
//                             <h3 className="font-medium text-neutral-90">
//                                 Processing Status
//                             </h3>
//                             <p className="text-sm text-neutral-60">
//                                 Request ID: {requestId.slice(-8)}
//                             </p>
//                         </div>
//                     </div>
//                     <div className="flex items-center gap-2">
//                         <Badge variant={getStatusColor(status.status)}>
//                             {status.status}
//                         </Badge>
//                         {isConnected && (
//                             <div 
//                                 className="w-2 h-2 bg-green-500 rounded-full" 
//                                 title="Real-time updates active"
//                             />
//                         )}
//                     </div>
//                 </div>

//                 {/* Progress Bar */}
//                 {status.progress !== undefined && (
//                     <div className="space-y-2">
//                         <div className="flex justify-between text-sm">
//                             <span className="text-neutral-60">Progress</span>
//                             <span className="text-neutral-90">{status.progress}%</span>
//                         </div>
//                         <Progress value={status.progress} className="h-2" />
//                     </div>
//                 )}

//                 {/* Error Message */}
//                 {status.error_message && (
//                     <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
//                         <div className="flex items-start gap-2">
//                             <XCircle className="w-4 h-4 text-red-500 mt-0.5 flex-shrink-0" />
//                             <div>
//                                 <p className="text-sm font-medium text-red-800">
//                                     Processing Error
//                                 </p>
//                                 <p className="text-sm text-red-700 mt-1">
//                                     {status.error_message}
//                                 </p>
//                             </div>
//                         </div>
//                     </div>
//                 )}

//                 {/* Timestamps */}
//                 <div className="grid grid-cols-2 gap-4 text-xs text-neutral-60">
//                     {status.processing_started_at && (
//                         <div>
//                             <span className="block font-medium">Started</span>
//                             <span>{new Date(status.processing_started_at).toLocaleTimeString()}</span>
//                         </div>
//                     )}
//                     {status.completed_at && (
//                         <div>
//                             <span className="block font-medium">Completed</span>
//                             <span>{new Date(status.completed_at).toLocaleTimeString()}</span>
//                         </div>
//                     )}
//                 </div>

//                 {/* Last Update */}
//                 <div className="pt-2 border-t border-neutral-20 text-xs text-neutral-50">
//                     Last updated: {lastUpdate.toLocaleTimeString()}
//                     {!isConnected && (
//                         <span className="text-yellow-600 ml-2">
//                             (Connection lost - updates may be delayed)
//                         </span>
//                     )}
//                 </div>
//             </div>
//         </Card>
//     );
// }