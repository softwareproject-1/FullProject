'use client'

import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../../../context/AuthContext';
import RouteGuard from '../../../components/RouteGuard';
import { recruitmentApi } from '../../../services/api';
import { 
  Briefcase, 
  Clock, 
  CheckCircle, 
  XCircle, 
  AlertCircle,
  ChevronDown,
  ChevronUp,
  History,
  Calendar,
  MapPin,
  Building2,
  RefreshCw,
  Bell,
  FileText
} from 'lucide-react';
import Link from 'next/link';

interface ApplicationHistory {
  _id: string;
  applicationId: string;
  oldStage?: string;
  newStage?: string;
  oldStatus?: string;
  newStatus?: string;
  notes?: string;
  changedBy: string;
  createdAt: string;
}

interface CandidateApplication {
  _id: string;
  candidateId: string;
  requisitionId: {
    _id: string;
    requisitionId?: string;
    templateId?: {
      title?: string;
      department?: string;
      description?: string;
    };
    location?: string;
    openings?: number;
  };
  currentStage: string;
  status: string;
  createdAt: string;
  updatedAt: string;
}

const statusConfig: Record<string, { color: string; bgColor: string; icon: React.ReactNode; description: string }> = {
  submitted: { 
    color: 'text-blue-700', 
    bgColor: 'bg-blue-100', 
    icon: <FileText className="w-4 h-4" />,
    description: 'Your application has been submitted and is awaiting review.'
  },
  under_review: { 
    color: 'text-amber-700', 
    bgColor: 'bg-amber-100', 
    icon: <Clock className="w-4 h-4" />,
    description: 'Your application is being reviewed by our HR team.'
  },
  shortlisted: { 
    color: 'text-purple-700', 
    bgColor: 'bg-purple-100', 
    icon: <CheckCircle className="w-4 h-4" />,
    description: 'Congratulations! You have been shortlisted for the next stage.'
  },
  interview_scheduled: { 
    color: 'text-indigo-700', 
    bgColor: 'bg-indigo-100', 
    icon: <Calendar className="w-4 h-4" />,
    description: 'An interview has been scheduled. Check your email for details.'
  },
  offer_pending: { 
    color: 'text-green-700', 
    bgColor: 'bg-green-100', 
    icon: <AlertCircle className="w-4 h-4" />,
    description: 'An offer is being prepared for you.'
  },
  hired: { 
    color: 'text-emerald-700', 
    bgColor: 'bg-emerald-100', 
    icon: <CheckCircle className="w-4 h-4" />,
    description: 'Congratulations! You have been hired. Welcome to the team!'
  },
  rejected: { 
    color: 'text-red-700', 
    bgColor: 'bg-red-100', 
    icon: <XCircle className="w-4 h-4" />,
    description: 'Unfortunately, your application was not successful this time.'
  },
  withdrawn: { 
    color: 'text-slate-700', 
    bgColor: 'bg-slate-100', 
    icon: <XCircle className="w-4 h-4" />,
    description: 'You have withdrawn your application.'
  },
};

const stageConfig: Record<string, { label: string; progress: number }> = {
  SCREENING: { label: 'Initial Screening', progress: 25 },
  DEPARTMENT_INTERVIEW: { label: 'Department Interview', progress: 50 },
  HR_INTERVIEW: { label: 'HR Interview', progress: 75 },
  OFFER: { label: 'Offer Stage', progress: 100 },
};

