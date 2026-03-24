// 每日问候语（已迁移到 utils/weather.js 中的 getGreeting）
// 保留此文件以兼容旧引用
const { getGreeting } = require('./weather')

const messages = () => {
  return getGreeting()
}

module.exports = {
  messages,
}
