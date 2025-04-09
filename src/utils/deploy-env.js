/**
 * 检测当前部署环境
 * @returns {string} 当前环境标识：'github', 'gitlab', 'vercel', 'local'
 */
export function getDeployEnv() {
  const url = window.location.href;
  
  if (url.includes('github.io')) {
    return 'github';
  }
  
  if (url.includes('gitlab.io') || url.includes('gitcode.net')) {
    return 'gitlab';
  }
  
  if (url.includes('vercel.app')) {
    return 'vercel';
  }
  
  return 'local';
}

/**
 * 根据当前环境获取适当的API基础URL
 * @returns {string} API基础URL
 */
export function getApiBaseUrl() {
  const env = getDeployEnv();
  
  switch (env) {
    case 'github':
      return 'https://api.example.com'; // GitHub Pages环境API地址
    case 'gitlab':
      return 'https://api.example.com'; // GitLab Pages环境API地址
    case 'vercel':
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
  
  if (env === 'github') {
    return `/MqttDataPanel${path.startsWith('/') ? path : '/' + path}`;
  }
  
  return path;
} 