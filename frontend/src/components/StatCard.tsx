'use client';

import React from 'react';

interface StatCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  icon?: React.ReactNode;
  trend?: {
    value: number;
    isPositive: boolean;
    text: string;
  };
  className?: string;
}

export const StatCard = ({ title, value, subtitle, icon, trend, className = '' }: StatCardProps) => {
  return (
    <div className={`glass-card-hover rounded-2xl p-6 ${className}`}>
      <div className="flex items-start justify-between mb-4">
        <div>
          <p className="text-sm font-medium text-dark-500 dark:text-dark-400 mb-1">{title}</p>
          <h3 className="text-3xl font-bold text-dark-900 dark:text-white">{value}</h3>
        </div>
        {icon && (
          <div className="p-3 bg-primary-50 dark:bg-primary-900/20 text-primary-500 rounded-xl">
            {icon}
          </div>
        )}
      </div>
      
      {(subtitle || trend) && (
        <div className="flex items-center gap-2 mt-4 pt-4 border-t border-gray-100 dark:border-white/5">
          {trend && (
            <span className={`text-sm font-medium px-2 py-0.5 rounded-md ${
              trend.isPositive 
                ? 'bg-green-100 text-green-700 dark:bg-green-500/10 dark:text-green-400' 
                : 'bg-red-100 text-red-700 dark:bg-red-500/10 dark:text-red-400'
            }`}>
              {trend.isPositive ? '+' : ''}{trend.value}%
            </span>
          )}
          {subtitle && (
            <span className="text-sm text-dark-500 dark:text-dark-400">
              {subtitle}
            </span>
          )}
        </div>
      )}
    </div>
  );
};
