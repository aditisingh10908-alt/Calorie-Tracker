'use client';

import React, { useEffect, useState } from 'react';
import { ProteinService } from '../../../services/protein.service';
import { ProteinSummary } from '../../../types';
import { format } from 'date-fns';
import { Dumbbell, Target, Info } from 'lucide-react';
import { ProgressBar } from '../../../components/ProgressBar';

export default function ProteinPage() {
  const [summary, setSummary] = useState<ProteinSummary | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchProtein();
  }, []);

  const fetchProtein = async () => {
    try {
      const data = await ProteinService.getDailyProtein(format(new Date(), 'yyyy-MM-dd'));
      setSummary(data);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const consumed = summary?.consumed || 0;
  const goal = summary?.goal || 120; // Default fallback
  const percentage = Math.min((consumed / goal) * 100, 100);

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold text-dark-900 dark:text-white">Protein Tracker</h1>
        <p className="text-dark-500 dark:text-dark-400 mt-1">Muscle building & retention</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 glass-card p-8 rounded-3xl">
          <div className="flex justify-between items-start mb-8">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-red-50 dark:bg-red-900/20 text-red-500 rounded-xl">
                <Dumbbell />
              </div>
              <div>
                <h2 className="text-xl font-bold">Today's Intake</h2>
                <p className="text-dark-500 dark:text-dark-400">Aim for {goal}g daily</p>
              </div>
            </div>
            <div className="text-right">
              <p className="text-3xl font-bold text-red-500">{consumed}<span className="text-lg text-dark-500">g</span></p>
            </div>
          </div>
          
          <div className="mb-8">
            <ProgressBar 
              label={`${percentage.toFixed(1)}% of Goal`}
              value={consumed} 
              max={goal} 
              colorClass="bg-red-500" 
            />
          </div>

          <div className="grid grid-cols-2 gap-4 pt-6 border-t border-gray-100 dark:border-white/5">
            <div className="p-4 rounded-2xl bg-gray-50 dark:bg-white/5">
              <p className="text-sm font-medium text-dark-500 dark:text-dark-400 mb-1">From Meals</p>
              <p className="text-2xl font-bold">{summary?.fromMeals || 0}g</p>
            </div>
            <div className="p-4 rounded-2xl bg-gray-50 dark:bg-white/5">
              <p className="text-sm font-medium text-dark-500 dark:text-dark-400 mb-1">Custom Shakes/Snacks</p>
              <p className="text-2xl font-bold">{summary?.fromCustom || 0}g</p>
            </div>
          </div>
        </div>

        <div className="glass-card p-6 rounded-3xl space-y-4">
          <h3 className="font-bold flex items-center gap-2">
            <Target size={18} /> Why Protein Matters
          </h3>
          <div className="p-4 rounded-2xl bg-blue-50 dark:bg-blue-900/20 text-sm text-blue-800 dark:text-blue-200">
            <p className="flex items-start gap-2 mb-3">
              <Info size={16} className="mt-0.5 shrink-0" />
              <span>Protein has the highest thermic effect of food (TEF), meaning you burn more calories digesting it.</span>
            </p>
            <p className="flex items-start gap-2">
              <Info size={16} className="mt-0.5 shrink-0" />
              <span>Crucial for preserving lean muscle mass during a calorie deficit.</span>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
