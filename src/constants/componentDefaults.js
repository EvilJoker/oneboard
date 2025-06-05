/**
 * 组件默认值常量配置
 * 统一管理所有组件的默认值和验证规则
 */

// 主题相关常量
export const COMPONENT_THEMES = ['default', 'compact', 'detailed', 'minimal']
export const DEFAULT_THEME = 'default'

// 动画相关常量
export const DEFAULT_ANIMATED = false

// 任务优先级常量
export const TASK_PRIORITIES = ['low', 'medium', 'high']
export const DEFAULT_PRIORITY = 'medium'

// 组件props验证器
export const themeValidator = (value) => COMPONENT_THEMES.includes(value)
export const priorityValidator = (value) => TASK_PRIORITIES.includes(value)

// 通用的主题props定义
export const THEME_PROP = {
  type: String,
  default: DEFAULT_THEME,
  validator: themeValidator
}

// 通用的动画props定义
export const ANIMATED_PROP = {
  type: Boolean,
  default: DEFAULT_ANIMATED
}

// 任务优先级props定义
export const PRIORITY_PROP = {
  type: String,
  default: DEFAULT_PRIORITY,
  validator: priorityValidator
} 