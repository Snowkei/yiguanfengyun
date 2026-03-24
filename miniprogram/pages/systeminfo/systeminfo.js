Page({
  data: {
    systemInfo: {},
    infoList: [
      { key: 'brand', name: '品牌' },
      { key: 'model', name: '型号' },
      { key: 'system', name: '系统' },
      { key: 'platform', name: '平台' },
      { key: 'screenWidth', name: '屏幕宽度', unit: 'px' },
      { key: 'screenHeight', name: '屏幕高度', unit: 'px' },
      { key: 'windowWidth', name: '窗口宽度', unit: 'px' },
      { key: 'windowHeight', name: '窗口高度', unit: 'px' },
      { key: 'statusBarHeight', name: '状态栏高度', unit: 'px' },
      { key: 'pixelRatio', name: '像素比' },
      { key: 'language', name: '语言' },
      { key: 'version', name: '微信版本' },
      { key: 'SDKVersion', name: '基础库版本' },
      { key: 'fontSizeSetting', name: '字体大小', unit: 'px' },
    ],
  },

  onShow() {
    this.setData({
      systemInfo: getApp().globalData.systemInfo || {},
    })
  },
})
