<template>
  <!-- 
    链接项组件模板
    - 显示链接图标、名称
    - 支持点击跳转和删除操作
    - 响应式布局适配
  -->
  <div 
    class="group relative bg-white rounded-lg shadow-sm border border-gray-200 hover:shadow-md transition-shadow duration-200 p-4"
    :class="{ 'opacity-50 cursor-not-allowed disabled': disabled }"
    data-testid="link-container"
  >
    <!-- 链接主体 -->
    <div 
      class="flex items-center space-x-3 cursor-pointer"
      :class="{ 'pointer-events-none': disabled }"
      @click="handleLinkClick"
      data-testid="link-main"
    >
      <!-- 图标 -->
      <div class="flex-shrink-0">
        <div 
          v-if="link.icon"
          class="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center"
          data-testid="link-icon"
          :class="getIconClass(link.icon)"
        >
          <span class="text-sm font-medium text-gray-600">
            {{ link.icon.charAt(0).toUpperCase() }}
          </span>
        </div>
        <div 
          v-else
          class="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center"
          data-testid="default-icon"
        >
          <span class="text-sm font-medium text-gray-600">🔗</span>
        </div>
      </div>

      <!-- 链接信息 -->
      <div class="flex-1 min-w-0">
        <h3 
          class="text-sm font-medium text-gray-900 truncate"
          data-testid="link-name"
        >
          {{ link.name }}
        </h3>
        <p class="text-xs text-gray-500 truncate">
          {{ link.url }}
        </p>
      </div>
    </div>

    <!-- 操作按钮 -->
    <div 
      v-if="showDelete || $slots.actions"
      class="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity duration-200 flex space-x-1"
    >
      <!-- 编辑按钮 -->
      <button
        type="button"
        class="p-1 text-gray-400 hover:text-blue-600 rounded"
        data-testid="edit-button"
        @click.stop="handleEdit"
        title="编辑链接"
      >
        <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
        </svg>
      </button>
      
      <!-- 删除按钮 -->
      <button
        v-if="showDelete"
        type="button"
        class="p-1 text-gray-400 hover:text-red-600 rounded"
        data-testid="delete-button"
        @click.stop="handleDelete"
        title="删除链接"
      >
        <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
        </svg>
      </button>
      
      <!-- 自定义操作插槽 -->
      <slot name="actions" />
    </div>
  </div>
</template>

<script setup>
/**
 * 单个链接项组件
 * 用于展示和操作单个快捷链接
 */

/**
 * 组件 Props 接口定义
 */
const props = defineProps({
  /**
   * 链接数据对象
   * @type {Object}
   * @property {string} id - 链接唯一标识
   * @property {string} name - 链接显示名称
   * @property {string} url - 链接URL地址
   * @property {string} [icon] - 可选图标标识
   */
  link: {
    type: Object,
    required: true,
    validator: (link) => {
      // 接口定义：验证link对象必须包含id、name、url字段
      return link && 
             typeof link.id === 'string' && 
             typeof link.name === 'string' && 
             typeof link.url === 'string'
    }
  },
  
  /**
   * 是否显示删除按钮
   * @type {boolean}
   */
  showDelete: {
    type: Boolean,
    default: true
  },
  
  /**
   * 是否禁用链接点击
   * @type {boolean}
   */
  disabled: {
    type: Boolean,
    default: false
  }
})

/**
 * 组件事件接口定义
 */
const emit = defineEmits([
  /**
   * 链接点击事件
   * @param {Object} link - 被点击的链接对象
   */
  'click',
  
  /**
   * 删除链接事件
   * @param {string} linkId - 要删除的链接ID
   */
  'delete',
  
  /**
   * 编辑链接事件
   * @param {Object} link - 要编辑的链接对象
   */
  'edit'
])

/**
 * 处理链接点击
 * @param {Event} event - 点击事件对象
 */
const handleLinkClick = (event) => {
  if (props.disabled) {
    return
  }
  
  // 触发点击事件
  emit('click', props.link)
  
  // 在新窗口打开链接
  try {
    window.open(props.link.url, '_blank', 'noopener,noreferrer')
  } catch (error) {
    console.warn('Failed to open link:', error)
  }
}

/**
 * 处理删除操作
 * @param {Event} event - 点击事件对象
 */
const handleDelete = (event) => {
  // 阻止事件冒泡
  event.stopPropagation()
  
  // 触发删除事件
  emit('delete', props.link.id)
}

/**
 * 处理编辑操作
 * @param {Event} event - 点击事件对象
 */
const handleEdit = (event) => {
  // 阻止事件冒泡
  event.stopPropagation()
  
  // 触发编辑事件
  emit('edit', props.link)
}

/**
 * 获取图标组件或类名
 * @param {string} iconName - 图标标识
 * @returns {string} 图标类名或组件名
 */
const getIconClass = (iconName) => {
  // 根据图标名称返回对应的CSS类
  const iconMap = {
    github: 'bg-gray-900 text-white',
    stackoverflow: 'bg-orange-500 text-white',
    mdn: 'bg-blue-600 text-white',
    vue: 'bg-green-500 text-white',
    tailwind: 'bg-cyan-500 text-white',
    vite: 'bg-purple-600 text-white'
  }
  
  return iconMap[iconName] || 'bg-gray-100 text-gray-600'
}
</script>

<style scoped>
/* 
  组件样式接口定义
  - 卡片布局样式
  - 悬停效果
  - 响应式适配
  - 无障碍访问支持
*/
</style> 