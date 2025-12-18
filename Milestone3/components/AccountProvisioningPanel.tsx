'use client';

import { useState, useEffect } from 'react';
import { Card } from './Card';
import { Modal } from './Modal';
import {
  Server,
  Mail,
  Laptop,
  Key,
  Shield,
  Clock,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  Calendar,
  UserX,
  Play,
  Trash2,
  RefreshCw,
} from 'lucide-react';
import { onboardingApi } from '../services/api';
import { OnboardingTracker } from '../lib/types';

interface AccountProvisioningPanelProps {
  onboarding: OnboardingTracker;
  onRefresh: () => void;
  onSuccess: (message: string) => void;
  onError: (message: string) => void;
}

// Available systems for provisioning
const AVAILABLE_SYSTEMS = [
  { id: 'email', name: 'Email Account', icon: Mail, description: 'Company email and calendar access' },
  { id: 'sso', name: 'SSO / Single Sign-On', icon: Key, description: 'Centralized authentication for all systems' },
  { id: 'laptop', name: 'Laptop / Workstation', icon: Laptop, description: 'Computer hardware and setup' },
  { id: 'payroll', name: 'Payroll System', icon: Server, description: 'Payroll and benefits access' },
  { id: 'internal_systems', name: 'Internal Systems', icon: Shield, description: 'ERP, CRM, and internal tools' },
  { id: 'vpn', name: 'VPN Access', icon: Server, description: 'Remote network access' },
];

