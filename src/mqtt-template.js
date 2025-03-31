// MQTT连接处理逻辑 - 模板

import { ref, reactive, computed, onBeforeUnmount } from 'vue'
import { ElMessage } from 'element-plus'
import mqtt from 'mqtt/dist/mqtt'

export function useMqttConnection() {
  // MQTT连接状态
  const connectionStatus = reactive({
    text: '未连接',
    type: 'info'
  })

  // MQTT客户端
  let client = null
  const mqttConnected = ref(false)

  // 连接表单
  const connectionForm = reactive({
    protocol: 'ws://',
    brokerUrl: 'localhost:8083/mqtt',
    username: 'admin',
    password: 'public',
    topic: 'sensor/#'
  })

  // 数据相关
  const sensorData = ref([])
  const searchQuery = ref('')
  const temperatureFilter = ref('')
  const rawDataDialogVisible = ref(false)
  const currentRawData = ref(null)

  // 连接MQTT
  const connectMqtt = async (formRef) => {
    try {
      if (formRef) {
        await formRef.validate()
      }
      
      const fullUrl = `${connectionForm.protocol}${connectionForm.brokerUrl}`
      
      const options = {
        clientId: 'mqttjs_' + Math.random().toString(16).substr(2, 8),
        clean: true,
        reconnectPeriod: 5000, // 断线5秒后自动重连
        connectTimeout: 30 * 1000 // 连接超时时间
      }
      
      if (connectionForm.username) {
        options.username = connectionForm.username
        options.password = connectionForm.password
      }
      
      // 连接前先断开已有连接
      if (client) {
        await disconnectMqtt()
      }
      
      connectionStatus.text = '连接中...'
      connectionStatus.type = 'warning'
      
      client = mqtt.connect(fullUrl, options)
      
      client.on('connect', () => {
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
          let jsonData = null
          
          try {
            jsonData = JSON.parse(payload)
          } catch (e) {
            jsonData = { value: payload }
          }
          
          // 构建结构化的传感器数据
          const newData = {
            id: Date.now().toString(),
            deviceId: topic.split('/').pop() || 'unknown',
            topic: topic,
            timestamp: Date.now(),
            temperature: jsonData.temperature !== undefined ? parseFloat(jsonData.temperature) : 0,
            humidity: jsonData.humidity !== undefined ? parseFloat(jsonData.humidity) : 0,
            payload: payload,
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
        connectionStatus.text = '连接错误'
        connectionStatus.type = 'danger'
        ElMessage.error(`MQTT错误: ${err.message}`)
      })
      
      client.on('offline', () => {
        mqttConnected.value = false
        connectionStatus.text = '已断开'
        connectionStatus.type = 'info'
      })
      
      client.on('reconnect', () => {
        connectionStatus.text = '重新连接中...'
        connectionStatus.type = 'warning'
      })
      
    } catch (error) {
      ElMessage.error('表单验证失败，请检查输入')
    }
  }

  // 断开MQTT连接
  const disconnectMqtt = () => {
    return new Promise((resolve) => {
      if (client && client.connected) {
        client.end(true, {}, () => {
          mqttConnected.value = false
          connectionStatus.text = '已断开'
          connectionStatus.type = 'info'
          ElMessage.warning('MQTT连接已断开')
          resolve()
        })
      } else {
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

  // 组件销毁前断开连接
  onBeforeUnmount(() => {
    disconnectMqtt()
  })

  return {
    connectionStatus,
    mqttConnected,
    connectionForm,
    sensorData,
    searchQuery,
    temperatureFilter,
    rawDataDialogVisible,
    currentRawData,
    filteredData,
    connectMqtt,
    disconnectMqtt,
    formatDate,
    getTemperatureClass,
    showRawData
  }
} 