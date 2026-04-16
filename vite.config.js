import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  server: {
    host: true,
    port: 5173,
    // السماح لنطاقات ngrok و loca.lt و localhost
    allowedHosts: ['.ngrok-free.dev', '.loca.lt', 'localhost', '127.0.0.1'],
    cors: true,
    proxy: {
      '/api': {
        target: 'http://127.0.0.1:8000',
        changeOrigin: true,
        secure: false,
      },
    },
    // HMR عبر ngrok: لا تجعل Vite يحاول الاستماع على عنوان خارجي
    hmr: {
      protocol: 'wss',
      clientPort: 443
    }
  },
})
