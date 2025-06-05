<template>
  <div class="task-stats" :class="statsClasses" :data-testid="'task-stats'">
    <!-- 主要统计数据 -->
    <div class="stats-main">
      <!-- 总任务数 -->
      <div 
        class="stat-item stat-total" 
        :data-testid="'stat-total'"
        @click="handleStatClick('total')"
      >
        <div class="stat-icon">📋</div>
        <div class="stat-content">
          <div class="stat-number" :class="{ 'animated': animated }">
            {{ formatNumber(stats.total) }}
          </div>
          <div class="stat-label">总任务</div>
        </div>
      </div>
      
      <!-- 活跃任务数 -->
      <div 
        class="stat-item stat-active" 
        :data-testid="'stat-active'"
        @click="handleStatClick('active')"
      >
        <div class="stat-icon">🔥</div>
        <div class="stat-content">
          <div class="stat-number" :class="{ 'animated': animated }">
            {{ formatNumber(stats.active) }}
          </div>
          <div class="stat-label">进行中</div>
        </div>
      </div>
      
      <!-- 已完成任务数 -->
      <div 
        class="stat-item stat-completed" 
        :data-testid="'stat-completed'"
        @click="handleStatClick('completed')"
      >
        <div class="stat-icon">✅</div>
        <div class="stat-content">
          <div class="stat-number" :class="{ 'animated': animated }">
            {{ formatNumber(stats.completed) }}
          </div>
          <div class="stat-label">已完成</div>
        </div>
      </div>
    </div>
    
    <!-- 进度条 -->
    <div v-if="showProgress && stats.total > 0" class="stats-progress" :data-testid="'progress-bar'">
      <div class="progress-label">
        <span>完成进度</span>
        <span class="progress-percentage">{{ completionRateText }}</span>
      </div>
      <div 
        class="progress-bar"
        @click="handleProgressClick"
        :aria-label="`完成进度 ${completionRateText}`"
      >
        <div 
          class="progress-fill"
          :class="`level-${completionLevel}`"
          :style="{ width: progressWidth + '%' }"
        ></div>
      </div>
    </div>
    
    <!-- 完成率 -->
    <div v-if="showCompletionRate && stats.total > 0" class="stats-completion-rate" :data-testid="'completion-rate'">
      <div class="completion-circle" :class="`level-${completionLevel}`">
        <svg viewBox="0 0 36 36" class="circular-chart">
          <path
            class="circle-bg"
            d="M18 2.0845
              a 15.9155 15.9155 0 0 1 0 31.831
              a 15.9155 15.9155 0 0 1 0 -31.831"
          />
          <path
            class="circle"
            :stroke-dasharray="`${progressWidth}, 100`"
            d="M18 2.0845
              a 15.9155 15.9155 0 0 1 0 31.831
              a 15.9155 15.9155 0 0 1 0 -31.831"
          />
        </svg>
        <div class="completion-text">
          <div class="completion-percentage">{{ Math.round(stats.completionRate) }}%</div>
          <div class="completion-label">完成率</div>
        </div>
      </div>
    </div>
    
    <!-- 扩展统计信息 -->
    <div v-if="showExtendedStats" class="stats-extended" :data-testid="'extended-stats'">
      <div class="extended-title">详细统计</div>
      <div class="extended-items">
        <div class="extended-item" v-for="(value, key) in extendedStats" :key="key">
          <div class="extended-label">{{ getExtendedLabel(key) }}</div>
          <div class="extended-value">{{ value }}</div>
        </div>
      </div>
    </div>
    
    <!-- 空状态 -->
    <div v-if="stats.total === 0" class="stats-empty" :data-testid="'empty-stats'">
      <div class="empty-icon">📊</div>
      <div class="empty-text">暂无任务数据</div>
    </div>
    
    <!-- 刷新按钮 -->
    <button 
      v-if="showRefreshButton"
      class="refresh-button"
      :class="{ 'loading': loading }"
      :disabled="loading"
      :data-testid="'refresh-button'"
      @click="handleRefresh"
      :aria-label="'刷新统计数据'"
    >
      <span class="refresh-icon" :class="{ 'spinning': loading }">🔄</span>
      {{ loading ? '刷新中...' : '刷新' }}
    </button>
  </div>
</template>

