# Quick Link Management 测试文档

## 概述

本项目采用 **Vitest** 作为测试框架，配合 **Vue Test Utils** 进行 Vue 组件测试。测试覆盖了所有核心功能，包括组件、组合式函数和工具函数。

## 测试结构

```
tests/
├── setup.js                    # 测试环境配置
├── utils/                      # 测试工具函数
│   └── testHelpers.js          # 通用测试辅助函数
└── unit/                       # 单元测试
    ├── components/              # 组件测试
    │   ├── LinkForm.test.js     # 链接表单组件测试
    │   └── LinkItem.test.js     # 链接项组件测试
    └── composables/             # 组合式函数测试
        ├── useLinks.test.js     # 链接管理测试
        └── useStorage.test.js   # 存储管理测试
```

## 测试覆盖率

当前测试覆盖率：

| 文件 | 语句覆盖率 | 分支覆盖率 | 函数覆盖率 | 行覆盖率 |
|------|------------|------------|------------|----------|
| LinkForm.vue | 96.02% | 85.45% | 92.85% | 96.02% |
| LinkItem.vue | 97.2% | 71.42% | 100% | 97.2% |
| useLinks.js | 94.93% | 77.14% | 100% | 94.93% |
| useStorage.js | 94.89% | 84.61% | 100% | 94.89% |
| defaultLinks.js | 96.22% | 100% | 0% | 96.22% |

**总体覆盖率**: 95%+ 🎯

## 运行测试

### 使用 npm 脚本

```bash
# 运行所有测试
npm run test:run

# 监听模式运行测试
npm run test

# 启动测试UI界面
npm run test:ui

# 生成测试覆盖率报告
npm run test:coverage
```

### 使用测试脚本

```bash
# 运行所有测试
./scripts/test.sh

# 监听模式
./scripts/test.sh watch

# 测试UI界面
./scripts/test.sh ui

# 覆盖率报告
./scripts/test.sh coverage

# 查看帮助
./scripts/test.sh help
```

## 测试类型

### 1. 组件测试

#### LinkForm 组件测试
- ✅ 组件渲染测试
- ✅ 编辑模式测试
- ✅ 表单验证测试
- ✅ 表单提交测试
- ✅ 表单取消测试
- ✅ 实时验证测试

#### LinkItem 组件测试
- ✅ 组件渲染测试
- ✅ Props 验证测试
- ✅ 事件处理测试
- ✅ 条件渲染测试
- ✅ 图标显示测试

### 2. 组合式函数测试

#### useStorage 测试
- ✅ 数据读取测试
- ✅ 数据写入测试
- ✅ 数据删除测试
- ✅ 错误处理测试
- ✅ 边界情况测试

#### useLinks 测试
- ✅ 链接列表管理测试
- ✅ 添加链接测试
- ✅ 更新链接测试
- ✅ 删除链接测试
- ✅ 搜索功能测试
- ✅ 数据持久化测试

## 测试配置

### Vitest 配置 (`vitest.config.js`)

```javascript
import { defineConfig } from 'vitest/config'
import vue from '@vitejs/plugin-vue'
import { resolve } from 'path'

export default defineConfig({
  plugins: [vue()],
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: ['./tests/setup.js'],
    // 性能优化配置
    pool: 'threads',
    poolOptions: {
      threads: { singleThread: true }
    },
    // 覆盖率配置
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html'],
      exclude: ['node_modules/', 'tests/', '*.config.js', 'src/main.js']
    }
  },
  resolve: {
    alias: { '@': resolve(__dirname, './src') }
  }
})
```

### 测试环境配置 (`tests/setup.js`)

- 配置全局测试环境
- Mock localStorage 和 window.open
- 设置测试前的清理工作

### 测试工具函数 (`tests/utils/testHelpers.js`)

提供常用的测试辅助函数：
- `waitForUpdate()` - 等待Vue组件更新
- `createMockLink()` - 创建模拟链接数据
- `fillForm()` - 模拟表单输入
- `expectEventEmitted()` - 验证事件触发
- `createMockStorage()` - 创建模拟存储

## 最佳实践

### 1. 测试命名规范
- 使用描述性的测试名称
- 采用 "应该..." 的格式
- 按功能模块分组

### 2. 测试结构
- **Arrange**: 准备测试数据和环境
- **Act**: 执行被测试的操作
- **Assert**: 验证结果

### 3. Mock 策略
- 对外部依赖进行 Mock
- 保持 Mock 的简单性
- 在每个测试前重置 Mock

### 4. 异步测试
- 使用 `async/await` 处理异步操作
- 等待 DOM 更新完成
- 正确处理 Promise 和事件

📖 **详细指南**: 查看 [测试最佳实践指南](./testing-best-practices.md)

## 持续集成

测试可以集成到 CI/CD 流程中：

```yaml
# GitHub Actions 示例
- name: Run Tests
  run: npm run test:run

- name: Generate Coverage
  run: npm run test:coverage
```

## 故障排除

### 常见问题

1. **测试超时**
   - 检查异步操作是否正确等待
   - 增加测试超时时间

2. **DOM 元素找不到**
   - 确保使用正确的 `data-testid`
   - 等待 DOM 更新完成

3. **Mock 不生效**
   - 检查 Mock 的设置时机
   - 确保在正确的作用域内

### 调试技巧

```javascript
// 打印组件 HTML
console.log(wrapper.html())

// 打印触发的事件
console.log(wrapper.emitted())

// 检查组件状态
console.log(wrapper.vm.$data)
```

## 扩展测试

添加新测试时，请遵循以下步骤：

1. 在相应目录创建测试文件
2. 导入必要的测试工具
3. 编写测试用例
4. 运行测试确保通过
5. 更新文档

## 质量指标

### 覆盖率目标
- **语句覆盖率**: ≥ 90% ✅
- **分支覆盖率**: ≥ 80% ✅
- **函数覆盖率**: ≥ 90% ✅
- **行覆盖率**: ≥ 90% ✅

### 测试质量
- **52个测试用例** 全部通过 ✅
- **零测试失败** ✅
- **快速执行** (< 5秒) ✅

---

*最后更新: 2024年* 