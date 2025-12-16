import React from 'react';
import { Check, Clock, X, AlertCircle } from 'lucide-react';

interface TimelineStep {
    title: string;
    status: 'completed' | 'current' | 'pending' | 'rejected';
    date?: string;
    description?: string;
}

interface ApprovalTimelineProps {
    steps: TimelineStep[];
    className?: string;
}

const ApprovalTimeline: React.FC<ApprovalTimelineProps> = ({ steps, className = '' }) => {
    const getIcon = (status: TimelineStep['status']) => {
        switch (status) {
            case 'completed':
                return <Check className="w-5 h-5 text-green-600" />;
            case 'current':
                return <Clock className="w-5 h-5 text-blue-600 animate-pulse" />;
            case 'rejected':
                return <X className="w-5 h-5 text-red-600" />;
            case 'pending':
            default:
                return <AlertCircle className="w-5 h-5 text-gray-400" />;
        }
    };

    const getCircleStyles = (status: TimelineStep['status']) => {
        switch (status) {
            case 'completed':
                return 'bg-green-100 border-green-600';
            case 'current':
                return 'bg-blue-100 border-blue-600';
            case 'rejected':
                return 'bg-red-100 border-red-600';
            case 'pending':
            default:
                return 'bg-gray-100 border-gray-400';
        }
    };

    const getLineStyles = (index: number) => {
        if (index === steps.length - 1) return 'hidden';

        const currentStatus = steps[index].status;
        if (currentStatus === 'completed') {
            return 'bg-green-600';
        } else if (currentStatus === 'rejected') {
            return 'bg-red-600';
        }
        return 'bg-gray-300';
    };

    return (
        <div className={`space-y-4 ${className}`}>
            {steps.map((step, index) => (
                <div key={index} className="relative flex items-start">
                    {/* Vertical Line */}
                    <div className="absolute left-5 top-10 -ml-px h-full w-0.5">
                        <div className={`h-full ${getLineStyles(index)}`} />
                    </div>

                    {/* Icon Circle */}
                    <div className={`relative flex h-10 w-10 items-center justify-center rounded-full border-2 ${getCircleStyles(step.status)}`}>
                        {getIcon(step.status)}
                    </div>

                    {/* Content */}
                    <div className="ml-4 flex-1 pb-8">
                        <h4 className="text-sm font-semibold text-slate-900">{step.title}</h4>
                        {step.date && (
                            <p className="text-xs text-slate-500 mt-1">{step.date}</p>
                        )}
                        {step.description && (
                            <p className="text-sm text-slate-600 mt-1">{step.description}</p>
                        )}
                    </div>
                </div>
            ))}
        </div>
    );
};

export default ApprovalTimeline;
