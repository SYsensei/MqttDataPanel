<template>
  <div class="app-container">
    <div class="main-container">
      <!-- 顶部标题 -->
      <div class="app-header">
        <header-component 
          ref="headerRef"
          :logo-src="logoSrc" 
          :battery-level="batteryLevel" />
      </div>
      
      <!-- 实时时间和样机实时数据，位于标题栏和门板之间，与容器右对齐 -->
      <div class="container-width">
        <div class="real-time-data">
          <div class="time-display">{{ currentTime }} 样机实时数据</div>
        </div>
      </div>
      
      <el-main>
        <!-- 内容容器 - 用于统一宽度 -->
        <div class="content-container">
          <!-- 统一的电梯门和门控器状态容器 -->
          <div class="unified-door-container">
            <!-- 左侧门控器状态 -->
            <door-status-component 
              :key="'left-panel'"
              :door-data="dataService.doorData" 
              :is-data-timeout="dataService.isDataTimeout.value"
              :valid-topic-received="dataService.validTopicReceived.value"
              class="status-panel-left"
              panel-position="left" />
            
            <!-- 中间电梯门组件 -->
            <elevator-door-component 
              :key="'door-panel'"
              :door-data="dataService.doorData" 
              :is-data-timeout="dataService.isDataTimeout.value" 
              :is-admin-mode="true"
              ref="elevatorDoorRef"
              class="door-panel-center" />
            
            <!-- 右侧门控器状态 -->
            <door-status-component 
              :key="'right-panel'"
              :door-data="dataService.doorData" 
              :is-data-timeout="dataService.isDataTimeout.value"
              :valid-topic-received="dataService.validTopicReceived.value"
              class="status-panel-right"
              panel-position="right" />
            
            <!-- 包装左右面板的容器 - 仅小屏幕显示 -->
            <div class="status-panels-wrapper">
              <!-- 左侧门控器状态（小屏幕复制） -->
              <door-status-component 
                :key="'left-panel-small'"
                :door-data="dataService.doorData" 
                :is-data-timeout="dataService.isDataTimeout.value"
                :valid-topic-received="dataService.validTopicReceived.value"
                class="status-panel-left-small"
                panel-position="left" />
              
              <!-- 右侧门控器状态（小屏幕复制） -->
              <door-status-component 
                :key="'right-panel-small'"
                :door-data="dataService.doorData" 
                :is-data-timeout="dataService.isDataTimeout.value"
                :valid-topic-received="dataService.validTopicReceived.value"
                class="status-panel-right-small"
                panel-position="right" />
            </div>
          </div>
          
          <!-- 门机运行状态组件 -->
          <door-status-component 
            :key="'main-panel'"
            :door-data="{...dataService.doorData, floor: currentElevatorFloor}" 
            :is-data-timeout="dataService.isDataTimeout.value"
            :valid-topic-received="dataService.validTopicReceived.value"
            class="main-status-panel"
            panel-position="main" />
        </div>
      </el-main>
      <ScrollHint scrollContainerId=".app-container" :debug="false" />
      
      <!-- 页面底部宣传文字 -->
      <div class="promotion-footer">
        门机改造换新，手机就能获取运行数据及故障检测
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted, onBeforeUnmount, computed } from 'vue'
import LogoImage from './assets/images/logo.png'
import DoorStatusComponent from './components/DoorStatusComponent.vue'
import ElevatorDoorComponent from './components/ElevatorDoorComponent.vue'
import ScrollHint from './components/ScrollHint.vue'

// 导入组件
import HeaderComponent from './components/HeaderComponent.vue'

// 导入服务
import { useMqttService } from './components/MqttService'
import { useDataService, updateTimerCounts } from './components/DataService'

// 使用MQTT服务
const { connectMqttService, disconnectMqttService, mqttConnected, connecting, setDataTimeout, connectionForm } = useMqttService()

// 使用数据服务
const dataService = useDataService()

// 添加数据处理间隔定时器引用
const dataProcessInterval = ref(null)

// Logo路径
const logoSrc = ref(LogoImage)

// 电池电量
const batteryLevel = ref(85)

// 当前时间
const currentTime = ref('')

// Header组件引用
const headerRef = ref(null)

// 数据超时检查定时器
const dataTimeoutCheckInterval = ref(null)
const doorAnimationInterval = ref(null) // 门位置动画更新定时器

// 电梯门组件引用
const elevatorDoorRef = ref(null)

// 获取电梯当前楼层
const currentElevatorFloor = computed(() => {
  if (elevatorDoorRef.value) {
    return elevatorDoorRef.value.currentFloor;
  }
  return 1;
})