export default function CandidateApplications() {
  const { user } = useAuth();
  const [applications, setApplications] = useState<CandidateApplication[]>([]);
  const [applicationHistory, setApplicationHistory] = useState<Record<string, ApplicationHistory[]>>({});
  const [expandedApplications, setExpandedApplications] = useState<Set<string>>(new Set());
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);

  const fetchApplications = useCallback(async () => {
    if (!user?.id) return;
    
    try {
      // Use the proper endpoint to fetch candidate's applications
      const response = await recruitmentApi.applications.getByCandidate(user.id);
      setApplications(response.data as any);
      setLastUpdated(new Date());
    } catch (err: any) {
      console.error('Failed to fetch applications:', err);
      // Fallback: fetch all and filter (for demo purposes)
      try {
        const allResponse = await recruitmentApi.applications.getAll();
        const myApps = allResponse.data.filter((app: any) => 
          app.candidateId === user.id || 
          app.candidateId?._id === user.id ||
          app.candidate?._id === user.id
        );
        setApplications(myApps as any);
        setLastUpdated(new Date());
      } catch (fallbackErr) {
        setError('Unable to load your applications. Please try again later.');
      }
    }
  }, [user?.id]);

  const fetchHistory = useCallback(async (applicationId: string) => {
    try {
      const response = await recruitmentApi.applications.getHistory(applicationId);
      setApplicationHistory(prev => ({
        ...prev,
        [applicationId]: response.data
      }));
    } catch (err) {
      console.error('Failed to fetch application history:', err);
    }
  }, []);

  useEffect(() => {
    const loadData = async () => {
      setIsLoading(true);
      await fetchApplications();
      setIsLoading(false);
    };
    loadData();
  }, [fetchApplications]);

  const handleRefresh = async () => {
    setIsRefreshing(true);
    await fetchApplications();
    setIsRefreshing(false);
  };

  const toggleExpand = async (applicationId: string) => {
    const newExpanded = new Set(expandedApplications);
    if (newExpanded.has(applicationId)) {
      newExpanded.delete(applicationId);
    } else {
      newExpanded.add(applicationId);
      // Fetch history if not already loaded
      if (!applicationHistory[applicationId]) {
        await fetchHistory(applicationId);
      }
    }
    setExpandedApplications(newExpanded);
  };

  const getStatusDisplay = (status: string) => {
    const normalizedStatus = status.toLowerCase().replace(/ /g, '_');
    return statusConfig[normalizedStatus] || statusConfig.submitted;
  };

  const getStageDisplay = (stage: string) => {
    // Normalize stage: convert to uppercase and replace spaces with underscores
    const normalizedStage = stage.toUpperCase().replace(/ /g, '_');
    return stageConfig[normalizedStage] || { label: stage.replace(/_/g, ' '), progress: 0 };
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  const formatDateTime = (dateString: string) => {
    return new Date(dateString).toLocaleString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  return (
    <RouteGuard requiredRoles={['Job Candidate']}>
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-2xl font-bold text-slate-900">My Applications</h1>
            <p className="text-slate-500 mt-1">Track the status of your job applications</p>
          </div>
          <div className="flex items-center gap-3">
            {lastUpdated && (
              <span className="text-xs text-slate-400">
                Last updated: {formatDateTime(lastUpdated.toISOString())}
              </span>
            )}
            <button
              onClick={handleRefresh}
              disabled={isRefreshing}
              className="p-2 text-slate-600 hover:bg-slate-100 rounded-lg transition-colors disabled:opacity-50"
              title="Refresh"
            >
              <RefreshCw className={`w-5 h-5 ${isRefreshing ? 'animate-spin' : ''}`} />
            </button>
          </div>
        </div>

        {/* Notification Banner (REC-017) */}
        <div className="mb-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
          <div className="flex items-start gap-3">
            <Bell className="w-5 h-5 text-blue-600 mt-0.5" />
            <div>
              <h3 className="font-medium text-blue-900">Stay Updated</h3>
              <p className="text-sm text-blue-700 mt-1">
                You'll receive email notifications when your application status changes. 
                Check this page regularly for real-time updates on your applications.
              </p>
            </div>
          </div>
        </div>

        {/* Applications List */}
        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
          </div>
        ) : error ? (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-red-700">
            {error}
          </div>
        ) : applications.length === 0 ? (
          <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-12 text-center">
            <Briefcase className="w-12 h-12 text-slate-300 mx-auto mb-4" />
            <h3 className="font-semibold text-slate-900 mb-2">No Applications Yet</h3>
            <p className="text-slate-500 mb-4">
              You haven't applied to any positions yet. Browse our open positions and start applying!
            </p>
            <Link
              href="/candidate/jobs"
              className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              <Briefcase className="w-4 h-4" />
              Browse Jobs
            </Link>
          </div>
        ) : (
          <div className="space-y-4">
            {applications.map((app) => {
              const statusDisplay = getStatusDisplay(app.status);
              const stageDisplay = getStageDisplay(app.currentStage);
              const isExpanded = expandedApplications.has(app._id);
              const history = applicationHistory[app._id] || [];
              const requisition = app.requisitionId;

              return (
                <div
                  key={app._id}
                  className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden"
                >
                  {/* Main Card */}
                  <div className="p-6">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <h3 className="text-lg font-semibold text-slate-900">
                          {requisition?.templateId?.title || 'Position'}
                        </h3>
                        <div className="flex flex-wrap gap-3 mt-2 text-sm text-slate-500">
                          <span className="flex items-center gap-1">
                            <Building2 className="w-4 h-4" />
                            {requisition?.templateId?.department || 'N/A'}
                          </span>
                          <span className="flex items-center gap-1">
                            <MapPin className="w-4 h-4" />
                            {requisition?.location || 'Not specified'}
                          </span>
                        </div>
                      </div>
                      <div className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-sm font-medium ${statusDisplay.bgColor} ${statusDisplay.color}`}>
                        {statusDisplay.icon}
                        <span className="capitalize">{app.status.replace(/_/g, ' ')}</span>
                      </div>
                    </div>

                    {/* Status Description */}
                    <div className="mt-4 p-3 bg-slate-50 rounded-lg">
                      <p className="text-sm text-slate-600">{statusDisplay.description}</p>
                    </div>

                    {/* Progress Bar or Rejection Indicator */}
                    {app.status.toLowerCase() === 'rejected' || app.status.toLowerCase() === 'withdrawn' ? (
                      /* Rejection/Withdrawal Indicator */
                      <div className="mt-4">
                        <div className={`p-4 rounded-lg border-2 ${
                          app.status.toLowerCase() === 'rejected' 
                            ? 'bg-red-50 border-red-200' 
                            : 'bg-slate-50 border-slate-200'
                        }`}>
                          <div className="flex items-center gap-3">
                            <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                              app.status.toLowerCase() === 'rejected'
                                ? 'bg-red-100'
                                : 'bg-slate-100'
                            }`}>
                              <XCircle className={`w-6 h-6 ${
                                app.status.toLowerCase() === 'rejected'
                                  ? 'text-red-600'
                                  : 'text-slate-600'
                              }`} />
                            </div>
                            <div>
                              <p className={`font-semibold ${
                                app.status.toLowerCase() === 'rejected'
                                  ? 'text-red-800'
                                  : 'text-slate-800'
                              }`}>
                                {app.status.toLowerCase() === 'rejected' 
                                  ? 'Application Not Successful' 
                                  : 'Application Withdrawn'}
                              </p>
                              <p className={`text-sm ${
                                app.status.toLowerCase() === 'rejected'
                                  ? 'text-red-600'
                                  : 'text-slate-600'
                              }`}>
                                {app.status.toLowerCase() === 'rejected'
                                  ? 'We appreciate your interest. Please consider applying for other positions.'
                                  : 'You have withdrawn this application.'}
                              </p>
                            </div>
                          </div>
                        </div>
                      </div>
                    ) : (
                      /* Normal Progress Bar */
                      <div className="mt-4">
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-sm font-medium text-slate-700">Current Stage: {stageDisplay.label}</span>
                          <span className="text-sm text-slate-500">{stageDisplay.progress}%</span>
                        </div>
                        <div className="w-full bg-slate-200 rounded-full h-2">
                          <div 
                            className="bg-blue-600 h-2 rounded-full transition-all duration-300" 
                            style={{ width: `${stageDisplay.progress}%` }}
                          />
                        </div>
                        {/* Stage Indicators */}
                        <div className="flex justify-between mt-2 text-xs text-slate-500">
                          <span>Screening</span>
                          <span>Dept Interview</span>
                          <span>HR Interview</span>
                          <span>Offer</span>
                        </div>
                      </div>
                    )}

                    {/* Footer */}
                    <div className="mt-4 pt-4 border-t border-slate-100 flex items-center justify-between">
                      <div className="text-sm text-slate-500">
                        Applied on {formatDate(app.createdAt)}
                        {app.updatedAt !== app.createdAt && (
                          <span className="ml-2">• Updated {formatDate(app.updatedAt)}</span>
                        )}
                      </div>
                      <button
                        onClick={() => toggleExpand(app._id)}
                        className="flex items-center gap-1 text-sm text-blue-600 hover:text-blue-700"
                      >
                        <History className="w-4 h-4" />
                        View History
                        {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                      </button>
                    </div>
                  </div>

                  {/* History Section (REC-017) */}
                  {isExpanded && (
                    <div className="border-t border-slate-200 bg-slate-50 p-6">
                      <h4 className="font-medium text-slate-900 mb-4 flex items-center gap-2">
                        <History className="w-4 h-4" />
                        Application History
                      </h4>
                      {history.length > 0 ? (
                        <div className="space-y-3">
                          {history.map((item, idx) => (
                            <div key={item._id || idx} className="flex gap-3">
                              <div className="flex-shrink-0 w-2 h-2 mt-2 bg-blue-500 rounded-full" />
                              <div className="flex-1">
                                <div className="flex items-center justify-between">
                                  <p className="text-sm text-slate-900">
                                    {item.newStatus && item.oldStatus && item.newStatus !== item.oldStatus && (
                                      <span>Status changed from <strong>{item.oldStatus}</strong> to <strong>{item.newStatus}</strong></span>
                                    )}
                                    {item.newStage && item.oldStage && item.newStage !== item.oldStage && (
                                      <span>Stage changed from <strong>{item.oldStage.replace(/_/g, ' ')}</strong> to <strong>{item.newStage.replace(/_/g, ' ')}</strong></span>
                                    )}
                                    {!item.newStatus && !item.newStage && 'Application submitted'}
                                  </p>
                                  <span className="text-xs text-slate-400">
                                    {formatDateTime(item.createdAt)}
                                  </span>
                                </div>
                                {item.notes && (
                                  <p className="text-sm text-slate-500 mt-1">Note: {item.notes}</p>
                                )}
                              </div>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <p className="text-sm text-slate-500">No history available yet.</p>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </RouteGuard>
  );
}
