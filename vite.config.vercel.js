import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import { resolve } from 'path'

// Vercel专用配置
export default defineConfig({
  plugins: [vue()],
  base: '/', // Vercel使用根路径
  resolve: {
    alias: {
      '@': resolve(__dirname, './src')
    }
  },
  build: {
    outDir: 'dist',
    assetsDir: 'assets',
    assetsInlineLimit: 0,
    // Vercel优化
    rollupOptions: {
      output: {
        manualChunks: {
          vendor: ['vue', 'element-plus'],
          mqtt: ['mqtt']
        }
      }
    }
  }
}) 