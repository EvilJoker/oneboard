# OneBoard 系统架构设计文档 v1.2

## 📋 文档信息
- **项目名称**: OneBoard
- **文档版本**: v1.2
- **创建日期**: 2024-12-20
- **更新日期**: 2024-12-20
- **维护人员**: 项目团队
- **更新说明**: 修正实际目录结构，确保与代码实现一致性

---

## 1. 项目概述

### 1.1 项目介绍
- **项目名称**: OneBoard
- **项目描述**: 零后端依赖的个人仪表板，集成快捷链接管理和任务管理功能，支持PWA离线运行和独立应用安装
- **业务领域**: 个人效率工具
- **项目规模**: 中型项目
- **开发周期**: 3-6个月（迭代开发）
- **项目状态**: ✅ 已完成基础功能，🚧 PWA独立应用改造中

### 1.2 业务目标
- **核心价值**: 提供简洁高效的个人工作台，帮助用户管理常用链接和待办任务，支持桌面应用级别的用户体验
- **目标用户**: 需要高效管理个人工作流的知识工作者
- **主要功能**: 快捷链接管理、任务管理、数据本地存储、PWA离线支持、独立应用安装
- **预期成果**: 零配置即用的个人效率工具，支持完全离线运行和桌面应用体验

## 2. 技术架构

### 2.1 架构设计原则
- **可扩展性**: 模块化设计，支持功能模块的快速扩展
- **可维护性**: 组合式API + JavaScript，代码结构清晰
- **安全性**: 本地数据存储，无隐私泄露风险
- **性能性**: Vite构建优化，组件懒加载，虚拟滚动，PWA缓存优化
- **可用性**: PWA支持，离线可用，独立应用安装，零依赖部署

### 2.2 整体架构设计
```
OneBoard PWA 系统架构 v1.2
┌─────────────────────────────────────────────────────────────┐
│                   PWA应用层 (PWA Shell)                      │
├─────────────────────────────────────────────────────────────┤
│  前端应用层 (Vue 3)  │  PWA服务层 (Service Worker)          │
│  ──────────────────  │  ─────────────────────────────────   │
│  UI组件层:           │  缓存管理 (Workbox)                  │
│  ├─ LinkPanel       │  ├─ 静态资源缓存 (precache)          │
│  ├─ LinkItem        │  ├─ 运行时缓存 (runtime)             │
│  ├─ LinkForm        │  └─ 离线回退 (offline fallback)      │
│  ├─ TaskList        │                                      │
│  ├─ TaskItem        │  网络检测 (Network Detection)        │
│  ├─ TaskForm        │  ├─ 在线状态监听                     │
│  ├─ TaskStats       │  ├─ 缓存策略切换                     │
│  └─ 网络状态组件     │  └─ 离线提示管理                     │
│                     │                                     │
│  业务逻辑层:         │  PWA安装管理 (Install Management)    │
│  ├─ useLinks.js     │  ├─ 安装提示控制                     │
│  ├─ useTasks.js     │  ├─ 安装状态追踪                     │
│  ├─ useStorage.js   │  └─ 更新检查机制                     │
│  ├─ usePWA.js       │                                     │
│  ├─ useNetworkStatus│                                     │
│  └─ useServiceWorker│                                     │
├─────────────────────────────────────────────────────────────┤
│  数据存储层          │  PWA配置层                           │
│  ──────────────────  │  ────────────────────────────────   │
│  localStorage        │  Web App Manifest                   │
│  ├─ quick-links     │  ├─ 应用元数据 (name, description)   │
│  ├─ tasks           │  ├─ 图标资源 (multiple sizes)        │
│  ├─ pwa-state       │  ├─ 显示配置 (standalone mode)       │
│  └─ 版本化Schema     │  └─ 快捷方式 (shortcuts)             │
├─────────────────────────────────────────────────────────────┤
│              构建与部署层 (Vite + PWA)                        │
│  Vite 6 + vite-plugin-pwa + Workbox + Static Hosting     │
└─────────────────────────────────────────────────────────────┘
```

- **架构模式**: PWA + 组件化SPA + 组合式API模式
- **核心组件**: Vue 3、Vite、Tailwind CSS、Service Worker、Web App Manifest
- **数据流向**: UI组件 → Composables → Storage → localStorage + Service Worker缓存
- **接口设计**: 组合式函数提供统一的业务接口和PWA功能接口

### 2.3 技术栈选择
**前端技术**:
- 框架: Vue 3.5+ (Composition API)
- UI框架: Tailwind CSS (无第三方组件库)
- 状态管理: Composition API (轻量级状态管理)
- 构建工具: Vite 6+ (快速构建)
- PWA支持: vite-plugin-pwa + Workbox

**开发工具**:
- 编程语言: JavaScript (无TypeScript)
- 代码规范: ESLint + 自定义规范
- 测试框架: Vitest + Vue Test Utils
- 版本控制: Git + GitHub

**数据存储**:
- 主数据库: localStorage (浏览器本地存储)
- 缓存系统: Service Worker缓存 + 内存缓存 (computed属性)
- 文件存储: 无文件上传需求

**部署运维**:
- 容器化: 静态文件部署，无需容器
- CI/CD: GitHub Actions 自动部署
- 监控系统: 浏览器DevTools + Error Boundary + Service Worker状态监控
- 云平台: Vercel/Netlify 静态托管 (支持HTTPS和PWA)

## 3. 系统设计

