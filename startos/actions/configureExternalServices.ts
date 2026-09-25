import { sdk } from '../sdk'
import { externalServicesJson } from '../fileModels/externalServices.json'

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
          description:
            'The email address of your Vaultwarden account. Used with the API key to log in.',
          required: true,
          default: null,
          masked: false,
          placeholder: 'you@example.com',
          inputmode: 'email',
        }),
        apiKey: Value.text({
          name: 'API Key (client_secret)',
          description:
            'Your Vaultwarden Personal API Key. Find it at: Vaultwarden Web UI → Account Settings → Security → API Key → View API Key. Copy the "client_secret" value. Used instead of your master password for automated login.',
          required: true,
          default: null,
          masked: true,
          placeholder: null,
        }),
        masterPassword: Value.text({
          name: 'Master Password',
          description:
            'Your Vaultwarden master password. Used to unlock the vault at startup. Combined with the API key, this lets OpenClaw access all credentials automatically on every restart.',
          required: true,
          default: null,
          masked: true,
          placeholder: null,
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
        share: urlField(
          'Share Name',
          'The SMB share name to connect to, e.g. "Alfred". This is the top-level share, not a subfolder.',
          'Alfred',
        ),
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

const inputSpec = InputSpec.of({
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
      'Connect OpenClaw to your self-hosted tools (Vaultwarden, Ollama, NAS, n8n, Trilium, Stirling PDF, SearXNG, Firecrawl). Enable only the services you use. If Vaultwarden is enabled, other services can fetch their credentials from it automatically. Saving restarts OpenClaw to apply changes.',
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
      vaultwarden: vw?.enabled
        ? {
            selection: 'enabled' as const,
            value: {
              url: vw.url ?? '',
              email: vw.email ?? '',
              apiKey: '', // never echo secrets
              masterPassword: '',
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
              share: nas.share ?? '',
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

    const vaultwarden =
      i.vaultwarden.selection === 'enabled'
        ? {
            enabled: true,
            url: i.vaultwarden.value.url,
            email: i.vaultwarden.value.email,
            apiKey: i.vaultwarden.value.apiKey,
            masterPassword: i.vaultwarden.value.masterPassword,
          }
        : { enabled: false }

    const ollama =
      i.ollama.selection === 'enabled'
        ? { enabled: true, url: i.ollama.value.url }
        : { enabled: false }

    const nas =
      i.nas.selection === 'enabled'
        ? {
            enabled: true,
            host: i.nas.value.host,
            share: i.nas.value.share,
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

    // Preserve existing Vaultwarden secrets if the user left them blank on an
    // update (we never echo them into the form, so blank means "unchanged").
    if (vaultwarden.enabled) {
      const prev = await externalServicesJson
        .read()
        .once()
        .catch(() => undefined)
      const prevVw = prev?.vaultwarden
      if (!vaultwarden.apiKey && prevVw?.apiKey) {
        vaultwarden.apiKey = prevVw.apiKey
      }
      if (!vaultwarden.masterPassword && prevVw?.masterPassword) {
        vaultwarden.masterPassword = prevVw.masterPassword
      }
    }

    await externalServicesJson.write(effects, {
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
