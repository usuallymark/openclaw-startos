import { FileHelper, z } from '@start9labs/start-sdk'
import { sdk } from '../sdk'

// A credential is either fetched from Vaultwarden at runtime or entered manually.
const credentialShape = z
  .object({
    source: z.enum(['from-vaultwarden', 'manual']).catch('manual'),
    value: z.string().optional().catch(undefined),
  })
  .catch({ source: 'manual' as const, value: undefined })

const vaultwardenShape = z
  .object({
    enabled: z.boolean().catch(false),
    url: z.string().optional().catch(undefined),
    email: z.string().optional().catch(undefined),
    apiKey: z.string().optional().catch(undefined),
    masterPassword: z.string().optional().catch(undefined),
  })
  .catch({ enabled: false })

const urlOnlyShape = z
  .object({
    enabled: z.boolean().catch(false),
    url: z.string().optional().catch(undefined),
  })
  .catch({ enabled: false })

const urlWithKeyShape = z
  .object({
    enabled: z.boolean().catch(false),
    url: z.string().optional().catch(undefined),
    apiKey: credentialShape.optional().catch(undefined),
  })
  .catch({ enabled: false })

const nasShape = z
  .object({
    enabled: z.boolean().catch(false),
    host: z.string().optional().catch(undefined),
    share: z.string().optional().catch(undefined),
    username: credentialShape.optional().catch(undefined),
    password: credentialShape.optional().catch(undefined),
  })
  .catch({ enabled: false })

const shape = z.object({
  vaultwarden: vaultwardenShape.catch({ enabled: false }),
  ollama: urlOnlyShape.catch({ enabled: false }),
  nas: nasShape.catch({ enabled: false }),
  n8n: urlWithKeyShape.catch({ enabled: false }),
  trilium: urlWithKeyShape.catch({ enabled: false }),
  stirling: urlWithKeyShape.catch({ enabled: false }),
  searxng: urlOnlyShape.catch({ enabled: false }),
  firecrawl: urlOnlyShape.catch({ enabled: false }),
})

export const externalServicesJson = FileHelper.json(
  { base: sdk.volumes.main, subpath: '.openclaw/external-services.json' },
  shape,
)