<script setup>
import { computed } from 'vue'
import { THEME_PROP, ANIMATED_PROP } from '../../constants/componentDefaults.js'

// ==================== Props 定义 ====================

/**
 * 组件属性定义
 */
const props = defineProps({
  /** 任务统计数据 */
  stats: {
    type: Object,
    required: true,
    default: () => ({
      total: 0,
      active: 0,
      completed: 0,
      completionRate: 0
    })
  },
  
  /** 是否显示进度条 */
  showProgress: {
    type: Boolean,
    default: true
  },
  
  /** 是否显示完成率 */
  showCompletionRate: {
    type: Boolean,
    default: true
  },
  
  /** 是否显示扩展统计 */
  showExtendedStats: {
    type: Boolean,
    default: false
  },
  
  /** 是否显示刷新按钮 */
  showRefreshButton: {
    type: Boolean,
    default: false
  },
  
  /** 统计组件主题 */
  theme: THEME_PROP,
  
  /** 是否启用动画效果 */
  animated: ANIMATED_PROP,
  
  /** 是否处于加载状态 */
  loading: {
    type: Boolean,
    default: false
  }
})

// ==================== Emits 定义 ====================

/**
 * 组件事件定义
 */
const emit = defineEmits([
  /** 统计项点击 */
  'stat-click',
  
  /** 进度条点击 */
  'progress-click',
  
  /** 刷新事件 */
  'refresh'
])

// ==================== 计算属性 ====================

/**
 * 统计组件的CSS类名
 */
const statsClasses = computed(() => {
  return {
    'stats-animated': props.animated,
    'stats-has-data': props.stats.total > 0,
    'stats-all-completed': props.stats.total > 0 && props.stats.active === 0,
    'stats-loading': props.loading,
    [`stats-theme-${props.theme}`]: true
  }
})

/**
 * 格式化的完成率文本
 */
const completionRateText = computed(() => {
  return Math.round(props.stats.completionRate) + '%'
})

/**
 * 进度条宽度百分比
 */
const progressWidth = computed(() => {
  return Math.min(100, Math.max(0, props.stats.completionRate))
})

/**
 * 完成率的颜色等级
 */
const completionLevel = computed(() => {
  const rate = props.stats.completionRate
  if (rate === 100) return 'complete'
  if (rate >= 75) return 'high'
  if (rate >= 50) return 'medium'
  return 'low'
})

/**
 * 扩展统计数据
 */
const extendedStats = computed(() => {
  const today = new Date()
  const todayStart = new Date(today.getFullYear(), today.getMonth(), today.getDate())
  
  // 这里可以根据实际需求计算更复杂的统计数据
  // 现在提供模拟数据作为示例
  return {
    todayCompleted: calculateTodayCompleted(),
    averageCompletionTime: calculateAverageTime(),
    mostActiveHour: getMostActiveHour(),
    longestStreak: calculateLongestStreak(),
    thisWeekCompleted: calculateWeekCompleted()
  }
})

// ==================== 事件处理方法 ====================

/**
 * 处理统计项点击
 * @param {string} statType - 统计类型
 */
function handleStatClick(statType) {
  emit('stat-click', {
    type: statType,
    value: props.stats[statType],
    stats: props.stats
  })
}

/**
 * 处理进度条点击
 * @param {Event} event - 点击事件
 */
function handleProgressClick(event) {
  emit('progress-click', {
    event,
    progress: props.stats.completionRate,
    stats: props.stats
  })
}

/**
 * 处理刷新事件
 */
function handleRefresh() {
  emit('refresh')
}

// ==================== 工具方法 ====================

/**
 * 格式化数字显示
 * @param {number} num - 数字
 * @returns {string} 格式化后的数字
 */
function formatNumber(num) {
  if (num >= 1000000) {
    return (num / 1000000).toFixed(1) + 'M'
  }
  if (num >= 1000) {
    return (num / 1000).toFixed(1) + 'K'
  }
  return num.toString()
}

/**
 * 获取扩展统计项的标签
 * @param {string} key - 统计项键名
 * @returns {string} 中文标签
 */
function getExtendedLabel(key) {
  const labels = {
    todayCompleted: '今日完成',
    averageCompletionTime: '平均用时',
    mostActiveHour: '最活跃时段',
    longestStreak: '最长连续',
    thisWeekCompleted: '本周完成'
  }
  return labels[key] || key
}

