import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import {defineConfig} from 'vite';

export default defineConfig({
  plugins: [react(), tailwindcss()],
  define: {
    'process.env.GEMINI_API_KEY': JSON.stringify(process.env.GEMINI_API_KEY),
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, '.'),
    },
  },
  server: {
    port: 3000,
    host: '0.0.0.0',
    // HMR is disabled in AI Studio via DISABLE_HMR env var.
    hmr: typeof process !== 'undefined' ? process.env.DISABLE_HMR !== 'true' : true,
  },
});
