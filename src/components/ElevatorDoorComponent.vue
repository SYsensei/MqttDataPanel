<template>
  <div class="elevator-door-container">
    <!-- 楼层显示 -->
    <div class="floor-display-area">
      <div class="floor-direction left" :class="{ active: isUpActive }">
        <div class="arrow-up"></div>
      </div>
      <div class="floor-display-panel">
        <div class="floor-number-box">
          <div class="floor-number">{{ floorNumber || '12' }}</div>
        </div>
      </div>
      <div class="floor-direction right" :class="{ active: isDownActive }">
        <div class="arrow-down"></div>
      </div>
    </div>
    
    <!-- 电梯门 -->
    <div class="elevator-door-area">
      <div class="elevator-door">
        <div class="door-left" :style="doorLeftStyle"></div>
        <div class="door-right" :style="doorRightStyle"></div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed, ref, watch, onMounted, onUnmounted } from 'vue'

// 接收门数据作为属性
const props = defineProps({
  doorData: {
    type: Object,
    required: true
  },
  isDataTimeout: {
    type: Boolean,
    default: false
  },
  isAdminMode: {
    type: Boolean,
    default: false
  }
})

// 记录最大门位置
const maxDoorPosition = ref(900)

// 楼层相关数据
const currentFloor = ref(1)
const isGoingUp = ref(true)
const lastLockCircuitState = ref(false)

// 用于存储门位置历史数据的数组
const positionHistory = ref([])
const maxHistoryPoints = 100 // 增加历史点数量
const chartWidth = ref(600) // 图表初始宽度(px)
const pointWidth = 12 // 每个数据点的宽度(px)
const autoScroll = ref(true) // 是否自动滚动

// 创建对滚动容器的引用
const chartScrollContainer = ref(null)

// 插值动画相关变量
const currentDoorPosition = ref(0) // 当前显示的门位置插值
const targetDoorPosition = ref(0)  // 目标门位置
const interpolationSpeed = 0.5     // 增大插值速度系数以更快响应

// 声明动画和记录器变量
let animationFrame = null
let positionRecorder = null

// 添加楼层变化状态标志和计时器
const isFloorChanging = ref(false);
const floorChangeTimer = ref(null);
const totalFloorsToChange = ref(0); // 总共需要变化的楼层数
const remainingFloors = ref(0);     // 剩余需要变化的楼层数

// 监听门锁回路状态变化和楼层更新
watch(() => [props.doorData.doorPosition < 20, props.doorData.DO1], ([isDoorLocked, isDoorClosed]) => {
  // 只有当门锁回路和关门到位信号同时为真时才触发
  const shouldStartFloorChange = isDoorLocked && isDoorClosed && !props.isDataTimeout;
  
  // 只在两个条件同时从假变为真时才处理
  if (shouldStartFloorChange && !lastLockCircuitState.value) {
    // 门锁回路和关门到位同时满足，开始楼层变化过程
    isFloorChanging.value = true;
    
    // 设置一个延时，2秒后开始楼层变化
    setTimeout(() => {
      // 固定变化3层，不再随机
      totalFloorsToChange.value = 3;
      remainingFloors.value = totalFloorsToChange.value;
      
      // 开始楼层变化，每两秒变化一层
      changeFloor();
    }, 2000); // 延时2秒后更新楼层
  }
  // 更新门锁回路状态记录
  lastLockCircuitState.value = shouldStartFloorChange;
}, { deep: true })

