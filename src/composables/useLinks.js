import { ref, watch } from 'vue'
import { useStorage } from './useStorage.js'
import { DEFAULT_LINKS } from '../constants/defaultLinks.js'

/**
 * 快捷链接管理 Composable
 * 提供链接的增删改查和验证功能
 */

/**
 * 链接对象类型定义
 * @typedef {Object} QuickLink
 * @property {string} id - 唯一标识符
 * @property {string} name - 显示名称
 * @property {string} url - 完整URL地址
 * @property {string} [icon] - 可选图标类名或URL
 */

/**
 * 链接管理主接口
 * @returns {Object} 链接管理相关的响应式数据和方法
 */
export function useLinks() {
  // 响应式数据
  const links = ref([])
  const loading = ref(false)
  const error = ref(null)
  
  // 存储管理 - 使用新的 useStorage API
  const { 
    storedValue: storedLinks, 
    save: saveToStorage, 
    load: loadFromStorage,
    error: storageError,
    loading: storageLoading 
  } = useStorage('quick-links', { links: [] }, {
    validator: (data) => data && Array.isArray(data.links),
    errorHandler: (err) => {
      console.error('Links storage error:', err)
      error.value = err.message
    }
  })

  /**
   * 初始化链接数据
   * @returns {Promise<void>} 初始化完成的Promise
   */
  const initializeLinks = async () => {
    try {
      loading.value = true
      error.value = null
      
      // 从存储加载数据
      const storedData = await loadFromStorage()
      
      if (storedData && storedData.links && Array.isArray(storedData.links) && storedData.links.length > 0) {
        links.value = storedData.links
      } else {
        // 如果没有存储数据、数据无效或为空数组，使用默认链接
        links.value = [...DEFAULT_LINKS]
        // 保存默认数据到存储
        await saveToStorage({ links: links.value })
      }
    } catch (err) {
      error.value = err.message
      // 发生错误时使用默认链接
      links.value = [...DEFAULT_LINKS]
    } finally {
      loading.value = false
    }
  }

  /**
   * 添加新链接
   * @param {Omit<QuickLink, 'id'>} linkData - 不包含id的链接数据
   * @returns {QuickLink} 添加成功的链接对象
   * @throws {Error} 验证失败或添加失败时抛出错误
   */
  const addLink = async (linkData) => {
    // 验证链接数据
    const validation = validateLink(linkData)
    if (!validation.isValid) {
      throw new Error(validation.errors.join(', '))
    }
    
    // 检查URL重复
    if (isDuplicateUrl(linkData.url)) {
      throw new Error('URL已存在')
    }
    
    // 创建完整的链接对象
    const newLink = {
      id: generateLinkId(),
      name: linkData.name.trim(),
      url: linkData.url.trim(),
      ...(linkData.icon && { icon: linkData.icon.trim() })
    }
    
    // 添加到链接列表
    links.value.push(newLink)
    
    // 保存到存储
    await saveToStorage({ links: links.value })
    
    return newLink
  }

  /**
   * 删除链接
   * @param {string} linkId - 要删除的链接ID
   * @returns {boolean} 删除是否成功
   */
  const removeLink = async (linkId) => {
    const index = links.value.findIndex(link => link.id === linkId)
    if (index === -1) {
      return false
    }
    
    // 从列表中移除
    links.value.splice(index, 1)
    
    // 保存到存储
    await saveToStorage({ links: links.value })
    
    return true
  }

  /**
   * 更新链接信息
   * @param {string} linkId - 要更新的链接ID
   * @param {Partial<QuickLink>} updates - 要更新的字段
   * @returns {QuickLink} 更新后的链接对象
   * @throws {Error} 链接不存在或验证失败时抛出错误
   */
  const updateLink = async (linkId, updates) => {
    const index = links.value.findIndex(link => link.id === linkId)
    if (index === -1) {
      throw new Error('链接不存在')
    }
    
    // 合并更新数据
    const updatedData = { ...links.value[index], ...updates }
    
    // 验证更新后的数据
    const validation = validateLink(updatedData)
    if (!validation.isValid) {
      throw new Error(validation.errors.join(', '))
    }
    
    // 检查URL重复（排除当前链接）
    if (updates.url && updates.url !== links.value[index].url) {
      if (isDuplicateUrl(updates.url)) {
        throw new Error('URL已存在')
      }
    }
    
    // 更新链接
    links.value[index] = {
      ...updatedData,
      name: updatedData.name.trim(),
      url: updatedData.url.trim(),
      ...(updatedData.icon && { icon: updatedData.icon.trim() })
    }
    
    // 保存到存储
    await saveToStorage({ links: links.value })
    
    return links.value[index]
  }

  /**
   * 验证链接数据
   * @param {Object} linkData - 要验证的链接数据
   * @returns {Object} 验证结果 { isValid: boolean, errors: string[] }
   */
  const validateLink = (linkData) => {
    const errors = []
    
    // 验证名称
    if (!linkData.name || typeof linkData.name !== 'string') {
      errors.push('链接名称不能为空')
    } else if (linkData.name.trim().length === 0) {
      errors.push('链接名称不能为空')
    } else if (linkData.name.trim().length > 50) {
      errors.push('链接名称不能超过50个字符')
    }
    
    // 验证URL
    if (!linkData.url || typeof linkData.url !== 'string') {
      errors.push('URL不能为空')
    } else {
      try {
        new URL(linkData.url)
      } catch {
        errors.push('URL格式无效')
      }
    }
    
    return {
      isValid: errors.length === 0,
      errors
    }
  }

  /**
   * 检查链接是否重复
   * @param {string} url - 要检查的URL
   * @param {string} [excludeId] - 排除的链接ID（用于更新时检查）
   * @returns {boolean} 是否存在重复
   */
  const isDuplicateUrl = (url, excludeId = null) => {
    return links.value.some(link => 
      link.url === url && link.id !== excludeId
    )
  }

  /**
   * 生成唯一链接ID
   * @returns {string} 唯一标识符
   */
  const generateLinkId = () => {
    return `link_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
  }

  return {
    // 响应式数据
    links,
    loading,
    error,
    
    // 方法
    initializeLinks,
    addLink,
    removeLink,
    updateLink,
    validateLink,
    isDuplicateUrl,
    generateLinkId
  }
} 