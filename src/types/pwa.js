/**
 * PWA功能相关数据类型定义
 * 定义PWA状态、配置、事件等相关数据结构
 */

// =========================
// PWA状态数据类型
// =========================

/**
 * PWA应用状态数据结构
 * 记录PWA应用的当前状态信息
 * 
 * @typedef {Object} PWAState
 * @property {('online'|'offline'|'slow')} networkStatus - 网络连接状态
 * @property {boolean} installPromptDismissed - 安装提示是否已被忽略
 * @property {boolean} installPromptShown - 安装提示是否已显示过
 * @property {string} lastSyncTime - 最后同步时间 (ISO 8601格式)
 * @property {string} cacheVersion - 当前缓存版本号
 * @property {boolean} isInstalled - PWA是否已安装
 * @property {boolean} isInstallable - PWA是否可安装
 * @property {number} connectionQuality - 连接质量评分 (0-100)
 */
export const PWAStateDefault = {
  networkStatus: 'online',
  installPromptDismissed: false,
  installPromptShown: false,
  lastSyncTime: '',
  cacheVersion: '1.0.0',
  isInstalled: false,
  isInstallable: false,
  connectionQuality: 100
}

/**
 * PWA配置数据结构
 * 定义PWA功能的配置选项
 * 
 * @typedef {Object} PWAConfig
 * @property {boolean} enableNotifications - 是否启用通知功能
 * @property {boolean} enableBackgroundSync - 是否启用后台同步
 * @property {('networkFirst'|'cacheFirst'|'staleWhileRevalidate')} cacheStrategy - 缓存策略
 * @property {string} offlineMessage - 离线状态提示消息
 * @property {number} networkCheckInterval - 网络状态检查间隔(毫秒)
 * @property {boolean} autoInstallPrompt - 是否自动显示安装提示
 * @property {number} installPromptDelay - 安装提示延迟时间(毫秒)
 */
export const PWAConfigDefault = {
  enableNotifications: false,
  enableBackgroundSync: false,
  cacheStrategy: 'staleWhileRevalidate',
  offlineMessage: '当前处于离线状态，部分功能可能受限',
  networkCheckInterval: 30000,
  autoInstallPrompt: true,
  installPromptDelay: 3000
}

// =========================
// Service Worker状态类型
// =========================

/**
 * Service Worker状态数据结构
 * 记录Service Worker的运行状态和缓存信息
 * 
 * @typedef {Object} ServiceWorkerState
 * @property {boolean} isRegistered - Service Worker是否已注册
 * @property {boolean} isActive - Service Worker是否已激活
 * @property {boolean} updateAvailable - 是否有更新可用
 * @property {number} cacheSize - 当前缓存大小(字节)
 * @property {string} lastCacheUpdate - 最后缓存更新时间
 * @property {string} cacheVersion - 缓存版本号
 * @property {Object} registration - Service Worker注册对象
 */
export const ServiceWorkerStateDefault = {
  isRegistered: false,
  isActive: false,
  updateAvailable: false,
  cacheSize: 0,
  lastCacheUpdate: '',
  cacheVersion: '',
  registration: null
}

/**
 * 缓存策略配置
 * 定义不同资源的缓存处理策略
 * 
 * @typedef {Object} CacheStrategy
 * @property {string} name - 策略名称
 * @property {string} pattern - URL匹配模式
 * @property {('CacheFirst'|'NetworkFirst'|'StaleWhileRevalidate')} handler - 缓存处理器
 * @property {Object} options - 策略选项
 * @property {string} options.cacheName - 缓存名称
 * @property {Object} options.expiration - 过期配置
 * @property {number} options.expiration.maxEntries - 最大缓存条目数
 * @property {number} options.expiration.maxAgeSeconds - 最大缓存时间(秒)
 */
export const CacheStrategies = {
  STATIC_ASSETS: {
    name: 'static-assets',
    pattern: /\.(?:js|css|html|ico|png|svg)$/,
    handler: 'CacheFirst',
    options: {
      cacheName: 'static-assets-cache',
      expiration: {
        maxEntries: 100,
        maxAgeSeconds: 60 * 60 * 24 * 365 // 1年
      }
    }
  },
  
  IMAGES: {
    name: 'images',
    pattern: /\.(?:png|jpg|jpeg|svg|gif|webp)$/,
    handler: 'CacheFirst',
    options: {
      cacheName: 'images-cache',
      expiration: {
        maxEntries: 50,
        maxAgeSeconds: 60 * 60 * 24 * 30 // 30天
      }
    }
  },
  
  FONTS: {
    name: 'fonts',
    pattern: /^https:\/\/fonts\.googleapis\.com\/.*/i,
    handler: 'StaleWhileRevalidate',
    options: {
      cacheName: 'google-fonts-cache',
      expiration: {
        maxEntries: 10,
        maxAgeSeconds: 60 * 60 * 24 * 365 // 1年
      }
    }
  }
}

// =========================
// 网络状态类型
// =========================

/**
 * 网络状态信息
 * 保存网络连接状态和质量信息
 */
