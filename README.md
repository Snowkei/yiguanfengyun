# 易观风云 v2.0

> 好看又好用的微信天气小程序

## ✨ 功能特性

- 🌡️ **实时天气** — 自动定位，实时获取当前天气
- 🕐 **24小时预报** — 逐时温度变化，一目了然
- 📅 **多天预报** — 7天天气趋势，温度范围可视化
- 🌬️ **空气质量** — AQI 指数 + 污染物详情
- 💡 **生活指数** — 穿衣、运动、紫外线等智能建议
- 🎨 **动态背景** — 根据天气自动切换渐变主题
- 🏙️ **城市切换** — 全国城市快速搜索
- 📱 **系统工具** — 屏幕亮度、NFC 检测等实用工具

## 🛠️ 技术架构

```
miniprogram/
├── app.js / app.json / app.wxss    # 应用入口 & 全局样式
├── components/                      # 组件化模块
│   ├── hourly-forecast/             # 24小时预报组件
│   ├── weather-forecast/            # 多天预报组件
│   ├── aqi-card/                    # 空气质量卡片
│   ├── lifestyle-indices/           # 生活指数组件
│   ├── sunrise-sunset/              # 天气详情组件
│   └── skeleton/                    # 骨架屏组件
├── pages/
│   ├── index/                       # 首页（天气主界面）
│   ├── citychoose/                  # 城市选择
│   ├── setting/                     # 设置
│   ├── about/                       # 关于
│   └── systeminfo/                  # 系统信息
├── utils/
│   ├── weather.js                   # 天气工具函数
│   └── helpers.js                   # 缓存、请求、存储封装
├── data/
│   ├── staticData.js                # 城市数据
│   └── messages.js                  # 问候语
└── lib/
    └── bmap-wx.js                   # 百度地图 SDK
```

## 🎨 设计亮点

- **毛玻璃效果** — `backdrop-filter` 实现磨砂玻璃卡片
- **渐变背景** — 根据天气类型自动匹配渐变色
- **骨架屏** — 数据加载前的优雅占位
- **流畅动画** — fadeInUp、scaleIn 等微交互
- **安全区适配** — 全面屏手机底部安全区

## 📦 数据来源

- 地理编码：[百度地图开放平台](https://lbsyun.baidu.com/)
- 天气数据：百度地图天气 API

## 🚀 快速开始

1. 克隆本项目
2. 使用微信开发者工具打开项目目录
3. 在 `project.config.json` 中填入你的 AppID
4. 在 `app.js` 中配置百度地图 AK
5. 编译运行

## 📄 License

MIT
