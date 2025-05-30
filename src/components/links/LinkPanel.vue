<template>
  <div class="link-panel" data-testid="link-panel">
    <!-- 面板头部 -->
    <div class="flex justify-between items-center mb-6">
      <h2 class="text-2xl font-bold text-gray-900">{{ title }}</h2>
      <button
        v-if="allowAdd"
        @click="handleAddLink"
        class="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
        data-testid="add-link-button"
      >
        + 添加链接
      </button>
    </div>

    <!-- 加载状态 -->
    <div v-if="loading" class="flex justify-center py-12" data-testid="loading">
      <div class="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
    </div>

    <!-- 错误状态 -->
    <div v-else-if="error" class="text-center py-12" data-testid="error">
      <div class="text-red-600 mb-4">{{ error }}</div>
      <button
        @click="initializeLinks"
        class="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700"
      >
        重试
      </button>
    </div>

    <!-- 链接网格 -->
    <div v-else-if="links.length > 0" :class="getGridClass()" class="gap-4" data-testid="links-grid">
      <LinkItem
        v-for="link in links"
        :key="link.id"
        :link="link"
        :show-delete="allowDelete"
        @click="handleLinkClick"
        @edit="handleEditLink"
        @delete="handleDeleteLink"
      />
    </div>

    <!-- 空状态 -->
    <div v-else class="text-center py-12" data-testid="empty-state">
      <div class="text-gray-500 mb-4">还没有添加任何链接</div>
      <button
        v-if="allowAdd"
        @click="handleAddLink"
        class="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
      >
        添加第一个链接
      </button>
    </div>

    <!-- 链接表单 -->
    <LinkForm
      v-if="showForm"
      :visible="showForm"
      :link="editingLink"
      @submit="handleFormSubmit"
      @cancel="handleFormCancel"
    />
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useLinks } from '../../composables/useLinks.js'
import LinkItem from './LinkItem.vue'
import LinkForm from './LinkForm.vue'

/**
 * 快捷链接面板主组件
 * 整合链接展示、添加、编辑、删除功能
 */

/**
 * 组件 Props 接口定义
 */
const props = defineProps({
  /**
   * 面板标题
   * @type {string}
   */
  title: {
    type: String,
    default: '快捷链接'
  },
  
  /**
   * 每行显示的链接数量
   * @type {number}
   */
  columnsPerRow: {
    type: Number,
    default: 3,
    validator: (value) => value > 0 && value <= 6
  },
  
  /**
   * 是否允许添加新链接
   * @type {boolean}
   */
  allowAdd: {
    type: Boolean,
    default: true
  },
  
  /**
   * 是否允许删除链接
   * @type {boolean}
   */
  allowDelete: {
    type: Boolean,
    default: true
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
  'link-click',
  
  /**
   * 链接添加成功事件
   * @param {Object} link - 新添加的链接对象
   */
  'link-added',
  
  /**
   * 链接删除成功事件
   * @param {string} linkId - 被删除的链接ID
   */
  'link-deleted',
  
  /**
   * 错误事件
   * @param {Error} error - 错误对象
   */
  'error'
])

/**
 * 使用链接管理 Composable
 */
const {
  links,
  loading,
  error,
  initializeLinks,
  addLink,
  removeLink,
  updateLink
} = useLinks()

/**
 * 表单显示状态
 */
const showForm = ref(false)

/**
 * 当前编辑的链接
 */
const editingLink = ref(null)

/**
 * 删除确认状态
 */
const deletingLinkId = ref(null)

/**
 * 处理链接点击
 * @param {Object} link - 被点击的链接对象
 */
const handleLinkClick = (link) => {
  window.open(link.url, '_blank')
  emit('link-click', link)
}

/**
 * 处理添加链接
 */
const handleAddLink = () => {
  editingLink.value = null
  showForm.value = true
}

/**
 * 处理编辑链接
 * @param {Object} link - 要编辑的链接对象
 */
const handleEditLink = (link) => {
  editingLink.value = { ...link }
  showForm.value = true
}

/**
 * 处理删除链接
 * @param {string} linkId - 要删除的链接ID
 */
const handleDeleteLink = async (linkId) => {
  if (confirm('确定要删除这个链接吗？')) {
    try {
      await removeLink(linkId)
      emit('link-deleted', linkId)
    } catch (err) {
      emit('error', err)
    }
  }
}

/**
 * 处理表单提交
 * @param {Object} linkData - 表单数据
 */
const handleFormSubmit = async (linkData) => {
  try {
    if (editingLink.value) {
      await updateLink(editingLink.value.id, linkData)
    } else {
      await addLink(linkData)
      emit('link-added', linkData)
    }
    showForm.value = false
    editingLink.value = null
  } catch (err) {
    emit('error', err)
  }
}

/**
 * 处理表单取消
 */
const handleFormCancel = () => {
  showForm.value = false
  editingLink.value = null
}

/**
 * 计算网格列数的CSS类
 * @returns {string} Tailwind CSS 网格类名
 */
const getGridClass = () => {
  const gridClasses = {
    1: 'grid-cols-1',
    2: 'grid-cols-1 md:grid-cols-2',
    3: 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3',
    4: 'grid-cols-1 md:grid-cols-2 lg:grid-cols-4',
    5: 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5',
    6: 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6'
  }
  return `grid ${gridClasses[props.columnsPerRow] || gridClasses[3]}`
}

/**
 * 处理错误
 * @param {Error} err - 错误对象
 */
const handleError = (err) => {
  // 接口定义：记录错误并触发错误事件
}

/**
 * 组件挂载时初始化
 */
onMounted(async () => {
  try {
    await initializeLinks()
  } catch (err) {
    emit('error', err)
  }
})
</script>

<style scoped>
/* 
  面板样式接口定义
  - 容器布局
  - 网格系统
  - 响应式断点
  - 加载状态样式
*/
.link-panel {
  @apply w-full;
}
</style> 