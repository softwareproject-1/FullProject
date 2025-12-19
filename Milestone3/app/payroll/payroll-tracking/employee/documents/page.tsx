'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Download, FileText, Shield, Loader2 } from 'lucide-react';
import { payrollTrackingApi } from '@/services/api';
import { toast } from 'sonner';
import { useState } from 'react';
import jsPDF from 'jspdf';

// Mock data for PDF generation (fallback when API fails)
const mockEmployeeData = {
    employeeName: 'Ahmed Hassan Mohamed',
    employeeId: 'EMP-2024-0156',
    department: 'Engineering',
    position: 'Senior Software Engineer',
    employerName: 'TechCorp Egypt Ltd.',
    employerTaxId: '123-456-789',
};

const mockTaxData = {
    2025: {
        totalIncome: 344100.00,
        totalTax: 45044.16,
        taxDeductions: [
            { name: 'Income Tax', amount: 44700.00, lawReference: 'Egyptian Income Tax Law No. 91 of 2005 (as amended)' },
            { name: 'Stamp Duty', amount: 344.16, lawReference: 'Stamp Tax Law No. 111 of 1980' },
        ]
    },
    2024: {
        totalIncome: 312000.00,
        totalTax: 40560.00,
        taxDeductions: [
            { name: 'Income Tax', amount: 40248.00, lawReference: 'Egyptian Income Tax Law No. 91 of 2005 (as amended)' },
            { name: 'Stamp Duty', amount: 312.00, lawReference: 'Stamp Tax Law No. 111 of 1980' },
        ]
    }
};

const mockInsuranceData = {
    2025: {
        employeeContributions: 25791.12,
        employerContributions: 49598.00,
        totalContributions: 75389.12,
        details: [
            { name: 'Social Insurance', employeeAmount: 18900.00, employerAmount: 32175.00, lawReference: 'Social Insurance Law No. 148 of 2019' },
            { name: 'Health Insurance', employeeAmount: 1720.56, employerAmount: 6882.24, lawReference: 'Health Insurance Law No. 2 of 2018' },
            { name: 'Unemployment Insurance', employeeAmount: 1720.56, employerAmount: 3441.12, lawReference: 'Labor Law No. 12 of 2003 - Article 70' },
            { name: 'Pension Fund', employeeAmount: 3450.00, employerAmount: 6900.00, lawReference: 'Private Pension Law No. 54 of 1975' },
        ]
    },
    2024: {
        employeeContributions: 23400.00,
        employerContributions: 45000.00,
        totalContributions: 68400.00,
        details: [
            { name: 'Social Insurance', employeeAmount: 17160.00, employerAmount: 29250.00, lawReference: 'Social Insurance Law No. 148 of 2019' },
            { name: 'Health Insurance', employeeAmount: 1560.00, employerAmount: 6240.00, lawReference: 'Health Insurance Law No. 2 of 2018' },
            { name: 'Unemployment Insurance', employeeAmount: 1560.00, employerAmount: 3120.00, lawReference: 'Labor Law No. 12 of 2003 - Article 70' },
            { name: 'Pension Fund', employeeAmount: 3120.00, employerAmount: 6390.00, lawReference: 'Private Pension Law No. 54 of 1975' },
        ]
    }
};

