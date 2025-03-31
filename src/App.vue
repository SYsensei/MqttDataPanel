<template>
  <div class="mqtt-container">
    <el-card class="mqtt-connection-card">
      <template #header>
        <div class="card-header">
          <h2>MQTT连接配置</h2>
          <div class="connection-status">
            <span class="mode-tag">{{ usingMqttLibrary ? '实时模式' : '模拟模式' }}</span>
            <el-tag :type="connectionStatus.type">{{ connectionStatus.text }}</el-tag>
          </div>
        </div>
      </template>
      
      <el-form :model="connectionForm" :rules="connectionRules" ref="connectionFormRef" label-width="120px">
        <el-form-item label="服务器预设">
          <el-select v-model="selectedPreset" @change="applyPreset" style="width: 100%">
            <el-option
              v-for="item in serverPresets"
              :key="item.name"
              :label="item.name"
              :value="item.name">
            </el-option>
          </el-select>
        </el-form-item>
        
        <el-form-item label="Broker地址" prop="brokerUrl">
          <el-input v-model="connectionForm.brokerUrl" placeholder="ws://localhost:8083/mqtt">
            <template #prepend>
              <el-select v-model="connectionForm.protocol" style="width: 80px">
                <el-option label="ws://" value="ws://"></el-option>
                <el-option label="wss://" value="wss://"></el-option>
              </el-select>
            </template>
          </el-input>
        </el-form-item>
        
        <el-form-item label="用户名" prop="username">
          <el-input v-model="connectionForm.username" placeholder="admin"></el-input>
        </el-form-item>
        
        <el-form-item label="密码" prop="password">
          <el-input v-model="connectionForm.password" type="password" placeholder="public"></el-input>
        </el-form-item>
        
        <el-form-item label="订阅主题" prop="topic">
          <el-input v-model="connectionForm.topic" placeholder="sensor/#"></el-input>
        </el-form-item>
        
        <el-form-item>
          <el-button type="primary" @click="connectMqtt" :disabled="mqttConnected">连接</el-button>
          <el-button @click="disconnectMqtt" :disabled="!mqttConnected" type="danger">断开</el-button>
          <el-button @click="testAuth" :disabled="mqttConnected" type="warning">测试认证</el-button>
        </el-form-item>
      </el-form>
    </el-card>
    
    <el-card class="mqtt-data-card">
      <template #header>
        <div class="card-header">
          <h2>实时数据</h2>
          <div>
            <el-input
              v-model="searchQuery"
              placeholder="按设备ID搜索"
              style="width: 200px; margin-right: 10px;"
              clearable
            ></el-input>
            <el-select v-model="temperatureFilter" placeholder="温度过滤" clearable style="width: 150px">
              <el-option label="全部" value=""></el-option>
              <el-option label="> 30°C" value="high"></el-option>
              <el-option label="20-30°C" value="medium"></el-option>
              <el-option label="< 20°C" value="low"></el-option>
            </el-select>
          </div>
        </div>
      </template>
      
      <!-- 原始数据透传区域 -->
      <div v-if="showRawDataStream" class="raw-data-stream">
        <div class="stream-header">
          <h3>原始数据流</h3>
          <el-switch
            v-model="showRawDataStream"
            active-text="显示原始数据"
            inactive-text="隐藏原始数据"
          ></el-switch>
        </div>
        <div class="stream-content">
          <pre v-for="item in filteredData.slice(0, 5)" :key="item.id" :class="{ 'new-data': item.isNew }">{{ item.payload }}</pre>
          <div v-if="filteredData.length > 5" class="more-data">还有 {{ filteredData.length - 5 }} 条数据...</div>
          <div v-if="filteredData.length === 0" class="no-data">暂无数据</div>
        </div>
      </div>
      
      <div class="table-header">
        <h3>数据表格</h3>
        <el-switch
          v-model="showRawDataStream"
          active-text="显示原始数据"
          inactive-text="隐藏原始数据"
        ></el-switch>
      </div>
      
      <el-table :data="filteredData" style="width: 100%" height="400px">
        <el-table-column prop="deviceId" label="设备ID" width="120"></el-table-column>
        <el-table-column prop="timestamp" label="时间" width="180">
          <template #default="scope">
            {{ formatDate(scope.row.timestamp) }}
          </template>
        </el-table-column>
        <el-table-column prop="temperature" label="温度(°C)" width="100">
          <template #default="scope">
            <span :class="getTemperatureClass(scope.row.temperature)">
              {{ scope.row.temperature.toFixed(1) }}
            </span>
          </template>
        </el-table-column>
        <el-table-column prop="humidity" label="湿度(%)" width="100"></el-table-column>
        <el-table-column prop="topic" label="主题" width="200"></el-table-column>
        <el-table-column prop="payload" label="原始数据">
          <template #default="scope">
            <el-button @click="showRawData(scope.row)" size="small">查看</el-button>
          </template>
        </el-table-column>
        <template #row="{ row }">
          <tr :class="{ 'new-data-row': row.isNew }">
          </tr>
        </template>
      </el-table>
    </el-card>
    
    <!-- 原始数据对话框 -->
    <el-dialog v-model="rawDataDialogVisible" title="原始数据" width="50%">
      <pre>{{ JSON.stringify(currentRawData, null, 2) }}</pre>
    </el-dialog>
    
    <!-- 模拟数据发送 -->
    <el-card class="mqtt-test-card">
      <template #header>
        <div class="card-header">
          <h3>模拟发送数据</h3>
        </div>
      </template>
      
      <div class="test-actions">
        <el-button type="success" @click="sendTestData" :disabled="!mqttConnected">
          发送测试数据
        </el-button>
        <el-switch
          v-model="autoSendEnabled"
          :disabled="!mqttConnected"
          active-text="自动发送"
          inactive-text="手动发送"
          style="margin-left: 20px;"
          @change="handleAutoSendChange"
        ></el-switch>
        <el-input-number
          v-if="autoSendEnabled"
          v-model="autoSendInterval"
          :min="1"
          :max="60"
          :disabled="!mqttConnected"
          style="width: 120px; margin-left: 10px;"
        ></el-input-number>
        <span v-if="autoSendEnabled" style="margin-left: 5px;">秒</span>
      </div>
    </el-card>
  </div>
