/**
 * useLinks Composable 测试用例
 * 测试链接管理的CRUD操作和验证逻辑
 */

import { describe, it, expect, beforeEach, vi } from 'vitest'
import { useLinks } from '../../../src/composables/useLinks.js'
import { DEFAULT_LINKS } from '../../../src/constants/defaultLinks.js'

// Mock useStorage
vi.mock('../../../src/composables/useStorage.js', () => ({
  useStorage: vi.fn(() => ({
    read: vi.fn(),
    write: vi.fn(),
    clear: vi.fn(),
    isVersionCompatible: vi.fn()
  }))
}))

describe('useLinks', () => {
  let mockStorage
  
  beforeEach(async () => {
    // do: 重置所有mock和响应式状态
    vi.clearAllMocks()
    mockStorage = {
      read: vi.fn(),
      write: vi.fn(() => true),
      clear: vi.fn(() => true),
      isVersionCompatible: vi.fn(() => true)
    }
    
    const { useStorage } = await import('../../../src/composables/useStorage.js')
    useStorage.mockReturnValue(mockStorage)
  })

  describe('初始化链接数据', () => {
    it('应该在存储为空时加载默认链接', () => {
      // do: 模拟存储为空的情况
      mockStorage.read.mockReturnValue(null)
      const { initializeLinks, links } = useLinks()
      
      // when: 执行初始化
      initializeLinks()
      
      // then: 应该加载默认链接数据
      expect(links.value).toEqual(DEFAULT_LINKS)
      expect(mockStorage.write).toHaveBeenCalledWith({ links: DEFAULT_LINKS })
    })

    it('应该成功加载存储中的现有数据', () => {
      // do: 模拟存储中有现有数据
      const existingLinks = [
        { id: 'custom1', name: 'Custom Link', url: 'https://example.com' }
      ]
      mockStorage.read.mockReturnValue({ links: existingLinks })
      const { initializeLinks, links } = useLinks()
      
      // when: 执行初始化
      initializeLinks()
      
      // then: 应该加载存储中的数据
      expect(links.value).toEqual(existingLinks)
      expect(mockStorage.write).not.toHaveBeenCalled()
    })

    it('应该在数据版本不兼容时重置为默认数据', () => {
      // do: 模拟版本不兼容的数据（read返回null表示版本不兼容）
      mockStorage.read.mockReturnValue(null)
      const { initializeLinks, links } = useLinks()
      
      // when: 执行初始化
      initializeLinks()
      
      // then: 应该重置为默认数据
      expect(links.value).toEqual(DEFAULT_LINKS)
      expect(mockStorage.write).toHaveBeenCalledWith({ links: DEFAULT_LINKS })
    })
  })

  describe('添加链接', () => {
    it('应该成功添加有效的链接', () => {
      // do: 准备有效的链接数据
      const newLinkData = { name: 'Test Link', url: 'https://test.com' }
      const { addLink, links } = useLinks()
      links.value = [] // 初始化为空数组
      
      // when: 执行添加操作
      const result = addLink(newLinkData)
      
      // then: 应该成功添加并返回完整链接对象
      expect(result).toEqual({
        id: expect.any(String),
        name: 'Test Link',
        url: 'https://test.com'
      })
      expect(links.value).toHaveLength(1)
      expect(mockStorage.write).toHaveBeenCalled()
    })

    it('应该在URL重复时抛出错误', () => {
      // do: 准备重复的URL
      const existingLink = { id: '1', name: 'Existing', url: 'https://test.com' }
      const duplicateData = { name: 'Duplicate', url: 'https://test.com' }
      const { addLink, links } = useLinks()
      links.value = [existingLink]
      
      // when: 尝试添加重复URL的链接
      const addDuplicate = () => addLink(duplicateData)
      
      // then: 应该抛出错误
      expect(addDuplicate).toThrow('URL已存在')
      expect(links.value).toHaveLength(1) // 数量不变
    })

    it('应该在验证失败时抛出错误', () => {
      // do: 准备无效的链接数据
      const invalidData = { name: '', url: 'invalid-url' }
      const { addLink } = useLinks()
      
      // when: 尝试添加无效数据
      const addInvalid = () => addLink(invalidData)
      
      // then: 应该抛出验证错误
      expect(addInvalid).toThrow()
    })
  })

  describe('删除链接', () => {
    it('应该成功删除存在的链接', () => {
      // do: 准备包含链接的初始状态
      const existingLinks = [
        { id: '1', name: 'Link 1', url: 'https://test1.com' },
        { id: '2', name: 'Link 2', url: 'https://test2.com' }
      ]
      const { removeLink, links } = useLinks()
      links.value = [...existingLinks]
      
      // when: 删除指定ID的链接
      const success = removeLink('1')
      
      // then: 应该成功删除并更新存储
      expect(success).toBe(true)
      expect(links.value).toHaveLength(1)
      expect(links.value[0].id).toBe('2')
      expect(mockStorage.write).toHaveBeenCalled()
    })

    it('应该在链接不存在时返回false', () => {
      // do: 准备空的链接列表
      const { removeLink, links } = useLinks()
      links.value = []
      
      // when: 尝试删除不存在的链接
      const success = removeLink('non-existent')
      
      // then: 应该返回false
      expect(success).toBe(false)
      expect(mockStorage.write).not.toHaveBeenCalled()
    })
  })

  describe('更新链接', () => {
    it('应该成功更新存在的链接', () => {
      // do: 准备现有链接和更新数据
      const existingLink = { id: '1', name: 'Old Name', url: 'https://old.com' }
      const updates = { name: 'New Name', url: 'https://new.com' }
      const { updateLink, links } = useLinks()
      links.value = [existingLink]
      
      // when: 执行更新操作
      const result = updateLink('1', updates)
      
      // then: 应该成功更新并返回新的链接对象
      expect(result).toEqual({
        id: '1',
        name: 'New Name',
        url: 'https://new.com'
      })
      expect(links.value[0]).toEqual(result)
      expect(mockStorage.write).toHaveBeenCalled()
    })

    it('应该在链接不存在时抛出错误', () => {
      // do: 准备空的链接列表
      const { updateLink, links } = useLinks()
      links.value = []
      
      // when: 尝试更新不存在的链接
      const updateNonExistent = () => updateLink('non-existent', { name: 'New' })
      
      // then: 应该抛出错误
      expect(updateNonExistent).toThrow('链接不存在')
    })
  })

  describe('链接验证', () => {
    it('应该验证有效的链接数据', () => {
      // do: 准备有效的链接数据
      const validData = { name: 'Valid Link', url: 'https://valid.com' }
      const { validateLink } = useLinks()
      
      // when: 执行验证
      const result = validateLink(validData)
      
      // then: 应该返回验证通过
      expect(result.isValid).toBe(true)
      expect(result.errors).toHaveLength(0)
    })

    it('应该检测无效的URL格式', () => {
      // do: 准备无效URL的数据
      const invalidUrlData = { name: 'Invalid', url: 'not-a-url' }
      const { validateLink } = useLinks()
      
      // when: 执行验证
      const result = validateLink(invalidUrlData)
      
      // then: 应该返回验证失败
      expect(result.isValid).toBe(false)
      expect(result.errors).toContain('URL格式无效')
    })

    it('应该检测空的链接名称', () => {
      // do: 准备空名称的数据
      const emptyNameData = { name: '', url: 'https://valid.com' }
      const { validateLink } = useLinks()
      
      // when: 执行验证
      const result = validateLink(emptyNameData)
      
      // then: 应该返回验证失败
      expect(result.isValid).toBe(false)
      expect(result.errors).toContain('链接名称不能为空')
    })
  })

  describe('工具函数', () => {
    it('应该正确检测重复的URL', () => {
      // do: 准备包含链接的状态
      const existingLinks = [
        { id: '1', name: 'Link 1', url: 'https://test.com' }
      ]
      const { isDuplicateUrl, links } = useLinks()
      links.value = existingLinks
      
      // when: 检查重复URL
      const isDuplicate = isDuplicateUrl('https://test.com')
      const isNotDuplicate = isDuplicateUrl('https://other.com')
      
      // then: 应该正确识别重复状态
      expect(isDuplicate).toBe(true)
      expect(isNotDuplicate).toBe(false)
    })

    it('应该生成唯一的链接ID', () => {
      // do: 准备测试环境
      const { generateLinkId } = useLinks()
      
      // when: 生成多个ID
      const id1 = generateLinkId()
      const id2 = generateLinkId()
      
      // then: 应该生成不同的ID
      expect(id1).toBeTruthy()
      expect(id2).toBeTruthy()
      expect(id1).not.toBe(id2)
      expect(typeof id1).toBe('string')
    })
  })
}) 