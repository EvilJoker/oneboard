<template>
  <div class="task-list-container" :class="containerClasses" :data-testid="'task-list'">
    <!-- 任务统计区域 -->
    <div class="task-stats-section" v-if="showStats">
      <TaskStats
        :stats="taskStats"
        :loading="loading"
        :theme="theme"
        :animated="false"
        @refresh="handleRefresh"
      />
    </div>
    
    <!-- 任务表单区域 -->
    <div class="task-form-section" v-if="showForm">
      <TaskForm
        mode="create"
        :placeholder="formPlaceholder"
        :show-priority-selector="showPrioritySelector"
        :show-char-count="showCharCount"
        :auto-focus="autoFocus"
        :theme="formTheme"
        :is-loading="saving"
        @submit="handleAddTask"
        @input-change="handleFormChange"
        @focus-change="handleFormFocus"
      />
    </div>
    
    <!-- 过滤和排序控制 -->
    <div class="task-controls" v-if="showControls">
      <div class="filter-controls">
        <label class="control-label">显示:</label>
        <select 
          v-model="localSettings.filter" 
          class="filter-select"
          :data-testid="'filter-select'"
          @change="handleFilterChange"
        >
          <option value="all">全部任务</option>
          <option value="active">未完成</option>
          <option value="completed">已完成</option>
        </select>
      </div>
      
      <div class="sort-controls">
        <label class="control-label">排序:</label>
        <select 
          v-model="localSettings.sortBy" 
          class="sort-select"
          :data-testid="'sort-select'"
          @change="handleSortChange"
        >
          <option value="createdAt">创建时间</option>
          <option value="updatedAt">更新时间</option>
          <option value="priority">优先级</option>
          <option value="text">内容</option>
        </select>
        
        <button 
          class="sort-order-btn"
          :class="{ 'desc': localSettings.sortOrder === 'desc' }"
          :data-testid="'sort-order-button'"
          @click="toggleSortOrder"
          :aria-label="sortOrderLabel"
        >
          {{ sortOrderLabel }}
        </button>
      </div>
    </div>
    
    <!-- 任务列表区域 -->
    <div class="task-items-section">
      <!-- 空状态 -->
      <div v-if="shouldShowEmptyState" class="empty-state" :data-testid="'empty-state'">
        <div class="empty-icon">📝</div>
        <h3 class="empty-title">{{ emptyStateTitle }}</h3>
        <p class="empty-description">{{ emptyStateDescription }}</p>
        <button 
          v-if="!showForm && emptyStateAction"
          class="empty-action-btn"
          @click="handleEmptyAction"
        >
          {{ emptyStateAction }}
        </button>
      </div>
      
      <!-- 任务列表 -->
      <div v-else class="task-items" :data-testid="'task-items'">
        <transition-group name="task-list" tag="div" class="task-list">
          <TaskItem
            v-for="task in displayTasks"
            :key="task.id"
            :task="task"
            :editable="true"
            :show-time="showTime"
            :show-priority="showPriority"
            :theme="itemTheme"
            @toggle="handleToggleTask"
            @update="handleEditTask"
            @delete="handleDeleteTask"
            @click="handleTaskClick"
          />
        </transition-group>
      </div>
    </div>
    
    <!-- 批量操作区域 -->
    <div 
      class="task-actions-section" 
      v-if="showBatchActions && hasCompletedTasks"
      :data-testid="'batch-actions'"
    >
      <button 
        class="clear-completed-btn"
        :class="{ 'loading': isClearing }"
        :disabled="isClearing || loading"
        :data-testid="'clear-completed-button'"
        @click="handleClearCompleted"
      >
        <span v-if="!isClearing">清除已完成 ({{ completedTasks.length }})</span>
        <span v-else>清除中...</span>
      </button>
    </div>
    
    <!-- 错误提示区域 -->
    <div 
      v-if="error" 
      class="error-message" 
      :data-testid="'error-message'" 
      role="alert" 
      aria-live="polite"
    >
      <div class="error-icon">⚠️</div>
      <div class="error-content">
        <div class="error-title">操作失败</div>
        <div class="error-description">{{ error }}</div>
      </div>
      <button class="error-close-btn" @click="clearError" aria-label="关闭错误提示">
        ✕
      </button>
    </div>
    
    <!-- 加载状态区域 -->
    <div 
      v-if="loading && tasks.length === 0" 
      class="loading-spinner" 
      :data-testid="'loading-spinner'"
      aria-label="加载中"
    >
      <div class="spinner"></div>
      <div class="loading-text">加载任务中...</div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, watch, nextTick } from 'vue'
