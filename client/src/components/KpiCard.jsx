import React from 'react';
import { TrendingUp, TrendingDown, Minus } from 'lucide-react';

export default function KpiCard({
  title,
  value,
  subtitle,
  icon: Icon,
  trend,
  trendDirection = 'up',
  color = 'blue',
  loading = false,
}) {
  const colorStyles = {
    blue: {
      bg: 'bg-blue-500/10 dark:bg-blue-500/10',
      border: 'border-blue-500/30',
      text: 'text-blue-600 dark:text-blue-400',
      glow: 'shadow-glowBlue',
      gradient: 'from-blue-500 to-indigo-500',
    },
    teal: {
      bg: 'bg-emerald-500/10 dark:bg-emerald-500/10',
      border: 'border-emerald-500/30',
      text: 'text-emerald-600 dark:text-emerald-400',
      glow: 'shadow-glowTeal',
      gradient: 'from-emerald-500 to-teal-500',
    },
    orange: {
      bg: 'bg-amber-500/10 dark:bg-amber-500/10',
      border: 'border-amber-500/30',
      text: 'text-amber-600 dark:text-amber-400',
      glow: '',
      gradient: 'from-amber-500 to-orange-500',
    },
    purple: {
      bg: 'bg-purple-500/10 dark:bg-purple-500/10',
      border: 'border-purple-500/30',
      text: 'text-purple-600 dark:text-purple-400',
      glow: '',
      gradient: 'from-purple-500 to-pink-500',
    },
    rose: {
      bg: 'bg-rose-500/10 dark:bg-rose-500/10',
      border: 'border-rose-500/30',
      text: 'text-rose-600 dark:text-rose-400',
      glow: '',
      gradient: 'from-rose-500 to-red-500',
    },
  }[color] || {
    bg: 'bg-blue-500/10',
    border: 'border-blue-500/30',
    text: 'text-blue-600 dark:text-blue-400',
    glow: '',
    gradient: 'from-blue-500 to-indigo-500',
  };

  if (loading) {
    return (
      <div className="glass-card rounded-2xl p-5 relative overflow-hidden animate-pulse flex flex-col justify-between h-[138px]">
        <div className="flex items-start justify-between">
          <div className="space-y-2">
            <div className="h-3 w-20 bg-slate-300 dark:bg-slate-700/50 rounded" />
            <div className="h-7 w-28 bg-slate-300 dark:bg-slate-700/50 rounded" />
          </div>
          <div className="w-12 h-12 rounded-xl bg-slate-300 dark:bg-slate-700/50" />
        </div>
        <div className="mt-4 pt-3 border-t border-panelBorder flex justify-between">
          <div className="h-3 w-24 bg-slate-300 dark:bg-slate-700/50 rounded" />
          <div className="h-3 w-12 bg-slate-300 dark:bg-slate-700/50 rounded" />
        </div>
      </div>
    );
  }

  return (
    <div className="glass-card group rounded-2xl p-5 flex flex-col justify-between relative overflow-hidden hover:-translate-y-1 hover:shadow-xl transition-all duration-300 cursor-default">
      {/* Top subtle color highlight line */}
      <div className={`absolute top-0 left-0 right-0 h-[2.5px] bg-gradient-to-r ${colorStyles.gradient} opacity-80 group-hover:opacity-100 transition-opacity`} />

      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <span className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider block mb-1 truncate">
            {title}
          </span>
          <h3 className="text-2xl font-bold text-slate-900 dark:text-white tracking-tight truncate font-mono">
            {value}
          </h3>
        </div>
        <div
          className={`w-12 h-12 rounded-xl flex items-center justify-center border ${colorStyles.bg} ${colorStyles.border} ${colorStyles.text} ${colorStyles.glow} group-hover:scale-105 transition-transform duration-300 shrink-0`}
        >
          {Icon && <Icon className="w-6 h-6" />}
        </div>
      </div>

      <div className="mt-4 pt-3 border-t border-panelBorder flex items-center justify-between text-xs gap-2">
        <span className="text-slate-500 dark:text-slate-400 truncate">{subtitle}</span>
        {trend !== undefined && (
          <span
            className={`flex items-center gap-1 font-semibold px-2 py-0.5 rounded-full shrink-0 text-[11px] ${
              trendDirection === 'up'
                ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20'
                : trendDirection === 'down'
                ? 'bg-rose-500/10 text-rose-600 dark:text-rose-400 border border-rose-500/20'
                : 'bg-slate-500/10 text-slate-600 dark:text-slate-400 border border-slate-500/20'
            }`}
          >
            {trendDirection === 'up' && <TrendingUp className="w-3 h-3" />}
            {trendDirection === 'down' && <TrendingDown className="w-3 h-3" />}
            {trendDirection === 'neutral' && <Minus className="w-3 h-3" />}
            {trend}
          </span>
        )}
      </div>
    </div>
  );
}
