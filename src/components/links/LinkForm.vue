<template>
  <div v-if="visible" class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50" data-testid="form-container">
    <div class="bg-white rounded-lg shadow-xl p-6 w-full max-w-md mx-4">
      <h2 class="text-xl font-semibold mb-4" data-testid="form-title">{{ title }}</h2>
      
      <form @submit.prevent="handleSubmit" class="space-y-4" data-testid="form">
        <!-- 链接名称输入框 -->
        <div>
          <label for="name" class="block text-sm font-medium text-gray-700 mb-1">
            链接名称
          </label>
          <input
            id="name"
            v-model="formData.name"
            type="text"
            data-testid="name-input"
            class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            :class="{ 'border-red-500': errors.name.length > 0 }"
            placeholder="请输入链接名称"
            @input="validateField('name', $event.target.value)"
          />
          <div v-if="errors.name.length > 0" class="mt-1 text-sm text-red-600" data-testid="name-error">
            {{ errors.name[0] }}
          </div>
        </div>

        <!-- URL输入框 -->
        <div>
          <label for="url" class="block text-sm font-medium text-gray-700 mb-1">
            链接地址
          </label>
          <input
            id="url"
            v-model="formData.url"
            type="url"
            data-testid="url-input"
            class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            :class="{ 'border-red-500': errors.url.length > 0 }"
            placeholder="https://example.com"
            @input="validateField('url', $event.target.value)"
          />
          <div v-if="errors.url.length > 0" class="mt-1 text-sm text-red-600" data-testid="url-error">
            {{ errors.url[0] }}
          </div>
        </div>

        <!-- 图标输入框（可选） -->
        <div>
          <label for="icon" class="block text-sm font-medium text-gray-700 mb-1">
            图标（可选）
          </label>
          <input
            id="icon"
            v-model="formData.icon"
            type="text"
            data-testid="icon-input"
            class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            placeholder="图标名称或URL"
          />
        </div>

        <!-- 通用错误信息 -->
        <div v-if="errors.general.length > 0" class="text-sm text-red-600">
          {{ errors.general[0] }}
        </div>

        <!-- 按钮组 -->
        <div class="flex justify-end space-x-3 pt-4">
          <button
            type="button"
            data-testid="cancel-button"
            class="px-4 py-2 text-gray-700 bg-gray-200 rounded-md hover:bg-gray-300 focus:outline-none focus:ring-2 focus:ring-gray-500"
            @click="handleCancel"
          >
            取消
          </button>
          <button
            type="submit"
            data-testid="submit-button"
            class="px-4 py-2 text-white bg-blue-600 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
            :class="{ 'opacity-50 cursor-not-allowed': !isFormValid || isSubmitting }"
            :disabled="!isFormValid || isSubmitting"
          >
            <span v-if="isSubmitting">提交中...</span>
            <span v-else>{{ initialLink ? '更新' : '添加' }}</span>
          </button>
        </div>
      </form>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, watch, nextTick } from 'vue'

/**
 * 链接表单组件
 * 用于新增和编辑快捷链接
 */

/**
 * 组件 Props 接口定义
 */
const props = defineProps({
  /**
   * 编辑模式的初始链接数据
   * @type {Object|null}
   */
  initialLink: {
    type: Object,
    default: null,
    validator: (link) => {
      // 接口定义：如果提供初始数据，必须包含基本字段
      return !link || (link.name && link.url)
    }
  },
  
  /**
   * 表单标题
   * @type {string}
   */
  title: {
    type: String,
    default: '添加链接'
  },
  
  /**
   * 是否显示表单
   * @type {boolean}
   */
  visible: {
    type: Boolean,
    default: false
  }
})

/**
 * 组件事件接口定义
 */
const emit = defineEmits([
  /**
   * 表单提交事件
   * @param {Object} linkData - 表单数据 {name: string, url: string, icon?: string}
   */
  'submit',
  
  /**
   * 取消操作事件
   */
  'cancel',
  
  /**
   * 表单验证状态变化事件
   * @param {boolean} isValid - 表单是否有效
   */
  'validation-change'
])

/**
 * 表单数据响应式引用
 */