/**
 * 计算今日完成任务数
 * @returns {number} 今日完成数
 */
function calculateTodayCompleted() {
  // 这里应该根据实际的任务数据计算
  // 现在返回模拟数据
  return Math.floor(props.stats.completed * 0.1)
}

/**
 * 计算平均完成时间
 * @returns {string} 平均时间字符串
 */
function calculateAverageTime() {
  // 模拟计算平均完成时间
  const hours = Math.floor(Math.random() * 5) + 1
  const minutes = Math.floor(Math.random() * 60)
  return `${hours}h ${minutes}m`
}

/**
 * 获取最活跃时段
 * @returns {string} 时段字符串
 */
function getMostActiveHour() {
  // 模拟最活跃时段
  const hours = ['09:00-10:00', '14:00-15:00', '16:00-17:00', '20:00-21:00']
  return hours[Math.floor(Math.random() * hours.length)]
}

/**
 * 计算最长连续完成天数
 * @returns {number} 连续天数
 */
function calculateLongestStreak() {
  // 模拟连续天数
  return Math.floor(Math.random() * 30) + 1
}

/**
 * 计算本周完成任务数
 * @returns {number} 本周完成数
 */
function calculateWeekCompleted() {
  // 模拟本周完成数
  return Math.floor(props.stats.completed * 0.3)
}
</script>

<style scoped>
.task-stats {
  background: white;
  border-radius: 12px;
  padding: 20px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);
  border: 1px solid #e5e7eb;
  transition: all 0.2s ease;
}

.task-stats.stats-loading {
  opacity: 0.7;
  pointer-events: none;
}

.stats-main {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(120px, 1fr));
  gap: 16px;
  margin-bottom: 20px;
}

.stat-item {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 16px;
  background: #f9fafb;
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.2s ease;
}

.stat-item:hover {
  background: #f3f4f6;
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
}

.stat-icon {
  font-size: 24px;
  line-height: 1;
}

.stat-content {
  flex: 1;
  text-align: left;
}

.stat-number {
  font-size: 24px;
  font-weight: 700;
  color: #1f2937;
  line-height: 1;
  margin-bottom: 4px;
  transition: all 0.3s ease;
}

.stat-number.animated {
  animation: numberPulse 2s ease-in-out infinite;
}

@keyframes numberPulse {
  0%, 100% { transform: scale(1); }
  50% { transform: scale(1.05); }
}

.stat-label {
  font-size: 12px;
  color: #6b7280;
  font-weight: 500;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.stat-total {
  border-left: 4px solid #3b82f6;
}

.stat-active {
  border-left: 4px solid #f59e0b;
}

.stat-completed {
  border-left: 4px solid #10b981;
}

.stats-progress {
  margin-bottom: 20px;
}

.progress-label {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 8px;
  font-size: 14px;
  font-weight: 500;
  color: #374151;
}

.progress-percentage {
  color: #6b7280;
}

.progress-bar {
  height: 8px;
  background: #e5e7eb;
  border-radius: 4px;
  overflow: hidden;
  cursor: pointer;
  transition: all 0.2s ease;
}

.progress-bar:hover {
  box-shadow: 0 0 0 2px rgba(59, 130, 246, 0.2);
}

.progress-fill {
  height: 100%;
  background: linear-gradient(90deg, #3b82f6, #1d4ed8);
  border-radius: 4px;
  transition: all 0.5s ease;
  position: relative;
}

.progress-fill::after {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.3), transparent);
  animation: progressShimmer 2s ease-in-out infinite;
}

@keyframes progressShimmer {
  0% { transform: translateX(-100%); }
  100% { transform: translateX(100%); }
}

