'use client'

import { useState, useEffect } from 'react';
import { Card } from '../../../components/Card';
import { Modal } from '../../../components/Modal';
import { 
  Calendar, 
  Clock, 
  User, 
  MessageSquare, 
  CheckCircle2,
  AlertCircle,
  RefreshCw,
  Plus,
  FileText,
  Send,
} from 'lucide-react';

// Exit interview statuses (stored in hrComments field as JSON metadata)
type ExitInterviewStatus = 'not_scheduled' | 'scheduled' | 'completed' | 'cancelled';

interface ExitInterview {
  id: string;
  terminationId: string;
  employeeId: string;
  scheduledDate: string;
  scheduledTime: string;
  interviewer: string;
  status: ExitInterviewStatus;
  location: string;
  notes?: string;
  feedback?: ExitInterviewFeedback;
  createdAt: string;
}

interface ExitInterviewFeedback {
  overallExperience: number; // 1-5
  reasonForLeaving: string;
  wouldRecommend: boolean;
  suggestions: string;
  bestAspects: string;
  improvementAreas: string;
}

interface ExitInterviewSchedulerProps {
  terminationId: string;
  employeeId: string;
  employeeName?: string;
  isHR: boolean;
  onSuccess: (message: string) => void;
  onError: (message: string) => void;
}

// Mock data storage (in production, this would be stored in backend)
const mockInterviews: Map<string, ExitInterview> = new Map();