const formData = ref({
  name: '',
  url: '',
  icon: ''
})

/**
 * 表单验证错误信息
 */
const errors = ref({
  name: [],
  url: [],
  general: []
})

/**
 * 表单提交状态
 */
const isSubmitting = ref(false)

/**
 * 计算属性：表单是否有效
 * @returns {boolean} 表单验证是否通过
 */
const isFormValid = computed(() => {
  return formData.value.name.trim().length > 0 &&
         formData.value.url.trim().length > 0 &&
         errors.value.name.length === 0 &&
         errors.value.url.length === 0 &&
         errors.value.general.length === 0
})

/**
 * 验证链接名称
 * @param {string} name - 链接名称
 * @returns {string[]} 错误信息数组
 */
const validateName = (name) => {
  const nameErrors = []
  
  if (!name || name.trim().length === 0) {
    nameErrors.push('链接名称不能为空')
  } else if (name.trim().length > 50) {
    nameErrors.push('链接名称不能超过50个字符')
  }
  
  return nameErrors
}

/**
 * 验证URL格式
 * @param {string} url - URL地址
 * @returns {string[]} 错误信息数组
 */
const validateUrl = (url) => {
  const urlErrors = []
  
  if (!url || url.trim().length === 0) {
    urlErrors.push('URL不能为空')
  } else {
    try {
      new URL(url)
    } catch {
      urlErrors.push('URL格式无效')
    }
  }
  
  return urlErrors
}

/**
 * 实时验证单个字段
 * @param {string} field - 字段名称
 * @param {string} value - 字段值
 */
const validateField = (field, value) => {
  switch (field) {
    case 'name':
      errors.value.name = validateName(value)
      break
    case 'url':
      errors.value.url = validateUrl(value)
      break
  }
  
  // 清除通用错误
  errors.value.general = []
  
  // 触发验证状态变化事件
  emit('validation-change', isFormValid.value)
}

/**
 * 验证整个表单
 * @returns {boolean} 表单是否有效
 */
const validateForm = () => {
  errors.value.name = validateName(formData.value.name)
  errors.value.url = validateUrl(formData.value.url)
  errors.value.general = []
  
  return isFormValid.value
}

/**
 * 处理表单提交
 * @param {Event} event - 提交事件
 */
const handleSubmit = async (event) => {
  event.preventDefault()
  
  if (!validateForm()) {
    return
  }
  
  try {
    isSubmitting.value = true
    errors.value.general = []
    
    const submitData = {
      name: formData.value.name.trim(),
      url: formData.value.url.trim(),
      ...(formData.value.icon.trim() && { icon: formData.value.icon.trim() })
    }
    
    emit('submit', submitData)
  } catch (error) {
    errors.value.general = [error.message || '提交失败，请重试']
  } finally {
    isSubmitting.value = false
  }
}

/**
 * 处理取消操作
 */
const handleCancel = () => {
  // 先触发取消事件，让父组件关闭表单
  emit('cancel')
  // 然后重置表单数据
  resetForm()
}

/**
 * 重置表单数据
 */
const resetForm = () => {
  formData.value = {
    name: '',
    url: '',
    icon: ''
  }
  
  errors.value = {
    name: [],
    url: [],
    general: []
  }
  
  isSubmitting.value = false
}

/**
 * 初始化表单数据（编辑模式）
 * @param {Object} linkData - 初始链接数据
 */
const initializeForm = (linkData) => {
  if (linkData) {
    formData.value = {
      name: linkData.name || '',
      url: linkData.url || '',
      icon: linkData.icon || ''
    }
  } else {
    resetForm()
  }
}

// 监听 initialLink 变化
watch(() => props.initialLink, (newLink) => {
  initializeForm(newLink)
}, { immediate: true })

// 监听 visible 变化，在表单显示时初始化
watch(() => props.visible, (newVisible) => {
  if (newVisible) {
    nextTick(() => {
      initializeForm(props.initialLink)
    })
  }
})

// 监听表单验证状态变化
watch(isFormValid, (newValid) => {
  emit('validation-change', newValid)
})
</script>

<style scoped>
/* 表单样式已通过 Tailwind CSS 类实现 */
</style> 