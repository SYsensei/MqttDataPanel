<template>
  <div class="app-container">
    <div class="main-container">
      <!-- 顶部标题和管理员模式开关 -->
      <div class="app-header">
        <header-component 
          :logo-src="logoSrc" 
          :battery-level="batteryLevel" 
          @connect="connectMqtt" 
          @disconnect="disconnectMqtt" 
          :is-connected="mqttConnected" 
          :is-admin-mode="isAdminMode" 
          @toggle-admin="toggleAdminMode" />
        
        <!-- 管理员模式开关 -->
        <div v-if="isAdmin" class="admin-mode-switch">
          <span class="admin-label">管理员模式</span>
          <el-switch
            v-model="isAdminMode"
            active-color="#13ce66"
            inactive-color="#ff4949"
            active-text="开启"
            inactive-text="关闭"
          />
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
              :door-data="doorData" 
              :is-data-timeout="isDataTimeout"
              :valid-topic-received="validTopicReceived"
              class="status-panel-left"
              panel-position="left" />
            
            <!-- 中间电梯门组件 -->
            <elevator-door-component 
              :key="'door-panel'"
              :door-data="doorData" 
              :is-data-timeout="isDataTimeout" 
              :is-admin-mode="isAdminMode"
              class="door-panel-center" />
            
            <!-- 右侧门控器状态 -->
            <door-status-component 
              :key="'right-panel'"
              :door-data="doorData" 
              :is-data-timeout="isDataTimeout"
              :valid-topic-received="validTopicReceived"
              class="status-panel-right"
              panel-position="right" />
            
            <!-- 包装左右面板的容器 - 仅小屏幕显示 -->
            <div class="status-panels-wrapper">
              <!-- 左侧门控器状态（小屏幕复制） -->
              <door-status-component 
                :key="'left-panel-small'"
                :door-data="doorData" 
                :is-data-timeout="isDataTimeout"
                :valid-topic-received="validTopicReceived"
                class="status-panel-left-small"
                panel-position="left" />
              
              <!-- 右侧门控器状态（小屏幕复制） -->
              <door-status-component 
                :key="'right-panel-small'"
                :door-data="doorData" 
                :is-data-timeout="isDataTimeout"
                :valid-topic-received="validTopicReceived"
                class="status-panel-right-small"
                panel-position="right" />
            </div>
          </div>
          
          <!-- 门机运行状态组件 -->
          <door-status-component 
            :key="'main-panel'"
            :door-data="doorData" 
            :is-data-timeout="isDataTimeout"
            :valid-topic-received="validTopicReceived"
            class="main-status-panel"
            panel-position="main" />
          
          <!-- 十六进制数据显示组件 - 仅管理员可见 -->
          <hex-display-component 
            v-if="isAdminMode" 
            :key="'hex-display'"
            :hex-bytes="lastMessageHex" 
            :last-update-time="lastUpdateTime" 
            :messages="hexMessageHistory" />
        </div>
      </el-main>
      
      <!-- 底部连接状态栏组件 -->
      <footer-component 
        :mqtt-connected="mqttConnected"
        :broker="connectionForm.broker"
        :topic="connectionForm.topic"
        :connecting="connecting"
        :is-admin="isAdmin"
        @connect="connectMqtt"
        @disconnect="disconnectMqtt"
        @showSettings="showAdminLogin = true"
        @logout="adminLogout"
      />
    </div>
    
    <!-- 管理员登录对话框 -->
    <el-dialog
      title="管理员验证"
      v-model="showAdminLogin"
      width="300px"
      center>
      <el-form :model="adminLoginForm">
        <el-form-item label="密码" required>
          <el-input 
            type="password" 
            v-model="adminLoginForm.password"
            placeholder="请输入管理员密码"
            show-password
            @keyup.enter="testAdminLogin"
          ></el-input>
        </el-form-item>
      </el-form>
      <template #footer>
        <span class="dialog-footer">
          <el-button @click="showAdminLogin = false">取消</el-button>
          <el-button type="primary" @click="testAdminLogin">确认</el-button>
        </span>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted, onBeforeUnmount } from 'vue'