import { useTasks } from '@/composables/useTasks.js'
import TaskItem from './TaskItem.vue'
import TaskForm from './TaskForm.vue'
import TaskStats from './TaskStats.vue'
import { THEME_PROP } from '../../constants/componentDefaults.js'

// ==================== Props 定义 ====================

/**
 * 组件属性定义
 */
const props = defineProps({
  /** 初始显示设置 */
  initialSettings: {
    type: Object,
    default: () => ({
      showCompleted: true,
      sortBy: 'createdAt',
      sortOrder: 'desc',
      filter: 'all'
    })
  },
  
  /** 是否自动初始化 */
  autoInit: {
    type: Boolean,
    default: true
  },
  
  /** 是否显示统计信息 */
  showStats: {
    type: Boolean,
    default: true
  },
  
  /** 是否显示表单 */
  showForm: {
    type: Boolean,
    default: true
  },
  
  /** 是否显示控制栏 */
  showControls: {
    type: Boolean,
    default: true
  },
  
  /** 是否显示批量操作 */
  showBatchActions: {
    type: Boolean,
    default: true
  },
  
  /** 是否显示时间信息 */
  showTime: {
    type: Boolean,
    default: true
  },
  
  /** 是否显示优先级 */
  showPriority: {
    type: Boolean,
    default: true
  },
  
  /** 是否显示优先级选择器 */
  showPrioritySelector: {
    type: Boolean,
    default: true
  },
  
  /** 是否显示字符计数 */
  showCharCount: {
    type: Boolean,
    default: true
  },
  
  /** 是否自动聚焦 */
  autoFocus: {
    type: Boolean,
    default: true
  },
  
  /** 表单占位符 */
  formPlaceholder: {
    type: String,
    default: '添加新任务...'
  },
  
  /** 列表主题 */
  theme: THEME_PROP,
  
  /** 统计组件主题 */
  statsTheme: THEME_PROP,
  
  /** 表单主题 */
  formTheme: THEME_PROP,
  
  /** 任务项主题 */
  itemTheme: {
    type: String,
    default: 'default'
  }
})

// ==================== Emits 定义 ====================

/**
 * 组件事件定义
 */
const emit = defineEmits([
  /** 任务列表初始化完成 */
  'initialized',
  
  /** 任务操作完成 */
  'task-action',
  
  /** 错误发生 */
  'error',
  
  /** 设置变化 */
  'settings-change',
  
  /** 任务选择变化 */
  'task-selection-change'
])

// ==================== 组合式函数 ====================

/**
 * 使用任务管理功能
 */
const {
  // 响应式状态
  tasks,
  loading,
  saving,
  error,
  settings,
  
  // 计算属性
  activeTasks,
  completedTasks,
  sortedTasks,
  taskStats,
  state,
  
  // 核心方法
  initializeTasks,
  addTask,
  updateTask,
  removeTask,
  toggleTask,
  clearCompleted,
  updateSettings
} = useTasks()

// ==================== 响应式状态 ====================

/** 本地设置 */
const localSettings = ref({
  filter: 'all',
  sortBy: 'createdAt',
  sortOrder: 'desc',
  ...props.initialSettings
})

/** 是否正在清除已完成任务 */
const isClearing = ref(false)

/** 表单是否聚焦 */
const isFormFocused = ref(false)

/** 选中的任务列表 */
const selectedTasks = ref([])

// ==================== 计算属性 ====================

/**
 * 容器CSS类名
 */
const containerClasses = computed(() => {
  return {
    [`theme-${props.theme}`]: true,
    'has-error': !!error.value,
    'is-loading': loading.value,
    'form-focused': isFormFocused.value
  }
})

/**
 * 是否有已完成任务
 */
const hasCompletedTasks = computed(() => {
  return completedTasks.value.length > 0
})

/**
 * 显示的任务列表
 */
const displayTasks = computed(() => {
  let filtered = sortedTasks.value
  
  // 根据过滤器筛选
  switch (localSettings.value.filter) {
    case 'active':
      filtered = activeTasks.value
      break
    case 'completed':
      filtered = completedTasks.value
      break
    default:
      filtered = sortedTasks.value
  }
  
  return filtered
})

