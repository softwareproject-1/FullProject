'use client'

import { useState, useEffect, useMemo } from 'react';
import { Card } from '../../../components/Card';
import { Modal } from '../../../components/Modal';
import { timeManagementApi, employeeProfileApi } from '../../../lib/api';
import { handleTimeManagementError, extractArrayData } from '../../../lib/time-management-utils';
import { formatDate, formatTime, isoToLocalDateTime, localDateTimeToISO } from '../../../lib/date-utils';
import { Edit2, Bell, Plus, Trash2 } from 'lucide-react';

export default function AttendancePage() {
  const [loading, setLoading] = useState(false);
  const [attendanceRecords, setAttendanceRecords] = useState<any[]>([]);
  const [employees, setEmployees] = useState<any[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedItem, setSelectedItem] = useState<any>(null);
  const [formData, setFormData] = useState<any>({});

  useEffect(() => {
    loadAttendanceRecords();
    loadEmployees();
  }, []);

  const loadEmployees = async () => {
    try {
      const response = await employeeProfileApi.getAll();
      const employeesData = extractArrayData(response);
      setEmployees(Array.isArray(employeesData) ? employeesData : []);
    } catch (error) {
      console.error('Error loading employees:', error);
      setEmployees([]);
    }
  };

  const loadAttendanceRecords = async () => {
    setLoading(true);
    // #region agent log
    fetch('http://127.0.0.1:7242/ingest/937ae396-a99d-45fe-a2dc-e3f53fc9d362',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'attendance/page.tsx:35',message:'loadAttendanceRecords entry',data:{},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'C'})}).catch(()=>{});
    // #endregion
    try {
      // #region agent log
      fetch('http://127.0.0.1:7242/ingest/937ae396-a99d-45fe-a2dc-e3f53fc9d362',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'attendance/page.tsx:38',message:'Before API call',data:{apiUrl:process.env.NEXT_PUBLIC_API_URL||'http://localhost:3001'},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'D'})}).catch(()=>{});
      // #endregion
      const response = await timeManagementApi.getAttendanceRecords();
      // #region agent log
      fetch('http://127.0.0.1:7242/ingest/937ae396-a99d-45fe-a2dc-e3f53fc9d362',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'attendance/page.tsx:41',message:'API call success',data:{status:response?.status,hasData:!!response?.data,dataType:typeof response?.data,isArray:Array.isArray(response?.data)},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'C'})}).catch(()=>{});
      // #endregion
      const records = extractArrayData(response);
      // #region agent log
      fetch('http://127.0.0.1:7242/ingest/937ae396-a99d-45fe-a2dc-e3f53fc9d362',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'attendance/page.tsx:44',message:'After extractArrayData',data:{recordsCount:records?.length,firstRecordKeys:records?.[0]?Object.keys(records[0]):null},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'C'})}).catch(()=>{});
      // #endregion
      console.log('Loaded attendance records:', records);
      if (records.length > 0) {
        console.log('Sample record:', JSON.stringify(records[0], null, 2));
        console.log('Sample record employeeId:', records[0].employeeId);
        console.log('Sample record employee:', records[0].employee);
        console.log('Employee type:', typeof records[0].employeeId);
        if (records[0].employeeId && typeof records[0].employeeId === 'object') {
          console.log('Employee has firstName?', records[0].employeeId.firstName);
          console.log('Employee has lastName?', records[0].employeeId.lastName);
          console.log('Employee has fullName?', records[0].employeeId.fullName);
        }
      }
      setAttendanceRecords(records);
      // #region agent log
      fetch('http://127.0.0.1:7242/ingest/937ae396-a99d-45fe-a2dc-e3f53fc9d362',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'attendance/page.tsx:56',message:'loadAttendanceRecords success exit',data:{recordsSet:true},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'C'})}).catch(()=>{});
      // #endregion
    } catch (error: any) {
      // #region agent log
      fetch('http://127.0.0.1:7242/ingest/937ae396-a99d-45fe-a2dc-e3f53fc9d362',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'attendance/page.tsx:58',message:'loadAttendanceRecords error catch',data:{errorMessage:error?.message,errorStatus:error?.response?.status,errorData:error?.response?.data,hasResponse:!!error?.response,hasRequest:!!error?.request},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'A'})}).catch(()=>{});
      // #endregion
      console.error('Error loading attendance records:', error);
      setAttendanceRecords([]);
      handleTimeManagementError(error, 'loading attendance records');
    } finally {
      setLoading(false);
    }
  };

  // Group records by employee and date, and calculate work hours
  const groupedRecords = useMemo(() => {
    const grouped: any = {};
    
    attendanceRecords.forEach((record) => {
      // Get employee - could be populated object or just ID
      const employee = record.employeeId || record.employee;
      const employeeId = typeof employee === 'string' ? employee : (employee?._id || employee?.id || employee);
      
      // Get date from first punch time (same logic as backend), or fallback to createdAt/date
      let recordDate: Date | null = null;
      let dateStr = '';
      
      try {
        // First, try to get date from first punch (most accurate)
        if (record.punches && Array.isArray(record.punches) && record.punches.length > 0) {
          const sortedPunches = [...record.punches].sort((a: any, b: any) => {
            const timeA = new Date(a.time).getTime();
            const timeB = new Date(b.time).getTime();
            return timeA - timeB;
          });
          recordDate = new Date(sortedPunches[0].time);
        }
        
        // Fallback to record.date or createdAt if no punches
        if (!recordDate || isNaN(recordDate.getTime())) {
          const fallbackDate = record.date || record.createdAt;
          if (fallbackDate) {
            recordDate = new Date(fallbackDate);
          }
        }
        
        // Final fallback to current date
        if (!recordDate || isNaN(recordDate.getTime())) {
          recordDate = new Date();
        }
        
        dateStr = recordDate.toISOString().split('T')[0];
      } catch (e) {
        console.error('Error parsing date:', e);
        dateStr = new Date().toISOString().split('T')[0];
        recordDate = new Date();
      }
      
      const key = `${employeeId}_${dateStr}`;
      
      if (!grouped[key]) {
        grouped[key] = {
          _id: record._id || record.id,
          employeeId: employeeId,
          employee: employee, // Preserve the populated employee object (this is record.employeeId if populated)
          date: dateStr,
          dateObj: recordDate ? new Date(recordDate) : new Date(),
          punches: [],
          totalWorkMinutes: record.totalWorkMinutes || 0, // Use backend calculated value if available
        };
      } else {
        // If we have a populated employee object and the existing one isn't populated, update it
        if (typeof employee === 'object' && (employee.firstName || employee.lastName || employee.fullName)) {
          grouped[key].employee = employee;
        }
        // Also preserve employeeId reference if it's populated
        if (typeof employee === 'object' && (employee.firstName || employee.lastName || employee.fullName)) {
          grouped[key].employeeId = employee; // Store populated object in employeeId too for easier access
        }
        // If this record has a more recent totalWorkMinutes (from backend), use it
        if (record.totalWorkMinutes !== undefined && record.totalWorkMinutes !== null) {
          grouped[key].totalWorkMinutes = record.totalWorkMinutes;
        }
      }
      
      // Add punches from this record, but only keep unique punches (deduplicate by time and type)
      // This prevents duplicates when multiple records exist for the same employee/date
      if (record.punches && Array.isArray(record.punches)) {
        // For each punch, check if we already have one with the same type and time (within 1 minute)
        record.punches.forEach((punch: any) => {
          const punchTime = new Date(punch.time).getTime();
          const punchType = String(punch.type).toUpperCase();
          
          // Check if we already have this punch (same type and time within 1 minute)
          const exists = grouped[key].punches.some((existing: any) => {
            const existingTime = new Date(existing.time).getTime();
            const existingType = String(existing.type).toUpperCase();
            const timeDiff = Math.abs(punchTime - existingTime);
            return existingType === punchType && timeDiff < 60000; // Within 1 minute
          });
          
          if (!exists) {
            grouped[key].punches.push(punch);
          }
        });
      }
    });
    
    // Calculate work hours for each grouped record using the same logic as backend
    // Only calculate if we have exactly one IN and one OUT punch
    Object.values(grouped).forEach((group: any) => {
      if (group.punches && Array.isArray(group.punches)) {
        // Filter to only IN and OUT punches
        const inPunches = group.punches.filter((p: any) => {
          const typeStr = String(p.type).toUpperCase();
          return typeStr === 'IN' && p && p.time;
        });
        const outPunches = group.punches.filter((p: any) => {
          const typeStr = String(p.type).toUpperCase();
          return typeStr === 'OUT' && p && p.time;
        });
        
        // Only calculate if we have exactly one IN and one OUT
        if (inPunches.length === 1 && outPunches.length === 1) {
          try {
            const inTime = new Date(inPunches[0].time).getTime();
            const outTime = new Date(outPunches[0].time).getTime();
            
            if (!isNaN(inTime) && !isNaN(outTime)) {
              const diffMs = outTime - inTime;
              if (diffMs > 0) {
                group.totalWorkMinutes = Math.floor(diffMs / 60000);
              } else {
                group.totalWorkMinutes = 0;
              }
            } else {
              group.totalWorkMinutes = 0;
            }
          } catch (e) {
            console.error('Error calculating work minutes:', e);
            group.totalWorkMinutes = 0;
          }
        } else {
          // No calculation if missing IN or OUT
          group.totalWorkMinutes = 0;
        }
      } else {
        group.totalWorkMinutes = 0;
      }
    });
    
    // Sort by date descending, then by employee name
    return Object.values(grouped).sort((a: any, b: any) => {
      const dateA = a.dateObj?.getTime() || 0;
      const dateB = b.dateObj?.getTime() || 0;
      return dateB - dateA;
    });
  }, [attendanceRecords]);

  const handleManualCorrection = async () => {
    if (!selectedItem) return;
    
    // Validate that we have a valid ID
    const recordId = selectedItem._id || selectedItem.id;
    if (!recordId) {
      alert('Error: No attendance record ID found. Please try again.');
      return;
    }
    
    // Validate punches - need at least one punch (IN)
    if (!formData.punches || formData.punches.length === 0) {
      alert('Please add at least an IN punch.');
      return;
    }
    
    // Ensure we only have one IN and one OUT maximum
    const inCount = formData.punches.filter((p: any) => String(p.type).toUpperCase() === 'IN').length;
    const outCount = formData.punches.filter((p: any) => String(p.type).toUpperCase() === 'OUT').length;
    
    if (inCount > 1 || outCount > 1) {
      alert('You can only have one IN punch and one OUT punch.');
      return;
    }
    
    try {
      setLoading(true);
      // Ensure punches are in the correct format
      const formattedPunches = formData.punches.map((p: any) => ({
        type: p.type || 'IN',
        time: p.time ? (typeof p.time === 'string' ? p.time : new Date(p.time).toISOString()) : new Date().toISOString(),
      }));
      
      await timeManagementApi.manualAttendanceCorrection(recordId.toString(), {
        punches: formattedPunches,
        reason: formData.reason || undefined,
      });
      setIsModalOpen(false);
      setSelectedItem(null);
      setFormData({});
      loadAttendanceRecords();
    } catch (error: any) {
      handleTimeManagementError(error, 'correcting attendance');
    } finally {
      setLoading(false);
    }
  };

  const checkMissedPunches = async () => {
    try {
      setLoading(true);
      await timeManagementApi.checkMissedPunches();
      alert('Missed punches checked and notifications sent');
      loadAttendanceRecords();
    } catch (error: any) {
      handleTimeManagementError(error, 'checking missed punches');
    } finally {
      setLoading(false);
    }
  };

  const openModal = (item: any) => {
    setSelectedItem(item);
    // Initialize punches array: keep only one IN and one OUT
    const allPunches = (item.punches || []).map((p: any) => ({
      type: p.type || 'IN',
      time: p.time ? (typeof p.time === 'string' ? p.time : new Date(p.time).toISOString()) : new Date().toISOString(),
    }));
    
    // Extract only first IN and last OUT
    const inPunches = allPunches.filter((p: any) => String(p.type).toUpperCase() === 'IN');
    const outPunches = allPunches.filter((p: any) => String(p.type).toUpperCase() === 'OUT');
    
    const initialPunches: any[] = [];
    if (inPunches.length > 0) {
      // Sort by time and take the first IN
      const sortedIn = [...inPunches].sort((a: any, b: any) => 
        new Date(a.time).getTime() - new Date(b.time).getTime()
      );
      initialPunches.push(sortedIn[0]);
    }
    if (outPunches.length > 0) {
      // Sort by time and take the last OUT
      const sortedOut = [...outPunches].sort((a: any, b: any) => 
        new Date(a.time).getTime() - new Date(b.time).getTime()
      );
      initialPunches.push(sortedOut[sortedOut.length - 1]);
    }
    
    // If no punches, add a default IN
    if (initialPunches.length === 0) {
      initialPunches.push({ type: 'IN', time: new Date().toISOString() });
    }
    
    setFormData({
      punches: initialPunches,
      reason: '',
    });
    setIsModalOpen(true);
  };

  const addPunch = () => {
    const currentPunches = formData.punches || [];
    const hasIn = currentPunches.some((p: any) => String(p.type).toUpperCase() === 'IN');
    const hasOut = currentPunches.some((p: any) => String(p.type).toUpperCase() === 'OUT');
    
    // Only allow one IN and one OUT
    if (!hasIn) {
      setFormData({
        ...formData,
        punches: [...currentPunches, { type: 'IN', time: new Date().toISOString() }],
      });
    } else if (!hasOut) {
      setFormData({
        ...formData,
        punches: [...currentPunches, { type: 'OUT', time: new Date().toISOString() }],
      });
    } else {
      alert('You can only have one IN punch and one OUT punch.');
    }
  };

  const removePunch = (index: number) => {
    const newPunches = formData.punches.filter((_: any, i: number) => i !== index);
    setFormData({ ...formData, punches: newPunches });
  };

  const updatePunch = (index: number, field: string, value: any) => {
    const newPunches = [...(formData.punches || [])];
    newPunches[index] = { ...newPunches[index], [field]: value };
    setFormData({ ...formData, punches: newPunches });
  };

  // Calculate working hours from punches in real-time
  // Only calculates if we have exactly one IN and one OUT
  const calculateWorkHours = (punches: any[]): string => {
    if (!punches || punches.length === 0) return 'N/A';
    
    // Filter to only IN and OUT punches
    const inPunches = punches.filter((p: any) => {
      const typeStr = String(p.type).toUpperCase();
      return typeStr === 'IN' && p && p.time;
    });
    const outPunches = punches.filter((p: any) => {
      const typeStr = String(p.type).toUpperCase();
      return typeStr === 'OUT' && p && p.time;
    });
    
    // Only calculate if we have exactly one IN and one OUT
    if (inPunches.length === 1 && outPunches.length === 1) {
      try {
        const inTime = new Date(inPunches[0].time).getTime();
        const outTime = new Date(outPunches[0].time).getTime();
        
        if (!isNaN(inTime) && !isNaN(outTime)) {
          const diffMs = outTime - inTime;
          if (diffMs > 0) {
            const totalMinutes = Math.floor(diffMs / 60000);
            const hours = Math.floor(totalMinutes / 60);
            const minutes = totalMinutes % 60;
            return `${hours}h ${minutes}m`;
          }
        }
      } catch (e) {
        console.error('Error calculating work hours:', e);
      }
    }
    
    // Return N/A if missing IN or OUT
    return 'N/A';
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-slate-900 mb-2">Attendance Records</h1>
          <p className="text-slate-600">View and manage attendance logs</p>
        </div>
        <button
          onClick={checkMissedPunches}
          disabled={loading}
          className="px-4 py-2 bg-amber-600 text-white rounded-lg hover:bg-amber-700 flex items-center gap-2 disabled:opacity-50"
        >
          <Bell className="w-4 h-4" />
          Check Missed Punches
        </button>
      </div>

      {loading && attendanceRecords.length === 0 ? (
        <div className="text-center py-12">Loading...</div>
      ) : (
        <Card title="Attendance Records">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-slate-50 border-b border-slate-200">
                <tr>
                  <th className="px-6 py-3 text-left text-slate-700">Employee</th>
                  <th className="px-6 py-3 text-left text-slate-700">Date</th>
                  <th className="px-6 py-3 text-left text-slate-700">Punch In</th>
                  <th className="px-6 py-3 text-left text-slate-700">Punch Out</th>
                  <th className="px-6 py-3 text-left text-slate-700">Work Hours</th>
                  <th className="px-6 py-3 text-left text-slate-700">Actions</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-slate-200">
                {groupedRecords.map((record: any) => {
                  // Get employee display name
                  const employee = record.employee || record.employeeId;
                  let employeeName = 'N/A';
                  
                  if (employee) {
                    // Check if it's a populated employee object (has firstName, lastName, or fullName)
                    if (typeof employee === 'object' && (employee.firstName || employee.lastName || employee.fullName)) {
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
                  
                  // Get punch in/out times
                  const punchIn = record.punches?.find((p: any) => String(p.type).toUpperCase() === 'IN');
                  const punchOut = record.punches?.find((p: any) => String(p.type).toUpperCase() === 'OUT');
                  
                  // Format date using consistent formatter
                  const dateToFormat = record.date || record.dateObj || record.createdAt;
                  const dateDisplay = formatDate(dateToFormat);
                  
                  // Format work hours - calculate and show when both IN and OUT exist
                  let workHours = 'N/A';
                  
                  // Check if we have both IN and OUT punches
                  const inPunch = record.punches?.find((p: any) => String(p.type).toUpperCase() === 'IN');
                  const outPunch = record.punches?.find((p: any) => String(p.type).toUpperCase() === 'OUT');
                  
                  if (inPunch && outPunch) {
                    // Both punches exist - calculate or use stored value
                    if (record.totalWorkMinutes !== undefined && record.totalWorkMinutes !== null && record.totalWorkMinutes > 0) {
                      // Use calculated value from backend
                      const hours = Math.floor(record.totalWorkMinutes / 60);
                      const minutes = record.totalWorkMinutes % 60;
                      workHours = `${hours}h ${minutes}m`;
                    } else {
                      // Calculate on the fly if not stored
                      try {
                        const inTime = new Date(inPunch.time).getTime();
                        const outTime = new Date(outPunch.time).getTime();
                        if (!isNaN(inTime) && !isNaN(outTime)) {
                          const diffMs = outTime - inTime;
                          if (diffMs > 0) {
                            const totalMinutes = Math.floor(diffMs / 60000);
                            const hours = Math.floor(totalMinutes / 60);
                            const minutes = totalMinutes % 60;
                            workHours = `${hours}h ${minutes}m`;
                          } else {
                            workHours = '0h 0m';
                          }
                        }
                      } catch (e) {
                        console.error('Error calculating work hours:', e);
                        workHours = 'N/A';
                      }
                    }
                  } else {
                    // Missing IN or OUT punch
                    workHours = 'N/A';
                  }
                  
                  return (
                    <tr key={record._id || `${record.employeeId}_${record.date}`}>
                      <td className="px-6 py-4" suppressHydrationWarning>{employeeName}</td>
                      <td className="px-6 py-4" suppressHydrationWarning>{dateDisplay}</td>
                      <td className="px-6 py-4" suppressHydrationWarning>
                        {punchIn?.time ? formatTime(punchIn.time) : 'N/A'}
                      </td>
                      <td className="px-6 py-4" suppressHydrationWarning>
                        {punchOut?.time ? formatTime(punchOut.time) : 'N/A'}
                      </td>
                      <td className="px-6 py-4">{workHours}</td>
                      <td className="px-6 py-4">
                        <button
                          onClick={() => openModal(record)}
                          className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg"
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>
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
        title="Manual Attendance Correction"
        size="md"
      >
        <div className="space-y-4">
          <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
            <p className="text-slate-700 mb-1">
              <span className="font-semibold">Employee:</span>{' '}
              {selectedItem?.employee 
                ? (selectedItem.employee.fullName || 
                   (selectedItem.employee.firstName && selectedItem.employee.lastName 
                     ? `${selectedItem.employee.firstName} ${selectedItem.employee.lastName}` 
                     : selectedItem.employee.firstName || selectedItem.employee.lastName || selectedItem.employee.employeeNumber || 'N/A'))
                : 'N/A'}
            </p>
            <p className="text-slate-700">
              <span className="font-semibold">Date:</span>{' '}
              <strong>{formatDate(selectedItem?.date || selectedItem?.dateObj || selectedItem?.createdAt)}</strong>
            </p>
          </div>
          
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="block text-slate-700 font-semibold">Punches</label>
              <button
                type="button"
                onClick={addPunch}
                className="px-3 py-1.5 text-sm bg-slate-900 text-white rounded-lg hover:bg-slate-800 flex items-center gap-1"
              >
                <Plus className="w-3 h-3" />
                Add Punch
              </button>
            </div>
            
            <div className="space-y-3 max-h-64 overflow-y-auto">
              {formData.punches && formData.punches.length > 0 ? (
                formData.punches.map((punch: any, index: number) => (
                  <div key={index} className="p-3 border border-slate-300 rounded-lg bg-slate-50">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm font-medium text-slate-700">Punch {index + 1}</span>
                      {formData.punches.length > 1 && (
                        <button
                          type="button"
                          onClick={() => removePunch(index)}
                          className="p-1 text-red-600 hover:bg-red-50 rounded"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="block text-xs text-slate-600 mb-1">Type</label>
                        <select
                          value={punch.type || 'IN'}
                          onChange={(e) => updatePunch(index, 'type', e.target.value)}
                          className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm"
                        >
                          <option value="IN">IN</option>
                          <option value="OUT">OUT</option>
                        </select>
                      </div>
                      <div>
                        <label className="block text-xs text-slate-600 mb-1">Time</label>
                        <input
                          type="datetime-local"
                          value={punch.time ? isoToLocalDateTime(punch.time) : ''}
                          onChange={(e) => {
                            const dateValue = e.target.value ? localDateTimeToISO(e.target.value) : new Date().toISOString();
                            updatePunch(index, 'time', dateValue);
                          }}
                          className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm"
                        />
                      </div>
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-center py-4 text-slate-500 text-sm">
                  No punches. Click "Add Punch" to add one.
                </div>
              )}
            </div>
          </div>
          
          <div>
            <label className="block text-slate-700 mb-2 font-semibold">Reason</label>
            <textarea
              value={formData.reason || ''}
              onChange={(e) => setFormData({ ...formData, reason: e.target.value })}
              className="w-full px-4 py-2 border border-slate-300 rounded-lg"
              rows={3}
              placeholder="Reason for correction..."
            />
          </div>
          
          {/* Real-time working hours preview */}
          {formData.punches && formData.punches.length > 0 && (
            <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg">
              <p className="text-sm text-slate-700">
                <span className="font-semibold">Calculated Work Hours:</span>{' '}
                <span className="text-slate-900 font-medium">{calculateWorkHours(formData.punches)}</span>
              </p>
            </div>
          )}
          <div className="flex justify-end gap-3">
            <button
              onClick={() => setIsModalOpen(false)}
              className="px-4 py-2 border border-slate-300 text-slate-700 rounded-lg hover:bg-slate-50"
            >
              Cancel
            </button>
            <button
              onClick={handleManualCorrection}
              disabled={loading}
              className="px-4 py-2 bg-slate-900 text-white rounded-lg hover:bg-slate-800 disabled:opacity-50"
            >
              {loading ? 'Saving...' : 'Save Correction'}
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
}

