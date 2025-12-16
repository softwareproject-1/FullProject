'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { ArrowLeft, Loader2, CheckCircle, XCircle } from 'lucide-react';
import { financeStaffApi, DisputeDto } from '@/services/api';
import StatusBadge from '@/components/payroll/StatusBadge';
import ApprovalTimeline from '@/components/payroll/ApprovalTimeline';
import { toast } from 'sonner';
import Link from 'next/link';

export default function FinanceDisputeProcessPage() {
    const params = useParams();
    const router = useRouter();
    const disputeId = params.id as string;

    const [dispute, setDispute] = useState<DisputeDto | null>(null);
    const [loading, setLoading] = useState(true);
    const [submitting, setSubmitting] = useState(false);

    useEffect(() => {
        fetchDispute();
    }, [disputeId]);

    const fetchDispute = async () => {
        try {
            const response = await financeStaffApi.getDispute(disputeId);
            setDispute(response.data);
        } catch (err) {
            const { MOCK_DISPUTES } = await import('@/lib/mockData');
            const found = (MOCK_DISPUTES as any).find((d: DisputeDto) => d._id === disputeId);
            setDispute(found || null);
        } finally {
            setLoading(false);
        }
    };

    const handleProcess = async () => {
        setSubmitting(true);
        try {
            await financeStaffApi.processDisputeRefund(disputeId);
            toast.success('Refund processed successfully - Status updated to COMPLETED');
            router.push('/payroll/tracking/finance/disputes');
        } catch (err: any) {
            toast.error(err.response?.data?.message || 'Failed to process refund');
        } finally {
            setSubmitting(false);
        }
    };

    const handleReject = async () => {
        const reason = prompt('Enter rejection reason:');
        if (!reason) return;

        setSubmitting(true);
        try {
            await financeStaffApi.rejectDispute(disputeId, reason);
            toast.success('Dispute rejected');
            router.push('/payroll/tracking/finance/disputes');
        } catch (err: any) {
            toast.error(err.response?.data?.message || 'Failed to reject dispute');
        } finally {
            setSubmitting(false);
        }
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-screen">
                <Loader2 className="h-12 w-12 animate-spin text-blue-600" />
            </div>
        );
    }

    if (!dispute) {
        return (
            <div className="text-center py-12">
                <p className="text-red-600">Dispute not found</p>
                <Link href="/payroll/tracking/finance/disputes">
                    <Button className="mt-4">Back to Disputes</Button>
                </Link>
            </div>
        );
    }

    return (
        <div className="space-y-6 max-w-4xl mx-auto">
            <div className="flex items-center gap-4">
                <Link href="/payroll/tracking/finance/disputes">
                    <Button variant="outline" size="sm">
                        <ArrowLeft className="w-4 h-4 mr-2" />
                        Back
                    </Button>
                </Link>
                <div>
                    <h1 className="text-3xl font-bold text-slate-900">Process Dispute Refund</h1>
                    <p className="text-slate-600 mt-1">Generate refund for next payslip</p>
                </div>
            </div>

            {/* Dispute Details */}
            <Card>
                <CardHeader>
                    <div className="flex items-center justify-between">
                        <div>
                            <CardTitle>{dispute.reason}</CardTitle>
                            <CardDescription>Submitted by {dispute.employeeName}</CardDescription>
                        </div>
                        <StatusBadge status={dispute.status} />
                    </div>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div>
                        <Label className="text-sm font-semibold">Description</Label>
                        <p className="text-slate-700 mt-1">{dispute.description}</p>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <Label className="text-sm font-semibold">Payslip ID</Label>
                            <p className="text-slate-700 mt-1">{dispute.payslipId}</p>
                        </div>
                        {dispute.amount && (
                            <div>
                                <Label className="text-sm font-semibold">Refund Amount</Label>
                                <p className="text-green-600 font-semibold text-2xl mt-1">
                                    ${dispute.amount.toLocaleString()}
                                </p>
                            </div>
                        )}
                    </div>
                </CardContent>
            </Card>

            {/* Approval Timeline */}
            <Card>
                <CardHeader>
                    <CardTitle>Approval History</CardTitle>
                </CardHeader>
                <CardContent>
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
                </CardContent>
            </Card>

            {/* Process Actions */}
            <Card>
                <CardHeader>
                    <CardTitle>Process Refund</CardTitle>
                    <CardDescription>
                        Processing will mark this dispute as COMPLETED and add the refund to the employee's next payslip
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="flex gap-3">
                        <Button
                            onClick={handleProcess}
                            disabled={submitting || dispute.status !== 'APPROVED'}
                            className="flex-1 bg-green-600 hover:bg-green-700"
                        >
                            <CheckCircle className="w-4 h-4 mr-2" />
                            {submitting ? 'Processing...' : 'Process Refund'}
                        </Button>
                        <Button
                            onClick={handleReject}
                            disabled={submitting || dispute.status !== 'APPROVED'}
                            variant="destructive"
                        >
                            <XCircle className="w-4 h-4 mr-2" />
                            Reject
                        </Button>
                    </div>
                    {dispute.status !== 'APPROVED' && (
                        <p className="text-sm text-amber-600 mt-3">
                            ⚠️ This dispute is not in APPROVED status and cannot be processed
                        </p>
                    )}
                </CardContent>
            </Card>
        </div>
    );
}
