const staticData = require('../../data/staticData.js')
const { isEmptyObject } = require('../../utils/weather')

Page({
  data: {
    cities: {},
    showItems: {},
    inputText: '',
    hotCities: [
      { name: '北京' }, { name: '上海' }, { name: '广州' }, { name: '深圳' },
      { name: '杭州' }, { name: '成都' }, { name: '武汉' }, { name: '南京' },
      { name: '重庆' }, { name: '西安' }, { name: '长沙' }, { name: '天津' },
    ],
  },

  onLoad() {
    const cities = this._getSorted(staticData.cities || [])
    this.setData({ cities, showItems: cities })
  },

  inputFilter(e) {
    const val = (e.detail.value || '').replace(/\s+/g, '')
    if (!val) {
      this.setData({ showItems: this.data.cities })
      return
    }
    const cities = this.data.cities
    const filtered = {}
    for (const letter in cities) {
      const matched = cities[letter].filter(c => c.name.indexOf(val) !== -1)
      if (matched.length > 0) filtered[letter] = matched
    }
    this.setData({ showItems: isEmptyObject(filtered) ? {} : filtered })
  },

  cancel() {
    this.setData({ inputText: '', showItems: this.data.cities })
  },

  choose(e) {
    const name = (e.currentTarget.dataset.item.name || '').replace(/市$/, '').replace(/区$/, '')
    const pages = getCurrentPages()
    const prev = pages[pages.length - 2]
    if (prev) {
      prev.setData({ _cityChanged: true, _selectedCity: name })
    }
    wx.navigateBack()
  },

  _getSorted(areas) {
    areas.sort((a, b) => a.letter.localeCompare(b.letter))
    const obj = {}
    areas.forEach(item => {
      if (!obj[item.letter]) obj[item.letter] = []
      obj[item.letter].push(item)
    })
    return obj
  },
})