### 3.1 实际目录结构
```
OneBoard/
├── docs/                     # 📚 项目文档
│   ├── architecture/         # 架构设计文档
│   ├── feature/             # 功能模块详设文档
│   ├── api/                 # API文档(组合式函数)
│   ├── deployment/          # 部署文档
│   └── development/         # 开发文档
├── src/                     # 💻 源代码目录
│   ├── components/          # Vue组件
│   │   ├── links/          # 链接管理组件
│   │   │   ├── LinkPanel.vue
│   │   │   ├── LinkItem.vue
│   │   │   └── LinkForm.vue
│   │   ├── tasks/          # 任务管理组件
│   │   │   ├── TaskList.vue
│   │   │   ├── TaskForm.vue
│   │   │   ├── TaskItem.vue
│   │   │   └── TaskStats.vue
│   │   ├── NetworkStatus.vue     # 网络状态组件
│   │   ├── PWAInstallPrompt.vue  # PWA安装提示组件
│   │   └── HelloWorld.vue       # 示例组件
│   ├── composables/        # 组合式函数
│   │   ├── usePWA.js          # PWA核心功能管理
│   │   ├── useNetworkStatus.js # 网络状态检测
│   │   ├── useServiceWorker.js # Service Worker通信
│   │   ├── useLinks.js        # 链接管理
│   │   ├── useTasks.js        # 任务管理
│   │   └── useStorage.js      # 存储管理
│   ├── utils/              # 工具函数
│   ├── types/              # 数据类型定义
│   │   └── pwa.js         # PWA相关类型
│   ├── constants/          # 常量配置
│   ├── assets/             # 静态资源
│   ├── App.vue            # 根组件
│   ├── main.js            # 应用入口
│   └── style.css          # 全局样式
├── tests/                   # 🧪 测试代码
│   ├── unit/               # 单元测试
│   │   ├── components/     # 组件测试
│   │   └── composables/    # 组合式函数测试
│   ├── integration/        # 集成测试
│   ├── e2e/                # E2E测试
│   └── setup.js           # 测试配置
├── scripts/                 # 🔧 构建和部署脚本
├── config/                  # ⚙️ 配置文件
├── vite.config.js          # Vite配置
├── vitest.config.js        # 测试配置
├── package.json            # 项目依赖
└── README.md               # 项目说明文档
```

### 3.2 数据库设计
- **数据模型**: 基于localStorage的版本化Schema设计
- **表结构**: 
  - `quick-links`: 快捷链接数据 (url, title, description)
  - `tasks`: 任务数据 (id, text, done, priority, createdAt)
- **索引策略**: 内存索引，基于数组遍历和计算属性缓存
- **数据迁移**: 版本化Schema，支持数据结构升级

### 3.3 API设计规范
- **接口风格**: 组合式函数API设计
- **数据格式**: TypeScript接口约束
- **错误处理**: 统一错误边界和异常处理
- **版本控制**: Schema版本控制策略

## 4. 测试架构

### 4.1 测试策略
- **单元测试**: 组件和组合式函数测试，覆盖率≥95%
- **集成测试**: 组件交互和数据流测试
- **系统测试**: 完整用户流程测试
- **性能测试**: 大数据量下的性能测试

### 4.2 测试工具和框架
- **单元测试**: Vitest + Vue Test Utils
- **集成测试**: Vitest + jsdom环境
- **E2E测试**: 预留扩展 (Playwright/Cypress)
- **性能测试**: Vue DevTools + 性能监控

## 5. 部署架构

### 5.1 环境规划
- **开发环境**: 本地Vite开发服务器 + HMR
- **测试环境**: GitHub Pages 测试部署
- **生产环境**: Vercel/Netlify 静态托管

### 5.2 部署策略
- **部署方式**: 静态文件部署，支持PWA
- **发布流程**: Git推送触发CI/CD自动部署
- **回滚机制**: Git版本回滚 + 静态文件快速回滚

## 6. 安全设计

### 6.1 安全策略
- **认证授权**: 无需用户认证，本地数据无权限控制需求
- **数据安全**: 数据存储在用户本地，无数据传输安全风险
- **网络安全**: HTTPS部署，CSP内容安全策略
- **安全审计**: 错误边界组件，异常监控和报告

## 7. 运维监控

### 7.1 监控体系
- **系统监控**: 静态托管平台监控 + Service Worker状态
- **业务监控**: localStorage使用情况 + 用户操作统计
- **日志管理**: 浏览器控制台 + Error Boundary组件
- **告警机制**: 前端异常监控 + 邮件通知

---

## 8. 核心业务模块设计

### 8.1 快捷链接模块
**数据模型**:
```typescript
interface QuickLink {
  id: string
  url: string
  title: string
  description?: string
  createdAt: string
}

interface LinksStorage {
  _version: '1.0'
  links: QuickLink[]
}
```

**核心功能**:
- URL有效性验证
- 重复链接检测
- 批量导入/导出
- 分类标签管理

### 8.2 任务管理模块
**数据模型**:
```typescript
interface Task {
  id: string
  text: string
  done: boolean
  priority: 'low' | 'medium' | 'high'
  createdAt: string
  updatedAt: string
}

interface TasksStorage {
  _version: '1.0'
  tasks: Task[]
  settings: {
    showCompleted: boolean
    sortBy: 'createdAt' | 'priority' | 'text'
    sortOrder: 'asc' | 'desc'
  }
}
```

**核心功能**:
- 任务CRUD操作
- 多维度排序
- 批量操作
- 统计分析

---

**文档版本**: v1.0  
**创建日期**: 2024-12-20  
**更新日期**: 2024-12-20  
**维护人员**: OneBoard开发团队 