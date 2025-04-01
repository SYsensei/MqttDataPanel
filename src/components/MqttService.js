import { ref, reactive } from 'vue'
import { ElMessage } from 'element-plus'

export function useMqttService() {
  let mqtt = null
  let client = null
  const mqttConnected = ref(false)
  const usingMqttLibrary = ref(false)
  const connecting = ref(false)
  
  const connectionStatus = reactive({
    text: '未连接',
    type: 'danger'
  })
  
  // 连接表单
  const connectionForm = reactive({
    broker: 'wss://broker-cn.emqx.io:8084/mqtt',
    username: '',
    password: '',
    topic: 'jmjdoor'
  })
  
  // 服务器预设
  const serverPresets = [
    {
      name: '默认服务器',
      broker: 'wss://broker-cn.emqx.io:8084/mqtt',
      username: '',
      password: '',
      topic: 'jmjdoor'
    },
    {
      name: '自定义服务器',
      broker: '',
      username: '',
      password: '',
      topic: ''
    }
  ]
  
  // 初始化MQTT库
  const initMqtt = async () => {
    try {
      // 检查全局MQTT
      if (window.mqttLib && typeof window.mqttLib.connect === 'function') {
        mqtt = window.mqttLib
        usingMqttLibrary.value = true
        console.log('使用全局MQTT对象')
        return mqtt
      }
      
      // 尝试本地导入
      const mqttModule = await import('mqtt')
      console.log('本地导入MQTT:', mqttModule)
      
      if (typeof mqttModule.connect === 'function') {
        mqtt = mqttModule
      } else if (typeof mqttModule.default?.connect === 'function') {
        mqtt = mqttModule.default
      } else {
        throw new Error('找不到MQTT connect方法')
      }
      
      usingMqttLibrary.value = true
      return mqtt
    } catch (error) {
      console.warn('MQTT导入失败:', error)
      usingMqttLibrary.value = false
      ElMessage.error('MQTT库加载失败，请检查网络或刷新页面重试')
      return null
    }
  }
  
  // 连接到MQTT
  const connectMqtt = async (dataCallback) => {
    if (connecting.value) {
      console.log('MQTT连接正在进行中，忽略重复请求')
      return
    }
    
    if (mqttConnected.value) {
      console.log('MQTT已连接，先断开连接')
      await disconnectMqtt()
    }
    
    if (!mqtt) {
      mqtt = await initMqtt()
      if (!mqtt) {
        console.error('MQTT初始化失败')
        return
      }
    }
    
    connecting.value = true
    
    try {
      const options = {
        clientId: 'mqtt_client_' + Math.random().toString(16).substr(2, 8),
        clean: true,
        reconnectPeriod: 5000,
        connectTimeout: 30 * 1000
      }
      
      if (connectionForm.username) {
        options.username = connectionForm.username
        options.password = connectionForm.password
      }
      
      console.log('连接到MQTT服务器:', connectionForm.broker)
      connectionStatus.text = '连接中...'
      connectionStatus.type = 'warning'
      
      client = mqtt.connect(connectionForm.broker, options)
      
      client.on('connect', () => {
        console.log('MQTT连接成功')
        mqttConnected.value = true
        connecting.value = false
        connectionStatus.text = '已连接'
        connectionStatus.type = 'success'
        ElMessage.success('MQTT连接成功')
        
        // 订阅主题
        client.subscribe(connectionForm.topic, (err) => {
          if (err) {
            console.error(`订阅主题失败: ${err.message}`)
            ElMessage.error(`订阅主题失败: ${err.message}`)
          } else {
            console.log(`成功订阅主题: ${connectionForm.topic}`)
          }
        })
      })
      
      client.on('message', (topic, message) => {
        console.log('收到MQTT消息:', topic)
        // 调用数据处理回调
        if (typeof dataCallback === 'function') {
          dataCallback(message)
        }
      })
      
      client.on('error', (err) => {
        console.error('MQTT错误:', err)
        connecting.value = false
        connectionStatus.text = '连接错误'
        connectionStatus.type = 'danger'
        ElMessage.error(`MQTT错误: ${err.message}`)
      })
      
      client.on('close', () => {
        console.log('MQTT连接关闭')
        mqttConnected.value = false
        connecting.value = false
        connectionStatus.text = '已断开'
        connectionStatus.type = 'danger'
      })
    } catch (error) {
      console.error('MQTT连接失败:', error)
      connecting.value = false
      connectionStatus.text = '连接失败'
      connectionStatus.type = 'danger'
      ElMessage.error(`MQTT连接失败: ${error.message}`)
    }
  }
  
  // 断开MQTT连接
  const disconnectMqtt = () => {
    return new Promise((resolve) => {
      if (mqtt && client && client.connected) {
        client.end(true, {}, () => {
          mqttConnected.value = false
          connectionStatus.text = '未连接'
          connectionStatus.type = 'danger'
          
          // 设置数据超时状态，使显示停止更新
          
          ElMessage.warning('MQTT连接已断开')
          resolve()
        })
      } else {
        mqttConnected.value = false
        connectionStatus.text = '未连接'
        connectionStatus.type = 'danger'
        
        // 设置数据超时状态，使显示停止更新
        
        ElMessage.warning('MQTT连接已断开')
        resolve()
      }
    })
  }
  
  // 应用服务器预设
  const applyServerPreset = (preset) => {
    connectionForm.broker = preset.broker
    connectionForm.username = preset.username
    connectionForm.password = preset.password
    connectionForm.topic = preset.topic
    ElMessage.success(`已应用服务器预设: ${preset.name}`)
  }
  
  return {
    mqttConnected,
    usingMqttLibrary,
    connecting,
    connectionStatus,
    connectionForm,
    serverPresets,
    connectMqtt,
    disconnectMqtt,
    applyServerPreset,
    initMqtt
  }
} 