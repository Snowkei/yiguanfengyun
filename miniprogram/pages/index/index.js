/**
 * 易观风云 v2.1 - 主页面
 * 支持多城市切换、搜索面板、WAQI 真实 AQI、生活指数
 */
const api = require('../../utils/api.js')
const weather = require('../../utils/weather.js')
const { storage, showError } = require('../../utils/helpers.js')
const { getWeatherGradient, formatDate, calcPM, getGreeting } = weather

const app = getApp()

// 默认保存的城市
const DEFAULT_CITIES = [{ name: '定位中...', lat: null, lon: null, isLocation: true }]

Page({
  data: {
    loading: true,
    refreshing: false,
    statusBarHeight: 0,
    isIPhoneX: false,

    // 多城市
    savedCities: DEFAULT_CITIES,
    activeCityIndex: 0,

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

    // 空气质量 & 生活指数
    aqiDetail: null,
    lifeIndices: [],

    // 背景
    bgStyle: '',
    gradientColors: ['#667eea', '#764ba2'],

    // 搜索面板
    searchPanelShow: false,
    searchText: '',
    searchSuggestions: [],
    searchHistory: [],
    hotCities: ['北京', '上海', '广州', '深圳', '杭州', '成都', '武汉', '南京', '重庆', '西安', '长沙', '天津'],
  },

  onLoad() {
    this.setData({
      statusBarHeight: app.globalData.statusBarHeight || 44,
      isIPhoneX: app.globalData.isIPhoneX,
      searchHistory: storage.get('searchHistory', []),
      savedCities: storage.get('savedCities', null) || DEFAULT_CITIES,
    })
    this.loadWeatherForCity(0)
  },

  onShow() {
    this.setData({ greeting: getGreeting() })
  },

  // ========== 多城市 ==========
  switchCity(e) {
    const idx = e.currentTarget.dataset.index
    if (idx === this.data.activeCityIndex) return
    this.setData({ activeCityIndex: idx })
    this.loadWeatherForCity(idx)
  },

  addCity(cityInfo) {
    // 检查是否已存在
    const exists = this.data.savedCities.some(c => c.name === cityInfo.name)
    if (exists) {
      const idx = this.data.savedCities.findIndex(c => c.name === cityInfo.name)
      this.setData({ activeCityIndex: idx })
      this.loadWeatherForCity(idx)
      return
    }
    const cities = [...this.data.savedCities, cityInfo]
    this.setData({ savedCities: cities })
    storage.set('savedCities', cities)
    // 切换到新城市
    const idx = cities.length - 1
    this.setData({ activeCityIndex: idx })
    this.loadWeatherForCity(idx)
  },

  goCityChoose() {
    wx.navigateTo({ url: '/pages/citychoose/citychoose' })
  },

  goSetting() {
    wx.navigateTo({ url: '/pages/setting/setting' })
  },

  // ========== 加载天气 ==========
  loadWeatherForCity(idx) {
    const city = this.data.savedCities[idx]
    if (!city) return
    this.setData({ loading: true })

    if (city.isLocation || !city.lat) {
      // 定位城市
      api.fetchWeatherByLocation()
        .then(data => {
          const name = data.cityInfo ? data.cityInfo.name : '当前定位'
          this._applyWeatherData(data, name)
          // 更新定位城市的坐标
          if (data.cityInfo) {
            const cities = [...this.data.savedCities]
            cities[0] = { name, lat: data.cityInfo.latitude, lon: data.cityInfo.longitude, isLocation: true }
            this.setData({ savedCities: cities })
            storage.set('savedCities', cities)
            this._loadExtraData(data.cityInfo.latitude, data.cityInfo.longitude, data)
          }
          this.setData({ loading: false, refreshing: false })
        })
        .catch(err => {
          console.error('加载天气失败:', err)
          this.setData({ loading: false, refreshing: false })
          showError('天气加载失败，请检查网络')
        })
    } else {
      // 指定城市
      api.fetchWeather(city.lat, city.lon)
        .then(data => {
          this._applyWeatherData(data, city.name)
          this._loadExtraData(city.lat, city.lon, data)
          this.setData({ loading: false, refreshing: false })
        })
        .catch(err => {
          console.error('加载天气失败:', err)
          this.setData({ loading: false, refreshing: false })
          showError('天气加载失败')
        })
    }
  },

  // ========== 补充数据 ==========
  _loadExtraData(lat, lon, weatherData) {
    api.fetchAQI(lat, lon).then(aqiData => {
      if (aqiData && aqiData.pm25 !== null) {
        const pmVal = Math.round(aqiData.pm25)
        const pm = calcPM(pmVal)
        this.setData({
          pm,
          aqiDetail: {
            ...aqiData,
            pollutants: [
              { key: 'PM2.5', value: aqiData.pm25, color: pm.color },
              { key: 'PM10', value: aqiData.pm10 || '--', color: pm.color },
              { key: 'NO₂', value: aqiData.no2 || '--', color: '#667eea' },
              { key: 'SO₂', value: aqiData.so2 || '--', color: '#667eea' },
              { key: 'CO', value: aqiData.co || '--', color: '#667eea' },
              { key: 'O₃', value: aqiData.o3 || '--', color: '#667eea' },
            ],
          },
        })
      }
    }).catch(() => {})

    api.fetchLifeIndices(lat, lon).then(indices => {
      if (indices && indices.length > 0) {
        this.setData({ lifeIndices: this._formatIndices(indices) })
      } else {
        this.setData({ lifeIndices: this._formatIndices(api.generateLifeIndices(weatherData)) })
      }
    }).catch(() => {
      this.setData({ lifeIndices: this._formatIndices(api.generateLifeIndices(weatherData)) })
    })
  },

  _formatIndices(indices) {
    if (!indices || indices.length === 0) return []
    const icons = { 1: '👔', 3: '💊', 4: '🏃', 5: '☀️', 6: '🚗', 7: '🏖️', 9: '🧴', 10: '😊', 13: '🤧', 14: '👕' }
    return indices.map(item => ({ ...item, icon: icons[item.type] || '📋' }))
  },

  _applyWeatherData(data, cityName) {
    const cur = data.current
    const today = data.daily[0] || {}
    const gradient = getWeatherGradient(cur.weather)
    const pmVal = this._estimatePM(cur)
    const pm = calcPM(pmVal)

    const allTemps = []
    data.daily.forEach(d => { allTemps.push(d.low, d.high) })
    const gMin = Math.min(...allTemps)
    const gMax = Math.max(...allTemps)
    const range = gMax - gMin || 1

    const dailyData = data.daily.map(d => ({
      ...d,
      tempLeft: ((d.low - gMin) / range) * 60 + 5,
      tempWidth: ((d.high - d.low) / range) * 60 + 10,
      tempColor: this._getTempColor(d.low, d.high),
    }))

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
      aqiDetail: null,
      lifeIndices: [],
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

  // ========== 搜索面板 ==========
  showSearchPanel() {
    this.setData({ searchPanelShow: true, searchText: '', searchSuggestions: [] })
  },

  hideSearchPanel() {
    this.setData({ searchPanelShow: false, searchText: '', searchSuggestions: [] })
  },

  onSearchInput(e) {
    const val = (e.detail.value || '').trim()
    if (!val) {
      this.setData({ searchSuggestions: [] })
      return
    }
    // 实时搜索建议
    api.geocode(val).then(loc => {
      this.setData({
        searchSuggestions: [{ name: loc.name, admin1: loc.admin1, admin2: loc.admin2, lat: loc.latitude, lon: loc.longitude }],
      })
    }).catch(() => {
      this.setData({ searchSuggestions: [] })
    })
  },

  onSearchConfirm(e) {
    const val = (e.detail.value || '').trim()
    if (!val) return
    this._searchAndAddCity(val)
  },

  onSuggestionTap(e) {
    const name = e.currentTarget.dataset.name
    if (!name) return
    this._searchAndAddCity(name)
  },

  _searchAndAddCity(cityName) {
    api.fetchWeatherByCity(cityName).then(data => {
      const name = data.cityInfo ? data.cityInfo.name : cityName
      const lat = data.cityInfo ? data.cityInfo.latitude : null
      const lon = data.cityInfo ? data.cityInfo.longitude : null

      // 加到搜索历史
      const history = [name, ...this.data.searchHistory.filter(h => h !== name)].slice(0, 10)
      this.setData({ searchHistory: history })
      storage.set('searchHistory', history)

      // 添加城市并切换
      this.hideSearchPanel()
      this.addCity({ name, lat, lon })
    }).catch(err => {
      showError(err.message || '未找到该城市')
    })
  },

  clearSearchHistory() {
    this.setData({ searchHistory: [] })
    storage.remove('searchHistory')
  },

  // ========== 下拉刷新 ==========
  onPullDownRefresh() {
    this.setData({ refreshing: true })
    this.loadWeatherForCity(this.data.activeCityIndex)
  },

  onShareAppMessage() {
    return {
      title: `${this.data.cityName} ${this.data.currentTemp}° ${this.data.currentWeather} - 易观风云`,
      path: '/pages/index/index',
    }
  },
})
