import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import { resolve } from 'path'

// GitHub Pages专用配置
export default defineConfig({
  plugins: [vue()],
  base: '/MqttDataPanel/', // GitHub Pages需要项目名作为路径前缀
  resolve: {
    alias: {
      '@': resolve(__dirname, './src')
    }
  },
  build: {
    outDir: 'dist',
    assetsDir: 'assets',
    assetsInlineLimit: 0
  }
}) 