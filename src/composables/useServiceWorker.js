import { ref, computed } from 'vue'

/**
 * Service Worker管理组合函数
 * 提供Service Worker注册、缓存管理、通信等功能
 */
export function useServiceWorker() {
  // =========================
  // 响应式状态定义
  // =========================
  
  // Service Worker状态
  const isRegistered = ref(false)
  const isActive = ref(false)
  const updateAvailable = ref(false)
  
  // 缓存相关状态
  const cacheSize = ref(0)
  const lastCacheUpdate = ref(null)
  const registration = ref(null)
  const cacheVersion = ref('v1.0.0')
  
  // 内部状态
  let messageListeners = []
  let currentTimeout = null

  // =========================
  // Service Worker生命周期管理
  // =========================

  /**
   * 注册Service Worker
   * @param {string} scriptURL - Service Worker脚本路径
   * @param {Object} options - 注册选项
   * @returns {Promise<ServiceWorkerRegistration>} 注册对象
   */
  async function registerServiceWorker(scriptURL, options = {}) {
    try {
      if (!('serviceWorker' in navigator)) {
        throw new Error('Service Worker不被支持')
      }

      // 如果已经注册，返回现有注册
      if (registration.value) {
        return registration.value
      }

      const reg = await navigator.serviceWorker.register(scriptURL, options)
      
      registration.value = reg
      isRegistered.value = true
      
      // 检查Service Worker状态
      updateServiceWorkerState(reg)
      
      // 监听状态变化
      if (reg.installing) {
        reg.installing.addEventListener('statechange', () => updateServiceWorkerState(reg))
      }
      
      if (reg.waiting) {
        updateAvailable.value = true
      }
      
      return reg
    } catch (error) {
      isRegistered.value = false
      isActive.value = false
      throw error
    }
  }

  /**
   * 注销Service Worker
   * @returns {Promise<boolean>} 是否成功注销
   */
  async function unregisterServiceWorker() {
    try {
      if (!registration.value) {
        return false
      }

      const result = await registration.value.unregister()
      
      if (result) {
        registration.value = null
        isRegistered.value = false
        isActive.value = false
        updateAvailable.value = false
        cacheSize.value = 0
      }
      
      return result
    } catch (error) {
      console.error('Service Worker注销失败:', error)
      return false
    }
  }

  /**
   * 更新Service Worker
   * @returns {Promise<boolean>} 是否有可用更新
   */
  async function updateServiceWorker() {
    try {
      if (!registration.value) {
        return false
      }

      await registration.value.update()
      
      // 检查是否有waiting或installing的worker
      const hasUpdate = registration.value.waiting !== null || registration.value.installing !== null
      updateAvailable.value = hasUpdate
      
      return hasUpdate
    } catch (error) {
      console.error('Service Worker更新失败:', error)
      updateAvailable.value = false
      return false
    }
  }

  /**
   * 跳过等待，激活新的Service Worker
   */
  async function skipWaiting() {
    if (registration.value && registration.value.waiting) {
      registration.value.waiting.postMessage({ type: 'SKIP_WAITING' })
    }
  }

  /**
   * 更新Service Worker状态
   * @private
   */
  function updateServiceWorkerState(reg) {
    if (reg.active && reg.active.state === 'activated') {
      isActive.value = true
    } else {
      isActive.value = false
    }
  }

  // =========================
  // 缓存管理
  // =========================

  /**
   * 获取缓存总大小
   * @returns {Promise<number>} 缓存大小（字节）
   */
  async function getCacheSize() {
    try {
      if (!('caches' in window)) {
        return 0
      }

      const cacheNames = await caches.keys()
      let totalSize = 0

      for (const cacheName of cacheNames) {
        const cache = await caches.open(cacheName)
        const keys = await cache.keys()
        
        for (const request of keys) {
          const response = await cache.match(request)
          if (response) {
            const contentLength = response.headers.get('content-length')
            if (contentLength) {
              totalSize += parseInt(contentLength, 10)
            }
          }
        }
      }

      cacheSize.value = totalSize
      lastCacheUpdate.value = new Date().toISOString()
      
      return totalSize
    } catch (error) {
      console.error('缓存大小计算失败:', error)
      cacheSize.value = 0
      return 0
    }
  }

  /**
   * 清理所有缓存
   * @returns {Promise<boolean>} 是否成功清理
   */
  async function clearCache() {
    try {
      if (!('caches' in window)) {
        return false
      }

      const cacheNames = await caches.keys()
      const deletePromises = cacheNames.map(name => caches.delete(name))
      
      const results = await Promise.allSettled(deletePromises)
      const allSuccess = results.every(result => result.status === 'fulfilled' && result.value === true)
      
      if (allSuccess) {
        cacheSize.value = 0
        lastCacheUpdate.value = new Date().toISOString()
      }
      
      return allSuccess
    } catch (error) {
      console.error('缓存清理失败:', error)
      return false
    }
  }

  /**
   * 清理特定缓存
   * @param {string} cacheName - 缓存名称
   * @returns {Promise<boolean>} 是否成功清理
   */
  async function clearSpecificCache(cacheName) {
    try {
      if (!('caches' in window) || !cacheName) {
        return false
      }

      const result = await caches.delete(cacheName)
      
      if (result) {
        // 重新计算缓存大小
        await getCacheSize()
      }
      
      return result
    } catch (error) {
      console.error(`缓存 ${cacheName} 清理失败:`, error)
      return false
    }
  }

  /**
   * 预加载关键资源
   * @param {string[]} urls - 需要预加载的URL列表
   * @returns {Promise<boolean>} 是否成功预加载
   */
  async function preloadCriticalAssets(urls) {
    try {
      if (!('caches' in window) || !Array.isArray(urls) || urls.length === 0) {
        return false
      }

      // 过滤有效的URL
      const validUrls = urls.filter(url => url && typeof url === 'string' && url.trim())
      
      if (validUrls.length === 0) {
        return false
      }

      const cacheName = `critical-assets-${cacheVersion.value}`
      const cache = await caches.open(cacheName)
      
      await cache.addAll(validUrls)
      
      // 更新缓存信息
      await getCacheSize()
      
      return true
    } catch (error) {
      console.error('关键资源预加载失败:', error)
      return false
    }
  }

  // =========================
  // Service Worker通信
  // =========================

  /**
   * 向Service Worker发送消息
   * @param {Object} message - 要发送的消息
   * @param {number} timeout - 超时时间（毫秒）
   * @returns {Promise<any>} Service Worker的响应
   */
  async function sendMessageToSW(message, timeout = 5000) {
    return new Promise((resolve, reject) => {
      if (!navigator.serviceWorker.controller) {
        reject(new Error('没有可用的Service Worker控制器'))
        return
      }

      const channel = new MessageChannel()
      
      // 设置超时
      currentTimeout = setTimeout(() => {
        reject(new Error('Service Worker消息超时'))
      }, timeout)
      
      // 监听响应
      channel.port1.onmessage = (event) => {
        clearTimeout(currentTimeout)
        resolve(event.data)
      }
      
      // 发送消息
      navigator.serviceWorker.controller.postMessage(message, [channel.port2])
    })
  }

  /**
   * 监听Service Worker消息
   * @param {Function} handler - 消息处理函数
   * @returns {Function} 清理函数
   */
  function listenToSWMessages(handler) {
    const messageHandler = (event) => {
      // 确保消息来自Service Worker
      if (event.source === navigator.serviceWorker.controller) {
        handler(event.data)
      }
    }
    
    window.addEventListener('message', messageHandler)
    messageListeners.push(messageHandler)
    
    // 返回清理函数
    return () => {
      window.removeEventListener('message', messageHandler)
      messageListeners = messageListeners.filter(listener => listener !== messageHandler)
    }
  }

  /**
   * 获取Service Worker状态
   * @returns {Object} 当前状态信息
   */
  function getServiceWorkerState() {
    return {
      isRegistered: isRegistered.value,
      isActive: isActive.value,
      updateAvailable: updateAvailable.value,
      cacheSize: cacheSize.value,
      registration: registration.value,
      cacheVersion: cacheVersion.value
    }
  }

  // =========================
  // 离线策略管理
  // =========================

  /**
   * 设置缓存策略
   * @param {Object} strategy - 缓存策略配置
   * @returns {Promise<boolean>} 是否设置成功
   */
  async function setCacheStrategy(strategy) {
    try {
      if (!strategy || typeof strategy !== 'object') {
        return false
      }

      // 验证策略配置
      const { name, pattern, handler, options } = strategy
      
      if (!name || !pattern || !handler) {
        return false
      }

      // 通过Service Worker设置策略
      const message = {
        type: 'SET_CACHE_STRATEGY',
        payload: strategy
      }

      await sendMessageToSW(message)
      return true
    } catch (error) {
      console.error('缓存策略设置失败:', error)
      return false
    }
  }

  /**
   * 获取缓存统计信息
   * @returns {Promise<Object>} 缓存统计数据
   */
  async function getCacheStats() {
    try {
      const message = { type: 'CACHE_STATS' }
      const stats = await sendMessageToSW(message)
      
      return stats
    } catch (error) {
      console.error('获取缓存统计失败:', error)
      return {
        totalSize: 0,
        totalEntries: 0,
        hitRate: 0,
        missRate: 0,
        cachesByName: {},
        lastUpdate: new Date().toISOString()
      }
    }
  }

  // =========================
  // 初始化和清理
  // =========================

  /**
   * 初始化Service Worker
   */
  async function initializeServiceWorker() {
    try {
      // 检查浏览器支持
      if (!('serviceWorker' in navigator)) {
        console.warn('浏览器不支持Service Worker')
        isRegistered.value = false
        return
      }

      // 检查是否已有注册的Service Worker
      const existingRegistration = await navigator.serviceWorker.getRegistration()
      
      if (existingRegistration) {
        registration.value = existingRegistration
        isRegistered.value = true
        updateServiceWorkerState(existingRegistration)
        
        // 检查更新
        await updateServiceWorker()
      }

      // 获取初始缓存大小
      await getCacheSize()
    } catch (error) {
      console.error('Service Worker初始化失败:', error)
      isRegistered.value = false
    }
  }

  /**
   * 清理Service Worker资源
   */
  function cleanupServiceWorker() {
    // 清理消息监听器
    messageListeners.forEach(handler => {
      window.removeEventListener('message', handler)
    })
    messageListeners = []
    
    // 清理超时
    if (currentTimeout) {
      clearTimeout(currentTimeout)
      currentTimeout = null
    }
  }

  // =========================
  // 计算属性
  // =========================

  const isSupported = computed(() => 'serviceWorker' in navigator)
  const hasRegistration = computed(() => registration.value !== null)

  // =========================
  // 公共接口
  // =========================

  return {
    // 状态
    isRegistered,
    isActive,
    updateAvailable,
    cacheSize,
    lastCacheUpdate,
    registration,
    cacheVersion,
    isSupported,
    hasRegistration,
    
    // Service Worker生命周期
    registerServiceWorker,
    unregisterServiceWorker,
    updateServiceWorker,
    skipWaiting,
    
    // 缓存管理
    getCacheSize,
    clearCache,
    clearSpecificCache,
    preloadCriticalAssets,
    
    // 通信
    sendMessageToSW,
    listenToSWMessages,
    getServiceWorkerState,
    
    // 离线策略
    setCacheStrategy,
    getCacheStats,
    
    // 生命周期
    initializeServiceWorker,
    cleanupServiceWorker
  }
} 