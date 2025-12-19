'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
    ArrowLeft, 
    CheckCircle2, 
    Download, 
    FileText, 
    Shield, 
    DollarSign,
    Car,
    Palmtree,
    AlertTriangle,
    Calendar,
    Building2,
    Receipt,
    Printer
} from 'lucide-react';
import { toast } from 'sonner';
import jsPDF from 'jspdf';

// ============================================================
// COMPREHENSIVE MOCK DATA FOR ALL EMPLOYEE USER STORIES
// ============================================================

const mockPayslipData = {
    // Basic Info
    payslipId: 'PS-2025-DEC-001',
    month: 'December',
    year: 2025,
    employeeName: 'Ahmed Hassan Mohamed',
    employeeId: 'EMP-2024-0156',
    department: 'Engineering',
    position: 'Senior Software Engineer',
    contractType: 'Full-Time Permanent',
    payGrade: 'Grade 5 (G5)',
    paymentStatus: 'PAID' as const,
    paymentDate: '2025-12-28',
    bankAccount: '****4521',
    
    // ============ EARNINGS ============
    // User Story: View base salary
    baseSalary: 15000.00,
    
    // User Story: View transport allowance
    allowances: [
        { id: 'ALW-001', name: 'Transport Allowance', amount: 1500.00, description: 'Monthly commuting compensation' },
        { id: 'ALW-002', name: 'Housing Allowance', amount: 3000.00, description: 'Rental assistance benefit' },
        { id: 'ALW-003', name: 'Meal Allowance', amount: 800.00, description: 'Daily meal subsidy (40 EGP x 20 days)' },
        { id: 'ALW-004', name: 'Communication Allowance', amount: 500.00, description: 'Phone & internet reimbursement' },
    ],
    totalAllowances: 5800.00,
    
    // User Story: View leave compensation (encashment)
    leaveEncashment: 2500.00,
    leaveEncashmentDetails: {
        unusedAnnualDays: 5,
        dailyRate: 500.00,
        encashmentDate: '2025-12-15',
        leaveType: 'Annual Leave',
        carryOverFromYear: 2024,
    },
    
    // Overtime
    overtimeCompensation: 1875.00,
    overtimeDetails: {
        regularHours: 10,
        regularRate: 93.75, // 15000 / 160 hours
        nightHours: 5,
        nightRate: 140.63, // 1.5x regular
        weekendHours: 3,
        weekendRate: 187.50, // 2x regular
    },
    
    // Bonuses
    bonuses: [
        { id: 'BON-001', name: 'Performance Bonus', amount: 2000.00, reason: 'Q4 2025 exceptional performance' },
        { id: 'BON-002', name: 'Project Completion Bonus', amount: 1500.00, reason: 'HR System Phase 2 delivery' },
    ],
    totalBonuses: 3500.00,
    
    grossPay: 28675.00,
    
    // ============ DEDUCTIONS ============
    // User Story: View tax deductions with law reference
    taxDeductions: [
        { 
            id: 'TAX-001', 
            name: 'Income Tax', 
            amount: 3725.00,
            lawReference: 'Egyptian Income Tax Law No. 91 of 2005 (as amended)',
            bracket: { minIncome: 20000, maxIncome: 35000, rate: 15 },
            calculationDetails: 'Based on progressive tax brackets after exemptions'
        },
        { 
            id: 'TAX-002', 
            name: 'Stamp Duty', 
            amount: 28.68,
            lawReference: 'Stamp Tax Law No. 111 of 1980',
            bracket: null,
            calculationDetails: '0.1% of gross salary'
        },
    ],
    totalTax: 3753.68,
    
    // User Story: View insurance deductions (itemized)
    insuranceDeductions: [
        { 
            id: 'INS-001', 
            name: 'Social Insurance', 
            employeeContribution: 1575.00,
            employerContribution: 2681.25,
            totalContribution: 4256.25,
            rate: { employee: 11, employer: 18.75 },
            lawReference: 'Social Insurance Law No. 148 of 2019',
            coverage: 'Retirement, disability, death benefits'
        },
        { 
            id: 'INS-002', 
            name: 'Health Insurance', 
            employeeContribution: 143.38,
            employerContribution: 573.50,
            totalContribution: 716.88,
            rate: { employee: 1, employer: 4 },
            lawReference: 'Health Insurance Law No. 2 of 2018',
            coverage: 'Medical, dental, vision coverage'
        },
        { 
            id: 'INS-003', 
            name: 'Unemployment Insurance', 
            employeeContribution: 143.38,
            employerContribution: 286.75,
            totalContribution: 430.13,
            rate: { employee: 1, employer: 2 },
            lawReference: 'Labor Law No. 12 of 2003 - Article 70',
            coverage: 'Unemployment benefits for up to 6 months'
        },
        { 
            id: 'INS-004', 
            name: 'Pension Fund Contribution', 
            employeeContribution: 287.50,
            employerContribution: 575.00,
            totalContribution: 862.50,
            rate: { employee: 2, employer: 4 },
            lawReference: 'Private Pension Law No. 54 of 1975',
            coverage: 'Supplementary retirement benefits'
        },
    ],
    totalInsurance: 2149.26,
    
    // User Story: View unpaid leave deductions
    leaveDeductions: {
        unpaidDays: 2,
        deductionAmount: 1000.00,
        dailyRate: 500.00,
        calculationFormula: 'Base Salary / 30 working days × 2 unpaid days = 1,000 EGP',
        leaveDetails: [
            { date: '2025-12-05', type: 'Unpaid Personal Leave', hours: 8 },
            { date: '2025-12-18', type: 'Unpaid Emergency Leave', hours: 8 },
        ],
    },
    
    // User Story: View misconduct deductions
    misconductDeductions: {
        totalAmount: 450.00,
        incidents: [
            { 
                id: 'MIS-001',
                date: '2025-12-03',
                type: 'Late Arrival',
                description: 'Arrived 45 minutes late (policy allows 15 min grace)',
                deductionAmount: 150.00,
                policyReference: 'Company Attendance Policy - Section 4.2'
            },
            { 
                id: 'MIS-002',
                date: '2025-12-10',
                type: 'Unapproved Absence',
                description: 'Absent without prior approval or medical certificate',
                deductionAmount: 250.00,
                policyReference: 'HR Policy Manual - Chapter 6.1'
            },
            { 
                id: 'MIS-003',
                date: '2025-12-15',
                type: 'Early Departure',
                description: 'Left 30 minutes before shift end without approval',
                deductionAmount: 50.00,
                policyReference: 'Company Attendance Policy - Section 4.3'
            },
        ]
    },
    timeBasedPenalties: 450.00,
    
    totalDeductions: 7352.94,
    netPay: 21322.06,
    
    // ============ EMPLOYER CONTRIBUTIONS (User Story) ============
    employerContributions: [
        { 
            id: 'EC-001', 
            name: 'Social Insurance (Employer Share)', 
            employerContribution: 2681.25,
            description: '18.75% of insurable salary'
        },
        { 
            id: 'EC-002', 
            name: 'Health Insurance (Employer Share)', 
            employerContribution: 573.50,
            description: '4% of gross salary'
        },
        { 
            id: 'EC-003', 
            name: 'Unemployment Insurance (Employer Share)', 
            employerContribution: 286.75,
            description: '2% of gross salary'
        },
        { 
            id: 'EC-004', 
            name: 'Pension Fund (Employer Share)', 
            employerContribution: 575.00,
            description: '4% of gross salary'
        },
        { 
            id: 'EC-005', 
            name: 'Life Insurance Premium', 
            employerContribution: 250.00,
            description: '100% employer-paid group life insurance'
        },
        { 
            id: 'EC-006', 
            name: 'Training & Development Fund', 
            employerContribution: 400.00,
            description: 'Professional development allocation'
        },
    ],
    totalEmployerContributions: 4766.50,
    
    // Minimum wage protection
    minimumWage: 6000.00,
    minimumWageAlert: false,
    
    // Dispute eligible items
    disputeEligibleItems: ['TAX-001', 'MIS-002', 'INS-001'],
};

