/**
 * 易观风云 v3.0 - 商用版
 * 使用 Open-Meteo 免费天气 API
 */

App({
  onLaunch() {
    wx.getSystemInfo({
      success: (res) => {
        this.globalData.systemInfo = res
        this.globalData.isIPhoneX = /iphonex/gi.test(res.model.replace(/\s+/, ''))
        this.globalData.statusBarHeight = res.statusBarHeight
        this.globalData.screenWidth = res.windowWidth
        this.globalData.screenHeight = res.windowHeight
        // 计算导航栏高度：菜单按钮下边缘 - 状态栏高度，取较大值确保不遮挡
        if (wx.getMenuButtonBoundingClientRect) {
          const menuBtn = wx.getMenuButtonBoundingClientRect()
          this.globalData.menuButtonInfo = menuBtn
          // 胶囊按钮上边缘到状态栏底部的距离
          const menuBtnTop = menuBtn.top // 通常等于 statusBarHeight
          // 导航栏内容区高度 = 胶囊高度，左右对齐
          this.globalData.navBarHeight = menuBtn.height + (menuBtn.top - res.statusBarHeight) * 2
          this.globalData.navBarTotalHeight = menuBtn.bottom + 4 // 加少量间距
        } else {
          this.globalData.navBarHeight = 32
          this.globalData.navBarTotalHeight = res.statusBarHeight + 44
        }
      },
    })
    this.checkUpdate()
    this.initNetworkStatus()
    this.initPrivacy()
  },

  globalData: {
    systemInfo: {},
    isIPhoneX: false,
    statusBarHeight: 0,
    navBarHeight: 32, // 导航栏内容高度
    navBarTotalHeight: 88, // 导航栏总高度（含状态栏）
    menuButtonInfo: null, // 菜单按钮信息
    screenWidth: 0,
    screenHeight: 0,
    currentWeather: null,
    settings: null,
    // 全局 loading 状态
    isLoading: false,
    loadingCount: 0,
    // 缓存
    weatherCache: {},
    cacheTimeout: 5 * 60 * 1000, // 5分钟缓存
  },

  // ========== 全局错误处理 ==========
  onError(err) {
    console.error('全局错误:', err)
    // 可选择上传错误日志到服务器
    // this.reportError(err)
  },

  onUnhandledRejection(err) {
    console.error('未处理的 Promise 拒绝:', err)
  },

  // ========== 网络状态监听 ==========
  initNetworkStatus() {
    wx.onNetworkStatusChange((res) => {
      this.globalData.isNetworkOK = res.isConnected
      if (!res.isConnected) {
        wx.showToast({
          title: '网络已断开',
          icon: 'none',
          duration: 2000,
        })
      } else {
        wx.showToast({
          title: '网络已恢复',
          icon: 'success',
          duration: 1500,
        })
      }
    })

    // 初始获取网络状态
    wx.getNetworkType({
      success: (res) => {
        this.globalData.isNetworkOK = res.networkType !== 'none'
      },
    })
  },

  // ========== 隐私协议处理 ==========
  initPrivacy() {
    if (wx.onNeedPrivacyAuthorization) {
      wx.onNeedPrivacyAuthorization((resolve, reject) => {
        wx.showModal({
          title: '隐私保护指引',
          content: '易观风云需要获取您的位置信息以提供天气服务。我们不会收集或上传您的位置数据。',
          confirmText: '同意',
          cancelText: '拒绝',
          success: (res) => {
            if (res.confirm) {
              resolve({ errMsg: 'authorize:ok' })
            } else {
              reject({ errMsg: 'authorize:fail' })
            }
          },
        })
      })
    }
  },

  // ========== 全局 Loading ==========
  showLoading(title = '加载中...') {
    this.globalData.loadingCount++
    if (!this.globalData.isLoading) {
      this.globalData.isLoading = true
      wx.showLoading({
        title,
        mask: true,
      })
    }
  },

  hideLoading() {
    if (this.globalData.loadingCount > 0) {
      this.globalData.loadingCount--
    }
    if (this.globalData.loadingCount <= 0) {
      this.globalData.loadingCount = 0
      this.globalData.isLoading = false
      wx.hideLoading()
    }
  },

  // ========== 天气数据缓存 ==========
  getWeatherCache(key) {
    const cache = this.globalData.weatherCache[key]
    if (cache && Date.now() - cache.timestamp < this.globalData.cacheTimeout) {
      return cache.data
    }
    return null
  },

  setWeatherCache(key, data) {
    this.globalData.weatherCache[key] = {
      data,
      timestamp: Date.now(),
    }
  },

  clearWeatherCache() {
    this.globalData.weatherCache = {}
  },

  // ========== 版本更新 ==========
  checkUpdate() {
    if (!wx.getUpdateManager) return
    const updateManager = wx.getUpdateManager()
    updateManager.onUpdateReady(() => {
      wx.showModal({
        title: '更新提示',
        content: '新版本已准备好，是否重启更新？',
        confirmText: '立即更新',
        cancelText: '稍后再说',
        success(res) {
          if (res.confirm) updateManager.applyUpdate()
        },
      })
    })
  },
})
