/**
 * 部署环境相关工具函数
 */

/**
 * 获取当前部署环境
 * @returns {string} 当前部署环境的标识符
 */
export function getDeployEnv() {
  if (import.meta.env.VITE_DEPLOY_ENV) {
    return import.meta.env.VITE_DEPLOY_ENV;
  }
  
  // 根据URL判断部署环境
  const url = window.location.href;
  if (url.includes('vercel.app') || url.includes('mqttdatapanel.vercel.app')) {
    return 'VERCEL';
  } else if (url.includes('github.io')) {
    return 'GH_PAGES';
  } else if (url.includes('gitlab.io')) {
    return 'GITLAB';
  }
  
  // 默认返回开发环境
  return 'DEV';
}

/**
 * 检查配置文件是否存在
 * @returns {Promise<boolean>} 配置文件是否存在
 */
export async function checkConfigFile() {
  try {
    const response = await fetch('/KhGCEtTRxy.txt');
    if (response.ok) {
      const configContent = await response.text();
      console.log('配置文件内容:', configContent);
      return configContent.trim() === '87ce29c1ec3940377ceb122ae69d7ac2';
    }
  } catch (error) {
    console.warn('配置文件检查失败:', error);
  }
  return false;
}

/**
 * 记录部署信息
 */
export function logDeployInfo() {
  const env = getDeployEnv();
  const date = new Date().toLocaleString();
  
  console.log(`
  ===============================
  门机数据实时监测系统
  部署环境: ${env}
  启动时间: ${date}
  ===============================
  `);
  
  // 检查配置文件
  checkConfigFile().then(exists => {
    if (exists) {
      console.log('✅ 配置文件验证成功');
    } else {
      console.warn('⚠️ 配置文件验证失败或不存在');
    }
  });
}

/**
 * 根据当前环境获取适当的API基础URL
 * @returns {string} API基础URL
 */
export function getApiBaseUrl() {
  const env = getDeployEnv();
  
  switch (env) {
    case 'GH_PAGES':
      return 'https://api.example.com'; // GitHub Pages环境API地址
    case 'GITLAB':
      return 'https://api.example.com'; // GitLab Pages环境API地址
    case 'VERCEL':
      return 'https://api.example.com'; // Vercel环境API地址
    default:
      return 'http://localhost:3000/api'; // 本地开发环境API地址
  }
}

/**
 * 根据当前环境获取资源基础路径
 * @param {string} path 资源路径
 * @returns {string} 完整的资源路径
 */
export function getAssetUrl(path) {
  const env = getDeployEnv();
  
  if (env === 'GH_PAGES') {
    return `/MqttDataPanel${path.startsWith('/') ? path : '/' + path}`;
  }
  
  return path;
} 