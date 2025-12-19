import { Controller, Get } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';

@ApiTags('mock-demo')
@Controller('mock-demo')
export class MockDemoController {
    @Get('payslip')
    @ApiOperation({ summary: 'Get mock payslip data (No Auth Required)' })
    @ApiResponse({ status: 200, description: 'Mock payslip data' })
    getMockPayslip() {
        return {
            success: true,
            data: {
                payslipId: "MOCK-001",
                month: "December",
                year: 2024,
                employeeName: "Fares Hala (Demo)",
                contractType: "FULL_TIME",
                payGrade: "Senior",
                baseSalary: 85000,
                allowances: [
                    { id: "a1", name: "Transportation Allowance", amount: 2000 },
                    { id: "a2", name: "Housing Allowance", amount: 5000 }
                ],
                totalAllowances: 7000,
                overtimeCompensation: 3000,
                leaveEncashment: 14167,
                grossPay: 109167,
                taxDeductions: [{
                    id: "t1", name: "Income Tax", amount: 5000, category: "TAX"
                }],
                totalTax: 5000,
                insuranceDeductions: [
                    { id: "i1", name: "Health Insurance", amount: 850, category: "HEALTH", employeeContribution: 850, employerContribution: 850 },
                    { id: "i2", name: "Pension Insurance", amount: 1275, category: "PENSION", employeeContribution: 1275, employerContribution: 1275 },
                    { id: "i3", name: "Unemployment Insurance", amount: 425, category: "UNEMPLOYMENT", employeeContribution: 425, employerContribution: 425 }
                ],
                totalInsurance: 2550,
                leaveDeductions: {
                    unpaidDays: 3,
                    deductionAmount: 8500,
                    calculationFormula: "(85000 / 30) × 3 days",
                    leaveDetails: [
                        "Unpaid Leave: Dec 10-12, 2024",
                        "Reason: Personal leave without pay"
                    ]
                },
                unpaidLeaveDeduction: 8500,
                misconductDeductions: 1500,
                totalDeductions: 17550,
                netPay: 91617,
                employerContributions: {
                    health: 850,
                    pension: 1275,
                    unemployment: 425,
                    total: 2550
                },
                totalCompensationPackage: 94167,
                paymentDate: "2024-12-31",
                bankDetails: {
                    accountNumber: "****1234",
                    bankName: "Sample Bank"
                },
                notes: ["All 7 employee user stories demonstrated in this mock payslip"],
                disputeEligibleItems: ["misconductDeductions", "unpaidLeaveDeduction"]
            },
            message: "Mock payslip retrieved successfully - All user stories demonstrated"
        };
    }

    @Get('penalties')
    @ApiOperation({ summary: 'Get mock penalty details (No Auth Required)' })
    @ApiResponse({ status: 200, description: 'Mock penalty data' })
    getMockPenalties() {
        return {
            success: true,
            data: {
                penalties: [
                    {
                        id: "p1",
                        type: "LATE_ARRIVAL",
                        date: "2024-12-05",
                        description: "Late to work by 30 minutes",
                        amount: 500,
                        status: "DEDUCTED"
                    },
                    {
                        id: "p2",
                        type: "UNAUTHORIZED_ABSENCE",
                        date: "2024-12-12",
                        description: "Absent without notification",
                        amount: 750,
                        status: "DEDUCTED"
                    },
                    {
                        id: "p3",
                        type: "POLICY_VIOLATION",
                        date: "2024-12-18",
                        description: "Dress code violation",
                        amount: 250,
                        status: "DEDUCTED"
                    }
                ],
                totalPenalties: 1500,
                overtime: [],
                totalOvertimeCompensation: 0,
                permissions: []
            },
            message: "Mock penalty data retrieved successfully"
        };
    }
}
