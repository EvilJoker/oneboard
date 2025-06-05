import { ref, computed, watch } from 'vue'
import { useStorage } from './useStorage.js'
import { TASK_PRIORITIES, DEFAULT_PRIORITY } from '../constants/componentDefaults.js'

/**
 * 任务管理组合式函数
 * 提供任务的CRUD操作、状态管理、排序筛选等功能
 * 基于localStorage实现数据持久化
 */
export function useTasks() {
  // ==================== 初始化存储 ====================
  const { 
    storedValue: storedTasks, 
    save: saveToStorage, 
    error: storageError,
    isSupported: storageSupported 
  } = useStorage('tasks', [], {
    validator: (data) => Array.isArray(data),
    errorHandler: (err) => {
      console.error('Storage error:', err)
      error.value = err.message
    }
  })

  // ==================== 响应式状态 ====================
  
  /** @type {import('vue').Ref<Task[]>} 任务列表 */
  const tasks = ref([])
  
  /** @type {import('vue').Ref<boolean>} 数据加载状态 */
  const loading = ref(false)
  
  /** @type {import('vue').Ref<boolean>} 数据保存状态 */
  const saving = ref(false)
  
  /** @type {import('vue').Ref<string|null>} 错误信息 */
  const error = ref(null)
  
  /** @type {import('vue').Ref<object>} 任务设置 */
  const settings = ref({
    sortBy: 'createdAt', // 'createdAt' | 'priority' | 'text'
    sortOrder: 'desc',   // 'asc' | 'desc'
    filterBy: 'all'      // 'all' | 'active' | 'completed'
  })

  // ==================== 计算属性 ====================
  
  /**
   * 未完成的任务列表
   * @type {import('vue').ComputedRef<Task[]>}
   */
  const activeTasks = computed(() => {
    return tasks.value.filter(task => !task.done)
  })
  
  /**
   * 已完成的任务列表
   * @type {import('vue').ComputedRef<Task[]>}
   */
  const completedTasks = computed(() => {
    return tasks.value.filter(task => task.done)
  })
  
  /**
   * 排序后的任务列表
   * @type {import('vue').ComputedRef<Task[]>}
   */
  const sortedTasks = computed(() => {
    return sortTasks(tasks.value, settings.value.sortBy, settings.value.sortOrder)
  })
  
  /**
   * 任务统计信息
   * @type {import('vue').ComputedRef<TaskStats>}
   */
  const taskStats = computed(() => {
    const total = tasks.value.length
    const active = activeTasks.value.length
    const completed = completedTasks.value.length
    const completionRate = total > 0 ? Math.round((completed / total) * 100 * 100) / 100 : 0
    
    return {
      total,
      active,
      completed,
      completionRate
    }
  })
  
  /**
   * 当前状态（状态机）
   * @type {import('vue').ComputedRef<'idle'|'loading'|'ready'|'saving'|'error'>}
   */
  const state = computed(() => {
    if (error.value) return 'error'
    if (loading.value) return 'loading'
    if (saving.value) return 'saving'
    if (tasks.value.length >= 0) return 'ready'
    return 'idle'
  })

  // ==================== 核心方法 ====================
  
  /**
   * 初始化任务数据，从localStorage加载
   * @returns {Promise<void>}
   */
  async function initializeTasks() {
    try {
      loading.value = true
      error.value = null
      
      // 从存储加载任务数据
      const loadedTasks = storedTasks.value
      
      // 数据验证和格式化
      if (Array.isArray(loadedTasks)) {
        // 验证每个任务的格式
        const validTasks = loadedTasks.filter(task => {
          return task && typeof task.id === 'string' && typeof task.text === 'string'
        }).map(task => ({
          id: task.id,
          text: task.text,
          done: Boolean(task.done),
          priority: ['low', 'medium', 'high'].includes(task.priority) ? task.priority : 'medium',
          createdAt: task.createdAt || new Date().toISOString(),
          updatedAt: task.updatedAt || task.createdAt || new Date().toISOString()
        }))
        
        tasks.value = validTasks
      } else {
        tasks.value = []
      }
      
    } catch (err) {
      handleError(err, 'initializeTasks')
    } finally {
      loading.value = false
    }
  }
  
  /**
   * 验证任务数据
   * @param {Object} taskData - 要验证的任务数据
   * @returns {Object} 验证结果 { isValid: boolean, errors: string[] }
   */
  const validateTask = (taskData) => {
    const errors = []
    
    // 验证任务文本
    if (!taskData.text || typeof taskData.text !== 'string') {
      errors.push('任务内容不能为空')
    } else if (taskData.text.trim().length === 0) {
      errors.push('任务内容不能为空')
    } else if (taskData.text.trim().length > 200) {
      errors.push('任务内容不能超过200个字符')
    }
    
    // 验证优先级
    if (taskData.priority && !TASK_PRIORITIES.includes(taskData.priority)) {
      errors.push('优先级值无效')
    }
    
    return {
      isValid: errors.length === 0,
      errors
    }
  }
  
  /**
   * 添加新任务
   * @param {string} text - 任务内容
   * @param {string} [priority='medium'] - 任务优先级
   * @returns {Task} 添加成功的任务对象
   * @throws {Error} 验证失败或添加失败时抛出错误
   */
  const addTask = async (text, priority = DEFAULT_PRIORITY) => {
    try {
      // 验证输入数据
      const validation = validateTask({ text, priority })
      if (!validation.isValid) {
        error.value = validation.errors.join(', ')
        throw new Error(validation.errors.join(', '))
      }
      
      // 生成任务ID和时间戳
      const taskId = generateTaskId()
      const now = new Date().toISOString()
      
      // 创建任务对象
      const newTask = {
        id: taskId,
        text: text.trim(),
        done: false,
        priority: priority,
        createdAt: now,
        updatedAt: now
      }
      
      // 添加到任务列表
      tasks.value.unshift(newTask) // 新任务添加到顶部
      
      // 保存到存储
      await saveTasksToStorage()
      
      return newTask
    } catch (err) {
      handleError(err, 'addTask')
      throw err
    }
  }
  
  /**
   * 更新任务信息
   * @param {string} id - 任务ID
   * @param {Partial<Task>} updates - 要更新的字段
   * @returns {Promise<boolean>} 更新是否成功
   */
  async function updateTask(id, updates) {
    try {
      // 查找目标任务
      const taskIndex = tasks.value.findIndex(task => task.id === id)
      if (taskIndex === -1) {
        return false
      }
      
      // 验证更新数据
      if (updates.text !== undefined) {
        const validation = validateTask({ text: updates.text })
        if (!validation.isValid) {
          error.value = validation.errors.join(', ')
          return false
        }
      }
      
      // 合并更新内容
      const updatedTask = {
        ...tasks.value[taskIndex],
        ...updates,
        updatedAt: new Date().toISOString()
      }
      
      // 更新任务
      tasks.value[taskIndex] = updatedTask
      
      // 保存到存储
      await saveTasksToStorage()
      
      return true
    } catch (err) {
      handleError(err, 'updateTask')
      return false
    }
  }
  
  /**
   * 删除任务
   * @param {string} id - 任务ID
   * @returns {Promise<boolean>} 删除是否成功
   */
  async function removeTask(id) {
    try {
      // 查找目标任务
      const taskIndex = tasks.value.findIndex(task => task.id === id)
      if (taskIndex === -1) {
        return false
      }
      
      // 从列表中移除
      tasks.value.splice(taskIndex, 1)
      
      // 保存到存储
      await saveTasksToStorage()
      
      return true
    } catch (err) {
      handleError(err, 'removeTask')
      return false
    }
  }
  
  /**
   * 切换任务完成状态
   * @param {string} id - 任务ID
   * @returns {Promise<boolean>} 切换是否成功
   */
  async function toggleTask(id) {
    try {
      // 查找目标任务
      const taskIndex = tasks.value.findIndex(task => task.id === id)
      if (taskIndex === -1) {
        return false
      }
      
      // 切换done状态
      tasks.value[taskIndex] = {
        ...tasks.value[taskIndex],
        done: !tasks.value[taskIndex].done,
        updatedAt: new Date().toISOString()
      }
      
      // 保存到存储
      await saveTasksToStorage()
      
      return true
    } catch (err) {
      handleError(err, 'toggleTask')
      return false
    }
  }
  
  /**
   * 批量删除已完成的任务
   * @returns {Promise<number>} 删除的任务数量
   */
  async function clearCompleted() {
    try {
      const beforeCount = tasks.value.length
      
      // 筛选未完成任务
      tasks.value = tasks.value.filter(task => !task.done)
      
      const deletedCount = beforeCount - tasks.value.length
      
      if (deletedCount > 0) {
        // 保存到存储
        await saveTasksToStorage()
      }
      
      return deletedCount
    } catch (err) {
      handleError(err, 'clearCompleted')
      return 0
    }
  }

  // ==================== 工具方法 ====================
  
  /**
   * 生成唯一的任务ID
   * @returns {string} 任务ID
   */
  function generateTaskId() {
    return `task_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
  }
  
  /**
   * 任务排序函数
   * @param {Task[]} taskList - 任务列表
   * @param {string} sortBy - 排序字段
   * @param {string} sortOrder - 排序顺序
   * @returns {Task[]} 排序后的任务列表
   */
  function sortTasks(taskList, sortBy = 'createdAt', sortOrder = 'desc') {
    const sorted = [...taskList].sort((a, b) => {
      let comparison = 0
      
      switch (sortBy) {
        case 'createdAt':
        case 'updatedAt':
          comparison = new Date(a[sortBy]).getTime() - new Date(b[sortBy]).getTime()
          break
        
        case 'priority':
          const priorityOrder = { high: 3, medium: 2, low: 1 }
          comparison = priorityOrder[a.priority] - priorityOrder[b.priority]
          break
        
        case 'text':
          comparison = a.text.localeCompare(b.text)
          break
        
        default:
          comparison = 0
      }
      
      return sortOrder === 'desc' ? -comparison : comparison
    })
    
    return sorted
  }
  
  /**
   * 更新任务设置
   * @param {Object} newSettings - 新的设置
   * @returns {Promise<void>}
   */
  async function updateSettings(newSettings) {
    try {
      settings.value = {
        ...settings.value,
        ...newSettings
      }
    } catch (err) {
      handleError(err, 'updateSettings')
      throw err
    }
  }
  
  /**
   * 保存任务到存储
   * @returns {Promise<void>}
   */
  async function saveTasksToStorage() {
    try {
      saving.value = true
      // 直接更新存储的值
      storedTasks.value = tasks.value
    } catch (err) {
      handleError(err, 'saveTasksToStorage')
      throw err
    } finally {
      saving.value = false
    }
  }
  
  /**
   * 错误处理函数
   * @param {Error} err - 错误对象
   * @param {string} operation - 操作名称
   */
  function handleError(err, operation) {
    console.error(`useTasks ${operation} error:`, err)
    error.value = err.message || `${operation} 操作失败`
  }

  // ==================== 自动初始化 ====================
  
  // 组件挂载时自动初始化
  initializeTasks()

  // ==================== 返回API ====================
  
  return {
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
    updateSettings,
    
    // 工具方法
    generateTaskId,
    validateTask,
    sortTasks
  }
}

// ==================== 类型定义 ====================

/**
 * @typedef {Object} Task
 * @property {string} id - 唯一标识符
 * @property {string} text - 任务内容
 * @property {boolean} done - 完成状态
 * @property {string} createdAt - 创建时间(ISO 8601)
 * @property {string} updatedAt - 更新时间(ISO 8601)
 * @property {'low'|'medium'|'high'} [priority] - 优先级
 */

/**
 * @typedef {Object} TaskStats
 * @property {number} total - 总任务数
 * @property {number} active - 未完成任务数
 * @property {number} completed - 已完成任务数
 * @property {number} completionRate - 完成率(0-100)
 */

/**
 * @typedef {Object} TaskSettings
 * @property {boolean} showCompleted - 是否显示已完成任务
 * @property {'createdAt'|'priority'|'text'} sortBy - 排序字段
 * @property {'asc'|'desc'} sortOrder - 排序方向
 */ 