</template>

<script setup>
import { ref, reactive, computed, onBeforeUnmount, watch, onMounted } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'

// MQTT相关
let mqtt = null
let client = null
const mqttConnected = ref(false)
const usingMqttLibrary = ref(false)

// 连接状态
const connectionStatus = reactive({
  text: '未连接',
  type: 'info'
})

// 表单引用
const connectionFormRef = ref(null)

// 连接表单
const connectionForm = reactive({
  protocol: 'wss://',
  brokerUrl: 's0f98412.ala.asia-southeast1.emqxsl.com:8084/mqtt',
  username: 'admin',
  password: 'public',
  topic: 'sensor/#'
})

// MQTT服务器预设
const serverPresets = [
  {
    name: '默认服务器',
    protocol: 'wss://',
    brokerUrl: 's0f98412.ala.asia-southeast1.emqxsl.com:8084/mqtt',
    username: 'admin',
    password: 'public'
  },
  {
    name: 'EMQX官方测试服务器',
    protocol: 'wss://',
    brokerUrl: 'broker.emqx.io:8084/mqtt',
    username: '',
    password: ''
  },
  {
    name: 'HiveMQ测试服务器',
    protocol: 'wss://',
    brokerUrl: 'broker.hivemq.com:8884/mqtt',
    username: '',
    password: ''
  },
  {
    name: '自定义服务器',
    protocol: 'wss://',
    brokerUrl: '',
    username: '',
    password: ''
  }
]

const selectedPreset = ref('默认服务器')

// 应用预设配置
const applyPreset = () => {
  const preset = serverPresets.find(p => p.name === selectedPreset.value)
  if (preset) {
    connectionForm.protocol = preset.protocol
    connectionForm.brokerUrl = preset.brokerUrl
    connectionForm.username = preset.username
    connectionForm.password = preset.password
    
    ElMessage.info(`已加载服务器预设: ${preset.name}`)
  }
}

