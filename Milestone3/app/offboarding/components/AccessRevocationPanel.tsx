'use client'

import { useState } from 'react';
import { offboardingApi } from '../../../services/api';
import { 
  Shield, 
  AlertTriangle, 
  Calendar, 
  Clock, 
  CheckCircle2,
  XCircle,
  Zap,
} from 'lucide-react';

interface AccessRevocationPanelProps {
  employeeId: string;
  terminationId: string;
  onSuccess: (message: string) => void;
  onError: (message: string) => void;
}

type RevocationReason = 'termination' | 'resignation' | 'no_show' | 'contract_cancelled';

export function AccessRevocationPanel({
  employeeId,
  terminationId,
  onSuccess,
  onError,
}: AccessRevocationPanelProps) {
  const [revocationMode, setRevocationMode] = useState<'scheduled' | 'immediate'>('scheduled');
  const [scheduledDate, setScheduledDate] = useState('');
  const [immediateReason, setImmediateReason] = useState<RevocationReason>('termination');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [result, setResult] = useState<{
    type: 'scheduled' | 'immediate';
    success: boolean;
    data: any;
  } | null>(null);

  // Calculate minimum date (today)
  const today = new Date().toISOString().split('T')[0];

  const handleScheduleRevocation = async () => {
    if (!scheduledDate) {
      onError('Please select a revocation date');
      return;
    }

    setIsSubmitting(true);
    try {
      const response = await offboardingApi.access.scheduleRevocation({
        employeeId,
        revocationDate: scheduledDate,
        terminationId,
      });
      
      setResult({
        type: 'scheduled',
        success: true,
        data: response.data,
      });
      onSuccess('Access revocation scheduled successfully');
    } catch (err: any) {
      onError(err.response?.data?.message || 'Failed to schedule access revocation');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleImmediateRevocation = async () => {
    if (!window.confirm('Are you sure you want to immediately revoke all access? This action cannot be undone.')) {
      return;
    }

    setIsSubmitting(true);
    try {
      const response = await offboardingApi.access.revokeImmediately({
        employeeId,
        reason: immediateReason,
        terminationId,
      });
      
      setResult({
        type: 'immediate',
        success: true,
        data: response.data,
      });
      onSuccess('Access revoked immediately');
    } catch (err: any) {
      onError(err.response?.data?.message || 'Failed to revoke access');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Info Banner */}
      <div className="p-4 bg-orange-50 border border-orange-200 rounded-lg">
        <div className="flex items-start gap-3">
          <Shield className="w-5 h-5 text-orange-600 flex-shrink-0 mt-0.5" />
          <div>
            <p className="font-medium text-orange-800">Access Revocation (OFF-007)</p>
            <p className="text-sm text-orange-700">
              Revoke system access to maintain security. Choose between scheduling revocation 
              for the last working day or immediate revocation for urgent cases.
            </p>
          </div>
        </div>
      </div>

      {/* Employee Info */}
      <div className="p-3 bg-slate-50 rounded-lg">
        <p className="text-sm text-slate-600">Employee ID</p>
        <p className="font-mono">{employeeId}</p>
      </div>

      {/* Mode Selection */}
      <div>
        <label className="block text-sm font-medium text-slate-700 mb-3">
          Revocation Type
        </label>
        <div className="grid grid-cols-2 gap-4">
          <button
            onClick={() => setRevocationMode('scheduled')}
            className={`p-4 border-2 rounded-lg text-left transition-colors ${
              revocationMode === 'scheduled'
                ? 'border-blue-500 bg-blue-50'
                : 'border-slate-200 hover:border-slate-300'
            }`}
          >
            <Calendar className={`w-6 h-6 mb-2 ${revocationMode === 'scheduled' ? 'text-blue-600' : 'text-slate-400'}`} />
            <p className="font-medium text-slate-900">Scheduled</p>
            <p className="text-sm text-slate-600">Set a date for access revocation</p>
          </button>
          <button
            onClick={() => setRevocationMode('immediate')}
            className={`p-4 border-2 rounded-lg text-left transition-colors ${
              revocationMode === 'immediate'
                ? 'border-red-500 bg-red-50'
                : 'border-slate-200 hover:border-slate-300'
            }`}
          >
            <Zap className={`w-6 h-6 mb-2 ${revocationMode === 'immediate' ? 'text-red-600' : 'text-slate-400'}`} />
            <p className="font-medium text-slate-900">Immediate</p>
            <p className="text-sm text-slate-600">Revoke all access right now</p>
          </button>
        </div>
      </div>

      {/* Scheduled Revocation Form */}
      {revocationMode === 'scheduled' && (
        <div className="space-y-4 p-4 bg-blue-50 border border-blue-200 rounded-lg">
          <h4 className="font-medium text-blue-900 flex items-center gap-2">
            <Clock className="w-5 h-5" />
            Schedule Access Revocation
          </h4>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">
              Revocation Date *
            </label>
            <input
              type="date"
              value={scheduledDate}
              onChange={(e) => setScheduledDate(e.target.value)}
              min={today}
              className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500"
            />
            <p className="text-xs text-slate-500 mt-1">
              Typically set to the employee's last working day
            </p>
          </div>
          <button
            onClick={handleScheduleRevocation}
            disabled={isSubmitting || !scheduledDate}
            className="w-full px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isSubmitting ? 'Scheduling...' : 'Schedule Revocation'}
          </button>
        </div>
      )}

      {/* Immediate Revocation Form */}
      {revocationMode === 'immediate' && (
        <div className="space-y-4 p-4 bg-red-50 border border-red-200 rounded-lg">
          <div className="flex items-start gap-3">
            <AlertTriangle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
            <div>
              <h4 className="font-medium text-red-900">Immediate Access Revocation</h4>
              <p className="text-sm text-red-700">
                This will immediately disable all system access for this employee. 
                This action is irreversible.
              </p>
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">
              Reason *
            </label>
            <select
              value={immediateReason}
              onChange={(e) => setImmediateReason(e.target.value as RevocationReason)}
              className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-red-500"
            >
              <option value="termination">Termination</option>
              <option value="resignation">Resignation</option>
              <option value="no_show">No Show</option>
              <option value="contract_cancelled">Contract Cancelled</option>
            </select>
          </div>
          <button
            onClick={handleImmediateRevocation}
            disabled={isSubmitting}
            className="w-full px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isSubmitting ? 'Revoking...' : 'Revoke Access Now'}
          </button>
        </div>
      )}

      {/* Result Display */}
      {result && (
        <div className={`p-4 rounded-lg ${
          result.success ? 'bg-green-50 border border-green-200' : 'bg-red-50 border border-red-200'
        }`}>
          <div className="flex items-start gap-3">
            {result.success ? (
              <CheckCircle2 className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
            ) : (
              <XCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
            )}
            <div>
              <p className={`font-medium ${result.success ? 'text-green-800' : 'text-red-800'}`}>
                {result.type === 'scheduled' ? 'Revocation Scheduled' : 'Access Revoked'}
              </p>
              {result.success && result.type === 'scheduled' && result.data && (
                <div className="text-sm text-green-700 mt-1">
                  <p>Effective Date: {new Date(result.data.effectiveDate).toLocaleDateString()}</p>
                  {result.data.systems && (
                    <p>Systems: {result.data.systems.join(', ')}</p>
                  )}
                </div>
              )}
              {result.success && result.type === 'immediate' && result.data && (
                <div className="text-sm text-green-700 mt-1">
                  <p>System Role Deactivated: {result.data.systemRoleDeactivated ? 'Yes' : 'No'}</p>
                  {result.data.revokedSystems && result.data.revokedSystems.length > 0 && (
                    <p>Revoked Systems: {result.data.revokedSystems.join(', ')}</p>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Systems List */}
      <div className="p-4 bg-slate-50 rounded-lg">
        <h4 className="font-medium text-slate-900 mb-3">Systems to be Revoked</h4>
        <ul className="space-y-2 text-sm text-slate-700">
          <li className="flex items-center gap-2">
            <div className="w-2 h-2 bg-slate-400 rounded-full" />
            Email and Communication Systems
          </li>
          <li className="flex items-center gap-2">
            <div className="w-2 h-2 bg-slate-400 rounded-full" />
            HR Management System
          </li>
          <li className="flex items-center gap-2">
            <div className="w-2 h-2 bg-slate-400 rounded-full" />
            Building Access / Physical Security
          </li>
          <li className="flex items-center gap-2">
            <div className="w-2 h-2 bg-slate-400 rounded-full" />
            VPN and Remote Access
          </li>
          <li className="flex items-center gap-2">
            <div className="w-2 h-2 bg-slate-400 rounded-full" />
            Internal Applications and Tools
          </li>
        </ul>
      </div>
    </div>
  );
}
