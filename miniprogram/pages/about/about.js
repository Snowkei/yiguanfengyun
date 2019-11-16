let utils=require('../../utils/utils.js')
Page({

  /**
   * 页面的初始数据
   */
  data: {
    projectAddress:'https://github.com/2757333816/yiguanfengyun.git',
    github:'https://github.com/2757333816',
    email:'2757333816@qq.com',
    qq:'2757333816',
    swiperHeight:'auto',
    bannerImageList:[
      {
        // src:"../../images/github_2.png",
        title:'易观风云'
      },
      {
        // src: "cloud://qg6000-84c3g.7167-qg6000-84c3g-1300467090/YGFY/weixin.png",
        title: 'WeChat'
      }
    ]
  },

  onLoad () {
    this.initSwiper()
  },

  previewImages(e) {
    let index = e.currentTarget.dataset.index || 0
    let urls = this.data.bannerImgList
    let arr = []
    let imgs = urls.forEach(item => {
      arr.push(item.src)
    })
    wx.previewImage({
      current: arr[index],
      urls: arr,
      success: function (res) { },
      fail: function (res) {
        console.error('previewImage fail: ', res)
      }
    })
  },
  initSwiper() {
    let systeminfo = getApp().globalData.systeminfo
    if (utils.isEmptyObject(systeminfo)) {
      wx.getSystemInfo({
        success: (res) => {
          this.setSwiperHeight(res)
        },
      })
    } else {
      this.setSwiperHeight(systeminfo)
    }
  },
  setSwiperHeight(res) {
    this.setData({
      swiperHeight: `${(res.windowWidth || res.screenWidth) / 375 * 200}px`
    })
  },
  copy(e) {
    let dataset = (e.currentTarget || {}).dataset || {}
    let title = dataset.title || ''
    let content = dataset.content || ''
    wx.setClipboardData({
      data: content,
      success() {
        wx.showToast({
          title: `已复制${title}`,
          duration: 2000,
        })
      },
    })
  }
})