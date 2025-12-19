'use client';

import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import {
  AlertTriangle,
  CheckCircle2,
  XCircle,
  DollarSign,
  CreditCard,
  TrendingUp,
  Loader2
} from 'lucide-react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

interface Anomaly {
  type: string;
  severity: 'critical' | 'warning';
  message: string;
  suggestion?: string;
}

interface Employee {
  employeeId: string;
  employeeName: string;
  department: string;
  anomalies: Anomaly[];
  netPay: number;
}

interface AnomalyResolutionModalProps {
  isOpen: boolean;
  onClose: () => void;
  employees: Employee[];
  onResolveAll: (resolutions: Map<string, ResolutionData>) => Promise<void>;
}

export interface ResolutionData {
  employeeId: string;
  employeeName: string;
  action: 'DEFER_TO_NEXT_RUN' | 'OVERRIDE_PAYMENT_METHOD' | 'REJECT_PAYROLL' | 'RE_CALCULATE';
  justification: string;
  anomalies: Anomaly[];
  overridePaymentMethod?: 'CHEQUE' | 'CASH';
}

export default function ManagerResolutionModal({
  isOpen,
  onClose,
  employees,
  onResolveAll
}: AnomalyResolutionModalProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [resolutions, setResolutions] = useState<Map<string, ResolutionData>>(new Map());
  const [currentAction, setCurrentAction] = useState<'DEFER_TO_NEXT_RUN' | 'OVERRIDE_PAYMENT_METHOD' | 'REJECT_PAYROLL' | 'RE_CALCULATE'>('DEFER_TO_NEXT_RUN');
  const [currentJustification, setCurrentJustification] = useState('');
  const [overridePaymentMethod, setOverridePaymentMethod] = useState<'CHEQUE' | 'CASH'>('CHEQUE');
  const [isProcessing, setIsProcessing] = useState(false);

  const employeesWithAnomalies = employees.filter(emp => emp.anomalies && emp.anomalies.length > 0);
  const currentEmployee = employeesWithAnomalies[currentIndex];
  const totalEmployees = employeesWithAnomalies.length;
  const criticalCount = currentEmployee?.anomalies.filter(a => a.severity === 'critical').length || 0;
  const warningCount = currentEmployee?.anomalies.filter(a => a.severity === 'warning').length || 0;

  const getAnomalyIcon = (type: string) => {
    switch (type) {
      case 'NEGATIVE_NET_PAY': return <DollarSign className="w-5 h-5" />;
      case 'MISSING_BANK_INFO': return <CreditCard className="w-5 h-5" />;
      case 'SALARY_SPIKE': return <TrendingUp className="w-5 h-5" />;
      default: return <AlertTriangle className="w-5 h-5" />;
    }
  };

  const handleNext = () => {
    if (currentJustification.trim().length < 20) {
      // Validation handled by button disabled state
    }

    // Save current resolution
    const resolution: ResolutionData = {
      employeeId: currentEmployee.employeeId,
      employeeName: currentEmployee.employeeName,
      action: currentAction,
      justification: currentJustification,
      anomalies: currentEmployee.anomalies,
      overridePaymentMethod: currentAction === 'OVERRIDE_PAYMENT_METHOD' ? overridePaymentMethod : undefined,
    };

    const newResolutions = new Map(resolutions);
    newResolutions.set(currentEmployee.employeeId, resolution);
    setResolutions(newResolutions);

    // Move to next or finish
    if (currentIndex < totalEmployees - 1) {
      setCurrentIndex(currentIndex + 1);
      setCurrentJustification('');
      setCurrentAction('DEFER_TO_NEXT_RUN');
      setOverridePaymentMethod('CHEQUE');
    } else {
      handleFinish(newResolutions);
    }
  };

  const handleSkip = () => {
    if (currentIndex < totalEmployees - 1) {
      setCurrentIndex(currentIndex + 1);
      setCurrentJustification('');
      setCurrentAction('DEFER_TO_NEXT_RUN');
      setOverridePaymentMethod('CHEQUE');
    } else {
      // If skipping the last employee, finish the process with accumulated resolutions
      handleFinish(resolutions);
    }
  };

  const handleFinish = async (finalResolutions: Map<string, ResolutionData>) => {
    setIsProcessing(true);
    try {
      await onResolveAll(finalResolutions);
      onClose();
    } catch (error) {
      console.error('Error resolving anomalies:', error);
    } finally {
      setIsProcessing(false);
    }
  };

  if (!currentEmployee) {
    return null;
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-3xl w-full max-h-[90vh] overflow-y-auto p-0 gap-0 bg-gray-50/50">

        {/* Header */}
        <div className="bg-white p-6 border-b">
          <DialogHeader>
            <div className="flex items-center justify-between">
              <DialogTitle className="flex items-center gap-2 text-xl text-gray-900">
                <div className="bg-orange-100 p-2 rounded-full">
                  <AlertTriangle className="w-6 h-6 text-orange-600" />
                </div>
                Resolve Anomalies
              </DialogTitle>
              <Badge variant="secondary" className="text-sm px-3 py-1">
                {currentIndex + 1} / {totalEmployees} Employees
              </Badge>
            </div>
            <DialogDescription className="mt-2 text-base text-gray-500">
              Managerial review required for payroll exceptions (REQ-PY-20).
            </DialogDescription>
          </DialogHeader>
        </div>

        <div className="p-6 space-y-6">

          {/* Employee Card */}
          <div className="bg-white rounded-xl border shadow-sm overflow-hidden">
            <div className="p-5 border-b bg-slate-50/50 flex items-center justify-between">
              <div>
                <h3 className="text-lg font-bold text-gray-900">{currentEmployee.employeeName}</h3>
                <div className="flex items-center gap-2 text-sm text-gray-500 mt-0.5">
                  <Badge variant="outline" className="bg-white text-gray-600 border-gray-300 font-normal">{currentEmployee.department || 'No Dept'}</Badge>
                  <span>ID: {currentEmployee.employeeId.slice(0, 8)}</span>
                </div>
              </div>
              <div className="text-right">
                <div className="text-sm text-gray-500">Net Pay</div>
                <div className="text-xl font-bold text-green-700">${currentEmployee.netPay.toLocaleString()}</div>
              </div>
            </div>

            <div className="p-5 bg-white">
              <h4 className="text-sm font-semibold text-gray-900 mb-4 uppercase tracking-wider">Detected Issues</h4>
              <div className="space-y-3">
                {currentEmployee.anomalies.map((anomaly, idx) => (
                  <div key={idx} className={`flex gap-4 p-4 rounded-lg border ${anomaly.severity === 'critical' ? 'bg-red-50 border-red-100' : 'bg-yellow-50 border-yellow-100'}`}>
                    <div className={`shrink-0 mt-0.5 p-2 rounded-full bg-white border shadow-sm ${anomaly.severity === 'critical' ? 'text-red-600 border-red-100' : 'text-yellow-600 border-yellow-100'}`}>
                      {getAnomalyIcon(anomaly.type)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between">
                        <h5 className={`font-bold text-base ${anomaly.severity === 'critical' ? 'text-red-900' : 'text-yellow-900'}`}>{anomaly.message}</h5>
                        <Badge variant={anomaly.severity === 'critical' ? 'destructive' : 'default'} className={`ml-2 shrink-0 ${anomaly.severity === 'warning' ? 'bg-yellow-500 hover:bg-yellow-600' : ''}`}>
                          {anomaly.severity}
                        </Badge>
                      </div>
                      {anomaly.suggestion && anomaly.suggestion !== anomaly.message && (
                        <div className="mt-2 flex gap-2 text-sm text-gray-700 bg-white/60 p-2 rounded border border-black/5">
                          <span className="shrink-0">💡</span>
                          <span>{anomaly.suggestion}</span>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Resolution Form */}
          <div className="bg-white rounded-xl border shadow-sm p-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              {/* Left Column: Action */}
              <div className="space-y-4">
                <div className="space-y-2">
                  <label className="text-sm font-bold text-gray-900">Resolution Action</label>
                  <Select value={currentAction} onValueChange={(value: any) => setCurrentAction(value)}>
                    <SelectTrigger className="w-full h-11 bg-white border-gray-300">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="max-h-[300px] bg-white z-[100]" position="popper" side="bottom" align="start">
                      <SelectItem value="DEFER_TO_NEXT_RUN" className="py-3 bg-white hover:bg-gray-50 focus:bg-gray-50">
                        <span className="font-semibold block mb-0.5">Defer to Next Run</span>
                        <span className="text-xs text-gray-500">Skip this payroll cycle</span>
                      </SelectItem>
                      {!currentEmployee?.anomalies.some(a => a.type === 'NEGATIVE_NET_PAY' || a.type === 'MISSING_TAX_INFO') && (
                        <SelectItem value="OVERRIDE_PAYMENT_METHOD" className="py-3 bg-white hover:bg-gray-50 focus:bg-gray-50">
                          <span className="font-semibold block mb-0.5">Override Method</span>
                          <span className="text-xs text-gray-500">Pay via Cheque/Cash</span>
                        </SelectItem>
                      )}

                      {currentEmployee?.anomalies.some(a => a.type === 'MISSING_TAX_INFO') && (
                        <SelectItem value="RE_CALCULATE" className="py-3 bg-white hover:bg-gray-50 focus:bg-gray-50">
                          <span className="font-semibold block mb-0.5 text-blue-600">Re-Calculate</span>
                          <span className="text-xs text-blue-500">Retry calculation for run</span>
                        </SelectItem>
                      )}

                      <SelectItem value="REJECT_PAYROLL" className="py-3 text-red-600 focus:text-red-600 bg-white hover:bg-gray-50 focus:bg-gray-50">
                        <span className="font-semibold block mb-0.5">Reject Entire Payroll</span>
                        <span className="text-xs text-red-400">Return to draft</span>
                      </SelectItem>
                    </SelectContent>
                  </Select>
                  {currentEmployee?.anomalies.some(a => a.type === 'NEGATIVE_NET_PAY') && (
                    <p className="text-xs text-amber-600 mt-1">
                      ⚠️ Negative Pay cannot be paid. Must defer.
                    </p>
                  )}
                </div>

                {/* Conditional Payment Override */}
                {currentAction === 'OVERRIDE_PAYMENT_METHOD' && (
                  <div className="space-y-2 p-3 bg-blue-50 rounded-lg border border-blue-100 animate-in fade-in slide-in-from-top-1">
                    <label className="text-xs font-semibold text-blue-800 uppercase">New Payment Method</label>
                    <Select value={overridePaymentMethod} onValueChange={(value: any) => setOverridePaymentMethod(value)}>
                      <SelectTrigger className="w-full bg-white h-9 text-sm">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent className="bg-white z-[100] shadow-md border border-gray-100">
                        <SelectItem value="CHEQUE" className="cursor-pointer hover:bg-gray-50 bg-white">Cheque</SelectItem>
                        <SelectItem value="CASH" className="cursor-pointer hover:bg-gray-50 bg-white">Cash</SelectItem>
                        <SelectItem value="WIRE_TRANSFER" className="cursor-pointer hover:bg-gray-50 bg-white">Wire Transfer</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                )}

                {/* Contextual Info - Simplified */}
                <div className="text-sm text-gray-500 bg-gray-50 p-3 rounded border border-gray-100">
                  {currentAction === 'DEFER_TO_NEXT_RUN' && "Employee will be unpaid this cycle. Resolves anomaly."}
                  {currentAction === 'OVERRIDE_PAYMENT_METHOD' && `Payment will be issued via ${overridePaymentMethod}. Needs manual processing.`}
                  {currentAction === 'RE_CALCULATE' && "Triggers calculation for the entire run. May restore deferred employees."}
                  {currentAction === 'REJECT_PAYROLL' && "Stops the entire process for all employees. Proceed with caution."}
                </div>
              </div>

              {/* Right Column: Justification */}
              <div className="space-y-2">
                <div className="flex justify-between">
                  <label className="text-sm font-bold text-gray-900">Justification</label>
                  <span className={`text-xs ${currentJustification.trim().length < 20 ? 'text-red-500' : 'text-green-600'}`}>
                    {currentJustification.trim().length} / 20 chars
                  </span>
                </div>
                <Textarea
                  value={currentJustification}
                  onChange={(e) => setCurrentJustification(e.target.value)}
                  placeholder="Explain why this action is being taken..."
                  className="min-h-[120px] resize-none bg-white border-gray-300 focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                />
              </div>
            </div>
          </div>

        </div>

        {/* Footer */}
        <div className="bg-gray-50 p-4 border-t flex justify-between items-center">
          <Button variant="ghost" onClick={handleSkip} disabled={isProcessing} className="text-gray-500 hover:text-gray-700">
            {currentIndex < totalEmployees - 1 ? 'Skip Employee' : 'Skip & Finish'}
          </Button>

          <div className="flex gap-3">
            <Button variant="outline" onClick={onClose} disabled={isProcessing}>
              Cancel
            </Button>
            <Button
              onClick={handleNext}
              disabled={currentJustification.trim().length < 20 || isProcessing}
              className={currentIndex < totalEmployees - 1 ? "bg-blue-600 hover:bg-blue-700 text-white" : "bg-green-600 hover:bg-green-700 text-white"}
            >
              {isProcessing ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : null}
              {currentIndex < totalEmployees - 1 ? 'Next Decision' : 'Complete Review'}
            </Button>
          </div>
        </div>

      </DialogContent>
    </Dialog >
  );
}
