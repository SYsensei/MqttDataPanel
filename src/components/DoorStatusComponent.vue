<template>
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
          <div class="status-detail fixed-height" v-if="doorData.doorOpenedInPlace && !isDataTimeout">开门已完成，用时{{ doorData.doorOpenDuration.toFixed(1) }}s</div>
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
          <div class="status-detail fixed-height" v-if="doorData.doorClosedInPlace && !isDataTimeout">关门已完成，用时{{ doorData.doorCloseDuration.toFixed(1) }}s</div>
        </div>
      </div>
      
      <div class="status-item">
        <div class="led-indicator green" :class="{ active: !isDataTimeout }"></div>
        <div class="status-text">
          <div class="status-name">门锁回路</div>
          <div class="status-detail fixed-height">导通正常</div>
        </div>
      </div>
      
      <div class="status-item">
        <div class="status-text">
          <div class="maintenance-icon">
            <i class="el-icon-setting"></i>
          </div>
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
      
      <!-- 电机温度仪表盘 -->
      <div class="status-item temperature-gauge">
        <div class="temperature-gauge-container">
          <div class="gauge-header">
            <div class="gauge-title">门电机温度</div>
            <div class="gauge-unit">单位/°C</div>
          </div>
          
          <div class="gauge-meter">
            <!-- 仪表盘背景 -->
            <div class="gauge-background"></div>
            
            <!-- 颜色刻度圆弧 -->
            <div class="gauge-color-bands">
              <div class="gauge-band green"></div>
              <div class="gauge-band yellow"></div>
              <div class="gauge-band red"></div>
            </div>
            
            <!-- 刻度线 -->
            <div class="gauge-scale">
              <div v-for="i in 11" :key="i-1" class="gauge-tick major" :style="{transform: `rotate(${-90 + (i-1) * 18}deg)`}"></div>
              <div v-for="i in 100" :key="i" class="gauge-tick minor" 
                  v-if="i % 10 !== 0"
                  :style="{transform: `rotate(${-90 + i * 1.8}deg)`}"></div>
            </div>
            
            <!-- 刻度值 -->
            <div class="gauge-labels">
              <span class="gauge-label" style="left: 2%; top: 80%;">0</span>
              <span class="gauge-label green-text" style="left: 8%; top: 58%;">10</span>
              <span class="gauge-label green-text" style="left: 18%; top: 40%;">20</span>
              <span class="gauge-label green-text" style="left: 32%; top: 25%;">30</span>
              <span class="gauge-label green-text" style="left: 50%; top: 20%;">40</span>
              <span class="gauge-label green-text" style="left: 68%; top: 25%;">50</span>
              <span class="gauge-label green-text" style="left: 82%; top: 40%;">60</span>
              <span class="gauge-label yellow-text" style="left: 92%; top: 58%;">70</span>
              <span class="gauge-label yellow-text" style="left: 95%; top: 70%;">80</span>
              <span class="gauge-label red-text" style="left: 92%; top: 84%;">90</span>
              <span class="gauge-label red-text" style="left: 80%; top: 92%;">100</span>
            </div>
            
            <!-- 指针 -->
            <div class="gauge-pointer" :style="getMotorTempPointerStyle">
              <div class="pointer-stem"></div>
              <div class="pointer-base"></div>
            </div>
          </div>
          
          <!-- 温度数值显示 -->
          <div class="temperature-display">
            {{ doorData.motorTemperature || 46 }}°C
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
  }
})

// 计算门状态
const doorStatus = computed(() => {
  if (props.doorData.faultCode > 0) {
    return 'fault'
  }
  return 'normal'
})

// 计算电机温度指针样式
const getMotorTempPointerStyle = computed(() => {
  const temp = props.doorData.motorTemperature || 46
  // 计算旋转角度 (0°对应-90度，100°对应90度，总共旋转180度)
  const rotation = -90 + (temp / 100 * 180)
  
  return {
    transform: `rotate(${rotation}deg)`
  }
})
</script>

<style scoped>
/* 门机运行状态样式 */
.door-status-section {
  margin: 20px 10px;
  background-color: #132859;
  border-radius: 8px;
  padding: 15px;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.3);
  border: 1px solid #1e3a8a;
}

.section-title {
  font-size: 18px;
  font-weight: bold;
  color: #eef2ff;
  margin: 0 0 15px 0;
  text-shadow: 0 1px 2px rgba(0, 0, 0, 0.5);
  border-left: 4px solid #4d77f9;
  padding-left: 10px;
  background: linear-gradient(90deg, rgba(77, 119, 249, 0.2), transparent);
  padding: 8px 15px;
  border-radius: 4px;
}

