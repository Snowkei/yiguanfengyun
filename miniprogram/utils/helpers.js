/**
 * 错误处理与缓存管理
 */

// 缓存管理器
const cache = {
  _cache: {},

  set(key, data, ttl = 30 * 60 * 1000) {
    this._cache[key] = {
      data,
      expire: Date.now() + ttl,
    }
    // 同时持久化到 Storage
    try {
      wx.setStorageSync(`cache_${key}`, {
        data,
        expire: Date.now() + ttl,
      })
    } catch (e) {
      console.warn('Storage write failed:', e)
    }
  },

  get(key) {
    // 内存缓存
    let item = this._cache[key]
    if (item && item.expire > Date.now()) {
      return item.data
    }
    // Storage 缓存
    try {
      item = wx.getStorageSync(`cache_${key}`)
      if (item && item.expire > Date.now()) {
        this._cache[key] = item
        return item.data
      }
    } catch (e) {
      // ignore
    }
    return null
  },

  remove(key) {
    delete this._cache[key]
    try {
      wx.removeStorageSync(`cache_${key}`)
    } catch (e) {
      // ignore
    }
  },

  clear() {
    this._cache = {}
  }
}

// 错误提示
function showError(msg, duration = 2000) {
  wx.showToast({
    title: msg || '出了点问题，请稍后再试',
    icon: 'none',
    duration,
  })
}

// 网络请求封装
function request(options) {
  return new Promise((resolve, reject) => {
    wx.request({
      url: options.url,
      method: options.method || 'GET',
      data: options.data || {},
      header: options.header || {},
      success(res) {
        if (res.statusCode >= 200 && res.statusCode < 300) {
          resolve(res.data)
        } else {
          reject(new Error(`HTTP ${res.statusCode}`))
        }
      },
      fail(err) {
        reject(err)
      },
    })
  })
}

// 安全的 Storage 操作
const storage = {
  get(key, defaultVal = null) {
    try {
      const val = wx.getStorageSync(key)
      return val !== '' ? val : defaultVal
    } catch (e) {
      return defaultVal
    }
  },

  set(key, val) {
    try {
      wx.setStorageSync(key, val)
      return true
    } catch (e) {
      return false
    }
  },

  remove(key) {
    try {
      wx.removeStorageSync(key)
      return true
    } catch (e) {
      return false
    }
  },

  clear() {
    try {
      wx.clearStorageSync()
      return true
    } catch (e) {
      return false
    }
  }
}

module.exports = {
  cache,
  showError,
  request,
  storage,
}