// 楼层变化函数
function changeFloor() {
  if (remainingFloors.value <= 0) {
    // 所有楼层变化完成后，两秒后熄灭方向灯
    floorChangeTimer.value = setTimeout(() => {
      isFloorChanging.value = false; // 停止变化过程，熄灭方向灯
    }, 2000);
    return;
  }
  
  // 检查上行或下行
  if (isGoingUp.value) {
    // 上行，楼层增加
    if (currentFloor.value < 19) {
      currentFloor.value += 1; // 一次只改变一层
      // 只在内部更新楼层，不触发其他组件更新
    } else {
      // 达到最高楼层，改变方向
      isGoingUp.value = false;
      // 延迟两秒再开始下行
      floorChangeTimer.value = setTimeout(() => {
        currentFloor.value -= 1;
        remainingFloors.value -= 1;
        
        // 如果还有剩余楼层，继续变化
        if (remainingFloors.value > 0) {
          floorChangeTimer.value = setTimeout(changeFloor, 2000);
        } else {
          // 变化完成，两秒后熄灭方向灯
          floorChangeTimer.value = setTimeout(() => {
            isFloorChanging.value = false;
          }, 2000);
        }
      }, 2000);
      return;
    }
  } else {
    // 下行，楼层减少
    if (currentFloor.value > 1) {
      currentFloor.value -= 1; // 一次只改变一层
      // 只在内部更新楼层，不触发其他组件更新
    } else {
      // 达到最低楼层，改变方向
      isGoingUp.value = true;
      // 延迟两秒再开始上行
      floorChangeTimer.value = setTimeout(() => {
        currentFloor.value += 1;
        remainingFloors.value -= 1;
        
        // 如果还有剩余楼层，继续变化
        if (remainingFloors.value > 0) {
          floorChangeTimer.value = setTimeout(changeFloor, 2000);
        } else {
          // 变化完成，两秒后熄灭方向灯
          floorChangeTimer.value = setTimeout(() => {
            isFloorChanging.value = false;
          }, 2000);
        }
      }, 2000);
      return;
    }
  }
  
  // 减少剩余楼层数
  remainingFloors.value -= 1;
  
  // 如果还有剩余楼层，两秒后继续变化
  if (remainingFloors.value > 0) {
    floorChangeTimer.value = setTimeout(changeFloor, 2000);
  } else {
    // 变化完成，两秒后熄灭方向灯
    floorChangeTimer.value = setTimeout(() => {
      isFloorChanging.value = false;
    }, 2000);
  }
}

// 监听门位置的变化，更新目标位置
watch(() => props.doorData.doorPosition, (newValue) => {
  if (!props.isDataTimeout && newValue !== undefined) {
    targetDoorPosition.value = newValue
    
    // 如果变化很大，直接设置当前位置接近目标值，减少追赶时间
    const diff = Math.abs(targetDoorPosition.value - currentDoorPosition.value)
    if (diff > 20) { // 降低大幅变化判断阈值，使更多变化能快速响应
      currentDoorPosition.value = targetDoorPosition.value - (targetDoorPosition.value > currentDoorPosition.value ? 10 : -10)
    }
  }
})

// 动画循环函数，使用插值进行平滑过渡
function animatePosition() {
  // 计算当前显示位置与目标位置之间的差值
  const diff = targetDoorPosition.value - currentDoorPosition.value
  
  // 应用插值，创建平滑过渡
  if (Math.abs(diff) > 0.1) {
    // 使用更小的速度系数，使动画更平滑
    const speed = Math.min(Math.abs(diff) * 0.05 + 0.1, 0.3) // 降低速度系数和最大速度
    currentDoorPosition.value += diff * speed
  } else {
    currentDoorPosition.value = targetDoorPosition.value
  }
  
  // 继续下一帧动画
  animationFrame = requestAnimationFrame(animatePosition)
}

// 在组件挂载时启动动画循环
onMounted(() => {
  // 初始化楼层数据
  currentFloor.value = 1
  isGoingUp.value = true
  lastLockCircuitState.value = false
  
  // 只在管理员模式下启动记录器
  if (props.isAdminMode) {
    positionRecorder = setInterval(() => {
      if (!props.isDataTimeout) {
        // 添加新的位置数据
        const currentPosition = props.doorData.doorPosition || 0
        positionHistory.value.push(currentPosition)
        
        // 当数据点超过显示区域宽度时，增加图表宽度
        if (positionHistory.value.length * pointWidth > chartWidth.value && autoScroll.value) {
          chartWidth.value = positionHistory.value.length * pointWidth
          
          // 自动滚动到最新数据点
          if (chartScrollContainer.value) {
            setTimeout(() => {
              chartScrollContainer.value.scrollLeft = chartWidth.value
            }, 50)
          }
        }
      }
    }, 50)
  }
  
  // 启动动画循环
  animationFrame = requestAnimationFrame(animatePosition)
})

// 在组件卸载时清除计时器和动画循环
onUnmounted(() => {
  if (positionRecorder) {
    clearInterval(positionRecorder)
  }
  if (animationFrame) {
    cancelAnimationFrame(animationFrame)
  }
  if (floorChangeTimer.value) {
    clearTimeout(floorChangeTimer.value)
  }
})

// 计算当前楼层
const floorNumber = computed(() => {
  // 如果数据超时，显示0
  if (props.isDataTimeout) return '0';
  
  // 始终使用内部管理的楼层（模拟楼层）
  return currentFloor.value.toString();
})

