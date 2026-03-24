/**
 * 天气 API 模块
 * 使用 Open-Meteo（完全免费，无需 API Key）
 * https://open-meteo.com/
 *
 * 扩展：
 * - WAQI API 获取真实 PM2.5 / AQI（免费 demo token）
 * - 和风天气 API 获取生活指数（免费）
 */

// ========== WMO 天气代码 → 中文描述 ==========
const WMO_CODES = {
  0: { text: '晴', icon: '☀️' },
  1: { text: '大部晴', icon: '🌤️' },
  2: { text: '多云', icon: '⛅' },
  3: { text: '阴', icon: '☁️' },
  45: { text: '雾', icon: '🌫️' },
  48: { text: '冻雾', icon: '🌫️' },
  51: { text: '小毛毛雨', icon: '🌦️' },
  53: { text: '中毛毛雨', icon: '🌦️' },
  55: { text: '大毛毛雨', icon: '🌦️' },
  56: { text: '冻毛毛雨', icon: '🌨️' },
  57: { text: '冻雨', icon: '🌨️' },
  61: { text: '小雨', icon: '🌧️' },
  63: { text: '中雨', icon: '🌧️' },
  65: { text: '大雨', icon: '🌧️' },
  66: { text: '冻小雨', icon: '🌨️' },
  67: { text: '冻大雨', icon: '🌨️' },
  71: { text: '小雪', icon: '❄️' },
  73: { text: '中雪', icon: '❄️' },
  75: { text: '大雪', icon: '❄️' },
  77: { text: '雪粒', icon: '🌨️' },
  80: { text: '小阵雨', icon: '🌦️' },
  81: { text: '中阵雨', icon: '🌧️' },
  82: { text: '大阵雨', icon: '🌧️' },
  85: { text: '小阵雪', icon: '🌨️' },
  86: { text: '大阵雪', icon: '🌨️' },
  95: { text: '雷阵雨', icon: '⛈️' },
  96: { text: '雷阵雨伴冰雹', icon: '⛈️' },
  99: { text: '雷暴伴大冰雹', icon: '⛈️' },
}

// 风向度数 → 中文
function degreeToDir(deg) {
  const dirs = ['北', '东北', '东', '东南', '南', '西南', '西', '西北']
  const idx = Math.round(deg / 45) % 8
  return dirs[idx] + '风'
}

// WMO code → 天气信息
function wmoToWeather(code) {
  return WMO_CODES[code] || { text: '未知', icon: '🌤️' }
}

// ========== 地理编码 ==========

// 常见城市别名/简称 → 标准名映射
const CITY_ALIASES = {
  '北京': 'Beijing',
  '上海': 'Shanghai',
  '广州': 'Guangzhou',
  '深圳': 'Shenzhen',
  '杭州': 'Hangzhou',
  '成都': 'Chengdu',
  '武汉': 'Wuhan',
  '南京': 'Nanjing',
  '重庆': 'Chongqing',
  '西安': "Xi'an",
  '长沙': 'Changsha',
  '天津': 'Tianjin',
  '苏州': 'Suzhou',
  '郑州': 'Zhengzhou',
  '青岛': 'Qingdao',
  '大连': 'Dalian',
  '厦门': 'Xiamen',
  '昆明': 'Kunming',
  '哈尔滨': 'Harbin',
  '沈阳': 'Shenyang',
  '济南': 'Jinan',
  '福州': 'Fuzhou',
  '合肥': 'Hefei',
  '长春': 'Changchun',
  '南宁': 'Nanning',
  '贵阳': 'Guiyang',
  '太原': 'Taiyuan',
  '南昌': 'Nanchang',
  '兰州': 'Lanzhou',
  '海口': 'Haikou',
  '银川': 'Yinchuan',
  '呼和浩特': 'Hohhot',
  '拉萨': 'Lhasa',
  '乌鲁木齐': 'Urumqi',
  '石家庄': 'Shijiazhuang',
  '香港': 'Hong Kong',
  '澳门': 'Macau',
  '台北': 'Taipei',
}

