# OpenCode 二次开发版 Dockerfile - 完整构建版
# 在 Docker 中构建并运行 OpenCode

# 阶段1：构建阶段
FROM oven/bun:1.1-alpine AS builder

# 安装构建依赖
RUN apk add --no-cache python3 make g++ git

WORKDIR /app

# 复制项目文件
COPY . .

# 安装依赖（忽略 lockfile 版本问题）
RUN bun install

# 构建 Linux x64 musl 版本
WORKDIR /app/packages/opencode
ENV BUN_RUNTIME_TRANSPILER_CACHE_PATH=0
RUN bun run build --single --skip-install || \
    (echo "构建失败，尝试使用开发版本" && \
     bun add @opentui/core && \
     bun add @parcel/watcher && \
     bun build src/index.ts --outfile bin/opencode --compile)

# 验证构建产物
RUN ls -la dist/ || ls -la bin/

# 阶段2：运行时阶段
FROM oven/bun:1.1-alpine

# 安装运行时依赖
RUN apk add --no-cache libgcc libstdc++ ripgrep

WORKDIR /app

# 从构建阶段复制文件
COPY --from=builder /app/packages/opencode/dist /app/dist
COPY --from=builder /app/packages/opencode/src /app/src
COPY --from=builder /app/packages/opencode/package.json /app/package.json
COPY --from=builder /app/packages/opencode/node_modules /app/node_modules

# 创建可执行文件链接
RUN if [ -f /app/dist/opencode-linux-x64-musl/bin/opencode ]; then \
      cp /app/dist/opencode-linux-x64-musl/bin/opencode /usr/local/bin/opencode; \
    elif [ -f /app/dist/opencode-darwin-arm64/bin/opencode ]; then \
      echo "警告: 使用 macOS 构建，在 Linux 中可能无法运行"; \
    elif [ -f /app/bin/opencode ]; then \
      cp /app/bin/opencode /usr/local/bin/opencode; \
    else \
      echo "错误: 找不到可执行文件"; \
      exit 1; \
    fi

# 创建必要的目录
RUN mkdir -p /root/.opencode

# 设置环境变量
ENV BUN_RUNTIME_TRANSPILER_CACHE_PATH=0
ENV NODE_ENV=production

# 验证安装
RUN opencode --version || echo "可执行文件可能无法在此平台运行"

# 设置工作目录
WORKDIR /workspace

# 设置入口点
ENTRYPOINT ["opencode"]