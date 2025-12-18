'use client'

import { useState, useEffect } from 'react';
import { Modal } from '../../../components/Modal';
import { offboardingApi } from '../../../services/api';
import { FileText, Calendar, MessageSquare, AlertCircle, CheckCircle2 } from 'lucide-react';

interface ResignationFormProps {
  isOpen: boolean;
  onClose: () => void;
  userId: string;
  onSuccess: () => void;
  onError: (message: string) => void;
}

export function ResignationForm({
  isOpen,
  onClose,
  userId,
  onSuccess,
  onError,
}: ResignationFormProps) {
  const [formData, setFormData] = useState({
    employeeId: userId,
    contractId: '',
    reason: '',
    requestedLastDay: '',
    comments: '',
  });
  
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [validationErrors, setValidationErrors] = useState<Record<string, string>>({});
  const [touched, setTouched] = useState<Record<string, boolean>>({});

  // Update employeeId when userId changes (e.g., after auth loads)
  useEffect(() => {
    if (userId && userId !== formData.employeeId) {
      setFormData(prev => ({ ...prev, employeeId: userId }));
    }
  }, [userId]);

  // Reset form when modal opens to ensure fresh user ID
  useEffect(() => {
    if (isOpen && userId) {
      setFormData(prev => ({ ...prev, employeeId: userId }));
      setValidationErrors({});
      setTouched({});
    }
  }, [isOpen, userId]);

  // Validate form
  const validateForm = (): boolean => {
    const errors: Record<string, string> = {};
    
    const employeeId = formData.employeeId || userId;
    if (!employeeId) {
      errors.employeeId = 'Employee ID is required. Please ensure you are logged in.';
    }
    
    if (!formData.reason.trim()) {
      errors.reason = 'Please provide a reason for your resignation';
    } else if (formData.reason.trim().length < 10) {
      errors.reason = 'Please provide a more detailed reason (at least 10 characters)';
    }
    
    if (formData.requestedLastDay) {
      const selectedDate = new Date(formData.requestedLastDay);
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      if (selectedDate < today) {
        errors.requestedLastDay = 'Last working day cannot be in the past';
      }
    }

    setValidationErrors(errors);
    return Object.keys(errors).length === 0;
  };

  // Handle field blur (mark as touched)
  const handleBlur = (field: string) => {
    setTouched(prev => ({ ...prev, [field]: true }));
    validateForm();
  };

  const handleSubmit = async () => {
    // Mark all fields as touched
    setTouched({
      employeeId: true,
      reason: true,
      requestedLastDay: true,
    });

    if (!validateForm()) {
      return;
    }

    // Use userId if employeeId is empty
    const employeeId = formData.employeeId || userId;

    console.log('Submitting resignation with employeeId:', employeeId);

    setIsSubmitting(true);
    try {
      const response = await offboardingApi.resignation.create({
        employeeId: employeeId,
        contractId: formData.contractId || employeeId, // Use employee ID if no contract
        reason: formData.reason,
        requestedLastDay: formData.requestedLastDay || undefined,
        comments: formData.comments || undefined,
      });
      
      console.log('Resignation created successfully:', response.data);
      onSuccess();
      onClose();
      setFormData({
        employeeId: userId,
        contractId: '',
        reason: '',
        requestedLastDay: '',
        comments: '',
      });
      setValidationErrors({});
      setTouched({});
    } catch (err: any) {
      console.error('Resignation creation failed:', err.response?.data || err.message);
      onError(err.response?.data?.message || 'Failed to submit resignation request');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Calculate minimum date (today)
  const today = new Date().toISOString().split('T')[0];
  
  // Calculate suggested date (2 weeks from today - standard notice period)
  const twoWeeksFromNow = new Date();
  twoWeeksFromNow.setDate(twoWeeksFromNow.getDate() + 14);
  const suggestedDate = twoWeeksFromNow.toISOString().split('T')[0];

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Submit Resignation Request"
      size="md"
    >
      <div className="space-y-6">
        {/* Info Banner */}
        <div className="p-4 bg-amber-50 border border-amber-200 rounded-lg">
          <div className="flex items-start gap-3">
            <FileText className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
            <div>
              <p className="font-medium text-amber-800">Resignation Notice</p>
              <p className="text-sm text-amber-700">
                Your resignation request will be reviewed by HR. Standard notice period is 2 weeks.
                Please ensure you provide a clear reason for your resignation.
              </p>
            </div>
          </div>
        </div>

        {/* Employee ID (pre-filled but editable for demo) */}
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">
            Employee ID
          </label>
          <input
            type="text"
            value={formData.employeeId}
            onChange={(e) => setFormData({ ...formData, employeeId: e.target.value })}
            onBlur={() => handleBlur('employeeId')}
            className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-amber-500 font-mono text-sm ${
              touched.employeeId && validationErrors.employeeId 
                ? 'border-red-500 bg-red-50' 
                : 'border-slate-300'
            }`}
            placeholder="Your Employee ID (MongoDB ObjectId)"
          />
          {touched.employeeId && validationErrors.employeeId ? (
            <p className="text-red-500 text-sm mt-1 flex items-center gap-1">
              <AlertCircle className="w-4 h-4" />
              {validationErrors.employeeId}
            </p>
          ) : (
            <p className="text-xs text-slate-500 mt-1">
              Pre-filled with your user ID. Update if needed.
            </p>
          )}
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
            className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-amber-500 font-mono text-sm"
            placeholder="Enter your contract ID if known"
          />
        </div>

        {/* Reason */}
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">
            Reason for Resignation <span className="text-red-500">*</span>
          </label>
          <textarea
            value={formData.reason}
            onChange={(e) => setFormData({ ...formData, reason: e.target.value })}
            onBlur={() => handleBlur('reason')}
            rows={4}
            className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-amber-500 ${
              touched.reason && validationErrors.reason 
                ? 'border-red-500 bg-red-50' 
                : 'border-slate-300'
            }`}
            placeholder="Please explain your reason for resigning..."
          />
          {touched.reason && validationErrors.reason ? (
            <p className="text-red-500 text-sm mt-1 flex items-center gap-1">
              <AlertCircle className="w-4 h-4" />
              {validationErrors.reason}
            </p>
          ) : (
            <div className="flex items-center justify-between mt-1">
              <p className="text-xs text-slate-500">
                Common reasons: Career change, relocation, personal reasons, new opportunity, etc.
              </p>
              <p className={`text-xs ${formData.reason.length >= 10 ? 'text-green-600' : 'text-slate-400'}`}>
                {formData.reason.length}/10 min
              </p>
            </div>
          )}
        </div>

        {/* Requested Last Working Day */}
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">
            <Calendar className="w-4 h-4 inline mr-1" />
            Requested Last Working Day
          </label>
          <input
            type="date"
            value={formData.requestedLastDay}
            onChange={(e) => setFormData({ ...formData, requestedLastDay: e.target.value })}
            onBlur={() => handleBlur('requestedLastDay')}
            min={today}
            className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-amber-500 ${
              touched.requestedLastDay && validationErrors.requestedLastDay 
                ? 'border-red-500 bg-red-50' 
                : 'border-slate-300'
            }`}
          />
          {touched.requestedLastDay && validationErrors.requestedLastDay ? (
            <p className="text-red-500 text-sm mt-1 flex items-center gap-1">
              <AlertCircle className="w-4 h-4" />
              {validationErrors.requestedLastDay}
            </p>
          ) : (
            <p className="text-xs text-slate-500 mt-1">
              Suggested: {suggestedDate} (2 weeks notice). HR may adjust this based on company policy.
            </p>
          )}
        </div>

        {/* Additional Comments */}
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">
            <MessageSquare className="w-4 h-4 inline mr-1" />
            Additional Comments
          </label>
          <textarea
            value={formData.comments}
            onChange={(e) => setFormData({ ...formData, comments: e.target.value })}
            rows={2}
            className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-amber-500"
            placeholder="Any additional information you'd like to share..."
          />
        </div>

        {/* Form Completion Indicator */}
        {formData.reason.length >= 10 && (
          <div className="flex items-center gap-2 p-3 bg-green-50 border border-green-200 rounded-lg">
            <CheckCircle2 className="w-5 h-5 text-green-600" />
            <p className="text-sm text-green-700">Form is ready to submit</p>
          </div>
        )}

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
            disabled={isSubmitting || !formData.reason.trim()}
            className="px-4 py-2 bg-amber-600 text-white rounded-lg hover:bg-amber-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isSubmitting ? 'Submitting...' : 'Submit Resignation'}
          </button>
        </div>
      </div>
    </Modal>
  );
}
