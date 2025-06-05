# OneBoard

> 🚀 零后端依赖的个人效率工具 - 快捷链接管理 + 任务管理

## ✨ 项目特性

- **零后端依赖**: 完全基于前端技术栈，无需服务器
- **PWA离线支持**: 支持离线运行和桌面安装
- **响应式设计**: 完美适配桌面端和移动端
- **模块化架构**: 组件化设计，易于扩展
- **数据本地化**: localStorage存储，支持数据迁移

## 🛠️ 技术栈

- **前端框架**: Vue 3 + Composition API
- **构建工具**: Vite 6
- **样式方案**: Tailwind CSS
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

# 启动开发服务器
npm run dev
# 默认运行在 http://localhost:5173
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

## 📁 项目结构

```
oneboard/
├── 📁 src/                    # 源代码
│   ├── 📁 components/         # Vue组件
│   │   ├── 📁 links/         # 链接管理组件
│   │   └── 📁 tasks/         # 任务管理组件
│   ├── 📁 composables/       # 组合式函数
│   ├── 📁 constants/         # 常量定义
│   └── 📁 utils/             # 工具函数
├── 📁 tests/                  # 测试文件
│   └── 📁 unit/              # 单元测试
├── 📁 docs/                   # 项目文档
│   ├── 📁 architecture/      # 架构文档
│   ├── 📁 development/       # 开发文档
│   ├── 📁 feature/           # 功能文档
│   └── 📁 testing/           # 测试文档
└── 📁 public/                 # 静态资源
```

## 📚 文档

- [🏗️ 架构设计文档](docs/architecture/OneBoard-系统架构设计文档-v1.0.md)
- [💻 开发环境配置指南](docs/development/开发环境配置指南.md)
- [🧪 测试指南](docs/testing.md)
- [📋 需求描述](docs/design/需求描述.md)

## 🎯 功能模块

### 快捷链接管理
- ✅ 链接添加、编辑、删除
- ✅ URL验证和图标显示
- ✅ 分类管理和搜索
- ✅ 响应式布局

### 任务管理系统
- ✅ 任务创建、编辑、删除
- ✅ 任务状态切换
- ✅ 优先级设置
- ✅ 任务统计和筛选

## 🧪 测试覆盖率

目标覆盖率: **95%+**

| 测试类型 | 覆盖范围 | 比例 |
|---------|----------|------|
| 单元测试 | 组件、函数 | 70% |
| 集成测试 | 模块交互 | 20% |
| E2E测试 | 用户流程 | 10% |

## 🚀 部署

项目支持部署到任何静态站点服务：

- **Netlify**: 连接GitHub自动部署
- **Vercel**: 一键导入部署
- **GitHub Pages**: 使用Actions自动构建

## 🤝 贡献指南

欢迎提交Issue和Pull Request！

1. Fork项目仓库
2. 创建功能分支 (`git checkout -b feature/AmazingFeature`)
3. 编写代码和测试
4. 确保测试通过 (`npm run test`)
5. 提交更改 (`git commit -m 'Add some AmazingFeature'`)
6. 推送到分支 (`git push origin feature/AmazingFeature`)
7. 创建Pull Request

## 📄 许可证

本项目采用 MIT 许可证 - 查看 [LICENSE](LICENSE) 文件了解详情

## 🔗 相关链接

- [Vue.js 3](https://vuejs.org/)
- [Vite](https://vitejs.dev/)
- [Tailwind CSS](https://tailwindcss.com/)
- [Vitest](https://vitest.dev/)

---

**开发团队**: OneBoard Team  
**项目状态**: 🟢 Active Development  
**最后更新**: 2024-12-20
