<template>
  <form 
    class="task-form" 
    :class="formClasses"
    :data-testid="'task-form'"
    @submit.prevent="handleSubmit"
  >
    <!-- 表单标题 -->
    <div v-if="showTitle" class="form-title" :data-testid="'form-title'">
      {{ formTitle }}
    </div>
    
    <!-- 主输入区域 -->
    <div class="form-main-input">
      <input
        ref="taskInputRef"
        v-model="formData.text"
        type="text"
        class="task-input"
        :class="inputClasses"
        :data-testid="'task-input'"
        :placeholder="placeholder"
        :disabled="isSubmitting"
        :aria-label="'任务内容输入框'"
        @keydown="handleKeydown"
        @focus="handleFocus"
        @blur="handleBlur"
        @input="handleInput"
      />
      
      <!-- 加载指示器 -->
      <div v-if="isSubmitting" class="loading-indicator" :data-testid="'loading-indicator'">
        <span class="loading-spinner"></span>
      </div>
    </div>
    
    <!-- 优先级选择器 -->
    <div v-if="showPrioritySelector" class="form-priority-selector">
      <label class="priority-label">优先级:</label>
      <select
        v-model="formData.priority"
        class="priority-select"
        :data-testid="'priority-select'"
        :disabled="isSubmitting"
        :aria-label="'任务优先级选择'"
      >
        <option v-for="option in priorityOptions" :value="option.value" :key="option.value">
          {{ option.label }}
        </option>
      </select>
    </div>
    
    <!-- 表单按钮区域 -->
    <div class="form-actions" :class="{ 'actions-visible': showActions || isFocused }">
      <!-- 提交按钮 -->
      <button
        type="submit"
        class="btn-submit"
        :class="submitButtonClasses"
        :data-testid="'submit-button'"
        :disabled="!canSubmit"
        :aria-label="submitButtonText"
      >
        {{ submitButtonText }}
      </button>
      
      <!-- 取消按钮 -->
      <button
        v-if="showCancelButton || isEditMode"
        type="button"
        class="btn-cancel"
        :data-testid="'cancel-button'"
        @click="handleCancel"
        :disabled="isSubmitting"
        :aria-label="'取消操作'"
      >
        取消
      </button>
    </div>
    
    <!-- 错误提示 -->
    <div v-if="validationError" class="form-error" :data-testid="'form-error'" role="alert" aria-live="polite">
      {{ validationError }}
    </div>
    
    <!-- 成功提示 -->
    <div v-if="isSuccess && successMessage" class="form-success" :data-testid="'form-success'" role="alert" aria-live="polite">
      {{ successMessage }}
    </div>
    
    <!-- 字符计数 -->
    <div v-if="showCharCount" class="form-char-count" :data-testid="'length-indicator'" :class="charCountClasses">
      {{ charCountText }}
    </div>
  </form>
</template>

<script setup>
import { ref, computed, watch, nextTick, onMounted } from 'vue'
import { THEME_PROP, PRIORITY_PROP, TASK_PRIORITIES } from '../../constants/componentDefaults.js'

// ==================== Props 定义 ====================

/**
 * 组件属性定义
 */
const props = defineProps({
  /** 表单模式：新增或编辑 */
  mode: {
    type: String,
    default: 'create',
    validator: (value) => ['create', 'edit'].includes(value)
  },
  
  /** 编辑时的初始任务数据 */
  initialTask: {
    type: Object,
    default: null
  },
  
  /** 输入框占位符 */
  placeholder: {
    type: String,
    default: '添加新任务...'
  },
  
  /** 是否显示优先级选择器 */
  showPrioritySelector: {
    type: Boolean,
    default: true
  },
  
  /** 是否显示取消按钮 */
  showCancelButton: {
    type: Boolean,
    default: false
  },
  
  /** 是否显示字符计数 */
  showCharCount: {
    type: Boolean,
    default: true
  },
  
  /** 是否显示表单标题 */
  showTitle: {
    type: Boolean,
    default: false
  },
  
  /** 是否自动聚焦 */
  autoFocus: {
    type: Boolean,
    default: true
  },
  
  /** 最大字符数限制 */
  maxLength: {
    type: Number,
    default: 200
  },
  
  /** 表单样式主题 */
  theme: THEME_PROP,
  
  /** 是否处于加载状态 */
  isLoading: {
    type: Boolean,
    default: false
  }
})

// ==================== Emits 定义 ====================

/**
 * 组件事件定义
 */
const emit = defineEmits([
  /** 提交表单 */
  'submit',
  
  /** 取消操作 */
  'cancel',
  
  /** 输入内容变化 */
  'input-change',
  
  /** 表单焦点状态变化 */
  'focus-change'
])

