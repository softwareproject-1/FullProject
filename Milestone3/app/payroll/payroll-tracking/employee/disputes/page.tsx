'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Plus, Loader2, AlertCircle } from 'lucide-react';
import { payrollTrackingApi, DisputeDto } from '@/services/api';
import StatusBadge from '@/components/payroll/StatusBadge';
import ApprovalTimeline from '@/components/payroll/ApprovalTimeline';

export default function MyDisputesPage() {
    const [disputes, setDisputes] = useState<DisputeDto[]>([]);
    const [loading, setLoading] = useState(true);
    const [selectedDispute, setSelectedDispute] = useState<DisputeDto | null>(null);

    useEffect(() => {
        fetchDisputes();
    }, []);

    const fetchDisputes = async () => {
        try {
            const response = await payrollTrackingApi.getMyDisputes();
            setDisputes(response.data);
        } catch (err) {
            const { MOCK_DISPUTES } = await import('@/lib/mockData');
            setDisputes(MOCK_DISPUTES as any);
        } finally {
            setLoading(false);
        }
    };

    const pendingCount = disputes.filter((d) => d.status === 'PENDING').length;
    const approvedCount = disputes.filter((d) => d.status === 'APPROVED').length;
    const completedCount = disputes.filter((d) => d.status === 'COMPLETED').length;

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold text-slate-900">My Disputes</h1>
                    <p className="text-slate-600 mt-1">Track and manage your payroll disputes</p>
                </div>
                <Link href="/payroll/tracking/employee/disputes/create">
                    <Button>
                        <Plus className="w-4 h-4 mr-2" />
                        Submit New Dispute
                    </Button>
                </Link>
            </div>

            {/* Summary Cards */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <Card>
                    <CardHeader className="pb-3">
                        <CardDescription>Total Disputes</CardDescription>
                        <CardTitle className="text-2xl">{disputes.length}</CardTitle>
                    </CardHeader>
                </Card>
                <Card>
                    <CardHeader className="pb-3">
                        <CardDescription>Pending Review</CardDescription>
                        <CardTitle className="text-2xl text-yellow-600">{pendingCount}</CardTitle>
                    </CardHeader>
                </Card>
                <Card>
                    <CardHeader className="pb-3">
                        <CardDescription>Approved</CardDescription>
                        <CardTitle className="text-2xl text-blue-600">{approvedCount}</CardTitle>
                    </CardHeader>
                </Card>
                <Card>
                    <CardHeader className="pb-3">
                        <CardDescription>Completed</CardDescription>
                        <CardTitle className="text-2xl text-green-600">{completedCount}</CardTitle>
                    </CardHeader>
                </Card>
            </div>

            {/* Disputes List */}
            <Card>
                <CardHeader>
                    <CardTitle>Dispute History</CardTitle>
                    <CardDescription>Click on a dispute to view its approval timeline</CardDescription>
                </CardHeader>
                <CardContent>
                    {loading ? (
                        <div className="text-center py-12">
                            <Loader2 className="h-12 w-12 animate-spin text-blue-600 mx-auto mb-4" />
                        </div>
                    ) : disputes.length === 0 ? (
                        <div className="text-center py-12">
                            <AlertCircle className="w-16 h-16 text-slate-300 mx-auto mb-4" />
                            <p className="text-slate-600 mb-4">No disputes submitted yet</p>
                            <Link href="/payroll/tracking/employee/disputes/create">
                                <Button>Submit Your First Dispute</Button>
                            </Link>
                        </div>
                    ) : (
                        <div className="space-y-4">
                            {disputes.map((dispute) => (
                                <div
                                    key={dispute._id}
                                    className="border border-slate-200 rounded-lg p-4 hover:shadow-md transition-shadow cursor-pointer"
                                    onClick={() => setSelectedDispute(selectedDispute?._id === dispute._id ? null : dispute)}
                                >
                                    <div className="flex items-start justify-between">
                                        <div className="flex-1">
                                            <div className="flex items-center gap-3 mb-2">
                                                <h3 className="font-semibold text-slate-900">{dispute.reason}</h3>
                                                <StatusBadge status={dispute.status} />
                                            </div>
                                            <p className="text-sm text-slate-600 mb-2">{dispute.description}</p>
                                            <div className="flex items-center gap-4 text-sm text-slate-500">
                                                <span>Submitted: {new Date(dispute.submittedAt).toLocaleDateString()}</span>
                                                {dispute.amount && <span>Amount: ${dispute.amount.toLocaleString()}</span>}
                                                <span>Payslip ID: {dispute.payslipId}</span>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Approval Timeline - shows when expanded */}
                                    {selectedDispute?._id === dispute._id && (
                                        <div className="mt-6 pt-6 border-t border-slate-200">
                                            <ApprovalTimeline
                                                status={dispute.status}
                                                specialistDecision={dispute.specialistDecision}
                                                specialistReviewedAt={dispute.specialistReviewedAt}
                                                managerReviewedAt={dispute.managerReviewedAt}
                                                processedAt={dispute.processedAt}
                                            />
                                            {dispute.specialistComments && (
                                                <div className="mt-4 p-3 bg-blue-50 rounded-lg">
                                                    <p className="text-sm font-medium text-blue-900">Specialist Comments:</p>
                                                    <p className="text-sm text-blue-700 mt-1">{dispute.specialistComments}</p>
                                                </div>
                                            )}
                                            {dispute.managerComments && (
                                                <div className="mt-2 p-3 bg-green-50 rounded-lg">
                                                    <p className="text-sm font-medium text-green-900">Manager Comments:</p>
                                                    <p className="text-sm text-green-700 mt-1">{dispute.managerComments}</p>
                                                </div>
                                            )}
                                        </div>
                                    )}
                                </div>
                            ))}
                        </div>
                    )}
                </CardContent>
            </Card>
        </div>
    );
}
