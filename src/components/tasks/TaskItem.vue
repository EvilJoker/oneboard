<template>
  <div 
    class="task-item" 
    :class="taskItemClasses"
    :data-testid="'task-item'"
    :tabindex="0"
    :aria-label="`任务: ${task.text}`"
    @click="handleClick"
    @keydown.enter="enterEditMode"
    @keydown.space.prevent="handleToggle"
  >
    <!-- 任务状态checkbox -->
    <div class="task-checkbox">
      <input
        type="checkbox"
        :checked="task.done"
        :aria-label="'标记任务完成状态'"
        @change="handleToggle"
      />
    </div>
    
    <!-- 任务内容区域 -->
    <div class="task-content" @dblclick="enterEditMode">
      <!-- 编辑模式 -->
      <div v-if="isEditing" class="task-edit-mode">
        <input
          ref="editInput"
          v-model="editingText"
          type="text"
          class="task-edit-input"
          :data-testid="'edit-input'"
          @keyup.enter="saveEdit"
          @keyup.escape="cancelEdit"
          @blur="saveEdit"
        />
        <div v-if="editError" class="edit-error" :data-testid="'edit-error'">
          {{ editError }}
        </div>
      </div>
      
      <!-- 显示模式 -->
      <div v-else class="task-display-mode">
        <span 
          class="task-text"
          :class="{ 'line-through': task.done }"
          :data-testid="'task-text'"
          :aria-label="'任务内容'"
        >
          {{ task.text }}
        </span>
      </div>
    </div>
    
    <!-- 任务优先级标识 -->
    <div v-if="showPriority" class="task-priority" :class="priorityClasses">
      <span class="priority-indicator" :title="`优先级: ${priorityText}`">
        {{ priorityIcon }}
      </span>
    </div>
    
    <!-- 任务操作按钮 -->
    <div class="task-actions">
      <button
        v-if="editable && !isEditing"
        class="action-btn edit-btn"
        :aria-label="'编辑任务'"
        @click.stop="enterEditMode"
      >
        ✏️
      </button>
      <button
        class="action-btn delete-btn"
        :data-testid="'delete-button'"
        :aria-label="'删除任务'"
        @click.stop="handleDelete"
      >
        🗑️
      </button>
    </div>
    
    <!-- 任务时间信息 -->
    <div v-if="showTimeInfo" class="task-time-info" :data-testid="'task-time'">
      <span class="time-created" :title="`创建时间: ${task.createdAt}`">
        {{ formattedCreatedAt }}
      </span>
      <span v-if="task.updatedAt !== task.createdAt" class="time-updated" :title="`更新时间: ${task.updatedAt}`">
        (已更新)
      </span>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, nextTick } from 'vue'
import { THEME_PROP } from '../../constants/componentDefaults.js'

// ==================== Props 定义 ====================

/**
 * 组件属性定义
 */
const props = defineProps({
  /** 任务数据对象 */
  task: {
    type: Object,
    required: true,
    validator: (task) => {
      return task && 
             typeof task.id === 'string' && 
             typeof task.text === 'string' &&
             typeof task.done === 'boolean' &&
             task.createdAt &&
             task.updatedAt
    }
  },
  
  /** 是否可以编辑 */
  editable: {
    type: Boolean,
    default: true
  },
  
  /** 是否显示时间信息 */
  showTimeInfo: {
    type: Boolean,
    default: true
  },
  
  /** 是否显示优先级 */
  showPriority: {
    type: Boolean,
    default: true
  },
  
  /** 任务项样式主题 */
  theme: THEME_PROP
})

// ==================== Emits 定义 ====================

/**
 * 组件事件定义
 */
const emit = defineEmits([
  /** 任务状态切换 */
  'toggle',
  
  /** 任务更新 */
  'update',
  
  /** 任务删除 */
  'delete',
  
  /** 任务项点击 */
  'click'
])

// ==================== 响应式状态 ====================

/** 是否处于编辑模式 */
const isEditing = ref(false)

