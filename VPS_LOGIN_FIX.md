# VPS 登录问题排查指南

## 问题：修改密码后仍然无法登录

### 步骤 1：确认 .env 文件位置和内容

在 VPS 上执行：

```bash
cd /opt/stickytasks/DeskTopNote

# 检查 .env 文件是否在正确位置
ls -la .env

# 查看 .env 文件内容
cat .env
```

**正确的 .env 文件应该包含：**
```env
PORT=8090
JWT_SECRET=你的超长随机密钥
ADMIN_EMAIL=admin@admin.com
ADMIN_PASSWORD=你设置的密码
DB_PATH=/data/database.sqlite
```

⚠️ **注意：** `.env` 文件必须在 `/opt/stickytasks/DeskTopNote/` 目录下，**不是** `server/.env`！

### 步骤 2：完全清理并重新部署

```bash
cd /opt/stickytasks/DeskTopNote

# 1. 停止并删除容器
docker-compose down

# 2. 删除数据库文件
rm -f data/database.sqlite

# 3. 删除旧的 Docker 镜像（强制重新构建）
docker-compose down --rmi all

# 4. 重新构建（不使用缓存）
docker-compose build --no-cache

# 5. 启动容器
docker-compose up -d

# 6. 查看日志，确认管理员账户已创建
docker-compose logs -f
```

### 步骤 3：检查日志中的关键信息

日志中应该看到：
```
Seeding admin user...
Admin user seeded.
Server running on http://localhost:8090
```

如果看到 "Seeding admin user"，说明管理员账户已经用新密码创建。

### 步骤 4：测试登录

```bash
# 在 VPS 上测试 API（替换成您的实际密码）
curl -X POST http://localhost:8090/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@admin.com","password":"你的密码"}'
```

如果返回包含 `token` 的 JSON，说明登录成功。

### 常见错误排查

#### 错误 1：Invalid credentials
**原因：** 密码不匹配
**解决：** 
- 确认 `.env` 文件中的密码
- 确认数据库已删除并重新创建
- 检查密码中是否有特殊字符（如引号、空格）

#### 错误 2：服务器返回空响应
**原因：** 后端没有正常启动
**解决：**
```bash
docker-compose logs
```
查看错误信息

#### 错误 3：Cannot connect
**原因：** 端口未开放或容器未运行
**解决：**
```bash
# 检查容器状态
docker ps

# 检查端口
netstat -tlnp | grep 8090
```

### 快速修复脚本

将以下内容保存为 `fix-login.sh` 并执行：

```bash
#!/bin/bash
cd /opt/stickytasks/DeskTopNote

echo "停止容器..."
docker-compose down

echo "删除数据库..."
rm -f data/database.sqlite

echo "重新构建..."
docker-compose build --no-cache

echo "启动容器..."
docker-compose up -d

echo "等待 5 秒..."
sleep 5

echo "查看日志..."
docker-compose logs --tail 50
```

执行：
```bash
chmod +x fix-login.sh
./fix-login.sh
```
