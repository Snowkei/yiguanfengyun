/**
 * 天气 API 模块
 * 使用 Open-Meteo（完全免费，无需 API Key）
 * https://open-meteo.com/
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
function geocode(cityName) {
  return new Promise((resolve, reject) => {
    // 清理城市名：去掉"市"、"区"等后缀，也支持带后缀
    let searchName = cityName.trim()
    wx.request({
      url: 'https://geocoding-api.open-meteo.com/v1/search',
      data: {
        name: searchName,
        count: 5,
        language: 'zh',
        format: 'json',
      },
      success(res) {
        if (res.statusCode !== 200 || !res.data || !res.data.results || res.data.results.length === 0) {
          // 尝试加"市"后缀再搜
          if (!searchName.endsWith('市') && !searchName.endsWith('区') && !searchName.endsWith('县')) {
            wx.request({
              url: 'https://geocoding-api.open-meteo.com/v1/search',
              data: {
                name: searchName + '市',
                count: 5,
                language: 'zh',
              },
              success(res2) {
                if (res2.statusCode === 200 && res2.data && res2.data.results && res2.data.results.length > 0) {
                  resolve(_pickBestCity(res2.data.results, searchName))
                } else {
                  reject(new Error('未找到城市: ' + cityName))
                }
              },
              fail: reject,
            })
          } else {
            reject(new Error('未找到城市: ' + cityName))
          }
          return
        }
        resolve(_pickBestCity(res.data.results, searchName))
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
  }
}

// ========== 定位获取天气 ==========
function fetchWeatherByLocation() {
  return new Promise((resolve, reject) => {
    wx.getLocation({
      type: 'gcj02',
      success(loc) {
        fetchWeather(loc.latitude, loc.longitude)
          .then(resolve)
          .catch(reject)
      },
      fail(err) {
        // 定位失败，默认北京
        console.warn('定位失败，使用默认城市北京', err)
        fetchWeather(39.9042, 116.4074)
          .then(resolve)
          .catch(reject)
      },
    })
  })
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

module.exports = {
  geocode,
  fetchWeather,
  fetchWeatherByLocation,
  fetchWeatherByCity,
  wmoToWeather,
  WMO_CODES,
  degreeToDir,
}
