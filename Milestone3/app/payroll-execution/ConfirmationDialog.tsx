'use client';

import React from 'react';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { AlertTriangle, CheckCircle } from 'lucide-react';

interface ConfirmationDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (reason?: string) => void;
  title: string;
  description: string;
  confirmText: string;
  cancelText?: string;
  variant?: 'approve' | 'reject';
  requiresReason?: boolean;
  benefitDetails?: {
    employeeName: string;
    amount: number;
    type: string;
  };
}

export const ConfirmationDialog: React.FC<ConfirmationDialogProps> = ({
  isOpen,
  onClose,
  onConfirm,
  title,
  description,
  confirmText,
  cancelText = 'Cancel',
  variant = 'approve',
  requiresReason = false,
  benefitDetails,
}) => {
  const [reason, setReason] = React.useState('');

  const handleConfirm = () => {
    if (requiresReason) {
      onConfirm(reason);
    } else {
      onConfirm();
    }
    setReason('');
  };

  const handleClose = () => {
    setReason('');
    onClose();
  };

  return (
    <AlertDialog open={isOpen} onOpenChange={handleClose}>
      <AlertDialogContent className="bg-white">
        <AlertDialogHeader>
          <AlertDialogTitle className="flex items-center gap-2">
            {variant === 'approve' ? (
              <CheckCircle className="w-5 h-5 text-green-600" />
            ) : (
              <AlertTriangle className="w-5 h-5 text-red-600" />
            )}
            {title}
          </AlertDialogTitle>
          <AlertDialogDescription className="text-left">
            {description}
          </AlertDialogDescription>
        </AlertDialogHeader>

        {benefitDetails && (
          <div className="my-4 p-4 bg-gray-50 rounded-md space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-gray-600">Employee:</span>
              <span className="font-medium">{benefitDetails.employeeName}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-gray-600">Type:</span>
              <span className="font-medium">{benefitDetails.type}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-gray-600">Amount:</span>
              <span className="font-semibold text-lg">${benefitDetails.amount.toLocaleString()}</span>
            </div>
          </div>
        )}

        {requiresReason && (
          <div className="space-y-2">
            <Label htmlFor="reason">Reason {variant === 'reject' ? '(Required)' : '(Optional)'}</Label>
            <Textarea
              id="reason"
              placeholder={`Enter reason for ${variant === 'approve' ? 'approval' : 'rejection'}...`}
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              rows={3}
              className="resize-none"
            />
          </div>
        )}

        <AlertDialogFooter>
          <AlertDialogCancel onClick={handleClose}>{cancelText}</AlertDialogCancel>
          <AlertDialogAction
            onClick={handleConfirm}
            disabled={requiresReason && variant === 'reject' && !reason.trim()}
            className={
              variant === 'approve'
                ? 'bg-green-600 hover:bg-green-700'
                : 'bg-red-600 hover:bg-red-700'
            }
          >
            {confirmText}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
};
