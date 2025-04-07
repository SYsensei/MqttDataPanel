<template>
  <div class="top-header">
    <div class="center-section">
      <img v-if="logoSrc" :src="logoSrc" alt="Logo" class="header-logo" />
      <div class="title-container">
        <div class="title">天狼星AI门机</div>
        <div class="subtitle" style="display: none;">美的先行研究中心</div>
      </div>
    </div>
    <div class="header-weather-time">
      <div class="left-section">
        <div class="time">{{ currentTime }}</div>
      </div>
      <div class="right-section">
        <div class="weather">
          <div class="weather-icon">{{ weatherIcon }}</div>
          <div class="temp-info">
            <span class="temperature">{{ temperature }}</span>
            <div class="city-info">{{ city }} {{ weatherCondition }}</div>
          </div>
        </div>
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
    // 使用高德地图天气API
    // 注意：在实际项目中应替换为自己的API密钥
    const key = 'a29f01a895a7f575d9859f0572e5d0ba'
    const cityCode = '310000' // 上海市的城市编码
    const url = `https://restapi.amap.com/v3/weather/weatherInfo?city=${cityCode}&key=${key}&extensions=base`
    
    const response = await fetch(url)
    const data = await response.json()
    
    if (data.status === '1' && data.lives && data.lives.length > 0) {
      const weatherData = data.lives[0]
      city.value = weatherData.city
      temperature.value = `${weatherData.temperature}°C`
      weatherCondition.value = weatherData.weather
      
      // 根据天气状况设置对应的图标
      if (weatherData.weather.includes('晴')) {
        weatherIcon.value = '☀️'
      } else if (weatherData.weather.includes('多云')) {
        weatherIcon.value = '⛅'
      } else if (weatherData.weather.includes('阴')) {
        weatherIcon.value = '☁️'
      } else if (weatherData.weather.includes('雨')) {
        weatherIcon.value = '🌧️'
      } else if (weatherData.weather.includes('雪')) {
        weatherIcon.value = '❄️'
      } else if (weatherData.weather.includes('雾') || weatherData.weather.includes('霾')) {
        weatherIcon.value = '🌫️'
      } else if (weatherData.weather.includes('风')) {
        weatherIcon.value = '🌬️'
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
  justify-content: space-between;
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

.left-section {
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  justify-content: center;
  min-width: 80px;
}

.time {
  font-size: 16px;
  color: #ffffff;
  font-weight: bold;
}

.center-section {
  display: flex;
  align-items: center;
  justify-content: center;
  flex-grow: 1;
  padding: 0 15px;
  position: relative;
}

.header-logo {
  height: 28px;
  width: auto;
  position: absolute;
  left: calc(50% - 110px);
  top: 50%;
  transform: translateY(-50%);
}

.title-container {
  display: flex;
  flex-direction: column;
  align-items: center;
  position: absolute;
  left: 50%;
  transform: translateX(-50%);
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

.right-section {
  display: flex;
  align-items: center;
  gap: 12px;
  min-width: 80px;
}

.weather {
  display: flex;
  align-items: center;
  gap: 5px;
  max-width: 110px;
  overflow: hidden;
}

.weather-icon {
  font-size: 20px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.temp-info {
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  min-width: 0;
  overflow: hidden;
}

.temperature {
  font-size: 16px;
  color: #ffffff;
  font-weight: bold;
  white-space: nowrap;
}

.city-info {
  font-size: 10px;
  color: #ffffff;
  white-space: nowrap;
  text-overflow: ellipsis;
  overflow: hidden;
  max-width: 100%;
}

.header-weather-time {
  display: flex;
  justify-content: space-between;
  align-items: center;
  position: absolute;
  right: 15px;
  top: 50%;
  transform: translateY(-50%);
}

/* 媒体查询适配小屏幕 */
@media (max-width: 576px) {
  .top-header {
    flex-wrap: wrap;
    height: auto;
    padding: 8px 10px;
  }
  
  .center-section {
    width: 100%;
    padding: 0;
    margin-bottom: 5px;
  }
  
  .header-logo {
    position: static;
    transform: none;
    margin-right: 10px;
  }
  
  .title-container {
    position: static;
    transform: none;
  }
  
  .header-weather-time {
    position: static;
    transform: none;
    width: 100%;
    justify-content: space-between;
  }
  
  .left-section, .right-section {
    min-width: 0;
  }
}
</style>