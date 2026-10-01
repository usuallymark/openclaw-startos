import { sdk } from '../sdk'
import { externalServicesJson } from '../fileModels/externalServices.json'
import { splitPemCerts, writeMasterPassword } from '../vault'

const { InputSpec, Value, Variants } = sdk

// ── Reusable credential-source union ────────────────────────────────────────
// Each secret is either fetched from Vaultwarden (no input) or typed in.
// This mirrors the primary/fallback provider union in configureApiCredentials.
const credentialVariants = (entryName: string, fieldName: string) =>
  Variants.of({
    'from-vaultwarden': {
      name: 'Fetch from Vaultwarden',
      spec: InputSpec.of({}),
    },
    manual: {
      name: 'Enter manually',
      spec: InputSpec.of({
        value: Value.text({
          name: 'Value',
          description: null,
          required: true,
          default: null,
          masked: true,
          placeholder: null,
        }),
      }),
    },
  })

const credentialUnion = (
  label: string,
  entryName: string,
  fieldName: string,
  helpText: string,
) =>
  Value.union({
    name: label,
    description: `${helpText}\n\nWhen "Fetch from Vaultwarden" is selected, OpenClaw looks up entry "${entryName}", field "${fieldName}". This only works if Vaultwarden is enabled above.`,
    default: 'from-vaultwarden',
    variants: credentialVariants(entryName, fieldName),
  })

// "Alfred, Photos ,,x" -> "Alfred, Photos, x"; blank -> undefined.
const normalizeShares = (raw: unknown): string | undefined => {
  const list = String(raw ?? '')
    .split(',')
    .map((x) => x.trim().replace(/^[\\/]+|[\\/]+$/g, ''))
    .filter((x) => x.length > 0)
  return list.length ? Array.from(new Set(list)).join(', ') : undefined
}

const urlField = (label: string, description: string, placeholder: string) =>
  Value.text({
    name: label,
    description,
    required: true,
    default: null,
    masked: false,
    placeholder,
  })

// ── Service variants (Disabled / Enabled) ───────────────────────────────────

const vaultwardenService = Value.union({
  name: 'Vaultwarden (Password Manager)',
  description:
    'Vaultwarden is a self-hosted password manager compatible with Bitwarden clients. When enabled, OpenClaw fetches credentials for other services from it at runtime, so you do not need to enter passwords here.\nGitHub: https://github.com/dani-garcia/vaultwarden',
  default: 'disabled',
  variants: Variants.of({
    disabled: { name: 'Disabled', spec: InputSpec.of({}) },
    enabled: {
      name: 'Enabled',
      spec: InputSpec.of({
        url: urlField(
          'Vaultwarden URL',
          'The base URL of your Vaultwarden server, e.g. https://vaultwarden.yourdomain.local',
          'https://vaultwarden.yourdomain.local',
        ),
        email: Value.text({
          name: 'Account Email',
          description: 'The email address of your Vaultwarden account.',
          required: true,
          default: null,
          masked: false,
          placeholder: 'you@example.com',
          inputmode: 'email',
        }),
        masterPassword: Value.text({
          name: 'Master Password',
          description:
            'Your Vaultwarden master password, used to log in and unlock the vault at every startup. Paste it exactly — it is stored byte-for-byte in a private file (not in the settings file) and read by rbw non-interactively.\n\nLeave blank to keep the password already saved.',
          required: false,
          default: null,
          masked: true,
          placeholder: 'Leave blank to keep the saved password',
        }),
      }),
    },
  }),
})

const ollamaService = Value.union({
  name: 'Ollama (Local AI Models)',
  description:
    'Ollama runs large language models locally. Used by OpenClaw for embeddings (nomic-embed-text) and vision analysis (llama3.2-vision).\nGitHub: https://github.com/ollama/ollama',
  default: 'disabled',
  variants: Variants.of({
    disabled: { name: 'Disabled', spec: InputSpec.of({}) },
    enabled: {
      name: 'Enabled',
      spec: InputSpec.of({
        url: urlField(
          'Ollama URL',
          'The HTTP URL of your Ollama server, e.g. http://192.168.0.101:11434. Must be reachable from this server on your local network.',
          'http://192.168.0.x:11434',
        ),
      }),
    },
  }),
})

