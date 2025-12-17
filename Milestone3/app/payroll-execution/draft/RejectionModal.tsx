'use client';

import React, { useState } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Loader2, AlertTriangle, XCircle } from 'lucide-react';

interface RejectionModalProps {
    isOpen: boolean;
    onClose: () => void;
    onConfirm: (reason: string) => Promise<void>;
    runId: string;
    rejectorRole: 'Manager' | 'Finance Staff';
}

export function RejectionModal({ isOpen, onClose, onConfirm, runId, rejectorRole }: RejectionModalProps) {
    const [reason, setReason] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [error, setError] = useState('');

    const handleSubmit = async () => {
        // Validate reason
        if (!reason.trim()) {
            setError('Rejection reason is required');
            return;
        }

        if (reason.trim().length < 10) {
            setError('Rejection reason must be at least 10 characters');
            return;
        }

        setError('');
        setIsSubmitting(true);

        try {
            await onConfirm(reason.trim());
            setReason('');
            onClose();
        } catch (err) {
            setError('Failed to reject payroll. Please try again.');
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleClose = () => {
        if (!isSubmitting) {
            setReason('');
            setError('');
            onClose();
        }
    };

    return (
        <Dialog open={isOpen} onOpenChange={handleClose}>
            <DialogContent className="sm:max-w-[600px]">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2 text-xl">
                        <XCircle className="w-5 h-5 text-red-600" />
                        Reject Payroll Run
                    </DialogTitle>
                    <DialogDescription>
                        {rejectorRole === 'Manager' ? 'REQ-PY-22' : 'REQ-PY-15'}: Reject payroll run <span className="font-semibold">{runId}</span> and send back for corrections
                    </DialogDescription>
                </DialogHeader>

                <Alert variant="destructive">
                    <AlertTriangle className="h-4 w-4" />
                    <AlertDescription>
                        <strong>Important:</strong> Rejecting this payroll will revert it to draft status and notify
                        Payroll Specialists to make corrections based on your feedback.
                    </AlertDescription>
                </Alert>

                <div className="space-y-4 py-4">
                    <div className="space-y-2">
                        <Label htmlFor="rejection-reason" className="text-sm font-medium">
                            Reason for Rejection <span className="text-red-500">*</span>
                        </Label>
                        <Textarea
                            id="rejection-reason"
                            placeholder="Enter detailed reason for rejection (minimum 10 characters)..."
                            value={reason}
                            onChange={(e) => setReason(e.target.value)}
                            rows={6}
                            className="resize-none"
                            disabled={isSubmitting}
                        />
                        <p className="text-xs text-gray-500">
                            {reason.length} / 10 characters minimum
                        </p>
                    </div>

                    {error && (
                        <Alert variant="destructive">
                            <AlertTriangle className="h-4 w-4" />
                            <AlertDescription>{error}</AlertDescription>
                        </Alert>
                    )}
                </div>

                <DialogFooter>
                    <Button
                        variant="outline"
                        onClick={handleClose}
                        disabled={isSubmitting}
                    >
                        Cancel
                    </Button>
                    <Button
                        variant="destructive"
                        onClick={handleSubmit}
                        disabled={isSubmitting || reason.trim().length < 10}
                    >
                        {isSubmitting ? (
                            <>
                                <Loader2 className="w-4 h-4 animate-spin mr-2" />
                                Rejecting...
                            </>
                        ) : (
                            <>
                                <XCircle className="w-4 h-4 mr-2" />
                                Confirm Rejection
                            </>
                        )}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
