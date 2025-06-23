import React from 'react';
import { cn } from '../utils/cn'; // Assuming you have a utility for classnames

interface ChipProps {
  label: string;
  isSelected: boolean;
  onToggle: () => void;
  className?: string;
}

export const Chip: React.FC<ChipProps> = ({ label, isSelected, onToggle, className }) => {
  return (
    <button
      type="button"
      onClick={onToggle}
      className={cn(
        'px-4 py-2 rounded-full border-2 transition-all text-sm font-medium focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500',
        isSelected
          ? 'bg-primary-500 text-white border-primary-500'
          : 'bg-white hover:border-primary-300 border-gray-300',
        className,
      )}
      aria-pressed={isSelected}
    >
      {label.replace(/_/g, ' ').replace(/\b\w/g, (l) => l.toUpperCase())}
    </button>
  );
};
