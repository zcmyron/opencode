# OpenCode 二次开发版 Docker 使用指南

## 概述

本指南说明如何使用 Docker 构建和运行支持 Azure EntraID 认证的 OpenCode 二次开发版。

## 快速开始

### 1. 构建 Docker 镜像

```bash
git clone https://github.com/zcmyron/opencode.git
cd opencode
docker build -f Dockerfile.final -t opencode-custom:latest .
```

### 2. 运行 OpenCode

```bash
# 显示帮助信息
docker run --rm opencode-custom:latest

# 在当前目录运行 OpenCode
docker run -v $(pwd):/workspace -it opencode-custom:latest

# 运行单个命令
docker run -v $(pwd):/workspace opencode-custom:latest run "你的消息"
```

## 使用 Azure EntraID 认证

### 步骤 1：本地 Azure 认证

```bash
# 使用 Azure CLI 登录
az login

# 验证登录
az account show
```

### 步骤 2：运行 Docker 容器

```bash
# 设置环境变量
export AZURE_RESOURCE_NAME="your-resource-name"

# 运行 OpenCode（挂载 Azure 凭证）
docker run -v ~/.azure:/root/.azure:ro \
  -v $(pwd):/workspace \
  -e AZURE_RESOURCE_NAME \
  -it opencode-custom:latest
```

### 步骤 3：在 OpenCode 中连接 Azure

```
/connect
→ 选择 "Azure" 或 "Azure Cognitive Services"
→ 选择 "Azure EntraID (DefaultAzureCredential)"
```

## 高级用法

### 交互式终端

```bash
docker run -v $(pwd):/workspace -it opencode-custom:latest
```

### 非交互模式

```bash
docker run -v $(pwd):/workspace opencode-custom:latest run "帮我重构这个函数"
```

### 持续会话

```bash
docker run -v $(pwd):/workspace opencode-custom:latest continue
```

### 指定模型

```bash
docker run -v $(pwd):/workspace opencode-custom:latest --model azure/gpt-4o
```

## 环境变量

可以在 `docker run` 时传递环境变量：

```bash
docker run -v $(pwd):/workspace \
  -e AZURE_RESOURCE_NAME="xxx" \
  -e AZURE_COGNITIVE_SERVICES_RESOURCE_NAME="xxx" \
  -e AZURE_TENANT_ID="xxx" \
  -e AZURE_CLIENT_ID="xxx" \
  opencode-custom:latest
```

## 持久化数据

OpenCode 的配置和数据可以挂载到本地：

```bash
# 挂载配置目录
docker run -v ~/.opencode:/root/.opencode \
  -v $(pwd):/workspace \
  opencode-custom:latest

# 挂载会话数据
docker run -v ~/.opencode/sessions:/root/.opencode/sessions \
  -v $(pwd):/workspace \
  opencode-custom:latest
```

## 清理

```bash
# 停止所有 OpenCode 容器
docker ps -a --filter "ancestor=opencode*" -q | xargs -r docker stop

# 删除容器
docker ps -a --filter "ancestor=opencode*" -q | xargs -r docker rm

# 删除镜像
docker rmi opencode-custom:latest

# 运行清理脚本
./docker-cleanup.sh
```

## 故障排除

### 1. Azure 凭证问题

```bash
# 确保已登录
az account show

# 重新登录
az login --use-device-code

# 检查凭证挂载
docker run -v ~/.azure:/root/.azure:ro opencode-custom:latest sh -c "ls -la /root/.azure"
```

### 2. 权限问题

```bash
# 添加 --user 参数
docker run --user $(id -u):$(id -g) -v $(pwd):/workspace opencode-custom:latest
```

### 3. 网络问题

```bash
# 使用 host 网络
docker run --network host -v $(pwd):/workspace opencode-custom:latest
```

## 构建细节

Dockerfile 使用以下策略：

1. **基于 `oven/bun:1.1-alpine`** - 轻量级 Bun 运行时
2. **复制整个项目** - 包含源代码和 node_modules
3. **验证关键文件** - 确保 Azure EntraID 插件已安装
4. **设置工作目录** - `/workspace` 作为默认工作目录

## 镜像大小

由于包含完整的项目和依赖，镜像大小约为 **4.7GB**。这是正常的，因为包含了：
- 完整的 OpenCode 源代码
- 所有 npm 依赖包
- Bun 运行时
- 系统依赖库

## 性能优化

1. **使用缓存层**：Docker 会缓存依赖安装，后续构建更快
2. **并行构建**：Docker 多阶段构建优化了镜像大小
3. **资源限制**：可以限制容器资源使用

```bash
# 限制内存和 CPU
docker run -m 2g --cpus="2" -v $(pwd):/workspace opencode-custom:latest
```

## 安全注意事项

1. **凭证安全**：使用 `:ro` 只读挂载凭证目录
2. **网络隔离**：考虑使用 Docker 网络隔离
3. **用户权限**：默认以 root 运行，生产环境建议使用非 root 用户

## 示例脚本

### 快速启动脚本

```bash
#!/bin/bash
# quick-start.sh

# 检查 Azure 登录
if ! az account show >/dev/null 2>&1; then
    echo "请先登录 Azure: az login"
    exit 1
fi

# 运行 OpenCode
docker run -v ~/.azure:/root/.azure:ro \
  -v $(pwd):/workspace \
  -e AZURE_RESOURCE_NAME="$AZURE_RESOURCE_NAME" \
  -it opencode-custom:latest
```

### 批处理脚本

```bash
#!/bin/bash
# batch-process.sh

PROJECT_DIR="/path/to/project"

docker run -v "$PROJECT_DIR:/workspace" \
  -v ~/.azure:/root/.azure:ro \
  opencode-custom:latest run "重构 src/app.ts，使用更好的错误处理"
```

## 支持

如有问题，请参考：
- [INSTALL_GUIDE_ZH.md](INSTALL_GUIDE_ZH.md) - 完整安装指南
- [AZURE_ENTRAID_SETUP.md](AZURE_ENTRAID_SETUP.md) - Azure 设置指南
- [README_CUSTOM.md](README_CUSTOM.md) - 快速开始

---

**注意**：使用完毕后请运行 `./docker-cleanup.sh` 清理测试资源，保持系统环境纯净。
