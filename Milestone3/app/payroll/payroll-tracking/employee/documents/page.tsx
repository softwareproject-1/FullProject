'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Download, FileText, Shield } from 'lucide-react';
import { payrollTrackingApi } from '@/services/api';
import { toast } from 'sonner';

export default function DocumentsPage() {
    const handleDownloadTaxCertificate = async () => {
        try {
            const response = await payrollTrackingApi.downloadTaxCertificate();
            // Create blob and download
            const blob = new Blob([response.data], { type: 'application/pdf' });
            const url = window.URL.createObjectURL(blob);
            const link = document.createElement('a');
            link.href = url;
            link.download = `tax-certificate-${new Date().getFullYear()}.pdf`;
            link.click();
            window.URL.revokeObjectURL(url);
            toast.success('Tax certificate downloaded successfully');
        } catch (err) {
            toast.error('Failed to download tax certificate');
        }
    };

    const handleDownloadInsuranceCertificate = async () => {
        try {
            const response = await payrollTrackingApi.downloadInsuranceCertificate();
            const blob = new Blob([response.data], { type: 'application/pdf' });
            const url = window.URL.createObjectURL(blob);
            const link = document.createElement('a');
            link.href = url;
            link.download = `insurance-certificate-${new Date().getFullYear()}.pdf`;
            link.click();
            window.URL.revokeObjectURL(url);
            toast.success('Insurance certificate downloaded successfully');
        } catch (err) {
            toast.error('Failed to download insurance certificate');
        }
    };

    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-3xl font-bold text-slate-900">Tax & Insurance Documents</h1>
                <p className="text-slate-600 mt-1">Download your official payroll documents</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Tax Certificate */}
                <Card>
                    <CardHeader>
                        <div className="flex items-center gap-3">
                            <div className="p-3 bg-blue-100 rounded-lg">
                                <FileText className="w-6 h-6 text-blue-600" />
                            </div>
                            <div>
                                <CardTitle>Tax Certificate</CardTitle>
                                <CardDescription>Annual tax statement for filing</CardDescription>
                            </div>
                        </div>
                    </CardHeader>
                    <CardContent>
                        <p className="text-sm text-slate-600 mb-4">
                            Download your official tax certificate showing all income tax deductions and legal
                            references for the current fiscal year.
                        </p>
                        <Button onClick={handleDownloadTaxCertificate} className="w-full">
                            <Download className="w-4 h-4 mr-2" />
                            Download Tax Certificate
                        </Button>
                    </CardContent>
                </Card>

                {/* Insurance Certificate */}
                <Card>
                    <CardHeader>
                        <div className="flex items-center gap-3">
                            <div className="p-3 bg-green-100 rounded-lg">
                                <Shield className="w-6 h-6 text-green-600" />
                            </div>
                            <div>
                                <CardTitle>Insurance Certificate</CardTitle>
                                <CardDescription>Social & health insurance details</CardDescription>
                            </div>
                        </div>
                    </CardHeader>
                    <CardContent>
                        <p className="text-sm text-slate-600 mb-4">
                            Download your insurance certificate showing all social insurance, health insurance,
                            and pension contributions.
                        </p>
                        <Button onClick={handleDownloadInsuranceCertificate} className="w-full">
                            <Download className="w-4 h-4 mr-2" />
                            Download Insurance Certificate
                        </Button>
                    </CardContent>
                </Card>
            </div>

            {/* Additional Information */}
            <Card>
                <CardHeader>
                    <CardTitle>Document Information</CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="space-y-3 text-sm text-slate-600">
                        <p>
                            <strong>Tax Certificate:</strong> Contains detailed breakdown of all income tax
                            deductions according to Egyptian Tax Law, required for annual tax filing.
                        </p>
                        <p>
                            <strong>Insurance Certificate:</strong> Shows your insurance contributions including
                            social insurance (11% employee + 18.75% employer) and health insurance (1% employee +
                            4% employer).
                        </p>
                        <p>
                            <strong>Note:</strong> These certificates are generated based on your payroll data and
                            are updated monthly. For official purposes, always use the most recent version.
                        </p>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}
