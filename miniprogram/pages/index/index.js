/**
 * 易观风云 v3.0 - 主页面
 * 支持多城市切换、搜索面板、WAQI 真实 AQI、生活指数
 */
const api = require('../../utils/api.js')
const weather = require('../../utils/weather.js')
const { storage, showError } = require('../../utils/helpers.js')
const { getWeatherGradient, formatDate, calcPM, getGreeting } = weather

const app = getApp()

// 默认保存的城市
const DEFAULT_CITIES = [{ name: '定位中...', lat: null, lon: null, isLocation: true }]

// 天气代码到动画类别的映射
const WEATHER_EFFECT_MAP = {
  'rain': 'effect-rain',
  'drizzle': 'effect-rain',
  'thunderstorm': 'effect-thunder',
  'snow': 'effect-snow',
  'sleet': 'effect-snow',
  'fog': 'effect-fog',
  'mist': 'effect-fog',
  'haze': 'effect-fog',
  'heavy rain': 'effect-heavy-rain',
}

Page({
  data: {
    loading: true,
    refreshing: false,
    statusBarHeight: 20,
    navBarContentHeight: 44,
    navBarTotalHeight: 64,
    navContentPaddingRight: 100,
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

    // 天气动画
    weatherEffectClass: '',

    // 日出日落
    sunProgress: 0,
    sunProgressPct: 0,
    sunX: 0,
    sunY: 0,
    daylightRemaining: '',
    nextSunEvent: '',

    // 搜索面板
    searchPanelShow: false,
    searchText: '',
    searchSuggestions: [],
    searchHistory: [],
    hotCities: ['北京', '上海', '广州', '深圳', '杭州', '成都', '武汉', '南京', '重庆', '西安', '长沙', '天津'],
  },

  onLoad() {
    const g = app.globalData
    const menuLeft = g.menuButtonLeft || 0
    this.setData({
      statusBarHeight: g.statusBarHeight || 20,
      navBarContentHeight: g.navBarContentHeight || 44,
      navBarTotalHeight: g.navBarTotalHeight || 64,
      navContentPaddingRight: menuLeft > 0 ? (menuLeft - 8) : 100,
      isIPhoneX: g.isIPhoneX,
      searchHistory: storage.get('searchHistory', []),
      savedCities: storage.get('savedCities', null) || DEFAULT_CITIES,
    })
    this.loadWeatherForCity(0)
  },

  onShow() {
    this.setData({ greeting: getGreeting() })
    // 从城市选择页返回时，添加选中的城市
    if (this.data._selectedCity) {
      const cityName = this.data._selectedCity
      this.setData({ _selectedCity: '', _cityChanged: false })
      api.fetchWeatherByCity(cityName).then(data => {
        const name = data.cityInfo ? data.cityInfo.name : cityName
        const lat = data.cityInfo ? data.cityInfo.latitude : null
        const lon = data.cityInfo ? data.cityInfo.longitude : null
        this.addCity({ name, lat, lon })
      }).catch(() => {})
    }
  },

  // ========== 多城市 ==========
  switchCity(e) {
    const idx = e.currentTarget.dataset.index
    if (idx === this.data.activeCityIndex) return
    this.setData({ activeCityIndex: idx })
    this.loadWeatherForCity(idx)
  },

  // 城市长按删除
  onCityLongPress(e) {
    const idx = e.currentTarget.dataset.index
    const city = this.data.savedCities[idx]
    
    // 定位城市不能删除
    if (city.isLocation) {
      wx.showToast({ title: '定位城市无法删除', icon: 'none' })
      return
    }

    wx.showModal({
      title: '删除城市',
      content: `确定删除 ${city.name} 吗？`,
      confirmText: '删除',
      cancelText: '取消',
      success: (res) => {
        if (res.confirm) {
          this.deleteCity(idx)
        }
      },
    })
  },

  deleteCity(idx) {
    const cities = [...this.data.savedCities]
    cities.splice(idx, 1)
    
    let newActiveIdx = this.data.activeCityIndex
    if (idx < this.data.activeCityIndex) {
      newActiveIdx--
    } else if (idx === this.data.activeCityIndex) {
      newActiveIdx = Math.min(newActiveIdx, cities.length - 1)
    }

    this.setData({
      savedCities: cities,
      activeCityIndex: Math.max(0, newActiveIdx),
    })
    storage.set('savedCities', cities)
    
    // 如果删除的是当前城市，刷新天气
    if (cities.length > 0) {
      this.loadWeatherForCity(this.data.activeCityIndex)
    }
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
    wx.switchTab({ url: '/pages/setting/setting' })
  },

  // ========== 加载天气 ==========
  loadWeatherForCity(idx) {
    const city = this.data.savedCities[idx]
    if (!city) return
    
    // 检查缓存（5分钟内不重复请求）
    const cacheKey = city.isLocation ? 'location' : `${city.lat}_${city.lon}`
    const cachedData = app.getWeatherCache(cacheKey)
    if (cachedData && !this.data.refreshing) {
      console.log('使用缓存数据')
      this._applyWeatherData(cachedData, city.name)
      this._loadExtraData(city.lat || cachedData.cityInfo?.latitude, city.lon || cachedData.cityInfo?.longitude, cachedData)
      this.setData({ loading: false })
      return
    }

    this.setData({ loading: true })

    if (city.isLocation || !city.lat) {
      // 定位城市
      api.fetchWeatherByLocation()
        .then(data => {
          const name = data.cityInfo ? data.cityInfo.name : '当前定位'
          this._applyWeatherData(data, name)
          // 缓存数据
          app.setWeatherCache('location', data)
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
          // 缓存数据
          app.setWeatherCache(cacheKey, data)
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

  // ========== 天气动画触发逻辑 ==========
  _setWeatherEffect(weatherCode, weatherDesc) {
    const desc = weatherDesc.toLowerCase()
    
    // 先检查关键词
    if (desc.includes('雷')) {
      this.setData({ weatherEffectClass: 'effect-thunder' })
      return
    }
    if (desc.includes('雪')) {
      this.setData({ weatherEffectClass: 'effect-snow' })
      return
    }
    if (desc.includes('雨') && (desc.includes('大') || desc.includes('暴'))) {
      this.setData({ weatherEffectClass: 'effect-heavy-rain' })
      return
    }
    if (desc.includes('雨')) {
      this.setData({ weatherEffectClass: 'effect-rain' })
      return
    }
    if (desc.includes('雾') || desc.includes('霾') || desc.includes('雾')) {
      this.setData({ weatherEffectClass: 'effect-fog' })
      return
    }

    // 检查天气代码
    const codeStr = String(weatherCode).toLowerCase()
    for (const [key, effect] of Object.entries(WEATHER_EFFECT_MAP)) {
      if (codeStr.includes(key) || desc.includes(key)) {
        this.setData({ weatherEffectClass: effect })
        return
      }
    }

    // 默认无动画
    this.setData({ weatherEffectClass: '' })
  },

  // ========== 日出日落弧线计算 ==========
  _calcSunProgress(sunrise, sunset) {
    if (!sunrise || !sunset || sunrise === '--:--' || sunset === '--:--') {
      return
    }

    const now = new Date()
    const todayStr = formatDate(now, 'yyyy-MM-dd')
    
    // 解析日出日落时间
    const srArr = sunrise.split(':')
    const ssArr = sunset.split(':')
    
    const srTime = new Date(todayStr + 'T' + srArr[0] + ':' + srArr[1])
    const ssTime = new Date(todayStr + 'T' + ssArr[0] + ':' + ssArr[1])
    
    // 计算进度
    const totalDaylight = ssTime - srTime // 白天时长（毫秒）
    const elapsed = now - srTime // 已过去的时间
    
    let progress = 0
    if (now < srTime) {
      progress = 0 // 未日出
    } else if (now > ssTime) {
      progress = 1 // 已日落
    } else {
      progress = elapsed / totalDaylight
    }

    // 计算太阳位置（基于圆弧）
    const arcWidth = 280 // 弧线宽度
    const arcHeight = 80 // 弧线高度
    
    // 使用正弦函数计算太阳位置
    const angle = Math.PI * progress // 0 到 PI
    const x = (arcWidth / 2) * (1 - Math.cos(angle)) // 从左到右
    const y = arcHeight * Math.sin(angle) // 弧度

    // 计算剩余白天时间
    let daylightRemaining = ''
    let nextSunEvent = ''
    
    if (now < srTime) {
      const waitMs = srTime - now
      const mins = Math.round(waitMs / 60000)
      nextSunEvent = `${mins}分钟后日出`
    } else if (now > ssTime) {
      // 计算明天日出
      const tomorrowSr = new Date(srTime.getTime() + 24 * 60 * 60 * 1000)
      const waitMs = tomorrowSr - now
      const hours = Math.floor(waitMs / 3600000)
      const mins = Math.round((waitMs % 3600000) / 60000)
      nextSunEvent = `${hours}小时${mins}分后日出`
    } else {
      const remainingMs = ssTime - now
      const hours = Math.floor(remainingMs / 3600000)
      const mins = Math.round((remainingMs % 3600000) / 60000)
      if (hours > 0) {
        daylightRemaining = `${hours}小时${mins}分`
      } else {
        daylightRemaining = `${mins}分钟`
      }
      nextSunEvent = `${sunset}日落`
    }

    this.setData({
      sunProgress: progress,
      sunProgressPct: progress * 100,
      sunX: x,
      sunY: y,
      daylightRemaining,
      nextSunEvent,
    })
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

    // 设置天气动画
    this._setWeatherEffect(cur.weatherCode, cur.weather)
    
    // 计算日出日落进度
    this._calcSunProgress(today.sunrise, today.sunset)

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
    // 刷新时清除缓存，确保获取最新数据
    app.clearWeatherCache()
    this._loadWeatherForRefresh(this.data.activeCityIndex)
    // 超时保护，防止刷新状态卡住
    if (this._refreshTimer) clearTimeout(this._refreshTimer)
    this._refreshTimer = setTimeout(() => {
      if (this.data.refreshing) {
        this.setData({ refreshing: false })
      }
    }, 10000)
  },

  // 刷新专用加载（不设 loading，避免内容消失）
  _loadWeatherForRefresh(idx) {
    const city = this.data.savedCities[idx]
    if (!city) {
      this.setData({ refreshing: false })
      return
    }

    if (city.isLocation || !city.lat) {
      api.fetchWeatherByLocation()
        .then(data => {
          const name = data.cityInfo ? data.cityInfo.name : '当前定位'
          this._applyWeatherData(data, name)
          if (data.cityInfo) {
            const cities = [...this.data.savedCities]
            cities[0] = { name, lat: data.cityInfo.latitude, lon: data.cityInfo.longitude, isLocation: true }
            this.setData({ savedCities: cities })
            storage.set('savedCities', cities)
            this._loadExtraData(data.cityInfo.latitude, data.cityInfo.longitude, data)
          }
          this.setData({ refreshing: false })
        })
        .catch(() => {
          this.setData({ refreshing: false })
          showError('天气刷新失败，请检查网络')
        })
    } else {
      api.fetchWeather(city.lat, city.lon)
        .then(data => {
          this._applyWeatherData(data, city.name)
          this._loadExtraData(city.lat, city.lon, data)
          this.setData({ refreshing: false })
        })
        .catch(() => {
          this.setData({ refreshing: false })
          showError('天气刷新失败')
        })
    }
  },

  // ========== 分享功能 ==========
  onShareAppMessage() {
    return {
      title: `${this.data.cityName} ${this.data.currentTemp}° ${this.data.currentWeather} - 易观风云`,
      path: '/pages/index/index',
    }
  },

  // 朋友圈分享
  onShareTimeline() {
    return {
      title: `${this.data.cityName} ${this.data.currentTemp}° ${this.data.currentWeather}`,
      query: '',
      imageUrl: '',
    }
  },

  // 分享卡片（生成图片分享）
  onShareCard() {
    wx.showToast({
      title: '卡片分享功能开发中',
      icon: 'none',
    })
    // TODO: 可以使用 wx.canvasToTempFilePath 生成海报
  },
})
