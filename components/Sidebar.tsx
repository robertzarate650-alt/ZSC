import React from 'react';
import { Home, Play, Mic, MessageSquare, BarChart, Users, ShoppingBag, Settings, CreditCard, ShoppingCart } from 'lucide-react';
import { AppMode } from '../types';

interface SidebarProps {
  currentMode: AppMode;
  onModeChange: (mode: AppMode) => void;
  shiftStats: { totalEarnings: number };
}

const Sidebar: React.FC<SidebarProps> = ({ currentMode, onModeChange, shiftStats }) => {
  const navItems = [
    { mode: AppMode.HOME, icon: Home, label: 'Home' },
    { mode: AppMode.SHIFT, icon: Play, label: 'Driver App' },
    { mode: AppMode.ANALYTICS, icon: BarChart, label: 'Analytics' },
    { mode: AppMode.COPILOT, icon: MessageSquare, label: 'Co-Pilot' },
    { mode: AppMode.LIVE, icon: Mic, label: 'Voice Mode' },
    { mode: AppMode.CUSTOMER, icon: ShoppingBag, label: 'Order Feed' },
    { mode: AppMode.CUSTOMER_APP, icon: ShoppingCart, label: 'Customer App' },
    { mode: AppMode.FLEET, icon: Users, label: 'Admin Panel' },
    { mode: AppMode.BILLING, icon: CreditCard, label: 'Billing' },
    { mode: AppMode.SETTINGS, icon: Settings, label: 'Settings' },
  ];

  return (
    <div className="w-20 md:w-64 bg-slate-900 border-r border-slate-800 flex flex-col h-full transition-all duration-300">
      <div className="p-6 flex items-center justify-center md:justify-start gap-3">
        <div className="w-8 h-8 bg-gradient-to-br from-indigo-500 to-purple-700 rounded-lg flex items-center justify-center shrink-0 shadow-lg shadow-indigo-500/20">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className="text-white"><path d="M12 2L2 7L12 12L22 7L12 2Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"></path><path d="M2 17L12 22L22 17" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"></path><path d="M2 12L12 17L22 12" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"></path></svg>
        </div>
        <h1 className="text-xl font-bold text-slate-100 hidden md:block">
          GigSync
        </h1>
      </div>

      <nav className="flex-1 px-4 py-6 space-y-2">
        {navItems.map((item) => (
          <button
            key={item.mode}
            onClick={() => onModeChange(item.mode)}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 group ${
              currentMode === item.mode
                ? 'bg-indigo-600/10 text-indigo-400 border border-indigo-600/20'
                : 'text-slate-400 hover:bg-slate-800 hover:text-slate-200'
            }`}
          >
            <item.icon className={`w-5 h-5 ${currentMode === item.mode ? 'text-indigo-400' : 'text-slate-400 group-hover:text-slate-200'}`} />
            <span className="font-medium hidden md:block">{item.label}</span>
            {currentMode === item.mode && (
              <div className="ml-auto w-1.5 h-1.5 rounded-full bg-indigo-400 hidden md:block" />
            )}
          </button>
        ))}
      </nav>

      <div className="p-4 border-t border-slate-800">
        <div className="p-4 rounded-xl bg-slate-800/80 border border-slate-700/50 hidden md:block backdrop-blur-sm">
          <p className="text-xs text-slate-400 mb-1 flex items-center gap-1">
            Driver Earnings
          </p>
          <div className="flex items-center gap-2">
            <span className="text-2xl font-bold text-slate-100">${shiftStats.totalEarnings.toFixed(2)}</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Sidebar;