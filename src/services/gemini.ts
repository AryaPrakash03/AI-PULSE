/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { GoogleGenAI, Type, ThinkingLevel } from "@google/genai";
import { NewsResponse } from "../types";

const getApiKey = () => {
  let key = "";

  // 1. Try process.env (standard for AI Studio and Node environments)
  try {
    // @ts-ignore
    if (typeof process !== 'undefined' && process.env && process.env.GEMINI_API_KEY) {
      // @ts-ignore
      key = process.env.GEMINI_API_KEY;
    }
  } catch (e) {}

  // 2. Try Vite-prefixed environment variable
  if (!key && typeof import.meta !== 'undefined' && import.meta.env && import.meta.env.VITE_GEMINI_API_KEY) {
    key = import.meta.env.VITE_GEMINI_API_KEY;
  }

  // 3. Try global variable (sometimes injected by platform)
  // @ts-ignore
  if (!key && typeof GEMINI_API_KEY !== 'undefined') {
    // @ts-ignore
    key = GEMINI_API_KEY;
  }

  // Final check for string "undefined" which can happen with some build tools
  if (key === "undefined" || key === "null") return "";
  
  return key;
};

const apiKey = getApiKey();

// Only initialize if we have an API key to prevent crashes
const ai = apiKey ? new GoogleGenAI({ apiKey }) : null;

export const fetchLatestAINews = async (query: string = "latest AI technology advancements and news", category: string = "All"): Promise<NewsResponse> => {
  try {
    const response = await fetch("/api/news", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ query, category })
    });

    if (!response.ok) {
      const contentType = response.headers.get("content-type");
      let errorMessage = "Failed to fetch news from server";
      
      if (contentType && contentType.includes("application/json")) {
        const errorData = await response.json();
        errorMessage = errorData.error || errorMessage;
      } else {
        const text = await response.text();
        if (text.includes("<title>")) {
          const titleMatch = text.match(/<title>(.*?)<\/title>/);
          errorMessage = titleMatch ? `Server Error: ${titleMatch[1]}` : "Server returned HTML instead of JSON";
        } else {
          errorMessage = text.slice(0, 100) || errorMessage;
        }
      }
      
      throw new Error(errorMessage);
    }

    const contentType = response.headers.get("content-type");
    if (!contentType || !contentType.includes("application/json")) {
      const text = await response.text();
      throw new Error(`Invalid response from server: ${text.slice(0, 100)}...`);
    }

    const data = await response.json();
    
    const generateStableId = (item: any, prefix: string, index: number) => {
      const str = `${item.url || item.title || item.story}-${index}`;
      let hash = 0;
      for (let i = 0; i < str.length; i++) {
        const char = str.charCodeAt(i);
        hash = ((hash << 5) - hash) + char;
        hash = hash & hash; // Convert to 32bit integer
      }
      return `${prefix}-${Math.abs(hash).toString(36)}`;
    };

    data.news = (data.news || []).map((item: any, idx: number) => ({
      ...item,
      id: generateStableId(item, 'news', idx)
    }));
    data.ceoQuotes = (data.ceoQuotes || []).map((item: any, idx: number) => ({
      ...item,
      id: generateStableId(item, 'ceo', idx)
    }));
    data.publicUsage = (data.publicUsage || []).map((item: any, idx: number) => ({
      ...item,
      id: generateStableId(item, 'usage', idx)
    }));
    return data;
  } catch (e: any) {
    console.error("Gemini API Error (Client):", e);
    // Fallback to mock data on any error so the UI doesn't break
    return getMockData(query, category, e.message);
  }
};

