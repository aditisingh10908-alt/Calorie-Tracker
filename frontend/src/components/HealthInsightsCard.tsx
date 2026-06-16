'use client';

import React from 'react';
import { HealthInsights } from '../utils/healthInsights';
import {
  Heart,
  Flame,
  Zap,
  Droplets,
  Target,
  TrendingDown,
  TrendingUp,
  Minus,
  Calendar,
  Sparkles,
} from 'lucide-react';

interface HealthInsightsCardProps {
  insights: HealthInsights;
  className?: string;
}

const goalLabels: Record<string, string> = {
  loss: 'Weight Loss',
  gain: 'Weight Gain',
  maintain: 'Maintenance',
};

const goalColors: Record<string, string> = {
  loss: 'text-blue-500',
  gain: 'text-amber-500',
  maintain: 'text-green-500',
};

const goalBg: Record<string, string> = {
  loss: 'bg-blue-500/10',
  gain: 'bg-amber-500/10',
  maintain: 'bg-green-500/10',
};

const GoalIcon = ({ goalType }: { goalType: string }) => {
  if (goalType === 'loss') return <TrendingDown size={16} />;
  if (goalType === 'gain') return <TrendingUp size={16} />;
  return <Minus size={16} />;
};

export const HealthInsightsCard = ({ insights, className = '' }: HealthInsightsCardProps) => {
  const {
    bmi,
    bmr,
    tdee,
    goalType,
    recommendedCalories,
    proteinRange,
    waterRange,
    estimatedWeeks,
    estimatedDate,
    messages,
  } = insights;

  return (
    <div className={`glass-card rounded-3xl overflow-hidden ${className}`}>
      {/* Header */}
      <div className="px-6 pt-6 pb-4 flex items-center gap-3">
        <div className="p-2.5 rounded-xl bg-gradient-to-br from-green-500/20 to-emerald-500/20">
          <Heart size={20} className="text-green-500" />
        </div>
        <div>
          <h3 className="text-lg font-bold text-dark-900 dark:text-white">Smart Health Insights</h3>
          <span className={`inline-flex items-center gap-1 text-xs font-semibold px-2 py-0.5 rounded-full ${goalBg[goalType]} ${goalColors[goalType]}`}>
            <GoalIcon goalType={goalType} />
            {goalLabels[goalType]} Plan
          </span>
        </div>
      </div>

      {/* Metrics Grid */}
      <div className="grid grid-cols-2 gap-px bg-gray-100 dark:bg-white/5 mx-4 rounded-2xl overflow-hidden">
        {/* BMR */}
        <div className="bg-white dark:bg-dark-950 p-4 flex flex-col gap-1">
          <div className="flex items-center gap-1.5 text-xs font-medium text-dark-500 dark:text-dark-400">
            <Flame size={13} className="text-orange-400" />
            BMR
          </div>
          <span className="text-xl font-bold text-dark-900 dark:text-white">{bmr}</span>
          <span className="text-[10px] text-dark-400 dark:text-dark-500">kcal/day at rest</span>
        </div>

        {/* TDEE */}
        <div className="bg-white dark:bg-dark-950 p-4 flex flex-col gap-1">
          <div className="flex items-center gap-1.5 text-xs font-medium text-dark-500 dark:text-dark-400">
            <Zap size={13} className="text-yellow-400" />
            TDEE
          </div>
          <span className="text-xl font-bold text-dark-900 dark:text-white">{tdee}</span>
          <span className="text-[10px] text-dark-400 dark:text-dark-500">maintenance kcal</span>
        </div>

        {/* Target Calories */}
        <div className="bg-white dark:bg-dark-950 p-4 flex flex-col gap-1">
          <div className="flex items-center gap-1.5 text-xs font-medium text-dark-500 dark:text-dark-400">
            <Target size={13} className="text-green-500" />
            Target Cal
          </div>
          <span className="text-xl font-bold text-dark-900 dark:text-white">{recommendedCalories}</span>
          <span className="text-[10px] text-dark-400 dark:text-dark-500">kcal/day</span>
        </div>

        {/* Protein */}
        <div className="bg-white dark:bg-dark-950 p-4 flex flex-col gap-1">
          <div className="flex items-center gap-1.5 text-xs font-medium text-dark-500 dark:text-dark-400">
            <Sparkles size={13} className="text-blue-400" />
            Protein
          </div>
          <span className="text-xl font-bold text-dark-900 dark:text-white">{proteinRange.min}–{proteinRange.max}</span>
          <span className="text-[10px] text-dark-400 dark:text-dark-500">g/day</span>
        </div>

        {/* Water */}
        <div className="bg-white dark:bg-dark-950 p-4 flex flex-col gap-1">
          <div className="flex items-center gap-1.5 text-xs font-medium text-dark-500 dark:text-dark-400">
            <Droplets size={13} className="text-sky-400" />
            Water
          </div>
          <span className="text-xl font-bold text-dark-900 dark:text-white">
            {(waterRange.min / 1000).toFixed(1)}–{(waterRange.max / 1000).toFixed(1)}
          </span>
          <span className="text-[10px] text-dark-400 dark:text-dark-500">litres/day</span>
        </div>

        {/* ETA */}
        <div className="bg-white dark:bg-dark-950 p-4 flex flex-col gap-1">
          <div className="flex items-center gap-1.5 text-xs font-medium text-dark-500 dark:text-dark-400">
            <Calendar size={13} className="text-purple-400" />
            Goal ETA
          </div>
          <span className="text-xl font-bold text-dark-900 dark:text-white">
            {estimatedWeeks !== null ? `${estimatedWeeks}w` : '—'}
          </span>
          <span className="text-[10px] text-dark-400 dark:text-dark-500">
            {estimatedDate || 'at goal'}
          </span>
        </div>
      </div>

      {/* Motivational Messages */}
      {messages.length > 0 && (
        <div className="px-6 pt-4 pb-6 space-y-2">
          <p className="text-xs font-semibold text-dark-500 dark:text-dark-400 uppercase tracking-wider mb-2">
            Personalised Tips
          </p>
          {messages.map((msg, i) => (
            <div
              key={i}
              className="flex items-start gap-2 text-sm text-dark-600 dark:text-dark-300 leading-relaxed"
            >
              <span className="mt-1 w-1.5 h-1.5 rounded-full bg-green-500 shrink-0" />
              {msg}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
