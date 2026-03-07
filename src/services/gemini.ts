/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { GoogleGenAI, Type, ThinkingLevel } from "@google/genai";
import { NewsResponse } from "../types";

const getApiKey = () => {
  console.log("Attempting to retrieve API Key...");
  
  // 1. Try Vite-prefixed environment variable (standard for Vercel/Vite client-side)
  if (typeof import.meta !== 'undefined' && import.meta.env && import.meta.env.VITE_GEMINI_API_KEY) {
    console.log("API Key found in import.meta.env.VITE_GEMINI_API_KEY");
    return import.meta.env.VITE_GEMINI_API_KEY;
  }

  // 2. Try process.env (standard for AI Studio and Node environments)
  try {
    if (typeof process !== 'undefined' && process.env && process.env.GEMINI_API_KEY) {
      console.log("API Key found in process.env.GEMINI_API_KEY");
      return process.env.GEMINI_API_KEY;
    }
  } catch (e) {
    // Ignore
  }

  // 3. Fallback to a global variable
  // @ts-ignore
  if (typeof GEMINI_API_KEY !== 'undefined') {
    console.log("API Key found in global GEMINI_API_KEY");
    // @ts-ignore
    return GEMINI_API_KEY;
  }

  console.warn("No Gemini API Key found in any environment variable.");
  return "";
};

const apiKey = getApiKey();

// Only initialize if we have an API key to prevent crashes
const ai = apiKey ? new GoogleGenAI({ apiKey }) : null;

