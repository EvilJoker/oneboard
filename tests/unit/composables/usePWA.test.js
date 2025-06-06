import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { nextTick } from 'vue'
import { usePWA } from '@/composables/usePWA'

// Mock localStorage
const mockLocalStorage = {
  getItem: vi.fn(),
  setItem: vi.fn(),
  removeItem: vi.fn(),
  clear: vi.fn()
}
Object.defineProperty(window, 'localStorage', {
  value: mockLocalStorage,
  writable: true
})

// Mock navigator
const mockNavigator = {
  onLine: true,
  serviceWorker: {
    ready: Promise.resolve({
      update: vi.fn(),
      waiting: null,
      installing: null
    })
  }
}
Object.defineProperty(window, 'navigator', {
  value: mockNavigator,
  writable: true
})

// Mock BeforeInstallPromptEvent
const createMockDeferredPrompt = () => ({
  prompt: vi.fn().mockResolvedValue(undefined),
  userChoice: Promise.resolve({ outcome: 'accepted' })
})

describe('usePWA', () => {
  let pwaInstance
  let mockDeferredPrompt

  beforeEach(() => {
    vi.clearAllMocks()
    
    // Reset localStorage mocks
    mockLocalStorage.getItem.mockReturnValue(null)
    mockLocalStorage.setItem.mockImplementation(() => {})
    
    // Reset navigator
    mockNavigator.onLine = true
    
    // Create fresh instance
    pwaInstance = usePWA()
    mockDeferredPrompt = createMockDeferredPrompt()
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  // =========================
  // PWA安装管理单元测试
  // =========================

  describe('PWA Installation Management', () => {
    it('test_showInstallPrompt_success - 正常显示安装提示单元测试', async () => {
      // 模拟 beforeinstallprompt 事件来设置 deferredPrompt
      const beforeInstallPromptEvent = new CustomEvent('beforeinstallprompt')
      beforeInstallPromptEvent.preventDefault = vi.fn()
      beforeInstallPromptEvent.prompt = vi.fn().mockResolvedValue(undefined)
      beforeInstallPromptEvent.userChoice = Promise.resolve({ outcome: 'accepted' })
      
      // 先初始化 PWA 以设置事件监听器
      await pwaInstance.initializePWA()
      
      // 触发 beforeinstallprompt 事件
      window.dispatchEvent(beforeInstallPromptEvent)
      
      // 等待一个 tick 以确保事件处理器执行
      await new Promise(resolve => setTimeout(resolve, 0))

      const result = await pwaInstance.showInstallPrompt()

      expect(beforeInstallPromptEvent.prompt).toHaveBeenCalled()
      expect(result).toBe(true)
    })

    it('test_showInstallPrompt_no_deferred_prompt - 无可用安装提示时的单元测试', async () => {
      // 设置无可用安装提示
      pwaInstance.isInstallable.value = false

      const result = await pwaInstance.showInstallPrompt()

      expect(result).toBe(false)
    })

    it('test_showInstallPrompt_user_accepts - 用户接受安装提示单元测试', async () => {
      // 模拟 beforeinstallprompt 事件
      const beforeInstallPromptEvent = new CustomEvent('beforeinstallprompt')
      beforeInstallPromptEvent.preventDefault = vi.fn()
      beforeInstallPromptEvent.prompt = vi.fn().mockResolvedValue(undefined)
      beforeInstallPromptEvent.userChoice = Promise.resolve({ outcome: 'accepted' })
      
      // 先初始化 PWA 以设置事件监听器
      await pwaInstance.initializePWA()
      
      // 触发事件
      window.dispatchEvent(beforeInstallPromptEvent)
      await new Promise(resolve => setTimeout(resolve, 0))

      await pwaInstance.showInstallPrompt()

      expect(pwaInstance.isInstalled.value).toBe(true)
      expect(pwaInstance.isInstallable.value).toBe(false)
    })

    it('test_showInstallPrompt_user_cancels - 用户取消安装提示单元测试', async () => {
      // 模拟 beforeinstallprompt 事件
      const beforeInstallPromptEvent = new CustomEvent('beforeinstallprompt')
      beforeInstallPromptEvent.preventDefault = vi.fn()
      beforeInstallPromptEvent.prompt = vi.fn().mockResolvedValue(undefined)
      beforeInstallPromptEvent.userChoice = Promise.resolve({ outcome: 'dismissed' })
      
      // 先初始化 PWA 以设置事件监听器
      await pwaInstance.initializePWA()
      
      // 触发事件
      window.dispatchEvent(beforeInstallPromptEvent)
      await new Promise(resolve => setTimeout(resolve, 0))

      await pwaInstance.showInstallPrompt()

      expect(pwaInstance.isInstalled.value).toBe(false)
      expect(pwaInstance.installPromptDismissed.value).toBe(true)
    })

    it('test_dismissInstallPrompt_marks_dismissed - 忽略安装提示状态更新单元测试', () => {
      pwaInstance.dismissInstallPrompt()

      expect(pwaInstance.installPromptDismissed.value).toBe(true)
      expect(pwaInstance.isInstallable.value).toBe(false)
    })

    it('test_dismissInstallPrompt_saves_to_localStorage - 忽略状态持久化单元测试', () => {
      pwaInstance.dismissInstallPrompt()

      expect(mockLocalStorage.setItem).toHaveBeenCalledWith(
        'pwa_state',
        expect.stringContaining('"installPromptDismissed":true')
      )
    })
  })

  // =========================
  // PWA状态检测单元测试
  // =========================

  describe('PWA Status Detection', () => {
    it('test_checkForUpdates_has_update - 检测到应用更新单元测试', async () => {
      // Mock Service Worker registration with update
      const mockRegistration = {
        update: vi.fn().mockResolvedValue(undefined),
        waiting: { state: 'installed' },
        installing: null
      }
      mockNavigator.serviceWorker.ready = Promise.resolve(mockRegistration)

      const hasUpdate = await pwaInstance.checkForUpdates()

      expect(mockRegistration.update).toHaveBeenCalled()
      expect(hasUpdate).toBe(true)
      expect(pwaInstance.updateAvailable.value).toBe(true)
    })

    it('test_checkForUpdates_no_update - 无可用更新单元测试', async () => {
      // Mock Service Worker registration without update
      const mockRegistration = {
        update: vi.fn().mockResolvedValue(undefined),
        waiting: null,
        installing: null
      }
      mockNavigator.serviceWorker.ready = Promise.resolve(mockRegistration)

      const hasUpdate = await pwaInstance.checkForUpdates()

      expect(mockRegistration.update).toHaveBeenCalled()
      expect(hasUpdate).toBe(false)
      expect(pwaInstance.updateAvailable.value).toBe(false)
    })

    it('test_checkForUpdates_service_worker_not_registered - Service Worker未注册时的单元测试', async () => {
      // 临时删除 Service Worker 支持
      const originalServiceWorker = window.navigator.serviceWorker
      delete window.navigator.serviceWorker

      const hasUpdate = await pwaInstance.checkForUpdates()

      expect(hasUpdate).toBe(false)
      expect(pwaInstance.updateAvailable.value).toBe(false)
      
      // 恢复 Service Worker 支持
      window.navigator.serviceWorker = originalServiceWorker
    })

    it('test_enableNotifications_permission_granted - 通知权限授予单元测试', async () => {
      // Mock Notification API
      global.Notification = {
        permission: 'default',
        requestPermission: vi.fn().mockResolvedValue('granted')
      }

      const result = await pwaInstance.enableNotifications()

      expect(global.Notification.requestPermission).toHaveBeenCalled()
      expect(result).toBe(true)
      expect(pwaInstance.notificationEnabled.value).toBe(true)
    })

    it('test_enableNotifications_permission_denied - 通知权限拒绝单元测试', async () => {
      // Mock Notification API with denied permission
      global.Notification = {
        permission: 'default',
        requestPermission: vi.fn().mockResolvedValue('denied')
      }

      const result = await pwaInstance.enableNotifications()

      expect(global.Notification.requestPermission).toHaveBeenCalled()
      expect(result).toBe(false)
      expect(pwaInstance.notificationEnabled.value).toBe(false)
    })

    it('test_enableNotifications_not_supported - 通知不支持的单元测试', async () => {
      // 暂时保存原始的 Notification
      const originalNotification = global.Notification
      
      // 模拟通知不支持
      global.Notification = undefined

      const result = await pwaInstance.enableNotifications()

      expect(result).toBe(false)
      expect(pwaInstance.notificationEnabled.value).toBe(false)
      
      // 恢复原始的 Notification
      global.Notification = originalNotification
    })
  })

  // =========================
  // 网络状态管理单元测试
  // =========================

  describe('Network Status Management', () => {
    it('test_updateNetworkStatus_online_to_offline - 在线到离线状态变化单元测试', () => {
      // 初始在线状态
      pwaInstance.isOnline.value = true

      pwaInstance.updateNetworkStatus(false)

      expect(pwaInstance.isOnline.value).toBe(false)
      expect(pwaInstance.lastNetworkChange.value).toBeTruthy()
    })

    it('test_updateNetworkStatus_offline_to_online - 离线到在线状态变化单元测试', () => {
      // 初始离线状态
      pwaInstance.isOnline.value = false

      pwaInstance.updateNetworkStatus(true)

      expect(pwaInstance.isOnline.value).toBe(true)
      expect(pwaInstance.lastNetworkChange.value).toBeTruthy()
    })

    it('test_watchNetworkStatus_adds_listeners - 网络状态监听器添加单元测试', () => {
      const addEventListenerSpy = vi.spyOn(window, 'addEventListener')

      const cleanup = pwaInstance.watchNetworkStatus()

      expect(addEventListenerSpy).toHaveBeenCalledWith('online', expect.any(Function))
      expect(addEventListenerSpy).toHaveBeenCalledWith('offline', expect.any(Function))
      expect(typeof cleanup).toBe('function')

      addEventListenerSpy.mockRestore()
    })

    it('test_watchNetworkStatus_cleanup_function - 监听器清理函数单元测试', () => {
      const removeEventListenerSpy = vi.spyOn(window, 'removeEventListener')

      const cleanup = pwaInstance.watchNetworkStatus()
      cleanup()

      expect(removeEventListenerSpy).toHaveBeenCalledWith('online', expect.any(Function))
      expect(removeEventListenerSpy).toHaveBeenCalledWith('offline', expect.any(Function))

      removeEventListenerSpy.mockRestore()
    })

    it('test_updateNetworkStatus_same_status - 相同网络状态更新单元测试', async () => {
      const initialChangeTime = pwaInstance.lastNetworkChange.value

      // 增加延迟确保时间戳不同
      await new Promise(resolve => setTimeout(resolve, 50))

      // 更新为相同状态
      pwaInstance.updateNetworkStatus(true)

      // 时间戳应该更新
      expect(pwaInstance.isOnline.value).toBe(true)
      expect(pwaInstance.lastNetworkChange.value).not.toBe(initialChangeTime)
    })
  })

  // =========================
  // 状态持久化单元测试
  // =========================

  describe('State Persistence', () => {
    it('test_savePWAState_to_localStorage - PWA状态保存单元测试', () => {
      // 修改一些状态
      pwaInstance.isInstalled.value = true
      pwaInstance.installPromptDismissed.value = true

      pwaInstance.savePWAState()

      expect(mockLocalStorage.setItem).toHaveBeenCalledWith(
        'pwa_state',
        expect.stringContaining('"isInstalled":true')
      )
      expect(mockLocalStorage.setItem).toHaveBeenCalledWith(
        'pwa_state',
        expect.stringContaining('"installPromptDismissed":true')
      )
    })

    it('test_restorePWAState_from_localStorage - PWA状态恢复单元测试', () => {
      // Mock localStorage返回的数据
      const savedState = {
        isInstalled: true,
        installPromptDismissed: true,
        notificationEnabled: true,
        lastNetworkChange: '2024-12-20T10:00:00.000Z'
      }
      mockLocalStorage.getItem.mockReturnValue(JSON.stringify(savedState))

      pwaInstance.restorePWAState()

      expect(pwaInstance.isInstalled.value).toBe(true)
      expect(pwaInstance.installPromptDismissed.value).toBe(true)
      expect(pwaInstance.notificationEnabled.value).toBe(true)
      expect(pwaInstance.lastNetworkChange.value).toBe('2024-12-20T10:00:00.000Z')
    })

    it('test_restorePWAState_invalid_data - 无效数据恢复处理单元测试', () => {
      // Mock localStorage返回无效JSON
      mockLocalStorage.getItem.mockReturnValue('invalid json')

      // 记录初始状态
      const initialInstalled = pwaInstance.isInstalled.value
      const initialDismissed = pwaInstance.installPromptDismissed.value

      pwaInstance.restorePWAState()

      // 状态应该保持不变
      expect(pwaInstance.isInstalled.value).toBe(initialInstalled)
      expect(pwaInstance.installPromptDismissed.value).toBe(initialDismissed)
    })

    it('test_savePWAState_storage_error - 存储错误处理单元测试', () => {
      // Mock localStorage.setItem抛出错误
      mockLocalStorage.setItem.mockImplementation(() => {
        throw new Error('Storage quota exceeded')
      })

      // 应该不抛出异常
      expect(() => {
        pwaInstance.savePWAState()
      }).not.toThrow()
    })
  })

  // =========================
  // 初始化和生命周期单元测试
  // =========================

  describe('Initialization and Lifecycle', () => {
    it('test_initializePWA_sets_up_listeners - 初始化设置监听器单元测试', async () => {
      const addEventListenerSpy = vi.spyOn(window, 'addEventListener')

      await pwaInstance.initializePWA()

      expect(addEventListenerSpy).toHaveBeenCalledWith('beforeinstallprompt', expect.any(Function))
      expect(addEventListenerSpy).toHaveBeenCalledWith('appinstalled', expect.any(Function))

      addEventListenerSpy.mockRestore()
    })

    it('test_cleanupPWA_removes_listeners - 清理移除监听器单元测试', () => {
      const removeEventListenerSpy = vi.spyOn(window, 'removeEventListener')

      // 先初始化
      pwaInstance.initializePWA()
      // 然后清理
      pwaInstance.cleanupPWA()

      expect(removeEventListenerSpy).toHaveBeenCalledWith('beforeinstallprompt', expect.any(Function))
      expect(removeEventListenerSpy).toHaveBeenCalledWith('appinstalled', expect.any(Function))

      removeEventListenerSpy.mockRestore()
    })

    it('test_initializePWA_restores_state - 初始化恢复状态单元测试', async () => {
      const savedState = {
        isInstalled: true,
        installPromptDismissed: true
      }
      mockLocalStorage.getItem.mockReturnValue(JSON.stringify(savedState))

      await pwaInstance.initializePWA()

      expect(pwaInstance.isInstalled.value).toBe(true)
      expect(pwaInstance.installPromptDismissed.value).toBe(true)
    })
  })

  // =========================
  // 边界条件和错误处理单元测试
  // =========================

  describe('Edge Cases and Error Handling', () => {
    it('test_showInstallPrompt_prompt_error - 安装提示错误处理单元测试', async () => {
      // 模拟 beforeinstallprompt 事件，但 prompt 方法抛出错误
      const beforeInstallPromptEvent = new CustomEvent('beforeinstallprompt')
      beforeInstallPromptEvent.preventDefault = vi.fn()
      beforeInstallPromptEvent.prompt = vi.fn().mockRejectedValue(new Error('Prompt failed'))
      beforeInstallPromptEvent.userChoice = Promise.resolve({ outcome: 'accepted' })
      
      // 先初始化 PWA 以设置事件监听器
      await pwaInstance.initializePWA()
      
      // 触发事件
      window.dispatchEvent(beforeInstallPromptEvent)
      await new Promise(resolve => setTimeout(resolve, 0))

      const result = await pwaInstance.showInstallPrompt()

      expect(result).toBe(false)
      expect(beforeInstallPromptEvent.prompt).toHaveBeenCalled()
    })

    it('test_checkForUpdates_network_error - 更新检查网络错误单元测试', async () => {
      // Mock update方法抛出网络错误
      const mockRegistration = {
        update: vi.fn().mockRejectedValue(new Error('Network error'))
      }
      
      // 重新设置 navigator.serviceWorker
      const originalServiceWorker = mockNavigator.serviceWorker
      mockNavigator.serviceWorker = {
        ready: Promise.resolve(mockRegistration)
      }

      const hasUpdate = await pwaInstance.checkForUpdates()

      expect(hasUpdate).toBe(false)
      expect(pwaInstance.updateAvailable.value).toBe(false)
      
      // 恢复原始的 serviceWorker
      mockNavigator.serviceWorker = originalServiceWorker
    })
  })
}) 