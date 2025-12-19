'use client';

import React, { useEffect, useState } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { PayslipPreviewModal } from './PayslipPreviewModal';
import { AnomalyAlerts, Anomaly, AnomalyType } from './AnomalyAlerts';
import { UnfreezeModal } from './UnfreezeModal';
import { RejectionModal } from './RejectionModal';
import ManagerResolutionModal, { ResolutionData } from './AnomalyResolutionModal';
import { useRouter, useSearchParams } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { payrollExecutionApi, employeeProfileApi } from '@/services/api';
import { toast } from 'sonner';
import { Loader2, AlertCircle, CheckCircle2, XCircle, FileText, AlertTriangle, TrendingUp, CreditCard, DollarSign, Lock, Unlock, Send, Eye, PlayCircle } from 'lucide-react';


interface TaxBreakdown {
  bracket: string;
  rate: number;
  amount: number;
}

interface InsuranceBreakdown {
  employeeAmount: number;
  employerAmount: number;
  total: number;
}

interface DraftEmployee {
  employeeId: string;
  employeeName: string;
  department: string;
  baseSalary: number;
  grossSalary: number;
  taxBreakdown: TaxBreakdown[];
  insurance: InsuranceBreakdown;
  penalties: number;
  overtimePay: number;
  bonuses: number;
  terminationPayout: number;
  totalDeductions: number;
  netPay: number;
  minimumWageApplied?: boolean;
  status?: string;
  bankAccountNumber?: string;
  anomalies?: Anomaly[];
  historicalSalary?: number;
  managerOverride?: boolean;
  paymentMethod?: string;
  exceptions?: string;
  bankStatus?: string;
}

interface DraftData {
  runId: string;
  period: string;
  entity: string;
  status: string;
  employees: DraftEmployee[];
  totalEmployees: number;
  totalGrossPay: number;
  totalDeductions: number;
  totalNetPay: number;
}

