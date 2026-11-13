import React from 'react';
import { Filter, RotateCcw } from 'lucide-react';
import { useDataset } from '../context/DatasetContext';

export default function GlobalFilters({ categories = [], seasons = [], months = [] }) {
  const { filters, updateFilters, resetFilters } = useDataset();

  const defaultSeasons = ['Summer', 'Monsoon', 'Post-monsoon', 'Winter', 'All Season'];
  const defaultMonths = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];

  const seasonOptions = seasons.length ? seasons : defaultSeasons;
  const monthOptions = months.length ? months : defaultMonths;

  const isFiltered = filters.category !== 'All' || filters.season !== 'All' || filters.month !== 'All';

  return (
    <div className="glass-card rounded-2xl p-4 mb-6 flex flex-wrap items-center justify-between gap-4">
      <div className="flex items-center gap-2 text-slate-400">
        <Filter className="w-4 h-4 text-blue-400" />
        <span className="text-xs font-semibold uppercase tracking-wider text-slate-300">
          Analytics Filters:
        </span>
      </div>

      <div className="flex flex-wrap items-center gap-3">
        {/* Category Filter */}
        <select
          value={filters.category}
          onChange={(e) => updateFilters({ category: e.target.value })}
          className="glass-input rounded-xl px-3 py-1.5 text-xs font-medium focus:ring-1 focus:ring-blue-500 cursor-pointer"
        >
          <option value="All">All Categories</option>
          {categories.map((c) => (
            <option key={c} value={c}>{c}</option>
          ))}
        </select>

        {/* Season Filter */}
        <select
          value={filters.season}
          onChange={(e) => updateFilters({ season: e.target.value })}
          className="glass-input rounded-xl px-3 py-1.5 text-xs font-medium focus:ring-1 focus:ring-blue-500 cursor-pointer"
        >
          <option value="All">All Seasons</option>
          {seasonOptions.map((s) => (
            <option key={s} value={s}>{s}</option>
          ))}
        </select>

        {/* Month Filter */}
        <select
          value={filters.month}
          onChange={(e) => updateFilters({ month: e.target.value })}
          className="glass-input rounded-xl px-3 py-1.5 text-xs font-medium focus:ring-1 focus:ring-blue-500 cursor-pointer"
        >
          <option value="All">All Months</option>
          {monthOptions.map((m) => (
            <option key={m} value={m}>{m}</option>
          ))}
        </select>

        {/* Reset Filter Button */}
        {isFiltered && (
          <button
            onClick={resetFilters}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-medium bg-white/5 hover:bg-white/10 text-slate-300 transition-colors border border-panelBorder"
            title="Reset Filters"
          >
            <RotateCcw className="w-3 h-3 text-blue-400" />
            <span>Reset</span>
          </button>
        )}
      </div>
    </div>
  );
}

