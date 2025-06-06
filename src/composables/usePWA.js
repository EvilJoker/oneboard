import { ref, reactive } from 'vue'

/**
 * PWA核心功能管理组合函数
 * 提供PWA安装、状态检测、网络管理和数据持久化功能
 */
export function usePWA() {
  // =========================
  // 响应式状态定义
  // =========================
  
  // PWA安装相关状态
  const isInstallable = ref(false)
  const isInstalled = ref(false)
  const installPromptDismissed = ref(false)
  
  // PWA功能状态
  const updateAvailable = ref(false)
  const notificationEnabled = ref(false)
  
  // 网络状态
  const isOnline = ref(navigator.onLine)
  const lastNetworkChange = ref(new Date().toISOString())
  
  // 内部状态
  let deferredPrompt = null
  let networkListeners = []

  // =========================
  // PWA安装管理
  // =========================

  /**
   * 显示PWA安装提示
   * @returns {Promise<boolean>} 是否成功显示安装提示
   */
  async function showInstallPrompt() {
    try {
      if (!deferredPrompt || !isInstallable.value) {
        return false
      }

      // 显示安装提示
      await deferredPrompt.prompt()
      
      // 等待用户选择
      const choiceResult = await deferredPrompt.userChoice
      
      if (choiceResult.outcome === 'accepted') {
        isInstalled.value = true
        isInstallable.value = false
        savePWAState()
      } else {
        installPromptDismissed.value = true
        isInstallable.value = false
        savePWAState()
      }
      
      // 清除deferred prompt引用
      deferredPrompt = null
      
      return true
    } catch (error) {
      console.error('安装提示显示失败:', error)
      return false
    }
  }

  /**
   * 忽略安装提示
   */
  function dismissInstallPrompt() {
    installPromptDismissed.value = true
    isInstallable.value = false
    deferredPrompt = null
    savePWAState()
  }

  // =========================
  // PWA状态检测
  // =========================

  /**
   * 检查应用更新
   * @returns {Promise<boolean>} 是否有可用更新
   */
  async function checkForUpdates() {
    try {
      if (!('serviceWorker' in navigator)) {
        return false
      }

      const registration = await navigator.serviceWorker.ready
      await registration.update()
      
      // 检查是否有waiting的Service Worker
      const hasUpdate = registration.waiting !== null || registration.installing !== null
      updateAvailable.value = hasUpdate
      
      return hasUpdate
    } catch (error) {
      console.error('更新检查失败:', error)
      updateAvailable.value = false
      return false
    }
  }

  /**
   * 启用通知功能
   * @returns {Promise<boolean>} 是否成功启用通知
   */
  async function enableNotifications() {
    try {
      if (!('Notification' in window)) {
        notificationEnabled.value = false
        return false
      }

      if (Notification.permission === 'granted') {
        notificationEnabled.value = true
        savePWAState()
        return true
      }

      const permission = await Notification.requestPermission()
      const enabled = permission === 'granted'
      
      notificationEnabled.value = enabled
      savePWAState()
      
      return enabled
    } catch (error) {
      console.error('通知权限请求失败:', error)
      notificationEnabled.value = false
      return false
    }
  }

  // =========================
  // 网络状态管理
  // =========================

  /**
   * 更新网络状态
   * @param {boolean} online - 网络在线状态
   */
  function updateNetworkStatus(online) {
    isOnline.value = online
    lastNetworkChange.value = new Date().toISOString()
    savePWAState()
  }

  /**
   * 监听网络状态变化
   * @returns {Function} 清理函数
   */
  function watchNetworkStatus() {
    const onlineHandler = () => updateNetworkStatus(true)
    const offlineHandler = () => updateNetworkStatus(false)
    
    window.addEventListener('online', onlineHandler)
    window.addEventListener('offline', offlineHandler)
    
    networkListeners.push(
      { type: 'online', handler: onlineHandler },
      { type: 'offline', handler: offlineHandler }
    )
    
    // 返回清理函数
    return () => {
      window.removeEventListener('online', onlineHandler)
      window.removeEventListener('offline', offlineHandler)
      networkListeners = networkListeners.filter(
        listener => listener.handler !== onlineHandler && listener.handler !== offlineHandler
      )
    }
  }

  // =========================
  // 状态持久化
  // =========================

  /**
   * 保存PWA状态到localStorage
   */
  function savePWAState() {
    try {
      const state = {
        isInstalled: isInstalled.value,
        installPromptDismissed: installPromptDismissed.value,
        notificationEnabled: notificationEnabled.value,
        lastNetworkChange: lastNetworkChange.value,
        isOnline: isOnline.value
      }
      
      localStorage.setItem('pwa_state', JSON.stringify(state))
    } catch (error) {
      console.error('PWA状态保存失败:', error)
    }
  }

  /**
   * 从localStorage恢复PWA状态
   */
  function restorePWAState() {
    try {
      const savedState = localStorage.getItem('pwa_state')
      if (!savedState) {
        return
      }

      const state = JSON.parse(savedState)
      
      if (typeof state === 'object' && state !== null) {
        isInstalled.value = state.isInstalled || false
        installPromptDismissed.value = state.installPromptDismissed || false
        notificationEnabled.value = state.notificationEnabled || false
        
        if (state.lastNetworkChange) {
          lastNetworkChange.value = state.lastNetworkChange
        }
        
        // 网络状态优先使用当前实际状态
        isOnline.value = navigator.onLine
      }
    } catch (error) {
      console.error('PWA状态恢复失败:', error)
    }
  }

  // =========================
  // 生命周期管理
  // =========================

  /**
   * 初始化PWA功能
   */
  async function initializePWA() {
    // 恢复保存的状态
    restorePWAState()
    
    // 设置当前网络状态
    isOnline.value = navigator.onLine
    
    // 监听beforeinstallprompt事件
    const handleBeforeInstallPrompt = (event) => {
      event.preventDefault()
      deferredPrompt = event
      
      // 只有在用户未安装且未忽略提示时才显示
      if (!isInstalled.value && !installPromptDismissed.value) {
        isInstallable.value = true
      }
    }
    
    // 监听appinstalled事件
    const handleAppInstalled = () => {
      isInstalled.value = true
      isInstallable.value = false
      deferredPrompt = null
      savePWAState()
    }
    
    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt)
    window.addEventListener('appinstalled', handleAppInstalled)
    
    // 开始监听网络状态
    watchNetworkStatus()
    
    // 存储事件处理器引用用于清理
    this._installPromptHandler = handleBeforeInstallPrompt
    this._appInstalledHandler = handleAppInstalled
  }

  /**
   * 清理PWA功能
   */
  function cleanupPWA() {
    // 移除事件监听器
    if (this._installPromptHandler) {
      window.removeEventListener('beforeinstallprompt', this._installPromptHandler)
    }
    
    if (this._appInstalledHandler) {
      window.removeEventListener('appinstalled', this._appInstalledHandler)
    }
    
    // 清理网络状态监听器
    networkListeners.forEach(({ type, handler }) => {
      window.removeEventListener(type, handler)
    })
    networkListeners = []
    
    // 清理引用
    deferredPrompt = null
  }

  // =========================
  // 公共接口
  // =========================

  return {
    // 状态
    isInstallable,
    isInstalled,
    installPromptDismissed,
    updateAvailable,
    notificationEnabled,
    isOnline,
    lastNetworkChange,
    
    // 方法
    showInstallPrompt,
    dismissInstallPrompt,
    checkForUpdates,
    enableNotifications,
    updateNetworkStatus,
    watchNetworkStatus,
    savePWAState,
    restorePWAState,
    initializePWA,
    cleanupPWA
  }
} 