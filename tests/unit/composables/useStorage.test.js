/**
 * useStorage Composable 测试用例
 * 测试基础存储操作的版本控制和错误处理
 */

import { describe, it, expect, beforeEach, vi } from 'vitest'
import { useStorage } from '../../../src/composables/useStorage.js'

describe('useStorage', () => {
  beforeEach(() => {
    // do: 清理localStorage，准备干净的测试环境
    localStorage.clear()
    vi.clearAllMocks()
  })

  describe('读取存储数据', () => {
    it('应该成功读取有效的版本化数据', () => {
      // do: 构造有效的版本化数据
      const testData = { name: 'test', value: 123 }
      const versionedData = { _version: '1.0', ...testData }
      localStorage.setItem('test-key', JSON.stringify(versionedData))
      
      const { read } = useStorage('test-key', '1.0')
      
      // when: 执行读取操作
      const result = read()
      
      // then: 验证返回正确的数据结构
      expect(result).toEqual(testData)
      expect(result).not.toHaveProperty('_version')
    })

    it('应该在localStorage为空时返回null', () => {
      // do: 确保localStorage中没有目标数据
      const { read } = useStorage('non-existent-key', '1.0')
      
      // when: 尝试读取不存在的数据
      const result = read()
      
      // then: 应该返回null
      expect(result).toBeNull()
    })

    it('应该在JSON解析失败时返回null', () => {
      // do: 存储无效的JSON数据
      localStorage.setItem('invalid-json', 'invalid json string')
      const { read } = useStorage('invalid-json', '1.0')
      
      // when: 尝试读取无效JSON
      const result = read()
      
      // then: 应该返回null而不抛出错误
      expect(result).toBeNull()
    })

    it('应该在版本不兼容时返回null', () => {
      // do: 存储旧版本的数据
      const oldVersionData = { _version: '0.9', name: 'old data' }
      localStorage.setItem('version-test', JSON.stringify(oldVersionData))
      const { read } = useStorage('version-test', '1.0')
      
      // when: 用新版本读取旧数据
      const result = read()
      
      // then: 应该返回null（版本不兼容）
      expect(result).toBeNull()
    })
  })

  describe('写入存储数据', () => {
    it('应该成功写入数据并添加版本信息', () => {
      // do: 准备要写入的数据
      const testData = { name: 'test', items: [1, 2, 3] }
      const { write } = useStorage('write-test', '1.0')
      
      // when: 执行写入操作
      const success = write(testData)
      
      // then: 验证写入成功且数据格式正确
      expect(success).toBe(true)
      const stored = JSON.parse(localStorage.getItem('write-test'))
      expect(stored).toEqual({ _version: '1.0', ...testData })
    })

    it('应该在localStorage写入失败时返回false', () => {
      // do: 模拟localStorage写入失败
      const originalSetItem = localStorage.setItem
      localStorage.setItem = vi.fn(() => {
        throw new Error('Storage quota exceeded')
      })
      
      const { write } = useStorage('quota-test', '1.0')
      
      // when: 尝试写入数据
      const success = write({ data: 'test' })
      
      // then: 应该返回false
      expect(success).toBe(false)
      
      // 恢复原始方法
      localStorage.setItem = originalSetItem
    })
  })

  describe('清除存储数据', () => {
    it('应该成功清除指定key的数据', () => {
      // do: 先存储一些数据
      localStorage.setItem('clear-test', 'some data')
      const { clear } = useStorage('clear-test', '1.0')
      
      // when: 执行清除操作
      const success = clear()
      
      // then: 验证数据被清除且操作成功
      expect(success).toBe(true)
      expect(localStorage.getItem('clear-test')).toBeNull()
    })

    it('应该在清除不存在的key时仍返回true', () => {
      // do: 确保key不存在
      const { clear } = useStorage('non-existent', '1.0')
      
      // when: 尝试清除不存在的数据
      const success = clear()
      
      // then: 应该返回true（操作成功）
      expect(success).toBe(true)
    })
  })

  describe('版本兼容性检查', () => {
    it('应该正确识别兼容的版本', () => {
      // do: 准备相同版本的数据
      const compatibleData = { _version: '1.0', content: 'test' }
      const { isVersionCompatible } = useStorage('version-check', '1.0')
      
      // when: 检查版本兼容性
      const isCompatible = isVersionCompatible(compatibleData)
      
      // then: 应该返回true
      expect(isCompatible).toBe(true)
    })

    it('应该正确识别不兼容的版本', () => {
      // do: 准备不同版本的数据
      const incompatibleData = { _version: '0.5', content: 'old' }
      const { isVersionCompatible } = useStorage('version-check', '1.0')
      
      // when: 检查版本兼容性
      const isCompatible = isVersionCompatible(incompatibleData)
      
      // then: 应该返回false
      expect(isCompatible).toBe(false)
    })

    it('应该在数据没有版本信息时返回false', () => {
      // do: 准备没有版本信息的数据
      const noVersionData = { content: 'no version' }
      const { isVersionCompatible } = useStorage('version-check', '1.0')
      
      // when: 检查版本兼容性
      const isCompatible = isVersionCompatible(noVersionData)
      
      // then: 应该返回false
      expect(isCompatible).toBe(false)
    })
  })
}) 