// 计算上行和下行灯状态
const isUpActive = computed(() => {
  // 只在门锁回路通了并且正在上行时才亮起，但在变化结束后熄灭
  return isGoingUp.value && props.doorData.doorPosition < 20 && !props.isDataTimeout && isFloorChanging.value;
})

const isDownActive = computed(() => {
  // 只在门锁回路通了并且正在下行时才亮起，但在变化结束后熄灭
  return !isGoingUp.value && props.doorData.doorPosition < 20 && !props.isDataTimeout && isFloorChanging.value;
})

// 门位置文本
const doorPositionText = computed(() => {
  return `${currentDoorPosition.value.toFixed(1)}mm / ${maxDoorPosition.value}mm`
})

// 门开启百分比，用于进度条显示
const doorOpenPercentage = computed(() => {
  if (props.isDataTimeout) return 0
  // 使用插值后的currentDoorPosition计算百分比
  const percentage = (currentDoorPosition.value / maxDoorPosition.value) * 100
  return Math.min(100, Math.max(0, percentage))
})

// 门到位状态
const isDoorOpenedInPlace = computed(() => {
  return currentDoorPosition.value > 850 && !props.isDataTimeout
})

const isDoorClosedInPlace = computed(() => {
  return currentDoorPosition.value < 20 && !props.isDataTimeout
})

// 门开启百分比计算，用于动画
const doorOpenPosition = computed(() => {
  // 数据超时时不更新门位置
  if (props.isDataTimeout) {
    return 0
  }
  
  // 如果发现新的最大位置，更新参考值
  if (props.doorData.doorPosition > maxDoorPosition.value) {
    maxDoorPosition.value = props.doorData.doorPosition
  }
  
  // 使用插值后的currentDoorPosition计算开门百分比
  return doorOpenPercentage.value
})

// 计算图表点坐标
const chartPoints = computed(() => {
  if (positionHistory.value.length === 0) {
    return ''
  }
  
  // 计算x和y坐标
  return positionHistory.value.map((position, index) => {
    // x坐标: 每个点占固定宽度，固定间隔
    const x = index * pointWidth
    
    // y坐标: 根据门位置计算，0是最下面，最大值是最上面（反转SVG的Y轴）
    const y = 150 - (position / maxDoorPosition.value) * 150
    
    return `${x},${y}`
  }).join(' ')
})

// 计算门的动画样式
const doorLeftStyle = computed(() => {
  // 使用平滑动画位置
  const animationPosition = props.doorData.animationDoorPosition || props.doorData.doorPosition;
  
  // 开门：按照maxDoorPosition(900mm)计算百分比
  // 转换为CSS中的百分比位置，关闭时为0%，完全打开时为100%（左门）
  const openPercentage = (animationPosition / 900) * 100; // 0-100%
  
  if (props.isDataTimeout) {
    return {
      transform: `translateX(-5%)`,
      transition: 'transform 0.5s ease'
    }
  }
  
  return {
    transform: `translateX(-${openPercentage}%)`,
    transition: 'transform 0.5s linear' // 使用线性过渡
  }
})

const doorRightStyle = computed(() => {
  // 使用平滑动画位置
  const animationPosition = props.doorData.animationDoorPosition || props.doorData.doorPosition;
  
  // 开门：按照maxDoorPosition(900mm)计算百分比
  // 转换为CSS中的百分比位置，关闭时为0%，完全打开时为100%（右门）
  const openPercentage = (animationPosition / 900) * 100; // 0-100%
  
  if (props.isDataTimeout) {
    return {
      transform: `translateX(5%)`,
      transition: 'transform 0.5s ease'
    }
  }
  
  return {
    transform: `translateX(${openPercentage}%)`,
    transition: 'transform 0.5s linear' // 使用线性过渡
  }
})

// 将currentFloor暴露给父组件
defineExpose({
  currentFloor
})
</script>

<style scoped>
/* 电梯门样式 */
.elevator-door-container {
  width: 100%;
  height: 100%;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
}

/* 楼层显示区域 */
.floor-display-area {
  width: 100%;
  display: flex;
  justify-content: center;
  align-items: center;
  padding-bottom: 6px;
  margin-bottom: 2px;
  position: relative;
  height: 50px;
}

.floor-display-area::after {
  content: '';
  display: block;
  width: 70%;
  height: 1px;
  background-color: #1e3a8a;
  position: absolute;
  bottom: 0;
  left: 50%;
  transform: translateX(-50%);
}

.floor-display-panel {
  width: 60px;
  height: 50px;
  background-color: #061230;
  border-radius: 8px;
  border: 2px solid #3a5fc4;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  box-shadow: 0 0 15px rgba(74, 109, 255, 0.6);
  margin: 0 15px;
}

