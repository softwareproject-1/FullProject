'use client'

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Settings, PlayCircle, Download, DollarSign } from 'lucide-react';
import { payrollTrackingApi } from '@/services/api';

export default function PayrollTracking() {
    const pathname = usePathname();
    const router = useRouter();
    const [payslips, setPayslips] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        fetchPayslips();
    }, []);

    const fetchPayslips = async () => {
        try {
            setLoading(true);
            const response = await payrollTrackingApi.getMyPayslips();
            setPayslips(response.data);
        } catch (err: any) {
            console.error('Error fetching payslips:', err);
            // TEMPORARY: Use mock data for testing when auth fails
            if (err.response?.status === 401 || err.response?.status === 403) {
                console.log('Using mock data for testing...');
                const { MOCK_PAYSLIPS } = await import('@/lib/mockData');
                setPayslips(MOCK_PAYSLIPS);
                setError(null); // Clear error when using mock data
            } else {
                setError(err.response?.data?.message || 'Failed to load payslips');
            }
        } finally {
            setLoading(false);
        }
    };

    const formatPeriod = (createdAt: string) => {
        const date = new Date(createdAt);
        return date.toLocaleDateString('en-US', { year: 'numeric', month: 'long' });
    };

    const totalYTD = payslips.reduce((sum, slip) => sum + (slip.netPay || 0), 0);

    return (
        <div className="space-y-6">
            {/* Tab Navigation */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-slate-900 mb-2">Payroll Management</h1>
                    <p className="text-slate-600">Configure, process, and manage payroll</p>
                </div>

                <div className="flex gap-2">
                    <Link href="/payroll/configuration">
                        <button
                            className={`px-4 py-2 rounded-lg transition-colors ${pathname?.includes('/configuration')
                                ? 'bg-slate-900 text-white'
                                : 'bg-white text-slate-700 border border-slate-300 hover:bg-slate-50'
                                }`}
                        >
                            <Settings className="w-4 h-4 inline mr-2" />
                            Configuration
                        </button>
                    </Link>
                    <Link href="/payroll/execution">
                        <button
                            className={`px-4 py-2 rounded-lg transition-colors ${pathname?.includes('/execution')
                                ? 'bg-slate-900 text-white'
                                : 'bg-white text-slate-700 border border-slate-300 hover:bg-slate-50'
                                }`}
                        >
                            <PlayCircle className="w-4 h-4 inline mr-2" />
                            Run Payroll
                        </button>
                    </Link>
                    <Link href="/payroll/tracking">
                        <button
                            className={`px-4 py-2 rounded-lg transition-colors ${pathname?.includes('/tracking')
                                ? 'bg-slate-900 text-white'
                                : 'bg-white text-slate-700 border border-slate-300 hover:bg-slate-50'
                                }`}
                        >
                            Tracking
                        </button>
                    </Link>
                </div>
            </div>

            {/* Payslip List */}
            <Card>
                <CardHeader>
                    <div className="flex items-center justify-between">
                        <div>
                            <CardTitle>My Payslips</CardTitle>
                            <CardDescription>View and download your payslip history</CardDescription>
                        </div>
                        <div className="flex items-center gap-2">
                            <DollarSign className="w-5 h-5 text-green-600" />
                            <span className="text-slate-900 font-semibold">
                                Total YTD: ${totalYTD.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                            </span>
                        </div>
                    </div>
                </CardHeader>
                <CardContent>
                    {loading ? (
                        <div className="text-center py-8">
                            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
                            <p className="text-slate-600">Loading payslips...</p>
                        </div>
                    ) : error ? (
                        <div className="text-center py-8">
                            <p className="text-red-600 mb-4">{error}</p>
                            <Button onClick={fetchPayslips} variant="outline">
                                Retry
                            </Button>
                        </div>
                    ) : payslips.length === 0 ? (
                        <div className="text-center py-8">
                            <p className="text-slate-600">No payslips found</p>
                        </div>
                    ) : (
                        <div className="overflow-x-auto">
                            <table className="w-full">
                                <thead className="bg-slate-50 border-b border-slate-200">
                                    <tr>
                                        <th className="px-6 py-3 text-left text-slate-700">Period</th>
                                        <th className="px-6 py-3 text-left text-slate-700">Gross Salary</th>
                                        <th className="px-6 py-3 text-left text-slate-700">Deductions</th>
                                        <th className="px-6 py-3 text-left text-slate-700">Net Pay</th>
                                        <th className="px-6 py-3 text-left text-slate-700">Status</th>
                                        <th className="px-6 py-3 text-left text-slate-700">Actions</th>
                                    </tr>
                                </thead>
                                <tbody className="bg-white divide-y divide-slate-200">
                                    {payslips.map((slip) => (
                                        <tr key={slip._id} className="hover:bg-slate-50">
                                            <td className="px-6 py-4 text-slate-900">
                                                {formatPeriod(slip.createdAt)}
                                            </td>
                                            <td className="px-6 py-4 text-slate-900">
                                                ${slip.totalGrossSalary?.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                                            </td>
                                            <td className="px-6 py-4 text-red-600">
                                                -${slip.totalDeductions?.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                                            </td>
                                            <td className="px-6 py-4 text-green-600 font-semibold">
                                                ${slip.netPay?.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                                            </td>
                                            <td className="px-6 py-4">
                                                <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${slip.paymentStatus === 'PAID'
                                                    ? 'bg-green-100 text-green-800'
                                                    : slip.paymentStatus === 'PENDING'
                                                        ? 'bg-yellow-100 text-yellow-800'
                                                        : 'bg-red-100 text-red-800'
                                                    }`}>
                                                    {slip.paymentStatus}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4">
                                                <Button
                                                    onClick={() => {
                                                        const targetUrl = `/payroll/tracking/payslips/${slip._id}`;
                                                        console.log('🔍 DEBUG: View Details clicked');
                                                        console.log('🔍 DEBUG: Payslip ID:', slip._id);
                                                        console.log('🔍 DEBUG: Navigating to:', targetUrl);
                                                        router.push(targetUrl);
                                                    }}
                                                    variant="outline"
                                                    size="sm"
                                                    className="flex items-center gap-2"
                                                >
                                                    <Download className="w-4 h-4" />
                                                    View Details
                                                </Button>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}
                </CardContent>
            </Card>
        </div>
    );
}
