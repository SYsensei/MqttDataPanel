import { createApp } from 'vue'
import App from './App.vue'
import ElementPlus from 'element-plus'
import 'element-plus/dist/index.css'
import { getDeployEnv } from './utils/deploy-env'

// 创建全局CSS变量
const style = document.createElement('style')
style.textContent = `
  :root {
    --color-primary: #3b82f6;
    --color-background: #020617;
    --color-text: #e2e8f0;
  }
  body {
    background-color: var(--color-background);
    color: var(--color-text);
    margin: 0;
  }
`
document.head.appendChild(style)

// 创建Vue应用
const app = createApp(App)

// 使用ElementPlus组件库
app.use(ElementPlus)

// 输出当前部署环境
const deployEnv = getDeployEnv()
console.log(`当前部署环境: ${deployEnv}`)

// 挂载应用
app.mount('#app')

// 调试信息
console.log('Vue应用已加载完成') 