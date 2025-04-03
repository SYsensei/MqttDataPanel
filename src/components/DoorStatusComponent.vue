<template>
  <div class="door-status-component">
    <!-- 主面板显示门机运行状态和故障检测 -->
    <template v-if="isMainPanel">
      <div class="door-status-section">
        <h2 class="section-title">门机运行状态</h2>
        
        <div class="status-grid">
          <!-- 门状态 -->
          <div class="status-item">
            <div class="led-indicator green" :class="{ active: !isDataTimeout }"></div>
            <div class="status-text">
              <div class="status-name">正常</div>
            </div>
          </div>
          
          <div class="status-item">
            <div class="led-indicator green" :class="{ active: doorData.opening && !isDataTimeout }"></div>
            <div class="status-text">
              <div class="status-name">开门中...</div>
              <div class="status-detail fixed-height" v-if="doorData.opening && !isDataTimeout">正在开门，请注意安全</div>
            </div>
          </div>
          
          <div class="status-item">
            <div class="led-indicator green" :class="{ active: doorData.doorOpenedInPlace && !isDataTimeout }"></div>
            <div class="status-text">
              <div class="status-name">开门到位</div>
              <div class="status-detail fixed-height" v-if="doorData.doorOpenedInPlace && !isDataTimeout">开门已完成，用时{{ displayDoorOpenDuration }}s</div>
            </div>
          </div>
          
          <div class="status-item">
            <div class="led-indicator red" :class="{ active: doorData.faultCode > 0 && !isDataTimeout }"></div>
            <div class="status-text">
              <div class="status-name">故障</div>
              <div class="status-detail fixed-height" v-if="doorData.faultCode > 0 && !isDataTimeout">Err{{ doorData.faultCode }}</div>
            </div>
          </div>
          
          <div class="status-item">
            <div class="led-indicator green" :class="{ active: doorData.closing && !isDataTimeout }"></div>
            <div class="status-text">
              <div class="status-name">关门中...</div>
              <div class="status-detail fixed-height" v-if="doorData.closing && !isDataTimeout">正在关门，请注意安全</div>
            </div>
          </div>
          
          <div class="status-item">
            <div class="led-indicator green" :class="{ active: doorData.doorClosedInPlace && !isDataTimeout }"></div>
            <div class="status-text">
              <div class="status-name">关门到位</div>
              <div class="status-detail fixed-height" v-if="doorData.doorClosedInPlace && !isDataTimeout">关门已完成，用时{{ displayDoorCloseDuration }}s</div>
            </div>
          </div>
          
          <div class="status-item">
            <div class="led-indicator green" :class="{ active: doorData.DI3 && !isDataTimeout }"></div>
            <div class="status-text">
              <div class="status-name">门锁回路</div>
              <div class="status-detail fixed-height"></div>
            </div>
          </div>
          
          <div class="status-item">
            <div class="status-text">
              <div class="status-name">累计运行次数</div>
              <div class="status-detail fixed-height">{{ doorData.totalOperations }}次</div>
            </div>
          </div>
          
          <div class="status-item">
            <div class="status-text">
              <div class="status-name">最近维保日期</div>
              <div class="status-detail fixed-height">2025年3月15日</div>
            </div>
          </div>
        </div>
      </div>
      
      <!-- 新增门机故障检测部分 -->
      <div class="door-status-section">
        <h2 class="section-title">门机故障检测</h2>
        
        <div class="status-grid">
          <div class="status-item">
            <div class="led-indicator yellow" :class="{ active: doorData.DI0_ && !isDataTimeout }"></div>
            <div class="status-text">
              <div class="status-name">门机同步带松动</div>
              <div class="status-detail fixed-height">需拧紧 {{ doorData.turns.toFixed(1) }} 圈</div>
            </div>
          </div>
          
          <div class="status-item">
            <div class="led-indicator yellow" :class="{ active: doorData.DI1_ && !isDataTimeout }"></div>
            <div class="status-text">
              <div class="status-name">层门开关闪断</div>
              <div class="status-detail fixed-height">发生楼层：{{ doorData.floor }} 层</div>
            </div>
          </div>
          
          <div class="status-item">
            <div class="led-indicator red" :class="{ active: doorData.DI2_ && !isDataTimeout }"></div>
            <div class="status-text">
              <div class="status-name">门刀开关故障</div>
              <div class="status-detail fixed-height" v-if="doorData.DI2_ && !isDataTimeout">请检查门刀联动机构</div>
            </div>
          </div>
          
          <div class="status-item">
            <div class="led-indicator yellow" :class="{ active: doorData.DI3_ && !isDataTimeout }"></div>
            <div class="status-text">
              <div class="status-name">烟囱效应产生</div>
              <div class="status-detail fixed-height">发生楼层：{{ doorData.floor }} 层</div>
            </div>
          </div>
          
          <div class="status-item">
            <div class="led-indicator red" :class="{ active: doorData.stallByObstacle && !isDataTimeout }"></div>
            <div class="status-text">
              <div class="status-name">垃圾阻门</div>
              <div class="status-detail fixed-height">{{ doorData.floor }} 层，阻力值 {{ doorData.resist }} N</div>
            </div>
          </div>
          
          <div class="status-item">
            <div class="led-indicator red" :class="{ active: doorData.motorOverheat && !isDataTimeout }"></div>
            <div class="status-text">
              <div class="status-name">门电机温度过高</div>
              <div class="status-detail fixed-height">电机温度 {{ doorData.IPMTemperature }}°C</div>
            </div>
          </div>
        </div>
      </div>
    </template>
    
    <!-- 左侧面板显示门控器输入和输出状态 -->
    <div v-if="isLeftPanel" class="side-panel-section left-panel">
      <div class="status-grid-vertical">
        <!-- 输入信号 -->
        <div class="status-item-compact">
          <div class="led-indicator green" :class="{ active: doorData.DI0 && !isDataTimeout }"></div>
          <div class="status-text-compact">开门端子输入</div>
        </div>
        
        <div class="status-item-compact">
          <div class="led-indicator green" :class="{ active: doorData.DI1 && !isDataTimeout }"></div>
          <div class="status-text-compact">关门端子输入</div>
        </div>
        
        <div class="status-item-compact">
          <div class="led-indicator green" :class="{ active: doorData.DI2 && !isDataTimeout }"></div>
          <div class="status-text-compact">强迫关门端子输入</div>
        </div>
        
        <div class="status-item-compact">
          <div class="led-indicator green" :class="{ active: doorData.DI3 && !isDataTimeout }"></div>
          <div class="status-text-compact">开门到位开关输入</div>
        </div>
        
        <!-- 输出信号 -->
        <div class="status-item-compact">
          <div class="led-indicator green" :class="{ active: doorData.DO0 && !isDataTimeout }"></div>
          <div class="status-text-compact">开门到位输出</div>
        </div>
        
        <div class="status-item-compact">
          <div class="led-indicator green" :class="{ active: doorData.DO1 && !isDataTimeout }"></div>
          <div class="status-text-compact">关门到位输出</div>
        </div>
        
        <div class="status-item-compact">
          <div class="led-indicator red" :class="{ active: doorData.DO2 && !isDataTimeout }"></div>
          <div class="status-text-compact">开关门故障输出</div>
        </div>
      </div>
    </div>
    
    <!-- 右侧面板显示门控器数据 -->
    <div v-if="isRightPanel" class="side-panel-section right-panel">
      <div class="status-grid-vertical">
        <!-- 数据显示区域 -->
        <div class="data-display-section">
          <div class="data-item">
            <div class="data-name">输出电流</div>
            <div class="data-gauge">
              <div class="gauge-bar">
                <div class="gauge-fill" :style="{ width: `${parseFloat(doorData.outputCurrent) / 2 * 100}%` }"></div>
              </div>
              <div class="gauge-value">{{ parseFloat(doorData.outputCurrent).toFixed(2) }}A</div>
            </div>
          </div>
          
          <!-- 电机温度显示 -->
          <div class="data-item">
            <div class="data-name">电机温度</div>
            <div class="data-gauge">
              <div class="gauge-bar">
                <div class="gauge-fill" :style="{ width: `${parseFloat(doorData.IPMTemperature)}%` }"></div>
              </div>
              <div class="gauge-value">{{ parseInt(doorData.IPMTemperature) }}℃</div>
            </div>
          </div>
          
          <div class="data-item">
            <div class="data-name">母线电压</div>
            <div class="data-gauge">
              <div class="gauge-bar">
                <div class="gauge-fill" :style="{ width: `${parseFloat(doorData.busVoltage) / 360 * 100}%` }"></div>
              </div>
              <div class="gauge-value">{{ parseInt(doorData.busVoltage) }}V</div>
            </div>
          </div>
          
          <div class="data-item">
            <div class="data-name">目标速度</div>
            <div class="data-gauge">
              <div class="gauge-bar">
                <div class="gauge-fill" :style="{ width: `${parseFloat(doorData.givenSpeed) / 0.5 * 100}%` }"></div>
              </div>
              <div class="gauge-value">{{ parseFloat(doorData.givenSpeed).toFixed(3) }}m/s</div>
            </div>
          </div>
          
          <div class="data-item">
            <div class="data-name">实际速度</div>
            <div class="data-gauge">
              <div class="gauge-bar">
                <div class="gauge-fill" :style="{ width: `${parseFloat(doorData.currentSpeed) / 0.5 * 100}%` }"></div>
              </div>
              <div class="gauge-value">{{ parseFloat(doorData.currentSpeed).toFixed(3) }}m/s</div>
            </div>
          </div>
          
          <div class="data-item">
            <div class="data-name">门板位置</div>
            <div class="data-gauge">
              <div class="gauge-bar">
                <div class="gauge-fill" :style="{ width: `${parseFloat(doorData.doorPosition) / 500 * 100}%` }"></div>
              </div>
              <div class="gauge-value">{{ parseFloat(doorData.doorPosition).toFixed(1) }}mm</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue'

