/**
 * 任务优先级枚举
 */
export const TaskPriority = {
  LOW: 'low',
  MEDIUM: 'medium',
  HIGH: 'high',
  URGENT: 'urgent'
}

/**
 * 任务状态枚举
 */
export const TaskStatus = {
  TODO: 'todo',
  IN_PROGRESS: 'in_progress',
  DONE: 'done',
  CANCELLED: 'cancelled'
}

/**
 * 任务模块状态机状态
 */
export const TaskModuleState = {
  IDLE: 'idle',
  LOADING: 'loading',
  READY: 'ready',
  SAVING: 'saving',
  ERROR: 'error'
}

/**
 * 创建新任务的默认数据
 */
export const createDefaultTask = () => ({
  id: Date.now().toString() + Math.random().toString(36).substr(2, 9),
  title: '',
  description: '',
  status: TaskStatus.TODO,
  priority: TaskPriority.MEDIUM,
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
  dueDate: null,
  tags: [],
  completed: false
})

/**
 * 任务存储模式
 */
export const TaskStorageSchema = {
  _version: '1.0',
  tasks: [],
  lastUpdated: null
}

/**
 * 优先级标签配置
 */
export const PriorityConfig = {
  [TaskPriority.LOW]: {
    label: '低',
    color: 'text-gray-600',
    bgColor: 'bg-gray-100',
    icon: '↓'
  },
  [TaskPriority.MEDIUM]: {
    label: '中',
    color: 'text-blue-600',
    bgColor: 'bg-blue-100',
    icon: '→'
  },
  [TaskPriority.HIGH]: {
    label: '高',
    color: 'text-orange-600',
    bgColor: 'bg-orange-100',
    icon: '↑'
  },
  [TaskPriority.URGENT]: {
    label: '紧急',
    color: 'text-red-600',
    bgColor: 'bg-red-100',
    icon: '⚡'
  }
}

/**
 * 状态标签配置
 */
export const StatusConfig = {
  [TaskStatus.TODO]: {
    label: '待办',
    color: 'text-gray-600',
    bgColor: 'bg-gray-100'
  },
  [TaskStatus.IN_PROGRESS]: {
    label: '进行中',
    color: 'text-blue-600',
    bgColor: 'bg-blue-100'
  },
  [TaskStatus.DONE]: {
    label: '已完成',
    color: 'text-green-600',
    bgColor: 'bg-green-100'
  },
  [TaskStatus.CANCELLED]: {
    label: '已取消',
    color: 'text-red-600',
    bgColor: 'bg-red-100'
  }
} 