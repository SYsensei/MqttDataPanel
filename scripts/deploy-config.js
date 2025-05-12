/**
 * 配置文件部署脚本
 * 在构建前复制配置文件到相应位置
 */

const fs = require('fs');
const path = require('path');

// 配置文件源路径和目标路径
const CONFIG_FILE = 'KhGCEtTRxy.txt';
const CONFIG_CONTENT = '87ce29c1ec3940377ceb122ae69d7ac2';

// 确保配置文件存在
function ensureConfigFile() {
  console.log('检查配置文件...');
  
  // 检查配置文件是否存在
  if (fs.existsSync(CONFIG_FILE)) {
    console.log('✅ 配置文件已存在');
    return;
  }
  
  // 创建配置文件
  try {
    fs.writeFileSync(CONFIG_FILE, CONFIG_CONTENT);
    console.log('✅ 配置文件已创建');
  } catch (error) {
    console.error('❌ 创建配置文件失败:', error);
    process.exit(1);
  }
}

// 确保输出目录中有配置文件
function ensureConfigInDist() {
  console.log('检查输出目录中的配置文件...');
  
  // 检查输出目录是否存在
  if (!fs.existsSync('dist')) {
    console.log('⚠️ 输出目录不存在，跳过检查');
    return;
  }
  
  // 检查输出目录中的配置文件
  if (fs.existsSync(path.join('dist', CONFIG_FILE))) {
    console.log('✅ 输出目录中已有配置文件');
    return;
  }
  
  // 复制配置文件到输出目录
  try {
    if (fs.existsSync(CONFIG_FILE)) {
      fs.copyFileSync(CONFIG_FILE, path.join('dist', CONFIG_FILE));
      console.log('✅ 配置文件已复制到输出目录');
    } else {
      fs.writeFileSync(path.join('dist', CONFIG_FILE), CONFIG_CONTENT);
      console.log('✅ 配置文件已创建在输出目录');
    }
  } catch (error) {
    console.error('❌ 处理输出目录中的配置文件失败:', error);
  }
}

// 主函数
function main() {
  console.log('=== 配置文件部署脚本 ===');
  ensureConfigFile();
  ensureConfigInDist();
  console.log('=== 配置文件部署完成 ===');
}

// 执行主函数
main();