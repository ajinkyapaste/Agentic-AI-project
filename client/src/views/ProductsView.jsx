import React, { useState, useEffect } from 'react';
import { Package, Search, AlertTriangle, CheckCircle, Clock, ShoppingCart } from 'lucide-react';
import { analyticsApi } from '../services/api';
import { useDataset } from '../context/DatasetContext';

export default function ProductsView() {
  const { selectedDatasetId, filters } = useDataset();
  const [productsData, setProductsData] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedRisk, setSelectedRisk] = useState('ALL');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!selectedDatasetId) return;

    const fetchProducts = async () => {
      setLoading(true);
      try {
        const res = await analyticsApi.getProducts(selectedDatasetId, filters);
        setProductsData(res.data.products);
      } catch (err) {
        console.error('Failed to load products:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchProducts();
  }, [selectedDatasetId, filters]);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] text-slate-400">
        <span className="w-8 h-8 border-2 border-blue-500/20 border-t-blue-500 rounded-full animate-spin mb-3" />
        <p className="text-sm">Auditing inventory stock and demand matrices...</p>
      </div>
    );
  }

  const allProducts = productsData?.allProducts || [];
  const highRisk = productsData?.highRiskProducts || [];

  // Filter products by search and risk level
  const filteredProducts = allProducts.filter((p) => {
    const matchesSearch =
      p.productName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.category.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesRisk =
      selectedRisk === 'ALL' ||
      (selectedRisk === 'HIGH' && p.riskLevel === 'HIGH') ||
      (selectedRisk === 'MEDIUM' && p.riskLevel === 'MEDIUM') ||
      (selectedRisk === 'LOW' && p.riskLevel === 'LOW');

    return matchesSearch && matchesRisk;
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-xl font-bold text-white tracking-tight flex items-center gap-2">
          <Package className="w-5 h-5 text-blue-400" />
          Product Demand & Inventory Matrix
        </h2>
        <p className="text-xs text-slate-400">
          Real-time stock adequacy auditing, inventory turnover, and reorder recommendations
        </p>
      </div>

      {/* High Stockout Alert (if any) */}
      {highRisk.length > 0 && (
        <div className="glass-card rounded-2xl p-4 border border-rose-500/30 bg-rose-500/10 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-rose-500/20 text-rose-400 shrink-0">
              <AlertTriangle className="w-5 h-5" />
            </div>
            <div>
              <h4 className="text-sm font-bold text-white">
                Inventory Stockout Risk Warning ({highRisk.length} SKUs Identified)
              </h4>
              <p className="text-xs text-slate-300">
                Products currently maintain less than 1.0x monthly sales coverage. Expedited replenishment orders are advised.
              </p>
            </div>
          </div>
          <button
            onClick={() => setSelectedRisk('HIGH')}
            className="px-3 py-1.5 rounded-xl bg-rose-600 hover:bg-rose-500 text-white text-xs font-semibold shrink-0 transition-colors"
          >
            Filter High Risk
          </button>
        </div>
      )}

      {/* Search & Risk Filters */}
      <div className="glass-card rounded-2xl p-4 flex flex-wrap items-center justify-between gap-4">
        <div className="relative flex-1 min-w-[240px] max-w-md">
          <Search className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search SKU or category..."
            className="glass-input w-full rounded-xl pl-10 pr-4 py-2 text-xs font-medium"
          />
        </div>

        <div className="flex items-center gap-2">
          <span className="text-xs text-slate-400 font-semibold uppercase tracking-wider hidden sm:block">
            Coverage Filter:
          </span>
          {['ALL', 'HIGH', 'MEDIUM', 'LOW'].map((lvl) => (
            <button
              key={lvl}
              onClick={() => setSelectedRisk(lvl)}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all ${
                selectedRisk === lvl
                  ? 'bg-blue-600 text-white shadow-glowBlue'
                  : 'bg-white/5 text-slate-400 hover:text-white hover:bg-white/10'
              }`}
            >
              {lvl === 'ALL' ? 'All Coverage' : lvl === 'HIGH' ? '🔴 Low (<1x)' : lvl === 'MEDIUM' ? '🟠 Moderate (1-3x)' : '🟢 Sufficient (>3x)'}
            </button>
          ))}
        </div>
      </div>

      {/* Main Product Table */}
      <div className="glass-card rounded-2xl p-5 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-300">
            <thead className="text-[11px] uppercase tracking-wider text-slate-400 border-b border-panelBorder">
              <tr>
                <th className="pb-3 font-semibold">SKU / Product Name</th>
                <th className="pb-3 font-semibold">Category</th>
                <th className="pb-3 font-semibold text-right">Unit Price</th>
                <th className="pb-3 font-semibold text-right">Current Stock</th>
                <th className="pb-3 font-semibold text-right">Monthly Sales</th>
                <th className="pb-3 font-semibold text-right">Coverage Ratio</th>
                <th className="pb-3 font-semibold text-center">Stock Status</th>
                <th className="pb-3 font-semibold text-right">Reorder Qty</th>
                <th className="pb-3 font-semibold text-right">Total Revenue ($)</th>
                <th className="pb-3 font-semibold text-center">Customer Tier</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-panelBorder">
              {filteredProducts.map((p) => (
                <tr key={p.productId || p.productName} className="hover:bg-white/5 transition-colors">
                  <td className="py-3 font-semibold text-white">
                    <div>{p.productName}</div>
                    <span className="text-[10px] text-slate-500 font-mono">{p.productId || 'SKU-001'}</span>
                  </td>
                  <td className="py-3 text-slate-400">{p.category}</td>
                  <td className="py-3 text-right font-mono">${(p.avgPrice || 0).toFixed(2)}</td>
                  <td className="py-3 text-right font-mono font-bold text-white">
                    {(p.currentStock || 0).toLocaleString()}
                  </td>
                  <td className="py-3 text-right font-mono text-slate-300">
                    {(p.totalSales || 0).toLocaleString()}
                  </td>
                  <td className="py-3 text-right font-mono">
                    <span className={p.stockRatio < 1 ? 'text-rose-400 font-bold' : p.stockRatio < 3 ? 'text-amber-400' : 'text-emerald-400'}>
                      {p.stockRatio}x
                    </span>
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
                  <td className="py-3 text-right font-mono">
                    {p.reorderRecommendation > 0 ? (
                      <span className="font-bold text-rose-400 flex items-center justify-end gap-1">
                        <ShoppingCart className="w-3 h-3" />
                        +{p.reorderRecommendation}
                      </span>
                    ) : (
                      <span className="text-slate-500">—</span>
                    )}
                  </td>
                  <td className="py-3 text-right font-mono font-bold text-blue-400">
                    ${(p.totalRevenue || 0).toLocaleString()}
                  </td>
                  <td className="py-3 text-center">
                    <span className="px-2 py-0.5 rounded text-[10px] uppercase font-bold bg-white/5 border border-panelBorder text-slate-300">
                      {p.customerSegment || 'Mid'}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {filteredProducts.length === 0 && (
          <div className="py-12 text-center text-slate-500 text-xs">
            No products match the selected search or filter parameters.
          </div>
        )}
      </div>
    </div>
  );
}

