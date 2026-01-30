# OpenCode Azure EntraID 版快速入门

## 这是什么？

这是 OpenCode 的二次开发版本，添加了 **Azure EntraID 认证**支持。这意味着你可以：
- ✅ 使用 Azure CLI 登录即可，无需管理 API keys
- ✅ 直接使用 Azure AI Foundry 中部署的模型
- ✅ 支持所有 OpenCode 原有功能

## 前置条件

1. **Azure 账户**：需要有访问 Azure AI Foundry 或 Azure OpenAI 的权限
2. **已部署的模型**：在 Azure AI Foundry 中部署的模型（如 gpt-4o）
3. **Bun 运行时**：用于运行 OpenCode

## 三步快速开始

### 步骤 1：安装 OpenCode

```bash
# 克隆仓库
git clone https://github.com/zcmyron/opencode.git
cd opencode

# 安装依赖
bun install

# 构建项目
cd packages/opencode && bun run build
```

如果还没有安装 Bun：
```bash
# macOS/Linux
curl -fsSL https://bun.sh/install | bash

# 验证安装
bun --version
```

### 步骤 2：Azure 认证

```bash
# 使用 Azure CLI 登录
az login

# 如果有多个订阅，选择正确的订阅
az account set --subscription "你的订阅名称"

# 验证登录状态
az account show
```

### 步骤 3：启动 OpenCode

```bash
# 设置 Azure 资源名称（替换成你的资源名称）
export AZURE_RESOURCE_NAME="your-resource-name"

# 启动 OpenCode
./packages/opencode/bin/opencode
```

### 步骤 4：连接 Azure（在 OpenCode 中）

```
/connect
→ 选择 "Azure" 或 "Azure Cognitive Services"
→ 选择 "Azure EntraID (DefaultAzureCredential)"
→ 认证成功！

/models
→ 选择你部署的模型（如 gpt-4o）
→ 开始使用！
```

## Docker 方式（推荐）

不想安装 Bun？使用 Docker 一键运行：

```bash
# 1. 克隆仓库
git clone https://github.com/zcmyron/opencode.git
cd opencode

# 2. 构建 Docker 镜像
docker build -f Dockerfile.final -t opencode-azure:latest .

# 3. Azure CLI 登录
az login

# 4. 运行 OpenCode
docker run -v ~/.azure:/root/.azure:ro \
  -v $(pwd):/workspace \
  -e AZURE_RESOURCE_NAME="your-resource-name" \
  -it opencode-azure:latest
```

## 详细文档

- 📖 [完整安装指南](INSTALL_GUIDE_ZH.md) - 详细的安装步骤
- 🔧 [Azure 配置指南](AZURE_ENTRAID_SETUP.md) - Azure 认证详细说明
- 🐳 [Docker 使用指南](DOCKER_GUIDE.md) - Docker 完整教程
- 📝 [自定义版本说明](README_CUSTOM.md) - 自定版本功能介绍

## 常见问题

### Q: Bun 在哪里？
```bash
export PATH="$HOME/.bun/bin:$PATH"
```

### Q: Azure 登录失败？
```bash
az login --use-device-code
az account show
```

### Q: 找不到模型？
检查环境变量：
```bash
echo $AZURE_RESOURCE_NAME
echo $AZURE_COGNITIVE_SERVICES_RESOURCE_NAME
```

### Q: 想看详细日志？
```bash
export LOG_LEVEL=debug
./packages/opencode/bin/opencode
```

## 认证方式说明

`DefaultAzureCredential` 会自动尝试以下方式（按顺序）：

1. **环境变量**：`AZURE_TENANT_ID`, `AZURE_CLIENT_ID`, `AZURE_CLIENT_SECRET`
2. **托管身份**：在 Azure 资源中自动使用
3. **Visual Studio Code**：Azure 账户扩展
4. **Azure CLI**：`az login` （最常用）
5. **Azure Developer CLI**：`azd login`
6. **交互式浏览器**：备用方式

## 环境变量参考

```bash
# Azure OpenAI（二选一）
export AZURE_RESOURCE_NAME="your-resource-name"

# Azure Cognitive Services（二选一）
export AZURE_COGNITIVE_SERVICES_RESOURCE_NAME="your-resource-name"

# 可选：服务主体认证
export AZURE_TENANT_ID="xxx"
export AZURE_CLIENT_ID="xxx"
export AZURE_CLIENT_SECRET="xxx"
```

## 项目结构

```
opencode/
├── packages/opencode/
│   ├── src/plugin/azure-entraid.ts     # Azure EntraID 插件
│   └── bin/opencode                    # 可执行文件
├── Dockerfile.final                    # Docker 镜像定义
├── QUICKSTART.md                       # 本文件
├── INSTALL_GUIDE_ZH.md                 # 完整安装指南
├── AZURE_ENTRAID_SETUP.md              # Azure 配置指南
└── DOCKER_GUIDE.md                     # Docker 使用指南
```

## 获取帮助

- 📚 [OpenCode 官方文档](https://opencode.ai/docs)
- 📘 [Azure AI Foundry 文档](https://learn.microsoft.com/azure/ai-foundry)
- 🐛 [报告问题](https://github.com/zcmyron/opencode/issues)

## 开始使用

现在你可以使用 Azure EntraID 无密钥访问 Azure AI Foundry 模型了！🎉

```bash
# 快速启动
az login
export AZURE_RESOURCE_NAME="your-resource"
./packages/opencode/bin/opencode
```

---

**GitHub**: https://github.com/zcmyron/opencode
**分支**: `dev`
**版本**: 二次开发版（添加 Azure EntraID 支持）
