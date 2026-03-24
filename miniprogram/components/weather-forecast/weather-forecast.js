const { getWeatherIcon, getWeekDay, parseTemperature, parseWind } = require('../../utils/weather')

Component({
  properties: {
    weatherData: {
      type: Array,
      value: [],
    },
  },
  data: {
    forecastData: [],
    days: 7,
  },
  observers: {
    'weatherData'(data) {
      if (!data || data.length === 0) return
      this.setData({ days: data.length })

      // 计算全局温度范围
      let allTemps = []
      data.forEach(item => {
        const t = parseTemperature(item.temperature)
        allTemps.push(t.min, t.max)
      })
      const globalMin = Math.min(...allTemps)
      const globalMax = Math.max(...allTemps)
      const range = globalMax - globalMin || 1

      const forecastData = data.map((item, index) => {
        const temp = parseTemperature(item.temperature)
        const wind = parseWind(item.wind)
        return {
          weekDay: index === 0 ? '今天' : getWeekDay(this._getDate(index)),
          icon: getWeatherIcon(item.weather),
          weather: item.weather,
          low: temp.min,
          high: temp.max,
          wind: wind.direction,
          tempLeft: ((temp.min - globalMin) / range) * 60 + 5,
          tempWidth: ((temp.max - temp.min) / range) * 60 + 10,
          tempColor: this._getTempColor(temp.min, temp.max),
        }
      })
      this.setData({ forecastData })
    },
  },
  methods: {
    _getDate(daysFromNow) {
      const d = new Date()
      d.setDate(d.getDate() + daysFromNow)
      return d
    },
    _getTempColor(low, high) {
      if (high <= 0) return '#667eea, #42a5f5'
      if (high <= 10) return '#42a5f5, #26c6da'
      if (high <= 20) return '#26c6da, #66bb6a'
      if (high <= 30) return '#66bb6a, #ffa726'
      return '#ffa726, #ef5350'
    },
  },
})