function geocode(cityName) {
  return new Promise((resolve, reject) => {
    let searchName = cityName.trim()

    // 清理后缀
    searchName = searchName.replace(/[市区县镇]$/, '')

    // 尝试1：直接搜索（中文）
    _geocodeSearch(searchName)
      .then(resolve)
      .catch(() => {
        // 尝试2：用英文名搜索（如果有映射）
        if (CITY_ALIASES[searchName]) {
          _geocodeSearch(CITY_ALIASES[searchName])
            .then(resolve)
            .catch(() => {
              // 尝试3：加"市"后缀
              _geocodeSearch(searchName + '市')
                .then(resolve)
                .catch(() => {
                  // 尝试4：加"市"后缀后用英文搜索
                  if (CITY_ALIASES[searchName + '市']) {
                    _geocodeSearch(CITY_ALIASES[searchName + '市'])
                      .then(resolve)
                      .catch(() => reject(new Error('未找到城市: ' + cityName)))
                  } else {
                    reject(new Error('未找到城市: ' + cityName))
                  }
                })
            })
        } else {
          // 尝试3：加"市"后缀
          _geocodeSearch(searchName + '市')
            .then(resolve)
            .catch(() => reject(new Error('未找到城市: ' + cityName)))
        }
      })
  })
}

function _geocodeSearch(name) {
  return new Promise((resolve, reject) => {
    wx.request({
      url: 'https://geocoding-api.open-meteo.com/v1/search',
      data: {
        name: name,
        count: 5,
        language: 'zh',
        format: 'json',
      },
      success(res) {
        if (res.statusCode === 200 && res.data && res.data.results && res.data.results.length > 0) {
          resolve(_pickBestCity(res.data.results, name))
        } else {
          reject(new Error('未找到: ' + name))
        }
      },
      fail: reject,
    })
  })
}

// 从多个结果中选择最佳匹配
function _pickBestCity(results, searchName) {
  // 优先匹配省会/直辖市 (feature_code: PPLC, PPLA)
  let best = results[0]
  for (let r of results) {
    if (r.feature_code === 'PPLC' || r.feature_code === 'PPLA') {
      best = r
      break
    }
    // 优先选人口最多的
    if ((r.population || 0) > (best.population || 0)) {
      best = r
    }
  }
  return {
    name: best.name,
    latitude: best.latitude,
    longitude: best.longitude,
    admin1: best.admin1 || '',
    admin2: best.admin2 || '',
  }
}

// ========== 获取天气 ==========
function fetchWeather(lat, lon) {
  return new Promise((resolve, reject) => {
    wx.request({
      url: 'https://api.open-meteo.com/v1/forecast',
      data: {
        latitude: lat,
        longitude: lon,
        current: [
          'temperature_2m',
          'relative_humidity_2m',
          'apparent_temperature',
          'is_day',
          'precipitation',
          'rain',
          'weather_code',
          'wind_speed_10m',
          'wind_direction_10m',
          'pressure_msl',
        ].join(','),
        hourly: [
          'temperature_2m',
          'weather_code',
          'precipitation_probability',
        ].join(','),
        daily: [
          'weather_code',
          'temperature_2m_max',
          'temperature_2m_min',
          'sunrise',
          'sunset',
          'uv_index_max',
          'precipitation_probability_max',
          'wind_speed_10m_max',
          'wind_direction_10m_dominant',
        ].join(','),
        timezone: 'Asia/Shanghai',
        forecast_days: 7,
      },
      success(res) {
        if (res.statusCode !== 200 || !res.data) {
          reject(new Error('天气数据获取失败'))
          return
        }
        resolve(_parseWeatherData(res.data))
      },
      fail: reject,
    })
  })
}

