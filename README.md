# OneBoard

> 🚀 零后端依赖的个人效率工具 - 快捷链接管理 + 任务管理 + PWA独立应用

## ✨ 项目特性

- **零后端依赖**: 完全基于前端技术栈，无需服务器
- **PWA独立应用**: 支持浏览器安装，像桌面应用一样使用
- **完全离线支持**: 断网状态下所有功能正常可用
- **响应式设计**: 完美适配桌面端和移动端
- **模块化架构**: 组件化设计，易于扩展
- **数据本地化**: localStorage存储，支持数据迁移

## 🛠️ 技术栈

- **前端框架**: Vue 3 + Composition API
- **构建工具**: Vite 6 + PWA插件
- **样式方案**: Tailwind CSS
- **PWA支持**: Service Worker + Web App Manifest
- **测试框架**: Vitest + Vue Test Utils
- **开发语言**: JavaScript

## 🚀 快速开始

### 环境要求
- Node.js >= 18.0.0
- npm >= 8.0.0 或 pnpm >= 7.0.0

### 安装与运行
```bash
# 克隆项目
git clone https://github.com/your-org/oneboard.git
cd oneboard

# 安装依赖
npm install
# 或使用 pnpm (推荐)
pnpm install

# 启动开发服务器 (支持PWA开发模式)
npm run dev
# 默认运行在 http://localhost:5173
```

### PWA功能测试
```bash
# 构建PWA生产版本
npm run build

# 启动PWA预览服务器
npm run preview
# PWA完整功能在 http://localhost:4173
```

### 测试与构建
```bash
# 运行测试
npm run test

# 生成覆盖率报告
npm run test:coverage

# 构建生产版本
npm run build

# 预览构建结果
npm run preview
```

## 📱 PWA独立应用使用指南

### 🔧 PWA安装方法

