'use client';

import React, { useState, useEffect } from 'react';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Select } from '@/components/ui/Select';
import { Input } from '@/components/ui/Input';
import { Checkbox } from '@/components/ui/Checkbox';
import { Badge } from '@/components/ui/Badge';
import { Modal } from '@/components/ui/Modal';
import { Toast } from '@/components/ui/Toast';

interface ScheduledReport {
    id: string;
    name: string;
    description: string;
    templateId: string;
    schedule: {
        frequency: 'daily' | 'weekly' | 'monthly' | 'quarterly';
        dayOfWeek?: number; // 0-6 for weekly
        dayOfMonth?: number; // 1-31 for monthly
        time: string; // HH:MM format
    };
    recipients: string[];
    format: 'pdf' | 'excel' | 'csv';
    filters: {
        industries: string[];
        riskGrades: string[];
    };
    isActive: boolean;
    lastRun?: string;
    nextRun: string;
    createdAt: string;
    createdBy: string;
}

interface ScheduledReportsProps {
    className?: string;
}

// export function ScheduledReports({ className = '' }: ScheduledReportsProps) {
//     const [scheduledReports, setScheduledReports] = useState<ScheduledReport[]>([]);
//     const [showCreateModal, setShowCreateModal] = useState(false);
//     const [editingReport, setEditingReport] = useState<ScheduledReport | null>(null);
//     const [loading, setLoading] = useState(true);
//     const [showToast, setShowToast] = useState(false);
//     const [toastMessage, setToastMessage] = useState('');

//     // Form state for creating/editing reports
//     const [formData, setFormData] = useState({
//         name: '',
//         description: '',
//         templateId: '',
//         frequency: 'weekly' as const,
//         dayOfWeek: 1,
//         dayOfMonth: 1,
//         time: '09:00',
//         recipients: [''],
//         format: 'pdf' as const,
//         industries: [] as string[],
//         riskGrades: [] as string[]
//     });

//     const frequencyOptions = [
//         { value: 'daily', label: 'Daily' },
//         { value: 'weekly', label: 'Weekly' },
//         { value: 'monthly', label: 'Monthly' },
//         { value: 'quarterly', label: 'Quarterly' }
//     ];

//     const dayOfWeekOptions = [
//         { value: 1, label: 'Monday' },
//         { value: 2, label: 'Tuesday' },
//         { value: 3, label: 'Wednesday' },
//         { value: 4, label: 'Thursday' },
//         { value: 5, label: 'Friday' },
//         { value: 6, label: 'Saturday' },
//         { value: 0, label: 'Sunday' }
//     ];

//     const templateOptions = [
//         { value: 'portfolio-overview', label: 'Portfolio Overview Report' },
//         { value: 'risk-assessment', label: 'Risk Assessment Report' },
//         { value: 'compliance-report', label: 'Compliance Status Report' },
//         { value: 'financial-analysis', label: 'Financial Performance Report' }
//     ];

//     const formatOptions = [
//         { value: 'pdf', label: 'PDF Report' },
//         { value: 'excel', label: 'Excel Workbook' },
//         { value: 'csv', label: 'CSV Data Export' }
//     ];

//     const industryOptions = [
//         { value: 'manufacturing', label: 'Manufacturing' },
//         { value: 'services', label: 'Services' },
//         { value: 'trading', label: 'Trading' },
//         { value: 'construction', label: 'Construction' },
//         { value: 'technology', label: 'Technology' }
//     ];

//     const riskGradeOptions = [
//         { value: 'CM1', label: 'CM1 (Excellent)' },
//         { value: 'CM2', label: 'CM2 (Good)' },
//         { value: 'CM3', label: 'CM3 (Average)' },
//         { value: 'CM4', label: 'CM4 (Poor)' },
//         { value: 'CM5', label: 'CM5 (Critical)' }
//     ];

//     useEffect(() => {
//         loadScheduledReports();
//     }, []);

