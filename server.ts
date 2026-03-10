import express from "express";
import { createServer as createViteServer } from "vite";
import path from "path";
import { fileURLToPath } from "url";
import dotenv from "dotenv";
import fs from "fs";

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
app.use(express.json());

// API Routes
app.get("/api/health", (req, res) => {
  res.json({ 
    status: "ok", 
    env: process.env.NODE_ENV,
    isVercel: !!process.env.VERCEL
  });
});

// Middleware and Static Files
async function startServer() {
  console.log("Starting server process...");
  const isProduction = process.env.NODE_ENV === "production" || !!process.env.VERCEL;
  console.log(`Environment: ${process.env.NODE_ENV}, isProduction: ${isProduction}`);
  
  if (!isProduction) {
    console.log("Initializing Vite dev server...");
    try {
      const vite = await createViteServer({
        server: { middlewareMode: true },
        appType: "spa",
      });
      app.use(vite.middlewares);
      console.log("Vite middleware attached.");
    } catch (e) {
      console.error("Failed to initialize Vite server:", e);
    }
  } else if (!process.env.VERCEL) {
    const distPath = path.join(__dirname, "dist");
    if (fs.existsSync(distPath)) {
      app.use(express.static(distPath));
      app.get("*", (req, res) => {
        res.sendFile(path.join(distPath, "index.html"));
      });
    } else {
      console.warn("Dist folder not found. Static files will not be served.");
    }
  }

  // Listen if not on Vercel
  if (!process.env.VERCEL) {
    const PORT = 3000;
    app.listen(PORT, "0.0.0.0", () => {
      console.log(`>>> Server is now listening on http://0.0.0.0:${PORT}`);
      console.log(`>>> Health check: http://localhost:${PORT}/api/health`);
    });
  }
}

startServer();

export default app;
