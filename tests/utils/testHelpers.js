/**
 * 测试工具函数
 * 提供常用的测试辅助方法
 */

/**
 * 等待Vue组件更新完成
 * @param {import('@vue/test-utils').VueWrapper} wrapper - Vue组件包装器
 * @param {number} timeout - 超时时间（毫秒）
 */
export const waitForUpdate = async (wrapper, timeout = 100) => {
  await wrapper.vm.$nextTick()
  await new Promise(resolve => setTimeout(resolve, timeout))
}

/**
 * 创建模拟链接数据
 * @param {Partial<Link>} overrides - 覆盖的属性
 * @returns {Link} 模拟链接对象
 */
export const createMockLink = (overrides = {}) => ({
  id: 'mock-id',
  name: 'Mock Link',
  url: 'https://mock.com',
  icon: 'mock-icon',
  ...overrides
})

/**
 * 创建多个模拟链接
 * @param {number} count - 链接数量
 * @param {Partial<Link>} baseProps - 基础属性
 * @returns {Link[]} 模拟链接数组
 */
export const createMockLinks = (count = 3, baseProps = {}) => {
  return Array.from({ length: count }, (_, index) => 
    createMockLink({
      id: `mock-${index + 1}`,
      name: `Mock Link ${index + 1}`,
      url: `https://mock${index + 1}.com`,
      ...baseProps
    })
  )
}

/**
 * 模拟表单输入
 * @param {import('@vue/test-utils').VueWrapper} wrapper - 组件包装器
 * @param {Object} formData - 表单数据
 */
export const fillForm = async (wrapper, formData) => {
  for (const [field, value] of Object.entries(formData)) {
    const input = wrapper.find(`[data-testid="${field}-input"]`)
    if (input.exists()) {
      await input.setValue(value)
      await input.trigger('input')
    }
  }
  await waitForUpdate(wrapper)
}

/**
 * 验证事件触发
 * @param {import('@vue/test-utils').VueWrapper} wrapper - 组件包装器
 * @param {string} eventName - 事件名称
 * @param {any} expectedPayload - 期望的事件载荷
 */
export const expectEventEmitted = (wrapper, eventName, expectedPayload = undefined) => {
  const emitted = wrapper.emitted(eventName)
  expect(emitted).toBeTruthy()
  
  if (expectedPayload !== undefined) {
    const lastEmission = emitted[emitted.length - 1]
    if (Array.isArray(expectedPayload)) {
      expect(lastEmission).toEqual(expectedPayload)
    } else {
      expect(lastEmission[0]).toEqual(expectedPayload)
    }
  }
}

/**
 * 检查元素是否可见
 * @param {import('@vue/test-utils').DOMWrapper} element - DOM元素包装器
 * @returns {boolean} 是否可见
 */
export const isElementVisible = (element) => {
  if (!element.exists()) return false
  
  const style = element.attributes('style') || ''
  const classes = element.classes()
  
  // 检查常见的隐藏方式
  return !style.includes('display: none') && 
         !style.includes('visibility: hidden') &&
         !classes.includes('hidden')
}

/**
 * 模拟异步操作
 * @param {number} delay - 延迟时间（毫秒）
 * @returns {Promise<void>}
 */
export const delay = (delay = 100) => new Promise(resolve => setTimeout(resolve, delay))

/**
 * 创建模拟存储
 * @returns {Object} 模拟存储对象
 */
export const createMockStorage = () => ({
  read: vi.fn(),
  write: vi.fn(() => true),
  clear: vi.fn(() => true),
  isVersionCompatible: vi.fn(() => true)
}) 