'use client'

import { useState, useEffect } from 'react';
import { Card } from '../../../components/Card';
import { Modal } from '../../../components/Modal';
import { StatusBadge } from '../../../components/StatusBadge';
import { timeManagementApi } from '../../../lib/api';
import { handleTimeManagementError } from '../../../lib/time-management-utils';
import { Edit2, Plus, XCircle } from 'lucide-react';

export default function ScheduleRulesPage() {
  const [loading, setLoading] = useState(false);
  const [scheduleRules, setScheduleRules] = useState<any[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedItem, setSelectedItem] = useState<any>(null);
  const [formData, setFormData] = useState<any>({});

  useEffect(() => {
    loadScheduleRules();
  }, []);

  const loadScheduleRules = async () => {
    setLoading(true);
    try {
      const response = await timeManagementApi.getScheduleRules();
      setScheduleRules(response.data || []);
    } catch (error: any) {
      console.error('Error loading schedule rules:', error);
      setScheduleRules([]);
      handleTimeManagementError(error, 'loading schedule rules');
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = async () => {
    try {
      setLoading(true);
      await timeManagementApi.createScheduleRule(formData);
      setIsModalOpen(false);
      setFormData({});
      loadScheduleRules();
    } catch (error: any) {
      handleTimeManagementError(error, 'creating schedule rule');
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
      await timeManagementApi.updateScheduleRule(selectedItem._id || selectedItem.id, cleanData);
      setIsModalOpen(false);
      setSelectedItem(null);
      setFormData({});
      loadScheduleRules();
    } catch (error: any) {
      handleTimeManagementError(error, 'updating schedule rule');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this schedule rule?')) return;
    try {
      setLoading(true);
      await timeManagementApi.deleteScheduleRule(id);
      loadScheduleRules();
    } catch (error: any) {
      handleTimeManagementError(error, 'deleting schedule rule');
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
        pattern: item.pattern || '',
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
          <h1 className="text-slate-900 mb-2">Schedule Rules</h1>
          <p className="text-slate-600">Configure scheduling patterns and rules</p>
        </div>
        <button
          onClick={() => openModal()}
          className="px-4 py-2 bg-slate-900 text-white rounded-lg hover:bg-slate-800 flex items-center gap-2"
        >
          <Plus className="w-4 h-4" />
          Create Schedule Rule
        </button>
      </div>

      {loading && scheduleRules.length === 0 ? (
        <div className="text-center py-12">Loading...</div>
      ) : (
        <Card title="Schedule Rules">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-slate-50 border-b border-slate-200">
                <tr>
                  <th className="px-6 py-3 text-left text-slate-700">Name</th>
                  <th className="px-6 py-3 text-left text-slate-700">Pattern</th>
                  <th className="px-6 py-3 text-left text-slate-700">Status</th>
                  <th className="px-6 py-3 text-left text-slate-700">Actions</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-slate-200">
                {scheduleRules.map((rule) => (
                  <tr key={rule._id || rule.id}>
                    <td className="px-6 py-4">{rule.name || rule.ruleName || 'N/A'}</td>
                    <td className="px-6 py-4">{rule.pattern || 'N/A'}</td>
                    <td className="px-6 py-4">
                      <StatusBadge status={rule.active ? 'Active' : 'Inactive'} />
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
        title={selectedItem ? 'Edit Schedule Rule' : 'Create Schedule Rule'}
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
              placeholder="e.g., Monday to Friday"
            />
          </div>
          <div>
            <label className="block text-slate-700 mb-2">Pattern</label>
            <input
              type="text"
              value={formData.pattern || ''}
              onChange={(e) => setFormData({ ...formData, pattern: e.target.value })}
              className="w-full px-4 py-2 border border-slate-300 rounded-lg"
              placeholder="e.g., MON-FRI"
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

