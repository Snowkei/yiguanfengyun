/**
 * 易观风云 - 主页面
 * 全新架构的天气展示
 */
const bmap = require('../../lib/bmap-wx.js')
const weather = require('../../utils/weather.js')
const { cache, showError, storage } = require('../../utils/helpers')
const { getWeatherIcon, getWeatherGradient, formatDate, calcPM, parseCurrentTemp, getGreeting, parseIndex } = weather

const app = getApp()

Page({
  data: {
    // 状态
    loading: true,
    refreshing: false,
    statusBarHeight: 0,
    isIPhoneX: false,

    // 天气数据
    cityName: '定位中...',
    updateTime: '',
    currentTemp: '--',
    currentWeather: '',
    currentIcon: '',
    greeting: '',
    pm: {},
    hourlyData: [],
    weatherData: [],
    indexData: [],

    // 详情
    feelsLike: '',
    humidity: '',
    windDir: '',
    visibility: '',
    uvIndex: '',
    sunrise: '06:12',
    sunset: '18:35',
    pressure: '',
    rainChance: '',

    // 背景
    gradientColors: ['#667eea', '#764ba2'],
    bgStyle: '',

    // 搜索
    searchText: '',
    searchFocused: false,

    // 背景图片选择
    bcgImgAreaShow: false,
    bcgImgIndex: 0,
    bcgImgList: [
      { src: '/images/beach.jpg', topColor: '#393836' },
      { src: '/images/clouds.jpg', topColor: '#0085e5' },
      { src: '/images/sunset.jpg', topColor: '#2d2225' },
      { src: '/images/clear-sky.jpg', topColor: '#004a89' },
    ],
    bcgImg: '',

    // 悬浮菜单
    hasPopped: false,
    pos: {},
    animationMain: {},
    animationOne: {},
    animationTwo: {},
    animationThree: {},
    enableSearch: true,
    showHeartbeat: true,

    // 设置
    setting: {},
  },

  onLoad() {
    const sysInfo = app.globalData.systemInfo
    this.setData({
      statusBarHeight: app.globalData.statusBarHeight,
      isIPhoneX: app.globalData.isIPhoneX,
    })
    this.initData()
  },

  onShow() {
    // 检查城市是否切换
    const pages = getCurrentPages()
    const currentPage = pages[pages.length - 1]
    if (currentPage && currentPage.data._cityChanged) {
      const cityName = currentPage.data._selectedCity
      currentPage.setData({ _cityChanged: false, _selectedCity: '' })
      this.searchCity(cityName)
    }

    this.setData({ greeting: getGreeting() })
    this.setMenuPosition()
  },

  // ========== 数据初始化 ==========
  initData() {
    // 尝试从缓存读取
    const cached = storage.get('cityDatas')
    if (cached && cached.originalData) {
      this.processWeatherData(cached)
    }
    // 从定位获取
    this.fetchWeatherByLocation()
  },

  // 通过定位获取天气
  fetchWeatherByLocation() {
    const BMap = new bmap.BMapWX({ ak: app.globalData.ak })

    BMap.weather({
      location: '', // 空字符串=自动定位
      success: (data) => {
        this.processWeatherData(data)
        this.setData({ loading: false, refreshing: false })
        // 缓存
        storage.set('cityDatas', data)
      },
      fail: (err) => {
        this.setData({ loading: false, refreshing: false })
        showError('定位失败，请检查权限设置')
      },
    })
  },

  // 处理天气数据
  processWeatherData(data) {
    if (!data || !data.originalData) return

    const results = data.originalData.results[0] || {}
    const currentCity = results.currentCity || '未知城市'
    const weatherData = results.weather_data || []
    const indexArr = results.index || []
    const pm25 = results.pm25 || 0

    // 当前天气
    const current = weatherData[0] || {}
    const currentTemp = parseCurrentTemp(current.date)
    const currentWeather = current.weather || '--'
    const currentIcon = getWeatherIcon(currentWeather)

    // 背景渐变
    const gradient = getWeatherGradient(currentWeather)
    const bgStyle = `background: linear-gradient(135deg, ${gradient[0]} 0%, ${gradient[1]} 100%)`

    // PM2.5
    const pm = calcPM(pm25)

    // 生成24小时预报（模拟）
    const hourlyData = this._generateHourlyForecast(currentTemp, currentWeather)

    // 风向风力
    const windInfo = current.wind || '--'

    // 生活指数
    const indexData = parseIndex(indexArr)

    // 更新时间
    const now = new Date()
    const updateTime = formatDate(now, 'MM-dd hh:mm')

    this.setData({
      cityName: currentCity,
      currentTemp,
      currentWeather,
      currentIcon,
      gradientColors: gradient,
      bgStyle,
      pm,
      hourlyData,
      weatherData,
      indexData,
      windDir: windInfo,
      updateTime,
      loading: false,
      refreshing: false,
    })
  },

  // 生成24小时预报（根据当日天气模拟）
  _generateHourlyForecast(currentTemp, weatherType) {
    const now = new Date()
    const currentHour = now.getHours()
    const baseTemp = parseInt(currentTemp) || 20
    const hourly = []
    const icon = getWeatherIcon(weatherType)

    for (let i = 0; i < 24; i++) {
      const hour = (currentHour + i) % 24
      // 模拟温度变化曲线
      const hourFactor = Math.sin((hour - 6) / 24 * Math.PI * 2) * 0.5 + 0.5
      const temp = Math.round(baseTemp - 4 + hourFactor * 8 + (Math.random() - 0.5) * 2)
      const timeLabel = i === 0 ? '现在' : `${hour.toString().padStart(2, '0')}:00`

      hourly.push({
        time: timeLabel,
        temp: temp,
        icon: icon,
      })
    }
    return hourly
  },

  // 搜索城市
  searchCity(cityName) {
    if (!cityName || !cityName.trim()) return
    this.setData({ loading: true })

    const BMap = new bmap.BMapWX({ ak: app.globalData.ak })

    // 先地理编码
    wx.request({
      url: app.getGeocoderUrl(cityName),
      success: (res) => {
        const data = res.data || {}
        if (!data.status) {
          const location = (data.result || {}).location || {}
          const locStr = `${location.lng},${location.lat}`
          BMap.weather({
            location: locStr,
            success: (wData) => {
              this.processWeatherData(wData)
              this.setData({ loading: false })
              storage.set('cityDatas', wData)
            },
            fail: () => {
              this.setData({ loading: false })
              showError('获取天气数据失败')
            },
          })
        } else {
          this.setData({ loading: false })
          showError('未找到该城市')
        }
      },
      fail: () => {
        this.setData({ loading: false })
        showError('网络不给力，请稍后再试')
      },
    })
  },

  // 搜索确认
  onSearchConfirm(e) {
    const val = (e.detail.value || '').replace(/\s+/g, '')
    if (!val) return

    // 彩蛋
    if (val === '520' || val === '521') {
      this.setData({ searchText: '' })
      this.dance()
      return
    }

    this.searchCity(val)
    this.setData({ searchText: '' })
  },

  onSearchFocus() {
    this.setData({ searchFocused: true })
  },

  onSearchBlur() {
    this.setData({ searchFocused: false })
  },

  // 下拉刷新
  onPullDownRefresh() {
    this.setData({ refreshing: true })
    this.fetchWeatherByLocation()
  },

  // ========== 背景图 ==========
  showBcgImgArea() {
    this.setData({ bcgImgAreaShow: true })
  },

  hideBcgImgArea() {
    this.setData({ bcgImgAreaShow: false })
  },

  chooseBcg(e) {
    const { index, src } = e.currentTarget.dataset
    this.setData({
      bcgImgIndex: index,
      bcgImg: src,
      bcgImgAreaShow: false,
    })
    storage.set('bcgImgIndex', index)
  },

  // ========== 心跳动画 ==========
  dance() {
    this.setData({ enableSearch: false, showHeartbeat: false })
    setTimeout(() => {
      this.setData({ enableSearch: true, showHeartbeat: true })
    }, 6000)
  },

  // ========== 悬浮菜单 ==========
  menuMain() {
    if (!this.data.hasPopped) {
      this.popp()
      this.setData({ hasPopped: true })
    } else {
      this.takeback()
      this.setData({ hasPopped: false })
    }
  },

  menuOne() {
    this.menuMain()
    wx.navigateTo({ url: '/pages/citychoose/citychoose' })
  },

  menuTwo() {
    this.menuMain()
    wx.navigateTo({ url: '/pages/setting/setting' })
  },

  menuThree() {
    this.menuMain()
    wx.navigateTo({ url: '/pages/about/about' })
  },

  popp() {
    const a = (dur = 200) => wx.createAnimation({ duration: dur, timingFunction: 'ease-out' })
    let main = a(), one = a(), two = a(), three = a()
    main.rotateZ(180).step()
    one.translate(-50, -60).rotateZ(360).opacity(1).step()
    two.translate(-90, 0).rotateZ(360).opacity(1).step()
    three.translate(-50, 60).rotateZ(360).opacity(1).step()
    this.setData({
      animationMain: main.export(),
      animationOne: one.export(),
      animationTwo: two.export(),
      animationThree: three.export(),
    })
  },

  takeback() {
    const a = (dur = 200) => wx.createAnimation({ duration: dur, timingFunction: 'ease-out' })
    let main = a(), one = a(), two = a(), three = a()
    main.rotateZ(0).step()
    one.translate(0, 0).rotateZ(0).opacity(0).step()
    two.translate(0, 0).rotateZ(0).opacity(0).step()
    three.translate(0, 0).rotateZ(0).opacity(0).step()
    this.setData({
      animationMain: main.export(),
      animationOne: one.export(),
      animationTwo: two.export(),
      animationThree: three.export(),
    })
  },

  menuMainMove(e) {
    if (this.data.hasPopped) {
      this.takeback()
      this.setData({ hasPopped: false })
    }
    const sysInfo = app.globalData.systemInfo
    const ww = sysInfo.windowWidth
    const wh = sysInfo.windowHeight
    const touches = e.touches[0]
    let x = Math.min(ww - 40, Math.max(90, touches.clientX))
    let y = Math.min(wh - 100, Math.max(60, touches.clientY))
    this.setData({ pos: { left: x, top: y } })
  },

  setMenuPosition() {
    const pos = storage.get('pos', { left: 0, top: 0 })
    this.setData({ pos })
  },

  onHide() {
    storage.set('pos', this.data.pos)
  },

  // ========== 分享 ==========
  onShareAppMessage() {
    return {
      title: `${this.data.cityName} ${this.data.currentTemp}° ${this.data.currentWeather} - 易观风云`,
      path: '/pages/index/index',
    }
  },
})
