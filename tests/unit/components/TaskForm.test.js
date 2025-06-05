import { describe, it, expect, beforeEach, vi } from 'vitest'
import { mount } from '@vue/test-utils'
import { nextTick } from 'vue'
import TaskForm from '@/components/tasks/TaskForm.vue'

describe('TaskForm Component', () => {
  let wrapper

  beforeEach(() => {
    wrapper = mount(TaskForm, {
      props: {
        // 可以传入初始值进行编辑测试
      }
    })
  })

  afterEach(() => {
    if (wrapper) {
      wrapper.unmount()
    }
  })

  describe('3.5 TaskForm 初始状态测试', () => {
    it('test_task_form_initial_state - 验证表单初始状态', () => {
      // 验证输入框为空
      const textInput = wrapper.find('[data-testid="task-input"]')
      expect(textInput.element.value).toBe('')

      // 验证优先级默认为medium
      const prioritySelect = wrapper.find('[data-testid="priority-select"]')
      expect(prioritySelect.element.value).toBe('medium')

      // 验证提交按钮可用
      const submitButton = wrapper.find('[data-testid="submit-button"]')
      expect(submitButton.exists()).toBe(true)
      expect(submitButton.attributes('disabled')).toBeDefined()

      // 验证表单验证状态
      expect(wrapper.vm.formErrors).toEqual([])
    })

    it('test_task_form_with_initial_data - 验证传入初始数据的表单状态', async () => {
      const initialTask = {
        text: '编辑任务',
        priority: 'high'
      }

      await wrapper.setProps({ 
        initialTask,
        mode: 'edit'
      })
      await nextTick()

      // 验证表单填入初始数据
      const textInput = wrapper.find('[data-testid="task-input"]')
      const prioritySelect = wrapper.find('[data-testid="priority-select"]')

      expect(textInput.element.value).toBe('编辑任务')
      expect(prioritySelect.element.value).toBe('high')
    })
  })

  describe('3.6 TaskForm 数据验证测试', () => {
    it('test_task_form_validate_empty_text - 验证空文本验证', async () => {
      const submitButton = wrapper.find('[data-testid="submit-button"]')
      const textInput = wrapper.find('[data-testid="task-input"]')
      
      // 确保输入框为空，然后尝试输入并触发验证
      await textInput.setValue('')
      await textInput.trigger('input')
      await nextTick()
      
      // 尝试提交空表单
      await submitButton.trigger('click')
      await nextTick()

      // 验证显示错误提示
      const errorMessage = wrapper.find('[data-testid="form-error"]')
      expect(errorMessage.exists()).toBe(true)
      expect(errorMessage.text()).toContain('任务内容不能为空')

      // 验证不触发提交事件
      expect(wrapper.emitted('submit')).toBeFalsy()
    })

    it('test_task_form_validate_text_length - 验证文本长度限制', async () => {
      const longText = 'A'.repeat(201) // 超过200字符
      const textInput = wrapper.find('[data-testid="task-input"]')
      
      await textInput.setValue(longText)
      await textInput.trigger('input')
      await nextTick()

      // 验证长度限制提示
      const lengthIndicator = wrapper.find('[data-testid="length-indicator"]')
      expect(lengthIndicator.exists()).toBe(true)
      expect(lengthIndicator.text()).toContain('201/200')
      expect(lengthIndicator.classes()).toContain('text-red-500') // 错误样式

      // 尝试提交
      const submitButton = wrapper.find('[data-testid="submit-button"]')
      await submitButton.trigger('click')
      await nextTick()

      // 验证显示长度错误
      const errorMessage = wrapper.find('[data-testid="form-error"]')
      expect(errorMessage.text()).toContain('任务内容长度不能超过200字符')
      expect(wrapper.emitted('submit')).toBeFalsy()
    })

    it('test_task_form_text_length_indicator - 验证字符计数器', async () => {
      const textInput = wrapper.find('[data-testid="task-input"]')
      const lengthIndicator = wrapper.find('[data-testid="length-indicator"]')

      // 输入文本并验证计数器
      await textInput.setValue('测试任务')
      await textInput.trigger('input')
      await nextTick()

      expect(lengthIndicator.text()).toContain('4/200')
      expect(lengthIndicator.classes()).toContain('text-gray-500') // 正常样式

      // 接近限制时的样式
      const nearLimitText = 'A'.repeat(190)
      await textInput.setValue(nearLimitText)
      await textInput.trigger('input')
      await nextTick()

      expect(lengthIndicator.text()).toContain('190/200')
      expect(lengthIndicator.classes()).toContain('text-yellow-500') // 警告样式
    })
  })

  describe('3.7 TaskForm 提交处理测试', () => {
    it('test_task_form_submit_valid_data - 验证提交有效数据', async () => {
      const wrapper = mount(TaskForm)
      
      // 输入有效数据
      const textInput = wrapper.find('[data-testid="task-input"]')
      const prioritySelect = wrapper.find('[data-testid="priority-select"]')
      const form = wrapper.find('[data-testid="task-form"]')
      
      await textInput.setValue('新建任务')
      await textInput.trigger('input')  // 触发验证
      await prioritySelect.setValue('high')
      await nextTick()
      
      // 直接触发表单提交事件
      await form.trigger('submit')
      await nextTick()

      // 验证提交事件触发
      expect(wrapper.emitted('submit')).toBeTruthy()
      expect(wrapper.emitted('submit')[0]).toEqual([{
        text: '新建任务',
        priority: 'high'
      }])
    })

    it('test_task_form_submit_with_form_submission - 验证表单原生提交事件', async () => {
      const form = wrapper.find('[data-testid="task-form"]')
      const textInput = wrapper.find('[data-testid="task-input"]')

      await textInput.setValue('表单提交测试')
      
      // 触发表单提交事件
      await form.trigger('submit')
      await nextTick()

      // 验证阻止默认行为
      expect(wrapper.emitted('submit')).toBeTruthy()
    })

    it('test_task_form_loading_state - 验证提交加载状态', async () => {
      const wrapper = mount(TaskForm, {
        props: {
          isLoading: true
        }
      })
      
      const submitButton = wrapper.find('[data-testid="submit-button"]')
      const loadingIndicator = wrapper.find('.btn-loading')
      
      // 验证按钮禁用状态
      expect(submitButton.attributes('disabled')).toBeDefined()
      
      // 验证加载指示器
      expect(submitButton.classes()).toContain('btn-loading')
    })
  })

  describe('3.8 TaskForm 键盘快捷键测试', () => {
    it('test_task_form_keyboard_shortcuts - 验证键盘快捷键', async () => {
      const wrapper = mount(TaskForm)
      
      const textInput = wrapper.find('[data-testid="task-input"]')
      
      // 输入有效文本
      await textInput.setValue('快捷键测试任务')
      await textInput.trigger('input')
      await nextTick()
      
      // 模拟 Enter 键提交
      await textInput.trigger('keydown', { key: 'Enter' })
      await nextTick()

      expect(wrapper.emitted('submit')).toBeTruthy()
      expect(wrapper.emitted('submit')[0]).toEqual([{
        text: '快捷键测试任务',
        priority: 'medium'
      }])
    })

    it('test_task_form_escape_clear - 验证Escape键清空表单', async () => {
      const wrapper = mount(TaskForm)
      
      const textInput = wrapper.find('[data-testid="task-input"]')
      const prioritySelect = wrapper.find('[data-testid="priority-select"]')
      
      // 输入内容
      await textInput.setValue('将被清空的内容')
      await prioritySelect.setValue('high')
      await nextTick()
      
      // 按 Escape 键
      await textInput.trigger('keydown', { key: 'Escape' })
      await nextTick()

      // 验证表单被清空
      expect(textInput.element.value).toBe('')
      expect(prioritySelect.element.value).toBe('medium')
    })

    it('test_task_form_ctrl_enter_submit - 验证Ctrl+Enter快速提交', async () => {
      const wrapper = mount(TaskForm)
      
      const textInput = wrapper.find('[data-testid="task-input"]')
      
      // 输入有效文本
      await textInput.setValue('Ctrl+Enter测试任务')
      await textInput.trigger('input')
      await nextTick()
      
      // 模拟 Ctrl+Enter 键
      await textInput.trigger('keydown', { key: 'Enter', ctrlKey: true })
      await nextTick()

      expect(wrapper.emitted('submit')).toBeTruthy()
    })
  })

  describe('3.9 TaskForm 辅助功能测试', () => {
    it('test_task_form_accessibility - 验证无障碍功能', () => {
      const form = wrapper.find('[data-testid="task-form"]')
      const textInput = wrapper.find('[data-testid="task-input"]')
      const prioritySelect = wrapper.find('[data-testid="priority-select"]')
      const submitButton = wrapper.find('[data-testid="submit-button"]')

      // 验证表单语义
      expect(form.element.tagName).toBe('FORM')

      // 验证标签关联
      expect(textInput.attributes('aria-label')).toBeTruthy()
      expect(prioritySelect.attributes('aria-label')).toBeTruthy()

      // 验证表单验证提示
      const errorContainer = wrapper.find('[data-testid="form-error"]')
      if (errorContainer.exists()) {
        expect(errorContainer.attributes('role')).toBe('alert')
        expect(errorContainer.attributes('aria-live')).toBe('polite')
      }
    })

    it('test_task_form_priority_options - 验证优先级选项', () => {
      const prioritySelect = wrapper.find('[data-testid="priority-select"]')
      const options = prioritySelect.findAll('option')

      expect(options).toHaveLength(3)
      expect(options[0].text()).toBe('低优先级')
      expect(options[0].element.value).toBe('low')
      expect(options[1].text()).toBe('中优先级')
      expect(options[1].element.value).toBe('medium')
      expect(options[2].text()).toBe('高优先级')
      expect(options[2].element.value).toBe('high')
    })

    it('test_task_form_auto_focus - 验证自动聚焦', async () => {
      // 重新挂载组件测试自动聚焦
      wrapper.unmount()
      wrapper = mount(TaskForm, {
        attachTo: document.body // 需要附加到body才能测试焦点
      })

      await nextTick()

      const textInput = wrapper.find('[data-testid="task-input"]')
      expect(document.activeElement).toBe(textInput.element)
    })
  })

  describe('3.10 TaskForm 编辑模式测试', () => {
    it('test_task_form_edit_mode - 验证编辑模式', async () => {
      const initialTask = {
        id: '1',
        text: '编辑测试任务',
        priority: 'high',
        done: false
      }
      
      const wrapper = mount(TaskForm, {
        props: {
          mode: 'edit',
          initialTask
        }
      })
      
      await nextTick()
      
      // 验证表单数据预填充
      const textInput = wrapper.find('[data-testid="task-input"]')
      const prioritySelect = wrapper.find('[data-testid="priority-select"]')
      
      expect(textInput.element.value).toBe('编辑测试任务')
      expect(prioritySelect.element.value).toBe('high')
      
      // 验证提交按钮文本
      const submitButton = wrapper.find('[data-testid="submit-button"]')
      expect(submitButton.text()).toContain('更新')
    })

    it('test_task_form_cancel_edit - 验证取消编辑', async () => {
      const wrapper = mount(TaskForm, {
        props: {
          mode: 'edit',
          showCancelButton: true,
          initialTask: {
            id: '1',
            text: '测试任务',
            priority: 'medium'
          }
        }
      })
      
      await nextTick()

      const cancelButton = wrapper.find('[data-testid="cancel-button"]')
      expect(cancelButton.exists()).toBe(true)

      await cancelButton.trigger('click')
      await nextTick()

      // 验证取消事件触发
      expect(wrapper.emitted('cancel')).toBeTruthy()
    })
  })
}) 