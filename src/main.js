import { createApp } from 'vue'
import ElementPlus from 'element-plus'
import 'element-plus/dist/index.css'
import zhCn from 'element-plus/dist/locale/zh-cn.mjs'
import App from './App.vue'

// 尝试全局引入MQTT.js
let mqtt = null
try {
  // 引入MQTT.js
  import('mqtt').then(module => {
    // 尝试不同的导出形式
    mqtt = module.default || module
    window.mqttLib = mqtt
    console.log('MQTT.js 全局加载成功')
  }).catch(err => {
    console.warn('MQTT.js加载失败:', err)
  })
} catch (e) {
  console.warn('MQTT.js导入错误:', e)
}

// 创建Vue应用实例
const app = createApp(App)

// 使用Element Plus并设置为中文
app.use(ElementPlus, {
  locale: zhCn
})

// 挂载应用
app.mount('#app') 