const props = defineProps({
  doorData: {
    type: Object,
    required: true
  },
  isDataTimeout: {
    type: Boolean,
    default: false
  },
  validTopicReceived: {
    type: Boolean,
    default: false
  },
  panelPosition: {
    type: String,
    default: 'main' // 可选值: 'main', 'left', 'right'
  }
})

// 计算门状态
const doorStatus = computed(() => {
  if (props.doorData.faultCode > 0) {
    return 'fault'
  }
  return 'normal'
})

// 计算是否显示主面板内容
const isMainPanel = computed(() => props.panelPosition === 'main')

// 计算是否显示左侧面板内容
const isLeftPanel = computed(() => props.panelPosition === 'left')

// 计算是否显示右侧面板内容
const isRightPanel = computed(() => props.panelPosition === 'right')

// 计算显示的开门时间（限制最大值为4.0秒）
const displayDoorOpenDuration = computed(() => {
  const duration = props.doorData.doorOpenDuration || 0
  // 如果信号连续没有断开，限制最大显示为4.0秒
  if (props.doorData.continuousOpenSignal) {
    return Math.min(duration, 4.0).toFixed(1)
  }
  // 否则显示原始值
  return duration.toFixed(1)
})

// 计算显示的关门时间（限制最大值为4.0秒）
const displayDoorCloseDuration = computed(() => {
  const duration = props.doorData.doorCloseDuration || 0
  // 如果信号连续没有断开，限制最大显示为4.0秒
  if (props.doorData.continuousCloseSignal) {
    return Math.min(duration, 4.0).toFixed(1)
  }
  // 否则显示原始值
  return duration.toFixed(1)
})
</script>

