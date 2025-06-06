<template>
  <div class="network-status">
    <!-- 网络状态指示器 -->
    <div 
      :class="[statusIndicatorClass, customClass, positionClass]"
      :title="statusTooltip"
      @click="toggleDetails"
    >
      <!-- 状态指示器 -->
      <div class="network-status__indicator">
        <div class="network-status__icon" :class="iconClass">
          <svg v-if="isOnline" class="icon icon-online" viewBox="0 0 24 24">
            <path d="M12 2L13.09 8.26L22 9L13.09 9.74L12 16L10.91 9.74L2 9L10.91 8.26L12 2Z" fill="currentColor"/>
          </svg>
          <svg v-else class="icon icon-offline" viewBox="0 0 24 24">
            <path d="M2.28 3L20.28 21L19 22.28L17.73 21H3V19H15.73L12 15.27V17H5V15H10V13.27L1.72 5L3 3.72L3.27 4H21V6H5.27L2.28 3Z" fill="currentColor"/>
          </svg>
        </div>
        
        <!-- 状态文本 -->
        <span class="network-status__text">{{ statusText }}</span>
      </div>
      
      <!-- 连接质量指示器 -->
      <div v-if="showDetails && isOnline" class="network-status__quality">
        <div class="quality-bars">
          <span 
            v-for="i in 4" 
            :key="i" 
            class="quality-bar" 
            :class="{ active: i <= qualityLevel }"
          ></span>
        </div>
        <span class="quality-text">{{ connectionQuality }}</span>
      </div>
    </div>
    
    <!-- 详细信息面板 -->
    <transition name="fade-slide">
      <div 
        v-if="showDetailsPanel" 
        class="network-status__details"
        :class="detailsPanelClass"
      >
        <div class="details-header">
          <h4>网络状态详情</h4>
          <button class="close-btn" @click.stop="hideDetails">×</button>
        </div>

        <div class="details-content">
          <div class="status-info">
            <div class="info-item">
              <span class="label">连接状态:</span>
              <span class="value" :class="{ online: isOnline, offline: !isOnline }">
                {{ isOnline ? '在线' : '离线' }}
              </span>
            </div>
            
            <div v-if="isOnline" class="info-item">
              <span class="label">连接类型:</span>
              <span class="value">{{ networkType }}</span>
            </div>
            
            <div v-if="isOnline && connectionSpeed" class="info-item">
              <span class="label">连接速度:</span>
              <span class="value">{{ connectionSpeed }}</span>
            </div>
            
            <div class="info-item">
              <span class="label">上次检查:</span>
              <span class="value">{{ lastCheckTimeFormatted }}</span>
            </div>
          </div>

          <div class="action-buttons">
            <button 
              class="btn btn-primary" 
              :disabled="isRetrying" 
              @click="handleRetry"
            >
              {{ isRetrying ? '重连中...' : '重新连接' }}
            </button>
            
            <button 
              class="btn btn-secondary" 
              @click="handleClearCache"
            >
              清理缓存
            </button>
            
            <button 
              class="btn btn-info" 
              @click="checkNetworkStatus"
            >
              刷新状态
            </button>
          </div>
        </div>
      </div>
    </transition>
  </div>
</template>

<script>
import { ref, computed, onMounted, onBeforeUnmount, watch } from 'vue'

/**
 * 网络状态指示组件
 * 显示当前网络连接状态和提供相关操作
 */