const getMockData = (query: string, category: string, errorMessage?: string): NewsResponse => {
  console.log(`Using mock data for: ${query} (${category}). Error: ${errorMessage}`);
  return {
    news: [
      {
        id: 'mock-1',
        title: errorMessage ? `Connection Error: ${errorMessage}` : "Gemini API Connection Required",
        summary: errorMessage 
          ? `The server returned an error: "${errorMessage}". Please check your GEMINI_API_KEY configuration.`
          : "To see real-time intelligence for your search, please ensure a valid Gemini API key is configured in your environment variables.",
        source: "AI Pulse System",
        url: "https://ai.google.dev/",
        date: "System Message",
        category: "System",
        companyName: "AI Pulse",
        companyLogo: "https://upload.wikimedia.org/wikipedia/commons/thumb/8/8a/Google_Gemini_logo.svg/1200px-Google_Gemini_logo.svg.png"
      },
      {
        id: 'mock-2',
        title: "Meta Unveils Llama 4 Training Progress",
        summary: "Mark Zuckerberg confirmed that training for Llama 4 is well underway, utilizing a massive H100 GPU cluster to achieve unprecedented reasoning capabilities.",
        source: "Meta Newsroom",
        url: "https://about.fb.com/news/",
        date: "2 hours ago",
        category: "Industry",
        companyName: "Meta",
        companyLogo: "https://upload.wikimedia.org/wikipedia/commons/thumb/7/7b/Meta_Platforms_Inc._logo.svg/1200px-Meta_Platforms_Inc._logo.svg.png"
      },
      {
        id: 'mock-3',
        title: "Google DeepMind's New Medical AI Breakthrough",
        summary: "A new specialized model from DeepMind has demonstrated the ability to predict protein interactions with 99% accuracy, potentially accelerating drug discovery by years.",
        source: "Google Blog",
        url: "https://blog.google/technology/ai/",
        date: "5 hours ago",
        category: "Research",
        companyName: "Google",
        companyLogo: "https://upload.wikimedia.org/wikipedia/commons/thumb/c/c1/Google_\"G\"_logo.svg/1200px-Google_\"G\"_logo.svg.png"
      }
    ],
    ceoQuotes: [
      {
        id: 'mock-ceo-1',
        ceoName: "AI Pulse Assistant",
        company: "System",
        quote: "We are currently displaying cached intelligence. Connect your Gemini API key to unlock real-time search grounding and global news tracking.",
        context: "System Notification",
        url: "https://ai.google.dev/",
        avatarUrl: "https://upload.wikimedia.org/wikipedia/commons/thumb/8/8a/Google_Gemini_logo.svg/1200px-Google_Gemini_logo.svg.png"
      }
    ],
    publicUsage: [
      {
        id: 'mock-usage-1',
        userField: "System Status",
        story: "The application is running in offline mode. Real-time search grounding is disabled until a valid API key is provided.",
        impact: "Limited search capabilities.",
        example: "Configure GEMINI_API_KEY",
        url: "https://ai.google.dev/"
      }
    ]
  };
};

export const chatWithAI = async (message: string, history: { role: string, parts: { text: string }[] }[]) => {
  try {
    const response = await fetch("/api/chat", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ message, history })
    });

    if (!response.ok) {
      const contentType = response.headers.get("content-type");
      let errorMessage = "Failed to chat with AI server";
      
      if (contentType && contentType.includes("application/json")) {
        const errorData = await response.json();
        errorMessage = errorData.error || errorMessage;
      } else {
        const text = await response.text();
        if (text.includes("<title>")) {
          const titleMatch = text.match(/<title>(.*?)<\/title>/);
          errorMessage = titleMatch ? `Server Error: ${titleMatch[1]}` : "Server returned HTML instead of JSON";
        } else {
          errorMessage = text.slice(0, 100) || errorMessage;
        }
      }
      
      throw new Error(errorMessage);
    }

    const contentType = response.headers.get("content-type");
    if (!contentType || !contentType.includes("application/json")) {
      const text = await response.text();
      throw new Error(`Invalid response from server: ${text.slice(0, 100)}...`);
    }

    const data = await response.json();
    return data.text;
  } catch (e) {
    console.error("Chat Error (Client):", e);
    return "I encountered an error while processing your request. This might be due to an invalid API key or a temporary service interruption.";
  }
};
