import { ref, computed, onMounted, onBeforeUnmount } from 'vue'

/**
 * 网络状态检测和管理组合函数
 * 提供网络连接状态检测、质量评估和事件监听功能
 */
export function useNetworkStatus() {
  // =========================
  // 响应式状态定义
  // =========================
  
  /**
   * 当前网络在线状态
   * @type {Ref<boolean>}
   */
  const isOnline = ref(navigator.onLine || false)
  
  /**
   * 网络连接类型
   * @type {Ref<string>}
   */
  const networkType = ref('unknown')
  
  /**
   * 有效连接类型（连接质量）
   * @type {Ref<string>}
   */
  const effectiveType = ref('4g')
  
  /**
   * 下行带宽（Mbps）
   * @type {Ref<number>}
   */
  const downlink = ref(0)
  
  /**
   * 往返时间（毫秒）
   * @type {Ref<number>}
   */
  const rtt = ref(0)
  
  /**
   * 是否启用数据节省模式
   * @type {Ref<boolean>}
   */
  const saveData = ref(false)
  
  /**
   * 最后检测时间
   * @type {Ref<Date>}
   */
  const lastCheckTime = ref(new Date())
  
  /**
   * 网络状态变化次数
   * @type {Ref<number>}
   */
  const changeCount = ref(0)
  
  // 内部状态
  let networkListeners = []
  let connectionChangeListeners = []
  let checkInterval = null

  // =========================
  // 计算属性
  // =========================
  
  /**
   * 网络状态描述
   */
  const networkStatus = computed(() => {
    if (!isOnline.value) return 'offline'
    
    if (effectiveType.value === 'slow-2g' || effectiveType.value === '2g') {
      return 'slow'
    }
    
    return 'online'
  })
  
  /**
   * 连接质量评分 (0-100)
   */
  const connectionQuality = computed(() => {
    if (!isOnline.value) return 0
    
    let score = 100
    
    // 基于有效连接类型评分
    switch (effectiveType.value) {
      case '4g':
        score = 100
        break
      case '3g':
        score = 75
        break
      case '2g':
        score = 50
        break
      case 'slow-2g':
        score = 25
        break
      default:
        score = 80
    }
    
    // 基于RTT调整评分
    if (rtt.value > 0) {
      if (rtt.value < 100) {
        score = Math.min(100, score + 10)
      } else if (rtt.value > 1000) {
        score = Math.max(0, score - 30)
      }
    }
    
    // 基于带宽调整评分
    if (downlink.value > 0) {
      if (downlink.value >= 10) {
        score = Math.min(100, score + 5)
      } else if (downlink.value < 1) {
        score = Math.max(0, score - 20)
      }
    }
    
    return Math.round(score)
  })
  
  /**
   * 是否为慢速连接
   */
  const isSlowConnection = computed(() => {
    return saveData.value || 
           effectiveType.value === '2g' || 
           effectiveType.value === 'slow-2g' ||
           rtt.value > 1000 ||
           downlink.value < 1
  })
  
  /**
   * 连接描述文本
   */
  const connectionDescription = computed(() => {
    if (!isOnline.value) return '离线'
    
    const parts = []
    
    if (networkType.value && networkType.value !== 'unknown') {
      parts.push(networkType.value)
    }
    
    if (effectiveType.value && effectiveType.value !== 'unknown') {
      parts.push(effectiveType.value.toUpperCase())
    }
    
    if (downlink.value > 0) {
      parts.push(`${downlink.value} Mbps`)
    }
    
    return parts.length > 0 ? parts.join(' ') : '在线'
  })

  // =========================
  // 网络状态检测
  // =========================
  
  /**
   * 检测网络连接信息
   */
  function detectConnectionInfo() {
    // 使用Connection API获取详细信息
    if ('connection' in navigator) {
      const connection = navigator.connection
      
      networkType.value = connection.type || 'unknown'
      effectiveType.value = connection.effectiveType || '4g'
      downlink.value = connection.downlink || 0
      rtt.value = connection.rtt || 0
      saveData.value = connection.saveData || false
    }
    
    lastCheckTime.value = new Date()
  }
  
  /**
   * 测试网络连接质量
   * @returns {Promise<Object>} 连接质量测试结果
   */
  async function testConnectionQuality() {
    if (!isOnline.value) {
      return {
        latency: null,
        speed: null,
        quality: 'offline'
      }
    }
    
    try {
      const startTime = performance.now()
      
      // 使用小文件测试连接延迟
      await fetch('/favicon.ico?t=' + Date.now(), {
        cache: 'no-cache',
        method: 'HEAD'
      })
      
      const endTime = performance.now()
      const latency = endTime - startTime
      
      let quality = 'good'
      if (latency < 100) {
        quality = 'excellent'
      } else if (latency < 300) {
        quality = 'good'
      } else if (latency < 1000) {
        quality = 'slow'
      } else {
        quality = 'poor'
      }
      
      return {
        latency: Math.round(latency),
        speed: downlink.value || null,
        quality
      }
    } catch (error) {
      console.warn('网络质量测试失败:', error)
      return {
        latency: null,
        speed: null,
        quality: 'poor'
      }
    }
  }
  
  /**
   * 更新网络状态
   * @param {boolean} online - 网络在线状态
   */
  function updateNetworkStatus(online = navigator.onLine) {
    const wasOnline = isOnline.value
    isOnline.value = online
    
    if (wasOnline !== online) {
      changeCount.value++
      detectConnectionInfo()
    }
  }

  // =========================
  // 事件监听管理
  // =========================
  
  /**
   * 开始监听网络状态变化
   */
  function startNetworkMonitoring() {
    // 监听基本的在线/离线事件
    const onlineHandler = () => updateNetworkStatus(true)
    const offlineHandler = () => updateNetworkStatus(false)
    
    window.addEventListener('online', onlineHandler)
    window.addEventListener('offline', offlineHandler)
    
    networkListeners.push(
      { target: window, event: 'online', handler: onlineHandler },
      { target: window, event: 'offline', handler: offlineHandler }
    )
    
    // 监听连接变化（如果支持）
    if ('connection' in navigator && navigator.connection) {
      const connectionChangeHandler = () => {
        detectConnectionInfo()
      }
      
      navigator.connection.addEventListener('change', connectionChangeHandler)
      connectionChangeListeners.push({
        target: navigator.connection,
        event: 'change',
        handler: connectionChangeHandler
      })
    }
    
    // 定期检查网络状态
    checkInterval = setInterval(() => {
      detectConnectionInfo()
    }, 30000) // 每30秒检查一次
  }
  
  /**
   * 停止监听网络状态变化
   */
  function stopNetworkMonitoring() {
    // 清理基本事件监听器
    networkListeners.forEach(({ target, event, handler }) => {
      target.removeEventListener(event, handler)
    })
    networkListeners = []
    
    // 清理连接变化监听器
    connectionChangeListeners.forEach(({ target, event, handler }) => {
      target.removeEventListener(event, handler)
    })
    connectionChangeListeners = []
    
    // 清理定时器
    if (checkInterval) {
      clearInterval(checkInterval)
      checkInterval = null
    }
  }

  // =========================
  // 生命周期管理
  // =========================
  
  /**
   * 初始化网络状态监控
   */
  function initializeNetworkStatus() {
    // 初始检测
    updateNetworkStatus()
    detectConnectionInfo()
    
    // 开始监控
    startNetworkMonitoring()
  }
  
  /**
   * 清理网络状态监控
   */
  function cleanupNetworkStatus() {
    stopNetworkMonitoring()
  }

  // =========================
  // 组件生命周期钩子
  // =========================
  
  onMounted(() => {
    initializeNetworkStatus()
  })
  
  onBeforeUnmount(() => {
    cleanupNetworkStatus()
  })

  // =========================
  // 公共接口
  // =========================
  
  return {
    // 响应式状态
    isOnline,
    networkType,
    effectiveType,
    downlink,
    rtt,
    saveData,
    lastCheckTime,
    changeCount,
    
    // 计算属性
    networkStatus,
    connectionQuality,
    isSlowConnection,
    connectionDescription,
    
    // 方法
    updateNetworkStatus,
    detectConnectionInfo,
    testConnectionQuality,
    startNetworkMonitoring,
    stopNetworkMonitoring,
    initializeNetworkStatus,
    cleanupNetworkStatus
  }
}

