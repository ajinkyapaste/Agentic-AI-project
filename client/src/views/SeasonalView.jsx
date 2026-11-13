import React, { useState, useEffect } from 'react';
import { Sun, CloudRain, Wind, Snowflake, Calendar, Sparkles, TrendingUp } from 'lucide-react';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Radar,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  CartesianGrid,
} from 'recharts';
import { analyticsApi } from '../services/api';
import { useDataset } from '../context/DatasetContext';

export default function SeasonalView() {
  const { selectedDatasetId, filters } = useDataset();
  const [seasonalData, setSeasonalData] = useState(null);
  const [trends, setTrends] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!selectedDatasetId) return;

    const fetchSeasonal = async () => {
      setLoading(true);
      try {
        const [seasRes, trendRes] = await Promise.all([
          analyticsApi.getSeasonal(selectedDatasetId, filters),
          analyticsApi.getTrends(selectedDatasetId, filters),
        ]);
        setSeasonalData(seasRes.data.seasonal);
        setTrends(trendRes.data.trends);
      } catch (err) {
        console.error('Failed to load seasonal data:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchSeasonal();
  }, [selectedDatasetId, filters]);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] text-slate-400">
        <span className="w-8 h-8 border-2 border-blue-500/20 border-t-blue-500 rounded-full animate-spin mb-3" />
        <p className="text-sm">Calculating seasonal decomposition and indices...</p>
      </div>
    );
  }

  const breakdown = seasonalData?.breakdown || [];
  const peakSeason = seasonalData?.peakSeason || 'Summer';
  const peakBreakdown = breakdown.find((b) => b.season === peakSeason);

  const getSeasonIcon = (name) => {
    switch (name.toLowerCase()) {
      case 'summer': return <Sun className="w-5 h-5 text-amber-400" />;
      case 'monsoon': return <CloudRain className="w-5 h-5 text-blue-400" />;
      case 'post-monsoon': return <Wind className="w-5 h-5 text-orange-400" />;
      case 'winter': return <Snowflake className="w-5 h-5 text-cyan-400" />;
      default: return <Calendar className="w-5 h-5 text-emerald-400" />;
    }
  };

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div>
        <h2 className="text-xl font-bold text-white tracking-tight flex items-center gap-2">
          <Calendar className="w-5 h-5 text-amber-400" />
          Seasonal Analytics & Demand Cycles
        </h2>
        <p className="text-xs text-slate-400">
          Decomposition across Summer, Monsoon, Post-monsoon, Winter & Peak Festival Events
        </p>
      </div>

      {/* Season Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
        {breakdown.map((item) => {
          const isPeak = item.season === peakSeason;
          return (
            <div
              key={item.season}
              className={`glass-card rounded-2xl p-4 flex flex-col justify-between transition-all ${
                isPeak
                  ? 'border-amber-500/50 bg-amber-500/10 shadow-lg'
                  : 'hover:border-slate-500'
              }`}
            >
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <div className="p-2 rounded-xl bg-white/5 border border-panelBorder">
                    {getSeasonIcon(item.season)}
                  </div>
                  <span className="font-bold text-sm text-white">{item.season}</span>
                </div>
                {isPeak && (
                  <span className="text-[10px] uppercase font-bold text-amber-400 bg-amber-500/20 px-2 py-0.5 rounded-full border border-amber-500/30">
                    Peak
                  </span>
                )}
              </div>

              <div>
                <span className="text-xs text-slate-400 block">Season Revenue</span>
                <h4 className="text-lg font-bold text-white font-mono">
                  ${(item.revenue || 0).toLocaleString()}
                </h4>
              </div>

              <div className="mt-3 pt-2.5 border-t border-panelBorder flex items-center justify-between text-xs">
                <span className="text-slate-400">{item.revenueShare}% Share</span>
                <span className="font-semibold text-blue-400 font-mono">
                  Idx: {item.seasonalIndex}
                </span>
              </div>
            </div>
          );
        })}
      </div>

      {/* Peak Event & Festival Banner */}
      <div className="glass-card rounded-2xl p-5 border border-amber-500/30 bg-gradient-to-r from-amber-500/10 via-transparent to-blue-500/10 flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-amber-500/20 text-amber-400 flex items-center justify-center border border-amber-500/40 shrink-0">
            <Sparkles className="w-6 h-6" />
          </div>
          <div>
            <span className="text-[11px] font-semibold text-amber-400 uppercase tracking-wider block">
              Seasonal Climax & Campaign Event Window
            </span>
            <h3 className="text-lg font-bold text-white">
              {peakSeason} Season (Dominant Festival Lift: {peakBreakdown?.peakFestivals?.join(', ') || 'Diwali & Festival Waves'})
            </h3>
            <p className="text-xs text-slate-300 mt-0.5">
              Generates ${(peakBreakdown?.revenue || 0).toLocaleString()} with a Seasonal Index of {peakBreakdown?.seasonalIndex}. Recommended campaign kickoff: 3 weeks prior.
            </p>
          </div>
        </div>
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Seasonal Revenue & Margin Bar Chart */}
        <div className="glass-card rounded-2xl p-5">
          <h4 className="font-bold text-white text-base mb-1">Seasonal Revenue & Margin %</h4>
          <p className="text-xs text-slate-400 mb-4">Gross volume and profitability across weather seasons</p>

          <div className="h-72 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={breakdown} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.06)" />
                <XAxis dataKey="season" stroke="#64748b" tick={{ fontSize: 11 }} />
                <YAxis stroke="#64748b" tick={{ fontSize: 11 }} tickFormatter={(v) => `$${(v / 1000).toFixed(0)}k`} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: 'var(--tooltip-bg)',
                    borderColor: 'var(--tooltip-border)',
                    color: 'var(--text-primary)',
                    borderRadius: '12px',
                    fontSize: '12px',
                  }}
                  itemStyle={{ color: 'var(--text-primary)' }}
                  formatter={(val, name) => [
                    name.includes('Margin') ? `${val}%` : `$${Number(val).toLocaleString()}`,
                    name,
                  ]}
                />
                <Legend wrapperStyle={{ fontSize: '12px', paddingTop: '10px' }} />
                <Bar dataKey="revenue" name="Revenue ($)" fill="#3b82f6" radius={[6, 6, 0, 0]} />
                <Bar dataKey="margin" name="Margin %" fill="#10b981" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Seasonal Indices Radar Chart */}
        <div className="glass-card rounded-2xl p-5 flex flex-col justify-between">
          <div>
            <h4 className="font-bold text-white text-base mb-1">Seasonality Index Distribution</h4>
            <p className="text-xs text-slate-400 mb-4">Values &gt; 100 represent above-average seasonal demand lift</p>
          </div>

          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <RadarChart data={breakdown} cx="50%" cy="50%" outerRadius="75%">
                <PolarGrid stroke="rgba(255,255,255,0.1)" />
                <PolarAngleAxis dataKey="season" stroke="#94a3b8" tick={{ fontSize: 11 }} />
                <PolarRadiusAxis stroke="#64748b" tick={{ fontSize: 9 }} />
                <Radar name="Seasonal Index" dataKey="seasonalIndex" stroke="#f97316" fill="#f97316" fillOpacity={0.35} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: 'var(--tooltip-bg)',
                    borderColor: 'var(--tooltip-border)',
                    color: 'var(--text-primary)',
                    borderRadius: '12px',
                    fontSize: '12px',
                  }}
                  itemStyle={{ color: 'var(--text-primary)' }}
                />
              </RadarChart>
            </ResponsiveContainer>
          </div>

          <div className="text-center text-xs text-slate-400 border-t border-panelBorder pt-2">
            Base Index: <strong className="text-white">100.0</strong> | Benchmark Seasonal Average
          </div>
        </div>
      </div>

      {/* Quarterly Comparisons Table */}
      <div className="glass-card rounded-2xl p-5">
        <h4 className="font-bold text-white text-base mb-1">Quarterly Financial Comparisons (Q1 - Q4)</h4>
        <p className="text-xs text-slate-400 mb-4">Quarterly revenue, volume, profit, and gross margin</p>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-300">
            <thead className="text-[11px] uppercase tracking-wider text-slate-400 border-b border-panelBorder">
              <tr>
                <th className="pb-3 font-semibold">Quarter</th>
                <th className="pb-3 font-semibold text-right">Revenue ($)</th>
                <th className="pb-3 font-semibold text-right">Units Sold</th>
                <th className="pb-3 font-semibold text-right">Gross Profit ($)</th>
                <th className="pb-3 font-semibold text-right">Gross Margin %</th>
                <th className="pb-3 font-semibold text-center">Velocity Rating</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-panelBorder">
              {(trends?.quarterlyComparison || []).map((q) => (
                <tr key={q.quarter} className="hover:bg-white/5 transition-colors">
                  <td className="py-3 font-bold text-white">{q.quarter}</td>
                  <td className="py-3 text-right font-mono font-bold text-blue-400">
                    ${(q.revenue || 0).toLocaleString()}
                  </td>
                  <td className="py-3 text-right font-mono">{(q.units || 0).toLocaleString()}</td>
                  <td className="py-3 text-right font-mono text-emerald-400">
                    ${(q.profit || 0).toLocaleString()}
                  </td>
                  <td className="py-3 text-right font-mono">{q.margin}%</td>
                  <td className="py-3 text-center">
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-blue-500/10 text-blue-400 border border-blue-500/20">
                      {q.revenue > 100000 ? 'High Velocity' : 'Standard Velocity'}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

