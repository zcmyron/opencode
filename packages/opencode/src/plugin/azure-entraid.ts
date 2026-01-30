import type { Hooks, PluginInput } from "@opencode-ai/plugin"
import { Log } from "../util/log"
import { Auth, OAUTH_DUMMY_KEY } from "../auth"
import { DefaultAzureCredential } from "@azure/identity"

const log = Log.create({ service: "plugin.azure-entraid" })

const SCOPE = "https://cognitiveservices.azure.com/.default"

interface TokenCache {
  token: string
  expiresAt: number
}

let tokenCache: TokenCache | null = null
let credential: DefaultAzureCredential | null = null

function isTokenExpired(): boolean {
  if (!tokenCache) return true
  const bufferMs = 5 * 60 * 1000 // 5 minutes buffer
  return Date.now() >= (tokenCache.expiresAt - bufferMs)
}

async function getAccessToken(): Promise<string> {
  if (tokenCache && !isTokenExpired()) {
    return tokenCache.token
  }

  if (!credential) {
    credential = new DefaultAzureCredential()
  }

  try {
    const tokenResult = await credential.getToken()
    tokenCache = {
      token: tokenResult.token,
      expiresAt: tokenResult.expiresOnTimestamp || (Date.now() + 60 * 60 * 1000),
    }

    log.info("acquired Azure EntraID token", {
      expiresAt: new Date(tokenCache.expiresAt).toISOString(),
    })

    return tokenCache.token
  } catch (error) {
    log.error("failed to acquire Azure EntraID token", { error })
    throw error
  }
}

// Common authorize function for both Azure providers
async function entraIDAuthorize(_inputs?: Record<string, string>) {
  try {
    // Test credential acquisition immediately to verify setup
    const testCredential = new DefaultAzureCredential()
    await testCredential.getToken()

    log.info("successfully acquired test Azure EntraID token")

    // Return OAuth flow configuration with immediate success callback
    // DefaultAzureCredential handles token refresh internally, so we use dummy values
    return {
      url: "https://login.microsoftonline.com/",
      instructions: "Azure EntraID authentication using DefaultAzureCredential is configured. Your local Azure credentials (Azure CLI, environment variables, managed identity, etc.) will be used automatically.",
      method: "auto" as const,
      callback: async () => {
        // Token acquisition already tested above, return success with dummy values
        // The actual token will be acquired dynamically in the loader
        return {
          type: "success" as const,
          refresh: "entra-id-default-credential",
          access: "entra-id-default-credential",
          expires: Date.now() + (24 * 60 * 60 * 1000), // 24 hours
        }
      },
    }
  } catch (error) {
    log.error("failed to acquire Azure EntraID token during authorization", { error })
    // Return error state - user needs to configure Azure credentials
    return {
      url: "https://learn.microsoft.com/en-us/azure/ai-services/authentication?",
      instructions: "Azure EntraID authentication failed. Please ensure you have configured Azure credentials using one of the following methods:\n\n1. Azure CLI: az login\n2. Environment Variables: AZURE_TENANT_ID, AZURE_CLIENT_ID, AZURE_CLIENT_SECRET\n3. Managed Identity (when running in Azure)\n4. Visual Studio Code Azure Tools extension\n\nSee https://learn.microsoft.com/en-us/javascript/api/overview/azure/identity-readme?view=azure-node-latest for more details.",
      method: "auto" as const,
      callback: async () => {
        return {
          type: "failed" as const,
        }
      },
    }
  }
}

// Common loader function for both Azure providers
async function entraIDLoader(getAuth: () => Promise<Auth.Info | undefined>) {
  const auth = await getAuth()
  // Check if it's an EntraID OAuth entry (has our dummy refresh token)
  if (auth?.type !== "oauth" || auth.refresh !== "entra-id-default-credential") return {}

  return {
    apiKey: OAUTH_DUMMY_KEY,
    async fetch(request: RequestInfo | URL, init?: RequestInit) {
      // Remove dummy API key authorization header
      const headers = new Headers(init?.headers)
      headers.delete("authorization")
      headers.delete("Authorization")

      // Get fresh token
      const token = await getAccessToken()

      // Add bearer token
      headers.set("Authorization", `Bearer ${token}`)

      // Add Content-Type if not present
      if (!headers.has("Content-Type")) {
        headers.set("Content-Type", "application/json")
      }

      log.debug("making Azure request with EntraID token")

      return fetch(request, { ...init, headers })
    },
  }
}

export async function AzureEntraIDAuthPlugin(input: PluginInput): Promise<Hooks> {
  return {
    auth: {
      provider: "azure",
      loader: entraIDLoader,
      methods: [
        {
          type: "oauth",
          label: "Azure EntraID (DefaultAzureCredential)",
          authorize: entraIDAuthorize,
        },
      ],
    },
  }
}

export async function AzureCognitiveServicesEntraIDAuthPlugin(input: PluginInput): Promise<Hooks> {
  return {
    auth: {
      provider: "azure-cognitive-services",
      loader: entraIDLoader,
      methods: [
        {
          type: "oauth",
          label: "Azure EntraID (DefaultAzureCredential)",
          authorize: entraIDAuthorize,
        },
      ],
    },
  }
}