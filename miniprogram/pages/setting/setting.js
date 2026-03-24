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
  },

  onShow() {
    this.setData({
      statusBarHeight: getApp().globalData.statusBarHeight || 44,
      keepscreenon: getApp().globalData.keepscreenon || false,
    })
    this._checkUpdateSupport()
    this._getScreenBrightness()
    this._loadSetting()
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
    this.setData({ setting })
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
          this.setData({ setting: {} })
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
          this.setData({ setting: {}, pos: {} })
          wx.showToast({ title: '已清除所有数据' })
        }
      },
    })
  },
})
