'use client'

import { useState } from 'react';
import { Card } from '../../components/Card';
import { DataTable } from '../../components/DataTable';
import { StatusBadge } from '../../components/StatusBadge';
import { Modal } from '../../components/Modal';
import { TrendingUp, Plus, Star, AlertCircle } from 'lucide-react';
import { mockPerformanceCycles, mockEvaluations } from '../../lib/api';
import type { PerformanceCycle, Evaluation } from '../../lib/types';

export default function Performance() {
  const [currentView, setCurrentView] = useState<'cycles' | 'evaluate' | 'employee'>('cycles');
  const [isCreateCycleOpen, setIsCreateCycleOpen] = useState(false);
  const [isDisputeOpen, setIsDisputeOpen] = useState(false);
  const [selectedEvaluation, setSelectedEvaluation] = useState<Evaluation | null>(null);
  const [evaluationForm, setEvaluationForm] = useState({
    rating: 4,
    comments: '',
  });
  const [cycleForm, setCycleForm] = useState({
    name: '',
    startDate: '',
    endDate: '',
  });

  const cycleColumns = [
    { header: 'Cycle Name', accessor: 'name' as const },
    { header: 'Start Date', accessor: 'startDate' as const },
    { header: 'End Date', accessor: 'endDate' as const },
    {
      header: 'Status',
      accessor: (row: PerformanceCycle) => <StatusBadge status={row.status} />,
    },
  ];

  const evaluationColumns = [
    { header: 'Employee', accessor: 'employeeName' as const },
    {
      header: 'Rating',
      accessor: (row: Evaluation) => (
        <div className="flex items-center gap-1">
          <Star className="w-4 h-4 text-amber-500 fill-amber-500" />
          <span className="text-slate-900">{row.rating}/5</span>
        </div>
      ),
    },
    {
      header: 'Attendance',
      accessor: (row: Evaluation) => (
        <span className="text-slate-900">{row.attendanceScore}%</span>
      ),
    },
    {
      header: 'Status',
      accessor: (row: Evaluation) => <StatusBadge status={row.status} />,
    },
    {
      header: 'Actions',
      accessor: (row: Evaluation) => (
        <button
          onClick={() => {
            setSelectedEvaluation(row);
            setCurrentView('employee');
          }}
          className="text-blue-600 hover:text-blue-700"
        >
          View Details
        </button>
      ),
    },
  ];

  const handleCreateCycle = () => {
    console.log('Creating cycle:', cycleForm);
    setIsCreateCycleOpen(false);
    setCycleForm({ name: '', startDate: '', endDate: '' });
  };

  const handleSubmitEvaluation = () => {
    console.log('Submitting evaluation:', evaluationForm);
    alert('Evaluation submitted successfully!');
  };

  const handleRaiseDispute = () => {
    console.log('Raising dispute for evaluation:', selectedEvaluation?.id);
    setIsDisputeOpen(false);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-slate-900 mb-2">Performance Management</h1>
          <p className="text-slate-600">Manage appraisal cycles and employee evaluations</p>
        </div>
        
        <div className="flex gap-2">
          <button
            onClick={() => setCurrentView('cycles')}
            className={`px-4 py-2 rounded-lg transition-colors ${
              currentView === 'cycles'
                ? 'bg-slate-900 text-white'
                : 'bg-white text-slate-700 border border-slate-300 hover:bg-slate-50'
            }`}
          >
            Cycles
          </button>
          <button
            onClick={() => setCurrentView('evaluate')}
            className={`px-4 py-2 rounded-lg transition-colors ${
              currentView === 'evaluate'
                ? 'bg-slate-900 text-white'
                : 'bg-white text-slate-700 border border-slate-300 hover:bg-slate-50'
            }`}
          >
            Evaluate
          </button>
          <button
            onClick={() => setCurrentView('employee')}
            className={`px-4 py-2 rounded-lg transition-colors ${
              currentView === 'employee'
                ? 'bg-slate-900 text-white'
                : 'bg-white text-slate-700 border border-slate-300 hover:bg-slate-50'
            }`}
          >
            My Reviews
          </button>
        </div>
      </div>

      {currentView === 'cycles' && (
        <Card
          title="Performance Cycles"
          action={
            <button
              onClick={() => setIsCreateCycleOpen(true)}
              className="px-4 py-2 bg-slate-900 text-white rounded-lg hover:bg-slate-800 transition-colors flex items-center gap-2"
            >
              <Plus className="w-4 h-4" />
              Create Cycle
            </button>
          }
        >
          <DataTable data={mockPerformanceCycles} columns={cycleColumns} />
        </Card>
      )}

      {currentView === 'evaluate' && (
        <div className="space-y-6">
          <Card title="Evaluation Interface">
            <div className="space-y-6">
              <div>
                <label className="block text-slate-700 mb-2">Select Employee</label>
                <select className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500">
                  <option value="">Choose an employee...</option>
                  {mockEvaluations.map((evaluation) => (
                    <option key={evaluation.id} value={evaluation.employeeId}>
                      {evaluation.employeeName}
                    </option>
                  ))}
                </select>
              </div>

              {/* Attendance Data Widget */}
              <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
                <h4 className="text-slate-900 mb-2 flex items-center gap-2">
                  <TrendingUp className="w-4 h-4 text-blue-600" />
                  Attendance Data Reference
                </h4>
                <div className="grid grid-cols-3 gap-4 mt-3">
                  <div>
                    <p className="text-slate-600">Total Days</p>
                    <p className="text-slate-900">20</p>
                  </div>
                  <div>
                    <p className="text-slate-600">Present</p>
                    <p className="text-green-600">19</p>
                  </div>
                  <div>
                    <p className="text-slate-600">Score</p>
                    <p className="text-slate-900">95%</p>
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-slate-700 mb-2">Performance Rating</label>
                <div className="flex items-center gap-2">
                  {[1, 2, 3, 4, 5].map((rating) => (
                    <button
                      key={rating}
                      onClick={() => setEvaluationForm({ ...evaluationForm, rating })}
                      className={`p-2 ${
                        evaluationForm.rating >= rating
                          ? 'text-amber-500'
                          : 'text-slate-300'
                      }`}
                    >
                      <Star className={`w-8 h-8 ${
                        evaluationForm.rating >= rating ? 'fill-amber-500' : ''
                      }`} />
                    </button>
                  ))}
                  <span className="ml-4 text-slate-900">{evaluationForm.rating}/5</span>
                </div>
              </div>

              <div>
                <label className="block text-slate-700 mb-2">Comments</label>
                <textarea
                  value={evaluationForm.comments}
                  onChange={(e) => setEvaluationForm({ ...evaluationForm, comments: e.target.value })}
                  rows={4}
                  className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Provide detailed feedback on the employee's performance..."
                />
              </div>

              <button
                onClick={handleSubmitEvaluation}
                className="w-full bg-slate-900 text-white px-4 py-3 rounded-lg hover:bg-slate-800 transition-colors"
              >
                Submit Evaluation
              </button>
            </div>
          </Card>
        </div>
      )}

      {currentView === 'employee' && (
        <div className="space-y-6">
          <Card title="My Performance Reviews">
            <DataTable data={mockEvaluations.slice(0, 1)} columns={evaluationColumns} />
          </Card>

          {selectedEvaluation && (
            <Card title="Review Details">
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-slate-600">Rating</p>
                    <div className="flex items-center gap-1 mt-1">
                      <Star className="w-5 h-5 text-amber-500 fill-amber-500" />
                      <span className="text-slate-900">{selectedEvaluation.rating}/5</span>
                    </div>
                  </div>
                  <div>
                    <p className="text-slate-600">Attendance Score</p>
                    <p className="text-slate-900 mt-1">{selectedEvaluation.attendanceScore}%</p>
                  </div>
                </div>

                <div>
                  <p className="text-slate-600">Manager Comments</p>
                  <p className="text-slate-900 mt-1">{selectedEvaluation.comments}</p>
                </div>

                {selectedEvaluation.status === 'Completed' && (
                  <button
                    onClick={() => setIsDisputeOpen(true)}
                    className="w-full bg-amber-600 text-white px-4 py-2 rounded-lg hover:bg-amber-700 transition-colors flex items-center justify-center gap-2"
                  >
                    <AlertCircle className="w-4 h-4" />
                    Raise Dispute
                  </button>
                )}
              </div>
            </Card>
          )}
        </div>
      )}

      {/* Create Cycle Modal */}
      <Modal
        isOpen={isCreateCycleOpen}
        onClose={() => setIsCreateCycleOpen(false)}
        title="Create Performance Cycle"
        size="md"
      >
        <div className="space-y-4">
          <div>
            <label className="block text-slate-700 mb-2">Cycle Name</label>
            <input
              type="text"
              value={cycleForm.name}
              onChange={(e) => setCycleForm({ ...cycleForm, name: e.target.value })}
              placeholder="e.g., Q1 2025 Performance Review"
              className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-slate-700 mb-2">Start Date</label>
              <input
                type="date"
                value={cycleForm.startDate}
                onChange={(e) => setCycleForm({ ...cycleForm, startDate: e.target.value })}
                className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-slate-700 mb-2">End Date</label>
              <input
                type="date"
                value={cycleForm.endDate}
                onChange={(e) => setCycleForm({ ...cycleForm, endDate: e.target.value })}
                className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>

          <div className="flex justify-end gap-3 mt-6">
            <button
              onClick={() => setIsCreateCycleOpen(false)}
              className="px-4 py-2 border border-slate-300 text-slate-700 rounded-lg hover:bg-slate-50 transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handleCreateCycle}
              className="px-4 py-2 bg-slate-900 text-white rounded-lg hover:bg-slate-800 transition-colors"
            >
              Create Cycle
            </button>
          </div>
        </div>
      </Modal>

      {/* Dispute Modal */}
      <Modal
        isOpen={isDisputeOpen}
        onClose={() => setIsDisputeOpen(false)}
        title="Raise Performance Dispute"
        size="md"
      >
        <div className="space-y-4">
          <div className="p-4 bg-amber-50 border border-amber-200 rounded-lg">
            <p className="text-amber-800">
              Please provide a detailed reason for disputing this performance review.
            </p>
          </div>

          <div>
            <label className="block text-slate-700 mb-2">Dispute Reason</label>
            <textarea
              rows={4}
              className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Explain why you disagree with this evaluation..."
            />
          </div>

          <div className="flex justify-end gap-3">
            <button
              onClick={() => setIsDisputeOpen(false)}
              className="px-4 py-2 border border-slate-300 text-slate-700 rounded-lg hover:bg-slate-50 transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handleRaiseDispute}
              className="px-4 py-2 bg-amber-600 text-white rounded-lg hover:bg-amber-700 transition-colors"
            >
              Submit Dispute
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
}