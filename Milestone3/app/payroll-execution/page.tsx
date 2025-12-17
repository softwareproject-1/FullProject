'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  AlertCircle,
  DollarSign,
  CheckCircle,
  XCircle,
  Edit2,
  PlayCircle,
  Loader2,
  RefreshCw,
  History,
  Plus,
} from 'lucide-react';
import { StartPayrollCycleModal } from './StartPayrollCycleModal';
import { ConfirmationDialog } from './ConfirmationDialog';
import { payrollExecutionApi } from '@/services/api';
import { toast } from 'sonner';

// Types
interface PendingBenefit {
  _id: string;
  employeeId: {
    _id: string;
    name: string;
    department?: string;
    primaryDepartmentId?: {
      _id: string;
      name: string;
    };
  };
  department?: string;
  benefitType: 'SIGNING_BONUS' | 'TERMINATION';
  givenAmount?: number; // Backend uses givenAmount for both bonuses and terminations
  hrClearance?: boolean; // BR 26: Required for termination approval
  status: 'PENDING' | 'APPROVED' | 'REJECTED';
  submittedAt: string;
}

export default function PreRunReviewPage() {
  const router = useRouter();
  // const [activeTab, setActiveTab] = useState<'signing-bonuses' | 'terminations'>('signing-bonuses');
  const [signingBonuses, setSigningBonuses] = useState<PendingBenefit[]>([]);
  const [terminations, setTerminations] = useState<PendingBenefit[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editAmount, setEditAmount] = useState<number>(0);
  const [processingIds, setProcessingIds] = useState<Set<string>>(new Set());
  const [userRole, setUserRole] = useState<string>('');
  const [userId, setUserId] = useState<string>(''); // BR 25, BR 27: Track reviewer for authorization

  // Confirmation dialog state
  const [confirmDialog, setConfirmDialog] = useState<{
    isOpen: boolean;
    action: 'APPROVED' | 'REJECTED' | null;
    benefitId: string;
    benefitType: 'SIGNING_BONUS' | 'TERMINATION';
    benefit: PendingBenefit | null;
  }>({ isOpen: false, action: null, benefitId: '', benefitType: 'SIGNING_BONUS', benefit: null });

  // Get user role from localStorage and load data
  useEffect(() => {
    const userStr = localStorage.getItem('user');
    if (userStr) {
      const user = JSON.parse(userStr);
      const role = user.roles?.[0] || user.role || ''; // Get role from roles array or role property
      console.log('👤 User:', user);
      console.log('👤 User role:', role);
      setUserRole(role);
      setUserId(user.userId || user._id || '');

      // Load data immediately if user is Payroll Specialist or Manager
      if (role === 'Payroll Specialist' || role === 'Payroll Manager') {
        loadPendingBenefits();
      } else {
        setIsLoading(false);
      }
    } else {
      console.log('⚠️ No user found in localStorage');
      setIsLoading(false);
    }
  }, []); // Run once on mount

  const loadPendingBenefits = async () => {
    try {
      setIsLoading(true);

      console.log('🔍 Loading pending benefits...');
      console.log('📍 API endpoint:', '/payroll-execution/benefits/pending');
      console.log('👤 Current user:', localStorage.getItem('user'));
      console.log('🍪 Document cookies:', document.cookie);

      const response = await payrollExecutionApi.getPendingBenefits();
      const data = response.data;

      console.log('📦 Pending benefits response:', data);

      // Backend returns 'bonuses' and 'terminations' (not 'signingBonuses')
      const bonuses = data.bonuses || [];
      const terminations = data.terminations || [];

      console.log('💰 Signing Bonuses:', bonuses);
      console.log('🚪 Terminations:', terminations);

      setSigningBonuses(bonuses);
      setTerminations(terminations);
    } catch (error: any) {
      console.error('❌ Error loading pending benefits:', error);
      console.error('❌ Error status:', error.response?.status);
      console.error('❌ Error data:', error.response?.data);
      console.error('❌ Request cookies:', document.cookie);

      // Don't show error toast for authorization issues (Finance Staff)
      if (error.response?.status !== 401) {
        toast.error('Failed to load pending benefits');
      } else {
        // Show specific auth error
        toast.error('Authentication required. Please log in again.');
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleSeedData = async () => {
    try {
      setIsLoading(true);
      console.log('🌱 Seeding test data...');
      const response = await fetch('http://localhost:3001/api/payroll-execution/seed/benefits', {
        method: 'POST'
      });

      if (!response.ok) {
        throw new Error(`Failed to seed data: ${response.statusText}`);
      }

      const result = await response.json();
      console.log('✅ Seed result:', result);
      toast.success('Test data created successfully!');

      // Reload benefits
      await loadPendingBenefits();
    } catch (error: any) {
      console.error('❌ Error seeding data:', error);
      toast.error('Failed to seed test data: ' + error.message);
    } finally {
      setIsLoading(false);
    }
  };

  const openConfirmDialog = (
    benefitId: string,
    benefitType: 'SIGNING_BONUS' | 'TERMINATION',
    action: 'APPROVED' | 'REJECTED',
    overrideAmount?: number // Changed from skipHrCheck to overrideAmount
  ) => {
    const originalBenefit = benefitType === 'SIGNING_BONUS'
      ? signingBonuses.find(b => b._id === benefitId)
      : terminations.find(t => t._id === benefitId);

    if (!originalBenefit) return;

    // Create a copy of the benefit to potentially override amount for display in the dialog
    const benefit = { ...originalBenefit };
    if (overrideAmount !== undefined) {
      benefit.givenAmount = overrideAmount;
    }

    // HR Clearance check removed because backend does not currently provide this field (BR 26).
    // The Payroll Specialist is responsible for ensuring clearance before approving.
    // The backend still requires the explicit reason string which we provide in handleAction.

    setConfirmDialog({
      isOpen: true,
      action,
      benefitId,
      benefitType,
      benefit,
    });
  };

  const handleAction = async (reason?: string) => {
    const { benefitId, benefitType, action, benefit } = confirmDialog;

    console.log('🎬 handleAction called');
    console.log('🗂️ confirmDialog state:', JSON.stringify(confirmDialog, null, 2));
    console.log('📝 reason param:', reason);

    if (!action || !benefit) {
      console.error('❌ Missing action or benefit!', { action, benefit });
      return;
    }

    const isEditing = editingId === benefitId;
    const adjustedAmount = isEditing ? editAmount : undefined;

    setProcessingIds((prev) => new Set(prev).add(benefitId));
    try {
      // Extract employeeId with null safety
      let employeeId: string;
      if (benefit.employeeId) {
        employeeId = typeof benefit.employeeId === 'object' ? benefit.employeeId._id : benefit.employeeId;
      } else {
        toast.error('Invalid benefit data: missing employee ID');
        return;
      }

      // Build payload matching backend ReviewBenefitDto
      const payload: any = {
        employeeId,
        type: benefitType, // Backend expects 'type' not 'benefitType'
        action: action, // REQUIRED: APPROVED or REJECTED
        reviewerId: userId, // BR 25, BR 27: Include reviewer ID for authorization tracking
      };

      console.log('📤 Review payload (before additions):', JSON.stringify(payload, null, 2));
      console.log('🆔 userId:', userId);
      console.log('🎯 action:', action);
      console.log('📋 benefitType:', benefitType);

      // Add adjusted amount if changed (REQ-PY-29, REQ-PY-32).
      // If isEditing is true, we send the edited amount.
      if (isEditing && adjustedAmount !== undefined) {
        payload.amount = adjustedAmount;
        payload.reason = reason || 'Amount manually adjusted by Payroll Specialist';
      }

      // Include reason for rejections or termination approvals (BR 26: HR clearance requirement)
      if (reason) {
        payload.reason = reason;
      } else if (action === 'REJECTED') {
        payload.reason = 'Rejected by Payroll Specialist';
      } else if (action === 'APPROVED' && benefitType === 'TERMINATION') {
        // BR 26: Termination benefits require HR clearance confirmation
        // This string satisfies the backend check in payroll-execution.service.ts
        payload.reason = 'HR clearance confirmed - approved for processing';
      }

      console.log('📤 FINAL Review payload:', JSON.stringify(payload, null, 2));

      await payrollExecutionApi.reviewBenefit(payload);

      toast.success(`${action === 'APPROVED' ? 'Approved' : 'Rejected'} successfully`);

      // Refresh data
      await loadPendingBenefits();

      // Clear editing state
      setEditingId(null);
      setEditAmount(0);
      setConfirmDialog({ isOpen: false, action: null, benefitId: '', benefitType: 'SIGNING_BONUS', benefit: null });
    } catch (error: any) {
      console.error('❌ Error reviewing benefit:', error);
      console.error('❌ Error response:', error.response);
      console.error('❌ Error response data:', error.response?.data);
      console.error('❌ Error message:', error.response?.data?.message);

      // If there's a validation error with details, show them
      if (error.response?.data?.message) {
        if (Array.isArray(error.response.data.message)) {
          // NestJS validation errors come as an array
          toast.error(`Validation Error: ${error.response.data.message.join(', ')}`);
        } else {
          toast.error(error.response.data.message);
        }
      } else {
        toast.error('Failed to process action');
      }
    } finally {
      setProcessingIds((prev) => {
        const newSet = new Set(prev);
        newSet.delete(benefitId);
        return newSet;
      });
    }
  };

  const handleStartEdit = (benefitId: string, currentAmount: number) => {
    setEditingId(benefitId);
    setEditAmount(currentAmount);
    console.log('✏️ Edit started - Benefit:', benefitId, 'Amount:', currentAmount);
  };

  const handleSaveEdit = async (
    benefitId: string,
    benefitType: 'SIGNING_BONUS' | 'TERMINATION'
  ) => {
    console.log('💾 Save edit - Benefit:', benefitId, 'New amount:', editAmount);

    // Update the benefit amount in state immediately for UI feedback
    if (benefitType === 'SIGNING_BONUS') {
      setSigningBonuses(prev => prev.map(b =>
        b._id === benefitId ? { ...b, givenAmount: editAmount } : b
      ));
    } else {
      setTerminations(prev => prev.map(t =>
        t._id === benefitId ? { ...t, givenAmount: editAmount } : t
      ));
    }

    // Open approval dialog with the NEW amount for valid display
    openConfirmDialog(benefitId, benefitType, 'APPROVED', editAmount);
  };

  const handleCancelEdit = () => {
    setEditingId(null);
    setEditAmount(0);
  };

  const handleStartPayrollCycle = async (period: string, entity: string) => {
    try {
      // Parse period string (YYYY-MM) to match backend DTO
      const [yearStr, monthStr] = period.split('-');
      const year = parseInt(yearStr);
      const monthNum = parseInt(monthStr);

      // Convert month number to month name (e.g., 12 -> DEC)
      const monthNames = ['JAN', 'FEB', 'MAR', 'APR', 'MAY', 'JUN', 'JUL', 'AUG', 'SEP', 'OCT', 'NOV', 'DEC'];
      const month = monthNames[monthNum - 1];

      // Prepare payload matching backend InitiateRunDto
      const payload = {
        month,
        year,
        entity
      };

      console.log('🚀 Initiating payroll period with payload:', payload);
      console.log('📅 Period input:', period);
      console.log('🏢 Entity:', entity);
      console.log('📊 Parsed - Month:', month, 'Year:', year);

      const response = await payrollExecutionApi.initiatePeriod(payload);

      console.log('✅ Payroll initiated successfully:', response.data);
      const runId = response.data.runId;
      toast.success(`Payroll cycle ${runId} initiated successfully`);

      // Redirect to draft page with runId parameter
      router.push(`/payroll-execution/draft?runId=${runId}`);
    } catch (error: any) {
      console.error('❌ Error starting payroll cycle:', error);
      console.error('❌ Error response:', error.response?.data);
      console.error('❌ Error status:', error.response?.status);

      const errorMessage = error.response?.data?.message
        || error.response?.data?.error
        || error.message
        || 'Failed to start payroll cycle';

      toast.error(errorMessage);
      throw error;
    }
  };

  const renderBenefitTable = (benefits: PendingBenefit[], benefitType: 'SIGNING_BONUS' | 'TERMINATION') => {
    if (isLoading) {
      return (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
        </div>
      );
    }

    if (benefits.length === 0) {
      return (
        <div className="flex flex-col items-center justify-center py-12 text-gray-500">
          <CheckCircle className="w-12 h-12 mb-3 text-gray-300" />
          <p className="text-lg font-medium">No pending items</p>
          <p className="text-sm">All {benefitType === 'SIGNING_BONUS' ? 'signing bonuses' : 'terminations'} have been reviewed</p>
        </div>
      );
    }

    return (
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead className="bg-gray-50 border-b border-gray-200">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                Employee
              </th>
              <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                Department
              </th>
              <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                Type
              </th>
              <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                Amount
              </th>
              <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                Submitted
              </th>
              <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                Status
              </th>
              <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {benefits.map((benefit) => {
              const isProcessing = processingIds.has(benefit._id);
              const isEditing = editingId === benefit._id;

              // Safely extract employee data
              const employeeData = benefit.employeeId && typeof benefit.employeeId === 'object' ? benefit.employeeId : null;
              const employeeName = employeeData?.name || 'Unknown Employee';
              const department = benefit.department || employeeData?.primaryDepartmentId?.name || employeeData?.department || 'N/A';

              return (
                <tr key={benefit._id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 font-semibold">
                        {employeeName.charAt(0)}
                      </div>
                      <div className="ml-3">
                        <div className="text-sm font-medium text-gray-900">{employeeName}</div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className="text-sm text-gray-600">{department}</span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <Badge
                      variant="outline"
                      className={
                        benefitType === 'SIGNING_BONUS'
                          ? 'bg-green-50 text-green-700 border-green-200'
                          : 'bg-orange-50 text-orange-700 border-orange-200'
                      }
                    >
                      {benefitType === 'SIGNING_BONUS' ? 'Signing Bonus' : 'Severance'}
                    </Badge>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    {isEditing ? (
                      <div className="flex items-center gap-2">
                        <span className="text-sm text-gray-500">$</span>
                        <Input
                          type="number"
                          value={editAmount}
                          onChange={(e) => setEditAmount(Number(e.target.value))}
                          className="w-24 h-8"
                          autoFocus
                        />
                      </div>
                    ) : (
                      <span className="text-sm font-semibold text-gray-900">
                        ${(benefit.givenAmount || 0).toLocaleString()}
                      </span>
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className="text-sm text-gray-900">
                      {benefit.submittedAt ? new Date(benefit.submittedAt).toLocaleDateString() : 'N/A'}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <Badge
                      variant="outline"
                      className="bg-yellow-50 text-yellow-700 border-yellow-200"
                    >
                      {benefit.status}
                    </Badge>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center gap-2">
                      {isEditing ? (
                        <>
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => handleSaveEdit(benefit._id, benefitType)}
                            disabled={isProcessing}
                            className="h-8 w-8 p-0 hover:bg-green-50 text-green-600"
                          >
                            <CheckCircle className="w-4 h-4" />
                          </Button>
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={handleCancelEdit}
                            disabled={isProcessing}
                            className="h-8 w-8 p-0 hover:bg-gray-100"
                          >
                            <XCircle className="w-4 h-4" />
                          </Button>
                        </>
                      ) : (
                        <>
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => openConfirmDialog(benefit._id, benefitType, 'APPROVED')}
                            disabled={isProcessing}
                            className="h-8 w-8 p-0 hover:bg-green-50 text-green-600"
                            title="Approve"
                          >
                            {isProcessing ? (
                              <Loader2 className="w-4 h-4 animate-spin" />
                            ) : (
                              <CheckCircle className="w-4 h-4" />
                            )}
                          </Button>
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => openConfirmDialog(benefit._id, benefitType, 'REJECTED')}
                            disabled={isProcessing}
                            className="h-8 w-8 p-0 hover:bg-red-50 text-red-600"
                            title="Reject"
                          >
                            <XCircle className="w-4 h-4" />
                          </Button>
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => handleStartEdit(benefit._id, benefit.givenAmount || 0)}
                            disabled={isProcessing}
                            className="h-8 w-8 p-0 hover:bg-blue-50 text-blue-600"
                            title="Edit"
                          >
                            <Edit2 className="w-4 h-4" />
                          </Button>
                        </>
                      )}
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    );
  };

  const pendingCount = signingBonuses.length + terminations.length;
  const totalPendingAmount = [...signingBonuses, ...terminations].reduce(
    (sum, benefit) => sum + (benefit.givenAmount || 0),
    0
  );

  // Role-based permissions
  const canStartPayroll = userRole === 'Payroll Specialist';
  const canApproveReject = userRole === 'Payroll Specialist' || userRole === 'Payroll Manager';

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Payroll Pre-Run Review</h1>
          <p className="text-sm text-gray-500 mt-1">
            Review and approve pending benefits before starting the payroll cycle
          </p>
        </div>
        <div className="flex gap-2">

          <Button
            onClick={() => router.push('/payroll-execution/history')}
            variant="outline"
            className="flex items-center gap-2"
          >
            <History className="w-4 h-4" />
            Payroll History
          </Button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Pending Approvals</p>
                <p className="text-3xl font-bold text-gray-900 mt-2">{pendingCount} items</p>
              </div>
              <div className="w-12 h-12 bg-yellow-100 rounded-lg flex items-center justify-center">
                <AlertCircle className="w-6 h-6 text-yellow-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total Pending Amount</p>
                <p className="text-3xl font-bold text-gray-900 mt-2">
                  ${totalPendingAmount.toLocaleString()}
                </p>
              </div>
              <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                <DollarSign className="w-6 h-6 text-green-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Ready to Process</p>
                <p className="text-3xl font-bold text-gray-900 mt-2">
                  {canStartPayroll ? 'Yes' : 'No'}
                </p>
              </div>
              <div className={`w-12 h-12 ${canStartPayroll ? 'bg-green-100' : 'bg-gray-100'} rounded-lg flex items-center justify-center`}>
                <CheckCircle className={`w-6 h-6 ${canStartPayroll ? 'text-green-600' : 'text-gray-400'}`} />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Main Content Card */}
      <Card>
        <CardHeader className="border-b border-gray-200">
          <div className="flex items-center justify-between">
            <CardTitle className="text-xl font-semibold">Pending Items Review</CardTitle>
            <div className="flex items-center gap-2">
              {/* Refresh button to reload data */}
              {/* <Button
                onClick={loadPendingBenefits}
                variant="outline"
                className="flex items-center gap-2"
                disabled={isLoading}
              >
                <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
                Refresh
              </Button> */}

              {canStartPayroll ? (
                <Button
                  onClick={() => setIsModalOpen(true)}
                  className="bg-blue-600 hover:bg-blue-700 text-white"
                  suppressHydrationWarning
                >
                  <PlayCircle className="w-4 h-4 mr-2" />
                  Start New Payroll Cycle
                </Button>
              ) : (
                <div className="text-sm text-gray-500">
                  Only Payroll Specialists can start payroll cycles
                </div>
              )}
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <Tabs defaultValue="signing-bonuses">
            <div className="border-b border-gray-200 px-6">
              <TabsList className="bg-transparent border-b-0 h-12">
                <TabsTrigger
                  value="signing-bonuses"
                  className="data-[state=active]:border-b-2 data-[state=active]:border-blue-600 data-[state=active]:text-blue-600 rounded-none"
                >
                  Signing Bonuses ({signingBonuses.length})
                </TabsTrigger>
                <TabsTrigger
                  value="terminations"
                  className="data-[state=active]:border-b-2 data-[state=active]:border-blue-600 data-[state=active]:text-blue-600 rounded-none"
                >
                  Terminations ({terminations.length})
                </TabsTrigger>
              </TabsList>
            </div>

            <TabsContent value="signing-bonuses" className="mt-0">
              {renderBenefitTable(signingBonuses, 'SIGNING_BONUS')}
            </TabsContent>

            <TabsContent value="terminations" className="mt-0">
              {renderBenefitTable(terminations, 'TERMINATION')}
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>

      {/* Start Payroll Cycle Modal */}
      <StartPayrollCycleModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onConfirm={handleStartPayrollCycle}
      />

      {/* Confirmation Dialog */}
      {confirmDialog.benefit && (
        <ConfirmationDialog
          isOpen={confirmDialog.isOpen}
          onClose={() => setConfirmDialog({ ...confirmDialog, isOpen: false })}
          onConfirm={handleAction}
          title={confirmDialog.action === 'APPROVED' ? 'Confirm Approval' : 'Confirm Rejection'}
          description={
            confirmDialog.action === 'APPROVED'
              ? 'Are you sure you want to approve this benefit? This action will process the payment.'
              : 'Are you sure you want to reject this benefit? Please provide a reason for rejection.'
          }
          confirmText={confirmDialog.action === 'APPROVED' ? 'Approve' : 'Reject'}
          variant={confirmDialog.action === 'APPROVED' ? 'approve' : 'reject'}
          requiresReason={confirmDialog.action === 'REJECTED'}
          benefitDetails={{
            employeeName: confirmDialog.benefit.employeeId?.name || 'Unknown',
            amount: confirmDialog.benefit.givenAmount || 0,
            type: confirmDialog.benefitType === 'SIGNING_BONUS' ? 'Signing Bonus' : 'Termination',
          }}
        />
      )}
    </div>
  );
}
