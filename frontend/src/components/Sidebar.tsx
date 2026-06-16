'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { 
  LayoutDashboard, 
  Utensils, 
  Scale, 
  Droplets, 
  Dumbbell, 
  LineChart, 
  Settings, 
  LogOut,
  Sun,
  Moon,
  Leaf
} from 'lucide-react';

const navItems = [
  { href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/dashboard/food', label: 'Food & Meals', icon: Utensils },
  { href: '/dashboard/weight', label: 'Weight', icon: Scale },
  { href: '/dashboard/water', label: 'Water', icon: Droplets },
  { href: '/dashboard/protein', label: 'Protein', icon: Dumbbell },
  { href: '/dashboard/analytics', label: 'Analytics', icon: LineChart },
];

export const Sidebar = () => {
  const pathname = usePathname();
  const { logout } = useAuth();
  const { theme, toggleTheme } = useTheme();

  return (
    <aside className="fixed inset-y-0 left-0 w-64 glass-sidebar flex flex-col z-40 hidden md:flex">
      {/* Logo */}
      <div className="p-6 pb-4">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-green-500 to-emerald-600 flex items-center justify-center">
            <Leaf size={16} className="text-white" />
          </div>
          <div>
            <h2 className="text-xl font-bold gradient-text tracking-tight leading-tight">CaloriePro</h2>
            <p className="text-[10px] text-dark-400 dark:text-dark-500 font-medium">Your Health, Your Goal</p>
          </div>
        </div>
      </div>

      {/* Nav Links */}
      <div className="flex-1 px-4 py-2 space-y-1 overflow-y-auto">
        {navItems.map((item) => {
          const isActive = pathname === item.href;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`nav-link ${isActive ? 'active' : ''}`}
            >
              <item.icon size={19} className={isActive ? 'text-white' : ''} />
              <span className="font-medium text-sm">{item.label}</span>
            </Link>
          );
        })}
      </div>

      {/* Bottom Section */}
      <div className="p-4 mt-auto border-t border-gray-200 dark:border-white/10 space-y-1.5">
        <Link
          href="/dashboard/settings"
          className={`nav-link ${pathname === '/dashboard/settings' ? 'active' : ''}`}
        >
          <Settings size={19} />
          <span className="font-medium text-sm">Settings</span>
        </Link>
        
        {/* Dark Mode Toggle */}
        <button 
          onClick={toggleTheme}
          className="w-full nav-link justify-between group"
        >
          <div className="flex items-center gap-3">
            {theme === 'dark' ? <Sun size={19} /> : <Moon size={19} />}
            <span className="font-medium text-sm">Dark Mode</span>
          </div>
          {/* Toggle Switch */}
          <div className={`relative w-9 h-5 rounded-full transition-colors ${
            theme === 'dark' ? 'bg-green-500' : 'bg-gray-300 dark:bg-gray-600'
          }`}>
            <div className={`absolute top-0.5 w-4 h-4 rounded-full bg-white shadow-sm transition-transform ${
              theme === 'dark' ? 'translate-x-4' : 'translate-x-0.5'
            }`} />
          </div>
        </button>

        {/* Logout */}
        <button 
          onClick={logout}
          className="w-full nav-link text-red-500 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-500/10"
        >
          <LogOut size={19} />
          <span className="font-medium text-sm">Logout</span>
        </button>
      </div>

      {/* Motivational Quote */}
      <div className="px-4 pb-5 pt-2">
        <div className="bg-green-50/80 dark:bg-green-500/5 rounded-xl p-3.5 border border-green-100 dark:border-green-500/10">
          <div className="flex items-center gap-2 mb-1.5">
            <span className="text-sm">💚</span>
            <span className="font-bold text-xs text-dark-800 dark:text-dark-100">Stay Consistent!</span>
          </div>
          <p className="text-[11px] text-dark-500 dark:text-dark-400 leading-relaxed">
            Small steps every day lead to big changes. 🌱
          </p>
        </div>
      </div>
    </aside>
  );
};
