interface CardProps {
  children: React.ReactNode;
  className?: string;
  title?: string;
  action?: React.ReactNode;
}

export function Card({ children, className = '', title, action }: CardProps) {
  return (
    <div className={`bg-white rounded-lg border border-slate-200 shadow-sm ${className}`}>
      {title && (
        <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between">
          <h3 className="text-slate-900">{title}</h3>
          {action && <div>{action}</div>}
        </div>
      )}
      <div className={title ? 'p-6' : 'p-0'}>{children}</div>
    </div>
  );
}

