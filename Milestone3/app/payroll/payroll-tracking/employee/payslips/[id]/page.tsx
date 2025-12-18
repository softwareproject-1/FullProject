'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { payrollTrackingApi, PayslipDto, TimeImpactDataDto } from '@/services/api';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Loader2, ArrowLeft, Download, Printer } from 'lucide-react';
import TimeToPayWidget from '@/components/payroll/TimeToPayWidget';

export default function PayslipDetailPage() {
    const params = useParams();
    const router = useRouter();
    const payslipId = params.id as string;

    const [payslip, setPayslip] = useState<PayslipDto | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [downloading, setDownloading] = useState(false);
    const [timeImpactData, setTimeImpactData] = useState<TimeImpactDataDto | null>(null);
    const [timeLoading, setTimeLoading] = useState(false);

    useEffect(() => {
        const fetchPayslip = async () => {
            console.log('🔍 DEBUG: Payslip Detail Page Loading');
            console.log('🔍 DEBUG: Route: /payroll/tracking/payslips/[id]');
            console.log('🔍 DEBUG: Payslip ID from params:', payslipId);

            try {
                setLoading(true);
                console.log('🔍 DEBUG: Fetching payslip from API...');
                const response = await payrollTrackingApi.getPayslipById(payslipId);
                console.log('🔍 DEBUG: API response successful');
                setPayslip(response.data);
            } catch (err: any) {
                console.error('🔍 DEBUG: Error fetching payslip:', err);
                // Use mock data fallback on auth errors AND 404 (backend route not found)
                if (err.response?.status === 401 || err.response?.status === 403 || err.response?.status === 404) {
                    console.log('🔍 DEBUG: Using mock data fallback...');
                    const { MOCK_PAYSLIPS } = await import('@/lib/mockData');
                    const mockPayslip = MOCK_PAYSLIPS.find(p => p._id === payslipId);
                    if (mockPayslip) {
                        console.log('🔍 DEBUG: Mock payslip found:', mockPayslip._id);
                        setPayslip(mockPayslip as PayslipDto);
                        setError(null);
                    } else {
                        console.log('🔍 DEBUG: Mock payslip NOT found');
                        setError('Payslip not found');
                    }
                } else {
                    setError(err.response?.data?.message || 'Failed to load payslip');
                }
            } finally {
                setLoading(false);
                console.log('🔍 DEBUG: Page load complete');
            }
        };

        if (payslipId) {
            fetchPayslip();
        }
    }, [payslipId]);

    // Fetch time impact data
    useEffect(() => {
        const fetchTimeImpact = async () => {
            if (!payslip) return;

            try {
                setTimeLoading(true);
                const payslipDate = new Date(payslip.createdAt);
                const month = payslipDate.getMonth() + 1;
                const year = payslipDate.getFullYear();

                console.log('🕐 Fetching time impact data for:', { month, year });
                const response = await payrollTrackingApi.getTimeImpactData(month, year);
                console.log('🕐 Time impact response:', response);
                setTimeImpactData(response.data.data || response.data);
                console.log('🕐 Time impact data set:', response.data.data || response.data);
            } catch (error: any) {
                console.error('🕐 Error fetching time impact data:', error);
                console.error('🕐 Error details:', {
                    message: error.message,
                    status: error.response?.status,
                    statusText: error.response?.statusText,
                    data: error.response?.data,
                    url: error.config?.url
                });
                // API error - widget will not show
            } finally {
                setTimeLoading(false);
            }
        };

        if (payslip) {
            fetchTimeImpact();
        }
    }, [payslip]);

    const handleDownloadPDF = async () => {
        try {
            setDownloading(true);
            const response = await payrollTrackingApi.downloadPayslipPDF(payslipId);

            // Create blob and download
            const url = window.URL.createObjectURL(new Blob([response.data]));
            const link = document.createElement('a');
            link.href = url;
            const payPeriod = payslip?.createdAt ? new Date(payslip.createdAt).toLocaleDateString('en-US', { year: 'numeric', month: 'long' }).replace(' ', '-').toLowerCase() : payslipId.slice(-6);
            link.setAttribute('download', `payslip-${payPeriod}.pdf`);
            document.body.appendChild(link);
            link.click();
            link.parentNode?.removeChild(link);
            window.URL.revokeObjectURL(url);
        } catch (error) {
            console.error('Error downloading PDF:', error);
            alert('Failed to download PDF. Please try again.');
        } finally {
            setDownloading(false);
        }
    };

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


    // Extract data from mock data structure
    // Mock data has: earnings: { baseSalary, allowances[], bonuses[], benefits[], refunds[] }
    // Mock data has: deductions: { taxes[], insurance[], penalties: { penalties[] } }
    const baseSalary = payslip.earnings.baseSalary;
    const allowances = payslip.earnings.allowances || [];
    const bonuses = payslip.earnings.bonuses || [];
    const benefits = payslip.earnings.benefits || [];
    const refunds = payslip.earnings.refunds || [];

    const taxDeductions = payslip.deductions.taxes || [];
    const insuranceDeductions = payslip.deductions.insurance || [];
    const penalties = payslip.deductions.penalties?.penalties || [];

    // Calculate employer contributions from insurance
    const employerContributions = insuranceDeductions.map(ins => ({
        ...ins,
        employeeAmount: (baseSalary * ins.employeeRate) / 100,
        employerAmount: (baseSalary * ins.employerRate) / 100
    }));
    const totalEmployerContributions = employerContributions.reduce((sum, c) => sum + c.employerAmount, 0);

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
                            Period: {new Date(payslip.createdAt).toLocaleDateString('en-US', { year: 'numeric', month: 'long' })}
                        </p>
                    </div>
                </div>
                <div className="flex gap-2">
                    <Button
                        variant="outline"
                        size="sm"
                        onClick={handleDownloadPDF}
                        disabled={downloading}
                    >
                        {downloading ? (
                            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        ) : (
                            <Download className="w-4 h-4 mr-2" />
                        )}
                        {downloading ? 'Downloading...' : 'Download PDF'}
                    </Button>
                    <Button variant="outline" size="sm" onClick={() => window.print()}>
                        <Printer className="w-4 h-4 mr-2" />
                        Print
                    </Button>
                </div>
            </div>

            {/* Time-to-Pay Impact Widget */}
            <TimeToPayWidget data={timeImpactData} loading={timeLoading} />

            {/* Summary Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Card>
                    <CardHeader className="pb-3">
                        <CardDescription>Gross Salary</CardDescription>
                        <CardTitle className="text-2xl">
                            ${payslip.totalGrossSalary.toLocaleString('en-US', { minimumFractionDigits: 2 })}
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
                        </div>
                        <p className="font-semibold">${baseSalary.toLocaleString('en-US', { minimumFractionDigits: 2 })}</p>
                    </div>

                    {/* Refunds/Leave Compensation */}
                    {refunds.length > 0 && (
                        <div className="space-y-2">
                            <h3 className="font-semibold text-green-700">Leave Compensation & Refunds</h3>
                            {refunds.map((refund, idx) => (
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
                            {allowances.map((allowance, idx) => (
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
                            {bonuses.map((bonus, idx) => (
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
                            {benefits.map((benefit, idx) => (
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
                        <p className="text-green-600">${payslip.totalGrossSalary.toLocaleString('en-US', { minimumFractionDigits: 2 })}</p>
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
                            {taxDeductions.map((tax, idx) => {
                                const taxAmount = (baseSalary * tax.rate) / 100;
                                return (
                                    <div key={idx} className="flex justify-between items-center py-2 border-b">
                                        <div>
                                            <p className="font-medium">{tax.name}</p>
                                            <p className="text-sm text-gray-500">
                                                {tax.description} • {tax.rate}% rate
                                            </p>
                                        </div>
                                        <p className="font-semibold text-red-600">
                                            -${taxAmount.toLocaleString('en-US', { minimumFractionDigits: 2 })}
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
                            {insuranceDeductions.map((ins, idx) => {
                                const empAmount = (baseSalary * ins.employeeRate) / 100;
                                return (
                                    <div key={idx} className="border rounded-lg p-3 bg-blue-50">
                                        <div className="flex justify-between items-start mb-2">
                                            <div>
                                                <p className="font-medium">{ins.name}</p>
                                            </div>
                                            <p className="font-semibold text-red-600">
                                                -${empAmount.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                                            </p>
                                        </div>
                                        <div className="grid grid-cols-2 gap-2 text-sm">
                                            <div>
                                                <p className="text-gray-500">Employee Rate:</p>
                                                <p className="font-medium">{ins.employeeRate}%</p>
                                            </div>
                                            <div>
                                                <p className="text-gray-500">Employer Rate:</p>
                                                <p className="font-medium">{ins.employerRate}%</p>
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
                            {penalties.map((penalty, idx) => (
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
            {employerContributions.length > 0 && (
                <Card>
                    <CardHeader>
                        <CardTitle>Employer Contributions</CardTitle>
                        <CardDescription>Contributions made by your employer on your behalf</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-3">
                        {employerContributions.map((contrib, idx) => (
                            <div key={idx} className="flex justify-between items-center py-2 border-b">
                                <div>
                                    <p className="font-medium">{contrib.name}</p>
                                    <p className="text-sm text-gray-500">
                                        Employer pays {contrib.employerRate}% • Base: ${contrib.employeeAmount.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                                    </p>
                                </div>
                                <p className="font-semibold text-green-600">
                                    ${contrib.employerAmount.toLocaleString('en-US', { minimumFractionDigits: 2 })}
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
            )}

            {/* Payment Info */}
            <Card>
                <CardHeader>
                    <CardTitle>Payment Information</CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                    <div className="flex justify-between">
                        <span className="text-gray-600">Payment Status:</span>
                        <Badge variant={payslip.paymentStatus === 'PAID' ? 'default' : 'secondary'}>
                            {payslip.paymentStatus}
                        </Badge>
                    </div>
                    <div className="flex justify-between">
                        <span className="text-gray-600">Period:</span>
                        <span className="font-medium">
                            {new Date(payslip.createdAt).toLocaleDateString('en-US', { year: 'numeric', month: 'long' })}
                        </span>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}