export function AccountProvisioningPanel({
  onboarding,
  onRefresh,
  onSuccess,
  onError,
}: AccountProvisioningPanelProps) {
  // State for provisioning scheduling
  const [selectedSystems, setSelectedSystems] = useState<string[]>(['email', 'sso', 'laptop']);
  const [startDate, setStartDate] = useState<string>(() => {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    return tomorrow.toISOString().split('T')[0];
  });
  const [isScheduling, setIsScheduling] = useState(false);

  // State for revocation scheduling
  const [revocationEmployeeId, setRevocationEmployeeId] = useState(onboarding.employeeId);
  const [exitDate, setExitDate] = useState<string>('');
  const [revocationReason, setRevocationReason] = useState<'termination' | 'resignation' | 'no_show' | 'contract_cancelled'>('resignation');
  const [revokeImmediately, setRevokeImmediately] = useState(false);
  const [isSchedulingRevocation, setIsSchedulingRevocation] = useState(false);

  // State for cancel onboarding
  const [cancelReason, setCancelReason] = useState('');
  const [isCancelModalOpen, setIsCancelModalOpen] = useState(false);
  const [isCancelling, setIsCancelling] = useState(false);

  // State for provisioning status
  const [provisioningStatus, setProvisioningStatus] = useState<any>(null);
  const [isLoadingStatus, setIsLoadingStatus] = useState(false);

  // Load provisioning status
  useEffect(() => {
    loadProvisioningStatus();
  }, [onboarding.onboardingId]);

  const loadProvisioningStatus = async () => {
    setIsLoadingStatus(true);
    try {
      const response = await onboardingApi.provisioning.getStatus(onboarding.onboardingId);
      setProvisioningStatus(response.data);
    } catch (err: any) {
      // Status might not exist yet, that's okay
      console.log('Provisioning status not found, system access may not be configured yet');
    } finally {
      setIsLoadingStatus(false);
    }
  };

  // Handle system selection toggle
  const toggleSystem = (systemId: string) => {
    setSelectedSystems((prev) =>
      prev.includes(systemId)
        ? prev.filter((id) => id !== systemId)
        : [...prev, systemId]
    );
  };

  // Schedule provisioning
  const handleScheduleProvisioning = async () => {
    if (selectedSystems.length === 0) {
      onError('Please select at least one system to provision');
      return;
    }

    if (!startDate) {
      onError('Please select a start date');
      return;
    }

    setIsScheduling(true);
    try {
      const response = await onboardingApi.automation.scheduleProvisioning(onboarding.onboardingId, {
        startDate: startDate,
        systems: selectedSystems,
      });


      if (response.data.scheduled) {
        onSuccess(`Provisioning scheduled for ${new Date(response.data.scheduledFor).toLocaleDateString()}. Systems: ${response.data.systems.join(', ')}`);
        loadProvisioningStatus();
        onRefresh();
      }
    } catch (err: any) {
      onError(err.response?.data?.message || 'Failed to schedule provisioning');
    } finally {
      setIsScheduling(false);
    }
  };

  // Schedule revocation
  const handleScheduleRevocation = async () => {
    if (!revocationEmployeeId) {
      onError('Employee ID is required');
      return;
    }

    if (!revokeImmediately && !exitDate) {
      onError('Please select an exit date or enable immediate revocation');
      return;
    }

    setIsSchedulingRevocation(true);
    try {
      const response = await onboardingApi.automation.scheduleRevocation({
        employeeId: revocationEmployeeId,
        exitDate: revokeImmediately ? new Date().toISOString() : exitDate,
        reason: revocationReason,
        revokeImmediately: revokeImmediately,
      });

      if (response.data.scheduled) {
        onSuccess(`Access revocation scheduled for ${new Date(response.data.scheduledFor).toLocaleDateString()}`);
        loadProvisioningStatus();
        onRefresh();
      }
    } catch (err: any) {
      onError(err.response?.data?.message || 'Failed to schedule revocation');
    } finally {
      setIsSchedulingRevocation(false);
    }
  };

  // Cancel onboarding
  const handleCancelOnboarding = async () => {
    if (!cancelReason.trim()) {
      onError('Please provide a reason for cancellation');
      return;
    }

    setIsCancelling(true);
    try {
      await onboardingApi.cancel(onboarding.onboardingId, {
        reason: cancelReason,
        cancelledBy: 'HR Manager',
      });

      onSuccess('Onboarding cancelled successfully. All pending provisioning and reservations have been revoked.');
      setIsCancelModalOpen(false);
      setCancelReason('');
      onRefresh();
    } catch (err: any) {
      onError(err.response?.data?.message || 'Failed to cancel onboarding');
    } finally {
      setIsCancelling(false);
    }
  };

  // Get status badge color
  const getStatusColor = (status: string) => {
    switch (status?.toLowerCase()) {
      case 'completed':
      case 'active':
      case 'provisioned':
        return 'bg-green-100 text-green-800';
      case 'scheduled':
        return 'bg-blue-100 text-blue-800';
      case 'in_progress':
      case 'pending':
        return 'bg-yellow-100 text-yellow-800';
      case 'failed':
      case 'cancelled':
      case 'revoked':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  // Get status icon
  const getStatusIcon = (status: string) => {
    switch (status?.toLowerCase()) {
      case 'completed':
      case 'active':
      case 'provisioned':
        return <CheckCircle2 className="w-4 h-4 text-green-600" />;
      case 'scheduled':
        return <Calendar className="w-4 h-4 text-blue-600" />;
      case 'in_progress':
        return <RefreshCw className="w-4 h-4 text-yellow-600 animate-spin" />;
      case 'pending':
        return <Clock className="w-4 h-4 text-yellow-600" />;
      case 'failed':
      case 'cancelled':
      case 'revoked':
        return <XCircle className="w-4 h-4 text-red-600" />;
      default:
        return <AlertTriangle className="w-4 h-4 text-gray-600" />;
    }
  };


  return (
    <div className="space-y-6">
      {/* Provisioning Status Section */}
      <div className="border border-slate-200 rounded-lg p-4">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-md font-semibold text-slate-900 flex items-center gap-2">
            <Server className="w-5 h-5 text-blue-600" />
            Provisioning Status
          </h3>
          <button
            onClick={loadProvisioningStatus}
            disabled={isLoadingStatus}
            className="flex items-center gap-1 px-3 py-1 text-sm text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded transition-colors"
          >
            <RefreshCw className={`w-4 h-4 ${isLoadingStatus ? 'animate-spin' : ''}`} />
            Refresh
          </button>
        </div>

        {isLoadingStatus ? (
          <div className="flex items-center justify-center py-4">
            <RefreshCw className="w-6 h-6 text-slate-400 animate-spin" />
          </div>
        ) : provisioningStatus ? (
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <span className="text-sm text-slate-600">Overall Status:</span>
              <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(provisioningStatus.overallStatus)}`}>
                {provisioningStatus.overallStatus?.replace('_', ' ').toUpperCase() || 'NOT STARTED'}
              </span>
            </div>
            
            {provisioningStatus.systems && provisioningStatus.systems.length > 0 && (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 mt-4">
                {provisioningStatus.systems.map((system: any) => (
                  <div
                    key={system.system}
                    className="flex items-center gap-3 p-3 bg-slate-50 rounded-lg"
                  >
                    {getStatusIcon(system.status)}
                    <div className="flex-1">
                      <p className="text-sm font-medium text-slate-900 capitalize">
                        {system.system?.replace('_', ' ')}
                      </p>
                      <p className="text-xs text-slate-500 capitalize">
                        {system.status?.replace('_', ' ')}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        ) : (
          <p className="text-sm text-slate-500 text-center py-4">
            No provisioning scheduled yet. Use the form below to schedule access provisioning.
          </p>
        )}
      </div>

      {/* Schedule Provisioning Section */}
      <div className="border border-slate-200 rounded-lg p-4">
        <h3 className="text-md font-semibold text-slate-900 flex items-center gap-2 mb-4">
          <Play className="w-5 h-5 text-green-600" />
          Schedule Account Provisioning
        </h3>
        <p className="text-sm text-slate-600 mb-4">
          Schedule automated provisioning of SSO, email, and tools for the new hire's start date.
        </p>

        {/* System Selection */}
        <div className="mb-4">
          <label className="block text-sm font-medium text-slate-700 mb-2">
            Select Systems to Provision
          </label>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
            {AVAILABLE_SYSTEMS.map((system) => {
              const Icon = system.icon;
              const isSelected = selectedSystems.includes(system.id);
              return (
                <button
                  key={system.id}
                  onClick={() => toggleSystem(system.id)}
                  className={`flex items-center gap-2 p-3 rounded-lg border text-left transition-all ${
                    isSelected
                      ? 'border-blue-500 bg-blue-50'
                      : 'border-slate-200 hover:border-slate-300 hover:bg-slate-50'
                  }`}
                >
                  <Icon className={`w-4 h-4 ${isSelected ? 'text-blue-600' : 'text-slate-500'}`} />
                  <span className={`text-sm ${isSelected ? 'text-blue-900 font-medium' : 'text-slate-700'}`}>
                    {system.name}
                  </span>
                  {isSelected && (
                    <CheckCircle2 className="w-4 h-4 text-blue-600 ml-auto" />
                  )}
                </button>
              );
            })}
          </div>
        </div>

        {/* Start Date Selection */}
        <div className="mb-4">
          <label className="block text-sm font-medium text-slate-700 mb-2">
            <Calendar className="w-4 h-4 inline mr-2" />
            Provisioning Date (Start Date)
          </label>
          <input
            type="date"
            value={startDate}
            onChange={(e) => setStartDate(e.target.value)}
            min={new Date().toISOString().split('T')[0]}
            className="w-full md:w-64 px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          />
        </div>

        <button
          onClick={handleScheduleProvisioning}
          disabled={isScheduling || selectedSystems.length === 0}
          className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isScheduling ? (
            <RefreshCw className="w-4 h-4 animate-spin" />
          ) : (
            <Play className="w-4 h-4" />
          )}
          Schedule Provisioning
        </button>
      </div>

      {/* Schedule Revocation Section */}
      <div className="border border-slate-200 rounded-lg p-4">
        <h3 className="text-md font-semibold text-slate-900 flex items-center gap-2 mb-4">
          <UserX className="w-5 h-5 text-orange-600" />
          Schedule Access Revocation
        </h3>
        <p className="text-sm text-slate-600 mb-4">
          Schedule automatic access revocation for an employee's exit date.
        </p>

        <div className="space-y-3">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Employee ID</label>
            <input
              type="text"
              value={revocationEmployeeId}
              onChange={(e) => setRevocationEmployeeId(e.target.value)}
              className="w-full md:w-64 px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
              placeholder="Enter employee ID"
            />
          </div>

          <div>
            <label className="flex items-center gap-2 text-sm font-medium text-slate-700">
              <input
                type="checkbox"
                checked={revokeImmediately}
                onChange={(e) => setRevokeImmediately(e.target.checked)}
                className="rounded border-slate-300 text-orange-600 focus:ring-orange-500"
              />
              Revoke Immediately
            </label>
          </div>

          {!revokeImmediately && (
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">
                <Calendar className="w-4 h-4 inline mr-2" />
                Exit Date
              </label>
              <input
                type="date"
                value={exitDate}
                onChange={(e) => setExitDate(e.target.value)}
                min={new Date().toISOString().split('T')[0]}
                className="w-full md:w-64 px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
              />
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Reason</label>
            <select
              value={revocationReason}
              onChange={(e) => setRevocationReason(e.target.value as 'termination' | 'resignation' | 'no_show' | 'contract_cancelled')}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
            >
              <option value="resignation">Resignation</option>
              <option value="termination">Termination</option>
              <option value="no_show">No Show</option>
              <option value="contract_cancelled">Contract Cancelled</option>
            </select>
          </div>

        </div>

        <button
          onClick={handleScheduleRevocation}
          disabled={isSchedulingRevocation}
          className="mt-4 flex items-center gap-2 px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isSchedulingRevocation ? (
            <RefreshCw className="w-4 h-4 animate-spin" />
          ) : (
            <UserX className="w-4 h-4" />
          )}
          Schedule Revocation
        </button>
      </div>

      {/* Cancel Onboarding Section */}
      <div className="border border-red-200 rounded-lg p-4 bg-red-50">
        <h3 className="text-md font-semibold text-slate-900 flex items-center gap-2 mb-4">
          <Trash2 className="w-5 h-5 text-red-600" />
          Cancel Onboarding (No-Show)
        </h3>
        <p className="text-sm text-slate-600 mb-4">
          Cancel this onboarding for "no show" or other reasons. This will revoke all pending provisioning and reservations.
        </p>

        <button
          onClick={() => setIsCancelModalOpen(true)}
          disabled={onboarding.completed}
          className="flex items-center gap-2 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <Trash2 className="w-4 h-4" />
          Cancel Onboarding
        </button>

        {onboarding.completed && (
          <p className="text-sm text-slate-500 mt-2 italic">
            This onboarding is already completed.
          </p>
        )}
      </div>

      {/* Cancel Confirmation Modal */}
      <Modal
        isOpen={isCancelModalOpen}
        onClose={() => setIsCancelModalOpen(false)}
        title="Cancel Onboarding"
      >
        <div className="space-y-4">
          <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
            <div className="flex items-start gap-3">
              <AlertTriangle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
              <div>
                <p className="font-medium text-red-800">Warning: This action cannot be undone</p>
                <ul className="text-sm text-red-700 mt-2 list-disc list-inside">
                  <li>Revoke all pending system provisioning</li>
                  <li>Cancel all equipment and desk reservations</li>
                  <li>Mark all incomplete tasks as cancelled</li>
                </ul>
              </div>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">
              Cancellation Reason <span className="text-red-500">*</span>
            </label>
            <textarea
              value={cancelReason}
              onChange={(e) => setCancelReason(e.target.value)}
              rows={3}
              className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500"
              placeholder="e.g., Candidate did not show up on start date"
            />
          </div>

          <div className="flex justify-end gap-3">
            <button
              onClick={() => setIsCancelModalOpen(false)}
              className="px-4 py-2 border border-slate-300 text-slate-700 rounded-lg hover:bg-slate-50 transition-colors"
            >
              Keep Onboarding
            </button>
            <button
              onClick={handleCancelOnboarding}
              disabled={isCancelling || !cancelReason.trim()}
              className="flex items-center gap-2 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isCancelling ? (
                <RefreshCw className="w-4 h-4 animate-spin" />
              ) : (
                <Trash2 className="w-4 h-4" />
              )}
              Confirm Cancellation
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
