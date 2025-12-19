'use client'

import { useState, useEffect } from 'react';
import { Card } from '../../../components/Card';
import { Modal } from '../../../components/Modal';
import { StatusBadge } from '../../../components/StatusBadge';
import { timeManagementApi, employeeProfileApi } from '../../../lib/api';
import axiosInstance from '../../../utils/ApiClient';
import { handleTimeManagementError, extractArrayData } from '../../../lib/time-management-utils';
import { formatDate } from '../../../lib/date-utils';
import { Plus, Edit2 } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { hasRole, SystemRole } from '@/utils/roleAccess';

export default function TimeExceptionsPage() {
  const { user } = useAuth();
  const isDepartmentEmployee = user ? hasRole(user.roles, SystemRole.DEPARTMENT_EMPLOYEE) : false;
  const isHREmployee = user ? hasRole(user.roles, SystemRole.HR_EMPLOYEE) : false;
  const isRecruiter = user ? hasRole(user.roles, SystemRole.RECRUITER) : false;
  const isSystemAdmin = user ? hasRole(user.roles, SystemRole.SYSTEM_ADMIN) : false;
  const canOnlyViewOwn = isDepartmentEmployee || isHREmployee || isRecruiter;
  const [loading, setLoading] = useState(false);
  const [timeExceptions, setTimeExceptions] = useState<any[]>([]);
  const [attendanceRecords, setAttendanceRecords] = useState<any[]>([]);
  const [allEmployees, setAllEmployees] = useState<any[]>([]);
  const [allManagers, setAllManagers] = useState<any[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedItem, setSelectedItem] = useState<any>(null);
  const [formData, setFormData] = useState<any>({});

  useEffect(() => {
    loadTimeExceptions();
    loadEmployees();
    loadAttendanceRecords();
  }, [isSystemAdmin]);

  // Auto-populate employeeId for Department Employees and HR Employees when modal opens
  useEffect(() => {
    if (isModalOpen && canOnlyViewOwn && user?._id && !selectedItem) {
      setFormData({ 
        employeeId: user._id, 
        type: '', 
        attendanceRecordId: undefined, 
        assignedTo: undefined, 
        status: 'OPEN',
        reason: '' 
      });
      // Load attendance records for the logged-in employee
      loadAttendanceRecords(user._id);
    }
  }, [isModalOpen, canOnlyViewOwn, user?._id, selectedItem]);

  // Reload attendance records when employee is selected
  useEffect(() => {
    if (formData.employeeId) {
      loadAttendanceRecords(formData.employeeId);
      // Clear attendance record selection when employee changes
      setFormData((prev: any) => ({ ...prev, attendanceRecordId: undefined }));
    } else {
      setAttendanceRecords([]);
    }
  }, [formData.employeeId]);

  const loadTimeExceptions = async () => {
    setLoading(true);
    try {
      const response = await timeManagementApi.getTimeExceptions();
      setTimeExceptions(response.data || []);
    } catch (error: any) {
      console.error('Error loading time exceptions:', error);
      setTimeExceptions([]);
      handleTimeManagementError(error, 'loading time exceptions');
    } finally {
      setLoading(false);
    }
  };

  const loadEmployees = async () => {
    try {
      const response = await employeeProfileApi.getAll();
      const allEmps = extractArrayData(response);
      
      // System Admin can see all employees, others only see employees with attendance records
      if (isSystemAdmin) {
        setAllEmployees(allEmps);
      } else {
        // Get all attendance records to find which employees have records
        const attendanceResponse = await timeManagementApi.getAttendanceRecords();
        const allRecords = extractArrayData(attendanceResponse);
        
        // Get unique employee IDs from attendance records
        const employeeIdsWithRecords = new Set(
          allRecords.map((record: any) => {
            const empId = record.employeeId;
            if (typeof empId === 'object' && empId?._id) {
              return empId._id.toString();
            }
            return empId?.toString();
          })
        );
        
        // Filter employees to only those with attendance records
        const employeesWithRecords = allEmps.filter((emp: any) => 
          employeeIdsWithRecords.has((emp._id || emp.id).toString())
        );
        setAllEmployees(employeesWithRecords);
      }
      
      // Load managers with specific roles - using exact enum values
      // These must match SystemRole enum values exactly
      const managerRoles = [
        'HR Manager',           // SystemRole.HR_MANAGER
        'Payroll Specialist',  // SystemRole.PAYROLL_SPECIALIST
        'Payroll Manager',      // SystemRole.PAYROLL_MANAGER
        'System Admin',         // SystemRole.SYSTEM_ADMIN
        'Legal & Policy Admin', // SystemRole.LEGAL_POLICY_ADMIN
        'HR Admin'              // SystemRole.HR_ADMIN
      ];
      
      try {
        // First, check if roles are in the initial employee data
        let managersWithRoles = allEmps.filter((emp: any) => {
          let empRoles: string[] = [];
          
          // Try multiple ways to get roles from the employee object
          if (emp.roles && Array.isArray(emp.roles)) {
            empRoles = emp.roles;
          } else if (emp.systemRoles) {
            if (Array.isArray(emp.systemRoles)) {
              empRoles = emp.systemRoles.flatMap((sr: any) => sr.roles || []);
            } else if (emp.systemRoles.roles && Array.isArray(emp.systemRoles.roles)) {
              empRoles = emp.systemRoles.roles;
            }
          }
          
          if (empRoles.length === 0) {
            return false;
          }
          
          // Use exact string matching (case-sensitive) as per enum values
          return empRoles.some((empRole: string) => 
            managerRoles.includes(empRole)
          );
        });
        
        // If no managers found in initial data, fetch roles for each employee
        if (managersWithRoles.length === 0 && allEmps.length > 0) {
          console.log('Roles not in initial data, fetching roles for employees...');
          
          // Fetch roles for employees in parallel (limit to first 50 to avoid too many requests)
          const employeesToCheck = allEmps.slice(0, 50);
          const rolePromises = employeesToCheck.map(async (emp: any) => {
            const empId = emp._id || emp.id;
            if (!empId) return { emp, roles: [] };
            
            try {
              // Try to get system roles via the system-roles endpoint
              const rolesResponse = await axiosInstance.get(`/employee-profile/${empId}/system-roles`).catch(() => null);
              if (rolesResponse?.data?.roles) {
                return { emp, roles: rolesResponse.data.roles };
              }
              
              // Fallback: try PATCH to get existing roles (some endpoints return on PATCH)
              const patchResponse = await axiosInstance.patch(`/employee-profile/${empId}/system-roles`, {}).catch(() => null);
              if (patchResponse?.data?.roles) {
                return { emp, roles: patchResponse.data.roles };
              }
              
              return { emp, roles: [] };
            } catch (err) {
              return { emp, roles: [] };
            }
          });
          
          const employeesWithRolesData = await Promise.all(rolePromises);
          
          // Filter employees that have the required roles
          managersWithRoles = employeesWithRolesData
            .filter(({ roles }) => {
              if (!Array.isArray(roles) || roles.length === 0) return false;
              // Use exact string matching (case-sensitive)
              return roles.some((role: string) => managerRoles.includes(role));
            })
            .map(({ emp }) => emp);
          
          console.log('Found managers after fetching roles:', managersWithRoles.length);
        }
        
        setAllManagers(managersWithRoles);
      } catch (error) {
        console.error('Error loading managers by roles:', error);
        setAllManagers([]);
      }
    } catch (error) {
      console.error('Error loading employees:', error);
      setAllEmployees([]);
      setAllManagers([]);
    }
  };

  const loadAttendanceRecords = async (employeeId?: string) => {
    try {
      const filters: any = {};
      // Only add employeeId if it's a valid non-empty string
      if (employeeId) {
        const employeeIdStr = String(employeeId).trim();
        if (employeeIdStr && employeeIdStr.length > 0) {
          filters.employeeId = employeeIdStr;
        }
      }
      const response = await timeManagementApi.getAttendanceRecords(filters);
      setAttendanceRecords(extractArrayData(response));
    } catch (error) {
      console.error('Error loading attendance records:', error);
      setAttendanceRecords([]);
    }
  };

  const handleCreate = async () => {
    try {
      setLoading(true);
      // Clean form data: remove empty strings and convert to undefined
      const cleanedData = {
        employeeId: formData.employeeId || undefined,
        type: formData.type || undefined,
        attendanceRecordId: formData.attendanceRecordId || undefined,
        assignedTo: formData.assignedTo || undefined,
        status: formData.status || 'OPEN',
        reason: formData.reason || undefined,
      };
      
      // Validate required fields
      if (!cleanedData.employeeId || !cleanedData.type || !cleanedData.attendanceRecordId || !cleanedData.assignedTo) {
        alert('Please fill in all required fields: Employee, Exception Type, Attendance Record, and Escalated To');
        return;
      }
      
      console.log('Creating time exception with data:', cleanedData);
      await timeManagementApi.createTimeException(cleanedData);
      setIsModalOpen(false);
      setFormData({});
      loadTimeExceptions();
    } catch (error: any) {
      handleTimeManagementError(error, 'creating time exception');
    } finally {
      setLoading(false);
    }
  };

  const handleUpdate = async () => {
    if (!selectedItem) return;
    try {
      setLoading(true);
      // Only send status when updating
      const updateData = {
        status: formData.status || selectedItem.status || 'OPEN',
      };
      await timeManagementApi.updateTimeException(selectedItem._id || selectedItem.id, updateData);
      setIsModalOpen(false);
      setSelectedItem(null);
      setFormData({});
      loadTimeExceptions();
    } catch (error: any) {
      handleTimeManagementError(error, 'updating time exception');
    } finally {
      setLoading(false);
    }
  };

  const openModal = (item?: any) => {
    setSelectedItem(item || null);
    if (item) {
      setFormData(item);
    } else {
      setFormData({ status: 'OPEN' });
    }
    setIsModalOpen(true);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-slate-900 mb-2">Time Exceptions</h1>
          <p className="text-slate-600">
            {canOnlyViewOwn ? 'View and create time exceptions for your records' : 'Handle time-related exceptions and issues'}
          </p>
        </div>
        <button
          onClick={() => openModal()}
          className="px-4 py-2 bg-slate-900 text-white rounded-lg hover:bg-slate-800 flex items-center gap-2"
        >
          <Plus className="w-4 h-4" />
          Create Exception
        </button>
      </div>

      {loading && timeExceptions.length === 0 ? (
        <div className="text-center py-12">Loading...</div>
      ) : (
        <Card title="Time Exceptions">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-slate-50 border-b border-slate-200">
                <tr>
                  <th className="px-6 py-3 text-left text-slate-700">Employee</th>
                  <th className="px-6 py-3 text-left text-slate-700">Type</th>
                  <th className="px-6 py-3 text-left text-slate-700">Escalated To</th>
                  <th className="px-6 py-3 text-left text-slate-700">Date</th>
                  <th className="px-6 py-3 text-left text-slate-700">Status</th>
                  {!canOnlyViewOwn && (
                    <th className="px-6 py-3 text-left text-slate-700">Actions</th>
                  )}
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-slate-200">
                {timeExceptions.map((exception) => {
                  // Get employee name from populated employeeId
                  const employee = exception.employeeId;
                  const employeeName = employee?.fullName || 
                    (employee?.firstName && employee?.lastName 
                      ? `${employee.firstName} ${employee.lastName}` 
                      : employee?.firstName || employee?.lastName || employee?.employeeNumber || 'N/A');
                  
                  // Get date from populated attendanceRecordId (preferred) or exception's own date fields
                  const attendanceRecord = exception.attendanceRecordId;
                  let dateToFormat = null;
                  
                  // First, try to get date from the populated attendance record
                  if (attendanceRecord) {
                    // Check if it's a populated object (not just an ID string)
                    if (typeof attendanceRecord === 'object' && !Array.isArray(attendanceRecord)) {
                      dateToFormat = attendanceRecord.date || attendanceRecord.dateObj || attendanceRecord.createdAt;
                      
                      // If no date field, try to extract from attendance record's _id timestamp
                      if (!dateToFormat && attendanceRecord._id) {
                        try {
                          if (typeof attendanceRecord._id === 'object' && (attendanceRecord._id as any).getTimestamp) {
                            dateToFormat = (attendanceRecord._id as any).getTimestamp();
                          } else if (typeof attendanceRecord._id === 'string') {
                            const timestamp = parseInt(attendanceRecord._id.substring(0, 8), 16) * 1000;
                            if (!isNaN(timestamp)) {
                              dateToFormat = new Date(timestamp);
                            }
                          }
                        } catch (e) {
                          // Ignore errors
                        }
                      }
                      
                      // If still no date, try to extract from first punch time
                      if (!dateToFormat && attendanceRecord.punches && Array.isArray(attendanceRecord.punches) && attendanceRecord.punches.length > 0) {
                        try {
                          const sortedPunches = [...attendanceRecord.punches].sort((a: any, b: any) => {
                            const timeA = a.time instanceof Date ? a.time : new Date(a.time);
                            const timeB = b.time instanceof Date ? b.time : new Date(b.time);
                            return timeA.getTime() - timeB.getTime();
                          });
                          dateToFormat = sortedPunches[0].time;
                        } catch (e) {
                          // Ignore errors
                        }
                      }
                    } else if (typeof attendanceRecord === 'string') {
                      // If it's just an ID string, try to extract date from the ID itself
                      try {
                        const timestamp = parseInt(attendanceRecord.substring(0, 8), 16) * 1000;
                        if (!isNaN(timestamp)) {
                          dateToFormat = new Date(timestamp);
                        }
                      } catch (e) {
                        // Ignore errors
                      }
                    }
                  }
                  
                  // Fallback to exception's own date fields
                  if (!dateToFormat) {
                    dateToFormat = exception.createdAt || exception.date;
                  }
                  
                  // Last resort: extract from exception's _id timestamp
                  if (!dateToFormat && exception._id) {
                    try {
                      if (typeof exception._id === 'object' && (exception._id as any).getTimestamp) {
                        dateToFormat = (exception._id as any).getTimestamp();
                      } else if (typeof exception._id === 'string') {
                        const timestamp = parseInt(exception._id.substring(0, 8), 16) * 1000;
                        if (!isNaN(timestamp)) {
                          dateToFormat = new Date(timestamp);
                        }
                      }
                    } catch (e) {
                      // Ignore errors
                    }
                  }
                  
                  const formattedDate = formatDate(dateToFormat);
                  
                  // Get escalated to (manager) name from populated assignedTo
                  const assignedTo = exception.assignedTo;
                  const assignedToName = assignedTo?.fullName || 
                    (assignedTo?.firstName && assignedTo?.lastName 
                      ? `${assignedTo.firstName} ${assignedTo.lastName}` 
                      : assignedTo?.firstName || assignedTo?.lastName || assignedTo?.employeeNumber || 'N/A');
                  
                  return (
                    <tr key={exception._id || exception.id}>
                      <td className="px-6 py-4">{employeeName}</td>
                      <td className="px-6 py-4">{exception.type || 'N/A'}</td>
                      <td className="px-6 py-4">{assignedToName}</td>
                      <td className="px-6 py-4">{formattedDate}</td>
                      <td className="px-6 py-4">
                        <StatusBadge status={exception.status || 'OPEN'} />
                      </td>
                      {!canOnlyViewOwn && (
                        <td className="px-6 py-4">
                          <button
                            onClick={() => openModal(exception)}
                            className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg"
                          >
                            <Edit2 className="w-4 h-4" />
                          </button>
                        </td>
                      )}
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </Card>
      )}

      <Modal
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false);
          setSelectedItem(null);
          setFormData({});
        }}
        title={selectedItem ? 'Edit Time Exception' : 'Create Time Exception'}
        size="md"
      >
        <div className="space-y-4">
          <div>
            <label className="block text-slate-700 mb-2">Employee <span className="text-red-500">*</span></label>
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
                  const newEmployeeId = e.target.value || undefined;
                  setFormData({ 
                    ...formData, 
                    employeeId: newEmployeeId,
                    attendanceRecordId: undefined // Clear attendance record when employee changes
                  });
                }}
                className="w-full px-4 py-2 border border-slate-300 rounded-lg bg-slate-50"
                disabled={!!selectedItem}
              >
                <option value="">Select Employee</option>
                {allEmployees.length === 0 ? (
                  <option value="" disabled>Loading employees...</option>
                ) : (
                  allEmployees.map((emp) => {
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
            <p className="text-sm text-slate-500 mt-1">
              {(isDepartmentEmployee || isHREmployee) 
                ? 'Your attendance records will be shown below'
                : isSystemAdmin 
                  ? 'All employees are shown'
                  : 'Only employees with attendance records are shown'}
            </p>
          </div>
          <div>
            <label className="block text-slate-700 mb-2">Exception Type</label>
            <select
              value={formData.type || ''}
              onChange={(e) => setFormData({ ...formData, type: e.target.value })}
              className="w-full px-4 py-2 border border-slate-300 rounded-lg bg-slate-50"
              disabled={!!selectedItem}
            >
              <option value="">Select Type</option>
              <option value="MISSED_PUNCH">Missed Punch</option>
              <option value="LATE">Late</option>
              <option value="EARLY_LEAVE">Early Leave</option>
              <option value="SHORT_TIME">Short Time</option>
              <option value="OVERTIME_REQUEST">Overtime Request</option>
              <option value="MANUAL_ADJUSTMENT">Manual Adjustment</option>
            </select>
          </div>
          <div>
            <label className="block text-slate-700 mb-2">Attendance Record <span className="text-red-500">*</span></label>
            <select
              value={formData.attendanceRecordId || ''}
              onChange={(e) => setFormData({ ...formData, attendanceRecordId: e.target.value || undefined })}
              className="w-full px-4 py-2 border border-slate-300 rounded-lg bg-slate-50"
              disabled={!!selectedItem || !formData.employeeId}
            >
              <option value="">
                {!formData.employeeId 
                  ? 'Please select an employee first' 
                  : 'Select Attendance Record'}
              </option>
              {!formData.employeeId ? (
                <option value="" disabled>Select an employee first</option>
              ) : attendanceRecords.length === 0 ? (
                <option value="" disabled>No attendance records available for this employee</option>
              ) : (
                attendanceRecords.map((record) => {
                  // Get employee name from populated employeeId
                  const employee = record.employeeId;
                  const employeeName = employee?.fullName || 
                    (employee?.firstName && employee?.lastName 
                      ? `${employee.firstName} ${employee.lastName}` 
                      : employee?.firstName || employee?.lastName || employee?.employeeNumber || 'N/A');
                  
                  // Get date - try multiple possible date fields
                  let dateToFormat = record.date || record.dateObj || record.createdAt;
                  
                  // If no date field, try to extract from MongoDB _id timestamp
                  if (!dateToFormat && record._id) {
                    try {
                      // MongoDB ObjectId has a getTimestamp() method
                      // If _id is a string, we can't use getTimestamp, so try parsing it
                      if (typeof record._id === 'object' && (record._id as any).getTimestamp) {
                        dateToFormat = (record._id as any).getTimestamp();
                      } else if (typeof record._id === 'string') {
                        // Try to extract timestamp from ObjectId string (first 8 chars are timestamp)
                        // This is a fallback - ideally the backend should provide the date
                        const timestamp = parseInt(record._id.substring(0, 8), 16) * 1000;
                        if (!isNaN(timestamp)) {
                          dateToFormat = new Date(timestamp);
                        }
                      }
                    } catch (e) {
                      // Ignore errors
                    }
                  }
                  
                  // If still no date, try to extract from first punch time
                  if (!dateToFormat && record.punches && Array.isArray(record.punches) && record.punches.length > 0) {
                    try {
                      const sortedPunches = [...record.punches].sort((a: any, b: any) => {
                        const timeA = a.time instanceof Date ? a.time : new Date(a.time);
                        const timeB = b.time instanceof Date ? b.time : new Date(b.time);
                        return timeA.getTime() - timeB.getTime();
                      });
                      dateToFormat = sortedPunches[0].time;
                    } catch (e) {
                      // Ignore errors
                    }
                  }
                  
                  const formattedDate = formatDate(dateToFormat);
                  
                  return (
                    <option key={record._id || record.id} value={record._id || record.id}>
                      {employeeName} - {formattedDate}
                    </option>
                  );
                })
              )}
            </select>
          </div>
          <div>
            <label className="block text-slate-700 mb-2">Escalated To (Manager) <span className="text-red-500">*</span></label>
            <select
              value={formData.assignedTo || ''}
              onChange={(e) => setFormData({ ...formData, assignedTo: e.target.value || undefined })}
              className="w-full px-4 py-2 border border-slate-300 rounded-lg bg-slate-50"
              disabled={!!selectedItem}
            >
              <option value="">Select Manager</option>
              {allManagers.length === 0 ? (
                <option value="" disabled>No managers found with the required roles</option>
              ) : (
                allManagers.map((emp) => {
                  const displayName = emp.fullName || 
                    (emp.firstName && emp.lastName ? `${emp.firstName} ${emp.lastName}` : 
                    emp.firstName || emp.lastName || emp.employeeNumber || 'Unknown Employee');
                  const roles = emp.systemRoles || [];
                  const roleDisplay = roles.length > 0 ? ` - ${roles.join(', ')}` : '';
                  return (
                    <option key={emp._id || emp.id} value={emp._id || emp.id}>
                      {displayName} {emp.employeeNumber ? `(${emp.employeeNumber})` : ''}{roleDisplay}
                    </option>
                  );
                })
              )}
            </select>
            <p className="text-sm text-slate-500 mt-1">Only managers with roles: HR Manager, Payroll Specialist, Payroll Manager, System Admin, Legal & Policy Admin, HR Admin</p>
          </div>
          {selectedItem && (
            <div>
              <label className="block text-slate-700 mb-2">Status <span className="text-red-500">*</span></label>
              <select
                value={formData.status || selectedItem.status || 'OPEN'}
                onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                className="w-full px-4 py-2 border border-slate-300 rounded-lg"
              >
                <option value="OPEN">Open</option>
                <option value="PENDING">Pending</option>
                <option value="APPROVED">Approved</option>
                <option value="REJECTED">Rejected</option>
                <option value="ESCALATED">Escalated</option>
                <option value="RESOLVED">Resolved</option>
              </select>
              <p className="text-sm text-slate-500 mt-1">Only the status can be updated for existing exceptions</p>
            </div>
          )}
          <div>
            <label className="block text-slate-700 mb-2">Reason</label>
            <textarea
              value={formData.reason || ''}
              onChange={(e) => setFormData({ ...formData, reason: e.target.value })}
              className="w-full px-4 py-2 border border-slate-300 rounded-lg bg-slate-50"
              rows={3}
              placeholder="e.g., Traffic jam"
              disabled={!!selectedItem}
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
              onClick={selectedItem ? handleUpdate : handleCreate}
              disabled={loading}
              className="px-4 py-2 bg-slate-900 text-white rounded-lg hover:bg-slate-800 disabled:opacity-50"
            >
              {loading ? 'Saving...' : selectedItem ? 'Update' : 'Create'}
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
}

