import React from 'react';
import {
  LayoutDashboard,
  SunMoon,
  Package,
  TrendingUp,
  Bot,
  Database,
  FileText,
  ChevronLeft,
  ChevronRight,
  Cpu,
} from 'lucide-react';

export default function Sidebar({ currentView, setCurrentView, isCollapsed, setIsCollapsed, isMobileOpen, setIsMobileOpen }) {
  const navItems = [
    { id: 'dashboard', label: 'Overview Dashboard', icon: LayoutDashboard },
    { id: 'seasonal', label: 'Seasonal Analytics', icon: SunMoon },
    { id: 'products', label: 'Product & Inventory', icon: Package },
    { id: 'forecasting', label: 'Forecasting Studio', icon: TrendingUp },
    { id: 'ai-chat', label: 'AI Intelligence & Chat', icon: Bot },
    { id: 'datasets', label: 'Datasets & Ingestion', icon: Database },
    { id: 'reports', label: 'Reports & Exports', icon: FileText },
  ];

  return (
    <>
      {/* Mobile Backdrop */}
      {isMobileOpen && (
        <div
          className="fixed inset-0 bg-black/60 z-40 lg:hidden backdrop-blur-sm"
          onClick={() => setIsMobileOpen(false)}
        />
      )}

      {/* Sidebar Container */}
      <aside
        className={`fixed top-0 bottom-0 left-0 z-50 flex flex-col glass-panel transition-all duration-300 border-r border-panelBorder
          ${isCollapsed ? 'w-20' : 'w-64'}
          ${isMobileOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
        `}
      >
        {/* Brand Header */}
        <div className="h-16 px-4 flex items-center justify-between border-b border-panelBorder">
          <div className="flex items-center gap-3 overflow-hidden">
            <div className="w-10 h-10 rounded-xl bg-blue-500/10 border border-blue-500/30 flex items-center justify-center text-blue-400 shrink-0 shadow-glowBlue">
              <Cpu className="w-5 h-5" />
            </div>
            {!isCollapsed && (
              <div className="min-w-0">
                <h1 className="font-bold text-sm tracking-wide text-white truncate">
                  Predictive Sales
                </h1>
                <div className="flex items-center gap-1.5 text-[11px] text-slate-400">
                  <span className="glowing-dot" />
                  <span>AI Core Active</span>
                </div>
              </div>
            )}
          </div>

          {/* Desktop Toggle Button */}
          <button
            onClick={() => setIsCollapsed(!isCollapsed)}
            className="hidden lg:flex w-7 h-7 rounded-lg items-center justify-center text-slate-400 hover:text-white hover:bg-white/5 transition-colors"
            title={isCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
          >
            {isCollapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
          </button>
        </div>

        {/* Navigation Items */}
        <nav className="flex-1 px-3 py-4 space-y-1.5 overflow-y-auto">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = currentView === item.id;

            return (
              <button
                key={item.id}
                onClick={() => {
                  setCurrentView(item.id);
                  setIsMobileOpen(false);
                }}
                className={`w-full flex items-center gap-3.5 px-3 py-2.5 rounded-xl text-sm font-medium transition-all ${
                  isActive
                    ? 'bg-blue-600/20 text-blue-400 border border-blue-500/30 shadow-glowBlue'
                    : 'text-slate-400 hover:text-white hover:bg-white/5'
                }`}
                title={isCollapsed ? item.label : undefined}
              >
                <Icon className={`w-5 h-5 shrink-0 ${isActive ? 'text-blue-400' : 'text-slate-400'}`} />
                {!isCollapsed && <span className="truncate">{item.label}</span>}
              </button>
            );
          })}
        </nav>

        {/* Footer Info */}
        {!isCollapsed && (
          <div className="p-4 border-t border-panelBorder text-xs text-slate-500 text-center">
            <p className="font-medium text-slate-400">Sales Intelligence Platform</p>
            <p className="text-[10px]">v1.0.0 Production Ready</p>
          </div>
        )}
      </aside>
    </>
  );
}

