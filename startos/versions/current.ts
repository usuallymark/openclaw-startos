import { IMPOSSIBLE, VersionInfo } from '@start9labs/start-sdk'

export const current = VersionInfo.of({
  version: '2026.9.8:0',
  releaseNotes: {
    en_US: `OpenClaw 2026.9.8: Claude Opus 5.5, Sonnet 5.5 and GPT-6, subagent fixes.

- **First start takes 1–2 minutes longer, once.** OpenClaw 2026.9.8 stores its agent databases in a newer format and will not open the old ones on its own. Before the gateway starts, the package now runs \`openclaw doctor --non-interactive\` once per OpenClaw version to migrate them (your settings are not changed). Make a StartOS backup before updating: the migration cannot be undone.
- **Claude Opus 5.5, Claude Sonnet 5.5 and GPT-6** are offered again in Configure AI Provider, Configure Agents and the agents skill, and work. The default Anthropic model for a new setup is Claude Opus 5.5 again; an existing choice is not changed.
- Subagents: inherit the active model at spawn, run concurrently per spawning session, and deliver completed results more reliably (OpenClaw 2026.9.5–9.8).
- Webchat: the first message in a new conversation could be refused by the new OpenClaw ("session changed before chat.send"); it is now retried once. The webchat's gateway client is updated to 2026.9.8.
- pdf skill: extracted text has a "--- page N ---" line before each page.
- GitHub CLI updated to 2.102.0 and start-cli to 2.2.0 (the commands the package runs are unchanged; the start-cli skill lists the 2.x forms of the few commands that changed, e.g. \`server governor\`).`,
  },
  migrations: {
    up: async () => {},
    down: IMPOSSIBLE,
  },
})
