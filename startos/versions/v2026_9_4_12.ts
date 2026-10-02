import { IMPOSSIBLE, VersionInfo } from '@start9labs/start-sdk'

export const v2026_9_4_12 = VersionInfo.of({
  version: '2026.9.4:12',
  releaseNotes: {
    en_US: `Webchat: copy button on code blocks.

- Code blocks in the agent's replies now have a header showing the language (when given) and a Copy button that puts the code on the clipboard. It also works when the webchat is opened over plain HTTP.`,
  },
  migrations: {
    up: async () => {},
    down: IMPOSSIBLE,
  },
})
