/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { Lightbulb, ArrowRight, Bookmark as BookmarkIcon } from 'lucide-react';
import { PublicUsageStory } from '../types';
import { motion } from 'framer-motion';
import { auth, db, handleFirestoreError } from '../firebase';
import { useAuthState } from 'react-firebase-hooks/auth';
import { doc, setDoc, deleteDoc, onSnapshot } from 'firebase/firestore';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

interface PublicUsageProps {
  stories: PublicUsageStory[];
}

const CaseStudyCard: React.FC<{ item: PublicUsageStory, index: number }> = ({ item, index }) => {
  const [user] = useAuthState(auth);
  const [isBookmarked, setIsBookmarked] = React.useState(false);

  React.useEffect(() => {
    if (!user) {
      setIsBookmarked(false);
      return;
    }

    const bookmarkRef = doc(db, 'users', user.uid, 'bookmarks', item.id);
    const unsubscribe = onSnapshot(bookmarkRef, (doc) => {
      setIsBookmarked(doc.exists());
    }, (error) => {
      handleFirestoreError(error, 'read', `users/${user.uid}/bookmarks/${item.id}`);
    });

    return () => unsubscribe();
  }, [user, item.id]);

  const toggleBookmark = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    
    if (!user) {
      alert("Please sign in to bookmark case studies.");
      return;
    }

    const bookmarkRef = doc(db, 'users', user.uid, 'bookmarks', item.id);
    try {
      if (isBookmarked) {
        await deleteDoc(bookmarkRef);
      } else {
        // Map PublicUsageStory to a Bookmark-compatible structure
        await setDoc(bookmarkRef, {
          id: item.id,
          title: item.story,
          summary: item.impact,
          source: item.userField,
          url: item.url,
          date: new Date().toISOString(),
          category: 'General',
          userId: user.uid,
          newsId: item.id,
          bookmarkedAt: new Date().toISOString()
        });
      }
    } catch (error) {
      handleFirestoreError(error, isBookmarked ? 'delete' : 'write', `users/${user.uid}/bookmarks/${item.id}`);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ delay: index * 0.1 }}
      className="bg-zinc-900/40 border border-zinc-800 rounded-2xl p-6 hover:border-emerald-500/30 transition-all group relative"
    >
      <div className="flex justify-between items-start mb-4">
        <div className="inline-flex items-center gap-2 px-2 py-1 rounded bg-zinc-800 text-[10px] font-bold text-zinc-400 uppercase tracking-widest">
          {item.userField}
        </div>
        <button 
          onClick={toggleBookmark}
          className={cn(
            "p-2 rounded-lg transition-all",
            isBookmarked 
              ? "bg-emerald-500/20 text-emerald-400 border border-emerald-500/30" 
              : "bg-zinc-800/50 text-zinc-500 hover:text-zinc-300 hover:bg-zinc-800"
          )}
        >
          <BookmarkIcon className={cn("w-3.5 h-3.5", isBookmarked && "fill-emerald-400")} />
        </button>
      </div>
      
      <h4 className="text-zinc-100 font-bold mb-3 group-hover:text-emerald-400 transition-colors">
        {item.story}
      </h4>
      
      <p className="text-zinc-400 text-sm mb-6 leading-relaxed">
        {item.impact}
      </p>
      
      <div className="flex items-center justify-between pt-4 border-t border-zinc-800/50">
        <div className="flex flex-col">
          <span className="text-[10px] text-zinc-600 uppercase tracking-widest font-bold">Method</span>
          <span className="text-xs text-zinc-300 font-medium">{item.example}</span>
        </div>
        <a 
          href={item.url} 
          target="_blank" 
          rel="noopener noreferrer"
          className="flex items-center gap-2 text-xs font-bold text-emerald-400 hover:text-emerald-300 transition-colors group/link"
        >
          <div className="flex flex-col items-end">
            <span>Read Case Study</span>
            <span className="text-[8px] text-zinc-600 font-normal lowercase tracking-normal">
              {new URL(item.url).hostname.replace('www.', '')}
            </span>
          </div>
          <ArrowRight className="w-4 h-4 group-hover/link:translate-x-1 transition-transform" />
        </a>
      </div>
    </motion.div>
  );
};

export const PublicUsage: React.FC<PublicUsageProps> = ({ stories }) => {
  if (!stories || stories.length === 0) return null;

  return (
    <section className="mb-16">
      <div className="flex items-center gap-3 mb-8">
        <div className="p-2 rounded-lg bg-emerald-500/10 text-emerald-400">
          <Lightbulb className="w-5 h-5" />
        </div>
        <h2 className="text-2xl font-bold text-white tracking-tight">AI in the Real World</h2>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {stories.map((item, index) => (
          <CaseStudyCard key={item.id} item={item} index={index} />
        ))}
      </div>
    </section>
  );
};