#### 方法1: 浏览器安装提示
1. 访问应用 (http://localhost:4173 或部署地址)
2. 顶部会显示蓝色安装提示条
3. 点击"安装"按钮完成安装

#### 方法2: 浏览器手动安装
1. 在Chrome地址栏右侧查找"安装"图标 📱
2. 点击图标选择"安装OneBoard"
3. 确认安装到桌面

#### 方法3: 开发者工具安装
1. 按F12打开开发者工具
2. 切换到"Application"标签
3. 左侧选择"Manifest"
4. 点击"Install"按钮

### 🎯 PWA功能验证

#### ✅ 安装验证
- [ ] 浏览器显示安装提示
- [ ] 应用出现在系统应用列表中
- [ ] 可从桌面/开始菜单启动
- [ ] 独立窗口运行(无浏览器UI)
- [ ] 窗口标题显示"OneBoard - 个人效率工具"

#### ✅ 离线功能验证
- [ ] 断网状态下应用正常启动
- [ ] 快捷链接增删改查功能正常
- [ ] 任务管理增删改查功能正常
- [ ] 数据修改正常保存
- [ ] 网络状态指示器显示离线状态

#### ✅ 桌面应用体验验证
- [ ] 应用在独立窗口中运行
- [ ] 支持窗口最小化、最大化、关闭
- [ ] 支持窗口大小调整
- [ ] 任务栏显示独立应用图标
- [ ] Alt+Tab可切换到应用

### 🔍 PWA开发调试

#### 开发模式PWA测试
```bash
# 启动开发服务器(PWA功能已启用)
npm run dev

# 访问 http://localhost:5173
# 开发模式下可测试PWA基本功能
```

#### 生产模式PWA测试
```bash
# 构建并预览完整PWA功能
npm run build && npm run preview

# 访问 http://localhost:4173
# 完整PWA功能，包括离线缓存
```

#### Service Worker调试
1. 打开开发者工具 (F12)
2. 切换到"Application"标签
3. 左侧选择"Service Workers"
4. 查看SW注册状态和缓存情况

#### 离线测试
1. 在开发者工具中切换到"Network"标签
2. 勾选"Offline"模拟断网
3. 刷新页面验证离线功能
4. 测试数据操作是否正常

## 📁 项目结构

```
oneboard/
├── 📁 src/                    # 源代码
│   ├── 📁 components/         # Vue组件
│   │   ├── 📁 links/         # 链接管理组件
│   │   ├── 📁 tasks/         # 任务管理组件
│   │   └── NetworkStatus.vue # 网络状态组件
│   ├── 📁 composables/       # 组合式函数
│   │   ├── usePWA.js         # PWA功能管理
│   │   ├── useServiceWorker.js # SW管理
│   │   └── useNetworkStatus.js # 网络状态
│   ├── 📁 constants/         # 常量定义
│   ├── 📁 types/             # 数据类型定义
│   └── 📁 utils/             # 工具函数
├── 📁 tests/                  # 测试文件
│   └── 📁 unit/              # 单元测试
├── 📁 docs/                   # 项目文档
│   ├── 📁 architecture/      # 架构文档
│   ├── 📁 development/       # 开发文档
│   ├── 📁 feature/           # 功能文档
│   └── 📁 requirements/      # 需求文档
├── 📁 public/                 # 静态资源
│   └── icon.svg              # PWA应用图标
├── 📁 dist/                   # 构建输出
│   ├── sw.js                 # Service Worker
│   ├── manifest.webmanifest  # PWA清单
│   └── registerSW.js         # SW注册脚本
└── vite.config.js            # Vite + PWA配置
```

## 📚 文档

- [🏗️ 架构设计文档](docs/architecture/OneBoard-系统架构设计文档-v1.0.md)
- [💻 快速开发指南](docs/development/快速开发指南.md)
- [📱 PWA开发指南](docs/development/PWA开发指南.md)
- [🧪 测试指南](docs/testing.md)
- [📋 需求规格说明书](docs/requirements/OneBoard-PWA独立应用-需求规格说明书-v1.0.md)

## 🎯 功能模块

### 快捷链接管理
- ✅ 链接添加、编辑、删除
- ✅ URL验证和图标显示
- ✅ 分类管理和搜索
- ✅ 响应式布局
- ✅ 离线数据同步

### 任务管理系统
- ✅ 任务创建、编辑、删除
- ✅ 任务状态切换
- ✅ 优先级设置
- ✅ 任务统计和筛选
- ✅ 离线数据同步

### PWA独立应用
- ✅ 浏览器安装支持
- ✅ 独立窗口运行
- ✅ 完全离线支持
- ✅ Service Worker缓存
- ✅ 网络状态检测
- ✅ 自动更新机制

## 🧪 测试覆盖率

目标覆盖率: **95%+**

| 测试类型 | 覆盖范围 | 比例 | 状态 |
|---------|----------|------|------|
| 单元测试 | 组件、函数、PWA功能 | 70% | ✅ 完成 |
| 集成测试 | 模块交互、PWA集成 | 20% | ✅ 完成 |
| E2E测试 | 用户流程、PWA安装 | 10% | 🚧 规划中 |

**PWA专项测试覆盖**:
- ✅ PWA安装流程测试 (35个测试用例)
- ✅ Service Worker功能测试 (42个测试用例)
- ✅ 网络状态组件测试 (38个测试用例)
- ✅ 离线功能测试 (55个测试用例)

## 🚀 部署

项目支持部署到任何支持HTTPS的静态站点服务：

### 推荐部署平台
- **Vercel**: 一键导入部署，自动HTTPS
- **Netlify**: 连接GitHub自动部署
- **GitHub Pages**: 使用Actions自动构建

### PWA部署要求
- ✅ **HTTPS协议**: PWA必须在HTTPS环境下运行
- ✅ **Service Worker**: 确保SW文件正确提供
- ✅ **Manifest文件**: Web App Manifest正确配置
- ✅ **图标资源**: PWA图标文件可访问

### 部署验证
```bash
# 本地验证PWA功能
npm run build
npm run preview

# 使用Lighthouse检查PWA评分
# 目标: PWA评分 ≥ 90分
```

## 🔧 PWA配置说明

### Vite PWA插件配置
```javascript
// vite.config.js
VitePWA({
  registerType: 'autoUpdate',        // 自动更新
  workbox: {
    globPatterns: ['**/*.{js,css,html,ico,png,svg,json,vue,txt,woff2}'],
    runtimeCaching: [...]            // 运行时缓存策略
  },
  manifest: {
    name: 'OneBoard - 个人效率工具',
    short_name: 'OneBoard',
    display: 'standalone',           // 独立应用模式
    theme_color: '#3b82f6',
    background_color: '#ffffff'
  },
  devOptions: {
    enabled: true                    # 开发模式启用PWA
  }
})
```

### Service Worker功能
- **静态资源缓存**: 自动缓存所有应用资源
- **运行时缓存**: 动态缓存网络请求
- **离线回退**: 网络不可用时提供离线页面
- **自动更新**: 检测到新版本自动更新

## 🤝 贡献指南

欢迎提交Issue和Pull Request！

### PWA相关贡献
1. **PWA功能增强**: 改进安装体验、离线功能
2. **性能优化**: Service Worker缓存策略优化
3. **兼容性改进**: 不同浏览器PWA支持
4. **测试完善**: PWA功能测试用例

### 开发流程
1. Fork项目仓库
2. 创建功能分支 (`git checkout -b feature/PWAFeature`)
3. 编写代码和测试
4. 确保PWA测试通过 (`npm run test`)
5. 验证PWA功能 (`npm run build && npm run preview`)
6. 提交更改 (`git commit -m 'feat: add PWA feature'`)
7. 推送到分支 (`git push origin feature/PWAFeature`)
8. 创建Pull Request

## 📄 许可证

本项目采用 MIT 许可证 - 查看 [LICENSE](LICENSE) 文件了解详情

## 🔗 相关链接

- [Vue.js 3](https://vuejs.org/)
- [Vite](https://vitejs.dev/)
- [Vite PWA Plugin](https://vite-pwa-org.netlify.app/)
- [Workbox](https://developers.google.com/web/tools/workbox)
- [PWA Builder](https://www.pwabuilder.com/)
- [Tailwind CSS](https://tailwindcss.com/)
- [Vitest](https://vitest.dev/)

---

**开发团队**: OneBoard Team  
**项目状态**: 🟢 Active Development  
**PWA状态**: ✅ Production Ready  
**最后更新**: 2024-12-20
