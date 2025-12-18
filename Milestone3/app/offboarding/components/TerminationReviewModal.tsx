'use client'

import { useState, useEffect } from 'react';
import { Modal } from '../../../components/Modal';
import { offboardingApi } from '../../../services/api';
import { 
  TerminationInitiation, 
  EmployeePerformanceData 
} from '../../../lib/types';
import { 
  AlertTriangle, 
  TrendingDown, 
  TrendingUp, 
  User,
  Briefcase,
  Star,
} from 'lucide-react';

interface TerminationReviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  employees: any[];
  userId: string;
  onSuccess: () => void;
  onError: (message: string) => void;
}

export function TerminationReviewModal({
  isOpen,
  onClose,
  employees,
  userId,
  onSuccess,
  onError,
}: TerminationReviewModalProps) {
  const [formData, setFormData] = useState({
    employeeId: '',
    contractId: '',
    reason: '',
    initiator: TerminationInitiation.HR as TerminationInitiation,
    comments: '',
  });
  
  const [performanceData, setPerformanceData] = useState<EmployeePerformanceData | null>(null);
  const [isLoadingPerformance, setIsLoadingPerformance] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Fetch performance data when employee is selected
  useEffect(() => {
    if (formData.employeeId) {
      fetchPerformanceData(formData.employeeId);
    } else {
      setPerformanceData(null);
    }
  }, [formData.employeeId]);

  const fetchPerformanceData = async (employeeId: string) => {
    setIsLoadingPerformance(true);
    try {
      const response = await offboardingApi.termination.getEmployeePerformance(employeeId);
      setPerformanceData(response.data);
    } catch (err) {
      console.error('Failed to fetch performance data:', err);
      setPerformanceData(null);
    } finally {
      setIsLoadingPerformance(false);
    }
  };

  const handleSubmit = async () => {
    if (!formData.employeeId || !formData.reason) {
      onError('Please fill in all required fields');
      return;
    }

    console.log('Submitting termination review with employeeId:', formData.employeeId);

    setIsSubmitting(true);
    try {
      const response = await offboardingApi.termination.initiateReview({
        employeeId: formData.employeeId,
        contractId: formData.contractId || formData.employeeId, // Use employee ID if no contract
        reason: formData.reason,
        initiator: formData.initiator,
        comments: formData.comments || undefined,
        notifyUserId: userId || undefined,
      });
      
      console.log('Termination review initiated successfully:', response.data);
      onSuccess();
      onClose();
      setFormData({
        employeeId: '',
        contractId: '',
        reason: '',
        initiator: TerminationInitiation.HR,
        comments: '',
      });
      setPerformanceData(null);
    } catch (err: any) {
      console.error('Termination initiation failed:', err.response?.data || err.message);
      onError(err.response?.data?.message || 'Failed to initiate termination review');
    } finally {
      setIsSubmitting(false);
    }
  };

  const getScoreColor = (score: number | null) => {
    if (score === null) return 'text-slate-500';
    if (score >= 80) return 'text-green-600';
    if (score >= 60) return 'text-yellow-600';
    return 'text-red-600';
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Initiate Termination Review"
      size="lg"
    >
      <div className="space-y-6">
        {/* Warning Banner */}
        <div className="p-4 bg-red-50 border border-red-200 rounded-lg flex items-start gap-3">
          <AlertTriangle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
          <div>
            <p className="font-medium text-red-800">Important</p>
            <p className="text-sm text-red-700">
              Termination reviews should be based on documented warnings, performance data, 
              or manager requests. Ensure all HR policies have been followed.
            </p>
          </div>
        </div>

        {/* Employee Selection */}
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">
            Select Employee *
          </label>
          <select
            value={formData.employeeId}
            onChange={(e) => setFormData({ ...formData, employeeId: e.target.value })}
            className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500"
          >
            <option value="">Choose an employee...</option>
            {Array.isArray(employees) && employees.map((emp) => (
              <option key={emp._id} value={emp._id}>
                {emp.firstName} {emp.lastName} - {emp.employeeNumber || emp._id.slice(-6).toUpperCase()}
              </option>
            ))}
          </select>
          <p className="text-xs text-slate-500 mt-1">
            Or enter Employee ID directly:
          </p>
          <input
            type="text"
            value={formData.employeeId}
            onChange={(e) => setFormData({ ...formData, employeeId: e.target.value })}
            className="w-full mt-1 px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-red-500 text-sm font-mono"
            placeholder="Enter MongoDB ObjectId (24 hex characters)"
          />
        </div>

        {/* Performance Data Display */}
        {formData.employeeId && (
          <div className="p-4 bg-slate-50 rounded-lg">
            <h4 className="font-medium text-slate-900 mb-3 flex items-center gap-2">
              <Star className="w-4 h-4" />
              Performance Data
            </h4>
            {isLoadingPerformance ? (
              <p className="text-slate-500 text-sm">Loading performance data...</p>
            ) : performanceData?.hasPerformanceData ? (
              <div className="space-y-3">
                {performanceData.latestAppraisal && (
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-xs text-slate-500">Latest Score</p>
                      <p className={`text-lg font-bold ${getScoreColor(performanceData.latestAppraisal.totalScore)}`}>
                        {performanceData.latestAppraisal.totalScore ?? 'N/A'}
                        {performanceData.latestAppraisal.totalScore !== null && (
                          performanceData.latestAppraisal.totalScore >= 60 
                            ? <TrendingUp className="inline w-4 h-4 ml-1" />
                            : <TrendingDown className="inline w-4 h-4 ml-1" />
                        )}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs text-slate-500">Overall Rating</p>
                      <p className="font-medium">{performanceData.latestAppraisal.overallRating || 'N/A'}</p>
                    </div>
                  </div>
                )}
                {performanceData.latestAppraisal?.managerComments && (
                  <div>
                    <p className="text-xs text-slate-500">Manager Comments</p>
                    <p className="text-sm text-slate-700 italic">
                      "{performanceData.latestAppraisal.managerComments}"
                    </p>
                  </div>
                )}
                <p className="text-xs text-slate-500">
                  Total performance records: {performanceData.allRecords.length}
                </p>
              </div>
            ) : (
              <p className="text-slate-500 text-sm">No performance data available for this employee</p>
            )}
          </div>
        )}

        {/* Initiator Type */}
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-2">
            Initiated By *
          </label>
          <div className="flex gap-4">
            {[
              { value: TerminationInitiation.HR, label: 'HR', icon: <Briefcase className="w-4 h-4" /> },
              { value: TerminationInitiation.MANAGER, label: 'Manager', icon: <User className="w-4 h-4" /> },
            ].map((option) => (
              <label
                key={option.value}
                className={`flex items-center gap-2 px-4 py-2 border rounded-lg cursor-pointer transition-colors ${
                  formData.initiator === option.value
                    ? 'border-red-500 bg-red-50 text-red-700'
                    : 'border-slate-300 hover:bg-slate-50'
                }`}
              >
                <input
                  type="radio"
                  name="initiator"
                  value={option.value}
                  checked={formData.initiator === option.value}
                  onChange={(e) => setFormData({ ...formData, initiator: e.target.value as TerminationInitiation })}
                  className="sr-only"
                />
                {option.icon}
                <span>{option.label}</span>
              </label>
            ))}
          </div>
        </div>

        {/* Contract ID (Optional) */}
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">
            Contract ID (Optional)
          </label>
          <input
            type="text"
            value={formData.contractId}
            onChange={(e) => setFormData({ ...formData, contractId: e.target.value })}
            className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-red-500 font-mono text-sm"
            placeholder="Enter contract MongoDB ObjectId if available"
          />
        </div>

        {/* Reason */}
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">
            Reason for Termination *
          </label>
          <textarea
            value={formData.reason}
            onChange={(e) => setFormData({ ...formData, reason: e.target.value })}
            rows={3}
            className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-red-500"
            placeholder="Provide detailed reason for the termination review..."
          />
        </div>

        {/* Additional Comments */}
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">
            Additional Comments
          </label>
          <textarea
            value={formData.comments}
            onChange={(e) => setFormData({ ...formData, comments: e.target.value })}
            rows={2}
            className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-red-500"
            placeholder="Any additional notes or context..."
          />
        </div>

        {/* Actions */}
        <div className="flex justify-end gap-3 pt-4 border-t">
          <button
            onClick={onClose}
            className="px-4 py-2 border border-slate-300 text-slate-700 rounded-lg hover:bg-slate-50 transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            disabled={isSubmitting || !formData.employeeId || !formData.reason}
            className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isSubmitting ? 'Submitting...' : 'Initiate Review'}
          </button>
        </div>
      </div>
    </Modal>
  );
}
