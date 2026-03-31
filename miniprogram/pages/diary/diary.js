/**
 * 易观风云 v3.0 - 天气日记页面
 * 记录每日心情和天气感受
 */
const { storage } = require('../../utils/helpers')
const { formatDate } = require('../../utils/weather')

Page({
  data: {
    statusBarHeight: 0,
    isIPhoneX: false,

    // 当前天气信息
    currentWeather: null,
    currentCity: '',

    // 日记列表
    diaries: [],
    isEmpty: true,

    // 输入状态
    isWriting: false,
    mood: 'happy', // happy, good, normal, sad, bad
    content: '',
    weatherInfo: '',

    // 心情选项
    moods: [
      { key: 'happy', emoji: '😄', label: '开心' },
      { key: 'good', emoji: '😊', label: '不错' },
      { key: 'normal', emoji: '🙂', label: '一般' },
      { key: 'sad', emoji: '😔', label: '低落' },
      { key: 'bad', emoji: '😢', label: '糟糕' },
    ],
  },

  onLoad() {
    const app = getApp()
    this.setData({
      statusBarHeight: app.globalData.statusBarHeight || 44,
      navBarTotalHeight: app.globalData.navBarTotalHeight || (app.globalData.statusBarHeight + 88),
      isIPhoneX: app.globalData.isIPhoneX,
    })
    this.loadDiaries()
    this.loadCurrentWeather()
  },

  onShow() {
    this.loadDiaries()
    this.loadCurrentWeather()
  },

  // 加载当前天气
  loadCurrentWeather() {
    const cache = getApp().globalData.weatherCache
    // 从缓存获取当前天气
    const keys = Object.keys(cache)
    if (keys.length > 0) {
      const latestKey = keys[0]
      const data = cache[latestKey]
      if (data && data.current) {
        this.setData({
          currentWeather: data.current,
          currentCity: data.cityInfo?.name || '',
        })
        this.setData({
          weatherInfo: `${data.current.weather} ${data.current.temp}°`,
        })
      }
    }
  },

  // 加载日记列表
  loadDiaries() {
    const diaries = storage.get('diaries', [])
    // 按日期倒序排列
    diaries.sort((a, b) => new Date(b.date) - new Date(a.date))
    this.setData({
      diaries,
      isEmpty: diaries.length === 0,
    })
  },

  // 开始写日记
  startWrite() {
    this.setData({ isWriting: true })
  },

  // 取消写日记
  cancelWrite() {
    this.setData({
      isWriting: false,
      mood: 'happy',
      content: '',
    })
  },

  // 选择心情
  selectMood(e) {
    const mood = e.currentTarget.dataset.mood
    this.setData({ mood })
  },

  // 输入内容
  onContentInput(e) {
    this.setData({ content: e.detail.value })
  },

  // 保存日记
  saveDiary() {
    const { mood, content, weatherInfo, currentCity } = this.data

    if (!content.trim()) {
      wx.showToast({ title: '请输入内容', icon: 'none' })
      return
    }

    const diary = {
      id: Date.now(),
      date: formatDate(new Date(), 'yyyy-MM-dd'),
      time: formatDate(new Date(), 'hh:mm'),
      weekDay: this._getWeekDay(),
      mood,
      content: content.trim(),
      weather: weatherInfo || '',
      city: currentCity || '',
    }

    const diaries = storage.get('diaries', [])
    diaries.unshift(diary)
    storage.set('diaries', diaries)

    this.setData({
      isWriting: false,
      mood: 'happy',
      content: '',
      diaries,
      isEmpty: false,
    })

    wx.showToast({ title: '保存成功', icon: 'success' })
  },

  // 获取星期几
  _getWeekDay() {
    const weekDays = ['周日', '周一', '周二', '周三', '周四', '周五', '周六']
    return weekDays[new Date().getDay()]
  },

  // 删除日记
  deleteDiary(e) {
    const id = e.currentTarget.dataset.id

    wx.showModal({
      title: '确认删除',
      content: '确定要删除这篇日记吗？',
      confirmText: '删除',
      cancelText: '取消',
      success: (res) => {
        if (res.confirm) {
          const diaries = this.data.diaries.filter(d => d.id !== id)
          storage.set('diaries', diaries)
          this.setData({
            diaries,
            isEmpty: diaries.length === 0,
          })
          wx.showToast({ title: '已删除', icon: 'success' })
        }
      },
    })
  },

  // 查看日记详情
  viewDiary(e) {
    const id = e.currentTarget.dataset.id
    const diary = this.data.diaries.find(d => d.id === id)
    if (!diary) return

    wx.showModal({
      title: `${diary.date} ${diary.weekDay}`,
      content: `${diary.weather}\n\n${diary.content}`,
      showCancel: false,
      confirmText: '关闭',
    })
  },

  // 心情图标映射
  getMoodEmoji(mood) {
    const moodMap = {
      happy: '😄',
      good: '😊',
      normal: '🙂',
      sad: '😔',
      bad: '😢',
    }
    return moodMap[mood] || '🙂'
  },
})
