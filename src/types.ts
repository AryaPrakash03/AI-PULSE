/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export interface NewsItem {
  id: string;
  title: string;
  summary: string;
  source: string;
  url: string;
  date: string;
  category: 'Research' | 'Industry' | 'Policy' | 'Breakthrough' | 'General';
  companyLogo?: string;
  companyName?: string;
}

export interface UserPreferences {
  followedTopics: string[];
  theme: 'dark' | 'light';
}

export interface UserProfile {
  uid: string;
  email: string;
  displayName: string | null;
  photoURL: string | null;
  preferences: UserPreferences;
  createdAt: string;
}

export interface Bookmark extends NewsItem {
  userId: string;
  newsId: string;
  bookmarkedAt: string;
}

export interface CEOQuote {
  id: string;
  ceoName: string;
  company: string;
  quote: string;
  context: string;
  url: string;
  avatarUrl?: string;
}

export interface PublicUsageStory {
  id: string;
  userField: string;
  story: string;
  impact: string;
  example: string;
  url: string;
}

export interface NewsResponse {
  news: NewsItem[];
  ceoQuotes: CEOQuote[];
  publicUsage: PublicUsageStory[];
}
