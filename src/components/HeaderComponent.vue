<template>
  <div class="top-header">
    <div class="left-section">
      <div class="time">{{ currentTime }}</div>
    </div>
    <div class="center-section">
      <div class="title-container">
        <div class="title">天狼星AI门机</div>
        <div class="subtitle">美的先行研究中心</div>
      </div>
    </div>
    <div class="right-section">
      <div class="weather">
        <div class="temp-info">
          <span class="temperature">{{ temperature }}</span>
          <div class="city-info">{{ city }} {{ weatherCondition }}</div>
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
  gap: 10px;
  flex-grow: 1;
  padding: 0 15px;
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

.right-section {
  display: flex;
  align-items: center;
  gap: 12px;
  max-width: 150px;
}

.weather {
  display: flex;
  align-items: center;
  gap: 5px;
  max-width: 110px;
  overflow: hidden;
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
</style>