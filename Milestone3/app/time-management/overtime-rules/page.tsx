'use client'

import { useState, useEffect } from 'react';
import { Card } from '../../../components/Card';
import { Modal } from '../../../components/Modal';
import { StatusBadge } from '../../../components/StatusBadge';
import { timeManagementApi } from '../../../lib/api';
import { handleTimeManagementError } from '../../../lib/time-management-utils';
import { Edit2, Plus, XCircle } from 'lucide-react';

export default function OvertimeRulesPage() {
  const [loading, setLoading] = useState(false);
  const [overtimeRules, setOvertimeRules] = useState<any[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedItem, setSelectedItem] = useState<any>(null);
  const [formData, setFormData] = useState<any>({});

  useEffect(() => {
    loadOvertimeRules();
  }, []);

  const loadOvertimeRules = async () => {
    setLoading(true);
    try {
      const response = await timeManagementApi.getOvertimeRules();
      setOvertimeRules(response.data || []);
    } catch (error: any) {
      console.error('Error loading overtime rules:', error);
      setOvertimeRules([]);
      handleTimeManagementError(error, 'loading overtime rules');
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = async () => {
    try {
      setLoading(true);
      await timeManagementApi.createOvertimeRule(formData);
      setIsModalOpen(false);
      setFormData({});
      loadOvertimeRules();
    } catch (error: any) {
      handleTimeManagementError(error, 'creating overtime rule');
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
      await timeManagementApi.updateOvertimeRule(selectedItem._id || selectedItem.id, cleanData);
      setIsModalOpen(false);
      setSelectedItem(null);
      setFormData({});
      loadOvertimeRules();
    } catch (error: any) {
      handleTimeManagementError(error, 'updating overtime rule');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this overtime rule?')) return;
    try {
      setLoading(true);
      await timeManagementApi.deleteOvertimeRule(id);
      loadOvertimeRules();
    } catch (error: any) {
      handleTimeManagementError(error, 'deleting overtime rule');
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
        description: item.description || '',
        active: item.active !== undefined ? item.active : true,
        approved: item.approved !== undefined ? item.approved : false,
      };
      setFormData(cleanItem);
    } else {
      setFormData({ active: true, approved: false });
    }
    setIsModalOpen(true);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-slate-900 mb-2">Overtime Rules</h1>
          <p className="text-slate-600">Configure overtime policies and rules</p>
        </div>
        <button
          onClick={() => openModal()}
          className="px-4 py-2 bg-slate-900 text-white rounded-lg hover:bg-slate-800 flex items-center gap-2"
        >
          <Plus className="w-4 h-4" />
          Create Rule
        </button>
      </div>

      {loading && overtimeRules.length === 0 ? (
        <div className="text-center py-12">Loading...</div>
      ) : (
        <Card title="Overtime Rules">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-slate-50 border-b border-slate-200">
                <tr>
                  <th className="px-6 py-3 text-left text-slate-700">Name</th>
                  <th className="px-6 py-3 text-left text-slate-700">Description</th>
                  <th className="px-6 py-3 text-left text-slate-700">Status</th>
                  <th className="px-6 py-3 text-left text-slate-700">Approved</th>
                  <th className="px-6 py-3 text-left text-slate-700">Actions</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-slate-200">
                {overtimeRules.map((rule) => (
                  <tr key={rule._id || rule.id}>
                    <td className="px-6 py-4">{rule.name || rule.ruleName || 'N/A'}</td>
                    <td className="px-6 py-4">{rule.description || 'N/A'}</td>
                    <td className="px-6 py-4">
                      <StatusBadge status={rule.active ? 'Active' : 'Inactive'} />
                    </td>
                    <td className="px-6 py-4">
                      <StatusBadge status={rule.approved ? 'Approved' : 'Not Approved'} />
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex gap-2">
                        <button
                          onClick={() => openModal(rule)}
                          className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg"
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleDelete(rule._id || rule.id)}
                          className="p-2 text-red-600 hover:bg-red-50 rounded-lg"
                        >
                          <XCircle className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
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
        title={selectedItem ? 'Edit Overtime Rule' : 'Create Overtime Rule'}
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
              placeholder="e.g., Standard Overtime"
            />
          </div>
          <div>
            <label className="block text-slate-700 mb-2">Description</label>
            <textarea
              value={formData.description || ''}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              className="w-full px-4 py-2 border border-slate-300 rounded-lg"
              rows={3}
              placeholder="e.g., Overtime applies after 8 hours"
            />
          </div>
          <div className="flex gap-4">
            <label className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={formData.active !== false}
                onChange={(e) => setFormData({ ...formData, active: e.target.checked })}
              />
              <span className="text-slate-700">Active</span>
            </label>
            <label className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={formData.approved || false}
                onChange={(e) => setFormData({ ...formData, approved: e.target.checked })}
              />
              <span className="text-slate-700">Approved</span>
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

