'use client'

import { useState, useEffect } from 'react';
import { Card } from '@/components/Card';
import { StatusBadge } from '@/components/StatusBadge';
import { User, Users, Calendar, Shield, XCircle, CheckCircle, AlertTriangle, UserPlus, RefreshCw } from 'lucide-react';
import { leavesApi, employeeProfileApi } from '@/services/api';
import axiosInstance from '@/utils/ApiClient';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';

export default function DelegationPage() {
    const { user } = useAuth();
    const [employees, setEmployees] = useState<any[]>([]);
    const [delegationStatus, setDelegationStatus] = useState<any>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [isUpdating, setIsUpdating] = useState(false);

    const [formData, setFormData] = useState({
        delegateId: '',
        startDate: '',
        endDate: ''
    });

    // Helper to safely extract array data from various response structures
    const extractData = (res: any) => {
        if (!res || !res.data) return [];
        if (Array.isArray(res.data)) return res.data;
        if (Array.isArray(res.data.data)) return res.data.data;
        const keys = ['employees', 'items', 'results', 'data'];
        for (const key of keys) {
            if (res.data[key] && Array.isArray(res.data[key])) return res.data[key];
        }
        return [];
    };

    const fetchStatus = async () => {
        if (!user?.id) return;
        setIsLoading(true);
        try {
            const res = await leavesApi.getDelegationStatus(user.id);
            setDelegationStatus(res.data);
        } catch (error) {
            console.error('Failed to fetch status:', error);
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        const fetchEmployees = async () => {
            try {
                const res = await axiosInstance.get('/employee-profile', { params: { limit: 1000 } });
                const employeesData = extractData(res);
                // Filter out current user from potential delegates
                setEmployees(employeesData.filter((emp: any) => (emp.id || emp._id) !== user?.id));
            } catch (error) {
                console.error('Failed to fetch employees:', error);
            }
        };

        fetchEmployees();
        fetchStatus();
    }, [user?.id]);

    const handleSetDelegation = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!formData.delegateId) {
            toast.error('Please select a delegate');
            return;
        }

        setIsUpdating(true);
        try {
            await leavesApi.setDelegation({
                managerId: user?.id,
                ...formData
            });
            toast.success('Delegation request sent');
            fetchStatus();
        } catch (error: any) {
            toast.error(error.response?.data?.message || 'Failed to set delegation');
        } finally {
            setIsUpdating(false);
        }
    };

    const handleRevoke = async () => {
        if (!window.confirm('Are you sure you want to revoke this delegation?')) return;
        setIsUpdating(true);
        try {
            await leavesApi.revokeDelegation({ managerId: user?.id });
            toast.success('Delegation revoked');
            setDelegationStatus(null);
        } catch (error) {
            toast.error('Failed to revoke delegation');
        } finally {
            setIsUpdating(false);
        }
    };

    return (
        <div className="max-w-5xl mx-auto space-y-6">
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                    <div className="p-2 bg-purple-100 rounded-lg">
                        <Users className="w-6 h-6 text-purple-600" />
                    </div>
                    <div>
                        <h1 className="text-2xl font-bold text-slate-900">Manager Delegation</h1>
                        <p className="text-slate-600">Delegate your leave approval authority to another employee</p>
                    </div>
                </div>
                <button
                    onClick={fetchStatus}
                    className="p-2 hover:bg-slate-100 rounded-lg transition-colors"
                >
                    <RefreshCw className={`w-5 h-5 ${isLoading ? 'animate-spin' : ''}`} />
                </button>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Status Column */}
                <div className="lg:col-span-1 space-y-6">
                    <Card title="Current Status">
                        {isLoading ? (
                            <div className="animate-pulse space-y-3">
                                <div className="h-4 bg-slate-200 rounded w-1/2"></div>
                                <div className="h-10 bg-slate-100 rounded"></div>
                            </div>
                        ) : delegationStatus ? (
                            <div className="space-y-4">
                                <div className="p-4 bg-purple-50 rounded-xl border border-purple-100">
                                    <p className="text-xs font-semibold text-purple-600 uppercase tracking-wider mb-2">Active Delegation</p>
                                    <div className="flex items-center gap-3 mb-3">
                                        <div className="w-10 h-10 bg-white rounded-full flex items-center justify-center border border-purple-200">
                                            <User className="w-6 h-6 text-purple-500" />
                                        </div>
                                        <div>
                                            <p className="font-bold text-slate-900">{delegationStatus.delegateName || 'Selected Delegate'}</p>
                                            <p className="text-xs text-slate-500">Authority Level: Full Approval</p>
                                        </div>
                                    </div>
                                    <div className="grid grid-cols-2 gap-2 text-xs">
                                        <div className="bg-white p-2 rounded-lg text-center">
                                            <p className="text-slate-400">From</p>
                                            <p className="font-medium">{new Date(delegationStatus.startDate).toLocaleDateString()}</p>
                                        </div>
                                        <div className="bg-white p-2 rounded-lg text-center">
                                            <p className="text-slate-400">To</p>
                                            <p className="font-medium">{delegationStatus.endDate ? new Date(delegationStatus.endDate).toLocaleDateString() : 'Indefinite'}</p>
                                        </div>
                                    </div>
                                    <div className="mt-4 pt-4 border-t border-purple-100 flex items-center justify-between">
                                        <span className={`px-2 py-1 rounded-full text-[10px] font-bold uppercase ${delegationStatus.status === 'Accepted' ? 'bg-green-100 text-green-700' :
                                            delegationStatus.status === 'Pending' ? 'bg-amber-100 text-amber-700' : 'bg-red-100 text-red-700'
                                            }`}>
                                            {delegationStatus.status}
                                        </span>
                                        <button
                                            onClick={handleRevoke}
                                            className="text-xs text-red-600 hover:underline font-medium"
                                        >
                                            Revoke Authority
                                        </button>
                                    </div>
                                </div>
                            </div>
                        ) : (
                            <div className="text-center py-6 text-slate-500">
                                <Shield className="w-12 h-12 mx-auto mb-3 opacity-20 text-slate-400" />
                                <p className="text-sm">You haven't delegated your authority yet.</p>
                            </div>
                        )}
                    </Card>

                    <Card title="Delegation Rules">
                        <ul className="space-y-3 text-sm text-slate-600">
                            <li className="flex gap-2">
                                <CheckCircle className="w-4 h-4 text-green-500 shrink-0 mt-0.5" />
                                <span>Delegation bypasses your direct queue.</span>
                            </li>
                            <li className="flex gap-2">
                                <CheckCircle className="w-4 h-4 text-green-500 shrink-0 mt-0.5" />
                                <span>Delegates must accept the request.</span>
                            </li>
                            <li className="flex gap-2">
                                <AlertTriangle className="w-4 h-4 text-amber-500 shrink-0 mt-0.5" />
                                <span>You remain liable for all decisions made by delegates.</span>
                            </li>
                        </ul>
                    </Card>
                </div>

                {/* Form Column */}
                <div className="lg:col-span-2">
                    <Card title="New Delegation Request">
                        <form onSubmit={handleSetDelegation} className="space-y-6">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div className="space-y-2">
                                    <label className="text-sm font-medium text-slate-700">Delegate Employee</label>
                                    <div className="relative">
                                        <UserPlus className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                                        <select
                                            value={formData.delegateId}
                                            onChange={(e) => setFormData({ ...formData, delegateId: e.target.value })}
                                            className="w-full pl-10 pr-4 py-2 border border-slate-300 rounded-xl focus:ring-2 focus:ring-purple-500 outline-none appearance-none"
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

                                <div className="space-y-2">
                                    <label className="text-sm font-medium text-slate-700">Authority Start Date</label>
                                    <input
                                        type="date"
                                        value={formData.startDate}
                                        onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
                                        className="w-full px-4 py-2 border border-slate-300 rounded-xl focus:ring-2 focus:ring-purple-500 outline-none"
                                    />
                                </div>

                                <div className="space-y-2">
                                    <label className="text-sm font-medium text-slate-700">Authority End Date (Optional)</label>
                                    <input
                                        type="date"
                                        value={formData.endDate}
                                        onChange={(e) => setFormData({ ...formData, endDate: e.target.value })}
                                        className="w-full px-4 py-2 border border-slate-300 rounded-xl focus:ring-2 focus:ring-purple-500 outline-none"
                                    />
                                    <p className="text-[10px] text-slate-400 uppercase font-bold tracking-tight">Leave blank for indefinite delegation</p>
                                </div>
                            </div>

                            <button
                                type="submit"
                                disabled={isUpdating || !!delegationStatus}
                                className="w-full py-4 bg-purple-600 text-white rounded-xl font-bold hover:bg-purple-700 transition-all shadow-lg shadow-purple-200 disabled:opacity-50 disabled:grayscale"
                            >
                                {delegationStatus ? 'Already Delegated' : 'Confirm Delegation Request'}
                            </button>
                        </form>
                    </Card>

                    {/* Pending My Acceptance (if any) */}
                    {/* In a real app, you'd fetch if anyone delegated to YOU */}
                    <Card title="Delegations to You" className="mt-6">
                        <div className="text-center py-8 border-2 border-dashed border-slate-100 rounded-2xl">
                            <p className="text-slate-400 text-sm">No pending delegation requests found for you.</p>
                        </div>
                    </Card>
                </div>
            </div>
        </div>
    );
}
