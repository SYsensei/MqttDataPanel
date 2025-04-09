<template>
  <div>
    <!-- 调试信息，仅在debug模式下显示 -->
    <div class="debug-info" v-if="debug">
      <div>滚动提示状态: {{ isVisible ? '可见' : '隐藏' }}</div>
      <div>滚动容器ID: {{ scrollContainerId }}</div>
      <div>已滚动过: {{ hasScrolled ? '是' : '否' }}</div>
    </div>
    
    <!-- 滚动提示 -->
    <div class="scroll-hint-container" v-show="isVisible">
      <div class="scroll-hint-content">
        <div class="scroll-icon">
          <div class="scroll-arrow"></div>
        </div>
        <div class="hint-text">向下查看更多</div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, onUnmounted } from 'vue'

// 配置：滚动容器的ID或类名和调试模式
const props = defineProps({
  scrollContainerId: {
    type: String,
    default: '.app-container' // 默认监听整个应用容器
  },
  debug: {
    type: Boolean,
    default: false // 默认不显示调试信息
  }
})

// 控制提示的可见性
const isVisible = ref(false)
const initialTimer = ref(null)
const hasScrolled = ref(false) // 用户是否已经滚动过

// 滚动容器引用
const scrollContainer = ref(null)

// 获取滚动容器元素
const getScrollContainer = () => {
  if (!scrollContainer.value) {
    scrollContainer.value = document.querySelector(props.scrollContainerId)
  }
  return scrollContainer.value
}

// 处理滚动事件
const handleScroll = () => {
  // 一旦滚动就不再显示提示
  if (isVisible.value) {
    isVisible.value = false
  }
  
  // 标记为已滚动过
  hasScrolled.value = true
  
  // 如果已经滚动过，就移除滚动事件监听，不再需要监听滚动
  const container = getScrollContainer()
  if (container) {
    container.removeEventListener('scroll', handleScroll)
  }
}

// 组件挂载时
onMounted(() => {
  // 延迟一下获取滚动容器，确保DOM已经渲染
  setTimeout(() => {
    const container = getScrollContainer()
    if (container) {
      // 添加滚动事件监听到特定容器
      container.addEventListener('scroll', handleScroll)
      
      // 页面加载后延迟5秒显示提示（如果还没有滚动过）
      initialTimer.value = setTimeout(() => {
        if (!hasScrolled.value) {
          isVisible.value = true
          
          // 显示5秒后自动隐藏
          //setTimeout(() => {
          //  isVisible.value = false
          //}, 5000)
        }
      }, 5000)
    }
  }, 500)
})

// 组件卸载时
onUnmounted(() => {
  // 移除滚动事件监听
  const container = getScrollContainer()
  if (container) {
    container.removeEventListener('scroll', handleScroll)
  }
  
  // 清除计时器
  if (initialTimer.value) {
    clearTimeout(initialTimer.value)
  }
})
</script>

<style scoped>
.debug-info {
  position: fixed;
  top: 10px;
  left: 10px;
  background-color: rgba(0, 0, 0, 0.7);
  color: white;
  padding: 8px 12px;
  border-radius: 4px;
  font-size: 12px;
  z-index: 10000;
  max-width: 300px;
  line-height: 1.5;
}

.scroll-hint-container {
  position: fixed;
  bottom: 40px;
  left: 50%;
  transform: translateX(-50%);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 9999; /* 确保可见 */
  transition: opacity 0.5s ease-in-out;
  animation: fadeIn 0.5s ease-in-out;
  pointer-events: none; /* 避免干扰点击 */
}

.scroll-hint-content {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 12px 20px;
  background-color: rgba(0, 0, 0, 0.7);
  border-radius: 25px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.5);
  backdrop-filter: blur(4px);
}

.scroll-icon {
  width: 28px;
  height: 42px;
  border: 2px solid rgba(255, 255, 255, 0.9);
  border-radius: 25px;
  margin-bottom: 8px;
  display: flex;
  justify-content: center;
  align-items: flex-start;
  padding-top: 8px;
}

.scroll-arrow {
  width: 8px;
  height: 8px;
  border-bottom: 2px solid rgba(255, 255, 255, 0.9);
  border-right: 2px solid rgba(255, 255, 255, 0.9);
  transform: rotate(45deg);
  animation: scrollAnimation 2s infinite;
}

.hint-text {
  color: rgba(255, 255, 255, 1);
  font-size: 14px;
  font-weight: 500;
  white-space: nowrap;
}

@keyframes scrollAnimation {
  0% {
    opacity: 0;
    transform: rotate(45deg) translate(-5px, -5px);
  }
  50% {
    opacity: 1;
  }
  100% {
    opacity: 0;
    transform: rotate(45deg) translate(5px, 5px);
  }
}

@keyframes fadeIn {
  from {
    opacity: 0;
    transform: translate(-50%, 20px);
  }
  to {
    opacity: 1;
    transform: translate(-50%, 0);
  }
}
</style> 