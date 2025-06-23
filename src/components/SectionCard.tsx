import React from 'react';
import { cn } from '../utils/cn';

interface SectionCardProps {
  title: string;
  description: string;
  children: React.ReactNode;
  variant?: 'default' | 'danger';
  className?: string;
}

export const SectionCard: React.FC<SectionCardProps> = ({
  title,
  description,
  children,
  variant = 'default',
  className,
}) => {
  return (
    <div
      className={cn(
        'rounded-lg border bg-card text-card-foreground shadow-sm',
        {
          'bg-red-50 border-red-200': variant === 'danger',
          'bg-white': variant === 'default',
        },
        className,
      )}
    >
      <div className="p-6">
        <h3
          className={cn('text-2xl font-semibold leading-none tracking-tight', {
            'text-red-700': variant === 'danger',
            'text-gray-900': variant === 'default',
          })}
        >
          {title}
        </h3>
        <p
          className={cn('text-sm mt-1', {
            'text-red-600': variant === 'danger',
            'text-muted-foreground': variant === 'default',
          })}
        >
          {description}
        </p>
      </div>
      <div className="p-6 pt-0">{children}</div>
    </div>
  );
};
