'use client';

import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { AlertCircle, PlayCircle } from 'lucide-react';

interface StartPayrollCycleModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (period: string, entity: string) => void;
}

export const StartPayrollCycleModal: React.FC<StartPayrollCycleModalProps> = ({
  isOpen,
  onClose,
  onConfirm,
}) => {
  const [period, setPeriod] = useState('');
  const [entity, setEntity] = useState('Office');
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (isOpen) {
      // Calculate default period (current month)
      const now = new Date();
      const year = now.getFullYear();
      const month = String(now.getMonth() + 1).padStart(2, '0');
      setPeriod(`${year}-${month}`);
      setEntity('Office'); // Reset entity
    }
  }, [isOpen]);

  const handleConfirm = async () => {
    if (!period || !entity) {
      return;
    }
    setIsLoading(true);
    try {
      await onConfirm(period, entity);
      onClose();
    } catch (error) {
      console.error('Error starting payroll cycle:', error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[600px] bg-white">
        <DialogHeader>
          <DialogTitle className="text-2xl font-semibold">Start New Payroll Cycle</DialogTitle>
          <DialogDescription className="text-gray-600">
            Configure and initiate a new payroll cycle for employee salary processing
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* Info Box */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 flex items-start gap-3">
            <PlayCircle className="w-5 h-5 text-blue-600 mt-0.5 flex-shrink-0" />
            <p className="text-sm text-blue-900">
              Initiate a new payroll calculation cycle for the specified period.
            </p>
          </div>

          {/* Period Input */}
          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-700">Payroll Period</label>
            <Input
              type="text"
              value={period}
              onChange={(e) => setPeriod(e.target.value)}
              placeholder="YYYY-MM (e.g., 2025-12)"
              className="text-base"
              suppressHydrationWarning
            />
            <div className="flex items-center gap-2 text-xs text-gray-500">
              <AlertCircle className="w-4 h-4" />
              <span>REQ-PY-26: Period can be manually edited</span>
            </div>
          </div>

          {/* Entity Selection */}
          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-700">Organization Entity</label>
            <Select value={entity} onValueChange={setEntity}>
              <SelectTrigger className="w-full" suppressHydrationWarning>
                <SelectValue placeholder="Select entity" />
              </SelectTrigger>
              <SelectContent className="bg-white">
                <SelectItem value="Main Office">Main Office</SelectItem>
                <SelectItem value="Cairo">Cairo</SelectItem>
                <SelectItem value="Alexandria">Alexandria</SelectItem>
                <SelectItem value="Giza">Giza</SelectItem>
              </SelectContent>
            </Select>
            <p className="text-xs text-gray-500">The legal entity or branch for this payroll run</p>
          </div>

          {/* What Happens Next */}
          <div className="bg-gray-50 rounded-lg p-4 space-y-3">
            <h4 className="font-semibold text-gray-900">What happens next?</h4>
            <div className="space-y-2">
              <div className="flex items-start gap-2">
                <div className="w-5 h-5 rounded-full bg-green-100 flex items-center justify-center flex-shrink-0 mt-0.5">
                  <svg className="w-3 h-3 text-green-600" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                  </svg>
                </div>
                <span className="text-sm text-gray-700">System will calculate gross pay for all active employees</span>
              </div>
              <div className="flex items-start gap-2">
                <div className="w-5 h-5 rounded-full bg-green-100 flex items-center justify-center flex-shrink-0 mt-0.5">
                  <svg className="w-3 h-3 text-green-600" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                  </svg>
                </div>
                <span className="text-sm text-gray-700">Apply approved bonuses and severance payments</span>
              </div>
              <div className="flex items-start gap-2">
                <div className="w-5 h-5 rounded-full bg-green-100 flex items-center justify-center flex-shrink-0 mt-0.5">
                  <svg className="w-3 h-3 text-green-600" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                  </svg>
                </div>
                <span className="text-sm text-gray-700">Generate draft payroll for review and validation</span>
              </div>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex justify-end gap-3 pt-4 border-t">
          <Button
            variant="outline"
            onClick={onClose}
            disabled={isLoading}
            suppressHydrationWarning
          >
            Cancel
          </Button>
          <Button
            onClick={handleConfirm}
            disabled={isLoading || !period || !entity}
            className="bg-blue-600 hover:bg-blue-700 text-white"
            suppressHydrationWarning
          >
            <PlayCircle className="w-4 h-4 mr-2" />
            {isLoading ? 'Processing...' : 'Calculate & Generate Draft'}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};
