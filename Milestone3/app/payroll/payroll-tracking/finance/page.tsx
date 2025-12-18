'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Loader2, DollarSign, FileText, BarChart3 } from 'lucide-react';
import { financeStaffApi, DisputeDto, ExpenseClaimDto } from '@/services/api';

export default function FinanceDashboard() {
    const [approvedDisputes, setApprovedDisputes] = useState<DisputeDto[]>([]);
    const [approvedClaims, setApprovedClaims] = useState<ExpenseClaimDto[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchApprovedItems();
    }, []);

    const fetchApprovedItems = async () => {
        try {
            const disputesRes = await financeStaffApi.getApprovedDisputes();
            const claimsRes = await financeStaffApi.getApprovedClaims();
            setApprovedDisputes(disputesRes.data.data || disputesRes.data || []);
            setApprovedClaims(claimsRes.data.data || claimsRes.data || []);
        } catch (err) {
            console.error('Failed to fetch finance data:', err);
            setApprovedDisputes([]);
            setApprovedClaims([]);
        } finally {
            setLoading(false);
        }
    };

    const totalDisputeAmount = approvedDisputes.reduce((sum, d) => sum + (d.amount || 0), 0);
    const totalClaimAmount = approvedClaims.reduce((sum, c) => sum + c.amount, 0);

    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-3xl font-bold text-slate-900">Finance Staff Dashboard</h1>
                <p className="text-slate-600 mt-1">Process approved refunds and generate compliance reports</p>
            </div>

            {/* Summary Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Card>
                    <CardHeader className="pb-3">
                        <div className="flex items-center justify-between">
                            <CardDescription>Pending Dispute Refunds</CardDescription>
                            <DollarSign className="w-5 h-5 text-blue-600" />
                        </div>
                        <CardTitle className="text-3xl text-blue-600">{approvedDisputes.length}</CardTitle>
                        <p className="text-sm text-slate-600 mt-2">
                            Total: ${totalDisputeAmount.toLocaleString()}
                        </p>
                    </CardHeader>
                    <CardContent>
                        <Link href="/payroll/payroll-tracking/finance/disputes">
                            <Button variant="outline" size="sm" className="w-full">
                                Process Disputes
                            </Button>
                        </Link>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader className="pb-3">
                        <div className="flex items-center justify-between">
                            <CardDescription>Pending Claim Refunds</CardDescription>
                            <DollarSign className="w-5 h-5 text-blue-600" />
                        </div>
                        <CardTitle className="text-3xl text-blue-600">{approvedClaims.length}</CardTitle>
                        <p className="text-sm text-slate-600 mt-2">
                            Total: ${totalClaimAmount.toLocaleString()}
                        </p>
                    </CardHeader>
                    <CardContent>
                        <Link href="/payroll/payroll-tracking/finance/claims">
                            <Button variant="outline" size="sm" className="w-full">
                                Process Claims
                            </Button>
                        </Link>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader className="pb-3">
                        <div className="flex items-center justify-between">
                            <CardDescription>Compliance Reports</CardDescription>
                            <BarChart3 className="w-5 h-5 text-green-600" />
                        </div>
                    </CardHeader>
                    <CardContent className="space-y-2">
                        <Link href="/payroll/payroll-tracking/finance/reports">
                            <Button variant="outline" size="sm" className="w-full">
                                View Reports
                            </Button>
                        </Link>
                    </CardContent>
                </Card>
            </div>

            {/* Recent Approved Disputes */}
            <Card>
                <CardHeader>
                    <CardTitle>Recent Approved Disputes</CardTitle>
                    <CardDescription>Manager-approved disputes awaiting refund processing</CardDescription>
                </CardHeader>
                <CardContent>
                    {loading ? (
                        <div className="text-center py-8">
                            <Loader2 className="h-8 w-8 animate-spin text-blue-600 mx-auto" />
                        </div>
                    ) : approvedDisputes.length === 0 ? (
                        <div className="text-center py-8 text-slate-600">
                            <FileText className="w-12 h-12 mx-auto mb-2 text-slate-300" />
                            <p>No disputes awaiting processing</p>
                        </div>
                    ) : (
                        <div className="space-y-3">
                            {approvedDisputes.slice(0, 5).map((dispute) => (
                                <Link
                                    key={dispute._id}
                                    href={`/payroll/payroll-tracking/finance/disputes/${dispute._id}`}
                                    className="block p-3 border border-slate-200 rounded-lg hover:shadow-md transition-shadow"
                                >
                                    <div className="flex items-start justify-between">
                                        <div>
                                            <p className="font-medium text-slate-900">{dispute.reason}</p>
                                            <p className="text-sm text-slate-600">{dispute.employeeName}</p>
                                            <p className="text-xs text-slate-500 mt-1">
                                                Approved: {new Date(dispute.managerReviewedAt || '').toLocaleDateString()}
                                            </p>
                                        </div>
                                        {dispute.amount && (
                                            <p className="font-semibold text-green-600">${dispute.amount.toLocaleString()}</p>
                                        )}
                                    </div>
                                </Link>
                            ))}
                        </div>
                    )}
                </CardContent>
            </Card>

            {/* Recent Approved Claims */}
            <Card>
                <CardHeader>
                    <CardTitle>Recent Approved Claims</CardTitle>
                    <CardDescription>Manager-approved claims awaiting refund processing</CardDescription>
                </CardHeader>
                <CardContent>
                    {loading ? (
                        <div className="text-center py-8">
                            <Loader2 className="h-8 w-8 animate-spin text-blue-600 mx-auto" />
                        </div>
                    ) : approvedClaims.length === 0 ? (
                        <div className="text-center py-8 text-slate-600">
                            <FileText className="w-12 h-12 mx-auto mb-2 text-slate-300" />
                            <p>No claims awaiting processing</p>
                        </div>
                    ) : (
                        <div className="space-y-3">
                            {approvedClaims.slice(0, 5).map((claim) => (
                                <Link
                                    key={claim._id}
                                    href={`/payroll/payroll-tracking/finance/claims/${claim._id}`}
                                    className="block p-3 border border-slate-200 rounded-lg hover:shadow-md transition-shadow"
                                >
                                    <div className="flex items-start justify-between">
                                        <div>
                                            <p className="font-medium text-slate-900">{claim.claimType}</p>
                                            <p className="text-sm text-slate-600">{claim.employeeName}</p>
                                            <p className="text-xs text-slate-500 mt-1">
                                                Approved: {new Date(claim.managerReviewedAt || '').toLocaleDateString()}
                                            </p>
                                        </div>
                                        <p className="font-semibold text-green-600">${claim.amount.toLocaleString()}</p>
                                    </div>
                                </Link>
                            ))}
                        </div>
                    )}
                </CardContent>
            </Card>
        </div>
    );
}
