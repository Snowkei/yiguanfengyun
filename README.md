# 云开发 quickstart

这是云开发的快速启动指引，其中演示了如何上手使用云开发的三大基础能力：

- 数据库：一个既可在小程序前端操作，也能在云函数中读写的 JSON 文档型数据库
- 文件存储：在小程序前端直接上传/下载云端文件，在云开发控制台可视化管理
- 云函数：在云端运行的代码，微信私有协议天然鉴权，开发者只需编写业务逻辑代码

## 数据来源
  地理编码、天气数据均来自[百度地图开放平台](https://lbsyun.baidu.com/)。个人开发完全免费，有对应的小程序 `sdk`，加入即可，但是返回的天气数据较少。

## 运行前
 > * [注册微信小程序](https://mp.weixin.qq.com/wxopen/waregister?action=step1)，获取 `appid`，配置域名白名单(在小程序后台将使用到的 `API` 添加到域名白名单)；
> * 注册[百度地图开放平台](https://lbsyun.baidu.com/)开发者，创建应用 **（注意：应用类型选择微信小程序时，请填写真实的小程序 appid）** ，获取 `ak`（其他配置可自行查看）；
> * 在 `app.js` 中替换 `globalData` 中的 `ak` 为自己的 `ak`；
> * Run and Enjoy!

## 参考文档

- [云开发文档](https://developers.weixin.qq.com/miniprogram/dev/wxcloud/basis/getting-started.html)