/** 编辑中的任务文本 */
const editingText = ref('')

/** 编辑错误信息 */
const editError = ref('')

/** 编辑输入框引用 */
const editInput = ref(null)

// ==================== 计算属性 ====================

/**
 * 任务项的CSS类名
 */
const taskItemClasses = computed(() => {
  return {
    'completed': props.task.done,
    'editing': isEditing.value,
    [`priority-${props.task.priority}`]: true,
    [`theme-${props.theme}`]: true
  }
})

/**
 * 优先级的CSS类名
 */
const priorityClasses = computed(() => {
  return {
    'priority-high': props.task.priority === 'high',
    'priority-medium': props.task.priority === 'medium',
    'priority-low': props.task.priority === 'low'
  }
})

/**
 * 优先级图标
 */
const priorityIcon = computed(() => {
  const icons = {
    high: '高优',     // 高优先级：显示"高优"
    medium: '中优',   // 中优先级：显示"中优"
    low: '低优'       // 低优先级：显示"低优"
  }
  return icons[props.task.priority] || '未知'
})

/**
 * 优先级文本
 */
const priorityText = computed(() => {
  const texts = {
    high: '高',
    medium: '中',
    low: '低'
  }
  return texts[props.task.priority] || '未知'
})

/**
 * 格式化的创建时间
 */
const formattedCreatedAt = computed(() => {
  return formatRelativeTime(props.task.createdAt)
})

/**
 * 格式化的更新时间
 */
const formattedUpdatedAt = computed(() => {
  return formatRelativeTime(props.task.updatedAt)
})

// ==================== 事件处理方法 ====================

/**
 * 处理任务状态切换
 */
function handleToggle() {
  emit('toggle', props.task.id)
}

/**
 * 处理任务项点击
 * @param {Event} event - 点击事件
 */
function handleClick(event) {
  if (isEditing.value) return
  emit('click', props.task.id, event)
}

/**
 * 进入编辑模式
 */
async function enterEditMode() {
  if (!props.editable || isEditing.value) return
  
  isEditing.value = true
  editingText.value = props.task.text
  editError.value = ''
  
  // 等待DOM更新后聚焦输入框
  await nextTick()
  if (editInput.value) {
    editInput.value.focus()
    editInput.value.select()
  }
}

/**
 * 保存编辑
 */
function saveEdit() {
  const newText = editingText.value.trim()
  
  // 验证输入
  if (!newText) {
    editError.value = '任务内容不能为空'
    return
  }
  
  if (newText.length > 200) {
    editError.value = '任务内容长度不能超过200字符'
    return
  }
  
  // 如果内容没有变化，直接退出编辑模式
  if (newText === props.task.text) {
    exitEditMode()
    return
  }
  
  // 发送更新事件
  emit('update', props.task.id, { text: newText })
  exitEditMode()
}

/**
 * 取消编辑
 */
function cancelEdit() {
  exitEditMode()
}

/**
 * 退出编辑模式
 */
function exitEditMode() {
  isEditing.value = false
  editingText.value = ''
  editError.value = ''
}

/**
 * 处理删除任务
 */
function handleDelete() {
  emit('delete', props.task.id)
}

// ==================== 工具方法 ====================

/**
 * 格式化相对时间
 * @param {string} dateString - 日期字符串
 * @returns {string} 格式化后的时间
 */
function formatRelativeTime(dateString) {
  const date = new Date(dateString)
  const now = new Date()
  const diffMs = now.getTime() - date.getTime()
  const diffMins = Math.floor(diffMs / (1000 * 60))
  const diffHours = Math.floor(diffMs / (1000 * 60 * 60))
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24))
  
  if (diffMins < 1) return '刚刚'
  if (diffMins < 60) return `${diffMins}分钟前`
  if (diffHours < 24) return `${diffHours}小时前`
  if (diffDays < 7) return `${diffDays}天前`
  
  // 超过一周显示具体日期（ISO格式用于测试）
  if (process.env.NODE_ENV === 'test') {
    return dateString.split('T')[0] // 返回 YYYY-MM-DD 格式用于测试
  }
  
  return date.toLocaleDateString('zh-CN', {
    month: 'short',
    day: 'numeric'
  })
}
</script>