import { ElMessage } from 'element-plus'
import LogoImage from './assets/images/logo.png'

// 导入组件
import HeaderComponent from './components/HeaderComponent.vue'
import ElevatorDoorComponent from './components/ElevatorDoorComponent.vue'
import DoorStatusComponent from './components/DoorStatusComponent.vue'
import HexDisplayComponent from './components/HexDisplayComponent.vue'
import FooterComponent from './components/FooterComponent.vue'

// 导入服务
import { useMqttService } from './components/MqttService'
import { useDataService } from './components/DataService'

// 使用MQTT服务
const {
  mqttConnected,
  connecting,
  connectionForm,
  connectMqtt: connectMqttService,
  disconnectMqtt: disconnectMqttService
} = useMqttService()

// 使用数据服务
const {
  doorData,
  lastMessageHex,
  lastUpdateTime,
  hexMessageHistory,
  isDataTimeout,
  lastDataReceiveTime,
  validTopicReceived,
  processHexData,
  doorAnimationUpdate,
  setDataTimeout,
  checkDataTimeout
} = useDataService()

// 管理员相关
const isAdmin = ref(false)
const showAdminLogin = ref(false)
const adminLoginForm = reactive({
  password: ''
})
const ADMIN_PASSWORD = '123456' // 硬编码密码仅用于演示

// Logo路径
const logoSrc = ref(LogoImage)

// 电池电量
const batteryLevel = ref(85)

// 管理员模式状态
const isAdminMode = ref(false)

// 测试管理员登录
const testAdminLogin = () => {
  if (adminLoginForm.password === ADMIN_PASSWORD) {
    isAdmin.value = true
    showAdminLogin.value = false
    ElMessage.success('管理员验证成功')
    adminLoginForm.password = '' // 清空密码
  } else {
    ElMessage.error('密码错误')
  }
}

// 管理员登出方法
const adminLogout = () => {
  isAdmin.value = false
  ElMessage.success('已退出管理员模式')
}

// 自定义MQTT连接方法
const connectMqtt = () => {
  connectMqttService(processHexData)
}

// 自定义MQTT断开方法
const disconnectMqtt = () => {
  disconnectMqttService().then(() => {
    // 设置数据超时状态，使显示停止更新
    setDataTimeout()
  })
}

// 切换管理员模式
const toggleAdminMode = () => {
  isAdminMode.value = !isAdminMode.value
  if (isAdminMode.value) {
    connectMqtt()
  } else {
    disconnectMqtt()
  }
}

onMounted(() => {
  // 每100ms检查一次数据更新和动画
  const animationInterval = setInterval(() => {
    doorAnimationUpdate()
  }, 100)
  
  // 500ms检查一次数据超时状态
  const timeoutCheckInterval = setInterval(() => {
    checkDataTimeout()
  }, 500)
  
  // 定期检查MQTT连接状态，如果未连接则尝试重连
  const connectionCheckInterval = setInterval(() => {
    if (!mqttConnected.value && !connecting.value) {
      console.log('检测到MQTT未连接，尝试重连...')
      connectMqtt()
    }
  }, 5000)
  
  // 组件销毁前清除定时器
  onBeforeUnmount(() => {
    clearInterval(animationInterval)
    clearInterval(timeoutCheckInterval)
    clearInterval(connectionCheckInterval)
  })
  
  // 自动连接MQTT
  connectMqtt()
})
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
  overflow: auto;
  background-color: #0a1a40;
  color: #eef2ff;
  display: flex;
  flex-direction: column;
}

.main-container {
  padding: 0;
  background-color: #0a1a40;
  padding-bottom: 80px; /* 为底部状态栏留出空间 */
  flex: 1;
  width: 100%;
}

/* 顶部标题和管理员模式开关布局 */
.app-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 0 20px;
  position: relative;
  margin-bottom: 20px;
}

.admin-mode-switch {
  display: flex;
  align-items: center;
  background-color: #132859;
  padding: 5px 12px;
  border-radius: 8px;
  border: 1px solid #1e3a8a;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.3);
}

