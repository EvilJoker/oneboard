/**
 * 测试环境设置文件
 * 配置全局测试环境和模拟对象
 */

import { vi } from 'vitest'

// ========================
// 全局测试环境设置
// ========================

// Mock console方法避免测试时输出大量日志
global.console = {
  ...console,
  log: vi.fn(),
  debug: vi.fn(),
  info: vi.fn(),
  warn: vi.fn(),
  error: vi.fn(),
}

// ========================
// 浏览器API Mock设置
// ========================

// Mock localStorage
const localStorageMock = {
  getItem: vi.fn(),
  setItem: vi.fn(),
  removeItem: vi.fn(),
  clear: vi.fn(),
  length: 0,
  key: vi.fn(),
}

Object.defineProperty(window, 'localStorage', {
  value: localStorageMock,
  writable: true,
})

// Mock sessionStorage
const sessionStorageMock = {
  getItem: vi.fn(),
  setItem: vi.fn(),
  removeItem: vi.fn(),
  clear: vi.fn(),
  length: 0,
  key: vi.fn(),
}

Object.defineProperty(window, 'sessionStorage', {
  value: sessionStorageMock,
  writable: true,
})

// Mock location
Object.defineProperty(window, 'location', {
  value: {
    href: 'http://localhost:3000/',
    origin: 'http://localhost:3000',
    protocol: 'http:',
    host: 'localhost:3000',
    hostname: 'localhost',
    port: '3000',
    pathname: '/',
    search: '',
    hash: '',
    reload: vi.fn(),
    assign: vi.fn(),
    replace: vi.fn(),
  },
  writable: true,
})

// Mock window.open
Object.defineProperty(window, 'open', {
  value: vi.fn().mockReturnValue({
    focus: vi.fn(),
    close: vi.fn(),
    closed: false,
    location: { href: '' }
  }),
  writable: true,
})

// Mock navigator
Object.defineProperty(window, 'navigator', {
  value: {
    userAgent: 'Mozilla/5.0 (Test Browser)',
    language: 'zh-CN',
    languages: ['zh-CN', 'en-US'],
    onLine: true,
    platform: 'Test Platform',
    cookieEnabled: true,
    doNotTrack: null,
    connection: {
      effectiveType: '4g',
      downlink: 10,
      rtt: 100,
      saveData: false,
    },
    permissions: {
      query: vi.fn().mockResolvedValue({ state: 'granted' }),
    },
    serviceWorker: {
      register: vi.fn(),
      ready: Promise.resolve({
        update: vi.fn(),
        unregister: vi.fn(),
        postMessage: vi.fn(),
      }),
      controller: {
        postMessage: vi.fn(),
      },
    },
  },
  writable: true,
})

// Mock Notification API
Object.defineProperty(window, 'Notification', {
  value: class MockNotification {
    constructor(title, options = {}) {
      this.title = title
      this.options = options
      this.onclick = null
      this.onshow = null
      this.onclose = null
      this.onerror = null
    }
    
    static permission = 'default'
    static requestPermission = vi.fn().mockResolvedValue('granted')
    
    close() {
      if (this.onclose) this.onclose()
    }
  },
  writable: true,
})

// Mock caches API
Object.defineProperty(window, 'caches', {
  value: {
    open: vi.fn(),
    delete: vi.fn(),
    keys: vi.fn().mockResolvedValue([]),
    match: vi.fn(),
    has: vi.fn(),
  },
  writable: true,
})

// Mock fetch API
Object.defineProperty(window, 'fetch', {
  value: vi.fn().mockResolvedValue({
    ok: true,
    status: 200,
    statusText: 'OK',
    json: vi.fn().mockResolvedValue({}),
    text: vi.fn().mockResolvedValue(''),
    blob: vi.fn().mockResolvedValue(new Blob()),
    headers: new Map(),
  }),
  writable: true,
})

