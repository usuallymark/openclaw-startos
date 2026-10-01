import { IMPOSSIBLE, VersionInfo } from '@start9labs/start-sdk'

export const v2026_9_4_6 = VersionInfo.of({
  version: '2026.9.4:6',
  releaseNotes: {
    en_US: `Webchat: the agent now knows what each conversation is about.

- When a preset or named conversation starts, its name is passed to the agent with the hidden greeting ("This conversation is about: …"), or wherever you put \`{topic}\` in the greeting prompt. Conversations already under way are unchanged.
- This happens before the first message even if someone types right away; the message box waits briefly ("getting ready…") until the agent has answered.
- Fixed replies occasionally showing twice when two replies overlapped.`,
  },
  migrations: {
    up: async () => {},
    down: IMPOSSIBLE,
  },
})
