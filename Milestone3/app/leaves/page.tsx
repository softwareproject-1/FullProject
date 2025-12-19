'use client'

import { useState, useEffect } from 'react';
import { Card } from '../../components/Card';
import { DataTable } from '../../components/DataTable';
import { StatusBadge } from '../../components/StatusBadge';
import { Modal } from '../../components/Modal';
import { Calendar, Plus, Upload, CheckCircle, XCircle, Settings, Clock } from 'lucide-react';
import Link from 'next/link';
import type { LeaveRequest } from '../../lib/types';
import { useAuth } from '@/contexts/AuthContext';
import { leavesApi } from '@/services/api';
import { toast } from 'sonner';

export default function Leaves() {
  const { user, isHRManager, isHREmployee, isSystemAdmin, isHRAdmin, hasRole } = useAuth();
  console.log('[LEAVES] Component mounting, user:', user);
  const isHR = isHRManager() || isHREmployee() || isSystemAdmin() || isHRAdmin();

  const [currentView, setCurrentView] = useState<'balance' | 'request' | 'approval'>('balance');
  const [isRequestModalOpen, setIsRequestModalOpen] = useState(false);
  const [isReviewModalOpen, setIsReviewModalOpen] = useState(false);
  const [selectedRequest, setSelectedRequest] = useState<LeaveRequest | null>(null);
  const [requestForm, setRequestForm] = useState({
    leaveTypeId: '',
    startDate: '',
    endDate: '',
    reason: '',
  });
  const [rejectionReason, setRejectionReason] = useState('');
  const [balances, setBalances] = useState<any[]>([]);
  const [myRequests, setMyRequests] = useState<any[]>([]);
  const [pendingApprovals, setPendingApprovals] = useState<any[]>([]);
  const [leaveTypes, setLeaveTypes] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  // Helper to safely extract array data from various response structures
  const extractData = (res: any) => {
    if (!res || !res.data) return [];
    if (Array.isArray(res.data)) return res.data;
    if (Array.isArray(res.data.data)) return res.data.data;
    const keys = ['leaveTypes', 'items', 'results', 'data'];
    for (const key of keys) {
      if (res.data[key] && Array.isArray(res.data[key])) return res.data[key];
    }
    return [];
  };

  const fetchBalances = async () => {
    const employeeId = user?._id || user?.id;
    if (!employeeId) {
      console.log('[LEAVES] No employee ID found, skipping fetch');
      return;
    }

    console.log('[LEAVES] Starting fetchBalances for employee:', employeeId);
    setIsLoading(true);

    try {
      // 1. Fetch Leave Types
      console.log('[LEAVES] Fetching leave types...');
      const typesRes = await leavesApi.getLeaveTypes();
      const typesList = extractData(typesRes);
      console.log('[LEAVES] Leave types fetched:', typesList.length);
      setLeaveTypes(typesList);

      // 2. Fetch Balances
      console.log('[LEAVES] Fetching balances...');
      const balancePromises = typesList.map(async (type: any) => {
        try {
          const res = await leavesApi.getLeaveBalance(employeeId, type._id);
          return {
            leaveType: type.name,
            ...(res.data?.data || res.data)
          };
        } catch (e) {
          console.warn('[LEAVES] Failed to fetch balance for', type.name, e);
          return {
            leaveType: type.name,
            accrued: 0,
            taken: 0,
            remaining: 0
          };
        }
      });
      const results = await Promise.all(balancePromises);
      console.log('[LEAVES] Balances fetched:', results);
      setBalances(results);

      // 3. Fetch My Requests
      console.log('[LEAVES] Fetching my requests...');
      const requestsRes = await leavesApi.getMyRequests(employeeId);
      const requestsData = extractData(requestsRes);
      console.log('[LEAVES] My requests fetched:', requestsData.length);

      setMyRequests(requestsData.map((req: any) => {
        try {
          return {
            ...req,
            id: req._id,
            leaveType: req.leaveTypeId?.name || 'Unknown',
            employeeName: `${user?.firstName} ${user?.lastName}`,
            startDate: new Date(req.dates?.from).toLocaleDateString(),
            endDate: new Date(req.dates?.to).toLocaleDateString(),
            days: req.durationDays,
            status: req.status,
            approverName: (() => {
              const managerStep = req.approvalFlow?.find((s: any) => s.role === 'MANAGER');
              if (!managerStep?.decidedBy) return 'N/A';
              // Check if decidedBy is populated as an object or just an ID
              if (typeof managerStep.decidedBy === 'object' && managerStep.decidedBy.firstName) {
                return `${managerStep.decidedBy.firstName} ${managerStep.decidedBy.lastName}`;
              }
              return 'N/A';
            })(),
          };
        } catch (err) {
          console.error('[LEAVES] Error mapping request:', req, err);
          return {
            ...req,
            id: req._id,
            leaveType: 'Unknown',
            employeeName: 'Unknown',
            startDate: 'N/A',
            endDate: 'N/A',
            days: 0,
            status: req.status || 'Unknown',
            approverName: 'N/A'
          };
        }
      }));

      // 4. Fetch Pending Approvals (if Manager/HR/Dept Head)
      if (isHR || hasRole('Manager') || hasRole('department head') || hasRole('department employee')) {
        console.log('[LEAVES] Fetching pending approvals...');
        const pendingRes = await leavesApi.getPendingApprovals(employeeId);
        const pendingData = extractData(pendingRes);
        console.log('[LEAVES] Pending approvals fetched:', pendingData.length);

        setPendingApprovals(pendingData.map((req: any) => {
          try {
            return {
              ...req,
              id: req._id,
              leaveType: req.leaveTypeId?.name || 'Unknown',
              employeeName: `${req.employeeId?.firstName} ${req.employeeId?.lastName}`,
              startDate: new Date(req.dates?.from).toLocaleDateString(),
              endDate: new Date(req.dates?.to).toLocaleDateString(),
              days: req.durationDays,
              status: req.status,
              approverName: (() => {
                const managerStep = req.approvalFlow?.find((s: any) => s.role === 'MANAGER');
                if (!managerStep?.decidedBy) return 'N/A';
                // Check if decidedBy is populated as an object or just an ID
                if (typeof managerStep.decidedBy === 'object' && managerStep.decidedBy.firstName) {
                  return `${managerStep.decidedBy.firstName} ${managerStep.decidedBy.lastName}`;
                }
                return 'N/A';
              })(),
            };
          } catch (err) {
            console.error('[LEAVES] Error mapping pending approval:', req, err);
            return {
              ...req,
              id: req._id,
              leaveType: 'Unknown',
              employeeName: 'Unknown',
              startDate: 'N/A',
              endDate: 'N/A',
              days: 0,
              status: req.status || 'Unknown',
              approverName: 'N/A'
            };
          }
        }));
      }

      console.log('[LEAVES] All data fetched successfully');
    } catch (error) {
      console.error('[LEAVES] Failed to fetch leave data:', error);
      // Don't throw - let the UI show what we have
    } finally {
      setIsLoading(false);
      console.log('[LEAVES] Fetch complete, loading = false');
    }
  };

  useEffect(() => {
    fetchBalances();
  }, [user?._id]);

  const handleSubmitRequest = async () => {
    if (!requestForm.leaveTypeId || !requestForm.startDate || !requestForm.endDate) {
      toast.error('Please fill in all required fields');
      return;
    }

    try {
      await leavesApi.submitLeaveRequest({
        employeeId: user?._id || user?.id,
        leaveTypeId: requestForm.leaveTypeId,
        dates: {
          from: new Date(requestForm.startDate),
          to: new Date(requestForm.endDate)
        },
        justification: requestForm.reason
      });
      toast.success('Leave request submitted successfully');
      setIsRequestModalOpen(false);
      setRequestForm({
        leaveTypeId: leaveTypes[0]?._id || '',
        startDate: '',
        endDate: '',
        reason: '',
      });
      fetchBalances(); // Refresh everything
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to submit leave request');
    }
  };

  const handleApprove = async () => {
    if (!selectedRequest) return;
    try {
      const requestId = (selectedRequest as any)._id || selectedRequest.id;
      await leavesApi.approveLeaveRequest(requestId, {
        managerId: user?.id,
        status: 'Approved'
      });
      toast.success('Leave request approved');
      setIsReviewModalOpen(false);
      setSelectedRequest(null);
    } catch (error) {
      toast.error('Failed to approve request');
    }
  };

  const handleReject = async () => {
    if (!rejectionReason.trim()) {
      alert('Please provide a reason for rejection');
      return;
    }
    if (!selectedRequest) return;
    try {
      const requestId = (selectedRequest as any)._id || selectedRequest.id;
      await leavesApi.approveLeaveRequest(requestId, {
        managerId: user?.id,
        status: 'Rejected',
        reason: rejectionReason
      });
      toast.success('Leave request rejected');
      setIsReviewModalOpen(false);
      setSelectedRequest(null);
      setRejectionReason('');
    } catch (error) {
      toast.error('Failed to reject request');
    }
  };

  const currentEmployeeId = user?._id || user?.id || '';

  const requestColumns = [
    { header: 'Employee', accessor: 'employeeName' as const },
    { header: 'Approver', accessor: 'approverName' as const },
    { header: 'Type', accessor: 'leaveType' as const },
    {
      header: 'Dates',
      accessor: (row: LeaveRequest) => `${row.startDate} to ${row.endDate}`,
    },
    {
      header: 'Days',
      accessor: (row: LeaveRequest) => <span className="text-slate-900">{row.days}</span>,
    },
    {
      header: 'Status',
      accessor: (row: LeaveRequest) => <StatusBadge status={row.status} />,
    },
    {
      header: 'Actions',
      accessor: (row: LeaveRequest) => (
        row.status === 'Pending' ? (
          <button
            onClick={() => {
              setSelectedRequest(row);
              setIsReviewModalOpen(true);
            }}
            className="text-blue-600 hover:text-blue-700"
          >
            Review
          </button>
        ) : (
          <span className="text-slate-400">-</span>
        )
      ),
    },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-slate-900 mb-2">Leave Management</h1>
          <p className="text-slate-600">Manage leave balances and requests</p>
        </div>

        <div className="flex flex-wrap gap-2">
          <button
            onClick={() => setCurrentView('balance')}
            className={`px-4 py-2 rounded-lg transition-colors ${currentView === 'balance'
              ? 'bg-slate-900 text-white'
              : 'bg-white text-slate-700 border border-slate-300 hover:bg-slate-50'
              }`}
          >
            My Balance
          </button>
          <button
            onClick={() => setCurrentView('request')}
            className={`px-4 py-2 rounded-lg transition-colors ${currentView === 'request'
              ? 'bg-slate-900 text-white'
              : 'bg-white text-slate-700 border border-slate-300 hover:bg-slate-50'
              }`}
          >
            My Requests
          </button>
          {(isHR || hasRole('Manager') || hasRole('department head') || hasRole('department employee')) && (
            <button
              onClick={() => setCurrentView('approval')}
              className={`px-4 py-2 rounded-lg transition-colors ${currentView === 'approval'
                ? 'bg-slate-900 text-white'
                : 'bg-white text-slate-700 border border-slate-300 hover:bg-slate-50'
                }`}
            >
              Approval Queue
            </button>
          )}

          <div className="h-8 w-px bg-slate-200 mx-2 self-center hidden md:block" />

          {isHR && (
            <Link href="/leaves/hr-review">
              <button className="px-4 py-2 rounded-lg transition-colors bg-amber-50 text-amber-700 border border-amber-200 hover:bg-amber-100 flex items-center gap-2">
                <CheckCircle className="w-4 h-4" />
                HR Review
              </button>
            </Link>
          )}

          {(isHR || hasRole('Manager') || hasRole('Employee')) && (
            <Link href="/leaves/delegation">
              <button className="px-4 py-2 rounded-lg transition-colors bg-purple-50 text-purple-700 border border-purple-200 hover:bg-purple-100 flex items-center gap-2">
                <Plus className="w-4 h-4" />
                Delegation
              </button>
            </Link>
          )}

          {isHR && (
            <Link href="/leaves/retroactive">
              <button className="px-4 py-2 rounded-lg transition-colors bg-red-50 text-red-700 border border-red-200 hover:bg-red-100 flex items-center gap-2">
                <Calendar className="w-4 h-4" />
                Retroactive
              </button>
            </Link>
          )}

          {isHR && (
            <Link href="/leaves/configuration">
              <button
                className="px-4 py-2 rounded-lg transition-colors bg-blue-600 text-white border border-blue-600 hover:bg-blue-700 flex items-center gap-2"
              >
                <Settings className="w-4 h-4" />
                Configuration
              </button>
            </Link>
          )}
        </div>
      </div>

      {currentView === 'balance' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {balances
              .filter(balance => {
                // If HR or Manager, show all types for awareness (or keep filtered if desired)
                if (isHR || hasRole('Manager')) return true;
                // For Employees, only show types where they have some entitlement or common ones
                const commonTypes = ['Annual', 'Sick', 'Personal', 'Unpaid'];
                return balance.accrued > 0 || commonTypes.includes(balance.leaveType);
              })
              .map((balance, index) => (
                <Card key={index}>
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-slate-900">{balance.leaveType} Leave</h3>
                    <Calendar className="w-5 h-5 text-blue-600" />
                  </div>

                  <div className="grid grid-cols-3 gap-4 mb-4">
                    <div className="text-center">
                      <p className="text-slate-600 mb-1">Accrued</p>
                      <p className="text-blue-600 font-bold">{balance.accrued}</p>
                    </div>
                    <div className="text-center">
                      <p className="text-slate-600 mb-1">Taken</p>
                      <p className="text-amber-600 font-bold">{balance.taken}</p>
                    </div>
                    <div className="text-center">
                      <p className="text-slate-600 mb-1">Remaining</p>
                      <p className="text-green-600 font-bold">{balance.remaining}</p>
                    </div>
                  </div>

                  <div className="w-full bg-slate-200 rounded-full h-2">
                    <div
                      className="bg-blue-600 h-2 rounded-full transition-all"
                      style={{ width: `${balance.accrued > 0 ? (balance.taken / balance.accrued) * 100 : 0}%` }}
                    />
                  </div>
                </Card>
              ))}

            {(isHR || hasRole('Manager') || hasRole('Employee')) && (
              <Card title="Management Quick Actions">
                <div className="grid grid-cols-2 gap-3 mt-2">
                  {isHR && (
                    <Link href="/leaves/hr-review">
                      <button className="w-full p-4 bg-amber-50 rounded-xl hover:bg-amber-100 transition-colors flex flex-col items-center gap-2 border border-amber-100">
                        <CheckCircle className="w-6 h-6 text-amber-600" />
                        <span className="text-sm font-semibold text-amber-800">HR Review</span>
                      </button>
                    </Link>
                  )}
                  <Link href="/leaves/delegation">
                    <button className="w-full p-4 bg-purple-50 rounded-xl hover:bg-purple-100 transition-colors flex flex-col items-center gap-2 border border-purple-100">
                      <Plus className="w-6 h-6 text-purple-600" />
                      <span className="text-sm font-semibold text-purple-800">Delegation</span>
                    </button>
                  </Link>
                  {isHR && (
                    <Link href="/leaves/retroactive">
                      <button className="w-full p-4 bg-red-50 rounded-xl hover:bg-red-100 transition-colors flex flex-col items-center gap-2 border border-red-100">
                        <Calendar className="w-6 h-6 text-red-600" />
                        <span className="text-sm font-semibold text-red-800">Retroactive</span>
                      </button>
                    </Link>
                  )}
                  <button
                    onClick={async () => {
                      try {
                        await leavesApi.checkAutoEscalation();
                        alert('Auto-escalation check completed successfully');
                      } catch (e) {
                        alert('Escalation check failed');
                      }
                    }}
                    className="w-full p-4 bg-blue-50 rounded-xl hover:bg-blue-100 transition-colors flex flex-col items-center gap-2 border border-blue-100"
                  >
                    <Clock className="w-6 h-6 text-blue-600" />
                    <span className="text-sm font-semibold text-blue-800">Escalation</span>
                  </button>
                </div>
              </Card>
            )}
          </div>

          <button
            onClick={() => setIsRequestModalOpen(true)}
            className="w-full md:w-auto px-6 py-3 bg-slate-900 text-white rounded-lg hover:bg-slate-800 transition-colors flex items-center justify-center gap-2"
          >
            <Plus className="w-5 h-5" />
            Request Leave
          </button>
        </div>
      )}

      {currentView === 'request' && (
        <div className="space-y-6">
          <Card
            title="My Leave Requests"
            action={
              <button
                onClick={() => setIsRequestModalOpen(true)}
                className="px-4 py-2 bg-slate-900 text-white rounded-lg hover:bg-slate-800 transition-colors flex items-center gap-2"
              >
                <Plus className="w-4 h-4" />
                New Request
              </button>
            }
          >
            <DataTable
              data={myRequests}
              columns={requestColumns}
            />
          </Card>

          {/* Show rejection details if any */}
          {myRequests
            .filter((req) => req.status === 'Rejected')
            .map((req) => (
              <div key={req.id} className="p-4 bg-red-50 border border-red-200 rounded-lg">
                <p className="text-red-800 mb-1">
                  <strong>Rejected Request:</strong> {req.leaveType} Leave ({req.startDate} to {req.endDate})
                </p>
                <p className="text-red-700">
                  <strong>Reason:</strong> {req.rejectionReason}
                </p>
              </div>
            ))}
        </div>
      )}

      {currentView === 'approval' && (isHR || hasRole('Manager') || hasRole('department head') || hasRole('department employee')) && (
        <Card title="Pending Leave Requests">
          <DataTable
            data={pendingApprovals}
            columns={requestColumns}
          />
        </Card>
      )}

      {/* Request Leave Modal */}
      <Modal
        isOpen={isRequestModalOpen}
        onClose={() => setIsRequestModalOpen(false)}
        title="Request Leave"
        size="md"
      >
        <div className="space-y-4">
          <div>
            <label className="block text-slate-700 mb-2">Leave Type</label>
            <select
              value={requestForm.leaveTypeId}
              onChange={(e) => setRequestForm({ ...requestForm, leaveTypeId: e.target.value })}
              className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">Select a type</option>
              {leaveTypes.map(type => (
                <option key={type._id} value={type._id}>{type.name}</option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-slate-700 mb-2">Start Date</label>
              <input
                type="date"
                value={requestForm.startDate}
                onChange={(e) => setRequestForm({ ...requestForm, startDate: e.target.value })}
                className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-slate-700 mb-2">End Date</label>
              <input
                type="date"
                value={requestForm.endDate}
                onChange={(e) => setRequestForm({ ...requestForm, endDate: e.target.value })}
                className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>

          <div>
            <label className="block text-slate-700 mb-2">Reason</label>
            <textarea
              value={requestForm.reason}
              onChange={(e) => setRequestForm({ ...requestForm, reason: e.target.value })}
              rows={3}
              className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Briefly describe the reason for your leave..."
            />
          </div>

          {requestForm.leaveTypeId && leaveTypes.find(t => t._id === requestForm.leaveTypeId)?.requiresAttachment && (
            <div>
              <label className="block text-slate-700 mb-2">Required Document</label>
              <div className="border-2 border-dashed border-slate-300 rounded-lg p-6 text-center hover:border-blue-500 transition-colors cursor-pointer">
                <Upload className="w-8 h-8 text-slate-400 mx-auto mb-2" />
                <p className="text-slate-600">Click to upload or drag and drop</p>
                <p className="text-xs text-slate-500 mt-1">PDF, JPG or PNG (max 5MB)</p>
              </div>
            </div>
          )}

          <div className="flex justify-end gap-3 mt-6">
            <button
              onClick={() => setIsRequestModalOpen(false)}
              className="px-4 py-2 border border-slate-300 text-slate-700 rounded-lg hover:bg-slate-50 transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handleSubmitRequest}
              className="px-4 py-2 bg-slate-900 text-white rounded-lg hover:bg-slate-800 transition-colors"
            >
              Submit Request
            </button>
          </div>
        </div>
      </Modal>

      {/* Review Leave Request Modal */}
      <Modal
        isOpen={isReviewModalOpen}
        onClose={() => {
          setIsReviewModalOpen(false);
          setSelectedRequest(null);
          setRejectionReason('');
        }}
        title="Review Leave Request"
        size="md"
      >
        {selectedRequest && (
          <div className="space-y-4">
            <div className="p-4 bg-slate-50 rounded-lg">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-slate-600">Employee</p>
                  <p className="text-slate-900">{selectedRequest.employeeName}</p>
                </div>
                <div>
                  <p className="text-slate-600">Leave Type</p>
                  <p className="text-slate-900">{selectedRequest.leaveType}</p>
                </div>
                <div>
                  <p className="text-slate-600">Start Date</p>
                  <p className="text-slate-900">{selectedRequest.startDate}</p>
                </div>
                <div>
                  <p className="text-slate-600">End Date</p>
                  <p className="text-slate-900">{selectedRequest.endDate}</p>
                </div>
                <div>
                  <p className="text-slate-600">Duration</p>
                  <p className="text-slate-900">{selectedRequest.days} days</p>
                </div>
                <div>
                  <p className="text-slate-600">Submitted</p>
                  <p className="text-slate-900">{selectedRequest.submittedDate}</p>
                </div>
              </div>

              <div className="mt-4">
                <p className="text-slate-600">Reason</p>
                <p className="text-slate-900">{selectedRequest.reason}</p>
              </div>
            </div>

            <div>
              <label className="block text-slate-700 mb-2">Rejection Reason (Required if rejecting)</label>
              <textarea
                value={rejectionReason}
                onChange={(e) => setRejectionReason(e.target.value)}
                rows={3}
                className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Provide a clear reason if you're rejecting this request..."
              />
            </div>

            <div className="flex justify-end gap-3">
              <button
                onClick={() => {
                  setIsReviewModalOpen(false);
                  setSelectedRequest(null);
                  setRejectionReason('');
                }}
                className="px-4 py-2 border border-slate-300 text-slate-700 rounded-lg hover:bg-slate-50 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleReject}
                className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors flex items-center gap-2"
              >
                <XCircle className="w-4 h-4" />
                Reject
              </button>
              <button
                onClick={handleApprove}
                className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors flex items-center gap-2"
              >
                <CheckCircle className="w-4 h-4" />
                Approve
              </button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}