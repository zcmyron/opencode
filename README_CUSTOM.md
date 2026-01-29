# OpenCode with Azure EntraID Support

这是一个 OpenCode 的二次开发版本，添加了 Azure EntraID（原 Azure Active Directory）认证支持，允许通过 Azure AI Foundry 使用无密钥认证。

## 🚀 主要特性

### 新增功能
- ✅ **Azure EntraID 认证**：使用 `DefaultAzureCredential` 进行无密钥认证
- ✅ **双提供商支持**：同时支持 Azure OpenAI 和 Azure Cognitive Services
- ✅ **自动令牌管理**：令牌自动获取、缓存和刷新
- ✅ **向后兼容**：原有 API key 认证方式继续可用

### 认证方式
- **Azure CLI**：`az login` 后自动使用
- **环境变量**：服务主体认证
- **托管身份**：在 Azure 资源中自动使用
- **Visual Studio Code**：Azure 账户扩展
- **交互式浏览器**：备用认证方式

## 📦 快速安装

### 1. 克隆仓库
```bash
git clone https://github.com/zcmyron/opencode.git
cd opencode
```

### 2. 安装 Bun
```bash
# macOS/Linux
curl -fsSL https://bun.sh/install | bash

# Windows (PowerShell)
powershell -c "irm bun.sh/install.ps1 | iex"
```

### 3. 安装依赖
```bash
bun install
```

### 4. 构建项目
```bash
cd packages/opencode
bun run build
```

## 🎯 快速使用

### 步骤 1：Azure 认证
```bash
# 使用 Azure CLI 登录
az login

# 验证登录状态
az account show
```

### 步骤 2：设置资源名称
```bash
# Azure OpenAI
export AZURE_RESOURCE_NAME="your-resource-name"

# 或 Azure Cognitive Services
export AZURE_COGNITIVE_SERVICES_RESOURCE_NAME="your-cognitive-services-resource"
```

### 步骤 3：启动 OpenCode
```bash
# 直接运行
./packages/opencode/bin/opencode

# 或链接到全局
bun link --global
opencode
```

### 步骤 4：连接 Azure
在 OpenCode 中：
```txt
/connect
→ 选择 "Azure" 或 "Azure Cognitive Services"
→ 选择 "Azure EntraID (DefaultAzureCredential)"
```

### 步骤 5：选择模型
```txt
/models
→ 选择你部署的 Azure AI Foundry 模型
```

## 🔧 配置选项

### 环境变量
```bash
# 必须：资源名称
export AZURE_RESOURCE_NAME="xxx"
# 或
export AZURE_COGNITIVE_SERVICES_RESOURCE_NAME="xxx"

# 可选：服务主体认证
export AZURE_TENANT_ID="xxx"
export AZURE_CLIENT_ID="xxx"
export AZURE_CLIENT_SECRET="xxx"
```

### Azure CLI 认证源
`DefaultAzureCredential` 按顺序尝试：
1. 环境变量
2. 托管身份（Azure 资源）
3. Visual Studio Code
4. Azure CLI (`az login`)
5. Azure Developer CLI
6. 交互式浏览器

## 🐛 故障排除

### 常见问题
```bash
# 1. Bun 未找到
export PATH="$HOME/.bun/bin:$PATH"

# 2. 依赖安装失败
rm -rf node_modules bun.lockb && bun install

# 3. Azure 认证失败
az login --use-device-code
az account show

# 4. 构建错误
cd packages/opencode && bun run typecheck
```

### 调试模式
```bash
export LOG_LEVEL=debug
./packages/opencode/bin/opencode
```

## 📁 项目结构

```
opencode/
├── packages/opencode/
│   ├── src/plugin/azure-entraid.ts     # Azure EntraID 插件
│   ├── src/plugin/index.ts            # 插件注册
│   ├── src/provider/provider.ts       # 提供商配置
│   └── package.json                   # 添加 @azure/identity
├── AZURE_ENTRAID_SETUP.md            # Azure 详细设置指南
├── INSTALL_GUIDE_ZH.md               # 中文安装指南
└── README_CUSTOM.md                  # 本文件
```

## 🔄 开发工作流

### 修改后重新构建
```bash
cd packages/opencode
bun run build        # 生产构建
bun run dev          # 开发模式（监视变化）
bun test             # 运行测试
```

### 从上游更新
```bash
git remote add upstream https://github.com/anomalyco/opencode.git
git fetch upstream
git merge upstream/dev
bun run build
```

## 🛡️ 安全特性

- 🔒 令牌仅内存缓存，不持久化
- 🔐 使用最小权限范围
- 🌐 所有通信 HTTPS 加密
- 🔄 令牌提前 5 分钟刷新

## 📚 详细文档

- [AZURE_ENTRAID_SETUP.md](AZURE_ENTRAID_SETUP.md) - Azure 详细设置指南
- [INSTALL_GUIDE_ZH.md](INSTALL_GUIDE_ZH.md) - 完整中文安装指南
- [OpenCode 官方文档](https://opencode.ai/docs) - 基础功能使用

## 🤝 贡献

欢迎提交 Issue 和 Pull Request！

## 📄 许可证

MIT License - 详见 [LICENSE](LICENSE) 文件。

---

**开始使用**：现在你可以通过 Azure EntraID 无密钥访问 Azure AI Foundry 模型了！ 🎉

**GitHub**: https://github.com/zcmyron/opencode
**分支**: `dev`
**版本**: 二次开发版（添加 Azure EntraID 支持）