import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    host: '0.0.0.0',
    // 👑 FIX: Agar Cloud Run PORT variable dega (8080), toh yeh use use karega, nahi toh local ke liye 5173
    port: process.env.PORT ? parseInt(process.env.PORT) : 5173,
    strictPort: true,
  },
  preview: {
    host: '0.0.0.0',
    port: process.env.PORT ? parseInt(process.env.PORT) : 8080,
    strictPort: true,
  }
})
