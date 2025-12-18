'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Loader2, CheckCircle, XCircle } from 'lucide-react';
import { payrollSpecialistApi, DisputeDto } from '@/services/api';
import StatusBadge from '@/components/payroll/StatusBadge';
import { toast } from 'sonner';

export default function SpecialistDisputesPage() {
    const [disputes, setDisputes] = useState<DisputeDto[]>([]);
    const [loading, setLoading] = useState(true);
    const [filter, setFilter] = useState<'ALL' | 'PENDING'>('PENDING');

    useEffect(() => {
        fetchDisputes();
    }, [filter]);

    const fetchDisputes = async () => {
        try {
            setLoading(true);
            const response = filter === 'PENDING'
                ? await payrollSpecialistApi.getPendingDisputes()
                : await payrollSpecialistApi.getAllDisputes();
            setDisputes(response.data.data || response.data || []);
        } catch (err) {
            console.error('Failed to fetch disputes:', err);
            setDisputes([]);
        } finally {
            setLoading(false);
        }
    };

    const handleQuickReview = async (id: string, action: 'APPROVE' | 'REJECT') => {
        try {
            await payrollSpecialistApi.reviewDispute(id, action, `Quick ${action.toLowerCase()} from list view`);
            toast.success(`Dispute ${action.toLowerCase()}d successfully`);
            fetchDisputes();
        } catch (err) {
            toast.error('Failed to review dispute');
        }
    };

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold text-slate-900">Review Disputes</h1>
                    <p className="text-slate-600 mt-1">Review and approve employee payroll disputes</p>
                </div>
                <div className="flex gap-2">
                    <Button
                        variant={filter === 'PENDING' ? 'default' : 'outline'}
                        onClick={() => setFilter('PENDING')}
                    >
                        Pending Only
                    </Button>
                    <Button
                        variant={filter === 'ALL' ? 'default' : 'outline'}
                        onClick={() => setFilter('ALL')}
                    >
                        All Disputes
                    </Button>
                </div>
            </div>

            <Card>
                <CardHeader>
                    <CardTitle>Dispute Queue</CardTitle>
                    <CardDescription>
                        Approve to escalate to manager, or reject to close the dispute
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    {loading ? (
                        <div className="text-center py-12">
                            <Loader2 className="h-12 w-12 animate-spin text-blue-600 mx-auto mb-4" />
                        </div>
                    ) : disputes.length === 0 ? (
                        <div className="text-center py-12">
                            <CheckCircle className="w-16 h-16 text-green-600 mx-auto mb-4" />
                            <p className="text-slate-600">No disputes to review</p>
                        </div>
                    ) : (
                        <div className="space-y-4">
                            {disputes.map((dispute) => (
                                <div
                                    key={dispute._id}
                                    className="border border-slate-200 rounded-lg p-4 hover:shadow-md transition-shadow"
                                >
                                    <div className="flex items-start justify-between gap-4">
                                        <div className="flex-1">
                                            <div className="flex items-center gap-3 mb-2">
                                                <h3 className="font-semibold text-slate-900">{dispute.reason}</h3>
                                                <StatusBadge status={dispute.status} />
                                            </div>
                                            <p className="text-sm text-slate-600 mb-3">{dispute.description}</p>
                                            <div className="flex items-center gap-4 text-sm text-slate-500">
                                                <span>Employee: {dispute.employeeName}</span>
                                                <span>Submitted: {dispute.submittedAt ? new Date(dispute.submittedAt).toLocaleDateString() : 'N/A'}</span>
                                                <span>Payslip: {dispute.payslipId}</span>
                                                {dispute.amount && (
                                                    <span className="font-semibold text-green-600">
                                                        ${dispute.amount.toLocaleString()}
                                                    </span>
                                                )}
                                            </div>
                                        </div>
                                        <div className="flex flex-col gap-2">
                                            <Link href={`/payroll/payroll-tracking/specialist/disputes/${dispute._id}`}>
                                                <Button size="sm" variant="outline" className="w-full">
                                                    Review Details
                                                </Button>
                                            </Link>
                                            {dispute.status === 'PENDING' && (
                                                <>
                                                    <Button
                                                        size="sm"
                                                        className="bg-green-600 hover:bg-green-700"
                                                        onClick={() => handleQuickReview(dispute._id, 'APPROVE')}
                                                    >
                                                        <CheckCircle className="w-4 h-4 mr-1" />
                                                        Approve
                                                    </Button>
                                                    <Button
                                                        size="sm"
                                                        variant="destructive"
                                                        onClick={() => handleQuickReview(dispute._id, 'REJECT')}
                                                    >
                                                        <XCircle className="w-4 h-4 mr-1" />
                                                        Reject
                                                    </Button>
                                                </>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </CardContent>
            </Card>
        </div>
    );
}
