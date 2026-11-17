import { fileURLToPath, URL } from 'node:url'
import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'

export default defineConfig({
  plugins: [vue()],
  resolve: {
    alias: { '@': fileURLToPath(new URL('./src', import.meta.url)) },
  },
  server: {
    port: 5180,
    proxy: {
      // 后期接后端时，把 /api 代理到网关
      '/api': { target: 'http://127.0.0.1:8081', changeOrigin: true },
    },
  },
})
