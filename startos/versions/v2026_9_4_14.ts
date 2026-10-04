import { IMPOSSIBLE, VersionInfo } from '@start9labs/start-sdk'

export const v2026_9_4_14 = VersionInfo.of({
  version: '2026.9.4:14',
  releaseNotes: {
    en_US: `New health skill: the agent can check the service's status itself.

- \`python3 /opt/skills/health/health.py\` (or \`--json\`) runs, from inside the container, the same checks as the StartOS health list: the web interface, Qdrant, the webchat, the vault and every enabled external service, plus disk and memory. It sends no credentials and prints no secrets.
- The StartOS checks and the skill now share one list of addresses, so they always agree.
- Service logs and restarts still need you (StartOS UI, or \`start-cli package logs openclaw\` on the server); the skill says so.`,
  },
  migrations: {
    up: async () => {},
    down: IMPOSSIBLE,
  },
})
