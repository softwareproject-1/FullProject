'use client'

import { useState, useEffect, useCallback } from 'react';
import { Card } from '../../components/Card';
import { StatusBadge } from '../../components/StatusBadge';
import { Modal } from '../../components/Modal';
import RouteGuard from '../../components/RouteGuard';
import {
  UserMinus,
  FileText,
  Key,
  Package,
  RefreshCw,
  ClipboardCheck,
  ClipboardList,
  DollarSign,
  AlertTriangle,
  CheckCircle2,
  Clock,
  XCircle,
  Building2,
  User,
  Calendar,
  Send,
  Eye,
  Trash2,
  Shield,
  Wallet,
  MessageSquare,
} from 'lucide-react';
import { offboardingApi, employeeProfileApi } from '../../services/api';
import { useAuth } from '@/contexts/AuthContext';
import {
  TerminationRequest,
  ClearanceChecklist,
  TerminationStatus,
  TerminationInitiation,
  ApprovalStatus,
  CompleteSettlementData,
  LeaveBalanceForSettlement,
  EmployeePerformanceData,
} from '../../lib/types';

// Import components
import { TerminationReviewModal } from './components/TerminationReviewModal';
import { ResignationForm } from './components/ResignationForm';
import { ResignationTracker } from './components/ResignationTracker';
import { ClearanceChecklistView } from './components/ClearanceChecklistView';
import { AccessRevocationPanel } from './components/AccessRevocationPanel';
import { SettlementSummary } from './components/SettlementSummary';
import { ExitInterviewScheduler } from './components/ExitInterviewScheduler';
import { OffboardingChecklistManager } from './components/OffboardingChecklistManager';
import { FullOffboardingView } from './components/FullOffboardingView';
import { Workflow } from 'lucide-react';

// Helper function to get status color
function getStatusColor(status: TerminationStatus): string {
  switch (status) {
    case TerminationStatus.PENDING:
      return 'bg-yellow-100 text-yellow-800';
    case TerminationStatus.UNDER_REVIEW:
      return 'bg-blue-100 text-blue-800';
    case TerminationStatus.APPROVED:
      return 'bg-green-100 text-green-800';
    case TerminationStatus.REJECTED:
      return 'bg-red-100 text-red-800';
    default:
      return 'bg-gray-100 text-gray-800';
  }
}

// Helper function to get initiator display name
function getInitiatorDisplay(initiator: TerminationInitiation): string {
  switch (initiator) {
    case TerminationInitiation.EMPLOYEE:
      return 'Employee (Resignation)';
    case TerminationInitiation.HR:
      return 'HR Initiated';
    case TerminationInitiation.MANAGER:
      return 'Manager Initiated';
    default:
      return initiator;
  }
}

// Helper function to calculate checklist progress
function calculateChecklistProgress(checklist: ClearanceChecklist | null): { completed: number; total: number; percentage: number } {
  if (!checklist || !checklist.items) {
    return { completed: 0, total: 0, percentage: 0 };
  }

  const total = checklist.items.length;
  const completed = checklist.items.filter(item => item.status === ApprovalStatus.APPROVED).length;
  const percentage = total > 0 ? Math.round((completed / total) * 100) : 0;

  return { completed, total, percentage };
}

