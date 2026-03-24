/**
 * 天气工具函数集合
 */

// 天气背景渐变映射
const weatherGradients = {
  '晴': ['#4facfe', '#00f2fe'],
  '多云': ['#89a0b5', '#b8c6d4'],
  '阴': ['#667eea', '#764ba2'],
  '雨': ['#373B44', '#4286f4'],
  '雪': ['#e6dada', '#274046'],
  '雾': ['#bdc3c7', '#2c3e50'],
  '霾': ['#757F9A', '#D7DDE8'],
  '雷': ['#232526', '#414345'],
  'default': ['#667eea', '#764ba2'],
}

// 获取天气背景渐变
function getWeatherGradient(weather) {
  if (!weather) return weatherGradients.default
  for (let key in weatherGradients) {
    if (weather.indexOf(key) !== -1) {
      return weatherGradients[key]
    }
  }
  return weatherGradients.default
}

// 日期格式化
function formatDate(date, fmt) {
  if (!date) return '--'
  if (!(date instanceof Date)) {
    date = new Date(date)
  }
  if (isNaN(date.getTime())) return '--'

  const o = {
    'M+': date.getMonth() + 1,
    'd+': date.getDate(),
    'h+': date.getHours(),
    'm+': date.getMinutes(),
    's+': date.getSeconds(),
  }

  if (/(y+)/.test(fmt)) {
    fmt = fmt.replace(RegExp.$1, (date.getFullYear() + '').substr(4 - RegExp.$1.length))
  }

  for (let k in o) {
    if (new RegExp('(' + k + ')').test(fmt)) {
      fmt = fmt.replace(
        RegExp.$1,
        RegExp.$1.length === 1 ? o[k] : ('00' + o[k]).substr(('' + o[k]).length)
      )
    }
  }
  return fmt
}

// 解析温度范围字符串 "15°C ~ 25°C" → { min: 15, max: 25 }
function parseTemperature(tempStr) {
  if (!tempStr) return { min: 0, max: 0 }
  const nums = tempStr.match(/-?\d+/g)
  if (!nums || nums.length === 0) return { min: 0, max: 0 }
  if (nums.length === 1) return { min: parseInt(nums[0]), max: parseInt(nums[0]) }
  return { min: parseInt(nums[0]), max: parseInt(nums[1]) }
}

// PM2.5 等级计算
function calcPM(value) {
  value = parseInt(value) || 0
  if (value <= 50) {
    return { val: value, desc: '优', level: 1, color: '#00e400', detail: '空气质量令人满意' }
  } else if (value <= 100) {
    return { val: value, desc: '良', level: 2, color: '#ffff00', detail: '空气质量可接受' }
  } else if (value <= 150) {
    return { val: value, desc: '轻度污染', level: 3, color: '#ff7e00', detail: '敏感人群应减少户外活动' }
  } else if (value <= 200) {
    return { val: value, desc: '中度污染', level: 4, color: '#ff0000', detail: '减少户外活动' }
  } else if (value <= 300) {
    return { val: value, desc: '重度污染', level: 5, color: '#99004c', detail: '避免户外活动' }
  } else {
    return { val: value, desc: '严重污染', level: 6, color: '#7e0023', detail: '尽量不要外出' }
  }
}

// 解析风向风力
function parseWind(windStr) {
  if (!windStr) return { direction: '--', level: '--' }
  const parts = windStr.split(/\s+/)
  return {
    direction: parts[0] || '--',
    level: parts.slice(1).join(' ') || '--',
  }
}

// 解析当前温度 "15°C 晴" → "15"
function parseCurrentTemp(tempStr) {
  if (!tempStr) return '--'
  const match = tempStr.match(/(-?\d+)/)
  return match ? match[1] : '--'
}

// 解析生活指数
function parseIndex(indexArr) {
  if (!indexArr || !Array.isArray(indexArr)) return []
  const iconMap = {
    '穿衣': '👔',
    '洗车': '🚗',
    '感冒': '💊',
    '运动': '🏃',
    '紫外线': '☀️',
    '旅游': '🏖️',
    '钓鱼': '🎣',
    '过敏': '🤧',
    '舒适度': '😊',
    '晾晒': '👕',
    '交通': '🚌',
    '防晒': '🧴',
    '雨伞': '☂️',
  }
  return indexArr.map(item => {
    let icon = '📋'
    for (let key in iconMap) {
      if (item.tipt && item.tipt.indexOf(key) !== -1) {
        icon = iconMap[key]
        break
      }
    }
    return {
      ...item,
      icon,
    }
  })
}

// 判断是否为白天
function isDaytime() {
  const hour = new Date().getHours()
  return hour >= 6 && hour < 18
}

// 获取问候语
function getGreeting() {
  const hour = new Date().getHours()
  if (hour >= 5 && hour < 8) return '🌅 早上好'
  if (hour >= 8 && hour < 11) return '☀️ 上午好'
  if (hour >= 11 && hour < 13) return '🌤 中午好'
  if (hour >= 13 && hour < 17) return '☀️ 下午好'
  if (hour >= 17 && hour < 19) return '🌇 傍晚好'
  if (hour >= 19 && hour < 22) return '🌙 晚上好'
  return '🌙 夜深了'
}

// 防抖
function debounce(fn, delay = 300) {
  let timer = null
  return function (...args) {
    if (timer) clearTimeout(timer)
    timer = setTimeout(() => {
      fn.apply(this, args)
    }, delay)
  }
}

// 空对象判断
function isEmptyObject(obj) {
  for (let i in obj) {
    return false
  }
  return true
}

// 版本比较
function cmpVersion(left, right) {
  if (typeof left + typeof right !== 'stringstring') return false
  const a = left.split('.')
  const b = right.split('.')
  const len = Math.max(a.length, b.length)
  for (let i = 0; i < len; i++) {
    if ((a[i] && !b[i] && parseInt(a[i]) > 0) || parseInt(a[i]) > parseInt(b[i])) return 1
    if ((b[i] && !a[i] && parseInt(b[i]) > 0) || parseInt(a[i]) < parseInt(b[i])) return -1
  }
  return 0
}

// 天气图标映射（emoji）
const weatherIcons = {
  '晴': '☀️',
  '多云': '⛅',
  '阴': '☁️',
  '小雨': '🌦️',
  '中雨': '🌧️',
  '大雨': '🌧️',
  '暴雨': '⛈️',
  '雷阵雨': '⛈️',
  '阵雨': '🌦️',
  '小雪': '🌨️',
  '中雪': '🌨️',
  '大雪': '❄️',
  '雾': '🌫️',
  '霾': '😷',
  '沙尘暴': '🌪️',
  'default': '🌤️',
}

// 获取天气图标
function getWeatherIcon(weather) {
  if (!weather) return weatherIcons.default
  for (let key in weatherIcons) {
    if (weather.indexOf(key) !== -1) {
      return weatherIcons[key]
    }
  }
  return weatherIcons.default
}

// 获取星期几
function getWeekDay(date) {
  if (!date) return '--'
  if (!(date instanceof Date)) {
    date = new Date(date)
  }
  if (isNaN(date.getTime())) return '--'
  const weekDays = ['周日', '周一', '周二', '周三', '周四', '周五', '周六']
  return weekDays[date.getDay()]
}

module.exports = {
  weatherIcons,
  weatherGradients,
  getWeatherIcon,
  getWeatherGradient,
  formatDate,
  getWeekDay,
  parseTemperature,
  calcPM,
  parseWind,
  parseCurrentTemp,
  parseIndex,
  isDaytime,
  getGreeting,
  debounce,
  isEmptyObject,
  cmpVersion,
}