const nasService = Value.union({
  name: 'NAS (Network Storage)',
  description:
    'Connect to a NAS via SMB/CIFS. Used by agents to read and write files, photos, and documents on your network storage.',
  default: 'disabled',
  variants: Variants.of({
    disabled: { name: 'Disabled', spec: InputSpec.of({}) },
    enabled: {
      name: 'Enabled',
      spec: InputSpec.of({
        host: urlField(
          'NAS Host',
          'IP address or hostname of your NAS, e.g. 192.168.0.16',
          '192.168.0.x',
        ),
        share: Value.text({
          name: 'Preferred Shares (optional)',
          description:
            'Comma-separated SMB share names the agent should look in first, e.g. "Alfred, Photos". Leave blank to let the agent pick. This is a hint, not a restriction: the agent can use every share the NAS account below is allowed to open. To limit access, give that account permissions only on the shares it should use.',
          required: false,
          default: null,
          masked: false,
          placeholder: 'Alfred, Photos',
        }),
        username: credentialUnion(
          'Username',
          'NAS',
          'username',
          'SMB username for the NAS share.',
        ),
        password: credentialUnion(
          'Password',
          'NAS',
          'Password',
          'SMB password for the NAS share.',
        ),
      }),
    },
  }),
})

const n8nService = Value.union({
  name: 'n8n (Workflow Automation)',
  description:
    'n8n is an open-source workflow automation tool. Used by agents to trigger and monitor automated workflows.\nGitHub: https://github.com/n8n-io/n8n',
  default: 'disabled',
  variants: Variants.of({
    disabled: { name: 'Disabled', spec: InputSpec.of({}) },
    enabled: {
      name: 'Enabled',
      spec: InputSpec.of({
        url: urlField(
          'n8n URL',
          'The URL of your n8n instance, e.g. https://n8n.yourdomain.local',
          'https://n8n.yourdomain.local',
        ),
        apiKey: credentialUnion(
          'API Key',
          'n8n',
          'API_Key',
          'n8n API key. Found in n8n → Settings → API → Create API Key.',
        ),
      }),
    },
  }),
})

const triliumService = Value.union({
  name: 'Trilium Notes',
  description:
    'Trilium Notes is a hierarchical note-taking application. Used by agents to create and organize research notes.\nGitHub: https://github.com/zadam/trilium',
  default: 'disabled',
  variants: Variants.of({
    disabled: { name: 'Disabled', spec: InputSpec.of({}) },
    enabled: {
      name: 'Enabled',
      spec: InputSpec.of({
        url: urlField(
          'Trilium URL',
          'The URL of your Trilium instance including the ETAPI path, e.g. https://trilium.yourdomain.local/etapi',
          'https://trilium.yourdomain.local/etapi',
        ),
        apiKey: credentialUnion(
          'ETAPI Token',
          'Trilium',
          'API_Key',
          'Trilium ETAPI token. Create it in Trilium → Menu → Options → ETAPI → Create new ETAPI token.',
        ),
      }),
    },
  }),
})

const stirlingService = Value.union({
  name: 'Stirling PDF',
  description:
    'Stirling PDF is a self-hosted PDF manipulation tool. Used by agents for OCR processing of documents.\nGitHub: https://github.com/Stirling-Tools/Stirling-PDF',
  default: 'disabled',
  variants: Variants.of({
    disabled: { name: 'Disabled', spec: InputSpec.of({}) },
    enabled: {
      name: 'Enabled',
      spec: InputSpec.of({
        url: urlField(
          'Stirling PDF URL',
          'The URL of your Stirling PDF instance, e.g. https://pdf.yourdomain.local',
          'https://pdf.yourdomain.local',
        ),
        apiKey: credentialUnion(
          'API Key',
          'StirlingPDF',
          'API_Key',
          'Stirling PDF API key. Only required if authentication is enabled. Found in Stirling PDF → Settings → Security.',
        ),
      }),
    },
  }),
})

