Page({
  data: {
    version: '2.0.0',
    projectAddress: 'https://github.com/Snowkei/yiguanfengyun',
    github: 'https://github.com/Snowkei',
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