export default function PayrollDraftPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const runId = searchParams.get('runId');

  const [loading, setLoading] = useState(true);
  const [draftData, setDraftData] = useState<DraftData | null>(null);
  const [selectedEmployee, setSelectedEmployee] = useState<DraftEmployee | null>(null);
  const [isPayslipModalOpen, setIsPayslipModalOpen] = useState(false);
  const [processingAction, setProcessingAction] = useState(false);
  const [totalAnomalies, setTotalAnomalies] = useState(0);
  const [criticalAnomalies, setCriticalAnomalies] = useState(0);

  // Modal states
  const [isUnfreezeModalOpen, setIsUnfreezeModalOpen] = useState(false);
  const [isRejectionModalOpen, setIsRejectionModalOpen] = useState(false);
  const [isResolutionModalOpen, setIsResolutionModalOpen] = useState(false);
  const [resolutionCandidates, setResolutionCandidates] = useState<DraftEmployee[]>([]);

  // Get user from AuthContext (Source of Truth)
  const { user } = useAuth();

  // Role-based permissions helpers

  // Get user role and roles array from localStorage
  const [userRole, setUserRole] = useState<string>('');
  const [userRoles, setUserRoles] = useState<string[]>([]);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const user = JSON.parse(localStorage.getItem('user') || '{}');
      setUserRole(user.role || '');

      // Try getting roles from 'userRoles' key first (like history page), then fall back to user object
      const storedRoles = localStorage.getItem('userRoles');
      if (storedRoles) {
        try {
          setUserRoles(JSON.parse(storedRoles));
        } catch (e) {
          console.error('Error parsing userRoles', e);
          setUserRoles(user.roles || [user.role] || []);
        }
      } else {
        setUserRoles(user.roles || [user.role] || []);
      }
    }
  }, []);

  // Role-based permissions (check both singular role and roles array)
  // Role-based permissions (check both singular role and roles array with normalization)
  const normalizeRole = (r: string) => r?.toLowerCase().replace(/_/g, ' ').trim();

  const hasRole = (target: string) => {
    // Debug: Check if we are checking against the populated state
    // console.log(`Checking role ${target} against`, { userRoles, userRole }); 

    const targetNormalized = normalizeRole(target);

    // Check local state roles array (Source of Truth 1)
    if (userRoles && Array.isArray(userRoles)) {
      if (userRoles.some((r: string) => normalizeRole(r) === targetNormalized)) return true;
    }

    // Check local state singular role (Source of Truth 2)
    if (userRole && normalizeRole(userRole) === targetNormalized) return true;

    // Fallback: Check AuthContext user object (Legacy/Backup)
    if (user) {
      if (user.roles && Array.isArray(user.roles)) {
        if (user.roles.some((r: string) => normalizeRole(r) === targetNormalized)) return true;
      }
      // @ts-ignore
      if (user.role && normalizeRole(user.role) === targetNormalized) return true;
    }

    return false;
  };

  const isAdmin = hasRole('system admin') || hasRole('hr admin'); // Allow admins to see buttons for debugging?
  const isPayrollSpecialist = hasRole('payroll specialist') || isAdmin;
  const isPayrollManager = hasRole('payroll manager') || hasRole('manager') || hasRole('admin');
  const isFinanceStaff = hasRole('finance staff');


  // Payroll status helpers
  // Status Helpers (Normalized)
  const rawTheStatus = (draftData?.status || 'draft').toLowerCase();
  const payrollStatus = rawTheStatus === 'under_review' ? 'under review' : rawTheStatus; // Handle potential enum mismatch if any

  console.log('🔍 Debug Status Checks:', { rawTheStatus, payrollStatus });

  const isDraft = payrollStatus === 'draft';
  const isCalculated = payrollStatus === 'calculated';
  const isUnderReview = payrollStatus === 'under review' || payrollStatus === 'pending_approval';
  const isPendingFinance = payrollStatus === 'pending finance approval' || payrollStatus === 'pending_finance_approval';
  const isApproved = payrollStatus === 'approved';
  // Check for both 'locked' and 'unlocked' (functionally mostly the same for viewing)
  const isLocked = payrollStatus === 'locked';
  const isPaid = payrollStatus === 'completed' || payrollStatus === 'paid';

  const isExecuted = isPaid; // Explicit alias
  const isCompleted = isPaid; // Explicit alias

  console.log('🔍 Debug Role Checks:', {
    userRole,
    userRoles,
    isPayrollSpecialist,
    isPayrollManager,
    isFinanceStaff,
    isAdmin
  });
  console.log('🔍 Debug Status Checks:', {
    rawTheStatus: draftData?.status,
    payrollStatus,
    isDraft,
    isCalculated,
    isUnderReview,
    isPendingFinance
  });


  useEffect(() => {
    if (!runId) {
      toast.error('No payroll run ID provided');
      router.push('/payroll-execution');
      return;
    }
    loadDraftData();
  }, [runId]);

  // Anomaly Detection Logic (REQ-PY-5)
  const detectAnomalies = (employee: DraftEmployee): Anomaly[] => {
    const anomalies: Anomaly[] = [];

    // 1. Negative Net Pay Detection
    if (employee.netPay < 0) {
      anomalies.push({
        type: 'NEGATIVE_NET_PAY',
        severity: 'critical',
        message: 'Negative net pay detected',
        value: employee.netPay,
      });
    }

    // 2. Missing Bank Account Information
    // Skip if manager has overridden the payment method (e.g. to Cheque/Cash)
    const isPaymentOverridden = employee.managerOverride ||
      ['CHEQUE', 'CASH'].includes(employee.paymentMethod || '');

    if (employee.employeeName === 'Unknown Employee') { // Filter to avoid spam if many
      console.log(`[AG_DEBUG DETECT] ${employee.employeeName}: Override=${employee.managerOverride}, Method=${employee.paymentMethod} -> isPaymentOverridden=${isPaymentOverridden}`);
      console.log(`[AG_DEBUG DETECT] Raw Values - managerOverride type: ${typeof employee.managerOverride}, value: ${employee.managerOverride}`);
    } else {
      // Log for all employees briefly to find the right one
      if (employee.managerOverride || employee.paymentMethod) {
        console.log(`[AG_DEBUG DETECT] FOUND OVERRIDE for ${employee.employeeName}: Override=${employee.managerOverride}, Method=${employee.paymentMethod}`);
      }
    }

    if (!isPaymentOverridden && (
      (!employee.bankAccountNumber || employee.bankAccountNumber.trim() === '') ||
      (employee.bankStatus && employee.bankStatus.toLowerCase() === 'missing') // Handle case sensitivity
    )) {
      console.log(`[AG_DEBUG DETECT] Pushing MISSING_BANK_INFO for ${employee.employeeName}`);
      anomalies.push({
        type: 'MISSING_BANK_INFO',
        severity: 'critical',
        message: 'Bank account information missing (Status=MISSING)',
        value: 'Not provided',
      });
    }

    // 3. Salary Spike Detection (>20% increase from historical average)
    // Suppress if manager has overridden/approved
    if (!employee.managerOverride && employee.historicalSalary && employee.historicalSalary > 0) {
      const percentageChange = ((employee.grossSalary - employee.historicalSalary) / employee.historicalSalary) * 100;
      const spikeThreshold = 20; // 20% threshold

      if (percentageChange > spikeThreshold) {
        anomalies.push({
          type: 'SALARY_SPIKE',
          severity: 'warning',
          message: `Salary spike detected: ${percentageChange.toFixed(1)}% increase`,
          value: employee.grossSalary,
          threshold: spikeThreshold,
        });
      }
    }

    // 4. Missing Tax Breakdown
    // Suppress if manager has overridden (assumed manual verification)
    if (!employee.managerOverride && employee.grossSalary > 0 && (!employee.taxBreakdown || employee.taxBreakdown.length === 0)) {
      anomalies.push({
        type: 'MISSING_TAX_INFO',
        severity: 'warning',
        message: 'Tax breakdown missing for employee with positive salary',
      });
    }

    // 5. Backend-Reported Exceptions
    if (employee.exceptions && employee.exceptions.trim().length > 0) {
      const exceptionText = employee.exceptions.toUpperCase();
      const isResolved = exceptionText.includes('OVERRIDE') || exceptionText.includes('DEFERRED');

      // Only show as critical anomaly if NOT resolved
      // If resolved, we consider it "clean" for the anomaly count, though we might show it as info elsewhere
      if (!isResolved) {
        const isDuplicate = anomalies.some(a => a.message.toLowerCase().includes(employee.exceptions!.toLowerCase()));

        if (!isDuplicate) {
          anomalies.push({
            type: 'BACKEND_EXCEPTION',
            severity: 'critical',
            message: employee.exceptions,
            value: 'Server Reported'
          });
        }
      }
    }

    if (employee.employeeName.includes('Omar') || employee.employeeName.includes('Khaled')) {
      console.log(`[AG_DEBUG RESULT] Anomalies for ${employee.employeeName}:`, JSON.stringify(anomalies));
    }
    return anomalies;
  };

  const loadDraftData = async () => {
    if (!runId) return;

    setLoading(true);
    try {
      console.log('📥 Fetching draft data for runId:', runId);
      const response = await payrollExecutionApi.getDraftEmployees(runId);
      console.log('✅ Draft data received:', response.data);
      if (response.data.employees?.length > 0) {
        const firstEmp = response.data.employees[0];
        console.log('🔍 First employee tax breakdown:', firstEmp.taxBreakdown);
        console.log('🔍 First employee gross salary:', firstEmp.grossSalary);
      }
      console.log('✅ First employee raw data:', response.data[0] || response.data.employees?.[0]);

      // Handle both direct array and wrapped response
      const employees = Array.isArray(response.data) ? response.data : response.data.employees || [];

      console.log('👥 Number of employees:', employees.length);
      if (employees.length > 0) {
        console.log('👤 First employee structure:', employees[0]);
        console.log('📝 Employee name from backend:', employees[0].employeeName);
      }

      // Apply anomaly detection to each employee
      const employeesWithAnomalies = employees.map((emp: any, index: number) => {
        console.log('Processing employee:', emp);

        // Use employee data directly from backend response (now includes name, department, bankAccountNumber)
        // Differentiate unknown employees by appending ID suffix
        const rawName = emp.employeeName || 'Unknown Employee';
        const employeeName = rawName === 'Unknown Employee'
          ? `Unknown Employee (${emp.employeeId.toString().slice(-4)})`
          : rawName;

        const department = emp.department || 'Unknown';

        // Extract employee data - handle nested structures
        const employeeData = {
          employeeId: emp.employeeId,
          employeeName: employeeName,
          department: department,
          baseSalary: emp.baseSalary || 0,
          grossSalary: emp.grossSalary || 0,
          taxBreakdown: emp.taxBreakdown || [],
          insurance: emp.insurance || { employeeAmount: 0, employerAmount: 0, total: 0 },
          penalties: emp.penalties || 0,
          overtimePay: emp.overtimePay || 0,
          bonuses: emp.bonuses || 0,
          terminationPayout: emp.terminationPayout || 0,
          totalDeductions: emp.totalDeductions || 0,
          netPay: emp.netPay || 0,
          minimumWageApplied: emp.minimumWageApplied || false,
          bankAccountNumber: emp.bankAccountNumber || undefined,
          status: emp.status,
          managerOverride: emp.managerOverride,
          paymentMethod: emp.paymentMethod,
          exceptions: emp.exceptions, // Explicitly map exceptions
          bankStatus: emp.bankStatus, // Explicitly map bankStatus
          historicalSalary: emp.baseSalary ? emp.baseSalary * 0.95 : 0,
          anomalies: [] as Anomaly[],
        };

        return {
          ...employeeData,
          anomalies: detectAnomalies(employeeData),
        };
      });

      // Calculate anomaly statistics
      let totalAnomalyCount = 0;
      let criticalAnomalyCount = 0;
      employeesWithAnomalies.forEach((emp: DraftEmployee) => {
        if (emp.anomalies) {
          totalAnomalyCount += emp.anomalies.length;
          criticalAnomalyCount += emp.anomalies.filter(a => a.severity === 'critical').length;
        }
      });

      setTotalAnomalies(totalAnomalyCount);
      setCriticalAnomalies(criticalAnomalyCount);

      // Calculate totals
      const totalEmployees = employeesWithAnomalies.length;
      const totalGrossPay = employeesWithAnomalies.reduce((sum: number, emp: DraftEmployee) => sum + (emp.grossSalary || 0), 0);
      const totalDeductions = employeesWithAnomalies.reduce((sum: number, emp: DraftEmployee) => sum + (emp.totalDeductions || 0), 0);
      const totalNetPay = employeesWithAnomalies.reduce((sum: number, emp: DraftEmployee) => sum + (emp.netPay || 0), 0);

      const draftData: DraftData = {
        runId: runId,
        period: response.data.period || 'N/A',
        entity: response.data.entity || 'N/A',
        status: response.data.status || 'DRAFT',
        employees: employeesWithAnomalies,
        totalEmployees,
        totalGrossPay,
        totalDeductions,
        totalNetPay,
      };

      setDraftData(draftData);
    } catch (error: any) {
      console.error('❌ Failed to load draft data:', error);
      toast.error(error.response?.data?.message || 'Failed to load draft data');
    } finally {
      setLoading(false);
    }
  };

  const handleEmployeeClick = async (employee: DraftEmployee) => {
    if (!runId) return;

    // Use a local loading indicator if possible, but for now reuse global processing state
    // to prevent other actions while fetching details.
    setProcessingAction(true);
    try {
      console.log('🔍 Fetching detailed payslip for:', employee.employeeName);
      // Fetch fresh calculation breakdown from backend
      const response = await payrollExecutionApi.getPayslipDetails(employee.employeeId, runId);
      console.log('✅ Detailed payslip loaded:', response.data);
      setSelectedEmployee(response.data);
      setIsPayslipModalOpen(true);
    } catch (error) {
      console.error('❌ Failed to fetch payslip details:', error);
      toast.error('Failed to load detailed breakdown. Showing summary data instead.');
      // Fallback: use the summary data from the list
      setSelectedEmployee(employee);
      setIsPayslipModalOpen(true);
    } finally {
      setProcessingAction(false);
    }
  };

  // === PAYROLL SPECIALIST ACTIONS (REQ-PY-12) ===
  const handlePublishToManager = async () => {
    if (!runId) return;

    // Prevent submission if there are critical anomalies
    if (criticalAnomalies > 0) {
      toast.error('Cannot publish payroll with critical anomalies. Please resolve all critical issues first.');
      return;
    }

    setProcessingAction(true);
    try {
      console.log('📤 Publishing payroll to Manager for review:', runId);
      await payrollExecutionApi.submitForApproval(runId);
      toast.success('Payroll published to Payroll Manager for review');
      router.push('/payroll-execution/history');
    } catch (error: any) {
      console.error('❌ Failed to publish payroll:', error);
      toast.error(error.response?.data?.message || 'Failed to publish payroll');
    } finally {
      setProcessingAction(false);
    }
  };

  // === PAYROLL MANAGER ACTIONS (REQ-PY-22) ===
  const handleManagerApprove = async () => {
    if (!runId) return;

    setProcessingAction(true);
    try {
      console.log('✅ Manager approving payroll:', runId);
      // Fixed: Send 'status' instead of 'action' to match ReviewActionDto
      await payrollExecutionApi.managerReview(runId, { status: 'APPROVED', comment: 'Approved by Payroll Manager' } as any);
      toast.success('Payroll approved. Sent to Finance Staff for final approval.');
      router.push('/payroll-execution/history');
    } catch (error: any) {
      console.error('❌ Failed to approve payroll:', error);
      toast.error(error.response?.data?.message || 'Failed to approve payroll');
    } finally {
      setProcessingAction(false);
    }
  };

  const handleManagerReject = async (reason: string) => {
    if (!runId) return;

    setProcessingAction(true);
    try {
      console.log('❌ Manager rejecting payroll:', runId);
      // Fixed: Send 'status' instead of 'action'
      await payrollExecutionApi.managerReview(runId, { status: 'REJECTED', comment: reason } as any);
      toast.success('Payroll rejected. Specialists have been notified to make corrections.');
      router.push('/payroll-execution/history');
    } catch (error: any) {
      console.error('❌ Failed to reject payroll:', error);
      toast.error(error.response?.data?.message || 'Failed to reject payroll');
    } finally {
      setProcessingAction(false);
    }
  };

  // === FINANCE STAFF ACTIONS (REQ-PY-15) ===
  const handleFinanceApprove = async () => {
    if (!runId) return;

    setProcessingAction(true);
    try {
      console.log('✅ Finance approving payroll:', runId);
      // Fixed: Send 'status' instead of 'action'
      await payrollExecutionApi.financeReview(runId, { status: 'APPROVED', comment: 'Approved by Finance Staff' } as any);
      toast.success('Payroll approved by Finance. Payroll Manager can now lock the payroll.');
      router.push('/payroll-execution/history');
    } catch (error: any) {
      console.error('❌ Failed to approve payroll:', error);
      toast.error(error.response?.data?.message || 'Failed to approve payroll');
    } finally {
      setProcessingAction(false);
    }
  };

  const handleFinanceReject = async (reason: string) => {
    if (!runId) return;

    setProcessingAction(true);
    try {
      console.log('❌ Finance rejecting payroll:', runId);
      // Fixed: Send 'status' instead of 'action'
      await payrollExecutionApi.financeReview(runId, { status: 'REJECTED', comment: reason } as any);
      toast.success('Payroll rejected by Finance. Specialists have been notified to make corrections.');
      router.push('/payroll-execution/history');
    } catch (error: any) {
      console.error('❌ Failed to reject payroll:', error);
      toast.error(error.response?.data?.message || 'Failed to reject payroll');
    } finally {
      setProcessingAction(false);
    }
  };

  // === LOCK/UNFREEZE ACTIONS (REQ-PY-7, REQ-PY-19) ===
  const handleLockPayroll = async () => {
    if (!runId) return;

    setProcessingAction(true);
    try {
      console.log('🔒 Locking payroll:', runId);
      await payrollExecutionApi.lockPayroll(runId);
      toast.success('Payroll locked successfully. Payment status is now PAID.');
      // Reload data to show updated status
      await loadDraftData();
    } catch (error: any) {
      console.error('❌ Failed to lock payroll:', error);
      toast.error(error.response?.data?.message || 'Failed to lock payroll');
    } finally {
      setProcessingAction(false);
    }
  };

  const handleUnfreezePayroll = async (reason: string) => {
    if (!runId) return;

    setProcessingAction(true);
    try {
      console.log('🔓 Unfreezing payroll:', runId);
      await payrollExecutionApi.unfreezePayroll(runId, { reason });
      toast.success('Payroll unfrozen successfully. Payment status reverted to PENDING for corrections.');

      // Optimistic update to verify UI change immediately
      setDraftData((prev) => prev ? { ...prev, status: 'under review' } : null);

      // Reload data to show updated status
      await loadDraftData();
    } catch (error: any) {
      console.error('❌ Failed to unfreeze payroll:', error);
      toast.error(error.response?.data?.message || 'Failed to unfreeze payroll');
    } finally {
      setProcessingAction(false);
    }
  };

  // === CALCULATION ACTIONS ===
  const handleRunCalculation = async () => {
    if (!runId) return;

    setProcessingAction(true);
    try {
      console.log('🔄 Starting calculation sequence for run:', runId);

      // Step 1: Approve Period (Fetch Employees) - Only if not already fetched
      if (draftData?.totalEmployees === 0) {
        console.log('1️⃣ Fetching employees (Approving Period)...');
        await payrollExecutionApi.reviewPeriod({ runId, action: 'APPROVED' });
      }

      // Step 2: Trigger Calculation
      console.log('2️⃣ Running calculations...');
      await payrollExecutionApi.processRunCalculations(runId);

      toast.success('Payroll calculated successfully');
      await loadDraftData();
    } catch (error: any) {
      console.error('❌ Calculation failed:', error);
      toast.error(error.response?.data?.message || 'Calculation failed');
    } finally {
      setProcessingAction(false);
    }
  };

  // === EXECUTION ACTIONS (REQ-PY-8, Phase 5) ===
  const handleExecutePayroll = async () => {
    if (!runId) return;

    setProcessingAction(true);
    try {
      console.log('💸 Executing payroll and distributing payslips:', runId);
      // Calls Phase 5 Execute & Distribute endpoint
      const response = await payrollExecutionApi.executeAndDistribute(runId);
      console.log('✅ Execution Response:', response.data);

      const successMessage = `Payroll executed! ${response.data.distributedCount || 'All'} payslips generated and queued for email.`;
      toast.success(successMessage);

      // Verification helper
      if (response.data.distributedPayslips && response.data.distributedPayslips.length > 0) {
        console.log('📄 Sample PDF URL:', response.data.distributedPayslips[0].distributionChannels.pdf.url);
        toast.info(`Verification: Check console for PDF URL (e.g. ${response.data.distributedPayslips[0].distributionChannels.pdf.url})`);
      }

      await loadDraftData();
    } catch (error: any) {
      console.error('❌ Failed to execute payroll:', error);
      toast.error(error.response?.data?.message || 'Failed to execute payroll');
    } finally {
      setProcessingAction(false);
    }
  };

  // === ANOMALY RESOLUTION (REQ-PY-20) ===
  const handleResolveAnomalies = async (resolutions: Map<string, ResolutionData>) => {
    if (!runId) return;

    setProcessingAction(true);
    try {
      if (!isPayrollManager) {
        throw new Error('Unauthorized: Only Payroll Managers can resolve anomalies');
      }
      console.log('🔧 Manager resolving anomalies:', runId, resolutions);

      // Convert Map to array for API
      const resolutionArray = Array.from(resolutions.values());

      // ACTION: Separate RE_CALCULATE actions from normal resolutions
      const recalcActions = resolutionArray.filter(r => r.action === 'RE_CALCULATE');
      const normalActions = resolutionArray.filter(r => r.action !== 'RE_CALCULATE');

      // 1. Send normal resolutions (Overrides/Defers) to backend first
      if (normalActions.length > 0) {
        console.log('🔧 Submitting normal resolutions:', normalActions);
        await payrollExecutionApi.resolveAnomalies(runId, { resolutions: normalActions });
        toast.success(`Resolved ${normalActions.length} anomalies.`);
      }

      // 2. If RE_CALCULATE was requested, trigger the full run calculation
      if (recalcActions.length > 0) {
        console.log('🔄 Re-calculation requested by manager resolution');
        toast.info('Triggering run re-calculation...');
        // Link to existing calculation logic
        await handleRunCalculation();
      } else {
        // Only reload data if we didn't recalculate (calculation already reloads)
        await loadDraftData();
      }

      setIsResolutionModalOpen(false);
    } catch (error: any) {
      console.error('❌ Failed to resolve anomalies:', error);
      toast.error(error.response?.data?.message || 'Failed to resolve anomalies');
    } finally {
      setProcessingAction(false);
    }
  };

  // Legacy handlers (kept for backward compatibility)
  const handleApproveDraft = handlePublishToManager;
  const handleRejectDraft = () => setIsRejectionModalOpen(true);

  if (loading) {
    return (
      <div className="p-6">
        <Card>
          <CardContent className="flex items-center justify-center py-12">
            <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
            <span className="ml-3 text-gray-600">Loading draft data...</span>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!draftData) {
    return (
      <div className="p-6">
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            Failed to load draft data. Please try again.
          </AlertDescription>
        </Alert>
      </div>
    );
  }



  return (
    <div className="p-6 space-y-6">
      {/* Header with Role-Based Action Buttons */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Payroll Review & Approval</h1>
          <p className="text-gray-500 mt-1">
            {isPayrollSpecialist && 'Review calculated payroll and publish to manager'}
            {isPayrollManager && 'Review payroll, approve/reject, and manage locks'}
            {isFinanceStaff && 'Final approval before payment execution'}
          </p>
        </div>

        {/* Role-Based Action Buttons */}
        <div className="flex gap-3">
          {/* PAYROLL SPECIALIST: Run Calculation (When Draft & Empty or Needs Re-run) */}
          {isPayrollSpecialist && !isPayrollManager && (isDraft || isCalculated || isUnderReview) && (
            <Button
              onClick={handleRunCalculation}
              disabled={processingAction}
              className="bg-indigo-600 hover:bg-indigo-700 text-white"
            >
              {processingAction ? (
                <Loader2 className="w-4 h-4 animate-spin mr-2" />
              ) : (
                <PlayCircle className="w-4 h-4 mr-2" />
              )}
              {draftData?.totalEmployees === 0 ? 'Fetch & Calculate' : 'Re-Calculate'}
            </Button>
          )}

          {/* PAYROLL SPECIALIST: Publish to Manager (REQ-PY-12) - Only show if specialist and NOT manager */}
          {isPayrollSpecialist && !isPayrollManager && (isDraft || isCalculated) && draftData?.totalEmployees > 0 && (
            <Button
              onClick={handlePublishToManager}
              disabled={processingAction || criticalAnomalies > 0}
              className="bg-blue-600 hover:bg-blue-700"
              title={criticalAnomalies > 0 ? 'Cannot publish: Critical anomalies must be resolved first' : 'Publish payroll to Payroll Manager for review'}
            >
              {processingAction ? (
                <Loader2 className="w-4 h-4 animate-spin mr-2" />
              ) : (
                <Send className="w-4 h-4 mr-2" />
              )}
              Publish to Manager
            </Button>
          )}

          {/* PAYROLL MANAGER: Approve/Reject (REQ-PY-22) */}
          {isPayrollManager && (isCalculated || isUnderReview) && !isApproved && !isLocked && (
            <>
              {/* Manager Re-Calculate (during anomaly resolution) */}
              <Button
                onClick={(e) => {
                  e.preventDefault();
                  handleRunCalculation();
                }}
                disabled={processingAction}
                className="bg-blue-600 hover:bg-blue-700 text-white"
                title="Re-run calculations (useful after overriding anomalies)"
              >
                {processingAction ? (
                  <Loader2 className="w-4 h-4 animate-spin mr-2" />
                ) : (
                  <PlayCircle className="w-4 h-4 mr-2" />
                )}
                Re-Calculate
              </Button>
              {totalAnomalies > 0 && isPayrollManager && (
                <Button
                  onClick={() => {
                    setResolutionCandidates((draftData?.employees || []).filter(emp => emp.anomalies && emp.anomalies.length > 0));
                    setIsResolutionModalOpen(true);
                  }}
                  disabled={processingAction}
                  className="bg-orange-600 hover:bg-orange-700 text-white"
                  title="Review and resolve payroll anomalies (REQ-PY-20)"
                >
                  {processingAction ? (
                    <Loader2 className="w-4 h-4 animate-spin mr-2" />
                  ) : (
                    <AlertTriangle className="w-4 h-4 mr-2" />
                  )}
                  Resolve {totalAnomalies} {totalAnomalies === 1 ? 'Anomaly' : 'Anomalies'}
                </Button>
              )}
              <Button
                onClick={() => setIsRejectionModalOpen(true)}
                disabled={processingAction}
                className="bg-red-600 hover:bg-red-700 text-white"
                title="Reject and send back to Payroll Specialist for corrections"
              >
                {processingAction ? (
                  <Loader2 className="w-4 h-4 animate-spin mr-2" />
                ) : (
                  <XCircle className="w-4 h-4 mr-2" />
                )}
                Reject (Back to Draft)
              </Button>
              <Button
                onClick={handleManagerApprove}
                disabled={processingAction}
                className="bg-green-600 hover:bg-green-700 text-white"
                title={totalAnomalies > 0 ? "Cannot approve: All anomalies must be resolved first" : "Approve and send to Finance Staff for final approval"}
              >
                {processingAction ? (
                  <Loader2 className="w-4 h-4 animate-spin mr-2" />
                ) : (
                  <CheckCircle2 className="w-4 h-4 mr-2" />
                )}
                Approve (Send to Finance)
              </Button>
            </>
          )}

          {/* PAYROLL MANAGER: Lock Payroll (REQ-PY-7) */}
          {isPayrollManager && isApproved && (
            <Button
              onClick={handleLockPayroll}
              disabled={processingAction}
              className="bg-purple-600 hover:bg-purple-700 text-white"
              title="Lock payroll to prevent further changes and mark as ready for execution"
            >
              {processingAction ? (
                <Loader2 className="w-4 h-4 animate-spin mr-2" />
              ) : (
                <Lock className="w-4 h-4 mr-2" />
              )}
              Lock Payroll
            </Button>
          )}


          {/* PAYROLL MANAGER: Unfreeze Payroll (REQ-PY-19) */}
          {isPayrollManager && isLocked && (
            <Button
              onClick={() => setIsUnfreezeModalOpen(true)}
              disabled={processingAction}
              className="bg-orange-600 hover:bg-orange-700"
            >
              {processingAction ? (
                <Loader2 className="w-4 h-4 animate-spin mr-2" />
              ) : (
                <Unlock className="w-4 h-4 mr-2" />
              )}
              Unfreeze Payroll
            </Button>
          )}

          {/* FINANCE STAFF: Final Approve/Reject (REQ-PY-15) */}
          {isFinanceStaff && isPendingFinance && (
            <>
              <Button
                onClick={() => setIsRejectionModalOpen(true)}
                disabled={processingAction}
                className="bg-red-600 hover:bg-red-700 text-white"
                title="Reject and send back to Payroll Specialist for corrections"
              >
                {processingAction ? (
                  <Loader2 className="w-4 h-4 animate-spin mr-2" />
                ) : (
                  <XCircle className="w-4 h-4 mr-2" />
                )}
                Reject
              </Button>
              <Button
                onClick={handleFinanceApprove}
                disabled={processingAction}
                className="bg-green-600 hover:bg-green-700 text-white"
                title="Final approval - marks payroll as ready for payment"
              >
                {processingAction ? (
                  <Loader2 className="w-4 h-4 animate-spin mr-2" />
                ) : (
                  <CheckCircle2 className="w-4 h-4 mr-2" />
                )}
                Final Approve (Pay)
              </Button>
            </>
          )}

          {/* PAYROLL SPECIALIST: Execute & Distribute (REQ-PY-8, Phase 5) */}
          {isPayrollSpecialist && !isPayrollManager && isLocked && !isCompleted && (
            <Button
              onClick={handleExecutePayroll}
              disabled={processingAction}
              className="bg-green-700 hover:bg-green-800 text-white"
              title="Generate and distribute payslips (Final Phase)"
            >
              {processingAction ? (
                <Loader2 className="w-4 h-4 animate-spin mr-2" />
              ) : (
                <Send className="w-4 h-4 mr-2" />
              )}
              Execute & Distribute
            </Button>
          )}

          {/* View Only Mode for Locked/Paid Payrolls (Unless Specialist can execute) */}
          {(isExecuted || (isLocked && !isPayrollManager && !isPayrollSpecialist)) && (
            <Badge variant="secondary" className="px-4 py-2 text-sm">
              <Eye className="w-4 h-4 mr-2" />
              {isCompleted ? 'Cycle Completed' : 'View Only Mode'}
            </Badge>
          )}
        </div>
      </div>

      {/* Workflow Status Indicators */}
      <Card className="bg-gradient-to-r from-blue-50 to-indigo-50 border-blue-200">
        <CardContent className="pt-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-6">
              <div className="flex flex-col">
                <span className="text-sm text-gray-600 font-medium">Current Status</span>
                <Badge
                  className={`mt-1 px-3 py-1 ${isLocked ? 'bg-purple-600' :
                    isPaid ? 'bg-green-600' :
                      isPendingFinance ? 'bg-blue-600' :
                        isApproved ? 'bg-blue-500' :
                          isUnderReview ? 'bg-yellow-600' :
                            isCalculated ? 'bg-indigo-500' :
                              'bg-gray-600'
                    }`}
                >
                  {isLocked ? '🔒 Locked' :
                    isPaid ? '✅ Paid' :
                      isPendingFinance ? '⏳ Pending Finance Approval' :
                        isApproved ? '✓ Approved' :
                          isUnderReview ? '👁️ Under Manager Review' :
                            isCalculated ? '📊 Calculated' :
                              '📝 Draft'}
                </Badge>
              </div>

              <div className="h-12 w-px bg-gray-300" />

              <div className="flex flex-col">
                <span className="text-sm text-gray-600 font-medium">Next Approver</span>
                <span className="mt-1 text-sm font-semibold text-gray-800">
                  {isLocked ? 'Payroll Specialist (Execute & Distribute)' :
                    isPaid ? 'Cycle Complete' :
                      isPendingFinance ? 'Finance Staff' :
                        isApproved ? 'Finance Staff' : // Fallback if just 'approved'
                          isUnderReview ? 'Payroll Manager' :
                            isCalculated ? 'Payroll Manager' : // Calculated -> Needs Manager Review
                              'Payroll Specialist (Calculate)'}
                </span>
              </div>

              <div className="h-12 w-px bg-gray-300" />

              <div className="flex flex-col">
                <span className="text-sm text-gray-600 font-medium">Workflow Progress</span>
                <div className="flex items-center gap-2 mt-1">
                  <Badge variant={isDraft || isCalculated || isUnderReview || isPendingFinance || isApproved || isLocked || isPaid ? 'default' : 'secondary'} className="text-xs">
                    1. Specialist
                  </Badge>
                  <span className="text-gray-400">→</span>
                  <Badge variant={isUnderReview || isPendingFinance || isApproved || isLocked || isPaid ? 'default' : 'secondary'} className="text-xs">
                    2. Manager
                  </Badge>
                  <span className="text-gray-400">→</span>
                  <Badge variant={isPendingFinance || isApproved || isLocked || isPaid ? 'default' : 'secondary'} className="text-xs">
                    3. Finance
                  </Badge>
                  <span className="text-gray-400">→</span>
                  <Badge variant={isLocked || isPaid ? 'default' : 'secondary'} className="text-xs">
                    4. Lock
                  </Badge>
                  <span className="text-gray-400">→</span>
                  <Badge variant={isPaid ? 'default' : 'secondary'} className="text-xs">
                    5. Execution
                  </Badge>
                </div>
              </div>
            </div>
          </div>

          {/* Action Required Badge */}
          {criticalAnomalies > 0 && isPayrollSpecialist && (
            <Alert className="max-w-xs border-red-300 bg-red-50">
              <AlertTriangle className="h-4 w-4 text-red-600" />
              <AlertDescription className="text-red-800 text-sm">
                <strong>Action Required:</strong> Resolve {criticalAnomalies} critical {criticalAnomalies === 1 ? 'anomaly' : 'anomalies'} before publishing
              </AlertDescription>
            </Alert>
          )}
        </CardContent>
      </Card>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-gray-500">Period</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{draftData.period}</p>
            <Badge className="mt-2" variant={draftData.status === 'DRAFT' ? 'secondary' : 'default'}>
              {draftData.status}
            </Badge>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-gray-500">Total Employees</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{draftData.totalEmployees}</p>
            <p className="text-sm text-gray-500 mt-1">{draftData.entity}</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-gray-500">Total Gross Pay</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold text-green-600">
              ${draftData.totalGrossPay.toLocaleString()}
            </p>
            <p className="text-sm text-gray-500 mt-1">Before deductions</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-gray-500">Total Net Pay</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold text-blue-600">
              ${draftData.totalNetPay.toLocaleString()}
            </p>
            <p className="text-sm text-red-500 mt-1">
              -${draftData.totalDeductions.toLocaleString()} deductions
            </p>
          </CardContent>
        </Card>

        <Card className={criticalAnomalies > 0 ? 'border-red-300 bg-red-50' : totalAnomalies > 0 ? 'border-yellow-300 bg-yellow-50' : 'border-green-300 bg-green-50'}>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-gray-500">Anomalies</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              {criticalAnomalies > 0 ? (
                <AlertTriangle className="w-6 h-6 text-red-600" />
              ) : totalAnomalies > 0 ? (
                <AlertCircle className="w-6 h-6 text-yellow-600" />
              ) : (
                <CheckCircle2 className="w-6 h-6 text-green-600" />
              )}
              <p className={`text-2xl font-bold ${criticalAnomalies > 0 ? 'text-red-600' : totalAnomalies > 0 ? 'text-yellow-600' : 'text-green-600'}`}>
                {totalAnomalies}
              </p>
            </div>
            {criticalAnomalies > 0 && (
              <p className="text-sm text-red-600 mt-1 font-medium">
                {criticalAnomalies} Critical
              </p>
            )}
            {totalAnomalies === 0 && (
              <p className="text-sm text-green-600 mt-1">
                All Clear
              </p>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Critical Anomalies Warning */}
      {
        criticalAnomalies > 0 && (
          <Alert variant="destructive">
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription className="flex items-center justify-between w-full">
              <span>
                <strong>Action Required:</strong> {criticalAnomalies} critical anomal{criticalAnomalies > 1 ? 'ies' : 'y'} detected.
                You must resolve all critical issues before submitting for approval.
              </span>
              {isPayrollManager && (
                <Button
                  variant="default"
                  size="sm"
                  className="ml-4 h-8 whitespace-nowrap bg-red-600 text-white hover:bg-red-700 border-none"
                  onClick={() => {
                    setResolutionCandidates((draftData?.employees || []).filter(emp => emp.anomalies && emp.anomalies.some(a => a.severity === 'critical')));
                    setIsResolutionModalOpen(true);
                  }}
                >
                  Resolve Critical Issues
                </Button>
              )}
            </AlertDescription>
          </Alert>
        )
      }

      {/* Employee Table */}
      <Card>
        <CardHeader>
          <CardTitle>Employee Payroll Breakdown</CardTitle>
          <p className="text-sm text-gray-500 mt-1">
            Click on any row to view detailed payslip with tax/insurance breakdown
          </p>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b">
                <tr>
                  <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">Employee Name</th>
                  <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">Department</th>
                  <th className="text-right py-3 px-4 text-sm font-semibold text-gray-700">Gross Pay</th>
                  <th className="text-right py-3 px-4 text-sm font-semibold text-gray-700">Deductions</th>
                  <th className="text-right py-3 px-4 text-sm font-semibold text-gray-700">Net Pay</th>
                  <th className="text-center py-3 px-4 text-sm font-semibold text-gray-700">Flags</th>
                  <th className="text-center py-3 px-4 text-sm font-semibold text-gray-700">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {draftData.employees.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="text-center py-8 text-gray-500">
                      No employees found in this draft
                    </td>
                  </tr>
                ) : (
                  draftData.employees.map((employee, index) => {
                    const hasCriticalAnomaly = employee.anomalies?.some(a => a.severity === 'critical');
                    const hasWarningAnomaly = employee.anomalies?.some(a => a.severity === 'warning');
                    const rowBgColor = hasCriticalAnomaly ? 'bg-red-50' : hasWarningAnomaly ? 'bg-yellow-50' : '';

                    return (
                      <React.Fragment key={`${employee.employeeId}-${index}`}>
                        <tr
                          className={`hover:bg-gray-100 cursor-pointer transition-colors ${rowBgColor} ${hasCriticalAnomaly ? 'border-l-4 border-red-500' : hasWarningAnomaly ? 'border-l-4 border-yellow-500' : ''}`}
                          onClick={() => handleEmployeeClick(employee)}
                        >
                          <td className="py-3 px-4">
                            <div className="flex items-center gap-2">
                              <span className="font-medium">{employee.employeeName || 'Unknown'}</span>
                              {employee.minimumWageApplied && (
                                <Badge variant="outline" className="text-xs bg-yellow-50 text-yellow-700 border-yellow-300">
                                  Min Wage
                                </Badge>
                              )}
                            </div>
                          </td>
                          <td className="py-3 px-4 text-gray-600">{employee.department || 'N/A'}</td>
                          <td className="py-3 px-4 text-right font-medium text-green-600">
                            ${employee.grossSalary?.toLocaleString() || '0'}
                          </td>
                          <td className="py-3 px-4 text-right font-medium text-red-600">
                            -${employee.totalDeductions?.toLocaleString() || '0'}
                          </td>
                          <td className={`py-3 px-4 text-right font-semibold ${employee.netPay < 0 ? 'text-red-600' : 'text-blue-600'}`}>
                            ${employee.netPay?.toLocaleString() || '0'}
                          </td>
                          <td className="py-3 px-4 text-center">
                            <div className="flex items-center justify-center gap-1">
                              {employee.anomalies && employee.anomalies.length > 0 && (
                                <>
                                  {employee.anomalies.some(a => a.type === 'NEGATIVE_NET_PAY') && (
                                    <Badge variant="outline" className="bg-red-100 text-red-700 border-red-300" title="Negative Net Pay">
                                      <DollarSign className="w-3 h-3" />
                                    </Badge>
                                  )}
                                  {employee.anomalies.some(a => a.type === 'MISSING_BANK_INFO') && (
                                    <Badge variant="outline" className="bg-red-100 text-red-700 border-red-300" title="Missing Bank Info">
                                      <CreditCard className="w-3 h-3" />
                                    </Badge>
                                  )}
                                  {employee.anomalies.some(a => a.type === 'SALARY_SPIKE') && (
                                    <Badge variant="outline" className="bg-yellow-100 text-yellow-700 border-yellow-300" title="Salary Spike">
                                      <TrendingUp className="w-3 h-3" />
                                    </Badge>
                                  )}
                                  {employee.anomalies.some(a => a.type === 'MISSING_TAX_INFO') && (
                                    <Badge variant="outline" className="bg-yellow-100 text-yellow-700 border-yellow-300" title="Missing Tax Info">
                                      <AlertCircle className="w-3 h-3" />
                                    </Badge>
                                  )}
                                </>
                              )}
                              {(!employee.anomalies || employee.anomalies.length === 0) && (
                                <CheckCircle2 className="w-4 h-4 text-green-600" />
                              )}
                            </div>
                          </td>
                          <td className="py-3 px-4 text-center">
                            <div className="flex items-center justify-center gap-2">
                              {isPayrollManager && employee.anomalies && employee.anomalies.length > 0 && (
                                <Button
                                  variant="outline"
                                  size="sm"
                                  className="text-orange-600 border-orange-200 hover:bg-orange-50"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    setResolutionCandidates([employee]);
                                    setIsResolutionModalOpen(true);
                                  }}
                                >
                                  <AlertTriangle className="w-3 h-3 mr-1" />
                                  Resolve
                                </Button>
                              )}
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleEmployeeClick(employee);
                                }}
                              >
                                <FileText className="w-4 h-4 mr-1" />
                                View Payslip
                              </Button>
                            </div>
                          </td>
                        </tr>
                        {/* Anomaly Details Row */}
                        {
                          employee.anomalies && employee.anomalies.length > 0 && (
                            <tr className={rowBgColor}>
                              <td colSpan={7} className="px-4 py-2">
                                <AnomalyAlerts anomalies={employee.anomalies} employeeName={employee.employeeName} />
                              </td>
                            </tr>
                          )
                        }
                      </React.Fragment>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* Payslip Preview Modal */}
      <PayslipPreviewModal
        isOpen={isPayslipModalOpen}
        onClose={() => setIsPayslipModalOpen(false)}
        payslip={selectedEmployee}
      />

      {/* Unfreeze Modal (REQ-PY-19) */}
      {
        runId && (
          <UnfreezeModal
            isOpen={isUnfreezeModalOpen}
            onClose={() => setIsUnfreezeModalOpen(false)}
            onConfirm={handleUnfreezePayroll}
            runId={runId}
          />
        )
      }

      {/* Rejection Modal (REQ-PY-22 & REQ-PY-15) */}
      {
        runId && (
          <RejectionModal
            isOpen={isRejectionModalOpen}
            onClose={() => setIsRejectionModalOpen(false)}
            onConfirm={isPayrollManager ? handleManagerReject : handleFinanceReject}
            runId={runId}
            rejectorRole={isPayrollManager ? 'Manager' : 'Finance Staff'}
          />
        )
      }

      {/* Anomaly Resolution Modal (REQ-PY-20) */}
      {
        draftData && (
          <ManagerResolutionModal
            isOpen={isResolutionModalOpen}
            onClose={() => setIsResolutionModalOpen(false)}
            employees={resolutionCandidates
              .map(emp => ({
                employeeId: emp.employeeId,
                employeeName: emp.employeeName,
                department: emp.department,
                netPay: emp.netPay,
                anomalies: (emp.anomalies || [])
                  .filter(a => a.severity === 'critical' || a.severity === 'warning')
                  .map(a => ({
                    type: a.type,
                    severity: a.severity as 'critical' | 'warning',
                    message: a.message,
                    suggestion: a.message
                  }))
              }))}
            onResolveAll={handleResolveAnomalies}
          />
        )
      }
    </div >
  );
}
