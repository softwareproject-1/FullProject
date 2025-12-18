'use client'

import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../../../context/AuthContext';
import RouteGuard from '../../../components/RouteGuard';
import { StatusBadge } from '../../../components/StatusBadge';
import { onboardingApi } from '../../../services/api';
import {
  CheckCircle2,
  Clock,
  AlertCircle,
  Upload,
  Bell,
  FileText,
  RefreshCw,
  ChevronDown,
  ChevronUp,
  Calendar,
  Building2,
  User,
  Info,
  CheckSquare,
  Square,
  XCircle,
  Award,
  ArrowRight,
} from 'lucide-react';

interface OnboardingTask {
  name: string;
  department: string;
  status: 'pending' | 'in_progress' | 'completed' | 'cancelled';
  deadline?: string;
  completedAt?: string;
  notes?: string;
  _id?: string;
}

interface OnboardingTracker {
  onboardingId?: string;  // Backend returns this, not _id
  _id?: string;           // Keep for backward compatibility
  employeeId?: string;
  contractId?: string;
  tasks?: OnboardingTask[];
  completed?: boolean;
  createdAt?: string;
  updatedAt?: string;
  completedAt?: string;
}

interface Notification {
  notificationId: string;
  type: string;
  subject: string;
  message: string;
  sentAt: string;
  status: string;
}

