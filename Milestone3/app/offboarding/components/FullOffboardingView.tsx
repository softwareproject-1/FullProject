'use client'

import { useState, useEffect, useCallback } from 'react';
import { offboardingApi } from '../../../services/api';
import {
    TerminationRequest,
    ClearanceChecklist,
    TerminationStatus,
    TerminationInitiation,
    ApprovalStatus,
} from '../../../lib/types';
import {
    User,
    Calendar,
    FileText,
    CheckCircle2,
    Clock,
    AlertTriangle,
    Shield,
    DollarSign,
    ClipboardList,
    ChevronDown,
    ChevronUp,
    RefreshCw,
    Eye,
} from 'lucide-react';
import { Card } from '../../../components/Card';
import { WorkflowProgress, OffboardingStage } from './WorkflowProgress';

interface FullOffboardingViewProps {
    terminations: TerminationRequest[];
    userId: string;
    isHR: boolean;
    isSystemAdmin: boolean;
    onRefresh: () => void;
    onViewDetails: (termination: TerminationRequest) => void;
    onManageClearance: (termination: TerminationRequest) => void;
    onProcessSettlement: (termination: TerminationRequest) => void;
    onSuccess: (message: string) => void;
    onError: (message: string) => void;
}

function getOffboardingStage(termination: TerminationRequest, checklist: ClearanceChecklist | null): OffboardingStage {
    // Stage 1: Initiation - Pending or Under Review
    if (termination.status === TerminationStatus.PENDING) {
        return OffboardingStage.INITIATION;
    }

    // Stage 2: Approval - Under Review
    if (termination.status === TerminationStatus.UNDER_REVIEW) {
        return OffboardingStage.APPROVAL;
    }

    // If rejected, stay at approval stage
    if (termination.status === TerminationStatus.REJECTED) {
        return OffboardingStage.APPROVAL;
    }

    // Stage 3+: Approved cases
    if (termination.status === TerminationStatus.APPROVED) {
        if (!checklist) {
            return OffboardingStage.CLEARANCE;
        }

        // Check clearance completion
        const allDeptApproved = checklist.items.every(item => item.status === ApprovalStatus.APPROVED);
        const allEquipmentReturned = checklist.equipmentList.every(item => item.returned);
        const clearanceComplete = allDeptApproved && allEquipmentReturned && checklist.cardReturned;

        if (!clearanceComplete) {
            return OffboardingStage.CLEARANCE;
        }

        // Check if access is revoked (look for System_Access item)
        const accessItem = checklist.items.find(item => item.department === 'System_Access');
        if (!accessItem || accessItem.status !== ApprovalStatus.APPROVED) {
            return OffboardingStage.ACCESS_REVOCATION;
        }

        // All done - at settlement stage
        return OffboardingStage.SETTLEMENT;
    }

    return OffboardingStage.INITIATION;
}

function getWorkflowStages(termination: TerminationRequest, checklist: ClearanceChecklist | null) {
    const clearanceProgress = checklist
        ? Math.round((checklist.items.filter(i => i.status === ApprovalStatus.APPROVED).length / Math.max(checklist.items.length, 1)) * 100)
        : 0;

    const accessItem = checklist?.items.find(item => item.department === 'System_Access');

    return {
        initiation: {
            completed: true,
            date: termination.createdAt,
        },
        approval: {
            completed: termination.status === TerminationStatus.APPROVED,
            status: termination.status,
        },
        clearance: {
            completed: checklist ? checklist.items.every(i => i.status === ApprovalStatus.APPROVED) && checklist.cardReturned : false,
            progress: clearanceProgress,
        },
        accessRevocation: {
            completed: accessItem?.status === ApprovalStatus.APPROVED,
            date: accessItem?.updatedAt,
        },
        settlement: {
            completed: false, // This would be tracked separately
        },
    };
}

