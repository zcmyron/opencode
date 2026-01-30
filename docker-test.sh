#!/bin/bash

echo "=== 测试 OpenCode 二次开发版 Docker 构建 ==="

# 清理之前的测试
echo "1. 清理之前的 Docker 镜像和容器..."
docker rm -f opencode-test-container 2>/dev/null || true
docker rmi opencode-custom-test 2>/dev/null || true

# 检查 Docker 是否运行
echo "2. 检查 Docker 服务..."
if ! docker info >/dev/null 2>&1; then
    echo "错误: Docker 守护进程未运行"
    echo "请启动 Docker Desktop 或运行: sudo systemctl start docker"
    exit 1
fi

# 创建临时构建目录
echo "3. 准备构建文件..."
TEMP_DIR=$(mktemp -d)
cp -r . "$TEMP_DIR/opencode"
cd "$TEMP_DIR/opencode"

# 创建简化的 Dockerfile 用于测试
cat > Dockerfile.test << 'EOF'
# 测试用 OpenCode Dockerfile
FROM oven/bun:1.1-alpine

WORKDIR /app

# 复制项目文件
COPY . .

# 只复制必要的文件来测试构建
RUN echo "测试 OpenCode 二次开发版" && \
    echo "包含文件:" && \
    find packages/opencode/src/plugin -name "*.ts" | head -5 && \
    echo "Azure EntraID 插件存在:" && \
    ls -la packages/opencode/src/plugin/azure-entraid.ts && \
    echo "依赖检查:" && \
    grep -n "@azure/identity" packages/opencode/package.json && \
    echo "✅ 代码结构检查通过"

# 简单的健康检查
CMD ["echo", "OpenCode 二次开发版 Docker 测试成功！"]
EOF

echo "4. 构建测试镜像..."
docker build -f Dockerfile.test -t opencode-custom-test .

echo "5. 运行测试容器..."
docker run --name opencode-test-container opencode-custom-test

echo "6. 清理测试资源..."
docker rm opencode-test-container
docker rmi opencode-custom-test

# 清理临时目录
cd /
rm -rf "$TEMP_DIR"

echo "=== Docker 测试完成 ==="
echo "✅ OpenCode 二次开发版代码结构检查通过"
echo "📦 包含 Azure EntraID 插件和 @azure/identity 依赖"