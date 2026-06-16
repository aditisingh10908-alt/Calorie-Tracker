'use client';

import React, { useState, useEffect } from 'react';
import { useAuth } from '../../../context/AuthContext';
import { UserService } from '../../../services/user.service';
import { ACTIVITY_LEVELS, GENDER_OPTIONS } from '../../../utils/constants';
import { calculateBMI } from '../../../utils/bmi';
import toast from 'react-hot-toast';

export default function SettingsPage() {
  const { user, updateUser } = useAuth();
  const [loading, setLoading] = useState(false);
  
  const [formData, setFormData] = useState({
    name: '',
    age: '',
    gender: '',
    height: '',
    currentWeight: '',
    goalWeight: '',
    activityLevel: '',
  });

  // Sync state when user profile is loaded/updated
  useEffect(() => {
    if (user) {
      setFormData({
        name: user.name || '',
        age: user.age !== undefined && user.age !== null ? String(user.age) : '',
        gender: user.gender || '',
        height: user.height !== undefined && user.height !== null ? String(user.height) : '',
        currentWeight: user.currentWeight !== undefined && user.currentWeight !== null ? String(user.currentWeight) : '',
        goalWeight: user.goalWeight !== undefined && user.goalWeight !== null ? String(user.goalWeight) : '',
        activityLevel: user.activityLevel || '',
      });
    }
  }, [user]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const payload = {
        name: formData.name,
        age: formData.age ? parseInt(formData.age, 10) : null,
        gender: formData.gender || null,
        height: formData.height ? parseFloat(formData.height) : null,
        currentWeight: formData.currentWeight ? parseFloat(formData.currentWeight) : null,
        goalWeight: formData.goalWeight ? parseFloat(formData.goalWeight) : null,
        activityLevel: formData.activityLevel || null,
      };

      const updated = await UserService.updateProfile(payload);
      updateUser(updated);
      toast.success('Profile updated successfully');
    } catch (error: any) {
      console.error(error);
      toast.error(error?.response?.data?.message || 'Failed to update profile');
    } finally {
      setLoading(false);
    }
  };

  // Calculate live BMI
  const heightNum = parseFloat(formData.height);
  const weightNum = parseFloat(formData.currentWeight);
  const bmi = calculateBMI(heightNum, weightNum);

  // Calculate healthy weight range
  const heightM = heightNum / 100;
  const minHealthyWeight = heightM > 0 ? Math.round(18.5 * heightM * heightM * 10) / 10 : 0;
  const maxHealthyWeight = heightM > 0 ? Math.round(24.9 * heightM * heightM * 10) / 10 : 0;

  return (
    <div className="max-w-6xl mx-auto space-y-8">
      <div>
        <h1 className="text-3xl font-bold text-dark-900 dark:text-white">Settings</h1>
        <p className="text-dark-500 dark:text-dark-400 mt-1">Manage your profile and goals</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Profile Form */}
        <div className="lg:col-span-2 glass-card p-8 rounded-3xl">
          <form onSubmit={handleSubmit} className="space-y-6">
            <h2 className="text-xl font-bold text-dark-900 dark:text-white mb-4">Edit Profile</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium mb-2 text-dark-700 dark:text-dark-200">Full Name</label>
                <input
                  type="text"
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                  required
                  className="w-full px-4 py-3 rounded-xl bg-gray-50 dark:bg-white/5 border border-gray-200 dark:border-white/10 text-dark-950 dark:text-white input-focus"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium mb-2 text-dark-700 dark:text-dark-200">Age</label>
                <input
                  type="number"
                  name="age"
                  value={formData.age}
                  onChange={handleChange}
                  className="w-full px-4 py-3 rounded-xl bg-gray-50 dark:bg-white/5 border border-gray-200 dark:border-white/10 text-dark-950 dark:text-white input-focus"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-2 text-dark-700 dark:text-dark-200">Gender</label>
                <select
                  name="gender"
                  value={formData.gender}
                  onChange={handleChange}
                  className="w-full px-4 py-3 rounded-xl bg-gray-50 dark:bg-white/5 border border-gray-200 dark:border-white/10 text-dark-950 dark:text-white input-focus"
                >
                  <option value="">Select Gender</option>
                  {GENDER_OPTIONS.map(opt => (
                    <option key={opt.value} value={opt.value}>{opt.label}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium mb-2 text-dark-700 dark:text-dark-200">Height (cm)</label>
                <input
                  type="number"
                  name="height"
                  value={formData.height}
                  onChange={handleChange}
                  className="w-full px-4 py-3 rounded-xl bg-gray-50 dark:bg-white/5 border border-gray-200 dark:border-white/10 text-dark-950 dark:text-white input-focus"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-2 text-dark-700 dark:text-dark-200">Current Weight (kg)</label>
                <input
                  type="number"
                  name="currentWeight"
                  value={formData.currentWeight}
                  onChange={handleChange}
                  step="0.1"
                  className="w-full px-4 py-3 rounded-xl bg-gray-50 dark:bg-white/5 border border-gray-200 dark:border-white/10 text-dark-950 dark:text-white input-focus"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-2 text-dark-700 dark:text-dark-200">Goal Weight (kg)</label>
                <input
                  type="number"
                  name="goalWeight"
                  value={formData.goalWeight}
                  onChange={handleChange}
                  step="0.1"
                  className="w-full px-4 py-3 rounded-xl bg-gray-50 dark:bg-white/5 border border-gray-200 dark:border-white/10 text-dark-950 dark:text-white input-focus"
                />
              </div>

              <div className="md:col-span-2">
                <label className="block text-sm font-medium mb-2 text-dark-700 dark:text-dark-200">Activity Level</label>
                <select
                  name="activityLevel"
                  value={formData.activityLevel}
                  onChange={handleChange}
                  className="w-full px-4 py-3 rounded-xl bg-gray-50 dark:bg-white/5 border border-gray-200 dark:border-white/10 text-dark-950 dark:text-white input-focus"
                >
                  <option value="">Select Activity Level</option>
                  {ACTIVITY_LEVELS.map(opt => (
                    <option key={opt.value} value={opt.value}>{opt.label}</option>
                  ))}
                </select>
              </div>
            </div>

            <div className="pt-6 border-t border-gray-100 dark:border-white/5 flex justify-end">
              <button 
                type="submit"
                disabled={loading}
                className="gradient-btn px-8 py-3 rounded-xl font-semibold text-white shadow-lg shadow-green-500/20"
              >
                {loading ? 'Saving...' : 'Save Changes'}
              </button>
            </div>
          </form>
        </div>

        {/* Live BMI & Health Summary Side Widget */}
        <div className="space-y-6">
          <div className="glass-card p-6 rounded-3xl flex flex-col justify-between h-fit">
            <h2 className="text-xl font-bold text-dark-900 dark:text-white mb-4">Body Mass Index (BMI)</h2>
            {bmi ? (
              <div className="space-y-6">
                <div className="text-center py-6 bg-gray-50 dark:bg-white/5 rounded-2xl">
                  <div className="text-5xl font-black mb-2" style={{ color: bmi.color }}>
                    {bmi.value}
                  </div>
                  <span className="inline-block px-3 py-1 text-xs font-semibold rounded-full text-white" style={{ backgroundColor: bmi.color }}>
                    {bmi.category}
                  </span>
                </div>

                <div className="space-y-2">
                  <div className="flex justify-between text-xs font-semibold text-dark-500 dark:text-dark-400">
                    <span>Underweight</span>
                    <span>Normal</span>
                    <span>Overweight</span>
                    <span>Obese</span>
                  </div>
                  <div className="relative h-2 w-full bg-gray-200 dark:bg-white/10 rounded-full overflow-hidden flex">
                    <div className="h-full bg-blue-500 w-[18.5%]" />
                    <div className="h-full bg-green-500 w-[24.9%]" />
                    <div className="h-full bg-amber-500 w-[29.9%]" />
                    <div className="h-full bg-red-500 flex-1" />
                    
                    {/* Live BMI Indicator Pin */}
                    <div 
                      className="absolute top-0 bottom-0 w-1 bg-white border border-black shadow"
                      style={{ 
                        left: `${Math.min(Math.max((bmi.value / 40) * 100, 5), 95)}%` 
                      }}
                    />
                  </div>
                  <div className="text-center text-xs text-dark-400 mt-1">
                    Healthy range: {bmi.range}
                  </div>
                </div>

                {minHealthyWeight > 0 && maxHealthyWeight > 0 && (
                  <div className="p-4 rounded-xl border border-gray-100 dark:border-white/5 bg-gray-50/50 dark:bg-white/5 text-sm space-y-1 text-dark-600 dark:text-dark-300">
                    <div>Healthy weight range for your height:</div>
                    <div className="font-bold text-dark-900 dark:text-white">
                      {minHealthyWeight} kg – {maxHealthyWeight} kg
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <div className="text-center py-12 text-dark-400 dark:text-dark-500 text-sm">
                Enter your height and current weight to calculate your BMI.
              </div>
            )}
          </div>

          <div className="glass-card p-6 rounded-3xl bg-gradient-to-br from-green-500/10 to-emerald-500/10 border border-green-500/20">
            <h3 className="font-bold text-dark-900 dark:text-white mb-2">TDEE & Target Calories</h3>
            <p className="text-xs text-dark-600 dark:text-dark-300 leading-relaxed">
              Your Total Daily Energy Expenditure (TDEE) and target calories are automatically computed based on your age, weight, height, gender, and activity level. Ensure these are correct to keep your calorie goals accurate!
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
