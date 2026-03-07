import React from 'react';
import { X, Check, Brain, Cpu, Network, Zap, Shield, Globe } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { doc, updateDoc } from 'firebase/firestore';
import { db, handleFirestoreError } from '../firebase';
import { UserProfile } from '../types';

interface PreferencesModalProps {
  isOpen: boolean;
  onClose: () => void;
  userProfile: UserProfile | null;
}

const topics = [
  { id: 'Research', icon: Brain, label: 'AI Research' },
  { id: 'Industry', icon: Cpu, label: 'Industry Updates' },
  { id: 'Policy', icon: Shield, label: 'AI Policy' },
  { id: 'Breakthrough', icon: Zap, label: 'Breakthroughs' },
  { id: 'Robotics', icon: Network, label: 'Robotics' },
  { id: 'LLMs', icon: Globe, label: 'Large Language Models' }
];

export const PreferencesModal: React.FC<PreferencesModalProps> = ({ isOpen, onClose, userProfile }) => {
  const [selectedTopics, setSelectedTopics] = React.useState<string[]>(userProfile?.preferences.followedTopics || ['All']);

  React.useEffect(() => {
    if (userProfile) {
      setSelectedTopics(userProfile.preferences.followedTopics);
    }
  }, [userProfile]);

  const toggleTopic = (topicId: string) => {
    setSelectedTopics(prev => {
      if (topicId === 'All') return ['All'];
      const filtered = prev.filter(t => t !== 'All');
      if (filtered.includes(topicId)) {
        const next = filtered.filter(t => t !== topicId);
        return next.length === 0 ? ['All'] : next;
      }
      return [...filtered, topicId];
    });
  };

  const handleSave = async () => {
    if (!userProfile) return;
    try {
      const userRef = doc(db, 'users', userProfile.uid);
      await updateDoc(userRef, {
        'preferences.followedTopics': selectedTopics
      });
      onClose();
    } catch (error) {
      handleFirestoreError(error, 'update', `users/${userProfile.uid}`);
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="w-full max-w-md bg-zinc-900 border border-zinc-800 rounded-3xl p-8 shadow-2xl"
          >
            <div className="flex items-center justify-between mb-8">
              <div>
                <h2 className="text-2xl font-bold text-white tracking-tight">Personalize Feed</h2>
                <p className="text-zinc-500 text-xs uppercase tracking-widest font-bold mt-1">Select topics of interest</p>
              </div>
              <button onClick={onClose} className="p-2 rounded-xl bg-zinc-800 text-zinc-400 hover:text-white transition-all">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="grid grid-cols-2 gap-3 mb-8">
              <button
                onClick={() => toggleTopic('All')}
                className={`flex items-center gap-3 p-4 rounded-2xl border transition-all text-left ${
                  selectedTopics.includes('All')
                    ? 'bg-emerald-500/10 border-emerald-500/50 text-emerald-400'
                    : 'bg-zinc-800/50 border-zinc-700 text-zinc-500 hover:border-zinc-600'
                }`}
              >
                <Globe className="w-5 h-5" />
                <span className="text-sm font-bold">All Topics</span>
                {selectedTopics.includes('All') && <Check className="w-4 h-4 ml-auto" />}
              </button>
              {topics.map(topic => (
                <button
                  key={topic.id}
                  onClick={() => toggleTopic(topic.id)}
                  className={`flex items-center gap-3 p-4 rounded-2xl border transition-all text-left ${
                    selectedTopics.includes(topic.id)
                      ? 'bg-emerald-500/10 border-emerald-500/50 text-emerald-400'
                      : 'bg-zinc-800/50 border-zinc-700 text-zinc-500 hover:border-zinc-600'
                  }`}
                >
                  <topic.icon className="w-5 h-5" />
                  <span className="text-sm font-bold">{topic.label}</span>
                  {selectedTopics.includes(topic.id) && <Check className="w-4 h-4 ml-auto" />}
                </button>
              ))}
            </div>

            <button
              onClick={handleSave}
              className="w-full py-4 rounded-2xl bg-emerald-500 text-zinc-900 font-bold hover:bg-emerald-400 transition-all shadow-lg shadow-emerald-500/20"
            >
              Save Preferences
            </button>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};
