'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { ArrowLeft, Loader2, CheckCircle, XCircle } from 'lucide-react';
import { payrollSpecialistApi, DisputeDto, PayslipDto } from '@/services/api';
import StatusBadge from '@/components/payroll/StatusBadge';
import { toast } from 'sonner';
import Link from 'next/link';

export default function SpecialistDisputeDetailPage() {
    const params = useParams();
    const router = useRouter();
    const disputeId = params.id as string;

    const [dispute, setDispute] = useState<DisputeDto | null>(null);
    const [payslip, setPayslip] = useState<PayslipDto | null>(null);
    const [loading, setLoading] = useState(true);
    const [decision, setDecision] = useState<'APPROVE' | 'REJECT'>('APPROVE');
    const [comments, setComments] = useState('');
    const [submitting, setSubmitting] = useState(false);

    useEffect(() => {
        fetchDisputeDetails();
    }, [disputeId]);

    const fetchDisputeDetails = async () => {
        try {
            const response = await payrollSpecialistApi.getDispute(disputeId);
            setDispute(response.data);
            // Fetch related payslip for context
            // const payslipResponse = await payrollTrackingApi.getPayslipById(response.data.payslipId);
            // setPayslip(payslipResponse.data);
        } catch (err) {
            const { MOCK_DISPUTES } = await import('@/lib/mockData');
            const found = (MOCK_DISPUTES as any).find((d: DisputeDto) => d._id === disputeId);
            setDispute(found || null);
        } finally {
            setLoading(false);
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!comments.trim()) {
            toast.error('Please provide comments for your decision');
            return;
        }

        setSubmitting(true);
        try {
            await payrollSpecialistApi.reviewDispute(disputeId, decision, comments);
            toast.success(
                decision === 'APPROVE'
                    ? 'Dispute approved and escalated to manager'
                    : 'Dispute rejected'
            );
            router.push('/payroll/tracking/specialist/disputes');
        } catch (err: any) {
            toast.error(err.response?.data?.message || 'Failed to submit review');
        } finally {
            setSubmitting(false);
        }
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-screen">
                <Loader2 className="h-12 w-12 animate-spin text-blue-600" />
            </div>
        );
    }

    if (!dispute) {
        return (
            <div className="text-center py-12">
                <p className="text-red-600">Dispute not found</p>
                <Link href="/payroll/tracking/specialist/disputes">
                    <Button className="mt-4">Back to Disputes</Button>
                </Link>
            </div>
        );
    }

    return (
        <div className="space-y-6 max-w-4xl mx-auto">
            <div className="flex items-center gap-4">
                <Link href="/payroll/tracking/specialist/disputes">
                    <Button variant="outline" size="sm">
                        <ArrowLeft className="w-4 h-4 mr-2" />
                        Back
                    </Button>
                </Link>
                <div>
                    <h1 className="text-3xl font-bold text-slate-900">Review Dispute</h1>
                    <p className="text-slate-600 mt-1">Specialist review and recommendation</p>
                </div>
            </div>

            {/* Dispute Details */}
            <Card>
                <CardHeader>
                    <div className="flex items-center justify-between">
                        <div>
                            <CardTitle>{dispute.reason}</CardTitle>
                            <CardDescription>Submitted by {dispute.employeeName}</CardDescription>
                        </div>
                        <StatusBadge status={dispute.status} />
                    </div>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div>
                        <Label className="text-sm font-semibold">Description</Label>
                        <p className="text-slate-700 mt-1">{dispute.description}</p>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <Label className="text-sm font-semibold">Payslip ID</Label>
                            <p className="text-slate-700 mt-1">{dispute.payslipId}</p>
                        </div>
                        {dispute.amount && (
                            <div>
                                <Label className="text-sm font-semibold">Expected Amount</Label>
                                <p className="text-green-600 font-semibold mt-1">
                                    ${dispute.amount.toLocaleString()}
                                </p>
                            </div>
                        )}
                        <div>
                            <Label className="text-sm font-semibold">Submitted Date</Label>
                            <p className="text-slate-700 mt-1">
                                {new Date(dispute.submittedAt).toLocaleDateString()}
                            </p>
                        </div>
                    </div>
                </CardContent>
            </Card>

            {/* Review Form */}
            <Card>
                <CardHeader>
                    <CardTitle>Your Review</CardTitle>
                    <CardDescription>
                        Approve to escalate to manager for final decision, or reject to close the dispute
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <form onSubmit={handleSubmit} className="space-y-6">
                        <div className="space-y-3">
                            <Label>Decision</Label>
                            <RadioGroup value={decision} onValueChange={(v) => setDecision(v as any)}>
                                <div className="flex items-center space-x-2 border border-green-200 bg-green-50 p-3 rounded-lg">
                                    <RadioGroupItem value="APPROVE" id="approve" />
                                    <Label htmlFor="approve" className="flex-1 cursor-pointer font-medium text-green-900">
                                        <CheckCircle className="w-4 h-4 inline mr-2" />
                                        Approve - Escalate to Manager
                                    </Label>
                                </div>
                                <div className="flex items-center space-x-2 border border-red-200 bg-red-50 p-3 rounded-lg">
                                    <RadioGroupItem value="REJECT" id="reject" />
                                    <Label htmlFor="reject" className="flex-1 cursor-pointer font-medium text-red-900">
                                        <XCircle className="w-4 h-4 inline mr-2" />
                                        Reject - Close Dispute
                                    </Label>
                                </div>
                            </RadioGroup>
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="comments">
                                Comments <span className="text-red-600">*</span>
                            </Label>
                            <Textarea
                                id="comments"
                                value={comments}
                                onChange={(e) => setComments(e.target.value)}
                                placeholder={
                                    decision === 'APPROVE'
                                        ? 'Explain why you approve this dispute and what the manager should consider...'
                                        : 'Explain why you are rejecting this dispute...'
                                }
                                rows={5}
                                required
                            />
                        </div>

                        <div className="flex gap-3">
                            <Button type="submit" disabled={submitting} className="flex-1">
                                {submitting ? 'Submitting...' : `Submit ${decision === 'APPROVE' ? 'Approval' : 'Rejection'}`}
                            </Button>
                            <Link href="/payroll/tracking/specialist/disputes">
                                <Button type="button" variant="outline">
                                    Cancel
                                </Button>
                            </Link>
                        </div>
                    </form>
                </CardContent>
            </Card>
        </div>
    );
}
