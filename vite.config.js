import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import { resolve } from 'path'
import fs from 'fs'

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

// 复制配置文件的插件
const copyConfigFilePlugin = () => {
  return {
    name: 'copy-config-file',
    closeBundle() {
      try {
        // 确保输出目录存在
        if (!fs.existsSync('dist')) {
          fs.mkdirSync('dist', { recursive: true });
        }
        
        // 复制配置文件
        if (fs.existsSync('KhGCEtTRxy.txt')) {
          fs.copyFileSync('KhGCEtTRxy.txt', 'dist/KhGCEtTRxy.txt');
          console.log('✅ 配置文件复制成功');
        } else {
          console.warn('⚠️ 配置文件不存在，跳过复制');
        }
      } catch (error) {
        console.error('❌ 复制配置文件失败:', error);
      }
    }
  };
};

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [
    vue(),
    copyConfigFilePlugin()
  ],
  base: getBaseUrl(),
  server: {
    host: true,
    port: 3000,
    open: true,
    https: true
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