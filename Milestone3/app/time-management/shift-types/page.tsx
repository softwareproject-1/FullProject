'use client'

import { useState, useEffect } from 'react';
import { Card } from '../../../components/Card';
import { Modal } from '../../../components/Modal';
import { StatusBadge } from '../../../components/StatusBadge';
import { timeManagementApi } from '../../../lib/api';
import { handleTimeManagementError, extractArrayData } from '../../../lib/time-management-utils';
import { Edit2, Plus, XCircle } from 'lucide-react';

export default function ShiftTypesPage() {
  const [loading, setLoading] = useState(false);
  const [shiftTypes, setShiftTypes] = useState<any[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedItem, setSelectedItem] = useState<any>(null);
  const [formData, setFormData] = useState<any>({});

  useEffect(() => {
    loadShiftTypes();
  }, []);

  const loadShiftTypes = async () => {
    setLoading(true);
    try {
      const response = await timeManagementApi.getShiftTypes();
      console.log('Shift Types API Response:', response);
      console.log('Response data:', response.data);
      
      let shiftTypesData = response.data;
      
      if (!Array.isArray(shiftTypesData)) {
        if (shiftTypesData && Array.isArray(shiftTypesData.data)) {
          shiftTypesData = shiftTypesData.data;
        } else if (shiftTypesData && Array.isArray(shiftTypesData.shiftTypes)) {
          shiftTypesData = shiftTypesData.shiftTypes;
        } else {
          console.warn('Shift types data is not an array:', shiftTypesData);
          shiftTypesData = [];
        }
      }
      
      console.log('Final shift types data:', shiftTypesData);
      setShiftTypes(Array.isArray(shiftTypesData) ? shiftTypesData : []);
    } catch (error: any) {
      console.error('Error loading shift types:', error);
      console.error('Error response:', error.response);
      setShiftTypes([]);
      handleTimeManagementError(error, 'loading shift types');
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = async () => {
    try {
      setLoading(true);
      await timeManagementApi.createShiftType(formData);
      setIsModalOpen(false);
      setFormData({});
      loadShiftTypes();
    } catch (error: any) {
      handleTimeManagementError(error, 'creating shift type');
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
      await timeManagementApi.updateShiftType(selectedItem._id || selectedItem.id, cleanData);
      setIsModalOpen(false);
      setSelectedItem(null);
      setFormData({});
      loadShiftTypes();
    } catch (error: any) {
      handleTimeManagementError(error, 'updating shift type');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this shift type?')) return;
    try {
      setLoading(true);
      await timeManagementApi.deleteShiftType(id);
      loadShiftTypes();
    } catch (error: any) {
      handleTimeManagementError(error, 'deleting shift type');
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
        active: item.active !== undefined ? item.active : true,
      };
      setFormData(cleanItem);
    } else {
      setFormData({ active: true });
    }
    setIsModalOpen(true);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-slate-900 mb-2">Shift Types</h1>
          <p className="text-slate-600">Define shift type categories</p>
        </div>
        <button
          onClick={() => openModal()}
          className="px-4 py-2 bg-slate-900 text-white rounded-lg hover:bg-slate-800 flex items-center gap-2"
        >
          <Plus className="w-4 h-4" />
          Create Shift Type
        </button>
      </div>

      {loading && shiftTypes.length === 0 ? (
        <div className="text-center py-12">Loading...</div>
      ) : (
        <Card title="Shift Types">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-slate-50 border-b border-slate-200">
                <tr>
                  <th className="px-6 py-3 text-left text-slate-700">Name</th>
                  <th className="px-6 py-3 text-left text-slate-700">Status</th>
                  <th className="px-6 py-3 text-left text-slate-700">Actions</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-slate-200">
                {Array.isArray(shiftTypes) && shiftTypes.length > 0 ? (
                  shiftTypes.map((type) => (
                    <tr key={type._id || type.id}>
                      <td className="px-6 py-4">{type.name}</td>
                      <td className="px-6 py-4">
                        <StatusBadge status={type.active ? 'Active' : 'Inactive'} />
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex gap-2">
                          <button
                            onClick={() => openModal(type)}
                            className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg"
                          >
                            <Edit2 className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleDelete(type._id || type.id)}
                            className="p-2 text-red-600 hover:bg-red-50 rounded-lg"
                          >
                            <XCircle className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={3} className="px-6 py-8 text-center text-slate-500">
                      {loading ? 'Loading...' : 'No shift types found. Create your first shift type to get started.'}
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
        title={selectedItem ? 'Edit Shift Type' : 'Create Shift Type'}
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
              placeholder="e.g., Morning Shift"
            />
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

