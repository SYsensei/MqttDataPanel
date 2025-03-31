# MQTT数据面板

基于Vue.js 3和MQTT.js的物联网设备数据实时监控面板。

## 功能特点

- 使用Vue 3的Composition API进行开发
- 连接EMQX MQTT Broker以获取实时数据
- 支持WebSocket和安全WebSocket(WSS)连接
- 自动重连和错误处理
- 数据过滤和搜索功能
- 使用Element Plus UI组件库

## 配置项

- **Broker地址**：MQTT服务器地址，如`localhost:8083/mqtt`
- **协议**：支持`ws://`和`wss://`
- **用户名/密码**：MQTT服务器验证信息
- **订阅主题**：支持通配符，如`sensor/#`

## 快速开始

### 安装依赖

```bash
npm install
```

### 开发模式运行

```bash
npm run dev
```

### 构建生产版本

```bash
npm run build
```

## MQTT消息格式

组件期望接收的MQTT消息格式为JSON，例如：

```json
{
  "temperature": 25.6,
  "humidity": 65.2,
  "deviceId": "sensor001",
  "timestamp": 1634567890123
}
```

## 使用EMQX进行测试

1. 安装EMQX Broker: [https://www.emqx.io/downloads](https://www.emqx.io/downloads)
2. 启用WebSocket监听端口(默认8083)
3. 使用MQTT客户端工具(如MQTT X)发送测试数据

## 注意事项

- 默认支持WebSocket连接，避免跨域问题
- 断线自动重连间隔为5秒
- 表格默认显示最新1000条数据 