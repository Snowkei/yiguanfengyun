/**
 * utils.js - 兼容层
 * 保留旧接口，内部转发到新模块
 */
const weather = require('./weather')

module.exports = {
  formatDate: weather.formatDate,
  isEmptyObject: weather.isEmptyObject,
  cmpVersion: weather.cmpVersion,
}