<style scoped>
/* 门机运行状态样式 */
.door-status-section {
  margin-bottom: 8px;
  background-color: #132859;
  border-radius: 8px;
  padding: 12px;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.3);
  border: 1px solid #1e3a8a;
}

/* 保持所有部分间隔一致 */
.door-status-section:not(:first-child) {
  margin-top: 8px;
}

/* 移除门机故障检测部分特殊间隔 */
.door-status-section:last-child {
  margin-top: 8px;
}

/* 侧边面板样式 */
.side-panel-section {
  margin: 0;
  width: 100%;
  height: 100%;
  background-color: transparent;
  border-radius: 0;
  padding: 5px;
  box-shadow: none;
  border: none;
  display: flex;
  align-items: center;
  box-sizing: border-box;
}

/* 针对右侧面板的特殊样式 */
.side-panel-section.right-panel {
  padding-right: 10px;
}

/* 标题样式 */
.section-title {
  font-size: 18px;
  color: #eef2ff;
  border-bottom: 1px solid #3a5fc4;
  padding-bottom: 10px;
  margin-top: 0;
  margin-bottom: 15px;
  text-align: center;
}

/* 状态网格 */
.status-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 15px;
  margin-top: 10px;
}

/* 媒体查询 - 小屏幕设备 */
@media (max-width: 576px) {
  .door-status-section {
    padding: 8px;
  }
  
  .section-title {
    font-size: 14px;
    margin-bottom: 8px;
  }
  
  .status-name {
    font-size: 12px;
  }
  
  .status-detail {
    font-size: 10px;
  }
  
  .status-grid {
    gap: 5px;
  }
  
  .side-panel-section {
    padding: 3px 1px;
    width: 100%;
  }
  
  .side-panel-section.left-panel, 
  .side-panel-section.right-panel {
    padding: 2px;
    width: 100%;
  }
  
  /* 右侧面板水平数据显示 */
  .side-panel-section.right-panel .status-grid-vertical,
  .right-panel .status-grid-vertical {
    flex-direction: row;
    flex-wrap: wrap;
    justify-content: space-between;
    gap: 6px;
    min-height: auto;
    width: 100%;
  }
  
  .side-panel-section.right-panel .data-item,
  .right-panel .data-item {
    width: calc(50% - 3px);
    height: 40px;
    margin-bottom: 0;
    padding: 3px 4px;
  }
  
  .side-panel-section.right-panel .data-display-section,
  .right-panel .data-display-section {
    display: flex;
    flex-direction: row;
    flex-wrap: wrap;
    min-height: auto;
    gap: 6px;
    justify-content: space-between;
    width: 100%;
  }
  
  /* 确保侧边面板中的垂直网格在小屏幕上也能正常显示 */
  .status-grid-vertical {
    min-height: auto;
    gap: 4px;
  }
  
  .status-item-compact {
    padding: 3px 5px;
    height: 24px;
    margin-bottom: 4px;
  }
  
  .status-text-compact {
    font-size: 10px;
  }
}

