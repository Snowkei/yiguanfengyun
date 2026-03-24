Component({
  properties: {
    weatherDetail: {
      type: Object,
      value: {},
    },
  },
  data: {
    feelsLike: '',
    humidity: '',
    windDir: '',
    visibility: '',
    uvIndex: '',
    sunrise: '',
    sunset: '',
    pressure: '',
    rainChance: '',
  },
  observers: {
    'weatherDetail'(detail) {
      if (!detail) return
      // 根据天气情况估算各项指标
      const hour = new Date().getHours()
      const isDay = hour >= 6 && hour < 18
      this.setData({
        humidity: detail.humidity || (detail.weather && detail.weather.indexOf('雨') !== -1 ? '85' : '60'),
        windDir: detail.wind || '微风',
        visibility: detail.visibility || '10',
        uvIndex: detail.uvIndex || (isDay ? '中等' : '无'),
        sunrise: detail.sunrise || '06:12',
        sunset: detail.sunset || '18:35',
        pressure: detail.pressure || '1013',
        rainChance: detail.rainChance || (detail.weather && detail.weather.indexOf('雨') !== -1 ? '70' : '10'),
        feelsLike: detail.feelsLike || detail.temperature || '--',
      })
    },
  },
  methods: {},
})
