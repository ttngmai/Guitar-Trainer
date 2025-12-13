import React from 'react';

export const Chip: React.FC<React.HTMLAttributes<HTMLDivElement>> = ({
  children,
  className = '',
  ...props
}) => (
  <div
    className={`px-3 py-1.5 rounded-full text-xs font-medium ${className}`}
    style={{
      background: 'linear-gradient(135deg, rgba(255, 255, 255, 0.7), rgba(255, 255, 255, 0.4))',
      backdropFilter: 'blur(20px) saturate(180%)',
      WebkitBackdropFilter: 'blur(20px) saturate(180%)',
      boxShadow: '0 8px 32px rgba(0, 0, 0, 0.1), inset 0 1px 0 rgba(255, 255, 255, 0.5)',
      border: '1px solid rgba(255, 255, 255, 0.3)',
    }}
    {...props}
  >
    {children}
  </div>
);

