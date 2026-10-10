import { IMPOSSIBLE, VersionInfo } from '@start9labs/start-sdk'

export const current = VersionInfo.of({
  version: '2026.9.9:0',
  releaseNotes: {
    en_US: `OpenClaw 2026.9.9: a maintenance release.

- **OpenClaw 2026.9.9** (from 2026.9.8). Upstream lists no capability changes; the fixes that matter here: CLI and gateway processes no longer hang after their output on Node 24/26, scheduled (cron) jobs no longer stall the gateway, and a stale cron cleanup can no longer abort a later run.
- **First start runs \`openclaw doctor\` once** (as it does for every new OpenClaw version) and takes about a minute longer. Make a StartOS backup before updating, as for any update that touches the agent databases.
- The webchat's gateway client is updated to 2026.9.9.
- When no embedding provider is set up (a new install, say), the start-up log now says plainly that keyword memory search still works and where to enable vector search, instead of reporting a failed index rebuild.
- README and setup instructions brought up to date (helper agents, external services, webchat, Qdrant, health checks, browser approval, the optional StartOS login).`,
  },
  migrations: {
    up: async () => {},
    down: IMPOSSIBLE,
  },
})
