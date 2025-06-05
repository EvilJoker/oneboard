import { describe, it, expect, beforeEach, vi } from 'vitest'
import { mount } from '@vue/test-utils'
import { nextTick } from 'vue'
import TaskItem from '@/components/tasks/TaskItem.vue'

describe('TaskItem Component', () => {
  let wrapper
  const mockTask = {
    id: 'task-1',
    text: '测试任务',
    done: false,
    priority: 'high',
    createdAt: '2024-01-01T10:00:00Z',
    updatedAt: '2024-01-01T10:00:00Z'
  }

  beforeEach(() => {
    wrapper = mount(TaskItem, {
      props: {
        task: mockTask
      }
    })
  })

  afterEach(() => {
    if (wrapper) {
      wrapper.unmount()
    }
  })

  describe('3.1 TaskItem 组件渲染测试', () => {
    it('test_task_item_render_incomplete_task - 验证未完成任务的渲染逻辑', () => {
      // 验证复选框状态
      const checkbox = wrapper.find('input[type="checkbox"]')
      expect(checkbox.exists()).toBe(true)
      expect(checkbox.element.checked).toBe(false)

      // 验证文本内容
      const taskText = wrapper.find('[data-testid="task-text"]')
      expect(taskText.text()).toBe('测试任务')

      // 验证优先级样式
      const taskElement = wrapper.find('[data-testid="task-item"]')
      expect(taskElement.classes()).toContain('priority-high')

      // 验证不显示完成样式
      expect(taskElement.classes()).not.toContain('completed')
      expect(taskText.classes()).not.toContain('line-through')
    })

    it('test_task_item_render_completed_task - 验证已完成任务的渲染逻辑', async () => {
      const completedTask = {
        ...mockTask,
        done: true
      }

      await wrapper.setProps({ task: completedTask })

      // 验证复选框状态
      const checkbox = wrapper.find('input[type="checkbox"]')
      expect(checkbox.element.checked).toBe(true)

      // 验证完成样式
      const taskElement = wrapper.find('[data-testid="task-item"]')
      const taskText = wrapper.find('[data-testid="task-text"]')
      
      expect(taskElement.classes()).toContain('completed')
      expect(taskText.classes()).toContain('line-through')
    })

    it('test_task_item_priority_styling - 验证不同优先级的样式渲染', async () => {
      // Test high priority
      expect(wrapper.find('[data-testid="task-item"]').classes()).toContain('priority-high')

      // Test medium priority
      await wrapper.setProps({ 
        task: { ...mockTask, priority: 'medium' } 
      })
      expect(wrapper.find('[data-testid="task-item"]').classes()).toContain('priority-medium')

      // Test low priority
      await wrapper.setProps({ 
        task: { ...mockTask, priority: 'low' } 
      })
      expect(wrapper.find('[data-testid="task-item"]').classes()).toContain('priority-low')
    })
  })

  describe('3.2 TaskItem 事件处理测试', () => {
    it('test_task_item_toggle_completion - 验证任务完成状态切换的事件处理', async () => {
      const checkbox = wrapper.find('input[type="checkbox"]')
      
      await checkbox.trigger('change')

      // 验证事件触发
      expect(wrapper.emitted('toggle')).toBeTruthy()
      expect(wrapper.emitted('toggle')[0]).toEqual([mockTask.id])
    })

    it('test_task_item_delete_task - 验证删除任务事件', async () => {
      const deleteButton = wrapper.find('[data-testid="delete-button"]')
      expect(deleteButton.exists()).toBe(true)

      await deleteButton.trigger('click')

      // 验证删除事件触发
      expect(wrapper.emitted('delete')).toBeTruthy()
      expect(wrapper.emitted('delete')[0]).toEqual([mockTask.id])
    })
  })

  describe('3.3 TaskItem 编辑模式测试', () => {
    it('test_task_item_enter_edit_mode - 验证进入编辑模式的逻辑', async () => {
      const wrapper = mount(TaskItem, {
        props: {
          task: mockTask
        },
        attachTo: document.body
      })
      
      // 双击进入编辑模式
      const taskText = wrapper.find('[data-testid="task-text"]')
      await taskText.trigger('dblclick')
      await nextTick()
      
      // 验证编辑模式激活
      const editInput = wrapper.find('[data-testid="edit-input"]')
      expect(editInput.exists()).toBe(true)
      expect(editInput.element.value).toBe(mockTask.text)
      
      // 验证输入框自动聚焦（需要测试DOM操作）
      expect(editInput.element).toBe(document.activeElement)
      
      wrapper.unmount()
    })

    it('test_task_item_save_edit - 验证编辑保存的逻辑', async () => {
      // 进入编辑模式
      const taskText = wrapper.find('[data-testid="task-text"]')
      await taskText.trigger('dblclick')
      await nextTick()

      // 修改文本
      const editInput = wrapper.find('[data-testid="edit-input"]')
      await editInput.setValue('更新的任务内容')

      // 按Enter保存
      await editInput.trigger('keyup.enter')
      await nextTick()

      // 验证更新事件触发
      expect(wrapper.emitted('update')).toBeTruthy()
      expect(wrapper.emitted('update')[0]).toEqual([
        mockTask.id,
        { text: '更新的任务内容' }
      ])

      // 验证退出编辑模式
      expect(wrapper.vm.isEditing).toBe(false)
    })

    it('test_task_item_save_edit_on_blur - 验证失焦保存编辑', async () => {
      // 进入编辑模式
      await wrapper.find('[data-testid="task-text"]').trigger('dblclick')
      await nextTick()

      // 修改文本并失焦
      const editInput = wrapper.find('[data-testid="edit-input"]')
      await editInput.setValue('失焦保存的内容')
      await editInput.trigger('blur')
      await nextTick()

      // 验证更新事件触发
      expect(wrapper.emitted('update')).toBeTruthy()
      expect(wrapper.emitted('update')[0]).toEqual([
        mockTask.id,
        { text: '失焦保存的内容' }
      ])
    })

    it('test_task_item_cancel_edit - 验证取消编辑的逻辑', async () => {
      // 进入编辑模式
      await wrapper.find('[data-testid="task-text"]').trigger('dblclick')
      await nextTick()

      // 修改文本
      const editInput = wrapper.find('[data-testid="edit-input"]')
      await editInput.setValue('这些修改将被取消')

      // 按Escape取消
      await editInput.trigger('keyup.escape')
      await nextTick()

      // 验证不触发更新事件
      expect(wrapper.emitted('update')).toBeFalsy()

      // 验证退出编辑模式
      expect(wrapper.vm.isEditing).toBe(false)

      // 验证文本恢复原状
      const taskText = wrapper.find('[data-testid="task-text"]')
      expect(taskText.text()).toBe(mockTask.text)
    })

    it('test_task_item_edit_empty_validation - 验证编辑空文本的处理', async () => {
      // 进入编辑模式
      await wrapper.find('[data-testid="task-text"]').trigger('dblclick')
      await nextTick()

      // 清空文本
      const editInput = wrapper.find('[data-testid="edit-input"]')
      await editInput.setValue('')
      await editInput.trigger('keyup.enter')
      await nextTick()

      // 验证不触发更新事件（空文本无效）
      expect(wrapper.emitted('update')).toBeFalsy()

      // 验证仍在编辑模式
      expect(wrapper.vm.isEditing).toBe(true)

      // 验证显示错误提示
      const errorMessage = wrapper.find('[data-testid="edit-error"]')
      expect(errorMessage.exists()).toBe(true)
      expect(errorMessage.text()).toContain('任务内容不能为空')
    })
  })

  describe('3.4 TaskItem 辅助功能测试', () => {
    it('test_task_item_keyboard_accessibility - 验证键盘辅助功能', async () => {
      const taskItem = wrapper.find('[data-testid="task-item"]')
      
      // 验证元素可聚焦
      expect(taskItem.attributes('tabindex')).toBeDefined()

      // 测试空格键切换完成状态
      await taskItem.trigger('keydown.space')
      expect(wrapper.emitted('toggle')).toBeTruthy()

      // 测试Enter键进入编辑模式
      await taskItem.trigger('keydown.enter')
      await nextTick()
      expect(wrapper.vm.isEditing).toBe(true)
    })

    it('test_task_item_aria_labels - 验证无障碍标签', () => {
      const checkbox = wrapper.find('input[type="checkbox"]')
      const taskText = wrapper.find('[data-testid="task-text"]')
      const deleteButton = wrapper.find('[data-testid="delete-button"]')

      // 验证aria标签
      expect(checkbox.attributes('aria-label')).toContain('标记任务完成状态')
      expect(taskText.attributes('aria-label')).toContain('任务内容')
      expect(deleteButton.attributes('aria-label')).toContain('删除任务')
    })

    it('test_task_item_time_display - 验证时间显示', () => {
      const timeElement = wrapper.find('[data-testid="task-time"]')
      expect(timeElement.exists()).toBe(true)
      
      // 验证显示创建时间
      expect(timeElement.text()).toContain('2024-01-01')
    })
  })
}) 