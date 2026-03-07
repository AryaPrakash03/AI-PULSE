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
  if (!ai) {
    console.warn("Gemini API Key is missing. Falling back to mock data.");
    return getMockData(query, category);
  }
  
  try {
    const model = "gemini-3-flash-preview";
    const today = new Date().toISOString().split('T')[0];
    
    const prompt = `CRITICAL: You MUST use the Google Search tool to find the most recent news for the query below.
    
    CURRENT DATE: ${today}
    SEARCH QUERY: ${query}
    CATEGORY: ${category}
    
    INSTRUCTIONS:
    1. Perform a fresh Google Search for "${query} latest news ${today}".
    2. Focus on news from the last 24-48 hours.
    3. If the query is a company (like Paytm, PhonePe, etc.), find their latest business updates, AI initiatives, or regulatory news.
    4. DO NOT use your internal knowledge if it's older than 24 hours. Use the search results.
    5. If no news is found for the specific query, find the most recent general tech/AI news from today.
    6. Return the data in the requested JSON format.
    
    DATA STRUCTURE:
    - 'news': [{title, summary, source, url, date, category, companyName, companyLogo}]
    - 'ceoQuotes': [{ceoName, company, quote, context, url, avatarUrl}]
    - 'publicUsage': [{userField, story, impact, example, url}]`;

    const response = await ai.models.generateContent({
      model,
      contents: [{ parts: [{ text: prompt }] }],
      config: {
        systemInstruction: "You are an expert AI news researcher. You MUST use the Google Search tool for every request to find real-time news. Never hallucinate or use old training data for news queries.",
        tools: [{ googleSearch: {} }],
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            news: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  title: { type: Type.STRING },
                  summary: { type: Type.STRING },
                  source: { type: Type.STRING },
                  url: { type: Type.STRING },
                  date: { type: Type.STRING },
                  category: { type: Type.STRING },
                  companyName: { type: Type.STRING },
                  companyLogo: { type: Type.STRING }
                },
                required: ['title', 'summary', 'source', 'url', 'date', 'category']
              }
            },
            ceoQuotes: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  ceoName: { type: Type.STRING },
                  company: { type: Type.STRING },
                  quote: { type: Type.STRING },
                  context: { type: Type.STRING },
                  url: { type: Type.STRING },
                  avatarUrl: { type: Type.STRING }
                },
                required: ['ceoName', 'company', 'quote', 'context', 'url']
              }
            },
            publicUsage: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  userField: { type: Type.STRING },
                  story: { type: Type.STRING },
                  impact: { type: Type.STRING },
                  example: { type: Type.STRING },
                  url: { type: Type.STRING }
                },
                required: ['userField', 'story', 'impact', 'example', 'url']
              }
            }
          },
          required: ['news', 'ceoQuotes', 'publicUsage']
        }
      }
    });

    const text = response.text || '';
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    const cleanJson = jsonMatch ? jsonMatch[0] : text;
    const data = JSON.parse(cleanJson || '{"news": [], "ceoQuotes": [], "publicUsage": []}');
    
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
  } catch (e) {
    console.error("Gemini API Error:", e);
    // Fallback to mock data on any error so the UI doesn't break
    return getMockData(query, category);
  }
};

const getMockData = (query: string, category: string): NewsResponse => {
  console.log(`Using mock data for: ${query} (${category})`);
  return {
    news: [
      {
        id: 'mock-1',
        title: "Gemini API Connection Required",
        summary: "To see real-time intelligence for your search, please ensure a valid Gemini API key is configured in your environment variables.",
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
  if (!ai) {
    return "I'm sorry, but I'm unable to connect to the AI service right now. Please check the API configuration.";
  }
  
  try {
    const model = "gemini-3-flash-preview";
    const chat = ai.chats.create({
      model,
      config: {
        systemInstruction: "You are PulseBot, an AI news assistant for AI Pulse. You help users understand the latest AI advancements, explain technical concepts, and provide insights into tech companies. Be concise, professional, and helpful. Use the context of the latest AI news if possible.",
      },
      history: history
    });

    const response = await chat.sendMessage({ message });
    return response.text;
  } catch (e) {
    console.error("Chat Error:", e);
    return "I encountered an error while processing your request. This might be due to an invalid API key or a temporary service interruption.";
  }
};