export default {
  name: 'NetworkStatus',
  
  /**
   * 组件属性定义
   */
  props: {
    /**
     * 是否显示详细信息
     * @type {Boolean}
     */
    showDetails: {
      type: Boolean,
      default: false
    },
    
    /**
     * 组件显示位置
     * @type {String}
     */
    position: {
      type: String,
      default: 'bottom-right',
      validator: (value) => ['top-left', 'top-right', 'bottom-left', 'bottom-right'].includes(value)
    },
    
    /**
     * 是否自动隐藏在线状态
     * @type {Boolean}
     */
    autoHide: {
      type: Boolean,
      default: false
    },
    
    /**
     * 自动隐藏延迟（毫秒）
     * @type {Number}
     */
    autoHideDelay: {
      type: Number,
      default: 3000
    },
    
    /**
     * 自定义样式类
     * @type {String}
     */
    customClass: {
      type: String,
      default: ''
    }
  },
  
  /**
   * 组件事件定义
   */
  emits: [
    /**
     * 网络状态变化事件
     * @param {Object} status - 网络状态信息
     */
    'network-status-change',
    
    /**
     * 重试连接事件
     */
    'retry-connection',
    
    /**
     * 清理缓存事件
     */
    'clear-cache',
    
    /**
     * 显示/隐藏详情事件
     * @param {boolean} visible - 是否显示
     */
    'toggle-details'
  ],
  
  setup(props, { emit }) {
    // =========================
    // 响应式状态定义
    // =========================
    
    /**
     * 当前网络状态
     * @type {Ref<boolean>}
     */
    const isOnline = ref(navigator.onLine || false)
    
    /**
     * 是否显示详细信息面板
     * @type {Ref<boolean>}
     */
    const showDetailsPanel = ref(props.showDetails)
    
    /**
     * 是否正在重试连接
     * @type {Ref<boolean>}
     */
    const isRetrying = ref(false)
    
    /**
     * 最后检测时间
     * @type {Ref<Date>}
     */
    const lastCheckTime = ref(new Date())
    
    /**
     * 连接质量评分
     * @type {Ref<string>}
     */
    const connectionQuality = ref('unknown')
    
    /**
     * 网络类型
     * @type {Ref<string>}
     */
    const networkType = ref('unknown')
    
    /**
     * 连接速度
     * @type {Ref<string>}
     */
    const connectionSpeed = ref('')
    
    // 内部状态
    let autoHideTimer = null
    let networkEventHandlers = []

    // =========================
    // 计算属性定义
    // =========================
    
    /**
     * 状态指示器样式类
     */
    const statusIndicatorClass = computed(() => ({
      'network-status--online': isOnline.value,
      'network-status--offline': !isOnline.value,
      'network-status--details-open': showDetailsPanel.value
    }))
    
    /**
     * 图标样式类
     */
    const iconClass = computed(() => ({
      'icon--online': isOnline.value,
      'icon--offline': !isOnline.value,
      'icon--retrying': isRetrying.value
    }))
    
    /**
     * 状态提示文本
     */
    const statusTooltip = computed(() => {
      if (isRetrying.value) return '正在重连...'
      return isOnline.value ? '网络正常' : '网络断开'
    })
    
    /**
     * 状态显示文本
     */
    const statusText = computed(() => {
      if (isRetrying.value) return '重连中'
      return isOnline.value ? '在线' : '离线'
    })
    
    /**
     * 详情面板样式类
     */
    const detailsPanelClass = computed(() => ({
      [`details--${props.position}`]: true
    }))
    
    /**
     * 位置样式类
     */
    const positionClass = computed(() => `network-status--${props.position}`)
    
    /**
     * 连接质量等级
     */
    const qualityLevel = computed(() => {
      const quality = connectionQuality.value
      if (quality === 'fast' || quality === '4g') return 4
      if (quality === 'good' || quality === '3g') return 3
      if (quality === 'slow' || quality === '2g') return 2
      return 1
    })
    
    /**
     * 格式化的最后检查时间
     */
    const lastCheckTimeFormatted = computed(() => {
      return lastCheckTime.value.toLocaleTimeString()
    })
    
    // =========================
    // 网络状态检测接口
    // =========================
    
    /**
     * 检测网络状态
     */
    async function detectNetworkStatus() {
      const wasOnline = isOnline.value
      isOnline.value = navigator.onLine
      lastCheckTime.value = new Date()

      // 检测连接质量
      if (isOnline.value) {
        await detectConnectionQuality()
        detectNetworkType()
      } else {
        connectionQuality.value = 'none'
        networkType.value = 'none'
        connectionSpeed.value = ''
      }

      // 如果状态改变，发送事件
      if (wasOnline !== isOnline.value) {
        emitNetworkStatusChange()
      }
    }
    
    /**
     * 检测连接质量
     */
    async function detectConnectionQuality() {
      try {
        // 使用Connection API（如果可用）
        if ('connection' in navigator) {
          const connection = navigator.connection
          connectionQuality.value = connection.effectiveType || 'unknown'
          networkType.value = connection.type || 'unknown'
          
          if (connection.downlink) {
            connectionSpeed.value = `${connection.downlink} Mbps`
          }
          
          return
        }

        // 回退到简单的网络测试
        const startTime = performance.now()
        await fetch('/favicon.ico?t=' + Date.now(), { 
          cache: 'no-cache',
          method: 'HEAD'
        })
        const endTime = performance.now()
        const latency = endTime - startTime

        if (latency < 100) {
          connectionQuality.value = 'fast'
        } else if (latency < 500) {
          connectionQuality.value = 'good'
        } else {
          connectionQuality.value = 'slow'
        }
      } catch (error) {
        connectionQuality.value = 'poor'
        console.warn('网络质量检测失败:', error)
      }
    }
    
    /**
     * 检测网络类型
     */
    function detectNetworkType() {
      if ('connection' in navigator && navigator.connection.type) {
        networkType.value = navigator.connection.type
      } else {
        // 简单判断
        networkType.value = 'unknown'
      }
    }
    
    /**
     * 更新网络状态
     */
    async function updateNetworkStatus() {
      await detectNetworkStatus()
    }
    
    /**
     * 检查网络状态（公共方法）
     */
    async function checkNetworkStatus() {
      await updateNetworkStatus()
      
      // 显示检查完成的反馈
      if (props.autoHide) {
        showAutoHideMessage()
      }
    }
    
    // =========================
    // 网络事件监听
    // =========================
    
    /**
     * 监听网络变化
     */
    function watchNetworkChanges() {
      const handleOnline = () => {
        isOnline.value = true
        updateNetworkStatus()
      }

      const handleOffline = () => {
        isOnline.value = false
        updateNetworkStatus()
      }

      window.addEventListener('online', handleOnline)
      window.addEventListener('offline', handleOffline)

      networkEventHandlers.push(
        { event: 'online', handler: handleOnline },
        { event: 'offline', handler: handleOffline }
      )

      // 监听连接变化（如果支持）
      if ('connection' in navigator) {
        const handleConnectionChange = () => {
          updateNetworkStatus()
        }
        
        navigator.connection.addEventListener('change', handleConnectionChange)
        networkEventHandlers.push(
          { target: navigator.connection, event: 'change', handler: handleConnectionChange }
        )
      }
    }
    
    /**
     * 清理网络事件监听
     */
    function cleanupNetworkWatchers() {
      networkEventHandlers.forEach(({ target = window, event, handler }) => {
        target.removeEventListener(event, handler)
      })
      networkEventHandlers = []
    }
    
    // =========================
    // 用户交互处理接口
    // =========================
    
    /**
     * 切换详细信息显示
     * 显示或隐藏网络状态详细信息面板
     * 
     * @returns {void}
     */
    function toggleDetails() {
      showDetailsPanel.value = !showDetailsPanel.value
      emit('toggle-details', showDetailsPanel.value)

      if (showDetailsPanel.value && props.autoHide) {
        startAutoHideTimer()
      }
    }
    
    /**
     * 隐藏详情
     */
    function hideDetails() {
      showDetailsPanel.value = false
      emit('toggle-details', false)
      clearAutoHideTimer()
    }
    
    /**
     * 启动自动隐藏定时器
     */
    function startAutoHideTimer() {
      clearAutoHideTimer()
      
      if (props.autoHide && props.autoHideDelay > 0) {
        autoHideTimer = setTimeout(() => {
          hideDetails()
        }, props.autoHideDelay)
      }
    }
    
    /**
     * 清理自动隐藏定时器
     */
    function clearAutoHideTimer() {
      if (autoHideTimer) {
        clearTimeout(autoHideTimer)
        autoHideTimer = null
      }
    }
    
    /**
     * 显示自动隐藏消息
     */
    function showAutoHideMessage() {
      // 这里可以显示一个临时的状态更新消息
      // 实现可以是一个toast或者临时的状态指示
    }
    
    /**
     * 处理重试连接
     * 执行网络连接重试操作
     * 
     * @returns {Promise<void>}
     */
    async function handleRetry() {
      if (isRetrying.value) return

      isRetrying.value = true
      emit('retry-connection')

      try {
        // 等待一段时间后重新检测
        await new Promise(resolve => setTimeout(resolve, 2000))
        await updateNetworkStatus()
      } finally {
        isRetrying.value = false
      }
    }
    
    /**
     * 处理清理缓存
     * 清理网络缓存
     * 
     * @returns {void}
     */
    async function handleClearCache() {
      emit('clear-cache')
      
      // 显示操作反馈
      if (props.autoHide) {
        showAutoHideMessage()
      }
    }
    
    /**
     * 发送网络状态变化事件
     */
    function emitNetworkStatusChange() {
      const status = {
        isOnline: isOnline.value,
        connectionQuality: connectionQuality.value,
        networkType: networkType.value,
        connectionSpeed: connectionSpeed.value,
        lastCheck: lastCheckTime.value,
        timestamp: new Date().toISOString()
      }
      
      emit('network-status-change', status)
    }
    
    // =========================
    // 生命周期钩子
    // =========================
    
    /**
     * 组件挂载后初始化
     */
    onMounted(async () => {
      await detectNetworkStatus()
      watchNetworkChanges()
    })
    
    /**
     * 组件卸载前清理
     */
    onBeforeUnmount(() => {
      cleanupNetworkWatchers()
      clearAutoHideTimer()
    })
    
    // =========================
    // 监听器
    // =========================
    
    // 监听showDetails属性变化
    watch(() => props.showDetails, (newValue) => {
      showDetailsPanel.value = newValue
      if (newValue && props.autoHide) {
        startAutoHideTimer()
      }
    })
    
    // =========================
    // 返回组件接口
    // =========================
    return {
      // 响应式状态
      isOnline,
      showDetailsPanel,
      isRetrying,
      lastCheckTime,
      connectionQuality,
      networkType,
      connectionSpeed,
      qualityLevel,
      
      // 计算属性
      statusIndicatorClass,
      iconClass,
      statusTooltip,
      statusText,
      detailsPanelClass,
      positionClass,
      lastCheckTimeFormatted,
      
      // 方法
      toggleDetails,
      hideDetails,
      handleRetry,
      handleClearCache,
      checkNetworkStatus,
      updateNetworkStatus
    }
  }
}
</script>