// Tax Document Mock Data
const mockTaxDocuments = [
    {
        year: 2025,
        totalIncome: 344100.00,
        totalTax: 45044.16,
        employerName: 'TechCorp Egypt Ltd.',
        employerTaxId: '123-456-789',
        documentDate: '2025-12-31',
        status: 'Available',
    },
    {
        year: 2024,
        totalIncome: 312000.00,
        totalTax: 40560.00,
        employerName: 'TechCorp Egypt Ltd.',
        employerTaxId: '123-456-789',
        documentDate: '2024-12-31',
        status: 'Available',
    },
];

// Insurance Certificate Mock Data  
const mockInsuranceCertificates = [
    {
        year: 2025,
        employeeContributions: 25791.12,
        employerContributions: 49598.00,
        totalContributions: 75389.12,
        coverageTypes: ['Social Insurance', 'Health Insurance', 'Unemployment Insurance', 'Pension Fund'],
        status: 'Available',
    },
    {
        year: 2024,
        employeeContributions: 23400.00,
        employerContributions: 45000.00,
        totalContributions: 68400.00,
        coverageTypes: ['Social Insurance', 'Health Insurance', 'Unemployment Insurance', 'Pension Fund'],
        status: 'Available',
    },
];

export default function MockPayslipPage() {
    const router = useRouter();
    const [activeTab, setActiveTab] = useState('payslip');
    const payslip = mockPayslipData;

    const handleDownloadPayslipPDF = () => {
        const doc = new jsPDF();
        const pageWidth = doc.internal.pageSize.getWidth();
        
        // Header
        doc.setFillColor(59, 130, 246);
        doc.rect(0, 0, pageWidth, 40, 'F');
        doc.setTextColor(255, 255, 255);
        doc.setFontSize(24);
        doc.setFont('helvetica', 'bold');
        doc.text('PAYSLIP', pageWidth / 2, 20, { align: 'center' });
        doc.setFontSize(12);
        doc.setFont('helvetica', 'normal');
        doc.text(`${payslip.month} ${payslip.year}`, pageWidth / 2, 32, { align: 'center' });
        
        // Reset colors
        doc.setTextColor(0, 0, 0);
        let y = 55;
        
        // Employee Info
        doc.setFontSize(14);
        doc.setFont('helvetica', 'bold');
        doc.text('Employee Information', 20, y);
        y += 10;
        doc.setFontSize(10);
        doc.setFont('helvetica', 'normal');
        doc.text(`Name: ${payslip.employeeName}`, 20, y);
        doc.text(`Employee ID: ${payslip.employeeId}`, 120, y);
        y += 7;
        doc.text(`Department: ${payslip.department}`, 20, y);
        doc.text(`Position: ${payslip.position}`, 120, y);
        y += 7;
        doc.text(`Pay Grade: ${payslip.payGrade}`, 20, y);
        doc.text(`Contract: ${payslip.contractType}`, 120, y);
        y += 15;
        
        // Earnings
        doc.setFillColor(34, 197, 94);
        doc.rect(20, y, pageWidth - 40, 8, 'F');
        doc.setTextColor(255, 255, 255);
        doc.setFont('helvetica', 'bold');
        doc.text('EARNINGS', 25, y + 6);
        doc.setTextColor(0, 0, 0);
        y += 15;
        
        doc.setFont('helvetica', 'normal');
        doc.text('Base Salary', 25, y);
        doc.text(`EGP ${payslip.baseSalary.toLocaleString()}`, 160, y, { align: 'right' });
        y += 7;
        
        payslip.allowances.forEach(a => {
            doc.text(a.name, 25, y);
            doc.text(`EGP ${a.amount.toLocaleString()}`, 160, y, { align: 'right' });
            y += 7;
        });
        
        doc.text('Leave Encashment', 25, y);
        doc.text(`EGP ${payslip.leaveEncashment.toLocaleString()}`, 160, y, { align: 'right' });
        y += 7;
        
        doc.text('Overtime', 25, y);
        doc.text(`EGP ${payslip.overtimeCompensation.toLocaleString()}`, 160, y, { align: 'right' });
        y += 7;
        
        doc.text('Bonuses', 25, y);
        doc.text(`EGP ${payslip.totalBonuses.toLocaleString()}`, 160, y, { align: 'right' });
        y += 10;
        
        doc.setFont('helvetica', 'bold');
        doc.text('TOTAL GROSS', 25, y);
        doc.text(`EGP ${payslip.grossPay.toLocaleString()}`, 160, y, { align: 'right' });
        y += 15;
        
        // Deductions
        doc.setFillColor(239, 68, 68);
        doc.rect(20, y, pageWidth - 40, 8, 'F');
        doc.setTextColor(255, 255, 255);
        doc.text('DEDUCTIONS', 25, y + 6);
        doc.setTextColor(0, 0, 0);
        y += 15;
        
        doc.setFont('helvetica', 'normal');
        doc.text('Income Tax', 25, y);
        doc.text(`-EGP ${payslip.totalTax.toLocaleString()}`, 160, y, { align: 'right' });
        y += 7;
        
        doc.text('Insurance (Employee Share)', 25, y);
        doc.text(`-EGP ${payslip.totalInsurance.toLocaleString()}`, 160, y, { align: 'right' });
        y += 7;
        
        doc.text('Unpaid Leave', 25, y);
        doc.text(`-EGP ${payslip.leaveDeductions.deductionAmount.toLocaleString()}`, 160, y, { align: 'right' });
        y += 7;
        
        doc.text('Misconduct Penalties', 25, y);
        doc.text(`-EGP ${payslip.misconductDeductions.totalAmount.toLocaleString()}`, 160, y, { align: 'right' });
        y += 10;
        
        doc.setFont('helvetica', 'bold');
        doc.text('TOTAL DEDUCTIONS', 25, y);
        doc.setTextColor(239, 68, 68);
        doc.text(`-EGP ${payslip.totalDeductions.toLocaleString()}`, 160, y, { align: 'right' });
        y += 20;
        
        // Net Pay
        doc.setFillColor(59, 130, 246);
        doc.rect(20, y, pageWidth - 40, 15, 'F');
        doc.setTextColor(255, 255, 255);
        doc.setFontSize(14);
        doc.text('NET PAY', 25, y + 10);
        doc.text(`EGP ${payslip.netPay.toLocaleString()}`, 185, y + 10, { align: 'right' });
        
        // Footer
        doc.setTextColor(128, 128, 128);
        doc.setFontSize(8);
        doc.text(`Generated on ${new Date().toLocaleDateString()} | Payslip ID: ${payslip.payslipId}`, pageWidth / 2, 285, { align: 'center' });
        
        doc.save(`payslip-${payslip.month}-${payslip.year}.pdf`);
        toast.success('Payslip PDF downloaded successfully!', {
            description: `${payslip.month} ${payslip.year} payslip saved to downloads.`
        });
    };

    const handleDownloadTaxDocument = (year: number) => {
        const taxDoc = mockTaxDocuments.find(d => d.year === year);
        if (!taxDoc) return;
        
        const doc = new jsPDF();
        const pageWidth = doc.internal.pageSize.getWidth();
        
        // Header with gradient-like effect
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
        doc.text(`Company Name: ${taxDoc.employerName}`, 30, y + 10);
        doc.text(`Tax Identification Number: ${taxDoc.employerTaxId}`, 30, y + 20);
        doc.text(`Document Date: ${taxDoc.documentDate}`, 30, y + 30);
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
        doc.text(`Employee Name: ${payslip.employeeName}`, 30, y + 10);
        doc.text(`Employee ID: ${payslip.employeeId}`, 30, y + 20);
        doc.text(`Department: ${payslip.department}`, 30, y + 30);
        y += 50;
        
        // Tax Summary
        doc.setFontSize(14);
        doc.setFont('helvetica', 'bold');
        doc.text('Annual Tax Summary', 20, y);
        y += 12;
        
        // Summary boxes
        const boxWidth = (pageWidth - 50) / 2;
        
        // Total Income Box
        doc.setFillColor(220, 252, 231);
        doc.rect(20, y, boxWidth, 40, 'F');
        doc.setTextColor(22, 101, 52);
        doc.setFontSize(10);
        doc.text('Total Annual Income', 25, y + 12);
        doc.setFontSize(18);
        doc.setFont('helvetica', 'bold');
        doc.text(`EGP ${taxDoc.totalIncome.toLocaleString()}`, 25, y + 30);
        
        // Total Tax Box
        doc.setFillColor(254, 226, 226);
        doc.rect(30 + boxWidth, y, boxWidth, 40, 'F');
        doc.setTextColor(153, 27, 27);
        doc.setFontSize(10);
        doc.setFont('helvetica', 'normal');
        doc.text('Total Tax Withheld', 35 + boxWidth, y + 12);
        doc.setFontSize(18);
        doc.setFont('helvetica', 'bold');
        doc.text(`EGP ${taxDoc.totalTax.toLocaleString()}`, 35 + boxWidth, y + 30);
        y += 55;
        
        // Tax Breakdown
        doc.setTextColor(0, 0, 0);
        doc.setFontSize(12);
        doc.setFont('helvetica', 'bold');
        doc.text('Tax Deduction Breakdown (Monthly Average)', 20, y);
        y += 10;
        
        doc.setFontSize(10);
        doc.setFont('helvetica', 'normal');
        
        payslip.taxDeductions.forEach(tax => {
            doc.text(`• ${tax.name}`, 25, y);
            doc.text(`EGP ${(tax.amount * 12).toLocaleString()}/year`, 150, y);
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
        doc.text(`Document ID: TAX-${year}-${payslip.employeeId} | Generated: ${new Date().toISOString()}`, pageWidth / 2, 290, { align: 'center' });
        
        doc.save(`tax-certificate-${year}.pdf`);
        toast.success(`Tax certificate for ${year} downloaded!`, {
            description: 'Document saved to your downloads folder.'
        });
    };

    const handleDownloadInsuranceCertificate = (year: number) => {
        const insuranceCert = mockInsuranceCertificates.find(c => c.year === year);
        if (!insuranceCert) return;
        
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
        doc.text(`Name: ${payslip.employeeName}`, 30, y + 10);
        doc.text(`Employee ID: ${payslip.employeeId}`, 120, y + 10);
        doc.text(`Department: ${payslip.department}`, 30, y + 22);
        doc.text(`Position: ${payslip.position}`, 120, y + 22);
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
        doc.text(`${insuranceCert.employeeContributions.toLocaleString()}`, 25, y + 38);
        
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
        doc.text(`${insuranceCert.employerContributions.toLocaleString()}`, 35 + boxWidth, y + 38);
        
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
        doc.text(`${insuranceCert.totalContributions.toLocaleString()}`, 45 + boxWidth * 2, y + 38);
        y += 60;
        
        // Coverage Types
        doc.setTextColor(0, 0, 0);
        doc.setFontSize(12);
        doc.setFont('helvetica', 'bold');
        doc.text('Insurance Coverage Types', 20, y);
        y += 10;
        
        // Insurance Details Table
        doc.setFontSize(10);
        doc.setFont('helvetica', 'normal');
        
        payslip.insuranceDeductions.forEach((insurance, idx) => {
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
            doc.text(`You: EGP ${(insurance.employeeContribution * 12).toLocaleString()}`, 120, y + 8);
            doc.text(`Employer: EGP ${(insurance.employerContribution * 12).toLocaleString()}`, 120, y + 16);
            doc.setFontSize(10);
            y += 25;
        });
        
        // Coverage Description
        y += 5;
        doc.setFillColor(240, 253, 244);
        doc.rect(20, y, pageWidth - 40, 30, 'F');
        doc.setFontSize(9);
        doc.setTextColor(22, 101, 52);
        doc.text('Coverage Includes:', 25, y + 10);
        doc.setFont('helvetica', 'normal');
        doc.text('• Retirement benefits  • Disability coverage  • Death benefits  • Medical care', 25, y + 20);
        doc.text('• Dental & vision  • Unemployment benefits (up to 6 months)', 25, y + 27);
        
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
        doc.text(`Document ID: INS-${year}-${payslip.employeeId} | Generated: ${new Date().toISOString()}`, pageWidth / 2, 290, { align: 'center' });
        
        doc.save(`insurance-certificate-${year}.pdf`);
        toast.success(`Insurance certificate for ${year} downloaded!`, {
            description: 'Document saved to your downloads folder.'
        });
    };

    const handlePrint = () => {
        window.print();
    };

    return (
        <div className="space-y-6 p-6 max-w-7xl mx-auto print:p-0">
            {/* Header */}
            <div className="flex items-center justify-between print:hidden">
                <div className="flex items-center gap-4">
                    <Button variant="outline" onClick={() => router.back()}>
                        <ArrowLeft className="w-4 h-4 mr-2" />
                        Back
                    </Button>
                    <div>
                        <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                            Employee Payslip Portal
                        </h1>
                        <p className="text-slate-500 mt-1">Complete payroll transparency for employees</p>
                    </div>
                </div>
                <div className="flex gap-2">
                    <Button variant="outline" onClick={handlePrint}>
                        <Printer className="w-4 h-4 mr-2" />
                        Print
                    </Button>
                    <Button onClick={handleDownloadPayslipPDF}>
                        <Download className="w-4 h-4 mr-2" />
                        Download PDF
                    </Button>
                </div>
            </div>

            {/* Tabs Navigation */}
            <Tabs value={activeTab} onValueChange={setActiveTab} className="print:hidden">
                <TabsList className="grid w-full max-w-2xl grid-cols-3">
                    <TabsTrigger value="payslip" className="flex items-center gap-2">
                        <Receipt className="w-4 h-4" />
                        Current Payslip
                    </TabsTrigger>
                    <TabsTrigger value="documents" className="flex items-center gap-2">
                        <FileText className="w-4 h-4" />
                        Tax Documents
                    </TabsTrigger>
                    <TabsTrigger value="insurance" className="flex items-center gap-2">
                        <Shield className="w-4 h-4" />
                        Insurance Certificates
                    </TabsTrigger>
                </TabsList>

                {/* ============ PAYSLIP TAB ============ */}
                <TabsContent value="payslip" className="space-y-6 mt-6">
                    {/* Employee Info & Status */}
                    <div className="grid gap-4 md:grid-cols-2">
                        <Card className="bg-gradient-to-br from-slate-50 to-blue-50 border-blue-100">
                            <CardHeader className="pb-3">
                                <div className="flex justify-between items-start">
                                    <div>
                                        <CardTitle className="text-xl">{payslip.employeeName}</CardTitle>
                                        <CardDescription className="text-base mt-1">
                                            {payslip.position} • {payslip.department}
                                        </CardDescription>
                                    </div>
                                    <Badge variant={payslip.paymentStatus === 'PAID' ? 'default' : 'secondary'} 
                                           className={payslip.paymentStatus === 'PAID' ? 'bg-green-600' : ''}>
                                        {payslip.paymentStatus}
                                    </Badge>
                                </div>
                            </CardHeader>
                            <CardContent>
                                <div className="grid grid-cols-2 gap-4 text-sm">
                                    <div>
                                        <span className="text-slate-500">Employee ID:</span>
                                        <p className="font-medium">{payslip.employeeId}</p>
                                    </div>
                                    <div>
                                        <span className="text-slate-500">Pay Grade:</span>
                                        <p className="font-medium">{payslip.payGrade}</p>
                                    </div>
                                    <div>
                                        <span className="text-slate-500">Contract Type:</span>
                                        <p className="font-medium">{payslip.contractType}</p>
                                    </div>
                                    <div>
                                        <span className="text-slate-500">Bank Account:</span>
                                        <p className="font-medium">{payslip.bankAccount}</p>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>

                        <Card className="bg-gradient-to-br from-purple-50 to-indigo-50 border-purple-100">
                            <CardHeader className="pb-3">
                                <CardTitle className="text-lg">Pay Period</CardTitle>
                            </CardHeader>
                            <CardContent>
                                <div className="text-center">
                                    <p className="text-4xl font-bold text-purple-700">{payslip.month}</p>
                                    <p className="text-2xl text-purple-600">{payslip.year}</p>
                                    <p className="text-sm text-slate-500 mt-2">
                                        Payment Date: {new Date(payslip.paymentDate).toLocaleDateString('en-US', { 
                                            weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' 
                                        })}
                                    </p>
                                </div>
                            </CardContent>
                        </Card>
                    </div>

                    {/* Summary Cards */}
                    <div className="grid gap-4 md:grid-cols-3">
                        <Card>
                            <CardHeader className="pb-3">
                                <CardDescription>Gross Salary</CardDescription>
                                <CardTitle className="text-3xl text-green-600">
                                    {payslip.grossPay.toLocaleString('en-US', { style: 'currency', currency: 'EGP' })}
                                </CardTitle>
                            </CardHeader>
                        </Card>
                        <Card>
                            <CardHeader className="pb-3">
                                <CardDescription>Total Deductions</CardDescription>
                                <CardTitle className="text-3xl text-red-600">
                                    -{payslip.totalDeductions.toLocaleString('en-US', { style: 'currency', currency: 'EGP' })}
                                </CardTitle>
                            </CardHeader>
                        </Card>
                        <Card className="border-2 border-blue-500 bg-blue-50">
                            <CardHeader className="pb-3">
                                <CardDescription>Net Pay (Take Home)</CardDescription>
                                <CardTitle className="text-3xl text-blue-700">
                                    {payslip.netPay.toLocaleString('en-US', { style: 'currency', currency: 'EGP' })}
                                </CardTitle>
                            </CardHeader>
                        </Card>
                    </div>

                    {/* User Stories Checklist */}
                    <Card className="bg-emerald-50 border-emerald-200">
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2 text-emerald-800">
                                <CheckCircle2 className="w-5 h-5" />
                                Employee User Stories Demonstrated
                            </CardTitle>
                            <CardDescription>All employee payroll transparency requirements fulfilled</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-3">
                                {[
                                    'View base salary',
                                    'View payslip status',
                                    'View transport allowance',
                                    'View leave compensation',
                                    'View tax deductions',
                                    'View insurance deductions',
                                    'View misconduct deductions',
                                    'View unpaid leave deductions',
                                    'View employer contributions',
                                    'Download payslip PDF',
                                    'Download tax documents',
                                ].map((story, idx) => (
                                    <div key={idx} className="flex items-center gap-2 text-sm">
                                        <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0" />
                                        <span>{story}</span>
                                    </div>
                                ))}
                            </div>
                        </CardContent>
                    </Card>

                    {/* ============ EARNINGS SECTION ============ */}
                    <Card>
                        <CardHeader className="bg-gradient-to-r from-green-50 to-emerald-50 rounded-t-lg">
                            <CardTitle className="flex items-center gap-2 text-green-800">
                                <DollarSign className="w-5 h-5" />
                                Earnings Breakdown
                            </CardTitle>
                            <CardDescription>All sources of income for this pay period</CardDescription>
                        </CardHeader>
                        <CardContent className="pt-6 space-y-6">
                            {/* Base Salary - User Story */}
                            <div className="p-4 bg-slate-50 rounded-lg border">
                                <div className="flex items-center gap-2 mb-3">
                                    <Badge className="bg-slate-700">Base Salary</Badge>
                                    <span className="text-xs text-slate-500">User Story: View base salary</span>
                                </div>
                                <div className="flex justify-between items-center">
                                    <div>
                                        <p className="font-medium">Monthly Base Salary</p>
                                        <p className="text-sm text-slate-500">
                                            {payslip.contractType} - {payslip.payGrade}
                                        </p>
                                    </div>
                                    <p className="text-xl font-bold text-green-600">
                                        +{payslip.baseSalary.toLocaleString('en-US', { style: 'currency', currency: 'EGP' })}
                                    </p>
                                </div>
                            </div>

                            {/* Transport & Other Allowances - User Story */}
                            <div className="p-4 bg-blue-50 rounded-lg border border-blue-100">
                                <div className="flex items-center gap-2 mb-3">
                                    <Badge className="bg-blue-600">
                                        <Car className="w-3 h-3 mr-1" />
                                        Transport & Allowances
                                    </Badge>
                                    <span className="text-xs text-slate-500">User Story: View transport allowance</span>
                                </div>
                                <div className="space-y-3">
                                    {payslip.allowances.map((allowance) => (
                                        <div key={allowance.id} className="flex justify-between items-center py-2 border-b last:border-0">
                                            <div>
                                                <p className="font-medium">{allowance.name}</p>
                                                <p className="text-xs text-slate-500">{allowance.description}</p>
                                            </div>
                                            <p className="font-semibold text-green-600">
                                                +{allowance.amount.toLocaleString('en-US', { style: 'currency', currency: 'EGP' })}
                                            </p>
                                        </div>
                                    ))}
                                    <div className="flex justify-between items-center pt-2 border-t-2 font-bold">
                                        <span>Total Allowances</span>
                                        <span className="text-green-600">
                                            +{payslip.totalAllowances.toLocaleString('en-US', { style: 'currency', currency: 'EGP' })}
                                        </span>
                                    </div>
                                </div>
                            </div>

                            {/* Leave Compensation / Encashment - User Story */}
                            <div className="p-4 bg-emerald-50 rounded-lg border border-emerald-100">
                                <div className="flex items-center gap-2 mb-3">
                                    <Badge className="bg-emerald-600">
                                        <Palmtree className="w-3 h-3 mr-1" />
                                        Leave Compensation
                                    </Badge>
                                    <span className="text-xs text-slate-500">User Story: View leave compensation</span>
                                </div>
                                <div className="flex justify-between items-start">
                                    <div>
                                        <p className="font-medium">Leave Encashment</p>
                                        <p className="text-sm text-slate-600">
                                            {payslip.leaveEncashmentDetails.unusedAnnualDays} unused {payslip.leaveEncashmentDetails.leaveType} days
                                        </p>
                                        <p className="text-xs text-slate-500 mt-1">
                                            Daily Rate: {payslip.leaveEncashmentDetails.dailyRate.toLocaleString('en-US', { style: 'currency', currency: 'EGP' })} × {payslip.leaveEncashmentDetails.unusedAnnualDays} days
                                        </p>
                                        <p className="text-xs text-slate-500">
                                            Carried over from: {payslip.leaveEncashmentDetails.carryOverFromYear}
                                        </p>
                                    </div>
                                    <p className="text-xl font-bold text-green-600">
                                        +{payslip.leaveEncashment.toLocaleString('en-US', { style: 'currency', currency: 'EGP' })}
                                    </p>
                                </div>
                            </div>

                            {/* Overtime */}
                            {payslip.overtimeCompensation > 0 && (
                                <div className="p-4 bg-amber-50 rounded-lg border border-amber-100">
                                    <div className="flex items-center gap-2 mb-3">
                                        <Badge className="bg-amber-600">Overtime</Badge>
                                    </div>
                                    <div className="space-y-2 text-sm mb-3">
                                        <div className="flex justify-between">
                                            <span>Regular OT: {payslip.overtimeDetails.regularHours}h × {payslip.overtimeDetails.regularRate.toFixed(2)}</span>
                                            <span>{(payslip.overtimeDetails.regularHours * payslip.overtimeDetails.regularRate).toFixed(2)} EGP</span>
                                        </div>
                                        <div className="flex justify-between">
                                            <span>Night OT: {payslip.overtimeDetails.nightHours}h × {payslip.overtimeDetails.nightRate.toFixed(2)}</span>
                                            <span>{(payslip.overtimeDetails.nightHours * payslip.overtimeDetails.nightRate).toFixed(2)} EGP</span>
                                        </div>
                                        <div className="flex justify-between">
                                            <span>Weekend OT: {payslip.overtimeDetails.weekendHours}h × {payslip.overtimeDetails.weekendRate.toFixed(2)}</span>
                                            <span>{(payslip.overtimeDetails.weekendHours * payslip.overtimeDetails.weekendRate).toFixed(2)} EGP</span>
                                        </div>
                                    </div>
                                    <div className="flex justify-between items-center pt-2 border-t font-bold">
                                        <span>Total Overtime</span>
                                        <span className="text-green-600">
                                            +{payslip.overtimeCompensation.toLocaleString('en-US', { style: 'currency', currency: 'EGP' })}
                                        </span>
                                    </div>
                                </div>
                            )}

                            {/* Bonuses */}
                            {payslip.totalBonuses > 0 && (
                                <div className="p-4 bg-purple-50 rounded-lg border border-purple-100">
                                    <div className="flex items-center gap-2 mb-3">
                                        <Badge className="bg-purple-600">Bonuses</Badge>
                                    </div>
                                    <div className="space-y-3">
                                        {payslip.bonuses.map((bonus) => (
                                            <div key={bonus.id} className="flex justify-between items-center py-2 border-b last:border-0">
                                                <div>
                                                    <p className="font-medium">{bonus.name}</p>
                                                    <p className="text-xs text-slate-500">{bonus.reason}</p>
                                                </div>
                                                <p className="font-semibold text-green-600">
                                                    +{bonus.amount.toLocaleString('en-US', { style: 'currency', currency: 'EGP' })}
                                                </p>
                                            </div>
                                        ))}
                                        <div className="flex justify-between items-center pt-2 border-t-2 font-bold">
                                            <span>Total Bonuses</span>
                                            <span className="text-green-600">
                                                +{payslip.totalBonuses.toLocaleString('en-US', { style: 'currency', currency: 'EGP' })}
                                            </span>
                                        </div>
                                    </div>
                                </div>
                            )}

                            {/* Gross Total */}
                            <div className="p-4 bg-green-100 rounded-lg border-2 border-green-300">
                                <div className="flex justify-between items-center text-xl font-bold">
                                    <span className="text-green-800">TOTAL GROSS EARNINGS</span>
                                    <span className="text-green-700">
                                        {payslip.grossPay.toLocaleString('en-US', { style: 'currency', currency: 'EGP' })}
                                    </span>
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    {/* ============ DEDUCTIONS SECTION ============ */}
                    <Card>
                        <CardHeader className="bg-gradient-to-r from-red-50 to-orange-50 rounded-t-lg">
                            <CardTitle className="flex items-center gap-2 text-red-800">
                                <AlertTriangle className="w-5 h-5" />
                                Deductions Breakdown
                            </CardTitle>
                            <CardDescription>All deductions from your gross salary</CardDescription>
                        </CardHeader>
                        <CardContent className="pt-6 space-y-6">
                            {/* Tax Deductions - User Story */}
                            <div className="p-4 bg-slate-50 rounded-lg border">
                                <div className="flex items-center gap-2 mb-3">
                                    <Badge variant="destructive">Tax Deductions</Badge>
                                    <span className="text-xs text-slate-500">User Story: View tax deductions with law reference</span>
                                </div>
                                <div className="space-y-3">
                                    {payslip.taxDeductions.map((tax) => (
                                        <div key={tax.id} className="py-3 border-b last:border-0">
                                            <div className="flex justify-between items-start">
                                                <div>
                                                    <p className="font-medium">{tax.name}</p>
                                                    <p className="text-xs text-blue-600 mt-1">
                                                        📜 {tax.lawReference}
                                                    </p>
                                                    {tax.bracket && (
                                                        <p className="text-xs text-slate-500 mt-1">
                                                            Bracket: {tax.bracket.rate}% for income {tax.bracket.minIncome.toLocaleString()} - {tax.bracket.maxIncome.toLocaleString()} EGP
                                                        </p>
                                                    )}
                                                    <p className="text-xs text-slate-500">{tax.calculationDetails}</p>
                                                </div>
                                                <p className="font-semibold text-red-600">
                                                    -{tax.amount.toLocaleString('en-US', { style: 'currency', currency: 'EGP' })}
                                                </p>
                                            </div>
                                        </div>
                                    ))}
                                    <div className="flex justify-between items-center pt-2 border-t-2 font-bold">
                                        <span>Total Tax</span>
                                        <span className="text-red-600">
                                            -{payslip.totalTax.toLocaleString('en-US', { style: 'currency', currency: 'EGP' })}
                                        </span>
                                    </div>
                                </div>
                            </div>

                            {/* Insurance Deductions - User Story */}
                            <div className="p-4 bg-indigo-50 rounded-lg border border-indigo-100">
                                <div className="flex items-center gap-2 mb-3">
                                    <Badge className="bg-indigo-600">
                                        <Shield className="w-3 h-3 mr-1" />
                                        Insurance Deductions (Itemized)
                                    </Badge>
                                    <span className="text-xs text-slate-500">User Story: View insurance deductions</span>
                                </div>
                                <div className="space-y-4">
                                    {payslip.insuranceDeductions.map((insurance) => (
                                        <div key={insurance.id} className="p-3 bg-white rounded border">
                                            <div className="flex justify-between items-start mb-2">
                                                <div>
                                                    <p className="font-medium">{insurance.name}</p>
                                                    <p className="text-xs text-blue-600">📜 {insurance.lawReference}</p>
                                                </div>
                                                <p className="font-semibold text-red-600">
                                                    -{insurance.employeeContribution.toLocaleString('en-US', { style: 'currency', currency: 'EGP' })}
                                                </p>
                                            </div>
                                            <div className="grid grid-cols-3 gap-2 text-xs bg-slate-50 p-2 rounded">
                                                <div>
                                                    <span className="text-slate-500">Your Share ({insurance.rate.employee}%):</span>
                                                    <p className="font-medium">{insurance.employeeContribution.toLocaleString('en-US', { style: 'currency', currency: 'EGP' })}</p>
                                                </div>
                                                <div>
                                                    <span className="text-slate-500">Employer ({insurance.rate.employer}%):</span>
                                                    <p className="font-medium">{insurance.employerContribution.toLocaleString('en-US', { style: 'currency', currency: 'EGP' })}</p>
                                                </div>
                                                <div>
                                                    <span className="text-slate-500">Total:</span>
                                                    <p className="font-medium">{insurance.totalContribution.toLocaleString('en-US', { style: 'currency', currency: 'EGP' })}</p>
                                                </div>
                                            </div>
                                            <p className="text-xs text-slate-500 mt-2">Coverage: {insurance.coverage}</p>
                                        </div>
                                    ))}
                                    <div className="flex justify-between items-center pt-2 border-t-2 font-bold">
                                        <span>Total Insurance (Employee Share)</span>
                                        <span className="text-red-600">
                                            -{payslip.totalInsurance.toLocaleString('en-US', { style: 'currency', currency: 'EGP' })}
                                        </span>
                                    </div>
                                </div>
                            </div>

                            {/* Unpaid Leave Deductions - User Story */}
                            <div className="p-4 bg-orange-50 rounded-lg border border-orange-100">
                                <div className="flex items-center gap-2 mb-3">
                                    <Badge className="bg-orange-600">
                                        <Calendar className="w-3 h-3 mr-1" />
                                        Unpaid Leave Deductions
                                    </Badge>
                                    <span className="text-xs text-slate-500">User Story: View unpaid leave deductions</span>
                                </div>
                                <div className="space-y-3">
                                    <div className="flex justify-between items-start">
                                        <div>
                                            <p className="font-medium">{payslip.leaveDeductions.unpaidDays} Days Unpaid Leave</p>
                                            <p className="text-xs text-slate-500">
                                                Daily Rate: {payslip.leaveDeductions.dailyRate.toLocaleString('en-US', { style: 'currency', currency: 'EGP' })}
                                            </p>
                                        </div>
                                        <p className="font-semibold text-red-600">
                                            -{payslip.leaveDeductions.deductionAmount.toLocaleString('en-US', { style: 'currency', currency: 'EGP' })}
                                        </p>
                                    </div>
                                    <div className="bg-white p-3 rounded border text-sm">
                                        <p className="font-medium mb-2">Leave Details:</p>
                                        {payslip.leaveDeductions.leaveDetails.map((leave, idx) => (
                                            <div key={idx} className="flex justify-between py-1 text-xs">
                                                <span>{leave.date} - {leave.type}</span>
                                                <span>{leave.hours} hours</span>
                                            </div>
                                        ))}
                                    </div>
                                    <div className="bg-slate-100 p-2 rounded text-xs">
                                        <strong>Calculation:</strong> {payslip.leaveDeductions.calculationFormula}
                                    </div>
                                </div>
                            </div>

                            {/* Misconduct Deductions - User Story */}
                            <div className="p-4 bg-red-50 rounded-lg border border-red-200">
                                <div className="flex items-center gap-2 mb-3">
                                    <Badge variant="destructive">
                                        <AlertTriangle className="w-3 h-3 mr-1" />
                                        Misconduct & Absenteeism Deductions
                                    </Badge>
                                    <span className="text-xs text-slate-500">User Story: View misconduct deductions</span>
                                </div>
                                <div className="space-y-3">
                                    {payslip.misconductDeductions.incidents.map((incident) => (
                                        <div key={incident.id} className="p-3 bg-white rounded border border-red-100">
                                            <div className="flex justify-between items-start">
                                                <div>
                                                    <div className="flex items-center gap-2">
                                                        <p className="font-medium text-red-800">{incident.type}</p>
                                                        <span className="text-xs text-slate-500">{incident.date}</span>
                                                    </div>
                                                    <p className="text-sm text-slate-600 mt-1">{incident.description}</p>
                                                    <p className="text-xs text-blue-600 mt-1">📜 {incident.policyReference}</p>
                                                </div>
                                                <p className="font-semibold text-red-600">
                                                    -{incident.deductionAmount.toLocaleString('en-US', { style: 'currency', currency: 'EGP' })}
                                                </p>
                                            </div>
                                        </div>
                                    ))}
                                    <div className="flex justify-between items-center pt-2 border-t-2 font-bold">
                                        <span>Total Misconduct Deductions</span>
                                        <span className="text-red-600">
                                            -{payslip.misconductDeductions.totalAmount.toLocaleString('en-US', { style: 'currency', currency: 'EGP' })}
                                        </span>
                                    </div>
                                </div>
                            </div>

                            {/* Total Deductions */}
                            <div className="p-4 bg-red-100 rounded-lg border-2 border-red-300">
                                <div className="flex justify-between items-center text-xl font-bold">
                                    <span className="text-red-800">TOTAL DEDUCTIONS</span>
                                    <span className="text-red-700">
                                        -{payslip.totalDeductions.toLocaleString('en-US', { style: 'currency', currency: 'EGP' })}
                                    </span>
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    {/* ============ EMPLOYER CONTRIBUTIONS - User Story ============ */}
                    <Card className="border-2 border-indigo-200">
                        <CardHeader className="bg-gradient-to-r from-indigo-50 to-purple-50 rounded-t-lg">
                            <div className="flex items-center gap-2">
                                <Badge className="bg-indigo-600 text-base px-3 py-1">
                                    <Building2 className="w-4 h-4 mr-1" />
                                    Employer Contributions
                                </Badge>
                            </div>
                            <CardTitle className="text-indigo-800 mt-2">Total Rewards - What Your Employer Pays</CardTitle>
                            <CardDescription>
                                User Story: View employer contributions (insurance, pension, allowances)
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="pt-6 space-y-4">
                            <p className="text-sm text-slate-600 bg-indigo-50 p-3 rounded">
                                💡 These contributions are paid by your employer on your behalf and are NOT deducted from your salary. 
                                They represent additional value in your total compensation package.
                            </p>
                            
                            {payslip.employerContributions.map((contribution) => (
                                <div key={contribution.id} className="flex justify-between items-center py-3 px-4 bg-white rounded border hover:shadow-sm transition-shadow">
                                    <div>
                                        <p className="font-medium">{contribution.name}</p>
                                        <p className="text-xs text-slate-500">{contribution.description}</p>
                                    </div>
                                    <p className="text-lg font-bold text-indigo-600">
                                        +{contribution.employerContribution.toLocaleString('en-US', { style: 'currency', currency: 'EGP' })}
                                    </p>
                                </div>
                            ))}

                            <div className="p-4 bg-indigo-100 rounded-lg border-2 border-indigo-300">
                                <div className="flex justify-between items-center text-xl font-bold mb-4">
                                    <span className="text-indigo-800">TOTAL EMPLOYER CONTRIBUTIONS</span>
                                    <span className="text-indigo-700">
                                        {payslip.totalEmployerContributions.toLocaleString('en-US', { style: 'currency', currency: 'EGP' })}
                                    </span>
                                </div>
                                <div className="bg-white p-4 rounded">
                                    <p className="font-semibold text-indigo-900 mb-2">Your Total Compensation Package:</p>
                                    <div className="grid grid-cols-3 gap-4 text-center">
                                        <div>
                                            <p className="text-sm text-slate-500">Net Pay</p>
                                            <p className="text-lg font-bold text-green-600">
                                                {payslip.netPay.toLocaleString('en-US', { style: 'currency', currency: 'EGP' })}
                                            </p>
                                        </div>
                                        <div>
                                            <p className="text-sm text-slate-500">+ Employer Benefits</p>
                                            <p className="text-lg font-bold text-indigo-600">
                                                {payslip.totalEmployerContributions.toLocaleString('en-US', { style: 'currency', currency: 'EGP' })}
                                            </p>
                                        </div>
                                        <div className="bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded p-2">
                                            <p className="text-sm opacity-90">= Total Value</p>
                                            <p className="text-xl font-bold">
                                                {(payslip.netPay + payslip.totalEmployerContributions).toLocaleString('en-US', { style: 'currency', currency: 'EGP' })}
                                            </p>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    {/* NET PAY FINAL */}
                    <Card className="border-4 border-blue-500 bg-gradient-to-r from-blue-50 to-indigo-50">
                        <CardContent className="py-8">
                            <div className="text-center">
                                <p className="text-slate-600 text-lg mb-2">Your Take-Home Pay for {payslip.month} {payslip.year}</p>
                                <p className="text-5xl font-black text-blue-700">
                                    {payslip.netPay.toLocaleString('en-US', { style: 'currency', currency: 'EGP' })}
                                </p>
                                <p className="text-sm text-slate-500 mt-4">
                                    Deposited to account ending in {payslip.bankAccount} on {payslip.paymentDate}
                                </p>
                            </div>
                        </CardContent>
                    </Card>
                </TabsContent>

                {/* ============ TAX DOCUMENTS TAB - User Story ============ */}
                <TabsContent value="documents" className="space-y-6 mt-6">
                    <Card className="bg-emerald-50 border-emerald-200">
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2 text-emerald-800">
                                <CheckCircle2 className="w-5 h-5" />
                                User Story: Download Tax Documents
                            </CardTitle>
                            <CardDescription>
                                As an Employee, I want to download tax documents (e.g., annual tax statement) so that I can use them for official purposes.
                            </CardDescription>
                        </CardHeader>
                    </Card>

                    <div className="grid gap-4">
                        {mockTaxDocuments.map((doc) => (
                            <Card key={doc.year} className="hover:shadow-md transition-shadow">
                                <CardHeader>
                                    <div className="flex justify-between items-start">
                                        <div className="flex items-center gap-3">
                                            <div className="p-3 bg-blue-100 rounded-lg">
                                                <FileText className="w-8 h-8 text-blue-600" />
                                            </div>
                                            <div>
                                                <CardTitle>Tax Certificate {doc.year}</CardTitle>
                                                <CardDescription>Annual Income Tax Statement</CardDescription>
                                            </div>
                                        </div>
                                        <Badge variant={doc.status === 'Available' ? 'default' : 'secondary'} className="bg-green-600">
                                            {doc.status}
                                        </Badge>
                                    </div>
                                </CardHeader>
                                <CardContent>
                                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                                        <div>
                                            <p className="text-sm text-slate-500">Total Income</p>
                                            <p className="font-semibold">{doc.totalIncome.toLocaleString('en-US', { style: 'currency', currency: 'EGP' })}</p>
                                        </div>
                                        <div>
                                            <p className="text-sm text-slate-500">Total Tax Paid</p>
                                            <p className="font-semibold text-red-600">{doc.totalTax.toLocaleString('en-US', { style: 'currency', currency: 'EGP' })}</p>
                                        </div>
                                        <div>
                                            <p className="text-sm text-slate-500">Employer</p>
                                            <p className="font-semibold">{doc.employerName}</p>
                                        </div>
                                        <div>
                                            <p className="text-sm text-slate-500">Document Date</p>
                                            <p className="font-semibold">{doc.documentDate}</p>
                                        </div>
                                    </div>
                                    <Button onClick={() => handleDownloadTaxDocument(doc.year)} className="w-full">
                                        <Download className="w-4 h-4 mr-2" />
                                        Download Tax Certificate {doc.year}
                                    </Button>
                                </CardContent>
                            </Card>
                        ))}
                    </div>
                </TabsContent>

                {/* ============ INSURANCE CERTIFICATES TAB ============ */}
                <TabsContent value="insurance" className="space-y-6 mt-6">
                    <Card className="bg-emerald-50 border-emerald-200">
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2 text-emerald-800">
                                <CheckCircle2 className="w-5 h-5" />
                                Insurance Certificates
                            </CardTitle>
                            <CardDescription>
                                Download your insurance contribution certificates showing all social, health, and pension contributions.
                            </CardDescription>
                        </CardHeader>
                    </Card>

                    <div className="grid gap-4">
                        {mockInsuranceCertificates.map((cert) => (
                            <Card key={cert.year} className="hover:shadow-md transition-shadow">
                                <CardHeader>
                                    <div className="flex justify-between items-start">
                                        <div className="flex items-center gap-3">
                                            <div className="p-3 bg-green-100 rounded-lg">
                                                <Shield className="w-8 h-8 text-green-600" />
                                            </div>
                                            <div>
                                                <CardTitle>Insurance Certificate {cert.year}</CardTitle>
                                                <CardDescription>Social & Health Insurance Contributions</CardDescription>
                                            </div>
                                        </div>
                                        <Badge className="bg-green-600">
                                            {cert.status}
                                        </Badge>
                                    </div>
                                </CardHeader>
                                <CardContent>
                                    <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-4">
                                        <div>
                                            <p className="text-sm text-slate-500">Your Contributions</p>
                                            <p className="font-semibold">{cert.employeeContributions.toLocaleString('en-US', { style: 'currency', currency: 'EGP' })}</p>
                                        </div>
                                        <div>
                                            <p className="text-sm text-slate-500">Employer Contributions</p>
                                            <p className="font-semibold text-indigo-600">{cert.employerContributions.toLocaleString('en-US', { style: 'currency', currency: 'EGP' })}</p>
                                        </div>
                                        <div>
                                            <p className="text-sm text-slate-500">Total Contributions</p>
                                            <p className="font-semibold text-green-600">{cert.totalContributions.toLocaleString('en-US', { style: 'currency', currency: 'EGP' })}</p>
                                        </div>
                                    </div>
                                    <div className="mb-4">
                                        <p className="text-sm text-slate-500 mb-2">Coverage Types:</p>
                                        <div className="flex flex-wrap gap-2">
                                            {cert.coverageTypes.map((type) => (
                                                <Badge key={type} variant="outline">{type}</Badge>
                                            ))}
                                        </div>
                                    </div>
                                    <Button onClick={() => handleDownloadInsuranceCertificate(cert.year)} className="w-full" variant="outline">
                                        <Download className="w-4 h-4 mr-2" />
                                        Download Insurance Certificate {cert.year}
                                    </Button>
                                </CardContent>
                            </Card>
                        ))}
                    </div>
                </TabsContent>
            </Tabs>
        </div>
    );
}
