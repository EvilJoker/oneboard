/**
 * 测试环境设置文件
 * 配置全局测试环境和模拟对象
 */

// 模拟 localStorage
const localStorageMock = {
  store: {},
  getItem: vi.fn((key) => localStorageMock.store[key] || null),
  setItem: vi.fn((key, value) => {
    localStorageMock.store[key] = value
  }),
  removeItem: vi.fn((key) => {
    delete localStorageMock.store[key]
  }),
  clear: vi.fn(() => {
    localStorageMock.store = {}
  })
}

// 模拟 window.open
const windowOpenMock = vi.fn()

// 设置全局对象
Object.defineProperty(window, 'localStorage', {
  value: localStorageMock
})

Object.defineProperty(window, 'open', {
  value: windowOpenMock
})

// 在每个测试前重置所有模拟对象
beforeEach(() => {
  // 重置 localStorage 模拟
  localStorageMock.store = {}
  localStorageMock.getItem.mockClear()
  localStorageMock.setItem.mockClear()
  localStorageMock.removeItem.mockClear()
  localStorageMock.clear.mockClear()
  
  // 重置 window.open 模拟
  windowOpenMock.mockClear()
}) 