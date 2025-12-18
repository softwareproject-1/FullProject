'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { ArrowLeft } from 'lucide-react';
import { payrollTrackingApi, CreateDisputeDto } from '@/services/api';
import { toast } from 'sonner';
import Link from 'next/link';

export default function CreateDisputePage() {
    const router = useRouter();
    const [submitting, setSubmitting] = useState(false);
    const [formData, setFormData] = useState<CreateDisputeDto>({
        payslipId: '',
        description: '',
    });

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setSubmitting(true);

        try {
            await payrollTrackingApi.submitDispute(formData);
            toast.success('Dispute submitted successfully');
            router.push('/payroll/payroll-tracking/employee/disputes');
        } catch (err: any) {
            toast.error(err.response?.data?.message || 'Failed to submit dispute');
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <div className="max-w-3xl mx-auto space-y-6">
            <div className="flex items-center gap-4">
                <Link href="/payroll/payroll-tracking/employee/disputes">
                    <Button variant="outline" size="sm">
                        <ArrowLeft className="w-4 h-4 mr-2" />
                        Back
                    </Button>
                </Link>
                <div>
                    <h1 className="text-3xl font-bold text-slate-900">Submit Payroll Dispute</h1>
                    <p className="text-slate-600 mt-1">Report an error in your payslip</p>
                </div>
            </div>

            <Card>
                <CardHeader>
                    <CardTitle>Dispute Information</CardTitle>
                    <CardDescription>
                        Provide details about the payroll error. Your dispute will be reviewed by the payroll
                        specialist team.
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <form onSubmit={handleSubmit} className="space-y-6">
                        <div className="space-y-2">
                            <Label htmlFor="payslipId">
                                Payslip ID <span className="text-red-600">*</span>
                            </Label>
                            <Input
                                id="payslipId"
                                placeholder="Enter the payslip ID (e.g., 65a1b2c3d4e5f6a7b8c9d0e1)"
                                value={formData.payslipId}
                                onChange={(e) => setFormData({ ...formData, payslipId: e.target.value })}
                                required
                            />
                            <p className="text-sm text-slate-500">
                                You can find the payslip ID in your payslip details page
                            </p>
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="description">
                                Detailed Description <span className="text-red-600">*</span>
                            </Label>
                            <Textarea
                                id="description"
                                placeholder="Provide detailed explanation of the issue, including specific amounts and any relevant information..."
                                value={formData.description}
                                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                                rows={8}
                                required
                            />
                            <p className="text-sm text-slate-500">
                                Include specific details, amounts, and any relevant information about the payroll error
                            </p>
                        </div>

                        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                            <p className="text-sm text-blue-800">
                                <strong>Note:</strong> Once submitted, your dispute will be reviewed by the Payroll Specialist
                                team. You will be notified of any updates or resolutions.
                            </p>
                        </div>

                        <div className="flex gap-3 pt-4">
                            <Button type="submit" disabled={submitting} className="flex-1">
                                {submitting ? 'Submitting...' : 'Submit Dispute'}
                            </Button>
                            <Link href="/payroll/payroll-tracking/employee/disputes">
                                <Button type="button" variant="outline">
                                    Cancel
                                </Button>
                            </Link>
                        </div>
                    </form>
                </CardContent>
            </Card>

            {/* Information Card */}
            <Card>
                <CardHeader>
                    <CardTitle>What Happens Next?</CardTitle>
                </CardHeader>
                <CardContent>
                    <ol className="list-decimal list-inside space-y-2 text-sm text-slate-600">
                        <li>Your dispute will be reviewed by a Payroll Specialist</li>
                        <li>If approved by specialist, it escalates to the Payroll Manager for confirmation</li>
                        <li>Once manager approves, Finance Staff will process the refund</li>
                        <li>The refund will automatically appear in your next payslip</li>
                        <li>You'll receive notifications at each step of the process</li>
                    </ol>
                </CardContent>
            </Card>
        </div>
    );
}
