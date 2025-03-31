<template>
  <div class="connection-status-bar">
    <div class="connection-status">
      <div :class="['connection-indicator', { 'connected': mqttConnected }]"></div>
      <span>{{ mqttConnected ? 'MQTT已连接' : 'MQTT未连接' }}</span>
      <span v-if="mqttConnected && isAdmin" class="connection-details">{{ broker }} / {{ topic }}</span>
      <span v-if="isAdmin" class="admin-badge">管理员模式</span>
    </div>
    <div class="connection-controls">
      <el-button v-if="!mqttConnected && isAdmin" type="primary" size="small" @click="$emit('connect')" :loading="connecting">
        连接
      </el-button>
      <el-button v-if="mqttConnected && isAdmin" type="danger" size="small" @click="$emit('disconnect')">
        断开
      </el-button>
      <el-button type="info" size="small" @click="$emit('showSettings')">
        {{ isAdmin ? '设置' : '管理员登录' }}
      </el-button>
      <el-button v-if="isAdmin" type="warning" size="small" @click="$emit('logout')">
        退出管理员
      </el-button>
    </div>
  </div>
</template>

<script setup>
defineProps({
  mqttConnected: {
    type: Boolean,
    default: false
  },
  broker: {
    type: String,
    default: ''
  },
  topic: {
    type: String,
    default: ''
  },
  connecting: {
    type: Boolean,
    default: false
  },
  isAdmin: {
    type: Boolean,
    default: false
  }
})

// 定义事件
defineEmits(['connect', 'disconnect', 'showSettings', 'logout'])
</script>

<style scoped>
/* 连接状态栏 */
.connection-status-bar {
  position: fixed;
  bottom: 0;
  left: 0;
  width: 100%;
  padding: 10px 15px;
  background-color: #061230;
  display: flex;
  justify-content: space-between;
  align-items: center;
  box-shadow: 0 -2px 10px rgba(0, 0, 0, 0.3);
  z-index: 100;
  border-top: 1px solid #1e3a8a;
}

.connection-status {
  display: flex;
  align-items: center;
}

.led-indicator {
  width: 12px;
  height: 12px;
  border-radius: 50%;
  background-color: #233876;
  margin-right: 10px;
  margin-top: 5px;
  border: 1px solid #3a5fc4;
  box-shadow: inset 0 0 5px rgba(0, 0, 0, 0.3);
  flex-shrink: 0;
}

.led-indicator.active {
  background-color: #4d77f9;
  box-shadow: 0 0 8px #4d77f9, inset 0 0 5px rgba(255, 255, 255, 0.3);
}

.connection-indicator {
  width: 20px;
  height: 20px;
  border-radius: 50%;
  margin-right: 10px;
  background-color: #233876;
  border: 1px solid #1e3a8a;
  box-shadow: inset 0 0 5px rgba(0, 0, 0, 0.3);
}

.connection-indicator.connected {
  background-color: #22c55e;
  box-shadow: 0 0 8px #22c55e, inset 0 0 5px rgba(255, 255, 255, 0.3);
  border-color: #16a34a;
}

.connection-details {
  margin-left: 10px;
  color: #5d7bb9;
  font-size: 13px;
}

.admin-badge {
  margin-left: 10px;
  background-color: #ff9900;
  color: #000;
  font-size: 12px;
  padding: 2px 6px;
  border-radius: 4px;
  font-weight: bold;
}

.connection-controls button {
  margin-left: 10px;
}
</style> 