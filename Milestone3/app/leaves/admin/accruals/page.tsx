'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Separator } from '@/components/ui/separator';
import { Search, UserCog, Save, ArrowLeft } from 'lucide-react';
import Link from 'next/link';
import { AccrualPolicyDto } from '@/lib/types';
import { leavesApi } from '@/services/api';
import { employeeProfileApi } from '@/services/api';


export default function AccrualAdminPage() {
    const [employeeId, setEmployeeId] = useState('');
    const [selectedResult, setSelectedResult] = useState<{ id: string, name: string } | null>(null);
    const [leaveType, setLeaveType] = useState(''); // Will be set from real data
    const [leaveTypes, setLeaveTypes] = useState<any[]>([]);
    const [employees, setEmployees] = useState<any[]>([]);
    const [searchResults, setSearchResults] = useState<any[]>([]);
    const [monthsWorked, setMonthsWorked] = useState('12');

    // Accrual Policy Form - Aligned with types.ts AccrualPolicyDto
    const [policy, setPolicy] = useState<AccrualPolicyDto>({
        leaveTypeCode: 'lt001',
        accrualRate: 'MONTHLY',
        carryOverCap: 0,
        resetDateType: 'CALENDAR_YEAR', // Default
        pauseDuringUnpaid: true,
        isProrated: true,
        accrualStartAfterMonths: 0
    });

    // Fetch real data on mount
    useEffect(() => {
        const fetchData = async () => {
            try {
                // Fetch employees
                const empRes = await employeeProfileApi.getAll();
                console.log('📦 Raw employee response:', empRes);

                // Handle different response structures
                const employeeData = Array.isArray(empRes.data) ? empRes.data : (empRes.data?.data || empRes || []);
                console.log('✅ Found', employeeData.length, 'employees');

                if (Array.isArray(employeeData) && employeeData.length > 0) {
                    console.log('Employee IDs:', employeeData.map((e: any) => ({
                        id: e._id,
                        name: `${e.firstName || ''} ${e.lastName || ''}`,
                        number: e.employeeNumber
                    })));
                    setEmployees(employeeData);
                } else {
                    console.warn('⚠️ No employees found or invalid format');
                    setEmployees([]);
                }

                // Fetch leave types
                const leaveTypesRes = await leavesApi.getLeaveTypes();
                console.log('📦 Raw leave types response:', leaveTypesRes);

                const leaveTypesData = Array.isArray(leaveTypesRes.data) ? leaveTypesRes.data : (leaveTypesRes.data?.data || leaveTypesRes || []);
                console.log('✅ Found', leaveTypesData.length, 'leave types');

                if (Array.isArray(leaveTypesData) && leaveTypesData.length > 0) {
                    console.log('Leave Type IDs:', leaveTypesData.map((lt: any) => ({
                        id: lt._id,
                        name: lt.name || lt.leaveTypeName,
                        code: lt.code
                    })));
                    setLeaveTypes(leaveTypesData);

                    // Set first leave type as default
                    setLeaveType(leaveTypesData[0]._id);
                } else {
                    console.warn('⚠️ No leave types found or invalid format');
                    setLeaveTypes([]);
                }
            } catch (error) {
                console.error('❌ Failed to fetch data:', error);
            }
        };
        fetchData();
    }, []);

    const handleSearch = () => {
        if (!employeeId) {
            setSearchResults([]);
            return;
        }

        // Search in fetched employees
        const results = employees.filter((emp: any) => {
            const searchTerm = employeeId.toLowerCase();
            const fullName = `${emp.firstName || ''} ${emp.lastName || ''}`.toLowerCase();
            const empNumber = (emp.employeeNumber || '').toLowerCase();
            const empId = (emp._id || '').toLowerCase();

            return fullName.includes(searchTerm) ||
                empNumber.includes(searchTerm) ||
                empId.includes(searchTerm);
        });

        setSearchResults(results);

        // Auto-select if exact match
        if (results.length === 1) {
            setSelectedResult({
                id: results[0]._id,
                name: `${results[0].firstName} ${results[0].lastName} (${results[0].employeeNumber})`
            });
        }
    };

    const selectEmployee = (emp: any) => {
        setSelectedResult({
            id: emp._id,
            name: `${emp.firstName} ${emp.lastName} (${emp.employeeNumber})`
        });
        setEmployeeId(emp._id);
        setSearchResults([]);
    };

    const handleSave = async () => {
        if (!selectedResult) {
            alert('Please search and select an employee first');
            return;
        }

        if (!leaveType) {
            alert('Please select a leave type');
            return;
        }

        try {
            // Ensure leaveTypeCode is set to the current selection
            const payload: AccrualPolicyDto = {
                ...policy,
                leaveTypeCode: leaveType
            };

            console.log('Saving policy for:', {
                employeeId: selectedResult.id,
                leaveTypeId: leaveType,
                monthsWorked: Number(monthsWorked),
                payload
            });

            await leavesApi.configureAccrualPolicy(
                selectedResult.id,
                leaveType,
                Number(monthsWorked),
                payload
            );

            alert('Accrual policy updated successfully!');
        } catch (error: any) {
            console.error('Failed to save accrual policy:', error);
            console.error('Error response:', error.response);

            if (error.response?.status === 404) {
                alert('Error: Employee or Leave Type not found in database. Please check the IDs.');
            } else if (error.response?.status === 401) {
                alert('Error: Not authenticated. Please log in again.');
            } else {
                alert(`Failed to save: ${error.response?.data?.message || error.message || 'Unknown error'}`);
            }
        }
    };

    return (
        <div className="space-y-6 container mx-auto py-6">
            <div className="flex items-center gap-4">
                <Link href="/leaves/configuration">
                    <Button variant="ghost" size="icon">
                        <ArrowLeft className="h-5 w-5" />
                    </Button>
                </Link>
                <div>
                    <h1 className="text-2xl font-bold tracking-tight text-slate-900">Accrual Administration</h1>
                    <p className="text-slate-500">Configure leave accrual for specific employees.</p>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">

                {/* Search Panel */}
                <Card className="md:col-span-1 h-fit bg-white border-slate-200">
                    <CardHeader>
                        <CardTitle>Find Employee</CardTitle>
                        <CardDescription>Search by ID or Name</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="flex gap-2">
                            <Input
                                placeholder="Employee ID..."
                                value={employeeId}
                                onChange={(e) => setEmployeeId(e.target.value)}
                            />
                            <Button onClick={handleSearch} size="icon">
                                <Search className="h-4 w-4" />
                            </Button>
                        </div>

                        {/* Search Results */}
                        {searchResults.length > 0 && !selectedResult && (
                            <div className="max-h-60 overflow-y-auto border rounded-lg">
                                {searchResults.map((emp: any) => (
                                    <div
                                        key={emp._id}
                                        onClick={() => selectEmployee(emp)}
                                        className="p-3 hover:bg-blue-50 cursor-pointer border-b last:border-b-0"
                                    >
                                        <p className="font-medium text-slate-900">
                                            {emp.firstName} {emp.lastName}
                                        </p>
                                        <p className="text-xs text-slate-500">
                                            {emp.employeeNumber} • ID: {emp._id}
                                        </p>
                                    </div>
                                ))}
                            </div>
                        )}

                        {/* Selected Employee */}
                        {selectedResult && (
                            <div className="p-4 bg-slate-50 rounded-lg border border-slate-200">
                                <div className="flex items-center gap-3 mb-2">
                                    <div className="h-10 w-10 rounded-full bg-slate-200 flex items-center justify-center">
                                        <UserCog className="h-6 w-6 text-slate-500" />
                                    </div>
                                    <div className="flex-1">
                                        <p className="font-medium text-slate-900">{selectedResult.name}</p>
                                        <p className="text-xs text-slate-500">{selectedResult.id}</p>
                                    </div>
                                    <Button
                                        variant="ghost"
                                        size="sm"
                                        onClick={() => {
                                            setSelectedResult(null);
                                            setEmployeeId('');
                                        }}
                                    >
                                        Clear
                                    </Button>
                                </div>
                            </div>
                        )}
                    </CardContent>
                </Card>

                {/* Configuration Panel */}
                <Card className="md:col-span-2 bg-white border-slate-200">
                    <CardHeader>
                        <CardTitle>Accrual Policy</CardTitle>
                        <CardDescription>Set how leave is calculated for this employee.</CardDescription>
                    </CardHeader>
                    <CardContent>
                        {!selectedResult ? (
                            <div className="text-center py-12 text-slate-400">
                                Please search and select an employee first.
                            </div>
                        ) : (
                            <div className="space-y-6">
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="space-y-2">
                                        <Label>Leave Type</Label>
                                        <Select value={leaveType} onValueChange={(val) => {
                                            setLeaveType(val);
                                            setPolicy({ ...policy, leaveTypeCode: val });
                                        }}>
                                            <SelectTrigger>
                                                <SelectValue placeholder="Select type" />
                                            </SelectTrigger>
                                            <SelectContent>
                                                {leaveTypes.length > 0 ? (
                                                    leaveTypes.map((lt) => (
                                                        <SelectItem key={lt._id} value={lt._id}>
                                                            {lt.name || lt.leaveTypeName}
                                                        </SelectItem>
                                                    ))
                                                ) : (
                                                    <SelectItem value="loading" disabled>Loading...</SelectItem>
                                                )}
                                            </SelectContent>
                                        </Select>
                                    </div>
                                    <div className="space-y-2">
                                        <Label>Months Worked (Previously)</Label>
                                        <Input
                                            type="number"
                                            value={monthsWorked}
                                            onChange={(e) => setMonthsWorked(e.target.value)}
                                        />
                                    </div>
                                </div>

                                <Separator />

                                <div className="space-y-4">
                                    <div className="space-y-2">
                                        <Label>Accrual Rate</Label>
                                        <Select
                                            value={policy.accrualRate}
                                            onValueChange={(val: any) => setPolicy({ ...policy, accrualRate: val })}
                                        >
                                            <SelectTrigger>
                                                <SelectValue />
                                            </SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="MONTHLY">Monthly</SelectItem>
                                                <SelectItem value="YEARLY">Yearly</SelectItem>
                                                <SelectItem value="DAILY">Daily</SelectItem>
                                            </SelectContent>
                                        </Select>
                                    </div>

                                    <div className="grid grid-cols-2 gap-4">
                                        <div className="space-y-2">
                                            <Label>Carry Over Cap</Label>
                                            <Input
                                                type="number"
                                                value={policy.carryOverCap}
                                                onChange={(e) => setPolicy({ ...policy, carryOverCap: Number(e.target.value) })}
                                                placeholder="Max days to carry over"
                                            />
                                        </div>
                                        <div className="space-y-2">
                                            <Label>Reset Date Type</Label>
                                            <Select
                                                value={policy.resetDateType}
                                                onValueChange={(val) => setPolicy({ ...policy, resetDateType: val as 'CALENDAR_YEAR' | 'JOINING_DATE' | 'FISCAL_YEAR' })}
                                            >
                                                <SelectTrigger>
                                                    <SelectValue />
                                                </SelectTrigger>
                                                <SelectContent>
                                                    <SelectItem value="CALENDAR_YEAR">Calendar Year (Jan 1)</SelectItem>
                                                    <SelectItem value="JOINING_DATE">Joining Anniversary</SelectItem>
                                                    <SelectItem value="FISCAL_YEAR">Fiscal Year</SelectItem>
                                                </SelectContent>
                                            </Select>
                                        </div>
                                    </div>

                                    <div className="flex items-center justify-between p-3 border rounded-lg bg-slate-50">
                                        <div className="space-y-0.5">
                                            <Label>Pro-Rata Calculation</Label>
                                            <p className="text-xs text-slate-500">Calculate partial accrual if joining mid-cycle.</p>
                                        </div>
                                        <Switch
                                            checked={policy.isProrated}
                                            onCheckedChange={(checked) => setPolicy({ ...policy, isProrated: checked })}
                                        />
                                    </div>
                                    <div className="flex items-center justify-between p-3 border rounded-lg bg-slate-50">
                                        <div className="space-y-0.5">
                                            <Label>Pause During Unpaid Leave</Label>
                                            <p className="text-xs text-slate-500">Stop accruals while on unpaid leave.</p>
                                        </div>
                                        <Switch
                                            checked={policy.pauseDuringUnpaid}
                                            onCheckedChange={(checked) => setPolicy({ ...policy, pauseDuringUnpaid: checked })}
                                        />
                                    </div>
                                </div>

                                <div className="flex justify-end pt-4">
                                    <Button onClick={handleSave} className="bg-slate-900">
                                        <Save className="mr-2 h-4 w-4" />
                                        Update Policy
                                    </Button>
                                </div>
                            </div>
                        )}
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}
