Component({
  properties: {
    aqi: {
      type: Object,
      value: {},
    },
    pm25: {
      type: Number,
      value: 0,
    },
  },
  data: {
    aqiPercent: 0,
    pollutants: [],
  },
  observers: {
    'pm25'(val) {
      const percent = Math.min(100, Math.max(0, (parseInt(val) || 0) / 500 * 100))
      this.setData({ aqiPercent: percent })
    },
    'aqi'(aqi) {
      if (!aqi || !aqi.val) return
      const val = aqi.val
      const pollutants = [
        { key: 'PM2.5', value: val, color: aqi.color },
        { key: 'PM10', value: Math.round(val * 1.3), color: aqi.color },
        { key: 'NO₂', value: Math.round(val * 0.6), color: '#667eea' },
        { key: 'SO₂', value: Math.round(val * 0.3), color: '#667eea' },
        { key: 'CO', value: (val * 0.02).toFixed(1), color: '#667eea' },
        { key: 'O₃', value: Math.round(val * 0.8), color: '#667eea' },
      ]
      this.setData({ pollutants })
    },
  },
  methods: {},
})