/**
 * 网络状态工具函数
 */
export const networkUtils = {
  /**
   * 检查是否支持Connection API
   * @returns {boolean} 是否支持
   */
  supportsConnectionAPI() {
    return typeof navigator !== 'undefined' && 'connection' in navigator && !!navigator.connection
  },
  
  /**
   * 获取连接类型描述
   * @param {string} type - 连接类型
   * @returns {string} 连接类型描述
   */
  getConnectionTypeDescription(type) {
    const descriptions = {
      'bluetooth': '蓝牙',
      'cellular': '蜂窝网络',
      'ethernet': '以太网',
      'wifi': 'WiFi',
      'wimax': 'WiMAX',
      'other': '其他',
      'unknown': '未知',
      'none': '无连接'
    }
    
    return descriptions[type] || type
  },
  
  /**
   * 获取有效类型描述
   * @param {string} effectiveType - 有效连接类型
   * @returns {string} 有效类型描述
   */
  getEffectiveTypeDescription(effectiveType) {
    const descriptions = {
      'slow-2g': '极慢 (< 50 Kbps)',
      '2g': '慢速 (< 250 Kbps)',
      '3g': '中速 (< 1.5 Mbps)',
      '4g': '快速 (>= 1.5 Mbps)'
    }
    
    return descriptions[effectiveType] || effectiveType
  }
} 