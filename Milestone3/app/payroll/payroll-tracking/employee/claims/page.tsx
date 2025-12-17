'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Plus, Loader2, Receipt } from 'lucide-react';
import { payrollTrackingApi, ExpenseClaimDto } from '@/services/api';
import StatusBadge from '@/components/payroll/StatusBadge';
import ApprovalTimeline from '@/components/payroll/ApprovalTimeline';

export default function MyClaimsPage() {
    const [claims, setClaims] = useState<ExpenseClaimDto[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [selectedClaim, setSelectedClaim] = useState<ExpenseClaimDto | null>(null);

    useEffect(() => {
        fetchClaims();
    }, []);

    const fetchClaims = async () => {
        try {
            setLoading(true);
            setError(null);
            const response = await payrollTrackingApi.getMyClaims();
            setClaims(response.data.data || response.data || []);
        } catch (err: any) {
            console.error('Error fetching claims:', err);
            setError(err.response?.data?.message || 'Failed to load claims');
            setClaims([]);
        } finally {
            setLoading(false);
        }
    };

    const pendingCount = claims.filter((c) => c.status === 'PENDING').length;
    const approvedCount = claims.filter((c) => c.status === 'APPROVED').length;
    const paidCount = claims.filter((c) => c.status === 'PAID').length;
    const totalAmount = claims.reduce((sum, c) => sum + c.amount, 0);

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold text-slate-900">My Expense Claims</h1>
                    <p className="text-slate-600 mt-1">Track and manage your expense reimbursements</p>
                </div>
                <Link href="/payroll/payroll-tracking/employee/claims/create">
                    <Button>
                        <Plus className="w-4 h-4 mr-2" />
                        Submit New Claim
                    </Button>
                </Link>
            </div>

            {/* Summary Cards */}
            <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
                <Card>
                    <CardHeader className="pb-3">
                        <CardDescription>Total Claims</CardDescription>
                        <CardTitle className="text-2xl">{claims.length}</CardTitle>
                    </CardHeader>
                </Card>
                <Card>
                    <CardHeader className="pb-3">
                        <CardDescription>Total Amount</CardDescription>
                        <CardTitle className="text-2xl">${totalAmount.toLocaleString()}</CardTitle>
                    </CardHeader>
                </Card>
                <Card>
                    <CardHeader className="pb-3">
                        <CardDescription>Pending</CardDescription>
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
                        <CardDescription>Paid</CardDescription>
                        <CardTitle className="text-2xl text-green-600">{paidCount}</CardTitle>
                    </CardHeader>
                </Card>
            </div>

            {/* Claims List */}
            <Card>
                <CardHeader>
                    <CardTitle>Claim History</CardTitle>
                    <CardDescription>Click on a claim to view its approval timeline</CardDescription>
                </CardHeader>
                <CardContent>
                    {loading ? (
                        <div className="text-center py-12">
                            <Loader2 className="h-12 w-12 animate-spin text-blue-600 mx-auto mb-4" />
                        </div>
                    ) : claims.length === 0 ? (
                        <div className="text-center py-12">
                            <Receipt className="w-16 h-16 text-slate-300 mx-auto mb-4" />
                            <p className="text-slate-600 mb-4">No expense claims submitted yet</p>
                            <Link href="/payroll/payroll-tracking/employee/claims/create">
                                <Button>Submit Your First Claim</Button>
                            </Link>
                        </div>
                    ) : (
                        <div className="space-y-4">
                            {claims.map((claim) => (
                                <div
                                    key={claim._id}
                                    className="border border-slate-200 rounded-lg p-4 hover:shadow-md transition-shadow cursor-pointer"
                                    onClick={() => setSelectedClaim(selectedClaim?._id === claim._id ? null : claim)}
                                >
                                    <div className="flex items-start justify-between">
                                        <div className="flex-1">
                                            <div className="flex items-center gap-3 mb-2">
                                                <h3 className="font-semibold text-slate-900">{claim.claimType}</h3>
                                                <StatusBadge status={claim.status} />
                                            </div>
                                            <p className="text-sm text-slate-600 mb-2">{claim.description}</p>
                                            <div className="flex items-center gap-4 text-sm text-slate-500">
                                                <span>Submitted: {claim.submittedAt ? new Date(claim.submittedAt).toLocaleDateString() : new Date(claim.createdAt).toLocaleDateString()}</span>
                                                <span className="font-semibold text-green-600">
                                                    Amount: ${claim.amount.toLocaleString()}
                                                </span>
                                                {claim.receipts && claim.receipts.length > 0 && (
                                                    <span>{claim.receipts.length} receipt(s) attached</span>
                                                )}
                                            </div>
                                        </div>
                                    </div>

                                    {/* Approval Timeline */}
                                    {selectedClaim?._id === claim._id && (
                                        <div className="mt-6 pt-6 border-t border-slate-200">
                                            <ApprovalTimeline
                                                steps={[
                                                    {
                                                        title: 'Claim Submitted',
                                                        status: 'completed',
                                                        date: claim.submittedAt ? new Date(claim.submittedAt).toLocaleDateString() : new Date(claim.createdAt).toLocaleDateString(),
                                                        description: 'Your expense claim was submitted for review'
                                                    },
                                                    {
                                                        title: 'Specialist Review',
                                                        status: claim.specialistReviewedAt
                                                            ? (claim.specialistDecision === 'REJECTED' ? 'rejected' : 'completed')
                                                            : (claim.status === 'PENDING' ? 'current' : 'pending'),
                                                        date: claim.specialistReviewedAt ? new Date(claim.specialistReviewedAt).toLocaleDateString() : undefined,
                                                        description: claim.specialistDecision === 'REJECTED'
                                                            ? 'Claim was rejected by specialist'
                                                            : claim.specialistReviewedAt
                                                                ? 'Reviewed and approved by payroll specialist'
                                                                : 'Awaiting specialist review'
                                                    },
                                                    {
                                                        title: 'Manager Approval',
                                                        status: claim.status === 'REJECTED'
                                                            ? 'rejected'
                                                            : claim.managerReviewedAt
                                                                ? 'completed'
                                                                : claim.specialistReviewedAt && claim.specialistDecision !== 'REJECTED'
                                                                    ? 'current'
                                                                    : 'pending',
                                                        date: claim.managerReviewedAt ? new Date(claim.managerReviewedAt).toLocaleDateString() : undefined,
                                                        description: claim.status === 'REJECTED'
                                                            ? 'Claim was rejected by manager'
                                                            : claim.managerReviewedAt
                                                                ? 'Approved by payroll manager'
                                                                : 'Awaiting manager approval'
                                                    },
                                                    {
                                                        title: 'Payment Processing',
                                                        status: claim.status === 'PAID' || claim.processedAt
                                                            ? 'completed'
                                                            : claim.status === 'APPROVED'
                                                                ? 'current'
                                                                : 'pending',
                                                        date: claim.processedAt ? new Date(claim.processedAt).toLocaleDateString() : undefined,
                                                        description: claim.status === 'PAID'
                                                            ? 'Payment has been processed'
                                                            : claim.status === 'APPROVED'
                                                                ? 'Processing payment for next payroll cycle'
                                                                : 'Awaiting approval before processing'
                                                    }
                                                ]}
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
                                            {claim.receipts && claim.receipts.length > 0 && (
                                                <div className="mt-4">
                                                    <p className="text-sm font-medium text-slate-900 mb-2">Receipts:</p>
                                                    <div className="flex gap-2 flex-wrap">
                                                        {claim.receipts.map((receipt, idx) => (
                                                            <a
                                                                key={idx}
                                                                href={receipt}
                                                                target="_blank"
                                                                rel="noopener noreferrer"
                                                                className="text-sm text-blue-600 hover:underline"
                                                            >
                                                                Receipt {idx + 1}
                                                            </a>
                                                        ))}
                                                    </div>
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
