'use client';

import { EnhancedPayslipDataDto } from '@/services/api';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { AlertTriangle, Info, TrendingUp } from 'lucide-react';

interface EnhancedPayslipWidgetProps {
    data: EnhancedPayslipDataDto;
    // Override values from the actual payslip (authoritative source)
    payslipOverrides?: {
        grossPay: number;
        totalDeductions: number;
        netPay: number;
    };
}

export default function EnhancedPayslipWidget({ data, payslipOverrides }: EnhancedPayslipWidgetProps) {
    // Use payslip overrides if provided (these are the authoritative values)
    const displayGrossPay = payslipOverrides?.grossPay ?? data.grossPay;
    const displayTotalDeductions = payslipOverrides?.totalDeductions ?? data.totalDeductions;
    const displayNetPay = payslipOverrides?.netPay ?? data.netPay;
    return (
        <div className="space-y-6">
            {/* Minimum Wage Alert */}
            {data.minimumWageAlert && (
                <Alert variant="destructive">
                    <AlertTriangle className="h-4 w-4" />
                    <AlertDescription>
                        <strong>Minimum Wage Alert:</strong> Your net pay ({displayNetPay.toLocaleString()} EGP) is below the legal minimum wage ({data.minimumWage.toLocaleString()} EGP). This has been flagged for HR review.
                    </AlertDescription>
                </Alert>
            )}

            {/* Itemized Earnings */}
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <TrendingUp className="h-5 w-5 text-green-600" />
                        Earnings Breakdown
                    </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                    {/* Base Salary */}
                    <div className="flex justify-between items-center">
                        <div>
                            <p className="font-medium">Base Salary</p>
                            {data.payGrade && data.payGrade !== 'N/A' && (
                                <p className="text-sm text-muted-foreground">Pay Grade: {data.payGrade}</p>
                            )}
                        </div>
                        <p className="font-bold text-lg">{data.baseSalary.toLocaleString()} EGP</p>
                    </div>

                    <Separator />

                    {/* Allowances */}
                    {data.allowances.length > 0 && (
                        <>
                            <div>
                                <p className="font-medium mb-2">Allowances</p>
                                <div className="space-y-2 pl-4">
                                    {data.allowances.map((allowance) => (
                                        <div key={allowance.id} className="flex justify-between items-center text-sm">
                                            <span className="text-muted-foreground">{allowance.name}</span>
                                            <span className="font-medium">+{allowance.amount.toLocaleString()} EGP</span>
                                        </div>
                                    ))}
                                    <div className="flex justify-between items-center text-sm font-bold pt-1 border-t">
                                        <span>Total Allowances</span>
                                        <span>+{data.totalAllowances.toLocaleString()} EGP</span>
                                    </div>
                                </div>
                            </div>
                            <Separator />
                        </>
                    )}

                    {/* Overtime */}
                    {data.overtimeCompensation > 0 && (
                        <>
                            <div className="flex justify-between items-center">
                                <div>
                                    <p className="font-medium">Overtime Compensation</p>
                                    <p className="text-sm text-muted-foreground">From Time Management</p>
                                </div>
                                <p className="font-medium text-green-600">+{data.overtimeCompensation.toLocaleString()} EGP</p>
                            </div>
                            <Separator />
                        </>
                    )}

                    {/* Leave Encashment */}
                    {data.leaveEncashment && data.leaveEncashment > 0 && (
                        <>
                            <div className="flex justify-between items-center">
                                <div>
                                    <p className="font-medium">Leave Encashment</p>
                                    <p className="text-sm text-muted-foreground">Unused leave days converted to cash</p>
                                </div>
                                <p className="font-medium text-green-600">+{data.leaveEncashment.toLocaleString()} EGP</p>
                            </div>
                            <Separator />
                        </>
                    )}

                    {/* Gross Pay */}
                    <div className="flex justify-between items-center bg-green-50 dark:bg-green-950 p-3 rounded-lg">
                        <p className="font-bold text-lg">Gross Pay</p>
                        <p className="font-bold text-xl text-green-600">{displayGrossPay.toLocaleString()} EGP</p>
                    </div>
                </CardContent>
            </Card>

            {/* Itemized Deductions */}
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-red-600">
                        <AlertTriangle className="h-5 w-5" />
                        Deductions Breakdown
                    </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                    {/* Tax Deductions */}
                    {data.taxDeductions.length > 0 && (
                        <>
                            <div>
                                <p className="font-medium mb-2">Income Tax</p>
                                <div className="space-y-2 pl-4">
                                    {data.taxDeductions.map((tax) => (
                                        <div key={tax.id} className="space-y-1">
                                            <div className="flex justify-between items-center text-sm">
                                                <span className="text-muted-foreground">{tax.name}</span>
                                                <span className="font-medium text-red-600">-{tax.amount.toLocaleString()} EGP</span>
                                            </div>
                                            <div className="text-xs text-muted-foreground pl-2 flex items-start gap-1">
                                                <Info className="h-3 w-3 mt-0.5 flex-shrink-0" />
                                                <span>{tax.lawReference}</span>
                                            </div>
                                        </div>
                                    ))}
                                    <div className="flex justify-between items-center text-sm font-bold pt-1 border-t">
                                        <span>Total Tax</span>
                                        <span className="text-red-600">-{data.totalTax.toLocaleString()} EGP</span>
                                    </div>
                                </div>
                            </div>
                            <Separator />
                        </>
                    )}

                    {/* Insurance Deductions */}
                    {data.insuranceDeductions.length > 0 && (
                        <>
                            <div>
                                <p className="font-medium mb-2">Insurance Contributions</p>
                                <div className="space-y-2 pl-4">
                                    {data.insuranceDeductions.map((insurance) => (
                                        <div key={insurance.id} className="space-y-1">
                                            <div className="flex justify-between items-center text-sm">
                                                <span className="text-muted-foreground">{insurance.name}</span>
                                                <span className="font-medium text-red-600">-{insurance.employeeContribution.toLocaleString()} EGP</span>
                                            </div>
                                            <div className="text-xs text-muted-foreground pl-2">
                                                (Employer contributes: {insurance.employerContribution.toLocaleString()} EGP)
                                            </div>
                                        </div>
                                    ))}
                                    <div className="flex justify-between items-center text-sm font-bold pt-1 border-t">
                                        <span>Total Insurance</span>
                                        <span className="text-red-600">-{data.totalInsurance.toLocaleString()} EGP</span>
                                    </div>
                                </div>
                            </div>
                            <Separator />
                        </>
                    )}

                    {/* Leave Deductions */}
                    {data.leaveDeductions && data.leaveDeductions.unpaidDays > 0 && (
                        <>
                            <div className="flex justify-between items-center">
                                <div>
                                    <p className="font-medium">Unpaid Leave Deduction</p>
                                    <p className="text-sm text-muted-foreground">{data.leaveDeductions.unpaidDays} days</p>
                                    <p className="text-xs text-muted-foreground mt-1">{data.leaveDeductions.calculationFormula}</p>
                                </div>
                                <p className="font-medium text-red-600">-{data.leaveDeductions.deductionAmount.toLocaleString()} EGP</p>
                            </div>
                            <Separator />
                        </>
                    )}

                    {/* Time-Based Penalties */}
                    {data.timeBasedPenalties > 0 && (
                        <>
                            <div className="flex justify-between items-center">
                                <div>
                                    <p className="font-medium">Time-Based Penalties</p>
                                    <p className="text-sm text-muted-foreground">From Time Management</p>
                                </div>
                                <p className="font-medium text-red-600">-{data.timeBasedPenalties.toLocaleString()} EGP</p>
                            </div>
                            <Separator />
                        </>
                    )}

                    {/* Total Deductions */}
                    <div className="flex justify-between items-center bg-red-50 dark:bg-red-950 p-3 rounded-lg">
                        <p className="font-bold text-lg">Total Deductions</p>
                        <p className="font-bold text-xl text-red-600">-{displayTotalDeductions.toLocaleString()} EGP</p>
                    </div>
                </CardContent>
            </Card>

            {/* Net Pay */}
            <Card className="border-2 border-primary">
                <CardContent className="pt-6">
                    <div className="flex justify-between items-center">
                        <div>
                            <p className="text-lg font-medium text-muted-foreground">Net Pay</p>
                            <p className="text-sm text-muted-foreground">Amount you receive</p>
                        </div>
                        <p className="text-3xl font-bold text-primary">{displayNetPay.toLocaleString()} EGP</p>
                    </div>
                </CardContent>
            </Card>

            {/* Total Rewards (Employer Contributions) */}
            {data.employerContributions.length > 0 && (
                <Card className="bg-blue-50 dark:bg-blue-950">
                    <CardHeader>
                        <CardTitle className="text-blue-700 dark:text-blue-300">Your Total Rewards Package</CardTitle>
                        <p className="text-sm text-muted-foreground">Beyond your salary - see what else your employer provides</p>
                    </CardHeader>
                    <CardContent className="space-y-3">
                        <div className="flex justify-between items-center">
                            <span className="font-medium">Your Net Pay</span>
                            <span className="font-bold">{displayNetPay.toLocaleString()} EGP</span>
                        </div>

                        <div className="space-y-2 pl-4 border-l-2 border-blue-300">
                            <p className="text-sm font-medium text-blue-700 dark:text-blue-300">+ Employer Contributions:</p>
                            {data.employerContributions.map((contrib) => (
                                <div key={contrib.id} className="flex justify-between items-center text-sm">
                                    <span className="text-muted-foreground">{contrib.name}</span>
                                    <span className="font-medium">+{contrib.employerContribution.toLocaleString()} EGP</span>
                                </div>
                            ))}
                        </div>

                        <Separator />

                        <div className="flex justify-between items-center bg-blue-100 dark:bg-blue-900 p-3 rounded-lg">
                            <p className="font-bold text-lg">Total Package Value</p>
                            <p className="font-bold text-2xl text-blue-700 dark:text-blue-300">
                                {(displayNetPay + data.totalEmployerContributions).toLocaleString()} EGP
                            </p>
                        </div>

                        <Alert className="bg-blue-100 dark:bg-blue-900 border-blue-300">
                            <Info className="h-4 w-4 text-blue-700" />
                            <AlertDescription className="text-sm text-blue-800 dark:text-blue-200">
                                Your employer contributes an additional <strong>{data.totalEmployerContributions.toLocaleString()} EGP</strong> towards your insurance and benefits. This is part of your total compensation package.
                            </AlertDescription>
                        </Alert>
                    </CardContent>
                </Card>
            )}
        </div>
    );
}