//     const loadScheduledReports = async () => {
//         setLoading(true);
//         try {
//             const response = await fetch('/api/reports/scheduled');
//             const reports = await response.json();
//             setScheduledReports(reports);
//         } catch (error) {
//             console.error('Error loading scheduled reports:', error);
//             setToastMessage('Failed to load scheduled reports');
//             setShowToast(true);
//         } finally {
//             setLoading(false);
//         }
//     };

//     const handleCreateReport = () => {
//         setFormData({
//             name: '',
//             description: '',
//             templateId: '',
//             frequency: 'weekly',
//             dayOfWeek: 1,
//             dayOfMonth: 1,
//             time: '09:00',
//             recipients: [''],
//             format: 'pdf',
//             industries: [],
//             riskGrades: []
//         });
//         setEditingReport(null);
//         setShowCreateModal(true);
//     };

//     const handleEditReport = (report: ScheduledReport) => {
//         setFormData({
//             name: report.name,
//             description: report.description,
//             templateId: report.templateId,
//             frequency: report.schedule.frequency,
//             dayOfWeek: report.schedule.dayOfWeek || 1,
//             dayOfMonth: report.schedule.dayOfMonth || 1,
//             time: report.schedule.time,
//             recipients: report.recipients,
//             format: report.format,
//             industries: report.filters.industries,
//             riskGrades: report.filters.riskGrades
//         });
//         setEditingReport(report);
//         setShowCreateModal(true);
//     };

//     const handleSaveReport = async () => {
//         try {
//             const reportData = {
//                 name: formData.name,
//                 description: formData.description,
//                 templateId: formData.templateId,
//                 schedule: {
//                     frequency: formData.frequency,
//                     ...(formData.frequency === 'weekly' && { dayOfWeek: formData.dayOfWeek }),
//                     ...(formData.frequency === 'monthly' && { dayOfMonth: formData.dayOfMonth }),
//                     time: formData.time
//                 },
//                 recipients: formData.recipients.filter(email => email.trim() !== ''),
//                 format: formData.format,
//                 filters: {
//                     industries: formData.industries,
//                     riskGrades: formData.riskGrades
//                 },
//                 isActive: true
//             };

//             const url = editingReport
//                 ? `/api/reports/scheduled/${editingReport.id}`
//                 : '/api/reports/scheduled';

//             const method = editingReport ? 'PUT' : 'POST';

//             const response = await fetch(url, {
//                 method,
//                 headers: {
//                     'Content-Type': 'application/json'
//                 },
//                 body: JSON.stringify(reportData)
//             });

//             if (!response.ok) {
//                 throw new Error('Failed to save scheduled report');
//             }

//             setToastMessage(`Scheduled report ${editingReport ? 'updated' : 'created'} successfully`);
//             setShowToast(true);
//             setShowCreateModal(false);
//             loadScheduledReports();

//         } catch (error) {
//             console.error('Error saving scheduled report:', error);
//             setToastMessage('Failed to save scheduled report');
//             setShowToast(true);
//         }
//     };

//     const handleToggleActive = async (reportId: string, isActive: boolean) => {
//         try {
//             const response = await fetch(`/api/reports/scheduled/${reportId}`, {
//                 method: 'PATCH',
//                 headers: {
//                     'Content-Type': 'application/json'
//                 },
//                 body: JSON.stringify({ isActive })
//             });

//             if (!response.ok) {
//                 throw new Error('Failed to update report status');
//             }

//             setScheduledReports(prev =>
//                 prev.map(report =>
//                     report.id === reportId ? { ...report, isActive } : report
//                 )
//             );

//             setToastMessage(`Report ${isActive ? 'activated' : 'deactivated'} successfully`);
//             setShowToast(true);

//         } catch (error) {
//             console.error('Error updating report status:', error);
//             setToastMessage('Failed to update report status');
//             setShowToast(true);
//         }
//     };

//     const handleDeleteReport = async (reportId: string) => {
//         if (!confirm('Are you sure you want to delete this scheduled report?')) {
//             return;
//         }

//         try {
//             const response = await fetch(`/api/reports/scheduled/${reportId}`, {
//                 method: 'DELETE'
//             });

