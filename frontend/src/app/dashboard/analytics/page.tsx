'use client';

import React, { useState, useEffect, useMemo } from 'react';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  BarChart,
  Bar,
  ReferenceLine,
  PieChart,
  Pie,
  Cell,
  LabelList,
} from 'recharts';
import {
  Calendar,
  Download,
  TrendingDown,
  Scale,
  Flame,
  Droplets,
  Dumbbell,
  Target,
  CheckCircle2,
  ArrowDown,
  ArrowUp,
  Lightbulb,
} from 'lucide-react';

// ─── Hardcoded Demo Data (matching reference image exactly) ──────────────────

const WEIGHT_DATA = [
  { date: '10 Jun\nTue', weight: 75.8, label: '75.8' },
  { date: '11 Jun\nWed', weight: 75.2, label: '75.2' },
  { date: '12 Jun\nThu', weight: 74.6, label: '74.6' },
  { date: '13 Jun\nFri', weight: 74.1, label: '74.1' },
  { date: '14 Jun\nSat', weight: 73.6, label: '73.6' },
  { date: '15 Jun\nSun', weight: 73.1, label: '73.1' },
  { date: '16 Jun\nMon', weight: 72.8, label: '72.8' },
];

const CALORIE_DATA = [
  { day: 'Mon', consumed: 1650, target: 2000 },
  { day: 'Tue', consumed: 1820, target: 2000 },
  { day: 'Wed', consumed: 2050, target: 2000 },
  { day: 'Thu', consumed: 1720, target: 2000 },
  { day: 'Fri', consumed: 1880, target: 2000 },
  { day: 'Sat', consumed: 2180, target: 2000 },
  { day: 'Sun', consumed: 1590, target: 2000 },
];

const MACRO_DATA = [
  { name: 'Carbohydrates', value: 45, grams: 187, fill: '#22c55e' },
  { name: 'Protein', value: 25, grams: 104, fill: '#3b82f6' },
  { name: 'Fats', value: 30, grams: 67, fill: '#f59e0b' },
];

const WEEKLY_COMPARISON = [
  {
    label: 'Avg. Calories',
    value: '1,674',
    unit: 'kcal',
    change: 8,
    direction: 'down' as const,
    color: 'green',
  },
  {
    label: 'Avg. Protein',
    value: '104',
    unit: 'g',
    change: 12,
    direction: 'up' as const,
    color: 'green',
  },
  {
    label: 'Avg. Water',
    value: '2.1',
    unit: 'L',
    change: 15,
    direction: 'up' as const,
    color: 'green',
  },
  {
    label: 'Avg. Weight',
    value: '72.8',
    unit: 'kg',
    change: 1.8,
    direction: 'down' as const,
    color: 'green',
    isKg: true,
  },
];

const INSIGHTS = [
  {
    icon: '📉',
    iconBg: 'bg-green-100 dark:bg-green-500/10',
    title: 'Weight Trend',
    description: (
      <>
        You lost <span className="font-bold text-green-600 dark:text-green-400">1.8 kg</span> this week.{' '}
        <span className="text-green-600 dark:text-green-400 font-semibold">Great job! Keep it up!</span>
      </>
    ),
  },
  {
    icon: '🔥',
    iconBg: 'bg-orange-100 dark:bg-orange-500/10',
    title: 'Calorie Balance',
    description: (
      <>
        You&apos;re averaging <span className="font-bold text-green-600 dark:text-green-400">326 kcal</span>{' '}
        <span className="text-green-600 dark:text-green-400 font-semibold">below</span> your daily target.
      </>
    ),
  },
  {
    icon: '💧',
    iconBg: 'bg-blue-100 dark:bg-blue-500/10',
    title: 'Consistency',
    description: (
      <>
        You logged data for{' '}
        <span className="font-bold text-blue-600 dark:text-blue-400">7 out of 7 days</span>.
      </>
    ),
  },
  {
    icon: '✅',
    iconBg: 'bg-emerald-100 dark:bg-emerald-500/10',
    title: 'On Track',
    description: (
      <>
        You&apos;re on track to reach{' '}
        <span className="font-bold text-green-600 dark:text-green-400">your goal weight!</span>
      </>
    ),
  },
];

