'use client';

import React from 'react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { AlertTriangle, AlertCircle, TrendingUp, CreditCard, DollarSign } from 'lucide-react';

export type AnomalyType = 'NEGATIVE_NET_PAY' | 'MISSING_BANK_INFO' | 'SALARY_SPIKE' | 'MISSING_TAX_INFO';

export interface Anomaly {
    type: AnomalyType;
    severity: 'critical' | 'warning' | 'info';
    message: string;
    value?: number | string;
    threshold?: number;
}

interface AnomalyAlertsProps {
    anomalies: Anomaly[];
    employeeName?: string;
}

export const AnomalyAlerts: React.FC<AnomalyAlertsProps> = ({ anomalies, employeeName }) => {
    if (!anomalies || anomalies.length === 0) {
        return null;
    }

    const getAnomalyIcon = (type: AnomalyType) => {
        switch (type) {
            case 'NEGATIVE_NET_PAY':
                return <DollarSign className="w-4 h-4" />;
            case 'MISSING_BANK_INFO':
                return <CreditCard className="w-4 h-4" />;
            case 'SALARY_SPIKE':
                return <TrendingUp className="w-4 h-4" />;
            default:
                return <AlertCircle className="w-4 h-4" />;
        }
    };

    const getAnomalyColor = (severity: string) => {
        switch (severity) {
            case 'critical':
                return 'destructive';
            case 'warning':
                return 'default';
            default:
                return 'secondary';
        }
    };

    const getBadgeColor = (severity: string) => {
        switch (severity) {
            case 'critical':
                return 'bg-red-100 text-red-800 border-red-300';
            case 'warning':
                return 'bg-yellow-100 text-yellow-800 border-yellow-300';
            default:
                return 'bg-blue-100 text-blue-800 border-blue-300';
        }
    };

    const criticalAnomalies = anomalies.filter(a => a.severity === 'critical');
    const warningAnomalies = anomalies.filter(a => a.severity === 'warning');
    const infoAnomalies = anomalies.filter(a => a.severity === 'info');

    return (
        <div className="space-y-2">
            {criticalAnomalies.map((anomaly, index) => (
                <Alert key={`critical-${index}`} variant="destructive" className="border-red-300">
                    <AlertTriangle className="h-4 w-4" />
                    <AlertDescription className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                            {getAnomalyIcon(anomaly.type)}
                            <span className="font-medium">{anomaly.message}</span>
                            {anomaly.value !== undefined && (
                                <span className="text-sm">
                                    (Value: {typeof anomaly.value === 'number' ? `$${anomaly.value.toLocaleString()}` : anomaly.value})
                                </span>
                            )}
                        </div>
                        <Badge variant="outline" className={getBadgeColor(anomaly.severity)}>
                            Critical
                        </Badge>
                    </AlertDescription>
                </Alert>
            ))}

            {warningAnomalies.map((anomaly, index) => (
                <Alert key={`warning-${index}`} className="border-yellow-300 bg-yellow-50">
                    <AlertCircle className="h-4 w-4 text-yellow-600" />
                    <AlertDescription className="flex items-center justify-between">
                        <div className="flex items-center gap-2 text-yellow-800">
                            {getAnomalyIcon(anomaly.type)}
                            <span className="font-medium">{anomaly.message}</span>
                            {anomaly.value !== undefined && (
                                <span className="text-sm">
                                    (Value: {typeof anomaly.value === 'number' ? `$${anomaly.value.toLocaleString()}` : anomaly.value})
                                </span>
                            )}
                        </div>
                        <Badge variant="outline" className={getBadgeColor(anomaly.severity)}>
                            Warning
                        </Badge>
                    </AlertDescription>
                </Alert>
            ))}

            {infoAnomalies.map((anomaly, index) => (
                <Alert key={`info-${index}`} className="border-blue-300 bg-blue-50">
                    <AlertCircle className="h-4 w-4 text-blue-600" />
                    <AlertDescription className="flex items-center justify-between">
                        <div className="flex items-center gap-2 text-blue-800">
                            {getAnomalyIcon(anomaly.type)}
                            <span className="font-medium">{anomaly.message}</span>
                            {anomaly.value !== undefined && (
                                <span className="text-sm">
                                    (Value: {typeof anomaly.value === 'number' ? `$${anomaly.value.toLocaleString()}` : anomaly.value})
                                </span>
                            )}
                        </div>
                        <Badge variant="outline" className={getBadgeColor(anomaly.severity)}>
                            Info
                        </Badge>
                    </AlertDescription>
                </Alert>
            ))}
        </div>
    );
};

export default AnomalyAlerts;