//             if (!response.ok) {
//                 throw new Error('Failed to delete report');
//             }

//             setScheduledReports(prev => prev.filter(report => report.id !== reportId));
//             setToastMessage('Scheduled report deleted successfully');
//             setShowToast(true);

//         } catch (error) {
//             console.error('Error deleting report:', error);
//             setToastMessage('Failed to delete report');
//             setShowToast(true);
//         }
//     };

//     const handleRunNow = async (reportId: string) => {
//         try {
//             const response = await fetch(`/api/reports/scheduled/${reportId}/run`, {
//                 method: 'POST'
//             });

//             if (!response.ok) {
//                 throw new Error('Failed to run report');
//             }

//             setToastMessage('Report execution started successfully');
//             setShowToast(true);

//         } catch (error) {
//             console.error('Error running report:', error);
//             setToastMessage('Failed to run report');
//             setShowToast(true);
//         }
//     };

//     const addRecipient = () => {
//         setFormData(prev => ({
//             ...prev,
//             recipients: [...prev.recipients, '']
//         }));
//     };

//     const updateRecipient = (index: number, email: string) => {
//         setFormData(prev => ({
//             ...prev,
//             recipients: prev.recipients.map((recipient, i) =>
//                 i === index ? email : recipient
//             )
//         }));
//     };

//     const removeRecipient = (index: number) => {
//         setFormData(prev => ({
//             ...prev,
//             recipients: prev.recipients.filter((_, i) => i !== index)
//         }));
//     };

//     const getFrequencyDisplay = (report: ScheduledReport) => {
//         const { frequency, dayOfWeek, dayOfMonth, time } = report.schedule;

//         switch (frequency) {
//             case 'daily':
//                 return `Daily at ${time}`;
//             case 'weekly':
//                 const dayName = dayOfWeekOptions.find(d => d.value === dayOfWeek)?.label || 'Monday';
//                 return `Weekly on ${dayName} at ${time}`;
//             case 'monthly':
//                 return `Monthly on day ${dayOfMonth} at ${time}`;
//             case 'quarterly':
//                 return `Quarterly at ${time}`;
//             default:
//                 return frequency;
//         }
//     };

//     if (loading) {
//         return (
//             <div className="p-6">
//                 <div className="animate-pulse space-y-4">
//                     {[...Array(3)].map((_, i) => (
//                         <div key={i} className="h-24 bg-gray-200 rounded"></div>
//                     ))}
//                 </div>
//             </div>
//         );
//     }

//     return (
//         <div className={`space-y-6 ${className}`}>
//             <div className="flex justify-between items-center">
//                 <div>
//                     <h3 className="text-lg font-semibold text-gray-900">Scheduled Reports</h3>
//                     <p className="text-gray-600 mt-1">Automate report generation and delivery</p>
//                 </div>
//                 <Button onClick={handleCreateReport}>
//                     Create Scheduled Report
//                 </Button>
//             </div>

//             {/* Scheduled Reports List */}
//             <div className="space-y-4">
//                 {scheduledReports.length === 0 ? (
//                     <Card className="p-8 text-center">
//                         <div className="text-gray-500">
//                             <div className="text-4xl mb-4">📅</div>
//                             <h4 className="text-lg font-medium mb-2">No Scheduled Reports</h4>
//                             <p className="text-sm mb-4">Create your first scheduled report to automate report generation</p>
//                             <Button onClick={handleCreateReport}>
//                                 Create Scheduled Report
//                             </Button>
//                         </div>
//                     </Card>
//                 ) : (
//                     scheduledReports.map(report => (
//                         <Card key={report.id} className="p-6">
//                             <div className="flex items-start justify-between">
//                                 <div className="flex-1">
//                                     <div className="flex items-center space-x-3 mb-2">
//                                         <h4 className="text-lg font-medium text-gray-900">{report.name}</h4>
//                                         <Badge variant={report.isActive ? 'success' : 'secondary'}>
//                                             {report.isActive ? 'Active' : 'Inactive'}
//                                         </Badge>
//                                         <Badge variant="outline">
//                                             {report.format.toUpperCase()}
//                                         </Badge>
//                                     </div>

