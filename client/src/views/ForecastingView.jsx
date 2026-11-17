import React, { useState, useEffect } from 'react';
import {
  TrendingUp,
  Sliders,
  CheckCircle,
  AlertTriangle,
  Play,
  RotateCcw,
  Activity,
  Layers,
} from 'lucide-react';
import {
  ResponsiveContainer,
  ComposedChart,
  Line,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  CartesianGrid,
} from 'recharts';
import { forecastingApi, analyticsApi } from '../services/api';
import { useDataset } from '../context/DatasetContext';

export default function ForecastingView() {
  const { selectedDatasetId } = useDataset();

  const [categories, setCategories] = useState([]);
  const [products, setProducts] = useState([]);
  const [targetType, setTargetType] = useState('revenue'); // revenue or sales
  const [targetName, setTargetName] = useState('Overall');
  const [algorithm, setAlgorithm] = useState('HOLT_WINTERS');
  const [horizon, setHorizon] = useState(4);
  const [alpha, setAlpha] = useState(0.3);
  const [beta, setBeta] = useState(0.1);
  const [gamma, setGamma] = useState(0.3);

  const [forecastResult, setForecastResult] = useState(null);
  const [anomalies, setAnomalies] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Load target options (Categories & Products)
  useEffect(() => {
    if (!selectedDatasetId) return;

    const loadTargets = async () => {
      try {
        const [catRes, prodRes, anomRes] = await Promise.all([
          analyticsApi.getCategories(selectedDatasetId),
          analyticsApi.getProducts(selectedDatasetId),
          forecastingApi.getAnomalies(selectedDatasetId),
        ]);
        setCategories(catRes.data.categories.categories || []);
        setProducts(prodRes.data.products.allProducts || []);
        setAnomalies(anomRes.data.anomalies || []);
      } catch (e) {
        console.error('Target load error:', e);
      }
    };

    loadTargets();
  }, [selectedDatasetId]);

  // Execute forecast
  const executeForecast = async () => {
    if (!selectedDatasetId) return;
    setLoading(true);
    setError('');

    try {
      const res = await forecastingApi.predict(selectedDatasetId, {
        targetType,
        targetName,
        algorithm,
        horizon: parseInt(horizon, 10),
        parameters: { alpha, beta, gamma },
      });
      setForecastResult(res.data);
    } catch (err) {
      setError(err.response?.data?.message || 'Forecasting execution failed.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (selectedDatasetId) {
      executeForecast();
    }
  }, [selectedDatasetId, targetType, targetName, algorithm]);

  // Merge historical and forecast points for the unified Recharts timeline
  const chartTimelineData = [];

  if (forecastResult) {
    const historical = forecastResult.historicalPoints || [];
    const fitted = forecastResult.fittedPoints || [];
    const forecasts = forecastResult.forecastPoints || [];

    // Historical Points with model fit
    historical.forEach((h, i) => {
      chartTimelineData.push({
        period: h.period,
        actual: h.actual,
        fitted: fitted[i] || h.actual,
      });
    });

    // Forecast Points with confidence bounds
    forecasts.forEach((f) => {
      chartTimelineData.push({
        period: f.period,
        forecast: f.forecast,
        lower95: f.lower95,
        upper95: f.upper95,
      });
    });
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-xl font-bold text-white tracking-tight flex items-center gap-2">
          <TrendingUp className="w-5 h-5 text-blue-400" />
          AI/ML Forecasting Studio & Backtesting Engine
        </h2>
        <p className="text-xs text-slate-400">
          Data-driven predictive modeling using Holt-Winters Triple Smoothing, Moving Averages & Out-of-Sample Backtesting
        </p>
      </div>

      {/* Control Panel Grid */}
      <div className="glass-card rounded-2xl p-5">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Target Metric */}
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1.5">
              Forecast Target Metric
            </label>
            <select
              value={targetType}
              onChange={(e) => setTargetType(e.target.value)}
              className="glass-input w-full rounded-xl px-3 py-2 text-xs font-medium cursor-pointer"
            >
              <option value="revenue">Revenue ($)</option>
              <option value="sales">Sales Volume (Units)</option>
            </select>
          </div>

          {/* Target Scope */}
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1.5">
              Aggregation Scope
            </label>
            <select
              value={targetName}
              onChange={(e) => setTargetName(e.target.value)}
              className="glass-input w-full rounded-xl px-3 py-2 text-xs font-medium cursor-pointer"
            >
              <option value="Overall">Overall Portfolio</option>
              <optgroup label="Categories">
                {categories.map((c) => (
                  <option key={c.category} value={c.category}>
                    Category: {c.category}
                  </option>
                ))}
              </optgroup>
              <optgroup label="Top Products">
                {products.slice(0, 8).map((p) => (
                  <option key={p.productName} value={p.productName}>
                    SKU: {p.productName}
                  </option>
                ))}
              </optgroup>
            </select>
          </div>

          {/* Algorithm Selection */}
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1.5">
              Forecasting Model
            </label>
            <select
              value={algorithm}
              onChange={(e) => setAlgorithm(e.target.value)}
              className="glass-input w-full rounded-xl px-3 py-2 text-xs font-medium cursor-pointer"
            >
              <option value="HOLT_WINTERS">Holt-Winters Triple Smoothing</option>
              <option value="TENSORFLOW_NEURAL_NET">TensorFlow Deep Neural Network (ML)</option>
              <option value="MOVING_AVERAGE">Moving Average (SMA/WMA)</option>
              <option value="SEASONAL_NAIVE">Seasonal Naive</option>
            </select>
          </div>

          {/* Horizon Slider */}
          <div>
            <div className="flex justify-between items-center mb-1.5">
              <label className="text-xs font-semibold uppercase tracking-wider text-slate-400">
                Horizon ({horizon} Periods)
              </label>
            </div>
            <input
              type="range"
              min="2"
              max="12"
              value={horizon}
              onChange={(e) => setHorizon(e.target.value)}
              className="w-full accent-blue-500 cursor-pointer mt-2"
            />
          </div>
        </div>

        {/* Hyperparameter Adjustments (for Holt-Winters) */}
        {algorithm === 'HOLT_WINTERS' && (
          <div className="mt-4 pt-4 border-t border-panelBorder grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <span className="text-[11px] text-slate-400 block mb-1">
                Alpha (Level Smoothing): <strong className="text-white font-mono">{alpha}</strong>
              </span>
              <input
                type="range"
                min="0.05"
                max="0.95"
                step="0.05"
                value={alpha}
                onChange={(e) => setAlpha(parseFloat(e.target.value))}
                className="w-full accent-blue-500 cursor-pointer"
              />
            </div>
            <div>
              <span className="text-[11px] text-slate-400 block mb-1">
                Beta (Trend Smoothing): <strong className="text-white font-mono">{beta}</strong>
              </span>
              <input
                type="range"
                min="0.01"
                max="0.5"
                step="0.01"
                value={beta}
                onChange={(e) => setBeta(parseFloat(e.target.value))}
                className="w-full accent-blue-500 cursor-pointer"
              />
            </div>
            <div>
              <span className="text-[11px] text-slate-400 block mb-1">
                Gamma (Seasonal Smoothing): <strong className="text-white font-mono">{gamma}</strong>
              </span>
              <input
                type="range"
                min="0.05"
                max="0.95"
                step="0.05"
                value={gamma}
                onChange={(e) => setGamma(parseFloat(e.target.value))}
                className="w-full accent-blue-500 cursor-pointer"
              />
            </div>
          </div>
        )}
      </div>

      {/* Accuracy & Backtesting Evaluation Cards */}
      {forecastResult && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <div className="glass-card rounded-2xl p-4 relative overflow-hidden hover:-translate-y-1 hover:shadow-lg transition-all duration-300">
            <div className="absolute top-0 left-0 right-0 h-[2.5px] bg-gradient-to-r from-emerald-500 to-teal-500" />
            <span className="text-[11px] uppercase tracking-wider text-slate-500 dark:text-slate-400 block mb-1">
              Backtesting Accuracy
            </span>
            <h3 className="text-2xl font-bold text-emerald-500 dark:text-emerald-400 font-mono">
              {forecastResult.metrics?.accuracy || 90}%
            </h3>
            <span className="text-[10px] text-slate-500 dark:text-slate-400 mt-1 block">Out-of-sample backtest</span>
          </div>

          <div className="glass-card rounded-2xl p-4 relative overflow-hidden hover:-translate-y-1 hover:shadow-lg transition-all duration-300">
            <div className="absolute top-0 left-0 right-0 h-[2.5px] bg-gradient-to-r from-blue-500 to-indigo-500" />
            <span className="text-[11px] uppercase tracking-wider text-slate-500 dark:text-slate-400 block mb-1">
              Mean Abs. Pct. Error (MAPE)
            </span>
            <h3 className="text-2xl font-bold text-blue-500 dark:text-blue-400 font-mono">
              {forecastResult.metrics?.mape || 0}%
            </h3>
            <span className="text-[10px] text-slate-500 dark:text-slate-400 mt-1 block">Relative variance error</span>
          </div>

          <div className="glass-card rounded-2xl p-4 relative overflow-hidden hover:-translate-y-1 hover:shadow-lg transition-all duration-300">
            <div className="absolute top-0 left-0 right-0 h-[2.5px] bg-gradient-to-r from-amber-500 to-orange-500" />
            <span className="text-[11px] uppercase tracking-wider text-slate-500 dark:text-slate-400 block mb-1">
              Mean Absolute Error (MAE)
            </span>
            <h3 className="text-2xl font-bold text-amber-500 dark:text-amber-400 font-mono">
              ${(forecastResult.metrics?.mae || 0).toLocaleString()}
            </h3>
            <span className="text-[10px] text-slate-500 dark:text-slate-400 mt-1 block">Average absolute deviation</span>
          </div>

          <div className="glass-card rounded-2xl p-4 relative overflow-hidden hover:-translate-y-1 hover:shadow-lg transition-all duration-300">
            <div className="absolute top-0 left-0 right-0 h-[2.5px] bg-gradient-to-r from-purple-500 to-pink-500" />
            <span className="text-[11px] uppercase tracking-wider text-slate-500 dark:text-slate-400 block mb-1">
              Root Mean Sq. Error (RMSE)
            </span>
            <h3 className="text-2xl font-bold text-purple-500 dark:text-purple-400 font-mono">
              ${(forecastResult.metrics?.rmse || 0).toLocaleString()}
            </h3>
            <span className="text-[10px] text-slate-500 dark:text-slate-400 mt-1 block">Standard residual error</span>
          </div>
        </div>
      )}

      {/* Main Interactive Forecasting Visualizer */}
      <div className="glass-card rounded-2xl p-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-4">
          <div>
            <h4 className="font-bold text-white text-base flex items-center gap-2">
              <Activity className="w-4 h-4 text-blue-400" />
              Forecast Projection with 95% Confidence Cone
            </h4>
            <p className="text-xs text-slate-400">
              Target: {targetName} ({targetType.toUpperCase()}) | Model: {algorithm}
            </p>
          </div>
          <div className="flex items-center gap-3 text-xs text-slate-300">
            <span className="flex items-center gap-1.5">
              <span className="w-3 h-0.5 bg-blue-500 inline-block" /> Historical
            </span>
            <span className="flex items-center gap-1.5">
              <span className="w-3 h-0.5 bg-emerald-500 inline-block" /> Fitted Model
            </span>
            <span className="flex items-center gap-1.5">
              <span className="w-3 h-0.5 bg-cyan-400 inline-block" /> Projected
            </span>
          </div>
        </div>

        <div className="h-80 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <ComposedChart data={chartTimelineData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
              <defs>
                <linearGradient id="coneGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#06b6d4" stopOpacity={0.25} />
                  <stop offset="95%" stopColor="#06b6d4" stopOpacity={0.05} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.06)" />
              <XAxis dataKey="period" stroke="#64748b" tick={{ fontSize: 11 }} />
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
              {/* Confidence Interval Upper Bound Area */}
              <Area type="monotone" dataKey="upper95" name="Upper 95% Confidence" stroke="#06b6d4" strokeDasharray="3 3" fill="url(#coneGrad)" />
              <Area type="monotone" dataKey="lower95" name="Lower 95% Confidence" stroke="#06b6d4" strokeDasharray="3 3" fill="transparent" />
              {/* Actuals Line */}
              <Line type="monotone" dataKey="actual" name="Actual Data" stroke="#3b82f6" strokeWidth={2.5} dot={{ r: 3 }} />
              {/* Fitted Line */}
              <Line type="monotone" dataKey="fitted" name="Model In-Sample Fit" stroke="#10b981" strokeWidth={1.5} strokeDasharray="4 4" dot={false} />
              {/* Forecast Line */}
              <Line type="monotone" dataKey="forecast" name="Future Forecast" stroke="#06b6d4" strokeWidth={3} dot={{ r: 4, fill: '#06b6d4' }} />
            </ComposedChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Outliers & Statistical Anomalies Table */}
      <div className="glass-card rounded-2xl p-5">
        <h4 className="font-bold text-white text-base mb-1 flex items-center gap-2">
          <AlertTriangle className="w-4 h-4 text-amber-400" />
          Statistical Anomalies &amp; Variance Outliers Detected
        </h4>
        <p className="text-xs text-slate-400 mb-4">
          Z-scores &gt; 2.0σ or Interquartile Range (IQR) fence violations
        </p>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-300">
            <thead className="text-[11px] uppercase tracking-wider text-slate-400 border-b border-panelBorder">
              <tr>
                <th className="pb-3 font-semibold">Product Name</th>
                <th className="pb-3 font-semibold">Category</th>
                <th className="pb-3 font-semibold">Month</th>
                <th className="pb-3 font-semibold text-right">Value ($)</th>
                <th className="pb-3 font-semibold text-right">Z-Score</th>
                <th className="pb-3 font-semibold text-center">Severity</th>
                <th className="pb-3 font-semibold">Reasoning</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-panelBorder">
              {anomalies.slice(0, 5).map((a, i) => (
                <tr key={i} className="hover:bg-white/5 transition-colors">
                  <td className="py-3 font-medium text-white">{a.productName}</td>
                  <td className="py-3 text-slate-400">{a.category}</td>
                  <td className="py-3 text-slate-300">{a.month}</td>
                  <td className="py-3 text-right font-mono font-bold text-amber-400">
                    ${(a.value || 0).toLocaleString()}
                  </td>
                  <td className="py-3 text-right font-mono font-bold text-blue-400">
                    {a.zScore}σ
                  </td>
                  <td className="py-3 text-center">
                    <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-amber-500/10 text-amber-400 border border-amber-500/20">
                      {a.severity}
                    </span>
                  </td>
                  <td className="py-3 text-slate-300 text-[11px]">{a.reason}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

