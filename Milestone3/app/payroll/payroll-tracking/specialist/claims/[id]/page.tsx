'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Loader2, CheckCircle, XCircle, ArrowLeft, FileText, Calendar, DollarSign, User } from 'lucide-react';
import { payrollSpecialistApi, ExpenseClaimDto } from '@/services/api';
import StatusBadge from '@/components/payroll/StatusBadge';
import { toast } from 'sonner';

export default function SpecialistClaimDetailPage() {
    const params = useParams();
    const router = useRouter();
    const claimId = params.id as string;

    const [claim, setClaim] = useState<ExpenseClaimDto | null>(null);
    const [loading, setLoading] = useState(true);
    const [submitting, setSubmitting] = useState(false);
    const [comments, setComments] = useState('');

    useEffect(() => {
        if (claimId) {
            fetchClaim();
        }
    }, [claimId]);

    const fetchClaim = async () => {
        try {
            setLoading(true);
            const response = await payrollSpecialistApi.getClaim(claimId);
            const claimData = response.data.data || response.data;
            console.log('CLAIM DATA:', claimData);
            console.log('CLAIM STATUS:', claimData.status);
            setClaim(claimData);
        } catch (err) {
            console.error('Failed to fetch claim:', err);
            toast.error('Failed to load claim details');
        } finally {
            setLoading(false);
        }
    };

    const handleApprove = async () => {
        if (!comments.trim()) {
            toast.error('Please provide approval comments');
            return;
        }

        try {
            setSubmitting(true);
            await payrollSpecialistApi.reviewClaim(claimId, 'APPROVE', comments);
            toast.success('Claim approved! Escalated to Payroll Manager for final approval.');
            router.push('/payroll/payroll-tracking/specialist/claims');
        } catch (err) {
            console.error('Failed to approve claim:', err);
            toast.error('Failed to approve claim');
        } finally {
            setSubmitting(false);
        }
    };

    const handleReject = async () => {
        if (!comments.trim()) {
            toast.error('Please provide rejection reason');
            return;
        }

        try {
            setSubmitting(true);
            await payrollSpecialistApi.reviewClaim(claimId, 'REJECT', comments);
            toast.success('Claim rejected. Employee will be notified.');
            router.push('/payroll/payroll-tracking/specialist/claims');
        } catch (err) {
            console.error('Failed to reject claim:', err);
            toast.error('Failed to reject claim');
        } finally {
            setSubmitting(false);
        }
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-[400px]">
                <Loader2 className="h-12 w-12 animate-spin text-blue-600" />
            </div>
        );
    }

    if (!claim) {
        return (
            <div className="text-center py-12">
                <XCircle className="w-16 h-16 text-red-600 mx-auto mb-4" />
                <p className="text-slate-600">Claim not found</p>
                <Button className="mt-4" onClick={() => router.push('/payroll/payroll-tracking/specialist/claims')}>
                    Back to Claims
                </Button>
            </div>
        );
    }

    // Check if claim is pending review (handle both uppercase and lowercase variations)
    const status = claim.status?.toUpperCase().replace(/\s+/g, '_') || '';
    const isPending = status === 'UNDER_REVIEW' || status === 'PENDING';

    console.log('Status check - Original:', claim.status, 'Normalized:', status, 'isPending:', isPending);

    return (
        <div className="space-y-6 max-w-4xl">
            {/* Header */}
            <div className="flex items-center gap-4">
                <Button
                    variant="outline"
                    size="sm"
                    onClick={() => router.push('/payroll/payroll-tracking/specialist/claims')}
                >
                    <ArrowLeft className="w-4 h-4 mr-2" />
                    Back to Claims
                </Button>
                <div className="flex-1">
                    <h1 className="text-3xl font-bold text-slate-900">Review Expense Claim</h1>
                    <p className="text-slate-600 mt-1">Review details and approve or reject</p>
                </div>
                <StatusBadge status={claim.status} />
            </div>

            {/* Claim Details Card */}
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <FileText className="w-5 h-5" />
                        Claim Information
                    </CardTitle>
                    <CardDescription>Details of the expense reimbursement request</CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                    {/* Employee & Amount */}
                    <div className="grid grid-cols-2 gap-6">
                        <div>
                            <div className="flex items-center gap-2 text-sm font-medium text-slate-500 mb-2">
                                <User className="w-4 h-4" />
                                Employee
                            </div>
                            <p className="text-lg font-semibold text-slate-900">{claim.employeeName || 'N/A'}</p>
                            <p className="text-sm text-slate-600">Employee ID: {claim.employeeId}</p>
                        </div>
                        <div>
                            <div className="flex items-center gap-2 text-sm font-medium text-slate-500 mb-2">
                                <DollarSign className="w-4 h-4" />
                                Amount
                            </div>
                            <p className="text-2xl font-bold text-green-600">${claim.amount.toLocaleString()}</p>
                        </div>
                    </div>

                    {/* Claim Type & Date */}
                    <div className="grid grid-cols-2 gap-6">
                        <div>
                            <p className="text-sm font-medium text-slate-500 mb-1">Claim Type</p>
                            <p className="text-lg text-slate-900">{claim.claimType}</p>
                        </div>
                        <div>
                            <div className="flex items-center gap-2 text-sm font-medium text-slate-500 mb-1">
                                <Calendar className="w-4 h-4" />
                                Submitted
                            </div>
                            <p className="text-lg text-slate-900">
                                {claim.submittedAt ? new Date(claim.submittedAt).toLocaleDateString('en-US', {
                                    year: 'numeric',
                                    month: 'long',
                                    day: 'numeric'
                                }) : 'N/A'}
                            </p>
                        </div>
                    </div>

                    {/* Description */}
                    <div>
                        <p className="text-sm font-medium text-slate-500 mb-2">Description</p>
                        <p className="text-slate-900 bg-slate-50 p-4 rounded-lg border border-slate-200">
                            {claim.description || 'No description provided'}
                        </p>
                    </div>

                    {/* Receipts */}
                    {claim.receipts && claim.receipts.length > 0 && (
                        <div>
                            <p className="text-sm font-medium text-slate-500 mb-2">
                                Receipts ({claim.receipts.length})
                            </p>
                            <div className="space-y-2">
                                {claim.receipts.map((receipt: any, index: number) => (
                                    <div key={index} className="flex items-center gap-3 p-3 bg-slate-50 rounded-lg border border-slate-200">
                                        <FileText className="w-5 h-5 text-blue-600" />
                                        <span className="text-sm text-slate-900">{receipt.filename || `Receipt ${index + 1}`}</span>
                                        {receipt.url && (
                                            <a
                                                href={receipt.url}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                className="ml-auto text-sm text-blue-600 hover:underline"
                                            >
                                                View
                                            </a>
                                        )}
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Rejection Reason (if rejected) */}
                    {claim.rejectionReason && (
                        <div>
                            <p className="text-sm font-medium text-red-600 mb-2">Rejection Reason</p>
                            <p className="text-slate-900 bg-red-50 p-4 rounded-lg border border-red-200">
                                {claim.rejectionReason}
                            </p>
                        </div>
                    )}
                </CardContent>
            </Card>

            {/* Review Section - Only show if pending */}
            {isPending && (
                <Card>
                    <CardHeader>
                        <CardTitle>Review Decision</CardTitle>
                        <CardDescription>
                            Approve to escalate to Payroll Manager, or reject to close the claim
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div>
                            <label className="text-sm font-medium text-slate-700 mb-2 block">
                                Comments / Decision Notes *
                            </label>
                            <Textarea
                                value={comments}
                                onChange={(e) => setComments(e.target.value)}
                                placeholder="Provide detailed comments explaining your decision..."
                                rows={5}
                                className="resize-none"
                            />
                            <p className="text-xs text-slate-500 mt-1">
                                These comments will be visible to the manager (for approvals) or the employee (for rejections)
                            </p>
                        </div>

                        <div className="flex gap-3 pt-4">
                            <Button
                                className="flex-1 bg-green-600 hover:bg-green-700"
                                onClick={handleApprove}
                                disabled={submitting || !comments.trim()}
                            >
                                {submitting ? (
                                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                ) : (
                                    <CheckCircle className="w-4 h-4 mr-2" />
                                )}
                                Approve & Escalate to Manager
                            </Button>
                            <button
                                className="flex-1 inline-flex items-center justify-center gap-2 bg-red-600 hover:bg-red-700 text-white font-medium rounded-md px-4 py-2 transition-all disabled:opacity-50 disabled:pointer-events-none h-9"
                                onClick={handleReject}
                                disabled={submitting || !comments.trim()}
                            >
                                {submitting ? (
                                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                ) : (
                                    <XCircle className="w-4 h-4 mr-2" />
                                )}
                                Reject & Notify Employee
                            </button>
                        </div>

                        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mt-4">
                            <p className="text-sm text-blue-900">
                                <strong>Note:</strong> Approving moves the claim to "Pending Manager Approval" status.
                                Rejecting closes the claim immediately and notifies the employee.
                            </p>
                        </div>
                    </CardContent>
                </Card>
            )}

            {/* Already Processed Message */}
            {!isPending && (
                <Card>
                    <CardContent className="py-8">
                        <div className="text-center">
                            {claim.status === 'APPROVED' ? (
                                <>
                                    <CheckCircle className="w-12 h-12 text-green-600 mx-auto mb-3" />
                                    <p className="text-lg font-medium text-slate-900">This claim has been approved</p>
                                </>
                            ) : (
                                <>
                                    <XCircle className="w-12 h-12 text-red-600 mx-auto mb-3" />
                                    <p className="text-lg font-medium text-slate-900">This claim has been {claim.status.toLowerCase()}</p>
                                </>
                            )}
                            <p className="text-sm text-slate-600 mt-2">No further action required</p>
                        </div>
                    </CardContent>
                </Card>
            )}
        </div>
    );
}