.floor-number-box {
  width: 45px;
  height: 32px;
  background-color: #0a1a40;
  border-radius: 4px;
  display: flex;
  align-items: center;
  justify-content: center;
  border: 1px solid #3a5fc4;
}

.floor-number {
  font-size: 24px;
  font-weight: bold;
  color: #4d77f9;
  text-shadow: 0 0 10px rgba(77, 119, 249, 0.7);
}

.floor-direction {
  font-size: 18px;
  color: #4d77f9;
  background-color: #061230;
  border-radius: 50%;
  width: 36px;
  height: 36px;
  display: flex;
  align-items: center;
  justify-content: center;
  border: 2px solid #3a5fc4;
  box-shadow: 0 0 10px rgba(74, 109, 255, 0.5);
  opacity: 0.4;
  transition: all 0.3s ease;
}

.floor-direction.active {
  opacity: 1;
  box-shadow: 0 0 15px rgba(74, 109, 255, 0.8);
}

.floor-direction.left {
  margin-right: 10px;
}

.floor-direction.right {
  margin-left: 10px;
}

.floor-direction i {
  font-size: 20px;
}

.arrow-up {
  width: 0;
  height: 0;
  border-left: 8px solid transparent;
  border-right: 8px solid transparent;
  border-bottom: 16px solid #4d77f9;
}

.arrow-down {
  width: 0;
  height: 0;
  border-left: 8px solid transparent;
  border-right: 8px solid transparent;
  border-top: 16px solid #4d77f9;
}

/* 电梯门区域 */
.elevator-door-area {
  width: 100%;
  max-width: 320px;
  margin: 0 auto;
  position: relative;
  height: 250px;
  border-radius: 8px;
  overflow: hidden;
  box-sizing: border-box;
  display: flex;
  justify-content: center;
  align-items: flex-start;
  padding-top: 3px;
}

.elevator-door {
  width: 70%;
  height: 225px;
  position: relative;
  background-color: #0a1a40;
  z-index: 1;
  overflow: hidden;
  display: flex;
  justify-content: center;
  align-items: center;
  border-radius: 5px;
  border: 1px solid #1e3a8a;
  margin-top: 5px;
}

.door-left, .door-right {
  position: absolute;
  top: 0;
  width: 50%;
  height: 100%;
  background-color: #1e3a8a;
  z-index: 2;
  box-shadow: 0 0 10px rgba(0, 0, 0, 0.5);
  transform-origin: left;
  will-change: transform; /* 优化性能 */
}

.door-left {
  left: 0;
  border-right: 1px solid #4d77f9;
}

.door-right {
  right: 0;
  border-left: 1px solid #4d77f9;
}



/* 媒体查询 - 小屏幕设备 */
@media (max-width: 576px) {
  .elevator-door-area {
    height: 260px;
    max-width: 100%;
  }
  
  .elevator-door {
    width: 80%;
    height: 230px;
  }
  
  .floor-display-area {
    padding-bottom: 10px;
    margin-bottom: 5px;
  }
  
  .floor-display-panel {
    width: 40px;
    height: 32px;
    margin: 0 8px;
  }
  
  .floor-number-box {
    width: 30px;
    height: 24px;
  }
  
  .floor-number {
    font-size: 16px;
  }
  
  .floor-direction {
    width: 28px;
    height: 28px;
  }
  
  .arrow-up, .arrow-down {
    border-left: 6px solid transparent;
    border-right: 6px solid transparent;
  }
  
  .arrow-up {
    border-bottom: 12px solid #4d77f9;
  }
  
  .arrow-down {
    border-top: 12px solid #4d77f9;
  }
}

/* 门位置指示灯 */
.door-status-indicators {
  position: absolute;
  bottom: 5px;
  left: 0;
  width: 100%;
  display: flex;
  justify-content: space-between;
  padding: 0 10px;
  box-sizing: border-box;
}

.door-indicator {
  background-color: #061230;
  color: #3a5fc4;
  border: 1px solid #3a5fc4;
  border-radius: 12px;
  padding: 2px 8px;
  font-size: 12px;
  opacity: 0.6;
  transition: all 0.3s;
}

.door-indicator.active {
  opacity: 1;
  background-color: #071328;
  color: #4d77f9;
  border-color: #4d77f9;
  box-shadow: 0 0 10px rgba(77, 119, 249, 0.5);
}

.door-indicator.open {
  margin-right: auto;
}

.door-indicator.close {
  margin-left: auto;
}
</style> 