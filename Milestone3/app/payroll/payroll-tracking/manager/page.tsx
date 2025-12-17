'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Loader2, AlertTriangle, CheckCircle2 } from 'lucide-react';
import { payrollManagerApi, DisputeDto, ExpenseClaimDto } from '@/services/api';

export default function ManagerDashboard() {
    const [pendingDisputes, setPendingDisputes] = useState<DisputeDto[]>([]);
    const [pendingClaims, setPendingClaims] = useState<ExpenseClaimDto[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchPendingItems();
    }, []);

    const fetchPendingItems = async () => {
        try {
            const [disputesRes, claimsRes] = await Promise.all([
                payrollManagerApi.getSpecialistApprovedDisputes(),
                payrollManagerApi.getSpecialistApprovedClaims(),
            ]);
            setPendingDisputes(disputesRes.data.data || disputesRes.data);
            setPendingClaims(claimsRes.data.data || claimsRes.data);
        } catch (err) {
            console.error('Failed to fetch pending items:', err);
            // For now, set empty arrays on error
            setPendingDisputes([]);
            setPendingClaims([]);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-3xl font-bold text-slate-900">Payroll Manager Dashboard</h1>
                <p className="text-slate-600 mt-1">Review specialist-approved items for final confirmation</p>
            </div>

            {/* Summary Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Card>
                    <CardHeader className="pb-3">
                        <div className="flex items-center justify-between">
                            <CardDescription>Pending Dispute Confirmations</CardDescription>
                            <AlertTriangle className="w-5 h-5 text-yellow-600" />
                        </div>
                        <CardTitle className="text-3xl text-yellow-600">{pendingDisputes.length}</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <p className="text-sm text-slate-600 mb-3">
                            Disputes approved by specialist awaiting your final confirmation
                        </p>
                        <Link href="/payroll/payroll-tracking/manager/disputes">
                            <Button variant="outline" size="sm" className="w-full">
                                Review Disputes
                            </Button>
                        </Link>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader className="pb-3">
                        <div className="flex items-center justify-between">
                            <CardDescription>Pending Claim Confirmations</CardDescription>
                            <AlertTriangle className="w-5 h-5 text-yellow-600" />
                        </div>
                        <CardTitle className="text-3xl text-yellow-600">{pendingClaims.length}</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <p className="text-sm text-slate-600 mb-3">
                            Claims approved by specialist awaiting your final confirmation
                        </p>
                        <Link href="/payroll/payroll-tracking/manager/claims">
                            <Button variant="outline" size="sm" className="w-full">
                                Review Claims
                            </Button>
                        </Link>
                    </CardContent>
                </Card>
            </div>

            {/* Pending Disputes */}
            <Card>
                <CardHeader>
                    <CardTitle>Recent Specialist-Approved Disputes</CardTitle>
                    <CardDescription>Your final approval is required</CardDescription>
                </CardHeader>
                <CardContent>
                    {loading ? (
                        <div className="text-center py-8">
                            <Loader2 className="h-8 w-8 animate-spin text-blue-600 mx-auto" />
                        </div>
                    ) : pendingDisputes.length === 0 ? (
                        <div className="text-center py-8 text-slate-600">
                            <CheckCircle2 className="w-12 h-12 mx-auto mb-2 text-green-600" />
                            <p>No disputes awaiting confirmation</p>
                        </div>
                    ) : (
                        <div className="space-y-3">
                            {pendingDisputes.slice(0, 5).map((dispute) => (
                                <Link
                                    key={dispute._id}
                                    href={`/payroll/payroll-tracking/manager/disputes/${dispute._id}`}
                                    className="block p-3 border border-slate-200 rounded-lg hover:shadow-md transition-shadow"
                                >
                                    <div className="flex items-start justify-between">
                                        <div className="flex-1">
                                            <p className="font-medium text-slate-900">{dispute.reason}</p>
                                            <p className="text-sm text-slate-600">{dispute.employeeName}</p>
                                            {dispute.specialistComments && (
                                                <p className="text-xs text-blue-600 mt-1">
                                                    Specialist: {dispute.specialistComments.substring(0, 60)}...
                                                </p>
                                            )}
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

            {/* Pending Claims */}
            <Card>
                <CardHeader>
                    <CardTitle>Recent Specialist-Approved Claims</CardTitle>
                    <CardDescription>Your final approval is required</CardDescription>
                </CardHeader>
                <CardContent>
                    {loading ? (
                        <div className="text-center py-8">
                            <Loader2 className="h-8 w-8 animate-spin text-blue-600 mx-auto" />
                        </div>
                    ) : pendingClaims.length === 0 ? (
                        <div className="text-center py-8 text-slate-600">
                            <CheckCircle2 className="w-12 h-12 mx-auto mb-2 text-green-600" />
                            <p>No claims awaiting confirmation</p>
                        </div>
                    ) : (
                        <div className="space-y-3">
                            {pendingClaims.slice(0, 5).map((claim) => (
                                <Link
                                    key={claim._id}
                                    href={`/payroll/payroll-tracking/manager/claims/${claim._id}`}
                                    className="block p-3 border border-slate-200 rounded-lg hover:shadow-md transition-shadow"
                                >
                                    <div className="flex items-start justify-between">
                                        <div>
                                            <p className="font-medium text-slate-900">{claim.claimType}</p>
                                            <p className="text-sm text-slate-600">{claim.employeeName}</p>
                                            {claim.specialistComments && (
                                                <p className="text-xs text-blue-600 mt-1">
                                                    Specialist: {claim.specialistComments.substring(0, 60)}...
                                                </p>
                                            )}
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
