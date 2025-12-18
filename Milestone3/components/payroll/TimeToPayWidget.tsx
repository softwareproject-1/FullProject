'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { TimeImpactDataDto } from '@/services/api';
import { AlertTriangle, Clock, DollarSign, TrendingUp, TrendingDown } from 'lucide-react';

interface TimeToPayWidgetProps {
    data: TimeImpactDataDto | null;
    loading?: boolean;
}

export default function TimeToPayWidget({ data, loading }: TimeToPayWidgetProps) {
    if (loading) {
        return (
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <Clock className="w-5 h-5" />
                        Time-to-Pay Impact Summary
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="animate-pulse space-y-3">
                        <div className="h-6 bg-gray-200 rounded w-3/4"></div>
                        <div className="h-6 bg-gray-200 rounded w-1/2"></div>
                        <div className="h-6 bg-gray-200 rounded w-2/3"></div>
                    </div>
                </CardContent>
            </Card>
        );
    }

    if (!data) {
        return null;
    }

    const netTimeImpact = data.totalOvertimeCompensation - data.totalPenalties;
    const hasIssues = data.hasDisputedItems || data.minimumWageAlert;

    return (
        <Card className={data.minimumWageAlert ? 'border-red-500' : ''}>
            <CardHeader>
                <div className="flex items-center justify-between">
                    <CardTitle className="flex items-center gap-2">
                        <Clock className="w-5 h-5" />
                        Time-to-Pay Impact Summary
                    </CardTitle>
                    {hasIssues && (
                        <Badge variant="destructive" className="flex items-center gap-1">
                            <AlertTriangle className="w-3 h-3" />
                            {data.hasDisputedItems ? `${data.disputedItemIds.length} Disputed` : 'Alert'}
                        </Badge>
                    )}
                </div>
            </CardHeader>
            <CardContent className="space-y-4">
                {/* Overtime Earnings */}
                {data.totalOvertimeCompensation > 0 && (
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2 text-sm text-gray-600">
                            <TrendingUp className="w-4 h-4 text-green-600" />
                            <span>Overtime Earnings</span>
                        </div>
                        <span className="font-semibold text-green-600">
                            + {data.totalOvertimeCompensation.toFixed(2)} EGP
                        </span>
                    </div>
                )}

                {/* Penalty Deductions */}
                {data.totalPenalties > 0 && (
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2 text-sm text-gray-600">
                            <TrendingDown className="w-4 h-4 text-red-600" />
                            <span>Time Penalties ({data.penalties.length} items)</span>
                        </div>
                        <span className="font-semibold text-red-600">
                            - {data.totalPenalties.toFixed(2)} EGP
                        </span>
                    </div>
                )}

                {/* Net Time Impact */}
                <div className="pt-3 border-t">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2 text-sm font-medium">
                            <DollarSign className="w-4 h-4" />
                            <span>Net Time Impact</span>
                        </div>
                        <span className={`font-bold text-lg ${netTimeImpact >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                            {netTimeImpact >= 0 ? '+' : ''} {netTimeImpact.toFixed(2)} EGP
                        </span>
                    </div>
                </div>

                {/* Additional Info */}
                <div className="pt-2 space-y-1 text-sm text-gray-600">
                    {data.overtime.length > 0 && (
                        <div>⏰ Overtime Hours: {data.overtime.reduce((sum, o) => sum + o.hoursWorked, 0).toFixed(1)} hrs</div>
                    )}
                    {data.hasDisputedItems && (
                        <div className="flex items-center gap-1 text-amber-600">
                            <AlertTriangle className="w-3 h-3" />
                            {data.disputedItemIds.length} disputed item(s) pending review
                        </div>
                    )}
                </div>

                {/* Minimum Wage Alert */}
                {data.minimumWageAlert && (
                    <div className="p-3 bg-red-50 border border-red-200 rounded-md">
                        <div className="flex items-start gap-2">
                            <AlertTriangle className="w-5 h-5 text-red-600 mt-0.5" />
                            <div className="text-sm">
                                <div className="font-semibold text-red-900">Minimum Wage Alert</div>
                                <div className="text-red-700">
                                    Projected net pay ({data.projectedNetPay.toFixed(2)} EGP) is below minimum wage ({data.minimumWage} EGP).
                                    HR has been notified.
                                </div>
                            </div>
                        </div>
                    </div>
                )}
            </CardContent>
        </Card>
    );
}
