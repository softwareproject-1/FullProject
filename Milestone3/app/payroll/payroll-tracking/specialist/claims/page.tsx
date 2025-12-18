'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Loader2, CheckCircle, XCircle } from 'lucide-react';
import { payrollSpecialistApi, ExpenseClaimDto } from '@/services/api';
import StatusBadge from '@/components/payroll/StatusBadge';
import { toast } from 'sonner';

export default function SpecialistClaimsPage() {
    const [claims, setClaims] = useState<ExpenseClaimDto[]>([]);
    const [loading, setLoading] = useState(true);
    const [filter, setFilter] = useState<'ALL' | 'PENDING'>('PENDING');

    useEffect(() => {
        fetchClaims();
    }, [filter]);

    const fetchClaims = async () => {
        try {
            setLoading(true);
            const response = filter === 'PENDING'
                ? await payrollSpecialistApi.getPendingClaims()
                : await payrollSpecialistApi.getAllClaims();
            setClaims(response.data.data || response.data || []);
        } catch (err) {
            console.error('Failed to fetch claims:', err);
            setClaims([]);
        } finally {
            setLoading(false);
        }
    };

    const handleQuickReview = async (id: string, action: 'APPROVE' | 'REJECT') => {
        try {
            await payrollSpecialistApi.reviewClaim(id, action, `Quick ${action.toLowerCase()} from list view`);
            toast.success(`Claim ${action.toLowerCase()}d successfully`);
            fetchClaims();
        } catch (err) {
            toast.error('Failed to review claim');
        }
    };

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold text-slate-900">Review Expense Claims</h1>
                    <p className="text-slate-600 mt-1">Review and approve employee expense reimbursements</p>
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
                        All Claims
                    </Button>
                </div>
            </div>

            <Card>
                <CardHeader>
                    <CardTitle>Claims Queue</CardTitle>
                    <CardDescription>
                        Approve to escalate to manager, or reject to close the claim
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    {loading ? (
                        <div className="text-center py-12">
                            <Loader2 className="h-12 w-12 animate-spin text-blue-600 mx-auto mb-4" />
                        </div>
                    ) : claims.length === 0 ? (
                        <div className="text-center py-12">
                            <CheckCircle className="w-16 h-16 text-green-600 mx-auto mb-4" />
                            <p className="text-slate-600">No claims to review</p>
                        </div>
                    ) : (
                        <div className="space-y-4">
                            {claims.map((claim) => (
                                <div
                                    key={claim._id}
                                    className="border border-slate-200 rounded-lg p-4 hover:shadow-md transition-shadow"
                                >
                                    <div className="flex items-start justify-between gap-4">
                                        <div className="flex-1">
                                            <div className="flex items-center gap-3 mb-2">
                                                <h3 className="font-semibold text-slate-900">{claim.claimType}</h3>
                                                <StatusBadge status={claim.status} />
                                            </div>
                                            <p className="text-sm text-slate-600 mb-3">{claim.description}</p>
                                            <div className="flex items-center gap-4 text-sm text-slate-500">
                                                <span>Employee: {claim.employeeName}</span>
                                                <span>Submitted: {claim.submittedAt ? new Date(claim.submittedAt).toLocaleDateString() : 'N/A'}</span>
                                                <span className="font-semibold text-green-600">
                                                    ${claim.amount.toLocaleString()}
                                                </span>
                                                {claim.receipts && claim.receipts.length > 0 && (
                                                    <span>{claim.receipts.length} receipt(s)</span>
                                                )}
                                            </div>
                                        </div>
                                        <div className="flex flex-col gap-2">
                                            <Link href={`/payroll/payroll-tracking/specialist/claims/${claim._id}`}>
                                                <Button size="sm" variant="outline" className="w-full">
                                                    Review Details
                                                </Button>
                                            </Link>
                                            {claim.status === 'PENDING' && (
                                                <>
                                                    <Button
                                                        size="sm"
                                                        className="bg-green-600 hover:bg-green-700"
                                                        onClick={() => handleQuickReview(claim._id, 'APPROVE')}
                                                    >
                                                        <CheckCircle className="w-4 h-4 mr-1" />
                                                        Approve
                                                    </Button>
                                                    <Button
                                                        size="sm"
                                                        variant="destructive"
                                                        onClick={() => handleQuickReview(claim._id, 'REJECT')}
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
