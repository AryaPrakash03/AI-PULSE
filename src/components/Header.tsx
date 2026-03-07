/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { Search, Sparkles, Globe, Zap, LogIn, LogOut, User, Bookmark as BookmarkIcon, Settings } from 'lucide-react';
import { auth, signInWithGoogle, logout } from '../firebase';
import { useAuthState } from 'react-firebase-hooks/auth';

interface HeaderProps {
  onSearch: (query: string) => void;
  onLogoClick: () => void;
  onShowBookmarks?: () => void;
  onShowPreferences?: () => void;
  isLoading: boolean;
}

export const Header: React.FC<HeaderProps> = ({ onSearch, onLogoClick, onShowBookmarks, onShowPreferences, isLoading }) => {
  const [query, setQuery] = React.useState('');
  const [user] = useAuthState(auth);
  const [showDropdown, setShowDropdown] = React.useState(false);
  const dropdownRef = React.useRef<HTMLDivElement>(null);

  React.useEffect(() => {
    const handleClickOutside = (event: MouseEvent | TouchEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setShowDropdown(false);
      }
    };

    const handleScroll = () => {
      if (showDropdown) {
        setShowDropdown(false);
      }
    };

    if (showDropdown) {
      document.addEventListener('mousedown', handleClickOutside, true);
      document.addEventListener('touchstart', handleClickOutside, true);
      window.addEventListener('scroll', handleScroll, true);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside, true);
      document.removeEventListener('touchstart', handleClickOutside, true);
      window.removeEventListener('scroll', handleScroll, true);
    };
  }, [showDropdown]);

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

          <div className="flex items-center gap-4">
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

            {user ? (
              <div className="relative" ref={dropdownRef}>
                <button 
                  onClick={() => setShowDropdown(!showDropdown)}
                  className="flex items-center gap-2 p-1.5 rounded-xl bg-zinc-900 border border-zinc-800 hover:border-emerald-500/30 transition-all"
                >
                  {user.photoURL ? (
                    <img src={user.photoURL} alt={user.displayName || 'User'} className="w-6 h-6 rounded-lg" referrerPolicy="no-referrer" />
                  ) : (
                    <div className="w-6 h-6 rounded-lg bg-emerald-500/10 flex items-center justify-center text-emerald-400">
                      <User className="w-4 h-4" />
                    </div>
                  )}
                  <span className="text-[10px] font-bold text-zinc-300 hidden sm:block">{user.displayName?.split(' ')[0]}</span>
                </button>

                {showDropdown && (
                  <div className="absolute right-0 mt-2 w-48 bg-zinc-900 border border-zinc-800 rounded-xl shadow-2xl py-2 z-50">
                    <button 
                      onClick={() => { onShowBookmarks?.(); setShowDropdown(false); }}
                      className="w-full flex items-center gap-3 px-4 py-2 text-xs text-zinc-400 hover:text-emerald-400 hover:bg-zinc-800 transition-all"
                    >
                      <BookmarkIcon className="w-4 h-4" />
                      My Bookmarks
                    </button>
                    <button 
                      onClick={() => { onShowPreferences?.(); setShowDropdown(false); }}
                      className="w-full flex items-center gap-3 px-4 py-2 text-xs text-zinc-400 hover:text-emerald-400 hover:bg-zinc-800 transition-all"
                    >
                      <Settings className="w-4 h-4" />
                      Preferences
                    </button>
                    <div className="h-px bg-zinc-800 my-1 mx-2"></div>
                    <button 
                      onClick={() => { logout(); setShowDropdown(false); }}
                      className="w-full flex items-center gap-3 px-4 py-2 text-xs text-red-400 hover:bg-red-500/10 transition-all"
                    >
                      <LogOut className="w-4 h-4" />
                      Sign Out
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <button 
                onClick={signInWithGoogle}
                className="flex items-center gap-2 px-4 py-2 rounded-xl bg-emerald-500 text-zinc-900 text-xs font-bold hover:bg-emerald-400 transition-all"
              >
                <LogIn className="w-4 h-4" />
                <span className="hidden sm:block">Sign In</span>
              </button>
            )}
          </div>
        </div>
      </div>
    </header>
  );
};
