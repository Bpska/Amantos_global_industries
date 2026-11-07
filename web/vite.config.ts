import react from '@vitejs/plugin-react';
import { defineConfig } from 'vite';

// Standalone PWA Vite Configuration (No backend server required)
export default defineConfig({
  base: process.env.VITE_BASE_PATH || '/',
  plugins: [react()],
  server: {
    port: 5173,
    host: true,
  },
  preview: {
    port: 5173,
    host: true,
  },
});
