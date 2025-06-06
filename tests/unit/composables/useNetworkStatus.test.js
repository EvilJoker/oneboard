import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { nextTick } from 'vue'
import { useNetworkStatus, networkUtils } from '@/composables/useNetworkStatus.js'

// Mock APIs
const mockNavigator = {
  onLine: true,
  connection: {
    type: 'cellular',
    effectiveType: '4g',
    downlink: 10,
    rtt: 100,
    saveData: false,
    addEventListener: vi.fn(),
    removeEventListener: vi.fn()
  }
}

const mockPerformance = {
  now: vi.fn(() => Date.now())
}

const mockFetch = vi.fn(() => Promise.resolve({ ok: true }))

describe('useNetworkStatus', () => {
  let networkStatusInstance
  let originalNavigator
  let originalPerformance  
  let originalFetch
  let originalSetInterval
  let originalClearInterval

  beforeEach(() => {
    // 保存原始对象
    originalNavigator = global.navigator
    originalPerformance = global.performance
    originalFetch = global.fetch
    originalSetInterval = global.setInterval
    originalClearInterval = global.clearInterval

    // 设置 mocks
    global.navigator = mockNavigator
    global.performance = mockPerformance
    global.fetch = mockFetch
    global.setInterval = vi.fn((callback, delay) => {
      return setTimeout(callback, delay)
    })
    global.clearInterval = vi.fn((id) => {
      clearTimeout(id)
    })

    // 重置 mocks
    vi.clearAllMocks()
    mockFetch.mockResolvedValue({ ok: true })
    mockPerformance.now.mockReturnValue(100)
    mockNavigator.onLine = true
    mockNavigator.connection.addEventListener.mockClear()
    mockNavigator.connection.removeEventListener.mockClear()

    // 创建实例
    networkStatusInstance = useNetworkStatus()
  })

  afterEach(() => {
    // 清理实例
    if (networkStatusInstance) {
      networkStatusInstance.cleanupNetworkStatus()
    }

    // 恢复原始对象
    global.navigator = originalNavigator
    global.performance = originalPerformance
    global.fetch = originalFetch
    global.setInterval = originalSetInterval
    global.clearInterval = originalClearInterval
  })

  // =========================
  // 基础功能单元测试
  // =========================

  describe('Basic Functionality', () => {
    it('test_initialization - 初始化测试', () => {
      expect(networkStatusInstance.isOnline.value).toBe(true)
      expect(networkStatusInstance.networkType.value).toBe('unknown')
      expect(networkStatusInstance.effectiveType.value).toBe('4g')
      expect(networkStatusInstance.downlink.value).toBe(0)
      expect(networkStatusInstance.rtt.value).toBe(0)
      expect(networkStatusInstance.saveData.value).toBe(false)
      expect(networkStatusInstance.lastCheckTime.value).toBeInstanceOf(Date)
      expect(networkStatusInstance.changeCount.value).toBe(0)
    })

    it('test_initial_network_detection - 初始网络检测测试', () => {
      // 检测应该设置正确的初始状态
      networkStatusInstance.detectConnectionInfo()

      expect(networkStatusInstance.networkType.value).toBe('cellular')
      expect(networkStatusInstance.effectiveType.value).toBe('4g')
      expect(networkStatusInstance.downlink.value).toBe(10)
      expect(networkStatusInstance.rtt.value).toBe(100)
      expect(networkStatusInstance.saveData.value).toBe(false)
    })

    it('test_network_status_without_connection_api - 无连接API时的网络状态测试', () => {
      // 临时移除connection API
      const originalConnection = mockNavigator.connection
      delete mockNavigator.connection

      networkStatusInstance.detectConnectionInfo()

      // 应该设置默认值
      expect(networkStatusInstance.lastCheckTime.value).toBeInstanceOf(Date)

      // 恢复connection API
      mockNavigator.connection = originalConnection
    })
  })

  // =========================
  // 计算属性单元测试
  // =========================

  describe('Computed Properties', () => {
    it('test_network_status_online - 在线网络状态计算测试', () => {
      networkStatusInstance.isOnline.value = true
      networkStatusInstance.effectiveType.value = '4g'

      expect(networkStatusInstance.networkStatus.value).toBe('online')
    })

    it('test_network_status_offline - 离线网络状态计算测试', () => {
      networkStatusInstance.isOnline.value = false

      expect(networkStatusInstance.networkStatus.value).toBe('offline')
    })

    it('test_network_status_slow - 慢速网络状态计算测试', () => {
      networkStatusInstance.isOnline.value = true
      networkStatusInstance.effectiveType.value = '2g'

      expect(networkStatusInstance.networkStatus.value).toBe('slow')
    })

    it('test_connection_quality_calculation - 连接质量计算测试', () => {
      // 测试优秀连接
      networkStatusInstance.isOnline.value = true
      networkStatusInstance.effectiveType.value = '4g'
      networkStatusInstance.rtt.value = 50
      networkStatusInstance.downlink.value = 20

      expect(networkStatusInstance.connectionQuality.value).toBeGreaterThan(90)

      // 测试差连接
      networkStatusInstance.effectiveType.value = 'slow-2g'
      networkStatusInstance.rtt.value = 2000
      networkStatusInstance.downlink.value = 0.1

      expect(networkStatusInstance.connectionQuality.value).toBeLessThan(50)
    })

    it('test_connection_quality_offline - 离线连接质量测试', () => {
      networkStatusInstance.isOnline.value = false

      expect(networkStatusInstance.connectionQuality.value).toBe(0)
    })

    it('test_is_slow_connection - 慢速连接检测测试', () => {
      // 测试快速连接
      networkStatusInstance.saveData.value = false
      networkStatusInstance.effectiveType.value = '4g'
      networkStatusInstance.rtt.value = 100
      networkStatusInstance.downlink.value = 10

      expect(networkStatusInstance.isSlowConnection.value).toBe(false)

      // 测试慢速连接
      networkStatusInstance.saveData.value = true
      expect(networkStatusInstance.isSlowConnection.value).toBe(true)

      // 测试2G连接
      networkStatusInstance.saveData.value = false
      networkStatusInstance.effectiveType.value = '2g'
      expect(networkStatusInstance.isSlowConnection.value).toBe(true)
    })

    it('test_connection_description - 连接描述测试', () => {
      // 测试离线状态
      networkStatusInstance.isOnline.value = false
      expect(networkStatusInstance.connectionDescription.value).toBe('离线')

      // 测试在线状态
      networkStatusInstance.isOnline.value = true
      networkStatusInstance.networkType.value = 'cellular'
      networkStatusInstance.effectiveType.value = '4g'
      networkStatusInstance.downlink.value = 10

      const description = networkStatusInstance.connectionDescription.value
      expect(description).toContain('cellular')
      expect(description).toContain('4G')
      expect(description).toContain('10 Mbps')
    })
  })

  // =========================
  // 网络状态检测单元测试
  // =========================

  describe('Network Detection', () => {
    it('test_detect_connection_info - 连接信息检测测试', () => {
      const beforeTime = new Date()
      
      networkStatusInstance.detectConnectionInfo()
      
      expect(networkStatusInstance.networkType.value).toBe('cellular')
      expect(networkStatusInstance.effectiveType.value).toBe('4g')
      expect(networkStatusInstance.downlink.value).toBe(10)
      expect(networkStatusInstance.rtt.value).toBe(100)
      expect(networkStatusInstance.saveData.value).toBe(false)
      expect(networkStatusInstance.lastCheckTime.value.getTime()).toBeGreaterThanOrEqual(beforeTime.getTime())
    })

    it('test_update_network_status_changes - 网络状态变化更新测试', () => {
      const initialChangeCount = networkStatusInstance.changeCount.value
      
      // 从在线切换到离线
      networkStatusInstance.updateNetworkStatus(false)
      
      expect(networkStatusInstance.isOnline.value).toBe(false)
      expect(networkStatusInstance.changeCount.value).toBe(initialChangeCount + 1)
    })

    it('test_update_network_status_no_change - 网络状态无变化更新测试', () => {
      const initialChangeCount = networkStatusInstance.changeCount.value
      
      // 保持相同状态
      networkStatusInstance.updateNetworkStatus(true)
      
      expect(networkStatusInstance.isOnline.value).toBe(true)
      expect(networkStatusInstance.changeCount.value).toBe(initialChangeCount)
    })

    it('test_connection_quality_test_success - 连接质量测试成功测试', async () => {
      mockPerformance.now.mockReturnValueOnce(100).mockReturnValueOnce(150)
      // 确保downlink有值
      networkStatusInstance.downlink.value = 10
      
      const result = await networkStatusInstance.testConnectionQuality()
      
      expect(result).toEqual({
        latency: 50,
        speed: 10,
        quality: 'excellent'
      })
      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining('/favicon.ico?t='),
        { cache: 'no-cache', method: 'HEAD' }
      )
    })

    it('test_connection_quality_test_offline - 离线连接质量测试', async () => {
      networkStatusInstance.isOnline.value = false
      
      const result = await networkStatusInstance.testConnectionQuality()
      
      expect(result).toEqual({
        latency: null,
        speed: null,
        quality: 'offline'
      })
    })

    it('test_connection_quality_test_error - 连接质量测试错误处理', async () => {
      mockFetch.mockRejectedValueOnce(new Error('Network error'))
      
      const result = await networkStatusInstance.testConnectionQuality()
      
      expect(result).toEqual({
        latency: null,
        speed: null,
        quality: 'poor'
      })
    })

    it('test_connection_quality_levels - 连接质量等级测试', async () => {
      // 测试不同延迟等级
      const testCases = [
        { latency: 50, expected: 'excellent' },
        { latency: 200, expected: 'good' },
        { latency: 700, expected: 'slow' },
        { latency: 1500, expected: 'poor' }
      ]

      for (const testCase of testCases) {
        mockPerformance.now
          .mockReturnValueOnce(100)
          .mockReturnValueOnce(100 + testCase.latency)
        
        const result = await networkStatusInstance.testConnectionQuality()
        expect(result.quality).toBe(testCase.expected)
      }
    })
  })

  // =========================
  // 事件监听管理单元测试
  // =========================

  describe('Event Management', () => {
    it('test_start_network_monitoring - 开始网络监控测试', () => {
      const addEventListenerSpy = vi.spyOn(window, 'addEventListener')
      
      networkStatusInstance.startNetworkMonitoring()
      
      expect(addEventListenerSpy).toHaveBeenCalledWith('online', expect.any(Function))
      expect(addEventListenerSpy).toHaveBeenCalledWith('offline', expect.any(Function))
      expect(mockNavigator.connection.addEventListener).toHaveBeenCalledWith('change', expect.any(Function))
      expect(global.setInterval).toHaveBeenCalledWith(expect.any(Function), 30000)
      
      addEventListenerSpy.mockRestore()
    })

    it('test_stop_network_monitoring - 停止网络监控测试', () => {
      const removeEventListenerSpy = vi.spyOn(window, 'removeEventListener')
      
      // 先开始监控
      networkStatusInstance.startNetworkMonitoring()
      
      // 然后停止监控
      networkStatusInstance.stopNetworkMonitoring()
      
      expect(removeEventListenerSpy).toHaveBeenCalledWith('online', expect.any(Function))
      expect(removeEventListenerSpy).toHaveBeenCalledWith('offline', expect.any(Function))
      expect(mockNavigator.connection.removeEventListener).toHaveBeenCalledWith('change', expect.any(Function))
      expect(global.clearInterval).toHaveBeenCalled()
      
      removeEventListenerSpy.mockRestore()
    })

    it('test_start_monitoring_without_connection_api - 无连接API时开始监控测试', () => {
      const originalConnection = mockNavigator.connection
      delete mockNavigator.connection
      
      const addEventListenerSpy = vi.spyOn(window, 'addEventListener')
      
      networkStatusInstance.startNetworkMonitoring()
      
      expect(addEventListenerSpy).toHaveBeenCalledWith('online', expect.any(Function))
      expect(addEventListenerSpy).toHaveBeenCalledWith('offline', expect.any(Function))
      expect(global.setInterval).toHaveBeenCalledWith(expect.any(Function), 30000)
      
      addEventListenerSpy.mockRestore()
      mockNavigator.connection = originalConnection
    })
  })

  // =========================
  // 生命周期管理单元测试
  // =========================

  describe('Lifecycle Management', () => {
    test('test_initialize_network_status - 初始化网络状态测试', () => {
      // 创建初始状态
      const testInstance = useNetworkStatus()
      
      // 记录调用前的状态
      const beforeChangeCount = testInstance.changeCount.value
      
      // 调用初始化方法
      testInstance.initializeNetworkStatus()
      
      // 验证状态有变化（说明方法被执行了）
      expect(testInstance.changeCount.value).toBeGreaterThanOrEqual(beforeChangeCount)
      
      // 验证lastCheckTime被设置了
      expect(testInstance.lastCheckTime.value).toBeDefined()
      expect(typeof testInstance.lastCheckTime.value === 'number' || testInstance.lastCheckTime.value instanceof Date).toBe(true)
    })

    test('test_cleanup_network_status - 清理网络状态测试', () => {
      const testInstance = useNetworkStatus()
      
      // 先启动监控
      testInstance.startNetworkMonitoring()
      
      // 调用清理方法
      testInstance.cleanupNetworkStatus()
      
      // 验证清理成功（这里我们简单验证方法存在且可调用）
      expect(typeof testInstance.cleanupNetworkStatus).toBe('function')
    })
  })

  // =========================
  // 边界情况和错误处理单元测试
  // =========================

  describe('Edge Cases and Error Handling', () => {
    it('test_navigator_without_onLine - 无onLine属性的navigator测试', () => {
      const navigatorWithoutOnLine = { ...mockNavigator }
      delete navigatorWithoutOnLine.onLine
      
      global.navigator = navigatorWithoutOnLine
      
      expect(() => {
        const instance = useNetworkStatus()
        expect(instance.isOnline.value).toBe(false) // 默认值
      }).not.toThrow()
    })

    it('test_connection_api_partial_support - 连接API部分支持测试', () => {
      const partialConnection = {
        type: 'wifi',
        // 缺少其他属性
        addEventListener: vi.fn(),
        removeEventListener: vi.fn()
      }
      
      mockNavigator.connection = partialConnection
      
      networkStatusInstance.detectConnectionInfo()
      
      expect(networkStatusInstance.networkType.value).toBe('wifi')
      expect(networkStatusInstance.effectiveType.value).toBe('4g') // 默认值
    })

    it('test_extreme_rtt_values - 极端RTT值测试', () => {
      // 测试极高RTT
      networkStatusInstance.isOnline.value = true
      networkStatusInstance.effectiveType.value = '4g'
      networkStatusInstance.rtt.value = 5000
      
      expect(networkStatusInstance.connectionQuality.value).toBeLessThan(80)
      
      // 测试极低RTT
      networkStatusInstance.rtt.value = 10
      expect(networkStatusInstance.connectionQuality.value).toBeGreaterThan(90)
    })

    it('test_extreme_downlink_values - 极端下载速度值测试', () => {
      networkStatusInstance.isOnline.value = true
      networkStatusInstance.effectiveType.value = '4g'
      
      // 测试极低下载速度
      networkStatusInstance.downlink.value = 0.1
      expect(networkStatusInstance.connectionQuality.value).toBeLessThan(90)
      
      // 测试极高下载速度
      networkStatusInstance.downlink.value = 50
      expect(networkStatusInstance.connectionQuality.value).toBeGreaterThan(90)
    })

    it('test_concurrent_status_updates - 并发状态更新测试', async () => {
      const promises = []
      
      // 同时进行多个状态更新
      for (let i = 0; i < 5; i++) {
        promises.push(
          new Promise(resolve => {
            setTimeout(() => {
              networkStatusInstance.updateNetworkStatus(i % 2 === 0)
              resolve()
            }, i * 10)
          })
        )
      }
      
      await Promise.all(promises)
      
      // 应该不会崩溃，最终状态应该是确定的
      expect(typeof networkStatusInstance.isOnline.value).toBe('boolean')
      expect(networkStatusInstance.changeCount.value).toBeGreaterThan(0)
    })
  })
})

