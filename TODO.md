# 易观风云 v2.1 - 开发进度

## ✅ 已完成

### API 层
- ✅ 替换百度地图 API → Open-Meteo（完全免费，无需 Key）
- ✅ `utils/api.js` — 地理编码 + 天气数据获取 + WMO 代码转中文
- ✅ `utils/weather.js` — 天气工具函数（图标、背景渐变、PM2.5、日期格式化等）
- ✅ `utils/helpers.js` — 缓存管理、错误处理、Storage 安全封装

### UI 组件
- ✅ `skeleton` — 骨架屏加载占位
- ✅ `hourly-forecast` — 24小时逐时预报
- ✅ `weather-forecast` — 多天天气预报（温度条可视化）
- ✅ `aqi-card` — 空气质量卡片
- ✅ `lifestyle-indices` — 生活指数组件
- ✅ `sunrise-sunset` — 天气详情组件

### 页面
- ✅ `pages/index` — 主页（全部重构，使用 Open-Meteo API）
- ✅ `pages/citychoose` — 城市选择（热门城市 + 搜索筛选）
- ✅ `pages/setting` — 设置页（NFC检测、屏幕亮度、数据管理）
- ✅ `pages/about` — 关于页（功能展示、开源信息）
- ✅ `pages/systeminfo` — 系统信息

### 设计系统
- ✅ 毛玻璃卡片 (`glass-card`)
- ✅ 动态天气渐变背景
- ✅ fadeInUp 缩放动画
- ✅ 自定义导航栏
- ✅ 全面屏安全区适配
- ✅ `navigationStyle: custom` 全局配置

### v2.1 新增
- ✅ WAQI API 真实 PM2.5 / AQI 数据（免费 demo token，异步加载不阻塞主流程）
- ✅ 污染物详情展示（PM2.5、PM10、NO₂、SO₂、CO、O₃）
- ✅ 生活指数（穿衣、运动、紫外线、感冒、洗车、旅游）
  - 优先使用和风天气 API
  - 降级为本地智能生成（基于天气数据）
- ✅ 城市搜索优化
  - 新增 30+ 中国城市别名映射（中→英）
  - 多级降级搜索：中文→英文→加"市"后缀→英文+后缀
  - 清理城市名后缀（市/区/县/镇）

## ⚠️ 待完善

### 1. WAQI API 限制
- 免费 demo token 每天 1000 次请求
- 建议：注册免费账号获取专属 token，额度提升到每天 10000 次
- 注册地址：https://aqicn.org/data-platform/token/

### 2. 和风天气 API 限制
- 免费版每日调用次数有限
- 当前已实现降级方案：API 不可用时自动切换为本地智能生成

### 3. 背景图片资源
- 当前背景图片仍引用 `/images/` 下的旧图，如需要可替换为无版权图片

## 🔧 技术架构

```
数据流: 用户定位/搜索 → api.js (Open-Meteo) → 页面渲染
                      ↓ 异步补充
                    WAQI API (PM2.5/AQI) + 和风天气 (生活指数)

Open-Meteo APIs:
├── geocoding-api.open-meteo.com  → 城市名 → 经纬度
└── api.open-meteo.com/v1/forecast → 经纬度 → 天气数据
    ├── current: 实时天气（温度、湿度、风速、气压等）
    ├── hourly: 逐小时预报（72h）
    └── daily: 每日预报（7天，含日出日落、UV指数、降水概率）

补充 API:
├── api.waqi.info → 真实 PM2.5 / AQI
└── api.qweather.com → 生活指数
```
