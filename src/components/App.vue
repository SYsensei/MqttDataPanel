<template>
  <div class="main-content">
    <div class="container" :class="{ 'data-timeout': isDataTimeout }">
      <div class="status-message" v-if="isDataTimeout">
        <div class="warning-icon">
          <span class="material-icons">warning</span>
        </div>
        <div class="warning-text">
          数据连接已断开<br>
          <span class="reconnect-message">正在尝试重新连接...</span>
        </div>
      </div>
      
      <div class="top-section">
        <header class="top-header">
          <div class="header-item">
            <h1 class="app-title">电梯门机运行状态监控</h1>
            <span class="connection-status" :class="{ connected: !isDataTimeout && validTopicReceived }">
              {{ connectionStatusText }}
            </span>
          </div>
          
          <div class="header-item">
            <div class="mqtt-status">
              <div class="mqtt-status-indicator" :class="{ connected: !isDataTimeout && validTopicReceived }"></div>
              <div class="mqtt-status-text">实时MQTT数据</div>
            </div>
            
            <div class="last-update-time">最近更新：{{ formattedLastUpdateTime }}</div>
          </div>
        </header>
        
        <div class="panels-container">
          <div class="panel left-panel">
            <DoorStatusComponent 
              :doorData="doorData" 
              :isDataTimeout="isDataTimeout" 
              :validTopicReceived="validTopicReceived"
              panelPosition="left" 
            />
          </div>
          
          <div class="panel center-panel">
            <div class="elevator-door-wrapper">
              <ElevatorDoorComponent 
                ref="elevatorDoorComponent"
                :doorData="doorData" 
                :isDataTimeout="isDataTimeout" 
                :isAdminMode="isAdminMode" 
              />
            </div>
            
            <div class="status-display">
              <DoorStatusComponent 
                :doorData="{...doorData, floor: currentFloor}" 
                :isDataTimeout="isDataTimeout" 
                :validTopicReceived="validTopicReceived"
                panelPosition="main" 
              />
            </div>
          </div>
          
          <div class="panel right-panel">
            <DoorStatusComponent 
              :doorData="doorData" 
              :isDataTimeout="isDataTimeout" 
              :validTopicReceived="validTopicReceived"
              panelPosition="right" 
            />
          </div>
        </div>
      </div>
      
      <div class="bottom-section">
        <div class="control-panel">
          <div class="toolbar">
            <button @click="toggleAdminMode" class="admin-toggle" :class="{ active: isAdminMode }">
              <span class="material-icons">admin_panel_settings</span>
              管理员模式
            </button>
            
            <button @click="toggleMqttConnection" class="mqtt-toggle" :class="{ active: isMqttEnabled }">
              <span class="material-icons">{{ isMqttEnabled ? 'link' : 'link_off' }}</span>
              {{ isMqttEnabled ? '断开MQTT' : '连接MQTT' }}
            </button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, computed, watch } from 'vue'
import DoorStatusComponent from './components/DoorStatusComponent.vue'
import ElevatorDoorComponent from './components/ElevatorDoorComponent.vue'
import { useDataService } from './components/DataService'

// 使用数据服务
const {
  doorData,
  lastUpdateTime,
  isDataTimeout,
  validTopicReceived,
  processHexData,
  initDoorStatusMonitor,
  checkDataTimeout
} = useDataService()

// 引用电梯门组件以获取内部的楼层
const elevatorDoorComponent = ref(null);

// 获取电梯门组件内部的楼层值
const currentFloor = computed(() => {
  if (elevatorDoorComponent.value) {
    return elevatorDoorComponent.value.currentFloor || 1;
  }
  return 1; // 默认值
});

// MQTT状态
const isMqttEnabled = ref(true)

// 格式化最近更新时间
const formattedLastUpdateTime = computed(() => {
  if (!lastUpdateTime.value) return '暂无数据'
  
  const date = new Date(lastUpdateTime.value)
  const hours = date.getHours().toString().padStart(2, '0')
  const minutes = date.getMinutes().toString().padStart(2, '0')
  const seconds = date.getSeconds().toString().padStart(2, '0')
  
  return `${hours}:${minutes}:${seconds}`
})

// 连接状态文本
const connectionStatusText = computed(() => {
  if (isDataTimeout.value) return '已断开'
  if (validTopicReceived.value) return '已连接'
  return '等待数据...'
})

// 管理员模式状态
const isAdminMode = ref(false)

// 模拟MQTT消息处理
let mqttIntervalId = null

// 获取虚拟MQTT数据
const getVirtualMqttMessage = () => {
  // 随机生成1-100作为位置值
  const doorPosition = Math.min(900, Math.max(0, doorData.doorPosition + (Math.random() * 100 - 50)))
  
  // 生成十六进制消息
  const byte1 = 0x00 // 固定头
  const byte2 = 0x00 // 固定头
  const byte3 = Math.round(doorPosition / 256) // 高字节
  const byte4 = Math.round(doorPosition % 256) // 低字节
  
  // 状态字节，随机生成一些状态
  let byte5 = 0x00
  if (doorPosition > 800) {
    byte5 |= 0x04 // 开门信号
    if (doorPosition > 850) {
      byte5 |= 0x10 // 开门到位
    }
  } else if (doorPosition < 50) {
    byte5 |= 0x02 // 关门信号
    if (doorPosition < 20) {
      byte5 |= 0x08 // 关门到位
    }
  }
  
  // 在关门时随机生成故障信号
  if (doorPosition < 20 && Math.random() > 0.8) {
    byte5 |= 0x20 // 随机故障
  }
  
  const byte6 = Math.floor(Math.random() * 255) // 随机电机温度和状态 
  const byte7 = Math.floor(Math.random() * 5) + 1 // 故障代码
  const byte8 = Math.floor(Math.random() * 255) // 随机电流
  
  // 组织成消息
  const message = new Uint8Array([byte1, byte2, byte3, byte4, byte5, byte6, byte7, byte8])
  
  // 转换为hex字符串
  return Array.from(message).map(b => b.toString(16).padStart(2, '0')).join('')
}

// 切换MQTT连接状态
const toggleMqttConnection = () => {
  isMqttEnabled.value = !isMqttEnabled.value
  
  if (isMqttEnabled.value) {
    startMqttSimulation()
  } else {
    stopMqttSimulation()
  }
}

// 切换管理员模式
const toggleAdminMode = () => {
  isAdminMode.value = !isAdminMode.value
}

// 开始MQTT模拟
const startMqttSimulation = () => {
  // 首先停止之前的定时器
  if (mqttIntervalId) {
    clearInterval(mqttIntervalId)
  }
  
  // 每500ms发送一条模拟消息
  mqttIntervalId = setInterval(() => {
    const hexMessage = getVirtualMqttMessage()
    processHexData(hexMessage)
  }, 500)
}

// 停止MQTT模拟
const stopMqttSimulation = () => {
  if (mqttIntervalId) {
    clearInterval(mqttIntervalId)
    mqttIntervalId = null
  }
}

// 在组件挂载时初始化
onMounted(() => {
  // 初始化门状态监视器
  initDoorStatusMonitor()
  
  // 初始化数据超时检查
  const timeoutCheckerId = setInterval(checkDataTimeout, 1000)
  
  // 启动MQTT模拟
  startMqttSimulation()
  
  // 在组件卸载时清理
  onUnmounted(() => {
    if (mqttIntervalId) {
      clearInterval(mqttIntervalId)
    }
    clearInterval(timeoutCheckerId)
  })
})
</script>

<style scoped>
/* ... existing styles ... */
</style> 