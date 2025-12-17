'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Download, DollarSign, FileText, AlertCircle, Loader2, Receipt, Flag } from 'lucide-react';
import { payrollTrackingApi, PayslipDto, ExpenseClaimDto, DisputeDto } from '@/services/api';
import StatusBadge from '@/components/payroll/StatusBadge';

export default function MyPayrollPage() {
    const [activeTab, setActiveTab] = useState('payslips');

    // Payslips state
    const [payslips, setPayslips] = useState<PayslipDto[]>([]);
    const [payslipsLoading, setPayslipsLoading] = useState(true);
    const [payslipsError, setPayslipsError] = useState<string | null>(null);

    // Claims state
    const [claims, setClaims] = useState<ExpenseClaimDto[]>([]);
    const [claimsLoading, setClaimsLoading] = useState(false);
    const [claimsError, setClaimsError] = useState<string | null>(null);

    // Disputes state
    const [disputes, setDisputes] = useState<DisputeDto[]>([]);
    const [disputesLoading, setDisputesLoading] = useState(false);
    const [disputesError, setDisputesError] = useState<string | null>(null);

    useEffect(() => {
        fetchPayslips();
    }, []);

    useEffect(() => {
        if (activeTab === 'claims' && claims.length === 0) {
            fetchClaims();
        } else if (activeTab === 'disputes' && disputes.length === 0) {
            fetchDisputes();
        }
    }, [activeTab]);

    const fetchPayslips = async () => {
        try {
            setPayslipsLoading(true);
            setPayslipsError(null);
            const response = await payrollTrackingApi.getMyPayslips();
            setPayslips(response.data.data || response.data || []);
        } catch (err: any) {
            console.error('Error fetching payslips:', err);
            setPayslipsError(err.response?.data?.message || 'Failed to load payslips');
            setPayslips([]);
        } finally {
            setPayslipsLoading(false);
        }
    };

    const fetchClaims = async () => {
        try {
            setClaimsLoading(true);
            setClaimsError(null);
            const response = await payrollTrackingApi.getMyClaims();
            setClaims(response.data.data || response.data || []);
        } catch (err: any) {
            console.error('Error fetching claims:', err);
            setClaimsError(err.response?.data?.message || 'Failed to load claims');
            setClaims([]);
        } finally {
            setClaimsLoading(false);
        }
    };

    const fetchDisputes = async () => {
        try {
            setDisputesLoading(true);
            setDisputesError(null);
            const response = await payrollTrackingApi.getMyDisputes();
            setDisputes(response.data.data || response.data || []);
        } catch (err: any) {
            console.error('Error fetching disputes:', err);
            setDisputesError(err.response?.data?.message || 'Failed to load disputes');
            setDisputes([]);
        } finally {
            setDisputesLoading(false);
        }
    };

    const formatPeriod = (createdAt: string) => {
        const date = new Date(createdAt);
        return date.toLocaleDateString('en-US', { year: 'numeric', month: 'long' });
    };

    const totalYTD = payslips.reduce((sum, slip) => sum + (slip.netPay || 0), 0);
    const pendingClaims = claims.filter(c => c.status === 'PENDING').length;
    const pendingDisputes = disputes.filter(d => d.status === 'PENDING').length;

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold text-slate-900">My Payroll</h1>
                    <p className="text-slate-600 mt-1">Manage your payslips, claims, and disputes</p>
                </div>
                <div className="flex gap-3">
                    <Link href="/payroll/payroll-tracking/employee/salary-history">
                        <Button variant="outline">
                            <FileText className="w-4 h-4 mr-2" />
                            Salary History
                        </Button>
                    </Link>
                    <Link href="/payroll/payroll-tracking/employee/documents">
                        <Button variant="outline">
                            <Download className="w-4 h-4 mr-2" />
                            Documents
                        </Button>
                    </Link>
                </div>
            </div>

            {/* Tabs */}
            <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
                <TabsList className="grid w-full max-w-md grid-cols-3">
                    <TabsTrigger value="payslips">
                        <FileText className="w-4 h-4 mr-2" />
                        Payslips
                    </TabsTrigger>
                    <TabsTrigger value="claims">
                        <Receipt className="w-4 h-4 mr-2" />
                        Claims
                    </TabsTrigger>
                    <TabsTrigger value="disputes">
                        <Flag className="w-4 h-4 mr-2" />
                        Disputes
                    </TabsTrigger>
                </TabsList>

                {/* Payslips Tab */}
                <TabsContent value="payslips" className="space-y-4 mt-6">
                    {/* Summary Cards */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <Card>
                            <CardHeader className="pb-3">
                                <CardDescription>Total Payslips</CardDescription>
                                <CardTitle className="text-2xl">{payslips.length}</CardTitle>
                            </CardHeader>
                        </Card>
                        <Card>
                            <CardHeader className="pb-3">
                                <CardDescription>Year-to-Date Earnings</CardDescription>
                                <CardTitle className="text-2xl text-green-600">
                                    ${totalYTD.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                                </CardTitle>
                            </CardHeader>
                        </Card>
                        <Card>
                            <CardHeader className="pb-3">
                                <CardDescription>Quick Actions</CardDescription>
                                <div className="flex flex-col gap-2 mt-2">
                                    <Link href="/payroll/payroll-tracking/employee/claims/create" className="w-full">
                                        <Button size="sm" variant="default" className="w-full">
                                            <DollarSign className="w-4 h-4 mr-2" />
                                            Submit Expense Claim
                                        </Button>
                                    </Link>
                                    <Link href="/payroll/payroll-tracking/employee/disputes/create" className="w-full">
                                        <Button size="sm" variant="outline" className="w-full">
                                            <AlertCircle className="w-4 h-4 mr-2" />
                                            Report Payroll Issue
                                        </Button>
                                    </Link>
                                </div>
                            </CardHeader>
                        </Card>
                    </div>

                    {/* Payslips List */}
                    <Card>
                        <CardHeader>
                            <CardTitle>Payslip History</CardTitle>
                            <CardDescription>View and download your payslips</CardDescription>
                        </CardHeader>
                        <CardContent>
                            {payslipsLoading ? (
                                <div className="text-center py-12">
                                    <Loader2 className="h-12 w-12 animate-spin text-blue-600 mx-auto mb-4" />
                                </div>
                            ) : payslipsError ? (
                                <div className="text-center py-12">
                                    <AlertCircle className="w-16 h-16 text-red-300 mx-auto mb-4" />
                                    <p className="text-red-600">{payslipsError}</p>
                                </div>
                            ) : payslips.length === 0 ? (
                                <div className="text-center py-12">
                                    <FileText className="w-16 h-16 text-slate-300 mx-auto mb-4" />
                                    <p className="text-slate-600">No payslips available yet</p>
                                </div>
                            ) : (
                                <div className="space-y-4">
                                    {payslips.map((payslip) => (
                                        <div key={payslip._id} className="border border-slate-200 rounded-lg p-4 hover:shadow-md transition-shadow">
                                            <div className="flex items-center justify-between">
                                                <div className="flex-1">
                                                    <div className="flex items-center gap-3 mb-2">
                                                        <h3 className="font-semibold text-slate-900">{formatPeriod(payslip.createdAt)}</h3>
                                                        <StatusBadge status={payslip.paymentStatus} />
                                                    </div>
                                                    <div className="flex items-center gap-4 text-sm text-slate-600">
                                                        <span>Gross: ${payslip.totalGrossSalary?.toLocaleString() || '0'}</span>
                                                        <span>Deductions: ${payslip.totalDeductions?.toLocaleString() || '0'}</span>
                                                        <span className="font-semibold text-green-600">Net: ${payslip.netPay?.toLocaleString() || '0'}</span>
                                                    </div>
                                                </div>
                                                <Link href={`/payroll/payroll-tracking/employee/payslips/${payslip._id}`}>
                                                    <Button variant="outline" size="sm">
                                                        <FileText className="w-4 h-4 mr-2" />
                                                        View Details
                                                    </Button>
                                                </Link>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </CardContent>
                    </Card>
                </TabsContent>

                {/* Claims Tab */}
                <TabsContent value="claims" className="space-y-4 mt-6">
                    {/* Summary Cards */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <Card>
                            <CardHeader className="pb-3">
                                <CardDescription>Total Claims</CardDescription>
                                <CardTitle className="text-2xl">{claims.length}</CardTitle>
                            </CardHeader>
                        </Card>
                        <Card>
                            <CardHeader className="pb-3">
                                <CardDescription>Pending Review</CardDescription>
                                <CardTitle className="text-2xl text-yellow-600">{pendingClaims}</CardTitle>
                            </CardHeader>
                        </Card>
                        <Card>
                            <CardHeader className="pb-3">
                                <CardDescription>Quick Actions</CardDescription>
                                <div className="mt-2">
                                    <Link href="/payroll/payroll-tracking/employee/claims/create" className="w-full">
                                        <Button size="sm" variant="default" className="w-full">
                                            <DollarSign className="w-4 h-4 mr-2" />
                                            Submit New Claim
                                        </Button>
                                    </Link>
                                </div>
                            </CardHeader>
                        </Card>
                    </div>

                    {/* Claims List */}
                    <Card>
                        <CardHeader>
                            <CardTitle>Expense Claims</CardTitle>
                            <CardDescription>Track your expense reimbursements</CardDescription>
                        </CardHeader>
                        <CardContent>
                            {claimsLoading ? (
                                <div className="text-center py-12">
                                    <Loader2 className="h-12 w-12 animate-spin text-blue-600 mx-auto mb-4" />
                                </div>
                            ) : claimsError ? (
                                <div className="text-center py-12">
                                    <AlertCircle className="w-16 h-16 text-red-300 mx-auto mb-4" />
                                    <p className="text-red-600">{claimsError}</p>
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
                                        <div key={claim._id} className="border border-slate-200 rounded-lg p-4 hover:shadow-md transition-shadow">
                                            <div className="flex items-start justify-between">
                                                <div className="flex-1">
                                                    <div className="flex items-center gap-3 mb-2">
                                                        <h3 className="font-semibold text-slate-900">{claim.category || claim.claimType || 'Expense Claim'}</h3>
                                                        <StatusBadge status={claim.status} />
                                                    </div>
                                                    <p className="text-sm text-slate-600 mb-2">{claim.description}</p>
                                                    <div className="flex items-center gap-4 text-sm text-slate-500">
                                                        <span>Submitted: {new Date(claim.createdAt).toLocaleDateString()}</span>
                                                        <span className="font-semibold text-green-600">Amount: ${claim.amount.toLocaleString()}</span>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </CardContent>
                    </Card>
                </TabsContent>

                {/* Disputes Tab */}
                <TabsContent value="disputes" className="space-y-4 mt-6">
                    {/* Summary Cards */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <Card>
                            <CardHeader className="pb-3">
                                <CardDescription>Total Disputes</CardDescription>
                                <CardTitle className="text-2xl">{disputes.length}</CardTitle>
                            </CardHeader>
                        </Card>
                        <Card>
                            <CardHeader className="pb-3">
                                <CardDescription>Under Investigation</CardDescription>
                                <CardTitle className="text-2xl text-orange-600">{pendingDisputes}</CardTitle>
                            </CardHeader>
                        </Card>
                        <Card>
                            <CardHeader className="pb-3">
                                <CardDescription>Quick Actions</CardDescription>
                                <div className="mt-2">
                                    <Link href="/payroll/payroll-tracking/employee/disputes/create" className="w-full">
                                        <Button size="sm" variant="default" className="w-full">
                                            <AlertCircle className="w-4 h-4 mr-2" />
                                            Report New Issue
                                        </Button>
                                    </Link>
                                </div>
                            </CardHeader>
                        </Card>
                    </div>

                    {/* Disputes List */}
                    <Card>
                        <CardHeader>
                            <CardTitle>Payroll Disputes</CardTitle>
                            <CardDescription>Track reported payroll issues</CardDescription>
                        </CardHeader>
                        <CardContent>
                            {disputesLoading ? (
                                <div className="text-center py-12">
                                    <Loader2 className="h-12 w-12 animate-spin text-blue-600 mx-auto mb-4" />
                                </div>
                            ) : disputesError ? (
                                <div className="text-center py-12">
                                    <AlertCircle className="w-16 h-16 text-red-300 mx-auto mb-4" />
                                    <p className="text-red-600">{disputesError}</p>
                                </div>
                            ) : disputes.length === 0 ? (
                                <div className="text-center py-12">
                                    <Flag className="w-16 h-16 text-slate-300 mx-auto mb-4" />
                                    <p className="text-slate-600 mb-4">No disputes reported</p>
                                    <Link href="/payroll/payroll-tracking/employee/disputes/create">
                                        <Button>Report an Issue</Button>
                                    </Link>
                                </div>
                            ) : (
                                <div className="space-y-4">
                                    {disputes.map((dispute) => (
                                        <div key={dispute._id} className="border border-slate-200 rounded-lg p-4 hover:shadow-md transition-shadow">
                                            <div className="flex items-start justify-between">
                                                <div className="flex-1">
                                                    <div className="flex items-center gap-3 mb-2">
                                                        <h3 className="font-semibold text-slate-900">{dispute.category || 'Payroll Dispute'}</h3>
                                                        <StatusBadge status={dispute.status} />
                                                    </div>
                                                    <p className="text-sm text-slate-600 mb-2">{dispute.description}</p>
                                                    <div className="flex items-center gap-4 text-sm text-slate-500">
                                                        <span>Reported: {new Date(dispute.createdAt).toLocaleDateString()}</span>
                                                        {dispute.refundAmount && (
                                                            <span className="font-semibold text-green-600">Refund: ${dispute.refundAmount.toLocaleString()}</span>
                                                        )}
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </CardContent>
                    </Card>
                </TabsContent>
            </Tabs>
        </div>
    );
}