const searxngService = Value.union({
  name: 'SearXNG (Web Search)',
  description:
    'SearXNG is a privacy-respecting metasearch engine. Used by agents for web search without tracking. No authentication required.\nGitHub: https://github.com/searxng/searxng',
  default: 'disabled',
  variants: Variants.of({
    disabled: { name: 'Disabled', spec: InputSpec.of({}) },
    enabled: {
      name: 'Enabled',
      spec: InputSpec.of({
        url: urlField(
          'SearXNG URL',
          'The URL of your SearXNG instance, e.g. https://search.yourdomain.local',
          'https://search.yourdomain.local',
        ),
      }),
    },
  }),
})

const firecrawlService = Value.union({
  name: 'Firecrawl (Web Scraping)',
  description:
    'Firecrawl converts web pages into clean, structured content agents can read. No authentication required for self-hosted instances.\nGitHub: https://github.com/mendableai/firecrawl',
  default: 'disabled',
  variants: Variants.of({
    disabled: { name: 'Disabled', spec: InputSpec.of({}) },
    enabled: {
      name: 'Enabled',
      spec: InputSpec.of({
        url: urlField(
          'Firecrawl URL',
          'The URL of your Firecrawl instance, e.g. http://192.168.0.x:3002',
          'http://192.168.0.x:3002',
        ),
      }),
    },
  }),
})

// ── Network: host mappings + custom CA ──────────────────────────────────────

const hostMappings = Value.list(
  sdk.List.obj(
    {
      name: 'Custom Host Mappings',
      description:
        'Hostnames OpenClaw should resolve to a fixed IP address, written to /etc/hosts at startup.\n\nNeeded for any service with a ".local" name (e.g. vaultwarden.home.local). StartOS treats ".local" as mDNS-only (RFC 6762) and will not forward it to your DNS server, so those names never resolve from inside a service even if your router or AdGuard knows them. A mapping here bypasses DNS entirely.\n\nNames ending in .lan, .internal or a real domain normally resolve without this.',
      default: [],
    },
    {
      spec: InputSpec.of({
        hostname: Value.text({
          name: 'Hostname',
          description: 'e.g. vaultwarden.home.local',
          required: true,
          default: null,
          placeholder: 'vaultwarden.home.local',
          patterns: [
            {
              regex:
                '^[A-Za-z0-9]([A-Za-z0-9-]*[A-Za-z0-9])?(\\.[A-Za-z0-9]([A-Za-z0-9-]*[A-Za-z0-9])?)*$',
              description:
                'Must be a valid hostname (letters, digits, hyphens, dots).',
            },
          ],
        }),
        ip: Value.text({
          name: 'IP Address',
          description: 'The LAN IP address of that host, e.g. 192.168.1.50',
          required: true,
          default: null,
          placeholder: '192.168.0.x',
          patterns: [
            {
              regex:
                '^((25[0-5]|2[0-4]\\d|1?\\d?\\d)\\.){3}(25[0-5]|2[0-4]\\d|1?\\d?\\d)$',
              description: 'Must be an IPv4 address, e.g. 192.168.1.50',
            },
          ],
        }),
      }),
      displayAs: '{{hostname}} → {{ip}}',
      uniqueBy: 'hostname',
    },
  ),
)

const caCert = Value.textarea({
  name: 'Custom CA Certificate',
  description:
    'PEM certificate(s) of an internal certificate authority to trust, e.g. the CA that signs your homelab HTTPS certificates (Vaultwarden, Trilium, n8n…). Paste one or more blocks from -----BEGIN CERTIFICATE----- to -----END CERTIFICATE-----. Installed into the system trust store at startup; used by rbw, curl and Node.\n\nThis is a public certificate, not a private key. Leave blank if all your services use publicly trusted certificates.',
  required: false,
  default: null,
  minRows: 4,
  maxRows: 12,
  placeholder: '-----BEGIN CERTIFICATE-----\n...\n-----END CERTIFICATE-----',
})

