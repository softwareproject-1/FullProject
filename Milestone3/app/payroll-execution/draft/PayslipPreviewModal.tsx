'use client';

import React from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { DollarSign, TrendingDown, TrendingUp, AlertTriangle } from 'lucide-react';

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

interface PayslipData {
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
  totalDeductions: number;
  netPay: number;
  minimumWageApplied?: boolean;
}

interface PayslipPreviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  payslip: PayslipData | null;
}

export const PayslipPreviewModal: React.FC<PayslipPreviewModalProps> = ({
  isOpen,
  onClose,
  payslip,
}) => {
  if (!payslip) return null;

  const totalTax = (payslip.taxBreakdown || []).reduce((sum, t) => sum + t.amount, 0);

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[700px] max-h-[90vh] overflow-y-auto bg-white">
        <DialogHeader>
          <DialogTitle className="text-2xl font-semibold">Payslip Preview</DialogTitle>
          <DialogDescription>
            Detailed salary breakdown for {payslip.employeeName}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* Employee Info */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-lg">Employee Information</CardTitle>
            </CardHeader>
            <CardContent className="grid grid-cols-2 gap-3 text-sm">
              <div>
                <span className="text-gray-500">Name:</span>
                <p className="font-medium">{payslip.employeeName}</p>
              </div>
              <div>
                <span className="text-gray-500">Department:</span>
                <p className="font-medium">{payslip.department || 'N/A'}</p>
              </div>
              <div>
                <span className="text-gray-500">Employee ID:</span>
                <p className="font-mono text-xs">{payslip.employeeId}</p>
              </div>
              {payslip.minimumWageApplied && (
                <div className="col-span-2">
                  <Badge variant="outline" className="bg-yellow-50 text-yellow-700 border-yellow-300">
                    <AlertTriangle className="w-3 h-3 mr-1" />
                    Minimum Wage Applied (BR 60)
                  </Badge>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Earnings */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-lg flex items-center gap-2">
                <TrendingUp className="w-5 h-5 text-green-600" />
                Earnings
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-600">Base Salary</span>
                <span className="font-medium">${(payslip.baseSalary || 0).toLocaleString()}</span>
              </div>
              {payslip.overtimePay > 0 && (
                <div className="flex justify-between text-green-600">
                  <span>Overtime Pay (1.5x)</span>
                  <span className="font-medium">+${(payslip.overtimePay || 0).toLocaleString()}</span>
                </div>
              )}
              {payslip.bonuses > 0 && (
                <div className="flex justify-between text-green-600">
                  <span>Bonuses</span>
                  <span className="font-medium">+${(payslip.bonuses || 0).toLocaleString()}</span>
                </div>
              )}
              <Separator />
              <div className="flex justify-between font-semibold text-base">
                <span>Gross Salary</span>
                <span>${(payslip.grossSalary || 0).toLocaleString()}</span>
              </div>
            </CardContent>
          </Card>

          {/* Tax Breakdown (BR 59, BR 5, BR 6) */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-lg">Tax Breakdown (Progressive)</CardTitle>
              <p className="text-xs text-gray-500">BR 5, BR 6: Progressive Income Tax</p>
            </CardHeader>
            <CardContent className="space-y-2 text-sm">
              {(payslip.taxBreakdown || []).map((tax, index) => (
                <div key={index} className="flex justify-between items-center">
                  <div>
                    <span className="text-gray-600">{tax.bracket}</span>
                    <Badge variant="secondary" className="ml-2 text-xs">{tax.rate}%</Badge>
                  </div>
                  <span className="font-medium">${(tax.amount || 0).toLocaleString()}</span>
                </div>
              ))}
              <Separator />
              <div className="flex justify-between font-semibold text-red-600">
                <span>Total Tax</span>
                <span>-${(totalTax || 0).toLocaleString()}</span>
              </div>
            </CardContent>
          </Card>

          {/* Insurance Breakdown (BR 59, BR 7, BR 8) */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-lg">Insurance Contributions</CardTitle>
              <p className="text-xs text-gray-500">BR 7, BR 8: Social Insurance Brackets</p>
            </CardHeader>
            <CardContent className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-600">Employee Contribution</span>
                <span className="font-medium">${(payslip.insurance?.employeeAmount || 0).toLocaleString()}</span>
              </div>
              <div className="flex justify-between text-gray-500">
                <span className="text-xs">Employer Contribution (for reference)</span>
                <span className="text-xs">${(payslip.insurance?.employerAmount || 0).toLocaleString()}</span>
              </div>
              <Separator />
              <div className="flex justify-between font-semibold text-red-600">
                <span>Employee Insurance Deduction</span>
                <span>-${(payslip.insurance?.employeeAmount || 0).toLocaleString()}</span>
              </div>
            </CardContent>
          </Card>

          {/* Penalties (BR 59) */}
          {payslip.penalties > 0 && (
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-lg flex items-center gap-2">
                  <AlertTriangle className="w-5 h-5 text-red-600" />
                  Penalties
                </CardTitle>
              </CardHeader>
              <CardContent className="text-sm">
                <div className="flex justify-between font-semibold text-red-600">
                  <span>Total Penalties</span>
                  <span>-${(payslip.penalties || 0).toLocaleString()}</span>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Final Net Pay */}
          <Card className="bg-blue-50 border-blue-200">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Net Pay</p>
                  <p className="text-3xl font-bold text-blue-900">
                    ${(payslip.netPay || 0).toLocaleString()}
                  </p>
                </div>
                <DollarSign className="w-12 h-12 text-blue-600" />
              </div>
              <div className="mt-4 pt-4 border-t border-blue-300">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Total Deductions:</span>
                  <span className="font-medium text-red-600">
                    ${(payslip.totalDeductions || 0).toLocaleString()}
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </DialogContent>
    </Dialog>
  );
};