// 解析天气数据为页面所需格式
function _parseWeatherData(raw) {
  const current = raw.current || {}
  const hourly = raw.hourly || {}
  const daily = raw.daily || {}

  const wmoInfo = wmoToWeather(current.weather_code)

  // 当前天气
  const currentWeather = {
    temp: Math.round(current.temperature_2m || 0),
    feelsLike: Math.round(current.apparent_temperature || 0),
    humidity: Math.round(current.relative_humidity_2m || 0),
    weatherCode: current.weather_code,
    weather: wmoInfo.text,
    icon: wmoInfo.icon,
    windSpeed: Math.round(current.wind_speed_10m || 0),
    windDir: degreeToDir(current.wind_direction_10m || 0),
    pressure: Math.round(current.pressure_msl || 1013),
    isDay: current.is_day === 1,
    precipitation: current.precipitation || 0,
  }

  // 24小时预报
  const now = new Date()
  const currentHour = now.getHours()
  const todayStr = now.toISOString().slice(0, 10)
  const hourlyData = []

  if (hourly.time && hourly.temperature_2m) {
    for (let i = 0; i < hourly.time.length && hourlyData.length < 24; i++) {
      const timeStr = hourly.time[i]
      const datePart = timeStr.slice(0, 10)
      const hourPart = parseInt(timeStr.slice(11, 13))

      // 只取从当前时间开始的24小时
      if (datePart === todayStr && hourPart < currentHour) continue
      if (hourlyData.length === 0 && datePart === todayStr && hourPart === currentHour) {
        // 第一个显示"现在"
      } else if (hourlyData.length === 0) {
        continue
      }

      const code = hourly.weather_code[i]
      const info = wmoToWeather(code)
      hourlyData.push({
        time: hourlyData.length === 0 ? '现在' : `${String(hourPart).padStart(2, '0')}:00`,
        temp: Math.round(hourly.temperature_2m[i] || 0),
        icon: info.icon,
        weather: info.text,
        precipProb: hourly.precipitation_probability ? hourly.precipitation_probability[i] : 0,
      })
    }
  }

  // 多天预报
  const dailyData = []
  const weekDays = ['周日', '周一', '周二', '周三', '周四', '周五', '周六']
  const today0 = new Date(now.getFullYear(), now.getMonth(), now.getDate())

  if (daily.time && daily.temperature_2m_max) {
    for (let i = 0; i < daily.time.length; i++) {
      const date = new Date(daily.time[i])
      let weekDay
      if (date.getTime() === today0.getTime()) {
        weekDay = '今天'
      } else if (date.getTime() === today0.getTime() + 86400000) {
        weekDay = '明天'
      } else {
        weekDay = weekDays[date.getDay()]
      }

      const code = daily.weather_code[i]
      const info = wmoToWeather(code)

      dailyData.push({
        date: daily.time[i],
        weekDay,
        weather: info.text,
        icon: info.icon,
        high: Math.round(daily.temperature_2m_max[i] || 0),
        low: Math.round(daily.temperature_2m_min[i] || 0),
        sunrise: daily.sunrise ? daily.sunrise[i].slice(11, 16) : '06:00',
        sunset: daily.sunset ? daily.sunset[i].slice(11, 16) : '18:00',
        uvIndex: daily.uv_index_max ? Math.round(daily.uv_index_max[i]) : 0,
        precipProb: daily.precipitation_probability_max ? daily.precipitation_probability_max[i] : 0,
        windSpeed: daily.wind_speed_10m_max ? Math.round(daily.wind_speed_10m_max[i]) : 0,
        windDir: daily.wind_direction_10m_dominant ? degreeToDir(daily.wind_direction_10m_dominant[i]) : '',
      })
    }
  }

  return {
    current: currentWeather,
    hourly: hourlyData,
    daily: dailyData,
    raw,
    // 保存原始请求坐标，供后续补充数据请求使用
    _lat: raw.latitude || null,
    _lon: raw.longitude || null,
  }
}

// ========== 隐私合规检查 ==========
function _checkPrivacy() {
  return new Promise((resolve) => {
    if (wx.getPrivacySetting) {
      wx.getPrivacySetting({
        success(res) {
          resolve(!res.needAuthorization)
        },
        fail() {
          resolve(true)
        },
      })
    } else {
      resolve(true)
    }
  })
}

function _openPrivacyContract() {
  return new Promise((resolve, reject) => {
    if (wx.openPrivacyContract) {
      wx.openPrivacyContract({
        success() {
          resolve()
        },
        fail() {
          reject(new Error('隐私协议打开失败'))
        },
      })
    } else {
      reject(new Error('当前版本不支持隐私协议'))
    }
  })
}