export default function CandidateOnboardingPage() {
  const { user, loading: authLoading } = useAuth();
  const [onboarding, setOnboarding] = useState<OnboardingTracker | null>(null);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [expandedSections, setExpandedSections] = useState({
    tasks: true,
    notifications: true,
    documents: true,
  });
  const [uploadingTask, setUploadingTask] = useState<number | null>(null);
  const [uploadFile, setUploadFile] = useState<File | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [finalizing, setFinalizing] = useState(false);
  const [finalizationResult, setFinalizationResult] = useState<{
    success: boolean;
    newRole: string;
    message: string;
  } | null>(null);

  // Fetch onboarding data for the current user
  const fetchOnboardingData = useCallback(async () => {
    if (!user?.id) return;

    setLoading(true);
    setError(null);

    try {
      // Get onboarding tracker by employee ID
      const trackerResponse = await onboardingApi.tracker.getByEmployeeId(user.id);
      setOnboarding(trackerResponse.data);

      // Get notifications for this user
      try {
        const notificationsResponse = await onboardingApi.notifications.getForRecipient(user.id);
        setNotifications(notificationsResponse.data || []);
      } catch (notifErr) {
        console.log('No notifications found or error fetching:', notifErr);
        setNotifications([]);
      }
    } catch (err: any) {
      console.error('Failed to fetch onboarding data:', err);
      if (err.response?.status === 404) {
        setError('No onboarding record found. Please contact HR if you believe this is an error.');
      } else {
        setError('Failed to load onboarding data. Please try again later.');
      }
    } finally {
      setLoading(false);
    }
  }, [user?.id]);

  useEffect(() => {
    if (!authLoading && user?.id) {
      fetchOnboardingData();
    }
  }, [authLoading, user?.id, fetchOnboardingData]);

  // Toggle section expansion
  const toggleSection = (section: keyof typeof expandedSections) => {
    setExpandedSections(prev => ({
      ...prev,
      [section]: !prev[section],
    }));
  };

  // Mark task as complete
  const handleCompleteTask = async (taskIndex: number) => {
    const id = onboarding?.onboardingId || onboarding?._id;
    console.log('[DEBUG] handleCompleteTask called', { onboardingId: id, taskIndex, userId: user?.id });
    if (!id || !user?.id) {
      console.log('[DEBUG] handleCompleteTask - missing onboarding or user');
      return;
    }

    try {
      console.log('[DEBUG] Calling completeTask API...');
      const result = await onboardingApi.tracker.completeTask(id, taskIndex, {
        notes: `Completed by candidate`,
      });
      console.log('[DEBUG] completeTask API success:', result);
      setSuccessMessage('Task marked as complete!');
      setTimeout(() => setSuccessMessage(null), 3000);
      fetchOnboardingData();
    } catch (err: any) {
      console.error('[DEBUG] completeTask API failed:', err);
      setError(err.response?.data?.message || 'Failed to complete task');
    }
  };

  // Upload document for a task
  const handleUploadDocument = async (taskIndex: number) => {
    const id = onboarding?.onboardingId || onboarding?._id;
    console.log('[DEBUG] handleUploadDocument called', { onboardingId: id, hasFile: !!uploadFile, taskIndex });
    if (!id || !uploadFile) {
      console.log('[DEBUG] handleUploadDocument - validation failed', { hasId: !!id, hasFile: !!uploadFile });
      setError('Please select a file to upload');
      return;
    }

    try {
      console.log('[DEBUG] Calling documents.uploadFile API...');
      // Upload the actual file
      const uploadResult = await onboardingApi.documents.uploadFile(
        uploadFile,
        id,
        'OTHER',
        uploadFile.name
      );
      console.log('[DEBUG] documents.uploadFile success:', uploadResult);

      console.log('[DEBUG] Calling completeTask API...');
      // Also mark the task as complete
      await onboardingApi.tracker.completeTask(id, taskIndex, {
        notes: `Document uploaded: ${uploadFile.name}`,
      });
      console.log('[DEBUG] completeTask success');

      setSuccessMessage('Document uploaded and task completed!');
      setUploadFile(null);
      setUploadingTask(null);
      setTimeout(() => setSuccessMessage(null), 3000);
      fetchOnboardingData();
    } catch (err: any) {
      console.error('[DEBUG] Upload/complete failed:', err);
      setError(err.response?.data?.message || 'Failed to upload document');
    }
  };

  // Calculate progress
  const calculateProgress = () => {
    if (!onboarding?.tasks?.length) return { completed: 0, total: 0, percentage: 0 };
    const completed = onboarding.tasks.filter(t => t.status === 'completed').length;
    const total = onboarding.tasks.filter(t => t.status !== 'cancelled').length;
    return {
      completed,
      total,
      percentage: total > 0 ? Math.round((completed / total) * 100) : 0,
    };
  };

  // Finalize onboarding - transition to employee
  const handleFinalizeOnboarding = async () => {
    const id = onboarding?.onboardingId || onboarding?._id;
    if (!id) return;

    setFinalizing(true);
    setError(null);

    try {
      const response = await onboardingApi.finalization.finalize(id);
      setFinalizationResult({
        success: response.data.success,
        newRole: response.data.newRole,
        message: response.data.message,
      });
      setSuccessMessage('🎉 Congratulations! Your onboarding is complete!');
      // Refresh the data
      await fetchOnboardingData();
    } catch (err: any) {
      console.error('Failed to finalize onboarding:', err);
      setError(err.response?.data?.message || 'Failed to complete onboarding. Please try again.');
    } finally {
      setFinalizing(false);
    }
  };

  // Group tasks by department
  const groupTasksByDepartment = () => {
    if (!onboarding?.tasks) return {};
    return onboarding.tasks.reduce((acc, task, index) => {
      const dept = task.department || 'General';
      if (!acc[dept]) acc[dept] = [];
      acc[dept].push({ ...task, index });
      return acc;
    }, {} as Record<string, (OnboardingTask & { index: number })[]>);
  };

  // Get task status icon
  const getTaskStatusIcon = (status: string) => {
    switch (status) {
      case 'completed':
        return <CheckCircle2 className="w-5 h-5 text-green-500" />;
      case 'in_progress':
        return <Clock className="w-5 h-5 text-blue-500" />;
      case 'cancelled':
        return <XCircle className="w-5 h-5 text-slate-400" />;
      default:
        return <Square className="w-5 h-5 text-slate-300" />;
    }
  };

  // Check if deadline is overdue
  const isOverdue = (deadline?: string) => {
    if (!deadline) return false;
    return new Date(deadline) < new Date();
  };

  const progress = calculateProgress();
  const groupedTasks = groupTasksByDepartment();

  if (authLoading || loading) {
    return (
      <RouteGuard requiredRoles={['Job Candidate']}>
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="text-center">
            <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mb-4"></div>
            <p className="text-slate-500 text-lg">Loading your onboarding...</p>
          </div>
        </div>
      </RouteGuard>
    );
  }

  return (
    <RouteGuard requiredRoles={['Job Candidate']}>
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-slate-900">My Onboarding</h1>
            <p className="text-slate-500 mt-1">
              Track your onboarding progress and complete required tasks
            </p>
          </div>
          <button
            onClick={fetchOnboardingData}
            className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-slate-600 bg-white border border-slate-200 rounded-lg hover:bg-slate-50"
          >
            <RefreshCw className="w-4 h-4" />
            Refresh
          </button>
        </div>

        {/* Success Message */}
        {successMessage && (
          <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-lg flex items-center gap-2">
            <CheckCircle2 className="w-5 h-5" />
            {successMessage}
          </div>
        )}

        {/* Error Message */}
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg flex items-center gap-2">
            <AlertCircle className="w-5 h-5" />
            {error}
            <button onClick={() => setError(null)} className="ml-auto text-red-500 hover:text-red-700">
              ×
            </button>
          </div>
        )}

        {onboarding ? (
          <>
            {/* Progress Overview */}
            <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="font-semibold text-slate-900">Onboarding Progress</h2>
                <StatusBadge status={onboarding.completed ? 'Completed' : 'In Progress'} />
              </div>

              <div className="flex items-center gap-4 mb-4">
                <div className="flex-1 bg-slate-100 rounded-full h-4 overflow-hidden">
                  <div
                    className="bg-green-500 h-full transition-all duration-500"
                    style={{ width: `${progress.percentage}%` }}
                  />
                </div>
                <span className="text-lg font-bold text-slate-900">{progress.percentage}%</span>
              </div>

              <div className="grid grid-cols-3 gap-4 text-center">
                <div className="p-3 bg-green-50 rounded-lg">
                  <p className="text-2xl font-bold text-green-600">{progress.completed}</p>
                  <p className="text-sm text-green-700">Completed</p>
                </div>
                <div className="p-3 bg-amber-50 rounded-lg">
                  <p className="text-2xl font-bold text-amber-600">
                    {progress.total - progress.completed}
                  </p>
                  <p className="text-sm text-amber-700">Pending</p>
                </div>
                <div className="p-3 bg-blue-50 rounded-lg">
                  <p className="text-2xl font-bold text-blue-600">{progress.total}</p>
                  <p className="text-sm text-blue-700">Total Tasks</p>
                </div>
              </div>

              {/* Finalize Button - Show when all tasks complete and not yet finalized */}
              {progress.percentage === 100 && !finalizationResult && (
                <div className="mt-6 pt-6 border-t border-slate-200">
                  <div className="bg-gradient-to-r from-green-50 to-emerald-50 border border-green-200 rounded-lg p-4">
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 rounded-full bg-green-100 flex items-center justify-center">
                        <Award className="w-6 h-6 text-green-600" />
                      </div>
                      <div className="flex-1">
                        <h3 className="font-semibold text-green-800">All Tasks Complete!</h3>
                        <p className="text-sm text-green-600">You've completed all onboarding tasks. Click below to finalize your onboarding.</p>
                      </div>
                      <button
                        onClick={handleFinalizeOnboarding}
                        disabled={finalizing}
                        className="flex items-center gap-2 px-6 py-3 bg-green-600 text-white font-semibold rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        {finalizing ? (
                          <><RefreshCw className="w-4 h-4 animate-spin" /> Processing...</>
                        ) : (
                          <>Complete Onboarding <ArrowRight className="w-4 h-4" /></>
                        )}
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {/* Finalization Success */}
              {finalizationResult?.success && (
                <div className="mt-6 pt-6 border-t border-slate-200">
                  <div className="bg-gradient-to-r from-purple-50 to-indigo-50 border border-purple-200 rounded-lg p-6 text-center">
                    <div className="w-16 h-16 rounded-full bg-purple-100 flex items-center justify-center mx-auto mb-4">
                      <Award className="w-8 h-8 text-purple-600" />
                    </div>
                    <h3 className="text-xl font-bold text-purple-800 mb-2">Welcome to the Team!</h3>
                    <p className="text-purple-600 mb-4">{finalizationResult.message}</p>
                    <p className="text-sm text-purple-500">Your new role: <span className="font-semibold">{finalizationResult.newRole}</span></p>
                    <p className="text-xs text-slate-500 mt-4">You will be redirected to the employee dashboard shortly, or <a href="/" className="text-purple-600 underline hover:text-purple-800">click here</a> to continue.</p>
                  </div>
                </div>
              )}
            </div>

            {/* Notifications Section (ONB-005) */}
            <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
              <button
                onClick={() => toggleSection('notifications')}
                className="w-full flex items-center justify-between p-4 bg-slate-50 hover:bg-slate-100 transition-colors"
              >
                <div className="flex items-center gap-3">
                  <Bell className="w-5 h-5 text-blue-600" />
                  <h2 className="font-semibold text-slate-900">Notifications & Reminders</h2>
                  {notifications.length > 0 && (
                    <span className="bg-blue-100 text-blue-700 text-xs font-medium px-2 py-1 rounded-full">
                      {notifications.length}
                    </span>
                  )}
                </div>
                {expandedSections.notifications ? (
                  <ChevronUp className="w-5 h-5 text-slate-400" />
                ) : (
                  <ChevronDown className="w-5 h-5 text-slate-400" />
                )}
              </button>

              {expandedSections.notifications && (
                <div className="p-4">
                  {notifications.length > 0 ? (
                    <div className="space-y-3">
                      {notifications.map((notif, idx) => (
                        <div
                          key={notif.notificationId || idx}
                          className="p-4 bg-slate-50 rounded-lg border border-slate-100"
                        >
                          <div className="flex items-start gap-3">
                            <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${notif.type === 'TASK_REMINDER' ? 'bg-amber-100' :
                              notif.type === 'DOCUMENT_REQUIRED' ? 'bg-red-100' :
                                'bg-blue-100'
                              }`}>
                              {notif.type === 'TASK_REMINDER' ? (
                                <Clock className="w-4 h-4 text-amber-600" />
                              ) : notif.type === 'DOCUMENT_REQUIRED' ? (
                                <FileText className="w-4 h-4 text-red-600" />
                              ) : (
                                <Bell className="w-4 h-4 text-blue-600" />
                              )}
                            </div>
                            <div className="flex-1">
                              <p className="font-medium text-slate-900">
                                {notif.subject || notif.type.replace(/_/g, ' ')}
                              </p>
                              <p className="text-sm text-slate-600 mt-1">{notif.message}</p>
                              <p className="text-xs text-slate-400 mt-2">
                                {new Date(notif.sentAt).toLocaleDateString('en-US', {
                                  month: 'short',
                                  day: 'numeric',
                                  hour: '2-digit',
                                  minute: '2-digit',
                                })}
                              </p>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-8 text-slate-500">
                      <Bell className="w-12 h-12 mx-auto mb-3 text-slate-300" />
                      <p>No notifications yet</p>
                      <p className="text-sm mt-1">You'll receive reminders about upcoming tasks here</p>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Tasks Section (ONB-004) */}
            <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
              <button
                onClick={() => toggleSection('tasks')}
                className="w-full flex items-center justify-between p-4 bg-slate-50 hover:bg-slate-100 transition-colors"
              >
                <div className="flex items-center gap-3">
                  <CheckSquare className="w-5 h-5 text-green-600" />
                  <h2 className="font-semibold text-slate-900">Onboarding Tasks</h2>
                </div>
                {expandedSections.tasks ? (
                  <ChevronUp className="w-5 h-5 text-slate-400" />
                ) : (
                  <ChevronDown className="w-5 h-5 text-slate-400" />
                )}
              </button>

              {expandedSections.tasks && (
                <div className="p-4">
                  {Object.entries(groupedTasks).map(([department, tasks]) => (
                    <div key={department} className="mb-6 last:mb-0">
                      <div className="flex items-center gap-2 mb-3">
                        <Building2 className="w-4 h-4 text-slate-500" />
                        <h3 className="font-medium text-slate-700">{department}</h3>
                        <span className="text-xs text-slate-400">
                          ({tasks.filter(t => t.status === 'completed').length}/{tasks.length})
                        </span>
                      </div>

                      <div className="space-y-2 pl-6">
                        {tasks.map((task) => (
                          <div
                            key={task._id || task.index}
                            className={`p-3 rounded-lg border ${task.status === 'completed' ? 'bg-green-50 border-green-100' :
                              task.status === 'cancelled' ? 'bg-slate-50 border-slate-100 opacity-60' :
                                isOverdue(task.deadline) ? 'bg-red-50 border-red-100' :
                                  'bg-white border-slate-200'
                              }`}
                          >
                            <div className="flex items-start gap-3">
                              {getTaskStatusIcon(task.status)}
                              <div className="flex-1">
                                <p className={`font-medium ${task.status === 'completed' ? 'text-green-700 line-through' :
                                  task.status === 'cancelled' ? 'text-slate-400 line-through' :
                                    'text-slate-900'
                                  }`}>
                                  {task.name}
                                </p>

                                {task.deadline && task.status !== 'completed' && task.status !== 'cancelled' && (
                                  <div className={`flex items-center gap-1 text-xs mt-1 ${isOverdue(task.deadline) ? 'text-red-600' : 'text-slate-500'
                                    }`}>
                                    <Calendar className="w-3 h-3" />
                                    Due: {new Date(task.deadline).toLocaleDateString()}
                                    {isOverdue(task.deadline) && <span className="font-medium"> (Overdue)</span>}
                                  </div>
                                )}

                                {task.notes && (
                                  <p className="text-xs text-slate-500 mt-1 flex items-center gap-1">
                                    <Info className="w-3 h-3" />
                                    {task.notes}
                                  </p>
                                )}

                                {task.completedAt && (
                                  <p className="text-xs text-green-600 mt-1">
                                    Completed on {new Date(task.completedAt).toLocaleDateString()}
                                  </p>
                                )}
                              </div>

                              {/* Action buttons for pending tasks */}
                              {task.status === 'pending' && (
                                <div className="flex gap-2">
                                  {task.notes?.toLowerCase().includes('upload') ||
                                    task.notes?.toLowerCase().includes('document') ||
                                    task.name.toLowerCase().includes('upload') ? (
                                    <>
                                      {uploadingTask === task.index ? (
                                        <div className="flex flex-col gap-2">
                                          <input
                                            type="file"
                                            accept=".pdf,.doc,.docx,.jpg,.jpeg,.png"
                                            onChange={(e) => setUploadFile(e.target.files?.[0] || null)}
                                            className="text-xs"
                                          />
                                          {uploadFile && (
                                            <span className="text-xs text-slate-500">
                                              Selected: {uploadFile.name}
                                            </span>
                                          )}
                                          <div className="flex gap-2">
                                            <button
                                              onClick={() => handleUploadDocument(task.index)}
                                              disabled={!uploadFile}
                                              className={`text-xs px-2 py-1 rounded ${uploadFile ? 'bg-green-500 text-white hover:bg-green-600' : 'bg-slate-200 text-slate-400 cursor-not-allowed'}`}
                                            >
                                              Upload
                                            </button>
                                            <button
                                              onClick={() => {
                                                setUploadingTask(null);
                                                setUploadFile(null);
                                              }}
                                              className="text-xs px-2 py-1 bg-slate-200 text-slate-600 rounded hover:bg-slate-300"
                                            >
                                              Cancel
                                            </button>
                                          </div>
                                        </div>
                                      ) : (
                                        <button
                                          onClick={() => setUploadingTask(task.index)}
                                          className="flex items-center gap-1 text-xs px-2 py-1 bg-blue-500 text-white rounded hover:bg-blue-600"
                                        >
                                          <Upload className="w-3 h-3" />
                                          Upload
                                        </button>
                                      )}
                                    </>
                                  ) : (
                                    <button
                                      onClick={() => handleCompleteTask(task.index)}
                                      className="flex items-center gap-1 text-xs px-2 py-1 bg-green-500 text-white rounded hover:bg-green-600"
                                    >
                                      <CheckCircle2 className="w-3 h-3" />
                                      Complete
                                    </button>
                                  )}
                                </div>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Document Upload Section (ONB-007) */}
            <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
              <button
                onClick={() => toggleSection('documents')}
                className="w-full flex items-center justify-between p-4 bg-slate-50 hover:bg-slate-100 transition-colors"
              >
                <div className="flex items-center gap-3">
                  <FileText className="w-5 h-5 text-purple-600" />
                  <h2 className="font-semibold text-slate-900">Document Upload</h2>
                </div>
                {expandedSections.documents ? (
                  <ChevronUp className="w-5 h-5 text-slate-400" />
                ) : (
                  <ChevronDown className="w-5 h-5 text-slate-400" />
                )}
              </button>

              {expandedSections.documents && (
                <div className="p-4">
                  <div className="bg-blue-50 border border-blue-100 rounded-lg p-4 mb-4">
                    <div className="flex items-start gap-3">
                      <Info className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
                      <div>
                        <p className="font-medium text-blue-800">Upload Required Documents</p>
                        <p className="text-sm text-blue-700 mt-1">
                          Please upload the following documents to complete your onboarding:
                        </p>
                        <ul className="text-sm text-blue-700 mt-2 list-disc list-inside">
                          <li>Signed employment contract</li>
                          <li>National ID or passport copy</li>
                          <li>Educational certificates</li>
                          <li>Any other required certifications</li>
                        </ul>
                      </div>
                    </div>
                  </div>

                  <div className="text-center py-4">
                    <p className="text-sm text-slate-500">
                      To upload documents, click the "Upload" button on the relevant task above
                    </p>
                  </div>
                </div>
              )}
            </div>

            {/* Helpful Information */}
            <div className="bg-amber-50 border border-amber-100 rounded-xl p-4">
              <div className="flex items-start gap-3">
                <AlertCircle className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="font-medium text-amber-800">Need Help?</p>
                  <p className="text-sm text-amber-700 mt-1">
                    If you have any questions about your onboarding tasks or need assistance,
                    please contact HR at <span className="font-medium">hr@company.com</span>
                  </p>
                </div>
              </div>
            </div>
          </>
        ) : (
          /* No Onboarding Record */
          <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-8 text-center">
            <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <FileText className="w-8 h-8 text-slate-400" />
            </div>
            <h2 className="text-lg font-semibold text-slate-900 mb-2">No Onboarding Record Found</h2>
            <p className="text-slate-500 max-w-md mx-auto">
              It looks like your onboarding hasn't been set up yet.
              If you've recently been hired, please contact HR to get started.
            </p>
          </div>
        )}
      </div>
    </RouteGuard>
  );
}
