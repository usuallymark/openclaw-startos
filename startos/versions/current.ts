import { IMPOSSIBLE, VersionInfo } from '@start9labs/start-sdk'

export const current = VersionInfo.of({
  version: '2026.9.8:1',
  releaseNotes: {
    en_US: `Snapshot and heartbeat without improvising, key checks in the health report, long subagent results.

- **Server State Snapshot**: MEMORY.md's snapshot section is now written by a package script (\`refresh-snapshot\`) at every start and by the daily heartbeat, instead of the agent editing it by hand. When start-cli is not logged in to StartOS, the section shows this service's health report instead of eight "Unauthorized" blocks. The heartbeat prompt now says to run only that command: no editing, no scripts, no git (a heartbeat had written its own update script).
- **Health report** (\`health.py\`): for n8n and Trilium it now checks that the API key is accepted, not just that the server answers. Trilium's ETAPI answering 401 without a token had looked like a problem; now you see "API key accepted (Trilium 0.95.0)", "rejected" or "not configured".
- **Long subagent results**: OpenClaw cuts a subagent's final reply to 4,096 characters before the main agent sees it (built into OpenClaw, no setting). The agents skill and new agents' starter instructions now say to put longer results in a file and reply with its path.
- **Upgrades**: after the one-time \`openclaw doctor\` that runs when the OpenClaw version changes, the memory search index is rebuilt automatically if it needs it (on the 2026.9.8 update this was a manual step).`,
  },
  migrations: {
    up: async () => {},
    down: IMPOSSIBLE,
  },
})