/**
 * 是否应该显示空状态
 */
const shouldShowEmptyState = computed(() => {
  return !loading.value && displayTasks.value.length === 0
})

/**
 * 空状态标题
 */
const emptyStateTitle = computed(() => {
  switch (localSettings.value.filter) {
    case 'active':
      return tasks.value.length === 0 ? '还没有任务' : '没有未完成的任务'
    case 'completed':
      return '没有已完成的任务'
    default:
      return '还没有任务'
  }
})

/**
 * 空状态描述
 */
const emptyStateDescription = computed(() => {
  switch (localSettings.value.filter) {
    case 'active':
      return tasks.value.length === 0 ? '创建你的第一个任务吧' : '所有任务都已完成，干得不错！'
    case 'completed':
      return '完成一些任务后就会在这里显示'
    default:
      return '创建你的第一个任务开始吧'
  }
})

/**
 * 空状态操作按钮文本
 */
const emptyStateAction = computed(() => {
  if (!props.showForm && tasks.value.length === 0) {
    return '添加任务'
  }
  return null
})

/**
 * 排序顺序标签
 */
const sortOrderLabel = computed(() => {
  return localSettings.value.sortOrder === 'desc' ? '降序' : '升序'
})

// ==================== 生命周期 ====================

/**
 * 组件挂载时的初始化逻辑
 */
onMounted(async () => {
  try {
    if (props.autoInit) {
      await initializeTasks()
      
      // 应用初始设置
      await updateSettings(localSettings.value)
      
      emit('initialized', {
        taskCount: tasks.value.length,
        settings: localSettings.value
      })
    }
  } catch (err) {
    console.error('TaskList initialization error:', err)
    emit('error', err.message || '初始化任务列表失败')
  }
})

// ==================== 监听器 ====================

/**
 * 监听错误状态变化
 */
watch(error, (newError) => {
  if (newError) {
    emit('error', newError)
  }
})

/**
 * 监听任务数据变化
 */
watch(tasks, (newTasks, oldTasks) => {
  if (oldTasks && newTasks.length !== oldTasks.length) {
    emit('task-action', {
      action: newTasks.length > oldTasks.length ? 'add' : 'remove',
      count: Math.abs(newTasks.length - oldTasks.length),
      total: newTasks.length
    })
  }
}, { deep: true })

/**
 * 监听本地设置变化
 */
watch(localSettings, async (newSettings) => {
  try {
    await updateSettings(newSettings)
    emit('settings-change', newSettings)
  } catch (err) {
    console.error('Settings update error:', err)
  }
}, { deep: true })

// ==================== 事件处理方法 ====================

/**
 * 处理新增任务事件
 * @param {object} taskData - 任务数据
 */
async function handleAddTask(taskData) {
  try {
    // 使用新的API接口：传递分离的参数
    const newTask = await addTask(taskData.text, taskData.priority)
    
    emit('task-action', {
      action: 'add',
      taskId: newTask.id,
      message: '任务添加成功'
    })
  } catch (err) {
    console.error('Add task error:', err)
    emit('error', err.message || '添加任务失败')
  }
}

/**
 * 处理任务切换事件
 * @param {string} taskId - 任务ID
 */
async function handleToggleTask(taskId) {
  try {
    const task = await toggleTask(taskId)
    emit('task-action', {
      action: 'toggle',
      task: task,
      message: task.done ? '任务已完成' : '任务重新激活'
    })
  } catch (err) {
    console.error('Toggle task error:', err)
    emit('error', err.message || '切换任务状态失败')
  }
}

/**
 * 处理任务编辑事件
 * @param {string} taskId - 任务ID
 * @param {object} updates - 更新内容
 */
async function handleEditTask(taskId, updates) {
  try {
    const task = await updateTask(taskId, updates)
    emit('task-action', {
      action: 'update',
      task: task,
      message: '任务更新成功'
    })
  } catch (err) {
    console.error('Edit task error:', err)
    emit('error', err.message || '更新任务失败')
  }
}

/**
 * 处理任务删除事件
 * @param {string} taskId - 任务ID
 */
async function handleDeleteTask(taskId) {
  try {
    // 可以添加确认对话框
    const confirmed = await confirmDelete()
    if (!confirmed) return
    
    await removeTask(taskId)
    emit('task-action', {
      action: 'delete',
      taskId: taskId,
      message: '任务删除成功'
    })
  } catch (err) {
    console.error('Delete task error:', err)
    emit('error', err.message || '删除任务失败')
  }
}

