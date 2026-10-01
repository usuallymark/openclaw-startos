import { IMPOSSIBLE, VersionInfo } from '@start9labs/start-sdk'

export const current = VersionInfo.of({
  version: '2026.9.4:7',
  releaseNotes: {
    en_US: `NAS works again, and "Fetch from Vaultwarden" now works for every service.

- NAS: the SMB tools now ship in the package (they were lost in the move to StartOS 0.4). The agent can list the NAS shares and use any share the NAS account is allowed to open.
- NAS: "Share Name" is now "Preferred Shares (optional)": a comma-separated list of where to look first, not a restriction. To limit access, set permissions on the NAS account.
- Credentials set to "Fetch from Vaultwarden" (NAS, n8n, Trilium, Stirling PDF) are now looked up when they are used, so a changed vault entry takes effect without a restart. Before, they were treated as missing.`,
  },
  migrations: {
    up: async () => {},
    down: IMPOSSIBLE,
  },
})
