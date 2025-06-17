import React from 'react';

interface BadgeProgressProps {
  badge: { emoji: string; label: string };
  currentProgress: number;
  requiredProgress: number;
}

const BadgeProgress: React.FC<BadgeProgressProps> = ({ badge, currentProgress, requiredProgress }) => {
  const percentage = Math.min((currentProgress / requiredProgress) * 100, 100);
  return (
    <div className="w-full my-2">
      <div className="flex items-center gap-2 mb-1">
        <span className="text-xl">{badge.emoji}</span>
        <span className="font-semibold">{badge.label}</span>
        <span className="ml-auto text-xs text-gray-500">{currentProgress}/{requiredProgress}</span>
      </div>
      <div className="w-full bg-gray-200 rounded-full h-2">
        <div className="bg-yellow-400 h-2 rounded-full" style={{ width: `${percentage}%` }}></div>
      </div>
    </div>
  );
};

export default BadgeProgress; 