export const fetchLatestAINews = async (query: string = "latest AI technology advancements and news", category: string = "All"): Promise<NewsResponse> => {
  if (!ai) {
    console.error("Gemini API Key is missing. Please set VITE_GEMINI_API_KEY or GEMINI_API_KEY.");
    return getMockData(query, category);
  }
  
  try {
    const model = "gemini-3-flash-preview";
    const today = new Date().toISOString().split('T')[0];
    
    const prompt = `Fetch the most recent and relevant news for ${today}.
    SEARCH QUERY: ${query}
    CATEGORY FOCUS: ${category}
    
    INSTRUCTIONS:
    1. Use Google Search to find the absolute latest updates (last 24-48 hours).
    2. CRITICAL: If a specific SEARCH QUERY is provided (e.g., "PAYTM", "Neural Networks"), ALL returned items MUST be directly related to that query. 
    3. DO NOT return general AI news if the user searched for a specific company or topic. If no news is found for that specific query, return empty arrays for 'news', 'ceoQuotes', and 'publicUsage'.
    4. URL QUALITY REQUIREMENT: Every 'url' MUST be a direct, absolute HTTPS link to the specific article, specific quote source, or specific case study page. 
       - DO NOT use homepages (e.g., avoid "https://openai.com").
       - DO NOT use placeholders.
       - For 'publicUsage', the URL must lead to a page describing that specific implementation or success story.
    5. Ensure 'news' has up to 6 items, 'ceoQuotes' has up to 3, and 'publicUsage' has up to 3.
    
    DATA REQUIREMENTS:
    - 'news': [{title, summary, source, url, date, category, companyName, companyLogo}]
    - 'ceoQuotes': [{ceoName, company, quote, context, url, avatarUrl}]
    - 'publicUsage': [{userField, story, impact, example, url}]`;

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
        id: 'mock-2',
        title: "Google DeepMind's New Medical AI Breakthrough",
        summary: "A new specialized model from DeepMind has demonstrated the ability to predict protein interactions with 99% accuracy, potentially accelerating drug discovery by years.",
        source: "Google Blog",
        url: "https://blog.google/technology/ai/",
        date: "5 hours ago",
        category: "Research",
        companyName: "Google",
        companyLogo: "https://upload.wikimedia.org/wikipedia/commons/thumb/c/c1/Google_\"G\"_logo.svg/1200px-Google_\"G\"_logo.svg.png"
      },
      {
        id: 'mock-3',
        title: "OpenAI Announces 'Strawberry' Reasoning Model",
        summary: "The latest update to ChatGPT focuses on complex multi-step reasoning, allowing the AI to solve advanced math and coding problems with human-like logic.",
        source: "OpenAI Blog",
        url: "https://openai.com/news/",
        date: "8 hours ago",
        category: "Breakthrough",
        companyName: "OpenAI",
        companyLogo: "https://upload.wikimedia.org/wikipedia/commons/thumb/4/4d/OpenAI_Logo.svg/1200px-OpenAI_Logo.svg.png"
      },
      {
        id: 'mock-4',
        title: "NVIDIA Blackwell Chips Enter Full Production",
        summary: "Demand for the new Blackwell architecture has exceeded all expectations, with major cloud providers securing the first batch of units for 2025 deployments.",
        source: "NVIDIA News",
        url: "https://nvidianews.nvidia.com/",
        date: "12 hours ago",
        category: "Industry",
        companyName: "NVIDIA",
        companyLogo: "https://upload.wikimedia.org/wikipedia/commons/thumb/2/21/Nvidia_logo.svg/1200px-Nvidia_logo.svg.png"
      },
      {
        id: 'mock-5',
        title: "EU AI Act Implementation Timeline Clarified",
        summary: "Regulators have provided a detailed roadmap for companies to comply with the new AI safety standards, focusing on high-risk foundation models.",
        source: "Reuters",
        url: "https://www.reuters.com/technology/",
        date: "1 day ago",
        category: "Policy",
        companyName: "European Union",
        companyLogo: "https://upload.wikimedia.org/wikipedia/commons/thumb/b/b7/Flag_of_Europe.svg/1200px-Flag_of_Europe.svg.png"
      },
      {
        id: 'mock-6',
        title: "Apple Intelligence Rolls Out Globally",
        summary: "The latest iOS update brings advanced on-device AI features to millions of users, prioritizing privacy while enhancing daily productivity tasks.",
        source: "Apple Newsroom",
        url: "https://www.apple.com/newsroom/",
        date: "1 day ago",
        category: "Industry",
        companyName: "Apple",
        companyLogo: "https://upload.wikimedia.org/wikipedia/commons/thumb/f/fa/Apple_logo_black.svg/1200px-Apple_logo_black.svg.png"
      }
    ],
    ceoQuotes: [
      {
        id: 'mock-ceo-1',
        ceoName: "Sam Altman",
        company: "OpenAI",
        quote: "The future of AI is not just about scale, but about deep reasoning and the ability to solve problems that were previously thought impossible.",
        context: "Speaking at the Global AI Summit",
        url: "https://openai.com/index/openai-o1-preview-announcement/",
        avatarUrl: "https://upload.wikimedia.org/wikipedia/commons/thumb/d/d4/Sam_Altman_at_TechCrunch_Disrupt_2023_%28cropped%29.jpg/1200px-Sam_Altman_at_TechCrunch_Disrupt_2023_%28cropped%29.jpg"
      },
      {
        id: 'mock-ceo-2',
        ceoName: "Jensen Huang",
        company: "NVIDIA",
        quote: "We are at the beginning of a new industrial revolution. AI is the engine, and data is the fuel that will power the next century of growth.",
        context: "Keynote at GTC 2024",
        url: "https://nvidianews.nvidia.com/news/gtc-2024-keynote-blackwell",
        avatarUrl: "https://upload.wikimedia.org/wikipedia/commons/thumb/c/c4/Jensen_Huang_%28cropped%29.jpg/1200px-Jensen_Huang_%28cropped%29.jpg"
      },
      {
        id: 'mock-ceo-3',
        ceoName: "Satya Nadella",
        company: "Microsoft",
        quote: "Our goal is to democratize AI, making it a tool that empowers every person and every organization on the planet to achieve more.",
        context: "Microsoft Build 2024",
        url: "https://news.microsoft.com/build-2024/",
        avatarUrl: "https://upload.wikimedia.org/wikipedia/commons/thumb/7/78/MS-Build_2019-Satya_Nadella.jpg/1200px-MS-Build_2019-Satya_Nadella.jpg"
      }
    ],
    publicUsage: [
      {
        id: 'mock-usage-1',
        userField: "Healthcare",
        story: "Radiologists are using AI-powered imaging tools to detect early-stage cancers with 30% higher accuracy than traditional methods.",
        impact: "Saved thousands of lives through early detection.",
        example: "Mayo Clinic's AI integration",
        url: "https://newsnetwork.mayoclinic.org/discussion/mayo-clinic-advances-ai-in-healthcare/"
      },
      {
        id: 'mock-usage-2',
        userField: "Education",
        story: "Personalized AI tutors are helping students in rural areas master complex subjects like calculus and physics at their own pace.",
        impact: "Bridging the educational gap in underserved communities.",
        example: "Khan Academy's Khanmigo",
        url: "https://blog.khanacademy.org/khanmigo-ai-tutor/"
      },
      {
        id: 'mock-usage-3',
        userField: "Software Engineering",
        story: "Developers are reporting a 50% increase in productivity by using AI pair programmers to handle boilerplate code and documentation.",
        impact: "Accelerated software delivery cycles globally.",
        example: "GitHub Copilot Enterprise",
        url: "https://github.blog/2024-02-27-github-copilot-enterprise-is-now-generally-available/"
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