// ─── Custom Tooltip Components ───────────────────────────────────────────────

const WeightTooltip = ({ active, payload }: any) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-white dark:bg-dark-800 border border-gray-100 dark:border-white/10 rounded-xl px-4 py-2 shadow-lg">
      <p className="text-sm font-bold text-dark-900 dark:text-white">
        {payload[0].value} kg
      </p>
    </div>
  );
};

const CalorieTooltip = ({ active, payload, label }: any) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-white dark:bg-dark-800 border border-gray-100 dark:border-white/10 rounded-xl px-4 py-2.5 shadow-lg">
      <p className="text-xs font-semibold text-dark-500 dark:text-dark-400 mb-1">{label}</p>
      <p className="text-sm font-bold text-dark-900 dark:text-white">
        {payload[0].value.toLocaleString()} kcal
      </p>
    </div>
  );
};

// ─── Custom Bar Label ────────────────────────────────────────────────────────

const renderBarLabel = (props: any) => {
  const { x, y, width, value } = props;
  return (
    <text
      x={x + width / 2}
      y={y - 8}
      fill="#6b7280"
      textAnchor="middle"
      fontSize={10}
      fontWeight={600}
    >
      {value.toLocaleString()}
    </text>
  );
};

// ─── Custom Weight Label ─────────────────────────────────────────────────────

const renderWeightLabel = (props: any) => {
  const { x, y, value } = props;
  return (
    <text
      x={x}
      y={y - 12}
      fill="#6b7280"
      textAnchor="middle"
      fontSize={10}
      fontWeight={600}
    >
      {value}
    </text>
  );
};

// ─── Main Component ──────────────────────────────────────────────────────────

