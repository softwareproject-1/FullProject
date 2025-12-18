'use client'

import { useState } from 'react';
import { offboardingApi } from '../../../services/api';
import { ClearanceChecklist, ApprovalStatus } from '../../../lib/types';
import { 
  CheckCircle2, 
  XCircle, 
  Clock, 
  Building2, 
  Package, 
  CreditCard,
  Plus,
  Trash2,
} from 'lucide-react';

interface ClearanceChecklistViewProps {
  checklist: ClearanceChecklist;
  userId: string;
  onUpdate: () => void;
  onError: (message: string) => void;
}

export function ClearanceChecklistView({
  checklist,
  userId,
  onUpdate,
  onError,
}: ClearanceChecklistViewProps) {
  const [newEquipmentName, setNewEquipmentName] = useState('');

  // Calculate progress
  const totalDepartments = checklist.items.length;
  const approvedDepartments = checklist.items.filter(item => item.status === ApprovalStatus.APPROVED).length;
  const totalEquipment = checklist.equipmentList.length;
  const returnedEquipment = checklist.equipmentList.filter(item => item.returned).length;
  const progressPercentage = totalDepartments > 0 
    ? Math.round((approvedDepartments / totalDepartments) * 100) 
    : 0;
  const equipmentPercentage = totalEquipment > 0
    ? Math.round((returnedEquipment / totalEquipment) * 100)
    : 0;

  // Handle department sign-off
  const handleSignOff = async (department: string, status: ApprovalStatus) => {
    try {
      await offboardingApi.clearance.departmentSignOff(checklist._id, userId, {
        department,
        status,
        comments: undefined,
      });
      onUpdate();
    } catch (err: any) {
      onError(err.response?.data?.message || 'Failed to update sign-off');
    }
  };

  // Handle equipment return
  const handleEquipmentReturn = async (equipmentId: string, returned: boolean) => {
    try {
      await offboardingApi.clearance.updateEquipmentReturn(checklist._id, {
        equipmentId,
        returned,
        condition: returned ? 'Good' : undefined,
      });
      onUpdate();
    } catch (err: any) {
      onError(err.response?.data?.message || 'Failed to update equipment status');
    }
  };

  // Handle add equipment
  const handleAddEquipment = async () => {
    if (!newEquipmentName.trim()) return;
    
    try {
      await offboardingApi.clearance.addEquipment(checklist._id, {
        name: newEquipmentName.trim(),
      });
      setNewEquipmentName('');
      onUpdate();
    } catch (err: any) {
      onError(err.response?.data?.message || 'Failed to add equipment');
    }
  };

  // Handle access card return
  const handleAccessCardReturn = async (returned: boolean) => {
    try {
      await offboardingApi.clearance.updateAccessCardReturn(checklist._id, {
        returned: returned,
      });
      onUpdate();
    } catch (err: any) {
      onError(err.response?.data?.message || 'Failed to update access card status');
    }
  };

  return (
    <div className="space-y-6">
      {/* Clearance Progress */}
      <div className="bg-white border border-slate-200 rounded-lg p-4">
        <h4 className="font-semibold text-slate-900 mb-3">Clearance Progress</h4>
        <div className="w-full bg-slate-200 rounded-full h-3">
          <div
            className={`h-3 rounded-full transition-all ${
              progressPercentage === 100
                ? 'bg-green-600'
                : progressPercentage >= 50
                ? 'bg-blue-600'
                : 'bg-yellow-500'
            }`}
            style={{ width: `${progressPercentage}%` }}
          />
        </div>
        <div className="flex justify-between mt-2 text-sm">
          <span className="text-slate-600">{approvedDepartments} of {totalDepartments} departments cleared</span>
          <span className="font-semibold text-slate-900">{progressPercentage}%</span>
        </div>
      </div>

      {/* Department Exit Clearances - OFF-010 */}
      <div className="bg-white border border-slate-200 rounded-lg p-4">
        <h4 className="font-semibold text-slate-900 mb-4">Department Exit Clearances</h4>
        <div className="space-y-2">
          {checklist.items.map((item, index) => (
            <div 
              key={index}
              className="flex items-center justify-between p-3 border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors"
            >
              <div className="flex items-center gap-3">
                <div className={`w-2 h-2 rounded-full ${
                  item.status === ApprovalStatus.APPROVED ? 'bg-green-500' :
                  item.status === ApprovalStatus.REJECTED ? 'bg-red-500' :
                  'bg-yellow-500'
                }`} />
                <span className="font-medium text-slate-900">{item.department}</span>
              </div>
              
              {item.status === ApprovalStatus.PENDING ? (
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => handleSignOff(item.department, ApprovalStatus.APPROVED)}
                    className="px-4 py-1.5 bg-green-600 text-white text-sm font-medium rounded hover:bg-green-700 transition-colors"
                  >
                    Approve
                  </button>
                  <button
                    onClick={() => handleSignOff(item.department, ApprovalStatus.REJECTED)}
                    className="px-4 py-1.5 bg-red-600 text-white text-sm font-medium rounded hover:bg-red-700 transition-colors"
                  >
                    Reject
                  </button>
                </div>
              ) : (
                <span className={`px-3 py-1 text-xs font-medium rounded ${
                  item.status === ApprovalStatus.APPROVED
                    ? 'bg-green-100 text-green-700'
                    : 'bg-red-100 text-red-700'
                }`}>
                  {item.status === ApprovalStatus.APPROVED ? 'Approved' : 'Rejected'}
                </span>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Asset Recovery Checklist - OFF-006 */}
      <div className="bg-white border border-slate-200 rounded-lg p-4">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h4 className="font-semibold text-slate-900">Asset Recovery Checklist</h4>
            <p className="text-sm text-slate-500 mt-1">
              {totalEquipment > 0 ? `${returnedEquipment} of ${totalEquipment} items returned` : 'No equipment added yet'}
            </p>
          </div>
          <span className="text-2xl font-bold text-blue-600">
            {equipmentPercentage}%
          </span>
        </div>
        
        <div className="mb-4">
          <h5 className="font-medium text-slate-900 mb-2">IT Assets & Equipment</h5>
          <p className="text-sm text-slate-500 mb-3">
            {totalEquipment === 0 ? 'No equipment added yet' : 'Equipment ID tracking is optional and managed internally'}
          </p>
        </div>

        {/* Add Equipment Input */}
        <div className="mb-4">
          <label className="block text-sm font-medium text-slate-700 mb-2">Add Equipment</label>
          <div className="flex gap-2">
            <input
              type="text"
              value={newEquipmentName}
              onChange={(e) => setNewEquipmentName(e.target.value)}
              onKeyPress={(e) => {
                if (e.key === 'Enter' && newEquipmentName.trim()) {
                  handleAddEquipment();
                }
              }}
              placeholder="Equipment name (e.g., Laptop, Monitor, Keys...)"
              className="flex-1 px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
            />
            <button
              onClick={handleAddEquipment}
              disabled={!newEquipmentName.trim()}
              className="px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 disabled:bg-slate-300 disabled:cursor-not-allowed transition-colors"
            >
              Add
            </button>
          </div>
        </div>

        {/* Equipment List */}
        {checklist.equipmentList.length > 0 && (
          <div className="space-y-2">
            {checklist.equipmentList.map((item, index) => (
              <div 
                key={item.equipmentId || index}
                className={`flex items-center justify-between p-3 border rounded-lg ${
                  item.returned ? 'bg-green-50 border-green-200' : 'bg-slate-50 border-slate-200'
                }`}
              >
                <div className="flex items-center gap-3">
                  <input
                    type="checkbox"
                    checked={item.returned}
                    onChange={(e) => handleEquipmentReturn(
                      item.equipmentId || `item-${index}`,
                      e.target.checked
                    )}
                    className="w-5 h-5 text-green-600 border-slate-300 rounded focus:ring-green-500"
                  />
                  <div>
                    <p className={`font-medium text-sm ${
                      item.returned ? 'text-green-700 line-through' : 'text-slate-900'
                    }`}>
                      {item.name}
                    </p>
                    {item.condition && (
                      <p className="text-xs text-slate-500">Condition: {item.condition}</p>
                    )}
                  </div>
                </div>
                {item.returned && <CheckCircle2 className="w-5 h-5 text-green-600" />}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Access Card / ID Badge */}
      <div className="bg-white border border-slate-200 rounded-lg p-4">
        <h4 className="font-semibold text-slate-900 mb-3">Access Card / ID Badge</h4>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <input
              type="checkbox"
              checked={checklist.cardReturned}
              onChange={(e) => handleAccessCardReturn(e.target.checked)}
              className="w-5 h-5 text-blue-600 border-slate-300 rounded focus:ring-blue-500"
            />
            <span className="text-slate-700">Returned</span>
          </div>
          <span className={`px-3 py-1 text-xs font-medium rounded ${
            checklist.cardReturned
              ? 'bg-green-100 text-green-700'
              : 'bg-slate-100 text-slate-600'
          }`}>
            {checklist.cardReturned ? 'Returned' : 'Pending'}
          </span>
        </div>
      </div>

      {/* Overall Status */}
      {progressPercentage === 100 && checklist.cardReturned && returnedEquipment === totalEquipment && (
        <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
          <div className="flex items-center gap-3">
            <CheckCircle2 className="w-6 h-6 text-green-600" />
            <div>
              <p className="font-medium text-green-800">Clearance Complete</p>
              <p className="text-sm text-green-700">
                All departments have signed off, and all items have been returned.
                This case is ready for final settlement.
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
