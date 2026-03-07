/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { GoogleGenAI, Type, ThinkingLevel } from "@google/genai";
import { NewsResponse } from "../types";

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

export const fetchLatestAINews = async (query: string = "latest AI technology advancements and news", category: string = "All"): Promise<NewsResponse> => {
  const model = "gemini-3-flash-preview";
  const today = new Date().toISOString().split('T')[0];
  
  const prompt = `Fetch the most recent and relevant AI intelligence for ${today}.
  SEARCH QUERY: ${query}
  CATEGORY FOCUS: ${category}
  
  INSTRUCTIONS:
  1. Use Google Search to find the absolute latest updates (last 24-48 hours).
  2. If the search query is specific (e.g., "Neural Networks"), prioritize those results.
  3. CRITICAL: If you cannot find enough specific results for the exact query, DO NOT return empty arrays. Instead, provide the most relevant high-quality AI news and insights that are broadly related to the topic or category.
  4. Ensure 'news' has at least 6 items, 'ceoQuotes' has 3, and 'publicUsage' has 3.
  
  DATA REQUIREMENTS:
  - 'news': [{title, summary, source, url, date, category, companyName, companyLogo}]
  - 'ceoQuotes': [{ceoName, company, quote, context, avatarUrl}]
  - 'publicUsage': [{userField, story, impact, example}]`;

  const response = await ai.models.generateContent({
    model,
    contents: [{ parts: [{ text: prompt }] }],
    config: {
      tools: [{ googleSearch: {} }],
      responseMimeType: "application/json",
      thinkingConfig: { thinkingLevel: ThinkingLevel.LOW },
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
                avatarUrl: { type: Type.STRING }
              },
              required: ['ceoName', 'company', 'quote', 'context']
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
                example: { type: Type.STRING }
              },
              required: ['userField', 'story', 'impact', 'example']
            }
          }
        },
        required: ['news', 'ceoQuotes', 'publicUsage']
      }
    }
  });

  try {
    const text = response.text || '';
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    const cleanJson = jsonMatch ? jsonMatch[0] : text;
    const data = JSON.parse(cleanJson || '{"news": [], "ceoQuotes": [], "publicUsage": []}');
    
    data.news = (data.news || []).map((item: any, index: number) => ({
      ...item,
      id: `news-${Date.now()}-${index}`
    }));
    data.ceoQuotes = (data.ceoQuotes || []).map((item: any, index: number) => ({
      ...item,
      id: `ceo-${Date.now()}-${index}`
    }));
    data.publicUsage = (data.publicUsage || []).map((item: any, index: number) => ({
      ...item,
      id: `usage-${Date.now()}-${index}`
    }));
    return data;
  } catch (e) {
    return { news: [], ceoQuotes: [], publicUsage: [] };
  }
};

export const chatWithAI = async (message: string, history: { role: string, parts: { text: string }[] }[]) => {
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
};