// 尝试导入MQTT库
onMounted(async () => {
  // 延迟检查全局MQTT
  setTimeout(() => {
    if (window.mqttLib && typeof window.mqttLib.connect === 'function') {
      mqtt = window.mqttLib
      usingMqttLibrary.value = true
      console.log('使用全局MQTT对象')
    } else {
      // 尝试本地导入
      import('mqtt').then(mqttModule => {
        console.log('本地导入MQTT:', mqttModule)
        
        if (typeof mqttModule.connect === 'function') {
          mqtt = mqttModule
        } else if (typeof mqttModule.default?.connect === 'function') {
          mqtt = mqttModule.default
        } else {
          throw new Error('找不到MQTT connect方法')
        }
        
        usingMqttLibrary.value = true
      }).catch(err => {
        console.warn('MQTT导入失败:', err)
        usingMqttLibrary.value = false
      })
    }
  }, 500)
})

// 表单验证规则
const connectionRules = {
  brokerUrl: [
    { required: true, message: '请输入MQTT Broker地址', trigger: 'blur' }
  ],
  topic: [
    { required: true, message: '请输入订阅主题', trigger: 'blur' }
  ]
}

// 数据相关
const sensorData = ref([])
const searchQuery = ref('')
const temperatureFilter = ref('')
const rawDataDialogVisible = ref(false)
const currentRawData = ref(null)

// 模拟数据相关
const autoSendEnabled = ref(false)
const autoSendInterval = ref(5)
let autoSendTimer = null

// 原始数据透传
const showRawDataStream = ref(true)

