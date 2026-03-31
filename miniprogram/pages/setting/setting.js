const { storage } = require('../../utils/helpers')
const { cmpVersion } = require('../../utils/weather')

Page({
  data: {
    statusBarHeight: 0,
    setting: {},
    screenBrightness: '获取中',
    keepscreenon: false,
    SDKVersion: '',
    enableUpdate: true,
    // 新增设置项
    tempUnit: 'celsius', // celsius / fahrenheit
    refreshInterval: 30, // 自动刷新间隔（分钟）
    cacheSize: '计算中...',
  },

  onShow() {
    this.setData({
      statusBarHeight: getApp().globalData.statusBarHeight || 44,
      navBarTotalHeight: getApp().globalData.navBarTotalHeight || 64,
      keepscreenon: getApp().globalData.keepscreenon || false,
    })
    this._checkUpdateSupport()
    this._getScreenBrightness()
    this._loadSetting()
    this._calcCacheSize()
  },

  switchChange(e) {
    let param = e.currentTarget.dataset.switchparam
    let setting = { ...this.data.setting }
    let val = (e.detail || {}).value

    if (param === 'forceUpdate') {
      if (!this.data.enableUpdate) {
        setting[param] = false
        wx.showToast({ title: '基础库版本过低', icon: 'none' })
      } else {
        setting[param] = val
      }
    } else if (param === 'keepscreenon') {
      this._setKeepScreenOn(!this.data.keepscreenon)
      getApp().globalData.keepscreenon = !this.data.keepscreenon
      return
    } else {
      // 反向：hiddenSearch 等（显示/隐藏）
      setting[param] = !val
    }

    this.setData({ setting })
    storage.set('setting', setting)
  },

  // ========== 温度单位切换 ==========
  onTempUnitChange(e) {
    const unit = e.currentTarget.dataset.unit
    this.setData({ tempUnit: unit })
    storage.set('tempUnit', unit)
    wx.showToast({
      title: unit === 'celsius' ? '已切换为摄氏度' : '已切换为华氏度',
      icon: 'success',
    })
  },

  // ========== 自动刷新间隔 ==========
  onRefreshIntervalChange(e) {
    const interval = parseInt(e.currentTarget.dataset.interval)
    this.setData({ refreshInterval: interval })
    storage.set('refreshInterval', interval)
    wx.showToast({
      title: `已设置为 ${interval} 分钟`,
      icon: 'success',
    })
  },

  // ========== 计算缓存大小 ==========
  _calcCacheSize() {
    try {
      const info = wx.getStorageInfoSync()
      const sizeKB = info.currentSize
      let sizeText = ''
      if (sizeKB < 1) {
        sizeText = `${Math.round(sizeKB * 1024)} B`
      } else if (sizeKB < 1024) {
        sizeText = `${sizeKB.toFixed(1)} KB`
      } else {
        sizeText = `${(sizeKB / 1024).toFixed(2)} MB`
      }
      this.setData({ cacheSize: sizeText })
    } catch (e) {
      this.setData({ cacheSize: '计算失败' })
    }
  },

  // ========== 清除缓存 ==========
  clearCache() {
    wx.showModal({
      title: '确认',
      content: '确定要清除天气缓存吗？这不会删除您的城市和设置。',
      confirmText: '清除',
      cancelText: '取消',
      success: (res) => {
        if (res.confirm) {
          // 清除天气缓存
          getApp().clearWeatherCache()
          // 清除本地存储中的天气相关缓存
          const keys = ['weatherCache', 'lastWeatherData']
          keys.forEach(key => storage.remove(key))
          
          this._calcCacheSize()
          wx.showToast({ title: '缓存已清除', icon: 'success' })
        }
      },
    })
  },

  // 屏幕亮度
  _getScreenBrightness() {
    wx.getScreenBrightness({
      success: (res) => {
        this.setData({ screenBrightness: Math.round(res.value * 100) })
      },
      fail: () => {
        this.setData({ screenBrightness: '获取失败' })
      },
    })
  },

  onBrightnessChange(e) {
    const val = e.detail.value
    wx.setScreenBrightness({
      value: val / 100,
      success: () => {
        this.setData({ screenBrightness: val })
      },
    })
  },

  _setKeepScreenOn(b) {
    wx.setKeepScreenOn({
      keepScreenOn: b,
      success: () => {
        this.setData({ keepscreenon: b })
      },
    })
  },

  goBack() {
    wx.navigateBack()
  },

  // NFC 检测
  checkNFC() {
    wx.showLoading({ title: '检测中...' })
    wx.getHCEState({
      success() {
        wx.hideLoading()
        wx.showModal({
          title: 'NFC 检测',
          content: '✅ 该设备支持 NFC 功能',
          showCancel: false,
          confirmText: '好的',
        })
      },
      fail() {
        wx.hideLoading()
        wx.showModal({
          title: 'NFC 检测',
          content: '❌ 该设备不支持 NFC 功能',
          showCancel: false,
          confirmText: '好的',
        })
      },
    })
  },

  // 系统信息
  goSystemInfo() {
    wx.navigateTo({ url: '/pages/systeminfo/systeminfo' })
  },

  // 版本兼容性检查
  _checkUpdateSupport() {
    const sysInfo = getApp().globalData.systemInfo
    const sdk = sysInfo.SDKVersion || ''
    const version = cmpVersion(sdk, '1.9.90')
    this.setData({
      SDKVersion: sdk,
      enableUpdate: version >= 0,
    })
  },

  // 加载设置
  _loadSetting() {
    const setting = storage.get('setting', {})
    const tempUnit = storage.get('tempUnit', 'celsius')
    const refreshInterval = storage.get('refreshInterval', 30)
    this.setData({ setting, tempUnit, refreshInterval })
  },

  // 悬浮球复位
  resetMenu() {
    storage.set('pos', { top: 'auto', left: 'auto' })
    wx.showToast({ title: '悬浮球已复位' })
  },

  // 初始化设置
  resetSetting() {
    wx.showModal({
      title: '确认',
      content: '确定要恢复默认设置吗？',
      confirmText: '确定',
      cancelText: '取消',
      success: (res) => {
        if (res.confirm) {
          storage.remove('setting')
          storage.remove('tempUnit')
          storage.remove('refreshInterval')
          this.setData({ setting: {}, tempUnit: 'celsius', refreshInterval: 30 })
          wx.showToast({ title: '已恢复默认' })
        }
      },
    })
  },

  // 清除所有数据
  clearAll() {
    wx.showModal({
      title: '确认',
      content: '确定要清除所有本地数据？此操作不可恢复。',
      confirmText: '清除',
      cancelText: '取消',
      success: (res) => {
        if (res.confirm) {
          storage.clear()
          getApp().clearWeatherCache()
          this.setData({ setting: {}, pos: {}, tempUnit: 'celsius', refreshInterval: 30 })
          this._calcCacheSize()
          wx.showToast({ title: '已清除所有数据' })
        }
      },
    })
  },
})
