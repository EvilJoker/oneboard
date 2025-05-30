<script setup>
import LinkPanel from './components/links/LinkPanel.vue'

// 添加调试信息
console.log('App.vue 组件已加载')
console.log('LinkPanel 组件已导入:', LinkPanel)
</script>

<template>
  <div class="min-h-screen bg-gray-50">
    <div class="max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8">
      <!-- 应用头部 -->
      <header class="mb-8">
        <h1 class="text-3xl font-bold text-gray-900">OneBoard</h1>
        <p class="text-gray-600">快速链接管理</p>
      </header>

      <!-- 主要内容 -->
      <main>
        <LinkPanel />
      </main>
    </div>
  </div>
</template>

<style scoped>
/* 使用 Tailwind CSS，无需额外样式 */
</style>
