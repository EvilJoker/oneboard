#!/bin/bash

# Quick Link Management 测试脚本
# 提供多种测试运行选项

echo "🧪 Quick Link Management 测试工具"
echo "=================================="

# 检查参数
case "$1" in
  "run"|"")
    echo "📋 运行所有测试..."
    npm run test:run
    ;;
  "watch")
    echo "👀 监听模式运行测试..."
    npm run test
    ;;
  "ui")
    echo "🎨 启动测试UI界面..."
    npm run test:ui
    ;;
  "coverage")
    echo "📊 运行测试覆盖率报告..."
    npm run test:coverage
    ;;
  "help"|"-h"|"--help")
    echo "使用方法:"
    echo "  ./scripts/test.sh [选项]"
    echo ""
    echo "选项:"
    echo "  run       运行所有测试 (默认)"
    echo "  watch     监听模式运行测试"
    echo "  ui        启动测试UI界面"
    echo "  coverage  生成测试覆盖率报告"
    echo "  help      显示此帮助信息"
    ;;
  *)
    echo "❌ 未知选项: $1"
    echo "使用 './scripts/test.sh help' 查看可用选项"
    exit 1
    ;;
esac 