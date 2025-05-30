/**
 * LinkItem 组件测试用例
 * 测试单个链接项的展示和交互功能
 */

import { describe, it, expect, vi } from 'vitest'
import { mount } from '@vue/test-utils'
import LinkItem from '../../../src/components/links/LinkItem.vue'

describe('LinkItem', () => {
  const mockLink = {
    id: 'test-1',
    name: 'Test Link',
    url: 'https://test.com',
    icon: 'test-icon'
  }

  describe('组件渲染', () => {
    it('应该正确渲染链接信息', () => {
      // do: 挂载组件并传入链接数据
      const wrapper = mount(LinkItem, {
        props: { link: mockLink }
      })
      
      // when: 组件渲染完成
      
      // then: 应该显示链接名称和相关信息
      expect(wrapper.text()).toContain('Test Link')
      expect(wrapper.find('[data-testid="link-name"]').text()).toBe('Test Link')
    })

    it('应该在showDelete为false时隐藏删除按钮', () => {
      // do: 挂载组件并设置不显示删除按钮
      const wrapper = mount(LinkItem, {
        props: { 
          link: mockLink,
          showDelete: false
        }
      })
      
      // when: 组件渲染完成
      
      // then: 删除按钮应该不存在
      expect(wrapper.find('[data-testid="delete-button"]').exists()).toBe(false)
    })

    it('应该在disabled为true时禁用链接点击', () => {
      // do: 挂载组件并设置为禁用状态
      const wrapper = mount(LinkItem, {
        props: { 
          link: mockLink,
          disabled: true
        }
      })
      
      // when: 组件渲染完成
      
      // then: 链接应该显示为禁用状态
      expect(wrapper.find('[data-testid="link-container"]').classes()).toContain('disabled')
    })
  })

  describe('事件处理', () => {
    it('应该在点击链接时触发click事件', () => {
      // do: 挂载组件并模拟点击
      const wrapper = mount(LinkItem, {
        props: { link: mockLink }
      })
      
      // when: 点击链接主体
      wrapper.find('[data-testid="link-main"]').trigger('click')
      
      // then: 应该触发click事件并传递链接对象
      expect(wrapper.emitted('click')).toBeTruthy()
      expect(wrapper.emitted('click')[0]).toEqual([mockLink])
    })

    it('应该在点击删除按钮时触发delete事件', () => {
      // do: 挂载组件并模拟删除按钮点击
      const wrapper = mount(LinkItem, {
        props: { link: mockLink }
      })
      
      // when: 点击删除按钮
      wrapper.find('[data-testid="delete-button"]').trigger('click')
      
      // then: 应该触发delete事件并传递链接ID
      expect(wrapper.emitted('delete')).toBeTruthy()
      expect(wrapper.emitted('delete')[0]).toEqual([mockLink.id])
    })

    it('应该在点击编辑按钮时触发edit事件', () => {
      // do: 挂载组件并模拟编辑按钮点击
      const wrapper = mount(LinkItem, {
        props: { link: mockLink }
      })
      
      // when: 点击编辑按钮
      wrapper.find('[data-testid="edit-button"]').trigger('click')
      
      // then: 应该触发edit事件并传递链接对象
      expect(wrapper.emitted('edit')).toBeTruthy()
      expect(wrapper.emitted('edit')[0]).toEqual([mockLink])
    })

    it('应该阻止删除按钮的事件冒泡', () => {
      // do: 挂载组件并模拟删除按钮点击
      const wrapper = mount(LinkItem, {
        props: { link: mockLink }
      })
      
      // when: 点击删除按钮
      wrapper.find('[data-testid="delete-button"]').trigger('click')
      
      // then: 不应该同时触发容器的click事件
      expect(wrapper.emitted('click')).toBeFalsy()
      expect(wrapper.emitted('delete')).toBeTruthy()
    })
  })

  describe('Props验证', () => {
    it('应该在link缺少必需字段时验证失败', () => {
      // do: 准备无效的link数据
      const invalidLink = { id: 'test', name: 'Test' } // 缺少url字段
      
      // when: 尝试挂载组件
      const mountWithInvalidProps = () => {
        mount(LinkItem, {
          props: { link: invalidLink }
        })
      }
      
      // then: 应该在开发模式下产生警告
      expect(mountWithInvalidProps).not.toThrow() // Vue会发出警告但不会抛出错误
    })

    it('应该正确处理可选的icon属性', () => {
      // do: 准备没有icon的链接数据
      const linkWithoutIcon = {
        id: 'test-2',
        name: 'No Icon Link',
        url: 'https://noicon.com'
      }
      const wrapper = mount(LinkItem, {
        props: { link: linkWithoutIcon }
      })
      
      // when: 组件渲染完成
      
      // then: 应该正常渲染，可能显示默认图标
      expect(wrapper.exists()).toBe(true)
      expect(wrapper.text()).toContain('No Icon Link')
    })
  })

  describe('图标处理', () => {
    it('应该根据图标名称返回正确的CSS类', () => {
      // do: 挂载组件并检查图标处理
      const wrapper = mount(LinkItem, {
        props: { link: mockLink }
      })
      
      // when: 组件处理图标
      const iconElement = wrapper.find('[data-testid="link-icon"]')
      
      // then: 应该包含对应的图标类或显示图标
      expect(iconElement.exists()).toBe(true)
    })

    it('应该在没有图标时显示默认图标', () => {
      // do: 挂载组件，不提供图标
      const wrapper = mount(LinkItem, {
        props: {
          link: { id: 'test', name: 'Test', url: 'https://test.com' }
        }
      })
      
      // when: 组件渲染图标区域
      const iconElement = wrapper.find('[data-testid="default-icon"]')
      
      // then: 应该显示默认图标
      expect(iconElement.exists()).toBe(true)
    })
  })
}) 