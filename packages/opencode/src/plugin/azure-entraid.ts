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
    const tokenResult = await credential.getToken(SCOPE)
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

// Common authorize function for both Azure providers
async function entraIDAuthorize() {
  try {
    // Test credential acquisition
    const testCredential = new DefaultAzureCredential()
    const testToken = await testCredential.getToken(SCOPE)

    log.info("successfully acquired test Azure EntraID token")

    // Store a dummy OAuth entry to indicate EntraID auth is configured
    // DefaultAzureCredential handles token refresh internally
    return {
      type: "success" as const,
      refresh: "entra-id-default-credential",
      access: "entra-id-default-credential",
      expires: Date.now() + (24 * 60 * 60 * 1000), // 24 hours
    }
  } catch (error) {
    log.error("failed to acquire Azure EntraID token during authorization", { error })
    return {
      type: "failed" as const,
    }
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