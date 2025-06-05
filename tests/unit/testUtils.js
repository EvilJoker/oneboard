import { vi } from 'vitest'

// 标准测试数据集
export const STANDARD_TASKS = [
  {
    id: 'task-1',
    text: '完成单元测试',
    done: false,
    priority: 'high',
    createdAt: '2024-01-01T10:00:00Z',
    updatedAt: '2024-01-01T10:00:00Z'
  },
  {
    id: 'task-2',
    text: '代码审查',
    done: true,
    priority: 'medium',
    createdAt: '2024-01-01T11:00:00Z',
    updatedAt: '2024-01-01T12:00:00Z'
  },
  {
    id: 'task-3',
    text: '编写文档',
    done: false,
    priority: 'low',
    createdAt: '2024-01-01T13:00:00Z',
    updatedAt: '2024-01-01T13:00:00Z'
  }
]

// 边界测试数据
export const BOUNDARY_DATA = {
  emptyText: '',
  maxLengthText: 'A'.repeat(200),
  overLengthText: 'A'.repeat(201),
  invalidPriority: 'invalid',
  nullData: null,
  undefinedData: undefined,
  longText: 'A'.repeat(150),
  specialChars: '!@#$%^&*()_+{}[]|\\:";\'<>?,./',
  unicodeText: '测试任务🎯📝✅'
}

// 创建测试任务的工厂函数
export const createMockTask = (overrides = {}) => {
  return {
    id: `task-${Date.now()}-${Math.random()}`,
    text: '测试任务',
    done: false,
    priority: 'medium',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    ...overrides
  }
}

// 创建多个测试任务
export const createMockTasks = (count, baseOverrides = {}) => {
  return Array.from({ length: count }, (_, index) => 
    createMockTask({
      id: `task-${index + 1}`,
      text: `测试任务 ${index + 1}`,
      ...baseOverrides
    })
  )
}

// Mock localStorage
export const createMockLocalStorage = () => {
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
    key: vi.fn((index) => Object.keys(storage)[index] || null),
    _storage: storage // 内部访问存储数据
  }
}

// Mock useStorage composable
export const createMockUseStorage = (initialValue = null) => {
  const storedValue = { value: initialValue }
  return {
    storedValue,
    loading: { value: false },
    saving: { value: false },
    error: { value: null },
    isSupported: { value: true },
    save: vi.fn().mockResolvedValue(true),
    load: vi.fn().mockResolvedValue(initialValue),
    remove: vi.fn().mockResolvedValue(true),
    clear: vi.fn().mockResolvedValue(true),
    init: vi.fn()
  }
}

// 时间工具
export const timeUtils = {
  // 创建时间戳
  createTimestamp: (offsetMs = 0) => {
    return new Date(Date.now() + offsetMs).toISOString()
  },
  
  // 创建过期时间戳
  createExpiredTimestamp: (expiredMs = 1000) => {
    return new Date(Date.now() - expiredMs).toISOString()
  },
  
  // 比较时间差
  isTimeAfter: (time1, time2) => {
    return new Date(time1).getTime() > new Date(time2).getTime()
  }
}

// DOM测试工具
export const domUtils = {
  // 等待DOM更新
  waitForDOMUpdate: () => new Promise(resolve => setTimeout(resolve, 0)),
  
  // 触发键盘事件
  triggerKeyboard: async (element, key, modifiers = {}) => {
    const event = new KeyboardEvent('keydown', {
      key,
      code: key,
      ...modifiers
    })
    element.dispatchEvent(event)
    await domUtils.waitForDOMUpdate()
  },
  
  // 检查元素是否聚焦
  isFocused: (element) => {
    return document.activeElement === element
  }
}

// 异步测试工具
export const asyncUtils = {
  // 等待指定时间
  delay: (ms) => new Promise(resolve => setTimeout(resolve, ms)),
  
  // 等待条件满足
  waitFor: async (condition, timeout = 1000, interval = 10) => {
    const start = Date.now()
    while (Date.now() - start < timeout) {
      if (await condition()) {
        return true
      }
      await asyncUtils.delay(interval)
    }
    throw new Error(`Condition not met within ${timeout}ms`)
  },
  
  // 等待Promise解决
  waitForPromise: async (promiseFactory) => {
    return await promiseFactory()
  }
}

// 表单测试工具
export const formUtils = {
  // 填写表单
  fillForm: async (wrapper, formData) => {
    for (const [field, value] of Object.entries(formData)) {
      const input = wrapper.find(`[data-testid="${field}"]`)
      if (input.exists()) {
        await input.setValue(value)
        await input.trigger('input')
      }
    }
  },
  
  // 提交表单
  submitForm: async (wrapper, formSelector = '[data-testid="task-form"]') => {
    const form = wrapper.find(formSelector)
    await form.trigger('submit')
  },
  
  // 验证表单错误
  expectFormError: (wrapper, errorText, errorSelector = '[data-testid="form-error"]') => {
    const errorElement = wrapper.find(errorSelector)
    expect(errorElement.exists()).toBe(true)
    expect(errorElement.text()).toContain(errorText)
  }
}

// 组件测试工具
export const componentUtils = {
  // 等待组件更新
  waitForUpdate: async (wrapper) => {
    await wrapper.vm.$nextTick()
  },
  
  // 检查组件发出的事件
  expectEmitted: (wrapper, eventName, expectedPayload) => {
    expect(wrapper.emitted(eventName)).toBeTruthy()
    if (expectedPayload !== undefined) {
      expect(wrapper.emitted(eventName)[0]).toEqual(expectedPayload)
    }
  },
  
  // 检查组件未发出事件
  expectNotEmitted: (wrapper, eventName) => {
    expect(wrapper.emitted(eventName)).toBeFalsy()
  },
  
  // 验证props变化
  expectPropsChange: async (wrapper, props) => {
    await wrapper.setProps(props)
    await componentUtils.waitForUpdate(wrapper)
  }
}

// 存储测试工具
export const storageUtils = {
  // 创建存储数据
  createStorageData: (data, options = {}) => {
    return JSON.stringify({
      data,
      timestamp: Date.now(),
      expireAt: options.expireTime ? Date.now() + options.expireTime : null,
      ...options
    })
  },
  
  // 创建过期存储数据
  createExpiredStorageData: (data) => {
    return JSON.stringify({
      data,
      timestamp: Date.now() - 2000,
      expireAt: Date.now() - 1000
    })
  },
  
  // 创建损坏的存储数据
  createCorruptedStorageData: () => {
    return 'invalid json data {'
  }
}

// 性能测试工具
export const performanceUtils = {
  // 测量函数执行时间
  measureTime: async (fn) => {
    const start = performance.now()
    await fn()
    const end = performance.now()
    return end - start
  },
  
  // 测试内存使用
  measureMemory: () => {
    if (performance.memory) {
      return performance.memory.usedJSHeapSize
    }
    return null
  }
}

// 导出所有工具
export default {
  STANDARD_TASKS,
  BOUNDARY_DATA,
  createMockTask,
  createMockTasks,
  createMockLocalStorage,
  createMockUseStorage,
  timeUtils,
  domUtils,
  asyncUtils,
  formUtils,
  componentUtils,
  storageUtils,
  performanceUtils
} 