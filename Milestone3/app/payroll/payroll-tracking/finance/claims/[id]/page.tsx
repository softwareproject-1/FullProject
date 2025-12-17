'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { ArrowLeft, Loader2, CheckCircle } from 'lucide-react';
import { financeStaffApi, ExpenseClaimDto } from '@/services/api';
import StatusBadge from '@/components/payroll/StatusBadge';

import { toast } from 'sonner';
import Link from 'next/link';

export default function FinanceDisputeProcessPage() {
    const params = useParams();
    const router = useRouter();
    const claimId = params.id as string;

    const [claim, setClaim] = useState<ExpenseClaimDto | null>(null);
    const [loading, setLoading] = useState(true);
    const [submitting, setSubmitting] = useState(false);

    useEffect(() => {
        fetchClaim();
    }, [claimId]);

    const fetchClaim = async () => {
        try {
            const response = await financeStaffApi.getClaim(claimId);
            setClaim(response.data.data || response.data);
        } catch (err) {
            // Fallback to mock data - you can add mock data handling here if needed
            console.warn('Failed to fetch claim, using fallback');
            setClaim(null);
        } finally {
            setLoading(false);
        }
    };

    const handleProcess = async () => {
        setSubmitting(true);
        try {
            await financeStaffApi.processClaimRefund(claimId);
            toast.success('Refund processed successfully - Status updated to COMPLETED');
            router.push('/payroll/payroll-tracking/finance/claims');
        } catch (err: any) {
            toast.error(err.response?.data?.message || 'Failed to process refund');
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
                <Link href="/payroll/payroll-tracking/finance/claims">
                    <Button className="mt-4">Back to Claims</Button>
                </Link>
            </div>
        );
    }

    return (
        <div className="space-y-6 max-w-4xl mx-auto">
            <div className="flex items-center gap-4">
                <Link href="/payroll/payroll-tracking/finance/claims">
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
                            disabled={submitting || (claim.status !== 'APPROVED' && claim.status !== 'approved')}
                            className="flex-1 bg-green-600 hover:bg-green-700"
                        >
                            <CheckCircle className="w-4 h-4 mr-2" />
                            {submitting ? 'Processing...' : 'Process Refund'}
                        </Button>

                    </div>
                    {(claim.status !== 'APPROVED' && claim.status !== 'approved') && (
                        <p className="text-sm text-amber-600 mt-3">
                            ⚠️ This claim is not in APPROVED status and cannot be processed
                        </p>
                    )}
                </CardContent>
            </Card>
        </div>
    );
}