.admin-label {
  margin-right: 10px;
  font-size: 14px;
  font-weight: bold;
  color: #4d77f9;
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
  justify-content: space-between;
  gap: 0;
  margin: 10px 0;
  background-color: #132859;
  border-radius: 8px;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.3);
  border: 1px solid #1e3a8a;
  padding: 6px;
  box-sizing: border-box;
  min-height: 350px;
  flex-direction: row;
  flex-wrap: nowrap;
}

.status-panel-left, .status-panel-right {
  width: 32%;
  padding: 0;
  margin: 0;
  box-sizing: border-box;
  overflow: hidden;
  display: flex;
  flex-direction: column;
  height: 330px;
  flex-grow: 1;
}

.door-panel-center {
  width: 36%;
  padding: 0;
  margin: 0;
  box-sizing: border-box;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  height: 330px;
  flex-grow: 1;
}

/* 小屏幕面板样式 */
.status-panel-left-small, .status-panel-right-small {
  height: auto;
  min-height: 250px;
  box-sizing: border-box;
}

.status-panel-left-small {
  width: 48%;
  padding-right: 1px;
}

.status-panel-right-small {
  width: 52%;
  padding-left: 1px;
  flex-grow: 1;
}

/* 包装左右面板的容器 - 默认隐藏 */
.status-panels-wrapper {
  display: none;
  width: 100%;
  justify-content: space-between;
}

/* 所有媒体查询的处理 */
@media (min-width: 769px) {
  /* 大屏幕下的布局 */
  .unified-door-container {
    flex-direction: row;
    gap: 0;
  }
  
  .status-panel-left, .status-panel-right {
    display: flex;
    width: 32%;
  }
  
  .door-panel-center {
    width: 36%;
  }
  
  .status-panels-wrapper {
    display: none;
  }
}

/* 媒体查询 - 中等屏幕设备 */
@media (max-width: 768px) and (min-width: 577px) {
  /* 中屏幕下的布局 */
  .unified-door-container {
    flex-direction: column;
    padding: 6px;
    min-height: auto;
    gap: 4px;
  }
  
  .door-panel-center {
    width: 100%;
    order: 1;
    margin-bottom: 4px;
    display: flex;
  }
  
  .status-panel-left, .status-panel-right {
    display: none;
  }
  
  .status-panels-wrapper {
    display: flex;
    flex-direction: row;
    order: 2;
    width: 100%;
  }
  
  .status-panel-left-small {
    width: 48%;
    padding-right: 1px;
  }
  
  .status-panel-right-small {
    width: 52%;
    padding-left: 1px;
  }
}

/* 媒体查询 - 小屏幕设备 */
@media (max-width: 576px) {
  /* 小屏幕下的布局 */
  .unified-door-container {
    flex-direction: column;
    padding: 6px;
    min-height: auto;
    gap: 4px;
  }
  
  .door-panel-center {
    width: 100%;
    order: 1;
    margin-bottom: 4px;
    display: flex;
  }
  
  .status-panel-left, .status-panel-right {
    display: none;
  }
  
  .status-panels-wrapper {
    display: flex;
    flex-direction: row;
    order: 2;
    width: 100%;
    padding: 0;
    margin: 0;
  }
  
  /* 确保right面板完全填充可用空间 */
  .status-panel-left-small {
    width: 46%;
    padding-right: 0;
    margin-right: 1px;
  }
  
  .status-panel-right-small {
    width: 54%;
    padding-left: 0;
    margin-left: 1px;
    flex-grow: 1;
  }
  
  /* 调整天气和时间显示，避免与Logo重叠 */
  .app-header {
    flex-direction: column;
    align-items: flex-start;
  }
  
  .app-header header-component {
    margin-bottom: 10px;
    width: 100%;
  }
  
  .app-header .admin-mode-switch {
    align-self: flex-end;
  }
  
  /* 让天气和时间显示在Logo下方 */
  .header-weather-time {
    position: relative !important;
    right: auto !important;
    top: auto !important;
    margin-top: 5px;
    align-self: flex-end;
  }
  
  .section-title {
    font-size: 12px;
  }
  
  .status-name {
    font-size: 12px;
  }
  
  .status-detail {
    font-size: 10px;
  }
  
  .main-status-panel {
    padding: 5px;
  }
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
</style> 