// ==================== 响应式状态 ====================

/** 表单数据 */
const formData = ref({
  text: '',
  priority: 'medium'
})

/** 是否正在提交 */
const isSubmitting = ref(false)

/** 是否显示操作按钮 */
const showActions = ref(false)

/** 表单错误列表 */
const formErrors = ref([])

/** 输入框引用 */
const taskInputRef = ref(null)

/** 是否处于聚焦状态 */
const isFocused = ref(false)

/** 成功状态 */
const isSuccess = ref(false)

/** 成功消息 */
const successMessage = ref('')

/** 是否为初始状态（还未进行过任何交互） */
const isInitialState = ref(true)

// ==================== 计算属性 ====================

/**
 * 是否为编辑模式
 */
const isEditMode = computed(() => {
  return props.mode === 'edit'
})

/**
 * 表单标题
 */
const formTitle = computed(() => {
  return isEditMode.value ? '编辑任务' : '新建任务'
})

/**
 * 表单CSS类名
 */
const formClasses = computed(() => {
  return {
    [`theme-${props.theme}`]: true,
    'form-focused': isFocused.value,
    'form-submitting': isSubmitting.value || props.isLoading,
    'form-edit-mode': isEditMode.value,
    'form-success': isSuccess.value
  }
})

/**
 * 输入框CSS类名
 */
const inputClasses = computed(() => {
  return {
    'input-error': formErrors.value.length > 0 && !isSuccess.value && !isInitialState.value,
    'input-focused': isFocused.value,
    'input-success': isSuccess.value
  }
})

/**
 * 提交按钮CSS类名
 */
const submitButtonClasses = computed(() => {
  return {
    'btn-loading': isSubmitting.value || props.isLoading,
    'btn-success': isSuccess.value
  }
})

/**
 * 字符计数CSS类名
 */
const charCountClasses = computed(() => {
  const length = formData.value.text.length
  return {
    'text-gray-500': length < props.maxLength * 0.8,
    'text-yellow-500': length >= props.maxLength * 0.8 && length < props.maxLength,
    'text-red-500': length >= props.maxLength
  }
})

/**
 * 是否可以提交表单
 */
const canSubmit = computed(() => {
  const text = formData.value.text.trim()
  return text.length > 0 && 
         text.length <= props.maxLength && 
         formErrors.value.length === 0 && 
         !isSubmitting.value && 
         !props.isLoading &&
         !isSuccess.value
})

/**
 * 提交按钮文本
 */
const submitButtonText = computed(() => {
  if (isSuccess.value) {
    return '✓ 添加成功'
  }
  if (isSubmitting.value || props.isLoading) {
    return isEditMode.value ? '更新中...' : '添加中...'
  }
  return isEditMode.value ? '更新任务' : '添加任务'
})

/**
 * 字符计数文本
 */
const charCountText = computed(() => {
  return `${formData.value.text.length}/${props.maxLength}`
})

/**
 * 验证错误信息 - 成功状态或初始状态时不显示错误
 */
const validationError = computed(() => {
  if (isSuccess.value || isInitialState.value) return ''
  return formErrors.value.join(', ')
})

/**
 * 获取优先级的中文标签
 * @param {string} priority - 优先级值
 * @returns {string} 中文标签
 */
function getPriorityLabel(priority) {
  const labels = {
    low: '低优先级',
    medium: '中优先级',
    high: '高优先级'
  }
  return labels[priority] || priority
}

/**
 * 可用的优先级选项
 */
const priorityOptions = computed(() => {
  return TASK_PRIORITIES.map(priority => ({
    value: priority,
    label: getPriorityLabel(priority)
  }))
})

// ==================== 监听器 ====================

/**
 * 监听初始任务数据变化
 */
watch(
  () => props.initialTask,
  (newTask) => {
    if (newTask && isEditMode.value) {
      formData.value.text = newTask.text || ''
      formData.value.priority = newTask.priority || 'medium'
    }
  },
  { immediate: true }
)

/**
 * 监听表单数据变化
 */
watch(
  formData,
  (newData) => {
    emit('input-change', newData)
    validateForm()
  },
  { deep: true }
)

/**
 * 监听焦点状态变化
 */
watch(isFocused, (focused) => {
  emit('focus-change', focused)
})

// ==================== 事件处理方法 ====================

/**
 * 处理表单提交
 */
