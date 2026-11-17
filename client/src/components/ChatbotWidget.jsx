import React, { useState, useEffect, useRef } from 'react';
import {
  Bot,
  X,
  Send,
  Sparkles,
  Maximize2,
  TrendingUp,
  PackageCheck,
  AlertCircle,
  MessageSquare,
  CornerDownLeft,
} from 'lucide-react';
import { aiApi } from '../services/api';
import { useDataset } from '../context/DatasetContext';

export default function ChatbotWidget({ onNavigateFullChat }) {
  const { selectedDatasetId, selectedDataset } = useDataset();
  const [isOpen, setIsOpen] = useState(false);
  const [inputMessage, setInputMessage] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [messages, setMessages] = useState([
    {
      id: 'initial',
      sender: 'assistant',
      text: "👋 Hi! I'm your **AI Sales Copilot**. Ask me anything about revenue, seasonal demand, stock status, or customer trends for the active dataset!",
      timestamp: new Date(),
    },
  ]);

  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);

  // Auto-scroll to bottom of messages
  useEffect(() => {
    if (isOpen) {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, isTyping, isOpen]);

  // Focus input on open
  useEffect(() => {
    if (isOpen) {
      setTimeout(() => inputRef.current?.focus(), 150);
    }
  }, [isOpen]);

  const handleSendMessage = async (textToSend) => {
    const text = (textToSend || inputMessage).trim();
    if (!text || isTyping) return;

    if (!selectedDatasetId) {
      setMessages((prev) => [
        ...prev,
        {
          id: Date.now(),
          sender: 'assistant',
          text: '⚠️ Please select or upload a dataset first to enable predictive chat telemetry.',
          timestamp: new Date(),
        },
      ]);
      return;
    }

    const userMsg = {
      id: Date.now(),
      sender: 'user',
      text,
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userMsg]);
    setInputMessage('');
    setIsTyping(true);

    try {
      const res = await aiApi.chat(selectedDatasetId, { message: text });
      const aiMsg = {
        id: Date.now() + 1,
        sender: 'assistant',
        text: res.data.response || 'Telemetry synthesized successfully.',
        metrics: res.data.metrics || null,
        suggestions: res.data.suggestions || [],
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, aiMsg]);
    } catch (err) {
      console.error('Chat error:', err);
      setMessages((prev) => [
        ...prev,
        {
          id: Date.now() + 1,
          sender: 'assistant',
          text: '⚠️ Unable to compute analysis right now. Please verify your connection or try again.',
          timestamp: new Date(),
        },
      ]);
    } finally {
      setIsTyping(false);
    }
  };

  const quickPrompts = [
    'Is current inventory sufficient?',
    'What is next month forecast?',
    'When is our peak season?',
    'Which products generate most profit?',
  ];

  return (
    <>
      {/* Floating Action Button (Right-Bottom) */}
      <div className="fixed bottom-6 right-6 z-50">
        {!isOpen ? (
          <button
            onClick={() => setIsOpen(true)}
            className="group relative flex items-center gap-2.5 px-4 py-3 rounded-full bg-gradient-to-r from-blue-600 via-blue-500 to-indigo-600 text-white font-semibold text-xs shadow-glowBlue hover:shadow-2xl hover:scale-105 transition-all duration-300 border border-blue-400/40 cursor-pointer"
            aria-label="Open AI Chatbot"
          >
            {/* Pulsing beacon indicator */}
            <span className="relative flex h-2.5 w-2.5">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
              <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-400" />
            </span>

            <div className="p-1 rounded-full bg-white/10">
              <Bot className="w-4 h-4 text-white" />
            </div>

            <span className="tracking-wide">AI Assistant</span>

            <Sparkles className="w-3.5 h-3.5 text-blue-200 group-hover:rotate-12 transition-transform" />
          </button>
        ) : null}
      </div>

      {/* Floating Chatbot Dialog Window */}
      {isOpen && (
        <div className="fixed bottom-6 right-6 z-50 w-[380px] sm:w-[420px] max-w-[calc(100vw-2rem)] h-[560px] max-h-[calc(100vh-4rem)] flex flex-col rounded-3xl overflow-hidden glass-panel border border-panelBorder shadow-2xl animate-in fade-in slide-in-from-bottom-5 duration-300">
          {/* Header */}
          <div className="p-4 border-b border-panelBorder bg-gradient-to-r from-blue-600/15 via-indigo-600/10 to-transparent flex items-center justify-between">
            <div className="flex items-center gap-3 min-w-0">
              <div className="relative">
                <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-blue-600 to-indigo-500 flex items-center justify-center text-white shadow-glowBlue">
                  <Bot className="w-5 h-5" />
                </div>
                <span className="absolute bottom-0 right-0 w-2.5 h-2.5 rounded-full bg-emerald-400 border-2 border-slate-900" />
              </div>
              <div className="min-w-0">
                <h4 className="font-bold text-sm text-slate-900 dark:text-white flex items-center gap-1.5 truncate">
                  AI Sales Copilot
                  <span className="text-[10px] text-blue-500 dark:text-blue-400 font-mono bg-blue-500/10 px-1.5 py-0.2 rounded border border-blue-500/20">
                    Active
                  </span>
                </h4>
                <p className="text-[11px] text-slate-500 dark:text-slate-400 truncate">
                  {selectedDataset ? `Dataset: ${selectedDataset.name}` : 'No dataset loaded'}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-1 shrink-0">
              {onNavigateFullChat && (
                <button
                  type="button"
                  onClick={() => {
                    setIsOpen(false);
                    onNavigateFullChat();
                  }}
                  className="p-1.5 rounded-xl text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-200/50 dark:hover:bg-white/10 transition-colors cursor-pointer"
                  title="Open full page chat"
                >
                  <Maximize2 className="w-4 h-4" />
                </button>
              )}
              <button
                type="button"
                onClick={() => setIsOpen(false)}
                className="p-1.5 rounded-xl text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-200/50 dark:hover:bg-white/10 transition-colors cursor-pointer"
                title="Close chat"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Messages Scroll Area */}
          <div className="flex-1 overflow-y-auto p-4 space-y-3.5 text-xs">
            {messages.map((m) => {
              const isUser = m.sender === 'user';
              return (
                <div
                  key={m.id}
                  className={`flex flex-col ${isUser ? 'items-end' : 'items-start'} max-w-full`}
                >
                  <div
                    className={`p-3.5 rounded-2xl max-w-[88%] leading-relaxed ${
                      isUser
                        ? 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-tr-sm shadow-md'
                        : 'glass-card border border-panelBorder text-slate-800 dark:text-slate-200 rounded-tl-sm shadow-sm'
                    }`}
                  >
                    <p className="whitespace-pre-line text-xs">{m.text}</p>

                    {/* Metric Cards if returned */}
                    {m.metrics && (
                      <div className="mt-2.5 pt-2 border-t border-panelBorder/60 grid grid-cols-2 gap-1.5 text-[11px] font-mono">
                        {Object.entries(m.metrics).slice(0, 4).map(([key, val]) => (
                          <div key={key} className="bg-blue-500/10 px-2 py-1 rounded border border-blue-500/20">
                            <span className="text-[9px] text-slate-500 uppercase block">{key}</span>
                            <span className="text-blue-500 dark:text-blue-300 font-bold">{String(val)}</span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  <span className="text-[9px] text-slate-500 dark:text-slate-400 mt-1 px-1">
                    {new Date(m.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </span>
                </div>
              );
            })}

            {/* Typing Indicator */}
            {isTyping && (
              <div className="flex items-center gap-2 p-3 rounded-2xl glass-card border border-panelBorder w-28 text-slate-400">
                <Bot className="w-3.5 h-3.5 text-blue-400 animate-spin" />
                <span className="text-[11px] animate-pulse">Analyzing...</span>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Quick Questions Pills */}
          <div className="px-3.5 py-2 border-t border-panelBorder/70 bg-slate-100/40 dark:bg-white/[0.02] flex items-center gap-1.5 overflow-x-auto no-scrollbar">
            {quickPrompts.map((q, idx) => (
              <button
                key={idx}
                type="button"
                onClick={() => handleSendMessage(q)}
                disabled={isTyping}
                className="shrink-0 px-2.5 py-1 rounded-full text-[10px] font-medium bg-slate-200/60 dark:bg-white/5 hover:bg-blue-500/15 hover:text-blue-500 dark:hover:text-blue-300 border border-panelBorder text-slate-700 dark:text-slate-300 transition-all cursor-pointer whitespace-nowrap"
              >
                {q}
              </button>
            ))}
          </div>

          {/* Input Footer */}
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleSendMessage();
            }}
            className="p-3 border-t border-panelBorder bg-panelBg/80 flex items-center gap-2"
          >
            <input
              ref={inputRef}
              type="text"
              value={inputMessage}
              onChange={(e) => setInputMessage(e.target.value)}
              placeholder="Ask about sales, trends, stock..."
              disabled={isTyping}
              className="glass-input flex-1 rounded-xl px-3.5 py-2 text-xs font-medium focus:ring-1 focus:ring-blue-500"
            />
            <button
              type="submit"
              disabled={!inputMessage.trim() || isTyping}
              className="p-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white shadow-glowBlue transition-all shrink-0 cursor-pointer"
              title="Send message"
            >
              <Send className="w-3.5 h-3.5" />
            </button>
          </form>
        </div>
      )}
    </>
  );
}
