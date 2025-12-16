import React from 'react';

interface StatusBadgeProps {
    status: string;
    className?: string;
}

const StatusBadge: React.FC<StatusBadgeProps> = ({ status, className = '' }) => {
    const getStatusStyles = (status: string) => {
        const normalizedStatus = status.toUpperCase();

        switch (normalizedStatus) {
            case 'PENDING':
                return 'bg-yellow-100 text-yellow-800 border-yellow-300';
            case 'APPROVED':
                return 'bg-green-100 text-green-800 border-green-300';
            case 'REJECTED':
                return 'bg-red-100 text-red-800 border-red-300';
            case 'PAID':
                return 'bg-blue-100 text-blue-800 border-blue-300';
            case 'RESOLVED':
                return 'bg-purple-100 text-purple-800 border-purple-300';
            case 'INVESTIGATING':
                return 'bg-orange-100 text-orange-800 border-orange-300';
            case 'PROCESSING':
                return 'bg-indigo-100 text-indigo-800 border-indigo-300';
            case 'DISPUTED':
                return 'bg-red-100 text-red-800 border-red-300';
            default:
                return 'bg-gray-100 text-gray-800 border-gray-300';
        }
    };

    const displayText = status.charAt(0).toUpperCase() + status.slice(1).toLowerCase();

    return (
        <span
            className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${getStatusStyles(status)} ${className}`}
        >
            {displayText}
        </span>
    );
};

export default StatusBadge;
