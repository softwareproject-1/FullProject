'use client'

import { useState, useEffect, useMemo } from 'react';
import { Card } from '../../../components/Card';
import { Modal } from '../../../components/Modal';
import { timeManagementApi, employeeProfileApi } from '../../../lib/api';
import { handleTimeManagementError, extractArrayData } from '../../../lib/time-management-utils';
import { formatDate, formatTime, isoToLocalDateTime, localDateTimeToISO } from '../../../lib/date-utils';
import { Edit2, Bell, Plus, Trash2, Flag, AlertTriangle } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { hasRole, SystemRole } from '@/utils/roleAccess';

export default function AttendancePage() {
  const { user } = useAuth();
  const isDepartmentEmployee = user ? hasRole(user.roles, SystemRole.DEPARTMENT_EMPLOYEE) : false;
  const isHREmployee = user ? hasRole(user.roles, SystemRole.HR_EMPLOYEE) : false;
  const isRecruiter = user ? hasRole(user.roles, SystemRole.RECRUITER) : false;
  const isHRAdmin = user ? hasRole(user.roles, SystemRole.HR_ADMIN) : false;
  const isHRManager = user ? hasRole(user.roles, SystemRole.HR_MANAGER) : false;
  const isSystemAdmin = user ? hasRole(user.roles, SystemRole.SYSTEM_ADMIN) : false;
  const canOnlyViewOwn = isDepartmentEmployee || isHREmployee || isRecruiter;
  const canSeeLateWarning = isHRAdmin || isHRManager;
  // Backend allows: DEPARTMENT_HEAD, SYSTEM_ADMIN, HR_ADMIN, HR_MANAGER
  // Frontend: Hide for Department Employee, HR Employee, and System Admin
  const canEditAttendance = !canOnlyViewOwn && !isSystemAdmin;
  const [loading, setLoading] = useState(false);
  const [attendanceRecords, setAttendanceRecords] = useState<any[]>([]);
  const [employees, setEmployees] = useState<any[]>([]);
  const [shiftAssignments, setShiftAssignments] = useState<any[]>([]);
  const [shifts, setShifts] = useState<any[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedItem, setSelectedItem] = useState<any>(null);
  const [formData, setFormData] = useState<any>({});

  useEffect(() => {
    loadAttendanceRecords();
    loadEmployees();
    if (canSeeLateWarning) {
      loadShiftAssignments();
      loadShifts();
    }
  }, [canSeeLateWarning]);

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

  const loadShiftAssignments = async () => {
    try {
      const response = await timeManagementApi.getShiftAssignments();
      const assignments = extractArrayData(response);
      setShiftAssignments(Array.isArray(assignments) ? assignments : []);
    } catch (error) {
      console.error('Error loading shift assignments:', error);
      setShiftAssignments([]);
    }
  };

  const loadShifts = async () => {
    try {
      const response = await timeManagementApi.getShifts();
      const shiftsData = extractArrayData(response);
      setShifts(Array.isArray(shiftsData) ? shiftsData : []);
    } catch (error) {
      console.error('Error loading shifts:', error);
      setShifts([]);
    }
  };

  // Check if employee punched in late based on their shift
  const isEmployeeLate = (record: any): boolean => {
    if (!canSeeLateWarning || !record.punches) return false;
    
    const punchIn = record.punches.find((p: any) => String(p.type).toUpperCase() === 'IN');
    if (!punchIn || !punchIn.time) return false;
    
    const employeeId = typeof record.employeeId === 'string' 
      ? record.employeeId 
      : (record.employeeId?._id || record.employeeId?.id || record.employeeId);
    
    if (!employeeId) return false;
    
    // Find active shift assignment for this employee on the record date
    const recordDate = record.dateObj || new Date(record.date || record.createdAt);
    const recordDateStr = recordDate.toISOString().split('T')[0];
    
    const assignment = shiftAssignments.find((sa: any) => {
      const saEmployeeId = typeof sa.employeeId === 'string'
        ? sa.employeeId
        : (sa.employeeId?._id || sa.employeeId?.id || sa.employeeId);
      
      if (saEmployeeId?.toString() !== employeeId.toString()) return false;
      
      const startDate = new Date(sa.startDate);
      const endDate = sa.endDate ? new Date(sa.endDate) : null;
      const assignmentDateStr = startDate.toISOString().split('T')[0];
      
      // Check if record date is within assignment date range
      if (recordDateStr < assignmentDateStr) return false;
      if (endDate && recordDateStr > endDate.toISOString().split('T')[0]) return false;
      
      return true;
    });
    
    if (!assignment || !assignment.shiftId) return false;
    
    // Get shift details
    const shiftId = typeof assignment.shiftId === 'string'
      ? assignment.shiftId
      : (assignment.shiftId?._id || assignment.shiftId?.id || assignment.shiftId);
    
    const shift = shifts.find((s: any) => {
      const sId = s._id || s.id;
      return sId?.toString() === shiftId?.toString();
    });
    
    if (!shift || !shift.startTime) return false;
    
    // Parse shift start time (format: "HH:MM" or "HH:MM:SS")
    const [shiftHours, shiftMinutes] = shift.startTime.split(':').map(Number);
    if (isNaN(shiftHours) || isNaN(shiftMinutes)) return false;
    
    // Get punch-in time
    const punchInTime = new Date(punchIn.time);
    const punchInHours = punchInTime.getHours();
    const punchInMinutes = punchInTime.getMinutes();
    
    // Compare: if punch-in time is after shift start time, employee is late
    const punchInTotalMinutes = punchInHours * 60 + punchInMinutes;
    const shiftStartTotalMinutes = shiftHours * 60 + shiftMinutes;
    
    return punchInTotalMinutes > shiftStartTotalMinutes;
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
      // For Department Employees, HR Employees, and Recruiters, only load their own attendance records
      const response = (canOnlyViewOwn && user?._id)
        ? await timeManagementApi.getAttendanceRecords({ employeeId: user._id })
        : await timeManagementApi.getAttendanceRecords();
      // #region agent log
      fetch('http://127.0.0.1:7242/ingest/937ae396-a99d-45fe-a2dc-e3f53fc9d362',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'attendance/page.tsx:41',message:'API call success',data:{status:response?.status,hasData:!!response?.data,dataType:typeof response?.data,isArray:Array.isArray(response?.data)},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'C'})}).catch(()=>{});
      // #endregion
      const records = extractArrayData(response);
      // #region agent log
      fetch('http://127.0.0.1:7242/ingest/937ae396-a99d-45fe-a2dc-e3f53fc9d362',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'attendance/page.tsx:44',message:'After extractArrayData',data:{recordsCount:records?.length,firstRecordKeys:records?.[0]?Object.keys(records[0]):null},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'C'})}).catch(()=>{});
      // #endregion
      console.log('Loaded attendance records:', records);
      console.log('Total records loaded:', records.length);
      
      // Log all records with their punches
      records.forEach((record: any, index: number) => {
        console.log(`Record ${index + 1}:`, {
          _id: record._id || record.id,
          employeeId: record.employeeId,
          punchesCount: record.punches?.length || 0,
          punches: record.punches,
          hasIn: record.punches?.some((p: any) => String(p.type).toUpperCase() === 'IN'),
          hasOut: record.punches?.some((p: any) => String(p.type).toUpperCase() === 'OUT'),
        });
      });
      
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

  // Process records and merge records for the same employee on the same date
  const groupedRecords = useMemo(() => {
    // First, process all records to extract employee, date, and punches
    const processedRecords: any[] = [];
    
    // Process ALL records - don't skip any
    attendanceRecords.forEach((record) => {
      // Get employee - could be populated object or just ID
      const employee = record.employeeId || record.employee;
      const employeeId = typeof employee === 'string' ? employee : (employee?._id || employee?.id || employee);
      
      // If no employeeId, use a placeholder to ensure the record is still processed
      const finalEmployeeId = employeeId || 'unknown';
      
      // Get date from first punch time (same logic as backend), or fallback to createdAt/date
      let recordDate: Date | null = null;
      let dateStr = '';
      
      try {
        // First, try to get date from first punch (most accurate)
        if (record.punches && Array.isArray(record.punches) && record.punches.length > 0) {
          const validPunches = record.punches.filter((p: any) => p && p.time);
          if (validPunches.length > 0) {
            const sortedPunches = [...validPunches].sort((a: any, b: any) => {
              const timeA = new Date(a.time).getTime();
              const timeB = new Date(b.time).getTime();
              return timeA - timeB;
            });
            recordDate = new Date(sortedPunches[0].time);
          }
        }
        
        // Fallback to record.date or createdAt if no punches
        if (!recordDate || isNaN(recordDate.getTime())) {
          const fallbackDate = record.date || record.createdAt || record.dateObj;
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
        console.error('Error parsing date:', e, record);
        dateStr = new Date().toISOString().split('T')[0];
        recordDate = new Date();
      }
      
      // Create a processed record - include ALL records, even those with no punches or employeeId
      const processedRecord: any = {
        _id: record._id || record.id || `${finalEmployeeId}_${dateStr}_${Date.now()}`,
        employeeId: finalEmployeeId,
        employee: employee, // Preserve the populated employee object
        date: dateStr,
        dateObj: recordDate ? new Date(recordDate) : new Date(),
        punches: record.punches || [], // Can be empty array - that's fine
        totalWorkMinutes: record.totalWorkMinutes || 0,
      };
      
      processedRecords.push(processedRecord);
    });
    
    console.log('Total processed records:', processedRecords.length, 'out of', attendanceRecords.length);
    
    // Group records by employeeId and date
    const groupedMap = new Map<string, any[]>();
    
    processedRecords.forEach((record) => {
      // Create a unique key for grouping: employeeId + date
      const key = `${record.employeeId}_${record.date}`;
      if (!groupedMap.has(key)) {
        groupedMap.set(key, []);
      }
      groupedMap.get(key)!.push(record);
    });
    
    console.log('Grouped records into', groupedMap.size, 'groups');
    
    // Create separate rows for each IN/OUT pair (or single punches)
    const mergedRecords: any[] = [];
    
    groupedMap.forEach((records, key) => {
      if (records.length === 0) {
        console.warn('Empty group found for key:', key);
        return;
      }
      
      console.log(`Processing ${records.length} record(s) for key: ${key}`);
      
      // Use the first record as the base for employee/date info
      const baseRecord = records[0];
      
      // Collect all punches from all records in the group
      const allPunches: any[] = [];
      records.forEach((r) => {
        if (r.punches && Array.isArray(r.punches) && r.punches.length > 0) {
          allPunches.push(...r.punches);
        }
      });
      
      // If no punches, still create one record to show
      if (allPunches.length === 0) {
        mergedRecords.push({
          _id: baseRecord._id || `${baseRecord.employeeId}_${baseRecord.date}`,
          employeeId: baseRecord.employeeId,
          employee: baseRecord.employee,
          date: baseRecord.date,
          dateObj: baseRecord.dateObj,
          punches: [],
          totalWorkMinutes: 0,
        });
        return;
      }
      
      // Sort all punches by time
      const sortedPunches = allPunches.sort((a: any, b: any) => {
        const timeA = new Date(a.time).getTime();
        const timeB = new Date(b.time).getTime();
        return timeA - timeB;
      });
      
      // Pair up IN and OUT punches chronologically
      // Create a row for each IN/OUT pair, or for standalone punches
      let currentInPunch: any = null;
      let rowIndex = 0;
      
      sortedPunches.forEach((punch: any) => {
        const punchType = String(punch.type).toUpperCase();
        
        if (punchType === 'IN') {
          // If we have a previous IN without an OUT, create a row for it
          if (currentInPunch) {
            mergedRecords.push({
              _id: `${baseRecord.employeeId}_${baseRecord.date}_${rowIndex++}`,
              employeeId: baseRecord.employeeId,
              employee: baseRecord.employee,
              date: baseRecord.date,
              dateObj: baseRecord.dateObj,
              punches: [currentInPunch],
              totalWorkMinutes: 0,
            });
          }
          // Set new IN punch
          currentInPunch = punch;
        } else if (punchType === 'OUT') {
          // If we have a current IN, pair it with this OUT
          if (currentInPunch) {
            const punches = [currentInPunch, punch];
            let totalWorkMinutes = 0;
            
            try {
              const inTime = new Date(currentInPunch.time).getTime();
              const outTime = new Date(punch.time).getTime();
              
              if (!isNaN(inTime) && !isNaN(outTime) && outTime > inTime) {
                totalWorkMinutes = Math.floor((outTime - inTime) / 60000);
              }
            } catch (e) {
              console.error('Error calculating work minutes:', e);
            }
            
            mergedRecords.push({
              _id: `${baseRecord.employeeId}_${baseRecord.date}_${rowIndex++}`,
              employeeId: baseRecord.employeeId,
              employee: baseRecord.employee,
              date: baseRecord.date,
              dateObj: baseRecord.dateObj,
              punches: punches,
              totalWorkMinutes: totalWorkMinutes,
            });
            currentInPunch = null;
          } else {
            // Standalone OUT punch (no matching IN)
            mergedRecords.push({
              _id: `${baseRecord.employeeId}_${baseRecord.date}_${rowIndex++}`,
              employeeId: baseRecord.employeeId,
              employee: baseRecord.employee,
              date: baseRecord.date,
              dateObj: baseRecord.dateObj,
              punches: [punch],
              totalWorkMinutes: 0,
            });
          }
        }
      });
      
      // If there's a remaining IN punch without an OUT, create a row for it
      if (currentInPunch) {
        mergedRecords.push({
          _id: `${baseRecord.employeeId}_${baseRecord.date}_${rowIndex++}`,
          employeeId: baseRecord.employeeId,
          employee: baseRecord.employee,
          date: baseRecord.date,
          dateObj: baseRecord.dateObj,
          punches: [currentInPunch],
          totalWorkMinutes: 0,
        });
      }
    });
    
    console.log('Total merged records:', mergedRecords.length);
    
    // Sort by date descending, then by employee name
    const sorted = mergedRecords.sort((a: any, b: any) => {
      const dateA = a.dateObj?.getTime() || 0;
      const dateB = b.dateObj?.getTime() || 0;
      if (dateB !== dateA) {
        return dateB - dateA;
      }
      // If same date, sort by employee name
      const nameA = typeof a.employee === 'object' && a.employee !== null
        ? (a.employee.fullName || `${a.employee.firstName || ''} ${a.employee.lastName || ''}` || '')
        : '';
      const nameB = typeof b.employee === 'object' && b.employee !== null
        ? (b.employee.fullName || `${b.employee.firstName || ''} ${b.employee.lastName || ''}` || '')
        : '';
      return nameA.localeCompare(nameB);
    });
    
    return sorted;
  }, [attendanceRecords]);

  const handleManualCorrection = async () => {
    if (!selectedItem) return;
    
    // Validate that we have a valid ID
    const recordId = selectedItem._id || selectedItem.id;
    if (!recordId) {
      alert('Error: No attendance record ID found. Please try again.');
      return;
    }
    
    // Ensure recordId is a string and valid MongoDB ObjectId format (24 hex characters)
    const recordIdStr = recordId.toString();
    if (!/^[0-9a-fA-F]{24}$/.test(recordIdStr)) {
      alert('Error: Invalid attendance record ID format. Please try again.');
      console.error('Invalid record ID:', recordIdStr);
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
      
      const response = await timeManagementApi.manualAttendanceCorrection(recordIdStr, {
        attendanceRecordId: recordIdStr,
        punches: formattedPunches,
        reason: formData.reason || undefined,
      });
      
      // Show success message
      alert('Attendance record corrected successfully!');
      
      // Close modal and reload data
      setIsModalOpen(false);
      setSelectedItem(null);
      setFormData({});
      await loadAttendanceRecords();
    } catch (error: any) {
      console.error('Error correcting attendance:', error);
      
      // Extract error message for user feedback
      let errorMessage = 'Failed to save correction. ';
      if (error.response) {
        const status = error.response.status;
        const data = error.response.data;
        
        if (status === 403) {
          errorMessage += 'You do not have permission to perform this action.';
        } else if (status === 400) {
          errorMessage += data?.message || 'Invalid request. Please check your input.';
        } else if (status === 404) {
          errorMessage += 'Attendance record not found.';
        } else {
          errorMessage += data?.message || `Server returned status ${status}.`;
        }
      } else if (error.message) {
        errorMessage += error.message;
      } else {
        errorMessage += 'An unexpected error occurred.';
      }
      
      alert(errorMessage);
      handleTimeManagementError(error, 'correcting attendance');
    } finally {
      setLoading(false);
    }
  };

  const checkMissedPunches = async () => {
    try {
      setLoading(true);
      console.log('Frontend: Calling checkMissedPunches API...');
      const response = await timeManagementApi.checkMissedPunches();
      console.log('Frontend: Received response:', response);
      
      const result = response.data || response;
      console.log('Frontend: Extracted result:', result);
      console.log('Frontend: missedPunches array:', result.missedPunches);
      console.log('Frontend: missedPunches length:', result.missedPunches?.length);
      
      // Show notification with results
      if (result.missedPunches && Array.isArray(result.missedPunches) && result.missedPunches.length > 0) {
        // Build detailed message with employee names and missing punch types
        const missedPunchDetails = result.missedPunches.map((mp: any) => {
          let punchType = '';
          if (mp.missingIn && mp.missingOut) {
            punchType = 'Missing both IN and OUT';
          } else if (mp.missingIn) {
            punchType = 'Missing Punch In';
          } else if (mp.missingOut) {
            punchType = 'Missing Punch Out';
          }
          return `${mp.employeeName} - ${punchType}`;
        }).join('\n');
        
        alert(`Found ${result.missedPunches.length} missed punch(es)!\n\n${missedPunchDetails}\n\nNotifications have been sent.`);
      } else {
        alert(result.message || 'No missed punches found. All attendance records are complete.');
      }
      
      loadAttendanceRecords();
    } catch (error: any) {
      console.error('Frontend: Error checking missed punches:', error);
      console.error('Frontend: Error response:', error.response);
      alert(`Error checking missed punches: ${error.response?.data?.message || error.message || 'Unknown error'}`);
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
          <p className="text-slate-600">
            {canOnlyViewOwn ? 'View your attendance records' : 'View and manage attendance logs'}
          </p>
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
                  {canEditAttendance && (
                    <th className="px-6 py-3 text-left text-slate-700">Actions</th>
                  )}
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-slate-200">
                {groupedRecords.length === 0 ? (
                  <tr>
                    <td 
                      colSpan={canEditAttendance ? 6 : 5} 
                      className="px-6 py-12 text-center text-slate-500"
                    >
                      No attendance records found.
                    </td>
                  </tr>
                ) : (
                  groupedRecords.map((record: any) => {
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
                  
                  // Format punch in/out - show time if exists, otherwise N/A
                  // If only one punch exists, show its date and time, and N/A for the other
                  let punchInDisplay = 'N/A';
                  let punchOutDisplay = 'N/A';
                  
                  if (punchIn?.time) {
                    punchInDisplay = formatTime(punchIn.time);
                  }
                  
                  if (punchOut?.time) {
                    punchOutDisplay = formatTime(punchOut.time);
                  }
                  
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
                  
                  const isLate = isEmployeeLate(record);
                  
                  return (
                    <tr key={record._id || `${record.employeeId}_${record.date}`}>
                      <td className="px-6 py-4" suppressHydrationWarning>
                        <div className="flex items-center gap-2">
                          {employeeName}
                          {isLate && (
                            <span title="Employee punched in after shift start time">
                              <AlertTriangle className="w-4 h-4 text-amber-500" />
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4" suppressHydrationWarning>{dateDisplay}</td>
                      <td className="px-6 py-4" suppressHydrationWarning>
                        <div className="flex items-center gap-2">
                          {punchInDisplay}
                          {punchInDisplay === 'N/A' && (
                            <Flag className="w-4 h-4 text-red-500" />
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4" suppressHydrationWarning>
                        <div className="flex items-center gap-2">
                          {punchOutDisplay}
                          {punchOutDisplay === 'N/A' && (
                            <Flag className="w-4 h-4 text-red-500" />
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4">{workHours}</td>
                      {canEditAttendance && (
                        <td className="px-6 py-4">
                          <button
                            onClick={() => openModal(record)}
                            className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg"
                          >
                            <Edit2 className="w-4 h-4" />
                          </button>
                        </td>
                      )}
                    </tr>
                  );
                  })
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

