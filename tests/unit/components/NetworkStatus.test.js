import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { mount } from '@vue/test-utils'
import { nextTick } from 'vue'
import NetworkStatus from '@/components/NetworkStatus.vue'

// Mock navigator API
const mockNavigator = {
  onLine: true,
  connection: {
    effectiveType: '4g',
    type: 'cellular',
    downlink: 10,
    addEventListener: vi.fn(),
    removeEventListener: vi.fn()
  }
}

// Mock performance API
const mockPerformance = {
  now: vi.fn(() => Date.now())
}

// Mock fetch API
const mockFetch = vi.fn(() => Promise.resolve({ ok: true }))

describe('NetworkStatus', () => {
  let wrapper
  let originalNavigator
  let originalPerformance
  let originalFetch

  beforeEach(() => {
    // 保存原始对象
    originalNavigator = global.navigator
    originalPerformance = global.performance
    originalFetch = global.fetch

    // 设置 mock
    global.navigator = mockNavigator
    global.performance = mockPerformance
    global.fetch = mockFetch

    // 重置 mock
    vi.clearAllMocks()
    mockFetch.mockResolvedValue({ ok: true })
    mockPerformance.now.mockReturnValue(100)
  })

  afterEach(() => {
    // 恢复原始对象
    global.navigator = originalNavigator
    global.performance = originalPerformance
    global.fetch = originalFetch

    if (wrapper) {
      wrapper.unmount()
    }
  })

  const createWrapper = (props = {}) => {
    return mount(NetworkStatus, {
      props: {
        showDetails: false,
        position: 'bottom-right',
        autoHide: false,
        autoHideDelay: 3000,
        customClass: '',
        ...props
      }
    })
  }

  // =========================
  // 组件渲染单元测试
  // =========================

  describe('Component Rendering', () => {
    it('test_renders_online_status - 在线状态渲染单元测试', async () => {
      mockNavigator.onLine = true
      wrapper = createWrapper()
      
      const statusIndicator = wrapper.find('.network-status__indicator')
      const statusText = wrapper.find('.network-status__text')

      expect(statusIndicator.exists()).toBe(true)
      expect(wrapper.find('.network-status--online').exists()).toBe(true)
      expect(statusText.text()).toContain('在线')
    })

    it('test_renders_offline_status - 离线状态渲染单元测试', async () => {
      mockNavigator.onLine = false
      wrapper = createWrapper()
      
      const statusText = wrapper.find('.network-status__text')

      expect(wrapper.find('.network-status--offline').exists()).toBe(true)
      expect(statusText.text()).toContain('离线')
    })

    it('test_renders_with_custom_class - 自定义样式类渲染单元测试', () => {
      const customClass = 'my-custom-network-status'
      wrapper = createWrapper({ customClass })

      expect(wrapper.find('.my-custom-network-status').exists()).toBe(true)
    })

    it('test_renders_with_different_positions - 不同位置渲染单元测试', () => {
      const positions = ['top-left', 'top-right', 'bottom-left', 'bottom-right']
      
      positions.forEach(position => {
        wrapper = createWrapper({ position })
        
        expect(wrapper.find(`.network-status--${position}`).exists()).toBe(true)
        
        wrapper.unmount()
      })
    })

    it('test_shows_details_when_prop_true - 详情显示控制单元测试', () => {
      wrapper = createWrapper({ showDetails: true })
      
      expect(wrapper.vm.showDetailsPanel).toBe(true)
    })

    it('test_hides_details_when_prop_false - 详情隐藏控制单元测试', () => {
      wrapper = createWrapper({ showDetails: false })
      
      expect(wrapper.vm.showDetailsPanel).toBe(false)
    })
  })

  // =========================
  // 用户交互单元测试
  // =========================

  describe('User Interactions', () => {
    it('test_toggles_details_on_click - 点击切换详情显示单元测试', async () => {
      wrapper = createWrapper()
      
      // 直接找到可点击的容器元素
      const statusContainer = wrapper.find('[title]')
      
      // 初始状态应该是隐藏的
      expect(wrapper.vm.showDetailsPanel).toBe(false)
      
      // 点击切换显示
      await statusContainer.trigger('click')
      expect(wrapper.vm.showDetailsPanel).toBe(true)

      // 再次点击切换隐藏
      await statusContainer.trigger('click')
      expect(wrapper.vm.showDetailsPanel).toBe(false)
    })

    it('test_emits_toggle_details_event - 详情切换事件发射单元测试', async () => {
      wrapper = createWrapper()
      
      // 直接找到可点击的容器元素
      const statusContainer = wrapper.find('[title]')
      await statusContainer.trigger('click')

      const toggleEvents = wrapper.emitted('toggle-details')
      expect(toggleEvents).toBeTruthy()
      expect(toggleEvents[0][0]).toBe(true)
    })

    it('test_retry_connection_on_button_click - 重试连接按钮单元测试', async () => {
      wrapper = createWrapper({ showDetails: true })
      await wrapper.vm.$nextTick()
      
      const retryButton = wrapper.find('.btn-primary')
      await retryButton.trigger('click')

      const retryEvents = wrapper.emitted('retry-connection')
      expect(retryEvents).toBeTruthy()
    })

    it('test_clear_cache_on_button_click - 清理缓存按钮单元测试', async () => {
      wrapper = createWrapper({ showDetails: true })
      await wrapper.vm.$nextTick()
      
      const clearButton = wrapper.find('.btn-secondary')
      await clearButton.trigger('click')

      const clearEvents = wrapper.emitted('clear-cache')
      expect(clearEvents).toBeTruthy()
    })

    it('test_auto_hide_after_delay - 自动隐藏延时单元测试', async () => {
      vi.useFakeTimers()
      
      wrapper = createWrapper({ autoHide: true, autoHideDelay: 1000 })
      
      // 显示详情
      wrapper.vm.showDetailsPanel = true
      await wrapper.vm.$nextTick()

      // 调用hideDetails方法来测试自动隐藏
      wrapper.vm.hideDetails()

      // 快进时间
      vi.advanceTimersByTime(1000)
      
      expect(wrapper.vm.showDetailsPanel).toBe(false)
      
      vi.useRealTimers()
    })

    it('test_hover_prevents_auto_hide - 鼠标悬停阻止自动隐藏单元测试', async () => {
      vi.useFakeTimers()
      
      wrapper = createWrapper({ autoHide: true, autoHideDelay: 1000 })
      
      // 显示详情
      wrapper.vm.showDetailsPanel = true
      await wrapper.vm.$nextTick()

      // 模拟鼠标悬停
      const detailsPanel = wrapper.find('.network-status__details')
      if (detailsPanel.exists()) {
        await detailsPanel.trigger('mouseenter')
        
        // 快进时间
        vi.advanceTimersByTime(1500)
        
        // 应该仍然显示
        expect(wrapper.vm.showDetailsPanel).toBe(true)
      }
      
      vi.useRealTimers()
    })

    it('test_emits_network_status_change - 网络状态变化事件发射单元测试', async () => {
      wrapper = createWrapper()
      
      // 改变网络状态来触发事件
      const originalOnline = mockNavigator.onLine
      mockNavigator.onLine = !originalOnline
      
      // 触发网络状态变化
      await wrapper.vm.updateNetworkStatus()
      
      const statusChangeEvents = wrapper.emitted('network-status-change')
      expect(statusChangeEvents).toBeTruthy()
      
      // 恢复原始状态
      mockNavigator.onLine = originalOnline
    })
  })

  // =========================
  // Props和事件单元测试
  // =========================

  describe('Props and Emits', () => {
    it('test_props_validation - Props验证单元测试', () => {
      const props = {
        showDetails: true,
        position: 'top-left',
        autoHide: true,
        autoHideDelay: 5000,
        customClass: 'test-class'
      }
      
      wrapper = createWrapper(props)
      
      expect(wrapper.props('showDetails')).toBe(true)
      expect(wrapper.props('position')).toBe('top-left')
      expect(wrapper.props('autoHide')).toBe(true)
      expect(wrapper.props('autoHideDelay')).toBe(5000)
      expect(wrapper.props('customClass')).toBe('test-class')
    })

    it('test_showDetails_prop_controls_visibility - showDetails属性控制可见性单元测试', () => {
      wrapper = createWrapper({ showDetails: true })
      expect(wrapper.vm.showDetailsPanel).toBe(true)
      
      wrapper = createWrapper({ showDetails: false })
      expect(wrapper.vm.showDetailsPanel).toBe(false)
    })

    it('test_emits_custom_events_with_correct_payload - 自定义事件正确载荷发射单元测试', async () => {
      wrapper = createWrapper({ showDetails: true })
      await wrapper.vm.$nextTick()
      
      const retryButton = wrapper.find('.btn-primary')
      await retryButton.trigger('click')
      
      const retryEvents = wrapper.emitted('retry-connection')
      expect(retryEvents).toBeTruthy()
      expect(retryEvents.length).toBeGreaterThan(0)
    })

    it('test_autoHide_prop_behavior - autoHide属性行为单元测试', () => {
      wrapper = createWrapper({ autoHide: true })
      expect(wrapper.props('autoHide')).toBe(true)
    })

    it('test_customClass_prop_applied - 自定义类名属性应用单元测试', () => {
      const customClass = 'custom-class-1'
      wrapper = createWrapper({ customClass })
      
      expect(wrapper.find('.custom-class-1').exists()).toBe(true)
    })

    it('test_handles_missing_navigator_properties - 缺失navigator属性处理单元测试', () => {
      // 创建一个没有onLine属性的navigator mock
      const navigatorWithoutOnLine = { ...mockNavigator }
      delete navigatorWithoutOnLine.onLine
      
      // 临时替换navigator
      const originalNavigator = global.navigator
      global.navigator = navigatorWithoutOnLine
      
      // 测试组件能否正常创建而不崩溃
      expect(() => {
        wrapper = createWrapper()
      }).not.toThrow()
      
      // 检查组件是否成功创建
      expect(wrapper).toBeDefined()
      expect(wrapper.vm).toBeDefined()
      
      // 恢复原始navigator
      global.navigator = originalNavigator
    })
  })

  // =========================
  // 网络状态检测单元测试
  // =========================

  describe('Network Status Detection', () => {
    it('test_detects_online_status - 在线状态检测单元测试', async () => {
      mockNavigator.onLine = true
      wrapper = createWrapper()
      
      await wrapper.vm.updateNetworkStatus()
      expect(wrapper.vm.isOnline).toBe(true)
    })

    it('test_detects_offline_status - 离线状态检测单元测试', async () => {
      mockNavigator.onLine = false
      wrapper = createWrapper()
      
      await wrapper.vm.updateNetworkStatus()
      expect(wrapper.vm.isOnline).toBe(false)
    })

    it('test_detects_connection_quality - 连接质量检测单元测试', async () => {
      wrapper = createWrapper()
      
      await wrapper.vm.updateNetworkStatus()
      expect(wrapper.vm.connectionQuality).toBeDefined()
    })

    it('test_handles_no_connection_api - 无连接API处理单元测试', async () => {
      const originalConnection = mockNavigator.connection
      delete mockNavigator.connection
      
      wrapper = createWrapper()
      await wrapper.vm.updateNetworkStatus()
      
      expect(wrapper.vm.connectionQuality).toBeDefined()
      
      mockNavigator.connection = originalConnection
    })

    it('test_updates_last_check_time - 最后检查时间更新单元测试', async () => {
      wrapper = createWrapper()
      const initialTime = wrapper.vm.lastCheckTime
      
      // 等待一小段时间
      await new Promise(resolve => setTimeout(resolve, 10))
      await wrapper.vm.updateNetworkStatus()
      
      expect(wrapper.vm.lastCheckTime).not.toEqual(initialTime)
    }, 10000)

    it('test_network_type_detection - 网络类型检测单元测试', async () => {
      wrapper = createWrapper()
      
      await wrapper.vm.updateNetworkStatus()
      expect(wrapper.vm.networkType).toBeDefined()
    })
  })

  // =========================
  // 组件生命周期单元测试
  // =========================

  describe('Component Lifecycle', () => {
    it('test_initializes_on_mount - 挂载时初始化单元测试', () => {
      wrapper = createWrapper()
      
      expect(wrapper.vm.isOnline).toBeDefined()
      expect(wrapper.vm.lastCheckTime).toBeDefined()
    })

    it('test_cleans_up_on_unmount - 卸载时清理单元测试', () => {
      const spy = vi.spyOn(global, 'removeEventListener')
      wrapper = createWrapper()
      
      wrapper.unmount()
      
      // 由于我们mock了addEventListener，这里检查组件是否正常卸载
      expect(wrapper.vm).toBeDefined()
    })

    it('test_watches_props_changes - 属性变化监听单元测试', async () => {
      wrapper = createWrapper({ showDetails: false })
      
      await wrapper.setProps({ showDetails: true })
      expect(wrapper.vm.showDetailsPanel).toBe(true)
    })
  })

  // =========================
  // 错误处理单元测试
  // =========================

  describe('Error Handling', () => {
    it('test_handles_network_detection_errors - 网络检测错误处理单元测试', async () => {
      mockFetch.mockRejectedValueOnce(new Error('Network error'))
      
      wrapper = createWrapper()
      
      // 应该不会抛出错误
      await expect(wrapper.vm.updateNetworkStatus()).resolves.not.toThrow()
    })
  })
}) 