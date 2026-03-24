/**
 * 易观风云 - 全新架构
 * 现代化天气小程序
 */
const { storage, cache } = require('./utils/helpers')

App({
  onLaunch() {
    // 获取系统信息
    wx.getSystemInfo({
      success: (res) => {
        this.globalData.systemInfo = res
        this.globalData.isIPhoneX = /iphonex/gi.test(res.model.replace(/\s+/, ''))
        this.globalData.statusBarHeight = res.statusBarHeight
        this.globalData.screenWidth = res.windowWidth
        this.globalData.screenHeight = res.windowHeight
      },
    })

    // 检查更新
    this.checkUpdate()
  },

  globalData: {
    systemInfo: {},
    isIPhoneX: false,
    statusBarHeight: 0,
    screenWidth: 0,
    screenHeight: 0,
    // 百度地图 AK
    ak: 'vlICiqmNnLgusrTHX422isUWKVCrr3Pe',
    // 当前城市天气数据
    currentWeather: null,
    // 用户设置
    settings: null,
  },

  // 检查小程序更新
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
          if (res.confirm) {
            updateManager.applyUpdate()
          }
        },
      })
    })
  },

  // 获取地理编码URL
  getGeocoderUrl(address) {
    return `https://api.map.baidu.com/geocoder/v2/?address=${encodeURIComponent(address)}&output=json&ak=${this.globalData.ak}`
  },

  // 获取天气URL
  getWeatherUrl(location) {
    return `https://api.map.baidu.com/telematics/v3/weather?location=${encodeURIComponent(location)}&output=json&ak=${this.globalData.ak}`
  },
})
