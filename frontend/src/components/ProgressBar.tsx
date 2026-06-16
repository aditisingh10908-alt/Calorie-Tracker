'use client';

import React from 'react';

interface ProgressBarProps {
  label: string;
  value: number;
  max: number;
  colorClass?: string;
  showValues?: boolean;
  unit?: string;
}

export const ProgressBar = ({ 
  label, 
  value, 
  max, 
  colorClass = 'bg-primary-500',
  showValues = true,
  unit = 'g'
}: ProgressBarProps) => {
  const percentage = Math.min(Math.max((value / max) * 100, 0), 100);
  const isOver = value > max;

  return (
    <div className="w-full">
      <div className="flex justify-between items-end mb-2">
        <span className="text-sm font-medium text-dark-700 dark:text-dark-300">{label}</span>
        {showValues && (
          <span className="text-xs font-semibold text-dark-500 dark:text-dark-400">
            <span className={isOver ? 'text-red-500' : ''}>{Math.round(value)}</span>
            <span className="text-dark-400 dark:text-dark-500 font-normal"> / {max}{unit}</span>
          </span>
        )}
      </div>
      <div className="h-2.5 w-full bg-gray-100 dark:bg-white/5 rounded-full overflow-hidden">
        <div 
          className={`h-full rounded-full transition-all duration-700 ease-out ${
            isOver ? 'bg-red-500' : colorClass
          }`}
          style={{ width: `${percentage}%` }}
        />
      </div>
    </div>
  );
};