export function ExitInterviewScheduler({
  terminationId,
  employeeId,
  employeeName,
  isHR,
  onSuccess,
  onError,
}: ExitInterviewSchedulerProps) {
  const [interview, setInterview] = useState<ExitInterview | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isScheduleModalOpen, setIsScheduleModalOpen] = useState(false);
  const [isFeedbackModalOpen, setIsFeedbackModalOpen] = useState(false);

  // Form states for scheduling
  const [scheduleForm, setScheduleForm] = useState({
    scheduledDate: '',
    scheduledTime: '10:00',
    interviewer: '',
    location: 'HR Office',
    notes: '',
  });

  // Form states for feedback
  const [feedbackForm, setFeedbackForm] = useState<ExitInterviewFeedback>({
    overallExperience: 3,
    reasonForLeaving: '',
    wouldRecommend: true,
    suggestions: '',
    bestAspects: '',
    improvementAreas: '',
  });

  // Validation states
  const [scheduleErrors, setScheduleErrors] = useState<Record<string, string>>({});
  const [feedbackErrors, setFeedbackErrors] = useState<Record<string, string>>({});

  // Load existing interview
  useEffect(() => {
    const existing = mockInterviews.get(terminationId);
    if (existing) {
      setInterview(existing);
    }
  }, [terminationId]);

  // Calculate min date (tomorrow)
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  const minDate = tomorrow.toISOString().split('T')[0];

  // Validate schedule form
  const validateScheduleForm = (): boolean => {
    const errors: Record<string, string> = {};
    
    if (!scheduleForm.scheduledDate) {
      errors.scheduledDate = 'Please select a date for the interview';
    }
    if (!scheduleForm.scheduledTime) {
      errors.scheduledTime = 'Please select a time';
    }
    if (!scheduleForm.interviewer.trim()) {
      errors.interviewer = 'Please enter the interviewer name';
    }
    if (!scheduleForm.location.trim()) {
      errors.location = 'Please specify the location';
    }

    setScheduleErrors(errors);
    return Object.keys(errors).length === 0;
  };

  // Validate feedback form
  const validateFeedbackForm = (): boolean => {
    const errors: Record<string, string> = {};
    
    if (!feedbackForm.reasonForLeaving.trim()) {
      errors.reasonForLeaving = 'Please provide the main reason for leaving';
    }
    if (!feedbackForm.bestAspects.trim()) {
      errors.bestAspects = 'Please share what you liked most';
    }
    if (!feedbackForm.improvementAreas.trim()) {
      errors.improvementAreas = 'Please suggest areas for improvement';
    }

    setFeedbackErrors(errors);
    return Object.keys(errors).length === 0;
  };

  // Handle schedule submission
  const handleScheduleInterview = async () => {
    if (!validateScheduleForm()) return;

    setIsLoading(true);
    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 500));

      const newInterview: ExitInterview = {
        id: `EI-${Date.now()}`,
        terminationId,
        employeeId,
        scheduledDate: scheduleForm.scheduledDate,
        scheduledTime: scheduleForm.scheduledTime,
        interviewer: scheduleForm.interviewer,
        location: scheduleForm.location,
        notes: scheduleForm.notes,
        status: 'scheduled',
        createdAt: new Date().toISOString(),
      };

      mockInterviews.set(terminationId, newInterview);
      setInterview(newInterview);
      setIsScheduleModalOpen(false);
      onSuccess('Exit interview scheduled successfully! The employee will be notified.');
      
      // Reset form
      setScheduleForm({
        scheduledDate: '',
        scheduledTime: '10:00',
        interviewer: '',
        location: 'HR Office',
        notes: '',
      });
      setScheduleErrors({});
    } catch (err) {
      onError('Failed to schedule exit interview');
    } finally {
      setIsLoading(false);
    }
  };

  // Handle feedback submission
  const handleSubmitFeedback = async () => {
    if (!validateFeedbackForm()) return;

    setIsLoading(true);
    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 500));

      if (interview) {
        const updatedInterview: ExitInterview = {
          ...interview,
          status: 'completed',
          feedback: feedbackForm,
        };
        mockInterviews.set(terminationId, updatedInterview);
        setInterview(updatedInterview);
      }

      setIsFeedbackModalOpen(false);
      onSuccess('Exit interview feedback submitted successfully!');
      
      // Reset form
      setFeedbackForm({
        overallExperience: 3,
        reasonForLeaving: '',
        wouldRecommend: true,
        suggestions: '',
        bestAspects: '',
        improvementAreas: '',
      });
      setFeedbackErrors({});
    } catch (err) {
      onError('Failed to submit feedback');
    } finally {
      setIsLoading(false);
    }
  };

  // Helper to render star rating
  const renderStarRating = (value: number, onChange: (v: number) => void, readonly = false) => (
    <div className="flex gap-1">
      {[1, 2, 3, 4, 5].map((star) => (
        <button
          key={star}
          type="button"
          disabled={readonly}
          onClick={() => !readonly && onChange(star)}
          className={`text-2xl transition-colors ${
            star <= value 
              ? 'text-yellow-400' 
              : 'text-slate-300'
          } ${!readonly && 'hover:text-yellow-500 cursor-pointer'}`}
        >
          ★
        </button>
      ))}
    </div>
  );

  // Get status badge
  const getStatusBadge = (status: ExitInterviewStatus) => {
    const config = {
      not_scheduled: { bg: 'bg-slate-100', text: 'text-slate-700', label: 'Not Scheduled' },
      scheduled: { bg: 'bg-blue-100', text: 'text-blue-700', label: 'Scheduled' },
      completed: { bg: 'bg-green-100', text: 'text-green-700', label: 'Completed' },
      cancelled: { bg: 'bg-red-100', text: 'text-red-700', label: 'Cancelled' },
    };
    const { bg, text, label } = config[status];
    return (
      <span className={`px-3 py-1 rounded-full text-sm font-medium ${bg} ${text}`}>
        {label}
      </span>
    );
  };

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-medium text-slate-900 flex items-center gap-2">
          <MessageSquare className="w-5 h-5 text-slate-600" />
          Exit Interview
        </h3>
        {interview && getStatusBadge(interview.status)}
      </div>

      {/* No Interview Scheduled */}
      {!interview && (
        <Card>
          <div className="text-center py-8">
            <Calendar className="w-12 h-12 text-slate-300 mx-auto mb-4" />
            <p className="text-slate-600 mb-2">No exit interview scheduled</p>
            <p className="text-sm text-slate-500 mb-4">
              {isHR 
                ? 'Schedule an exit interview to gather valuable feedback from the departing employee.'
                : 'HR will schedule an exit interview with you as part of the offboarding process.'}
            </p>
            {isHR && (
              <button
                onClick={() => setIsScheduleModalOpen(true)}
                className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                <Plus className="w-4 h-4" />
                Schedule Interview
              </button>
            )}
          </div>
        </Card>
      )}

      {/* Interview Scheduled */}
      {interview && interview.status === 'scheduled' && (
        <Card>
          <div className="space-y-4">
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-3">
                <div className="p-3 bg-blue-100 rounded-lg">
                  <Calendar className="w-6 h-6 text-blue-600" />
                </div>
                <div>
                  <p className="font-medium text-slate-900">Exit Interview Scheduled</p>
                  <p className="text-sm text-slate-600">
                    {new Date(interview.scheduledDate).toLocaleDateString('en-US', {
                      weekday: 'long',
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric',
                    })}
                  </p>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 p-4 bg-slate-50 rounded-lg">
              <div className="flex items-center gap-2">
                <Clock className="w-4 h-4 text-slate-500" />
                <span className="text-slate-700">{interview.scheduledTime}</span>
              </div>
              <div className="flex items-center gap-2">
                <User className="w-4 h-4 text-slate-500" />
                <span className="text-slate-700">{interview.interviewer}</span>
              </div>
              <div className="flex items-center gap-2">
                <MessageSquare className="w-4 h-4 text-slate-500" />
                <span className="text-slate-700">{interview.location}</span>
              </div>
            </div>

            {interview.notes && (
              <div className="p-3 bg-amber-50 border border-amber-200 rounded-lg">
                <p className="text-sm text-amber-800">
                  <strong>Notes:</strong> {interview.notes}
                </p>
              </div>
            )}

            {/* Actions */}
            <div className="flex gap-2 pt-2">
              {isHR && (
                <>
                  <button
                    onClick={() => setIsFeedbackModalOpen(true)}
                    className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
                  >
                    <CheckCircle2 className="w-4 h-4" />
                    Record Feedback
                  </button>
                  <button
                    onClick={() => setIsScheduleModalOpen(true)}
                    className="flex items-center gap-2 px-4 py-2 border border-slate-300 text-slate-700 rounded-lg hover:bg-slate-50 transition-colors"
                  >
                    <Calendar className="w-4 h-4" />
                    Reschedule
                  </button>
                </>
              )}
            </div>
          </div>
        </Card>
      )}

      {/* Interview Completed - Show Feedback Summary */}
      {interview && interview.status === 'completed' && interview.feedback && (
        <Card>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-3 bg-green-100 rounded-lg">
                  <CheckCircle2 className="w-6 h-6 text-green-600" />
                </div>
                <div>
                  <p className="font-medium text-slate-900">Exit Interview Completed</p>
                  <p className="text-sm text-slate-600">
                    Conducted on {new Date(interview.scheduledDate).toLocaleDateString()}
                  </p>
                </div>
              </div>
            </div>

            <div className="space-y-4 p-4 bg-slate-50 rounded-lg">
              {/* Overall Rating */}
              <div>
                <p className="text-sm text-slate-600 mb-1">Overall Experience</p>
                {renderStarRating(interview.feedback.overallExperience, () => {}, true)}
              </div>

              {/* Key Feedback */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-slate-600 mb-1">Reason for Leaving</p>
                  <p className="text-slate-800 bg-white p-2 rounded border border-slate-200">
                    {interview.feedback.reasonForLeaving}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-slate-600 mb-1">Would Recommend Company</p>
                  <p className={`font-medium ${interview.feedback.wouldRecommend ? 'text-green-600' : 'text-red-600'}`}>
                    {interview.feedback.wouldRecommend ? 'Yes' : 'No'}
                  </p>
                </div>
              </div>

              <div>
                <p className="text-sm text-slate-600 mb-1">Best Aspects of Working Here</p>
                <p className="text-slate-800 bg-white p-2 rounded border border-slate-200">
                  {interview.feedback.bestAspects}
                </p>
              </div>

              <div>
                <p className="text-sm text-slate-600 mb-1">Suggested Improvements</p>
                <p className="text-slate-800 bg-white p-2 rounded border border-slate-200">
                  {interview.feedback.improvementAreas}
                </p>
              </div>

              {interview.feedback.suggestions && (
                <div>
                  <p className="text-sm text-slate-600 mb-1">Additional Suggestions</p>
                  <p className="text-slate-800 bg-white p-2 rounded border border-slate-200">
                    {interview.feedback.suggestions}
                  </p>
                </div>
              )}
            </div>
          </div>
        </Card>
      )}

      {/* Schedule Interview Modal */}
      <Modal
        isOpen={isScheduleModalOpen}
        onClose={() => {
          setIsScheduleModalOpen(false);
          setScheduleErrors({});
        }}
        title="Schedule Exit Interview"
        size="md"
      >
        <div className="space-y-4">
          {/* Info Banner */}
          <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
            <div className="flex items-start gap-2">
              <AlertCircle className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
              <p className="text-sm text-blue-800">
                Exit interviews help gather valuable feedback about the employee's experience 
                and identify areas for organizational improvement.
              </p>
            </div>
          </div>

          {/* Date */}
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">
              Interview Date <span className="text-red-500">*</span>
            </label>
            <input
              type="date"
              value={scheduleForm.scheduledDate}
              onChange={(e) => setScheduleForm({ ...scheduleForm, scheduledDate: e.target.value })}
              min={minDate}
              className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 ${
                scheduleErrors.scheduledDate ? 'border-red-500' : 'border-slate-300'
              }`}
            />
            {scheduleErrors.scheduledDate && (
              <p className="text-red-500 text-sm mt-1">{scheduleErrors.scheduledDate}</p>
            )}
          </div>

          {/* Time */}
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">
              Interview Time <span className="text-red-500">*</span>
            </label>
            <select
              value={scheduleForm.scheduledTime}
              onChange={(e) => setScheduleForm({ ...scheduleForm, scheduledTime: e.target.value })}
              className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 ${
                scheduleErrors.scheduledTime ? 'border-red-500' : 'border-slate-300'
              }`}
            >
              {['09:00', '10:00', '11:00', '12:00', '14:00', '15:00', '16:00', '17:00'].map((time) => (
                <option key={time} value={time}>{time}</option>
              ))}
            </select>
            {scheduleErrors.scheduledTime && (
              <p className="text-red-500 text-sm mt-1">{scheduleErrors.scheduledTime}</p>
            )}
          </div>

          {/* Interviewer */}
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">
              Interviewer Name <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={scheduleForm.interviewer}
              onChange={(e) => setScheduleForm({ ...scheduleForm, interviewer: e.target.value })}
              placeholder="e.g., Sarah Johnson (HR Manager)"
              className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 ${
                scheduleErrors.interviewer ? 'border-red-500' : 'border-slate-300'
              }`}
            />
            {scheduleErrors.interviewer && (
              <p className="text-red-500 text-sm mt-1">{scheduleErrors.interviewer}</p>
            )}
          </div>

          {/* Location */}
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">
              Location <span className="text-red-500">*</span>
            </label>
            <select
              value={scheduleForm.location}
              onChange={(e) => setScheduleForm({ ...scheduleForm, location: e.target.value })}
              className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 ${
                scheduleErrors.location ? 'border-red-500' : 'border-slate-300'
              }`}
            >
              <option value="HR Office">HR Office</option>
              <option value="Conference Room A">Conference Room A</option>
              <option value="Conference Room B">Conference Room B</option>
              <option value="Virtual (Teams/Zoom)">Virtual (Teams/Zoom)</option>
            </select>
            {scheduleErrors.location && (
              <p className="text-red-500 text-sm mt-1">{scheduleErrors.location}</p>
            )}
          </div>

          {/* Notes */}
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">
              Notes for Employee
            </label>
            <textarea
              value={scheduleForm.notes}
              onChange={(e) => setScheduleForm({ ...scheduleForm, notes: e.target.value })}
              rows={2}
              placeholder="Any additional information or preparation required..."
              className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500"
            />
          </div>

          {/* Actions */}
          <div className="flex justify-end gap-3 pt-4 border-t">
            <button
              onClick={() => {
                setIsScheduleModalOpen(false);
                setScheduleErrors({});
              }}
              className="px-4 py-2 border border-slate-300 text-slate-700 rounded-lg hover:bg-slate-50 transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handleScheduleInterview}
              disabled={isLoading}
              className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50"
            >
              {isLoading ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  Scheduling...
                </>
              ) : (
                <>
                  <Send className="w-4 h-4" />
                  Schedule Interview
                </>
              )}
            </button>
          </div>
        </div>
      </Modal>

      {/* Feedback Recording Modal */}
      <Modal
        isOpen={isFeedbackModalOpen}
        onClose={() => {
          setIsFeedbackModalOpen(false);
          setFeedbackErrors({});
        }}
        title="Record Exit Interview Feedback"
        size="lg"
      >
        <div className="space-y-5">
          {/* Info Banner */}
          <div className="p-3 bg-green-50 border border-green-200 rounded-lg">
            <div className="flex items-start gap-2">
              <FileText className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
              <p className="text-sm text-green-800">
                Record the employee's feedback from the exit interview. This information 
                helps improve employee experience and retention.
              </p>
            </div>
          </div>

          {/* Overall Experience */}
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">
              Overall Experience Rating
            </label>
            {renderStarRating(feedbackForm.overallExperience, (v) => 
              setFeedbackForm({ ...feedbackForm, overallExperience: v })
            )}
          </div>

          {/* Reason for Leaving */}
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">
              Primary Reason for Leaving <span className="text-red-500">*</span>
            </label>
            <select
              value={feedbackForm.reasonForLeaving}
              onChange={(e) => setFeedbackForm({ ...feedbackForm, reasonForLeaving: e.target.value })}
              className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-green-500 ${
                feedbackErrors.reasonForLeaving ? 'border-red-500' : 'border-slate-300'
              }`}
            >
              <option value="">Select a reason...</option>
              <option value="Better opportunity">Better Career Opportunity</option>
              <option value="Higher compensation">Higher Compensation</option>
              <option value="Work-life balance">Work-Life Balance</option>
              <option value="Career change">Career Change</option>
              <option value="Relocation">Relocation</option>
              <option value="Management issues">Management/Leadership Issues</option>
              <option value="Limited growth">Limited Growth Opportunities</option>
              <option value="Personal reasons">Personal/Family Reasons</option>
              <option value="Company culture">Company Culture</option>
              <option value="Retirement">Retirement</option>
              <option value="Other">Other</option>
            </select>
            {feedbackErrors.reasonForLeaving && (
              <p className="text-red-500 text-sm mt-1">{feedbackErrors.reasonForLeaving}</p>
            )}
          </div>

          {/* Would Recommend */}
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">
              Would recommend this company to others?
            </label>
            <div className="flex gap-4">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="radio"
                  checked={feedbackForm.wouldRecommend === true}
                  onChange={() => setFeedbackForm({ ...feedbackForm, wouldRecommend: true })}
                  className="w-4 h-4 text-green-600"
                />
                <span className="text-slate-700">Yes</span>
              </label>
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="radio"
                  checked={feedbackForm.wouldRecommend === false}
                  onChange={() => setFeedbackForm({ ...feedbackForm, wouldRecommend: false })}
                  className="w-4 h-4 text-red-600"
                />
                <span className="text-slate-700">No</span>
              </label>
            </div>
          </div>

          {/* Best Aspects */}
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">
              What did you like most about working here? <span className="text-red-500">*</span>
            </label>
            <textarea
              value={feedbackForm.bestAspects}
              onChange={(e) => setFeedbackForm({ ...feedbackForm, bestAspects: e.target.value })}
              rows={3}
              placeholder="Team culture, projects, management support, learning opportunities..."
              className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-green-500 ${
                feedbackErrors.bestAspects ? 'border-red-500' : 'border-slate-300'
              }`}
            />
            {feedbackErrors.bestAspects && (
              <p className="text-red-500 text-sm mt-1">{feedbackErrors.bestAspects}</p>
            )}
          </div>

          {/* Improvement Areas */}
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">
              What could we improve? <span className="text-red-500">*</span>
            </label>
            <textarea
              value={feedbackForm.improvementAreas}
              onChange={(e) => setFeedbackForm({ ...feedbackForm, improvementAreas: e.target.value })}
              rows={3}
              placeholder="Communication, growth paths, compensation, work environment..."
              className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-green-500 ${
                feedbackErrors.improvementAreas ? 'border-red-500' : 'border-slate-300'
              }`}
            />
            {feedbackErrors.improvementAreas && (
              <p className="text-red-500 text-sm mt-1">{feedbackErrors.improvementAreas}</p>
            )}
          </div>

          {/* Additional Suggestions */}
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">
              Additional Comments or Suggestions
            </label>
            <textarea
              value={feedbackForm.suggestions}
              onChange={(e) => setFeedbackForm({ ...feedbackForm, suggestions: e.target.value })}
              rows={2}
              placeholder="Any other feedback or suggestions..."
              className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-green-500"
            />
          </div>

          {/* Actions */}
          <div className="flex justify-end gap-3 pt-4 border-t">
            <button
              onClick={() => {
                setIsFeedbackModalOpen(false);
                setFeedbackErrors({});
              }}
              className="px-4 py-2 border border-slate-300 text-slate-700 rounded-lg hover:bg-slate-50 transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handleSubmitFeedback}
              disabled={isLoading}
              className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50"
            >
              {isLoading ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  Submitting...
                </>
              ) : (
                <>
                  <CheckCircle2 className="w-4 h-4" />
                  Save Feedback
                </>
              )}
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
