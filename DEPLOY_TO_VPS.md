# VPS 部署文件清单

## 需要上传的文件

### 1. 核心代码文件
```bash
# 前端源码
App.tsx
index.tsx
index.html
package.json
tsconfig.json
vite.config.ts

# 前端目录
components/
services/
types.ts

# 后端源码
server/src/
server/package.json

# 部署配置
Dockerfile
docker-compose.yml
.dockerignore
```

### 2. 环境配置（重要！）
在 VPS 上创建 `.env` 文件（不要上传本地的 .env）：
```bash
PORT=8090
JWT_SECRET=你的超长随机密钥
ADMIN_EMAIL=admin@admin.com
ADMIN_PASSWORD=你的强密码
DB_PATH=/data/database.sqlite
```

## 快速上传命令

### 方法一：上传整个项目（推荐）
```bash
# 在本地项目根目录执行
scp -r . root@192.3.180.201:/opt/stickytasks/DeskTopNote
```

### 方法二：只上传必要文件（节省时间）
```bash
# 上传前端文件
scp App.tsx index.tsx index.html package.json tsconfig.json vite.config.ts root@192.3.180.201:/opt/stickytasks/DeskTopNote/
scp -r components services root@192.3.180.201:/opt/stickytasks/DeskTopNote/
scp types.ts root@192.3.180.201:/opt/stickytasks/DeskTopNote/

# 上传后端文件
scp -r server/src server/package.json root@192.3.180.201:/opt/stickytasks/DeskTopNote/server/

# 上传部署文件
scp Dockerfile docker-compose.yml .dockerignore root@192.3.180.201:/opt/stickytasks/DeskTopNote/
```

## VPS 上的操作步骤

1. **SSH 登录到 VPS**
   ```bash
   ssh root@192.3.180.201
   cd /opt/stickytasks/DeskTopNote
   ```

2. **创建 .env 文件**
   ```bash
   nano .env
   # 粘贴环境变量配置，保存退出
   ```

3. **删除旧的 node_modules（重要！）**
   ```bash
   rm -rf node_modules server/node_modules
   ```

4. **构建并启动**
   ```bash
   docker-compose build --no-cache
   docker-compose up -d
   ```

5. **查看日志（确认启动成功）**
   ```bash
   docker-compose logs -f
   ```

6. **访问应用**
   打开浏览器访问：`http://192.3.180.201:8090`

## 注意事项

- ❌ **不要上传** `node_modules`、`dist`、`.git`、`database.sqlite`
- ✅ **务必创建** VPS 上的 `.env` 文件并设置强密码
- ✅ **确保端口** 8090 在 VPS 防火墙中开放
