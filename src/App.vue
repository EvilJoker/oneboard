<script setup>
import LinkPanel from './components/links/LinkPanel.vue'
import TaskList from './components/tasks/TaskList.vue'
import { ref } from 'vue'

// 当前活动的面板
const activePanel = ref('dashboard')

// 面板切换函数
const setActivePanel = (panel) => {
  activePanel.value = panel
}

// 添加调试信息
console.log('App.vue 组件已加载')
console.log('LinkPanel 组件已导入:', LinkPanel)
console.log('TaskList 组件已导入:', TaskList)
</script>

<template>
  <div class="min-h-screen bg-gray-50">
    <div class="max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8">
      <!-- 应用头部 -->
      <header class="mb-8">
        <div class="flex flex-col sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 class="text-3xl font-bold text-gray-900">OneBoard</h1>
            <p class="text-gray-600">快速链接管理与任务跟踪</p>
          </div>
          
          <!-- 导航标签 -->
          <nav class="mt-4 sm:mt-0">
            <div class="flex space-x-1 bg-gray-100 p-1 rounded-lg">
              <button
                @click="setActivePanel('dashboard')"
                :class="[
                  'px-4 py-2 text-sm font-medium rounded-md transition-colors',
                  activePanel === 'dashboard' 
                    ? 'bg-white text-blue-600 shadow-sm' 
                    : 'text-gray-600 hover:text-gray-900'
                ]"
              >
                🏠 总览
              </button>
              <button
                @click="setActivePanel('links')"
                :class="[
                  'px-4 py-2 text-sm font-medium rounded-md transition-colors',
                  activePanel === 'links' 
                    ? 'bg-white text-blue-600 shadow-sm' 
                    : 'text-gray-600 hover:text-gray-900'
                ]"
              >
                🔗 快捷链接
              </button>
              <button
                @click="setActivePanel('tasks')"
                :class="[
                  'px-4 py-2 text-sm font-medium rounded-md transition-colors',
                  activePanel === 'tasks' 
                    ? 'bg-white text-blue-600 shadow-sm' 
                    : 'text-gray-600 hover:text-gray-900'
                ]"
              >
                📝 任务管理
              </button>
            </div>
          </nav>
        </div>
      </header>

      <!-- 主要内容 -->
      <main>
        <!-- 总览面板 -->
        <div v-if="activePanel === 'dashboard'" class="space-y-8">
          <div class="grid grid-cols-1 lg:grid-cols-2 gap-8">
            <!-- 快捷链接卡片 -->
            <div class="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <div class="flex items-center justify-between mb-4">
                <h2 class="text-lg font-semibold text-gray-900">快捷链接</h2>
                <button
                  @click="setActivePanel('links')"
                  class="text-sm text-blue-600 hover:text-blue-700"
                >
                  查看全部 →
                </button>
              </div>
              <LinkPanel 
                title="" 
                :columns-per-row="2"
              />
            </div>
            
            <!-- 任务管理卡片 -->
            <div class="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <div class="flex items-center justify-between mb-4">
                <h2 class="text-lg font-semibold text-gray-900">任务管理</h2>
                <button
                  @click="setActivePanel('tasks')"
                  class="text-sm text-blue-600 hover:text-blue-700"
                >
                  查看全部 →
                </button>
              </div>
              <TaskList 
                :show-stats="true" 
                :show-form="true" 
                :show-controls="false"
              />
            </div>
          </div>
        </div>
        
        <!-- 快捷链接面板 -->
        <div v-else-if="activePanel === 'links'">
          <LinkPanel />
        </div>
        
        <!-- 任务管理面板 -->
        <div v-else-if="activePanel === 'tasks'">
          <TaskList />
        </div>
      </main>
    </div>
  </div>
</template>

<style scoped>
/* 使用 Tailwind CSS，无需额外样式 */
</style>
