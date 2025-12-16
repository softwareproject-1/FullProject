'use client';

import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Download, BarChart2 } from 'lucide-react';
import { payrollSpecialistApi, ReportFiltersDto } from '@/services/api';
import { toast } from 'sonner';

export default function SpecialistReportsPage() {
    const [filters, setFilters] = useState<ReportFiltersDto>({
        departmentId: '',
        startDate: '',
        endDate: '',
    });
    const [loading, setLoading] = useState(false);

    const handleGenerateReport = async () => {
        setLoading(true);
        try {
            const response = await payrollSpecialistApi.getDepartmentReport(filters);
            toast.success('Report generated successfully');
            // Handle report download/display
        } catch (err) {
            toast.error('Failed to generate report');
        } finally {
            setLoading(false);
        }
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
                                    <SelectValue placeholder="Select department" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="dept-001">Engineering</SelectItem>
                                    <SelectItem value="dept-002">Sales</SelectItem>
                                    <SelectItem value="dept-003">Marketing</SelectItem>
                                    <SelectItem value="dept-004">HR</SelectItem>
                                    <SelectItem value="dept-005">Finance</SelectItem>
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

            <Card>
                <CardHeader>
                    <CardTitle>Report Information</CardTitle>
                </CardHeader>
                <CardContent>
                    <p className="text-sm text-slate-600 mb-4">
                        Department reports provide a comprehensive breakdown of payroll costs, including:
                    </p>
                    <ul className="list-disc list-inside space-y-1 text-sm text-slate-600">
                        <li>Total gross salary by department</li>
                        <li>Breakdown of allowances, bonuses, and benefits</li>
                        <li>Tax and insurance deductions summary</li>
                        <li>Net payroll cost per department</li>
                        <li>Employee count and average salary</li>
                        <li>Year-over-year comparison</li>
                    </ul>
                </CardContent>
            </Card>
        </div>
    );
}