export class NetworkStatus {
  constructor(options = {}) {
    this.isOnline = options.isOnline ?? true
    this.connectionType = options.connectionType ?? 'unknown'
    this.effectiveType = options.effectiveType ?? '4g'
    this.downlink = options.downlink ?? 10
    this.rtt = options.rtt ?? 100
    this.saveData = options.saveData ?? false
    this.lastCheck = options.lastCheck ?? new Date()
    this.checkInterval = options.checkInterval ?? 30000
    this.quality = options.quality ?? 'unknown'
    this.speed = options.speed ?? null
  }

  /**
   * 更新网络状态
   * @param {Object} updates - 要更新的状态
   */
  update(updates) {
    Object.assign(this, updates)
    this.lastCheck = new Date()
  }

  /**
   * 评估连接质量
   * @returns {string} 连接质量等级
   */
  getQuality() {
    if (!this.isOnline) {
      this.quality = 'offline'
      return this.quality
    }

    if (this.effectiveType) {
      switch (this.effectiveType) {
        case '4g':
          this.quality = 'excellent'
          break
        case '3g':
          this.quality = 'good'
          break
        case '2g':
          this.quality = 'poor'
          break
        case 'slow-2g':
          this.quality = 'poor'
          break
        default:
          this.quality = 'unknown'
      }
    } else if (this.rtt !== null) {
      if (this.rtt < 100) {
        this.quality = 'excellent'
      } else if (this.rtt < 300) {
        this.quality = 'good'
      } else if (this.rtt < 1000) {
        this.quality = 'slow'
      } else {
        this.quality = 'poor'
      }
    }

    return this.quality
  }

  /**
   * 检查是否为慢速连接
   * @returns {boolean} 是否为慢速连接
   */
  isSlowConnection() {
    return this.saveData || 
           this.effectiveType === '2g' || 
           this.effectiveType === 'slow-2g' ||
           (this.rtt !== null && this.rtt > 1000) ||
           (this.downlink !== null && this.downlink < 1)
  }

  /**
   * 获取连接描述
   * @returns {string} 连接描述
   */
  getConnectionDescription() {
    if (!this.isOnline) {
      return '离线'
    }

    const parts = []
    
    if (this.connectionType && this.connectionType !== 'unknown') {
      parts.push(this.connectionType)
    }
    
    if (this.effectiveType && this.effectiveType !== 'unknown') {
      parts.push(this.effectiveType.toUpperCase())
    }
    
    if (this.downlink) {
      parts.push(`${this.downlink} Mbps`)
    }
    
    return parts.length > 0 ? parts.join(' ') : '在线'
  }

  /**
   * 转换为JSON对象
   * @returns {Object} JSON表示
   */
  toJSON() {
    return {
      isOnline: this.isOnline,
      connectionType: this.connectionType,
      effectiveType: this.effectiveType,
      downlink: this.downlink,
      rtt: this.rtt,
      saveData: this.saveData,
      lastCheck: this.lastCheck,
      checkInterval: this.checkInterval,
      quality: this.quality,
      speed: this.speed
    }
  }

  /**
   * 从JSON对象创建实例
   * @param {Object} json - JSON对象
   * @returns {NetworkStatus} NetworkStatus实例
   */
  static fromJSON(json) {
    return new NetworkStatus(json)
  }

  /**
   * 从Connection API创建实例
   * @param {NetworkInformation} connection - Connection API对象
   * @returns {NetworkStatus} NetworkStatus实例
   */
  static fromConnection(connection) {
    return new NetworkStatus({
      isOnline: navigator.onLine,
      connectionType: connection.type || 'unknown',
      effectiveType: connection.effectiveType || 'unknown',
      downlink: connection.downlink || null,
      rtt: connection.rtt || null,
      saveData: connection.saveData || false
    })
  }
}

/**
 * 网络检查结果
 * 存储网络连接检查的结果信息
 */
export class NetworkCheckResult {
  constructor(options = {}) {
    this.isOnline = options.isOnline ?? true
    this.success = options.success ?? true
    this.latency = options.latency ?? 0
    this.timestamp = options.timestamp ?? new Date()
    this.url = options.url ?? ''
    this.status = options.status ?? null
    this.error = options.error ?? null
    this.timeout = options.timeout ?? 5000
    this.retryCount = options.retryCount ?? 0
    this.method = options.method ?? 'navigator'
  }

  /**
   * 计算响应时间
   * @param {number} startTime - 开始时间
   * @param {number} endTime - 结束时间
   */
  calculateLatency(startTime, endTime = Date.now()) {
    this.latency = endTime - startTime
  }

  /**
   * 设置错误信息
   * @param {Error|string} error - 错误信息
   */
  setError(error) {
    this.success = false
    if (error instanceof Error) {
      this.error = {
        message: error.message,
        name: error.name,
        stack: error.stack
      }
    } else {
      this.error = { message: String(error) }
    }
  }

  /**
   * 设置成功结果
   * @param {Object} options - 成功选项
   */
  setSuccess(options = {}) {
    this.success = true
    this.error = null
    Object.assign(this, options)
  }

  /**
   * 验证结果数据
   * @returns {boolean} 是否有效
   */
  isValid() {
    return typeof this.success === 'boolean' &&
           typeof this.method === 'string' &&
           ['navigator', 'fetch', 'ping'].includes(this.method) &&
           (this.latency === null || typeof this.latency === 'number') &&
           typeof this.retryCount === 'number'
  }

