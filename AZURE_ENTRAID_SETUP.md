# Azure EntraID Authentication Setup for OpenCode

## Overview

This implementation adds Azure EntraID (formerly Azure Active Directory) authentication support to OpenCode, allowing you to connect to Azure AI Foundry models using `DefaultAzureCredential` for key-less authentication.

## What's Implemented

1. **New Plugin**: `azure-entraid.ts` - Handles Azure EntraID authentication for both Azure providers
2. **Dependency**: Added `@azure/identity` package for credential management
3. **Provider Updates**: Modified `azure` and `azure-cognitive-services` providers to auto-load when EntraID auth is configured
4. **Plugin Registration**: Registered two plugins for both Azure providers

## How It Works

### Authentication Flow

1. User runs `/connect` and selects "Azure" or "Azure Cognitive Services"
2. Chooses "Azure EntraID (DefaultAzureCredential)" authentication method
3. System tests credential acquisition using `DefaultAzureCredential`
4. If successful, stores a dummy OAuth entry in `auth.json`
5. When making API calls, the plugin:
   - Acquires fresh tokens using `DefaultAzureCredential`
   - Adds bearer token to `Authorization` header
   - Uses dummy API key (required by `@ai-sdk/azure`)
   - Caches tokens to avoid unnecessary acquisition

### DefaultAzureCredential

The `DefaultAzureCredential` automatically tries multiple credential sources in order:

1. **Environment Variables** - `AZURE_TENANT_ID`, `AZURE_CLIENT_ID`, `AZURE_CLIENT_SECRET`
2. **Managed Identity** - When running in Azure (App Service, VMs, etc.)
3. **Visual Studio Code** - Azure account extension
4. **Azure CLI** - `az login`
5. **Azure Developer CLI** - `azd login`
6. **Interactive Browser** - Falls back to browser login if enabled

## Setup Instructions

### Prerequisites

1. **Azure Account**: Access to Azure AI Foundry or Azure OpenAI
2. **Azure CLI** (optional): `az login` for local development
3. **Required Permissions**: Access to Azure Cognitive Services

### Option 1: Using Azure CLI (Local Development)

```bash
# Login to Azure
az login

# Set your subscription (if multiple)
az account set --subscription "Your-Subscription-Name"
```

### Option 2: Using Environment Variables

```bash
# For service principal authentication
export AZURE_TENANT_ID="your-tenant-id"
export AZURE_CLIENT_ID="your-client-id"
export AZURE_CLIENT_SECRET="your-client-secret"

# For Azure OpenAI
export AZURE_RESOURCE_NAME="your-resource-name"

# For Azure Cognitive Services
export AZURE_COGNITIVE_SERVICES_RESOURCE_NAME="your-cognitive-services-resource"
```

### Option 3: Managed Identity (Azure Resources)

When running in Azure (App Service, VM, etc.), managed identity is automatically used.

## Usage

### Step 1: Connect to Azure

```bash
# Run OpenCode
opencode

# In OpenCode, run:
/connect

# Select "Azure" or "Azure Cognitive Services"
# Choose "Azure EntraID (DefaultAzureCredential)" authentication method
```

### Step 2: Configure Environment Variables (if needed)

```bash
# Set resource name for Azure OpenAI
export AZURE_RESOURCE_NAME="your-resource-name"

# Or for Azure Cognitive Services
export AZURE_COGNITIVE_SERVICES_RESOURCE_NAME="your-cognitive-services-resource"
```

### Step 3: Select Models

```bash
# In OpenCode, run:
/models

# Select your deployed Azure AI Foundry models
```

## Technical Details

### Token Acquisition

The plugin acquires tokens with scope: `https://cognitiveservices.azure.com/.default`

### Token Caching

Tokens are cached in memory with 5-minute buffer before expiration to avoid expired tokens during API calls.

### Dummy API Key Pattern

The `@ai-sdk/azure` package requires an `apiKey` parameter. We use `OAUTH_DUMMY_KEY` ("opencode-oauth-dummy-key") and replace it with the bearer token in the `Authorization` header.

### Auth Storage

A dummy OAuth entry is stored in `auth.json`:
```json
{
  "azure": {
    "type": "oauth",
    "refresh": "entra-id-default-credential",
    "access": "entra-id-default-credential",
    "expires": 1738204800000
  }
}
```

This entry indicates EntraID auth is configured. Actual token acquisition happens at runtime via `DefaultAzureCredential`.

## Files Modified

1. `packages/opencode/package.json` - Added `@azure/identity` dependency
2. `packages/opencode/src/plugin/azure-entraid.ts` - New plugin implementation
3. `packages/opencode/src/plugin/index.ts` - Plugin registration
4. `packages/opencode/src/provider/provider.ts` - Updated provider loaders

## Troubleshooting

### Common Issues

1. **"No credentials found"**: Ensure you're logged in via Azure CLI or have environment variables set
2. **"Insufficient permissions"**: Check your Azure role assignments
3. **Token acquisition failures**: Verify network connectivity to Azure endpoints

### Debugging

Set log level to debug for more information:
```bash
export LOG_LEVEL=debug
opencode
```

### Testing Credential Acquisition

You can test credential acquisition independently:
```typescript
import { DefaultAzureCredential } from "@azure/identity"

const credential = new DefaultAzureCredential()
const token = await credential.getToken("https://cognitiveservices.azure.com/.default")
console.log("Token acquired:", token.token.substring(0, 20) + "...")
```

## Security Considerations

1. **Token Storage**: Tokens are cached in memory only, never persisted to disk
2. **Credential Chain**: `DefaultAzureCredential` follows Azure security best practices
3. **Scope**: Minimal required scope is used
4. **Network Security**: All communication is over HTTPS

## References

- [Azure Identity SDK Documentation](https://learn.microsoft.com/en-us/javascript/api/@azure/identity/)
- [DefaultAzureCredential](https://learn.microsoft.com/en-us/dotnet/azure/sdk/authentication/credential-chains?tabs=dac)
- [Azure AI Foundry Authentication](https://learn.microsoft.com/en-us/azure/ai-foundry/openai/how-to/managed-identity?view=foundry-classic)
- [Vercel AI SDK Azure Provider](https://github.com/vercel/ai/discussions/7454)