<style scoped>
/* TODO: 实现组件样式 */
.network-status {
  position: fixed;
  z-index: 1000;
  background: rgba(255, 255, 255, 0.95);
  border-radius: 8px;
  padding: 8px 12px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.15);
  cursor: pointer;
  transition: all 0.3s ease;
  backdrop-filter: blur(10px);
  border: 1px solid rgba(0, 0, 0, 0.1);
}

/* 位置样式 */
.network-status--top-left {
  top: 20px;
  left: 20px;
}

.network-status--top-right {
  top: 20px;
  right: 20px;
}

.network-status--bottom-left {
  bottom: 20px;
  left: 20px;
}

.network-status--bottom-right {
  bottom: 20px;
  right: 20px;
}

/* 状态样式 */
.network-status--online {
  border-left: 4px solid #4CAF50;
}

.network-status--offline {
  border-left: 4px solid #F44336;
  background: rgba(244, 67, 54, 0.1);
}

.network-status--details-open {
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.2);
}

/* 指示器样式 */
.network-status__indicator {
  display: flex;
  align-items: center;
  gap: 8px;
  min-width: 80px;
}

.network-status__icon {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 20px;
  height: 20px;
  transition: all 0.3s ease;
}

.icon {
  width: 100%;
  height: 100%;
  transition: all 0.3s ease;
}

