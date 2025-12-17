'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { ArrowLeft, Loader2, DollarSign, FileText, Calendar, CheckCircle, XCircle } from 'lucide-react';
import { payrollManagerApi, ExpenseClaimDto } from '@/services/api';
import StatusBadge from '@/components/payroll/StatusBadge';
import { toast } from 'sonner';
import Link from 'next/link';
import { format } from 'date-fns';

export default function ManagerClaimDetailPage() {
    const params = useParams();
    const router = useRouter();
    const claimId = params.id as string;

    const [claim, setClaim] = useState<ExpenseClaimDto | null>(null);
    const [loading, setLoading] = useState(true);
    const [decision, setDecision] = useState<'confirm' | 'reject'>('confirm');
    const [comments, setComments] = useState('');
    const [submitting, setSubmitting] = useState(false);

    useEffect(() => {
        if (claimId) {
            fetchClaimDetails();
        }
    }, [claimId]);

    const fetchClaimDetails = async () => {
        try {
            setLoading(true);
            const response = await payrollManagerApi.getClaim(claimId);
            // Handle potentially unwrapped data if backend returns directly
            const data = response.data && (response.data as any).data ? (response.data as any).data : response.data;
            setClaim(data);
        } catch (err) {
            console.error('Failed to fetch claim:', err);
            toast.error('Failed to load claim details');
        } finally {
            setLoading(false);
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (decision === 'reject' && !comments.trim()) {
            toast.error('Rejection reason is required');
            return;
        }

        try {
            setSubmitting(true);
            await payrollManagerApi.managerActionClaim(
                claimId,
                decision,
                decision === 'reject' ? comments : undefined
            );

            toast.success(`Claim ${decision === 'confirm' ? 'approved' : 'rejected'} successfully`);
            router.push('/payroll/payroll-tracking/manager/claims');
            router.refresh(); // Refresh to update the list
        } catch (err) {
            console.error('Failed to process claim:', err);
            toast.error('Failed to process claim');
        } finally {
            setSubmitting(false);
        }
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center p-12">
                <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
            </div>
        );
    }

    if (!claim) {
        return (
            <div className="p-6">
                <div className="flex items-center gap-2 text-slate-500 mb-6">
                    <Link href="/payroll/payroll-tracking/manager/claims" className="hover:text-slate-800 transition-colors">
                        <ArrowLeft className="w-4 h-4" />
                    </Link>
                    <span>Back to Claims</span>
                </div>
                <Card className="bg-red-50 border-red-200">
                    <CardContent className="pt-6 text-center text-red-600">
                        Claim not found
                    </CardContent>
                </Card>
            </div>
        );
    }

    return (
        <div className="space-y-6 max-w-4xl mx-auto p-6">
            <div className="flex items-center gap-2 text-slate-500">
                <Link href="/payroll/payroll-tracking/manager/claims" className="hover:text-slate-800 transition-colors">
                    <ArrowLeft className="w-4 h-4" />
                </Link>
                <span>Back to Claims</span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Claim Details */}
                <Card>
                    <CardHeader>
                        <div className="flex justify-between items-start">
                            <div>
                                <CardTitle className="text-xl">Claim Details</CardTitle>
                                <CardDescription className="font-mono mt-1">{claim.claimId}</CardDescription>
                            </div>
                            <StatusBadge status={claim.status} />
                        </div>
                    </CardHeader>
                    <CardContent className="space-y-6">
                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-1">
                                <Label className="text-slate-500">Amount</Label>
                                <div className="flex items-center gap-2 font-semibold text-lg">
                                    <DollarSign className="w-4 h-4 text-slate-400" />
                                    {claim.amount.toLocaleString()}
                                </div>
                            </div>
                            <div className="space-y-1">
                                <Label className="text-slate-500">Type</Label>
                                <div className="font-medium">{claim.claimType}</div>
                            </div>
                        </div>

                        <div className="space-y-1">
                            <Label className="text-slate-500">Description</Label>
                            <div className="p-3 bg-slate-50 rounded-md text-sm">
                                {claim.description}
                            </div>
                        </div>

                        <div className="space-y-1">
                            <Label className="text-slate-500">Receipts</Label>
                            {claim.receipts && claim.receipts.length > 0 ? (
                                <div className="flex items-center gap-2 text-sm text-blue-600">
                                    <FileText className="w-4 h-4" />
                                    <span>{claim.receipts.length} receipt(s) attached</span>
                                </div>
                            ) : (
                                <div className="text-sm text-slate-500 italic">No receipts attached</div>
                            )}
                        </div>

                        <div className="space-y-1">
                            <Label className="text-slate-500">Submission Date</Label>
                            <div className="flex items-center gap-2 text-sm">
                                <Calendar className="w-4 h-4 text-slate-400" />
                                {claim.submittedAt ? format(new Date(claim.submittedAt), 'PPP') : 'N/A'}
                            </div>
                        </div>
                    </CardContent>
                </Card>

                {/* Confirm Action */}
                <Card className="h-fit">
                    <CardHeader>
                        <CardTitle>Manager Confirmation</CardTitle>
                        <CardDescription>Review and make a final decision</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <form onSubmit={handleSubmit} className="space-y-6">
                            <RadioGroup
                                value={decision}
                                onValueChange={(v) => setDecision(v as 'confirm' | 'reject')}
                                className="grid grid-cols-2 gap-4"
                            >
                                <div>
                                    <RadioGroupItem value="confirm" id="confirm" className="peer sr-only" />
                                    <Label
                                        htmlFor="confirm"
                                        className="flex flex-col items-center justify-between rounded-md border-2 border-muted bg-popover p-4 hover:bg-accent peer-data-[state=checked]:border-green-500 peer-data-[state=checked]:bg-green-50 [&:has([data-state=checked])]:border-green-500 cursor-pointer"
                                    >
                                        <CheckCircle className="mb-2 h-6 w-6 text-green-600" />
                                        <span className="font-semibold text-green-700">Approve</span>
                                    </Label>
                                </div>
                                <div>
                                    <RadioGroupItem value="reject" id="reject" className="peer sr-only" />
                                    <Label
                                        htmlFor="reject"
                                        className="flex flex-col items-center justify-between rounded-md border-2 border-muted bg-popover p-4 hover:bg-accent peer-data-[state=checked]:border-red-500 peer-data-[state=checked]:bg-red-50 [&:has([data-state=checked])]:border-red-500 cursor-pointer"
                                    >
                                        <XCircle className="mb-2 h-6 w-6 text-red-600" />
                                        <span className="font-semibold text-red-700">Reject</span>
                                    </Label>
                                </div>
                            </RadioGroup>

                            {decision === 'reject' && (
                                <div className="space-y-2 animate-in fade-in slide-in-from-top-2">
                                    <Label htmlFor="comments">Rejection Reason <span className="text-red-500">*</span></Label>
                                    <Textarea
                                        id="comments"
                                        placeholder="Please provide a reason for rejection..."
                                        value={comments}
                                        onChange={(e) => setComments(e.target.value)}
                                        required
                                    />
                                </div>
                            )}

                            <div className="pt-4">
                                <Button
                                    type="submit"
                                    className={`w-full ${decision === 'confirm' ? 'bg-green-600 hover:bg-green-700' : 'bg-red-600 hover:bg-red-700'}`}
                                    disabled={submitting}
                                >
                                    {submitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                    {decision === 'confirm' ? 'Confirm Approval' : 'Reject Claim'}
                                </Button>
                            </div>
                        </form>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}
