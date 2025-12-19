'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import axios from 'axios';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Loader2, ArrowLeft, CheckCircle2 } from 'lucide-react';

export default function MockPayslipPage() {
    const router = useRouter();
    const [payslip, setPayslip] = useState<any | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchMockData = async () => {
            try {
                const response = await axios.get('http://localhost:3001/api/mock-demo/payslip');
                setPayslip(response.data.data);
            } catch (error) {
                console.error('Error fetching mock data:', error);
            } finally {
                setLoading(false);
            }
        };
        fetchMockData();
    }, []);

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-screen">
                <div className="text-center">
                    <Loader2 className="h-12 w-12 animate-spin text-blue-600 mx-auto mb-4" />
                    <p>Loading mock payslip data...</p>
                </div>
            </div>
        );
    }

    if (!payslip) {
        return (
            <div className="flex items-center justify-center min-h-screen">
                <Card className="max-w-md">
                    <CardHeader>
                        <CardTitle className="text-red-600">Error</CardTitle>
                        <CardDescription>Failed to load mock data</CardDescription>
                    </CardHeader>
                </Card>
            </div>
        );
    }

    return (
        <div className="space-y-6 p-6 max-w-7xl mx-auto">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                    <Button variant="outline" onClick={() => router.back()}>
                        <ArrowLeft className="w-4 h-4 mr-2" />
                        Back
                    </Button>
                    <div>
                        <h1 className="text-3xl font-bold">Mock Payslip Demo</h1>
                        <p className="text-gray-500">Demonstrating All Employee User Stories</p>
                    </div>
                </div>
                <Badge variant="secondary" className="text-lg px-4 py-2">
                    {payslip.month} {payslip.year}
                </Badge>
            </div>

            {/* Employee Info */}
            <Card className="bg-gradient-to-r from-blue-50 to-indigo-50">
                <CardHeader>
                    <CardTitle className="text-2xl">{payslip.employeeName}</CardTitle>
                    <CardDescription className="text-base">
                        {payslip.contractType} • {payslip.payGrade}
                    </CardDescription>
                </CardHeader>
            </Card>

            {/* Summary Cards */}
            <div className="grid gap-4 md:grid-cols-3">
                <Card>
                    <CardHeader className="pb-3">
                        <CardDescription>Gross Salary</CardDescription>
                        <CardTitle className="text-3xl text-green-600">
                            ${payslip.grossPay.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                        </CardTitle>
                    </CardHeader>
                </Card>
                <Card>
                    <CardHeader className="pb-3">
                        <CardDescription>Total Deductions</CardDescription>
                        <CardTitle className="text-3xl text-red-600">
                            -${payslip.totalDeductions.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                        </CardTitle>
                    </CardHeader>
                </Card>
                <Card className="border-2 border-blue-500">
                    <CardHeader className="pb-3">
                        <CardDescription>Net Pay</CardDescription>
                        <CardTitle className="text-3xl text-blue-600">
                            ${payslip.netPay.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                        </CardTitle>
                    </CardHeader>
                </Card>
            </div>

            {/* User Story Indicators */}
            <Card className="bg-green-50 border-green-200">
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <CheckCircle2 className="w-5 h-5 text-green-600" />
                        User Stories Demonstrated on This Page
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="grid md:grid-cols-2 gap-2">
                        <div className="flex items-center gap-2">
                            <CheckCircle2 className="w-4 h-4 text-green-600" />
                            <span className="text-sm">View transport allowance</span>
                        </div>
                        <div className="flex items-center gap-2">
                            <CheckCircle2 className="w-4 h-4 text-green-600" />
                            <span className="text-sm">View leave compensation</span>
                        </div>
                        <div className="flex items-center gap-2">
                            <CheckCircle2 className="w-4 h-4 text-green-600" />
                            <span className="text-sm">View insurance deductions (itemized)</span>
                        </div>
                        <div className="flex items-center gap-2">
                            <CheckCircle2 className="w-4 h-4 text-green-600" />
                            <span className="text-sm">View misconduct deductions</span>
                        </div>
                        <div className="flex items-center gap-2">
                            <CheckCircle2 className="w-4 h-4 text-green-600" />
                            <span className="text-sm">View unpaid leave deductions</span>
                        </div>
                        <div className="flex items-center gap-2">
                            <CheckCircle2 className="w-4 h-4 text-green-600" />
                            <span className="text-sm">View employer contributions</span>
                        </div>
                    </div>
                </CardContent>
            </Card>

            {/* Earnings Breakdown */}
            <Card>
                <CardHeader>
                    <CardTitle>💰 Earnings Breakdown</CardTitle>
                    <CardDescription>All sources of income for this period</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                    {/* Base Salary */}
                    <div className="flex justify-between items-center py-2 border-b">
                        <div>
                            <p className="font-medium">Base Salary</p>
                            <p className="text-sm text-gray-500">Monthly base compensation</p>
                        </div>
                        <p className="font-semibold">${payslip.baseSalary.toLocaleString('en-US', { minimumFractionDigits: 2 })}</p>
                    </div>

                    {/* Transport Allowance - USER STORY */}
                    <div className="bg-blue-50 p-4 rounded-lg">
                        <div className="flex items-center gap-2 mb-2">
                            <Badge className="bg-blue-600">User Story #2</Badge>
                            <span className="font-semibold">Transport & Other Allowances</span>
                        </div>
                        {payslip.allowances.map((allowance: any) => (
                            <div key={allowance.id} className="flex justify-between py-1 pl-4">
                                <span className="text-sm">{allowance.name}</span>
                                <span className="text-sm font-medium text-green-600">
                                    +${allowance.amount.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                                </span>
                            </div>
                        ))}
                        <div className="border-t mt-2 pt-2 flex justify-between font-semibold pl-4">
                            <span>Total Allowances</span>
                            <span className="text-green-600">+${payslip.totalAllowances.toLocaleString('en-US', { minimumFractionDigits: 2 })}</span>
                        </div>
                    </div>

                    {/* Leave Encashment - USER STORY */}
                    <div className="bg-green-50 p-4 rounded-lg">
                        <div className="flex items-center gap-2 mb-2">
                            <Badge className="bg-green-600">User Story #1</Badge>
                            <span className="font-semibold">Leave Compensation</span>
                        </div>
                        <div className="flex justify-between py-1 pl-4">
                            <div>
                                <span className="text-sm">Leave Encashment</span>
                                <p className="text-xs text-gray-500">5 unused annual leave days</p>
                            </div>
                            <span className="text-sm font-medium text-green-600">
                                +${payslip.leaveEncashment.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                            </span>
                        </div>
                    </div>

                    {/* Overtime */}
                    {payslip.overtimeCompensation > 0 && (
                        <div className="flex justify-between py-2">
                            <span>Overtime Compensation</span>
                            <span className="text-green-600">+${payslip.overtimeCompensation.toLocaleString('en-US', { minimumFractionDigits: 2 })}</span>
                        </div>
                    )}
                </CardContent>
            </Card>

            {/* Deductions Breakdown */}
            <Card>
                <CardHeader>
                    <CardTitle>📊 Deductions Breakdown</CardTitle>
                    <CardDescription>All deductions from your gross salary</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                    {/* Tax */}
                    <div className="flex justify-between items-center py-2 border-b">
                        <div>
                            <p className="font-medium">Income Tax</p>
                            <p className="text-xs text-gray-500">{payslip.taxDeductions[0].lawReference}</p>
                        </div>
                        <p className="font-semibold text-red-600">
                            -${payslip.totalTax.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                        </p>
                    </div>

                    {/* Insurance Deductions - USER STORY */}
                    <div className="bg-purple-50 p-4 rounded-lg">
                        <div className="flex items-center gap-2 mb-2">
                            <Badge className="bg-purple-600">User Story #3</Badge>
                            <span className="font-semibold">Insurance Deductions (Itemized)</span>
                        </div>
                        {payslip.insuranceDeductions.map((insurance: any) => (
                            <div key={insurance.id} className="py-2 pl-4 border-b last:border-0">
                                <div className="flex justify-between">
                                    <span className="text-sm font-medium">{insurance.name}</span>
                                    <span className="text-sm font-medium text-red-600">
                                        -${insurance.employeeContribution.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                                    </span>
                                </div>
                                <div className="text-xs text-gray-500 mt-1 flex justify-between">
                                    <span>You pay: ${insurance.employeeContribution}</span>
                                    <span>Employer pays: ${insurance.employerContribution}</span>
                                    <span>Total: ${insurance.totalContribution}</span>
                                </div>
                            </div>
                        ))}
                        <div className="border-t mt-2 pt-2 flex justify-between font-semibold pl-4">
                            <span>Total Insurance</span>
                            <span className="text-red-600">-${payslip.totalInsurance.toLocaleString('en-US', { minimumFractionDigits: 2 })}</span>
                        </div>
                    </div>

                    {/* Unpaid Leave - USER STORY */}
                    <div className="bg-orange-50 p-4 rounded-lg">
                        <div className="flex items-center gap-2 mb-2">
                            <Badge className="bg-orange-600">User Story #5</Badge>
                            <span className="font-semibold">Unpaid Leave Deduction</span>
                        </div>
                        <div className="pl-4 space-y-2">
                            <div className="flex justify-between">
                                <div>
                                    <span className="text-sm">{payslip.leaveDeductions.unpaidDays} days unpaid leave</span>
                                    <p className="text-xs text-gray-500">{payslip.leaveDeductions.leaveDetails[0]}</p>
                                </div>
                                <span className="text-sm font-medium text-red-600">
                                    -${payslip.leaveDeductions.deductionAmount.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                                </span>
                            </div>
                            <div className="bg-white p-2 rounded text-xs">
                                <strong>Calculation:</strong> {payslip.leaveDeductions.calculationFormula}
                            </div>
                        </div>
                    </div>

                    {/* Misconduct Penalties - USER STORY */}
                    <div className="bg-red-50 p-4 rounded-lg">
                        <div className="flex items-center gap-2 mb-2">
                            <Badge className="bg-red-600">User Story #4</Badge>
                            <span className="font-semibold">Misconduct & Time Penalties</span>
                        </div>
                        <div className="pl-4">
                            <div className="flex justify-between">
                                <div>
                                    <span className="text-sm">Time-based penalties</span>
                                    <p className="text-xs text-gray-500">3 incidents (absence, late, policy violation)</p>
                                </div>
                                <span className="text-sm font-medium text-red-600">
                                    -${payslip.timeBasedPenalties.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                                </span>
                            </div>
                            <p className="text-xs text-blue-600 mt-2">
                                💡 View detailed breakdown at /time-impact/mock endpoint
                            </p>
                        </div>
                    </div>
                </CardContent>
            </Card>

            {/* Employer Contributions - USER STORY */}
            <Card className="bg-gradient-to-r from-indigo-50 to-purple-50">
                <CardHeader>
                    <div className="flex items-center gap-2">
                        <Badge className="bg-indigo-600 text-lg px-3 py-1">User Story #6</Badge>
                        <CardTitle>🎁 Total Rewards - Employer Contributions</CardTitle>
                    </div>
                    <CardDescription>Your employer also contributes to your benefits (not deducted from your salary)</CardDescription>
                </CardHeader>
                <CardContent className="space-y-3">
                    {payslip.employerContributions.map((contribution: any) => (
                        <div key={contribution.id} className="flex justify-between items-center py-2 bg-white rounded px-4">
                            <div>
                                <span className="font-medium">{contribution.name}</span>
                                <p className="text-xs text-gray-500">Company contribution on your behalf</p>
                            </div>
                            <span className="font-semibold text-lg text-indigo-600">
                                +${contribution.employerContribution.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                            </span>
                        </div>
                    ))}
                    <div className="border-t-2 border-indigo-300 pt-3 flex justify-between items-center font-bold text-lg">
                        <span>Total Employer Contributions</span>
                        <span className="text-indigo-700">
                            ${payslip.totalEmployerContributions.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                        </span>
                    </div>
                    <div className="bg-indigo-100 p-3 rounded text-sm">
                        <p className="font-medium">💡 Your Total Compensation Package:</p>
                        <p className="text-indigo-900">
                            Net Pay (${payslip.netPay.toLocaleString()}) + Employer Benefits (${payslip.totalEmployerContributions.toLocaleString()})
                            = <strong>${(payslip.netPay + payslip.totalEmployerContributions).toLocaleString()}</strong> total value
                        </p>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}
