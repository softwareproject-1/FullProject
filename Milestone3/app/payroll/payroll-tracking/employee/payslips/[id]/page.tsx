'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { payrollTrackingApi, PayslipDto, TimeImpactDataDto, EnhancedPayslipDataDto } from '@/services/api';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Loader2, ArrowLeft, Download, Printer } from 'lucide-react';
import TimeToPayWidget from '@/components/payroll/TimeToPayWidget';
import EnhancedPayslipWidget from '@/components/payroll/EnhancedPayslipWidget';

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
    const [enhancedData, setEnhancedData] = useState<EnhancedPayslipDataDto | null>(null);
    const [enhancedLoading, setEnhancedLoading] = useState(false);

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
                setPayslip(response.data.data || response.data);
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

    // Fetch enhanced payslip data
    useEffect(() => {
        const fetchEnhancedPayslip = async () => {
            if (!payslip) return;

            try {
                setEnhancedLoading(true);
                console.log('💰 Fetching enhanced payslip data for:', payslipId);
                const response = await payrollTrackingApi.getEnhancedPayslip(payslipId);
                console.log('💰 Enhanced payslip response:', response);
                setEnhancedData(response.data.data || response.data);
                console.log('💰 Enhanced data set successfully');
            } catch (error: any) {
                console.error('💰 Error fetching enhanced payslip:', error);
                // Enhanced data not available - widget won't show
            } finally {
                setEnhancedLoading(false);
            }
        };

        if (payslip) {
            fetchEnhancedPayslip();
        }
    }, [payslip, payslipId]);

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


    // Helper to safely calculate totals
    const earningsTotal = (payslip.baseSalary || 0) +
        (payslip.overtime || 0) +
        (payslip.allowances || 0) +
        (payslip.bonuses || 0) +
        (payslip.leaveEncashment || 0) +
        (payslip.transportAllowance || 0);

    const deductionsBreakdown = [
        { label: 'Tax', amount: payslip.taxDeductions || 0 },
        { label: 'Insurance', amount: payslip.insuranceDeductions || 0 },
        { label: 'Misconduct Penalties', amount: payslip.misconductDeductions || 0 },
        { label: 'Unpaid Leave', amount: payslip.unpaidLeaveDeductions || 0 },
    ];

    const totalEmployerContributions =
        (payslip.employerContributions?.insurance || 0) +
        (payslip.employerContributions?.pension || 0) +
        (payslip.employerContributions?.socialSecurity || 0);

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
                            Payslip ID: <span className="font-mono font-semibold text-slate-900">{payslipId}</span>
                        </p>
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

                </div>
            </div>

            {/* Time-to-Pay Impact Widget */}
            <TimeToPayWidget data={timeImpactData} loading={timeLoading} />

            {/* Enhanced Payslip Widget (Itemized Configuration Data) */}
            {enhancedData && !enhancedLoading && (
                <EnhancedPayslipWidget data={enhancedData} />
            )}

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

            {/* Enhanced PayslipWidget above provides itemized breakdowns */}
            {/* If enhanced data isn't available, users can still see summary cards above */}

            {/* Report Error Section */}
            <Card>
                <CardHeader>
                    <CardTitle>Report an Issue</CardTitle>
                    <CardDescription>
                        If you notice any discrepancies in your payslip, you can submit a dispute for review
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <Button
                        variant="outline"
                        className="w-full"
                        onClick={() => router.push(`/payroll/payroll-tracking/employee/disputes/create?payslipId=${payslipId}`)}
                    >
                        Submit a Dispute
                    </Button>
                </CardContent>
            </Card>
        </div>
    );
}
