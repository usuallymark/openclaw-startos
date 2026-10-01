import { IMPOSSIBLE, VersionInfo } from '@start9labs/start-sdk'

export const v2026_9_4_3 = VersionInfo.of({
  version: '2026.9.4:3',
  releaseNotes: {
    en_US: `Adds health checks for the vault and external services.

- **Vault (rbw)**: every 5 minutes, confirms the vault unlocks end-to-end (master password, pinentry and Vaultwarden connection).
- **External services**: each enabled service in Configure External Services (Vaultwarden, Ollama, NAS, n8n, Trilium, Stirling PDF, SearXNG, Firecrawl) gets a reachability check every minute, run from inside the service so host mappings and custom CA certificates apply. No credentials are sent.
- **Qdrant**: now waits for Qdrant's own readiness endpoint, not just an open port.`,
  },
  migrations: {
    up: async () => {},
    down: IMPOSSIBLE,
  },
})
