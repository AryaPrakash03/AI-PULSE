import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Header } from './components/Header';
import { NewsCard } from './components/NewsCard';
import { CEOInsights } from './components/CEOInsights';
import { PublicUsage } from './components/PublicUsage';
import { fetchLatestAINews } from './services/gemini';
import { NewsItem, CEOQuote, PublicUsageStory, Bookmark, UserProfile } from './types';
import { AlertCircle, RefreshCw, TrendingUp, Cpu, Brain, Network, Zap, ArrowLeft, Building2, SearchX, Linkedin, Twitter, Github, Bookmark as BookmarkIcon, Sparkles } from 'lucide-react';
import { ChatBot } from './components/ChatBot';
import { PreferencesModal } from './components/PreferencesModal';
import { auth, db, handleFirestoreError } from './firebase';
import { useAuthState } from 'react-firebase-hooks/auth';
import { collection, onSnapshot, query, orderBy, doc, setDoc } from 'firebase/firestore';

export default function App() {
  const [user] = useAuthState(auth);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [news, setNews] = useState<NewsItem[]>([]);
  const [ceoQuotes, setCeoQuotes] = useState<CEOQuote[]>([]);
  const [publicUsage, setPublicUsage] = useState<PublicUsageStory[]>([]);
  const [bookmarks, setBookmarks] = useState<Bookmark[]>([]);
  const [loading, setLoading] = useState(false);
  const [isInitialLoad, setIsInitialLoad] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeCategory, setActiveCategory] = useState<string>('All');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [isSearching, setIsSearching] = useState(false);
  const [view, setView] = useState<'feed' | 'bookmarks'>('feed');
  const [isPreferencesOpen, setIsPreferencesOpen] = useState(false);

  const categories = ['All', 'Research', 'Industry', 'Policy', 'Breakthrough'];

  const loadNews = async (query?: string, category: string = 'All') => {
    if (loading && !isInitialLoad) return;
    setLoading(true);
    setIsInitialLoad(false);
    setError(null);
    setActiveCategory(category);
    
    const isGlobal = !query || query.trim() === '';
    
    if (!isGlobal) {
      setSearchQuery(query!);
      setIsSearching(true);
    } else {
      setIsSearching(false);
      setSearchQuery('');
    }

    // Use user preferences if it's a global feed and no specific category is selected
    let targetCategory = category;
    if (isGlobal && category === 'All' && userProfile?.preferences?.followedTopics) {
      const topics = userProfile.preferences.followedTopics;
      if (!topics.includes('All')) {
        targetCategory = topics.join(', ');
      }
    }

    try {
      const data = await fetchLatestAINews(isGlobal ? undefined : query, targetCategory);
      
      if (!isGlobal && category === 'All') {
        const q = query!.toLowerCase();
        const synonyms: Record<string, string[]> = {
          'meta': ['facebook', 'instagram', 'zuckerberg', 'llama'],
          'google': ['alphabet', 'deepmind', 'gemini', 'pichai'],
          'openai': ['sam altman', 'chatgpt', 'gpt-4', 'gpt-5'],
          'nvidia': ['jensen huang', 'gpu', 'h100', 'blackwell'],
          'apple': ['tim cook', 'intelligence', 'iphone', 'mac'],
          'microsoft': ['satya nadella', 'azure', 'copilot', 'bing']
        };

        const isKnownCompany = synonyms[q] !== undefined;
        const searchTerms = isKnownCompany ? [q, ...synonyms[q]] : q.split(' ').filter(word => word.length >= 2);

        const isRelevant = (text: string) => {
          const lowerText = text.toLowerCase();
          if (isKnownCompany) {
            return searchTerms.some(term => lowerText.includes(term));
          }
          const matches = searchTerms.filter(term => lowerText.includes(term)).length;
          return matches >= 1;
        };

        const filteredNews = data.news.filter(n => 
          isRelevant(n.title) || 
          isRelevant(n.summary) || 
          isRelevant(n.companyName || '')
        );

        // When searching, we strictly show only filtered results to avoid unrelated content
        setNews(filteredNews);
        setCeoQuotes(data.ceoQuotes.filter(q => isRelevant(q.ceoName) || isRelevant(q.company) || isRelevant(q.quote)));
        setPublicUsage(data.publicUsage.filter(s => isRelevant(s.userField) || isRelevant(s.story) || isRelevant(s.example)));
      } else {
        setNews(data.news);
        setCeoQuotes(data.ceoQuotes);
        setPublicUsage(data.publicUsage);
      }
    } catch (err) {
      console.error("Error in loadNews:", err);
      // We don't set error state here anymore because fetchLatestAINews returns fallbacks
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadNews();
  }, [userProfile?.preferences?.followedTopics]);

  useEffect(() => {
    if (!user) {
      setBookmarks([]);
      setUserProfile(null);
      return;
    }

    // User Profile listener
    const userRef = doc(db, 'users', user.uid);
    const unsubProfile = onSnapshot(userRef, async (snapshot) => {
      if (snapshot.exists()) {
        setUserProfile(snapshot.data() as UserProfile);
      } else {
        // Create profile if it doesn't exist
        const newProfile: UserProfile = {
          uid: user.uid,
          email: user.email || '',
          displayName: user.displayName,
          photoURL: user.photoURL,
          preferences: {
            followedTopics: ['All'],
            theme: 'dark'
          },
          createdAt: new Date().toISOString()
        };
        try {
          await setDoc(userRef, newProfile);
          setUserProfile(newProfile);
        } catch (error) {
          handleFirestoreError(error, 'create', `users/${user.uid}`);
        }
      }
    }, (error) => {
      handleFirestoreError(error, 'read', `users/${user.uid}`);
    });

    // Bookmarks listener
    const bookmarksRef = collection(db, 'users', user.uid, 'bookmarks');
    const q = query(bookmarksRef, orderBy('bookmarkedAt', 'desc'));
    
    const unsubBookmarks = onSnapshot(q, (snapshot) => {
      const b = snapshot.docs.map(doc => doc.data() as Bookmark);
      setBookmarks(b);
    }, (error) => {
      handleFirestoreError(error, 'list', `users/${user.uid}/bookmarks`);
    });

    return () => {
      unsubProfile();
      unsubBookmarks();
    };
  }, [user]);

  const handleLogoClick = () => {
    setView('feed');
    if (isSearching) {
      loadNews();
    } else {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  const filteredNews = activeCategory === 'All' 
    ? news 
    : news.filter(item => item.category === activeCategory);

  return (
    <div className="min-h-screen bg-black font-sans">
      <Header 
        onSearch={(q) => { setView('feed'); loadNews(q); }} 
        onLogoClick={handleLogoClick} 
        onShowBookmarks={() => {
          setView('bookmarks');
          window.scrollTo({ top: 0 });
        }}
        onShowPreferences={() => setIsPreferencesOpen(true)}
        isLoading={loading} 
      />

      <PreferencesModal 
        isOpen={isPreferencesOpen} 
        onClose={() => setIsPreferencesOpen(false)} 
        userProfile={userProfile} 
      />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <AnimatePresence mode="wait">
          {view === 'bookmarks' ? (
            <motion.div
              key="bookmarks-view"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 20 }}
            >
              <div className="flex items-center gap-4 mb-12">
                <div className="p-4 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400">
                  <BookmarkIcon className="w-8 h-8" />
                </div>
                <div>
                  <h2 className="text-3xl font-bold text-white tracking-tight">My Bookmarks</h2>
                  <p className="text-zinc-500 text-sm mt-1 uppercase tracking-widest font-medium">Your Saved Intelligence</p>
                </div>
              </div>

              {bookmarks.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-24 text-center">
                  <BookmarkIcon className="w-12 h-12 text-zinc-800 mb-4" />
                  <h3 className="text-xl font-bold text-zinc-200 mb-2">No Bookmarks Yet</h3>
                  <p className="text-zinc-500 mb-6 max-w-sm">
                    Articles you bookmark will appear here for quick access.
                  </p>
                  <button
                    onClick={() => setView('feed')}
                    className="px-8 py-3 bg-zinc-900 border border-zinc-800 rounded-xl text-zinc-300 hover:bg-zinc-800 transition-all font-bold text-sm"
                  >
                    Explore Feed
                  </button>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                  {bookmarks.map((item, index) => (
                    <motion.div
                      key={item.id}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: index * 0.05 }}
                    >
                      <NewsCard item={item} />
                    </motion.div>
                  ))}
                </div>
              )}
            </motion.div>
          ) : !isSearching ? (
            <motion.div
              key="hero"
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
            >
              {/* Hero Section */}
              <section className="mb-16 text-center">
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-[10px] font-bold uppercase tracking-widest mb-6"
                >
                  <TrendingUp className="w-3 h-3" />
                  Real-time AI Intelligence
                </motion.div>
                <motion.h2
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.1 }}
                  className="text-4xl md:text-6xl font-serif italic font-light text-white mb-6"
                >
                  The Pulse of <span className="gradient-text font-bold not-italic">Artificial Intelligence</span>
                </motion.h2>
                <motion.p
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.2 }}
                  className="max-w-2xl mx-auto text-zinc-400 text-lg leading-relaxed"
                >
                  Tracking global advancements, research breakthroughs, and industry shifts as they happen. 
                  Curated by AI, for the future.
                </motion.p>
              </section>

              {/* Stats/Quick Info Grid */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
                {[
                  { icon: Brain, label: 'Neural Networks', value: 'Active Research', query: 'neural network breakthroughs' },
                  { icon: Cpu, label: 'Compute Power', value: 'Exponential Growth', query: 'AI GPU hardware news' },
                  { icon: Network, label: 'Global Nodes', value: 'Seamless Integration', query: 'AI data center infrastructure' }
                ].map((stat, i) => (
                  <motion.button
                    key={i}
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: 0.3 + i * 0.1 }}
                    onClick={() => loadNews(stat.query)}
                    className="bg-zinc-900/30 border border-zinc-800/50 rounded-2xl p-6 flex items-center gap-4 hover:bg-zinc-800/50 hover:border-emerald-500/30 transition-all text-left group"
                  >
                    <div className="p-3 rounded-xl bg-zinc-800/50 text-emerald-400 group-hover:scale-110 transition-transform">
                      <stat.icon className="w-6 h-6" />
                    </div>
                    <div>
                      <p className="text-[10px] text-zinc-500 uppercase tracking-widest font-bold">{stat.label}</p>
                      <p className="text-zinc-200 font-medium">{stat.value}</p>
                    </div>
                  </motion.button>
                ))}
              </div>
            </motion.div>
          ) : (
            <motion.div
              key="search-header"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 20 }}
              className="mb-12"
            >
              <button 
                onClick={() => loadNews()}
                className="flex items-center gap-2 text-zinc-500 hover:text-emerald-400 transition-colors mb-6 group"
              >
                <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
                <span className="text-xs font-bold uppercase tracking-widest">Back to Global Feed</span>
              </button>
              
              <div className="flex items-center gap-4">
                <div className="p-4 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400">
                  <Building2 className="w-8 h-8" />
                </div>
                <div>
                  <h2 className="text-3xl font-bold text-white tracking-tight">
                    Deep Dive: <span className="gradient-text">{searchQuery}</span>
                  </h2>
                  <p className="text-zinc-500 text-sm mt-1 uppercase tracking-widest font-medium">Comprehensive Intelligence Report</p>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {!isSearching && view === 'feed' && (
          <div className="flex flex-wrap items-center justify-center gap-3 mb-12">
            {categories.map((cat) => (
              <button
                key={cat}
                onClick={() => loadNews(undefined, cat)}
                className={`px-6 py-2 rounded-full text-xs font-bold transition-all ${
                  activeCategory === cat
                    ? 'bg-emerald-500 text-zinc-900 shadow-lg shadow-emerald-500/20'
                    : 'bg-zinc-900 text-zinc-500 hover:bg-zinc-800 hover:text-zinc-300 border border-zinc-800'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>
        )}

        {/* Intelligence Feed */}
        {view === 'feed' && (
          <div className="relative">
            <AnimatePresence mode="wait">
              {loading ? (
                <motion.div
                  key="loading"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="flex flex-col items-center justify-center py-24 gap-4"
                >
                  <RefreshCw className="w-10 h-10 text-emerald-500 animate-spin" />
                  <p className="text-zinc-500 font-mono text-xs tracking-widest uppercase">Syncing with global nodes...</p>
                </motion.div>
              ) : error ? (
                <motion.div
                  key="error"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="flex flex-col items-center justify-center py-24 text-center"
                >
                  <AlertCircle className="w-12 h-12 text-red-500/50 mb-4" />
                  <h3 className="text-xl font-bold text-zinc-200 mb-2">Intelligence Feed Interrupted</h3>
                  <p className="text-zinc-500 mb-6 max-w-sm">{error}</p>
                  <button
                    onClick={() => loadNews()}
                    className="px-8 py-3 bg-zinc-900 border border-zinc-800 rounded-xl text-zinc-300 hover:bg-zinc-800 transition-all font-bold text-sm"
                  >
                    Retry Connection
                  </button>
                </motion.div>
              ) : (news.length === 0 && ceoQuotes.length === 0) ? (
                <motion.div
                  key="empty"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="flex flex-col items-center justify-center py-24 text-center"
                >
                  <SearchX className="w-12 h-12 text-zinc-800 mb-4" />
                  <h3 className="text-xl font-bold text-zinc-200 mb-2">No Intelligence Found</h3>
                  <p className="text-zinc-500 mb-6 max-w-sm">
                    We couldn't find specific updates for "{searchQuery}". Try a broader term or check back later.
                  </p>
                  <button
                    onClick={() => loadNews()}
                    className="px-8 py-3 bg-zinc-900 border border-zinc-800 rounded-xl text-zinc-300 hover:bg-zinc-800 transition-all font-bold text-sm"
                  >
                    Return to Feed
                  </button>
                </motion.div>
              ) : (
                <motion.div
                  key="content"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="space-y-24"
                >
                  {/* CEO Insights Section */}
                  <CEOInsights quotes={ceoQuotes} />

                  {/* News Grid */}
                  <section>
                    <div className="flex items-center gap-3 mb-8">
                      <div className="p-2 rounded-lg bg-emerald-500/10 text-emerald-400">
                        <Zap className="w-5 h-5" />
                      </div>
                      <h2 className="text-2xl font-bold text-white tracking-tight">
                        {isSearching ? `${searchQuery} News & Articles` : 'Latest Advancements'}
                      </h2>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                      {filteredNews.map((item, index) => (
                        <motion.div
                          key={item.id}
                          initial={{ opacity: 0, y: 20 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ delay: index * 0.05 }}
                        >
                          <NewsCard item={item} />
                        </motion.div>
                      ))}
                    </div>
                  </section>

                  {/* Public Usage Section */}
                  <PublicUsage stories={publicUsage} />
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        )}
      </main>

      <ChatBot />

      <footer className="border-t border-zinc-900 py-12 mt-12 bg-zinc-950/50">
        <div className="max-w-7xl mx-auto px-4 text-center">
          <div className="flex items-center justify-center gap-2 mb-4">
            <Zap className="w-4 h-4 text-emerald-500" />
            <span className="text-white font-bold tracking-tighter">AI PULSE</span>
          </div>
          
          <div className="mb-8">
            <p className="text-zinc-400 text-xs font-bold uppercase tracking-widest mb-4">Connect with me here</p>
            <div className="flex items-center justify-center gap-6">
              <a 
                href="https://github.com/AryaPrakash03" 
                target="_blank" 
                rel="noopener noreferrer"
                className="p-3 rounded-xl bg-zinc-900 border border-zinc-800 text-zinc-400 hover:text-emerald-400 hover:border-emerald-500/30 transition-all group"
              >
                <Github className="w-5 h-5 group-hover:scale-110 transition-transform" />
              </a>
              <a 
                href="https://www.linkedin.com/in/arya-prakash-shrivastav/" 
                target="_blank" 
                rel="noopener noreferrer"
                className="p-3 rounded-xl bg-zinc-900 border border-zinc-800 text-zinc-400 hover:text-emerald-400 hover:border-emerald-500/30 transition-all group"
              >
                <Linkedin className="w-5 h-5 group-hover:scale-110 transition-transform" />
              </a>
              <a 
                href="https://x.com/AryaPrakash03" 
                target="_blank" 
                rel="noopener noreferrer"
                className="p-3 rounded-xl bg-zinc-900 border border-zinc-800 text-zinc-400 hover:text-emerald-400 hover:border-emerald-500/30 transition-all group"
              >
                <Twitter className="w-5 h-5 group-hover:scale-110 transition-transform" />
              </a>
            </div>
          </div>

          <p className="text-zinc-600 text-[10px] uppercase tracking-[0.3em]">
            Powered by Arya & Google Search Grounding
          </p>
          <p className="text-zinc-800 text-[8px] mt-8">
            © 2026 Arya Intelligence Network. All rights reserved.
          </p>
        </div>
      </footer>
    </div>
  );
}