//                                     <p className="text-gray-600 mb-3">{report.description}</p>

//                                     <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
//                                         <div>
//                                             <span className="font-medium text-gray-700">Schedule:</span>
//                                             <div className="text-gray-600">{getFrequencyDisplay(report)}</div>
//                                         </div>

//                                         <div>
//                                             <span className="font-medium text-gray-700">Recipients:</span>
//                                             <div className="text-gray-600">{report.recipients.length} recipients</div>
//                                         </div>

//                                         <div>
//                                             <span className="font-medium text-gray-700">Next Run:</span>
//                                             <div className="text-gray-600">
//                                                 {new Date(report.nextRun).toLocaleString()}
//                                             </div>
//                                         </div>
//                                     </div>

//                                     {(report.filters.industries.length > 0 || report.filters.riskGrades.length > 0) && (
//                                         <div className="mt-3 flex flex-wrap gap-2">
//                                             {report.filters.industries.map(industry => (
//                                                 <Badge key={industry} variant="outline" className="text-xs">
//                                                     {industry}
//                                                 </Badge>
//                                             ))}
//                                             {report.filters.riskGrades.map(grade => (
//                                                 <Badge key={grade} variant="outline" className="text-xs">
//                                                     {grade}
//                                                 </Badge>
//                                             ))}
//                                         </div>
//                                     )}
//                                 </div>

//                                 <div className="flex items-center space-x-2 ml-4">
//                                     <Button
//                                         variant="outline"
//                                         size="sm"
//                                         onClick={() => handleRunNow(report.id)}
//                                     >
//                                         Run Now
//                                     </Button>

//                                     <Button
//                                         variant="outline"
//                                         size="sm"
//                                         onClick={() => handleEditReport(report)}
//                                     >
//                                         Edit
//                                     </Button>

//                                     <Button
//                                         variant={report.isActive ? 'outline' : 'default'}
//                                         size="sm"
//                                         onClick={() => handleToggleActive(report.id, !report.isActive)}
//                                     >
//                                         {report.isActive ? 'Deactivate' : 'Activate'}
//                                     </Button>

//                                     <Button
//                                         variant="destructive"
//                                         size="sm"
//                                         onClick={() => handleDeleteReport(report.id)}
//                                     >
//                                         Delete
//                                     </Button>
//                                 </div>
//                             </div>
//                         </Card>
//                     ))
//                 )}
//             </div>

//             {/* Create/Edit Modal */}
//             <Modal
//                 isOpen={showCreateModal}
//                 onClose={() => setShowCreateModal(false)}
//                 title={editingReport ? 'Edit Scheduled Report' : 'Create Scheduled Report'}
//                 size="large"
//             >
//                 <div className="space-y-6">
//                     {/* Basic Information */}
//                     <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
//                         <div>
//                             <label className="block text-sm font-medium text-gray-700 mb-2">
//                                 Report Name
//                             </label>
//                             <Input
//                                 value={formData.name}
//                                 onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
//                                 placeholder="Enter report name"
//                             />
//                         </div>

//                         <div>
//                             <label className="block text-sm font-medium text-gray-700 mb-2">
//                                 Template
//                             </label>
//                             <Select
//                                 value={formData.templateId}
//                                 onChange={(value) => setFormData(prev => ({ ...prev, templateId: value }))}
//                                 options={templateOptions}
//                                 placeholder="Select template"
//                             />
//                         </div>
//                     </div>

//                     <div>
//                         <label className="block text-sm font-medium text-gray-700 mb-2">
//                             Description
//                         </label>
//                         <Input
//                             value={formData.description}
//                             onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
//                             placeholder="Enter report description"
//                         />
//                     </div>

//                     {/* Schedule Configuration */}
//                     <div className="border-t pt-4">
//                         <h4 className="font-medium text-gray-900 mb-3">Schedule Configuration</h4>