/* 媒体查询 - 超小屏幕设备 */
@media (max-width: 480px) {
  .door-status-section {
    padding: 8px;
  }
  
  .section-title {
    font-size: 14px;
    margin-bottom: 8px;
  }
  
  .status-name {
    font-size: 12px;
  }
  
  .status-detail {
    font-size: 10px;
  }
}

/* 极小屏幕设备 */
@media (max-width: 360px) {
  .door-status-section {
    padding: 5px;
  }
  
  .section-title {
    font-size: 12px;
  }
  
  .status-grid {
    gap: 5px;
  }
}

/* 垂直紧凑型状态网格 */
.status-grid-vertical {
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  gap: 5px;
  width: 100%;
  height: 100%;
  min-height: 310px;
}

.status-item {
  background-color: #0a1a40;
  border-radius: 8px;
  padding: 12px;
  min-height: 90px;
  display: flex;
  align-items: flex-start;
  border: 1px solid #1e3a8a;
  transition: all 0.3s;
}

.status-item.maintenance-item {
  display: flex;
  align-items: flex-start;
}

.status-item.maintenance-item .status-text {
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  width: 100%;
}

.status-item.maintenance-item .maintenance-icon {
  margin-bottom: 8px;
}

.status-item.maintenance-item .status-name {
  margin-bottom: 8px;
}

.status-item.maintenance-item .status-detail {
  margin-top: 0;
}

/* 紧凑型状态项 */
.status-item-compact {
  background-color: #0a1a40;
  border-radius: 5px;
  padding: 5px 8px;
  display: flex;
  align-items: center;
  border: 1px solid #1e3a8a;
  transition: all 0.3s;
  height: 32px;
  text-align: left;
}

.status-item:hover, .status-item-compact:hover {
  background-color: #132859;
  transform: translateY(-2px);
  box-shadow: 0 5px 15px rgba(0, 0, 0, 0.2);
}

.led-indicator {
  width: 14px;
  height: 14px;
  border-radius: 50%;
  background-color: #233876;
  margin-right: 8px;
  margin-top: 3px;
  border: 1px solid #3a5fc4;
  box-shadow: inset 0 0 5px rgba(0, 0, 0, 0.3);
  flex-shrink: 0;
}

.led-indicator.active {
  background-color: #4d77f9;
  box-shadow: 0 0 10px #4d77f9, inset 0 0 5px rgba(255, 255, 255, 0.3);
}

.led-indicator.green {
  border-color: #16a34a;
}

.led-indicator.green.active {
  background-color: #22c55e;
  box-shadow: 0 0 10px #22c55e, inset 0 0 5px rgba(255, 255, 255, 0.3);
}

.led-indicator.red {
  border-color: #9b2c2c;
}

.led-indicator.red.active {
  background-color: #e53e3e;
  box-shadow: 0 0 10px #e53e3e, inset 0 0 5px rgba(255, 255, 255, 0.3);
}

.led-indicator.yellow {
  border-color: #92400e;
}

