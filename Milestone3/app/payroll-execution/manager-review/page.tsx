'use client';

import React, { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
    ArrowLeft,
    Loader2,
    AlertCircle,
    CheckCircle2,
    XCircle,
    UserX,
    CreditCard,
    AlertTriangle,
    Eye
} from 'lucide-react';
import { payrollExecutionApi } from '@/services/api';
import { toast } from 'sonner';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";

// Types
interface PayrollRun {
    runId: string;
    cycleName: string;
    period: string | { month: string; year: number; startDate: string; endDate: string };
    totalAmount: number;
    currentStatus: string;
    employeeCount: number;
    totalAnomalies: number;
    createdAt: string;
    createdBy: string;
}

interface DraftEmployee {
    employeeId: string;
    employeeName: string;
    department: string;
    netPay: number;
    exceptions?: string;
}

export default function ManagerReviewPage() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const runIdParam = searchParams.get('runId');

    const [payrollRuns, setPayrollRuns] = useState<PayrollRun[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [selectedRun, setSelectedRun] = useState<PayrollRun | null>(null);
    const [employees, setEmployees] = useState<DraftEmployee[]>([]);
    const [exceptions, setExceptions] = useState<DraftEmployee[]>([]);

    // Action States
    const [isProcessing, setIsProcessing] = useState(false);
    const [reviewComment, setReviewComment] = useState('');
    const [showRejectDialog, setShowRejectDialog] = useState(false);
    const [showResolveDialog, setShowResolveDialog] = useState(false);
    const [selectedException, setSelectedException] = useState<DraftEmployee | null>(null);
    const [resolutionAction, setResolutionAction] = useState<string>('');
    const [resolutionJustification, setResolutionJustification] = useState('');
    const [paymentMethod, setPaymentMethod] = useState<string>('CHEQUE');

    useEffect(() => {
        loadPayrollRuns();
    }, []);

    useEffect(() => {
        if (runIdParam && payrollRuns.length > 0) {
            const run = payrollRuns.find(r => r.runId === runIdParam);
            if (run) {
                handleViewRun(run);
            }
        } else if (!runIdParam) {
            setSelectedRun(null);
        }
    }, [runIdParam, payrollRuns]);

    const loadPayrollRuns = async () => {
        try {
            setIsLoading(true);
            const response = await payrollExecutionApi.getPayrollRuns();
            // Filter for runs that are relevant to manager (Under Review, or history)
            // For now, show all but highlight Under Review
            setPayrollRuns(response.data || []);
        } catch (error) {
            console.error('Error loading runs:', error);
            toast.error('Failed to load payroll runs');
        } finally {
            setIsLoading(false);
        }
    };

    const handleViewRun = async (run: PayrollRun) => {
        setSelectedRun(run);
        // Load employees/exceptions for this run
        try {
            setIsProcessing(true);
            const response = await payrollExecutionApi.getDraftEmployees(run.runId);
            const allEmployees = response.data.employees || [];
            setEmployees(allEmployees);

            // Filter exceptions
            const exceptionList = allEmployees.filter((emp: any) => emp.exceptions && emp.exceptions.trim() !== '');
            setExceptions(exceptionList);
        } catch (error) {
            console.error('Error loading run details:', error);
            toast.error('Failed to load run details');
        } finally {
            setIsProcessing(false);
        }
    };

    const handleApproveRun = async () => {
        if (!selectedRun) return;
        try {
            setIsProcessing(true);
            await payrollExecutionApi.managerReview(selectedRun.runId, {
                action: 'APPROVED',
                comment: reviewComment || 'Approved by Manager'
            });
            toast.success('Payroll run approved successfully');
            router.push('/payroll-execution/manager-review'); // Reset view
            loadPayrollRuns(); // Refresh list
        } catch (error) {
            console.error('Error approving run:', error);
            toast.error('Failed to approve payroll run');
        } finally {
            setIsProcessing(false);
        }
    };

    const handleRejectRun = async () => {
        if (!selectedRun) return;
        if (!reviewComment) {
            toast.error('Please provide a rejection reason');
            return;
        }
        try {
            setIsProcessing(true);
            await payrollExecutionApi.managerReview(selectedRun.runId, {
                action: 'REJECTED',
                comment: reviewComment
            });
            toast.success('Payroll run rejected');
            setShowRejectDialog(false);
            router.push('/payroll-execution/manager-review');
            loadPayrollRuns();
        } catch (error) {
            console.error('Error rejecting run:', error);
            toast.error('Failed to reject payroll run');
        } finally {
            setIsProcessing(false);
        }
    };

    const handleResolveAnomaly = async () => {
        if (!selectedRun || !selectedException || !resolutionAction) return;

        const resolutionData: any = {
            employeeId: selectedException.employeeId,
            employeeName: selectedException.employeeName,
            action: resolutionAction,
            justification: resolutionJustification
        };

        if (resolutionAction === 'OVERRIDE_PAYMENT_METHOD') {
            resolutionData.overridePaymentMethod = paymentMethod;
        }

        try {
            setIsProcessing(true);
            await payrollExecutionApi.resolveAnomalies(selectedRun.runId, {
                resolutions: [resolutionData]
            });

            toast.success(`Anomaly resolved via ${resolutionAction}`);
            setShowResolveDialog(false);
            // Reload details to reflect changes
            handleViewRun(selectedRun);
        } catch (error) {
            console.error('Error resolving anomaly:', error);
            toast.error('Failed to resolve anomaly');
        } finally {
            setIsProcessing(false);
        }
    };

    const formatStatus = (status: string) => {
        switch (status) {
            case 'under review': return <Badge className="bg-blue-100 text-blue-800 border-blue-200">Pending Review</Badge>;
            case 'pending finance approval': return <Badge className="bg-purple-100 text-purple-800 border-purple-200">Waiting Finance</Badge>;
            case 'rejected': return <Badge className="bg-red-100 text-red-800 border-red-200">Rejected</Badge>;
            case 'approved': return <Badge className="bg-green-100 text-green-800 border-green-200">Approved</Badge>;
            default: return <Badge variant="secondary">{status.replace('_', ' ')}</Badge>;
        }
    };

    // RENDER DETAIL VIEW
    if (selectedRun) {
        return (
            <div className="p-6 space-y-6 max-w-7xl mx-auto">
                {/* Header */}
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                        <Button variant="ghost" onClick={() => { setSelectedRun(null); router.push('/payroll-execution/manager-review'); }}>
                            <ArrowLeft className="w-4 h-4 mr-2" />
                            Back to Runs
                        </Button>
                        <div>
                            <h1 className="text-2xl font-bold text-gray-900">Review Run: {selectedRun.runId}</h1>
                            <div className="flex items-center gap-2 mt-1">
                                <span className="text-sm text-gray-500">{typeof selectedRun.period === 'string' ? selectedRun.period : `${selectedRun.period?.month} ${selectedRun.period?.year}`}</span>
                                {formatStatus(selectedRun.currentStatus)}
                            </div>
                        </div>
                    </div>
                    {/* Action Buttons */}
                    <div className="flex gap-2">
                        {selectedRun.currentStatus === 'under review' && (
                            <>
                                <Button variant="destructive" onClick={() => setShowRejectDialog(true)}>
                                    <XCircle className="w-4 h-4 mr-2" />
                                    Reject Run
                                </Button>
                                <Button className="bg-green-600 hover:bg-green-700" onClick={handleApproveRun}>
                                    <CheckCircle2 className="w-4 h-4 mr-2" />
                                    Approve Run
                                </Button>
                            </>
                        )}
                    </div>
                </div>

                {/* Anomalies Section */}
                <Card className="border-l-4 border-l-yellow-500">
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2 text-yellow-700">
                            <AlertTriangle className="w-5 h-5" />
                            Exceptions & Anomalies ({exceptions.length})
                        </CardTitle>
                        <CardDescription>
                            Review and resolve flagged issues before approving the payroll run.
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        {exceptions.length === 0 ? (
                            <div className="text-center py-6 text-green-600 bg-green-50 rounded-lg">
                                <CheckCircle2 className="w-8 h-8 mx-auto mb-2 opacity-50" />
                                <p className="font-medium">No anomalies detected. Safe to proceed.</p>
                            </div>
                        ) : (
                            <div className="space-y-4">
                                {exceptions.map((exc, index) => {
                                    const isResolved = exc.exceptions?.includes('OVERRIDE') || exc.exceptions?.includes('DEFERRED');
                                    return (
                                        <div key={`${exc.employeeId}-${index}`} className={`flex flex-col md:flex-row items-start md:items-center justify-between p-4 bg-white border rounded-lg shadow-sm ${isResolved ? 'border-green-200 bg-green-50' : 'border-yellow-200'}`}>
                                            <div>
                                                <h4 className="font-semibold text-gray-900">{exc.employeeName}</h4>
                                                <p className="text-sm text-gray-500">{exc.department}</p>
                                                <div className={`mt-2 text-sm font-medium inline-block px-2 py-1 rounded ${isResolved ? 'text-green-700 bg-green-100' : 'text-red-600 bg-red-50'}`}>
                                                    {isResolved && <CheckCircle2 className="w-3 h-3 inline mr-1" />}
                                                    {exc.exceptions || 'Unknown Issue'}
                                                </div>
                                            </div>
                                            {['under review', 'calculated'].includes(selectedRun.currentStatus) && !isResolved && (
                                                <Button
                                                    variant="outline"
                                                    className="mt-4 md:mt-0 border-yellow-500 text-yellow-700 hover:bg-yellow-50"
                                                    onClick={() => { setSelectedException(exc); setShowResolveDialog(true); }}
                                                >
                                                    Resolve Issue
                                                </Button>
                                            )}
                                        </div>
                                    );
                                })}
                            </div>
                        )}
                    </CardContent>
                </Card>

                {/* Employee List Summary */}
                <Card>
                    <CardHeader>
                        <CardTitle>Run Summary</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <dl className="grid grid-cols-1 md:grid-cols-3 gap-6">
                            <div className="bg-gray-50 p-4 rounded-lg">
                                <dt className="text-sm text-gray-500">Total Employees</dt>
                                <dd className="text-2xl font-bold text-gray-900">{selectedRun.employeeCount}</dd>
                            </div>
                            <div className="bg-gray-50 p-4 rounded-lg">
                                <dt className="text-sm text-gray-500">Total Net Pay</dt>
                                <dd className="text-2xl font-bold text-blue-600">
                                    {new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(selectedRun.totalAmount)}
                                </dd>
                            </div>
                            <div className="bg-gray-50 p-4 rounded-lg">
                                <dt className="text-sm text-gray-500">Created By</dt>
                                <dd className="text-lg font-medium text-gray-900">{selectedRun.createdBy}</dd>
                            </div>
                        </dl>
                    </CardContent>
                </Card>

                {/* Resolve Dialog */}
                <Dialog open={showResolveDialog} onOpenChange={setShowResolveDialog}>
                    <DialogContent>
                        <DialogHeader>
                            <DialogTitle>Resolve Anomaly</DialogTitle>
                            <DialogDescription>
                                Decide how to handle the exception for <strong>{selectedException?.employeeName}</strong>.
                            </DialogDescription>
                        </DialogHeader>
                        <div className="space-y-4 py-4">
                            <div className="space-y-2">
                                <Label>Resolution Action</Label>
                                <Select onValueChange={setResolutionAction}>
                                    <SelectTrigger>
                                        <SelectValue placeholder="Select action..." />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="DEFER_TO_NEXT_RUN">Defer to Next Run (Remove from this cycle)</SelectItem>
                                        <SelectItem value="OVERRIDE_PAYMENT_METHOD">Override Payment Method (Pay via Cheque/Cash)</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>

                            {resolutionAction === 'OVERRIDE_PAYMENT_METHOD' && (
                                <div className="space-y-2">
                                    <Label>Payment Method</Label>
                                    <Select value={paymentMethod} onValueChange={setPaymentMethod}>
                                        <SelectTrigger>
                                            <SelectValue placeholder="Select method..." />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="CHEQUE">Cheque</SelectItem>
                                            <SelectItem value="CASH">Cash</SelectItem>
                                            <SelectItem value="WIRE_TRANSFER">Wire Transfer</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
                            )}

                            <div className="space-y-2">
                                <Label>Justification</Label>
                                <Textarea
                                    placeholder="Explain why this action is being taken..."
                                    value={resolutionJustification}
                                    onChange={(e) => setResolutionJustification(e.target.value)}
                                />
                            </div>
                        </div>
                        <DialogFooter>
                            <Button variant="outline" onClick={() => setShowResolveDialog(false)}>Cancel</Button>
                            <Button onClick={handleResolveAnomaly} disabled={!resolutionAction || isProcessing}>
                                {isProcessing ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Confirm Resolution'}
                            </Button>
                        </DialogFooter>
                    </DialogContent>
                </Dialog>

                {/* Reject Dialog */}
                <Dialog open={showRejectDialog} onOpenChange={setShowRejectDialog}>
                    <DialogContent>
                        <DialogHeader>
                            <DialogTitle className="text-red-600">Reject Payroll Run</DialogTitle>
                            <DialogDescription>
                                This will send the payroll run back to the specialist for correction.
                            </DialogDescription>
                        </DialogHeader>
                        <div className="py-4">
                            <Label>Rejection Reason (Required)</Label>
                            <Textarea
                                className="mt-2"
                                placeholder="Please specify why this run is being rejected..."
                                value={reviewComment}
                                onChange={(e) => setReviewComment(e.target.value)}
                            />
                        </div>
                        <DialogFooter>
                            <Button variant="outline" onClick={() => setShowRejectDialog(false)}>Cancel</Button>
                            <Button variant="destructive" onClick={handleRejectRun} disabled={isProcessing}>
                                {isProcessing ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Reject Run'}
                            </Button>
                        </DialogFooter>
                    </DialogContent>
                </Dialog>
            </div>
        );
    }

    // LIST VIEW
    return (
        <div className="p-6 space-y-6 max-w-7xl mx-auto">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold text-gray-900">Manager Review</h1>
                    <p className="text-gray-500 mt-1">Review payroll runs, resolve anomalies, and approve for payment.</p>
                </div>
                <Button variant="outline" onClick={loadPayrollRuns} disabled={isLoading}>
                    <Loader2 className={`w-4 h-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
                    Refresh
                </Button>
            </div>

            <Card>
                <CardContent className="p-0">
                    <div className="overflow-x-auto">
                        <table className="w-full">
                            <thead className="bg-gray-50 border-b">
                                <tr>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Run ID</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Period</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Anomalies</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Total Amount</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Action</th>
                                </tr>
                            </thead>
                            <tbody className="bg-white divide-y divide-gray-200">
                                {payrollRuns.length === 0 ? (
                                    <tr>
                                        <td colSpan={6} className="px-6 py-12 text-center text-gray-500">
                                            No payroll runs found needing review.
                                        </td>
                                    </tr>
                                ) : (
                                    payrollRuns.map((run) => (
                                        <tr key={run.runId} className="hover:bg-gray-50">
                                            <td className="px-6 py-4 font-medium text-blue-600">{run.runId}</td>
                                            <td className="px-6 py-4 text-sm text-gray-900">
                                                {typeof run.period === 'string' ? run.period : `${run.period.month} ${run.period.year}`}
                                            </td>
                                            <td className="px-6 py-4">{formatStatus(run.currentStatus)}</td>
                                            <td className="px-6 py-4">
                                                {run.totalAnomalies > 0 ? (
                                                    <span className="inline-flex items-center text-red-600 font-medium">
                                                        <AlertTriangle className="w-4 h-4 mr-1" />
                                                        {run.totalAnomalies} Issues
                                                    </span>
                                                ) : (
                                                    <span className="text-green-600 flex items-center">
                                                        <CheckCircle2 className="w-4 h-4 mr-1" />
                                                        Clean
                                                    </span>
                                                )}
                                            </td>
                                            <td className="px-6 py-4 font-semibold">
                                                {new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(run.totalAmount)}
                                            </td>
                                            <td className="px-6 py-4">
                                                <Button size="sm" onClick={() => handleViewRun(run)}>
                                                    {run.currentStatus === 'under review' ? 'Review' : 'View Details'}
                                                </Button>
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}
