# 部署指南 (Deployment Guide)

本指南将指导您如何将 StickyTasks AI 部署到您的 VPS (IP: YOUR_VPS_IP)。

## 1. 准备工作

确保您的 VPS 已经安装了 Docker 和 Docker Compose。

## 2. 上传文件

您需要将项目文件上传到 VPS。建议创建一个目录，例如 `/opt/stickytasks`。

您可以使用 SCP 命令上传（请在本地终端执行）：

```bash
# 假设您在项目根目录下
scp -r . root@YOUR_VPS_IP:/opt/stickytasks
```

或者，如果您只想上传必要的文件进行构建（推荐，减少上传体积）：

```bash
# 在 VPS 上创建目录
ssh root@YOUR_VPS_IP "mkdir -p /opt/stickytasks"

# 上传必要文件
scp Dockerfile docker-compose.yml package.json vite.config.ts tsconfig.json index.html root@YOUR_VPS_IP:/opt/stickytasks/
scp -r src public server root@YOUR_VPS_IP:/opt/stickytasks/
scp .env.example root@YOUR_VPS_IP:/opt/stickytasks/.env
```

## 3. 配置环境变量 (重要！)

**为了安全起见，您必须在 VPS 上设置强密码。**

登录到 VPS：

```bash
ssh root@YOUR_VPS_IP
cd /opt/stickytasks
```

编辑 `.env` 文件：

```bash
nano .env
```

修改以下内容：

```env
PORT=80
JWT_SECRET=这里填写一个很长的随机字符串
ADMIN_EMAIL=admin@yourdomain.com
ADMIN_PASSWORD=这里填写您的强密码
DB_PATH=/data/database.sqlite
```

按 `Ctrl+O` 保存，`Ctrl+X` 退出。

## 4. 启动服务

在 `/opt/stickytasks` 目录下运行：

```bash
docker-compose up -d --build
```

Docker 将会自动构建镜像并启动服务。

## 5. 验证

在浏览器中访问：`http://YOUR_VPS_IP`

您应该能看到登录页面。使用您在 `.env` 文件中设置的 `ADMIN_EMAIL` 和 `ADMIN_PASSWORD` 进行登录。

## 6. 更新与重启

当您修改了代码或配置文件后，需要重新构建并重启服务。

1.  **上传更新的文件**：
    使用 SCP 将修改后的文件上传到 VPS，覆盖原有文件。

2.  **重建并重启**：
    在 VPS 的项目目录下运行：
    ```bash
    docker-compose up -d --build
    ```
    这个命令会重新构建镜像（如果 Dockerfile 或构建上下文有变化）并重启容器。

## 7. 常见问题

### 错误：`sh: 1: vite: Permission denied`
这是因为您本地的 `node_modules` 文件夹被上传到了 VPS，并且在构建时覆盖了容器内的 `node_modules`。
**解决方法**：
1.  确保项目根目录下有 `.dockerignore` 文件，且其中包含了 `node_modules`。
2.  或者，在 VPS 上构建之前，删除上传上去的 `node_modules` 目录：
    ```bash
    rm -rf /opt/stickytasks/node_modules
    ```

### 错误：`sh: 1: vite: not found`
这通常是因为 Docker 缓存了旧的构建层，或者 `npm install` 没有正确安装开发依赖。
**解决方法**：
1.  确保 `Dockerfile` 中设置了 `ENV NODE_ENV=development`（我们已经更新了代码）。
2.  使用 `--no-cache` 参数强制重新构建：
    ```bash
    docker-compose build --no-cache
    docker-compose up -d
    ```

## 8. 数据备份

所有数据都存储在 `data` 目录下的 `database.sqlite` 文件中。请定期备份该文件。
