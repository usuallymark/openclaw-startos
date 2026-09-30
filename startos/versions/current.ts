import { IMPOSSIBLE, VersionInfo } from '@start9labs/start-sdk'

export const current = VersionInfo.of({
  version: '2026.9.4:2',
  releaseNotes: {
    en_US: `Finishes the Vaultwarden credential path.

- **Configure External Services** gains **Custom Host Mappings** (written to /etc/hosts — needed for \`.local\` names, which StartOS will not resolve) and a **Custom CA Certificate** field for internal HTTPS services.
- Vaultwarden now logs in with the master password only (rbw cannot use an API key). The password is kept byte-exact in a private file and answered by a non-interactive pinentry, so the vault unlocks at startup and re-unlocks on demand.
- The API Key field is removed and the master password is no longer stored in the settings file.`,
  },
  migrations: {
    up: async () => {},
    down: IMPOSSIBLE,
  },
})
