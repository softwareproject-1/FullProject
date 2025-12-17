'use client';

import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { FileText, Download, Loader2, DollarSign, ShieldCheck, Gift } from 'lucide-react';
import { financeStaffApi } from '@/services/api';
import { toast } from 'sonner';

export default function FinanceReportsPage() {
    const [loading, setLoading] = useState(false);
    const [reportData, setReportData] = useState<any>(null);
    const [startDate, setStartDate] = useState('');
    const [endDate, setEndDate] = useState('');
    const [activeTab, setActiveTab] = useState('compliance');
    const [selectedMonth, setSelectedMonth] = useState(new Date().toISOString().slice(0, 7)); // YYYY-MM
    const [selectedYear, setSelectedYear] = useState(new Date().getFullYear().toString());

    // Generic report handler for Compliance reports
    const handleGenerateReport = async (type: 'TAX' | 'INSURANCE' | 'BENEFITS') => {
        if (!startDate || !endDate) {
            toast.error('Please select both start and end dates');
            return;
        }

        setLoading(true);
        setReportData(null);

        try {
            let response: any;
            if (type === 'TAX') {
                response = await financeStaffApi.getTaxComplianceReport(startDate, endDate);
            } else if (type === 'INSURANCE') {
                response = await financeStaffApi.getInsuranceComplianceReport(startDate, endDate);
            } else if (type === 'BENEFITS') {
                response = await financeStaffApi.getBenefitsReport(startDate, endDate);
            } else {
                response = await financeStaffApi.getFinancialReport(startDate, endDate);
            }

            setReportData(response.data || response.data.data); // Handle potential nesting differences
            toast.success(`${type} report generated successfully`);
        } catch (err: any) {
            console.error('Report Generation Error:', err);
            toast.error('Failed to generate report');
        } finally {
            setLoading(false);
        }
    };

    const handleMonthEndReport = async () => {
        if (!selectedMonth) {
            toast.error('Please select a month');
            return;
        }

        const [year, month] = selectedMonth.split('-').map(Number);
        const start = new Date(year, month - 1, 1);
        const end = new Date(year, month, 0); // Last day of month

        setLoading(true);
        setReportData(null);

        try {
            // Using ISO string YYYY-MM-DD
            const response: any = await financeStaffApi.getFinancialReport(
                start.toISOString().split('T')[0],
                end.toISOString().split('T')[0]
            );
            setReportData({ ...response.data, reportType: `Month-End Summary (${selectedMonth})` });
            toast.success('Month-End report generated');
        } catch (err) {
            toast.error('Failed to generate report');
        } finally {
            setLoading(false);
        }
    };

    const handleYearEndReport = async () => {
        if (!selectedYear || selectedYear.length !== 4) {
            toast.error('Please enter a valid year');
            return;
        }

        const start = new Date(`${selectedYear}-01-01`);
        const end = new Date(`${selectedYear}-12-31`);

        setLoading(true);
        setReportData(null);

        try {
            const response: any = await financeStaffApi.getFinancialReport(
                start.toISOString().split('T')[0],
                end.toISOString().split('T')[0]
            );
            setReportData({ ...response.data, reportType: `Year-End Summary (${selectedYear})` });
            toast.success('Year-End report generated');
        } catch (err) {
            toast.error('Failed to generate report');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-3xl font-bold text-slate-900">Finance Reports</h1>
                <p className="text-slate-600 mt-1">Generate compliance reports and financial summaries</p>
            </div>

            <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
                <TabsList className="grid w-full grid-cols-2 max-w-[400px]">
                    <TabsTrigger value="compliance">Compliance</TabsTrigger>
                    <TabsTrigger value="financial">Financial Summaries</TabsTrigger>
                </TabsList>

                <TabsContent value="compliance" className="mt-6 space-y-6">
                    {/* Date Filter - Only for Compliance */}
                    <Card>
                        <CardContent className="pt-6">
                            <div className="flex items-end gap-4">
                                <div className="space-y-2">
                                    <Label htmlFor="start-date">Start Date</Label>
                                    <Input
                                        id="start-date"
                                        type="date"
                                        value={startDate}
                                        onChange={(e) => setStartDate(e.target.value)}
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="end-date">End Date</Label>
                                    <Input
                                        id="end-date"
                                        type="date"
                                        value={endDate}
                                        onChange={(e) => setEndDate(e.target.value)}
                                    />
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                    <div className="grid md:grid-cols-2 gap-6">
                        <div className="cursor-pointer" onClick={(e) => { e.stopPropagation(); handleGenerateReport('TAX'); }}>
                            <Card className="hover:border-blue-200 transition-colors h-full">
                                <CardHeader>
                                    <CardTitle className="flex items-center gap-2">
                                        <FileText className="w-5 h-5 text-blue-600" />
                                        Tax Compliance
                                    </CardTitle>
                                    <CardDescription>Generate report on tax deductions and taxable income</CardDescription>
                                </CardHeader>
                            </Card>
                        </div>

                        <div className="cursor-pointer" onClick={(e) => { e.stopPropagation(); handleGenerateReport('INSURANCE'); }}>
                            <Card className="hover:border-purple-200 transition-colors h-full">
                                <CardHeader>
                                    <CardTitle className="flex items-center gap-2">
                                        <ShieldCheck className="w-5 h-5 text-purple-600" />
                                        Insurance Contributions
                                    </CardTitle>
                                    <CardDescription>Employee and Employer insurance breakdown</CardDescription>
                                </CardHeader>
                            </Card>
                        </div>

                        <div className="cursor-pointer" onClick={(e) => { e.stopPropagation(); handleGenerateReport('BENEFITS'); }}>
                            <Card className="hover:border-pink-200 transition-colors h-full">
                                <CardHeader>
                                    <CardTitle className="flex items-center gap-2">
                                        <Gift className="w-5 h-5 text-pink-600" />
                                        Benefits Report
                                    </CardTitle>
                                    <CardDescription>Allowances, bonuses, and other benefits breakdown</CardDescription>
                                </CardHeader>
                            </Card>
                        </div>
                    </div>
                </TabsContent>



                <TabsContent value="financial" className="mt-6">
                    <div className="grid md:grid-cols-2 gap-6">
                        {/* Month-End Summary Card */}
                        <Card>
                            <CardHeader>
                                <CardTitle className="flex items-center gap-2">
                                    <DollarSign className="w-5 h-5 text-green-600" />
                                    Month-End Summary
                                </CardTitle>
                                <CardDescription>Generate payroll cost analysis for a specific month</CardDescription>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                <div className="space-y-2">
                                    <Label htmlFor="month-select">Select Month</Label>
                                    <Input
                                        id="month-select"
                                        type="month"
                                        value={selectedMonth}
                                        onChange={(e) => setSelectedMonth(e.target.value)}
                                    />
                                </div>
                                <Button onClick={handleMonthEndReport} className="w-full" disabled={loading}>
                                    {loading ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
                                    Generate Month-End Report
                                </Button>
                            </CardContent>
                        </Card>

                        {/* Year-End Summary Card */}
                        <Card>
                            <CardHeader>
                                <CardTitle className="flex items-center gap-2">
                                    <DollarSign className="w-5 h-5 text-green-700" />
                                    Year-End Summary
                                </CardTitle>
                                <CardDescription>Annual payroll cost and deduction summary</CardDescription>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                <div className="space-y-2">
                                    <Label htmlFor="year-select">Select Year</Label>
                                    <Input
                                        id="year-select"
                                        type="number"
                                        min="2020"
                                        max="2030"
                                        value={selectedYear}
                                        onChange={(e) => setSelectedYear(e.target.value)}
                                    />
                                </div>
                                <Button onClick={handleYearEndReport} className="w-full" variant="outline" disabled={loading}>
                                    {loading ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
                                    Generate Year-End Report
                                </Button>
                            </CardContent>
                        </Card>
                    </div>
                </TabsContent>
            </Tabs>

            {/* Results Display */}
            {
                loading && (
                    <div className="flex justify-center p-12">
                        <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
                    </div>
                )
            }

            {
                reportData && (
                    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
                        <div className="flex items-center justify-between">
                            <h2 className="text-xl font-bold text-slate-800">{reportData.reportType}</h2>
                            <Button variant="outline">
                                <Download className="w-4 h-4 mr-2" />
                                Export PDF
                            </Button>
                        </div>

                        {/* Report Summary Cards */}
                        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
                            {Object.entries(reportData.summary).map(([key, value]) => (
                                <Card key={key}>
                                    <CardHeader className="pb-2">
                                        <CardDescription className="capitalize">{key.replace(/([A-Z])/g, ' $1').trim()}</CardDescription>
                                        <CardTitle className="text-2xl">
                                            {typeof value === 'number' && (key.toLowerCase().includes('total') || key.toLowerCase().includes('cost') || key.toLowerCase().includes('income'))
                                                ? `$${(value as number).toLocaleString()}`
                                                : value as React.ReactNode}
                                        </CardTitle>
                                    </CardHeader>
                                </Card>
                            ))}
                        </div>


                    </div>
                )
            }
        </div >
    );
}
