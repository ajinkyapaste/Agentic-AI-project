import React, { useState, useEffect, useRef } from 'react';
import { Bot, Send, Sparkles, AlertCircle, PackageCheck, TrendingUp, User, CornerDownLeft } from 'lucide-react';
import { aiApi, analyticsApi } from '../services/api';
import { useDataset } from '../context/DatasetContext';

export default function AiChatView() {
  const { selectedDatasetId } = useDataset();

  const [insights, setInsights] = useState([]);
  const [products, setProducts] = useState([]);
  const [selectedProduct, setSelectedProduct] = useState('');
  const [messages, setMessages] = useState([
    {
      sender: 'assistant',
      text: "Hello! I am your **AI Sales Intelligence Assistant**. I'm connected directly to your dataset telemetry. Ask me about inventory sufficiency, seasonal climes, revenue projections, or specific product velocity!",
      metrics: null,
    },
  ]);
  const [inputMessage, setInputMessage] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const chatBottomRef = useRef(null);

  useEffect(() => {
    if (!selectedDatasetId) return;

    const loadData = async () => {
      try {
        const [insRes, prodRes] = await Promise.all([
          aiApi.getInsights(selectedDatasetId),
          analyticsApi.getProducts(selectedDatasetId),
        ]);
        setInsights(insRes.data.insights || []);
        setProducts(prodRes.data.products.allProducts || []);
      } catch (err) {
        console.error('Insights error:', err);
      }
    };

    loadData();
  }, [selectedDatasetId]);

  useEffect(() => {
    chatBottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isTyping]);

  const handleSendMessage = async (textToSend) => {
    const text = (textToSend || inputMessage).trim();
    if (!text || !selectedDatasetId) return;

    // Add user message
    const newMessages = [...messages, { sender: 'user', text }];
    setMessages(newMessages);
    setInputMessage('');
    setIsTyping(true);

    try {
      const res = await aiApi.chat(selectedDatasetId, {
        message: text,
        selectedProduct: selectedProduct || undefined,
      });

      setMessages([
        ...newMessages,
        {
          sender: 'assistant',
          text: res.data.response,
          metrics: res.data.metrics,
          suggestions: res.data.suggestions,
        },
      ]);
    } catch (err) {
      setMessages([
        ...newMessages,
        {
          sender: 'assistant',
          text: '⚠️ An error occurred while computing the dataset analytics. Please try again.',
          metrics: null,
        },
      ]);
    } finally {
      setIsTyping(false);
    }
  };

  const suggestions = [
    'Is our current inventory sufficient?',
    'What is next month revenue forecast?',
    'When are our peak seasonal sales periods?',
    'Which customer segment generates highest margin?',
    'What are our top performing products?',
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-xl font-bold text-white tracking-tight flex items-center gap-2">
          <Bot className="w-5 h-5 text-blue-400" />
          AI Dataset Intelligence & Conversational Analytics
        </h2>
        <p className="text-xs text-slate-400">
          Strictly grounded natural language querying with calculated metrics and recommendations
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Executive Insights Stream (5 cols) */}
        <div className="lg:col-span-5 space-y-4">
          <div className="flex items-center justify-between">
            <h4 className="text-sm font-bold text-white flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-amber-400" />
              Evidence-Based Insights Feed
            </h4>
            <span className="text-[10px] text-slate-400">Deterministic Math</span>
          </div>

          <div className="space-y-3.5 max-h-[680px] overflow-y-auto pr-1">
            {insights.map((ins) => (
              <div
                key={ins.id}
                className="glass-card rounded-2xl p-4 border border-panelBorder hover:border-blue-500/30 transition-all"
              >
                <div className="flex items-start justify-between gap-2 mb-2">
                  <div className="flex items-center gap-2">
                    <span
                      className={`text-[10px] uppercase font-bold px-2 py-0.5 rounded-full ${
                        ins.type === 'OPPORTUNITY'
                          ? 'bg-blue-500/10 text-blue-400 border border-blue-500/20'
                          : ins.type === 'RISK'
                          ? 'bg-rose-500/10 text-rose-400 border border-rose-500/20'
                          : ins.type === 'SEASONALITY'
                          ? 'bg-amber-500/10 text-amber-400 border border-amber-500/20'
                          : 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                      }`}
                    >
                      {ins.type}
                    </span>
                    <h5 className="text-xs font-bold text-white">{ins.title}</h5>
                  </div>
                  <span className="text-[10px] font-mono font-semibold text-slate-300 bg-white/5 px-2 py-0.5 rounded border border-panelBorder shrink-0">
                    {ins.metricBadge}
                  </span>
                </div>

                <p className="text-xs text-slate-300 leading-relaxed mb-2.5">{ins.summary}</p>

                <div className="p-2.5 rounded-xl bg-white/5 border border-panelBorder text-[11px] text-emerald-400 flex items-start gap-1.5 font-medium">
                  <span className="shrink-0">💡</span>
                  <span>{ins.recommendation}</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Right Column: Conversational AI Panel (7 cols) */}
        <div className="lg:col-span-7 glass-card rounded-2xl flex flex-col h-[680px] overflow-hidden">
          {/* Chat Header */}
          <div className="p-4 border-b border-panelBorder flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-blue-500/20 text-blue-400 flex items-center justify-center border border-blue-500/30 shadow-glowBlue">
                <Bot className="w-5 h-5" />
              </div>
              <div>
                <h4 className="text-sm font-bold text-white">AI Predictive Assistant</h4>
                <div className="flex items-center gap-1.5 text-[11px] text-slate-400">
                  <span className="glowing-dot" />
                  <span>Dataset Grounded • Zero Hallucinations</span>
                </div>
              </div>
            </div>

            {/* Product Context Dropdown */}
            <div className="flex items-center gap-2">
              <span className="text-[11px] text-slate-400 hidden sm:block">Focus SKU:</span>
              <select
                value={selectedProduct}
                onChange={(e) => setSelectedProduct(e.target.value)}
                className="glass-input rounded-xl px-2.5 py-1 text-xs font-medium max-w-[150px] truncate cursor-pointer"
              >
                <option value="">All SKUs</option>
                {products.map((p) => (
                  <option key={p.productName} value={p.productName}>
                    {p.productName}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Messages Stream */}
          <div className="flex-1 p-4 overflow-y-auto space-y-4">
            {messages.map((m, idx) => (
              <div
                key={idx}
                className={`flex gap-3 ${m.sender === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                {m.sender === 'assistant' && (
                  <div className="w-7 h-7 rounded-lg bg-blue-500/20 text-blue-400 flex items-center justify-center border border-blue-500/30 shrink-0 mt-0.5">
                    <Bot className="w-4 h-4" />
                  </div>
                )}

                <div
                  className={`max-w-[85%] rounded-2xl p-4 text-xs leading-relaxed ${
                    m.sender === 'user'
                      ? 'bg-blue-600 text-white shadow-glowBlue rounded-tr-none'
                      : 'bg-white/5 border border-panelBorder text-slate-200 rounded-tl-none'
                  }`}
                >
                  <div className="whitespace-pre-line">{m.text}</div>

                  {/* Supporting metric badges if returned */}
                  {m.metrics && (
                    <div className="mt-3 pt-2 border-t border-white/10 flex flex-wrap gap-2 text-[10px]">
                      {m.metrics.totalRevenue !== undefined && (
                        <span className="bg-white/10 px-2 py-0.5 rounded font-mono">
                          Rev: ${m.metrics.totalRevenue.toLocaleString()}
                        </span>
                      )}
                      {m.metrics.accuracy !== undefined && (
                        <span className="bg-emerald-500/20 text-emerald-300 px-2 py-0.5 rounded font-mono">
                          Accuracy: {m.metrics.accuracy}%
                        </span>
                      )}
                      {m.metrics.stockStatus && (
                        <span className="bg-blue-500/20 text-blue-300 px-2 py-0.5 rounded font-mono">
                          Stock: {m.metrics.stockStatus}
                        </span>
                      )}
                    </div>
                  )}
                </div>

                {m.sender === 'user' && (
                  <div className="w-7 h-7 rounded-lg bg-slate-700 text-slate-300 flex items-center justify-center shrink-0 mt-0.5">
                    <User className="w-4 h-4" />
                  </div>
                )}
              </div>
            ))}

            {isTyping && (
              <div className="flex items-center gap-3">
                <div className="w-7 h-7 rounded-lg bg-blue-500/20 text-blue-400 flex items-center justify-center border border-blue-500/30 shrink-0">
                  <Bot className="w-4 h-4" />
                </div>
                <div className="glass-panel px-4 py-2.5 rounded-2xl rounded-tl-none flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 bg-slate-400 rounded-full animate-bounce" />
                  <span className="w-1.5 h-1.5 bg-slate-400 rounded-full animate-bounce [animation-delay:0.2s]" />
                  <span className="w-1.5 h-1.5 bg-slate-400 rounded-full animate-bounce [animation-delay:0.4s]" />
                </div>
              </div>
            )}
            <div ref={chatBottomRef} />
          </div>

          {/* Quick Suggestions Chips */}
          <div className="px-4 py-2.5 border-t border-panelBorder flex flex-wrap gap-1.5 bg-black/10">
            {suggestions.map((s, idx) => (
              <button
                key={idx}
                onClick={() => handleSendMessage(s)}
                className="px-2.5 py-1 rounded-full text-[11px] bg-white/5 hover:bg-blue-600/20 hover:text-blue-300 text-slate-400 border border-panelBorder transition-colors truncate max-w-xs"
              >
                {s}
              </button>
            ))}
          </div>

          {/* Chat Input Bar */}
          <div className="p-3 border-t border-panelBorder flex items-center gap-2">
            <input
              type="text"
              value={inputMessage}
              onChange={(e) => setInputMessage(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSendMessage()}
              placeholder="Ask about sales trends, inventory risk, seasonal peaks, or consumer tiers..."
              className="glass-input flex-1 rounded-xl px-4 py-2.5 text-xs font-medium focus:ring-1 focus:ring-blue-500"
            />
            <button
              onClick={() => handleSendMessage()}
              disabled={!inputMessage.trim()}
              className="w-10 h-10 rounded-xl bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white flex items-center justify-center shrink-0 shadow-glowBlue transition-all"
              title="Send"
            >
              <Send className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