// 更新时间的函数
const updateTime = () => {
  const now = new Date();
  const hours = now.getHours().toString().padStart(2, '0');
  const minutes = now.getMinutes().toString().padStart(2, '0');
  const seconds = now.getSeconds().toString().padStart(2, '0');
  currentTime.value = `${hours}:${minutes}:${seconds}`;
}

// 组件挂载时
onMounted(() => {
  // 立即运行一次数据处理函数
  processData()
  
  // 设置数据处理间隔，每200ms运行一次
  dataProcessInterval.value = setInterval(() => {
    processData()
    // 更新计时器计数
    updateTimerCounts()
  }, 200)
  
  // 初始化数据服务监控
  dataService.initDoorStatusMonitor()
  
  // 自动连接MQTT
  connectMqtt()
  
  // 设置定时器，定期检查数据是否超时
  dataTimeoutCheckInterval.value = setInterval(() => {
    dataService.checkDataTimeout()
  }, 1000)
  
  // 设置门位置动画更新定时器
  doorAnimationInterval.value = setInterval(() => {
    dataService.doorAnimationUpdate()
  }, 16) // 约60fps
  
  // 初始更新时间
  updateTime()
  
  // 设置时间更新间隔
  setInterval(updateTime, 1000)
})

// 组件卸载时
onBeforeUnmount(() => {
  // 如果存在定时器，清除
  if (dataTimeoutCheckInterval.value) {
    clearInterval(dataTimeoutCheckInterval.value)
  }
  
  // 清除门位置动画更新定时器
  if (doorAnimationInterval.value) {
    clearInterval(doorAnimationInterval.value)
  }
  
  // 断开MQTT连接
  disconnectMqtt()
})

// 自定义MQTT连接方法
const connectMqtt = () => {
  // 传递数据处理函数给 MQTT 服务
  connectMqttService(dataService.processHexData);
  // 同时传递数据超时处理函数
  setDataTimeout(dataService.setDataTimeout);
}

// 自定义MQTT断开方法
const disconnectMqtt = () => {
  disconnectMqttService().then(() => {
    // 断开连接后直接调用数据服务的超时设置方法
    dataService.setDataTimeout();
  });
}

// 数据处理函数
const processData = () => {
  // 这里可以放置数据处理相关的代码
}
</script>

<style>
/* 全局样式 */
body {
  margin: 0;
  padding: 0;
  font-family: 'Microsoft YaHei', Arial, sans-serif;
}

.app-container {
  font-family: 'Microsoft YaHei', Arial, sans-serif;
  height: 100vh;
  width: 100vw;
  margin: 0;
  padding: 0;
  overflow-y: auto; /* 确保垂直滚动正常工作 */
  background-color: #0a1a40;
  color: #eef2ff;
  display: flex;
  flex-direction: column;
}

.main-container {
  padding: 0;
  background-color: #0a1a40;
  padding-bottom: 20px;
  flex: 1;
  width: 100%;
  min-height: 120vh; /* 确保有足够的高度可以滚动 */
}

/* 顶部标题布局 */
.app-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 0 20px;
  position: relative;
  margin-bottom: 0; /* 减少与下方时间区域的间距 */
}

/* 设置时间和容器共享的宽度约束 */
.container-width {
  width: 100%;
  max-width: 900px;
  margin: 0 auto;
  padding: 0;
}

/* 实时时间和样机实时数据样式 */
.real-time-data {
  display: flex;
  justify-content: flex-end;
  padding: 6px 0 12px;
  width: 100%;
}

.time-display {
  font-size: 14px;
  color: #ffff90;
  font-weight: bold;
}

.el-main {
  padding-top: 10px;
  padding-bottom: 20px;
  display: flex;
  flex-direction: column;
  align-items: center;
  width: 100%;
  max-width: 100%;
  margin: 0 auto;
}

/* 滚动条样式 */
::-webkit-scrollbar {
  width: 8px;
  height: 8px;
}

::-webkit-scrollbar-track {
  background: #0a1a40;
}

::-webkit-scrollbar-thumb {
  background: #3a5fc4;
  border-radius: 4px;
}

::-webkit-scrollbar-thumb:hover {
  background: #4d77f9;
}

/* 元素之间的间距 */
.el-main > * {
  margin-bottom: 10px;
}

.el-main > *:last-child {
  margin-bottom: 0;
}

