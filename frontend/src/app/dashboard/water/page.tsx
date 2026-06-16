'use client';

import React, { useEffect, useState } from 'react';
import { WaterService } from '../../../services/water.service';
import { DailyWaterSummary } from '../../../types';
import { format } from 'date-fns';
import { Droplets, Plus } from 'lucide-react';
import toast from 'react-hot-toast';

export default function WaterPage() {
  const [summary, setSummary] = useState<DailyWaterSummary | null>(null);
  const [loading, setLoading] = useState(false);
  const [customAmount, setCustomAmount] = useState('250');
  
  const dailyGoal = 2500; // ml

  useEffect(() => {
    fetchWater();
  }, []);

  const fetchWater = async () => {
    try {
      const data = await WaterService.getDailyWater(format(new Date(), 'yyyy-MM-dd'));
      setSummary(data);
    } catch (error) {
      console.error(error);
    }
  };

  const logWater = async (amount: number) => {
  setLoading(true);

  try {
    const today = new Date();
    const localDate = `${today.getFullYear()}-${String(
      today.getMonth() + 1
    ).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;

    await WaterService.logWater(amount, localDate);

    toast.success(`Logged ${amount}ml of water`);
    await fetchWater();
  } catch (error) {
    toast.error('Failed to log water');
  } finally {
    setLoading(false);
  }
};

  const total = summary?.total || 0;
  const percentage = Math.min((total / dailyGoal) * 100, 100);

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold text-dark-900 dark:text-white">Water Tracker</h1>
        <p className="text-dark-500 dark:text-dark-400 mt-1">Stay hydrated</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="glass-card p-8 rounded-3xl flex flex-col items-center text-center">
          <div className="relative w-48 h-48 rounded-full border-4 border-gray-100 dark:border-white/5 overflow-hidden flex items-center justify-center mb-6">
            <div 
              className="absolute bottom-0 w-full bg-blue-500/20 dark:bg-blue-500/30 transition-all duration-1000 ease-out"
              style={{ height: `${percentage}%` }}
            />
            <div className="z-10 flex flex-col items-center">
              <Droplets className="text-blue-500 mb-2" size={32} />
              <span className="text-3xl font-bold text-blue-600 dark:text-blue-400">{total}</span>
              <span className="text-sm font-medium text-dark-500 dark:text-dark-400">/ {dailyGoal} ml</span>
            </div>
          </div>
          
          <h3 className="text-lg font-bold mb-2">Today's Progress</h3>
          <p className="text-sm text-dark-500 dark:text-dark-400">
            {total >= dailyGoal ? 'Goal reached! 🎉' : `You need ${dailyGoal - total}ml more.`}
          </p>
        </div>

        <div className="space-y-6">
          <div className="glass-card p-6 rounded-3xl">
            <h3 className="text-lg font-bold mb-4">Quick Add</h3>
            <div className="grid grid-cols-2 gap-3">
              {[250, 330, 500, 1000].map(amount => (
                <button
                  key={amount}
                  onClick={() => logWater(amount)}
                  disabled={loading}
                  className="py-3 px-4 rounded-xl bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 font-semibold hover:bg-blue-100 dark:hover:bg-blue-900/40 transition-colors flex items-center justify-center gap-2"
                >
                  <Plus size={18} /> {amount} ml
                </button>
              ))}
            </div>
          </div>
          
          <div className="glass-card p-6 rounded-3xl">
            <h3 className="text-lg font-bold mb-4">Custom Amount</h3>
            <div className="flex gap-3">
              <input 
                type="number" 
                value={customAmount}
                onChange={(e) => setCustomAmount(e.target.value)}
                className="flex-1 px-4 py-3 rounded-xl border border-gray-200 dark:border-white/10 bg-gray-50 dark:bg-white/5 input-focus"
                placeholder="ml"
              />
              <button 
                onClick={() => logWater(parseInt(customAmount))}
                disabled={loading || !customAmount}
                className="px-6 gradient-btn rounded-xl font-semibold"
              >
                Log
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
