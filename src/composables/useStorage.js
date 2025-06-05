import { ref, watch } from 'vue'

/**
 * 存储类型枚举
 */
export const StorageType = {
  LOCAL: 'localStorage',
  SESSION: 'sessionStorage'
}

/**
 * 本地存储管理组件
 * 
 * 功能特性：
 * - localStorage/sessionStorage 操作封装
 * - 自动 JSON 序列化/反序列化
 * - 响应式数据绑定
 * - 错误处理和数据验证
 * - 存储配额管理
 * - 数据变更监听
 * 
 * @param {string} key - 存储键名
 * @param {any} defaultValue - 默认值
 * @param {Object} options - 配置选项
 * @returns {Object} 存储操作对象
 */
export function useStorage(key, defaultValue = null, options = {}) {
  // ==================== 配置选项 ====================
  
  const {
    /** 存储类型：localStorage | sessionStorage */
    storageType = StorageType.LOCAL,
    
    /** 是否启用数据序列化 */
    serializer = true,
    
    /** 数据过期时间（毫秒） */
    expireTime = null,
    
    /** 数据验证函数 */
    validator = null,
    
    /** 是否在页面卸载时同步 */
    syncOnUnload = true,
    
    /** 错误处理函数 */
    errorHandler = null
  } = options

  // ==================== 响应式状态 ====================
  
  /** 存储的数据值 */
  const storedValue = ref(defaultValue)
  
  /** 加载状态 */
  const loading = ref(false)
  
  /** 错误状态 */
  const error = ref(null)
  
  /** 存储可用性状态 */
  const isSupported = ref(true)
  
  /** 存储容量信息 */
  const storageInfo = ref({
    used: 0,
    quota: 0,
    available: 0
  })

  // ==================== 核心方法 ====================
  
  /**
   * 初始化存储
   */
  function init() {
    try {
      // 获取存储对象
      const storage = getStorageObject()
      if (!storage) {
        isSupported.value = false
        handleError('localStorage is not available', new Error(`${storageType} 不受支持`))
        return
      }
      
      // 测试存储可用性
      const testKey = '__storage_test__'
      try {
        storage.setItem(testKey, 'test')
        storage.removeItem(testKey)
        isSupported.value = true
      } catch (e) {
        isSupported.value = false
        handleError('localStorage is not available', e)
        return
      }
      
      // 加载已保存的数据
      load()
      
      // 更新存储信息
      updateStorageInfo()
      
      // 设置数据变更监听
      if (syncOnUnload) {
        listenStorageChanges()
      }
      
    } catch (err) {
      isSupported.value = false
      handleError('初始化存储失败', err)
    }
  }

  /**
   * 从存储中读取数据
   * @returns {Promise<any>} 读取的数据
   */
  async function load() {
    try {
      loading.value = true
      error.value = null
      
      // 获取存储对象
      const storage = getStorageObject()
      if (!storage) {
        isSupported.value = false
        return defaultValue
      }
      
      // 读取原始数据
      const rawValue = storage.getItem(key)
      if (rawValue === null) {
        storedValue.value = defaultValue
        return defaultValue
      }
      
      // 解析数据
      let parsedValue
      if (serializer) {
        try {
          const parsed = JSON.parse(rawValue)
          
          // 检查数据结构（带过期时间的数据）
          if (parsed && typeof parsed === 'object' && 'data' in parsed) {
            // 检查数据过期
            if (parsed.expireAt && Date.now() > parsed.expireAt) {
              await remove()
              storedValue.value = defaultValue
              return defaultValue
            }
            parsedValue = parsed.data
          } else {
            parsedValue = parsed
          }
        } catch (e) {
          throw new Error('解析失败: ' + e.message)
        }
      } else {
        parsedValue = rawValue
      }
      
      // 数据验证
      if (validator && !validator(parsedValue)) {
        throw new Error('验证失败')
      }
      
      storedValue.value = parsedValue
      return parsedValue
      
    } catch (err) {
      // 根据错误类型设置不同的错误消息
      let errorMessage = '数据读取失败'
      if (err.message.includes('解析失败')) {
        errorMessage = err.message
      } else if (err.message.includes('验证失败')) {
        errorMessage = err.message
      }
      
      handleError(errorMessage, err)
      storedValue.value = defaultValue
      return defaultValue
    } finally {
      loading.value = false
    }
  }

  /**
   * 保存数据到存储
   * @param {any} value - 要保存的数据
   * @returns {Promise<boolean>} 保存是否成功
   */
  async function save(value) {
    try {
      loading.value = true
      error.value = null
      
      const storage = getStorageObject()
      if (!storage) {
        isSupported.value = false
        return false
      }
      
      // 数据验证
      if (validator && !validator(value)) {
        throw new Error('验证失败')
      }
      
      // 序列化数据
      let serializedValue
      if (serializer) {
        const dataToStore = {
          data: value,
          timestamp: Date.now()
        }
        
        // 添加过期时间
        if (expireTime) {
          dataToStore.expireAt = Date.now() + expireTime
        }
        
        serializedValue = JSON.stringify(dataToStore)
      } else {
        serializedValue = value
      }
      
      // 保存到存储
      storage.setItem(key, serializedValue)
      
      // 更新响应式值
      storedValue.value = value
      
      // 更新存储容量信息
      updateStorageInfo()
      
      return true
      
    } catch (err) {
      // 根据错误类型设置不同的错误消息
      let errorMessage = '数据保存失败'
      if (err.name === 'QuotaExceededError') {
        errorMessage = '存储空间不足'
      } else if (err.message.includes('验证失败')) {
        errorMessage = err.message
      }
      
      handleError(errorMessage, err)
      return false
    } finally {
      loading.value = false
    }
  }

  /**
   * 删除存储的数据
   * @returns {Promise<boolean>} 删除是否成功
   */
  async function remove() {
    try {
      const storage = getStorageObject()
      if (!storage) return false
      
      storage.removeItem(key)
      storedValue.value = defaultValue
      updateStorageInfo()
      
      return true
    } catch (err) {
      handleError('数据删除失败', err)
      return false
    }
  }

  /**
   * 清空所有存储数据
   * @returns {Promise<boolean>} 清空是否成功
   */
  async function clear() {
    try {
      const storage = getStorageObject()
      if (!storage) return false
      
      storage.clear()
      storedValue.value = defaultValue
      updateStorageInfo()
      
      return true
    } catch (err) {
      handleError('清空存储失败', err)
      return false
    }
  }

  // ==================== 工具方法 ====================
  
  /**
   * 获取存储对象
   * @returns {Storage|null} 存储对象
   */
  function getStorageObject() {
    try {
      if (typeof window === 'undefined') return null
      
      switch (storageType) {
        case StorageType.LOCAL:
          return window.localStorage
        case StorageType.SESSION:
          return window.sessionStorage
        default:
          return window.localStorage
      }
    } catch (err) {
      return null
    }
  }
  
  /**
   * 检查数据是否过期
   * @param {any} data - 数据对象
   * @returns {boolean} 是否过期
   */
  function isExpired(data) {
    if (!data || typeof data !== 'object') return false
    if (!data.expireAt) return false
    return Date.now() > data.expireAt
  }
  
  /**
   * 更新存储容量信息
   */
  function updateStorageInfo() {
    try {
      const storage = getStorageObject()
      if (!storage) return
      
      // 计算已使用空间
      let used = 0
      for (let i = 0; i < storage.length; i++) {
        const key = storage.key(i)
        if (key) {
          const value = storage.getItem(key)
          if (value) {
            used += key.length + value.length
          }
        }
      }
      
      // 获取存储配额（如果支持）
      let quota = 0
      let available = 0
      
      if ('navigator' in window && 'storage' in navigator && 'estimate' in navigator.storage) {
        navigator.storage.estimate().then(estimate => {
          quota = estimate.quota || 0
          available = (estimate.quota || 0) - (estimate.usage || 0)
          
          storageInfo.value = {
            used: Math.round(used / 1024), // KB
            quota: Math.round(quota / 1024 / 1024), // MB
            available: Math.round(available / 1024 / 1024) // MB
          }
        }).catch(() => {
          // 如果API不支持，使用估算值
          storageInfo.value = {
            used: Math.round(used / 1024),
            quota: 5120, // 估算5MB
            available: 5120 - Math.round(used / 1024)
          }
        })
      } else {
        // 降级处理
        storageInfo.value = {
          used: Math.round(used / 1024),
          quota: 5120, // 估算5MB
          available: 5120 - Math.round(used / 1024)
        }
      }
    } catch (err) {
      console.warn('无法获取存储信息:', err)
    }
  }
  
  /**
   * 错误处理函数
   * @param {string} message - 错误消息
   * @param {Error} err - 错误对象
   */
  function handleError(message, err) {
    console.error(`useStorage: ${message}`, err)
    error.value = message
    
    // 调用自定义错误处理函数
    if (errorHandler) {
      try {
        errorHandler(err)
      } catch (handlerErr) {
        console.error('错误处理函数执行失败:', handlerErr)
      }
    }
  }
  
  /**
   * 监听存储变化
   */
  function listenStorageChanges() {
    if (typeof window === 'undefined') return
    
    // 监听存储事件（跨标签页同步）
    const handleStorageChange = (event) => {
      if (event.key === key && event.newValue !== null) {
        try {
          let newValue = event.newValue
          if (serializer) {
            const parsed = JSON.parse(newValue)
            newValue = parsed.data || parsed
          }
          
          if (validator && !validator(newValue)) {
            return
          }
          
          storedValue.value = newValue
        } catch (err) {
          console.warn('存储同步失败:', err)
        }
      }
    }
    
    window.addEventListener('storage', handleStorageChange)
    
    // 监听页面卸载事件
    const handleBeforeUnload = () => {
      // 确保数据已保存
      if (storedValue.value !== defaultValue) {
        try {
          save(storedValue.value)
        } catch (err) {
          console.warn('页面卸载时保存数据失败:', err)
        }
      }
    }
    
    if (syncOnUnload) {
      window.addEventListener('beforeunload', handleBeforeUnload)
    }
    
    // 返回清理函数
    return () => {
      window.removeEventListener('storage', handleStorageChange)
      if (syncOnUnload) {
        window.removeEventListener('beforeunload', handleBeforeUnload)
      }
    }
  }

  // ==================== 数据监听 ====================
  
  // 监听数据变化，自动保存
  watch(
    storedValue,
    (newValue) => {
      if (newValue !== defaultValue) {
        save(newValue).catch(err => {
          console.warn('自动保存失败:', err)
        })
      }
    },
    { deep: true }
  )

  // ==================== 自动初始化 ====================
  
  // 初始化存储
  init()

  // ==================== 返回API ====================
  
  return {
    // 响应式状态
    storedValue,
    loading,
    error,
    isSupported,
    storageInfo,
    
    // 核心方法
    init,
    load,
    save,
    remove,
    clear
  }
}

// ==================== 类型定义 ====================

/**
 * 存储选项类型
 * @typedef {Object} StorageOptions
 * @property {'localStorage'|'sessionStorage'} storageType - 存储类型
 * @property {boolean} serializer - 是否启用序列化
 * @property {number|null} expireTime - 过期时间（毫秒）
 * @property {Function|null} validator - 数据验证函数
 * @property {boolean} syncOnUnload - 是否在页面卸载时同步
 * @property {Function|null} errorHandler - 错误处理函数
 */

/**
 * 存储信息类型
 * @typedef {Object} StorageInfo
 * @property {number} used - 已使用空间
 * @property {number} quota - 配额空间
 * @property {number} available - 可用空间
 */

/**
 * 错误信息类型
 * @typedef {Object} ErrorInfo
 * @property {string} message - 错误消息
 * @property {Error} originalError - 原始错误对象
 * @property {string} timestamp - 错误时间戳
 * @property {string} storageKey - 存储键名
 */