import React, { useState, useEffect } from 'react';
import {
  DollarSign,
  ShoppingBag,
  Percent,
  Layers,
  TrendingUp,
  Award,
  Sparkles,
  AlertTriangle,
} from 'lucide-react';
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  CartesianGrid,
} from 'recharts';
import { analyticsApi, aiApi } from '../services/api';
import { useDataset } from '../context/DatasetContext';
import KpiCard from '../components/KpiCard';
import GlobalFilters from '../components/GlobalFilters';

const PIE_COLORS = ['#3b82f6', '#10b981', '#f97316', '#8b5cf6', '#ec4899', '#06b6d4'];

export default function DashboardView() {
  const { selectedDatasetId, filters } = useDataset();

  const [kpis, setKpis] = useState(null);
  const [trends, setTrends] = useState([]);
  const [categories, setCategories] = useState([]);
  const [segments, setSegments] = useState([]);
  const [products, setProducts] = useState([]);
  const [insights, setInsights] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!selectedDatasetId) return;

    const fetchDashboardData = async () => {
      setLoading(true);
      try {
        const [kpiRes, trendRes, catRes, segRes, prodRes, insRes] = await Promise.all([
          analyticsApi.getKpis(selectedDatasetId, filters),
          analyticsApi.getTrends(selectedDatasetId, filters),
          analyticsApi.getCategories(selectedDatasetId, filters),
          analyticsApi.getSegments(selectedDatasetId, filters),
          analyticsApi.getProducts(selectedDatasetId, filters),
          aiApi.getInsights(selectedDatasetId),
        ]);

        setKpis(kpiRes.data.kpis);
        setTrends(trendRes.data.trends.monthlyTrends || []);
        setCategories(catRes.data.categories.categories || []);
        setSegments(segRes.data.segments.segments || []);
        setProducts(prodRes.data.products.topByRevenue || []);
        setInsights(insRes.data.insights || []);
      } catch (err) {
        console.error('Error fetching dashboard data:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardData();
  }, [selectedDatasetId, filters]);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] text-slate-400">
        <span className="w-8 h-8 border-2 border-blue-500/20 border-t-blue-500 rounded-full animate-spin mb-3" />
        <p className="text-sm">Synthesizing predictive sales telemetry...</p>
      </div>
    );
  }

  const categoryNames = categories.map((c) => c.category);

  return (
    <div className="space-y-6">
      {/* Global Filter Bar */}
      <GlobalFilters categories={categoryNames} />

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <KpiCard
          title="Total Revenue"
          value={`$${(kpis?.totalRevenue || 0).toLocaleString()}`}
          subtitle={`AOV: $${kpis?.avgOrderValue || 0}`}
          icon={DollarSign}
          color="blue"
          trend={`+${kpis?.growthRate || 0}%`}
          trendDirection="up"
        />
        <KpiCard
          title="Total Units Sold"
          value={(kpis?.totalUnits || 0).toLocaleString()}
          subtitle={`Across ${kpis?.activeCategories || 0} Categories`}
          icon={ShoppingBag}
          color="teal"
          trend="Active Volume"
          trendDirection="neutral"
        />
        <KpiCard
          title="Gross Margin"
          value={`${kpis?.grossMargin || 0}%`}
          subtitle={`Profit: $${(kpis?.grossProfit || 0).toLocaleString()}`}
          icon={Percent}
          color="orange"
          trend={kpis?.grossMargin > 30 ? 'Healthy' : 'Moderate'}
          trendDirection={kpis?.grossMargin > 30 ? 'up' : 'down'}
        />
        <KpiCard
          title="Active SKUs"
          value={kpis?.activeProducts || 0}
          subtitle={`Top Cat: ${kpis?.topCategory || 'N/A'}`}
          icon={Layers}
          color="purple"
          trend={kpis?.topProduct ? 'Top SKU Loaded' : 'Monitored'}
          trendDirection="up"
        />
      </div>

      {/* Charts Row 1: Monthly Trends & Category Revenue Share */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Monthly Revenue & Profit Area Chart */}
        <div className="lg:col-span-2 glass-card rounded-2xl p-5 hover:shadow-lg transition-all duration-300">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h4 className="font-bold text-slate-900 dark:text-white text-base flex items-center gap-2">
                <TrendingUp className="w-4 h-4 text-blue-500 dark:text-blue-400" />
                Monthly Revenue & Profit Progression
              </h4>
              <p className="text-xs text-slate-500 dark:text-slate-400">Historical performance with MoM telemetry</p>
            </div>
          </div>

          <div className="h-72 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={trends} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                <defs>
                  <linearGradient id="revGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.35} />
                    <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="profGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#10b981" stopOpacity={0.35} />
                    <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.06)" />
                <XAxis dataKey="month" stroke="#64748b" tick={{ fontSize: 11 }} />
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
                  formatter={(val) => [`$${Number(val).toLocaleString()}`, '']}
                />
                <Legend wrapperStyle={{ fontSize: '12px', paddingTop: '10px' }} />
                <Area type="monotone" dataKey="revenue" name="Revenue ($)" stroke="#3b82f6" strokeWidth={2.5} fillOpacity={1} fill="url(#revGrad)" />
                <Area type="monotone" dataKey="profit" name="Profit ($)" stroke="#10b981" strokeWidth={2} fillOpacity={1} fill="url(#profGrad)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Category Share Donut Chart */}
        <div className="glass-card rounded-2xl p-5 flex flex-col justify-between hover:shadow-lg transition-all duration-300">
          <div>
            <h4 className="font-bold text-slate-900 dark:text-white text-base flex items-center gap-2 mb-1">
              <Award className="w-4 h-4 text-amber-500 dark:text-amber-400" />
              Category Revenue Share
            </h4>
            <p className="text-xs text-slate-500 dark:text-slate-400 mb-2">Contribution by portfolio category</p>
          </div>

          <div className="h-60 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={categories}
                  dataKey="revenue"
                  nameKey="category"
                  cx="50%"
                  cy="50%"
                  innerRadius={55}
                  outerRadius={80}
                  paddingAngle={4}
                >
                  {categories.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={PIE_COLORS[index % PIE_COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{
                    backgroundColor: 'var(--tooltip-bg)',
                    borderColor: 'var(--tooltip-border)',
                    color: 'var(--text-primary)',
                    borderRadius: '12px',
                    fontSize: '12px',
                  }}
                  itemStyle={{ color: 'var(--text-primary)' }}
                  formatter={(val) => [`$${Number(val).toLocaleString()}`, 'Revenue']}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>

          <div className="space-y-1.5 pt-2 border-t border-panelBorder">
            {categories.slice(0, 3).map((c, i) => (
              <div key={c.category} className="flex items-center justify-between text-xs">
                <div className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: PIE_COLORS[i % PIE_COLORS.length] }} />
                  <span className="text-slate-300 font-medium">{c.category}</span>
                </div>
                <span className="text-slate-400">{c.marketShare}%</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Row 2: Customer Segments & AI Quick Highlights */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Customer Purchasing Tiers Bar Chart */}
        <div className="glass-card rounded-2xl p-5 hover:shadow-lg transition-all duration-300">
          <h4 className="font-bold text-slate-900 dark:text-white text-base flex items-center gap-2 mb-1">
            <DollarSign className="w-4 h-4 text-emerald-500 dark:text-emerald-400" />
            Customer Value Segments
          </h4>
          <p className="text-xs text-slate-500 dark:text-slate-400 mb-4">Revenue distributed across buyer value tiers</p>

          <div className="h-56 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={segments} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.06)" />
                <XAxis dataKey="segmentName" stroke="#64748b" tick={{ fontSize: 10 }} />
                <YAxis stroke="#64748b" tick={{ fontSize: 10 }} tickFormatter={(v) => `$${(v / 1000).toFixed(0)}k`} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: 'var(--tooltip-bg)',
                    borderColor: 'var(--tooltip-border)',
                    color: 'var(--text-primary)',
                    borderRadius: '12px',
                    fontSize: '12px',
                  }}
                  itemStyle={{ color: 'var(--text-primary)' }}
                  formatter={(val) => [`$${Number(val).toLocaleString()}`, 'Revenue']}
                />
                <Bar dataKey="revenue" name="Segment Revenue ($)" fill="#10b981" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* AI Quick Strategy Cards */}
        <div className="lg:col-span-2 glass-card rounded-2xl p-5 flex flex-col justify-between hover:shadow-lg transition-all duration-300">
          <div className="flex items-center justify-between mb-3">
            <div>
              <h4 className="font-bold text-slate-900 dark:text-white text-base flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-blue-500 dark:text-blue-400" />
                Live AI Strategic Insights
              </h4>
              <p className="text-xs text-slate-500 dark:text-slate-400">Deterministic recommendations computed from active dataset</p>
            </div>
            <span className="text-[11px] font-semibold text-blue-500 dark:text-blue-400 bg-blue-500/10 px-2.5 py-1 rounded-full border border-blue-500/20">
              Evidence-Based
            </span>
          </div>

          <div className="space-y-3">
            {insights.slice(0, 2).map((ins) => (
              <div
                key={ins.id}
                className="p-3.5 rounded-xl border border-panelBorder bg-slate-100/50 dark:bg-white/5 flex items-start gap-3 hover:border-blue-500/30 transition-colors"
              >
                <div className="p-2 rounded-lg bg-blue-500/10 text-blue-500 dark:text-blue-400 shrink-0">
                  <Sparkles className="w-4 h-4" />
                </div>
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold text-slate-900 dark:text-white">{ins.title}</span>
                    <span className="text-[10px] text-blue-600 dark:text-blue-300 font-mono bg-blue-500/10 dark:bg-blue-500/20 px-1.5 py-0.5 rounded">
                      {ins.metricBadge}
                    </span>
                  </div>
                  <p className="text-xs text-slate-600 dark:text-slate-300 mt-1 line-clamp-2">{ins.summary}</p>
                  <p className="text-[11px] text-emerald-600 dark:text-emerald-400 font-medium mt-1">
                    💡 Action: {ins.recommendation}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Top Performing SKUs Table */}
      <div className="glass-card rounded-2xl p-5 hover:shadow-lg transition-all duration-300">
        <h4 className="font-bold text-slate-900 dark:text-white text-base mb-1">Top Performing SKUs by Revenue</h4>
        <p className="text-xs text-slate-500 dark:text-slate-400 mb-4">Ranked by revenue contribution with inventory status</p>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-600 dark:text-slate-300">
            <thead className="text-[11px] uppercase tracking-wider text-slate-500 dark:text-slate-400 border-b border-panelBorder">
              <tr>
                <th className="pb-3 font-semibold">Product Name</th>
                <th className="pb-3 font-semibold">Category</th>
                <th className="pb-3 font-semibold text-right">Unit Price</th>
                <th className="pb-3 font-semibold text-right">Monthly Sales</th>
                <th className="pb-3 font-semibold text-right">Revenue ($)</th>
                <th className="pb-3 font-semibold text-center">Stock Coverage</th>
                <th className="pb-3 font-semibold text-center">Peak Season</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-panelBorder">
              {products.slice(0, 5).map((p) => (
                <tr key={p.productId || p.productName} className="hover:bg-slate-100/40 dark:hover:bg-white/5 transition-colors">
                  <td className="py-3 font-medium text-slate-900 dark:text-white">{p.productName}</td>
                  <td className="py-3 text-slate-400">{p.category}</td>
                  <td className="py-3 text-right font-mono">${(p.avgPrice || 0).toFixed(2)}</td>
                  <td className="py-3 text-right font-mono">{(p.totalSales || 0).toLocaleString()}</td>
                  <td className="py-3 text-right font-mono font-bold text-blue-400">
                    ${(p.totalRevenue || 0).toLocaleString()}
                  </td>
                  <td className="py-3 text-center">
                    <span
                      className={`inline-block px-2 py-0.5 rounded-full text-[10px] font-semibold ${
                        p.riskLevel === 'HIGH'
                          ? 'bg-rose-500/10 text-rose-400 border border-rose-500/20'
                          : p.riskLevel === 'MEDIUM'
                          ? 'bg-amber-500/10 text-amber-400 border border-amber-500/20'
                          : 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                      }`}
                    >
                      {p.stockStatus}
                    </span>
                  </td>
                  <td className="py-3 text-center text-slate-300">{p.season || 'All Season'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

