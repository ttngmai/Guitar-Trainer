import React from 'react';
import { LIQUID_GLASS } from '../constants/styles';

export const Chip: React.FC<React.HTMLAttributes<HTMLDivElement>> = ({
  children,
  className = '',
  ...props
}) => (
  <div
    className={`px-3 py-1.5 rounded-full text-xs font-medium ${className}`}
    style={{
      background: LIQUID_GLASS.background.medium,
      backdropFilter: LIQUID_GLASS.blur.medium,
      WebkitBackdropFilter: LIQUID_GLASS.blur.medium,
      boxShadow: LIQUID_GLASS.shadow.container,
      border: LIQUID_GLASS.border.light,
    }}
    {...props}
  >
    {children}
  </div>
);

