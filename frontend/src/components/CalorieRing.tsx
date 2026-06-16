'use client';

import React from 'react';

interface CalorieRingProps {
  consumed: number;
  target: number;
  size?: number;
  strokeWidth?: number;
}

export const CalorieRing = ({ 
  consumed, 
  target, 
  size = 200, 
  strokeWidth = 16 
}: CalorieRingProps) => {
  const radius = (size - strokeWidth) / 2;
  const circumference = radius * 2 * Math.PI;
  const percentage = Math.min((consumed / target) * 100, 100);
  const strokeDashoffset = circumference - (percentage / 100) * circumference;
  
  const isOver = consumed > target;

  return (
    <div className="relative flex items-center justify-center" style={{ width: size, height: size }}>
      {/* Background circle */}
      <svg width={size} height={size} className="transform -rotate-90">
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke="currentColor"
          strokeWidth={strokeWidth}
          fill="transparent"
          className="text-gray-100 dark:text-white/5"
        />
        {/* Progress circle */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke="currentColor"
          strokeWidth={strokeWidth}
          fill="transparent"
          strokeDasharray={circumference}
          strokeDashoffset={strokeDashoffset}
          strokeLinecap="round"
          className={`transition-all duration-1000 ease-out ${
            isOver ? 'text-red-500' : 'text-primary-500'
          }`}
        />
      </svg>
      
      {/* Content inside ring */}
      <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
        <span className="text-sm font-medium text-dark-500 dark:text-dark-400 mb-1">
          {isOver ? 'Over by' : 'Remaining'}
        </span>
        <span className={`text-4xl font-bold tracking-tight ${isOver ? 'text-red-500' : 'text-dark-900 dark:text-white'}`}>
          {Math.abs(target - consumed)}
        </span>
        <span className="text-sm font-medium text-dark-500 dark:text-dark-400 mt-1">
          kcal
        </span>
      </div>
    </div>
  );
};
