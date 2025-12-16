'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Download, TrendingUp, TrendingDown, DollarSign, Loader2 } from 'lucide-react';
import { payrollTrackingApi, PayslipDto } from '@/services/api';
import Link from 'next/link';

export default function SalaryHistoryPage() {
    const [payslips, setPayslips] = useState<PayslipDto[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchSalaryHistory();
    }, []);

    const fetchSalaryHistory = async () => {
        try {
            const response = await payrollTrackingApi.getMyPayslips();
            setPayslips(response.data.sort((a: PayslipDto, b: PayslipDto) =>
                new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
            ));
        } catch (err) {
            const { MOCK_PAYSLIPS } = await import('@/lib/mockData');
            setPayslips(MOCK_PAYSLIPS as PayslipDto[]);
        } finally {
            setLoading(false);
        }
    };

    const totalEarnings = payslips.reduce((sum, p) => sum + p.totalGrossSalary, 0);
    const totalDeductions = payslips.reduce((sum, p) => sum + p.totalDeductions, 0);
    const totalNetPay = payslips.reduce((sum, p) => sum + p.netPay, 0);
    const avgNetPay = payslips.length > 0 ? totalNetPay / payslips.length : 0;

    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-3xl font-bold text-slate-900">Salary History</h1>
                <p className="text-slate-600 mt-1">Track your earnings over time</p>
            </div>

            {/* Summary Cards */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <Card>
                    <CardHeader className="pb-3">
                        <CardDescription>Total Earnings (YTD)</CardDescription>
                        <CardTitle className="text-2xl text-green-600">
                            ${totalEarnings.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                        </CardTitle>
                    </CardHeader>
                </Card>
                <Card>
                    <CardHeader className="pb-3">
                        <CardDescription>Total Deductions (YTD)</CardDescription>
                        <CardTitle className="text-2xl text-red-600">
                            ${totalDeductions.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                        </CardTitle>
                    </CardHeader>
                </Card>
                <Card>
                    <CardHeader className="pb-3">
                        <CardDescription>Net Pay (YTD)</CardDescription>
                        <CardTitle className="text-2xl text-blue-600">
                            ${totalNetPay.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                        </CardTitle>
                    </CardHeader>
                </Card>
                <Card>
                    <CardHeader className="pb-3">
                        <CardDescription>Average Net Pay</CardDescription>
                        <CardTitle className="text-2xl">
                            ${avgNetPay.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                        </CardTitle>
                    </CardHeader>
                </Card>
            </div>

            {/* Timeline View */}
            <Card>
                <CardHeader>
                    <CardTitle>Payment Timeline</CardTitle>
                    <CardDescription>Chronological view of all your payslips</CardDescription>
                </CardHeader>
                <CardContent>
                    {loading ? (
                        <div className="text-center py-12">
                            <Loader2 className="h-12 w-12 animate-spin text-blue-600 mx-auto mb-4" />
                        </div>
                    ) : (
                        <div className="space-y-4">
                            {payslips.map((slip, index) => {
                                const prevSlip = payslips[index + 1];
                                const change = prevSlip ? slip.netPay - prevSlip.netPay : 0;
                                const changePercent = prevSlip ? ((change / prevSlip.netPay) * 100).toFixed(1) : 0;

                                return (
                                    <div
                                        key={slip._id}
                                        className="border border-slate-200 rounded-lg p-4 hover:shadow-md transition-shadow"
                                    >
                                        <div className="flex items-center justify-between">
                                            <div className="flex-1">
                                                <div className="flex items-center gap-3">
                                                    <div className="w-2 h-2 bg-blue-600 rounded-full"></div>
                                                    <div>
                                                        <p className="font-semibold text-slate-900">
                                                            {new Date(slip.createdAt).toLocaleDateString('en-US', {
                                                                year: 'numeric',
                                                                month: 'long',
                                                            })}
                                                        </p>
                                                        <p className="text-sm text-slate-600 mt-1">
                                                            Gross: ${slip.totalGrossSalary.toLocaleString()} | Deductions: $
                                                            {slip.totalDeductions.toLocaleString()} | Net: $
                                                            {slip.netPay.toLocaleString()}
                                                        </p>
                                                    </div>
                                                </div>
                                            </div>
                                            <div className="flex items-center gap-4">
                                                {change !== 0 && (
                                                    <div
                                                        className={`flex items-center gap-1 text-sm ${change > 0 ? 'text-green-600' : 'text-red-600'
                                                            }`}
                                                    >
                                                        {change > 0 ? (
                                                            <TrendingUp className="w-4 h-4" />
                                                        ) : (
                                                            <TrendingDown className="w-4 h-4" />
                                                        )}
                                                        <span>{changePercent}%</span>
                                                    </div>
                                                )}
                                                <Link href={`/payroll/tracking/employee/payslips/${slip._id}`}>
                                                    <Button variant="outline" size="sm">
                                                        View Details
                                                    </Button>
                                                </Link>
                                            </div>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    )}
                </CardContent>
            </Card>
        </div>
    );
}
