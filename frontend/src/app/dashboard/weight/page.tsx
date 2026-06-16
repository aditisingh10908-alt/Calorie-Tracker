'use client';

import React, { useEffect, useState } from 'react';
import { WeightService } from '../../../services/weight.service';
import { MlService } from '../../../services/ml.service';
import { WeightLog, WeightPrediction } from '../../../types';
import { format } from 'date-fns';
import { Scale, TrendingDown, AlertCircle } from 'lucide-react';
import toast from 'react-hot-toast';

export default function WeightPage() {
  const [weight, setWeight] = useState('');
  const [loading, setLoading] = useState(false);
  const [history, setHistory] = useState<WeightLog[]>([]);
  const [prediction, setPrediction] = useState<WeightPrediction | null>(null);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const hist = await WeightService.getWeightHistory(10);
      setHistory(hist);
      
      // We don't block on ML prediction as it might fail
      MlService.predictWeight()
        .then(setPrediction)
        .catch(console.error);
    } catch (error) {
      console.error(error);
    }
  };

  const handleLogWeight = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!weight) return;

    setLoading(true);
    try {
      await WeightService.logWeight(parseFloat(weight), new Date().toISOString());
      toast.success('Weight logged successfully');
      setWeight('');
      fetchData();
    } catch (error) {
      toast.error('Failed to log weight');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold text-dark-900 dark:text-white">Weight Tracker</h1>
        <p className="text-dark-500 dark:text-dark-400 mt-1">Monitor your progress</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="glass-card p-6 rounded-3xl">
          <div className="flex items-center gap-3 mb-6">
            <div className="p-3 bg-primary-50 dark:bg-primary-900/20 text-primary-500 rounded-xl">
              <Scale />
            </div>
            <h2 className="text-xl font-bold">Log Today's Weight</h2>
          </div>
          
          <form onSubmit={handleLogWeight} className="flex gap-4">
            <div className="flex-1 relative">
              <input 
                type="number" 
                step="0.1"
                min="30"
                max="300"
                value={weight}
                onChange={(e) => setWeight(e.target.value)}
                className="w-full px-4 py-3 rounded-xl border border-gray-200 dark:border-white/10 bg-gray-50 dark:bg-white/5 input-focus text-lg"
                placeholder="75.5"
                required
              />
              <span className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 font-medium">kg</span>
            </div>
            <button type="submit" disabled={loading} className="gradient-btn px-8 rounded-xl font-semibold">
              Log
            </button>
          </form>
        </div>

        {prediction && (
          <div className="glass-card p-6 rounded-3xl border-primary-500/30">
            <div className="flex items-center gap-3 mb-4">
              <div className="p-3 bg-purple-50 dark:bg-purple-900/20 text-purple-500 rounded-xl">
                <TrendingDown />
              </div>
              <h2 className="text-xl font-bold">AI Forecast</h2>
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-dark-500 dark:text-dark-400">7-Day Prediction</p>
                <p className="text-2xl font-bold text-primary-500">{prediction.predicted_weight_7d} kg</p>
              </div>
              <div>
                <p className="text-sm text-dark-500 dark:text-dark-400">30-Day Prediction</p>
                <p className="text-2xl font-bold text-primary-500">{prediction.predicted_weight_30d} kg</p>
              </div>
            </div>
            <p className="text-xs text-dark-400 mt-4 flex items-center gap-1">
              <AlertCircle size={12} /> Model confidence: {prediction.confidence * 100}%
            </p>
          </div>
        )}
      </div>

      <div className="glass-card p-6 rounded-3xl">
        <h2 className="text-xl font-bold mb-6">Recent History</h2>
        
        {history.length === 0 ? (
          <p className="text-dark-500 dark:text-dark-400">No weight entries logged yet.</p>
        ) : (
          <div className="overflow-hidden rounded-xl border border-gray-200 dark:border-white/5">
            <table className="w-full text-left text-sm">
              <thead className="bg-gray-50 dark:bg-white/5 text-dark-500 dark:text-dark-400">
                <tr>
                  <th className="px-6 py-4 font-medium">Date</th>
                  <th className="px-6 py-4 font-medium">Weight (kg)</th>
                  <th className="px-6 py-4 font-medium">Change</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 dark:divide-white/5">
                {history.map((entry, i) => {
                  const prev = history[i + 1];
                  const change = prev ? entry.weight - prev.weight : 0;
                  
                  return (
                    <tr key={entry.id} className="hover:bg-gray-50 dark:hover:bg-white/5 transition-colors">
                      <td className="px-6 py-4">{format(new Date(entry.date), 'MMM dd, yyyy')}</td>
                      <td className="px-6 py-4 font-bold">{entry.weight.toFixed(1)}</td>
                      <td className="px-6 py-4">
                        {prev ? (
                          <span className={`font-medium ${change > 0 ? 'text-red-500' : change < 0 ? 'text-green-500' : 'text-gray-500'}`}>
                            {change > 0 ? '+' : ''}{change.toFixed(1)}
                          </span>
                        ) : '--'}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
