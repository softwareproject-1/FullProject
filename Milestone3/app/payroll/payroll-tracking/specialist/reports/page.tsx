'use client';

import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Download, BarChart2, FileText, AlertCircle, DollarSign } from 'lucide-react';
import { payrollSpecialistApi, ReportFiltersDto } from '@/services/api';
import { toast } from 'sonner';

interface ReportData {
    reportType: string;
    department: string;
    period: {
        startDate: string;
        endDate: string;
    };
    metrics: {
        totalClaims: number;
        totalDisputes: number;
        pendingRefundsCount: number;
        totalPendingRefundsValue: number;
    };
    generatedAt: string;
}

export default function SpecialistReportsPage() {
    const [filters, setFilters] = useState<ReportFiltersDto>({
        departmentId: '',
        startDate: '',
        endDate: '',
    });
    const [loading, setLoading] = useState(false);
    const [reportData, setReportData] = useState<ReportData | null>(null);

    const handleGenerateReport = async () => {
        if (!filters.startDate || !filters.endDate) {
            toast.error('Please select both start and end dates');
            return;
        }

        setLoading(true);
        try {
            const response = await payrollSpecialistApi.getDepartmentReport(filters);
            setReportData(response.data.data || response.data);
            toast.success('Report generated successfully');
        } catch (err) {
            console.error('Report generation error:', err);
            toast.error('Failed to generate report');
        } finally {
            setLoading(false);
        }
    };

    const formatCurrency = (amount: number) => {
        return new Intl.NumberFormat('en-EG', {
            style: 'currency',
            currency: 'EGP',
        }).format(amount);
    };

    const formatDate = (dateString: string) => {
        return new Date(dateString).toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'long',
            day: 'numeric'
        });
    };

    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-3xl font-bold text-slate-900">Department Reports</h1>
                <p className="text-slate-600 mt-1">Generate payroll reports by department</p>
            </div>

            <Card>
                <CardHeader>
                    <CardTitle>Report Filters</CardTitle>
                    <CardDescription>Select department and date range for the report</CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div className="space-y-2">
                            <Label>Department</Label>
                            <Select
                                value={filters.departmentId}
                                onValueChange={(value) => setFilters({ ...filters, departmentId: value })}
                            >
                                <SelectTrigger>
                                    <SelectValue placeholder="All Departments" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="all">All Departments</SelectItem>
                                    <SelectItem value="Engineering">Engineering</SelectItem>
                                    <SelectItem value="Sales">Sales</SelectItem>
                                    <SelectItem value="Marketing">Marketing</SelectItem>
                                    <SelectItem value="HR">HR</SelectItem>
                                    <SelectItem value="Finance">Finance</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>

                        <div className="space-y-2">
                            <Label>Start Date</Label>
                            <Input
                                type="date"
                                value={filters.startDate}
                                onChange={(e) => setFilters({ ...filters, startDate: e.target.value })}
                            />
                        </div>

                        <div className="space-y-2">
                            <Label>End Date</Label>
                            <Input
                                type="date"
                                value={filters.endDate}
                                onChange={(e) => setFilters({ ...filters, endDate: e.target.value })}
                            />
                        </div>
                    </div>

                    <Button onClick={handleGenerateReport} disabled={loading} className="w-full">
                        {loading ? 'Generating...' : 'Generate Report'}
                        <BarChart2 className="w-4 h-4 ml-2" />
                    </Button>
                </CardContent>
            </Card>

            {reportData && (
                <div className="space-y-4">
                    <Card>
                        <CardHeader>
                            <CardTitle>Report Summary</CardTitle>
                            <CardDescription>
                                {reportData.department} • {formatDate(reportData.period.startDate)} - {formatDate(reportData.period.endDate)}
                            </CardDescription>
                        </CardHeader>
                        <CardContent>
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                                <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
                                    <div className="flex items-center justify-between mb-2">
                                        <span className="text-sm font-medium text-blue-900">Total Claims</span>
                                        <FileText className="w-5 h-5 text-blue-600" />
                                    </div>
                                    <p className="text-3xl font-bold text-blue-900">{reportData.metrics.totalClaims}</p>
                                </div>

                                <div className="p-4 bg-yellow-50 rounded-lg border border-yellow-200">
                                    <div className="flex items-center justify-between mb-2">
                                        <span className="text-sm font-medium text-yellow-900">Total Disputes</span>
                                        <AlertCircle className="w-5 h-5 text-yellow-600" />
                                    </div>
                                    <p className="text-3xl font-bold text-yellow-900">{reportData.metrics.totalDisputes}</p>
                                </div>

                                <div className="p-4 bg-purple-50 rounded-lg border border-purple-200">
                                    <div className="flex items-center justify-between mb-2">
                                        <span className="text-sm font-medium text-purple-900">Pending Refunds</span>
                                        <DollarSign className="w-5 h-5 text-purple-600" />
                                    </div>
                                    <p className="text-3xl font-bold text-purple-900">{reportData.metrics.pendingRefundsCount}</p>
                                </div>

                                <div className="p-4 bg-green-50 rounded-lg border border-green-200">
                                    <div className="flex items-center justify-between mb-2">
                                        <span className="text-sm font-medium text-green-900">Refunds Value</span>
                                        <DollarSign className="w-5 h-5 text-green-600" />
                                    </div>
                                    <p className="text-2xl font-bold text-green-900">
                                        {formatCurrency(reportData.metrics.totalPendingRefundsValue)}
                                    </p>
                                </div>
                            </div>

                            <div className="mt-4 pt-4 border-t">
                                <p className="text-xs text-slate-500">
                                    Report generated on {formatDate(reportData.generatedAt)}
                                </p>
                            </div>
                        </CardContent>
                    </Card>
                </div>
            )}

            <Card>
                <CardHeader>
                    <CardTitle>Report Information</CardTitle>
                </CardHeader>
                <CardContent>
                    <p className="text-sm text-slate-600 mb-4">
                        Department reports provide a comprehensive breakdown of payroll tracking metrics, including:
                    </p>
                    <ul className="list-disc list-inside space-y-1 text-sm text-slate-600">
                        <li>Total expense claims submitted during the period</li>
                        <li>Total payroll disputes raised by employees</li>
                        <li>Number of pending refunds awaiting processing</li>
                        <li>Total value of pending refunds in EGP</li>
                        <li>Department-specific or organization-wide view</li>
                    </ul>
                </CardContent>
            </Card>
        </div>
    );
}
