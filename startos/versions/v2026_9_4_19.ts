import { IMPOSSIBLE, VersionInfo } from '@start9labs/start-sdk'

export const v2026_9_4_19 = VersionInfo.of({
  version: '2026.9.4:19',
  releaseNotes: {
    en_US: `Hide the models this OpenClaw version can't use yet.

- Claude Opus 5.5 and Sonnet 5.5 (and GPT-6) are no longer offered in Configure AI Provider, Configure Agents or the agents skill. The bundled OpenClaw (2026.9.4) predates them, and every request to them was rejected by the provider (HTTP 400). They will return when the package moves to a newer OpenClaw.
- The default Anthropic model is now Claude Opus 4.8 (it was Opus 5.5, which would have failed on every turn).
- A model already configured stays selectable and is marked "not supported by this OpenClaw version", so opening a form never changes it silently.
- The daily heartbeat prompt now says to change no other file and not to commit, push or run git: it refreshes MEMORY.md on disk only (MEMORY.md is kept out of git on purpose; a heartbeat turn had committed and pushed it).`,
  },
  migrations: {
    up: async () => {},
    down: IMPOSSIBLE,
  },
})