/**
 * 处理任务点击事件
 * @param {object} task - 任务对象
 */
function handleTaskClick(task) {
  emit('task-action', {
    action: 'click',
    task: task
  })
}

/**
 * 处理清除已完成任务
 */
async function handleClearCompleted() {
  try {
    isClearing.value = true
    
    const clearedCount = await clearCompleted()
    emit('task-action', {
      action: 'clear-completed',
      count: clearedCount,
      message: `已清除 ${clearedCount} 个已完成任务`
    })
  } catch (err) {
    console.error('Clear completed error:', err)
    emit('error', err.message || '清除已完成任务失败')
  } finally {
    isClearing.value = false
  }
}

/**
 * 处理刷新事件
 */
async function handleRefresh() {
  try {
    await initializeTasks()
    emit('task-action', {
      action: 'refresh',
      message: '任务列表已刷新'
    })
  } catch (err) {
    console.error('Refresh error:', err)
    emit('error', err.message || '刷新任务列表失败')
  }
}

/**
 * 处理过滤器变化
 */
function handleFilterChange() {
  emit('settings-change', { ...localSettings.value })
}

/**
 * 处理排序变化
 */
function handleSortChange() {
  emit('settings-change', { ...localSettings.value })
}

/**
 * 切换排序顺序
 */
function toggleSortOrder() {
  localSettings.value.sortOrder = localSettings.value.sortOrder === 'desc' ? 'asc' : 'desc'
}

/**
 * 处理表单变化
 * @param {object} formData - 表单数据
 */
function handleFormChange(formData) {
  // 可以在这里处理表单实时变化
}

/**
 * 处理表单焦点变化
 * @param {boolean} focused - 是否聚焦
 */
function handleFormFocus(focused) {
  isFormFocused.value = focused
}

/**
 * 处理空状态操作
 */
function handleEmptyAction() {
  // 如果表单隐藏，可以显示表单或触发其他操作
  emit('task-action', {
    action: 'empty-action',
    message: '显示添加任务表单'
  })
}

/**
 * 确认删除对话框
 * @returns {Promise<boolean>} 是否确认删除
 */
async function confirmDelete() {
  // 简单的确认对话框，实际项目中可以使用更美观的模态框
  return confirm('确定要删除这个任务吗？')
}

/**
 * 清除错误信息
 */
function clearError() {
  // 由于error是从useTasks获取的，需要通过组合函数清除
  // 这里假设有clearError方法，或者通过重新初始化来清除
  // 暂时用setTimeout模拟清除错误
  nextTick(() => {
    // 通过重新获取数据来清除错误状态
    if (!loading.value) {
      // 可以调用一个专门的清除错误方法
    }
  })
}

// ==================== 暴露方法 ====================

defineExpose({
  // 刷新任务列表
  refresh: handleRefresh,
  
  // 更新设置
  updateSettings: (newSettings) => {
    Object.assign(localSettings.value, newSettings)
  },
  
  // 获取当前状态
  getState: () => ({
    tasks: tasks.value,
    displayTasks: displayTasks.value,
    stats: taskStats.value,
    settings: localSettings.value,
    loading: loading.value,
    error: error.value
  })
})
</script>

