'use client'

import { Card } from '../../../components/Card';
import { TerminationRequest, TerminationStatus } from '../../../lib/types';
import {
  Clock,
  CheckCircle2,
  XCircle,
  Eye,
  RefreshCw,
  FileText,
  Calendar,
  AlertCircle,
} from 'lucide-react';

interface ResignationTrackerProps {
  resignations: TerminationRequest[];
  onRefresh: () => void;
}

// Status step configuration
const statusSteps = [
  { status: TerminationStatus.PENDING, label: 'Submitted', icon: FileText },
  { status: TerminationStatus.UNDER_REVIEW, label: 'Under Review', icon: Eye },
  { status: TerminationStatus.APPROVED, label: 'Approved', icon: CheckCircle2 },
];

function getStatusIndex(status: TerminationStatus): number {
  if (status === TerminationStatus.REJECTED) return -1;
  return statusSteps.findIndex(s => s.status === status);
}

function getStatusColor(status: TerminationStatus): string {
  switch (status) {
    case TerminationStatus.PENDING:
      return 'text-yellow-600 bg-yellow-100';
    case TerminationStatus.UNDER_REVIEW:
      return 'text-blue-600 bg-blue-100';
    case TerminationStatus.APPROVED:
      return 'text-green-600 bg-green-100';
    case TerminationStatus.REJECTED:
      return 'text-red-600 bg-red-100';
    default:
      return 'text-slate-600 bg-slate-100';
  }
}

export function ResignationTracker({
  resignations,
  onRefresh,
}: ResignationTrackerProps) {
  if (resignations.length === 0) {
    return (
      <Card title="My Resignations">
        <div className="text-center py-12">
          <FileText className="w-12 h-12 text-slate-300 mx-auto mb-4" />
          <p className="text-slate-500 mb-2">No resignation requests found</p>
          <p className="text-sm text-slate-400">
            Submit a resignation request to track its status here
          </p>
        </div>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-medium text-slate-900">My Resignation Requests</h3>
        <button
          onClick={onRefresh}
          className="flex items-center gap-2 px-3 py-1.5 text-sm text-slate-600 hover:text-slate-900 transition-colors"
        >
          <RefreshCw className="w-4 h-4" />
          Refresh
        </button>
      </div>

      {resignations.map((resignation) => {
        const currentStepIndex = getStatusIndex(resignation.status);
        const isRejected = resignation.status === TerminationStatus.REJECTED;

        return (
          <Card key={resignation._id}>
            <div className="space-y-6">
              {/* Header */}
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-sm text-slate-500">Request ID</p>
                  <p className="font-mono text-sm">{resignation._id}</p>
                </div>
                <span className={`px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(resignation.status)}`}>
                  {resignation.status.replace('_', ' ').toUpperCase()}
                </span>
              </div>

              {/* Status Timeline */}
              {!isRejected ? (
                <div className="relative">
                  <div className="flex justify-between items-center">
                    {statusSteps.map((step, index) => {
                      const StepIcon = step.icon;
                      const isCompleted = index <= currentStepIndex;
                      const isCurrent = index === currentStepIndex;

                      return (
                        <div key={step.status} className="flex flex-col items-center relative z-10">
                          <div
                            className={`w-10 h-10 rounded-full flex items-center justify-center transition-colors ${isCompleted
                              ? isCurrent
                                ? 'bg-blue-600 text-white'
                                : 'bg-green-600 text-white'
                              : 'bg-slate-200 text-slate-400'
                              }`}
                          >
                            {isCompleted && !isCurrent ? (
                              <CheckCircle2 className="w-5 h-5" />
                            ) : (
                              <StepIcon className="w-5 h-5" />
                            )}
                          </div>
                          <p className={`mt-2 text-sm font-medium ${isCompleted ? 'text-slate-900' : 'text-slate-400'}`}>
                            {step.label}
                          </p>
                        </div>
                      );
                    })}
                  </div>
                  {/* Progress line */}
                  <div className="absolute top-5 left-0 right-0 h-0.5 bg-slate-200 -z-0" style={{ margin: '0 40px' }}>
                    <div
                      className="h-full bg-green-600 transition-all duration-500"
                      style={{ width: `${(currentStepIndex / (statusSteps.length - 1)) * 100}%` }}
                    />
                  </div>
                </div>
              ) : (
                <div className="flex items-center gap-3 p-4 bg-red-50 rounded-lg">
                  <XCircle className="w-6 h-6 text-red-600" />
                  <div>
                    <p className="font-medium text-red-800">Request Rejected</p>
                    <p className="text-sm text-red-600">
                      {resignation.hrComments || 'Your resignation request has been rejected. Please contact HR for more information.'}
                    </p>
                  </div>
                </div>
              )}

              {/* Details */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-4 border-t">
                <div>
                  <p className="text-sm text-slate-500">Submitted On</p>
                  <p className="font-medium flex items-center gap-2">
                    <Calendar className="w-4 h-4 text-slate-400" />
                    {new Date(resignation.createdAt).toLocaleDateString('en-US', {
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric',
                    })}
                  </p>
                </div>
                {resignation.terminationDate && (
                  <div>
                    <p className="text-sm text-slate-500">Approved Last Working Day</p>
                    <p className="font-medium flex items-center gap-2">
                      <Calendar className="w-4 h-4 text-slate-400" />
                      {new Date(resignation.terminationDate).toLocaleDateString('en-US', {
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric',
                      })}
                    </p>
                  </div>
                )}
              </div>

              {/* Reason */}
              <div>
                <p className="text-sm text-slate-500 mb-1">Reason</p>
                <p className="text-slate-700 bg-slate-50 p-3 rounded-lg">{resignation.reason}</p>
              </div>

              {/* Comments */}
              {resignation.employeeComments && (
                <div>
                  <p className="text-sm text-slate-500 mb-1">Your Comments</p>
                  <p className="text-slate-600 italic bg-slate-50 p-3 rounded-lg">
                    "{resignation.employeeComments}"
                  </p>
                </div>
              )}

              {resignation.hrComments && resignation.status !== TerminationStatus.REJECTED && (
                <div>
                  <p className="text-sm text-slate-500 mb-1">HR Response</p>
                  <p className="text-slate-700 bg-blue-50 p-3 rounded-lg">{resignation.hrComments}</p>
                </div>
              )}

              {/* Next Steps (for approved) */}
              {resignation.status === TerminationStatus.APPROVED && (
                <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
                  <div className="flex items-start gap-3">
                    <AlertCircle className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
                    <div>
                      <p className="font-medium text-green-800">Next Steps</p>
                      <ul className="text-sm text-green-700 list-disc list-inside mt-1 space-y-1">
                        <li>Complete knowledge transfer with your team</li>
                        <li>Return all company assets (laptop, access cards, etc.)</li>
                        <li>Schedule exit interview with HR</li>
                        <li>Complete clearance process from all departments</li>
                      </ul>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </Card>
        );
      })}
    </div>
  );
}