import { IMPOSSIBLE, VersionInfo } from '@start9labs/start-sdk'

export const v2026_9_4_16 = VersionInfo.of({
  version: '2026.9.4:16',
  releaseNotes: {
    en_US: `ntfy push notifications as an external service.

- Configure External Services: new "ntfy (Push Notifications)" with the server URL, a default topic and an access token (Vaultwarden entry "ntfy", field "API_Key", or entered manually). Your ntfy server also needs a Custom Host Mapping if its name ends in ".local".
- New health check for ntfy (also shown by the health skill).
- New ntfy skill and \`notify\` command, so the agent, scheduled jobs and git hooks send notifications the same way: \`notify --title "…" --priority high "message"\`. The token is never shown to the agent.`,
  },
  migrations: {
    up: async () => {},
    down: IMPOSSIBLE,
  },
})