// MQTT连接
const connectMqtt = async () => {
  try {
    await connectionFormRef.value.validate()
    
    const fullUrl = `${connectionForm.protocol}${connectionForm.brokerUrl}`
    
    // 如果MQTT库可用，使用实际连接
    if (mqtt && usingMqttLibrary.value) {
      // 连接前先断开已有连接
      if (client) {
        await disconnectMqtt()
      }
      
      connectionStatus.text = '连接中...'
      connectionStatus.type = 'warning'
      
      try {
        const options = {
          clientId: 'mqttjs_' + Math.random().toString(16).substr(2, 8),
          clean: true,
          reconnectPeriod: 5000, // 断线5秒后自动重连
          connectTimeout: 30 * 1000, // 连接超时时间
          rejectUnauthorized: false // 忽略未授权的SSL证书
        }
        
        // 认证信息处理
        if (connectionForm.username) {
          options.username = connectionForm.username
          options.password = connectionForm.password
          console.log('使用认证信息:', connectionForm.username, '密码长度:', connectionForm.password ? connectionForm.password.length : 0)
        } else {
          console.warn('未提供认证信息，可能导致连接被拒绝')
        }
        
        console.log('正在连接MQTT:', fullUrl, '认证选项:', {
          ...options, 
          password: options.password ? '******' : undefined
        })
        
        // 简化连接逻辑
        client = mqtt.connect(fullUrl, options)
        
        if (!client) {
          throw new Error('MQTT客户端创建失败')
        }
        
        console.log('MQTT客户端创建成功:', client)
        
        // 确保注册了所有事件处理器
        client.on('connect', () => {
          console.log('MQTT连接成功')
          mqttConnected.value = true
          connectionStatus.text = '已连接'
          connectionStatus.type = 'success'
          ElMessage.success('MQTT连接成功')
          
          // 订阅主题
          client.subscribe(connectionForm.topic, (err) => {
            if (err) {
              ElMessage.error(`订阅主题失败: ${err.message}`)
            } else {
              ElMessage.success(`成功订阅主题: ${connectionForm.topic}`)
            }
          })
        })
        
        client.on('message', (topic, message) => {
          try {
            const payload = message.toString()
            console.log('收到MQTT消息:', topic, payload)
            let jsonData = null
            
            try {
              jsonData = JSON.parse(payload)
            } catch (e) {
              jsonData = { value: payload }
            }
            
            // 构建结构化的传感器数据
            const newData = {
              id: Date.now().toString(),
              deviceId: jsonData.deviceId || topic.split('/').pop() || 'unknown',
              topic: topic,
              timestamp: jsonData.timestamp || Date.now(),
              temperature: jsonData.temperature !== undefined ? parseFloat(jsonData.temperature) : 0,
              humidity: jsonData.humidity !== undefined ? parseFloat(jsonData.humidity) : 0,
              payload: typeof payload === 'string' ? payload : JSON.stringify(payload, null, 2),
              isNew: true // 用于新数据高亮
            }
            
            // 添加到数据列表顶部
            sensorData.value.unshift(newData)
            
            // 3秒后移除高亮
            setTimeout(() => {
              const index = sensorData.value.findIndex(item => item.id === newData.id)
              if (index !== -1) {
                sensorData.value[index].isNew = false
              }
            }, 3000)
            
            // 限制数据量，避免过多数据导致性能问题
            if (sensorData.value.length > 1000) {
              sensorData.value = sensorData.value.slice(0, 1000)
            }
          } catch (error) {
            console.error('处理MQTT消息错误:', error)
          }
        })
        
        client.on('error', (err) => {
          console.error('MQTT错误:', err)
          connectionStatus.text = '连接错误'
          connectionStatus.type = 'danger'
          
          // 处理特定的错误
          if (err.message.includes('Not authorized')) {
            ElMessage.error('MQTT错误: 认证失败，请检查用户名和密码是否正确')
            console.error('认证失败详情:', {
              broker: connectionForm.brokerUrl,
              username: connectionForm.username,
              usingPassword: !!connectionForm.password,
              clientId: options.clientId
            })
          } else {
            ElMessage.error(`MQTT错误: ${err.message}`)
          }
        })
        
        client.on('offline', () => {
          console.log('MQTT离线')
          mqttConnected.value = false
          connectionStatus.text = '已断开'
          connectionStatus.type = 'info'
        })
        
        client.on('reconnect', () => {
          console.log('MQTT重连中')
          connectionStatus.text = '重新连接中...'
          connectionStatus.type = 'warning'
        })
      } catch (error) {
        console.error('MQTT连接失败:', error)
        connectionStatus.text = '连接失败'
        connectionStatus.type = 'danger'
        ElMessage.error(`MQTT连接失败: ${error.message}`)
      }
    } else {
      // 使用模拟模式
      console.log('使用模拟模式')
      connectionStatus.text = '连接中...'
      connectionStatus.type = 'warning'
      
      // 模拟连接延迟
      setTimeout(() => {
        mqttConnected.value = true
        connectionStatus.text = '已连接 (模拟模式)'
        connectionStatus.type = 'success'
        ElMessage.success('MQTT连接成功 (模拟模式)')
        
        // 显示模拟提示
        ElMessage.info('当前处于模拟模式，未实际连接MQTT服务器，请安装MQTT.js库: npm install mqtt --save')
      }, 1000)
    }
  } catch (error) {
    console.error('表单验证失败:', error)
    ElMessage.error('表单验证失败，请检查输入')
  }
}

// 断开MQTT连接
const disconnectMqtt = () => {
  return new Promise((resolve) => {
    stopAutoSend()
    
    if (mqtt && usingMqttLibrary.value && client && client.connected) {
      client.end(true, {}, () => {
        mqttConnected.value = false
        connectionStatus.text = '未连接'
        connectionStatus.type = 'info'
        ElMessage.warning('MQTT连接已断开')
        resolve()
      })
    } else {
      mqttConnected.value = false
      connectionStatus.text = '未连接'
      connectionStatus.type = 'info'
      ElMessage.warning('MQTT连接已断开')
      resolve()
    }
  })
}

// 格式化日期
const formatDate = (timestamp) => {
  const date = new Date(timestamp)
  return date.toLocaleString()
}

// 根据温度返回不同的CSS类
const getTemperatureClass = (temp) => {
  if (temp > 30) return 'high-temp'
  if (temp < 20) return 'low-temp'
  return 'normal-temp'
}

// 查看原始数据
const showRawData = (row) => {
  currentRawData.value = row
  rawDataDialogVisible.value = true
}

