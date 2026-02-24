# ----------- 构建前端 -------------
FROM node:20-alpine AS client-build
WORKDIR /app/client
COPY client/package.json client/package-lock.json ./
RUN npm ci
COPY client/ ./
ENV APP_ENV=production
RUN npm run build

# ----------- 构建后端 -------------
FROM node:20-alpine AS server-build
WORKDIR /app/server
COPY server/package.json server/package-lock.json ./
RUN npm ci --omit=dev
COPY server/ ./

# ----------- 生产镜像 -------------
FROM node:20-alpine AS prod
WORKDIR /app

# 拷贝后端代码和依赖
COPY --from=server-build /app/server ./server

# 拷贝前端构建产物到后端（假设 server 静态目录为 public）
COPY --from=client-build /app/client/dist ./server/public

# 设置环境变量
ENV NODE_ENV=production

# 声明服务端口
EXPOSE 3001

# 启动服务
CMD ["node", "server/src/index.js"]
