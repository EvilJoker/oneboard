/**
 * LinkForm 组件测试用例
 * 测试链接表单的验证和提交功能
 */

import { describe, it, expect, vi } from 'vitest'
import { mount } from '@vue/test-utils'
import LinkForm from '../../../src/components/links/LinkForm.vue'

describe('LinkForm', () => {
  describe('组件渲染', () => {
    it('应该正确渲染表单元素', () => {
      // do: 挂载表单组件
      const wrapper = mount(LinkForm, {
        props: { visible: true }
      })
      
      // when: 组件渲染完成
      
      // then: 应该显示名称和URL输入框
      expect(wrapper.find('[data-testid="name-input"]').exists()).toBe(true)
      expect(wrapper.find('[data-testid="url-input"]').exists()).toBe(true)
      expect(wrapper.find('[data-testid="submit-button"]').exists()).toBe(true)
      expect(wrapper.find('[data-testid="cancel-button"]').exists()).toBe(true)
    })

    it('应该在visible为false时隐藏表单', () => {
      // do: 挂载组件并设置visible为false
      const wrapper = mount(LinkForm, {
        props: { visible: false }
      })
      
      // when: 组件渲染完成
      
      // then: 表单应该被隐藏（不存在）
      expect(wrapper.find('[data-testid="form-container"]').exists()).toBe(false)
    })

    it('应该显示自定义标题', () => {
      // do: 挂载组件并设置自定义标题
      const customTitle = '编辑链接'
      const wrapper = mount(LinkForm, {
        props: { 
          visible: true,
          title: customTitle
        }
      })
      
      // when: 组件渲染完成
      
      // then: 应该显示自定义标题
      expect(wrapper.find('[data-testid="form-title"]').text()).toBe(customTitle)
    })
  })

  describe('编辑模式', () => {
    it('应该在编辑模式下预填充表单数据', () => {
      // do: 准备初始链接数据并挂载组件
      const initialLink = {
        id: 'edit-1',
        name: 'Edit Link',
        url: 'https://edit.com',
        icon: 'edit-icon'
      }
      const wrapper = mount(LinkForm, {
        props: { 
          visible: true,
          initialLink: initialLink
        }
      })
      
      // when: 组件初始化完成
      
      // then: 表单应该预填充数据
      expect(wrapper.find('[data-testid="name-input"]').element.value).toBe('Edit Link')
      expect(wrapper.find('[data-testid="url-input"]').element.value).toBe('https://edit.com')
    })

    it('应该在新增模式下显示空表单', () => {
      // do: 挂载组件不传入初始数据
      const wrapper = mount(LinkForm, {
        props: { visible: true }
      })
      
      // when: 组件渲染完成
      
      // then: 表单字段应该为空
      expect(wrapper.find('[data-testid="name-input"]').element.value).toBe('')
      expect(wrapper.find('[data-testid="url-input"]').element.value).toBe('')
    })
  })

  describe('表单验证', () => {
    it('应该验证链接名称不能为空', async () => {
      // do: 挂载组件
      const wrapper = mount(LinkForm, {
        props: { visible: true }
      })
      
      // when: 先输入值再清空，触发验证
      const nameInput = wrapper.find('[data-testid="name-input"]')
      await nameInput.setValue('test')
      await nameInput.trigger('input')
      await nameInput.setValue('')
      await nameInput.trigger('input')
      await wrapper.vm.$nextTick()
      
      // then: 应该显示错误信息
      expect(wrapper.find('[data-testid="name-error"]').text()).toContain('链接名称不能为空')
    })

    it('应该验证URL格式', async () => {
      // do: 挂载组件
      const wrapper = mount(LinkForm, {
        props: { visible: true }
      })
      
      // when: 输入无效URL
      const urlInput = wrapper.find('[data-testid="url-input"]')
      await urlInput.setValue('invalid-url')
      await urlInput.trigger('input')
      await wrapper.vm.$nextTick()
      
      // then: 应该显示错误信息
      const errorElement = wrapper.find('[data-testid="url-error"]')
      expect(errorElement.exists()).toBe(true)
      expect(errorElement.text()).toContain('URL格式无效')
    })

    it('应该在所有字段有效时启用提交按钮', async () => {
      // do: 挂载组件
      const wrapper = mount(LinkForm, {
        props: { visible: true }
      })
      
      // when: 输入有效数据
      await wrapper.find('[data-testid="name-input"]').setValue('Test Link')
      await wrapper.find('[data-testid="url-input"]').setValue('https://test.com')
      await wrapper.vm.$nextTick()
      
      // then: 提交按钮应该被启用
      const submitButton = wrapper.find('[data-testid="submit-button"]')
      expect(submitButton.attributes('disabled')).toBeFalsy()
    })

    it('应该在字段无效时禁用提交按钮', () => {
      // do: 挂载组件并输入无效数据
      const wrapper = mount(LinkForm, {
        props: { visible: true }
      })
      
      // when: 输入无效的表单数据
      wrapper.find('[data-testid="name-input"]').setValue('')
      wrapper.find('[data-testid="url-input"]').setValue('invalid')
      
      // then: 提交按钮应该被禁用
      expect(wrapper.find('[data-testid="submit-button"]').attributes('disabled')).toBeDefined()
    })
  })

  describe('表单提交', () => {
    it('应该在提交有效表单时触发submit事件', async () => {
      // do: 挂载组件并填写有效数据
      const wrapper = mount(LinkForm, {
        props: { visible: true }
      })
      
      // when: 填写表单并提交
      await wrapper.find('[data-testid="name-input"]').setValue('Test Link')
      await wrapper.find('[data-testid="url-input"]').setValue('https://test.com')
      await wrapper.vm.$nextTick()
      
      // 直接调用提交方法而不是触发表单事件
      await wrapper.vm.handleSubmit({ preventDefault: () => {} })
      await wrapper.vm.$nextTick()
      
      // then: 应该触发submit事件并传递表单数据
      expect(wrapper.emitted('submit')).toBeTruthy()
      expect(wrapper.emitted('submit')[0][0]).toEqual({
        name: 'Test Link',
        url: 'https://test.com'
      })
    })

    it('应该在提交时显示加载状态', async () => {
      // do: 挂载组件
      const wrapper = mount(LinkForm, {
        props: { visible: true }
      })
      
      // when: 填写表单并提交
      await wrapper.find('[data-testid="name-input"]').setValue('Test')
      await wrapper.find('[data-testid="url-input"]').setValue('https://test.com')
      
      // 手动设置提交状态来模拟加载状态
      wrapper.vm.isSubmitting = true
      await wrapper.vm.$nextTick()
      
      // then: 提交按钮应该显示加载状态
      expect(wrapper.find('[data-testid="submit-button"]').text()).toContain('提交中')
      expect(wrapper.find('[data-testid="submit-button"]').attributes('disabled')).toBeDefined()
    })

    it('应该阻止提交无效表单', () => {
      // do: 挂载组件并输入无效数据
      const wrapper = mount(LinkForm, {
        props: { visible: true }
      })
      
      // when: 输入无效数据并尝试提交
      wrapper.find('[data-testid="name-input"]').setValue('')
      wrapper.find('[data-testid="url-input"]').setValue('invalid')
      wrapper.find('[data-testid="form"]').trigger('submit')
      
      // then: 不应该触发submit事件
      expect(wrapper.emitted('submit')).toBeFalsy()
    })
  })

  describe('表单取消', () => {
    it('应该在取消时触发cancel事件', () => {
      // do: 挂载组件并输入数据
      const wrapper = mount(LinkForm, {
        props: { visible: true }
      })
      wrapper.find('[data-testid="name-input"]').setValue('Test')
      wrapper.find('[data-testid="url-input"]').setValue('https://test.com')
      
      // when: 点击取消按钮
      wrapper.find('[data-testid="cancel-button"]').trigger('click')
      
      // then: 应该触发cancel事件
      expect(wrapper.emitted('cancel')).toBeTruthy()
    })
  })

  describe('实时验证', () => {
    it('应该在输入时实时验证字段', () => {
      // do: 挂载组件
      const wrapper = mount(LinkForm, {
        props: { visible: true }
      })
      
      // when: 输入数据并触发input事件
      wrapper.find('[data-testid="name-input"]').setValue('Valid Name')
      wrapper.find('[data-testid="name-input"]').trigger('input')
      
      // then: 应该触发验证状态变化事件
      expect(wrapper.emitted('validation-change')).toBeTruthy()
    })

    it('应该清除之前的错误信息', () => {
      // do: 挂载组件并先产生错误
      const wrapper = mount(LinkForm, {
        props: { visible: true }
      })
      wrapper.find('[data-testid="name-input"]').setValue('')
      wrapper.find('[data-testid="name-input"]').trigger('blur')
      
      // when: 输入有效数据
      wrapper.find('[data-testid="name-input"]').setValue('Valid Name')
      wrapper.find('[data-testid="name-input"]').trigger('input')
      
      // then: 错误信息应该被清除
      expect(wrapper.find('[data-testid="name-error"]').exists()).toBe(false)
    })
  })
}) 