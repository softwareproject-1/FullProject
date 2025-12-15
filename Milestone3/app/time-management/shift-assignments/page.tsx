'use client'

import { useState, useEffect } from 'react';
import { Card } from '../../../components/Card';
import { Modal } from '../../../components/Modal';
import { StatusBadge } from '../../../components/StatusBadge';
import { timeManagementApi, employeeProfileApi, organizationApi } from '../../../lib/api';
import { handleTimeManagementError, extractArrayData } from '../../../lib/time-management-utils';
import { formatDate, toISO8601 } from '../../../lib/date-utils';
import { Edit2, Plus, XCircle } from 'lucide-react';

export default function ShiftAssignmentsPage() {
  const [loading, setLoading] = useState(false);
  const [shiftAssignments, setShiftAssignments] = useState<any[]>([]);
  const [shifts, setShifts] = useState<any[]>([]);
  const [employees, setEmployees] = useState<any[]>([]);
  const [departments, setDepartments] = useState<any[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedItem, setSelectedItem] = useState<any>(null);
  const [formData, setFormData] = useState<any>({});
  const [assignmentMode, setAssignmentMode] = useState<'individual' | 'bulk'>('individual');

  useEffect(() => {
    loadShiftAssignments();
    loadShifts();
    loadEmployees();
    loadDepartments();
  }, []);

  const loadShiftAssignments = async () => {
    setLoading(true);
    try {
      const response = await timeManagementApi.getShiftAssignments();
      const assignments = extractArrayData(response);
      console.log('Loaded shift assignments:', assignments);
      if (assignments.length > 0) {
        console.log('Sample assignment:', JSON.stringify(assignments[0], null, 2));
        console.log('Employee data type:', typeof assignments[0].employeeId);
        console.log('Employee data:', assignments[0].employeeId);
        if (assignments[0].employeeId && typeof assignments[0].employeeId === 'object') {
          console.log('Has firstName?', assignments[0].employeeId.firstName);
          console.log('Has lastName?', assignments[0].employeeId.lastName);
          console.log('Has fullName?', assignments[0].employeeId.fullName);
          console.log('Has _id?', assignments[0].employeeId._id);
        }
      }
      setShiftAssignments(assignments);
    } catch (error: any) {
      console.error('Error loading shift assignments:', error);
      setShiftAssignments([]);
      handleTimeManagementError(error, 'loading shift assignments');
    } finally {
      setLoading(false);
    }
  };

  const loadShifts = async () => {
    try {
      const response = await timeManagementApi.getShifts();
      setShifts(extractArrayData(response));
    } catch (error) {
      console.error('Error loading shifts:', error);
      setShifts([]);
    }
  };

  const loadEmployees = async () => {
    try {
      const response = await employeeProfileApi.getAll();
      const employeesData = extractArrayData(response);
      console.log('Loaded employees:', employeesData.length, employeesData);
      setEmployees(employeesData);
    } catch (error) {
      console.error('Error loading employees:', error);
      setEmployees([]);
    }
  };

  const loadDepartments = async () => {
    try {
      const response = await organizationApi.getDepartments();
      setDepartments(extractArrayData(response));
    } catch (error) {
      console.error('Error loading departments:', error);
      setDepartments([]);
    }
  };

  const handleCreate = async () => {
    try {
      setLoading(true);
      // Clean up formData: remove empty strings, undefined values, and MongoDB internal fields
      const cleanData: any = { ...formData };
      Object.keys(cleanData).forEach(key => {
        if (cleanData[key] === '' || cleanData[key] === null || cleanData[key] === undefined) {
          delete cleanData[key];
        }
        // Remove MongoDB internal fields
        if (key === '_id' || key === '__v' || key === 'id' || key.startsWith('_')) {
          delete cleanData[key];
        }
      });
      
      // Convert dates to ISO 8601 format
      if (cleanData.startDate && typeof cleanData.startDate === 'string' && !cleanData.startDate.includes('T')) {
        cleanData.startDate = toISO8601(cleanData.startDate, 'start');
      }
      if (cleanData.endDate && typeof cleanData.endDate === 'string' && !cleanData.endDate.includes('T')) {
        cleanData.endDate = toISO8601(cleanData.endDate, 'end');
      }
      
      if (assignmentMode === 'bulk') {
        await timeManagementApi.createBulkShiftAssignment(cleanData);
      } else {
        await timeManagementApi.createShiftAssignment(cleanData);
      }
      setIsModalOpen(false);
      setFormData({});
      loadShiftAssignments();
    } catch (error: any) {
      handleTimeManagementError(error, 'creating shift assignment');
    } finally {
      setLoading(false);
    }
  };

  const handleUpdate = async () => {
    if (!selectedItem) return;
    try {
      setLoading(true);
      // Clean up formData: remove empty strings, undefined values, and MongoDB internal fields
      const cleanData: any = { ...formData };
      Object.keys(cleanData).forEach(key => {
        if (cleanData[key] === '' || cleanData[key] === null || cleanData[key] === undefined) {
          delete cleanData[key];
        }
        // Remove MongoDB internal fields and nested objects that shouldn't be sent
        if (key === '_id' || key === '__v' || key === 'id' || key.startsWith('_')) {
          delete cleanData[key];
        }
        // Remove populated object references - only send IDs
        if (typeof cleanData[key] === 'object' && cleanData[key] !== null && !Array.isArray(cleanData[key])) {
          // If it's a populated object, extract the ID if it exists
          if (cleanData[key]._id) {
            cleanData[key] = cleanData[key]._id.toString();
          } else if (cleanData[key].id) {
            cleanData[key] = cleanData[key].id.toString();
          } else {
            // If it doesn't have an ID, remove it (it's likely a populated object we don't want to send)
            delete cleanData[key];
          }
        }
      });
      
      // Convert dates to ISO 8601 format
      if (cleanData.startDate && typeof cleanData.startDate === 'string' && !cleanData.startDate.includes('T')) {
        cleanData.startDate = toISO8601(cleanData.startDate, 'start');
      }
      if (cleanData.endDate && typeof cleanData.endDate === 'string' && !cleanData.endDate.includes('T')) {
        cleanData.endDate = toISO8601(cleanData.endDate, 'end');
      }
      
      await timeManagementApi.updateShiftAssignment(selectedItem._id || selectedItem.id, cleanData);
      setIsModalOpen(false);
      setSelectedItem(null);
      setFormData({});
      loadShiftAssignments();
    } catch (error: any) {
      handleTimeManagementError(error, 'updating shift assignment');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this shift assignment?')) return;
    try {
      setLoading(true);
      await timeManagementApi.deleteShiftAssignment(id);
      loadShiftAssignments();
    } catch (error: any) {
      handleTimeManagementError(error, 'deleting shift assignment');
    } finally {
      setLoading(false);
    }
  };

  const openModal = (item?: any) => {
    setSelectedItem(item || null);
    if (item) {
      // Extract only the fields we need, converting populated objects to IDs
      const cleanItem: any = {
        status: item.status || 'PENDING',
        startDate: item.startDate,
        endDate: item.endDate,
      };
      
      // Extract IDs from populated objects
      if (item.shiftId) {
        cleanItem.shiftId = typeof item.shiftId === 'object' ? (item.shiftId._id || item.shiftId.id || item.shiftId) : item.shiftId;
      }
      if (item.employeeId) {
        cleanItem.employeeId = typeof item.employeeId === 'object' ? (item.employeeId._id || item.employeeId.id || item.employeeId) : item.employeeId;
      }
      if (item.scheduleRuleId) {
        cleanItem.scheduleRuleId = typeof item.scheduleRuleId === 'object' ? (item.scheduleRuleId._id || item.scheduleRuleId.id || item.scheduleRuleId) : item.scheduleRuleId;
      }
      
      setFormData(cleanItem);
      setAssignmentMode('individual');
    } else {
      setFormData({ status: 'PENDING' });
      setAssignmentMode('individual');
    }
    setIsModalOpen(true);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-slate-900 mb-2">Shift Assignments</h1>
          <p className="text-slate-600">Assign shifts to employees individually or in bulk</p>
        </div>
        <button
          onClick={() => openModal()}
          className="px-4 py-2 bg-slate-900 text-white rounded-lg hover:bg-slate-800 flex items-center gap-2"
        >
          <Plus className="w-4 h-4" />
          Assign Shift
        </button>
      </div>

      {loading && shiftAssignments.length === 0 ? (
        <div className="text-center py-12">Loading...</div>
      ) : (
        <Card title="Shift Assignments">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-slate-50 border-b border-slate-200">
                <tr>
                  <th className="px-6 py-3 text-left text-slate-700">Employee</th>
                  <th className="px-6 py-3 text-left text-slate-700">Shift</th>
                  <th className="px-6 py-3 text-left text-slate-700">Date Range</th>
                  <th className="px-6 py-3 text-left text-slate-700">Status</th>
                  <th className="px-6 py-3 text-left text-slate-700">Actions</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-slate-200">
                {shiftAssignments.map((assignment) => {
                  // Get employee display name - handle populated employee object
                  const employee = assignment.employeeId || assignment.employee;
                  let employeeName = 'N/A';
                  
                  if (employee) {
                    // Check if it's a populated object (has firstName, lastName, or fullName properties)
                    if (typeof employee === 'object' && (employee.firstName || employee.lastName || employee.fullName)) {
                      // It's a populated employee object from MongoDB
                      employeeName = employee.fullName || 
                        (employee.firstName && employee.lastName ? `${employee.firstName} ${employee.lastName}` : 
                         employee.firstName || employee.lastName || employee.employeeNumber || 'N/A');
                    } else {
                      // It's just an ID (string or object with only _id), try to find in employees list
                      const empId = typeof employee === 'string' ? employee : (employee?._id || employee?.id);
                      if (empId) {
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
                  
                  // Get shift name - handle populated shift object
                  const shift = assignment.shiftId || assignment.shift;
                  let shiftName = 'N/A';
                  
                  if (shift) {
                    // Check if it's a populated object (has name property)
                    if (typeof shift === 'object' && shift.name) {
                      shiftName = shift.name;
                    } else {
                      // It's just an ID, try to find in shifts list
                      const shiftId = typeof shift === 'string' ? shift : (shift?._id || shift?.id);
                      if (shiftId) {
                        const foundShift = shifts.find(s => {
                          const shiftIdStr = (s._id || s.id)?.toString();
                          const searchIdStr = shiftId?.toString();
                          return shiftIdStr === searchIdStr;
                        });
                        if (foundShift) {
                          shiftName = foundShift.name || 'N/A';
                        }
                      }
                    }
                  }
                  
                  return (
                  <tr key={assignment._id || assignment.id}>
                    <td className="px-6 py-4">{employeeName}</td>
                    <td className="px-6 py-4">{shiftName}</td>
                    <td className="px-6 py-4" suppressHydrationWarning>
                      {assignment.startDate ? formatDate(assignment.startDate) : 'N/A'} - 
                      {assignment.endDate ? formatDate(assignment.endDate) : 'Ongoing'}
                    </td>
                    <td className="px-6 py-4">
                      <StatusBadge status={assignment.status || 'PENDING'} />
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex gap-2">
                        <button
                          onClick={() => openModal(assignment)}
                          className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg"
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleDelete(assignment._id || assignment.id)}
                          className="p-2 text-red-600 hover:bg-red-50 rounded-lg"
                        >
                          <XCircle className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
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
        title={selectedItem ? 'Edit Shift Assignment' : 'Assign Shift'}
        size="md"
      >
        <div className="space-y-4">
          {!selectedItem && (
            <div>
              <label className="block text-slate-700 mb-2">Assignment Mode</label>
              <select
                value={assignmentMode}
                onChange={(e) => {
                  setAssignmentMode(e.target.value as 'individual' | 'bulk');
                  setFormData({ ...formData, employeeId: '', departmentId: '', positionId: '', employeeIds: [] });
                }}
                className="w-full px-4 py-2 border border-slate-300 rounded-lg"
              >
                <option value="individual">Individual Assignment</option>
                <option value="bulk">Bulk Assignment</option>
              </select>
            </div>
          )}
          {assignmentMode === 'individual' || selectedItem ? (
            <div>
              <label className="block text-slate-700 mb-2">Employee</label>
              <select
                value={formData.employeeId || ''}
                onChange={(e) => setFormData({ ...formData, employeeId: e.target.value, departmentId: '', positionId: '' })}
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
            </div>
          ) : (
            <div className="space-y-4">
              <div>
                <label className="block text-slate-700 mb-2">Assign by Department</label>
                <select
                  value={formData.departmentId || ''}
                  onChange={(e) => setFormData({ ...formData, departmentId: e.target.value, positionId: '', employeeId: '' })}
                  className="w-full px-4 py-2 border border-slate-300 rounded-lg"
                >
                  <option value="">Select Department (Optional)</option>
                  {departments.map((dept) => (
                    <option key={dept._id || dept.id} value={dept._id || dept.id}>
                      {dept.name}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-slate-700 mb-2">Or Select Multiple Employees</label>
                <select
                  multiple
                  value={formData.employeeIds || []}
                  onChange={(e) => {
                    const selected = Array.from(e.target.selectedOptions, option => option.value);
                    setFormData({ ...formData, employeeIds: selected, departmentId: '', positionId: '', employeeId: '' });
                  }}
                  className="w-full px-4 py-2 border border-slate-300 rounded-lg"
                  size={5}
                >
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
                <p className="text-sm text-slate-500 mt-1">Hold Ctrl/Cmd to select multiple</p>
              </div>
            </div>
          )}
          <div>
            <label className="block text-slate-700 mb-2">Shift</label>
            <select
              value={formData.shiftId || ''}
              onChange={(e) => setFormData({ ...formData, shiftId: e.target.value })}
              className="w-full px-4 py-2 border border-slate-300 rounded-lg"
            >
              <option value="">Select Shift</option>
              {shifts.map((shift) => (
                <option key={shift._id || shift.id} value={shift._id || shift.id}>
                  {shift.name}
                </option>
              ))}
            </select>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-slate-700 mb-2">Start Date</label>
              <input
                type="date"
                value={formData.startDate ? (formData.startDate.includes('T') ? formData.startDate.split('T')[0] : formData.startDate) : ''}
                onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
                className="w-full px-4 py-2 border border-slate-300 rounded-lg"
              />
            </div>
            <div>
              <label className="block text-slate-700 mb-2">End Date (Optional)</label>
              <input
                type="date"
                value={formData.endDate ? (formData.endDate.includes('T') ? formData.endDate.split('T')[0] : formData.endDate) : ''}
                onChange={(e) => setFormData({ ...formData, endDate: e.target.value || undefined })}
                className="w-full px-4 py-2 border border-slate-300 rounded-lg"
              />
            </div>
          </div>
          <div>
            <label className="block text-slate-700 mb-2">Status</label>
            <select
              value={formData.status || 'PENDING'}
              onChange={(e) => setFormData({ ...formData, status: e.target.value })}
              className="w-full px-4 py-2 border border-slate-300 rounded-lg"
            >
              <option value="PENDING">Pending</option>
              <option value="APPROVED">Approved</option>
              <option value="CANCELLED">Cancelled</option>
              <option value="EXPIRED">Expired</option>
            </select>
            <p className="text-sm text-slate-500 mt-1">
              HR Admin / System Admin can update shift statuses (Approved, Cancelled, Expired)
            </p>
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
              {loading ? 'Saving...' : selectedItem ? 'Update' : assignmentMode === 'bulk' ? 'Assign to All' : 'Assign'}
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
}

