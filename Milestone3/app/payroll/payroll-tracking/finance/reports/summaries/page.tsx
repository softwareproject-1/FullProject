'use client';

import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Download, FileSpreadsheet } from 'lucide-react';
import { financeStaffApi } from '@/services/api';
import { toast } from 'sonner';

export default function SummaryReportsPage() {
    const [reportType, setReportType] = useState<'month' | 'year'>('month');
    const [month, setMonth] = useState(new Date().getMonth() + 1);
    const [year, setYear] = useState(new Date().getFullYear());
    const [loading, setLoading] = useState(false);

    const handleGenerateReport = async () => {
        setLoading(true);
        try {
            if (reportType === 'month') {
                await financeStaffApi.getMonthEndSummary(month, year);
            } else {
                await financeStaffApi.getYearEndSummary(year);
            }
            toast.success('Summary report generated successfully');
        } catch (err) {
            toast.error('Failed to generate report');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-3xl font-bold text-slate-900">Payroll Summary Reports</h1>
                <p className="text-slate-600 mt-1">Generate month-end and year-end payroll summaries</p>
            </div>

            <Card>
                <CardHeader>
                    <CardTitle>Report Configuration</CardTitle>
                    <CardDescription>Select report type and period</CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                    <div className="space-y-2">
                        <Label>Report Type</Label>
                        <div className="grid grid-cols-2 gap-3">
                            <Button
                                variant={reportType === 'month' ? 'default' : 'outline'}
                                onClick={() => setReportType('month')}
                                className="w-full"
                            >
                                <FileSpreadsheet className="w-4 h-4 mr-2" />
                                Month-End Summary
                            </Button>
                            <Button
                                variant={reportType === 'year' ? 'default' : 'outline'}
                                onClick={() => setReportType('year')}
                                className="w-full"
                            >
                                <FileSpreadsheet className="w-4 h-4 mr-2" />
                                Year-End Summary
                            </Button>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {reportType === 'month' && (
                            <div className="space-y-2">
                                <Label>Month</Label>
                                <Select value={month.toString()} onValueChange={(v) => setMonth(parseInt(v))}>
                                    <SelectTrigger>
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {Array.from({ length: 12 }, (_, i) => (
                                            <SelectItem key={i + 1} value={(i + 1).toString()}>
                                                {new Date(2025, i, 1).toLocaleDateString('en-US', { month: 'long' })}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>
                        )}

                        <div className="space-y-2">
                            <Label>Year</Label>
                            <Input
                                type="number"
                                value={year}
                                onChange={(e) => setYear(parseInt(e.target.value))}
                                min="2020"
                                max="2030"
                            />
                        </div>
                    </div>

                    <Button onClick={handleGenerateReport} disabled={loading} className="w-full">
                        {loading ? 'Generating...' : `Generate ${reportType === 'month' ? 'Month' : 'Year'}-End Report`}
                        <Download className="w-4 h-4 ml-2" />
                    </Button>
                </CardContent>
            </Card>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <Card>
                    <CardHeader>
                        <CardTitle>Month-End Summary</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <p className="text-sm text-slate-600 mb-3">
                            Comprehensive monthly payroll summary including:
                        </p>
                        <ul className="list-disc list-inside space-y-1 text-sm text-slate-600">
                            <li>Total gross salary by department</li>
                            <li>Total deductions (taxes, insurance)</li>
                            <li>Net payroll cost</li>
                            <li>Employee count and average salary</li>
                            <li>Disputes and claims processed</li>
                            <li>Month-over-month comparison</li>
                        </ul>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader>
                        <CardTitle>Year-End Summary</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <p className="text-sm text-slate-600 mb-3">
                            Annual payroll summary for financial reporting:
                        </p>
                        <ul className="list-disc list-inside space-y-1 text-sm text-slate-600">
                            <li>Annual gross payroll by department</li>
                            <li>Total tax liability</li>
                            <li>Total insurance contributions</li>
                            <li>Benefits and allowances summary</li>
                            <li>Disputes and refunds summary</li>
                            <li>Year-over-year trends</li>
                        </ul>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}
