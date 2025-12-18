'use client';

import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Download, FileText } from 'lucide-react';
import { financeStaffApi, ReportFiltersDto } from '@/services/api';
import { toast } from 'sonner';

export default function ComplianceReportsPage() {
    const [reportType, setReportType] = useState<'TAX' | 'INSURANCE' | 'BENEFITS'>('TAX');
    const [filters, setFilters] = useState<ReportFiltersDto>({
        departmentId: '',
        startDate: '',
        endDate: '',
    });
    const [loading, setLoading] = useState(false);

    const handleGenerateReport = async () => {
        if (!filters.startDate || !filters.endDate) {
            toast.error('Please select start and end dates');
            return;
        }

        setLoading(true);
        try {
            const response = await financeStaffApi.getComplianceReport(reportType, filters);
            toast.success('Compliance report generated successfully');
            // Handle download
        } catch (err) {
            toast.error('Failed to generate report');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-3xl font-bold text-slate-900">Compliance Reports</h1>
                <p className="text-slate-600 mt-1">Generate tax, insurance, and benefits compliance reports</p>
            </div>

            <Card>
                <CardHeader>
                    <CardTitle>Report Configuration</CardTitle>
                    <CardDescription>Select report type and parameters</CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                    <div className="space-y-2">
                        <Label>Report Type</Label>
                        <div className="grid grid-cols-3 gap-3">
                            <Button
                                variant={reportType === 'TAX' ? 'default' : 'outline'}
                                onClick={() => setReportType('TAX')}
                                className="w-full"
                            >
                                <FileText className="w-4 h-4 mr-2" />
                                Tax Compliance
                            </Button>
                            <Button
                                variant={reportType === 'INSURANCE' ? 'default' : 'outline'}
                                onClick={() => setReportType('INSURANCE')}
                                className="w-full"
                            >
                                <FileText className="w-4 h-4 mr-2" />
                                Insurance
                            </Button>
                            <Button
                                variant={reportType === 'BENEFITS' ? 'default' : 'outline'}
                                onClick={() => setReportType('BENEFITS')}
                                className="w-full"
                            >
                                <FileText className="w-4 h-4 mr-2" />
                                Benefits
                            </Button>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div className="space-y-2">
                            <Label>Department (Optional)</Label>
                            <Select
                                value={filters.departmentId}
                                onValueChange={(value) => setFilters({ ...filters, departmentId: value })}
                            >
                                <SelectTrigger>
                                    <SelectValue placeholder="All Departments" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="">All Departments</SelectItem>
                                    <SelectItem value="dept-001">Engineering</SelectItem>
                                    <SelectItem value="dept-002">Sales</SelectItem>
                                    <SelectItem value="dept-003">Marketing</SelectItem>
                                    <SelectItem value="dept-004">HR</SelectItem>
                                    <SelectItem value="dept-005">Finance</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>

                        <div className="space-y-2">
                            <Label>
                                Start Date <span className="text-red-600">*</span>
                            </Label>
                            <Input
                                type="date"
                                value={filters.startDate}
                                onChange={(e) => setFilters({ ...filters, startDate: e.target.value })}
                                required
                            />
                        </div>

                        <div className="space-y-2">
                            <Label>
                                End Date <span className="text-red-600">*</span>
                            </Label>
                            <Input
                                type="date"
                                value={filters.endDate}
                                onChange={(e) => setFilters({ ...filters, endDate: e.target.value })}
                                required
                            />
                        </div>
                    </div>

                    <Button onClick={handleGenerateReport} disabled={loading} className="w-full">
                        {loading ? 'Generating...' : 'Generate Report'}
                        <Download className="w-4 h-4 ml-2" />
                    </Button>
                </CardContent>
            </Card>

            <Card>
                <CardHeader>
                    <CardTitle>Report Types</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div>
                        <h3 className="font-semibold text-slate-900 mb-2">Tax Compliance Report</h3>
                        <p className="text-sm text-slate-600">
                            Detailed breakdown of all tax deductions per Egyptian Tax Law, including progressive tax
                            rates and total tax liability per employee and department.
                        </p>
                    </div>
                    <div>
                        <h3 className="font-semibold text-slate-900 mb-2">Insurance Compliance Report</h3>
                        <p className="text-sm text-slate-600">
                            Social and health insurance contributions showing employee and employer portions, ensuring
                            compliance with Egyptian social insurance regulations.
                        </p>
                    </div>
                    <div>
                        <h3 className="font-semibold text-slate-900 mb-2">Benefits Report</h3>
                        <p className="text-sm text-slate-600">
                            Summary of all employee benefits including allowances, bonuses, and other non-salary
                            compensation for regulatory reporting.
                        </p>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}
