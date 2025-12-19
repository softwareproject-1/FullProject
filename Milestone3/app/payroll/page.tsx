'use client'

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Card } from '../../components/Card';
import { DataTable } from '../../components/DataTable';
import { StatusBadge } from '../../components/StatusBadge';
import { Modal } from '../../components/Modal';
import { DollarSign, Settings, PlayCircle, Download, AlertCircle, CheckCircle2, UserCheck } from 'lucide-react';
import { mockPayGrades, mockTaxRules, mockPayrollRuns, mockPayslips } from '../../lib/api';
import type { Payslip, PayrollRun } from '../../lib/types';
import { useAuth } from '@/contexts/AuthContext';
import { hasRole, SystemRole, hasFeature } from '@/utils/roleAccess';
import RouteGuard from '@/components/RouteGuard';

// Fallback for undefined mock data
const safePayGrades = mockPayGrades || [];
const safeTaxRules = mockTaxRules || [];
const safePayrollRuns = mockPayrollRuns || [];
const safePayslips = mockPayslips || [];

export default function Payroll() {
  const router = useRouter();
  const { user, loading } = useAuth();
  const [currentView, setCurrentView] = useState<'config' | 'run' | 'payslips'>('config');
  const [wizardStep, setWizardStep] = useState<'draft' | 'validate' | 'approve'>('draft');
  const [selectedPayroll, setSelectedPayroll] = useState<PayrollRun | null>(safePayrollRuns[1] || null); // Draft payroll

  // Check if user is Payroll Specialist, Finance Staff, or Payroll Manager
  const isPayrollManager = user ? hasRole(user.roles, SystemRole.PAYROLL_MANAGER) : false;
  const isPayrollSpecialist = user ? hasRole(user.roles, SystemRole.PAYROLL_SPECIALIST) : false;
  const isFinanceStaff = user ? hasRole(user.roles, SystemRole.FINANCE_STAFF) : false;
  const isViewOnly = isPayrollSpecialist || isFinanceStaff;
  const canEditPayroll = user ? hasFeature(user.roles, "editPayroll") : false;

  // Automatically redirect to role-specific dashboard
  useEffect(() => {
    if (!loading && user) {
      // Redirect based on role priority: Manager > Specialist > Finance
      if (isPayrollManager) {
        router.replace('/payroll/payroll-tracking/manager');
        return;
      }
      if (isPayrollSpecialist) {
        router.replace('/payroll/payroll-tracking/specialist');
        return;
      }
      if (isFinanceStaff) {
        router.replace('/payroll/payroll-tracking/finance');
        return;
      }
    }
  }, [loading, user, isPayrollManager, isPayrollSpecialist, isFinanceStaff, router]);

  // Restrict view-only users (Payroll Specialists and Finance Staff) to view-only views
  useEffect(() => {
    if (isViewOnly && currentView === 'run') {
      // Redirect to config view if they somehow get to run view
      setCurrentView('config');
    }
  }, [isViewOnly, currentView]);

  // Show loading while redirecting to role-specific dashboard
  if (loading || isPayrollManager || isPayrollSpecialist || isFinanceStaff) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-slate-600">Redirecting to your dashboard...</p>
        </div>
      </div>
    );
  }

  const payslipsForRun = selectedPayroll
    ? safePayslips.filter((slip) => slip.payrollRunId === selectedPayroll.id)
    : [];

  const payslipsWithErrors = payslipsForRun.filter((slip) => slip.errors && slip.errors.length > 0);

  const handleApprovePayroll = () => {
    console.log('Approving payroll:', selectedPayroll?.id);
    alert('Payroll has been frozen and approved for payment!');
    setWizardStep('draft');
  };

  const payslipColumns = [
    { header: 'Employee', accessor: 'employeeName' as const },
    {
      header: 'Gross Salary',
      accessor: (row: Payslip) => <span className="text-slate-900">${row.grossSalary.toLocaleString()}</span>,
    },
    {
      header: 'Deductions',
      accessor: (row: Payslip) => (
        <span className="text-red-600">-${(row.tax + row.insurance + row.penalties).toLocaleString()}</span>
      ),
    },
    {
      header: 'Bonuses',
      accessor: (row: Payslip) => (
        <span className="text-green-600">+${row.bonuses.toLocaleString()}</span>
      ),
    },
    {
      header: 'Net Salary',
      accessor: (row: Payslip) => <span className="text-slate-900">${row.netSalary.toLocaleString()}</span>,
    },
    {
      header: 'Status',
      accessor: (row: Payslip) => (
        row.errors && row.errors.length > 0 ? (
          <StatusBadge status="Error" variant="danger" />
        ) : (
          <StatusBadge status="Valid" variant="success" />
        )
      ),
    },
  ];

  const employeePayslipColumns = [
    { header: 'Month', accessor: 'month' as const },
    { header: 'Year', accessor: (row: Payslip) => row.year.toString() },
    {
      header: 'Net Salary',
      accessor: (row: Payslip) => <span className="text-slate-900">${row.netSalary.toLocaleString()}</span>,
    },
    {
      header: 'Bank Account',
      accessor: (row: Payslip) => <span className="text-slate-600">{row.bankAccount || 'N/A'}</span>,
    },
    {
      header: 'Actions',
      accessor: () => (
        <button className="text-blue-600 hover:text-blue-700 flex items-center gap-1">
          <Download className="w-4 h-4" />
          Download PDF
        </button>
      ),
    },
  ];

  return (
    <RouteGuard requiredRoute="/payroll" requiredRoles={["Payroll Manager", "Payroll Specialist", "Finance Staff"]}>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-slate-900 mb-2">Payroll Management</h1>
            <p className="text-slate-600">
              {isViewOnly
                ? "View payroll information (Read-only)"
                : "Configure, process, and manage payroll"}
            </p>
          </div>

          <div className="flex gap-2">
            <button
              onClick={() => setCurrentView('config')}
              className={`px-4 py-2 rounded-lg transition-colors ${currentView === 'config'
                ? 'bg-slate-900 text-white'
                : 'bg-white text-slate-700 border border-slate-300 hover:bg-slate-50'
                }`}
            >
              <Settings className="w-4 h-4 inline mr-2" />
              Configuration
            </button>
            {!isViewOnly && (
              <button
                onClick={() => setCurrentView('run')}
                className={`px-4 py-2 rounded-lg transition-colors ${currentView === 'run'
                  ? 'bg-slate-900 text-white'
                  : 'bg-white text-slate-700 border border-slate-300 hover:bg-slate-50'
                  }`}
              >
                <PlayCircle className="w-4 h-4 inline mr-2" />
                Run Payroll
              </button>
            )}
            <button
              onClick={() => setCurrentView('payslips')}
              className={`px-4 py-2 rounded-lg transition-colors ${currentView === 'payslips'
                ? 'bg-slate-900 text-white'
                : 'bg-white text-slate-700 border border-slate-300 hover:bg-slate-50'
                }`}
            >
              <Download className="w-4 h-4 inline mr-2" />
              My Payslips
            </button>
            {isFinanceStaff && (
              <button
                onClick={() => window.location.href = '/payroll/payroll-tracking/finance'}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                <DollarSign className="w-4 h-4 inline mr-2" />
                Finance Dashboard
              </button>
            )}
            {isPayrollSpecialist && (
              <button
                onClick={() => window.location.href = '/payroll/payroll-tracking/specialist'}
                className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
              >
                <UserCheck className="w-4 h-4 inline mr-2" />
                Specialist Dashboard
              </button>
            )}
            {user && hasRole(user.roles, SystemRole.PAYROLL_MANAGER) && (
              <button
                onClick={() => window.location.href = '/payroll/payroll-tracking/manager'}
                className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
              >
                <UserCheck className="w-4 h-4 inline mr-2" />
                Manager Dashboard
              </button>
            )}
          </div>
        </div>

        {currentView === 'config' && (
          <div className="space-y-6">
            <Card title="Pay Grades">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-slate-50 border-b border-slate-200">
                    <tr>
                      <th className="px-6 py-3 text-left text-slate-700">Pay Grade</th>
                      <th className="px-6 py-3 text-left text-slate-700">Base Salary</th>
                      <th className="px-6 py-3 text-left text-slate-700">Gross Salary</th>
                      <th className="px-6 py-3 text-left text-slate-700">Status</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-slate-200">
                    {safePayGrades.map((grade) => (
                      <tr key={grade._id}>
                        <td className="px-6 py-4 text-slate-900">{grade.grade}</td>
                        <td className="px-6 py-4 text-slate-900">${grade.baseSalary?.toLocaleString() || 'N/A'}</td>
                        <td className="px-6 py-4 text-slate-900">${grade.grossSalary?.toLocaleString() || 'N/A'}</td>
                        <td className="px-6 py-4"><StatusBadge status={grade.status} /></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </Card>

            <Card title="Tax Rules & Insurance">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-slate-50 border-b border-slate-200">
                    <tr>
                      <th className="px-6 py-3 text-left text-slate-700">Rule Name</th>
                      <th className="px-6 py-3 text-left text-slate-700">Tax Type</th>
                      <th className="px-6 py-3 text-left text-slate-700">Rate</th>
                      <th className="px-6 py-3 text-left text-slate-700">Status</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-slate-200">
                    {safeTaxRules.map((rule) => (
                      <tr key={rule._id}>
                        <td className="px-6 py-4 text-slate-900">{rule.name}</td>
                        <td className="px-6 py-4 text-slate-900">{rule.taxType}</td>
                        <td className="px-6 py-4 text-slate-900">{rule.rate}%</td>
                        <td className="px-6 py-4"><StatusBadge status={rule.status} /></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </Card>
          </div>
        )}

        {currentView === 'run' && (
          <div className="space-y-6">
            {/* Wizard Steps */}
            <Card>
              <div className="flex items-center justify-between mb-6">
                {['draft', 'validate', 'approve'].map((step, index) => (
                  <div key={step} className="flex items-center flex-1">
                    <div className="flex items-center gap-3">
                      <div
                        className={`w-10 h-10 rounded-full flex items-center justify-center ${wizardStep === step
                          ? 'bg-blue-600 text-white'
                          : index < ['draft', 'validate', 'approve'].indexOf(wizardStep)
                            ? 'bg-green-600 text-white'
                            : 'bg-slate-200 text-slate-600'
                          }`}
                      >
                        {index < ['draft', 'validate', 'approve'].indexOf(wizardStep) ? (
                          <CheckCircle2 className="w-5 h-5" />
                        ) : (
                          <span>{index + 1}</span>
                        )}
                      </div>
                      <span className="text-slate-900 capitalize">{step}</span>
                    </div>
                    {index < 2 && (
                      <div className="flex-1 h-1 mx-4 bg-slate-200">
                        <div
                          className={`h-1 ${index < ['draft', 'validate', 'approve'].indexOf(wizardStep)
                            ? 'bg-green-600'
                            : 'bg-slate-200'
                            }`}
                        />
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </Card>

            {/* Draft Step */}
            {wizardStep === 'draft' && (
              <Card
                title={`Draft Payroll - ${selectedPayroll?.month} ${selectedPayroll?.year}`}
                action={
                  !isViewOnly && (
                    <button
                      onClick={() => setWizardStep('validate')}
                      className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                    >
                      Proceed to Validation
                    </button>
                  )
                }
              >
                <div className="grid grid-cols-4 gap-4 mb-6">
                  <div className="p-4 bg-slate-50 rounded-lg">
                    <p className="text-slate-600 mb-1">Total Employees</p>
                    <p className="text-slate-900">{selectedPayroll?.employeeCount}</p>
                  </div>
                  <div className="p-4 bg-green-50 rounded-lg">
                    <p className="text-slate-600 mb-1">Total Gross</p>
                    <p className="text-green-600">${selectedPayroll?.totalGross.toLocaleString()}</p>
                  </div>
                  <div className="p-4 bg-blue-50 rounded-lg">
                    <p className="text-slate-600 mb-1">Total Net</p>
                    <p className="text-blue-600">${selectedPayroll?.totalNet.toLocaleString()}</p>
                  </div>
                  <div className="p-4 bg-amber-50 rounded-lg">
                    <p className="text-slate-600 mb-1">Deductions</p>
                    <p className="text-amber-600">
                      ${((selectedPayroll?.totalGross || 0) - (selectedPayroll?.totalNet || 0)).toLocaleString()}
                    </p>
                  </div>
                </div>

                <DataTable data={payslipsForRun} columns={payslipColumns} />
              </Card>
            )}

            {/* Validation Step */}
            {wizardStep === 'validate' && (
              <div className="space-y-6">
                {payslipsWithErrors.length > 0 && (
                  <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
                    <div className="flex items-start gap-3">
                      <AlertCircle className="w-5 h-5 text-red-600 mt-0.5" />
                      <div>
                        <p className="text-red-800 mb-2">
                          <strong>{payslipsWithErrors.length} Error(s) Found</strong>
                        </p>
                        {payslipsWithErrors.map((slip) => (
                          <div key={slip.id} className="mb-2">
                            <p className="text-red-700">
                              {slip.employeeName}: {slip.errors?.join(', ')}
                            </p>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                )}

                {payslipsWithErrors.length === 0 && (
                  <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
                    <div className="flex items-center gap-3">
                      <CheckCircle2 className="w-5 h-5 text-green-600" />
                      <p className="text-green-800">
                        All payslips validated successfully! No errors found.
                      </p>
                    </div>
                  </div>
                )}

                <Card title="Validation Results">
                  <DataTable data={payslipsForRun} columns={payslipColumns} />
                </Card>

                {!isViewOnly && (
                  <div className="flex justify-between">
                    <button
                      onClick={() => setWizardStep('draft')}
                      className="px-4 py-2 border border-slate-300 text-slate-700 rounded-lg hover:bg-slate-50 transition-colors"
                    >
                      Back to Draft
                    </button>
                    <button
                      onClick={() => setWizardStep('approve')}
                      disabled={payslipsWithErrors.length > 0}
                      className={`px-4 py-2 rounded-lg transition-colors ${payslipsWithErrors.length > 0
                        ? 'bg-slate-300 text-slate-500 cursor-not-allowed'
                        : 'bg-green-600 text-white hover:bg-green-700'
                        }`}
                    >
                      Proceed to Approval
                    </button>
                  </div>
                )}
              </div>
            )}

            {/* Approval Step */}
            {wizardStep === 'approve' && (
              <div className="space-y-6">
                <div className="p-6 bg-blue-50 border border-blue-200 rounded-lg">
                  <h3 className="text-slate-900 mb-4">Final Review</h3>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-slate-600">Payroll Period</p>
                      <p className="text-slate-900">{selectedPayroll?.month} {selectedPayroll?.year}</p>
                    </div>
                    <div>
                      <p className="text-slate-600">Employees</p>
                      <p className="text-slate-900">{selectedPayroll?.employeeCount}</p>
                    </div>
                    <div>
                      <p className="text-slate-600">Total Payout</p>
                      <p className="text-green-600">${selectedPayroll?.totalNet.toLocaleString()}</p>
                    </div>
                    <div>
                      <p className="text-slate-600">Status</p>
                      <StatusBadge status="Ready for Approval" variant="warning" />
                    </div>
                  </div>
                </div>

                <div className="p-4 bg-amber-50 border border-amber-200 rounded-lg">
                  <p className="text-amber-800">
                    <strong>Warning:</strong> Once approved, this payroll will be frozen and cannot be modified. Ensure all information is correct before proceeding.
                  </p>
                </div>

                <Card title="Payroll Summary">
                  <DataTable data={payslipsForRun} columns={payslipColumns} />
                </Card>

                {!isViewOnly && (
                  <div className="flex justify-between">
                    <button
                      onClick={() => setWizardStep('validate')}
                      className="px-4 py-2 border border-slate-300 text-slate-700 rounded-lg hover:bg-slate-50 transition-colors"
                    >
                      Back to Validation
                    </button>
                    <button
                      onClick={handleApprovePayroll}
                      className="px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors flex items-center gap-2"
                    >
                      <CheckCircle2 className="w-5 h-5" />
                      Freeze & Pay
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {currentView === 'payslips' && (
          <Card
            title="My Payslips"
            action={
              <div className="flex items-center gap-2">
                <DollarSign className="w-5 h-5 text-green-600" />
                <span className="text-slate-900">Total YTD: $102,900</span>
              </div>
            }
          >
            <DataTable
              data={safePayslips.filter((slip) => slip.employeeId === 'emp001')}
              columns={employeePayslipColumns}
            />
          </Card>
        )}
      </div>
    </RouteGuard>
  );
}