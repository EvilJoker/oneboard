import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { nextTick } from 'vue'
import { useStorage, StorageType } from '@/composables/useStorage'

// Mock localStorage and sessionStorage
const createMockStorage = () => {
  const storage = {}
  return {
    getItem: vi.fn((key) => storage[key] || null),
    setItem: vi.fn((key, value) => {
      storage[key] = value
    }),
    removeItem: vi.fn((key) => {
      delete storage[key]
    }),
    clear: vi.fn(() => {
      Object.keys(storage).forEach(key => delete storage[key])
    }),
    get length() {
      return Object.keys(storage).length
    },
    key: vi.fn((index) => Object.keys(storage)[index] || null)
  }
}

describe('useStorage Composable', () => {
  let mockLocalStorage, mockSessionStorage

  beforeEach(() => {
    // Setup mock storage
    mockLocalStorage = createMockStorage()
    mockSessionStorage = createMockStorage()

    // Replace global storage objects
    Object.defineProperty(window, 'localStorage', {
      value: mockLocalStorage,
      writable: true
    })
    Object.defineProperty(window, 'sessionStorage', {
      value: mockSessionStorage,
      writable: true
    })

    // Clear all mocks
    vi.clearAllMocks()
  })

  afterEach(() => {
    // Clean up
    vi.restoreAllMocks()
  })

  describe('2.1 存储初始化单元测试', () => {
    it('test_use_storage_initial_state - 验证 useStorage 初始化状态', () => {
      const defaultValue = { test: 'data' }
      const { storedValue, loading, error, isSupported } = useStorage('test-key', defaultValue)

      expect(storedValue.value).toEqual(defaultValue)
      expect(loading.value).toBe(false)
      expect(error.value).toBe(null)
      expect(isSupported.value).toBe(true)
    })

    it('test_init_with_localStorage_available - 验证 localStorage 可用时的初始化', () => {
      const { isSupported, init } = useStorage('test-key', null, {
        storageType: StorageType.LOCAL
      })

      init()

      expect(isSupported.value).toBe(true)
      expect(mockLocalStorage.getItem).toHaveBeenCalledWith('test-key')
    })

    it('test_init_with_localStorage_unavailable - 验证 localStorage 不可用时的降级处理', () => {
      // Mock localStorage to throw error
      mockLocalStorage.setItem.mockImplementation(() => {
        throw new Error('localStorage is not available')
      })

      const { isSupported, error } = useStorage('test-key', null, {
        storageType: 'localStorage'
      })

      expect(isSupported.value).toBe(false)
      expect(error.value).toContain('localStorage is not available')
    })
  })

  describe('2.2 数据读写单元测试', () => {
    it('test_save_simple_data - 验证 save 方法保存简单数据', async () => {
      const testData = { name: 'test', value: 123 }
      const { save, storedValue } = useStorage('test-key', null, {
        serializer: true
      })

      const result = await save(testData)

      expect(result).toBe(true)
      expect(storedValue.value).toEqual(testData)
      
      // 验证最后一次调用的参数
      const lastCall = mockLocalStorage.setItem.mock.calls[mockLocalStorage.setItem.mock.calls.length - 1]
      expect(lastCall[0]).toBe('test-key')
      
      const savedData = JSON.parse(lastCall[1])
      expect(savedData.data).toEqual(testData)
      expect(savedData.timestamp).toBeTypeOf('number')
    })

    it('test_save_with_serialization - 验证数据序列化功能', async () => {
      const complexObject = {
        users: [{ id: 1, name: 'User1' }],
        settings: { theme: 'dark', locale: 'zh-CN' },
        metadata: { version: '1.0', lastUpdated: new Date().toISOString() }
      }

      const { save, storedValue } = useStorage('complex-data', null, {
        serializer: true
      })

      const result = await save(complexObject)

      expect(result).toBe(true)
      expect(storedValue.value).toEqual(complexObject)
      
      // 验证序列化存储
      const lastCall = mockLocalStorage.setItem.mock.calls[mockLocalStorage.setItem.mock.calls.length - 1]
      const savedData = JSON.parse(lastCall[1])
      expect(savedData.data).toEqual(complexObject)
    })

    it('test_load_existing_data - 验证 load 方法读取已存在的数据', async () => {
      const existingData = { id: 1, name: 'existing' }
      const storageValue = JSON.stringify({
        data: existingData,
        timestamp: Date.now()
      })

      mockLocalStorage.getItem.mockReturnValue(storageValue)

      const { load, storedValue } = useStorage('existing-key', null)
      const result = await load()

      expect(result).toEqual(existingData)
      expect(storedValue.value).toEqual(existingData)
      expect(mockLocalStorage.getItem).toHaveBeenCalledWith('existing-key')
    })

    it('test_load_nonexistent_data - 验证读取不存在数据时的处理', async () => {
      const defaultValue = { default: 'value' }
      mockLocalStorage.getItem.mockReturnValue(null)

      const { load, storedValue } = useStorage('nonexistent-key', defaultValue)
      const result = await load()

      expect(result).toEqual(defaultValue)
      expect(storedValue.value).toEqual(defaultValue)
    })

    it('test_remove_data - 验证 remove 方法删除数据', async () => {
      const { remove, storedValue } = useStorage('remove-key', { initial: 'data' })

      const result = await remove()

      expect(result).toBe(true)
      expect(storedValue.value).toEqual({ initial: 'data' }) // Reset to default
      expect(mockLocalStorage.removeItem).toHaveBeenCalledWith('remove-key')
    })
  })

  describe('2.3 数据验证单元测试', () => {
    it('test_save_with_valid_data - 验证自定义验证器对有效数据的处理', async () => {
      const validator = vi.fn((data) => data.id > 0)
      const validData = { id: 1, name: 'test' }

      const { save } = useStorage('validated-key', null, { validator })
      const result = await save(validData)

      expect(result).toBe(true)
      expect(validator).toHaveBeenCalledWith(validData)
      expect(mockLocalStorage.setItem).toHaveBeenCalled()
    })

    it('test_save_with_invalid_data - 验证自定义验证器对无效数据的处理', async () => {
      const validator = vi.fn((data) => data.id > 0)
      const invalidData = { id: 0, name: 'test' }

      const { save, error } = useStorage('validated-key', null, { validator })
      
      // 清除初始化时的 mock 调用历史
      mockLocalStorage.setItem.mockClear()
      
      const result = await save(invalidData)

      expect(result).toBe(false)
      expect(validator).toHaveBeenCalledWith(invalidData)
      expect(error.value).toContain('验证失败')
      expect(mockLocalStorage.setItem).not.toHaveBeenCalled()
    })
  })

  describe('2.4 过期机制单元测试', () => {
    it('test_save_with_expire_time - 验证带过期时间的数据保存', async () => {
      const testData = { message: 'will expire' }
      const expireTime = 1000 // 1 second

      const { save } = useStorage('expire-key', null, { 
        expireTime,
        serializer: true
      })
      await save(testData)

      const lastCall = mockLocalStorage.setItem.mock.calls[mockLocalStorage.setItem.mock.calls.length - 1]
      const savedData = JSON.parse(lastCall[1])
      expect(savedData.expireAt).toBeDefined()
      expect(savedData.expireAt).toBeGreaterThan(Date.now())
    })

    it('test_load_expired_data - 验证过期数据的自动清理', async () => {
      const expiredData = {
        data: { message: 'expired' },
        timestamp: Date.now() - 2000, // 2 seconds ago
        expireAt: Date.now() - 1000   // expired 1 second ago
      }

      mockLocalStorage.getItem.mockReturnValue(JSON.stringify(expiredData))

      const defaultValue = { message: 'default' }
      const { load, storedValue } = useStorage('expired-key', defaultValue)
      
      const result = await load()

      expect(result).toEqual(defaultValue)
      expect(storedValue.value).toEqual(defaultValue)
      expect(mockLocalStorage.removeItem).toHaveBeenCalledWith('expired-key')
    })
  })

  describe('2.5 错误处理单元测试', () => {
    it('test_save_with_storage_quota_exceeded - 验证存储空间不足时的错误处理', async () => {
      const quotaError = new Error('QuotaExceededError')
      quotaError.name = 'QuotaExceededError'
      mockLocalStorage.setItem.mockImplementation(() => {
        throw quotaError
      })

      const { save, error } = useStorage('quota-key', null)
      const result = await save({ large: 'data' })

      expect(result).toBe(false)
      expect(error.value).toContain('存储空间不足')
    })

    it('test_load_with_corrupted_data - 验证读取损坏数据时的错误处理', async () => {
      // Mock corrupted JSON data
      mockLocalStorage.getItem.mockReturnValue('invalid json data')

      const defaultValue = { safe: 'default' }
      const { load, error } = useStorage('corrupted-key', defaultValue, {
        serializer: true
      })
      
      const result = await load()

      expect(result).toEqual(defaultValue)
      expect(error.value).toContain('解析失败')
    })

    it('test_custom_error_handler - 验证自定义错误处理函数', async () => {
      const customErrorHandler = vi.fn()
      mockLocalStorage.setItem.mockImplementation(() => {
        throw new Error('Custom storage error')
      })

      const { save } = useStorage('error-key', null, {
        errorHandler: customErrorHandler
      })

      await save({ test: 'data' })

      expect(customErrorHandler).toHaveBeenCalled()
      expect(customErrorHandler.mock.calls[0][0]).toBeInstanceOf(Error)
      expect(customErrorHandler.mock.calls[0][0].message).toBe('Custom storage error')
    })
  })

  describe('高级功能测试', () => {
    it('test_storage_type_switching - 验证存储类型切换', async () => {
      // Test localStorage
      const { save: saveLocal } = useStorage('type-key', null, {
        storageType: StorageType.LOCAL
      })
      await saveLocal({ storage: 'local' })
      expect(mockLocalStorage.setItem).toHaveBeenCalled()

      // Test sessionStorage
      const { save: saveSession } = useStorage('type-key', null, {
        storageType: StorageType.SESSION
      })
      await saveSession({ storage: 'session' })
      expect(mockSessionStorage.setItem).toHaveBeenCalled()
    })

    it('test_watch_storage_changes - 验证存储变化监听', async () => {
      const { storedValue, save } = useStorage('watch-key', { count: 0 })
      
      const watchCallback = vi.fn()
      // Simulate watching storedValue changes
      let currentValue = storedValue.value
      Object.defineProperty(storedValue, 'value', {
        get: () => currentValue,
        set: (newValue) => {
          const oldValue = currentValue
          currentValue = newValue
          watchCallback(newValue, oldValue)
        }
      })

      await save({ count: 1 })

      expect(watchCallback).toHaveBeenCalledWith(
        { count: 1 },
        { count: 0 }
      )
    })

    it('test_clear_all_storage - 验证清空所有存储', async () => {
      const { clear } = useStorage('clear-key', null)
      
      await clear()

      expect(mockLocalStorage.clear).toHaveBeenCalled()
    })
  })
}) 