export default function AnalyticsPage() {
  const [mounted, setMounted] = useState(false);
  const [selectedPeriod, setSelectedPeriod] = useState('7 Days');

  useEffect(() => {
    setMounted(true);
  }, []);

  const totalConsumed = CALORIE_DATA.reduce((sum, d) => sum + d.consumed, 0);
  const avgOfTarget = Math.round(
    (CALORIE_DATA.reduce((sum, d) => sum + d.consumed, 0) /
      CALORIE_DATA.reduce((sum, d) => sum + d.target, 0)) *
      100
  );

  return (
    <div className="space-y-8 animate-fade-in pb-12">
      {/* ─── Header ─────────────────────────────────────────────── */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
        <div>
          <h1 className="text-3xl font-bold text-dark-900 dark:text-white">Analytics</h1>
          <p className="text-dark-500 dark:text-dark-400 mt-1">
            Understand your habits and trends
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          {/* Date Range Picker */}
          <div className="flex items-center gap-2 bg-white dark:bg-white/5 border border-gray-200 dark:border-white/10 px-4 py-2.5 rounded-xl text-sm font-semibold shadow-sm text-dark-800 dark:text-white">
            <Calendar size={16} className="text-primary-500" />
            <span>10/06/2026 - 16/06/2026</span>
            <svg
              width="12"
              height="12"
              viewBox="0 0 12 12"
              fill="none"
              className="text-dark-400 ml-1"
            >
              <path
                d="M3 4.5L6 7.5L9 4.5"
                stroke="currentColor"
                strokeWidth="1.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </div>

          {/* Period Selector */}
          <div className="flex bg-white dark:bg-white/5 border border-gray-200 dark:border-white/10 rounded-xl overflow-hidden shadow-sm">
            {['7 Days', '30 Days', '90 Days'].map((period) => (
              <button
                key={period}
                onClick={() => setSelectedPeriod(period)}
                className={`px-4 py-2.5 text-xs font-bold transition-all ${
                  selectedPeriod === period
                    ? 'bg-green-500 text-white'
                    : 'text-dark-600 dark:text-dark-300 hover:bg-gray-50 dark:hover:bg-white/5'
                }`}
              >
                {period}
              </button>
            ))}
          </div>

          {/* Export Button */}
          <button className="flex items-center gap-2 px-5 py-2.5 rounded-xl border-2 border-green-500 text-green-600 dark:text-green-400 font-bold text-sm hover:bg-green-50 dark:hover:bg-green-500/5 transition-colors shadow-sm">
            <Download size={16} />
            Export Report
          </button>
        </div>
      </div>

      {/* ─── Row 1: Weight Trend + Calorie Intake ─────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Weight Trend Card */}
        <div className="glass-card p-6 rounded-3xl">
          <div className="flex items-start justify-between mb-4">
            <div className="flex items-center gap-3">
              <div className="p-2.5 bg-green-500/10 text-green-500 rounded-xl">
                <Scale size={18} />
              </div>
              <div>
                <h2 className="text-lg font-bold text-dark-900 dark:text-white">
                  Weight Trend
                </h2>
                <p className="text-xs text-dark-400 dark:text-dark-500">
                  Track your weight progress over time
                </p>
              </div>
            </div>
            <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-green-100 dark:bg-green-500/10 text-green-700 dark:text-green-400 text-xs font-bold">
              <ArrowDown size={12} />
              1.8 kg this week
            </div>
          </div>

          {/* Weight Chart */}
          <div className="h-56 w-full">
            {mounted && (
              <ResponsiveContainer width="100%" height="100%">
                <LineChart
                  data={WEIGHT_DATA}
                  margin={{ top: 20, right: 20, left: 0, bottom: 5 }}
                >
                  <CartesianGrid
                    strokeDasharray="3 3"
                    vertical={false}
                    stroke="var(--color-border-dark)"
                    opacity={0.15}
                  />
                  <XAxis
                    dataKey="date"
                    axisLine={false}
                    tickLine={false}
                    tick={{ fontSize: 10, fill: '#9ca3af' }}
                    dy={5}
                  />
                  <YAxis
                    domain={[70, 78]}
                    ticks={[70, 72, 74, 76, 78]}
                    axisLine={false}
                    tickLine={false}
                    width={30}
                    tick={{ fontSize: 10, fill: '#9ca3af' }}
                    tickFormatter={(v) => `${v}`}
                    label={{
                      value: 'kg',
                      position: 'top',
                      offset: 10,
                      style: { fontSize: 10, fill: '#9ca3af' },
                    }}
                  />
                  <Tooltip content={<WeightTooltip />} />
                  <Line
                    type="monotone"
                    dataKey="weight"
                    stroke="#22c55e"
                    strokeWidth={3}
                    dot={{
                      r: 5,
                      fill: '#ffffff',
                      stroke: '#22c55e',
                      strokeWidth: 2.5,
                    }}
                    activeDot={{
                      r: 7,
                      strokeWidth: 0,
                      fill: '#22c55e',
                    }}
                  >
                    <LabelList
                      dataKey="label"
                      content={renderWeightLabel}
                    />
                  </Line>
                </LineChart>
              </ResponsiveContainer>
            )}
          </div>

          {/* Weight Stats Row */}
          <div className="grid grid-cols-3 gap-4 mt-5 pt-5 border-t border-gray-100 dark:border-white/5">
            <div className="text-center">
              <p className="text-xl font-black text-dark-900 dark:text-white">
                75.8 kg
              </p>
              <p className="text-xs text-dark-400 dark:text-dark-500 mt-0.5">
                Start Weight
              </p>
            </div>
            <div className="text-center">
              <p className="text-xl font-black text-dark-900 dark:text-white">
                72.8 kg
              </p>
              <p className="text-xs text-dark-400 dark:text-dark-500 mt-0.5">
                Current Weight
              </p>
            </div>
            <div className="text-center">
              <p className="text-xl font-black text-green-600 dark:text-green-400">
                1.8 kg
              </p>
              <p className="text-xs text-dark-400 dark:text-dark-500 mt-0.5">
                Total Change
              </p>
            </div>
          </div>
        </div>

        {/* Calorie Intake vs Target Card */}
        <div className="glass-card p-6 rounded-3xl">
          <div className="flex items-start justify-between mb-4">
            <div className="flex items-center gap-3">
              <div className="p-2.5 bg-orange-500/10 text-orange-500 rounded-xl">
                <Flame size={18} />
              </div>
              <div>
                <h2 className="text-lg font-bold text-dark-900 dark:text-white">
                  Calorie Intake vs Target
                </h2>
                <p className="text-xs text-dark-400 dark:text-dark-500">
                  Daily calories consumed vs your target
                </p>
              </div>
            </div>
            <div className="text-right">
              <span className="text-xs font-semibold text-dark-400 dark:text-dark-500">
                Avg.{' '}
              </span>
              <span className="text-sm font-bold text-orange-500">
                1,674 kcal
              </span>
            </div>
          </div>

          {/* Legend */}
          <div className="flex items-center gap-5 mb-3">
            <div className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-green-500" />
              <span className="text-xs text-dark-500 dark:text-dark-400 font-medium">
                Consumed
              </span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-5 h-0 border-t-2 border-dashed border-gray-400" />
              <span className="text-xs text-dark-500 dark:text-dark-400 font-medium">
                Target (2,000 kcal)
              </span>
            </div>
          </div>

          {/* Calorie Chart */}
          <div className="h-52 w-full">
            {mounted && (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={CALORIE_DATA}
                  margin={{ top: 25, right: 5, left: 0, bottom: 5 }}
                >
                  <CartesianGrid
                    strokeDasharray="3 3"
                    vertical={false}
                    stroke="var(--color-border-dark)"
                    opacity={0.15}
                  />
                  <XAxis
                    dataKey="day"
                    axisLine={false}
                    tickLine={false}
                    tick={{ fontSize: 11, fill: '#9ca3af' }}
                  />
                  <YAxis
                    axisLine={false}
                    tickLine={false}
                    width={35}
                    tick={{ fontSize: 10, fill: '#9ca3af' }}
                    domain={[0, 2400]}
                    ticks={[0, 400, 800, 1200, 1600, 2000, 2400]}
                    label={{
                      value: 'kcal',
                      position: 'top',
                      offset: 10,
                      style: { fontSize: 10, fill: '#9ca3af' },
                    }}
                  />
                  <Tooltip content={<CalorieTooltip />} cursor={{ fill: 'transparent' }} />
                  <ReferenceLine
                    y={2000}
                    stroke="#9ca3af"
                    strokeDasharray="6 4"
                    strokeWidth={1.5}
                  />
                  <Bar
                    dataKey="consumed"
                    radius={[6, 6, 0, 0]}
                    maxBarSize={36}
                    fill="#22c55e"
                  >
                    {CALORIE_DATA.map((entry, index) => (
                      <Cell
                        key={`cell-${index}`}
                        fill={entry.consumed > entry.target ? '#f59e0b' : '#22c55e'}
                      />
                    ))}
                    <LabelList dataKey="consumed" content={renderBarLabel} />
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            )}
          </div>

          {/* Calorie Stats Row */}
          <div className="grid grid-cols-3 gap-4 mt-4 pt-4 border-t border-gray-100 dark:border-white/5">
            <div className="text-center">
              <p className="text-lg font-black text-dark-900 dark:text-white">
                {totalConsumed.toLocaleString()} kcal
              </p>
              <p className="text-xs text-dark-400 dark:text-dark-500 mt-0.5">
                Total Consumed
              </p>
            </div>
            <div className="text-center">
              <p className="text-lg font-black text-dark-900 dark:text-white">
                2,000 kcal
              </p>
              <p className="text-xs text-dark-400 dark:text-dark-500 mt-0.5">
                Daily Target
              </p>
            </div>
            <div className="text-center">
              <p className="text-lg font-black text-green-600 dark:text-green-400">
                {avgOfTarget}%
              </p>
              <p className="text-xs text-dark-400 dark:text-dark-500 mt-0.5">
                Avg. of Target
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* ─── Row 2: Insights & Summary ────────────────────────── */}
      <div className="glass-card p-6 rounded-3xl">
        <div className="flex items-center gap-2 mb-6">
          <span className="text-xl">💡</span>
          <h2 className="text-lg font-bold text-dark-900 dark:text-white">
            Insights & Summary
          </h2>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
          {INSIGHTS.map((insight, i) => (
            <div
              key={i}
              className="flex items-start gap-3 p-4 rounded-2xl bg-gray-50/70 dark:bg-white/[0.02] border border-gray-100 dark:border-white/5"
            >
              <div
                className={`p-2.5 rounded-xl shrink-0 text-lg ${insight.iconBg}`}
              >
                {insight.icon}
              </div>
              <div>
                <h3 className="text-sm font-bold text-dark-900 dark:text-white mb-1">
                  {insight.title}
                </h3>
                <p className="text-xs text-dark-500 dark:text-dark-400 leading-relaxed">
                  {insight.description}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* ─── Row 3: Macronutrient Breakdown + Weekly Comparison ─ */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Macronutrient Breakdown */}
        <div className="glass-card p-6 rounded-3xl">
          <h2 className="text-lg font-bold text-dark-900 dark:text-white mb-6">
            Macronutrient Breakdown (Avg.)
          </h2>

          <div className="flex flex-col sm:flex-row items-center gap-8">
            {/* Doughnut Chart */}
            <div className="relative h-48 w-48 shrink-0">
              {mounted && (
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={MACRO_DATA}
                      cx="50%"
                      cy="50%"
                      innerRadius={55}
                      outerRadius={80}
                      paddingAngle={4}
                      dataKey="value"
                      startAngle={90}
                      endAngle={-270}
                    >
                      {MACRO_DATA.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.fill} />
                      ))}
                    </Pie>
                    <Tooltip formatter={(value) => `${value}%`} />
                  </PieChart>
                </ResponsiveContainer>
              )}
            </div>

            {/* Legend */}
            <div className="flex-1 space-y-5 w-full">
              {MACRO_DATA.map((item, i) => (
                <div key={i} className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <span
                      className="w-3.5 h-3.5 rounded-full shrink-0"
                      style={{ backgroundColor: item.fill }}
                    />
                    <span className="text-sm text-dark-600 dark:text-dark-300 font-semibold">
                      {item.name}
                    </span>
                  </div>
                  <div className="text-right">
                    <span className="text-sm font-bold text-dark-900 dark:text-white">
                      {item.value}%
                    </span>
                    <span className="text-xs text-dark-400 dark:text-dark-500 ml-2">
                      {item.grams}g
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Weekly Comparison */}
        <div className="glass-card p-6 rounded-3xl">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-lg font-bold text-dark-900 dark:text-white">
              Weekly Comparison
            </h2>
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-green-500" />
                <span className="text-xs text-dark-500 dark:text-dark-400 font-medium">
                  This Week
                </span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-gray-300 dark:bg-dark-600" />
                <span className="text-xs text-dark-500 dark:text-dark-400 font-medium">
                  Last Week
                </span>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            {WEEKLY_COMPARISON.map((item, i) => (
              <div
                key={i}
                className="p-4 rounded-2xl bg-gray-50/70 dark:bg-white/[0.02] border border-gray-100 dark:border-white/5"
              >
                <p className="text-xs font-semibold text-dark-500 dark:text-dark-400 mb-2">
                  {item.label}
                </p>
                <div className="flex items-baseline gap-1.5">
                  <span className="text-2xl font-black text-dark-900 dark:text-white">
                    {item.value}
                  </span>
                  <span className="text-sm font-medium text-dark-400 dark:text-dark-500">
                    {item.unit}
                  </span>
                </div>
                <div className="flex items-center gap-1.5 mt-2">
                  {item.direction === 'down' ? (
                    <ArrowDown size={12} className="text-green-500" />
                  ) : (
                    <ArrowUp size={12} className="text-green-500" />
                  )}
                  <span className="text-xs font-bold text-green-600 dark:text-green-400">
                    {item.isKg
                      ? `${item.change} kg`
                      : `${item.change}%`}
                  </span>
                  <span className="text-xs text-dark-400 dark:text-dark-500">
                    vs last week
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