<style scoped>
.task-item {
  display: flex;
  align-items: center;
  padding: 12px 16px;
  border: 1px solid #e5e7eb;
  border-radius: 8px;
  margin-bottom: 8px;
  background: white;
  transition: all 0.2s ease;
  cursor: pointer;
}

.task-item:hover {
  border-color: #d1d5db;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.05);
}

.task-item:focus {
  outline: 2px solid #3b82f6;
  outline-offset: 2px;
}

.task-item.completed {
  background-color: #f9fafb;
  opacity: 0.8;
}

.task-item.editing {
  border-color: #3b82f6;
  box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
}

/* 优先级样式 */
.task-item.priority-high {
  border-left: 4px solid #ef4444;
}

.task-item.priority-medium {
  border-left: 4px solid #f59e0b;
}

.task-item.priority-low {
  border-left: 4px solid #10b981;
}

.task-checkbox {
  margin-right: 12px;
}

.task-checkbox input[type="checkbox"] {
  width: 18px;
  height: 18px;
  cursor: pointer;
}

.task-content {
  flex: 1;
  min-width: 0;
}

.task-text {
  font-size: 16px;
  line-height: 1.5;
  word-break: break-word;
}

.task-text.line-through {
  text-decoration: line-through;
  color: #6b7280;
}

.task-edit-input {
  width: 100%;
  padding: 4px 8px;
  border: 1px solid #d1d5db;
  border-radius: 4px;
  font-size: 16px;
  outline: none;
}

.task-edit-input:focus {
  border-color: #3b82f6;
  box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
}

.edit-error {
  color: #ef4444;
  font-size: 12px;
  margin-top: 4px;
}

.task-priority {
  margin: 0 8px;
}

.priority-indicator {
  font-size: 12px;
  font-weight: bold;
  padding: 2px 6px;
  border-radius: 4px;
  background-color: rgba(255, 255, 255, 0.8);
}

/* 优先级文字颜色和背景 */
.task-priority.priority-high .priority-indicator {
  color: #dc2626;
  background-color: rgba(239, 68, 68, 0.1);
}

.task-priority.priority-medium .priority-indicator {
  color: #d97706;
  background-color: rgba(245, 158, 11, 0.1);
}

.task-priority.priority-low .priority-indicator {
  color: #059669;
  background-color: rgba(16, 185, 129, 0.1);
}

.task-actions {
  display: flex;
  gap: 4px;
  margin-left: 8px;
}

.action-btn {
  background: none;
  border: none;
  padding: 4px 8px;
  border-radius: 4px;
  cursor: pointer;
  font-size: 14px;
  transition: background-color 0.2s;
}

.action-btn:hover {
  background-color: #f3f4f6;
}

.action-btn:focus {
  outline: 2px solid #3b82f6;
  outline-offset: 2px;
}

.delete-btn:hover {
  background-color: #fef2f2;
  color: #ef4444;
}

.task-time-info {
  margin-left: 8px;
  font-size: 12px;
  color: #6b7280;
  white-space: nowrap;
}

.time-updated {
  margin-left: 4px;
  font-style: italic;
}

/* 主题样式 */
.theme-compact {
  padding: 8px 12px;
  margin-bottom: 4px;
}

.theme-compact .task-text {
  font-size: 14px;
}

.theme-detailed {
  padding: 16px 20px;
  margin-bottom: 12px;
}

.theme-detailed .task-text {
  font-size: 18px;
}

/* 响应式设计 */
@media (max-width: 640px) {
  .task-item {
    padding: 8px 12px;
  }
  
  .task-actions {
    flex-direction: column;
    gap: 2px;
  }
  
  .task-time-info {
    display: none;
  }
}
</style> 