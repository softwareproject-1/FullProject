'use client'

import { useState, useEffect, useMemo } from 'react';
import { Card } from '../../../components/Card';
import { timeManagementApi, employeeProfileApi } from '../../../lib/api';
import { handleTimeManagementError, extractArrayData } from '../../../lib/time-management-utils';
import { formatDate, toISO8601 } from '../../../lib/date-utils';
import { Download, TrendingUp, Clock, AlertTriangle, BarChart3, Users, Calendar } from 'lucide-react';
import { BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';

const COLORS = ['#0f172a', '#475569', '#64748b', '#94a3b8', '#cbd5e1'];

export default function ReportsPage() {
  const [loading, setLoading] = useState(false);
  const [reportType, setReportType] = useState<'attendance' | 'overtime' | 'exceptions'>('attendance');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [employeeId, setEmployeeId] = useState('');
  const [employees, setEmployees] = useState<any[]>([]);
  const [reportData, setReportData] = useState<any>(null);

  useEffect(() => {
    loadEmployees();
  }, []);

  const loadEmployees = async () => {
    try {
      const response = await employeeProfileApi.getAll();
      setEmployees(extractArrayData(response));
    } catch (error) {
      console.error('Error loading employees:', error);
      setEmployees([]);
    }
  };

  const generateReport = async () => {
    if (!startDate || !endDate) {
      alert('Please select both start and end dates');
      return;
    }
    try {
      setLoading(true);
      let response;
      // Convert dates to ISO 8601 format
      const params: any = { 
        startDate: toISO8601(startDate, 'start'),
        endDate: toISO8601(endDate, 'end')
      };
      if (employeeId) params.employeeId = employeeId;

      switch (reportType) {
        case 'attendance':
          response = await timeManagementApi.generateAttendanceReport(params);
          break;
        case 'overtime':
          response = await timeManagementApi.generateOvertimeReport(params);
          break;
        case 'exceptions':
          response = await timeManagementApi.generateExceptionReport(params);
          break;
      }
      
      // Handle response - axios wraps the response in .data
      const data = response?.data || response;
      console.log('=== REPORT GENERATION DEBUG ===');
      console.log('Full API Response:', response);
      console.log('Extracted data:', data);
      console.log('Data type:', typeof data);
      console.log('Is array?', Array.isArray(data));
      console.log('Has records?', !!data?.records);
      console.log('Records type:', typeof data?.records);
      console.log('Records is array?', Array.isArray(data?.records));
      console.log('Records count:', data?.records?.length);
      console.log('Total records:', data?.totalRecords);
      console.log('Total work minutes:', data?.totalWorkMinutes);
      console.log('Params sent:', params);
      
      if (reportType === 'exceptions' && data?.exceptions) {
        console.log('Exceptions report - Total exceptions:', data.totalExceptions);
        console.log('Exceptions array length:', data.exceptions.length);
        if (data.exceptions.length > 0) {
          console.log('First exception full object:', JSON.stringify(data.exceptions[0], null, 2));
          console.log('First exception employeeId:', data.exceptions[0].employeeId);
          console.log('First exception employeeId type:', typeof data.exceptions[0].employeeId);
          console.log('First exception employeeId is object:', typeof data.exceptions[0].employeeId === 'object');
          console.log('First exception createdAt:', data.exceptions[0].createdAt);
          console.log('First exception date:', data.exceptions[0].date);
        }
      } else if (data && data.records && Array.isArray(data.records) && data.records.length > 0) {
        console.log('Sample record:', JSON.stringify(data.records[0], null, 2));
        console.log('Record employeeId:', data.records[0].employeeId);
        console.log('Record date:', data.records[0].date);
        console.log('Record totalWorkMinutes:', data.records[0].totalWorkMinutes);
      } else if (data && (!data.records || data.records.length === 0)) {
        console.warn('No records found in response. Data structure:', Object.keys(data || {}));
      }
      console.log('=== END DEBUG ===');
      
      setReportData(data);
    } catch (error: any) {
      console.error('Error generating report:', error);
      handleTimeManagementError(error, 'generating report');
      setReportData(null);
    } finally {
      setLoading(false);
    }
  };

  // Process attendance data for charts
  const attendanceChartData = useMemo(() => {
    if (!reportData || reportType !== 'attendance' || !reportData.records) {
      // Only log if we actually have reportData but wrong type or missing records
      if (reportData && reportType !== 'attendance') {
        console.log('Wrong report type for attendance chart:', reportType);
      } else if (reportData && reportType === 'attendance' && !reportData.records) {
        console.log('Attendance report data missing records array:', reportData);
      }
      return [];
    }
    
    if (!reportData.records || !Array.isArray(reportData.records)) {
      console.log('No records array in report data:', reportData);
      return [];
    }

    console.log('Processing attendance chart data, records count:', reportData.records.length);

    // Group records by date
    const groupedByDate: { [key: string]: { date: string; totalHours: number; count: number; employees: Set<string> } } = {};
    
    reportData.records.forEach((record: any) => {
      // Try multiple date fields - prioritize date, then createdAt
      let date: Date;
      if (record.date) {
        date = new Date(record.date);
      } else if (record.createdAt) {
        date = new Date(record.createdAt);
      } else {
        console.warn('Record missing date field:', record);
        return; // Skip records without dates
      }
      
      if (isNaN(date.getTime())) {
        console.warn('Invalid date in record:', record);
        return; // Skip invalid dates
      }
      
      // Use local date string to match with the selected date range
      const year = date.getFullYear();
      const month = String(date.getMonth() + 1).padStart(2, '0');
      const day = String(date.getDate()).padStart(2, '0');
      const dateStr = `${year}-${month}-${day}`;
      
      if (!groupedByDate[dateStr]) {
        groupedByDate[dateStr] = {
          date: dateStr,
          totalHours: 0,
          count: 0,
          employees: new Set()
        };
      }
      
      const hours = (record.totalWorkMinutes || 0) / 60;
      groupedByDate[dateStr].totalHours += hours;
      groupedByDate[dateStr].count += 1;
      
      // Track unique employees
      const empId = typeof record.employeeId === 'object' 
        ? (record.employeeId?._id || record.employeeId?.id)?.toString()
        : record.employeeId?.toString();
      if (empId) {
        groupedByDate[dateStr].employees.add(empId);
      }
    });

    return Object.values(groupedByDate)
      .map(item => {
        const dateObj = new Date(item.date);
        return {
          date: !isNaN(dateObj.getTime()) ? formatDate(dateObj) : item.date,
          hours: Number(item.totalHours.toFixed(2)),
          records: item.count,
          employees: item.employees.size,
          dateSort: item.date // Keep original for sorting
        };
      })
      .sort((a, b) => a.dateSort.localeCompare(b.dateSort));
  }, [reportData, reportType]);

  // Process attendance data by employee
  const attendanceByEmployee = useMemo(() => {
    if (!reportData || reportType !== 'attendance' || !reportData.records || !Array.isArray(reportData.records)) {
      return [];
    }

    const groupedByEmployee: { [key: string]: { 
      employeeName: string; 
      totalHours: number; 
      records: number;
      employeeId: string;
    } } = {};

    reportData.records.forEach((record: any) => {
      const employee = record.employeeId;
      let empId: string;
      let empName = 'Unknown';

      if (typeof employee === 'object' && employee) {
        empId = (employee._id || employee.id)?.toString();
        empName = employee.fullName || 
          (employee.firstName && employee.lastName ? `${employee.firstName} ${employee.lastName}` : 
           employee.firstName || employee.lastName || employee.employeeNumber || 'Unknown');
      } else {
        empId = employee?.toString() || 'unknown';
        // Try to find in employees list
        const foundEmp = employees.find(e => (e._id || e.id)?.toString() === empId);
        if (foundEmp) {
          empName = foundEmp.fullName || 
            (foundEmp.firstName && foundEmp.lastName ? `${foundEmp.firstName} ${foundEmp.lastName}` : 
             foundEmp.firstName || foundEmp.lastName || foundEmp.employeeNumber || 'Unknown');
        }
      }

      if (!groupedByEmployee[empId]) {
        groupedByEmployee[empId] = {
          employeeName: empName,
          totalHours: 0,
          records: 0,
          employeeId: empId
        };
      }

      const hours = (record.totalWorkMinutes || 0) / 60;
      groupedByEmployee[empId].totalHours += hours;
      groupedByEmployee[empId].records += 1;
    });

    return Object.values(groupedByEmployee)
      .map(item => ({
        name: item.employeeName.length > 15 ? item.employeeName.substring(0, 15) + '...' : item.employeeName,
        fullName: item.employeeName,
        hours: Number(item.totalHours.toFixed(2)),
        records: item.records
      }))
      .sort((a, b) => b.hours - a.hours);
  }, [reportData, reportType, employees]);

  // Calculate summary statistics
  const summaryStats = useMemo(() => {
    if (!reportData || reportType !== 'attendance') return null;

    const totalHours = (reportData.totalWorkMinutes || 0) / 60;
    const totalRecords = reportData.totalRecords || 0;
    const avgHoursPerDay = attendanceChartData.length > 0 
      ? (totalHours / attendanceChartData.length).toFixed(2)
      : '0';
    const uniqueEmployees = new Set(
      reportData.records?.map((r: any) => {
        const emp = r.employeeId;
        return typeof emp === 'object' ? (emp._id || emp.id)?.toString() : emp?.toString();
      }) || []
    ).size;

    return {
      totalHours: Number(totalHours.toFixed(2)),
      totalRecords,
      avgHoursPerDay: Number(avgHoursPerDay),
      uniqueEmployees
    };
  }, [reportData, reportType, attendanceChartData]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-slate-900 mb-2">Reports</h1>
        <p className="text-slate-600">Generate attendance, overtime, and exception reports</p>
      </div>

      <Card title="Report Filters">
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-slate-700 mb-2">Report Type</label>
              <select
                value={reportType}
                onChange={(e) => {
                  setReportType(e.target.value as any);
                  setReportData(null);
                }}
                className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-slate-500 focus:border-slate-500"
              >
                <option value="attendance">Attendance Report</option>
                <option value="overtime">Overtime Report</option>
                <option value="exceptions">Exception Report</option>
              </select>
            </div>
            <div>
              <label className="block text-slate-700 mb-2">Employee (Optional)</label>
              <select
                value={employeeId}
                onChange={(e) => setEmployeeId(e.target.value)}
                className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-slate-500 focus:border-slate-500"
              >
                <option value="">All Employees</option>
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
            <div>
              <label className="block text-slate-700 mb-2">Start Date</label>
              <input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-slate-500 focus:border-slate-500"
              />
            </div>
            <div>
              <label className="block text-slate-700 mb-2">End Date</label>
              <input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-slate-500 focus:border-slate-500"
              />
            </div>
          </div>
          <button
            onClick={generateReport}
            disabled={loading || !startDate || !endDate}
            className="px-6 py-2.5 bg-slate-900 text-white rounded-lg hover:bg-slate-800 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 transition-colors"
          >
            <BarChart3 className="w-4 h-4" />
            {loading ? 'Generating...' : 'Generate Report'}
          </button>
        </div>
      </Card>

      {reportData && reportType === 'attendance' && (
        <div className="space-y-6">
          {/* Summary Statistics */}
          {summaryStats && (
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <Card>
                <div className="flex items-center gap-3">
                  <div className="p-3 bg-slate-100 rounded-lg">
                    <Clock className="w-5 h-5 text-slate-700" />
                  </div>
                  <div>
                    <p className="text-sm text-slate-600">Total Hours</p>
                    <p className="text-2xl font-semibold text-slate-900">{summaryStats.totalHours}h</p>
                  </div>
                </div>
              </Card>
              <Card>
                <div className="flex items-center gap-3">
                  <div className="p-3 bg-slate-100 rounded-lg">
                    <Calendar className="w-5 h-5 text-slate-700" />
                  </div>
                  <div>
                    <p className="text-sm text-slate-600">Total Records</p>
                    <p className="text-2xl font-semibold text-slate-900">{summaryStats.totalRecords}</p>
                  </div>
                </div>
              </Card>
              <Card>
                <div className="flex items-center gap-3">
                  <div className="p-3 bg-slate-100 rounded-lg">
                    <TrendingUp className="w-5 h-5 text-slate-700" />
                  </div>
                  <div>
                    <p className="text-sm text-slate-600">Avg Hours/Day</p>
                    <p className="text-2xl font-semibold text-slate-900">{summaryStats.avgHoursPerDay}h</p>
                  </div>
                </div>
              </Card>
              <Card>
                <div className="flex items-center gap-3">
                  <div className="p-3 bg-slate-100 rounded-lg">
                    <Users className="w-5 h-5 text-slate-700" />
                  </div>
                  <div>
                    <p className="text-sm text-slate-600">Employees</p>
                    <p className="text-2xl font-semibold text-slate-900">{summaryStats.uniqueEmployees}</p>
                  </div>
                </div>
              </Card>
            </div>
          )}

          {/* Charts */}
          {attendanceChartData.length > 0 && (
            <>
              <Card title="Working Hours Over Time">
                <div className="mt-4">
                  <ResponsiveContainer width="100%" height={350}>
                    <LineChart data={attendanceChartData}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                      <XAxis 
                        dataKey="date" 
                        stroke="#64748b"
                        style={{ fontSize: '12px' }}
                      />
                      <YAxis 
                        stroke="#64748b"
                        style={{ fontSize: '12px' }}
                        label={{ value: 'Hours', angle: -90, position: 'insideLeft', style: { textAnchor: 'middle', fill: '#64748b' } }}
                      />
                      <Tooltip 
                        contentStyle={{ 
                          backgroundColor: '#fff', 
                          border: '1px solid #e2e8f0', 
                          borderRadius: '8px',
                          boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
                        }}
                        formatter={(value: any) => [`${value}h`, 'Hours']}
                      />
                      <Legend />
                      <Line 
                        type="monotone" 
                        dataKey="hours" 
                        stroke="#0f172a" 
                        strokeWidth={2}
                        dot={{ fill: '#0f172a', r: 4 }}
                        name="Total Hours"
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </Card>

              <Card title="Working Hours by Employee">
                <div className="mt-4">
                  <ResponsiveContainer width="100%" height={400}>
                    <BarChart data={attendanceByEmployee.slice(0, 10)}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                      <XAxis 
                        dataKey="name" 
                        stroke="#64748b"
                        style={{ fontSize: '12px' }}
                        angle={-45}
                        textAnchor="end"
                        height={100}
                      />
                      <YAxis 
                        stroke="#64748b"
                        style={{ fontSize: '12px' }}
                        label={{ value: 'Hours', angle: -90, position: 'insideLeft', style: { textAnchor: 'middle', fill: '#64748b' } }}
                      />
                      <Tooltip 
                        contentStyle={{ 
                          backgroundColor: '#fff', 
                          border: '1px solid #e2e8f0', 
                          borderRadius: '8px',
                          boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
                        }}
                        formatter={(value: any, name: string, props: any) => {
                          if (name === 'hours') return [`${value}h`, 'Total Hours'];
                          if (name === 'records') return [value, 'Records'];
                          return [value, name];
                        }}
                        labelFormatter={(label) => {
                          const item = attendanceByEmployee.find(e => e.name === label);
                          return item?.fullName || label;
                        }}
                      />
                      <Legend />
                      <Bar dataKey="hours" fill="#0f172a" name="Total Hours" radius={[8, 8, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </Card>

              {/* Detailed Records Table */}
              <Card title="Detailed Attendance Records">
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-slate-50 border-b border-slate-200">
                      <tr>
                        <th className="px-6 py-3 text-left text-slate-700 text-sm font-semibold">Employee</th>
                        <th className="px-6 py-3 text-left text-slate-700 text-sm font-semibold">Date</th>
                        <th className="px-6 py-3 text-left text-slate-700 text-sm font-semibold">Working Hours</th>
                        <th className="px-6 py-3 text-left text-slate-700 text-sm font-semibold">Status</th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-slate-200">
                      {reportData.records?.slice(0, 20).map((record: any, index: number) => {
                        const employee = record.employeeId;
                        let empName = 'Unknown';
                        
                        if (typeof employee === 'object' && employee) {
                          empName = employee.fullName || 
                            (employee.firstName && employee.lastName ? `${employee.firstName} ${employee.lastName}` : 
                             employee.firstName || employee.lastName || employee.employeeNumber || 'Unknown');
                        } else {
                          const empId = employee?.toString();
                          const foundEmp = employees.find(e => (e._id || e.id)?.toString() === empId);
                          if (foundEmp) {
                            empName = foundEmp.fullName || 
                              (foundEmp.firstName && foundEmp.lastName ? `${foundEmp.firstName} ${foundEmp.lastName}` : 
                               foundEmp.firstName || foundEmp.lastName || foundEmp.employeeNumber || 'Unknown');
                          }
                        }

                        const date = record.date ? new Date(record.date) : (record.createdAt ? new Date(record.createdAt) : null);
                        const hours = (record.totalWorkMinutes || 0) / 60;
                        
                        return (
                          <tr key={index} className="hover:bg-slate-50">
                            <td className="px-6 py-4 text-slate-900">{empName}</td>
                            <td className="px-6 py-4 text-slate-600" suppressHydrationWarning>
                              {date && !isNaN(date.getTime()) ? formatDate(date) : 'N/A'}
                            </td>
                            <td className="px-6 py-4 text-slate-900 font-medium">{hours.toFixed(2)}h</td>
                            <td className="px-6 py-4">
                              {record.hasMissedPunch ? (
                                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-amber-50 text-amber-600">
                                  <AlertTriangle className="w-3 h-3 mr-1" />
                                  Missed Punch
                                </span>
                              ) : (
                                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-50 text-green-600">
                                  Complete
                                </span>
                              )}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                  {reportData.records?.length > 20 && (
                    <div className="px-6 py-4 text-sm text-slate-600 text-center border-t border-slate-200">
                      Showing 20 of {reportData.records.length} records
                    </div>
                  )}
                </div>
              </Card>
            </>
          )}

          {attendanceChartData.length === 0 && reportData && (
            <Card>
              <div className="text-center py-12">
                <BarChart3 className="w-12 h-12 text-slate-400 mx-auto mb-4" />
                <p className="text-slate-600 mb-2">No attendance data found for the selected period</p>
                <div className="text-sm text-slate-500 mt-4 space-y-1">
                  <p>Total Records: {reportData.totalRecords || 0}</p>
                  <p>Records Array Length: {reportData.records?.length || 0}</p>
                  <p>Date Range: {startDate ? formatDate(new Date(startDate)) : 'N/A'} to {endDate ? formatDate(new Date(endDate)) : 'N/A'}</p>
                  {employeeId && (
                    <p>Filtered by Employee: {employees.find(e => (e._id || e.id) === employeeId)?.fullName || employeeId}</p>
                  )}
                </div>
                <p className="text-xs text-slate-400 mt-4">Check the browser console for detailed debugging information</p>
              </div>
            </Card>
          )}
        </div>
      )}

      {/* Exception Report Visualizations */}
      {reportData && reportType === 'exceptions' && (
        <div className="space-y-6">
          {/* Summary Statistics */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <Card>
              <div className="flex items-center gap-3">
                <div className="p-3 bg-slate-100 rounded-lg">
                  <AlertTriangle className="w-5 h-5 text-slate-700" />
                </div>
                <div>
                  <p className="text-sm text-slate-600">Total Exceptions</p>
                  <p className="text-2xl font-semibold text-slate-900">{reportData.totalExceptions || 0}</p>
                </div>
              </div>
            </Card>
            <Card>
              <div className="flex items-center gap-3">
                <div className="p-3 bg-slate-100 rounded-lg">
                  <Users className="w-5 h-5 text-slate-700" />
                </div>
                <div>
                  <p className="text-sm text-slate-600">Exception Types</p>
                  <p className="text-2xl font-semibold text-slate-900">
                    {reportData.byType ? Object.keys(reportData.byType).length : 0}
                  </p>
                </div>
              </div>
            </Card>
            <Card>
              <div className="flex items-center gap-3">
                <div className="p-3 bg-slate-100 rounded-lg">
                  <BarChart3 className="w-5 h-5 text-slate-700" />
                </div>
                <div>
                  <p className="text-sm text-slate-600">Status Types</p>
                  <p className="text-2xl font-semibold text-slate-900">
                    {reportData.byStatus ? Object.keys(reportData.byStatus).length : 0}
                  </p>
                </div>
              </div>
            </Card>
            <Card>
              <div className="flex items-center gap-3">
                <div className="p-3 bg-slate-100 rounded-lg">
                  <Calendar className="w-5 h-5 text-slate-700" />
                </div>
                <div>
                  <p className="text-sm text-slate-600">Date Range</p>
                  <p className="text-sm font-semibold text-slate-900">
                    {startDate ? formatDate(new Date(startDate)) : 'N/A'} - {endDate ? formatDate(new Date(endDate)) : 'N/A'}
                  </p>
                </div>
              </div>
            </Card>
          </div>

          {/* Exception Type Distribution */}
          {reportData.byType && Object.keys(reportData.byType).length > 0 && (
            <Card title="Exceptions by Type">
              <div className="mt-4">
                <ResponsiveContainer width="100%" height={350}>
                  <BarChart data={Object.entries(reportData.byType).map(([type, exceptions]: [string, any]) => ({
                    type: type.replace(/_/g, ' '),
                    count: Array.isArray(exceptions) ? exceptions.length : 0
                  }))}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                    <XAxis 
                      dataKey="type" 
                      stroke="#64748b"
                      style={{ fontSize: '12px' }}
                      angle={-45}
                      textAnchor="end"
                      height={100}
                    />
                    <YAxis 
                      stroke="#64748b"
                      style={{ fontSize: '12px' }}
                    />
                    <Tooltip 
                      contentStyle={{ 
                        backgroundColor: '#fff', 
                        border: '1px solid #e2e8f0', 
                        borderRadius: '8px',
                        boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
                      }}
                    />
                    <Legend />
                    <Bar dataKey="count" fill="#0f172a" name="Count" radius={[8, 8, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </Card>
          )}

          {/* Exception Status Distribution */}
          {reportData.byStatus && Object.keys(reportData.byStatus).length > 0 && (
            <Card title="Exceptions by Status">
              <div className="mt-4">
                <ResponsiveContainer width="100%" height={350}>
                  <PieChart>
                    <Pie
                      data={Object.entries(reportData.byStatus).map(([status, exceptions]: [string, any]) => ({
                        name: status.replace(/_/g, ' '),
                        value: Array.isArray(exceptions) ? exceptions.length : 0
                      }))}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                      outerRadius={100}
                      fill="#8884d8"
                      dataKey="value"
                    >
                      {Object.entries(reportData.byStatus).map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip 
                      contentStyle={{ 
                        backgroundColor: '#fff', 
                        border: '1px solid #e2e8f0', 
                        borderRadius: '8px',
                        boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
                      }}
                    />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </Card>
          )}

          {/* Exceptions Over Time */}
          {reportData.exceptions && Array.isArray(reportData.exceptions) && reportData.exceptions.length > 0 && (
            <Card title="Exceptions Over Time">
              <div className="mt-4">
                <ResponsiveContainer width="100%" height={350}>
                  <LineChart data={(() => {
                    const grouped: { [key: string]: number } = {};
                    reportData.exceptions.forEach((exc: any) => {
                      const dateValue = exc.createdAt || exc.date;
                      if (!dateValue) return; // Skip if no date
                      const date = new Date(dateValue);
                      if (isNaN(date.getTime())) return; // Skip invalid dates
                      const dateStr = formatDate(date);
                      grouped[dateStr] = (grouped[dateStr] || 0) + 1;
                    });
                    return Object.entries(grouped)
                      .map(([date, count]) => ({ date, count }))
                      .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
                  })()}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                    <XAxis 
                      dataKey="date" 
                      stroke="#64748b"
                      style={{ fontSize: '12px' }}
                    />
                    <YAxis 
                      stroke="#64748b"
                      style={{ fontSize: '12px' }}
                    />
                    <Tooltip 
                      contentStyle={{ 
                        backgroundColor: '#fff', 
                        border: '1px solid #e2e8f0', 
                        borderRadius: '8px',
                        boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
                      }}
                    />
                    <Legend />
                    <Line 
                      type="monotone" 
                      dataKey="count" 
                      stroke="#0f172a" 
                      strokeWidth={2}
                      dot={{ fill: '#0f172a', r: 4 }}
                      name="Exceptions"
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </Card>
          )}

          {/* Detailed Exceptions Table */}
          {reportData.exceptions && Array.isArray(reportData.exceptions) && reportData.exceptions.length > 0 && (
            <Card title="Detailed Exception Records">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-slate-50 border-b border-slate-200">
                    <tr>
                      <th className="px-6 py-3 text-left text-slate-700 text-sm font-semibold">Employee</th>
                      <th className="px-6 py-3 text-left text-slate-700 text-sm font-semibold">Type</th>
                      <th className="px-6 py-3 text-left text-slate-700 text-sm font-semibold">Status</th>
                      <th className="px-6 py-3 text-left text-slate-700 text-sm font-semibold">Date</th>
                      <th className="px-6 py-3 text-left text-slate-700 text-sm font-semibold">Reason</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-slate-200">
                    {reportData.exceptions.slice(0, 20).map((exception: any, index: number) => {
                      const employee = exception.employeeId;
                      let empName = 'Unknown';
                      
                      // Debug logging for first exception
                      if (index === 0) {
                        console.log('Exception employee data (first record):', {
                          employee,
                          employeeType: typeof employee,
                          isObject: typeof employee === 'object',
                          isArray: Array.isArray(employee),
                          hasFirstName: employee?.firstName,
                          hasLastName: employee?.lastName,
                          hasFullName: employee?.fullName,
                          hasEmployeeNumber: employee?.employeeNumber,
                          hasId: employee?._id || employee?.id,
                          fullException: exception,
                        });
                      }
                      
                      if (employee) {
                        // Check if it's a populated employee object (Mongoose returns populated objects)
                        if (typeof employee === 'object' && !Array.isArray(employee) && employee !== null) {
                          // Check for populated fields (Mongoose populates with these fields)
                          if (employee.firstName || employee.lastName || employee.fullName || employee.employeeNumber) {
                            empName = employee.fullName || 
                              (employee.firstName && employee.lastName ? `${employee.firstName} ${employee.lastName}` : 
                               employee.firstName || employee.lastName || employee.employeeNumber || 'Unknown');
                          } else if (employee._id || employee.id) {
                            // It's an object but not populated, try to find in employees list
                            const empId = (employee._id || employee.id)?.toString();
                            if (empId && employees.length > 0) {
                              const foundEmployee = employees.find(emp => {
                                const empIdStr = (emp._id || emp.id)?.toString();
                                return empIdStr === empId;
                              });
                              if (foundEmployee) {
                                empName = foundEmployee.fullName || 
                                  (foundEmployee.firstName && foundEmployee.lastName ? `${foundEmployee.firstName} ${foundEmployee.lastName}` : 
                                   foundEmployee.firstName || foundEmployee.lastName || foundEmployee.employeeNumber || 'Unknown');
                              } else {
                                console.warn('Employee not found in employees list for ID:', empId, 'Available employees:', employees.length);
                              }
                            }
                          }
                        } else if (typeof employee === 'string') {
                          // It's just a string ID, try to find in employees list
                          if (employees.length > 0) {
                            const foundEmployee = employees.find(emp => {
                              const empIdStr = (emp._id || emp.id)?.toString();
                              return empIdStr === employee;
                            });
                            if (foundEmployee) {
                              empName = foundEmployee.fullName || 
                                (foundEmployee.firstName && foundEmployee.lastName ? `${foundEmployee.firstName} ${foundEmployee.lastName}` : 
                                 foundEmployee.firstName || foundEmployee.lastName || foundEmployee.employeeNumber || 'Unknown');
                            } else {
                              console.warn('Employee not found in employees list for string ID:', employee);
                            }
                          } else {
                            console.warn('Employees list is empty, cannot lookup employee ID:', employee);
                          }
                        }
                      } else {
                        console.warn('Exception has no employeeId:', exception._id || exception.id);
                      }

                      // Date extraction - get from populated attendanceRecordId (preferred) or exception's own date fields
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
                        dateToFormat = exception.createdAt || exception.date || (exception as any).timestamp;
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
                      
                      let date: Date | null = null;
                      if (dateToFormat) {
                        date = dateToFormat instanceof Date ? dateToFormat : new Date(dateToFormat);
                        if (isNaN(date.getTime())) {
                          date = null;
                        }
                      }
                      
                      return (
                        <tr key={index} className="hover:bg-slate-50">
                          <td className="px-6 py-4 text-slate-900">{empName}</td>
                          <td className="px-6 py-4">
                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-50 text-blue-600">
                              {exception.type?.replace(/_/g, ' ') || 'N/A'}
                            </span>
                          </td>
                          <td className="px-6 py-4">
                            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                              exception.status === 'APPROVED' ? 'bg-green-50 text-green-600' :
                              exception.status === 'REJECTED' ? 'bg-red-50 text-red-600' :
                              exception.status === 'PENDING' ? 'bg-amber-50 text-amber-600' :
                              'bg-slate-50 text-slate-600'
                            }`}>
                              {exception.status?.replace(/_/g, ' ') || 'N/A'}
                            </span>
                          </td>
                          <td className="px-6 py-4 text-slate-600" suppressHydrationWarning>
                            {date ? formatDate(date) : 'N/A'}
                          </td>
                          <td className="px-6 py-4 text-slate-600">{exception.reason || 'N/A'}</td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
                {reportData.exceptions.length > 20 && (
                  <div className="px-6 py-4 text-sm text-slate-600 text-center border-t border-slate-200">
                    Showing 20 of {reportData.exceptions.length} exceptions
                  </div>
                )}
              </div>
            </Card>
          )}
        </div>
      )}

      {/* Overtime Report Visualizations */}
      {reportData && reportType === 'overtime' && (
        <div className="space-y-6">
          {/* Summary Statistics */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <Card>
              <div className="flex items-center gap-3">
                <div className="p-3 bg-slate-100 rounded-lg">
                  <Clock className="w-5 h-5 text-slate-700" />
                </div>
                <div>
                  <p className="text-sm text-slate-600">Total Overtime</p>
                  <p className="text-2xl font-semibold text-slate-900">
                    {reportData.totalOvertimeHours || ((reportData.totalOvertimeMinutes || 0) / 60).toFixed(2)}h
                  </p>
                </div>
              </div>
            </Card>
            <Card>
              <div className="flex items-center gap-3">
                <div className="p-3 bg-slate-100 rounded-lg">
                  <Calendar className="w-5 h-5 text-slate-700" />
                </div>
                <div>
                  <p className="text-sm text-slate-600">Total Records</p>
                  <p className="text-2xl font-semibold text-slate-900">{reportData.totalRecords || 0}</p>
                </div>
              </div>
            </Card>
            <Card>
              <div className="flex items-center gap-3">
                <div className="p-3 bg-slate-100 rounded-lg">
                  <TrendingUp className="w-5 h-5 text-slate-700" />
                </div>
                <div>
                  <p className="text-sm text-slate-600">Avg Overtime</p>
                  <p className="text-2xl font-semibold text-slate-900">
                    {reportData.totalRecords > 0 
                      ? ((reportData.totalOvertimeMinutes || 0) / 60 / reportData.totalRecords).toFixed(2)
                      : '0'}h
                  </p>
                </div>
              </div>
            </Card>
            <Card>
              <div className="flex items-center gap-3">
                <div className="p-3 bg-slate-100 rounded-lg">
                  <Users className="w-5 h-5 text-slate-700" />
                </div>
                <div>
                  <p className="text-sm text-slate-600">Employees</p>
                  <p className="text-2xl font-semibold text-slate-900">
                    {reportData.totalEmployees !== undefined 
                      ? reportData.totalEmployees 
                      : (reportData.records ? new Set(reportData.records.map((r: any) => {
                          const emp = r.employeeId;
                          return typeof emp === 'object' ? (emp._id || emp.id)?.toString() : emp?.toString();
                        })).size : 0)}
                  </p>
                </div>
              </div>
            </Card>
          </div>

          {/* Overtime Over Time */}
          {reportData.records && Array.isArray(reportData.records) && reportData.records.length > 0 && (
            <>
              <Card title="Overtime Hours Over Time">
                <div className="mt-4">
                  <ResponsiveContainer width="100%" height={350}>
                    <LineChart data={(() => {
                      const grouped: { [key: string]: number } = {};
                      reportData.records.forEach((record: any) => {
                        const dateValue = record.date || record.createdAt;
                        if (!dateValue) return; // Skip if no date
                        const date = new Date(dateValue);
                        if (isNaN(date.getTime())) return; // Skip invalid dates
                        const dateStr = formatDate(date);
                        const hours = (record.overtimeMinutes || 0) / 60;
                        grouped[dateStr] = (grouped[dateStr] || 0) + hours;
                      });
                      return Object.entries(grouped)
                        .map(([date, hours]) => ({ date, hours: Number(hours.toFixed(2)) }))
                        .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
                    })()}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                      <XAxis 
                        dataKey="date" 
                        stroke="#64748b"
                        style={{ fontSize: '12px' }}
                      />
                      <YAxis 
                        stroke="#64748b"
                        style={{ fontSize: '12px' }}
                        label={{ value: 'Hours', angle: -90, position: 'insideLeft', style: { textAnchor: 'middle', fill: '#64748b' } }}
                      />
                      <Tooltip 
                        contentStyle={{ 
                          backgroundColor: '#fff', 
                          border: '1px solid #e2e8f0', 
                          borderRadius: '8px',
                          boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
                        }}
                        formatter={(value: any) => [`${value}h`, 'Overtime Hours']}
                      />
                      <Legend />
                      <Line 
                        type="monotone" 
                        dataKey="hours" 
                        stroke="#0f172a" 
                        strokeWidth={2}
                        dot={{ fill: '#0f172a', r: 4 }}
                        name="Overtime Hours"
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </Card>

              {/* Overtime by Employee */}
              <Card title="Overtime Hours by Employee">
                <div className="mt-4">
                  <ResponsiveContainer width="100%" height={400}>
                    <BarChart data={(() => {
                      const grouped: { [key: string]: { name: string; hours: number; records: number } } = {};
                      reportData.records.forEach((record: any) => {
                        const employee = record.employeeId;
                        let empId: string;
                        let empName = 'Unknown';

                        if (typeof employee === 'object' && employee) {
                          empId = (employee._id || employee.id)?.toString();
                          empName = employee.fullName || 
                            (employee.firstName && employee.lastName ? `${employee.firstName} ${employee.lastName}` : 
                             employee.firstName || employee.lastName || employee.employeeNumber || 'Unknown');
                        } else {
                          empId = employee?.toString() || 'unknown';
                          const foundEmp = employees.find(e => (e._id || e.id)?.toString() === empId);
                          if (foundEmp) {
                            empName = foundEmp.fullName || 
                              (foundEmp.firstName && foundEmp.lastName ? `${foundEmp.firstName} ${foundEmp.lastName}` : 
                               foundEmp.firstName || foundEmp.lastName || foundEmp.employeeNumber || 'Unknown');
                          }
                        }

                        if (!grouped[empId]) {
                          grouped[empId] = { name: empName, hours: 0, records: 0 };
                        }
                        const hours = (record.overtimeMinutes || 0) / 60;
                        grouped[empId].hours += hours;
                        grouped[empId].records += 1;
                      });
                      return Object.values(grouped)
                        .map(item => ({
                          name: item.name.length > 15 ? item.name.substring(0, 15) + '...' : item.name,
                          fullName: item.name,
                          hours: Number(item.hours.toFixed(2)),
                          records: item.records
                        }))
                        .sort((a, b) => b.hours - a.hours)
                        .slice(0, 10);
                    })()}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                      <XAxis 
                        dataKey="name" 
                        stroke="#64748b"
                        style={{ fontSize: '12px' }}
                        angle={-45}
                        textAnchor="end"
                        height={100}
                      />
                      <YAxis 
                        stroke="#64748b"
                        style={{ fontSize: '12px' }}
                        label={{ value: 'Hours', angle: -90, position: 'insideLeft', style: { textAnchor: 'middle', fill: '#64748b' } }}
                      />
                      <Tooltip 
                        contentStyle={{ 
                          backgroundColor: '#fff', 
                          border: '1px solid #e2e8f0', 
                          borderRadius: '8px',
                          boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
                        }}
                        formatter={(value: any, name: string) => {
                          if (name === 'hours') return [`${value}h`, 'Overtime Hours'];
                          return [value, name];
                        }}
                        labelFormatter={(label) => {
                          const item = Object.values(reportData.records).find((r: any) => {
                            const emp = r.employeeId;
                            const empName = typeof emp === 'object' ? (emp.fullName || emp.firstName) : '';
                            return empName?.substring(0, 15) === label;
                          });
                          return label;
                        }}
                      />
                      <Legend />
                      <Bar dataKey="hours" fill="#0f172a" name="Overtime Hours" radius={[8, 8, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </Card>

              {/* Detailed Overtime Records Table */}
              <Card title="Detailed Overtime Records">
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-slate-50 border-b border-slate-200">
                      <tr>
                        <th className="px-6 py-3 text-left text-slate-700 text-sm font-semibold">Employee</th>
                        <th className="px-6 py-3 text-left text-slate-700 text-sm font-semibold">Date</th>
                        <th className="px-6 py-3 text-left text-slate-700 text-sm font-semibold">Overtime Hours</th>
                        <th className="px-6 py-3 text-left text-slate-700 text-sm font-semibold">Total Work Hours</th>
                        <th className="px-6 py-3 text-left text-slate-700 text-sm font-semibold">Regular Hours</th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-slate-200">
                      {reportData.records.slice(0, 20).map((record: any, index: number) => {
                        const employee = record.employeeId;
                        let empName = 'Unknown';
                        
                        if (typeof employee === 'object' && employee) {
                          empName = employee.fullName || 
                            (employee.firstName && employee.lastName ? `${employee.firstName} ${employee.lastName}` : 
                             employee.firstName || employee.lastName || employee.employeeNumber || 'Unknown');
                        } else {
                          const empId = employee?.toString();
                          const foundEmp = employees.find(e => (e._id || e.id)?.toString() === empId);
                          if (foundEmp) {
                            empName = foundEmp.fullName || 
                              (foundEmp.firstName && foundEmp.lastName ? `${foundEmp.firstName} ${foundEmp.lastName}` : 
                               foundEmp.firstName || foundEmp.lastName || foundEmp.employeeNumber || 'Unknown');
                          }
                        }

                        const dateValue = record.date || record.createdAt;
                        const date = dateValue ? new Date(dateValue) : null;
                        const overtimeHours = (record.overtimeMinutes || 0) / 60;
                        const totalHours = (record.totalWorkMinutes || 0) / 60;
                        const regularHours = (record.regularMinutes || 480) / 60; // Default to 8 hours
                        
                        return (
                          <tr key={index} className="hover:bg-slate-50">
                            <td className="px-6 py-4 text-slate-900">{empName}</td>
                            <td className="px-6 py-4 text-slate-600" suppressHydrationWarning>
                              {date && !isNaN(date.getTime()) ? formatDate(date) : 'N/A'}
                            </td>
                            <td className="px-6 py-4 text-slate-900 font-medium text-amber-600">
                              {overtimeHours.toFixed(2)}h
                            </td>
                            <td className="px-6 py-4 text-slate-600 font-medium">{totalHours.toFixed(2)}h</td>
                            <td className="px-6 py-4 text-slate-600">{regularHours.toFixed(2)}h</td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                  {reportData.records.length > 20 && (
                    <div className="px-6 py-4 text-sm text-slate-600 text-center border-t border-slate-200">
                      Showing 20 of {reportData.records.length} records
                    </div>
                  )}
                </div>
              </Card>
            </>
          )}

          {(!reportData.records || reportData.records.length === 0) && (
            <Card>
              <div className="text-center py-12">
                <TrendingUp className="w-12 h-12 text-slate-400 mx-auto mb-4" />
                <p className="text-slate-600">No overtime data found for the selected period</p>
              </div>
            </Card>
          )}
        </div>
      )}
    </div>
  );
}
