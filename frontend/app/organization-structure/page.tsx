'use client'

import { useState } from 'react';
import { Card } from '../../components/Card';
import { DataTable } from '../../components/DataTable';
import { StatusBadge } from '../../components/StatusBadge';
import { Modal } from '../../components/Modal';
import { Network, Building2, Users, Ban, MoveHorizontal } from 'lucide-react';
import { mockDepartments, mockPositions } from '../../lib/api';
import type { Position } from '../../lib/types';

export default function OrgStructure() {
  const [currentView, setCurrentView] = useState<'tree' | 'positions'>('tree');
  const [selectedPosition, setSelectedPosition] = useState<Position | null>(null);
  const [actionModal, setActionModal] = useState<'deactivate' | 'move' | null>(null);

  const handleDeactivate = () => {
    console.log('Deactivating position:', selectedPosition?.id);
    setActionModal(null);
    setSelectedPosition(null);
  };

  const handleMove = () => {
    console.log('Moving position:', selectedPosition?.id);
    setActionModal(null);
    setSelectedPosition(null);
  };

  const positionColumns = [
    { header: 'Title', accessor: 'title' as const },
    { header: 'Department', accessor: 'departmentName' as const },
    { header: 'Pay Grade', accessor: 'payGrade' as const },
    { header: 'Reports To', accessor: 'reportingTo' as const },
    {
      header: 'Status',
      accessor: (row: Position) => <StatusBadge status={row.status} />,
    },
    {
      header: 'Actions',
      accessor: (row: Position) => (
        <div className="flex gap-2">
          <button
            onClick={(e) => {
              e.stopPropagation();
              setSelectedPosition(row);
              setActionModal('move');
            }}
            className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
            title="Move Position"
          >
            <MoveHorizontal className="w-4 h-4" />
          </button>
          {row.status === 'Active' && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                setSelectedPosition(row);
                setActionModal('deactivate');
              }}
              className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
              title="Deactivate Position"
            >
              <Ban className="w-4 h-4" />
            </button>
          )}
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-slate-900 mb-2">Organization Structure</h1>
          <p className="text-slate-600">Manage departments, positions, and hierarchy</p>
        </div>
        
        <div className="flex gap-2">
          <button
            onClick={() => setCurrentView('tree')}
            className={`px-4 py-2 rounded-lg transition-colors ${
              currentView === 'tree'
                ? 'bg-slate-900 text-white'
                : 'bg-white text-slate-700 border border-slate-300 hover:bg-slate-50'
            }`}
          >
            <Network className="w-4 h-4 inline mr-2" />
            Org Tree
          </button>
          <button
            onClick={() => setCurrentView('positions')}
            className={`px-4 py-2 rounded-lg transition-colors ${
              currentView === 'positions'
                ? 'bg-slate-900 text-white'
                : 'bg-white text-slate-700 border border-slate-300 hover:bg-slate-50'
            }`}
          >
            <Users className="w-4 h-4 inline mr-2" />
            Positions
          </button>
        </div>
      </div>

      {currentView === 'tree' ? (
        <div className="space-y-6">
          <Card title="Department Hierarchy">
            <div className="space-y-4">
              {mockDepartments.map((dept, index) => (
                <div
                  key={dept.id}
                  className="p-4 border border-slate-200 rounded-lg hover:border-blue-500 hover:bg-blue-50 transition-colors cursor-pointer"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-slate-100 rounded-lg">
                        <Building2 className="w-5 h-5 text-slate-600" />
                      </div>
                      <div>
                        <h3 className="text-slate-900">{dept.name}</h3>
                        <p className="text-slate-600">{dept.employeeCount} employees</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-slate-600">Manager ID</p>
                      <p className="text-slate-900">{dept.managerId}</p>
                    </div>
                  </div>
                  
                  {/* Show positions under this department */}
                  <div className="mt-4 pl-8 space-y-2">
                    {mockPositions
                      .filter((pos) => pos.departmentId === dept.id)
                      .map((pos) => (
                        <div
                          key={pos.id}
                          className="flex items-center justify-between p-3 bg-white border border-slate-100 rounded-lg"
                        >
                          <div>
                            <p className="text-slate-900">{pos.title}</p>
                            <p className="text-xs text-slate-500">
                              Reports to: {pos.reportingTo || 'N/A'}
                            </p>
                          </div>
                          <StatusBadge status={pos.status} />
                        </div>
                      ))}
                  </div>
                </div>
              ))}
            </div>
          </Card>
        </div>
      ) : (
        <Card
          title={`Position Management (${mockPositions.length})`}
          action={
            <button className="px-4 py-2 bg-slate-900 text-white rounded-lg hover:bg-slate-800 transition-colors">
              Add Position
            </button>
          }
        >
          <DataTable data={mockPositions} columns={positionColumns} />
        </Card>
      )}

      {/* Deactivate Modal */}
      <Modal
        isOpen={actionModal === 'deactivate'}
        onClose={() => {
          setActionModal(null);
          setSelectedPosition(null);
        }}
        title="Deactivate Position"
        size="sm"
      >
        <div className="space-y-4">
          <div className="p-4 bg-amber-50 border border-amber-200 rounded-lg">
            <p className="text-amber-800">
              This will <strong>delimit</strong> the position history, not delete it. The position will be marked as inactive.
            </p>
          </div>
          
          <div className="p-4 bg-slate-50 rounded-lg">
            <p className="text-slate-600 mb-2">Position Details:</p>
            <p className="text-slate-900">{selectedPosition?.title}</p>
            <p className="text-slate-600">{selectedPosition?.departmentName}</p>
          </div>
          
          <div className="flex justify-end gap-3">
            <button
              onClick={() => {
                setActionModal(null);
                setSelectedPosition(null);
              }}
              className="px-4 py-2 border border-slate-300 text-slate-700 rounded-lg hover:bg-slate-50 transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handleDeactivate}
              className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
            >
              Deactivate Position
            </button>
          </div>
        </div>
      </Modal>

      {/* Move Position Modal */}
      <Modal
        isOpen={actionModal === 'move'}
        onClose={() => {
          setActionModal(null);
          setSelectedPosition(null);
        }}
        title="Move Position"
        size="sm"
      >
        <div className="space-y-4">
          <div className="p-4 bg-slate-50 rounded-lg">
            <p className="text-slate-600 mb-2">Current Position:</p>
            <p className="text-slate-900">{selectedPosition?.title}</p>
            <p className="text-slate-600">{selectedPosition?.departmentName}</p>
          </div>
          
          <div>
            <label className="block text-slate-700 mb-2">New Reporting Line</label>
            <select className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500">
              <option value="">Select new reporting position...</option>
              {mockPositions
                .filter((pos) => pos.id !== selectedPosition?.id)
                .map((pos) => (
                  <option key={pos.id} value={pos.id}>
                    {pos.title} - {pos.departmentName}
                  </option>
                ))}
            </select>
          </div>
          
          <div className="flex justify-end gap-3">
            <button
              onClick={() => {
                setActionModal(null);
                setSelectedPosition(null);
              }}
              className="px-4 py-2 border border-slate-300 text-slate-700 rounded-lg hover:bg-slate-50 transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handleMove}
              className="px-4 py-2 bg-slate-900 text-white rounded-lg hover:bg-slate-800 transition-colors"
            >
              Move Position
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
}