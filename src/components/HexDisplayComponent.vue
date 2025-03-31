<template>
  <div class="hex-container">
    <div class="hex-title">
      <span>原始十六进制数据</span>
      <span class="hex-timestamp" v-if="lastUpdateTime">接收时间: {{ lastUpdateTime }}</span>
    </div>
    <div class="hex-data">
      <template v-if="hexBytes.length">
        <span class="hex-byte" v-for="(byte, index) in hexBytes" :key="index">{{ byte }}</span>
      </template>
      <template v-else>
        <span class="no-data">尚未接收到数据</span>
      </template>
    </div>
  </div>
</template>

<script setup>
const props = defineProps({
  hexBytes: {
    type: Array,
    default: () => []
  },
  lastUpdateTime: {
    type: String,
    default: null
  }
})
</script>

<style scoped>
/* 原始数据区域 */
.hex-container {
  background-color: #132859;
  border-radius: 8px;
  padding: 15px;
  margin: 30px 10px 20px 10px;
  border: 1px solid #1e3a8a;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.3);
}

.hex-title {
  font-weight: bold;
  color: #eef2ff;
  margin-bottom: 12px;
  font-size: 16px;
  display: flex;
  justify-content: space-between;
  align-items: center;
  border-bottom: 1px solid #1e3a8a;
  padding-bottom: 8px;
}

.hex-timestamp {
  font-size: 14px;
  color: #a0aee0;
}

.hex-data {
  font-family: 'Courier New', monospace;
  background-color: #0a1a40;
  padding: 15px;
  border-radius: 4px;
  color: #a0aee0;
  overflow: auto;
  max-height: 200px;
  font-size: 14px;
  border: 1px solid #1e3a8a;
  line-height: 1.8;
}

.hex-byte {
  display: inline-block;
  padding: 3px 5px;
  margin: 3px;
  background-color: #233876;
  border-radius: 4px;
  border: 1px solid #1e3a8a;
  color: #fff;
  font-weight: 500;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.2);
}

.no-data {
  display: block;
  text-align: center;
  padding: 20px;
  color: #5d7bb9;
  font-style: italic;
}
</style> 