const inputSpec = InputSpec.of({
  hostMappings,
  caCert,
  vaultwarden: vaultwardenService,
  ollama: ollamaService,
  nas: nasService,
  n8n: n8nService,
  trilium: triliumService,
  stirling: stirlingService,
  searxng: searxngService,
  firecrawl: firecrawlService,
})

// ── Helpers to map action input <-> stored file shape ───────────────────────

type CredUnion = { selection: string; value: { value?: string | null } }

function credToStored(u: CredUnion | undefined) {
  if (!u) return undefined
  if (u.selection === 'from-vaultwarden') {
    return { source: 'from-vaultwarden' as const }
  }
  return { source: 'manual' as const, value: u.value?.value ?? '' }
}

function credToPrefill(
  stored: { source?: string; value?: string } | undefined,
) {
  if (!stored || stored.source === 'from-vaultwarden') {
    return { selection: 'from-vaultwarden' as const, value: {} }
  }
  return { selection: 'manual' as const, value: { value: stored.value ?? '' } }
}

// ── Action ──────────────────────────────────────────────────────────────────

export const configureExternalServices = sdk.Action.withInput(
  'configure-external-services',

  async ({ effects }) => ({
    name: 'Configure External Services',
    description:
      'Connect OpenClaw to your self-hosted tools (Vaultwarden, Ollama, NAS, n8n, Trilium, Stirling PDF, SearXNG, Firecrawl), plus host mappings and a custom CA for internal HTTPS services. Enable only the services you use. If Vaultwarden is enabled, other services can fetch their credentials from it automatically. Saving restarts OpenClaw to apply changes.',
    warning: null,
    allowedStatuses: 'any',
    group: null,
    visibility: 'enabled',
  }),

  inputSpec,

  // Prefill from stored config. Secrets are never echoed back (manual values
  // are re-shown only if already stored as manual; masked in the UI).
  async ({ effects }) => {
    const cfg = await externalServicesJson
      .read()
      .once()
      .catch(() => undefined)

    const vw = cfg?.vaultwarden
    const ollama = cfg?.ollama
    const nas = cfg?.nas
    const n8n = cfg?.n8n
    const trilium = cfg?.trilium
    const stirling = cfg?.stirling
    const searxng = cfg?.searxng
    const firecrawl = cfg?.firecrawl

    return {
      hostMappings: (cfg?.hostMappings ?? []).map((m) => ({
        hostname: m.hostname,
        ip: m.ip,
      })),
      caCert: cfg?.caCert ?? null,
      vaultwarden: vw?.enabled
        ? {
            selection: 'enabled' as const,
            value: {
              url: vw.url ?? '',
              email: vw.email ?? '',
              masterPassword: null, // never echo secrets
            },
          }
        : { selection: 'disabled' as const, value: {} },
      ollama: ollama?.enabled
        ? { selection: 'enabled' as const, value: { url: ollama.url ?? '' } }
        : { selection: 'disabled' as const, value: {} },
      nas: nas?.enabled
        ? {
            selection: 'enabled' as const,
            value: {
              host: nas.host ?? '',
              share: nas.share || null,
              username: credToPrefill(nas.username),
              password: credToPrefill(nas.password),
            },
          }
        : { selection: 'disabled' as const, value: {} },
      n8n: n8n?.enabled
        ? {
            selection: 'enabled' as const,
            value: {
              url: n8n.url ?? '',
              apiKey: credToPrefill(n8n.apiKey),
            },
          }
        : { selection: 'disabled' as const, value: {} },
      trilium: trilium?.enabled
        ? {
            selection: 'enabled' as const,
            value: {
              url: trilium.url ?? '',
              apiKey: credToPrefill(trilium.apiKey),
            },
          }
        : { selection: 'disabled' as const, value: {} },
      stirling: stirling?.enabled
        ? {
            selection: 'enabled' as const,
            value: {
              url: stirling.url ?? '',
              apiKey: credToPrefill(stirling.apiKey),
            },
          }
        : { selection: 'disabled' as const, value: {} },
      searxng: searxng?.enabled
        ? { selection: 'enabled' as const, value: { url: searxng.url ?? '' } }
        : { selection: 'disabled' as const, value: {} },
      firecrawl: firecrawl?.enabled
        ? {
            selection: 'enabled' as const,
            value: { url: firecrawl.url ?? '' },
          }
        : { selection: 'disabled' as const, value: {} },
    }
  },

  async ({ effects, input }) => {
    const i = input as any

    const hostMappings = (
      (i.hostMappings ?? []) as {
        hostname: string
        ip: string
      }[]
    ).map((m) => ({ hostname: m.hostname.trim(), ip: m.ip.trim() }))

    const caText: string = (i.caCert ?? '').trim()
    if (caText && splitPemCerts(caText).length === 0) {
      throw new Error(
        'Custom CA Certificate: no PEM certificate found. Paste the full block including the -----BEGIN CERTIFICATE----- and -----END CERTIFICATE----- lines.',
      )
    }
    const caCert = caText ? splitPemCerts(caText).join('\n') + '\n' : undefined

    // The master password is never stored in the settings file. A non-empty
    // value is written byte-exact to rbw/.credentials; blank keeps the
    // existing file untouched.
    const vaultwarden =
      i.vaultwarden.selection === 'enabled'
        ? {
            enabled: true,
            url: i.vaultwarden.value.url,
            email: i.vaultwarden.value.email,
          }
        : { enabled: false }
    const newMasterPassword: string =
      i.vaultwarden.selection === 'enabled'
        ? (i.vaultwarden.value.masterPassword ?? '')
        : ''

    const ollama =
      i.ollama.selection === 'enabled'
        ? { enabled: true, url: i.ollama.value.url }
        : { enabled: false }

    const nas =
      i.nas.selection === 'enabled'
        ? {
            enabled: true,
            host: i.nas.value.host,
            share: normalizeShares(i.nas.value.share),
            username: credToStored(i.nas.value.username),
            password: credToStored(i.nas.value.password),
          }
        : { enabled: false }

    const n8n =
      i.n8n.selection === 'enabled'
        ? {
            enabled: true,
            url: i.n8n.value.url,
            apiKey: credToStored(i.n8n.value.apiKey),
          }
        : { enabled: false }

    const trilium =
      i.trilium.selection === 'enabled'
        ? {
            enabled: true,
            url: i.trilium.value.url,
            apiKey: credToStored(i.trilium.value.apiKey),
          }
        : { enabled: false }

    const stirling =
      i.stirling.selection === 'enabled'
        ? {
            enabled: true,
            url: i.stirling.value.url,
            apiKey: credToStored(i.stirling.value.apiKey),
          }
        : { enabled: false }

    const searxng =
      i.searxng.selection === 'enabled'
        ? { enabled: true, url: i.searxng.value.url }
        : { enabled: false }

    const firecrawl =
      i.firecrawl.selection === 'enabled'
        ? { enabled: true, url: i.firecrawl.value.url }
        : { enabled: false }

    if (newMasterPassword) {
      await writeMasterPassword(newMasterPassword)
    }

    await externalServicesJson.write(effects, {
      hostMappings,
      caCert,
      vaultwarden,
      ollama,
      nas,
      n8n,
      trilium,
      stirling,
      searxng,
      firecrawl,
    } as any)

    await effects.restart()

    return {
      version: '1' as const,
      title: 'External Services Configured',
      message:
        'Settings saved. OpenClaw is restarting to apply the new configuration.',
      result: null,
    }
  },
)
