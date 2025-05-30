/**
 * 默认快捷链接配置
 * 包含常见的开发工具和平台链接
 */

/**
 * 默认链接列表
 * @type {Array<{id: string, name: string, url: string, icon?: string}>}
 */
export const DEFAULT_LINKS = [
  {
    id: 'github',
    name: 'GitHub',
    url: 'https://github.com',
    icon: 'github'
  },
  {
    id: 'stackoverflow',
    name: 'Stack Overflow',
    url: 'https://stackoverflow.com',
    icon: 'stackoverflow'
  },
  {
    id: 'mdn',
    name: 'MDN Web Docs',
    url: 'https://developer.mozilla.org',
    icon: 'mdn'
  },
  {
    id: 'vue',
    name: 'Vue.js',
    url: 'https://vuejs.org',
    icon: 'vue'
  },
  {
    id: 'tailwind',
    name: 'Tailwind CSS',
    url: 'https://tailwindcss.com',
    icon: 'tailwind'
  },
  {
    id: 'vite',
    name: 'Vite',
    url: 'https://vitejs.dev',
    icon: 'vite'
  }
]

/**
 * 获取默认链接的副本
 * @returns {Array} 默认链接数组的深拷贝
 */
export function getDefaultLinks() {
  return JSON.parse(JSON.stringify(DEFAULT_LINKS))
} 