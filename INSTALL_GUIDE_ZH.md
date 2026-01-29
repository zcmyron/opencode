# OpenCode 二次开发版安装和使用指南

## 概述

这是 OpenCode 的二次开发版本，添加了 Azure EntraID 认证支持，允许通过 Azure AI Foundry 使用 Azure EntraID（原 Azure Active Directory）进行无密钥认证。

## 主要特性

✅ **新增功能**：
- Azure EntraID 认证支持（使用 `DefaultAzureCredential`）
- 支持 Azure OpenAI 和 Azure Cognitive Services 两个提供商
- 无密钥认证（无需手动管理 API keys）
- 自动令牌获取和刷新

✅ **兼容性**：
- 完全兼容原有 API key 认证方式
- 遵循 OpenCode 原有插件架构
- 支持所有现有功能

## 快速开始

### 1. 克隆仓库

```bash
# 克隆你的二次开发版本
git clone https://github.com/zcmyron/opencode.git
cd opencode
```

### 2. 安装 Bun（如果未安装）

```bash
# macOS/Linux
curl -fsSL https://bun.sh/install | bash

# Windows (通过 WSL 或 PowerShell)
powershell -c "irm bun.sh/install.ps1 | iex"

# 验证安装
bun --version
```

### 3. 安装依赖

```bash
# 在项目根目录安装依赖
bun install
```

### 4. 构建项目

```bash
# 进入 opencode 包目录
cd packages/opencode

# 构建项目
bun run build

# 构建成功后，会生成可执行文件
ls -la bin/
```

## 安装方式

### 方式一：直接使用（推荐）

```bash
# 在 packages/opencode 目录直接运行
./bin/opencode

# 或者创建别名
alias myopencode="/path/to/opencode/packages/opencode/bin/opencode"
```

### 方式二：链接到全局

```bash
# 在 packages/opencode 目录
bun link --global

# 或者使用 npm
npm link

# 验证安装
opencode --version
```

### 方式三：Docker 方式

```bash
# 构建 Docker 镜像
docker build -t my-opencode .

# 运行
docker run -it --rm -v $(pwd):/workspace my-opencode
```

## Azure EntraID 认证配置

### 前提条件

1. **Azure 账户**：有权限访问 Azure AI Foundry 或 Azure OpenAI
2. **Azure CLI**（可选）：用于本地开发认证
3. **部署的模型**：在 Azure AI Foundry 中已部署的模型

### 配置步骤

#### 步骤 1：Azure 认证

```bash
# 使用 Azure CLI 登录（最简单的方式）
az login

# 如果有多租户，选择正确的租户
az account set --subscription "你的订阅名称"

# 验证登录状态
az account show
```

#### 步骤 2：设置环境变量

```bash
# Azure OpenAI 资源名称（如果使用 Azure OpenAI）
export AZURE_RESOURCE_NAME="your-resource-name"

# Azure Cognitive Services 资源名称（如果使用 Cognitive Services）
export AZURE_COGNITIVE_SERVICES_RESOURCE_NAME="your-cognitive-services-resource"

# 可选：服务主体认证（用于自动化场景）
export AZURE_TENANT_ID="your-tenant-id"
export AZURE_CLIENT_ID="your-client-id"
export AZURE_CLIENT_SECRET="your-client-secret"
```

#### 步骤 3：启动 OpenCode

```bash
# 方式 A：直接运行
./packages/opencode/bin/opencode

# 方式 B：如果已链接到全局
opencode
```

#### 步骤 4：连接 Azure

在 OpenCode 交互界面中：

```txt
# 运行连接命令
/connect

# 选择提供商：
# 1. "Azure" - Azure OpenAI
# 2. "Azure Cognitive Services" - Azure Cognitive Services

# 选择认证方式：
# "Azure EntraID (DefaultAzureCredential)"

# 系统会自动测试凭证获取
# 成功后会自动保存配置
```

#### 步骤 5：选择模型

```txt
# 运行模型选择命令
/models

# 选择你部署的 Azure AI Foundry 模型
# 模型名称应该与 Azure 中的部署名称匹配
```

## 使用示例

### 示例 1：基本使用

```bash
# 1. 启动 OpenCode
./packages/opencode/bin/opencode

# 2. 在 OpenCode 中连接 Azure
/connect
# -> 选择 "Azure"
# -> 选择 "Azure EntraID (DefaultAzureCredential)"

# 3. 设置环境变量
# （在另一个终端）
export AZURE_RESOURCE_NAME="my-azure-openai"

# 4. 选择模型
/models
# -> 选择你的模型（如 "gpt-4o"）

# 5. 开始使用！
# 现在可以正常使用 OpenCode 的所有功能
```

### 示例 2：使用 Azure Cognitive Services

```bash
# 设置 Cognitive Services 资源
export AZURE_COGNITIVE_SERVICES_RESOURCE_NAME="my-cognitive-services"

# 启动 OpenCode
./packages/opencode/bin/opencode

# 连接时选择 "Azure Cognitive Services"
/connect
```

### 示例 3：自动化脚本

```bash
#!/bin/bash
# test-azure.sh

echo "=== 测试 Azure EntraID 认证 ==="

# 设置环境
export AZURE_RESOURCE_NAME="test-resource"

# 启动 OpenCode 并自动连接
echo "/connect
azure
1
/models" | ./packages/opencode/bin/opencode --non-interactive

echo "=== 测试完成 ==="
```

## 故障排除

