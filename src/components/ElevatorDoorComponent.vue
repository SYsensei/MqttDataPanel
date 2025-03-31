<template>
  <div class="elevator-door-container">
    <!-- 楼层显示 -->
    <div class="floor-display-area">
      <div class="floor-direction left">
        <i class="el-icon-top"></i>
      </div>
      <div class="floor-display-panel">
        <div class="floor-number-box">
          <div class="floor-number">{{ floorNumber || '12' }}</div>
        </div>
      </div>
      <div class="floor-direction right">
        <i class="el-icon-bottom"></i>
      </div>
    </div>
    
    <!-- 电梯门 -->
    <div class="elevator-door-area">
      <div class="elevator-door">
        <div class="door-left" :style="{ transform: `scaleX(${1 - doorOpenPosition/100})` }"></div>
        <div class="door-right" :style="{ transform: `scaleX(${1 - doorOpenPosition/100})` }"></div>
      </div>
    </div>
    
    <!-- 管理员模式：门位置详情和曲线图 -->
    <div class="admin-only-section" v-if="isAdminMode">
      <!-- 门位置数值信息 -->
      <div class="door-position-info">
        <div class="position-value">{{ doorPositionText }}</div>
        <div class="position-bar">
          <div class="position-fill" :style="{ width: `${doorOpenPercentage}%` }"></div>
        </div>
        <div class="position-percentage">{{ doorOpenPercentage.toFixed(1) }}%</div>
      </div>
      
      <!-- 门位置变化曲线图 -->
      <div class="door-position-chart-wrapper">
        <div class="chart-title">门位置变化曲线</div>
        <div class="door-position-chart">
          <div class="chart-y-axis">
            <div class="chart-y-label">{{ maxDoorPosition }}</div>
            <div class="chart-y-label">{{ Math.round(maxDoorPosition / 2) }}</div>
            <div class="chart-y-label">0</div>
          </div>
          <div class="chart-grid">
            <div class="chart-scroll-container" ref="chartScrollContainer">
              <svg :width="chartWidth + 'px'" height="150" class="position-chart-svg">
                <!-- 水平参考线 -->
                <line x1="0" y1="0" x2="100%" y2="0" class="chart-grid-line" />
                <line x1="0" y1="75" x2="100%" y2="75" class="chart-grid-line" />
                <line x1="0" y1="150" x2="100%" y2="150" class="chart-grid-line" />
                
                <!-- 位置曲线 -->
                <polyline :points="chartPoints" class="position-line" />
                
                <!-- 当前位置点 -->
                <circle v-if="chartPoints" 
                       :cx="chartPoints.split(' ').pop().split(',')[0]" 
                       :cy="chartPoints.split(' ').pop().split(',')[1]" 
                       r="4" 
                       class="current-position-point" />
              </svg>
            </div>
          </div>
        </div>
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
const maxDoorPosition = ref(490)

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
const interpolationSpeed = 0.08    // 插值速度系数

// 声明动画和记录器变量
let animationFrame = null
let positionRecorder = null

// 监听门位置的变化，更新目标位置
watch(() => props.doorData.doorPosition, (newValue) => {
  if (!props.isDataTimeout && newValue !== undefined) {
    targetDoorPosition.value = newValue
  }
})

// 动画循环函数，使用插值进行平滑过渡
function animatePosition() {
  // 计算当前显示位置与目标位置之间的差值
  const diff = targetDoorPosition.value - currentDoorPosition.value
  
  // 应用插值，创建平滑过渡
  if (Math.abs(diff) > 0.1) {
    currentDoorPosition.value += diff * interpolationSpeed
  } else {
    currentDoorPosition.value = targetDoorPosition.value
  }
  
  // 继续下一帧动画
  animationFrame = requestAnimationFrame(animatePosition)
}

// 在组件挂载时启动动画循环
onMounted(() => {
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
})

// 计算当前楼层
const floorNumber = computed(() => {
  return props.doorData.floor || '12'
})

// 门位置文本
const doorPositionText = computed(() => {
  return `${currentDoorPosition.value.toFixed(1)} / ${maxDoorPosition.value}`
})