async function handleSubmit() {
  if (!canSubmit.value) return
  
  // 清除之前的状态
  isSuccess.value = false
  successMessage.value = ''
  
  // 最终验证
  validateForm()
  if (formErrors.value.length > 0) {
    focusInput()
    return
  }
  
  try {
    isSubmitting.value = true
    
    // 构造提交数据
    const submitData = {
      text: formData.value.text.trim(),
      priority: formData.value.priority
    }
    
    // 发送提交事件
    emit('submit', submitData)
    
    // 如果是新建模式，显示成功状态
    if (!isEditMode.value) {
      showSuccessState()
    }
    
  } catch (error) {
    console.error('Form submit error:', error)
  } finally {
    isSubmitting.value = false
  }
}

/**
 * 显示成功状态
 */
function showSuccessState() {
  isSuccess.value = true
  successMessage.value = '任务创建成功！'
  
  // 1.5秒后重置表单
  setTimeout(() => {
    resetForm()
    isSuccess.value = false
    successMessage.value = ''
    // 重置后重新聚焦输入框，保持蓝色状态，但保持初始状态避免验证错误
    nextTick(() => {
      focusInput()
      isFocused.value = true
      showActions.value = true
      // 确保保持初始状态，避免显示验证错误
      isInitialState.value = true
    })
  }, 1500)
}

/**
 * 处理取消操作
 */
function handleCancel() {
  emit('cancel')
  if (!isEditMode.value) {
    resetForm()
  }
}

/**
 * 处理输入框聚焦
 */
function handleFocus() {
  isFocused.value = true
  showActions.value = true
  // 只有在用户主动聚焦且有内容时才认为不是初始状态
  // 如果是程序自动聚焦且内容为空，保持初始状态
  if (formData.value.text.trim()) {
    isInitialState.value = false
  }
}

/**
 * 处理输入框失焦
 */
function handleBlur() {
  // 延迟处理，避免点击按钮时失焦
  setTimeout(() => {
    isFocused.value = false
    if (!isEditMode.value && !formData.value.text.trim()) {
      showActions.value = false
    }
  }, 200)
}

/**
 * 处理输入变化
 */
function handleInput() {
  // 用户开始输入，不再是初始状态
  isInitialState.value = false
  // 实时验证
  validateForm()
}

/**
 * 处理键盘事件
 * @param {KeyboardEvent} event - 键盘事件
 */
function handleKeydown(event) {
  // 用户开始交互，不再是初始状态
  isInitialState.value = false
  
  switch (event.key) {
    case 'Enter':
      if (event.ctrlKey || event.metaKey) {
        // Ctrl+Enter 快速提交
        handleSubmit()
      } else if (!event.shiftKey) {
        // Enter 提交（Shift+Enter 换行，但这里是单行输入）
        event.preventDefault()
        handleSubmit()
      }
      break
      
    case 'Escape':
      // Escape 清空或取消
      if (formData.value.text.trim()) {
        clearForm()
      } else {
        handleCancel()
      }
      break
  }
}

// ==================== 工具方法 ====================

/**
 * 验证表单
 */
function validateForm() {
  const errors = []
  const text = formData.value.text.trim()
  
  // 验证文本内容
  if (!text) {
    errors.push('任务内容不能为空')
  } else if (text.length > props.maxLength) {
    errors.push(`任务内容长度不能超过${props.maxLength}字符`)
  }
  
  // 验证优先级
  if (!['low', 'medium', 'high'].includes(formData.value.priority)) {
    formData.value.priority = 'medium'
  }
  
  formErrors.value = errors
}

/**
 * 重置表单
 */
function resetForm() {
  formData.value.text = ''
  formData.value.priority = 'medium'
  formErrors.value = []
  showActions.value = false
  isInitialState.value = true
  // 同时清除成功和聚焦状态
  isSuccess.value = false
  successMessage.value = ''
  isFocused.value = false
}

/**
 * 清空表单
 */
function clearForm() {
  formData.value.text = ''
  formData.value.priority = 'medium'
  formErrors.value = []
  // 清空后回到初始状态
  isInitialState.value = true
  focusInput()
}

/**
 * 聚焦输入框
 */
function focusInput() {
  nextTick(() => {
    if (taskInputRef.value) {
      taskInputRef.value.focus()
    }
  })
}

// ==================== 生命周期 ====================

onMounted(() => {
  // 自动聚焦
  if (props.autoFocus) {
    focusInput()
  }
})
</script>

<style scoped>
.task-form {
  background: white;
  border-radius: 8px;
  padding: 16px;
  border: 1px solid #e5e7eb;
  transition: all 0.2s ease;
}

.task-form.form-focused {
  border-color: #3b82f6;
  box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
}

.task-form.form-success {
  border-color: #10b981;
  box-shadow: 0 0 0 3px rgba(16, 185, 129, 0.1);
}

