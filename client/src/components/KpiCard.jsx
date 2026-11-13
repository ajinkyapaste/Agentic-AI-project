import React from 'react';
import { TrendingUp, TrendingDown, Minus } from 'lucide-react';

export default function KpiCard({ title, value, subtitle, icon: Icon, trend, trendDirection = 'up', color = 'blue' }) {
  const colorStyles = {
    blue: {
      bg: 'bg-blue-500/10',
      border: 'border-blue-500/20',
      text: 'text-blue-400',
      glow: 'shadow-glowBlue',
    },
    teal: {
      bg: 'bg-emerald-500/10',
      border: 'border-emerald-500/20',
      text: 'text-emerald-400',
      glow: 'shadow-glowTeal',
    },
    orange: {
      bg: 'bg-amber-500/10',
      border: 'border-amber-500/20',
      text: 'text-amber-400',
      glow: '',
    },
    purple: {
      bg: 'bg-purple-500/10',
      border: 'border-purple-500/20',
      text: 'text-purple-400',
      glow: '',
    },
    rose: {
      bg: 'bg-rose-500/10',
      border: 'border-rose-500/20',
      text: 'text-rose-400',
      glow: '',
    },
  }[color] || {
    bg: 'bg-blue-500/10',
    border: 'border-blue-500/20',
    text: 'text-blue-400',
    glow: '',
  };

  return (
    <div className="glass-card rounded-2xl p-5 flex flex-col justify-between relative overflow-hidden">
      <div className="flex items-start justify-between">
        <div>
          <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider block mb-1">
            {title}
          </span>
          <h3 className="text-2xl font-bold text-white tracking-tight">{value}</h3>
        </div>
        <div className={`w-12 h-12 rounded-xl flex items-center justify-center border ${colorStyles.bg} ${colorStyles.border} ${colorStyles.text} ${colorStyles.glow}`}>
          <Icon className="w-6 h-6" />
        </div>
      </div>

      <div className="mt-4 pt-3 border-t border-panelBorder flex items-center justify-between text-xs">
        <span className="text-slate-400 truncate">{subtitle}</span>
        {trend !== undefined && (
          <span
            className={`flex items-center gap-1 font-semibold px-2 py-0.5 rounded-full shrink-0 ${
              trendDirection === 'up'
                ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                : trendDirection === 'down'
                ? 'bg-rose-500/10 text-rose-400 border border-rose-500/20'
                : 'bg-slate-500/10 text-slate-400 border border-slate-500/20'
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

