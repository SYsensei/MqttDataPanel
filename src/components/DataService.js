import { ref, reactive, computed } from 'vue'

export function useDataService() {
  // 门开关进度模拟
  const doorData = reactive({
    messageType: 0,
    messageBodyLength: 0,
    doorClosedInPlace: 0,    // 关门到位
    doorOpenedInPlace: 0,    // 开门到位
    motorOverheat: 0,        // 电机过热
    stall: 0,                // 堵转
    forceClose: 0,           // 强制关门
    closing: 0,              // 关门中
    opening: 0,              // 开门中
    DI0: 0,                  // 普通DI0输入
    DI1: 0,                  // 普通DI1输入
    DI2: 0,                  // 普通DI2输入
    DI3: 0,                  // 普通DI3输入
    DI0_: 0,                 // 改为：门机同步带松动
    DI1_: 0,                 // 改为：层门开关闪断
    DI2_: 0,                 // 改为：门刀开关故障
    DI3_: 0,                 // 改为：烟囱效应产生
    DO0: 0,                  // 改为：开门到位端子输出状态
    DO1: 0,                  // 改为：关门到位端子输出状态
    DO2: 0,                  // 改为：电机过热端子输出状态
    busVoltage: 0,           // 母线电压
    IPMTemperature: 0,       // IPM温度
    faultCode: 0,            // 故障码
    givenSpeed: 0,           // 给定速度
    outputCurrent: 0,        // 输出电流
    doorPosition: 0,         // 门位置
    feedbackSpeed: 0,        // 反馈速度
    resist: 0,               // 电阻值
    turns: 0,                // 圈数
    floor: 0,                // 楼层
    CRC16: 0,                // CRC校验
    
    // 用于开关门时间计算
    doorOpenStartTime: null, // 开门起始时间
    doorCloseStartTime: null, // 关门起始时间
    doorOpenDuration: 0,     // 开门用时(秒)
    doorCloseDuration: 0,    // 关门用时(秒)
    
    // 门动画控制
    doorOpenProgress: 0,    // 开门进度(0-1)
    doorCloseProgress: 0,   // 关门进度(0-1)
    
    // 累计运行次数
    totalOperations: 88500
  })
  
  // 原始十六进制数据
  const lastMessageHex = ref([])
  const lastUpdateTime = ref(null)
  const hexMessageHistory = ref([])
  
  // 最大历史记录数量
  const MAX_HISTORY_RECORDS = 20
  
  // 最后数据接收时间
  const lastDataReceiveTime = ref(Date.now())
  
  // 检测数据是否超时（1秒无数据）
  const isDataTimeout = computed(() => {
    return Date.now() - lastDataReceiveTime.value > 1000
  })
  
  // 处理十六进制数据
  const processHexData = (message) => {
    try {
      // 更新最后数据接收时间
      lastDataReceiveTime.value = Date.now()
      
      // 转换为Uint8Array
      const uint8Array = new Uint8Array(message)
      
      // 保存原始十六进制数据用于显示
      lastMessageHex.value = Array.from(uint8Array).map(b => b.toString(16).padStart(2, '0').toUpperCase())
      
      // 更新最后接收时间，使用更精确的时间戳
      const now = new Date()
      lastUpdateTime.value = now.toLocaleTimeString('zh-CN', {
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
        hour12: false
      }) + '.' + now.getMilliseconds().toString().padStart(3, '0')
      
      // 添加消息到历史记录
      addMessageToHistory(lastMessageHex.value)
      
      // 解析消息类型
      doorData.messageType = (uint8Array[0] << 8) | uint8Array[1]
      // 解析消息体长度
      doorData.messageBodyLength = (uint8Array[2] << 8) | uint8Array[3]
      
      // 获取之前的状态来检测变化
      const wasOpening = doorData.opening
      const wasClosing = doorData.closing
      const wasDoorOpenedInPlace = doorData.doorOpenedInPlace
      const wasDoorClosedInPlace = doorData.doorClosedInPlace
      
      // 解析 BYTE4 状态
      doorData.doorClosedInPlace = ((uint8Array[4] & 0x01) === 0x01) ? 1 : 0
      doorData.doorOpenedInPlace = ((uint8Array[4] & 0x02) === 0x02) ? 1 : 0
      doorData.motorOverheat = ((uint8Array[4] & 0x04) === 0x04) ? 1 : 0
      doorData.stall = ((uint8Array[4] & 0x08) === 0x08) ? 1 : 0
      // 解析 BYTE5 状态
      doorData.forceClose = ((uint8Array[5] & 0x01) === 0x01) ? 1 : 0
      doorData.closing = ((uint8Array[5] & 0x02) === 0x02) ? 1 : 0
      doorData.opening = ((uint8Array[5] & 0x04) === 0x04) ? 1 : 0
      // 解析 BYTE6 输入端子状态
      doorData.DI0 = ((uint8Array[6] & 0x01) === 0x01) ? 1 : 0
      doorData.DI1 = ((uint8Array[6] & 0x02) === 0x02) ? 1 : 0
      doorData.DI2 = ((uint8Array[6] & 0x04) === 0x04) ? 1 : 0
      doorData.DI3 = ((uint8Array[6] & 0x08) === 0x08) ? 1 : 0
      // 以下根据需求重命名
      doorData.DI0_ = ((uint8Array[6] & 0x10) === 0x10) ? 1 : 0  // 门机同步带松动
      doorData.DI1_ = ((uint8Array[6] & 0x20) === 0x20) ? 1 : 0  // 层门开关闪断
      doorData.DI2_ = ((uint8Array[6] & 0x40) === 0x40) ? 1 : 0  // 门刀开关故障
      doorData.DI3_ = ((uint8Array[6] & 0x80) === 0x80) ? 1 : 0  // 烟囱效应产生
      // 解析 BYTE7 输出端子状态 - 重命名
      doorData.DO0 = ((uint8Array[7] & 0x01) === 0x01) ? 1 : 0   // 开门到位端子输出状态
      doorData.DO1 = ((uint8Array[7] & 0x02) === 0x02) ? 1 : 0   // 关门到位端子输出状态
      doorData.DO2 = ((uint8Array[7] & 0x04) === 0x04) ? 1 : 0   // 电机过热端子输出状态
      // 解析母线电压
      doorData.busVoltage = (uint8Array[8] << 8) | uint8Array[9]
      // 解析 IPM 温度
      doorData.IPMTemperature = uint8Array[10]
      // 解析故障码
      doorData.faultCode = uint8Array[11]
      // 解析给定速度
      doorData.givenSpeed = ((uint8Array[12] << 8) | uint8Array[13]) / 1000
      // 解析输出电流
      doorData.outputCurrent = ((uint8Array[14] << 8) | uint8Array[15]) / 100
      // 解析门位置 - 调整处理逻辑以匹配您的门位置数据
      doorData.doorPosition = ((uint8Array[16] << 8) | uint8Array[17]) / 10
      // 解析反馈速度
      doorData.feedbackSpeed = ((uint8Array[18] << 8) | uint8Array[19]) / 1000
      // 解析电阻
      doorData.resist = (uint8Array[20] << 8) | uint8Array[21]
      // 解析圈数和楼层
      doorData.turns = uint8Array[22] / 10
      doorData.floor = uint8Array[23]
      // 解析 CRC16
      doorData.CRC16 = (uint8Array[24] << 8) | uint8Array[25]
      
      // 记录开门开始时间
      if (doorData.opening && !wasOpening) {
        doorData.doorOpenStartTime = Date.now()
        doorData.doorOpenProgress = 0
      }
      
      // 记录关门开始时间
      if (doorData.closing && !wasClosing) {
        doorData.doorCloseStartTime = Date.now()
        doorData.doorCloseProgress = 0
      }
      
      // 计算开门时间
      if (doorData.doorOpenedInPlace && !wasDoorOpenedInPlace) {
        if (doorData.doorOpenStartTime) {
          doorData.doorOpenDuration = (Date.now() - doorData.doorOpenStartTime) / 1000
          doorData.totalOperations++
        }
        doorData.doorOpenProgress = 1  // 开门完成
      }
      
      // 计算关门时间
      if (doorData.doorClosedInPlace && !wasDoorClosedInPlace) {
        if (doorData.doorCloseStartTime) {
          doorData.doorCloseDuration = (Date.now() - doorData.doorCloseStartTime) / 1000
          doorData.totalOperations++
        }
        doorData.doorCloseProgress = 1  // 关门完成
      }
      
      // 只在开发环境下输出日志
      if (process.env.NODE_ENV === 'development') {
        console.log('门控数据解析完成:', doorData)
      }
    } catch (error) {
      console.error('处理十六进制数据错误:', error)
    }
  }
  
  // 添加消息到历史记录
  const addMessageToHistory = (hexData) => {
    const now = new Date()
    // 格式化时间到毫秒级
    const time = now.toLocaleTimeString('zh-CN', {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hour12: false
    }) + '.' + now.getMilliseconds().toString().padStart(3, '0')
    
    hexMessageHistory.value.unshift({
      time,
      data: [...hexData] // 完整显示数据
    })
    
    // 限制最大记录数
    if (hexMessageHistory.value.length > MAX_HISTORY_RECORDS) {
      hexMessageHistory.value = hexMessageHistory.value.slice(0, MAX_HISTORY_RECORDS)
    }
  }
  
  // 门动画更新函数
  const doorAnimationUpdate = () => {
    // 检查数据超时
    const currentTime = Date.now()
    const isTimeout = currentTime - lastDataReceiveTime.value > 1000
    
    // 如果数据超时，不进行动画更新
    if (isTimeout) {
      return
    }
    
    // 只更新开门和关门进度，不修改任何状态信号
    if (doorData.opening && !doorData.doorOpenedInPlace) {
      // 仅更新动画进度，不干扰其他状态
      doorData.doorOpenProgress = Math.min(1, doorData.doorOpenProgress + 0.02)
    } else if (doorData.closing && !doorData.doorClosedInPlace) {
      // 仅更新动画进度，不干扰其他状态
      doorData.doorCloseProgress = Math.min(1, doorData.doorCloseProgress + 0.02)
    }
  }
  
  // 设置数据超时，用于断开连接时
  const setDataTimeout = () => {
    lastDataReceiveTime.value = Date.now() - 2000
  }
  
  return {
    doorData,
    lastMessageHex,
    lastUpdateTime,
    hexMessageHistory,
    isDataTimeout,
    lastDataReceiveTime,
    processHexData,
    addMessageToHistory,
    doorAnimationUpdate,
    setDataTimeout
  }
} 