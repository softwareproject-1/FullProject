'use client'

import { useState, useEffect } from 'react';
import { Card } from '../../../components/Card';
import { Modal } from '../../../components/Modal';
import { StatusBadge } from '../../../components/StatusBadge';
import { timeManagementApi, employeeProfileApi } from '../../../lib/api';
import { handleTimeManagementError, extractArrayData } from '../../../lib/time-management-utils';
import { formatDate } from '../../../lib/date-utils';
import { Plus, CheckCircle, XCircle } from 'lucide-react';
import { CorrectionRequestStatus } from '../../../../Milestone2/HR-System-main/src/time-management/models/enums';
import { useAuth } from '@/contexts/AuthContext';
import { hasRole, SystemRole } from '@/utils/roleAccess';

export default function CorrectionRequestsPage() {
  const { user } = useAuth();
  const isDepartmentEmployee = user ? hasRole(user.roles, SystemRole.DEPARTMENT_EMPLOYEE) : false;
  const isHREmployee = user ? hasRole(user.roles, SystemRole.HR_EMPLOYEE) : false;
  const canOnlyViewOwn = isDepartmentEmployee || isHREmployee;
  const [loading, setLoading] = useState(false);
  const [correctionRequests, setCorrectionRequests] = useState<any[]>([]);
  const [attendanceRecords, setAttendanceRecords] = useState<any[]>([]);
  const [employees, setEmployees] = useState<any[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [formData, setFormData] = useState<any>({});

  useEffect(() => {
    loadCorrectionRequests();
    if (!canOnlyViewOwn) {
      loadEmployees();
    }
    loadAttendanceRecords();
  }, [canOnlyViewOwn]);

  // Auto-populate employeeId for Department Employees and HR Employees when modal opens
  useEffect(() => {
    if (isModalOpen && canOnlyViewOwn && user?._id) {
      setFormData({ employeeId: user._id, attendanceRecord: '', reason: '' });
      // Reload attendance records for the logged-in employee
      loadAttendanceRecords();
    }
  }, [isModalOpen, canOnlyViewOwn, user?._id]);

  const loadCorrectionRequests = async () => {
    setLoading(true);
    try {
      const response = await timeManagementApi.getCorrectionRequests();
      const data = extractArrayData(response);
      console.log('Loaded correction requests:', data);
      if (data.length > 0) {
        console.log('Sample correction request:', JSON.stringify(data[0], null, 2));
        console.log('Sample employeeId:', data[0].employeeId);
        console.log('Sample status:', data[0].status);
      }
      setCorrectionRequests(data);
    } catch (error: any) {
      console.error('Error loading correction requests:', error);
      setCorrectionRequests([]);
      handleTimeManagementError(error, 'loading correction requests');
    } finally {
      setLoading(false);
    }
  };

  const loadEmployees = async () => {
    try {
      const response = await employeeProfileApi.getAll();
      setEmployees(extractArrayData(response));
    } catch (error) {
      console.error('Error loading employees:', error);
      setEmployees([]);
    }
  };

  const loadAttendanceRecords = async () => {
    try {
      // For Department Employees and HR Employees, only load their own attendance records
      const response = (isDepartmentEmployee || isHREmployee) && user?._id
        ? await timeManagementApi.getAttendanceRecords({ employeeId: user._id })
        : await timeManagementApi.getAttendanceRecords();
      const data = extractArrayData(response);
      console.log('Loaded attendance records:', data);
      if (data.length > 0) {
        console.log('Sample attendance record:', JSON.stringify(data[0], null, 2));
        console.log('Sample employeeId:', data[0].employeeId);
      }
      setAttendanceRecords(data);
    } catch (error) {
      console.error('Error loading attendance records:', error);
      setAttendanceRecords([]);
    }
  };

  const handleCreate = async () => {
    try {
      setLoading(true);
      await timeManagementApi.createCorrectionRequest(formData);
      setIsModalOpen(false);
      setFormData({});
      loadCorrectionRequests();
    } catch (error: any) {
      handleTimeManagementError(error, 'creating correction request');
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async (id: string) => {
    if (!confirm('Are you sure you want to approve this correction request?')) return;
    try {
      setLoading(true);
      const response = await timeManagementApi.approveCorrectionRequest(id);
      console.log('Approve response:', response);
      await loadCorrectionRequests();
      alert('Correction request approved successfully');
    } catch (error: any) {
      console.error('Approve error:', error);
      handleTimeManagementError(error, 'approving request');
    } finally {
      setLoading(false);
    }
  };

  const handleReject = async (id: string) => {
    const reason = prompt('Enter rejection reason:');
    if (reason === null || reason.trim() === '') {
      alert('Rejection reason is required');
      return;
    }
    try {
      setLoading(true);
      const response = await timeManagementApi.rejectCorrectionRequest(id, reason);
      console.log('Reject response:', response);
      await loadCorrectionRequests();
      alert('Correction request rejected successfully');
    } catch (error: any) {
      console.error('Reject error:', error);
      handleTimeManagementError(error, 'rejecting request');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-slate-900 mb-2">Correction Requests</h1>
          <p className="text-slate-600">
            {canOnlyViewOwn ? 'Submit and track your correction requests' : 'Manage attendance correction requests'}
          </p>
        </div>
        <button
          onClick={() => setIsModalOpen(true)}
          className="px-4 py-2 bg-slate-900 text-white rounded-lg hover:bg-slate-800 flex items-center gap-2"
        >
          <Plus className="w-4 h-4" />
          Create Request
        </button>
      </div>

      {loading && correctionRequests.length === 0 ? (
        <div className="text-center py-12">Loading...</div>
      ) : (
        <Card title="Correction Requests">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-slate-50 border-b border-slate-200">
                <tr>
                  <th className="px-6 py-3 text-left text-slate-700">Employee</th>
                  <th className="px-6 py-3 text-left text-slate-700">Date</th>
                  <th className="px-6 py-3 text-left text-slate-700">Reason</th>
                  <th className="px-6 py-3 text-left text-slate-700">Status</th>
                  {!canOnlyViewOwn && (
                    <th className="px-6 py-3 text-left text-slate-700">Actions</th>
                  )}
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-slate-200">
                {Array.isArray(correctionRequests) && correctionRequests.length > 0 ? (
                  correctionRequests.map((request) => {
                    // Get employee display name - handle populated employee object
                    const employee = request.employeeId || request.employee;
                    let employeeName = 'N/A';
                    
                    // Debug logging
                    if (process.env.NODE_ENV === 'development') {
                      console.log('Processing correction request:', {
                        requestId: request._id || request.id,
                        employeeId: request.employeeId,
                        employee: employee,
                        employeeType: typeof employee,
                        hasFirstName: employee && typeof employee === 'object' ? employee.firstName : 'N/A',
                        status: request.status
                      });
                    }
                    
                    if (employee) {
                      // Check if it's a populated employee object (has firstName, lastName, or fullName properties)
                      if (typeof employee === 'object' && !Array.isArray(employee) && (employee.firstName || employee.lastName || employee.fullName)) {
                        // Populated employee object from MongoDB
                        employeeName = employee.fullName || 
                          (employee.firstName && employee.lastName ? `${employee.firstName} ${employee.lastName}` : 
                           employee.firstName || employee.lastName || employee.employeeNumber || 'N/A');
                      } else {
                        // It's just an ID, try to find in employees list
                        const empId = typeof employee === 'string' ? employee : (employee?._id || employee?.id);
                        if (empId && employees.length > 0) {
                          const foundEmployee = employees.find(emp => {
                            const empIdStr = (emp._id || emp.id)?.toString();
                            const searchIdStr = empId?.toString();
                            return empIdStr === searchIdStr;
                          });
                          if (foundEmployee) {
                            employeeName = foundEmployee.fullName || 
                              (foundEmployee.firstName && foundEmployee.lastName ? `${foundEmployee.firstName} ${foundEmployee.lastName}` : 
                               foundEmployee.firstName || foundEmployee.lastName || foundEmployee.employeeNumber || 'N/A');
                          }
                        }
                      }
                    }
                    
                    // Format date - try multiple possible date fields
                    // Correction requests might have requestedDate, or we can get date from attendanceRecord
                    let dateToFormat = request.requestedDate || request.createdAt || request.date;
                    
                    // If we have an attendanceRecord reference, try to get date from it
                    if (!dateToFormat && request.attendanceRecord) {
                      const attendanceRecord = request.attendanceRecord;
                      if (typeof attendanceRecord === 'object') {
                        dateToFormat = attendanceRecord.createdAt || attendanceRecord.date || attendanceRecord.startDate;
                        // If it has punches, use the first punch time
                        if (!dateToFormat && attendanceRecord.punches && Array.isArray(attendanceRecord.punches) && attendanceRecord.punches.length > 0) {
                          const sortedPunches = [...attendanceRecord.punches].sort((a: any, b: any) => 
                            new Date(a.time).getTime() - new Date(b.time).getTime()
                          );
                          dateToFormat = sortedPunches[0].time;
                        }
                      }
                    }
                    
                    const formattedDate = formatDate(dateToFormat);
                    
                    // Check if action buttons should be shown - handle both enum and string values
                    const statusStr = String(request.status || '').toUpperCase();
                    const showActions = statusStr === CorrectionRequestStatus.SUBMITTED || 
                                       statusStr === CorrectionRequestStatus.IN_REVIEW ||
                                       statusStr === 'SUBMITTED' ||
                                       statusStr === 'IN_REVIEW';
                    
                    return (
                      <tr key={request._id || request.id}>
                        <td className="px-6 py-4">{employeeName}</td>
                        <td className="px-6 py-4" suppressHydrationWarning>{formattedDate}</td>
                        <td className="px-6 py-4">{request.reason || 'N/A'}</td>
                        <td className="px-6 py-4">
                          <StatusBadge status={request.status || CorrectionRequestStatus.SUBMITTED} />
                        </td>
                        {!canOnlyViewOwn && (
                          <td className="px-6 py-4">
                            {showActions && (
                              <div className="flex gap-2">
                                <button
                                  onClick={() => handleApprove(request._id || request.id)}
                                  className="p-2 text-green-600 hover:bg-green-50 rounded-lg"
                                  title="Approve"
                                >
                                  <CheckCircle className="w-4 h-4" />
                                </button>
                                <button
                                  onClick={() => handleReject(request._id || request.id)}
                                  className="p-2 text-red-600 hover:bg-red-50 rounded-lg"
                                  title="Reject"
                                >
                                  <XCircle className="w-4 h-4" />
                                </button>
                              </div>
                            )}
                          </td>
                        )}
                      </tr>
                    );
                  })
                ) : (
                  <tr>
                    <td colSpan={canOnlyViewOwn ? 4 : 5} className="px-6 py-8 text-center text-slate-500">
                      No correction requests found
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </Card>
      )}

      <Modal
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false);
          setFormData({});
        }}
        title="Create Correction Request"
        size="md"
      >
        <div className="space-y-4">
          <div>
            <label className="block text-slate-700 mb-2">Employee</label>
            {(isDepartmentEmployee || isHREmployee) ? (
              <div className="w-full px-4 py-2 border border-slate-300 rounded-lg bg-slate-50">
                <p className="text-slate-700">
                  {user?.firstName && user?.lastName 
                    ? `${user.firstName} ${user.lastName}`
                    : user?.firstName || user?.lastName || user?.employeeNumber || 'Current User'}
                  {user?.employeeNumber && ` (${user.employeeNumber})`}
                </p>
              </div>
            ) : (
              <select
                value={formData.employeeId || ''}
                onChange={(e) => {
                  // Clear attendance record when employee changes
                  setFormData({ ...formData, employeeId: e.target.value, attendanceRecord: '' });
                }}
                className="w-full px-4 py-2 border border-slate-300 rounded-lg"
              >
                <option value="">Select Employee</option>
                {employees.length === 0 ? (
                  <option value="" disabled>No employees available</option>
                ) : (
                  employees.map((emp) => {
                    const displayName = emp.fullName || 
                      (emp.firstName && emp.lastName ? `${emp.firstName} ${emp.lastName}` : 
                      emp.firstName || emp.lastName || emp.employeeNumber || 'Unknown Employee');
                    return (
                      <option key={emp._id || emp.id} value={emp._id || emp.id}>
                        {displayName} {emp.employeeNumber ? `(${emp.employeeNumber})` : ''}
                      </option>
                    );
                  })
                )}
              </select>
            )}
          </div>
          <div>
            <label className="block text-slate-700 mb-2">Attendance Record</label>
            <select
              value={formData.attendanceRecord || ''}
              onChange={(e) => setFormData({ ...formData, attendanceRecord: e.target.value })}
              className="w-full px-4 py-2 border border-slate-300 rounded-lg"
              disabled={!formData.employeeId}
            >
              <option value="">{formData.employeeId ? 'Select Attendance Record' : ((isDepartmentEmployee || isHREmployee) ? 'Loading...' : 'Select Employee First')}</option>
              {Array.isArray(attendanceRecords) && attendanceRecords.length > 0 && formData.employeeId ? (
                (() => {
                  // Filter by selected employee - only show records for the selected employee
                  const filteredRecords = attendanceRecords.filter((record) => {
                    const employee = record.employeeId || record.employee;
                    let recordEmployeeId: string | undefined;
                    
                    if (typeof employee === 'string') {
                      recordEmployeeId = employee;
                    } else if (employee && typeof employee === 'object') {
                      // Check if it's a populated object with _id
                      recordEmployeeId = (employee._id || employee.id)?.toString();
                    }
                    
                    const selectedEmployeeId = formData.employeeId?.toString();
                    return recordEmployeeId === selectedEmployeeId;
                  });
                  
                  if (filteredRecords.length === 0) {
                    return <option value="" disabled>No attendance records found for selected employee</option>;
                  }
                  
                  return filteredRecords.map((record) => {
                    // Format date - attendance records use createdAt or date field
                    // Try multiple possible date fields
                    let dateToFormat = record.createdAt || record.date || record.startDate;
                    
                    // If it's a punch-based record, use the first punch time
                    if (!dateToFormat && record.punches && Array.isArray(record.punches) && record.punches.length > 0) {
                      const sortedPunches = [...record.punches].sort((a: any, b: any) => 
                        new Date(a.time).getTime() - new Date(b.time).getTime()
                      );
                      dateToFormat = sortedPunches[0].time;
                    }
                    
                    const formattedDate = formatDate(dateToFormat);
                    
                    // Get the date for display (just the date part, not employee name since we already filtered)
                    return (
                      <option key={record._id || record.id} value={record._id || record.id}>
                        {formattedDate}
                      </option>
                    );
                  });
                })()
              ) : !formData.employeeId ? (
                <option value="" disabled>Please select an employee first</option>
              ) : (
                <option value="" disabled>No attendance records available</option>
              )}
            </select>
            {formData.employeeId && (
              <p className="text-sm text-slate-500 mt-1">
                Showing attendance records for selected employee
              </p>
            )}
          </div>
          <div>
            <label className="block text-slate-700 mb-2">Reason</label>
            <textarea
              value={formData.reason || ''}
              onChange={(e) => setFormData({ ...formData, reason: e.target.value })}
              className="w-full px-4 py-2 border border-slate-300 rounded-lg"
              rows={3}
              placeholder="e.g., Forgot to punch in"
            />
          </div>
          <div className="flex justify-end gap-3">
            <button
              onClick={() => setIsModalOpen(false)}
              className="px-4 py-2 border border-slate-300 text-slate-700 rounded-lg hover:bg-slate-50"
            >
              Cancel
            </button>
            <button
              onClick={handleCreate}
              disabled={loading}
              className="px-4 py-2 bg-slate-900 text-white rounded-lg hover:bg-slate-800 disabled:opacity-50"
            >
              {loading ? 'Submitting...' : 'Submit Request'}
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
}

