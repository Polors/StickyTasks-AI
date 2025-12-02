# VPS 前端问题修复指南

## 问题现象
- localhost:8091 可以添加便签 ✅
- VPS (YOUR_VPS_IP:8090) 点击添加便签没反应 ❌
- 在 localhost 添加的便签能同步到 VPS ✅

## 问题原因
VPS 上的浏览器缓存了旧版本的 JavaScript 代码。

## 解决方案

### 方案 1：清除浏览器缓存（最简单）

1. 在 VPS 页面 (http://YOUR_VPS_IP:8090) 按 `Ctrl + Shift + R` (Windows) 或 `Cmd + Shift + R` (Mac) **强制刷新**
2. 或者按 F12 打开开发者工具，右键点击刷新按钮，选择"清空缓存并硬性重新加载"

### 方案 2：使用无痕模式测试

1. 打开浏览器的无痕/隐私模式
2. 访问 http://YOUR_VPS_IP:8090
3. 登录并测试添加便签

### 方案 3：在 VPS 上重新构建（确保最新代码）

```bash
ssh root@YOUR_VPS_IP
cd /opt/stickytasks/DeskTopNote

# 完全清理
docker compose down
docker system prune -f

# 重新构建
docker compose build --no-cache
docker compose up -d

# 查看日志
docker compose logs -f
```

### 方案 4：检查浏览器控制台

在 VPS 页面按 F12，查看：
1. **Console 标签** - 是否有 JavaScript 错误？
2. **Network 标签** - 点击添加便签时，是否发送了 API 请求？
3. **Application 标签 > Local Storage** - 检查 token 是否存在

## 调试步骤

### 1. 检查 JavaScript 是否加载最新版本

在浏览器控制台执行：
```javascript
console.log('Testing...');
```

如果能看到输出，说明控制台正常。

### 2. 手动测试 API

在浏览器控制台执行：
```javascript
// 获取 token
const token = localStorage.getItem('stickytasks-token');
console.log('Token:', token);

// 测试创建便签
fetch('/api/notes', {
  method: 'PUT',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${token}`
  },
  body: JSON.stringify([{
    id: 'manual-test-' + Date.now(),
    title: '手动测试',
    color: '#fef3c7',
    items: [],
    rotation: 0,
    zIndex: 1,
    createdAt: Date.now()
  }])
}).then(r => r.json()).then(console.log);
```

如果这个能成功，说明 API 正常，问题在前端 React 代码。

### 3. 查看构建版本

检查 VPS 上的构建文件：
```bash
ssh root@YOUR_VPS_IP
docker exec -it desktopnote-app-1 ls -lh /app/public/
```

应该能看到 `index.html` 和 `assets/` 目录。

## 最可能的解决方案

**99% 的情况下，强制刷新浏览器（Ctrl + Shift + R）就能解决问题！**

如果还不行，请告诉我浏览器控制台显示了什么错误。
