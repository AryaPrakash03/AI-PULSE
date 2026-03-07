/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { Search, Sparkles, Globe, Zap } from 'lucide-react';

interface HeaderProps {
  onSearch: (query: string) => void;
  onLogoClick: () => void;
  isLoading: boolean;
}

export const Header: React.FC<HeaderProps> = ({ onSearch, onLogoClick, isLoading }) => {
  const [query, setQuery] = React.useState('');

  const trending = ['OpenAI', 'NVIDIA', 'Anthropic', 'Google AI', 'DeepSeek'];

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (query.trim()) {
      onSearch(query);
    }
  };

  const handleTrendingClick = (tag: string) => {
    setQuery(tag);
    onSearch(tag);
  };

  return (
    <header className="sticky top-0 z-50 w-full bg-black/80 backdrop-blur-xl border-b border-zinc-800">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col md:flex-row items-center justify-between py-4 gap-4">
          <button 
            onClick={onLogoClick}
            className="flex items-center gap-3 group hover:opacity-80 transition-all"
          >
            <div className="relative">
              <div className="absolute -inset-1 bg-gradient-to-r from-emerald-500 to-blue-500 rounded-lg blur opacity-25 group-hover:opacity-100 transition duration-1000 group-hover:duration-200"></div>
              <div className="relative bg-zinc-900 p-2 rounded-lg border border-zinc-800">
                <Zap className="w-6 h-6 text-emerald-400 fill-emerald-400/20" />
              </div>
            </div>
            <div className="text-left">
              <h1 className="text-xl font-bold text-white tracking-tight flex items-center gap-2">
                AI PULSE
                <span className="text-[10px] bg-emerald-500/10 text-emerald-400 px-1.5 py-0.5 rounded border border-emerald-500/20 font-mono">LIVE</span>
              </h1>
              <p className="text-[10px] text-zinc-500 uppercase tracking-widest font-medium">Global Intelligence Feed</p>
            </div>
          </button>

          <div className="flex flex-col gap-2 w-full md:w-auto">
            <form onSubmit={handleSubmit} className="relative w-full md:w-96 group">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500 group-focus-within:text-emerald-400 transition-colors" />
              <input
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search companies, tech, or news..."
                className="w-full bg-zinc-900/50 border border-zinc-800 rounded-xl py-2.5 pl-10 pr-4 text-sm text-zinc-200 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500/50 transition-all"
              />
              {isLoading && (
                <div className="absolute right-3 top-1/2 -translate-y-1/2">
                  <div className="w-4 h-4 border-2 border-emerald-500/20 border-t-emerald-500 rounded-full animate-spin"></div>
                </div>
              )}
            </form>
            <div className="flex items-center gap-2 overflow-x-auto pb-1 no-scrollbar">
              <span className="text-[9px] text-zinc-600 font-bold uppercase tracking-tighter whitespace-nowrap">Trending:</span>
              {trending.map(tag => (
                <button
                  key={tag}
                  onClick={() => handleTrendingClick(tag)}
                  className="text-[9px] text-zinc-500 hover:text-emerald-400 transition-colors whitespace-nowrap"
                >
                  #{tag}
                </button>
              ))}
            </div>
          </div>

          <div className="hidden lg:flex items-center gap-6">
            <div className="flex items-center gap-2 text-zinc-400 text-xs font-medium">
              <Globe className="w-4 h-4" />
              <span>Global Coverage</span>
            </div>
            <div className="flex items-center gap-2 text-zinc-400 text-xs font-medium">
              <Sparkles className="w-4 h-4" />
              <span>AI Grounded</span>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
};
