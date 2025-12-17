import { PayslipDto } from '@/services/api';

export const MOCK_PAYSLIPS: PayslipDto[] = [
    {
        _id: 'mock-1',
        employee: 'emp-1',
        createdAt: new Date().toISOString(),
        totalGrossSalary: 5000,
        netPay: 4500,
        totalDeductions: 500,
        paymentStatus: 'PAID',
        payPeriod: 'January 2025'
    },
    {
        _id: 'mock-2',
        employee: 'emp-1',
        createdAt: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(),
        totalGrossSalary: 5000,
        netPay: 4500,
        totalDeductions: 500,
        paymentStatus: 'PAID',
        payPeriod: 'December 2024'
    },
    {
        _id: 'mock-3',
        employee: 'emp-1',
        createdAt: new Date(Date.now() - 60 * 24 * 60 * 60 * 1000).toISOString(),
        totalGrossSalary: 5200,
        netPay: 4680,
        totalDeductions: 520,
        paymentStatus: 'PAID',
        payPeriod: 'November 2024'
    }
];
