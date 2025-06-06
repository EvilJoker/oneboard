import { describe, it, expect, beforeEach, vi } from 'vitest'
import {
  PWAState,
  PWAConfig,
  ServiceWorkerState,
  CacheStrategy,
  NetworkStatus,
  NetworkCheckResult,
  PWAEventType,
  PWAError,
  CacheStatistics,
  ServiceWorkerMessage
} from '@/types/pwa'

describe('PWA Types', () => {
  
  // =========================
  // PWA状态数据结构单元测试
  // =========================

  describe('PWAState', () => {
    it('test_pwa_state_creation - PWA状态创建单元测试', () => {
      const state = new PWAState()

      expect(state.isOnline).toBe(true)
      expect(state.isInstallable).toBe(false)
      expect(state.isInstalled).toBe(false)
      expect(state.notificationsEnabled).toBe(false)
      expect(state.promptEvent).toBeNull()
      expect(state.installPromptShown).toBe(false)
      expect(state.lastUpdateCheck).toBeInstanceOf(Date)
      expect(state.networkStatus).toBe('online')
      expect(state.cacheVersion).toBe('v1.0.0')
    })

    it('test_pwa_state_with_custom_values - 自定义值PWA状态单元测试', () => {
      const customData = {
        isOnline: false,
        isInstallable: true,
        isInstalled: true,
        notificationsEnabled: true,
        networkStatus: 'offline',
        cacheVersion: 'v2.0.0'
      }

      const state = new PWAState(customData)

      expect(state.isOnline).toBe(false)
      expect(state.isInstallable).toBe(true)
      expect(state.isInstalled).toBe(true)
      expect(state.notificationsEnabled).toBe(true)
      expect(state.networkStatus).toBe('offline')
      expect(state.cacheVersion).toBe('v2.0.0')
    })

    it('test_pwa_state_toJSON - PWA状态JSON序列化单元测试', () => {
      const state = new PWAState()
      const json = state.toJSON()

      expect(json).toBeInstanceOf(Object)
      expect(json.isOnline).toBe(true)
      expect(json.isInstallable).toBe(false)
      expect(json.lastUpdateCheck).toBeInstanceOf(Date)
    })

    it('test_pwa_state_validation - PWA状态验证单元测试', () => {
      const validState = new PWAState()
      expect(validState.isValid()).toBe(true)

      // 测试无效状态
      const invalidState = new PWAState({ networkStatus: 'invalid-status' })
      expect(invalidState.isValid()).toBe(false)
    })

    it('test_pwa_state_reset - PWA状态重置单元测试', () => {
      const state = new PWAState({
        isInstalled: true,
        notificationsEnabled: true,
        installPromptShown: true
      })

      expect(state.isInstalled).toBe(true)
      
      state.reset()
      
      expect(state.isInstalled).toBe(false)
      expect(state.notificationsEnabled).toBe(false)
      expect(state.installPromptShown).toBe(false)
    })
  })

  // =========================
  // PWA配置数据结构单元测试
  // =========================

  describe('PWAConfig', () => {
    it('test_pwa_config_creation - PWA配置创建单元测试', () => {
      const config = new PWAConfig()

      expect(config.name).toBe('OneBoard PWA')
      expect(config.shortName).toBe('OneBoard')
      expect(config.description).toBe('A powerful task management PWA')
      expect(config.themeColor).toBe('#1976D2')
      expect(config.backgroundColor).toBe('#ffffff')
      expect(config.display).toBe('standalone')
      expect(config.orientation).toBe('portrait')
      expect(config.startUrl).toBe('/')
      expect(config.scope).toBe('/')
      expect(config.lang).toBe('zh-CN')
      expect(config.dir).toBe('ltr')
      expect(config.icons).toEqual([])
      expect(config.shortcuts).toEqual([])
      expect(config.categories).toEqual(['productivity', 'utilities'])
    })

    it('test_pwa_config_with_custom_values - 自定义值PWA配置单元测试', () => {
      const customData = {
        name: 'Custom PWA',
        shortName: 'CustomApp',
        themeColor: '#ff0000',
        display: 'fullscreen',
        icons: [
          { src: '/icon-192.png', sizes: '192x192', type: 'image/png' }
        ]
      }

      const config = new PWAConfig(customData)

      expect(config.name).toBe('Custom PWA')
      expect(config.shortName).toBe('CustomApp')
      expect(config.themeColor).toBe('#ff0000')
      expect(config.display).toBe('fullscreen')
      expect(config.icons).toHaveLength(1)
      expect(config.icons[0].src).toBe('/icon-192.png')
    })

    it('test_pwa_config_merge - PWA配置合并单元测试', () => {
      const config = new PWAConfig()
      const updates = {
        name: 'Updated PWA',
        themeColor: '#00ff00',
        newProperty: 'new value'
      }

      const mergedConfig = config.merge(updates)

      expect(mergedConfig.name).toBe('Updated PWA')
      expect(mergedConfig.themeColor).toBe('#00ff00')
      expect(mergedConfig.shortName).toBe('OneBoard') // 保持原值
      expect(mergedConfig.newProperty).toBe('new value')
    })

    it('test_pwa_config_validation - PWA配置验证单元测试', () => {
      const validConfig = new PWAConfig()
      expect(validConfig.isValid()).toBe(true)

      const invalidConfig = new PWAConfig({
        display: 'invalid-display',
        orientation: 'invalid-orientation'
      })
      expect(invalidConfig.isValid()).toBe(false)
    })

    it('test_pwa_config_icon_validation - PWA配置图标验证单元测试', () => {
      const config = new PWAConfig()
      
      const validIcon = { src: '/icon.png', sizes: '192x192', type: 'image/png' }
      expect(config.validateIcon(validIcon)).toBe(true)

      const invalidIcon = { src: '', sizes: 'invalid', type: '' }
      expect(config.validateIcon(invalidIcon)).toBe(false)
    })
  })

  // =========================
  // Service Worker状态数据结构单元测试
  // =========================

  describe('ServiceWorkerState', () => {
    it('test_service_worker_state_creation - Service Worker状态创建单元测试', () => {
      const state = new ServiceWorkerState()

      expect(state.isRegistered).toBe(false)
      expect(state.isActive).toBe(false)
      expect(state.updateAvailable).toBe(false)
      expect(state.registration).toBeNull()
      expect(state.controller).toBeNull()
      expect(state.lastUpdate).toBeInstanceOf(Date)
      expect(state.version).toBe('1.0.0')
      expect(state.scope).toBe('/')
      expect(state.state).toBe('inactive')
    })

    it('test_service_worker_state_with_registration - 注册对象Service Worker状态单元测试', () => {
      const mockRegistration = {
        scope: '/app/',
        active: { state: 'activated' },
        waiting: null,
        installing: null,
        update: vi.fn(),
        unregister: vi.fn()
      }

      const state = new ServiceWorkerState({
        isRegistered: true,
        isActive: true,
        registration: mockRegistration,
        scope: '/app/',
        state: 'activated'
      })

      expect(state.isRegistered).toBe(true)
      expect(state.isActive).toBe(true)
      expect(state.registration).toBe(mockRegistration)
      expect(state.scope).toBe('/app/')
      expect(state.state).toBe('activated')
    })

    it('test_service_worker_state_update - Service Worker状态更新单元测试', () => {
      const state = new ServiceWorkerState()
      
      const updates = {
        isRegistered: true,
        isActive: true,
        updateAvailable: true,
        version: '2.0.0'
      }

      state.update(updates)

      expect(state.isRegistered).toBe(true)
      expect(state.isActive).toBe(true)
      expect(state.updateAvailable).toBe(true)
      expect(state.version).toBe('2.0.0')
    })

    it('test_service_worker_state_reset - Service Worker状态重置单元测试', () => {
      const state = new ServiceWorkerState({
        isRegistered: true,
        isActive: true,
        updateAvailable: true
      })

      state.reset()

      expect(state.isRegistered).toBe(false)
      expect(state.isActive).toBe(false)
      expect(state.updateAvailable).toBe(false)
      expect(state.registration).toBeNull()
      expect(state.controller).toBeNull()
    })
  })

  // =========================
  // 缓存策略数据结构单元测试
  // =========================

  describe('CacheStrategy', () => {
    it('test_cache_strategy_creation - 缓存策略创建单元测试', () => {
      const strategy = new CacheStrategy()

      expect(strategy.name).toBe('default')
      expect(strategy.pattern).toBeInstanceOf(RegExp)
      expect(strategy.handler).toBe('NetworkFirst')
      expect(strategy.options).toBeInstanceOf(Object)
      expect(strategy.options.cacheName).toBe('default-cache')
      expect(strategy.options.networkTimeoutSeconds).toBe(3)
    })

    it('test_cache_strategy_with_custom_values - 自定义值缓存策略单元测试', () => {
      const customData = {
        name: 'images',
        pattern: /\.(png|jpg|jpeg|gif|webp)$/,
        handler: 'CacheFirst',
        options: {
          cacheName: 'images-cache',
          expiration: {
            maxEntries: 50,
            maxAgeSeconds: 60 * 60 * 24 * 30
          }
        }
      }

      const strategy = new CacheStrategy(customData)

      expect(strategy.name).toBe('images')
      expect(strategy.pattern).toEqual(/\.(png|jpg|jpeg|gif|webp)$/)
      expect(strategy.handler).toBe('CacheFirst')
      expect(strategy.options.cacheName).toBe('images-cache')
      expect(strategy.options.expiration.maxEntries).toBe(50)
    })

    it('test_cache_strategy_validation - 缓存策略验证单元测试', () => {
      const validStrategy = new CacheStrategy({
        name: 'api',
        pattern: /\/api\//,
        handler: 'NetworkFirst'
      })
      expect(validStrategy.isValid()).toBe(true)

      const invalidStrategy = new CacheStrategy({
        name: '',
        pattern: 'invalid-pattern',
        handler: 'InvalidHandler'
      })
      expect(invalidStrategy.isValid()).toBe(false)
    })

    it('test_cache_strategy_matches_url - 缓存策略URL匹配单元测试', () => {
      const strategy = new CacheStrategy({
        pattern: /\.(js|css)$/
      })

      expect(strategy.matches('/app.js')).toBe(true)
      expect(strategy.matches('/styles.css')).toBe(true)
      expect(strategy.matches('/image.png')).toBe(false)
      expect(strategy.matches('/api/data')).toBe(false)
    })

    it('test_cache_strategy_merge_options - 缓存策略选项合并单元测试', () => {
      const strategy = new CacheStrategy()
      const newOptions = {
        cacheName: 'new-cache',
        networkTimeoutSeconds: 5,
        expiration: {
          maxEntries: 100
        }
      }

      strategy.mergeOptions(newOptions)

      expect(strategy.options.cacheName).toBe('new-cache')
      expect(strategy.options.networkTimeoutSeconds).toBe(5)
      expect(strategy.options.expiration.maxEntries).toBe(100)
    })
  })

  // =========================
  // 网络状态数据结构单元测试
  // =========================

  describe('NetworkStatus', () => {
    it('test_network_status_creation - 网络状态创建单元测试', () => {
      const status = new NetworkStatus()

      expect(status.isOnline).toBe(true)
      expect(status.connectionType).toBe('unknown')
      expect(status.effectiveType).toBe('4g')
      expect(status.downlink).toBe(10)
      expect(status.rtt).toBe(100)
      expect(status.saveData).toBe(false)
      expect(status.lastCheck).toBeInstanceOf(Date)
      expect(status.checkInterval).toBe(30000)
    })

    it('test_network_status_with_custom_values - 自定义值网络状态单元测试', () => {
      const customData = {
        isOnline: false,
        connectionType: '3g',
        effectiveType: '3g',
        downlink: 1.5,
        rtt: 200,
        saveData: true
      }

      const status = new NetworkStatus(customData)

      expect(status.isOnline).toBe(false)
      expect(status.connectionType).toBe('3g')
      expect(status.effectiveType).toBe('3g')
      expect(status.downlink).toBe(1.5)
      expect(status.rtt).toBe(200)
      expect(status.saveData).toBe(true)
    })

    it('test_network_status_update - 网络状态更新单元测试', () => {
      const status = new NetworkStatus()
      
      const updates = {
        isOnline: false,
        connectionType: 'offline',
        lastCheck: new Date()
      }

      status.update(updates)

      expect(status.isOnline).toBe(false)
      expect(status.connectionType).toBe('offline')
      expect(status.lastCheck).toBeInstanceOf(Date)
    })

    it('test_network_status_quality_assessment - 网络状态质量评估单元测试', () => {
      const goodConnection = new NetworkStatus({
        effectiveType: '4g',
        downlink: 10,
        rtt: 50
      })
      expect(goodConnection.getQuality()).toBe('excellent')

      const mediumConnection = new NetworkStatus({
        effectiveType: '3g',
        downlink: 1.5,
        rtt: 200
      })
      expect(mediumConnection.getQuality()).toBe('good')

      const poorConnection = new NetworkStatus({
        effectiveType: '2g',
        downlink: 0.25,
        rtt: 500
      })
      expect(poorConnection.getQuality()).toBe('poor')
    })

    it('test_network_status_is_slow_connection - 网络状态慢连接检测单元测试', () => {
      const fastConnection = new NetworkStatus({
        effectiveType: '4g',
        saveData: false
      })
      expect(fastConnection.isSlowConnection()).toBe(false)

      const slowConnection = new NetworkStatus({
        effectiveType: '2g',
        saveData: true
      })
      expect(slowConnection.isSlowConnection()).toBe(true)
    })
  })

  // =========================
  // 网络检查结果数据结构单元测试
  // =========================

  describe('NetworkCheckResult', () => {
    it('test_network_check_result_creation - 网络检查结果创建单元测试', () => {
      const result = new NetworkCheckResult()

      expect(result.isOnline).toBe(true)
      expect(result.latency).toBe(0)
      expect(result.timestamp).toBeInstanceOf(Date)
      expect(result.success).toBe(true)
      expect(result.error).toBeNull()
      expect(result.method).toBe('navigator')
      expect(result.url).toBe('')
      expect(result.timeout).toBe(5000)
    })

    it('test_network_check_result_with_error - 错误网络检查结果单元测试', () => {
      const errorResult = new NetworkCheckResult({
        isOnline: false,
        success: false,
        error: 'Network timeout',
        method: 'fetch',
        url: 'https://api.example.com/ping'
      })

      expect(errorResult.isOnline).toBe(false)
      expect(errorResult.success).toBe(false)
      expect(errorResult.error).toBe('Network timeout')
      expect(errorResult.method).toBe('fetch')
      expect(errorResult.url).toBe('https://api.example.com/ping')
    })

    it('test_network_check_result_latency_calculation - 网络检查结果延迟计算单元测试', () => {
      const result = new NetworkCheckResult()
      const startTime = Date.now()
      
      setTimeout(() => {
        result.calculateLatency(startTime)
        expect(result.latency).toBeGreaterThan(0)
      }, 10)
    })

    it('test_network_check_result_validation - 网络检查结果验证单元测试', () => {
      const validResult = new NetworkCheckResult({
        success: true,
        method: 'fetch'
      })
      expect(validResult.isValid()).toBe(true)

      const invalidResult = new NetworkCheckResult({
        success: false,
        error: null,
        method: 'invalid-method'
      })
      expect(invalidResult.isValid()).toBe(false)
    })
  })

  // =========================
  // PWA事件类型单元测试
  // =========================

  describe('PWAEventType', () => {
    it('test_pwa_event_type_constants - PWA事件类型常量单元测试', () => {
      expect(PWAEventType.INSTALL_PROMPT).toBe('beforeinstallprompt')
      expect(PWAEventType.APP_INSTALLED).toBe('appinstalled')
      expect(PWAEventType.SW_UPDATE_AVAILABLE).toBe('sw-update-available')
      expect(PWAEventType.SW_UPDATE_APPLIED).toBe('sw-update-applied')
      expect(PWAEventType.NETWORK_STATUS_CHANGE).toBe('network-status-change')
      expect(PWAEventType.CACHE_UPDATE).toBe('cache-update')
      expect(PWAEventType.NOTIFICATION_PERMISSION).toBe('notification-permission')
      expect(PWAEventType.PUSH_MESSAGE).toBe('push-message')
    })

    it('test_pwa_event_type_validation - PWA事件类型验证单元测试', () => {
      const validEvents = Object.values(PWAEventType)
      
      validEvents.forEach(event => {
        expect(PWAEventType.isValid(event)).toBe(true)
      })

      expect(PWAEventType.isValid('invalid-event')).toBe(false)
      expect(PWAEventType.isValid('')).toBe(false)
      expect(PWAEventType.isValid(null)).toBe(false)
    })

    it('test_pwa_event_type_get_all - PWA事件类型获取所有单元测试', () => {
      const allEvents = PWAEventType.getAll()
      
      expect(allEvents).toBeInstanceOf(Array)
      expect(allEvents.length).toBeGreaterThan(0)
      expect(allEvents).toContain('beforeinstallprompt')
      expect(allEvents).toContain('appinstalled')
    })
  })

  // =========================
  // PWA错误数据结构单元测试
  // =========================

  describe('PWAError', () => {
    it('test_pwa_error_creation - PWA错误创建单元测试', () => {
      const error = new PWAError()

      expect(error.type).toBe('unknown')
      expect(error.message).toBe('')
      expect(error.timestamp).toBeInstanceOf(Date)
      expect(error.source).toBe('pwa')
      expect(error.severity).toBe('error')
      expect(error.context).toEqual({})
      expect(error.stack).toBe('')
      expect(error.userAgent).toBe(navigator.userAgent)
    })

    it('test_pwa_error_with_custom_values - 自定义值PWA错误单元测试', () => {
      const customData = {
        type: 'network',
        message: 'Network connection failed',
        source: 'service-worker',
        severity: 'warning',
        context: { url: 'https://api.example.com' }
      }

      const error = new PWAError(customData)

      expect(error.type).toBe('network')
      expect(error.message).toBe('Network connection failed')
      expect(error.source).toBe('service-worker')
      expect(error.severity).toBe('warning')
      expect(error.context.url).toBe('https://api.example.com')
    })

    it('test_pwa_error_from_exception - 异常创建PWA错误单元测试', () => {
      const jsError = new Error('Test error')
      jsError.stack = 'Error: Test error\n    at test.js:1:1'

      const pwaError = PWAError.fromException(jsError, 'test', 'error')

      expect(pwaError.type).toBe('test')
      expect(pwaError.message).toBe('Test error')
      expect(pwaError.severity).toBe('error')
      expect(pwaError.stack).toContain('Error: Test error')
    })

    it('test_pwa_error_to_json - PWA错误JSON转换单元测试', () => {
      const error = new PWAError({
        type: 'cache',
        message: 'Cache operation failed'
      })

      const json = error.toJSON()

      expect(json).toBeInstanceOf(Object)
      expect(json.type).toBe('cache')
      expect(json.message).toBe('Cache operation failed')
      expect(json.timestamp).toBeInstanceOf(Date)
    })

    it('test_pwa_error_severity_levels - PWA错误严重程度级别单元测试', () => {
      const levels = ['info', 'warning', 'error', 'critical']
      
      levels.forEach(level => {
        const error = new PWAError({ severity: level })
        expect(error.severity).toBe(level)
        expect(error.isValid()).toBe(true)
      })

      const invalidError = new PWAError({ severity: 'invalid-level' })
      expect(invalidError.isValid()).toBe(false)
    })
  })

  // =========================
  // 缓存统计数据结构单元测试
  // =========================

  describe('CacheStatistics', () => {
    it('test_cache_statistics_creation - 缓存统计创建单元测试', () => {
      const stats = new CacheStatistics()

      expect(stats.totalSize).toBe(0)
      expect(stats.totalEntries).toBe(0)
      expect(stats.hitRate).toBe(0)
      expect(stats.missRate).toBe(0)
      expect(stats.lastUpdate).toBeInstanceOf(Date)
      expect(stats.cachesByName).toEqual({})
    })

    it('test_cache_statistics_with_data - 数据缓存统计单元测试', () => {
      const customData = {
        totalSize: 2048,
        totalEntries: 10,
        hitRate: 85.5,
        missRate: 14.5,
        cachesByName: {
          'static-cache': { size: 1024, entries: 5 },
          'api-cache': { size: 1024, entries: 5 }
        }
      }

      const stats = new CacheStatistics(customData)

      expect(stats.totalSize).toBe(2048)
      expect(stats.totalEntries).toBe(10)
      expect(stats.hitRate).toBe(85.5)
      expect(stats.missRate).toBe(14.5)
      expect(Object.keys(stats.cachesByName)).toHaveLength(2)
    })

    it('test_cache_statistics_calculate_rates - 缓存统计计算命中率单元测试', () => {
      const stats = new CacheStatistics()
      
      stats.calculateRates(850, 150)

      expect(stats.hitRate).toBe(85)
      expect(stats.missRate).toBe(15)
    })

    it('test_cache_statistics_add_cache_info - 缓存统计添加缓存信息单元测试', () => {
      const stats = new CacheStatistics()
      
      stats.addCacheInfo('test-cache', 512, 3)

      expect(stats.cachesByName['test-cache']).toBeDefined()
      expect(stats.cachesByName['test-cache'].size).toBe(512)
      expect(stats.cachesByName['test-cache'].entries).toBe(3)
    })

    it('test_cache_statistics_get_cache_names - 缓存统计获取缓存名称单元测试', () => {
      const stats = new CacheStatistics({
        cachesByName: {
          'cache-1': { size: 100, entries: 1 },
          'cache-2': { size: 200, entries: 2 }
        }
      })

      const names = stats.getCacheNames()
      
      expect(names).toEqual(['cache-1', 'cache-2'])
    })
  })

  // =========================
  // Service Worker消息数据结构单元测试
  // =========================

  describe('ServiceWorkerMessage', () => {
    it('test_service_worker_message_creation - Service Worker消息创建单元测试', () => {
      const message = new ServiceWorkerMessage()

      expect(message.type).toBe('unknown')
      expect(message.payload).toEqual({})
      expect(message.timestamp).toBeInstanceOf(Date)
      expect(message.source).toBe('sw')
      expect(message.id).toBe('')
      expect(message.requiresResponse).toBe(false)
    })

    it('test_service_worker_message_with_custom_values - 自定义值Service Worker消息单元测试', () => {
      const customData = {
        type: 'cache-update',
        payload: { action: 'clear', cacheName: 'api-cache' },
        source: 'main-thread',
        id: 'msg-001',
        requiresResponse: true
      }

      const message = new ServiceWorkerMessage(customData)

      expect(message.type).toBe('cache-update')
      expect(message.payload.action).toBe('clear')
      expect(message.payload.cacheName).toBe('api-cache')
      expect(message.source).toBe('main-thread')
      expect(message.id).toBe('msg-001')
      expect(message.requiresResponse).toBe(true)
    })

    it('test_service_worker_message_validation - Service Worker消息验证单元测试', () => {
      const validMessage = new ServiceWorkerMessage({
        type: 'update',
        source: 'sw'
      })
      expect(validMessage.isValid()).toBe(true)

      const invalidMessage = new ServiceWorkerMessage({
        type: '',
        source: 'invalid-source'
      })
      expect(invalidMessage.isValid()).toBe(false)
    })

    it('test_service_worker_message_create_response - Service Worker消息创建响应单元测试', () => {
      const originalMessage = new ServiceWorkerMessage({
        type: 'request',
        id: 'req-001',
        requiresResponse: true
      })

      const response = originalMessage.createResponse({ success: true, data: 'result' })

      expect(response.type).toBe('response')
      expect(response.payload.success).toBe(true)
      expect(response.payload.data).toBe('result')
      expect(response.id).toBe('req-001')
    })

    it('test_service_worker_message_is_response - Service Worker消息响应检查单元测试', () => {
      const requestMessage = new ServiceWorkerMessage({ type: 'request' })
      const responseMessage = new ServiceWorkerMessage({ type: 'response' })

      expect(requestMessage.isResponse()).toBe(false)
      expect(responseMessage.isResponse()).toBe(true)
    })
  })

  // =========================
  // 数据类型集成测试
  // =========================

  describe('Data Types Integration', () => {
    it('test_types_interoperability - 类型互操作性单元测试', () => {
      const pwaState = new PWAState()
      const config = new PWAConfig()
      const swState = new ServiceWorkerState()
      const networkStatus = new NetworkStatus()

      // 验证类型之间可以正常交互
      pwaState.networkStatus = networkStatus.connectionType
      
      expect(pwaState.networkStatus).toBe(networkStatus.connectionType)
      expect(config.isValid()).toBe(true)
      expect(swState.isRegistered).toBe(false)
    })

    it('test_types_serialization - 类型序列化单元测试', () => {
      const state = new PWAState()
      const config = new PWAConfig()
      const error = new PWAError({ type: 'test', message: 'test error' })

      const stateJson = JSON.stringify(state)
      const configJson = JSON.stringify(config)
      const errorJson = JSON.stringify(error)

      expect(() => JSON.parse(stateJson)).not.toThrow()
      expect(() => JSON.parse(configJson)).not.toThrow()
      expect(() => JSON.parse(errorJson)).not.toThrow()
    })

    it('test_types_inheritance_and_composition - 类型继承和组合单元测试', () => {
      const stats = new CacheStatistics()
      const message = new ServiceWorkerMessage({
        type: 'cache-stats',
        payload: stats
      })

      expect(message.payload).toBeInstanceOf(CacheStatistics)
      expect(message.payload.totalSize).toBe(0)
    })
  })
}) 