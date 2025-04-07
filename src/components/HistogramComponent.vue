<template>
  <div class="histogram-container">
    <h3 class="histogram-title">{{ title }}</h3>
    <div class="histogram-chart">
      <div v-if="data.length === 0" class="no-data">暂无数据</div>
      <div v-else class="chart-container">
        <div class="bars-container">
          <div 
            v-for="(value, index) in data" 
            :key="index" 
            class="bar" 
            :style="{ height: `${calculateHeight(value)}%` }"
            :title="`${xAxisLabels[index] || `项目${index + 1}`}: ${value}`"
          >
            <span class="bar-value">{{ value }}</span>
          </div>
        </div>
        <div class="x-axis">
          <div 
            v-for="(label, index) in displayLabels" 
            :key="index" 
            class="x-label"
          >
            {{ label }}
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue';

const props = defineProps({
  // 图表标题
  title: {
    type: String,
    default: '数据直方图'
  },
  // 图表数据
  data: {
    type: Array,
    default: () => []
  },
  // X轴标签
  xAxisLabels: {
    type: Array,
    default: () => []
  },
  // 图表高度
  height: {
    type: String,
    default: '300px'
  }
});

// 计算展示的标签
const displayLabels = computed(() => {
  if (props.xAxisLabels.length > 0) {
    return props.xAxisLabels;
  }
  return props.data.map((_, index) => `项目${index + 1}`);
});

// 计算条形图高度百分比
const calculateHeight = (value) => {
  if (props.data.length === 0) return 0;
  
  const maxValue = Math.max(...props.data);
  if (maxValue === 0) return 0;
  
  return (value / maxValue) * 80; // 最高为图表高度的80%
};
</script>

<style scoped>
.histogram-container {
  width: 100%;
  padding: 15px;
  background-color: #132859;
  border-radius: 8px;
  border: 1px solid #1e3a8a;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.3);
  margin-bottom: 15px;
  box-sizing: border-box;
}

.histogram-title {
  color: #4d77f9;
  font-size: 16px;
  margin-top: 0;
  margin-bottom: 15px;
  text-align: center;
}

.histogram-chart {
  width: 100%;
  height: v-bind('props.height');
  position: relative;
}

.no-data {
  display: flex;
  align-items: center;
  justify-content: center;
  height: 100%;
  color: #6c92ff;
  font-size: 14px;
}

.chart-container {
  height: 100%;
  display: flex;
  flex-direction: column;
}

.bars-container {
  display: flex;
  justify-content: space-around;
  align-items: flex-end;
  height: 85%;
  padding-bottom: 5px;
}

.bar {
  background-color: #4d77f9;
  width: 30px;
  min-height: 1px;
  border-radius: 3px 3px 0 0;
  position: relative;
  transition: height 0.3s ease;
  display: flex;
  justify-content: center;
}

.bar:hover {
  background-color: #6c92ff;
}

.bar-value {
  position: absolute;
  top: -20px;
  font-size: 12px;
  color: #eef2ff;
}

.x-axis {
  display: flex;
  justify-content: space-around;
  margin-top: 5px;
  height: 15%;
}

.x-label {
  text-align: center;
  font-size: 12px;
  color: #eef2ff;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  max-width: 60px;
}
</style> 