export default function Offboarding() {
  const { user, isHRManager, isHREmployee, isSystemAdmin } = useAuth();
  const isHR = isHRManager() || isHREmployee() || isSystemAdmin();

  // Tab state
  const [currentTab, setCurrentTab] = useState<'dashboard' | 'full-offboarding' | 'terminations' | 'resignations' | 'approvals' | 'clearance' | 'checklist' | 'exit-interview' | 'settlement'>('dashboard');

  // Data states
  const [pendingTerminations, setPendingTerminations] = useState<TerminationRequest[]>([]);
  const [myResignations, setMyResignations] = useState<TerminationRequest[]>([]);
  const [pendingSettlements, setPendingSettlements] = useState<TerminationRequest[]>([]);
  const [employees, setEmployees] = useState<any[]>([]);

  // Selected case for detail view
  const [selectedTermination, setSelectedTermination] = useState<TerminationRequest | null>(null);
  const [selectedChecklist, setSelectedChecklist] = useState<ClearanceChecklist | null>(null);
  const [checklistsMap, setChecklistsMap] = useState<Record<string, ClearanceChecklist>>({});

  // Modal states
  const [isTerminationModalOpen, setIsTerminationModalOpen] = useState(false);
  const [isResignationModalOpen, setIsResignationModalOpen] = useState(false);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
  const [isClearanceModalOpen, setIsClearanceModalOpen] = useState(false);
  const [isSettlementModalOpen, setIsSettlementModalOpen] = useState(false);
  const [isAccessModalOpen, setIsAccessModalOpen] = useState(false);

  // UI states
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // Fetch data functions
  const fetchPendingTerminations = useCallback(async () => {
    try {
      const response = await offboardingApi.termination.getPending();
      setPendingTerminations(response.data);
    } catch (err) {
      console.error('Failed to fetch pending terminations:', err);
    }
  }, []);

  const fetchMyResignations = useCallback(async () => {
    if (!user?.id) return;
    try {
      const response = await offboardingApi.resignation.getMy(user.id);
      setMyResignations(response.data);
    } catch (err) {
      console.error('Failed to fetch my resignations:', err);
    }
  }, [user?.id]);

  const fetchPendingSettlements = useCallback(async () => {
    try {
      const response = await offboardingApi.settlement.getPending();
      // Filter out settlements that have been processed (marked in comments)
      const pendingOnly = response.data.filter((t: TerminationRequest) =>
        !t.hrComments?.includes('[System] Final Settlement Processed')
      );
      setPendingSettlements(pendingOnly);
    } catch (err) {
      console.error('Failed to fetch pending settlements:', err);
    }
  }, []);

  const fetchChecklistsForApproved = useCallback(async () => {
    try {
      const approvedCases = pendingTerminations.filter(t => t.status === TerminationStatus.APPROVED);
      const checklistPromises = approvedCases.map(async (termination) => {
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
    }
  }, [pendingTerminations]);

  const fetchEmployees = useCallback(async () => {
    try {
      const response = await employeeProfileApi.getAll();
      setEmployees(response.data);
    } catch (err) {
      console.error('Failed to fetch employees:', err);
    }
  }, []);

  const refreshData = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      await Promise.all([
        fetchPendingTerminations(),
        fetchMyResignations(),
        fetchPendingSettlements(),
        fetchEmployees(),
      ]);
    } catch (err) {
      setError('Failed to refresh data. Please try again.');
    } finally {
      setIsLoading(false);
    }
  }, [fetchPendingTerminations, fetchMyResignations, fetchPendingSettlements, fetchEmployees]);

  // Load data on mount and when user changes
  useEffect(() => {
    refreshData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.id]);

  // Fetch checklists when approved cases change
  useEffect(() => {
    if (currentTab === 'clearance' && pendingTerminations.length > 0) {
      fetchChecklistsForApproved();
    }
  }, [currentTab, pendingTerminations.length, fetchChecklistsForApproved]);

  // Load checklist for a termination
  const loadChecklist = useCallback(async (terminationId: string) => {
    try {
      const response = await offboardingApi.checklist.getByTermination(terminationId);
      setSelectedChecklist(response.data);
    } catch (err: any) {
      if (err.response?.status === 404) {
        setSelectedChecklist(null);
      } else {
        console.error('Failed to load checklist:', err);
      }
    }
  }, []);

  // Handle termination detail view
  const handleViewTermination = async (termination: TerminationRequest) => {
    setSelectedTermination(termination);
    await loadChecklist(termination._id);
    setIsDetailModalOpen(true);
  };

  // Handle create checklist
  const handleCreateChecklist = async (terminationId: string) => {
    try {
      const response = await offboardingApi.checklist.create({
        terminationId,
        hrManagerId: user?.id,
      });
      setSelectedChecklist(response.data);
      setSuccessMessage('Offboarding checklist created successfully');
      setTimeout(() => setSuccessMessage(null), 3000);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to create checklist');
    }
  };

  // Tab configuration
  const tabs = [
    { id: 'dashboard', label: 'Dashboard', icon: <ClipboardCheck className="w-4 h-4" /> },
    ...(isHR ? [{ id: 'full-offboarding', label: 'Full Offboarding', icon: <Workflow className="w-4 h-4" /> }] : []),
    ...(isHR ? [{ id: 'terminations', label: 'Terminations', icon: <UserMinus className="w-4 h-4" /> }] : []),
    { id: 'resignations', label: 'My Resignations', icon: <FileText className="w-4 h-4" /> },
    ...(isHR ? [{ id: 'approvals', label: 'Pending Approvals', icon: <Clock className="w-4 h-4" /> }] : []),
    ...(isHR ? [{ id: 'clearance', label: 'Clearance', icon: <CheckCircle2 className="w-4 h-4" /> }] : []),
    ...(isHR ? [{ id: 'checklist', label: 'Checklist', icon: <ClipboardList className="w-4 h-4" /> }] : []),
    ...(isHR ? [{ id: 'exit-interview', label: 'Exit Interview', icon: <MessageSquare className="w-4 h-4" /> }] : []),
    ...(isHR ? [{ id: 'settlement', label: 'Settlement', icon: <DollarSign className="w-4 h-4" /> }] : []),
  ];

  // Stats for dashboard
  const stats = {
    pendingTerminations: pendingTerminations.filter(t => t.status === TerminationStatus.PENDING).length,
    underReview: pendingTerminations.filter(t => t.status === TerminationStatus.UNDER_REVIEW).length,
    approved: pendingTerminations.filter(t => t.status === TerminationStatus.APPROVED).length,
    pendingSettlements: pendingSettlements.length,
  };

  return (
    <RouteGuard
      requiredRoles={['System Admin', 'HR Admin', 'HR Manager', 'HR Employee', 'Dept. Employee']}
      requiredFeatures={['manageOffboarding', 'viewOffboarding']}
    >
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-slate-900 mb-2">Offboarding Management</h1>
            <p className="text-slate-600">Manage terminations, resignations, clearance, and final settlements</p>
          </div>
          <button
            onClick={refreshData}
            disabled={isLoading}
            className="flex items-center gap-2 px-4 py-2 bg-slate-100 text-slate-700 rounded-lg hover:bg-slate-200 transition-colors disabled:opacity-50"
          >
            <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
            Refresh
          </button>
        </div>

        {/* Error/Success Messages */}
        {error && (
          <div className="p-4 bg-red-50 border border-red-200 rounded-lg flex items-center gap-3">
            <AlertTriangle className="w-5 h-5 text-red-600" />
            <p className="text-red-700">{error}</p>
            <button onClick={() => setError(null)} className="ml-auto text-red-600 hover:text-red-800">
              <XCircle className="w-5 h-5" />
            </button>
          </div>
        )}

        {successMessage && (
          <div className="p-4 bg-green-50 border border-green-200 rounded-lg flex items-center gap-3">
            <CheckCircle2 className="w-5 h-5 text-green-600" />
            <p className="text-green-700">{successMessage}</p>
          </div>
        )}

        {/* Tab Navigation */}
        <div className="flex gap-2 border-b border-slate-200 pb-2 overflow-x-auto">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setCurrentTab(tab.id as any)}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg whitespace-nowrap transition-colors ${currentTab === tab.id
                ? 'bg-slate-900 text-white'
                : 'text-slate-600 hover:bg-slate-100'
                }`}
            >
              {tab.icon}
              {tab.label}
            </button>
          ))}
        </div>

        {/* Dashboard Tab */}
        {currentTab === 'dashboard' && (
          <div className="space-y-6">
            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <Card>
                <div className="flex items-center gap-4">
                  <div className="p-3 bg-yellow-100 rounded-lg">
                    <Clock className="w-6 h-6 text-yellow-600" />
                  </div>
                  <div>
                    <p className="text-sm text-slate-600">Pending</p>
                    <p className="text-2xl font-bold text-slate-900">{stats.pendingTerminations}</p>
                  </div>
                </div>
              </Card>
              <Card>
                <div className="flex items-center gap-4">
                  <div className="p-3 bg-blue-100 rounded-lg">
                    <Eye className="w-6 h-6 text-blue-600" />
                  </div>
                  <div>
                    <p className="text-sm text-slate-600">Under Review</p>
                    <p className="text-2xl font-bold text-slate-900">{stats.underReview}</p>
                  </div>
                </div>
              </Card>
              <Card>
                <div className="flex items-center gap-4">
                  <div className="p-3 bg-green-100 rounded-lg">
                    <CheckCircle2 className="w-6 h-6 text-green-600" />
                  </div>
                  <div>
                    <p className="text-sm text-slate-600">Approved</p>
                    <p className="text-2xl font-bold text-slate-900">{stats.approved}</p>
                  </div>
                </div>
              </Card>
              <Card>
                <div className="flex items-center gap-4">
                  <div className="p-3 bg-purple-100 rounded-lg">
                    <Wallet className="w-6 h-6 text-purple-600" />
                  </div>
                  <div>
                    <p className="text-sm text-slate-600">Pending Settlements</p>
                    <p className="text-2xl font-bold text-slate-900">{stats.pendingSettlements}</p>
                  </div>
                </div>
              </Card>
            </div>

            {/* Quick Actions */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {isHR && (
                <Card title="HR Actions">
                  <div className="space-y-3">
                    <button
                      onClick={() => setIsTerminationModalOpen(true)}
                      className="w-full flex items-center gap-3 px-4 py-3 bg-red-50 text-red-700 rounded-lg hover:bg-red-100 transition-colors"
                    >
                      <UserMinus className="w-5 h-5" />
                      <span>Initiate Termination Review</span>
                    </button>
                    <button
                      onClick={() => setCurrentTab('approvals')}
                      className="w-full flex items-center gap-3 px-4 py-3 bg-blue-50 text-blue-700 rounded-lg hover:bg-blue-100 transition-colors"
                    >
                      <FileText className="w-5 h-5" />
                      <span>Review Pending Approvals ({stats.pendingTerminations + stats.underReview})</span>
                    </button>
                    <button
                      onClick={() => setCurrentTab('exit-interview')}
                      className="w-full flex items-center gap-3 px-4 py-3 bg-teal-50 text-teal-700 rounded-lg hover:bg-teal-100 transition-colors"
                    >
                      <MessageSquare className="w-5 h-5" />
                      <span>Schedule Exit Interviews ({stats.approved})</span>
                    </button>
                    <button
                      onClick={() => setCurrentTab('settlement')}
                      className="w-full flex items-center gap-3 px-4 py-3 bg-purple-50 text-purple-700 rounded-lg hover:bg-purple-100 transition-colors"
                    >
                      <DollarSign className="w-5 h-5" />
                      <span>Process Settlements ({stats.pendingSettlements})</span>
                    </button>
                  </div>
                </Card>
              )}
              <Card title="Employee Actions">
                <div className="space-y-3">
                  <button
                    onClick={() => setIsResignationModalOpen(true)}
                    className="w-full flex items-center gap-3 px-4 py-3 bg-amber-50 text-amber-700 rounded-lg hover:bg-amber-100 transition-colors"
                  >
                    <FileText className="w-5 h-5" />
                    <span>Submit Resignation Request</span>
                  </button>
                  <button
                    onClick={() => setCurrentTab('resignations')}
                    className="w-full flex items-center gap-3 px-4 py-3 bg-slate-50 text-slate-700 rounded-lg hover:bg-slate-100 transition-colors"
                  >
                    <Eye className="w-5 h-5" />
                    <span>Track My Resignations</span>
                  </button>
                </div>
              </Card>
            </div>

            {/* Recent Cases */}
            <Card title="Recent Offboarding Cases">
              {pendingTerminations.length === 0 ? (
                <p className="text-slate-500 text-center py-8">No active offboarding cases</p>
              ) : (
                <div className="space-y-3">
                  {pendingTerminations.slice(0, 5).map((termination) => (
                    <div
                      key={termination._id}
                      className="flex items-center justify-between p-4 bg-slate-50 rounded-lg hover:bg-slate-100 transition-colors cursor-pointer"
                      onClick={() => handleViewTermination(termination)}
                    >
                      <div className="flex items-center gap-4">
                        <div className="p-2 bg-white rounded-lg shadow-sm">
                          <User className="w-5 h-5 text-slate-600" />
                        </div>
                        <div>
                          <p className="font-medium text-slate-900">
                            Employee: {termination.employeeId.slice(-6).toUpperCase()}
                          </p>
                          <p className="text-sm text-slate-600">{getInitiatorDisplay(termination.initiator)}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        <span className={`px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(termination.status)}`}>
                          {termination.status.replace('_', ' ').toUpperCase()}
                        </span>
                        <Eye className="w-4 h-4 text-slate-400" />
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </Card>
          </div>
        )}

        {/* Full Offboarding Tab (HR Only) - Complete Workflow View */}
        {currentTab === 'full-offboarding' && isHR && (
          <FullOffboardingView
            terminations={[...pendingTerminations, ...pendingSettlements].filter((v, i, a) => a.findIndex(t => (t._id === v._id)) === i)}
            userId={user?.id || ''}
            isHR={isHR}
            isSystemAdmin={isSystemAdmin()}
            onRefresh={refreshData}
            onViewDetails={(termination) => handleViewTermination(termination)}
            onManageClearance={async (termination) => {
              setSelectedTermination(termination);
              await loadChecklist(termination._id);
              setIsClearanceModalOpen(true);
            }}
            onProcessSettlement={(termination) => {
              setSelectedTermination(termination);
              setIsSettlementModalOpen(true);
            }}
            onSuccess={(msg) => {
              setSuccessMessage(msg);
              fetchPendingSettlements(); // Refresh list to remove settled item
              setTimeout(() => setSuccessMessage(null), 3000);
            }}
            onError={(msg) => setError(msg)}
          />
        )}

        {/* Terminations Tab (HR Only) - OFF-001 */}
        {currentTab === 'terminations' && isHR && (
          <div className="space-y-6">
            <div className="flex justify-end">
              <button
                onClick={() => setIsTerminationModalOpen(true)}
                className="flex items-center gap-2 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
              >
                <UserMinus className="w-4 h-4" />
                Initiate Termination
              </button>
            </div>

            <Card title="All Termination Cases">
              {pendingTerminations.length === 0 ? (
                <p className="text-slate-500 text-center py-8">No termination cases found</p>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b border-slate-200">
                        <th className="text-left py-3 px-4 text-sm font-medium text-slate-600">Employee</th>
                        <th className="text-left py-3 px-4 text-sm font-medium text-slate-600">Initiator</th>
                        <th className="text-left py-3 px-4 text-sm font-medium text-slate-600">Reason</th>
                        <th className="text-left py-3 px-4 text-sm font-medium text-slate-600">Status</th>
                        <th className="text-left py-3 px-4 text-sm font-medium text-slate-600">Date</th>
                        <th className="text-left py-3 px-4 text-sm font-medium text-slate-600">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {pendingTerminations.map((termination) => (
                        <tr key={termination._id} className="border-b border-slate-100 hover:bg-slate-50">
                          <td className="py-3 px-4">
                            <span className="font-mono text-sm">{termination.employeeId.slice(-6).toUpperCase()}</span>
                          </td>
                          <td className="py-3 px-4">
                            <span className="text-sm">{getInitiatorDisplay(termination.initiator)}</span>
                          </td>
                          <td className="py-3 px-4">
                            <span className="text-sm text-slate-600 truncate max-w-xs block">{termination.reason}</span>
                          </td>
                          <td className="py-3 px-4">
                            <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(termination.status)}`}>
                              {termination.status.replace('_', ' ')}
                            </span>
                          </td>
                          <td className="py-3 px-4">
                            <span className="text-sm text-slate-600">
                              {new Date(termination.createdAt).toLocaleDateString()}
                            </span>
                          </td>
                          <td className="py-3 px-4">
                            <button
                              onClick={() => handleViewTermination(termination)}
                              className="text-blue-600 hover:text-blue-800"
                            >
                              <Eye className="w-4 h-4" />
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </Card>
          </div>
        )}

        {/* Resignations Tab - OFF-018/019 */}
        {currentTab === 'resignations' && (
          <div className="space-y-6">
            <div className="flex justify-end">
              <button
                onClick={() => setIsResignationModalOpen(true)}
                className="flex items-center gap-2 px-4 py-2 bg-amber-600 text-white rounded-lg hover:bg-amber-700 transition-colors"
              >
                <FileText className="w-4 h-4" />
                Submit Resignation
              </button>
            </div>

            <ResignationTracker
              resignations={myResignations}
              onRefresh={fetchMyResignations}
            />
          </div>
        )}

        {/* Pending Approvals Tab (HR Only) */}
        {currentTab === 'approvals' && isHR && (
          <div className="space-y-6">
            <Card title="Pending Resignation Approvals">
              {pendingTerminations.filter(t =>
                t.initiator === TerminationInitiation.EMPLOYEE &&
                (t.status === TerminationStatus.PENDING || t.status === TerminationStatus.UNDER_REVIEW)
              ).length === 0 ? (
                <p className="text-slate-500 text-center py-8">No pending approvals</p>
              ) : (
                <div className="space-y-4">
                  {pendingTerminations
                    .filter(t =>
                      t.initiator === TerminationInitiation.EMPLOYEE &&
                      (t.status === TerminationStatus.PENDING || t.status === TerminationStatus.UNDER_REVIEW)
                    )
                    .map((termination) => (
                      <div
                        key={termination._id}
                        className="p-4 border border-slate-200 rounded-lg"
                      >
                        <div className="flex items-center justify-between mb-3">
                          <div>
                            <p className="font-medium text-slate-900">
                              Resignation Request - {termination.employeeId.slice(-6).toUpperCase()}
                            </p>
                            <p className="text-sm text-slate-600">
                              Submitted: {new Date(termination.createdAt).toLocaleDateString()}
                            </p>
                          </div>
                          <span className={`px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(termination.status)}`}>
                            {termination.status.replace('_', ' ')}
                          </span>
                        </div>
                        <p className="text-slate-700 mb-4">{termination.reason}</p>
                        {termination.employeeComments && (
                          <p className="text-sm text-slate-600 mb-4 italic">"{termination.employeeComments}"</p>
                        )}
                        <div className="flex gap-2">
                          <button
                            onClick={async () => {
                              try {
                                await offboardingApi.resignation.review(termination._id, {
                                  status: TerminationStatus.APPROVED,
                                  hrComments: 'Resignation approved',
                                });
                                setSuccessMessage('Resignation approved successfully');
                                fetchPendingTerminations();
                              } catch (err: any) {
                                setError(err.response?.data?.message || 'Failed to approve');
                              }
                            }}
                            className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
                          >
                            Approve
                          </button>
                          <button
                            onClick={async () => {
                              try {
                                await offboardingApi.resignation.review(termination._id, {
                                  status: TerminationStatus.REJECTED,
                                  hrComments: 'Resignation rejected',
                                });
                                setSuccessMessage('Resignation rejected');
                                fetchPendingTerminations();
                              } catch (err: any) {
                                setError(err.response?.data?.message || 'Failed to reject');
                              }
                            }}
                            className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
                          >
                            Reject
                          </button>
                          <button
                            onClick={() => handleViewTermination(termination)}
                            className="px-4 py-2 border border-slate-300 text-slate-700 rounded-lg hover:bg-slate-50 transition-colors"
                          >
                            View Details
                          </button>
                        </div>
                      </div>
                    ))}
                </div>
              )}
            </Card>
          </div>
        )}

        {/* Clearance Tab (HR & System Admin) - OFF-006/010 */}
        {currentTab === 'clearance' && isHR && (
          <div className="space-y-6">
            {/* System Admin Info Banner */}
            {isSystemAdmin() && (
              <div className="p-4 bg-gradient-to-r from-purple-50 to-indigo-50 border-l-4 border-purple-600 rounded-lg">
                <div className="flex items-start gap-3">
                  <Shield className="w-5 h-5 text-purple-600 flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="font-semibold text-purple-900">System Admin - Access Revocation Authority</p>
                    <p className="text-sm text-purple-700 mt-1">
                      As System Admin, you have the authority to revoke system and account access for terminated employees.
                      Use the <strong>"Access Revocation"</strong> button on approved cases to manage IT system access.
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* Pending Termination Reviews */}
            <Card title="⏳ Pending Termination Reviews">
              <p className="text-sm text-slate-600 mb-4">
                Review termination requests before creating clearance checklists
              </p>
              {pendingTerminations.filter(t =>
                t.status === TerminationStatus.PENDING ||
                t.status === TerminationStatus.UNDER_REVIEW
              ).length === 0 ? (
                <p className="text-slate-500 text-center py-6">No pending termination reviews</p>
              ) : (
                <div className="space-y-3">
                  {pendingTerminations
                    .filter(t =>
                      t.status === TerminationStatus.PENDING ||
                      t.status === TerminationStatus.UNDER_REVIEW
                    )
                    .map((termination) => (
                      <div
                        key={termination._id}
                        className="p-5 border-2 border-yellow-300 rounded-xl bg-gradient-to-br from-yellow-50 to-amber-50 shadow-sm hover:shadow-md transition-all"
                      >
                        <div className="flex items-center justify-between mb-3">
                          <div>
                            <p className="font-semibold text-slate-900 text-lg">
                              Employee: {termination.employeeId.slice(-6).toUpperCase()}
                            </p>
                            <p className="text-sm text-slate-600 font-medium mt-1">{getInitiatorDisplay(termination.initiator)}</p>
                            <p className="text-sm text-slate-600 mt-1">
                              <span className="font-medium">Reason:</span> {termination.reason}
                            </p>
                          </div>
                          <StatusBadge status={termination.status} />
                        </div>
                        <div className="flex gap-2 mt-3">
                          <button
                            onClick={async () => {
                              try {
                                await offboardingApi.resignation.review(termination._id, {
                                  status: TerminationStatus.APPROVED,
                                  hrComments: 'Approved for clearance processing',
                                });
                                setSuccessMessage('Termination approved - ready for clearance');
                                fetchPendingTerminations();
                                fetchChecklistsForApproved();
                              } catch (err: any) {
                                setError(err.response?.data?.message || 'Failed to approve');
                              }
                            }}
                            className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 text-sm"
                          >
                            Approve & Start Clearance
                          </button>
                          <button
                            onClick={() => handleViewTermination(termination)}
                            className="px-4 py-2 border border-slate-300 text-slate-700 rounded-lg hover:bg-slate-50 text-sm"
                          >
                            Review Details
                          </button>
                        </div>
                      </div>
                    ))}
                </div>
              )}
            </Card>

            {/* Approved Cases Requiring Clearance */}
            <Card title="✅ Approved Cases Requiring Clearance">
              <p className="text-sm text-slate-600 mb-4">
                Track and manage department clearances for approved terminations
              </p>
              {pendingTerminations.filter(t => t.status === TerminationStatus.APPROVED).length === 0 ? (
                <p className="text-slate-500 text-center py-8">No approved cases pending clearance</p>
              ) : (
                <div className="space-y-4">
                  {pendingTerminations
                    .filter(t => t.status === TerminationStatus.APPROVED)
                    .map((termination) => {
                      const checklist = checklistsMap[termination._id];
                      const progress = calculateChecklistProgress(checklist);

                      return (
                        <div
                          key={termination._id}
                          className="p-5 border-2 border-slate-300 rounded-xl bg-white hover:shadow-xl transition-all"
                        >
                          <div className="flex items-center justify-between mb-3">
                            <div className="flex-1">
                              <p className="font-medium text-slate-900">
                                Employee: {termination.employeeId.slice(-6).toUpperCase()}
                              </p>
                              <p className="text-sm text-slate-600">{getInitiatorDisplay(termination.initiator)}</p>
                              {termination.terminationDate && (
                                <p className="text-xs text-slate-500">
                                  Last Day: {new Date(termination.terminationDate).toLocaleDateString()}
                                </p>
                              )}
                            </div>
                            <StatusBadge status="Approved" />
                          </div>

                          {/* Clearance Progress Bar */}
                          {checklist ? (
                            <div className="mb-4">
                              <div className="flex items-center justify-between mb-2">
                                <span className="text-sm font-medium text-slate-700">
                                  Clearance Progress
                                </span>
                                <span className="text-sm text-slate-600">
                                  {progress.completed}/{progress.total} departments cleared
                                </span>
                              </div>
                              <div className="w-full bg-slate-200 rounded-full h-2.5">
                                <div
                                  className={`h-2.5 rounded-full transition-all ${progress.percentage === 100
                                    ? 'bg-green-600'
                                    : progress.percentage > 50
                                      ? 'bg-blue-600'
                                      : 'bg-yellow-500'
                                    }`}
                                  style={{ width: `${progress.percentage}%` }}
                                ></div>
                              </div>
                              <p className="text-xs text-slate-500 mt-1">
                                {progress.percentage === 100
                                  ? '✓ All departments cleared'
                                  : `${progress.percentage}% complete`}
                              </p>

                              {/* Department Exit Clearances Detail */}
                              <div className="mt-4 border-t border-slate-200 pt-3">
                                <p className="text-sm font-medium text-slate-700 mb-2">Department Exit Clearances:</p>
                                <div className="grid grid-cols-2 gap-2">
                                  {checklist.items.map((item, idx) => (
                                    <div
                                      key={idx}
                                      className={`flex items-center justify-between p-2 rounded text-sm ${item.status === ApprovalStatus.APPROVED
                                        ? 'bg-green-50 border border-green-200'
                                        : item.status === ApprovalStatus.REJECTED
                                          ? 'bg-red-50 border border-red-200'
                                          : 'bg-slate-50 border border-slate-200'
                                        }`}
                                    >
                                      <span className="font-medium">{item.department}</span>
                                      <span className={`text-xs px-2 py-0.5 rounded ${item.status === ApprovalStatus.APPROVED
                                        ? 'bg-green-100 text-green-700'
                                        : item.status === ApprovalStatus.REJECTED
                                          ? 'bg-red-100 text-red-700'
                                          : 'bg-yellow-100 text-yellow-700'
                                        }`}>
                                        {item.status === ApprovalStatus.APPROVED ? '✓ Cleared' :
                                          item.status === ApprovalStatus.REJECTED ? '✗ Issue' : 'Pending'}
                                      </span>
                                    </div>
                                  ))}
                                </div>

                                {/* IT Access Revocation Status */}
                                <div className="mt-3 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                                  <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-2">
                                      <Shield className="w-4 h-4 text-blue-600" />
                                      <span className="text-sm font-medium text-blue-900">
                                        IT System Access Status
                                      </span>
                                    </div>
                                    <span className={`text-xs px-2 py-1 rounded font-medium ${checklist.items.find(i => i.department === 'System_Access')?.status === ApprovalStatus.APPROVED
                                      ? 'bg-red-100 text-red-700'
                                      : 'bg-green-100 text-green-700'
                                      }`}>
                                      {checklist.items.find(i => i.department === 'System_Access')?.status === ApprovalStatus.APPROVED
                                        ? '🔒 Access Revoked'
                                        : '✓ Access Active'}
                                    </span>
                                  </div>
                                  {checklist.items.find(i => i.department === 'System_Access')?.updatedBy && (
                                    <p className="text-xs text-blue-700 mt-2">
                                      Revoked by IT on {new Date(
                                        checklist.items.find(i => i.department === 'System_Access')?.updatedAt || ''
                                      ).toLocaleDateString()}
                                    </p>
                                  )}
                                </div>
                              </div>
                            </div>
                          ) : (
                            <div className="mb-4 p-3 bg-amber-50 border border-amber-200 rounded-lg">
                              <p className="text-sm text-amber-800">
                                ⚠️ Clearance checklist not yet created
                              </p>
                            </div>
                          )}

                          <div className="flex gap-2">
                            <button
                              onClick={async () => {
                                setSelectedTermination(termination);
                                await loadChecklist(termination._id);
                                setIsClearanceModalOpen(true);
                              }}
                              className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                            >
                              <ClipboardCheck className="w-4 h-4" />
                              Manage Clearance
                            </button>
                            {isSystemAdmin() && (
                              <button
                                onClick={() => {
                                  setSelectedTermination(termination);
                                  setIsAccessModalOpen(true);
                                }}
                                className="flex items-center gap-2 px-4 py-2 bg-purple-600 text-white hover:bg-purple-700 ring-2 ring-purple-300 shadow-lg font-semibold rounded-lg transition-colors"
                              >
                                <Shield className="w-4 h-4" />
                                🔐 Access Revocation (System Admin)
                              </button>
                            )}
                          </div>
                        </div>
                      );
                    })}
                </div>
              )}
            </Card>
          </div>
        )}

        {/* Checklist Tab (HR Only) */}
        {currentTab === 'checklist' && isHR && (
          <OffboardingChecklistManager
            approvedTerminations={pendingTerminations.filter(t => t.status === TerminationStatus.APPROVED)}
            userId={user?.id || ''}
            onRefresh={refreshData}
            onSuccess={(msg) => {
              setSuccessMessage(msg);
              setTimeout(() => setSuccessMessage(null), 3000);
            }}
            onError={(msg) => setError(msg)}
          />
        )}

        {/* Settlement Tab (HR Only) - OFF-013 */}
        {currentTab === 'settlement' && isHR && (
          <div className="space-y-6">
            <Card title="Pending Final Settlements">
              {pendingSettlements.length === 0 ? (
                <p className="text-slate-500 text-center py-8">No pending settlements</p>
              ) : (
                <div className="space-y-4">
                  {pendingSettlements.map((termination) => (
                    <div
                      key={termination._id}
                      className="p-4 border border-slate-200 rounded-lg"
                    >
                      <div className="flex items-center justify-between mb-3">
                        <div>
                          <p className="font-medium text-slate-900">
                            Employee: {termination.employeeId.slice(-6).toUpperCase()}
                          </p>
                          <p className="text-sm text-slate-600">
                            Termination Date: {termination.terminationDate
                              ? new Date(termination.terminationDate).toLocaleDateString()
                              : 'Not set'}
                          </p>
                        </div>
                        <StatusBadge status={termination.status} />
                      </div>
                      <button
                        onClick={() => {
                          setSelectedTermination(termination);
                          setIsSettlementModalOpen(true);
                        }}
                        className="flex items-center gap-2 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
                      >
                        <DollarSign className="w-4 h-4" />
                        Process Settlement
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </Card>
          </div>
        )}

        {/* Exit Interview Tab (HR Only) - Missing requirement implementation */}
        {currentTab === 'exit-interview' && isHR && (
          <div className="space-y-6">
            <Card title="Exit Interviews">
              <div className="mb-6">
                <p className="text-slate-600 mb-4">
                  Schedule and conduct exit interviews for approved offboarding cases.
                  Exit interviews help gather valuable feedback and improve employee retention.
                </p>
              </div>

              {pendingTerminations.filter(t => t.status === TerminationStatus.APPROVED).length === 0 ? (
                <div className="text-center py-8">
                  <MessageSquare className="w-12 h-12 text-slate-300 mx-auto mb-4" />
                  <p className="text-slate-500">No approved cases requiring exit interviews</p>
                </div>
              ) : (
                <div className="space-y-6">
                  {pendingTerminations
                    .filter(t => t.status === TerminationStatus.APPROVED)
                    .map((termination) => (
                      <div
                        key={termination._id}
                        className="border border-slate-200 rounded-lg p-4"
                      >
                        <div className="flex items-center justify-between mb-4">
                          <div>
                            <p className="font-medium text-slate-900">
                              Employee: {termination.employeeId.slice(-6).toUpperCase()}
                            </p>
                            <p className="text-sm text-slate-600">
                              {getInitiatorDisplay(termination.initiator)} • {' '}
                              Termination Date: {termination.terminationDate
                                ? new Date(termination.terminationDate).toLocaleDateString()
                                : 'Pending'}
                            </p>
                          </div>
                          <StatusBadge status={termination.status} />
                        </div>

                        <ExitInterviewScheduler
                          terminationId={termination._id}
                          employeeId={termination.employeeId}
                          isHR={isHR}
                          onSuccess={(msg) => {
                            setSuccessMessage(msg);
                            setTimeout(() => setSuccessMessage(null), 3000);
                          }}
                          onError={(msg) => setError(msg)}
                        />
                      </div>
                    ))}
                </div>
              )}
            </Card>
          </div>
        )}

        {/* Termination Review Modal - OFF-001 */}
        <TerminationReviewModal
          isOpen={isTerminationModalOpen}
          onClose={() => setIsTerminationModalOpen(false)}
          employees={employees}
          userId={user?.id || ''}
          onSuccess={() => {
            setSuccessMessage('Termination review initiated successfully');
            fetchPendingTerminations();
            setTimeout(() => setSuccessMessage(null), 3000);
          }}
          onError={(msg) => setError(msg)}
        />

        {/* Resignation Form Modal - OFF-018 */}
        <ResignationForm
          isOpen={isResignationModalOpen}
          onClose={() => setIsResignationModalOpen(false)}
          userId={user?.id || ''}
          onSuccess={() => {
            setSuccessMessage('Resignation request submitted successfully');
            fetchMyResignations();
            fetchPendingTerminations();
            setTimeout(() => setSuccessMessage(null), 3000);
          }}
          onError={(msg) => setError(msg)}
        />

        {/* Detail Modal */}
        <Modal
          isOpen={isDetailModalOpen}
          onClose={() => {
            setIsDetailModalOpen(false);
            setSelectedTermination(null);
            setSelectedChecklist(null);
          }}
          title="Offboarding Case Details"
          size="xl"
        >
          {selectedTermination && (
            <div className="space-y-6">
              {/* Basic Info */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm text-slate-600">Employee ID</label>
                  <p className="font-mono">{selectedTermination.employeeId}</p>
                </div>
                <div>
                  <label className="text-sm text-slate-600">Status</label>
                  <p>
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(selectedTermination.status)}`}>
                      {selectedTermination.status.replace('_', ' ')}
                    </span>
                  </p>
                </div>
                <div>
                  <label className="text-sm text-slate-600">Initiator</label>
                  <p>{getInitiatorDisplay(selectedTermination.initiator)}</p>
                </div>
                <div>
                  <label className="text-sm text-slate-600">Created</label>
                  <p>{new Date(selectedTermination.createdAt).toLocaleString()}</p>
                </div>
              </div>

              {/* Reason */}
              <div>
                <label className="text-sm text-slate-600">Reason</label>
                <p className="p-3 bg-slate-50 rounded-lg mt-1">{selectedTermination.reason}</p>
              </div>

              {/* Comments */}
              {selectedTermination.employeeComments && (
                <div>
                  <label className="text-sm text-slate-600">Employee Comments</label>
                  <p className="p-3 bg-slate-50 rounded-lg mt-1 italic">{selectedTermination.employeeComments}</p>
                </div>
              )}
              {selectedTermination.hrComments && (
                <div>
                  <label className="text-sm text-slate-600">HR Comments</label>
                  <p className="p-3 bg-slate-50 rounded-lg mt-1">{selectedTermination.hrComments}</p>
                </div>
              )}

              {/* Checklist Status */}
              {selectedTermination.status === TerminationStatus.APPROVED && (
                <div className="border-t pt-4">
                  <h4 className="font-medium text-slate-900 mb-3">Clearance Checklist</h4>
                  {selectedChecklist ? (
                    <ClearanceChecklistView
                      checklist={selectedChecklist}
                      userId={user?.id || ''}
                      onUpdate={() => loadChecklist(selectedTermination._id)}
                      onError={(msg) => setError(msg)}
                    />
                  ) : (
                    <div className="text-center py-4">
                      <p className="text-slate-600 mb-3">No clearance checklist created yet</p>
                      <button
                        onClick={() => handleCreateChecklist(selectedTermination._id)}
                        className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                      >
                        Create Checklist
                      </button>
                    </div>
                  )}
                </div>
              )}

              {/* Actions for pending cases */}
              {isHR && selectedTermination.status === TerminationStatus.PENDING && (
                <div className="border-t pt-4 flex gap-3">
                  <button
                    onClick={async () => {
                      try {
                        await offboardingApi.termination.updateStatus(selectedTermination._id, {
                          status: TerminationStatus.UNDER_REVIEW,
                          comments: 'Review started',
                        });
                        setSuccessMessage('Case moved to review');
                        fetchPendingTerminations();
                        setIsDetailModalOpen(false);
                      } catch (err: any) {
                        setError(err.response?.data?.message || 'Failed to update status');
                      }
                    }}
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                  >
                    Start Review
                  </button>
                </div>
              )}

              {isHR && selectedTermination.status === TerminationStatus.UNDER_REVIEW && (
                <div className="border-t pt-4 flex gap-3">
                  <button
                    onClick={async () => {
                      try {
                        await offboardingApi.termination.updateStatus(selectedTermination._id, {
                          status: TerminationStatus.APPROVED,
                          comments: 'Approved by HR',
                          terminationDate: new Date().toISOString(),
                        });
                        setSuccessMessage('Termination approved');
                        fetchPendingTerminations();
                        setIsDetailModalOpen(false);
                      } catch (err: any) {
                        setError(err.response?.data?.message || 'Failed to approve');
                      }
                    }}
                    className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
                  >
                    Approve
                  </button>
                  <button
                    onClick={async () => {
                      try {
                        await offboardingApi.termination.updateStatus(selectedTermination._id, {
                          status: TerminationStatus.REJECTED,
                          comments: 'Rejected by HR',
                        });
                        setSuccessMessage('Termination rejected');
                        fetchPendingTerminations();
                        setIsDetailModalOpen(false);
                      } catch (err: any) {
                        setError(err.response?.data?.message || 'Failed to reject');
                      }
                    }}
                    className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
                  >
                    Reject
                  </button>
                </div>
              )}
            </div>
          )}
        </Modal>

        {/* Clearance Modal - OFF-006/010 */}
        <Modal
          isOpen={isClearanceModalOpen}
          onClose={() => {
            setIsClearanceModalOpen(false);
            setSelectedTermination(null);
            setSelectedChecklist(null);
          }}
          title="Clearance Management"
          size="xl"
        >
          {selectedTermination && (
            <div className="space-y-4">
              <div className="p-3 bg-slate-50 rounded-lg">
                <p className="text-sm text-slate-600">Employee ID</p>
                <p className="font-mono font-semibold">{selectedTermination.employeeId.slice(-6).toUpperCase()}</p>
              </div>

              {selectedChecklist ? (
                <ClearanceChecklistView
                  checklist={selectedChecklist}
                  userId={user?.id || ''}
                  onUpdate={async () => {
                    await loadChecklist(selectedTermination._id);
                    await fetchChecklistsForApproved();
                  }}
                  onError={(msg) => setError(msg)}
                />
              ) : (
                <div className="text-center py-8">
                  <p className="text-slate-600 mb-4">Loading checklist...</p>
                  <button
                    onClick={async () => {
                      await loadChecklist(selectedTermination._id);
                    }}
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                  >
                    Reload Checklist
                  </button>
                </div>
              )}
            </div>
          )}
        </Modal>

        {/* Access Revocation Modal - OFF-007 */}
        <Modal
          isOpen={isAccessModalOpen}
          onClose={() => {
            setIsAccessModalOpen(false);
            setSelectedTermination(null);
          }}
          title="Access Revocation"
          size="lg"
        >
          {selectedTermination && (
            <AccessRevocationPanel
              employeeId={selectedTermination.employeeId}
              terminationId={selectedTermination._id}
              onSuccess={(msg) => {
                setSuccessMessage(msg);
                setTimeout(() => setSuccessMessage(null), 3000);
              }}
              onError={(msg) => setError(msg)}
            />
          )}
        </Modal>

        {/* Settlement Modal - OFF-013 */}
        <Modal
          isOpen={isSettlementModalOpen}
          onClose={() => {
            setIsSettlementModalOpen(false);
            setSelectedTermination(null);
          }}
          title="Final Settlement"
          size="xl"
        >
          {selectedTermination && (
            <SettlementSummary
              terminationId={selectedTermination._id}
              employeeId={selectedTermination.employeeId}
              userId={user?.id || ''}
              onSuccess={(msg) => {
                setSuccessMessage(msg);
                fetchPendingSettlements();
                setIsSettlementModalOpen(false);
                setTimeout(() => setSuccessMessage(null), 3000);
              }}
              onError={(msg) => setError(msg)}
            />
          )}
        </Modal>
      </div>
    </RouteGuard>
  );
}
