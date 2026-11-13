import React, { useState, useEffect } from 'react';
import { Menu, Sun, Moon, Database, LogOut, User as UserIcon } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useDataset } from '../context/DatasetContext';

export default function Navbar({ setIsMobileOpen }) {
  const { user, logout } = useAuth();
  const { datasets, selectedDatasetId, selectDataset } = useDataset();

  // Dark/Light theme management
  const [isLight, setIsLight] = useState(() => {
    return localStorage.getItem('theme') === 'light';
  });

  useEffect(() => {
    if (isLight) {
      document.documentElement.classList.add('light');
      localStorage.setItem('theme', 'light');
    } else {
      document.documentElement.classList.remove('light');
      localStorage.setItem('theme', 'dark');
    }
  }, [isLight]);

  const toggleTheme = () => setIsLight(!isLight);

  return (
    <header className="h-16 px-4 lg:px-6 glass-panel border-b border-panelBorder flex items-center justify-between sticky top-0 z-30">
      {/* Left: Mobile Menu & Dataset Selector */}
      <div className="flex items-center gap-3">
        <button
          onClick={() => setIsMobileOpen(true)}
          className="lg:hidden p-2 rounded-lg text-slate-400 hover:text-white hover:bg-white/5"
          title="Open Menu"
        >
          <Menu className="w-5 h-5" />
        </button>

        {/* Global Dataset Selector */}
        <div className="flex items-center gap-2">
          <Database className="w-4 h-4 text-blue-400 hidden sm:block" />
          <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider hidden sm:block">
            Dataset:
          </span>
          <select
            value={selectedDatasetId}
            onChange={(e) => selectDataset(e.target.value)}
            className="glass-input rounded-lg px-3 py-1.5 text-xs sm:text-sm font-medium focus:ring-1 focus:ring-blue-500 cursor-pointer max-w-[200px] sm:max-w-xs truncate"
          >
            {datasets.map((ds) => (
              <option key={ds.id} value={ds.id}>
                {ds.name} ({ds.rowCount} rows)
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Right: Theme Toggle & Admin Profile */}
      <div className="flex items-center gap-3">
        {/* Theme Toggle */}
        <button
          onClick={toggleTheme}
          className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-white/5 border border-panelBorder transition-colors"
          title={isLight ? 'Switch to Dark Mode' : 'Switch to Light Mode'}
        >
          {isLight ? <Moon className="w-4 h-4 text-amber-500" /> : <Sun className="w-4 h-4 text-amber-400" />}
        </button>

        {/* User Pill */}
        <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl border border-panelBorder bg-white/5 text-xs">
          <div className="w-6 h-6 rounded-lg bg-blue-500/20 text-blue-400 flex items-center justify-center font-bold">
            <UserIcon className="w-3.5 h-3.5" />
          </div>
          <div className="hidden md:block text-left">
            <span className="font-semibold text-white block leading-tight">{user?.username}</span>
            <span className="text-[10px] text-slate-400 block leading-tight">{user?.role}</span>
          </div>
        </div>

        {/* Logout Button */}
        <button
          onClick={logout}
          className="p-2 rounded-xl text-slate-400 hover:text-red-400 hover:bg-red-500/10 border border-panelBorder transition-colors"
          title="Sign out"
        >
          <LogOut className="w-4 h-4" />
        </button>
      </div>
    </header>
  );
}

