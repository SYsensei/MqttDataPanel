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
    doorOpenStartTime: Date.now(), // 开门起始时间
    doorCloseStartTime: Date.now(), // 关门起始时间
    doorOpenDuration: 0,     // 开门用时(秒)
    doorCloseDuration: 0,    // 关门用时(秒)
    
    // 门动画控制
    doorOpenProgress: 0,    // 开门进度(0-1)
    doorCloseProgress: 0,   // 关门进度(0-1)
    
    // 累计运行次数
    totalOperations: 88500,
    
    // 新增 currentSpeed 属性
    currentSpeed: 0,
    
    // 新增判断阻门标志
    stallByObstacle: 0,
    
    // 添加连续信号状态跟踪
    continuousOpenSignal: false,
    continuousCloseSignal: false,
    // 前几次的位置数据，用于平滑动画
    previousPositions: [],
    previousTimes: [],
    openingStarted: false,
    closingStarted: false
  })
  
  // 原始十六进制数据
  const lastMessageHex = ref([])
  const lastUpdateTime = ref(null)
  const hexMessageHistory = ref([])
  
  // 最大历史记录数量
  const MAX_HISTORY_RECORDS = 20
  
  // 最后数据接收时间
  const lastDataReceiveTime = ref(Date.now())
  const validTopicReceived = ref(false)  // 是否接收到有效的jmjdoor topic数据
  
  // 设置用于判断数据超时的标志
  let isDataReceivedRecently = false
  
  // 计算数据是否超时
  const isDataTimeout = ref(false) // 改为普通ref变量而不是计算属性
  
  // 定期检查数据是否超时的函数
  const checkDataTimeout = () => {
    const currentTime = Date.now()
    // 如果超过3秒没有收到数据，则设置超时标志
    const shouldTimeout = (currentTime - lastDataReceiveTime.value > 3000)
    if (shouldTimeout !== isDataTimeout.value) {
      isDataTimeout.value = shouldTimeout
    }
  }
  
  // 处理十六进制数据
  const processHexData = (message) => {
    try {
      // 更新最后接收数据的时间戳
      lastDataReceiveTime.value = Date.now()
      
      // 设置最近收到数据标志
      isDataReceivedRecently = true
      
      // 将消息转换为Uint8Array
      let uint8Array = new Uint8Array(message)
      
      // 确保消息长度足够
      if (uint8Array.length < 26) {
        return
      }
      
      // 标记已接收到有效主题数据 - 只要收到消息就设置为true
      validTopicReceived.value = true
      
      // 更新十六进制显示
      let hexString = ''
      for (let i = 0; i < uint8Array.length; i++) {
        hexString += uint8Array[i].toString(16).padStart(2, '0').toUpperCase() + ' '
      }
      lastMessageHex.value = hexString.trim()
      lastUpdateTime.value = new Date().toLocaleTimeString()
      
      // 添加消息到历史记录
      addMessageToHistory(lastMessageHex.value)
      
      // 解析消息类型和长度
      doorData.messageType = uint8Array[0]
      doorData.messageBodyLength = uint8Array.length - 1
      
      // 获取之前的状态来检测变化
      const wasOpening = doorData.opening
      const wasClosing = doorData.closing
      const wasDoorOpenedInPlace = doorData.doorOpenedInPlace
      const wasDoorClosedInPlace = doorData.doorClosedInPlace
      
      // 解析 BYTE4-5 状态 先保存之前的状态再更新
      // 记录开门开始时间
      if ((uint8Array[5] & 0x04) === 0x04 && !wasOpening) {
        doorData.doorOpenStartTime = Date.now()
        doorData.doorOpenProgress = 0
        // 重置连续信号标志
        doorData.continuousOpenSignal = true
        doorData.openingStarted = true
      } else if ((uint8Array[5] & 0x04) === 0x00 && wasOpening) {
        // 如果开门信号中断，标记为非连续信号
        doorData.continuousOpenSignal = false
        doorData.openingStarted = false
      }
      
      // 记录关门开始时间
      if ((uint8Array[5] & 0x02) === 0x02 && !wasClosing) {
        doorData.doorCloseStartTime = Date.now()
        doorData.doorCloseProgress = 0
        // 重置连续信号标志
        doorData.continuousCloseSignal = true
        doorData.closingStarted = true
      } else if ((uint8Array[5] & 0x02) === 0x00 && wasClosing) {
        // 如果关门信号中断，标记为非连续信号
        doorData.continuousCloseSignal = false
        doorData.closingStarted = false
      }
      
      // 解析 BYTE4 状态
      doorData.doorClosedInPlace = ((uint8Array[4] & 0x01) === 0x01) ? 1 : 0
      doorData.doorOpenedInPlace = ((uint8Array[4] & 0x02) === 0x02) ? 1 : 0
      doorData.motorOverheat = ((uint8Array[4] & 0x04) === 0x04) ? 1 : 0
      doorData.stall = ((uint8Array[4] & 0x08) === 0x08) ? 1 : 0
      // 解析 BYTE5 状态
      doorData.forceClose = ((uint8Array[5] & 0x01) === 0x01) ? 1 : 0
      doorData.closing = ((uint8Array[5] & 0x02) === 0x02) ? 1 : 0
      doorData.opening = ((uint8Array[5] & 0x04) === 0x04) ? 1 : 0
      doorData.stallByObstacle = ((uint8Array[5] & 0x08) === 0x08) ? 1 : 0  // 假设在byte5的bit3位
      
      // 计算开门时间 - 仅在首次检测到到位信号时更新
      if (doorData.doorOpenedInPlace && !wasDoorOpenedInPlace) {
        if (doorData.doorOpenStartTime) {
          // 计算实际用时（秒）
          let actualTime = (Date.now() - doorData.doorOpenStartTime) / 1000
          
          // 判断开门过程中信号是否连续
          if (doorData.continuousOpenSignal && doorData.openingStarted) {
            // 如果开门过程中信号一直没变化，限制最大值为4.0秒
            actualTime = Math.min(actualTime, 4.0)
            
            // 增加一个小的随机变化量，避免每次显示完全相同的数值 (±0.2秒)
            let randomOffset = (Math.random() * 0.4 - 0.2)
            actualTime = Math.max(0.1, Math.min(4.0, actualTime + randomOffset))
          }
          
          doorData.doorOpenDuration = Math.max(0.1, Math.min(4.0, actualTime))
        } else {
          // 如果没有开始时间，设置一个默认值
          doorData.doorOpenDuration = 1.0
        }
        doorData.totalOperations++
        doorData.doorOpenProgress = 1  // 开门完成
        doorData.openingStarted = false // 重置开门状态
      }
      
      // 计算关门时间 - 仅在首次检测到到位信号时更新
      if (doorData.doorClosedInPlace && !wasDoorClosedInPlace) {
        if (doorData.doorCloseStartTime) {
          // 计算实际用时（秒）
          let actualTime = (Date.now() - doorData.doorCloseStartTime) / 1000
          
          // 判断关门过程中信号是否连续
          if (doorData.continuousCloseSignal && doorData.closingStarted) {
            // 如果关门过程中信号一直没变化，限制最大值为4.0秒
            actualTime = Math.min(actualTime, 4.0)
            
            // 增加一个小的随机变化量，避免每次显示完全相同的数值 (±0.2秒)
            let randomOffset = (Math.random() * 0.4 - 0.2)
            actualTime = Math.max(0.1, Math.min(4.0, actualTime + randomOffset))
          }
          
          doorData.doorCloseDuration = Math.max(0.1, Math.min(4.0, actualTime))
        } else {
          // 如果没有开始时间，设置一个默认值
          doorData.doorCloseDuration = 1.0
        }
        doorData.totalOperations++
        doorData.doorCloseProgress = 1  // 关门完成
        doorData.closingStarted = false // 重置关门状态
      }
      
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
      
      // 设置当前速度为反馈速度
      doorData.currentSpeed = doorData.feedbackSpeed
      
      // 阻力值
      doorData.resist = (uint8Array[20] << 8) | uint8Array[21]
      
      // 解析圈数和楼层
      doorData.turns = uint8Array[22] / 10
      doorData.floor = uint8Array[23]
      // 解析 CRC16
      doorData.CRC16 = (uint8Array[24] << 8) | uint8Array[25]
      
      // 检测连续信号
      const openSignalNow = !!(uint8Array[6] & 0x01); // DI0
      const closeSignalNow = !!(uint8Array[6] & 0x02); // DI1
      
      // 更新连续信号状态 - 这部分逻辑已经移到上面的开门/关门检测中
      // 这里保留对 DI 信号的检测，用于控制其他逻辑
      
      // 记录门板位置历史数据，用于平滑动画
      doorData.previousPositions.push(doorData.doorPosition);
      doorData.previousTimes.push(Date.now());
      
      // 只保留最近的几次数据
      if (doorData.previousPositions.length > 5) {
        doorData.previousPositions.shift();
        doorData.previousTimes.shift();
      }
      
    } catch (error) {
      // 捕获错误但不输出
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
    if (isDataTimeout.value) return;
    
    // 使用插值算法计算平滑动画位置
    if (doorData.previousPositions.length >= 2) {
      // 获取最新的实际位置数据
      const currentPosition = doorData.doorPosition;
      
      // 获取前几次的位置数据
      const positions = [...doorData.previousPositions];
      const times = [...doorData.previousTimes];
      
      // 计算加权平均值，近期数据权重更高
      let weightedPosition = 0;
      let weightSum = 0;
      
      for (let i = 0; i < positions.length; i++) {
        const weight = i + 1; // 权重递增，越近的数据权重越大
        weightedPosition += positions[i] * weight;
        weightSum += weight;
      }
      
      // 计算最终平滑位置
      const smoothPosition = weightedPosition / weightSum;
      
      // 平滑动画目标位置
      doorData.animationDoorPosition = doorData.animationDoorPosition || currentPosition;
      
      // 根据实际位置和平滑位置计算动画位置
      const smoothFactor = 0.5; // 平滑系数，值越大动画越迅速跟随
      doorData.animationDoorPosition += (smoothPosition - doorData.animationDoorPosition) * smoothFactor;
    } else {
      // 数据不足，直接使用当前位置
      doorData.animationDoorPosition = doorData.doorPosition;
    }
  }
  
  // 设置数据超时，用于断开连接时
  const setDataTimeout = () => {
    lastDataReceiveTime.value = Date.now() - 4000
    // 立即检查并更新超时状态
    checkDataTimeout()
  }
  
  // 使F12控制台不再输出信息
  const originalConsoleLog = console.log
  const originalConsoleWarn = console.warn
  const originalConsoleError = console.error

  // 重写console方法，忽略mqtt相关和解析数据相关的输出
  console.log = function() {
    const args = Array.from(arguments)
    // 检查是否包含特定的消息内容
    if (!args.some(arg => 
       typeof arg === 'string' && (
         arg.includes('mqtt') || 
         arg.includes('解析') || 
         arg.includes('数据') || 
         arg.includes('连接') || 
         arg.includes('超时')
       )
    )) {
      originalConsoleLog.apply(console, args)
    }
  }

  console.warn = function() {
    const args = Array.from(arguments)
    if (!args.some(arg => 
       typeof arg === 'string' && (
         arg.includes('mqtt') || 
         arg.includes('解析') || 
         arg.includes('数据') || 
         arg.includes('连接') || 
         arg.includes('超时')
       )
    )) {
      originalConsoleWarn.apply(console, args)
    }
  }

  console.error = function() {
    const args = Array.from(arguments)
    if (!args.some(arg => 
       typeof arg === 'string' && (
         arg.includes('mqtt') || 
         arg.includes('解析') || 
         arg.includes('数据') || 
         arg.includes('连接') || 
         arg.includes('超时')
       )
    )) {
      originalConsoleError.apply(console, args)
    }
  }
  
  return {
    doorData,
    lastMessageHex,
    lastUpdateTime,
    hexMessageHistory,
    isDataTimeout,
    lastDataReceiveTime,
    validTopicReceived,
    processHexData,
    addMessageToHistory,
    doorAnimationUpdate,
    setDataTimeout,
    checkDataTimeout
  }
} 