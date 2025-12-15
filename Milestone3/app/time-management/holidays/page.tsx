'use client'

import { useState, useEffect } from 'react';
import { Card } from '../../../components/Card';
import { Modal } from '../../../components/Modal';
import { StatusBadge } from '../../../components/StatusBadge';
import { timeManagementApi } from '../../../lib/api';
import { handleTimeManagementError, extractArrayData } from '../../../lib/time-management-utils';
import { formatDate, toISO8601 } from '../../../lib/date-utils';
import { Edit2, Plus, XCircle } from 'lucide-react';

export default function HolidaysPage() {
  const [loading, setLoading] = useState(false);
  const [holidays, setHolidays] = useState<any[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedItem, setSelectedItem] = useState<any>(null);
  const [formData, setFormData] = useState<any>({});

  useEffect(() => {
    loadHolidays();
  }, []);

  const loadHolidays = async () => {
    setLoading(true);
    try {
      const response = await timeManagementApi.getHolidays();
      setHolidays(extractArrayData(response));
    } catch (error: any) {
      console.error('Error loading holidays:', error);
      setHolidays([]);
      handleTimeManagementError(error, 'loading holidays');
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = async () => {
    try {
      setLoading(true);
      // Convert date to ISO 8601 format and use startDate field
      const cleanData: any = { ...formData };
      
      // Validate required fields
      if (!cleanData.type) {
        alert('Please select a holiday type');
        setLoading(false);
        return;
      }
      if (!cleanData.startDate) {
        alert('Please select a start date');
        setLoading(false);
        return;
      }
      
      // Ensure type is uppercase enum value
      if (cleanData.type) {
        cleanData.type = cleanData.type.toUpperCase();
      }
      
      if (cleanData.date) {
        cleanData.startDate = toISO8601(cleanData.date, 'start');
        delete cleanData.date;
      }
      if (cleanData.startDate && typeof cleanData.startDate === 'string' && !cleanData.startDate.includes('T')) {
        cleanData.startDate = toISO8601(cleanData.startDate, 'start');
      }
      if (cleanData.endDate && typeof cleanData.endDate === 'string' && !cleanData.endDate.includes('T')) {
        cleanData.endDate = toISO8601(cleanData.endDate, 'end');
      }
      
      await timeManagementApi.createHoliday(cleanData);
      setIsModalOpen(false);
      setFormData({});
      loadHolidays();
    } catch (error: any) {
      handleTimeManagementError(error, 'creating holiday');
    } finally {
      setLoading(false);
    }
  };

  const handleUpdate = async () => {
    if (!selectedItem) return;
    try {
      setLoading(true);
      // Convert date to ISO 8601 format and use startDate field
      const cleanData: any = { ...formData };
      
      // Ensure type is uppercase enum value if provided
      if (cleanData.type) {
        cleanData.type = cleanData.type.toUpperCase();
      }
      
      if (cleanData.date) {
        cleanData.startDate = toISO8601(cleanData.date, 'start');
        delete cleanData.date;
      }
      if (cleanData.startDate && typeof cleanData.startDate === 'string' && !cleanData.startDate.includes('T')) {
        cleanData.startDate = toISO8601(cleanData.startDate, 'start');
      }
      if (cleanData.endDate && typeof cleanData.endDate === 'string' && !cleanData.endDate.includes('T')) {
        cleanData.endDate = toISO8601(cleanData.endDate, 'end');
      }
      // Remove MongoDB internal fields and timestamp fields
      Object.keys(cleanData).forEach(key => {
        if (key === '_id' || key === '__v' || key === 'id' || key.startsWith('_') || 
            key === 'createdAt' || key === 'updatedAt') {
          delete cleanData[key];
        }
      });
      await timeManagementApi.updateHoliday(selectedItem._id || selectedItem.id, cleanData);
      setIsModalOpen(false);
      setSelectedItem(null);
      setFormData({});
      loadHolidays();
    } catch (error: any) {
      handleTimeManagementError(error, 'updating holiday');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this holiday?')) return;
    try {
      setLoading(true);
      await timeManagementApi.deleteHoliday(id);
      loadHolidays();
    } catch (error: any) {
      handleTimeManagementError(error, 'deleting holiday');
    } finally {
      setLoading(false);
    }
  };

  const openModal = (item?: any) => {
    setSelectedItem(item || null);
    if (item) {
      // Convert startDate to date input format (YYYY-MM-DD)
      const initialData = { ...item };
      if (initialData.startDate) {
        const date = new Date(initialData.startDate);
        if (!isNaN(date.getTime())) {
          initialData.startDate = date.toISOString().split('T')[0];
        }
      }
      if (initialData.endDate) {
        const date = new Date(initialData.endDate);
        if (!isNaN(date.getTime())) {
          initialData.endDate = date.toISOString().split('T')[0];
        }
      }
      setFormData(initialData);
    } else {
      setFormData({ active: true, type: '' });
    }
    setIsModalOpen(true);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-slate-900 mb-2">Holidays</h1>
          <p className="text-slate-600">Manage holiday calendar and rest days</p>
        </div>
        <button
          onClick={() => openModal()}
          className="px-4 py-2 bg-slate-900 text-white rounded-lg hover:bg-slate-800 flex items-center gap-2"
        >
          <Plus className="w-4 h-4" />
          Add Holiday
        </button>
      </div>

      {loading && holidays.length === 0 ? (
        <div className="text-center py-12">Loading...</div>
      ) : (
        <Card title="Holidays Calendar">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-slate-50 border-b border-slate-200">
                <tr>
                  <th className="px-6 py-3 text-left text-slate-700">Name</th>
                  <th className="px-6 py-3 text-left text-slate-700">Date</th>
                  <th className="px-6 py-3 text-left text-slate-700">Type</th>
                  <th className="px-6 py-3 text-left text-slate-700">Status</th>
                  <th className="px-6 py-3 text-left text-slate-700">Actions</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-slate-200">
                {holidays.map((holiday) => (
                  <tr key={holiday._id || holiday.id}>
                    <td className="px-6 py-4">{holiday.name || 'N/A'}</td>
                    <td className="px-6 py-4" suppressHydrationWarning>
                      {holiday.startDate ? formatDate(holiday.startDate) : 'N/A'}
                    </td>
                    <td className="px-6 py-4">{holiday.type || 'N/A'}</td>
                    <td className="px-6 py-4">
                      <StatusBadge status={holiday.active ? 'Active' : 'Inactive'} />
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex gap-2">
                        <button
                          onClick={() => openModal(holiday)}
                          className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg"
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleDelete(holiday._id || holiday.id)}
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
        title={selectedItem ? 'Edit Holiday' : 'Add Holiday'}
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
              placeholder="e.g., New Year"
            />
          </div>
          <div>
            <label className="block text-slate-700 mb-2">Start Date</label>
            <input
              type="date"
              value={formData.startDate ? (formData.startDate.includes('T') ? formData.startDate.split('T')[0] : formData.startDate) : ''}
              onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
              className="w-full px-4 py-2 border border-slate-300 rounded-lg"
            />
          </div>
          <div>
            <label className="block text-slate-700 mb-2">End Date (Optional)</label>
            <input
              type="date"
              value={formData.endDate ? (formData.endDate.includes('T') ? formData.endDate.split('T')[0] : formData.endDate) : ''}
              onChange={(e) => setFormData({ ...formData, endDate: e.target.value || undefined })}
              className="w-full px-4 py-2 border border-slate-300 rounded-lg"
            />
          </div>
          <div>
            <label className="block text-slate-700 mb-2">Type <span className="text-red-500">*</span></label>
            <select
              value={formData.type || ''}
              onChange={(e) => setFormData({ ...formData, type: e.target.value.toUpperCase() })}
              className="w-full px-4 py-2 border border-slate-300 rounded-lg"
              required
            >
              <option value="">Select Type</option>
              <option value="NATIONAL">National</option>
              <option value="ORGANIZATIONAL">Organizational</option>
              <option value="WEEKLY_REST">Weekly Rest</option>
            </select>
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

