'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { ArrowLeft, Loader2, CheckCircle, XCircle } from 'lucide-react';
import { financeStaffApi, ExpenseClaimDto } from '@/services/api';
import StatusBadge from '@/components/payroll/StatusBadge';
import ApprovalTimeline from '@/components/payroll/ApprovalTimeline';
import { toast } from 'sonner';
import Link from 'next/link';

export default function FinanceDisputeProcessPage() {
    const params = useParams();
    const router = useRouter();
    const disputeId = params.id as string;

    const [claim, setClaim] = useState<ExpenseClaimDto | null>(null);
    const [loading, setLoading] = useState(true);
    const [submitting, setSubmitting] = useState(false);

    useEffect(() => {
        fetchClaim();
    }, [disputeId]);

    const fetchClaim = async () => {
        try {
            const response = await financeStaffApi.getClaim(disputeId);
            setClaim(response.data);
        } catch (err) {
            const { MOCK_CLAIMS } = await import('@/lib/mockData');
            const found = (MOCK_CLAIMS as any).find((c: ExpenseClaimDto) => c._id === disputeId);
            setClaim(found || null);
        } finally {
            setLoading(false);
        }
    };

    const handleProcess = async () => {
        setSubmitting(true);
        try {
            await financeStaffApi.processClaimRefund(disputeId);
            toast.success('Refund processed successfully - Status updated to COMPLETED');
            router.push('/payroll/tracking/finance/claims');
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
            await financeStaffApi.rejectClaim(disputeId, reason);
            toast.success('Claim rejected');
            router.push('/payroll/tracking/finance/claims');
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

    if (!claim) {
        return (
            <div className="text-center py-12">
                <p className="text-red-600">Claim not found</p>
                <Link href="/payroll/tracking/finance/claims">
                    <Button className="mt-4">Back to Claims</Button>
                </Link>
            </div>
        );
    }

    return (
        <div className="space-y-6 max-w-4xl mx-auto">
            <div className="flex items-center gap-4">
                <Link href="/payroll/tracking/finance/claims">
                    <Button variant="outline" size="sm">
                        <ArrowLeft className="w-4 h-4 mr-2" />
                        Back
                    </Button>
                </Link>
                <div>
                    <h1 className="text-3xl font-bold text-slate-900">Process Claim Refund</h1>
                    <p className="text-slate-600 mt-1">Generate refund for next payslip</p>
                </div>
            </div>

            {/* Dispute Details */}
            <Card>
                <CardHeader>
                    <div className="flex items-center justify-between">
                        <div>
                            <CardTitle>{claim.claimType}</CardTitle>
                            <CardDescription>Submitted by {claim.employeeName}</CardDescription>
                        </div>
                        <StatusBadge status={claim.status} />
                    </div>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div>
                        <Label className="text-sm font-semibold">Description</Label>
                        <p className="text-slate-700 mt-1">{claim.description}</p>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <Label className="text-sm font-semibold">Claim Type</Label>
                            <p className="text-slate-700 mt-1">{claim.claimType}</p>
                        </div>
                        {claim.amount && (
                            <div>
                                <Label className="text-sm font-semibold">Refund Amount</Label>
                                <p className="text-green-600 font-semibold text-2xl mt-1">
                                    ${claim.amount.toLocaleString()}
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
                        status={claim.status}
                        specialistDecision={claim.specialistDecision}
                        specialistReviewedAt={claim.specialistReviewedAt}
                        managerReviewedAt={claim.managerReviewedAt}
                        processedAt={claim.processedAt}
                    />

                    {claim.specialistComments && (
                        <div className="mt-4 p-3 bg-blue-50 rounded-lg">
                            <p className="text-sm font-medium text-blue-900">Specialist Comments:</p>
                            <p className="text-sm text-blue-700 mt-1">{claim.specialistComments}</p>
                        </div>
                    )}

                    {claim.managerComments && (
                        <div className="mt-2 p-3 bg-green-50 rounded-lg">
                            <p className="text-sm font-medium text-green-900">Manager Comments:</p>
                            <p className="text-sm text-green-700 mt-1">{claim.managerComments}</p>
                        </div>
                    )}
                </CardContent>
            </Card>

            {/* Process Actions */}
            <Card>
                <CardHeader>
                    <CardTitle>Process Refund</CardTitle>
                    <CardDescription>
                        Processing will mark this claim as COMPLETED and add the refund to the employee's next payslip
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="flex gap-3">
                        <Button
                            onClick={handleProcess}
                            disabled={submitting || claim.status !== 'APPROVED'}
                            className="flex-1 bg-green-600 hover:bg-green-700"
                        >
                            <CheckCircle className="w-4 h-4 mr-2" />
                            {submitting ? 'Processing...' : 'Process Refund'}
                        </Button>
                        <Button
                            onClick={handleReject}
                            disabled={submitting || claim.status !== 'APPROVED'}
                            variant="destructive"
                        >
                            <XCircle className="w-4 h-4 mr-2" />
                            Reject
                        </Button>
                    </div>
                    {claim.status !== 'APPROVED' && (
                        <p className="text-sm text-amber-600 mt-3">
                            ⚠️ This claim is not in APPROVED status and cannot be processed
                        </p>
                    )}
                </CardContent>
            </Card>
        </div>
    );
}
