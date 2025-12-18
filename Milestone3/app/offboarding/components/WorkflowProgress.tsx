'use client'

import { CheckCircle2, Circle, Clock, AlertTriangle } from 'lucide-react';

export enum OffboardingStage {
  INITIATION = 'initiation',
  APPROVAL = 'approval',
  CLEARANCE = 'clearance',
  ACCESS_REVOCATION = 'access_revocation',
  SETTLEMENT = 'settlement',
  COMPLETED = 'completed',
}

interface WorkflowProgressProps {
  currentStage: OffboardingStage;
  stages?: {
    initiation: { completed: boolean; date?: string };
    approval: { completed: boolean; date?: string; status?: string };
    clearance: { completed: boolean; progress?: number };
    accessRevocation: { completed: boolean; date?: string };
    settlement: { completed: boolean; date?: string };
  };
  showDetails?: boolean;
}

const STAGE_CONFIG = [
  {
    id: OffboardingStage.INITIATION,
    label: 'Exit Initiation',
    description: 'Resignation submitted or termination initiated',
    icon: '📝',
  },
  {
    id: OffboardingStage.APPROVAL,
    label: 'Approval',
    description: 'HR/Management review and approval',
    icon: '✅',
  },
  {
    id: OffboardingStage.CLEARANCE,
    label: 'Clearance',
    description: 'Multi-department sign-off and asset return',
    icon: '📋',
  },
  {
    id: OffboardingStage.ACCESS_REVOCATION,
    label: 'Access Revocation',
    description: 'System and account access disabled',
    icon: '🔒',
  },
  {
    id: OffboardingStage.SETTLEMENT,
    label: 'Final Settlement',
    description: 'Leave encashment and final pay processing',
    icon: '💰',
  },
];

function getStageIndex(stage: OffboardingStage): number {
  const index = STAGE_CONFIG.findIndex(s => s.id === stage);
  return index >= 0 ? index : 0;
}

export function WorkflowProgress({ 
  currentStage, 
  stages,
  showDetails = true 
}: WorkflowProgressProps) {
  const currentIndex = getStageIndex(currentStage);

  return (
    <div className="w-full">
      {/* Progress Bar */}
      <div className="relative">
        {/* Background line */}
        <div className="absolute top-5 left-0 w-full h-1 bg-slate-200 rounded-full" />
        
        {/* Progress line */}
        <div 
          className="absolute top-5 left-0 h-1 bg-gradient-to-r from-blue-500 to-green-500 rounded-full transition-all duration-500"
          style={{ width: `${(currentIndex / (STAGE_CONFIG.length - 1)) * 100}%` }}
        />

        {/* Stage nodes */}
        <div className="relative flex justify-between">
          {STAGE_CONFIG.map((stage, index) => {
            const isCompleted = index < currentIndex || currentStage === OffboardingStage.COMPLETED;
            const isCurrent = index === currentIndex && currentStage !== OffboardingStage.COMPLETED;
            const isPending = index > currentIndex;

            return (
              <div key={stage.id} className="flex flex-col items-center">
                {/* Node */}
                <div
                  className={`w-10 h-10 rounded-full flex items-center justify-center text-lg z-10 transition-all duration-300 ${
                    isCompleted
                      ? 'bg-green-500 text-white shadow-lg shadow-green-200'
                      : isCurrent
                        ? 'bg-blue-500 text-white shadow-lg shadow-blue-200 ring-4 ring-blue-100'
                        : 'bg-slate-200 text-slate-400'
                  }`}
                >
                  {isCompleted ? (
                    <CheckCircle2 className="w-5 h-5" />
                  ) : isCurrent ? (
                    <Clock className="w-5 h-5 animate-pulse" />
                  ) : (
                    <Circle className="w-5 h-5" />
                  )}
                </div>

                {/* Label */}
                <div className="mt-3 text-center">
                  <p className={`text-sm font-medium ${
                    isCompleted ? 'text-green-700' : 
                    isCurrent ? 'text-blue-700' : 
                    'text-slate-400'
                  }`}>
                    {stage.label}
                  </p>
                  {showDetails && (
                    <p className="text-xs text-slate-500 mt-1 max-w-[100px]">
                      {stage.description}
                    </p>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Stage Details Panel (if stages data provided) */}
      {stages && showDetails && (
        <div className="mt-8 grid grid-cols-5 gap-2">
          {/* Initiation */}
          <div className={`p-3 rounded-lg text-center ${
            stages.initiation.completed ? 'bg-green-50 border border-green-200' : 'bg-slate-50'
          }`}>
            <p className="text-xs font-medium text-slate-600">Initiated</p>
            {stages.initiation.date && (
              <p className="text-xs text-slate-500 mt-1">
                {new Date(stages.initiation.date).toLocaleDateString()}
              </p>
            )}
          </div>

          {/* Approval */}
          <div className={`p-3 rounded-lg text-center ${
            stages.approval.completed ? 'bg-green-50 border border-green-200' : 
            stages.approval.status === 'pending' ? 'bg-yellow-50 border border-yellow-200' :
            'bg-slate-50'
          }`}>
            <p className="text-xs font-medium text-slate-600">Approval</p>
            {stages.approval.status && (
              <p className={`text-xs mt-1 ${
                stages.approval.status === 'approved' ? 'text-green-600' :
                stages.approval.status === 'rejected' ? 'text-red-600' :
                'text-yellow-600'
              }`}>
                {stages.approval.status.charAt(0).toUpperCase() + stages.approval.status.slice(1)}
              </p>
            )}
          </div>

          {/* Clearance */}
          <div className={`p-3 rounded-lg text-center ${
            stages.clearance.completed ? 'bg-green-50 border border-green-200' : 'bg-slate-50'
          }`}>
            <p className="text-xs font-medium text-slate-600">Clearance</p>
            {stages.clearance.progress !== undefined && (
              <div className="mt-1">
                <div className="w-full bg-slate-200 rounded-full h-1.5">
                  <div 
                    className="bg-blue-500 h-1.5 rounded-full" 
                    style={{ width: `${stages.clearance.progress}%` }}
                  />
                </div>
                <p className="text-xs text-slate-500 mt-1">{stages.clearance.progress}%</p>
              </div>
            )}
          </div>

          {/* Access Revocation */}
          <div className={`p-3 rounded-lg text-center ${
            stages.accessRevocation.completed ? 'bg-green-50 border border-green-200' : 'bg-slate-50'
          }`}>
            <p className="text-xs font-medium text-slate-600">Access</p>
            {stages.accessRevocation.completed ? (
              <p className="text-xs text-green-600 mt-1">Revoked</p>
            ) : (
              <p className="text-xs text-slate-400 mt-1">Active</p>
            )}
          </div>

          {/* Settlement */}
          <div className={`p-3 rounded-lg text-center ${
            stages.settlement.completed ? 'bg-green-50 border border-green-200' : 'bg-slate-50'
          }`}>
            <p className="text-xs font-medium text-slate-600">Settlement</p>
            {stages.settlement.completed ? (
              <p className="text-xs text-green-600 mt-1">Complete</p>
            ) : (
              <p className="text-xs text-slate-400 mt-1">Pending</p>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

export default WorkflowProgress;
