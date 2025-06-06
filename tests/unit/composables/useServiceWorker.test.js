import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { useServiceWorker } from '@/composables/useServiceWorker'

// Mock Service Worker API
const mockServiceWorker = {
  register: vi.fn(),
  ready: Promise.resolve({
    update: vi.fn(),
    unregister: vi.fn(),
    postMessage: vi.fn()
  }),
  controller: {
    postMessage: vi.fn()
  },
  getRegistration: vi.fn()
}

// Mock caches API
const mockCaches = {
  open: vi.fn(),
  delete: vi.fn(),
  keys: vi.fn(),
  match: vi.fn()
}

// Mock Cache object
const mockCache = {
  addAll: vi.fn(),
  add: vi.fn(),
  delete: vi.fn(),
  keys: vi.fn(),
  match: vi.fn()
}

Object.defineProperty(window, 'navigator', {
  value: {
    serviceWorker: mockServiceWorker
  },
  writable: true
})

Object.defineProperty(window, 'caches', {
  value: mockCaches,
  writable: true
})

describe('useServiceWorker', () => {
  let swInstance

  beforeEach(() => {
    vi.clearAllMocks()
    
    // Reset mock implementations
    mockServiceWorker.register.mockResolvedValue({
      installing: null,
      waiting: null,
      active: { state: 'activated' },
      update: vi.fn(),
      unregister: vi.fn()
    })
    
    mockServiceWorker.getRegistration.mockResolvedValue(null)
    
    mockCaches.open.mockResolvedValue(mockCache)
    mockCaches.keys.mockResolvedValue(['cache-v1', 'cache-v2'])
    mockCache.keys.mockResolvedValue([])
    
    swInstance = useServiceWorker()
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  // =========================
  // Service Worker生命周期管理单元测试
  // =========================

  describe('Service Worker Lifecycle Management', () => {
    it('test_registerServiceWorker_success - 正常注册Service Worker单元测试', async () => {
      const mockRegistration = {
        installing: null,
        waiting: null,
        active: { state: 'activated' },
        update: vi.fn(),
        unregister: vi.fn()
      }
      mockServiceWorker.register.mockResolvedValue(mockRegistration)

      const registration = await swInstance.registerServiceWorker('/sw.js')

      expect(mockServiceWorker.register).toHaveBeenCalledWith('/sw.js', {})
      expect(registration).toBe(mockRegistration)
      expect(swInstance.isRegistered.value).toBe(true)
      expect(swInstance.isActive.value).toBe(true)
    })

    it('test_registerServiceWorker_already_registered - 重复注册处理单元测试', async () => {
      const mockRegistration = {
        installing: null,
        waiting: null,
        active: { state: 'activated' },
        update: vi.fn(),
        unregister: vi.fn()
      }
      
      // 先注册一次
      mockServiceWorker.register.mockResolvedValue(mockRegistration)
      await swInstance.registerServiceWorker('/sw.js')
      
      // 清除mock以检查第二次调用
      vi.clearAllMocks()

      // 再次注册 - 应该返回现有注册，不再调用register
      const registration = await swInstance.registerServiceWorker('/sw.js')

      // 应该不再调用register，因为已经有注册了
      expect(mockServiceWorker.register).toHaveBeenCalledTimes(0)
      expect(registration).toStrictEqual(mockRegistration)
    })

    it('test_registerServiceWorker_registration_failed - 注册失败处理单元测试', async () => {
      const error = new Error('Registration failed')
      mockServiceWorker.register.mockRejectedValue(error)

      await expect(swInstance.registerServiceWorker('/sw.js')).rejects.toThrow('Registration failed')
      
      expect(swInstance.isRegistered.value).toBe(false)
      expect(swInstance.isActive.value).toBe(false)
    })

    it('test_unregisterServiceWorker_success - 正常注销Service Worker单元测试', async () => {
      // 先注册
      const mockRegistration = {
        unregister: vi.fn().mockResolvedValue(true)
      }
      swInstance.registration.value = mockRegistration
      swInstance.isRegistered.value = true

      const result = await swInstance.unregisterServiceWorker()

      expect(mockRegistration.unregister).toHaveBeenCalled()
      expect(result).toBe(true)
      expect(swInstance.isRegistered.value).toBe(false)
      expect(swInstance.isActive.value).toBe(false)
    })

    it('test_updateServiceWorker_has_update - Service Worker更新单元测试', async () => {
      const mockRegistration = {
        update: vi.fn().mockResolvedValue(undefined),
        waiting: { state: 'installed' },
        installing: null
      }
      swInstance.registration.value = mockRegistration

      const hasUpdate = await swInstance.updateServiceWorker()

      expect(mockRegistration.update).toHaveBeenCalled()
      expect(hasUpdate).toBe(true)
      expect(swInstance.updateAvailable.value).toBe(true)
    })

    it('test_skipWaiting_activates_new_worker - 跳过等待激活新Worker单元测试', async () => {
      const mockWaitingWorker = {
        postMessage: vi.fn(),
        state: 'installed'
      }
      const mockRegistration = {
        waiting: mockWaitingWorker
      }
      swInstance.registration.value = mockRegistration

      await swInstance.skipWaiting()

      expect(mockWaitingWorker.postMessage).toHaveBeenCalledWith({ type: 'SKIP_WAITING' })
    })
  })

  // =========================
  // 缓存管理单元测试
  // =========================

  describe('Cache Management', () => {
    it('test_getCacheSize_calculates_total - 缓存大小计算单元测试', async () => {
      // Mock cache entries
      const mockEntries = [
        { url: 'http://example.com/file1.js' },
        { url: 'http://example.com/file2.css' }
      ]
      mockCache.keys.mockResolvedValue(mockEntries)
      
      // Mock response sizes
      const mockResponse1 = { headers: { get: vi.fn().mockReturnValue('1000') } }
      const mockResponse2 = { headers: { get: vi.fn().mockReturnValue('2000') } }
      mockCache.match.mockImplementation((request) => {
        if (request.url && request.url.includes('file1')) return Promise.resolve(mockResponse1)
        if (request.url && request.url.includes('file2')) return Promise.resolve(mockResponse2)
        return Promise.resolve(null)
      })

      const totalSize = await swInstance.getCacheSize()

      expect(mockCaches.keys).toHaveBeenCalled()
      expect(totalSize).toBeGreaterThan(0)
      expect(swInstance.cacheSize.value).toBe(totalSize)
    })

    it('test_getCacheSize_empty_cache - 空缓存大小计算单元测试', async () => {
      mockCaches.keys.mockResolvedValue([])

      const totalSize = await swInstance.getCacheSize()

      expect(totalSize).toBe(0)
      expect(swInstance.cacheSize.value).toBe(0)
    })

    it('test_clearCache_removes_all - 清理所有缓存单元测试', async () => {
      const cacheNames = ['cache-v1', 'cache-v2', 'cache-v3']
      mockCaches.keys.mockResolvedValue(cacheNames)
      mockCaches.delete.mockResolvedValue(true)

      const result = await swInstance.clearCache()

      expect(mockCaches.keys).toHaveBeenCalled()
      expect(mockCaches.delete).toHaveBeenCalledTimes(3)
      cacheNames.forEach(name => {
        expect(mockCaches.delete).toHaveBeenCalledWith(name)
      })
      expect(result).toBe(true)
      expect(swInstance.cacheSize.value).toBe(0)
    })

    it('test_clearSpecificCache_removes_target - 清理特定缓存单元测试', async () => {
      const cacheName = 'specific-cache-v1'
      mockCaches.delete.mockResolvedValue(true)

      const result = await swInstance.clearSpecificCache(cacheName)

      expect(mockCaches.delete).toHaveBeenCalledWith(cacheName)
      expect(result).toBe(true)
    })

    it('test_preloadCriticalAssets_success - 关键资源预加载单元测试', async () => {
      const urls = ['/app.js', '/app.css', '/logo.png']
      mockCache.addAll.mockResolvedValue(undefined)

      const result = await swInstance.preloadCriticalAssets(urls)

      expect(mockCaches.open).toHaveBeenCalledWith(expect.stringContaining('critical'))
      expect(mockCache.addAll).toHaveBeenCalledWith(urls)
      expect(result).toBe(true)
    })

    it('test_preloadCriticalAssets_invalid_urls - 无效URL处理单元测试', async () => {
      const invalidUrls = ['', null, undefined]

      const result = await swInstance.preloadCriticalAssets(invalidUrls)

      expect(result).toBe(false)
      expect(mockCache.addAll).not.toHaveBeenCalled()
    })
  })

  // =========================
  // Service Worker通信单元测试
  // =========================

  describe('Service Worker Communication', () => {
    it('test_sendMessageToSW_receives_response - SW消息发送接收单元测试', async () => {
      const testMessage = { type: 'TEST_MESSAGE', data: 'test data' }
      const mockResponse = { success: true, result: 'test result' }

      // Mock MessageChannel
      const mockChannel = {
        port1: { onmessage: null },
        port2: {}
      }
      global.MessageChannel = vi.fn(() => mockChannel)

      // Mock SW controller
      mockServiceWorker.controller = {
        postMessage: vi.fn()
      }

      const responsePromise = swInstance.sendMessageToSW(testMessage)

      // 模拟SW响应
      setTimeout(() => {
        mockChannel.port1.onmessage({ data: mockResponse })
      }, 10)

      const response = await responsePromise

      expect(mockServiceWorker.controller.postMessage).toHaveBeenCalledWith(
        testMessage, 
        [mockChannel.port2]
      )
      expect(response).toEqual(mockResponse)
    })

    it('test_sendMessageToSW_timeout_error - 消息超时错误处理单元测试', async () => {
      const testMessage = { type: 'TEST_MESSAGE' }

      // Mock MessageChannel
      const mockChannel = {
        port1: { onmessage: null },
        port2: {}
      }
      global.MessageChannel = vi.fn(() => mockChannel)

      // Mock SW controller
      mockServiceWorker.controller = {
        postMessage: vi.fn()
      }

      await expect(swInstance.sendMessageToSW(testMessage, 100)).rejects.toThrow()
    })

    it('test_listenToSWMessages_handles_messages - SW消息监听处理单元测试', () => {
      const mockHandler = vi.fn()
      
      const cleanup = swInstance.listenToSWMessages(mockHandler)

      // 模拟接收到SW消息
      const mockEvent = {
        data: { type: 'SW_MESSAGE', payload: 'test payload' },
        source: mockServiceWorker.controller
      }

      // 触发message事件
      const messageEvent = new MessageEvent('message', mockEvent)
      window.dispatchEvent(messageEvent)

      expect(mockHandler).toHaveBeenCalledWith(mockEvent.data)
      expect(typeof cleanup).toBe('function')
    })

    it('test_getServiceWorkerState_returns_status - SW状态获取单元测试', () => {
      // 设置模拟状态
      swInstance.isRegistered.value = true
      swInstance.isActive.value = true
      swInstance.updateAvailable.value = false
      swInstance.cacheSize.value = 1024

      const state = swInstance.getServiceWorkerState()

      expect(state).toEqual({
        isRegistered: true,
        isActive: true,
        updateAvailable: false,
        cacheSize: 1024,
        registration: swInstance.registration.value,
        cacheVersion: swInstance.cacheVersion.value
      })
    })
  })

  // =========================
  // 离线策略管理单元测试
  // =========================

  describe('Offline Strategy Management', () => {
    it('test_setCacheStrategy_valid_config - 缓存策略设置单元测试', async () => {
      const strategy = {
        name: 'images',
        pattern: /\.(?:png|jpg|jpeg|svg|gif|webp)$/,
        handler: 'CacheFirst',
        options: {
          cacheName: 'images-cache',
          expiration: {
            maxEntries: 50,
            maxAgeSeconds: 60 * 60 * 24 * 30
          }
        }
      }

      // Mock MessageChannel
      const mockChannel = {
        port1: { onmessage: null },
        port2: {}
      }
      global.MessageChannel = vi.fn(() => mockChannel)

      // Mock SW controller
      mockServiceWorker.controller = {
        postMessage: vi.fn()
      }

      const resultPromise = swInstance.setCacheStrategy(strategy)

      // 模拟SW响应
      setTimeout(() => {
        mockChannel.port1.onmessage({ data: true })
      }, 10)

      const result = await resultPromise

      expect(result).toBe(true)
    })

    it('test_getCacheStats_returns_statistics - 缓存统计获取单元测试', async () => {
      // Mock缓存统计数据
      const mockStats = {
        totalSize: 2048,
        totalEntries: 10,
        hitRate: 85.5,
        missRate: 14.5,
        cachesByName: {
          'static-cache': { size: 1024, entries: 5 },
          'api-cache': { size: 1024, entries: 5 }
        },
        lastUpdate: new Date().toISOString()
      }

      // Mock MessageChannel
      const mockChannel = {
        port1: { onmessage: null },
        port2: {}
      }
      global.MessageChannel = vi.fn(() => mockChannel)

      // Mock SW controller
      mockServiceWorker.controller = {
        postMessage: vi.fn()
      }

      const statsPromise = swInstance.getCacheStats()

      // 模拟SW响应
      setTimeout(() => {
        mockChannel.port1.onmessage({ data: mockStats })
      }, 10)

      const stats = await statsPromise

      expect(stats).toEqual(mockStats)
    })
  })

  // =========================
  // 初始化和清理单元测试
  // =========================

  describe('Initialization and Cleanup', () => {
    it('test_initializeServiceWorker_browser_support - 浏览器支持检查单元测试', async () => {
      await swInstance.initializeServiceWorker()

      expect(swInstance.isRegistered.value).toBeDefined()
    })

    it('test_initializeServiceWorker_no_support - 浏览器不支持单元测试', async () => {
      // 临时删除Service Worker支持
      const originalServiceWorker = window.navigator.serviceWorker
      delete window.navigator.serviceWorker

      await swInstance.initializeServiceWorker()

      expect(swInstance.isRegistered.value).toBe(false)
      
      // 恢复Service Worker支持
      window.navigator.serviceWorker = originalServiceWorker
    })

    it('test_cleanupServiceWorker_removes_listeners - 清理移除监听器单元测试', () => {
      const removeEventListenerSpy = vi.spyOn(window, 'removeEventListener')

      // 先添加一些监听器
      const handler = vi.fn()
      swInstance.listenToSWMessages(handler)
      
      // 然后清理
      swInstance.cleanupServiceWorker()

      expect(removeEventListenerSpy).toHaveBeenCalled()

      removeEventListenerSpy.mockRestore()
    })
  })

  // =========================
  // 错误处理和边界条件单元测试
  // =========================

  describe('Error Handling and Edge Cases', () => {
    it('test_registerServiceWorker_network_error - 注册网络错误单元测试', async () => {
      const networkError = new Error('Failed to fetch')
      mockServiceWorker.register.mockRejectedValue(networkError)

      await expect(swInstance.registerServiceWorker('/sw.js')).rejects.toThrow('Failed to fetch')
      expect(swInstance.isRegistered.value).toBe(false)
    })

    it('test_clearCache_partial_failure - 缓存清理部分失败单元测试', async () => {
      const cacheNames = ['cache-1', 'cache-2', 'cache-3']
      mockCaches.keys.mockResolvedValue(cacheNames)
      
      // 模拟部分删除失败
      mockCaches.delete.mockImplementation((name) => {
        if (name === 'cache-2') {
          return Promise.reject(new Error('Delete failed'))
        }
        return Promise.resolve(true)
      })

      const result = await swInstance.clearCache()

      expect(result).toBe(false)
      expect(mockCaches.delete).toHaveBeenCalledTimes(3)
    })

    it('test_sendMessageToSW_no_controller - 无SW控制器消息发送单元测试', async () => {
      // 设置无SW控制器
      mockServiceWorker.controller = null

      const message = { type: 'TEST' }
      await expect(swInstance.sendMessageToSW(message)).rejects.toThrow()
    })

    it('test_getCacheSize_calculation_error - 缓存大小计算错误单元测试', async () => {
      mockCaches.keys.mockRejectedValue(new Error('Cache access failed'))

      const size = await swInstance.getCacheSize()

      expect(size).toBe(0)
      expect(swInstance.cacheSize.value).toBe(0)
    })

    it('test_updateServiceWorker_no_registration - 无注册对象更新单元测试', async () => {
      swInstance.registration.value = null

      const hasUpdate = await swInstance.updateServiceWorker()

      expect(hasUpdate).toBe(false)
      expect(swInstance.updateAvailable.value).toBe(false)
    })

    it('test_preloadCriticalAssets_cache_error - 预加载缓存错误单元测试', async () => {
      const urls = ['/app.js', '/app.css']
      mockCache.addAll.mockRejectedValue(new Error('Cache operation failed'))

      const result = await swInstance.preloadCriticalAssets(urls)

      expect(result).toBe(false)
      expect(mockCache.addAll).toHaveBeenCalledWith(urls)
    })

    it('test_skipWaiting_no_waiting_worker - 无等待Worker跳过单元测试', async () => {
      swInstance.registration.value = { waiting: null }

      // 应该不抛出错误
      await expect(swInstance.skipWaiting()).resolves.toBeUndefined()
    })
  })
}) 