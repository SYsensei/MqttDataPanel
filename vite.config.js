import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import { resolve } from 'path'

// 根据环境变量决定基础路径
function getBaseUrl() {
  // 尝试从环境变量中识别当前部署环境
  if (process.env.DEPLOY_ENV === 'GH_PAGES') {
    return '/MqttDataPanel/';
  } else if (process.env.DEPLOY_ENV === 'VERCEL') {
    return '/';
  } else if (process.env.DEPLOY_ENV === 'GITLAB') {
    return './';
  }
  // 默认使用相对路径（适用于本地开发和GitLab）
  return './';
}

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [vue()],
  base: getBaseUrl(),
  server: {
    host: true,
    port: 3000,
    open: true
  },
  resolve: {
    alias: {
      '@': resolve(__dirname, './src')
    }
  },
  build: {
    outDir: 'dist',
    assetsDir: 'assets',
    // 确保图片资源被正确复制
    assetsInlineLimit: 0
  }
}) 