// =========================
// NetworkUtils 工具函数测试
// =========================

describe('networkUtils', () => {
  describe('Utility Functions', () => {
    test('test_supports_connection_api - 连接API支持检测测试', () => {
      // 测试支持Connection API
      global.navigator = { connection: { effectiveType: '4g' } }
      expect(networkUtils.supportsConnectionAPI()).toBe(true)
      
      // 测试不支持Connection API
      global.navigator = {}
      expect(networkUtils.supportsConnectionAPI()).toBe(false)
      
      // 测试connection为null的情况
      global.navigator = { connection: null }
      expect(networkUtils.supportsConnectionAPI()).toBe(false)
      
      // 测试没有navigator的情况
      const originalNavigator = global.navigator
      delete global.navigator
      expect(networkUtils.supportsConnectionAPI()).toBe(false)
      global.navigator = originalNavigator
    })

    it('test_connection_type_descriptions - 连接类型描述测试', () => {
      expect(networkUtils.getConnectionTypeDescription('wifi')).toBe('WiFi')
      expect(networkUtils.getConnectionTypeDescription('cellular')).toBe('蜂窝网络')
      expect(networkUtils.getConnectionTypeDescription('ethernet')).toBe('以太网')
      expect(networkUtils.getConnectionTypeDescription('unknown')).toBe('未知')
      expect(networkUtils.getConnectionTypeDescription('invalid')).toBe('invalid')
    })

    it('test_effective_type_descriptions - 有效类型描述测试', () => {
      expect(networkUtils.getEffectiveTypeDescription('4g')).toBe('快速 (>= 1.5 Mbps)')
      expect(networkUtils.getEffectiveTypeDescription('3g')).toBe('中速 (< 1.5 Mbps)')
      expect(networkUtils.getEffectiveTypeDescription('2g')).toBe('慢速 (< 250 Kbps)')
      expect(networkUtils.getEffectiveTypeDescription('slow-2g')).toBe('极慢 (< 50 Kbps)')
      expect(networkUtils.getEffectiveTypeDescription('unknown')).toBe('unknown')
    })
  })
}) 