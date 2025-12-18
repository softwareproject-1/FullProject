'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Loader2, CheckCircle, XCircle } from 'lucide-react';
import { payrollManagerApi, ExpenseClaimDto } from '@/services/api';
import StatusBadge from '@/components/payroll/StatusBadge';
import { toast } from 'sonner';

export default function ManagerClaimsPage() {
    const [claims, setClaims] = useState<ExpenseClaimDto[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchClaims();
    }, []);

    const fetchClaims = async () => {
        try {
            setLoading(true);
            const response = await payrollManagerApi.getSpecialistApprovedClaims();
            console.log('Manager claims API response:', response);
            console.log('Response data:', response.data);
            // Backend returns array directly, not wrapped in { data: [...] }
            const claimsData = Array.isArray(response.data) ? response.data : [];
            console.log('Claims to display:', claimsData);
            setClaims(claimsData);
        } catch (err) {
            console.error('Failed to fetch claims:', err);
            toast.error('Failed to load claims');
            setClaims([]);
        } finally {
            setLoading(false);
        }
    };



    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold text-slate-900">Manager Claim Confirmations</h1>
                    <p className="text-slate-600 mt-1">Review and confirm specialist-approved claims</p>
                </div>
            </div>

            <Card>
                <CardHeader>
                    <CardTitle>Claims Queue</CardTitle>
                    <CardDescription>
                        Final approval step: Approve to finalize the claim, or reject to close it
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
                                                {claim.receipts?.length ? (
                                                    <span>{claim.receipts.length} receipt(s)</span>
                                                ) : null}
                                            </div>
                                        </div>
                                        <div className="flex flex-col gap-2">
                                            <Link href={`/payroll/payroll-tracking/manager/claims/${claim._id}`}>
                                                <Button size="sm" variant="outline" className="w-full">
                                                    Review Details
                                                </Button>
                                            </Link>
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
