'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Loader2, CheckCircle } from 'lucide-react';
import { financeStaffApi, ExpenseClaimDto } from '@/services/api';
import StatusBadge from '@/components/payroll/StatusBadge';
import { toast } from 'sonner';

export default function FinanceDisputesPage() {
    const [claims, setClaims] = useState<ExpenseClaimDto[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchClaims();
    }, []);

    const fetchClaims = async () => {
        try {
            const response = await financeStaffApi.getApprovedClaims();
            setClaims(response.data);
        } catch (err) {
            const { MOCK_CLAIMS } = await import('@/lib/mockData');
            setClaims((MOCK_CLAIMS as any).filter((c: ExpenseClaimDto) => c.status === 'APPROVED'));
        } finally {
            setLoading(false);
        }
    };

    const handleQuickProcess = async (id: string) => {
        try {
            await financeStaffApi.processClaimRefund(id);
            toast.success('Refund processed - Status updated to COMPLETED');
            fetchClaims();
        } catch (err) {
            toast.error('Failed to process refund');
        }
    };

    const totalAmount = claims.reduce((sum, c) => sum + c.amount, 0);

    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-3xl font-bold text-slate-900">Process Claim Refunds</h1>
                <p className="text-slate-600 mt-1">
                    Process approved expense claims and generate refunds for next payslip
                </p>
            </div>

            <Card>
                <CardHeader>
                    <div className="flex items-center justify-between">
                        <div>
                            <CardTitle>Approved Claims Queue</CardTitle>
                            <CardDescription>{claims.length} claims awaiting processing</CardDescription>
                        </div>
                        <div className="text-right">
                            <p className="text-sm text-slate-600">Total Refund Amount</p>
                            <p className="text-2xl font-bold text-green-600">${totalAmount.toLocaleString()}</p>
                        </div>
                    </div>
                </CardHeader>
                <CardContent>
                    {loading ? (
                        <div className="text-center py-12">
                            <Loader2 className="h-12 w-12 animate-spin text-blue-600 mx-auto mb-4" />
                        </div>
                    ) : claims.length === 0 ? (
                        <div className="text-center py-12">
                            <CheckCircle className="w-16 h-16 text-green-600 mx-auto mb-4" />
                            <p className="text-slate-600">All claims processed</p>
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
                                            <div className="grid grid-cols-2 gap-4 text-sm text-slate-500">
                                                <div>
                                                    <p className="font-medium">Employee</p>
                                                    <p>{claim.employeeName}</p>
                                                </div>
                                                <div>
                                                    <p className="font-medium">Claim Type</p>
                                                    <p>{claim.claimType}</p>
                                                </div>
                                                <div>
                                                    <p className="font-medium">Manager Approved</p>
                                                    <p>{new Date(claim.managerReviewedAt || '').toLocaleDateString()}</p>
                                                </div>
                                                {claim.amount && (
                                                    <div>
                                                        <p className="font-medium">Refund Amount</p>
                                                        <p className="text-green-600 font-semibold text-base">
                                                            ${claim.amount.toLocaleString()}
                                                        </p>
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                        <div className="flex flex-col gap-2">
                                            <Link href={`/payroll/tracking/finance/claims/${claim._id}`}>
                                                <Button size="sm" variant="outline" className="w-full">
                                                    Review Details
                                                </Button>
                                            </Link>
                                            <Button
                                                size="sm"
                                                className="bg-green-600 hover:bg-green-700"
                                                onClick={() => handleQuickProcess(claim._id)}
                                            >
                                                <CheckCircle className="w-4 h-4 mr-1" />
                                                Process Refund
                                            </Button>
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
