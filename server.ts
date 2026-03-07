import express from "express";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI, Type } from "@google/genai";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json());

  // Gemini Setup
  const apiKey = process.env.GEMINI_API_KEY;
  const ai = apiKey ? new GoogleGenAI({ apiKey }) : null;

  // API Routes
  app.get("/api/health", (req, res) => {
    res.json({ 
      status: "ok", 
      hasApiKey: !!process.env.GEMINI_API_KEY,
      env: process.env.NODE_ENV
    });
  });

  app.post("/api/news", async (req, res) => {
    const { query = "latest AI technology advancements and news", category = "All" } = req.body;

    if (!ai) {
      return res.status(503).json({ error: "Gemini API Key is missing on server." });
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
      
      res.json(data);
    } catch (e: any) {
      console.error("Gemini API Error:", e);
      res.status(500).json({ error: e.message || "Internal Server Error" });
    }
  });

  app.post("/api/chat", async (req, res) => {
    const { message, history } = req.body;

    if (!ai) {
      return res.status(503).json({ error: "Gemini API Key is missing on server." });
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
      res.json({ text: response.text });
    } catch (e: any) {
      console.error("Chat Error:", e);
      res.status(500).json({ error: e.message || "Internal Server Error" });
    }
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    // Serve static files in production
    app.use(express.static(path.join(__dirname, "dist")));
    app.get("*", (req, res) => {
      res.sendFile(path.join(__dirname, "dist", "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
