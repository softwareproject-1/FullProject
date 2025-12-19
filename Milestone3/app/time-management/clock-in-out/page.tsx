'use client'

import { useState, useEffect } from 'react';
import { Card } from '../../../components/Card';
import { timeManagementApi } from '../../../lib/api';
import { handleTimeManagementError, extractArrayData } from '../../../lib/time-management-utils';
import { Clock } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { hasRole, SystemRole } from '@/utils/roleAccess';

export default function ClockInOutPage() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [employeeId, setEmployeeId] = useState('');
  const [punchType, setPunchType] = useState<'IN' | 'OUT'>('IN');
  const [location, setLocation] = useState('');

  useEffect(() => {
    // Auto-populate employeeId with logged-in user for all roles
    if (user?._id) {
      setEmployeeId(user._id);
    }
  }, [user?._id]);

  const handleClock = async () => {
    if (!employeeId) {
      alert('Employee information is missing. Please log in again.');
      return;
    }
    try {
      setLoading(true);
      console.log('Clock In/Out - Sending request:', { employeeId, type: punchType, location });
      const response = await timeManagementApi.clockInOut({
        employeeId,
        type: punchType,
        location,
      });
      console.log('Clock In/Out - Success:', response);
      alert(`Successfully clocked ${punchType === 'IN' ? 'in' : 'out'}`);
      setLocation('');
    } catch (error: any) {
      console.error('Clock In/Out - Error:', error);
      console.error('Clock In/Out - Error response:', error.response);
      console.error('Clock In/Out - Error status:', error.response?.status);
      console.error('Clock In/Out - Error data:', error.response?.data);
      
      // Show user-friendly error message
      let errorMessage = `Failed to clock ${punchType === 'IN' ? 'in' : 'out'}. `;
      if (error.response?.status === 403) {
        errorMessage += 'You do not have permission to perform this action.';
      } else if (error.response?.status === 401) {
        errorMessage += 'You are not authenticated. Please log in again.';
      } else if (error.response?.data?.message) {
        errorMessage += error.response.data.message;
      } else if (error.message) {
        errorMessage += error.message;
      } else {
        errorMessage += 'An unexpected error occurred.';
      }
      
      alert(errorMessage);
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
            <div className="w-full px-4 py-2 border border-slate-300 rounded-lg bg-slate-50">
              <p className="text-slate-700">
                {user?.firstName && user?.lastName 
                  ? `${user.firstName} ${user.lastName}`
                  : user?.firstName || user?.lastName || user?.employeeNumber || (user as any)?.fullName || 'Current User'}
                {user?.employeeNumber && ` (${user.employeeNumber})`}
              </p>
            </div>
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

