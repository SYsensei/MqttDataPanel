import { ref, reactive } from 'vue'
import { ElMessage } from 'element-plus'

export function useMqttService() {
  const mqttClient = ref(null)
  const mqttConnected = ref(false)
  const connecting = ref(false)
  
  const connectionStatus = reactive({
    text: '未连接',
    type: 'danger'
  })
  
  // 添加处理MQTT消息的回调函数
  let messageProcessor = null;
  
  // 添加设置数据超时的回调函数
  let timeoutHandler = null;
  
  // 添加处理MQTT消息的函数
  const processHexData = (message) => {
    if (messageProcessor && typeof messageProcessor === 'function') {
      messageProcessor(message);
    } else {
      console.warn('MQTT消息处理器未设置，消息未被处理');
    }
  }
  
  // 添加设置数据超时的函数
  const setDataTimeout = (handler) => {
    if (handler && typeof handler === 'function') {
      timeoutHandler = handler;
    }
    
    if (timeoutHandler && typeof timeoutHandler === 'function') {
      timeoutHandler();
    } else {
      console.warn('数据超时处理器未设置');
    }
  }
  
  // MQTT连接表单
  const connectionForm = reactive({
    broker: 'wss://broker.emqx.io:8084/mqtt',
    port: 8084,
    username: '',
    password: '',
    ssl: true,
    topic: 'jmjdoor'
  })
  
  // 服务器预设
  const serverPresets = [
    {
      name: '默认服务器(安全连接)',
      broker: 'wss://broker.emqx.io:8084/mqtt',
      username: '',
      password: '',
      topic: 'jmjdoor'
    },
    {
      name: '备用服务器',
      broker: 'wss://broker.hivemq.com:8884',
      username: '',
      password: '',
      topic: 'jmjdoor'
    },
    {
      name: '仅本地开发(非安全)',
      broker: 'ws://broker.emqx.io:8083/mqtt',
      username: '',
      password: '',
      topic: 'jmjdoor'
    }
  ]
  
  // 初始化MQTT库
  const initMqtt = async () => {
    try {
      // 检查全局MQTT
      if (window.mqtt && typeof window.mqtt.connect === 'function') {
        console.log('使用全局MQTT对象')
        return window.mqtt
      }
      
      // 尝试本地导入
      const mqttModule = await import('mqtt')
      console.log('本地导入MQTT:', mqttModule)
      
      // 检查并返回正确的MQTT库对象
      if (typeof mqttModule.connect === 'function') {
        return mqttModule
      } else if (typeof mqttModule.default?.connect === 'function') {
        return mqttModule.default
      } else {
        throw new Error('找不到MQTT connect方法')
      }
    } catch (error) {
      console.warn('MQTT导入失败:', error)
      ElMessage.error('MQTT库加载失败，请检查网络或刷新页面重试')
      return null
    }
  }
  
  // 连接MQTT
  const connectMqttService = async (messageCallback) => {
    // 保存消息处理回调
    if (typeof messageCallback === 'function') {
      messageProcessor = messageCallback;
    }
    
    if (connecting.value) {
      console.log('MQTT连接正在进行中，忽略重复请求')
      return
    }
    
    if (mqttConnected.value) {
      console.log('MQTT已连接，先断开连接')
      await disconnectMqttService()
    }
    
    connecting.value = true
    
    try {
      // 初始化MQTT库
      const mqtt = await initMqtt()
      if (!mqtt) {
        console.error('MQTT初始化失败')
        connecting.value = false
        return
      }
      
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
      
      // 重要：保存客户端连接实例
      mqttClient.value = mqtt.connect(connectionForm.broker, options)
      
      // 设置连接事件监听
      mqttClient.value.on('connect', () => {
        console.log('MQTT连接成功')
        mqttConnected.value = true
        connecting.value = false
        connectionStatus.text = '已连接'
        connectionStatus.type = 'success'
        ElMessage.success('MQTT连接成功')
        
        // 订阅主题
        mqttClient.value.subscribe(connectionForm.topic, (err) => {
          if (err) {
            console.error(`订阅主题失败: ${err.message}`)
            ElMessage.error(`订阅主题失败: ${err.message}`)
          } else {
            console.log(`成功订阅主题: ${connectionForm.topic}`)
          }
        })
      })
      
      // 设置消息接收事件监听
      mqttClient.value.on('message', (topic, message) => {
        console.log('收到MQTT消息:', topic)
        // 调用数据处理回调
        if (typeof messageProcessor === 'function') {
          messageProcessor(message)
        }
      })
      
      // 设置错误事件监听
      mqttClient.value.on('error', (err) => {
        console.error('MQTT错误:', err)
        connecting.value = false
        connectionStatus.text = '连接错误'
        connectionStatus.type = 'danger'
        ElMessage.error(`MQTT错误: ${err.message}`)
      })
      
      // 设置连接关闭事件监听
      mqttClient.value.on('close', () => {
        console.log('MQTT连接关闭')
        mqttConnected.value = false
        connecting.value = false
        connectionStatus.text = '已断开'
        connectionStatus.type = 'danger'
        
        // 设置数据超时
        if (timeoutHandler && typeof timeoutHandler === 'function') {
          timeoutHandler();
        }
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
  const disconnectMqttService = () => {
    return new Promise((resolve) => {
      if (mqttClient.value && mqttClient.value.connected) {
        console.log('断开MQTT连接...')
        
        mqttClient.value.end(true, {}, () => {
          mqttConnected.value = false
          connectionStatus.text = '未连接'
          connectionStatus.type = 'danger'
          
          // 设置数据超时状态，使显示停止更新
          if (timeoutHandler && typeof timeoutHandler === 'function') {
            timeoutHandler();
          }
          
          ElMessage.warning('MQTT连接已断开')
          resolve()
        })
      } else {
        console.log('MQTT未连接或客户端不存在，无需断开')
        mqttConnected.value = false
        connectionStatus.text = '未连接'
        connectionStatus.type = 'danger'
        
        // 设置数据超时状态，使显示停止更新
        if (timeoutHandler && typeof timeoutHandler === 'function') {
          timeoutHandler();
        }
        
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
    mqttClient,
    mqttConnected,
    connecting,
    connectionStatus,
    connectionForm,
    serverPresets,
    connectMqttService,
    disconnectMqttService,
    applyServerPreset,
    initMqtt,
    processHexData,
    setDataTimeout
  }
} 