  /**
   * 转换为JSON对象
   * @returns {Object} JSON表示
   */
  toJSON() {
    return {
      isOnline: this.isOnline,
      success: this.success,
      latency: this.latency,
      timestamp: this.timestamp,
      url: this.url,
      status: this.status,
      error: this.error,
      timeout: this.timeout,
      retryCount: this.retryCount,
      method: this.method
    }
  }

  /**
   * 从JSON对象创建实例
   * @param {Object} json - JSON对象
   * @returns {NetworkCheckResult} NetworkCheckResult实例
   */
  static fromJSON(json) {
    return new NetworkCheckResult(json)
  }
}

// =========================
// PWA事件类型
// =========================

/**
 * PWA事件类型定义
 * 定义PWA应用中的各种事件类型
 */
export class PWAEventType {
  // 安装相关事件
  static INSTALL_PROMPT = 'beforeinstallprompt'
  static APP_INSTALLED = 'appinstalled'
  static INSTALL_PROMPT_AVAILABLE = 'install-prompt-available'
  static INSTALL_PROMPT_DISMISSED = 'install-prompt-dismissed'
  static INSTALL_ACCEPTED = 'install-accepted'
  static INSTALL_CANCELLED = 'install-cancelled'
  
  // Service Worker相关事件
  static SW_REGISTERED = 'sw-registered'
  static SW_UPDATE_AVAILABLE = 'sw-update-available'
  static SW_UPDATED = 'sw-updated'
  static SW_UPDATE_APPLIED = 'sw-update-applied'
  static SW_WAITING = 'sw-waiting'
  static SW_ACTIVATED = 'sw-activated'
  static SW_ERROR = 'sw-error'
  
  // 网络相关事件
  static NETWORK_ONLINE = 'network-online'
  static NETWORK_OFFLINE = 'network-offline'
  static NETWORK_CHANGED = 'network-changed'
  static NETWORK_STATUS_CHANGE = 'network-status-change'
  
  // 缓存相关事件
  static CACHE_UPDATED = 'cache-updated'
  static CACHE_CLEARED = 'cache-cleared'
  static CACHE_ERROR = 'cache-error'
  static CACHE_UPDATE = 'cache-update'
  
  // 通知相关事件
  static NOTIFICATION_PERMISSION_GRANTED = 'notification-permission-granted'
  static NOTIFICATION_PERMISSION_DENIED = 'notification-permission-denied'
  static NOTIFICATION_CLICKED = 'notification-clicked'
  static NOTIFICATION_PERMISSION = 'notification-permission'
  static PUSH_MESSAGE = 'push-message'

  /**
   * 验证事件类型
   * @param {string} eventType - 事件类型
   * @returns {boolean} 是否为有效的事件类型
   */
  static isValid(eventType) {
    return Object.values(PWAEventType).includes(eventType)
  }

  /**
   * 获取所有事件类型
   * @returns {Array<string>} 所有事件类型
   */
  static getAll() {
    return Object.values(PWAEventType).filter(value => typeof value === 'string')
  }

  /**
   * 获取事件类别
   * @param {string} eventType - 事件类型
   * @returns {string} 事件类别
   */
  static getCategory(eventType) {
    if (eventType.startsWith('install-') || eventType === 'beforeinstallprompt' || eventType === 'appinstalled') return 'install'
    if (eventType.startsWith('sw-')) return 'service-worker'
    if (eventType.startsWith('network-')) return 'network'
    if (eventType.startsWith('cache-')) return 'cache'
    if (eventType.startsWith('notification-')) return 'notification'
    return 'unknown'
  }
}

/**
 * PWA错误信息
 * 统一的错误信息管理
 */
export class PWAError {
  constructor(options = {}) {
    this.type = options.type ?? 'unknown'
    this.code = options.code ?? 'UNKNOWN_ERROR'
    this.message = options.message ?? ''
    this.details = options.details ?? null
    this.timestamp = options.timestamp ?? new Date()
    this.severity = options.severity ?? 'error'
    this.context = options.context ?? {}
    this.stack = options.stack ?? ''
    this.userAgent = options.userAgent ?? navigator.userAgent
    this.source = options.source ?? 'pwa'
  }

  /**
   * 从Error对象创建PWAError
   * @param {Error} error - 原始错误对象
   * @param {Object} context - 错误上下文
   * @returns {PWAError} PWAError实例
   */
  static fromError(error, context = {}) {
    return new PWAError({
      code: error.name || 'UNKNOWN_ERROR',
      message: error.message,
      stack: error.stack,
      context,
      details: {
        fileName: error.fileName,
        lineNumber: error.lineNumber,
        columnNumber: error.columnNumber
      }
    })
  }

  /**
   * 从异常创建PWAError
   * @param {Error} exception - 异常对象
   * @param {string} type - 错误类型
   * @param {string} severity - 严重程度
   * @returns {PWAError} PWAError实例
   */
  static fromException(exception, type, severity = 'error') {
    return new PWAError({
      type,
      code: exception.name || 'EXCEPTION',
      message: exception.message,
      stack: exception.stack,
      severity,
      details: {
        fileName: exception.fileName,
        lineNumber: exception.lineNumber,
        columnNumber: exception.columnNumber
      }
    })
  }

