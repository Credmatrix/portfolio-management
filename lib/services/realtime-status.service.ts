// // lib/services/realtime-status.service.ts
// /**
//  * Real-time status monitoring service using Supabase subscriptions
//  * Provides live updates for document processing status
//  */

// import { supabase } from '@/lib/supabase/client'
// import { RealtimeChannel } from '@supabase/supabase-js'

// interface StatusUpdate {
//     request_id: string;
//     status: 'submitted' | 'processing' | 'completed' | 'failed';
//     progress?: number;
//     error_message?: string;
//     completed_at?: string;
//     processing_started_at?: string;
// }

// interface StatusSubscription {
//     requestId: string;
//     callback: (update: StatusUpdate) => void;
//     channel: RealtimeChannel;
// }

// class RealtimeStatusService {
//     private subscriptions = new Map<string, StatusSubscription>();
//     private portfolioChannel: RealtimeChannel | null = null;
//     private portfolioCallbacks = new Set<(update: any) => void>();

//     /**
//      * Subscribe to status updates for a specific request
//      */
//     subscribeToRequest(requestId: string, callback: (update: StatusUpdate) => void): () => void {
//         // Remove existing subscription if any
//         this.unsubscribeFromRequest(requestId);

//         const channel = this.supabase
//             .channel(`request_${requestId}`)
//             .on(
//                 'postgres_changes',
//                 {
//                     event: 'UPDATE',
//                     schema: 'public',
//                     table: 'document_processing_requests',
//                     filter: `request_id=eq.${requestId}`
//                 },
//                 (payload) => {
//                     const update: StatusUpdate = {
//                         request_id: payload.new.request_id,
//                         status: payload.new.status,
//                         progress: this.calculateProgress(payload.new.status),
//                         error_message: payload.new.error_message,
//                         completed_at: payload.new.completed_at,
//                         processing_started_at: payload.new.processing_started_at
//                     };
//                     callback(update);
//                 }
//             )
//             .subscribe();

//         const subscription: StatusSubscription = {
//             requestId,
//             callback,
//             channel
//         };

//         this.subscriptions.set(requestId, subscription);

//         // Return unsubscribe function
//         return () => this.unsubscribeFromRequest(requestId);
//     }

//     /**
//      * Unsubscribe from status updates for a specific request
//      */
//     unsubscribeFromRequest(requestId: string): void {
//         const subscription = this.subscriptions.get(requestId);
//         if (subscription) {
//             subscription.channel.unsubscribe();
//             this.subscriptions.delete(requestId);
//         }
//     }

//     /**
//      * Subscribe to portfolio-wide updates (all user's requests)
//      */
//     subscribeToPortfolio(callback: (update: any) => void): () => void {
//         this.portfolioCallbacks.add(callback);

//         // Create portfolio channel if it doesn't exist
//         if (!this.portfolioChannel) {
//             this.portfolioChannel = this.supabase
//                 .channel('portfolio_updates')
//                 .on(
//                     'postgres_changes',
//                     {
//                         event: '*',
//                         schema: 'public',
//                         table: 'document_processing_requests'
//                     },
//                     (payload) => {
//                         // Broadcast to all portfolio callbacks
//                         this.portfolioCallbacks.forEach(cb => cb(payload));
//                     }
//                 )
//                 .subscribe();
//         }

//         // Return unsubscribe function
//         return () => {
//             this.portfolioCallbacks.delete(callback);
            
//             // If no more callbacks, unsubscribe from channel
//             if (this.portfolioCallbacks.size === 0 && this.portfolioChannel) {
//                 this.portfolioChannel.unsubscribe();
//                 this.portfolioChannel = null;
//             }
//         };
//     }

//     /**
//      * Get current status for a request (one-time fetch)
//      */
//     async getCurrentStatus(requestId: string): Promise<StatusUpdate | null> {
//         try {
//             const { data, error } = await this.supabase
//                 .from('document_processing_requests')
//                 .select('request_id, status, error_message, completed_at, processing_started_at, submitted_at')
//                 .eq('request_id', requestId)
//                 .single();

//             if (error || !data) {
//                 console.error('Error fetching current status:', error);
//                 return null;
//             }

