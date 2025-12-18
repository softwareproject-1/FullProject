'use client'

import { useState } from 'react';
import { Card } from '../../components/Card';
import { DataTable } from '../../components/DataTable';
import { StatusBadge } from '../../components/StatusBadge';
import { Modal } from '../../components/Modal';
import { Calendar, Clock, AlertTriangle, Edit2 } from 'lucide-react';
import { mockShifts, mockAttendanceLogs } from '../../lib/api';
import type { AttendanceLog } from '../../lib/types';

export default function TimeManagement() {
  const [currentView, setCurrentView] = useState<'shifts' | 'attendance'>('shifts');
  const [selectedLog, setSelectedLog] = useState<AttendanceLog | null>(null);
  const [isCorrectionModalOpen, setIsCorrectionModalOpen] = useState(false);
  const [correctionForm, setCorrectionForm] = useState({
    punchIn: '',
    punchOut: '',
    reason: '',
  });

  const attendanceColumns = [
    { header: 'Employee', accessor: 'employeeName' as const },
    { header: 'Date', accessor: 'date' as const },
    {
      header: 'Punch In',
      accessor: (row: AttendanceLog) => (
        <span className={row.status === 'Late' ? 'text-amber-600' : 'text-slate-900'}>
          {row.punchIn || 'N/A'}
        </span>
      ),
    },
    {
      header: 'Punch Out',
      accessor: (row: AttendanceLog) => (
        <span className="text-slate-900">{row.punchOut || 'N/A'}</span>
      ),
    },
    {
      header: 'Status',
      accessor: (row: AttendanceLog) => <StatusBadge status={row.status} />,
    },
    {
      header: 'Actions',
      accessor: (row: AttendanceLog) => (
        <button
          onClick={() => {
            setSelectedLog(row);
            setCorrectionForm({
              punchIn: row.punchIn || '',
              punchOut: row.punchOut || '',
              reason: '',
            });
            setIsCorrectionModalOpen(true);
          }}
          className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
          title="Correct Attendance"
        >
          <Edit2 className="w-4 h-4" />
        </button>
      ),
    },
  ];

  const handleCorrectAttendance = () => {
    console.log('Correcting attendance:', selectedLog?.id, correctionForm);
    setIsCorrectionModalOpen(false);
    setSelectedLog(null);
  };

  const getRowClassName = (row: AttendanceLog) => {
    if (row.status === 'Late') return 'bg-amber-50';
    if (row.status === 'Missing Punch' || row.status === 'Absent') return 'bg-red-50';
    return '';
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-slate-900 mb-2">Time Management</h1>
          <p className="text-slate-600">Manage shifts, attendance, and time tracking</p>
        </div>
        
        <div className="flex gap-2">
          <button
            onClick={() => setCurrentView('shifts')}
            className={`px-4 py-2 rounded-lg transition-colors ${
              currentView === 'shifts'
                ? 'bg-slate-900 text-white'
                : 'bg-white text-slate-700 border border-slate-300 hover:bg-slate-50'
            }`}
          >
            <Clock className="w-4 h-4 inline mr-2" />
            Shifts
          </button>
          <button
            onClick={() => setCurrentView('attendance')}
            className={`px-4 py-2 rounded-lg transition-colors ${
              currentView === 'attendance'
                ? 'bg-slate-900 text-white'
                : 'bg-white text-slate-700 border border-slate-300 hover:bg-slate-50'
            }`}
          >
            <Calendar className="w-4 h-4 inline mr-2" />
            Attendance Logs
          </button>
        </div>
      </div>

      {currentView === 'shifts' && (
        <div className="space-y-6">
          <Card title="Shift Planner">
            <div className="mb-6">
              <div className="flex items-center gap-4 mb-4">
                <input
                  type="date"
                  defaultValue="2025-12-09"
                  className="px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                <button className="px-4 py-2 bg-slate-900 text-white rounded-lg hover:bg-slate-800 transition-colors">
                  View Schedule
                </button>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {mockShifts.map((shift) => (
                <div
                  key={shift.id}
                  className={`p-4 border-2 rounded-lg cursor-pointer transition-colors ${
                    shift.type === 'Normal'
                      ? 'border-green-200 bg-green-50 hover:border-green-400'
                      : shift.type === 'Overnight'
                      ? 'border-blue-200 bg-blue-50 hover:border-blue-400'
                      : 'border-amber-200 bg-amber-50 hover:border-amber-400'
                  }`}
                >
                  <div className="flex items-center justify-between mb-2">
                    <h4 className="text-slate-900">{shift.name}</h4>
                    <StatusBadge status={shift.type} variant="info" />
                  </div>
                  <div className="space-y-1">
                    <p className="text-slate-600">
                      {shift.startTime} - {shift.endTime}
                    </p>
                    <p className="text-slate-600">
                      Break: {shift.breakDuration} mins
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </Card>

          <Card title="Assign Shifts">
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-slate-700 mb-2">Select Employee</label>
                  <select className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500">
                    <option value="">Choose an employee...</option>
                    {mockAttendanceLogs.map((log) => (
                      <option key={log.id} value={log.employeeId}>
                        {log.employeeName}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-slate-700 mb-2">Select Shift</label>
                  <select className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500">
                    <option value="">Choose a shift...</option>
                    {mockShifts.map((shift) => (
                      <option key={shift.id} value={shift.id}>
                        {shift.name} ({shift.startTime} - {shift.endTime})
                      </option>
                    ))}
                  </select>
                </div>
              </div>
              <div>
                <label className="block text-slate-700 mb-2">Date Range</label>
                <div className="grid grid-cols-2 gap-4">
                  <input
                    type="date"
                    className="px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                  <input
                    type="date"
                    className="px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>
              <button className="w-full bg-slate-900 text-white px-4 py-2 rounded-lg hover:bg-slate-800 transition-colors">
                Assign Shift
              </button>
            </div>
          </Card>
        </div>
      )}

      {currentView === 'attendance' && (
        <div className="space-y-6">
          <div className="flex items-center gap-3 p-4 bg-amber-50 border border-amber-200 rounded-lg">
            <AlertTriangle className="w-5 h-5 text-amber-600" />
            <p className="text-amber-800">
              Late punches are highlighted in <strong>amber</strong>, missing punches and absences are highlighted in <strong>red</strong>.
            </p>
          </div>

          <Card title="Attendance Logs - December 9, 2025">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-slate-50 border-b border-slate-200">
                  <tr>
                    {attendanceColumns.map((col, idx) => (
                      <th key={idx} className="px-6 py-3 text-left text-slate-700">
                        {col.header}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-slate-200">
                  {mockAttendanceLogs.map((row) => (
                    <tr key={row.id} className={getRowClassName(row)}>
                      {attendanceColumns.map((col, idx) => (
                        <td key={idx} className="px-6 py-4">
                          {typeof col.accessor === 'function'
                            ? col.accessor(row)
                            : row[col.accessor as keyof AttendanceLog]}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>
        </div>
      )}

      {/* Manual Correction Modal */}
      <Modal
        isOpen={isCorrectionModalOpen}
        onClose={() => {
          setIsCorrectionModalOpen(false);
          setSelectedLog(null);
        }}
        title="Manual Attendance Correction"
        size="md"
      >
        <div className="space-y-4">
          <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
            <p className="text-slate-700 mb-1">Employee: <strong>{selectedLog?.employeeName}</strong></p>
            <p className="text-slate-700">Date: <strong>{selectedLog?.date}</strong></p>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-slate-700 mb-2">Punch In Time</label>
              <input
                type="time"
                value={correctionForm.punchIn}
                onChange={(e) => setCorrectionForm({ ...correctionForm, punchIn: e.target.value })}
                className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-slate-700 mb-2">Punch Out Time</label>
              <input
                type="time"
                value={correctionForm.punchOut}
                onChange={(e) => setCorrectionForm({ ...correctionForm, punchOut: e.target.value })}
                className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>

          <div>
            <label className="block text-slate-700 mb-2">Correction Reason</label>
            <textarea
              value={correctionForm.reason}
              onChange={(e) => setCorrectionForm({ ...correctionForm, reason: e.target.value })}
              rows={3}
              className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Explain why this correction is needed..."
            />
          </div>

          <div className="flex justify-end gap-3">
            <button
              onClick={() => {
                setIsCorrectionModalOpen(false);
                setSelectedLog(null);
              }}
              className="px-4 py-2 border border-slate-300 text-slate-700 rounded-lg hover:bg-slate-50 transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handleCorrectAttendance}
              className="px-4 py-2 bg-slate-900 text-white rounded-lg hover:bg-slate-800 transition-colors"
            >
              Save Correction
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
}