.form-title {
  font-size: 18px;
  font-weight: 600;
  margin-bottom: 16px;
  color: #1f2937;
}

.form-main-input {
  position: relative;
  margin-bottom: 12px;
}

.task-input {
  width: 100%;
  padding: 12px 16px;
  border: 1px solid #d1d5db;
  border-radius: 6px;
  font-size: 16px;
  transition: all 0.2s ease;
  outline: none;
}

.task-input:focus {
  border-color: #3b82f6;
  box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
}

.task-input.input-success {
  border-color: #10b981;
  background-color: #f0fdf4;
}

.task-input.input-success:focus {
  box-shadow: 0 0 0 3px rgba(16, 185, 129, 0.1);
}

.task-input.input-error {
  border-color: #ef4444;
}

.task-input.input-error:focus {
  box-shadow: 0 0 0 3px rgba(239, 68, 68, 0.1);
}

.task-input:disabled {
  background-color: #f9fafb;
  cursor: not-allowed;
  opacity: 0.6;
}

.loading-indicator {
  position: absolute;
  right: 12px;
  top: 50%;
  transform: translateY(-50%);
}

.loading-spinner {
  display: inline-block;
  width: 16px;
  height: 16px;
  border: 2px solid #e5e7eb;
  border-radius: 50%;
  border-top-color: #3b82f6;
  animation: spin 1s ease-in-out infinite;
}

@keyframes spin {
  to { transform: rotate(360deg); }
}

.form-priority-selector {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 12px;
}

.priority-label {
  font-size: 14px;
  font-weight: 500;
  color: #374151;
}

.priority-select {
  padding: 6px 12px;
  border: 1px solid #d1d5db;
  border-radius: 6px;
  font-size: 14px;
  background: white;
  cursor: pointer;
}

.priority-select:focus {
  outline: 2px solid #3b82f6;
  outline-offset: 2px;
}

.priority-select:disabled {
  background-color: #f9fafb;
  cursor: not-allowed;
  opacity: 0.6;
}

.form-actions {
  display: flex;
  gap: 8px;
  opacity: 0;
  transform: translateY(-8px);
  transition: all 0.2s ease;
}

.form-actions.actions-visible {
  opacity: 1;
  transform: translateY(0);
}

.btn-submit, .btn-cancel {
  padding: 8px 16px;
  border-radius: 6px;
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s ease;
  border: 1px solid;
}

.btn-submit {
  padding: 10px 20px;
  background: #3b82f6;
  color: white;
  border: none;
  border-radius: 6px;
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s ease;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
}

.btn-submit:hover:not(:disabled) {
  background: #2563eb;
}

.btn-submit:disabled {
  background: #9ca3af;
  cursor: not-allowed;
}

.btn-submit.btn-success {
  background: #10b981;
  color: white;
}

.btn-submit.btn-success:hover {
  background: #059669;
}

.btn-submit.btn-loading {
  background: #6b7280;
  cursor: not-allowed;
}

.btn-cancel {
  background-color: white;
  color: #6b7280;
  border-color: #d1d5db;
}

.btn-cancel:hover:not(:disabled) {
  background-color: #f9fafb;
  border-color: #9ca3af;
}

.btn-cancel:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.form-error {
  color: #ef4444;
  font-size: 12px;
  margin-top: 4px;
  padding: 4px 8px;
  background-color: #fef2f2;
  border-radius: 4px;
  border: 1px solid #fecaca;
}

.form-success {
  color: #15803d;
  font-size: 12px;
  margin-top: 4px;
  padding: 4px 8px;
  background-color: #f0fdf4;
  border-radius: 4px;
  border: 1px solid #d1fae5;
}

.form-char-count {
  font-size: 12px;
  text-align: right;
  margin-top: 4px;
  transition: color 0.2s ease;
}

/* 主题样式 */
.theme-compact {
  padding: 12px;
}

.theme-compact .task-input {
  padding: 8px 12px;
  font-size: 14px;
}

.theme-compact .form-title {
  font-size: 16px;
  margin-bottom: 12px;
}

.theme-inline {
  background: transparent;
  border: none;
  padding: 8px;
}

.theme-inline .task-input {
  border: none;
  border-bottom: 1px solid #d1d5db;
  border-radius: 0;
  padding: 8px 4px;
}

.theme-inline .form-actions {
  opacity: 1;
  transform: none;
}

/* 响应式设计 */
@media (max-width: 640px) {
  .task-form {
    padding: 12px;
  }
  
  .form-actions {
    flex-direction: column;
  }
  
  .btn-submit, .btn-cancel {
    width: 100%;
  }
}
</style>