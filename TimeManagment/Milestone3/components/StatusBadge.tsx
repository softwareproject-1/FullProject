interface StatusBadgeProps {
  status: string;
  variant?: 'default' | 'success' | 'danger' | 'warning' | 'info';
}

export function StatusBadge({ status, variant }: StatusBadgeProps) {
  // Auto-determine variant based on status if not provided
  const getVariant = () => {
    if (variant) return variant;
    
    const lowerStatus = status.toLowerCase();
    // Check for inactive first (before active) to avoid matching 'active' within 'inactive'
    if (lowerStatus.includes('inactive') || lowerStatus.includes('terminated') || lowerStatus.includes('rejected') || lowerStatus.includes('delimited') || lowerStatus.includes('absent')) {
      return 'danger';
    }
    if (lowerStatus.includes('active') || lowerStatus.includes('approved') || lowerStatus.includes('completed') || lowerStatus.includes('paid')) {
      return 'success';
    }
    if (lowerStatus.includes('pending') || lowerStatus.includes('draft') || lowerStatus.includes('late') || lowerStatus.includes('missing')) {
      return 'warning';
    }
    return 'default';
  };

  const variantStyles = {
    default: 'bg-slate-100 text-slate-700',
    success: 'bg-green-50 text-green-600',
    danger: 'bg-red-50 text-red-600',
    warning: 'bg-amber-50 text-amber-600',
    info: 'bg-blue-50 text-blue-600',
  };

  const finalVariant = getVariant();

  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${variantStyles[finalVariant]}`}>
      {status}
    </span>
  );
}

