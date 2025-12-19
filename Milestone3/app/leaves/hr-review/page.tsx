'use client'

import { useState, useEffect } from 'react';
import { Card } from '@/components/Card';
import { DataTable } from '@/components/DataTable';
import { StatusBadge } from '@/components/StatusBadge';
import { Modal } from '@/components/Modal';
import { CheckCircle, XCircle, AlertTriangle, Clock, Shield, RefreshCw } from 'lucide-react';
import { leavesApi } from '@/services/api';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';

export default function HRReviewPage() {
    const { user, isHRManager, isHREmployee, isSystemAdmin, isHRAdmin } = useAuth();
    const isHR = isHRManager() || isHREmployee() || isSystemAdmin() || isHRAdmin();

    const [pendingReviews, setPendingReviews] = useState<any[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [selectedRequest, setSelectedRequest] = useState<any>(null);
    const [isReviewModalOpen, setIsReviewModalOpen] = useState(false);
    const [overrideReason, setOverrideReason] = useState('');
    const [isEscalating, setIsEscalating] = useState(false);

    // Helper to safely extract array data from various response structures
    const extractData = (res: any) => {
        if (!res || !res.data) return [];
        if (Array.isArray(res.data)) return res.data;
        if (Array.isArray(res.data.data)) return res.data.data;
        const keys = ['employees', 'items', 'results', 'data', 'requests'];
        for (const key of keys) {
            if (res.data[key] && Array.isArray(res.data[key])) return res.data[key];
        }
        return [];
    };

    const fetchPendingReviews = async () => {
        setIsLoading(true);
        try {
            const res = await leavesApi.getHRReviewQueue();
            const data = extractData(res);
            setPendingReviews(data.map((req: any) => ({
                ...req,
                id: req._id,
                leaveType: req.leaveTypeId?.name || 'Unknown',
                employeeName: `${req.employeeId?.firstName} ${req.employeeId?.lastName}`,
                startDate: new Date(req.dates?.from).toLocaleDateString(),
                endDate: new Date(req.dates?.to).toLocaleDateString(),
                days: req.durationDays,
                reason: req.justification,
                status: req.status
            })));
        } catch (error) {
            console.error('Failed to fetch reviews:', error);
            toast.error('Failed to load pending reviews');
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        if (isHR) {
            fetchPendingReviews();
        }
    }, [isHR]);

    const handleAction = async (status: 'Approved' | 'Rejected') => {
        if (!selectedRequest) return;
        if (!overrideReason && status === 'Rejected') {
            toast.error('Override reason is required for rejection');
            return;
        }

        try {
            // Convert frontend status format to backend enum format (lowercase)
            const backendStatus = status.toLowerCase() as 'approved' | 'rejected';

            await leavesApi.reviewLeaveRequest(selectedRequest._id || selectedRequest.id, {
                hrId: user?.id,
                status: backendStatus,
                overrideReason
            });
            toast.success(`Leave request ${status.toLowerCase()} successfully`);
            setIsReviewModalOpen(false);
            setOverrideReason('');
            fetchPendingReviews();
        } catch (error) {
            console.error('Action failed:', error);
            toast.error('Failed to update leave request');
        }
    };

    const handleAutoEscalation = async () => {
        setIsEscalating(true);
        try {
            await leavesApi.checkAutoEscalation();
            toast.success('Auto-escalation check completed');
            fetchPendingReviews();
        } catch (error) {
            console.error('Escalation failed:', error);
            toast.error('Failed to run auto-escalation check');
        } finally {
            setIsEscalating(false);
        }
    };

    const columns = [
        { header: 'Employee', accessor: (row: any) => row.employeeName || row.employeeId },
        { header: 'Type', accessor: 'leaveType' },
        { header: 'Duration', accessor: (row: any) => `${row.days} days` },
        { header: 'Dates', accessor: (row: any) => `${row.startDate} to ${row.endDate}` },
        { header: 'Status', accessor: (row: any) => <StatusBadge status={row.status} /> },
        {
            header: 'Actions',
            accessor: (row: any) => (
                <button
                    onClick={() => {
                        setSelectedRequest(row);
                        setIsReviewModalOpen(true);
                    }}
                    className="text-blue-600 hover:text-blue-800 font-medium"
                >
                    Review
                </button>
            )
        }
    ];

    if (!isHR) {
        return (
            <div className="flex flex-col items-center justify-center h-[60vh] text-slate-500">
                <Shield className="w-16 h-16 mb-4 opacity-20" />
                <h2 className="text-xl font-semibold">Access Denied</h2>
                <p>Only HR personnel can access this page.</p>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-slate-900">HR Leave Review</h1>
                    <p className="text-slate-600">Review, override, and manage leave requests with manual adjustments</p>
                </div>
                <div className="flex gap-3">
                    <button
                        onClick={handleAutoEscalation}
                        disabled={isEscalating}
                        className="flex items-center gap-2 px-4 py-2 bg-amber-600 text-white rounded-lg hover:bg-amber-700 transition-colors disabled:opacity-50"
                    >
                        <Clock className={`w-4 h-4 ${isEscalating ? 'animate-spin' : ''}`} />
                        Run Auto-Escalation
                    </button>
                    <button
                        onClick={fetchPendingReviews}
                        className="p-2 border border-slate-300 rounded-lg hover:bg-slate-50"
                    >
                        <RefreshCw className={`w-5 h-5 ${isLoading ? 'animate-spin' : ''}`} />
                    </button>
                </div>
            </div>

            <Card>
                {pendingReviews.length === 0 ? (
                    <div className="text-center py-12">
                        <CheckCircle className="w-12 h-12 text-green-500 mx-auto mb-4 opacity-30" />
                        <p className="text-slate-500">No pending leave requests requiring HR review</p>
                    </div>
                ) : (
                    <DataTable data={pendingReviews} columns={columns} />
                )}
            </Card>

            <Modal
                isOpen={isReviewModalOpen}
                onClose={() => setIsReviewModalOpen(false)}
                title="Manual Override Review"
                size="md"
            >
                {selectedRequest && (
                    <div className="space-y-4">
                        <div className="p-4 bg-slate-50 rounded-xl space-y-2">
                            <div className="grid grid-cols-2 gap-4 text-sm">
                                <div>
                                    <p className="text-slate-500">Employee</p>
                                    <p className="font-semibold">{selectedRequest.employeeName || selectedRequest.employeeId}</p>
                                </div>
                                <div>
                                    <p className="text-slate-500">Leave Type</p>
                                    <p className="font-semibold">{selectedRequest.leaveType}</p>
                                </div>
                                <div>
                                    <p className="text-slate-500">Requested Period</p>
                                    <p className="font-semibold">{selectedRequest.startDate} - {selectedRequest.endDate}</p>
                                </div>
                                <div>
                                    <p className="text-slate-500">Duration</p>
                                    <p className="font-semibold">{selectedRequest.days} Days</p>
                                </div>
                            </div>
                            <div className="pt-2">
                                <p className="text-slate-500 text-sm">Justification</p>
                                <p className="text-slate-700 italic">"{selectedRequest.justification || selectedRequest.reason || 'No justification provided'}"</p>
                            </div>
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-1">
                                HR Override Reason (Required)
                            </label>
                            <textarea
                                value={overrideReason}
                                onChange={(e) => setOverrideReason(e.target.value)}
                                className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all"
                                rows={3}
                                placeholder="Explain why you are overriding the standard flow..."
                            />
                        </div>

                        <div className="flex gap-3 pt-4">
                            <button
                                onClick={() => handleAction('Rejected')}
                                className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-red-50 text-red-700 border border-red-200 rounded-lg hover:bg-red-100 transition-colors"
                            >
                                <XCircle className="w-4 h-4" />
                                Reject Override
                            </button>
                            <button
                                onClick={() => handleAction('Approved')}
                                className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors shadow-lg shadow-green-200"
                            >
                                <CheckCircle className="w-4 h-4" />
                                Approve Override
                            </button>
                        </div>
                    </div>
                )}
            </Modal>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <Card title="Override Policy">
                    <div className="flex items-start gap-4">
                        <div className="p-3 bg-blue-50 rounded-lg">
                            <AlertTriangle className="w-6 h-6 text-blue-600" />
                        </div>
                        <div className="text-sm text-slate-600 space-y-2">
                            <p>As an HR Admin, you have the authority to override manager decisions or bypass standard leave rules.</p>
                            <ul className="list-disc ml-4 space-y-1">
                                <li>HR Review is required for Sick Leave over 3 days.</li>
                                <li>Overrides are logged in the audit trail.</li>
                                <li>Manual approval can bypass balance checks.</li>
                            </ul>
                        </div>
                    </div>
                </Card>
                <Card title="System Alerts">
                    <div className="space-y-3">
                        <div className="p-3 bg-red-50 border border-red-100 rounded-lg flex items-center gap-3">
                            <Clock className="w-5 h-5 text-red-600" />
                            <p className="text-sm text-red-700 font-medium">4 Requests exceeding 48h SLA</p>
                        </div>
                        <div className="p-3 bg-amber-50 border border-amber-100 rounded-lg flex items-center gap-3">
                            <AlertTriangle className="w-5 h-5 text-amber-600" />
                            <p className="text-sm text-amber-700 font-medium">2 Team scheduling conflicts detected</p>
                        </div>
                    </div>
                </Card>
            </div>
        </div>
    );
}