  /**
   * 创建不同严重级别的错误
   */
  static createInfo(message, details = null) {
    return new PWAError({
      code: 'INFO',
      message,
      details,
      severity: 'info'
    })
  }

  static createWarning(message, details = null) {
    return new PWAError({
      code: 'WARNING',
      message,
      details,
      severity: 'warning'
    })
  }

  static createError(message, details = null) {
    return new PWAError({
      code: 'ERROR',
      message,
      details,
      severity: 'error'
    })
  }

  static createCritical(message, details = null) {
    return new PWAError({
      code: 'CRITICAL',
      message,
      details,
      severity: 'critical'
    })
  }

  /**
   * 验证错误对象
   * @returns {boolean} 是否有效
   */
  isValid() {
    return typeof this.type === 'string' &&
           typeof this.message === 'string' &&
           ['info', 'warning', 'error', 'critical'].includes(this.severity)
  }

  /**
   * 获取错误的严重级别数值
   * @returns {number} 严重级别数值
   */
  getSeverityLevel() {
    const levels = {
      'info': 1,
      'warning': 2,
      'error': 3,
      'critical': 4
    }
    return levels[this.severity] || 3
  }

  /**
   * 转换为JSON对象
   * @returns {Object} JSON表示
   */
  toJSON() {
    return {
      type: this.type,
      code: this.code,
      message: this.message,
      details: this.details,
      timestamp: this.timestamp,
      severity: this.severity,
      context: this.context,
      stack: this.stack,
      userAgent: this.userAgent,
      source: this.source
    }
  }

  /**
   * 从JSON对象创建实例
   * @param {Object} json - JSON对象
   * @returns {PWAError} PWAError实例
   */
  static fromJSON(json) {
    return new PWAError(json)
  }

  /**
   * 转换为字符串
   * @returns {string} 错误描述
   */
  toString() {
    return `[${this.severity.toUpperCase()}] ${this.code}: ${this.message}`
  }
}

// =========================
// 缓存统计类型
// =========================

/**
 * 缓存统计数据结构
 * 记录缓存的使用统计信息
 * 
 * @typedef {Object} CacheStats
 * @property {number} totalSize - 总缓存大小(字节)
 * @property {number} totalEntries - 总缓存条目数
 * @property {number} hitRate - 缓存命中率(百分比)
 * @property {number} missRate - 缓存未命中率(百分比)
 * @property {Object} cachesByName - 按名称分组的缓存统计
 * @property {string} lastUpdate - 最后更新时间
 */
export const CacheStatsDefault = {
  totalSize: 0,
  totalEntries: 0,
  hitRate: 0,
  missRate: 0,
  cachesByName: {},
  lastUpdate: ''
}

// =========================
// 消息通信类型
// =========================

/**
 * Service Worker消息类型
 * 定义与Service Worker通信的消息类型
 */
export const SWMessageTypes = {
  // 缓存操作
  CACHE_UPDATE: 'cache-update',
  CACHE_CLEAR: 'cache-clear',
  CACHE_STATS: 'cache-stats',
  
  // 网络检测
  NETWORK_CHECK: 'network-check',
  
  // 配置更新
  CONFIG_UPDATE: 'config-update',
  
  // 状态查询
  STATUS_QUERY: 'status-query',
  
  // 错误报告
  ERROR_REPORT: 'error-report'
}

/**
 * Service Worker消息数据结构
 * 定义与Service Worker通信的标准消息格式
 * 
 * @typedef {Object} SWMessage
 * @property {string} type - 消息类型
 * @property {any} payload - 消息负载
 * @property {string} id - 消息ID
 * @property {string} timestamp - 消息时间戳
 * @property {boolean} expectReply - 是否期望回复
 */