//             return {
//                 request_id: data.request_id,
//                 status: data.status,
//                 progress: this.calculateProgress(data.status),
//                 error_message: data.error_message,
//                 completed_at: data.completed_at,
//                 processing_started_at: data.processing_started_at
//             };
//         } catch (error) {
//             console.error('Error in getCurrentStatus:', error);
//             return null;
//         }
//     }

//     /**
//      * Update status in database (for testing or manual updates)
//      */
//     async updateStatus(
//         requestId: string, 
//         status: StatusUpdate['status'], 
//         errorMessage?: string
//     ): Promise<boolean> {
//         try {
//             const updateData: any = {
//                 status,
//                 updated_at: new Date().toISOString()
//             };

//             if (status === 'processing' && !errorMessage) {
//                 updateData.processing_started_at = new Date().toISOString();
//             } else if (status === 'completed' || status === 'failed') {
//                 updateData.completed_at = new Date().toISOString();
//             }

//             if (errorMessage) {
//                 updateData.error_message = errorMessage;
//             }

//             const { error } = await this.supabase
//                 .from('document_processing_requests')
//                 .update(updateData)
//                 .eq('request_id', requestId);

//             if (error) {
//                 console.error('Error updating status:', error);
//                 return false;
//             }

//             return true;
//         } catch (error) {
//             console.error('Error in updateStatus:', error);
//             return false;
//         }
//     }

//     /**
//      * Calculate progress percentage based on status
//      */
//     private calculateProgress(status: string): number {
//         switch (status) {
//             case 'submitted': return 10;
//             case 'processing': return 50;
//             case 'completed': return 100;
//             case 'failed': return 0;
//             default: return 0;
//         }
//     }

//     /**
//      * Cleanup all subscriptions
//      */
//     cleanup(): void {
//         // Unsubscribe from all request subscriptions
//         this.subscriptions.forEach((subscription) => {
//             subscription.channel.unsubscribe();
//         });
//         this.subscriptions.clear();

//         // Unsubscribe from portfolio channel
//         if (this.portfolioChannel) {
//             this.portfolioChannel.unsubscribe();
//             this.portfolioChannel = null;
//         }
//         this.portfolioCallbacks.clear();
//     }

//     /**
//      * Get subscription count (for debugging)
//      */
//     getSubscriptionCount(): { requests: number; portfolio: number } {
//         return {
//             requests: this.subscriptions.size,
//             portfolio: this.portfolioCallbacks.size
//         };
//     }
// }

// // Export singleton instance
// export const realtimeStatusService = new RealtimeStatusService();

// // Hook for React components
// export function useRealtimeStatus(requestId?: string) {
//     const [status, setStatus] = useState<StatusUpdate | null>(null);
//     const [isConnected, setIsConnected] = useState(false);

//     useEffect(() => {
//         if (!requestId) return;

//         let unsubscribe: (() => void) | null = null;

//         const setupSubscription = async () => {
//             // Get initial status
//             const currentStatus = await realtimeStatusService.getCurrentStatus(requestId);
//             if (currentStatus) {
//                 setStatus(currentStatus);
//             }

//             // Subscribe to updates
//             unsubscribe = realtimeStatusService.subscribeToRequest(requestId, (update) => {
//                 setStatus(update);
//                 setIsConnected(true);
//             });

//             setIsConnected(true);
//         };

//         setupSubscription();

//         return () => {
//             if (unsubscribe) {
//                 unsubscribe();
//             }
//             setIsConnected(false);
//         };
//     }, [requestId]);

//     return { status, isConnected };
// }

// // Hook for portfolio-wide updates
// export function usePortfolioUpdates() {
//     const [updates, setUpdates] = useState<any[]>([]);
//     const [isConnected, setIsConnected] = useState(false);

//     useEffect(() => {
//         const unsubscribe = realtimeStatusService.subscribeToPortfolio((update) => {
//             setUpdates(prev => [update, ...prev.slice(0, 49)]); // Keep last 50 updates
//             setIsConnected(true);
//         });

//         setIsConnected(true);

//         return () => {
//             unsubscribe();
//             setIsConnected(false);
//         };
//     }, []);

//     return { updates, isConnected };
// }

// import { useState, useEffect } from 'react';