# 测试最佳实践指南

## 🎯 测试原则

### 1. 测试金字塔
```
    /\
   /  \     E2E Tests (少量)
  /____\
 /      \   Integration Tests (适量)
/__________\ Unit Tests (大量)
```

### 2. FIRST 原则
- **Fast**: 测试应该快速执行
- **Independent**: 测试之间应该独立
- **Repeatable**: 测试结果应该可重复
- **Self-Validating**: 测试应该有明确的通过/失败结果
- **Timely**: 测试应该及时编写

## 📝 编写规范

### 1. 测试命名
```javascript
// ✅ 好的命名
it('应该在用户点击提交按钮时触发submit事件', () => {})

// ❌ 不好的命名
it('test submit', () => {})
```

### 2. 测试结构 (AAA模式)
```javascript
it('应该正确处理用户输入', async () => {
  // Arrange: 准备测试数据和环境
  const wrapper = mount(Component, { props: { ... } })
  const testData = { name: 'test', url: 'https://test.com' }
  
  // Act: 执行被测试的操作
  await fillForm(wrapper, testData)
  await wrapper.find('[data-testid="submit"]').trigger('click')
  
  // Assert: 验证结果
  expect(wrapper.emitted('submit')).toBeTruthy()
  expect(wrapper.emitted('submit')[0][0]).toEqual(testData)
})
```

### 3. 使用测试工具函数
```javascript
import { fillForm, createMockLink, expectEventEmitted } from '../utils/testHelpers'

it('应该处理表单提交', async () => {
  const wrapper = mount(LinkForm, { props: { visible: true } })
  const mockData = createMockLink({ name: 'Test', url: 'https://test.com' })
  
  await fillForm(wrapper, mockData)
  await wrapper.find('[data-testid="submit"]').trigger('click')
  
  expectEventEmitted(wrapper, 'submit', mockData)
})
```

## 🔧 组件测试

### 1. Props 测试
```javascript
describe('Props验证', () => {
  it('应该正确接收必需的props', () => {
    const props = { link: createMockLink() }
    const wrapper = mount(LinkItem, { props })
    
    expect(wrapper.props('link')).toEqual(props.link)
  })
  
  it('应该为可选props提供默认值', () => {
    const wrapper = mount(LinkItem, { 
      props: { link: createMockLink() } 
    })
    
    expect(wrapper.props('showDelete')).toBe(true) // 默认值
  })
})
```

### 2. 事件测试
```javascript
describe('事件处理', () => {
  it('应该触发正确的事件', async () => {
    const wrapper = mount(Component)
    
    await wrapper.find('[data-testid="button"]').trigger('click')
    
    expect(wrapper.emitted('click')).toBeTruthy()
    expect(wrapper.emitted('click')).toHaveLength(1)
  })
})
```

### 3. 条件渲染测试
```javascript
describe('条件渲染', () => {
  it('应该根据props显示/隐藏元素', () => {
    const wrapper = mount(Component, { 
      props: { showElement: false } 
    })
    
    expect(wrapper.find('[data-testid="element"]').exists()).toBe(false)
  })
})
```

## 🎭 Mock 策略

### 1. 组合式函数 Mock
```javascript
vi.mock('../../../src/composables/useStorage.js', () => ({
  useStorage: vi.fn(() => createMockStorage())
}))
```

### 2. 外部依赖 Mock
```javascript
// 在 setup.js 中
Object.defineProperty(window, 'localStorage', {
  value: {
    getItem: vi.fn(),
    setItem: vi.fn(),
    removeItem: vi.fn(),
    clear: vi.fn()
  }
})
```

### 3. 动态 Mock
```javascript
beforeEach(() => {
  mockStorage.read.mockReturnValue(null)
  mockStorage.write.mockReturnValue(true)
})
```

## 🚀 性能优化

### 1. 避免不必要的DOM操作
```javascript
// ✅ 好的做法
const button = wrapper.find('[data-testid="submit"]')
expect(button.exists()).toBe(true)
expect(button.text()).toBe('提交')

// ❌ 不好的做法
expect(wrapper.find('[data-testid="submit"]').exists()).toBe(true)
expect(wrapper.find('[data-testid="submit"]').text()).toBe('提交')
```

### 2. 使用 data-testid
```javascript
// ✅ 稳定的选择器
wrapper.find('[data-testid="submit-button"]')

// ❌ 脆弱的选择器
wrapper.find('.btn.btn-primary')
wrapper.find('button:nth-child(2)')
```

### 3. 批量断言
```javascript
// ✅ 批量验证
const formData = { name: 'Test', url: 'https://test.com' }
expect(wrapper.emitted('submit')[0][0]).toEqual(formData)

// ❌ 分散验证
expect(wrapper.emitted('submit')[0][0].name).toBe('Test')
expect(wrapper.emitted('submit')[0][0].url).toBe('https://test.com')
```

## 🐛 调试技巧

### 1. 打印调试信息
```javascript
it('调试测试', () => {
  const wrapper = mount(Component)
  
  // 打印组件HTML
  console.log(wrapper.html())
  
  // 打印组件数据
  console.log(wrapper.vm.$data)
  
  // 打印触发的事件
  console.log(wrapper.emitted())
})
```

### 2. 使用测试UI
```bash
npm run test:ui
```

### 3. 单独运行测试
```bash
npm run test -- --run LinkForm.test.js
```

## 📊 覆盖率目标

### 目标指标
- **语句覆盖率**: ≥ 90%
- **分支覆盖率**: ≥ 80%
- **函数覆盖率**: ≥ 90%
- **行覆盖率**: ≥ 90%

### 覆盖率排除
```javascript
// vitest.config.js
coverage: {
  exclude: [
    'node_modules/',
    'tests/',
    '*.config.js',
    'src/main.js' // 应用入口文件
  ]
}
```

## 🔄 持续改进

### 1. 定期重构测试
- 消除重复代码
- 提取公共工具函数
- 优化测试性能

### 2. 监控测试质量
- 跟踪覆盖率变化
- 识别脆弱的测试
- 定期更新测试策略

### 3. 团队协作
- 代码审查包含测试
- 分享测试最佳实践
- 建立测试标准

---

*遵循这些最佳实践，确保测试代码的质量和可维护性* 