.status-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 15px;
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

.status-item:hover {
  background-color: #132859;
  transform: translateY(-2px);
  box-shadow: 0 5px 15px rgba(0, 0, 0, 0.2);
}

.led-indicator {
  width: 18px;
  height: 18px;
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

.status-text {
  flex-grow: 1;
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

/* 温度计样式 */
.temperature-gauge {
  grid-column: span 3;
  padding: 15px 20px;
}

.temperature-gauge-container {
  display: flex;
  flex-direction: column;
  align-items: center;
  background-color: #132859;
  border-radius: 8px;
  padding: 20px 15px;
  border: 1px solid #1e3a8a;
  box-shadow: inset 0 0 20px rgba(0, 0, 0, 0.5);
}

.gauge-header {
  text-align: center;
  margin-bottom: 15px;
}

.gauge-title {
  font-size: 20px;
  font-weight: bold;
  color: #4d77f9;
  margin-bottom: 5px;
}

.gauge-unit {
  font-size: 14px;
  color: #a0aee0;
}

.gauge-meter {
  position: relative;
  width: 260px;
  height: 150px;
  margin-bottom: 20px;
}

.gauge-background {
  position: absolute;
  width: 260px;
  height: 150px;
  border-top-left-radius: 150px;
  border-top-right-radius: 150px;
  background-color: #132859;
  border: 3px solid #1e3a8a;
  border-bottom: none;
  box-sizing: border-box;
  z-index: 1;
}

.gauge-color-bands {
  position: absolute;
  width: 240px;
  height: 140px;
  border-top-left-radius: 140px;
  border-top-right-radius: 140px;
  overflow: hidden;
  top: 5px;
  left: 10px;
  z-index: 2;
}

.gauge-band {
  position: absolute;
  width: 100%;
  height: 100%;
  clip-path: polygon(50% 100%, 0 0, 100% 0);
}

.gauge-band.green {
  background-color: #22c55e;
  clip-path: polygon(50% 100%, 0 0, 65% 0, 50% 100%);
  z-index: 2;
}

.gauge-band.yellow {
  background-color: #fcd34d;
  clip-path: polygon(50% 100%, 65% 0, 85% 0, 50% 100%);
  z-index: 3;
}

.gauge-band.red {
  background-color: #e53e3e;
  clip-path: polygon(50% 100%, 85% 0, 100% 0, 50% 100%);
  z-index: 4;
}

.gauge-scale {
  position: absolute;
  width: 100%;
  height: 100%;
  top: 0;
  left: 0;
  z-index: 5;
}

.gauge-tick {
  position: absolute;
  top: 0;
  left: 50%;
  transform-origin: 50% 100%;
  width: 2px;
  height: 10px;
  background-color: rgba(255, 255, 255, 0.6);
}

.gauge-tick.major {
  height: 15px;
  width: 3px;
  background-color: white;
}

.gauge-tick.minor {
  height: 7px;
  width: 1px;
  background-color: rgba(255, 255, 255, 0.4);
}

.gauge-labels {
  position: absolute;
  width: 100%;
  height: 100%;
  top: 0;
  left: 0;
  z-index: 10;
}

.gauge-label {
  position: absolute;
  font-size: 12px;
  font-weight: bold;
  color: white;
  text-shadow: 0 1px 2px rgba(0, 0, 0, 0.8);
}

.green-text {
  color: #22c55e;
}

.yellow-text {
  color: #fcd34d;
}

.red-text {
  color: #e53e3e;
}

.gauge-pointer {
  position: absolute;
  width: 100%;
  height: 100%;
  top: 0;
  left: 0;
  transform-origin: 50% 100%;
  transform: rotate(-45deg);
  transition: transform 0.5s ease;
  z-index: 8;
}

.pointer-stem {
  position: absolute;
  left: 50%;
  top: 10px;
  width: 4px;
  height: 100px;
  background-color: white;
  transform: translateX(-50%);
  box-shadow: 0 0 5px rgba(0, 0, 0, 0.3);
  z-index: 9;
}

.pointer-base {
  position: absolute;
  left: 50%;
  bottom: 0;
  width: 16px;
  height: 16px;
  border-radius: 50%;
  background-color: white;
  transform: translateX(-50%);
  box-shadow: 0 0 8px rgba(255, 255, 255, 0.6);
  border: 2px solid #1e3a8a;
  box-sizing: border-box;
  z-index: 9;
}

.temperature-display {
  font-size: 36px;
  font-weight: bold;
  color: white;
  text-shadow: 0 0 10px rgba(77, 119, 249, 0.5);
  margin-top: 5px;
}
</style> 