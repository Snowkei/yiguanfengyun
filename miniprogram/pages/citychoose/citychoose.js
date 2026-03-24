let staticData = require('../../data/staticData.js')
let { isEmptyObject } = require('../../utils/weather')

Page({
  data: {
    cities: [],
    showItems: null,
    inputText: '',
    hotCities: [
      { name: '北京' },
      { name: '上海' },
      { name: '广州' },
      { name: '深圳' },
      { name: '杭州' },
      { name: '成都' },
      { name: '武汉' },
      { name: '南京' },
    ],
  },

  onLoad() {
    let cities = this._getSortedAreaObj(staticData.cities || [])
    this.setData({
      cities,
      showItems: cities,
    })
  },

  inputFilter(e) {
    let value = (e.detail.value || '').replace(/\s+/g, '')
    if (!value) {
      this.setData({ showItems: this.data.cities })
      return
    }
    let cities = this.data.cities
    let filtered = {}
    for (let letter in cities) {
      let items = cities[letter]
      let matched = items.filter(item => item.name.indexOf(value) !== -1)
      if (matched.length > 0) {
        filtered[letter] = matched
      }
    }
    this.setData({
      showItems: isEmptyObject(filtered) ? null : filtered,
    })
  },

  cancel() {
    this.setData({
      inputText: '',
      showItems: this.data.cities,
    })
  },

  choose(e) {
    let item = e.currentTarget.dataset.item
    let name = item.name.replace(/市$/, '')
    let pages = getCurrentPages()
    let prevPage = pages[pages.length - 2]

    // 设置上一页的标记
    if (prevPage) {
      prevPage.setData({
        _cityChanged: true,
        _selectedCity: name,
      })
    }
    wx.navigateBack()
  },

  _getSortedAreaObj(areas) {
    areas.sort((a, b) => a.letter.localeCompare(b.letter))
    let obj = {}
    for (let i = 0; i < areas.length; i++) {
      let item = areas[i]
      let letter = item.letter
      if (!obj[letter]) {
        obj[letter] = []
      }
      obj[letter].push(item)
    }
    return obj
  },
})