.progress-fill.level-low {
  background: linear-gradient(90deg, #ef4444, #dc2626);
}

.progress-fill.level-medium {
  background: linear-gradient(90deg, #f59e0b, #d97706);
}

.progress-fill.level-high {
  background: linear-gradient(90deg, #3b82f6, #1d4ed8);
}

.progress-fill.level-complete {
  background: linear-gradient(90deg, #10b981, #059669);
}

.stats-completion-rate {
  display: flex;
  justify-content: center;
  margin-bottom: 20px;
}

.completion-circle {
  position: relative;
  width: 120px;
  height: 120px;
}

.circular-chart {
  display: block;
  margin: 0 auto;
  max-width: 100%;
  max-height: 100%;
}

.circle-bg {
  fill: none;
  stroke: #e5e7eb;
  stroke-width: 3;
}

.circle {
  fill: none;
  stroke-width: 3;
  stroke-linecap: round;
  transition: stroke-dasharray 0.5s ease-in-out;
}

.level-low .circle {
  stroke: #ef4444;
}

.level-medium .circle {
  stroke: #f59e0b;
}

.level-high .circle {
  stroke: #3b82f6;
}

.level-complete .circle {
  stroke: #10b981;
}

.completion-text {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  text-align: center;
}

.completion-percentage {
  font-size: 18px;
  font-weight: 700;
  color: #1f2937;
  line-height: 1;
}

.completion-label {
  font-size: 12px;
  color: #6b7280;
  margin-top: 4px;
}

.stats-extended {
  border-top: 1px solid #e5e7eb;
  padding-top: 20px;
}

.extended-title {
  font-size: 16px;
  font-weight: 600;
  color: #1f2937;
  margin-bottom: 16px;
}

.extended-items {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
  gap: 12px;
}

.extended-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 8px 12px;
  background: #f9fafb;
  border-radius: 6px;
}

.extended-label {
  font-size: 12px;
  color: #6b7280;
  font-weight: 500;
}

.extended-value {
  font-size: 14px;
  color: #1f2937;
  font-weight: 600;
}

.stats-empty {
  text-align: center;
  padding: 40px 20px;
  color: #6b7280;
}

.empty-icon {
  font-size: 48px;
  margin-bottom: 12px;
}

.empty-text {
  font-size: 16px;
  font-weight: 500;
}

.refresh-button {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px 16px;
  background: #f3f4f6;
  border: 1px solid #d1d5db;
  border-radius: 6px;
  cursor: pointer;
  font-size: 14px;
  font-weight: 500;
  color: #374151;
  transition: all 0.2s ease;
  margin-top: 16px;
}

.refresh-button:hover:not(:disabled) {
  background: #e5e7eb;
  border-color: #9ca3af;
}

.refresh-button:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.refresh-icon {
  font-size: 16px;
  transition: transform 0.2s ease;
}

.refresh-icon.spinning {
  animation: spin 1s linear infinite;
}

@keyframes spin {
  from { transform: rotate(0deg); }
  to { transform: rotate(360deg); }
}

/* 主题样式 */
.stats-theme-compact {
  padding: 12px;
}

.stats-theme-compact .stats-main {
  gap: 8px;
  margin-bottom: 12px;
}

.stats-theme-compact .stat-item {
  padding: 8px;
  flex-direction: column;
  text-align: center;
  gap: 4px;
}

.stats-theme-compact .stat-icon {
  font-size: 20px;
}

.stats-theme-compact .stat-number {
  font-size: 18px;
}

.stats-theme-minimal .stats-main {
  grid-template-columns: repeat(3, 1fr);
}

.stats-theme-minimal .stat-item {
  background: transparent;
  border: 1px solid #e5e7eb;
  padding: 12px;
}

.stats-theme-minimal .stat-item:hover {
  border-color: #3b82f6;
  background: rgba(59, 130, 246, 0.05);
}

.stats-theme-detailed .extended-items {
  grid-template-columns: 1fr;
}

.stats-theme-detailed .extended-item {
  padding: 12px 16px;
}

/* 响应式设计 */
@media (max-width: 768px) {
  .task-stats {
    padding: 16px;
  }
  
  .stats-main {
    grid-template-columns: 1fr;
    gap: 12px;
  }
  
  .stat-item {
    padding: 12px;
  }
  
  .completion-circle {
    width: 100px;
    height: 100px;
  }
  
  .completion-percentage {
    font-size: 16px;
  }
  
  .extended-items {
    grid-template-columns: 1fr;
  }
}

@media (max-width: 480px) {
  .task-stats {
    padding: 12px;
  }
  
  .stat-item {
    flex-direction: column;
    text-align: center;
    gap: 8px;
  }
  
  .stat-icon {
    font-size: 20px;
  }
  
  .stat-number {
    font-size: 20px;
  }
}
</style>