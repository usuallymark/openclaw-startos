import { IMPOSSIBLE, VersionInfo } from '@start9labs/start-sdk'

export const v2026_9_4_15 = VersionInfo.of({
  version: '2026.9.4:15',
  releaseNotes: {
    en_US: `Backups now include Qdrant.

- Until now the StartOS backup of this service contained only the main data volume (workspace, configuration, vault). The Qdrant vector database, with all its collections, lives in a separate volume and was not backed up. Both volumes are now included.
- Make a fresh backup after updating: earlier backups do not contain your Qdrant collections.`,
  },
  migrations: {
    up: async () => {},
    down: IMPOSSIBLE,
  },
})