// 门开启百分比，用于进度条显示
const doorOpenPercentage = computed(() => {
  if (props.isDataTimeout) return 0
  // 使用插值后的currentDoorPosition计算百分比
  const percentage = (currentDoorPosition.value / maxDoorPosition.value) * 100
  return Math.min(100, Math.max(0, percentage))
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
</script>

<style scoped>
/* 电梯门样式 */
.elevator-door-container {
  position: relative;
  width: 100%;
  max-width: 400px;
  margin: 0 auto;
  background-color: #132859;
  border-radius: 8px;
  padding: 20px 0;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.3);
  border: 1px solid #1e3a8a;
  display: flex;
  flex-direction: column;
  align-items: center;
  margin: 20px auto 30px auto;
  height: auto;
}

/* 楼层显示区域 */
.floor-display-area {
  width: 100%;
  display: flex;
  justify-content: center;
  align-items: center;
  padding-bottom: 20px;
  border-bottom: 1px solid #1e3a8a;
  margin-bottom: 20px;
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
}

.floor-direction.left {
  margin-right: 10px;
}

.floor-direction.right {
  margin-left: 10px;
}

/* 电梯门区域 */
.elevator-door-area {
  width: 100%;
  height: 240px;
  position: relative;
}

.elevator-door {
  position: absolute;
  top: 15px;
  left: 50%;
  transform: translateX(-50%);
  width: 60%;
  height: 170px;
  display: flex;
}

.door-left, .door-right {
  width: 50%;
  height: 100%;
  background-color: #3a5fc4;
  position: relative;
  transition: transform 0.8s cubic-bezier(0.4, 0, 0.2, 1);
  background-image: linear-gradient(to right, rgba(255, 255, 255, 0.1), rgba(255, 255, 255, 0));
  box-shadow: inset 0 0 15px rgba(0, 0, 0, 0.5);
}

.door-left {
  transform: scaleX(1);
  border-right: 2px solid #4d77f9;
  transform-origin: left center;
}

.door-right {
  transform: scaleX(1);
  border-left: 2px solid #4d77f9;
  transform-origin: right center;
}

/* 管理员模式部分 */
.admin-only-section {
  width: 100%;
  margin-top: 20px;
  border-top: 1px solid #1e3a8a;
  padding-top: 20px;
}

/* 门位置信息样式 */
.door-position-info {
  margin: 0 auto;
  width: 80%;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 5px;
  margin-bottom: 20px;
}

.position-value {
  font-size: 14px;
  font-weight: bold;
  color: #a0aee0;
}

.position-bar {
  width: 100%;
  height: 12px;
  background-color: #0a1a40;
  border-radius: 6px;
  overflow: hidden;
  border: 1px solid #1e3a8a;
}

.position-fill {
  height: 100%;
  background-color: #4d77f9;
  width: 50%;
  transition: width 0.8s cubic-bezier(0.4, 0, 0.2, 1);
  background-image: linear-gradient(to right, #3a5fc4, #4d77f9);
}

.position-percentage {
  font-size: 14px;
  font-weight: bold;
  color: #4d77f9;
}

/* 门位置变化曲线图样式 */
.door-position-chart-wrapper {
  width: 90%;
  margin: 10px auto 0;
  background-color: #0a1a40;
  border-radius: 8px;
  padding: 15px;
  border: 1px solid #1e3a8a;
}

.chart-title {
  font-size: 14px;
  font-weight: bold;
  color: #eef2ff;
  margin-bottom: 10px;
  text-align: center;
}

.door-position-chart {
  display: flex;
  height: 150px;
}

.chart-y-axis {
  width: 40px;
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  align-items: flex-end;
  padding-right: 5px;
}

.chart-y-label {
  font-size: 12px;
  color: #a0aee0;
}

.chart-grid {
  flex: 1;
  position: relative;
  border-left: 1px solid #3a5fc4;
  border-bottom: 1px solid #3a5fc4;
  overflow: hidden;
}

.chart-scroll-container {
  overflow-x: auto;
  overflow-y: hidden;
  width: 100%;
  height: 100%;
}

.chart-grid-line {
  stroke: #1e3a8a;
  stroke-width: 1;
  stroke-dasharray: 4;
}

.position-line {
  fill: none;
  stroke: #4d77f9;
  stroke-width: 2;
  stroke-linejoin: round;
}

.current-position-point {
  fill: #22c55e;
  stroke: #16a34a;
  stroke-width: 2;
}

.position-chart-svg {
  display: block;
}
</style> 