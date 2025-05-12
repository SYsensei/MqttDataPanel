import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import { resolve } from 'path'
import fs from 'fs'

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
          console.log('✅ 配置文件复制成功 (Vercel环境)');
        } else {
          console.warn('⚠️ 配置文件不存在，跳过复制');
        }
      } catch (error) {
        console.error('❌ 复制配置文件失败:', error);
      }
    }
  };
};

// Vercel专用配置
export default defineConfig({
  plugins: [
    vue(),
    copyConfigFilePlugin()
  ],
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