// Mock URL API
Object.defineProperty(window, 'URL', {
  value: class MockURL {
    constructor(url, base) {
      // 验证URL格式 - 与原生URL构造函数行为一致
      if (typeof url !== 'string') {
        throw new TypeError('Failed to construct \'URL\': parameter 1 is not of type \'string\'.')
      }
      
      // 基本URL格式验证
      if (base !== undefined && typeof base !== 'string') {
        throw new TypeError('Failed to construct \'URL\': parameter 2 is not of type \'string\'.')
      }
      
      // 简单的URL格式验证
      const urlPattern = /^https?:\/\/[^\s$.?#].[^\s]*$/i
      
      if (base) {
        // 如果有base URL，尝试解析相对URL
        if (!urlPattern.test(base)) {
          throw new TypeError(`Failed to construct 'URL': Invalid base URL: ${base}`)
        }
        if (url.startsWith('/') || url.startsWith('./') || url.startsWith('../')) {
          this.href = base.replace(/\/$/, '') + '/' + url.replace(/^\.?\//, '')
        } else if (urlPattern.test(url)) {
          this.href = url
        } else {
          throw new TypeError(`Failed to construct 'URL': Invalid URL: ${url}`)
        }
      } else {
        // 绝对URL验证
        if (!urlPattern.test(url)) {
          throw new TypeError(`Failed to construct 'URL': Invalid URL: ${url}`)
        }
        this.href = url
      }
      
      // 解析URL组件
      try {
        const parsed = this.href.match(/^(https?):\/\/([^\/]+)(\/.*)?$/)
        if (!parsed) {
          throw new Error('Invalid URL format')
        }
        
        this.protocol = parsed[1] + ':'
        this.host = parsed[2]
        this.pathname = parsed[3] || '/'
        
        const hostParts = this.host.split(':')
        this.hostname = hostParts[0]
        this.port = hostParts[1] || ''
        
        this.origin = `${this.protocol}//${this.hostname}${this.port ? ':' + this.port : ''}`
        this.search = ''
        this.hash = ''
      } catch (error) {
        throw new TypeError(`Failed to construct 'URL': Invalid URL: ${url}`)
      }
    }
    
    toString() {
      return this.href
    }
    
    static createObjectURL = vi.fn().mockReturnValue('blob:http://localhost:3000/test')
    static revokeObjectURL = vi.fn()
  },
  writable: true,
})

// Mock WebSocket
Object.defineProperty(window, 'WebSocket', {
  value: class MockWebSocket {
    constructor(url) {
      this.url = url
      this.readyState = WebSocket.CONNECTING
      this.onopen = null
      this.onclose = null
      this.onmessage = null
      this.onerror = null
      
      setTimeout(() => {
        this.readyState = WebSocket.OPEN
        if (this.onopen) this.onopen()
      }, 0)
    }
    
    static CONNECTING = 0
    static OPEN = 1
    static CLOSING = 2
    static CLOSED = 3
    
    send(data) {
      if (this.readyState === WebSocket.OPEN) {
        // 模拟发送成功
        return true
      }
      return false
    }
    
    close() {
      this.readyState = WebSocket.CLOSED
      if (this.onclose) this.onclose()
    }
  },
  writable: true,
})

// Mock MessageChannel
Object.defineProperty(window, 'MessageChannel', {
  value: class MockMessageChannel {
    constructor() {
      this.port1 = {
        onmessage: null,
        postMessage: vi.fn(),
        start: vi.fn(),
        close: vi.fn(),
      }
      this.port2 = {
        onmessage: null,
        postMessage: vi.fn(),
        start: vi.fn(),
        close: vi.fn(),
      }
    }
  },
  writable: true,
})

// ========================
// Vue测试工具设置
// ========================

// Mock Vue Router (如果使用)
export const mockRouter = {
  push: vi.fn(),
  replace: vi.fn(),
  go: vi.fn(),
  back: vi.fn(),
  forward: vi.fn(),
  currentRoute: {
    value: {
      path: '/',
      name: 'home',
      params: {},
      query: {},
      meta: {},
    },
  },
}

// Mock Pinia Store (如果使用)
export const mockStore = {
  state: {},
  getters: {},
  actions: {},
  commit: vi.fn(),
  dispatch: vi.fn(),
}

// ========================
// 测试工具函数
// ========================

/**
 * 等待异步操作完成
 * @param {number} ms 等待时间(毫秒)
 */
export const waitFor = (ms = 0) => new Promise(resolve => setTimeout(resolve, ms))

/**
 * 触发DOM事件
 * @param {Element} element DOM元素
 * @param {string} eventType 事件类型
 * @param {Object} eventData 事件数据
 */
export const triggerEvent = (element, eventType, eventData = {}) => {
  const event = new Event(eventType, { bubbles: true, cancelable: true, ...eventData })
  element.dispatchEvent(event)
}

/**
 * 模拟网络状态变化
 * @param {boolean} isOnline 是否在线
 */
export const mockNetworkStatus = (isOnline = true) => {
  Object.defineProperty(navigator, 'onLine', {
    value: isOnline,
    writable: true,
  })
  
  const event = new Event(isOnline ? 'online' : 'offline')
  window.dispatchEvent(event)
}

/**
 * 模拟Service Worker注册
 * @param {Object} registration 注册对象
 */
export const mockServiceWorkerRegistration = (registration = {}) => {
  const defaultRegistration = {
    scope: '/',
    active: { state: 'activated' },
    waiting: null,
    installing: null,
    update: vi.fn(),
    unregister: vi.fn(),
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
  }
  
  return { ...defaultRegistration, ...registration }
}

/**
 * 清理所有Mock状态
 */
export const cleanupMocks = () => {
  vi.clearAllMocks()
  
  // 重置localStorage
  localStorageMock.getItem.mockReturnValue(null)
  localStorageMock.setItem.mockClear()
  localStorageMock.removeItem.mockClear()
  localStorageMock.clear.mockClear()
  
  // 重置sessionStorage
  sessionStorageMock.getItem.mockReturnValue(null)
  sessionStorageMock.setItem.mockClear()
  sessionStorageMock.removeItem.mockClear()
  sessionStorageMock.clear.mockClear()
  
  // 重置navigator状态
  navigator.onLine = true
  
  // 重置fetch mock
  window.fetch.mockResolvedValue({
    ok: true,
    status: 200,
    statusText: 'OK',
    json: vi.fn().mockResolvedValue({}),
    text: vi.fn().mockResolvedValue(''),
    blob: vi.fn().mockResolvedValue(new Blob()),
    headers: new Map(),
  })
}

// ========================
// 测试生命周期钩子
// ========================

// 在每个测试之前运行
export const beforeEachTest = () => {
  cleanupMocks()
}

// 在每个测试之后运行
export const afterEachTest = () => {
  vi.restoreAllMocks()
}

// ========================
// PWA特定的Mock工具
// ========================

/**
 * 模拟beforeinstallprompt事件
 * @param {Object} eventData 事件数据
 */
export const mockBeforeInstallPrompt = (eventData = {}) => {
  const defaultEvent = {
    preventDefault: vi.fn(),
    prompt: vi.fn().mockResolvedValue({ outcome: 'accepted' }),
    userChoice: Promise.resolve({ outcome: 'accepted' }),
    platforms: ['web'],
  }
  
  const event = { ...defaultEvent, ...eventData }
  const beforeInstallPromptEvent = new Event('beforeinstallprompt')
  Object.assign(beforeInstallPromptEvent, event)
  
  window.dispatchEvent(beforeInstallPromptEvent)
  return event
}

/**
 * 模拟appinstalled事件
 */
export const mockAppInstalled = () => {
  const event = new Event('appinstalled')
  window.dispatchEvent(event)
}

/**
 * 模拟缓存响应
 * @param {string} url 请求URL
 * @param {Object} response 响应对象
 */
export const mockCacheResponse = (url, response = {}) => {
  const defaultResponse = {
    ok: true,
    status: 200,
    headers: new Map([['content-length', '1024']]),
    clone: vi.fn().mockReturnThis(),
    json: vi.fn().mockResolvedValue({}),
    text: vi.fn().mockResolvedValue(''),
  }
  
  const mockResponse = { ...defaultResponse, ...response }
  window.caches.match.mockImplementation((request) => {
    if (request === url || request.url === url) {
      return Promise.resolve(mockResponse)
    }
    return Promise.resolve(null)
  })
  
  return mockResponse
} 