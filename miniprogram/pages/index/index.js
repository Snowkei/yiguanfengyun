/**
 * 易观风云 - 主页面
 */
const api = require('../../utils/api.js')
const weather = require('../../utils/weather.js')
const { storage, showError } = require('../../utils/helpers')
const { getWeatherGradient, formatDate, calcPM, getGreeting } = weather

const app = getApp()

Page({
  data: {
    loading: true,
    refreshing: false,
    statusBarHeight: 0,
    isIPhoneX: false,

    // 天气
    cityName: '定位中...',
    updateTime: '',
    currentTemp: '--',
    currentWeather: '',
    currentIcon: '',
    greeting: '',
    pm: {},

    // 详情
    feelsLike: '--',
    humidity: '--',
    windSpeed: '--',
    windDir: '--',
    pressure: '--',
    uvIndex: '--',
    sunrise: '--:--',
    sunset: '--:--',
    precipProb: '--',

    // 预报
    hourlyData: [],
    dailyData: [],

    // 背景
    bgStyle: '',
    gradientColors: ['#667eea', '#764ba2'],

    // 搜索
    searchText: '',

    // 背景图选择
    bcgImgAreaShow: false,
    bcgImg: '',

    // 悬浮菜单
    hasPopped: false,
    pos: {},
    animationMain: {},
    animationOne: {},
    animationTwo: {},
    animationThree: {},
  },

  onLoad() {
    this.setData({
      statusBarHeight: app.globalData.statusBarHeight || 44,
      isIPhoneX: app.globalData.isIPhoneX,
    })
    this.loadWeather()
  },

  onShow() {
    this.setData({ greeting: getGreeting() })

    // 检查城市切换
    const pages = getCurrentPages()
    const cur = pages[pages.length - 1]
    if (cur && cur.data._cityChanged) {
      const city = cur.data._selectedCity
      cur.setData({ _cityChanged: false, _selectedCity: '' })
      if (city) this.searchCity(city)
    }

    this._loadMenuPos()
  },

  // ========== 加载天气 ==========
  loadWeather() {
    this.setData({ loading: true })

    api.fetchWeatherByLocation()
      .then(data => {
        this._applyWeatherData(data, '当前定位')
        this.setData({ loading: false, refreshing: false })
        storage.set('weatherCache', { data, time: Date.now() })
      })
      .catch(err => {
        console.error('加载天气失败:', err)
        this.setData({ loading: false, refreshing: false })
        showError('天气加载失败，请检查网络')
      })
  },

  searchCity(cityName) {
    if (!cityName || !cityName.trim()) return
    this.setData({ loading: true })

    api.fetchWeatherByCity(cityName.trim())
      .then(data => {
        const name = data.cityInfo ? data.cityInfo.name : cityName
        this._applyWeatherData(data, name)
        this.setData({ loading: false })
        storage.set('weatherCache', { data, time: Date.now() })
      })
      .catch(err => {
        console.error('搜索城市失败:', err)
        this.setData({ loading: false })
        showError(err.message || '未找到该城市')
      })
  },

  // 应用天气数据到页面
  _applyWeatherData(data, cityName) {
    const cur = data.current
    const today = data.daily[0] || {}
    const gradient = getWeatherGradient(cur.weather)

    // PM2.5 估算（Open-Meteo 不提供 PM2.5，根据天气状况估算）
    const pmVal = this._estimatePM(cur)
    const pm = calcPM(pmVal)

    // 计算温度范围条
    const allTemps = []
    data.daily.forEach(d => { allTemps.push(d.low, d.high) })
    const gMin = Math.min(...allTemps)
    const gMax = Math.max(...allTemps)
    const range = gMax - gMin || 1

    const dailyData = data.daily.map(d => {
      return {
        ...d,
        tempLeft: ((d.low - gMin) / range) * 60 + 5,
        tempWidth: ((d.high - d.low) / range) * 60 + 10,
        tempColor: this._getTempColor(d.low, d.high),
      }
    })

    this.setData({
      cityName: cityName || '当前位置',
      currentTemp: String(cur.temp),
      currentWeather: cur.weather,
      currentIcon: cur.icon,
      gradientColors: gradient,
      bgStyle: `background: linear-gradient(135deg, ${gradient[0]} 0%, ${gradient[1]} 100%)`,
      pm,
      hourlyData: data.hourly,
      dailyData,
      feelsLike: String(cur.feelsLike),
      humidity: String(cur.humidity),
      windSpeed: String(cur.windSpeed),
      windDir: cur.windDir,
      pressure: String(cur.pressure),
      uvIndex: today.uvIndex !== undefined ? this._uvText(today.uvIndex) : '--',
      sunrise: today.sunrise || '--:--',
      sunset: today.sunset || '--:--',
      precipProb: today.precipProb !== undefined ? String(today.precipProb) : '--',
      updateTime: formatDate(new Date(), 'MM-dd hh:mm'),
    })
  },

  _estimatePM(cur) {
    if (cur.weather.indexOf('雾') !== -1 || cur.weather.indexOf('霾') !== -1) return 150
    if (cur.weather.indexOf('雨') !== -1 || cur.weather.indexOf('雪') !== -1) return 30
    if (cur.humidity > 80) return 60
    return 35
  },

  _uvText(val) {
    if (val <= 2) return '低'
    if (val <= 5) return '中等'
    if (val <= 7) return '高'
    if (val <= 10) return '很高'
    return '极高'
  },

  _getTempColor(low, high) {
    if (high <= 0) return '#667eea, #42a5f5'
    if (high <= 10) return '#42a5f5, #26c6da'
    if (high <= 20) return '#26c6da, #66bb6a'
    if (high <= 30) return '#66bb6a, #ffa726'
    return '#ffa726, #ef5350'
  },

  // ========== 搜索 ==========
  onSearchConfirm(e) {
    const val = (e.detail.value || '').replace(/\s+/g, '')
    if (!val) return

    // 彩蛋
    if (val === '520' || val === '521') {
      this.setData({ searchText: '' })
      return
    }

    this.searchCity(val)
    this.setData({ searchText: '' })
  },

  // ========== 下拉刷新 ==========
  onPullDownRefresh() {
    this.setData({ refreshing: true })
    this.loadWeather()
  },

  // ========== 背景 ==========
  showBcgImgArea() {
    this.setData({ bcgImgAreaShow: true })
  },
  hideBcgImgArea() {
    this.setData({ bcgImgAreaShow: false })
  },
  chooseBcg(e) {
    const { src } = e.currentTarget.dataset
    this.setData({
      bcgImg: src || '',
      bcgImgAreaShow: false,
    })
  },

  // ========== 悬浮菜单 ==========
  menuMain() {
    if (!this.data.hasPopped) {
      this._popp()
      this.setData({ hasPopped: true })
    } else {
      this._takeback()
      this.setData({ hasPopped: false })
    }
  },
  menuOne() { this.menuMain(); wx.navigateTo({ url: '/pages/citychoose/citychoose' }) },
  menuTwo() { this.menuMain(); wx.navigateTo({ url: '/pages/setting/setting' }) },
  menuThree() { this.menuMain(); wx.navigateTo({ url: '/pages/about/about' }) },

  _popp() {
    const a = () => wx.createAnimation({ duration: 200, timingFunction: 'ease-out' })
    let m = a(), o1 = a(), o2 = a(), o3 = a()
    m.rotateZ(180).step()
    o1.translate(-50, -60).rotateZ(360).opacity(1).step()
    o2.translate(-90, 0).rotateZ(360).opacity(1).step()
    o3.translate(-50, 60).rotateZ(360).opacity(1).step()
    this.setData({
      animationMain: m.export(),
      animationOne: o1.export(),
      animationTwo: o2.export(),
      animationThree: o3.export(),
    })
  },
  _takeback() {
    const a = () => wx.createAnimation({ duration: 200, timingFunction: 'ease-out' })
    let m = a(), o1 = a(), o2 = a(), o3 = a()
    m.rotateZ(0).step()
    o1.translate(0, 0).rotateZ(0).opacity(0).step()
    o2.translate(0, 0).rotateZ(0).opacity(0).step()
    o3.translate(0, 0).rotateZ(0).opacity(0).step()
    this.setData({
      animationMain: m.export(),
      animationOne: o1.export(),
      animationTwo: o2.export(),
      animationThree: o3.export(),
    })
  },

  menuMainMove(e) {
    if (this.data.hasPopped) { this._takeback(); this.setData({ hasPopped: false }) }
    const sys = app.globalData.systemInfo
    const x = Math.min(sys.windowWidth - 40, Math.max(90, e.touches[0].clientX))
    const y = Math.min(sys.windowHeight - 100, Math.max(60, e.touches[0].clientY))
    this.setData({ pos: { left: x, top: y } })
  },

  _loadMenuPos() {
    this.setData({ pos: storage.get('pos', { left: 0, top: 0 }) })
  },

  onHide() {
    storage.set('pos', this.data.pos)
  },

  onShareAppMessage() {
    return {
      title: `${this.data.cityName} ${this.data.currentTemp}° ${this.data.currentWeather} - 易观风云`,
      path: '/pages/index/index',
    }
  },
})