// ========== 定位获取天气 ==========
function fetchWeatherByLocation() {
  return new Promise((resolve, reject) => {
    _checkPrivacy().then(privacyOk => {
      if (privacyOk) {
        _doGetLocation(resolve, reject)
      } else {
        wx.showModal({
          title: '隐私提示',
          content: '需要获取您的位置信息来提供当地天气，请先阅读并同意隐私协议',
          confirmText: '查看协议',
          cancelText: '取消',
          success(res) {
            if (res.confirm) {
              _openPrivacyContract().then(() => {
                // 用户可能同意后重新检查
                _checkPrivacy().then(ok => {
                  if (ok) {
                    _doGetLocation(resolve, reject)
                  } else {
                    _fallbackToDefault(resolve, reject)
                  }
                })
              }).catch(() => {
                _fallbackToDefault(resolve, reject)
              })
            } else {
              _fallbackToDefault(resolve, reject)
            }
          },
        })
      }
    })
  })
}

function _doGetLocation(resolve, reject) {
  wx.getLocation({
    type: 'gcj02',
    success(loc) {
      fetchWeather(loc.latitude, loc.longitude)
        .then(resolve)
        .catch(reject)
    },
    fail(err) {
      _fallbackToDefault(resolve, reject)
    },
  })
}

function _fallbackToDefault(resolve, reject) {
  console.warn('定位失败或用户拒绝，使用默认城市北京')
  fetchWeather(39.9042, 116.4074)
    .then(resolve)
    .catch(reject)
}

// ========== 通过城市名获取天气 ==========
function fetchWeatherByCity(cityName) {
  return geocode(cityName).then(loc => {
    return fetchWeather(loc.latitude, loc.longitude).then(data => {
      data.cityInfo = loc
      return data
    })
  })
}

// ========== WAQI API 获取真实 PM2.5 ==========
// 免费 demo token，每天 1000 次请求
const WAQI_TOKEN = 'demo'

function fetchAQI(lat, lon) {
  return new Promise((resolve, reject) => {
    wx.request({
      url: `https://api.waqi.info/feed/geo:${lat};${lon}/`,
      data: { token: WAQI_TOKEN },
      success(res) {
        if (res.statusCode === 200 && res.data && res.data.status === 'ok') {
          const d = res.data.data
          const iaqi = d.iaqi || {}
          resolve({
            aqi: d.aqi || 0,
            pm25: iaqi.pm25 ? iaqi.pm25.v : null,
            pm10: iaqi.pm10 ? iaqi.pm10.v : null,
            no2: iaqi.no2 ? iaqi.no2.v : null,
            so2: iaqi.so2 ? iaqi.so2.v : null,
            co: iaqi.co ? iaqi.co.v : null,
            o3: iaqi.o3 ? iaqi.o3.v : null,
            station: d.city ? d.city.name : '',
            time: d.time ? d.time.iso : '',
          })
        } else {
          // WAQI 失败时返回 null，由调用方降级
          resolve(null)
        }
      },
      fail() {
        resolve(null)
      },
    })
  })
}

// ========== 和风天气 - 生活指数 ==========
// 免费 API（devapi），无需 key
// 生活指数类型: 1穿衣 3感冒 4运动 5紫外线 6洗车 7旅游 9防晒 10舒适度 11交通 13过敏 14晾晒
const QWEATHER_INDICES = [1, 3, 4, 5, 6, 7, 9, 10, 13]

function fetchLifeIndices(lat, lon) {
  return new Promise((resolve, reject) => {
    wx.request({
      url: 'https://api.qweather.com/v7/indices/now',
      data: {
        location: `${Math.round(lon * 100) / 100},${Math.round(lat * 100) / 100}`,
        type: QWEATHER_INDICES.join(','),
      },
      success(res) {
        if (res.statusCode === 200 && res.data && res.data.code === '200' && res.data.daily) {
          resolve(res.data.daily.map(item => ({
            type: parseInt(item.type) || 0,
            name: item.name || '',
            level: item.level || '',
            category: item.category || '',
            text: item.text || '',
          })))
        } else {
          resolve(null)
        }
      },
      fail() {
        resolve(null)
      },
    })
  })
}

