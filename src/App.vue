<script setup>
import LinkPanel from './components/links/LinkPanel.vue'
import TaskList from './components/tasks/TaskList.vue'
import NetworkStatus from './components/NetworkStatus.vue'
import { ref, onMounted, onUnmounted } from 'vue'
import { usePWA } from './composables/usePWA'
import { useServiceWorker } from './composables/useServiceWorker'

// 当前活动的面板
const activePanel = ref('dashboard')

// PWA功能
const {
  isInstallable,
  isInstalled,
  showInstallPrompt,
  dismissInstallPrompt,
  initializePWA,
  cleanupPWA
} = usePWA()

// Service Worker功能
const {
  initializeServiceWorker
} = useServiceWorker()

// 面板切换函数
const setActivePanel = (panel) => {
  activePanel.value = panel
}

// PWA安装处理
const handleInstallApp = async () => {
  const success = await showInstallPrompt()
  if (success) {
    console.log('PWA安装提示已显示')
  }
}

const handleDismissInstall = () => {
  dismissInstallPrompt()
}

// 生命周期
onMounted(async () => {
  console.log('OneBoard PWA应用启动中...')
  
  // 初始化PWA功能
  await initializePWA()
  
  // 初始化Service Worker
  await initializeServiceWorker()
  
  console.log('OneBoard PWA应用已就绪')
})

onUnmounted(() => {
  cleanupPWA()
})

// 添加调试信息
console.log('App.vue 组件已加载')
console.log('LinkPanel 组件已导入:', LinkPanel)
console.log('TaskList 组件已导入:', TaskList)
</script>

<template>
  <div class="min-h-screen bg-gray-50">
    <!-- PWA安装提示 -->
    <div 
      v-if="isInstallable && !isInstalled" 
      class="fixed top-0 left-0 right-0 bg-blue-600 text-white p-3 z-50"
    >
      <div class="max-w-7xl mx-auto flex items-center justify-between">
        <div class="flex items-center space-x-3">
          <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 18h.01M8 21h8a2 2 0 002-2V5a2 2 0 00-2-2H8a2 2 0 00-2 2v14a2 2 0 002 2z"></path>
          </svg>
          <span class="text-sm font-medium">将OneBoard安装为桌面应用，获得更好的使用体验</span>
        </div>
        <div class="flex items-center space-x-2">
          <button
            @click="handleInstallApp"
            class="bg-white text-blue-600 px-4 py-1 rounded text-sm font-medium hover:bg-gray-100 transition-colors"
          >
            安装
          </button>
          <button
            @click="handleDismissInstall"
            class="text-blue-100 hover:text-white px-2 py-1 text-sm"
          >
            ✕
          </button>
        </div>
      </div>
    </div>

    <!-- 网络状态指示器 -->
    <NetworkStatus />

    <div class="max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8" :class="{ 'pt-20': isInstallable && !isInstalled }">
      <!-- 应用头部 -->
      <header class="mb-8">
        <div class="flex flex-col sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 class="text-3xl font-bold text-gray-900 flex items-center space-x-2">
              <span>OneBoard</span>
              <span v-if="isInstalled" class="text-sm bg-green-100 text-green-800 px-2 py-1 rounded-full">PWA</span>
            </h1>
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
