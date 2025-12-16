'use client'

import { useState } from 'react';
import { Card } from '../../components/Card';
import { DataTable } from '../../components/DataTable';
import { StatusBadge } from '../../components/StatusBadge';
import { Modal } from '../../components/Modal';
import { Calendar, Plus, Upload, CheckCircle, XCircle } from 'lucide-react';
import { mockLeaveBalances, mockLeaveRequests } from '../../lib/api';
import type { LeaveRequest } from '../../lib/types';

export default function Leaves() {
  const [currentView, setCurrentView] = useState<'balance' | 'request' | 'approval'>('balance');
  const [isRequestModalOpen, setIsRequestModalOpen] = useState(false);
  const [isReviewModalOpen, setIsReviewModalOpen] = useState(false);
  const [selectedRequest, setSelectedRequest] = useState<LeaveRequest | null>(null);
  const [requestForm, setRequestForm] = useState({
    leaveType: 'Annual' as 'Annual' | 'Sick' | 'Personal' | 'Unpaid',
    startDate: '',
    endDate: '',
    reason: '',
  });
  const [rejectionReason, setRejectionReason] = useState('');

  const currentEmployeeId = 'emp001'; // In real app, get from auth
  const balances = mockLeaveBalances.filter((b) => b.employeeId === currentEmployeeId);

  const handleSubmitRequest = () => {
    console.log('Submitting leave request:', requestForm);
    setIsRequestModalOpen(false);
    setRequestForm({
      leaveType: 'Annual',
      startDate: '',
      endDate: '',
      reason: '',
    });
  };

  const handleApprove = () => {
    console.log('Approving request:', selectedRequest?.id);
    setIsReviewModalOpen(false);
    setSelectedRequest(null);
  };

  const handleReject = () => {
    if (!rejectionReason.trim()) {
      alert('Please provide a reason for rejection');
      return;
    }
    console.log('Rejecting request:', selectedRequest?.id, 'Reason:', rejectionReason);
    setIsReviewModalOpen(false);
    setSelectedRequest(null);
    setRejectionReason('');
  };

  const requestColumns = [
    { header: 'Employee', accessor: 'employeeName' as const },
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
        
        <div className="flex gap-2">
          <button
            onClick={() => setCurrentView('balance')}
            className={`px-4 py-2 rounded-lg transition-colors ${
              currentView === 'balance'
                ? 'bg-slate-900 text-white'
                : 'bg-white text-slate-700 border border-slate-300 hover:bg-slate-50'
            }`}
          >
            My Balance
          </button>
          <button
            onClick={() => setCurrentView('request')}
            className={`px-4 py-2 rounded-lg transition-colors ${
              currentView === 'request'
                ? 'bg-slate-900 text-white'
                : 'bg-white text-slate-700 border border-slate-300 hover:bg-slate-50'
            }`}
          >
            My Requests
          </button>
          <button
            onClick={() => setCurrentView('approval')}
            className={`px-4 py-2 rounded-lg transition-colors ${
              currentView === 'approval'
                ? 'bg-slate-900 text-white'
                : 'bg-white text-slate-700 border border-slate-300 hover:bg-slate-50'
            }`}
          >
            Approval Queue
          </button>
        </div>
      </div>

      {currentView === 'balance' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {balances.map((balance, index) => (
              <Card key={index}>
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-slate-900">{balance.leaveType} Leave</h3>
                  <Calendar className="w-5 h-5 text-blue-600" />
                </div>
                
                <div className="grid grid-cols-3 gap-4 mb-4">
                  <div className="text-center">
                    <p className="text-slate-600 mb-1">Accrued</p>
                    <p className="text-blue-600">{balance.accrued}</p>
                  </div>
                  <div className="text-center">
                    <p className="text-slate-600 mb-1">Taken</p>
                    <p className="text-amber-600">{balance.taken}</p>
                  </div>
                  <div className="text-center">
                    <p className="text-slate-600 mb-1">Remaining</p>
                    <p className="text-green-600">{balance.remaining}</p>
                  </div>
                </div>

                <div className="w-full bg-slate-200 rounded-full h-2">
                  <div
                    className="bg-blue-600 h-2 rounded-full transition-all"
                    style={{ width: `${(balance.taken / balance.accrued) * 100}%` }}
                  />
                </div>
              </Card>
            ))}
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
              data={mockLeaveRequests.filter((req) => req.employeeId === currentEmployeeId)}
              columns={requestColumns}
            />
          </Card>

          {/* Show rejection details if any */}
          {mockLeaveRequests
            .filter((req) => req.employeeId === currentEmployeeId && req.status === 'Rejected')
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

      {currentView === 'approval' && (
        <Card title="Pending Leave Requests">
          <DataTable
            data={mockLeaveRequests.filter((req) => req.status === 'Pending')}
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
              value={requestForm.leaveType}
              onChange={(e) => setRequestForm({ ...requestForm, leaveType: e.target.value as typeof requestForm.leaveType })}
              className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="Annual">Annual Leave</option>
              <option value="Sick">Sick Leave</option>
              <option value="Personal">Personal Leave</option>
              <option value="Unpaid">Unpaid Leave</option>
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

          {requestForm.leaveType === 'Sick' && (
            <div>
              <label className="block text-slate-700 mb-2">Medical Document (Optional)</label>
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