// 过滤后的数据
const filteredData = computed(() => {
  let result = [...sensorData.value]
  
  // 搜索过滤
  if (searchQuery.value) {
    result = result.filter(item => 
      item.deviceId.toLowerCase().includes(searchQuery.value.toLowerCase())
    )
  }
  
  // 温度过滤
  if (temperatureFilter.value) {
    switch(temperatureFilter.value) {
      case 'high':
        result = result.filter(item => item.temperature > 30)
        break
      case 'medium':
        result = result.filter(item => item.temperature >= 20 && item.temperature <= 30)
        break
      case 'low':
        result = result.filter(item => item.temperature < 20)
        break
    }
  }
  
  return result
})

// 发送测试数据
const sendTestData = () => {
  if (!mqttConnected.value) {
    ElMessage.warning('请先连接MQTT服务器')
    return
  }
  
  const deviceId = `sensor${Math.floor(Math.random() * 10)}`
  const testTopic = connectionForm.topic.replace('#', deviceId)
  const temperature = parseFloat((Math.random() * 40).toFixed(1))
  const humidity = parseFloat((Math.random() * 100).toFixed(1))
  
  const testData = {
    deviceId: deviceId,
    timestamp: Date.now(),
    temperature: temperature,
    humidity: humidity
  }
  
  if (mqtt && usingMqttLibrary.value && client && client.connected) {
    // 实际发送MQTT消息
    try {
      console.log('发送MQTT消息:', testTopic, testData)
      client.publish(testTopic, JSON.stringify(testData))
      ElMessage.success(`已发送测试数据到主题: ${testTopic}`)
    } catch (error) {
      console.error('发送MQTT消息失败:', error)
      ElMessage.error(`发送测试数据失败: ${error.message}`)
    }
  } else {
    // 模拟模式下，直接添加到数据列表
    console.log('模拟发送数据:', testTopic, testData)
    const newData = {
      id: Date.now().toString(),
      deviceId: deviceId,
      topic: testTopic,
      timestamp: Date.now(),
      temperature: temperature,
      humidity: humidity,
      payload: JSON.stringify(testData, null, 2),
      isNew: true
    }
    
    // 添加到数据列表顶部
    sensorData.value.unshift(newData)
    
    // 3秒后移除高亮
    setTimeout(() => {
      const index = sensorData.value.findIndex(item => item.id === newData.id)
      if (index !== -1) {
        sensorData.value[index].isNew = false
      }
    }, 3000)
    
    // 限制数据量
    if (sensorData.value.length > 1000) {
      sensorData.value = sensorData.value.slice(0, 1000)
    }
    
    ElMessage.success(`已生成模拟数据: ${deviceId}, 温度: ${temperature}°C`)
  }
}

// 处理自动发送开关变化
const handleAutoSendChange = (value) => {
  if (value) {
    startAutoSend()
  } else {
    stopAutoSend()
  }
}

// 开始自动发送数据
const startAutoSend = () => {
  if (!mqttConnected.value) return
  
  stopAutoSend() // 先停止之前的定时器
  
  autoSendTimer = setInterval(() => {
    sendTestData()
  }, autoSendInterval.value * 1000)
  
  ElMessage.info(`已开启自动发送，间隔 ${autoSendInterval.value} 秒`)
}

// 停止自动发送数据
const stopAutoSend = () => {
  if (autoSendTimer) {
    clearInterval(autoSendTimer)
    autoSendTimer = null
  }
}

// 监视自动发送间隔变化
watch(autoSendInterval, (newVal) => {
  if (autoSendEnabled.value) {
    startAutoSend()
  }
})