.led-indicator.yellow.active {
  background-color: #f59e0b;
  box-shadow: 0 0 10px #f59e0b, inset 0 0 5px rgba(255, 255, 255, 0.3);
}

.led-indicator.blue {
  border-color: #2563eb;
}

.led-indicator.blue.active {
  background-color: #3b82f6;
  box-shadow: 0 0 10px #3b82f6, inset 0 0 5px rgba(255, 255, 255, 0.3);
}

.status-text {
  flex-grow: 1;
}

/* 紧凑型文本样式 */
.status-text-compact {
  font-weight: bold;
  font-size: 12px;
  color: #eef2ff;
  white-space: nowrap;
  text-align: left;
}

.status-name {
  font-weight: bold;
  font-size: 16px;
  color: #eef2ff;
  margin-bottom: 5px;
}

.status-detail {
  color: #cad2ff;
  font-size: 14px;
  min-height: 20px;
}

.fixed-height {
  min-height: 20px;
  display: block;
}

.maintenance-icon {
  font-size: 18px;
  color: #4d77f9;
  margin-bottom: 5px;
}

/* 数据显示区域样式 */
.data-display-section {
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  gap: 5px;
  width: 100%;
  height: 100%;
  min-height: 310px;
}

.data-item {
  background-color: #0a1a40;
  border-radius: 5px;
  padding: 5px 8px;
  display: flex;
  flex-direction: column;
  border: 1px solid #1e3a8a;
  width: 100%;
  height: 32px;
  overflow: hidden;
}

/* 数据名称 */
.data-name {
  font-weight: bold;
  font-size: 12px;
  color: #eef2ff;
  margin-bottom: 3px;
  white-space: nowrap;
}

/* 数据仪表盘容器 */
.data-gauge {
  display: flex;
  align-items: center;
  gap: 4px;
  height: 14px;
}

/* 仪表条容器 */
.gauge-bar {
  flex-grow: 1;
  height: 5px;
  background-color: #233876;
  border-radius: 3px;
  overflow: hidden;
}

/* 数据填充条填充部分 */
.gauge-fill {
  height: 100%;
  background-color: #22c55e;
  border-radius: 3px;
  transition: width 0.3s ease;
}

/* 数据值样式 */
.gauge-value {
  font-weight: bold;
  font-size: 12px;
  color: #eef2ff;
  min-width: 45px;
  text-align: right;
  white-space: nowrap;
}

/* 新增门机故障检测部分样式 */
.door-status-section:last-child {
  margin-top: 10px;
}

/* 新增门机故障检测部分标题样式 */
.door-status-section:last-child .section-title {
  border-left-color: #f59e0b;
}

/* 新增门机故障检测部分状态网格样式 */
.door-status-section:last-child .status-grid {
  grid-template-columns: repeat(3, 1fr);
  gap: 12px;
}

/* 新增门机故障检测部分状态项样式 */
.door-status-section:last-child .status-item {
  background-color: #0a1a40;
  border-radius: 8px;
  padding: 12px;
  min-height: 80px;
  display: flex;
  align-items: flex-start;
  border: 1px solid #1e3a8a;
  transition: all 0.3s;
}

/* 新增门机故障检测部分状态项文本样式 */
.door-status-section:last-child .status-text {
  flex-grow: 1;
}

/* 新增门机故障检测部分状态项文本名称样式 */
.door-status-section:last-child .status-name {
  font-weight: bold;
  font-size: 16px;
  color: #eef2ff;
  margin-bottom: 5px;
}

/* 新增门机故障检测部分状态项文本详情样式 */
.door-status-section:last-child .status-detail {
  color: #cad2ff;
  font-size: 14px;
  min-height: 20px;
}

/* 新增门机故障检测部分状态项文本固定高度样式 */
.door-status-section:last-child .fixed-height {
  min-height: 20px;
  display: block;
}

/* 新增门机故障检测部分状态项文本维护图标样式 */
.door-status-section:last-child .maintenance-icon {
  font-size: 18px;
  color: #f59e0b;
  margin-bottom: 5px;
}

/* 维保信息样式 */
.maintenance-info {
  margin-top: 15px;
  text-align: center;
}

/* 维保信息名称样式 */
.maintenance-info .status-name {
  font-weight: bold;
  font-size: 16px;
  color: #eef2ff;
  margin-bottom: 5px;
}

/* 维保信息详情样式 */
.maintenance-info .status-detail {
  color: #cad2ff;
  font-size: 14px;
  min-height: 20px;
}
</style> 