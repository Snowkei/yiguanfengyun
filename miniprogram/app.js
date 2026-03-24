/**
 * 易观风云 - 全新架构
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
      },
    })
    this.checkUpdate()
  },

  globalData: {
    systemInfo: {},
    isIPhoneX: false,
    statusBarHeight: 0,
    screenWidth: 0,
    screenHeight: 0,
    currentWeather: null,
    settings: null,
  },

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