export const createSWMessage = (type, payload = null, expectReply = false) => ({
  type,
  payload,
  id: `msg_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
  timestamp: new Date().toISOString(),
  expectReply
})

// =========================
// 工具函数
// =========================

/**
 * 验证PWA状态数据格式
 * 检查PWA状态数据是否符合预期格式
 * 
 * @param {any} data - 待验证的数据
 * @returns {boolean} 验证结果
 */
export const validatePWAState = (data) => {
  // TODO: 实现PWA状态数据验证逻辑
  return false
}

/**
 * 合并PWA配置
 * 将用户配置与默认配置合并
 * 
 * @param {Object} userConfig - 用户配置
 * @param {Object} defaultConfig - 默认配置
 * @returns {Object} 合并后的配置
 */
export const mergePWAConfig = (userConfig, defaultConfig = PWAConfigDefault) => {
  // TODO: 实现配置合并逻辑
  return {}
}

/**
 * 格式化缓存大小
 * 将字节数格式化为可读的大小字符串
 * 
 * @param {number} bytes - 字节数
 * @returns {string} 格式化后的大小字符串
 */
export const formatCacheSize = (bytes) => {
  // TODO: 实现缓存大小格式化逻辑
  return ''
}

/**
 * 计算网络质量评分
 * 根据延迟和可达性计算网络质量评分
 * 
 * @param {number} latency - 网络延迟(毫秒)
 * @param {boolean} isReachable - 是否可达
 * @returns {number} 质量评分(0-100)
 */
export const calculateNetworkQuality = (latency, isReachable) => {
  // TODO: 实现网络质量评分计算逻辑
  return 0
}

/**
 * PWA应用状态管理
 * 管理PWA的安装状态、更新状态等核心状态信息
 */
export class PWAState {
  constructor(options = {}) {
    this.isOnline = options.isOnline ?? true
    this.isInstallable = options.isInstallable ?? false
    this.isInstalled = options.isInstalled ?? false
    this.notificationsEnabled = options.notificationsEnabled ?? false
    this.promptEvent = options.promptEvent ?? null
    this.installPromptShown = options.installPromptShown ?? false
    this.lastUpdateCheck = options.lastUpdateCheck ?? new Date()
    this.networkStatus = options.networkStatus ?? 'online'
    this.cacheVersion = options.cacheVersion ?? 'v1.0.0'
    this.installPromptDismissed = options.installPromptDismissed ?? false
    this.updateAvailable = options.updateAvailable ?? false
    this.lastInstallPrompt = options.lastInstallPrompt ?? null
    this.installDate = options.installDate ?? null
    this.version = options.version ?? '1.0.0'
  }

  /**
   * 更新状态
   * @param {Object} updates - 要更新的状态
   */
  update(updates) {
    Object.assign(this, updates)
  }

  /**
   * 重置为默认状态
   */
  reset() {
    this.isOnline = true
    this.isInstallable = false
    this.isInstalled = false
    this.notificationsEnabled = false
    this.promptEvent = null
    this.installPromptShown = false
    this.lastUpdateCheck = new Date()
    this.networkStatus = 'online'
    this.cacheVersion = 'v1.0.0'
    this.installPromptDismissed = false
    this.updateAvailable = false
    this.lastInstallPrompt = null
    this.installDate = null
  }

  /**
   * 验证状态数据完整性
   * @returns {boolean} 是否有效
   */
  isValid() {
    return typeof this.isOnline === 'boolean' &&
           typeof this.isInstallable === 'boolean' &&
           typeof this.isInstalled === 'boolean' &&
           typeof this.notificationsEnabled === 'boolean' &&
           typeof this.installPromptShown === 'boolean' &&
           ['online', 'offline', 'slow'].includes(this.networkStatus) &&
           typeof this.cacheVersion === 'string'
  }

  /**
   * 转换为JSON对象
   * @returns {Object} JSON表示
   */
  toJSON() {
    return {
      isOnline: this.isOnline,
      isInstallable: this.isInstallable,
      isInstalled: this.isInstalled,
      notificationsEnabled: this.notificationsEnabled,
      promptEvent: this.promptEvent,
      installPromptShown: this.installPromptShown,
      lastUpdateCheck: this.lastUpdateCheck,
      networkStatus: this.networkStatus,
      cacheVersion: this.cacheVersion,
      installPromptDismissed: this.installPromptDismissed,
      updateAvailable: this.updateAvailable,
      lastInstallPrompt: this.lastInstallPrompt,
      installDate: this.installDate,
      version: this.version
    }
  }

  /**
   * 从JSON对象创建实例
   * @param {Object} json - JSON对象
   * @returns {PWAState} PWAState实例
   */
  static fromJSON(json) {
    return new PWAState(json)
  }
}

/**
 * PWA配置管理
 * 管理PWA的配置参数、主题设置等
 */
export class PWAConfig {
  constructor(options = {}) {
    this.name = options.name ?? 'OneBoard PWA'
    this.shortName = options.shortName ?? 'OneBoard'
    this.description = options.description ?? 'A powerful task management PWA'
    this.startUrl = options.startUrl ?? '/'
    this.display = options.display ?? 'standalone'
    this.orientation = options.orientation ?? 'portrait'
    this.themeColor = options.themeColor ?? '#1976D2'
    this.backgroundColor = options.backgroundColor ?? '#ffffff'
    this.lang = options.lang ?? 'zh-CN'
    this.scope = options.scope ?? '/'
    this.dir = options.dir ?? 'ltr'
    this.icons = options.icons ?? []
    this.categories = options.categories ?? ['productivity', 'utilities']
    this.shortcuts = options.shortcuts ?? []
    this.screenshots = options.screenshots ?? []
    this.relatedApplications = options.relatedApplications ?? []
    this.preferRelatedApplications = options.preferRelatedApplications ?? false
  }

  /**
   * 获取默认图标配置
   * @returns {Array} 图标配置数组
   */
  getDefaultIcons() {
    return [
      {
        src: '/icons/icon-72x72.png',
        sizes: '72x72',
        type: 'image/png',
        purpose: 'maskable any'
      },
      {
        src: '/icons/icon-96x96.png',
        sizes: '96x96',
        type: 'image/png',
        purpose: 'maskable any'
      },
      {
        src: '/icons/icon-128x128.png',
        sizes: '128x128',
        type: 'image/png',
        purpose: 'maskable any'
      },
      {
        src: '/icons/icon-144x144.png',
        sizes: '144x144',
        type: 'image/png',
        purpose: 'maskable any'
      },
      {
        src: '/icons/icon-152x152.png',
        sizes: '152x152',
        type: 'image/png',
        purpose: 'maskable any'
      },
      {
        src: '/icons/icon-192x192.png',
        sizes: '192x192',
        type: 'image/png',
        purpose: 'maskable any'
      },
      {
        src: '/icons/icon-384x384.png',
        sizes: '384x384',
        type: 'image/png',
        purpose: 'maskable any'
      },
      {
        src: '/icons/icon-512x512.png',
        sizes: '512x512',
        type: 'image/png',
        purpose: 'maskable any'
      }
    ]
  }

  /**
   * 合并配置选项
   * @param {Object} updates - 要合并的配置
   * @returns {PWAConfig} 新的配置实例
   */
  merge(updates) {
    const mergedData = { ...this.toJSON(), ...updates }
    const newConfig = new PWAConfig(mergedData)
    // 确保新属性也被添加到实例中
    Object.keys(updates).forEach(key => {
      if (!(key in newConfig)) {
        newConfig[key] = updates[key]
      }
    })
    return newConfig
  }

  /**
   * 验证配置有效性
   * @returns {boolean} 配置是否有效
   */
  isValid() {
    const validDisplayModes = ['fullscreen', 'standalone', 'minimal-ui', 'browser']
    const validOrientations = ['portrait', 'landscape', 'any']
    
    return typeof this.name === 'string' && this.name.length > 0 &&
           typeof this.shortName === 'string' && this.shortName.length > 0 &&
           typeof this.startUrl === 'string' && this.startUrl.length > 0 &&
           validDisplayModes.includes(this.display) &&
           validOrientations.includes(this.orientation)
  }

  /**
   * 验证图标配置
   * @param {Object} icon - 图标对象
   * @returns {boolean} 图标配置是否有效
   */
  validateIcon(icon) {
    return icon && 
           typeof icon.src === 'string' && icon.src.length > 0 &&
           typeof icon.sizes === 'string' && icon.sizes.length > 0 &&
           typeof icon.type === 'string' && icon.type.length > 0
  }

  /**
   * 转换为JSON对象
   * @returns {Object} JSON表示
   */
  toJSON() {
    return {
      name: this.name,
      shortName: this.shortName,
      description: this.description,
      startUrl: this.startUrl,
      display: this.display,
      orientation: this.orientation,
      themeColor: this.themeColor,
      backgroundColor: this.backgroundColor,
      lang: this.lang,
      scope: this.scope,
      dir: this.dir,
      icons: this.icons,
      categories: this.categories,
      shortcuts: this.shortcuts,
      screenshots: this.screenshots,
      relatedApplications: this.relatedApplications,
      preferRelatedApplications: this.preferRelatedApplications
    }
  }

  /**
   * 从JSON对象创建实例
   * @param {Object} json - JSON对象
   * @returns {PWAConfig} PWAConfig实例
   */
  static fromJSON(json) {
    return new PWAConfig(json)
  }
}

/**
 * Service Worker状态管理
 * 管理Service Worker的注册、更新等状态
 */
export class ServiceWorkerState {
  constructor(options = {}) {
    this.isRegistered = options.isRegistered ?? false
    this.isActive = options.isActive ?? false
    this.isWaiting = options.isWaiting ?? false
    this.isInstalling = options.isInstalling ?? false
    this.updateAvailable = options.updateAvailable ?? false
    this.registration = options.registration ?? null
    this.controller = options.controller ?? null
    this.version = options.version ?? '1.0.0'
    this.scope = options.scope ?? '/'
    this.state = options.state ?? 'inactive'
    this.lastUpdate = options.lastUpdate ?? new Date()
    this.error = options.error ?? null
  }

  /**
   * 更新状态
   * @param {Object} updates - 要更新的状态
   */
  update(updates) {
    Object.assign(this, updates)
  }

  /**
   * 重置状态
   */
  reset() {
    this.isRegistered = false
    this.isActive = false
    this.isWaiting = false
    this.isInstalling = false
    this.updateAvailable = false
    this.registration = null
    this.controller = null
    this.version = '1.0.0'
    this.scope = '/'
    this.state = 'inactive'
    this.lastUpdate = new Date()
    this.error = null
  }

  /**
   * 检查是否有可用更新
   * @returns {boolean} 是否有更新
   */
  hasUpdate() {
    return this.updateAvailable || this.isWaiting
  }

  /**
   * 获取状态描述
   * @returns {string} 状态描述
   */
  getStateDescription() {
    if (this.error) {
      return 'Error'
    }
    if (this.isInstalling) {
      return 'Installing'
    }
    if (this.isWaiting) {
      return 'Waiting'
    }
    if (this.isActive) {
      return 'Active'
    }
    if (this.isRegistered) {
      return 'Registered'
    }
    return 'Not Registered'
  }

  /**
   * 转换为JSON对象
   * @returns {Object} JSON表示
   */
  toJSON() {
    return {
      isRegistered: this.isRegistered,
      isActive: this.isActive,
      isWaiting: this.isWaiting,
      isInstalling: this.isInstalling,
      updateAvailable: this.updateAvailable,
      version: this.version,
      scope: this.scope,
      state: this.state,
      lastUpdate: this.lastUpdate,
      error: this.error
    }
  }

  /**
   * 从JSON对象创建实例
   * @param {Object} json - JSON对象
   * @returns {ServiceWorkerState} ServiceWorkerState实例
   */
  static fromJSON(json) {
    return new ServiceWorkerState(json)
  }
}

/**
 * 缓存策略配置
 * 定义不同资源的缓存策略
 */
export class CacheStrategy {
  constructor(options = {}) {
    this.name = options.name ?? 'default'
    this.pattern = options.pattern ?? /.*/
    this.handler = options.handler ?? 'NetworkFirst'
    this.options = options.options ?? { 
      cacheName: 'default-cache',
      networkTimeoutSeconds: 3
    }
    this.cacheName = options.cacheName ?? null
    this.expiration = options.expiration ?? null
    this.networkTimeout = options.networkTimeout ?? 3000
    this.cacheableResponse = options.cacheableResponse ?? { statuses: [0, 200] }
    this.backgroundSync = options.backgroundSync ?? null
    this.broadcastUpdate = options.broadcastUpdate ?? false
  }

  /**
   * 验证策略配置
   * @returns {boolean} 策略配置是否有效
   */
  isValid() {
    const validHandlers = [
      'CacheFirst', 'CacheOnly', 'NetworkFirst', 
      'NetworkOnly', 'StaleWhileRevalidate'
    ]
    
    return typeof this.name === 'string' && this.name.length > 0 &&
           this.pattern &&
           validHandlers.includes(this.handler)
  }

  /**
   * 检查URL是否匹配此策略
   * @param {string} url - 要检查的URL
   * @returns {boolean} 是否匹配
   */
  matches(url) {
    if (this.pattern instanceof RegExp) {
      return this.pattern.test(url)
    }
    if (typeof this.pattern === 'string') {
      return url.includes(this.pattern)
    }
    if (typeof this.pattern === 'function') {
      return this.pattern(url)
    }
    return false
  }

  /**
   * 合并策略选项
   * @param {Object} newOptions - 新的选项
   */
  mergeOptions(newOptions) {
    Object.assign(this.options, newOptions)
  }

  /**
   * 转换为JSON对象
   * @returns {Object} JSON表示
   */
  toJSON() {
    return {
      name: this.name,
      pattern: this.pattern.toString(),
      handler: this.handler,
      options: this.options,
      cacheName: this.cacheName,
      expiration: this.expiration,
      networkTimeout: this.networkTimeout,
      cacheableResponse: this.cacheableResponse,
      backgroundSync: this.backgroundSync,
      broadcastUpdate: this.broadcastUpdate
    }
  }

  /**
   * 从JSON对象创建实例
   * @param {Object} json - JSON对象
   * @returns {CacheStrategy} CacheStrategy实例
   */
  static fromJSON(json) {
    // 如果pattern是字符串，尝试转换为RegExp
    if (typeof json.pattern === 'string' && json.pattern.startsWith('/') && json.pattern.endsWith('/')) {
      json.pattern = new RegExp(json.pattern.slice(1, -1))
    }
    return new CacheStrategy(json)
  }
}

/**
 * 缓存统计信息
 * 管理缓存相关的统计数据
 */
export class CacheStatistics {
  constructor(options = {}) {
    this.totalSize = options.totalSize ?? 0
    this.totalEntries = options.totalEntries ?? 0
    this.hitCount = options.hitCount ?? 0
    this.missCount = options.missCount ?? 0
    this.lastUpdate = options.lastUpdate ?? new Date()
    this.cacheNames = options.cacheNames ?? []
    this.sizeLimitMB = options.sizeLimitMB ?? 50
    this.cleanupThreshold = options.cleanupThreshold ?? 0.8
    this.avgResponseTime = options.avgResponseTime ?? 0
    this.oldestEntry = options.oldestEntry ?? null
    this.newestEntry = options.newestEntry ?? null
    this.history = options.history ?? []
    
    // 添加测试期望的属性
    this.hitRate = options.hitRate ?? 0
    this.missRate = options.missRate ?? 0
    this.cachesByName = options.cachesByName ?? {}
  }

  /**
   * 计算缓存命中率
   * @returns {number} 命中率百分比
   */
  getHitRate() {
    const total = this.hitCount + this.missCount
    return total > 0 ? (this.hitCount / total) * 100 : 0
  }

  /**
   * 计算缓存未命中率
   * @returns {number} 未命中率百分比
   */
  getMissRate() {
    const total = this.hitCount + this.missCount
    return total > 0 ? (this.missCount / total) * 100 : 0
  }

  /**
   * 获取缓存大小（以MB为单位）
   * @returns {number} 缓存大小MB
   */
  getSizeMB() {
    return this.totalSize / (1024 * 1024)
  }

  /**
   * 检查是否需要清理
   * @returns {boolean} 是否需要清理
   */
  needsCleanup() {
    return this.getSizeMB() >= this.sizeLimitMB * this.cleanupThreshold
  }

  /**
   * 更新统计数据
   * @param {Object} updates - 更新数据
   */
  update(updates) {
    Object.assign(this, updates)
    this.lastUpdate = new Date()
    
    // 保存历史记录（最多100条）
    this.addToHistory()
  }

  /**
   * 添加到历史记录
   */
  addToHistory() {
    const snapshot = {
      timestamp: this.lastUpdate,
      totalSize: this.totalSize,
      totalEntries: this.totalEntries,
      hitCount: this.hitCount,
      missCount: this.missCount,
      hitRate: this.getHitRate()
    }
    
    this.history.push(snapshot)
    
    // 保持历史记录不超过100条
    if (this.history.length > 100) {
      this.history.shift()
    }
  }

  /**
   * 记录命中
   */
  recordHit() {
    this.hitCount++
    this.lastUpdate = new Date()
  }

  /**
   * 记录未命中
   */
  recordMiss() {
    this.missCount++
    this.lastUpdate = new Date()
  }

  /**
   * 重置统计数据
   */
  reset() {
    this.totalSize = 0
    this.totalEntries = 0
    this.hitCount = 0
    this.missCount = 0
    this.lastUpdate = new Date()
    this.cacheNames = []
    this.avgResponseTime = 0
    this.oldestEntry = null
    this.newestEntry = null
    this.history = []
  }

  /**
   * 计算命中率和失误率
   * @param {number} hits - 命中次数
   * @param {number} misses - 失误次数
   */
  calculateRates(hits, misses) {
    const total = hits + misses
    if (total > 0) {
      this.hitRate = Math.round((hits / total) * 100)
      this.missRate = Math.round((misses / total) * 100)
    } else {
      this.hitRate = 0
      this.missRate = 0
    }
  }

  /**
   * 添加缓存信息
   * @param {string} cacheName - 缓存名称
   * @param {number} size - 缓存大小
   * @param {number} entries - 条目数量
   */
  addCacheInfo(cacheName, size, entries) {
    this.cachesByName[cacheName] = {
      size: size || 0,
      entries: entries || 0,
      lastAccess: new Date(),
      createdAt: new Date()
    }
    this.recalculateTotals()
  }

  /**
   * 重新计算总数
   */
  recalculateTotals() {
    this.totalSize = Object.values(this.cachesByName).reduce((sum, cache) => sum + (cache.size || 0), 0)
    this.totalEntries = Object.values(this.cachesByName).reduce((sum, cache) => sum + (cache.entries || 0), 0)
  }

  /**
   * 获取缓存名称列表
   * @returns {Array<string>} 缓存名称数组
   */
  getCacheNames() {
    return Object.keys(this.cachesByName)
  }

  /**
   * 转换为JSON对象
   * @returns {Object} JSON表示
   */
  toJSON() {
    return {
      totalSize: this.totalSize,
      totalEntries: this.totalEntries,
      hitCount: this.hitCount,
      missCount: this.missCount,
      lastUpdated: this.lastUpdate,
      cacheNames: this.cacheNames,
      sizeLimitMB: this.sizeLimitMB,
      cleanupThreshold: this.cleanupThreshold,
      avgResponseTime: this.avgResponseTime,
      oldestEntry: this.oldestEntry,
      newestEntry: this.newestEntry,
      history: this.history,
      hitRate: this.getHitRate(),
      missRate: this.getMissRate(),
      sizeMB: this.getSizeMB()
    }
  }

  /**
   * 从JSON对象创建实例
   * @param {Object} json - JSON对象
   * @returns {CacheStatistics} CacheStatistics实例
   */
  static fromJSON(json) {
    return new CacheStatistics(json)
  }
}

/**
 * Service Worker 消息
 * 处理与Service Worker的通信消息
 */
export class ServiceWorkerMessage {
  constructor(options = {}) {
    this.type = options.type ?? 'unknown'
    this.payload = options.payload ?? {}
    this.timestamp = options.timestamp ?? new Date()
    this.source = options.source ?? 'sw'
    this.id = options.id ?? ''
    this.requiresResponse = options.requiresResponse ?? false
  }

  /**
   * 验证消息数据
   * @returns {boolean} 是否有效
   */
  isValid() {
    return !!(this.type && this.type.length > 0 && 
              ['sw', 'main-thread'].includes(this.source))
  }

  /**
   * 创建响应消息
   * @param {Object} responseData - 响应数据
   * @returns {ServiceWorkerMessage} 响应消息
   */
  createResponse(responseData) {
    return new ServiceWorkerMessage({
      id: this.id,
      type: 'response',
      payload: responseData,
      source: this.target,
      target: this.source,
      timestamp: new Date()
    })
  }

  /**
   * 检查是否为响应消息
   * @returns {boolean} 是否为响应
   */
  isResponse() {
    return this.type === 'response'
  }

  /**
   * 转换为JSON
   * @returns {Object} JSON对象
   */
  toJSON() {
    return {
      id: this.id,
      type: this.type,
      payload: this.payload,
      timestamp: this.timestamp,
      source: this.source,
      requiresResponse: this.requiresResponse
    }
  }
} 