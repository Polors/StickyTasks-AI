# Stage 1: Build frontend (前端保持不变，继续用 pnpm)
FROM node:20-slim AS frontend-builder
WORKDIR /app
RUN npm install -g pnpm
COPY package*.json ./
RUN pnpm install --shamefully-hoist
COPY . .
RUN pnpm run build

# Stage 2: Backend (后端改用 npm 纯净构建)
# 使用完整版 Node 镜像，确保有 Python/Make/G++
FROM node:20
WORKDIR /app

# ⚠️ 关键修改 1：只复制 package.json，不要复制 lock 文件
# 这强制 Docker 在 Linux 环境下重新计算依赖版本，避免 Windows/Mac 的锁文件干扰
COPY server/package.json ./

# ⚠️ 关键修改 2：使用 npm install 替代 pnpm
# --omit=dev 表示只安装生产依赖
# 这会生成扁平的 node_modules 结构，彻底解决路径找不到的问题
RUN npm install --omit=dev

# ⚠️ 关键修改 3：再次强制重编译 better-sqlite3
# 在 npm 结构下，这一步成功率几乎是 100%
RUN npm rebuild better-sqlite3

# 复制源码
COPY server/src/ ./src/
# 复制前端构建好的文件
COPY --from=frontend-builder /app/dist ./public

RUN mkdir -p /data
ENV PORT=8090
ENV DB_PATH=/data/database.sqlite
EXPOSE 8090

CMD ["node", "src/index.js"]