// ========== 智能生活指数生成 ==========
// 当 API 不可用时，根据天气数据生成基础生活指数
function generateLifeIndices(weatherData) {
  if (!weatherData || !weatherData.current) return []
  const cur = weatherData.current
  const today = weatherData.daily && weatherData.daily[0] ? weatherData.daily[0] : {}

  const indices = []

  // 穿衣指数
  const temp = cur.temp
  let dressLevel, dressCategory
  if (temp <= 0) { dressLevel = '7'; dressCategory = '寒冷' }
  else if (temp <= 10) { dressLevel = '6'; dressCategory = '冷' }
  else if (temp <= 18) { dressLevel = '4'; dressCategory = '舒适' }
  else if (temp <= 25) { dressLevel = '3'; dressCategory = '热' }
  else { dressLevel = '2'; dressCategory = '炎热' }
  indices.push({ type: 1, name: '穿衣指数', level: dressLevel, category: dressCategory, text: `当前温度${temp}°C，建议${dressCategory === '炎热' || dressCategory === '热' ? '穿轻薄透气衣物' : dressCategory === '舒适' ? '穿薄外套' : '注意保暖添衣'}` })

  // 运动指数
  const rain = cur.weather.indexOf('雨') !== -1
  const snow = cur.weather.indexOf('雪') !== -1
  const fog = cur.weather.indexOf('雾') !== -1
  const severe = temp > 35 || temp < -5
  let sportLevel, sportCategory, sportText
  if (rain || snow || severe) { sportLevel = '7'; sportCategory = '不宜'; sportText = rain ? '降雨天气，不宜户外运动' : snow ? '降雪天气，路面湿滑' : '极端温度，建议室内运动' }
  else if (fog || cur.windSpeed > 40) { sportLevel = '5'; sportCategory = '较不宜'; sportText = '天气条件一般，建议轻度运动' }
  else { sportLevel = '2'; sportCategory = '适宜'; sportText = '天气条件良好，适合户外运动' }
  indices.push({ type: 4, name: '运动指数', level: sportLevel, category: sportCategory, text: sportText })

  // 紫外线指数
  const uvVal = today.uvIndex || 3
  let uvLevel, uvCategory
  if (uvVal <= 2) { uvLevel = '1'; uvCategory = '弱' }
  else if (uvVal <= 5) { uvLevel = '3'; uvCategory = '中等' }
  else if (uvVal <= 7) { uvLevel = '5'; uvCategory = '强' }
  else { uvLevel = '7'; uvCategory = '很强' }
  indices.push({ type: 5, name: '紫外线指数', level: uvLevel, category: uvCategory, text: `紫外线${uvCategory}，${uvVal > 5 ? '建议涂抹防晒霜' : '外出注意防护'}` })

  // 感冒指数
  let coldLevel, coldCategory
  if (cur.humidity > 80 && (temp < 5 || temp > 30)) { coldLevel = '5'; coldCategory = '较易发' }
  else if (cur.humidity > 70 || temp < 0) { coldLevel = '3'; coldCategory: '较易发' }
  else { coldLevel = '1'; coldCategory = '少发' }
  indices.push({ type: 3, name: '感冒指数', level: coldLevel, category: coldCategory, text: `${coldCategory}感冒，请注意${temp < 10 ? '保暖' : '补水'}` })

  // 洗车指数
  if (rain || snow) {
    indices.push({ type: 6, name: '洗车指数', level: '7', category: '不宜', text: '近期有降水，不宜洗车' })
  } else {
    indices.push({ type: 6, name: '洗车指数', level: '1', category: '适宜', text: '未来无降水，适合洗车' })
  }

  // 旅游指数
  let travelLevel, travelCategory
  if (rain || snow || temp > 38 || temp < -10) { travelLevel = '7'; travelCategory = '不宜' }
  else if (fog || cur.windSpeed > 30) { travelLevel = '4'; travelCategory = '一般' }
  else { travelLevel = '1'; travelCategory = '适宜' }
  indices.push({ type: 7, name: '旅游指数', level: travelLevel, category: travelCategory, text: weatherData.current.weather + '，出游' + travelCategory })

  return indices
}

module.exports = {
  geocode,
  fetchWeather,
  fetchWeatherByLocation,
  fetchWeatherByCity,
  fetchAQI,
  fetchLifeIndices,
  generateLifeIndices,
  wmoToWeather,
  WMO_CODES,
  degreeToDir,
}
