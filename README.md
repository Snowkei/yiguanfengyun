# 易观风云 v3.0 商用版

> 好看又好用的微信天气小程序

## ✨ 功能特性

- 🌡️ **实时天气** — 自动定位，实时获取当前天气
- 🕐 **24小时预报** — 逐时温度变化，一目了然
- 📅 **多天预报** — 7天天气趋势，温度范围可视化
- 🌬️ **空气质量** — AQI 指数 + 污染物详情
- 💡 **生活指数** — 穿衣、运动、紫外线等智能建议
- 🎨 **动态背景** — 根据天气自动切换渐变主题
- 🌧️ **天气动画** — 雨、雪、雾、雷暴等天气特效
- 🌅 **日出日落** — 弧线可视化，显示白天时长
- 🏙️ **多城市** — 支持添加多个城市，长按删除
- 📔 **天气日记** — 记录每日心情与天气感受
- ⚙️ **完善设置** — 温度单位切换、自动刷新间隔、缓存管理
- 🛡️ **商用级稳定** — 全局错误处理、网络监听、隐私协议

## 🛠️ 技术架构

```
miniprogram/
├── app.js / app.json / app.wxss    # 应用入口 & 全局样式
├── components/                      # 组件化模块
│   ├── hourly-forecast/             # 24小时预报组件
│   ├── weather-forecast/            # 多天预报组件
│   └── skeleton/                    # 骨架屏组件
├── pages/
│   ├── index/                       # 首页（天气主界面）
│   ├── diary/                       # 天气日记
│   ├── citychoose/                  # 城市选择
│   ├── setting/                     # 设置
│   ├── about/                       # 关于
│   └── systeminfo/                  # 系统信息
├── utils/
│   ├── api.js                       # 天气 API 封装
│   ├── weather.js                   # 天气工具函数
│   └── helpers.js                   # 缓存、存储封装
└── data/
    └── staticData.js                # 城市数据
```

## 📦 数据来源

- 地理编码：[Open-Meteo Geocoding](https://geocoding-api.open-meteo.com/)
- 天气数据：[Open-Meteo Forecast](https://open-meteo.com/)
- 空气质量：[WAQI](https://aqicn.org/)（免费 demo token）
- 生活指数：[和风天气](https://devapi.qweather.com/)（免费版，降级为本地智能生成）

## 🚀 快速开始

1. 克隆本项目
2. 使用微信开发者工具打开项目目录
3. 在 `project.config.json` 中填入你的 AppID
4. 编译运行

## 📄 License

MIT
