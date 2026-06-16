'use client';

import React from 'react';
import { Sidebar } from '../../components/Sidebar';

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-gray-50 dark:bg-dark-950">
      <Sidebar />
      <div className="md:pl-64 flex flex-col flex-1">
        <main className="flex-1 p-4 md:p-8 pt-20 md:pt-8 w-full max-w-7xl mx-auto">
          {children}
        </main>
      </div>
      
      {/* Mobile Header (visible only on small screens) */}
      <div className="md:hidden fixed top-0 left-0 right-0 h-16 glass-sidebar flex items-center px-4 z-30">
        <h2 className="text-xl font-bold gradient-text">CaloriePro</h2>
        {/* Mobile menu button could go here */}
      </div>
    </div>
  );
}