// 测试认证信息
const testAuth = async () => {
  try {
    await connectionFormRef.value.validate()
    
    const fullUrl = `${connectionForm.protocol}${connectionForm.brokerUrl}`
    
    // 如果MQTT库可用，使用实际连接
    if (mqtt && usingMqttLibrary.value) {
      connectionStatus.text = '测试认证中...'
      connectionStatus.type = 'warning'
      
      try {
        const options = {
          clientId: 'mqttjs_test_' + Math.random().toString(16).substr(2, 8),
          clean: true,
          connectTimeout: 10 * 1000, // 较短的超时时间
          rejectUnauthorized: false, // 忽略未授权的SSL证书
          reconnect: false // 禁止自动重连
        }
        
        if (connectionForm.username) {
          options.username = connectionForm.username
          options.password = connectionForm.password
        }
        
        console.log('测试认证信息:', {
          url: fullUrl,
          username: options.username,
          hasPassword: !!options.password
        })
        
        // 创建临时客户端只用于测试认证
        const testClient = mqtt.connect(fullUrl, options)
        
        // 设置超时
        const timeout = setTimeout(() => {
          testClient.end(true)
          connectionStatus.text = '认证超时'
          connectionStatus.type = 'danger'
          ElMessage.error('认证测试超时，服务器未响应')
        }, 10000)
        
        testClient.on('connect', () => {
          clearTimeout(timeout)
          console.log('认证测试成功')
          connectionStatus.text = '认证有效'
          connectionStatus.type = 'success'
          ElMessage.success('认证信息有效')
          testClient.end(true)
        })
        
        testClient.on('error', (err) => {
          clearTimeout(timeout)
          console.error('认证测试失败:', err)
          connectionStatus.text = '认证无效'
          connectionStatus.type = 'danger'
          
          if (err.message.includes('Not authorized')) {
            ElMessage.error('认证失败: 用户名或密码错误')
          } else {
            ElMessage.error(`认证测试失败: ${err.message}`)
          }
          
          testClient.end(true)
        })
      } catch (error) {
        console.error('认证测试过程错误:', error)
        connectionStatus.text = '测试失败'
        connectionStatus.type = 'danger'
        ElMessage.error(`认证测试错误: ${error.message}`)
      }
    } else {
      ElMessage.warning('MQTT库未加载，无法测试认证')
    }
  } catch (error) {
    console.error('表单验证失败:', error)
    ElMessage.error('表单验证失败，请检查输入')
  }
}

// 组件销毁前断开连接
onBeforeUnmount(() => {
  disconnectMqtt()
})
</script>

<style scoped>
.mqtt-container {
  padding: 20px;
  max-width: 1200px;
  margin: 0 auto;
}

.mqtt-connection-card {
  margin-bottom: 20px;
}

.mqtt-data-card {
  margin-bottom: 20px;
}

.mqtt-test-card {
  margin-bottom: 20px;
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.test-actions {
  display: flex;
  align-items: center;
}

.high-temp {
  color: #F56C6C;
  font-weight: bold;
}

.low-temp {
  color: #409EFF;
}

.normal-temp {
  color: #67C23A;
}

.raw-data-stream {
  margin-bottom: 20px;
  border: 1px solid #e4e7ed;
  border-radius: 4px;
}

.stream-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 10px;
  background-color: #f5f7fa;
  border-bottom: 1px solid #e4e7ed;
}

.stream-content {
  padding: 10px;
  max-height: 300px;
  overflow-y: auto;
  background-color: #1e1e1e;
  color: #d4d4d4;
}

.stream-content pre {
  margin: 5px 0;
  padding: 8px;
  border-radius: 4px;
  white-space: pre-wrap;
  word-break: break-all;
  font-family: Consolas, Monaco, 'Andale Mono', monospace;
  background-color: #2d2d2d;
}

.stream-content .new-data {
  background-color: #2c4f2c;
  animation: highlight-raw 3s ease-out;
}

.table-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 10px;
  padding: 10px;
}

.no-data {
  text-align: center;
  color: #909399;
  padding: 20px;
}

.more-data {
  text-align: center;
  color: #909399;
  padding: 10px;
  font-style: italic;
}

.el-table .new-data-row {
  background-color: rgba(103, 194, 58, 0.1);
  animation: highlight 3s ease-out;
}

@keyframes highlight {
  0% {
    background-color: rgba(103, 194, 58, 0.3);
  }
  100% {
    background-color: transparent;
  }
}

@keyframes highlight-raw {
  0% {
    background-color: #3a6a3a;
  }
  100% {
    background-color: #2c4f2c;
  }
}

.connection-status {
  display: flex;
  align-items: center;
  gap: 10px;
}

.mode-tag {
  padding: 4px 8px;
  border-radius: 4px;
  font-size: 12px;
  color: #fff;
  background-color: #909399;
}

.mode-tag:empty:before {
  content: '模拟模式';
}
</style> 