import React from 'react';

interface SkeletonLoaderProps {
  width?: string;
  height?: string;
  circle?: boolean;
  className?: string;
  count?: number;
  ariaLabel?: string;
}

const SkeletonLoader: React.FC<SkeletonLoaderProps> = ({
  width = 'w-full',
  height = 'h-6',
  circle = false,
  className = '',
  count = 1,
  ariaLabel = 'Loading content',
}) => (
  <div aria-busy="true" aria-label={ariaLabel} role="status">
    {Array.from({ length: count }).map((_, i) => (
      <div
        key={i}
        className={`bg-gray-200 dark:bg-gray-700 animate-pulse ${circle ? 'rounded-full' : 'rounded-md'} ${width} ${height} mb-2 ${className}`}
      />
    ))}
  </div>
);

export default SkeletonLoader; 