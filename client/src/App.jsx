import React, { useState } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import { DatasetProvider, useDataset } from './context/DatasetContext';
import Navbar from './components/Navbar';
import Sidebar from './components/Sidebar';
import ChatbotWidget from './components/ChatbotWidget';
import LoginView from './views/LoginView';
import DashboardView from './views/DashboardView';
import SeasonalView from './views/SeasonalView';
import ProductsView from './views/ProductsView';
import ForecastingView from './views/ForecastingView';
import AiChatView from './views/AiChatView';
import DatasetsView from './views/DatasetsView';
import ReportsView from './views/ReportsView';

function MainLayout() {
  const { isAuthenticated, loading } = useAuth();
  const [currentView, setCurrentView] = useState('dashboard');
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [isMobileOpen, setIsMobileOpen] = useState(false);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-darkBg text-slate-400">
        <span className="w-8 h-8 border-2 border-blue-500/20 border-t-blue-500 rounded-full animate-spin" />
      </div>
    );
  }

  if (!isAuthenticated) {
    return <LoginView />;
  }

  const renderActiveView = () => {
    switch (currentView) {
      case 'dashboard':
        return <DashboardView />;
      case 'seasonal':
        return <SeasonalView />;
      case 'products':
        return <ProductsView />;
      case 'forecasting':
        return <ForecastingView />;
      case 'ai-chat':
        return <AiChatView />;
      case 'datasets':
        return <DatasetsView />;
      case 'reports':
        return <ReportsView />;
      default:
        return <DashboardView />;
    }
  };

  return (
    <div className="min-h-screen flex">
      {/* Sidebar */}
      <Sidebar
        currentView={currentView}
        setCurrentView={setCurrentView}
        isCollapsed={isCollapsed}
        setIsCollapsed={setIsCollapsed}
        isMobileOpen={isMobileOpen}
        setIsMobileOpen={setIsMobileOpen}
      />

      {/* Main Content Area */}
      <div
        className={`flex-1 flex flex-col min-w-0 transition-all duration-300 ${
          isCollapsed ? 'lg:pl-20' : 'lg:pl-64'
        }`}
      >
        <Navbar setIsMobileOpen={setIsMobileOpen} />
        <main className="flex-1 p-4 sm:p-6 lg:p-8 max-w-7xl w-full mx-auto">
          {renderActiveView()}
        </main>
      </div>

      {/* Persistent Right-Bottom Floating Chatbot Widget */}
      <ChatbotWidget onNavigateFullChat={() => setCurrentView('ai-chat')} />
    </div>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <DatasetProvider>
        <MainLayout />
      </DatasetProvider>
    </AuthProvider>
  );
}

