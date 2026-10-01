import { IMPOSSIBLE, VersionInfo } from '@start9labs/start-sdk'

export const v2026_9_4_5 = VersionInfo.of({
  version: '2026.9.4:5',
  releaseNotes: {
    en_US: `Webchat fixes.

- The profile picker now shows the app name instead of "{{APP_NAME}}".
- Preset conversations can be **cleared** (⟲) like General: the old conversation is archived and an empty one with the same name takes its place. Presets are only removed by deleting their line in Configure Webchat.`,
  },
  migrations: {
    up: async () => {},
    down: IMPOSSIBLE,
  },
})
