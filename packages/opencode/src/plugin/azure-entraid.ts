import type { Hooks, PluginInput } from "@opencode-ai/plugin"
import { Log } from "../util/log"
import { Auth, OAUTH_DUMMY_KEY } from "../auth"
import { DefaultAzureCredential, InteractiveBrowserCredential } from "@azure/identity"
import { Env } from "../env"
import { Flag } from "../flag/flag"

const log = Log.create({ service: "plugin.azure-entraid" })

const SCOPE = "https://cognitiveservices.azure.com/.default"

interface TokenCache {
  token: string
  expiresAt: number
}

let tokenCache: TokenCache | null = null
let credential: DefaultAzureCredential | InteractiveBrowserCredential | null = null

function isCli() {
  return Flag.OPENCODE_CLIENT === "cli"
}

function isBrowser() {
  if (isCli()) return false
  return typeof window !== "undefined" || typeof document !== "undefined" || typeof navigator !== "undefined"
}

function getCredential() {
  if (credential) return credential
  if (!isBrowser()) {
    credential = new DefaultAzureCredential()
    return credential
  }

  const clientId = Env.get("AZURE_CLIENT_ID")
  if (!clientId) {
    throw new Error("AZURE_CLIENT_ID is required for InteractiveBrowserCredential")
  }

  const tenantId = Env.get("AZURE_TENANT_ID")
  credential = new InteractiveBrowserCredential({
    clientId,
    ...(tenantId ? { tenantId } : {}),
  })
  return credential
}

async function getAccessTokenFromAzureCli(): Promise<string> {
  const text = await Bun.$`
    az account get-access-token \
      --resource https://cognitiveservices.azure.com/ \
      --query "{accessToken:accessToken,expiresOn:expiresOn}" \
      -o json
  `.text()
  const data = JSON.parse(text)
  const token = data.accessToken
  const time = Date.parse(data.expiresOn)
  const expiresAt = Number.isNaN(time) ? Date.now() + 55 * 60 * 1000 : time

  tokenCache = {
    token,
    expiresAt,
  }

  log.info("acquired Azure CLI token", {
    expiresAt: new Date(expiresAt).toISOString(),
  })

  return token
}

function isTokenExpired(): boolean {
  if (!tokenCache) return true
  const bufferMs = 5 * 60 * 1000 // 5 minutes buffer
  return Date.now() >= (tokenCache.expiresAt - bufferMs)
}

async function getAccessToken(): Promise<string> {
  if (tokenCache && !isTokenExpired()) {
    return tokenCache.token
  }

  if (isCli()) {
    return getAccessTokenFromAzureCli()
  }

  const active = getCredential()

  try {
    const tokenResult = await active.getToken(SCOPE)
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
    if (isBrowser() && !Env.get("AZURE_CLIENT_ID")) {
      return {
        url: "https://learn.microsoft.com/en-us/javascript/api/overview/azure/identity-readme?view=azure-node-latest",
        instructions:
          "Azure EntraID in the browser requires AZURE_CLIENT_ID (and optionally AZURE_TENANT_ID). Set these environment variables or use the CLI version with az login.",
        method: "auto" as const,
        callback: async () => {
          return {
            type: "failed" as const,
          }
        },
      }
    }

    if (isCli()) {
      await getAccessTokenFromAzureCli()
    } else {
      const testCredential = getCredential()
      await testCredential.getToken(SCOPE)
    }

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

  return getEntraIDOptions()
}

export async function getEntraIDOptions() {
  return {
    apiKey: OAUTH_DUMMY_KEY,
    async fetch(request: RequestInfo | URL, init?: RequestInit) {
      const headers = new Headers(init?.headers)
      headers.delete("authorization")
      headers.delete("Authorization")
      headers.delete("api-key")
      headers.delete("Api-Key")

      const token = await getAccessToken()

      headers.set("Authorization", `Bearer ${token}`)

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
