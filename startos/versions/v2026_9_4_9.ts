import { IMPOSSIBLE, VersionInfo } from '@start9labs/start-sdk'

export const v2026_9_4_9 = VersionInfo.of({
  version: '2026.9.4:9',
  releaseNotes: {
    en_US: `Faster health checks after a restart, and notes in MEMORY.md are kept.

- The vault health check now runs a few seconds after startup instead of 5 minutes later. The vault was already unlocked; only the check was waiting. External-service checks also start within seconds instead of a minute.
- At each restart the Server State Snapshot in MEMORY.md is replaced on its own. Notes the agent added after it under their own \`## \` heading are no longer deleted.`,
  },
  migrations: {
    up: async () => {},
    down: IMPOSSIBLE,
  },
})