/* 统一的电梯门和门控器状态容器样式 */
.unified-door-container {
  display: flex;
  width: 100%;
  max-width: 100%;
  margin: 10px 0;
  background-color: #132859;
  border-radius: 8px;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.3);
  border: 1px solid #1e3a8a;
  padding: 5px;
  box-sizing: border-box;
  min-height: 350px;
  flex-wrap: nowrap;
}

/* 大屏幕面板样式 */
.status-panel-left, .status-panel-right {
  padding: 0;
  margin: 0;
  box-sizing: border-box;
  overflow: hidden;
  display: flex;
  flex-direction: column;
  height: 340px;
}

.door-panel-center {
  padding: 0;
  margin: 0;
  box-sizing: border-box;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  height: 340px;
}

/* 所有媒体查询的处理 */
@media (min-width: 769px) {
  /* 大屏幕下的布局 */
  .unified-door-container {
    display: grid;
    grid-template-columns: 25% 50% 25%;
    grid-gap: 0;
  }
  
  .status-panel-left {
    grid-column: 1;
  }
  
  .door-panel-center {
    grid-column: 2;
  }
  
  .status-panel-right {
    grid-column: 3;
  }
  
  .status-panels-wrapper {
    display: none !important;
  }
}

/* 小屏幕面板样式 */
.status-panel-left-small, .status-panel-right-small {
  height: auto;
  min-height: 250px;
  box-sizing: border-box;
  background-color: #061230;
  overflow: hidden;
}

.status-panel-left-small {
  border-left: 3px solid #3a5fc4;
  background-color: #071328;
}

.status-panel-right-small {
  border-right: 3px solid #3a5fc4;
  background-color: #071328;
}

/* 包装左右面板的容器 - 默认隐藏 */
.status-panels-wrapper {
  display: none;
  width: 100%;
  justify-content: space-between;
}

/* 媒体查询 - 小于等于768px的设备统一处理 */
@media (max-width: 768px) {
  /* 中小屏幕下的布局 */
  .unified-door-container {
    display: flex;
    flex-direction: column;
    padding: 5px;
    min-height: auto;
  }
  
  .door-panel-center {
    width: 100%;
    height: auto;
    min-height: 280px;
    order: 1;
    margin-bottom: 5px;
  }
  
  .status-panel-left, .status-panel-right {
    display: none !important;
  }
  
  .status-panels-wrapper {
    display: flex !important;
    flex-direction: row;
    order: 2;
    width: 100%;
    justify-content: space-between;
    margin: 0;
    padding: 0;
    box-sizing: border-box;
  }
  
  .status-panel-left-small {
    width: 50%;
    margin-right: 3px;
    border-left-width: 4px;
    border-left-color: #4d77f9;
    padding-left: 2px; /* 确保边框完整显示 */
  }
  
  .status-panel-right-small {
    width: 50%;
    flex-grow: 0;
    margin-left: 0;
    border-right-width: 4px;
    border-right-color: #4d77f9;
    padding-right: 2px; /* 确保边框完整显示 */
    margin: 0;
    overflow: hidden;
  }
  
  /* 小屏幕下调整时间显示和内容容器 */
  /* .real-time-data, .content-container {
    padding-left: 15px;
    padding-right: 15px;
    max-width: calc(100% - 30px);
    width: calc(100% - 30px);
  }
  
  .real-time-data {
    padding-top: 5px;
    padding-bottom: 8px;
  }
  
  .content-container {
    padding-top: 0;
    padding-bottom: 0;
  }
  
  .time-display {
    font-size: 14px;
  } */
}

/* 门机运行状态组件样式 */
.main-status-panel {
  width: 100%;
  max-width: 100%;
  margin: 5px 0;
}

@media (min-width: 1200px) {
  .el-main {
    max-width: 1200px;
  }
  
  .unified-door-container, .main-status-panel {
    max-width: 900px;
  }
}

/* 确保各区域宽度一致的样式 */
.unified-door-container, .main-status-panel {
  max-width: 100%;
  width: 100%;
}

/* 内容容器样式 */
.content-container {
  width: 100%;
  max-width: 900px;
  margin: 0 auto;
  display: flex;
  flex-direction: column;
  align-items: center;
}

/* 添加页面底部宣传文字样式 */
.promotion-footer {
  text-align: center;
  color: #ffff90;
  padding: 15px 0;
  font-size: 16px;
  width: 100%;
  background-color: #0a1a40;
  border-top: 1px solid rgba(58, 95, 196, 0.3);
  margin-top: auto;
  font-weight: bold;
}

@media (max-width: 768px) {
  .promotion-footer {
    font-size: 14px;
    padding: 10px 0;
  }
}
</style> 