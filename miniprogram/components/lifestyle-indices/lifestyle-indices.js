const { parseIndex } = require('../../utils/weather')

Component({
  properties: {
    indexData: {
      type: Array,
      value: [],
    },
  },
  data: {
    expandedIndex: null,
  },
  observers: {
    'indexData'(data) {
      if (!data || data.length === 0) return
      const parsed = parseIndex(data)
      this.setData({ indexDataInternal: parsed })
    },
  },
  methods: {
    toggleDetail(e) {
      const idx = e.currentTarget.dataset.index
      this.setData({
        expandedIndex: this.data.expandedIndex === idx ? null : idx,
      })
    },
  },
})
