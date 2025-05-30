import { defineConfig } from 'vitest/config'
import vue from '@vitejs/plugin-vue'
import { resolve } from 'path'

export default defineConfig({
  plugins: [vue()],
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: ['./tests/setup.js'],
    // 优化测试性能
    pool: 'threads',
    poolOptions: {
      threads: {
        singleThread: true
      }
    },
    // 覆盖率配置
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html'],
      exclude: [
        'node_modules/',
        'tests/',
        'scripts/',
        'docs/',
        '*.config.js',
        'src/main.js'
      ]
    },
    // 静默Vue警告（仅在测试环境）
    silent: false,
    logHeapUsage: true
  },
  resolve: {
    alias: {
      '@': resolve(__dirname, './src')
    }
  }
}) 