/**
 * 易观风云 v3.0 - 商用版
 * 使用 Open-Meteo 免费天气 API
 */

App({
  onLaunch() {
    // 同步获取系统信息（getSystemInfoSync 是同步的，onLaunch 里可以安全使用）
    try {
      const res = wx.getSystemInfoSync()
      this.globalData.systemInfo = res
      this.globalData.isIPhoneX = res.safeArea
        ? res.safeArea.bottom < res.screenHeight
        : /iphonex|iphone\s*1[0-9]/gi.test(res.model.replace(/\s+/g, ''))
      this.globalData.statusBarHeight = res.statusBarHeight || 20

      // 获取右上角胶囊按钮位置，计算导航栏真实高度
      // getMenuButtonBoundingClientRect 也是同步的
      if (wx.getMenuButtonBoundingClientRect) {
        const menuBtn = wx.getMenuButtonBoundingClientRect()
        this.globalData.menuButtonInfo = menuBtn
        const gap = menuBtn.top - res.statusBarHeight
        this.globalData.navBarContentHeight = menuBtn.height + gap * 2
        this.globalData.navBarTotalHeight = res.statusBarHeight + menuBtn.height + gap * 2
        // 右侧需要留出的空间 = 屏幕宽度 - 胶囊左边界（即胶囊宽度 + 右边距）
        this.globalData.navContentPaddingRight = res.windowWidth - menuBtn.left + 4
      } else {
        this.globalData.navBarContentHeight = 44
        this.globalData.navBarTotalHeight = res.statusBarHeight + 44
        this.globalData.navContentPaddingRight = 88
      }
    } catch (e) {
      console.error('getSystemInfoSync failed:', e)
      this.globalData.statusBarHeight = 20
      this.globalData.navBarContentHeight = 44
      this.globalData.navBarTotalHeight = 64

    }

    this.checkUpdate()
    this.initNetworkStatus()
    this.initPrivacy()
  },

  globalData: {
    systemInfo: {},
    isIPhoneX: false,
    statusBarHeight: 20,
    navBarContentHeight: 44,  // 导航栏内容区高度（不含状态栏）
    navBarTotalHeight: 64,    // 导航栏总高度（含状态栏），用于 padding-top
    menuButtonLeft: 0,        // 胶囊左边界，用于限制内容宽度
    menuButtonInfo: null,
    screenWidth: 375,
    screenHeight: 667,
    currentWeather: null,
    settings: null,
    isLoading: false,
    loadingCount: 0,
    weatherCache: {},
    cacheTimeout: 5 * 60 * 1000,
  },

  // ========== 全局错误处理 ==========
  onError(err) {
    console.error('[全局错误]', err)
  },

  onUnhandledRejection(err) {
    console.error('[未处理Promise拒绝]', err)
  },

  // ========== 网络状态监听 ==========
  initNetworkStatus() {
    wx.getNetworkType({
      success: (res) => {
        this.globalData.isNetworkOK = res.networkType !== 'none'
      },
    })
    wx.onNetworkStatusChange((res) => {
      this.globalData.isNetworkOK = res.isConnected
      if (!res.isConnected) {
        wx.showToast({ title: '网络已断开', icon: 'none', duration: 2000 })
      }
    })
  },

  // ========== 隐私协议处理 ==========
  initPrivacy() {
    if (wx.onNeedPrivacyAuthorization) {
      wx.onNeedPrivacyAuthorization((resolve) => {
        wx.showModal({
          title: '隐私保护提示',
          content: '易观风云需要获取您的位置信息以提供当地天气服务，位置数据仅在本地使用，不会上传。',
          confirmText: '同意',
          cancelText: '拒绝',
          success: (res) => {
            if (res.confirm) {
              resolve({ buttonId: 'agree', event: 'agree' })
            } else {
              resolve({ buttonId: 'disagree', event: 'disagree' })
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
      wx.showLoading({ title, mask: true })
    }
  },

  hideLoading() {
    if (this.globalData.loadingCount > 0) this.globalData.loadingCount--
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
    this.globalData.weatherCache[key] = { data, timestamp: Date.now() }
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