.icon--online {
  color: #4CAF50;
}

.icon--offline {
  color: #F44336;
}

.icon--retrying {
  animation: spin 1s linear infinite;
}

@keyframes spin {
  from { transform: rotate(0deg); }
  to { transform: rotate(360deg); }
}

.network-status__text {
  font-size: 12px;
  font-weight: 500;
  color: #333;
  white-space: nowrap;
}

/* 连接质量指示器 */
.network-status__quality {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-top: 4px;
  padding-top: 4px;
  border-top: 1px solid rgba(0, 0, 0, 0.1);
}

.quality-bars {
  display: flex;
  gap: 2px;
}

.quality-bar {
  width: 3px;
  height: 8px;
  background: #ddd;
  border-radius: 1px;
  transition: background-color 0.3s ease;
}

.quality-bar.active {
  background: #4CAF50;
}

.quality-text {
  font-size: 10px;
  color: #666;
}

/* 详情面板 */
.network-status__details {
  position: absolute;
  min-width: 280px;
  background: white;
  border-radius: 8px;
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.15);
  border: 1px solid rgba(0, 0, 0, 0.1);
  overflow: hidden;
  z-index: 1001;
}

.details--top-left,
.details--top-right {
  top: 100%;
  margin-top: 8px;
}

.details--bottom-left,
.details--bottom-right {
  bottom: 100%;
  margin-bottom: 8px;
}

