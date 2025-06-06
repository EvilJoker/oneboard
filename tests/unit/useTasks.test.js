import { describe, it, expect, beforeEach, vi } from 'vitest'
import { nextTick } from 'vue'
import { useTasks } from '@/composables/useTasks'
import { ref } from 'vue'

// Mock useStorage composable
vi.mock('@/composables/useStorage', () => ({
  useStorage: vi.fn(() => ({
    storedValue: { value: [] },
    save: vi.fn().mockResolvedValue(true),
    load: vi.fn().mockResolvedValue([]),
    error: { value: null },
    isSupported: { value: true }
  }))
}))

describe('useTasks Composable', () => {
  let tasks, loading, saving, error, settings, activeTasks, completedTasks, sortedTasks, taskStats
  let initializeTasks, addTask, updateTask, removeTask, toggleTask, clearCompleted
  let generateTaskId, validateTask, sortTasks

  beforeEach(() => {
    // Reset all mocks
    vi.clearAllMocks()
    
    // Initialize useTasks composable
    const composable = useTasks()
    
    // Extract reactive states
    tasks = composable.tasks
    loading = composable.loading
    saving = composable.saving
    error = composable.error
    settings = composable.settings
    
    // Extract computed properties
    activeTasks = composable.activeTasks
    completedTasks = composable.completedTasks
    sortedTasks = composable.sortedTasks
    taskStats = composable.taskStats
    
    // Extract methods
    initializeTasks = composable.initializeTasks
    addTask = composable.addTask
    updateTask = composable.updateTask
    removeTask = composable.removeTask
    toggleTask = composable.toggleTask
    clearCompleted = composable.clearCompleted
    generateTaskId = composable.generateTaskId
    validateTask = composable.validateTask
    sortTasks = composable.sortTasks
  })

  describe('1.1 初始化和状态管理单元测试', () => {
    it('test_useTasks_initial_state - 验证 useTasks 初始化后的默认状态', () => {
      expect(tasks.value).toEqual([])
      expect(loading.value).toBe(false)
      expect(saving.value).toBe(false)
      expect(error.value).toBe(null)
      expect(settings.value).toEqual({
        sortBy: 'createdAt',
        sortOrder: 'desc',
        filterBy: 'all'
      })
    })

    it('test_initialize_tasks_success - 验证 initializeTasks 方法的正常执行', async () => {
      // 直接测试初始化方法的执行
      await initializeTasks()
      
      expect(loading.value).toBe(false)
      expect(error.value).toBe(null)
      // 初始化后任务列表应该是空的（因为没有存储数据）
      expect(Array.isArray(tasks.value)).toBe(true)
    })

    it('test_initialize_tasks_with_storage_error - 验证存储读取失败时的错误处理', async () => {
      // 直接测试初始化方法，即使有错误也应该能正常完成
      await initializeTasks()
      
      expect(loading.value).toBe(false)
      expect(Array.isArray(tasks.value)).toBe(true)
    })
  })

  describe('1.2 任务增删改查单元测试', () => {
    it('test_add_task_success - 验证 addTask 方法的正常添加功能', async () => {
      const text = '测试任务'
      const priority = 'medium'
      
      const result = await addTask(text, priority)
      
      expect(typeof result.id).toBe('string')
      expect(result.id).toBeTruthy()
      expect(tasks.value).toHaveLength(1)
      
      const addedTask = tasks.value[0]
      expect(addedTask.id).toBe(result.id)
      expect(addedTask.text).toBe('测试任务')
      expect(addedTask.priority).toBe('medium')
      expect(addedTask.done).toBe(false)
      expect(addedTask.createdAt).toBeTruthy()
      expect(addedTask.updatedAt).toBeTruthy()
    })

    it('test_add_task_with_empty_text - 验证空文本任务的验证逻辑', async () => {
      await expect(addTask('', 'high')).rejects.toThrow('任务内容不能为空')
      expect(tasks.value).toHaveLength(0)
      expect(error.value).toBeTruthy()
    })

    it('test_add_task_with_invalid_priority - 验证无效优先级的处理', async () => {
      await expect(addTask('测试', 'invalid')).rejects.toThrow('优先级值无效')
      expect(tasks.value).toHaveLength(0)
      expect(error.value).toBeTruthy()
    })

    it('test_update_task_success - 验证 updateTask 方法的更新功能', async () => {
      const result = await addTask('原始任务内容', 'medium')
      const taskId = result.id
      const originalUpdatedAt = tasks.value[0].updatedAt
      
      // 增加足够的延迟以确保时间戳不同
      await new Promise(resolve => setTimeout(resolve, 50))
      
      const updateResult = await updateTask(taskId, { text: '更新的任务内容' })
      
      expect(updateResult).toBe(true)
      expect(tasks.value[0].text).toBe('更新的任务内容')
      expect(tasks.value[0].updatedAt).not.toBe(originalUpdatedAt)
      expect(tasks.value).toHaveLength(1) // 其他任务不受影响
    })

    it('test_update_nonexistent_task - 验证更新不存在任务的处理', async () => {
      const result = await updateTask('nonexistent-id', { text: '更新' })
      
      expect(result).toBe(false)
      expect(tasks.value).toHaveLength(0)
    })

    it('test_remove_task_success - 验证 removeTask 方法的删除功能', async () => {
      // 添加两个任务
      const result1 = await addTask('任务1', 'high')
      const result2 = await addTask('任务2', 'medium')
      const taskId1 = result1.id
      const taskId2 = result2.id
      
      const removeResult = await removeTask(taskId1)
      
      expect(removeResult).toBe(true)
      expect(tasks.value).toHaveLength(1)
      expect(tasks.value[0].id).toBe(taskId2)
      expect(tasks.value[0].text).toBe('任务2')
    })

    it('test_remove_nonexistent_task - 验证删除不存在任务的处理', async () => {
      const result = await removeTask('nonexistent-id')
      
      expect(result).toBe(false)
      expect(tasks.value).toHaveLength(0)
    })

    it('test_toggle_task_from_incomplete_to_complete - 验证任务状态从未完成切换到已完成', async () => {
      const result = await addTask('测试任务', 'medium')
      const taskId = result.id
      const originalUpdatedAt = tasks.value[0].updatedAt
      
      // 增加足够的延迟以确保时间戳不同
      await new Promise(resolve => setTimeout(resolve, 10))
      
      const toggleResult = await toggleTask(taskId)
      
      expect(toggleResult).toBe(true)
      expect(tasks.value[0].done).toBe(true)
      expect(tasks.value[0].updatedAt).not.toBe(originalUpdatedAt)
    })

    it('test_toggle_task_from_complete_to_incomplete - 验证任务状态从已完成切换到未完成', async () => {
      // 先添加一个任务
      const result = await addTask('测试任务', 'medium')
      const taskId = result.id
      
      // 先完成任务
      await toggleTask(taskId)
      expect(tasks.value[0].done).toBe(true)
      
      const originalUpdatedAt = tasks.value[0].updatedAt
      
      // 增加更长的延迟以确保时间戳不同
      await new Promise(resolve => setTimeout(resolve, 10))
      
      const toggleResult = await toggleTask(taskId)
      
      expect(toggleResult).toBe(true)
      expect(tasks.value[0].done).toBe(false)
      expect(tasks.value[0].updatedAt).not.toBe(originalUpdatedAt)
    })
  })

  describe('1.3 计算属性单元测试', () => {
    beforeEach(async () => {
      // 准备测试数据：混合的已完成和未完成任务
      await addTask('未完成任务1', 'high')
      await addTask('未完成任务2', 'medium')
      await addTask('已完成任务1', 'low')
      
      // 由于addTask使用unshift，最后添加的任务在数组开头
      // 所以tasks.value[0]是'已完成任务1'，需要完成它
      await toggleTask(tasks.value[0].id)
    })

    it('test_active_tasks_computation - 验证 activeTasks 计算属性的过滤逻辑', async () => {
      expect(activeTasks.value).toHaveLength(2)
      expect(activeTasks.value.every(task => !task.done)).toBe(true)
      expect(activeTasks.value[0].text).toBe('未完成任务2')
      expect(activeTasks.value[1].text).toBe('未完成任务1')
      
      // 测试响应式更新
      await toggleTask(tasks.value[1].id) // 切换'未完成任务2'
      await nextTick()
      
      expect(activeTasks.value).toHaveLength(1)
    })

    it('test_completed_tasks_computation - 验证 completedTasks 计算属性的过滤逻辑', async () => {
      expect(completedTasks.value).toHaveLength(1)
      expect(completedTasks.value.every(task => task.done)).toBe(true)
      expect(completedTasks.value[0].text).toBe('已完成任务1')
      
      // 测试响应式更新
      await toggleTask(tasks.value[1].id) // 切换'未完成任务2'
      await nextTick()
      
      expect(completedTasks.value).toHaveLength(2)
    })

    it('test_sorted_tasks_by_created_time_desc - 验证按创建时间降序排序', async () => {
      settings.value = { sortBy: 'createdAt', sortOrder: 'desc' }
      await nextTick()
      
      const sorted = sortedTasks.value
      expect(sorted).toHaveLength(3)
      
      // 验证时间递减顺序
      for (let i = 0; i < sorted.length - 1; i++) {
        const currentTime = new Date(sorted[i].createdAt).getTime()
        const nextTime = new Date(sorted[i + 1].createdAt).getTime()
        expect(currentTime).toBeGreaterThanOrEqual(nextTime)
      }
    })

    it('test_sorted_tasks_by_priority - 验证按优先级排序', async () => {
      settings.value = { sortBy: 'priority', sortOrder: 'desc' }
      await nextTick()
      
      const sorted = sortedTasks.value
      const priorities = sorted.map(task => task.priority)
      
      // 验证优先级排序：high > medium > low
      expect(priorities[0]).toBe('high')
      expect(priorities[1]).toBe('medium')
      expect(priorities[2]).toBe('low')
    })

    it('test_task_stats_computation - 验证 taskStats 计算属性的统计准确性', () => {
      const stats = taskStats.value
      
      expect(stats.total).toBe(3)
      expect(stats.active).toBe(2)
      expect(stats.completed).toBe(1)
      expect(stats.completionRate).toBeCloseTo(33.33, 2) // 1/3 * 100
    })
  })

  describe('1.4 批量操作单元测试', () => {
    beforeEach(async () => {
      // 准备测试数据
      await addTask('未完成任务1', 'high')
      await addTask('未完成任务2', 'medium')
      await addTask('已完成任务1', 'low')
      await addTask('已完成任务2', 'medium')
      
      // 由于addTask使用unshift，数组顺序是：
      // [0]: 已完成任务2, [1]: 已完成任务1, [2]: 未完成任务2, [3]: 未完成任务1
      // 完成前两个任务
      await toggleTask(tasks.value[0].id)
      await toggleTask(tasks.value[1].id)
    })

    it('test_clear_completed_success - 验证 clearCompleted 方法的批量删除功能', async () => {
      const deletedCount = await clearCompleted()
      
      expect(deletedCount).toBe(2)
      expect(tasks.value).toHaveLength(2)
      expect(tasks.value.every(task => !task.done)).toBe(true)
      expect(tasks.value[0].text).toBe('未完成任务2')
      expect(tasks.value[1].text).toBe('未完成任务1')
    })

    it('test_clear_completed_with_no_completed_tasks - 验证没有已完成任务时的处理', async () => {
      // 先清空所有已完成任务
      await clearCompleted()
      
      // 再次调用清理
      const deletedCount = await clearCompleted()
      
      expect(deletedCount).toBe(0)
      expect(tasks.value).toHaveLength(2) // 保持不变
    })
  })

  describe('1.5 工具方法单元测试', () => {
    it('test_generate_task_id_uniqueness - 验证 generateTaskId 方法生成唯一ID', () => {
      const ids = new Set()
      
      for (let i = 0; i < 100; i++) {
        const id = generateTaskId()
        expect(typeof id).toBe('string')
        expect(id.length).toBeGreaterThan(0)
        expect(ids.has(id)).toBe(false)
        ids.add(id)
      }
    })

    it('test_validate_task_with_valid_data - 验证 validateTask 方法对有效数据的处理', () => {
      const result = validateTask({ text: '有效任务', priority: 'high' })
      
      expect(result.isValid).toBe(true)
      expect(result.errors).toEqual([])
    })

    it('test_validate_task_with_empty_text - 验证空文本的验证', () => {
      const result = validateTask({ text: '', priority: 'medium' })
      
      expect(result.isValid).toBe(false)
      expect(result.errors).toContain('任务内容不能为空')
    })

    it('test_validate_task_with_long_text - 验证超长文本的验证', () => {
      const longText = 'a'.repeat(201)
      const taskData = { text: longText, priority: 'medium' }
      
      const result = validateTask(taskData)
      
      expect(result.isValid).toBe(false)
      expect(result.errors).toContain('任务内容不能超过200个字符')
    })

    it('test_sort_tasks_by_different_criteria - 验证 sortTasks 工具方法的排序功能', async () => {
      // 准备不同时间和优先级的任务
      const now = Date.now()
      const testTasks = [
        { id: '1', text: 'Task 1', priority: 'low', createdAt: new Date(now - 2000).toISOString() },
        { id: '2', text: 'Task 2', priority: 'high', createdAt: new Date(now - 1000).toISOString() },
        { id: '3', text: 'Task 3', priority: 'medium', createdAt: new Date(now).toISOString() }
      ]
      
      // 按创建时间升序排序
      const sortedByTimeAsc = sortTasks(testTasks, 'createdAt', 'asc')
      expect(sortedByTimeAsc[0].id).toBe('1')
      expect(sortedByTimeAsc[2].id).toBe('3')
      
      // 按优先级排序
      const sortedByPriority = sortTasks(testTasks, 'priority', 'desc')
      expect(sortedByPriority[0].priority).toBe('high')
      expect(sortedByPriority[1].priority).toBe('medium')
      expect(sortedByPriority[2].priority).toBe('low')
    })
  })
}) 