### 常见问题

#### 1. Bun 安装失败

```bash
# 如果 bun 命令不可用
export PATH="$HOME/.bun/bin:$PATH"

# 或者使用 npx
npx bun run build
```

#### 2. 依赖安装失败

```bash
# 清理并重新安装
rm -rf node_modules
rm -f bun.lockb
bun install
```

#### 3. Azure 认证失败

```bash
# 检查 Azure CLI 登录状态
az account show

# 重新登录
az login --use-device-code

# 检查权限
az role assignment list --assignee $(az account show --query user.name -o tsv)
```

#### 4. 构建错误

```bash
# 检查 TypeScript 错误
cd packages/opencode
bun run typecheck

# 或者直接编译
npx tsc --noEmit
```

#### 5. 令牌获取失败

```bash
# 测试令牌获取
node -e "
const { DefaultAzureCredential } = require('@azure/identity');
const credential = new DefaultAzureCredential();
credential.getToken('https://cognitiveservices.azure.com/.default')
  .then(token => console.log('成功获取令牌'))
  .catch(err => console.error('失败:', err.message));
"
```

### 调试模式

```bash
# 启用详细日志
export LOG_LEVEL=debug
./packages/opencode/bin/opencode

# 或者直接查看日志
./packages/opencode/bin/opencode 2>&1 | grep -i azure
```

## 开发指南

### 修改代码后重新构建

```bash
# 在 packages/opencode 目录
bun run build

# 开发模式（监视文件变化）
bun run dev

# 运行测试
bun test

# 运行特定测试
bun test --test-name-pattern="azure"
```

### 项目结构

```
opencode/
├── packages/opencode/
│   ├── src/plugin/azure-entraid.ts     # Azure EntraID 插件
│   ├── src/plugin/index.ts            # 插件注册
│   ├── src/provider/provider.ts       # 提供商配置
│   └── package.json                   # 依赖配置
├── AZURE_ENTRAID_SETUP.md            # Azure 设置指南
├── INSTALL_GUIDE_ZH.md               # 本安装指南
└── CLAUDE.md                         # 项目说明
```

### 主要文件说明

1. **`azure-entraid.ts`** - 核心插件实现
   - 令牌获取和缓存
   - 自定义 fetch 函数添加 bearer token
   - 支持两个 Azure 提供商

2. **`provider.ts`** - 提供商加载器更新
   - 检测 EntraID 认证配置
   - 自动加载启用 EntraID 的提供商

3. **`package.json`** - 添加了 `@azure/identity` 依赖

## 高级配置

### 使用服务主体

```bash
# 创建服务主体
az ad sp create-for-rbac --name "opencode-service-principal"

# 设置环境变量
export AZURE_TENANT_ID="tenant-id"
export AZURE_CLIENT_ID="client-id"
export AZURE_CLIENT_SECRET="client-secret"
export AZURE_RESOURCE_NAME="resource-name"
```

### 使用托管身份（Azure 资源）

当在 Azure 资源（如 VM、App Service）中运行时，自动使用托管身份。

### 自定义认证范围

如果需要不同的认证范围，可以修改 `azure-entraid.ts` 中的 `SCOPE` 常量：

```typescript
const SCOPE = "https://cognitiveservices.azure.com/.default";
// 改为其他范围，如：
// const SCOPE = "https://management.azure.com/.default";
```

## 性能优化

### 令牌缓存

令牌默认缓存 1 小时，提前 5 分钟刷新。可以调整缓存时间：

```typescript
// 在 azure-entraid.ts 中修改
const bufferMs = 5 * 60 * 1000; // 5 分钟缓冲
// 改为其他值，如 10 * 60 * 1000 (10分钟)
```

### 并发请求

插件支持并发请求，令牌获取是线程安全的。

## 安全注意事项

1. **令牌安全**：令牌仅缓存在内存中，不持久化到磁盘
2. **凭证链**：`DefaultAzureCredential` 使用 Azure 安全最佳实践
3. **最小权限**：使用最小所需范围
4. **网络加密**：所有通信使用 HTTPS

## 更新和维护

### 从上游更新

```bash
# 添加上游仓库
git remote add upstream https://github.com/anomalyco/opencode.git

# 获取更新
git fetch upstream

# 合并更新
git merge upstream/dev

# 解决冲突（如果有）
# 重新构建
bun run build
```

### 发布新版本

```bash
# 更新版本号
cd packages/opencode
npm version patch  # 或 minor, major

# 提交并推送
git add package.json
git commit -m "chore: bump version to x.x.x"
git push origin dev

# 创建标签
git tag vx.x.x
git push origin vx.x.x
```

## 获取帮助

### 问题反馈

如果遇到问题：

1. 检查 `AZURE_ENTRAID_SETUP.md` 中的故障排除部分
2. 启用调试日志：`export LOG_LEVEL=debug`
3. 检查 Azure 凭证状态：`az account show`
4. 查看 OpenCode 日志

### 社区支持

- OpenCode 官方文档：https://opencode.ai/docs
- Azure 文档：https://learn.microsoft.com/azure/ai-foundry
- GitHub Issues：https://github.com/zcmyron/opencode/issues

## 许可证

本项目基于 MIT 许可证。详见 `LICENSE` 文件。

---

**恭喜！** 你现在可以使用支持 Azure EntraID 认证的 OpenCode 二次开发版本了。享受无密钥访问 Azure AI Foundry 的便利吧！ 🚀