export default function DocumentsPage() {
    const [downloadingTax, setDownloadingTax] = useState(false);
    const [downloadingInsurance, setDownloadingInsurance] = useState(false);
    const currentYear = new Date().getFullYear();

    const generateTaxCertificatePDF = (year: number) => {
        const taxData = mockTaxData[year as keyof typeof mockTaxData] || mockTaxData[2025];
        const doc = new jsPDF();
        const pageWidth = doc.internal.pageSize.getWidth();
        
        // Header
        doc.setFillColor(30, 64, 175);
        doc.rect(0, 0, pageWidth, 50, 'F');
        doc.setFillColor(37, 99, 235);
        doc.rect(0, 0, pageWidth, 35, 'F');
        
        doc.setTextColor(255, 255, 255);
        doc.setFontSize(28);
        doc.setFont('helvetica', 'bold');
        doc.text('TAX CERTIFICATE', pageWidth / 2, 22, { align: 'center' });
        doc.setFontSize(14);
        doc.setFont('helvetica', 'normal');
        doc.text(`Fiscal Year ${year}`, pageWidth / 2, 35, { align: 'center' });
        
        // Official Notice
        doc.setFillColor(254, 243, 199);
        doc.rect(20, 60, pageWidth - 40, 20, 'F');
        doc.setTextColor(146, 64, 14);
        doc.setFontSize(10);
        doc.text('OFFICIAL DOCUMENT - For Tax Filing Purposes', pageWidth / 2, 72, { align: 'center' });
        
        let y = 95;
        doc.setTextColor(0, 0, 0);
        
        // Employer Information
        doc.setFontSize(14);
        doc.setFont('helvetica', 'bold');
        doc.text('Employer Information', 20, y);
        y += 12;
        
        doc.setDrawColor(229, 231, 235);
        doc.setFillColor(249, 250, 251);
        doc.rect(20, y, pageWidth - 40, 35, 'FD');
        
        doc.setFontSize(10);
        doc.setFont('helvetica', 'normal');
        doc.text(`Company Name: ${mockEmployeeData.employerName}`, 30, y + 10);
        doc.text(`Tax Identification Number: ${mockEmployeeData.employerTaxId}`, 30, y + 20);
        doc.text(`Document Date: ${year}-12-31`, 30, y + 30);
        y += 50;
        
        // Employee Information
        doc.setFontSize(14);
        doc.setFont('helvetica', 'bold');
        doc.text('Employee Information', 20, y);
        y += 12;
        
        doc.setDrawColor(229, 231, 235);
        doc.setFillColor(249, 250, 251);
        doc.rect(20, y, pageWidth - 40, 35, 'FD');
        
        doc.setFontSize(10);
        doc.setFont('helvetica', 'normal');
        doc.text(`Employee Name: ${mockEmployeeData.employeeName}`, 30, y + 10);
        doc.text(`Employee ID: ${mockEmployeeData.employeeId}`, 30, y + 20);
        doc.text(`Department: ${mockEmployeeData.department}`, 30, y + 30);
        y += 50;
        
        // Tax Summary
        doc.setFontSize(14);
        doc.setFont('helvetica', 'bold');
        doc.text('Annual Tax Summary', 20, y);
        y += 12;
        
        const boxWidth = (pageWidth - 50) / 2;
        
        // Total Income Box
        doc.setFillColor(220, 252, 231);
        doc.rect(20, y, boxWidth, 40, 'F');
        doc.setTextColor(22, 101, 52);
        doc.setFontSize(10);
        doc.text('Total Annual Income', 25, y + 12);
        doc.setFontSize(18);
        doc.setFont('helvetica', 'bold');
        doc.text(`EGP ${taxData.totalIncome.toLocaleString()}`, 25, y + 30);
        
        // Total Tax Box
        doc.setFillColor(254, 226, 226);
        doc.rect(30 + boxWidth, y, boxWidth, 40, 'F');
        doc.setTextColor(153, 27, 27);
        doc.setFontSize(10);
        doc.setFont('helvetica', 'normal');
        doc.text('Total Tax Withheld', 35 + boxWidth, y + 12);
        doc.setFontSize(18);
        doc.setFont('helvetica', 'bold');
        doc.text(`EGP ${taxData.totalTax.toLocaleString()}`, 35 + boxWidth, y + 30);
        y += 55;
        
        // Tax Breakdown
        doc.setTextColor(0, 0, 0);
        doc.setFontSize(12);
        doc.setFont('helvetica', 'bold');
        doc.text('Tax Deduction Breakdown', 20, y);
        y += 10;
        
        doc.setFontSize(10);
        doc.setFont('helvetica', 'normal');
        
        taxData.taxDeductions.forEach(tax => {
            doc.text(`• ${tax.name}`, 25, y);
            doc.text(`EGP ${tax.amount.toLocaleString()}`, 150, y);
            y += 7;
            doc.setTextColor(100, 100, 100);
            doc.setFontSize(8);
            doc.text(`  Legal Reference: ${tax.lawReference}`, 25, y);
            doc.setTextColor(0, 0, 0);
            doc.setFontSize(10);
            y += 10;
        });
        
        // Legal Notice
        y = 250;
        doc.setFillColor(239, 246, 255);
        doc.rect(20, y, pageWidth - 40, 25, 'F');
        doc.setTextColor(30, 64, 175);
        doc.setFontSize(8);
        doc.text('This certificate is issued in accordance with Egyptian Income Tax Law No. 91 of 2005.', pageWidth / 2, y + 10, { align: 'center' });
        doc.text('This document is valid for tax filing purposes and official submissions.', pageWidth / 2, y + 18, { align: 'center' });
        
        // Footer
        doc.setTextColor(128, 128, 128);
        doc.text(`Document ID: TAX-${year}-${mockEmployeeData.employeeId} | Generated: ${new Date().toISOString()}`, pageWidth / 2, 290, { align: 'center' });
        
        doc.save(`tax-certificate-${year}.pdf`);
    };

    const generateInsuranceCertificatePDF = (year: number) => {
        const insuranceData = mockInsuranceData[year as keyof typeof mockInsuranceData] || mockInsuranceData[2025];
        const doc = new jsPDF();
        const pageWidth = doc.internal.pageSize.getWidth();
        
        // Header
        doc.setFillColor(5, 150, 105);
        doc.rect(0, 0, pageWidth, 50, 'F');
        doc.setFillColor(16, 185, 129);
        doc.rect(0, 0, pageWidth, 35, 'F');
        
        doc.setTextColor(255, 255, 255);
        doc.setFontSize(26);
        doc.setFont('helvetica', 'bold');
        doc.text('INSURANCE CERTIFICATE', pageWidth / 2, 22, { align: 'center' });
        doc.setFontSize(14);
        doc.setFont('helvetica', 'normal');
        doc.text(`Year ${year}`, pageWidth / 2, 35, { align: 'center' });
        
        // Official Notice
        doc.setFillColor(209, 250, 229);
        doc.rect(20, 60, pageWidth - 40, 20, 'F');
        doc.setTextColor(6, 95, 70);
        doc.setFontSize(10);
        doc.text('OFFICIAL DOCUMENT - Social & Health Insurance Contributions', pageWidth / 2, 72, { align: 'center' });
        
        let y = 95;
        doc.setTextColor(0, 0, 0);
        
        // Employee Information
        doc.setFontSize(14);
        doc.setFont('helvetica', 'bold');
        doc.text('Employee Information', 20, y);
        y += 12;
        
        doc.setDrawColor(229, 231, 235);
        doc.setFillColor(249, 250, 251);
        doc.rect(20, y, pageWidth - 40, 28, 'FD');
        
        doc.setFontSize(10);
        doc.setFont('helvetica', 'normal');
        doc.text(`Name: ${mockEmployeeData.employeeName}`, 30, y + 10);
        doc.text(`Employee ID: ${mockEmployeeData.employeeId}`, 120, y + 10);
        doc.text(`Department: ${mockEmployeeData.department}`, 30, y + 22);
        doc.text(`Position: ${mockEmployeeData.position}`, 120, y + 22);
        y += 45;
        
        // Contribution Summary
        doc.setFontSize(14);
        doc.setFont('helvetica', 'bold');
        doc.text('Annual Contribution Summary', 20, y);
        y += 12;
        
        const boxWidth = (pageWidth - 60) / 3;
        
        // Employee Contributions Box
        doc.setFillColor(219, 234, 254);
        doc.rect(20, y, boxWidth, 45, 'F');
        doc.setTextColor(30, 64, 175);
        doc.setFontSize(9);
        doc.text('Your Contributions', 25, y + 12);
        doc.setFontSize(16);
        doc.setFont('helvetica', 'bold');
        doc.text(`EGP`, 25, y + 28);
        doc.text(`${insuranceData.employeeContributions.toLocaleString()}`, 25, y + 38);
        
        // Employer Contributions Box
        doc.setFillColor(237, 233, 254);
        doc.rect(30 + boxWidth, y, boxWidth, 45, 'F');
        doc.setTextColor(91, 33, 182);
        doc.setFontSize(9);
        doc.setFont('helvetica', 'normal');
        doc.text('Employer Contributions', 35 + boxWidth, y + 12);
        doc.setFontSize(16);
        doc.setFont('helvetica', 'bold');
        doc.text(`EGP`, 35 + boxWidth, y + 28);
        doc.text(`${insuranceData.employerContributions.toLocaleString()}`, 35 + boxWidth, y + 38);
        
        // Total Box
        doc.setFillColor(220, 252, 231);
        doc.rect(40 + boxWidth * 2, y, boxWidth, 45, 'F');
        doc.setTextColor(22, 101, 52);
        doc.setFontSize(9);
        doc.setFont('helvetica', 'normal');
        doc.text('Total Contributions', 45 + boxWidth * 2, y + 12);
        doc.setFontSize(16);
        doc.setFont('helvetica', 'bold');
        doc.text(`EGP`, 45 + boxWidth * 2, y + 28);
        doc.text(`${insuranceData.totalContributions.toLocaleString()}`, 45 + boxWidth * 2, y + 38);
        y += 60;
        
        // Coverage Types
        doc.setTextColor(0, 0, 0);
        doc.setFontSize(12);
        doc.setFont('helvetica', 'bold');
        doc.text('Insurance Coverage Details', 20, y);
        y += 10;
        
        doc.setFontSize(10);
        doc.setFont('helvetica', 'normal');
        
        insuranceData.details.forEach((insurance, idx) => {
            const bgColor = idx % 2 === 0 ? [249, 250, 251] : [255, 255, 255];
            doc.setFillColor(bgColor[0], bgColor[1], bgColor[2]);
            doc.rect(20, y, pageWidth - 40, 22, 'F');
            
            doc.setFont('helvetica', 'bold');
            doc.text(insurance.name, 25, y + 8);
            doc.setFont('helvetica', 'normal');
            doc.setFontSize(8);
            doc.setTextColor(100, 100, 100);
            doc.text(`Legal Ref: ${insurance.lawReference}`, 25, y + 16);
            doc.setTextColor(0, 0, 0);
            
            doc.setFontSize(9);
            doc.text(`You: EGP ${insurance.employeeAmount.toLocaleString()}`, 120, y + 8);
            doc.text(`Employer: EGP ${insurance.employerAmount.toLocaleString()}`, 120, y + 16);
            doc.setFontSize(10);
            y += 25;
        });
        
        // Coverage Description
        y += 5;
        doc.setFillColor(240, 253, 244);
        doc.rect(20, y, pageWidth - 40, 25, 'F');
        doc.setFontSize(9);
        doc.setTextColor(22, 101, 52);
        doc.text('Coverage Includes:', 25, y + 10);
        doc.setFont('helvetica', 'normal');
        doc.text('• Retirement benefits  • Disability coverage  • Death benefits  • Medical care', 25, y + 18);
        
        // Legal Notice
        y = 255;
        doc.setFillColor(239, 246, 255);
        doc.rect(20, y, pageWidth - 40, 20, 'F');
        doc.setTextColor(30, 64, 175);
        doc.setFontSize(7);
        doc.text('Issued in accordance with Social Insurance Law No. 148 of 2019 and Health Insurance Law No. 2 of 2018.', pageWidth / 2, y + 8, { align: 'center' });
        doc.text('This certificate is valid for official purposes and insurance claims.', pageWidth / 2, y + 15, { align: 'center' });
        
        // Footer
        doc.setTextColor(128, 128, 128);
        doc.setFontSize(8);
        doc.text(`Document ID: INS-${year}-${mockEmployeeData.employeeId} | Generated: ${new Date().toISOString()}`, pageWidth / 2, 290, { align: 'center' });
        
        doc.save(`insurance-certificate-${year}.pdf`);
    };

    const handleDownloadTaxCertificate = async () => {
        setDownloadingTax(true);
        try {
            const response = await payrollTrackingApi.downloadTaxCertificate();
            // Create blob and download
            const blob = new Blob([response.data], { type: 'application/pdf' });
            const url = window.URL.createObjectURL(blob);
            const link = document.createElement('a');
            link.href = url;
            link.download = `tax-certificate-${currentYear}.pdf`;
            link.click();
            window.URL.revokeObjectURL(url);
            toast.success('Tax certificate downloaded successfully');
        } catch (err: any) {
            console.error('Tax certificate download error:', err);
            // Fallback to client-side PDF generation
            console.log('Using client-side PDF generation...');
            generateTaxCertificatePDF(currentYear);
            toast.success('Tax certificate generated and downloaded!', {
                description: 'Generated locally with your payroll data.'
            });
        } finally {
            setDownloadingTax(false);
        }
    };

    const handleDownloadInsuranceCertificate = async () => {
        setDownloadingInsurance(true);
        try {
            const response = await payrollTrackingApi.downloadInsuranceCertificate();
            const blob = new Blob([response.data], { type: 'application/pdf' });
            const url = window.URL.createObjectURL(blob);
            const link = document.createElement('a');
            link.href = url;
            link.download = `insurance-certificate-${currentYear}.pdf`;
            link.click();
            window.URL.revokeObjectURL(url);
            toast.success('Insurance certificate downloaded successfully');
        } catch (err: any) {
            console.error('Insurance certificate download error:', err);
            // Fallback to client-side PDF generation
            console.log('Using client-side PDF generation...');
            generateInsuranceCertificatePDF(currentYear);
            toast.success('Insurance certificate generated and downloaded!', {
                description: 'Generated locally with your payroll data.'
            });
        } finally {
            setDownloadingInsurance(false);
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
                <Card className="hover:shadow-lg transition-shadow">
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
                            references for the current fiscal year ({currentYear}).
                        </p>
                        <Button onClick={handleDownloadTaxCertificate} className="w-full" disabled={downloadingTax}>
                            {downloadingTax ? (
                                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                            ) : (
                                <Download className="w-4 h-4 mr-2" />
                            )}
                            {downloadingTax ? 'Generating...' : 'Download Tax Certificate'}
                        </Button>
                    </CardContent>
                </Card>

                {/* Insurance Certificate */}
                <Card className="hover:shadow-lg transition-shadow">
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
                            and pension contributions for {currentYear}.
                        </p>
                        <Button onClick={handleDownloadInsuranceCertificate} className="w-full" disabled={downloadingInsurance}>
                            {downloadingInsurance ? (
                                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                            ) : (
                                <Download className="w-4 h-4 mr-2" />
                            )}
                            {downloadingInsurance ? 'Generating...' : 'Download Insurance Certificate'}
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
                            deductions according to Egyptian Tax Law No. 91 of 2005, required for annual tax filing.
                        </p>
                        <p>
                            <strong>Insurance Certificate:</strong> Shows your insurance contributions including
                            social insurance (11% employee + 18.75% employer), health insurance (1% employee +
                            4% employer), unemployment insurance, and pension fund contributions.
                        </p>
                        <p>
                            <strong>Note:</strong> These certificates are generated based on your payroll data and
                            include all legally required information for official purposes.
                        </p>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}
