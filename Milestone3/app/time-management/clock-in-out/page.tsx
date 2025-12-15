'use client'

import { useState, useEffect } from 'react';
import { Card } from '../../../components/Card';
import { timeManagementApi, employeeProfileApi } from '../../../lib/api';
import { handleTimeManagementError, extractArrayData } from '../../../lib/time-management-utils';
import { Clock } from 'lucide-react';

export default function ClockInOutPage() {
  const [loading, setLoading] = useState(false);
  const [employees, setEmployees] = useState<any[]>([]);
  const [employeeId, setEmployeeId] = useState('');
  const [punchType, setPunchType] = useState<'IN' | 'OUT'>('IN');
  const [location, setLocation] = useState('');

  useEffect(() => {
    loadEmployees();
  }, []);

  const loadEmployees = async () => {
    try {
      const response = await employeeProfileApi.getAll();
      const employeesData = extractArrayData(response);
      console.log('Loaded employees:', employeesData.length, employeesData);
      setEmployees(Array.isArray(employeesData) ? employeesData : []);
    } catch (error) {
      console.error('Error loading employees:', error);
      setEmployees([]);
    }
  };

  const handleClock = async () => {
    if (!employeeId) {
      alert('Please select an employee');
      return;
    }
    try {
      setLoading(true);
      await timeManagementApi.clockInOut({
        employeeId,
        type: punchType,
        location,
      });
      alert(`Successfully clocked ${punchType === 'IN' ? 'in' : 'out'}`);
      setLocation('');
    } catch (error: any) {
      handleTimeManagementError(error, 'clocking in/out');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-slate-900 mb-2">Clock In/Out</h1>
        <p className="text-slate-600">Record employee clock in and out times</p>
      </div>

      <Card title="Clock In/Out">
        <div className="space-y-4 max-w-md">
          <div>
            <label className="block text-slate-700 mb-2">Employee</label>
            <select
              value={employeeId}
              onChange={(e) => setEmployeeId(e.target.value)}
              className="w-full px-4 py-2 border border-slate-300 rounded-lg"
            >
              <option value="">Select Employee</option>
              {!Array.isArray(employees) || employees.length === 0 ? (
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
            <label className="block text-slate-700 mb-2">Punch Type</label>
            <select
              value={punchType}
              onChange={(e) => setPunchType(e.target.value as 'IN' | 'OUT')}
              className="w-full px-4 py-2 border border-slate-300 rounded-lg"
            >
              <option value="IN">Clock In</option>
              <option value="OUT">Clock Out</option>
            </select>
          </div>
          <div>
            <label className="block text-slate-700 mb-2">Location (Optional)</label>
            <input
              type="text"
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              className="w-full px-4 py-2 border border-slate-300 rounded-lg"
              placeholder="e.g., Main Office"
            />
          </div>
          <button
            onClick={handleClock}
            disabled={loading || !employeeId}
            className="w-full px-4 py-2 bg-slate-900 text-white rounded-lg hover:bg-slate-800 disabled:opacity-50 flex items-center justify-center gap-2"
          >
            <Clock className="w-4 h-4" />
            {loading ? 'Processing...' : `Clock ${punchType === 'IN' ? 'In' : 'Out'}`}
          </button>
        </div>
      </Card>
    </div>
  );
}

