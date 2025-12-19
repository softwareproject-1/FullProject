'use client';
// Force rebuild


import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
    ArrowLeft,
    Loader2,
    AlertCircle,
    Eye,
    RefreshCw,
    Plus,
    CheckCircle2,
    XCircle,
    PlayCircle,
    Send,
} from 'lucide-react';
import { normalizeRole, SystemRole, hasRole } from '@/utils/roleAccess';
import { payrollExecutionApi } from '@/services/api';
import { toast } from 'sonner';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';

// Types
interface PayrollRun {
    runId: string;
    cycleName: string;
    period: string | { month: string; year: number; startDate: string; endDate: string };
    totalAmount: number;
    currentStatus: 'DRAFT' | 'CALCULATED' | 'UNDER_REVIEW' | 'WAITING_FINANCE' | 'PAID' | 'LOCKED' | 'UNLOCKED';
    paymentStatus: string;
    employeeCount: number;
    totalAnomalies?: number;
    createdAt: string;
    createdBy: string;
}

export default function PayrollHistoryPage() {
    const router = useRouter();
    const [payrollRuns, setPayrollRuns] = useState<PayrollRun[]>([]);
    const [filteredRuns, setFilteredRuns] = useState<PayrollRun[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [statusFilter, setStatusFilter] = useState<string>('all');
    const [entityFilter, setEntityFilter] = useState<string>('all');
    const [userRoles, setUserRoles] = useState<string[]>([]);
    const [isPayrollManager, setIsPayrollManager] = useState(false);
    const [processingId, setProcessingId] = useState<string | null>(null);

    useEffect(() => {
        loadPayrollHistory();

        // Load user roles
        const storedRoles = localStorage.getItem('userRoles');
        if (storedRoles) {
            try {
                const parsedRoles = JSON.parse(storedRoles);
                setUserRoles(parsedRoles);
                setIsPayrollManager(hasRole(parsedRoles, SystemRole.PAYROLL_MANAGER));
            } catch (e) {
                console.error('Error parsing user roles', e);
            }
        }
    }, []);

    useEffect(() => {
        filterRuns();
    }, [statusFilter, entityFilter, payrollRuns]);

    const loadPayrollHistory = async () => {
        try {
            setIsLoading(true);
            const response = await payrollExecutionApi.getPayrollRuns();
            const data = response.data;

            console.log('📊 Payroll history response:', data);
            setPayrollRuns(data || []);
        } catch (error: any) {
            console.error('❌ Error loading payroll history:', error);
            toast.error('Failed to load payroll history');
        } finally {
            setIsLoading(false);
        }
    };

    const filterRuns = () => {
        let filtered = [...payrollRuns];

        if (statusFilter !== 'all') {
            filtered = filtered.filter(run => {
                // Handle case-insensitive comparison and map status names
                const runStatus = run.currentStatus?.toUpperCase();
                const paymentStatus = run.paymentStatus?.toUpperCase();
                console.log('Comparing:', runStatus, 'payment:', paymentStatus, 'with filter:', statusFilter);

                // Map calculated and unlocked to their display equivalents
                if (statusFilter === 'UNDER_REVIEW' && (runStatus === 'CALCULATED' || runStatus === 'UNLOCKED')) {
                    return true;
                }

                // For PAID filter, check both locked status AND paid paymentStatus
                if (statusFilter === 'PAID' && (runStatus === 'LOCKED' || paymentStatus === 'PAID')) {
                    return true;
                }

                return runStatus === statusFilter;
            });
        }

        console.log('Filtered runs:', filtered.length, 'out of', payrollRuns.length);
        setFilteredRuns(filtered);
    };

    const getStatusBadgeStyle = (status: string) => {
        const upperStatus = status?.toUpperCase();
        switch (upperStatus) {
            case 'DRAFT':
                return 'bg-gray-200 text-gray-700 border border-gray-300';
            case 'CALCULATED':
            case 'UNLOCKED':
            case 'UNDER_REVIEW':
                return 'bg-yellow-100 text-yellow-700 border border-yellow-300';
            case 'WAITING_FINANCE':
                return 'bg-yellow-100 text-yellow-700 border border-yellow-300';
            case 'LOCKED':
            case 'PAID':
                return 'bg-green-100 text-green-700 border border-green-300';
            default:
                return 'bg-gray-200 text-gray-700 border border-gray-300';
        }
    };

    const formatStatusText = (status: string) => {
        const upperStatus = status?.toUpperCase();
        const statusMap: { [key: string]: string } = {
            'DRAFT': 'Draft',
            'CALCULATED': 'Pending Manager Approval',
            'UNLOCKED': 'Pending Manager Approval',
            'UNDER_REVIEW': 'Pending Manager Approval',
            'WAITING_FINANCE': 'Pending Manager Approval',
            'LOCKED': 'Paid',
            'PAID': 'Paid',
        };
        return statusMap[upperStatus] || status.replace(/_/g, ' ');
    };

    const formatPeriod = (period: string | { month: string; year: number; startDate: string; endDate: string }) => {
        if (typeof period === 'string') {
            return period;
        }
        if (period && typeof period === 'object') {
            return `${period.year}-${String(period.month).padStart(2, '0')}`;
        }
        return 'N/A';
    };

    const handleViewDetails = (runId: string) => {
        // Navigate to draft review page with runId
        router.push(`/payroll-execution/draft?runId=${runId}`);
    };

    const handleQuickApprove = async (runId: string, e: React.MouseEvent) => {
        e.stopPropagation();
        if (!confirm('Are you sure you want to approve this payroll run? This will forward it to Finance.')) return;

        setProcessingId(runId);
        try {
            await payrollExecutionApi.managerReview(runId, { action: 'APPROVED' });
            toast.success('Payroll run approved successfully');
            loadPayrollHistory();
        } catch (error: any) {
            console.error('Approval failed:', error);
            toast.error(error.response?.data?.message || 'Failed to approve');
        } finally {
            setProcessingId(null);
        }
    };

    const handleQuickReject = async (runId: string, e: React.MouseEvent) => {
        e.stopPropagation();
        if (!confirm('Are you sure you want to reject this payroll run? It will be sent back to Draft.')) return;

        setProcessingId(runId);
        try {
            await payrollExecutionApi.managerReview(runId, { action: 'REJECTED', comment: 'Quick rejection from history' });
            toast.success('Payroll run rejected');
            loadPayrollHistory();
        } catch (error: any) {
            console.error('Rejection failed:', error);
            toast.error(error.response?.data?.message || 'Failed to reject');
        } finally {
            setProcessingId(null);
        }
    };

    return (
        <div className="p-6 space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                    <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => router.push('/payroll-execution')}
                        className="hover:bg-gray-100"
                    >
                        <ArrowLeft className="w-4 h-4 mr-2" />
                        Back
                    </Button>
                    <div>
                        <h1 className="text-3xl font-bold text-gray-900">Payroll Runs</h1>
                        <p className="text-sm text-gray-500 mt-1">
                            Manage and process payroll runs across all entities
                        </p>
                    </div>
                </div>
                <Button
                    onClick={() => router.push('/payroll-execution')}
                    className="bg-blue-600 hover:bg-blue-700 text-white"
                >
                    <Plus className="w-4 h-4 mr-2" />
                    Create Run
                </Button>
            </div>

            {/* Filters */}
            <div className="flex items-center gap-4">
                <Select value={statusFilter} onValueChange={setStatusFilter}>
                    <SelectTrigger className="w-[200px]">
                        <SelectValue placeholder="All Statuses" />
                    </SelectTrigger>
                    <SelectContent className="bg-white">
                        <SelectItem value="all">All Statuses</SelectItem>
                        <SelectItem value="DRAFT">Draft</SelectItem>
                        <SelectItem value="UNDER_REVIEW">Under Review</SelectItem>
                        <SelectItem value="WAITING_FINANCE">Waiting Finance</SelectItem>
                        <SelectItem value="PAID">Paid</SelectItem>
                    </SelectContent>
                </Select>

                <Select value={entityFilter} onValueChange={setEntityFilter}>
                    <SelectTrigger className="w-[200px]">
                        <SelectValue placeholder="All Entities" />
                    </SelectTrigger>
                    <SelectContent className="bg-white">
                        <SelectItem value="all">All Entities</SelectItem>
                    </SelectContent>
                </Select>

                <Button
                    onClick={loadPayrollHistory}
                    variant="outline"
                    size="sm"
                    disabled={isLoading}
                >
                    <RefreshCw className={`w-4 h-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
                    Refresh
                </Button>

            </div>

            {/* Payroll Runs Table */}
            <Card>
                <CardContent className="p-0">
                    {isLoading ? (
                        <div className="flex items-center justify-center py-12">
                            <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
                        </div>
                    ) : filteredRuns.length === 0 ? (
                        <div className="flex flex-col items-center justify-center py-12 text-gray-500">
                            <AlertCircle className="w-12 h-12 mb-3 text-gray-300" />
                            <p className="text-lg font-medium">No payroll runs found</p>
                            <p className="text-sm">Create your first payroll run to get started</p>
                        </div>
                    ) : (
                        <div className="overflow-x-auto">
                            <table className="w-full">
                                <thead className="bg-gray-50 border-b border-gray-200">
                                    <tr>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                            Run ID / Period
                                        </th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                            Entity
                                        </th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                            Status
                                        </th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                            Employees / Exceptions
                                        </th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                            Total Net Pay
                                        </th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                            Created By / Date
                                        </th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                            Actions
                                        </th>
                                    </tr>
                                </thead>
                                <tbody className="bg-white divide-y divide-gray-200">
                                    {filteredRuns.map((run) => (
                                        <tr key={run.runId} className="hover:bg-gray-50 transition-colors">
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <div className="text-sm font-semibold text-blue-600">{run.runId}</div>
                                                <div className="text-xs text-gray-500">{formatPeriod(run.period)}</div>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <span className="text-sm text-gray-900">{run.cycleName || 'Company A (US)'}</span>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <Badge
                                                    variant="secondary"
                                                    className={getStatusBadgeStyle(run.currentStatus)}
                                                >
                                                    {formatStatusText(run.currentStatus)}
                                                </Badge>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <div className="flex items-center gap-2">
                                                    <span className="inline-flex items-center text-sm text-green-600">
                                                        <span className="mr-1">✓</span> {run.employeeCount}
                                                    </span>
                                                    <span className="inline-flex items-center text-sm text-yellow-600">
                                                        <span className="mr-1">⚠</span> {run.totalAnomalies || 0}
                                                    </span>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <span className="text-sm font-semibold text-gray-900">
                                                    USD {run.totalAmount.toLocaleString()}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <div className="text-sm text-gray-900">{run.createdBy || 'Sarah Johnson'}</div>
                                                <div className="text-xs text-gray-500">
                                                    {new Date(run.createdAt).toLocaleDateString()}
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap">

                                                <div className="flex items-center gap-2">
                                                    <Button
                                                        size="sm"
                                                        variant="ghost"
                                                        onClick={() => handleViewDetails(run.runId)}
                                                        className="hover:bg-blue-50 text-blue-600"
                                                        title={run.currentStatus === 'DRAFT' ? "Process / Edit" : "View Details"}
                                                    >
                                                        {run.currentStatus === 'DRAFT' ? <PlayCircle className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                                                    </Button>

                                                    {/* Manager Actions */}
                                                    {isPayrollManager && (run.currentStatus === 'CALCULATED' || run.currentStatus === 'UNDER_REVIEW') && (
                                                        <>
                                                            <Button
                                                                size="sm"
                                                                variant="ghost"
                                                                onClick={(e) => handleQuickApprove(run.runId, e)}
                                                                disabled={processingId === run.runId}
                                                                className="hover:bg-green-50 text-green-600"
                                                                title="Approve"
                                                            >
                                                                {processingId === run.runId ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle2 className="w-4 h-4" />}
                                                            </Button>
                                                            <Button
                                                                size="sm"
                                                                variant="ghost"
                                                                onClick={(e) => handleQuickReject(run.runId, e)}
                                                                disabled={processingId === run.runId}
                                                                className="hover:bg-red-50 text-red-600"
                                                                title="Reject"
                                                            >
                                                                {processingId === run.runId ? <Loader2 className="w-4 h-4 animate-spin" /> : <XCircle className="w-4 h-4" />}
                                                            </Button>
                                                        </>
                                                    )}
                                                </div>
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
