import React from 'react';

interface LoadingIndicatorProps {
  label?: string;
  size?: 'sm' | 'md' | 'lg';
  colorClass?: string;
  className?: string;
}

const sizeMap = {
  sm: 'w-4 h-4',
  md: 'w-8 h-8',
  lg: 'w-12 h-12',
};

const LoadingIndicator: React.FC<LoadingIndicatorProps> = ({
  label,
  size = 'md',
  colorClass = 'border-primary-600 border-t-[#ff914d]',
  className = '',
}) => (
  <div className={`flex flex-col items-center justify-center ${className}`}
    role="status"
    aria-live="polite"
    aria-busy="true"
  >
    <span
      className={`animate-spin ${sizeMap[size]} border-4 ${colorClass} rounded-full inline-block mb-2`}
      aria-hidden="true"
    />
    {label && <span className="text-sm text-primary-700">{label}</span>}
  </div>
);

export default LoadingIndicator; 