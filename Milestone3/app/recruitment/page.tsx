'use client'

import { useState } from 'react';
import { Card } from '../../components/Card';
import { StatusBadge } from '../../components/StatusBadge';
import { Modal } from '../../components/Modal';
import { UserPlus, CheckCircle2, FileText, Key, Package } from 'lucide-react';
import { mockCandidates, mockOnboardingTasks, mockOffboardingCases } from '../../lib/api';
import type { Candidate } from '../../lib/types';

export default function Recruitment() {
  const [currentView, setCurrentView] = useState<'pipeline' | 'onboarding' | 'offboarding'>('pipeline');
  const [isOffboardingModalOpen, setIsOffboardingModalOpen] = useState(false);
  const [offboardingForm, setOffboardingForm] = useState({
    type: 'Resignation' as 'Resignation' | 'Termination',
    lastWorkingDay: '',
    reason: '',
  });

  const handleMoveCandidate = (candidateId: string, newStage: Candidate['stage']) => {
    console.log(`Moving candidate ${candidateId} to ${newStage}`);
  };

  const stages: Candidate['stage'][] = ['Applied', 'Interview', 'Offer', 'Hired', 'Rejected'];

  const getCandidatesByStage = (stage: Candidate['stage']) => {
    return mockCandidates.filter((c) => c.stage === stage);
  };

  const getStatusColor = (category: string) => {
    switch (category) {
      case 'Docs':
        return 'bg-blue-50 text-blue-600';
      case 'Assets':
        return 'bg-green-50 text-green-600';
      case 'Access':
        return 'bg-purple-50 text-purple-600';
      default:
        return 'bg-slate-50 text-slate-600';
    }
  };

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'Docs':
        return <FileText className="w-4 h-4" />;
      case 'Assets':
        return <Package className="w-4 h-4" />;
      case 'Access':
        return <Key className="w-4 h-4" />;
      default:
        return null;
    }
  };

  const handleSubmitOffboarding = () => {
    console.log('Starting offboarding:', offboardingForm);
    setIsOffboardingModalOpen(false);
    setOffboardingForm({ type: 'Resignation', lastWorkingDay: '', reason: '' });
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-slate-900 mb-2">Recruitment</h1>
          <p className="text-slate-600">Manage hiring, onboarding, and offboarding</p>
        </div>
        
        <div className="flex gap-2">
          <button
            onClick={() => setCurrentView('pipeline')}
            className={`px-4 py-2 rounded-lg transition-colors ${
              currentView === 'pipeline'
                ? 'bg-slate-900 text-white'
                : 'bg-white text-slate-700 border border-slate-300 hover:bg-slate-50'
            }`}
          >
            Pipeline
          </button>
          <button
            onClick={() => setCurrentView('onboarding')}
            className={`px-4 py-2 rounded-lg transition-colors ${
              currentView === 'onboarding'
                ? 'bg-slate-900 text-white'
                : 'bg-white text-slate-700 border border-slate-300 hover:bg-slate-50'
            }`}
          >
            Onboarding
          </button>
          <button
            onClick={() => setCurrentView('offboarding')}
            className={`px-4 py-2 rounded-lg transition-colors ${
              currentView === 'offboarding'
                ? 'bg-slate-900 text-white'
                : 'bg-white text-slate-700 border border-slate-300 hover:bg-slate-50'
            }`}
          >
            Offboarding
          </button>
        </div>
      </div>

      {currentView === 'pipeline' && (
        <div>
          <div className="mb-4 flex justify-between items-center">
            <h2 className="text-slate-900">Candidate Pipeline</h2>
            <button className="px-4 py-2 bg-slate-900 text-white rounded-lg hover:bg-slate-800 transition-colors flex items-center gap-2">
              <UserPlus className="w-4 h-4" />
              Add Candidate
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
            {stages.map((stage) => {
              const candidates = getCandidatesByStage(stage);
              const stageColors: Record<typeof stage, string> = {
                Applied: 'bg-slate-100 border-slate-300',
                Interview: 'bg-blue-50 border-blue-300',
                Offer: 'bg-amber-50 border-amber-300',
                Hired: 'bg-green-50 border-green-300',
                Rejected: 'bg-red-50 border-red-300',
              };

              return (
                <div key={stage} className={`p-4 rounded-lg border-2 ${stageColors[stage]}`}>
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-slate-900">{stage}</h3>
                    <span className="px-2 py-1 bg-white rounded-full text-slate-700">
                      {candidates.length}
                    </span>
                  </div>

                  <div className="space-y-3">
                    {candidates.map((candidate) => (
                      <div
                        key={candidate.id}
                        className="p-3 bg-white rounded-lg shadow-sm border border-slate-200 cursor-move hover:shadow-md transition-shadow"
                      >
                        <p className="text-slate-900 mb-1">{candidate.name}</p>
                        <p className="text-slate-600 mb-2">{candidate.position}</p>
                        <p className="text-xs text-slate-500 mb-3">{candidate.email}</p>
                        
                        {stage !== 'Hired' && stage !== 'Rejected' && (
                          <select
                            onChange={(e) => handleMoveCandidate(candidate.id, e.target.value as Candidate['stage'])}
                            className="w-full px-2 py-1 border border-slate-300 rounded text-xs focus:outline-none focus:ring-2 focus:ring-blue-500"
                            value={stage}
                          >
                            {stages.map((s) => (
                              <option key={s} value={s}>
                                Move to {s}
                              </option>
                            ))}
                          </select>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {currentView === 'onboarding' && (
        <div className="space-y-6">
          <Card title="Onboarding Track">
            <div className="mb-4">
              <label className="block text-slate-700 mb-2">Select New Hire</label>
              <select className="w-full max-w-md px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500">
                <option value="">Choose an employee...</option>
                <option value="emp001">Sarah Johnson - EMP001</option>
              </select>
            </div>

            <div className="mt-6 space-y-3">
              {mockOnboardingTasks.map((task) => (
                <div
                  key={task.id}
                  className="flex items-center justify-between p-4 border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors"
                >
                  <div className="flex items-center gap-4">
                    <div className={`p-2 rounded-lg ${getStatusColor(task.category)}`}>
                      {getCategoryIcon(task.category)}
                    </div>
                    <div>
                      <p className="text-slate-900">{task.task}</p>
                      <p className="text-slate-600">Due: {task.dueDate}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <StatusBadge status={task.status} />
                    {task.status === 'Completed' && (
                      <CheckCircle2 className="w-5 h-5 text-green-600" />
                    )}
                  </div>
                </div>
              ))}
            </div>

            <div className="mt-6 p-4 bg-green-50 border border-green-200 rounded-lg">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-green-800">Onboarding Progress</p>
                  <p className="text-green-600">3/3 tasks completed</p>
                </div>
                <div className="text-green-600">100%</div>
              </div>
              <div className="mt-3 w-full bg-green-200 rounded-full h-2">
                <div className="bg-green-600 h-2 rounded-full" style={{ width: '100%' }} />
              </div>
            </div>
          </Card>
        </div>
      )}

      {currentView === 'offboarding' && (
        <div className="space-y-6">
          <div className="flex justify-end">
            <button
              onClick={() => setIsOffboardingModalOpen(true)}
              className="px-4 py-2 bg-slate-900 text-white rounded-lg hover:bg-slate-800 transition-colors"
            >
              Start Offboarding
            </button>
          </div>

          <Card title="Active Offboarding Cases">
            <div className="space-y-4">
              {mockOffboardingCases.map((offboarding) => (
                <div
                  key={offboarding.id}
                  className="p-4 border border-slate-200 rounded-lg"
                >
                  <div className="flex items-center justify-between mb-4">
                    <div>
                      <h4 className="text-slate-900">{offboarding.employeeName}</h4>
                      <p className="text-slate-600">
                        {offboarding.type} - Last Day: {offboarding.lastWorkingDay}
                      </p>
                    </div>
                    <StatusBadge status={offboarding.status} />
                  </div>

                  <div className="grid grid-cols-3 gap-4">
                    <div className="flex items-center gap-2">
                      <div className={`w-4 h-4 rounded-full ${
                        offboarding.assetsRecovered ? 'bg-green-500' : 'bg-slate-300'
                      }`} />
                      <span className="text-slate-700">Assets Recovered</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className={`w-4 h-4 rounded-full ${
                        offboarding.accessRevoked ? 'bg-green-500' : 'bg-slate-300'
                      }`} />
                      <span className="text-slate-700">Access Revoked</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className={`w-4 h-4 rounded-full ${
                        offboarding.exitInterviewCompleted ? 'bg-green-500' : 'bg-slate-300'
                      }`} />
                      <span className="text-slate-700">Exit Interview</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </Card>
        </div>
      )}

      {/* Offboarding Wizard Modal */}
      <Modal
        isOpen={isOffboardingModalOpen}
        onClose={() => setIsOffboardingModalOpen(false)}
        title="Offboarding Wizard"
        size="lg"
      >
        <div className="space-y-4">
          <div>
            <label className="block text-slate-700 mb-2">Select Employee</label>
            <select className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500">
              <option value="">Choose an employee...</option>
              <option value="emp001">Sarah Johnson - EMP001</option>
              <option value="emp002">James Martinez - EMP002</option>
            </select>
          </div>

          <div>
            <label className="block text-slate-700 mb-2">Type</label>
            <div className="flex gap-4">
              <label className="flex items-center gap-2">
                <input
                  type="radio"
                  name="type"
                  value="Resignation"
                  checked={offboardingForm.type === 'Resignation'}
                  onChange={(e) => setOffboardingForm({ ...offboardingForm, type: e.target.value as 'Resignation' })}
                  className="text-blue-600"
                />
                <span>Resignation</span>
              </label>
              <label className="flex items-center gap-2">
                <input
                  type="radio"
                  name="type"
                  value="Termination"
                  checked={offboardingForm.type === 'Termination'}
                  onChange={(e) => setOffboardingForm({ ...offboardingForm, type: e.target.value as 'Termination' })}
                  className="text-blue-600"
                />
                <span>Termination</span>
              </label>
            </div>
          </div>

          <div>
            <label className="block text-slate-700 mb-2">Last Working Day</label>
            <input
              type="date"
              value={offboardingForm.lastWorkingDay}
              onChange={(e) => setOffboardingForm({ ...offboardingForm, lastWorkingDay: e.target.value })}
              className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div>
            <label className="block text-slate-700 mb-2">Reason/Notes</label>
            <textarea
              value={offboardingForm.reason}
              onChange={(e) => setOffboardingForm({ ...offboardingForm, reason: e.target.value })}
              rows={3}
              className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Enter reason for separation..."
            />
          </div>

          <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
            <h4 className="text-slate-900 mb-2">Offboarding Checklist</h4>
            <ul className="space-y-1 text-slate-700">
              <li>• Asset recovery (laptop, access cards, etc.)</li>
              <li>• Access revocation (email, systems, buildings)</li>
              <li>• Exit interview scheduling</li>
              <li>• Final payroll processing</li>
            </ul>
          </div>

          <div className="flex justify-end gap-3 mt-6">
            <button
              onClick={() => setIsOffboardingModalOpen(false)}
              className="px-4 py-2 border border-slate-300 text-slate-700 rounded-lg hover:bg-slate-50 transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handleSubmitOffboarding}
              className="px-4 py-2 bg-slate-900 text-white rounded-lg hover:bg-slate-800 transition-colors"
            >
              Start Offboarding Process
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
}