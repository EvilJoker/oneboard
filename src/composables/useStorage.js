/**
 * 基础存储操作 Composable
 * 提供带版本控制的 localStorage 操作接口
 */

/**
 * 存储数据的通用接口
 * @param {string} key - 存储键名
 * @param {string} version - 数据版本号，用于迁移控制
 * @returns {Object} 存储操作方法
 */
export function useStorage(key, version = '1.0') {
  /**
   * 读取存储数据
   * @returns {Object|null} 解析后的数据对象，失败返回 null
   */
  const read = () => {
    try {
      const stored = localStorage.getItem(key)
      if (!stored) {
        return null
      }
      
      const data = JSON.parse(stored)
      
      // 检查版本兼容性
      if (!isVersionCompatible(data)) {
        return null
      }
      
      // 移除版本信息，返回纯数据
      const { _version, ...cleanData } = data
      return cleanData
    } catch (error) {
      console.warn(`Failed to read storage for key "${key}":`, error)
      return null
    }
  }

  /**
   * 写入存储数据
   * @param {Object} data - 要存储的数据对象
   * @returns {boolean} 操作是否成功
   */
  const write = (data) => {
    try {
      // 包装数据，添加版本信息
      const versionedData = {
        _version: version,
        ...data
      }
      
      localStorage.setItem(key, JSON.stringify(versionedData))
      return true
    } catch (error) {
      console.warn(`Failed to write storage for key "${key}":`, error)
      return false
    }
  }

  /**
   * 清除存储数据
   * @returns {boolean} 操作是否成功
   */
  const clear = () => {
    try {
      localStorage.removeItem(key)
      return true
    } catch (error) {
      console.warn(`Failed to clear storage for key "${key}":`, error)
      return false
    }
  }

  /**
   * 检查数据版本是否兼容
   * @param {Object} data - 存储的数据对象
   * @returns {boolean} 版本是否兼容
   */
  const isVersionCompatible = (data) => {
    if (!data || typeof data !== 'object') {
      return false
    }
    
    // 检查是否有版本信息
    if (!data._version) {
      return false
    }
    
    // 简单的版本检查：主版本号必须匹配
    const currentMajor = version.split('.')[0]
    const dataMajor = data._version.split('.')[0]
    
    return currentMajor === dataMajor
  }

  return {
    read,
    write,
    clear,
    isVersionCompatible
  }
} 