<style scoped>
.task-list-container {
  max-width: 800px;
  margin: 0 auto;
  padding: 16px;
  background: white;
  border-radius: 12px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

.task-list-container.has-error {
  border: 1px solid #fecaca;
}

.task-stats-section {
  margin-bottom: 24px;
}

.task-form-section {
  margin-bottom: 24px;
}

.task-controls {
  display: flex;
  gap: 16px;
  align-items: center;
  margin-bottom: 16px;
  padding: 12px;
  background: #f9fafb;
  border-radius: 8px;
  flex-wrap: wrap;
}

.filter-controls,
.sort-controls {
  display: flex;
  align-items: center;
  gap: 8px;
}

.control-label {
  font-size: 14px;
  font-weight: 500;
  color: #374151;
}

.filter-select,
.sort-select {
  padding: 4px 8px;
  border: 1px solid #d1d5db;
  border-radius: 4px;
  font-size: 14px;
  background: white;
}

.sort-order-btn {
  padding: 4px 8px;
  border: 1px solid #d1d5db;
  border-radius: 4px;
  background: white;
  font-size: 12px;
  cursor: pointer;
  transition: all 0.2s ease;
}

.sort-order-btn:hover {
  background: #f3f4f6;
}

.sort-order-btn.desc {
  background: #3b82f6;
  color: white;
  border-color: #3b82f6;
}

.task-items-section {
  min-height: 200px;
  margin-bottom: 24px;
}

.empty-state {
  text-align: center;
  padding: 48px 24px;
  color: #6b7280;
}

.empty-icon {
  font-size: 48px;
  margin-bottom: 16px;
}

.empty-title {
  font-size: 18px;
  font-weight: 600;
  margin-bottom: 8px;
  color: #374151;
}

.empty-description {
  font-size: 14px;
  margin-bottom: 16px;
}

.empty-action-btn {
  padding: 8px 16px;
  background: #3b82f6;
  color: white;
  border: none;
  border-radius: 6px;
  cursor: pointer;
  font-weight: 500;
  transition: background 0.2s ease;
}

.empty-action-btn:hover {
  background: #2563eb;
}

.task-items {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.task-list {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

/* 任务列表动画 */
.task-list-enter-active,
.task-list-leave-active {
  transition: all 0.3s ease;
}

.task-list-enter-from {
  opacity: 0;
  transform: translateY(-20px);
}

.task-list-leave-to {
  opacity: 0;
  transform: translateX(20px);
}

.task-list-move {
  transition: transform 0.3s ease;
}

.task-actions-section {
  display: flex;
  justify-content: center;
  margin-bottom: 16px;
}

.clear-completed-btn {
  padding: 8px 16px;
  background: #ef4444;
  color: white;
  border: none;
  border-radius: 6px;
  cursor: pointer;
  font-size: 14px;
  font-weight: 500;
  transition: all 0.2s ease;
}

.clear-completed-btn:hover:not(:disabled) {
  background: #dc2626;
}

.clear-completed-btn:disabled {
  background: #9ca3af;
  cursor: not-allowed;
}

.clear-completed-btn.loading {
  background: #6b7280;
}

.error-message {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px 16px;
  background: #fef2f2;
  border: 1px solid #fecaca;
  border-radius: 8px;
  margin-bottom: 16px;
}

.error-icon {
  font-size: 20px;
  flex-shrink: 0;
}

.error-content {
  flex: 1;
}

.error-title {
  font-weight: 600;
  color: #dc2626;
  margin-bottom: 4px;
}

.error-description {
  font-size: 14px;
  color: #7f1d1d;
}

.error-close-btn {
  background: none;
  border: none;
  font-size: 18px;
  cursor: pointer;
  color: #9ca3af;
  padding: 4px;
  line-height: 1;
}

.error-close-btn:hover {
  color: #6b7280;
}

.loading-spinner {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 48px 24px;
  gap: 16px;
}

.spinner {
  width: 32px;
  height: 32px;
  border: 3px solid #e5e7eb;
  border-radius: 50%;
  border-top-color: #3b82f6;
  animation: spin 1s ease-in-out infinite;
}

@keyframes spin {
  to { transform: rotate(360deg); }
}

.loading-text {
  color: #6b7280;
  font-size: 14px;
}

/* 主题样式 */
.theme-compact {
  padding: 12px;
  box-shadow: none;
  border: 1px solid #e5e7eb;
}

.theme-compact .task-controls {
  padding: 8px;
  margin-bottom: 12px;
}

.theme-compact .task-stats-section,
.theme-compact .task-form-section {
  margin-bottom: 16px;
}

.theme-card .task-items {
  gap: 12px;
}

/* 响应式设计 */
@media (max-width: 768px) {
  .task-list-container {
    padding: 12px;
    margin: 8px;
  }
  
  .task-controls {
    flex-direction: column;
    align-items: stretch;
    gap: 8px;
  }
  
  .filter-controls,
  .sort-controls {
    justify-content: space-between;
  }
  
  .empty-state {
    padding: 32px 16px;
  }
  
  .empty-icon {
    font-size: 36px;
  }
}

@media (max-width: 480px) {
  .task-list-container {
    border-radius: 0;
    margin: 0;
  }
  
  .filter-controls,
  .sort-controls {
    flex-direction: column;
    align-items: stretch;
    gap: 4px;
  }
}
</style> 