.details--top-left,
.details--bottom-left {
  left: 0;
}

.details--top-right,
.details--bottom-right {
  right: 0;
}

.details-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 12px 16px;
  background: #f5f5f5;
  border-bottom: 1px solid #eee;
}

.details-header h4 {
  margin: 0;
  font-size: 14px;
  font-weight: 600;
  color: #333;
}

.close-btn {
  background: none;
  border: none;
  font-size: 18px;
  cursor: pointer;
  color: #666;
  padding: 0;
  width: 20px;
  height: 20px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 50%;
  transition: all 0.2s ease;
}

.close-btn:hover {
  background: #e0e0e0;
  color: #333;
}

.details-content {
  padding: 16px;
}

.status-info {
  margin-bottom: 16px;
}

.info-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 8px;
  font-size: 12px;
}

.info-item:last-child {
  margin-bottom: 0;
}

.label {
  color: #666;
  font-weight: 500;
}

.value {
  color: #333;
  font-weight: 600;
}

.value.online {
  color: #4CAF50;
}

.value.offline {
  color: #F44336;
}

/* 操作按钮 */
.action-buttons {
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
}

.btn {
  padding: 6px 12px;
  border: none;
  border-radius: 4px;
  font-size: 11px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s ease;
  flex: 1;
  min-width: 0;
}

.btn:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.btn-primary {
  background: #2196F3;
  color: white;
}

.btn-primary:hover:not(:disabled) {
  background: #1976D2;
}

.btn-secondary {
  background: #FF9800;
  color: white;
}

.btn-secondary:hover {
  background: #F57C00;
}

.btn-info {
  background: #4CAF50;
  color: white;
}

.btn-info:hover {
  background: #388E3C;
}

/* 过渡动画 */
.fade-slide-enter-active,
.fade-slide-leave-active {
  transition: all 0.3s ease;
}

.fade-slide-enter-from {
  opacity: 0;
  transform: translateY(-10px);
}

.fade-slide-leave-to {
  opacity: 0;
  transform: translateY(-10px);
}

/* 响应式设计 */
@media (max-width: 480px) {
  .network-status {
    position: relative;
    width: 100%;
    margin: 0;
  }
  
  .network-status__details {
    position: fixed;
    top: 50%;
    left: 50%;
    transform: translate(-50%, -50%);
    min-width: 300px;
    max-width: 90vw;
  }
  
  .action-buttons {
    flex-direction: column;
  }
  
  .btn {
    flex: none;
  }
}

/* 深色主题支持 */
@media (prefers-color-scheme: dark) {
  .network-status {
    background: rgba(33, 33, 33, 0.95);
    border-color: rgba(255, 255, 255, 0.1);
  }
  
  .network-status__text {
    color: #fff;
  }
  
  .network-status__details {
    background: #333;
    border-color: rgba(255, 255, 255, 0.1);
  }
  
  .details-header {
    background: #404040;
    border-color: rgba(255, 255, 255, 0.1);
  }
  
  .details-header h4 {
    color: #fff;
  }
  
  .close-btn {
    color: #ccc;
  }
  
  .close-btn:hover {
    background: #555;
    color: #fff;
  }
  
  .label {
    color: #ccc;
  }
  
  .value {
    color: #fff;
  }
}
</style> 