'use client'

import { useState, useEffect } from 'react';
import { Card } from '@/components/Card';
import { Modal } from '@/components/Modal';
import { Calendar, AlertCircle, Save, User, History, Trash2 } from 'lucide-react';
import { leavesApi, employeeProfileApi } from '@/services/api';
import axiosInstance from '@/utils/ApiClient';
import { toast } from 'sonner';
import { useAuth } from '@/contexts/AuthContext';
import { Shield } from 'lucide-react';

export default function RetroactiveDeductionPage() {
    const { isHRManager, isHREmployee, isSystemAdmin, isHRAdmin } = useAuth();
    const isHR = isHRManager() || isHREmployee() || isSystemAdmin() || isHRAdmin();

    const [employees, setEmployees] = useState<any[]>([]);
    const [leaveTypes, setLeaveTypes] = useState<any[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);

    // Protection
    if (!isHR) {
        return (
            <div className="flex flex-col items-center justify-center h-[60vh] text-slate-500">
                <Shield className="w-16 h-16 mb-4 opacity-20" />
                <h2 className="text-xl font-semibold">Access Denied</h2>
                <p>Only HR personnel can access this page.</p>
            </div>
        );
    }

    const [formData, setFormData] = useState({
        employeeId: '',
        leaveTypeId: '',
        dates: [] as string[],
        reason: ''
    });

    const [newDate, setNewDate] = useState('');

    // Helper to safely extract array data from various response structures
    const extractData = (res: any) => {
        if (!res || !res.data) return [];
        if (Array.isArray(res.data)) return res.data;
        if (Array.isArray(res.data.data)) return res.data.data;
        const keys = ['employees', 'leaveTypes', 'items', 'results', 'data'];
        for (const key of keys) {
            if (res.data[key] && Array.isArray(res.data[key])) return res.data[key];
        }
        return [];
    };

    useEffect(() => {
        const fetchData = async () => {
            setIsLoading(true);
            try {
                const [empRes, leaveRes] = await Promise.all([
                    axiosInstance.get('/employee-profile', { params: { limit: 1000 } }),
                    leavesApi.getLeaveTypes()
                ]);
                setEmployees(extractData(empRes));
                setLeaveTypes(extractData(leaveRes));
            } catch (error) {
                console.error('Fetch failed:', error);
                toast.error('Failed to load initial data');
            } finally {
                setIsLoading(false);
            }
        };
        fetchData();
    }, []);

    const handleAddDate = () => {
        if (!newDate) return;
        if (formData.dates.includes(newDate)) {
            toast.error('Date already added');
            return;
        }
        setFormData({ ...formData, dates: [...formData.dates, newDate].sort() });
        setNewDate('');
    };

    const handleRemoveDate = (date: string) => {
        setFormData({ ...formData, dates: formData.dates.filter(d => d !== date) });
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!formData.employeeId || !formData.leaveTypeId || formData.dates.length === 0 || !formData.reason) {
            toast.error('Please fill all required fields');
            return;
        }

        setIsSubmitting(true);
        try {
            await leavesApi.applyRetroactiveDeduction(formData);
            toast.success('Retroactive deduction applied successfully');
            setFormData({
                employeeId: '',
                leaveTypeId: '',
                dates: [],
                reason: ''
            });
        } catch (error: any) {
            console.error('Submission failed:', error);
            toast.error(error.response?.data?.message || 'Failed to apply retroactive deduction');
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className="max-w-4xl mx-auto space-y-6">
            <div className="flex items-center gap-3 mb-2">
                <div className="p-2 bg-red-100 rounded-lg">
                    <History className="w-6 h-6 text-red-600" />
                </div>
                <div>
                    <h1 className="text-2xl font-bold text-slate-900">Retroactive Deductions</h1>
                    <p className="text-slate-600">Apply leave deductions for dates that have already passed</p>
                </div>
            </div>

            <Card>
                <form onSubmit={handleSubmit} className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {/* Employee Selection */}
                        <div className="space-y-2">
                            <label className="block text-sm font-medium text-slate-700">Select Employee</label>
                            <div className="relative">
                                <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                                <select
                                    value={formData.employeeId}
                                    onChange={(e) => setFormData({ ...formData, employeeId: e.target.value })}
                                    className="w-full pl-10 pr-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none appearance-none font-medium"
                                >
                                    <option value="">Select an employee...</option>
                                    {employees.map(emp => (
                                        <option key={emp.id || emp._id} value={emp.id || emp._id}>
                                            {emp.firstName} {emp.lastName} ({emp.employeeNumber || emp.id})
                                        </option>
                                    ))}
                                </select>
                            </div>
                        </div>

                        {/* Leave Type Selection */}
                        <div className="space-y-2">
                            <label className="block text-sm font-medium text-slate-700">Leave Type</label>
                            <div className="relative">
                                <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                                <select
                                    value={formData.leaveTypeId}
                                    onChange={(e) => setFormData({ ...formData, leaveTypeId: e.target.value })}
                                    className="w-full pl-10 pr-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none appearance-none font-medium"
                                >
                                    <option value="">Select leave type...</option>
                                    {leaveTypes.map(type => (
                                        <option key={type._id} value={type._id}>{type.name}</option>
                                    ))}
                                </select>
                            </div>
                        </div>
                    </div>

                    {/* Date Picker */}
                    <div className="space-y-4">
                        <label className="block text-sm font-medium text-slate-700">Affected Dates</label>
                        <div className="flex gap-2">
                            <input
                                type="date"
                                value={newDate}
                                onChange={(e) => setNewDate(e.target.value)}
                                className="flex-1 px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                            />
                            <button
                                type="button"
                                onClick={handleAddDate}
                                className="px-6 py-2 bg-slate-900 text-white rounded-lg hover:bg-slate-800 transition-colors"
                            >
                                Add Date
                            </button>
                        </div>

                        {/* Selected Dates Chips */}
                        <div className="flex flex-wrap gap-2 p-4 bg-slate-50 rounded-xl min-h-[60px] border border-slate-100 border-dashed">
                            {formData.dates.length === 0 ? (
                                <p className="text-slate-400 text-sm italic w-full text-center py-2">No dates selected yet</p>
                            ) : (
                                formData.dates.map(date => (
                                    <div key={date} className="flex items-center gap-2 px-3 py-1 bg-white border border-slate-200 rounded-full text-sm shadow-sm group">
                                        <span className="font-medium">{new Date(date).toLocaleDateString()}</span>
                                        <button
                                            type="button"
                                            onClick={() => handleRemoveDate(date)}
                                            className="text-slate-400 hover:text-red-600 transition-colors"
                                        >
                                            <Trash2 className="w-3.5 h-3.5" />
                                        </button>
                                    </div>
                                ))
                            )}
                        </div>
                    </div>

                    {/* Reason */}
                    <div className="space-y-2">
                        <label className="block text-sm font-medium text-slate-700">Reason for Retroactive Deduction</label>
                        <textarea
                            value={formData.reason}
                            onChange={(e) => setFormData({ ...formData, reason: e.target.value })}
                            className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                            rows={3}
                            placeholder="Provide a reason (e.g., Unreported absence from last month)..."
                        />
                    </div>

                    <div className="pt-4">
                        <button
                            type="submit"
                            disabled={isSubmitting}
                            className="w-full flex items-center justify-center gap-2 px-6 py-3 bg-red-600 text-white rounded-xl hover:bg-red-700 transition-all shadow-lg shadow-red-100 disabled:opacity-50"
                        >
                            <Save className="w-5 h-5" />
                            {isSubmitting ? 'Processing...' : 'Apply Retroactive Deduction'}
                        </button>
                    </div>
                </form>
            </Card>

            <div className="p-4 bg-amber-50 border border-amber-200 rounded-xl flex gap-3">
                <AlertCircle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
                <div className="text-sm text-amber-800">
                    <p className="font-semibold">Important Notice</p>
                    <p>Retroactive deductions will immediately update the employee's leave balance. If the balance falls below zero, it may be converted to unpaid leave in the next payroll cycle.</p>
                </div>
            </div>
        </div>
    );
}
