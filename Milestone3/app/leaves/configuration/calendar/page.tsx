'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Calendar } from '@/components/ui/calendar';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { ArrowLeft, Calendar as CalendarIcon, Ban, AlertCircle, LogIn } from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { timeManagementApi, leavesApi } from '@/services/api';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import axios from '@/lib/axios';
import { useAuth } from '@/contexts/AuthContext';


export default function HolidayCalendarPage() {
    const { isHRManager, isHREmployee, isSystemAdmin, isHRAdmin } = useAuth();
    const isHR = isHRManager() || isHREmployee() || isSystemAdmin() || isHRAdmin();
    const router = useRouter();
    const [date, setDate] = useState<Date | undefined>(new Date());
    const [isOpen, setIsOpen] = useState(false);
    const [dialogType, setDialogType] = useState<'holiday' | 'block'>('holiday');

    // Forms
    const [holidayName, setHolidayName] = useState('');
    const [holidayStartDate, setHolidayStartDate] = useState<string>('');
    const [blockReason, setBlockReason] = useState('');
    const [blockStartDate, setBlockStartDate] = useState<string>('');
    const [blockEndDate, setBlockEndDate] = useState<string>('');

    // Test Net Leave Duration
    const [testStartDate, setTestStartDate] = useState<string>('');
    const [testEndDate, setTestEndDate] = useState<string>('');
    const [netDays, setNetDays] = useState<number | null>(null);
    const [calculating, setCalculating] = useState(false);

    const [holidays, setHolidays] = useState<{ date: Date; name: string }[]>([]);
    const [blockedPeriods, setBlockedPeriods] = useState<{ from: Date; to: Date; reason: string }[]>([]);
    const [authError, setAuthError] = useState<string>('');
    const [isAuthenticated, setIsAuthenticated] = useState<boolean>(true);

    const testNetLeaveDuration = async () => {
        if (!testStartDate || !testEndDate) {
            alert('Please select both start and end dates');
            return;
        }

        try {
            setCalculating(true);
            const year = new Date(testStartDate).getFullYear();
            const result = await leavesApi.calculateNetLeaveDuration(testStartDate, testEndDate, year);

            // Extract the number from the response (axios returns data in result.data)
            setNetDays(result.data);

            console.log('✅ Net leave days calculated:', result.data);
        } catch (error: any) {
            console.error('❌ Failed to calculate:', error);
            alert(`Failed to calculate: ${error.response?.data?.message || error.message}`);
        } finally {
            setCalculating(false);
        }
    };


    const fetchCalendarData = async () => {
        setAuthError('');
        try {
            const year = date?.getFullYear() || new Date().getFullYear();

            // ✅ Fetch from Time Management (single source of truth)
            // Add x-skip-auth-redirect header to prevent automatic login redirect
            const res = await axios.get('/time-management/holidays', {
                params: { year },
                headers: {
                    'x-skip-auth-redirect': 'true'
                }
            });
            const data: any[] = res.data;

            // Transform backend data to UI format
            const loadedHolidays = data
                .filter(h => h.type === 'NATIONAL')
                .map(h => ({
                    date: new Date(h.startDate),
                    name: h.name || 'Public Holiday'
                }));

            setHolidays(loadedHolidays);

            // Fetch blocked periods (ORGANIZATIONAL type)
            const loadedBlocked = data
                .filter(h => h.type === 'ORGANIZATIONAL')
                .map(h => ({
                    from: new Date(h.startDate),
                    to: h.endDate ? new Date(h.endDate) : new Date(h.startDate),
                    reason: h.name || 'Blocked Period'
                }));
            setBlockedPeriods(loadedBlocked);
            setIsAuthenticated(true);
        } catch (error: any) {
            console.error('❌ Failed to fetch calendar:', error);
            if (error.response?.status === 401) {
                setIsAuthenticated(false);
                setAuthError('Authentication required. Using @Public() decorator should resolve this.');
            } else {
                setAuthError('Failed to load calendar: ' + (error.response?.data?.message || error.message));
            }
        }
    };

    // Initial load
    useEffect(() => {
        fetchCalendarData();
    }, [date]);

    const handleSave = async () => {
        try {
            if (dialogType === 'holiday') {
                const startDate = holidayStartDate || (date ? date.toISOString().split('T')[0] : '');
                if (!startDate || !holidayName) {
                    alert('Please fill in all required fields');
                    return;
                }

                // ✅ Save to Time Management (single source of truth)
                await timeManagementApi.createHoliday({
                    name: holidayName,
                    startDate: new Date(startDate).toISOString(),
                    type: 'NATIONAL',
                    active: true
                });

                console.log('✅ Holiday saved to Time Management');
            } else {
                const startDate = blockStartDate || (date ? date.toISOString().split('T')[0] : '');
                if (!startDate || !blockEndDate || !blockReason) {
                    alert('Please fill in all required fields');
                    return;
                }

                // ✅ Save blocked period to Time Management (ORGANIZATIONAL type)
                await timeManagementApi.createHoliday({
                    name: blockReason,
                    startDate: new Date(startDate).toISOString(),
                    endDate: new Date(blockEndDate).toISOString(),
                    type: 'ORGANIZATIONAL',
                    active: true
                });

                console.log('✅ Blocked period saved to Time Management');
            }

            fetchCalendarData(); // Refresh from Time Management
            setIsOpen(false);
            setHolidayName('');
            setHolidayStartDate('');
            setBlockReason('');
            setBlockStartDate('');
            setBlockEndDate('');
        } catch (e: any) {
            console.error('Save error:', e);
            alert(`Failed to save: ${e.response?.data?.message || e.message || 'Unknown error'}`);
        }
    };

    return (
        <div className="space-y-6 container mx-auto py-6">
            <div className="flex items-center gap-4">
                <Link href="/leaves">
                    <Button variant="ghost" size="icon">
                        <ArrowLeft className="h-5 w-5" />
                    </Button>
                </Link>
                <div>
                    <h1 className="text-2xl font-bold tracking-tight text-slate-900">Calendar Management</h1>
                    <p className="text-slate-500">Manage holidays and blocked leave periods.</p>
                </div>
            </div>

            {/* Authentication Error Alert */}
            {authError && (
                <Alert variant={isAuthenticated ? "default" : "destructive"} className="border-2">
                    <AlertCircle className="h-5 w-5" />
                    <AlertTitle className="font-semibold text-lg">
                        {isAuthenticated ? 'Error Loading Calendar' : 'Authentication Required'}
                    </AlertTitle>
                    <AlertDescription className="mt-2">
                        <p className="mb-3">{authError}</p>
                        {!isAuthenticated && (
                            <Button
                                onClick={() => router.push('/login')}
                                className="bg-white text-red-700 hover:bg-red-50 border border-red-300"
                            >
                                <LogIn className="mr-2 h-4 w-4" />
                                Go to Login
                            </Button>
                        )}
                    </AlertDescription>
                </Alert>
            )}

            <div className="grid grid-cols-1 md:grid-cols-12 gap-8">

                {/* Calendar View */}
                <div className="md:col-span-8 flex flex-col md:flex-row gap-6">
                    <Card className="w-fit h-fit">
                        <CardContent className="p-4">
                            <Calendar
                                mode="single"
                                selected={date}
                                onSelect={setDate}
                                className="rounded-md border"
                            />
                        </CardContent>
                    </Card>

                    <div className="flex-1 space-y-6">
                        <div className="flex gap-4">
                            <Dialog open={isOpen} onOpenChange={setIsOpen}>
                                <DialogTrigger asChild>
                                    <Button onClick={() => setDialogType('holiday')} className="flex-1 bg-blue-600 hover:bg-blue-700">
                                        <CalendarIcon className="mr-2 h-4 w-4" /> Add Holiday
                                    </Button>
                                </DialogTrigger>
                                <DialogTrigger asChild>
                                    <Button onClick={() => setDialogType('block')} variant="outline" className="flex-1 border-red-200 text-red-700 hover:bg-red-50">
                                        <Ban className="mr-2 h-4 w-4" /> Block Dates
                                    </Button>
                                </DialogTrigger>

                                <DialogContent>
                                    <DialogHeader>
                                        <DialogTitle>
                                            {dialogType === 'holiday' ? 'Add Public Holiday' : 'Block Leave Dates'}
                                        </DialogTitle>
                                    </DialogHeader>

                                    <div className="space-y-4 py-4">
                                        {dialogType === 'holiday' && (
                                            <>
                                                <div className="space-y-2">
                                                    <Label>Holiday Date</Label>
                                                    <Input
                                                        type="date"
                                                        value={holidayStartDate || (date ? date.toISOString().split('T')[0] : '')}
                                                        onChange={(e) => setHolidayStartDate(e.target.value)}
                                                    />
                                                </div>
                                                <div className="space-y-2">
                                                    <Label>Holiday Name</Label>
                                                    <Input
                                                        value={holidayName}
                                                        onChange={(e) => setHolidayName(e.target.value)}
                                                        placeholder="e.g. National Foundation Day"
                                                    />
                                                </div>
                                            </>
                                        )}

                                        {dialogType === 'block' && (
                                            <>
                                                <div className="space-y-2">
                                                    <Label>Block Start Date</Label>
                                                    <Input
                                                        type="date"
                                                        value={blockStartDate || (date ? date.toISOString().split('T')[0] : '')}
                                                        onChange={(e) => setBlockStartDate(e.target.value)}
                                                    />
                                                </div>
                                                <div className="space-y-2">
                                                    <Label>Block End Date</Label>
                                                    <Input
                                                        type="date"
                                                        value={blockEndDate}
                                                        onChange={(e) => setBlockEndDate(e.target.value)}
                                                    />
                                                </div>
                                                <div className="space-y-2">
                                                    <Label>Reason</Label>
                                                    <Input
                                                        value={blockReason}
                                                        onChange={(e) => setBlockReason(e.target.value)}
                                                        placeholder="e.g. System Maintenance, Peak Season"
                                                    />
                                                </div>
                                            </>
                                        )}
                                    </div>

                                    <DialogFooter>
                                        <Button onClick={handleSave}>Confirm</Button>
                                    </DialogFooter>
                                </DialogContent>
                            </Dialog>
                        </div>
                    </div>
                </div>

                {/* Sidebar Lists */}
                <div className="md:col-span-4 space-y-6">
                    <Card>
                        <CardHeader>
                            <CardTitle className="text-base">Upcoming Holidays</CardTitle>
                        </CardHeader>
                        <CardContent className="grid gap-2">
                            {holidays.map((h, i) => (
                                <div key={i} className="flex justify-between items-center text-sm p-2 border rounded bg-slate-50">
                                    <span>{h.name}</span>
                                    <span className="text-slate-500">{h.date.toLocaleDateString()}</span>
                                </div>
                            ))}
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader>
                            <CardTitle className="text-base">Blocked Periods</CardTitle>
                        </CardHeader>
                        <CardContent className="grid gap-2">
                            {blockedPeriods.map((b, i) => (
                                <div key={i} className="text-sm p-3 border border-red-100 bg-red-50 rounded">
                                    <div className="font-medium text-red-900">{b.reason}</div>
                                    <div className="text-red-700 mt-1 text-xs">
                                        {b.from.toLocaleDateString()} - {b.to.toLocaleDateString()}
                                    </div>
                                </div>
                            ))}
                        </CardContent>
                    </Card>
                </div>
            </div>

            {/* Test Net Leave Duration */}
            <Card className="mt-6 border-2 border-blue-200">
                <CardHeader className="bg-blue-50">
                    <CardTitle className="text-lg flex items-center gap-2">
                        🧪 Test Net Leave Calculation
                    </CardTitle>
                    <CardDescription>
                        Test how many working days are between two dates (excluding weekends and holidays from Time Management)
                    </CardDescription>
                </CardHeader>
                <CardContent className="pt-6">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div className="space-y-2">
                            <Label>Start Date</Label>
                            <Input
                                type="date"
                                value={testStartDate}
                                onChange={(e) => setTestStartDate(e.target.value)}
                            />
                        </div>
                        <div className="space-y-2">
                            <Label>End Date</Label>
                            <Input
                                type="date"
                                value={testEndDate}
                                onChange={(e) => setTestEndDate(e.target.value)}
                            />
                        </div>
                        <div className="space-y-2">
                            <Label>&nbsp;</Label>
                            <Button
                                onClick={testNetLeaveDuration}
                                disabled={calculating}
                                className="w-full bg-blue-600 hover:bg-blue-700"
                            >
                                {calculating ? 'Calculating...' : 'Calculate Net Days'}
                            </Button>
                        </div>
                    </div>

                    {netDays !== null && (
                        <div className="mt-4 p-4 bg-green-50 border-2 border-green-200 rounded-lg">
                            <div className="text-sm text-green-700 mb-1">Result:</div>
                            <div className="text-3xl font-bold text-green-900">{netDays} working days</div>
                            <div className="text-xs text-green-600 mt-2">
                                ✅ Calculated using Time Management holidays (excludes weekends & public holidays)
                            </div>
                        </div>
                    )}
                </CardContent>
            </Card>
        </div>
    );
}
