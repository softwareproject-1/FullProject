'use client';

import React, { useState } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Loader2, AlertTriangle, Unlock } from 'lucide-react';

interface UnfreezeModalProps {
    isOpen: boolean;
    onClose: () => void;
    onConfirm: (reason: string) => Promise<void>;
    runId: string;
}

export function UnfreezeModal({ isOpen, onClose, onConfirm, runId }: UnfreezeModalProps) {
    const [reason, setReason] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [error, setError] = useState('');

    const handleSubmit = async () => {
        // Validate reason
        if (!reason.trim()) {
            setError('Justification is required to unfreeze a locked payroll');
            return;
        }

        if (reason.trim().length < 20) {
            setError('Justification must be at least 20 characters');
            return;
        }

        setError('');
        setIsSubmitting(true);

        try {
            await onConfirm(reason.trim());
            setReason('');
            onClose();
        } catch (err) {
            setError('Failed to unfreeze payroll. Please try again.');
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
            <DialogContent className="sm:max-w-[600px] bg-white">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2 text-xl">
                        <Unlock className="w-5 h-5 text-orange-600" />
                        Unfreeze Locked Payroll
                    </DialogTitle>
                    <DialogDescription>
                        REQ-PY-19: Unfreeze payroll run <span className="font-semibold">{runId}</span> under exceptional circumstances
                    </DialogDescription>
                </DialogHeader>

                <Alert variant="destructive" className="border-orange-600 bg-orange-50">
                    <AlertTriangle className="h-4 w-4 text-orange-600" />
                    <AlertDescription className="text-orange-800">
                        <strong>Warning:</strong> Unfreezing a locked payroll is an exceptional action that requires manager authority.
                        This will revert the payment status to PENDING and allow corrections.
                    </AlertDescription>
                </Alert>

                <div className="space-y-4 py-4">
                    <div className="space-y-2">
                        <Label htmlFor="unfreeze-reason" className="text-sm font-medium">
                            Justification for Unfreezing <span className="text-red-500">*</span>
                        </Label>
                        <Textarea
                            id="unfreeze-reason"
                            placeholder="Enter detailed justification for unfreezing this payroll (minimum 20 characters)..."
                            value={reason}
                            onChange={(e) => setReason(e.target.value)}
                            rows={6}
                            className="resize-none"
                            disabled={isSubmitting}
                        />
                        <p className="text-xs text-gray-500">
                            {reason.length} / 20 characters minimum
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
                        onClick={handleSubmit}
                        disabled={isSubmitting || reason.trim().length < 20}
                        className="bg-orange-600 hover:bg-orange-700"
                    >
                        {isSubmitting ? (
                            <>
                                <Loader2 className="w-4 h-4 animate-spin mr-2" />
                                Unfreezing...
                            </>
                        ) : (
                            <>
                                <Unlock className="w-4 h-4 mr-2" />
                                Confirm Unfreeze
                            </>
                        )}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
