import { IMPOSSIBLE, VersionInfo } from '@start9labs/start-sdk'

export const current = VersionInfo.of({
  version: '2026.9.8:2',
  releaseNotes: {
    en_US: `refresh-snapshot never waits for a password.

- start-cli 2.1+ asks for the StartOS password at a terminal when it is not logged in. \`refresh-snapshot\` (run at start and by the daily heartbeat) checks the login with start-cli, and when run by hand in a terminal that check showed a "Password:" prompt. start-cli now runs without a terminal there, so the check simply reports "not logged in" and the snapshot shows the health report. Nothing else changed.`,
  },
  migrations: {
    up: async () => {},
    down: IMPOSSIBLE,
  },
})
