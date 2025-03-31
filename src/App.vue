<template>
  <div class="app-container">
    <div class="main-container">
      <!-- 顶部标题和管理员模式开关 -->
      <div class="app-header">
        <header-component :logo-src="logoSrc" :battery-level="batteryLevel" />
        
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
        <!-- 电梯门组件 -->
        <elevator-door-component :door-data="doorData" :is-data-timeout="isDataTimeout" :is-admin-mode="isAdminMode" />
        
        <!-- 门机运行状态组件 -->
        <door-status-component :door-data="doorData" :is-data-timeout="isDataTimeout" />
        
        <!-- 十六进制数据显示组件 - 仅管理员可见 -->
        <hex-display-component v-if="isAdmin" :hex-bytes="lastMessageHex" :last-update-time="lastUpdateTime" />
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
  isDataTimeout,
  processHexData,
  doorAnimationUpdate,
  setDataTimeout
} = useDataService()

// 管理员相关
const isAdmin = ref(false)
const showAdminLogin = ref(false)
const adminLoginForm = reactive({
  password: ''
})
const ADMIN_PASSWORD = '123456' // 硬编码密码仅用于演示

// Logo路径
const logoSrc = ref('/logo.png')

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

onMounted(() => {
  // 设置Logo图片
  logoSrc.value = 'data:image/png;base64,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'
  
  // 每100ms检查一次数据更新和动画
  const animationInterval = setInterval(() => {
    doorAnimationUpdate()
  }, 100)
  
  // 组件销毁前清除定时器
  onBeforeUnmount(() => {
    clearInterval(animationInterval)
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
}

/* 顶部标题和管理员模式开关布局 */
.app-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 0 20px;
  position: relative;
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
  margin-bottom: 30px;
}

.el-main > *:last-child {
  margin-bottom: 0;
}
</style> 