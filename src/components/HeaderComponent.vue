<template>
  <div class="top-header">
    <div class="center-section">
      <img v-if="logoSrc" :src="logoSrc" alt="Logo" class="header-logo" />
      <div class="title-container">
        <div class="title">天狼星门机</div>
        <div class="subtitle" style="display: none;">美的先行研究中心</div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'

// 接收属性
const props = defineProps({
  logoSrc: String,
  batteryLevel: Number
})

// 时间
const currentTime = ref('')

// 天气相关
const city = ref('上海')
const temperature = ref('16°C')
const weatherCondition = ref('晴')
const weatherIcon = ref('☀️') // 默认天气图标

// 获取天气数据
const fetchWeatherData = async () => {
  try {
    // 使用中国气象局公开数据接口
    const url = 'http://www.nmc.cn/rest/weather?stationid=58362' // 上海站ID
    
    const response = await fetch(url)
    const data = await response.json()
    
    if (data && data.data) {
      const weatherData = data.data
      city.value = '上海'
      temperature.value = `${weatherData.weather.temperature}°C`
      weatherCondition.value = weatherData.weather.info
      
      // 根据天气状况设置对应的图标
      const weatherInfo = weatherData.weather.info.toLowerCase()
      if (weatherInfo.includes('晴')) {
        weatherIcon.value = '☀️'
      } else if (weatherInfo.includes('多云')) {
        weatherIcon.value = '⛅'
      } else if (weatherInfo.includes('阴')) {
        weatherIcon.value = '☁️'
      } else if (weatherInfo.includes('雨')) {
        weatherIcon.value = '🌧️'
      } else if (weatherInfo.includes('雪')) {
        weatherIcon.value = '❄️'
      } else if (weatherInfo.includes('雾') || weatherInfo.includes('霾')) {
        weatherIcon.value = '🌫️'
      } else if (weatherInfo.includes('雷')) {
        weatherIcon.value = '⛈️'
      } else {
        weatherIcon.value = '☀️'
      }
    }
  } catch (error) {
    console.error('获取天气数据失败:', error)
    // 使用默认值
    city.value = '上海'
    temperature.value = '16°C'
    weatherCondition.value = '晴'
    weatherIcon.value = '☀️'
  }
}

// 更新时间
const updateTime = () => {
  const now = new Date()
  const hours = now.getHours().toString().padStart(2, '0')
  const minutes = now.getMinutes().toString().padStart(2, '0')
  const seconds = now.getSeconds().toString().padStart(2, '0')
  currentTime.value = `${hours}:${minutes}:${seconds}`
}

// 导出当前时间，供父组件使用
defineExpose({
  currentTime,
  updateTime
})

onMounted(() => {
  // 启动时间更新
  updateTime()
  setInterval(updateTime, 1000)
  
  // 获取天气数据
  fetchWeatherData()
  // 每30分钟更新一次天气数据
  setInterval(fetchWeatherData, 30 * 60 * 1000)
})
</script>

<style scoped>
/* 顶部标题 */
.top-header {
  background-color: #061b4f;
  display: flex;
  justify-content: center;
  align-items: center;
  padding: 8px 15px;
  height: 48px;
  position: sticky;
  top: 0;
  z-index: 10;
  width: 100%;
  overflow: hidden;
  box-sizing: border-box;
}

.center-section {
  display: flex;
  align-items: center;
  justify-content: center;
  flex-grow: 1;
  position: relative;
  max-width: 400px;
}

.header-logo {
  height: 28px;
  width: auto;
  margin-right: 10px;
}

.title-container {
  display: flex;
  flex-direction: column;
  align-items: center;
}

.title {
  font-size: 22px;
  font-weight: bold;
  text-align: center;
  color: #ffffff;
  white-space: nowrap;
}

.subtitle {
  font-size: 12px;
  color: #a0aee0;
  text-align: center;
  margin-top: 2px;
}
</style>