import { IMPOSSIBLE, VersionInfo } from '@start9labs/start-sdk'

export const current = VersionInfo.of({
  version: '2026.9.4:11',
  releaseNotes: {
    en_US: `Vault entries added or changed in Vaultwarden are found without a manual sync.

- rbw answers from a local copy of the vault that it refreshes only now and then. When a credential lookup ("Fetch from Vaultwarden") fails or comes back empty, it now runs \`rbw sync\` once (at most 30 seconds) and tries again before reporting an error.`,
  },
  migrations: {
    up: async () => {},
    down: IMPOSSIBLE,
  },
})
