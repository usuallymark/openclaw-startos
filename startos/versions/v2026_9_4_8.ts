import { IMPOSSIBLE, VersionInfo } from '@start9labs/start-sdk'

export const v2026_9_4_8 = VersionInfo.of({
  version: '2026.9.4:8',
  releaseNotes: {
    en_US: `Skills for n8n, Trilium and Stirling PDF no longer break when the agent copies their examples.

- OpenClaw hides the value of lines like \`SOMETHING_KEY = …\` in tool output. When the agent read a skill's example and copied it, the credential lookup arrived as \`***\` and the code failed. The examples now pass credentials straight into request headers, so nothing is hidden or broken.
- n8n: the agent is told to change, activate or deactivate workflows only when you ask for that specific change.`,
  },
  migrations: {
    up: async () => {},
    down: IMPOSSIBLE,
  },
})
