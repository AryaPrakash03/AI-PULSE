/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { ExternalLink, Calendar, Tag, Share2 } from 'lucide-react';
import { NewsItem } from '../types';
import { formatDistanceToNow } from 'date-fns';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

interface NewsCardProps {
  item: NewsItem;
}

export const NewsCard: React.FC<NewsCardProps> = ({ item }) => {
  const categoryColors = {
    Research: 'bg-blue-500/10 text-blue-400 border-blue-500/20',
    Industry: 'bg-purple-500/10 text-purple-400 border-purple-500/20',
    Policy: 'bg-amber-500/10 text-amber-400 border-amber-500/20',
    Breakthrough: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
    General: 'bg-slate-500/10 text-slate-400 border-slate-500/20',
  };

  const formattedDate = React.useMemo(() => {
    try {
      return formatDistanceToNow(new Date(item.date), { addSuffix: true });
    } catch {
      return 'Recently';
    }
  }, [item.date]);

  return (
    <div className="group relative flex flex-col bg-zinc-900/50 border border-zinc-800 rounded-2xl p-6 transition-all duration-300 hover:bg-zinc-800/50 hover:border-zinc-700 hover:shadow-2xl hover:shadow-emerald-500/5">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          {item.companyLogo && (
            <img 
              src={item.companyLogo} 
              alt={item.companyName} 
              className="w-8 h-8 rounded-lg object-contain bg-white p-1 border border-zinc-700"
              referrerPolicy="no-referrer"
            />
          )}
          <span className={cn(
            "px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider border",
            categoryColors[item.category]
          )}>
            {item.category}
          </span>
        </div>
        <div className="flex items-center gap-2 text-zinc-500 text-xs">
          <Calendar className="w-3 h-3" />
          {formattedDate}
        </div>
      </div>

      <h3 className="text-xl font-semibold text-zinc-100 mb-3 leading-tight group-hover:text-emerald-400 transition-colors">
        {item.title}
      </h3>

      <p className="text-zinc-400 text-sm leading-relaxed mb-6 line-clamp-3">
        {item.summary}
      </p>

      <div className="mt-auto pt-6 border-t border-zinc-800/50 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 rounded-full bg-zinc-800 flex items-center justify-center text-[10px] font-bold text-zinc-400">
            {item.source.charAt(0)}
          </div>
          <span className="text-xs font-medium text-zinc-500 truncate max-w-[120px]">
            {item.source}
          </span>
        </div>

        <div className="flex items-center gap-3">
          <button 
            onClick={() => navigator.share?.({ title: item.title, url: item.url })}
            className="p-2 rounded-lg bg-zinc-800/50 text-zinc-500 hover:text-zinc-300 hover:bg-zinc-800 transition-all"
          >
            <Share2 className="w-4 h-4" />
          </button>
          <a
            href={item.url}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-2 px-4 py-2 rounded-lg bg-emerald-500/10 text-emerald-400 text-xs font-bold hover:bg-emerald-500 hover:text-zinc-900 transition-all"
          >
            Read Article
            <ExternalLink className="w-3 h-3" />
          </a>
        </div>
      </div>
    </div>
  );
};
