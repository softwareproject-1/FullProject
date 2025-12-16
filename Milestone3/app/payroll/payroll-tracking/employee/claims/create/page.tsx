'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ArrowLeft, Upload } from 'lucide-react';
import { payrollTrackingApi, CreateClaimDto } from '@/services/api';
import { toast } from 'sonner';
import Link from 'next/link';

export default function CreateClaimPage() {
    const router = useRouter();
    const [submitting, setSubmitting] = useState(false);
    const [formData, setFormData] = useState<CreateClaimDto>({
        amount: 0,
        description: '',
        claimType: '',
    });

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setSubmitting(true);

        try {
            await payrollTrackingApi.submitClaim(formData);
            toast.success('Expense claim submitted successfully');
            router.push('/payroll/payroll-tracking/employee/claims');
        } catch (err: any) {
            toast.error(err.response?.data?.message || 'Failed to submit claim');
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <div className="max-w-3xl mx-auto space-y-6">
            <div className="flex items-center gap-4">
                <Link href="/payroll/payroll-tracking/employee/claims">
                    <Button variant="outline" size="sm">
                        <ArrowLeft className="w-4 h-4 mr-2" />
                        Back
                    </Button>
                </Link>
                <div>
                    <h1 className="text-3xl font-bold text-slate-900">Submit Expense Claim</h1>
                    <p className="text-slate-600 mt-1">Request reimbursement for business expenses</p>
                </div>
            </div>

            <Card>
                <CardHeader>
                    <CardTitle>Claim Information</CardTitle>
                    <CardDescription>
                        Provide details about your business expense. Remember to attach all relevant receipts.
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <form onSubmit={handleSubmit} className="space-y-6">
                        <div className="space-y-2">
                            <Label htmlFor="claimType">
                                Claim Type <span className="text-red-600">*</span>
                            </Label>
                            <Select
                                value={formData.claimType || ''}
                                onValueChange={(value) => setFormData({ ...formData, claimType: value })}
                            >
                                <SelectTrigger>
                                    <SelectValue placeholder="Select claim type" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="Travel">Travel Expenses</SelectItem>
                                    <SelectItem value="Accommodation">Accommodation</SelectItem>
                                    <SelectItem value="Meals">Meals & Entertainment</SelectItem>
                                    <SelectItem value="Office Supplies">Office Supplies</SelectItem>
                                    <SelectItem value="Training">Training & Development</SelectItem>
                                    <SelectItem value="Other">Other</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="amount">
                                Amount <span className="text-red-600">*</span>
                            </Label>
                            <Input
                                id="amount"
                                type="number"
                                step="0.01"
                                placeholder="0.00"
                                value={formData.amount || ''}
                                onChange={(e) => setFormData({ ...formData, amount: parseFloat(e.target.value) })}
                                required
                            />
                        </div>


                        <div className="space-y-2">
                            <Label htmlFor="description">
                                Description <span className="text-red-600">*</span>
                            </Label>
                            <Textarea
                                id="description"
                                placeholder="Provide detailed description of the expense..."
                                value={formData.description}
                                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                                rows={4}
                                required
                            />
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="receipts">Receipts</Label>
                            <div className="border-2 border-dashed border-slate-300 rounded-lg p-6 text-center">
                                <Upload className="w-12 h-12 text-slate-400 mx-auto mb-2" />
                                <p className="text-sm text-slate-600 mb-2">Upload receipt images or PDFs</p>
                                <Input
                                    id="receipts"
                                    type="file"
                                    multiple
                                    accept="image/*,.pdf"
                                    className="max-w-xs mx-auto"
                                />
                                <p className="text-xs text-slate-500 mt-2">
                                    Max 5 files, 10MB each. Supported: JPG, PNG, PDF
                                </p>
                            </div>
                        </div>

                        <div className="flex gap-3 pt-4">
                            <Button type="submit" disabled={submitting} className="flex-1">
                                {submitting ? 'Submitting...' : 'Submit Claim'}
                            </Button>
                            <Link href="/payroll/payroll-tracking/employee/claims">
                                <Button type="button" variant="outline">
                                    Cancel
                                </Button>
                            </Link>
                        </div>
                    </form>
                </CardContent>
            </Card>

            {/* Guidelines */}
            <Card>
                <CardHeader>
                    <CardTitle>Expense Claim Guidelines</CardTitle>
                </CardHeader>
                <CardContent>
                    <ul className="list-disc list-inside space-y-2 text-sm text-slate-600">
                        <li>All business expenses must be submitted within 30 days of incurring the expense</li>
                        <li>Original receipts or digital copies must be attached for all claims</li>
                        <li>Travel expenses require prior approval from your manager</li>
                        <li>Meal expenses are reimbursed up to company policy limits</li>
                        <li>Claims will be reviewed by payroll specialist, then approved by manager</li>
                        <li>Once approved, reimbursement will appear in your next payslip</li>
                    </ul>
                </CardContent>
            </Card>
        </div>
    );
}
