/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { Quote } from 'lucide-react';
import { CEOQuote } from '../types';
import { motion } from 'motion/react';

interface CEOInsightsProps {
  quotes: CEOQuote[];
}

export const CEOInsights: React.FC<CEOInsightsProps> = ({ quotes }) => {
  if (!quotes || quotes.length === 0) return null;

  return (
    <section className="mb-16">
      <div className="flex items-center gap-3 mb-8">
        <div className="p-2 rounded-lg bg-purple-500/10 text-purple-400">
          <Quote className="w-5 h-5" />
        </div>
        <h2 className="text-2xl font-bold text-white tracking-tight">CEO Insights</h2>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {quotes.map((item, index) => (
          <motion.div
            key={item.id}
            initial={{ opacity: 0, x: index % 2 === 0 ? -20 : 20 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            className="relative bg-zinc-900/40 border border-zinc-800 rounded-2xl p-8 overflow-hidden group"
          >
            <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:opacity-10 transition-opacity">
              <Quote className="w-24 h-24 text-white" />
            </div>
            
            <p className="text-lg text-zinc-200 italic mb-6 relative z-10 leading-relaxed">
              "{item.quote}"
            </p>
            
            <div className="flex items-center gap-4 relative z-10">
              {item.avatarUrl ? (
                <img 
                  src={item.avatarUrl} 
                  alt={item.ceoName} 
                  className="w-12 h-12 rounded-full object-cover border-2 border-purple-500/20"
                  referrerPolicy="no-referrer"
                />
              ) : (
                <div className="w-12 h-12 rounded-full bg-zinc-800 flex items-center justify-center text-zinc-500 font-bold">
                  {item.ceoName.charAt(0)}
                </div>
              )}
              <div>
                <h4 className="text-white font-bold text-sm">{item.ceoName}</h4>
                <p className="text-zinc-500 text-xs uppercase tracking-wider">{item.company}</p>
              </div>
            </div>
            
            <div className="mt-4 text-[10px] text-zinc-600 font-medium uppercase tracking-widest">
              Context: {item.context}
            </div>
          </motion.div>
        ))}
      </div>
    </section>
  );
};
