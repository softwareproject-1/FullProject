'use client'

import { useState, useEffect } from 'react';
import { Card } from '../../../components/Card';
import { Modal } from '../../../components/Modal';
import { StatusBadge } from '../../../components/StatusBadge';
import { timeManagementApi } from '../../../lib/api';
import { handleTimeManagementError } from '../../../lib/time-management-utils';
import { Edit2, Plus, XCircle } from 'lucide-react';

export default function LatenessRulesPage() {
  const [loading, setLoading] = useState(false);
  const [latenessRules, setLatenessRules] = useState<any[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedItem, setSelectedItem] = useState<any>(null);
  const [formData, setFormData] = useState<any>({});

  useEffect(() => {
    loadLatenessRules();
  }, []);

  const loadLatenessRules = async () => {
    setLoading(true);
    try {
      const response = await timeManagementApi.getLatenessRules();
      setLatenessRules(response.data || []);
    } catch (error: any) {
      console.error('Error loading lateness rules:', error);
      setLatenessRules([]);
      handleTimeManagementError(error, 'loading lateness rules');
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = async () => {
    try {
      setLoading(true);
      await timeManagementApi.createLatenessRule(formData);
      setIsModalOpen(false);
      setFormData({});
      loadLatenessRules();
    } catch (error: any) {
      handleTimeManagementError(error, 'creating lateness rule');
    } finally {
      setLoading(false);
    }
  };

  const handleUpdate = async () => {
    if (!selectedItem) return;
    try {
      setLoading(true);
      // Clean up formData: remove MongoDB internal fields and only keep valid DTO fields
      const cleanData: any = {};
      
      // Only include fields that are in the UpdateLatenessRuleDto
      if (formData.name !== undefined) cleanData.name = formData.name;
      if (formData.description !== undefined) cleanData.description = formData.description;
      if (formData.gracePeriodMinutes !== undefined) cleanData.gracePeriodMinutes = formData.gracePeriodMinutes;
      if (formData.deductionForEachMinute !== undefined) cleanData.deductionForEachMinute = formData.deductionForEachMinute;
      if (formData.active !== undefined) cleanData.active = formData.active;
      
      await timeManagementApi.updateLatenessRule(selectedItem._id || selectedItem.id, cleanData);
      setIsModalOpen(false);
      setSelectedItem(null);
      setFormData({});
      loadLatenessRules();
    } catch (error: any) {
      handleTimeManagementError(error, 'updating lateness rule');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this lateness rule?')) return;
    try {
      setLoading(true);
      await timeManagementApi.deleteLatenessRule(id);
      loadLatenessRules();
    } catch (error: any) {
      handleTimeManagementError(error, 'deleting lateness rule');
    } finally {
      setLoading(false);
    }
  };

  const openModal = (item?: any) => {
    setSelectedItem(item || null);
    if (item) {
      // Only extract the fields we need for the form, excluding MongoDB internal fields
      setFormData({
        name: item.name || '',
        description: item.description || '',
        gracePeriodMinutes: item.gracePeriodMinutes || 0,
        deductionForEachMinute: item.deductionForEachMinute || 0,
        active: item.active !== undefined ? item.active : true,
      });
    } else {
      setFormData({ active: true, gracePeriodMinutes: 0, deductionForEachMinute: 0 });
    }
    setIsModalOpen(true);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-slate-900 mb-2">Lateness Rules</h1>
          <p className="text-slate-600">Set up lateness policies and penalties</p>
        </div>
        <button
          onClick={() => openModal()}
          className="px-4 py-2 bg-slate-900 text-white rounded-lg hover:bg-slate-800 flex items-center gap-2"
        >
          <Plus className="w-4 h-4" />
          Create Rule
        </button>
      </div>

      {loading && latenessRules.length === 0 ? (
        <div className="text-center py-12">Loading...</div>
      ) : (
        <Card title="Lateness Rules">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-slate-50 border-b border-slate-200">
                <tr>
                  <th className="px-6 py-3 text-left text-slate-700">Name</th>
                  <th className="px-6 py-3 text-left text-slate-700">Grace Period</th>
                  <th className="px-6 py-3 text-left text-slate-700">Deduction/Min</th>
                  <th className="px-6 py-3 text-left text-slate-700">Status</th>
                  <th className="px-6 py-3 text-left text-slate-700">Actions</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-slate-200">
                {latenessRules.map((rule) => (
                  <tr key={rule._id || rule.id}>
                    <td className="px-6 py-4">{rule.name || rule.ruleName || 'N/A'}</td>
                    <td className="px-6 py-4">{rule.gracePeriodMinutes || 0} minutes</td>
                    <td className="px-6 py-4">{rule.deductionForEachMinute || 0}</td>
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
        title={selectedItem ? 'Edit Lateness Rule' : 'Create Lateness Rule'}
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
              placeholder="e.g., Standard Lateness Policy"
            />
          </div>
          <div>
            <label className="block text-slate-700 mb-2">Description</label>
            <textarea
              value={formData.description || ''}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              className="w-full px-4 py-2 border border-slate-300 rounded-lg"
              rows={3}
              placeholder="e.g., 15 minute grace period"
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-slate-700 mb-2">Grace Period (minutes)</label>
              <input
                type="number"
                value={formData.gracePeriodMinutes || 0}
                onChange={(e) => setFormData({ ...formData, gracePeriodMinutes: parseInt(e.target.value) || 0 })}
                className="w-full px-4 py-2 border border-slate-300 rounded-lg"
              />
            </div>
            <div>
              <label className="block text-slate-700 mb-2">Deduction per Minute</label>
              <input
                type="number"
                step="0.01"
                value={formData.deductionForEachMinute || 0}
                onChange={(e) => setFormData({ ...formData, deductionForEachMinute: parseFloat(e.target.value) || 0 })}
                className="w-full px-4 py-2 border border-slate-300 rounded-lg"
              />
            </div>
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