export function FullOffboardingView({
    terminations,
    userId,
    isHR,
    isSystemAdmin,
    onRefresh,
    onViewDetails,
    onManageClearance,
    onProcessSettlement,
    onSuccess,
    onError,
}: FullOffboardingViewProps) {
    const [checklistsMap, setChecklistsMap] = useState<Record<string, ClearanceChecklist>>({});
    const [expandedCases, setExpandedCases] = useState<Set<string>>(new Set());
    const [isLoading, setIsLoading] = useState(false);

    // Fetch checklists for all terminations
    const fetchChecklists = useCallback(async () => {
        setIsLoading(true);
        try {
            const checklistPromises = terminations.map(async (termination) => {
                try {
                    const response = await offboardingApi.checklist.getByTermination(termination._id);
                    return { id: termination._id, checklist: response.data };
                } catch (err: any) {
                    if (err.response?.status === 404) {
                        return { id: termination._id, checklist: null };
                    }
                    return null;
                }
            });

            const results = await Promise.all(checklistPromises);
            const newChecklistsMap: Record<string, ClearanceChecklist> = {};
            results.forEach(result => {
                if (result && result.checklist) {
                    newChecklistsMap[result.id] = result.checklist;
                }
            });
            setChecklistsMap(newChecklistsMap);
        } catch (err) {
            console.error('Failed to fetch checklists:', err);
        } finally {
            setIsLoading(false);
        }
    }, [terminations]);

    useEffect(() => {
        if (terminations.length > 0) {
            fetchChecklists();
        }
    }, [terminations, fetchChecklists]);

    const toggleExpanded = (id: string) => {
        setExpandedCases(prev => {
            const next = new Set(prev);
            if (next.has(id)) {
                next.delete(id);
            } else {
                next.add(id);
            }
            return next;
        });
    };

    const getStatusColor = (status: TerminationStatus) => {
        switch (status) {
            case TerminationStatus.PENDING:
                return 'bg-yellow-100 text-yellow-800 border-yellow-300';
            case TerminationStatus.UNDER_REVIEW:
                return 'bg-blue-100 text-blue-800 border-blue-300';
            case TerminationStatus.APPROVED:
                return 'bg-green-100 text-green-800 border-green-300';
            case TerminationStatus.REJECTED:
                return 'bg-red-100 text-red-800 border-red-300';
            default:
                return 'bg-slate-100 text-slate-800';
        }
    };

    const getInitiatorLabel = (initiator: TerminationInitiation) => {
        switch (initiator) {
            case TerminationInitiation.EMPLOYEE:
                return { label: 'Resignation', color: 'bg-amber-100 text-amber-800' };
            case TerminationInitiation.HR:
                return { label: 'HR Termination', color: 'bg-red-100 text-red-800' };
            case TerminationInitiation.MANAGER:
                return { label: 'Manager Termination', color: 'bg-purple-100 text-purple-800' };
            default:
                return { label: initiator, color: 'bg-slate-100 text-slate-800' };
        }
    };

    if (terminations.length === 0) {
        return (
            <Card>
                <div className="text-center py-12">
                    <ClipboardList className="w-16 h-16 text-slate-300 mx-auto mb-4" />
                    <h3 className="text-lg font-medium text-slate-900 mb-2">No Offboarding Cases</h3>
                    <p className="text-slate-600">There are no active offboarding cases to display.</p>
                </div>
            </Card>
        );
    }

    return (
        <div className="space-y-6">
            {/* Header with refresh */}
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-lg font-semibold text-slate-900">Full Offboarding Workflow</h2>
                    <p className="text-sm text-slate-600">Track complete offboarding journey for each case</p>
                </div>
                <button
                    onClick={() => {
                        onRefresh();
                        fetchChecklists();
                    }}
                    disabled={isLoading}
                    className="flex items-center gap-2 px-3 py-2 text-sm bg-slate-100 text-slate-700 rounded-lg hover:bg-slate-200 transition-colors"
                >
                    <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
                    Refresh
                </button>
            </div>

            {/* Offboarding Cases */}
            <div className="space-y-4">
                {terminations.map((termination) => {
                    const checklist = checklistsMap[termination._id] || null;
                    const currentStage = getOffboardingStage(termination, checklist);
                    const stages = getWorkflowStages(termination, checklist);
                    const isExpanded = expandedCases.has(termination._id);
                    const initiatorInfo = getInitiatorLabel(termination.initiator);

                    return (
                        <Card key={termination._id}>
                            {/* Header */}
                            <div
                                className="flex items-center justify-between cursor-pointer"
                                onClick={() => toggleExpanded(termination._id)}
                            >
                                <div className="flex items-center gap-4">
                                    <div className="p-3 bg-slate-100 rounded-xl">
                                        <User className="w-6 h-6 text-slate-600" />
                                    </div>
                                    <div>
                                        <div className="flex items-center gap-2">
                                            <h3 className="font-semibold text-slate-900">
                                                Employee: {termination.employeeId.slice(-6).toUpperCase()}
                                            </h3>
                                            <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${initiatorInfo.color}`}>
                                                {initiatorInfo.label}
                                            </span>
                                        </div>
                                        <div className="flex items-center gap-3 mt-1 text-sm text-slate-600">
                                            <span className="flex items-center gap-1">
                                                <Calendar className="w-3.5 h-3.5" />
                                                {new Date(termination.createdAt).toLocaleDateString()}
                                            </span>
                                            {termination.terminationDate && (
                                                <span className="flex items-center gap-1">
                                                    <Clock className="w-3.5 h-3.5" />
                                                    Last Day: {new Date(termination.terminationDate).toLocaleDateString()}
                                                </span>
                                            )}
                                        </div>
                                    </div>
                                </div>

                                <div className="flex items-center gap-3">
                                    <span className={`px-3 py-1 rounded-full text-xs font-medium border ${getStatusColor(termination.status)}`}>
                                        {termination.status.replace('_', ' ').toUpperCase()}
                                    </span>
                                    {isExpanded ? (
                                        <ChevronUp className="w-5 h-5 text-slate-400" />
                                    ) : (
                                        <ChevronDown className="w-5 h-5 text-slate-400" />
                                    )}
                                </div>
                            </div>

                            {/* Expanded Content */}
                            {isExpanded && (
                                <div className="mt-6 pt-6 border-t border-slate-200">
                                    {/* Workflow Progress */}
                                    <div className="mb-6">
                                        <WorkflowProgress
                                            currentStage={currentStage}
                                            stages={stages}
                                            showDetails={true}
                                        />
                                    </div>

                                    {/* Reason */}
                                    <div className="mb-6 p-4 bg-slate-50 rounded-lg">
                                        <div className="flex items-start gap-3">
                                            <FileText className="w-5 h-5 text-slate-500 mt-0.5" />
                                            <div>
                                                <p className="text-sm font-medium text-slate-700">Reason</p>
                                                <p className="text-sm text-slate-600 mt-1">{termination.reason}</p>
                                            </div>
                                        </div>
                                        {termination.employeeComments && (
                                            <div className="mt-3 pl-8">
                                                <p className="text-sm font-medium text-slate-700">Employee Comments</p>
                                                <p className="text-sm text-slate-600 mt-1 italic">"{termination.employeeComments}"</p>
                                            </div>
                                        )}
                                        {termination.hrComments && (
                                            <div className="mt-3 pl-8">
                                                <p className="text-sm font-medium text-slate-700">HR Comments</p>
                                                <p className="text-sm text-slate-600 mt-1">"{termination.hrComments}"</p>
                                            </div>
                                        )}
                                    </div>

                                    {/* Clearance Summary (if checklist exists) */}
                                    {checklist && (
                                        <div className="mb-6 p-4 bg-blue-50 rounded-lg border border-blue-200">
                                            <h4 className="font-medium text-blue-900 mb-3 flex items-center gap-2">
                                                <ClipboardList className="w-4 h-4" />
                                                Clearance Status
                                            </h4>
                                            <div className="grid grid-cols-3 md:grid-cols-6 gap-2">
                                                {checklist.items.map((item, idx) => (
                                                    <div
                                                        key={idx}
                                                        className={`p-2 rounded text-center text-xs ${item.status === ApprovalStatus.APPROVED
                                                                ? 'bg-green-100 text-green-700 border border-green-200'
                                                                : item.status === ApprovalStatus.REJECTED
                                                                    ? 'bg-red-100 text-red-700 border border-red-200'
                                                                    : 'bg-white text-slate-600 border border-slate-200'
                                                            }`}
                                                    >
                                                        <p className="font-medium">{item.department.replace('_', ' ')}</p>
                                                        <p className="mt-0.5">
                                                            {item.status === ApprovalStatus.APPROVED ? '✓' :
                                                                item.status === ApprovalStatus.REJECTED ? '✗' : '⏳'}
                                                        </p>
                                                    </div>
                                                ))}
                                            </div>

                                            {/* Equipment & Card Status */}
                                            <div className="mt-3 flex items-center gap-4 text-xs">
                                                <span className={`px-2 py-1 rounded ${checklist.equipmentList.every(e => e.returned)
                                                        ? 'bg-green-100 text-green-700'
                                                        : 'bg-yellow-100 text-yellow-700'
                                                    }`}>
                                                    Equipment: {checklist.equipmentList.filter(e => e.returned).length}/{checklist.equipmentList.length} returned
                                                </span>
                                                <span className={`px-2 py-1 rounded ${checklist.cardReturned
                                                        ? 'bg-green-100 text-green-700'
                                                        : 'bg-yellow-100 text-yellow-700'
                                                    }`}>
                                                    Access Card: {checklist.cardReturned ? 'Returned' : 'Pending'}
                                                </span>
                                            </div>
                                        </div>
                                    )}

                                    {/* Action Buttons */}
                                    <div className="flex flex-wrap gap-2">
                                        <button
                                            onClick={() => onViewDetails(termination)}
                                            className="flex items-center gap-2 px-4 py-2 text-sm bg-slate-100 text-slate-700 rounded-lg hover:bg-slate-200 transition-colors"
                                        >
                                            <Eye className="w-4 h-4" />
                                            View Details
                                        </button>

                                        {isHR && termination.status === TerminationStatus.APPROVED && (
                                            <button
                                                onClick={() => onManageClearance(termination)}
                                                className="flex items-center gap-2 px-4 py-2 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                                            >
                                                <ClipboardList className="w-4 h-4" />
                                                Manage Clearance
                                            </button>
                                        )}

                                        {isSystemAdmin && termination.status === TerminationStatus.APPROVED && (
                                            <button
                                                onClick={() => onManageClearance(termination)}
                                                className="flex items-center gap-2 px-4 py-2 text-sm bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
                                            >
                                                <Shield className="w-4 h-4" />
                                                Access Revocation
                                            </button>
                                        )}

                                        {isHR && currentStage === OffboardingStage.SETTLEMENT && (
                                            <button
                                                onClick={() => onProcessSettlement(termination)}
                                                className="flex items-center gap-2 px-4 py-2 text-sm bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
                                            >
                                                <DollarSign className="w-4 h-4" />
                                                Process Settlement
                                            </button>
                                        )}
                                    </div>
                                </div>
                            )}
                        </Card>
                    );
                })}
            </div>
        </div>
    );
}

export default FullOffboardingView;
