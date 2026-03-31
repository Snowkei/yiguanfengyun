Page({
  data: {
    statusBarHeight: 0,
    version: '2.0.0',
    projectAddress: 'https://github.com/Snowkei/yiguanfengyun',
    github: 'https://github.com/Snowkei',
  },

  onLoad() {
    const app = getApp()
    this.setData({
      statusBarHeight: app.globalData.statusBarHeight || 44,
      navBarTotalHeight: app.globalData.navBarTotalHeight || (app.globalData.statusBarHeight + 88),
    })
  },

  goBack() {
    wx.navigateBack()
  },

  copy(e) {
    const content = e.currentTarget.dataset.content
    wx.setClipboardData({
      data: content,
      success() {
        wx.showToast({ title: '已复制' })
      },
    })
  },

  onShareAppMessage() {
    return {
      title: '易观风云 - 好看又好用的天气小程序',
      path: '/pages/index/index',
    }
  },
})