//                         <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
//                             <div>
//                                 <label className="block text-sm font-medium text-gray-700 mb-2">
//                                     Frequency
//                                 </label>
//                                 <Select
//                                     value={formData.frequency}
//                                     onChange={(value) => setFormData(prev => ({ ...prev, frequency: value as any }))}
//                                     options={frequencyOptions}
//                                 />
//                             </div>

//                             {formData.frequency === 'weekly' && (
//                                 <div>
//                                     <label className="block text-sm font-medium text-gray-700 mb-2">
//                                         Day of Week
//                                     </label>
//                                     <Select
//                                         value={formData.dayOfWeek}
//                                         onChange={(value) => setFormData(prev => ({ ...prev, dayOfWeek: value }))}
//                                         options={dayOfWeekOptions}
//                                     />
//                                 </div>
//                             )}

//                             {formData.frequency === 'monthly' && (
//                                 <div>
//                                     <label className="block text-sm font-medium text-gray-700 mb-2">
//                                         Day of Month
//                                     </label>
//                                     <Input
//                                         type="number"
//                                         min="1"
//                                         max="31"
//                                         value={formData.dayOfMonth}
//                                         onChange={(e) => setFormData(prev => ({ ...prev, dayOfMonth: parseInt(e.target.value) }))}
//                                     />
//                                 </div>
//                             )}

//                             <div>
//                                 <label className="block text-sm font-medium text-gray-700 mb-2">
//                                     Time
//                                 </label>
//                                 <Input
//                                     type="time"
//                                     value={formData.time}
//                                     onChange={(e) => setFormData(prev => ({ ...prev, time: e.target.value }))}
//                                 />
//                             </div>
//                         </div>
//                     </div>

//                     {/* Recipients */}
//                     <div className="border-t pt-4">
//                         <h4 className="font-medium text-gray-900 mb-3">Recipients</h4>

//                         <div className="space-y-2">
//                             {formData.recipients.map((recipient, index) => (
//                                 <div key={index} className="flex items-center space-x-2">
//                                     <Input
//                                         type="email"
//                                         value={recipient}
//                                         onChange={(e) => updateRecipient(index, e.target.value)}
//                                         placeholder="Enter email address"
//                                         className="flex-1"
//                                     />
//                                     {formData.recipients.length > 1 && (
//                                         <Button
//                                             variant="outline"
//                                             size="sm"
//                                             onClick={() => removeRecipient(index)}
//                                         >
//                                             Remove
//                                         </Button>
//                                     )}
//                                 </div>
//                             ))}

//                             <Button
//                                 variant="outline"
//                                 size="sm"
//                                 onClick={addRecipient}
//                             >
//                                 Add Recipient
//                             </Button>
//                         </div>
//                     </div>

//                     {/* Format and Filters */}
//                     <div className="border-t pt-4">
//                         <h4 className="font-medium text-gray-900 mb-3">Output Format</h4>
//                         <Select
//                             value={formData.format}
//                             onChange={(value) => setFormData(prev => ({ ...prev, format: value as any }))}
//                             options={formatOptions}
//                         />
//                     </div>

//                     {/* Action Buttons */}
//                     <div className="flex justify-end space-x-3 pt-4 border-t">
//                         <Button
//                             variant="outline"
//                             onClick={() => setShowCreateModal(false)}
//                         >
//                             Cancel
//                         </Button>
//                         <Button
//                             onClick={handleSaveReport}
//                             disabled={!formData.name || !formData.templateId || formData.recipients.filter(r => r.trim()).length === 0}
//                         >
//                             {editingReport ? 'Update Report' : 'Create Report'}
//                         </Button>
//                     </div>
//                 </div>
//             </Modal>

//             {/* Toast Notification */}
//             {showToast && (
//                 <Toast
//                     message={toastMessage}
//                     type={toastMessage.includes('successfully') ? 'success' : 'error'}
//                     onClose={() => setShowToast(false)}
//                 />
//             )}
//         </div>
//     );
// }