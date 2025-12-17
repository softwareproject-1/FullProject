'use client'

import { useState, useEffect } from 'react';
import { Card } from '../../../components/Card';
import { Modal } from '../../../components/Modal';
import { StatusBadge } from '../../../components/StatusBadge';
import { timeManagementApi } from '../../../lib/api';
import { handleTimeManagementError, extractArrayData } from '../../../lib/time-management-utils';
import { Edit2, Plus, XCircle } from 'lucide-react';

export default function ShiftsPage() {
  const [loading, setLoading] = useState(false);
  const [shifts, setShifts] = useState<any[]>([]);
  const [shiftTypes, setShiftTypes] = useState<any[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedItem, setSelectedItem] = useState<any>(null);
  const [formData, setFormData] = useState<any>({});

  useEffect(() => {
    loadShifts();
    loadShiftTypes();
  }, []);

  const loadShifts = async () => {
    setLoading(true);
    try {
      const response = await timeManagementApi.getShifts();
      console.log('Shifts API Response:', response);
      console.log('Response data:', response.data);
      
      // Handle different response structures
      let shiftsData = response.data;
      
      // If response.data is not an array, check if it's wrapped in another property
      if (!Array.isArray(shiftsData)) {
        if (shiftsData && Array.isArray(shiftsData.data)) {
          shiftsData = shiftsData.data;
        } else if (shiftsData && Array.isArray(shiftsData.shifts)) {
          shiftsData = shiftsData.shifts;
        } else if (shiftsData && typeof shiftsData === 'object') {
          // If it's an object, try to find an array property
          const arrayKey = Object.keys(shiftsData).find(key => Array.isArray(shiftsData[key]));
          if (arrayKey) {
            shiftsData = shiftsData[arrayKey];
          } else {
            console.warn('Shifts data is not an array:', shiftsData);
            shiftsData = [];
          }
        } else {
          console.warn('Shifts data is not an array:', shiftsData);
          shiftsData = [];
        }
      }
      
      console.log('Final shifts data:', shiftsData);
      setShifts(Array.isArray(shiftsData) ? shiftsData : []);
    } catch (error: any) {
      console.error('Error loading shifts:', error);
      console.error('Error response:', error.response);
      setShifts([]); // Ensure it's always an array even on error
      
      handleTimeManagementError(error, 'loading shifts');
    } finally {
      setLoading(false);
    }
  };

  const loadShiftTypes = async () => {
    try {
      const response = await timeManagementApi.getShiftTypes();
      console.log('Shift Types API Response:', response);
      
      let shiftTypesData = response.data;
      
      if (!Array.isArray(shiftTypesData)) {
        if (shiftTypesData && Array.isArray(shiftTypesData.data)) {
          shiftTypesData = shiftTypesData.data;
        } else if (shiftTypesData && Array.isArray(shiftTypesData.shiftTypes)) {
          shiftTypesData = shiftTypesData.shiftTypes;
        } else {
          shiftTypesData = [];
        }
      }
      
      setShiftTypes(Array.isArray(shiftTypesData) ? shiftTypesData : []);
    } catch (error: any) {
      console.error('Error loading shift types:', error);
      setShiftTypes([]);
    }
  };

  const handleCreate = async () => {
    try {
      setLoading(true);
      await timeManagementApi.createShift(formData);
      setIsModalOpen(false);
      setFormData({});
      loadShifts();
    } catch (error: any) {
      handleTimeManagementError(error, 'creating shift');
    } finally {
      setLoading(false);
    }
  };

  const handleUpdate = async () => {
    if (!selectedItem) return;
    try {
      setLoading(true);
      // Clean the form data - remove MongoDB internal fields
      const cleanData: any = { ...formData };
      Object.keys(cleanData).forEach(key => {
        if (key === '_id' || key === '__v' || key === 'id' || key.startsWith('_') || 
            key === 'createdAt' || key === 'updatedAt') {
          delete cleanData[key];
        }
      });
      // Handle shiftType if it's an object (populated)
      if (cleanData.shiftType && typeof cleanData.shiftType === 'object') {
        cleanData.shiftType = cleanData.shiftType._id || cleanData.shiftType.id || cleanData.shiftType;
      }
      await timeManagementApi.updateShift(selectedItem._id || selectedItem.id, cleanData);
      setIsModalOpen(false);
      setSelectedItem(null);
      setFormData({});
      loadShifts();
    } catch (error: any) {
      handleTimeManagementError(error, 'updating shift');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this shift?')) return;
    try {
      setLoading(true);
      await timeManagementApi.deleteShift(id);
      loadShifts();
    } catch (error: any) {
      handleTimeManagementError(error, 'deleting shift');
    } finally {
      setLoading(false);
    }
  };

  const openModal = (item?: any) => {
    setSelectedItem(item || null);
    if (item) {
      // Clean the item data - remove MongoDB internal fields but keep the editable fields
      const cleanItem: any = {
        name: item.name || '',
        shiftType: item.shiftType?._id || item.shiftType?.id || item.shiftType || '',
        startTime: item.startTime || '',
        endTime: item.endTime || '',
        active: item.active !== undefined ? item.active : true,
        punchPolicy: item.punchPolicy || 'FIRST_LAST',
        graceInMinutes: item.graceInMinutes || 0,
        graceOutMinutes: item.graceOutMinutes || 0,
        requiresApprovalForOvertime: item.requiresApprovalForOvertime || false,
      };
      setFormData(cleanItem);
    } else {
      setFormData({ active: true, punchPolicy: 'FIRST_LAST' });
    }
    setIsModalOpen(true);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-slate-900 mb-2">Shifts</h1>
          <p className="text-slate-600">Manage shift templates and configurations</p>
        </div>
        <button
          onClick={() => openModal()}
          className="px-4 py-2 bg-slate-900 text-white rounded-lg hover:bg-slate-800 flex items-center gap-2"
        >
          <Plus className="w-4 h-4" />
          Create Shift
        </button>
      </div>

      {loading && shifts.length === 0 ? (
        <div className="text-center py-12">Loading...</div>
      ) : (
        <Card title="Shifts">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-slate-50 border-b border-slate-200">
                <tr>
                  <th className="px-6 py-3 text-left text-slate-700">Name</th>
                  <th className="px-6 py-3 text-left text-slate-700">Shift Type</th>
                  <th className="px-6 py-3 text-left text-slate-700">Time</th>
                  <th className="px-6 py-3 text-left text-slate-700">Status</th>
                  <th className="px-6 py-3 text-left text-slate-700">Punch Policy</th>
                  <th className="px-6 py-3 text-left text-slate-700">Actions</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-slate-200">
                {Array.isArray(shifts) && shifts.length > 0 ? (
                  shifts.map((shift) => {
                    const punchPolicy = shift.punchPolicy || 'FIRST_LAST';
                    const punchPolicyDisplay = punchPolicy === 'MULTIPLE' 
                      ? 'Multiple' 
                      : 'First-In/Last-Out';
                    
                    return (
                      <tr key={shift._id || shift.id}>
                        <td className="px-6 py-4">{shift.name}</td>
                        <td className="px-6 py-4">{shift.shiftType?.name || 'N/A'}</td>
                        <td className="px-6 py-4">{shift.startTime} - {shift.endTime}</td>
                        <td className="px-6 py-4">
                          <StatusBadge status={shift.active ? 'Active' : 'Inactive'} />
                        </td>
                        <td className="px-6 py-4">{punchPolicyDisplay}</td>
                        <td className="px-6 py-4">
                          <div className="flex gap-2">
                            <button
                              onClick={() => openModal(shift)}
                              className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg"
                            >
                              <Edit2 className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => handleDelete(shift._id || shift.id)}
                              className="p-2 text-red-600 hover:bg-red-50 rounded-lg"
                            >
                              <XCircle className="w-4 h-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })
                ) : (
                  <tr>
                    <td colSpan={6} className="px-6 py-8 text-center text-slate-500">
                      {loading ? 'Loading...' : 'No shifts found. Create your first shift to get started.'}
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </Card>
      )}

      <Modal
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false);
          setSelectedItem(null);
          setFormData({});
        }}
        title={selectedItem ? 'Edit Shift' : 'Create Shift'}
        size="md"
      >
        <div className="space-y-4">
          <div>
            <label className="block text-slate-700 mb-2">Name</label>
            <input
              type="text"
              value={formData.name || ''}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              className="w-full px-4 py-2 border border-slate-300 rounded-lg"
              placeholder="e.g., Morning 8-4"
            />
          </div>
          <div>
            <label className="block text-slate-700 mb-2">Shift Type</label>
            <select
              value={formData.shiftType || ''}
              onChange={(e) => setFormData({ ...formData, shiftType: e.target.value })}
              className="w-full px-4 py-2 border border-slate-300 rounded-lg"
            >
              <option value="">Select Shift Type</option>
              {Array.isArray(shiftTypes) && shiftTypes.map((type) => (
                <option key={type._id || type.id} value={type._id || type.id}>
                  {type.name}
                </option>
              ))}
            </select>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-slate-700 mb-2">Start Time</label>
              <input
                type="time"
                value={formData.startTime || ''}
                onChange={(e) => setFormData({ ...formData, startTime: e.target.value })}
                className="w-full px-4 py-2 border border-slate-300 rounded-lg"
              />
            </div>
            <div>
              <label className="block text-slate-700 mb-2">End Time</label>
              <input
                type="time"
                value={formData.endTime || ''}
                onChange={(e) => setFormData({ ...formData, endTime: e.target.value })}
                className="w-full px-4 py-2 border border-slate-300 rounded-lg"
              />
            </div>
          </div>
          <div>
            <label className="block text-slate-700 mb-2">Punch Policy</label>
            <select
              value={formData.punchPolicy || 'FIRST_LAST'}
              onChange={(e) => setFormData({ ...formData, punchPolicy: e.target.value })}
              className="w-full px-4 py-2 border border-slate-300 rounded-lg"
            >
              <option value="MULTIPLE">Multiple (Allow all clock-ins/outs)</option>
              <option value="FIRST_LAST">First-In/Last-Out (Keep only first IN and last OUT)</option>
            </select>
            <p className="text-sm text-slate-500 mt-1">
              {formData.punchPolicy === 'MULTIPLE' 
                ? 'Employees can clock in/out multiple times per day' 
                : 'Only the first clock-in and last clock-out will be recorded'}
            </p>
          </div>
          <div>
            <label className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={formData.active !== false}
                onChange={(e) => setFormData({ ...formData, active: e.target.checked })}
              />
              <span className="text-slate-700">Active</span>
            </label>
          </div>
          <div className="flex justify-end gap-3">
            <button
              onClick={() => setIsModalOpen(false)}
              className="px-4 py-2 border border-slate-300 text-slate-700 rounded-lg hover:bg-slate-50"
            >
              Cancel
            </button>
            <button
              onClick={selectedItem ? handleUpdate : handleCreate}
              disabled={loading}
              className="px-4 py-2 bg-slate-900 text-white rounded-lg hover:bg-slate-800 disabled:opacity-50"
            >
              {loading ? 'Saving...' : selectedItem ? 'Update' : 'Create'}
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
