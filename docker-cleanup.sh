#!/bin/bash

echo "=== 清理 Docker 测试资源 ==="

# 停止所有运行的 opencode 容器
echo "1. 停止运行中的容器..."
docker ps -a --filter "ancestor=opencode*" --format "{{.ID}}" | xargs -r docker stop 2>/dev/null || true

# 删除所有 opencode 容器
echo "2. 删除容器..."
docker ps -a --filter "ancestor=opencode*" --format "{{.ID}}" | xargs -r docker rm 2>/dev/null || true

# 删除所有 opencode 测试镜像
echo "3. 删除测试镜像..."
docker images | grep opencode | awk '{print $3}' | xargs -r docker rmi -f 2>/dev/null || true

# 清理悬空镜像和层
echo "4. 清理悬空资源..."
docker image prune -f >/dev/null 2>&1

# 检查剩余资源
echo ""
echo "5. 检查剩余资源..."
REMAINING_IMAGES=$(docker images | grep -i opencode | wc -l)
REMAINING_CONTAINERS=$(docker ps -a | grep -i opencode | wc -l)

if [ "$REMAINING_IMAGES" -eq 0 ] && [ "$REMAINING_CONTAINERS" -eq 0 ]; then
    echo "✅ 所有测试资源已清理"
else
    echo "⚠️  还有剩余资源:"
    [ "$REMAINING_IMAGES" -gt 0 ] && echo "  镜像: $REMAINING_IMAGES 个"
    [ "$REMAINING_CONTAINERS" -gt 0 ] && echo "  容器: $REMAINING_CONTAINERS 个"
    echo ""
    echo "剩余资源:"
    docker images | grep -i opencode || true
    docker ps -a | grep -i opencode || true
fi

echo ""
echo "=== 清理完成 ==="
echo "✅ 系统环境已保持纯净"