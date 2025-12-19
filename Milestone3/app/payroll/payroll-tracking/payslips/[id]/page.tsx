'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { payrollTrackingApi, EnhancedPayslipDataDto } from '@/services/api';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Loader2, ArrowLeft, Download, Printer } from 'lucide-react';

export default function PayslipDetailPage() {
    const params = useParams();
    const router = useRouter();
    const payslipId = params.id as string;

    const [payslip, setPayslip] = useState<EnhancedPayslipDataDto | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        const fetchPayslip = async () => {
            console.log('🔍 DEBUG: Payslip Detail Page Loading');
            console.log('🔍 DEBUG: Route: /payroll/tracking/payslips/[id]');
            console.log('🔍 DEBUG: Payslip ID from params:', payslipId);

            try {
                setLoading(true);
                console.log('🔍 DEBUG: Fetching enhanced payslip from API...');
                const response = await payrollTrackingApi.getEnhancedPayslip(payslipId);
                console.log('🔍 DEBUG: API response successful');
                setPayslip(response.data.data);
            } catch (err: any) {
                console.error('🔍 DEBUG: Error fetching payslip:', err);
                // Note: Enhanced payslip requires real backend, fallback not available
                console.error('🔍 DEBUG: Error details:', err);
                setError(err.response?.data?.message || 'Failed to load payslip details');

            } finally {
                setLoading(false);
                console.log('🔍 DEBUG: Page load complete');
            }
        };

        if (payslipId) {
            fetchPayslip();
        }
    }, [payslipId]);

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-screen">
                <div className="text-center">
                    <Loader2 className="h-12 w-12 animate-spin text-blue-600 mx-auto mb-4" />
                    <p className="text-gray-600">Loading payslip details...</p>
                </div>
            </div>
        );
    }

    if (error || !payslip) {
        return (
            <div className="flex items-center justify-center min-h-screen">
                <Card className="max-w-md">
                    <CardHeader>
                        <CardTitle className="text-red-600">Error</CardTitle>
                        <CardDescription>{error || 'Payslip not found'}</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <Button onClick={() => router.back()} variant="outline">
                            <ArrowLeft className="w-4 h-4 mr-2" />
                            Go Back
                        </Button>
                    </CardContent>
                </Card>
            </div>
        );
    }


    // Extract data from enhanced payslip structure
    const baseSalary = payslip.baseSalary;
    const allowances = payslip.allowances || [];
    const bonuses: any[] = []; // Enhanced payslip doesn't have bonuses array currently
    const benefits: any[] = []; // Enhanced payslip doesn't have benefits array currently
    const refunds: any[] = []; // Enhanced payslip doesn't have refunds array currently

    const taxDeductions = payslip.taxDeductions || [];
    const insuranceDeductions = payslip.insuranceDeductions || [];
    const penalties: any[] = []; // Penalties are handled via timeBasedPenalties number

    // Employer contributions are already calculated in enhanced payslip
    const employerContributions = payslip.employerContributions || [];
    const totalEmployerContributions = payslip.totalEmployerContributions || 0;

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                    <Button variant="outline" size="sm" onClick={() => router.back()}>
                        <ArrowLeft className="w-4 h-4 mr-2" />
                        Back
                    </Button>
                    <div>
                        <h1 className="text-2xl font-bold text-slate-900">Payslip Details</h1>
                        <p className="text-sm text-slate-600">
                            Period: {payslip.month} {payslip.year}
                        </p>
                    </div>
                </div>
                <div className="flex gap-2">
                    <Button variant="outline" size="sm">
                        <Download className="w-4 h-4 mr-2" />
                        Download PDF
                    </Button>
                    <Button variant="outline" size="sm">
                        <Printer className="w-4 h-4 mr-2" />
                        Print
                    </Button>
                </div>
            </div>

            {/* Summary Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Card>
                    <CardHeader className="pb-3">
                        <CardDescription>Gross Salary</CardDescription>
                        <CardTitle className="text-2xl">
                            ${payslip.grossPay.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                        </CardTitle>
                    </CardHeader>
                </Card>
                <Card>
                    <CardHeader className="pb-3">
                        <CardDescription>Total Deductions</CardDescription>
                        <CardTitle className="text-2xl text-red-600">
                            -${payslip.totalDeductions.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                        </CardTitle>
                    </CardHeader>
                </Card>
                <Card className="border-2 border-blue-600">
                    <CardHeader className="pb-3">
                        <CardDescription>Net Pay</CardDescription>
                        <CardTitle className="text-2xl text-blue-600">
                            ${payslip.netPay.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                        </CardTitle>
                    </CardHeader>
                </Card>
            </div>

            {/* Earnings Section */}
            <Card>
                <CardHeader>
                    <CardTitle>Earnings Breakdown</CardTitle>
                    <CardDescription>Detailed view of all earnings for this period</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                    {/* Base Salary */}
                    <div className="flex justify-between items-center py-2 border-b">
                        <div>
                            <p className="font-medium">Base Salary</p>
                            <p className="text-sm text-gray-500">Monthly base compensation</p>
                            {payslip.contractType && (
                                <p className="text-xs text-gray-500 mt-0.5">
                                    Contract: {payslip.contractType}
                                </p>
                            )}
                        </div>
                        <p className="font-semibold">${baseSalary.toLocaleString('en-US', { minimumFractionDigits: 2 })}</p>
                    </div>

                    {/* Refunds/Leave Compensation */}
                    {refunds.length > 0 && (
                        <div className="space-y-2">
                            <h3 className="font-semibold text-green-700">Leave Compensation & Refunds</h3>
                            {refunds.map((refund: any, idx: number) => (
                                <div key={idx} className="flex justify-between items-center py-2 bg-green-50 px-3 rounded">
                                    <div>
                                        <p className="font-medium text-green-800">{refund.description}</p>
                                    </div>
                                    <p className="font-semibold text-green-700">
                                        ${refund.amount.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                                    </p>
                                </div>
                            ))}
                        </div>
                    )}

                    {/* Allowances */}
                    {allowances.length > 0 && (
                        <div className="space-y-2">
                            <h3 className="font-semibold">Allowances</h3>
                            {allowances.map((allowance: any, idx: number) => (
                                <div key={idx} className="flex justify-between items-center py-2">
                                    <div>
                                        <p className="font-medium">{allowance.name}</p>
                                    </div>
                                    <p className="font-semibold">${allowance.amount.toLocaleString('en-US', { minimumFractionDigits: 2 })}</p>
                                </div>
                            ))}
                        </div>
                    )}

                    {/* Bonuses */}
                    {bonuses.length > 0 && (
                        <div className="space-y-2">
                            <h3 className="font-semibold">Bonuses</h3>
                            {bonuses.map((bonus: any, idx: number) => (
                                <div key={idx} className="flex justify-between items-center py-2">
                                    <div>
                                        <p className="font-medium">{bonus.name}</p>
                                    </div>
                                    <p className="font-semibold">${bonus.amount.toLocaleString('en-US', { minimumFractionDigits: 2 })}</p>
                                </div>
                            ))}
                        </div>
                    )}

                    {/* Benefits */}
                    {benefits.length > 0 && (
                        <div className="space-y-2">
                            <h3 className="font-semibold">Benefits</h3>
                            {benefits.map((benefit: any, idx: number) => (
                                <div key={idx} className="flex justify-between items-center py-2">
                                    <div>
                                        <p className="font-medium">{benefit.name}</p>
                                    </div>
                                    <p className="font-semibold">${benefit.amount.toLocaleString('en-US', { minimumFractionDigits: 2 })}</p>
                                </div>
                            ))}
                        </div>
                    )}

                    {/* Total Earnings */}
                    <div className="flex justify-between items-center py-3 border-t-2 border-slate-300 font-bold text-lg">
                        <p>Total Earnings</p>
                        <p className="text-green-600">${payslip.grossPay.toLocaleString('en-US', { minimumFractionDigits: 2 })}</p>
                    </div>
                </CardContent>
            </Card>

            {/* Deductions Section */}
            <Card>
                <CardHeader>
                    <CardTitle>Deductions Breakdown</CardTitle>
                    <CardDescription>Detailed view of all deductions for this period</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                    {/* Tax Deductions - With Legal References */}
                    {taxDeductions.length > 0 && (
                        <div className="space-y-2">
                            <h3 className="font-semibold">Tax Deductions</h3>
                            {taxDeductions.map((tax: any, idx: number) => {
                                return (
                                    <div key={idx} className="flex justify-between items-center py-2 border-b">
                                        <div>
                                            <p className="font-medium">{tax.name}</p>
                                            <p className="text-sm text-gray-500">
                                                {tax.lawReference}
                                            </p>
                                        </div>
                                        <p className="font-semibold text-red-600">
                                            -${tax.amount.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                                        </p>
                                    </div>
                                );
                            })}
                        </div>
                    )}

                    {/* Insurance Deductions - With Rates */}
                    {insuranceDeductions.length > 0 && (
                        <div className="space-y-2">
                            <h3 className="font-semibold">Insurance Deductions</h3>
                            {insuranceDeductions.map((ins: any, idx: number) => {
                                return (
                                    <div key={idx} className="border rounded-lg p-3 bg-blue-50">
                                        <div className="flex justify-between items-start mb-2">
                                            <div>
                                                <p className="font-medium">{ins.name}</p>
                                            </div>
                                            <p className="font-semibold text-red-600">
                                                -${ins.employeeContribution.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                                            </p>
                                        </div>
                                        <div className="grid grid-cols-2 gap-2 text-sm">
                                            <div>
                                                <p className="text-gray-500">Employee Contribution:</p>
                                                <p className="font-medium">${ins.employeeContribution.toLocaleString('en-US', { minimumFractionDigits: 2 })}</p>
                                            </div>
                                            <div>
                                                <p className="text-gray-500">Employer Contribution:</p>
                                                <p className="font-medium">${ins.employerContribution.toLocaleString('en-US', { minimumFractionDigits: 2 })}</p>
                                            </div>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    )}

                    {/* Penalties */}
                    {penalties.length > 0 && (
                        <div className="space-y-2">
                            <h3 className="font-semibold text-red-700">Penalties</h3>
                            {penalties.map((penalty: any, idx: number) => (
                                <div key={idx} className="flex justify-between items-center py-2 bg-red-50 px-3 rounded border border-red-200">
                                    <div>
                                        <p className="font-medium text-red-800">{penalty.reason}</p>
                                    </div>
                                    <p className="font-semibold text-red-700">
                                        -${penalty.amount.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                                    </p>
                                </div>
                            ))}
                        </div>
                    )}

                    {/* Total Deductions */}
                    <div className="flex justify-between items-center py-3 border-t-2 border-slate-300 font-bold text-lg">
                        <p>Total Deductions</p>
                        <p className="text-red-600">-${payslip.totalDeductions.toLocaleString('en-US', { minimumFractionDigits: 2 })}</p>
                    </div>

                    {/* Net Pay */}
                    <div className="flex justify-between items-center py-4 bg-blue-50 px-4 rounded-lg border-2 border-blue-600">
                        <p className="text-xl font-bold">Net Pay</p>
                        <p className="text-2xl font-bold text-blue-600">
                            ${payslip.netPay.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                        </p>
                    </div>
                </CardContent>
            </Card>

            {/* Employer Contributions Section */}
            {
                employerContributions.length > 0 && (
                    <Card>
                        <CardHeader>
                            <CardTitle>Employer Contributions</CardTitle>
                            <CardDescription>Contributions made by your employer on your behalf</CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-3">
                            {employerContributions.map((contrib: any, idx: number) => (
                                <div key={idx} className="flex justify-between items-center py-2 border-b">
                                    <div>
                                        <p className="font-medium">{contrib.name}</p>
                                        <p className="text-sm text-gray-500">
                                            Total contribution
                                        </p>
                                    </div>
                                    <p className="font-semibold text-green-600">
                                        ${contrib.employerContribution.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                                    </p>
                                </div>
                            ))}
                            <div className="flex justify-between items-center py-3 border-t-2 font-bold text-lg">
                                <p>Total Employer Contributions</p>
                                <p className="text-green-600">
                                    ${totalEmployerContributions.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                                </p>
                            </div>
                        </CardContent>
                    </Card>
                )
            }

            {/* Payment Info */}
            <Card>
                <CardHeader>
                    <CardTitle>Payment Information</CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                    <div className="flex justify-between">
                        <span className="text-gray-600">Pay Grade:</span>
                        <span className="font-medium">{payslip.payGrade || 'N/A'}</span>
                    </div>
                    <div className="flex justify-between">
                        <span className="text-gray-600">Period:</span>
                        <span className="font-medium">
                            {payslip.month} {payslip.year}
                        </span>
                    </div>
                </CardContent>
            </Card>
        </div >
    );
}
