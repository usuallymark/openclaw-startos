import { IMPOSSIBLE, VersionInfo } from '@start9labs/start-sdk'

export const v2026_9_4_13 = VersionInfo.of({
  version: '2026.9.4:13',
  releaseNotes: {
    en_US: `Updates no longer overwrite the agent's SOUL.md and IDENTITY.md.

- Until now every install and update copied the stock SOUL.md and IDENTITY.md over the workspace, replacing a customized agent identity. They are now only created when missing, like MEMORY.md. If your agent's identity was reset by an earlier update, restore your own versions once (for example from your workspace git repository); later updates will keep them.`,
  },
  migrations: {
    up: async () => {},
    down: IMPOSSIBLE,
  },
})
